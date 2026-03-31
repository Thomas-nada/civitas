import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { WalletContext } from "../context/WalletContext";
import { buildAndSubmitSurveyCreation } from "../services/surveyTxService";

const SHELLEY_EPOCH_START_UNIX = 1596059091;
const EPOCH_DURATION_SECONDS = 432000;

function approxCurrentEpoch() {
  const delta = Math.floor(Date.now() / 1000) - SHELLEY_EPOCH_START_UNIX;
  return delta < 0 ? 0 : 208 + Math.floor(delta / EPOCH_DURATION_SECONDS);
}

function epochToDate(epoch) {
  if (!epoch) return null;
  return new Date((SHELLEY_EPOCH_START_UNIX + (epoch - 208) * EPOCH_DURATION_SECONDS) * 1000);
}

const METHOD_SINGLE_CHOICE = "urn:cardano:poll-method:single-choice:v1";
const METHOD_MULTI_SELECT  = "urn:cardano:poll-method:multi-select:v1";
const METHOD_NUMERIC_RANGE = "urn:cardano:poll-method:numeric-range:v1";

const METHOD_LABELS = {
  [METHOD_SINGLE_CHOICE]: "Single choice",
  [METHOD_MULTI_SELECT]:  "Multi-select",
  [METHOD_NUMERIC_RANGE]: "Numeric range",
};

const ALL_ROLES = ["DRep", "SPO", "CC", "Stakeholder"];
const ROLE_WEIGHTINGS = {
  DRep: ["CredentialBased", "StakeBased"],
  SPO:  ["CredentialBased", "StakeBased", "PledgeBased"],
  CC:   ["CredentialBased"],
  Stakeholder: ["StakeBased"],
};

function newQuestion() {
  return {
    id: crypto.randomUUID(),
    questionId: "",
    question: "",
    methodType: METHOD_SINGLE_CHOICE,
    options: ["", ""],
    maxSelections: 2,
    numericConstraints: { minValue: 0, maxValue: 100, step: 1 },
  };
}

function QuestionEditor({ q, index, onChange, onRemove, canRemove }) {
  const isChoice = q.methodType === METHOD_SINGLE_CHOICE || q.methodType === METHOD_MULTI_SELECT;
  const isMulti  = q.methodType === METHOD_MULTI_SELECT;
  const isNumeric = q.methodType === METHOD_NUMERIC_RANGE;

  function setField(field, value) {
    onChange({ ...q, [field]: value });
  }

  function setOption(i, value) {
    const opts = [...q.options];
    opts[i] = value;
    onChange({ ...q, options: opts });
  }

  function addOption() {
    onChange({ ...q, options: [...q.options, ""] });
  }

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
        Question ID <span className="muted">(unique slug, e.g. "q1")</span>
        <input
          type="text"
          placeholder="q1"
          value={q.questionId}
          onChange={(e) => setField("questionId", e.target.value.replace(/\s+/g, "_").toLowerCase())}
          required
        />
      </label>

      <label>
        Question text
        <input
          type="text"
          placeholder="What is your question?"
          value={q.question}
          onChange={(e) => setField("question", e.target.value)}
          required
        />
      </label>

      <label>
        Method type
        <select value={q.methodType} onChange={(e) => setField("methodType", e.target.value)}>
          {Object.entries(METHOD_LABELS).map(([val, lbl]) => (
            <option key={val} value={val}>{lbl}</option>
          ))}
        </select>
      </label>

      {isChoice ? (
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
            <label style={{ marginTop: "0.5rem" }}>
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
          ) : null}
        </div>
      ) : null}

      {isNumeric ? (
        <div className="numeric-editor">
          <label>
            Min value
            <input type="number" value={q.numericConstraints.minValue}
              onChange={(e) => setField("numericConstraints", { ...q.numericConstraints, minValue: Number(e.target.value) })} />
          </label>
          <label>
            Max value
            <input type="number" value={q.numericConstraints.maxValue}
              onChange={(e) => setField("numericConstraints", { ...q.numericConstraints, maxValue: Number(e.target.value) })} />
          </label>
          <label>
            Step (optional)
            <input type="number" min={1} value={q.numericConstraints.step ?? 1}
              onChange={(e) => setField("numericConstraints", { ...q.numericConstraints, step: Number(e.target.value) })} />
          </label>
        </div>
      ) : null}
    </div>
  );
}

