import { KOIOS_BASE, type Net, state } from "./config";

// Koios is a free, community-run Cardano API. We reach it through a same-origin
// proxy (see config.ts), which means every visitor shares ONE upstream quota.
// So: cache generously, share in-flight requests, batch, and never poll in a hurry.

/** Thrown for any non-2xx answer, a timeout (status 408) or an unreadable body (status 502). */
export class KoiosError extends Error {
  status: number;
  constructor(status: number, message?: string) {
    super(message || `Koios ${status}`);
    this.name = "KoiosError";
    this.status = status;
  }
}

const TTL = 15_000;
const TIMEOUT = 20_000;
/** Public-tier limits: request bodies ≤ 1 kB, so bulk POSTs are split up. */
const MAX_BATCH = 12;
const MAX_BODY = 950;

const cache = new Map<string, { at: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

const clone = <T>(v: T): T => (typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v)));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function remember(key: string, data: unknown) {
  if (cache.size > 400) {
    // drop the oldest quarter; Map keeps insertion order
    let n = 100;
    for (const k of cache.keys()) {
      cache.delete(k);
      if (--n <= 0) break;
    }
  }
  cache.delete(key);
  cache.set(key, { at: Date.now(), data });
}

interface CallOpts {
  ttl?: number;
  /** Query another network than the selected one. */
  net?: Net;
  timeout?: number;
  /** Retry once on 429/5xx (default true). */
  retry?: boolean;
}

async function fetchOnce(method: string, url: string, body: string | undefined, timeout: number): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    return await fetch(url, {
      method,
      headers: { accept: "application/json", ...(body ? { "content-type": "application/json" } : {}) },
      body,
      signal: ctl.signal,
    });
  } catch (e) {
    if (ctl.signal.aborted) throw new KoiosError(408, "Koios timeout");
    throw e; // TypeError: offline / DNS / blocked
  } finally {
    clearTimeout(timer);
  }
}

async function request(method: string, url: string, body: string | undefined, o: CallOpts): Promise<unknown> {
  const timeout = o.timeout ?? TIMEOUT;
  for (let attempt = 0; ; attempt++) {
    const res = await fetchOnce(method, url, body, timeout);
    if (res.ok) {
      try {
        return await res.json();
      } catch {
        // e.g. the host answered with an HTML page because the proxy isn't configured
        throw new KoiosError(502, "Koios sent an unreadable answer");
      }
    }
    const busy = res.status === 429 || res.status >= 500;
    if (busy && attempt === 0 && o.retry !== false) {
      const ra = Number(res.headers.get("retry-after"));
      await sleep(ra > 0 && ra <= 5 ? ra * 1000 : (res.status === 429 ? 1500 : 700) + Math.random() * 500);
      continue;
    }
    const text = await res.text().catch(() => "");
    throw new KoiosError(res.status, `Koios ${res.status}${text ? ": " + text.slice(0, 200) : ""}`);
  }
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown, o: CallOpts = {}): Promise<T> {
  const url = KOIOS_BASE[o.net ?? state.network] + path;
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const key = `${method} ${url} ${payload ?? ""}`;
  const ttl = o.ttl ?? TTL;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return clone(hit.data) as T;

  let p = inflight.get(key);
  if (!p) {
    p = request(method, url, payload, o)
      .then((data) => (remember(key, data), data))
      .finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  // Every caller gets its own copy, so `.reverse()`/`.sort()` can't corrupt the cache.
  return clone(await p) as T;
}

export const kget = <T>(path: string, ttl?: number) => call<T>("GET", path, undefined, { ttl });
export const kpost = <T>(path: string, body: unknown, ttl?: number) => call<T>("POST", path, body, { ttl });

/**
 * POST a long id list in pieces that fit the public tier (≤ 12 ids and ≤ ~1 kB per
 * request), a few at a time, and concatenate the rows.
 */
async function bulk<T, I>(path: string, items: I[], body: (part: I[]) => unknown, o: CallOpts = {}): Promise<T[]> {
  const parts: I[][] = [];
  let cur: I[] = [];
  for (const it of items) {
    if (cur.length && (cur.length >= MAX_BATCH || JSON.stringify(body([...cur, it])).length > MAX_BODY)) {
      parts.push(cur);
      cur = [];
    }
    cur.push(it);
  }
  if (cur.length) parts.push(cur);
  const out: T[][] = new Array(parts.length);
  let next = 0;
  const worker = async () => {
    while (next < parts.length) {
      const i = next++;
      out[i] = await call<T[]>("POST", path, body(parts[i]), o);
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, parts.length) }, worker));
  return out.flat();
}

