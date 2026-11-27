/**
 * All of the calendar's art, drawn in code. No external assets, no fonts, no imports:
 * this module is self-contained so it can also be run and tested straight from Node.
 *
 * Two pieces are minted with the SVG stored on-chain (`ornament`, `starSvg`). Those are held to
 * a hard 1,600-byte limit, have explicit width/height, their own background, and use paths and
 * basic shapes only (no <text>, no <use>, no external references).
 *
 * `ornament` and `starSvg` contain ids. When several appear in one document, show them as
 * <img src="${svgDataUri(svg)}"> rather than inlining them.
 */

/* ------------------------------------------------------------------ helpers */

/** Deterministic PRNG from any string (hex seeds in practice). Returns floats in [0, 1). */
function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  const next = () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
  let a = next(), b = next(), c = next(), d = next();
  return () => {
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

/** Number → shortest string with at most one decimal ("12", "3.5", ".5", "-.5"). */
function f(x: number): string {
  const v = Math.round(x * 10) / 10;
  const s = String(v === 0 ? 0 : v);
  return s.startsWith("0.") ? s.slice(1) : s.startsWith("-0.") ? "-" + s.slice(2) : s;
}

/** Coordinate pair, as short as SVG path syntax allows ("12 3.5", "12-3.5"). */
function pt(x: number, y: number): string {
  const a = f(x), b = f(y);
  return b[0] === "-" ? a + b : a + " " + b;
}

const clean = (seed: string) => String(seed ?? "").toLowerCase().replace(/[^0-9a-f]/g, "") || "0";

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, "$&$&") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

/** Mix two colours, return a 3-digit hex (short, on-chain friendly). */
function mix3(a: string, b: string, t: number): string {
  const A = rgb(a), B = rgb(b);
  return "#" + A.map((v, i) => Math.round((v + (B[i] - v) * t) / 17).toString(16)).join("");
}

