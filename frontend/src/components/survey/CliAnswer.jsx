// Answering from a cardano-signer session: the same Tessera form, answered
// with the session's role credential (pool cold key, CC hot key, DRep key);
// the finished payload becomes a cardano-cli metadata file, the user builds
// and signs the transaction with their own keys, and pastes it back here to
// submit through Koios, or submits it themselves and pastes the hash.
import { useContext, useEffect, useMemo, useState } from "react";
import { WalletContext } from "../../context/WalletContext";
import { explorerTxUrl } from "../../services/surveyNetwork";
import { cliCommands, cliCredential, downloadTextFile, metadataFileJson, signedTxHexFrom, submitSignedHex } from "../../services/surveyCli";
import { readableError } from "../../lib/wallet/walletError";
import TesseraRespond from "./TesseraRespond";

const ROLE_NAMES_BY_NUMBER = { 0: "DRep", 1: "SPO", 2: "CC", 3: "Stakeholder", 4: "Keyholder" };

export default function CliAnswer({ survey, data, onSubmitted }) {
  const wallet = useContext(WalletContext);
  const credential = useMemo(() => cliCredential(wallet?.signerIdentity), [wallet?.signerIdentity]);
  const [record, setRecord] = useState(null);
  const [payload, setPayload] = useState(null); // the form's finished Metadatum
  const [pasted, setPasted] = useState("");
  const [phase, setPhase] = useState({ kind: "idle" }); // idle | submitting | done | error
  const [indexed, setIndexed] = useState(false);
  const [showCommands, setShowCommands] = useState(false);

  const eligible = survey.eligibleRoles || [];
  const roleName = credential ? ROLE_NAMES_BY_NUMBER[credential.role] : "";
  const roleAccepted = Boolean(credential && eligible.includes(roleName));
  const isOpen = survey.lifecycle === "open";

  useEffect(() => {
    let alive = true;
    setRecord(null);
    if (!survey.record) return undefined;
    import("cip-179/tally")
      .then(({ decodeSurveyRecord }) => { if (alive) setRecord(decodeSurveyRecord(survey.record)); })
      .catch(() => {});
    return () => { alive = false; };
  }, [survey.record]);

  // Watch the index once a transaction is known.
  useEffect(() => {
    if (phase.kind !== "done" || indexed) return undefined;
    let alive = true;
    let tries = 0;
    const tick = async () => {
      tries += 1;
      try {
        const res = await fetch(`/api/surveys/tx/${phase.txHash}`);
        const state = await res.json();
        if (alive && state?.indexed) { setIndexed(true); onSubmitted?.(); }
      } catch {
        // next tick
      }
    };
    tick();
    const id = setInterval(() => { if (tries < 45) tick(); }, 20_000);
    return () => { alive = false; clearInterval(id); };
  }, [phase, indexed, onSubmitted]);

  if (!credential || !roleAccepted) {
    return (
      <section className="panel" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>Your session's credential cannot answer this survey</h2>
        <p className="muted" style={{ maxWidth: "460px", margin: "0 auto 1rem" }}>
          You are signed in with cardano-signer as {wallet?.roleLabel || "a CLI user"}. This survey accepts {eligible.join(", ") || "—"}.
          Sign in with a role it accepts, or connect a browser wallet that holds an eligible credential.
        </p>
      </section>
    );
  }

  const metadataJson = payload ? metadataFileJson(payload) : "";
  const commands = cliCommands(credential);

  async function submitPasted() {
    const text = pasted.trim();
    if (!text || phase.kind === "submitting") return;
    if (/^[0-9a-f]{64}$/i.test(text)) { setPhase({ kind: "done", txHash: text.toLowerCase(), self: true }); return; }
    const hex = signedTxHexFrom(text);
    if (!hex) { setPhase({ kind: "error", message: "Paste the signed transaction: the contents of answer.signed (JSON with cborHex) or its raw CBOR hex, or a 64-character transaction hash you already submitted." }); return; }
    setPhase({ kind: "submitting" });
    try {
      const txHash = await submitSignedHex(hex);
      setPhase({ kind: "done", txHash, self: false });
    } catch (e) {
      setPhase({ kind: "error", message: readableError(e, "The transaction could not be submitted.") });
    }
  }

  return (
    <div className="svy-respond">
      <section className="panel" style={{ padding: "1rem 1.1rem" }}>
        <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.05rem" }}>Answer with your own keys</h2>
        <p className="muted svy-respond-note">
          You are signed in with cardano-signer as <strong>{roleName}</strong>; this survey accepts that role. Answering as {roleName} means a transaction witnessed by {credential.signerKey}, which no browser wallet holds, so the steps are: answer here, carry the answer in a transaction you build and sign yourself, and submit it here or with cardano-cli. Your credential, your role and your answers go on chain publicly and permanently.
        </p>
        {!isOpen ? <p className="muted svy-respond-note">This survey is closed; it no longer accepts answers.</p> : null}

        {isOpen && !payload ? (
          <>
            <p className="muted svy-respond-note"><strong>Step 1.</strong> Fill in the survey and press its <strong>Sign &amp; submit</strong>: here that only finishes the answer. Nothing is signed in the browser.</p>
            {record ? (
              <TesseraRespond
                definition={record.definition}
                surveyRef={record.ref}
                responder={{ [credential.role]: { type: "key", keyHash: Uint8Array.from(credential.keyHash.match(/.{2}/g).map((b) => parseInt(b, 16))) } }}
                tipEpoch={data?.currentEpoch}
                cancelled={false}
                onResponse={(result) => setPayload(result.payload)}
                onError={(e) => setPhase({ kind: "error", message: e.message })}
              />
            ) : <p className="muted svy-respond-note">Loading the survey form…</p>}
          </>
        ) : null}

        {payload && phase.kind !== "done" ? (
          <div className="svy-cli">
            <p className="muted svy-respond-note">
              <strong>Step 2.</strong> Download the metadata file and build a transaction that carries it, with your {roleName} key hash as a required signer:
            </p>
            <div className="svy-cli-row">
              <button type="button" className="btn-primary" onClick={() => downloadTextFile("civitas-survey-answer.json", metadataJson)}>Download civitas-survey-answer.json</button>
              <button type="button" className="mode-btn" onClick={() => navigator.clipboard?.writeText(metadataJson)}>Copy JSON</button>
              <button type="button" className="mode-btn" onClick={() => setPayload(null)}>Change answers</button>
            </div>
            <dl className="svy-facts svy-cli-facts">
              <div><dt>Required signer hash ({roleName} key)</dt><dd className="mono">{credential.keyHash}</dd></div>
              <div><dt>Metadata label</dt><dd className="mono">17</dd></div>
              <div><dt>Witnesses</dt><dd>your payment key and {credential.signerKey}</dd></div>
            </dl>
            <button type="button" className="link-btn" onClick={() => setShowCommands((v) => !v)}>{showCommands ? "Hide" : "Show"} cardano-cli steps</button>
            {showCommands ? <pre className="svy-cli-pre">{commands.join("\n\n")}</pre> : null}

            <p className="muted svy-respond-note">
              <strong>Step 3.</strong> Paste the signed transaction (the contents of answer.signed, or its CBOR hex) to submit it through Koios, or submit it yourself and paste the transaction hash to watch it reach the index.
            </p>
            <textarea
              className="svy-cli-textarea"
              rows={5}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder='{ "type": "Witnessed Tx ConwayEra", "cborHex": "84a4..." }  or a transaction hash'
            />
            {phase.kind === "error" ? <p className="vote-error">{phase.message}</p> : null}
            <div className="svy-cli-row">
              <button type="button" className="btn-primary" disabled={!pasted.trim() || phase.kind === "submitting"} onClick={submitPasted}>
                {phase.kind === "submitting" ? "Submitting…" : "Submit transaction"}
              </button>
            </div>
          </div>
        ) : null}

        {phase.kind === "done" ? (
          <div className="svy-success" style={{ padding: 0 }}>
            <strong>{phase.self ? "Watching your transaction." : "Answer submitted."}</strong>
            <span className="muted">
              {indexed
                ? "The index has picked it up; the figures on this page now include it."
                : "The figures update once the index has seen the transaction, usually within a few minutes. This page checks for it automatically."}
            </span>
            <span className="mono" style={{ fontSize: "0.8rem" }}>
              Transaction: <a className="ext-link" href={explorerTxUrl(phase.txHash)} target="_blank" rel="noreferrer">{phase.txHash}</a>
            </span>
          </div>
        ) : null}
      </section>
    </div>
  );
}
