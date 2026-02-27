const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

function loadDotEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv();

function parseUtcHourList(input, fallback) {
  const raw = String(input || "")
    .split(",")
    .map((x) => Number(String(x).trim()))
    .filter((x) => Number.isInteger(x) && x >= 0 && x <= 23);
  const unique = Array.from(new Set(raw)).sort((a, b) => a - b);
  return unique.length > 0 ? unique : fallback;
}

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 8080);
const BLOCKFROST_BASE_URL = process.env.BLOCKFROST_BASE_URL || "https://cardano-mainnet.blockfrost.io/api/v0";
const BLOCKFROST_API_KEY = process.env.BLOCKFROST_API_KEY || "";
const BLOCKFROST_MAX_RETRIES = Number(process.env.BLOCKFROST_MAX_RETRIES || 3);
const BLOCKFROST_REQUEST_TIMEOUT_MS = Number(process.env.BLOCKFROST_REQUEST_TIMEOUT_MS || 10000);
const BLOCKFROST_REQUEST_DELAY_MS = Number(process.env.BLOCKFROST_REQUEST_DELAY_MS || 180);
const KOIOS_BASE_URL = process.env.KOIOS_BASE_URL || "https://api.koios.rest/api/v1";
const KOIOS_API_KEY = process.env.KOIOS_API_KEY || "";
const KOIOS_MAX_RETRIES = Number(process.env.KOIOS_MAX_RETRIES || 4);
const KOIOS_REQUEST_TIMEOUT_MS = Number(process.env.KOIOS_REQUEST_TIMEOUT_MS || 15000);
const KOIOS_REQUEST_DELAY_MS = Number(process.env.KOIOS_REQUEST_DELAY_MS || 120);
const CGOV_PROPOSAL_API_BASE = process.env.CGOV_PROPOSAL_API_BASE || "https://app.cgov.io/api/proposal";
const SPO_RATIONALE_USE_CGOV_FALLBACK = String(process.env.SPO_RATIONALE_USE_CGOV_FALLBACK || "true").toLowerCase() !== "false";
const CC_RATIONALE_USE_CGOV_FALLBACK = String(process.env.CC_RATIONALE_USE_CGOV_FALLBACK || "true").toLowerCase() !== "false";
const DREP_RATIONALE_USE_CGOV_FALLBACK = String(process.env.DREP_RATIONALE_USE_CGOV_FALLBACK || "true").toLowerCase() !== "false";
const DREP_PARTICIPATION_START_EPOCH = Number(process.env.DREP_PARTICIPATION_START_EPOCH || 534);

const PROPOSAL_PAGE_SIZE = Number(process.env.PROPOSAL_PAGE_SIZE || 100);
const PROPOSAL_MAX_PAGES = Number(process.env.PROPOSAL_MAX_PAGES || 1000);
const PROPOSAL_VOTES_PAGE_SIZE = Number(process.env.PROPOSAL_VOTES_PAGE_SIZE || 100);
const PROPOSAL_VOTES_MAX_PAGES = Number(process.env.PROPOSAL_VOTES_MAX_PAGES || 200);
const PROPOSAL_SCAN_LIMIT = Number(process.env.PROPOSAL_SCAN_LIMIT || 0);
const DREP_LIMIT = Number(process.env.DREP_LIMIT || 0);
const SPO_FALLBACK_LIMIT = Number(process.env.SPO_FALLBACK_LIMIT || 0);
const SYNC_BATCH_SIZE = Number(process.env.SYNC_BATCH_SIZE || 5);
const SYNC_CONCURRENCY = Number(process.env.SYNC_CONCURRENCY || 1);
const SYNC_INTERVAL_MS = Number(process.env.SYNC_INTERVAL_MS || 3 * 60 * 60 * 1000);
const SYNC_STARTUP_DELAY_MS = Number(process.env.SYNC_STARTUP_DELAY_MS || 3000);
const SYNC_START_UTC_HOURS = parseUtcHourList(process.env.SYNC_START_UTC_HOURS, [11, 23]);
const SNAPSHOT_EXPOSE_UTC_HOURS = parseUtcHourList(process.env.SNAPSHOT_EXPOSE_UTC_HOURS, [0, 12]);
const SNAPSHOT_PATH = process.env.SNAPSHOT_PATH || path.join(__dirname, "snapshot.accountability.json");
const SNAPSHOT_SEED_PATH = process.env.SNAPSHOT_SEED_PATH || path.join(__dirname, "snapshot.seed.json");
const SNAPSHOT_SCHEMA_VERSION = Number(process.env.SNAPSHOT_SCHEMA_VERSION || 1);
const SNAPSHOT_HISTORY_DIR = process.env.SNAPSHOT_HISTORY_DIR || path.join(__dirname, "snapshot_history");
const NCL_SNAPSHOT_PATH = process.env.NCL_SNAPSHOT_PATH || path.join(__dirname, "snapshot.ncl.json");
const EPOCH_SNAPSHOT_START_EPOCH = Number(process.env.EPOCH_SNAPSHOT_START_EPOCH || 507);
const VOTE_TX_TIME_MAX_LOOKUPS = Number(process.env.VOTE_TX_TIME_MAX_LOOKUPS || 40000);
const VOTE_TX_TIME_CACHE_PATH = process.env.VOTE_TX_TIME_CACHE_PATH || path.join(__dirname, "cache.voteTxTimes.json");
const VOTE_TX_RATIONALE_MAX_LOOKUPS = Number(process.env.VOTE_TX_RATIONALE_MAX_LOOKUPS || 2000);
const VOTE_TX_RATIONALE_MAX_DURATION_MS = Number(process.env.VOTE_TX_RATIONALE_MAX_DURATION_MS || 6 * 60 * 1000);
const VOTE_TX_RATIONALE_CACHE_PATH = process.env.VOTE_TX_RATIONALE_CACHE_PATH || path.join(__dirname, "cache.voteTxRationales.json");
const SPO_PROFILE_CACHE_PATH = process.env.SPO_PROFILE_CACHE_PATH || path.join(__dirname, "cache.spoProfiles.json");
const FRONTEND_DIST_PATH = process.env.FRONTEND_DIST_PATH || path.join(__dirname, "frontend", "dist");
const BUG_REPORTS_PATH = process.env.BUG_REPORTS_PATH || path.join(__dirname, "reports", "bug_reports.ndjson");
const BUG_REPORTS_TOKEN = String(process.env.BUG_REPORTS_TOKEN || "").trim();
const SPECIAL_DREP_REFRESH_MS = Number(process.env.SPECIAL_DREP_REFRESH_MS || 15 * 60 * 1000);
const SPECIAL_DREP_IDS = {
  alwaysAbstain: "drep_always_abstain",
  alwaysNoConfidence: "drep_always_no_confidence"
};
const CC_NAME_OVERRIDES_BY_HOT = {
  // Resolved from on-chain vote metadata anchors.
  cc_hot1qwz0aw5583t56fvcg96ulqjhjk0xkwsuvs2rmp0xflhkh4g5e22ce: "Cardano Curia",
  cc_hot1qde96n2yfxvx2pc4xm25va9ssqezh5mxhc2n8rdjyxq8kvgwwujd9: "Cardano Japan Council",
  // Historical/expired CC members (resolved via vote-history + rationale author metadata).
  cc_hot1qvr7p6ms588athsgfd0uez5m9rlhwu3g9dt7wcxkjtr4hhsq6ytv2: "Cardano Atlantic Council",
  cc_hot1qv7fa08xua5s7qscy9zct3asaa5a3hvtdc8sxexetcv3unq7cfkq5: "Input | Output",
  cc_hot1qwzuglw5hx3wwr5gjewerhtfhcvz64s9kgam2fgtrj2t7eqs00fzv: "Intersect Constitutional Council",
  cc_hot1qdnedkra2957t6xzzwygdgyefd5ctpe4asywauqhtzlu9qqkttvd9: "Cardano Foundation",
  cc_hot1q0wzkpcxzzfs4mf4yk6yx7d075vqtyx2tnxsr256he6gnwq6yfy5w: "Emurgo",
  cc_hot1qdqp9j44qfnwlkx9h78kts8hvee4ycc7czrw0xl4lqhsw4gcxgkpt: "Cardano Japan"
};
const CC_COLD_OVERRIDES_BY_HOT = {
  // Interim/legacy CC members (source: CExplorer gov_action detail for
  // "Replace Interim Constitutional Committee").
  cc_hot1qvr7p6ms588athsgfd0uez5m9rlhwu3g9dt7wcxkjtr4hhsq6ytv2:
    "cc_cold1zv6fu40c86d0yjqnum9ndr0k4qxn39gm9ge5mlxly6q42kqmjmzyj", // Cardano Atlantic Council
  cc_hot1qdnedkra2957t6xzzwygdgyefd5ctpe4asywauqhtzlu9qqkttvd9:
    "cc_cold1zwmqzgp5hg98ujhmhuk859pjlzpy4mjjnxjguw8yr22jdps6c64hp", // Cardano Foundation
  cc_hot1qwzuglw5hx3wwr5gjewerhtfhcvz64s9kgam2fgtrj2t7eqs00fzv:
    "cc_cold1z0cdctqqmy4y25sjv7lz6h0pcjzld7w3g3nd0ctqv2yheacw3r2se", // Intersect
  cc_hot1qv7fa08xua5s7qscy9zct3asaa5a3hvtdc8sxexetcv3unq7cfkq5:
    "cc_cold1z00saqaaue2pdkk7tv0e0el3zhxpl7ve259dj6y9q7plu5qwvxfy9", // Input | Output (IOG)
  cc_hot1qdqp9j44qfnwlkx9h78kts8hvee4ycc7czrw0xl4lqhsw4gcxgkpt:
    "cc_cold1z05pvken9qp8acxhfv0sw2vvkzf0mxd2w6t6zsm0txtlvfgu4d0fp", // Cardano Japan (interim credential)
  cc_hot1q0wzkpcxzzfs4mf4yk6yx7d075vqtyx2tnxsr256he6gnwq6yfy5w:
    "cc_cold1z08gkda89vtc5dam6v3km2nm9s2ce8fkqnn65en7d3sqfdc3xtps9" // Emurgo
};
const CC_EPOCH_OVERRIDES_BY_HOT = {
  cc_hot1qvr7p6ms588athsgfd0uez5m9rlhwu3g9dt7wcxkjtr4hhsq6ytv2: {
    seatStartEpoch: 507,
    expirationEpoch: 596,
    status: "retired"
  },
  cc_hot1qv7fa08xua5s7qscy9zct3asaa5a3hvtdc8sxexetcv3unq7cfkq5: {
    seatStartEpoch: 507,
    expirationEpoch: 580
  },
  cc_hot1qwzuglw5hx3wwr5gjewerhtfhcvz64s9kgam2fgtrj2t7eqs00fzv: {
    seatStartEpoch: 507,
    expirationEpoch: 580
  },
  cc_hot1qdnedkra2957t6xzzwygdgyefd5ctpe4asywauqhtzlu9qqkttvd9: {
    seatStartEpoch: 507,
    expirationEpoch: 580
  },
  cc_hot1q0wzkpcxzzfs4mf4yk6yx7d075vqtyx2tnxsr256he6gnwq6yfy5w: {
    seatStartEpoch: 507,
    expirationEpoch: 580
  },
  cc_hot1qdqp9j44qfnwlkx9h78kts8hvee4ycc7czrw0xl4lqhsw4gcxgkpt: {
    seatStartEpoch: 507,
    expirationEpoch: 580
  }
};
const CC_EPOCH_OVERRIDES_BY_NAME = {
  "cardano atlantic council": { seatStartEpoch: 507, expirationEpoch: 596, status: "retired" },
  "intersect constitutional council": { seatStartEpoch: 507, expirationEpoch: 580 },
  "emurgo": { seatStartEpoch: 507, expirationEpoch: 580 },
  "cardano foundation": { seatStartEpoch: 507, expirationEpoch: 580 },
  "cardano japan": { seatStartEpoch: 507, expirationEpoch: 580 },
  "input | output": { seatStartEpoch: 507, expirationEpoch: 580 },
  "input output": { seatStartEpoch: 507, expirationEpoch: 580 }
};

let bech32Codec = null;
try {
  bech32Codec = require("./frontend/node_modules/bech32").bech32;
} catch {
  bech32Codec = null;
}

function bech32IdToHex(value) {
  const raw = String(value || "").trim();
  if (!raw || !bech32Codec) return "";
  try {
    const decoded = bech32Codec.decode(raw, 2048);
    const bytes = bech32Codec.fromWords(decoded.words);
    return Buffer.from(bytes).toString("hex").toLowerCase();
  } catch {
    return "";
  }
}

const CC_HOT_HEX_TO_HOT_CREDENTIAL = (() => {
  const map = new Map();
  for (const hotCredential of Object.keys(CC_NAME_OVERRIDES_BY_HOT)) {
    const hex = bech32IdToHex(hotCredential);
    if (!hex) continue;
    map.set(hex, hotCredential);
    // Some upstream payloads expose committee key hashes without the leading key-type byte (02/03).
    if (hex.length === 58 && (hex.startsWith("02") || hex.startsWith("03"))) {
      map.set(hex.slice(2), hotCredential);
    }
  }
  return Object.fromEntries(map.entries());
})();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

let snapshot = {
  schemaVersion: SNAPSHOT_SCHEMA_VERSION,
  generatedAt: null,
  proposalCount: 0,
  scannedProposalCount: 0,
  processedProposalCount: 0,
  skippedProposalCount: 0,
  voteFetchErrorCount: 0,
  partial: true,
  notice: "No snapshot available yet. Initial sync is pending.",
  proposalInfo: {},
  specialDreps: {},
  dreps: [],
  committeeMembers: [],
  spos: []
};

let syncState = {
  syncing: false,
  lastStartedAt: null,
  lastCompletedAt: null,
  lastError: null,
  totalProposals: 0,
  scannedProposals: 0,
  processedProposals: 0,
  lastSyncMode: null,       // "full" | "delta"
  lastEpochAtSync: null,    // epoch number at the time of last completed sync
};
let pendingSnapshot = null;
let pendingSnapshotBuiltAt = null;
let epochBackfillState = {
  running: false,
  lastStartedAt: null,
  lastCompletedAt: null,
  lastError: null,
  targetCount: 0,
  completedCount: 0
};
let voteTxTimeCache = {};
let voteTxRationaleCache = {};
const cgovSpoRationaleLookupCache = new Map();
const cgovCommitteeRationaleLookupCache = new Map();
const cgovDrepRationaleLookupCache = new Map();
const cgovProposalDetailCache = new Map();
let specialDrepsCache = {
  fetchedAt: 0,
  value: {}
};
let spoFallbackCache = {
  fetchedAt: 0,
  rows: []
};
let spoFallbackRefreshPromise = null;
let spoProfileCache = {
  byPool: {}
};
let spoProfileDirty = false;
let spoProfileRefreshPromise = null;
const spoProfileRefreshQueue = new Set();
const NCL_PERIODS = {
  current: {
    key: "current",
    label: "Current NCL Window",
    startEpoch: 613,
    endEpoch: 713,
    limitAda: 350000000
  },
  previous: {
    key: "previous",
    label: "Previous NCL Window",
    startEpoch: 532,
    endEpoch: 612,
    limitAda: 350000000
  }
};
const NCL_DATA_SOURCE = "snapshot-proposalinfo-v1";
let nclCache = {
  fetchedAt: 0,
  byPeriod: {}
};
const nclRefreshPromises = {};
const voteRationaleCache = new Map();
const voteRationaleResultCache = new Map();
const drepRationaleByProposalVoter = new Map();
let drepRationaleWarmState = {
  running: false,
  lastStartedAt: null,
  lastCompletedAt: null,
  lastError: null,
  scannedProposals: 0,
  updatedVotes: 0
};

let lastRequestAt = 0;
let lastKoiosRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function json(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

function trimTo(input, maxLen) {
  const value = String(input || "").replace(/\r/g, "").trim();
  if (!value) return "";
  return value.length > maxLen ? value.slice(0, maxLen) : value;
}

function readJsonBody(req, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Payload too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        if (!raw.trim()) {
          resolve({});
          return;
        }
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          reject(new Error("Invalid JSON payload."));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error("Invalid JSON payload."));
      }
    });
    req.on("error", () => reject(new Error("Failed to read request body.")));
  });
}

function readBugReports(limit = 200) {
  if (!fs.existsSync(BUG_REPORTS_PATH)) return [];
  const raw = fs.readFileSync(BUG_REPORTS_PATH, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const parsed = [];
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      const row = JSON.parse(lines[i]);
      if (row && typeof row === "object") {
        if (!row.status) row.status = "open";
        parsed.push(row);
      }
    } catch {
      // Ignore malformed lines.
    }
  }
  return parsed.slice(0, limit);
}

function readBugReportsAll() {
  if (!fs.existsSync(BUG_REPORTS_PATH)) return [];
  const raw = fs.readFileSync(BUG_REPORTS_PATH, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const out = [];
  for (const line of lines) {
    try {
      const row = JSON.parse(line);
      if (row && typeof row === "object") {
        if (!row.status) row.status = "open";
        out.push(row);
      }
    } catch {
      // Ignore malformed lines.
    }
  }
  return out;
}

function writeBugReportsAll(rows) {
  fs.mkdirSync(path.dirname(BUG_REPORTS_PATH), { recursive: true });
  const safeRows = Array.isArray(rows) ? rows : [];
  const body = safeRows.map((row) => JSON.stringify(row)).join("\n");
  fs.writeFileSync(BUG_REPORTS_PATH, body ? `${body}\n` : "", "utf8");
}

function readAdminTokenFromRequest(req, url) {
  const headerToken = String(req.headers["x-bug-admin-token"] || "").trim();
  if (headerToken) return headerToken;
  const auth = String(req.headers.authorization || "").trim();
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  const queryToken = String(url.searchParams.get("token") || "").trim();
  return queryToken;
}

function isBugReportsAuthorized(req, url) {
  if (!BUG_REPORTS_TOKEN) return false;
  const provided = readAdminTokenFromRequest(req, url);
  return Boolean(provided) && provided === BUG_REPORTS_TOKEN;
}

function titleCase(input) {
  if (!input) return "Unknown";
  const normalized = String(input).replaceAll("_", " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function cleanPlainText(input) {
  if (!input) return "";
  let text = String(input);
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  text = text.replace(/`{1,3}([^`]+)`{1,3}/g, "$1");
  text = text.replace(/^#{1,6}\s+/gm, "");
  text = text.replace(/^\s*[-*+]\s+/gm, "");
  text = text.replace(/^\s*\d+\.\s+/gm, "");
  text = text.replace(/\r/g, "");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/[ \t]{2,}/g, " ");
  return text.trim();
}

function hasVoteRationale(vote) {
  if (!vote || typeof vote !== "object") return false;
  const candidates = [
    vote.anchor_url,
    vote.anchor_hash,
    vote.metadata_url,
    vote.meta_url,
    vote.url
  ];
  return candidates.some((value) => typeof value === "string" && value.trim().length > 0);
}

function getVoteRationaleUrl(vote) {
  if (!vote || typeof vote !== "object") return "";
  const candidates = [vote.anchor_url, vote.metadata_url, vote.meta_url, vote.url];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return "";
}

function normalizeVoteRole(value) {
  const raw = String(value || "").toLowerCase();
  if (!raw) return "";
  if (raw.includes("constitutional") || raw.includes("committee")) return "constitutional_committee";
  if (raw.includes("drep")) return "drep";
  if (raw === "spo") return "stake_pool";
  if (raw.includes("stake_pool") || raw.includes("stakepool") || raw.includes("pool")) return "stake_pool";
  return raw.replace(/\s+/g, "_");
}

function normalizeLiteral(value) {
  if (value === null || value === undefined) return "";
  let s = String(value).trim().toLowerCase();
  if (!s) return "";
  s = s.replace(/[- :.]/g, "_");
  while (s.includes("__")) s = s.replace(/__+/g, "_");
  return s;
}

function parseMaybeJsonObject(value) {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch {
    return null;
  }
  return null;
}

function extractPoolTicker(pool) {
  const direct = String(pool?.ticker || pool?.pool_ticker || "").trim();
  if (direct) return direct;
  const meta = parseMaybeJsonObject(pool?.meta_json);
  const fromMeta = String(meta?.ticker || meta?.pool_ticker || "").trim();
  return fromMeta || "";
}

function extractPoolHomepage(pool) {
  const direct = String(pool?.homepage || pool?.pool_homepage || "").trim();
  if (direct) return direct;
  const meta = parseMaybeJsonObject(pool?.meta_json);
  const fromMeta = String(meta?.homepage || meta?.pool_homepage || "").trim();
  return fromMeta || "";
}

function classifySpoDelegationStatus(normalizedLiteralRaw) {
  const normalized = normalizeLiteral(normalizedLiteralRaw);
  if (!normalized) return "Not delegated";
  if (normalized.includes("always_abstain")) return "Always abstain";
  if (normalized.includes("no_confidence")) return "Always no confidence";
  return "Delegated to DRep";
}

function compactProposalInfoForDashboard(proposalInfo) {
  const source = proposalInfo && typeof proposalInfo === "object" ? proposalInfo : {};
  const compact = {};
  for (const [proposalId, info] of Object.entries(source)) {
    compact[proposalId] = {
      actionName: info?.actionName || proposalId,
      governanceType: info?.governanceType || "Unknown",
      outcome: info?.outcome || "Unknown",
      submittedEpoch: Number(info?.submittedEpoch || 0),
      submittedAt: info?.submittedAt || null,
      submittedAtUnix: Number(info?.submittedAtUnix || 0),
      expirationEpoch: Number(info?.expirationEpoch || 0),
      ratifiedEpoch: Number(info?.ratifiedEpoch || 0),
      enactedEpoch: Number(info?.enactedEpoch || 0),
      droppedEpoch: Number(info?.droppedEpoch || 0),
      expiredEpoch: Number(info?.expiredEpoch || 0),
      voteStats: info?.voteStats || {}
    };
  }
  return compact;
}

function compactVotesForDashboard(votes) {
  const source = Array.isArray(votes) ? votes : [];
  return source.map((vote) => ({
    proposalId: vote?.proposalId || "",
    vote: vote?.vote || "",
    outcome: vote?.outcome || "",
    voteTxHash: vote?.voteTxHash || "",
    hasRationale: vote?.hasRationale ?? null,
    rationaleUrl: vote?.rationaleUrl || "",
    rationaleBodyLength: Number(vote?.rationaleBodyLength || 0),
    rationaleSectionCount: Number(vote?.rationaleSectionCount || 0),
    responseHours: typeof vote?.responseHours === "number" ? vote.responseHours : null
  }));
}

function compactActorsForDashboard(rows) {
  const source = Array.isArray(rows) ? rows : [];
  return source.map((row) => ({
    ...row,
    votes: compactVotesForDashboard(row?.votes)
  }));
}

async function fetchKoiosPoolInfoByIds(poolIds) {
  const ids = Array.from(new Set((Array.isArray(poolIds) ? poolIds : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean)));
  if (ids.length === 0) return new Map();

  const byId = new Map();
  let batchSize = 80;
  for (let i = 0; i < ids.length;) {
    const chunk = ids.slice(i, i + batchSize);
    const resp = await koiosPost("/pool_info", { _pool_bech32_ids: chunk }).catch((error) => {
      if (String(error?.message || "").includes("413") && batchSize > 10) {
        batchSize = Math.max(10, Math.floor(batchSize / 2));
        return null;
      }
      return [];
    });
    if (resp === null) continue;
    if (Array.isArray(resp)) {
      for (const row of resp) {
        const id = String(row?.pool_id_bech32 || "").trim();
        if (id) byId.set(id, row);
      }
    }
    i += chunk.length;
  }
  return byId;
}

function hasKoiosRationale(row) {
  if (!row || typeof row !== "object") return false;
  if (typeof row.meta_url === "string" && row.meta_url.trim()) return true;
  if (typeof row.meta_hash === "string" && row.meta_hash.trim()) return true;
  if (typeof row.anchor_url === "string" && row.anchor_url.trim()) return true;
  if (typeof row.anchor_hash === "string" && row.anchor_hash.trim()) return true;
  if (row.meta_json && typeof row.meta_json === "object") return true;
  return false;
}

function addKoiosVoteLookupEntry(lookup, row) {
  if (!lookup || !row || typeof row !== "object") return;
  const role = normalizeVoteRole(row.voter_role);
  const voterId = String(row.voter_id || "").trim();
  const voteTxHash = String(row.vote_tx_hash || "").trim().toLowerCase();
  const rationale = {
    hasRationale: hasKoiosRationale(row),
    rationaleUrl: String(row.meta_url || row.anchor_url || "").trim(),
    koiosVoterId: voterId,
    koiosRole: role
  };
  if (voteTxHash && !lookup.has(`tx:${voteTxHash}`)) {
    lookup.set(`tx:${voteTxHash}`, rationale);
  }
  if (!role || !voterId) return;
  const key = `${role}:${voterId}`.toLowerCase();
  if (lookup.has(key)) return;
  lookup.set(key, rationale);
}

function buildKoiosInFilter(values) {
  const clean = Array.from(new Set((Array.isArray(values) ? values : [])
    .map((v) => String(v || "").trim())
    .filter(Boolean)));
  if (clean.length === 0) return "";
  const joined = clean.map((v) => `"${v.replace(/"/g, '""')}"`).join(",");
  return encodeURIComponent(`in.(${joined})`);
}

async function fetchKoiosVoteRationaleLookup(proposalId) {
  const lookup = new Map();
  const limit = 1000;
  const maxRows = 10000;
  let offset = 0;
  let sourceError = false;
  while (offset < maxRows) {
    const query =
      `/vote_list?proposal_id=eq.${encodeURIComponent(proposalId)}` +
      `&order=block_time.desc&limit=${limit}&offset=${offset}`;
    let rows = [];
    try {
      rows = await koiosGet(query);
    } catch {
      sourceError = true;
      break;
    }
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const row of rows) {
      addKoiosVoteLookupEntry(lookup, row);
    }
    if (rows.length < limit) break;
    offset += rows.length;
  }
  if (sourceError && lookup.size === 0) {
    lookup.__unresolved = true;
  }
  return lookup;
}

async function fetchKoiosVotingSummariesByProposalIds(proposalIds) {
  const out = new Map();
  const filter = buildKoiosInFilter(proposalIds);
  if (!filter) return out;
  const rows = await koiosGet(`/proposal_voting_summary?_proposal_id=${filter}`).catch(() => []);
  for (const row of Array.isArray(rows) ? rows : []) {
    const proposalId = String(row?._proposal_id || row?.proposal_id || "").trim();
    if (!proposalId || out.has(proposalId)) continue;
    out.set(proposalId, row);
  }
  return out;
}

async function fetchKoiosVoteRationaleLookupsForProposals(proposalIds) {
  const ids = Array.from(new Set((Array.isArray(proposalIds) ? proposalIds : [])
    .map((v) => String(v || "").trim())
    .filter(Boolean)));
  const lookups = new Map(ids.map((id) => [id, new Map()]));
  if (ids.length === 0) return lookups;
  const filter = buildKoiosInFilter(ids);
  if (!filter) return lookups;
  const limit = 1000;
  const maxRows = 10000;
  let offset = 0;
  let unresolved = false;
  while (offset < maxRows) {
    const query = `/vote_list?proposal_id=${filter}&order=block_time.desc&limit=${limit}&offset=${offset}`;
    let rows = [];
    try {
      rows = await koiosGet(query);
    } catch {
      unresolved = true;
      break;
    }
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const row of rows) {
      const proposalId = String(row?.proposal_id || row?._proposal_id || "").trim();
      if (!proposalId || !lookups.has(proposalId)) continue;
      addKoiosVoteLookupEntry(lookups.get(proposalId), row);
    }
    if (rows.length < limit) break;
    offset += rows.length;
  }
  if (unresolved) {
    for (const id of ids) {
      const lookup = lookups.get(id);
      if (lookup && lookup.size === 0) lookup.__unresolved = true;
    }
  }
  return lookups;
}

async function fetchKoiosSpoVoteRationaleLookupsForProposals(proposalIds) {
  const ids = Array.from(new Set((Array.isArray(proposalIds) ? proposalIds : [])
    .map((v) => String(v || "").trim())
    .filter(Boolean)));
  const lookups = new Map(ids.map((id) => [id, new Map()]));
  if (ids.length === 0) return lookups;
  const filter = buildKoiosInFilter(ids);
  if (!filter) return lookups;
  const limit = 1000;
  const maxRows = 50000;
  let offset = 0;
  let unresolved = false;
  while (offset < maxRows) {
    const query =
      `/vote_list?voter_role=eq.${encodeURIComponent("SPO")}` +
      `&proposal_id=${filter}&order=block_time.desc&limit=${limit}&offset=${offset}`;
    let rows = [];
    try {
      rows = await koiosGet(query);
    } catch {
      unresolved = true;
      break;
    }
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const row of rows) {
      const proposalId = String(row?.proposal_id || row?._proposal_id || "").trim();
      if (!proposalId || !lookups.has(proposalId)) continue;
      addKoiosVoteLookupEntry(lookups.get(proposalId), row);
    }
    if (rows.length < limit) break;
    offset += rows.length;
  }
  if (unresolved) {
    for (const id of ids) {
      const lookup = lookups.get(id);
      if (lookup && lookup.size === 0) lookup.__unresolved = true;
    }
  }
  return lookups;
}

