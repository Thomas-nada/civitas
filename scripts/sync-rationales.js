#!/usr/bin/env node
/**
 * sync-rationales.js
 *
 * Reads the live snapshot from the Render API, then for every vote that has a
 * rationale URL fetches the rationale text and writes it as a markdown file:
 *
 *   rationales/
 *     DRep/<Proposal Title>/<Voter Name>.md
 *     SPO/<Proposal Title>/<Voter Name>.md
 *     CC/<Proposal Title>/<Voter Name>.md
 *
 * Idempotent — existing files are only overwritten if the content has changed.
 * New files are always written. Run on a schedule via GitHub Actions.
 */

const fs   = require("fs");
const path = require("path");
const https = require("https");
const http  = require("http");

const BASE_URL      = process.env.CIVITAS_URL || "https://civitas-nglb.onrender.com";
const OUT_DIR       = path.resolve(__dirname, "..", "rationales");
const CONCURRENCY   = 8;
const IPFS_GATEWAY  = "https://ipfs.io/ipfs/";
const REQUEST_TIMEOUT_MS = 20_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function sanitizePath(name, maxLen = 80) {
  return String(name || "Unknown")
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen)
    .replace(/[. ]+$/, "")  // no trailing dots/spaces (Windows)
    || "Unknown";
}

function resolveIpfs(url) {
  if (!url) return url;
  if (url.startsWith("ipfs://")) return IPFS_GATEWAY + url.slice(7);
  return url;
}

function fetchUrl(rawUrl) {
  return new Promise((resolve, reject) => {
    const url = resolveIpfs(rawUrl);
    if (!url) return reject(new Error("Empty URL"));
    const mod  = url.startsWith("https://") ? https : http;
    const req  = mod.get(url, { timeout: REQUEST_TIMEOUT_MS }, (res) => {
      // Follow one redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        res.resume();
        return;
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end",  () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    });
    req.on("timeout", () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
    req.on("error", reject);
  });
}

function extractRationaleText(raw) {
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return raw.trim(); }

  // CIP-100 / CIP-136 standard fields
  const candidates = [
    parsed?.body?.comment,
    parsed?.body?.rationaleStatement,
    parsed?.body?.rationale,
    parsed?.rationaleStatement,
    parsed?.rationale,
    parsed?.comment,
    parsed?.body?.motivation,
    parsed?.body?.abstract,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }

  // Some use @value pattern
  for (const key of Object.keys(parsed?.body || {})) {
    const val = parsed.body[key];
    if (val && typeof val === "object" && typeof val["@value"] === "string" && val["@value"].trim()) {
      return val["@value"].trim();
    }
  }

  return "";
}

function buildMarkdown(voterName, voterId, proposalTitle, voteChoice, rationaleText) {
  const lines = [
    `# ${voterName}`,
    ``,
    `**Proposal:** ${proposalTitle}`,
    `**Vote:** ${voteChoice || "—"}`,
    `**Voter ID:** \`${voterId}\``,
    ``,
    `---`,
    ``,
    rationaleText || "_No rationale text available._",
  ];
  return lines.join("\n") + "\n";
}

async function mapLimit(items, limit, fn) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeIfChanged(filePath, content) {
  ensureDir(path.dirname(filePath));
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, "utf8");
    if (existing === content) return false; // unchanged
  }
  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

// ── Fetch snapshot from server ────────────────────────────────────────────────

async function fetchSnapshot() {
  console.log(`Fetching snapshot from ${BASE_URL}/api/export-snapshot …`);
  const raw = await fetchUrl(`${BASE_URL}/api/export-snapshot`);
  return JSON.parse(raw);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const snap = await fetchSnapshot();

  const proposalInfo = snap.proposalInfo || {};

  // Build proposalId -> title map
  const titleOf = (pid) => {
    const name = proposalInfo[pid]?.actionName;
    return sanitizePath(name || pid);
  };

  // Collect all work items: { type, voterName, voterId, proposalId, voteChoice, rationaleUrl }
  const items = [];

  function voterName(actor, type) {
    if (type === "SPO") return sanitizePath(actor.name || actor.ticker || actor.id);
    return sanitizePath(actor.profile?.name || actor.name || actor.id);
  }

  for (const actor of (snap.dreps || [])) {
    for (const vote of (actor.votes || [])) {
      if (!vote.hasRationale || !vote.rationaleUrl) continue;
      items.push({ type: "DRep", voterName: voterName(actor, "DRep"), voterId: actor.id, proposalId: vote.proposalId, voteChoice: vote.vote, rationaleUrl: vote.rationaleUrl });
    }
  }
  for (const actor of (snap.spos || [])) {
    for (const vote of (actor.votes || [])) {
      if (!vote.hasRationale || !vote.rationaleUrl) continue;
      items.push({ type: "SPO", voterName: voterName(actor, "SPO"), voterId: actor.id, proposalId: vote.proposalId, voteChoice: vote.vote, rationaleUrl: vote.rationaleUrl });
    }
  }
  for (const actor of (snap.committeeMembers || [])) {
    for (const vote of (actor.votes || [])) {
      if (!vote.hasRationale || !vote.rationaleUrl) continue;
      items.push({ type: "CC", voterName: voterName(actor, "CC"), voterId: actor.id, proposalId: vote.proposalId, voteChoice: vote.vote, rationaleUrl: vote.rationaleUrl });
    }
  }

  console.log(`Found ${items.length} votes with rationale URLs (DRep/SPO/CC).`);

  let written = 0, skipped = 0, failed = 0;

  await mapLimit(items, CONCURRENCY, async (item) => {
    const proposalFolder = titleOf(item.proposalId);
    const fileName       = `${sanitizePath(item.voterName, 60)}.md`;
    const filePath       = path.join(OUT_DIR, item.type, proposalFolder, fileName);

    // Skip fetch if file already exists — re-fetch only if rationaleUrl changes
    // (tracked via a comment in the file header on write)
    if (fs.existsSync(filePath)) {
      const existing = fs.readFileSync(filePath, "utf8");
      if (existing.includes(`<!-- url: ${item.rationaleUrl} -->`)) {
        skipped++;
        return;
      }
    }

    let rationaleText = "";
    try {
      const raw = await fetchUrl(item.rationaleUrl);
      rationaleText = extractRationaleText(raw);
    } catch (e) {
      failed++;
      console.warn(`  FAIL [${item.type}] ${item.voterName} / ${proposalFolder}: ${e.message}`);
      return;
    }

    const content = [
      `<!-- url: ${item.rationaleUrl} -->`,
      buildMarkdown(item.voterName, item.voterId, proposalFolder, item.voteChoice, rationaleText),
    ].join("\n");

    const changed = writeIfChanged(filePath, content);
    if (changed) {
      written++;
      if (written <= 20 || written % 100 === 0) {
        console.log(`  [${written}] ${item.type} / ${proposalFolder} / ${fileName}`);
      }
    } else {
      skipped++;
    }
  });

  console.log(`\nDone. Written: ${written}  Skipped (unchanged): ${skipped}  Failed: ${failed}`);
  if (failed > 0) console.warn(`\n${failed} rationale URLs could not be fetched (dead links, IPFS timeouts, etc.) — this is expected and non-fatal.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
