import { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { WalletContext } from "../context/WalletContext";
import {
  buildAndSubmitSurveyCreation,
  Q_CUSTOM, Q_SINGLE_CHOICE, Q_MULTI_SELECT, Q_RANKING, Q_NUMERIC_RANGE,
  Q_POINTS_ALLOCATION, Q_RATING,
  ROLE_TO_INT,
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

function QuestionEditor({ q, index, onChange, onRemove, canRemove }) {
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

  function addOption() { onChange({ ...q, options: [...q.options, ""] }); }

  function removeOption(i) {
    if (q.options.length <= 2) return;
    onChange({ ...q, options: q.options.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="question-editor-card">
      <div className="question-editor-header">
        <span className="muted" style={{ fontWeight: 600 }}>Question {index + 1}</span>
        {canRemove ? (
          <button type="button" className="btn-ghost btn-sm" onClick={onRemove} style={{ color: "#ef4444" }}>
            Remove
          </button>
        ) : null}
      </div>

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
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
              <label>
                Min selections
                <input
                  type="number"
                  min={0}
                  max={q.options.length}
                  value={q.minSelections}
                  onChange={(e) => setField("minSelections", Number(e.target.value))}
                  style={{ width: "80px" }}
                />
              </label>
              <label>
                Max selections
                <input
                  type="number"
                  min={1}
                  max={q.options.length}
                  value={q.maxSelections}
                  onChange={(e) => setField("maxSelections", Number(e.target.value))}
                  style={{ width: "80px" }}
                />
              </label>
            </div>
          ) : null}

          {isRanking ? (
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
              <label>
                Min ranked
                <input
                  type="number"
                  min={0}
                  max={q.options.length}
                  value={q.minRanked}
                  onChange={(e) => setField("minRanked", Number(e.target.value))}
                  style={{ width: "80px" }}
                />
              </label>
              <label>
                Max ranked
                <input
                  type="number"
                  min={1}
                  max={q.options.length}
                  value={q.maxRanked}
                  onChange={(e) => setField("maxRanked", Number(e.target.value))}
                  style={{ width: "80px" }}
                />
              </label>
            </div>
          ) : null}

          {isPoints ? (
            <label style={{ marginTop: "0.5rem" }}>
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
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
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
              placeholder="1"
              onChange={(e) => setField("step", e.target.value === "" ? null : Number(e.target.value))} />
          </label>
        </div>
      ) : null}

      {q.tag !== Q_CUSTOM ? (
        <label className="required-checkbox-label" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
          <input type="checkbox" checked={q.required ?? false} onChange={(e) => setField("required", e.target.checked)} />
          Required <span className="muted" style={{ fontSize: "0.8rem" }}>(response must answer this question)</span>
        </label>
      ) : null}
    </div>
  );
}

function validate(form, currentEpoch) {
  const errors = [];
  if (!form.title.trim()) errors.push("Title is required.");
  if (!form.description.trim()) errors.push("Description is required.");
  if (currentEpoch != null && form.endEpoch <= currentEpoch) errors.push("End epoch must be in the future.");
  if (form.eligibleRoles.length === 0) errors.push("Select at least one eligible role.");
  if (form.questions.length === 0) errors.push("Add at least one question.");
  for (const [i, q] of form.questions.entries()) {
    if (!q.prompt.trim()) errors.push(`Question ${i + 1}: Question text is required.`);
    if (q.tag !== Q_NUMERIC_RANGE && q.tag !== Q_CUSTOM) {
      if (q.options.some((o) => !o.trim())) errors.push(`Question ${i + 1}: All options must have text.`);
      if (q.options.length < 2) errors.push(`Question ${i + 1}: At least 2 options required.`);
    }
    if (q.tag === Q_NUMERIC_RANGE && q.minValue >= q.maxValue) {
      errors.push(`Question ${i + 1}: Min value must be less than max value.`);
    }
    if (q.tag === Q_MULTI_SELECT && q.minSelections > q.maxSelections) {
      errors.push(`Question ${i + 1}: Min selections cannot exceed max selections.`);
    }
    if (q.tag === Q_RANKING && q.minRanked > q.maxRanked) {
      errors.push(`Question ${i + 1}: Min ranked cannot exceed max ranked.`);
    }
  }
  return errors;
}

function buildSurveyForm(form) {
  return {
    title: form.title,
    description: form.description,
    endEpoch: form.endEpoch,
    eligibleRoles: form.eligibleRoles,
    questions: form.questions.map((q) => {
      const base = { tag: q.tag, prompt: q.prompt };
      if (q.required && q.tag !== Q_CUSTOM) base.required = true;
      if (q.tag === Q_SINGLE_CHOICE) {
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

// Preview of the v4 on-chain payload (JSON-friendly approximation)
function buildPreviewPayload(form) {
  const eligibleRoleInts = form.eligibleRoles.map((r) => ROLE_TO_INT[r]).filter((n) => n !== undefined);
  const questions = form.questions.map((q) => {
    const prompt = q.prompt || "(empty)";
    const opts = q.options.filter(Boolean);
    switch (q.tag) {
      case Q_CUSTOM:            return [0, prompt, "(content_anchor)"];
      case Q_SINGLE_CHOICE:     return [1, prompt, opts];
      case Q_MULTI_SELECT:      return [2, prompt, opts, q.minSelections, q.maxSelections];
      case Q_RANKING:           return [3, prompt, opts, q.minRanked, q.maxRanked];
      case Q_NUMERIC_RANGE:     return q.step ? [4, prompt, [q.minValue, q.maxValue, q.step]] : [4, prompt, [q.minValue, q.maxValue]];
      case Q_POINTS_ALLOCATION: return [5, prompt, opts, q.budget];
      case Q_RATING:            return [6, prompt, opts, q.ratingScale];
      default:                  return null;
    }
  }).filter(Boolean);

  // v4 definition map (shown as object with integer keys)
  const definition = {
    0: 4,
    1: [0, "<owner_vkeyhash>"],
    2: form.title,
    3: form.description,
    4: eligibleRoleInts,
    5: form.endEpoch,
    6: [0],
    7: questions,
  };

  return { 17: [0, [definition]] };
}

export default function CreateSurveyPage() {
  const { walletApi } = useContext(WalletContext);
  const navigate = useNavigate();
  const currentEpoch = useCurrentEpoch();

  const [form, setForm] = useState({
    title: "",
    description: "",
    endEpoch: 0,
    eligibleRoles: ["DRep"],
    questions: [newQuestion()],
  });

  useEffect(() => {
    if (currentEpoch != null && form.endEpoch === 0) {
      setForm((prev) => ({ ...prev, endEpoch: currentEpoch + 2 }));
    }
  }, [currentEpoch]); // eslint-disable-line react-hooks/exhaustive-deps

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);

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
    setField("questions", form.questions.filter((_, idx) => idx !== i));
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
      const result = await buildAndSubmitSurveyCreation(walletApi, buildSurveyForm(form));
      fetch("/api/surveys/refresh", { method: "POST" }).catch(() => {});
      navigate(`/surveys/${result.surveyTxId}`);
    } catch (err) {
      setErrors([err?.message || "Transaction failed. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="shell">
      <header className="hero dashboard-header">
        <div>
          <Link className="muted back-link" to="/surveys">← All Surveys</Link>
          <h1>Create Survey</h1>
          <p className="muted">Build an on-chain poll recorded as Cardano metadata (label 17, CIP-0179 v4).</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="create-survey-form">
        {/* Basic info */}
        <section className="panel">
          <h2>Survey Details</h2>
          <label>
            Title
            <input type="text" placeholder="e.g. Dijkstra hard-fork CIP shortlist"
              value={form.title} onChange={(e) => setField("title", e.target.value)} required />
          </label>
          <label>
            Description
            <textarea rows={3} placeholder="Explain the purpose and context of this survey."
              value={form.description} onChange={(e) => setField("description", e.target.value)} required />
          </label>
        </section>

        {/* Eligible roles */}
        <section className="panel">
          <h2>Eligible Roles</h2>
          <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
            Select which roles may submit a response. Weighting and aggregation are determined by the consuming tool, not encoded on-chain.
          </p>
          <div className="role-weighting-grid">
            {ALL_ROLES.map((role) => {
              const checked = form.eligibleRoles.includes(role);
              return (
                <div key={role} className={`role-weighting-row${checked ? " checked" : ""}`}>
                  <label className="role-check-label">
                    <input type="checkbox" checked={checked} onChange={(e) => toggleRole(role, e.target.checked)} />
                    <strong>{role}</strong>
                  </label>
                  {!checked ? (
                    <span className="muted" style={{ fontSize: "0.82rem" }}>Not eligible</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* End epoch */}
        <section className="panel">
          <h2>Duration</h2>
          <label>
            End epoch (inclusive)
            <input type="number" min={(currentEpoch ?? 0) + 1}
              value={form.endEpoch || ""} onChange={(e) => setField("endEpoch", Number(e.target.value))} />
          </label>
          <p className="muted" style={{ fontSize: "0.82rem" }}>
            {currentEpoch != null ? `Current epoch: ${currentEpoch}` : "Loading current epoch…"}
          </p>
        </section>

        {/* Questions */}
        <section className="panel">
          <h2>Questions</h2>
          {form.questions.map((q, i) => (
            <QuestionEditor
              key={q.id}
              q={q}
              index={i}
              onChange={(updated) => updateQuestion(i, updated)}
              onRemove={() => removeQuestion(i)}
              canRemove={form.questions.length > 1}
            />
          ))}
          <button type="button" className="btn-ghost" onClick={addQuestion}>+ Add question</button>
        </section>

        {/* Metadata preview */}
        <section className="panel">
          <button type="button" className="btn-ghost" onClick={() => setPreviewOpen((o) => !o)}>
            {previewOpen ? "Hide" : "Preview"} on-chain format (CIP-0179 v4)
          </button>
          {previewOpen ? (
            <pre className="metadata-preview">{JSON.stringify(buildPreviewPayload(form), null, 2)}</pre>
          ) : null}
        </section>

        {/* Errors */}
        {errors.length > 0 ? (
          <section className="panel" style={{ borderLeft: "3px solid #ef4444" }}>
            {errors.map((e, i) => <p key={i} style={{ color: "#ef4444" }}>{e}</p>)}
          </section>
        ) : null}

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Submitting transaction…" : "Create Survey"}
          </button>
          <Link to="/surveys" className="btn-ghost">Cancel</Link>
        </div>
      </form>
    </main>
  );
}
