// Funded projects with allocation, drawdown and milestone progress.
import { Link } from "react-router-dom";
import { DataTable, Pill } from "../../ui";
import { drawdownTone, fmtAdaShort, fmtAgo, fmtDate, statusTone } from "../../lib/treasuryAdmin";

function titleCase(s) { return String(s || "").replace(/\b\w/g, (m) => m.toUpperCase()); }

function projectColumns({ withFunded = false } = {}) {
  return [
    {
      key: "name", label: "Project", span: true, sortable: true, defaultDir: "asc", sortValue: (p) => p.name || "",
      render: (p) => (
        <div className="t-project">
          <Link to={`/treasury/explorer/${encodeURIComponent(p.projectId)}`} className="c-table__primary">{p.name || "Unnamed project"}</Link>
          {p.projectId ? <span className="c-table__sub mono">{p.projectId}</span> : null}
        </div>
      )
    },
    { key: "status", label: "Status", compact: true, render: (p) => <Pill size="sm" tone={statusTone(p.status)}>{titleCase(p.status)}</Pill> },
    { key: "allocatedAda", label: "Allocated", align: "right", sortable: true, render: (p) => <span className="num">₳{fmtAdaShort(p.allocatedAda)}<span className="c-table__sub">₳{fmtAdaShort(p.withdrawnAda)} drawn</span></span> },
    {
      key: "drawdownPct", label: "Drawdown", sortable: true,
      render: (p) => (
        <div className="t-drawdown">
          <div className="c-bar"><span className={`c-bar__seg c-bar__seg--${drawdownTone(p)}`} style={{ width: `${Math.min(100, p.drawdownPct)}%` }} /></div>
          <span className="num tiny muted">{p.drawdownPct}%</span>
        </div>
      )
    },
    { key: "milestones", label: "Milestones", align: "right", render: (p) => <span className="num small"><strong>{p.milestones?.done ?? 0}</strong><span className="muted">/{p.milestones?.total ?? 0}</span>{p.milestones?.paused > 0 ? <span style={{ color: "var(--color-warning)" }}> · {p.milestones.paused} paused</span> : null}</span> },
    ...(withFunded ? [{ key: "fundedIso", label: "Funded", align: "right", render: (p) => <span className="small muted">{fmtDate(p.fundedIso)}</span> }] : []),
    { key: "lastActivityIso", label: "Last activity", align: "right", sortable: true, sortValue: (p) => new Date(p.lastActivityIso || 0).getTime(), render: (p) => <span className="small muted" title={fmtDate(p.lastActivityIso)}>{fmtAgo(p.lastActivityIso) || "—"}</span> }
  ];
}

export default function ProjectsTable({ projects, withFunded, sort, onSortChange, defaultSort, emptyMessage = "No projects match this filter." }) {
  return <DataTable columns={projectColumns({ withFunded })} rows={projects} getRowKey={(p) => p.projectId || p.name} sort={sort} onSortChange={onSortChange} defaultSort={defaultSort} emptyMessage={emptyMessage} caption="Funded projects" />;
}
