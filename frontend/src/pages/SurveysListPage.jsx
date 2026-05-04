import { useContext, useEffect, useState } from "react";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { Link } from "react-router-dom";
import { WalletContext } from "../context/WalletContext";

const SHELLEY_EPOCH_START_UNIX = 1596059091;
const EPOCH_DURATION_SECONDS = 432000;

function approxCurrentEpoch() {
  const delta = Math.floor(Date.now() / 1000) - SHELLEY_EPOCH_START_UNIX;
  return delta < 0 ? null : 208 + Math.floor(delta / EPOCH_DURATION_SECONDS);
}

function epochEndDate(epoch) {
  if (!epoch) return null;
  return new Date((SHELLEY_EPOCH_START_UNIX + (epoch - 208 + 1) * EPOCH_DURATION_SECONDS) * 1000);
}

function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const ROLE_COLORS = {
  DRep: "var(--mint)",
  SPO: "var(--amber)",
  CC: "#a78bfa",
  Stakeholder: "rgba(200,200,210,0.6)",
};

function RolePill({ role }) {
  const color = ROLE_COLORS[role] || "rgba(200,200,210,0.5)";
  return (
    <span className="pill" style={{ background: `${color}22`, borderColor: `${color}88`, color }}>
      {role}
    </span>
  );
}

function SurveyCard({ survey }) {
  const currentEpoch = approxCurrentEpoch();
  const isActive = currentEpoch != null && survey.details?.endEpoch != null
    ? currentEpoch <= survey.details.endEpoch
    : true;
  const endDate = epochEndDate(survey.details?.endEpoch);
  const roles = Object.keys(survey.details?.roleWeighting ?? {});
  const questionCount = survey.details?.questions?.length ?? 0;

  return (
    <article className="panel survey-card">
      <div className="survey-card-header">
        <div className="survey-card-status">
          <span className={`pill ${isActive ? "good" : "muted-pill"}`}>
            {isActive ? "Active" : "Ended"}
          </span>
          <span className="muted" style={{ fontSize: "0.8rem" }}>
            Epoch {survey.details?.endEpoch ?? "?"}
            {endDate ? ` · ${endDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : ""}
          </span>
        </div>
        <div className="survey-card-roles">
          {roles.map((r) => <RolePill key={r} role={r} />)}
        </div>
      </div>

      <h3 className="survey-card-title">
        <Link className="inline-link" to={`/surveys/${survey.surveyTxId}`}>
          {survey.details?.title || "Untitled Survey"}
        </Link>
      </h3>

      {survey.details?.description ? (
        <p className="muted survey-card-desc">
          {survey.details.description.length > 200
            ? survey.details.description.slice(0, 200) + "…"
            : survey.details.description}
        </p>
      ) : null}

      <div className="survey-card-meta">
        <span className="muted">{questionCount} question{questionCount !== 1 ? "s" : ""}</span>
        <span className="muted">Created {fmtDate(survey.blockTime)}</span>
        <Link className="btn-sm" to={`/surveys/${survey.surveyTxId}`}>View Results →</Link>
      </div>
    </article>
  );
}

const ALL_ROLES = ["DRep", "SPO", "CC", "Stakeholder"];

export default function SurveysListPage() {
  useSeoMeta({
    title: "Governance Surveys",
    description: "CIP-0179 on-chain surveys for Cardano DReps, SPOs, and ada holders. Weighted by stake and voting power."
  });
  const { walletApi } = useContext(WalletContext);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/surveys");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load surveys.");
        setSurveys(data.surveys || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentEpoch = approxCurrentEpoch();

  const filtered = surveys.filter((s) => {
    if (roleFilter !== "All") {
      const roles = Object.keys(s.details?.roleWeighting ?? {});
      if (!roles.includes(roleFilter)) return false;
    }
    if (statusFilter !== "All") {
      const isActive = currentEpoch != null && s.details?.endEpoch != null
        ? currentEpoch <= s.details.endEpoch
        : true;
      if (statusFilter === "Active" && !isActive) return false;
      if (statusFilter === "Ended" && isActive) return false;
    }
    return true;
  });

  return (
    <main className="shell">
      <header className="hero dashboard-header">
        <div>
          <h1>On-Chain Surveys</h1>
          <p className="muted">
            Community polls and governance surveys recorded on Cardano via{" "}
            <span className="mono" style={{ fontSize: "0.88em" }}>metadata label 17</span>{" "}
            (CIP-0179).
          </p>
        </div>
        {walletApi ? (
          <Link to="/surveys/create" className="btn-primary">
            + Create Survey
          </Link>
        ) : null}
      </header>

      {/* Filters */}
      <section className="controls dashboard-controls">
        <label>
          Role
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="All">All roles</option>
            {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Ended">Ended</option>
          </select>
        </label>
      </section>

      {error ? (
        <section className="status-row">
          <p className="muted">Error: {error}</p>
        </section>
      ) : null}

      {loading ? (
        <section className="status-row">
          <p className="muted">Loading surveys…</p>
        </section>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <section className="status-row">
          <p className="muted">
            {surveys.length === 0
              ? "No surveys found on-chain yet."
              : "No surveys match the current filters."}
          </p>
          {!walletApi ? (
            <p className="muted" style={{ marginTop: "0.5rem" }}>
              Connect your wallet to create the first survey.
            </p>
          ) : null}
        </section>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <section className="survey-list">
          {filtered.map((s) => <SurveyCard key={s.surveyTxId} survey={s} />)}
        </section>
      ) : null}
    </main>
  );
}
