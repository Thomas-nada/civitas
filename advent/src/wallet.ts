import { APP_ID, CAL_YEAR, type Net, setNetwork, state, store } from "./config";
import { getAccountInfo, getAssetAddresses, findTx, getAssetInfo, getEpochParams, getTip, getUtxoInfo, type NodeVerdict, slotAt, submitViaNode, type Tip } from "./koios";
import { WalletError, utf8Hex } from "./ui";

// Mesh SDK is big, so it's only loaded when someone actually connects a wallet.
type Mesh = typeof import("@meshsdk/core");
let meshPromise: Promise<Mesh> | null = null;
export function loadMesh(): Promise<Mesh> {
  if (!meshPromise) {
    meshPromise = import("@meshsdk/core").catch((e) => {
      meshPromise = null; // don't cache the failure: the next try may work
      console.error(e);
      throw new Error("Couldn't load the wallet tools. Please reload the page.");
    });
  }
  return meshPromise;
}

export interface ConnectedWallet {
  id: string;
  name: string;
  icon: string;
  bw: any; // Mesh BrowserWallet
  /** CIP-30 network id: 1 = mainnet, 0 = any testnet. */
  networkId: number;
  /** The actual network, worked out at connect time (CIP-30 can't tell preprod from preview). */
  network: Net;
  changeAddress: string;
  rewardAddress: string | null;
}

export let wallet: ConnectedWallet | null = null;

const emit = () => window.dispatchEvent(new CustomEvent("wallet-changed"));
const cardano = (): Record<string, any> => (window as any).cardano ?? {};
const safeIcon = (i: unknown) => (typeof i === "string" && /^(data:image\/|https:\/\/)/i.test(i) ? i : "");

/** CIP-30 wallets inject themselves into window.cardano. Some inject twice under aliases. */
export function installedWallets(): { id: string; name: string; icon: string }[] {
  const c = cardano();
  const seen = new Set<string>();
  const out: { id: string; name: string; icon: string }[] = [];
  for (const id of Object.keys(c)) {
    try {
      const w = c[id];
      if (!w || typeof w.enable !== "function" || typeof w.name !== "string" || !w.name || seen.has(w.name)) continue;
      seen.add(w.name);
      out.push({ id, name: w.name, icon: safeIcon(w.icon) });
    } catch {
      /* a misbehaving extension: skip it */
    }
  }
  return out;
}

// ---------------- connecting + keeping in step with the wallet ----------------

interface Snapshot {
  networkId: number;
  changeAddress: string;
  /** `undefined` = the wallet wouldn't say (don't treat that as "changed"). */
  rewardAddress: string | null | undefined;
}

async function snapshot(bw: any): Promise<Snapshot> {
  const [networkId, changeAddress, rewards] = await Promise.all([
    bw.getNetworkId(),
    bw.getChangeAddress(),
    bw.getRewardAddresses().catch(() => undefined) as Promise<string[] | undefined>,
  ]);
  return { networkId: Number(networkId), changeAddress, rewardAddress: rewards ? (rewards[0] ?? null) : undefined };
}

const refOf = (u: any) => `${u.input.txHash}#${u.input.outputIndex}`;
/** UTxOs Koios has confirmed on a network this session, as `<net>|<txhash>#<index>`. */
const seenRefs = new Set<string>();

/**
 * CIP-30 says 0 for both testnets, but their slot numbers are ~11 million apart, so we must
 * know which one it is. Ask Koios which testnet knows one of the wallet's UTxOs.
 */
async function findTestnet(utxos: any[]): Promise<Net | null> {
  const refs = utxos.slice(0, 3).map(refOf);
  const order: Net[] = state.network === "preview" ? ["preview", "preprod"] : ["preprod", "preview"];
  for (const net of order) {
    try {
      const rows = await getUtxoInfo(refs, net, 8_000);
      if (rows.length) {
        for (const r of rows) seenRefs.add(`${net}|${r.tx_hash}#${r.tx_index}`);
        return net;
      }
    } catch (e) {
      console.warn(`Couldn't ask ${net} about this wallet:`, e);
    }
  }
  return null;
}

