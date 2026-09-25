import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IconAlert, IconCheck, IconChevronDown, IconCopy, IconInfo } from "./icons";

import { cx } from "./cx";

/* Button ------------------------------------------------------------------ */
export function Button({
  variant = "default", size, block, icon, loading, className, children, as, to, href, ...rest
}) {
  const cls = cx(
    "c-btn",
    variant !== "default" && `c-btn--${variant}`,
    size && `c-btn--${size}`,
    block && "c-btn--block",
    icon && !children && "c-btn--icon",
    className
  );
  const content = (
    <>
      {loading ? <span className="c-btn__spinner" aria-hidden="true" /> : icon}
      {children}
    </>
  );
  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{content}</a>;
  const Tag = as || "button";
  return <Tag type={Tag === "button" ? (rest.type || "button") : undefined} className={cls} disabled={loading || rest.disabled} {...rest}>{content}</Tag>;
}

export function IconButton({ label, children, ...rest }) {
  return <Button icon={children} aria-label={label} title={label} {...rest} />;
}

/* Pill -------------------------------------------------------------------- */
const TONE_BY_STATUS = {
  active: "active", pending: "pending", ratified: "ratified", enacted: "enacted",
  expired: "expired", dropped: "dropped", yes: "yes", no: "no", abstain: "abstain",
  "no confidence": "noconf", noconfidence: "noconf", retired: "danger", unknown: "neutral",
  registered: "success", authorized: "success"
};
export function Pill({ tone, status, size, outline, className, children, ...rest }) {
  const resolved = tone || (status ? TONE_BY_STATUS[String(status).toLowerCase()] || "neutral" : "neutral");
  return (
    <span className={cx("c-pill", `c-pill--${resolved}`, size && `c-pill--${size}`, outline && "c-pill--outline", className)} {...rest}>
      {children ?? status}
    </span>
  );
}
export function StatusPill({ status, ...rest }) {
  const s = String(status || "").trim();
  if (!s) return null;
  return <Pill status={s} {...rest}>{s}</Pill>;
}
export function VotePill({ vote, ...rest }) {
  const v = String(vote || "").trim();
  if (!v) return null;
  return <Pill status={v} {...rest}>{v}</Pill>;
}
export function RolePill({ role, ...rest }) {
  const r = String(role || "").toLowerCase();
  const tone = r.includes("drep") ? "drep" : r.includes("pool") || r === "spo" ? "spo" : "cc";
  const label = tone === "drep" ? "DRep" : tone === "spo" ? "SPO" : "CC";
  return <Pill tone={tone} {...rest}>{label}</Pill>;
}

/* Card -------------------------------------------------------------------- */
export function Card({ pad = true, soft, elevated, accent, className, children, title, subtitle, actions, footer, ...rest }) {
  const hasHead = title || subtitle || actions;
  return (
    <section className={cx("c-card", soft && "c-card--soft", elevated && "c-card--elevated", accent && "c-card--accent", !hasHead && pad && "c-card--pad", className)} {...rest}>
      {hasHead ? (
        <header className="c-card__head">
          <div>
            {title ? <h3 className="c-card__title">{title}</h3> : null}
            {subtitle ? <p className="c-card__sub">{subtitle}</p> : null}
          </div>
          {actions ? <div className="row">{actions}</div> : null}
        </header>
      ) : null}
      {hasHead ? (children === null || children === undefined || children === false ? null : <div className="c-card__body">{children}</div>) : children}
      {footer ? <footer className="c-card__foot">{footer}</footer> : null}
    </section>
  );
}

