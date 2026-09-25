// Governance statistics: proposals, participation, concentration, DRep
// distributions, delegation movement and the committee's history. Every
// chart reads from the aggregated /api/v1/stats model (a few KB); the
// delegation trend and history come from their own endpoints on demand.
import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis
} from "recharts";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { useSnapshotKey } from "../hooks/useSnapshotKey";
import { useDelegationHistory, useDelegationTrend, useDrepSearch, useStats } from "../api/queries";
import { LivePill, SnapshotBanner } from "../components/LiveStatus";
import { Alert, Button, Card, Chip, Input, PageHeader, Segmented, Skeleton, StatGrid, StatTile, Switch } from "../ui";
import { IconSearch } from "../ui/icons";
import { formatAdaCompact, formatNumber, shortType, truncateMiddle } from "../lib/governance/format";
import { CHART, TYPE_PALETTE, axisTick, axisTickSmall, categoryTick, legendProps, outcomeColor, tooltipProps } from "../lib/charts";

function ChartCard({ title, subtitle, note, actions, children, className }) {
  return (
    <Card title={title} subtitle={subtitle} actions={actions} className={className} footer={note}>
      {children}
    </Card>
  );
}

function hoursLabel(h) {
  if (h === null || h === undefined) return "—";
  return h < 48 ? `${Math.round(h)}h` : `${Math.round(h / 24)}d`;
}