const uniq = <T>(a: T[]) => [...new Set(a)];
const q = encodeURIComponent;

// ---------- chain tip + the one shared block poller ----------

export interface Tip {
  hash: string;
  epoch_no: number;
  abs_slot: number;
  epoch_slot: number;
  block_height: number;
  block_time: number;
}

let lastTip: { net: Net; tip: Tip } | null = null;
const blockSubs = new Set<(tip: Tip) => void>();

function noteTip(net: Net, tip: Tip) {
  if (!tip || net !== state.network) return;
  const prev = lastTip && lastTip.net === net ? lastTip.tip : null;
  // Koios is several servers behind one name; a lagging one can answer with an older tip. Ignore those.
  if (prev && (tip.block_height < prev.block_height || tip.hash === prev.hash)) return;
  lastTip = { net, tip };
  for (const cb of [...blockSubs]) {
    try {
      cb(clone(tip));
    } catch (e) {
      console.error(e);
    }
  }
}

export const getTip = async (): Promise<Tip> => {
  const net = state.network;
  const [tip] = await call<Tip[]>("GET", "/tip", undefined, { ttl: 10_000 });
  if (!tip) throw new KoiosError(502, "Koios sent no tip");
  noteTip(net, tip);
  return tip;
};

const POLL_MS = 20_000;
let pollTimer: ReturnType<typeof setTimeout> | undefined;
let pollBusy = false;
let pollFails = 0;
let pollWired = false;

const hidden = () => typeof document !== "undefined" && document.hidden;

function schedule(delay: number) {
  clearTimeout(pollTimer);
  pollTimer = undefined;
  if (!blockSubs.size || hidden()) return;
  pollTimer = setTimeout(poll, delay);
}

async function poll() {
  pollTimer = undefined;
  if (pollBusy || !blockSubs.size || hidden()) return;
  pollBusy = true;
  try {
    await getTip(); // notifies subscribers through noteTip when the block is new
    pollFails = 0;
  } catch {
    pollFails = Math.min(pollFails + 1, 4);
  } finally {
    pollBusy = false;
    schedule(POLL_MS * 2 ** pollFails); // 20s, then 40s … 320s while Koios is unhappy
  }
}

function wirePoller() {
  if (pollWired || typeof document === "undefined") return;
  pollWired = true;
  document.addEventListener("visibilitychange", () => {
    if (hidden()) {
      clearTimeout(pollTimer);
      pollTimer = undefined;
    } else if (blockSubs.size) schedule(0); // back in view: check right away
  });
  window.addEventListener("network-changed", () => {
    lastTip = null;
    pollFails = 0;
    if (blockSubs.size) schedule(0);
  });
}

/**
 * Subscribe to new blocks. ONE shared `/tip` poll (every 20s, paused while the tab is
 * hidden) feeds every subscriber. `cb` is called right away with the last known tip if
 * there is one, then once per new block. Returns an unsubscribe function.
 */
export function onBlock(cb: (tip: Tip) => void): () => void {
  wirePoller();
  blockSubs.add(cb);
  const known = lastTip && lastTip.net === state.network ? lastTip.tip : null;
  if (known)
    queueMicrotask(() => {
      if (!blockSubs.has(cb)) return;
      try {
        cb(clone(known));
      } catch (e) {
        console.error(e);
      }
    });
  if (pollTimer === undefined && !pollBusy) schedule(known && Date.now() / 1000 - known.block_time < 20 ? POLL_MS : 0);
  return () => {
    blockSubs.delete(cb);
    if (!blockSubs.size) {
      clearTimeout(pollTimer);
      pollTimer = undefined;
    }
  };
}

