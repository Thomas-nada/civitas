import { useEffect, useMemo, useState } from "react";

function fmtAda(value) {
  const n = Number(value || 0);
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function fmtLovelace(value) {
  return Number(value || 0).toLocaleString();
}

function fmtPct(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0%";
  return `${n.toFixed(2)}%`;
}

export default function NclPage() {
  const [period, setPeriod] = useState("current");
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const cacheKey = useMemo(() => `civitas.ncl.${period}`, [period]);

  useEffect(() => {
    let cancelled = false;
    let hydrated = false;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") {
          setPayload(parsed);
          setLoading(false);
          hydrated = true;
        }
      }
    } catch {
      // Ignore stale session cache.
    }
    async function load() {
      try {
        if (!hydrated) setLoading(true);
        setError("");
        const res = await fetch(`/api/ncl?period=${encodeURIComponent(period)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load NCL data.");
        if (!cancelled) {
          setPayload(data);
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
          } catch {
            // Ignore session storage failures.
          }
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [cacheKey, period]);

  const periods = payload?.periods || [];
  const totals = payload?.totals || {};
  const withdrawals = payload?.withdrawals || [];
  const overLimit = Number(totals.remainingLovelace || 0) < 0;
  const usageClass = overLimit ? "pill low" : Number(totals.usagePct || 0) >= 90 ? "pill mid" : "pill good";

  const periodLabel = useMemo(() => {
    const selected = periods.find((p) => p.key === period);
    return selected?.label || payload?.period?.label || "NCL Window";
  }, [periods, period, payload]);

  return (
    <main className="shell">
      <header className="hero dashboard-header">
        <div>
          <h1>Net Change Limit</h1>
          <p className="muted">Track treasury withdrawal usage against active and prior NCL periods.</p>
        </div>
      </header>

      <section className="controls dashboard-controls">
        <label>
          NCL Window
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {periods.length === 0 ? <option value={period}>{period}</option> : null}
            {periods.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label} (Epoch {p.startEpoch}-{p.endEpoch})
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

      <section className="cards">
        <article className="card">
          <p>Window</p>
          <strong>{periodLabel}</strong>
          <p className="muted">
            Epoch {payload?.period?.startEpoch ?? "?"} - {payload?.period?.endEpoch ?? "?"}
          </p>
        </article>
        <article className="card">
          <p>Total Withdrawn</p>
          <strong>{fmtAda(totals.withdrawnAda)} ada</strong>
          <p className="muted">{fmtLovelace(totals.withdrawnLovelace)} lovelace</p>
        </article>
        <article className="card">
          <p>NCL Limit</p>
          <strong>{fmtAda(totals.limitAda)} ada</strong>
          <p className="muted">{fmtLovelace(totals.limitLovelace)} lovelace</p>
        </article>
        <article className="card">
          <p>Remaining Allowance</p>
          <strong>{fmtAda(totals.remainingAda)} ada</strong>
          <p className="muted">{fmtLovelace(totals.remainingLovelace)} lovelace</p>
        </article>
        <article className="card">
          <p>NCL Usage</p>
          <strong>
            <span className={usageClass}>{fmtPct(totals.usagePct)}</span>
          </strong>
          <p className="muted">{overLimit ? "Over limit" : "Within limit"}</p>
        </article>
      </section>

      <section className="panel">
        <h2>Treasury Withdrawals</h2>
        {loading ? <p className="muted">Loading NCL dataset...</p> : null}
        {!loading && withdrawals.length === 0 ? (
          <p className="muted">No treasury withdrawals detected in this NCL window.</p>
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
                <tr key={`${row.proposalId}-${row.enactedEpoch || row.ratifiedEpoch}`}>
                  <td>Epoch {row.enactedEpoch || row.ratifiedEpoch}</td>
                  <td>
                    <strong>{row.title || "Untitled Proposal"}</strong>
                  </td>
                  <td>{fmtAda(row.amountAda)} ada</td>
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
    </main>
  );
}
