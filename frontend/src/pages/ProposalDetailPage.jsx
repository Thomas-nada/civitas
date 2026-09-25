import { Component, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { useSnapshotKey, withSnapshotParam } from "../hooks/useSnapshotKey";
import { useAction } from "../api/queries";
import { fetchJson } from "../api/client";
import { LivePill, SnapshotBanner } from "../components/LiveStatus";
import MetaVerifyPill from "../components/MetaVerifyPill";
import LinkedSurveyCard from "../components/survey/LinkedSurveyCard";
import DrepVotePanel from "../components/vote/DrepVotePanel";
import {
  Alert, Button, Card, DataTable, Disclosure, EmptyState, Input, KeyValue, Modal, PageHeader, Pill, ProgressBar, RolePill, Select, Skeleton, StatusPill, TabPanel, Tabs, VotePill
} from "../ui";
import { IconArrowLeft, IconCopy, IconCheck } from "../ui/icons";
import { copyText, epochStartUnix, formatAda, formatAdaCompact, formatCountdown, formatEpochDate, formatPct, shortHash, truncateMiddle } from "../lib/governance/format";

class MarkdownErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: false }; }
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error) return <pre>{this.props.source}</pre>;
    return this.props.children;
  }
}
function SafeMarkdown({ children }) {
  return (
    <MarkdownErrorBoundary source={children}>
      <div className="c-prose"><ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown></div>
    </MarkdownErrorBoundary>
  );
}

const PREFERRED_SECTIONS = [
  ["abstract", "Abstract"], ["summary", "Summary"], ["motivation", "Motivation"], ["rationaleStatement", "Rationale"],
  ["rationale", "Rationale"], ["precedentDiscussion", "Precedent discussion"], ["counterargumentDiscussion", "Counterarguments"], ["conclusion", "Conclusion"]
];

function normalizeActionPayload(action, liveMetadata) {
  const metaSource = (liveMetadata?.json_metadata && typeof liveMetadata.json_metadata === "object" ? liveMetadata.json_metadata : null)
    || (action?.metadataJson && typeof action.metadataJson === "object" ? action.metadataJson : null);
  const source = metaSource || (action?.governanceDescription && typeof action.governanceDescription === "object" ? action.governanceDescription : {});
  const body = source.body && typeof source.body === "object" ? source.body : source;
  const refs = Array.isArray(body.references) ? body.references : [];
  const references = refs.map((ref) => {
    if (!ref || typeof ref !== "object") return null;
    const uri = String(ref.uri || ref.url || ref.href || "").trim();
    if (!uri) return null;
    return { label: String(ref.label || ref.title || uri).trim(), uri, type: String(ref["@type"] || ref.type || "Reference").trim() || "Reference" };
  }).filter(Boolean);
  const sections = [];
  const usedKeys = new Set(["references"]);
  for (const [key, label] of PREFERRED_SECTIONS) {
    const value = body?.[key];
    if (typeof value === "string" && value.trim()) { sections.push({ key, title: label, type: "text", content: value.trim() }); usedKeys.add(key); }
  }
  for (const [key, value] of Object.entries(body || {})) {
    if (usedKeys.has(key)) continue;
    const raw = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").trim();
    const title = raw.replace(/\b\w/g, (m) => m.toUpperCase());
    if (typeof value === "string" && value.trim()) sections.push({ key, title, type: "text", content: value.trim() });
    else if (value && typeof value === "object") sections.push({ key, title, type: "json", content: value });
  }
  return {
    title: String(body.title || body.name || action?.actionName || "").trim(),
    sections,
    references,
    metadataUrl: String(liveMetadata?.url || action?.metadataUrl || "").trim(),
    metadataHash: String(liveMetadata?.hash || action?.metadataHash || "").trim()
  };
}