async function alignNetwork(bw: any, snap: Snapshot): Promise<Net> {
  if (snap.networkId === 1) return "mainnet";
  const fallback: Net = state.network !== "mainnet" ? state.network : "preprod";
  let utxos: any[] = [];
  try {
    utxos = (await bw.getUtxos()) ?? [];
  } catch {
    /* treat as empty */
  }
  if (!utxos.length) return fallback; // empty testnet wallet: nothing to look up
  const found = await findTestnet(utxos);
  if (found) return found;
  // Koios couldn't say (brand-new coins, or it is down). Use what we saw last time for this wallet.
  const last = store.get<unknown>(`wnet:${snap.rewardAddress ?? snap.changeAddress}`, null);
  return last === "preprod" || last === "preview" ? last : fallback;
}

/** Make `w` (with fresh details) the connected wallet, switch the app to its network, tell everyone. */
function adopt(w: ConnectedWallet) {
  wallet = w;
  if (w.network !== "mainnet") store.set(`wnet:${w.rewardAddress ?? w.changeAddress}`, w.network);
  setNetwork(w.network); // fires `network-changed` only if it really changes
  emit();
}

let connectSeq = 0;

/**
 * Connect a CIP-30 wallet. Also points the app at the wallet's network: a mainnet wallet
 * selects mainnet; a testnet wallet selects preprod or preview, whichever it is really on.
 */
export async function connect(id: string): Promise<ConnectedWallet> {
  const seq = ++connectSeq;
  const M = await loadMesh();
  let bw: any;
  try {
    bw = await M.BrowserWallet.enable(id);
  } catch (e) {
    throw new WalletError("enable", e);
  }
  let snap: Snapshot;
  try {
    snap = await snapshot(bw);
  } catch (e) {
    throw new WalletError("read", e);
  }
  const network = await alignNetwork(bw, snap);
  const meta = cardano()[id] ?? {};
  const w: ConnectedWallet = {
    id,
    name: typeof meta.name === "string" && meta.name ? meta.name : id,
    icon: safeIcon(meta.icon),
    bw,
    networkId: snap.networkId,
    network,
    changeAddress: snap.changeAddress,
    rewardAddress: snap.rewardAddress ?? null,
  };
  if (seq !== connectSeq) return w; // a newer connect/disconnect happened meanwhile; leave that one in charge
  store.set("wallet", id);
  adopt(w);
  return w;
}

export function disconnect() {
  connectSeq++;
  wallet = null;
  store.set("wallet", null);
  emit();
}

/** Silently reconnect if the user already approved this site in their wallet. */
export async function tryReconnect() {
  const id = store.get<string | null>("wallet", null);
  if (!id || typeof id !== "string") return;
  // extensions inject a moment after page load
  for (let i = 0; i < 10 && !cardano()[id]; i++) await new Promise((r) => setTimeout(r, 200));
  const ext = cardano()[id];
  try {
    if (!ext || typeof ext.isEnabled !== "function") return;
    const enabled = await Promise.race([ext.isEnabled(), new Promise<boolean>((r) => setTimeout(() => r(false), 4000))]);
    if (enabled && !wallet) await connect(id);
  } catch {
    /* ignore: the visitor can always connect by hand */
  }
}

const SWITCHED = "Your wallet changed account or network, so we caught up with it. Please check and try again.";

/** The wallet reports a different account or network than the one we connected: follow it. */
async function follow(w: ConnectedWallet, snap: Snapshot, net?: Net) {
  const network = net ?? (await alignNetwork(w.bw, snap));
  if (wallet !== w) return;
  adopt({
    ...w,
    networkId: snap.networkId,
    network,
    changeAddress: snap.changeAddress,
    rewardAddress: snap.rewardAddress === undefined ? w.rewardAddress : snap.rewardAddress,
  });
}

const moved = (w: ConnectedWallet, snap: Snapshot) =>
  snap.networkId !== w.networkId || (snap.rewardAddress !== undefined && snap.rewardAddress !== w.rewardAddress);

/**
 * Re-read the wallet right before building a transaction. Wallets let people switch account
 * or network without telling the page, and some hand out a new change address every time.
 */
