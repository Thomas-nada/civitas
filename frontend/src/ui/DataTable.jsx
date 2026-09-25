import { useMemo, useState } from "react";
import { IconArrowDown, IconArrowUp, IconSort } from "./icons";
import { cx } from "./cx";

/**
 * Sortable data table that turns into cards under 720px.
 *
 * columns: [{ key, label, sortable, sortValue(row), render(row), className,
 *             align: "right", span (full width on mobile), hideLabel }]
 * rows: array; getRowKey(row); onRowClick(row) / rowHref(row)
 * sort: { key, dir } (controlled) or defaultSort.
 */
export default function DataTable({
  columns, rows, getRowKey, onRowClick, rowHref, rowLink, sort, onSortChange, defaultSort,
  emptyMessage = "Nothing to show.", cards = true, stickyFirst = false, dense, caption, className, footer, maxRows
}) {
  const [innerSort, setInnerSort] = useState(defaultSort || null);
  const activeSort = sort || innerSort;
  const setSort = (next) => { if (onSortChange) onSortChange(next); else setInnerSort(next); };

  const sorted = useMemo(() => {
    if (!activeSort?.key) return rows;
    const col = columns.find((c) => c.key === activeSort.key);
    if (!col) return rows;
    const val = col.sortValue || ((row) => row[col.key]);
    const dir = activeSort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = val(a); const bv = val(b);
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * dir;
    });
  }, [rows, columns, activeSort]);
  const visible = maxRows ? sorted.slice(0, maxRows) : sorted;

  function toggleSort(col) {
    if (!col.sortable) return;
    if (activeSort?.key === col.key) setSort({ key: col.key, dir: activeSort.dir === "desc" ? "asc" : "desc" });
    else setSort({ key: col.key, dir: col.defaultDir || "desc" });
  }

  return (
    <div className={cx("c-table-wrap", cards && "c-table-wrap--cards", className)}>
      <table className={cx("c-table", (onRowClick || rowHref || rowLink) && "c-table--clickable", stickyFirst && "c-table--sticky-first", dense && "c-table--dense")}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((col) => {
              const isSorted = activeSort?.key === col.key;
              const ariaSort = isSorted ? (activeSort.dir === "asc" ? "ascending" : "descending") : "none";
              return (
                <th key={col.key} className={cx(col.align === "right" && "num", col.compact && "compact", col.className)} aria-sort={col.sortable ? ariaSort : undefined} scope="col">
                  {col.sortable ? (
                    <button type="button" className="c-table__sort" aria-sort={ariaSort} onClick={() => toggleSort(col)}>
                      {col.label}
                      {isSorted ? (activeSort.dir === "asc" ? <IconArrowUp /> : <IconArrowDown />) : <IconSort />}
                    </button>
                  ) : col.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 ? (
            <tr><td colSpan={columns.length} className="span nolabel muted" style={{ textAlign: "center", padding: 24 }}>{emptyMessage}</td></tr>
          ) : visible.map((row) => {
            const key = getRowKey ? getRowKey(row) : row.id;
            const clickable = Boolean(onRowClick);
            return (
              <tr
                key={key}
                onClick={clickable ? (e) => { if (e.target.closest("a, button, input, select, label")) return; onRowClick(row); } : undefined}
                onKeyDown={clickable ? (e) => { if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) { e.preventDefault(); onRowClick(row); } } : undefined}
                tabIndex={clickable ? 0 : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} data-label={col.label} className={cx(col.align === "right" && "num", col.compact && "compact", col.span && "span", col.hideLabel && "nolabel", col.cellClassName)}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {footer}
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage, onPageSize, pageSizes = [25, 50, 100, 200, "all"] }) {
  const size = pageSize === "all" ? total : Number(pageSize);
  const pages = Math.max(1, Math.ceil(total / Math.max(1, size)));
  const start = total === 0 ? 0 : (page - 1) * size + 1;
  const end = Math.min(total, page * size);
  return (
    <div className="c-pagination">
      <span>Showing <b className="num">{start}–{end}</b> of <b className="num">{total}</b></span>
      <div className="c-pagination__pages">
        {onPageSize ? (
          <select className="c-select c-select--sm" value={pageSize} onChange={(e) => onPageSize(e.target.value === "all" ? "all" : Number(e.target.value))} aria-label="Rows per page">
            {pageSizes.map((s) => <option key={s} value={s}>{s === "all" ? "All" : `${s} / page`}</option>)}
          </select>
        ) : null}
        <button type="button" className="c-btn c-btn--sm" onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1}>Prev</button>
        <span className="num">{page} / {pages}</span>
        <button type="button" className="c-btn c-btn--sm" onClick={() => onPage(Math.min(pages, page + 1))} disabled={page >= pages}>Next</button>
      </div>
    </div>
  );
}
