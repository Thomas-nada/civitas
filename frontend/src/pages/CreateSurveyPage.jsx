import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { roundAt, defaultChainInfo } from "tlock-js";
import { WalletContext } from "../context/WalletContext";
import {
  buildAndSubmitSurveyCreation,
  hashAnchorContent,
  Q_CUSTOM, Q_SINGLE_CHOICE, Q_MULTI_SELECT, Q_RANKING, Q_NUMERIC_RANGE,
  Q_POINTS_ALLOCATION, Q_RATING,
  ROLE_TO_INT,
  METADATA_LABEL,
} from "../services/surveyTxService";
import { useCurrentEpoch } from "../hooks/useCurrentEpoch";

const METHOD_LABELS = {
  [Q_CUSTOM]:            "Custom",
  [Q_SINGLE_CHOICE]:     "Single choice",
  [Q_MULTI_SELECT]:      "Multi-select",
  [Q_RANKING]:           "Ranking",
  [Q_NUMERIC_RANGE]:     "Numeric range",
  [Q_POINTS_ALLOCATION]: "Points allocation",
  [Q_RATING]:            "Rating",
};

const ALL_ROLES = ["DRep", "SPO", "CC", "Stakeholder"];

function newQuestion() {
  return {
    id: crypto.randomUUID(),
    tag: Q_SINGLE_CHOICE,
    prompt: "",
    required: false,
    contentAnchor: "",
    options: ["", ""],
    minSelections: 0,
    maxSelections: 2,
    minRanked: 0,
    maxRanked: 2,
    minValue: 0,
    maxValue: 100,
    step: null,
    budget: 100,
    ratingScale: [1, 5],
  };
}

