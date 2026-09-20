// One CIP-179 survey, read from Tessera through /api/surveys: the record, its
// responses, the informational tally, and the answering panel. Answering is
// Tessera's own <tessera-respond> form; Civitas supplies the wallet, checks
// the network, attaches the payload at label 17 and submits.
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { WalletContext } from "../context/WalletContext";
import { deadlineLabel, explorerTxUrl, formatUnixDate } from "../services/surveyNetwork";
import {
  Role,
  buildAndSubmitSurveyCancellation,
  getConnectedPaymentKeyHash,
  responderCredentials,
  submitLabel17Payload
} from "../services/surveyTxService";
import { readableError } from "../lib/wallet/walletError";
import { lifecycleLabel, participationLabel } from "../services/surveyPresentation";
import SurveyBadges from "../components/survey/SurveyBadges";
import SurveyTally from "../components/survey/SurveyTally";
import TesseraRespond from "../components/survey/TesseraRespond";

const ROLE_COLORS = {
  DRep: "var(--mint)",
  SPO: "var(--amber)",
  CC: "#a78bfa",
  Stakeholder: "rgba(200,200,210,0.6)",
  Keyholder: "rgba(200,200,210,0.6)"
};

const ROLE_NUMBERS = { DRep: Role.DRep, SPO: Role.SPO, CC: Role.CC, Stakeholder: Role.Stakeholder, Keyholder: Role.Keyholder };

const EXCLUSION_LABELS = {
  "after-deadline": "after the deadline",
  invalid: "invalid",
  unproven: "credential not proven",
  superseded: "replaced by a later answer",
  undecryptable: "did not reveal"
};

