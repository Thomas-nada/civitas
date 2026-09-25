// Treasury overview: net change limit (NCL) usage for the selected window,
// spending pace, enacted withdrawals, the post-approval delivery record
// from the Intersect Administration API, and a what-if scenario over the
// ratified and active withdrawal proposals.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { useTreasury, useTreasuryAdmin } from "../api/queries";
import { LivePill } from "../components/LiveStatus";
import EventFeed from "../components/treasury/EventFeed";
import ProjectsTable from "../components/treasury/ProjectsTable";
import { Alert, Button, Card, Checkbox, Chip, DataTable, Legend, PageHeader, Pill, ProgressBar, Segmented, Skeleton, StatGrid, StatTile } from "../ui";
import { formatAda, formatAdaCompact, formatPct } from "../lib/governance/format";
import { CHART, axisTick, tooltipProps } from "../lib/charts";
import { ADMIN_EVENT_META, fmtDate } from "../lib/treasuryAdmin";

function usageTone(pct, over) {
  return over ? "danger" : pct >= 90 ? "warning" : "success";
}

/* Post-approval delivery (Intersect admin API) ---------------------------- */
function DeliverySection({ admin }) {
  const [status, setStatus] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const undrawn = Math.max(0, admin.allocatedAda - admin.withdrawnAda);
  const ms = admin.milestones || {};
  const msDone = (ms.completed || 0) + (ms.withdrawn || 0);
  const msTotal = ms.total || 0;
  const filtered = (admin.projects || []).filter((p) => status === "all" || p.status === status);
  const shown = showAll ? filtered : filtered.slice(0, 12);
  const seg = (n) => (msTotal > 0 ? (Number(n || 0) / msTotal) * 100 : 0);
  const eventEntries = ["complete", "withdraw", "pause", "resume", "disburse", "fund", "modify", "initialize"].filter((k) => admin.eventsByType?.[k]).map((k) => [k, admin.eventsByType[k]]);

  return (
    <Card title="Delivery after approval" subtitle={<>What has happened to approved withdrawals since enactment: how much has been drawn down against milestones, and which projects have stalled. Live data via the Intersect Administration API{admin.syncedBlock ? `, synced to block ${Number(admin.syncedBlock).toLocaleString()}` : ""}{admin.syncedAt ? ` (${fmtDate(admin.syncedAt)})` : ""}.{admin.stale ? " Showing the last cached snapshot." : ""}</>} actions={<Button size="sm" to="/treasury/explorer">Full explorer →</Button>}>
      <div className="stack">
        <StatGrid>
          <StatTile label="Allocated" value={`₳${formatAdaCompact(admin.allocatedAda).slice(1)}`} hint={`${admin.projectCount} funded projects`} />
          <StatTile label="Drawn down" value={formatAdaCompact(admin.withdrawnAda)} hint={`${formatPct(admin.drawdownPct, 1)} of allocated`} tone="accent" />
          <StatTile label="Still locked" value={formatAdaCompact(undrawn)} hint="approved but undrawn" />
          {admin.treasuryBalanceAda != null ? <StatTile label="Treasury contract" value={formatAdaCompact(admin.treasuryBalanceAda)} hint="current on-chain balance" /> : null}
          <StatTile label="Milestones" value={<>{msDone}<span className="muted" style={{ fontSize: "0.7em" }}> / {msTotal}</span></>} hint={`${ms.pending || 0} pending · ${ms.paused || 0} paused`} />
          <StatTile label="Paused projects" value={admin.pausedCount} hint={admin.projectCount > 0 ? `${Math.round((admin.pausedCount / admin.projectCount) * 100)}% of all projects` : "—"} tone={admin.pausedCount > 0 ? "warning" : undefined} />
        </StatGrid>

        <div>
          <div className="row row--between small muted" style={{ marginBottom: 6 }}><span>Funds drawn down · {formatAdaCompact(admin.withdrawnAda)} of {formatAdaCompact(admin.allocatedAda)}</span><span className="num">{formatPct(admin.drawdownPct, 1)}</span></div>
          <ProgressBar value={admin.drawdownPct} tone="yes" ariaLabel="Funds drawn down" />
        </div>
        {msTotal > 0 ? (
          <div>
            <div className="row row--between small muted" style={{ marginBottom: 6 }}><span>Milestone progress · {msTotal} total</span><span>{ms.withdrawn} withdrawn · {ms.completed} completed · {ms.pending} pending · {ms.paused} paused</span></div>
            <div className="c-bar" role="img" aria-label="Milestones by state">
              <span className="c-bar__seg c-bar__seg--yes" style={{ width: `${seg(ms.withdrawn)}%` }} title={`${ms.withdrawn} withdrawn`} />
              <span className="c-bar__seg c-bar__seg--info" style={{ width: `${seg(ms.completed)}%` }} title={`${ms.completed} completed`} />
              <span className="c-bar__seg c-bar__seg--muted" style={{ width: `${seg(ms.pending)}%` }} title={`${ms.pending} pending`} />
              <span className="c-bar__seg c-bar__seg--warning" style={{ width: `${seg(ms.paused)}%` }} title={`${ms.paused} paused`} />
            </div>
            <Legend items={[{ label: "Withdrawn", color: "var(--color-vote-yes)" }, { label: "Completed", color: "var(--color-info)" }, { label: "Pending", color: "var(--color-text-faint)" }, { label: "Paused", color: "var(--color-warning)" }]} />
          </div>
        ) : null}
        {eventEntries.length > 0 ? (
          <div className="row">
            {eventEntries.map(([k, n]) => <Pill key={k} outline size="sm" style={{ color: ADMIN_EVENT_META[k]?.color }}>{ADMIN_EVENT_META[k]?.label || k} · {n}</Pill>)}
            {admin.eventTotal ? <span className="tiny muted">{admin.eventTotal} on-chain events</span> : null}
          </div>
        ) : null}

        <div className="t-admin-grid">
          <div>
            <div className="row" style={{ marginBottom: 10 }}>
              <strong>Projects</strong>
              <div className="c-chips">{["all", "active", "paused", "completed"].map((s) => <Chip key={s} active={status === s} onClick={() => { setStatus(s); setShowAll(false); }} count={s !== "all" ? admin.byStatus?.[s] : undefined}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</Chip>)}</div>
            </div>
            <ProjectsTable projects={shown} withFunded />
            {filtered.length > 12 ? <Button size="sm" style={{ marginTop: 10 }} onClick={() => setShowAll((v) => !v)}>{showAll ? "Show fewer" : `Show all ${filtered.length}`}</Button> : null}
          </div>
          <div>
            <strong style={{ display: "block", marginBottom: 10 }}>Recent activity</strong>
            <EventFeed events={admin.recentEvents} max={12} />
          </div>
        </div>
      </div>
    </Card>
  );
}

