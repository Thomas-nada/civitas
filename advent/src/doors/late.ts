// Doors 13–24, plus the read-only "friend's tree" view (`renderTree`).
import "./late.css";
import { ornament, starSvg, svgDataUri, treeSvg } from "../art";
import { APP_ID, APP_LABEL, CAL_YEAR, explorerBlock, explorerToken, getOpened, pictureExplorer, state, store } from "../config";
import * as K from "../koios";
import { shareCard } from "../share";
import { $, ada, adaCompact, ago, chunk64, confetti, errorBox, esc, hexToUtf8, joinChunks, num, sha256Hex, short, spinner, toHex, utf8Hex, trackTx, txLinkHtml, txSuccess } from "../ui";
import { type ConnectedWallet, assertKeyAddress, findOrnaments, loadMesh, mintNft, mintWindow, networkMismatch, ornamentPolicy, resolveHandle, sendWithMetadata, wallet, wkey } from "../wallet";
import { action, delegateBox, draft, explain, gotoDoor, ld, poolMap, str, tickerOf, txOutputs, walletCta } from "./shared";
import type { Door } from "./types";

// ================================================================ shared bits

const rerender = () => window.dispatchEvent(new CustomEvent("rerender-door"));

/** The connected wallet, if it is on the network the calendar is showing. */
const live = (): ConnectedWallet | null => (wallet && !networkMismatch() ? wallet : null);

/**
 * Try-first pattern: returns the usable wallet, or fills `host` with the "connect" call to
 * action (or the wrong-network note) and returns null.
 */
function committer(host: HTMLElement, label: string): ConnectedWallet | null {
  const w = live();
  if (w) return w;
  walletCta(host, label);
  return null;
}

/** A friendly problem we wrote ourselves (plain text). Anything thrown goes through `errorBox`. */
const oops = (text: string) => `<div class="err" role="alert">${esc(text)}</div>`;

/** Error plus a "Try again" for one section of a door, so the rest of the door stays up. */
function failInto(host: HTMLElement, e: unknown, again: () => void) {
  console.error(e);
  host.innerHTML = `${errorBox(e)}<div class="lt-row"><button class="btn ghost" type="button" data-again>Try again</button></div>`;
  $(host, "[data-again]").onclick = again;
}

/**
 * Delegated clicks for buttons that arrive later inside HTML strings (after a transaction):
 * `data-act="name"` runs `map.name`, `data-door="15"` opens that door, `data-again` re-renders.
 */
function acts(root: HTMLElement, map: Record<string, (btn: HTMLElement) => void> = {}) {
  root.addEventListener("click", (e) => {
    const b = (e.target as Element | null)?.closest?.<HTMLElement>("[data-act],[data-door],[data-rerender-door]");
    if (!b || (b as HTMLButtonElement).disabled) return;
    if (b.dataset.door) return gotoDoor(Number(b.dataset.door));
    if (b.hasAttribute("data-rerender-door")) return rerender();
    map[b.dataset.act ?? ""]?.(b);
  });
  // read-only boxes (links, reveal codes) select themselves, ready to copy
  root.addEventListener("focusin", (e) => {
    const t = e.target;
    if ((t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement) && t.readOnly) t.select();
  });
}

/** A row of toggle buttons sharing one detail panel: tap one, see its detail. */
function pickable(root: ParentNode, sel: string, show: (i: number) => void, first = 0) {
  const btns = [...root.querySelectorAll<HTMLButtonElement>(sel)];
  const pick = (i: number) => {
    btns.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
    show(i);
  };
  btns.forEach((b, i) => (b.onclick = () => pick(i)));
  if (btns.length) pick(Math.max(0, Math.min(first, btns.length - 1)));
  return pick;
}

async function share(errHost: HTMLElement | null, o: Parameters<typeof shareCard>[0]) {
  if (errHost) errHost.innerHTML = "";
  try {
    await shareCard(o);
  } catch (e) {
    console.error(e);
    if (errHost) errHost.innerHTML = errorBox(e);
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function downloadText(filename: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/** "Dec 25, 7:00 PM" in the visitor's own time zone. */
const localTime = (ms: number) =>
  new Date(ms).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const localDate = (unix: number) => new Date(unix * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

const imgTag = (svg: string, alt: string) => `<img src="${svgDataUri(svg)}" alt="${esc(alt)}">`;
const plural = (n: number, one: string, many = one + "s") => `${num(n)} ${n === 1 ? one : many}`;
/** One metadata string when it fits in 64 bytes, else the usual list of pieces. */
const meta64 = (s: string): string | string[] => {
  const c = chunk64(s);
  return c.length === 1 ? c[0] : c;
};

let uid = 0;

const TICK = `<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#2f8a5f"/><path d="M5.5 10.5l3 3 6-7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const COST_MINT = `<p class="small muted">Minting costs about 0.3 ADA. About 1.2 ADA travels with the NFT and stays yours.</p>`;

// ================================================================ ornaments read back from the chain

interface Hung {
  unit: string;
  name: string;
  title: string;
  /** Checked `data:image/svg+xml;base64,…` URI. */
  img: string;
  traits: [string, string][];
  fp: string;
  tx: string;
  star: boolean;
}

const SVG_URI = /^data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+$/;
const STAKE_RX = /^stake(_test)?1[02-9ac-hj-np-z]{30,120}$/;
const OUR_NAME = /^(Ornament|ChristmasStar)/;
const TRAIT_KEYS: [string, string][] = [
  ["glass", "Glass"],
  ["shape", "Shape"],
  ["metal", "Metal"],
  ["motif", "Motif"],
  ["block", "Block"],
  ["doorsOpened", "Doors opened"],
  ["ornaments", "Ornaments"],
];

const pairOf = (unit: string): [string, string] => [unit.slice(0, 56), unit.slice(56)];

/**
 * Look assets up and keep the ones this calendar made: 721 metadata tagged `app: cardano-advent`
 * (or, for older mints, an Ornament…/ChristmasStar… name), with a base64 SVG picture.
 */
async function describe(pairs: [string, string][]): Promise<Hung[]> {
  if (!pairs.length) return [];
  const infos = await K.getAssetInfo(pairs.slice(0, 40));
  const out: Hung[] = [];
  for (const i of infos) {
    const policy = str(i.policy_id, 56);
    const nameHex = str(i.asset_name, 64);
    const name = hexToUtf8(nameHex);
    const byPolicy = i.minting_tx_metadata?.["721"]?.[policy];
    const md = byPolicy?.[name] ?? byPolicy?.[nameHex];
    if (!md || typeof md !== "object") continue;
    const img = joinChunks(md.image);
    if (img.length > 8000 || !SVG_URI.test(img)) continue;
    if (str(md.app) !== APP_ID && !OUR_NAME.test(name)) continue;
    const traits: [string, string][] = [];
    for (const [k, label] of TRAIT_KEYS) {
      const v = str(md[k], 40).trim();
      if (v) traits.push([label, v]);
    }
    out.push({
      unit: policy + nameHex,
      name,
      title: str(md.name, 80).trim() || name,
      img,
      traits,
      fp: str(i.fingerprint, 60),
      tx: str(i.minting_tx_hash, 64),
      star: name.startsWith("ChristmasStar"),
    });
  }
  // the Star first, then by name (block height order, near enough)
  return out.sort((a, b) => Number(b.star) - Number(a.star) || a.name.localeCompare(b.name, undefined, { numeric: true }));
}

/** Which of an account's tokens are worth looking up: all of them if few, else only ours by name. */
function candidates(assets: K.AccountAsset[]): [string, string][] {
  const held = assets.filter((a) => a && typeof a.policy_id === "string" && typeof a.asset_name === "string" && a.asset_name && Number(a.quantity) > 0);
  const named = held.filter((a) => OUR_NAME.test(hexToUtf8(a.asset_name)));
  const rest = held.length <= 30 ? held.filter((a) => !named.includes(a)) : [];
  return [...named, ...rest].slice(0, 40).map((a) => [a.policy_id, a.asset_name]);
}

const fpLink = (fp: string) =>
  /^asset1[a-z0-9]{20,60}$/.test(fp)
    ? `<a href="${explorerToken(fp)}" target="_blank" rel="noopener">View on explorer ↗</a>`
    : "";

/** The tree with ornaments hung on it, a strip of thumbnails, one detail card, share and link buttons. */
function drawTree(el: HTMLElement, items: Hung[], o: { seed: string; mine: boolean; stake: string | null; note?: string }) {
  const hung = items.slice(0, 24);
  const svg = treeSvg(o.seed, { images: hung.map((i) => i.img) });
  const star = items.some((i) => i.star);
  const count = items.filter((i) => !i.star).length;
  const link = (() => {
    if (!o.stake || !STAKE_RX.test(o.stake)) return "";
    const u = new URL(location.href);
    u.hash = "";
    u.search = `?tree=${o.stake}${state.network === "mainnet" ? "" : `&net=${state.network}`}`;
    return u.toString();
  })();
  el.innerHTML = `
    <div class="l22-tree">${svg}</div>
    <p class="center l22-count"><b>${plural(count, "ornament")}</b> on ${o.mine ? "your" : "this"} tree${star ? ", and the Star is lit" : ""}.</p>
    <div class="l22-strip">${items
      .map((it, i) => `<button type="button" class="l22-orn" data-i="${i}" aria-pressed="false" aria-label="${esc(it.title)}"><img src="${it.img}" alt="" loading="lazy"></button>`)
      .join("")}</div>
    <div id="l22-detail"></div>
    ${o.note ? `<p class="small muted center">${esc(o.note)}</p>` : ""}
    <div class="lt-row">
      ${o.mine && link ? `<button class="btn" type="button" data-act="link">Copy link to my tree</button>` : ""}
      <button class="btn ghost" type="button" data-act="share">Share as a picture</button>
    </div>
    <div id="l22-msg" aria-live="polite"></div>`;
  const detail = $(el, "#l22-detail");
  const pick = pickable(el, ".l22-orn", (i) => {
    const it = items[i];
    detail.innerHTML = `<div class="paper lt-paper l22-card"><img src="${it.img}" alt="">
      <div class="l22-info"><div class="l22-name">${esc(it.title)}</div>
      ${it.traits.length ? `<div class="lt-tags">${it.traits.map(([k, v]) => `<span><i>${esc(k)}</i> ${esc(v)}</span>`).join("")}</div>` : ""}
      <div class="small">${it.fp ? `Fingerprint <code>${esc(short(it.fp, 10, 6))}</code>` : ""} ${fpLink(it.fp)}</div>
      <div class="small">${txLinkHtml(it.tx, "The transaction that made it ↗")}</div></div></div>`;
  });
  // If the tree drawing exposes its hung pictures, make them tappable too.
  el.querySelectorAll<SVGElement>(".l22-tree image").forEach((node) => {
    const href = node.getAttribute("href") ?? node.getAttribute("xlink:href");
    const i = hung.findIndex((h) => h.img === href);
    if (i < 0) return;
    node.style.cursor = "pointer";
    node.addEventListener("click", () => pick(i));
  });
  const msg = $(el, "#l22-msg");
  acts(el, {
    link: async () => {
      const ok = await copyText(link);
      msg.innerHTML = `<div class="ok">${ok ? "Link copied." : "Copy this link:"} Anyone who opens it sees your tree.
        <input class="l22-link mono" readonly value="${esc(link)}" aria-label="Link to my tree">
        <div class="small muted">The link contains your wallet's public staking address, so people who have it can also look up what the wallet holds.</div></div>`;
    },
    share: () =>
      void share(msg, {
        title: o.mine ? "My Cardano Advent tree" : "A Cardano Advent tree",
        line: `${plural(count, "ornament")}${star ? " and the Christmas Star" : ""}, all stored on Cardano`,
        artSvg: svg,
        filename: `cardano-advent-tree-${CAL_YEAR}.png`,
        text: o.mine && link ? `My Cardano Advent tree: ${link}` : undefined,
      }),
  });
}

/**
 * Read-only view of someone's tree (SHELL calls this for `?tree=<stake address>`).
 * No wallet needed, and it never throws: problems are drawn into `el`.
 */
export async function renderTree(el: HTMLElement, who: string): Promise<void> {
  const stake = String(who ?? "").trim().toLowerCase();
  if (!STAKE_RX.test(stake)) {
    el.innerHTML = oops("That doesn't look like a tree link. It should end with a staking address (stake1…).");
    return;
  }
  const onTestnet = stake.startsWith("stake_test");
  if (onTestnet !== (state.network !== "mainnet")) {
    const net = new URLSearchParams(location.search).get("net");
    const where = onTestnet ? (net === "preprod" || net === "preview" ? `the ${net} test network` : "a test network") : "mainnet";
    el.innerHTML = `<div class="warn">This tree lives on ${where}, and the calendar is showing ${esc(state.network)}. Switch the network at the top of the page to see it.</div>`;
    return;
  }
  el.innerHTML = spinner("Walking over to their tree…");
  try {
    const items = await describe(candidates(await K.getAccountAssets(stake)));
    if (!items.length) {
      el.innerHTML = `<div class="card">No ornaments on this tree yet. A freshly minted one takes about a minute to show up.</div>
        <div class="lt-row"><button class="btn ghost" type="button" data-again>Look again</button></div>`;
      $(el, "[data-again]").onclick = () => void renderTree(el, who);
      return;
    }
    drawTree(el, items, { seed: await sha256Hex(stake), mine: false, stake });
  } catch (e) {
    failInto(el, e, () => void renderTree(el, who));
  }
}