async function fresh(): Promise<{ w: ConnectedWallet; utxos: any[] }> {
  const w = requireWallet();
  let snap: Snapshot;
  let utxos: any[];
  try {
    snap = await snapshot(w.bw);
    utxos = (await w.bw.getUtxos()) ?? [];
  } catch (e) {
    throw new WalletError("read", e);
  }
  if (wallet !== w) throw new Error(SWITCHED);
  if (moved(w, snap)) {
    await follow(w, snap);
    throw new Error(SWITCHED); // what the door prepared was for the other account: start over
  }
  w.changeAddress = snap.changeAddress; // a rotated change address is normal; no need to tell anyone
  // Same account, but did the wallet hop between preprod and preview? Only Koios can tell.
  if (w.network !== "mainnet" && utxos.length && !utxos.some((u) => seenRefs.has(`${w.network}|${refOf(u)}`))) {
    const found = await findTestnet(utxos);
    if (found && found !== w.network) {
      await follow(w, snap, found);
      throw new Error(SWITCHED);
    }
  }
  return { w, utxos };
}

// When the visitor comes back to the tab (e.g. from the wallet's own window), check for a switch.
let lastLook = 0;
async function lookAgain() {
  const w = wallet;
  if (!w || document.hidden || Date.now() - lastLook < 5_000) return;
  lastLook = Date.now();
  try {
    const snap = await snapshot(w.bw);
    if (wallet === w && moved(w, snap)) await follow(w, snap);
  } catch {
    /* locked or busy wallet: leave things as they are */
  }
}
if (typeof window !== "undefined") {
  window.addEventListener("focus", lookAgain);
  document.addEventListener("visibilitychange", lookAgain);
}

export function networkMismatch(): string | null {
  if (!wallet || wallet.network === state.network) return null;
  const name = (n: Net) => (n === "mainnet" ? "mainnet" : `the ${n} testnet`);
  return `Your wallet is on ${name(wallet.network)} but the calendar is showing ${name(state.network)}. Switch the calendar back to ${wallet.network} to use your wallet.`;
}

export function requireWallet(): ConnectedWallet {
  if (!wallet) throw new Error("Connect a wallet first.");
  const mm = networkMismatch();
  if (mm) throw new Error(mm);
  return wallet;
}

/** Stable id for the connected wallet: its stake address, else its change address. "" if none. */
export function walletId(): string {
  return wallet ? (wallet.rewardAddress ?? wallet.changeAddress) : "";
}

const keyFor = (w: ConnectedWallet, k: string) => `${w.network}:${CAL_YEAR}:${w.rewardAddress ?? w.changeAddress}:${k}`;

/** Per-network, per-year, per-wallet localStorage key, for anything personal (wish, letters, signature…). */
export const wkey = (k: string) => `${state.network}:${CAL_YEAR}:${walletId()}:${k}`;

// ---------------- addresses ----------------

const addrPrefix = (net: Net) => (net === "mainnet" ? "addr1" : "addr_test1");
const BAD_ADDRESS = "That address isn't valid. Double-check it and try again.";

/** Parse a payment address for the current network, or throw a friendly Error. */
function parseAddress(M: Mesh, addr: string, net: Net = state.network) {
  const a = String(addr ?? "").trim();
  if (!a) throw new Error("Please enter an address.");
  if (/^stake/i.test(a)) throw new Error("That's a staking address. Please use the receiving address (it starts with addr).");
  const want = addrPrefix(net);
  if (!a.startsWith(want)) {
    if (/^addr(_test)?1/.test(a))
      throw new Error(`That address is for ${net === "mainnet" ? "a testnet" : "mainnet"}. Here it should start with ${want}.`);
    throw new Error(BAD_ADDRESS);
  }
  try {
    const d = M.deserializeAddress(a);
    return { address: a, pubKeyHash: d.pubKeyHash ?? "", scriptHash: d.scriptHash ?? "" };
  } catch {
    throw new Error(BAD_ADDRESS);
  }
}

/**
 * Throws a friendly Error unless `addr` is a valid address for the current network that
 * belongs to a person's key (not a smart contract, where a plain payment could get stuck).
 */
export async function assertKeyAddress(addr: string): Promise<void> {
  const d = parseAddress(await loadMesh(), addr);
  if (!d.pubKeyHash || d.scriptHash)
    throw new Error("That address belongs to a smart contract, not a personal wallet. Ask your friend for their wallet address.");
}

const HANDLE_POLICY = "f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a";