/** Closed star polygon path: n points, outer radius R, inner radius r, first point at `rot` degrees (-90 = up). */
function starPath(cx: number, cy: number, n: number, R: number, r: number, rot = -90): string {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    const rad = i % 2 ? r : R;
    d += (i ? "L" : "M") + pt(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  return d + "z";
}

const NIGHT = "#070d2b";
const XMLNS = `xmlns="http://www.w3.org/2000/svg"`;
/** Root for the two on-chain pieces: 100-unit canvas that rasterises at 1000px. */
const CARD = `<svg ${XMLNS} width="1000" height="1000" viewBox="0 0 100 100" fill="none" stroke-linecap="round">`;
const ALL = "M0 0h100v100H0z";
export const ONCHAIN_MAX_BYTES = 1600;

export const svgDataUri = (svg: string) => `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;

/* ----------------------------------------------------------------- ornament */

// name, glass, shade, accent — 3-digit hex keeps the on-chain SVG small
const GLASS: [string, string, string, string][] = [
  ["Ruby", "#e34", "#501", "#fd6"],
  ["Cardano", "#26e", "#014", "#fff"],
  ["Pine", "#1a9", "#043", "#ffe"],
  ["Plum", "#93d", "#305", "#fd6"],
  ["Copper", "#e75", "#621", "#fed"],
  ["Sky", "#49f", "#137", "#fc1"],
  ["Holly", "#396", "#021", "#f67"],
  ["Silver", "#dde", "#556", "#25d"],
  ["Gold", "#fb1", "#640", "#fff"],
  ["Midnight", "#23a", "#002", "#7df"],
  ["Rose", "#f8a", "#724", "#fff"],
  ["Ice", "#9ef", "#267", "#fff"],
];
// rare two-hue glass: hue A, hue B, shade
const AURORA: [string, string, string][] = [
  ["#3fc", "#84f", "#103"],
  ["#5f8", "#28f", "#013"],
  ["#f6b", "#fb3", "#412"],
  ["#6df", "#f5c", "#204"],
];
const METALS: [string, string][] = [["Gold", "#ec5"], ["Silver", "#dde"], ["Copper", "#d85"]];

// name, silhouette, glass gradient (centre x, centre y, radius), what hangs behind it (bell clapper)
const SHAPES: [string, string, string, string][] = [
  ["Ball", "M50 26a30 30 0 0 0 0 60a30 30 0 0 0 0-60z", `cx="40" cy="43" r="48"`, ""],
  ["Drop", "M50 25c18 0 28 12 28 27 0 17-16 26-28 38-12-12-28-21-28-38 0-15 10-27 28-27z", `cx="41" cy="43" r="50"`, ""],
  ["Onion", "M50 25c24 0 33 13 33 26 0 14-19 19-27 27l-6 13-6-13c-8-8-27-13-27-27 0-13 9-26 33-26z", `cx="39" cy="42" r="52"`, ""],
  ["Lantern", "M50 25a22 33 0 0 0 0 66a22 33 0 0 0 0-66z", `cx="43" cy="43" r="50"`, ""],
  ["Saucer", "M45 26h10q3 5 14 8c11 3 17 10 17 20 0 14-16 24-36 24S14 68 14 54c0-10 6-17 17-20q11-3 14-8z", `cx="38" cy="42" r="50"`, ""],
  ["Bell", "M50 25c-13 0-20 10-21 27-1 14-5 21-13 26q34 11 68 0c-8-5-12-12-13-26-1-17-8-27-21-27z", `cx="41" cy="42" r="52"`, `<circle cx="50" cy="85" r="5"/>`],
  ["Diamond", "M50 25q20 13 26 30-8 19-26 35-18-16-26-35 6-17 26-30z", `cx="42" cy="44" r="48"`, ""],
];

const BANDS = ["", "solid", "beads", "dashes", "twin", "zigzag", "wave"] as const;
const MOTIFS = ["Plain", "Snowflake", "Star", "Sparkle", "Rings", "Constellation", "Ada", "Fir", "Heart", "Moon"] as const;

export type OrnamentTraits = { glass: string; shape: string; metal: string; motif: string };

/**
 * A glass ornament, unique to `seed` (hex: block hash + key hash). Small enough to live fully on-chain.
 * Returns the SVG and its human-readable traits.
 */
export function ornament(seed: string): { svg: string; traits: OrnamentTraits } {
  const s = clean(seed);
  // Everything optional is built at "level 0"; if a seed ever lands over the limit the
  // extras are dropped one level at a time. In practice level 0 always fits (see the tests).
  for (let level = 0; ; level++) {
    const out = buildOrnament(s, level);
    if (out.svg.length <= ONCHAIN_MAX_BYTES || level >= 3) return out;
  }
}

function buildOrnament(seed: string, level: number): { svg: string; traits: OrnamentTraits } {
  const r = rng("ornament:" + seed);
  const p = (n: number) => Math.floor(r() * n);

  const aurora = p(64) === 0;
  const [gName, gMain, gDark, gAcc] = GLASS[p(GLASS.length)];
  const au = AURORA[p(AURORA.length)];
  const [shape, d, grad, behind] = SHAPES[p(SHAPES.length)];
  const [metal, mc] = METALS[p(METALS.length)];
  const motif = MOTIFS[p(MOTIFS.length)];

  const glass = aurora ? "Aurora" : gName;
  const main = aurora ? au[1] : gMain;
  const dark = aurora ? au[2] : gDark;
  const acc = aurora ? "#fff" : gAcc;

  // a band that sags like a ribbon tied round the glass
  let zig = 0;
  const band = (y: number, force = false): string => {
    let k: string = BANDS[p(BANDS.length)];
    const a = p(6), b = p(4);
    if (force && !k) k = "solid";
    // one zigzag per ornament is plenty (and it is the most expensive band in bytes)
    if (k === "zigzag" && zig++) k = "solid";
    const c = `M8 ${y}q42 14 84 0`;
    if (k === "solid") return `<path d="${c}" stroke-width="${f(2.5 + a * 0.5)}"/>`;
    if (k === "beads") return `<path d="${c}" stroke-width="${f(2 + b * 0.5)}" stroke-dasharray="0 ${5 + (a % 4)}"/>`;
    if (k === "dashes") return `<path d="${c}" stroke-width="2.5" stroke-dasharray="${3 + a} ${4 + b}"/>`;
    if (k === "twin") return `<path d="${c}m0 ${4 + (b % 2)}q-42 14-84 0" stroke-width="1.4"/>`;
    if (k === "wave") return `<path d="M9 ${y + 5}q4-${5 + b} 8 0${"t8 0".repeat(9)}" stroke-width="1.6"/>`;
    if (k === "zigzag") {
      // follows the same sag as the other bands
      let z = `M10 ${y + 1}`, py = y + 1;
      for (let i = 1; i <= 10; i++) {
        const t = (2 + i * 8) / 84;
        const step = Math.round((y + 28 * t * (1 - t) + (i % 2 ? 5 : 0) - py) * 10) / 10;
        z += `l${pt(8, step)}`;
        py += step;
      }
      return `<path d="${z}" stroke-width="1.6"/>`;
    }
    return "";
  };
  const top = band(34), bot = band(66);

  const fill = ` fill="${acc}"/>`;
  let mid: string;
  if (motif === "Plain") mid = band(50, !top && !bot);
  else if (motif === "Snowflake") mid = `<path d="M50 46v22M40.5 51.5l19 11m-19 0l19-11M50 52l4.3 2.5v5L50 62l-4.3-2.5v-5z" stroke-width="1.6"/>`;
  else if (motif === "Star") mid = `<path d="${starPath(50, 57.5, 5, 11, 4.4)}"` + fill;
  else if (motif === "Sparkle") mid = `<path d="M50 44q1.5 11.5 13 13-11.5 1.5-13 13-1.5-11.5-13-13 11.5-1.5 13-13z"` + fill;
  else if (motif === "Rings") {
    const inner = 4 + 2 * p(2), outer = 10 + 2 * p(2);
    mid = `<path d="M50 57h0" stroke-width="${inner}"/><g stroke-width="2.4" stroke-dasharray="0 6.3"><circle cx="50" cy="57" r="${inner + 2}"/><circle cx="50" cy="57" r="${outer}"/></g>`;
  } else if (motif === "Constellation") {
    const n = 5 + p(2), a0 = r() * 6.3;
    const pts = Array.from({ length: n }, (_, i) => {
      const a = a0 + (i / n) * 5.4, rad = 5 + r() * 7;
      return `${f(50 + Math.cos(a) * rad * 1.15)} ${f(57 + Math.sin(a) * rad * 0.9)}`;
    });
    mid = `<path d="M${pts.join("L")}" stroke-width=".6"/><path d="${pts.map((q) => `M${q}h0`).join("")}" stroke-width="2.8"/>`;
  } else if (motif === "Ada") mid = `<path d="M43.5 67.5L50 47l6.5 20.5M41 57.5h18M41 62h18" stroke-width="2.2"/>`;
  else if (motif === "Fir") mid = `<path d="M50 45l6 8h-3l6 7h-4l6 8H39l6-8h-4l6-7h-3z"` + fill;
  else if (motif === "Heart") mid = `<path d="M50 68c-13-8-14-19-8-21 4-1 7 2 8 5 1-3 4-6 8-5 6 2 5 13-8 21z"` + fill;
  else mid = `<path d="M55 46a11.5 11.5 0 1 0 7 17 10 10 0 0 1-7-17z"` + fill;

  // night sky around the glass: dots and two little twinkles, all placed by the seed
  const free = (x: number, y: number) => !(Math.abs(x - 50) < 37 && y > 20 && y < 93) && !(Math.abs(x - 50) < 6 && y < 22);
  const place = (): [number, number] => {
    for (let i = 0; i < 40; i++) {
      const x = 4 + p(93), y = 4 + p(88);
      if (free(x, y)) return [x, y];
    }
    return [6 + p(8), 6 + p(80)];
  };
  let dots = "", rays = "";
  for (let i = 0; i < (level >= 2 ? 5 : 9); i++) {
    const [x, y] = place();
    dots += `M${x} ${y}h0`;
    if (i < 2 && level < 1) rays += `M${x} ${y - 3}v6m-3-3h6`;
  }

  // "hash barcode": the first and last hex digits of the seed, as dash lengths
  const code = Array.from(seed.slice(0, 6) + seed.slice(-6), (ch) => 1 + (parseInt(ch, 16) >> 2)).join(" ");

  const stops = aurora
    ? `<stop offset="0" stop-color="#fff"/><stop offset=".2" stop-color="${au[0]}"/><stop offset=".6" stop-color="${au[1]}"/><stop offset="1" stop-color="${dark}"/>`
    : `<stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="${main}"/><stop offset=".9" stop-color="${dark}"/><stop offset="1" stop-color="${mix3(dark, main, 0.55)}"/>`;

  const svg =
    CARD +
    `<defs><radialGradient id="b" cx=".5" cy=".6" r=".5"><stop offset="0" stop-color="${mix3(NIGHT, aurora ? au[0] : main, 0.42)}"/><stop offset="1" stop-color="${NIGHT}"/></radialGradient>` +
    `<radialGradient id="g" ${grad} gradientUnits="userSpaceOnUse">${stops}</radialGradient>` +
    `<clipPath id="c"><path d="${d}"/></clipPath></defs>` +
    `<path d="${ALL}" fill="url(#b)"/>` +
    `<path d="${dots}" stroke="#fff" stroke-width="1.4"/>` +
    (rays ? `<path d="${rays}" stroke="#fff" stroke-width=".5"/>` : "") +
    `<g fill="${mc}" stroke="${mc}">${behind}<g fill="none" stroke-width="1.2"><path d="M50 0v11"/><circle cx="50" cy="15" r="4"/></g>` +
    `<g clip-path="url(#c)" fill="none" stroke="${acc}"><path d="${ALL}" fill="url(#g)"/>${top}${mid}${bot}` +
    (level < 3 ? `<path d="M33 48q0-9 8-14" stroke="#fff" stroke-width="3.5" opacity=".5"/>` : "") +
    `</g><path d="M44 19h12l1 8q-7 2-14 0z"/>` +
    `<path d="M32 96h36" stroke-width="2" stroke-linecap="butt" stroke-dasharray="${code}"/></g></svg>`;

  return { svg, traits: { glass, shape, metal, motif } };
}

/* --------------------------------------------------------------------- star */

/**
 * The Christmas Star (minted on Day 24). An 8-point compass star on a night card. The ring of 24
 * dots is lit for every door in `opened` (door 24 at the top, clockwise), the number of light rays
 * equals `ornaments` (4–12), the glow takes `tint`, and the small background stars come from `seed`.
 * ≤ 1,600 bytes for any input.
 */
export function starSvg(o: { seed: string; opened: number[]; ornaments: number; tint?: string }): string {
  const seed = clean(o?.seed);
  const r = rng("star:" + seed);
  const tint = typeof o?.tint === "string" && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(o.tint) ? o.tint.toLowerCase() : "#fd6";
  const n = Math.max(4, Math.min(12, Math.floor(Number(o?.ornaments) || 0)));
  const lit = new Set((Array.isArray(o?.opened) ? o.opened : []).map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 24));

  // rays: evenly spread, turned by the seed, kept off the compass axes; long and short alternate
  const a0 = (0.2 + r() * 0.6) * (360 / n);
  let rays = "";
  for (let i = 0; i < n; i++) {
    const a = ((a0 + (i * 360) / n) * Math.PI) / 180, len = n % 2 ? 31 : i % 2 ? 26 : 34;
    rays += `M50 50l${pt(Math.cos(a) * len, Math.sin(a) * len)}`;
  }

  // 24 dots on a circle of circumference 240: one every 10 units, door 24 at the top, clockwise
  const ring = "M50 11.8a38.2 38.2 0 0 1 0 76.4a38.2 38.2 0 0 1 0-76.4";
  let dash = "";
  if (lit.size) {
    const pos = [...lit].map((d) => d % 24).sort((a, b) => a - b);
    const gaps = pos.map((q, i) => ((pos[(i + 1) % pos.length] - q + 24) % 24 || 24) * 10);
    const same = gaps.every((g) => g === gaps[0]);
    dash = (pos[0] ? ` stroke-dashoffset="${-pos[0] * 10}"` : "") + ` stroke-dasharray="${(same ? [gaps[0]] : gaps).map((g) => `0 ${g}`).join(" ")}"`;
  }

  // small stars in the corners, outside the ring
  let dots = "";
  for (let i = 0, tries = 0; i < 10 && tries < 400; tries++) {
    const x = 3 + Math.floor(r() * 95), y = 3 + Math.floor(r() * 95);
    if (Math.hypot(x - 50, y - 50) < 44) continue;
    dots += `M${x} ${y}h0`;
    i++;
  }

  return (
    CARD +
    `<defs><radialGradient id="g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${tint}"/><stop offset="1" stop-color="${tint}" stop-opacity="0"/></radialGradient></defs>` +
    `<path d="${ALL}" fill="${NIGHT}"/><circle cx="50" cy="50" r="50" fill="url(#g)" opacity=".5"/>` +
    `<g stroke="#fff"><path d="${dots}" stroke-width="1.2" opacity=".7"/>` +
    `<path d="${ring}" stroke-width="1.6" stroke-dasharray="0 10" opacity=".3"/>` +
    (dash ? `<path d="${ring}" stroke="#fd6" stroke-width="3.2"${dash}/>` : "") +
    `<path d="${rays}" stroke="${tint}" stroke-width=".7" opacity=".8"/></g>` +
    `<path d="M50 30l5 15 15 5-15 5-5 15-5-15-15-5 15-5z" fill="#fb3" transform="rotate(45 50 50)"/>` +
    `<path d="M50 14l4.5 31.5L86 50l-31.5 4.5L50 86l-4.5-31.5L14 50l31.5-4.5z" fill="#fd6"/>` +
    `<path d="M50 50V14l4.5 31.5zm0 0h36l-31.5 4.5zm0 0v36l-4.5-31.5zm0 0H14l31.5-4.5z" fill="#fff" opacity=".5"/>` +
    `</svg>`
  );
}

/* --------------------------------------------------------------------- tree */

const BULBS = ["#fff3b0", "#ffd166", "#ff6b7a", "#7fd4ff", "#9dffc0"];
const TREE_STYLE =
  `<style>.tree-svg .light{animation:tree-twinkle 1.6s ease-in-out infinite alternate}` +
  `@keyframes tree-twinkle{from{opacity:1}to{opacity:.3}}` +
  `@media (prefers-reduced-motion:reduce){.tree-svg .light{animation:none}}</style>`;

/** Only real image data URIs may be hung on the tree (they come from chain metadata). */
const safeImage = (u: unknown): u is string => typeof u === "string" && /^data:image\/[a-z0-9.+-]+[;,][^"'<>\s\\]*$/i.test(u);

/**
 * A snowy Christmas tree. Without `images`, the ornaments (colour, size, place) and the lights come
 * from the block hash. With `images` (data-URI ornaments), those are hung instead, as round medallions.
 * Works inline and as an <img> (the twinkle animation lives inside the SVG).
 */
export function treeSvg(hash: string, o: { images?: string[] } = {}): string {
  const h = clean(hash);
  const r = rng("tree:" + h);
  const bytes = (h.length % 2 ? h + "0" : h).match(/../g)!.map((b) => parseInt(b, 16));
  const cx = 150;
  // top, bottom (outer tips), half width, number of bough tips
  const tiers: [number, number, number, number][] = [
    [56, 114, 44, 4],
    [90, 162, 66, 5],
    [130, 214, 90, 6],
    [176, 270, 114, 7],
  ];
  const sagOf = (i: number) => 9 + i * 2;
  // half width of tier i at height y (its side is a quadratic curve)
  const half = (i: number, y: number) => {
    const [top, bot, w] = tiers[i];
    const u = Math.max(0, Math.min(1, (y - top) / (bot - top)));
    const t = 1.5 - Math.sqrt(2.25 - 2 * u);
    return 0.8 * w * t + 0.2 * w * t * t;
  };

  const boughs: string[] = [];
  let snow = "";
  tiers.forEach(([top, bot, w, n], i) => {
    const sag = sagOf(i), hgt = bot - top;
    const tips = Array.from({ length: n }, (_, k) => {
      const u = -1 + (2 * k) / (n - 1);
      return [cx + u * w, bot + sag * (1 - u * u) + (k > 0 && k < n - 1 ? (r() - 0.5) * 5 : 0), u] as [number, number, number];
    });
    const sideY = top + hgt * 0.75;
    let d = `M${pt(cx, top)}Q${pt(cx - w * 0.4, sideY)} ${pt(tips[0][0], tips[0][1])}`;
    for (let k = 1; k < n; k++) {
      const [x0, y0] = tips[k - 1], [x1, y1] = tips[k];
      d += `Q${pt((x0 + x1) / 2, Math.min(y0, y1) - 13 - i)} ${pt(x1, y1)}`;
    }
    d += `Q${pt(cx + w * 0.4, sideY)} ${pt(cx, top)}z`;
    // a soft rib along each bough gives the tier some structure
    let ribs = "";
    for (const [x, y, u] of tips) ribs += `M${pt(cx + u * w * 0.1, top + hgt * 0.52)}Q${pt(cx + u * w * 0.5, y - hgt * 0.3)} ${pt(x - u * 5, y - 6)}`;
    boughs.push(`<path d="${d}" fill="url(#tree-g)"/><path d="${ribs}" fill="none" stroke="#8ff0bd" stroke-width="1.5" stroke-linecap="round" opacity=".2"/>`);

    // snow: a drift along each outer edge, and a small cap on every inner tip
    for (const sgn of [-1, 1]) {
      const A = [cx, top], C = [cx + sgn * w * 0.4, sideY], T = [cx + sgn * w, bot], t0 = 0.5;
      const S = [0, 1].map((j) => (1 - t0) * (1 - t0) * A[j] + 2 * t0 * (1 - t0) * C[j] + t0 * t0 * T[j]);
      const C1 = [0, 1].map((j) => C[j] + (T[j] - C[j]) * t0);
      snow += `<path d="M${pt(S[0], S[1])}Q${pt(C1[0], C1[1])} ${pt(T[0], T[1])}q${pt(-sgn * 1, 3)} ${pt(-sgn * 5, 3.5)}Q${pt(C1[0] + sgn * 1, C1[1] + 9)} ${pt(S[0], S[1])}z"/>`;
    }
    for (const [x, y, u] of tips.slice(1, -1)) {
      snow += `<path d="M0 2.5Q-5-1-9.5-6Q0-9 9.5-6Q5-1 0 2.5z" transform="translate(${pt(x, y)}) rotate(${f(-u * 16)}) scale(${f(0.75 + i * 0.08)})"/>`;
    }
  });

  // garlands of lights: one sagging wire per tier, bulbs along it
  let wires = "", lights = "";
  const bulbs: [number, number][] = [];
  let li = Math.floor(r() * BULBS.length);
  tiers.forEach(([top, bot], i) => {
    const hgt = bot - top, dir = (i + (bytes[0] & 1)) % 2 ? 1 : -1;
    const yl = top + hgt * (dir > 0 ? 0.62 : 0.86), yr = top + hgt * (dir > 0 ? 0.86 : 0.62);
    const x0 = cx - half(i, yl) + 4, x1 = cx + half(i, yr) - 4;
    const qx = (x0 + x1) / 2, qy = Math.max(yl, yr) + 9 + i * 2;
    wires += `M${pt(x0, yl)}Q${pt(qx, qy)} ${pt(x1, yr)}`;
    const count = Math.max(3, Math.round((x1 - x0) / 19));
    for (let k = 0; k < count; k++) {
      const t = (k + 0.5) / count;
      const x = (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * qx + t * t * x1;
      const y = (1 - t) * (1 - t) * yl + 2 * t * (1 - t) * qy + t * t * yr + 1.5;
      const c = BULBS[li++ % BULBS.length];
      bulbs.push([x, y]);
      lights += `<g class="light" style="animation-delay:${f(r() * 1.6)}s" fill="${c}"><circle cx="${f(x)}" cy="${f(y)}" r="7.5" opacity=".28"/><circle cx="${f(x)}" cy="${f(y)}" r="3"/></g>`;
    }
  });

  // what hangs on it
  const images = (o?.images ?? []).filter(safeImage).slice(0, 60);
  let hung = "";
  if (images.length) {
    hangPoints(images.length).forEach(([x, y, s], i) => {
      const q = s / 2;
      hung +=
        `<path d="M${pt(x, y - q - 5)}v5" stroke="#ffd166" stroke-width="1.2"/>` +
        `<image href="${images[i].replace(/&/g, "&amp;")}" x="${f(x - q)}" y="${f(y - q)}" width="${f(s)}" height="${f(s)}" clip-path="url(#tree-c)" preserveAspectRatio="xMidYMid slice"/>` +
        `<circle cx="${f(x)}" cy="${f(y)}" r="${f(q)}" fill="none" stroke="#ffd166" stroke-width="${f(Math.max(1, s / 22))}"/>`;
    });
  } else {
    // one ornament per hash byte: the byte picks colour and size, the hash picks the spot
    const want = 13 + (bytes[0] % 6);
    const placed: [number, number, number][] = [];
    for (let tries = 0; tries < 900 && placed.length < want; tries++) {
      const i = Math.floor(r() * tiers.length);
      const [top, bot] = tiers[i];
      const visTop = i ? tiers[i - 1][1] + sagOf(i - 1) + 8 : top + 32;
      const b = bytes[placed.length % bytes.length];
      const rad = 5.5 + ((b >> 4) % 5);
      const y = visTop + r() * (bot - 6 - visTop);
      const x = cx + (r() * 2 - 1) * Math.max(0, half(i, y - rad) - rad - 6);
      if (placed.some(([px, py, pr]) => Math.hypot(px - x, py - y) < pr + rad + 9)) continue;
      if (bulbs.some(([bx, by]) => Math.hypot(bx - x, by - y) < rad + 6)) continue;
      placed.push([x, y, rad]);
    }
    placed.forEach(([x, y, rad], k) => {
      const b = bytes[k % bytes.length];
      const [, main, dark] = GLASS[b % GLASS.length];
      hung +=
        `<path d="M${pt(x, y - rad - 5)}v4" stroke="#e8c14a"/><path d="M${pt(x - 2, y - rad - 1.5)}h4v2.5h-4z" fill="#e8c14a"/>` +
        `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="${main}" stroke="${dark}" stroke-width=".6"/>` +
        `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="url(#tree-s)"/>`;
    });
  }

  let sky = "";
  for (let i = 0; i < 34; i++) sky += `<circle cx="${f(6 + r() * 288)}" cy="${f(6 + r() * 250)}" r="${f(0.5 + r() * 0.9)}" opacity="${f(0.35 + r() * 0.6)}"/>`;

  return (
    `<svg ${XMLNS} viewBox="0 0 300 320" width="600" height="640" class="tree-svg" style="max-width:100%;height:auto" role="img" aria-label="Christmas tree">` +
    TREE_STYLE +
    `<defs><linearGradient id="tree-b" x2="0" y2="1"><stop stop-color="#0c1747"/><stop offset="1" stop-color="${NIGHT}"/></linearGradient>` +
    `<linearGradient id="tree-g" x2="0" y2="1"><stop offset=".36" stop-color="#052a1b"/><stop offset=".58" stop-color="#1c7550"/><stop offset=".84" stop-color="#34a874"/><stop offset="1" stop-color="#218259"/></linearGradient>` +
    `<radialGradient id="tree-s" cx=".34" cy=".3" r=".75"><stop stop-color="#fff" stop-opacity=".85"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></radialGradient>` +
    `<radialGradient id="tree-w"><stop stop-color="#ffd166" stop-opacity=".75"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient>` +
    `<clipPath id="tree-c" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath></defs>` +
    `<rect width="300" height="320" rx="16" fill="url(#tree-b)"/>` +
    `<g fill="#fff">${sky}</g>` +
    `<circle cx="150" cy="170" r="150" fill="url(#tree-w)" opacity=".16"/>` +
    `<path d="M0 294Q75 276 150 286T300 282V304a16 16 0 0 1-16 16H16a16 16 0 0 1-16-16z" fill="#e8f0fb"/>` +
    `<path d="M139 266h22v28q-11 5-22 0z" fill="#5a3a22"/><path d="M152 266h9v28q-4 2-9 2.5z" fill="#3f2715"/>` +
    boughs.reverse().join("") +
    `<g fill="#fff">${snow}</g>` +
    `<path d="${wires}" fill="none" stroke="#062a1c" stroke-width="1.1"/>` +
    lights +
    hung +
    `<circle cx="150" cy="42" r="34" fill="url(#tree-w)"/>` +
    `<path d="M150 14q2.5 22 24 28-21.5 6-24 28-2.5-22-24-28 21.5-6 24-28z" fill="#ffd166"/>` +
    `<path d="M150 30q1.5 9.5 11 12-9.5 2.5-11 12-1.5-9.5-11-12 9.5-2.5 11-12z" fill="#fff" opacity=".7"/>` +
    `</svg>`
  );
}

/** Where to hang n ornament images: [x, y, size] each, spread over the tree and shrinking as n grows. */
function hangPoints(n: number): [number, number, number][] {
  const hw = (y: number) => 16 + (y - 84) * 0.46;
  let rows: { y: number; cap: number }[] = [], s = 46;
  for (; s >= 12; s -= 2) {
    rows = [];
    for (let y = 80 + s / 2; y + s / 2 < 276; y += s * 1.12) rows.push({ y, cap: Math.max(1, Math.floor((2 * hw(y) + s * 0.4) / (s * 1.14))) });
    if (rows.reduce((a, b) => a + b.cap, 0) >= n && rows.length >= Math.min(n, 3)) break;
  }
  const total = rows.reduce((a, b) => a + b.cap, 0);
  n = Math.min(n, total);
  const out: [number, number, number][] = [];
  if (n <= rows.length) {
    // one per row on evenly spread rows, zig-zagging down the tree
    for (let j = 0; j < n; j++) {
      const row = rows[Math.min(rows.length - 1, Math.floor(((j + 0.5) * rows.length) / n))];
      const off = n === 1 ? 0 : (j % 2 ? 1 : -1) * Math.max(0, hw(row.y) - s / 2) * 0.55;
      out.push([150 + off, row.y, s]);
    }
    return out;
  }
  // share n over the rows in proportion to their width, at least one each
  const counts = rows.map((row) => Math.max(1, Math.floor((n * row.cap) / total)));
  let left = n - counts.reduce((a, b) => a + b, 0);
  for (let i = rows.length - 1, guard = 0; left !== 0 && guard < 1000; i = (i - 1 + rows.length) % rows.length, guard++) {
    if (left > 0 && counts[i] < rows[i].cap) counts[i]++, left--;
    else if (left < 0 && counts[i] > 1) counts[i]--, left++;
  }
  rows.forEach((row, i) => {
    const c = counts[i], span = Math.min(2 * hw(row.y) + s * 0.4 - s, (c - 1) * s * 1.5);
    for (let j = 0; j < c; j++) out.push([150 + (c === 1 ? 0 : -span / 2 + (span * j) / (c - 1)), row.y + (j % 2 ? s * 0.07 : -s * 0.07), s]);
  });
  return out;
}

/* ------------------------------------------------------------------ snowman */

/** Snowman made of your UTxOs. Each snowball is one UTxO; bigger value → bigger snowball. */
export function snowmanSvg(values: number[]): string {
  const sorted = (Array.isArray(values) ? values : []).map(Number).filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => b - a);
  const size = (v: number) => Math.max(5, Math.min(48, 6 + Math.log10(v / 1e6 + 1) * 14));
  const body = sorted.slice(0, 3);
  while (body.length < 3) body.push(1_000_000);
  const [b, m, t] = [size(body[0]) + 10, size(body[1]) + 4, size(body[2])].map((n, i) => Math.max(n, [34, 24, 16][i]));
  const ground = 228, cx = 150;
  const yb = ground - b + 3, ym = yb - (b + m) * 0.84, yt = ym - (m + t) * 0.84;
  const hatW = t * 0.72, brimY = yt - t * 0.8, hatH = Math.max(14, t * 0.95), hatTop = brimY - hatH;
  // scale the whole figure (from the ground up) so a big wallet's snowman never loses its hat
  const k = Math.min(1, (ground - 10) / (ground - hatTop + 2));
  const neck = yt + t * 0.82;

  const loose = sorted.slice(3, 60).map((v, i) => {
    const s = size(v) * 0.6;
    const x = i % 2 ? 232 + ((i * 37) % 56) : 12 + ((i * 41) % 56);
    return `<circle cx="${x}" cy="${f(ground + 4 - s)}" r="${f(s)}"/>`;
  });
  const flakes = Array.from({ length: 22 }, (_, i) => `<circle cx="${(i * 67 + 13) % 300}" cy="${(i * 97 + 9) % 215}" r="${f(0.8 + (i % 3) * 0.5)}" opacity="${f(0.35 + (i % 4) * 0.15)}"/>`).join("");
  const eye = t * 0.34, er = Math.max(1.6, t * 0.09);
  const smile = [-0.42, -0.22, 0, 0.22, 0.42].map((u) => `<circle cx="${f(cx + u * t)}" cy="${f(yt + t * (0.42 - u * u * 0.55))}" r="${f(er * 0.6)}"/>`).join("");
  const armY = ym - m * 0.2, armX = m * 0.88;

  return (
    `<svg ${XMLNS} viewBox="0 0 300 250" width="600" height="500" class="snowman-svg" style="max-width:100%;height:auto" role="img" aria-label="Snowman">` +
    `<defs><linearGradient id="snowman-b" x2="0" y2="1"><stop stop-color="#0b1640"/><stop offset="1" stop-color="#1d2f80"/></linearGradient>` +
    `<radialGradient id="snowman-g" cx=".38" cy=".3" r=".8"><stop stop-color="#fff"/><stop offset=".6" stop-color="#f1f6ff"/><stop offset="1" stop-color="#c3d3ee"/></radialGradient></defs>` +
    `<rect width="300" height="250" rx="14" fill="url(#snowman-b)"/><g fill="#fff">${flakes}</g>` +
    `<path d="M0 ${ground}q75-10 150-4t150-2v14a14 14 0 0 1-14 14H14a14 14 0 0 1-14-14z" fill="#e8f0fb"/>` +
    `<g fill="url(#snowman-g)" stroke="#b9c9e6">${loose.join("")}</g>` +
    `<g transform="translate(${cx} ${ground}) scale(${Math.round(k * 1000) / 1000}) translate(${-cx} ${-ground})">` +
    `<ellipse cx="${cx}" cy="${ground + 2}" rx="${f(b * 0.95)}" ry="5" fill="#9fb2d8" opacity=".5"/>` +
    // arms go behind the body
    `<g fill="none" stroke="#6b4a2e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="M${pt(cx - armX, armY)}l-26-16m9 5.5l-9 4m2-8.5l-1-9"/>` +
    `<path d="M${pt(cx + armX, armY)}l24-22m-8 7.5l10 1m-6-5l1-9"/></g>` +
    `<g fill="url(#snowman-g)" stroke="#b9c9e6" stroke-width="1.5"><circle cx="${cx}" cy="${f(yb)}" r="${f(b)}"/><circle cx="${cx}" cy="${f(ym)}" r="${f(m)}"/><circle cx="${cx}" cy="${f(yt)}" r="${f(t)}"/></g>` +
    // scarf
    `<path d="M${pt(cx - t * 0.78, neck - 5)}q${pt(t * 0.78, 9)} ${pt(t * 1.56, 0)}l${pt(2, 8)}q${pt(-t * 0.78 - 2, 10)} ${pt(-t * 1.56 - 4, 0)}z" fill="#d62839"/>` +
    `<path d="M${pt(cx + t * 0.3, neck + 4)}l${pt(9, 2)} ${pt(-3, t * 0.9 + 8)} ${pt(-9, -2)}z" fill="#b81f30"/>` +
    // hat
    `<path d="M${pt(cx - hatW, brimY)}v${f(-hatH)}h${f(hatW * 2)}v${f(hatH)}z" fill="#0033ad"/>` +
    `<path d="M${pt(cx - hatW, brimY - 5)}h${f(hatW * 2)}v5h${f(-hatW * 2)}z" fill="#ffd166"/>` +
    `<path d="M${pt(cx - hatW * 1.45, brimY)}h${f(hatW * 2.9)}" stroke="#0033ad" stroke-width="4.5" stroke-linecap="round"/>` +
    // face and buttons
    `<g fill="#1b1f3a"><circle cx="${f(cx - eye)}" cy="${f(yt - t * 0.18)}" r="${f(er)}"/><circle cx="${f(cx + eye)}" cy="${f(yt - t * 0.18)}" r="${f(er)}"/>${smile}` +
    `<circle cx="${cx}" cy="${f(ym - m * 0.25)}" r="2.6"/><circle cx="${cx}" cy="${f(ym + m * 0.2)}" r="2.6"/><circle cx="${cx}" cy="${f(yb - b * 0.45)}" r="2.6"/></g>` +
    `<path d="M${pt(cx, yt - t * 0.04)}l${pt(t * 0.85, t * 0.14)} ${pt(-t * 0.85, t * 0.14)}z" fill="#ff9d3c"/>` +
    `</g></svg>`
  );
}

