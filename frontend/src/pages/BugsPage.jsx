// Bug reports submitted from the topbar dialog. Anyone can read them; the
// admin token (session-scoped) unlocks approve / archive / reopen / remove.
import { useCallback, useEffect, useState } from "react";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { fetchJson } from "../api/client";
import { Alert, Button, Card, CopyButton, DataTable, Field, Input, PageHeader, Pill, Skeleton, TabPanel, Tabs } from "../ui";
import { formatDateTime } from "../lib/governance/format";

const STATUS_TONE = { open: "warning", approved: "success", archived: "neutral" };

export default function BugsPage() {
  useSeoMeta({ title: "Bug Reports" });
  const [tokenInput, setTokenInput] = useState("");
  const [token, setToken] = useState(() => { try { return sessionStorage.getItem("civitas.bugs.token") || ""; } catch { return ""; } });
  const [state, setState] = useState({ loading: true, reports: [], error: "" });
  const [busy, setBusy] = useState("");
  const [tab, setTab] = useState("open");

  const load = useCallback(async (currentToken) => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const data = await fetchJson("/api/bug-reports?limit=300", { headers: currentToken ? { "x-bug-admin-token": currentToken } : {} });
      setState({ loading: false, reports: Array.isArray(data.reports) ? data.reports : [], error: "" });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message || "Failed to load bug reports." }));
    }
  }, []);
  useEffect(() => { load(token); }, [token, load]);
  useEffect(() => { if (!token) return undefined; const id = setInterval(() => load(token), 10_000); return () => clearInterval(id); }, [token, load]);

  function unlock() {
    const next = tokenInput.trim();
    if (!next) return;
    setToken(next);
    try { sessionStorage.setItem("civitas.bugs.token", next); } catch { /* ignore */ }
  }
  function lock() {
    setToken(""); setTokenInput("");
    try { sessionStorage.removeItem("civitas.bugs.token"); } catch { /* ignore */ }
  }
  async function act(id, action) {
    if (!token || !id) return;
    setBusy(`${id}:${action}`);
    try {
      await fetchJson("/api/bug-reports/action", { method: "POST", headers: { "x-bug-admin-token": token }, body: { id, action } });
      await load(token);
    } catch (e) {
      setState((s) => ({ ...s, error: e.message || "Failed to update the bug report." }));
    } finally {
      setBusy("");
    }
  }

  const reports = state.reports;
  const byStatus = (status) => reports.filter((r) => String(r?.status || "open").toLowerCase() === status);
  const actionsFor = (row, status) => {
    const btn = (action, label, variant) => <Button key={action} size="sm" variant={variant} onClick={() => act(row.id, action)} disabled={busy === `${row.id}:${action}`} loading={busy === `${row.id}:${action}`}>{label}</Button>;
    return (
      <span className="row" style={{ gap: 4 }}>
        {status === "open" ? [btn("approve", "Approve", "primary"), btn("archive", "Archive")] : null}
        {status === "approved" ? [btn("archive", "Archive"), btn("reopen", "Reopen")] : null}
        {status === "archived" ? btn("reopen", "Reopen") : null}
        <CopyButton value={JSON.stringify(row, null, 2)} label="Copy report as JSON" />
        {btn("remove", "Remove", "danger")}
      </span>
    );
  };
  const columns = (status) => [
    { key: "createdAt", label: "When", compact: true, sortable: true, sortValue: (r) => new Date(r.createdAt || 0).getTime(), render: (r) => <span className="small muted">{formatDateTime(r.createdAt) || "Unknown"}</span> },
    { key: "category", label: "Category", compact: true, render: (r) => <Pill size="sm" tone="neutral">{r.category || "other"}</Pill> },
    { key: "title", label: "Report", span: true, render: (r) => <div className="stack--2" style={{ gap: 4 }}><span className="c-table__primary">{r.title || "Untitled"}</span><span className="small">{r.description || ""}</span>{r.expected ? <span className="c-table__sub">Expected: {r.expected}</span> : null}{r.steps ? <span className="c-table__sub">Steps: {r.steps}</span> : null}</div> },
    { key: "page", label: "Page", render: (r) => <span className="mono small break">{r.page || "—"}</span> },
    { key: "contact", label: "Contact", render: (r) => <span className="small">{r.contact || "—"}</span> },
    ...(token ? [{ key: "actions", label: "Actions", compact: true, render: (r) => actionsFor(r, status) }] : [])
  ];
  const table = (status) => <DataTable columns={columns(status)} rows={token ? byStatus(status) : reports} getRowKey={(r) => r.id || `${r.createdAt}-${r.title}`} emptyMessage="No reports in this section." caption="Bug reports" />;

  return (
    <main className="shell page p-bugs">
      <PageHeader eyebrow="Admin" title="Bug reports" lead="User-submitted reports, newest first." actions={token ? <span className="row"><Button size="sm" onClick={() => load(token)} loading={state.loading}>Refresh</Button><Button size="sm" onClick={lock}>Lock</Button></span> : null} />
      <div className="stack">
        {!token ? (
          <Card title="Moderate reports" subtitle="Enter the admin token to approve, archive or remove reports.">
            <div className="row" style={{ alignItems: "flex-end" }}>
              <Field label="Admin token" className="c-toolbar__grow">{(id) => <Input id={id} type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="Bug reports token" onKeyDown={(e) => { if (e.key === "Enter") unlock(); }} />}</Field>
              <Button variant="primary" onClick={unlock} disabled={!tokenInput.trim()}>Unlock</Button>
            </div>
          </Card>
        ) : null}
        {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
        {state.loading && reports.length === 0 ? <Skeleton kind="row" count={5} /> : token ? (
          <>
            <Tabs ariaLabel="Report status" value={tab} onChange={setTab} tabs={[{ key: "open", label: "Open", count: byStatus("open").length }, { key: "approved", label: "Approved", count: byStatus("approved").length }, { key: "archived", label: "Archived", count: byStatus("archived").length }]} />
            <TabPanel tabKey="open" value={tab}>{table("open")}</TabPanel>
            <TabPanel tabKey="approved" value={tab}>{table("approved")}</TabPanel>
            <TabPanel tabKey="archived" value={tab}>{table("archived")}</TabPanel>
          </>
        ) : table("open")}
      </div>
    </main>
  );
}
