import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { WalletContext } from "../context/WalletContext";
import { deadlineLabel } from "../services/surveyNetwork";
import { participationLabel } from "../services/surveyPresentation";
import SurveyBadges from "../components/survey/SurveyBadges";

const ROLE_COLORS = {
  DRep: "var(--mint)",
  SPO: "var(--amber)",
  CC: "#a78bfa",
  Stakeholder: "rgba(200,200,210,0.6)",
  Keyholder: "rgba(200,200,210,0.6)"
};

const ALL_ROLES = ["DRep", "SPO", "CC", "Stakeholder", "Keyholder"];

const STATUS_FILTERS = [
  ["all", "All"],
  ["open", "Open"],
  ["closed", "Closed"],
  ["linked", "Linked to an action"],
  ["cancelled", "Cancelled"]
];

function HowItWorks() {
  const steps = [
    { n: "1", title: "Browse", body: "Open any survey to read its questions and the informational tally. No wallet needed." },
    { n: "2", title: "Sign in", body: "Sign in with a Cardano wallet (top right) as a DRep or delegator to take part. Signing in is free." },
    { n: "3", title: "Answer or create", body: "Answer a survey with the wallet that holds an eligible credential, or publish your own. Each is one small on-chain transaction: you pay the network fee, nothing else." }
  ];
  return (
    <div className="sv-howto panel">
      <div className="sv-howto-intro">
        <h2 className="sv-howto-title">What are on-chain surveys?</h2>
        <p className="muted">
          CIP-179 puts surveys and polls on the Cardano chain as transaction metadata (label 17). The roles allowed to
          answer, the closing epoch and every answer are on chain, so anyone can read and count them without trusting
          whoever published the survey. Civitas reads them from{" "}
          <a className="ext-link" href="https://github.com/mpizenberg/Tessera" target="_blank" rel="noreferrer">Tessera</a>,
          the reference CIP-179 index.
        </p>
      </div>
      <div className="sv-howto-steps">
        {steps.map((s) => (
          <div key={s.n} className="sv-howto-step">
            <span className="sv-howto-num">{s.n}</span>
            <div>
              <div className="sv-howto-step-title">{s.title}</div>
              <p className="muted sv-howto-step-body">{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SurveysListPage() {
  useSeoMeta({
    title: "Surveys & Polls",
    description: "CIP-179 on-chain surveys and polls for Cardano governance participants, read from the Tessera index."
  });
  const wallet = useContext(WalletContext);
  const walletApi = wallet?.walletApi;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/surveys");
        const payload = await res.json().catch(() => ({}));
        if (!alive) return;
        if (!res.ok) throw new Error(payload.error || "Failed to load surveys.");
        setData(payload);
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const surveys = useMemo(() => data?.surveys || [], [data]);
  const counts = useMemo(() => ({
    all: surveys.length,
    open: surveys.filter((s) => s.lifecycle === "open").length,
    closed: surveys.filter((s) => s.lifecycle === "closed").length,
    linked: surveys.filter((s) => s.govLinks?.length).length,
    cancelled: surveys.filter((s) => s.lifecycle === "cancelled" || s.lifecycle === "untalliable").length
  }), [surveys]);

  const filtered = surveys.filter((s) => {
    if (roleFilter !== "All" && !(s.eligibleRoles || []).includes(roleFilter)) return false;
    const gone = s.lifecycle === "cancelled" || s.lifecycle === "untalliable";
    if (statusFilter === "cancelled") return gone;
    if (gone) return false;
    if (statusFilter === "open") return s.lifecycle === "open";
    if (statusFilter === "closed") return s.lifecycle === "closed";
    if (statusFilter === "linked") return Boolean(s.govLinks?.length);
    return true;
  });

  return (
    <main className="shell">
      <div className="sv-page-header">
        <div>
          <h1>Surveys &amp; Polls</h1>
          <p className="muted">
            Community polls recorded on Cardano as{" "}
            <span className="mono" style={{ fontSize: "0.88em" }}>metadata label 17</span>{" "}
            (CIP-179), on mainnet.
          </p>
          <div style={{ display: "flex", gap: "16px", marginTop: "6px", flexWrap: "wrap" }}>
            <Link to="/guide?section=tool-survey-respond" className="inline-link" style={{ fontSize: "0.78rem" }}>
              How answering works →
            </Link>
            <Link to="/guide?section=tool-survey-create" className="inline-link" style={{ fontSize: "0.78rem" }}>
              How to create a survey →
            </Link>
          </div>
        </div>
        {walletApi ? (
          <Link to="/surveys/create" className="btn-primary">+ Create survey</Link>
        ) : (
          <p className="muted" style={{ fontSize: "0.8rem", margin: 0 }}>
            Sign in with a wallet to create a survey.
          </p>
        )}
      </div>

      <HowItWorks />

      <div className="sv-table-filters">
        <div className="sv-filter-chips">
          {STATUS_FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`sv-filter-chip${statusFilter === key ? " active" : ""}`}
              onClick={() => setStatusFilter(key)}
            >
              {label} <span className="sv-filter-count">{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className="sv-filter-divider" />
        <div className="sv-filter-chips">
          <button
            type="button"
            className={`sv-filter-chip${roleFilter === "All" ? " active" : ""}`}
            onClick={() => setRoleFilter("All")}
          >
            All roles
          </button>
          {ALL_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              className={`sv-filter-chip${roleFilter === r ? " active" : ""}`}
              onClick={() => setRoleFilter(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="vote-error" style={{ marginTop: "0.75rem" }}>{error}</p> : null}
      {data?.incomplete ? (
        <p className="muted" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
          The index read only part of the chain for this snapshot, so counts may be low.
        </p>
      ) : null}

      <div className="sv-table-wrap">
        <div className="sv-table-scroll">
          <div className="sv-table-inner sv-table-inner--tessera">
            <div className="sv-table-head">
              <span>Status</span>
              <span>Survey</span>
              <span style={{ textAlign: "center" }}>Qs</span>
              <span>Who can answer</span>
              <span>Participation</span>
              <span style={{ textAlign: "right" }}>Deadline</span>
            </div>

            {loading ? (
              <p className="sv-empty-row muted">Loading surveys…</p>
            ) : filtered.length === 0 ? (
              <div className="sv-empty-row" style={{ textAlign: "center", padding: "2rem 1rem" }}>
                {surveys.length === 0 ? (
                  <>
                    <p className="muted" style={{ marginBottom: "0.75rem" }}>No surveys are in the index yet.</p>
                    {walletApi ? <Link to="/surveys/create" className="btn-primary">+ Create the first survey</Link> : null}
                  </>
                ) : (
                  <p className="muted">No surveys match the current filters.</p>
                )}
              </div>
            ) : (
              filtered.map((s) => (
                <Link key={s.key} className="sv-table-row sv-table-row--tessera" to={`/surveys/${s.txHash}/${s.index}`}>
                  <div><SurveyBadges survey={s} showLinked={false} /></div>
                  <div style={{ minWidth: 0 }}>
                    <div className="sv-survey-name">{s.title || `Survey (${s.txHash.slice(0, 8)}:${s.index})`}</div>
                    {s.description ? <div className="sv-survey-desc-row">{s.description}</div> : null}
                    {s.govLinks?.length ? (
                      <div className="sv-survey-link-row muted">
                        Linked from {s.govLinks.length === 1 ? "governance action" : `${s.govLinks.length} governance actions`}
                        {s.govLinks[0]?.title ? `: ${s.govLinks[0].title}` : ""}
                      </div>
                    ) : null}
                  </div>
                  <div className="sv-q-count">{s.questions?.length ?? 0}</div>
                  <div className="sv-role-chips">
                    {(s.eligibleRoles || []).map((r) => {
                      const color = ROLE_COLORS[r] || "rgba(200,200,210,0.5)";
                      return (
                        <span key={r} className="sv-role-chip" style={{ color, borderColor: `${color}88`, background: `${color}18` }}>
                          {r}
                        </span>
                      );
                    })}
                  </div>
                  <div className="sv-participation muted">{participationLabel(s)}</div>
                  <div className="sv-ends-cell">
                    <div className="sv-ends-epoch">Epoch {s.endEpoch}</div>
                    <div className="sv-ends-sub">{deadlineLabel(s.lifecycle, s.endEpoch)}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {data?.fetchedAt ? (
        <p className="muted" style={{ fontSize: "0.76rem", marginTop: "0.6rem" }}>
          Survey data as of {new Date(data.fetchedAt * 1000).toLocaleString()} (Tessera snapshot). Epoch {data.currentEpoch}.
        </p>
      ) : null}
    </main>
  );
}