/* Selectable proposal table for the scenario --------------------------- */
function ScenarioTable({ rows, checked, onToggle, onToggleAll, label, emptyMessage }) {
  const allChecked = rows.length > 0 && rows.every((r) => checked[r.proposalId]);
  const total = rows.filter((r) => checked[r.proposalId]).reduce((s, r) => s + Number(r.amountAda || 0), 0);
  const columns = [
    { key: "check", label: "", compact: true, hideLabel: true, render: (r) => <Checkbox checked={Boolean(checked[r.proposalId])} onChange={() => onToggle(r.proposalId)} label={<span className="sr-only">Include {r.title || r.proposalId}</span>} /> },
    { key: "title", label: "Proposal", span: true, render: (r) => <div className="t-project"><Link to={`/actions/${encodeURIComponent(r.proposalId)}`} className="c-table__primary">{r.title || r.proposalId}</Link><a className="c-table__sub mono" href={`https://cardanoscan.io/govAction/${encodeURIComponent(r.proposalId)}`} target="_blank" rel="noreferrer">{r.proposalId}</a></div> },
    { key: "expirationEpoch", label: "Expires", align: "right", render: (r) => <span className="num">{r.expirationEpoch ? `Epoch ${r.expirationEpoch}` : "—"}</span> },
    { key: "amountAda", label: "Amount", align: "right", render: (r) => <span className="num">{r.amountAda != null ? formatAda(r.amountAda) : "—"}</span> }
  ];
  return (
    <div>
      <div className="row row--between" style={{ marginBottom: 8 }}>
        <Checkbox checked={allChecked} indeterminate={!allChecked && rows.some((r) => checked[r.proposalId])} onChange={(v) => onToggleAll(v)} label={`Select all ${label}`} disabled={rows.length === 0} />
        <span className="small muted">Selected total <b className="num">{formatAda(total)}</b></span>
      </div>
      <DataTable columns={columns} rows={rows} getRowKey={(r) => r.proposalId} emptyMessage={emptyMessage} caption={label} />
    </div>
  );
}