/** Everything hanging in the connected wallet: its own mints, plus ornaments friends sent it. */
async function collect(w: ConnectedWallet): Promise<{ items: Hung[]; partial: boolean }> {
  const f = await findOrnaments(w);
  const pairs = new Map<string, [string, string]>();
  for (const u of [f.star, ...f.ornaments]) if (u) pairs.set(u, pairOf(u));
  let partial = false;
  if (w.rewardAddress) {
    try {
      for (const p of candidates(await K.getAccountAssets(w.rewardAddress))) if (!pairs.has(p[0] + p[1])) pairs.set(p[0] + p[1], p);
    } catch (e) {
      console.warn("Couldn't list the account's tokens", e);
      partial = true;
    }
  }
  return { items: await describe([...pairs.values()]), partial };
}

function friendForm(el: HTMLElement) {
  const host = $(el, "#l22-friend");
  host.innerHTML = `<label>See a friend's tree
      <input id="l22-who" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${state.network === "mainnet" ? "stake1…" : "stake_test1…"}"></label>
    <p class="small muted">Paste the staking address from their tree link.</p>
    <div class="lt-row"><button class="btn ghost" type="button" id="l22-visit">Show their tree</button></div>
    <div id="l22-ftree"></div>`;
  const input = $<HTMLInputElement>(host, "#l22-who");
  const go = () => {
    // accept a whole link too
    const v = input.value.trim().match(/stake(_test)?1[0-9a-z]+/i)?.[0] ?? input.value.trim();
    if (v) void renderTree($(host, "#l22-ftree"), v);
  };
  $(host, "#l22-visit").onclick = go;
  input.onkeydown = (e) => {
    if (e.key === "Enter") go();
  };
}

// ================================================================ the sealed wish (doors 21 and 24)

interface Wish {
  wish: string;
  salt: string;
  hash: string;
  /** The commit transaction; null while we don't know that it reached the chain. */
  tx: string | null;
  /** The reveal transaction, once published. */
  reveal?: string | null;
  /** The last confirmed wish, kept until a newer one has a transaction of its own. */
  prev?: Wish | null;
}
type Sealed = Wish & { tx: string };

const HEX64 = /^[0-9a-f]{64}$/;

function readWish(): Wish | null {
  const v = store.get<any>(wkey("wish"), null);
  if (!v || typeof v.wish !== "string" || typeof v.salt !== "string" || typeof v.hash !== "string") return null;
  const clean = (r: any): Wish => ({
    wish: r.wish,
    salt: r.salt,
    hash: r.hash,
    tx: typeof r.tx === "string" && HEX64.test(r.tx) ? r.tx : null,
    reveal: typeof r.reveal === "string" && HEX64.test(r.reveal) ? r.reveal : null,
  });
  const rec = clean(v);
  const p = v.prev;
  rec.prev = p && typeof p.wish === "string" && typeof p.salt === "string" && typeof p.hash === "string" ? clean(p) : null;
  return rec;
}

/** Save, then read back: a wish we can't store is a wish nobody can ever reveal. */
function writeWish(rec: Wish | null): boolean {
  store.set(wkey("wish"), rec);
  const back = readWish();
  if (!rec) return back === null;
  return !!back && back.wish === rec.wish && back.salt === rec.salt && back.hash === rec.hash && back.tx === rec.tx;
}

/** The wish that is known to be on-chain: the current one, else the one it was about to replace. */
const sealedWish = (rec: Wish | null): Sealed | null =>
  rec?.tx ? (rec as Sealed) : rec?.prev?.tx ? (rec.prev as Sealed) : null;

const toB64 = (s: string) => btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));
const fromB64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));

/** base64 of `wish|salt|hash`: everything needed to reveal from another browser. */
const revealCode = (r: Wish) => toB64(`${r.wish}|${r.salt}|${r.hash}`);

function parseRevealCode(code: string): { wish: string; salt: string; hash: string } | null {
  try {
    const parts = fromB64(code.replace(/\s+/g, "")).split("|");
    if (parts.length < 3) return null;
    const hash = parts.pop()!;
    const salt = parts.pop()!;
    const wish = parts.join("|");
    if (!wish || wish.length > 400 || !/^[0-9a-f]{16,64}$/.test(salt) || !HEX64.test(hash)) return null;
    return { wish, salt, hash };
  } catch {
    return null;
  }
}

/** Look through the wallet's recent transactions for the commit carrying this fingerprint. */
async function findCommit(w: ConnectedWallet, hash: string): Promise<string | null> {
  const recent = w.rewardAddress ? await K.getAccountTxs(w.rewardAddress, 60) : await K.getAddressTxs(w.changeAddress, 60);
  if (!recent.length) return null;
  const rows = await K.getTxMetadata(recent.map((t) => t.tx_hash));
  for (const r of rows) {
    const m = r.metadata?.[String(APP_LABEL)];
    if (m && typeof m === "object" && str(m.kind) === "wish-commit" && str(m.sha256) === hash) return r.tx_hash;
  }
  return null;
}

const revealMeta = (s: Sealed) => ({
  app: APP_ID,
  kind: "wish-reveal",
  year: String(CAL_YEAR),
  wish: chunk64(s.wish), // chunk64 pieces join back into the exact wish, so the hash can be re-checked
  salt: s.salt,
  sha256: s.hash,
  commitTx: s.tx,
});

const saveCodeHtml = (r: Wish) => `<div class="l21-code">
    <div class="label">Save your reveal code</div>
    <p class="small">This code is your wish in a form you can keep. With it you can reveal the wish on Dec 24 from any browser, even if this one forgets. Keep it private: whoever has it can read your wish.</p>
    <textarea readonly rows="3" class="mono l21-codebox" aria-label="Reveal code">${esc(revealCode(r))}</textarea>
    <div class="lt-row"><button type="button" class="btn ghost" data-act="copycode">Copy code</button>
    <button type="button" class="btn ghost" data-act="savecode">Download as .txt</button></div></div>`;

/** Handlers for the buttons in `saveCodeHtml` (pass to `acts`). */
const codeActs: Record<string, (btn: HTMLElement) => void> = {
  copycode: async (btn) => {
    const box = btn.closest(".l21-code")?.querySelector<HTMLTextAreaElement>("textarea");
    if (!box) return;
    const ok = await copyText(box.value);
    if (!ok) box.select();
    btn.textContent = ok ? "Copied" : "Select the text and copy it";
  },
  savecode: (btn) => {
    const box = btn.closest(".l21-code")?.querySelector<HTMLTextAreaElement>("textarea");
    if (box)
      downloadText(
        `cardano-advent-wish-${CAL_YEAR}.txt`,
        `Cardano Advent ${CAL_YEAR}: reveal code for your sealed wish.\r\nKeep this file private. Paste the code behind Door 24 to reveal the wish.\r\n\r\n${box.value}\r\n`,
      );
  },
};

type WishStatus = "none" | "ok" | "revealed" | "mismatch" | "unconfirmed" | "unknown";

/** Where the connected wallet's wish stands. Never throws. */
async function wishState(w: ConnectedWallet): Promise<{ rec: Sealed | null; status: WishStatus }> {
  let rec = readWish();
  if (!rec) return { rec: null, status: "none" };
  let lookupFailed = false;
  if (!rec.tx) {
    // Written down but never confirmed (closed tab, wallet hiccup): it may be on-chain all the same.
    try {
      const tx = await findCommit(w, rec.hash);
      if (tx) {
        rec = { ...rec, tx, prev: null };
        writeWish(rec);
      }
    } catch (e) {
      console.warn(e);
      lookupFailed = true;
    }
  }
  const s = sealedWish(rec);
  if (!s) return { rec: null, status: lookupFailed ? "unknown" : "unconfirmed" };
  if (s.reveal) return { rec: s, status: "revealed" };
  try {
    if ((await sha256Hex(`${s.wish}|${s.salt}`)) !== s.hash) return { rec: s, status: "mismatch" };
    const row = (await K.getTxMetadata([s.tx])).find((r) => r.tx_hash === s.tx);
    if (!row) return { rec: s, status: "unconfirmed" };
    const m = row.metadata?.[String(APP_LABEL)];
    return { rec: s, status: m && typeof m === "object" && str(m.sha256) === s.hash ? "ok" : "mismatch" };
  } catch (e) {
    console.warn(e);
    return { rec: s, status: "unknown" };
  }
}

// ================================================================ drawings

const STAMP = `<svg viewBox="0 0 36 44" aria-hidden="true"><rect x="1.5" y="1.5" width="33" height="41" rx="3" fill="#fff" stroke="#d62839" stroke-width="2" stroke-dasharray="3 2.5"/><path d="M18 9l2.6 6 6.4.6-4.9 4.2 1.5 6.3L18 22.7l-5.6 3.4 1.5-6.3L9 15.6l6.4-.6z" fill="#e9a800"/><path d="M9 33h18M12 37h12" stroke="#d62839" stroke-width="1.6" stroke-linecap="round"/></svg>`;

const SOCK_HUES = ["#d62839", "#2f8a5f", "#3468ff", "#e9a800"];
/** A stocking, filled from the toe up to `fill` (0–1). */
function stockingSvg(fill: number, hue: string): string {
  const id = `lt-sock-${++uid}`;
  const body = "M17 18H41V42C41 47 43 49 47 51L52 54C60 58 58 72 49 72H31C22 72 17 66 17 57Z";
  const y = (72 - 54 * Math.max(0, Math.min(1, fill))).toFixed(1);
  return `<svg viewBox="0 0 64 78" aria-hidden="true"><defs><clipPath id="${id}"><rect x="0" y="${y}" width="64" height="78"/></clipPath></defs><path d="M29 0v9" stroke="#e9a800" stroke-width="2"/><path d="${body}" fill="${hue}" opacity=".3"/><path d="${body}" fill="${hue}" clip-path="url(#${id})"/><path d="${body}" fill="none" stroke="#fffaf0" stroke-opacity=".6" stroke-width="1.5"/><rect x="13" y="8" width="32" height="12" rx="5" fill="#fffaf0"/></svg>`;
}

const SACK = `<svg viewBox="0 0 80 90" aria-hidden="true"><path d="M27 24C8 36 4 82 40 86C76 82 72 36 53 24Z" fill="#9a6532"/><path d="M27 24C8 36 4 82 40 86" fill="none" stroke="#6b4420" stroke-width="2"/><path d="M29 23L22 8Q40 16 58 8L51 23Z" fill="#b57a3e"/><path d="M26 23.500Q40 30 54 23.500" fill="none" stroke="#ffd166" stroke-width="3" stroke-linecap="round"/><circle cx="40" cy="57" r="13" fill="#ffd166"/><path d="M35 63.500l5-14 5 14M34.500 57h11M35 60.500h10" fill="none" stroke="#7a4d1f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`.replace(/\.500/g, ".5");

function giftSvg(box: string, ribbon: string): string {
  return `<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M30 17C22 3 7 8 17 17ZM30 17C38 3 53 8 43 17Z" fill="${ribbon}"/><rect x="7" y="25" width="46" height="32" rx="3" fill="${box}"/><rect x="3" y="16" width="54" height="11" rx="3" fill="${box}"/><rect x="3" y="16" width="54" height="11" rx="3" fill="#000" opacity=".14"/><rect x="26" y="16" width="8" height="41" fill="${ribbon}"/></svg>`;
}

/** The advent candle: 24 marks, burned down by `frac` (0 = Dec 1, 1 = Christmas morning). */
function candleSvg(frac: number): string {
  const TOP = 50, BOT = 270, seg = (BOT - TOP) / 24;
  const f = Math.max(0, Math.min(1, frac));
  const done = f >= 1;
  const y = done ? BOT - 8 : TOP + (BOT - TOP) * f;
  const n = (v: number) => v.toFixed(1);
  let marks = "";
  for (let d = 1; d <= 24; d++) {
    const top = TOP + seg * (d - 1), bottom = top + seg;
    if (bottom <= y + 1) continue; // already burned away
    if (d < 24) marks += `<path d="M42 ${n(bottom)}h8" stroke="#d62839" stroke-width="1.5"/>`;
    if (d % 4 === 0 && top + seg / 2 - 8 > y)
      marks += `<text x="64" y="${n(top + seg / 2 + 4.3)}" font-size="12" font-weight="700" text-anchor="middle" fill="#3b2a12">${d}</text>`;
  }
  const flame = done
    ? `<path d="M60 ${n(y - 5)}c-6-8 6-12 0-20s6-10 2-16" fill="none" stroke="#cfd8ff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`
    : `<circle cx="60" cy="${n(y - 20)}" r="27" fill="#ffd166" opacity=".16"/><g transform="translate(60 ${n(y - 5)})"><g class="l18-flick"><path d="M0 0C-9-8-5-19 0-28 5-19 9-8 0 0Z" fill="#ff9d3c"/><path d="M0-1C-4-6-2-12 0-17 2-12 4-6 0-1Z" fill="#ffd166"/></g></g>`;
  const burned = done ? 24 : Math.floor(f * 24);
  return `<svg viewBox="0 0 120 300" width="120" height="300" role="img" aria-label="Advent candle, ${burned} of 24 marks burned down"><ellipse cx="60" cy="283" rx="40" ry="7" fill="#b8860b"/><path d="M34 270h52l-5 13H39z" fill="#e9a800"/><rect x="42" y="${n(y)}" width="36" height="${n(BOT - y)}" rx="3" fill="#fffaf0"/>${marks}<path d="M60 ${n(y)}v-6" stroke="#3b2a12" stroke-width="2" stroke-linecap="round"/>${flame}</svg>`;
}