async function fetchCgovProposalDetails(hashAndIndex) {
  const key = String(hashAndIndex || "").trim();
  if (!key) return null;
  if (cgovProposalDetailCache.has(key)) return cgovProposalDetailCache.get(key) || null;
  const url = `${CGOV_PROPOSAL_API_BASE}/${encodeURIComponent(key)}`;
  const text = await fetchTextWithTimeout(url, 12000);
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    const payload = parsed && typeof parsed === "object" ? parsed : null;
    cgovProposalDetailCache.set(key, payload);
    return payload;
  } catch {
    return null;
  }
}

async function fetchCgovSpoVoteRationaleLookupForProposal(txHash, certIndex) {
  const tx = String(txHash || "").trim().toLowerCase();
  const idx = Number(certIndex);
  if (!tx || !Number.isInteger(idx) || idx < 0) return null;
  const key = `${tx}:${idx}`;
  if (cgovSpoRationaleLookupCache.has(key)) return cgovSpoRationaleLookupCache.get(key) || null;
  const payload = await fetchCgovProposalDetails(key).catch(() => null);
  const lookup = new Map();
  for (const vote of Array.isArray(payload?.votes) ? payload.votes : []) {
    const voterType = String(vote?.voterType || "").trim().toLowerCase();
    if (voterType !== "spo") continue;
    const voterId = String(vote?.voterId || "").trim().toLowerCase();
    const txHashVote = String(vote?.txHash || "").trim().toLowerCase();
    if (!voterId || !txHashVote) continue;
    const rationaleUrl = String(vote?.anchorUrl || "").trim();
    const rationaleText = String(vote?.rationale || "").trim();
    const entry = {
      hasRationale: Boolean(rationaleUrl || rationaleText),
      rationaleUrl
    };
    lookup.set(`voter:${voterId}:tx:${txHashVote}`, entry);
    if (!lookup.has(`tx:${txHashVote}`)) lookup.set(`tx:${txHashVote}`, entry);
  }
  cgovSpoRationaleLookupCache.set(key, lookup);
  return lookup;
}

async function fetchCgovDrepVoteRationaleLookupForProposal(txHash, certIndex) {
  const tx = String(txHash || "").trim().toLowerCase();
  const idx = Number(certIndex);
  if (!tx || !Number.isInteger(idx) || idx < 0) return null;
  const key = `${tx}:${idx}`;
  if (cgovDrepRationaleLookupCache.has(key)) return cgovDrepRationaleLookupCache.get(key) || null;
  const payload = await fetchCgovProposalDetails(key).catch(() => null);
  const lookup = new Map();
  for (const vote of Array.isArray(payload?.votes) ? payload.votes : []) {
    const voterType = String(vote?.voterType || "").trim().toLowerCase();
    if (voterType !== "drep") continue;
    const voterId = String(vote?.voterId || "").trim().toLowerCase();
    const txHashVote = String(vote?.txHash || "").trim().toLowerCase();
    const rationaleUrl = String(vote?.anchorUrl || "").trim();
    const rationaleRaw = String(vote?.rationale || "").trim();
    let rationaleText = cleanPlainText(rationaleRaw);
    if (rationaleRaw.startsWith("{") || rationaleRaw.startsWith("[")) {
      try {
        const parsed = JSON.parse(rationaleRaw);
        const parsedText = pickRationaleText(parsed);
        if (parsedText) rationaleText = parsedText;
      } catch {
        // Keep plain-text fallback.
      }
    }
    const entry = {
      hasRationale: Boolean(rationaleUrl || rationaleText),
      rationaleUrl,
      rationaleText,
      voteTxHash: txHashVote
    };
    if (voterId && txHashVote) lookup.set(`voter:${voterId}:tx:${txHashVote}`, entry);
    if (voterId && !lookup.has(`voter:${voterId}`)) lookup.set(`voter:${voterId}`, entry);
    if (txHashVote) lookup.set(`tx:${txHashVote}`, entry);
  }
  cgovDrepRationaleLookupCache.set(key, lookup);
  return lookup;
}

function lookupCgovDrepVoteRationale(lookup, voterId = "", voteTxHash = "") {
  if (!(lookup instanceof Map)) return null;
  const voter = String(voterId || "").trim().toLowerCase();
  const txHash = String(voteTxHash || "").trim().toLowerCase();
  if (voter && txHash) {
    const byBoth = lookup.get(`voter:${voter}:tx:${txHash}`);
    if (byBoth) return byBoth;
  }
  if (voter) {
    const byVoter = lookup.get(`voter:${voter}`);
    if (byVoter) return byVoter;
  }
  if (txHash) {
    const byTx = lookup.get(`tx:${txHash}`);
    if (byTx) return byTx;
  }
  return null;
}

async function warmDrepRationaleCacheFromSnapshot(sourceSnapshot = snapshot) {
  if (drepRationaleWarmState.running) return;
  drepRationaleWarmState.running = true;
  drepRationaleWarmState.lastStartedAt = new Date().toISOString();
  drepRationaleWarmState.lastError = null;
  drepRationaleWarmState.scannedProposals = 0;
  drepRationaleWarmState.updatedVotes = 0;
  try {
    const dreps = Array.isArray(sourceSnapshot?.dreps) ? sourceSnapshot.dreps : [];
    const proposalInfo = sourceSnapshot?.proposalInfo && typeof sourceSnapshot.proposalInfo === "object"
      ? sourceSnapshot.proposalInfo
      : {};
    const votesByProposal = new Map();
    for (const drep of dreps) {
      const drepId = String(drep?.id || "").trim();
      if (!drepId) continue;
      for (const vote of Array.isArray(drep?.votes) ? drep.votes : []) {
        const proposalId = String(vote?.proposalId || "").trim();
        const voteTxHash = String(vote?.voteTxHash || "").trim().toLowerCase();
        if (!proposalId) continue;
        if (!votesByProposal.has(proposalId)) votesByProposal.set(proposalId, []);
        votesByProposal.get(proposalId).push({ drepId, voteTxHash });
      }
    }
    drepRationaleWarmState.scannedProposals = votesByProposal.size;
    for (const [proposalId, voters] of votesByProposal.entries()) {
      const info = proposalInfo?.[proposalId];
      const proposalTxHash = String(info?.txHash || "").trim().toLowerCase();
      const proposalCertIndex = Number(info?.certIndex);
      if (!proposalTxHash || !Number.isInteger(proposalCertIndex) || proposalCertIndex < 0) continue;
      const lookup = await fetchCgovDrepVoteRationaleLookupForProposal(proposalTxHash, proposalCertIndex).catch(() => null);
      for (const voter of voters) {
        const matched = lookupCgovDrepVoteRationale(lookup, voter.drepId, voter.voteTxHash);
        if (!matched || typeof matched !== "object") continue;
        const rationaleUrl = String(matched.rationaleUrl || "").trim();
        const rationaleText = cleanPlainText(String(matched.rationaleText || "").trim());
        if (!rationaleUrl && !rationaleText) continue;
        const proposalVoterKey = `${proposalId}|${String(voter.drepId || "").trim().toLowerCase()}`;
        drepRationaleByProposalVoter.set(proposalVoterKey, {
          hasRationale: true,
          rationaleUrl,
          rationaleText
        });
        const txKey = String(voter.voteTxHash || matched.voteTxHash || "").trim().toLowerCase();
        if (txKey) {
          voteTxRationaleCache[txKey] = {
            ...(voteTxRationaleCache[txKey] && typeof voteTxRationaleCache[txKey] === "object"
              ? voteTxRationaleCache[txKey]
              : {}),
            hasRationale: true,
            rationaleUrl: rationaleUrl || String(voteTxRationaleCache[txKey]?.rationaleUrl || ""),
            rationaleText: rationaleText || String(voteTxRationaleCache[txKey]?.rationaleText || ""),
            fetchedAt: Date.now()
          };
        }
        drepRationaleWarmState.updatedVotes += 1;
      }
    }
    if (drepRationaleWarmState.updatedVotes > 0) {
      saveVoteTxRationaleCache();
    }
    drepRationaleWarmState.lastCompletedAt = new Date().toISOString();
  } catch (error) {
    drepRationaleWarmState.lastError = error?.message || String(error);
  } finally {
    drepRationaleWarmState.running = false;
  }
}

function extractCommitteeRationaleLengthSignals(rawRationale) {
  let payload = rawRationale;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = null;
    }
  }
  if (!payload || typeof payload !== "object") {
    return { bodyLength: 0, sectionCount: 0 };
  }
  const body = payload?.body && typeof payload.body === "object" ? payload.body : payload;
  const sections = [
    String(body?.rationaleStatement || "").trim(),
    String(body?.precedentDiscussion || "").trim(),
    String(body?.counterargumentDiscussion || "").trim(),
    String(body?.conclusion || "").trim(),
    String(body?.comment || "").trim()
  ].filter(Boolean);
  const bodyLength = sections.reduce((sum, text) => sum + text.length, 0);
  return {
    bodyLength,
    sectionCount: sections.length
  };
}

async function fetchCgovCommitteeVoteRationaleLookupForProposal(txHash, certIndex) {
  const tx = String(txHash || "").trim().toLowerCase();
  const idx = Number(certIndex);
  if (!tx || !Number.isInteger(idx) || idx < 0) return null;
  const key = `${tx}:${idx}`;
  if (cgovCommitteeRationaleLookupCache.has(key)) return cgovCommitteeRationaleLookupCache.get(key) || null;
  const payload = await fetchCgovProposalDetails(key).catch(() => null);
  const lookup = new Map();
  const ccVotes = [
    ...(Array.isArray(payload?.ccVotes) ? payload.ccVotes : []),
    ...(Array.isArray(payload?.votes) ? payload.votes : [])
  ];
  for (const vote of ccVotes) {
    const voterType = String(vote?.voterType || "").trim().toLowerCase();
    if (voterType !== "cc" && voterType !== "committee" && voterType !== "constitutional_committee") continue;
    const voterId = String(vote?.voterId || "").trim().toLowerCase();
    const txHashVote = String(vote?.txHash || "").trim().toLowerCase();
    if (!txHashVote) continue;
    const rationaleUrl = String(vote?.anchorUrl || "").trim();
    const rationaleText = String(vote?.rationale || "").trim();
    const rationaleSignal = extractCommitteeRationaleLengthSignals(vote?.rationale);
    const entry = {
      hasRationale: Boolean(rationaleUrl || rationaleText),
      rationaleUrl,
      rationaleBodyLength: Number(rationaleSignal.bodyLength || 0),
      rationaleSectionCount: Number(rationaleSignal.sectionCount || 0)
    };
    if (voterId && txHashVote) lookup.set(`voter:${voterId}:tx:${txHashVote}`, entry);
    if (voterId && !lookup.has(`voter:${voterId}`)) lookup.set(`voter:${voterId}`, entry);
    lookup.set(`tx:${txHashVote}`, entry);
  }
  cgovCommitteeRationaleLookupCache.set(key, lookup);
  return lookup;
}

function lookupCgovCommitteeVoteRationale(lookup, vote, voterCredential = "") {
  if (!(lookup instanceof Map) || !vote || typeof vote !== "object") return null;
  const voterId = String(voterCredential || "").trim().toLowerCase();
  const txHash = String(vote.tx_hash || "").trim().toLowerCase();
  if (voterId && txHash) {
    const byBoth = lookup.get(`voter:${voterId}:tx:${txHash}`);
    if (byBoth) return byBoth;
  }
  if (voterId) {
    const byVoter = lookup.get(`voter:${voterId}`);
    if (byVoter) return byVoter;
  }
  if (!txHash) return null;
  return lookup.get(`tx:${txHash}`) || null;
}

function lookupCgovSpoVoteRationale(lookup, vote) {
  if (!(lookup instanceof Map) || !vote || typeof vote !== "object") return null;
  const voter = String(vote.voter || "").trim().toLowerCase();
  const txHash = String(vote.tx_hash || "").trim().toLowerCase();
  if (voter && txHash) {
    const byBoth = lookup.get(`voter:${voter}:tx:${txHash}`);
    if (byBoth) return byBoth;
  }
  if (txHash) {
    const byTx = lookup.get(`tx:${txHash}`);
    if (byTx) return byTx;
  }
  return null;
}

function resolveRationalePresence(vote, koiosVote, koiosLookup) {
  if (hasVoteRationale(vote)) return true;
  if (koiosVote?.hasRationale) return true;
  if (koiosLookup?.__unresolved) return null;
  return false;
}

function lookupKoiosVoteRationale(lookup, vote) {
  if (!(lookup instanceof Map) || !vote || typeof vote !== "object") return null;
  const txKey = String(vote.tx_hash || "").trim().toLowerCase();
  if (txKey) {
    const byTx = lookup.get(`tx:${txKey}`);
    if (byTx) return byTx;
  }
  const role = normalizeVoteRole(vote.voter_role);
  const voter = String(vote.voter || "").trim().toLowerCase();
  if (role && voter) {
    const byVoter = lookup.get(`${role}:${voter}`);
    if (byVoter) return byVoter;
  }
  return null;
}

async function fetchTextWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function pickRationaleText(payload) {
  if (!payload) return "";
  if (typeof payload === "string") return cleanPlainText(payload);
  if (typeof payload !== "object") return "";
  const body = payload.body && typeof payload.body === "object" ? payload.body : payload;
  const structuredFields = [
    body.abstract,
    body.summary,
    body.motivation,
    body.rationaleStatement,
    body.rationale,
    body.precedentDiscussion,
    body.counterargumentDiscussion,
    body.conclusion
  ]
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => cleanPlainText(value))
    .filter(Boolean);
  if (structuredFields.length > 0) return structuredFields.join("\n\n");
  const directCandidates = [
    body.abstract,
    body.summary,
    body.motivation,
    body.rationaleStatement,
    body.rationale,
    body.precedentDiscussion,
    body.counterargumentDiscussion,
    body.conclusion,
    body.reason,
    body.justification,
    body.explanation,
    body.comment,
    payload.rationale,
    payload.motivation,
    payload.abstract,
    payload.summary
  ];
  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim()) return cleanPlainText(candidate);
  }
  const stack = [payload];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    for (const [k, v] of Object.entries(current)) {
      const key = String(k || "").toLowerCase();
      if (
        typeof v === "string" &&
        v.trim() &&
        (key.includes("rationale") || key.includes("motivation") || key.includes("reason") || key.includes("comment"))
      ) {
        return cleanPlainText(v);
      }
      if (v && typeof v === "object") stack.push(v);
    }
  }
  return "";
}

function extractRationaleSections(payload) {
  if (!payload || typeof payload !== "object") return [];
  const body = payload.body && typeof payload.body === "object" ? payload.body : payload;
  // CIP-100 / CIP-136 standard field priority order — each field gets its own section
  const preferred = [
    ["Abstract", body.abstract],
    ["Summary", body.summary],
    ["Motivation", body.motivation],
    ["Rationale", body.rationaleStatement],
    ["Rationale", body.rationale],
    ["Precedent", body.precedentDiscussion],
    ["Counterarguments", body.counterargumentDiscussion],
    ["Conclusion", body.conclusion]
  ];
  const sections = [];
  const usedTexts = new Set();
  for (const [title, value] of preferred) {
    if (typeof value !== "string") continue;
    const text = cleanPlainText(value);
    if (!text || usedTexts.has(text)) continue;
    usedTexts.add(text);
    sections.push({ title, text });
  }
  return sections;
}

async function resolveVoteRationaleData(rationaleUrl) {
  const url = String(rationaleUrl || "").trim();
  if (!url) return { text: "", sections: [] };
  if (voteRationaleCache.has(url)) {
    const cached = voteRationaleCache.get(url);
    if (cached && typeof cached === "object") return cached;
    return { text: String(cached || ""), sections: [] };
  }

  const candidates = normalizeIpfsUrl(url);
  if (candidates.length === 0 && (url.startsWith("http://") || url.startsWith("https://"))) {
    candidates.push(url);
  }
  let resolvedText = "";
  let resolvedSections = [];
  for (const candidate of candidates) {
    const raw = await fetchTextWithTimeout(candidate, 8000);
    if (!raw) continue;
    try {
      const jsonPayload = JSON.parse(raw);
      resolvedSections = extractRationaleSections(jsonPayload);
      resolvedText = pickRationaleText(jsonPayload);
      if (!resolvedText && typeof raw === "string") resolvedText = cleanPlainText(raw);
    } catch {
      resolvedText = cleanPlainText(raw);
      resolvedSections = resolvedText ? [{ title: "Rationale", text: resolvedText }] : [];
    }
    if (resolvedText) break;
  }
  const out = { text: resolvedText || "", sections: resolvedSections };
  voteRationaleCache.set(url, out);
  return out;
}

function extractProposalNameAndRationale(proposalId, detail, metadataEnvelope) {
  const metadata = metadataEnvelope?.json_metadata;
  const body = metadata && typeof metadata === "object" && metadata.body && typeof metadata.body === "object"
    ? metadata.body
    : metadata && typeof metadata === "object"
      ? metadata
      : null;

  const rawName =
    body?.title ||
    body?.name ||
    body?.displayName ||
    body?.display_name ||
    body?.label ||
    `${titleCase(detail?.governance_type || "Governance action")} (${proposalId.slice(0, 16)}...)`;
  const rawRationale = body?.rationale || body?.motivation || body?.abstract || "";

  return {
    actionName: cleanPlainText(rawName),
    rationaleText: cleanPlainText(rawRationale) || "No rationale metadata available for this governance action."
  };
}

function resolveName(metadata, drepId) {
  if (!metadata || typeof metadata !== "object") return "";
  const body = metadata.body && typeof metadata.body === "object" ? metadata.body : metadata;
  const candidates = [
    body.givenName,
    body.given_name,
    body.name,
    body.displayName,
    body.display_name,
    body.title
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed && trimmed.toLowerCase() !== "[object object]") {
        return trimmed;
      }
    }
  }
  return "";
}

function pickStringValue(value) {
  if (typeof value === "string") {
    const t = value.trim();
    return t && t.toLowerCase() !== "[object object]" ? t : "";
  }
  if (value && typeof value === "object") {
    const v = value["@value"];
    if (typeof v === "string") {
      const t = v.trim();
      return t && t.toLowerCase() !== "[object object]" ? t : "";
    }
  }
  return "";
}

function resolveNameFromRawMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return "";
  const body = metadata.body && typeof metadata.body === "object" ? metadata.body : metadata;
  const candidates = [
    body.givenName,
    body.given_name,
    body.name,
    body.displayName,
    body.display_name,
    body.title,
    body.dRepName,
    body.drepName
  ];
  for (const c of candidates) {
    const picked = pickStringValue(c);
    if (picked) return picked;
  }
  return "";
}

function computeTransparencyScore(metadataEnvelope) {
  const metadata = metadataEnvelope?.json_metadata;
  if (!metadata || typeof metadata !== "object") return 20;
  const body = metadata.body && typeof metadata.body === "object" ? metadata.body : metadata;
  let score = 25;
  if (body.givenName || body.given_name || body.name || body.displayName || body.display_name || body.title) score += 25;
  if (body.objectives || body.motivation || body.rationale || body.vision) score += 20;
  if (body.qualifications || body.experience || body.references || body.links) score += 20;
  if (body.image || body.image_url || body.bio || body.description) score += 10;
  return Math.min(100, score);
}

function normalizeIpfsUrl(input) {
  const url = String(input || "").trim();
  if (!url) return [];
  if (url.startsWith("ipfs://")) {
    const cidPath = url.replace("ipfs://", "").replace(/^ipfs\//, "");
    return [
      `https://ipfs.blockfrost.dev/ipfs/${cidPath}`,
      `https://ipfs.filebase.io/ipfs/${cidPath}`,
      `https://ipfs.io/ipfs/${cidPath}`,
      `https://gateway.pinata.cloud/ipfs/${cidPath}`
    ];
  }
  if (url.startsWith("http://") || url.startsWith("https://")) return [url];
  return [];
}

function extractNameFromAnchorJson(payload) {
  if (!payload || typeof payload !== "object") return "";
  const authors = Array.isArray(payload.authors) ? payload.authors : [];
  for (const author of authors) {
    if (author && typeof author === "object" && typeof author.name === "string") {
      const name = author.name.trim();
      if (name) return name;
    }
  }
  const body = payload.body && typeof payload.body === "object" ? payload.body : payload;
  const candidates = [body.givenName, body.given_name, body.name, body.displayName, body.display_name, body.title];
  for (const c of candidates) {
    if (typeof c === "string") {
      const t = c.trim();
      if (t && t.toLowerCase() !== "[object object]") return t;
    }
  }
  return "";
}

async function fetchJsonWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function collectHexHashes(value, output = new Set()) {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    const matches = lower.match(/[0-9a-f]{56}/g);
    if (matches) {
      for (const m of matches) output.add(m);
    }
    return output;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectHexHashes(item, output);
    return output;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      collectHexHashes(k, output);
      collectHexHashes(v, output);
    }
  }
  return output;
}

function parseCommitteeMetadataNameMap(metadataEnvelope) {
  const out = new Map();
  if (!metadataEnvelope || typeof metadataEnvelope !== "object") return out;
  const meta = metadataEnvelope.json_metadata;
  if (!meta || typeof meta !== "object") return out;
  const body = meta.body && typeof meta.body === "object" ? meta.body : meta;
  const textChunks = [body.rationale, body.motivation, body.abstract, body.summary]
    .filter((x) => typeof x === "string" && x.trim());
  if (textChunks.length === 0) return out;
  const text = textChunks.join("\n");
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  function addAlias(alias, name) {
    const a = String(alias || "").trim();
    const n = String(name || "").trim();
    if (!a || !n) return;
    out.set(a.toLowerCase(), n);
  }

  function parseCredentials(cell) {
    const c = String(cell || "");
    const results = [];
    const bech = c.match(/\bcc_(?:cold|hot)1[0-9a-z]+\b/gi) || [];
    const prefixedHex = c.match(/\b(?:scripthash|keyhash)-[0-9a-f]{56}\b/gi) || [];
    const bareHex = c.match(/\b[0-9a-f]{56}\b/gi) || [];
    for (const x of bech) results.push(x);
    for (const x of prefixedHex) results.push(x);
    for (const x of bareHex) results.push(x);
    return Array.from(new Set(results));
  }

  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((x) => x.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    if (cells.length < 2) continue;
    const isSeparator = cells.every((c) => /^:?-{3,}:?$/.test(c.replace(/\s+/g, "")));
    if (isSeparator) continue;
    const memberName = cells[0];
    if (!memberName || /^member$/i.test(memberName)) continue;
    for (let i = 1; i < cells.length; i += 1) {
      const creds = parseCredentials(cells[i]);
      for (const cred of creds) addAlias(cred, memberName);
    }
  }

  return out;
}

async function resolveCommitteeMemberNameFromKoiosVoteMeta(ccHotId) {
  if (!ccHotId) return "";
  const encoded = encodeURIComponent(ccHotId);
  // Fetch more votes so members who haven't anchored recently are not missed.
  const voteRows = await koiosGet(`/vote_list?voter_role=eq.ConstitutionalCommittee&voter_id=eq.${encoded}&order=block_time.desc&limit=50`)
    .catch(() => []);
  if (!Array.isArray(voteRows) || voteRows.length === 0) return "";
  // Collect all unique anchor URLs from all votes before fetching, so we
  // try every candidate without hammering the same URL twice.
  const seenUrls = new Set();
  const anchorUrls = [];
  for (const vote of voteRows) {
    const anchorUrl = typeof vote?.meta_url === "string" ? vote.meta_url.trim() : "";
    if (!anchorUrl || seenUrls.has(anchorUrl)) continue;
    seenUrls.add(anchorUrl);
    anchorUrls.push(anchorUrl);
  }
  for (const anchorUrl of anchorUrls) {
    const candidates = normalizeIpfsUrl(anchorUrl);
    for (const candidate of candidates) {
      const payload = await fetchJsonWithTimeout(candidate, 5000);
      const name = extractNameFromAnchorJson(payload);
      if (name) return name;
    }
  }
  return "";
}

function extractImageUrl(imageField) {
  if (!imageField) return "";
  if (typeof imageField === "string") return imageField.trim();
  if (typeof imageField === "object") {
    const candidates = [imageField.contentUrl, imageField.url, imageField.src, imageField["@id"]];
    for (const c of candidates) {
      const picked = pickStringValue(c);
      if (picked) return picked;
    }
  }
  return "";
}

function extractReferences(body) {
  const refs = Array.isArray(body?.references) ? body.references : [];
  const out = [];
  const seen = new Set();
  for (const ref of refs) {
    if (!ref || typeof ref !== "object") continue;
    const uri = pickStringValue(ref.uri);
    if (!uri) continue;
    if (seen.has(uri)) continue;
    seen.add(uri);
    const label = pickStringValue(ref.label) || uri;
    out.push({ label, uri });
  }
  return out;
}

function extractDrepProfile(metadata) {
  if (!metadata || typeof metadata !== "object") {
    return {
      name: "",
      bio: "",
      motivations: "",
      objectives: "",
      qualifications: "",
      email: "",
      imageUrl: "",
      references: []
    };
  }
  const body = metadata.body && typeof metadata.body === "object" ? metadata.body : metadata;
  const name =
    pickStringValue(body.givenName) ||
    pickStringValue(body.given_name) ||
    pickStringValue(body.name) ||
    pickStringValue(body.displayName) ||
    pickStringValue(body.display_name) ||
    pickStringValue(body.title) ||
    pickStringValue(body.dRepName) ||
    pickStringValue(body.drepName) ||
    "";
  return {
    name,
    bio: pickStringValue(body.bio),
    motivations: pickStringValue(body.motivations) || pickStringValue(body.motivation),
    objectives: pickStringValue(body.objectives),
    qualifications: pickStringValue(body.qualifications),
    email: pickStringValue(body.email),
    imageUrl: extractImageUrl(body.image),
    references: extractReferences(body)
  };
}

function mergeDrepProfiles(primary, fallback) {
  const p = primary || {};
  const f = fallback || {};
  const refs = [];
  const seen = new Set();
  for (const item of [...(p.references || []), ...(f.references || [])]) {
    if (!item || !item.uri) continue;
    if (seen.has(item.uri)) continue;
    seen.add(item.uri);
    refs.push(item);
  }
  return {
    name: p.name || f.name || "",
    bio: p.bio || f.bio || "",
    motivations: p.motivations || f.motivations || "",
    objectives: p.objectives || f.objectives || "",
    qualifications: p.qualifications || f.qualifications || "",
    email: p.email || f.email || "",
    imageUrl: p.imageUrl || f.imageUrl || "",
    references: refs
  };
}

async function fetchRawMetadataByUrl(metadataUrl, payloadCache) {
  const url = String(metadataUrl || "").trim();
  if (!url) return null;
  if (payloadCache.has(url)) return payloadCache.get(url);
  let payload = null;
  if (url.startsWith("ipfs://")) {
    const candidates = normalizeIpfsUrl(url);
    for (const candidate of candidates) {
      payload = await fetchJsonWithTimeout(candidate, 5000);
      if (payload && typeof payload === "object") break;
    }
  } else {
    payload = await fetchJsonWithTimeout(url, 5000);
  }
  payloadCache.set(url, payload || null);
  return payload || null;
}

async function resolveDrepNameFromMetadataEnvelope(metadataEnvelope, nameCache, payloadCache) {
  if (!metadataEnvelope || typeof metadataEnvelope !== "object") return "";
  const direct = resolveName(metadataEnvelope.json_metadata, metadataEnvelope.drep_id || "");
  if (direct) return direct;

  const metadataUrl = typeof metadataEnvelope.url === "string" ? metadataEnvelope.url.trim() : "";
  if (!metadataUrl) return "";
  if (nameCache.has(metadataUrl)) return nameCache.get(metadataUrl) || "";
  const rawPayload = await fetchRawMetadataByUrl(metadataUrl, payloadCache);
  const resolved = resolveNameFromRawMetadata(rawPayload);
  nameCache.set(metadataUrl, resolved || "");
  return resolved || "";
}

async function resolveDrepProfileFromMetadataEnvelope(metadataEnvelope, payloadCache) {
  if (!metadataEnvelope || typeof metadataEnvelope !== "object") return extractDrepProfile(null);
  const decodedProfile = extractDrepProfile(metadataEnvelope.json_metadata);
  const metadataUrl = typeof metadataEnvelope.url === "string" ? metadataEnvelope.url.trim() : "";
  if (!metadataUrl) return decodedProfile;
  const rawPayload = await fetchRawMetadataByUrl(metadataUrl, payloadCache);
  const rawProfile = extractDrepProfile(rawPayload);
  return mergeDrepProfiles(decodedProfile, rawProfile);
}

function outcomeFromProposal(proposalDetail) {
  if (!proposalDetail) return "pending";
  if (proposalDetail.enacted_epoch !== null || proposalDetail.ratified_epoch !== null) return "yes";
  if (proposalDetail.dropped_epoch !== null || proposalDetail.expired_epoch !== null) return "no";
  return "pending";
}

function toPercentMaybe(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 1) return n * 100;
  return n;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Recompute thresholdInfo for every proposal in a snapshot using the
 * current resolveThresholdInfo() logic and the snapshot's own thresholdContext.
 * This ensures threshold data is never stale due to code changes — called at
 * startup and inside publishSnapshot so every save reflects current rules.
 */
function refreshAllThresholdInfo(snapshotObj) {
  const pi = snapshotObj?.proposalInfo;
  const tc = snapshotObj?.thresholdContext;
  if (!pi || typeof pi !== "object" || !tc) return;
  for (const info of Object.values(pi)) {
    if (!info || typeof info !== "object") continue;
    info.thresholdInfo = resolveThresholdInfo(
      info.governanceType,
      info.governanceDescription,
      tc
    );
  }
}

