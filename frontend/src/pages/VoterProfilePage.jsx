// One DRep, stake pool or committee member: identity and profile, scores,
// voting record (voted / missed / every action), delegation and delegators.
// Data: /api/v1/actors/:type/:id for the actor and its full votes, the packed
// /api/v1/actors/:type list (shared with the dashboard) for the scoring
// context, and the live DRep lookup for power and metadata verification.
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { useSnapshotKey, withSnapshotParam } from "../hooks/useSnapshotKey";
import { useActor, useActors, useDrepDelegators, useDrepLive } from "../api/queries";
import { proposalInfoFromIndex } from "../api/unpack";
import { LivePill, SnapshotBanner } from "../components/LiveStatus";
import MetaVerifyPill from "../components/MetaVerifyPill";
import RationaleModal from "../components/RationaleModal";
import DelegateButton from "../components/delegation/DelegateButton";
import {
  Alert, Avatar, Button, Card, CopyButton, DataTable, EmptyState, KeyValue, Menu, MenuItem, Modal, PageHeader, Pill, RolePill, Segmented, Skeleton, StatGrid, StatTile, StatusPill, Tooltip, VotePill
} from "../ui";
import { IconArrowLeft, IconChevronDown, IconExternal } from "../ui/icons";
import { copyText, currentEpochFromNow, formatAda, formatAdaCompact, formatDate, formatNumber, formatPct, truncateMiddle } from "../lib/governance/format";
import {
  actorActionRows, formatResponseHours, isSpoAlwaysAbstainStatus, mergeSpecialDreps, metricHelp, resolveVoteResponseHours, scoreActors,
  scoreCommitteeRationaleQuality, voteLabelForActor, votingPowerTotals
} from "../lib/governance/scoring";

const ROLE_BY_TYPE = { drep: "drep", spo: "stake_pool", committee: "constitutional_committee" };
const LIST_PATH = { drep: "/dreps", spo: "/spos", committee: "/committee" };
const LABEL = { drep: "DRep", spo: "Stake pool", committee: "Committee member" };
const VOTE_COLORS = { yes: "#3ee6b8", no: "#ff6b7a", abstain: "#9fb3c8", noConfidence: "#b794f6" };

function epochFromUnix(unix) {
  const t = Number(unix || 0);
  if (t <= 0) return null;
  return currentEpochFromNow(t * 1000);
}

function linkKind(ref) {
  const text = `${ref?.label || ""} ${ref?.uri || ""}`.toLowerCase();
  if (text.includes("x.com") || text.includes("twitter")) return "X";
  if (text.includes("linktr.ee") || text.includes("linktree")) return "Linktree";
  if (text.includes("github.com")) return "GitHub";
  if (text.includes("linkedin.com")) return "LinkedIn";
  if (text.includes("t.me") || text.includes("telegram")) return "Telegram";
  if (text.includes("discord")) return "Discord";
  if (text.includes("youtube.com") || text.includes("youtu.be")) return "YouTube";
  if (text.includes("medium.com")) return "Medium";
  return "Web";
}

function paragraphs(input) {
  const raw = String(input || "").trim();
  if (!raw) return [];
  const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  const sentences = raw.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length <= 2) return [raw];
  const chunks = [];
  for (let i = 0; i < sentences.length; i += 2) chunks.push(sentences.slice(i, i + 2).join(" "));
  return chunks;
}

function cardanoscanLink(actorType, actor) {
  if (actorType === "drep") return `https://cardanoscan.io/drep/${encodeURIComponent(actor.id)}`;
  if (actorType === "spo") return `https://cardanoscan.io/pool/${encodeURIComponent(actor.id)}`;
  if (actor.coldCredential) return `https://cardanoscan.io/ccmember/${encodeURIComponent(actor.coldCredential)}`;
  if (actor.hotCredential) return `https://cardanoscan.io/cchot/${encodeURIComponent(actor.hotCredential)}`;
  return `https://cardanoscan.io/search?query=${encodeURIComponent(actor.id)}`;
}

function titleCase(value, fallback) {
  return String(value || fallback || "").replace(/\b\w/g, (m) => m.toUpperCase());
}

