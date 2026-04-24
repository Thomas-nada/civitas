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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/treasury");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load treasury data.");
        if (!cancelled) setPayload(data);
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
  const ratifiedTotalAda = payload?.ratifiedTotalAda || 0;
  const activePipeline = payload?.activePipeline || [];
  const activePipelineTotalAda = payload?.activePipelineTotalAda || 0;

  const overLimit = Number(totals.remainingLovelace || 0) < 0;
  const usagePct = Number(totals.usagePct || 0);
  const usageBarColor = overLimit ? "#ef4444" : usagePct >= 90 ? "#f59e0b" : "#22c55e";
  const usageClass = overLimit ? "pill low" : usagePct >= 90 ? "pill mid" : "pill good";

  const periodLabel = useMemo(() => {
    const selected = periods.find((p) => p.key === periodKey);
    return selected?.label || periodData?.period?.label || "NCL Window";
  }, [periods, periodKey, periodData]);

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
          {ratified.length > 0 && (
            <> Total queued: <strong>{fmtAda(ratifiedTotalAda)} ₳</strong></>
          )}
        </p>
        {loading ? <p className="muted">Loading…</p> : null}
        {!loading && ratified.length === 0 ? (
          <p className="muted">No ratified treasury withdrawals awaiting payout.</p>
        ) : null}
        {!loading && ratified.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Proposal</th>
                <th>Expires (epoch)</th>
                <th>Amount</th>
                <th>Proposal ID</th>
              </tr>
            </thead>
            <tbody>
              {ratified.map((row) => (
                <tr key={row.proposalId}>
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
          </table>
        ) : null}
      </section>

      {/* ── Active pipeline ── */}
      <section className="panel">
        <h2>Active Pipeline</h2>
        <p className="muted" style={{ marginBottom: "0.75rem", fontSize: "0.83rem" }}>
          Treasury withdrawal proposals currently under vote — not yet ratified, expired, or enacted.
          {activePipeline.length > 0 && (
            <> Potential total: <strong>{fmtAda(activePipelineTotalAda)} ₳</strong></>
          )}
        </p>
        {loading ? <p className="muted">Loading…</p> : null}
        {!loading && activePipeline.length === 0 ? (
          <p className="muted">No active treasury withdrawal proposals at this time.</p>
        ) : null}
        {!loading && activePipeline.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Proposal</th>
                <th>Expires (epoch)</th>
                <th>Amount</th>
                <th>Proposal ID</th>
              </tr>
            </thead>
            <tbody>
              {activePipeline.map((row) => (
                <tr key={row.proposalId}>
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
                <td colSpan={2}><strong>Total</strong></td>
                <td><strong>{fmtAda(activePipelineTotalAda)} ₳</strong></td>
                <td />
              </tr>
            </tfoot>
          </table>
        ) : null}
      </section>
    </main>
  );
}
