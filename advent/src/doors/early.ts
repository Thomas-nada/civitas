// Doors 1–12.
import "./early.css";
import { flakeSvg, snowmanSvg, treeSvg } from "../art";
import { APP_ID, CAL_YEAR, explorerBlock, explorerPool, state, store } from "../config";
import * as K from "../koios";
import { $, ada, adaCompact, ago, chunk64, duration, errorBox, esc, num, short, spinner, txLinkHtml, txSuccess } from "../ui";
import { networkMismatch, sendWithMetadata, signMessage, wallet, wkey } from "../wallet";
import { action, delegateBox, draft, explain, failBox, lovelaceOf, poolMap, poolName, shareBtnHtml, softFail, str, tickerOf, txOutputs, walletCta, wireShare } from "./shared";
import type { Door } from "./types";

// ---------------------------------------------------------------- small helpers

const mq = (q: string) => typeof matchMedia === "function" && matchMedia(q).matches;
const reduceMotion = () => mq("(prefers-reduced-motion: reduce)");
const isPhone = () => mq("(max-width: 520px)");
const HEX64 = /^[0-9a-f]{64}$/i;
const POOL_ID = /^pool1[0-9a-z]{20,80}$/;
const n1 = (n: number) => +n.toFixed(1);
/** A wallet we can actually use: connected, and on the same network as the calendar. */
const usable = () => (wallet && !networkMismatch() ? wallet : null);
const plural = (n: number, one: string, many = one + "s") => `${num(n)} ${n === 1 ? one : many}`;

// ---------------------------------------------------------------- door 1: heartbeat art

const HEART_D = "M50 86C18 62 4 46 4 27 4 13 15 4 27 4c10 0 18 5 23 14C55 9 63 4 73 4c12 0 23 9 23 23 0 19-14 35-46 59z";
const ECG_D = "M0 30H120l8-7 8 7h14l7 9 10-36 10 46 7-19h16l10-9 10 9H400";

/** The heart + ECG strip. `flat` is the "can't reach the chain" state. */
const heartMonitor = (inner: string, flat = false) => `<div class="hb-monitor${flat ? " flat" : ""}" id="mon">
  <span class="hb-heartwrap"><svg class="hb-heart" viewBox="0 0 100 92" aria-hidden="true"><path class="hb-body" d="${HEART_D}"/><path class="hb-shine" d="M21 28c0-8 5-13 12-14"/></svg></span>
  ${inner}
  <svg class="hb-ecg" viewBox="0 0 400 56" aria-hidden="true"><path class="hb-ecg-base" d="${flat ? "M0 30H400" : ECG_D}"/>${flat ? "" : `<path class="hb-ecg-live" pathLength="1" d="${ECG_D}"/>`}</svg>
</div>`;

// ---------------------------------------------------------------- door 2: chef's hat

const CHEF_HAT = `<svg class="bk-hat" viewBox="0 0 48 48" aria-hidden="true"><path d="M14 30c-6-1-9-6-7-11s8-7 12-4c2-5 12-5 14 0 5-2 10 2 9 7-1 4-4 7-8 8v8H14z" fill="#fffaf0" stroke="#e2cfa3" stroke-width="1.5" stroke-linejoin="round"/><path d="M15 33.5h18" stroke="#e2cfa3" stroke-width="1.5" stroke-linecap="round"/></svg>`;

// ---------------------------------------------------------------- door 4: fortunes + cookie

const FORTUNES = [
  "Some ADA you forgot about will bring you joy this season.",
  "Your next transaction will be confirmed faster than you can say 'Ouroboros'.",
  "Patience, young elf: staking rewards arrive every five days.",
  "Someone is thinking of sending you a token.",
  "Your fee will be small and your cheer will be large.",
  "The stake pool of your dreams is only one tap away.",
  "Not your keys, not your cookies. Guard your recovery phrase like Santa's list.",
  "Good things come to those who wait about twenty seconds.",
  "This year you will finally tidy up that messy wallet.",
  "On Cardano, time ticks in one-second slots. Use yours well.",
  "Great things come in small, predictable packages.",
  "Your vote counts, even when someone else carries it for you.",
  "Your wallet may be lighter, but your heart is fuller.",
  "A surprise token will land in your wallet. Do not click its links.",
  "Five days of patience beat one day of panic.",
  "The chain remembers every kindness you write to it.",
  "Even Santa checks his list twice. Check the address once more before you send.",
  "A promise signed with your key carries more weight than ink.",
  "You need nobody's permission to shine.",
  "Your stake is small, but every snowflake makes a blizzard.",
  "Look under the tree: your change was there all along.",
  "Treasury withdrawal approved: one (1) cup of hot cocoa.",
  "Peace on earth, finality on chain.",
  "The elves made this block just for you. Probably.",
];

/** Only shown when the block hash starts with 00 (about 1 block in 256). */
const RARE_FORTUNES = [
  "A golden cookie! Whatever you build this year will still be standing next Christmas.",
  "Only one block in 256 bakes a golden cookie. Luck this rare is meant to be shared.",
  "The whole chain paused, just for a blink, to wish you well. Make a wish.",
];

/**
 * The drawn cookie: two halves and a paper tab between them. In the page the halves are
 * moved by CSS (`.fc-cookie.open`); `openStatic` bakes the open pose in for the share picture.
 */
function cookieSvg(golden: boolean, openStatic = false): string {
  const [c, d, l] = golden ? ["#ffd166", "#e9a800", "#fff6cf"] : ["#e3b062", "#b8782a", "#f6d9a4"];
  const tl = openStatic ? ` transform="translate(-16 4) rotate(-20 100 104)"` : "";
  const tr = openStatic ? ` transform="translate(16 4) rotate(20 100 104)"` : "";
  const star = (x: number, y: number, s: number) =>
    `<path class="fc-spark" d="M${x} ${y - s}l${n1(s * 0.3)} ${n1(s * 0.7)} ${n1(s * 0.7)} ${n1(s * 0.3)}-${n1(s * 0.7)} ${n1(s * 0.3)}-${n1(s * 0.3)} ${n1(s * 0.7)}-${n1(s * 0.3)}-${n1(s * 0.7)}-${n1(s * 0.7)}-${n1(s * 0.3)} ${n1(s * 0.7)}-${n1(s * 0.3)}z"/>`;
  const sparks = golden ? `<g fill="#fff6cf">${star(22, 18, 8)}${star(180, 20, 7)}${star(166, 106, 6)}${star(30, 100, 5)}</g>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120" aria-hidden="true"><rect class="fc-tab" x="89" y="24" width="22" height="60" rx="2" fill="#fffaf0"/><g class="fc-l"${tl}><path d="M100 34C80 10 36 8 18 40 6 62 16 96 48 104c24 6 44-12 52-34z" fill="${c}" stroke="${d}" stroke-width="3" stroke-linejoin="round"/><path d="M92 50C74 40 50 44 36 62" fill="none" stroke="${d}" stroke-width="3" stroke-linecap="round"/><path d="M30 44c8-12 22-18 36-18" fill="none" stroke="${l}" stroke-width="4" stroke-linecap="round" opacity=".85"/></g><g class="fc-r"${tr}><path d="M100 34C120 10 164 8 182 40c12 22 2 56-30 64-24 6-44-12-52-34z" fill="${c}" stroke="${d}" stroke-width="3" stroke-linejoin="round"/><path d="M108 50c18-10 42-6 56 12" fill="none" stroke="${d}" stroke-width="3" stroke-linecap="round"/><path d="M170 44c-8-12-22-18-36-18" fill="none" stroke="${l}" stroke-width="4" stroke-linecap="round" opacity=".85"/></g>${sparks}</svg>`;
}

// ---------------------------------------------------------------- door 5: scorecard

interface Check {
  ok: boolean;
  pts: number;
  text: string;
  /** One line on how to get nicer, shown only when the check failed. */
  tip?: string;
  /** Optional link to another door: [day, label]. */
  door?: [number, string];
}

function niceChecks(acc: K.AccountInfo | undefined, txCount: number): Check[] {
  const rewards = Number(acc?.rewards_available ?? 0) || 0;
  const balance = Number(acc?.total_balance ?? 0) || 0;
  const staking = !!str(acc?.delegated_pool);
  const drep = !!str(acc?.delegated_drep);
  const reward: Check =
    rewards === 0
      ? { ok: true, pts: 10, text: "No rewards left lying around" }
      : drep
        ? { ok: true, pts: 10, text: `${ada(rewards)} ADA in staking rewards, ready to collect whenever you like` }
        : {
            ok: false,
            pts: 10,
            text: `${ada(rewards)} ADA in staking rewards is stuck`,
            tip: "Rewards can only be collected once you have picked a voting representative. Do that and they are yours.",
          };
  return [
    staking
      ? { ok: true, pts: 30, text: "Staking with a pool. You help keep Cardano running" }
      : {
          ok: false,
          pts: 30,
          text: "Not staking yet",
          tip: "Pick a stake pool in your wallet. It is free and your ADA never leaves your wallet.",
          door: [11, "Meet a pool behind Door 11"],
        },
    drep
      ? { ok: true, pts: 25, text: "Your vote is in good hands: you chose a representative (or chose to abstain)" }
      : {
          ok: false,
          pts: 25,
          text: "No voting choice yet",
          tip: "Choose a representative (a DRep) in your wallet's governance tab.",
          door: [19, "Meet one behind Door 19"],
        },
    txCount >= 10
      ? { ok: true, pts: 15, text: `Active elf: ${txCount >= 1000 ? "1,000+" : num(txCount)} transactions` }
      : {
          ok: false,
          pts: 15,
          text: `Only ${plural(txCount, "transaction")} so far`,
          tip: "Every door that writes to the chain counts.",
          door: [12, "Write Santa a letter behind Door 12"],
        },
    txCount >= 100
      ? { ok: true, pts: 10, text: "Seasoned regular: more than 100 transactions" }
      : { ok: false, pts: 10, text: "Fewer than 100 transactions", tip: "This one just takes time. Keep using your wallet." },
    balance > 0
      ? { ok: true, pts: 10, text: `Holding ${ada(balance)} ADA` }
      : { ok: false, pts: 10, text: "An empty stocking", tip: "Add a little ADA to this wallet." },
    reward,
  ];
}

