import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useCurrentEpoch } from "../hooks/useCurrentEpoch";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { Link, useParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { WalletContext } from "../context/WalletContext";
import { buildAndSubmitSurveyResponse } from "../services/surveyTxService";

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

// ── Method type helpers (handle all CIP-0179 versions) ────────────────────────

function isSingleChoice(m)  { return typeof m === "string" && m.startsWith("urn:cardano:poll-method:single-choice:"); }
function isMultiSelect(m)   { return typeof m === "string" && m.startsWith("urn:cardano:poll-method:multi-select:"); }
function isRanking(m)       { return typeof m === "string" && m.startsWith("urn:cardano:poll-method:ranking:"); }
function isNumericRange(m)  { return typeof m === "string" && m.startsWith("urn:cardano:poll-method:numeric-range:"); }
function isPointsAlloc(m)   { return typeof m === "string" && m.startsWith("urn:cardano:poll-method:points-allocation:"); }
function isRating(m)        { return typeof m === "string" && m.startsWith("urn:cardano:poll-method:rating:"); }
function isCustom(m)        { return typeof m === "string" && m.startsWith("urn:cardano:poll-method:custom:"); }
function isChoiceOrRank(m)  { return isSingleChoice(m) || isMultiSelect(m) || isRanking(m); }

// Returns the v4 answer tag for a question's methodType.
// v4 tags: 0=custom 1=single-choice 2=multi-select 3=ranking 4=numeric 5=points-alloc 6=rating
function getV4AnswerTag(methodType) {
  if (isCustom(methodType))       return 0;
  if (isSingleChoice(methodType)) return 1;
  if (isMultiSelect(methodType))  return 2;
  if (isRanking(methodType))      return 3;
  if (isNumericRange(methodType)) return 4;
  if (isPointsAlloc(methodType))  return 5;
  if (isRating(methodType))       return 6;
  return null;
}

const METHOD_LABELS = {
  "urn:cardano:poll-method:single-choice:v1":     "Single choice",
  "urn:cardano:poll-method:single-choice:v2":     "Single choice",
  "urn:cardano:poll-method:multi-select:v1":      "Multi-select",
  "urn:cardano:poll-method:multi-select:v2":      "Multi-select",
  "urn:cardano:poll-method:ranking:v1":           "Ranking",
  "urn:cardano:poll-method:numeric-range:v1":     "Numeric range",
  "urn:cardano:poll-method:numeric-range:v2":     "Numeric range",
  "urn:cardano:poll-method:points-allocation:v1": "Points allocation",
  "urn:cardano:poll-method:rating:v1":            "Rating",
  "urn:cardano:poll-method:custom:v1":            "Custom",
};

function methodLabel(m) {
  return METHOD_LABELS[m] ?? "Custom";
}

const ROLE_COLORS = {
  DRep:        "var(--mint)",
  SPO:         "var(--amber)",
  CC:          "#a78bfa",
  Stakeholder: "rgba(200,200,210,0.6)",
  Owner:       "rgba(200,200,210,0.4)",
};

// Derive eligible roles from survey details — supports both v4 (eligibleRoles[])
// and legacy v2/v3 (roleWeighting{}) shapes returned by the API.
function getSurveyRoles(details) {
  if (Array.isArray(details?.eligibleRoles)) return details.eligibleRoles;
  return Object.keys(details?.roleWeighting ?? {});
}

// ── Pending poller ───────────────────────────────────────────────────────────

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

function PointsAllocTallyChart({ pointsTally }) {
  if (!pointsTally || pointsTally.length === 0) return <p className="muted">No responses yet.</p>;
  const total = pointsTally.reduce((s, o) => s + o.totalPoints, 0);
  const max = Math.max(...pointsTally.map((o) => o.totalPoints), 1);
  return (
    <div className="option-tally-list">
      {pointsTally.map((opt) => (
        <div key={opt.index} className="option-tally-row">
          <span className="option-tally-label">{opt.label}</span>
          <div className="option-tally-bar-wrap">
            <div className="option-tally-bar" style={{ width: `${(opt.totalPoints / max) * 100}%` }} />
          </div>
          <div className="option-tally-stat">
            <span className="option-tally-count">{opt.totalPoints} pts</span>
          </div>
          <span className="muted option-tally-percent">
            {total > 0 ? `${((opt.totalPoints / total) * 100).toFixed(1)}%` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

function RatingTallyChart({ ratingTally }) {
  if (!ratingTally || ratingTally.length === 0) return <p className="muted">No responses yet.</p>;
  const maxScore = Math.max(...ratingTally.map((o) => o.meanScore ?? 0), 1);
  return (
    <div className="option-tally-list">
      {ratingTally.map((opt) => (
        <div key={opt.index} className="option-tally-row">
          <span className="option-tally-label">{opt.label}</span>
          <div className="option-tally-bar-wrap">
            <div className="option-tally-bar" style={{ width: `${((opt.meanScore ?? 0) / maxScore) * 100}%` }} />
          </div>
          <div className="option-tally-stat">
            <span className="option-tally-count">{opt.meanScore != null ? opt.meanScore.toFixed(2) : "—"}</span>
            <span className="muted option-tally-subcount">{opt.count} ratings</span>
          </div>
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
  const label = methodLabel(qt.methodType);
  const showOption  = isChoiceOrRank(qt.methodType);
  const showPoints  = isPointsAlloc(qt.methodType);
  const showRating  = isRating(qt.methodType);
  const showNumeric = isNumericRange(qt.methodType);
  return (
    <div className="panel question-tally-card">
      <div className="question-tally-header">
        <p className="muted question-tally-method">{label}</p>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {qt.required ? (
            <span className="question-tally-weight-badge" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}>Required</span>
          ) : null}
          {qt.weighted ? <span className="question-tally-weight-badge">Weighted by stake</span> : null}
        </div>
      </div>
      <h4>{qt.question}</h4>
      {showOption  ? <OptionTallyChart optionTallies={qt.optionTallies} totalResponses={totalResponses} totalWeight={totalWeight} weighted={qt.weighted} /> : null}
      {showPoints  ? <PointsAllocTallyChart pointsTally={qt.pointsTally} /> : null}
      {showRating  ? <RatingTallyChart ratingTally={qt.ratingTally} /> : null}
      {showNumeric ? <NumericTallyChart numericTally={qt.numericTally} /> : null}
      {qt.customTexts?.length > 0 ? (
        <ul className="custom-text-list">
          {qt.customTexts.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      ) : null}
      {qt.abstainCount > 0 ? (
        <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.5rem" }}>
          {qt.abstainCount} abstain{qt.abstainCount !== 1 ? "s" : ""}
        </p>
      ) : null}
    </div>
  );
}

// ── Response form ────────────────────────────────────────────────────────────

function PointsAllocInput({ question, value, onChange }) {
  const budget = question.budget ?? 100;
  const options = question.options ?? [];
  const allocMap = useMemo(() => {
    const m = {};
    for (const [idx, pts] of (value?.pointsAllocation ?? [])) m[idx] = pts;
    return m;
  }, [value]);
  const allocated = Object.values(allocMap).reduce((s, v) => s + Number(v || 0), 0);
  const remaining = budget - allocated;

  function setPoints(idx, pts) {
    const next = { ...allocMap, [idx]: Math.max(0, Number(pts)) };
    const tuples = Object.entries(next)
      .filter(([, v]) => Number(v) > 0)
      .map(([k, v]) => [Number(k), Number(v)]);
    onChange({ pointsAllocation: tuples });
  }

  return (
    <div className="question-input-points">
      <p className="muted" style={{ fontSize: "0.82rem", marginBottom: "0.4rem" }}>
        Budget: {budget} points — <strong style={{ color: remaining < 0 ? "#ef4444" : "inherit" }}>{remaining} remaining</strong>
      </p>
      {options.map((opt, idx) => (
        <div key={idx} className="points-alloc-row">
          <span className="points-alloc-label">{opt}</span>
          <input
            type="number"
            min={0}
            max={budget}
            value={allocMap[idx] ?? 0}
            onChange={(e) => setPoints(idx, e.target.value)}
            style={{ width: "80px" }}
          />
          <span className="muted" style={{ fontSize: "0.78rem" }}>pts</span>
        </div>
      ))}
      {remaining < 0 ? (
        <p style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: "0.3rem" }}>
          Over budget by {Math.abs(remaining)} points.
        </p>
      ) : null}
    </div>
  );
}

function RatingInput({ question, value, onChange }) {
  const [minR, maxR] = question.ratingScale ?? [1, 5];
  const options = question.options ?? [];
  const ratingsMap = useMemo(() => {
    const m = {};
    for (const [idx, score] of (value?.ratings ?? [])) m[idx] = score;
    return m;
  }, [value]);

  function setScore(idx, score) {
    const next = { ...ratingsMap, [idx]: Number(score) };
    const tuples = Object.entries(next).map(([k, v]) => [Number(k), Number(v)]);
    onChange({ ratings: tuples });
  }

  return (
    <div className="question-input-rating">
      {options.map((opt, idx) => {
        const score = ratingsMap[idx] ?? minR;
        return (
          <div key={idx} className="rating-row">
            <span className="rating-label">{opt}</span>
            <input
              type="range"
              min={minR}
              max={maxR}
              step={1}
              value={score}
              onChange={(e) => setScore(idx, e.target.value)}
              className="survey-range-input rating-range"
            />
            <strong className="rating-value">{score}</strong>
          </div>
        );
      })}
      <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.3rem" }}>Scale: {minR}–{maxR}</p>
    </div>
  );
}

function QuestionInput({ question, value, onChange }) {
  const m = question.methodType;
  const isChoice  = isSingleChoice(m) || isMultiSelect(m);
  const isRank    = isRanking(m);
  const isMulti   = isMultiSelect(m);
  const isNumeric = isNumericRange(m);
  const nc = question.numericConstraints ?? { minValue: 0, maxValue: 100 };
  const selection = value?.selection ?? [];
  const maxSelections = Number(question.maxSelections || 0) || null;
  const maxRanked = Number(question.maxRanked || 0) || null;

  function handleCheckbox(idx, checked) {
    if (checked && maxSelections && selection.length >= maxSelections && !selection.includes(idx)) return;
    const next = checked ? [...selection, idx] : selection.filter((i) => i !== idx);
    onChange({ selection: next });
  }

  function handleRankToggle(idx) {
    if (selection.includes(idx)) {
      onChange({ selection: selection.filter((i) => i !== idx) });
    } else if (!maxRanked || selection.length < maxRanked) {
      onChange({ selection: [...selection, idx] });
    }
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

  if (isRank) {
    return (
      <div className="question-input-options">
        {(question.options ?? []).map((opt, idx) => {
          const rank = selection.indexOf(idx);
          const ranked = rank !== -1;
          const disabled = !ranked && maxRanked && selection.length >= maxRanked;
          return (
            <label
              key={idx}
              className={`response-option${ranked ? " selected" : ""}${disabled ? " disabled" : ""}`}
              onClick={() => !disabled && handleRankToggle(idx)}
              style={{ cursor: disabled ? "not-allowed" : "pointer" }}
            >
              <span className={`response-option-indicator${ranked ? " selected" : ""}`}>
                {ranked ? rank + 1 : "+"}
              </span>
              <span className="response-option-text">{opt}</span>
            </label>
          );
        })}
        {selection.length > 0 ? (
          <p className="muted" style={{ fontSize: "0.78rem", marginTop: "0.3rem" }}>
            Ranked order: {selection.map((i) => question.options?.[i]).join(" → ")}
          </p>
        ) : null}
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

  if (isPointsAlloc(m)) {
    return <PointsAllocInput question={question} value={value} onChange={onChange} />;
  }

  if (isRating(m)) {
    return <RatingInput question={question} value={value} onChange={onChange} />;
  }

  return <p className="muted" style={{ fontSize: "0.82rem" }}>Custom method — free response</p>;
}

function ResponseForm({ survey, isActive, onSubmitted }) {
  const { walletApi, walletDrep } = useContext(WalletContext);
  const roles = getSurveyRoles(survey.details);

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
    return answer?.selection?.length > 0
      || answer?.numericValue != null
      || answer?.customValue != null
      || answer?.pointsAllocation?.length > 0
      || answer?.ratings?.length > 0;
  }).length;

  const handleAnswer = useCallback((questionId, val) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    // Build v4 answer tuples: [tag, questionIndex, value]
    const v4Answers = questions.flatMap((q, questionIndex) => {
      const answer = answers[q.questionId];
      if (!answer) return [];
      const tag = getV4AnswerTag(q.methodType);
      if (tag === null) return [];

      if (isSingleChoice(q.methodType)) {
        if (!answer.selection?.length) return [];
        return [[tag, questionIndex, answer.selection[0]]];
      }
      if (isMultiSelect(q.methodType) || isRanking(q.methodType)) {
        if (!answer.selection?.length) return [];
        return [[tag, questionIndex, answer.selection]];
      }
      if (isNumericRange(q.methodType)) {
        if (answer.numericValue == null) return [];
        return [[tag, questionIndex, answer.numericValue]];
      }
      if (isPointsAlloc(q.methodType)) {
        if (!answer.pointsAllocation?.length) return [];
        return [[tag, questionIndex, answer.pointsAllocation]];
      }
      if (isRating(q.methodType)) {
        if (!answer.ratings?.length) return [];
        return [[tag, questionIndex, answer.ratings]];
      }
      return [];
    });

    if (v4Answers.length === 0) {
      setSubmitError("Please answer at least one question.");
      return;
    }
    setSubmitting(true);
    try {
      const surveyIndex = survey.surveyIndex ?? 0;
      const result = await buildAndSubmitSurveyResponse(walletApi, survey.surveyTxId, surveyIndex, responderRole, v4Answers);
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
            <span className="question-method-pill">{methodLabel(q.methodType)}</span>
          </div>
          <p className="question-prompt">{q.question}</p>
          {isMultiSelect(q.methodType) ? (
            <p className="muted question-hint">
              {q.minSelections > 0 ? `Select ${q.minSelections}–${q.maxSelections ?? "∞"}.` : `Select up to ${q.maxSelections ?? "∞"}.`}
              {" "}Currently selected: {answers[q.questionId]?.selection?.length ?? 0}
            </p>
          ) : null}
          {isRanking(q.methodType) ? (
            <p className="muted question-hint">
              Click options in your preferred order (most preferred first).
              {q.maxRanked ? ` Rank up to ${q.maxRanked}.` : ""}
              {q.minRanked > 0 ? ` At least ${q.minRanked} required.` : ""}
            </p>
          ) : null}
          {isNumericRange(q.methodType) ? (
            <p className="muted question-hint">Move the slider to choose a value between {q.numericConstraints?.minValue ?? 0} and {q.numericConstraints?.maxValue ?? 100}.</p>
          ) : null}
          {isPointsAlloc(q.methodType) ? (
            <p className="muted question-hint">Distribute {q.budget ?? 100} points among the options below.</p>
          ) : null}
          {isRating(q.methodType) ? (
            <p className="muted question-hint">Rate each option on a scale of {q.ratingScale?.[0] ?? 1}–{q.ratingScale?.[1] ?? 5}.</p>
          ) : null}
          {q.required ? (
            <p className="muted question-hint" style={{ color: "#ef4444" }}>Required</p>
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
  useSeoMeta({
    title: details.title ? `${details.title} — Survey` : "Governance Survey",
    description: details.description || "On-chain Cardano governance survey weighted by stake and voting power."
  });
  const questions = details.questions ?? [];
  const roles = getSurveyRoles(details);
  const currentEpoch = useCurrentEpoch();
  const isActive = currentEpoch != null && details.endEpoch != null ? currentEpoch <= details.endEpoch : true;

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
          {details.contentAnchor ? (
            <a className="ext-link" href={details.contentAnchor} target="_blank" rel="noreferrer" style={{ fontSize: "0.85rem" }}>
              Reference document ↗
            </a>
          ) : null}
        </div>
      </header>

      {/* Meta row */}
      <section className="survey-meta-row">
        <div className="survey-meta-item">
          <span className="muted">Ends epoch</span>
          <strong>{details.endEpoch ?? "—"}</strong>
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
          {details.isTimelocked ? (
            <div>
              <h3>Sealed Survey</h3>
              <p className="muted">
                This survey uses timelock encryption — responses are sealed until the reveal round.
                Submission requires a compatible timelocked voting tool.
              </p>
            </div>
          ) : (
            <ResponseForm
              survey={survey}
              isActive={isActive}
              onSubmitted={() => { setTimeout(() => load(true), 3000); }}
            />
          )}
        </section>
      ) : null}
    </main>
  );
}
