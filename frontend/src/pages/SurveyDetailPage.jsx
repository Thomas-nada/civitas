// One CIP-179 survey, read from Tessera through /api/surveys: the record, its
// responses, the informational tally, the governance actions that link it,
// and the answering panel (SurveyRespond: Tessera's own <tessera-respond>
// form; Civitas supplies the wallet, attaches the payload at label 17 and
// submits).
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { WalletContext } from "../context/WalletContext";
import { useSurvey } from "../api/queries";
import { deadlineLabel, explorerTxUrl, formatUnixDate } from "../services/surveyNetwork";
import { buildAndSubmitSurveyCancellation, getConnectedPaymentKeyHash } from "../services/surveyTxService";
import { readableError } from "../lib/wallet/walletError";
import { participationLabel } from "../services/surveyPresentation";
import SurveyBadges from "../components/survey/SurveyBadges";
import SurveyTally from "../components/survey/SurveyTally";
import SurveyRespond from "../components/survey/SurveyRespond";
import RolePill from "../components/survey/RolePill";
import LinkedActionCard from "../components/survey/LinkedActionCard";
import { Alert, Button, Card, DataTable, EmptyState, Modal, PageHeader, Pill, Skeleton, StatGrid, StatTile, TabPanel, Tabs } from "../ui";
import { IconArrowLeft } from "../ui/icons";
import { truncateMiddle } from "../lib/governance/format";

const EXCLUSION_LABELS = {
  "after-deadline": "after the deadline",
  invalid: "invalid",
  unproven: "credential not proven",
  superseded: "replaced by a later answer",
  undecryptable: "did not reveal"
};

