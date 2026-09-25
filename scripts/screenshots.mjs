// Screenshots of every page in dark and light themes at desktop and phone
// widths, against a server hydrated from the committed seed.
//
//   node scripts/screenshots.mjs [outDir] [--routes=/actions,/dreps] [--only=desktop|mobile] [--theme=dark|light]
//
// Needs a built frontend (npm run build) and the Playwright browser.

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const outDir = args.find((a) => !a.startsWith("--")) || "docs/screens";
const opt = (name, def) => (args.find((a) => a.startsWith(`--${name}=`)) || "").split("=")[1] || def;
const port = Number(opt("port", 18090));
const base = `http://127.0.0.1:${port}`;

const ROUTES = (opt("routes", "") || [
  "/actions", "/dreps", "/spos", "/committee", "/stats", "/treasury", "/treasury/explorer",
  "/epochs", "/surveys", "/governance/rationales", "/constitution", "/cips", "/guide", "/about", "/intersect"
].join(",")).split(",").filter(Boolean);
const VIEWPORTS = { desktop: { width: 1360, height: 900 }, mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };
const only = opt("only", "");
const themeOnly = opt("theme", "");

fs.mkdirSync(outDir, { recursive: true });

const server = spawn(process.execPath, ["server.js"], {
  env: { ...process.env, HOST: "127.0.0.1", PORT: String(port), AUTO_START_SCHEDULER: "false", SKIP_BOOT_HYDRATION: "false", BLOCKFROST_API_KEY: "" },
  stdio: ["ignore", "pipe", "pipe"]
});
let serverLog = "";
server.stdout.on("data", (c) => { serverLog += c; });
server.stderr.on("data", (c) => { serverLog += c; });

async function waitFor(url, ms = 60000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try { const r = await fetch(url); if (r.ok) return; } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`server not ready: ${serverLog.slice(-800)}`);
}

// A proposal and a DRep for the detail pages.
async function pickDetailRoutes() {
  try {
    const actions = await (await fetch(`${base}/api/v1/actions`)).json();
    const active = actions.actions.find((a) => a.status === "Active") || actions.actions[0];
    const dreps = await (await fetch(`${base}/api/v1/actors/drep`)).json();
    const drep = dreps.actors.find((a) => a.name && a.voteCount > 20) || dreps.actors[0];
    return [`/actions/${encodeURIComponent(active.proposalId)}`, `/dreps/${encodeURIComponent(drep.id)}`];
  } catch { return []; }
}

try {
  await waitFor(`${base}/api/health`);
  const routes = [...ROUTES, ...(opt("routes", "") ? [] : await pickDetailRoutes())];
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined) });
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    if (only && only !== vpName) continue;
    for (const theme of ["dark", "light"]) {
      if (themeOnly && themeOnly !== theme) continue;
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor || 1, colorScheme: theme });
      await context.addInitScript((t) => { try { localStorage.setItem("civitas.theme", t); } catch { /* ignore */ } }, theme);
      const page = await context.newPage();
      // Only talk to the local server: third-party requests (IPFS gateways,
      // GitHub, fonts) are aborted so runs are fast and deterministic.
      await page.route("**/*", (route) => {
        const u = route.request().url();
        if (u.startsWith(base) || u.startsWith("data:")) route.continue();
        else route.abort();
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
      page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 200)}`); });
      for (const route of routes) {
        const name = route.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-").slice(0, 60) || "home";
        try {
          // SSE keeps a connection open, so "networkidle" never settles.
          await page.goto(`${base}${route}`, { waitUntil: "load", timeout: 30000 });
          await page.waitForTimeout(Number(opt("settle", 1800)));
          await page.screenshot({ path: path.join(outDir, `${name}--${vpName}--${theme}.png`), fullPage: args.includes("--full"), clip: args.includes("--full") ? undefined : { x: 0, y: 0, width: vp.width, height: Math.min(vp.height * (vpName === "mobile" ? 2.2 : 1.6), 3000) } });
          console.log(`ok  ${route} ${vpName} ${theme}`);
        } catch (e) {
          console.log(`ERR ${route} ${vpName} ${theme}: ${e.message.split("\n")[0]}`);
        }
      }
      if (errors.length) console.log(`  page errors (${vpName}/${theme}):\n   ` + [...new Set(errors)].slice(0, 12).join("\n   "));
      await context.close();
    }
  }
  await browser.close();
} finally {
  server.kill("SIGTERM");
}
