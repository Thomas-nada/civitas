// One funded treasury project: allocation and drawdown, the governance
// action that funded it, milestones with evidence, activity and UTxOs.
import { Link, useParams } from "react-router-dom";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { useTreasuryMapping, useTreasuryProject } from "../api/queries";
import EventFeed from "../components/treasury/EventFeed";
import { Alert, Button, Card, DataTable, Disclosure, KeyValue, PageHeader, Pill, ProgressBar, Skeleton, StatGrid, StatTile } from "../ui";
import { IconArrowLeft } from "../ui/icons";
import { formatAda, formatAdaCompact, formatPct } from "../lib/governance/format";
import { csAddr, csTx, fmtDate, fmtDateTime, shortHash, statusTone } from "../lib/treasuryAdmin";

function milestoneState(m) {
  if (m.withdrawn) return { label: "Withdrawn", tone: "success" };
  if (m.paused) return { label: "Paused", tone: "warning" };
  if (m.completion) return { label: "Completed", tone: "info" };
  if (m.archived) return { label: "Archived", tone: "neutral" };
  return { label: "Pending", tone: "neutral" };
}

function Milestone({ m, index }) {
  const state = milestoneState(m);
  const title = (
    <span className="t-milestone__title">
      <span className="tiny muted num">#{m.order || index + 1}</span>
      <span className="t-milestone__label">{m.label || `Milestone ${m.order || index + 1}`}</span>
      <span className="small muted num">{formatAdaCompact(m.amountAda)}</span>
      <Pill size="sm" tone={state.tone}>{state.label}</Pill>
    </span>
  );
  return (
    <Disclosure title={title}>
      <div className="stack">
        {m.acceptanceCriteria ? <div><div className="caps muted" style={{ marginBottom: 4 }}>Acceptance criteria</div><p className="small" style={{ whiteSpace: "pre-wrap", margin: 0 }}>{m.acceptanceCriteria}</p></div> : null}
        {m.description ? <div><div className="caps muted" style={{ marginBottom: 4 }}>Description</div><p className="small" style={{ whiteSpace: "pre-wrap", margin: 0 }}>{m.description}</p></div> : null}
        <KeyValue items={[
          ["Amount", formatAda(m.amountAda)],
          m.timeLimitIso && ["Time limit", fmtDate(m.timeLimitIso)],
          ["Evidence", m.evidenceProvided ? "Provided" : "—"],
          m.pauseHistory > 0 && ["Pauses", <span key="p" style={{ color: "var(--color-warning)" }}>{m.pauseHistory}</span>],
          m.completion && ["Completed", <span key="c">{fmtDateTime(m.completion.timeIso)} · <a className="mono" href={csTx(m.completion.txHash)} target="_blank" rel="noreferrer">{shortHash(m.completion.txHash)}</a>{m.completion.description ? <span className="muted"> · {m.completion.description}</span> : null}</span>],
          m.withdrawal && ["Withdrawn", <span key="w">{formatAda(m.withdrawal.amountAda)} · {fmtDateTime(m.withdrawal.timeIso)} · <a className="mono" href={csTx(m.withdrawal.txHash)} target="_blank" rel="noreferrer">{shortHash(m.withdrawal.txHash)}</a></span>]
        ]} />
        {m.completion?.evidence?.length > 0 ? (
          <div><div className="caps muted" style={{ marginBottom: 4 }}>Evidence</div><ul className="c-prose" style={{ margin: 0 }}>{m.completion.evidence.map((ev, i) => <li key={i} className="small">{ev.url ? <a href={ev.url} target="_blank" rel="noreferrer">{ev.label || ev.url}</a> : (ev.label || "—")}</li>)}</ul></div>
        ) : null}
      </div>
    </Disclosure>
  );
}

