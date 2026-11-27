// Renders the social preview (public/og.png, 1200×630) and the iOS home-screen icon
// (public/apple-touch-icon.png, 180×180) from hand-written SVG.
//
//   npm run og
//
// resvg cannot read .woff2, so the text uses system fonts. Cambria is first because its
// numerals are lining ("2026", not old-style); the rest are fallbacks for macOS/Linux.
import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = (name) => resolve(root, "public", name);
const YEAR = 2026;

const SERIF = "Cambria, 'Times New Roman', 'Liberation Serif', 'DejaVu Serif', serif";
const SANS = "'Segoe UI', 'Helvetica Neue', Arial, 'Liberation Sans', 'DejaVu Sans', sans-serif";

// Small deterministic PRNG so the sky is the same on every run.
let seed = 2512;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const f = (n) => n.toFixed(1);

const stars = Array.from({ length: 90 }, () => {
  const x = rnd() * 1200, y = rnd() * 430, r = 0.6 + rnd() * 1.5, o = 0.25 + rnd() * 0.6;
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#fff" opacity="${o.toFixed(2)}"/>`;
}).join("");

const flakes = Array.from({ length: 70 }, () => {
  const x = rnd() * 1200, y = rnd() * 630, r = 2 + rnd() * 4, o = 0.35 + rnd() * 0.5;
  if (x < 900 && y > 50 && y < 490) return ""; // keep clear of the words and the door numbers
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#fff" opacity="${o.toFixed(2)}"/>`;
}).join("");