/**
 * Backfill votedAtUnix / votedAt / responseHours for votes that were saved
 * with null timestamps but whose voteTxHash is already present in the
 * voteTxTimeCache.  This repairs votes that were persisted in a snapshot
 * before the tx-time cache was populated, and runs cheaply on every delta
 * sync so historical data converges without requiring a full rebuild.
 *
 * @param {Array|Iterable} actors  - array/iterable of actor objects (each has a .votes array)
 * @param {Object} proposalInfoObj - keyed by proposalId, each entry has .submittedAtUnix
 */
function backfillVoteTimestampsFromCache(actors, proposalInfoObj) {
  const pi = proposalInfoObj && typeof proposalInfoObj === "object" ? proposalInfoObj : {};
  let patched = 0;
  for (const actor of (actors || [])) {
    for (const vote of (actor.votes || [])) {
      // Skip if already populated.
      if (vote.votedAtUnix && Number(vote.votedAtUnix) > 0) continue;
      if (!vote.voteTxHash) continue;
      const cached = voteTxTimeCache[vote.voteTxHash];
      if (!cached || Number(cached) <= 0) continue;
      const votedAt = Number(cached);
      vote.votedAtUnix = votedAt;
      vote.votedAt = new Date(votedAt * 1000).toISOString();
      const submittedAt = Number(pi[vote.proposalId]?.submittedAtUnix || 0);
      if (submittedAt > 0 && votedAt >= submittedAt) {
        vote.responseHours = (votedAt - submittedAt) / 3600;
      }
      patched++;
    }
  }
  return patched;
}

function buildThresholdContext(epochParams) {
  if (!epochParams || typeof epochParams !== "object") return {};
  return {
    drep: {
      motionNoConfidence: toPercentMaybe(epochParams.dvt_motion_no_confidence),
      committeeNormal: toPercentMaybe(epochParams.dvt_committee_normal),
      committeeNoConfidence: toPercentMaybe(epochParams.dvt_committee_no_confidence),
      updateToConstitution: toPercentMaybe(epochParams.dvt_update_to_constitution),
      hardForkInitiation: toPercentMaybe(epochParams.dvt_hard_fork_initiation),
      networkGroup: toPercentMaybe(epochParams.dvt_p_p_network_group),
      economicGroup: toPercentMaybe(epochParams.dvt_p_p_economic_group),
      technicalGroup: toPercentMaybe(epochParams.dvt_p_p_technical_group),
      govGroup: toPercentMaybe(epochParams.dvt_p_p_gov_group),
      treasuryWithdrawal: toPercentMaybe(epochParams.dvt_treasury_withdrawal)
    },
    pool: {
      motionNoConfidence: toPercentMaybe(epochParams.pvt_motion_no_confidence),
      committeeNormal: toPercentMaybe(epochParams.pvt_committee_normal),
      committeeNoConfidence: toPercentMaybe(epochParams.pvt_committee_no_confidence),
      hardForkInitiation: toPercentMaybe(epochParams.pvt_hard_fork_initiation),
      securityGroup: toPercentMaybe(epochParams.pvt_p_p_security_group || epochParams.pvtpp_security_group)
    },
    committeeMinSize: Number(epochParams.committee_min_size || 0) || null
  };
}

function inferParameterGroup(governanceDescription) {
  const updateObject = governanceDescription?.contents?.[1];
  if (!updateObject || typeof updateObject !== "object") return null;
  // Use the first changed parameter key to determine the primary DRep group.
  const key = Object.keys(updateObject)[0] || "";
  if (!key) return null;
  const k = key.toLowerCase();
  // Network group: block/tx size limits, execution unit limits, value size, collateral.
  // Must check maxblock/maxtx BEFORE the broad "ex" Technical check below so that
  // maxBlockExecutionUnits and maxTxExecutionUnits land in Network, not Technical.
  if (
    k.startsWith("maxblock") ||
    k.startsWith("maxtx") ||
    k.includes("maxvaluesize") ||
    k.includes("maxcollateral") ||
    k.includes("refscript")
  ) {
    return "Network";
  }
  // Economic group: fees, deposits, UTxO cost, treasury, monetary policy.
  if (
    k.includes("minfee") ||
    k.includes("keydeposit") ||
    k.includes("pooldeposit") ||
    k.includes("coinsperutxo") ||
    k.includes("treasury") ||
    k.includes("monetaryexpansion") ||
    k.includes("poolpledge") ||
    k.includes("poolretire") ||
    k.includes("poolmargin")
  ) {
    return "Economic";
  }
  // Technical group: cost models, script execution prices.
  if (
    k.includes("costmodel") ||
    k.includes("pricemem") ||
    k.includes("pricestep") ||
    k.includes("ex")
  ) {
    return "Technical";
  }
  // Governance group: committee size/terms, DRep thresholds, governance action params.
  if (
    k.includes("committee") ||
    k.includes("govaction") ||
    k.includes("drep")
  ) {
    return "Governance";
  }
  return null;
}

/**
 * Returns true if ANY parameter being changed in this proposal belongs to
 * the Conway "security group" — i.e. requires SPO approval in addition to
 * DRep approval.  Security-group parameters are those whose misconfiguration
 * could directly threaten network liveness.
 * Ref: CIP-1694 / Conway ledger spec pvt_p_p_security_group.
 */
function requiresSecurityGroupVote(governanceDescription) {
  try {
    const updateObject = governanceDescription?.contents?.[1];
    if (!updateObject || typeof updateObject !== "object") return false;
    return Object.keys(updateObject).some((key) => {
      const k = key.toLowerCase();
      return (
        k.startsWith("maxblockbody") ||       // maxBlockBodySize
        k.startsWith("maxblockheader") ||      // maxBlockHeaderSize
        k.startsWith("maxtxsize") ||           // maxTxSize
        k.startsWith("maxvaluesize") ||        // maxValueSize
        k.startsWith("maxblockexecution") ||   // maxBlockExecutionUnits
        k.startsWith("maxtxexecution") ||      // maxTxExecutionUnits
        k.startsWith("maxcollateral") ||       // maxCollateralInputs
        k.startsWith("minfee") ||              // minFeeA, minFeeB, minFeeRefScriptCostPerByte
        k.startsWith("coinsperutxo") ||        // coinsPerUTxOByte
        k.startsWith("txfeeperbyte") ||        // alternative field name for minFeeA
        k.startsWith("txfeefixed")             // alternative field name for minFeeB
      );
    });
  } catch (e) {
    return false;
  }
}

function resolveThresholdInfo(governanceType, governanceDescription, thresholdContext) {
  // Normalise: handle both Blockfrost snake_case ("treasury_withdrawals") and
  // the human-readable titleCase stored in the snapshot ("Treasury withdrawals").
  const type = String(governanceType || "").toLowerCase().replace(/\s+/g, "_");
  // CC threshold: 2/3 of committee members must vote Constitutional
  // Currently 7 members, so 5/7 ≈ 66.67% required
  const CC_THRESHOLD = 66.67;
  const info = {
    drepRequiredPct: null,
    poolRequiredPct: null,
    ccRequiredPct: null,
    parameterGroup: null,
    thresholdLabel: ""
  };

  if (type === "hard_fork_initiation") {
    info.drepRequiredPct = thresholdContext?.drep?.hardForkInitiation ?? null;
    info.poolRequiredPct = thresholdContext?.pool?.hardForkInitiation ?? null;
    info.ccRequiredPct = CC_THRESHOLD;
    info.thresholdLabel = "Hard-fork thresholds";
    return info;
  }
  if (type === "new_committee") {
    // CC does not vote on proposals that change the committee itself
    info.drepRequiredPct = thresholdContext?.drep?.committeeNormal ?? null;
    info.poolRequiredPct = thresholdContext?.pool?.committeeNormal ?? null;
    info.ccRequiredPct = null;
    info.thresholdLabel = "Committee election thresholds";
    return info;
  }
  if (type === "new_constitution") {
    // SPO vote is NOT required for constitution changes
    info.drepRequiredPct = thresholdContext?.drep?.updateToConstitution ?? null;
    info.poolRequiredPct = null;
    info.ccRequiredPct = CC_THRESHOLD;
    info.thresholdLabel = "Constitution update thresholds";
    return info;
  }
  if (type === "treasury_withdrawals") {
    // SPO vote is NOT required for treasury withdrawals
    info.drepRequiredPct = thresholdContext?.drep?.treasuryWithdrawal ?? null;
    info.poolRequiredPct = null;
    info.ccRequiredPct = CC_THRESHOLD;
    info.thresholdLabel = "Treasury withdrawal thresholds";
    return info;
  }
  if (type === "no_confidence") {
    // CC does not vote on no-confidence motions against themselves
    info.drepRequiredPct = thresholdContext?.drep?.motionNoConfidence ?? null;
    info.poolRequiredPct = thresholdContext?.pool?.motionNoConfidence ?? null;
    info.ccRequiredPct = null;
    info.thresholdLabel = "No-confidence thresholds";
    return info;
  }
  if (type === "parameter_change") {
    const group = inferParameterGroup(governanceDescription);
    info.parameterGroup = group;
    info.ccRequiredPct = CC_THRESHOLD;
    if (group === "Network") info.drepRequiredPct = thresholdContext?.drep?.networkGroup ?? null;
    if (group === "Economic") info.drepRequiredPct = thresholdContext?.drep?.economicGroup ?? null;
    if (group === "Technical") info.drepRequiredPct = thresholdContext?.drep?.technicalGroup ?? null;
    if (group === "Governance") info.drepRequiredPct = thresholdContext?.drep?.govGroup ?? null;
    // SPO votes are required only for Conway security-group parameters
    // (network liveness params like max sizes, execution limits, fee coefficients).
    // Governance-group changes (e.g. committeeMinSize) do NOT require SPO votes.
    if (requiresSecurityGroupVote(governanceDescription)) {
      info.poolRequiredPct = thresholdContext?.pool?.securityGroup ?? null;
    }
    info.thresholdLabel = group ? `Parameter change (${group}) thresholds` : "Parameter change thresholds";
    return info;
  }

  if (type === "info_action") {
    info.thresholdLabel = "Informational action";
    return info;
  }

  info.thresholdLabel = "Governance thresholds";
  return info;
}

function tallyVotesByRole(votes) {
  const base = () => ({
    yes: 0,
    no: 0,
    abstain: 0,
    noConfidence: 0,
    other: 0,
    total: 0
  });
  const byRole = {
    drep: base(),
    constitutional_committee: base(),
    stake_pool: base(),
    other: base()
  };

  for (const vote of votes) {
    const normalizedRole = normalizeVoteRole(vote.voter_role);
    const role = byRole[normalizedRole] ? normalizedRole : "other";
    const bucket = byRole[role];
    const v = String(vote.vote || "").toLowerCase();
    if (v === "yes") bucket.yes += 1;
    else if (v === "no") bucket.no += 1;
    else if (v === "abstain") bucket.abstain += 1;
    else if (v.includes("no_confidence")) bucket.noConfidence += 1;
    else bucket.other += 1;
    bucket.total += 1;
  }

  return byRole;
}

function addVoteToRoleBucket(bucket, voteValue) {
  const v = String(voteValue || "").toLowerCase();
  if (v === "yes") bucket.yes += 1;
  else if (v === "no") bucket.no += 1;
  else if (v === "abstain") bucket.abstain += 1;
  else if (v.includes("no_confidence")) bucket.noConfidence += 1;
  else bucket.other += 1;
  bucket.total += 1;
}

function buildProposalVoteStatsFromActorMaps(proposalId, drepById, ccById, spoById) {
  const base = () => ({
    yes: 0,
    no: 0,
    abstain: 0,
    noConfidence: 0,
    other: 0,
    total: 0
  });

  const byRole = {
    drep: base(),
    constitutional_committee: base(),
    stake_pool: base(),
    other: base()
  };

  for (const drep of drepById.values()) {
    const vote = (drep?.votes || []).find((v) => String(v?.proposalId || "") === proposalId);
    if (vote) addVoteToRoleBucket(byRole.drep, vote.vote);
  }
  for (const member of ccById.values()) {
    const vote = (member?.votes || []).find((v) => String(v?.proposalId || "") === proposalId);
    if (vote) addVoteToRoleBucket(byRole.constitutional_committee, vote.vote);
  }
  for (const pool of spoById.values()) {
    const vote = (pool?.votes || []).find((v) => String(v?.proposalId || "") === proposalId);
    if (vote) addVoteToRoleBucket(byRole.stake_pool, vote.vote);
  }

  return byRole;
}

function upsertActorVoteByProposal(votes, nextVote) {
  if (!Array.isArray(votes) || !nextVote || !nextVote.proposalId) return;
  const idx = votes.findIndex((v) => String(v?.proposalId || "") === String(nextVote.proposalId));
  if (idx < 0) {
    votes.push(nextVote);
    return;
  }
  const existing = votes[idx] || {};
  const existingTs = Number(existing.votedAtUnix || 0);
  const nextTs = Number(nextVote.votedAtUnix || 0);
  if (nextTs > existingTs) {
    votes[idx] = nextVote;
    return;
  }
  if (nextTs === existingTs) {
    const existingHash = String(existing.voteTxHash || "").toLowerCase();
    const nextHash = String(nextVote.voteTxHash || "").toLowerCase();
    if (nextHash && nextHash !== existingHash) votes[idx] = nextVote;
  }
}

function toInt(value) {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toBigInt(value) {
  if (value === null || value === undefined || value === "") return 0n;
  if (typeof value === "bigint") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return 0n;
    return BigInt(Math.trunc(value));
  }
  const asString = String(value).trim();
  if (!asString) return 0n;
  try {
    return BigInt(asString);
  } catch {
    return 0n;
  }
}

function pct2BigInt(numerator, denominator) {
  if (denominator <= 0n) return null;
  return Number((numerator * 10000n) / denominator) / 100;
}

function toFixedPct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return round2(n);
}

function fromLovelace(value) {
  return Math.round((Number(toBigInt(value)) / 1_000_000) * 100) / 100;
}

function buildNomosModelFromKoiosSummary(summary) {
  if (!summary || typeof summary !== "object") return null;

  const proposalType = String(summary.proposal_type || "");
  const isNoConfidence = proposalType === "NoConfidence";
  const epochNo = toInt(summary.epoch_no);
  const useNewSpoFormula = epochNo >= 534;
  const isHardForkInitiation = proposalType === "HardForkInitiation";

  const drepActiveYes = toBigInt(summary.drep_active_yes_vote_power);
  const drepActiveNo = toBigInt(summary.drep_active_no_vote_power);
  const drepActiveAbstain = toBigInt(summary.drep_active_abstain_vote_power);
  const drepAlwaysAbstain = toBigInt(summary.drep_always_abstain_vote_power);
  const drepAlwaysNoConfidence = toBigInt(summary.drep_always_no_confidence_vote_power);
  const drepTotalRaw = toBigInt(summary.drep_total_vote_power);
  const drepInactive = toBigInt(summary.drep_inactive_vote_power);
  const drepDerivedTotal =
    drepTotalRaw > 0n
      ? drepTotalRaw
      : drepActiveYes + drepActiveNo + drepActiveAbstain + drepAlwaysAbstain + drepAlwaysNoConfidence + drepInactive;

  const drepNotVotedRaw =
    drepDerivedTotal -
    drepActiveYes -
    drepActiveNo -
    drepActiveAbstain -
    drepAlwaysAbstain -
    drepAlwaysNoConfidence -
    drepInactive;
  const drepNotVoted = drepNotVotedRaw > 0n ? drepNotVotedRaw : 0n;
  const drepYesTotal = isNoConfidence ? drepActiveYes + drepAlwaysNoConfidence : drepActiveYes;
  const drepNoTotal = isNoConfidence ? drepActiveNo + drepNotVoted : drepActiveNo + drepAlwaysNoConfidence + drepNotVoted;
  const drepAbstainTotal = drepActiveAbstain + drepAlwaysAbstain;
  const drepOutcomeDenominator = drepYesTotal + drepNoTotal;
  const drepDistributionDenominator = drepDerivedTotal - drepInactive;
  const drepYesPct = pct2BigInt(drepYesTotal, drepOutcomeDenominator);
  const drepNoPct = pct2BigInt(drepNoTotal, drepOutcomeDenominator);
  const drepAbstainPct = pct2BigInt(drepAbstainTotal, drepDistributionDenominator);
  const drepNotVotedPct = pct2BigInt(drepNotVoted, drepDistributionDenominator);

  const spoActiveYes = toBigInt(summary.pool_active_yes_vote_power);
  const spoActiveNo = toBigInt(summary.pool_active_no_vote_power);
  const spoActiveAbstain = toBigInt(summary.pool_active_abstain_vote_power);
  const spoAlwaysAbstain = toBigInt(summary.pool_passive_always_abstain_vote_power);
  const spoAlwaysNoConfidence = toBigInt(summary.pool_passive_always_no_confidence_vote_power);
  const spoNoVotePower = toBigInt(summary.pool_no_vote_power);
  const spoStoredTotal = toBigInt(summary.pool_total_vote_power);
  const hasKoiosNoVotePower = summary.pool_no_vote_power !== null && summary.pool_no_vote_power !== undefined;
  const spoNotVotedFromKoiosRaw = hasKoiosNoVotePower
    ? spoNoVotePower - spoActiveNo - spoAlwaysNoConfidence
    : spoStoredTotal - spoActiveYes - spoActiveNo - spoActiveAbstain - spoAlwaysAbstain - spoAlwaysNoConfidence;
  const spoNotVoted = spoNotVotedFromKoiosRaw > 0n ? spoNotVotedFromKoiosRaw : 0n;
  const spoEffectiveTotal =
    hasKoiosNoVotePower
      ? spoActiveYes + spoNoVotePower + spoActiveAbstain + spoAlwaysAbstain
      : spoStoredTotal;

  let spoYesTotal = 0n;
  let spoNoTotal = 0n;
  let spoAbstainTotal = 0n;
  let spoOutcomeDenominator = 0n;

  if (useNewSpoFormula) {
    let spoNotVotedCalc = spoNotVoted;
    if (isHardForkInitiation) {
      spoYesTotal = spoActiveYes;
      spoAbstainTotal = spoActiveAbstain;
      spoNotVotedCalc = spoNotVoted + spoAlwaysNoConfidence + spoAlwaysAbstain;
    } else if (isNoConfidence) {
      spoYesTotal = spoActiveYes + spoAlwaysNoConfidence;
      spoAbstainTotal = spoActiveAbstain + spoAlwaysAbstain;
    } else {
      spoYesTotal = spoActiveYes;
      spoAbstainTotal = spoActiveAbstain + spoAlwaysAbstain;
    }
    spoNoTotal = spoActiveNo + spoNotVotedCalc;
    spoOutcomeDenominator = spoEffectiveTotal - spoAbstainTotal;
  } else {
    spoYesTotal = spoActiveYes;
    spoNoTotal = spoActiveNo + spoAlwaysNoConfidence;
    spoAbstainTotal = spoActiveAbstain + spoAlwaysAbstain;
    spoOutcomeDenominator = spoActiveYes + spoActiveNo + spoAlwaysNoConfidence;
  }

  const spoYesPct = pct2BigInt(spoYesTotal, spoOutcomeDenominator);
  const spoNoPct = pct2BigInt(spoNoTotal, spoOutcomeDenominator);
  const spoAbstainPct = pct2BigInt(spoAbstainTotal, spoEffectiveTotal);
  const spoNotVotedPct = pct2BigInt(spoNotVoted, spoEffectiveTotal);

  const ccYes = toInt(summary.committee_yes_votes_cast);
  const ccNo = toInt(summary.committee_no_votes_cast);
  const ccAbstain = toInt(summary.committee_abstain_votes_cast);

  return {
    source: "koios_proposal_voting_summary",
    proposalType,
    formula: {
      drep: isNoConfidence ? "no-confidence" : "standard",
      spo: useNewSpoFormula ? `new-${isHardForkInitiation ? "hardfork" : isNoConfidence ? "no-confidence" : "standard"}` : "legacy"
    },
    drep: {
      model: isNoConfidence ? "nomos-no-confidence" : "nomos-standard",
      yesPct: drepYesPct,
      noPct: drepNoPct,
      abstainPct: drepAbstainPct,
      notVotedPct: drepNotVotedPct,
      yesLovelace: drepYesTotal.toString(),
      noLovelace: drepNoTotal.toString(),
      abstainLovelace: drepAbstainTotal.toString(),
      notVotedLovelace: drepNotVoted.toString(),
      activeYesLovelace: drepActiveYes.toString(),
      activeNoLovelace: drepActiveNo.toString(),
      activeAbstainLovelace: drepActiveAbstain.toString(),
      alwaysAbstainLovelace: drepAlwaysAbstain.toString(),
      alwaysNoConfidenceLovelace: drepAlwaysNoConfidence.toString(),
      inactiveLovelace: drepInactive.toString(),
      derivedTotalLovelace: drepDerivedTotal.toString()
    },
    spo: {
      yesPct: spoYesPct,
      noPct: spoNoPct,
      abstainPct: spoAbstainPct,
      notVotedPct: spoNotVotedPct,
      yesLovelace: spoYesTotal.toString(),
      noLovelace: spoNoTotal.toString(),
      abstainLovelace: spoAbstainTotal.toString(),
      notVotedLovelace: spoNotVoted.toString(),
      activeYesLovelace: spoActiveYes.toString(),
      activeNoLovelace: spoActiveNo.toString(),
      activeAbstainLovelace: spoActiveAbstain.toString(),
      alwaysAbstainLovelace: spoAlwaysAbstain.toString(),
      alwaysNoConfidenceLovelace: spoAlwaysNoConfidence.toString(),
      poolNoVotePowerLovelace: spoNoVotePower.toString(),
      effectiveTotalLovelace: spoEffectiveTotal.toString()
    },
    cc: {
      yesCount: ccYes,
      noCount: ccNo,
      abstainCount: ccAbstain,
      yesPct: toFixedPct(summary.committee_yes_pct),
      noPct: toFixedPct(summary.committee_no_pct)
    },
    friendly: {
      drepYesAda: fromLovelace(drepYesTotal),
      drepNoAda: fromLovelace(drepNoTotal),
      drepAbstainAda: fromLovelace(drepAbstainTotal),
      drepNotVotedAda: fromLovelace(drepNotVoted),
      spoYesAda: fromLovelace(spoYesTotal),
      spoNoAda: fromLovelace(spoNoTotal),
      spoAbstainAda: fromLovelace(spoAbstainTotal),
      spoNotVotedAda: fromLovelace(spoNotVoted)
    }
  };
}

async function blockfrostGet(endpointWithQuery) {
  for (let attempt = 0; attempt <= BLOCKFROST_MAX_RETRIES; attempt += 1) {
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < BLOCKFROST_REQUEST_DELAY_MS) {
      await sleep(BLOCKFROST_REQUEST_DELAY_MS - elapsed);
    }
    lastRequestAt = Date.now();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), BLOCKFROST_REQUEST_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(`${BLOCKFROST_BASE_URL}${endpointWithQuery}`, {
        headers: { project_id: BLOCKFROST_API_KEY },
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.ok) return response.json();

    const body = await response.text();
    const status = response.status;
    const isRetryable = status === 429 || status >= 500;
    if (isRetryable && attempt < BLOCKFROST_MAX_RETRIES) {
      const waitMs = Math.min(5000, 800 * (attempt + 1));
      await sleep(waitMs);
      continue;
    }
    throw new Error(`Blockfrost ${status} on ${endpointWithQuery}: ${body}`);
  }
  throw new Error(`Blockfrost retry overflow on ${endpointWithQuery}`);
}

async function koiosGet(endpointWithQuery) {
  for (let attempt = 0; attempt <= KOIOS_MAX_RETRIES; attempt += 1) {
    const elapsed = Date.now() - lastKoiosRequestAt;
    if (elapsed < KOIOS_REQUEST_DELAY_MS) {
      await sleep(KOIOS_REQUEST_DELAY_MS - elapsed);
    }
    lastKoiosRequestAt = Date.now();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), KOIOS_REQUEST_TIMEOUT_MS);
    let response;
    try {
      const headers = {
        "Content-Type": "application/json"
      };
      if (KOIOS_API_KEY) headers.Authorization = `Bearer ${KOIOS_API_KEY}`;
      response = await fetch(`${KOIOS_BASE_URL}${endpointWithQuery}`, {
        headers,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.ok) return response.json();

    const body = await response.text();
    const status = response.status;
    const isRetryable = status === 429 || status >= 500;
    if (isRetryable && attempt < KOIOS_MAX_RETRIES) {
      const waitMs = Math.min(10000, 1200 * (attempt + 1));
      await sleep(waitMs);
      continue;
    }
    throw new Error(`Koios ${status} on ${endpointWithQuery}: ${body}`);
  }
  throw new Error(`Koios retry overflow on ${endpointWithQuery}`);
}