/* Avatar with initials fallback ------------------------------------------ */
export function Avatar({ src, name, size, className }) {
  const [failed, setFailed] = useState(false);
  const cls = cx("c-avatar", size === "lg" && "c-avatar--lg", className);
  if (src && !failed) return <img className={cls} src={src} alt="" onError={() => setFailed(true)} />;
  const text = String(name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "?";
  return <span className={cx(cls, "c-avatar--placeholder")} aria-hidden="true">{text}</span>;
}

/* Stat tile --------------------------------------------------------------- */
export function StatTile({ label, value, hint, tone, className }) {
  return (
    <div className={cx("c-stat", tone && `c-stat--${tone}`, className)}>
      <span className="c-stat__label">{label}</span>
      <span className="c-stat__value">{value}</span>
      {hint ? <span className="c-stat__hint">{hint}</span> : null}
    </div>
  );
}
export function StatGrid({ children, className }) {
  return <div className={cx("c-stats", className)}>{children}</div>;
}

/* Page header ------------------------------------------------------------- */
export function PageHeader({ eyebrow, title, lead, actions, children }) {
  return (
    <header className="c-page-header">
      <div>
        {eyebrow ? <div className="c-page-header__eyebrow">{eyebrow}</div> : null}
        <h1 className="c-page-header__title">{title}</h1>
        {lead ? <p className="c-page-header__lead">{lead}</p> : null}
        {children}
      </div>
      {actions ? <div className="c-page-header__actions">{actions}</div> : null}
    </header>
  );
}
export function SectionTitle({ children, actions }) {
  return (
    <div className="c-section-title">
      <h2>{children}</h2>
      {actions ? <div className="row">{actions}</div> : null}
    </div>
  );
}

/* Alerts, empty state, skeleton ------------------------------------------- */
export function Alert({ tone = "info", title, children, className, role }) {
  const Icon = tone === "danger" || tone === "warning" ? IconAlert : tone === "success" ? IconCheck : IconInfo;
  return (
    <div className={cx("c-alert", `c-alert--${tone}`, className)} role={role || (tone === "danger" ? "alert" : "status")}>
      <Icon size={16} />
      <div className="c-alert__body">
        {title ? <strong>{title} </strong> : null}
        {children}
      </div>
    </div>
  );
}
export function EmptyState({ title, children, action }) {
  return (
    <div className="c-empty">
      {title ? <div className="c-empty__title">{title}</div> : null}
      {children ? <div>{children}</div> : null}
      {action ? <div style={{ marginTop: 8 }}>{action}</div> : null}
    </div>
  );
}
export function Skeleton({ kind = "text", width, height, className, count = 1 }) {
  const items = Array.from({ length: count });
  return items.map((_, i) => (
    <div key={i} className={cx("c-skeleton", `c-skeleton--${kind}`, className)} style={{ width, height }} aria-hidden="true" />
  ));
}
export function PageSkeleton() {
  return (
    <div className="shell page" aria-busy="true" aria-live="polite">
      <Skeleton kind="title" />
      <div style={{ height: 12 }} />
      <Skeleton kind="text" width="60%" />
      <div style={{ height: 24 }} />
      <div className="c-stats">
        <Skeleton kind="card" height={90} count={4} />
      </div>
      <div style={{ height: 24 }} />
      <Skeleton kind="row" count={6} />
    </div>
  );
}

/* Disclosure -------------------------------------------------------------- */
export function Disclosure({ title, defaultOpen = false, open: controlledOpen, onToggle, children, className }) {
  const [openState, setOpen] = useState(defaultOpen);
  const open = controlledOpen ?? openState;
  const id = useId();
  const toggle = () => {
    if (onToggle) onToggle(!open);
    if (controlledOpen === undefined) setOpen((v) => !v);
  };
  return (
    <div className={cx("c-disclosure", className)}>
      <button type="button" className="c-disclosure__summary" aria-expanded={open} aria-controls={id} onClick={toggle}>
        <span>{title}</span>
        <IconChevronDown size={16} />
      </button>
      {open ? <div id={id} className="c-disclosure__body">{children}</div> : null}
    </div>
  );
}

/* Tooltip (works on tap) -------------------------------------------------- */
export function Tooltip({ label = "Info", children, align }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <span className="c-tip" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="c-tip__btn"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
      >
        i
      </button>
      {open ? <span id={id} role="tooltip" className={cx("c-tip__panel", align === "left" && "c-tip__panel--left")}>{children}</span> : null}
    </span>
  );
}

