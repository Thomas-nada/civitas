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
import { Alert, Button, Card, CopyButton, KeyValue, Textarea } from "../../ui";

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
      <Card className="svy-signin">
        <h3 style={{ marginTop: 0 }}>Your session's credential cannot answer this survey</h3>
        <p className="muted small" style={{ maxWidth: 460, margin: "0 auto" }}>
          You are signed in with cardano-signer as {wallet?.roleLabel || "a CLI user"}. This survey accepts {eligible.join(", ") || "—"}.
          Sign in with a role it accepts, or connect a browser wallet that holds an eligible credential.
        </p>
      </Card>
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
    <div className="svy-respond stack">
      <Card title="Answer with your own keys">
        <p className="muted small svy-note">
          You are signed in with cardano-signer as <strong>{roleName}</strong>; this survey accepts that role. Answering as {roleName} means a transaction witnessed by {credential.signerKey}, which no browser wallet holds, so the steps are: answer here, carry the answer in a transaction you build and sign yourself, and submit it here or with cardano-cli. Your credential, your role and your answers go on chain publicly and permanently.
        </p>
        {!isOpen ? <p className="muted small svy-note">This survey is closed; it no longer accepts answers.</p> : null}

        {isOpen && !payload ? (
          <>
            <p className="muted small svy-note"><strong>Step 1.</strong> Fill in the survey and press its <strong>Sign &amp; submit</strong>: here that only finishes the answer. Nothing is signed in the browser.</p>
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
            ) : <p className="muted small svy-note">Loading the survey form…</p>}
          </>
        ) : null}

        {payload && phase.kind !== "done" ? (
          <div className="stack" style={{ marginTop: 12 }}>
            <p className="muted small svy-note">
              <strong>Step 2.</strong> Download the metadata file and build a transaction that carries it, with your {roleName} key hash as a required signer:
            </p>
            <div className="row">
              <Button variant="primary" onClick={() => downloadTextFile("civitas-survey-answer.json", metadataJson)}>Download civitas-survey-answer.json</Button>
              <CopyButton value={metadataJson} label="Copy JSON" variant="default">Copy JSON</CopyButton>
              <Button onClick={() => setPayload(null)}>Change answers</Button>
            </div>
            <KeyValue items={[[`Required signer hash (${roleName} key)`, <span key="k" className="mono break">{credential.keyHash}</span>], ["Metadata label", <span key="l" className="mono">17</span>], ["Witnesses", `your payment key and ${credential.signerKey}`]]} />
            <Button size="sm" variant="ghost" onClick={() => setShowCommands((v) => !v)}>{showCommands ? "Hide" : "Show"} cardano-cli steps</Button>
            {showCommands ? <pre>{commands.join("\n\n")}</pre> : null}

            <p className="muted small svy-note">
              <strong>Step 3.</strong> Paste the signed transaction (the contents of answer.signed, or its CBOR hex) to submit it through Koios, or submit it yourself and paste the transaction hash to watch it reach the index.
            </p>
            <Textarea className="mono" rows={5} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder='{ "type": "Witnessed Tx ConwayEra", "cborHex": "84a4..." }  or a transaction hash' aria-label="Signed transaction" />
            {phase.kind === "error" ? <Alert tone="danger">{phase.message}</Alert> : null}
            <div className="row">
              <Button variant="primary" disabled={!pasted.trim() || phase.kind === "submitting"} loading={phase.kind === "submitting"} onClick={submitPasted}>{phase.kind === "submitting" ? "Submitting…" : "Submit transaction"}</Button>
            </div>
          </div>
        ) : null}

        {phase.kind === "done" ? (
          <Alert tone="success" title={phase.self ? "Watching your transaction." : "Answer submitted."}>
            {indexed ? "The index has picked it up; the figures on this page now include it." : "The figures update once the index has seen the transaction, usually within a few minutes. This page checks for it automatically."}
            {" "}<a className="mono" href={explorerTxUrl(phase.txHash)} target="_blank" rel="noreferrer">{phase.txHash.slice(0, 16)}…</a>
          </Alert>
        ) : null}
      </Card>
    </div>
  );
}
