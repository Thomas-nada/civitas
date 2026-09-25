import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { IconClose } from "./icons";
import { Button } from "./primitives";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal: focus trap, Escape and backdrop close, scroll lock,
 * focus returned to the opener, labelled by its title.
 */
export default function Modal({ open, onClose, title, size, children, footer, closeLabel = "Close", initialFocusRef }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const openerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    openerRef.current = document.activeElement;
    document.body.classList.add("c-scroll-locked");
    const panel = panelRef.current;
    const focusFirst = () => {
      const target = initialFocusRef?.current || panel?.querySelector(FOCUSABLE);
      (target || panel)?.focus?.();
    };
    const raf = requestAnimationFrame(focusFirst);
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose?.(); return; }
      if (e.key !== "Tab" || !panel) return;
      const nodes = Array.from(panel.querySelectorAll(FOCUSABLE)).filter((n) => n.offsetParent !== null || n === document.activeElement);
      if (nodes.length === 0) { e.preventDefault(); return; }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("c-scroll-locked");
      const opener = openerRef.current;
      if (opener && typeof opener.focus === "function") opener.focus();
    };
  }, [open, onClose, initialFocusRef]);

  if (!open) return null;
  return createPortal(
    <div className="c-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div
        ref={panelRef}
        className={`c-modal${size ? ` c-modal--${size}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        <div className="c-modal__head">
          {title ? <h2 id={titleId} className="c-modal__title">{title}</h2> : <span />}
          <Button variant="ghost" size="sm" icon={<IconClose size={18} />} aria-label={closeLabel} title={closeLabel} onClick={onClose} />
        </div>
        <div className="c-modal__body">{children}</div>
        {footer ? <div className="c-modal__foot">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
