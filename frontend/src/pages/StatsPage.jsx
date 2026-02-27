import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Sector,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// ── Design tokens (match Civitas CSS vars via JS) ─────────────────────────────
const C = {
  yes:     "#54e4bc",
  no:      "#ff6f7d",
  abstain: "#ffc766",
  muted:   "#7c8fa8",
  line:    "rgba(255,255,255,0.10)",
  text:    "#e8f0f4",
  panel:   "#131c24",
  surface: "#1a2530",
  active:  "#54e4bc",
  retired: "#ffc766",
  expired: "#7c8fa8",
};

const TYPE_PALETTE = ["#54e4bc","#ffc766","#ff6f7d","#7eb8ff","#c084fc","#fb923c","#34d399","#f472b6"];

const S = {
  axis: 11,
  axisSmall: 10,
  legend: 12,
  tooltip: 12,
  title: 12,
  label: 10,
  filter: 11,
  filterLabel: 10,
  timelineTick: 10,
  timelineChip: 10,
  timelineInline: 9,
  timelinePill: 8
};

const CC_TERM_OVERRIDES_BY_HOT = {
  cc_hot1qvr7p6ms588athsgfd0uez5m9rlhwu3g9dt7wcxkjtr4hhsq6ytv2: { seatStartEpoch: 507, expirationEpoch: 596 },
  cc_hot1qv7fa08xua5s7qscy9zct3asaa5a3hvtdc8sxexetcv3unq7cfkq5: { seatStartEpoch: 507, expirationEpoch: 580 },
  cc_hot1qwzuglw5hx3wwr5gjewerhtfhcvz64s9kgam2fgtrj2t7eqs00fzv: { seatStartEpoch: 507, expirationEpoch: 580 },
  cc_hot1qdnedkra2957t6xzzwygdgyefd5ctpe4asywauqhtzlu9qqkttvd9: { seatStartEpoch: 507, expirationEpoch: 580 },
  cc_hot1q0wzkpcxzzfs4mf4yk6yx7d075vqtyx2tnxsr256he6gnwq6yfy5w: { seatStartEpoch: 507, expirationEpoch: 580 },
  cc_hot1qdqp9j44qfnwlkx9h78kts8hvee4ycc7czrw0xl4lqhsw4gcxgkpt: { seatStartEpoch: 507, expirationEpoch: 580 },
};

const CC_TERM_OVERRIDES_BY_NAME = {
  "cardano atlantic council": { seatStartEpoch: 507, expirationEpoch: 596 },
  "intersect constitutional council": { seatStartEpoch: 507, expirationEpoch: 580 },
  emurgo: { seatStartEpoch: 507, expirationEpoch: 580 },
  "cardano foundation": { seatStartEpoch: 507, expirationEpoch: 580 },
  "cardano japan": { seatStartEpoch: 507, expirationEpoch: 580 },
  "input | output": { seatStartEpoch: 507, expirationEpoch: 580 },
  "input output": { seatStartEpoch: 507, expirationEpoch: 580 },
};

// Governance type → short label
const TYPE_SHORT = {
  "Hard Fork Initiation": "Hard Fork",
  "Protocol Param Change": "Param Chg",
  "Treasury Withdrawal":  "Treasury",
  "New Committee":        "Committee",
  "No Confidence":        "No Conf",
  "Info Action":          "Info",
  "Update Constitution":  "Const.",
};
function shortType(t) { return TYPE_SHORT[t] || t || "?"; }

// Outcome → colour
function outcomeColor(outcome) {
  const lo = (outcome || "").toLowerCase();
  if (lo === "yes" || lo === "enacted" || lo === "ratified") return C.yes;
  if (lo === "no"  || lo === "dropped" || lo === "expired")  return C.no;
  if (lo === "pending" || lo === "active")                   return C.abstain;
  return C.muted;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n, dec = 0) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: dec, minimumFractionDigits: dec });
}
function fmtAda(ada) {
  if (ada >= 1_000_000_000) return `${fmt(ada / 1_000_000_000, 1)}B ₳`;
  if (ada >= 1_000_000)     return `${fmt(ada / 1_000_000,     1)}M ₳`;
  if (ada >= 1_000)         return `${fmt(ada / 1_000,         1)}K ₳`;
  return `${fmt(ada)} ₳`;
}
function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }

function getCommitteeTermOverride(actor) {
  const hot = String(actor?.hotCredential || "").trim().toLowerCase();
  const name = String(actor?.name || "").trim().toLowerCase();
  return CC_TERM_OVERRIDES_BY_HOT[hot] || CC_TERM_OVERRIDES_BY_NAME[name] || null;
}

function getCommitteeEligibilityWindow(actor, proposalInfo) {
  const termOverride = getCommitteeTermOverride(actor);
  const startEpoch = Number(termOverride?.seatStartEpoch || actor?.seatStartEpoch || 0);
  const endEpoch = Number(termOverride?.expirationEpoch || actor?.expirationEpoch || 0);
  const hasStartEpoch = Number.isFinite(startEpoch) && startEpoch > 0;
  const hasEndEpoch = Number.isFinite(endEpoch) && endEpoch > 0;
  const actorStatus = String(actor?.status || "").toLowerCase();
  const allVoteEpochs = (actor?.votes || [])
    .map((vote) => Number(proposalInfo?.[vote.proposalId]?.submittedEpoch || 0))
    .filter((epoch) => Number.isFinite(epoch) && epoch > 0);
  const lastVoteEpoch = allVoteEpochs.length > 0 ? Math.max(...allVoteEpochs) : 0;
  const inferredRetiredEndEpoch = actorStatus === "retired" && !hasEndEpoch && lastVoteEpoch > 0 ? lastVoteEpoch : 0;
  const inferredExpiredEndEpoch = actorStatus === "expired" && !hasEndEpoch && lastVoteEpoch > 0 ? lastVoteEpoch : 0;
  const inferredEndEpoch = inferredRetiredEndEpoch || inferredExpiredEndEpoch || 0;
  const effectiveEndEpoch =
    hasEndEpoch && inferredEndEpoch > 0
      ? Math.min(endEpoch, inferredEndEpoch)
      : hasEndEpoch
        ? endEpoch
        : inferredEndEpoch;
  const hasEffectiveEndEpoch = Number.isFinite(effectiveEndEpoch) && effectiveEndEpoch > 0;
  return { startEpoch, hasStartEpoch, effectiveEndEpoch, hasEffectiveEndEpoch };
}

// ── Tooltip skin ──────────────────────────────────────────────────────────────
const TooltipStyle = {
  contentStyle: { background: "#1a2530", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: S.tooltip, color: "#e8f0f4" },
  itemStyle:    { color: "#e8f0f4" },
  cursor:       { fill: "rgba(84,228,188,0.07)" },
};

