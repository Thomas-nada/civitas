// One CIP-179 survey, read from Tessera through /api/surveys: the record, its
// responses, the informational tally, the governance actions that link it,
// and the answering panel (SurveyRespond: Tessera's own <tessera-respond>
// form; Civitas supplies the wallet, attaches the payload at label 17 and
// submits).
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { WalletContext } from "../context/WalletContext";
import { deadlineLabel, explorerTxUrl, formatUnixDate } from "../services/surveyNetwork";
import { buildAndSubmitSurveyCancellation, getConnectedPaymentKeyHash } from "../services/surveyTxService";
import { readableError } from "../lib/wallet/walletError";
import { participationLabel } from "../services/surveyPresentation";
import SurveyBadges from "../components/survey/SurveyBadges";
import SurveyTally from "../components/survey/SurveyTally";
import SurveyRespond from "../components/survey/SurveyRespond";
import RolePill from "../components/survey/RolePill";
import LinkedActionCard from "../components/survey/LinkedActionCard";

const EXCLUSION_LABELS = {
  "after-deadline": "after the deadline",
  invalid: "invalid",
  unproven: "credential not proven",
  superseded: "replaced by a later answer",
  undecryptable: "did not reveal"
};

function shortHash(value, head = 10, tail = 6) {
  const s = String(value || "");
  return s.length <= head + tail + 1 ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;
}

