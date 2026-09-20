// The CIP-179 survey a governance action links, shown on the action's page:
// the survey's state and figures, and the answer form itself, so the survey
// is answered where the action is read. Resolution is /api/proposal-survey
// (the index's govLinks, else the action's anchor); the figures and the
// record come from /api/surveys/<tx>/<index>.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deadlineLabel } from "../../services/surveyNetwork";
import { participationLabel } from "../../services/surveyPresentation";
import RolePill from "./RolePill";
import SurveyBadges from "./SurveyBadges";
import SurveyTally from "./SurveyTally";
import SurveyRespond from "./SurveyRespond";

export default function LinkedSurveyCard({ proposalId }) {
  const [link, setLink] = useState(null); // /api/proposal-survey payload
  const [data, setData] = useState(null); // /api/surveys/<tx>/<index> payload
  const [error, setError] = useState("");
  const [tab, setTab] = useState(null); // "respond" | "results"

  useEffect(() => {
    let alive = true;
    setLink(null);
    setData(null);
    setError("");
    setTab(null);
    if (!proposalId) return undefined;
    fetch(`/api/proposal-survey?proposalId=${encodeURIComponent(proposalId)}`)
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.error || "Failed to resolve the linked survey.");
        return payload;
      })
      .then((payload) => { if (alive) setLink(payload); })
      .catch((e) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [proposalId]);

  const survey = link?.survey || null;
  const loadDetail = useCallback(async () => {
    if (!survey) return;
    try {
      const res = await fetch(`/api/surveys/${survey.txHash}/${survey.index}`);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Failed to load the survey.");
      setData(payload);
    } catch (e) {
      setError(e.message);
    }
  }, [survey?.txHash, survey?.index]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadDetail(); }, [loadDetail]);

  useEffect(() => {
    if (!survey || tab) return;
    setTab(survey.lifecycle === "open" && link?.available ? "respond" : "results");
  }, [survey, link, tab]);

  // Nothing linked (or the link could not be read): the action page stays as it is.
  if (!link || link.linked === false) return null;
  if (link.linked && !survey) {
    return (
      <section className="stats-section stats-section--wide">
        <div className="panel lsc" style={{ margin: 0 }}>
          <span className="lsc-kicker">Linked survey · CIP-179</span>
          <p className="vote-notice" style={{ marginTop: "0.5rem" }}>This action links a survey that is not available: {link.problem}</p>
        </div>
      </section>
    );
  }

  const surveyPath = `/surveys/${survey.txHash}/${survey.index}`;
  const detail = data?.survey ? { ...survey, ...data.survey, record: survey.record } : survey;

  return (
    <section className="stats-section stats-section--wide">
      <div className="panel lsc" style={{ margin: 0 }}>
        <div className="lsc-head">
          <div className="lsc-head-copy">
            <span className="lsc-kicker">Linked survey · CIP-179</span>
            <h2 className="lsc-title">
              <Link to={surveyPath} className="inline-link">{detail.title || `Survey (${survey.txHash.slice(0, 8)}:${survey.index})`}</Link>
            </h2>
            {detail.description ? <p className="muted lsc-desc">{detail.description}</p> : null}
          </div>
          <div className="lsc-head-side">
            <SurveyBadges survey={detail} showLinked={false} />
            <Link to={surveyPath} className="mode-btn" style={{ fontSize: "0.78rem" }}>Survey page →</Link>
          </div>
        </div>

        <div className="lsc-meta">
          <div className="lsc-meta-item">
            <span className="muted">{detail.lifecycle === "open" ? "Closes" : "Closed"}</span>
            <strong>Epoch {detail.endEpoch}</strong>
            <span className="muted lsc-meta-sub">{deadlineLabel(detail.lifecycle, detail.endEpoch)}</span>
          </div>
          <div className="lsc-meta-item">
            <span className="muted">Who can answer</span>
            <div className="survey-meta-pill-row">{(detail.eligibleRoles || []).map((r) => <RolePill key={r} role={r} />)}</div>
          </div>
          <div className="lsc-meta-item">
            <span className="muted">Participation</span>
            <strong>{participationLabel(detail)}</strong>
            {detail.questions?.length ? <span className="muted lsc-meta-sub">{detail.questions.length} {detail.questions.length === 1 ? "question" : "questions"}</span> : null}
          </div>
        </div>

        {link.available === false ? (
          <p className="vote-notice" style={{ marginTop: "0.75rem" }}>{link.problem} Answers are shown for reference; this survey is not treated as linked to the action.</p>
        ) : null}
        <p className="muted lsc-note">
          The action's anchor names this survey (CIP-179). A survey answer is separate from a vote: it is survey metadata, not a governance vote, and it neither replaces nor implies one.
        </p>

        <div className="survey-tabs lsc-tabs">
          <button type="button" className={`survey-tab${tab === "respond" ? " active" : ""}`} onClick={() => setTab("respond")}>Answer</button>
          <button type="button" className={`survey-tab${tab === "results" ? " active" : ""}`} onClick={() => setTab("results")}>Results</button>
        </div>

        {error ? <p className="vote-error">{error}</p> : null}

        {tab === "respond" ? (
          <SurveyRespond survey={detail} data={data} onSubmitted={loadDetail} heading="" compact />
        ) : null}

        {tab === "results" ? (
          data ? (
            <SurveyTally survey={data.survey} tally={data.tally} refusal={data.tallyRefusal} artifact={data.artifact} />
          ) : (
            <p className="muted" style={{ margin: "0.75rem 0 0" }}>Loading the survey figures…</p>
          )
        ) : null}
      </div>
    </section>
  );
}