function extractTreasuryAmountAda(action) {
  if (!action) return 0;
  const withdrawals = action.metadataJson?.body?.onChain?.withdrawals;
  if (Array.isArray(withdrawals)) {
    const total = withdrawals.reduce((s, r) => s + Number(r?.withdrawalAmount || 0), 0);
    if (total > 0) return total / 1_000_000;
  }
  const entries = Array.isArray(action.governanceDescription?.contents?.[0]) ? action.governanceDescription.contents[0] : [];
  const total = entries.reduce((s, item) => s + Number(Array.isArray(item) ? item[1] : 0), 0);
  return total > 0 ? total / 1_000_000 : 0;
}

function epochFromUnix(unix) {
  const t = Number(unix || 0);
  if (!Number.isFinite(t) || t < 1596059091) return null;
  return 208 + Math.floor((t - 1596059091) / 432000);
}

/** One voting body's progress against its threshold. */
function VoteBody({ kind, model, voteStats }) {
  const num = (v) => Number(v || 0);
  const pctOf = (v, base) => (base > 0 ? (num(v) / base) * 100 : 0);
  let yesPct = 0; let noPct = 0; let threshold = null; let title = ""; let rows = [];
  if (kind === "drep") {
    title = "DReps";
    const base = num(model.totalActiveStakeAda);
    const yes = num(model.drepYesPowerAda);
    const no = num(model.drepNoPowerAda);
    const noConf = num(model.drepNoConfidencePowerAda);
    const abstain = num(model.drepAbstainActivePowerAda);
    const notVoted = Number.isFinite(Number(model.drepNotVotedPowerAda)) ? num(model.drepNotVotedPowerAda) : Math.max(base - yes - no - noConf - abstain, 0);
    const outcomeBase = Math.max(base - abstain, 0);
    const noSide = no + noConf + notVoted;
    yesPct = pctOf(yes, outcomeBase); noPct = pctOf(noSide, outcomeBase); threshold = model.drepRequiredPct;
    rows = [
      ["yes", "Yes", formatPct(yesPct), formatAdaCompact(yes)],
      ["no", "No side", formatPct(noPct), formatAdaCompact(noSide)],
      no > 0 && ["sub", "Voted no", "", formatAdaCompact(no)],
      noConf > 0 && ["sub", "No confidence", "", formatAdaCompact(noConf)],
      notVoted > 0 && ["sub", "Not voted", "", formatAdaCompact(notVoted)],
      abstain > 0 && ["abstain", "Abstain", formatPct(pctOf(abstain, base)), formatAdaCompact(abstain)],
      ["rest", "Active stake", "", formatAdaCompact(base)]
    ].filter(Boolean);
  } else if (kind === "spo") {
    title = "SPOs";
    const yes = num(model.spoYesAda); const noAll = num(model.spoNoAda); const abstain = num(model.spoAbstainAda); const notVoted = num(model.spoNotVotedAda);
    const total = Math.max(yes + noAll, 0);
    yesPct = pctOf(yes, total); noPct = pctOf(noAll, total); threshold = model.spoRequiredPct;
    rows = [
      ["yes", "Yes", formatPct(yesPct), formatAdaCompact(yes)],
      ["no", "No side", formatPct(noPct), formatAdaCompact(noAll)],
      noAll - notVoted > 0 && ["sub", "Voted no", "", formatAdaCompact(noAll - notVoted)],
      notVoted > 0 && ["sub", "Not voted", "", formatAdaCompact(notVoted)],
      abstain > 0 && ["abstain", "Abstain", "", formatAdaCompact(abstain)]
    ].filter(Boolean);
  } else {
    title = "Constitutional Committee";
    const yes = num(voteStats?.yes); const no = num(voteStats?.no); const abstain = num(voteStats?.abstain);
    const eligible = Math.max(num(model.ccEligibleCount), 0);
    const notVoted = Math.max(eligible - (yes + no + abstain), 0);
    const base = Math.max(eligible - abstain, yes + no + notVoted) || 1;
    yesPct = (yes / base) * 100; noPct = (no / base) * 100; threshold = model.ccRequiredPct;
    rows = [
      yes > 0 && ["yes", "Constitutional", yes, ""],
      no > 0 && ["no", "Unconstitutional", no, ""],
      abstain > 0 && ["abstain", "Abstain", abstain, ""],
      notVoted > 0 && ["rest", "Not voted", notVoted, ""]
    ].filter(Boolean);
  }
  const clamp = (v) => Math.max(0, Math.min(100, v));
  return (
    <Card className="p-detail__body">
      <div className="row row--between" style={{ marginBottom: 10 }}>
        <strong>{title}</strong>
        {threshold !== null && threshold !== undefined ? <span className="small muted">Required {threshold}%</span> : null}
      </div>
      <div className="c-bar c-bar--lg" role="img" aria-label={`${title}: yes ${Math.round(yesPct)}%, no ${Math.round(noPct)}%`}>
        <span className="c-bar__seg c-bar__seg--yes" style={{ width: `${clamp(yesPct)}%` }} />
        <span className="c-bar__seg c-bar__seg--no" style={{ width: `${Math.min(clamp(noPct), 100 - clamp(yesPct))}%` }} />
        {threshold > 0 ? <span className="c-bar__marker" style={{ left: `${clamp(threshold)}%` }} /> : null}
      </div>
      <dl className="p-detail__body-rows">
        {rows.map(([tone, label, pct, ada], i) => (
          <div key={i} className={`p-detail__body-row p-detail__body-row--${tone}`}>
            <dt>{label}</dt>
            <dd className="num">{pct !== "" ? <strong>{pct}</strong> : null} {ada ? <span className="muted">{ada}</span> : null}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function CopyButton({ value }) {
  const [ok, setOk] = useState(false);
  return (
    <Button size="sm" variant="ghost" icon={ok ? <IconCheck size={14} /> : <IconCopy size={14} />} aria-label="Copy action id" title="Copy action id" onClick={async () => { if (await copyText(value)) { setOk(true); setTimeout(() => setOk(false), 1500); } }} />
  );
}

export default function ProposalDetailPage() {
  const { proposalId } = useParams();
  const snapshotKey = useSnapshotKey();
  const id = decodeURIComponent(String(proposalId || "")).trim();
  const query = useAction(id, snapshotKey);
  const data = query.data || null;
  const action = data?.action || null;
  const model = data?.model || null;

  // Anchor verification and hash-mismatch flag (snapshot-served).
  const [metadata, setMetadata] = useState(null);
  useEffect(() => {
    let alive = true;
    setMetadata(null);
    fetchJson(`/api/proposal-metadata?proposalId=${encodeURIComponent(id)}`).then((d) => { if (alive) setMetadata(d); }).catch(() => {});
    return () => { alive = false; };
  }, [id]);

  // Delivery record for treasury withdrawals (Intersect admin API mapping).
  const [delivery, setDelivery] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchJson("/api/treasury-admin/mapping").then((d) => { if (alive && d?.proposalToProjects) setDelivery(d.proposalToProjects[id] || null); }).catch(() => {});
    return () => { alive = false; };
  }, [id]);

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNowMs(Date.now()), 30_000); return () => clearInterval(t); }, []);

  const [tab, setTab] = useState("votes");
  const [roleFilter, setRoleFilter] = useState("all");
  const [voteFilter, setVoteFilter] = useState("all");
  const [rationaleFilter, setRationaleFilter] = useState("all");
  const [voteSearch, setVoteSearch] = useState("");
  const [rationaleModal, setRationaleModal] = useState(null); // { key, title, item }
  const [rationaleState, setRationaleState] = useState({}); // key -> { loading, text, image, verify, error }

  const seoTitle = action?.actionName ? (action.governanceType ? `${action.actionName} — ${action.governanceType}` : action.actionName) : "Governance Proposal";
  useSeoMeta({
    title: seoTitle,
    description: action?.actionName
      ? `Vote breakdown, DRep rationales, and outcome for "${action.actionName}" — a Cardano ${action.governanceType || "governance"} proposal.`
      : "Detailed voting breakdown, DRep and SPO rationales, and outcome for a Cardano governance proposal."
  });

  const doc = useMemo(() => normalizeActionPayload({ ...(action || {}), actionName: action?.actionName || id }, metadata), [action, metadata, id]);

  // Votes in the shape the vote panel and table expect.
  const allVotes = useMemo(() => (data?.votes || []).map((v) => ({
    role: v.role === "drep" ? "DRep" : v.role === "constitutional_committee" ? "CC" : "SPO",
    voterRole: v.role,
    voter: v.voterName || v.voterId || "Unknown",
    voterId: v.voterId,
    vote: v.vote,
    outcome: v.outcome,
    voteTxHash: v.voteTxHash,
    votedAtUnix: v.votedAtUnix,
    votedEpoch: epochFromUnix(v.votedAtUnix),
    rationaleUrl: v.rationaleUrl || "",
    hasRationale: Boolean(v.hasRationale || v.rationaleUrl),
    votingPowerAda: v.votingPowerAda,
    rationaleQualityScore: v.rationaleQualityScore
  })), [data]);

  const filteredVotes = useMemo(() => {
    const q = voteSearch.trim().toLowerCase();
    return allVotes.filter((row) => {
      if (roleFilter !== "all" && row.role !== roleFilter) return false;
      if (voteFilter !== "all" && String(row.vote || "").toLowerCase().replace(/\s+/g, "") !== voteFilter) return false;
      const has = Boolean(row.rationaleUrl || row.hasRationale);
      if (rationaleFilter === "with" && !has) return false;
      if (rationaleFilter === "without" && has) return false;
      if (!q) return true;
      return [row.voter, row.voterId, row.role, row.vote, row.outcome, row.votedEpoch].map((v) => String(v || "").toLowerCase()).join(" ").includes(q);
    });
  }, [allVotes, roleFilter, voteFilter, rationaleFilter, voteSearch]);

  async function openRationale(item) {
    const key = `${id}-${item.role}-${item.voterId}-${item.voteTxHash || ""}`;
    setRationaleModal({ key, title: `${item.role} · ${item.voter}`, item });
    if (rationaleState[key]?.text || rationaleState[key]?.loading) return;
    setRationaleState((s) => ({ ...s, [key]: { loading: true } }));
    try {
      const params = new URLSearchParams();
      if (item.rationaleUrl) params.set("url", item.rationaleUrl);
      if (item.voteTxHash) params.set("voteTxHash", item.voteTxHash);
      params.set("proposalId", id);
      params.set("voterId", item.voterId || "");
      params.set("voterRole", item.voterRole || "");
      const d = await fetchJson(`/api/vote-rationale?${params.toString()}`);
      setRationaleState((s) => ({ ...s, [key]: { loading: false, text: String(d?.rationaleText || "").trim() || "No rationale body text available.", image: String(d?.authorImageUrl || "").trim(), verify: d?.metadataVerification || null } }));
    } catch (e) {
      setRationaleState((s) => ({ ...s, [key]: { loading: false, error: e.message || "Failed to load rationale." } }));
    }
  }

  if (query.isLoading) {
    return (
      <main className="shell page p-detail" aria-busy="true">
        <Skeleton kind="text" width={160} />
        <div style={{ height: 12 }} />
        <Skeleton kind="title" width="70%" />
        <div style={{ height: 24 }} />
        <div className="grid grid--3"><Skeleton kind="card" count={3} /></div>
      </main>
    );
  }
  if (query.error || !action) {
    return (
      <main className="shell page p-detail">
        <Link to={withSnapshotParam("/actions", snapshotKey)} className="c-btn c-btn--ghost c-btn--sm"><IconArrowLeft size={16} /> All governance actions</Link>
        <div style={{ height: 16 }} />
        <EmptyState title={query.error?.status === 404 ? "Action not found in this snapshot." : "Could not load this action."}>{query.error?.message}</EmptyState>
      </main>
    );
  }

  const status = action.status;
  const isTreasury = String(action.governanceType || "").toLowerCase().includes("treasury");
  const treasuryAmountAda = isTreasury ? extractTreasuryAmountAda(action) : 0;
  const expiryEndUnix = action.expirationEpoch ? epochStartUnix(action.expirationEpoch + 1) : null;
  const msUntilExpiry = expiryEndUnix ? Math.max(0, expiryEndUnix * 1000 - nowMs) : null;
  const countdown = status === "Active" && msUntilExpiry !== null ? formatCountdown(msUntilExpiry) : null;
  const bodies = model ? [
    (Number(model.drepRequiredPct) > 0 || Number(action.voteStats?.drep?.total) > 0) && "drep",
    model.ccRequiredPct != null && "cc",
    model.spoRequiredPct != null && "spo"
  ].filter(Boolean) : [];
  const rationaleView = rationaleModal ? rationaleState[rationaleModal.key] || {} : null;

  const voteColumns = [
    { key: "role", label: "Body", compact: true, render: (r) => <RolePill role={r.voterRole} size="sm" /> },
    {
      key: "voter", label: "Voter", span: true,
      render: (r) => (
        <div>
          <Link to={withSnapshotParam(`/${r.role === "DRep" ? "dreps" : r.role === "SPO" ? "spos" : "committee"}/${encodeURIComponent(r.voterId)}`, snapshotKey)} className="c-table__primary">{r.voter}</Link>
          {r.voterId ? <span className="c-table__sub mono">{truncateMiddle(r.voterId, 14, 8)}</span> : null}
        </div>
      )
    },
    { key: "vote", label: "Vote", compact: true, render: (r) => r.vote ? <VotePill vote={r.vote} size="sm" /> : <span className="muted">—</span> },
    {
      key: "power", label: "Voting power", align: "right",
      render: (r) => r.votingPowerAda > 0 ? <span className="num">{formatAdaCompact(r.votingPowerAda)}</span> : r.role === "CC" ? <span className="muted">—</span> : <span className="muted" title="Voting power is 0 in the current epoch snapshot. New DRep registrations take 2 epochs to appear.">₳0</span>
    },
    { key: "epoch", label: "Epoch", align: "right", render: (r) => <span className="num">{r.votedEpoch || "—"}</span> },
    { key: "rationale", label: "Rationale", compact: true, render: (r) => (r.rationaleUrl || r.hasRationale) ? <Button size="sm" onClick={() => openRationale(r)}>View</Button> : <span className="muted">—</span> }
  ];

  return (
    <main className="shell page p-detail">
      <Link to={withSnapshotParam("/actions", snapshotKey)} className="c-btn c-btn--ghost c-btn--sm" style={{ marginBottom: 12 }}><IconArrowLeft size={16} /> All governance actions</Link>
      <SnapshotBanner snapshotKey={snapshotKey} latestEpoch={data?.meta?.latestEpoch} backTo={`/actions/${encodeURIComponent(id)}`} />
      <PageHeader
        eyebrow={<><span>{action.governanceType}</span>{status ? <StatusPill status={status} size="sm" /> : null}<MetaVerifyPill verification={metadata?.metadataVerification} /></>}
        title={doc.title || action.actionName || id}
        actions={<LivePill enabled={!snapshotKey} generatedAt={data?.meta?.generatedAt} />}
      >
        <div className="p-detail__meta">
          {isTreasury && treasuryAmountAda > 0 ? <Pill tone="info">{formatAda(treasuryAmountAda)} withdrawal</Pill> : null}
          {action.depositAda > 0 ? <Pill tone="neutral">Deposit {formatAda(action.depositAda)}</Pill> : null}
          {action.submittedEpoch ? <span className="small muted">Submitted epoch {action.submittedEpoch}{action.submittedEpoch ? ` · ${formatEpochDate(action.submittedEpoch)}` : ""}</span> : null}
          {action.expirationEpoch ? <span className="small muted">Expires epoch {action.expirationEpoch} · {formatEpochDate(action.expirationEpoch)}</span> : null}
          {countdown ? <Pill tone="warning">{countdown} remaining</Pill> : null}
          {action.ratifiedEpoch > 0 ? <span className="small muted">Ratified epoch {action.ratifiedEpoch}</span> : null}
          {action.enactedEpoch > 0 ? <span className="small muted">Enacted epoch {action.enactedEpoch}</span> : null}
          {action.expiredEpoch > 0 ? <span className="small muted">Expired epoch {action.expiredEpoch}</span> : null}
          {action.droppedEpoch > 0 ? <span className="small muted">Dropped epoch {action.droppedEpoch}</span> : null}
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <span className="c-hash break">{id}</span>
          <CopyButton value={id} />
          {action.txHash ? <a className="small" href={`https://cardanoscan.io/transaction/${action.txHash}`} target="_blank" rel="noreferrer">Transaction {shortHash(action.txHash, 6)} ↗</a> : null}
        </div>
      </PageHeader>

      <div className="stack--6">
        <DrepVotePanel proposalId={id} actionName={doc.title || action.actionName} status={status} votes={allVotes} />
        <LinkedSurveyCard proposalId={id} />

        {isTreasury && delivery && delivery.length > 0 ? (
          <Card className="p-detail__block" title="Delivery & execution" subtitle="On-chain funding administered for this withdrawal via the Intersect Administration API: how much has been drawn down against milestones." actions={<Button size="sm" to="/treasury/explorer">Treasury explorer →</Button>}>
            {delivery.some((d) => d.confidence !== "strong") ? <p className="tiny muted" style={{ marginBottom: 8 }}>Matches are inferred from amount and name; verify where marked “likely”.</p> : null}
            <div className="stack--2">
              {delivery.map((proj) => (
                <div key={proj.projectId} className="p-detail__delivery">
                  <div className="row">
                    <Link to={`/treasury/explorer/${encodeURIComponent(proj.projectId)}`} className="strong">{proj.name || proj.projectId}</Link>
                    <Pill size="sm" status={proj.status === "completed" ? "enacted" : proj.status === "active" ? "active" : "expired"}>{proj.status ? proj.status.charAt(0).toUpperCase() + proj.status.slice(1) : "—"}</Pill>
                    {proj.confidence !== "strong" ? <Pill size="sm" tone="warning">likely match</Pill> : null}
                  </div>
                  <div className="row row--4" style={{ flexWrap: "nowrap" }}>
                    <div style={{ flex: 1, minWidth: 120 }}><ProgressBar value={proj.drawdownPct} tone={proj.status === "paused" ? "warning" : "accent"} ariaLabel="Drawdown" /></div>
                    <span className="small muted num" style={{ whiteSpace: "nowrap" }}>{formatAda(proj.withdrawnAda)} / {formatAda(proj.allocatedAda)} ({proj.drawdownPct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {metadata?.hashMismatch ? <Alert tone="warning" title="Hash mismatch:">The metadata at the anchor URL does not match the on-chain hash. Content shown for reference only.</Alert> : null}

        <section>
          <div className="c-section-title" style={{ marginTop: 0 }}>
            <h2>Voting</h2>
            {model?.thresholdInfo?.parameterGroup ? <span className="small muted">Parameter group: <strong>{model.thresholdInfo.parameterGroup}</strong></span> : null}
          </div>
          {bodies.length === 0 ? <p className="muted">No vote data available.</p> : (
            <div className="grid grid--3 p-detail__bodies">
              {bodies.map((kind) => <VoteBody key={kind} kind={kind} model={model} voteStats={action.voteStats?.constitutional_committee} />)}
            </div>
          )}
        </section>

        <section>
          <Tabs ariaLabel="Action details" value={tab} onChange={setTab} tabs={[{ key: "votes", label: "Votes", count: allVotes.length }, { key: "payload", label: "Metadata" }]} />
          <TabPanel tabKey="votes" value={tab}>
            <div className="c-toolbar" style={{ marginBottom: 12 }}>
              <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Voting body">
                <option value="all">All bodies</option><option value="DRep">DReps</option><option value="CC">Constitutional Committee</option><option value="SPO">SPOs</option>
              </Select>
              <Select value={voteFilter} onChange={(e) => setVoteFilter(e.target.value)} aria-label="Vote">
                <option value="all">All votes</option><option value="yes">Yes</option><option value="no">No</option><option value="abstain">Abstain</option><option value="noconfidence">No confidence</option>
              </Select>
              <Select value={rationaleFilter} onChange={(e) => setRationaleFilter(e.target.value)} aria-label="Rationale">
                <option value="all">With or without rationale</option><option value="with">With rationale</option><option value="without">Without rationale</option>
              </Select>
              <Input className="c-toolbar__grow" value={voteSearch} onChange={(e) => setVoteSearch(e.target.value)} placeholder="Search voter, id, vote, epoch…" aria-label="Search votes" />
              <span className="small muted">Showing <b className="num">{filteredVotes.length}</b> of <b className="num">{allVotes.length}</b></span>
            </div>
            <DataTable columns={voteColumns} rows={filteredVotes} getRowKey={(r) => `${r.role}-${r.voterId}-${r.voteTxHash}`} emptyMessage={allVotes.length === 0 ? "No votes found for this proposal." : "No votes match the selected filters."} caption="Votes on this action" />
          </TabPanel>
          <TabPanel tabKey="payload" value={tab}>
            {doc.sections.length === 0 ? <p className="muted">No metadata body sections available.</p> : null}
            {doc.sections.map((section, i) => (
              <Disclosure key={`${id}-${section.key}`} title={section.title} defaultOpen={i === 0}>
                {section.type === "json" ? <pre>{JSON.stringify(section.content, null, 2)}</pre> : <SafeMarkdown>{section.content}</SafeMarkdown>}
              </Disclosure>
            ))}
            {doc.references.length > 0 ? (
              <Disclosure title="References">
                <ul className="c-prose" style={{ margin: 0 }}>
                  {doc.references.map((ref, i) => (
                    <li key={i}><a href={ref.uri} target="_blank" rel="noopener noreferrer">{ref.label !== ref.uri ? ref.label : ref.uri}</a>{ref.type && ref.type !== "Reference" && ref.type !== ref.label ? <span className="muted"> · {ref.type}</span> : null}</li>
                  ))}
                </ul>
              </Disclosure>
            ) : null}
            {doc.metadataUrl ? (
              <KeyValue items={[["Anchor URL", <a key="u" href={doc.metadataUrl} target="_blank" rel="noopener noreferrer" className="mono break">{doc.metadataUrl}</a>], doc.metadataHash && ["Anchor hash", <span key="h" className="mono break">{doc.metadataHash}</span>]]} />
            ) : null}
          </TabPanel>
        </section>
      </div>

      <Modal open={Boolean(rationaleModal)} onClose={() => setRationaleModal(null)} title={rationaleModal?.title} size="lg">
        {rationaleModal ? (
          <div className="stack">
            <p className="c-hash break">{id}</p>
            {rationaleView.loading ? <Skeleton kind="text" count={6} /> : rationaleView.error ? <Alert tone="danger">{rationaleView.error}</Alert> : (
              <div className="c-prose">
                {rationaleView.verify ? <MetaVerifyPill verification={rationaleView.verify} style={{ marginBottom: 12 }} /> : null}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{rationaleView.text || "No rationale body text available."}</ReactMarkdown>
                {rationaleView.image ? <figure style={{ margin: "16px 0 0" }}><figcaption className="tiny muted">Signature</figcaption><img src={rationaleView.image} alt="Author signature" style={{ maxHeight: 120 }} /></figure> : null}
              </div>
            )}
            {rationaleModal.item?.rationaleUrl ? <a className="small mono break" href={rationaleModal.item.rationaleUrl} target="_blank" rel="noreferrer">{rationaleModal.item.rationaleUrl}</a> : null}
          </div>
        ) : null}
      </Modal>
    </main>
  );
}
