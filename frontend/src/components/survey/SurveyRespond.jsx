// The answering panel for one CIP-179 survey: Tessera's own <tessera-respond>
// form fed with the signed-in wallet's credentials, narrowed to the roles the
// survey accepts; Civitas attaches the payload at label 17 and submits. Used
// by the survey page and, for a linked survey, inside the governance action
// page.
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { WalletContext } from "../../context/WalletContext";
import { explorerTxUrl } from "../../services/surveyNetwork";
import { Role, responderCredentials, submitLabel17Payload } from "../../services/surveyTxService";
import { readableError } from "../../lib/wallet/walletError";
import { lifecycleLabel } from "../../services/surveyPresentation";
import TesseraRespond from "./TesseraRespond";

const ROLE_NUMBERS = { DRep: Role.DRep, SPO: Role.SPO, CC: Role.CC, Stakeholder: Role.Stakeholder, Keyholder: Role.Keyholder };

export default function SurveyRespond({ survey, data, onSubmitted, heading = "Answer this survey", compact = false }) {
  const wallet = useContext(WalletContext);
  const walletApi = wallet?.walletApi;
  const [credentials, setCredentials] = useState(null); // { responder, hashes } | null
  const [credentialError, setCredentialError] = useState("");
  const [record, setRecord] = useState(null);
  const [status, setStatus] = useState({ kind: "idle" }); // idle | submitting | done | error
  const [indexed, setIndexed] = useState(false);

  const eligible = survey.eligibleRoles || [];
  const isOpen = survey.lifecycle === "open";

  // The wallet's credentials, narrowed to the roles this survey accepts. A
  // DRep credential is offered only to a registered DRep signed in with the
  // DRep key, so an answer is never recorded against a DRep the session did
  // not prove.
  useEffect(() => {
    if (!walletApi) { setCredentials(null); return undefined; }
    let alive = true;
    setCredentialError("");
    responderCredentials(walletApi, { includeDrep: Boolean(wallet?.actingAsDrep), drepPubKeyHex: wallet?.walletDrep?.pubDRepKey || "" })
      .then(({ responder, hashes }) => {
        if (!alive) return;
        const allowed = new Set(eligible.map((name) => ROLE_NUMBERS[name]).filter((n) => n != null));
        const narrowed = {};
        const narrowedHashes = {};
        for (const [role, credential] of Object.entries(responder)) {
          if (allowed.has(Number(role))) { narrowed[role] = credential; narrowedHashes[role] = hashes[role]; }
        }
        setCredentials({ responder: narrowed, hashes: narrowedHashes });
      })
      .catch((e) => { if (alive) setCredentialError(readableError(e, "Could not read the wallet's credentials.")); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletApi, wallet?.actingAsDrep, wallet?.walletDrep?.pubDRepKey, survey.key]);

  // The stored record is the wire form cip-179 wrote; the widget wants it
  // decoded (bytes, bigints) so it signs the record as it is on chain.
  useEffect(() => {
    let alive = true;
    setRecord(null);
    if (!survey.record) return undefined;
    import("cip-179/tally")
      .then(({ decodeSurveyRecord }) => { if (alive) setRecord(decodeSurveyRecord(survey.record)); })
      .catch(() => { if (alive) setCredentialError("The survey definition could not be decoded for the form."); });
    return () => { alive = false; };
  }, [survey.record]);

  // Once submitted, watch the index until the transaction is picked up.
  useEffect(() => {
    if (status.kind !== "done" || indexed) return undefined;
    let alive = true;
    let tries = 0;
    const tick = async () => {
      tries += 1;
      try {
        const res = await fetch(`/api/surveys/tx/${status.txHash}`);
        const state = await res.json();
        if (alive && state?.indexed) { setIndexed(true); onSubmitted?.(); }
      } catch {
        // Try again on the next tick.
      }
    };
    const id = setInterval(() => { if (tries < 45) tick(); }, 20_000);
    return () => { alive = false; clearInterval(id); };
  }, [status, indexed, onSubmitted]);

  const priorAnswers = useMemo(() => {
    if (!credentials) return [];
    const mine = new Set(Object.values(credentials.hashes));
    return (data?.responses || []).filter((r) => mine.has(r.credentialHash));
  }, [credentials, data]);

  const onResponse = useCallback(async (result) => {
    if (!walletApi || status.kind === "submitting") return;
    setStatus({ kind: "submitting" });
    try {
      const { bytesToHex } = await import("cip-179/domain");
      const signerHashes = (result.proveCredentials || [])
        .filter((p) => p.credential?.type === "key")
        .map((p) => bytesToHex(p.credential.keyHash));
      const txHash = await submitLabel17Payload(walletApi, result.payload, signerHashes);
      setStatus({ kind: "done", txHash });
    } catch (e) {
      setStatus({ kind: "error", message: readableError(e, "The transaction could not be submitted.") });
    }
  }, [walletApi, status.kind]);

  const panelClass = compact ? "svy-respond-inner" : "panel";
  const panelStyle = compact ? undefined : { padding: "1rem 1.1rem" };

  if (!walletApi) {
    return (
      <section className={panelClass} style={{ ...(panelStyle || {}), textAlign: "center", padding: compact ? "1.4rem 1rem" : "2.5rem 1.5rem" }}>
        <h2 style={{ marginTop: 0, fontSize: compact ? "1rem" : undefined }}>{wallet?.isCliSession ? "A browser wallet is needed to answer" : "Sign in with a wallet to answer"}</h2>
        <p className="muted" style={{ maxWidth: "460px", margin: "0 auto 1rem" }}>
          {wallet?.isCliSession
            ? "You are signed in with cardano-signer, which cannot sign a browser transaction. Connect a wallet that holds an eligible credential, or answer from Tessera with your own tooling."
            : `Answering records your answers on chain as one small transaction (you pay the network fee only). Your wallet must hold a credential this survey accepts: ${eligible.join(", ") || "—"}.`}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
          {!wallet?.isCliSession && typeof wallet?.openSignIn === "function" ? (
            <button type="button" className="btn-primary" onClick={() => wallet.openSignIn()}>Sign in</button>
          ) : null}
          {survey.tesseraUrl ? (
            <a className="ext-link" href={survey.tesseraUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.82rem" }}>Open on Tessera ↗</a>
          ) : null}
        </div>
      </section>
    );
  }

  const roles = credentials ? Object.keys(credentials.responder).map((n) => Object.keys(ROLE_NUMBERS).find((name) => ROLE_NUMBERS[name] === Number(n))) : [];
  const disclosure = survey.sealed
    ? "Your answers stay encrypted until the survey's reveal time, but your credential and your role are public on chain, permanently."
    : "Your credential, your role and your answers go on chain publicly and permanently.";

  return (
    <div className="svy-respond">
      {status.kind === "done" ? (
        <section className={`${panelClass} svy-success`} style={panelStyle}>
          <strong>Answer submitted.</strong>
          <span className="muted">
            {indexed
              ? "The index has picked it up; the figures now include it."
              : "The figures update once the index has seen the transaction, usually within a few minutes. This page checks for it automatically."}
          </span>
          <span className="mono" style={{ fontSize: "0.8rem" }}>
            Transaction: <a className="ext-link" href={explorerTxUrl(status.txHash)} target="_blank" rel="noreferrer">{status.txHash}</a>
          </span>
        </section>
      ) : null}

      {status.kind !== "done" ? (
        <section className={panelClass} style={panelStyle}>
          {heading ? <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.05rem" }}>{heading}</h2> : null}
          {!isOpen ? (
            <p className="muted svy-respond-note">This survey is {lifecycleLabel(survey.lifecycle).toLowerCase()}; it no longer accepts answers.</p>
          ) : null}
          <p className="muted svy-respond-note">
            Answering as <strong>{wallet.walletName}</strong>
            {roles.length ? <> with your {roles.join(" / ")} credential{roles.length > 1 ? "s" : ""}.</> : "."}{" "}
            {disclosure} The wallet pays only the network fee.
          </p>
          {eligible.includes("DRep") && !wallet.actingAsDrep ? (
            <p className="muted svy-respond-note">
              To answer as a DRep, sign in as a DRep (a registered DRep with the DRep key). Signed in as {wallet.roleLabel}, this wallet answers with its stake or payment credential where the survey allows it.
            </p>
          ) : null}
          {priorAnswers.length ? (
            <p className="muted svy-respond-note">
              You already answered this survey ({priorAnswers.length === 1 ? "1 response" : `${priorAnswers.length} responses`} on chain). A new answer replaces the earlier one in full and costs another network fee.
            </p>
          ) : null}
          {credentialError ? <p className="vote-error">{credentialError}</p> : null}
          {credentials && Object.keys(credentials.responder).length === 0 ? (
            <p className="vote-notice">
              This wallet holds no credential this survey accepts ({eligible.join(", ")}). {eligible.includes("DRep") && !wallet.actingAsDrep ? "Sign in as a DRep to answer with your DRep key." : ""}
            </p>
          ) : null}
          {status.kind === "submitting" ? <p className="muted svy-respond-note">Awaiting wallet signature…</p> : null}
          {status.kind === "error" ? (
            <p className="vote-error">{status.message} <button type="button" className="link-btn" onClick={() => setStatus({ kind: "idle" })}>Try again</button></p>
          ) : null}
          {isOpen && record && credentials && Object.keys(credentials.responder).length > 0 ? (
            <TesseraRespond
              definition={record.definition}
              surveyRef={record.ref}
              responder={credentials.responder}
              initialRole={credentials.responder[Role.DRep] ? Role.DRep : undefined}
              tipEpoch={data?.currentEpoch}
              cancelled={survey.lifecycle === "cancelled"}
              onResponse={onResponse}
              onError={(e) => setStatus({ kind: "error", message: e.message })}
            />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