// ── Active donut slice renderer ───────────────────────────────────────────────
function renderActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 12} textAnchor="middle" fill={C.text} fontSize={S.title} fontWeight={600}>{payload.name}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={C.muted} fontSize={S.legend}>{fmt(value)}</text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill={C.muted} fontSize={S.axis}>{(percent * 100).toFixed(1)}%</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
}

// ── Layout primitives ─────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent = C.yes }) {
  return (
    <article className="stats-kpi" style={{ borderTopColor: accent }}>
      <p className="stats-kpi-label">{label}</p>
      <strong className="stats-kpi-value">{value}</strong>
      {sub && <p className="stats-kpi-sub">{sub}</p>}
    </article>
  );
}

function Section({ title, children, wide, half }) {
  return (
    <section className={`stats-section${wide ? " stats-section--wide" : ""}${half ? " stats-section--half" : ""}`}>
      <h2 className="stats-section-title">{title}</h2>
      <div className="stats-section-body">{children}</div>
    </section>
  );
}

// ── CC Membership Gantt (epoch-based) ─────────────────────────────────────────
function CcMembershipTimeline({ cc, epochMin, epochMax, currentEpoch }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const PAD_LEFT  = 160;
  const PAD_RIGHT = 32;
  const ROW_H     = 24;
  const BAR_H     = 12;
  const TICK_STEP = 20; // epoch ticks every N epochs

  // Sort: active first, then by seatStartEpoch
  const sorted = [...cc].sort((a, b) => {
    const aActive = a.status === "active" ? 0 : 1;
    const bActive = b.status === "active" ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return (a.seatStartEpoch || 0) - (b.seatStartEpoch || 0);
  });

  const totalRows = sorted.length;
  const svgH = totalRows * ROW_H + 40; // +40 for axis at bottom

  function epochToX(ep, w) {
    const span = epochMax - epochMin || 1;
    return PAD_LEFT + ((ep - epochMin) / span) * (w - PAD_LEFT - PAD_RIGHT);
  }

  // Build tick marks
  const ticks = [];
  const firstTick = Math.ceil(epochMin / TICK_STEP) * TICK_STEP;
  for (let ep = firstTick; ep <= epochMax; ep += TICK_STEP) ticks.push(ep);

  // Status colours
  function barColor(m) {
    if (m.status === "active")  return C.active;
    if (m.status === "retired") return C.retired;
    return C.expired; // expired
  }

  return (
    <div style={{ position: "relative", overflowX: "auto" }}>
      <svg
        ref={svgRef}
        width={800}
        height={svgH}
        viewBox={`0 0 800 ${svgH}`}
        style={{ display: "block", minWidth: 800, maxWidth: "none" }}
      >
        {/* Background rows */}
        {sorted.map((m, i) => (
          <rect
            key={m.id || i}
            x={0} y={i * ROW_H}
            width={800} height={ROW_H}
            fill={i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent"}
          />
        ))}

        {/* Vertical tick lines */}
        {ticks.map(ep => {
          const x = epochToX(ep, 800);
          return (
            <g key={ep}>
              <line x1={x} y1={0} x2={x} y2={totalRows * ROW_H} stroke={C.line} strokeWidth={1} />
              <text x={x} y={totalRows * ROW_H + 16} textAnchor="middle" fill={C.muted} fontSize={S.timelineTick}>{ep}</text>
            </g>
          );
        })}

        {/* "Now" marker */}
        {(() => {
          const baseCurrentEpoch = Number.isFinite(Number(currentEpoch)) && Number(currentEpoch) > 0
            ? Number(currentEpoch)
            : epochMax;
          const nowEpoch = Math.min(Math.max(baseCurrentEpoch, epochMin), epochMax);
          const x = epochToX(nowEpoch, 800);
          const label = `Current epoch ${nowEpoch}`;
          const labelW = Math.max(84, Math.round(label.length * 5.4) + 10);
          const labelX = Math.min(Math.max(x - labelW / 2, 2), 800 - labelW - 2);
          const labelY = totalRows * ROW_H + 30;
          return (
            <g>
              <line x1={x} y1={0} x2={x} y2={totalRows * ROW_H} stroke={C.yes} strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
              <rect
                x={labelX}
                y={labelY - 9}
                width={labelW}
                height={12}
                rx={3}
                fill="rgba(9, 14, 16, 0.9)"
                stroke={C.yes}
                strokeOpacity={0.45}
              />
              <text x={labelX + 5} y={labelY} fill={C.yes} fontSize={S.timelineInline} opacity={0.9}>{label}</text>
            </g>
          );
        })()}

        {/* Member rows */}
        {sorted.map((m, i) => {
          const startEp = m.seatStartEpoch || epochMin;
          const endEp   = m.expirationEpoch || epochMax;
          const x1 = epochToX(startEp, 800);
          const x2 = Math.max(epochToX(Math.min(endEp, epochMax), 800), x1 + 4);
          const y  = i * ROW_H + (ROW_H - BAR_H) / 2;
          const color = barColor(m);
          const name  = m.name || (m.id || "").slice(0, 14) + "…";

          return (
            <g
              key={m.id || i}
              onMouseEnter={e => {
                const rect = svgRef.current?.getBoundingClientRect();
                setTooltip({
                  name, status: m.status,
                  start: startEp, end: endEp,
                  x: e.clientX - (rect?.left || 0),
                  y: e.clientY - (rect?.top  || 0),
                });
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: "default" }}
            >
              {/* Member name */}
              <text
                x={PAD_LEFT - 8} y={i * ROW_H + ROW_H / 2 + 4}
                textAnchor="end" fill={m.status === "active" ? C.text : C.muted}
                fontSize={S.timelineTick} fontWeight={m.status === "active" ? 600 : 400}
              >
                {name.length > 22 ? name.slice(0, 21) + "…" : name}
              </text>

              {/* Bar */}
              <rect
                x={x1} y={y}
                width={x2 - x1} height={BAR_H}
                fill={color}
                opacity={m.status === "active" ? 0.85 : 0.45}
                rx={3}
              />

              {/* Status pill on bar if wide enough */}
              {x2 - x1 > 40 && (
                <text
                  x={(x1 + x2) / 2} y={y + BAR_H / 2 + 4}
                  textAnchor="middle" fill="#000" fontSize={S.timelinePill} fontWeight={700}
                  opacity={0.7}
                >
                  {m.status}
                </text>
              )}
            </g>
          );
        })}

        {/* X-axis label */}
        <text x={400} y={svgH - 2} textAnchor="middle" fill={C.muted} fontSize={S.timelineTick}>Epoch</text>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 12,
            top:  tooltip.y - 8,
            background: "#1a2530",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8,
            padding: "6px 10px",
            fontSize: S.tooltip,
            color: C.text,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 10,
          }}
        >
          <strong>{tooltip.name}</strong><br />
          Status: <span style={{ color: tooltip.status === "active" ? C.yes : tooltip.status === "retired" ? C.retired : C.muted }}>{tooltip.status}</span><br />
          Epoch {tooltip.start} → {tooltip.end}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: "1.2rem", marginTop: "0.75rem", fontSize: S.legend, color: C.muted }}>
        {[["active", C.active], ["retired", C.retired], ["expired", C.expired]].map(([label, color]) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ display: "inline-block", width: 12, height: 10, background: color, borderRadius: 2, opacity: label === "active" ? 0.85 : 0.45 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Governance Actions Timeline ────────────────────────────────────────────────
function GovernanceActionsTimeline({ proposals, epochMin, epochMax, currentEpoch }) {
  const DEFAULT_VISIBLE = 10;
  const [tooltip, setTooltip] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [filterOutcome, setFilterOutcome] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const svgRef = useRef(null);

  const PAD_LEFT  = 20;
  const PAD_RIGHT = 20;
  const ROW_H     = 10;
  const GAP       = 2;
  const TICK_STEP = 5;

  // Filter + sort proposals by submittedEpoch
  const filtered = useMemo(() => {
    let list = [...proposals]
      .filter(p => p.submittedEpoch)
      .sort((a, b) => (a.submittedEpoch || 0) - (b.submittedEpoch || 0));
    if (filterType)    list = list.filter(p => p.governanceType === filterType);
    if (filterOutcome) list = list.filter(p => (p.outcome || "Pending") === filterOutcome);
    return list;
  }, [proposals, filterType, filterOutcome]);

  // Default view is newest 10 governance actions, expandable to all
  const visible = useMemo(
    () => (showAll && filtered.length > DEFAULT_VISIBLE ? filtered : filtered.slice(-DEFAULT_VISIBLE)),
    [filtered, showAll]
  );

  // Build type list for legend/filter
  const allTypes    = [...new Set(proposals.map(p => p.governanceType || "Unknown"))].sort();
  const allOutcomes = [...new Set(proposals.map(p => p.outcome || "Pending"))].sort();

  // Stable type-to-colour map, avoids render glitches while filtering
  const typeColorMap = useMemo(() => {
    const map = {};
    allTypes.forEach((t, i) => {
      map[t] = TYPE_PALETTE[i % TYPE_PALETTE.length];
    });
    return map;
  }, [allTypes]);
  const getTypeColor = (type) => typeColorMap[type] || C.muted;

  // Filter-scoped domain prevents the timeline from looking broken when filters change
  const [timelineMin, timelineMax] = useMemo(() => {
    if (!visible.length) return [epochMin, epochMax];
    const starts = visible.map(p => Number(p.submittedEpoch || 0)).filter(v => Number.isFinite(v) && v > 0);
    const ends = visible.map(p => {
      const term = Number(
        p.enactedEpoch ||
        p.ratifiedEpoch ||
        p.droppedEpoch ||
        p.expiredEpoch ||
        p.expirationEpoch ||
        epochMax
      );
      return Number.isFinite(term) && term > 0 ? term : epochMax;
    });
    const current = Number.isFinite(Number(currentEpoch)) && Number(currentEpoch) > 0
      ? Number(currentEpoch)
      : epochMax;
    const min = starts.length ? Math.min(...starts) : epochMin;
    const max = Math.max(ends.length ? Math.max(...ends) : epochMax, current);
    return [Math.min(min, max), Math.max(min, max)];
  }, [visible, epochMin, epochMax, currentEpoch]);

  const svgH = visible.length * (ROW_H + GAP) + 48;

  function epochToX(ep, w) {
    const span = timelineMax - timelineMin || 1;
    return PAD_LEFT + ((ep - timelineMin) / span) * (w - PAD_LEFT - PAD_RIGHT);
  }

  const ticks = [];
  const firstTick = Math.ceil(timelineMin / TICK_STEP) * TICK_STEP;
  for (let ep = firstTick; ep <= timelineMax; ep += TICK_STEP) ticks.push(ep);

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1rem", marginBottom: "0.8rem", fontSize: S.legend }}>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: C.muted, fontSize: S.filter, textTransform: "uppercase", letterSpacing: "0.05em" }}>Type:</span>
          <button
            className={`stats-filter-btn${!filterType ? " active" : ""}`}
            onClick={() => setFilterType(null)}
          >All</button>
          {allTypes.map(t => (
            <button
              key={t}
              className={`stats-filter-btn${filterType === t ? " active" : ""}`}
              style={{ borderColor: getTypeColor(t) }}
              onClick={() => setFilterType(v => v === t ? null : t)}
            >
              <span style={{ display: "inline-block", width: 8, height: 8, background: getTypeColor(t), borderRadius: 2, marginRight: 4 }} />
              {shortType(t)}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: C.muted, fontSize: S.filter, textTransform: "uppercase", letterSpacing: "0.05em" }}>Outcome:</span>
          <button
            className={`stats-filter-btn${!filterOutcome ? " active" : ""}`}
            onClick={() => setFilterOutcome(null)}
          >All</button>
          {allOutcomes.map(o => (
            <button
              key={o}
              className={`stats-filter-btn${filterOutcome === o ? " active" : ""}`}
              style={{ borderColor: outcomeColor(o) }}
              onClick={() => setFilterOutcome(v => v === o ? null : o)}
            >
              <span style={{ display: "inline-block", width: 8, height: 8, background: outcomeColor(o), borderRadius: 2, marginRight: 4 }} />
              {o}
            </button>
          ))}
        </div>
        <span style={{ color: C.muted, fontSize: S.filter, marginLeft: "auto", alignSelf: "center" }}>
          showing {visible.length} / {filtered.length} filtered · {filtered.length} / {proposals.filter(p=>p.submittedEpoch).length} total
        </span>
        {filtered.length > DEFAULT_VISIBLE && (
          <button
            className="stats-filter-btn active"
            onClick={() => setShowAll(v => !v)}
            style={{ marginLeft: "0.2rem" }}
          >
            {showAll ? "Show newest 10" : "Show all"}
          </button>
        )}
      </div>

      {/* Timeline SVG */}
      <div style={{ position: "relative", overflowX: "auto" }}>
        <svg
          ref={svgRef}
          width={800}
          height={svgH}
          viewBox={`0 0 800 ${svgH}`}
          style={{ display: "block", minWidth: 800, maxWidth: "none" }}
        >
          {/* Tick lines */}
          {ticks.map(ep => {
            const x = epochToX(ep, 800);
            return (
              <g key={ep}>
                <line x1={x} y1={0} x2={x} y2={visible.length * (ROW_H + GAP)} stroke={C.line} strokeWidth={1} />
                <text x={x} y={visible.length * (ROW_H + GAP) + 14} textAnchor="middle" fill={C.muted} fontSize={S.timelineTick}>{ep}</text>
              </g>
            );
          })}

          {/* "Now" marker */}
          {(() => {
            const baseCurrentEpoch = Number.isFinite(Number(currentEpoch)) && Number(currentEpoch) > 0
              ? Number(currentEpoch)
              : epochMax;
            const nowEpoch = Math.min(Math.max(baseCurrentEpoch, timelineMin), timelineMax);
            const x = epochToX(nowEpoch, 800);
            const label = `Current epoch ${nowEpoch}`;
            const labelW = Math.max(84, Math.round(label.length * 5.4) + 10);
            const labelX = Math.min(Math.max(x - labelW / 2, 2), 800 - labelW - 2);
            const labelY = visible.length * (ROW_H + GAP) + 28;
            return (
              <g>
                <line x1={x} y1={0} x2={x} y2={visible.length * (ROW_H + GAP)} stroke={C.yes} strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
                <rect
                  x={labelX}
                  y={labelY - 9}
                  width={labelW}
                  height={12}
                  rx={3}
                  fill="rgba(9, 14, 16, 0.9)"
                  stroke={C.yes}
                  strokeOpacity={0.45}
                />
                <text x={labelX + 5} y={labelY} fill={C.yes} fontSize={S.timelineInline} opacity={0.9}>{label}</text>
              </g>
            );
          })()}

          {/* Proposal bars */}
          {visible.map((p, i) => {
            const startEp  = p.submittedEpoch || epochMin;
            const termEp   = p.enactedEpoch || p.ratifiedEpoch || p.droppedEpoch || p.expiredEpoch || p.expirationEpoch || epochMax;
            const x1 = epochToX(startEp, 800);
            const x2 = Math.max(epochToX(Math.min(termEp, timelineMax), 800), x1 + 3);
            const y  = i * (ROW_H + GAP);
            const typeColor = getTypeColor(p.governanceType || "Unknown");
            const outColor  = outcomeColor(p.outcome);

            return (
              <g
                key={`${p.txHash || "tx"}:${p.certIndex ?? "na"}:${p.actionName || p.governanceType || "row"}:${startEp}:${i}`}
                onMouseEnter={e => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  setTooltip({
                    name: p.actionName || p.governanceType || "Unknown",
                    type: p.governanceType,
                    outcome: p.outcome || "Pending",
                    start: startEp, end: termEp,
                    x: e.clientX - (rect?.left || 0),
                    y: e.clientY - (rect?.top  || 0),
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: "default" }}
              >
                {/* Type-coloured track */}
                <rect x={x1} y={y} width={x2 - x1} height={ROW_H} fill={typeColor} opacity={0.3} rx={2} />
                {/* Outcome-coloured left notch */}
                <rect x={x1} y={y} width={Math.min(4, x2 - x1)} height={ROW_H} fill={outColor} opacity={0.9} rx={2} />
              </g>
            );
          })}

          {/* X-axis label */}
          <text x={400} y={svgH - 2} textAnchor="middle" fill={C.muted} fontSize={S.timelineTick}>Epoch</text>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            style={{
              position: "absolute",
              left: Math.min(tooltip.x + 12, 580),
              top:  Math.max(tooltip.y - 60, 0),
              background: "#1a2530",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: S.tooltip,
              color: C.text,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              zIndex: 10,
              maxWidth: 280,
            }}
          >
            <strong style={{ display: "block", whiteSpace: "normal", wordBreak: "break-word", maxWidth: 260, marginBottom: 2 }}>
              {tooltip.name}
            </strong>
            <span style={{ color: C.muted }}>{tooltip.type}</span>
            <br />
            <span style={{ color: outcomeColor(tooltip.outcome) }}>{tooltip.outcome}</span>
            {" · "}
            <span style={{ color: C.muted }}>Ep {tooltip.start} → {tooltip.end}</span>
          </div>
        )}
      </div>

      {/* Type legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1rem", marginTop: "0.75rem", fontSize: S.filter, color: C.muted }}>
        <span style={{ alignSelf: "center", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: S.filterLabel }}>Type:</span>
        {allTypes.map(t => (
          <span key={t} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ display: "inline-block", width: 24, height: 8, background: getTypeColor(t), borderRadius: 2, opacity: 0.7 }} />
            {shortType(t)}
          </span>
        ))}
        <span style={{ marginLeft: "1rem", alignSelf: "center", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: S.filterLabel }}>Outcome notch:</span>
        {[["Enacted/Ratified", C.yes], ["Dropped/Expired", C.no], ["Pending", C.abstain]].map(([label, color]) => (
          <span key={label} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ display: "inline-block", width: 4, height: 8, background: color, borderRadius: 2 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── CC Vote Types by Seat ───────────────────────────────────────────────────────
function CcVoteTypesBySeatBar({ rows }) {
  const data = [...rows]
    .sort((a, b) => b.cast - a.cast)
    .map((m) => ({
      name: m.name,
      Constitutional: m.constitutionalVotes || 0,
      Unconstitutional: m.unconstitutionalVotes || 0,
      Abstain: m.abstainVotes || 0,
      cast: m.cast || 0,
    }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(320, data.length * 30 + 56)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 22, bottom: 4, left: 8 }}
        barCategoryGap="24%"
        barGap={3}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
        <XAxis type="number" tick={{ fill: C.muted, fontSize: S.axis }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fill: C.text, fontSize: S.axisSmall }} width={150} />
        <Tooltip {...TooltipStyle} />
        <Legend wrapperStyle={{ fontSize: S.legend, color: C.muted }} />
        <Bar dataKey="Constitutional" fill={C.yes} radius={[0, 3, 3, 0]} />
        <Bar dataKey="Unconstitutional" fill={C.no} radius={[0, 3, 3, 0]} />
        <Bar dataKey="Abstain" fill={C.abstain} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const [raw, setRaw]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [showAllCcMembers, setShowAllCcMembers] = useState(false);

  // Active slice index for interactive donuts
  const [activePropType, setActivePropType]       = useState(0);
  const [activePropOutcome, setActivePropOutcome] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/api/accountability?view=all`)
      .then(r => r.json())
      .then(d => { setRaw(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const s = useMemo(() => {
    if (!raw) return null;
    const proposalInfo = raw.proposalInfo || {};
    const proposals = Object.values(proposalInfo);
    const dreps     = raw.dreps || [];
    const cc        = raw.committeeMembers || [];
    const spos      = raw.spos || [];
    const special   = raw.specialDreps || {};

    // Exclude virtual "Always Abstain" and "Always No Confidence" DReps from all
    // statistics except the dedicated voting-power KPI cards (which read from `special`).
    const realDreps = dreps.filter(d => {
      const id = String(d.id || "").toLowerCase();
      return !id.includes("always_abstain") && !id.includes("always_no_confidence");
    });

    // ── Proposals ─────────────────────────────────────────────────────────────
    const typeMap = {}, outcomeMap = {};
    proposals.forEach(p => {
      typeMap[p.governanceType || "Unknown"] = (typeMap[p.governanceType || "Unknown"] || 0) + 1;
      outcomeMap[p.outcome || "Unknown"]     = (outcomeMap[p.outcome || "Unknown"]     || 0) + 1;
    });
    const byType    = Object.entries(typeMap).sort((a,b)=>b[1]-a[1]).map(([name,value],i)=>({ name, value, color: TYPE_PALETTE[i%TYPE_PALETTE.length] }));
    const byOutcome = Object.entries(outcomeMap).sort((a,b)=>b[1]-a[1]).map(([name,value])=>{
      const lo = name.toLowerCase();
      const color = lo==="yes"||lo==="enacted"||lo==="ratified" ? C.yes : lo==="no"||lo==="dropped"||lo==="expired" ? C.no : lo==="pending"||lo==="active" ? C.abstain : C.muted;
      return { name, value, color };
    });

    // ── Votes ──────────────────────────────────────────────────────────────────
    const voteRoles = { drep:{yes:0,no:0,abstain:0}, cc:{yes:0,no:0,abstain:0}, spo:{yes:0,no:0,abstain:0} };
    proposals.forEach(p => {
      const vs = p.voteStats || {};
      const dr = vs.drep || {};
      const cv = vs.constitutional_committee || {};
      const sv = vs.stake_pool || {};
      voteRoles.drep.yes    += dr.yes||0; voteRoles.drep.no    += dr.no||0; voteRoles.drep.abstain    += dr.abstain||0;
      voteRoles.cc.yes      += cv.yes||0; voteRoles.cc.no      += cv.no||0; voteRoles.cc.abstain      += cv.abstain||0;
      voteRoles.spo.yes     += sv.yes||0; voteRoles.spo.no     += sv.no||0; voteRoles.spo.abstain     += sv.abstain||0;
    });
    const votesByRole = [
      { role: "DReps",     ...voteRoles.drep },
      { role: "Committee", ...voteRoles.cc   },
      { role: "SPOs",      ...voteRoles.spo  },
    ];
    const totalYes     = voteRoles.drep.yes    + voteRoles.cc.yes    + voteRoles.spo.yes;
    const totalNo      = voteRoles.drep.no     + voteRoles.cc.no     + voteRoles.spo.no;
    const totalAbstain = voteRoles.drep.abstain + voteRoles.cc.abstain + voteRoles.spo.abstain;

    // ── Proposals over time (by submitted epoch) ───────────────────────────────
    const epochMap = {};
    proposals.forEach(p => {
      const ep = p.submittedEpoch || 0;
      if (!ep) return;
      if (!epochMap[ep]) epochMap[ep] = { epoch: ep, total: 0, yes: 0, no: 0, pending: 0 };
      epochMap[ep].total++;
      const lo = (p.outcome||"").toLowerCase();
      if (lo === "yes" || lo === "enacted" || lo === "ratified") epochMap[ep].yes++;
      else if (lo === "no" || lo === "dropped" || lo === "expired") epochMap[ep].no++;
      else epochMap[ep].pending++;
    });
    const byEpoch = Object.values(epochMap).sort((a,b)=>a.epoch-b.epoch);

    // ── Epoch range (for timelines) ───────────────────────────────────────────
    // CC epoch range: earliest seat start to latest expiration
    const ccEpochs = cc.map(m => m.seatStartEpoch || 0).filter(Boolean);
    const ccExpEpochs = cc.map(m => m.expirationEpoch || 0).filter(Boolean);
    const ccEpochMin = Math.min(...ccEpochs, ...proposals.map(p=>p.submittedEpoch||9999).filter(v=>v<9999));
    const ccEpochMax = Math.max(...ccExpEpochs, ...proposals.map(p=>p.expirationEpoch||0), ...proposals.map(p=>p.enactedEpoch||0), ...proposals.map(p=>p.ratifiedEpoch||0));
    const epochMin = Math.max(ccEpochMin, 500);
    const currentEpoch = Number(raw.latestEpoch || 0) || null;
    const epochMax = Math.max(ccEpochMax, Number(currentEpoch || 0), epochMin + 10);

    // ── DReps ─────────────────────────────────────────────────────────────────
    const activeDreps   = realDreps.filter(d => d.active === true);
    const retiredDreps  = realDreps.filter(d => d.retired === true);
    const totalDrepAda  = realDreps.reduce((s,d) => s+(d.votingPowerAda||0), 0);
    const abstainAda    = Number(special.alwaysAbstain?.votingPowerAda || 0);
    const noConfAda     = Number(special.alwaysNoConfidence?.votingPowerAda || 0);

    // Attendance buckets
    const attBuckets = [
      { name: "100%",  value: 0, color: C.yes     },
      { name: "75–99%",value: 0, color: "#34d399"  },
      { name: "50–74%",value: 0, color: C.abstain  },
      { name: "25–49%",value: 0, color: "#fb923c"  },
      { name: "<25%",  value: 0, color: C.no       },
    ];
    realDreps.forEach(d => {
      const a = pct((d.votes||[]).length, d.totalEligibleVotes||1);
      if (a === 100) attBuckets[0].value++;
      else if (a >= 75) attBuckets[1].value++;
      else if (a >= 50) attBuckets[2].value++;
      else if (a >= 25) attBuckets[3].value++;
      else attBuckets[4].value++;
    });

    // Transparency buckets
    const tsBuckets = [
      { name: "High (70+)",  value: 0, color: C.yes     },
      { name: "Mid (40–69)", value: 0, color: C.abstain  },
      { name: "Low (21–39)", value: 0, color: "#fb923c"  },
      { name: "None (≤20)",  value: 0, color: C.muted    },
    ];
    realDreps.forEach(d => {
      const sc = d.transparencyScore || 0;
      if (sc >= 70) tsBuckets[0].value++;
      else if (sc >= 40) tsBuckets[1].value++;
      else if (sc > 20)  tsBuckets[2].value++;
      else               tsBuckets[3].value++;
    });

    // Response time buckets
    const rtBuckets = [
      { name: "< 24h", value: 0, color: C.yes    },
      { name: "1–3d",  value: 0, color: "#34d399" },
      { name: "3–7d",  value: 0, color: C.abstain },
      { name: "> 7d",  value: 0, color: C.no      },
    ];
    const allRTs = [];
    realDreps.forEach(d => (d.votes||[]).forEach(v => {
      if (v.responseHours != null && v.responseHours >= 0) {
        allRTs.push(v.responseHours);
        const h = v.responseHours;
        if (h < 24) rtBuckets[0].value++;
        else if (h < 72) rtBuckets[1].value++;
        else if (h < 168) rtBuckets[2].value++;
        else rtBuckets[3].value++;
      }
    }));
    allRTs.sort((a,b)=>a-b);
    const medianRT = allRTs.length ? allRTs[Math.floor(allRTs.length/2)] : null;

    // Top 10 DReps by voting power
    const top10Dreps = [...realDreps].sort((a,b)=>(b.votingPowerAda||0)-(a.votingPowerAda||0)).slice(0,10)
      .map(d => ({ name: d.name || d.id.slice(0,14)+"…", size: d.votingPowerAda||0 }));

    // ── CC ────────────────────────────────────────────────────────────────────
    const activeCc = cc.filter(m => m.status === "active");

    const isEarlyDroppedAction = (proposalId) => {
      const info = proposalInfo[proposalId] || {};
      const droppedEpoch = Number(info?.droppedEpoch || 0);
      const expirationEpoch = Number(info?.expirationEpoch || 0);
      if (!Number.isFinite(droppedEpoch) || droppedEpoch <= 0) return false;
      if (!Number.isFinite(expirationEpoch) || expirationEpoch <= 0) return false;
      return droppedEpoch < expirationEpoch;
    };
    const requiresCommitteeParticipation = (proposalId) => {
      const info = proposalInfo[proposalId] || {};
      const type = String(info?.governanceType || "").toLowerCase();
      if (type.includes("no confidence")) return false;
      if (type.includes("new committee")) return false;
      if (isEarlyDroppedAction(proposalId)) return false;
      return true;
    };
    const committeeProposalTerminalEpoch = (proposalId) => {
      const info = proposalInfo[proposalId] || {};
      const candidates = [
        Number(info.enactedEpoch || 0),
        Number(info.ratifiedEpoch || 0),
        Number(info.droppedEpoch || 0),
        Number(info.expiredEpoch || 0),
        Number(info.expirationEpoch || 0),
      ].filter((x) => Number.isFinite(x) && x > 0);
      if (candidates.length === 0) return null;
      return Math.min(...candidates);
    };
    const proposalIds = Object.keys(proposalInfo);
    const proposalEpochs = new Map(
      proposalIds.map((proposalId) => [proposalId, Number(proposalInfo[proposalId]?.submittedEpoch || 0)])
    );

    const ccAttendance = cc.map((m) => {
      const eligibility = getCommitteeEligibilityWindow(m, proposalInfo);
      const startEpoch = Number(eligibility?.startEpoch || 0);
      const hasStartEpoch = Boolean(eligibility?.hasStartEpoch);
      const effectiveEndEpoch = Number(eligibility?.effectiveEndEpoch || 0);
      const hasEffectiveEndEpoch = Boolean(eligibility?.hasEffectiveEndEpoch);

      const votes = (m.votes || []).filter((vote) => {
        if (hasStartEpoch || hasEffectiveEndEpoch) {
          const proposalEpoch = Number(proposalInfo[vote.proposalId]?.submittedEpoch || 0);
          if (Number.isFinite(proposalEpoch) && proposalEpoch > 0) {
            if (hasStartEpoch && proposalEpoch < startEpoch) return false;
            if (hasEffectiveEndEpoch && proposalEpoch > effectiveEndEpoch) return false;
          }
        }
        return true;
      });

      const cast = votes.length;
      const committeeEligibleProposalIds = proposalIds.filter((proposalId) => requiresCommitteeParticipation(proposalId));
      const actorVoteByProposal = new Set(votes.map((v) => v.proposalId));

      let eligible = 0;
      if (hasStartEpoch || hasEffectiveEndEpoch) {
        for (const proposalId of committeeEligibleProposalIds) {
          const proposalEpoch = Number(proposalEpochs.get(proposalId) || 0);
          if (Number.isFinite(proposalEpoch) && proposalEpoch > 0) {
            if (hasStartEpoch && proposalEpoch < startEpoch) continue;
            if (hasEffectiveEndEpoch && proposalEpoch > effectiveEndEpoch) continue;
          }
          if (hasEffectiveEndEpoch && !actorVoteByProposal.has(proposalId)) {
            const terminalEpoch = committeeProposalTerminalEpoch(proposalId);
            if (!terminalEpoch || terminalEpoch > effectiveEndEpoch) continue;
          }
          eligible += 1;
        }
      } else {
        eligible = committeeEligibleProposalIds.length;
      }
      const totalEligibleVotes = Math.max(eligible, cast, 0);

      return {
        name: m.name || m.id.slice(0,12),
        cast,
        eligible: totalEligibleVotes,
        pct: pct(cast, totalEligibleVotes || 1),
        withRationale: votes.filter(v => v.hasRationale).length,
        constitutionalVotes: votes.filter(v => String(v.vote || "").toLowerCase() === "yes").length,
        unconstitutionalVotes: votes.filter(v => String(v.vote || "").toLowerCase() === "no").length,
        abstainVotes: votes.filter(v => String(v.vote || "").toLowerCase() === "abstain").length,
        active: m.status === "active",
      };
    }).sort((a,b)=>b.pct-a.pct);

    // ── SPOs ──────────────────────────────────────────────────────────────────
    const delMap = {};
    spos.forEach(s => { delMap[s.delegationStatus||"Unknown"] = (delMap[s.delegationStatus||"Unknown"]||0)+1; });
    const byDelegation = Object.entries(delMap).sort((a,b)=>b[1]-a[1])
      .map(([name,value],i)=>({ name, value, color: TYPE_PALETTE[i%TYPE_PALETTE.length] }));

    const totalSpoAda = spos.reduce((s,p)=>s+(p.votingPowerAda||0), 0);

    const toSortedPower = (rows) => [...rows]
      .map((r) => Number(r?.votingPowerAda || 0))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => b - a);
    const minEntitiesForThresholdPct = (sortedPowers, thresholdPct) => {
      if (!sortedPowers.length) return null;
      const total = sortedPowers.reduce((sum, n) => sum + n, 0);
      if (!(total > 0) || !(thresholdPct > 0)) return null;
      const target = total * (thresholdPct / 100);
      let acc = 0;
      for (let i = 0; i < sortedPowers.length; i += 1) {
        acc += sortedPowers[i];
        if (acc >= target) return i + 1;
      }
      return sortedPowers.length;
    };
    const nakamotoCoefficient = (sortedPowers) => {
      if (!sortedPowers.length) return null;
      const total = sortedPowers.reduce((sum, n) => sum + n, 0);
      if (!(total > 0)) return null;
      const target = total / 2;
      let acc = 0;
      for (let i = 0; i < sortedPowers.length; i += 1) {
        acc += sortedPowers[i];
        if (acc > target) return i + 1;
      }
      return sortedPowers.length;
    };

    const drepPowers = toSortedPower(realDreps);
    const spoPowers = toSortedPower(spos);

    const tc = raw.thresholdContext || {};
    const thresholdRowsRaw = [
      ["Motion No Confidence", Number(tc?.drep?.motionNoConfidence || 0)],
      ["Committee Normal", Number(tc?.drep?.committeeNormal || 0)],
      ["Constitution Update", Number(tc?.drep?.updateToConstitution || 0)],
      ["Hard Fork Initiation", Number(tc?.drep?.hardForkInitiation || 0)],
      ["Network Group", Number(tc?.drep?.networkGroup || 0)],
      ["Economic Group", Number(tc?.drep?.economicGroup || 0)],
      ["Technical Group", Number(tc?.drep?.technicalGroup || 0)],
      ["Governance Group", Number(tc?.drep?.govGroup || 0)],
      ["Treasury Withdrawal", Number(tc?.drep?.treasuryWithdrawal || 0)],
    ].filter(([, pct]) => Number.isFinite(pct) && pct > 0);

    const drepThresholdReachRows = (thresholdRowsRaw.length > 0
      ? thresholdRowsRaw
      : [["50% Majority", 50], ["66.7% Supermajority", 66.7]]
    )
      .sort((a, b) => a[1] - b[1])
      .map(([threshold, pct]) => ({
        threshold,
        requiredPct: pct,
        topDrepsNeeded: minEntitiesForThresholdPct(drepPowers, pct) || 0,
      }));

    const drepNakamoto = nakamotoCoefficient(drepPowers);
    const spoNakamoto = nakamotoCoefficient(spoPowers);

    return {
      proposals, byType, byOutcome, byEpoch,
      totalYes, totalNo, totalAbstain, votesByRole,
      dreps: realDreps, activeDreps, retiredDreps, totalDrepAda, abstainAda, noConfAda,
      attBuckets, tsBuckets, rtBuckets, medianRT, top10Dreps,
      cc, activeCc, ccAttendance,
      spos, byDelegation, totalSpoAda, drepThresholdReachRows, drepNakamoto, spoNakamoto,
      epochMin, epochMax, currentEpoch,
    };
  }, [raw]);

  if (loading) return <main className="shell stats-page"><p className="muted" style={{paddingTop:"3rem"}}>Loading statistics…</p></main>;
  if (error)   return <main className="shell stats-page"><p className="vote-error" style={{paddingTop:"3rem"}}>Error: {error}</p></main>;
  if (!s)      return null;

  const totalVotes = s.totalYes + s.totalNo + s.totalAbstain;
  const ccChartRows = showAllCcMembers ? s.ccAttendance : s.ccAttendance.filter((row) => row.active);
  const hasInactiveCcMembers = s.ccAttendance.some((row) => !row.active);

  return (
    <main className="shell stats-page">
      {/* Header */}
      <div className="stats-header">
        <h1 className="stats-title">Governance Statistics</h1>
      </div>

      {/* ── KPI Row ───────────────────────────────────────────────────────────── */}
      <div className="stats-kpi-grid">
        <KpiCard label="Total Proposals"   value={fmt(s.proposals.length)}       sub={`${Object.keys(s.byType||{}).length} action types`}           accent={C.yes} />
        <KpiCard label="Total Votes Cast"  value={fmt(totalVotes)}               sub="across all groups & proposals"                                  accent="#7eb8ff" />
        <KpiCard label="Active DReps"      value={fmt(s.activeDreps.length)}     sub={`of ${fmt(s.dreps.length)} registered`}                        accent={C.yes} />
        <KpiCard label="DRep Voting Power" value={fmtAda(s.totalDrepAda)}        sub="delegated active stake"                                         accent={C.abstain} />
        <KpiCard label="CC Members"        value={fmt(s.activeCc.length)}        sub={`${s.cc.length} historical`} accent={C.no} />
        <KpiCard label="SPOs Voting"       value={fmt(s.spos.length)}            sub={fmtAda(s.totalSpoAda) + " combined"}                            accent="#c084fc" />
        <KpiCard label="Always Abstain"    value={fmtAda(s.abstainAda)}          sub="delegated to abstain pool"                                      accent={C.muted} />
        <KpiCard label="No Confidence"     value={fmtAda(s.noConfAda)}           sub="delegated to no-confidence"                                     accent={C.no} />
      </div>

      {/* ── Proposals over time ───────────────────────────────────────────────── */}
      <Section title="Proposals Submitted per Epoch" wide>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={s.byEpoch} margin={{top:4,right:16,bottom:4,left:8}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
            <XAxis dataKey="epoch" tick={{fill:C.muted,fontSize:S.axis}} />
            <YAxis tick={{fill:C.muted,fontSize:S.axis}} allowDecimals={false} />
            <Tooltip {...TooltipStyle} />
            <Legend wrapperStyle={{fontSize:S.legend,color:C.muted}} />
            <Bar dataKey="yes"     name="Passed"  stackId="a" fill={C.yes}     radius={[0,0,0,0]} />
            <Bar dataKey="no"      name="Failed"  stackId="a" fill={C.no}      radius={[0,0,0,0]} />
            <Bar dataKey="pending" name="Pending" stackId="a" fill={C.abstain} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── Governance Actions Timeline ──────────────────────────────────────── */}
      <Section title="Governance Actions Timeline" wide>
        <GovernanceActionsTimeline
          proposals={s.proposals}
          epochMin={s.epochMin}
          epochMax={s.epochMax}
          currentEpoch={s.currentEpoch}
        />
      </Section>

      {/* ── Proposal type + outcome donuts ─────────────────────────────────────── */}
      <div className="stats-row">
        <Section title="Proposals by Governance Type" half>
          <div className="stats-donut-row">
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie
                  activeIndex={activePropType}
                  activeShape={renderActiveShape}
                  data={s.byType}
                  cx="50%" cy="50%"
                  innerRadius={58} outerRadius={82}
                  dataKey="value"
                  onMouseEnter={(_,i) => setActivePropType(i)}
                >
                  {s.byType.map((entry,i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip {...TooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="stats-donut-legend">
              {s.byType.map((t,i) => (
                <li key={i} className={`stats-legend-row${i===activePropType?" active":""}`} onMouseEnter={()=>setActivePropType(i)}>
                  <span className="stats-legend-dot" style={{background:t.color}} />
                  <span className="stats-legend-name">{t.name}</span>
                  <strong>{t.value}</strong>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section title="Proposals by Outcome" half>
          <div className="stats-donut-row">
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie
                  activeIndex={activePropOutcome}
                  activeShape={renderActiveShape}
                  data={s.byOutcome}
                  cx="50%" cy="50%"
                  innerRadius={58} outerRadius={82}
                  dataKey="value"
                  onMouseEnter={(_,i) => setActivePropOutcome(i)}
                >
                  {s.byOutcome.map((entry,i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip {...TooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <ul className="stats-donut-legend">
              {s.byOutcome.map((t,i) => (
                <li key={i} className={`stats-legend-row${i===activePropOutcome?" active":""}`} onMouseEnter={()=>setActivePropOutcome(i)}>
                  <span className="stats-legend-dot" style={{background:t.color}} />
                  <span className="stats-legend-name">{t.name}</span>
                  <strong>{t.value}</strong>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      </div>

      {/* ── Votes by group ────────────────────────────────────────────────────── */}
      <Section title="Vote Breakdown by Group" wide>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={s.votesByRole} layout="vertical" margin={{top:4,right:32,bottom:4,left:80}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
            <XAxis type="number" tick={{fill:C.muted,fontSize:S.axis}} />
            <YAxis type="category" dataKey="role" tick={{fill:C.text,fontSize:S.axis}} width={75} />
            <Tooltip {...TooltipStyle} />
            <Legend wrapperStyle={{fontSize:S.legend,color:C.muted}} />
            <Bar dataKey="yes"     name="Yes"     fill={C.yes}     radius={[0,2,2,0]} />
            <Bar dataKey="no"      name="No"      fill={C.no}      radius={[0,2,2,0]} />
            <Bar dataKey="abstain" name="Abstain" fill={C.abstain} radius={[0,2,2,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      <Section title="Top DReps Needed per Threshold" wide>
        <ResponsiveContainer width="100%" height={Math.max(240, s.drepThresholdReachRows.length * 34 + 44)}>
          <BarChart data={s.drepThresholdReachRows} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
            <XAxis type="number" tick={{ fill: C.muted, fontSize: S.axis }} allowDecimals={false} />
            <YAxis type="category" dataKey="threshold" tick={{ fill: C.text, fontSize: S.axisSmall }} width={170} />
            <Tooltip
              {...TooltipStyle}
              formatter={(v, _name, item) => [`${v}`, `Top DReps needed (${Number(item?.payload?.requiredPct || 0).toFixed(1)}%)`]}
            />
            <Legend wrapperStyle={{ fontSize: S.legend, color: C.muted }} />
            <Bar dataKey="topDrepsNeeded" name="Top DReps Needed" fill="#7eb8ff" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="stats-kpi-grid" style={{ marginTop: "0.8rem" }}>
          <KpiCard label="DRep Nakamoto" value={s.drepNakamoto ?? "—"} sub="entities to exceed 50% voting power" accent="#7eb8ff" />
          <KpiCard label="SPO Nakamoto" value={s.spoNakamoto ?? "—"} sub="entities to exceed 50% voting power" accent="#c084fc" />
        </div>
      </Section>

      {/* ── DRep section ──────────────────────────────────────────────────────── */}
      <div className="stats-row">
        <Section title="DRep Attendance Distribution" half>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={s.attBuckets} margin={{top:4,right:8,bottom:4,left:8}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:S.axis}} />
              <YAxis tick={{fill:C.muted,fontSize:S.axis}} allowDecimals={false} />
              <Tooltip {...TooltipStyle} formatter={(v)=>[`${fmt(v)} DReps`,"Count"]} />
              <Bar dataKey="value" name="DReps" radius={[4,4,0,0]}>
                {s.attBuckets.map((b,i) => <Cell key={i} fill={b.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="muted stats-note">Share of eligible proposals each DRep voted on.</p>
        </Section>

        <Section title="DRep Transparency Score Distribution" half>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={s.tsBuckets} margin={{top:4,right:8,bottom:4,left:8}}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:S.axisSmall}} />
              <YAxis tick={{fill:C.muted,fontSize:S.axis}} allowDecimals={false} />
              <Tooltip {...TooltipStyle} formatter={(v)=>[`${fmt(v)} DReps`,"Count"]} />
              <Bar dataKey="value" name="DReps" radius={[4,4,0,0]}>
                {s.tsBuckets.map((b,i) => <Cell key={i} fill={b.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="muted stats-note">Rationale coverage score — higher means more votes documented.</p>
        </Section>
      </div>

      <div className="stats-row">
        <Section title="DRep Response Time Distribution" half>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={s.rtBuckets} margin={{top:4,right:8,bottom:4,left:8}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:S.axis}} />
              <YAxis tick={{fill:C.muted,fontSize:S.axis}} allowDecimals={false} />
              <Tooltip {...TooltipStyle} formatter={(v)=>[`${fmt(v)} votes`,"Count"]} />
              <Bar dataKey="value" name="Votes" radius={[4,4,0,0]}>
                {s.rtBuckets.map((b,i) => <Cell key={i} fill={b.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="muted stats-note">
            How quickly DReps vote after a proposal is submitted.
            {s.medianRT != null && <> Median: <strong>{s.medianRT < 48 ? `${Math.round(s.medianRT)}h` : `${Math.round(s.medianRT/24)}d`}</strong>.</>}
          </p>
        </Section>

        <Section title="Top 10 DReps by Voting Power" half>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={s.top10Dreps} layout="vertical" margin={{top:4,right:60,bottom:4,left:8}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
              <XAxis type="number" tick={{fill:C.muted,fontSize:S.axisSmall}} tickFormatter={v=>fmtAda(v)} />
              <YAxis type="category" dataKey="name" tick={{fill:C.text,fontSize:S.axisSmall}} width={90} />
              <Tooltip {...TooltipStyle} formatter={(v)=>[fmtAda(v),"Voting Power"]} />
              <Bar dataKey="size" name="Voting Power" fill={C.yes} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      {/* ── CC section ────────────────────────────────────────────────────────── */}

      {/* CC Membership Timeline */}
      <Section title="Constitutional Committee Timeline" wide>
        <CcMembershipTimeline
          cc={s.cc}
          epochMin={s.epochMin}
          epochMax={s.epochMax}
          currentEpoch={s.currentEpoch}
        />
      </Section>

      {/* CC Vote Types by Seat */}
      <Section title="Constitutional Committee — Vote Types by Seat" wide>
        {hasInactiveCcMembers && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
            <button
              className="stats-filter-btn active"
              onClick={() => setShowAllCcMembers((v) => !v)}
            >
              {showAllCcMembers ? "Show active only" : "Show all members"}
            </button>
          </div>
        )}
        <CcVoteTypesBySeatBar rows={ccChartRows} />
        <p className="muted stats-note">Constitutional / Unconstitutional / Abstain votes by committee seat.</p>
      </Section>

      {/* CC Votes Cast vs Eligible */}
      <Section title="Constitutional Committee — Votes Cast" wide>
        {hasInactiveCcMembers && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
            <button
              className="stats-filter-btn active"
              onClick={() => setShowAllCcMembers((v) => !v)}
            >
              {showAllCcMembers ? "Show active only" : "Show all members"}
            </button>
          </div>
        )}
        <ResponsiveContainer width="100%" height={Math.max(320, ccChartRows.length * 30 + 56)}>
          <BarChart data={ccChartRows} layout="vertical" margin={{top:4,right:16,bottom:4,left:8}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
            <XAxis type="number" tick={{fill:C.muted,fontSize:S.axis}} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{fill:C.text,fontSize:S.axisSmall}} width={150} />
            <Tooltip {...TooltipStyle} />
            <Legend wrapperStyle={{fontSize:S.legend,color:C.muted}} />
            <Bar dataKey="eligible"      name="Eligible" fill={C.muted} opacity={0.4} radius={[0,3,3,0]} />
            <Bar dataKey="cast"          name="Voted"    fill={C.yes} radius={[0,3,3,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

    </main>
  );
}