const singer = (x: number, y: number, coat: string, hat: string, skin: string) =>
  `<g transform="translate(${x} ${y})"><path d="M-22 72C-22 44-14 34 0 34C14 34 22 44 22 72Z" fill="${coat}"/><circle cy="20" r="14" fill="${skin}"/><path d="M-14 16C-14 1 14 1 14 16Z" fill="${hat}"/><circle cy="3" r="4" fill="#fffaf0"/><rect x="-15" y="13" width="30" height="5" rx="2.5" fill="#fffaf0"/><ellipse cy="27" rx="3.5" ry="4.5" fill="#3b2a12"/><circle cx="-5" cy="21" r="1.4" fill="#3b2a12"/><circle cx="5" cy="21" r="1.4" fill="#3b2a12"/><path d="M-12 37Q0 43 12 37" stroke="#ffd166" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="-11" y="49" width="22" height="15" rx="2" fill="#fffaf0"/><path d="M0 49v15" stroke="#c9b68f"/></g>`;
const note = (x: number, y: number, k: number) =>
  `<g class="l19-note l19-n${k}" transform="translate(${x} ${y})"><ellipse rx="4" ry="3" fill="#ffd166"/><path d="M3.500 0V-14l7 3" stroke="#ffd166" stroke-width="1.800" fill="none" stroke-linecap="round"/></g>`.replace(/(\.\d)00/g, "$1");
const CHOIR = `<svg viewBox="0 0 240 114" role="img" aria-label="Three carolers singing">${note(24, 34, 1)}${note(150, 14, 2)}${note(216, 28, 3)}${singer(62, 40, "#d62839", "#2f8a5f", "#f3d2b3")}${singer(120, 32, "#2f8a5f", "#d62839", "#c98f62")}${singer(178, 40, "#3468ff", "#e9a800", "#8d5a3b")}<path d="M0 112Q120 102 240 112V114H0Z" fill="#fffaf0" opacity=".3"/></svg>`;

/** A snow globe; the snow sits where the block hash says. */
function globeSvg(hash: string): string {
  const b = (hash.match(/../g) ?? []).map((h) => parseInt(h, 16) || 0);
  let snow = "";
  for (let i = 0; i < 9; i++) {
    const a = ((b[i * 2] ?? i * 29) / 255) * Math.PI * 2, r = 5 + ((b[i * 2 + 1] ?? i * 53) / 255) * 17;
    snow += `<circle cx="${(32 + Math.cos(a) * r).toFixed(1)}" cy="${(27 + Math.sin(a) * r * 0.7).toFixed(1)}" r="1.3" fill="#fff"/>`;
  }
  return `<svg viewBox="0 0 64 74" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="#14246b" stroke="#cfd8ff" stroke-width="2"/><path d="M9.5 45A26 26 0 0 0 54.5 45Z" fill="#fffaf0"/><path d="M32 20l8 12h-4l7 13H21l7-13h-4z" fill="#2f8a5f"/><path d="M30 45h4v4h-4z" fill="#6b4420"/>${snow}<path d="M14 24A20 20 0 0 1 25 12" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/><path d="M14 58h36l5 14H9z" fill="#b8860b"/><rect x="12" y="55" width="40" height="5" rx="2" fill="#e9a800"/></svg>`;
}

const SLEIGH_SLOTS = [[21, 22], [30, 22], [39, 22], [25.5, 14], [34.5, 14], [30, 6]];
const SLEIGH_BOX = ["#ffd166", "#2f8a5f", "#fffaf0", "#3468ff", "#ff9d3c", "#ffd166"];
/** A sleigh carrying `n` presents (0–6). */
function sleighSvg(n: number): string {
  const boxes = SLEIGH_SLOTS.slice(0, n)
    .map(([x, y], i) => `<rect x="${x}" y="${y}" width="8" height="8" rx="1" fill="${SLEIGH_BOX[i]}"/><path d="M${x + 4} ${y}v8" stroke="#d62839" stroke-width="1.4"/>`)
    .join("");
  return `<svg viewBox="0 0 64 48" aria-hidden="true">${boxes}<path d="M12 30h40l5-12h4l-5 20H16z" fill="#d62839"/><path d="M12 30l-3-10h5l3 10z" fill="#a81c2c"/><path d="M20 38v5M44 38v5" stroke="#e9a800" stroke-width="2"/><path d="M8 44h44q8 0 8-8" fill="none" stroke="#e9a800" stroke-width="2.5" stroke-linecap="round"/></svg>`;
}

const ENVELOPE = `<svg viewBox="0 0 200 130" role="img" aria-label="A sealed envelope"><rect x="4" y="14" width="192" height="112" rx="8" fill="#fffaf0" stroke="#d9c9a3" stroke-width="2"/><path d="M6 124L78 70M194 124L122 70" stroke="#d9c9a3" stroke-width="2" fill="none"/><path class="l21-flap" d="M6 16L100 84L194 16" fill="#f6ecd4" stroke="#d9c9a3" stroke-width="2" stroke-linejoin="round"/><g class="l21-wax"><circle cx="100" cy="82" r="19" fill="#d62839"/><circle cx="100" cy="82" r="14" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/><path d="M100 71l3.200 7 7.600.700-5.800 5 1.800 7.400-6.800-4.100-6.800 4.100 1.800-7.400-5.800-5 7.600-.700z" fill="#ffd166"/></g></svg>`.replace(/(\.\d)00/g, "$1");

// ================================================================ door 13 helpers

/** A CIP-20 message as readable text. `msg` may be a list of lines, one string, or junk. */
function noteText(msg: unknown): string {
  const lines = ([] as unknown[])
    .concat(msg as any)
    .slice(0, 24)
    .map((v) => str(v, 200));
  const bytes = (s: string) => new TextEncoder().encode(s).length;
  let out = "";
  lines.forEach((line, i) => {
    if (!i) return void (out = line);
    const prev = lines[i - 1];
    // A line cut at the 64-byte limit continues the sentence; a short line is a real line break.
    out += (/\s$/.test(prev) ? "" : bytes(prev) >= 56 ? " " : "\n") + line;
  });
  return out.replace(/[ \t]+/g, " ").trim().slice(0, 700);
}

const noteHtml = (text: string) => esc(text).replace(/\n/g, "<br>");

async function overheard(host: HTMLElement): Promise<void> {
  host.innerHTML = spinner("Listening in…");
  try {
    const blocks = await K.getLatestBlocks(10);
    const txs = blocks.length ? await K.getBlockTxInfo(blocks.map((b) => b.hash)) : [];
    const rows = [...txs].sort((a, b) => b.block_height - a.block_height);
    const time = new Map(rows.map((t) => [t.tx_hash, Number(t.tx_timestamp) || 0]));
    const notes = new Map<string, { text: string; hash: string; time: number; n: number }>();
    for (const r of rows) {
      const text = noteText(r.metadata?.["674"]?.msg);
      if (!text) continue;
      const t = time.get(r.tx_hash) ?? 0;
      const seen = notes.get(text);
      if (!seen) notes.set(text, { text, hash: r.tx_hash, time: t, n: 1 });
      else {
        seen.n++;
        if (t > seen.time) (seen.time = t), (seen.hash = r.tx_hash);
      }
    }
    const list = [...notes.values()].sort((a, b) => b.time - a.time).slice(0, 12);
    host.innerHTML =
      (list.length
        ? `<div class="l13-notes">${list
            .map(
              (n) => `<div class="l13-note"><p>${noteHtml(n.text)}</p>
              <div class="l13-foot">${n.time ? esc(ago(n.time)) : ""}${n.n > 1 ? ` · heard ${n.n} times` : ""} · ${txLinkHtml(n.hash, "See it ↗")}</div></div>`,
            )
            .join("")}</div>`
        : `<div class="card">Nobody attached a note to the last ${plural(rows.length, "transaction")}. A quiet few minutes.</div>`) +
      `<div class="lt-row"><button class="btn ghost" type="button" data-again>Listen again</button></div>`;
    $(host, "[data-again]").onclick = () => void overheard(host);
  } catch (e) {
    failInto(host, e, () => void overheard(host));
  }
}

async function myLetters(host: HTMLElement): Promise<void> {
  const w = committer(host, "Connect a wallet to read your letters");
  if (!w) return;
  host.innerHTML = spinner("Sorting the mail…");
  try {
    const saved = store.get<unknown>(wkey("letters"), []);
    const local = (Array.isArray(saved) ? saved : []).filter((h): h is string => typeof h === "string" && HEX64.test(h)).slice(0, 20);
    // The whole wallet (stake address), not just one of its addresses.
    const recent = w.rewardAddress ? await K.getAccountTxs(w.rewardAddress, 40) : await K.getAddressTxs(w.changeAddress, 40);
    const hashes = [...new Set([...local, ...recent.map((t) => t.tx_hash)])].slice(0, 60);
    const rows = hashes.length ? await K.getTxMetadata(hashes) : [];
    const known = new Set(rows.map((r) => r.tx_hash));
    const pending = local.filter((h) => !known.has(h)).length;
    const time = new Map(recent.map((t) => [t.tx_hash, t.block_time]));
    const letters = rows.map((r) => ({ hash: r.tx_hash, text: noteText(r.metadata?.["674"]?.msg) })).filter((l) => l.text);
    const undated = letters.filter((l) => !time.get(l.hash)).map((l) => l.hash);
    if (undated.length)
      for (const i of await K.getTxInfo(undated).catch(() => [] as K.TxInfo[])) time.set(i.tx_hash, i.tx_timestamp);
    letters.sort((a, b) => (time.get(b.hash) ?? Infinity) - (time.get(a.hash) ?? Infinity));
    host.innerHTML = `${pending ? `<div class="card">${plural(pending, "letter")} from this browser ${pending === 1 ? "is" : "are"} still on the sleigh, not in a block yet. Look again in a minute.</div>` : ""}
      ${
        letters.length
          ? letters
              .map((l) => {
                const t = time.get(l.hash);
                return `<article class="paper lt-paper l13-letter"><span class="l13-stamp">${STAMP}</span><p class="l13-body">${noteHtml(l.text)}</p>
                <div class="small l13-meta">${t ? `${esc(localDate(t))} · ` : ""}${txLinkHtml(l.hash)}</div></article>`;
              })
              .join("")
          : `<div class="card">No letters in your last ${plural(recent.length, "transaction")}. Write one behind Door 12 and it will turn up here.
             <div class="lt-row"><button class="btn ghost" type="button" data-door="12">Go to Door 12</button></div></div>`
      }
      ${letters.length ? `<p class="small muted">Found in your wallet's last ${plural(recent.length, "transaction")}.</p>` : ""}`;
  } catch (e) {
    failInto(host, e, () => void myLetters(host));
  }
}

// ================================================================ door 14 helpers

const PROPOSAL_KIND: Record<string, string> = {
  TreasuryWithdrawals: "Asks the treasury for money",
  InfoAction: "A poll, no money involved",
  ParameterChange: "A change to the network's rules",
  HardForkInitiation: "A network upgrade",
  NewCommittee: "A change to the constitutional committee",
  NewConstitution: "A new constitution",
  NoConfidence: "A vote of no confidence",
};

const proposalAsk = (p: K.Proposal): number => {
  const ws = Array.isArray(p.withdrawal) ? p.withdrawal : p.withdrawal ? [p.withdrawal] : [];
  return ws.reduce((s, x) => s + (Number(x?.amount) || 0), 0);
};
const proposalOpen = (p: K.Proposal) => !p.enacted_epoch && !p.ratified_epoch && !p.dropped_epoch && !p.expired_epoch;
const proposalStatus = (p: K.Proposal) =>
  p.enacted_epoch ? "Passed" : p.ratified_epoch ? "Passed, waiting to take effect" : p.dropped_epoch ? "Dropped" : p.expired_epoch ? "Ran out of time" : "Voting is open";

// ================================================================ the doors

const GLASS_TINT: Record<string, string> = {
  Ruby: "#e34", Cardano: "#26e", Pine: "#1a9", Plum: "#93d", Copper: "#e75", Sky: "#49f", Holly: "#396",
  Silver: "#dde", Gold: "#fb1", Midnight: "#56f", Rose: "#f8a", Ice: "#9ef", Aurora: "#3fc",
};

