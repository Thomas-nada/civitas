import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSeoMeta } from "../hooks/useSeoMeta";
import {
  fmtAdaShort, fmtAda, fmtPct, fmtDate, fmtDateTime, fmtAgo, eventMeta,
  statusPillMod, csTx, csAddr, shortHash,
} from "../lib/treasuryAdmin";

function MilestoneRow({ m, index }) {
  const [open, setOpen] = useState(false);
  const state = m.withdrawn ? { label: "Withdrawn", color: "#4ade80" }
    : m.paused ? { label: "Paused", color: "#fbbf24" }
    : m.completion ? { label: "Completed", color: "#38bdf8" }
    : m.archived ? { label: "Archived", color: "#94a3b8" }
    : { label: "Pending", color: "#64748b" };
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 8, marginBottom: "0.6rem", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 0.9rem",
          background: "var(--bg-soft)", border: "none", color: "var(--text)", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", width: 26, flexShrink: 0 }}>#{m.order || index + 1}</span>
        <span style={{ flex: 1, minWidth: 0, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: open ? "normal" : "nowrap" }}>
          {m.label || `Milestone ${m.order}`}
        </span>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtAdaShort(m.amountAda)} ₳</span>
        <span className="pill" style={{ background: `${state.color}20`, color: state.color, border: `1px solid ${state.color}55` }}>{state.label}</span>
        <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open ? (
        <div style={{ padding: "0.9rem", borderTop: "1px solid var(--line)", fontSize: "0.85rem" }}>
          {m.acceptanceCriteria ? (
            <div style={{ marginBottom: "0.75rem" }}>
              <div className="muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>Acceptance criteria</div>
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{m.acceptanceCriteria}</div>
            </div>
          ) : null}
          {m.description ? (
            <div style={{ marginBottom: "0.75rem" }}>
              <div className="muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>Description</div>
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{m.description}</div>
            </div>
          ) : null}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", marginBottom: m.completion || m.withdrawal ? "0.75rem" : 0 }}>
            <div><div className="muted" style={{ fontSize: "0.72rem" }}>Amount</div><div>{fmtAda(m.amountAda)} ₳</div></div>
            {m.timeLimitIso ? <div><div className="muted" style={{ fontSize: "0.72rem" }}>Time limit</div><div>{fmtDate(m.timeLimitIso)}</div></div> : null}
            <div><div className="muted" style={{ fontSize: "0.72rem" }}>Evidence</div><div>{m.evidenceProvided ? "Provided" : "—"}</div></div>
            {m.pauseHistory > 0 ? <div><div className="muted" style={{ fontSize: "0.72rem" }}>Pauses</div><div style={{ color: "#fbbf24" }}>{m.pauseHistory}</div></div> : null}
          </div>
          {m.completion ? (
            <div style={{ marginBottom: "0.6rem" }}>
              <div className="muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>Completion</div>
              <div>{fmtDateTime(m.completion.timeIso)} · <a className="ext-link" href={csTx(m.completion.txHash)} target="_blank" rel="noreferrer">{shortHash(m.completion.txHash)}</a></div>
              {m.completion.description ? <div className="muted" style={{ fontSize: "0.8rem", marginTop: 2 }}>{m.completion.description}</div> : null}
              {m.completion.evidence && m.completion.evidence.length > 0 ? (
                <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem" }}>
                  {m.completion.evidence.map((ev, i) => (
                    <li key={i} style={{ fontSize: "0.82rem" }}>
                      {ev.url ? <a className="ext-link" href={ev.url} target="_blank" rel="noreferrer">{ev.label || ev.url}</a> : (ev.label || "—")}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {m.withdrawal ? (
            <div>
              <div className="muted" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>Withdrawal</div>
              <div>{fmtAda(m.withdrawal.amountAda)} ₳ · {fmtDateTime(m.withdrawal.timeIso)} · <a className="ext-link" href={csTx(m.withdrawal.txHash)} target="_blank" rel="noreferrer">{shortHash(m.withdrawal.txHash)}</a></div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function TreasuryProjectPage() {
  const { projectId } = useParams();
  const [p, setP] = useState(null);
  const [error, setError] = useState("");
  useSeoMeta({ title: p?.name ? `${p.name} — Treasury` : "Treasury Project", description: "Funded Cardano treasury project detail: milestones, evidence, and on-chain activity." });

  useEffect(() => {
    let alive = true;
    setP(null); setError("");
    fetch(`/api/treasury-admin/project?id=${encodeURIComponent(projectId)}`)
      .then(r => r.json())
      .then(d => { if (!alive) return; if (d && d.available) setP(d); else setError(d?.error || "Project not found."); })
      .catch(() => alive && setError("Failed to load project."));
    return () => { alive = false; };
  }, [projectId]);

  if (error) return (
    <main className="shell"><section className="panel">
      <Link className="ext-link" to="/treasury/explorer">← Treasury Explorer</Link>
      <h1 style={{ marginTop: "0.5rem" }}>Project</h1><p className="muted">{error}</p>
    </section></main>
  );
  if (!p) return (
    <main className="shell"><section className="panel"><p className="muted">Loading project…</p></section></main>
  );

  const undrawn = Math.max(0, p.allocatedAda - p.withdrawnAda);

  return (
    <main className="shell">
      <section className="panel">
        <Link className="ext-link" to="/treasury/explorer" style={{ fontSize: "0.82rem" }}>← Treasury Explorer</Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginTop: "0.5rem" }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ marginBottom: 4 }}>{p.name || "Unnamed project"}</h1>
            <div className="mono muted" style={{ fontSize: "0.75rem" }}>{p.projectId}</div>
          </div>
          <span className={`pill pill--${statusPillMod(p.status)}`} style={{ fontSize: "0.8rem" }}>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span>
        </div>
        {p.description ? <p style={{ marginTop: "0.75rem", maxWidth: "80ch", lineHeight: 1.55 }}>{p.description}</p> : null}

        <section className="cards" style={{ marginTop: "1rem" }}>
          <article className="card"><p>Allocated</p><strong>{fmtAdaShort(p.allocatedAda)} ₳</strong><p className="muted">{fmtAda(p.allocatedAda)} ₳</p></article>
          <article className="card"><p>Withdrawn</p><strong style={{ color: "#4ade80" }}>{fmtAdaShort(p.withdrawnAda)} ₳</strong><p className="muted">{fmtPct(p.drawdownPct)} drawn</p></article>
          <article className="card"><p>Undrawn</p><strong>{fmtAdaShort(undrawn)} ₳</strong><p className="muted">remaining</p></article>
          <article className="card"><p>Contract Balance</p><strong>{fmtAdaShort(p.balanceAda)} ₳</strong><p className="muted">on-chain now</p></article>
          <article className="card"><p>Funded</p><strong style={{ fontSize: "1.1rem" }}>{fmtDate(p.fundedIso)}</strong><p className="muted">{p.eventCount} events</p></article>
        </section>

        <div style={{ marginTop: "1rem" }}>
          <div className="treasury-progress-track"><div className="treasury-progress-fill" style={{ width: `${p.drawdownPct}%`, background: "#4ade80" }} /></div>
        </div>

        {/* On-chain identifiers */}
        <div style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem", fontSize: "0.82rem" }}>
          {p.fundTxHash ? <div><div className="muted" style={{ fontSize: "0.72rem" }}>Fund transaction</div><a className="ext-link mono" href={csTx(p.fundTxHash)} target="_blank" rel="noreferrer">{shortHash(p.fundTxHash, 12)}</a></div> : null}
          {p.contractAddress ? <div><div className="muted" style={{ fontSize: "0.72rem" }}>Contract address</div><a className="ext-link mono" href={csAddr(p.contractAddress)} target="_blank" rel="noreferrer">{shortHash(p.contractAddress, 12)}</a></div> : null}
          {p.vendorAddress ? <div><div className="muted" style={{ fontSize: "0.72rem" }}>Vendor address</div><a className="ext-link mono" href={csAddr(p.vendorAddress)} target="_blank" rel="noreferrer">{shortHash(p.vendorAddress, 12)}</a></div> : null}
        </div>
      </section>

      {/* Milestones */}
      <section className="panel">
        <h2>Milestones <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 400 }}>({p.milestones.length})</span></h2>
        {p.milestones.length === 0 ? <p className="muted">No milestones recorded.</p> :
          p.milestones.map((m, i) => <MilestoneRow key={m.milestoneId || i} m={m} index={i} />)}
      </section>

      {/* Activity */}
      <section className="panel">
        <h2>On-chain Activity <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 400 }}>({p.events.length})</span></h2>
        {p.events.length === 0 ? <p className="muted">No events recorded.</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {p.events.map((e, i) => {
              const meta = eventMeta(e.type);
              return (
                <div key={`${e.txHash}-${i}`} style={{ display: "flex", gap: "0.7rem", alignItems: "flex-start", fontSize: "0.85rem", lineHeight: 1.4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, marginTop: 6, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <span style={{ color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                    {e.amountAda ? <span> · {fmtAda(e.amountAda)} ₳</span> : null}
                    <span className="muted"> · {fmtDateTime(e.dateIso)} ({fmtAgo(e.dateIso)})</span>
                    {e.txHash ? <span> · <a className="ext-link mono" href={csTx(e.txHash)} target="_blank" rel="noreferrer">{shortHash(e.txHash)}</a></span> : null}
                    {e.milestone ? <div className="muted" style={{ fontSize: "0.78rem" }}>{e.milestone}</div> : null}
                    {e.reason ? <div className="muted" style={{ fontSize: "0.8rem", fontStyle: "italic", marginTop: 2 }}>{e.reason}</div> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* UTxOs */}
      {p.utxos && p.utxos.length > 0 ? (
        <section className="panel">
          <h2>Current UTxOs <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 400 }}>({p.utxos.length})</span></h2>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>Transaction</th><th>Index</th><th style={{ textAlign: "right" }}>Amount</th></tr></thead>
              <tbody>
                {p.utxos.map((u, i) => (
                  <tr key={`${u.txHash}-${u.outputIndex}-${i}`}>
                    <td className="mono"><a className="ext-link" href={csTx(u.txHash)} target="_blank" rel="noreferrer">{shortHash(u.txHash, 12)}</a></td>
                    <td>{u.outputIndex ?? "—"}</td>
                    <td style={{ textAlign: "right" }}>{fmtAda(u.amountAda)} ₳</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}