// ---------- blocks ----------

export interface Block {
  hash: string;
  epoch_no: number;
  abs_slot: number;
  epoch_slot: number;
  block_height: number;
  block_size: number;
  block_time: number;
  tx_count: number;
  pool: string | null;
  parent_hash: string;
}
export const getLatestBlocks = (n: number) =>
  // Koios already returns newest first. Don't add `order=`: sorting the whole table is
  // slow, and null-height genesis blocks would sort to the top.
  kget<Block[]>(`/blocks?limit=${Math.max(1, Math.min(100, Math.floor(n) || 1))}`, 15_000);

export const getBlockTxs = (hashes: string[]) =>
  bulk<{ block_hash: string; tx_hash: string; block_height: number; block_time: number }, string>(
    "/block_txs",
    uniq(hashes),
    (part) => ({ _block_hashes: part }),
    { ttl: 60_000 },
  );

/**
 * Every transaction in the given blocks (amounts, fee, metadata) in one request per
 * 10 blocks. Much faster on mainnet than block_txs + tx_info in batches of 12.
 */
export const getBlockTxInfo = (blockHashes: string[]) =>
  bulk<TxInfo, string>(
    "/block_tx_info?select=tx_hash,block_hash,block_height,absolute_slot,tx_timestamp,total_output,fee,metadata",
    uniq(blockHashes).slice(0, 30),
    (part) => ({
      _block_hashes: part,
      _inputs: false,
      _metadata: true,
      _assets: false,
      _withdrawals: false,
      _certs: false,
      _scripts: false,
      _bytecode: false,
    }),
    { ttl: 60_000 },
  );

/** What a Cardano node said about a transaction we handed it. */
export type NodeVerdict =
  | { ok: true; hash: string }
  | { ok: false; code: number | null; message: string; detail: string };

/**
 * Hand a signed transaction straight to a Cardano node (Koios's Ogmios endpoint, JSON-RPC
 * `submitTransaction`). Used when the wallet's own submission fails: it either gets the
 * transaction through, or returns the node's actual reason instead of a wallet's generic text.
 * Network trouble throws (KoiosError / fetch errors); a node rejection is returned, not thrown.
 */
export async function submitViaNode(cborHex: string, net: Net = state.network): Promise<NodeVerdict> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const res = await fetch(`${KOIOS_BASE[net]}/ogmios`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "submitTransaction", params: { transaction: { cbor: cborHex } } }),
      signal: ctrl.signal,
    });
    let j: any = null;
    try {
      j = await res.json();
    } catch {
      /* not JSON */
    }
    const id = j?.result?.transaction?.id;
    if (typeof id === "string" && /^[0-9a-f]{64}$/.test(id)) return { ok: true, hash: id };
    if (j?.error) {
      const err = j.error;
      const data = err.data === undefined ? "" : typeof err.data === "string" ? err.data : JSON.stringify(err.data);
      return { ok: false, code: typeof err.code === "number" ? err.code : null, message: String(err.message ?? "rejected"), detail: data };
    }
    throw new KoiosError(res.status || 502, `Koios ${res.status}: unexpected submit response`);
  } finally {
    clearTimeout(timer);
  }
}

// ---------- transactions ----------

export interface TxInfo {
  tx_hash: string;
  block_hash: string;
  block_height: number;
  absolute_slot: number;
  /** UNIX seconds of the block the transaction is in. */
  tx_timestamp: number;
  total_output: string;
  fee: string;
  metadata: Record<string, any> | null;
}
export const getTxInfo = (hashes: string[], withMetadata = false) =>
  bulk<TxInfo, string>(
    "/tx_info",
    uniq(hashes),
    (part) => ({
      _tx_hashes: part,
      _inputs: false,
      _metadata: withMetadata,
      _assets: false,
      _withdrawals: false,
      _certs: false,
      _scripts: false,
      _bytecode: false,
    }),
    { ttl: 30_000 },
  );