function ScoreTile({ label, value, hint, help }) {
  return (
    <div className="c-stat">
      <span className="c-stat__label">{label}</span>
      <span className="c-stat__value row" style={{ gap: 8 }}>{value}{help ? <Tooltip label={`How ${label.toLowerCase()} is calculated`}>{help.map((line, i) => <span key={i} style={{ display: "block", marginTop: i ? 4 : 0 }}>{line}</span>)}</Tooltip> : null}</span>
      {hint ? <span className="c-stat__hint">{hint}</span> : null}
    </div>
  );
}

function DelegatorsCard({ drepId }) {
  const query = useDrepDelegators(drepId);
  const [shown, setShown] = useState(25);
  const data = query.data;
  return (
    <Card title="Delegators" subtitle={data ? `${formatNumber(data.delegatorCount)} stake key${data.delegatorCount === 1 ? "" : "s"} · ${formatAda(data.totalAda)} delegated${data.truncated ? " (top 5,000 by stake)" : ""}` : "Stake keys currently delegating to this DRep."}>
      {query.isLoading ? <Skeleton kind="row" count={4} /> : query.error ? <Alert tone="warning">{query.error.message}</Alert> : !data || data.delegatorCount === 0 ? <p className="muted">No current delegators found for this DRep.</p> : (
        <>
          <DataTable
            dense cards={false}
            columns={[
              { key: "address", label: "Stake address", render: (d) => <a className="mono small" href={`https://cardanoscan.io/stakeKey/${encodeURIComponent(d.address)}`} target="_blank" rel="noreferrer">{truncateMiddle(d.address, 16, 8)}</a> },
              { key: "amountAda", label: "Delegated", align: "right", render: (d) => <span className="num">{formatAda(d.amountAda)}</span> }
            ]}
            rows={data.delegators.slice(0, shown)}
            getRowKey={(d) => d.address}
            caption="Delegators"
          />
          {data.delegators.length > shown ? <div className="row" style={{ marginTop: 10 }}><Button size="sm" onClick={() => setShown((n) => n + 50)}>Show more</Button><span className="tiny muted">{shown} of {data.delegators.length}</span></div> : null}
        </>
      )}
    </Card>
  );
}

