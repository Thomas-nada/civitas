import { useId } from "react";

/** Accessible tab list. tabs: [{ key, label, count }]; value/onChange. */
export function Tabs({ tabs, value, onChange, ariaLabel }) {
  const base = useId();
  function onKeyDown(e) {
    const idx = tabs.findIndex((t) => t.key === value);
    if (idx < 0) return;
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    onChange(tabs[next].key);
    document.getElementById(`${base}-tab-${tabs[next].key}`)?.focus();
  }
  return (
    <div className="c-tabs" role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown}>
      {tabs.map((t) => (
        <button
          key={t.key}
          id={`${base}-tab-${t.key}`}
          type="button"
          role="tab"
          className="c-tab"
          aria-selected={t.key === value}
          aria-controls={`${base}-panel-${t.key}`}
          tabIndex={t.key === value ? 0 : -1}
          onClick={() => onChange(t.key)}
        >
          {t.label}
          {t.count !== undefined ? <span className="c-tab__count">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ tabKey, value, children, className }) {
  if (tabKey !== value) return null;
  return <div role="tabpanel" className={`c-tabpanel${className ? ` ${className}` : ""}`}>{children}</div>;
}
