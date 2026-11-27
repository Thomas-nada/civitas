// Cardano Advent calendar: which doors each wallet has opened, shared across its devices.
//
//   POST /advent/api/progress/session  { net, address, message, signature, key, opened?, onday? }
//        The wallet signed `message` (CIP-8 / CIP-30 signData, free, not a transaction) with the
//        key behind `address` (normally its stake address). We check the signature and answer
//        { token, opened, onday }: a token for this device and the wallet's doors so far.
//   POST /advent/api/progress          { opened?, onday? }   with  Authorization: Bearer <token>
//        Adds this device's doors and answers the wallet's full set { opened, onday }.
//
// Doors are two 24-bit masks in base 36 (bit day-1): opened, and opened on its own day.
//
// Storage: Render wipes the server's disk on every deploy and idle restart, so the record lives in
// one secret GitHub Gist (file cardano-advent-progress.json) when ADVENT_GIST_TOKEN is set (a
// token with the Gists read/write permission). ADVENT_GIST_ID picks the gist; without it we look
// for one holding that file, or create it on the first save. With no token we fall back to a local
// file, which is fine for development but does not survive a Render deploy.
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const FILE = "cardano-advent-progress.json";
const GIST_TOKEN = String(process.env.ADVENT_GIST_TOKEN || "").trim();
let gistId = String(process.env.ADVENT_GIST_ID || "").trim();
const LOCAL_PATH = process.env.ADVENT_PROGRESS_PATH || path.join(__dirname, "..", ".data", FILE);
const NETS = new Set(["mainnet", "preprod", "preview"]);
const TOKEN_DAYS = 120;
const MAX_WALLETS = 500_000;
const SAVE_DELAY_MS = 4000;
const ALL = 2 ** 24 - 1;

// Device tokens are signed with this. A fixed secret keeps tokens valid across restarts.
const SECRET = (() => {
  const s = process.env.ADVENT_SESSION_SECRET || (GIST_TOKEN ? `gist:${GIST_TOKEN}` : "");
  return s ? crypto.createHash("sha256").update(`advent-session|${s}`).digest() : crypto.randomBytes(32);
})();

// ---------------------------------------------------------------- the record
/** "net:addressHex" → [openedMask, ondayMask] */
const wallets = new Map();
let loaded = false;
let loading = null;
let dirty = false;
let saving = false;
let timer = null;