async function koiosPost(endpointWithQuery, body = {}) {
  for (let attempt = 0; attempt <= KOIOS_MAX_RETRIES; attempt += 1) {
    const elapsed = Date.now() - lastKoiosRequestAt;
    if (elapsed < KOIOS_REQUEST_DELAY_MS) {
      await sleep(KOIOS_REQUEST_DELAY_MS - elapsed);
    }
    lastKoiosRequestAt = Date.now();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), KOIOS_REQUEST_TIMEOUT_MS);
    let response;
    try {
      const headers = {
        "Content-Type": "application/json"
      };
      if (KOIOS_API_KEY) headers.Authorization = `Bearer ${KOIOS_API_KEY}`;
      response = await fetch(`${KOIOS_BASE_URL}${endpointWithQuery}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body || {}),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.ok) return response.json();

    const bodyText = await response.text();
    const status = response.status;
    const isRetryable = status === 429 || status >= 500;
    if (isRetryable && attempt < KOIOS_MAX_RETRIES) {
      const waitMs = Math.min(10000, 1200 * (attempt + 1));
      await sleep(waitMs);
      continue;
    }
    throw new Error(`Koios ${status} on POST ${endpointWithQuery}: ${bodyText}`);
  }
  throw new Error(`Koios retry overflow on POST ${endpointWithQuery}`);
}

async function fetchRegisteredSpoFallback(limit = 300) {
  const rows = [];
  const pageSize = 100;
  let offset = 0;
  while (rows.length < limit) {
    const batch = await koiosPost(`/pool_list?offset=${offset}&limit=${pageSize}`, {}).catch(() => []);
    if (!Array.isArray(batch) || batch.length === 0) break;
    rows.push(...batch);
    if (batch.length < pageSize) break;
    offset += batch.length;
  }
  return rows.slice(0, limit);
}

async function fetchBlockfrostPoolFallbackRows(limit = 400) {
  const boundedLimit = Number(limit) > 0 ? Number(limit) : 0;
  if (!BLOCKFROST_API_KEY) return [];
  const rows = [];
  let page = 1;
  const pageSize = 100;
  while (boundedLimit <= 0 || rows.length < boundedLimit) {
    let poolRows = [];
    let loaded = false;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        poolRows = await blockfrostGet(`/pools/extended?page=${page}&count=${pageSize}&order=desc`);
        loaded = true;
        break;
      } catch {
        await sleep(Math.min(15000, 800 * (attempt + 1)));
      }
    }
    if (!loaded) break;
    if (!Array.isArray(poolRows) || poolRows.length === 0) break;
    for (const pool of poolRows) {
      const id = String(pool?.pool_id || "").trim();
      if (!id) continue;
      const metadata = pool?.metadata && typeof pool.metadata === "object" ? pool.metadata : {};
      const cached = spoProfileCache.byPool[id] || {};
      const drepRaw = String(cached?.delegatedDrepLiteralRaw || cached?.drepId || "").trim();
      const drepNorm = normalizeLiteral(drepRaw);
      const liveStakeAda = Number(pool?.live_stake || 0) / 1_000_000;
      const activeStakeAda = Number(pool?.active_stake || 0) / 1_000_000;
      const power = Number.isFinite(liveStakeAda) && liveStakeAda > 0 ? liveStakeAda : activeStakeAda;
      rows.push({
        id,
        name: String(metadata?.ticker || metadata?.name || "").trim(),
        homepage: String(metadata?.homepage || metadata?.url || "").trim(),
        status: "registered",
        delegatedDrepLiteralRaw: drepRaw,
        delegatedDrepLiteral: drepNorm,
        delegationStatus: drepRaw ? classifySpoDelegationStatus(drepNorm) : "Unknown",
        transparencyScore: null,
        consistency: 0,
        totalEligibleVotes: 0,
        firstVoteBlockTime: Number.MAX_SAFE_INTEGER,
        votingPowerAda: Number.isFinite(power) ? Math.max(0, power) : 0,
        votes: []
      });
      if (boundedLimit > 0 && rows.length >= boundedLimit) break;
    }
    if (poolRows.length < pageSize) break;
    page += 1;
  }
  queueSpoProfileRefresh(rows.map((row) => row.id));
  return rows;
}

async function fetchSpoGovernanceFallbackRows(limit = 400) {
  const boundedLimit = Number(limit) > 0 ? Number(limit) : 0;
  const now = Date.now();
  if (spoFallbackCache.rows.length > 0 && now - spoFallbackCache.fetchedAt < 15 * 60 * 1000) {
    const cachedRows = boundedLimit > 0 ? spoFallbackCache.rows.slice(0, boundedLimit) : spoFallbackCache.rows;
    const hasMetadata = cachedRows.some(
      (row) => String(row?.name || "").trim() || String(row?.homepage || "").trim() || Number(row?.votingPowerAda || 0) > 0
    );
    if (hasMetadata) {
      if (boundedLimit > 0) return cachedRows;
      // If caller requests uncapped roster, avoid reusing obviously truncated cache.
      if (spoFallbackCache.rows.length >= 1000) return spoFallbackCache.rows;
    }
  }
  const rows = await fetchBlockfrostPoolFallbackRows(boundedLimit);
  const finalRows = boundedLimit > 0 ? rows.slice(0, boundedLimit) : rows;

  spoFallbackCache = { fetchedAt: now, rows: finalRows };
  return finalRows;
}

function extractAmountFromActionNameLovelace(actionName) {
  const raw = String(actionName || "").trim();
  if (!raw) return 0;
  const m = raw.match(/[₳]\s*([0-9][0-9,]*(?:\.[0-9]+)?)(?:\s*([mMbB]))?/);
  if (!m) return 0;
  const base = Number(String(m[1] || "").replace(/,/g, ""));
  if (!Number.isFinite(base) || base <= 0) return 0;
  const suffix = String(m[2] || "").toLowerCase();
  let ada = base;
  if (suffix === "m") ada = base * 1_000_000;
  if (suffix === "b") ada = base * 1_000_000_000;
  return Math.round(ada * 1_000_000);
}

function extractTreasuryWithdrawalLovelaceFromProposal(info) {
  if (!info || typeof info !== "object") return 0;
  let total = 0;

  const metadata = info.metadataJson && typeof info.metadataJson === "object" ? info.metadataJson : null;
  const metadataWithdrawals = metadata?.body?.onChain?.withdrawals;
  if (Array.isArray(metadataWithdrawals)) {
    for (const row of metadataWithdrawals) {
      const amount = Number(row?.withdrawalAmount || 0);
      if (Number.isFinite(amount) && amount > 0) total += amount;
    }
  }

  if (total <= 0) {
    const gov = info.governanceDescription;
    const entries = Array.isArray(gov?.contents?.[0]) ? gov.contents[0] : [];
    for (const item of entries) {
      const amount = Number(Array.isArray(item) ? item[1] : 0);
      if (Number.isFinite(amount) && amount > 0) total += amount;
    }
  }

  if (total <= 0) total = extractAmountFromActionNameLovelace(info.actionName);
  return Number.isFinite(total) && total > 0 ? Math.round(total) : 0;
}

function loadNclCacheFromDisk() {
  if (!fs.existsSync(NCL_SNAPSHOT_PATH)) return;
  try {
    const parsed = JSON.parse(fs.readFileSync(NCL_SNAPSHOT_PATH, "utf8"));
    if (!parsed || typeof parsed !== "object") return;
    const fetchedAt = Number(parsed?.fetchedAt || 0);
    const byPeriod = parsed?.byPeriod && typeof parsed.byPeriod === "object" ? parsed.byPeriod : {};
    nclCache = {
      fetchedAt: Number.isFinite(fetchedAt) && fetchedAt > 0 ? fetchedAt : 0,
      byPeriod
    };
  } catch (error) {
    syncState.lastError = `Failed to read NCL snapshot: ${error.message}`;
  }
}

function saveNclCacheToDisk() {
  try {
    fs.writeFileSync(
      NCL_SNAPSHOT_PATH,
      JSON.stringify({
        schemaVersion: SNAPSHOT_SCHEMA_VERSION,
        fetchedAt: Number(nclCache.fetchedAt || 0),
        byPeriod: nclCache.byPeriod || {}
      })
    );
  } catch (error) {
    syncState.lastError = `Failed to write NCL snapshot: ${error.message}`;
  }
}

async function buildNclSummary(period) {
  const sourceSnapshot = pickBestSnapshotForApi(snapshot);
  const proposalInfo =
    sourceSnapshot?.proposalInfo && typeof sourceSnapshot.proposalInfo === "object"
      ? sourceSnapshot.proposalInfo
      : {};

  const withdrawals = Object.entries(proposalInfo)
    .map(([proposalId, info]) => ({ proposalId, info: info || {} }))
    .filter(({ info }) => {
      const governanceType = String(info?.governanceType || "").toLowerCase();
      const enactedEpoch = Number(info?.enactedEpoch || 0);
      return governanceType.includes("treasury") &&
        Number.isFinite(enactedEpoch) &&
        enactedEpoch >= period.startEpoch &&
        enactedEpoch <= period.endEpoch;
    })
    .map(({ proposalId, info }) => {
      const amountLovelace = extractTreasuryWithdrawalLovelaceFromProposal(info);
      return {
        proposalId: String(proposalId || ""),
        ratifiedEpoch: Number(info?.ratifiedEpoch || 0),
        enactedEpoch: Number(info?.enactedEpoch || 0),
        amountLovelace,
        amountAda: amountLovelace / 1_000_000,
        metaUrl: String(info?.metadataUrl || "").trim(),
        title: String(info?.actionName || "").trim() || "Untitled Proposal"
      };
    })
    .filter((row) => Number(row.amountLovelace || 0) > 0)
    .sort((a, b) => {
      const ea = Number(a?.enactedEpoch || 0);
      const eb = Number(b?.enactedEpoch || 0);
      if (eb !== ea) return eb - ea;
      return Number(b?.amountLovelace || 0) - Number(a?.amountLovelace || 0);
    });

  const totalLovelace = withdrawals.reduce((sum, row) => sum + Number(row.amountLovelace || 0), 0);
  const totalAda = totalLovelace / 1_000_000;
  const limitAda = Number(period.limitAda || 0);
  const limitLovelace = Math.round(limitAda * 1_000_000);
  const remainingLovelace = limitLovelace - totalLovelace;
  const remainingAda = remainingLovelace / 1_000_000;
  const usagePct = limitLovelace > 0 ? (totalLovelace / limitLovelace) * 100 : 0;

  const summary = {
    dataSource: NCL_DATA_SOURCE,
    snapshotGeneratedAt: sourceSnapshot?.generatedAt || null,
    period,
    totals: {
      withdrawnLovelace: totalLovelace,
      withdrawnAda: totalAda,
      limitLovelace,
      limitAda,
      remainingLovelace,
      remainingAda,
      usagePct
    },
    withdrawals
  };

  return summary;
}

async function fetchNclSummary(periodKey = "current", options = {}) {
  const period = NCL_PERIODS[periodKey] || NCL_PERIODS.current;
  const now = Date.now();
  const staleMs = 10 * 60 * 1000;
  const allowStale = options.allowStale !== false;
  const refreshInBackground = options.refreshInBackground !== false;
  const cached = nclCache.byPeriod[period.key];
  const isFresh = cached && now - Number(nclCache.fetchedAt || 0) < staleMs;
  const isCurrentVersion = String(cached?.dataSource || "") === NCL_DATA_SOURCE;
  if (isFresh && isCurrentVersion) return cached;
  if (cached && allowStale && isCurrentVersion) {
    if (refreshInBackground && !nclRefreshPromises[period.key]) {
      nclRefreshPromises[period.key] = buildNclSummary(period)
        .then((summary) => {
          nclCache.byPeriod[period.key] = summary;
          nclCache.fetchedAt = Date.now();
          saveNclCacheToDisk();
          return summary;
        })
        .catch(() => null)
        .finally(() => {
          delete nclRefreshPromises[period.key];
        });
    }
    return cached;
  }

  if (!nclRefreshPromises[period.key]) {
    nclRefreshPromises[period.key] = buildNclSummary(period)
      .then((summary) => {
        nclCache.byPeriod[period.key] = summary;
        nclCache.fetchedAt = Date.now();
        saveNclCacheToDisk();
        return summary;
      })
      .finally(() => {
        delete nclRefreshPromises[period.key];
      });
  }
  return nclRefreshPromises[period.key];
}

async function paginate(endpoint, count, maxPages) {
  let page = 1;
  const output = [];
  while (page <= maxPages) {
    const query = `${endpoint}${endpoint.includes("?") ? "&" : "?"}count=${count}&page=${page}&order=desc`;
    const chunk = await blockfrostGet(query);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    output.push(...chunk);
    if (chunk.length < count) break;
    page += 1;
  }
  return output;
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let index = 0;
  async function worker() {
    while (true) {
      const current = index;
      index += 1;
      if (current >= items.length) return;
      results[current] = await mapper(items[current], current);
    }
  }
  const workers = [];
  for (let i = 0; i < Math.min(limit, items.length); i += 1) workers.push(worker());
  await Promise.all(workers);
  return results;
}

function loadSnapshotFromDisk() {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    const latestHistory = readLatestSnapshotFromHistory();
    if (latestHistory) {
      snapshot = {
        schemaVersion: SNAPSHOT_SCHEMA_VERSION,
        ...latestHistory
      };
    }
    return;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.dreps)) {
      snapshot = {
        schemaVersion: SNAPSHOT_SCHEMA_VERSION,
        ...parsed
      };
    }
    snapshot = pickBestSnapshotForApi(snapshot);
  } catch (error) {
    syncState.lastError = `Failed to read snapshot file: ${error.message}`;
    const latestHistory = readLatestSnapshotFromHistory();
    if (latestHistory) {
      snapshot = {
        schemaVersion: SNAPSHOT_SCHEMA_VERSION,
        ...latestHistory
      };
    }
  }
}

// Load the committed seed snapshot when no live snapshot is available.
// The seed is generated automatically every epoch by GitHub Actions so
// cold starts (ephemeral Render filesystem) never begin from empty.
function loadSeedSnapshot() {
  if (!fs.existsSync(SNAPSHOT_SEED_PATH)) return;
  try {
    const parsed = JSON.parse(fs.readFileSync(SNAPSHOT_SEED_PATH, "utf8"));
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.dreps)) return;
    snapshot = { schemaVersion: SNAPSHOT_SCHEMA_VERSION, ...parsed };
    console.log(`Loaded seed snapshot (epoch ${parsed.latestEpoch || "?"}, generated ${parsed.generatedAt || "unknown"})`);
  } catch (error) {
    console.warn(`Could not load seed snapshot: ${error.message}`);
  }
}

function ensureSnapshotHistoryDir() {
  if (!fs.existsSync(SNAPSHOT_HISTORY_DIR)) {
    fs.mkdirSync(SNAPSHOT_HISTORY_DIR, { recursive: true });
  }
}

function epochSnapshotFilename(epoch) {
  return `epoch-${Number(epoch)}.json`;
}

function listSnapshotHistoryFiles() {
  if (!fs.existsSync(SNAPSHOT_HISTORY_DIR)) return [];
  const files = fs.readdirSync(SNAPSHOT_HISTORY_DIR)
    .filter((name) => /^epoch-\d+\.json$/i.test(name))
    .map((name) => path.join(SNAPSHOT_HISTORY_DIR, name))
    .filter((full) => fs.existsSync(full))
    .map((full) => ({
      name: path.basename(full),
      fullPath: full,
      mtimeMs: fs.statSync(full).mtimeMs,
      epoch: Number((path.basename(full).match(/^epoch-(\d+)\.json$/i) || [])[1] || 0)
    }))
    .sort((a, b) => (b.epoch || 0) - (a.epoch || 0));
  return files;
}

function readSnapshotFromHistory(snapshotKey) {
  const key = String(snapshotKey || "").trim();
  if (!key || key.includes("..") || key.includes("/") || key.includes("\\")) return null;
  const fullPath = path.join(SNAPSHOT_HISTORY_DIR, key);
  if (!fs.existsSync(fullPath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.dreps)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function readLatestSnapshotFromHistory() {
  const files = listSnapshotHistoryFiles();
  for (const row of files) {
    const parsed = readSnapshotFromHistory(row.name);
    if (parsed) return parsed;
  }
  return null;
}

function snapshotHasGovernanceData(payload) {
  if (!payload || typeof payload !== "object") return false;
  const proposalCount = Object.keys(payload?.proposalInfo || {}).length;
  const drepCount = Array.isArray(payload?.dreps) ? payload.dreps.length : 0;
  const committeeCount = Array.isArray(payload?.committeeMembers) ? payload.committeeMembers.length : 0;
  return proposalCount > 0 && (drepCount > 0 || committeeCount > 0);
}

function snapshotHasDrepVotingPower(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload?.dreps)) return false;
  const total = payload.dreps.reduce((sum, row) => sum + Number(row?.votingPowerAda || 0), 0);
  return Number.isFinite(total) && total > 0;
}

function snapshotActiveCommitteeCount(payload) {
  const rows = Array.isArray(payload?.committeeMembers) ? payload.committeeMembers : [];
  return rows.filter((row) => String(row?.status || "").toLowerCase() === "active").length;
}

function snapshotIsComplete(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (!snapshotHasGovernanceData(payload)) return false;
  if (!snapshotHasDrepVotingPower(payload)) return false;
  if (Boolean(payload.partial)) return false;
  const skipped = Number(payload.skippedProposalCount || 0);
  const voteFetchErrors = Number(payload.voteFetchErrorCount || 0);
  if (skipped > 0 || voteFetchErrors > 0) return false;
  // Ensure proposalInfo is populated — if proposals exist but proposalInfo is
  // empty the snapshot was built by old code and needs a full rebuild.
  const proposalCount = Number(payload.proposalCount || 0);
  const proposalInfoCount = Object.keys(payload.proposalInfo || {}).length;
  if (proposalCount > 0 && proposalInfoCount < Math.floor(proposalCount * 0.5)) return false;
  return true;
}

function pickBestSnapshotForApi(primary) {
  const latestHistory = readLatestSnapshotFromHistory();
  if (!latestHistory) return primary;
  const primaryDrepCount = Array.isArray(primary?.dreps) ? primary.dreps.length : 0;
  const historyDrepCount = Array.isArray(latestHistory?.dreps) ? latestHistory.dreps.length : 0;
  const primaryActiveCc = snapshotActiveCommitteeCount(primary);
  const historyActiveCc = snapshotActiveCommitteeCount(latestHistory);
  const drepCoverageFloor = historyDrepCount > 0 ? Math.floor(historyDrepCount * 0.9) : 0;
  const primaryLooksGood =
    snapshotHasGovernanceData(primary) &&
    snapshotHasDrepVotingPower(primary) &&
    (historyDrepCount === 0 || primaryDrepCount >= drepCoverageFloor) &&
    (historyActiveCc === 0 || primaryActiveCc > 0);
  return primaryLooksGood ? primary : latestHistory;
}

function normalizeCommitteeMembersForApi(rows) {
  const input = Array.isArray(rows) ? rows : [];
  return input.map((row) => {
    const out = { ...row };
    if (!out.hotCredential) {
      const rowIdHex = String(out.id || "").trim().toLowerCase();
      const rowHotHex = String(out.hotHex || "").trim().toLowerCase();
      const mappedHot = CC_HOT_HEX_TO_HOT_CREDENTIAL[rowIdHex] || CC_HOT_HEX_TO_HOT_CREDENTIAL[rowHotHex] || "";
      if (mappedHot) out.hotCredential = mappedHot;
    }
    if (!out.coldCredential && out.hotCredential && CC_COLD_OVERRIDES_BY_HOT[out.hotCredential]) {
      out.coldCredential = CC_COLD_OVERRIDES_BY_HOT[out.hotCredential];
    }
    if (!out.name && out.hotCredential && CC_NAME_OVERRIDES_BY_HOT[out.hotCredential]) {
      out.name = CC_NAME_OVERRIDES_BY_HOT[out.hotCredential];
    }
    const hotKey = String(out.hotCredential || "").toLowerCase();
    const nameKey = String(out.name || "").trim().toLowerCase();
    const epochOverride = CC_EPOCH_OVERRIDES_BY_HOT[hotKey] || CC_EPOCH_OVERRIDES_BY_NAME[nameKey] || null;
    if (epochOverride) {
      if (!out.seatStartEpoch && Number.isFinite(Number(epochOverride.seatStartEpoch))) {
        out.seatStartEpoch = Number(epochOverride.seatStartEpoch);
      }
      if (!out.expirationEpoch && Number.isFinite(Number(epochOverride.expirationEpoch))) {
        out.expirationEpoch = Number(epochOverride.expirationEpoch);
      }
      if (!out.status && typeof epochOverride.status === "string" && epochOverride.status.trim()) {
        out.status = String(epochOverride.status).trim().toLowerCase();
      }
    }
    return out;
  });
}

function saveSnapshotToDisk(payload) {
  const withSchema = {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    ...payload
  };
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(withSchema));
}

async function enrichCommitteeRowsWithCgovRationale(rows, proposalInfo) {
  const committeeRows = Array.isArray(rows) ? rows : [];
  if (committeeRows.length === 0) return committeeRows;
  const infoById = proposalInfo && typeof proposalInfo === "object" ? proposalInfo : {};
  const proposalIds = new Set();
  for (const row of committeeRows) {
    for (const vote of Array.isArray(row?.votes) ? row.votes : []) {
      const proposalId = String(vote?.proposalId || "").trim();
      if (proposalId) proposalIds.add(proposalId);
    }
  }
  const lookupByProposal = new Map();
  for (const proposalId of proposalIds) {
    const meta = infoById[proposalId];
    const txHash = String(meta?.txHash || "").trim();
    const certIndex = Number(meta?.certIndex);
    if (!txHash || !Number.isInteger(certIndex) || certIndex < 0) continue;
    const lookup = await fetchCgovCommitteeVoteRationaleLookupForProposal(txHash, certIndex).catch(() => null);
    if (lookup instanceof Map && lookup.size > 0) lookupByProposal.set(proposalId, lookup);
  }
  if (lookupByProposal.size === 0) return committeeRows;
  return committeeRows.map((row) => {
    const voterCredential = String(row?.hotCredential || row?.id || "").trim().toLowerCase();
    const votes = Array.isArray(row?.votes) ? row.votes : [];
    const nextVotes = votes.map((vote) => {
      const proposalId = String(vote?.proposalId || "").trim();
      const lookup = lookupByProposal.get(proposalId);
      if (!lookup) return vote;
      const match = lookupCgovCommitteeVoteRationale(lookup, vote || {}, voterCredential);
      if (!match) return vote;
      return {
        ...vote,
        hasRationale: vote?.hasRationale === true ? true : Boolean(match.hasRationale),
        rationaleUrl: String(vote?.rationaleUrl || "").trim() || String(match.rationaleUrl || "").trim(),
        rationaleBodyLength: Math.max(Number(vote?.rationaleBodyLength || 0), Number(match.rationaleBodyLength || 0)),
        rationaleSectionCount: Math.max(Number(vote?.rationaleSectionCount || 0), Number(match.rationaleSectionCount || 0))
      };
    });
    return { ...row, votes: nextVotes };
  });
}

function loadVoteTxTimeCache() {
  if (!fs.existsSync(VOTE_TX_TIME_CACHE_PATH)) return;
  try {
    const parsed = JSON.parse(fs.readFileSync(VOTE_TX_TIME_CACHE_PATH, "utf8"));
    if (parsed && typeof parsed === "object") {
      voteTxTimeCache = parsed;
    }
  } catch (error) {
    syncState.lastError = `Failed to read tx time cache: ${error.message}`;
  }
}

function saveVoteTxTimeCache() {
  fs.writeFileSync(VOTE_TX_TIME_CACHE_PATH, JSON.stringify(voteTxTimeCache));
}

function loadVoteTxRationaleCache() {
  if (!fs.existsSync(VOTE_TX_RATIONALE_CACHE_PATH)) return;
  try {
    const parsed = JSON.parse(fs.readFileSync(VOTE_TX_RATIONALE_CACHE_PATH, "utf8"));
    if (parsed && typeof parsed === "object") {
      voteTxRationaleCache = parsed;
    }
  } catch (error) {
    syncState.lastError = `Failed to read tx rationale cache: ${error.message}`;
  }
}

function saveVoteTxRationaleCache() {
  fs.writeFileSync(VOTE_TX_RATIONALE_CACHE_PATH, JSON.stringify(voteTxRationaleCache));
}

function looksLikeUrl(value) {
  const s = String(value || "").trim();
  if (!s) return false;
  return s.startsWith("ipfs://") || s.startsWith("http://") || s.startsWith("https://");
}

function parseTxRationaleFromMetadataRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  let hasTextSignal = false;
  const urls = [];
  const pushUrl = (value) => {
    const s = String(value || "").trim();
    if (!looksLikeUrl(s)) return;
    if (!urls.includes(s)) urls.push(s);
  };
  const walk = (node, keyHint = "") => {
    if (node === null || node === undefined) return;
    if (typeof node === "string") {
      const lowKey = String(keyHint || "").toLowerCase();
      const text = node.trim();
      if (looksLikeUrl(text)) pushUrl(text);
      if (
        text &&
        (lowKey.includes("rationale") ||
          lowKey.includes("motivation") ||
          lowKey.includes("reason") ||
          lowKey.includes("comment") ||
          lowKey.includes("summary") ||
          lowKey.includes("abstract")) &&
        text.length >= 24
      ) {
        hasTextSignal = true;
      }
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item, keyHint);
      return;
    }
    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        const key = String(k || "");
        const lowKey = key.toLowerCase();
        if (lowKey === "uri" && typeof v === "string" && looksLikeUrl(v)) {
          pushUrl(v);
        }
        walk(v, key);
      }
    }
  };
  for (const row of list) {
    if (!row || typeof row !== "object") continue;
    const payload = row.json_metadata;
    walk(payload, "");
  }
  const rationaleUrl = urls[0] || "";
  const hasRationale = Boolean(rationaleUrl || hasTextSignal);
  return {
    hasRationale,
    rationaleUrl
  };
}

async function fetchTxRationaleFromBlockfrost(txHash) {
  const hash = String(txHash || "").trim().toLowerCase();
  if (!hash) return { hasRationale: false, rationaleUrl: "" };
  const cached = voteTxRationaleCache[hash];
  if (cached && typeof cached === "object") {
    return {
      hasRationale: Boolean(cached.hasRationale),
      rationaleUrl: String(cached.rationaleUrl || "")
    };
  }
  const rows = await blockfrostGet(`/txs/${hash}/metadata`).catch(() => []);
  const parsed = parseTxRationaleFromMetadataRows(rows);
  voteTxRationaleCache[hash] = {
    hasRationale: Boolean(parsed.hasRationale),
    rationaleUrl: String(parsed.rationaleUrl || ""),
    fetchedAt: Date.now()
  };
  return parsed;
}

function loadSpoProfileCache() {
  if (!fs.existsSync(SPO_PROFILE_CACHE_PATH)) return;
  try {
    const parsed = JSON.parse(fs.readFileSync(SPO_PROFILE_CACHE_PATH, "utf8"));
    if (parsed && typeof parsed === "object" && parsed.byPool && typeof parsed.byPool === "object") {
      spoProfileCache = { byPool: parsed.byPool };
    }
  } catch (error) {
    syncState.lastError = `Failed to read SPO profile cache: ${error.message}`;
  }
}

function saveSpoProfileCache() {
  try {
    fs.writeFileSync(SPO_PROFILE_CACHE_PATH, JSON.stringify(spoProfileCache));
    spoProfileDirty = false;
  } catch (error) {
    syncState.lastError = `Failed to write SPO profile cache: ${error.message}`;
  }
}

function classifySpoDelegationStatusFromDrepId(drepIdRaw) {
  const drepId = String(drepIdRaw || "").trim().toLowerCase();
  if (!drepId) return "Not delegated";
  if (drepId.includes("always_abstain")) return "Always abstain";
  if (drepId.includes("always_no_confidence") || drepId.includes("no_confidence")) return "Always no confidence";
  return "Delegated to DRep";
}

async function refreshSpoProfileForPool(poolId) {
  const id = String(poolId || "").trim();
  if (!id) return;
  const pool = await blockfrostGet(`/pools/${id}`).catch(() => null);
  const rewardAccount = String(pool?.reward_account || "").trim();
  let drepId = "";
  if (rewardAccount) {
    const account = await blockfrostGet(`/accounts/${rewardAccount}`).catch(() => null);
    drepId = String(account?.drep_id || "").trim();
  }
  spoProfileCache.byPool[id] = {
    ...(spoProfileCache.byPool[id] || {}),
    rewardAccount,
    drepId,
    delegatedDrepLiteralRaw: drepId,
    delegatedDrepLiteral: normalizeLiteral(drepId),
    delegationStatus: classifySpoDelegationStatusFromDrepId(drepId),
    fetchedAt: Date.now()
  };
  spoProfileDirty = true;
}

function queueSpoProfileRefresh(poolIds) {
  const freshMs = 24 * 60 * 60 * 1000;
  for (const raw of Array.isArray(poolIds) ? poolIds : []) {
    const id = String(raw || "").trim();
    if (!id) continue;
    const cached = spoProfileCache.byPool[id];
    const fetchedAt = Number(cached?.fetchedAt || 0);
    if (fetchedAt > 0 && Date.now() - fetchedAt < freshMs) continue;
    spoProfileRefreshQueue.add(id);
  }
  if (spoProfileRefreshPromise) return;
  spoProfileRefreshPromise = (async () => {
    try {
      const maxLookupsPerRun = 120;
      let done = 0;
      while (spoProfileRefreshQueue.size > 0 && done < maxLookupsPerRun) {
        const [id] = spoProfileRefreshQueue;
        if (!id) break;
        spoProfileRefreshQueue.delete(id);
        await refreshSpoProfileForPool(id).catch(() => null);
        done += 1;
      }
      if (spoProfileDirty) saveSpoProfileCache();
    } finally {
      spoProfileRefreshPromise = null;
      if (spoProfileRefreshQueue.size > 0) {
        setTimeout(() => queueSpoProfileRefresh([]), 500);
      }
    }
  })();
}

async function fetchEpochEndTimes(startEpoch, endEpoch) {
  const map = new Map();
  for (let epoch = startEpoch; epoch <= endEpoch; epoch += 1) {
    try {
      const row = await blockfrostGet(`/epochs/${epoch}`);
      const endTime = Number(row?.end_time || 0);
      if (Number.isFinite(endTime) && endTime > 0) map.set(epoch, endTime);
    } catch {
      map.set(epoch, 0);
    }
  }
  return map;
}

async function fetchDrepPowerForEpoch(epochNo) {
  const output = new Map();
  const limit = 1000;
  let offset = 0;
  const maxRows = 20000;
  while (offset < maxRows) {
    const query = `/drep_history?epoch_no=eq.${Number(epochNo)}&limit=${limit}&offset=${offset}`;
    const rows = await koiosGet(query).catch(() => []);
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const row of rows) {
      const id = String(row?.drep_id || "").trim();
      if (!id) continue;
      const ada = Number(row?.amount || 0) / 1_000_000;
      output.set(id, Number.isFinite(ada) ? Math.max(0, ada) : 0);
    }
    if (rows.length < limit) break;
    offset += rows.length;
  }
  return output;
}

async function fetchLatestChainEpoch() {
  const row = await blockfrostGet("/epochs/latest").catch(() => null);
  const epoch = Number(row?.epoch || 0);
  return Number.isFinite(epoch) && epoch > 0 ? epoch : null;
}

async function fetchAllDrepIdsFromBlockfrost() {
  const ids = new Set();
  const pageSize = 100;
  let page = 1;
  while (page <= 100) {
    const rows = await blockfrostGet(`/governance/dreps?count=${pageSize}&page=${page}`).catch(() => []);
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const row of rows) {
      const id = String(row?.drep_id || "").trim();
      if (id) ids.add(id);
    }
    if (rows.length < pageSize) break;
    page += 1;
  }
  return ids;
}

function buildEpochScopedSnapshot(baseSnapshot, cutoffEpoch, cutoffUnix, drepPowerMap = null) {
  const proposalInfo = baseSnapshot?.proposalInfo || {};
  const scopedProposalEntries = Object.entries(proposalInfo).filter(([, info]) => {
    const epoch = Number(info?.submittedEpoch || 0);
    return Number.isFinite(epoch) && epoch > 0 ? epoch <= cutoffEpoch : true;
  });
  const proposalInfoScoped = Object.fromEntries(scopedProposalEntries);
  const includedProposalIds = new Set(scopedProposalEntries.map(([proposalId]) => proposalId));
  const inScopeVote = (vote) => {
    if (!includedProposalIds.has(vote.proposalId)) return false;
    const votedAt = Number(vote?.votedAtUnix || 0);
    if (Number.isFinite(cutoffUnix) && cutoffUnix > 0 && votedAt > 0) {
      return votedAt <= cutoffUnix;
    }
    return true;
  };

  const drepBaseById = new Map((baseSnapshot?.dreps || []).map((row) => [String(row.id || ""), row]));
  const drepIds = new Set([
    ...Array.from(drepBaseById.keys()),
    ...(drepPowerMap ? Array.from(drepPowerMap.keys()) : [])
  ]);
  const dreps = Array.from(drepIds)
    .map((id) => {
      const base = drepBaseById.get(id) || {
        id,
        name: "",
        transparencyScore: 20,
        consistency: 0,
        totalEligibleVotes: 0,
        firstVoteBlockTime: Number.MAX_SAFE_INTEGER,
        votingPowerAda: 0,
        profile: {
          name: "",
          bio: "",
          motivations: "",
          objectives: "",
          qualifications: "",
          email: "",
          imageUrl: "",
          references: []
        },
        votes: []
      };
      const powerAda = drepPowerMap && drepPowerMap.has(id) ? Number(drepPowerMap.get(id) || 0) : Number(base.votingPowerAda || 0);
      return {
        ...base,
        votingPowerAda: Number.isFinite(powerAda) ? Math.max(0, powerAda) : 0,
        votes: (base.votes || []).filter(inScopeVote)
      };
    })
    .sort((a, b) => Number(b.votingPowerAda || 0) - Number(a.votingPowerAda || 0));

  const committeeMembers = (baseSnapshot?.committeeMembers || [])
    .map((row) => ({
      ...row,
      votes: (row.votes || []).filter(inScopeVote)
    }))
    .filter((row) => row.votes.length > 0);

  const spos = (baseSnapshot?.spos || [])
    .map((row) => ({
      ...row,
      votes: (row.votes || []).filter(inScopeVote)
    }))
    .filter((row) => row.votes.length > 0);

  const specialDrepsBase = baseSnapshot?.specialDreps || {};
  const specialDreps = {
    alwaysAbstain: {
      id: SPECIAL_DREP_IDS.alwaysAbstain,
      active: true,
      votingPowerAda: drepPowerMap && drepPowerMap.has(SPECIAL_DREP_IDS.alwaysAbstain)
        ? Number(drepPowerMap.get(SPECIAL_DREP_IDS.alwaysAbstain) || 0)
        : Number(specialDrepsBase?.alwaysAbstain?.votingPowerAda || 0)
    },
    alwaysNoConfidence: {
      id: SPECIAL_DREP_IDS.alwaysNoConfidence,
      active: true,
      votingPowerAda: drepPowerMap && drepPowerMap.has(SPECIAL_DREP_IDS.alwaysNoConfidence)
        ? Number(drepPowerMap.get(SPECIAL_DREP_IDS.alwaysNoConfidence) || 0)
        : Number(specialDrepsBase?.alwaysNoConfidence?.votingPowerAda || 0)
    }
  };

  return {
    ...baseSnapshot,
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    historical: true,
    historicalKind: "epoch_cut",
    historicalCutoffEpoch: cutoffEpoch,
    generatedAt: baseSnapshot.generatedAt,
    latestEpoch: cutoffEpoch,
    proposalCount: Object.keys(proposalInfoScoped).length,
    scannedProposalCount: Object.keys(proposalInfoScoped).length,
    processedProposalCount: Object.keys(proposalInfoScoped).length,
    proposalInfo: proposalInfoScoped,
    specialDreps,
    dreps,
    committeeMembers,
    spos
  };
}

function detectLatestEpochFromSnapshot(baseSnapshot) {
  const latestFromSnapshot = Number(baseSnapshot?.latestEpoch || 0);
  const latestFromProposalInfo = Math.max(
    0,
    ...Object.values(baseSnapshot?.proposalInfo || {}).map((info) => Number(info?.submittedEpoch || 0) || 0)
  );
  return {
    latestFromSnapshot,
    latestFromProposalInfo,
    latest: Math.max(latestFromSnapshot, latestFromProposalInfo)
  };
}

async function backfillEpochSnapshotsFromCurrent(force = false) {
  if (epochBackfillState.running) return;
  const { latest } = detectLatestEpochFromSnapshot(snapshot);
  if (!Number.isFinite(latest) || latest < EPOCH_SNAPSHOT_START_EPOCH) return;
  epochBackfillState.running = true;
  epochBackfillState.lastStartedAt = new Date().toISOString();
  epochBackfillState.lastError = null;
  epochBackfillState.completedCount = 0;
  try {
    ensureSnapshotHistoryDir();
    const existing = new Set(listSnapshotHistoryFiles().map((row) => row.epoch));
    const targets = [];
    for (let epoch = EPOCH_SNAPSHOT_START_EPOCH; epoch <= latest; epoch += 1) {
      if (force || !existing.has(epoch)) targets.push(epoch);
    }
    const nowUnix = Math.floor(Date.now() / 1000);
    const endTimes = await fetchEpochEndTimes(EPOCH_SNAPSHOT_START_EPOCH, latest);
    const eligibleTargets = targets.filter((epoch) => {
      const endUnix = Number(endTimes.get(epoch) || 0);
      return Number.isFinite(endUnix) && endUnix > 0 && endUnix <= nowUnix;
    });
    epochBackfillState.targetCount = eligibleTargets.length;

    // Remove any history files for epochs that have not ended yet.
    for (const existingEpoch of existing) {
      if (!Number.isFinite(existingEpoch) || existingEpoch <= 0) continue;
      if (existingEpoch < EPOCH_SNAPSHOT_START_EPOCH || existingEpoch > latest) continue;
      const endUnix = Number(endTimes.get(existingEpoch) || 0);
      const ended = Number.isFinite(endUnix) && endUnix > 0 && endUnix <= nowUnix;
      if (ended) continue;
      try {
        const fullPath = path.join(SNAPSHOT_HISTORY_DIR, epochSnapshotFilename(existingEpoch));
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch {
        // Ignore cleanup errors; listing endpoint also filters by ended epochs.
      }
    }

    if (eligibleTargets.length === 0) {
      epochBackfillState.lastCompletedAt = new Date().toISOString();
      return;
    }

    for (const epoch of eligibleTargets) {
      const cutoffUnix = Number(endTimes.get(epoch) || 0);
      const drepPowerMap = await fetchDrepPowerForEpoch(epoch);
      const scoped = buildEpochScopedSnapshot(snapshot, epoch, cutoffUnix, drepPowerMap);
      const filename = epochSnapshotFilename(epoch);
      const fullPath = path.join(SNAPSHOT_HISTORY_DIR, filename);
      fs.writeFileSync(fullPath, JSON.stringify(scoped));
      epochBackfillState.completedCount += 1;
    }
    epochBackfillState.lastCompletedAt = new Date().toISOString();
  } catch (error) {
    epochBackfillState.lastError = error.message || "Epoch backfill failed.";
  } finally {
    epochBackfillState.running = false;
  }
}

async function fetchSpecialDreps(force = false) {
  const now = Date.now();
  const hasCachedValue = specialDrepsCache.value && Object.keys(specialDrepsCache.value).length > 0;
  if (!force && hasCachedValue && now - specialDrepsCache.fetchedAt < SPECIAL_DREP_REFRESH_MS) {
    return specialDrepsCache.value;
  }
  if (!BLOCKFROST_API_KEY) {
    return specialDrepsCache.value || {};
  }

  const entries = await Promise.all(
    Object.entries(SPECIAL_DREP_IDS).map(async ([key, drepId]) => {
      try {
        const data = await blockfrostGet(`/governance/dreps/${encodeURIComponent(drepId)}`);
        return [
          key,
          {
            id: drepId,
            active: Boolean(data?.active),
            votingPowerAda: Math.floor(Number(data?.amount || 0) / 1_000_000)
          }
        ];
      } catch (error) {
        return [
          key,
          {
            id: drepId,
            active: false,
            votingPowerAda: 0
          }
        ];
      }
    })
  );

  const value = Object.fromEntries(entries);
  specialDrepsCache = { fetchedAt: now, value };
  return value;
}

// ---------------------------------------------------------------------------
// Incremental delta sync
// ---------------------------------------------------------------------------
// Merges only new data into an existing complete snapshot.  The full rebuild
// path is preserved and used on epoch boundaries / first boot.
//
// Strategy:
//   1. Fetch the current proposal list (cheap — usually 1–3 pages).
//   2. For each proposal, fetch votes page-by-page (newest first, desc order).
//      Stop pagination as soon as we hit a tx_hash we already stored.  For
//      brand-new proposals we fetch all votes as usual.
//   3. Merge new votes into the in-memory actor aggregates (drep/spo/cc).
//   4. Refetch DRep details ONLY for DReps that cast a new vote.
//   5. Recalculate scores for every actor touched.
//   6. Return a new snapshot object that is the existing snapshot plus deltas.
// ---------------------------------------------------------------------------
async function buildDeltaSnapshot(base) {
  const latestEpoch = await fetchLatestChainEpoch().catch(() => null);

  // Build lookup structures from the existing snapshot so we can do O(1) checks.
  const existingProposalIds = new Set(Object.keys(base.proposalInfo || {}));

  // Per-proposal: set of vote tx hashes we already know about (watermark).
  const knownVoteTxHashByProposal = new Map(); // proposalId -> Set<txHash>
  const actorRole = new Map(); // voteTxHash -> "drep"|"spo"|"committee"
  for (const actor of [...(base.dreps || []), ...(base.spos || []), ...(base.committeeMembers || [])]) {
    for (const vote of (actor.votes || [])) {
      const pid = String(vote.proposalId || "");
      const txh = String(vote.voteTxHash || "").toLowerCase();
      if (!pid || !txh) continue;
      if (!knownVoteTxHashByProposal.has(pid)) knownVoteTxHashByProposal.set(pid, new Set());
      knownVoteTxHashByProposal.get(pid).add(txh);
    }
  }

  // Build mutable maps of actors keyed by id for fast in-place updates.
  const drepById = new Map((base.dreps || []).map((r) => [r.id, { ...r, votes: [...(r.votes || [])] }]));
  const spoById = new Map((base.spos || []).map((r) => [r.id, { ...r, votes: [...(r.votes || [])] }]));
  const ccById = new Map((base.committeeMembers || []).map((r) => [r.id, { ...r, votes: [...(r.votes || [])] }]));
  const proposalInfo = { ...(base.proposalInfo || {}) };

  // Backfill any votes that were persisted with null votedAtUnix but whose
  // tx hash is now in the cache.  This is a no-op once all votes are patched.
  backfillVoteTimestampsFromCache(drepById.values(), proposalInfo);
  backfillVoteTimestampsFromCache(spoById.values(), proposalInfo);
  backfillVoteTimestampsFromCache(ccById.values(), proposalInfo);

  // Fetch current full proposal list (paginated, same as full sync).
  const proposalsAll = await paginate("/governance/proposals", PROPOSAL_PAGE_SIZE, PROPOSAL_MAX_PAGES);
  const proposals = PROPOSAL_SCAN_LIMIT > 0 ? proposalsAll.slice(0, PROPOSAL_SCAN_LIMIT) : proposalsAll;

  syncState.totalProposals = proposalsAll.length;
  syncState.scannedProposals = proposals.length;
  syncState.processedProposals = 0;

  // Identify new proposals (not in existing snapshot) and known ones.
  const newProposals = proposals.filter((p) => !existingProposalIds.has(p.id));
  const knownProposals = proposals.filter((p) => existingProposalIds.has(p.id));

  // We only need to check for new votes on known proposals that are still
  // "open" (not expired/dropped/ratified). Use proposalInfo outcome for this.
  // NOTE: outcomeFromProposal() returns "pending" for open proposals, which
  // titleCase() stores as "Pending" — so we must include "pending" here too.
  const activeKnownProposals = knownProposals.filter((p) => {
    const info = proposalInfo[p.id];
    if (!info) return true; // unknown state — check anyway
    const outcome = String(info.outcome || "").toLowerCase();
    return outcome === "" || outcome === "open" || outcome === "unknown" || outcome === "pending";
  });

  // --- Phase 1: Handle new proposals (full treatment, same as buildFullSnapshot) ---
  let newProposalSkips = 0;
  const newProposalMeta = new Map(); // proposalId -> { blockTime, hasXVotes }

  for (let start = 0; start < newProposals.length; start += SYNC_BATCH_SIZE) {
    const batch = newProposals.slice(start, start + SYNC_BATCH_SIZE);
    const batchIds = batch.map((p) => p.id);
    const [koiosSummaryByProposal, koiosVoteLookupByProposal, koiosSpoVoteLookupByProposal] = await Promise.all([
      fetchKoiosVotingSummariesByProposalIds(batchIds).catch(() => new Map()),
      fetchKoiosVoteRationaleLookupsForProposals(batchIds).catch(() => new Map()),
      fetchKoiosSpoVoteRationaleLookupsForProposals(batchIds).catch(() => new Map())
    ]);

    const detailRows = await mapLimit(batch, SYNC_CONCURRENCY, async (proposal) => {
      const safeId = encodeURIComponent(proposal.id);
      try {
        const [detail, metadata, txInfo] = await Promise.all([
          blockfrostGet(`/governance/proposals/${safeId}`),
          blockfrostGet(`/governance/proposals/${safeId}/metadata`).catch(() => null),
          blockfrostGet(`/txs/${proposal.tx_hash}`).catch(() => null)
        ]);
        const koiosVotingSummary = koiosSummaryByProposal.get(proposal.id) || null;
        const koiosVoteLookup = new Map(koiosVoteLookupByProposal.get(proposal.id) || []);
        const spoKoiosLookup = koiosSpoVoteLookupByProposal.get(proposal.id) || null;
        if (spoKoiosLookup instanceof Map) {
          for (const [key, value] of spoKoiosLookup.entries()) {
            if (!koiosVoteLookup.has(key)) koiosVoteLookup.set(key, value);
          }
          if (spoKoiosLookup.__unresolved && !koiosVoteLookup.__unresolved) {
            koiosVoteLookup.__unresolved = true;
          }
        }
        const votes = await paginate(`/governance/proposals/${safeId}/votes`, PROPOSAL_VOTES_PAGE_SIZE, PROPOSAL_VOTES_MAX_PAGES).catch(() => []);
        return { proposalId: proposal.id, detail, metadata, txInfo, koiosVotingSummary, koiosVoteLookup, votes };
      } catch {
        newProposalSkips += 1;
        return null;
      }
    });

    const epochParams = null; // thresholds already in existing snapshot; skip for delta
    for (const row of detailRows.filter(Boolean)) {
      const outcome = outcomeFromProposal(row.detail);
      const governanceType = row.detail?.governance_type || "unknown";
      const text = extractProposalNameAndRationale(row.proposalId, row.detail, row.metadata);
      const blockTime = Number(row.txInfo?.block_time || 0);
      const drepVotes = row.votes.filter((v) => normalizeVoteRole(v.voter_role) === "drep");
      const committeeVotes = row.votes.filter((v) => normalizeVoteRole(v.voter_role) === "constitutional_committee");
      const spoVotes = row.votes.filter((v) => normalizeVoteRole(v.voter_role) === "stake_pool");

      let cgovCommitteeLookup = null;
      if (CC_RATIONALE_USE_CGOV_FALLBACK && committeeVotes.length > 0) {
        cgovCommitteeLookup = await fetchCgovCommitteeVoteRationaleLookupForProposal(row.detail?.tx_hash, row.detail?.cert_index).catch(() => null);
      }
      let cgovDrepLookup = null;
      if (DREP_RATIONALE_USE_CGOV_FALLBACK && drepVotes.length > 0) {
        cgovDrepLookup = await fetchCgovDrepVoteRationaleLookupForProposal(row.detail?.tx_hash, row.detail?.cert_index).catch(() => null);
      }
      let cgovSpoLookup = null;
      if (SPO_RATIONALE_USE_CGOV_FALLBACK && spoVotes.length > 0) {
        cgovSpoLookup = await fetchCgovSpoVoteRationaleLookupForProposal(row.detail?.tx_hash, row.detail?.cert_index).catch(() => null);
      }

      const nomosModel = buildNomosModelFromKoiosSummary(row.koiosVotingSummary);
      const voteStatsByRole = tallyVotesByRole(row.votes);

      proposalInfo[row.proposalId] = {
        actionName: text.actionName,
        rationale: text.rationaleText,
        metadataJson: row.metadata?.json_metadata || null,
        metadataUrl: row.metadata?.url || null,
        metadataHash: row.metadata?.hash || null,
        governanceType: titleCase(governanceType),
        outcome: titleCase(outcome),
        submittedAtUnix: blockTime || null,
        submittedAt: blockTime ? new Date(blockTime * 1000).toISOString() : null,
        submittedEpoch: row.detail?.block_epoch || Number(row.koiosVotingSummary?.epoch_no || 0) || null,
        txHash: row.detail?.tx_hash || null,
        certIndex: row.detail?.cert_index ?? null,
        depositAda: row.detail?.deposit ? Math.floor(Number(row.detail.deposit) / 1_000_000) : 0,
        returnAddress: row.detail?.return_address || "",
        expirationEpoch: row.detail?.expiration ?? null,
        ratifiedEpoch: row.detail?.ratified_epoch ?? null,
        enactedEpoch: row.detail?.enacted_epoch ?? null,
        droppedEpoch: row.detail?.dropped_epoch ?? null,
        expiredEpoch: row.detail?.expired_epoch ?? null,
        governanceDescription: row.detail?.governance_description || null,
        koiosVotingSummary: row.koiosVotingSummary || null,
        nomosModel,
        thresholdInfo: null, // omit for delta; full rebuild computes this
        voteStats: voteStatsByRole
      };

      newProposalMeta.set(row.proposalId, { blockTime, hasDrepVotes: drepVotes.length > 0, hasCommitteeVotes: committeeVotes.length > 0, hasSpoVotes: spoVotes.length > 0 });

      // Merge votes for new proposals into actor maps
      for (const vote of drepVotes) {
        const drepId = vote.voter;
        if (!drepById.has(drepId)) {
          drepById.set(drepId, { id: drepId, name: "", status: "unknown", active: null, retired: null, expired: null, activeEpoch: null, lastActiveEpoch: null, hasScript: null, transparencyScore: 20, consistency: 0, totalEligibleVotes: proposals.length, firstVoteBlockTime: Number.MAX_SAFE_INTEGER, votingPowerAda: 0, profile: { name: "", bio: "", motivations: "", objectives: "", qualifications: "", email: "", imageUrl: "", references: [] }, votes: [], _dirty: true });
        }
        const drep = drepById.get(drepId);
        drep._dirty = true;
        drep.firstVoteBlockTime = Math.min(drep.firstVoteBlockTime, blockTime || Number.MAX_SAFE_INTEGER);
        const koiosVote = lookupKoiosVoteRationale(row.koiosVoteLookup, vote);
        const cgovVote = lookupCgovDrepVoteRationale(cgovDrepLookup, drepId, vote.tx_hash);
        const cgovHasRationale = Boolean(cgovVote?.hasRationale);
        const cgovRationaleUrl = String(cgovVote?.rationaleUrl || "").trim();
        const votedAt = Number(voteTxTimeCache[vote.tx_hash] || 0);
        upsertActorVoteByProposal(drep.votes, { proposalId: row.proposalId, vote: titleCase(vote.vote), outcome: titleCase(outcome), voteTxHash: vote.tx_hash || "", hasRationale: resolveRationalePresence(vote, koiosVote, row.koiosVoteLookup) || cgovHasRationale, rationaleUrl: getVoteRationaleUrl(vote) || koiosVote?.rationaleUrl || cgovRationaleUrl || "", voterRole: normalizeVoteRole(vote.voter_role), responseHours: blockTime > 0 && votedAt >= blockTime ? (votedAt - blockTime) / 3600 : null, votedAtUnix: votedAt || null, votedAt: votedAt ? new Date(votedAt * 1000).toISOString() : null });
      }

      for (const vote of committeeVotes) {
        const memberId = vote.voter;
        if (!ccById.has(memberId)) {
          ccById.set(memberId, { id: memberId, name: "", transparencyScore: null, consistency: 0, totalEligibleVotes: proposals.length, firstVoteBlockTime: Number.MAX_SAFE_INTEGER, votingPowerAda: 0, koiosVoterId: "", votes: [], _dirty: true });
        }
        const member = ccById.get(memberId);
        member._dirty = true;
        member.firstVoteBlockTime = Math.min(member.firstVoteBlockTime, blockTime || Number.MAX_SAFE_INTEGER);
        const koiosVote = lookupKoiosVoteRationale(row.koiosVoteLookup, vote);
        const cgovVote = lookupCgovCommitteeVoteRationale(cgovCommitteeLookup, vote);
        const cgovHasRationale = Boolean(cgovVote?.hasRationale);
        const cgovRationaleUrl = String(cgovVote?.rationaleUrl || "").trim();
        const votedAt = Number(voteTxTimeCache[vote.tx_hash] || 0);
        if (!member.koiosVoterId && typeof koiosVote?.koiosVoterId === "string") member.koiosVoterId = koiosVote.koiosVoterId.trim();
        upsertActorVoteByProposal(member.votes, { proposalId: row.proposalId, vote: titleCase(vote.vote), outcome: titleCase(outcome), voteTxHash: vote.tx_hash || "", hasRationale: resolveRationalePresence(vote, koiosVote, row.koiosVoteLookup) || cgovHasRationale, rationaleUrl: getVoteRationaleUrl(vote) || koiosVote?.rationaleUrl || cgovRationaleUrl || "", rationaleBodyLength: Number(cgovVote?.rationaleBodyLength || 0), rationaleSectionCount: Number(cgovVote?.rationaleSectionCount || 0), voterRole: normalizeVoteRole(vote.voter_role), responseHours: blockTime > 0 && votedAt >= blockTime ? (votedAt - blockTime) / 3600 : null, votedAtUnix: votedAt || null, votedAt: votedAt ? new Date(votedAt * 1000).toISOString() : null });
      }

      for (const vote of spoVotes) {
        const poolId = vote.voter;
        if (!spoById.has(poolId)) {
          spoById.set(poolId, { id: poolId, name: "", homepage: "", status: "registered", delegatedDrepLiteralRaw: "", delegatedDrepLiteral: "", delegationStatus: "Not delegated", transparencyScore: null, consistency: 0, totalEligibleVotes: proposals.length, firstVoteBlockTime: Number.MAX_SAFE_INTEGER, votingPowerAda: null, votes: [], _dirty: true });
        }
        const pool = spoById.get(poolId);
        pool._dirty = true;
        pool.firstVoteBlockTime = Math.min(pool.firstVoteBlockTime, blockTime || Number.MAX_SAFE_INTEGER);
        const koiosVote = lookupKoiosVoteRationale(row.koiosVoteLookup, vote);
        const txHash = String(vote.tx_hash || "").toLowerCase();
        const cachedTxRationale = txHash ? voteTxRationaleCache[txHash] : null;
        const cgovVote = lookupCgovSpoVoteRationale(cgovSpoLookup, vote);
        const cgovHasRationale = Boolean(cgovVote?.hasRationale);
        const cgovRationaleUrl = String(cgovVote?.rationaleUrl || "").trim();
        const cachedHasRationale = cachedTxRationale ? Boolean(cachedTxRationale.hasRationale) : false;
        const cachedRationaleUrl = cachedTxRationale ? String(cachedTxRationale.rationaleUrl || "") : "";
        const votedAt = Number(voteTxTimeCache[vote.tx_hash] || 0);
        upsertActorVoteByProposal(pool.votes, { proposalId: row.proposalId, vote: titleCase(vote.vote), outcome: titleCase(outcome), voteTxHash: vote.tx_hash || "", hasRationale: resolveRationalePresence(vote, koiosVote, row.koiosVoteLookup) || cachedHasRationale || cgovHasRationale, rationaleUrl: getVoteRationaleUrl(vote) || koiosVote?.rationaleUrl || cachedRationaleUrl || cgovRationaleUrl || "", voterRole: normalizeVoteRole(vote.voter_role), responseHours: blockTime > 0 && votedAt >= blockTime ? (votedAt - blockTime) / 3600 : null, votedAtUnix: votedAt || null, votedAt: votedAt ? new Date(votedAt * 1000).toISOString() : null });
      }

      syncState.processedProposals += 1;
    }
  }

  // --- Phase 2: Check active known proposals for new votes (watermark-based) ---
  const newlyActiveDrepIds = new Set();

  for (let start = 0; start < activeKnownProposals.length; start += SYNC_BATCH_SIZE) {
    const batch = activeKnownProposals.slice(start, start + SYNC_BATCH_SIZE);
    const batchIds = batch.map((p) => p.id);

    const [koiosVoteLookupByProposal, koiosSpoVoteLookupByProposal] = await Promise.all([
      fetchKoiosVoteRationaleLookupsForProposals(batchIds).catch(() => new Map()),
      fetchKoiosSpoVoteRationaleLookupsForProposals(batchIds).catch(() => new Map())
    ]);

    await mapLimit(batch, SYNC_CONCURRENCY, async (proposal) => {
      const safeId = encodeURIComponent(proposal.id);
      const watermark = knownVoteTxHashByProposal.get(proposal.id) || new Set();
      const koiosVoteLookup = new Map(koiosVoteLookupByProposal.get(proposal.id) || []);
      const spoKoiosLookup = koiosSpoVoteLookupByProposal.get(proposal.id) || null;
      if (spoKoiosLookup instanceof Map) {
        for (const [key, value] of spoKoiosLookup.entries()) {
          if (!koiosVoteLookup.has(key)) koiosVoteLookup.set(key, value);
        }
      }

      const currentOutcome = titleCase(String(proposalInfo[proposal.id]?.outcome || ""));
      const proposalBlockTime = Number(proposalInfo[proposal.id]?.submittedAtUnix || 0);

      // Paginate votes, stopping early once we hit a known tx hash.
      const newVotes = [];
      let page = 1;
      let hitWatermark = false;
      while (page <= PROPOSAL_VOTES_MAX_PAGES && !hitWatermark) {
        const query = `/governance/proposals/${safeId}/votes?count=${PROPOSAL_VOTES_PAGE_SIZE}&page=${page}&order=desc`;
        const chunk = await blockfrostGet(query).catch(() => []);
        if (!Array.isArray(chunk) || chunk.length === 0) break;
        let knownInPage = 0;
        let unseenInPage = 0;
        for (const vote of chunk) {
          const txh = String(vote.tx_hash || "").toLowerCase();
          if (watermark.has(txh)) {
            knownInPage += 1;
            continue;
          }
          newVotes.push(vote);
          unseenInPage += 1;
        }
        if (knownInPage > 0 && unseenInPage === 0) hitWatermark = true;
        if (chunk.length < PROPOSAL_VOTES_PAGE_SIZE) break;
        page += 1;
      }

      if (newVotes.length === 0) {
        syncState.processedProposals += 1;
        return;
      }

      // Fetch tx timestamps for new vote hashes we don't have yet.
      const newTxHashes = newVotes.map((v) => String(v.tx_hash || "").toLowerCase()).filter((h) => h && !voteTxTimeCache[h]);
      for (const txHash of newTxHashes) {
        try {
          const tx = await blockfrostGet(`/txs/${txHash}`);
          voteTxTimeCache[txHash] = Number(tx.block_time || 0);
        } catch {
          voteTxTimeCache[txHash] = 0;
        }
      }
      if (newTxHashes.length > 0) saveVoteTxTimeCache();

      // Also fetch proposal detail to update outcome if it changed.
      const freshDetail = await blockfrostGet(`/governance/proposals/${safeId}`).catch(() => null);
      if (freshDetail) {
        const freshOutcome = titleCase(outcomeFromProposal(freshDetail));
        if (proposalInfo[proposal.id]) {
          proposalInfo[proposal.id] = {
            ...proposalInfo[proposal.id],
            outcome: freshOutcome,
            expirationEpoch: freshDetail.expiration ?? proposalInfo[proposal.id].expirationEpoch,
            ratifiedEpoch: freshDetail.ratified_epoch ?? proposalInfo[proposal.id].ratifiedEpoch,
            enactedEpoch: freshDetail.enacted_epoch ?? proposalInfo[proposal.id].enactedEpoch,
            droppedEpoch: freshDetail.dropped_epoch ?? proposalInfo[proposal.id].droppedEpoch,
            expiredEpoch: freshDetail.expired_epoch ?? proposalInfo[proposal.id].expiredEpoch
          };
        }
      }

      // Merge new votes into actor maps.
      const drepVotes = newVotes.filter((v) => normalizeVoteRole(v.voter_role) === "drep");
      const committeeVotes = newVotes.filter((v) => normalizeVoteRole(v.voter_role) === "constitutional_committee");
      const spoVotes = newVotes.filter((v) => normalizeVoteRole(v.voter_role) === "stake_pool");

      for (const vote of drepVotes) {
        const drepId = vote.voter;
        const votedAt = Number(voteTxTimeCache[vote.tx_hash] || 0);
        if (!drepById.has(drepId)) {
          drepById.set(drepId, { id: drepId, name: "", status: "unknown", active: null, retired: null, expired: null, activeEpoch: null, lastActiveEpoch: null, hasScript: null, transparencyScore: 20, consistency: 0, totalEligibleVotes: proposals.length, firstVoteBlockTime: proposalBlockTime || Number.MAX_SAFE_INTEGER, votingPowerAda: 0, profile: { name: "", bio: "", motivations: "", objectives: "", qualifications: "", email: "", imageUrl: "", references: [] }, votes: [], _dirty: true });
        }
        const drep = drepById.get(drepId);
        drep._dirty = true;
        drep.firstVoteBlockTime = Math.min(drep.firstVoteBlockTime, proposalBlockTime || Number.MAX_SAFE_INTEGER);
        newlyActiveDrepIds.add(drepId);
        const koiosVote = lookupKoiosVoteRationale(koiosVoteLookup, vote);
        upsertActorVoteByProposal(drep.votes, { proposalId: proposal.id, vote: titleCase(vote.vote), outcome: currentOutcome, voteTxHash: vote.tx_hash || "", hasRationale: resolveRationalePresence(vote, koiosVote, koiosVoteLookup), rationaleUrl: getVoteRationaleUrl(vote) || koiosVote?.rationaleUrl || "", voterRole: normalizeVoteRole(vote.voter_role), responseHours: proposalBlockTime > 0 && votedAt >= proposalBlockTime ? (votedAt - proposalBlockTime) / 3600 : null, votedAtUnix: votedAt || null, votedAt: votedAt ? new Date(votedAt * 1000).toISOString() : null });
      }

      for (const vote of committeeVotes) {
        const memberId = vote.voter;
        const votedAt = Number(voteTxTimeCache[vote.tx_hash] || 0);
        if (!ccById.has(memberId)) {
          ccById.set(memberId, { id: memberId, name: "", transparencyScore: null, consistency: 0, totalEligibleVotes: proposals.length, firstVoteBlockTime: proposalBlockTime || Number.MAX_SAFE_INTEGER, votingPowerAda: 0, koiosVoterId: "", votes: [], _dirty: true });
        }
        const member = ccById.get(memberId);
        member._dirty = true;
        member.firstVoteBlockTime = Math.min(member.firstVoteBlockTime, proposalBlockTime || Number.MAX_SAFE_INTEGER);
        const koiosVote = lookupKoiosVoteRationale(koiosVoteLookup, vote);
        if (!member.koiosVoterId && typeof koiosVote?.koiosVoterId === "string") member.koiosVoterId = koiosVote.koiosVoterId.trim();
        upsertActorVoteByProposal(member.votes, { proposalId: proposal.id, vote: titleCase(vote.vote), outcome: currentOutcome, voteTxHash: vote.tx_hash || "", hasRationale: resolveRationalePresence(vote, koiosVote, koiosVoteLookup), rationaleUrl: getVoteRationaleUrl(vote) || koiosVote?.rationaleUrl || "", rationaleBodyLength: 0, rationaleSectionCount: 0, voterRole: normalizeVoteRole(vote.voter_role), responseHours: proposalBlockTime > 0 && votedAt >= proposalBlockTime ? (votedAt - proposalBlockTime) / 3600 : null, votedAtUnix: votedAt || null, votedAt: votedAt ? new Date(votedAt * 1000).toISOString() : null });
      }

      for (const vote of spoVotes) {
        const poolId = vote.voter;
        const votedAt = Number(voteTxTimeCache[vote.tx_hash] || 0);
        if (!spoById.has(poolId)) {
          spoById.set(poolId, { id: poolId, name: "", homepage: "", status: "registered", delegatedDrepLiteralRaw: "", delegatedDrepLiteral: "", delegationStatus: "Not delegated", transparencyScore: null, consistency: 0, totalEligibleVotes: proposals.length, firstVoteBlockTime: proposalBlockTime || Number.MAX_SAFE_INTEGER, votingPowerAda: null, votes: [], _dirty: true });
        }
        const pool = spoById.get(poolId);
        pool._dirty = true;
        pool.firstVoteBlockTime = Math.min(pool.firstVoteBlockTime, proposalBlockTime || Number.MAX_SAFE_INTEGER);
        const koiosVote = lookupKoiosVoteRationale(koiosVoteLookup, vote);
        const txHash = String(vote.tx_hash || "").toLowerCase();
        const cachedTxRationale = txHash ? voteTxRationaleCache[txHash] : null;
        const cachedHasRationale = cachedTxRationale ? Boolean(cachedTxRationale.hasRationale) : false;
        const cachedRationaleUrl = cachedTxRationale ? String(cachedTxRationale.rationaleUrl || "") : "";
        upsertActorVoteByProposal(pool.votes, { proposalId: proposal.id, vote: titleCase(vote.vote), outcome: currentOutcome, voteTxHash: vote.tx_hash || "", hasRationale: resolveRationalePresence(vote, koiosVote, koiosVoteLookup) || cachedHasRationale, rationaleUrl: getVoteRationaleUrl(vote) || koiosVote?.rationaleUrl || cachedRationaleUrl || "", voterRole: normalizeVoteRole(vote.voter_role), responseHours: proposalBlockTime > 0 && votedAt >= proposalBlockTime ? (votedAt - proposalBlockTime) / 3600 : null, votedAtUnix: votedAt || null, votedAt: votedAt ? new Date(votedAt * 1000).toISOString() : null });
      }

      if (proposalInfo[proposal.id]) {
        proposalInfo[proposal.id] = {
          ...proposalInfo[proposal.id],
          voteStats: buildProposalVoteStatsFromActorMaps(proposal.id, drepById, ccById, spoById)
        };
      }

      syncState.processedProposals += 1;
    });
  }

  // --- Phase 3: Refresh DRep details only for DReps with new votes ---
  const drepIdsToRefresh = Array.from(newlyActiveDrepIds);
  const drepMetadataPayloadCache = new Map();
  for (let start = 0; start < drepIdsToRefresh.length; start += SYNC_BATCH_SIZE) {
    const batch = drepIdsToRefresh.slice(start, start + SYNC_BATCH_SIZE);
    await mapLimit(batch, SYNC_CONCURRENCY, async (drepId) => {
      const safeId = encodeURIComponent(drepId);
      const [details, metadata] = await Promise.allSettled([
        blockfrostGet(`/governance/dreps/${safeId}`),
        blockfrostGet(`/governance/dreps/${safeId}/metadata`)
      ]);
      const row = drepById.get(drepId);
      if (!row) return;
      if (details.status === "fulfilled") {
        row.votingPowerAda = Math.floor(Number(details.value.amount || 0) / 1_000_000);
        const active = details.value?.active === true;
        const retired = details.value?.retired === true;
        const expired = details.value?.expired === true;
        row.active = active;
        row.retired = retired;
        row.expired = expired;
        row.activeEpoch = Number(details.value?.active_epoch || 0) || null;
        row.lastActiveEpoch = Number(details.value?.last_active_epoch || 0) || null;
        row.hasScript = details.value?.has_script === true;
        row.status = retired ? "retired" : expired ? "expired" : active ? "active" : "inactive";
      }
      if (metadata.status === "fulfilled") {
        row.transparencyScore = computeTransparencyScore(metadata.value);
        row.profile = await resolveDrepProfileFromMetadataEnvelope(metadata.value, drepMetadataPayloadCache);
        row.name = resolveName(metadata.value.json_metadata, row.id);
        if (!row.name && row.profile?.name) row.name = row.profile.name;
        if (!row.name) row.name = await resolveDrepNameFromMetadataEnvelope(metadata.value, new Map(), drepMetadataPayloadCache);
      }
    });
  }

  // --- Phase 4: Reassemble snapshot arrays ---
  const dreps = Array.from(drepById.values()).map((row) => {
    // Strip internal _dirty flag
    const { _dirty, ...clean } = row;
    return clean;
  });
  dreps.sort((a, b) => b.votingPowerAda - a.votingPowerAda);

  const committeeMembers = Array.from(ccById.values()).map((row) => {
    const { _dirty, ...clean } = row;
    return clean;
  });
  committeeMembers.sort((a, b) => b.votes.length - a.votes.length);

  const spos = Array.from(spoById.values()).map((row) => {
    const { _dirty, ...clean } = row;
    return clean;
  });
  spos.sort((a, b) => {
    const voteDelta = b.votes.length - a.votes.length;
    if (voteDelta !== 0) return voteDelta;
    return Number(b.votingPowerAda || 0) - Number(a.votingPowerAda || 0);
  });

  // Inherit epoch-boundary fields from the base snapshot (unchanged in a delta).
  return {
    ...base,
    generatedAt: new Date().toISOString(),
    latestEpoch: latestEpoch || base.latestEpoch,
    proposalCount: proposalsAll.length,
    scannedProposalCount: proposals.length,
    processedProposalCount: syncState.processedProposals,
    skippedProposalCount: newProposalSkips,
    voteFetchErrorCount: 0,
    proposalInfo,
    dreps,
    committeeMembers,
    spos,
    partial: false
  };
}

async function buildFullSnapshot() {
  const proposalsAll = await paginate("/governance/proposals", PROPOSAL_PAGE_SIZE, PROPOSAL_MAX_PAGES);
  const proposals = PROPOSAL_SCAN_LIMIT > 0 ? proposalsAll.slice(0, PROPOSAL_SCAN_LIMIT) : proposalsAll;
  const epochParams = await blockfrostGet("/epochs/latest/parameters").catch(() => null);
  const latestEpoch = await blockfrostGet("/epochs/latest").then((x) => Number(x?.epoch || 0)).catch(() => 0);
  const currentDrepPowerMap = latestEpoch > 0 ? await fetchDrepPowerForEpoch(latestEpoch).catch(() => new Map()) : new Map();
  const allDrepIds = await fetchAllDrepIdsFromBlockfrost().catch(() => new Set());
  const koiosCommitteeInfo = await koiosGet("/committee_info")
    .then((rows) => (Array.isArray(rows) && rows.length > 0 ? rows[0] : null))
    .catch(() => null);
  const thresholdContext = buildThresholdContext(epochParams);
  const blockEpochCache = new Map();

  async function getBlockEpoch(blockHash) {
    const key = String(blockHash || "");
    if (!key) return null;
    if (blockEpochCache.has(key)) return blockEpochCache.get(key);
    const block = await blockfrostGet(`/blocks/${key}`).catch(() => null);
    const epoch = Number(block?.epoch || 0);
    const value = Number.isFinite(epoch) && epoch > 0 ? epoch : null;
    blockEpochCache.set(key, value);
    return value;
  }

  const proposalInfoById = {};
  const proposalMetadataById = new Map();
  const proposalMetaById = new Map();
  const drepAggregate = new Map();
  const committeeAggregate = new Map();
  const spoAggregate = new Map();
  let skippedProposalCount = 0;
  let voteFetchErrorCount = 0;

  syncState.totalProposals = proposalsAll.length;
  syncState.scannedProposals = proposals.length;
  syncState.processedProposals = 0;

  for (let start = 0; start < proposals.length; start += SYNC_BATCH_SIZE) {
    const batch = proposals.slice(start, start + SYNC_BATCH_SIZE);
    const batchProposalIds = batch.map((proposal) => proposal.id);
    const [koiosSummaryByProposal, koiosVoteLookupByProposal, koiosSpoVoteLookupByProposal] = await Promise.all([
      fetchKoiosVotingSummariesByProposalIds(batchProposalIds).catch(() => new Map()),
      fetchKoiosVoteRationaleLookupsForProposals(batchProposalIds).catch(() => new Map()),
      fetchKoiosSpoVoteRationaleLookupsForProposals(batchProposalIds).catch(() => new Map())
    ]);
    const detailRows = await mapLimit(batch, SYNC_CONCURRENCY, async (proposal) => {
      const safeId = encodeURIComponent(proposal.id);
      try {
        const [detail, metadata, txInfo] = await Promise.all([
          blockfrostGet(`/governance/proposals/${safeId}`),
          blockfrostGet(`/governance/proposals/${safeId}/metadata`).catch(() => null),
          blockfrostGet(`/txs/${proposal.tx_hash}`).catch(() => null)
        ]);
        const koiosVotingSummary = koiosSummaryByProposal.get(proposal.id) || null;
        const koiosVoteLookup = new Map(koiosVoteLookupByProposal.get(proposal.id) || []);
        const spoKoiosLookup = koiosSpoVoteLookupByProposal.get(proposal.id) || null;
        if (spoKoiosLookup instanceof Map) {
          for (const [key, value] of spoKoiosLookup.entries()) {
            if (!koiosVoteLookup.has(key)) koiosVoteLookup.set(key, value);
          }
          if (spoKoiosLookup.__unresolved && !koiosVoteLookup.__unresolved) {
            koiosVoteLookup.__unresolved = true;
          }
        }
        const votes = await paginate(`/governance/proposals/${safeId}/votes`, PROPOSAL_VOTES_PAGE_SIZE, PROPOSAL_VOTES_MAX_PAGES)
          .catch(() => {
            voteFetchErrorCount += 1;
            return [];
          });
        return {
          proposalId: proposal.id,
          detail,
          metadata,
          blockTime: Number(txInfo?.block_time || 0),
          blockEpoch: await getBlockEpoch(txInfo?.block),
          koiosVotingSummary,
          koiosVoteLookup,
          votes
        };
      } catch (error) {
        skippedProposalCount += 1;
        return null;
      }
    });

    for (const row of detailRows.filter(Boolean)) {
      const outcome = outcomeFromProposal(row.detail);
      const governanceType = row.detail?.governance_type || "unknown";
      const text = extractProposalNameAndRationale(row.proposalId, row.detail, row.metadata);
      const drepVotes = row.votes.filter((vote) => normalizeVoteRole(vote.voter_role) === "drep");
      const committeeVotes = row.votes.filter((vote) => normalizeVoteRole(vote.voter_role) === "constitutional_committee");
      const spoVotes = row.votes.filter((vote) => normalizeVoteRole(vote.voter_role) === "stake_pool");
      let cgovCommitteeLookup = null;
      if (CC_RATIONALE_USE_CGOV_FALLBACK && committeeVotes.length > 0) {
        cgovCommitteeLookup = await fetchCgovCommitteeVoteRationaleLookupForProposal(
          row.detail?.tx_hash,
          row.detail?.cert_index
        ).catch(() => null);
      }
      let cgovDrepLookup = null;
      if (DREP_RATIONALE_USE_CGOV_FALLBACK && drepVotes.length > 0) {
        cgovDrepLookup = await fetchCgovDrepVoteRationaleLookupForProposal(
          row.detail?.tx_hash,
          row.detail?.cert_index
        ).catch(() => null);
      }
      let cgovSpoLookup = null;
      if (SPO_RATIONALE_USE_CGOV_FALLBACK && spoVotes.length > 0) {
        cgovSpoLookup = await fetchCgovSpoVoteRationaleLookupForProposal(
          row.detail?.tx_hash,
          row.detail?.cert_index
        ).catch(() => null);
      }
      const thresholdInfo = resolveThresholdInfo(row.detail?.governance_type, row.detail?.governance_description, thresholdContext);
      const voteStatsByRole = tallyVotesByRole(row.votes);
      const nomosModel = buildNomosModelFromKoiosSummary(row.koiosVotingSummary);

      proposalMetaById.set(row.proposalId, {
        blockTime: row.blockTime,
        hasDrepVotes: drepVotes.length > 0,
        hasCommitteeVotes: committeeVotes.length > 0,
        hasSpoVotes: spoVotes.length > 0
      });
      proposalMetadataById.set(row.proposalId, row.metadata || null);
      proposalInfoById[row.proposalId] = {
        actionName: text.actionName,
        rationale: text.rationaleText,
        metadataJson: row.metadata?.json_metadata || null,
        metadataUrl: row.metadata?.url || null,
        metadataHash: row.metadata?.hash || null,
        governanceType: titleCase(governanceType),
        outcome: titleCase(outcome),
        submittedAtUnix: row.blockTime || null,
        submittedAt: row.blockTime ? new Date(row.blockTime * 1000).toISOString() : null,
        submittedEpoch: row.blockEpoch || Number(row.koiosVotingSummary?.epoch_no || 0) || null,
        txHash: row.detail?.tx_hash || null,
        certIndex: row.detail?.cert_index ?? null,
        depositAda: row.detail?.deposit ? Math.floor(Number(row.detail.deposit) / 1_000_000) : 0,
        returnAddress: row.detail?.return_address || "",
        expirationEpoch: row.detail?.expiration ?? null,
        ratifiedEpoch: row.detail?.ratified_epoch ?? null,
        enactedEpoch: row.detail?.enacted_epoch ?? null,
        droppedEpoch: row.detail?.dropped_epoch ?? null,
        expiredEpoch: row.detail?.expired_epoch ?? null,
        governanceDescription: row.detail?.governance_description || null,
        koiosVotingSummary: row.koiosVotingSummary || null,
        nomosModel,
        thresholdInfo,
        voteStats: voteStatsByRole
      };

      for (const vote of drepVotes) {
        const drepId = vote.voter;
        if (!drepAggregate.has(drepId)) {
          drepAggregate.set(drepId, {
            id: drepId,
            name: "",
            status: "unknown",
            active: null,
            retired: null,
            expired: null,
            activeEpoch: null,
            lastActiveEpoch: null,
            hasScript: null,
            transparencyScore: 20,
            consistency: 0,
            totalEligibleVotes: proposals.length,
            firstVoteBlockTime: Number.MAX_SAFE_INTEGER,
            votingPowerAda: 0,
            profile: {
              name: "",
              bio: "",
              motivations: "",
              objectives: "",
              qualifications: "",
              email: "",
              imageUrl: "",
              references: []
            },
            votesByProposal: new Map()
          });
        }
        const drep = drepAggregate.get(drepId);
        drep.firstVoteBlockTime = Math.min(drep.firstVoteBlockTime, row.blockTime || Number.MAX_SAFE_INTEGER);
        if (!drep.votesByProposal.has(row.proposalId)) {
          const koiosVote = lookupKoiosVoteRationale(row.koiosVoteLookup, vote);
          const cgovVote = lookupCgovDrepVoteRationale(cgovDrepLookup, drepId, vote.tx_hash);
          const cgovHasRationale = Boolean(cgovVote?.hasRationale);
          const cgovRationaleUrl = String(cgovVote?.rationaleUrl || "").trim();
          const cgovRationaleText = cleanPlainText(String(cgovVote?.rationaleText || "").trim());
          if (cgovHasRationale || cgovRationaleText) {
            const pvKey = `${row.proposalId}|${String(drepId || "").trim().toLowerCase()}`;
            drepRationaleByProposalVoter.set(pvKey, {
              hasRationale: true,
              rationaleUrl: cgovRationaleUrl,
              rationaleText: cgovRationaleText
            });
          }
          const voteTxHash = String(vote.tx_hash || "").trim().toLowerCase();
          if (voteTxHash && (cgovHasRationale || cgovRationaleText)) {
            voteTxRationaleCache[voteTxHash] = {
              ...(voteTxRationaleCache[voteTxHash] && typeof voteTxRationaleCache[voteTxHash] === "object"
                ? voteTxRationaleCache[voteTxHash]
                : {}),
              hasRationale: cgovHasRationale || Boolean(cgovRationaleText),
              rationaleUrl: cgovRationaleUrl || String(voteTxRationaleCache[voteTxHash]?.rationaleUrl || ""),
              rationaleText: cgovRationaleText || String(voteTxRationaleCache[voteTxHash]?.rationaleText || ""),
              fetchedAt: Date.now()
            };
          }
          drep.votesByProposal.set(row.proposalId, {
            proposalId: row.proposalId,
            vote: titleCase(vote.vote),
            outcome: titleCase(outcome),
            voteTxHash: vote.tx_hash,
            hasRationale: resolveRationalePresence(vote, koiosVote, row.koiosVoteLookup) || cgovHasRationale,
            rationaleUrl: getVoteRationaleUrl(vote) || koiosVote?.rationaleUrl || cgovRationaleUrl || "",
            voterRole: normalizeVoteRole(vote.voter_role)
          });
        }
      }

      for (const vote of committeeVotes) {
        const memberId = vote.voter;
        if (!committeeAggregate.has(memberId)) {
          committeeAggregate.set(memberId, {
            id: memberId,
            name: "",
            transparencyScore: null,
            consistency: 0,
            totalEligibleVotes: proposals.length,
            firstVoteBlockTime: Number.MAX_SAFE_INTEGER,
            votingPowerAda: 0,
            koiosVoterId: "",
            votesByProposal: new Map()
          });
        }
        const member = committeeAggregate.get(memberId);
        member.firstVoteBlockTime = Math.min(member.firstVoteBlockTime, row.blockTime || Number.MAX_SAFE_INTEGER);
        if (!member.votesByProposal.has(row.proposalId)) {
          const koiosVote = lookupKoiosVoteRationale(row.koiosVoteLookup, vote);
          const cgovVote = lookupCgovCommitteeVoteRationale(cgovCommitteeLookup, vote);
          const cgovHasRationale = Boolean(cgovVote?.hasRationale);
          const cgovRationaleUrl = String(cgovVote?.rationaleUrl || "").trim();
          if (!member.koiosVoterId && typeof koiosVote?.koiosVoterId === "string") {
            member.koiosVoterId = koiosVote.koiosVoterId.trim();
          }
          const resolvedHasRationale = resolveRationalePresence(vote, koiosVote, row.koiosVoteLookup);
          member.votesByProposal.set(row.proposalId, {
            proposalId: row.proposalId,
            vote: titleCase(vote.vote),
            outcome: titleCase(outcome),
            voteTxHash: vote.tx_hash,
            hasRationale: resolvedHasRationale || cgovHasRationale,
            rationaleUrl: getVoteRationaleUrl(vote) || koiosVote?.rationaleUrl || cgovRationaleUrl || "",
            rationaleBodyLength: Number(cgovVote?.rationaleBodyLength || 0),
            rationaleSectionCount: Number(cgovVote?.rationaleSectionCount || 0),
            voterRole: normalizeVoteRole(vote.voter_role)
          });
        }
      }

      for (const vote of spoVotes) {
        const poolId = vote.voter;
        if (!spoAggregate.has(poolId)) {
          spoAggregate.set(poolId, {
            id: poolId,
            name: "",
            homepage: "",
            status: "registered",
            delegatedDrepLiteralRaw: "",
            delegatedDrepLiteral: "",
            delegationStatus: "Not delegated",
            transparencyScore: null,
            consistency: 0,
            totalEligibleVotes: proposals.length,
            firstVoteBlockTime: Number.MAX_SAFE_INTEGER,
            votingPowerAda: null,
            votesByProposal: new Map()
          });
        }
        const pool = spoAggregate.get(poolId);
        pool.firstVoteBlockTime = Math.min(pool.firstVoteBlockTime, row.blockTime || Number.MAX_SAFE_INTEGER);
        if (!pool.votesByProposal.has(row.proposalId)) {
          const koiosVote = lookupKoiosVoteRationale(row.koiosVoteLookup, vote);
          const txHash = String(vote.tx_hash || "").trim().toLowerCase();
          const cachedTxRationale = txHash ? voteTxRationaleCache[txHash] : null;
          const cachedHasRationale =
            cachedTxRationale && typeof cachedTxRationale === "object"
              ? Boolean(cachedTxRationale.hasRationale)
              : false;
          const cachedRationaleUrl =
            cachedTxRationale && typeof cachedTxRationale === "object"
              ? String(cachedTxRationale.rationaleUrl || "").trim()
              : "";
          const cgovVote = lookupCgovSpoVoteRationale(cgovSpoLookup, vote);
          const cgovHasRationale = Boolean(cgovVote?.hasRationale);
          const cgovRationaleUrl = String(cgovVote?.rationaleUrl || "").trim();
          const resolvedHasRationale = resolveRationalePresence(vote, koiosVote, row.koiosVoteLookup);
          pool.votesByProposal.set(row.proposalId, {
            proposalId: row.proposalId,
            vote: titleCase(vote.vote),
            outcome: titleCase(outcome),
            voteTxHash: vote.tx_hash,
            hasRationale: resolvedHasRationale || cachedHasRationale || cgovHasRationale,
            rationaleUrl: getVoteRationaleUrl(vote) || koiosVote?.rationaleUrl || cachedRationaleUrl || cgovRationaleUrl || "",
            voterRole: normalizeVoteRole(vote.voter_role)
          });
        }
      }
      syncState.processedProposals += 1;
    }
  }

  const neededTxHashes = new Set();
  for (const drep of drepAggregate.values()) {
    for (const vote of drep.votesByProposal.values()) {
      if (vote.voteTxHash && !voteTxTimeCache[vote.voteTxHash]) {
        neededTxHashes.add(vote.voteTxHash);
      }
    }
  }
  for (const pool of spoAggregate.values()) {
    for (const vote of pool.votesByProposal.values()) {
      if (vote.voteTxHash && !voteTxTimeCache[vote.voteTxHash]) {
        neededTxHashes.add(vote.voteTxHash);
      }
    }
  }
  for (const member of committeeAggregate.values()) {
    for (const vote of member.votesByProposal.values()) {
      if (vote.voteTxHash && !voteTxTimeCache[vote.voteTxHash]) {
        neededTxHashes.add(vote.voteTxHash);
      }
    }
  }
  const txHashesToFetch = Array.from(neededTxHashes).slice(0, VOTE_TX_TIME_MAX_LOOKUPS);
  for (let start = 0; start < txHashesToFetch.length; start += SYNC_BATCH_SIZE) {
    const batch = txHashesToFetch.slice(start, start + SYNC_BATCH_SIZE);
    await mapLimit(batch, SYNC_CONCURRENCY, async (txHash) => {
      try {
        const tx = await blockfrostGet(`/txs/${txHash}`);
        voteTxTimeCache[txHash] = Number(tx.block_time || 0);
      } catch (error) {
        voteTxTimeCache[txHash] = 0;
      }
    });
  }
  if (txHashesToFetch.length > 0) {
    saveVoteTxTimeCache();
  }

  const neededSpoRationaleTxHashes = new Set();
  for (const pool of spoAggregate.values()) {
    for (const vote of pool.votesByProposal.values()) {
      const txHash = String(vote.voteTxHash || "").trim().toLowerCase();
      if (!txHash) continue;
      if (vote.hasRationale === true) continue;
      if (String(vote.rationaleUrl || "").trim()) continue;
      if (voteTxRationaleCache[txHash] && voteTxRationaleCache[txHash].hasRationale) {
        vote.hasRationale = true;
        vote.rationaleUrl = String(voteTxRationaleCache[txHash].rationaleUrl || "").trim();
        continue;
      }
      neededSpoRationaleTxHashes.add(txHash);
    }
  }
  const spoRationaleHashes = Array.from(neededSpoRationaleTxHashes).slice(0, VOTE_TX_RATIONALE_MAX_LOOKUPS);
  const rationaleFetchStartedAt = Date.now();
  for (let start = 0; start < spoRationaleHashes.length; start += SYNC_BATCH_SIZE) {
    if (Date.now() - rationaleFetchStartedAt >= VOTE_TX_RATIONALE_MAX_DURATION_MS) break;
    const batch = spoRationaleHashes.slice(start, start + SYNC_BATCH_SIZE);
    await mapLimit(batch, SYNC_CONCURRENCY, async (txHash) => {
      await fetchTxRationaleFromBlockfrost(txHash).catch(() => null);
    });
  }
  if (spoRationaleHashes.length > 0) {
    for (const pool of spoAggregate.values()) {
      for (const vote of pool.votesByProposal.values()) {
        const txHash = String(vote.voteTxHash || "").trim().toLowerCase();
        if (!txHash) continue;
        const cached = voteTxRationaleCache[txHash];
        if (!cached || typeof cached !== "object") continue;
        if (!vote.hasRationale && cached.hasRationale) {
          vote.hasRationale = true;
        }
        if (!String(vote.rationaleUrl || "").trim() && String(cached.rationaleUrl || "").trim()) {
          vote.rationaleUrl = String(cached.rationaleUrl || "").trim();
        }
      }
    }
    saveVoteTxRationaleCache();
  }

  const drepIds = Array.from(drepAggregate.keys());
  const drepMetadataUrlNameCache = new Map();
  const drepMetadataPayloadCache = new Map();
  for (let start = 0; start < drepIds.length; start += SYNC_BATCH_SIZE) {
    const batch = drepIds.slice(start, start + SYNC_BATCH_SIZE);
    await mapLimit(batch, SYNC_CONCURRENCY, async (drepId) => {
      const safeId = encodeURIComponent(drepId);
      const [details, metadata] = await Promise.allSettled([
        blockfrostGet(`/governance/dreps/${safeId}`),
        blockfrostGet(`/governance/dreps/${safeId}/metadata`)
      ]);
      const row = drepAggregate.get(drepId);
      if (!row) return;
      if (details.status === "fulfilled") {
        row.votingPowerAda = Math.floor(Number(details.value.amount || 0) / 1_000_000);
        const active = details.value?.active === true;
        const retired = details.value?.retired === true;
        const expired = details.value?.expired === true;
        row.active = active;
        row.retired = retired;
        row.expired = expired;
        row.activeEpoch = Number(details.value?.active_epoch || 0) || null;
        row.lastActiveEpoch = Number(details.value?.last_active_epoch || 0) || null;
        row.hasScript = details.value?.has_script === true;
        row.status = retired ? "retired" : expired ? "expired" : active ? "active" : "inactive";
      }
      if (metadata.status === "fulfilled") {
        row.transparencyScore = computeTransparencyScore(metadata.value);
        row.profile = await resolveDrepProfileFromMetadataEnvelope(metadata.value, drepMetadataPayloadCache);
        row.name = resolveName(metadata.value.json_metadata, row.id);
        if (!row.name && row.profile?.name) {
          row.name = row.profile.name;
        }
        if (!row.name) {
          row.name = await resolveDrepNameFromMetadataEnvelope(
            metadata.value,
            drepMetadataUrlNameCache,
            drepMetadataPayloadCache
          );
        }
      }
    });
  }

  const dreps = [];
  for (const row of drepAggregate.values()) {
    row.votes = Array.from(row.votesByProposal.values()).map((vote) => {
      const submittedAt = Number(proposalMetaById.get(vote.proposalId)?.blockTime || 0);
      const votedAt = Number(voteTxTimeCache[vote.voteTxHash] || 0);
      const responseHours =
        submittedAt > 0 && votedAt >= submittedAt
          ? (votedAt - submittedAt) / 3600
          : null;
      return {
        proposalId: vote.proposalId,
        vote: vote.vote,
        outcome: vote.outcome,
        voteTxHash: vote.voteTxHash || "",
        hasRationale: vote.hasRationale === null ? null : Boolean(vote.hasRationale),
        rationaleUrl: vote.rationaleUrl || "",
        voterRole: vote.voterRole || "drep",
        responseHours,
        votedAtUnix: votedAt || null,
        votedAt: votedAt ? new Date(votedAt * 1000).toISOString() : null
      };
    });
    delete row.votesByProposal;
    const comparable = row.votes.filter((vote) => {
      const o = String(vote.outcome).toLowerCase();
      return o === "yes" || o === "no";
    });
    if (comparable.length > 0) {
      const hits = comparable.filter((vote) => String(vote.vote).toLowerCase() === String(vote.outcome).toLowerCase()).length;
      row.consistency = (hits / comparable.length) * 100;
    }
    if (Number.isFinite(row.firstVoteBlockTime)) {
      let eligible = 0;
      for (const meta of proposalMetaById.values()) {
        if (!meta.hasCommitteeVotes) continue;
        if ((meta.blockTime || 0) >= row.firstVoteBlockTime) eligible += 1;
      }
      row.totalEligibleVotes = Math.max(eligible, row.votes.length, 1);
    } else {
      row.totalEligibleVotes = Math.max(row.votes.length, 1);
    }
    dreps.push(row);
  }

  for (const [drepId, powerAdaRaw] of currentDrepPowerMap.entries()) {
    const exists = drepAggregate.get(drepId);
    if (exists) continue;
    const powerAda = Number(powerAdaRaw || 0);
    dreps.push({
      id: drepId,
      name: "",
      status: "unknown",
      active: null,
      retired: null,
      expired: null,
      activeEpoch: null,
      lastActiveEpoch: null,
      hasScript: null,
      transparencyScore: 20,
      consistency: 0,
      totalEligibleVotes: Math.max(proposals.length, 1),
      firstVoteBlockTime: Number.MAX_SAFE_INTEGER,
      votingPowerAda: Number.isFinite(powerAda) ? Math.max(0, powerAda) : 0,
      profile: {
        name: "",
        bio: "",
        motivations: "",
        objectives: "",
        qualifications: "",
        email: "",
        imageUrl: "",
        references: []
      },
      votes: []
    });
  }

  for (const drepId of allDrepIds) {
    if (!drepId || drepAggregate.has(drepId)) continue;
    const powerAda = Number(currentDrepPowerMap.get(drepId) || 0);
    dreps.push({
      id: drepId,
      name: "",
      status: "unknown",
      active: null,
      retired: null,
      expired: null,
      activeEpoch: null,
      lastActiveEpoch: null,
      hasScript: null,
      transparencyScore: 20,
      consistency: 0,
      totalEligibleVotes: Math.max(proposals.length, 1),
      firstVoteBlockTime: Number.MAX_SAFE_INTEGER,
      votingPowerAda: Number.isFinite(powerAda) ? Math.max(0, powerAda) : 0,
      profile: {
        name: "",
        bio: "",
        motivations: "",
        objectives: "",
        qualifications: "",
        email: "",
        imageUrl: "",
        references: []
      },
      votes: []
    });
  }

  if (currentDrepPowerMap.size > 0) {
    for (const row of dreps) {
      if (currentDrepPowerMap.has(row.id)) {
        row.votingPowerAda = Number(currentDrepPowerMap.get(row.id) || 0);
      }
    }
  }

  dreps.sort((a, b) => b.votingPowerAda - a.votingPowerAda);

  const committeeMembers = [];
  const committeeRosterByHotHex = new Map();
  if (koiosCommitteeInfo && Array.isArray(koiosCommitteeInfo.members)) {
    for (const member of koiosCommitteeInfo.members) {
      const hotHex = String(member?.cc_hot_hex || "").toLowerCase();
      if (hotHex) committeeRosterByHotHex.set(hotHex, member);
    }
  }
  const seatStartByColdHash = new Map();
  const latestEnactedCommitteeByCredential = new Map();
  const latestEnactedCredentialByName = new Map();
  for (const info of Object.values(proposalInfoById)) {
    const gType = String(info?.governanceType || "").toLowerCase();
    if (!gType.includes("new committee")) continue;
    const enacted = Number(info?.enactedEpoch);
    if (!Number.isFinite(enacted) || enacted <= 0) continue;
    const hashes = collectHexHashes(info?.governanceDescription || {});
    for (const h of hashes) {
      const current = seatStartByColdHash.get(h);
      if (!Number.isFinite(current) || enacted > current) {
        seatStartByColdHash.set(h, enacted);
      }
    }
  }
  const enactedCommitteeProposals = Object.entries(proposalInfoById)
    .map(([proposalId, info]) => ({ proposalId, info }))
    .filter(({ info }) => {
      const gType = String(info?.governanceType || "").toLowerCase();
      const enacted = Number(info?.enactedEpoch || 0);
      return gType.includes("new committee") && Number.isFinite(enacted) && enacted > 0;
    })
    .sort((a, b) => Number(b.info?.enactedEpoch || 0) - Number(a.info?.enactedEpoch || 0));

  // Auto-detect retirement points from enacted committee transitions:
  // if a credential appears in one enacted roster and is absent in the next,
  // treat the end of the previous epoch as the effective retirement epoch.
  const committeeRetirementEpochByCredential = new Map();
  const enactedCommitteeTimeline = [];
  for (const { proposalId, info } of [...enactedCommitteeProposals].sort(
    (a, b) => Number(a.info?.enactedEpoch || 0) - Number(b.info?.enactedEpoch || 0)
  )) {
    const enactedEpoch = Number(info?.enactedEpoch || 0);
    if (!Number.isFinite(enactedEpoch) || enactedEpoch <= 0) continue;
    const meta = proposalMetadataById.get(proposalId);
    const parsedMap = parseCommitteeMetadataNameMap(meta);
    const credentials = new Set(
      Array.from(parsedMap.keys())
        .map((k) => String(k || "").trim().toLowerCase())
        .filter((k) => k.startsWith("cc_hot1") || k.startsWith("cc_cold1"))
    );
    if (credentials.size === 0) continue;
    enactedCommitteeTimeline.push({ enactedEpoch, credentials });
  }
  for (let i = 0; i < enactedCommitteeTimeline.length - 1; i += 1) {
    const current = enactedCommitteeTimeline[i];
    const next = enactedCommitteeTimeline[i + 1];
    const retirementEpoch = Number(next.enactedEpoch) - 1;
    if (!Number.isFinite(retirementEpoch) || retirementEpoch <= 0) continue;
    for (const credential of current.credentials) {
      if (next.credentials.has(credential)) continue;
      const existing = Number(committeeRetirementEpochByCredential.get(credential) || 0);
      if (!Number.isFinite(existing) || existing <= 0 || retirementEpoch > existing) {
        committeeRetirementEpochByCredential.set(credential, retirementEpoch);
      }
    }
  }

  for (const { proposalId } of enactedCommitteeProposals) {
    const meta = proposalMetadataById.get(proposalId);
    const parsedMap = parseCommitteeMetadataNameMap(meta);
    for (const [k, v] of parsedMap.entries()) {
      if (!latestEnactedCommitteeByCredential.has(k)) {
        latestEnactedCommitteeByCredential.set(k, v);
      }
      const key = String(v || "").toLowerCase();
      if (!latestEnactedCredentialByName.has(key)) {
        latestEnactedCredentialByName.set(key, { cold: "", hot: "" });
      }
      const entry = latestEnactedCredentialByName.get(key);
      if (k.startsWith("cc_cold1") && !entry.cold) entry.cold = k;
      if (k.startsWith("cc_hot1") && !entry.hot) entry.hot = k;
    }
  }
  const CONWAY_GENESIS_EPOCH = 507;
  const ccNameCache = new Map();

  for (const row of committeeAggregate.values()) {
    row.votes = Array.from(row.votesByProposal.values()).map((vote) => {
      const submittedAt = Number(proposalMetaById.get(vote.proposalId)?.blockTime || 0);
      const votedAt = Number(voteTxTimeCache[vote.voteTxHash] || 0);
      const responseHours =
        submittedAt > 0 && votedAt >= submittedAt
          ? (votedAt - submittedAt) / 3600
          : null;
      return {
        proposalId: vote.proposalId,
        vote: vote.vote,
        outcome: vote.outcome,
        voteTxHash: vote.voteTxHash || "",
        hasRationale: vote.hasRationale === null ? null : Boolean(vote.hasRationale),
        rationaleUrl: vote.rationaleUrl || "",
        rationaleBodyLength: Number(vote.rationaleBodyLength || 0),
        rationaleSectionCount: Number(vote.rationaleSectionCount || 0),
        voterRole: vote.voterRole || "constitutional_committee",
        responseHours,
        votedAtUnix: votedAt || null,
        votedAt: votedAt ? new Date(votedAt * 1000).toISOString() : null
      };
    });
    delete row.votesByProposal;
    const comparable = row.votes.filter((vote) => {
      const o = String(vote.outcome).toLowerCase();
      return o === "yes" || o === "no";
    });
    if (comparable.length > 0) {
      const hits = comparable.filter((vote) => String(vote.vote).toLowerCase() === String(vote.outcome).toLowerCase()).length;
      row.consistency = (hits / comparable.length) * 100;
    }
    if (Number.isFinite(row.firstVoteBlockTime)) {
      let eligible = 0;
      for (const meta of proposalMetaById.values()) {
        if (!meta.hasDrepVotes) continue;
        if ((meta.blockTime || 0) >= row.firstVoteBlockTime) eligible += 1;
      }
      row.totalEligibleVotes = Math.max(eligible, row.votes.length, 1);
    } else {
      row.totalEligibleVotes = Math.max(row.votes.length, 1);
    }

    // Try the roster lookup with the raw ID first, then fall back to the hex
    // conversion of a bech32 ID — Blockfrost returns cc_hot1… bech32 but the
    // Koios roster map is keyed by the underlying hex.
    const rowIdRaw = String(row.id || "").toLowerCase();
    const rowIdHexFromBech32 = bech32IdToHex(String(row.id || "")).toLowerCase();
    const rosterMember =
      committeeRosterByHotHex.get(rowIdRaw) ||
      (rowIdHexFromBech32 ? committeeRosterByHotHex.get(rowIdHexFromBech32) : null) ||
      null;
    row.hotCredential = rosterMember?.cc_hot_id || null;
    row.coldCredential = rosterMember?.cc_cold_id || null;
    // If row.id is itself a bech32 hot credential use it directly — this is
    // the common case when Blockfrost returns the voter as cc_hot1… and the
    // Koios roster lookup above still came up empty (e.g. key rotation).
    if (!row.hotCredential && rowIdRaw.startsWith("cc_hot")) {
      row.hotCredential = String(row.id).trim();
    }
    if (!row.hotCredential && typeof row.koiosVoterId === "string" && row.koiosVoterId.startsWith("cc_hot1")) {
      row.hotCredential = row.koiosVoterId;
    }
    if (!row.coldCredential && typeof row.koiosVoterId === "string" && row.koiosVoterId.startsWith("cc_cold1")) {
      row.coldCredential = row.koiosVoterId;
    }
    if (!row.coldCredential && row.hotCredential && CC_COLD_OVERRIDES_BY_HOT[row.hotCredential]) {
      row.coldCredential = CC_COLD_OVERRIDES_BY_HOT[row.hotCredential];
    }
    const coldHex =
      String(rosterMember?.cc_cold_hex || "").toLowerCase() ||
      bech32IdToHex(String(rosterMember?.cc_cold_id || "")).toLowerCase();
    row.hotHex = String(rosterMember?.cc_hot_hex || "").toLowerCase() || null;
    row.coldHex = coldHex || null;
    row.expirationEpoch = Number.isFinite(Number(rosterMember?.expiration_epoch)) ? Number(rosterMember.expiration_epoch) : null;
    const isAuthorized = String(rosterMember?.status || "").toLowerCase() === "authorized";
    const hasRoster = Boolean(rosterMember);
    const isActive = isAuthorized && row.expirationEpoch !== null && latestEpoch > 0 ? row.expirationEpoch > latestEpoch : false;

    if (hasRoster) {
      row.status = isActive ? "active" : "expired";
    } else {
      const hasRecentVote = row.votes.some((vote) => {
        const submittedEpoch = Number(proposalInfoById?.[vote.proposalId]?.submittedEpoch || 0);
        return latestEpoch > 0 && Number.isFinite(submittedEpoch) && submittedEpoch >= Math.max(0, latestEpoch - 12);
      });
      row.status = hasRecentVote ? "active" : "expired";
    }
    row.seatStartEpoch = coldHex ? seatStartByColdHash.get(coldHex) || null : null;

    committeeMembers.push(row);
  }

  const ccRowsNeedingName = committeeMembers.filter((row) => !row.name && row.hotCredential);
  await mapLimit(ccRowsNeedingName, Math.max(1, Math.min(3, SYNC_CONCURRENCY)), async (row) => {
    if (!row.hotCredential) return;
    if (!ccNameCache.has(row.hotCredential)) {
      const resolved = await resolveCommitteeMemberNameFromKoiosVoteMeta(row.hotCredential);
      ccNameCache.set(row.hotCredential, resolved || "");
    }
    row.name = ccNameCache.get(row.hotCredential) || row.name || "";
  });

  for (const row of committeeMembers) {
    if (!row.hotCredential) {
      const rowIdHex = String(row.id || "").trim().toLowerCase();
      const rowHotHex = String(row.hotHex || "").trim().toLowerCase();
      const mappedHot = CC_HOT_HEX_TO_HOT_CREDENTIAL[rowIdHex] || CC_HOT_HEX_TO_HOT_CREDENTIAL[rowHotHex] || "";
      if (mappedHot) row.hotCredential = mappedHot;
    }
    const aliases = [
      row.hotCredential,
      row.coldCredential,
      row.hotHex,
      row.coldHex,
      row.id,
      row.id ? `keyHash-${row.id}` : "",
      row.id ? `scriptHash-${row.id}` : ""
    ]
      .filter(Boolean)
      .map((x) => String(x).toLowerCase());
    if (!row.name) {
      for (const a of aliases) {
        const mapped = latestEnactedCommitteeByCredential.get(a);
        if (mapped) {
          row.name = mapped;
          break;
        }
      }
    }
    if (!row.coldCredential) {
      for (const a of aliases) {
        if (a.startsWith("cc_cold1")) {
          row.coldCredential = a;
          break;
        }
      }
    }
    if (!row.hotCredential) {
      for (const a of aliases) {
        if (a.startsWith("cc_hot1")) {
          row.hotCredential = a;
          break;
        }
      }
    }
    if (!row.coldCredential && row.hotCredential && CC_COLD_OVERRIDES_BY_HOT[row.hotCredential]) {
      row.coldCredential = CC_COLD_OVERRIDES_BY_HOT[row.hotCredential];
    }
    if (row.name) {
      const byName = latestEnactedCredentialByName.get(String(row.name).toLowerCase());
      if (byName) {
        if (!row.coldCredential && byName.cold) row.coldCredential = byName.cold;
        if (!row.hotCredential && byName.hot) row.hotCredential = byName.hot;
      }
    }
    if (!row.name && row.hotCredential && CC_NAME_OVERRIDES_BY_HOT[row.hotCredential]) {
      row.name = CC_NAME_OVERRIDES_BY_HOT[row.hotCredential];
    }
    // Canonicalize known CC labels by hot credential, even if a source already provided a name.
    if (row.hotCredential && CC_NAME_OVERRIDES_BY_HOT[row.hotCredential]) {
      row.name = CC_NAME_OVERRIDES_BY_HOT[row.hotCredential];
    }
    const hotKey = String(row.hotCredential || "").toLowerCase();
    const nameKey = String(row.name || "").trim().toLowerCase();
    const epochOverride = CC_EPOCH_OVERRIDES_BY_HOT[hotKey] || CC_EPOCH_OVERRIDES_BY_NAME[nameKey] || null;
    if (epochOverride) {
      if (Number.isFinite(Number(epochOverride.seatStartEpoch))) {
        row.seatStartEpoch = Number(epochOverride.seatStartEpoch);
      }
      if (Number.isFinite(Number(epochOverride.expirationEpoch))) {
        row.expirationEpoch = Number(epochOverride.expirationEpoch);
      }
      if (typeof epochOverride.status === "string" && epochOverride.status.trim()) {
        row.status = String(epochOverride.status).trim().toLowerCase();
      } else if (row.expirationEpoch !== null && latestEpoch > 0) {
        row.status = row.expirationEpoch > latestEpoch ? "active" : "expired";
      }
    }
    const name = String(row.name || "").trim();
    const isEasternCardanoCouncil = /eastern\s+cardano\s+council/i.test(name);
    const isLegacyCardanoJapan = /^cardano\s+japan$/i.test(name);
    if (isEasternCardanoCouncil || isLegacyCardanoJapan) {
      row.seatStartEpoch = CONWAY_GENESIS_EPOCH;
    }
    const isCardanoAtlanticCouncil = /cardano\s+atlantic\s+council/i.test(String(row.name || ""));
    if (isCardanoAtlanticCouncil) row.status = "retired";

    const retirementEpochCandidates = [
      String(row.hotCredential || "").toLowerCase(),
      String(row.coldCredential || "").toLowerCase()
    ]
      .map((credential) => Number(committeeRetirementEpochByCredential.get(credential) || 0))
      .filter((epoch) => Number.isFinite(epoch) && epoch > 0);
    if (retirementEpochCandidates.length > 0) {
      const autoRetirementEpoch = Math.min(...retirementEpochCandidates);
      row.expirationEpoch = Number.isFinite(Number(row.expirationEpoch))
        ? Math.min(Number(row.expirationEpoch), autoRetirementEpoch)
        : autoRetirementEpoch;
      if (latestEpoch > 0 && autoRetirementEpoch < latestEpoch) {
        row.status = "retired";
      }
    }
  }

  // Preserve known identity/seat metadata for legacy members when live enrichment is incomplete.
  const latestHistorySnapshot = readLatestSnapshotFromHistory();
  const historyCommitteeRows = Array.isArray(latestHistorySnapshot?.committeeMembers)
    ? latestHistorySnapshot.committeeMembers
    : [];
  const historyByAlias = new Map();
  for (const hr of historyCommitteeRows) {
    const aliases = [
      hr?.id,
      hr?.hotCredential,
      hr?.coldCredential,
      hr?.hotHex,
      hr?.coldHex
    ]
      .map((x) => String(x || "").trim().toLowerCase())
      .filter(Boolean);
    for (const alias of aliases) {
      if (!historyByAlias.has(alias)) historyByAlias.set(alias, hr);
    }
  }
  for (const row of committeeMembers) {
    const aliases = [
      row?.id,
      row?.hotCredential,
      row?.coldCredential,
      row?.hotHex,
      row?.coldHex
    ]
      .map((x) => String(x || "").trim().toLowerCase())
      .filter(Boolean);
    let match = null;
    for (const alias of aliases) {
      if (historyByAlias.has(alias)) {
        match = historyByAlias.get(alias);
        break;
      }
    }
    if (!match) continue;
    if (!row.name && match.name) row.name = match.name;
    if (!row.hotCredential && match.hotCredential) row.hotCredential = match.hotCredential;
    if (!row.coldCredential && match.coldCredential) row.coldCredential = match.coldCredential;
    if (!row.seatStartEpoch && Number.isFinite(Number(match.seatStartEpoch))) {
      row.seatStartEpoch = Number(match.seatStartEpoch);
    }
    if (!row.expirationEpoch && Number.isFinite(Number(match.expirationEpoch))) {
      row.expirationEpoch = Number(match.expirationEpoch);
    }
  }
  committeeMembers.sort((a, b) => b.votes.length - a.votes.length);

  const spos = [];
  for (const row of spoAggregate.values()) {
    row.votes = Array.from(row.votesByProposal.values()).map((vote) => {
      const submittedAt = Number(proposalMetaById.get(vote.proposalId)?.blockTime || 0);
      const votedAt = Number(voteTxTimeCache[vote.voteTxHash] || 0);
      const responseHours =
        submittedAt > 0 && votedAt >= submittedAt
          ? (votedAt - submittedAt) / 3600
          : null;
      return {
        proposalId: vote.proposalId,
        vote: vote.vote,
        outcome: vote.outcome,
        voteTxHash: vote.voteTxHash || "",
        hasRationale: vote.hasRationale === null ? null : Boolean(vote.hasRationale),
        rationaleUrl: vote.rationaleUrl || "",
        voterRole: vote.voterRole || "stake_pool",
        responseHours,
        votedAtUnix: votedAt || null,
        votedAt: votedAt ? new Date(votedAt * 1000).toISOString() : null
      };
    });
    delete row.votesByProposal;
    const comparable = row.votes.filter((vote) => {
      const o = String(vote.outcome).toLowerCase();
      return o === "yes" || o === "no";
    });
    if (comparable.length > 0) {
      const hits = comparable.filter((vote) => String(vote.vote).toLowerCase() === String(vote.outcome).toLowerCase()).length;
      row.consistency = (hits / comparable.length) * 100;
    }
    if (Number.isFinite(row.firstVoteBlockTime)) {
      let eligible = 0;
      for (const meta of proposalMetaById.values()) {
        if (!meta.hasSpoVotes) continue;
        if ((meta.blockTime || 0) >= row.firstVoteBlockTime) eligible += 1;
      }
      row.totalEligibleVotes = Math.max(eligible, row.votes.length, 1);
    } else {
      row.totalEligibleVotes = Math.max(row.votes.length, 1);
    }
    spos.push(row);
  }
  const spoRoster = await fetchSpoGovernanceFallbackRows(SPO_FALLBACK_LIMIT).catch(() => []);
  const spoRosterById = new Map(
    (Array.isArray(spoRoster) ? spoRoster : [])
      .map((row) => [String(row?.id || "").trim(), row])
      .filter(([id]) => Boolean(id))
  );
  for (const row of spos) {
    const profile = spoRosterById.get(String(row.id || "").trim());
    if (!profile) continue;
    if (!row.name && profile.name) row.name = String(profile.name || "").trim();
    if (!row.homepage && profile.homepage) row.homepage = String(profile.homepage || "").trim();
    if (!row.delegatedDrepLiteralRaw && profile.delegatedDrepLiteralRaw) {
      row.delegatedDrepLiteralRaw = String(profile.delegatedDrepLiteralRaw || "").trim();
      row.delegatedDrepLiteral = String(profile.delegatedDrepLiteral || "").trim();
      row.delegationStatus = String(profile.delegationStatus || "").trim() || row.delegationStatus || "Unknown";
    }
    if ((row.votingPowerAda === null || row.votingPowerAda === undefined || row.votingPowerAda <= 0) && Number.isFinite(Number(profile?.votingPowerAda))) {
      row.votingPowerAda = Math.max(0, Number(profile.votingPowerAda));
    }
  }
  if (Array.isArray(spoRoster) && spoRoster.length > 0) {
    const seen = new Set(spos.map((row) => String(row.id || "").trim()));
    for (const pool of spoRoster) {
      const poolId = String(pool?.id || "").trim();
      if (!poolId || seen.has(poolId)) continue;
      seen.add(poolId);
      spos.push({
        id: poolId,
        name: String(pool?.name || "").trim(),
        homepage: String(pool?.homepage || "").trim(),
        status: String(pool?.status || "").trim().toLowerCase() || "registered",
        delegatedDrepLiteralRaw: String(pool?.delegatedDrepLiteralRaw || "").trim(),
        delegatedDrepLiteral: String(pool?.delegatedDrepLiteral || "").trim(),
        delegationStatus: String(pool?.delegationStatus || "").trim() || "Unknown",
        transparencyScore: null,
        consistency: 0,
        totalEligibleVotes: 0,
        firstVoteBlockTime: Number.MAX_SAFE_INTEGER,
        votingPowerAda: Number.isFinite(Number(pool?.votingPowerAda)) ? Math.max(0, Number(pool.votingPowerAda)) : 0,
        votes: []
      });
    }
  }
  spos.sort((a, b) => {
    const voteDelta = Number((b?.votes || []).length) - Number((a?.votes || []).length);
    if (voteDelta !== 0) return voteDelta;
    return Number(b.votingPowerAda || 0) - Number(a.votingPowerAda || 0);
  });

  const specialDreps = await fetchSpecialDreps(true);

  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    latestEpoch,
    drepParticipationStartEpoch: DREP_PARTICIPATION_START_EPOCH,
    proposalCount: proposalsAll.length,
    scannedProposalCount: proposals.length,
    processedProposalCount: syncState.processedProposals,
    skippedProposalCount,
    voteFetchErrorCount,
    partial: skippedProposalCount > 0 || voteFetchErrorCount > 0 || proposals.length < proposalsAll.length,
    notice: proposals.length < proposalsAll.length
      ? "Snapshot built from scanned proposal window. Increase PROPOSAL_SCAN_LIMIT for fuller history."
      : "",
    thresholdContext,
    proposalInfo: proposalInfoById,
    specialDreps,
    dreps: DREP_LIMIT > 0 ? dreps.slice(0, DREP_LIMIT) : dreps,
    committeeMembers,
    spos
  };
}

function publishSnapshot(payload) {
  if (!payload || typeof payload !== "object") return;
  snapshot = payload;
  // Always recompute thresholds so code changes take effect without a
  // manual snapshot wipe.
  refreshAllThresholdInfo(snapshot);
  saveSnapshotToDisk(snapshot);
  warmDrepRationaleCacheFromSnapshot(snapshot).catch(() => null);
  backfillEpochSnapshotsFromCurrent(false);
}

function promotePendingSnapshot() {
  if (!pendingSnapshot) return;
  const candidate = pickBestSnapshotForApi(pendingSnapshot);
  if (!snapshotIsComplete(candidate)) return;
  publishSnapshot(candidate);
  pendingSnapshot = null;
  pendingSnapshotBuiltAt = null;
}

function scheduleDailyUtcHours(hours, label, callback) {
  if (!Array.isArray(hours) || hours.length === 0) return;
  const scheduleNext = () => {
    const now = new Date();
    const nowMs = now.getTime();
    let next = null;
    for (const hour of hours) {
      const candidate = new Date(now);
      candidate.setUTCHours(hour, 0, 0, 0);
      if (candidate.getTime() <= nowMs) {
        candidate.setUTCDate(candidate.getUTCDate() + 1);
      }
      if (!next || candidate.getTime() < next.getTime()) {
        next = candidate;
      }
    }
    const waitMs = Math.max(1000, next.getTime() - nowMs);
    setTimeout(async () => {
      try {
        await callback();
      } catch (error) {
        syncState.lastError = `${label} scheduler error: ${error.message || error}`;
      } finally {
        scheduleNext();
      }
    }, waitMs);
  };
  scheduleNext();
}

async function runSync(options = {}) {
  if (syncState.syncing) return;
  if (!BLOCKFROST_API_KEY) {
    syncState.lastError = "Missing BLOCKFROST_API_KEY environment variable.";
    return;
  }

  syncState.syncing = true;
  syncState.lastStartedAt = new Date().toISOString();
  syncState.lastError = null;

  try {
    const base = pickBestSnapshotForApi(snapshot);
    const baseEpoch = Number(base?.latestEpoch || 0);
    const lastEpoch = Number(syncState.lastEpochAtSync || 0);

    // Use incremental delta when:
    //   - We have a complete existing snapshot to build on, AND
    //   - The epoch has not advanced since the last sync (no boundary crossing)
    //   - Not explicitly forced to do a full rebuild
    const canDelta =
      !options.forceFull &&
      snapshotIsComplete(base) &&
      baseEpoch > 0 &&
      (lastEpoch === 0 || baseEpoch === lastEpoch);

    let fresh;
    if (canDelta) {
      syncState.lastSyncMode = "delta";
      fresh = await buildDeltaSnapshot(base);
    } else {
      syncState.lastSyncMode = "full";
      fresh = await buildFullSnapshot();
    }

    const candidate = pickBestSnapshotForApi(fresh);
    const currentServed = pickBestSnapshotForApi(snapshot);
    const canPromoteNow = snapshotIsComplete(candidate) || !snapshotIsComplete(currentServed);

    // Always publish immediately (user preference: option 3).
    if (canPromoteNow) {
      publishSnapshot(candidate);
    } else {
      pendingSnapshot = candidate;
      pendingSnapshotBuiltAt = new Date().toISOString();
    }

    syncState.lastCompletedAt = new Date().toISOString();
    syncState.lastEpochAtSync = Number(candidate?.latestEpoch || fresh?.latestEpoch || baseEpoch || 0);
  } catch (error) {
    syncState.lastError = error.message;
  } finally {
    syncState.syncing = false;
  }
}

function startScheduler() {
  // How often to poll for new votes (delta syncs).  Default: 3 minutes.
  const DELTA_POLL_MS = Number(process.env.DELTA_POLL_MS || 3 * 60 * 1000);

  // How often to force a full rebuild (epoch boundary check).
  // The full rebuild also runs automatically whenever the epoch advances.
  // This is a safety-net interval (default: once per day) in case the epoch
  // check inside runSync misses a boundary due to API errors.
  const FULL_REBUILD_INTERVAL_MS = Number(process.env.FULL_REBUILD_INTERVAL_MS || 24 * 60 * 60 * 1000);

  // How many times to retry the startup full sync if it produces incomplete data.
  const STARTUP_MAX_RETRIES = Number(process.env.STARTUP_MAX_RETRIES || 3);

  // How long to wait between startup retry attempts (default: 30 seconds).
  const STARTUP_RETRY_DELAY_MS = Number(process.env.STARTUP_RETRY_DELAY_MS || 30 * 1000);

  // Wait for the current sync to finish before checking results.
  async function waitForSync() {
    while (syncState.syncing) {
      await sleep(1000);
    }
  }

  // Run the initial sync with retries, then start ongoing polling.
  // If a complete seed/snapshot is already loaded we run a delta so startup
  // is near-instant; otherwise we force a full rebuild to populate everything.
  // Delta polling is deferred until the first sync completes so deltas always
  // have a complete base to build on.
  async function runStartupSync() {
    for (let attempt = 1; attempt <= STARTUP_MAX_RETRIES; attempt++) {
      const base = pickBestSnapshotForApi(snapshot);
      runSync({ forceFull: !snapshotIsComplete(base) });
      await waitForSync();

      const served = pickBestSnapshotForApi(snapshot);
      if (snapshotIsComplete(served)) break;

      if (attempt < STARTUP_MAX_RETRIES) {
        await sleep(STARTUP_RETRY_DELAY_MS);
      }
    }

    // Start regular polling only after the initial full sync has settled.
    setInterval(() => runSync(), DELTA_POLL_MS);

    // Daily safety-net full rebuild (catches any drift / epoch rollover that
    // the epoch-change detection inside runSync might have missed).
    setInterval(() => runSync({ forceFull: true }), FULL_REBUILD_INTERVAL_MS);
  }

  setTimeout(runStartupSync, SYNC_STARTUP_DELAY_MS);
}

function serveStatic(req, res) {
  const root = fs.existsSync(path.join(FRONTEND_DIST_PATH, "index.html")) ? FRONTEND_DIST_PATH : __dirname;
  let requestPath = req.url === "/" ? "/index.html" : req.url;
  requestPath = requestPath.split("?")[0];
  const filePath = path.join(root, requestPath);
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, content) => {
    if (!error) {
      const ext = path.extname(filePath).toLowerCase();
      // Vite outputs content-hashed filenames (e.g. main-Ab3xY1.js) for all
      // assets under /assets/. These can be cached indefinitely — if the content
      // changes, the hash changes and the browser fetches a fresh URL.
      const isHashedAsset = /\/assets\/[^/]+\.[a-f0-9]{8,}\.(js|css|svg|png|woff2?)$/i.test(filePath);
      const cacheControl = isHashedAsset
        ? "public, max-age=31536000, immutable"
        : "no-cache";
      res.writeHead(200, {
        "Content-Type": contentTypes[ext] || "application/octet-stream",
        "Cache-Control": cacheControl,
      });
      res.end(content);
      return;
    }
    if (root === FRONTEND_DIST_PATH) {
      const spaIndex = path.join(FRONTEND_DIST_PATH, "index.html");
      fs.readFile(spaIndex, (idxErr, idxContent) => {
        if (idxErr) {
          res.writeHead(404);
          res.end("Not Found");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
        res.end(idxContent);
      });
      return;
    }
    res.writeHead(404);
    res.end("Not Found");
  });
}

loadSnapshotFromDisk();
// If the live snapshot is absent or incomplete (ephemeral filesystem after
// a cold start) fall back to the committed seed so the first delta sync has
// a complete base and startup is near-instant.
if (!snapshotIsComplete(snapshot)) {
  loadSeedSnapshot();
}
loadVoteTxTimeCache();
// Now that the tx-time cache is loaded, backfill any votes in the snapshot
// that were saved before their timestamps were cached.  This repairs data
// on ephemeral deployments that start from the seed snapshot.
backfillVoteTimestampsFromCache(snapshot.dreps, snapshot.proposalInfo);
backfillVoteTimestampsFromCache(snapshot.committeeMembers, snapshot.proposalInfo);
backfillVoteTimestampsFromCache(snapshot.spos, snapshot.proposalInfo);
// Recompute threshold info using current code so stale snapshots are fixed
// immediately on startup without waiting for the next sync.
refreshAllThresholdInfo(snapshot);
loadVoteTxRationaleCache();
loadSpoProfileCache();
loadNclCacheFromDisk();
warmDrepRationaleCacheFromSnapshot(snapshot).catch(() => null);
if (snapshot?.generatedAt && listSnapshotHistoryFiles().length === 0) {
  saveSnapshotToDisk(snapshot);
}
if (snapshot?.generatedAt && Number(snapshot?.latestEpoch || 0) >= EPOCH_SNAPSHOT_START_EPOCH) {
  backfillEpochSnapshotsFromCurrent(false);
}
startScheduler();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    json(res, 200, { ok: true, hasBlockfrostKey: Boolean(BLOCKFROST_API_KEY) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/accountability") {
    const requestedSnapshot = String(url.searchParams.get("snapshot") || "").trim();
    const requestedView = String(url.searchParams.get("view") || "all").trim().toLowerCase();
    const view = ["all", "drep", "spo", "committee", "actions"].includes(requestedView)
      ? requestedView
      : "all";
    const includeDreps = view === "all" || view === "drep" || view === "actions";
    const includeCommittee = view === "all" || view === "committee";
    const includeSpos = view === "all" || view === "spo" || view === "actions";
    const compactDashboardView = view === "drep" || view === "spo" || view === "committee";
    const compactActionsView = view === "actions";
    const historical = requestedSnapshot ? readSnapshotFromHistory(requestedSnapshot) : null;
    const sourceSnapshot = historical || pickBestSnapshotForApi(snapshot);
    const isActionsView = view === "actions";
    let committeeMembersRaw = includeCommittee
      ? normalizeCommitteeMembersForApi(sourceSnapshot?.committeeMembers || [])
      : [];
    if (includeCommittee && !isActionsView && committeeMembersRaw.length > 0) {
      committeeMembersRaw = await enrichCommitteeRowsWithCgovRationale(
        committeeMembersRaw,
        sourceSnapshot?.proposalInfo || {}
      );
    }
    const committeeMembers = compactDashboardView ? compactActorsForDashboard(committeeMembersRaw) : committeeMembersRaw;
    const hasSpecialDreps = sourceSnapshot.specialDreps && Object.keys(sourceSnapshot.specialDreps).length > 0;
    let specialDreps = includeDreps
      ? (hasSpecialDreps ? sourceSnapshot.specialDreps : (specialDrepsCache.value || {}))
      : {};
    if (includeDreps && !hasSpecialDreps && (!specialDreps || Object.keys(specialDreps).length === 0)) {
      fetchSpecialDreps(false).catch(() => null);
      specialDreps = {};
    }
    let spos = includeSpos ? (Array.isArray(sourceSnapshot?.spos) ? sourceSnapshot.spos : []) : [];
    if (includeSpos && !isActionsView && !historical && spos.length === 0) {
      const spoFallbackLimit = SPO_FALLBACK_LIMIT > 0 ? SPO_FALLBACK_LIMIT : 400;
      if (spoFallbackCache.rows.length > 0) {
        spos = spoFallbackCache.rows.slice(0, spoFallbackLimit);
      } else {
        if (!spoFallbackRefreshPromise) {
          spoFallbackRefreshPromise = fetchSpoGovernanceFallbackRows(spoFallbackLimit)
            .catch(() => [])
            .finally(() => {
              spoFallbackRefreshPromise = null;
            });
        }
        const refreshed = await spoFallbackRefreshPromise.catch(() => []);
        if (Array.isArray(refreshed) && refreshed.length > 0) {
          spos = refreshed;
        }
      }
    }
    if (includeSpos && !isActionsView && !historical && (!Array.isArray(spos) || spos.length === 0)) {
      const roster = await fetchSpoGovernanceFallbackRows(SPO_FALLBACK_LIMIT).catch(() => []);
      if (Array.isArray(roster) && roster.length > 0) {
        const rosterById = new Map(
          roster
            .map((row) => [String(row?.id || "").trim(), row])
            .filter(([id]) => Boolean(id))
        );
        for (const row of Array.isArray(spos) ? spos : []) {
          const profile = rosterById.get(String(row?.id || "").trim());
          if (!profile) continue;
          if (!row.name && profile.name) row.name = String(profile.name || "").trim();
          if (!row.homepage && profile.homepage) row.homepage = String(profile.homepage || "").trim();
          if ((!row.delegatedDrepLiteralRaw || !row.delegationStatus || row.delegationStatus === "Unknown") && profile.delegationStatus) {
            row.delegatedDrepLiteralRaw = String(profile.delegatedDrepLiteralRaw || "").trim();
            row.delegatedDrepLiteral = String(profile.delegatedDrepLiteral || "").trim();
            row.delegationStatus = String(profile.delegationStatus || "").trim() || "Unknown";
          }
          if ((row.votingPowerAda === null || row.votingPowerAda === undefined || row.votingPowerAda <= 0) && Number(profile.votingPowerAda || 0) > 0) {
            row.votingPowerAda = Number(profile.votingPowerAda);
          }
        }
        const seen = new Set((Array.isArray(spos) ? spos : []).map((row) => String(row?.id || "").trim()));
        for (const pool of roster) {
          const poolId = String(pool?.id || "").trim();
          if (!poolId || seen.has(poolId)) continue;
          seen.add(poolId);
          spos.push({
            id: poolId,
            name: String(pool?.name || "").trim(),
            homepage: String(pool?.homepage || "").trim(),
            status: String(pool?.status || "").trim().toLowerCase() || "registered",
            delegatedDrepLiteralRaw: String(pool?.delegatedDrepLiteralRaw || "").trim(),
            delegatedDrepLiteral: String(pool?.delegatedDrepLiteral || "").trim(),
            delegationStatus: String(pool?.delegationStatus || "").trim() || "Unknown",
            transparencyScore: null,
            consistency: 0,
            totalEligibleVotes: 0,
            firstVoteBlockTime: Number.MAX_SAFE_INTEGER,
            votingPowerAda: Number.isFinite(Number(pool?.votingPowerAda)) ? Math.max(0, Number(pool.votingPowerAda)) : 0,
            votes: []
          });
        }
        spos.sort((a, b) => {
          const voteDelta = Number((b?.votes || []).length) - Number((a?.votes || []).length);
          if (voteDelta !== 0) return voteDelta;
          return Number(b.votingPowerAda || 0) - Number(a.votingPowerAda || 0);
        });
      }
    }
    const drepsRaw = includeDreps ? (Array.isArray(sourceSnapshot?.dreps) ? sourceSnapshot.dreps : []) : [];
    const dreps = (compactDashboardView || compactActionsView) ? compactActorsForDashboard(drepsRaw) : drepsRaw;
    const compactSpos = (compactDashboardView || compactActionsView) ? compactActorsForDashboard(spos) : spos;
    const proposalInfoRaw = sourceSnapshot?.proposalInfo || {};
    const proposalInfo = compactDashboardView ? compactProposalInfoForDashboard(proposalInfoRaw) : proposalInfoRaw;

    json(res, 200, {
      ...sourceSnapshot,
      proposalInfo,
      dreps,
      committeeMembers,
      specialDreps,
      spos: compactSpos,
      view,
      snapshotKey: requestedSnapshot || "",
      historical: Boolean(historical),
      syncing: syncState.syncing,
      lastSyncStartedAt: syncState.lastStartedAt,
      lastSyncCompletedAt: syncState.lastCompletedAt,
      lastSyncError: syncState.lastError,
      syncTotalProposals: syncState.totalProposals,
      syncScannedProposals: syncState.scannedProposals,
      syncProcessedProposals: syncState.processedProposals,
      pendingSnapshotReady: Boolean(pendingSnapshot),
      pendingSnapshotBuiltAt
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/snapshot-history") {
    const latestChainEpoch = await fetchLatestChainEpoch();
    const fallbackLatest = detectLatestEpochFromSnapshot(snapshot).latest;
    const upperBoundEndedEpoch = Number.isFinite(latestChainEpoch) && latestChainEpoch > 0
      ? latestChainEpoch - 1
      : Math.max(0, Number(fallbackLatest || 0) - 1);
    const history = listSnapshotHistoryFiles()
      .filter((row) => Number.isFinite(row.epoch) && row.epoch > 0 && row.epoch <= upperBoundEndedEpoch)
      .map((row) => ({
      key: row.name,
      epoch: row.epoch || null,
      modifiedAt: new Date(row.mtimeMs).toISOString()
      }));
    json(res, 200, {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      count: history.length,
      backfill: epochBackfillState,
      history
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/ncl") {
    const periodKey = String(url.searchParams.get("period") || "current").trim().toLowerCase();
    const summary = await fetchNclSummary(periodKey, { allowStale: true, refreshInBackground: true });
    const fetchedAt = Number(nclCache.fetchedAt || 0);
    json(res, 200, {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      generatedAt: fetchedAt > 0 ? new Date(fetchedAt).toISOString() : new Date().toISOString(),
      fetchedAt: fetchedAt > 0 ? new Date(fetchedAt).toISOString() : null,
      periods: Object.values(NCL_PERIODS),
      ...summary
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/bug-report") {
    try {
      const body = await readJsonBody(req);
      const title = trimTo(body?.title, 140);
      const description = trimTo(body?.description, 4000);
      const page = trimTo(body?.page, 400);
      const category = trimTo(body?.category, 80) || "other";
      const expected = trimTo(body?.expected, 2000);
      const steps = trimTo(body?.steps, 2000);
      const contact = trimTo(body?.contact, 200);
      const userAgent = trimTo(body?.userAgent, 500);
      const viewport = trimTo(body?.viewport, 80);

      if (title.length < 3) {
        json(res, 400, { error: "Title must be at least 3 characters." });
        return;
      }
      if (description.length < 10) {
        json(res, 400, { error: "Description must be at least 10 characters." });
        return;
      }

      const report = {
        id: `bug_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        status: "open",
        title,
        description,
        category,
        page,
        expected,
        steps,
        contact,
        userAgent,
        viewport,
        remoteAddress: trimTo(req.socket?.remoteAddress || "", 120)
      };

      fs.mkdirSync(path.dirname(BUG_REPORTS_PATH), { recursive: true });
      fs.appendFileSync(BUG_REPORTS_PATH, `${JSON.stringify(report)}\n`, "utf8");

      json(res, 201, { ok: true, id: report.id });
      return;
    } catch (error) {
      const msg = String(error?.message || "");
      if (msg === "Payload too large." || msg === "Invalid JSON payload.") {
        json(res, 400, { error: msg });
        return;
      }
      json(res, 500, { error: "Failed to submit bug report." });
      return;
    }
  }

  if (req.method === "GET" && url.pathname === "/api/bug-reports") {
    if (!BUG_REPORTS_TOKEN) {
      json(res, 503, { error: "Bug reports admin token is not configured." });
      return;
    }
    if (!isBugReportsAuthorized(req, url)) {
      json(res, 401, { error: "Unauthorized." });
      return;
    }
    const requestedLimit = Number(url.searchParams.get("limit") || 200);
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(1000, Math.trunc(requestedLimit)))
      : 200;
    const reports = readBugReports(limit);
    json(res, 200, {
      ok: true,
      count: reports.length,
      reports
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/bug-reports/action") {
    if (!BUG_REPORTS_TOKEN) {
      json(res, 503, { error: "Bug reports admin token is not configured." });
      return;
    }
    if (!isBugReportsAuthorized(req, url)) {
      json(res, 401, { error: "Unauthorized." });
      return;
    }
    try {
      const body = await readJsonBody(req, 16 * 1024);
      const id = trimTo(body?.id, 120);
      const action = trimTo(body?.action, 32).toLowerCase();
      if (!id) {
        json(res, 400, { error: "Missing report id." });
        return;
      }
      if (!["approve", "archive", "reopen", "remove"].includes(action)) {
        json(res, 400, { error: "Unsupported action." });
        return;
      }
      const rows = readBugReportsAll();
      const idx = rows.findIndex((row) => String(row?.id || "") === id);
      if (idx === -1) {
        json(res, 404, { error: "Report not found." });
        return;
      }

      if (action === "remove") {
        rows.splice(idx, 1);
      } else if (action === "approve") {
        rows[idx] = { ...rows[idx], status: "approved", updatedAt: new Date().toISOString() };
      } else if (action === "archive") {
        rows[idx] = { ...rows[idx], status: "archived", updatedAt: new Date().toISOString() };
      } else if (action === "reopen") {
        rows[idx] = { ...rows[idx], status: "open", updatedAt: new Date().toISOString() };
      }

      writeBugReportsAll(rows);
      json(res, 200, { ok: true });
      return;
    } catch (error) {
      const msg = String(error?.message || "");
      if (msg === "Payload too large." || msg === "Invalid JSON payload.") {
        json(res, 400, { error: msg });
        return;
      }
      json(res, 500, { error: "Failed to update bug report." });
      return;
    }
  }

  if (req.method === "POST" && url.pathname === "/api/backfill-epoch-snapshots") {
    const force = String(url.searchParams.get("force") || "").toLowerCase() === "true";
    const epochDetect = detectLatestEpochFromSnapshot(snapshot);
    backfillEpochSnapshotsFromCurrent(force);
    json(res, 202, {
      accepted: true,
      force,
      epochStart: EPOCH_SNAPSHOT_START_EPOCH,
      ...epochDetect,
      backfill: epochBackfillState
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/sync-status") {
    json(res, 200, {
      ...syncState,
      drepRationaleWarm: drepRationaleWarmState,
      pendingSnapshotReady: Boolean(pendingSnapshot),
      pendingSnapshotBuiltAt
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/proposal-metadata") {
    const proposalId = String(url.searchParams.get("proposalId") || "").trim();
    if (!proposalId) {
      json(res, 400, { error: "Missing proposalId." });
      return;
    }
    if (!BLOCKFROST_API_KEY) {
      json(res, 500, { error: "Missing BLOCKFROST_API_KEY." });
      return;
    }
    try {
      const metadata = await blockfrostGet(`/governance/proposals/${encodeURIComponent(proposalId)}/metadata`);
      json(res, 200, {
        ok: true,
        proposalId,
        json_metadata: metadata?.json_metadata || null,
        url: metadata?.url || "",
        hash: metadata?.hash || ""
      });
      return;
    } catch (error) {
      json(res, 500, { error: error.message || "Failed to fetch proposal metadata." });
      return;
    }
  }

  if (req.method === "GET" && url.pathname === "/api/vote-rationale") {
    const rationaleUrl = String(url.searchParams.get("url") || "").trim();
    const proposalId = String(url.searchParams.get("proposalId") || "").trim();
    const voterId = String(url.searchParams.get("voterId") || "").trim();
    const voterRole = String(url.searchParams.get("voterRole") || "").trim().toLowerCase();
    const voteTxHashParam = String(url.searchParams.get("voteTxHash") || "").trim().toLowerCase();
    const cacheKey = `${voterRole}|${proposalId}|${voterId}|${voteTxHashParam}|${rationaleUrl}`;
    const cachedResult = voteRationaleResultCache.get(cacheKey);
    if (cachedResult && typeof cachedResult === "object") {
      json(res, 200, cachedResult);
      return;
    }
    if (voterRole === "drep" && proposalId && voterId) {
      const fastKey = `${proposalId}|${String(voterId || "").trim().toLowerCase()}`;
      const fast = drepRationaleByProposalVoter.get(fastKey);
      if (fast && typeof fast === "object" && (fast.rationaleText || fast.rationaleUrl)) {
        const payload = {
          ok: true,
          url: String(fast.rationaleUrl || ""),
          rationaleText: String(fast.rationaleText || ""),
          rationaleSections: [],
          found: Boolean(String(fast.rationaleText || "").trim())
        };
        voteRationaleResultCache.set(cacheKey, payload);
        json(res, 200, payload);
        return;
      }
    }

    let resolvedUrl = rationaleUrl;
    try {
      let rationaleText = "";
      let rationaleSections = [];
      let latestVoteTxHash = voteTxHashParam;
      if (!rationaleText && latestVoteTxHash) {
        const cachedTx = voteTxRationaleCache[latestVoteTxHash];
        if (cachedTx && typeof cachedTx === "object") {
          if (!resolvedUrl) resolvedUrl = String(cachedTx.rationaleUrl || "").trim();
          if (!rationaleText && typeof cachedTx.rationaleText === "string" && cachedTx.rationaleText.trim()) {
            rationaleText = cleanPlainText(cachedTx.rationaleText);
          }
          if (rationaleSections.length === 0 && Array.isArray(cachedTx.rationaleSections)) {
            rationaleSections = cachedTx.rationaleSections
              .map((section) => ({
                title: String(section?.title || "").trim(),
                text: String(section?.text || "").trim()
              }))
              .filter((section) => section.title && section.text);
          }
        }
      }
      if (!rationaleText && DREP_RATIONALE_USE_CGOV_FALLBACK && voterRole === "drep" && proposalId && voterId) {
        const fastKey = `${proposalId}|${String(voterId || "").trim().toLowerCase()}`;
        const fast = drepRationaleByProposalVoter.get(fastKey);
        if (fast && typeof fast === "object") {
          if (!resolvedUrl) resolvedUrl = String(fast.rationaleUrl || "").trim();
          const fastText = cleanPlainText(String(fast.rationaleText || "").trim());
          if (fastText) rationaleText = fastText;
        }
        if (!rationaleText) {
          const proposal = snapshot?.proposalInfo?.[proposalId] || null;
          const proposalTxHash = String(proposal?.txHash || "").trim().toLowerCase();
          const proposalCertIndex = Number(proposal?.certIndex);
          if (proposalTxHash && Number.isInteger(proposalCertIndex) && proposalCertIndex >= 0) {
            const drepLookup = await fetchCgovDrepVoteRationaleLookupForProposal(proposalTxHash, proposalCertIndex).catch(() => null);
            const drepVote = lookupCgovDrepVoteRationale(drepLookup, voterId, latestVoteTxHash);
            if (drepVote && typeof drepVote === "object") {
              if (!resolvedUrl) resolvedUrl = String(drepVote.rationaleUrl || "").trim();
              const directText = cleanPlainText(String(drepVote.rationaleText || "").trim());
              if (directText) rationaleText = directText;
              drepRationaleByProposalVoter.set(fastKey, {
                hasRationale: Boolean(resolvedUrl || directText),
                rationaleUrl: String(drepVote.rationaleUrl || "").trim(),
                rationaleText: directText
              });
            }
          }
        }
      }
      if (!resolvedUrl && proposalId && voterId) {
        const koiosRole =
          voterRole === "constitutional_committee"
            ? "ConstitutionalCommittee"
            : voterRole === "drep"
              ? "DRep"
              : voterRole === "stake_pool" || voterRole === "spo"
                ? "SPO"
                : "";
        const filters = [
          `voter_id=eq.${encodeURIComponent(voterId)}`,
          `proposal_id=eq.${encodeURIComponent(proposalId)}`,
          "order=block_time.desc",
          "limit=1"
        ];
        if (koiosRole) filters.unshift(`voter_role=eq.${encodeURIComponent(koiosRole)}`);
        const rows = await koiosGet(`/vote_list?${filters.join("&")}`).catch(() => []);
        let row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
        if ((!row || typeof row !== "object") && voterRole === "drep" && proposalId && voterId) {
          const broadRows = await koiosGet(
            `/vote_list?proposal_id=eq.${encodeURIComponent(proposalId)}` +
            `&voter_role=eq.${encodeURIComponent("DRep")}&order=block_time.desc&limit=1000`
          ).catch(() => []);
          const bech32Hex = bech32IdToHex(voterId);
          const keyHashes = new Set(
            [String(voterId || "").trim().toLowerCase(), String(bech32Hex || "").trim().toLowerCase()]
              .filter(Boolean)
              .flatMap((id) => {
                const out = [id];
                if (id.length === 58 && (id.startsWith("02") || id.startsWith("03"))) out.push(id.slice(2));
                return out;
              })
          );
          row = (Array.isArray(broadRows) ? broadRows : []).find((candidate) => {
            const ids = [
              String(candidate?.voter_id || "").trim().toLowerCase(),
              String(candidate?.voter || "").trim().toLowerCase(),
              String(candidate?.drep_id || "").trim().toLowerCase()
            ].filter(Boolean);
            return ids.some((id) => keyHashes.has(id));
          }) || null;
        }
        if (row && typeof row === "object") {
          latestVoteTxHash = String(row.tx_hash || row.txHash || "").trim().toLowerCase();
          resolvedUrl =
            String(row.meta_url || row.anchor_url || row.metadata_url || row.url || "").trim() || resolvedUrl;
          let metaPayload = null;
          if (row.meta_json && typeof row.meta_json === "object") {
            metaPayload = row.meta_json;
          } else if (typeof row.meta_json === "string" && row.meta_json.trim()) {
            try {
              const parsed = JSON.parse(row.meta_json);
              if (parsed && typeof parsed === "object") metaPayload = parsed;
            } catch {
              metaPayload = null;
            }
          }
          if (metaPayload) {
            rationaleSections = extractRationaleSections(metaPayload);
            rationaleText = pickRationaleText(metaPayload);
          }
          if (!rationaleText && typeof row.rationale === "string" && row.rationale.trim()) {
            rationaleText = cleanPlainText(row.rationale);
          }
        }
        if (!rationaleText && DREP_RATIONALE_USE_CGOV_FALLBACK && voterRole === "drep" && proposalId) {
          const proposal = snapshot?.proposalInfo?.[proposalId] || null;
          const proposalTxHash = String(proposal?.txHash || "").trim().toLowerCase();
          const proposalCertIndex = Number(proposal?.certIndex);
          if (proposalTxHash && Number.isInteger(proposalCertIndex) && proposalCertIndex >= 0) {
            const drepLookup = await fetchCgovDrepVoteRationaleLookupForProposal(proposalTxHash, proposalCertIndex).catch(() => null);
            const drepVote = lookupCgovDrepVoteRationale(drepLookup, voterId, latestVoteTxHash);
            if (drepVote && typeof drepVote === "object") {
              if (!resolvedUrl) resolvedUrl = String(drepVote.rationaleUrl || "").trim();
              const directText = cleanPlainText(String(drepVote.rationaleText || "").trim());
              if (directText) rationaleText = directText;
            }
          }
        }
      }
      if (!rationaleText) {
        if (DREP_RATIONALE_USE_CGOV_FALLBACK && voterRole === "drep" && proposalId && voterId) {
          const proposal = snapshot?.proposalInfo?.[proposalId] || null;
          const proposalTxHash = String(proposal?.txHash || "").trim().toLowerCase();
          const proposalCertIndex = Number(proposal?.certIndex);
          if (proposalTxHash && Number.isInteger(proposalCertIndex) && proposalCertIndex >= 0) {
            const cgovKey = `${proposalTxHash}:${proposalCertIndex}`;
            const cgovUrl = `${CGOV_PROPOSAL_API_BASE}/${encodeURIComponent(cgovKey)}`;
            let cgovPayload = null;
            try {
              const cgovResp = await fetch(cgovUrl);
              if (cgovResp.ok) {
                const cgovRaw = await cgovResp.text();
                try {
                  const parsed = JSON.parse(cgovRaw);
                  if (parsed && typeof parsed === "object") cgovPayload = parsed;
                } catch {
                  cgovPayload = null;
                }
              }
            } catch {
              cgovPayload = null;
            }
            const cgovVotes = Array.isArray(cgovPayload?.votes) ? cgovPayload.votes : [];
            const wantedVoter = String(voterId || "").trim().toLowerCase();
            const matched = cgovVotes.find((vote) => {
              const vt = String(vote?.voterType || "").trim().toLowerCase();
              const id = String(vote?.voterId || "").trim().toLowerCase();
              return vt === "drep" && id === wantedVoter;
            });
            if (matched && typeof matched === "object") {
              if (!resolvedUrl) resolvedUrl = String(matched.anchorUrl || "").trim();
              const rationaleRaw = String(matched.rationale || "").trim();
              let directText = cleanPlainText(rationaleRaw);
              if (rationaleRaw.startsWith("{") || rationaleRaw.startsWith("[")) {
                try {
                  const parsed = JSON.parse(rationaleRaw);
                  const parsedText = pickRationaleText(parsed);
                  if (parsedText) {
                    directText = parsedText;
                    if (rationaleSections.length === 0) rationaleSections = extractRationaleSections(parsed);
                  }
                } catch {
                  // Keep plain-text fallback.
                }
              }
              if (directText) rationaleText = directText;
            }
          }
        }
      }
      if (!rationaleText) {
        const resolved = await resolveVoteRationaleData(resolvedUrl);
        rationaleText = resolved.text;
        if (rationaleSections.length === 0) rationaleSections = resolved.sections || [];
      }
      const payload = {
        ok: true,
        url: resolvedUrl || "",
        rationaleText: rationaleText || "",
        rationaleSections,
        found: Boolean(rationaleText)
      };
      if (latestVoteTxHash && (payload.found || payload.url)) {
        voteTxRationaleCache[latestVoteTxHash] = {
          ...(voteTxRationaleCache[latestVoteTxHash] && typeof voteTxRationaleCache[latestVoteTxHash] === "object"
            ? voteTxRationaleCache[latestVoteTxHash]
            : {}),
          hasRationale: Boolean(payload.found || payload.url),
          rationaleUrl: String(payload.url || ""),
          rationaleText: String(payload.rationaleText || ""),
          rationaleSections: Array.isArray(payload.rationaleSections) ? payload.rationaleSections : [],
          fetchedAt: Date.now()
        };
        saveVoteTxRationaleCache();
      }
      voteRationaleResultCache.set(cacheKey, payload);
      json(res, 200, payload);
      return;
    } catch (error) {
      json(res, 500, { error: error.message || "Failed to resolve vote rationale." });
      return;
    }
  }

  if (req.method === "GET" && url.pathname === "/api/export-snapshot") {
    const served = pickBestSnapshotForApi(snapshot);
    if (!snapshotIsComplete(served)) {
      json(res, 503, { error: "Snapshot not ready — sync still in progress." });
      return;
    }
    const body = JSON.stringify(served);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
      "Cache-Control": "no-store"
    });
    res.end(body);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/sync-now") {
    const promotePending = String(url.searchParams.get("promotePending") || "").toLowerCase() === "true";
    const forceFull = String(url.searchParams.get("forceFull") || "").toLowerCase() === "true";
    if (promotePending) {
      promotePendingSnapshot();
    }
    runSync({ forceFull });
    json(res, 202, {
      accepted: true,
      syncing: syncState.syncing,
      pendingSnapshotReady: Boolean(pendingSnapshot),
      pendingSnapshotBuiltAt
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/warm-rationales") {
    const wait = String(url.searchParams.get("wait") || "").toLowerCase() === "true";
    if (wait) {
      await warmDrepRationaleCacheFromSnapshot(snapshot);
    } else {
      warmDrepRationaleCacheFromSnapshot(snapshot).catch(() => null);
    }
    json(res, 202, {
      accepted: true,
      wait,
      drepRationaleWarm: drepRationaleWarmState
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/promote-pending-snapshot") {
    const before = Boolean(pendingSnapshot);
    promotePendingSnapshot();
    json(res, 200, {
      accepted: true,
      promoted: before && !pendingSnapshot,
      pendingSnapshotReady: Boolean(pendingSnapshot),
      pendingSnapshotBuiltAt
    });
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    json(res, 404, { error: "Not Found" });
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