export const getTxMetadata = (hashes: string[]) =>
  bulk<{ tx_hash: string; metadata: Record<string, any> | null }, string>(
    "/tx_metadata",
    uniq(hashes),
    (part) => ({ _tx_hashes: part }),
  );

/**
 * Where a transaction landed, or `undefined` while it isn't in a block yet. Never cached;
 * used by `trackTx` in ui.ts. `net` pins the network the transaction was sent on.
 */
export async function findTx(hash: string, net: Net = state.network) {
  const rows = await call<{ tx_hash: string; block_hash: string; block_height: number; tx_timestamp: number }[]>(
    "POST",
    "/tx_info?select=tx_hash,block_hash,block_height,tx_timestamp",
    { _tx_hashes: [hash], _inputs: false, _metadata: false, _assets: false, _withdrawals: false, _certs: false, _scripts: false, _bytecode: false },
    { ttl: 0, net },
  );
  return rows.find((r) => r.tx_hash === hash && r.block_height != null);
}

/** Pool (bech32 id) that made the block at `height`; `null` if unknown. */
export async function getBlockPool(height: number, blockHash?: string, net: Net = state.network): Promise<string | null> {
  const rows = await call<{ hash: string; pool: string | null }[]>(
    "GET",
    `/blocks?block_height=eq.${Math.floor(height)}&select=hash,pool`,
    undefined,
    { ttl: 3_600_000, net },
  );
  return (rows.find((r) => !blockHash || r.hash === blockHash) ?? null)?.pool ?? null;
}

/** Raw UTxO rows for refs of the form `<txhash>#<index>` (spent ones included). */
export const getUtxoInfo = (refs: string[], net?: Net, timeout?: number) =>
  bulk<{ tx_hash: string; tx_index: number; address: string; value: string; is_spent: boolean }, string>(
    "/utxo_info?select=tx_hash,tx_index,address,value,is_spent",
    uniq(refs),
    (part) => ({ _utxo_refs: part }),
    { ttl: 60_000, net, timeout, retry: timeout === undefined },
  );

// ---------- network totals / epochs ----------

export interface Totals {
  epoch_no: number;
  circulation: string;
  treasury: string;
  reward: string;
  supply: string;
  reserves: string;
}
export const getTotals = async () => (await kget<Totals[]>("/totals?order=epoch_no.desc&limit=1", 600_000))[0];

export interface EpochInfo {
  epoch_no: number;
  start_time: number;
  end_time: number;
  tx_count: number;
  blk_count: number;
  active_stake: string | null;
}
export const getEpochInfo = async (epoch: number) =>
  (await kget<EpochInfo[]>(`/epoch_info?_epoch_no=${Math.floor(epoch)}&_include_next_epoch=false`, 300_000))[0];

/** Protocol parameters of an epoch (fees, min-UTxO cost…). They only change at epoch boundaries. */
export const getEpochParams = async (epoch: number, net?: Net) =>
  (await call<Record<string, any>[]>("GET", `/epoch_params?_epoch_no=${Math.floor(epoch)}`, undefined, { ttl: 3_600_000, net }))[0];

// ---------- accounts / addresses ----------

export interface AccountInfo {
  stake_address: string;
  status: string;
  delegated_pool: string | null;
  delegated_drep: string | null;
  total_balance: string;
  utxo: string;
  rewards_available: string;
}
export const getAccountInfo = async (stake: string, ttl = 60_000, net?: Net) =>
  (await call<AccountInfo[]>("POST", "/account_info", { _stake_addresses: [stake] }, { ttl, net }))[0];

export const getAccountTxs = (stake: string, limit = 1000) =>
  kget<{ tx_hash: string; block_height: number; block_time: number }[]>(
    `/account_txs?_stake_address=${q(stake)}&order=block_height.desc&limit=${Math.floor(limit)}`,
    60_000,
  );