/** Resolve an ADA Handle like `$santa` to the address holding it. Mainnet only. */
export async function resolveHandle(handle: string): Promise<string> {
  const h = String(handle ?? "").trim().toLowerCase();
  if (state.network !== "mainnet") throw new Error("Handles like $name only work on mainnet. Paste an address instead.");
  if (h.includes("@")) throw new Error("Sub-handles (the ones with an @) aren't supported here. Paste the address instead.");
  if (!/^\$[a-z0-9_.-]{1,15}$/.test(h))
    throw new Error("That doesn't look like a handle. A handle is $ followed by up to 15 letters, numbers, dots, dashes or underscores.");
  const name = utf8Hex(h.slice(1));
  // Newer handles (CIP-68) carry a 000de140 prefix; older ones are the bare name.
  for (const assetName of ["000de140" + name, name]) {
    const holders = await getAssetAddresses(HANDLE_POLICY, assetName); // network trouble surfaces as an error
    if (!holders.length) continue;
    if (holders.length !== 1 || String(holders[0].quantity) !== "1")
      throw new Error(`We couldn't safely look up ${h}. Paste the address instead.`);
    let d: ReturnType<typeof parseAddress>;
    try {
      d = parseAddress(await loadMesh(), holders[0].payment_address, "mainnet");
    } catch {
      throw new Error(`We couldn't safely look up ${h}. Paste the address instead.`);
    }
    if (!d.pubKeyHash || d.scriptHash)
      throw new Error(`${h} is held by a smart contract right now (maybe it's listed for sale), so we can't send to it. Paste an address instead.`);
    return d.address;
  }
  throw new Error(`Couldn't find the handle ${h}. Check the spelling.`);
}

// ---------------- the ornament policy ----------------

const LOCK_MS = Date.UTC(CAL_YEAR, 11, 26);
const KEY_RX = /^[0-9a-f]{56}$/;
const MAX_CANDIDATES = 60;
const STAR_HEX = utf8Hex(`ChristmasStar${CAL_YEAR}`);

/** The mint window. No wallet needed; "now" comes from the chain tip, not this computer's clock. */
export async function mintWindow(): Promise<{ lockMs: number; lockSlot: number; nowSlot: number; locked: boolean }> {
  const net = state.network;
  const lockSlot = slotAt(LOCK_MS / 1000, net);
  const tip = await getTip();
  return { lockMs: LOCK_MS, lockSlot, nowSlot: tip.abs_slot, locked: tip.abs_slot >= lockSlot };
}

type Policy = {
  script: string;
  policyId: string;
  keyHash: string;
  lockSlot: number;
  lockMs: number;
  nativeScript: { type: "all"; scripts: [{ type: "sig"; keyHash: string }, { type: "before"; slot: string }] };
};
const policies = new Map<string, Policy>();

function policyFor(M: Mesh, keyHash: string, net: Net): Policy {
  const id = `${net}:${keyHash}`;
  let p = policies.get(id);
  if (!p) {
    const lockSlot = slotAt(LOCK_MS / 1000, net);
    const nativeScript: Policy["nativeScript"] = {
      type: "all",
      scripts: [
        { type: "sig", keyHash },
        { type: "before", slot: String(lockSlot) },
      ],
    };
    const script = M.ForgeScript.fromNativeScript(nativeScript);
    p = { script, policyId: M.resolveScriptHash(script), keyHash, lockSlot, lockMs: LOCK_MS, nativeScript };
    policies.set(id, p);
  }
  return p;
}

const readPin = (w: ConnectedWallet) => {
  const v = store.get<unknown>(keyFor(w, "ornament-key"), null);
  return typeof v === "string" && KEY_RX.test(v) ? v : null;
};

const unitsIn = (utxos: any[]) => {
  const units = new Set<string>();
  for (const u of utxos) for (const a of u?.output?.amount ?? []) if (a.unit !== "lovelace" && a.unit !== "" && BigInt(a.quantity) > 0n) units.add(a.unit);
  return [...units];
};

/**
 * Every payment key this wallet might have used for its policy, most stable first:
 * used addresses, then unused ones, then the change address, then wherever its coins sit.
 */
