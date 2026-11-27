import "./scene.css";
import { getOpened } from "./config";
import { onBlock, type Tip } from "./koios";

// The lit-tree strip between the header and the calendar.
//
// One inline SVG, drawn here (original artwork). Everything is laid out in "units":
// the scene is always 220 units tall and W units wide, where W follows the strip's
// aspect ratio (about 540 on a phone, about 1070 on desktop). The tree stays at x = 0,
// the six houses (4 windows each = 24, one per door) spread out to fill the sides.

const H = 220;
const TOTAL = 24;
const BULB_R = 3.8;
/** Festive bulb colours: gold, soft berry, light pine, light Cardano blue, amber. */
const BULB_COLORS = ["#ffd166", "#ff6f6f", "#74dba6", "#8fb4ff", "#ffa54a"];

interface Tier {
  /** apex y */ a: number;
  /** hem y */ b: number;
  /** half width at the hem */ w: number;
  /** bulbs on this tier */ n: number;
}
// Top to bottom. 2 + 4 + 5 + 6 + 7 = 24 bulbs.
const TIERS: Tier[] = [
  { a: 28, b: 64, w: 25, n: 2 },
  { a: 44, b: 94, w: 39, n: 4 },
  { a: 70, b: 124, w: 52, n: 5 },
  { a: 97, b: 152, w: 64, n: 6 },
  { a: 123, b: 180, w: 75, n: 7 },
];
const STAR_Y = 18;

const f = (n: number) => String(Math.round(n * 10) / 10);

/** Half width of the tree silhouette at height y (0 outside the tree). */
export function treeHalfWidth(y: number): number {
  let w = 0;
  for (const t of TIERS) if (y >= t.a && y <= t.b) w = Math.max(w, (t.w * (y - t.a)) / (t.b - t.a));
  return w;
}

interface Swag {
  x0: number; y0: number; cx: number; cy: number; x1: number; y1: number;
}
/** The garland on one tier: enters high on the left edge, sags, leaves low on the right edge. */
function swag(t: Tier): Swag {
  const y0 = t.b - 17;
  const y1 = t.b - 8;
  const x0 = -treeHalfWidth(y0);
  const x1 = treeHalfWidth(y1);
  return { x0, y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 + 7, x1, y1 };
}

/**
 * Centres of the 24 bulbs, index 0 = door 1. The garland climbs the tree: door 1 is at the
 * bottom right, door 24 just under the star. Bulbs sit on the swag of their tier, evenly
 * spaced in x and symmetric around the trunk.
 */
export function bulbPoints(): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let k = TIERS.length - 1; k >= 0; k--) {
    const t = TIERS[k];
    const g = swag(t);
    const reach = -g.x0 + 1;
    for (let j = t.n - 1; j >= 0; j--) {
      const x = reach * ((2 * (j + 0.5)) / t.n - 1);
      const s = (x - g.x0) / (g.x1 - g.x0); // the control point is the x midpoint, so x is linear in s
      const y = (1 - s) * (1 - s) * g.y0 + 2 * s * (1 - s) * g.cy + s * s * g.y1;
      out.push({ x, y });
    }
  }
  return out;
}

/** Which village window lights up for a door (a fixed shuffle, so the lights scatter). */
const windowFor = (day: number) => (day * 7 + 3) % TOTAL;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Top of the front snow at x: gentle waves with a small rise under the tree. */
const hillY = (x: number) => 180 + 4 * Math.sin(x / 97 + 1) + 2.5 * Math.sin(x / 41) - 5 * Math.exp(-(x * x) / 12100);
/** Ridge of the far hill. */
const backY = (x: number) => 158 + 7 * Math.sin(x / 140 + 0.6) + 3 * Math.sin(x / 47 + 2);

function ridge(fn: (x: number) => number, W: number): string {
  const x0 = -W / 2 - 4;
  const x1 = W / 2 + 4;
  let d = `M${f(x0)},${H + 4}L${f(x0)},${f(fn(x0))}`;
  for (let x = x0 + 10; x < x1; x += 10) d += `L${f(x)},${f(fn(x))}`;
  return `${d}L${f(x1)},${f(fn(x1))}L${f(x1)},${H + 4}Z`;
}