function shortHash(value, head = 10, tail = 6) {
  const s = String(value || "");
  return s.length <= head + tail + 1 ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function RolePill({ role }) {
  const color = ROLE_COLORS[role] || "rgba(200,200,210,0.5)";
  return (
    <span className="pill" style={{ background: `${color}22`, borderColor: `${color}88`, color }}>{role}</span>
  );
}

// Retries a survey that is not in the index yet (a just-published one).
function PendingPoller({ onTick }) {
  useEffect(() => {
    const id = setInterval(onTick, 20_000);
    return () => clearInterval(id);
  }, [onTick]);
  return null;
}

// ── Answering ────────────────────────────────────────────────────────────────

function RespondPanel({ survey, data, onSubmitted }) {
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
    responderCredentials(walletApi, { includeDrep: Boolean(wallet?.actingAsDrep) })
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
  }, [walletApi, wallet?.actingAsDrep, survey.key]);

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

  if (!walletApi) {
    return (
      <section className="panel" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>{wallet?.isCliSession ? "A browser wallet is needed to answer" : "Sign in with a wallet to answer"}</h2>
        <p className="muted" style={{ maxWidth: "460px", margin: "0 auto 1rem" }}>
          {wallet?.isCliSession
            ? "You are signed in with cardano-signer, which cannot sign a browser transaction. Connect a wallet that holds an eligible credential, or answer from Tessera with your own tooling."
            : `Answering records your answers on chain as one small transaction (you pay the network fee only). Your wallet must hold a credential this survey accepts: ${eligible.join(", ") || "—"}. Use Sign in in the top bar.`}
        </p>
        {survey.tesseraUrl ? (
          <a className="ext-link" href={survey.tesseraUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.82rem" }}>Open on Tessera ↗</a>
        ) : null}
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
        <section className="panel svy-success" style={{ padding: "1rem 1.1rem" }}>
          <strong>Answer submitted.</strong>
          <span className="muted">
            {indexed
              ? "The index has picked it up; the figures on this page now include it."
              : "The figures on this page update once the index has seen the transaction, usually within a few minutes. This page checks for it automatically."}
          </span>
          <span className="mono" style={{ fontSize: "0.8rem" }}>
            Transaction: <a className="ext-link" href={explorerTxUrl(status.txHash)} target="_blank" rel="noreferrer">{status.txHash}</a>
          </span>
        </section>
      ) : null}

      {status.kind !== "done" ? (
        <section className="panel" style={{ padding: "1rem 1.1rem" }}>
          <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.05rem" }}>Answer this survey</h2>
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

// ── Page ────────────────────────────────────────────────────────────────────

export default function SurveyDetailPage() {
  const { txHash, surveyIndex } = useParams();
  const index = Number(surveyIndex ?? 0);
  const wallet = useContext(WalletContext);
  const walletApi = wallet?.walletApi;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState("results");
  const [connectedKeyHash, setConnectedKeyHash] = useState(null);
  const [cancelState, setCancelState] = useState("idle"); // idle | submitting | done | error
  const [cancelError, setCancelError] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/surveys/${txHash}/${index}`);
      const payload = await res.json().catch(() => ({}));
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error(payload.error || "Failed to load survey.");
      setNotFound(false);
      setData(payload);
    } catch (e) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [txHash, index]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!walletApi) { setConnectedKeyHash(null); return; }
    getConnectedPaymentKeyHash(walletApi).then(setConnectedKeyHash).catch(() => setConnectedKeyHash(null));
  }, [walletApi]);

  const survey = data?.survey;
  useSeoMeta({
    title: survey?.title ? `${survey.title} — Survey` : "Governance Survey",
    description: survey?.description || "A CIP-179 on-chain Cardano governance survey."
  });

  const responses = useMemo(() => data?.responses || [], [data]);
  const questions = survey?.questions || [];
  const isOwner = Boolean(survey && connectedKeyHash && survey.owner?.type === "key" && survey.owner.hash === connectedKeyHash);
  const onSubmitted = useCallback(() => { load(true); }, [load]);
  const retry = useCallback(() => { load(true); }, [load]);

  async function handleCancelSurvey() {
    if (!walletApi || !survey) return;
    if (!window.confirm("Cancel this survey on chain? This cannot be undone.")) return;
    setCancelState("submitting");
    setCancelError("");
    try {
      await buildAndSubmitSurveyCancellation(walletApi, survey.txHash, survey.index);
      setCancelState("done");
    } catch (e) {
      setCancelState("error");
      setCancelError(readableError(e, "Cancellation could not be submitted."));
    }
  }

  if (loading) {
    return (
      <main className="shell">
        <header className="hero"><h1>Survey</h1></header>
        <section className="status-row"><p className="muted">Loading…</p></section>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="shell">
        <header className="hero"><h1>Survey</h1></header>
        <section className="status-row">
          <p className="muted">
            This survey is not in the index yet. A just-published survey appears once its transaction is confirmed and the index has read it, usually within a few minutes; this page checks again automatically.
          </p>
          <PendingPoller onTick={retry} />
        </section>
      </main>
    );
  }

  if (error || !survey) {
    return (
      <main className="shell">
        <header className="hero"><h1>Survey</h1></header>
        <section className="status-row">
          <p className="vote-error">{error || "Failed to load survey."}</p>
          <button type="button" className="mode-btn" onClick={() => load()}>Try again</button>
        </section>
      </main>
    );
  }

  const countedText = participationLabel(survey);

  return (
    <main className="shell">
      <header className="hero dashboard-header">
        <div className="survey-hero-copy">
          <div className="survey-hero-topline">
            <Link className="muted back-link" to="/surveys">← All surveys</Link>
            <SurveyBadges survey={survey} />
            {isOwner ? <span className="pill" style={{ background: "rgba(84,228,188,0.12)", borderColor: "rgba(84,228,188,0.4)", color: "var(--mint)" }}>You own this</span> : null}
          </div>
          <h1 className="survey-hero-title">{survey.title || `Survey (${survey.txHash.slice(0, 8)}:${survey.index})`}</h1>
          {survey.external ? (
            <p className="muted survey-hero-description">The survey text lives in an external document that is not loaded here.</p>
          ) : survey.description ? (
            <p className="muted survey-hero-description">{survey.description}</p>
          ) : null}
          {survey.contentAnchor?.uri ? (
            <a className="ext-link" href={survey.contentAnchor.uri} target="_blank" rel="noreferrer" style={{ fontSize: "0.85rem" }}>Reference document ↗</a>
          ) : null}
          {isOwner && survey.lifecycle === "open" && cancelState !== "done" ? (
            <div style={{ marginTop: "0.85rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="mode-btn"
                style={{ borderColor: "rgba(244,63,94,0.5)", color: "var(--rose)" }}
                disabled={cancelState === "submitting"}
                onClick={handleCancelSurvey}
              >
                {cancelState === "submitting" ? "Cancelling…" : "Cancel this survey"}
              </button>
              <span className="muted" style={{ fontSize: "0.76rem" }}>Only you, the owner, can do this.</span>
            </div>
          ) : null}
          {cancelState === "done" ? <p className="muted" style={{ marginTop: "0.6rem", fontSize: "0.82rem", color: "var(--mint)" }}>✓ Cancellation submitted. The index reflects it once the transaction is confirmed.</p> : null}
          {cancelState === "error" ? <p className="vote-error" style={{ marginTop: "0.6rem" }}>{cancelError}</p> : null}
        </div>
      </header>

      <section className="survey-meta-row">
        <div className="survey-meta-item">
          <span className="muted">{survey.lifecycle === "open" ? "Closes" : "Closed"}</span>
          <strong>Epoch {survey.endEpoch}</strong>
          <span className="muted" style={{ fontSize: "0.74rem" }}>{deadlineLabel(survey.lifecycle, survey.endEpoch)}</span>
        </div>
        <div className="survey-meta-item">
          <span className="muted">Who can answer</span>
          <div className="survey-meta-pill-row">{survey.eligibleRoles.map((r) => <RolePill key={r} role={r} />)}</div>
        </div>
        <div className="survey-meta-item">
          <span className="muted">Participation</span>
          <strong>{countedText}</strong>
          {survey.responseCount != null ? <span className="muted" style={{ fontSize: "0.74rem" }}>{survey.responseCount} distinct {survey.responseCount === 1 ? "responder" : "responders"} in total</span> : null}
        </div>
        <div className="survey-meta-item">
          <span className="muted">Published</span>
          <strong>{formatUnixDate(survey.submittedAt)}</strong>
          <span className="muted" style={{ fontSize: "0.74rem" }}>epoch {survey.epochNo}</span>
        </div>
        <div className="survey-meta-item">
          <span className="muted">Survey TX</span>
          <a className="ext-link mono survey-tx-link" href={explorerTxUrl(survey.txHash)} target="_blank" rel="noreferrer">{shortHash(survey.txHash, 12, 8)}</a>
          {survey.tesseraUrl ? <a className="ext-link" href={survey.tesseraUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.74rem" }}>Open on Tessera ↗</a> : null}
        </div>
      </section>

      {survey.govLinks?.length ? (
        <section className="panel svy-side-card" style={{ marginBottom: "1rem" }}>
          <h3>Linked governance {survey.govLinks.length === 1 ? "action" : "actions"}</h3>
          <ul className="svy-links">
            {survey.govLinks.map((link) => (
              <li key={link.actionId}>
                <Link to={`/actions/${encodeURIComponent(link.actionId)}`} className="inline-link">{link.title || link.actionId}</Link>
                <span className="muted"> · expires epoch {link.endEpoch}</span>
              </li>
            ))}
          </ul>
          <p className="muted svy-note">A survey answer is separate from a vote: it is survey metadata, not a governance vote, and it neither replaces nor implies one.</p>
        </section>
      ) : null}

      <div className="survey-tabs">
        <button type="button" className={`survey-tab${tab === "results" ? " active" : ""}`} onClick={() => setTab("results")}>Results</button>
        <button type="button" className={`survey-tab${tab === "responses" ? " active" : ""}`} onClick={() => setTab("responses")}>Responses ({responses.length})</button>
        <button type="button" className={`survey-tab${tab === "respond" ? " active" : ""}`} onClick={() => setTab("respond")}>Answer</button>
      </div>

      {tab === "results" ? (
        <SurveyTally survey={survey} tally={data.tally} refusal={data.tallyRefusal} artifact={data.artifact} />
      ) : null}

      {tab === "responses" ? (
        <section className="panel">
          <h2>Responses on chain</h2>
          <p className="muted" style={{ fontSize: "0.8rem" }}>
            Every response transaction the index holds, newest first. "Counted" follows CIP-179's own rules (in window, valid, credential proven, latest per credential); a response with a pending proof still counts.
          </p>
          {responses.length === 0 ? (
            <p className="muted">No responses yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Credential</th>
                  <th>Answers</th>
                  <th>Epoch</th>
                  <th>Status</th>
                  <th>TX</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={`${r.txHash}:${r.responseIndex}`}>
                    <td><RolePill role={r.role} /></td>
                    <td className="mono" style={{ fontSize: "0.78rem" }} title={r.credential}>{shortHash(r.credentialHash, 8, 6)}</td>
                    <td style={{ fontSize: "0.82rem" }}>
                      {r.sealed ? (
                        <span className="muted">sealed</span>
                      ) : r.answers.length === 0 ? (
                        <span className="muted">—</span>
                      ) : (
                        <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                          {r.answers.map((a) => (
                            <li key={a.questionIndex}><span className="muted">Q{a.questionIndex + 1}:</span> {a.text}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td>{r.epochNo}</td>
                    <td style={{ fontSize: "0.8rem" }}>
                      {r.counted ? (
                        <span style={{ color: "var(--mint)" }}>counted{r.verdict === null ? " (proof pending)" : ""}</span>
                      ) : (
                        <span className="muted">{EXCLUSION_LABELS[r.exclusion] || r.exclusion || "not counted"}</span>
                      )}
                    </td>
                    <td>
                      <a className="ext-link mono" style={{ fontSize: "0.78rem" }} href={explorerTxUrl(r.txHash)} target="_blank" rel="noreferrer">{r.txHash.slice(0, 10)}…</a>
                      {r.rationale?.uri ? (
                        <a className="ext-link" style={{ fontSize: "0.74rem", display: "block", marginTop: "2px" }} href={r.rationale.uri} target="_blank" rel="noreferrer">rationale ↗</a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {tab === "respond" ? <RespondPanel survey={survey} data={data} onSubmitted={onSubmitted} /> : null}

      {data?.fetchedAt ? (
        <p className="muted" style={{ fontSize: "0.76rem", marginTop: "0.8rem" }}>
          Survey data as of {new Date(data.fetchedAt * 1000).toLocaleString()} (Tessera snapshot), cached, not live. Epoch {data.currentEpoch}.
          {questions.length ? ` ${questions.length} ${questions.length === 1 ? "question" : "questions"}.` : ""}
        </p>
      ) : null}
    </main>
  );
}