const SAMPLE_CHECKS: Check[] = [
  { ok: true, pts: 30, text: "Staking with a pool. You help keep Cardano running" },
  { ok: false, pts: 25, text: "No voting choice yet", tip: "Choose a representative (a DRep) in your wallet's governance tab." },
  { ok: true, pts: 15, text: "Active elf: 42 transactions" },
  { ok: false, pts: 10, text: "Fewer than 100 transactions", tip: "This one just takes time. Keep using your wallet." },
  { ok: true, pts: 10, text: "Holding 1,250 ADA" },
  { ok: false, pts: 10, text: "3.2 ADA in staking rewards is stuck", tip: "Rewards can only be collected once you have picked a voting representative." },
];

const scoreOf = (checks: Check[]) => checks.reduce((s, c) => s + (c.ok ? c.pts : 0), 0);

const verdictOf = (score: number) =>
  score >= 70
    ? { word: "NICE", color: "#1f7a50", line: "You are at the top of the list. Expect extra stocking stuffers." }
    : score >= 40
      ? { word: "NEARLY", color: "#a86f00", line: "Nearly nice. A tweak or two and you are on the list." }
      : { word: "NAUGHTY", color: "#b81f30", line: "Coal for now, but there is still time before the 24th." };

/** Rubber-stamp artwork in a 220×120 box (no outer <svg>, so it can be reused in the share picture). */
function stampInner(word: string, color: string): string {
  const size = word.length <= 4 ? 44 : word.length <= 6 ? 36 : 30;
  return `<g transform="rotate(-8 110 60)" fill="none" stroke="${color}"><rect x="12" y="18" width="196" height="84" rx="12" stroke-width="6"/><rect x="22" y="28" width="176" height="64" rx="7" stroke-width="2"/><text x="110" y="70" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="${size}" letter-spacing="3" fill="${color}" stroke="none">${word}</text><text x="110" y="86" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="11" letter-spacing="2" fill="${color}" stroke="none">SANTA'S LIST ${CAL_YEAR}</text></g>`;
}
const stampSvg = (word: string, color: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 120" role="img" aria-label="Stamp: ${word}">${stampInner(word, color)}</svg>`;

const MARK_YES = `<svg class="nn-mark" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#2f8a5f"/><path d="M5.5 10.5l3 3 6-7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const MARK_NO = `<svg class="nn-mark" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.2" fill="none" stroke="#a08a63" stroke-width="1.6" stroke-dasharray="3 2.6"/></svg>`;

function scorecardHtml(checks: Check[], sample: boolean): string {
  const score = scoreOf(checks);
  const v = verdictOf(score);
  return `<div class="nn-card on-paper${sample ? " is-sample" : ""}">
    ${sample ? `<div class="sample-tag">Sample scorecard · not a real wallet</div>` : ""}
    <div class="nn-top">
      <div class="nn-score"><span class="nn-num" id="sc">${sample ? score : 0}</span><span class="nn-of">/100</span></div>
      <div class="nn-stamp${sample ? "" : " wait"}" id="stamp">${stampSvg(v.word, v.color)}</div>
    </div>
    <p class="nn-line">${esc(v.line)}</p>
    <ul class="nn-checks">${checks
      .map(
        (c) => `<li class="${c.ok ? "yes" : "no"}">${c.ok ? MARK_YES : MARK_NO}
        <div><span class="nn-what">${esc(c.text)}</span>${
          !c.ok && c.tip
            ? `<div class="nn-tip"><b>How to get nicer:</b> ${esc(c.tip)}${c.door && !sample ? ` <button class="nn-link" type="button" data-goto-door="${c.door[0]}">${esc(c.door[1])}</button>` : ""}</div>`
            : ""
        }</div>
        <span class="nn-pts">${c.ok ? "+" + c.pts : "0"}<span class="nn-ptsof"> of ${c.pts}</span></span></li>`,
      )
      .join("")}</ul>
  </div>`;
}

const NICE_EXPLAIN = `<p>Santa reads the public record of your wallet's staking account: whether your ADA is staked with a pool, whether you have chosen someone to vote for you, how many transactions you have made, and whether rewards are waiting.</p>
  <p>Staking never moves or locks your ADA. The score is just for fun; nobody else can see it unless you share it.</p>`;

// ---------------------------------------------------------------- door 6: wreath

/** A drawn wreath with one candle per day of the epoch. `full` days have burned; day `full` is `frac` burned. */
function wreathSvg(days: number, full: number, frac: number): string {
  const cx = 150, cy = 170, R = 100;
  const greens = ["#2f8a5f", "#256e4c", "#3a9c6d"];
  let leaves = "";
  const L = 40;
  for (let i = 0; i < L; i++) {
    const a = n1((i / L) * 360);
    leaves += `<ellipse cx="${cx}" cy="${cy - R - 7}" rx="7" ry="17" fill="${greens[i % 3]}" transform="rotate(${a} ${cx} ${cy}) rotate(28 ${cx} ${cy - R - 7})"/>`;
    leaves += `<ellipse cx="${cx}" cy="${cy - R + 8}" rx="6.5" ry="16" fill="${greens[(i + 1) % 3]}" transform="rotate(${n1(a + 4.5)} ${cx} ${cy}) rotate(-30 ${cx} ${cy - R + 8})"/>`;
  }
  let berries = "";
  for (let i = 0; i < 9; i++) {
    const a = ((i + 0.5) / 9) * Math.PI * 2;
    const x = cx + Math.cos(a) * (R + (i % 2 ? 6 : -5));
    const y = cy + Math.sin(a) * (R + (i % 2 ? 6 : -5));
    berries += `<circle cx="${n1(x)}" cy="${n1(y)}" r="4.2" fill="#d62839"/><circle cx="${n1(x - 1.3)}" cy="${n1(y - 1.4)}" r="1.2" fill="#fff" opacity=".7"/>`;
  }
  let candles = "";
  for (let i = 0; i < days; i++) {
    const a = ((-90 + (i * 360) / days) * Math.PI) / 180;
    const x = n1(cx + Math.cos(a) * R);
    const y = n1(cy + Math.sin(a) * R);
    const lit = i <= full;
    const h = n1(i < full ? 18 : i === full ? 36 - 18 * frac : 36);
    const top = n1(y - h);
    candles += `<ellipse cx="${x}" cy="${y}" rx="11" ry="4" fill="#e9a800"/><rect x="${n1(x - 7)}" y="${top}" width="14" height="${h}" rx="3" fill="#fffaf0" stroke="#e2cfa3"/><path d="M${x} ${top}v-5" stroke="#3b2a12" stroke-width="1.5" stroke-linecap="round"/>`;
    if (lit)
      candles += `<circle class="wr-glow" cx="${x}" cy="${n1(top - 13)}" r="15" fill="#ff9d3c" opacity=".28"/><g class="wr-flame"><path d="M${x} ${n1(top - 25)}c7 10 6 20 0 20s-7-10 0-20z" fill="#ff9d3c"/><path d="M${x} ${n1(top - 17)}c3.5 5 3 11 0 11s-3.5-6 0-11z" fill="#ffd166"/></g>`;
  }
  // a bow at the bottom, unless a candle already sits there
  const bow =
    days % 2 === 1
      ? `<path d="M150 272c-14-12-30-8-28 4 2 10 18 6 28-4zm0 0c14-12 30-8 28 4-2 10-18 6-28-4z" fill="#d62839" stroke="#8f1422" stroke-width="1.5" stroke-linejoin="round"/><circle cx="150" cy="272" r="5" fill="#8f1422"/>`
      : "";
  const litCount = Math.min(days, full + 1);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" role="img" aria-label="A wreath with ${days} candle${days === 1 ? "" : "s"}, ${litCount} lit">${leaves}${berries}${bow}${candles}</svg>`;
}

// ---------------------------------------------------------------- door 7: gift pile

const GIFT_CELL = `<rect class="b" x="4" y="13" width="22" height="14" rx="1.5"/><rect class="b" x="2.5" y="8.5" width="25" height="5.5" rx="1.5"/><rect class="s" x="4" y="14" width="22" height="1.2"/><rect class="r" x="13" y="8.5" width="4" height="18.5"/><path class="r" d="M15 8.5c-2-5-8-5-7-1 .6 2 4 2 7 1zm0 0c2-5 8-5 7-1-.6 2-4 2-7 1z"/>`;

/** Split 100 boxes between the parts in proportion (largest remainder), at least one box for anything non-zero. */
function hundred(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (!(total > 0)) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (let k = 0; left > 0 && k < order.length; k++, left--) out[order[k][1]]++;
  values.forEach((v, i) => {
    if (v > 0 && out[i] === 0) {
      out[i] = 1;
      out[out.indexOf(Math.max(...out))]--;
    }
  });
  return out;
}

// ---------------------------------------------------------------- door 8: certificate + seal

interface NiceSig {
  signature: string;
  key: string;
  message: string;
  name: string;
  date: string;
}

function readSig(v: unknown): NiceSig | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const signature = str(o.signature, 4000);
  const message = str(o.message, 400);
  if (!/^[0-9a-f]{32,}$/i.test(signature) || !message) return null;
  return { signature, key: str(o.key, 4000), message, name: str(o.name, 40), date: str(o.date, 40) };
}

