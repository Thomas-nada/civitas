import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSeoMeta } from "../hooks/useSeoMeta";
import {
  fmtAdaShort, fmtPct, fmtDate, fmtAgo, eventMeta, statusPillMod, ADMIN_EVENT_META,
} from "../lib/treasuryAdmin";

export default function TreasuryExplorerPage() {
  useSeoMeta({
    title: "Treasury Explorer",
    description: "Explore every funded Cardano treasury project — allocation, drawdown, milestones, evidence, and on-chain activity.",
  });

  const [data, setData] = useState(null);
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortCol, setSortCol] = useState("allocated");
  const [sortDir, setSortDir] = useState("desc");
  const [evType, setEvType] = useState("all");

  useEffect(() => {
    let alive = true;
    fetch("/api/treasury-admin").then(r => r.json()).then(d => {
      if (!alive) return;
      if (d && d.available) setData(d); else setError("Treasury administration data is unavailable right now.");
    }).catch(() => alive && setError("Failed to load treasury data."));
    fetch("/api/treasury-admin/events?limit=80").then(r => r.json()).then(d => {
      if (alive && d && d.available) setEvents(d.events || []);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const projects = useMemo(() => {
    if (!data) return [];
    let list = data.projects || [];
    if (statusFilter !== "all") list = list.filter(p => p.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => (p.name || "").toLowerCase().includes(q) || (p.projectId || "").toLowerCase().includes(q));
    }
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortCol === "name") return dir * (a.name || "").localeCompare(b.name || "");
      if (sortCol === "allocated") return dir * (a.allocatedAda - b.allocatedAda);
      if (sortCol === "drawdown") return dir * (a.drawdownPct - b.drawdownPct);
      if (sortCol === "activity") return dir * ((new Date(a.lastActivityIso || 0)) - (new Date(b.lastActivityIso || 0)));
      return 0;
    });
  }, [data, statusFilter, search, sortCol, sortDir]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return evType === "all" ? events : events.filter(e => e.type === evType);
  }, [events, evType]);

  function SortHdr({ col, children, alignRight }) {
    const active = sortCol === col;
    return (
      <th
        onClick={() => { if (active) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir(col === "name" ? "asc" : "desc"); } }}
        style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", textAlign: alignRight ? "right" : "left", color: active ? "var(--mint)" : undefined }}
      >
        {children} {active ? (sortDir === "asc" ? "↑" : "↓") : <span style={{ opacity: .3 }}>↕</span>}
      </th>
    );
  }

  if (error) return (
    <main className="shell"><section className="panel"><h1>Treasury Explorer</h1><p className="muted">{error}</p>
      <Link className="ext-link" to="/treasury">← Back to Treasury</Link></section></main>
  );
  if (!data) return (
    <main className="shell"><section className="panel"><h1>Treasury Explorer</h1><p className="muted">Loading on-chain treasury execution data…</p></section></main>
  );

  const undrawn = Math.max(0, data.allocatedAda - data.withdrawnAda);
  const evTypes = ["all", ...Object.keys(ADMIN_EVENT_META).filter(k => (data.eventsByType || {})[k])];

  return (
    <main className="shell">
      <section className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>Treasury Explorer</h1>
            <p className="muted" style={{ margin: 0, maxWidth: "70ch" }}>
              Every project funded from the Cardano treasury and what has happened to the money since —
              allocation, drawdown, milestone-by-milestone delivery, evidence, and on-chain activity.
              Live data via the Intersect Administration API
              {data.syncedBlock ? `, synced to block ${Number(data.syncedBlock).toLocaleString()}` : ""}.
            </p>
          </div>
          <Link className="mode-btn" to="/treasury" style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>← Treasury overview</Link>
        </div>

        <section className="cards" style={{ marginTop: "1.25rem" }}>
          <article className="card"><p>Allocated</p><strong>{fmtAdaShort(data.allocatedAda)} ₳</strong><p className="muted">{data.projectCount} projects</p></article>
          <article className="card"><p>Drawn Down</p><strong style={{ color: "#4ade80" }}>{fmtAdaShort(data.withdrawnAda)} ₳</strong><p className="muted">{fmtPct(data.drawdownPct)}</p></article>
          <article className="card"><p>Still Locked</p><strong>{fmtAdaShort(undrawn)} ₳</strong><p className="muted">undrawn</p></article>
          <article className="card"><p>Milestones</p><strong>{data.milestones?.withdrawn || 0}<span style={{ opacity: .5, fontSize: "0.7em" }}> / {data.milestones?.total || 0}</span></strong><p className="muted">withdrawn</p></article>
          <article className="card"><p>Active</p><strong style={{ color: "#54e4bc" }}>{data.byStatus?.active || 0}</strong><p className="muted">projects</p></article>
          <article className="card"><p>Paused</p><strong style={{ color: (data.pausedCount > 0) ? "#fbbf24" : undefined }}>{data.pausedCount}</strong><p className="muted">projects</p></article>
        </section>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2.3fr) minmax(0, 1fr)", gap: "1.25rem", alignItems: "start" }} className="treasury-admin-grid">
        {/* Projects */}
        <section className="panel">
          <h2>Projects <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 400 }}>({projects.length})</span></h2>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.85rem" }}>
            <input
              placeholder="Search project name or ID…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: "7px 12px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--bg-soft)", color: "var(--text)", fontSize: "0.85rem", minWidth: 220 }}
            />
            {["all", "active", "paused", "completed"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className="mode-btn"
                style={{ fontSize: "0.75rem", padding: "4px 11px", textTransform: "capitalize",
                  borderColor: statusFilter === s ? "var(--mint)" : undefined, color: statusFilter === s ? "var(--mint)" : undefined }}>
                {s}{s !== "all" && data.byStatus?.[s] ? ` (${data.byStatus[s]})` : ""}
              </button>
            ))}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <SortHdr col="name">Project</SortHdr>
                  <th>Status</th>
                  <SortHdr col="allocated" alignRight>Allocated</SortHdr>
                  <SortHdr col="drawdown">Drawdown</SortHdr>
                  <th>Milestones</th>
                  <SortHdr col="activity">Last activity</SortHdr>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => {
                  const msProgress = p.milestones.total > 0 ? (p.milestones.done / p.milestones.total) * 100 : 0;
                  const barColor = p.status === "paused" ? "#fbbf24" : (p.drawdownPct < msProgress - 20) ? "#f87171" : "#4ade80";
                  return (
                    <tr key={p.projectId}>
                      <td style={{ maxWidth: 280 }}>
                        <Link to={`/treasury/explorer/${encodeURIComponent(p.projectId)}`} style={{ fontWeight: 600, color: "var(--text)" }}>
                          {p.name || "Unnamed project"}
                        </Link>
                        <div className="mono" style={{ fontSize: "0.68rem", opacity: .55 }}>{p.projectId}</div>
                      </td>
                      <td><span className={`pill pill--${statusPillMod(p.status)}`}>{p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span></td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
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
                      <td style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }} title={fmtDate(p.lastActivityIso)}>{fmtAgo(p.lastActivityIso) || "—"}</td>
                    </tr>
                  );
                })}
                {projects.length === 0 ? <tr><td colSpan={6} className="muted" style={{ textAlign: "center", padding: "1rem" }}>No projects match.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>

        {/* Activity */}
        <section className="panel">
          <h2>On-chain Activity</h2>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.85rem" }}>
            {evTypes.map(t => (
              <button key={t} onClick={() => setEvType(t)} className="mode-btn"
                style={{ fontSize: "0.72rem", padding: "3px 9px", textTransform: "capitalize",
                  borderColor: evType === t ? "var(--mint)" : undefined, color: evType === t ? "var(--mint)" : undefined }}>
                {t === "all" ? "All" : eventMeta(t).label}
              </button>
            ))}
          </div>
          {!events ? <p className="muted" style={{ fontSize: "0.85rem" }}>Loading activity…</p> : null}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", maxHeight: 640, overflowY: "auto" }}>
            {filteredEvents.slice(0, 60).map((e, i) => {
              const meta = eventMeta(e.type);
              return (
                <div key={`${e.txHash}-${i}`} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", fontSize: "0.8rem", lineHeight: 1.35 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: meta.color, marginTop: 6, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <span style={{ color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                    {e.amountAda ? <span> · {fmtAdaShort(e.amountAda)} ₳</span> : null}
                    <span className="muted"> · {fmtAgo(e.dateIso)}</span>
                    {e.project ? (
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {e.projectId ? <Link to={`/treasury/explorer/${encodeURIComponent(e.projectId)}`}>{e.project}</Link> : e.project}
                      </div>
                    ) : null}
                    {e.milestone ? <div className="muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.72rem" }}>{e.milestone}</div> : null}
                    {e.reason ? <div className="muted" style={{ fontSize: "0.72rem", fontStyle: "italic" }}>{e.reason.length > 140 ? e.reason.slice(0, 140) + "…" : e.reason}</div> : null}
                  </div>
                </div>
              );
            })}
            {events && filteredEvents.length === 0 ? <p className="muted" style={{ fontSize: "0.8rem" }}>No events of this type.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