function QuestionEditor({ q, index, total, onChange, onRemove, onMoveUp, onMoveDown }) {
  const isCustom        = q.tag === Q_CUSTOM;
  const isChoice        = q.tag === Q_SINGLE_CHOICE || q.tag === Q_MULTI_SELECT;
  const isRanking       = q.tag === Q_RANKING;
  const isMulti         = q.tag === Q_MULTI_SELECT;
  const isNumeric       = q.tag === Q_NUMERIC_RANGE;
  const isPoints        = q.tag === Q_POINTS_ALLOCATION;
  const isRating        = q.tag === Q_RATING;
  const hasOptions      = isChoice || isRanking || isPoints || isRating;

  function setField(field, value) { onChange({ ...q, [field]: value }); }

  function setOption(i, value) {
    const opts = [...q.options];
    opts[i] = value;
    onChange({ ...q, options: opts });
  }

  function addOption() {
    const opts = [...q.options, ""];
    // Grow maxSelections/maxRanked with the option count
    onChange({
      ...q,
      options: opts,
      maxSelections: isMulti ? opts.length : q.maxSelections,
      maxRanked: isRanking ? opts.length : q.maxRanked,
    });
  }

  function removeOption(i) {
    if (q.options.length <= 2) return;
    const opts = q.options.filter((_, idx) => idx !== i);
    onChange({
      ...q,
      options: opts,
      maxSelections: isMulti ? Math.min(q.maxSelections, opts.length) : q.maxSelections,
      minSelections: isMulti ? Math.min(q.minSelections, opts.length) : q.minSelections,
      maxRanked: isRanking ? Math.min(q.maxRanked, opts.length) : q.maxRanked,
      minRanked: isRanking ? Math.min(q.minRanked, opts.length) : q.minRanked,
    });
  }

  return (
    <div className="cs-qeditor">
      <div className="cs-qeditor-head">
        <span className="cs-qeditor-badge">Q{index + 1}</span>
        <span className="cs-qeditor-type-badge">{METHOD_LABELS[q.tag] ?? "Custom"}</span>
        <div className="cs-qeditor-actions">
          <button
            type="button" className="cs-icon-btn" onClick={onMoveUp}
            disabled={index === 0} title="Move up" aria-label="Move question up"
          >↑</button>
          <button
            type="button" className="cs-icon-btn" onClick={onMoveDown}
            disabled={index === total - 1} title="Move down" aria-label="Move question down"
          >↓</button>
          <button
            type="button" className="cs-icon-btn danger" onClick={onRemove}
            disabled={total <= 1}
          >✕</button>
        </div>
      </div>

      <div className="cs-qeditor-inner">
      <label>
        Question text
        <input
          type="text"
          placeholder="What is your question?"
          value={q.prompt}
          onChange={(e) => setField("prompt", e.target.value)}
          required
        />
      </label>

      <label>
        Method type
        <select value={q.tag} onChange={(e) => setField("tag", Number(e.target.value))}>
          {Object.entries(METHOD_LABELS).map(([val, lbl]) => (
            <option key={val} value={val}>{lbl}</option>
          ))}
        </select>
      </label>

      {isCustom ? (
        <label>
          Content anchor <span className="muted">(URI — required for custom questions)</span>
          <input
            type="url"
            placeholder="https://…"
            value={q.contentAnchor}
            onChange={(e) => setField("contentAnchor", e.target.value)}
          />
        </label>
      ) : null}

      {hasOptions ? (
        <div className="options-editor">
          <p className="muted" style={{ fontSize: "0.82rem", marginBottom: "0.4rem" }}>Options</p>
          {q.options.map((opt, i) => (
            <div key={i} className="option-row">
              <input
                type="text"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => setOption(i, e.target.value)}
                required
              />
              <button type="button" className="btn-ghost btn-sm" onClick={() => removeOption(i)}
                disabled={q.options.length <= 2}>✕</button>
            </div>
          ))}
          <button type="button" className="btn-ghost btn-sm" onClick={addOption}>+ Add option</button>

          {isMulti ? (
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem" }}>
              <label>
                Min selections
                <input
                  type="number"
                  min={0}
                  max={q.options.length}
                  value={q.minSelections}
                  onChange={(e) => setField("minSelections", Math.min(Number(e.target.value), q.maxSelections))}
                  style={{ width: "80px" }}
                />
              </label>
              <label>
                Max selections
                <input
                  type="number"
                  min={Math.max(1, q.minSelections)}
                  max={q.options.length}
                  value={q.maxSelections}
                  onChange={(e) => setField("maxSelections", Math.min(Number(e.target.value), q.options.length))}
                  style={{ width: "80px" }}
                />
              </label>
            </div>
          ) : null}

          {isRanking ? (
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem" }}>
              <label>
                Min ranked
                <input
                  type="number"
                  min={0}
                  max={q.options.length}
                  value={q.minRanked}
                  onChange={(e) => setField("minRanked", Math.min(Number(e.target.value), q.maxRanked))}
                  style={{ width: "80px" }}
                />
              </label>
              <label>
                Max ranked
                <input
                  type="number"
                  min={Math.max(1, q.minRanked)}
                  max={q.options.length}
                  value={q.maxRanked}
                  onChange={(e) => setField("maxRanked", Math.min(Number(e.target.value), q.options.length))}
                  style={{ width: "80px" }}
                />
              </label>
            </div>
          ) : null}

          {isPoints ? (
            <label style={{ marginTop: "0.75rem" }}>
              Budget (total points to allocate)
              <input
                type="number"
                min={1}
                value={q.budget}
                onChange={(e) => setField("budget", Number(e.target.value))}
                style={{ width: "120px" }}
              />
            </label>
          ) : null}

          {isRating ? (
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem" }}>
              <label>
                Rating min
                <input
                  type="number"
                  value={q.ratingScale[0]}
                  onChange={(e) => setField("ratingScale", [Number(e.target.value), q.ratingScale[1]])}
                  style={{ width: "80px" }}
                />
              </label>
              <label>
                Rating max
                <input
                  type="number"
                  value={q.ratingScale[1]}
                  onChange={(e) => setField("ratingScale", [q.ratingScale[0], Number(e.target.value)])}
                  style={{ width: "80px" }}
                />
              </label>
            </div>
          ) : null}
        </div>
      ) : null}

      {isNumeric ? (
        <div className="numeric-editor">
          <label>
            Min value
            <input type="number" value={q.minValue}
              onChange={(e) => setField("minValue", Number(e.target.value))} />
          </label>
          <label>
            Max value
            <input type="number" value={q.maxValue}
              onChange={(e) => setField("maxValue", Number(e.target.value))} />
          </label>
          <label>
            Step <span className="muted">(optional)</span>
            <input type="number" min={1} value={q.step ?? ""}
              placeholder="any"
              onChange={(e) => setField("step", e.target.value === "" ? null : Number(e.target.value))} />
          </label>
        </div>
      ) : null}

      {!isCustom ? (
        <label className="required-checkbox-label" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
          <input type="checkbox" checked={q.required ?? false} onChange={(e) => setField("required", e.target.checked)} />
          Required <span className="muted" style={{ fontSize: "0.8rem" }}>(response must answer this question)</span>
        </label>
      ) : null}
      </div>{/* cs-qeditor-inner */}
    </div>
  );
}