export const LATE: Door[] = [
  // ---------------------------------------------------------------- 13
  {
    day: 13,
    title: "Santa's Mailbox",
    emoji: "📬",
    kind: "read",
    teaser: "Your letters, read back from the chain, and what others are writing right now.",
    async render(el) {
      el.innerHTML = `<p>People tuck short notes into Cardano transactions, and the chain keeps every one. Here are yours, and the notes that went past in the last few minutes.</p>
        <h3>Your letters</h3><div id="mine"></div>
        <h3>Overheard on-chain</h3>
        <p class="small muted">Notes from the newest blocks. Most are left by apps, a few by people.</p>
        <div id="heard"></div>
        ${explain(`<p>A transaction can carry a short public message next to the money it moves. Wallets and apps agreed on one place to put it (metadata label 674, known as CIP-20), so anyone can read them back.</p><p>"Your letters" looks through your wallet's latest 40 transactions. "Overheard" reads the notes in the last 10 blocks, which is a few minutes of Cardano.</p>`)}`;
      acts(el);
      await Promise.all([myLetters($(el, "#mine")), overheard($(el, "#heard"))]);
    },
  },

  // ---------------------------------------------------------------- 14
  {
    day: 14,
    title: "Treasury Stockings",
    emoji: "🧦",
    kind: "read",
    teaser: "Who is asking Cardano's treasury for money this week?",
    async render(el) {
      el.innerHTML = spinner("Hanging the stockings…");
      const [props, totals] = await Promise.all([K.getProposals(), K.getTotals()]);
      const treasury = Number(totals?.treasury) || 0;

      // One stocking per title: the same proposal is often filed several times.
      interface Sock { title: string; items: K.Proposal[]; ask: number; open: boolean; first: number }
      const byTitle = new Map<string, Sock>();
      props.forEach((p, i) => {
        const title = str(ld(p.meta_json?.body?.title), 140).trim() || PROPOSAL_KIND[p.proposal_type] || "An untitled proposal";
        const key = title.toLowerCase();
        const s = byTitle.get(key) ?? { title, items: [], ask: 0, open: false, first: i };
        s.items.push(p);
        s.ask += proposalAsk(p);
        s.open ||= proposalOpen(p);
        byTitle.set(key, s);
      });
      const rank = (s: Sock) => (s.ask ? (s.open ? 0 : 1) : s.open ? 2 : 3);
      const socks = [...byTitle.values()].sort((a, b) => rank(a) - rank(b) || a.first - b.first).slice(0, 8);
      const max = Math.max(1, ...socks.map((s) => s.ask));

      const sack = `<div class="l14-sack"><span class="l14-sackart">${SACK}</span><div><div class="label">Santa's sack: the treasury</div>
        <div class="value">${adaCompact(treasury)} ADA</div><div class="small muted">Shared by everyone who holds ADA. Spending any of it takes a public vote.</div></div></div>`;
      if (!socks.length) {
        el.innerHTML = `${sack}<div class="card">Nobody is asking for anything on ${esc(state.network)} right now.</div>`;
        return;
      }
      el.innerHTML = `<p>Anyone can ask Cardano's treasury for money, in public. Each stocking is one request, and the fuller it is, the more ADA it asks for. Tap one to read it.</p>
        ${sack}
        <div class="l14-mantel">${socks
          .map((s, i) => {
            const share = s.ask / max;
            return `<button type="button" class="l14-sock" aria-pressed="false" aria-label="${esc(s.title)}">
              <span class="l14-art" style="width:${Math.round(s.ask ? 68 + 32 * Math.sqrt(share) : 60)}%">${stockingSvg(s.ask ? Math.max(0.12, Math.sqrt(share)) : 0, SOCK_HUES[i % SOCK_HUES.length])}</span>
              <span class="l14-amt">${s.ask ? `${adaCompact(s.ask)} ADA` : "no ADA"}</span>${s.items.length > 1 ? `<span class="l14-x">×${s.items.length}</span>` : ""}</button>`;
          })
          .join("")}</div>
        <div id="detail" aria-live="polite"></div>
        ${explain(`<p>A slice of every transaction fee flows into a shared pot, the treasury. Since 2024, ADA holders decide how it is spent: anyone can file a proposal, and elected representatives (DReps, see Door 19) vote on it.</p><p>These are the newest ${props.length} proposals on ${esc(state.network)}, money requests first. Proposals with the same title share one stocking. Not every proposal asks for money: some are polls or rule changes, and those stockings hang empty.</p>`)}`;
      const detail = $(el, "#detail");
      pickable(el, ".l14-sock", (i) => {
        const s = socks[i];
        const p = s.items[0];
        const abstract = str(ld(p.meta_json?.body?.abstract), 320).trim();
        detail.innerHTML = `<div class="paper lt-paper l14-detail">
          <div class="label">${esc(PROPOSAL_KIND[p.proposal_type] ?? str(p.proposal_type, 40).replace(/([a-z])([A-Z])/g, "$1 $2"))}</div>
          <div class="l14-title">${esc(s.title)}</div>
          ${s.ask ? `<p>Asks for <b>${ada(s.ask, 0)} ADA</b>${treasury ? `, about ${((s.ask / treasury) * 100).toFixed(s.ask / treasury < 0.001 ? 3 : 1)}% of the treasury` : ""}${s.items.length > 1 ? `, across ${s.items.length} proposals with this title` : ""}.</p>` : `<p>Doesn't ask for money.${s.items.length > 1 ? ` Filed ${s.items.length} times.` : ""}</p>`}
          ${abstract ? `<p class="l14-abs">${esc(abstract)}${abstract.length >= 320 ? "…" : ""}</p>` : ""}
          <p class="small"><span class="lt-pill">${esc(proposalStatus(p))}</span> Filed in epoch ${esc(str(p.proposed_epoch, 8))} · ${txLinkHtml(p.proposal_tx_hash, "See the proposal ↗")}</p></div>`;
      });
    },
  },

  // ---------------------------------------------------------------- 15
  {
    day: 15,
    title: "Mint an Ornament",
    emoji: "🔮",
    kind: "mint",
    teaser: "Blow a glass ornament nobody else can make, and keep it as an NFT.",
    async render(el) {
      el.innerHTML = spinner("Heating the glass…");
      const w = live();
      const [tip0, win, pol] = await Promise.all([K.getTip(), mintWindow(), w ? ornamentPolicy(w) : null]);
      let tip = tip0;
      const key = pol?.keyHash ?? "";
      const mintedKey = wkey("ornaments");
      const minted = (): string[] => {
        const v = w ? store.get<unknown>(mintedKey, []) : [];
        return Array.isArray(v) ? v.map((x) => str(x, 64)) : [];
      };
      const nameOf = (t: K.Tip) => `Ornament${t.block_height}x${key.slice(0, 4)}`;
      let cur = ornament(tip.hash + key);
      let last: { name: string; svg: string; traits: typeof cur.traits } | null = null;

      el.innerHTML = `<p>This ornament was shaped by the newest block and your wallet's key, so nobody else can make the same one. The picture is stored on Cardano itself, not on a server. Minting closes for good on Dec 26.</p>
        <div class="l15-stage">
          <div class="l15-art" id="art"></div>
          <div class="l15-side"><div class="label">Shaped by block</div><div class="l15-blk mono" id="blk"></div>
            <div class="l15-traits" id="traits"></div></div>
        </div>
        <div class="small muted center l15-hint" id="hint" aria-live="polite"></div>
        <div class="lt-row"><button class="btn ghost" type="button" id="re">New design</button>${w && !win.locked ? `<button class="btn" type="button" id="go">Mint this ornament</button>` : ""}</div>
        <div id="cta"></div>
        ${
          win.locked
            ? `<div class="card l15-closed"><b>The workshop is closed.</b> Minting ended on ${esc(localTime(win.lockMs))} your time, and nobody can mint under this year's rules again. The ornaments made before then still hang on their owners' trees.
               <div class="lt-row"><button class="btn ghost" type="button" data-door="22">See your tree</button></div></div>`
            : `${COST_MINT}<p class="small muted">Minting closes ${esc(localTime(win.lockMs))} your time.</p>`
        }
        <div id="out"></div>
        ${explain(`<p>An NFT is a token that exists exactly once. Yours is made under a rule that only your wallet's key can use, and the rule switches itself off on Dec 26 at 00:00 UTC. After that nobody can add to the edition, not you and not us.</p>
          <p>The picture is a tiny drawing (SVG) written into the minting transaction itself, so it needs no website or file host to survive.</p>
          ${pol ? `<p>Your policy ID: <code class="lt-wrap">${esc(pol.policyId)}</code></p><p>The rule (a native script):</p><code class="lt-wrap">${esc(JSON.stringify(pol.nativeScript))}</code>` : `<p>Connect a wallet to see your own policy ID and rule.</p>`}`)}`;

      const hint = $(el, "#hint");
      const out = $(el, "#out");
      const re = $<HTMLButtonElement>(el, "#re");
      const go = el.querySelector<HTMLButtonElement>("#go");
      const baseHint = w
        ? ""
        : "A preview, shaped by the newest block alone. Once you connect, the glass takes its final form from your wallet's key.";
      const draw = () => {
        cur = ornament(tip.hash + key);
        const art = $(el, "#art");
        art.innerHTML = imgTag(cur.svg, "Your ornament");
        art.classList.remove("l15-pop");
        void art.offsetWidth;
        art.classList.add("l15-pop");
        $(el, "#blk").textContent = `#${num(tip.block_height)}`;
        $(el, "#traits").innerHTML = (["glass", "shape", "metal", "motif"] as const)
          .map((k) => `<div><span class="label">${k}</span><b>${esc(cur.traits[k])}</b></div>`)
          .join("");
        const done = minted().includes(nameOf(tip));
        if (go) go.disabled = done;
        hint.textContent = done ? "You minted this one. Wait for the next block and roll a new design to make another." : baseHint;
      };
      draw();

      re.onclick = async () => {
        re.disabled = true;
        try {
          const t = await K.getTip();
          if (t.hash === tip.hash) hint.textContent = "Still the same block. A new one arrives about every 20 seconds, then you can roll again.";
          else {
            tip = t;
            draw();
          }
        } catch (e) {
          hint.innerHTML = errorBox(e);
        } finally {
          re.disabled = false;
        }
      };

      if (!w && !win.locked) walletCta($(el, "#cta"), "Connect a wallet to keep this one");

      acts(el, {
        share: () => {
          if (last)
            void share($(out, "[data-share-out]"), {
              title: "My Cardano Advent ornament",
              line: `${last.traits.glass} glass, ${last.traits.shape.toLowerCase()} shape, ${last.traits.motif.toLowerCase()} motif`,
              artSvg: last.svg,
              filename: `${last.name}.png`,
              text: `I minted a one-of-a-kind ornament in the Cardano Advent calendar ${CAL_YEAR}.`,
            });
        },
      });

      if (go)
        action(go, out, async () => {
          // Freeze exactly what is on screen: the mint must match the picture the user chose.
          const t = tip, o = cur, tokenName = nameOf(t);
          if (minted().includes(tokenName)) return oops("You already minted this one. Roll a new design first.");
          re.disabled = true;
          try {
            const { txHash, policyId } = await mintNft(tokenName, {
              name: `Cardano Advent Ornament #${t.block_height}`,
              image: chunk64(svgDataUri(o.svg)),
              mediaType: "image/svg+xml",
              description: meta64(`Blown from block ${t.block_height} for the ${CAL_YEAR} Cardano Advent calendar.`),
              app: APP_ID,
              glass: o.traits.glass,
              shape: o.traits.shape,
              metal: o.traits.metal,
              motif: o.traits.motif,
              block: String(t.block_height),
              seedBlock: t.hash,
            });
            store.set(mintedKey, [tokenName, ...minted()].slice(0, 200));
            last = { name: tokenName, svg: o.svg, traits: o.traits };
            hint.textContent = "Minted. Wait for the next block and roll a new design to make another.";
            const fp = await loadMesh().then((M) => String(M.resolveFingerprint(policyId, utf8Hex(tokenName)))).catch(() => "");
            const see = /^asset1[a-z0-9]{20,60}$/.test(fp)
              ? ` <a href="${esc(pictureExplorer(fp))}" target="_blank" rel="noopener">See it on Cexplorer ↗</a>`
              : "";
            return (
              txSuccess(txHash, "Your ornament is minted. It is yours to keep.") +
              `<p class="muted small">The picture lives fully on-chain. Some wallets, Vespr among them, can't draw on-chain pictures and show a blank or broken image instead; the NFT itself is fine. Explorers show it once the block is in, usually within a minute.${see}</p>` +
              `<div class="lt-row" data-once><button class="btn" type="button" data-door="22">Hang it on your tree</button>
               <button class="btn ghost" type="button" data-act="share">Share</button></div><div data-share-out></div>`
            );
          } finally {
            re.disabled = false;
          }
        });
    },
  },

  // ---------------------------------------------------------------- 16
  {
    day: 16,
    title: "Biggest Gift",
    emoji: "🎁",
    kind: "read",
    teaser: "The biggest present moved in the last few minutes, and what it cost to send.",
    async render(el) {
      el.innerHTML = spinner("Weighing the presents…");
      const blocks = await K.getLatestBlocks(10);
      const txs = blocks.length ? await K.getBlockTxInfo(blocks.map((b) => b.hash)) : [];
      const infos = [...txs]
        .sort((a, b) => b.block_height - a.block_height)
        .slice(0, 96)
        .filter((t) => Number(t.total_output) > 0 && Number(t.fee) > 0);
      if (!infos.length) {
        el.innerHTML = `<div class="card">The last few blocks carried no presents at all. The elves are napping.</div>
          <div class="lt-row"><button class="btn ghost" type="button" data-rerender-door>Look again</button></div>`;
        acts(el);
        return;
      }
      const val = (t: K.TxInfo) => Number(t.total_output), fee = (t: K.TxInfo) => Number(t.fee);
      const big = infos.reduce((a, b) => (val(b) > val(a) ? b : a));
      const small = infos.reduce((a, b) => (val(b) < val(a) ? b : a));
      const cheap = infos.reduce((a, b) => (fee(b) < fee(a) ? b : a));
      const lo = Math.log10(Math.max(1, val(small))), hi = Math.log10(Math.max(1, val(big)));
      const size = (t: K.TxInfo) => Math.round(hi > lo ? 44 + (56 * (Math.log10(Math.max(1, val(t))) - lo)) / (hi - lo) : 100);
      const tinyPct = (x: number) => {
        if (!isFinite(x) || x <= 0) return "0";
        if (x >= 0.01) return x.toFixed(2);
        return x.toFixed(Math.min(12, 1 - Math.floor(Math.log10(x)))).replace(/0+$/, "");
      };
      const picks = [
        { k: "Biggest gift", t: big, box: "#d62839", rib: "#ffd166", v: `${adaCompact(val(big))} ADA` },
        { k: "Smallest gift", t: small, box: "#2f8a5f", rib: "#fffaf0", v: `${ada(val(small), 2)} ADA` },
        { k: "Cheapest wrapping", t: cheap, box: "#3468ff", rib: "#ffd166", v: `${ada(fee(cheap), 2)} ADA fee` },
      ];
      el.innerHTML = `<p>We unwrapped the last ${plural(infos.length, "transaction")}, a few minutes of Cardano. Three stood out. Tap a box.</p>
        <div class="l16-row">${picks
          .map(
            (p) => `<button type="button" class="l16-gift" aria-pressed="false">
              <span class="l16-floor"><span class="l16-box" style="width:${size(p.t)}%">${giftSvg(p.box, p.rib)}</span></span>
              <span class="l16-k">${p.k}</span><span class="l16-v">${esc(p.v)}</span></button>`,
          )
          .join("")}</div>
        <div id="detail" aria-live="polite"></div>
        <p class="l16-compare">Sending the biggest gift cost <b>${ada(fee(big), 2)} ADA</b>. That is <b>${tinyPct((fee(big) / val(big)) * 100)}%</b> of what was inside. On Cardano the fee depends on how much data a transaction carries, not on how much money it moves.</p>
        <div class="lt-row"><button class="btn ghost" type="button" data-rerender-door>Weigh again</button></div>
        ${explain(`<p>Each box is one real transaction from the last 10 blocks. Its size shows how much ADA it moved, on a scale that squeezes very big numbers so the small ones stay visible.</p><p>"Moved" counts everything a transaction sends, including the change that goes straight back to the sender, so the gift itself can be smaller than the number on the box.</p>`)}`;
      acts(el);
      const detail = $(el, "#detail");
      pickable(el, ".l16-gift", (i) => {
        const p = picks[i];
        detail.innerHTML = `<div class="paper lt-paper l16-detail"><div class="label">${p.k}</div>
          <div class="l16-big">${ada(val(p.t), 2)} ADA</div>
          <p>Fee paid: <b>${ada(fee(p.t), 4)} ADA</b> · block #${num(p.t.block_height)}${p.t.tx_timestamp ? ` · ${esc(ago(p.t.tx_timestamp))}` : ""}</p>
          <p class="small">${txLinkHtml(p.t.tx_hash, "Open this transaction ↗")}</p></div>`;
      });
    },
  },

  // ---------------------------------------------------------------- 17
  {
    day: 17,
    title: "Gift a Friend",
    emoji: "💝",
    kind: "tx",
    teaser: "Send a friend a little ADA, or one of your ornaments, with a Christmas card attached.",
    async render(el) {
      const main = state.network === "mainnet";
      const w = live();
      const d = (field: string, value?: string) => draft(17, field, value);
      const amt0 = d("amt") || "2";
      const preset = ["2", "5", "10"].includes(amt0);

      el.innerHTML = `<p>Pick a friend, pick a gift, write a card. It lands in their wallet in under a minute, card attached.</p>
        ${main ? `<div class="warn"><b>This sends real ADA.</b> Once sent, a gift can't be taken back.</div>` : `<p class="small muted">You're on a test network, so this is play money. No friend's address at hand? Use one of your own.</p>`}
        <fieldset class="l17-form" id="form">
          <label for="l17-to">Who is it for?</label>
          <input id="l17-to" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${main ? "$handle or addr1…" : "addr_test1…"}" value="${esc(d("to"))}">
          <div id="who" aria-live="polite"></div>
          ${
            w
              ? `<div class="l17-kinds" role="group" aria-label="What to give"><button type="button" class="l17-chip" data-kind="ada" aria-pressed="true">Send ADA</button><button type="button" class="l17-chip" data-kind="orn" aria-pressed="false">Send an ornament</button></div>`
              : ""
          }
          <div id="part-ada">
            <div class="label">How much?</div>
            <div class="l17-amts" role="group" aria-label="Amount">
              ${[2, 5, 10].map((a) => `<button type="button" class="l17-chip" data-amt="${a}" aria-pressed="false">${a} ADA</button>`).join("")}
              <label class="l17-custom">or <input id="l17-amt" type="number" inputmode="decimal" min="1" step="any" placeholder="other" value="${preset ? "" : esc(amt0)}" aria-label="Another amount in ADA"> ADA</label>
            </div>
            <p class="small muted">The smallest gift is 1 ADA. The network fee, about 0.2 ADA, comes on top.</p>
          </div>
          <div id="part-orn" hidden></div>
          <label for="l17-msg">Your card</label>
          <textarea id="l17-msg" rows="3" maxlength="200">${esc(d("msg") || "Merry Christmas!")}</textarea>
          <p class="small muted">The card is public forever and linked to both addresses. Don't write anything private.</p>
        </fieldset>
        <div id="act"></div>
        <div id="confirm" aria-live="polite"></div>
        <div id="out"></div>
        ${explain(`<p>This builds one ordinary Cardano payment from your wallet to your friend's, with your card stored next to it as a public note. Your wallet shows the transaction and asks before anything is sent.</p><p>A <b>$handle</b> is a nickname for an address. We look up who holds it and show you the full address before you confirm. Addresses that belong to smart contracts are refused, because a plain gift sent there could get stuck.</p>`)}`;

      const form = $<HTMLFieldSetElement>(el, "#form");
      const toEl = $<HTMLInputElement>(el, "#l17-to");
      const whoEl = $(el, "#who");
      const amtEl = $<HTMLInputElement>(el, "#l17-amt");
      const msgEl = $<HTMLTextAreaElement>(el, "#l17-msg");
      const confirmEl = $(el, "#confirm");
      const out = $(el, "#out");
      let sending = false;
      const unconfirm = () => {
        if (!sending) confirmEl.innerHTML = "";
      };

      // ---- recipient: checked when the field loses focus, and again on "Review"
      interface Who { input: string; address: string; handle: string | null }
      let who: Who | null = null;
      let seq = 0;
      const lookup = async (v: string): Promise<Who> => {
        if (v.startsWith("$")) {
          const handle = v.toLowerCase();
          const address = await resolveHandle(handle); // mainnet only, exactly one holder, never a script
          await assertKeyAddress(address);
          return { input: v, address, handle };
        }
        await assertKeyAddress(v);
        return { input: v, address: v, handle: null };
      };
      const check = async (force: boolean): Promise<Who | null> => {
        const v = toEl.value.trim();
        if (!v) {
          who = null;
          whoEl.innerHTML = "";
          return null;
        }
        if (!force && who?.input === v) return who;
        const mine = ++seq;
        who = null;
        whoEl.innerHTML = `<p class="small muted">Checking…</p>`;
        try {
          const r = await lookup(v);
          if (mine !== seq) return null; // the field changed while we were looking
          who = r;
          whoEl.innerHTML = `<div class="l17-ok"><span class="l17-tick">${TICK}</span><div>${r.handle ? `<b>${esc(r.handle)}</b> is held by this address:` : "This address can receive a gift:"}
            <code class="lt-wrap">${esc(r.address)}</code></div></div>`;
          return r;
        } catch (e) {
          if (mine !== seq) return null;
          console.error(e);
          whoEl.innerHTML = errorBox(e); // a failed lookup is an error, never "not found"
          return null;
        }
      };
      toEl.addEventListener("blur", () => void check(false));
      toEl.addEventListener("input", () => {
        d("to", toEl.value);
        seq++;
        who = null;
        whoEl.innerHTML = "";
        unconfirm();
      });
      if (toEl.value.trim()) void check(false);

      // ---- amount
      let amt = Number(amt0);
      const amtBtns = [...el.querySelectorAll<HTMLButtonElement>("[data-amt]")];
      const paintAmt = () => amtBtns.forEach((b) => b.setAttribute("aria-pressed", String(!amtEl.value && Number(b.dataset.amt) === amt)));
      amtBtns.forEach(
        (b) =>
          (b.onclick = () => {
            amt = Number(b.dataset.amt);
            amtEl.value = "";
            d("amt", String(amt));
            paintAmt();
            unconfirm();
          }),
      );
      amtEl.oninput = () => {
        amt = Number(amtEl.value);
        d("amt", amtEl.value);
        paintAmt();
        unconfirm();
      };
      paintAmt();
      msgEl.oninput = () => {
        d("msg", msgEl.value);
        unconfirm();
      };

      // ---- ornament instead of ADA
      let kind: "ada" | "orn" = "ada";
      let orns: Hung[] | null = null;
      let chosen: Hung | null = null;
      const partOrn = $(el, "#part-orn");
      const loadOrns = async (wl: ConnectedWallet) => {
        partOrn.innerHTML = spinner("Opening your ornament box…");
        try {
          const f = await findOrnaments(wl);
          orns = (await describe(f.ornaments.map(pairOf))).filter((o) => !o.star && f.ornaments.includes(o.unit));
          if (!orns.length) {
            partOrn.innerHTML = `<div class="card">Your ornament box is empty. Mint one behind Door 15 first; it takes about a minute to arrive.
              <div class="lt-row"><button class="btn ghost" type="button" data-door="15">Go to Door 15</button></div></div>`;
            return;
          }
          partOrn.innerHTML = `<div class="label">Which one?</div><div class="l17-orns">${orns
            .map((o) => `<button type="button" class="l22-orn" aria-pressed="false" aria-label="${esc(o.title)}"><img src="${o.img}" alt=""></button>`)
            .join("")}</div><p class="small muted" id="l17-chosen"></p>`;
          pickable(partOrn, ".l22-orn", (i) => {
            chosen = orns![i];
            $(partOrn, "#l17-chosen").textContent = `${chosen.title}. It leaves your tree and hangs on theirs.`;
            unconfirm();
          });
        } catch (e) {
          orns = null;
          failInto(partOrn, e, () => void loadOrns(wl));
        }
      };
      el.querySelectorAll<HTMLButtonElement>("[data-kind]").forEach(
        (b) =>
          (b.onclick = () => {
            kind = b.dataset.kind === "orn" ? "orn" : "ada";
            el.querySelectorAll("[data-kind]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
            $(el, "#part-ada").hidden = kind !== "ada";
            partOrn.hidden = kind !== "orn";
            unconfirm();
            if (kind === "orn" && !orns && w) void loadOrns(w);
          }),
      );

      // ---- step 1: review. Step 2 (inside the card): the only button that reaches the wallet.
      const act = $(el, "#act");
      const cw = committer(act, "Connect a wallet to send a gift");
      if (!cw) return;
      act.innerHTML = `<div class="lt-row"><button class="btn" type="button" id="review">Review gift</button></div>`;
      const reviewBtn = $<HTMLButtonElement>(act, "#review");

      const review = async () => {
        out.innerHTML = "";
        confirmEl.innerHTML = "";
        if (!toEl.value.trim()) {
          whoEl.innerHTML = oops("First tell us who the gift is for.");
          toEl.focus();
          return;
        }
        const to = await check(true);
        if (!to) return;
        const card = msgEl.value.trim() || "Merry Christmas!";
        let what: string, done: string, tail: string;
        const opts: { to: string; lovelace?: string; assets?: { unit: string; quantity: string }[] } = { to: to.address };
        const cautions: string[] = [];
        if (kind === "orn") {
          if (!chosen) return void (confirmEl.innerHTML = oops("Pick the ornament you want to give."));
          what = `your ornament “${esc(chosen.title)}”`;
          done = "Your ornament is on its way to its new tree.";
          tail = `An ornament from the ${CAL_YEAR} Cardano Advent calendar`;
          opts.assets = [{ unit: chosen.unit, quantity: "1" }];
          cautions.push("The ornament leaves your tree for good. About 1.2 ADA travels with it, because every token on Cardano must carry a little ADA.");
          if (orns && orns.length === 1) cautions.push("This is your only ornament, and you need one on your own tree to light the Star on Dec 24.");
        } else {
          if (!Number.isFinite(amt) || amt < 1) return void (confirmEl.innerHTML = oops("The smallest gift is 1 ADA. Pick an amount, or type one."));
          if (amt > 1e9) return void (confirmEl.innerHTML = oops("That is more ADA than anyone should gift from a calendar. Check the amount."));
          const shown = amt.toLocaleString(undefined, { maximumFractionDigits: 6 });
          what = `${esc(shown)} ADA`;
          done = `Your gift of ${shown} ADA is on its way.`;
          tail = `A gift of ${amt} ADA, sent with Cardano Advent ${CAL_YEAR}`;
          opts.lovelace = String(Math.round(amt * 1e6));
          if (amt >= 100) cautions.push("That is a big gift. Is the amount right?");
        }
        if (cw.changeAddress === to.address) cautions.push("This is your own address. Fine for a test: the gift comes straight back to you.");

        confirmEl.innerHTML = `<div class="paper lt-paper l17-confirm">
          <div class="label">Check before you send</div>
          <p class="l17-sum">Send <b>${what}</b> to ${to.handle ? `<b>${esc(to.handle)}</b> →` : ""}</p>
          <code class="lt-wrap l17-addr">${esc(to.address)}</code>
          <p class="l17-card">“${noteHtml(card)}”</p>
          ${main ? `<p><b>This sends real ADA.</b> It can't be undone.</p>` : ""}
          ${cautions.map((c) => `<p>${esc(c)}</p>`).join("")}
          <p class="small">The card is public forever and linked to both addresses.</p>
          <div class="lt-row"><button class="btn" type="button" id="send">Yes, send it</button><button class="l17-back" type="button" id="back">Change something</button></div></div>`;
        const back = $<HTMLButtonElement>(confirmEl, "#back");
        back.onclick = () => {
          confirmEl.innerHTML = "";
          toEl.focus();
        };
        action($<HTMLButtonElement>(confirmEl, "#send"), out, async () => {
          sending = true;
          form.disabled = back.disabled = reviewBtn.disabled = true;
          let ok = false;
          try {
            await assertKeyAddress(opts.to); // exactly the address shown above, checked once more
            const hash = await sendWithMetadata({ 674: { msg: [...chunk64(card), tail] } }, opts);
            ok = true;
            d("to", "");
            return txSuccess(hash, done) + `<div class="lt-row" data-once><button class="btn ghost" type="button" data-rerender-door>Send another gift</button></div>`;
          } finally {
            sending = false;
            if (!ok) form.disabled = back.disabled = reviewBtn.disabled = false;
          }
        });
        confirmEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      };
      reviewBtn.onclick = async () => {
        reviewBtn.disabled = true;
        try {
          await review();
        } finally {
          if (!sending && !form.disabled) reviewBtn.disabled = false;
        }
      };
      acts(el);
    },
  },

  // ---------------------------------------------------------------- 18
  {
    day: 18,
    title: "Christmas in Slots",
    emoji: "🕯️",
    kind: "read",
    teaser: "Christmas, counted the way the chain counts: one slot per second.",
    async render(el) {
      el.innerHTML = spinner("Lighting the candle…");
      const tip = await K.getTip();
      const start = new Date(CAL_YEAR, 11, 1).getTime();
      const target = new Date(CAL_YEAR, 11, 25).getTime(); // Christmas morning, your local midnight
      const xslot = K.slotAt(target / 1000);
      el.innerHTML = `<p>Cardano doesn't count hours. It counts <b>slots</b>, one every second, and about one slot in twenty gets a block. This candle burns down one mark a day until Christmas morning.</p>
        <div class="l18">
          <div class="l18-candle" id="candle"></div>
          <div class="l18-nums">
            <div class="label">Slots until Christmas</div><div class="mono l18-big" id="left">…</div>
            <div class="label">Slot right now</div><div class="mono l18-n" id="now">…</div>
            <div class="label">Christmas is slot</div><div class="mono l18-n">${num(xslot)}</div>
            <div class="label">Blocks still to come</div><div class="mono l18-n" id="blocks">…</div>
            <p class="small muted" id="beat">Newest block: #${num(tip.block_height)}</p>
          </div>
        </div>
        <p class="small muted" id="when"></p>
        ${explain(`<p>A slot is one second of chain time, numbered since Cardano began. In each slot a lottery decides whether a stake pool may make a block; on average one slot in twenty wins, so blocks arrive about every 20 seconds.</p><p>The flame jumps whenever a new block arrives. "Christmas" here means midnight on Dec 25 in your own time zone, which is why its slot number differs around the world.</p>`)}`;
      const candle = $(el, "#candle");
      let drawn = -1;
      const upd = () => {
        const now = Date.now();
        const cur = K.slotAt(Math.floor(now / 1000));
        const left = Math.max(0, xslot - cur);
        const frac = (now - start) / (target - start);
        const step = left === 0 ? 100000 : Math.floor(Math.max(0, frac) * 4000); // redraw only when it visibly moved
        if (step !== drawn) {
          drawn = step;
          candle.innerHTML = candleSvg(left === 0 ? 1 : frac);
        }
        $(el, "#now").textContent = num(cur);
        if (left === 0) {
          $(el, "#left").textContent = "It's here";
          $(el, "#blocks").textContent = "none";
          $(el, "#when").textContent = "The candle has burned all the way down. Merry Christmas.";
        } else {
          $(el, "#left").textContent = num(left);
          $(el, "#blocks").textContent = `about ${num(Math.round(left / 20))}`;
          $(el, "#when").textContent = now < start ? "The candle is lit on Dec 1. Until then it waits at full height." : "";
        }
      };
      upd();
      const timer = setInterval(upd, 1000);
      let seen = 0;
      const off = K.onBlock((t) => {
        $(el, "#beat").textContent = `Newest block: #${num(t.block_height)}`;
        if (seen && t.block_height !== seen) {
          candle.classList.remove("l18-flare");
          void candle.offsetWidth;
          candle.classList.add("l18-flare");
        }
        seen = t.block_height;
      });
      return () => {
        clearInterval(timer);
        off();
      };
    },
  },

  // ---------------------------------------------------------------- 19
  {
    day: 19,
    title: "DRep Carolers",
    emoji: "🎶",
    kind: "read",
    teaser: "The people who vote on Cardano's future, singing for your support.",
    async render(el) {
      el.innerHTML = spinner("Tuning voices…");
      const w = live();
      const list = await K.getDrepList();

      interface Voice { id: string; name: string; says: string; power: string; active: boolean }
      const voices = async (ids: string[]): Promise<Voice[]> => {
        const [infos, metas] = await Promise.all([K.getDrepInfo(ids), K.getDrepMetadata(ids).catch(() => [])]);
        return ids.map((id) => {
          const i = infos.find((x) => x.drep_id === id);
          const body = metas.find((x) => x.drep_id === id)?.meta_json?.body;
          return {
            id,
            name: str(ld(body?.givenName), 60).trim(),
            says: (str(ld(body?.objectives), 420) || str(ld(body?.motivations), 420)).trim(),
            power: str(i?.amount, 30) || "0",
            active: !!i?.active,
          };
        });
      };

      // A random caroler: only active ones with a name; a few tries, eight at a time.
      let pick: Voice | null = null;
      const pool = list.map((x) => str(x.drep_id, 80)).filter(Boolean);
      for (let round = 0; round < 3 && !pick && pool.length; round++) {
        const ids = Array.from({ length: Math.min(8, pool.length) }, () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        const named = (await voices(ids)).filter((v) => v.active && v.name);
        pick = named.find((v) => v.says) ?? named[0] ?? null;
      }

      let mine: Voice | null = null;
      let mineNote = "";
      if (w?.rewardAddress) {
        try {
          const id = str((await K.getAccountInfo(w.rewardAddress))?.delegated_drep, 80);
          if (!id) mineNote = "Your wallet hasn't picked a DRep yet, so nobody sings for you. Give the caroler above your vote, or choose one in your wallet app.";
          else if (id === "drep_always_abstain") mineNote = "You chose to always abstain. A quiet caroler.";
          else if (id === "drep_always_no_confidence") mineNote = "You chose “always no confidence”. A caroler who sings in a minor key.";
          else mine = (await voices([id]))[0] ?? null;
        } catch (e) {
          console.warn(e);
          mineNote = "We couldn't check your own DRep just now.";
        }
      } else if (w) mineNote = "This wallet has no staking address, so it can't pick a DRep.";

      const bubble = (v: Voice, label: string) => `<div class="paper lt-paper l19-bubble"><div class="label">${label}</div>
        <div class="l19-name">${esc(v.name || short(v.id, 12, 6))}</div>
        ${v.says ? `<p class="l19-says">“${esc(v.says)}${v.says.length >= 420 ? "…" : ""}”</p>` : `<p class="l19-says">This caroler hums along without words: no statement published.</p>`}
        <div class="small">Votes with <b>${adaCompact(v.power)} ADA</b> behind them · ${v.active ? "active" : "not voting lately"} · <code>${esc(short(v.id, 10, 6))}</code></div></div>`;

      el.innerHTML = `<p>Cardano's big decisions are put to a vote. Most people hand their vote to a representative, called a DRep, who votes for them. ${num(list.length)}${list.length >= 1000 ? "+" : ""} DReps are registered. Here is one at your door.</p>
        <div class="l19-choir">${CHOIR}</div>
        ${pick ? bubble(pick, "A caroler at your door") : `<div class="card">The carolers we knocked for had no names on their songbooks. Try again.</div>`}
        ${pick && pick.id !== mine?.id ? `<p class="muted small center">A random pick, not a recommendation. Read what they stand for first.</p><div id="dg"></div>` : ""}
        <div class="lt-row"><button class="btn ghost" type="button" id="again">Another caroler</button></div>
        <h3>Your own caroler</h3>
        ${mine ? bubble(mine, "Sings for your wallet") : mineNote ? `<div class="card">${esc(mineNote)}</div>` : `<div id="cta"></div>`}
        ${explain(`<p>A DRep (delegated representative) votes on proposals like the ones behind Door 14. Your ADA never leaves your wallet: you only lend its voting weight, and you can change your mind any time.</p><p>Picking a DRep takes one small transaction. Wallets that never staked also put down a refundable deposit (2 ADA today). Your wallet needs a DRep (or "always abstain") before it can withdraw staking rewards.</p><p>The quote is the DRep's own published statement. We pick at random from registered DReps that voted recently and gave a name.</p>`)}`;
      $(el, "#again").onclick = rerender;
      const cta = el.querySelector<HTMLElement>("#cta");
      if (cta) walletCta(cta, "Connect a wallet to meet your own DRep");
      const dg = el.querySelector<HTMLElement>("#dg");
      if (dg && pick)
        delegateBox(dg, { kind: "drep", id: pick.id, name: pick.name || short(pick.id, 12, 6), label: `Give ${pick.name ? pick.name.slice(0, 30) : "this caroler"} your vote` });
    },
  },

  // ---------------------------------------------------------------- 20
  {
    day: 20,
    title: "Ghost of Christmas Past",
    emoji: "👻",
    kind: "read",
    teaser: "The first block of every Christmas Day since Cardano began.",
    async render(el) {
      const firstYear = state.network === "mainnet" ? 2017 : 2022;
      const lastYear = Date.now() >= Date.UTC(CAL_YEAR, 11, 25) ? CAL_YEAR : CAL_YEAR - 1;
      const years = Array.from({ length: Math.max(0, lastYear - firstYear + 1) }, (_, i) => lastYear - i); // newest first
      el.innerHTML = spinner("Rattling chains…");
      const rows = await Promise.allSettled(years.map((y) => K.getFirstBlockAfter(Date.UTC(y, 11, 25) / 1000)));
      const failed = rows.filter((r): r is PromiseRejectedResult => r.status === "rejected");
      // "The request failed" is not "there is no history": let the shell show the error and its retry.
      if (rows.length && failed.length === rows.length) throw failed[0].reason;
      const found = rows.map((r, i) => ({ y: years[i], b: r.status === "fulfilled" ? r.value : undefined, bad: r.status === "rejected" }));
      const shown = found.filter((r) => r.b || r.bad);
      if (!shown.length) {
        el.innerHTML = `<div class="card">This network has no Christmas behind it yet. Come back next year.</div>`;
        return;
      }
      const pools = await poolMap(shown.map((r) => r.b?.pool)).catch(() => new Map<string, K.PoolInfo>());
      el.innerHTML = `<p>The chain keeps every block ever made. Travel back: this is the very first block of each Christmas Day (midnight UTC), newest first.</p>
        <ol class="l20-line">${shown
          .map(({ y, b }) =>
            b
              ? `<li><span class="l20-globe">${globeSvg(str(b.hash, 64))}</span><div class="l20-body">
                  <div class="l20-y">${y}</div>
                  <div><a href="${explorerBlock(b.hash)}" target="_blank" rel="noopener">Block #${num(b.block_height)} ↗</a></div>
                  <div class="small">Epoch ${num(b.epoch_no)} · ${plural(Number(b.tx_count) || 0, "transaction")}</div>
                  <div class="small">${b.pool ? `Baked by ${esc(tickerOf(pools.get(b.pool), b.pool))}` : "Baked by Cardano's founding nodes, before community pools"}</div></div></li>`
              : `<li class="l20-miss"><span class="l20-globe">${globeSvg("")}</span><div class="l20-body"><div class="l20-y">${y}</div><div class="small">We couldn't reach this year just now.</div></div></li>`,
          )
          .join("")}</ol>
        ${failed.length ? `<div class="lt-row"><button class="btn ghost" type="button" data-rerender-door>Try the missing years again</button></div>` : ""}
        ${explain(`<p>Each snow globe is one real block: the first one made after midnight UTC on Dec 25 of that year. Nothing on a blockchain is ever deleted, so these can be looked up forever.</p>${state.network === "mainnet" ? `<p>Before mid-2020 Cardano's blocks came from a handful of founding nodes. Since then, thousands of community stake pools take turns.</p>` : ""}`)}`;
      acts(el);
    },
  },

  // ---------------------------------------------------------------- 21
  {
    day: 21,
    title: "Seal a Secret Wish",
    emoji: "🤫",
    kind: "tx",
    teaser: "Seal a wish today. Nobody can read it until you open it on Christmas Eve.",
    async render(el) {
      const w = live();
      const win = await mintWindow().catch(() => null); // only for a note; sealing works without it
      let rec = w ? readWish() : null;
      let lookupFailed = false;
      if (w && rec && !rec.tx) {
        // Written down, but we never heard back from the wallet. It may be on-chain all the same.
        el.innerHTML = spinner("Looking for your last wish…");
        try {
          const tx = await findCommit(w, rec.hash);
          if (tx) {
            rec = { ...rec, tx, prev: null };
            writeWish(rec);
          }
        } catch (e) {
          console.warn(e);
          lookupFailed = true;
        }
      }
      const sealed = sealedWish(rec);
      const pending = rec && !rec.tx ? rec : null;
      if (pending && !draft(21, "wish")) draft(21, "wish", pending.wish);

      el.innerHTML = `<p>Today only a scrambled fingerprint of your wish goes on-chain. Nobody can read it, not even us. On Christmas Eve you publish the wish and anyone can check it matches.</p>
        ${win?.locked ? `<div class="warn">Minting has closed for this year, so there is no Star left to light. You can still seal a wish and reveal it behind Door 24, just without a Star.</div>` : ""}
        ${
          sealed
            ? `<div class="l21-sealed" id="sealed"><div class="l21-env">${ENVELOPE}</div>
                <p class="center"><b>Your wish is sealed.</b> ${txLinkHtml(sealed.tx, "See the seal ↗")}</p>
                <details class="l21-peek"><summary>Peek at my wish</summary><p>“${esc(sealed.wish)}”</p></details>
                ${sealed.reveal ? `<p class="small muted center">You already revealed this wish. ${txLinkHtml(sealed.reveal, "See the reveal ↗")}</p>` : saveCodeHtml(sealed)}</div>`
            : ""
        }
        ${
          pending
            ? `<div class="warn">${
                lookupFailed
                  ? "We couldn't check whether your last wish reached the chain. Open this door again in a minute before sealing it a second time."
                  : `Your last wish was saved in this browser but we can't find it on-chain. If your wallet did send it, wait a minute and open this door again. If not, seal it again below.${sealed ? " Your earlier sealed wish stays safe until the new one is on-chain." : ""}`
              }</div>`
            : ""
        }
        <div class="paper lt-paper l21-sheet">
          <label for="l21-wish">${sealed ? "Write a different wish" : "Your wish"}</label>
          <textarea id="l21-wish" rows="3" maxlength="200" placeholder="I wish for…">${esc(draft(21, "wish"))}</textarea>
        </div>
        <p class="small muted">Sealing costs only the network fee, about 0.2 ADA.${sealed ? " A new wish takes the place of the old one on Dec 24." : ""}</p>
        <div id="act"></div>
        <div id="out"></div>
        ${explain(`<p>We mix your wish with a long random secret and run both through a one-way scrambler (SHA-256). Only the result, 64 letters and digits, is written to the chain. It gives nothing away, yet it could only have come from your exact wish.</p><p>Your wish and the secret stay in this browser, filed under the wallet you sealed with. Behind Door 24 you publish them, and anyone can scramble them again and see the same fingerprint. Save the reveal code if you might use another browser by then.</p>`)}`;

      const ta = $<HTMLTextAreaElement>(el, "#l21-wish");
      ta.oninput = () => draft(21, "wish", ta.value);
      acts(el, codeActs);

      const act = $(el, "#act");
      if (!committer(act, "Connect a wallet to seal it")) return;
      act.innerHTML = `<div class="lt-row"><button class="btn" type="button" id="go">Seal my wish</button></div>`;
      action($<HTMLButtonElement>(act, "#go"), $(el, "#out"), async () => {
        const wish = ta.value.trim();
        if (!wish) return oops("Write a wish first.");
        const old = readWish();
        // Sealing the same unsent wish again reuses its secret, so a first attempt that did get through still matches.
        const again = old && !old.tx && old.wish === wish ? old : null;
        const salt = again?.salt ?? toHex(crypto.getRandomValues(new Uint8Array(16)));
        const hash = again?.hash ?? (await sha256Hex(`${wish}|${salt}`));
        // 1. Write it down BEFORE the wallet opens, and make sure it stuck.
        if (!writeWish({ wish, salt, hash, tx: null, prev: sealedWish(old) }))
          return oops("This browser won't let us save your wish (a private window, or storage is full), so we stopped before sending anything. Try again in a normal window.");
        // 2. Only then put the fingerprint on-chain.
        let tx: string;
        try {
          tx = await sendWithMetadata({ [APP_LABEL]: { app: APP_ID, kind: "wish-commit", year: String(CAL_YEAR), sha256: hash } });
        } catch (e) {
          // Declined or never built: nothing was sent, so put things back. After a failed *submit* we can't be sure, so the note stays.
          const phase = (e as { phase?: string } | null)?.phase;
          if (phase === "build" || phase === "sign") writeWish(old);
          throw e;
        }
        // 3. Fill in the transaction.
        const done: Wish = { wish, salt, hash, tx, prev: null };
        const saved = writeWish(done);
        draft(21, "wish", "");
        el.querySelector("#sealed")?.remove();
        return `<div class="l21-env l21-go">${ENVELOPE}</div>
          ${txSuccess(tx, "Your wish is sealed. Only its fingerprint is on-chain.")}
          ${saved ? "" : `<div class="warn">This browser didn't keep the finished record. Save the reveal code below now: it is the only copy.</div>`}
          ${saveCodeHtml(done)}
          <p class="small muted" data-once>Come back on Dec 24 to open it behind Door 24.</p>
          <details class="explain"><summary>What exactly went on-chain?</summary><div class="explain-body"><p>Only this fingerprint:</p><code class="lt-wrap">${esc(hash)}</code></div></details>`;
      });
    },
  },

  // ---------------------------------------------------------------- 22
  {
    day: 22,
    title: "Hang Your Ornaments",
    emoji: "🎄",
    kind: "wallet",
    teaser: "Your ornaments, hung on your own tree, with a link to show friends.",
    async render(el) {
      const friend = `<h3>Visit a friend</h3><div id="l22-friend"></div>`;
      const why = explain(`<p>Every ornament here is an NFT sitting in a wallet. Its picture is read from the transaction that created it, so the chain itself is the photo album.</p><p>A tree link works for anyone, with no wallet and no account: it simply asks the chain what that wallet holds. Ornaments a friend gifted you (Door 17) hang here too.</p>`);
      const w = live();
      if (!w) {
        el.innerHTML = `<p>Every ornament you mint hangs on a tree of your own, read straight from the chain. Your tree gets a link, so friends can come and look.</p>
          <div class="l22-tree">${treeSvg(await sha256Hex(`cardano-advent-${CAL_YEAR}`))}</div>
          <p class="center"><span class="lt-sample">Sample</span> <span class="small muted">Yours will carry your own ornaments.</span></p>
          <div id="cta"></div>${friend}${why}`;
        walletCta($(el, "#cta"), "Connect a wallet to see your tree");
        friendForm(el);
        return;
      }
      el.innerHTML = spinner("Unpacking the ornament box…");
      const { items, partial } = await collect(w);
      if (!items.length && partial) throw new Error("We couldn't look inside your ornament box just now. Please try again.");
      if (!items.length) {
        el.innerHTML = `<div class="card">Your ornament box is empty. Mint one behind Door 15, then come back: a new ornament takes about a minute to arrive.
          <div class="lt-row"><button class="btn" type="button" data-door="15">Go to Door 15</button><button class="btn ghost" type="button" data-rerender-door>Look again</button></div></div>${friend}${why}`;
        acts(el);
        friendForm(el);
        return;
      }
      el.innerHTML = `<div id="l22-mine"></div>${friend}${why}`;
      drawTree($(el, "#l22-mine"), items, {
        seed: await sha256Hex(w.rewardAddress ?? w.changeAddress),
        mine: true,
        stake: w.rewardAddress,
        note: partial ? "We couldn't check for ornaments friends sent you just now. Your own are all here." : undefined,
      });
      friendForm(el);
    },
  },

  // ---------------------------------------------------------------- 23
  {
    day: 23,
    title: "Elf Workload Report",
    emoji: "🛷",
    kind: "read",
    teaser: "How full is the sleigh? The last 20 blocks, loaded up.",
    async render(el) {
      el.innerHTML = spinner("Loading the sleighs…");
      const blocks = [...(await K.getLatestBlocks(20))].reverse(); // copy first, then oldest → newest
      if (!blocks.length) {
        el.innerHTML = `<div class="card">No sleighs on the runway. Try again in a moment.</div><div class="lt-row"><button class="btn ghost" type="button" data-rerender-door>Look again</button></div>`;
        acts(el);
        return;
      }
      const pools = await poolMap(blocks.map((b) => b.pool)).catch(() => new Map<string, K.PoolInfo>());
      const MAX_BLOCK = 90112; // room in one block, in bytes (a network setting)
      const full = (b: K.Block) => Math.max(0, Math.min(1, (Number(b.block_size) || 0) / MAX_BLOCK));
      const pct = (x: number) => `${(x * 100).toFixed(x > 0 && x < 0.1 ? 1 : 0)}%`;
      const avg = blocks.reduce((s, b) => s + full(b), 0) / blocks.length;
      const busiest = blocks.reduce((a, b) => (full(b) > full(a) ? b : a));
      const mins = Math.max(1, Math.round((blocks[blocks.length - 1].block_time - blocks[0].block_time) / 60));
      const baker = (b: K.Block) => (b.pool ? tickerOf(pools.get(b.pool), b.pool) : "unknown");
      el.innerHTML = `<div class="l23-head"><div class="l23-num">${pct(avg)}</div>
          <div><b>The sleigh is ${pct(avg)} full right now.</b><div class="small muted">Average load of the last ${blocks.length} blocks, about ${plural(mins, "minute")} of Cardano. ${avg < 0.5 ? "Plenty of room, so nobody waits." : "Getting crowded."}</div></div></div>
        <div class="l23-grid">${blocks
          .map((b) => {
            const f = full(b);
            const n = b.tx_count > 0 ? Math.max(1, Math.round(f * 6)) : 0;
            return `<button type="button" class="l23-sleigh" aria-pressed="false" aria-label="Block ${b.block_height}, ${pct(f)} full">${sleighSvg(n)}</button>`;
          })
          .join("")}</div>
        <p class="small muted center">One sleigh per block, oldest first. Tap one.</p>
        <div id="detail" aria-live="polite"></div>
        <div class="card"><div class="label">Heaviest load</div>Block #${num(busiest.block_height)}, packed by <b>${esc(baker(busiest))}</b>: ${plural(busiest.tx_count, "transaction")}, ${pct(full(busiest))} full.</div>
        <div class="lt-row"><button class="btn ghost" type="button" data-rerender-door>Check again</button></div>
        ${explain(`<p>A block is a sleigh that leaves about every 20 seconds, with room for roughly 90 kilobytes of transactions. Each sleigh here shows one to six presents, by how much of that room was used. An empty sleigh carried no transactions at all.</p><p>Mostly empty sleighs are good news for you: there is no queue, and fees stay the same small amount.</p>`)}`;
      acts(el);
      const detail = $(el, "#detail");
      pickable(
        el,
        ".l23-sleigh",
        (i) => {
          const b = blocks[i];
          detail.innerHTML = `<div class="paper lt-paper l23-detail"><div class="label">Block #${num(b.block_height)} · ${esc(ago(b.block_time))}</div>
            <div class="l23-fill"><b>${pct(full(b))} full</b> · ${plural(Number(b.tx_count) || 0, "transaction")}</div>
            <div class="lt-meter"><div style="width:${(full(b) * 100).toFixed(1)}%"></div></div>
            <p class="small">Packed by ${esc(baker(b))} · <a href="${explorerBlock(b.hash)}" target="_blank" rel="noopener">Open this block ↗</a></p></div>`;
        },
        blocks.length - 1,
      );
    },
  },

  // ---------------------------------------------------------------- 24
  {
    day: 24,
    title: "Light the Star",
    emoji: "⭐",
    kind: "mint",
    teaser: "The finale: light the Star on top of your tree and open your sealed wish.",
    async render(el) {
      const starName = `ChristmasStar${CAL_YEAR}`;
      const opened = Object.keys(getOpened()).map(Number).filter((d) => d >= 1 && d <= 24);
      const hero = (inner: string, cls = "") => `<div class="l24-hero ${cls}">${inner}</div>`;
      const why = explain(`<p>The Star is an NFT made under the same one-wallet rule as your ornaments (Door 15), so only someone who holds an ornament can have one, and only one per wallet. Its picture is stored on-chain: a dot in the ring for each door you opened, a ray for each ornament on your tree.</p><p>Revealing a wish publishes the wish and its random secret. Anyone can scramble the two again and compare the result with the fingerprint you sealed behind Door 21.</p>`);
      const w = live();

      if (!w) {
        const sample = starSvg({ seed: await sha256Hex(`star-${CAL_YEAR}`), opened, ornaments: 0 });
        el.innerHTML = `${hero(imgTag(sample, "A sample Christmas Star"))}
          <p class="center"><span class="lt-sample">Sample</span> <span class="small muted">Yours is drawn from the ${plural(opened.length, "door")} you opened and the ornaments on your tree.</span></p>
          <p>The last door. Light a Star on top of your tree: an NFT that only people with an ornament can make. And if you sealed a wish on Dec 21, this is where you open it.</p>
          <ul class="l24-list">
            <li><button type="button" class="l24-item" data-door="15"><span class="l24-mark"></span><span>Hang at least one ornament on your tree</span><span class="l24-go">Door 15</span></button></li>
            <li><button type="button" class="l24-item" data-door="21"><span class="l24-mark"></span><span>Seal a wish, if you like</span><span class="l24-go">Door 21</span></button></li>
          </ul>
          <div id="cta"></div>${why}`;
        acts(el);
        walletCta($(el, "#cta"), "Connect a wallet to light your Star");
        return;
      }

      el.innerHTML = spinner("Checking your tree…");
      const [f, win, ws] = await Promise.all([findOrnaments(w), mintWindow(), wishState(w)]);
      const orns = [...f.ornaments].sort();

      // One lookup: the lit Star's own picture, or the glass colour of the first ornament for the glow.
      let tint: string | undefined;
      let litImg = "";
      try {
        const [it] = await describe([pairOf(f.star ?? orns[0] ?? "")].filter((p) => p[0].length === 56));
        if (it?.star) litImg = it.img;
        else if (it) tint = GLASS_TINT[it.traits.find(([k]) => k === "Glass")?.[1] ?? ""];
      } catch (e) {
        console.warn(e);
      }
      const starArt = starSvg({ seed: f.policyId, opened, ornaments: orns.length, tint });

      // A Star we sent that isn't in the wallet yet. Transactions expire after about an hour.
      const starKey = wkey("star");
      const rawSent = store.get<{ tx?: unknown; at?: unknown } | null>(starKey, null);
      const sentTx = rawSent && typeof rawSent.tx === "string" && HEX64.test(rawSent.tx) && Date.now() - Number(rawSent.at) < 75 * 60_000 ? rawSent.tx : "";

      type Mode = "lit" | "sent" | "locked" | "empty" | "ready";
      const mode: Mode = f.star ? "lit" : sentTx ? "sent" : win.locked ? "locked" : orns.length ? "ready" : "empty";

      const paste = `<details class="l24-paste"><summary>Sealed it in another browser? Paste your reveal code</summary>
        <textarea id="code" rows="3" class="mono" spellcheck="false" autocapitalize="off" placeholder="The code you saved on Dec 21"></textarea>
        <div class="lt-row"><button type="button" class="btn ghost" id="usecode">Use this code</button></div><div id="codeout" aria-live="polite"></div></details>`;
      const again = `<div class="lt-row"><button type="button" class="btn ghost" data-rerender-door>Check again</button></div>`;
      const s = ws.rec;
      const wishHtml = (): string => {
        switch (ws.status) {
          case "ok":
            return `<div class="paper lt-paper l24-wish"><div class="label">Your sealed wish</div><p class="l24-wishtext">“${esc(s!.wish)}”</p>
              <p class="small">It matches the fingerprint you sealed on-chain. ${txLinkHtml(s!.tx, "See the seal ↗")}</p>
              ${
                mode === "ready"
                  ? `<label class="l24-check"><input type="checkbox" id="reveal" checked> <span>Publish my wish when the Star lights up. It becomes public for good.</span></label>`
                  : `<div class="lt-row"><button class="btn" type="button" id="revealnow">Reveal my wish</button></div>
                     <p class="small">It becomes public for good. Costs only the network fee, about 0.2 ADA.</p><div id="revealout"></div>`
              }</div>`;
          case "revealed":
            return `<div class="paper lt-paper l24-wish"><div class="label">Your wish, out in the open</div><p class="l24-wishtext">“${esc(s!.wish)}”</p>
              <p class="small">Anyone can check it against the seal. ${txLinkHtml(s!.reveal ?? "", "See the reveal ↗")}</p></div>`;
          case "mismatch":
            return `<div class="warn">The wish saved in this browser doesn't match the fingerprint on-chain, so we won't publish it. If you kept your reveal code, paste it below.</div>${paste}`;
          case "unconfirmed":
            return `<div class="card">Your sealed wish isn't in a block yet. Give it a minute, then check again.</div>${again}${paste}`;
          case "unknown":
            return `<div class="card">We couldn't check your sealed wish just now.</div>${again}`;
          default:
            return `<div class="card"><div class="label">Your sealed wish</div>No sealed wish found for this wallet in this browser.${mode === "ready" ? " That's fine: the Star shines without one." : ""}</div>${paste}`;
        }
      };

      const wished = ws.status === "ok" || ws.status === "revealed";
      const list = `<ul class="l24-list">
        <li><button type="button" class="l24-item${orns.length ? " done" : ""}" data-door="15"><span class="l24-mark">${orns.length ? TICK : ""}</span><span>${orns.length ? `${plural(orns.length, "ornament")} on your tree` : "Hang at least one ornament on your tree"}</span><span class="l24-go">Door 15</span></button></li>
        <li><button type="button" class="l24-item${wished ? " done" : ""}" data-door="21"><span class="l24-mark">${wished ? TICK : ""}</span><span>${wished ? "A wish, sealed and waiting" : "Seal a wish, if you like"}</span><span class="l24-go">Door 21</span></button></li>
        <li><div class="l24-item done"><span class="l24-mark">${TICK}</span><span>${plural(opened.length, "door")} of 24 opened</span></div></li></ul>`;
      const closes = `<p class="small muted center">Minting closes ${esc(localTime(win.lockMs))} your time.</p>`;
      const after = `<div class="lt-row"><button class="btn" type="button" data-act="share">Share your Star</button><button class="btn ghost" type="button" data-door="22">See it on your tree</button></div><div data-share-out></div>`;

      let body: string;
      if (mode === "lit")
        body = `${hero(litImg ? `<img src="${litImg}" alt="Your Christmas Star">` : imgTag(starArt, "Your Christmas Star"), "l24-lit")}
          <h3 class="center">Your Star is lit.</h3><p class="center">It sits on top of your tree for good. Merry Christmas.</p>${after}${wishHtml()}`;
      else if (mode === "sent")
        body = `${hero(imgTag(starArt, "Your Christmas Star"), "l24-lit")}<div id="sent">${txSuccess(sentTx, "Your Star is on its way to the top of your tree.")}</div>${after}${wished ? wishHtml() : ""}`;
      else if (mode === "locked")
        body = `${hero(imgTag(starArt, "The Christmas Star"), "l24-dim")}
          <div class="card"><b>The workshop is closed.</b> Minting ended on ${esc(localTime(win.lockMs))} your time, so no new Stars can be lit this year. A sealed wish can still be opened.</div>${wishHtml()}`;
      else if (mode === "empty")
        body = `${hero(imgTag(starArt, "The Christmas Star"), "l24-dim")}
          <p>The last door. The Star goes on top of a tree, so you need at least one ornament before you can light it.</p>${list}
          <div class="lt-row"><button class="btn" type="button" data-door="15">Mint an ornament first</button></div>${closes}${wishHtml()}`;
      else
        body = `${hero(imgTag(starArt, "Your Christmas Star"))}
          <p class="center small muted">A dot in the ring for each door you opened, a ray for each ornament${tint ? ", glowing in the colour of your first ornament" : ""}.</p>
          ${list}
          <p>One transaction lights the Star${ws.status === "ok" ? " and, if you like, opens your wish at the same moment" : ""}. There is one Star per wallet, and it can't be made twice.</p>
          ${wishHtml()}
          <div class="lt-row"><button class="btn l24-btn" type="button" id="go">Light the Star</button></div>
          ${COST_MINT}${closes}<div id="out"></div>`;
      el.innerHTML = body + why;

      const shareArt = (): string => {
        if (!litImg) return starArt;
        try {
          return fromB64(litImg.slice(litImg.indexOf(",") + 1));
        } catch {
          return starArt;
        }
      };
      acts(el, {
        share: (btn) =>
          void share(btn.closest(".lt-row")?.nextElementSibling as HTMLElement | null, {
            title: `My Christmas Star ${CAL_YEAR}`,
            line: `${plural(opened.length, "door")} opened, ${plural(orns.length, "ornament")} on the tree`,
            artSvg: shareArt(),
            filename: `christmas-star-${CAL_YEAR}.png`,
            text: `I lit my Christmas Star in the Cardano Advent calendar ${CAL_YEAR}.`,
          }),
      });

      // paste a reveal code saved in another browser
      const useCode = el.querySelector<HTMLButtonElement>("#usecode");
      if (useCode)
        useCode.onclick = async () => {
          const outc = $(el, "#codeout");
          const parsed = parseRevealCode($<HTMLTextAreaElement>(el, "#code").value);
          if (!parsed) return void (outc.innerHTML = oops("That code doesn't look right. Paste all of it, exactly as you saved it."));
          useCode.disabled = true;
          outc.innerHTML = spinner("Looking for your sealed wish…");
          try {
            if ((await sha256Hex(`${parsed.wish}|${parsed.salt}`)) !== parsed.hash)
              return void (outc.innerHTML = oops("This code is damaged: the wish inside doesn't match its own fingerprint."));
            const tx = await findCommit(w, parsed.hash);
            if (!tx)
              return void (outc.innerHTML = oops("We couldn't find a sealed wish with this fingerprint in this wallet's recent transactions. Connect the wallet you sealed it with."));
            if (!writeWish({ ...parsed, tx, prev: null }))
              return void (outc.innerHTML = oops("This browser won't let us keep the wish (a private window, or storage is full). Try a normal window."));
            rerender();
          } catch (e) {
            console.error(e);
            outc.innerHTML = errorBox(e);
          } finally {
            useCode.disabled = false;
          }
        };

      // reveal only: no Star involved, so a sealed wish can always be opened
      const revealNow = el.querySelector<HTMLButtonElement>("#revealnow");
      if (revealNow && s && ws.status === "ok")
        action(revealNow, $(el, "#revealout"), async () => {
          const tx = await sendWithMetadata({ [APP_LABEL]: revealMeta(s) });
          writeWish({ ...s, reveal: tx, prev: null });
          return txSuccess(tx, "Your wish is out in the open. Anyone can check it against the seal.") + `<span data-once hidden></span>`;
        });

      let stop: (() => void) | undefined;
      const sent = el.querySelector<HTMLElement>("#sent");
      if (sent) stop = trackTx(sent);

      const go = el.querySelector<HTMLButtonElement>("#go");
      if (go)
        action(go, $(el, "#out"), async () => {
          const reveal = !!s && ws.status === "ok" && (el.querySelector<HTMLInputElement>("#reveal")?.checked ?? false);
          const { txHash } = await mintNft(
            starName,
            {
              name: `Christmas Star ${CAL_YEAR}`,
              image: chunk64(svgDataUri(starArt)),
              mediaType: "image/svg+xml",
              description: meta64(`Lit on a tree with ${plural(orns.length, "ornament")}. Cardano Advent ${CAL_YEAR}.`),
              app: APP_ID,
              doorsOpened: String(opened.length),
              ornaments: String(orns.length),
              ...(reveal ? { commitTx: s!.tx } : {}),
            },
            reveal ? { [APP_LABEL]: revealMeta(s!) } : {},
          );
          store.set(starKey, { tx: txHash, at: Date.now() });
          if (reveal) writeWish({ ...s!, reveal: txHash, prev: null });
          const box = el.querySelector<HTMLInputElement>("#reveal");
          if (box) box.disabled = true;
          el.querySelector(".l24-hero")?.classList.add("l24-lit");
          confetti(document.body, 140);
          return (
            txSuccess(txHash, reveal ? "The Star is lit, and your wish is out in the open. Merry Christmas." : "The Star is lit. Merry Christmas.") +
            `<div data-once>${after}</div>`
          );
        });

      return () => stop?.();
    },
  },
];