/* Vote bar ---------------------------------------------------------------- */
export function VoteBar({ yes = 0, no = 0, abstain = 0, noConfidence = 0, thresholdPct, large, ariaLabel }) {
  const total = Math.max(0, Number(yes) + Number(no) + Number(abstain) + Number(noConfidence));
  const pct = (v) => (total > 0 ? (Number(v) / total) * 100 : 0);
  return (
    <div className={cx("c-bar", large && "c-bar--lg")} role="img" aria-label={ariaLabel || `Yes ${Math.round(pct(yes))}%, No ${Math.round(pct(no))}%, Abstain ${Math.round(pct(abstain))}%`}>
      <span className="c-bar__seg c-bar__seg--yes" style={{ width: `${pct(yes)}%` }} />
      <span className="c-bar__seg c-bar__seg--no" style={{ width: `${pct(no)}%` }} />
      <span className="c-bar__seg c-bar__seg--noconf" style={{ width: `${pct(noConfidence)}%` }} />
      <span className="c-bar__seg c-bar__seg--abstain" style={{ width: `${pct(abstain)}%` }} />
      {Number.isFinite(Number(thresholdPct)) && Number(thresholdPct) > 0 ? (
        <span className="c-bar__marker" style={{ left: `${Math.min(100, Number(thresholdPct))}%` }} title={`Threshold ${thresholdPct}%`} />
      ) : null}
    </div>
  );
}
export function ProgressBar({ value = 0, max = 100, tone = "accent", thresholdPct, large, ariaLabel }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (Number(value) / Number(max)) * 100)) : 0;
  return (
    <div className={cx("c-bar", large && "c-bar--lg")} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={ariaLabel}>
      <span className={`c-bar__seg c-bar__seg--${tone}`} style={{ width: `${pct}%` }} />
      {Number.isFinite(Number(thresholdPct)) && Number(thresholdPct) > 0 ? <span className="c-bar__marker" style={{ left: `${Math.min(100, Number(thresholdPct))}%` }} /> : null}
    </div>
  );
}
export function Legend({ items }) {
  return (
    <div className="c-legend">
      {items.map((item) => (
        <span key={item.label} className="c-legend__item">
          <span className="c-legend__swatch" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/* Form fields ------------------------------------------------------------- */
export function Field({ label, hint, error, children, className }) {
  const id = useId();
  return (
    <label className={cx("c-field", className)} htmlFor={id}>
      {label ? <span className="c-field__label">{label}</span> : null}
      {typeof children === "function" ? children(id) : children}
      {hint && !error ? <span className="c-field__hint">{hint}</span> : null}
      {error ? <span className="c-field__error">{error}</span> : null}
    </label>
  );
}
export function Input({ className, size, ...rest }) {
  return <input className={cx("c-input", size === "sm" && "c-input--sm", className)} {...rest} />;
}
export function Select({ className, size, children, ...rest }) {
  return <select className={cx("c-select", size === "sm" && "c-select--sm", className)} {...rest}>{children}</select>;
}
export function Textarea({ className, ...rest }) {
  return <textarea className={cx("c-textarea", className)} {...rest} />;
}
export function Switch({ checked, onChange, label, disabled }) {
  return (
    <label className="c-switch">
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange?.(e.target.checked)} disabled={disabled} />
      <span className="c-switch__track" aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
export function Checkbox({ checked, onChange, label, disabled, indeterminate }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = Boolean(indeterminate); }, [indeterminate]);
  return (
    <label className="c-check">
      <input ref={ref} type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange?.(e.target.checked)} disabled={disabled} />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
export function Chip({ active, count, children, ...rest }) {
  return (
    <button type="button" className={cx("c-chip", active && "is-active")} aria-pressed={Boolean(active)} {...rest}>
      {children}
      {count !== undefined ? <span className="c-chip__count">{count}</span> : null}
    </button>
  );
}
export function Segmented({ value, onChange, options, ariaLabel, disabled }) {
  return (
    <div className="c-segmented" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button key={o.value} type="button" className="c-segmented__btn" aria-pressed={o.value === value} onClick={() => onChange(o.value)} disabled={disabled}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

/* Key/value list ---------------------------------------------------------- */
export function KeyValue({ items }) {
  return (
    <dl className="c-kv">
      {items.filter(Boolean).map(([k, v]) => (
        <div key={String(k)} style={{ display: "contents" }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}


/* Copy to clipboard ------------------------------------------------------- */
export function CopyButton({ value, label = "Copy", size = "sm", variant = "ghost", children }) {
  const [ok, setOk] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(String(value ?? "")); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* clipboard unavailable */ }
  }
  return (
    <Button size={size} variant={variant} icon={ok ? <IconCheck size={14} /> : <IconCopy size={14} />} aria-label={ok ? "Copied" : label} title={label} onClick={copy}>
      {children ? (ok ? "Copied" : children) : null}
    </Button>
  );
}
