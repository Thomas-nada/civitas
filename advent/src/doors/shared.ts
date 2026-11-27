// Helpers shared by the door modules (EARLY owns this file, LATE uses it).
import "./shared.css";
import * as K from "../koios";
import { shareCard } from "../share";
import { ada, errorBox, esc, short, trackTx, txSuccess } from "../ui";
import { type ConnectedWallet, delegate, networkMismatch, stakeStatus, wallet } from "../wallet";

const fire = (name: string, detail?: unknown) => window.dispatchEvent(new CustomEvent(name, { detail }));

// ---------------------------------------------------------------- wallet prompts

/** The one-line "what is a wallet" explanation shown under every connect button. */
export const WALLET_BLURB =
  "A wallet is the app that holds your ADA. Works with Lace, Eternl, Vespr and others. Your keys never leave it.";

const WALLET_ICON = `<svg class="btn-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H17v3M3 7.5V17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H5.5A2.5 2.5 0 0 1 3 7.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16.5" cy="13.5" r="1.5" fill="currentColor"/></svg>`;

function ctaHtml(label: string) {
  return `<button class="btn" type="button" data-connect>${WALLET_ICON}<span>${esc(label)}</span></button>
    <p class="muted small">${WALLET_BLURB}</p>`;
}

function wireConnect(el: HTMLElement) {
  const b = el.querySelector<HTMLButtonElement>("[data-connect]");
  if (b) b.onclick = () => fire("open-wallet-picker");
}

/**
 * Full-door gate: replaces `el` with a connect prompt and returns null when no usable
 * wallet is connected. Prefer the try-first pattern (show the thing, then `walletCta`).
 */
export function needWallet(el: HTMLElement, why: string): ConnectedWallet | null {
  if (!wallet) {
    el.innerHTML = `<div class="need-wallet"><p>${esc(why)}</p>${ctaHtml("Connect a wallet")}</div>`;
    wireConnect(el);
    return null;
  }
  const mm = networkMismatch();
  if (mm) {
    el.innerHTML = `<div class="err">🧭 ${esc(mm)}</div>`;
    return null;
  }
  return wallet;
}

/**
 * Inline "connect a wallet" call to action for the moment of commitment (try-first
 * pattern). Renders into `el`. If a wallet is connected but on the wrong network it shows
 * that instead; if a usable wallet is connected it renders nothing.
 */
export function walletCta(el: HTMLElement, label = "Connect a wallet"): void {
  const mm = wallet ? networkMismatch() : null;
  if (wallet && !mm) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = mm ? `<div class="err">🧭 ${esc(mm)}</div>` : `<div class="wallet-cta">${ctaHtml(label)}</div>`;
  wireConnect(el);
}

// ---------------------------------------------------------------- drafts + navigation

const drafts = new Map<string, string>();

/** Get (or, with `value`, set) an in-memory draft so half-typed text survives a re-render. */
export function draft(day: number, field: string, value?: string): string {
  const k = `${day}:${field}`;
  if (value !== undefined) drafts.set(k, value);
  return drafts.get(k) ?? "";
}

/** Ask the shell to open another door (it shows a toast if that door is still locked). */
export function gotoDoor(day: number): void {
  fire("open-door", { day });
}

// Buttons inside HTML strings can't carry handlers, so two attributes are handled globally:
//   data-goto-door="13"  → opens that door        data-rerender  → re-renders the current door
const g = window as unknown as { __doorLinks?: boolean };
if (!g.__doorLinks) {
  g.__doorLinks = true;
  document.addEventListener("click", (e) => {
    const t = (e.target as Element | null)?.closest?.("[data-goto-door],[data-rerender]") as HTMLButtonElement | null;
    if (!t || t.disabled) return;
    if (t.hasAttribute("data-goto-door")) return gotoDoor(Number(t.getAttribute("data-goto-door")));
    t.disabled = true; // no double clicks; the re-render replaces this button anyway
    setTimeout(() => t.isConnected && (t.disabled = false), 4000);
    fire("rerender-door");
  });
}

// ---------------------------------------------------------------- small HTML builders

/** Collapsed "What am I looking at?" block. `html` is trusted markup written by us. */
export const explain = (html: string, title = "What am I looking at?"): string =>
  `<details class="explain"><summary>${esc(title)}</summary><div class="explain-body">${html}</div></details>`;

/** Coerce any chain / wallet / localStorage value to a plain string (objects and null → ""). */
export function str(v: unknown, max = 400): string {
  const s = typeof v === "string" ? v : typeof v === "number" || typeof v === "bigint" || typeof v === "boolean" ? String(v) : "";
  return s.length > max ? Array.from(s).slice(0, max).join("") : s;
}

