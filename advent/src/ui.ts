import { type Net, explorerBlock, explorerTx, state } from "./config";
import { KoiosError, findTx, getBlockPool, getPoolTickers } from "./koios";

/** Escape anything that came from the chain (pool names, metadata, …) before it hits innerHTML. */
export function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function html(el: HTMLElement, markup: string) {
  el.innerHTML = markup;
  return el;
}

export const $ = <T extends HTMLElement = HTMLElement>(root: ParentNode, sel: string) =>
  root.querySelector(sel) as T;

export function ada(lovelace: string | number | bigint, digits = 2): string {
  const n = Number(lovelace) / 1e6;
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

/** Compact big ADA amounts: 35.2B, 1.4M … */
export function adaCompact(lovelace: string | number | bigint): string {
  const n = Number(lovelace) / 1e6;
  return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

export const short = (s: string, head = 8, tail = 6) => {
  s = String(s ?? "");
  return s.length <= head + tail + 1 ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;
};

export const num = (n: number | string) => Number(n).toLocaleString();

export function ago(unixSeconds: number): string {
  const s = Math.max(0, Math.round(Date.now() / 1000 - unixSeconds));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function duration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [d && `${d}d`, (d || h) && `${h}h`, `${m}m`, `${sec}s`].filter(Boolean).join(" ");
}

export const spinner = (msg = "Asking the elves…") =>
  `<div class="loading" role="status"><span class="spin">❄</span> ${esc(msg)}</div>`;

// ---------------------------------------------------------------- errors

/** Which wallet step failed. CIP-30 reuses the same error codes for different steps, so we must remember. */
export type WalletPhase = "enable" | "read" | "build" | "sign" | "submit" | "signData";

/** wallet.ts wraps every wallet / transaction-builder failure in one of these. */
export class WalletError extends Error {
  phase: WalletPhase;
  code: number | undefined;
  /** The raw text the wallet or the builder gave us (for the "details" fold-out). */
  info: string;
  constructor(phase: WalletPhase, cause: unknown) {
    const r = rawOf(cause);
    super(r.text || `wallet ${phase} failed`, { cause });
    this.name = "WalletError";
    this.phase = phase;
    this.code = r.code;
    this.info = r.text;
  }
}

const MSG = {
  declined: "You declined in your wallet. No worries, nothing was sent.",
  busy: "The chain's data service is busy. Please try again in a few seconds.",
  offline: "You seem to be offline. Check your connection and try again.",
  low: "Not enough ADA for this one. Keep at least ~2 ADA spare for fees and change.",
  address: "That address isn't valid. Double-check it and try again.",
  noSign: "This wallet can't sign messages (some hardware wallets can't). Everything else still works.",
  unknown: "Something went wrong on our side of the chimney.",
  rejected: "The network rejected the transaction. Wait a minute, then try again.",
  tooLong: "One line of your message is too long for the chain. Shorten it and try again.",
  tooBig:
    "That transaction would be too big. Your wallet holds lots of small coins or tokens: send all your ADA to yourself once to tidy up, then try again.",
};
const FAUCET = "https://docs.cardano.org/cardano-testnets/tools/faucet";

interface Friendly {
  msg: string;
  /** Raw text for the collapsed "details". */
  detail?: string;
  /** Offer the testnet faucet. */
  faucet?: boolean;
}

/** Pull text and a CIP-30 code out of whatever was thrown (Error, `{code, info}`, string…). */
function rawOf(e: unknown): { text: string; code?: number; name: string } {
  let text = "";
  let code: number | undefined;
  let name = "";
  if (typeof e === "string") text = e;
  else if (e && typeof e === "object") {
    const a = e as any;
    if (e instanceof Error) name = e.name;
    if (typeof a.code === "number") code = a.code;
    const t = [a.info, a.message].find((x) => typeof x === "string" && x.trim());
    if (t) text = t;
    else {
      try {
        const j = JSON.stringify(e);
        if (j && j !== "{}" && j !== "[]") text = j;
      } catch {
        /* circular */
      }
    }
  } else if (e != null) text = String(e);

  // Mesh wraps wallet errors as: [BrowserWallet] An error occurred during enable: {"code":-3,"info":"…"}.
  const wrapped = /^\[\w+\] An error occurred during \w+: ([\s\S]*?)\.?$/.exec(text.trim());
  if (wrapped) {
    text = wrapped[1].trim();
    try {
      const inner = JSON.parse(text);
      if (inner && typeof inner === "object") {
        if (typeof inner.code === "number") code = inner.code;
        text = [inner.info, inner.message].find((x: unknown) => typeof x === "string" && (x as string).trim()) ?? "";
      } else if (typeof inner === "string") text = inner;
    } catch {
      /* not JSON: keep the text */
    }
  }
  return { text: text.trim(), code, name };
}

const DECLINED_RX = /user (declined|rejected|cancell?ed|denied|closed)|declin|rejected by (the )?user|cancell?ed|refused|denied/i;
const LOW_RX = /UTxO Fully Depleted|UTxO Balance Insufficient|Not enough UTxOs|insufficient|not enough/i;
const ADDRESS_RX = /invalid address|invalid checksum|bech32|malformed address/i;
const BIG_RX = /size exceeds|Maximum Input Count|tx(n)? too (big|large)|MaxTxSize/i;

/** Does this text look like something a library threw, rather than a sentence we wrote for people? */
const technical = (t: string) =>
  t.length > 240 ||
  /^\[|[{}<>]|":|\bError:|failed:|is not a function|is not defined|Cannot read|\bundefined\b|\bnull\b|\bNaN\b|Unexpected token|deseriali[sz]|\bCBOR\b|KeyHash|[0-9a-f]{40,}|^Koios \d/i.test(t);

function low(): Friendly {
  return { msg: MSG.low, faucet: state.network !== "mainnet" };
}

function fromText(t: string, code: number | undefined): Friendly {
  if (code === -3 || DECLINED_RX.test(t)) return { msg: MSG.declined };
  if (LOW_RX.test(t)) return low();
  if (/MAX_LENGTH_LIMIT/.test(t)) return { msg: MSG.tooLong };
  if (ADDRESS_RX.test(t)) return { msg: MSG.address };
  if (BIG_RX.test(t)) return { msg: MSG.tooBig };
  if (/time(d)? ?out/i.test(t)) return { msg: MSG.busy };
  return { msg: MSG.unknown, detail: t };
}

function fromWallet(e: WalletError, offline: boolean): Friendly {
  const t = e.info;
  const code = e.code;
  const said = DECLINED_RX.test(t);
  switch (e.phase) {
    case "enable":
      if (code === -3 || said) return { msg: MSG.declined };
      if (code === -4) return { msg: "Your wallet switched accounts. Please connect again." };
      return { msg: "Couldn't connect to your wallet. Unlock it and try again.", detail: t };
    case "read":
      if (code === -4) return { msg: "Your wallet switched accounts. Please connect again." };
      if (code === -3 || said) return { msg: "Your wallet stopped sharing with this page. Please connect again." };
      return { msg: "Couldn't read your wallet. Unlock it and try again.", detail: t };
    case "build":
      if (LOW_RX.test(t)) return low();
      if (/MAX_LENGTH_LIMIT/.test(t)) return { msg: MSG.tooLong };
      if (ADDRESS_RX.test(t)) return { msg: MSG.address };
      if (BIG_RX.test(t)) return { msg: MSG.tooBig };
      return { msg: MSG.unknown, detail: t };
    case "sign":
      // TxSignError: 1 = ProofGeneration, 2 = UserDeclined
      if (said || code === 2 || code === -3) return { msg: MSG.declined };
      return {
        msg: "Your wallet couldn't sign this. If it's a hardware wallet, check it's plugged in and unlocked, then try again.",
        detail: t,
      };
    case "signData":
      // DataSignError: 1 = ProofGeneration, 2 = AddressNotPK, 3 = UserDeclined
      if (said || code === 3 || code === -3) return { msg: MSG.declined };
      return { msg: MSG.noSign, detail: t };
    case "submit": {
      // TxSendError: 1 = Refused, 2 = Failure. Never "you declined": the user already signed.
      if (offline) return { msg: MSG.offline };
      let msg = MSG.rejected;
      // Wordings from both the raw ledger (cardano-node / submit-api) and Ogmios v6.
      if (/OutsideValidityInterval|validity interval|expired/i.test(t)) msg = "The network rejected the transaction because it waited too long. Please try again.";
      else if (/StakePoolNotRegistered|unknown stake pool|stake pool .*(not registered|doesn't exist|does not exist)/i.test(t))
        msg = "The network rejected the transaction: that stake pool has retired or isn't registered any more. Pick another one.";
      else if (/DRepNotRegistered|unknown (delegate representative|drep)|drep .*(not registered|doesn't exist|does not exist)/i.test(t))
        msg = "The network rejected the transaction: that DRep isn't registered any more. Pick another one.";
      else if (/BadInputs|ValueNotConserved|already (been )?spent|inputs are spent|unknown (utxo|input)|unknown output reference/i.test(t))
        msg =
          "The network rejected the transaction: the coins in your wallet changed in the meantime (maybe an earlier transaction is still on its way). Wait a minute and try again.";
      else if (/OutputTooSmall|insufficiently funded outputs|minimum ada/i.test(t)) msg = "The network rejected the transaction: an amount in it is below the minimum. Try a little more ADA.";
      else if (/MissingVKeyWitnesses|missing (signatures|signatories|required signatures)|ScriptWitnessNotValidating|failing native script|native script/i.test(t))
        msg = "The network rejected the transaction: your wallet didn't sign with every key it needs. If your wallet has several accounts, switch to the one you connected with and try again.";
      else if (/FeeTooSmall|insufficient fee|fee too small/i.test(t)) msg = "The network rejected the transaction: the fee came out too low. Please try again in a minute.";
      return { msg, detail: t };
    }
  }
}

function classify(e: unknown): Friendly {
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (e instanceof WalletError) return fromWallet(e, offline);
  if (e instanceof KoiosError) {
    if (offline) return { msg: MSG.offline };
    if (e.status === 429 || e.status >= 500 || e.status === 408) return { msg: MSG.busy };
    return { msg: MSG.unknown, detail: e.message };
  }
  const r = rawOf(e);
  if (r.name === "AbortError" || r.name === "TimeoutError") return { msg: offline ? MSG.offline : MSG.busy };
  if (r.name === "TypeError" && /fetch|network|load failed/i.test(r.text)) return { msg: MSG.offline };
  // Sentences our own code wrote for people (`throw new Error("Write a wish first")`) pass straight through.
  const ours = (typeof e === "string" || (e instanceof Error && r.name === "Error")) && r.code === undefined;
  if (ours && r.text && !technical(r.text) && !/^UTxO |user (declined|rejected|cancell?ed)/i.test(r.text)) return { msg: r.text };
  return fromText(r.text, r.code);
}

/** A short, friendly, plain-text explanation of any error. Never empty, never raw. */
export function errorMsg(e: unknown): string {
  const f = classify(e);
  return f.msg + (f.faucet ? " On a testnet you can get free test ADA from the faucet." : "");
}

/** The same as HTML. Raw technical text, if any, sits inside a collapsed <details>. */
export function errorBox(e: unknown): string {
  const f = classify(e);
  const detail = (f.detail ?? "").trim();
  return `<div class="err" role="alert">⚠️ ${esc(f.msg)}${
    f.faucet ? ` <a href="${FAUCET}" target="_blank" rel="noopener">Get free test ADA ↗</a>` : ""
  }${detail ? `<details class="small"><summary>Technical details</summary><code class="wrap">${esc(detail.slice(0, 600))}</code></details>` : ""}</div>`;
}

// ---------------------------------------------------------------- transactions

const HASH_RX = /^[0-9a-f]{64}$/;
const cleanHash = (h: unknown) => {
  const s = String(h ?? "").trim().toLowerCase();
  return HASH_RX.test(s) ? s : "";
};

/** Explorer link for a transaction. Renders nothing if `hash` isn't a real transaction hash. */
export const txLinkHtml = (hash: string, label = "View on explorer ↗") => {
  const h = cleanHash(hash);
  return h ? `<a href="${explorerTx(h)}" target="_blank" rel="noopener">${esc(label)}</a>` : "";
};

/** Success box for a submitted transaction. Call `trackTx(container)` after inserting it. */
export function txSuccess(hash: string, what: string) {
  const h = cleanHash(hash);
  const link = txLinkHtml(h);
  return `<div class="ok">✨ ${esc(what)}${h ? `<br><code>${esc(short(h, 14, 10))}</code>${link ? ` · ${link}` : ""}` : ""}
  <div class="tx-track muted small"${h ? ` data-tx="${h}"` : ""} aria-live="polite">${
    h ? "⏳ On its way. Waiting for the next block (usually under a minute)…" : "It should appear on-chain within a minute."
  }</div></div>`;
}

interface Sealed {
  net: Net;
  blockHeight: number;
  blockHash: string;
  time: number;
  ticker: string | null;
}
interface Watch {
  hash: string;
  net: Net;
  els: Set<HTMLElement>;
  started: number;
  timer: ReturnType<typeof setTimeout> | undefined;
  stopped: boolean;
}
const TRACK_EVERY = 8_000;
const TRACK_FOR = 180_000;
const sealed = new Map<string, Sealed>();
const watches = new Map<string, Watch>();

function paintSealed(el: HTMLElement, s: Sealed) {
  const block = `#${num(s.blockHeight)}`;
  el.classList.remove("muted");
  el.classList.add("sealed");
  el.innerHTML = `✅ Sealed in block ${
    s.net === state.network && HASH_RX.test(s.blockHash)
      ? `<a href="${explorerBlock(s.blockHash)}" target="_blank" rel="noopener">${block}</a>`
      : block
  }${s.ticker ? ` · baked by [${esc(s.ticker.slice(0, 12))}]` : ""} · ${esc(ago(s.time))}`;
}

function stopWatch(w: Watch) {
  w.stopped = true;
  clearTimeout(w.timer);
  w.timer = undefined;
  if (watches.get(w.hash) === w) watches.delete(w.hash);
}

async function tick(w: Watch) {
  w.timer = undefined;
  for (const el of w.els) if (!el.isConnected) w.els.delete(el);
  if (!w.els.size) return stopWatch(w);

  let hit: Awaited<ReturnType<typeof findTx>>;
  try {
    hit = await findTx(w.hash, w.net);
  } catch {
    /* Koios hiccup: just try again next round */
  }
  if (w.stopped) return;

  if (hit) {
    let ticker: string | null = null;
    try {
      const pool = await getBlockPool(hit.block_height, hit.block_hash, w.net);
      if (pool && w.net === state.network) ticker = (await getPoolTickers([pool])).get(pool) || null;
    } catch {
      /* the baker's name is a nicety */
    }
    const s: Sealed = { net: w.net, blockHeight: hit.block_height, blockHash: hit.block_hash, time: hit.tx_timestamp, ticker };
    const first = !sealed.has(w.hash);
    sealed.set(w.hash, s);
    stopWatch(w);
    for (const el of w.els) if (el.isConnected) paintSealed(el, s);
    if (first) window.dispatchEvent(new CustomEvent("tx-confirmed", { detail: { hash: w.hash, blockHeight: hit.block_height } }));
    return;
  }

  if (Date.now() - w.started >= TRACK_FOR) {
    stopWatch(w);
    for (const el of w.els)
      if (el.isConnected) el.textContent = "Still not in a block. It may have been dropped — check the explorer link.";
    return;
  }
  w.timer = setTimeout(() => tick(w), TRACK_EVERY);
}

/**
 * Watch every `[data-tx]` element under `root` (see `txSuccess`) until its transaction is in
 * a block: checks every 8s for up to 3 minutes, and stops early if the element leaves the page.
 * Then rewrites the element ("Sealed in block N · baked by [TICKER] · 12s ago") and fires the
 * window event `tx-confirmed` with `{ hash, blockHeight }`. Returns a function that stops watching.
 */
export function trackTx(root: HTMLElement): () => void {
  const els = [...(root.matches("[data-tx]") ? [root] : []), ...root.querySelectorAll<HTMLElement>("[data-tx]")];
  const mine: [Watch, HTMLElement][] = [];
  for (const el of els) {
    const hash = cleanHash(el.dataset.tx);
    if (!hash) continue;
    const done = sealed.get(hash);
    if (done) {
      paintSealed(el, done);
      continue;
    }
    let w = watches.get(hash);
    if (!w) {
      const fresh: Watch = { hash, net: state.network, els: new Set(), started: Date.now(), timer: undefined, stopped: false };
      fresh.timer = setTimeout(() => tick(fresh), TRACK_EVERY);
      watches.set(hash, fresh);
      w = fresh;
    }
    w.els.add(el);
    mine.push([w, el]);
  }
  return () => {
    for (const [w, el] of mine) {
      w.els.delete(el);
      if (!w.els.size && !w.stopped) stopWatch(w);
    }
  };
}

// ---------------------------------------------------------------- metadata helpers

const utf8 = new TextEncoder();
const bytes = (s: string) => utf8.encode(s).length;

/** Visible characters (emoji with modifiers count as one), so we never cut one in half. */
function clusters(s: string): string[] {
  const Seg = (Intl as any).Segmenter;
  if (typeof Seg === "function") return Array.from(new Seg(undefined, { granularity: "grapheme" }).segment(s), (x: any) => x.segment as string);
  return Array.from(s);
}

/**
 * Split a string into ≤64-byte UTF-8 pieces (the on-chain metadata string limit).
 * Breaks after a space when it can, so words stay whole. The pieces always join back
 * into exactly the original string (see `joinChunks`).
 */
export function chunk64(s: string): string[] {
  let rest = String(s ?? "");
  const out: string[] = [];
  while (bytes(rest) > 64) {
    // The longest prefix that fits. 64 bytes never span more than 64 UTF-16 units; look a bit further for whole clusters.
    let cut = 0;
    let size = 0;
    for (const units of [clusters(rest.slice(0, 96)), Array.from(rest.slice(0, 96))]) {
      for (const u of units) {
        const b = bytes(u);
        if (size + b > 64) break;
        size += b;
        cut += u.length;
      }
      if (cut > 0) break; // a single cluster over 64 bytes: fall back to code points
    }
    if (cut === 0) cut = 1;
    if (!/\s/.test(rest[cut] ?? "")) {
      const head = rest.slice(0, cut);
      const sp = Math.max(head.lastIndexOf(" "), head.lastIndexOf("\n"));
      // only if it doesn't waste more than half of the piece
      if (sp >= 0 && sp + 1 < cut && bytes(head.slice(0, sp + 1)) >= 32) cut = sp + 1;
    }
    out.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  out.push(rest);
  return out;
}

export const joinChunks = (v: unknown): string => (Array.isArray(v) ? v.join("") : String(v ?? ""));

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
export const utf8Hex = (s: string) => toHex(new TextEncoder().encode(s));
export function hexToUtf8(hex: string): string {
  const bytes = new Uint8Array(String(hex ?? "").match(/[0-9a-f]{2}/gi)?.map((b) => parseInt(b, 16)) ?? []);
  return new TextDecoder().decode(bytes);
}

export async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return toHex(new Uint8Array(d));
}

/** Deterministic PRNG seeded from a hex string (block hashes make great seeds). */
export function seeded(hex: string) {
  let i = 0;
  const found = String(hex ?? "").match(/[0-9a-f]{2}/gi)?.map((b) => parseInt(b, 16));
  const bytes = found?.length ? found : [0];
  return () => {
    const v = (bytes[i % bytes.length] * 256 + bytes[(i + 1) % bytes.length]) ^ (i * 2654435761);
    i += 2;
    return ((v >>> 0) % 10000) / 10000;
  };
}

export function confetti(container: HTMLElement, n = 80) {
  if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // gold, berry, pine, cardano blue, cream, amber
  const colors = ["#ffd166", "#d62839", "#2f8a5f", "#3468ff", "#fffaf0", "#ff9d3c"];
  for (let k = 0; k < n; k++) {
    const p = document.createElement("i");
    p.className = "confetti";
    p.style.left = Math.random() * 100 + "%";
    p.style.background = colors[k % colors.length];
    p.style.animationDelay = Math.random() * 0.6 + "s";
    p.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
    container.appendChild(p);
    setTimeout(() => p.remove(), 3500);
  }
}