const gh = (url, init = {}) =>
  fetch(url, {
    ...init,
    headers: {
      authorization: `Bearer ${GIST_TOKEN}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "civitas-advent",
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
    signal: AbortSignal.timeout(20_000),
  });

async function ghJson(url, init) {
  const r = await gh(url, init);
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

/** Find the gist holding FILE among the token owner's gists. */
async function findGist() {
  for (let page = 1; page <= 10; page++) {
    const list = await ghJson(`https://api.github.com/gists?per_page=100&page=${page}`);
    const hit = list.find((g) => g?.files && g.files[FILE]);
    if (hit) return hit.id;
    if (list.length < 100) break;
  }
  return "";
}

async function readStore() {
  if (!GIST_TOKEN) {
    try {
      return JSON.parse(fs.readFileSync(LOCAL_PATH, "utf8"));
    } catch (e) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
  }
  if (!gistId) gistId = await findGist();
  if (!gistId) return null; // created on the first save
  const g = await ghJson(`https://api.github.com/gists/${gistId}`);
  const f = g.files?.[FILE];
  if (!f) return null;
  if (!f.truncated) return JSON.parse(f.content || "null");
  const r = await gh(f.raw_url);
  if (!r.ok) throw new Error(`GitHub raw ${r.status}`);
  return JSON.parse(await r.text());
}

async function writeStore(content) {
  if (!GIST_TOKEN) {
    fs.mkdirSync(path.dirname(LOCAL_PATH), { recursive: true });
    fs.writeFileSync(`${LOCAL_PATH}.tmp`, content);
    fs.renameSync(`${LOCAL_PATH}.tmp`, LOCAL_PATH);
    return;
  }
  const files = { [FILE]: { content } };
  if (gistId) {
    await ghJson(`https://api.github.com/gists/${gistId}`, { method: "PATCH", body: JSON.stringify({ files }) });
    return;
  }
  const g = await ghJson("https://api.github.com/gists", {
    method: "POST",
    body: JSON.stringify({ description: "Cardano Advent: opened doors per wallet (written by the Civitas server)", public: false, files }),
  });
  gistId = g.id;
  console.log(`[advent] created the progress gist ${gistId}. Set ADVENT_GIST_ID=${gistId} to pin it.`);
}

/** Load once. If it fails nothing is served or saved (so an empty record never overwrites a full one). */
function ensureLoaded() {
  if (loaded) return Promise.resolve();
  loading ??= readStore()
    .then((doc) => {
      for (const [k, v] of Object.entries(doc?.wallets || {}))
        if (Array.isArray(v)) wallets.set(k, [v[0] & ALL, v[1] & v[0] & ALL]);
      loaded = true;
      console.log(`[advent] progress loaded: ${wallets.size} wallets (${GIST_TOKEN ? `gist ${gistId || "not created yet"}` : LOCAL_PATH})`);
    })
    .finally(() => (loading = null));
  return loading;
}

function scheduleSave(delay = SAVE_DELAY_MS) {
  dirty = true;
  if (!timer) timer = setTimeout(flush, delay);
}

async function flush() {
  timer = null;
  if (!dirty || !loaded) return;
  if (saving) return scheduleSave();
  saving = true;
  dirty = false;
  try {
    await writeStore(JSON.stringify({ v: 1, updated: new Date().toISOString(), wallets: Object.fromEntries(wallets) }));
  } catch (e) {
    console.warn("[advent] saving progress failed; retrying:", e?.message || e);
    scheduleSave(30_000);
  } finally {
    saving = false;
  }
}

// Render stops the old instance with SIGTERM on every deploy: save what's pending first.
let stopping = false;
for (const sig of ["SIGTERM", "SIGINT"])
  process.on(sig, () => {
    if (stopping) return;
    stopping = true;
    const done = () => process.exit(0);
    if (!dirty || !loaded) return done();
    clearTimeout(timer);
    flush().finally(done);
    setTimeout(done, 8000).unref();
  });

// ---------------------------------------------------------------- helpers
const MASK_RX = /^[0-9a-z]{1,5}$/;
const parseMask = (v) => (typeof v === "string" && MASK_RX.test(v) ? parseInt(v, 36) & ALL : 0);
const b36 = (n) => (n >>> 0).toString(36);
const b64u = (buf) => Buffer.from(buf).toString("base64url");

const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
function bech32Bytes(str) {
  const s = String(str).toLowerCase();
  const pos = s.lastIndexOf("1");
  if (pos < 1 || s.length > 200 || str !== s) return null;
  const hrp = s.slice(0, pos);
  const data = [];
  for (const c of s.slice(pos + 1)) {
    const v = CHARSET.indexOf(c);
    if (v < 0) return null;
    data.push(v);
  }
  // checksum
  const G = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of [...[...hrp].map((c) => c.charCodeAt(0) >> 5), 0, ...[...hrp].map((c) => c.charCodeAt(0) & 31), ...data]) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((top >> i) & 1) chk ^= G[i];
  }
  if (chk !== 1 || data.length < 6) return null;
  let acc = 0, bits = 0;
  const out = [];
  for (const v of data.slice(0, -6)) {
    acc = (acc << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((acc >> bits) & 255);
    }
  }
  return { hrp, bytes: Buffer.from(out) };
}

const tokenFor = (key) => {
  const body = b64u(JSON.stringify({ k: key, e: Date.now() + TOKEN_DAYS * 86_400_000 }));
  return `${body}.${b64u(crypto.createHmac("sha256", SECRET).update(body).digest())}`;
};

