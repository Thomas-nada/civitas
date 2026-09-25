// Treasury explorer: every project funded from the treasury, what has been
// drawn down, and the on-chain activity feed (Intersect Administration API).
import { useMemo, useState } from "react";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { useTreasuryAdmin, useTreasuryAdminEvents } from "../api/queries";
import EventFeed from "../components/treasury/EventFeed";
import ProjectsTable from "../components/treasury/ProjectsTable";
import { Alert, Button, Card, Chip, Input, PageHeader, Skeleton, StatGrid, StatTile } from "../ui";
import { IconSearch } from "../ui/icons";
import { formatAdaCompact, formatPct } from "../lib/governance/format";
import { ADMIN_EVENT_META, eventMeta } from "../lib/treasuryAdmin";

export default function TreasuryExplorerPage() {
  useSeoMeta({ title: "Treasury Explorer", description: "Explore every funded Cardano treasury project — allocation, drawdown, milestones, evidence, and on-chain activity." });
  const adminQuery = useTreasuryAdmin();
  const eventsQuery = useTreasuryAdminEvents(80);
  const data = adminQuery.data?.available ? adminQuery.data : null;
  const events = eventsQuery.data?.available ? eventsQuery.data.events || [] : null;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState({ key: "allocatedAda", dir: "desc" });
  const [eventType, setEventType] = useState("all");

  const projects = useMemo(() => {
    let list = data?.projects || [];
    if (status !== "all") list = list.filter((p) => p.status === status);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => (p.name || "").toLowerCase().includes(q) || (p.projectId || "").toLowerCase().includes(q));
    return list;
  }, [data, status, search]);
  const filteredEvents = useMemo(() => (eventsQuery.data?.events || []).filter((e) => eventType === "all" || e.type === eventType), [eventsQuery.data, eventType]);

  if (adminQuery.isLoading) return <main className="shell page p-treasury" aria-busy="true"><Skeleton kind="title" width="40%" /><div style={{ height: 24 }} /><div className="c-stats"><Skeleton kind="card" count={4} /></div></main>;
  if (!data) {
    return (
      <main className="shell page p-treasury">
        <PageHeader eyebrow="Treasury" title="Treasury explorer" actions={<Button to="/treasury">← Treasury overview</Button>} />
        <Alert tone="warning" title="Treasury administration data is unavailable right now.">{adminQuery.error?.message || "The Intersect Administration API could not be reached. Try again in a few minutes."}</Alert>
      </main>
    );
  }

  const undrawn = Math.max(0, data.allocatedAda - data.withdrawnAda);
  const eventTypes = ["all", ...Object.keys(ADMIN_EVENT_META).filter((k) => data.eventsByType?.[k])];

  return (
    <main className="shell page p-treasury">
      <PageHeader eyebrow="Treasury" title="Treasury explorer" lead={<>Every project funded from the Cardano treasury and what has happened to the money since: allocation, drawdown, milestone-by-milestone delivery, evidence and on-chain activity. Live data via the Intersect Administration API{data.syncedBlock ? `, synced to block ${Number(data.syncedBlock).toLocaleString()}` : ""}.</>} actions={<Button to="/treasury">← Treasury overview</Button>} />

      <div className="stack--6">
        <StatGrid>
          <StatTile label="Allocated" value={formatAdaCompact(data.allocatedAda)} hint={`${data.projectCount} projects`} />
          <StatTile label="Drawn down" value={formatAdaCompact(data.withdrawnAda)} hint={formatPct(data.drawdownPct, 1)} tone="accent" />
          <StatTile label="Still locked" value={formatAdaCompact(undrawn)} hint="undrawn" />
          <StatTile label="Milestones" value={<>{data.milestones?.withdrawn || 0}<span className="muted" style={{ fontSize: "0.7em" }}> / {data.milestones?.total || 0}</span></>} hint="withdrawn" />
          <StatTile label="Active" value={data.byStatus?.active || 0} hint="projects" />
          <StatTile label="Paused" value={data.pausedCount} hint="projects" tone={data.pausedCount > 0 ? "warning" : undefined} />
        </StatGrid>

        <div className="t-admin-grid">
          <Card title={<>Projects <span className="muted" style={{ fontWeight: 400 }}>({projects.length})</span></>}>
            <div className="c-toolbar" style={{ marginBottom: 12 }}>
              <div className="c-search c-toolbar__grow"><span className="c-search__icon"><IconSearch size={16} /></span><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search project name or ID…" aria-label="Search projects" /></div>
              <div className="c-chips">{["all", "active", "paused", "completed"].map((s) => <Chip key={s} active={status === s} onClick={() => setStatus(s)} count={s !== "all" ? data.byStatus?.[s] : undefined}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</Chip>)}</div>
            </div>
            <ProjectsTable projects={projects} sort={sort} onSortChange={setSort} emptyMessage="No projects match." />
          </Card>
          <Card title="On-chain activity">
            <div className="c-chips" style={{ marginBottom: 12 }}>{eventTypes.map((t) => <Chip key={t} active={eventType === t} onClick={() => setEventType(t)}>{t === "all" ? "All" : eventMeta(t).label}</Chip>)}</div>
            {!events ? (eventsQuery.isLoading ? <Skeleton kind="row" count={6} /> : <p className="muted small">Activity is unavailable right now.</p>) : <div className="t-feed-scroll"><EventFeed events={filteredEvents} emptyMessage="No events of this type." /></div>}
          </Card>
        </div>
      </div>
    </main>
  );
}
