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

// ── Tooltip skin ──────────────────────────────────────────────────────────────
const TooltipStyle = {
  contentStyle: { background: "#1a2530", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 13, color: "#e8f0f4" },
  itemStyle:    { color: "#e8f0f4" },
  cursor:       { fill: "rgba(84,228,188,0.07)" },
};

// ── Active donut slice renderer ───────────────────────────────────────────────
function renderActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 12} textAnchor="middle" fill={C.text} fontSize={13} fontWeight={600}>{payload.name}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={C.muted} fontSize={12}>{fmt(value)}</text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill={C.muted} fontSize={11}>{(percent * 100).toFixed(1)}%</text>
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
function CcMembershipTimeline({ cc, epochMin, epochMax }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const PAD_LEFT  = 160;
  const PAD_RIGHT = 32;
  const ROW_H     = 32;
  const BAR_H     = 14;
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
        width="100%"
        viewBox={`0 0 800 ${svgH}`}
        style={{ display: "block", minWidth: 540 }}
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
              <text x={x} y={totalRows * ROW_H + 16} textAnchor="middle" fill={C.muted} fontSize={10}>{ep}</text>
            </g>
          );
        })}

        {/* "Now" marker (current epoch ≈ epochMax) */}
        {(() => {
          const x = epochToX(epochMax, 800);
          return (
            <g>
              <line x1={x} y1={0} x2={x} y2={totalRows * ROW_H} stroke={C.yes} strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
              <text x={x + 4} y={12} fill={C.yes} fontSize={9} opacity={0.7}>now</text>
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
                fontSize={10} fontWeight={m.status === "active" ? 600 : 400}
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
                  textAnchor="middle" fill="#000" fontSize={8} fontWeight={700}
                  opacity={0.7}
                >
                  {m.status}
                </text>
              )}
            </g>
          );
        })}

        {/* X-axis label */}
        <text x={400} y={svgH - 2} textAnchor="middle" fill={C.muted} fontSize={10}>Epoch</text>
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
            fontSize: 12,
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
      <div style={{ display: "flex", gap: "1.2rem", marginTop: "0.75rem", fontSize: 12, color: C.muted }}>
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
// Type → colour index
const TYPE_COLORS_MAP = {};
function getTypeColor(type) {
  if (!TYPE_COLORS_MAP[type]) {
    const idx = Object.keys(TYPE_COLORS_MAP).length;
    TYPE_COLORS_MAP[type] = TYPE_PALETTE[idx % TYPE_PALETTE.length];
  }
  return TYPE_COLORS_MAP[type];
}

