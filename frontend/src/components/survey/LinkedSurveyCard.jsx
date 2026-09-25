// The CIP-179 survey a governance action links, shown on the action's page:
// the survey's state and figures, and the answer form itself. Resolution is
// /api/proposal-survey (the index's govLinks, else the action's anchor); the
// figures and the record come from /api/surveys/<tx>/<index>.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deadlineLabel } from "../../services/surveyNetwork";
import { participationLabel } from "../../services/surveyPresentation";
import RolePill from "./RolePill";
import SurveyBadges from "./SurveyBadges";
import SurveyTally from "./SurveyTally";
import SurveyRespond from "./SurveyRespond";
import { Alert, Button, Card, TabPanel, Tabs } from "../../ui";

export default function LinkedSurveyCard({ proposalId }) {
  const [link, setLink] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(null);

  useEffect(() => {
    let alive = true;
    setLink(null); setData(null); setError(""); setTab(null);
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

  if (!link || link.linked === false) return null;
  if (link.linked && !survey) {
    return (
      <Card className="p-detail__block" title="Linked survey · CIP-179">
        <Alert tone="warning">This action links a survey that is not available: {link.problem}</Alert>
      </Card>
    );
  }

  const surveyPath = `/surveys/${survey.txHash}/${survey.index}`;
  const detail = data?.survey ? { ...survey, ...data.survey, record: survey.record } : survey;

  return (
    <Card
      className="p-detail__block"
      title={<><span className="caps" style={{ display: "block", marginBottom: 4 }}>Linked survey · CIP-179</span><Link to={surveyPath}>{detail.title || `Survey (${survey.txHash.slice(0, 8)}:${survey.index})`}</Link></>}
      subtitle={detail.description || null}
      actions={<><SurveyBadges survey={detail} showLinked={false} /><Button size="sm" to={surveyPath}>Survey page →</Button></>}
    >
      <div className="c-stats" style={{ marginBottom: 12 }}>
        <div className="c-stat">
          <span className="c-stat__label">{detail.lifecycle === "open" ? "Closes" : "Closed"}</span>
          <span className="c-stat__value" style={{ fontSize: "1.1rem" }}>Epoch {detail.endEpoch}</span>
          <span className="c-stat__hint">{deadlineLabel(detail.lifecycle, detail.endEpoch)}</span>
        </div>
        <div className="c-stat">
          <span className="c-stat__label">Who can answer</span>
          <span className="row">{(detail.eligibleRoles || []).map((r) => <RolePill key={r} role={r} />)}</span>
        </div>
        <div className="c-stat">
          <span className="c-stat__label">Participation</span>
          <span className="c-stat__value" style={{ fontSize: "1.1rem" }}>{participationLabel(detail)}</span>
          {detail.questions?.length ? <span className="c-stat__hint">{detail.questions.length} {detail.questions.length === 1 ? "question" : "questions"}</span> : null}
        </div>
      </div>
      {link.available === false ? <Alert tone="warning">{link.problem} Answers are shown for reference; this survey is not treated as linked to the action.</Alert> : null}
      <p className="small muted" style={{ margin: "8px 0 12px" }}>
        The action's anchor names this survey (CIP-179). A survey answer is separate from a vote: it is survey metadata, not a governance vote, and it neither replaces nor implies one.
      </p>
      <Tabs ariaLabel="Survey" value={tab || "results"} onChange={setTab} tabs={[{ key: "respond", label: "Answer" }, { key: "results", label: "Results" }]} />
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <TabPanel tabKey="respond" value={tab}>
        <SurveyRespond survey={detail} data={data} onSubmitted={loadDetail} heading="" compact />
      </TabPanel>
      <TabPanel tabKey="results" value={tab}>
        {data ? <SurveyTally survey={data.survey} tally={data.tally} refusal={data.tallyRefusal} artifact={data.artifact} /> : <p className="muted">Loading the survey figures…</p>}
      </TabPanel>
    </Card>
  );
}
