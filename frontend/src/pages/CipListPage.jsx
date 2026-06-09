import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSeoMeta } from "../hooks/useSeoMeta";

const STATUS_ORDER = ["Active", "Proposed", "Draft", "Inactive", "Deprecated"];

function statusPillMod(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return "pill--active";
  if (s === "proposed") return "pill--ratified";
  if (s === "draft") return "pill--unknown";
  if (s === "inactive" || s === "deprecated") return "pill--expired";
  return "pill--unknown";
}

function formatCipId(id) {
  if (!id) return "";
  const m = id.match(/^(CIP|CPS)-0*(\d+)$/);
  if (m) return `${m[1]}-${m[2]}`;
  return id;
}

export default function CipListPage() {
  useSeoMeta({
    title: "CIP Library",
    description: "Browse all Cardano Improvement Proposals (CIPs) — filter by status and category, search by title or number."
  });

  const [cips, setCips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/cips")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        setCips(data.cips || []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load CIPs.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const statuses = useMemo(() => {
    const seen = new Set(cips.map((c) => c.status).filter(Boolean));
    return STATUS_ORDER.filter((s) => seen.has(s));
  }, [cips]);

  const categories = useMemo(() => {
    const seen = new Set(cips.map((c) => c.category).filter(Boolean));
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [cips]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cips.filter((c) => {
      if (typeFilter && c.type !== typeFilter) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (categoryFilter && c.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        String(c.number).includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    });
  }, [cips, query, typeFilter, statusFilter, categoryFilter]);

  return (
    <main className="page shell stats-page">
      <section className="pdp-head">
        <h1 className="pdp-title">CIP Library</h1>
        <p className="muted" style={{ marginTop: "0.4rem" }}>
          Cardano Improvement Proposals — the living specification of the Cardano protocol and ecosystem.
        </p>
      </section>

      <section className="stats-section stats-section--wide">
        {/* Type toggle: All / CIP / CPS */}
        <div className="mode-switcher" style={{ marginBottom: "1rem" }}>
          {["", "CIP", "CPS"].map((t) => (
            <button
              key={t || "all"}
              type="button"
              className={`mode-btn${typeFilter === t ? " active" : ""}`}
              onClick={() => setTypeFilter(t)}
            >
              {t || "All"}
            </button>
          ))}
        </div>

        <div className="proposal-vote-filters">
          <label className="proposal-vote-filters-search">
            <span>Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title or number…"
            />
          </label>
          <label>
            <span>Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Category</span>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          {!loading && (
            <p className="muted proposal-vote-filters-count">
              Showing <strong>{filtered.length}</strong> of <strong>{cips.length}</strong>
            </p>
          )}
        </div>

        {loading && <p className="muted" style={{ padding: "1.5rem 0" }}>Loading CIP index…</p>}
        {error && <p className="muted" style={{ padding: "1.5rem 0" }}>Error: {error}</p>}

        {!loading && !error && (
          <div className="table-panel">
            <table className="mobile-cards-table">
              <thead>
                <tr>
                  <th>CIP</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">No CIPs match the current filters.</td>
                  </tr>
                ) : (
                  filtered.map((cip) => (
                    <tr key={cip.id}>
                      <td data-label="CIP">
                        <span className="mono">{formatCipId(cip.id)}</span>
                      </td>
                      <td data-label="Title">
                        <Link className="inline-link" to={`/cips/${cip.id}`}>
                          {cip.title || cip.id}
                        </Link>
                      </td>
                      <td data-label="Status">
                        {cip.status
                          ? <span className={`pill ${statusPillMod(cip.status)}`}>{cip.status}</span>
                          : <span className="muted">—</span>}
                      </td>
                      <td data-label="Category">
                        {cip.category || <span className="muted">—</span>}
                      </td>
                      <td data-label="Created">
                        <span className="muted">{cip.created || "—"}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