async function candidateKeys(w: ConnectedWallet, M: Mesh, utxos: any[]): Promise<string[]> {
  const list = (p: Promise<string[]>) => p.then((a) => (Array.isArray(a) ? a : [])).catch(() => [] as string[]);
  const [used, unused] = await Promise.all([list(w.bw.getUsedAddresses()), list(w.bw.getUnusedAddresses())]);
  const keys = new Set<string>();
  for (const a of [...used, ...unused, w.changeAddress, ...utxos.map((u) => u?.output?.address)]) {
    if (keys.size >= MAX_CANDIDATES) break;
    if (typeof a !== "string" || !/^addr(_test)?1/.test(a)) continue;
    try {
      const d = M.deserializeAddress(a);
      if (d.pubKeyHash && !d.scriptHash) keys.add(d.pubKeyHash); // a key, not a script
    } catch {
      /* not an address we understand */
    }
  }
  return [...keys];
}

/**
 * Work out which policy is this wallet's. If the wallet already holds tokens under one of
 * its candidate policies, that one wins (and gets pinned); otherwise the pinned key, or
 * failing that the first candidate, is pinned.
 */
async function discover(w: ConnectedWallet, known?: any[]): Promise<{ pol: Policy; units: string[] }> {
  const M = await loadMesh();
  let utxos = known;
  if (!utxos) {
    try {
      utxos = (await w.bw.getUtxos()) ?? [];
    } catch (e) {
      throw new WalletError("read", e);
    }
  }
  const pin = readPin(w);
  const keys = await candidateKeys(w, M, utxos!);
  const order = pin ? [pin, ...keys.filter((k) => k !== pin)] : keys;
  if (!order.length)
    throw new Error("This wallet's address belongs to a smart contract, so it can't make ornaments. Try a regular wallet.");
  const held = unitsIn(utxos!);
  let pol = policyFor(M, order[0], w.network);
  let units: string[] = [];
  if (held.length) {
    for (const k of order) {
      const p = policyFor(M, k, w.network);
      const mine = held.filter((u) => u.startsWith(p.policyId));
      if (mine.length) {
        pol = p;
        units = mine;
        break;
      }
    }
  }
  if (pol.keyHash !== pin) store.set(keyFor(w, "ornament-key"), pol.keyHash);
  return { pol, units };
}

/**
 * Every visitor gets their own ornament policy: a native script that needs
 * *their* signature and only works before Dec 26. After that nobody — not
 * even them — can mint under it again, so the ornaments are a true limited edition.
 *
 * The key is chosen once (first used address, else first unused, else the change address)
 * and then pinned in this browser, so wallets that rotate addresses keep the same policy.
 */
export async function ornamentPolicy(w: ConnectedWallet): Promise<Policy> {
  const M = await loadMesh();
  const pin = readPin(w);
  return pin ? policyFor(M, pin, w.network) : (await discover(w)).pol;
}

/**
 * The ornaments this wallet holds: units (policyId + hex name) under its ornament policy.
 * Tries every candidate key, so it still finds them when the wallet rotated addresses or
 * the pin is missing (new browser). `ornaments` leaves out the Christmas Star; `star` is
 * its unit if held. With nothing held: the pinned/default policy and an empty list.
 */
export async function findOrnaments(
  w: ConnectedWallet,
): Promise<{ policyId: string; keyHash: string; ornaments: string[]; star: string | null }> {
  const { pol, units } = await discover(w);
  const starUnit = pol.policyId + STAR_HEX;
  return {
    policyId: pol.policyId,
    keyHash: pol.keyHash,
    ornaments: units.filter((u) => u !== starUnit),
    star: units.includes(starUnit) ? starUnit : null,
  };
}

// ---------------- transactions ----------------