function validate(form) {
  const errors = [];
  if (!form.title.trim()) errors.push("Title is required.");
  if (!form.description.trim()) errors.push("Description is required.");
  if (form.endEpoch <= approxCurrentEpoch()) errors.push("End epoch must be in the future.");
  if (Object.keys(form.roleWeighting).length === 0) errors.push("Select at least one eligible role.");
  if (form.questions.length === 0) errors.push("Add at least one question.");
  for (const [i, q] of form.questions.entries()) {
    if (!q.questionId.trim()) errors.push(`Question ${i + 1}: Question ID is required.`);
    if (!q.question.trim()) errors.push(`Question ${i + 1}: Question text is required.`);
    if (q.methodType !== METHOD_NUMERIC_RANGE) {
      if (q.options.some((o) => !o.trim())) errors.push(`Question ${i + 1}: All options must have text.`);
      if (q.options.length < 2) errors.push(`Question ${i + 1}: At least 2 options required.`);
    }
    if (q.methodType === METHOD_NUMERIC_RANGE && q.numericConstraints.minValue >= q.numericConstraints.maxValue) {
      errors.push(`Question ${i + 1}: Min value must be less than max value.`);
    }
  }
  const qIds = form.questions.map((q) => q.questionId);
  if (new Set(qIds).size !== qIds.length) errors.push("Question IDs must be unique.");
  return errors;
}

function buildPayload(form) {
  return {
    specVersion: "1.0.0",
    title: form.title,
    description: form.description,
    questions: form.questions.map((q) => {
      const base = {
        questionId: q.questionId,
        question: q.question,
        methodType: q.methodType,
      };
      if (q.methodType === METHOD_SINGLE_CHOICE || q.methodType === METHOD_MULTI_SELECT) {
        base.options = q.options.filter((o) => o.trim());
        if (q.methodType === METHOD_MULTI_SELECT) base.maxSelections = q.maxSelections;
      }
      if (q.methodType === METHOD_NUMERIC_RANGE) {
        base.numericConstraints = q.numericConstraints;
      }
      return base;
    }),
    roleWeighting: form.roleWeighting,
    endEpoch: form.endEpoch,
  };
}

export default function CreateSurveyPage() {
  const { walletApi } = useContext(WalletContext);
  const navigate = useNavigate();
  const currentEpoch = approxCurrentEpoch();

  const [form, setForm] = useState({
    title: "",
    description: "",
    endEpoch: currentEpoch + 2,
    roleWeighting: { DRep: "CredentialBased" },
    questions: [newQuestion()],
  });

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
      const rw = { ...prev.roleWeighting };
      if (checked) {
        rw[role] = ROLE_WEIGHTINGS[role][0];
      } else {
        delete rw[role];
      }
      return { ...prev, roleWeighting: rw };
    });
  }

  function setWeighting(role, weighting) {
    setForm((prev) => ({ ...prev, roleWeighting: { ...prev.roleWeighting, [role]: weighting } }));
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

  const endDate = epochToDate(form.endEpoch);
  const payload = buildPayload(form);

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setSubmitting(true);
    try {
      const result = await buildAndSubmitSurveyCreation(walletApi, payload);
      // Trigger a server-side index refresh so the new survey appears sooner
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
          <p className="muted">Build an on-chain poll recorded as Cardano metadata (label 17).</p>
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

        {/* Eligibility & weighting */}
        <section className="panel">
          <h2>Eligibility & Weighting</h2>
          <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
            Select which roles can respond and how votes are weighted.
          </p>
          <div className="role-weighting-grid">
            {ALL_ROLES.map((role) => {
              const checked = role in form.roleWeighting;
              return (
                <div key={role} className={`role-weighting-row${checked ? " checked" : ""}`}>
                  <label className="role-check-label">
                    <input type="checkbox" checked={checked} onChange={(e) => toggleRole(role, e.target.checked)} />
                    <strong>{role}</strong>
                  </label>
                  {checked ? (
                    <select value={form.roleWeighting[role]} onChange={(e) => setWeighting(role, e.target.value)}>
                      {ROLE_WEIGHTINGS[role].map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  ) : (
                    <span className="muted" style={{ fontSize: "0.82rem" }}>Not eligible</span>
                  )}
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
            <input type="number" min={currentEpoch + 1}
              value={form.endEpoch} onChange={(e) => setField("endEpoch", Number(e.target.value))} />
          </label>
          <p className="muted" style={{ fontSize: "0.82rem" }}>
            Current epoch: ~{currentEpoch}
            {endDate ? ` · Epoch ${form.endEpoch} ends ~${endDate.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}` : ""}
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
            {previewOpen ? "Hide" : "Preview"} metadata JSON
          </button>
          {previewOpen ? (
            <pre className="metadata-preview">{JSON.stringify({ 17: { surveyDetails: payload } }, null, 2)}</pre>
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
