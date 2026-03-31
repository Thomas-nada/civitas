import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { WalletContext } from "../context/WalletContext";
import { buildAndSubmitSurveyResponse } from "../services/surveyTxService";

const SHELLEY_EPOCH_START_UNIX = 1596059091;
const EPOCH_DURATION_SECONDS = 432000;

function approxCurrentEpoch() {
  const delta = Math.floor(Date.now() / 1000) - SHELLEY_EPOCH_START_UNIX;
  return delta < 0 ? null : 208 + Math.floor(delta / EPOCH_DURATION_SECONDS);
}

function epochToDate(epoch) {
  if (!epoch) return null;
  return new Date((SHELLEY_EPOCH_START_UNIX + (epoch - 208) * EPOCH_DURATION_SECONDS) * 1000);
}

function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fmtAda(value, opts = {}) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "—";
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: opts.compact ? 1 : 2,
  })} ADA`;
}

function shortAddr(addr) {
  if (!addr || addr.length < 16) return addr || "—";
  return `${addr.slice(0, 10)}…${addr.slice(-8)}`;
}

const METHOD_SINGLE_CHOICE = "urn:cardano:poll-method:single-choice:v1";
const METHOD_MULTI_SELECT  = "urn:cardano:poll-method:multi-select:v1";
const METHOD_NUMERIC_RANGE = "urn:cardano:poll-method:numeric-range:v1";

const METHOD_LABELS = {
  [METHOD_SINGLE_CHOICE]: "Single choice",
  [METHOD_MULTI_SELECT]: "Multi-select",
  [METHOD_NUMERIC_RANGE]: "Numeric range",
};

const ROLE_COLORS = {
  DRep: "var(--mint)",
  SPO: "var(--amber)",
  CC: "#a78bfa",
  Stakeholder: "rgba(200,200,210,0.6)",
};

// ── Pending poller: retries load() until survey is indexed ───────────────────

function PendingPoller({ onFound }) {
  const [attempts, setAttempts] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setAttempts((n) => n + 1);
      onFound();
    }, 10_000);
    return () => clearInterval(id);
  }, [onFound]);
  return (
    <p className="muted" style={{ fontSize: "0.82rem", marginTop: "0.5rem" }}>
      Checking… (attempt {attempts + 1})
    </p>
  );
}

// ── Tally charts ────────────────────────────────────────────────────────────

function OptionTallyChart({ optionTallies, totalResponses, totalWeight = 0, weighted = false }) {
  if (!optionTallies || optionTallies.length === 0) return <p className="muted">No responses yet.</p>;
  const metricKey = weighted ? "weight" : "count";
  const max = Math.max(...optionTallies.map((o) => Number(o?.[metricKey] || 0)), 1);
  const totalMetric = weighted ? totalWeight : totalResponses;
  return (
    <div className="option-tally-list">
      {optionTallies.map((opt) => (
        <div key={opt.index} className="option-tally-row">
          <span className="option-tally-label">{opt.label}</span>
          <div className="option-tally-bar-wrap">
            <div className="option-tally-bar" style={{ width: `${((Number(opt?.[metricKey] || 0) / max) * 100)}%` }} />
          </div>
          <div className="option-tally-stat">
            <span className="option-tally-count">{weighted ? fmtAda(opt.weight, { compact: true }) : opt.count}</span>
            {weighted ? <span className="muted option-tally-subcount">{opt.count} responses</span> : null}
          </div>
          <span className="muted option-tally-percent">
            {totalMetric > 0 ? `${((Number(opt?.[metricKey] || 0) / totalMetric) * 100).toFixed(1)}%` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

function NumericTallyChart({ numericTally }) {
  if (!numericTally || numericTally.values.length === 0) return <p className="muted">No responses yet.</p>;
  const weighted = Boolean(numericTally.weighted);
  const barKey = weighted ? "weight" : "count";
  return (
    <div>
      <div className="numeric-tally-stats">
        <span>{weighted ? "Weighted mean" : "Mean"}: <strong>{numericTally.mean.toFixed(2)}</strong></span>
        <span>Median: <strong>{numericTally.median.toFixed(2)}</strong></span>
        <span>Min: <strong>{numericTally.min}</strong></span>
        <span>Max: <strong>{numericTally.max}</strong></span>
        <span>Responses: <strong>{numericTally.values.length}</strong></span>
        {weighted ? <span>Counted stake: <strong>{fmtAda(numericTally.totalWeight, { compact: true })}</strong></span> : null}
      </div>
      {numericTally.bins?.length > 0 && (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={numericTally.bins} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
            <XAxis dataKey="range" tick={{ fill: "rgba(200,200,210,0.75)", fontSize: 10 }} />
            <YAxis allowDecimals={weighted} tick={{ fill: "rgba(200,200,210,0.75)", fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }}
              labelStyle={{ color: "rgba(200,200,210,0.9)" }}
              itemStyle={{ color: "rgba(200,200,210,0.85)" }}
              formatter={(value) => weighted ? fmtAda(value, { compact: true }) : value}
            />
            <Bar dataKey={barKey} fill="var(--mint)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function QuestionTallyCard({ qt, totalResponses, totalWeight }) {
  const isChoice = qt.methodType === METHOD_SINGLE_CHOICE || qt.methodType === METHOD_MULTI_SELECT;
  const isNumeric = qt.methodType === METHOD_NUMERIC_RANGE;
  return (
    <div className="panel question-tally-card">
      <div className="question-tally-header">
        <p className="muted question-tally-method">
          {qt.methodType === METHOD_SINGLE_CHOICE ? "Single choice" :
           qt.methodType === METHOD_MULTI_SELECT  ? "Multi-select" :
           qt.methodType === METHOD_NUMERIC_RANGE ? "Numeric range" : "Custom"}
        </p>
        {qt.weighted ? <span className="question-tally-weight-badge">Weighted by stake</span> : null}
      </div>
      <h4>{qt.question}</h4>
      {isChoice   ? <OptionTallyChart optionTallies={qt.optionTallies} totalResponses={totalResponses} totalWeight={totalWeight} weighted={qt.weighted} /> : null}
      {isNumeric  ? <NumericTallyChart numericTally={qt.numericTally} /> : null}
      {qt.customTexts?.length > 0 ? (
        <ul className="custom-text-list">
          {qt.customTexts.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

// ── Response form ────────────────────────────────────────────────────────────

function QuestionInput({ question, value, onChange }) {
  const isChoice = question.methodType === METHOD_SINGLE_CHOICE || question.methodType === METHOD_MULTI_SELECT;
  const isMulti  = question.methodType === METHOD_MULTI_SELECT;
  const isNumeric = question.methodType === METHOD_NUMERIC_RANGE;
  const nc = question.numericConstraints ?? { minValue: 0, maxValue: 100 };
  const selection = value?.selection ?? [];
  const maxSelections = Number(question.maxSelections || 0) || null;

  function handleCheckbox(idx, checked) {
    const sel = selection;
    if (checked && maxSelections && sel.length >= maxSelections && !sel.includes(idx)) return;
    const next = checked ? [...sel, idx] : sel.filter((i) => i !== idx);
    onChange({ selection: next });
  }

  if (isChoice) {
    return (
      <div className="question-input-options">
        {(question.options ?? []).map((opt, idx) => (
          <label
            key={idx}
            className={`response-option${selection.includes(idx) ? " selected" : ""}${isMulti && maxSelections && selection.length >= maxSelections && !selection.includes(idx) ? " disabled" : ""}`}
          >
            <input
              type={isMulti ? "checkbox" : "radio"}
              name={`q_${question.questionId}`}
              checked={isMulti ? selection.includes(idx) : selection[0] === idx}
              disabled={isMulti && maxSelections && selection.length >= maxSelections && !selection.includes(idx)}
              onChange={(e) => {
                if (isMulti) handleCheckbox(idx, e.target.checked);
                else onChange({ selection: [idx] });
              }}
            />
            <span className={`response-option-indicator${selection.includes(idx) ? " selected" : ""}`}>
              {isMulti ? (selection.includes(idx) ? "✓" : "+") : ""}
            </span>
            <span className="response-option-text">{opt}</span>
          </label>
        ))}
      </div>
    );
  }

  if (isNumeric) {
    const numVal = value?.numericValue ?? nc.minValue;
    return (
      <div className="question-input-numeric">
        <div className="numeric-value-display">
          <strong>{numVal}</strong>
          <span className="muted">Selected value</span>
        </div>
        <input
          className="survey-range-input"
          type="range"
          min={nc.minValue}
          max={nc.maxValue}
          step={nc.step ?? 1}
          value={numVal}
          onChange={(e) => onChange({ numericValue: Number(e.target.value) })}
        />
        <div className="numeric-range-scale">
          <span>{nc.minValue}</span>
          <span>Range</span>
          <span>{nc.maxValue}</span>
        </div>
      </div>
    );
  }

  return <p className="muted" style={{ fontSize: "0.82rem" }}>Custom method — free response</p>;
}

function ResponseForm({ survey, isActive, onSubmitted }) {
  const { walletApi, walletDrep } = useContext(WalletContext);
  const roles = Object.keys(survey.details?.roleWeighting ?? {});

  // Determine default role based on wallet state
  const defaultRole = useMemo(() => {
    if (walletDrep && roles.includes("DRep")) return "DRep";
    return roles[0] ?? "DRep";
  }, [walletDrep, roles]);

  const [responderRole, setResponderRole] = useState(defaultRole);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const questions = survey.details?.questions ?? [];
  const answeredCount = questions.filter((q) => {
    const answer = answers[q.questionId];
    return answer?.selection?.length > 0 || answer?.numericValue != null || answer?.customValue != null;
  }).length;

  const handleAnswer = useCallback((questionId, val) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    const answersArr = questions.map((q) => ({
      questionId: q.questionId,
      ...(answers[q.questionId] ?? {}),
    })).filter((a) => a.selection?.length > 0 || a.numericValue != null || a.customValue != null);

    if (answersArr.length === 0) {
      setSubmitError("Please answer at least one question.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await buildAndSubmitSurveyResponse(walletApi, survey.surveyTxId, responderRole, answersArr);
      setSubmitted(true);
      onSubmitted?.(result.txId);
    } catch (err) {
      setSubmitError(err?.message || "Transaction failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!walletApi) return null;
  if (!isActive) return <p className="muted">This survey has ended.</p>;
  if (submitted) return <p className="pill good" style={{ padding: "0.6rem 1rem" }}>Response submitted! It will appear once confirmed on-chain.</p>;

  return (
    <form onSubmit={handleSubmit} className="response-form">
      <div className="response-form-header">
        <div>
          <h3>Submit Your Response</h3>
          <p className="muted response-form-intro">
            Answer what matters to you. You can submit once now and update later with a newer on-chain response.
          </p>
        </div>
        <div className="response-progress-pill">
          {answeredCount}/{questions.length} answered
        </div>
      </div>

      <label className="response-role-label">
        <span>Your role</span>
        <select value={responderRole} onChange={(e) => setResponderRole(e.target.value)}>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>

      {questions.map((q, index) => (
        <section key={q.questionId} className="question-block">
          <div className="question-header">
            <span className="question-number">Question {index + 1}</span>
            <span className="question-method-pill">{METHOD_LABELS[q.methodType] ?? "Custom"}</span>
          </div>
          <p className="question-prompt">{q.question}</p>
          {q.methodType === METHOD_MULTI_SELECT && q.maxSelections ? (
            <p className="muted question-hint">Select up to {q.maxSelections}. Currently selected: {answers[q.questionId]?.selection?.length ?? 0}</p>
          ) : null}
          {q.methodType === METHOD_NUMERIC_RANGE ? (
            <p className="muted question-hint">Move the slider to choose a value between {q.numericConstraints?.minValue ?? 0} and {q.numericConstraints?.maxValue ?? 100}.</p>
          ) : null}
          <QuestionInput
            question={q}
            value={answers[q.questionId]}
            onChange={(val) => handleAnswer(q.questionId, val)}
          />
        </section>
      ))}

      {submitError ? <p className="response-error">{submitError}</p> : null}
      <button type="submit" className="btn-primary response-submit-btn" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit Response"}
      </button>
    </form>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SurveyDetailPage() {
  const { txHash } = useParams();
  const { walletApi } = useContext(WalletContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("results");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/surveys/${txHash}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load survey.");
      setData(json);
    } catch (e) {
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [txHash]);

  useEffect(() => { load(); }, [load]);

  const survey = data?.survey;
  const responses = data?.responses ?? [];
  const tally = data?.tally ?? {};
  const details = survey?.details ?? {};
  const questions = details.questions ?? [];
  const roles = Object.keys(details.roleWeighting ?? {});
  const currentEpoch = approxCurrentEpoch();
  const isActive = currentEpoch != null && details.endEpoch != null ? currentEpoch <= details.endEpoch : true;
  const endDate = epochToDate(details.endEpoch);

  const roleTallies = tally.roleTallies ?? [];
  const [selectedRole, setSelectedRole] = useState(null);
  const visibleTally = selectedRole
    ? roleTallies.find((r) => r.role === selectedRole)
    : roleTallies.find((r) => r.responses > 0) ?? roleTallies[0];
  const questionTallies = visibleTally?.questionTallies ?? tally.questionTallies ?? [];
  const tallyResponseCount = visibleTally?.responses ?? tally.totalResponses ?? 0;
  const tallyWeight = visibleTally?.totalWeight ?? tally.totalWeight ?? 0;
  const showStakeWeight = roleTallies.some((row) => row.weighting === "StakeBased" && Number(row.totalWeight || 0) > 0)
    || responses.some((response) => Number(response.responseStakeAda || 0) > 0);

  if (loading) return (
    <main className="shell">
      <header className="hero"><h1>Survey</h1></header>
      <section className="status-row"><p className="muted">Loading…</p></section>
    </main>
  );

  if (error) {
    // Survey may not be indexed yet — poll for it
    return (
      <main className="shell">
        <header className="hero"><h1>Survey</h1></header>
        <section className="status-row">
          <p className="muted">
            {error.includes("not found")
              ? "Survey not indexed yet — it may take a minute or two for the transaction to be confirmed and indexed. This page will refresh automatically."
              : `Error: ${error}`}
          </p>
          {error.includes("not found") ? (
            <PendingPoller onFound={() => load()} />
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="hero dashboard-header">
        <div className="survey-hero-copy">
          <div className="survey-hero-topline">
            <Link className="muted back-link" to="/surveys">← All Surveys</Link>
            <span className={`pill ${isActive ? "good" : "muted-pill"}`}>{isActive ? "Active" : "Ended"}</span>
          </div>
          <h1 className="survey-hero-title">{details.title || "Survey"}</h1>
          {details.description ? <p className="muted survey-hero-description">{details.description}</p> : null}
        </div>
      </header>

      {/* Meta row */}
      <section className="survey-meta-row">
        <div className="survey-meta-item">
          <span className="muted">Ends epoch</span>
          <strong>{details.endEpoch ?? "—"}</strong>
          {endDate ? <span className="muted" style={{ fontSize: "0.8rem" }}>{endDate.toLocaleDateString()}</span> : null}
        </div>
        <div className="survey-meta-item">
          <span className="muted">Eligible roles</span>
          <div className="survey-meta-pill-row">
            {roles.map((r) => (
              <span key={r} className="pill" style={{
                background: `${ROLE_COLORS[r] ?? "rgba(200,200,210,0.5)"}22`,
                borderColor: `${ROLE_COLORS[r] ?? "rgba(200,200,210,0.5)"}88`,
                color: ROLE_COLORS[r] ?? "inherit",
              }}>{r}</span>
            ))}
          </div>
        </div>
        <div className="survey-meta-item">
          <span className="muted">Total responses</span>
          <strong>{tally.totalResponses ?? 0}</strong>
        </div>
        {showStakeWeight ? (
          <div className="survey-meta-item">
            <span className="muted">Counted stake</span>
            <strong>{fmtAda(tally.totalWeight ?? 0, { compact: true })}</strong>
          </div>
        ) : null}
        <div className="survey-meta-item">
          <span className="muted">Created</span>
          <strong>{fmtDate(survey?.blockTime)}</strong>
        </div>
        <div className="survey-meta-item">
          <span className="muted">Survey TX</span>
          <a className="ext-link mono survey-tx-link"
            href={`https://cardanoscan.io/transaction/${txHash}`}
            target="_blank" rel="noreferrer">
            {txHash?.slice(0, 12)}…{txHash?.slice(-8)}
          </a>
        </div>
      </section>

      {/* Tab bar */}
      <div className="survey-tabs">
        <button type="button" className={`survey-tab${tab === "results" ? " active" : ""}`} onClick={() => setTab("results")}>Results</button>
        <button type="button" className={`survey-tab${tab === "responses" ? " active" : ""}`} onClick={() => setTab("responses")}>
          Responses ({responses.length})
        </button>
        {walletApi ? (
          <button type="button" className={`survey-tab${tab === "respond" ? " active" : ""}`} onClick={() => setTab("respond")}>
            Submit Response
          </button>
        ) : null}
      </div>

      {/* Results tab */}
      {tab === "results" ? (
        <section>
          {/* Role selector if multiple roles */}
          {roleTallies.length > 1 ? (
            <div className="survey-role-filter">
              <span className="muted" style={{ fontSize: "0.82rem" }}>View tally by role:</span>
              {roleTallies.map((rt) => (
                <button
                  type="button"
                  key={rt.role}
                  className={`survey-role-btn${(selectedRole ?? (roleTallies.find((r) => r.responses > 0)?.role ?? roleTallies[0]?.role)) === rt.role ? " active" : ""}`}
                  onClick={() => setSelectedRole(rt.role)}
                >
                  {rt.role} ({rt.weighting === "StakeBased" ? fmtAda(rt.totalWeight || 0, { compact: true }) : rt.responses})
                </button>
              ))}
            </div>
          ) : null}

          {questionTallies.length === 0 ? (
            <div className="panel"><p className="muted">No responses yet — be the first to respond.</p></div>
          ) : (
            questionTallies.map((qt) => (
              <QuestionTallyCard key={qt.questionId} qt={qt} totalResponses={tallyResponseCount} totalWeight={tallyWeight} />
            ))
          )}
        </section>
      ) : null}

      {/* Responses tab */}
      {tab === "responses" ? (
        <section className="panel">
          <h2>Response List</h2>
          {responses.length === 0 ? (
            <p className="muted">No responses yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Role</th>
                  {showStakeWeight ? <th>Stake</th> : null}
                  <th>Date</th>
                  <th>TX</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={r.txId}>
                    <td className="mono" style={{ fontSize: "0.82rem" }}>{shortAddr(r.inputAddress)}</td>
                    <td>
                      <span className="pill" style={{
                        background: `${ROLE_COLORS[r.responderRole] ?? "rgba(200,200,210,0.5)"}22`,
                        borderColor: `${ROLE_COLORS[r.responderRole] ?? "rgba(200,200,210,0.5)"}88`,
                        color: ROLE_COLORS[r.responderRole] ?? "inherit",
                      }}>{r.responderRole}</span>
                    </td>
                    {showStakeWeight ? (
                      <td>
                        <div className="survey-response-stake">
                          <strong>{Number(r.responseStakeAda || 0) > 0 ? fmtAda(r.responseStakeAda, { compact: true }) : "—"}</strong>
                          {r.rewardAddress ? <span className="muted mono">{shortAddr(r.rewardAddress)}</span> : null}
                        </div>
                      </td>
                    ) : null}
                    <td>{fmtDate(r.blockTime)}</td>
                    <td>
                      <a className="ext-link mono" style={{ fontSize: "0.78rem" }}
                        href={`https://cardanoscan.io/transaction/${r.txId}`}
                        target="_blank" rel="noreferrer">
                        {r.txId?.slice(0, 10)}…
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {/* Respond tab */}
      {tab === "respond" && walletApi ? (
        <section className="panel">
          <ResponseForm
            survey={survey}
            isActive={isActive}
            onSubmitted={() => { setTimeout(() => load(true), 3000); }}
          />
        </section>
      ) : null}
    </main>
  );
}