function GovernanceActionsTimeline({ proposals, epochMin, epochMax }) {
  const [tooltip, setTooltip] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [filterOutcome, setFilterOutcome] = useState(null);
  const svgRef = useRef(null);

  const PAD_LEFT  = 20;
  const PAD_RIGHT = 20;
  const ROW_H     = 10;
  const GAP       = 2;
  const TICK_STEP = 20;

  // Sort proposals by submittedEpoch
  const sorted = useMemo(() => {
    let list = [...proposals]
      .filter(p => p.submittedEpoch)
      .sort((a, b) => (a.submittedEpoch || 0) - (b.submittedEpoch || 0));
    if (filterType)    list = list.filter(p => p.governanceType === filterType);
    if (filterOutcome) list = list.filter(p => (p.outcome || "Pending") === filterOutcome);
    return list;
  }, [proposals, filterType, filterOutcome]);

  // Build type list for legend/filter
  const allTypes    = [...new Set(proposals.map(p => p.governanceType || "Unknown"))].sort();
  const allOutcomes = [...new Set(proposals.map(p => p.outcome || "Pending"))].sort();

  // Reset type color map on each render so colours are consistent
  Object.keys(TYPE_COLORS_MAP).forEach(k => delete TYPE_COLORS_MAP[k]);
  allTypes.forEach(t => getTypeColor(t)); // pre-assign stable order

  const svgH = sorted.length * (ROW_H + GAP) + 48;

  function epochToX(ep, w) {
    const span = epochMax - epochMin || 1;
    return PAD_LEFT + ((ep - epochMin) / span) * (w - PAD_LEFT - PAD_RIGHT);
  }

  const ticks = [];
  const firstTick = Math.ceil(epochMin / TICK_STEP) * TICK_STEP;
  for (let ep = firstTick; ep <= epochMax; ep += TICK_STEP) ticks.push(ep);

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1rem", marginBottom: "0.8rem", fontSize: 12 }}>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Type:</span>
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
          <span style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Outcome:</span>
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
        <span style={{ color: C.muted, fontSize: 11, marginLeft: "auto", alignSelf: "center" }}>
          {sorted.length} / {proposals.filter(p=>p.submittedEpoch).length} proposals
        </span>
      </div>

      {/* Timeline SVG */}
      <div style={{ position: "relative", overflowX: "auto" }}>
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 800 ${svgH}`}
          style={{ display: "block", minWidth: 540 }}
        >
          {/* Tick lines */}
          {ticks.map(ep => {
            const x = epochToX(ep, 800);
            return (
              <g key={ep}>
                <line x1={x} y1={0} x2={x} y2={sorted.length * (ROW_H + GAP)} stroke={C.line} strokeWidth={1} />
                <text x={x} y={sorted.length * (ROW_H + GAP) + 14} textAnchor="middle" fill={C.muted} fontSize={10}>{ep}</text>
              </g>
            );
          })}

          {/* "Now" marker */}
          {(() => {
            const x = epochToX(epochMax, 800);
            return (
              <g>
                <line x1={x} y1={0} x2={x} y2={sorted.length * (ROW_H + GAP)} stroke={C.yes} strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
              </g>
            );
          })()}

          {/* Proposal bars */}
          {sorted.map((p, i) => {
            const startEp  = p.submittedEpoch || epochMin;
            const termEp   = p.enactedEpoch || p.ratifiedEpoch || p.droppedEpoch || p.expiredEpoch || p.expirationEpoch || epochMax;
            const x1 = epochToX(startEp, 800);
            const x2 = Math.max(epochToX(Math.min(termEp, epochMax), 800), x1 + 3);
            const y  = i * (ROW_H + GAP);
            const typeColor = getTypeColor(p.governanceType || "Unknown");
            const outColor  = outcomeColor(p.outcome);

            return (
              <g
                key={p.txHash || i}
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
          <text x={400} y={svgH - 2} textAnchor="middle" fill={C.muted} fontSize={10}>Epoch</text>
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
              fontSize: 12,
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1rem", marginTop: "0.75rem", fontSize: 11, color: C.muted }}>
        <span style={{ alignSelf: "center", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10 }}>Type:</span>
        {allTypes.map(t => (
          <span key={t} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ display: "inline-block", width: 24, height: 8, background: getTypeColor(t), borderRadius: 2, opacity: 0.7 }} />
            {shortType(t)}
          </span>
        ))}
        <span style={{ marginLeft: "1rem", alignSelf: "center", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10 }}>Outcome notch:</span>
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

// ── CC Attendance Grouped Bar (replaces radar) ─────────────────────────────────
function CcAttendanceBar({ ccAttendance }) {
  // Sort by attendance desc, show all members
  const data = [...ccAttendance].sort((a, b) => b.pct - a.pct).map(m => ({
    name: m.name,
    "Attendance %":  m.pct,
    "Rationale %":   pct(m.withRationale, m.cast || 1),
    cast:            m.cast,
    eligible:        m.eligible,
    withRationale:   m.withRationale,
    active:          m.active,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = data.find(r => r.name === label);
    return (
      <div style={{ ...TooltipStyle.contentStyle, padding: "8px 12px" }}>
        <strong style={{ color: C.text }}>{label}</strong>
        <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ color: C.yes }}>Attendance: {payload.find(p=>p.dataKey==="Attendance %")?.value ?? 0}%</span>
          <span style={{ color: C.abstain }}>Rationale coverage: {payload.find(p=>p.dataKey==="Rationale %")?.value ?? 0}%</span>
          {d && <span style={{ color: C.muted, fontSize: 11 }}>{d.cast} / {d.eligible} votes · {d.withRationale} with rationale</span>}
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36 + 40)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 60, bottom: 4, left: 8 }}
        barCategoryGap="25%"
        barGap={3}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
        <XAxis
          type="number" domain={[0, 100]}
          tick={{ fill: C.muted, fontSize: 11 }}
          tickFormatter={v => `${v}%`}
        />
        <YAxis
          type="category" dataKey="name"
          tick={{ fill: C.text, fontSize: 10 }}
          width={140}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(84,228,188,0.05)" }} />
        <Legend wrapperStyle={{ fontSize: 12, color: C.muted }} />
        <Bar dataKey="Attendance %" fill={C.yes}     radius={[0, 3, 3, 0]} />
        <Bar dataKey="Rationale %" fill={C.abstain}  radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const [raw, setRaw]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  // Active slice index for interactive donuts
  const [activePropType, setActivePropType]       = useState(0);
  const [activePropOutcome, setActivePropOutcome] = useState(0);
  const [activeDelegation, setActiveDelegation]   = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/api/accountability?view=all`)
      .then(r => r.json())
      .then(d => { setRaw(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const s = useMemo(() => {
    if (!raw) return null;
    const proposals = Object.values(raw.proposalInfo || {});
    const dreps     = raw.dreps || [];
    const cc        = raw.committeeMembers || [];
    const spos      = raw.spos || [];
    const special   = raw.specialDreps || {};

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
    const epochMax = Math.max(ccEpochMax, epochMin + 10);

    // ── DReps ─────────────────────────────────────────────────────────────────
    const activeDreps   = dreps.filter(d => d.active === true);
    const retiredDreps  = dreps.filter(d => d.retired === true);
    const totalDrepAda  = dreps.reduce((s,d) => s+(d.votingPowerAda||0), 0);
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
    dreps.forEach(d => {
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
    dreps.forEach(d => {
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
    dreps.forEach(d => (d.votes||[]).forEach(v => {
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
    const top10Dreps = [...dreps].sort((a,b)=>(b.votingPowerAda||0)-(a.votingPowerAda||0)).slice(0,10)
      .map(d => ({ name: d.name || d.id.slice(0,14)+"…", size: d.votingPowerAda||0 }));

    // ── CC ────────────────────────────────────────────────────────────────────
    const activeCc = cc.filter(m => m.status === "active");

    const ccAttendance = cc.map(m => ({
      name: m.name || m.id.slice(0,12),
      cast: (m.votes||[]).length,
      eligible: m.totalEligibleVotes || 1,
      pct: pct((m.votes||[]).length, m.totalEligibleVotes||1),
      withRationale: (m.votes||[]).filter(v=>v.hasRationale).length,
      active: m.status === "active",
    })).sort((a,b)=>b.pct-a.pct);

    // ── SPOs ──────────────────────────────────────────────────────────────────
    const delMap = {};
    spos.forEach(s => { delMap[s.delegationStatus||"Unknown"] = (delMap[s.delegationStatus||"Unknown"]||0)+1; });
    const byDelegation = Object.entries(delMap).sort((a,b)=>b[1]-a[1])
      .map(([name,value],i)=>({ name, value, color: TYPE_PALETTE[i%TYPE_PALETTE.length] }));

    const totalSpoAda = spos.reduce((s,p)=>s+(p.votingPowerAda||0), 0);

    return {
      proposals, byType, byOutcome, byEpoch,
      totalYes, totalNo, totalAbstain, votesByRole,
      dreps, activeDreps, retiredDreps, totalDrepAda, abstainAda, noConfAda,
      attBuckets, tsBuckets, rtBuckets, medianRT, top10Dreps,
      cc, activeCc, ccAttendance,
      spos, byDelegation, totalSpoAda,
      epochMin, epochMax,
    };
  }, [raw]);

  if (loading) return <main className="shell stats-page"><p className="muted" style={{paddingTop:"3rem"}}>Loading statistics…</p></main>;
  if (error)   return <main className="shell stats-page"><p className="vote-error" style={{paddingTop:"3rem"}}>Error: {error}</p></main>;
  if (!s)      return null;

  const totalVotes = s.totalYes + s.totalNo + s.totalAbstain;

  return (
    <main className="shell stats-page">
      {/* Header */}
      <div className="stats-header">
        <h1 className="stats-title">Governance Statistics</h1>
        <p className="muted stats-subtitle">
          Live eagle-eye view of Cardano on-chain governance ·{" "}
          {s.proposals.length} proposals · synced {raw.generatedAt ? new Date(raw.generatedAt).toLocaleString() : "—"}
        </p>
      </div>

      {/* ── KPI Row ───────────────────────────────────────────────────────────── */}
      <div className="stats-kpi-grid">
        <KpiCard label="Total Proposals"   value={fmt(s.proposals.length)}       sub={`${Object.keys(s.byType||{}).length} action types`}           accent={C.yes} />
        <KpiCard label="Total Votes Cast"  value={fmt(totalVotes)}               sub="across all groups & proposals"                                  accent="#7eb8ff" />
        <KpiCard label="Active DReps"      value={fmt(s.activeDreps.length)}     sub={`of ${fmt(s.dreps.length)} registered`}                        accent={C.yes} />
        <KpiCard label="DRep Voting Power" value={fmtAda(s.totalDrepAda)}        sub="delegated active stake"                                         accent={C.abstain} />
        <KpiCard label="CC Members"        value={fmt(s.activeCc.length)}        sub={`${s.activeCc.filter(m => s.ccAttendance.find(a=>a.name===(m.name||m.id.slice(0,12)) && a.pct===100)).length} at 100% attendance · ${s.cc.length} historical`} accent={C.no} />
        <KpiCard label="SPOs Voting"       value={fmt(s.spos.length)}            sub={fmtAda(s.totalSpoAda) + " combined"}                            accent="#c084fc" />
        <KpiCard label="Always Abstain"    value={fmtAda(s.abstainAda)}          sub="delegated to abstain pool"                                      accent={C.muted} />
        <KpiCard label="No Confidence"     value={fmtAda(s.noConfAda)}           sub="delegated to no-confidence"                                     accent={C.no} />
      </div>

      {/* ── Proposals over time ───────────────────────────────────────────────── */}
      <Section title="Proposals Submitted per Epoch" wide>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={s.byEpoch} margin={{top:4,right:16,bottom:4,left:8}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
            <XAxis dataKey="epoch" tick={{fill:C.muted,fontSize:11}} />
            <YAxis tick={{fill:C.muted,fontSize:11}} allowDecimals={false} />
            <Tooltip {...TooltipStyle} />
            <Legend wrapperStyle={{fontSize:12,color:C.muted}} />
            <Bar dataKey="yes"     name="Passed"  stackId="a" fill={C.yes}     radius={[0,0,0,0]} />
            <Bar dataKey="no"      name="Failed"  stackId="a" fill={C.no}      radius={[0,0,0,0]} />
            <Bar dataKey="pending" name="Pending" stackId="a" fill={C.abstain} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── Governance Actions Timeline ──────────────────────────────────────── */}
      <Section title="Governance Actions Timeline — Submitted → Enacted / Expired" wide>
        <GovernanceActionsTimeline
          proposals={s.proposals}
          epochMin={s.epochMin}
          epochMax={s.epochMax}
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
      <Section title="Vote Breakdown by Group (Yes / No / Abstain)" wide>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={s.votesByRole} layout="vertical" margin={{top:4,right:32,bottom:4,left:80}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line} horizontal={false} />
            <XAxis type="number" tick={{fill:C.muted,fontSize:11}} />
            <YAxis type="category" dataKey="role" tick={{fill:C.text,fontSize:12}} width={75} />
            <Tooltip {...TooltipStyle} />
            <Legend wrapperStyle={{fontSize:12,color:C.muted}} />
            <Bar dataKey="yes"     name="Yes"     fill={C.yes}     radius={[0,2,2,0]} />
            <Bar dataKey="no"      name="No"      fill={C.no}      radius={[0,2,2,0]} />
            <Bar dataKey="abstain" name="Abstain" fill={C.abstain} radius={[0,2,2,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── DRep section ──────────────────────────────────────────────────────── */}
      <div className="stats-row">
        <Section title="DRep Attendance Distribution" half>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={s.attBuckets} margin={{top:4,right:8,bottom:4,left:8}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:11}} />
              <YAxis tick={{fill:C.muted,fontSize:11}} allowDecimals={false} />
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
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:10}} />
              <YAxis tick={{fill:C.muted,fontSize:11}} allowDecimals={false} />
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
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:11}} />
              <YAxis tick={{fill:C.muted,fontSize:11}} allowDecimals={false} />
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
              <XAxis type="number" tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>fmtAda(v)} />
              <YAxis type="category" dataKey="name" tick={{fill:C.text,fontSize:10}} width={90} />
              <Tooltip {...TooltipStyle} formatter={(v)=>[fmtAda(v),"Voting Power"]} />
              <Bar dataKey="size" name="Voting Power" fill={C.yes} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      {/* ── CC section ────────────────────────────────────────────────────────── */}

      {/* CC Membership Timeline */}
      <Section title="Constitutional Committee — Membership Timeline (Epoch-Based)" wide>
        <CcMembershipTimeline
          cc={s.cc}
          epochMin={s.epochMin}
          epochMax={s.epochMax}
        />
      </Section>

      {/* CC Attendance vs Rationale Coverage (grouped horizontal bar, replaces radar) */}
      <Section title="Constitutional Committee — Attendance & Rationale Coverage" wide>
        <CcAttendanceBar ccAttendance={s.ccAttendance} />
        <p className="muted stats-note">
          Attendance = share of eligible votes cast. Rationale coverage = share of votes with published rationale.
          Active members shown in brighter colour.
        </p>
      </Section>

      {/* CC Votes Cast vs Eligible */}
      <Section title="Constitutional Committee — Votes Cast vs Eligible" wide>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={s.ccAttendance} margin={{top:4,right:16,bottom:4,left:8}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
            <XAxis dataKey="name" tick={{fill:C.muted,fontSize:10}} />
            <YAxis tick={{fill:C.muted,fontSize:11}} allowDecimals={false} />
            <Tooltip {...TooltipStyle} />
            <Legend wrapperStyle={{fontSize:12,color:C.muted}} />
            <Bar dataKey="eligible"      name="Eligible"       fill={C.muted}   opacity={0.4} radius={[4,4,0,0]} />
            <Bar dataKey="cast"          name="Voted"          fill={C.yes}     radius={[4,4,0,0]} />
            <Bar dataKey="withRationale" name="With Rationale" fill={C.abstain} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* ── SPO section ───────────────────────────────────────────────────────── */}
      <Section title="SPO Delegation Status" wide>
        <div className="stats-donut-row">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                activeIndex={activeDelegation}
                activeShape={renderActiveShape}
                data={s.byDelegation}
                cx="50%" cy="50%"
                innerRadius={52} outerRadius={76}
                dataKey="value"
                onMouseEnter={(_,i) => setActiveDelegation(i)}
              >
                {s.byDelegation.map((entry,i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip {...TooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="stats-donut-legend">
            {s.byDelegation.map((t,i) => (
              <li key={i} className={`stats-legend-row${i===activeDelegation?" active":""}`} onMouseEnter={()=>setActiveDelegation(i)}>
                <span className="stats-legend-dot" style={{background:t.color}} />
                <span className="stats-legend-name">{t.name}</span>
                <strong>{t.value}</strong>
              </li>
            ))}
          </ul>
        </div>
        <p className="muted stats-note">{fmt(s.spos.length)} SPOs total · {fmtAda(s.totalSpoAda)} combined voting power.</p>
      </Section>

      <p className="muted stats-footer">
        Snapshot generated: {raw.generatedAt ? new Date(raw.generatedAt).toLocaleString() : "—"} ·{" "}
        {raw.partial ? "⚠ Partial data" : `${fmt(s.proposals.length)} proposals fully indexed`} ·{" "}
        Auto-refreshes every 3 minutes server-side.
      </p>
    </main>
  );
}