/** Chain tip (for the time limit) and current protocol parameters (fees, min-UTxO cost…) in Mesh's format. */
async function chainNow(M: Mesh): Promise<{ tip: Tip; params: any }> {
  const tip = await getTip(); // no tip, no transaction: we can't set a safe time limit without it
  let params: any;
  try {
    const p = await getEpochParams(tip.epoch_no);
    if (p && p.min_fee_a != null && p.coins_per_utxo_size != null)
      params = M.castProtocol({
        coinsPerUtxoSize: p.coins_per_utxo_size,
        collateralPercent: p.collateral_percent,
        decentralisation: p.decentralisation,
        epoch: p.epoch_no,
        keyDeposit: p.key_deposit,
        maxBlockExMem: String(p.max_block_ex_mem),
        maxBlockExSteps: String(p.max_block_ex_steps),
        maxBlockHeaderSize: p.max_bh_size,
        maxBlockSize: p.max_block_size,
        maxCollateralInputs: p.max_collateral_inputs,
        maxTxExMem: String(p.max_tx_ex_mem),
        maxTxExSteps: String(p.max_tx_ex_steps),
        maxTxSize: p.max_tx_size,
        maxValSize: p.max_val_size,
        minFeeA: p.min_fee_a,
        minFeeB: p.min_fee_b,
        minPoolCost: p.min_pool_cost,
        poolDeposit: p.pool_deposit,
        priceMem: p.price_mem,
        priceStep: p.price_step,
      });
  } catch (e) {
    console.warn("Using Mesh default protocol parameters:", e);
  }
  return { tip, params };
}

/** How long a transaction stays valid: about an hour of slots past the chain tip. */
const TTL_SLOTS = 3600;

/** Coins the builder can spend: only those at ordinary key addresses (Mesh refuses the rest). */
function spendable(M: Mesh, utxos: any[]): any[] {
  const ok = new Map<string, boolean>();
  return utxos.filter((u) => {
    const a = u?.output?.address;
    if (typeof a !== "string") return false;
    let v = ok.get(a);
    if (v === undefined) {
      try {
        v = /^addr/.test(a) && !!M.deserializeAddress(a).pubKeyHash;
      } catch {
        v = false;
      }
      ok.set(a, v);
    }
    return v;
  });
}

async function finish(M: Mesh, tx: any, w: ConnectedWallet, utxos: any[]): Promise<string> {
  let unsigned: string;
  try {
    const coins = spendable(M, utxos);
    if (!coins.length) throw new Error("UTxO Balance Insufficient"); // empty wallet → the usual "not enough ADA" message
    unsigned = await tx.changeAddress(w.changeAddress).selectUtxosFrom(coins).complete();
  } catch (e) {
    throw new WalletError("build", e);
  }
  let signed: string;
  try {
    signed = await w.bw.signTx(unsigned, false);
  } catch (e) {
    throw new WalletError("sign", e);
  }
  try {
    return String(await w.bw.submitTx(signed));
  } catch (walletErr) {
    // Wallets often hide the node's reason behind a generic sentence, and some relay through
    // a backend that can be down. Hand the same signed transaction to a node ourselves: it
    // either goes through, or we learn the real reason.
    console.error("[advent] wallet submit failed; trying a node directly", walletErr, "\nsigned tx:", signed);
    let verdict: NodeVerdict;
    try {
      verdict = await submitViaNode(signed, w.network);
    } catch (netErr) {
      console.error("[advent] direct submit unavailable", netErr);
      throw new WalletError("submit", walletErr);
    }
    if (verdict.ok) return verdict.hash;
    // "Inputs are spent / probably already included" is ambiguous: the wallet's own attempt
    // may have reached the network after all, or the coins went elsewhere. Watch the chain
    // for this exact transaction for about a minute before deciding.
    if (/already (been )?included|already in (the )?mempool|known transaction|inputs are spent/i.test(`${verdict.message} ${verdict.detail}`)) {
      const hash = String(M.resolveTxHash(signed));
      for (let i = 0; i < 7; i++) {
        await new Promise((r) => setTimeout(r, 10_000));
        if (await findTx(hash, w.network).catch(() => undefined)) return hash;
      }
    }
    console.error("[advent] node rejected the transaction", verdict);
    throw new WalletError("submit", { code: verdict.code ?? undefined, info: `${verdict.message} ${verdict.detail}`.trim() });
  }
}

const DIGITS = /^\d{1,20}$/;

/**
 * Send a small transaction carrying metadata.
 *  - no `to`: nothing is sent anywhere; your coins come straight back as change, so it costs only the fee (~0.17 ADA).
 *  - `to` + `lovelace`: a payment with the metadata attached.
 *  - `assets`: tokens to include; if `lovelace` is left out, the minimum ADA a token must travel with is added.
 * Every transaction is valid for about an hour (by the chain's clock) and then expires.
 */