/** Friendly error plus a "Try again" button that re-renders the current door. */
export const failBox = (e: unknown): string =>
  `${errorBox(e)}<div class="door-actions"><button class="btn ghost" type="button" data-rerender>Try again</button></div>`;

/** A soft, already-friendly notice plus "Try again" (for empty lists and the like). `msg` is plain text. */
export const softFail = (msg: string): string =>
  `<div class="warn">${esc(msg)}</div><div class="door-actions"><button class="btn ghost" type="button" data-rerender>Try again</button></div>`;

// ---------------------------------------------------------------- actions

const trackers = new WeakMap<HTMLElement, () => void>();

/**
 * Wire a button to an async action that renders its result into `out`.
 * After rendering it calls `trackTx(out)` so any `txSuccess(...)` HTML shows live
 * confirmation. If the result HTML contains `data-once`, the button stays disabled.
 */
export function action(btn: HTMLButtonElement, out: HTMLElement, fn: () => Promise<string>, busy = "Check your wallet…") {
  btn.onclick = async () => {
    if (btn.disabled) return;
    const label = btn.innerHTML;
    let once = false;
    btn.disabled = true;
    btn.innerHTML = `<span class="spin">❄</span> ${esc(busy)}`;
    trackers.get(out)?.();
    trackers.delete(out);
    out.innerHTML = "";
    try {
      const html = await fn();
      out.innerHTML = html;
      once = html.includes("data-once");
      const stop = trackTx(out);
      if (typeof stop === "function") trackers.set(out, stop);
    } catch (e) {
      console.error(e);
      out.innerHTML = errorBox(e);
    } finally {
      btn.innerHTML = label;
      btn.disabled = once;
    }
  };
}

// ---------------------------------------------------------------- staking / vote delegation

export interface DelegateOpts {
  kind: "pool" | "drep";
  id: string;
  /** Display name, e.g. "[ANGEL] Angel Stake Pool" or a DRep's given name. */
  name: string;
  /** Button label. */
  label: string;
  /** When set, the button explains this instead of offering to sign (e.g. an over-full pool). */
  blocked?: string;
}

/**
 * A "stake with this pool" / "give this DRep your vote" button that opens a check-before-you-sign
 * card, then sends one transaction. Renders nothing without a usable wallet that can stake.
 */
export function delegateBox(host: HTMLElement, o: DelegateOpts): void {
  const w = wallet && !networkMismatch() ? wallet : null;
  if (!w?.rewardAddress) {
    host.innerHTML = "";
    return;
  }
  host.innerHTML = `<div class="door-actions"><button class="btn" type="button" data-dg>${esc(o.label)}</button></div>
    <div data-dg-card></div><div data-dg-out aria-live="polite"></div>`;
  const btn = host.querySelector<HTMLButtonElement>("[data-dg]")!;
  const card = host.querySelector<HTMLElement>("[data-dg-card]")!;
  const out = host.querySelector<HTMLElement>("[data-dg-out]")!;
  const pool = o.kind === "pool";

  btn.onclick = async () => {
    if (btn.disabled) return;
    out.innerHTML = "";
    if (o.blocked) {
      card.innerHTML = `<div class="card">${esc(o.blocked)}</div>`;
      return;
    }
    btn.disabled = true;
    card.innerHTML = `<p class="muted small center"><span class="spin">❄</span> Checking your wallet's staking…</p>`;
    try {
      const st = await stakeStatus(w);
      const current = pool ? st.pool : st.drep;
      if (current === o.id) {
        card.innerHTML = `<div class="ok">${pool ? `You're already staking with ${esc(o.name)}.` : `${esc(o.name)} already votes for you.`}</div>`;
        return;
      }
      const points = pool
        ? [
            "Your ADA stays in your wallet and is never locked. You can switch pools whenever you like.",
            current ? "This moves your stake away from your current pool." : "",
            "Rewards start after about two epochs, then arrive every epoch on their own.",
          ]
        : [
            "Your ADA stays in your wallet. You only lend its voting weight, and can change your mind any time.",
            current ? "This replaces your current DRep choice." : "",
            "Your vote follows them from the next epoch.",
          ];
      if (st.deposit > 0n)
        points.push(`First time: your wallet also puts down a ${ada(st.deposit.toString(), 0)} ADA deposit. You get it back if you ever stop staking.`);
      card.innerHTML = `<div class="paper dg-card">
        <div class="label">Check before you sign</div>
        <p class="dg-sum">${pool ? "Stake your wallet with" : "Give your vote to"} <b>${esc(o.name)}</b></p>
        <code class="dg-id">${esc(short(o.id, 14, 8))}</code>
        <ul>${points.filter(Boolean).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <p class="small">One transaction, about 0.18 ADA in network fees. Your wallet shows it before anything is sent.</p>
        <div class="door-actions"><button class="btn" type="button" data-dg-go>Yes, sign it</button><button class="btn ghost" type="button" data-dg-back>Not now</button></div></div>`;
      const back = card.querySelector<HTMLButtonElement>("[data-dg-back]")!;
      back.onclick = () => {
        card.innerHTML = "";
        btn.focus();
      };
      const go = card.querySelector<HTMLButtonElement>("[data-dg-go]")!;
      action(go, out, async () => {
        back.disabled = true;
        try {
          const { txHash } = await delegate(pool ? { pool: o.id } : { drep: o.id });
          card.innerHTML = "";
          btn.hidden = true;
          return (
            txSuccess(txHash, pool ? `You're staking with ${o.name}.` : `${o.name} now votes for you.`) +
            `<span data-once hidden></span>`
          );
        } finally {
          back.disabled = false;
        }
      });
      card.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } catch (e) {
      console.error(e);
      card.innerHTML = errorBox(e);
    } finally {
      btn.disabled = false;
    }
  };
}

