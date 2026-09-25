import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Click-to-open dropdown with outside-click and Escape close, arrow-key
 * navigation and correct aria-expanded. `trigger` renders the button and
 * receives { open, props } where props must be spread on the button.
 */
export function Menu({ trigger, children, align = "left", label, className }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => {
      if (e.key === "Escape") { setOpen(false); rootRef.current?.querySelector("[aria-haspopup]")?.focus(); return; }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const items = Array.from(rootRef.current?.querySelectorAll('[role="menuitem"]') || []);
      if (items.length === 0) return;
      e.preventDefault();
      const idx = items.indexOf(document.activeElement);
      const next = e.key === "ArrowDown" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
      items[next].focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const close = () => setOpen(false);
  return (
    <div ref={rootRef} className={`c-menu-root${className ? ` ${className}` : ""}`} style={{ position: "relative", display: "inline-flex" }}>
      {trigger({ open, props: { "aria-haspopup": "menu", "aria-expanded": open, "aria-controls": id, onClick: () => setOpen((v) => !v) } })}
      {open ? (
        <div id={id} className="c-menu" role="menu" aria-label={label} style={align === "right" ? { right: 0, top: "calc(100% + 6px)" } : { left: 0, top: "calc(100% + 6px)" }}>
          {typeof children === "function" ? children({ close }) : children}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({ to, href, onClick, active, danger, icon, children, close, ...rest }) {
  const cls = `c-menu__item${active ? " is-active" : ""}${danger ? " c-menu__item--danger" : ""}`;
  const handle = (e) => { onClick?.(e); close?.(); };
  if (to) return <Link to={to} className={cls} role="menuitem" onClick={handle} {...rest}>{icon}{children}</Link>;
  if (href) return <a href={href} className={cls} role="menuitem" onClick={handle} {...rest}>{icon}{children}</a>;
  return <button type="button" className={cls} role="menuitem" onClick={handle} {...rest}>{icon}{children}</button>;
}
export function MenuSeparator() { return <div className="c-menu__sep" role="separator" />; }
export function MenuLabel({ children }) { return <div className="c-menu__label">{children}</div>; }
