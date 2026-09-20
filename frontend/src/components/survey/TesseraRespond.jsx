// React host for Tessera's <tessera-respond> custom element, the reference
// CIP-179 answering form. The widget owns the questions, validation and (for
// a sealed survey) the timelock encryption, and emits a ready-to-attach
// label-17 payload; Civitas keeps the wallet, the transaction and the network
// checks. Object props must be set as DOM properties (React would otherwise
// stringify them into attributes), and the widget's events are CustomEvents,
// so both go through a ref. The bundle (~0.8 MB) loads on first render only:
// most visitors read a survey, few answer it.
import { useEffect, useRef, useState } from "react";

export default function TesseraRespond({
  definition,
  surveyRef,
  responder,
  tipEpoch,
  cancelled = false,
  priorResponses,
  initialRole,
  onResponse,
  onError
}) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelledLoad = false;
    import("cardano-tessera-respond")
      .then(() => { if (!cancelledLoad) setReady(true); })
      .catch(() => {
        if (!cancelledLoad) onError?.(new Error("Could not load the survey form. This page may be outdated after a site update; reload and try again."));
      });
    return () => { cancelledLoad = true; };
    // onError is stable for the panel's lifetime; the load happens once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !ready) return;
    // The element renders as soon as the last required prop is set.
    el.responder = responder;
    el.definition = definition;
    el.surveyRef = surveyRef;
    el.tipEpoch = Number(tipEpoch);
    el.cancelled = Boolean(cancelled);
    if (priorResponses) el.priorResponses = priorResponses;
    if (initialRole != null) el.initialRole = initialRole;
  }, [ready, definition, surveyRef, responder, tipEpoch, cancelled, priorResponses, initialRole]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const handler = (event) => onResponse?.(event.detail);
    el.addEventListener("tessera:response", handler);
    return () => el.removeEventListener("tessera:response", handler);
  }, [onResponse]);

  return (
    <div className="svy-widget">
      {!ready ? <p className="muted svy-widget-loading">Loading the survey form…</p> : null}
      <tessera-respond ref={ref} />
    </div>
  );
}
