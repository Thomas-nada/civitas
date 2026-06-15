import { useContext, useEffect, useState } from "react";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { Link } from "react-router-dom";
import { WalletContext } from "../context/WalletContext";
import { useCurrentEpoch } from "../hooks/useCurrentEpoch";

function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Cardano mainnet epoch timing (Shelley epoch 208 boundary, 5-day epochs).
const SHELLEY_EPOCH_208_START_UNIX = 1596059091;
const EPOCH_DURATION_SECONDS = 432000;

// A survey accepts responses through `endEpoch`, so it ends when that epoch
// completes — i.e. the start of the following epoch.
function epochEndDate(endEpoch) {
  if (endEpoch == null) return "—";
  const unix = SHELLEY_EPOCH_208_START_UNIX + (endEpoch + 1 - 208) * EPOCH_DURATION_SECONDS;
  return new Date(unix * 1000).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const ROLE_COLORS = {
  DRep: "var(--mint)",
  SPO: "var(--amber)",
  CC: "#a78bfa",
  Stakeholder: "rgba(200,200,210,0.6)",
};

const ALL_ROLES = ["DRep", "SPO", "CC", "Stakeholder"];

function StatusPill({ isActive }) {
  return (
    <span className={`sv-status-pill ${isActive ? "active" : "ended"}`}>
      <span className="sv-status-dot" />
      {isActive ? "Active" : "Ended"}
    </span>
  );
}

export default function SurveysListPage() {
  useSeoMeta({
    title: "Governance Surveys",
    description: "CIP-0179 on-chain surveys for Cardano DReps, SPOs, and ada holders. Weighted by stake and voting power.",
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

  const currentEpoch = useCurrentEpoch();

  const filtered = surveys.filter((s) => {
    if (roleFilter !== "All") {
      const roles = Array.isArray(s.details?.eligibleRoles)
        ? s.details.eligibleRoles
        : Object.keys(s.details?.roleWeighting ?? {});
      if (!roles.includes(roleFilter)) return false;
    }
    if (statusFilter !== "All") {
      const isActive =
        currentEpoch != null && s.details?.endEpoch != null
          ? currentEpoch <= s.details.endEpoch
          : true;
      if (statusFilter === "Active" && !isActive) return false;
      if (statusFilter === "Ended" && isActive) return false;
    }
    return true;
  });

  return (
    <main className="shell">
      <div className="sv-page-header">
        <div>
          <h1>On-Chain Surveys</h1>
          <p className="muted">
            Community polls recorded on Cardano via{" "}
            <span className="mono" style={{ fontSize: "0.88em" }}>metadata label 17</span>{" "}
            (CIP-0179).
          </p>
          <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
            <Link
              to="/guide?section=tool-survey-create"
              className="inline-link"
              style={{ fontSize: "0.78rem" }}
            >
              How to create a survey →
            </Link>
            <Link
              to="/guide?section=tool-survey-respond"
              className="inline-link"
              style={{ fontSize: "0.78rem" }}
            >
              How to respond →
            </Link>
          </div>
        </div>
        {walletApi ? (
          <Link to="/surveys/create" className="btn-primary">+ Create Survey</Link>
        ) : null}
      </div>

      {/* Filter chips */}
      <div className="sv-table-filters">
        <div className="sv-filter-chips">
          {["All", "Active", "Ended"].map((s) => (
            <button
              key={s}
              type="button"
              className={`sv-filter-chip${statusFilter === s ? " active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === "All" ? "All statuses" : s}
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

      {error ? (
        <p className="muted" style={{ marginTop: "0.75rem" }}>Error: {error}</p>
      ) : null}

      <div className="sv-table-wrap">
        <div className="sv-table-scroll">
          <div className="sv-table-inner">
            <div className="sv-table-head">
              <span>Status</span>
              <span>Survey</span>
              <span style={{ textAlign: "center" }}>Qs</span>
              <span>Roles</span>
              <span style={{ textAlign: "right" }}>Ends</span>
            </div>

            {loading ? (
              <p className="sv-empty-row muted">Loading surveys…</p>
            ) : filtered.length === 0 ? (
              <p className="sv-empty-row muted">
                {surveys.length === 0
                  ? "No surveys found on-chain yet."
                  : "No surveys match the current filters."}
              </p>
            ) : (
              filtered.map((s) => {
                const isActive =
                  currentEpoch != null && s.details?.endEpoch != null
                    ? currentEpoch <= s.details.endEpoch
                    : true;
                const roles = Array.isArray(s.details?.eligibleRoles)
                  ? s.details.eligibleRoles
                  : Object.keys(s.details?.roleWeighting ?? {});
                const questionCount = s.details?.questions?.length ?? 0;

                return (
                  <Link
                    key={s.surveyTxId}
                    className="sv-table-row"
                    to={`/surveys/${s.surveyTxId}`}
                  >
                    <div>
                      <StatusPill isActive={isActive} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="sv-survey-name">
                        {s.details?.title || "Untitled Survey"}
                      </div>
                      {s.details?.description ? (
                        <div className="sv-survey-desc-row">{s.details.description}</div>
                      ) : null}
                    </div>
                    <div className="sv-q-count">{questionCount}</div>
                    <div className="sv-role-chips">
                      {roles.map((r) => {
                        const color = ROLE_COLORS[r] || "rgba(200,200,210,0.5)";
                        return (
                          <span
                            key={r}
                            className="sv-role-chip"
                            style={{
                              color,
                              borderColor: `${color}88`,
                              background: `${color}18`,
                            }}
                          >
                            {r}
                          </span>
                        );
                      })}
                    </div>
                    <div className="sv-ends-cell">
                      <div className="sv-ends-epoch">Epoch {s.details?.endEpoch ?? "?"}</div>
                      <div className="sv-ends-sub">~{epochEndDate(s.details?.endEpoch)}</div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