function keyFromToken(header) {
  const m = /^Bearer ([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(String(header || ""));
  if (!m) return null;
  const want = crypto.createHmac("sha256", SECRET).update(m[1]).digest();
  const got = Buffer.from(m[2], "base64url");
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  try {
    const { k, e } = JSON.parse(Buffer.from(m[1], "base64url").toString("utf8"));
    return typeof k === "string" && Number(e) > Date.now() ? k : null;
  } catch {
    return null;
  }
}

let cose = null;
const loadCose = () => (cose ??= import("@evolution-sdk/evolution/cose").then((m) => m.SignData));

/** Check the signed message. Returns the wallet's storage key, or throws with a reason for the user. */
async function verify(body, host) {
  const { net, address, message, signature, key } = body;
  const no = (why) => Object.assign(new Error(why), { status: 400 });
  if (!NETS.has(net)) throw no("Unknown network.");
  if (typeof message !== "string" || message.length > 1200) throw no("Missing message.");
  if (typeof signature !== "string" || !/^[0-9a-f]{20,4000}$/i.test(signature)) throw no("Missing signature.");
  if (typeof key !== "string" || !/^[0-9a-f]{20,400}$/i.test(key)) throw no("Missing key.");
  const line = (name) => (message.match(new RegExp(`^${name}: (.+)$`, "m")) || [])[1]?.trim();
  if (!message.startsWith("Cardano Advent ")) throw no("That isn't a Cardano Advent message.");
  if (line("Wallet") !== address || line("Network") !== net) throw no("The message doesn't match this wallet.");
  if (line("Site") !== String(host || "").toLowerCase()) throw no("The message was signed for another site.");
  const t = Date.parse(line("Time") || "");
  if (!(Math.abs(Date.now() - t) < 15 * 60_000)) throw no("The message is too old (or this device's clock is off). Please sign again.");

  const dec = bech32Bytes(address);
  if (!dec || !/^(stake|stake_test|addr|addr_test)$/.test(dec.hrp) || dec.bytes.length < 29) throw no("That address doesn't look right.");
  const header = dec.bytes[0];
  const type = header >> 4;
  // reward (key), enterprise (key), base with a payment key
  if (![0xe, 0x6, 0x0, 0x2].includes(type)) throw no("This kind of address can't sign messages.");
  if ((net === "mainnet") !== ((header & 15) === 1)) throw no("The address is for another network.");
  const addrHex = dec.bytes.toString("hex");
  const keyHash = dec.bytes.subarray(1, 29).toString("hex");
  const SignData = await loadCose();
  let ok = false;
  try {
    ok = SignData.verifyData(addrHex, keyHash, new Uint8Array(Buffer.from(message, "utf8")), {
      signature: new Uint8Array(Buffer.from(signature, "hex")),
      key: new Uint8Array(Buffer.from(key, "hex")),
    });
  } catch {
    ok = false;
  }
  if (!ok) throw Object.assign(new Error("That signature doesn't check out for this wallet."), { status: 401 });
  return `${net}:${addrHex}`;
}

/** Fold a device's doors into the wallet's record; returns the full record. */
function merge(key, body) {
  const o = parseMask(body?.opened);
  const d = parseMask(body?.onday) & o;
  const had = wallets.get(key);
  if (!had && wallets.size >= MAX_WALLETS) return [o, d];
  const next = [(had?.[0] ?? 0) | o, (had?.[1] ?? 0) | d];
  if (!had || next[0] !== had[0] || next[1] !== had[1]) {
    wallets.set(key, next);
    scheduleSave();
  }
  return next;
}

// A light limit on signature checks per address (they cost a little CPU).
const tries = new Map();
function allow(ip) {
  const now = Date.now();
  const t = (tries.get(ip) || []).filter((x) => now - x < 10 * 60_000);
  if (t.length >= 30) return false;
  t.push(now);
  tries.set(ip, t);
  if (tries.size > 5000) for (const [k, v] of tries) if (!v.some((x) => now - x < 10 * 60_000)) tries.delete(k);
  return true;
}

function send(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

/** True when the request was for the progress API (and has been answered). */
function handleAdventProgress(req, res, url, { readJsonBody, getClientIp }) {
  const p = url.pathname;
  if (p !== "/advent/api/progress" && p !== "/advent/api/progress/session") return false;
  if (req.method !== "POST") {
    res.writeHead(405, { Allow: "POST" });
    res.end();
    return true;
  }
  (async () => {
    try {
      const body = await readJsonBody(req, 16 * 1024);
      let key;
      let token;
      if (p.endsWith("/session")) {
        if (!allow(getClientIp(req))) return send(res, 429, { error: "Too many tries. Please wait a few minutes." });
        key = await verify(body, req.headers.host);
        token = tokenFor(key);
      } else {
        key = keyFromToken(req.headers.authorization);
        if (!key) return send(res, 401, { error: "Please sign in with your wallet again." });
      }
      await ensureLoaded();
      const [o, d] = merge(key, body);
      send(res, 200, { ...(token ? { token } : {}), opened: b36(o), onday: b36(d) });
    } catch (e) {
      const status = e?.status || (/Payload|JSON/.test(String(e?.message)) ? 400 : 503);
      if (status === 503) console.warn("[advent] progress:", e?.message || e);
      send(res, status, { error: status === 503 ? "Saving opened doors isn't working right now. Please try again later." : e.message });
    }
  })();
  return true;
}

// Start loading at boot, so the first visitor doesn't wait for GitHub.
ensureLoaded().catch((e) => console.warn("[advent] progress not loaded yet:", e?.message || e));

module.exports = { handleAdventProgress, _test: { bech32Bytes, tokenFor, keyFromToken, verify, flush } };