/* Donut with a legend list ------------------------------------------------ */
function Donut({ data, colorFor, total }) {
  const [active, setActive] = useState(0);
  const current = data[active] || data[0];
  return (
    <div className="p-stats__donut">
      <div className="p-stats__donut-chart">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={80} paddingAngle={2} stroke="none" onMouseEnter={(_, i) => setActive(i)}>
              {data.map((d, i) => <Cell key={d.name} fill={colorFor(d, i)} opacity={i === active ? 1 : 0.55} />)}
            </Pie>
            <ChartTooltip {...tooltipProps} />
          </PieChart>
        </ResponsiveContainer>
        {current ? (
          <div className="p-stats__donut-center" aria-hidden="true">
            <strong className="num">{formatNumber(current.value)}</strong>
            <span>{total ? `${((current.value / total) * 100).toFixed(1)}%` : ""}</span>
          </div>
        ) : null}
      </div>
      <ul className="p-stats__legend">
        {data.map((d, i) => (
          <li key={d.name} className={i === active ? "is-active" : ""} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} tabIndex={0}>
            <span className="p-stats__swatch" style={{ background: colorFor(d, i) }} />
            <span className="p-stats__legend-name">{d.name}</span>
            <b className="num">{formatNumber(d.value)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Epoch axis helpers for the SVG timelines -------------------------------- */
function useEpochScale(min, max, width, padLeft, padRight) {
  const span = Math.max(1, max - min);
  return (epoch) => padLeft + ((epoch - min) / span) * (width - padLeft - padRight);
}
function ticksBetween(min, max, step) {
  const out = [];
  for (let e = Math.ceil(min / step) * step; e <= max; e += step) out.push(e);
  return out;
}

/* Committee seat timeline ------------------------------------------------- */
function CommitteeTimeline({ members, epochMin, epochMax, currentEpoch }) {
  const [hover, setHover] = useState(null);
  const W = 860; const PAD_L = 170; const PAD_R = 24; const ROW = 26; const BAR = 12;
  const rows = [...members].sort((a, b) => (a.status === "active" ? 0 : 1) - (b.status === "active" ? 0 : 1) || (a.seatStartEpoch || 0) - (b.seatStartEpoch || 0));
  const H = rows.length * ROW + 44;
  const x = useEpochScale(epochMin, epochMax, W, PAD_L, PAD_R);
  const now = Math.min(Math.max(currentEpoch || epochMax, epochMin), epochMax);
  const color = (m) => (m.status === "active" ? CHART.yes : m.status === "retired" ? CHART.warning : CHART.muted);
  return (
    <div className="p-stats__timeline">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Committee seats by epoch">
        {ticksBetween(epochMin, epochMax, 20).map((e) => (
          <g key={e}>
            <line x1={x(e)} x2={x(e)} y1={0} y2={rows.length * ROW} stroke={CHART.line} />
            <text x={x(e)} y={rows.length * ROW + 16} textAnchor="middle" fill={CHART.muted} fontSize={10}>{e}</text>
          </g>
        ))}
        <line x1={x(now)} x2={x(now)} y1={0} y2={rows.length * ROW} stroke={CHART.accent} strokeDasharray="4 3" opacity={0.7} />
        <text x={Math.min(x(now) + 4, W - 90)} y={rows.length * ROW + 32} fill={CHART.accent} fontSize={10}>Epoch {now} (now)</text>
        {rows.map((m, i) => {
          const start = m.seatStartEpoch || epochMin;
          const end = m.expirationEpoch || epochMax;
          const x1 = x(start); const x2 = Math.max(x(Math.min(end, epochMax)), x1 + 4);
          const y = i * ROW + (ROW - BAR) / 2;
          const name = m.name || `${String(m.id || "").slice(0, 12)}…`;
          return (
            <g key={m.id || i} onMouseEnter={() => setHover({ i, name, ...m, start, end })} onMouseLeave={() => setHover(null)}>
              <rect x={0} y={i * ROW} width={W} height={ROW} fill={i % 2 ? "transparent" : CHART.line} opacity={0.35} />
              <text x={PAD_L - 10} y={i * ROW + ROW / 2 + 4} textAnchor="end" fill={m.status === "active" ? CHART.text : CHART.muted} fontSize={11} fontWeight={m.status === "active" ? 600 : 400}>
                {name.length > 24 ? `${name.slice(0, 23)}…` : name}
              </text>
              <rect x={x1} y={y} width={x2 - x1} height={BAR} rx={4} fill={color(m)} opacity={m.status === "active" ? 0.9 : 0.45}>
                <title>{`${name} · ${m.status} · epoch ${start} → ${end}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      {hover ? <div className="p-stats__tip" style={{ top: hover.i * ROW + ROW + 4, left: PAD_L }}><strong>{hover.name}</strong><br /><span className="muted">{hover.status} · epoch {hover.start} → {hover.end}</span></div> : null}
      <div className="c-legend" style={{ marginTop: 8 }}>
        {[["Active", CHART.yes, 0.9], ["Retired", CHART.warning, 0.45], ["Expired", CHART.muted, 0.45]].map(([label, c, o]) => <span key={label} className="c-legend__item"><span className="c-legend__swatch" style={{ background: c, opacity: o }} />{label}</span>)}
      </div>
    </div>
  );
}

/* Governance actions timeline --------------------------------------------- */
function ActionsTimeline({ rows, epochMin, epochMax, currentEpoch }) {
  const DEFAULT = 12;
  const [type, setType] = useState("");
  const [outcome, setOutcome] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [hover, setHover] = useState(null);
  const types = useMemo(() => [...new Set(rows.map((r) => r.governanceType))].sort(), [rows]);
  const outcomes = useMemo(() => [...new Set(rows.map((r) => r.outcome))].sort(), [rows]);
  const typeColor = (t) => TYPE_PALETTE[Math.max(0, types.indexOf(t)) % TYPE_PALETTE.length];
  const filtered = rows.filter((r) => (!type || r.governanceType === type) && (!outcome || r.outcome === outcome));
  const visible = showAll || filtered.length <= DEFAULT ? filtered : filtered.slice(-DEFAULT);
  const [min, max] = useMemo(() => {
    if (!visible.length) return [epochMin, epochMax];
    const starts = visible.map((r) => r.submittedEpoch);
    const ends = visible.map((r) => r.endEpoch || epochMax);
    const lo = Math.min(...starts); const hi = Math.max(...ends, currentEpoch || epochMax);
    return [Math.min(lo, hi), Math.max(lo, hi)];
  }, [visible, epochMin, epochMax, currentEpoch]);
  const W = 860; const PAD_L = 16; const PAD_R = 16; const ROW = 12; const GAP = 3;
  const H = visible.length * (ROW + GAP) + 44;
  const x = useEpochScale(min, max, W, PAD_L, PAD_R);
  const now = Math.min(Math.max(currentEpoch || max, min), max);
  const step = max - min > 60 ? 10 : 5;

  return (
    <div>
      <div className="p-stats__filters">
        <div className="c-chips"><Chip active={!type} onClick={() => setType("")}>All types</Chip>{types.map((t) => <Chip key={t} active={type === t} onClick={() => setType(type === t ? "" : t)}><span className="p-stats__swatch" style={{ background: typeColor(t) }} />{shortType(t)}</Chip>)}</div>
        <div className="c-chips"><Chip active={!outcome} onClick={() => setOutcome("")}>All outcomes</Chip>{outcomes.map((o) => <Chip key={o} active={outcome === o} onClick={() => setOutcome(outcome === o ? "" : o)}><span className="p-stats__swatch" style={{ background: outcomeColor(o) }} />{o}</Chip>)}</div>
        <div className="row" style={{ marginLeft: "auto" }}>
          <span className="tiny muted">Showing {visible.length} of {filtered.length}</span>
          {filtered.length > DEFAULT ? <Button size="sm" onClick={() => setShowAll((v) => !v)}>{showAll ? `Newest ${DEFAULT}` : "Show all"}</Button> : null}
        </div>
      </div>
      <div className="p-stats__timeline">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Governance actions by epoch">
          {ticksBetween(min, max, step).map((e) => (
            <g key={e}>
              <line x1={x(e)} x2={x(e)} y1={0} y2={visible.length * (ROW + GAP)} stroke={CHART.line} />
              <text x={x(e)} y={visible.length * (ROW + GAP) + 14} textAnchor="middle" fill={CHART.muted} fontSize={10}>{e}</text>
            </g>
          ))}
          <line x1={x(now)} x2={x(now)} y1={0} y2={visible.length * (ROW + GAP)} stroke={CHART.accent} strokeDasharray="4 3" opacity={0.7} />
          <text x={Math.min(x(now) + 4, W - 90)} y={visible.length * (ROW + GAP) + 30} fill={CHART.accent} fontSize={10}>Epoch {now} (now)</text>
          {visible.map((r, i) => {
            const x1 = x(r.submittedEpoch); const x2 = Math.max(x(Math.min(r.endEpoch || max, max)), x1 + 3);
            const y = i * (ROW + GAP);
            return (
              <g key={r.proposalId} onMouseEnter={() => setHover({ ...r, y })} onMouseLeave={() => setHover(null)}>
                <rect x={x1} y={y} width={x2 - x1} height={ROW} rx={3} fill={typeColor(r.governanceType)} opacity={0.35}><title>{`${r.actionName} · ${r.governanceType} · ${r.outcome} · epoch ${r.submittedEpoch} → ${r.endEpoch || "open"}`}</title></rect>
                <rect x={x1} y={y} width={Math.min(4, x2 - x1)} height={ROW} rx={2} fill={outcomeColor(r.outcome)} />
              </g>
            );
          })}
        </svg>
        {hover ? (
          <div className="p-stats__tip" style={{ top: hover.y + ROW + 4, left: 16 }}>
            <Link to={`/actions/${encodeURIComponent(hover.proposalId)}`}><strong>{hover.actionName}</strong></Link><br />
            <span className="muted">{hover.governanceType} · </span><span style={{ color: outcomeColor(hover.outcome) }}>{hover.outcome}</span><span className="muted"> · epoch {hover.submittedEpoch} → {hover.endEpoch || "open"}</span>
          </div>
        ) : null}
      </div>
      <p className="tiny muted" style={{ marginTop: 8 }}>Bar colour is the action type; the notch at the start is the outcome (green passed, red failed, amber pending). Hover a bar for the action.</p>
    </div>
  );
}

/* Delegation movers ------------------------------------------------------- */
function DelegationMovers() {
  const [epochs, setEpochs] = useState(5);
  const trend = useDelegationTrend(epochs);
  const list = (rows, tone) => (
    <ol className="p-stats__movers">
      {rows.map((d) => (
        <li key={d.id}>
          <Link to={`/dreps/${encodeURIComponent(d.id)}`} className="p-stats__mover-name" title={d.name}>{d.name}</Link>
          <span className={`num ${tone}`}>{d.deltaPct > 0 ? "+" : ""}{d.deltaPct.toFixed(1)}%</span>
          <span className="num tiny muted">{formatAdaCompact(d.currentAda)}</span>
        </li>
      ))}
    </ol>
  );
  return (
    <ChartCard title="Delegation movers" subtitle="Change in delegated voting power per DRep, versus the snapshot from N epochs ago." note={trend.data?.comparedEpoch != null ? `Epoch ${trend.data.comparedEpoch} → ${trend.data.currentEpoch}. Only DReps present in both snapshots are compared.` : null}
      actions={<Segmented ariaLabel="Compare against" value={epochs} onChange={setEpochs} options={[1, 3, 5, 10].map((n) => ({ value: n, label: `${n} ep` }))} />}>
      {trend.isLoading ? <Skeleton kind="row" count={5} /> : trend.error ? <Alert tone="warning">{trend.error.message}</Alert> : (trend.data?.gainers?.length || trend.data?.losers?.length) ? (
        <div className="grid grid--2">
          <div><h4 className="caps" style={{ color: "var(--color-vote-yes)", marginBottom: 8 }}>Top gainers</h4>{list(trend.data.gainers || [], "yes")}</div>
          <div><h4 className="caps" style={{ color: "var(--color-vote-no)", marginBottom: 8 }}>Top losers</h4>{list(trend.data.losers || [], "no")}</div>
        </div>
      ) : <p className="muted">No significant delegation changes found for this period.</p>}
    </ChartCard>
  );
}

/* Delegation history for one DRep ----------------------------------------- */
function DelegationHistory() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const deferred = useDeferredValue(query);
  const search = useDrepSearch(deferred);
  const history = useDelegationHistory(selected?.id);
  const results = search.data?.results || [];
  const data = history.data?.epochs || [];
  const yMax = data.length ? Math.max(...data.map((d) => d.ada)) : 0;

  return (
    <ChartCard title="Delegation history" subtitle="How one DRep's delegated power moved epoch by epoch.">
      <div className="p-stats__search">
        <div className="c-search">
          <span className="c-search__icon"><IconSearch size={16} /></span>
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} placeholder="Search a DRep by name or ID…" aria-label="Search DReps" />
        </div>
        {open && results.length > 0 ? (
          <ul className="c-menu p-stats__results" role="listbox">
            {results.map((d) => (
              <li key={d.id}>
                <button type="button" className="c-menu__item" role="option" aria-selected={selected?.id === d.id} onMouseDown={() => { setSelected(d); setQuery(d.name || d.id); setOpen(false); }}>
                  <span style={{ display: "grid" }}>
                    <span>{d.name || <span className="mono">{truncateMiddle(d.id, 12, 6)}</span>}</span>
                    {d.name ? <span className="tiny muted mono">{truncateMiddle(d.id, 14, 6)}</span> : null}
                  </span>
                  <span className="tiny muted num" style={{ marginLeft: "auto" }}>{formatAdaCompact(d.votingPowerAda)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {!selected ? <p className="muted small" style={{ marginTop: 12 }}>Pick a DRep to chart its delegated ADA per epoch.</p> : history.isLoading ? <Skeleton kind="card" /> : history.error ? <Alert tone="warning">{history.error.message}</Alert> : data.length === 0 ? <p className="muted small" style={{ marginTop: 12 }}>No delegation history found for this DRep.</p> : (
        <div style={{ marginTop: 12 }}>
          <p className="small" style={{ marginBottom: 8 }}><Link to={`/dreps/${encodeURIComponent(selected.id)}`} className="strong">{history.data.name}</Link> <span className="muted">· {data.length} epochs · now {formatAdaCompact(data[data.length - 1].ada)}</span></p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="epoch" tick={axisTickSmall} axisLine={false} tickLine={false} />
              <YAxis tick={axisTickSmall} tickFormatter={(v) => formatAdaCompact(v)} domain={[0, yMax * 1.05]} width={64} axisLine={false} tickLine={false} />
              <ChartTooltip {...tooltipProps} labelFormatter={(e) => `Epoch ${e}`} formatter={(v, _n, item) => [`${formatAdaCompact(v)}${item?.payload?.deltaPct != null ? ` (${item.payload.deltaPct > 0 ? "+" : ""}${item.payload.deltaPct.toFixed(2)}%)` : ""}`, "Delegated"]} />
              <Line type="monotone" dataKey="ada" stroke={CHART.accent} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

/* Page -------------------------------------------------------------------- */
export default function StatsPage() {
  useSeoMeta({ title: "Governance Statistics", description: "Epoch-by-epoch Cardano governance analytics: DRep participation rates, SPO voting trends, proposal outcomes, and Nakamoto coefficients." });
  const snapshotKey = useSnapshotKey();
  const query = useStats(snapshotKey);
  const s = query.data?.stats || null;
  const meta = query.data?.meta || null;
  const [allCc, setAllCc] = useState(false);

  if (query.isLoading) {
    return <main className="shell page p-stats" aria-busy="true"><Skeleton kind="title" width="40%" /><div style={{ height: 24 }} /><div className="c-stats"><Skeleton kind="card" count={4} /></div><div style={{ height: 24 }} /><Skeleton kind="card" count={2} /></main>;
  }
  if (query.error || !s) {
    return <main className="shell page p-stats"><Alert tone="danger" title="Could not load statistics.">{query.error?.message}</Alert></main>;
  }

  const ccRows = allCc ? s.ccAttendance : s.ccAttendance.filter((r) => r.status === "active");
  const hasInactiveCc = s.ccAttendance.some((r) => r.status !== "active");
  const typeColor = (d, i) => TYPE_PALETTE[i % TYPE_PALETTE.length];
  const ccToggle = hasInactiveCc ? <Switch checked={allCc} onChange={setAllCc} label="Include past members" /> : null;

  return (
    <main className="shell page p-stats">
      <SnapshotBanner snapshotKey={snapshotKey} latestEpoch={meta?.latestEpoch} />
      <PageHeader eyebrow="Insights" title="Governance statistics" lead="How Cardano's governance bodies are participating, deciding and concentrating over time." actions={<LivePill enabled={!snapshotKey} generatedAt={meta?.generatedAt} />} />

      <div className="stack--6">
        <StatGrid>
          <StatTile label="Proposals" value={formatNumber(s.counts.proposals)} hint={`${s.counts.actionTypes} action types`} />
          <StatTile label="Votes cast" value={formatNumber(s.counts.totalVotes)} hint="all bodies, all proposals" />
          <StatTile label="Active DReps" value={formatNumber(s.counts.activeDreps)} hint={`of ${formatNumber(s.counts.dreps)} registered`} />
          <StatTile label="DRep voting power" value={formatAdaCompact(s.power.drepAda)} hint="delegated to DReps" tone="accent" />
          <StatTile label="Committee" value={formatNumber(s.counts.activeCommittee)} hint={`${s.counts.committee} seats over time`} />
          <StatTile label="SPOs voting" value={formatNumber(s.counts.spos)} hint={`${formatAdaCompact(s.power.spoAda)} combined`} />
          <StatTile label="Always abstain" value={formatAdaCompact(s.power.alwaysAbstainAda)} hint="delegated to the abstain option" />
          <StatTile label="No confidence" value={formatAdaCompact(s.power.alwaysNoConfidenceAda)} hint="delegated to no-confidence" tone="danger" />
        </StatGrid>

        <div className="grid grid--2 p-stats__grid">
          <ChartCard title="Proposals per epoch" subtitle="Submitted actions by outcome.">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={s.byEpoch} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="epoch" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} allowDecimals={false} axisLine={false} tickLine={false} />
                <ChartTooltip {...tooltipProps} labelFormatter={(e) => `Epoch ${e}`} />
                <Legend {...legendProps} />
                <Bar dataKey="passed" name="Passed" stackId="a" fill={CHART.yes} />
                <Bar dataKey="failed" name="Failed" stackId="a" fill={CHART.no} />
                <Bar dataKey="pending" name="Pending" stackId="a" fill={CHART.warning} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Participation over time" subtitle="Votes cast per submitted epoch, by body.">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={s.participationByEpoch} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="epoch" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} allowDecimals={false} axisLine={false} tickLine={false} />
                <ChartTooltip {...tooltipProps} labelFormatter={(e) => `Epoch ${e}`} />
                <Legend {...legendProps} />
                <Line type="monotone" dataKey="drepCast" name="DRep votes" stroke={CHART.yes} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ccCast" name="CC votes" stroke={CHART.no} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="spoCast" name="SPO votes" stroke={CHART.info} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="Governance actions timeline" subtitle="Each bar is one action from submission to its close.">
          <ActionsTimeline rows={s.timeline} epochMin={s.epochMin} epochMax={s.epochMax} currentEpoch={s.currentEpoch} />
        </ChartCard>

        <div className="grid grid--2 p-stats__grid">
          <ChartCard title="Proposals by type"><Donut data={s.byType} colorFor={typeColor} total={s.counts.proposals} /></ChartCard>
          <ChartCard title="Proposals by outcome"><Donut data={s.byOutcome} colorFor={(d) => outcomeColor(d.name)} total={s.counts.proposals} /></ChartCard>
        </div>

        <div className="grid grid--2 p-stats__grid">
          <ChartCard title="Votes by body" subtitle="Yes, no and abstain across all proposals.">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={s.votesByRole} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="role" tick={categoryTick} width={80} axisLine={false} tickLine={false} />
                <ChartTooltip {...tooltipProps} />
                <Legend {...legendProps} />
                <Bar dataKey="yes" name="Yes" fill={CHART.yes} radius={[0, 3, 3, 0]} />
                <Bar dataKey="no" name="No" fill={CHART.no} radius={[0, 3, 3, 0]} />
                <Bar dataKey="abstain" name="Abstain" fill={CHART.abstain} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Top DReps needed per threshold" subtitle="How few of the largest DReps could carry each vote." note={<span>Nakamoto coefficient (entities to pass 50% of power): DReps <b className="num">{s.power.drepNakamoto ?? "—"}</b> · SPOs <b className="num">{s.power.spoNakamoto ?? "—"}</b></span>}>
            <ResponsiveContainer width="100%" height={Math.max(200, s.drepThresholdReach.length * 30 + 30)}>
              <BarChart data={s.drepThresholdReach} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={axisTick} allowDecimals={false} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="threshold" tick={axisTickSmall} width={150} axisLine={false} tickLine={false} />
                <ChartTooltip {...tooltipProps} formatter={(v, _n, item) => [v, `Top DReps needed for ${Number(item?.payload?.requiredPct || 0).toFixed(1)}%`]} />
                <Bar dataKey="topDrepsNeeded" name="Top DReps needed" fill={CHART.info} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid--2 p-stats__grid">
          <ChartCard title="DRep attendance" subtitle="Share of eligible proposals each DRep voted on." note="Distribution of registered DReps.">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={s.drepAttendance} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} allowDecimals={false} axisLine={false} tickLine={false} />
                <ChartTooltip {...tooltipProps} formatter={(v) => [`${formatNumber(v)} DReps`, "Count"]} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>{s.drepAttendance.map((b, i) => <Cell key={b.name} fill={[CHART.yes, "#34d399", CHART.warning, "#fb923c", CHART.no][i]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="DRep transparency" subtitle="Rationale coverage score; higher means more votes explained.">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={s.drepTransparency} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={axisTickSmall} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} allowDecimals={false} axisLine={false} tickLine={false} />
                <ChartTooltip {...tooltipProps} formatter={(v) => [`${formatNumber(v)} DReps`, "Count"]} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>{s.drepTransparency.map((b, i) => <Cell key={b.name} fill={[CHART.yes, CHART.warning, "#fb923c", CHART.muted][i]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="DRep response time" subtitle="How quickly DReps vote after a proposal is submitted." note={s.medianResponseHours != null ? <span>Median: <b>{hoursLabel(s.medianResponseHours)}</b></span> : null}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={s.drepResponse} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} allowDecimals={false} axisLine={false} tickLine={false} />
                <ChartTooltip {...tooltipProps} formatter={(v) => [`${formatNumber(v)} votes`, "Count"]} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>{s.drepResponse.map((b, i) => <Cell key={b.name} fill={[CHART.yes, "#34d399", CHART.warning, CHART.no][i]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Top 10 DReps by voting power">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={s.topDreps} layout="vertical" margin={{ top: 4, right: 48, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={axisTickSmall} tickFormatter={(v) => formatAdaCompact(v)} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={axisTickSmall} width={110} axisLine={false} tickLine={false} tickFormatter={(v) => (String(v).length > 16 ? `${String(v).slice(0, 15)}…` : v)} />
                <ChartTooltip {...tooltipProps} formatter={(v) => [formatAdaCompact(v), "Voting power"]} />
                <Bar dataKey="votingPowerAda" name="Voting power" fill={CHART.yes} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {!snapshotKey ? <DelegationMovers /> : null}
        {!snapshotKey ? <DelegationHistory /> : null}

        <ChartCard title="Constitutional Committee timeline" subtitle="Seat terms by epoch.">
          <CommitteeTimeline members={s.committee} epochMin={s.epochMin} epochMax={s.epochMax} currentEpoch={s.currentEpoch} />
        </ChartCard>

        <div className="grid grid--2 p-stats__grid">
          <ChartCard title="Committee votes by seat" subtitle="Constitutional, unconstitutional and abstain votes." actions={ccToggle}>
            <ResponsiveContainer width="100%" height={Math.max(240, ccRows.length * 30 + 50)}>
              <BarChart data={ccRows} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }} barCategoryGap="24%" barGap={3}>
                <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={axisTick} allowDecimals={false} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={axisTickSmall} width={130} axisLine={false} tickLine={false} tickFormatter={(v) => (String(v).length > 18 ? `${String(v).slice(0, 17)}…` : v)} />
                <ChartTooltip {...tooltipProps} />
                <Legend {...legendProps} />
                <Bar dataKey="constitutional" name="Constitutional" fill={CHART.yes} radius={[0, 3, 3, 0]} />
                <Bar dataKey="unconstitutional" name="Unconstitutional" fill={CHART.no} radius={[0, 3, 3, 0]} />
                <Bar dataKey="abstain" name="Abstain" fill={CHART.abstain} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Committee votes cast" subtitle="Voted versus eligible actions during each seat's term." actions={ccToggle}>
            <ResponsiveContainer width="100%" height={Math.max(240, ccRows.length * 30 + 50)}>
              <BarChart data={ccRows} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={axisTick} allowDecimals={false} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={axisTickSmall} width={130} axisLine={false} tickLine={false} tickFormatter={(v) => (String(v).length > 18 ? `${String(v).slice(0, 17)}…` : v)} />
                <ChartTooltip {...tooltipProps} />
                <Legend {...legendProps} />
                <Bar dataKey="eligible" name="Eligible" fill={CHART.muted} opacity={0.4} radius={[0, 3, 3, 0]} />
                <Bar dataKey="cast" name="Voted" fill={CHART.yes} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </main>
  );
}