function starPath(R: number, r: number): string {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r : R;
    const an = (Math.PI / 5) * i - Math.PI / 2;
    d += `${i ? "L" : "M"}${f(Math.cos(an) * rad)},${f(Math.sin(an) * rad)}`;
  }
  return d + "Z";
}

/** A four-point sparkle centred on 0,0. */
const sparkle = (r: number) =>
  `M0,${f(-r)}L${f(r * 0.22)},${f(-r * 0.22)}L${f(r)},0L${f(r * 0.22)},${f(r * 0.22)}L0,${f(r)}L${f(-r * 0.22)},${f(r * 0.22)}L${f(-r)},0L${f(-r * 0.22)},${f(-r * 0.22)}Z`;

const HOUSE_BODY = ["#1c2769", "#25235f", "#182a5e"];

function house(x: number, w: number, k: number, firstWindow: number, doorOf: number[]): string {
  let base = Infinity;
  for (let i = 0; i <= 4; i++) base = Math.min(base, hillY(x + (w * i) / 4));
  base -= 0.5; // everything above `base` is clear of the snow drawn in front
  const bh = w * [0.92, 1.06, 0.88][k % 3];
  const rh = w * [0.46, 0.4, 0.52][k % 3];
  const top = base - bh;
  const body = HOUSE_BODY[k % 3];
  const ww = w * 0.22;
  const wh = ww * 1.25;
  const cols = [x + w * 0.17, x + w * 0.61];
  const rows = [top + bh * 0.15, base - wh - bh * 0.13];
  const chimX = x + w * (k % 2 ? 0.18 : 0.68);
  const chimTop = top - rh * 0.55 - 8;

  let s = `<g class="scn-house">`;
  s += `<rect x="${f(chimX)}" y="${f(chimTop)}" width="5.5" height="${f(rh + 8)}" fill="#2c3884"/>`;
  s += `<path d="M${f(chimX - 0.8)},${f(chimTop)}h7.1" stroke="#e8efff" stroke-width="2" stroke-linecap="round"/>`;
  if (k === 1 || k === 4) {
    s += `<g class="scn-smoke" transform="translate(${f(chimX + 2.7)} ${f(chimTop - 3)})">`;
    for (let i = 0; i < 3; i++) s += `<circle r="2.6" style="--d:${(-i * 2).toFixed(1)}s"/>`;
    s += `</g>`;
  }
  s += `<rect x="${f(x)}" y="${f(top)}" width="${f(w)}" height="${f(bh + 16)}" fill="${body}"/>`;
  const roof = `M${f(x - 3)},${f(top)}L${f(x + w / 2)},${f(top - rh)}L${f(x + w + 3)},${f(top)}`;
  s += `<path d="${roof}Z" fill="#0f163f"/>`;
  s += `<path d="${roof}" fill="none" stroke="#e8efff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  let n = firstWindow;
  for (const wy of rows)
    for (const wx of cols) {
      s += `<g class="scn-win" data-n="${doorOf[n++]}">`;
      s += `<rect class="scn-off" x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}" rx=".8"/>`;
      // someone's home: a soft warm glow in every window, a few flicker like a fire
      const flick = (n * 5 + k) % 3 === 0;
      s += `<rect class="scn-cosy${flick ? " scn-flick" : ""}" style="--d:${(-((n * 1.7) % 4)).toFixed(1)}s" x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}" rx=".8" fill="#e8a24c"/>`;
      s += `<g class="scn-on"><rect x="${f(wx - 2.5)}" y="${f(wy - 2.5)}" width="${f(ww + 5)}" height="${f(wh + 5)}" rx="2.5" fill="#ff9d3c" opacity=".38"/>`;
      s += `<rect x="${f(wx)}" y="${f(wy)}" width="${f(ww)}" height="${f(wh)}" rx=".8" fill="#ffd27a"/></g>`;
      s += `<path d="M${f(wx + ww / 2)},${f(wy)}v${f(wh)}M${f(wx)},${f(wy + wh / 2)}h${f(ww)}" stroke="${body}" stroke-width=".7"/></g>`;
    }
  return s + `</g>`;
}

