// Cardano Improvement Proposals index, read from the CIPs repository through
// the server's cached /api/cips.
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { fetchJson } from "../api/client";
import { Alert, DataTable, Input, PageHeader, Pill, Segmented, Select, Skeleton } from "../ui";
import { IconSearch } from "../ui/icons";

const STATUS_ORDER = ["Active", "Proposed", "Draft", "Inactive", "Deprecated"];
function cipStatusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return "success";
  if (s === "proposed") return "warning";
  if (s === "inactive" || s === "deprecated") return "danger";
  return "neutral";
}
function formatCipId(id) {
  const m = String(id || "").match(/^(CIP|CPS)-0*(\d+)$/);
  return m ? `${m[1]}-${m[2]}` : id || "";
}

export default function CipListPage() {
  useSeoMeta({ title: "CIP Library", description: "Browse all Cardano Improvement Proposals (CIPs) — filter by status and category, search by title or number." });
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ["cips"], staleTime: 30 * 60_000, queryFn: ({ signal }) => fetchJson("/api/cips", { signal }) });
  const cips = useMemo(() => query.data?.cips || [], [query.data]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const statuses = useMemo(() => { const seen = new Set(cips.map((c) => c.status).filter(Boolean)); return STATUS_ORDER.filter((s) => seen.has(s)); }, [cips]);
  const categories = useMemo(() => [...new Set(cips.map((c) => c.category).filter(Boolean))].sort(), [cips]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cips.filter((c) => (!type || c.type === type) && (!status || c.status === status) && (!category || c.category === category) && (!q || c.title.toLowerCase().includes(q) || String(c.number).includes(q) || c.id.toLowerCase().includes(q)));
  }, [cips, search, type, status, category]);

  const columns = [
    { key: "id", label: "CIP", compact: true, sortable: true, sortValue: (c) => Number(c.number) || 0, render: (c) => <span className="mono">{formatCipId(c.id)}</span> },
    { key: "title", label: "Title", span: true, sortable: true, defaultDir: "asc", render: (c) => <Link to={`/cips/${c.id}`} className="c-table__primary">{c.title || c.id}</Link> },
    { key: "status", label: "Status", compact: true, render: (c) => c.status ? <Pill size="sm" tone={cipStatusTone(c.status)}>{c.status}</Pill> : <span className="muted">—</span> },
    { key: "category", label: "Category", render: (c) => c.category || <span className="muted">—</span> },
    { key: "created", label: "Created", align: "right", sortable: true, render: (c) => <span className="small muted num">{c.created || "—"}</span> }
  ];

  return (
    <main className="shell page p-cips">
      <PageHeader eyebrow="Reference" title="CIP library" lead="Cardano Improvement Proposals: the living specification of the Cardano protocol and ecosystem." actions={<Segmented ariaLabel="Document type" value={type} onChange={setType} options={[{ value: "", label: "All" }, { value: "CIP", label: "CIPs" }, { value: "CPS", label: "CPSs" }]} />} />
      <div className="stack">
        <div className="c-toolbar">
          <div className="c-search c-toolbar__grow"><span className="c-search__icon"><IconSearch size={16} /></span><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title or number…" aria-label="Search CIPs" /></div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</Select>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category"><option value="">All categories</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</Select>
          {!query.isLoading ? <span className="small muted">Showing <b className="num">{filtered.length}</b> of <b className="num">{cips.length}</b></span> : null}
        </div>
        {query.error ? <Alert tone="danger">{query.error.message}</Alert> : query.isLoading ? <Skeleton kind="row" count={8} /> : (
          <DataTable columns={columns} rows={filtered} getRowKey={(c) => c.id} onRowClick={(c) => navigate(`/cips/${c.id}`)} defaultSort={{ key: "id", dir: "desc" }} emptyMessage="No CIPs match the current filters." caption="Cardano Improvement Proposals" />
        )}
        {query.data?.stale ? <p className="tiny muted">Showing a cached index; the CIP repository could not be refreshed.</p> : null}
      </div>
    </main>
  );
}