// ---- door tiles -------------------------------------------------------------------
const TILE = 104;
const papers = {
  berry: "#a8182b",
  blue: "#0a3bb8",
  pine: "#1c6b4c",
};
function tile(x, y, n, color, pattern) {
  const id = `t${n}`;
  let deco = "";
  if (pattern === "dots")
    for (let i = 0; i < 6; i++)
      for (let j = 0; j < 6; j++)
        deco += `<circle cx="${x + 9 + i * 18 + (j % 2 ? 9 : 0)}" cy="${y + 9 + j * 18}" r="3" fill="#fff" opacity=".2"/>`;
  if (pattern === "stripes")
    for (let i = -6; i < 8; i++)
      deco += `<path d="M${x + i * 22} ${y + TILE} l${TILE} ${-TILE}" stroke="#fff" stroke-width="8" opacity=".15"/>`;
  if (pattern === "stars")
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++)
        deco += `<path transform="translate(${x + 8 + i * 26 + (j % 2 ? 13 : 0)} ${y + 6 + j * 26})" d="M6 0l1.5 4 4.3.2-3.4 2.7 1.2 4.1L6 8.7 2.4 11l1.2-4.1L.2 4.2 4.5 4z" fill="#fff" opacity=".24"/>`;
  if (pattern === "ribbon")
    deco = `<rect x="${x + 16}" y="${y}" width="14" height="${TILE}" fill="#ffd166" opacity=".6"/><rect x="${x}" y="${y + 18}" width="${TILE}" height="14" fill="#ffd166" opacity=".6"/>`;
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="14"/></clipPath>
  <rect x="${x}" y="${y + 7}" width="${TILE}" height="${TILE}" rx="14" fill="#000" opacity=".35"/>
  <rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="14" fill="${papers[color]}"/>
  <g clip-path="url(#${id})">${deco}<rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" fill="url(#sheen)"/></g>
  <rect x="${x + 1}" y="${y + 1}" width="${TILE - 2}" height="${TILE - 2}" rx="13" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="2"/>
  <text x="${x + TILE / 2}" y="${y + 72}" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="60" fill="#000" opacity=".3">${n}</text>
  <text x="${x + TILE / 2}" y="${y + 69}" text-anchor="middle" font-family="${SERIF}" font-weight="700" font-size="60" fill="url(#foil)">${n}</text>`;
}
function litTile(x, y) {
  const c = TILE / 2;
  return `<rect x="${x - 26}" y="${y - 26}" width="${TILE + 52}" height="${TILE + 52}" rx="40" fill="url(#halo)"/>
  <rect x="${x}" y="${y}" width="${TILE}" height="${TILE}" rx="14" fill="url(#window)"/>
  <rect x="${x + 1.5}" y="${y + 1.5}" width="${TILE - 3}" height="${TILE - 3}" rx="12.5" fill="none" stroke="#ffd166" stroke-opacity=".85" stroke-width="3"/>
  <path transform="translate(${x + c} ${y + c}) scale(1.9)" d="M0-16l4.7 10.9 11.8 1-9 7.8 2.7 11.6L0 9.1l-10.2 6.2 2.7-11.6-9-7.8 11.8-1z" fill="#fffaf0" stroke="#ffd166" stroke-width="1.2" stroke-linejoin="round"/>`;
}
const TY = 372;
const tiles = [
  tile(72, TY, 1, "berry", "dots"),
  tile(194, TY, 2, "blue", "stripes"),
  litTile(316, TY),
  tile(438, TY, 4, "pine", "stars"),
  tile(560, TY, 5, "berry", "ribbon"),
].join("");

// ---- the tree ---------------------------------------------------------------------
const TX = 1000;
const layers = [
  [180, 308, 92, "#3aa372"],
  [245, 402, 136, "#2f8a5f"],
  [325, 506, 180, "#1f6b4a"],
];
const tree = layers
  .map(([top, bottom, half, fill]) =>
    `<path d="M${TX} ${top} L${TX + half} ${bottom} Q${TX} ${bottom + 26} ${TX - half} ${bottom}Z" fill="${fill}"/>
     <path d="M${TX} ${top} L${TX + half * 0.34} ${top + (bottom - top) * 0.34} Q${TX + half * 0.1} ${top + (bottom - top) * 0.3} ${TX} ${top + (bottom - top) * 0.42} Q${TX - half * 0.12} ${top + (bottom - top) * 0.28} ${TX - half * 0.34} ${top + (bottom - top) * 0.34}Z" fill="#fff" opacity=".9"/>`)
  .reverse()
  .join("");
const bulbs = ["#ffd166", "#ffe9a8", "#ff9d3c", "#ffd166", "#ff6b7d", "#ffe9a8"];
const lights = Array.from({ length: 26 }, (_, i) => {
  const t = (i + 0.5) / 26;
  const y = 246 + t * 250;
  const half = 26 + t * 138;
  const x = TX + Math.sin(t * 14.2 + 0.6) * half * 0.88;
  const c = bulbs[i % bulbs.length];
  return `<circle cx="${f(x)}" cy="${f(y)}" r="11" fill="${c}" opacity=".2"/><circle cx="${f(x)}" cy="${f(y)}" r="4.6" fill="${c}"/>`;
}).join("");
const topStar = `<circle cx="${TX}" cy="160" r="74" fill="url(#starglow)"/>
  <path transform="translate(${TX} 162) scale(2.4)" d="M0-16l4.7 10.9 11.8 1-9 7.8 2.7 11.6L0 9.1l-10.2 6.2 2.7-11.6-9-7.8 11.8-1z" fill="#ffd166" stroke="#fff3c4" stroke-width="1" stroke-linejoin="round"/>`;

// Official Cardano starburst (https://cardano.org/brand-assets/), white, 375 × 346.51 units.
const STARBURST = readFileSync(resolve(root, "src/assets/cardano-starburst-white.svg"), "utf8").match(/<path [^>]*\/>/g).join("");
/** The starburst centred on (cx, cy), `w` units wide, never stretched. */
const starburst = (cx, cy, w) => {
  const k = w / 375;
  return `<g transform="translate(${f(cx - w / 2)} ${f(cy - (346.51 * k) / 2)}) scale(${k.toFixed(5)})">${STARBURST}</g>`;
};
const cardanoMark = (cx, cy, r) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0033ad" stroke="#fff" stroke-opacity=".25" stroke-width="3"/>
   ${starburst(cx, cy, r * 1.52)}`;

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070d2b"/><stop offset=".55" stop-color="#0c1747"/><stop offset="1" stop-color="#1b2f8f"/></linearGradient>
  <radialGradient id="glow" cx="${TX}" cy="350" r="430" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffb24d" stop-opacity=".42"/><stop offset=".5" stop-color="#3468ff" stop-opacity=".16"/><stop offset="1" stop-color="#3468ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="starglow"><stop offset="0" stop-color="#fff3c4" stop-opacity=".9"/><stop offset=".35" stop-color="#ffd166" stop-opacity=".4"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient>
  <radialGradient id="halo"><stop offset=".45" stop-color="#ff9d3c" stop-opacity=".55"/><stop offset="1" stop-color="#ff9d3c" stop-opacity="0"/></radialGradient>
  <radialGradient id="window" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#e58a22"/><stop offset=".55" stop-color="#b85a14"/><stop offset="1" stop-color="#5a2608"/></radialGradient>
  <linearGradient id="foil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset="1" stop-color="#e9a800"/></linearGradient>
  <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c5d6ff"/></linearGradient>
</defs>
<rect width="1200" height="630" fill="url(#sky)"/>
${stars}
<rect width="1200" height="630" fill="url(#glow)"/>
<path d="M0 528 C 180 470 420 500 640 520 S 1010 470 1200 500 V630 H0Z" fill="#8fa6ea" opacity=".55"/>
<rect x="${TX - 17}" y="500" width="34" height="50" rx="4" fill="#5b3a22"/>
${tree}
${lights}
${topStar}
<path d="M0 560 C 240 505 470 545 700 536 S 1040 512 1200 530 V630 H0Z" fill="url(#hill)"/>
${cardanoMark(104, 92, 32)}
<text x="154" y="101" font-family="${SANS}" font-weight="700" font-size="24" letter-spacing="3.5" fill="#ffd166">24 DOORS  ·  DECEMBER 1 TO 24</text>
<text x="70" y="226" font-family="${SERIF}" font-weight="700" font-size="82" fill="#fffaf0">Cardano Advent <tspan fill="url(#foil)">${YEAR}</tspan></text>
<text font-family="${SANS}" font-size="31" fill="#d5ddff"><tspan x="72" y="286">One door a day until Christmas.</tspan><tspan x="72" y="328">Each opens onto the live Cardano blockchain.</tspan></text>
${tiles}
${flakes}
</svg>`;

const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 64 64">
<rect width="64" height="64" fill="#0033ad"/>
${starburst(32, 32, 38)}
</svg>`;

function render(svg, width, file) {
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { loadSystemFonts: true, defaultFontFamily: "Arial" },
  })
    .render()
    .asPng();
  writeFileSync(out(file), png);
  console.log(`${file}  ${width}px wide  ${(png.length / 1024).toFixed(0)} KB`);
}

mkdirSync(out(""), { recursive: true });
render(og, 1200, "og.png");
render(icon, 180, "apple-touch-icon.png");
