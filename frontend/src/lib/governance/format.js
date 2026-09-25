// Formatting helpers shared by every page (dates, epochs, ADA, ids).

export const SHELLEY_EPOCH_START_UNIX = 1596059091;
export const EPOCH_DURATION_SECONDS = 432000;

export function epochStartUnix(epoch) {
  return SHELLEY_EPOCH_START_UNIX + (Number(epoch) - 208) * EPOCH_DURATION_SECONDS;
}
export function epochToDate(epoch) {
  if (!epoch || epoch <= 0) return null;
  return new Date(epochStartUnix(epoch) * 1000);
}
export function currentEpochFromNow(nowMs = Date.now()) {
  const delta = Math.floor(nowMs / 1000) - SHELLEY_EPOCH_START_UNIX;
  if (!Number.isFinite(delta) || delta < 0) return null;
  return 208 + Math.floor(delta / EPOCH_DURATION_SECONDS);
}
export function formatEpochDate(epoch) {
  const date = epochToDate(epoch);
  return date ? date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
}
export function formatDate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(typeof value === "number" && value < 1e12 ? value * 1000 : value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
export function formatDateTime(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(typeof value === "number" && value < 1e12 ? value * 1000 : value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
export function formatRelative(value, nowMs = Date.now()) {
  if (!value) return "";
  const t = value instanceof Date ? value.getTime() : (typeof value === "number" && value < 1e12 ? value * 1000 : new Date(value).getTime());
  if (!Number.isFinite(t)) return "";
  const diff = Math.round((t - nowMs) / 1000);
  const abs = Math.abs(diff);
  const units = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
  for (const [unit, secs] of units) {
    if (abs >= secs || unit === "second") {
      const n = Math.round(diff / secs);
      try { return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(n, unit); } catch { return `${n} ${unit}s`; }
    }
  }
  return "";
}
export function formatCountdown(msRemaining) {
  const totalMinutes = Math.max(0, Math.floor(Number(msRemaining || 0) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatNumber(value, digits = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}
export function formatAda(value, digits = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `₳${n.toLocaleString(undefined, { maximumFractionDigits: digits })}`;
}
export function formatAdaCompact(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `₳${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `₳${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `₳${(n / 1e3).toFixed(1)}K`;
  return `₳${n.toFixed(0)}`;
}
export function formatPct(value, digits = 1) {
  const n = Number(value);
  if (value === null || value === undefined || !Number.isFinite(n)) return "N/A";
  return `${n.toFixed(digits)}%`;
}
export function round(value, digits = 2) {
  const k = 10 ** digits;
  return Math.round(Number(value) * k) / k;
}
export function formatHours(hours) {
  const h = Number(hours);
  if (!Number.isFinite(h)) return "—";
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

export function truncateMiddle(id, head = 10, tail = 6) {
  const s = String(id || "");
  return s.length <= head + tail + 1 ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;
}
export function shortHash(value, size = 8) {
  const s = String(value || "");
  if (s.length <= size * 2 + 1) return s;
  return `${s.slice(0, size)}…${s.slice(-size)}`;
}

export const TYPE_SHORT = {
  "treasury withdrawals": "Treasury",
  "info action": "Info",
  "parameter change": "Parameters",
  "hard fork initiation": "Hard fork",
  "new committee": "Committee",
  "new constitution": "Constitution",
  "no confidence": "No confidence"
};
export function shortType(type) {
  const t = String(type || "").toLowerCase();
  return TYPE_SHORT[t] || (type || "Unknown");
}

export function initials(name) {
  return String(name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "?";
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
