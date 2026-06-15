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

function HowItWorks({ isConnected, onConnect }) {
  const steps = [
    { n: "1", title: "Browse", body: "Open any survey to read its questions and see live results — no wallet needed." },
    { n: "2", title: "Connect a wallet", body: "Connect a Cardano wallet (top-right) to take part. Connecting is free." },
    { n: "3", title: "Create or respond", body: "Publish your own survey or answer one. Each action is a small on-chain transaction (under ~1 ADA)." },
  ];
  return (
    <div className="sv-howto panel">
      <div className="sv-howto-intro">
        <h2 className="sv-howto-title">What are on-chain surveys?</h2>
        <p className="muted">
          A way for the Cardano community — DReps, SPOs, committee members and ada holders — to ask and answer
          questions directly on the blockchain. Every response is a verifiable transaction tied to a real wallet.
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
      {!isConnected ? (
        <div className="sv-howto-cta">
          <button type="button" className="btn-primary" onClick={onConnect}>Connect Wallet</button>
          <span className="muted" style={{ fontSize: "0.8rem" }}>to create a survey or respond to one</span>
        </div>
      ) : null}
    </div>
  );
}

export default function SurveysListPage() {
  useSeoMeta({
    title: "Governance Surveys",
    description: "CIP-0179 on-chain surveys for Cardano DReps, SPOs, and ada holders. Weighted by stake and voting power.",
  });
  const { walletApi, setWalletMenuOpen } = useContext(WalletContext);
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
        ) : (
          <button type="button" className="btn-primary" onClick={() => setWalletMenuOpen(true)}>
            Connect wallet to create
          </button>
        )}
      </div>

      <HowItWorks isConnected={Boolean(walletApi)} onConnect={() => setWalletMenuOpen(true)} />

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
              <div className="sv-empty-row" style={{ textAlign: "center", padding: "2rem 1rem" }}>
                {surveys.length === 0 ? (
                  <>
                    <p className="muted" style={{ marginBottom: "0.75rem" }}>
                      No surveys have been created yet. Be the first.
                    </p>
                    {walletApi ? (
                      <Link to="/surveys/create" className="btn-primary">+ Create the first survey</Link>
                    ) : (
                      <button type="button" className="btn-primary" onClick={() => setWalletMenuOpen(true)}>
                        Connect wallet to create
                      </button>
                    )}
                  </>
                ) : (
                  <p className="muted">No surveys match the current filters.</p>
                )}
              </div>
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