/* -------------------------------------------------------------------- icons */

const GOLD = `style="fill:var(--gold,#ffd166)"`;
const GOLD_ONLY = `style="fill:var(--gold,#ffd166);stroke:none"`;
const GOLD_LINE = `style="stroke:var(--gold,#ffd166)"`;

/** Six-arm snowflake path around (cx, cy): arm length R, with V-shaped branches at [distance, length] along each arm. */
function flakePath(cx: number, cy: number, R: number, branches: [number, number][]): string {
  let d = "";
  for (let k = 0; k < 6; k++) {
    const a = ((k * 60 - 90) * Math.PI) / 180;
    d += `M${pt(cx, cy)}L${pt(cx + Math.cos(a) * R, cy + Math.sin(a) * R)}`;
    for (const [q, len] of branches) {
      const px = cx + Math.cos(a) * q, py = cy + Math.sin(a) * q;
      const e = (s: number) => pt(px + Math.cos(a + s) * len, py + Math.sin(a + s) * len);
      d += `M${e(-1.05)}L${pt(px, py)}L${e(1.05)}`;
    }
  }
  return d;
}

const ICONS: Record<number, string> = {
  // 1 The Chain's Heartbeat — heart with a pulse line
  1: `<path d="M24 41C13 33 6 26 6 17.5a9 9 0 0 1 18-1.5 9 9 0 0 1 18 1.5C42 26 35 33 24 41z"/><path d="M12 24h6l3-6 5 11 3-5h7" ${GOLD_LINE}/>`,
  // 2 Who Baked This Block? — baker's hat
  2: `<path d="M15 34h18v6H15z" ${GOLD}/><path d="M15 34v-4a8 8 0 1 1 3.5-15.200 6 6 0 0 1 11 0A8 8 0 1 1 33 30v4M21 34v-5M27 34v-5"/>`,
  // 3 Transaction Snowfall — snowflake
  3: `<path d="${flakePath(24, 24, 19, [[12, 5]])}"/><circle cx="24" cy="24" r="3" ${GOLD_ONLY}/>`,
  // 4 Fortune Cookie — cookie with its paper slip
  4: `<path d="M19 33l21 5-1.5 6-21-5z" ${GOLD}/><path d="M7 23a17 15 0 0 1 34 0c0 4-3 6.5-7.5 6-4.5-.5-7.5-4-9.500-9-2 5-5 8.5-9.500 9C10 29.500 7 27 7 23zM24 20c0-4 2-7 5-9.500"/>`,
  // 5 Naughty or Nice? — checklist scroll
  5: `<path d="M14 6h22v32a4 4 0 0 1-4 4H10a4 4 0 0 0 4-4z"/><path d="M19 14l2 2 3.5-4M19 23l2 2 3.5-4" ${GOLD_LINE}/><path d="M29 14h3M29 23h3M19.500 32H32"/>`,
  // 6 Epoch Advent Wreath — wreath with a candle
  6: `<circle cx="24" cy="26" r="15.300" stroke-width="5" stroke-dasharray=".1 5.900"/><path d="M21.500 26h5v9h-5z"/><path d="M24 15.500c1.800 2.200 2.800 3.600 2.800 5a2.800 2.800 0 0 1-5.600 0c0-1.400 1-2.800 2.800-5z" ${GOLD_ONLY}/>`,
  // 7 The Great ADA Gift Pile — stacked presents
  7: `<path d="M5 27h18v15H5zM25 31h18v11H25zM13 13h17v14H13zM14 27v15M34 31v11M21.500 13v14"/><path d="M21.500 13c-1.500-4-7-5.500-7-2.500 0 2.200 4 2.500 7 2.500zm0 0c1.500-4 7-5.500 7-2.500 0 2.200-4 2.500-7 2.500z" ${GOLD}/>`,
  // 8 Sign the Nice List — quill and signature
  8: `<path d="M41 5C28 7 19 15 16 28l-1 5 5-1c13-3 20-13 21-27zM9 41l6-8 16-18"/><path d="M19 42c2.500-2.500 4.500-2.500 6 0s4 2 6-.5 4-1.500 8 .5" ${GOLD_LINE}/>`,
  // 9 Block-Hash Tree — fir tree
  9: `<path d="M24 5l7 9h-3l7 9h-4l8 11H9l8-11h-4l7-9h-3zM21 34v8h6v-8"/><g ${GOLD_ONLY}><circle cx="24" cy="15" r="1.800"/><circle cx="20" cy="24" r="1.800"/><circle cx="28" cy="29" r="1.800"/><circle cx="18" cy="30" r="1.800"/></g>`,
  // 10 UTxO Snowman
  10: `<circle cx="24" cy="33" r="10.500"/><circle cx="24" cy="16" r="6.500"/><path d="M18.500 9.500h11M21 9.500V4h6v5.500M14.500 29l-8-5M33.500 29l8-5"/><path d="M24 16l6 1.500-6 1.500z" ${GOLD_ONLY}/><path d="M21.500 14.500h0M26.500 14.500h0M24 29.500h0M24 35.500h0" stroke-width="2.200"/>`,
  // 11 Stake Pool Party — party popper
  11: `<path d="M5 43l9-25 16 16zM9.500 30.500l8 8M24 17c-1-4 3-5 2-9M32 26c4 1 5-3 9-2M40 7l1 3M41 35l-3-1"/><g ${GOLD_ONLY}><circle cx="34" cy="11" r="2.500"/><circle cx="41" cy="18" r="2"/><circle cx="30" cy="19" r="2"/></g>`,
  // 12 Letter to Santa — open envelope with a letter
  12: `<path d="M11 22.500V7h26v15.500M6 19l18 13 18-13v22H6zM6 19l5-3.600M42 19l-5-3.600"/><path d="M24 21.500c-4.500-3-5.500-6-4-7.800 1.300-1.500 3.400-.7 4 1.100.6-1.800 2.700-2.600 4-1.100 1.500 1.800.5 4.800-4 7.800z" ${GOLD_ONLY}/>`,
  // 13 Santa's Mailbox
  13: `<path d="M34 5h7v5h-7z" ${GOLD}/><path d="M8 31V19a8 8 0 0 1 16 0v12zM16 11h18a8 8 0 0 1 8 8v12H24M24 31v12M19 43h10M34 21V5M13 21h6"/>`,
  // 14 Treasury Stockings
  14: `<path d="M15 5h18v8H15z" ${GOLD}/><path d="M17 13v13c0 2-1 3.500-3 5l-5 3.500a5 5 0 0 0 5.500 8.300L27 37c3-1.800 4-4 4-8V13M23.500 39l-3-5"/>`,
  // 15 Mint an Ornament — bauble
  15: `<path d="M20 11h8v4.500h-8z" ${GOLD}/><circle cx="24" cy="29.500" r="14"/><circle cx="24" cy="7.500" r="3"/><path d="M11 25q13 6 26 0M11.500 33.500q12.500 6 25 0"/>`,
  // 16 Biggest Gift — one big present
  16: `<path d="M24 15c-2-6-10-9-11-4.500-.7 3.500 6 4.500 11 4.500zm0 0c2-6 10-9 11-4.500.7 3.500-6 4.500-11 4.500z" ${GOLD}/><path d="M5 15h38v8H5zM8 23h32v19H8zM24 15v27"/>`,
  // 17 Gift a Friend — present with a heart tag
  17: `<path d="M6 24h22v18H6zM4 17h26v7H4zM17 17v25M17 17c-1.500-5-8-6-8-2.500 0 2.500 5 2.500 8 2.500zm0 0c1.500-5 8-6 8-2.500 0 2.500-5 2.500-8 2.500zM26 13.500q8-2 10.500 8"/><path d="M37 35c-6.500-4-8.500-8.500-6.500-11.500 1.700-2.500 5.300-1.700 6.500 1 1.200-2.700 4.800-3.500 6.500-1 2 3 0 7.500-6.500 11.500z" ${GOLD}/>`,
  // 18 Christmas in Slots — hourglass
  18: `<path d="M19 12h10c-1 3.500-3 5.500-5 8-2-2.500-4-4.500-5-8zM17 42c1-5 4-7.500 7-10 3 2.500 6 5 7 10z" ${GOLD_ONLY}/><path d="M11 5h26M11 43h26M14 5c0 9 6 13 10 19-4 6-10 10-10 19M34 5c0 9-6 13-10 19 4 6 10 10 10 19"/>`,
  // 19 DRep Carolers — singing notes
  19: `<path d="M18 35V13l18-4v22M18 19l18-4M41 37l2 2M42 4l1.500-2M6 18l-2-2"/><ellipse cx="13.500" cy="35" rx="4.500" ry="3.500" ${GOLD}/><ellipse cx="31.500" cy="31" rx="4.500" ry="3.500" ${GOLD}/>`,
  // 20 Ghost of Christmas Past — snow globe
  20: `<path d="M24 10l5 7h-2.500l4.500 7.500H17l4.500-7.500H19z" ${GOLD_ONLY}/><circle cx="24" cy="20" r="15"/><path d="M12 35h24l3 8H9zM24 24.500V29"/><path d="M14.500 15h0M33 13h0M34.500 24h0M14 25h0" stroke-width="2.200"/>`,
  // 21 Seal a Secret Wish — sealed envelope with wax
  21: `<path d="M5 11h38v27H5zM5 12l19 15 19-15M5 38l12.500-10M43 38L30.500 28"/><circle cx="24" cy="27" r="6" ${GOLD}/>`,
  // 22 Hang Your Ornaments — bough with a hanging bauble
  22: `<path d="M4 8c12 6 27 6 40 1M12 11.500l-3 5M18 13l-2 5.500M30 13l2 5.500M36 11.500l3 5M13 6.500l3 5M35 6.500l-3 5.500M24 13v9"/><circle cx="24" cy="33" r="9" ${GOLD}/><path d="M21.500 23.500h5"/>`,
  // 23 Elf Workload Report — sleigh with a sack
  23: `<path d="M16 22c-2-4 0-8 3-9.500l-1.500-3h7l-1.500 3c3 1.500 5 5.500 3 9.500z" ${GOLD}/><path d="M6 13c0 11 4 19 13 19h19v-9c0-3-2-5-5-5h-4c0 4-3 7-7 7-6 0-9-5-9-12zM5 41h29c5 0 8-3 8-7M14 32v9M30 32v9"/>`,
  // 24 Light the Star — compass star
  24: `<path d="M24 4q1.500 16 18 20-16.500 4-18 20-1.500-16-18-20 16.500-4 18-20z" ${GOLD}/><path d="M11 11l4 4M37 11l-4 4M11 37l4-4M37 37l-4-4"/>`,
};
const ICON_FALLBACK = `<path d="${starPath(24, 25.5, 5, 19, 8)}"/>`;
/** "9.500" → "9.5": the icon table above is written with padded decimals for readability. */
const trim = (s: string) => s.replace(/(\.\d)00(?!\d)/g, "$1");

/** Line icon for a door (48×48, strokes in currentColor, accents in --gold). Safe to inline many times: no ids. */
export function doorIcon(day: number): string {
  return `<svg ${XMLNS} viewBox="0 0 48 48" width="48" height="48" class="door-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${trim(ICONS[day] ?? ICON_FALLBACK)}</svg>`;
}

/** The ₳ sign, drawn: a capital A with two bars. Sized 1em so it sits in a line of text. */
export function adaMark(): string {
  return `<svg ${XMLNS} viewBox="0 0 24 24" width="1em" height="1em" class="ada-mark" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5.5 21L12 3l6.5 18M3.5 12h17M3.5 16h17"/></svg>`;
}

/** One six-arm snowflake. Sized 1em; colour follows the text colour. */
export function flakeSvg(): string {
  return `<svg ${XMLNS} viewBox="0 0 48 48" width="1em" height="1em" class="flake" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${flakePath(24, 24, 21, [[8.5, 4.5], [15, 5.5]])}"/></svg>`;
}
