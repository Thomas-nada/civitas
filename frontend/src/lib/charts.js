// Shared Recharts styling. SVG attributes accept CSS variables, so charts
// follow the active theme (dark, light, high contrast) without a JS palette.

export const CHART = {
  yes: "var(--color-vote-yes)",
  no: "var(--color-vote-no)",
  abstain: "var(--color-vote-abstain)",
  noConfidence: "var(--color-vote-noconf)",
  accent: "var(--color-accent)",
  info: "var(--color-info)",
  warning: "var(--color-warning)",
  muted: "var(--color-text-muted)",
  faint: "var(--color-text-faint)",
  line: "var(--color-line)",
  text: "var(--color-text)"
};

export const TYPE_PALETTE = ["#3ee6b8", "#ffc766", "#ff6b7a", "#5cc8ff", "#b794f6", "#fb923c", "#34d399", "#f472b6"];

export const axisTick = { fill: CHART.muted, fontSize: 11 };
export const axisTickSmall = { fill: CHART.muted, fontSize: 10 };
export const categoryTick = { fill: CHART.text, fontSize: 11 };

export const tooltipProps = {
  contentStyle: { background: "var(--color-bg-elevated)", border: "1px solid var(--color-line-strong)", borderRadius: 8, color: "var(--color-text)", fontSize: 12, boxShadow: "var(--shadow-md)" },
  itemStyle: { color: "var(--color-text)" },
  labelStyle: { color: "var(--color-text-muted)", marginBottom: 4 },
  cursor: { fill: "var(--color-surface-2)", opacity: 0.6 }
};

export const legendProps = { wrapperStyle: { fontSize: 12, color: "var(--color-text-muted)" }, iconSize: 10 };

export function outcomeColor(outcome) {
  const lo = String(outcome || "").toLowerCase();
  if (lo === "yes" || lo === "enacted" || lo === "ratified") return CHART.yes;
  if (lo === "no" || lo === "dropped" || lo === "expired") return CHART.no;
  if (lo === "pending" || lo === "active") return CHART.warning;
  return CHART.muted;
}