/** A wax seal drawn from the signature bytes: same signature, same seal; any other signature, another seal. */
function sealSvg(sigHex: string): string {
  const all = (sigHex.match(/[0-9a-f]{2}/gi) ?? []).map((h) => parseInt(h, 16));
  const t = all.slice(-64); // the signature itself sits at the end of the COSE structure
  const b = (i: number) => (t.length ? t[i % t.length] : 0);
  const [wax, dark, lite] = [
    ["#d62839", "#8f1422", "#f59aa4"],
    ["#e9a800", "#9c6f00", "#ffe9a8"],
    ["#2f8a5f", "#1c5c3e", "#9fdcbd"],
    ["#3468ff", "#0033ad", "#b9caff"],
  ][b(0) % 4];
  const lobes = 9 + (b(1) % 7);
  const dip = 4 + (b(2) % 5);
  const pts: string[] = [];
  for (let i = 0; i < lobes * 2; i++) {
    const a = (i / (lobes * 2)) * Math.PI * 2;
    const r = i % 2 ? 50 - dip : 50;
    pts.push(`${n1(60 + Math.cos(a) * r)},${n1(60 + Math.sin(a) * r)}`);
  }
  const petals = 5 + (b(3) % 6);
  const rx = 3 + (b(4) % 4);
  const ry = 10 + (b(5) % 7);
  let rose = "";
  for (let i = 0; i < petals; i++) rose += `<ellipse cx="60" cy="${55 - ry}" rx="${rx}" ry="${ry}" transform="rotate(${n1((i * 360) / petals)} 60 60)"/>`;
  let dots = "";
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    dots += `<circle cx="${n1(60 + Math.cos(a) * 40)}" cy="${n1(60 + Math.sin(a) * 40)}" r="${n1(1 + (b(6 + i) % 3) * 0.6)}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="Wax seal"><polygon points="${pts.join(" ")}" fill="${wax}" stroke="${wax}" stroke-width="7" stroke-linejoin="round"/><circle cx="60" cy="60" r="45" fill="none" stroke="${dark}" stroke-width="1.5" opacity=".6"/><g fill="${dark}" opacity=".75">${dots}</g><g fill="${dark}" opacity=".6">${rose}</g><circle cx="60" cy="60" r="6.5" fill="${lite}"/><path d="M32 36a38 38 0 0 1 30-14" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".35"/></svg>`;
}

const pledgeText = (name: string, date: string) => `I, ${name || "a nice elf"}, promise to be nice in ${CAL_YEAR}. Signed on ${date}.`;
const todayText = () => new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