function SealedConfigPanel({ revealDateTime, onChange }) {
  const { round, isPast } = useMemo(() => {
    if (!revealDateTime) return { round: null, isPast: false };
    try {
      const ms = new Date(revealDateTime).getTime();
      const r = roundAt(ms, defaultChainInfo);
      return { round: r, isPast: ms < Date.now() };
    } catch {
      return { round: null, isPast: false };
    }
  }, [revealDateTime]);

  // Default min = now + 1 hour
  const minDateTime = useMemo(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  }, []);

  const tzLabel = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="cs-sealed-panel">
      <label className="cs-field-label" style={{ marginBottom: "8px" }}>
        Reveal responses after{" "}
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75em", color: "var(--text-muted)", fontWeight: 400 }}>
          ({tzLabel})
        </span>
      </label>
      <input
        className="cs-text-input cs-datetime-input"
        type="datetime-local"
        min={minDateTime}
        value={revealDateTime}
        onChange={(e) => onChange(e.target.value)}
      />
      {revealDateTime ? (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginTop: "8px",
          fontSize: "0.75rem",
          fontFamily: "'IBM Plex Mono', monospace",
          color: isPast ? "var(--rose)" : "var(--mint)",
        }}>
          {isPast ? "⚠ date is in the past" : round ? `◆ sealed until this date · drand round ${round.toLocaleString()}` : null}
        </div>
      ) : (
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "6px" }}>
          Responses will be unreadable on-chain until this moment passes.
        </p>
      )}
    </div>
  );
}

function validate(form, currentEpoch) {
  const errors = [];
  if (!form.title.trim()) errors.push("Title is required.");
  if (!form.description.trim()) errors.push("Description is required.");
  if (currentEpoch != null && form.endEpoch <= currentEpoch) errors.push("End epoch must be in the future.");
  if (form.eligibleRoles.length === 0) errors.push("Select at least one eligible role.");
  if (form.isTimelocked && !form.revealDateTime) {
    errors.push("Sealed mode requires a reveal date and time.");
  }
  if (form.isTimelocked && form.revealDateTime && new Date(form.revealDateTime) <= new Date()) {
    errors.push("Reveal date must be in the future.");
  }
  if (form.questions.length === 0) errors.push("Add at least one question.");
  if (form.contentAnchor.trim() && !/^https?:\/\/.+/.test(form.contentAnchor.trim())) {
    errors.push("Survey content anchor must be a valid http(s) URL.");
  }
  for (const [i, q] of form.questions.entries()) {
    const n = i + 1;
    if (!q.prompt.trim()) errors.push(`Question ${n}: Question text is required.`);
    if (q.tag === Q_CUSTOM) {
      if (!q.contentAnchor?.trim()) errors.push(`Question ${n}: Custom questions require a content anchor URI.`);
    } else if (q.tag !== Q_NUMERIC_RANGE) {
      if (q.options.some((o) => !o.trim())) errors.push(`Question ${n}: All options must have text.`);
      if (q.options.length < 2) errors.push(`Question ${n}: At least 2 options required.`);
    }
    if (q.tag === Q_NUMERIC_RANGE && q.minValue >= q.maxValue) {
      errors.push(`Question ${n}: Min value must be less than max value.`);
    }
    if (q.tag === Q_MULTI_SELECT) {
      if (q.minSelections > q.maxSelections) errors.push(`Question ${n}: Min selections cannot exceed max selections.`);
      if (q.maxSelections > q.options.length) errors.push(`Question ${n}: Max selections cannot exceed option count (${q.options.length}).`);
    }
    if (q.tag === Q_RANKING) {
      if (q.minRanked > q.maxRanked) errors.push(`Question ${n}: Min ranked cannot exceed max ranked.`);
      if (q.maxRanked > q.options.length) errors.push(`Question ${n}: Max ranked cannot exceed option count (${q.options.length}).`);
    }
    if (q.tag === Q_POINTS_ALLOCATION && q.budget < 1) {
      errors.push(`Question ${n}: Budget must be at least 1.`);
    }
    if (q.tag === Q_RATING && q.ratingScale[0] >= q.ratingScale[1]) {
      errors.push(`Question ${n}: Rating min must be less than rating max.`);
    }
  }
  return errors;
}