export default function TreasuryPage() {
  useSeoMeta({ title: "Treasury", description: "Monitor Cardano treasury withdrawal proposals, net change limit status, and enacted budget transactions." });
  const query = useTreasury();
  const adminQuery = useTreasuryAdmin();
  const admin = adminQuery.data?.available ? adminQuery.data : null;
  const payload = query.data;
  const [periodKey, setPeriodKey] = useState("current");
  const [excluded, setExcluded] = useState({}); // proposals are included until unticked

  const periods = payload?.periods || [];
  const periodData = periodKey === "previous" ? payload?.previous : payload?.current;
  const totals = periodData?.totals || {};
  const withdrawals = periodData?.withdrawals || [];
  const epochBreakdown = periodData?.epochBreakdown || [];
  const ratified = payload?.ratified || [];
  const activePipeline = payload?.activePipeline || [];
  const checked = useMemo(() => {
    const out = {};
    for (const r of [...(payload?.ratified || []), ...(payload?.activePipeline || [])]) out[r.proposalId] = !excluded[r.proposalId];
    return out;
  }, [payload, excluded]);
  const toggle = (id) => setExcluded((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleAll = (rows, value) => setExcluded((prev) => { const next = { ...prev }; for (const r of rows) next[r.proposalId] = !value; return next; });

  // Pace.
  const currentEpoch = Number(payload?.currentEpoch || 0);
  const startEpoch = Number(periodData?.period?.startEpoch || 0);
  const endEpoch = Number(periodData?.period?.endEpoch || 0);
  const windowLength = endEpoch - startEpoch;
  const epochsElapsed = currentEpoch > startEpoch ? Math.min(currentEpoch - startEpoch, windowLength) : 0;
  const epochsRemaining = currentEpoch < endEpoch ? endEpoch - currentEpoch : 0;
  const timePct = windowLength > 0 ? (epochsElapsed / windowLength) * 100 : 0;
  const budgetPct = Number(totals.usagePct || 0);
  const pacingDelta = budgetPct - timePct;
  const adaPerEpoch = epochsElapsed > 0 ? Number(totals.withdrawnAda || 0) / epochsElapsed : 0;
  const projectedTotalAda = Number(totals.withdrawnAda || 0) + adaPerEpoch * epochsRemaining;
  const limitAda = Number(totals.limitAda || 0);
  const projectedUsagePct = limitAda > 0 ? (projectedTotalAda / limitAda) * 100 : 0;
  const showPacing = windowLength > 0 && currentEpoch > 0 && epochsElapsed > 0;
  const overLimit = Number(totals.remainingLovelace || 0) < 0;
  const usagePct = Number(totals.usagePct || 0);

  // Scenario.
  const enactedAda = Number(totals.withdrawnAda || 0);
  const selectedRows = [...ratified, ...activePipeline].filter((r) => checked[r.proposalId]);
  const scenarioTotalAda = selectedRows.reduce((s, r) => s + Number(r.amountAda || 0), 0);
  const scenarioCombinedAda = enactedAda + scenarioTotalAda;
  const scenarioRemainingAda = limitAda - scenarioCombinedAda;
  const scenarioUsagePct = limitAda > 0 ? (scenarioCombinedAda / limitAda) * 100 : 0;
  const scenarioOverLimit = scenarioRemainingAda < 0;

  const withdrawalColumns = [
    { key: "epoch", label: "Enacted", compact: true, render: (r) => <span className="num">Epoch {r.enactedEpoch ?? r.ratifiedEpoch ?? "—"}</span> },
    { key: "title", label: "Proposal", span: true, render: (r) => <div className="t-project"><Link to={`/actions/${encodeURIComponent(r.proposalId)}`} className="c-table__primary">{r.title || "Untitled proposal"}</Link><a className="c-table__sub mono" href={`https://cardanoscan.io/govAction/${encodeURIComponent(r.proposalId)}`} target="_blank" rel="noreferrer">{r.proposalId}</a></div> },
    { key: "amountAda", label: "Amount", align: "right", render: (r) => <span className="num">{formatAda(r.amountAda)}</span> }
  ];

  return (
    <main className="shell page p-treasury">
      <PageHeader eyebrow="Governance" title="Treasury" lead="Withdrawals against the net change limit, spending pace, and what happens to the money after approval." actions={<LivePill generatedAt={payload?.generatedAt} />}>
        {periods.length > 0 ? (
          <div style={{ marginTop: 14 }}>
            <Segmented ariaLabel="NCL window" value={periodKey} onChange={setPeriodKey} options={periods.map((p) => ({ value: p.key, label: `${p.label.replace(" NCL Window", "")} · epochs ${p.startEpoch}–${p.endEpoch}` }))} />
          </div>
        ) : null}
      </PageHeader>

      {query.isLoading ? <div className="stack" aria-busy="true"><div className="c-stats"><Skeleton kind="card" count={4} /></div><Skeleton kind="card" /></div> : query.error ? <Alert tone="danger" title="Could not load treasury data.">{query.error.message}</Alert> : (
        <div className="stack--6">
          <StatGrid>
            <StatTile label="Window" value={periodData?.period?.label?.replace(" NCL Window", "") || "—"} hint={`Epoch ${periodData?.period?.startEpoch ?? "?"} – ${periodData?.period?.endEpoch ?? "?"}`} />
            <StatTile label="Withdrawn" value={formatAdaCompact(totals.withdrawnAda)} hint={`${formatAda(totals.withdrawnAda)} enacted in this window`} />
            <StatTile label="Net change limit" value={formatAdaCompact(totals.limitAda)} hint={formatAda(totals.limitAda)} />
            <StatTile label="Remaining" value={formatAdaCompact(totals.remainingAda)} hint={`${formatAda(totals.remainingAda)} ${overLimit ? "over the limit" : "left"}`} tone={overLimit ? "danger" : undefined} />
            <StatTile label="NCL usage" value={<Pill tone={usageTone(usagePct, overLimit)}>{formatPct(usagePct, 2)}</Pill>} hint={overLimit ? "Over limit" : "Within limit"} />
          </StatGrid>

          <Card title="Net change limit usage">
            <ProgressBar value={Math.min(100, usagePct)} tone={overLimit ? "danger" : usagePct >= 90 ? "warning" : "yes"} large ariaLabel="NCL usage" />
            <p className="small muted" style={{ marginTop: 8 }}>{formatAdaCompact(totals.withdrawnAda)} withdrawn of the {formatAdaCompact(totals.limitAda)} limit.</p>
          </Card>

          {showPacing ? (
            <Card title="Spending pace" subtitle={`${formatPct(timePct, 1)} of the window has elapsed (${epochsElapsed} of ${windowLength} epochs). ${epochsRemaining > 0 ? `${epochsRemaining} epochs remaining.` : "Window complete."}`}>
              <div className="stack">
                <StatGrid>
                  <StatTile label="Time elapsed" value={formatPct(timePct, 1)} hint={`Epoch ${startEpoch} → ${endEpoch}`} />
                  <StatTile label="Budget used" value={formatPct(budgetPct, 1)} hint={`${formatAdaCompact(totals.withdrawnAda)} of ${formatAdaCompact(totals.limitAda)}`} />
                  <StatTile label="Pace" value={<Pill tone={Math.abs(pacingDelta) < 5 ? "success" : pacingDelta > 0 ? "warning" : "success"}>{Math.abs(pacingDelta) < 5 ? "On pace" : pacingDelta > 0 ? `${formatPct(pacingDelta, 1)} ahead` : `${formatPct(Math.abs(pacingDelta), 1)} under`}</Pill>} hint="versus time elapsed" />
                  <StatTile label="Burn rate" value={formatAdaCompact(adaPerEpoch)} hint="per epoch, average" />
                  <StatTile label="Projected end of window" value={formatAdaCompact(projectedTotalAda)} hint={`${formatPct(projectedUsagePct, 1)} of limit`} tone={projectedUsagePct > 100 ? "danger" : projectedUsagePct > 90 ? "warning" : undefined} />
                </StatGrid>
                <div className="t-pace">
                  <span className="small muted">Time</span><ProgressBar value={timePct} tone="muted" ariaLabel="Time elapsed" /><span className="small num">{formatPct(timePct, 1)}</span>
                  <span className="small muted">Budget</span><ProgressBar value={budgetPct} tone={overLimit ? "danger" : usagePct >= 90 ? "warning" : "yes"} ariaLabel="Budget used" /><span className="small num">{formatPct(budgetPct, 1)}</span>
                </div>
                <p className="tiny muted">At the current burn rate of {formatAdaCompact(adaPerEpoch)} per epoch, projected spend by epoch {endEpoch} is <strong>{formatAdaCompact(projectedTotalAda)}</strong> ({formatPct(projectedUsagePct, 1)} of the {formatAdaCompact(totals.limitAda)} limit).</p>
              </div>
            </Card>
          ) : null}

          {epochBreakdown.length > 0 ? (
            <Card title="Withdrawals by epoch">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={epochBreakdown} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={CHART.line} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="epoch" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} tickFormatter={(v) => formatAdaCompact(v)} width={64} axisLine={false} tickLine={false} />
                  <ChartTooltip {...tooltipProps} formatter={(v) => [formatAda(v), "Withdrawn"]} labelFormatter={(v) => `Epoch ${v}`} />
                  <Bar dataKey="ada" fill={CHART.accent} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          ) : null}

          <Card title="Enacted withdrawals" subtitle={`${withdrawals.length} withdrawal${withdrawals.length === 1 ? "" : "s"} paid out in this window.`}>
            <DataTable columns={withdrawalColumns} rows={withdrawals} getRowKey={(r) => `${r.proposalId}-${r.enactedEpoch ?? r.ratifiedEpoch}`} emptyMessage="No enacted treasury withdrawals in this window." caption="Enacted withdrawals" />
          </Card>

          {admin ? <DeliverySection admin={admin} /> : null}

          <Card title="Ratified, pending payout" subtitle="Ratified proposals are paid out when enacted at the next epoch boundary. Untick a proposal to leave it out of the scenario below.">
            <ScenarioTable rows={ratified} checked={checked} onToggle={toggle} onToggleAll={(v) => toggleAll(ratified, v)} label="ratified proposals" emptyMessage="No ratified treasury withdrawals awaiting payout." />
          </Card>

          <Card title="Active pipeline" subtitle="Withdrawal proposals currently under vote. Tick or untick to model different outcomes.">
            <ScenarioTable rows={activePipeline} checked={checked} onToggle={toggle} onToggleAll={(v) => toggleAll(activePipeline, v)} label="active proposals" emptyMessage="No active treasury withdrawal proposals right now." />
          </Card>

          {ratified.length > 0 || activePipeline.length > 0 ? (
            <Card accent title="Scenario: if the selected proposals are enacted" subtitle="Based on your selection above.">
              {selectedRows.length === 0 ? <p className="muted">No proposals selected. Tick proposals above to model a scenario.</p> : (
                <div className="stack">
                  <StatGrid>
                    <StatTile label="Already enacted" value={formatAdaCompact(enactedAda)} hint={`${formatAda(enactedAda)} confirmed`} />
                    <StatTile label="Selected" value={formatAdaCompact(scenarioTotalAda)} hint={`${formatAda(scenarioTotalAda)} · ${selectedRows.length} proposal${selectedRows.length === 1 ? "" : "s"}`} />
                    <StatTile label="Projected total" value={formatAdaCompact(scenarioCombinedAda)} hint={`${formatAda(scenarioCombinedAda)} of ${formatAdaCompact(limitAda)} limit`} />
                    <StatTile label={scenarioOverLimit ? "Over the limit by" : "Projected remaining"} value={formatAdaCompact(Math.abs(scenarioRemainingAda))} hint={formatAda(Math.abs(scenarioRemainingAda))} tone={scenarioOverLimit ? "danger" : undefined} />
                    <StatTile label="Projected NCL usage" value={<Pill tone={usageTone(scenarioUsagePct, scenarioOverLimit)}>{formatPct(scenarioUsagePct, 2)}</Pill>} />
                  </StatGrid>
                  <div className="c-bar c-bar--lg" role="img" aria-label="Projected usage">
                    <span className="c-bar__seg c-bar__seg--yes" style={{ width: `${Math.min(100, limitAda > 0 ? (enactedAda / limitAda) * 100 : 0)}%` }} />
                    <span className={`c-bar__seg c-bar__seg--${scenarioOverLimit ? "danger" : "warning"}`} style={{ width: `${Math.min(100, limitAda > 0 ? (scenarioTotalAda / limitAda) * 100 : 0)}%` }} />
                  </div>
                  <Legend items={[{ label: "Enacted", color: "var(--color-vote-yes)" }, { label: "Selected proposals", color: scenarioOverLimit ? "var(--color-danger)" : "var(--color-warning)" }]} />
                </div>
              )}
            </Card>
          ) : null}
        </div>
      )}
    </main>
  );
}
