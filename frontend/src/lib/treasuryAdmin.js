// Shared helpers for the Treasury Explorer (Intersect Administration API data).

export function fmtAdaShort(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000)     return `${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000)         return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

export function fmtAda(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function fmtPct(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? `${n.toFixed(1)}%` : "0%";
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function fmtAgo(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export const ADMIN_EVENT_META = {
  fund:       { color: "#60a5fa", label: "Funded" },
  disburse:   { color: "#60a5fa", label: "Disbursed" },
  withdraw:   { color: "#4ade80", label: "Withdrawal" },
  complete:   { color: "#4ade80", label: "Completed" },
  pause:      { color: "#fbbf24", label: "Paused" },
  resume:     { color: "#38bdf8", label: "Resumed" },
  modify:     { color: "#a78bfa", label: "Modified" },
  initialize: { color: "#94a3b8", label: "Initialized" },
  publish:    { color: "#94a3b8", label: "Published" },
};

export function eventMeta(type) {
  return ADMIN_EVENT_META[type] || { color: "#94a3b8", label: type || "event" };
}

export function statusPillMod(status) {
  return status === "completed" ? "enacted" : status === "active" ? "active" : "expired";
}

export function statusColor(status) {
  return status === "paused" ? "#fbbf24" : status === "completed" ? "#4ade80" : status === "active" ? "#54e4bc" : "#94a3b8";
}

export const csTx = (h) => `https://cardanoscan.io/transaction/${encodeURIComponent(h)}`;
export const csAddr = (a) => `https://cardanoscan.io/address/${encodeURIComponent(a)}`;

export function shortHash(h, n = 8) {
  const s = String(h || "");
  if (s.length <= n * 2 + 1) return s;
  return `${s.slice(0, n)}…${s.slice(-6)}`;
}