export async function sendWithMetadata(
  metadata: Record<number, object>,
  opts: { to?: string; lovelace?: string; assets?: { unit: string; quantity: string }[] } = {},
): Promise<string> {
  const { w, utxos } = await fresh();
  const M = await loadMesh();
  const { tip, params } = await chainNow(M);
  const tx = new M.MeshTxBuilder({ params });

  const assets = (opts.assets ?? []).filter((a) => a && a.quantity !== "0");
  const lovelace = opts.lovelace != null && opts.lovelace !== "" ? String(opts.lovelace) : null;
  if (opts.to != null || lovelace || assets.length) {
    const to = opts.to != null ? parseAddress(M, opts.to, w.network).address : w.changeAddress;
    if (lovelace && (!DIGITS.test(lovelace) || BigInt(lovelace) <= 0n)) throw new Error("That amount doesn't look right. Please enter a number.");
    for (const a of assets) {
      if (!/^[0-9a-f]{56,120}$/.test(a.unit) || !DIGITS.test(String(a.quantity))) throw new Error("That item can't be sent. Please pick it again.");
      const have = utxos.reduce((n: bigint, u: any) => n + BigInt(u.output.amount.find((x: any) => x.unit === a.unit)?.quantity ?? 0), 0n);
      if (have < BigInt(a.quantity)) throw new Error("That item isn't in your wallet (any more). Give it a minute if you only just received it.");
    }
    const amount = [
      ...(lovelace ? [{ unit: "lovelace", quantity: lovelace }] : []),
      ...assets.map((a) => ({ unit: a.unit, quantity: String(a.quantity) })),
    ];
    if (lovelace) {
      // Every output must carry a minimum of ADA; the network rejects smaller ones only at submit time.
      let min = 0n;
      try {
        min = BigInt(tx.calculateMinLovelaceForOutput({ address: to, amount }));
      } catch {
        /* can't tell: let the network decide */
      }
      if (BigInt(lovelace) < min)
        throw new Error(`That's below the smallest amount the network allows here. Please send at least ${(Math.ceil(Number(min) / 1e4) / 100).toFixed(2)} ADA.`);
    }
    tx.txOut(to, amount); // with no lovelace given, Mesh adds the minimum ADA itself
  }
  for (const [label, value] of Object.entries(metadata)) tx.metadataValue(Number(label), value);
  tx.invalidHereafter(tip.abs_slot + TTL_SLOTS);
  return finish(M, tx, w, utxos);
}

// ---------------- staking and vote delegation ----------------

const POOL_RX = /^pool1[02-9ac-hj-np-z]{50,60}$/;
// CIP-129 ids are 58 characters, older CIP-105 ones 56
const DREP_RX = /^drep1[02-9ac-hj-np-z]{51,53}$/;

export interface StakeStatus {
  registered: boolean;
  pool: string | null;
  drep: string | null;
  /** Refundable deposit (lovelace) the first registration locks; 0 once registered. */
  deposit: bigint;
}

/** Where this wallet's stake and vote point now, and what a first registration would cost. */
export async function stakeStatus(w: ConnectedWallet = requireWallet()): Promise<StakeStatus> {
  if (!w.rewardAddress) throw new Error("This wallet has no staking address, so it can't stake or pick a DRep.");
  const [acct, tip] = await Promise.all([getAccountInfo(w.rewardAddress, 0, w.network), getTip()]);
  const registered = acct?.status === "registered";
  let deposit = 0n;
  if (!registered) {
    const p = await getEpochParams(tip.epoch_no).catch(() => null);
    deposit = BigInt(String(p?.key_deposit ?? "2000000"));
  }
  const s = (v: unknown) => (typeof v === "string" && v ? v : null);
  return { registered, pool: s(acct?.delegated_pool), drep: s(acct?.delegated_drep), deposit };
}

/**
 * Point the wallet's stake at a pool and/or its vote at a DRep, in one transaction. Registers the
 * stake key first if it never was (that locks a refundable deposit). ADA never leaves the wallet.
 */
