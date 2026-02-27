import { useCallback, useEffect, useState } from "react";

function fmtDate(iso) {
  if (!iso) return "Unknown";
  const dt = new Date(iso);
  if (!Number.isFinite(dt.getTime())) return "Unknown";
  return dt.toLocaleString();
}

export default function BugsPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem("civitas.bugs.token") || "";
    } catch {
      return "";
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reports, setReports] = useState([]);
  const [busyId, setBusyId] = useState("");

  const loadReports = useCallback(async (currentToken) => {
    if (!currentToken) {
      setLoading(false);
      setReports([]);
      setError("");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/bug-reports?limit=300", {
        headers: { "x-bug-admin-token": currentToken }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load bug reports.");
      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch (e) {
      setError(e.message || "Failed to load bug reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports(token);
  }, [token, loadReports]);

  useEffect(() => {
    if (!token) return undefined;
    const id = setInterval(() => loadReports(token), 10000);
    return () => clearInterval(id);
  }, [token, loadReports]);

  function unlock() {
    const next = String(tokenInput || "").trim();
    if (!next) return;
    setToken(next);
    try {
      sessionStorage.setItem("civitas.bugs.token", next);
    } catch {
      // Ignore storage failures.
    }
  }

  function lock() {
    setToken("");
    setTokenInput("");
    setReports([]);
    setError("");
    try {
      sessionStorage.removeItem("civitas.bugs.token");
    } catch {
      // Ignore storage failures.
    }
  }

  async function applyAction(id, action) {
    if (!token || !id || !action) return;
    try {
      setBusyId(`${id}:${action}`);
      setError("");
      const res = await fetch("/api/bug-reports/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bug-admin-token": token
        },
        body: JSON.stringify({ id, action })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update bug report.");
      await loadReports(token);
    } catch (e) {
      setError(e.message || "Failed to update bug report.");
    } finally {
      setBusyId("");
    }
  }

  async function copyReport(row) {
    try {
      const payload = JSON.stringify(row, null, 2);
      await navigator.clipboard.writeText(payload);
      setNotice(`Copied ${row?.id || "report"} to clipboard.`);
      setTimeout(() => setNotice(""), 2500);
    } catch {
      setError("Failed to copy report.");
    }
  }

  function actionDisabled(id, action) {
    return loading || busyId === `${id}:${action}`;
  }

  const openReports = reports.filter((r) => String(r?.status || "open").toLowerCase() === "open");
  const approvedReports = reports.filter((r) => String(r?.status || "").toLowerCase() === "approved");
  const archivedReports = reports.filter((r) => String(r?.status || "").toLowerCase() === "archived");

  function renderSection(title, rows, statusType) {
    return (
      <section className="panel table-panel" key={title}>
        <div className="status-row">
          <h3>{title}</h3>
          <p className="muted">{rows.length} report(s)</p>
        </div>
        <table className="mobile-cards-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Category</th>
              <th>Title</th>
              <th>Description</th>
              <th>Page</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">No reports in this section.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id || `${row.createdAt}-${row.title}`}>
                  <td data-label="When">{fmtDate(row.createdAt)}</td>
                  <td data-label="Category">{row.category || "other"}</td>
                  <td data-label="Title">{row.title || "Untitled"}</td>
                  <td data-label="Description">
                    <div>{row.description || ""}</div>
                    {row.expected ? <div className="muted">Expected: {row.expected}</div> : null}
                    {row.steps ? <div className="muted">Steps: {row.steps}</div> : null}
                  </td>
                  <td data-label="Page" className="mono">{row.page || "-"}</td>
                  <td data-label="Contact">{row.contact || "-"}</td>
                  <td data-label="Actions">
                    <div className="detail-mode-switch">
                      {statusType === "open" ? (
                        <>
                          <button
                            type="button"
                            className="mode-btn"
                            onClick={() => applyAction(row.id, "approve")}
                            disabled={actionDisabled(row.id, "approve")}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="mode-btn"
                            onClick={() => applyAction(row.id, "archive")}
                            disabled={actionDisabled(row.id, "archive")}
                          >
                            Archive
                          </button>
                        </>
                      ) : null}
                      {statusType === "approved" ? (
                        <>
                          <button
                            type="button"
                            className="mode-btn"
                            onClick={() => applyAction(row.id, "archive")}
                            disabled={actionDisabled(row.id, "archive")}
                          >
                            Archive
                          </button>
                          <button
                            type="button"
                            className="mode-btn"
                            onClick={() => applyAction(row.id, "reopen")}
                            disabled={actionDisabled(row.id, "reopen")}
                          >
                            Reopen
                          </button>
                        </>
                      ) : null}
                      {statusType === "archived" ? (
                        <button
                          type="button"
                          className="mode-btn"
                          onClick={() => applyAction(row.id, "reopen")}
                          disabled={actionDisabled(row.id, "reopen")}
                        >
                          Reopen
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="mode-btn"
                        onClick={() => copyReport(row)}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        className="mode-btn"
                        onClick={() => applyAction(row.id, "remove")}
                        disabled={actionDisabled(row.id, "remove")}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    );
  }

  return (
    <main className="shell page dashboard-page">
      <section className="page-header">
        <h1>Bug Reports</h1>
        <p className="muted">Latest user-submitted reports (newest first).</p>
      </section>
      {!token ? (
        <section className="panel">
          <div className="bug-report-form">
            <label>
              Admin token
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter bug reports token"
              />
            </label>
            <div>
              <button type="button" className="mode-btn active" onClick={unlock}>
                Unlock
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="status-row">
          <button type="button" className="mode-btn" onClick={() => loadReports(token)} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" className="mode-btn" onClick={lock}>
            Lock
          </button>
        </section>
      )}
      {notice ? (
        <section className="status-row">
          <p className="muted">{notice}</p>
        </section>
      ) : null}
      {error ? (
        <section className="status-row">
          <p className="muted">Error: {error}</p>
        </section>
      ) : null}
      {token ? renderSection("Open", openReports, "open") : null}
      {token ? renderSection("Approved", approvedReports, "approved") : null}
      {token ? renderSection("Archived", archivedReports, "archived") : null}
      {!token ? (
      <section className="panel table-panel">
        {loading ? <p className="muted">Loading bug reports...</p> : null}
        {!loading && !error ? (
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Category</th>
                <th>Title</th>
                <th>Description</th>
                <th>Page</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">No bug reports yet.</td>
                </tr>
              ) : (
                reports.map((row) => (
                  <tr key={row.id || `${row.createdAt}-${row.title}`}>
                    <td>{fmtDate(row.createdAt)}</td>
                    <td>{row.category || "other"}</td>
                    <td>{row.title || "Untitled"}</td>
                    <td>
                      <div>{row.description || ""}</div>
                      {row.expected ? <div className="muted">Expected: {row.expected}</div> : null}
                      {row.steps ? <div className="muted">Steps: {row.steps}</div> : null}
                    </td>
                    <td className="mono">{row.page || "-"}</td>
                    <td>{row.contact || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : null}
      </section>
      ) : null}
    </main>
  );
}
