import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

export default function TreasuryPage() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periodKey, setPeriodKey] = useState("current");
  const [checkedRatified, setCheckedRatified] = useState({});
  const [checkedActive, setCheckedActive] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/treasury");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load treasury data.");
        if (!cancelled) {
          setPayload(data);
          // Default all checked
          const allRatified = {};
          for (const r of (data.ratified || [])) allRatified[r.proposalId] = true;
          setCheckedRatified(allRatified);
          const allActive = {};
          for (const r of (data.activePipeline || [])) allActive[r.proposalId] = true;
          setCheckedActive(allActive);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const periods = payload?.periods || [];
  const periodData = periodKey === "current" ? payload?.current : payload?.previous;
  const totals = periodData?.totals || {};
  const withdrawals = periodData?.withdrawals || [];
  const epochBreakdown = periodData?.epochBreakdown || [];
  const ratified = payload?.ratified || [];
  const activePipeline = payload?.activePipeline || [];

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
  const scenarioBarColor = scenarioOverLimit ? "#ef4444" : scenarioUsagePct >= 90 ? "#f59e0b" : "#22c55e";

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

              <div className="treasury-progress-track">
                {/* enacted portion */}
                <div
                  className="treasury-progress-fill"
                  style={{
                    width: `${Math.min(100, limitAda > 0 ? (enactedAda / limitAda) * 100 : 0)}%`,
                    background: "#22c55e",
                    borderRadius: scenarioCombinedAda <= limitAda ? undefined : "4px 0 0 4px",
                  }}
                />
                {/* selected pending/active portion */}
                {scenarioTotalAda > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${Math.min(100, limitAda > 0 ? (enactedAda / limitAda) * 100 : 0)}%`,
                      width: `${Math.min(100 - (limitAda > 0 ? (enactedAda / limitAda) * 100 : 0), limitAda > 0 ? (scenarioTotalAda / limitAda) * 100 : 0)}%`,
                      height: "100%",
                      background: scenarioOverLimit ? "#ef4444" : "#f59e0b",
                      borderRadius: "0 4px 4px 0",
                    }}
                  />
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