export async function delegate(to: { pool?: string; drep?: string }): Promise<{ txHash: string; deposit: bigint }> {
  const pool = to.pool?.trim(), drep = to.drep?.trim();
  if (!pool && !drep) throw new Error("Nothing to delegate to.");
  if (pool && !POOL_RX.test(pool)) throw new Error("That pool ID doesn't look right.");
  if (drep && !DREP_RX.test(drep)) throw new Error("That DRep ID doesn't look right.");

  const { w, utxos } = await fresh();
  const reward = w.rewardAddress;
  if (!reward) throw new Error("This wallet has no staking address, so it can't stake or pick a DRep.");
  const M = await loadMesh();
  const [st, { tip, params }] = await Promise.all([stakeStatus(w), chainNow(M)]);
  if (pool && st.pool === pool && (!drep || st.drep === drep)) throw new Error("You're already staking with this pool.");
  if (drep && st.drep === drep && !pool) throw new Error("This DRep already votes for you.");

  const tx = new M.MeshTxBuilder({ params });
  if (!st.registered) tx.registerStakeCertificate(reward);
  if (pool && st.pool !== pool) tx.delegateStakeCertificate(reward, pool);
  if (drep && st.drep !== drep) tx.voteDelegationCertificate({ dRepId: drep }, reward);
  tx.invalidHereafter(tip.abs_slot + TTL_SLOTS);
  return { txHash: await finish(M, tx, w, utxos), deposit: st.deposit };
}

const ALREADY = "You've already minted this one.";

/**
 * Mint one NFT under the wallet's ornament policy, with CIP-25 metadata. Refuses (friendly
 * Error) if that token already exists, or once the policy has locked on Dec 26.
 */
export async function mintNft(
  tokenName: string,
  cip25: Record<string, unknown>,
  extraMetadata: Record<number, object> = {},
): Promise<{ txHash: string; policyId: string }> {
  const { w, utxos } = await fresh();
  const M = await loadMesh();
  const pol = await ornamentPolicy(w);
  const { tip, params } = await chainNow(M);
  if (tip.abs_slot >= pol.lockSlot)
    throw new Error(`The ornament workshop closed on Dec 26, ${CAL_YEAR}. Nobody can make new ones now, which is what keeps yours rare.`);

  const nameHex = utf8Hex(tokenName);
  if (!nameHex || nameHex.length > 64) throw new Error("That name is too long for the chain (32 bytes at most).");
  const unit = pol.policyId + nameHex;

  // One of each, ever. 1) Is it already in the wallet?  2) Did we send a mint moments ago?  3) Does the chain know it?
  if (unitsIn(utxos).includes(unit)) throw new Error(ALREADY);
  const pendingKey = keyFor(w, "minting");
  const pending = store.get<Record<string, number>>(pendingKey, {}) ?? {};
  if (Date.now() - (Number(pending[unit]) || 0) < 180_000) throw new Error(`${ALREADY} It's on its way into a block.`);
  let onChain = false;
  try {
    onChain = (await getAssetInfo([[pol.policyId, nameHex]], 0)).some((r) => BigInt(r.total_supply ?? 0) > 0n);
  } catch (e) {
    console.warn("Couldn't check the chain for an earlier mint; the wallet check passed, so carrying on.", e);
  }
  if (onChain) throw new Error(ALREADY);

  const tx = new M.MeshTxBuilder({ params });
  tx.mint("1", pol.policyId, nameHex)
    .mintingScript(pol.script)
    .metadataValue(721, { [pol.policyId]: { [tokenName]: { ...cip25, app: APP_ID } } })
    .requiredSignerHash(pol.keyHash)
    // Valid for an hour by the chain's clock, and never past the policy's lock.
    .invalidHereafter(Math.min(tip.abs_slot + TTL_SLOTS, pol.lockSlot));
  for (const [label, value] of Object.entries(extraMetadata)) tx.metadataValue(Number(label), value);

  const txHash = await finish(M, tx, w, utxos);
  const now = Date.now();
  const keep: Record<string, number> = { [unit]: now };
  for (const [u, at] of Object.entries(pending)) if (now - Number(at) < 180_000) keep[u] = Number(at);
  store.set(pendingKey, keep);
  return { txHash, policyId: pol.policyId };
}

/** CIP-30 signData (CIP-8 message signing). Free: no transaction, no fee. */
export async function signMessage(text: string) {
  const w = requireWallet();
  try {
    return (await w.bw.signData(text, w.changeAddress, true)) as { signature: string; key: string };
  } catch (e) {
    throw new WalletError("signData", e);
  }
}