export default function SurveyDetailPage() {
  const { txHash, surveyIndex } = useParams();
  const index = Number(surveyIndex ?? 0);
  const wallet = useContext(WalletContext);
  const walletApi = wallet?.walletApi;
  const query = useSurvey(txHash, index, { refetchInterval: (q) => (q.state.error?.status === 404 ? 20_000 : false) });
  const data = query.data;
  const survey = data?.survey;
  const notFound = query.error?.status === 404;
  const [tab, setTab] = useState("results");
  const [connectedKeyHash, setConnectedKeyHash] = useState(null);
  const [cancel, setCancel] = useState({ kind: "idle" }); // idle | confirm | submitting | done | error

  useEffect(() => {
    if (!walletApi) { setConnectedKeyHash(null); return; }
    getConnectedPaymentKeyHash(walletApi).then(setConnectedKeyHash).catch(() => setConnectedKeyHash(null));
  }, [walletApi]);

  useSeoMeta({ title: survey?.title ? `${survey.title} — Survey` : "Governance Survey", description: survey?.description || "A CIP-179 on-chain Cardano governance survey." });
  const responses = useMemo(() => data?.responses || [], [data]);
  const isOwner = Boolean(survey && connectedKeyHash && survey.owner?.type === "key" && survey.owner.hash === connectedKeyHash);
  const refetch = query.refetch;
  const onSubmitted = useCallback(() => { refetch(); }, [refetch]);

  async function confirmCancel() {
    if (!walletApi || !survey) return;
    setCancel({ kind: "submitting" });
    try {
      await buildAndSubmitSurveyCancellation(walletApi, survey.txHash, survey.index);
      setCancel({ kind: "done" });
    } catch (e) {
      setCancel({ kind: "error", message: readableError(e, "Cancellation could not be submitted.") });
    }
  }

  if (query.isLoading) {
    return <main className="shell page p-survey" aria-busy="true"><Skeleton kind="text" width={120} /><div style={{ height: 12 }} /><Skeleton kind="title" width="60%" /><div style={{ height: 24 }} /><div className="c-stats"><Skeleton kind="card" count={4} /></div></main>;
  }
  if (notFound) {
    return (
      <main className="shell page p-survey">
        <Link to="/surveys" className="c-btn c-btn--ghost c-btn--sm"><IconArrowLeft size={16} /> All surveys</Link>
        <div style={{ height: 16 }} />
        <EmptyState title="This survey is not in the index yet.">A just-published survey appears once its transaction is confirmed and the index has read it, usually within a few minutes. This page checks again automatically.</EmptyState>
      </main>
    );
  }
  if (query.error || !survey) {
    return (
      <main className="shell page p-survey">
        <Link to="/surveys" className="c-btn c-btn--ghost c-btn--sm"><IconArrowLeft size={16} /> All surveys</Link>
        <div style={{ height: 16 }} />
        <Alert tone="danger" title="Could not load this survey.">{query.error?.message} <Button size="sm" onClick={() => refetch()}>Try again</Button></Alert>
      </main>
    );
  }

  const responseColumns = [
    { key: "role", label: "Role", compact: true, render: (r) => <RolePill role={r.role} /> },
    { key: "credential", label: "Credential", render: (r) => <span className="mono small" title={r.credential}>{truncateMiddle(r.credentialHash, 8, 6)}</span> },
    { key: "answers", label: "Answers", span: true, render: (r) => r.sealed ? <span className="muted">sealed</span> : r.answers.length === 0 ? <span className="muted">—</span> : <ul className="svy-answers">{r.answers.map((a) => <li key={a.questionIndex}><span className="muted">Q{a.questionIndex + 1}:</span> {a.text}</li>)}</ul> },
    { key: "epoch", label: "Epoch", align: "right", render: (r) => <span className="num">{r.epochNo}</span> },
    { key: "status", label: "Status", compact: true, render: (r) => r.counted ? <Pill tone="success" size="sm">counted{r.verdict === null ? " · proof pending" : ""}</Pill> : <Pill tone="neutral" size="sm">{EXCLUSION_LABELS[r.exclusion] || r.exclusion || "not counted"}</Pill> },
    { key: "tx", label: "Transaction", compact: true, render: (r) => <span className="small"><a className="mono" href={explorerTxUrl(r.txHash)} target="_blank" rel="noreferrer">{r.txHash.slice(0, 10)}…</a>{r.rationale?.uri ? <a className="c-table__sub" href={r.rationale.uri} target="_blank" rel="noreferrer">rationale ↗</a> : null}</span> }
  ];

  return (
    <main className="shell page p-survey">
      <Link to="/surveys" className="c-btn c-btn--ghost c-btn--sm" style={{ marginBottom: 12 }}><IconArrowLeft size={16} /> All surveys</Link>
      <PageHeader
        eyebrow={<><span>CIP-179 survey</span><SurveyBadges survey={survey} />{isOwner ? <Pill tone="accent" size="sm">You own this</Pill> : null}</>}
        title={survey.title || `Survey (${survey.txHash.slice(0, 8)}:${survey.index})`}
        lead={survey.external ? "The survey text lives in an external document that is not loaded here." : survey.description || null}
        actions={isOwner && survey.lifecycle === "open" && cancel.kind !== "done" ? <Button variant="danger" onClick={() => setCancel({ kind: "confirm" })} disabled={cancel.kind === "submitting"} loading={cancel.kind === "submitting"}>{cancel.kind === "submitting" ? "Cancelling…" : "Cancel this survey"}</Button> : null}
      >
        {survey.contentAnchor?.uri ? <p className="small" style={{ marginTop: 8 }}><a href={survey.contentAnchor.uri} target="_blank" rel="noreferrer">Reference document ↗</a></p> : null}
        {cancel.kind === "done" ? <Alert tone="success">Cancellation submitted. The index reflects it once the transaction is confirmed.</Alert> : null}
        {cancel.kind === "error" ? <Alert tone="danger">{cancel.message}</Alert> : null}
      </PageHeader>

      <div className="stack--6">
        <StatGrid>
          <StatTile label={survey.lifecycle === "open" ? "Closes" : "Closed"} value={`Epoch ${survey.endEpoch}`} hint={deadlineLabel(survey.lifecycle, survey.endEpoch)} />
          <div className="c-stat"><span className="c-stat__label">Who can answer</span><span className="row" style={{ gap: 4 }}>{survey.eligibleRoles.map((r) => <RolePill key={r} role={r} />)}</span></div>
          <StatTile label="Participation" value={participationLabel(survey)} hint={survey.responseCount != null ? `${survey.responseCount} distinct ${survey.responseCount === 1 ? "responder" : "responders"} in total` : null} />
          <StatTile label="Published" value={formatUnixDate(survey.submittedAt)} hint={`epoch ${survey.epochNo}`} />
          <div className="c-stat"><span className="c-stat__label">Survey transaction</span><a className="mono small break" href={explorerTxUrl(survey.txHash)} target="_blank" rel="noreferrer">{truncateMiddle(survey.txHash, 12, 8)}</a>{survey.tesseraUrl ? <a className="tiny" href={survey.tesseraUrl} target="_blank" rel="noreferrer">Open on Tessera ↗</a> : null}</div>
        </StatGrid>

        {survey.govLinks?.length ? (
          <Card title={`Linked governance ${survey.govLinks.length === 1 ? "action" : "actions"}`} footer={<>{survey.govLinks.length === 1 ? "This action's anchor names this survey (CIP-179), so the survey is shown on the action's page and can be answered there too." : "These actions' anchors name this survey (CIP-179), so it is shown on each action's page and can be answered there too."} A survey answer is separate from a vote: it is survey metadata, not a governance vote, and it neither replaces nor implies one.</>}>
            <div className="stack--2">{survey.govLinks.map((link) => <LinkedActionCard key={link.actionId} link={link} />)}</div>
          </Card>
        ) : null}

        <section>
          <Tabs ariaLabel="Survey" value={tab} onChange={setTab} tabs={[{ key: "results", label: "Results" }, { key: "responses", label: "Responses", count: responses.length }, { key: "respond", label: "Answer" }]} />
          <TabPanel tabKey="results" value={tab}><SurveyTally survey={survey} tally={data.tally} refusal={data.tallyRefusal} artifact={data.artifact} /></TabPanel>
          <TabPanel tabKey="responses" value={tab}>
            <Card title="Responses on chain" subtitle="Every response transaction the index holds, newest first. “Counted” follows CIP-179's own rules (in window, valid, credential proven, latest per credential); a response with a pending proof still counts.">
              <DataTable columns={responseColumns} rows={responses} getRowKey={(r) => `${r.txHash}:${r.responseIndex}`} emptyMessage="No responses yet." caption="Responses" />
            </Card>
          </TabPanel>
          <TabPanel tabKey="respond" value={tab}><SurveyRespond survey={survey} data={data} onSubmitted={onSubmitted} /></TabPanel>
        </section>

        {data?.fetchedAt ? <p className="tiny muted">Survey data as of {new Date(data.fetchedAt * 1000).toLocaleString()} (Tessera snapshot), cached, not live. Epoch {data.currentEpoch}.{survey.questions?.length ? ` ${survey.questions.length} ${survey.questions.length === 1 ? "question" : "questions"}.` : ""}</p> : null}
      </div>

      <Modal open={cancel.kind === "confirm"} onClose={() => setCancel({ kind: "idle" })} title="Cancel this survey?" size="sm" footer={<div className="row row--end"><Button onClick={() => setCancel({ kind: "idle" })}>Keep it open</Button><Button variant="danger" onClick={confirmCancel}>Cancel survey on chain</Button></div>}>
        <p>Cancelling is an on-chain transaction signed by the owner key. It cannot be undone, and no tally is drawn for a cancelled survey.</p>
      </Modal>
    </main>
  );
}
