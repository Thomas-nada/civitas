// CIP-179 surveys and polls on Cardano (metadata label 17), read from the
// Tessera index through the server. Browse without a wallet; sign in to
// answer or create one.
import { useContext, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { WalletContext } from "../context/WalletContext";
import { useSurveys } from "../api/queries";
import { deadlineLabel } from "../services/surveyNetwork";
import { participationLabel } from "../services/surveyPresentation";
import SurveyBadges from "../components/survey/SurveyBadges";
import RolePill from "../components/survey/RolePill";
import { Alert, Button, Card, Chip, DataTable, PageHeader, Skeleton } from "../ui";

const ALL_ROLES = ["DRep", "SPO", "CC", "Stakeholder", "Keyholder"];
const STATUS_FILTERS = [["all", "All"], ["open", "Open"], ["closed", "Closed"], ["linked", "Linked to an action"], ["cancelled", "Cancelled"]];

function HowItWorks() {
  const steps = [
    ["Browse", "Open any survey to read its questions and the informational tally. No wallet needed."],
    ["Sign in", "Sign in with a Cardano wallet (top right) as a DRep or delegator to take part. Signing in is free."],
    ["Answer or create", "Answer a survey with the wallet that holds an eligible credential, or publish your own. Each is one small on-chain transaction: you pay the network fee, nothing else."]
  ];
  return (
    <Card title="What are on-chain surveys?" subtitle={<>CIP-179 puts surveys and polls on the Cardano chain as transaction metadata (label 17). The roles allowed to answer, the closing epoch and every answer are on chain, so anyone can read and count them without trusting whoever published the survey. Civitas reads them from <a href="https://github.com/mpizenberg/Tessera" target="_blank" rel="noreferrer">Tessera</a>, the reference CIP-179 index.</>}>
      <ol className="svy-steps">
        {steps.map(([title, body], i) => <li key={title}><span className="svy-steps__num">{i + 1}</span><div><strong>{title}</strong><p className="small muted" style={{ margin: "2px 0 0" }}>{body}</p></div></li>)}
      </ol>
    </Card>
  );
}

export default function SurveysListPage() {
  useSeoMeta({ title: "Surveys & Polls", description: "CIP-179 on-chain surveys and polls for Cardano governance participants, read from the Tessera index." });
  const wallet = useContext(WalletContext);
  const navigate = useNavigate();
  const query = useSurveys();
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const surveys = useMemo(() => query.data?.surveys || [], [query.data]);
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

  const columns = [
    { key: "status", label: "Status", compact: true, render: (s) => <SurveyBadges survey={s} showLinked={false} /> },
    {
      key: "title", label: "Survey", span: true,
      render: (s) => (
        <div className="svy-row">
          <span className="c-table__primary">{s.title || `Survey (${s.txHash.slice(0, 8)}:${s.index})`}</span>
          {s.description ? <span className="c-table__sub svy-row__desc">{s.description}</span> : null}
          {s.govLinks?.length ? (
            <span className="c-table__sub">
              Linked from {s.govLinks.length === 1 ? "governance action" : `${s.govLinks.length} governance actions`}
              {s.govLinks[0]?.title ? <>: <a href={`/actions/${encodeURIComponent(s.govLinks[0].actionId)}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/actions/${encodeURIComponent(s.govLinks[0].actionId)}`); }}>{s.govLinks[0].title} →</a></> : null}
            </span>
          ) : null}
        </div>
      )
    },
    { key: "questions", label: "Questions", align: "right", render: (s) => <span className="num">{s.questions?.length ?? 0}</span> },
    { key: "roles", label: "Who can answer", render: (s) => <span className="row" style={{ gap: 4 }}>{(s.eligibleRoles || []).map((r) => <RolePill key={r} role={r} />)}</span> },
    { key: "participation", label: "Participation", render: (s) => <span className="small muted">{participationLabel(s)}</span> },
    { key: "deadline", label: "Deadline", align: "right", render: (s) => <span className="small"><span className="num">Epoch {s.endEpoch}</span><span className="c-table__sub">{deadlineLabel(s.lifecycle, s.endEpoch)}</span></span> }
  ];

  return (
    <main className="shell page p-surveys">
      <PageHeader eyebrow="Governance" title="Surveys & polls" lead={<>Community polls recorded on Cardano as <span className="mono">metadata label 17</span> (CIP-179), on mainnet.</>}
        actions={wallet?.walletApi ? <Button variant="primary" to="/surveys/create">+ Create survey</Button> : <span className="small muted">Sign in with a wallet to create a survey.</span>}>
        <div className="row" style={{ marginTop: 8, gap: 16 }}>
          <Link to="/guide?section=tool-survey-respond" className="small">How answering works →</Link>
          <Link to="/guide?section=tool-survey-create" className="small">How to create a survey →</Link>
        </div>
      </PageHeader>

      <div className="stack--6">
        <HowItWorks />
        <div className="svy-filters">
          <div className="c-chips">{STATUS_FILTERS.map(([key, label]) => <Chip key={key} active={statusFilter === key} count={counts[key]} onClick={() => setStatusFilter(key)}>{label}</Chip>)}</div>
          <div className="c-chips"><Chip active={roleFilter === "All"} onClick={() => setRoleFilter("All")}>All roles</Chip>{ALL_ROLES.map((r) => <Chip key={r} active={roleFilter === r} onClick={() => setRoleFilter(r)}>{r}</Chip>)}</div>
        </div>
        {query.error ? <Alert tone="danger">{query.error.message}</Alert> : null}
        {query.data?.incomplete ? <Alert tone="warning">The index read only part of the chain for this snapshot, so counts may be low.</Alert> : null}
        {query.isLoading ? <Skeleton kind="row" count={6} /> : (
          <DataTable
            columns={columns}
            rows={filtered}
            getRowKey={(s) => s.key}
            onRowClick={(s) => navigate(`/surveys/${s.txHash}/${s.index}`)}
            emptyMessage={surveys.length === 0 ? "No surveys are in the index yet." : "No surveys match the current filters."}
            caption="Surveys"
          />
        )}
        {surveys.length === 0 && !query.isLoading && wallet?.walletApi ? <div><Button variant="primary" to="/surveys/create">+ Create the first survey</Button></div> : null}
        {query.data?.fetchedAt ? <p className="tiny muted">Survey data as of {new Date(query.data.fetchedAt * 1000).toLocaleString()} (Tessera snapshot). Epoch {query.data.currentEpoch}.</p> : null}
      </div>
    </main>
  );
}
