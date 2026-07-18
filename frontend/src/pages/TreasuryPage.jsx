import { useCallback, useEffect, useMemo, useState } from "react";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { Link } from "react-router-dom";
import { useSnapshotUpdates } from "../hooks/useSnapshotUpdates";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function fmtAda(value) {
  const n = Number(value || 0);
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtAdaShort(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

function fmtPct(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0%";
  return `${n.toFixed(2)}%`;
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "";
  const days = Math.floor((Date.now() - d) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

// Semantic colour + label for admin-API event types.
const ADMIN_EVENT_META = {
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
function adminStatusPill(status) {
  return status === "completed" ? "enacted" : status === "active" ? "active" : "expired";
}

function TreasuryAdminSection({ admin }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const undrawn = Math.max(0, admin.allocatedAda - admin.withdrawnAda);
  const msDone = (admin.milestones?.completed || 0) + (admin.milestones?.withdrawn || 0);
  const msTotal = admin.milestones?.total || 0;
  const statuses = ["all", "active", "paused", "completed"];
  const filtered = (admin.projects || []).filter(
    (p) => statusFilter === "all" || p.status === statusFilter
  );
  const shown = showAll ? filtered : filtered.slice(0, 12);

  // Milestone stacked bar segments (% of total)
  const seg = (n) => (msTotal > 0 ? (Number(n || 0) / msTotal) * 100 : 0);

  const evOrder = ["complete", "withdraw", "pause", "resume", "disburse", "fund", "modify", "initialize"];
  const evEntries = evOrder
    .filter((k) => admin.eventsByType && admin.eventsByType[k])
    .map((k) => [k, admin.eventsByType[k]]);

  return (
    <section className="panel">
      <h2>Treasury Accountability — Funded Projects</h2>
      <p className="muted" style={{ marginTop: "-0.25rem" }}>
        What has happened to approved withdrawals since enactment — how much has actually been drawn down
        against milestones, and which projects have stalled. Live on-chain data via the Intersect
        Administration API{admin.syncedBlock ? `, synced to block ${Number(admin.syncedBlock).toLocaleString()}` : ""}
        {admin.syncedAt ? ` (${fmtDate(admin.syncedAt)})` : ""}.
        {admin.stale ? " Showing last cached snapshot." : ""}
      </p>

      {/* KPI cards */}
      <section className="cards" style={{ marginBottom: "1rem" }}>
        <article className="card">
          <p>Approved / Allocated</p>
          <strong>{fmtAdaShort(admin.allocatedAda)} ₳</strong>
          <p className="muted">{admin.projectCount} funded projects</p>
        </article>
        <article className="card">
          <p>Drawn Down</p>
          <strong style={{ color: "#4ade80" }}>{fmtAdaShort(admin.withdrawnAda)} ₳</strong>
          <p className="muted">{fmtPct(admin.drawdownPct)} of allocated</p>
        </article>
        <article className="card">
          <p>Still Locked</p>
          <strong>{fmtAdaShort(undrawn)} ₳</strong>
          <p className="muted">approved but undrawn</p>
        </article>
        {admin.treasuryBalanceAda != null ? (
          <article className="card">
            <p>Treasury Contract</p>
            <strong>{fmtAdaShort(admin.treasuryBalanceAda)} ₳</strong>
            <p className="muted">current on-chain balance</p>
          </article>
        ) : null}
        <article className="card">
          <p>Milestones</p>
          <strong>{msDone}<span style={{ opacity: 0.5, fontSize: "0.7em" }}> / {msTotal}</span></strong>
          <p className="muted">{admin.milestones?.pending || 0} pending · {admin.milestones?.paused || 0} paused</p>
        </article>
        <article className="card">
          <p>Paused Projects</p>
          <strong style={{ color: admin.pausedCount > 0 ? "#fbbf24" : undefined }}>{admin.pausedCount}</strong>
          <p className="muted">
            {admin.projectCount > 0 ? `${Math.round((admin.pausedCount / admin.projectCount) * 100)}% of all projects` : "—"}
          </p>
        </article>
      </section>

      {/* ADA drawdown bar */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
        <span>Funds drawn down — {fmtAdaShort(admin.withdrawnAda)} ₳ of {fmtAdaShort(admin.allocatedAda)} ₳</span>
        <span>{fmtPct(admin.drawdownPct)}</span>
      </div>
      <div className="treasury-progress-track">
        <div className="treasury-progress-fill" style={{ width: `${Math.min(100, admin.drawdownPct)}%`, background: "#4ade80" }} />
      </div>

      {/* Milestone breakdown bar */}
      {msTotal > 0 ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", margin: "1rem 0 0.35rem" }}>
            <span>Milestone progress — {msTotal} total</span>
            <span>{admin.milestones.withdrawn} withdrawn · {admin.milestones.completed} completed · {admin.milestones.pending} pending · {admin.milestones.paused} paused</span>
          </div>
          <div className="treasury-progress-track" style={{ display: "flex", overflow: "hidden" }}>
            <div className="treasury-progress-fill" style={{ width: `${seg(admin.milestones.withdrawn)}%`, background: "#4ade80" }} title={`${admin.milestones.withdrawn} withdrawn`} />
            <div className="treasury-progress-fill" style={{ width: `${seg(admin.milestones.completed)}%`, background: "#38bdf8" }} title={`${admin.milestones.completed} completed (not withdrawn)`} />
            <div className="treasury-progress-fill" style={{ width: `${seg(admin.milestones.pending)}%`, background: "#64748b" }} title={`${admin.milestones.pending} pending`} />
            <div className="treasury-progress-fill" style={{ width: `${seg(admin.milestones.paused)}%`, background: "#fbbf24" }} title={`${admin.milestones.paused} paused`} />
          </div>
        </>
      ) : null}

      {/* Event-type activity summary */}
      {evEntries.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.1rem" }}>
          {evEntries.map(([k, n]) => {
            const meta = ADMIN_EVENT_META[k] || { color: "#94a3b8", label: k };
            return (
              <span key={k} style={{
                fontSize: "0.75rem", padding: "3px 10px", borderRadius: 999,
                border: `1px solid ${meta.color}55`, background: `${meta.color}18`, color: meta.color, fontWeight: 600,
              }}>
                {meta.label} · {n}
              </span>
            );
          })}
          {admin.eventTotal ? (
            <span style={{ fontSize: "0.75rem", padding: "3px 10px", color: "var(--text-muted)" }}>
              {admin.eventTotal} on-chain events total
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Projects table + activity feed */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2.4fr) minmax(0, 1fr)", gap: "1.5rem", marginTop: "1.5rem", alignItems: "start" }} className="treasury-admin-grid">
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.75rem", alignItems: "center" }}>
            <strong style={{ fontSize: "0.9rem" }}>Projects</strong>
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setShowAll(false); }}
                className="mode-btn"
                style={{
                  fontSize: "0.75rem", padding: "3px 11px", textTransform: "capitalize",
                  borderColor: statusFilter === s ? "var(--mint)" : undefined,
                  color: statusFilter === s ? "var(--mint)" : undefined,
                }}
              >
                {s}{s !== "all" && admin.byStatus?.[s] ? ` (${admin.byStatus[s]})` : ""}
              </button>
            ))}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Allocated</th>
                  <th>Drawdown</th>
                  <th>Milestones</th>
                  <th>Funded</th>
                  <th>Last activity</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => {
                  const msProgress = p.milestones.total > 0 ? (p.milestones.done / p.milestones.total) * 100 : 0;
                  const barColor = p.status === "paused"
                    ? "#fbbf24"
                    : (p.drawdownPct < msProgress - 20) ? "#f87171" : "#4ade80";
                  return (
                    <tr key={p.projectId || p.name}>
                      <td style={{ maxWidth: 260 }}>
                        <strong>{p.name || "Unnamed project"}</strong>
                        {p.projectId ? <div className="mono" style={{ fontSize: "0.68rem", opacity: 0.55 }}>{p.projectId}</div> : null}
                      </td>
                      <td>
                        <span className={`pill pill--${adminStatusPill(p.status)}`}>
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {fmtAdaShort(p.allocatedAda)} ₳
                        <div className="muted" style={{ fontSize: "0.7rem" }}>{fmtAdaShort(p.withdrawnAda)} drawn</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 120 }}>
                          <div className="treasury-progress-track" style={{ flex: 1, margin: 0, height: 7 }}>
                            <div className="treasury-progress-fill" style={{ width: `${p.drawdownPct}%`, background: barColor }} />
                          </div>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", width: 34, textAlign: "right" }}>{p.drawdownPct}%</span>
                        </div>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        <strong style={{ color: "var(--text)" }}>{p.milestones.done}</strong>/{p.milestones.total}
                        {p.milestones.paused > 0 ? <span style={{ color: "#fbbf24" }}> · {p.milestones.paused}⏸</span> : null}
                      </td>
                      <td style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(p.fundedIso)}</td>
                      <td style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }} title={fmtDate(p.lastActivityIso)}>{fmtAgo(p.lastActivityIso) || "—"}</td>
                    </tr>
                  );
                })}
                {shown.length === 0 ? (
                  <tr><td colSpan={7} className="muted" style={{ padding: "1rem", textAlign: "center" }}>No projects match this filter.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {filtered.length > 12 ? (
            <button className="mode-btn" style={{ marginTop: "0.75rem", fontSize: "0.78rem" }} onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show fewer" : `Show all ${filtered.length}`}
            </button>
          ) : null}
        </div>

        {/* Recent activity feed */}
        <div style={{ minWidth: 0 }}>
          <strong style={{ fontSize: "0.9rem", display: "block", marginBottom: "0.75rem" }}>Recent activity</strong>
          {admin.recentEvents && admin.recentEvents.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {admin.recentEvents.slice(0, 12).map((e, i) => {
                const meta = ADMIN_EVENT_META[e.type] || { color: "#94a3b8", label: e.type };
                return (
                  <div key={`${e.txHash}-${i}`} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", fontSize: "0.8rem", lineHeight: 1.35 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: meta.color, marginTop: 6, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                      {e.amountAda ? <span> · {fmtAdaShort(e.amountAda)} ₳</span> : null}
                      <span className="muted"> · {fmtAgo(e.dateIso)}</span>
                      {e.project ? <div style={{ color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.project}</div> : null}
                      {e.milestone ? <div className="muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.72rem" }}>{e.milestone}</div> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted" style={{ fontSize: "0.8rem" }}>No recent events available.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default function TreasuryPage() {
  useSeoMeta({
    title: "Treasury",
    description: "Monitor Cardano treasury withdrawal proposals, net change limit status, and enacted budget transactions."
  });
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [periodKey, setPeriodKey] = useState("current");
  const [checkedRatified, setCheckedRatified] = useState({});
  const [checkedActive, setCheckedActive] = useState({});

  const load = useCallback(async (opts = {}) => {
    try {
      if (opts.soft) setRefreshing(true);
      else setLoading(true);
      setError("");
      const res = await fetch("/api/treasury");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load treasury data.");
      setPayload(data);
      setCheckedRatified((prev) => {
        const next = { ...prev };
        for (const r of (data.ratified || [])) if (!(r.proposalId in next)) next[r.proposalId] = true;
        return next;
      });
      setCheckedActive((prev) => {
        const next = { ...prev };
        for (const r of (data.activePipeline || [])) if (!(r.proposalId in next)) next[r.proposalId] = true;
        return next;
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useSnapshotUpdates({ onUpdate: () => load({ soft: true }) });

  // Treasury Administration accountability (post-approval execution).
  // Loaded independently so a slow/unavailable external API never blocks the page.
  const [admin, setAdmin] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/treasury-admin")
      .then((r) => r.json())
      .then((d) => { if (alive && d && d.available) setAdmin(d); })
      .catch(() => { /* section stays hidden */ });
    return () => { alive = false; };
  }, []);

  const periods = payload?.periods || [];
  const periodData = periodKey === "current" ? payload?.current : payload?.previous;
  const totals = periodData?.totals || {};
  const withdrawals = periodData?.withdrawals || [];
  const epochBreakdown = periodData?.epochBreakdown || [];
  const ratified = payload?.ratified || [];
  const activePipeline = payload?.activePipeline || [];

  // Pacing calculations
  const currentEpoch = Number(payload?.currentEpoch || 0);
  const startEpoch = Number(periodData?.period?.startEpoch || 0);
  const endEpoch = Number(periodData?.period?.endEpoch || 0);
  const windowLength = endEpoch - startEpoch;
  const epochsElapsed = currentEpoch > startEpoch ? Math.min(currentEpoch - startEpoch, windowLength) : 0;
  const epochsRemaining = currentEpoch < endEpoch ? endEpoch - currentEpoch : 0;
  const timePct = windowLength > 0 ? (epochsElapsed / windowLength) * 100 : 0;
  const budgetPct = Number(totals.usagePct || 0);
  const pacingDelta = budgetPct - timePct; // positive = ahead of pace (spending fast)
  const adaPerEpoch = epochsElapsed > 0 ? Number(totals.withdrawnAda || 0) / epochsElapsed : 0;
  const projectedTotalAda = Number(totals.withdrawnAda || 0) + adaPerEpoch * epochsRemaining;
  const projectedUsagePct = Number(totals.limitAda || 0) > 0
    ? (projectedTotalAda / Number(totals.limitAda)) * 100 : 0;
  const showPacing = windowLength > 0 && currentEpoch > 0 && epochsElapsed > 0;

  const overLimit = Number(totals.remainingLovelace || 0) < 0;
  const usagePct = Number(totals.usagePct || 0);
  const usageBarColor = overLimit ? "#ef4444" : usagePct >= 90 ? "#f59e0b" : "#22c55e";
  const usageClass = overLimit ? "pill low" : usagePct >= 90 ? "pill mid" : "pill good";

  const periodLabel = useMemo(() => {
    const selected = periods.find((p) => p.key === periodKey);
    return selected?.label || periodData?.period?.label || "NCL Window";
  }, [periods, periodKey, periodData]);

  // Scenario totals
  const scenarioRatifiedAda = ratified
    .filter((r) => checkedRatified[r.proposalId])
    .reduce((sum, r) => sum + Number(r.amountAda || 0), 0);

  const scenarioActiveAda = activePipeline
    .filter((r) => checkedActive[r.proposalId])
    .reduce((sum, r) => sum + Number(r.amountAda || 0), 0);

  const scenarioTotalAda = scenarioRatifiedAda + scenarioActiveAda;
  const enactedAda = Number(totals.withdrawnAda || 0);
  const limitAda = Number(totals.limitAda || 0);
  const scenarioCombinedAda = enactedAda + scenarioTotalAda;
  const scenarioRemainingAda = limitAda - scenarioCombinedAda;
  const scenarioUsagePct = limitAda > 0 ? (scenarioCombinedAda / limitAda) * 100 : 0;
  const scenarioOverLimit = scenarioRemainingAda < 0;


  const anyChecked = Object.values(checkedRatified).some(Boolean) || Object.values(checkedActive).some(Boolean);
  const showScenario = !loading && (ratified.length > 0 || activePipeline.length > 0);

  function toggleRatified(id) {
    setCheckedRatified((prev) => ({ ...prev, [id]: !prev[id] }));
  }
  function toggleActive(id) {
    setCheckedActive((prev) => ({ ...prev, [id]: !prev[id] }));
  }
  function selectAllActive(val) {
    const next = {};
    for (const r of activePipeline) next[r.proposalId] = val;
    setCheckedActive(next);
  }
  function selectAllRatified(val) {
    const next = {};
    for (const r of ratified) next[r.proposalId] = val;
    setCheckedRatified(next);
  }

  const allActiveChecked = activePipeline.length > 0 && activePipeline.every((r) => checkedActive[r.proposalId]);
  const allRatifiedChecked = ratified.length > 0 && ratified.every((r) => checkedRatified[r.proposalId]);

  return (
    <main className="shell">
      <header className="hero dashboard-header">
        <div>
          <h1>Treasury</h1>
          <p className="muted">
            Track Cardano treasury withdrawals, net change limit usage, and pending proposals.
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => load({ soft: true })}
          disabled={refreshing || loading}
          style={{ alignSelf: "flex-start" }}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <section className="controls dashboard-controls">
        <label>
          NCL Window
          <select value={periodKey} onChange={(e) => setPeriodKey(e.target.value)}>
            {periods.length === 0 ? <option value={periodKey}>{periodKey}</option> : null}
            {periods.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label} (Epoch {p.startEpoch}–{p.endEpoch})
              </option>
            ))}
          </select>
        </label>
      </section>

      {error ? (
        <section className="status-row">
          <p className="muted">Error: {error}</p>
        </section>
      ) : null}

      {/* ── Metric cards ── */}
      <section className="cards">
        <article className="card">
          <p>Window</p>
          <strong>{periodLabel}</strong>
          <p className="muted">
            Epoch {periodData?.period?.startEpoch ?? "?"} – {periodData?.period?.endEpoch ?? "?"}
          </p>
        </article>
        <article className="card">
          <p>Total Withdrawn</p>
          <strong>{fmtAda(totals.withdrawnAda)} ₳</strong>
          <p className="muted">{Number(totals.withdrawnLovelace || 0).toLocaleString()} lovelace</p>
        </article>
        <article className="card">
          <p>NCL Limit</p>
          <strong>{fmtAda(totals.limitAda)} ₳</strong>
        </article>
        <article className="card">
          <p>Remaining Allowance</p>
          <strong>{fmtAda(totals.remainingAda)} ₳</strong>
        </article>
        <article className="card">
          <p>NCL Usage</p>
          <strong>
            <span className={usageClass}>{fmtPct(totals.usagePct)}</span>
          </strong>
          <p className="muted">{overLimit ? "Over limit" : "Within limit"}</p>
        </article>
      </section>

      {/* ── NCL usage progress bar ── */}
      <section className="panel">
        <h2>NCL Usage</h2>
        <div className="treasury-progress-track">
          <div
            className="treasury-progress-fill"
            style={{
              width: `${Math.min(100, usagePct)}%`,
              background: usageBarColor,
            }}
          />
        </div>
        <p className="muted" style={{ marginTop: "0.4rem", fontSize: "0.82rem" }}>
          {fmtAdaShort(totals.withdrawnAda)} ₳ withdrawn of {fmtAdaShort(totals.limitAda)} ₳ limit
        </p>
      </section>

      {/* ── Pacing indicator ── */}
      {showPacing && (
        <section className="panel">
          <h2>Spending Pace</h2>
          <p className="muted" style={{ marginBottom: "1rem", fontSize: "0.83rem" }}>
            {fmtPct(timePct)} of the NCL window has elapsed ({epochsElapsed} of {windowLength} epochs).{" "}
            {epochsRemaining > 0 ? `${epochsRemaining} epochs remaining.` : "Window complete."}
          </p>

          <section className="cards" style={{ marginBottom: "1rem" }}>
            <article className="card">
              <p>Time Elapsed</p>
              <strong>{fmtPct(timePct)}</strong>
              <p className="muted">Epoch {startEpoch} → {endEpoch}</p>
            </article>
            <article className="card">
              <p>Budget Used</p>
              <strong>{fmtPct(budgetPct)}</strong>
              <p className="muted">{fmtAdaShort(totals.withdrawnAda)} of {fmtAdaShort(totals.limitAda)} ₳</p>
            </article>
            <article className="card">
              <p>Pace</p>
              <strong>
                <span className={
                  Math.abs(pacingDelta) < 5 ? "pill good" :
                  pacingDelta > 0 ? "pill mid" : "pill good"
                }>
                  {Math.abs(pacingDelta) < 5
                    ? "On pace"
                    : pacingDelta > 0
                      ? `${fmtPct(pacingDelta)} ahead`
                      : `${fmtPct(Math.abs(pacingDelta))} under`}
                </span>
              </strong>
              <p className="muted">vs time elapsed</p>
            </article>
            <article className="card">
              <p>Burn Rate</p>
              <strong>{fmtAdaShort(adaPerEpoch)} ₳</strong>
              <p className="muted">per epoch (avg)</p>
            </article>
            <article className="card">
              <p>Projected End-of-Window</p>
              <strong style={{ color: projectedUsagePct > 100 ? "#ef4444" : projectedUsagePct > 90 ? "#f59e0b" : "inherit" }}>
                {fmtAdaShort(projectedTotalAda)} ₳
              </strong>
              <p className="muted">{fmtPct(projectedUsagePct)} of limit</p>
            </article>
          </section>

          {/* Time vs budget dual bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.8rem", color: "rgba(200,200,210,0.75)" }}>
              <span style={{ width: "5rem", textAlign: "right", flexShrink: 0 }}>Time</span>
              <div className="treasury-progress-track" style={{ flex: 1, margin: 0 }}>
                <div className="treasury-progress-fill" style={{ width: `${Math.min(100, timePct)}%`, background: "#64748b" }} />
              </div>
              <span style={{ width: "3rem", flexShrink: 0 }}>{fmtPct(timePct)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.8rem", color: "rgba(200,200,210,0.75)" }}>
              <span style={{ width: "5rem", textAlign: "right", flexShrink: 0 }}>Budget</span>
              <div className="treasury-progress-track" style={{ flex: 1, margin: 0 }}>
                <div className="treasury-progress-fill" style={{ width: `${Math.min(100, budgetPct)}%`, background: usageBarColor }} />
              </div>
              <span style={{ width: "3rem", flexShrink: 0 }}>{fmtPct(budgetPct)}</span>
            </div>
          </div>
          <p className="muted" style={{ marginTop: "0.75rem", fontSize: "0.78rem" }}>
            At current burn rate of {fmtAdaShort(adaPerEpoch)} ₳/epoch, projected spend by epoch {endEpoch} is{" "}
            <strong>{fmtAdaShort(projectedTotalAda)} ₳</strong> ({fmtPct(projectedUsagePct)} of the {fmtAdaShort(totals.limitAda)} ₳ limit).
          </p>
        </section>
      )}

      {/* ── Per-epoch bar chart ── */}
      {epochBreakdown.length > 0 && (
        <section className="panel">
          <h2>Withdrawals by Epoch</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={epochBreakdown} margin={{ top: 8, right: 16, bottom: 20, left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="epoch"
                tick={{ fill: "rgba(200,200,210,0.75)", fontSize: 11 }}
                label={{ value: "Epoch", position: "insideBottom", offset: -12, fill: "rgba(200,200,210,0.6)", fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: "rgba(200,200,210,0.75)", fontSize: 11 }}
                tickFormatter={(v) => `${fmtAdaShort(v)} ₳`}
                width={70}
              />
              <Tooltip
                formatter={(v) => [`${fmtAda(v)} ₳`, "Withdrawn"]}
                labelFormatter={(v) => `Epoch ${v}`}
                contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }}
                labelStyle={{ color: "rgba(200,200,210,0.9)" }}
                itemStyle={{ color: "rgba(200,200,210,0.85)" }}
              />
              <Bar dataKey="ada" fill="var(--accent, #7c3aed)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* ── Enacted withdrawals table ── */}
      <section className="panel">
        <h2>Enacted Withdrawals</h2>
        {loading ? <p className="muted">Loading treasury data…</p> : null}
        {!loading && withdrawals.length === 0 ? (
          <p className="muted">No enacted treasury withdrawals in this window.</p>
        ) : null}
        {!loading && withdrawals.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Enacted Epoch</th>
                <th>Proposal</th>
                <th>Amount</th>
                <th>Proposal ID</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((row) => (
                <tr key={`${row.proposalId}-${row.enactedEpoch ?? row.ratifiedEpoch}`}>
                  <td>Epoch {row.enactedEpoch ?? row.ratifiedEpoch ?? "—"}</td>
                  <td><strong>{row.title || "Untitled Proposal"}</strong></td>
                  <td>{fmtAda(row.amountAda)} ₳</td>
                  <td className="mono">
                    <a
                      className="ext-link"
                      href={`https://cardanoscan.io/govAction/${encodeURIComponent(row.proposalId)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {row.proposalId}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      {/* ── Treasury Accountability (post-approval execution) ── */}
      {admin ? (
        <TreasuryAdminSection admin={admin} />
      ) : null}

      {/* ── Ratified (pending payout) ── */}
      <section className="panel">
        <h2>Ratified — Pending Payout</h2>
        <p className="muted" style={{ marginBottom: "0.75rem", fontSize: "0.83rem" }}>
          These proposals have been ratified and will be paid out when enacted at the next epoch boundary.
          Use the checkboxes to include or exclude them from the scenario below.
        </p>
        {loading ? <p className="muted">Loading…</p> : null}
        {!loading && ratified.length === 0 ? (
          <p className="muted">No ratified treasury withdrawals awaiting payout.</p>
        ) : null}
        {!loading && ratified.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th style={{ width: "2rem" }}>
                  <input
                    type="checkbox"
                    checked={allRatifiedChecked}
                    onChange={(e) => selectAllRatified(e.target.checked)}
                    title="Select all"
                  />
                </th>
                <th>Proposal</th>
                <th>Expires (epoch)</th>
                <th>Amount</th>
                <th>Proposal ID</th>
              </tr>
            </thead>
            <tbody>
              {ratified.map((row) => (
                <tr key={row.proposalId} style={{ opacity: checkedRatified[row.proposalId] ? 1 : 0.45 }}>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!checkedRatified[row.proposalId]}
                      onChange={() => toggleRatified(row.proposalId)}
                    />
                  </td>
                  <td>
                    <Link className="inline-link" to={`/actions/${encodeURIComponent(row.proposalId)}`}>
                      {row.title || row.proposalId}
                    </Link>
                  </td>
                  <td>{row.expirationEpoch ?? "—"}</td>
                  <td>{row.amountAda != null ? `${fmtAda(row.amountAda)} ₳` : "—"}</td>
                  <td className="mono">
                    <a
                      className="ext-link"
                      href={`https://cardanoscan.io/govAction/${encodeURIComponent(row.proposalId)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {row.proposalId}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td colSpan={2}><strong>Selected total</strong></td>
                <td><strong>{fmtAda(scenarioRatifiedAda)} ₳</strong></td>
                <td />
              </tr>
            </tfoot>
          </table>
        ) : null}
      </section>

      {/* ── Active pipeline ── */}
      <section className="panel">
        <h2>Active Pipeline</h2>
        <p className="muted" style={{ marginBottom: "0.75rem", fontSize: "0.83rem" }}>
          Treasury withdrawal proposals currently under vote — not yet ratified, expired, or enacted.
          Check or uncheck to model different outcomes in the scenario below.
        </p>
        {loading ? <p className="muted">Loading…</p> : null}
        {!loading && activePipeline.length === 0 ? (
          <p className="muted">No active treasury withdrawal proposals at this time.</p>
        ) : null}
        {!loading && activePipeline.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th style={{ width: "2rem" }}>
                  <input
                    type="checkbox"
                    checked={allActiveChecked}
                    onChange={(e) => selectAllActive(e.target.checked)}
                    title="Select all"
                  />
                </th>
                <th>Proposal</th>
                <th>Expires (epoch)</th>
                <th>Amount</th>
                <th>Proposal ID</th>
              </tr>
            </thead>
            <tbody>
              {activePipeline.map((row) => (
                <tr key={row.proposalId} style={{ opacity: checkedActive[row.proposalId] ? 1 : 0.45 }}>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!checkedActive[row.proposalId]}
                      onChange={() => toggleActive(row.proposalId)}
                    />
                  </td>
                  <td>
                    <Link className="inline-link" to={`/actions/${encodeURIComponent(row.proposalId)}`}>
                      {row.title || row.proposalId}
                    </Link>
                  </td>
                  <td>{row.expirationEpoch ?? "—"}</td>
                  <td>{row.amountAda != null ? `${fmtAda(row.amountAda)} ₳` : "—"}</td>
                  <td className="mono">
                    <a
                      className="ext-link"
                      href={`https://cardanoscan.io/govAction/${encodeURIComponent(row.proposalId)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {row.proposalId}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td colSpan={2}><strong>Selected total</strong></td>
                <td><strong>{fmtAda(scenarioActiveAda)} ₳</strong></td>
                <td />
              </tr>
            </tfoot>
          </table>
        ) : null}
      </section>

      {/* ── Scenario summary ── */}
      {showScenario ? (
        <section className="panel">
          <h2>Scenario: If Selected Proposals Are Enacted</h2>
          <p className="muted" style={{ marginBottom: "1rem", fontSize: "0.83rem" }}>
            Based on your selection above — toggle proposals to model different outcomes.
          </p>

          {!anyChecked ? (
            <p className="muted">No proposals selected. Check proposals above to model a scenario.</p>
          ) : (
            <>
              <section className="cards" style={{ marginBottom: "1rem" }}>
                <article className="card">
                  <p>Already Enacted</p>
                  <strong>{fmtAda(enactedAda)} ₳</strong>
                  <p className="muted">confirmed withdrawals</p>
                </article>
                <article className="card">
                  <p>Selected (Pending + Active)</p>
                  <strong>{fmtAda(scenarioTotalAda)} ₳</strong>
                  <p className="muted">
                    {ratified.filter((r) => checkedRatified[r.proposalId]).length + activePipeline.filter((r) => checkedActive[r.proposalId]).length} proposals
                  </p>
                </article>
                <article className="card">
                  <p>Projected Total</p>
                  <strong>{fmtAda(scenarioCombinedAda)} ₳</strong>
                  <p className="muted">of {fmtAda(limitAda)} ₳ limit</p>
                </article>
                <article className="card">
                  <p>Projected Remaining</p>
                  <strong style={{ color: scenarioOverLimit ? "#ef4444" : "inherit" }}>
                    {fmtAda(Math.abs(scenarioRemainingAda))} ₳
                  </strong>
                  <p className="muted">{scenarioOverLimit ? "over limit" : "remaining"}</p>
                </article>
                <article className="card">
                  <p>Projected NCL Usage</p>
                  <strong>
                    <span className={scenarioOverLimit ? "pill low" : scenarioUsagePct >= 90 ? "pill mid" : "pill good"}>
                      {fmtPct(scenarioUsagePct)}
                    </span>
                  </strong>
                </article>
              </section>

              <div className="treasury-progress-track" style={{ display: "flex", overflow: "hidden" }}>
                <div style={{
                  width: `${Math.min(100, limitAda > 0 ? (enactedAda / limitAda) * 100 : 0)}%`,
                  background: "#22c55e",
                  height: "100%",
                  flexShrink: 0,
                }} />
                {scenarioTotalAda > 0 && (
                  <div style={{
                    width: `${Math.min(100, limitAda > 0 ? (scenarioTotalAda / limitAda) * 100 : 0)}%`,
                    background: scenarioOverLimit ? "#ef4444" : "#f59e0b",
                    height: "100%",
                    flexShrink: 0,
                  }} />
                )}
              </div>
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem", fontSize: "0.8rem", color: "rgba(200,200,210,0.7)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#22c55e" }} />
                  Enacted
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: scenarioOverLimit ? "#ef4444" : "#f59e0b" }} />
                  Selected proposals
                </span>
              </div>
            </>
          )}
        </section>
      ) : null}
    </main>
  );
}