export default function TreasuryProjectPage() {
  const { projectId } = useParams();
  const query = useTreasuryProject(projectId);
  const mapping = useTreasuryMapping();
  const p = query.data?.available ? query.data : null;
  const match = mapping.data?.projectToProposal?.[projectId] || null;
  useSeoMeta({ title: p?.name ? `${p.name} — Treasury` : "Treasury project", description: "Funded Cardano treasury project detail: milestones, evidence, and on-chain activity." });

  if (query.isLoading) return <main className="shell page p-treasury" aria-busy="true"><Skeleton kind="text" width={160} /><div style={{ height: 12 }} /><Skeleton kind="title" width="50%" /><div style={{ height: 24 }} /><div className="c-stats"><Skeleton kind="card" count={4} /></div></main>;
  if (!p) {
    return (
      <main className="shell page p-treasury">
        <Link to="/treasury/explorer" className="c-btn c-btn--ghost c-btn--sm"><IconArrowLeft size={16} /> Treasury explorer</Link>
        <div style={{ height: 16 }} />
        <Alert tone="warning" title="Project not found.">{query.data?.error || query.error?.message || "This project is not in the administration record."}</Alert>
      </main>
    );
  }

  const undrawn = Math.max(0, p.allocatedAda - p.withdrawnAda);
  const utxoColumns = [
    { key: "txHash", label: "Transaction", span: true, render: (u) => <a className="mono small" href={csTx(u.txHash)} target="_blank" rel="noreferrer">{shortHash(u.txHash, 12)}</a> },
    { key: "outputIndex", label: "Index", align: "right", render: (u) => <span className="num">{u.outputIndex ?? "—"}</span> },
    { key: "amountAda", label: "Amount", align: "right", render: (u) => <span className="num">{formatAda(u.amountAda)}</span> }
  ];

  return (
    <main className="shell page p-treasury">
      <Link to="/treasury/explorer" className="c-btn c-btn--ghost c-btn--sm" style={{ marginBottom: 12 }}><IconArrowLeft size={16} /> Treasury explorer</Link>
      <PageHeader eyebrow={<><span>Funded project</span><Pill size="sm" tone={statusTone(p.status)}>{String(p.status || "").replace(/\b\w/g, (m) => m.toUpperCase())}</Pill></>} title={p.name || "Unnamed project"} lead={p.description || null}>
        <p className="c-hash break" style={{ marginTop: 8 }}>{p.projectId}</p>
      </PageHeader>

      <div className="stack--6">
        {match ? (
          <Alert tone="info">
            Funded by governance action <Link to={`/actions/${encodeURIComponent(match.proposalId)}`} className="strong">{match.proposalName || match.proposalId}</Link>{" "}
            <Pill size="sm" tone={match.confidence === "strong" ? "success" : "warning"}>{match.confidence === "strong" ? "matched" : "likely match"}</Pill>
            {match.outcome ? <span className="muted"> · {match.outcome}</span> : null}
          </Alert>
        ) : null}

        <StatGrid>
          <StatTile label="Allocated" value={formatAdaCompact(p.allocatedAda)} hint={formatAda(p.allocatedAda)} />
          <StatTile label="Withdrawn" value={formatAdaCompact(p.withdrawnAda)} hint={`${formatPct(p.drawdownPct, 1)} drawn`} tone="accent" />
          <StatTile label="Undrawn" value={formatAdaCompact(undrawn)} hint="remaining" />
          <StatTile label="Contract balance" value={formatAdaCompact(p.balanceAda)} hint="on-chain now" />
          <StatTile label="Funded" value={fmtDate(p.fundedIso)} hint={`${p.eventCount} events`} />
        </StatGrid>

        <Card title="Drawdown" subtitle={`${formatAdaCompact(p.withdrawnAda)} of ${formatAdaCompact(p.allocatedAda)} withdrawn.`}>
          <ProgressBar value={p.drawdownPct} tone="yes" large ariaLabel="Drawdown" />
          <div style={{ marginTop: 16 }}>
            <KeyValue items={[
              p.fundTxHash && ["Fund transaction", <a key="f" className="mono" href={csTx(p.fundTxHash)} target="_blank" rel="noreferrer">{shortHash(p.fundTxHash, 12)}</a>],
              p.contractAddress && ["Contract address", <a key="c" className="mono" href={csAddr(p.contractAddress)} target="_blank" rel="noreferrer">{shortHash(p.contractAddress, 12)}</a>],
              p.vendorAddress && ["Vendor address", <a key="v" className="mono" href={csAddr(p.vendorAddress)} target="_blank" rel="noreferrer">{shortHash(p.vendorAddress, 12)}</a>]
            ]} />
          </div>
        </Card>

        <Card title={<>Milestones <span className="muted" style={{ fontWeight: 400 }}>({p.milestones.length})</span></>}>
          {p.milestones.length === 0 ? <p className="muted">No milestones recorded.</p> : p.milestones.map((m, i) => <Milestone key={m.milestoneId || i} m={m} index={i} />)}
        </Card>

        <Card title={<>On-chain activity <span className="muted" style={{ fontWeight: 400 }}>({p.events.length})</span></>}>
          <EventFeed events={p.events} max={500} detailed linkProjects={false} emptyMessage="No events recorded." />
        </Card>

        {p.utxos?.length > 0 ? (
          <Card title={<>Current UTxOs <span className="muted" style={{ fontWeight: 400 }}>({p.utxos.length})</span></>}>
            <DataTable columns={utxoColumns} rows={p.utxos} getRowKey={(u) => `${u.txHash}-${u.outputIndex}`} caption="Current UTxOs" />
          </Card>
        ) : null}
        <div><Button to="/treasury/explorer">← Back to the explorer</Button></div>
      </div>
    </main>
  );
}