export const getAddressTxs = (addr: string, limit = 50) =>
  kpost<{ tx_hash: string; block_height: number; block_time: number }[]>(
    `/address_txs?order=block_height.desc&limit=${Math.floor(limit)}`,
    { _addresses: [addr] },
  );

export interface AccountAsset {
  policy_id: string;
  asset_name: string;
  fingerprint: string;
  quantity: string;
}
/** Every native token held by a stake account (up to 3,000). */
export async function getAccountAssets(stake: string): Promise<AccountAsset[]> {
  const out: AccountAsset[] = [];
  for (let page = 0; page < 3; page++) {
    const rows = await kpost<AccountAsset[]>(
      `/account_assets?select=policy_id,asset_name,fingerprint,quantity&limit=1000&offset=${page * 1000}`,
      { _stake_addresses: [stake] },
      30_000,
    );
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

// ---------- pools ----------

export interface PoolInfo {
  pool_id_bech32: string;
  meta_json: { name?: string; ticker?: string; homepage?: string; description?: string } | null;
  live_stake: string | null;
  live_delegators: number;
  live_saturation: number | null;
  block_count: number | null;
  margin: number | null;
  fixed_cost: string | null;
  pool_status: string;
}

// Pools are looked up one block at a time all over the app, in ever-changing combinations,
// so they are cached per pool rather than per request.
const POOL_TTL = 600_000;
const pools = new Map<string, { at: number; data: PoolInfo }>();

export async function getPoolInfo(ids: string[]): Promise<PoolInfo[]> {
  const net = state.network;
  const want = uniq(ids.filter(Boolean));
  const now = Date.now();
  const missing = want.filter((id) => !(now - (pools.get(`${net}:${id}`)?.at ?? 0) < POOL_TTL));
  if (missing.length) {
    const rows = await bulk<PoolInfo, string>("/pool_info", missing, (part) => ({ _pool_bech32_ids: part }), { ttl: POOL_TTL, net });
    for (const r of rows) pools.set(`${net}:${r.pool_id_bech32}`, { at: Date.now(), data: r });
    if (pools.size > 600) for (const [k, v] of pools) if (Date.now() - v.at > POOL_TTL) pools.delete(k);
  }
  return want.flatMap((id) => {
    const hit = pools.get(`${net}:${id}`);
    return hit ? [clone(hit.data)] : [];
  });
}

/**
 * Pool tickers only, for the many places that just label a block with its baker.
 * `pool_list` filtered with `in.(…)` answers in well under a second, where mainnet
 * `pool_info` for the same ~20 pools can take 10–40 s. Pools without metadata map to "".
 */
const tickers = new Map<string, { at: number; t: string }>();
export async function getPoolTickers(ids: (string | null | undefined)[]): Promise<Map<string, string>> {
  const net = state.network;
  const want = uniq(ids.filter((x): x is string => typeof x === "string" && /^pool1[0-9a-z]{50,60}$/.test(x)));
  const now = Date.now();
  const missing = want.filter((id) => !(now - (tickers.get(`${net}:${id}`)?.at ?? 0) < POOL_TTL));
  for (let i = 0; i < missing.length; i += 40) {
    const part = missing.slice(i, i + 40);
    const rows = await kget<{ pool_id_bech32: string; ticker: string | null }[]>(
      `/pool_list?pool_id_bech32=in.(${part.join(",")})&select=pool_id_bech32,ticker`,
      POOL_TTL,
    );
    const at = Date.now();
    for (const id of part) tickers.set(`${net}:${id}`, { at, t: "" });
    for (const r of rows ?? []) if (r && typeof r.pool_id_bech32 === "string") tickers.set(`${net}:${r.pool_id_bech32}`, { at, t: typeof r.ticker === "string" ? r.ticker : "" });
  }
  return new Map(want.map((id) => [id, tickers.get(`${net}:${id}`)?.t ?? ""]));
}

// ---------- governance ----------

export interface Proposal {
  proposal_id: string;
  proposal_tx_hash: string;
  proposal_type: string;
  proposed_epoch: number;
  ratified_epoch: number | null;
  enacted_epoch: number | null;
  dropped_epoch: number | null;
  expired_epoch: number | null;
  expiration: number | null;
  deposit: string;
  meta_json: any;
  withdrawal: { stake_address: string; amount: string }[] | { stake_address: string; amount: string } | null;
  block_time: number;
}
export const getProposals = () =>
  kget<Proposal[]>("/proposal_list?order=block_time.desc&limit=40", 300_000);

export interface DrepInfo {
  drep_id: string;
  registered: boolean;
  active: boolean;
  amount: string;
  expires_epoch_no: number | null;
  meta_url: string | null;
}
export const getDrepList = () =>
  kget<{ drep_id: string; registered: boolean }[]>("/drep_list?registered=eq.true&limit=1000", 900_000);
export const getDrepInfo = (ids: string[]) =>
  bulk<DrepInfo, string>("/drep_info", uniq(ids), (part) => ({ _drep_ids: part }), { ttl: 300_000 });
export const getDrepMetadata = (ids: string[]) =>
  bulk<{ drep_id: string; meta_json: any }, string>("/drep_metadata", uniq(ids), (part) => ({ _drep_ids: part }), { ttl: 600_000 });

// ---------- native tokens ----------

export interface AssetInfo {
  policy_id: string;
  asset_name: string;
  fingerprint: string;
  total_supply: string;
  minting_tx_hash: string;
  minting_tx_metadata: Record<string, any> | null;
  creation_time: number;
}
/** `list` is `[policyId, assetNameHex][]`. Assets that don't exist are simply missing from the answer. */
export const getAssetInfo = (list: [string, string][], ttl = 30_000) =>
  bulk<AssetInfo, [string, string]>("/asset_info", list, (part) => ({ _asset_list: part }), { ttl });

export const getAssetAddresses = (policy: string, nameHex: string) =>
  kget<{ payment_address: string; quantity: string }[]>(
    `/asset_addresses?_asset_policy=${q(policy)}&_asset_name=${q(nameHex)}`,
    30_000,
  );

export interface AssetHistory {
  policy_id: string;
  asset_name: string;
  fingerprint: string;
  minting_txs: { tx_hash: string; block_time: number; quantity: string; metadata: any }[];
}
/** Mint/burn history of one asset, as Koios returns it (usually one row). */
export const getAssetHistory = (policy: string, nameHex: string) =>
  kget<AssetHistory[]>(`/asset_history?_asset_policy=${q(policy)}&_asset_name=${q(nameHex)}`, 60_000);

// ---------- time ----------

/** Absolute slot for a UNIX time (seconds), including mainnet's 20-second Byron slots. */
export function slotAt(unixSeconds: number, net: Net = state.network): number {
  const t = Math.floor(unixSeconds);
  switch (net) {
    case "mainnet":
      return t >= 1596059091 ? t - 1596059091 + 4492800 : Math.ceil((t - 1506203091) / 20);
    case "preprod":
      return t - 1655769600 + 86400;
    case "preview":
      return t - 1666656000;
  }
}

/**
 * First block produced at or after a UNIX timestamp (seconds).
 * Filtering on a slot range is indexed and fast. Filtering on block_time is not
 * (it takes ~25 s on mainnet).
 */
export const getFirstBlockAfter = async (unixSeconds: number): Promise<Block | undefined> => {
  const s = slotAt(unixSeconds);
  // The past never changes, so those answers can be kept for the whole visit.
  const past = unixSeconds < Date.now() / 1000 - 7200;
  return (
    await kget<Block[]>(`/blocks?abs_slot=gte.${s}&abs_slot=lt.${s + 3600}&order=abs_slot.asc&limit=1`, past ? 86_400_000 : 60_000)
  )[0];
};