function buildSurveyForm(form, contentAnchorHash) {
  return {
    title: form.title,
    description: form.description,
    contentAnchorUrl: form.contentAnchor.trim() || undefined,
    contentAnchorHash: contentAnchorHash || undefined,
    endEpoch: form.endEpoch,
    eligibleRoles: form.eligibleRoles,
    isTimelocked: form.isTimelocked,
    drandRound: form.isTimelocked && form.revealDateTime
      ? roundAt(new Date(form.revealDateTime).getTime(), defaultChainInfo)
      : undefined,
    padding: form.isTimelocked ? 256 : undefined,
    questions: form.questions.map((q) => {
      const base = { tag: q.tag, prompt: q.prompt };
      if (q.required && q.tag !== Q_CUSTOM) base.required = true;
      if (q.tag === Q_CUSTOM) {
        base.contentAnchor = q.contentAnchor.trim();
      } else if (q.tag === Q_SINGLE_CHOICE) {
        base.options = q.options.filter((o) => o.trim());
      } else if (q.tag === Q_MULTI_SELECT) {
        base.options = q.options.filter((o) => o.trim());
        base.minSelections = q.minSelections;
        base.maxSelections = q.maxSelections;
      } else if (q.tag === Q_RANKING) {
        base.options = q.options.filter((o) => o.trim());
        base.minRanked = q.minRanked;
        base.maxRanked = q.maxRanked;
      } else if (q.tag === Q_NUMERIC_RANGE) {
        base.minValue = q.minValue;
        base.maxValue = q.maxValue;
        if (q.step) base.step = q.step;
      } else if (q.tag === Q_POINTS_ALLOCATION) {
        base.options = q.options.filter((o) => o.trim());
        base.budget = q.budget;
      } else if (q.tag === Q_RATING) {
        base.options = q.options.filter((o) => o.trim());
        base.ratingScale = q.ratingScale;
      }
      return base;
    }),
  };
}

// Preview of the v4 on-chain payload (JSON-friendly approximation of the CBOR map)
function buildPreviewPayload(form) {
  const eligibleRoleInts = form.eligibleRoles.map((r) => ROLE_TO_INT[r]).filter((n) => n !== undefined);
  const questions = form.questions.map((q) => {
    const prompt = q.prompt || "(empty)";
    const opts = q.options.filter(Boolean);
    const req = q.required && q.tag !== Q_CUSTOM ? [true] : [];
    switch (q.tag) {
      case Q_CUSTOM:            return [0, prompt, q.contentAnchor || "(content_anchor)"];
      case Q_SINGLE_CHOICE:     return [1, prompt, opts, ...req];
      case Q_MULTI_SELECT:      return [2, prompt, opts, q.minSelections, q.maxSelections, ...req];
      case Q_RANKING:           return [3, prompt, opts, q.minRanked, q.maxRanked, ...req];
      case Q_NUMERIC_RANGE:     return q.step
        ? [4, prompt, [q.minValue, q.maxValue, q.step], ...req]
        : [4, prompt, [q.minValue, q.maxValue], ...req];
      case Q_POINTS_ALLOCATION: return [5, prompt, opts, q.budget, ...req];
      case Q_RATING:            return [6, prompt, opts, q.ratingScale, ...req];
      default:                  return null;
    }
  }).filter(Boolean);

  const definition = {
    0: 4,
    1: [0, "<owner_vkeyhash>"],
    2: form.title,
    3: form.description,
    4: eligibleRoleInts,
    5: form.endEpoch,
    6: form.isTimelocked
      ? [1, "<52db9b…e971>",
          form.revealDateTime
            ? roundAt(new Date(form.revealDateTime).getTime(), defaultChainInfo)
            : 0,
          256]
      : [0],
    7: questions,
  };
  if (form.contentAnchor.trim()) definition[8] = [form.contentAnchor.trim(), "<blake2b-256 of content>"];

  return { [METADATA_LABEL]: [0, [definition]] };
}