// Retries a survey that is not in the index yet (a just-published one).
function PendingPoller({ onTick }) {
  useEffect(() => {
    const id = setInterval(onTick, 20_000);
    return () => clearInterval(id);
  }, [onTick]);
  return null;
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function SurveyDetailPage() {
  const { txHash, surveyIndex } = useParams();
  const index = Number(surveyIndex ?? 0);
  const wallet = useContext(WalletContext);
  const walletApi = wallet?.walletApi;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState("results");
  const [connectedKeyHash, setConnectedKeyHash] = useState(null);
  const [cancelState, setCancelState] = useState("idle"); // idle | submitting | done | error
  const [cancelError, setCancelError] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/surveys/${txHash}/${index}`);
      const payload = await res.json().catch(() => ({}));
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error(payload.error || "Failed to load survey.");
      setNotFound(false);
      setData(payload);
    } catch (e) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [txHash, index]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!walletApi) { setConnectedKeyHash(null); return; }
    getConnectedPaymentKeyHash(walletApi).then(setConnectedKeyHash).catch(() => setConnectedKeyHash(null));
  }, [walletApi]);

  const survey = data?.survey;
  useSeoMeta({
    title: survey?.title ? `${survey.title} — Survey` : "Governance Survey",
    description: survey?.description || "A CIP-179 on-chain Cardano governance survey."
  });

  const responses = useMemo(() => data?.responses || [], [data]);
  const questions = survey?.questions || [];
  const isOwner = Boolean(survey && connectedKeyHash && survey.owner?.type === "key" && survey.owner.hash === connectedKeyHash);
  const onSubmitted = useCallback(() => { load(true); }, [load]);
  const retry = useCallback(() => { load(true); }, [load]);

  async function handleCancelSurvey() {
    if (!walletApi || !survey) return;
    if (!window.confirm("Cancel this survey on chain? This cannot be undone.")) return;
    setCancelState("submitting");
    setCancelError("");
    try {
      await buildAndSubmitSurveyCancellation(walletApi, survey.txHash, survey.index);
      setCancelState("done");
    } catch (e) {
      setCancelState("error");
      setCancelError(readableError(e, "Cancellation could not be submitted."));
    }
  }

  if (loading) {
    return (
      <main className="shell">
        <header className="hero"><h1>Survey</h1></header>
        <section className="status-row"><p className="muted">Loading…</p></section>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="shell">
        <header className="hero"><h1>Survey</h1></header>
        <section className="status-row">
          <p className="muted">
            This survey is not in the index yet. A just-published survey appears once its transaction is confirmed and the index has read it, usually within a few minutes; this page checks again automatically.
          </p>
          <PendingPoller onTick={retry} />
        </section>
      </main>
    );
  }

  if (error || !survey) {
    return (
      <main className="shell">
        <header className="hero"><h1>Survey</h1></header>
        <section className="status-row">
          <p className="vote-error">{error || "Failed to load survey."}</p>
          <button type="button" className="mode-btn" onClick={() => load()}>Try again</button>
        </section>
      </main>
    );
  }

  const countedText = participationLabel(survey);

  return (
    <main className="shell">
      <header className="hero dashboard-header">
        <div className="survey-hero-copy">
          <div className="survey-hero-topline">
            <Link className="muted back-link" to="/surveys">← All surveys</Link>
            <SurveyBadges survey={survey} />
            {isOwner ? <span className="pill" style={{ background: "rgba(84,228,188,0.12)", borderColor: "rgba(84,228,188,0.4)", color: "var(--mint)" }}>You own this</span> : null}
          </div>
          <h1 className="survey-hero-title">{survey.title || `Survey (${survey.txHash.slice(0, 8)}:${survey.index})`}</h1>
          {survey.external ? (
            <p className="muted survey-hero-description">The survey text lives in an external document that is not loaded here.</p>
          ) : survey.description ? (
            <p className="muted survey-hero-description">{survey.description}</p>
          ) : null}
          {survey.contentAnchor?.uri ? (
            <a className="ext-link" href={survey.contentAnchor.uri} target="_blank" rel="noreferrer" style={{ fontSize: "0.85rem" }}>Reference document ↗</a>
          ) : null}
          {isOwner && survey.lifecycle === "open" && cancelState !== "done" ? (
            <div style={{ marginTop: "0.85rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="mode-btn"
                style={{ borderColor: "rgba(244,63,94,0.5)", color: "var(--rose)" }}
                disabled={cancelState === "submitting"}
                onClick={handleCancelSurvey}
              >
                {cancelState === "submitting" ? "Cancelling…" : "Cancel this survey"}
              </button>
              <span className="muted" style={{ fontSize: "0.76rem" }}>Only you, the owner, can do this.</span>
            </div>
          ) : null}
          {cancelState === "done" ? <p className="muted" style={{ marginTop: "0.6rem", fontSize: "0.82rem", color: "var(--mint)" }}>✓ Cancellation submitted. The index reflects it once the transaction is confirmed.</p> : null}
          {cancelState === "error" ? <p className="vote-error" style={{ marginTop: "0.6rem" }}>{cancelError}</p> : null}
        </div>
      </header>

      <section className="survey-meta-row">
        <div className="survey-meta-item">
          <span className="muted">{survey.lifecycle === "open" ? "Closes" : "Closed"}</span>
          <strong>Epoch {survey.endEpoch}</strong>
          <span className="muted" style={{ fontSize: "0.74rem" }}>{deadlineLabel(survey.lifecycle, survey.endEpoch)}</span>
        </div>
        <div className="survey-meta-item">
          <span className="muted">Who can answer</span>
          <div className="survey-meta-pill-row">{survey.eligibleRoles.map((r) => <RolePill key={r} role={r} />)}</div>
        </div>
        <div className="survey-meta-item">
          <span className="muted">Participation</span>
          <strong>{countedText}</strong>
          {survey.responseCount != null ? <span className="muted" style={{ fontSize: "0.74rem" }}>{survey.responseCount} distinct {survey.responseCount === 1 ? "responder" : "responders"} in total</span> : null}
        </div>
        <div className="survey-meta-item">
          <span className="muted">Published</span>
          <strong>{formatUnixDate(survey.submittedAt)}</strong>
          <span className="muted" style={{ fontSize: "0.74rem" }}>epoch {survey.epochNo}</span>
        </div>
        <div className="survey-meta-item">
          <span className="muted">Survey TX</span>
          <a className="ext-link mono survey-tx-link" href={explorerTxUrl(survey.txHash)} target="_blank" rel="noreferrer">{shortHash(survey.txHash, 12, 8)}</a>
          {survey.tesseraUrl ? <a className="ext-link" href={survey.tesseraUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.74rem" }}>Open on Tessera ↗</a> : null}
        </div>
      </section>

      {survey.govLinks?.length ? (
        <section className="panel svy-side-card" style={{ marginBottom: "1rem" }}>
          <h3>Linked governance {survey.govLinks.length === 1 ? "action" : "actions"}</h3>
          <div className="lac-list">
            {survey.govLinks.map((link) => <LinkedActionCard key={link.actionId} link={link} />)}
          </div>
          <p className="muted svy-note">
            {survey.govLinks.length === 1 ? "This action's anchor names this survey (CIP-179), so the survey is shown on the action's page and can be answered there too." : "These actions' anchors name this survey (CIP-179), so it is shown on each action's page and can be answered there too."}{" "}
            A survey answer is separate from a vote: it is survey metadata, not a governance vote, and it neither replaces nor implies one.
          </p>
        </section>
      ) : null}

      <div className="survey-tabs">
        <button type="button" className={`survey-tab${tab === "results" ? " active" : ""}`} onClick={() => setTab("results")}>Results</button>
        <button type="button" className={`survey-tab${tab === "responses" ? " active" : ""}`} onClick={() => setTab("responses")}>Responses ({responses.length})</button>
        <button type="button" className={`survey-tab${tab === "respond" ? " active" : ""}`} onClick={() => setTab("respond")}>Answer</button>
      </div>

      {tab === "results" ? (
        <SurveyTally survey={survey} tally={data.tally} refusal={data.tallyRefusal} artifact={data.artifact} />
      ) : null}

      {tab === "responses" ? (
        <section className="panel">
          <h2>Responses on chain</h2>
          <p className="muted" style={{ fontSize: "0.8rem" }}>
            Every response transaction the index holds, newest first. "Counted" follows CIP-179's own rules (in window, valid, credential proven, latest per credential); a response with a pending proof still counts.
          </p>
          {responses.length === 0 ? (
            <p className="muted">No responses yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Credential</th>
                  <th>Answers</th>
                  <th>Epoch</th>
                  <th>Status</th>
                  <th>TX</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={`${r.txHash}:${r.responseIndex}`}>
                    <td><RolePill role={r.role} /></td>
                    <td className="mono" style={{ fontSize: "0.78rem" }} title={r.credential}>{shortHash(r.credentialHash, 8, 6)}</td>
                    <td style={{ fontSize: "0.82rem" }}>
                      {r.sealed ? (
                        <span className="muted">sealed</span>
                      ) : r.answers.length === 0 ? (
                        <span className="muted">—</span>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                          {r.answers.map((a) => (
                            <li key={a.questionIndex}><span className="muted">Q{a.questionIndex + 1}:</span> {a.text}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td>{r.epochNo}</td>
                    <td style={{ fontSize: "0.8rem" }}>
                      {r.counted ? (
                        <span style={{ color: "var(--mint)" }}>counted{r.verdict === null ? " (proof pending)" : ""}</span>
                      ) : (
                        <span className="muted">{EXCLUSION_LABELS[r.exclusion] || r.exclusion || "not counted"}</span>
                      )}
                    </td>
                    <td>
                      <a className="ext-link mono" style={{ fontSize: "0.78rem" }} href={explorerTxUrl(r.txHash)} target="_blank" rel="noreferrer">{r.txHash.slice(0, 10)}…</a>
                      {r.rationale?.uri ? (
                        <a className="ext-link" style={{ fontSize: "0.74rem", display: "block", marginTop: "2px" }} href={r.rationale.uri} target="_blank" rel="noreferrer">rationale ↗</a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {tab === "respond" ? <SurveyRespond survey={survey} data={data} onSubmitted={onSubmitted} /> : null}

      {data?.fetchedAt ? (
        <p className="muted" style={{ fontSize: "0.76rem", marginTop: "0.8rem" }}>
          Survey data as of {new Date(data.fetchedAt * 1000).toLocaleString()} (Tessera snapshot), cached, not live. Epoch {data.currentEpoch}.
          {questions.length ? ` ${questions.length} ${questions.length === 1 ? "question" : "questions"}.` : ""}
        </p>
      ) : null}
    </main>
  );
}
