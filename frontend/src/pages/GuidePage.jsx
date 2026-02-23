import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const toc = [
  { id: "overview", label: "Overview" },
  { id: "pages", label: "Pages and Use Cases" },
  { id: "metrics", label: "Metrics and Scoring" },
  { id: "power", label: "Voting Power and Thresholds" },
  { id: "api", label: "API Reference" },
  { id: "history", label: "Snapshot History" },
  { id: "limits", label: "Scope and Caveats" }
];

export default function GuidePage() {
  const [history, setHistory] = useState([]);
  const [showAllSnapshots, setShowAllSnapshots] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/snapshot-history");
        const data = await res.json();
        if (!res.ok || cancelled) return;
        setHistory(Array.isArray(data?.history) ? data.history : []);
      } catch {
        // no-op for guide helper panel
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleHistory = showAllSnapshots ? history : history.slice(0, 5);

  function renderSection() {
    if (activeSection === "overview") {
      return (
        <section id="overview" className="wiki-section panel">
          <h2>1. Overview</h2>
          <p>Civitas provides governance intelligence for Cardano by turning proposal and vote data into role-specific oversight views.</p>
          <p>The tool focuses on DReps, stake pools participating in governance, Constitutional Committee members, governance actions, and treasury oversight through NCL windows.</p>
          <p>Snapshots are used to keep analysis stable and repeatable while sync continues in the background.</p>
        </section>
      );
    }

    if (activeSection === "pages") {
      return (
        <section id="pages" className="wiki-section panel">
          <h2>2. Pages and Use Cases</h2>
          <p><strong>DReps (`/dreps`)</strong>: voting behavior, attendance, transparency, alignment, abstain rate, responsiveness, and voting power shares.</p>
          <p><strong>SPOs (`/spos`)</strong>: governance-role pool participation, rationale coverage, alignment, abstain posture, and governance voting power.</p>
          <p><strong>Committee (`/committee`)</strong>: committee performance with term-aware eligibility and status-aware interpretation.</p>
          <p><strong>Actions (`/actions`)</strong>: per-proposal status, role vote totals, threshold context, and metadata payload inspection.</p>
          <p><strong>NCL (`/ncl`)</strong>: enacted treasury withdrawals tracked against current and previous NCL windows.</p>
        </section>
      );
    }

    if (activeSection === "metrics") {
      return (
        <section id="metrics" className="wiki-section panel">
          <h2>3. Metrics and Scoring</h2>
          <p><strong>Core principle</strong>: each actor is scored only against actions that are eligible for that role and active filter set (action filters, type filters, active-action toggle, snapshot scope).</p>
          <p><strong>Attendance</strong>: <code>cast / eligible</code>. Eligibility is role-aware:
            DRep excludes pre-participation actions, SPO includes only actions with SPO participation, Committee applies committee-specific eligibility and term windows.</p>
          <p><strong>Transparency</strong>: <code>votes with rationale signal / cast</code>. Rationale signals come from vote metadata and resolved rationale references.</p>
          <p><strong>Alignment</strong>: calculated only on proposals with final yes/no outcomes. Formula:
            <code>matching yes/no votes / comparable yes/no votes</code>. Abstain votes are excluded from alignment math.</p>
          <p><strong>Responsiveness</strong>: based on per-vote response latency:
            <code>responseHours = votedAt - proposalSubmittedAt</code>, then normalized as
            <code>max(0, 100 - (avgResponseHours / 720) * 100)</code> where 720h = 30 days.</p>
          <p><strong>Abstain rate</strong>: <code>abstain votes / cast votes</code>. It is shown as a behavior metric but not directly added to accountability score.</p>
          <p><strong>Accountability score</strong>: weighted average of enabled metric toggles:
            Attendance <code>0.45</code>, Transparency <code>0.30</code>, Alignment <code>0.15</code>, Responsiveness <code>0.10</code>.
            Disabled metrics are removed from denominator, so score is renormalized over active weights only.</p>
          <p><strong>Interpretation notes</strong>: a high score can come from different behavior patterns; review the component columns (attendance/transparency/alignment/responsiveness/abstain) rather than relying on score alone.</p>
        </section>
      );
    }

    if (activeSection === "power") {
      return (
        <section id="power" className="wiki-section panel">
          <h2>4. Voting Power and Thresholds</h2>
          <p>DRep and SPO dashboards show total and active governance voting power and actor-level shares.</p>
          <p>Active power excludes always-abstain delegated stake in the relevant role model.</p>
          <p>The actions view combines threshold context with vote participation and power progression to show proposal decision pressure.</p>
        </section>
      );
    }

    if (activeSection === "api") {
      return (
        <section id="api" className="wiki-section panel">
          <h2>5. API Reference</h2>
          <p><code>GET /api/health</code>: service heartbeat.</p>
          <p><code>GET /api/accountability?view=drep|spo|committee|actions</code>: scoped data payloads for dashboards.</p>
          <p><code>GET /api/accountability?snapshot=epoch-XYZ.json</code>: load a historical snapshot.</p>
          <p><code>GET /api/sync-status</code>: sync state, completion, and pending snapshot info.</p>
          <p><code>POST /api/sync-now</code>: trigger immediate sync.</p>
          <p><code>GET /api/snapshot-history</code>: list available ended-epoch snapshots.</p>
          <p><code>POST /api/backfill-epoch-snapshots?force=true</code>: optional history backfill trigger.</p>
          <p><code>GET /api/proposal-metadata?proposalId=&lt;id&gt;</code>: governance action metadata payload.</p>
          <p><code>GET /api/vote-rationale?...params</code>: retrieve and parse rationale text for a specific vote context.</p>
          <p><code>GET /api/ncl?period=current|previous</code>: NCL summary and withdrawals for selected window.</p>
        </section>
      );
    }

    if (activeSection === "history") {
      return (
        <section id="history" className="wiki-section panel">
          <h2>6. Snapshot History</h2>
          <p>Snapshot history allows time-scoped governance review without waiting on live upstream queries.</p>
          <p>Use epoch links below to open dashboards against a specific snapshot state.</p>

          <div className="wiki-history-box">
            {history.length === 0 ? (
              <p className="muted">No historical snapshots available yet.</p>
            ) : (
              <>
                {visibleHistory.map((item) => (
                  <p key={item.key}>
                    <span className="mono">Epoch {item.epoch ?? "?"}</span>{" "}-{" "}
                    <Link className="inline-link" to={`/dreps?snapshot=${encodeURIComponent(item.key)}`}>DRep</Link>{" "}|{" "}
                    <Link className="inline-link" to={`/spos?snapshot=${encodeURIComponent(item.key)}`}>SPO</Link>{" "}|{" "}
                    <Link className="inline-link" to={`/committee?snapshot=${encodeURIComponent(item.key)}`}>Committee</Link>{" "}|{" "}
                    <Link className="inline-link" to={`/actions?snapshot=${encodeURIComponent(item.key)}`}>Actions</Link>
                  </p>
                ))}
                {history.length > 5 ? (
                  <button type="button" className="mode-btn" onClick={() => setShowAllSnapshots((v) => !v)}>
                    {showAllSnapshots ? "Collapse snapshot list" : `Show all ${history.length} snapshots`}
                  </button>
                ) : null}
              </>
            )}
          </div>
        </section>
      );
    }

    if (activeSection === "limits") {
      return (
        <section id="limits" className="wiki-section panel">
          <h2>7. Scope and Caveats</h2>
          <p>Metrics depend on available on-chain/off-chain rationale references and metadata quality.</p>
          <p>Eligibility rules differ by role and action type, so participation metrics are role-scoped by design.</p>
          <p>During sync, the latest complete snapshot remains in use until a newer complete snapshot is ready.</p>
        </section>
      );
    }

    return null;
  }

  return (
    <main className="shell wiki-guide-shell">
      <header className="hero wiki-header">
        <h1>Civitas Governance Guide</h1>
        <p>Reference documentation for data flows, interpretation models, and operational workflows across the platform.</p>
      </header>

      <section className="wiki-layout">
        <aside className="wiki-sidebar panel">
          <h3>Contents</h3>
          <nav aria-label="Guide sections" className="wiki-nav">
            {toc.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={activeSection === item.id ? "active" : ""}
                onClick={() => setActiveSection(item.id)}
              >
                {index + 1}. {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <article className="wiki-content">
          {renderSection()}
        </article>
      </section>
    </main>
  );
}