/** A small background fir (no lights), rooted behind the front snow. */
function fir(x: number, h: number): string {
  const base = hillY(x) + 3;
  const tiers: [number, number, number][] = [
    [0, 0.44, 0.2],
    [0.2, 0.72, 0.3],
    [0.44, 1, 0.4],
  ];
  let d = "";
  let snow = "";
  for (const [a, b, hw] of tiers) {
    const ya = base - h + a * h;
    const yb = base - h + b * h;
    d += `M${f(x)},${f(ya)}L${f(x + hw * h)},${f(yb)}L${f(x - hw * h)},${f(yb)}Z`;
    snow += `M${f(x)},${f(ya + 1)}L${f(x - hw * h * 0.62)},${f(ya + (yb - ya) * 0.62)}`;
  }
  return `<path d="${d}" fill="#123c40"/><path d="${snow}" fill="none" stroke="#dfe9ff" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>`;
}

/** The whole scene as an SVG string, W units wide (the tree is at x = 0). No lit state: see paint(). */
export function sceneSvg(W: number): string {
  const half = W / 2;
  const rand = rng(2512);
  const moonX = -half + Math.max(48, W * 0.13);
  const moonY = 42;

  // ---- defs
  let defs = `<linearGradient id="scn-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7e2ff"/><stop offset=".35" stop-color="#a9baf2"/><stop offset="1" stop-color="#6a7fd4"/></linearGradient>`;
  defs += `<linearGradient id="scn-firg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#124634"/><stop offset="1" stop-color="#2f8a5f"/></linearGradient>`;
  BULB_COLORS.forEach((c, i) => {
    defs += `<radialGradient id="scn-h${i}"><stop offset="0" stop-color="${c}" stop-opacity=".75"/><stop offset=".35" stop-color="${c}" stop-opacity=".32"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
  });
  defs += `<radialGradient id="scn-aurag"><stop offset="0" stop-color="#ffd166" stop-opacity=".5"/><stop offset=".55" stop-color="#ff9d3c" stop-opacity=".16"/><stop offset="1" stop-color="#ff9d3c" stop-opacity="0"/></radialGradient>`;
  defs += `<radialGradient id="scn-moong"><stop offset="0" stop-color="#fff3cf" stop-opacity=".34"/><stop offset="1" stop-color="#fff3cf" stop-opacity="0"/></radialGradient>`;
  defs += `<mask id="scn-moonm"><circle r="15" fill="#fff"/><circle cx="6.5" cy="-4.5" r="12.6" fill="#000"/></mask>`;
  defs += `<linearGradient id="scn-tail" gradientUnits="userSpaceOnUse" x1="-56" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff6d8"/></linearGradient>`;

  // ---- sky
  let sky = "";
  const count = Math.round(W / 9);
  for (let i = 0; i < count; i++) {
    const x = -half + rand() * W;
    const u = rand();
    const y = 6 + 128 * u * u;
    const r = 0.7 + rand() * 0.9;
    const o = 0.45 + rand() * 0.5;
    const tw = rand() < 0.16;
    const t = 2.6 + rand() * 3;
    const d = -rand() * 5;
    if (Math.abs(x) < treeHalfWidth(y) + 9 || (Math.abs(x) < 20 && y < 36)) continue; // behind the tree / its star
    if (Math.hypot(x - moonX, y - moonY) < 24) continue;
    sky += `<circle${tw ? ` class="scn-tw" style="--t:${t.toFixed(1)}s;--d:${d.toFixed(1)}s"` : ""} cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#fff" opacity="${o.toFixed(2)}"/>`;
  }
  // a few bigger four-point stars at fixed fractions of the width
  for (const [fx, y, r] of [[-0.31, 24, 4.2], [0.2, 40, 3.4], [0.39, 18, 4.6], [-0.12, 62, 3], [0.3, 78, 3.2]] as const)
    sky += `<path class="scn-tw" style="--t:${(3 + r).toFixed(1)}s;--d:${(-r).toFixed(1)}s" transform="translate(${f(fx * W)} ${y})" d="${sparkle(r)}" fill="#fff8e0" opacity=".9"/>`;
  sky += `<g transform="translate(${f(moonX)} ${moonY})"><circle r="40" fill="url(#scn-moong)"/><circle r="15" fill="#fff3cf" mask="url(#scn-moonm)"/></g>`;

  const shoot = `<g class="scn-shoot"><g class="scn-shoot-r"><path d="M-56,0L0,-1.2L0,1.2Z" fill="url(#scn-tail)"/><circle r="1.9" fill="#fff"/></g></g>`;

  // ---- far hill with a line of tiny firs
  let far = `<path d="${ridge(backY, W)}" fill="#2a3b94"/>`;
  let farFirs = "";
  for (let x = -half + 6 + rand() * 12; x < half; x += 12 + rand() * 20) {
    const h = 9 + rand() * 9;
    if (Math.abs(x) < 84) continue;
    const y = backY(x) + 1.5;
    farFirs += `M${f(x - h * 0.36)},${f(y)}L${f(x)},${f(y - h)}L${f(x + h * 0.36)},${f(y)}Z`;
  }
  far += `<path d="${farFirs}" fill="#17245f"/>`;

  // ---- village: three houses a side, firs in the gaps when there is room
  const doorOf: number[] = [];
  for (let day = 1; day <= TOTAL; day++) doorOf[windowFor(day)] = day;
  const inner = 90;
  const slot = (half - 12 - inner) / 3;
  const hw = Math.max(34, Math.min(50, slot * 0.8));
  let village = "";
  for (const side of [-1, 1])
    for (let i = 0; i < 3; i++) {
      const k = side < 0 ? 2 - i : 3 + i; // 0..5 from left to right
      const centre = side * (inner + slot * (i + 0.5));
      const gap = slot - hw;
      if (i < 2 && gap >= 26) {
        const fx = side * (inner + slot * (i + 1));
        village += fir(fx - (gap >= 70 ? gap * 0.16 : 0), Math.min(62, 26 + gap * 0.42));
        if (gap >= 70) village += fir(fx + gap * 0.2, Math.min(44, 18 + gap * 0.26));
      }
      village += house(centre - hw / 2, hw, k, k * 4, doorOf);
    }

  const snow = `<path d="${ridge(hillY, W)}" fill="url(#scn-snow)"/>`;

  // ---- the tree
  let tree = `<ellipse class="scn-aura" cx="0" cy="108" rx="118" ry="104" fill="url(#scn-aurag)"/>`;
  tree += `<ellipse cx="0" cy="190" rx="36" ry="4.5" fill="#4455b0" opacity=".4"/>`;
  tree += `<rect x="-6" y="176" width="12" height="14" fill="#4a3418"/>`;
  let garland = "";
  for (let k = TIERS.length - 1; k >= 0; k--) {
    const t = TIERS[k];
    const segs = Math.max(3, Math.round((2 * t.w) / 11));
    const step = (2 * t.w) / segs;
    let hem = "";
    for (let i = 1; i <= segs; i++) {
      const x = t.w - step * i;
      hem += `Q${f(x + step / 2)},${f(t.b + 5)} ${f(x)},${t.b}`;
    }
    tree += `<path d="M0,${t.a}L${f(t.w)},${t.b}${hem}Z" fill="url(#scn-firg)"/>`;
    const g = swag(t);
    garland += `M${f(g.x0)},${f(g.y0)}Q${f(g.cx)},${f(g.cy)} ${f(g.x1)},${f(g.y1)}`;
    // draw the hem snow of this tier before the tier above overlaps it
    tree += `<path d="M${f(t.w)},${t.b}${hem}" fill="none" stroke="#eaf1ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity=".85" transform="translate(0 -.4)"/>`;
  }
  tree += `<path d="${garland}" fill="none" stroke="#0b2c20" stroke-width="1" opacity=".7"/>`;

  // fairy lights: small, always on, twinkling along the garland between the door bulbs
  const big = bulbPoints();
  let fairy = "";
  let fi = 0;
  // two strings per tier: along the garland, and a second one higher up that sags the other way
  const strings: Swag[] = [];
  for (const t of TIERS) {
    strings.push(swag(t));
    const y0 = t.a + (t.b - t.a) * 0.55;
    const y1 = y0 - 6;
    const x0 = -treeHalfWidth(y0) * 0.92;
    const x1 = treeHalfWidth(y1) * 0.92;
    if (x1 - x0 > 14) strings.push({ x0, y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 + 6, x1, y1 });
  }
  for (const g of strings) {
    const steps = Math.round((g.x1 - g.x0) / 6.5);
    for (let i = 1; i < steps; i++) {
      const u = i / steps;
      const x = (1 - u) * (1 - u) * g.x0 + 2 * u * (1 - u) * g.cx + u * u * g.x1;
      const y = (1 - u) * (1 - u) * g.y0 + 2 * u * (1 - u) * g.cy + u * u * g.y1;
      if (big.some((b) => Math.hypot(b.x - x, b.y - y) < 4.8)) continue;
      const c = BULB_COLORS[fi % BULB_COLORS.length];
      fairy += `<g class="scn-fairy" style="--d:${(-rand() * 3).toFixed(2)}s;--t:${(1.6 + rand() * 1.6).toFixed(1)}s"><circle cx="${f(x)}" cy="${f(y)}" r="3.4" fill="${c}" opacity=".28"/><circle cx="${f(x)}" cy="${f(y)}" r="1.35" fill="${c}"/></g>`;
      fi++;
    }
  }
  tree += fairy;

  let bulbs = "";
  bulbPoints().forEach((p, i) => {
    const c = i % BULB_COLORS.length;
    bulbs += `<g class="scn-bulb" data-n="${i + 1}" style="--i:${i}" transform="translate(${f(p.x)} ${f(p.y)})"><circle class="scn-off" r="${BULB_R}"/>`;
    bulbs += `<g class="scn-on"><circle r="10.5" fill="url(#scn-h${c})"/><circle r="${BULB_R}" fill="${BULB_COLORS[c]}"/><circle cx="-1" cy="-1.1" r="1" fill="#fff" opacity=".85"/></g></g>`;
  });

  const sp = starPath(10, 4.3);
  const star = `<g class="scn-star" transform="translate(0 ${STAR_Y})"><path class="scn-off" d="${sp}"/><g class="scn-on"><circle r="27" fill="url(#scn-h0)"/><path d="${sparkle(19)}" fill="#ffe9a8" opacity=".55"/><path d="${sp}" fill="#ffd166" stroke="#fff3cf" stroke-width=".8" stroke-linejoin="round"/></g></g>`;

  let burst = `<g class="scn-burst" transform="translate(0 104)">`;
  for (let i = 0; i < 14; i++) {
    const an = (Math.PI * 2 * i) / 14 + rand() * 0.4;
    const dist = 52 + rand() * 46;
    burst += `<path class="scn-sp" style="--dx:${f(Math.cos(an) * dist)}px;--dy:${f(Math.sin(an) * dist * 0.85 - 10)}px;--dl:${Math.round(rand() * 220)}ms" d="${sparkle(3.5 + rand() * 3.5)}" fill="${i % 3 ? "#ffd166" : "#fff3cf"}"/>`;
  }
  burst += `</g>`;

  return (
    `<svg class="scn-svg" xmlns="http://www.w3.org/2000/svg" viewBox="${f(-half)} 0 ${f(W)} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">` +
    `<defs>${defs}</defs>${sky}${shoot}${SANTA}${far}${village}${snow}${tree}${bulbs}${star}${burst}</svg>`
  );
}

// ---------------------------------------------------------------- Santa

/** One flying reindeer facing right, about 20 units long; `nose` = Rudolph. */
function reindeer(x: number, y: number, nose = false): string {
  let s = `<g transform="translate(${x} ${y})">`;
  s += `<path d="M-4,1.5L-9.5,3.5M-5,1.5L-10,0.5M4,2L8.5,4.5M3,2.2L7,6" stroke="#7a4e30" stroke-width="1.2" stroke-linecap="round"/>`;
  s += `<path d="M9.4,-8.6l-1.2,-3.2m1.2,3.2l2.2,-2.8m-2.6,-0.6l-1.6,-1.2M10.2,-8.4l1.6,-1.8" stroke="#e9d3a4" stroke-width=".8" stroke-linecap="round" fill="none"/>`;
  s += `<ellipse rx="7" ry="3.3" fill="#a86f45"/><path d="M4.5,-1.5L8.6,-6.4L10.6,-5.2L7,0Z" fill="#a86f45"/>`;
  s += `<ellipse cx="10.6" cy="-6.6" rx="2.8" ry="1.7" fill="#a86f45"/><path d="M-7,-1.2l-2,-1.4" stroke="#f3e6c8" stroke-width="1.3" stroke-linecap="round"/>`;
  s += `<circle cx="9.9" cy="-7.2" r=".45" fill="#1a1020"/>`;
  if (nose) s += `<circle cx="13.3" cy="-6.4" r="3.2" fill="#ff4d4d" opacity=".35"/><circle cx="13.3" cy="-6.4" r="1.25" fill="#ff4d4d"/>`;
  return s + `</g>`;
}

/** Santa's sleigh and four reindeer, facing right, drawn once and flown by CSS. */
const SANTA = (() => {
  let s = `<g class="scn-santa"><g class="scn-santa-bob"><g transform="scale(.8)">`;
  // a little trail of sparkles behind the sleigh
  for (let i = 0; i < 6; i++)
    s += `<circle class="scn-trail" style="--d:${(-i * 0.25).toFixed(2)}s" cx="${-24 - i * 7}" cy="${2 + (i % 2) * 3}" r="${(1.3 - i * 0.15).toFixed(2)}" fill="#fff3cf"/>`;
  // reins
  s += `<path d="M-4,-10Q20,-4 58,-6" stroke="#ffd166" stroke-width=".5" fill="none" opacity=".8"/>`;
  s += reindeer(18, -1) + reindeer(36, -3) + reindeer(52, 0) + reindeer(68, -2, true);
  // sack, Santa, sleigh
  s += `<circle cx="-14" cy="-9" r="4.6" fill="#7a4a2a"/><path d="M-15.5,-13.2l1.5,-2 1.4,2" stroke="#c99a5a" stroke-width=".8" fill="none"/>`;
  s += `<circle cx="-7.5" cy="-9.5" r="4.6" fill="#d62839"/><path d="M-11.6,-8.6h8.2" stroke="#1a1020" stroke-width="1.2"/>`;
  s += `<circle cx="-6.8" cy="-15.6" r="2.6" fill="#f2c9a0"/><ellipse cx="-5.9" cy="-13.7" rx="2.6" ry="2.1" fill="#fff"/>`;
  s += `<path d="M-9.6,-16.8Q-7.4,-21.6 -2.6,-19.8L-4.6,-17.2Z" fill="#d62839"/><circle cx="-2.6" cy="-19.8" r="1.1" fill="#fff"/><path d="M-9.8,-16.9h5.6" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`;
  s += `<path d="M-17,3L-18,-6Q-18,-8.5 -15,-8.5L-2,-8.5L-1.5,-3.5L6,-3.5Q10.5,-3.5 11.5,-8Q13.5,-9.5 14,-6.5Q13,3 4,3Z" fill="#c4122f" stroke="#ffd166" stroke-width=".7" stroke-linejoin="round"/>`;
  s += `<path d="M-15,7H10Q16,7 15.5,2M-11,7V3M5,7V3" stroke="#ffd166" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
  return s + `</g></g></g>`;
})();

// ---------------------------------------------------------------- mounting

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export function mountScene(host: HTMLElement): void {
  if (!host || host.dataset.scn) return;
  host.dataset.scn = "1";
  host.classList.add("scn-host");

  const reduce = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  const calm = () => !!reduce?.matches;

  const root = document.createElement("div");
  root.className = "scn";
  root.setAttribute("role", "img");
  root.innerHTML =
    `<div class="scn-art"></div>` +
    `<div class="scn-cap scn-cap-l"><i class="scn-pip"></i><span class="scn-count"></span></div>` +
    `<div class="scn-cap scn-cap-r" hidden><i class="scn-live"></i><span class="scn-block"></span></div>` +
    `<div class="scn-cap scn-fresh"><span class="scn-news"></span></div>`;
  host.replaceChildren(root);

  const art = root.querySelector<HTMLElement>(".scn-art")!;
  const countEl = root.querySelector<HTMLElement>(".scn-count")!;
  const quiet = root.querySelector<HTMLElement>(".scn-cap-r")!;
  const blockEl = root.querySelector<HTMLElement>(".scn-block")!;
  const fresh = root.querySelector<HTMLElement>(".scn-fresh")!;
  const newsEl = root.querySelector<HTMLElement>(".scn-news")!;

  // ---- state
  const lit = new Set<number>();
  const readOpened = () => {
    try {
      for (const k of Object.keys(getOpened() ?? {})) {
        const d = Number(k);
        if (Number.isInteger(d) && d >= 1 && d <= TOTAL) lit.add(d);
      }
    } catch {
      /* no saved progress: an unlit tree is fine */
    }
  };
  readOpened();

  let onScreen = true;
  const live = () => !document.hidden && onScreen && !calm();

  /** Push the lit set into the current SVG and the captions. */
  function paint() {
    for (const el of Array.from(art.querySelectorAll<SVGGElement>(".scn-bulb, .scn-win")))
      el.classList.toggle("lit", lit.has(Number(el.dataset.n)));
    art.querySelector(".scn-star")?.classList.toggle("lit", lit.has(TOTAL));
    const aura = art.querySelector<SVGElement>(".scn-aura");
    if (aura) aura.style.opacity = String(Math.round((lit.size / TOTAL) * 100) / 100);
    root.classList.toggle("all", lit.size === TOTAL);
    countEl.textContent = `${lit.size} of ${TOTAL} lit`;
    root.setAttribute(
      "aria-label",
      `A snowy village at night with a Christmas tree. ${lit.size} of ${TOTAL} lights are lit` +
        (lit.size === TOTAL ? ", and the star on top is shining." : lit.size ? ": one for each door you have opened." : ". Open a door to light the first one."),
    );
  }

  // ---- layout: W follows the strip's aspect ratio
  let W = 0;
  function layout() {
    const cw = root.clientWidth;
    const ch = root.clientHeight;
    const phone = typeof matchMedia === "function" && matchMedia("(max-width: 520px)").matches;
    const want = cw > 0 && ch > 0 ? (cw / ch) * H : phone ? 540 : 1070;
    const next = Math.max(440, Math.min(1600, Math.round(want / 10) * 10));
    if (next === W) return;
    W = next;
    art.innerHTML = sceneSvg(W);
    paint();
  }
  layout();
  if (typeof ResizeObserver === "function") {
    let raf = 0;
    new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(layout);
    }).observe(root);
  } else addEventListener("resize", layout);

  // ---- nothing animates while the tab is hidden or the strip is scrolled away
  const pause = () => root.classList.toggle("paused", document.hidden || !onScreen);
  document.addEventListener("visibilitychange", pause);
  if (typeof IntersectionObserver === "function")
    new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      pause();
    }).observe(root);
  pause();

  /** Restart a one-shot CSS animation by re-adding its class; the class is removed again after `ms`. */
  const timers = new Map<Element, number>();
  function flash(el: Element | null, cls: string, ms: number) {
    if (!el) return;
    el.classList.remove(cls);
    void el.getBoundingClientRect();
    el.classList.add(cls);
    clearTimeout(timers.get(el));
    timers.set(el, window.setTimeout(() => el.classList.remove(cls), ms));
  }

  function twinkle() {
    if (live() && lit.size) flash(root, "twk", 1700);
  }

  function shootingStar() {
    const g = art.querySelector<SVGGElement>(".scn-shoot");
    if (!g || !live()) return;
    const x0 = -W * 0.44 + Math.random() * W * 0.42;
    const y0 = 10 + Math.random() * 34;
    const dx = W * (0.3 + Math.random() * 0.14);
    const dy = 34 + Math.random() * 36;
    g.style.setProperty("--x0", `${f(x0)}px`);
    g.style.setProperty("--y0", `${f(y0)}px`);
    g.style.setProperty("--x1", `${f(x0 + dx)}px`);
    g.style.setProperty("--y1", `${f(y0 + dy)}px`);
    g.querySelector(".scn-shoot-r")?.setAttribute("transform", `rotate(${f((Math.atan2(dy, dx) * 180) / Math.PI)})`);
    flash(g, "go", 1500);
  }

  /** Santa crosses the sky now and then, left to right, at a random height. */
  function santa() {
    const g = art.querySelector<SVGGElement>(".scn-santa");
    if (g && live()) {
      const y0 = 26 + Math.random() * 40;
      g.style.setProperty("--sx0", `${f(-W / 2 - 80)}px`);
      g.style.setProperty("--sx1", `${f(W / 2 + 30)}px`);
      g.style.setProperty("--sy0", `${f(y0)}px`);
      g.style.setProperty("--sy1", `${f(y0 - 10 - Math.random() * 16)}px`);
      const secs = Math.max(9, Math.min(18, W / 75));
      g.style.setProperty("--dur", `${secs}s`);
      flash(g, "go", secs * 1000 + 200);
    }
    window.setTimeout(santa, 45_000 + Math.random() * 35_000);
  }
  window.setTimeout(santa, 5_000);

  let newsTimer = 0;
  function news(text: string) {
    newsEl.textContent = text;
    fresh.classList.add("show");
    clearTimeout(newsTimer);
    newsTimer = window.setTimeout(() => fresh.classList.remove("show"), 4600);
  }

  // ---- doors
  window.addEventListener("door-opened", (e) => {
    const day = Number((e as CustomEvent<{ day?: number }>).detail?.day);
    if (!Number.isInteger(day) || day < 1 || day > TOTAL) return;
    lit.add(day);
    readOpened(); // picks up anything opened in another tab
    paint();
    if (!live()) return;
    flash(art.querySelector(`.scn-bulb[data-n="${day}"]`), "pop", 800);
    if (day === TOTAL) flash(art.querySelector(".scn-star"), "pop", 800);
  });

  // ---- the user's own transaction made it into a block
  window.addEventListener("tx-confirmed", (e) => {
    const h = Number((e as CustomEvent<{ blockHeight?: number }>).detail?.blockHeight);
    news(Number.isFinite(h) && h > 0 ? `You're in block ${fmt(h)}` : "Your transaction is in a block");
    if (!live()) return;
    flash(art.querySelector(".scn-burst"), "go", 1600);
    twinkle();
  });

  // ---- real blocks
  let seen = false;
  let lastHeight = 0;
  const onTip = (tip: Tip) => {
    const h = Number(tip?.block_height);
    if (!Number.isFinite(h) || h <= 0) return;
    if (seen && h === lastHeight) return;
    // The first tip we hear about is "where the chain is", not news. A backwards or huge
    // jump means the network was switched, which is not news either.
    const isNew = seen && h > lastHeight && h - lastHeight < 500;
    seen = true;
    lastHeight = h;
    blockEl.textContent = `Block ${fmt(h)}`;
    quiet.hidden = false;
    if (!isNew || document.hidden) return;
    const txs = Number((tip as Tip & { tx_count?: number }).tx_count);
    news(`New block ${fmt(h)}` + (Number.isFinite(txs) && txs >= 0 ? ` · ${fmt(txs)} ${txs === 1 ? "tx" : "txs"}` : ""));
    shootingStar();
    twinkle();
  };
  try {
    onBlock(onTip);
  } catch (err) {
    console.warn("scene: no block feed", err);
  }
}
