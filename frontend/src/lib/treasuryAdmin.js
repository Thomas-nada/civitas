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

// Colours are theme tokens so the feed follows dark, light and high contrast.
export const ADMIN_EVENT_META = {
  fund:       { color: "var(--color-info)", label: "Funded" },
  disburse:   { color: "var(--color-info)", label: "Disbursed" },
  withdraw:   { color: "var(--color-vote-yes)", label: "Withdrawal" },
  complete:   { color: "var(--color-vote-yes)", label: "Completed" },
  pause:      { color: "var(--color-warning)", label: "Paused" },
  resume:     { color: "var(--color-info)", label: "Resumed" },
  modify:     { color: "var(--color-vote-noconf)", label: "Modified" },
  initialize: { color: "var(--color-text-muted)", label: "Initialized" },
  publish:    { color: "var(--color-text-muted)", label: "Published" },
};

export function eventMeta(type) {
  return ADMIN_EVENT_META[type] || { color: "var(--color-text-muted)", label: type || "event" };
}

export function statusPillMod(status) {
  return status === "completed" ? "enacted" : status === "active" ? "active" : "expired";
}

export function statusColor(status) {
  return status === "paused" ? "var(--color-warning)" : status === "completed" ? "var(--color-vote-yes)" : status === "active" ? "var(--color-accent)" : "var(--color-text-muted)";
}

/** Pill tone for a project status. */
export function statusTone(status) {
  return status === "completed" ? "success" : status === "active" ? "active" : status === "paused" ? "warning" : "neutral";
}

/** Drawdown bar tone: paused is amber; drawdown lagging milestones by 20 points is red. */
export function drawdownTone(project) {
  const ms = project?.milestones || {};
  const msProgress = ms.total > 0 ? (ms.done / ms.total) * 100 : 0;
  if (project?.status === "paused") return "warning";
  return Number(project?.drawdownPct || 0) < msProgress - 20 ? "danger" : "yes";
}

export const csTx = (h) => `https://cardanoscan.io/transaction/${encodeURIComponent(h)}`;
export const csAddr = (a) => `https://cardanoscan.io/address/${encodeURIComponent(a)}`;

export function shortHash(h, n = 8) {
  const s = String(h || "");
  if (s.length <= n * 2 + 1) return s;
  return `${s.slice(0, n)}…${s.slice(-6)}`;
}