export default function CreateSurveyPage() {
  const { walletApi } = useContext(WalletContext);
  const navigate = useNavigate();
  const currentEpoch = useCurrentEpoch();

  const [form, setForm] = useState({
    title: "",
    description: "",
    contentAnchor: "",
    endEpoch: 0,
    eligibleRoles: ["DRep"],
    isTimelocked: false,
    revealDateTime: "",
    questions: [newQuestion()],
  });

  useEffect(() => {
    if (currentEpoch != null && form.endEpoch === 0) {
      setForm((prev) => ({ ...prev, endEpoch: currentEpoch + 2 }));
    }
  }, [currentEpoch]); // eslint-disable-line react-hooks/exhaustive-deps

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);

  if (!walletApi) {
    return (
      <main className="shell">
        <header className="hero">
          <h1>Create Survey</h1>
          <p className="muted">
            Connect your wallet to create an on-chain survey.{" "}
            <Link to="/surveys">← Back to surveys</Link>
          </p>
        </header>
      </main>
    );
  }

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleRole(role, checked) {
    setForm((prev) => {
      const roles = checked
        ? [...prev.eligibleRoles, role]
        : prev.eligibleRoles.filter((r) => r !== role);
      return { ...prev, eligibleRoles: roles };
    });
  }

  function updateQuestion(i, q) {
    const qs = [...form.questions];
    qs[i] = q;
    setField("questions", qs);
  }

  function removeQuestion(i) {
    if (form.questions.length <= 1) return;
    setField("questions", form.questions.filter((_, idx) => idx !== i));
  }

  function moveQuestion(i, dir) {
    const qs = [...form.questions];
    const j = i + dir;
    if (j < 0 || j >= qs.length) return;
    [qs[i], qs[j]] = [qs[j], qs[i]];
    setField("questions", qs);
  }

  function addQuestion() {
    setField("questions", [...form.questions, newQuestion()]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form, currentEpoch);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setSubmitting(true);
    try {
      // best-effort content hash for the optional reference document (non-blocking)
      const caUrl = form.contentAnchor.trim();
      const caHash = caUrl ? await hashAnchorContent(caUrl) : null;
      const result = await buildAndSubmitSurveyCreation(walletApi, buildSurveyForm(form, caHash));
      fetch("/api/surveys/refresh", { method: "POST" }).catch(() => {});
      navigate(`/surveys/${result.surveyTxId}`);
    } catch (err) {
      setErrors([err?.message || "Transaction failed. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  const previewJson = JSON.stringify(buildPreviewPayload(form), null, 2);
  const previewBytes = new TextEncoder().encode(previewJson).length;

  return (
    <main className="shell">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <Link className="muted back-link" to="/surveys">← All Surveys</Link>
          <h1>Create Survey</h1>
          <p className="muted">Build an on-chain poll recorded as Cardano metadata (label 17, CIP-0179 v4).</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="cs-layout">
          {/* ── Left column: form sections ── */}
          <div>
            {/* 01 · Basics */}
            <div className="cs-section">
              <p className="cs-section-label">01 · Basics</p>
              <label className="cs-field-label">
                Title
                <input
                  className="cs-text-input"
                  type="text"
                  placeholder="e.g. Dijkstra hard-fork CIP shortlist"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  required
                />
              </label>
              <div className="cs-section-divider" />
              <label className="cs-field-label">
                Description
                <textarea
                  className="cs-text-input"
                  rows={3}
                  placeholder="Explain the purpose and context of this survey."
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  required
                />
              </label>
              <div className="cs-section-divider" />
              <label className="cs-field-label">
                Content anchor <span className="muted" style={{ fontWeight: 400 }}>(optional — URI linking to supporting document)</span>
                <input
                  className="cs-text-input"
                  type="url"
                  placeholder="https://…"
                  value={form.contentAnchor}
                  onChange={(e) => setField("contentAnchor", e.target.value)}
                />
              </label>
            </div>

            {/* 02 · Audience */}
            <div className="cs-section">
              <p className="cs-section-label">02 · Audience</p>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "12px", lineHeight: 1.5 }}>
                Select which roles may submit a response. Weighting is determined by the consuming tool, not encoded on-chain.
              </div>
              <div className="cs-role-chips">
                {ALL_ROLES.map((role) => {
                  const selected = form.eligibleRoles.includes(role);
                  const color = {
                    DRep: "var(--mint)",
                    SPO: "var(--amber)",
                    CC: "#a78bfa",
                    Stakeholder: "rgba(200,200,210,0.7)",
                  }[role] ?? "var(--mint)";
                  return (
                    <button
                      key={role}
                      type="button"
                      className={`cs-role-chip${selected ? " selected" : ""}`}
                      onClick={() => toggleRole(role, !selected)}
                    >
                      <span className="cs-role-chip-dot" style={{ background: color }} />
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 03 · Duration & Mode */}
            <div className="cs-section">
              <p className="cs-section-label">03 · Duration &amp; Mode</p>
              <div className="cs-epoch-row">
                <div>
                  <label className="cs-field-label" style={{ marginBottom: "10px" }}>End epoch (inclusive)</label>
                  <div className="cs-epoch-stepper">
                    <button
                      type="button"
                      className="cs-epoch-btn"
                      onClick={() => setField("endEpoch", Math.max((currentEpoch ?? 0) + 1, form.endEpoch - 1))}
                    >−</button>
                    <span className="cs-epoch-value">{form.endEpoch || "—"}</span>
                    <button
                      type="button"
                      className="cs-epoch-btn"
                      onClick={() => setField("endEpoch", form.endEpoch + 1)}
                    >+</button>
                  </div>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", alignSelf: "flex-end", paddingBottom: "6px" }}>
                  {currentEpoch != null ? `Current epoch: ${currentEpoch}` : "Loading…"}
                </div>
              </div>

              <div className="cs-section-divider" />

              <label className="cs-field-label" style={{ marginBottom: "10px" }}>Response mode</label>
              <div className="cs-mode-cards">
                <button
                  type="button"
                  className={`cs-mode-card${!form.isTimelocked ? " selected" : ""}`}
                  onClick={() => setField("isTimelocked", false)}
                >
                  <div className="cs-mode-card-label">
                    <span className="cs-mode-card-radio" />
                    Public
                  </div>
                  <p className="cs-mode-card-desc">
                    Responses visible on-chain immediately. Anyone can read the tally in real time.
                  </p>
                </button>
                <button
                  type="button"
                  className={`cs-mode-card${form.isTimelocked ? " selected" : ""}`}
                  onClick={() => setField("isTimelocked", true)}
                >
                  <div className="cs-mode-card-label">
                    <span className="cs-mode-card-radio" />
                    Sealed
                  </div>
                  <p className="cs-mode-card-desc">
                    Marked as timelocked on-chain. Responses require a compatible sealed-voting tool.
                  </p>
                </button>
              </div>

              {form.isTimelocked ? (
                <SealedConfigPanel
                  revealDateTime={form.revealDateTime}
                  onChange={(v) => setField("revealDateTime", v)}
                />
              ) : null}
            </div>

            {/* 04 · Questions */}
            <div className="cs-section">
              <p className="cs-section-label">04 · Questions</p>
              {form.questions.map((q, i) => (
                <QuestionEditor
                  key={q.id}
                  q={q}
                  index={i}
                  total={form.questions.length}
                  onChange={(updated) => updateQuestion(i, updated)}
                  onRemove={() => removeQuestion(i)}
                  onMoveUp={() => moveQuestion(i, -1)}
                  onMoveDown={() => moveQuestion(i, 1)}
                />
              ))}

              <div className="cs-add-q-dashed">
                <p className="cs-add-q-title">Add a question</p>
                <div className="cs-q-type-grid">
                  {Object.entries(METHOD_LABELS).map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      className="cs-q-type-btn"
                      onClick={() => {
                        const q = newQuestion();
                        q.tag = Number(val);
                        setField("questions", [...form.questions, q]);
                      }}
                    >
                      + {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column: live preview + publish ── */}
          <div style={{ position: "sticky", top: "80px" }}>
            <div className="cs-preview-panel">
              <div className="cs-preview-head">
                <div className="cs-preview-dots">
                  <span className="cs-preview-dot" style={{ background: "#ef4444" }} />
                  <span className="cs-preview-dot" style={{ background: "#f59e0b" }} />
                  <span className="cs-preview-dot" style={{ background: "#22c55e" }} />
                </div>
                <span className="cs-preview-lbl">CIP-0179 v4 · live preview</span>
              </div>
              <div className="cs-preview-body">
                <pre>{previewJson}</pre>
              </div>
              <div className="cs-preview-foot">
                <span>~{previewBytes} bytes</span>
              </div>
            </div>

            {errors.length > 0 ? (
              <div className="cs-errors">
                {errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            ) : null}

            <button type="submit" className="cs-publish-btn" disabled={submitting}>
              {submitting ? "Submitting transaction…" : "Publish Survey"}
            </button>
            <div style={{ textAlign: "center", marginTop: "10px" }}>
              <Link to="/surveys" className="muted" style={{ fontSize: "0.82rem" }}>Cancel</Link>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