// ---------------------------------------------------------------- sharing

export interface ShareOpts {
  title: string;
  line?: string;
  artSvg?: string;
  footer?: string;
  filename?: string;
  text?: string;
}

const SHARE_ICON = `<svg class="btn-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4m0 0L8 8m4-4 4 4M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** A ghost "Share" button. Wire it with `wireShare(root, …)` after inserting it. */
export const shareBtnHtml = (label = "Share"): string =>
  `<button class="btn ghost" type="button" data-share>${SHARE_ICON}<span>${esc(label)}</span></button>`;

/** Wire the first `[data-share]` button under `root` to build a card and share / download it as a PNG. */
export function wireShare(root: ParentNode, opts: () => ShareOpts | Promise<ShareOpts>): void {
  const btn = root.querySelector<HTMLButtonElement>("[data-share]");
  if (!btn) return;
  btn.onclick = async () => {
    if (btn.disabled) return;
    const label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spin">❄</span> Wrapping your picture…`;
    btn.parentElement?.querySelector(".share-err")?.remove();
    try {
      await shareCard(await opts());
    } catch (e) {
      console.error(e);
      btn.insertAdjacentHTML("afterend", `<div class="share-err">${errorBox(e)}</div>`);
    } finally {
      btn.disabled = false;
      btn.innerHTML = label;
    }
  };
}

// ---------------------------------------------------------------- chain helpers

export const poolName = (p?: K.PoolInfo | null): string => {
  const t = str(p?.meta_json?.ticker, 12).trim();
  const n = str(p?.meta_json?.name, 60).trim();
  return t ? `[${t}] ${n}`.trim() : n || (p ? short(str(p.pool_id_bech32), 10, 6) : "unknown pool");
};

export const tickerOf = (p?: K.PoolInfo | null, id?: string | null): string =>
  str(p?.meta_json?.ticker, 12).trim() || (id ? short(id, 6, 4) : "—");

/**
 * Pool id → pool, carrying the **ticker only** (`meta_json.ticker`). It uses the fast
 * `pool_list` lookup; for a pool's name or description call `K.getPoolInfo([id])`
 * for that one pool (mainnet `pool_info` is slow for many pools at once).
 */
export async function poolMap(ids: (string | null | undefined)[]): Promise<Map<string, K.PoolInfo>> {
  const t = await K.getPoolTickers(ids);
  return new Map(
    [...t].map(([id, ticker]) => [id, { pool_id_bech32: id, meta_json: ticker ? { ticker } : null } as K.PoolInfo]),
  );
}

/** tx_info for many hashes. Koios batching to the public-tier body limit happens inside `getTxInfo`. */
export async function txOutputs(hashes: string[]) {
  const out: K.TxInfo[] = [];
  for (let i = 0; i < hashes.length; i += 48) out.push(...((await K.getTxInfo(hashes.slice(i, i + 48))) ?? []));
  return out;
}

/** Token units (policyId + hex name) held by the wallet, read from its UTxOs. */
export async function heldUnits(w: ConnectedWallet): Promise<string[]> {
  const units = new Set<string>();
  for (const u of await w.bw.getUtxos()) for (const a of u?.output?.amount ?? []) if (a.unit !== "lovelace") units.add(a.unit);
  return [...units];
}

export const lovelaceOf = (u: any): number =>
  Number(u?.output?.amount?.find?.((a: any) => a?.unit === "lovelace")?.quantity ?? 0) || 0;

/** CIP-119 fields may be plain strings or JSON-LD {"@value": "..."} objects. */
export const ld = (v: any): string => (v && typeof v === "object" ? (v["@value"] ?? "") : (v ?? ""));
