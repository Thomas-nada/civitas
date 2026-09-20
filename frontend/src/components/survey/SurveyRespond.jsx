// The answering panel for one CIP-179 survey: Tessera's own <tessera-respond>
// form fed with the signed-in wallet's credentials, narrowed to the roles the
// survey accepts; Civitas attaches the payload at label 17 and submits. Used
// by the survey page and, for a linked survey, inside the governance action
// page.
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { WalletContext } from "../../context/WalletContext";
import { explorerTxUrl } from "../../services/surveyNetwork";
import { Role, SurveyTxError, buildVoteAnchor, currentDrepAnchor, responderCredentials, submitLabel17Payload } from "../../services/surveyTxService";
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
  // A DRep vote carried in the same transaction (CIP-179 mechanism B).
  const [voteChoice, setVoteChoice] = useState(""); // "" | Yes | No | Abstain
  const [voteActionId, setVoteActionId] = useState("");
  const [voteRationaleUrl, setVoteRationaleUrl] = useState("");
  const [pendingResult, setPendingResult] = useState(null); // the form's payload after a failed submit
  const [voteNeeded, setVoteNeeded] = useState(false); // the wallet skipped the DRep key: a vote is the way through

  const eligible = survey.eligibleRoles || [];
  const isOpen = survey.lifecycle === "open";

  // The linked governance actions a DRep can still vote on. The ledger only
  // accepts votes on active actions, so an expired link cannot carry the proof.
  const votableLinks = useMemo(() => {
    const epoch = Number(data?.currentEpoch);
    return (survey.govLinks || []).filter((link) => link?.actionId && (!Number.isFinite(epoch) || Number(link.endEpoch) >= epoch));
  }, [survey.govLinks, data?.currentEpoch]);
  const voteLink = votableLinks.find((l) => l.actionId === voteActionId) || votableLinks[0] || null;

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

  // `proof` is how the DRep key gets into the transaction when the wallet
  // will not sign a bare required signer with it: "vote" (the chosen vote on
  // the linked action, CIP-179 mechanism B) or "drep-update" (a no-change
  // DRep update certificate, so the witness lands and mechanism A holds).
  const onResponse = useCallback(async (result, proof = voteChoice ? "vote" : "") => {
    if (!walletApi || status.kind === "submitting") return;
    setStatus({ kind: "submitting" });
    setPendingResult(result);
    try {
      const { bytesToHex } = await import("cip-179/domain");
      const signerHashes = (result.proveCredentials || [])
        .filter((p) => p.credential?.type === "key")
        .map((p) => bytesToHex(p.credential.keyHash));
      const drepId = wallet?.walletDrep?.dRepIDCip105 || "";
      let vote;
      let drepUpdate;
      if (proof === "vote" && voteChoice && voteLink && drepId) {
        const anchor = await buildVoteAnchor(voteRationaleUrl);
        vote = { drepId, actionId: voteLink.actionId, choice: voteChoice, anchor };
      } else if (proof === "drep-update" && drepId) {
        const { anchor, confirmedNone } = await currentDrepAnchor(drepId);
        drepUpdate = { drepId, anchor, confirmedNone };
      }
      const txHash = await submitLabel17Payload(walletApi, result.payload, signerHashes, { vote, drepUpdate });
      setStatus({ kind: "done", txHash, voted: vote ? { choice: vote.choice, title: voteLink.title || voteLink.actionId } : null, restated: Boolean(drepUpdate) });
      setPendingResult(null);
      setVoteNeeded(false);
    } catch (e) {
      if (e instanceof SurveyTxError && e.code === "unsigned-required-signer") {
        // Name the role whose key the wallet skipped. For the DRep key the
        // way through is a vote in the same transaction: wallets sign votes
        // with the DRep key, and CIP-179 takes a vote on a linked action as
        // proof of the credential (mechanism B).
        const roleOf = Object.fromEntries(Object.entries(credentials?.hashes || {}).map(([n, h]) => [String(h).toLowerCase(), Object.keys(ROLE_NUMBERS).find((name) => ROLE_NUMBERS[name] === Number(n)) || n]));
        const names = e.missing.map((h) => roleOf[h] || `key ${h.slice(0, 10)}…`);
        const drepSkipped = names.includes("DRep");
        if (drepSkipped && wallet?.walletDrep?.dRepIDCip105) {
          // Keep the signed transaction inspectable: which keys it carries
          // is the whole question when a wallet skips one.
          console.warn("[survey] DRep witness missing from the signed transaction", { attached: e.attached, missing: e.missing, signedTx: e.signedTx });
          setVoteNeeded(true);
          const attached = e.attached || {};
          let message;
          if (attached.drepUpdate) {
            message = `${wallet.walletName} was asked to sign a DRep update certificate and still did not sign with your DRep key, so this wallet uses that key for votes only. ${votableLinks.length > 0 ? "Cast your vote on the linked action below to answer as a DRep, or answer" : "Answer"} with your stake credential (choose Stakeholder in the form), or use a wallet that signs with the DRep key, such as Eternl.`;
          } else if (attached.vote) {
            message = `${wallet.walletName} did not sign with your DRep key even with the vote in the transaction. Answer with your stake credential (choose Stakeholder in the form), or use a wallet that signs with the DRep key, such as Eternl.`;
          } else {
            message = `${wallet.walletName} signed the transaction, but not with your DRep key: it uses that key only for a DRep vote or a DRep certificate. Pick one of the ways below to carry the key and submit again.`;
          }
          setStatus({ kind: "error", message, attempted: attached });
          return;
        }
        setStatus({
          kind: "error",
          message: `${wallet.walletName} signed the transaction, but not with your ${names.join(" / ")} key, so the network would reject it. ${drepSkipped ? "This wallet signs with the DRep key for votes and certificates, not for a survey answer on its own. Answer with your stake credential instead (choose Stakeholder in the form), or use a wallet that signs required signers with the DRep key, such as Eternl." : "Choose another role in the form, or use a different wallet."}`,
          });
        return;
      }
      setStatus({ kind: "error", message: readableError(e, "The transaction could not be submitted.") });
    }
  }, [walletApi, status.kind, credentials, wallet?.walletName, wallet?.walletDrep?.dRepIDCip105, voteChoice, voteLink, voteRationaleUrl, votableLinks.length]);

  const canOfferVote = Boolean(isOpen && wallet?.actingAsDrep && credentials?.responder?.[Role.DRep] && (votableLinks.length > 0 || voteNeeded));

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
            {status.voted ? `Your ${status.voted.choice} vote on "${status.voted.title}" went on chain in the same transaction. ` : ""}
            {status.restated ? "The transaction re-stated your current DRep metadata anchor (no change) so the wallet would sign it with the DRep key. " : ""}
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
          {canOfferVote ? (
            <div className={`svy-vote${voteNeeded ? " svy-vote--needed" : ""}`}>
              {voteNeeded && pendingResult ? (
                <div className="svy-proof-alt">
                  <div className="svy-vote-head"><strong>Answer without voting</strong></div>
                  <p className="muted svy-respond-note">
                    The transaction carries a DRep update certificate that re-states your current DRep metadata anchor. Nothing about your DRep changes and there is no deposit, only the network fee; the wallet shows it as a DRep update and signs it with the DRep key, which is the signature this answer needs.
                  </p>
                  {status.kind !== "submitting" && !status.attempted?.drepUpdate ? (
                    <button type="button" className="btn-primary" onClick={() => onResponse(pendingResult, "drep-update")}>Submit the answer without a vote</button>
                  ) : null}
                  {status.attempted?.drepUpdate ? <p className="vote-notice" style={{ margin: 0 }}>Tried: the wallet did not sign the certificate with the DRep key.</p> : null}
                </div>
              ) : null}
              {votableLinks.length > 0 ? (
                <>
                  <div className="svy-vote-head">
                    <strong>{voteNeeded ? "Or cast your DRep vote with this answer" : "Also cast your DRep vote in the same transaction"}</strong>
                    {!voteNeeded ? <span className="muted">optional</span> : null}
                  </div>
                  <p className="muted svy-respond-note">
                    {votableLinks.length === 1 ? (
                      <>The survey is linked to <em>{voteLink?.title || voteLink?.actionId}</em>. </>
                    ) : "This survey is linked to several governance actions. "}
                    A vote on a linked action is a real governance vote, and under CIP-179 it also proves your DRep credential for this answer. A later vote replaces an earlier one.
                  </p>
                </>
              ) : null}
              {votableLinks.length > 1 ? (
                <select className="svy-vote-select" value={voteLink?.actionId || ""} onChange={(e) => setVoteActionId(e.target.value)}>
                  {votableLinks.map((link) => <option key={link.actionId} value={link.actionId}>{link.title || link.actionId}</option>)}
                </select>
              ) : null}
              {votableLinks.length > 0 ? (
              <div className="svy-vote-choices" role="group" aria-label="DRep vote">
                {!voteNeeded ? (
                  <button type="button" className={`svy-vote-btn${voteChoice === "" ? " active" : ""}`} onClick={() => setVoteChoice("")}>No vote</button>
                ) : null}
                {["Yes", "No", "Abstain"].map((choice) => (
                  <button key={choice} type="button" className={`svy-vote-btn svy-vote-btn--${choice.toLowerCase()}${voteChoice === choice ? " active" : ""}`} onClick={() => setVoteChoice(choice)}>{choice}</button>
                ))}
              </div>
              ) : null}
              {voteChoice ? (
                <label className="svy-vote-rationale">
                  <span className="muted">Rationale URL (optional, CIP-100 document)</span>
                  <input type="url" placeholder="https://… or ipfs://…" value={voteRationaleUrl} onChange={(e) => setVoteRationaleUrl(e.target.value)} />
                </label>
              ) : null}
              {voteNeeded && pendingResult && votableLinks.length > 0 && status.kind !== "submitting" ? (
                <button type="button" className="btn-primary" disabled={!voteChoice} onClick={() => onResponse(pendingResult, "vote")}>
                  {voteChoice ? `Vote ${voteChoice} and submit the answer` : "Choose a vote to continue"}
                </button>
              ) : null}
            </div>
          ) : null}
          {status.kind === "submitting" ? <p className="muted svy-respond-note">Awaiting wallet signature…</p> : null}
          {status.kind === "error" ? (
            <p className="vote-error">{status.message} {!voteNeeded ? <button type="button" className="link-btn" onClick={() => setStatus({ kind: "idle" })}>Try again</button> : null}</p>
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