function certHtml(o: { name: string; date: string; seal: string | null; sealNo: string; by: string }): string {
  return `<div class="cert-in">
    <div class="cert-kicker">Santa's Nice List · ${CAL_YEAR}</div>
    <div class="cert-title">Certificate of Niceness</div>
    <p class="cert-pledge">I, <b>${esc(o.name || "a nice elf")}</b>, promise to be nice in ${CAL_YEAR}.</p>
    <div class="cert-foot">
      <dl class="cert-fields">
        <div><dt>Elf name</dt><dd>${esc(o.name || "a nice elf")}</dd></div>
        <div><dt>Date</dt><dd>${esc(o.date)}</dd></div>
        <div><dt>Signed by</dt><dd>${esc(o.by)}</dd></div>
      </dl>
      <div class="cert-seal">${o.seal ? `${o.seal}<div class="cert-sealno">No. ${esc(o.sealNo)}</div>` : `<div class="cert-noseal">Your seal appears here</div>`}</div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------- door 10: snowman

const SAMPLE_SNOW = [420e6, 180e6, 65e6, 30e6, 12e6, 8e6, 5e6, 2.5e6, 2e6, 1.4e6];

const SNOW_EXPLAIN = `<p>A wallet does not hold one single balance. It holds separate lumps of ADA, a bit like the notes and coins in a purse. Cardano calls each lump a UTxO; here each one is a snowball, and bigger lumps make bigger snowballs.</p>
  <p>When you pay someone, whole snowballs are melted and new ones are rolled: one for them, and one for your change.</p>`;

// ---------------------------------------------------------------- door 11: gift + random pool

const GIFT_SVG = `<svg viewBox="0 0 200 190" aria-hidden="true"><ellipse cx="100" cy="178" rx="72" ry="8" fill="rgba(0,0,0,.28)"/><g class="pp-body"><rect x="34" y="80" width="132" height="94" rx="8" fill="#0033ad"/><path d="M52 104l8 8m-8 0l8-8M132 138l8 8m-8 0l8-8M58 148l6 6m-6 0l6-6M138 100l6 6m-6 0l6-6" fill="none" stroke="#3468ff" stroke-width="3" stroke-linecap="round"/><rect x="89" y="80" width="22" height="94" fill="#ffd166"/></g><g class="pp-lid"><rect x="26" y="58" width="148" height="28" rx="7" fill="#3468ff"/><rect x="89" y="58" width="22" height="28" fill="#ffd166"/><path d="M100 58C78 22 44 28 52 48c5 12 32 12 48 10zM100 58c22-36 56-30 48-10-5 12-32 12-48 10z" fill="#ffd166" stroke="#e9a800" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="56" r="8" fill="#e9a800"/></g></svg>`;

/** A random registered pool, preferring one that has a ticker and a description. Null if none could be found. */
async function randomPool(): Promise<K.PoolInfo | null> {
  type Row = { pool_id_bech32?: unknown; ticker?: unknown };
  const path = (off: number) => `/pool_list?pool_status=eq.registered&limit=500${off ? `&offset=${off}` : ""}`;
  // mainnet has a few thousand pools: start somewhere random so it isn't always the same 500
  const off = state.network === "mainnet" ? 500 * Math.floor(Math.random() * 5) : 0;
  let list = (await K.kget<Row[]>(path(off), 300_000)) ?? [];
  if ((!Array.isArray(list) || !list.length) && off) list = (await K.kget<Row[]>(path(0), 300_000)) ?? [];
  if (!Array.isArray(list)) return null;
  const rows = list.filter((r) => r && POOL_ID.test(str(r.pool_id_bech32)));
  if (!rows.length) return null;
  const named = rows.filter((r) => str(r.ticker).trim());
  const from = named.length >= 8 ? named : rows;
  const ids = new Set<string>();
  // Few ids: mainnet pool_info gets slow fast as the list grows.
  for (let i = 0; i < 40 && ids.size < Math.min(3, from.length); i++) ids.add(str(from[Math.floor(Math.random() * from.length)].pool_id_bech32));
  const infos = ((await K.getPoolInfo([...ids])) ?? []).filter((p) => p && POOL_ID.test(str(p.pool_id_bech32)));
  const has = (p: K.PoolInfo, k: "ticker" | "description") => !!str(p.meta_json?.[k]).trim();
  return infos.find((p) => has(p, "ticker") && has(p, "description")) ?? infos.find((p) => has(p, "ticker")) ?? infos[0] ?? null;
}

// ---------------------------------------------------------------- door 12: letter

const LETTER_START = "Dear Santa,\nThis year I'd like…";

const STAMP_SVG = `<svg class="lt-stampart" viewBox="0 0 46 56" aria-hidden="true"><rect x="2" y="2" width="42" height="52" rx="3" fill="#fff" stroke="#d62839" stroke-width="2" stroke-dasharray="3 2.4"/><path d="M23 10l9 13h-5l8 12H11l8-12h-5z" fill="#2f8a5f"/><rect x="20.5" y="35" width="5" height="6" fill="#7a4b22"/><path d="M12 48h22" stroke="#d62839" stroke-width="2" stroke-linecap="round"/></svg>`;

const ENVELOPE_SVG = `<svg viewBox="0 0 300 200" role="img" aria-label="A sealed envelope"><rect x="8" y="16" width="284" height="176" rx="10" fill="#fffaf0" stroke="#e2cfa3" stroke-width="2"/><path d="M10 190l112-84M290 190l-112-84" fill="none" stroke="#e2cfa3" stroke-width="2"/><path d="M10 20l140 104L290 20z" fill="#f7ecd4" stroke="#e2cfa3" stroke-width="2" stroke-linejoin="round"/><g class="lt-seal"><circle cx="150" cy="122" r="24" fill="#d62839"/><circle cx="150" cy="122" r="17" fill="none" stroke="#8f1422" stroke-width="2"/><path d="M150 110l3.5 8 8.5.8-6.4 5.7 1.9 8.5-7.5-4.5-7.5 4.5 1.9-8.5-6.4-5.7 8.5-.8z" fill="#8f1422"/><path d="M134 110a19 19 0 0 1 14-9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".4"/></g></svg>`;

const sentLetters = (): string[] => {
  const v = store.get<unknown>(wkey("letters"), []);
  return Array.isArray(v) ? v.filter((h): h is string => typeof h === "string" && HEX64.test(h)) : [];
};

// ================================================================ the doors

export const EARLY: Door[] = [
  {
    day: 1,
    title: "The Chain's Heartbeat",
    emoji: "💓",
    kind: "read",
    teaser: "Cardano adds a new block about every 20 seconds. Watch it happen, live.",
    async render(el) {
      el.innerHTML = spinner("Listening for a heartbeat…");
      let first: K.Tip;
      try {
        first = await K.getTip();
        if (!first || !(first.block_height > 0)) throw new Error("The chain didn't answer properly. Try again in a moment.");
      } catch (e) {
        console.error(e);
        el.innerHTML = `<div class="hb">${heartMonitor(`<div class="hb-flatmsg">We can't hear the chain right now.</div>`, true)}</div>${failBox(e)}`;
        return;
      }

      el.innerHTML = `<div class="hb">
        ${heartMonitor(`<div class="label">Block height</div><div class="hb-num" id="h">${num(first.block_height)}</div>`)}
        <p class="hb-ago" id="a">&nbsp;</p>
        <p class="hb-since" id="n">Waiting for the next block…</p>
        <div class="hb-chips" id="chips" role="list" aria-label="The last five blocks"></div>
        <div class="hb-stats"><div><span class="label">Epoch</span><b id="e"></b></div><div><span class="label">Slot</span><b id="s"></b></div></div>
        ${explain(`<p>Cardano is a shared ledger. About every 20 seconds a new page, called a <b>block</b>, is added to it, and every computer on the network gets a copy.</p>
          <p>The heart beats each time a block arrives. The pills show who made each of the last five blocks (a <b>stake pool</b>, see Door 2) and how many transactions it holds. <b>Slots</b> are Cardano's clock: one per second. An <b>epoch</b> is Cardano's five-day week.</p>`)}
      </div>`;

      type Row = { h: number; ticker?: string; txs?: number };
      const rows = new Map<number, Row>();
      const mon = $(el, "#mon");
      const chips = $(el, "#chips");
      const start = first.block_height;
      let cur = 0;
      let tipTime = 0;
      let alive = true;
      let shown = new Set<number>();
      let retry = 0;

      const paintChips = () => {
        const top = [...rows.values()].sort((a, b) => b.h - a.h).slice(0, 5);
        for (const k of rows.keys()) if (!top.some((r) => r.h === k)) rows.delete(k);
        chips.innerHTML = top
          .map(
            (r, i) =>
              `<div role="listitem" class="hb-chip${i === 0 ? " newest" : ""}${shown.has(r.h) ? "" : " in"}"><b>${esc(r.ticker ?? "…")}</b><span>${r.txs == null ? "new" : `${num(r.txs)} tx`}</span></div>`,
          )
          .join("");
        shown = new Set(top.map((r) => r.h));
      };

      const loadBlocks = async () => {
        try {
          const bs = (await K.getLatestBlocks(6)) ?? [];
          const pools = await poolMap(bs.map((b) => b?.pool)).catch(() => new Map<string, K.PoolInfo>());
          if (!alive) return;
          for (const b of bs) {
            if (!b || !(b.block_height > 0) || b.block_height > cur) continue; // never show a block ahead of the big number
            rows.set(b.block_height, { h: b.block_height, ticker: tickerOf(pools.get(b.pool ?? ""), b.pool), txs: Number(b.tx_count) || 0 });
          }
          paintChips();
        } catch (e) {
          console.warn(e);
          if (alive && ![...rows.values()].some((r) => r.ticker))
            chips.innerHTML = `<span class="muted small">The pool names are taking a while. They will show up with the next block.</span>`;
        }
      };

      const tickAgo = () => {
        if (!tipTime) return;
        const quiet = Date.now() / 1000 - tipTime > 180;
        $(el, "#a").textContent = `last block ${ago(tipTime)}${quiet ? " · still listening…" : ""}`;
      };

      const onTip = (t: K.Tip) => {
        if (!alive || !t || !(t.block_height > 0) || t.block_height === cur) return;
        cur = t.block_height;
        tipTime = t.block_time;
        $(el, "#h").textContent = num(cur);
        $(el, "#e").textContent = num(t.epoch_no);
        $(el, "#s").textContent = num(t.abs_slot);
        const since = cur - start;
        $(el, "#n").textContent = since > 0 ? `${plural(since, "block")} since you opened this door` : "Waiting for the next block…";
        if (!rows.has(cur)) rows.set(cur, { h: cur });
        mon.classList.remove("beat");
        void mon.offsetWidth; // restart the animation
        mon.classList.add("beat");
        paintChips();
        tickAgo();
        void loadBlocks();
        clearTimeout(retry);
        // the block list can lag the tip by a moment: look once more if the newest pill is still empty
        retry = window.setTimeout(() => alive && rows.get(cur)?.ticker == null && void loadBlocks(), 16_000);
      };

      onTip(first);
      const off = K.onBlock(onTip);
      const timer = setInterval(tickAgo, 1000);
      return () => {
        alive = false;
        off();
        clearInterval(timer);
        clearTimeout(retry);
      };
    },
  },
  {
    day: 2,
    title: "Who Baked This Block?",
    emoji: "🧑‍🍳",
    kind: "read",
    teaser: "Meet the stake pool that baked the newest block.",
    async render(el) {
      el.innerHTML = spinner("Peeking into the bakery…");
      let blocks: K.Block[];
      let pools: Map<string, K.PoolInfo>;
      try {
        blocks = ((await K.getLatestBlocks(6)) ?? []).filter((b) => b && typeof b.hash === "string");
        pools = await poolMap(blocks.map((b) => b.pool)).catch(() => new Map<string, K.PoolInfo>());
      } catch (e) {
        console.error(e);
        el.innerHTML = failBox(e);
        return;
      }
      if (!blocks.length) {
        el.innerHTML = softFail("The oven is empty: no blocks came back just now. Try again in a moment.");
        return;
      }
      const [b, ...rest] = blocks;
      // Full details (name, description) only for the newest block's pool: one id is quick.
      let p = pools.get(b.pool ?? "");
      if (b.pool) p = (await K.getPoolInfo([b.pool]).catch(() => []))[0] ?? p;
      const desc = str(p?.meta_json?.description, 220).trim();
      const links = [
        b.pool && POOL_ID.test(b.pool) ? `<a target="_blank" rel="noopener" href="${esc(explorerPool(b.pool))}">Pool page ↗</a>` : "",
        HEX64.test(b.hash) ? `<a target="_blank" rel="noopener" href="${esc(explorerBlock(b.hash))}">Block ↗</a>` : "",
      ].filter(Boolean);
      el.innerHTML = `<div class="card feature bk-card">
          <div class="bk-top">${CHEF_HAT}<div class="bk-head"><div class="label">Newest block · #${num(b.block_height)} · ${ago(b.block_time)}</div>
          <div class="bk-name">${esc(poolName(p))}</div></div></div>
          ${desc ? `<p class="quote bk-desc">“${esc(desc)}”</p>` : b.pool ? "" : `<p class="muted small">This block does not name a pool.</p>`}
          <div class="muted">${plural(Number(b.tx_count) || 0, "transaction")} · ${num(Number(b.block_size) || 0)} bytes</div>
          ${links.length ? `<div class="small bk-links">${links.join(" · ")}</div>` : ""}
        </div>
        ${
          rest.length
            ? `<h4>The bakers before them</h4>
        <ul class="list bk-list">${rest
          .map((x) => `<li><span class="bk-no">#${num(x.block_height)}</span><b>${esc(tickerOf(pools.get(x.pool ?? ""), x.pool))}</b><span class="muted">${num(Number(x.tx_count) || 0)} tx · ${ago(x.block_time)}</span></li>`)
          .join("")}</ul>`
            : ""
        }
        <div class="door-actions"><button class="btn ghost" type="button" data-rerender>Check the oven again</button></div>
        ${explain(`<p>Cardano has no miners. Blocks are made ("baked") by <b>stake pools</b>: computers run by volunteers and small businesses all over the world.</p>
          <p>Every second a lottery picks who may bake next. The more ADA people have staked with a pool, the more often it wins. The winner gathers the waiting transactions into a block and earns a reward, which it shares with everyone who staked with it.</p>`)}`;
    },
  },
  {
    day: 3,
    title: "Transaction Snowfall",
    emoji: "❄️",
    kind: "read",
    teaser: "Every snowflake is a real transaction from the last few minutes. Tap one.",
    async render(el) {
      el.innerHTML = spinner("Collecting snowflakes…");
      const cap = isPhone() ? 60 : 96;
      let infos: K.TxInfo[];
      let nBlocks = 0;
      try {
        const blocks = ((await K.getLatestBlocks(10)) ?? []).filter((b) => b && typeof b.hash === "string");
        nBlocks = blocks.length;
        const all = blocks.length ? ((await K.getBlockTxInfo(blocks.map((b) => b.hash))) ?? []) : [];
        infos = all.filter((t) => t && HEX64.test(str(t.tx_hash))).slice(0, cap);
      } catch (e) {
        console.error(e);
        el.innerHTML = failBox(e);
        return;
      }
      if (!infos.length) {
        el.innerHTML = softFail(`Clear skies: no transactions in the last ${nBlocks || "few"} blocks. Try again in a minute.`);
        return;
      }

      const still = reduceMotion();
      el.innerHTML = `<div class="sf-box${still ? " static" : ""}" id="box"></div>
        <div class="card sf-detail" id="info" aria-live="polite"><span class="muted">Tap a snowflake to see the transaction inside.</span></div>
        <div class="sf-bar"><span class="muted small"><b>${num(infos.length)}</b> real transactions from the last ${plural(nBlocks, "block")}. Bigger flakes moved more ADA.</span>
        ${still ? "" : `<button class="btn ghost sf-pause" type="button" id="pause" aria-pressed="false">Pause</button>`}</div>
        ${explain(`<p>A <b>transaction</b> is someone moving ADA or tokens: a payment, a trade, a vote. Each flake here is one that was written to the chain in the last few minutes.</p>
          <p>The <b>fee</b> is what the sender paid the network to include it. It depends on the size of the transaction, not on how much ADA moved, so sending a million ADA costs about the same as sending two.</p>`)}`;
      const box = $(el, "#box");
      const info = $(el, "#info");
      const flake = flakeSvg();
      let pinned: HTMLElement | null = null;

      // biggest first, so the small ones end up on top and stay tappable
      infos.sort((a, b) => (Number(b.total_output) || 0) - (Number(a.total_output) || 0));
      for (const t of infos) {
        const v = (Number(t.total_output) || 0) / 1e6;
        const size = Math.round(Math.min(54, 14 + Math.log10(v + 1) * 7));
        const hit = Math.max(28, size);
        const f = document.createElement("button");
        f.type = "button";
        f.className = "sf-flake";
        f.innerHTML = flake;
        f.setAttribute("aria-label", `Transaction of ${ada(Number(t.total_output) || 0)} ADA`);
        f.style.setProperty("--s", size + "px");
        f.style.width = f.style.height = hit + "px";
        f.style.left = `calc((100% - ${hit}px) * ${Math.random().toFixed(3)})`;
        if (still) f.style.top = `calc((100% - ${hit}px) * ${Math.random().toFixed(3)})`;
        else {
          const dur = 9 + Math.random() * 11;
          f.style.animationDuration = dur.toFixed(1) + "s";
          f.style.animationDelay = (-Math.random() * dur).toFixed(1) + "s";
        }
        f.onclick = () => {
          pinned?.classList.remove("pinned");
          pinned = f;
          f.classList.add("pinned");
          info.innerHTML = `<div class="sf-amt"><b>${ada(Number(t.total_output) || 0)} ADA</b> moved</div>
            <div class="muted small">Fee ${ada(Number(t.fee) || 0, 4)} ADA · block #${num(Number(t.block_height) || 0)} · ${txLinkHtml(t.tx_hash)}</div>`;
        };
        box.appendChild(f);
      }

      const pause = el.querySelector<HTMLButtonElement>("#pause");
      if (pause)
        pause.onclick = () => {
          const on = box.classList.toggle("paused");
          pause.textContent = on ? "Let it snow" : "Pause";
          pause.setAttribute("aria-pressed", String(on));
        };
    },
  },
  {
    day: 4,
    title: "Block-Hash Fortune Cookie",
    emoji: "🥠",
    kind: "read",
    teaser: "Crack a cookie. The newest block picks your fortune.",
    async render(el) {
      el.innerHTML = `<div class="fc">
          <button class="fc-cookie" id="c" type="button" aria-label="Crack the fortune cookie">${cookieSvg(false)}</button>
          <p class="fc-hint" id="hint">Tap the cookie to crack it</p>
          <div id="out" aria-live="polite"></div>
          <div class="door-actions" id="acts" hidden>${shareBtnHtml("Share my fortune")}</div>
        </div>
        ${explain(`<p>Every block has an ID, called a <b>hash</b>: a long jumble of letters and digits that nobody can predict or choose. That makes it a fair way to draw lots.</p>
          <p>We read the first 8 characters of the newest block's ID as a number, and that number picks one of ${FORTUNES.length} fortunes. About one block in 256 has an ID that starts with <code>00</code>. Those bake a golden cookie with a rare fortune.</p>`)}`;
      const btn = $<HTMLButtonElement>(el, "#c");
      const out = $(el, "#out");
      const hint = $(el, "#hint");
      const acts = $(el, "#acts");
      let last: { text: string; golden: boolean; height: number; hash: string } | null = null;
      let busy = false;

      btn.onclick = async () => {
        if (busy) return;
        busy = true;
        btn.classList.remove("open");
        btn.classList.add("busy");
        hint.textContent = "Cracking…";
        try {
          const t = await K.getTip();
          const hash = str(t?.hash).toLowerCase();
          if (!/^[0-9a-f]{16,}$/.test(hash)) throw new Error("That block arrived garbled. Try again in a moment.");
          const same = last?.hash === hash;
          const golden = hash.startsWith("00");
          const list = golden ? RARE_FORTUNES : FORTUNES;
          const idx = parseInt(golden ? hash.slice(2, 10) : hash.slice(0, 8), 16) % list.length;
          last = { text: list[idx], golden, height: t.block_height, hash };
          btn.innerHTML = cookieSvg(golden);
          void btn.offsetWidth; // let the closed pose paint before it opens
          btn.classList.remove("busy");
          btn.classList.add("open");
          out.innerHTML = `<div class="fc-paper${golden ? " rare" : ""}">${golden ? `<div class="fc-rare">Golden cookie · 1 in 256</div>` : ""}“${esc(list[idx])}”</div>
            <p class="muted small">Picked by block #${num(t.block_height)}, whose ID starts with <code>${esc(hash.slice(0, 8))}</code>. ${
              same ? "That is still the newest block, so it is the same fortune. A new block arrives about every 20 seconds." : "Crack again after the next block for a new one."
            }</p>`;
          hint.textContent = "Tap the cookie to crack another";
          acts.hidden = false;
        } catch (e) {
          console.error(e);
          btn.classList.remove("busy");
          out.innerHTML = errorBox(e);
          hint.textContent = "Tap the cookie to try again";
          acts.hidden = true;
        } finally {
          busy = false;
        }
      };

      wireShare(el, () => ({
        title: last?.golden ? "I cracked a golden fortune cookie" : "My block-hash fortune",
        line: last?.text ?? "",
        artSvg: cookieSvg(!!last?.golden, true),
        footer: last ? `Picked by Cardano block #${num(last.height)}` : undefined,
        filename: "fortune-cookie.png",
        text: last ? `“${last.text}” My fortune, picked by a Cardano block.` : undefined,
      }));
    },
  },
  {
    day: 5,
    title: "Naughty or Nice?",
    emoji: "📋",
    kind: "wallet",
    teaser: "Santa checks your wallet's record. Are you staking? Voting?",
    async render(el) {
      const intro = `<p class="nn-intro">Santa only looks. Nothing is signed and nothing leaves your wallet.</p>`;
      const w = usable();
      if (!w) {
        el.innerHTML = `${intro}${scorecardHtml(SAMPLE_CHECKS, true)}<div id="cta"></div>${explain(NICE_EXPLAIN)}`;
        walletCta($(el, "#cta"), "Connect a wallet to get your own");
        return;
      }
      if (!w.rewardAddress) {
        el.innerHTML = `${intro}<div class="warn">This wallet has no staking account, so Santa can't find its record. Most everyday wallets have one: try another account or wallet.</div>${explain(NICE_EXPLAIN)}`;
        return;
      }
      el.innerHTML = spinner("Santa is checking his list…");
      let acc: K.AccountInfo | undefined;
      let txCount = 0;
      try {
        // No .catch() here on purpose: a failed lookup must never turn into a "Naughty" verdict.
        const [a, txs] = await Promise.all([K.getAccountInfo(w.rewardAddress), K.getAccountTxs(w.rewardAddress, 1000)]);
        acc = a;
        txCount = Array.isArray(txs) ? txs.length : 0;
      } catch (e) {
        console.error(e);
        el.innerHTML = `${intro}<p>Santa couldn't reach his records just now, so there is no verdict yet.</p>${failBox(e)}`;
        return;
      }

      const checks = niceChecks(acc, txCount);
      const score = scoreOf(checks);
      const v = verdictOf(score);
      el.innerHTML = `${intro}${scorecardHtml(checks, false)}
        <div class="door-actions">${shareBtnHtml("Share my verdict")}</div>
        <p class="muted small center">Staking account <code>${esc(short(w.rewardAddress, 12, 6))}</code></p>
        ${explain(NICE_EXPLAIN)}`;
      wireShare(el, () => ({
        title: `Santa's verdict: ${v.word === "NEARLY" ? "nearly nice" : v.word.toLowerCase()}`,
        line: `${score} out of 100 on Santa's on-chain list.`,
        artSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300"><rect width="300" height="300" rx="22" fill="#fffaf0"/><text x="150" y="128" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="96" fill="#3b2a12">${score}<tspan font-size="30" fill="#7a6240">/100</tspan></text><g transform="translate(40 156)">${stampInner(v.word, v.color)}</g></svg>`,
        filename: "naughty-or-nice.png",
        text: `Santa checked my Cardano wallet: ${score}/100.`,
      }));

      // count the score up, then bring the stamp down
      const sc = $(el, "#sc");
      const stamp = $(el, "#stamp");
      const land = () => {
        sc.textContent = String(score);
        stamp.classList.remove("wait");
        stamp.classList.add("hit");
      };
      if (reduceMotion() || score === 0) return void land();
      const t0 = performance.now();
      let raf = 0;
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 900);
        sc.textContent = String(Math.round(score * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(step);
        else land();
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    },
  },
  {
    day: 6,
    title: "Epoch Advent Wreath",
    emoji: "🕯️",
    kind: "read",
    // Preview-testnet epochs last one day, mainnet and preprod five.
    get teaser() {
      return state.network === "preview"
        ? "On this test network, Cardano's week is one day long. See how much of it has burned down."
        : "Cardano's week is five days long. See how much of this one has burned down.";
    },
    async render(el) {
      el.innerHTML = spinner("Lighting the candles…");
      let tip: K.Tip;
      let ep: K.EpochInfo;
      try {
        tip = await K.getTip();
        ep = await K.getEpochInfo(tip.epoch_no);
      } catch (e) {
        console.error(e);
        el.innerHTML = failBox(e);
        return;
      }
      if (!ep || !(ep.end_time > ep.start_time)) {
        el.innerHTML = softFail("The calendar for this epoch didn't arrive. Try again in a moment.");
        return;
      }
      const start = ep.start_time * 1000;
      const end = ep.end_time * 1000;
      const len = end - start;
      const days = Math.max(1, Math.min(12, Math.round(len / 86_400_000)));
      const xmas = new Date(CAL_YEAR, 11, 25).getTime();
      const xmasEpoch = tip.epoch_no + Math.floor((xmas - start) / len);
      const xmasText = xmas < start ? "an earlier epoch" : xmasEpoch === tip.epoch_no ? `this epoch (${num(tip.epoch_no)})` : `epoch ${num(xmasEpoch)}`;

      el.innerHTML = `<div class="wr-wrap"><div id="wr"></div>
          <div class="wr-mid"><div class="wr-pct" id="pct"></div><div class="wr-cap">of epoch ${num(tip.epoch_no)}</div><div class="wr-cap wr-next">next epoch in</div><div class="wr-left" id="left"></div></div></div>
        <div class="grid2"><div class="card"><div class="label">Candle burning</div><div class="value" id="candle"></div></div>
        <div class="card"><div class="label">Christmas Day falls in</div><div class="value wr-xmas">${xmasText}</div></div></div>
        <p class="muted small center">So far this epoch: ${plural(Number(ep.blk_count) || 0, "block")} and ${plural(Number(ep.tx_count) || 0, "transaction")}.</p>
        ${explain(`<p>Cardano keeps time in <b>epochs</b>. On this network an epoch lasts ${days === 1 ? "one day" : `${days} days`}, so the wreath has ${days === 1 ? "one candle" : `${days} candles: one for each day`}. A candle burns down over its day, then the next one is lit.</p>
          <p>When an epoch ends, staking rewards are paid out and the lottery that decides who makes the next blocks is drawn again.</p>`)}`;

      let drawn = "";
      const upd = () => {
        const now = Date.now();
        const pct = Math.max(0, Math.min(1, (now - start) / len));
        const pos = pct * days;
        const full = Math.min(days - 1, Math.floor(pos));
        const frac = Math.max(0, Math.min(1, pos - full));
        const key = `${full}:${Math.round(frac * 18)}`;
        if (key !== drawn) {
          drawn = key;
          $(el, "#wr").innerHTML = wreathSvg(days, full, frac);
          $(el, "#candle").textContent = `${full + 1} of ${days}`;
        }
        $(el, "#pct").textContent = (pct * 100).toFixed(1) + "%";
        $(el, "#left").textContent = now >= end ? "any moment now" : duration(end - now);
      };
      upd();
      const timer = setInterval(upd, 1000);
      return () => clearInterval(timer);
    },
  },
  {
    day: 7,
    title: "The Great ADA Gift Pile",
    emoji: "🎁",
    kind: "read",
    teaser: "Every ADA there will ever be, as 100 presents.",
    async render(el) {
      el.innerHTML = spinner("Stacking presents…");
      let t: K.Totals;
      try {
        t = await K.getTotals();
      } catch (e) {
        console.error(e);
        el.innerHTML = failBox(e);
        return;
      }
      const MAX = 45e15; // 45 billion ADA, in lovelace
      const parts = [
        { name: "Circulating", sub: "Already out in the world", word: "circulating", v: Number(t?.circulation) || 0 },
        { name: "Treasury", sub: "The community pot, spent by vote", word: "in the treasury", v: Number(t?.treasury) || 0 },
        { name: "Unclaimed rewards", sub: "Staking rewards waiting to be collected", word: "unclaimed rewards", v: Number(t?.reward) || 0 },
        { name: "Reserves", sub: "Not handed out yet", word: "still in reserve", v: Number(t?.reserves) || 0 },
      ];
      const counts = hundred(parts.map((p) => p.v));
      if (!counts.some(Boolean)) {
        el.innerHTML = softFail("The supply numbers didn't arrive. Try again in a moment.");
        return;
      }
      // index 0 is the bottom-left box; the pile is filled row by row from the ground up
      const cat: number[] = [];
      counts.forEach((n, c) => {
        for (let k = 0; k < n; k++) cat.push(c);
      });
      const boxes = cat
        .slice(0, 100)
        .map((c, i) => `<g class="gp-box c${c}" transform="translate(${(i % 10) * 30} ${(9 - Math.floor(i / 10)) * 30})" style="animation-delay:${i * 7}ms">${GIFT_CELL}</g>`)
        .join("");
      const perPerson = parts[0].v / 1e6 / 8.2e9;
      const idle = "Each present is 450 million ADA. Tap a row to find its presents.";

      el.innerHTML = `<svg class="gp-svg" id="pile" viewBox="0 0 300 300" role="img" aria-label="100 presents: ${parts.map((p, i) => `${counts[i]} ${p.word}`).join(", ")}">${boxes}</svg>
        <p class="gp-status" id="status" aria-live="polite">${idle}</p>
        <div class="gp-legend">${parts
          .map(
            (p, i) => `<button class="gp-leg c${i}" type="button" data-cat="${i}" aria-pressed="false"><i class="gp-sw"></i>
            <span class="gp-name">${p.name}<small>${p.sub}</small></span>
            <span class="gp-amt"><b>${adaCompact(p.v)} ADA</b><small>${plural(counts[i], "present")} · ${((p.v / MAX) * 100).toFixed(1)}%</small></span></button>`,
          )
          .join("")}</div>
        <div class="card feature">🎅 If Santa split the circulating ADA evenly among 8.2 billion people, everyone would find <b>${perPerson.toFixed(2)} ADA</b> in their stocking.</div>
        ${explain(`<p>There will never be more than <b>45 billion ADA</b>. That limit is written into Cardano's rules. Here the whole 45 billion is shown as 100 presents.</p>
          <p>The <b>reserves</b> are handed out bit by bit as staking rewards. The <b>treasury</b> is a shared pot that ADA holders vote on how to spend (see Door 14). These numbers are from the start of epoch ${num(Number(t?.epoch_no) || 0)}.</p>`)}`;

      const pile = $(el, "#pile");
      const legs = [...el.querySelectorAll<HTMLButtonElement>(".gp-leg")];
      let on = -1;
      for (const b of legs)
        b.onclick = () => {
          const c = Number(b.dataset.cat);
          on = on === c ? -1 : c;
          if (on < 0) pile.removeAttribute("data-hl");
          else pile.setAttribute("data-hl", String(on));
          legs.forEach((x) => x.setAttribute("aria-pressed", String(Number(x.dataset.cat) === on)));
          $(el, "#status").textContent =
            on < 0 ? idle : `${counts[on]} of the 100 presents ${counts[on] === 1 ? "is" : "are"} ${parts[on].word}: ${adaCompact(parts[on].v)} ADA.`;
        };
    },
  },
  {
    day: 8,
    title: "Sign the Nice List",
    emoji: "✍️",
    kind: "sign",
    teaser: "Promise to be nice and sign it with your wallet. It costs nothing.",
    async render(el) {
      const w = usable();
      const key = w ? wkey("nice-sig") : "";
      let rec = w ? readSig(store.get<unknown>(key, null)) : null;

      el.innerHTML = `<label class="ns-name">Your elf name
          <input id="name" maxlength="40" placeholder="e.g. Jingles McStake" autocomplete="off" spellcheck="false"></label>
        <div class="cert on-paper" id="cert"></div>
        <p class="ns-why">Your wallet can sign a sentence the way it signs a payment. Anyone can check it was you; nobody can fake it. It costs nothing.</p>
        <div id="act" class="center"></div>
        <div id="out"></div>
        <div id="det"></div>
        <div class="door-actions" id="shr" hidden>${shareBtnHtml("Share my certificate")}</div>
        ${explain(`<p>Signing proves that whoever holds this wallet's keys agreed to this exact sentence. It is not a transaction: nothing is sent, nothing is written to the blockchain, and there is no fee.</p>
          <p>The wax seal is drawn from the signature itself, so no two certificates get the same one. The signature is kept in this browser only.</p>
          <details><summary>For the curious</summary><p>This uses the wallet's message-signing feature (CIP-30 <code>signData</code>, CIP-8). The result is a COSE_Sign1 signature that anyone can verify against your address.</p></details>`)}`;

      const input = $<HTMLInputElement>(el, "#name");
      input.value = draft(8, "name") || rec?.name || "";
      const nameNow = () => input.value.trim().replace(/\s+/g, " ").slice(0, 40);

      const paint = () => {
        const name = nameNow();
        const signed = rec && rec.name === name ? rec : null;
        $(el, "#cert").innerHTML = certHtml({
          name: signed ? signed.name : name,
          date: signed ? signed.date : todayText(),
          seal: signed ? sealSvg(signed.signature) : null,
          sealNo: signed ? signed.signature.slice(-8) : "",
          by: signed && w ? short(w.changeAddress, 10, 6) : w ? "not signed yet" : "connect a wallet to sign",
        });
        $(el, "#cert").classList.toggle("signed", !!signed);
        $(el, "#shr").hidden = !signed;
        $(el, "#det").innerHTML = signed
          ? `<details class="ns-proof"><summary>Show the signature</summary>
              <p class="small">The exact sentence your wallet signed:</p><p class="small"><code class="wrap">${esc(signed.message)}</code></p>
              <p class="small">Signature</p><code class="wrap">${esc(signed.signature)}</code>
              <p class="small">Public key</p><code class="wrap">${esc(signed.key)}</code></details>`
          : "";
        const go = el.querySelector<HTMLButtonElement>("#go");
        if (go && !go.disabled) go.textContent = signed ? "Sign again" : "Sign the Nice List";
      };

      if (w) {
        $(el, "#act").innerHTML = `<button class="btn" type="button" id="go">Sign the Nice List</button>`;
        action($<HTMLButtonElement>(el, "#go"), $(el, "#out"), async () => {
          const name = nameNow();
          const date = todayText();
          const message = pledgeText(name, date);
          const s = await signMessage(message);
          const next = readSig({ signature: s?.signature, key: s?.key, message, name, date });
          if (!next) return `<div class="warn">Your wallet answered, but not with a signature we could read. Try again, or try another wallet.</div>`;
          rec = next;
          store.set(key, rec);
          // paint after action() has put the button label back
          setTimeout(paint, 0);
          return `<div class="ok">Signed. Santa has your word, ${esc(name || "nice elf")}.</div>`;
        });
      } else walletCta($(el, "#act"), "Connect a wallet to sign");

      input.oninput = () => {
        draft(8, "name", input.value);
        paint();
      };
      paint();

      wireShare(el, () => ({
        title: "I signed Santa's Nice List",
        line: `${rec?.name || "A nice elf"} promises to be nice in ${CAL_YEAR}.`,
        artSvg: rec ? sealSvg(rec.signature) : undefined,
        footer: "Signed with a Cardano wallet",
        filename: "nice-list.png",
        text: `I signed Santa's Nice List with my Cardano wallet.`,
      }));
    },
  },
  {
    day: 9,
    title: "The Block-Hash Tree",
    emoji: "🎄",
    kind: "read",
    teaser: "A Christmas tree decorated by the newest block. Every block grows a different one.",
    async render(el) {
      el.innerHTML = `<div class="tr-stage" id="tree">${spinner("Planting…")}</div>
        <p class="tr-cap muted small" id="cap"></p>
        <div class="tr-hintrow"><button class="tr-hint" type="button" id="hint" hidden>A new block just arrived. Regrow?</button></div>
        <div class="door-actions"><button class="btn" type="button" id="re">Grow from the newest block</button>${shareBtnHtml("Share this tree")}</div>
        ${explain(`<p>Every block has an ID, called a <b>hash</b>: 64 letters and digits that nobody can predict. This tree reads that ID like a recipe. Each pair of characters decides where one ornament hangs, how big it is and what colour it gets.</p>
          <p>A new block arrives about every 20 seconds, so there is always a tree nobody has seen before.</p>`)}`;
      const stage = $(el, "#tree");
      const cap = $(el, "#cap");
      const hint = $<HTMLButtonElement>(el, "#hint");
      const re = $<HTMLButtonElement>(el, "#re");
      let cur: K.Tip | null = null;
      let pending: K.Tip | null = null;
      let svg = "";

      const caption = (t: K.Tip, extra = "") =>
        (cap.innerHTML = `Grown from block #${num(t.block_height)} · <code>${esc(short(str(t.hash), 8, 8))}</code>${extra}`);
      const plant = (t: K.Tip) => {
        const hash = str(t?.hash);
        if (!HEX64.test(hash)) throw new Error("That block arrived garbled. Try again in a moment.");
        svg = treeSvg(hash);
        cur = t;
        pending = null;
        hint.hidden = true;
        stage.innerHTML = svg;
        caption(t);
      };

      try {
        plant(await K.getTip());
      } catch (e) {
        console.error(e);
        el.innerHTML = failBox(e);
        return;
      }

      // Don't swap the tree under someone admiring it: just offer the new one.
      const off = K.onBlock((t) => {
        if (!cur || !t || t.hash === cur.hash) return;
        pending = t;
        hint.hidden = false;
      });
      hint.onclick = () => {
        try {
          if (pending) plant(pending);
        } catch (e) {
          cap.innerHTML = errorBox(e);
        }
      };
      re.onclick = async () => {
        if (re.disabled) return;
        re.disabled = true;
        try {
          const t = pending ?? (await K.getTip());
          if (cur && t.hash === cur.hash) caption(cur, "<br>That is still the newest block. The next one is due any second.");
          else plant(t);
        } catch (e) {
          console.error(e);
          cap.innerHTML = errorBox(e);
        } finally {
          re.disabled = false;
        }
      };
      wireShare(el, () => ({
        title: "A Christmas tree grown from one Cardano block",
        line: cur ? `Block #${num(cur.block_height)} decorated it. No two are alike.` : undefined,
        artSvg: svg,
        filename: cur ? `block-tree-${cur.block_height}.png` : "block-tree.png",
        text: "A Christmas tree decorated by a Cardano block.",
      }));
      return off;
    },
  },
  {
    day: 10,
    title: "Build a UTxO Snowman",
    emoji: "⛄",
    kind: "wallet",
    teaser: "Your wallet holds its ADA in separate lumps. Roll them into a snowman.",
    async render(el) {
      const sample = (tag: string) => `<div class="sm-stage is-sample"><div class="sample-tag">${tag}</div>${snowmanSvg(SAMPLE_SNOW)}</div>`;
      const w = usable();
      if (!w) {
        el.innerHTML = `${sample("Sample snowman · not your wallet")}
          <p class="center">Every wallet builds a different one. Yours is rolled from the lumps of ADA you hold.</p>
          <div id="cta"></div>${explain(SNOW_EXPLAIN)}`;
        walletCta($(el, "#cta"), "Connect a wallet to build yours");
        return;
      }
      el.innerHTML = spinner("Rolling snowballs…");
      let values: number[];
      let tokens = 0;
      try {
        const utxos = await w.bw.getUtxos();
        const list: any[] = Array.isArray(utxos) ? utxos : [];
        values = list.map(lovelaceOf);
        tokens = list.reduce((n: number, u: any) => n + Math.max(0, (u?.output?.amount?.length ?? 1) - 1), 0);
      } catch (e) {
        console.error(e);
        el.innerHTML = failBox(e);
        return;
      }

      if (!values.length) {
        el.innerHTML = `${sample("No snow yet · this is a sample")}
          <div class="card"><b>Snowballs: 0.</b> This wallet holds no ADA yet, so there is nothing to roll. Add some ADA and come back: your snowman will be waiting.</div>
          ${explain(SNOW_EXPLAIN)}`;
        return;
      }

      const total = values.reduce((a, b) => a + b, 0);
      const biggest = Math.max(...values);
      const svg = snowmanSvg(values);
      const note =
        values.length === 1
          ? "One single mighty snowball. Very tidy."
          : values.length <= 30
            ? "A healthy, tidy pile."
            : "That is a big pile. Sending all your ADA to yourself once would press them into fewer, bigger snowballs, and can make later fees a little cheaper.";
      el.innerHTML = `<div class="sm-stage">${svg}</div>
        <div class="grid3"><div class="card"><div class="label">Snowballs</div><div class="value">${num(values.length)}</div></div>
        <div class="card"><div class="label">Biggest snowball</div><div class="value">${ada(biggest)} ADA</div></div>
        <div class="card"><div class="label">Total snow</div><div class="value">${ada(total)} ADA</div></div></div>
        <p>${note}${tokens ? ` Your snowballs also carry ${plural(tokens, "other token")}, like candy stuck in the snow.` : ""}</p>
        <div class="door-actions">${shareBtnHtml("Share my snowman")}</div>
        ${explain(SNOW_EXPLAIN)}`;
      wireShare(el, () => ({
        title: "My UTxO snowman",
        line: `Rolled from ${plural(values.length, "snowball")} in my Cardano wallet.`,
        artSvg: svg,
        filename: "utxo-snowman.png",
        text: "My Cardano wallet, rolled into a snowman.",
      }));
    },
  },
  {
    day: 11,
    title: "Stake Pool Party",
    emoji: "🎉",
    kind: "read",
    teaser: "Unwrap a stake pool: your own, or a surprise one.",
    async render(el) {
      el.innerHTML = spinner("Wrapping a pool…");
      const w = usable();
      let p: K.PoolInfo | null = null;
      let mine = false;
      let lookupFailed = false;
      try {
        if (w?.rewardAddress) {
          try {
            const id = str((await K.getAccountInfo(w.rewardAddress))?.delegated_pool);
            if (id) {
              p = (await K.getPoolInfo([id]))[0] ?? null;
              mine = !!p;
              lookupFailed = !p;
            }
          } catch (e) {
            console.warn(e);
            lookupFailed = true;
          }
        }
        if (!p) p = await randomPool();
      } catch (e) {
        console.error(e);
        el.innerHTML = failBox(e);
        return;
      }
      if (!p) {
        el.innerHTML = softFail("No pool answered the door this time. Try another one.");
        return;
      }

      const sat = Math.max(0, Number(p.live_saturation) || 0);
      const desc = str(p.meta_json?.description, 260).trim();
      const home = str(p.meta_json?.homepage, 300).trim();
      const links = [
        /^https?:\/\//i.test(home) ? `<a target="_blank" rel="noopener noreferrer" href="${esc(home)}">Homepage ↗</a>` : "",
        POOL_ID.test(str(p.pool_id_bech32)) ? `<a target="_blank" rel="noopener" href="${esc(explorerPool(p.pool_id_bech32))}">Explorer ↗</a>` : "",
      ].filter(Boolean);
      const lead = mine
        ? "Your ADA is staked with a pool. Unwrap it to meet your host."
        : lookupFailed
          ? "We couldn't check your own pool just now, so here is a surprise one instead."
          : w
            ? "You aren't staking yet, so here is a surprise pool as your Secret Santa."
            : "A surprise stake pool, picked at random as your Secret Santa.";

      el.innerHTML = `<p class="pp-lead">${lead}</p>
        <button class="pp-gift" type="button" id="gift" aria-label="Unwrap the pool">${GIFT_SVG}<span class="pp-tap">Tap to unwrap</span></button>
        <div class="pp-card on-paper" id="card" tabindex="-1" hidden>
          <div class="pp-kicker">${mine ? "Your stake pool" : "Your Secret Santa pool"}</div>
          <div class="pp-name">${esc(poolName(p))}</div>
          ${desc ? `<p class="pp-desc">“${esc(desc)}”</p>` : ""}
          <div class="pp-stats"><div><b>${num(Number(p.live_delegators) || 0)}</b><span>party guests</span></div>
          <div><b>${adaCompact(p.live_stake ?? 0)}</b><span>ADA staked here</span></div>
          <div><b>${num(Number(p.block_count) || 0)}</b><span>blocks made</span></div></div>
          <div class="pp-k">How full the party is</div>
          <div class="pp-meter"><i class="${sat > 95 ? "full" : ""}" style="width:${Math.min(100, sat).toFixed(1)}%"></i></div>
          <div class="pp-small">${sat.toFixed(1)}% full${sat > 95 ? " (crowded: rewards shrink past 100%)" : ""} · the pool keeps ${((Number(p.margin) || 0) * 100).toFixed(1)}% of rewards plus ${ada(p.fixed_cost ?? 0)} ADA per epoch</div>
          ${links.length ? `<div class="pp-links">${links.join(" · ")}</div>` : ""}
        </div>
        <div id="after" hidden>
          ${mine ? "" : `<p class="muted small center">A random pick, not a recommendation. Have a look at its homepage before you stake.</p><div id="dg"></div><div class="door-actions"><button class="btn ghost" type="button" data-rerender>Unwrap another one</button></div>`}
          ${w ? "" : `<div id="cta"></div>`}
        </div>
        ${explain(`<p><b>Stake pools</b> are the computers that make Cardano's blocks. Anyone can back a pool with their ADA. That is called <b>staking</b>. Your ADA never leaves your wallet and is never locked, and you can switch pools whenever you like.</p>
          <p>When the pool makes blocks, it shares the rewards with its "party guests": the wallets staking with it. A pool that gets too full earns less per guest, which nudges people towards smaller pools and keeps Cardano spread across many hands.</p>
          <p>Staking takes one small transaction. The very first time, your wallet also puts down a refundable deposit (2 ADA today), which comes back if you ever stop staking.</p>`)}`;

      const cta = el.querySelector<HTMLElement>("#cta");
      if (cta) walletCta(cta, "Connect a wallet to meet your own pool");
      const dg = el.querySelector<HTMLElement>("#dg");
      if (dg) {
        const ticker = str(p.meta_json?.ticker, 12).trim();
        delegateBox(dg, {
          kind: "pool",
          id: str(p.pool_id_bech32),
          name: poolName(p),
          label: `Stake with ${ticker || "this pool"}`,
          blocked:
            p.pool_status !== "registered"
              ? "This pool is retiring, so it isn't a good home for your stake. Unwrap another one."
              : sat >= 100
                ? "This pool is over-full: past 100% the rewards shrink for everyone in it. Unwrap another one."
                : undefined,
        });
      }

      const gift = $<HTMLButtonElement>(el, "#gift");
      let timer = 0;
      gift.onclick = () => {
        if (gift.classList.contains("open")) return;
        gift.classList.add("open");
        const reveal = () => {
          gift.hidden = true;
          const card = $(el, "#card");
          card.hidden = false;
          $(el, "#after").hidden = false;
          card.focus({ preventScroll: true });
        };
        if (reduceMotion()) reveal();
        else timer = window.setTimeout(reveal, 480);
      };
      return () => clearTimeout(timer);
    },
  },
  {
    day: 12,
    title: "Letter to Santa",
    emoji: "✉️",
    kind: "tx",
    teaser: "Write Santa a letter that stays on the blockchain forever.",
    async render(el) {
      const w = usable();
      const before = w ? sentLetters() : [];
      el.innerHTML = `<div id="stage">
          <div class="lt-paper on-paper">
            <div class="lt-head"><div class="lt-to"><span>To</span>Santa Claus, North Pole</div>${STAMP_SVG}</div>
            <textarea class="lt-text" id="txt" maxlength="320" rows="7" aria-label="Your letter to Santa"></textarea>
            <div class="lt-count" id="cnt"></div>
          </div>
        </div>
        <p class="warn" id="privacy">⚠️ Whatever you write here becomes public and permanent, and it stays linked to your wallet address forever. No real names, home addresses or secrets.</p>
        <div id="act" class="center"></div>
        <div id="out"></div>
        ${before.length ? `<p class="muted small center">You have posted ${plural(before.length, "letter")} from this wallet. <button class="lt-link" type="button" data-goto-door="13">Read ${before.length === 1 ? "it" : "them"} behind Door 13</button></p>` : ""}
        ${explain(`<p>Every Cardano transaction can carry a short note. Your letter travels as the note on a tiny transaction from you to yourself, so the only cost is the network fee.</p>
          <p>Once a block includes it, anyone can read it, and nobody (not even you) can change or delete it. Anyone can also see which wallet address sent it.</p>
          <details><summary>For the curious</summary><p>The note uses the standard message format (CIP-20, metadata label 674), which wallets and explorers know how to display. Lines longer than 64 bytes are split, because that is the most one metadata string can hold.</p></details>`)}`;

      const ta = $<HTMLTextAreaElement>(el, "#txt");
      ta.value = draft(12, "letter") || LETTER_START;
      const count = () => ($(el, "#cnt").textContent = `${ta.value.length}/320`);
      ta.oninput = () => {
        draft(12, "letter", ta.value);
        count();
      };
      count();

      const cost = `<p class="muted small">Costs only the network fee (about 0.17 ADA).</p>`;
      const act = $(el, "#act");
      if (!w) {
        act.innerHTML = `${cost}<div id="cta"></div>`;
        walletCta($(el, "#cta"), "Connect a wallet to post it");
        return;
      }

      let sent = "";
      const onConfirmed = (e: Event) => {
        const d = (e as CustomEvent).detail as { hash?: string; blockHeight?: number } | undefined;
        const cap = el.querySelector<HTMLElement>("#envcap");
        if (cap && sent && d?.hash === sent) cap.textContent = d.blockHeight ? `Delivered. It is in block #${num(d.blockHeight)} for good.` : "Delivered. It is on the chain for good.";
      };
      window.addEventListener("tx-confirmed", onConfirmed);

      act.innerHTML = `<button class="btn" type="button" id="go">Post my letter</button>${cost}`;
      action($<HTMLButtonElement>(el, "#go"), $(el, "#out"), async () => {
        const text = ta.value.trim();
        if (!text || text === LETTER_START)
          return `<div class="warn">Your letter is still empty. Santa can't read minds (yet).</div>`;
        const lines = text.split("\n").flatMap((l) => chunk64(l.trimEnd()));
        const hash = await sendWithMetadata({ 674: { msg: [...lines, `🎄 via ${APP_ID} ${CAL_YEAR}`] } });
        sent = str(hash).toLowerCase();
        store.set(wkey("letters"), [hash, ...sentLetters().filter((h) => h !== hash)].slice(0, 100));
        draft(12, "letter", "");
        $(el, "#stage").innerHTML = `<div class="lt-env">${ENVELOPE_SVG}<div class="lt-envcap" id="envcap">Sealed and on its way…</div></div>`;
        $(el, "#privacy").hidden = true;
        act.hidden = true;
        return `${txSuccess(hash, "Letter posted. Santa's mailbox is the blockchain.")}
          <div class="door-actions" data-once><button class="btn ghost" type="button" data-goto-door="13">Read it back behind Door 13</button><button class="btn ghost" type="button" data-rerender>Write another</button></div>`;
      });
      return () => window.removeEventListener("tx-confirmed", onConfirmed);
    },
  },
];