export default function VoterProfilePage({ actorType }) {
  const { actorId } = useParams();
  const id = decodeURIComponent(String(actorId || "")).trim();
  const snapshotKey = useSnapshotKey();
  const isDrep = actorType === "drep";
  const isSpo = actorType === "spo";
  const isCommittee = actorType === "committee";

  const detail = useActor(actorType, id, snapshotKey);
  const list = useActors(actorType, snapshotKey);
  // Live DRep lookup: current power for DReps missing from the snapshot (or
  // registered mid-epoch with 0 power) and the metadata verification badge.
  const liveQuery = useDrepLive(id, { enabled: isDrep && !snapshotKey });
  const live = liveQuery.data?.id ? liveQuery.data : null;
  const liveLoading = liveQuery.isLoading;
  const [view, setView] = useState("voted");
  const [rationale, setRationale] = useState(null);
  const [imageOpen, setImageOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState("");


  const meta = detail.data?.meta || list.meta || null;
  const proposalInfo = useMemo(() => proposalInfoFromIndex(list.unpacked?.proposals || []), [list.unpacked]);
  const listActors = useMemo(() => {
    const rows = list.unpacked?.actors || [];
    return isDrep ? mergeSpecialDreps(rows, meta?.specialDreps) : rows;
  }, [list.unpacked, isDrep, meta]);
  const power = useMemo(() => votingPowerTotals(listActors, actorType), [listActors, actorType]);

  const actor = useMemo(() => {
    const fromSnapshot = detail.data?.actor || null;
    if (!fromSnapshot) return live ? { ...live, votes: [] } : null;
    if (live && Number(fromSnapshot.votingPowerAda || 0) === 0 && Number(live.votingPowerAda || 0) > 0) return { ...fromSnapshot, votingPowerAda: live.votingPowerAda };
    return fromSnapshot;
  }, [detail.data, live]);

  const scored = useMemo(() => {
    if (!actor) return null;
    const [row] = scoreActors([actor], {
      actorType, proposalInfo, include: { attendance: true, transparency: !isCommittee, alignment: true, responsiveness: !isCommittee, delegationRisk: isDrep },
      drepParticipationStartEpoch: meta?.drepParticipationStartEpoch, powerTotals: power
    });
    return row;
  }, [actor, actorType, proposalInfo, isCommittee, isDrep, meta, power]);

  const name = actor?.name || actor?.profile?.name || "";
  const displayName = name || (actor?.id ? truncateMiddle(actor.id, 14, 6) : "");
  useSeoMeta({
    title: displayName ? `${displayName} — ${LABEL[actorType]} profile` : `${LABEL[actorType]} profile`,
    description: displayName ? `Voting history, participation rate, accountability score, and rationale coverage for ${LABEL[actorType]} ${displayName} on Cardano.` : `Cardano ${LABEL[actorType]} voting history, accountability score, and rationale coverage.`
  });

  const voteRows = useMemo(() => (actor?.votes || []).map((vote) => {
    const info = proposalInfo[vote.proposalId] || {};
    const votedEpoch = epochFromUnix(vote.votedAtUnix) ?? (info.submittedEpoch || null);
    return {
      ...vote,
      actionName: info.actionName || vote.proposalId,
      governanceType: info.governanceType || "Unknown",
      outcome: vote.outcome || info.outcome || "Unknown",
      votedEpoch,
      responseHours: resolveVoteResponseHours(vote, proposalInfo),
      rationaleScore: isCommittee ? scoreCommitteeRationaleQuality(vote) : null,
      hasRationale: Boolean(vote.hasRationale) || Boolean(vote.rationaleUrl)
    };
  }), [actor, proposalInfo, isCommittee]);

  const byEpoch = useMemo(() => {
    const map = new Map();
    for (const row of voteRows) {
      const epoch = Number(row.votedEpoch || 0);
      if (epoch <= 0) continue;
      if (!map.has(epoch)) map.set(epoch, { epoch, yes: 0, no: 0, abstain: 0, noConfidence: 0 });
      const b = map.get(epoch);
      const v = String(row.vote || "").toLowerCase();
      if (v === "yes") b.yes += 1; else if (v === "no") b.no += 1; else if (v === "abstain") b.abstain += 1; else if (v.includes("confidence")) b.noConfidence += 1;
    }
    return Array.from(map.values()).sort((a, b) => a.epoch - b.epoch);
  }, [voteRows]);

  const actionRows = useMemo(() => {
    if (!actor) return [];
    const all = actorActionRows(actor, { actorType, proposalInfo, drepParticipationStartEpoch: meta?.drepParticipationStartEpoch });
    if (view === "missed") return all.filter((r) => !r.vote && r.eligible);
    if (view === "all") return all;
    return all.filter((r) => r.vote);
  }, [actor, actorType, proposalInfo, meta, view]);
  const voteByProposal = useMemo(() => new Map(voteRows.map((v) => [v.proposalId, v])), [voteRows]);

  const listPath = withSnapshotParam(LIST_PATH[actorType], snapshotKey);
  const loading = detail.isLoading || list.isLoading || (!detail.data?.actor && liveLoading);
  const shareUrl = () => `${window.location.origin}/delegate/${encodeURIComponent(actor?.id || id)}`;
  async function share(kind) {
    const ok = await copyText(kind === "link" ? shareUrl() : `I delegate my Cardano governance voting power to ${name || id} on Civitas: ${shareUrl()}`);
    if (ok) { setShareCopied(kind); setTimeout(() => setShareCopied(""), 2000); }
  }

  if (loading) {
    return (
      <main className="shell page p-profile" aria-busy="true">
        <Skeleton kind="text" width={160} /><div style={{ height: 12 }} /><Skeleton kind="title" width="50%" /><div style={{ height: 24 }} />
        <div className="c-stats"><Skeleton kind="card" count={4} /></div>
      </main>
    );
  }
  if (!actor) {
    return (
      <main className="shell page p-profile">
        <Link to={listPath} className="c-btn c-btn--ghost c-btn--sm"><IconArrowLeft size={16} /> All {LABEL[actorType].toLowerCase()}s</Link>
        <div style={{ height: 16 }} />
        <EmptyState title={`No ${LABEL[actorType].toLowerCase()} found for this ID.`} action={<Button to={listPath}>Back to the list</Button>}>
          <span className="mono break">{id}</span>{isDrep ? <><br />This DRep has not voted on any tracked governance action yet, or is not registered.</> : null}
        </EmptyState>
      </main>
    );
  }

  const columns = [
    {
      key: "action", label: "Action", span: true,
      render: (r) => (
        <div className="p-profile__action">
          <Link to={withSnapshotParam(`/actions/${encodeURIComponent(r.proposalId)}`, snapshotKey)} className="c-table__primary">{r.actionName}</Link>
          <span className="c-table__sub">{r.governanceType} · submitted {r.submittedEpoch ? `epoch ${r.submittedEpoch}` : "—"}{r.submittedAtUnix ? ` · ${formatDate(r.submittedAtUnix)}` : ""}</span>
        </div>
      )
    },
    { key: "vote", label: "Vote", compact: true, render: (r) => r.vote ? <VotePill vote={voteLabelForActor(r.vote.vote, actorType)} status={r.vote.vote} size="sm" /> : <span className="muted small">{r.eligible ? "Not voted" : "Not eligible"}</span> },
    { key: "outcome", label: "Outcome", compact: true, render: (r) => <StatusPill status={r.status || r.outcome} size="sm" /> },
    { key: "epoch", label: "Voted", align: "right", render: (r) => { const v = r.vote ? voteByProposal.get(r.proposalId) : null; return <span className="num small">{v?.votedEpoch ? `E${v.votedEpoch}` : "—"}</span>; } },
    ...(!isCommittee ? [{ key: "response", label: "Response", align: "right", render: (r) => { const v = r.vote ? voteByProposal.get(r.proposalId) : null; return <span className="num small">{v ? formatResponseHours(v.responseHours) : "—"}</span>; } }] : []),
    ...(isCommittee ? [{ key: "quality", label: "Rationale quality", align: "right", render: (r) => { const v = r.vote ? voteByProposal.get(r.proposalId) : null; return <span className="num small">{v && Number.isFinite(v.rationaleScore) ? `${Math.round(v.rationaleScore)}` : "—"}</span>; } }] : []),
    {
      key: "rationale", label: "Rationale", compact: true,
      render: (r) => {
        const v = r.vote ? voteByProposal.get(r.proposalId) : null;
        const has = v && (v.hasRationale || v.rationaleUrl);
        const canOpen = has || (v && !isSpo);
        return canOpen ? <Button size="sm" onClick={() => setRationale({ proposalId: r.proposalId, voterId: actor.id, voterRole: ROLE_BY_TYPE[actorType], voteTxHash: v.voteTxHash, rationaleUrl: v.rationaleUrl, title: r.actionName, subtitle: r.proposalId })}>View</Button> : <span className="muted">—</span>;
      }
    }
  ];

  const status = isCommittee ? titleCase(actor.status, "expired") : isSpo ? titleCase(actor.status, "registered") : titleCase(actor.status, "unknown");
  const profile = actor.profile || {};
  const imageUrl = profile.imageUrl || "";
  const references = Array.isArray(profile.references) ? profile.references.slice(0, 12) : [];

  return (
    <main className="shell page p-profile">
      <Link to={listPath} className="c-btn c-btn--ghost c-btn--sm" style={{ marginBottom: 12 }}><IconArrowLeft size={16} /> All {isDrep ? "DReps" : isSpo ? "stake pools" : "committee members"}</Link>
      <SnapshotBanner snapshotKey={snapshotKey} latestEpoch={meta?.latestEpoch} backTo={`${LIST_PATH[actorType]}/${encodeURIComponent(id)}`} />
      <PageHeader
        eyebrow={<><RolePill role={ROLE_BY_TYPE[actorType]} size="sm" />{status ? <StatusPill status={status} size="sm" /> : null}{isSpo && isSpoAlwaysAbstainStatus(actor.delegationStatus) ? <Pill tone="success" size="sm">{actor.delegationStatus}</Pill> : null}{isDrep ? <MetaVerifyPill verification={live?.metadataVerification} /> : null}</>}
        title={<span className="p-profile__title">{imageUrl ? <button type="button" className="p-profile__avatar-btn" onClick={() => setImageOpen(true)} aria-label="Open profile image"><Avatar src={imageUrl} name={name} size="lg" /></button> : <Avatar name={name} size="lg" />}<span>{name || (isDrep ? "Unnamed DRep" : isSpo ? "Unnamed pool" : actor.id)}</span></span>}
        actions={<LivePill enabled={!snapshotKey} generatedAt={meta?.generatedAt} />}
      >
        <div className="row" style={{ marginTop: 10 }}>
          <span className="c-hash break">{actor.id}</span>
          <CopyButton value={actor.id} label={`Copy ${LABEL[actorType]} id`} />
          <a className="small p-profile__ext" href={cardanoscanLink(actorType, actor)} target="_blank" rel="noreferrer">Cardanoscan <IconExternal size={12} /></a>
        </div>
      </PageHeader>

      <div className="stack--6">
        <StatGrid>
          <ScoreTile label="Votes cast" value={formatNumber(scored?.cast ?? voteRows.length)} hint={scored ? `of ${scored.totalEligibleVotes} eligible actions` : null} />
          <ScoreTile label="Attendance" value={formatPct(scored?.attendance, 1)} help={scored ? metricHelp.attendance(scored) : null} />
          <ScoreTile label="Score" value={scored ? scored.accountability : "—"} hint="accountability" help={scored ? metricHelp.accountability(scored, actorType, { attendance: true, transparency: !isCommittee, alignment: true, responsiveness: !isCommittee, delegationRisk: isDrep }) : null} />
          {!isCommittee ? <ScoreTile label="Transparency" value={formatPct(scored?.transparencyScore, 1)} help={scored ? metricHelp.transparency(scored, false) : null} /> : null}
          {!isCommittee ? <ScoreTile label="Alignment" value={formatPct(scored?.consistency, 1)} help={scored ? metricHelp.consistency(scored) : null} /> : <ScoreTile label="Rationale quality" value={formatPct(scored?.consistency, 0)} help={scored ? metricHelp.rationaleQuality(scored) : null} />}
          {!isCommittee ? <ScoreTile label="Avg response" value={formatResponseHours(scored?.avgResponseHours)} help={scored ? metricHelp.responsiveness(scored) : null} /> : null}
          {!isCommittee ? <ScoreTile label="Voting power" value={formatAdaCompact(actor.votingPowerAda)} hint={scored ? `${formatPct(scored.votingPowerPctTotal, 2)} of total · ${formatPct(scored.votingPowerPctActive, 2)} of active` : null} /> : null}
          {isDrep && scored ? <ScoreTile label="Delegation risk" value={<Pill tone={scored.delegationRiskLabel === "High" ? "danger" : scored.delegationRiskLabel === "Medium" ? "warning" : "success"}>{scored.delegationRiskLabel} · {scored.delegationRiskScore}%</Pill>} help={metricHelp.delegationRisk(scored)} /> : null}
        </StatGrid>

        <div className="p-profile__columns">
          <div className="stack">
            {isDrep ? (
              <Card accent title="Delegate" subtitle="Delegate your voting power to this DRep from the connected wallet, or share a one-click delegate link." actions={
                <Menu align="right" label="Share" trigger={({ props }) => <Button size="sm" {...props}>{shareCopied ? "Copied!" : "Share"} <IconChevronDown size={14} /></Button>}>
                  {({ close }) => (<>
                    <MenuItem close={close} onClick={() => share("link")}>Copy delegate link</MenuItem>
                    <MenuItem close={close} onClick={() => share("text")}>Copy a share post</MenuItem>
                    <MenuItem close={close} to={`/delegate/${encodeURIComponent(actor.id)}`}>Open the delegate page</MenuItem>
                  </>)}
                </Menu>
              }>
                <DelegateButton drepId={actor.id} riskLabel={scored?.delegationRiskLabel} activeSharePct={scored?.votingPowerPctActive} />
              </Card>
            ) : null}

            <Card title="Details">
              <KeyValue items={[
                [isDrep ? "DRep ID" : isSpo ? "Pool ID" : "Member ID", <a key="id" className="mono break" href={cardanoscanLink(actorType, actor)} target="_blank" rel="noreferrer">{actor.id}</a>],
                ["Status", status],
                !isCommittee && ["Voting power", `${formatAda(actor.votingPowerAda)}`],
                isDrep && actor.activeEpoch && ["Registered", `Epoch ${actor.activeEpoch}`],
                isDrep && actor.lastActiveEpoch && ["Last active", `Epoch ${actor.lastActiveEpoch}`],
                isDrep && actor.hasScript && ["Credential", "Script"],
                isSpo && actor.delegationStatus && ["Delegation posture", actor.delegationStatus],
                isSpo && actor.delegatedDrepLiteralRaw && ["Delegated DRep", <span key="d" className="mono break">{actor.delegatedDrepLiteralRaw}</span>],
                isSpo && actor.homepage && ["Homepage", <a key="h" className="break" href={actor.homepage} target="_blank" rel="noreferrer">{actor.homepage}</a>],
                isCommittee && ["Term", `${scored?.seatStartEpoch ? `Epoch ${scored.seatStartEpoch}` : "Unknown"} → ${scored?.expirationEpoch ? `Epoch ${scored.expirationEpoch}` : "Unknown"}`],
                isCommittee && actor.hotCredential && ["Hot credential", <a key="hot" className="mono break" href={`https://cardanoscan.io/cchot/${encodeURIComponent(actor.hotCredential)}`} target="_blank" rel="noreferrer">{actor.hotCredential}</a>],
                isCommittee && actor.coldCredential && ["Cold credential", <a key="cold" className="mono break" href={`https://cardanoscan.io/ccmember/${encodeURIComponent(actor.coldCredential)}`} target="_blank" rel="noreferrer">{actor.coldCredential}</a>],
                profile.email && ["Email", <a key="e" href={`mailto:${profile.email}`}>{profile.email}</a>]
              ]} />
              {references.length > 0 ? (
                <div className="p-profile__links">
                  {references.map((ref) => <a key={ref.uri} className="c-chip" href={ref.uri} target="_blank" rel="noreferrer"><span className="muted">{linkKind(ref)}</span> {ref.label && ref.label !== ref.uri ? ref.label : truncateMiddle(ref.uri.replace(/^https?:\/\//, ""), 18, 8)}</a>)}
                </div>
              ) : null}
            </Card>

            {isDrep && !snapshotKey ? <DelegatorsCard drepId={actor.id} /> : null}
          </div>

          <div className="stack">
            {isDrep && (profile.bio || profile.motivations || profile.objectives || profile.qualifications) ? (
              <Card title="Profile" subtitle="From the DRep's CIP-119 metadata.">
                <div className="c-prose">
                  {[["Bio", profile.bio], ["Motivations", profile.motivations], ["Objectives", profile.objectives], ["Qualifications", profile.qualifications]].filter(([, text]) => text).map(([heading, text], i) => (
                    <section key={heading}>
                      <h3 style={{ marginTop: i ? 16 : 0 }}>{heading}</h3>
                      {paragraphs(text).map((p, j) => <p key={j}>{p}</p>)}
                    </section>
                  ))}
                </div>
              </Card>
            ) : null}

            {byEpoch.length > 0 ? (
              <Card title="Votes by epoch">
                <div className="p-profile__chart">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={byEpoch} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="epoch" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <ChartTooltip cursor={{ fill: "var(--color-surface-2)" }} contentStyle={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-line-strong)", borderRadius: 8, color: "var(--color-text)", fontSize: 12 }} itemStyle={{ color: "var(--color-text)" }} labelFormatter={(e) => `Epoch ${e}`} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="yes" stackId="a" fill={VOTE_COLORS.yes} name={isCommittee ? "Constitutional" : "Yes"} />
                      <Bar dataKey="no" stackId="a" fill={VOTE_COLORS.no} name={isCommittee ? "Unconstitutional" : "No"} />
                      <Bar dataKey="abstain" stackId="a" fill={VOTE_COLORS.abstain} name="Abstain" />
                      {!isCommittee ? <Bar dataKey="noConfidence" stackId="a" fill={VOTE_COLORS.noConfidence} name="No confidence" /> : null}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            ) : null}
          </div>
        </div>

        <section>
          <div className="c-section-title">
            <h2>Voting record</h2>
            <Segmented ariaLabel="Voting record view" value={view} onChange={setView} options={[{ value: "voted", label: `Voted (${voteRows.length})` }, { value: "missed", label: "Missed" }, { value: "all", label: "All actions" }]} />
          </div>
          <DataTable columns={columns} rows={actionRows} getRowKey={(r) => r.proposalId} emptyMessage={view === "missed" ? "No missed actions in scope." : view === "voted" ? "No votes recorded yet." : "No governance actions."} caption="Voting record" />
        </section>
      </div>

      <RationaleModal item={rationale} onClose={() => setRationale(null)} />
      <Modal open={Boolean(imageOpen && imageUrl)} onClose={() => setImageOpen(false)} title={name || "Profile image"}>
        <img src={imageUrl} alt={`${name || actor.id} profile`} style={{ maxWidth: "100%", maxHeight: "70vh", display: "block", margin: "0 auto", borderRadius: 12 }} />
      </Modal>
    </main>
  );
}
