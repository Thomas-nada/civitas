// Publish a CIP-179 v5 survey: basics, audience, duration and mode, the
// questions, a live preview of the label-17 metadatum, then one transaction
// signed by the connected wallet.
import { useContext, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { roundForUnixTime } from "cip-179/tlock";
import { WalletContext } from "../context/WalletContext";
import { useSeoMeta } from "../hooks/useSeoMeta";
import {
  buildAndSubmitSurveyCreation, hashAnchorContent,
  Q_CUSTOM, Q_SINGLE_CHOICE, Q_MULTI_SELECT, Q_RANKING, Q_NUMERIC_RANGE, Q_POINTS_ALLOCATION, Q_RATING,
  ROLE_TO_INT, METADATA_LABEL
} from "../services/surveyTxService";
import { useCurrentEpoch } from "../hooks/useCurrentEpoch";
import RolePill from "../components/survey/RolePill";
import { Alert, Button, Card, Checkbox, Chip, EmptyState, Field, IconButton, Input, PageHeader, Pill, Select, Textarea } from "../ui";
import { IconArrowDown, IconArrowLeft, IconArrowUp, IconClose } from "../ui/icons";

const METHOD_LABELS = {
  [Q_CUSTOM]: "Custom", [Q_SINGLE_CHOICE]: "Single choice", [Q_MULTI_SELECT]: "Multi-select", [Q_RANKING]: "Ranking",
  [Q_NUMERIC_RANGE]: "Numeric range", [Q_POINTS_ALLOCATION]: "Points allocation", [Q_RATING]: "Rating"
};
const ALL_ROLES = ["DRep", "SPO", "CC", "Stakeholder", "Keyholder"];

function newQuestion(tag = Q_SINGLE_CHOICE) {
  return {
    id: crypto.randomUUID(), tag, prompt: "", required: false, contentAnchor: "", options: ["", ""],
    minSelections: 0, maxSelections: 2, minRanked: 1, maxRanked: 2, minValue: "0", maxValue: "100", step: null,
    budget: 100, ratingScale: ["1", "5"], requireAll: false
  };
}

function QuestionEditor({ q, index, total, onChange, onRemove, onMoveUp, onMoveDown }) {
  const isCustom = q.tag === Q_CUSTOM;
  const isChoice = q.tag === Q_SINGLE_CHOICE || q.tag === Q_MULTI_SELECT;
  const isRanking = q.tag === Q_RANKING;
  const isMulti = q.tag === Q_MULTI_SELECT;
  const isNumeric = q.tag === Q_NUMERIC_RANGE;
  const isPoints = q.tag === Q_POINTS_ALLOCATION;
  const isRating = q.tag === Q_RATING;
  const hasOptions = isChoice || isRanking || isPoints || isRating;
  const set = (field, value) => onChange({ ...q, [field]: value });
  const setOption = (i, value) => { const opts = [...q.options]; opts[i] = value; onChange({ ...q, options: opts }); };
  const addOption = () => { const opts = [...q.options, ""]; onChange({ ...q, options: opts, maxSelections: isMulti ? opts.length : q.maxSelections, maxRanked: isRanking ? opts.length : q.maxRanked }); };
  const removeOption = (i) => {
    if (q.options.length <= 2) return;
    const opts = q.options.filter((_, idx) => idx !== i);
    onChange({ ...q, options: opts, maxSelections: isMulti ? Math.min(q.maxSelections, opts.length) : q.maxSelections, minSelections: isMulti ? Math.min(q.minSelections, opts.length) : q.minSelections, maxRanked: isRanking ? Math.min(q.maxRanked, opts.length) : q.maxRanked, minRanked: isRanking ? Math.min(q.minRanked, opts.length) : q.minRanked });
  };

  return (
    <Card className="svy-qeditor" title={<span className="row"><Pill tone="accent" size="sm">Q{index + 1}</Pill><span>{METHOD_LABELS[q.tag] ?? "Custom"}</span></span>} actions={<>
      <IconButton size="sm" label="Move question up" onClick={onMoveUp} disabled={index === 0}><IconArrowUp size={14} /></IconButton>
      <IconButton size="sm" label="Move question down" onClick={onMoveDown} disabled={index === total - 1}><IconArrowDown size={14} /></IconButton>
      <IconButton size="sm" variant="danger" label="Remove question" onClick={onRemove} disabled={total <= 1}><IconClose size={14} /></IconButton>
    </>}>
      <div className="stack">
        <Field label="Question text">{(id) => <Input id={id} value={q.prompt} onChange={(e) => set("prompt", e.target.value)} placeholder="What is your question?" required />}</Field>
        <Field label="Method type">{(id) => <Select id={id} value={q.tag} onChange={(e) => set("tag", Number(e.target.value))}>{Object.entries(METHOD_LABELS).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}</Select>}</Field>
        {isCustom ? <Field label="Content anchor" hint="URI, required for custom questions.">{(id) => <Input id={id} type="url" value={q.contentAnchor} onChange={(e) => set("contentAnchor", e.target.value)} placeholder="https://…" />}</Field> : null}
        {hasOptions ? (
          <div className="stack--2">
            <span className="c-field__label">Options</span>
            {q.options.map((opt, i) => (
              <div key={i} className="row" style={{ flexWrap: "nowrap" }}>
                <Input value={opt} onChange={(e) => setOption(i, e.target.value)} placeholder={`Option ${i + 1}`} required aria-label={`Option ${i + 1}`} />
                <IconButton size="sm" label="Remove option" onClick={() => removeOption(i)} disabled={q.options.length <= 2}><IconClose size={14} /></IconButton>
              </div>
            ))}
            <div><Button size="sm" onClick={addOption}>+ Add option</Button></div>
            {isMulti ? <div className="grid grid--2"><Field label="Min selections">{(id) => <Input id={id} type="number" min={0} max={q.options.length} value={q.minSelections} onChange={(e) => set("minSelections", Math.min(Number(e.target.value), q.maxSelections))} />}</Field><Field label="Max selections">{(id) => <Input id={id} type="number" min={Math.max(1, q.minSelections)} max={q.options.length} value={q.maxSelections} onChange={(e) => set("maxSelections", Math.min(Number(e.target.value), q.options.length))} />}</Field></div> : null}
            {isRanking ? <div className="grid grid--2"><Field label="Min ranked">{(id) => <Input id={id} type="number" min={1} max={q.options.length} value={q.minRanked} onChange={(e) => set("minRanked", Math.min(Math.max(1, Number(e.target.value)), q.maxRanked))} />}</Field><Field label="Max ranked">{(id) => <Input id={id} type="number" min={Math.max(1, q.minRanked)} max={q.options.length} value={q.maxRanked} onChange={(e) => set("maxRanked", Math.min(Number(e.target.value), q.options.length))} />}</Field></div> : null}
            {isPoints ? <Field label="Budget" hint="Total points to allocate.">{(id) => <Input id={id} type="number" min={1} value={q.budget} onChange={(e) => set("budget", Number(e.target.value))} style={{ maxWidth: 160 }} />}</Field> : null}
            {isRating ? <div className="stack--2"><div className="grid grid--2"><Field label="Rating min">{(id) => <Input id={id} type="number" value={q.ratingScale[0]} onChange={(e) => set("ratingScale", [e.target.value, q.ratingScale[1]])} />}</Field><Field label="Rating max">{(id) => <Input id={id} type="number" value={q.ratingScale[1]} onChange={(e) => set("ratingScale", [q.ratingScale[0], e.target.value])} />}</Field></div><Checkbox checked={q.requireAll} onChange={(v) => set("requireAll", v)} label="Require a rating for every option" /></div> : null}
          </div>
        ) : null}
        {isNumeric ? <div className="grid grid--3"><Field label="Min value">{(id) => <Input id={id} type="number" value={q.minValue} onChange={(e) => set("minValue", e.target.value)} />}</Field><Field label="Max value">{(id) => <Input id={id} type="number" value={q.maxValue} onChange={(e) => set("maxValue", e.target.value)} />}</Field><Field label="Step" hint="Optional.">{(id) => <Input id={id} type="number" min={1} value={q.step ?? ""} placeholder="any" onChange={(e) => set("step", e.target.value === "" ? null : e.target.value)} />}</Field></div> : null}
        {!isCustom ? <Checkbox checked={q.required ?? false} onChange={(v) => set("required", v)} label="Required: a response must answer this question" /> : null}
      </div>
    </Card>
  );
}

// A <input type="datetime-local"> value carries no timezone; it is read as UTC
// so every creator and viewer agrees on the same reveal instant.
function revealMsUtc(dt) {
  if (!dt) return NaN;
  return new Date(dt.length === 16 ? `${dt}:00Z` : `${dt}Z`).getTime();
}

function SealedConfig({ revealDateTime, onChange }) {
  const { round, isPast } = useMemo(() => {
    if (!revealDateTime) return { round: null, isPast: false };
    try { const ms = revealMsUtc(revealDateTime); return { round: roundForUnixTime(Math.ceil(ms / 1000)), isPast: ms < Date.now() }; } catch { return { round: null, isPast: false }; }
  }, [revealDateTime]);
  const minDateTime = useMemo(() => new Date(Date.now() + 3600_000).toISOString().slice(0, 16), []);
  return (
    <Field label="Reveal responses after (UTC)" hint={revealDateTime ? (isPast ? "This date is in the past." : round ? `Sealed until this date · drand round ${round.toLocaleString()}` : null) : "Responses will be unreadable on chain until this moment passes."} error={revealDateTime && isPast ? "Pick a future date." : null}>
      {(id) => <Input id={id} type="datetime-local" min={minDateTime} value={revealDateTime} onChange={(e) => onChange(e.target.value)} className="mono" />}
    </Field>
  );
}

function validate(form, currentEpoch) {
  const errors = [];
  if (!form.title.trim()) errors.push("Title is required.");
  if (!form.description.trim()) errors.push("Description is required.");
  if (currentEpoch != null && form.endEpoch <= currentEpoch) errors.push("End epoch must be in the future.");
  if (form.eligibleRoles.length === 0) errors.push("Select at least one eligible role.");
  if (form.isTimelocked && !form.revealDateTime) errors.push("Sealed mode requires a reveal date and time.");
  if (form.isTimelocked && form.revealDateTime && revealMsUtc(form.revealDateTime) <= Date.now()) errors.push("Reveal date must be in the future.");
  if (form.questions.length === 0) errors.push("Add at least one question.");
  if (form.contentAnchor.trim() && !/^(?:https:\/\/|ipfs:\/\/).+/.test(form.contentAnchor.trim())) errors.push("Survey content anchor must be a valid HTTPS or IPFS URI.");
  for (const [i, q] of form.questions.entries()) {
    const n = i + 1;
    if (!q.prompt.trim()) errors.push(`Question ${n}: question text is required.`);
    if (q.tag === Q_CUSTOM) { if (!q.contentAnchor?.trim()) errors.push(`Question ${n}: custom questions require a content anchor URI.`); }
    else if (q.tag !== Q_NUMERIC_RANGE) {
      if (q.options.some((o) => !o.trim())) errors.push(`Question ${n}: all options must have text.`);
      if (q.options.length < 2) errors.push(`Question ${n}: at least 2 options are required.`);
    }
    if (q.tag === Q_NUMERIC_RANGE) {
      try {
        if (BigInt(q.minValue) >= BigInt(q.maxValue)) errors.push(`Question ${n}: min value must be less than max value.`);
        if (q.step != null && BigInt(q.step) < 1n) errors.push(`Question ${n}: step must be positive.`);
      } catch { errors.push(`Question ${n}: numeric constraints must be integers.`); }
    }
    if (q.tag === Q_MULTI_SELECT) {
      if (q.minSelections > q.maxSelections) errors.push(`Question ${n}: min selections cannot exceed max selections.`);
      if (q.maxSelections > q.options.length) errors.push(`Question ${n}: max selections cannot exceed the option count (${q.options.length}).`);
    }
    if (q.tag === Q_RANKING) {
      if (q.minRanked > q.maxRanked) errors.push(`Question ${n}: min ranked cannot exceed max ranked.`);
      if (q.maxRanked > q.options.length) errors.push(`Question ${n}: max ranked cannot exceed the option count (${q.options.length}).`);
    }
    if (q.tag === Q_POINTS_ALLOCATION && q.budget < 1) errors.push(`Question ${n}: budget must be at least 1.`);
    if (q.tag === Q_RATING) {
      try { if (BigInt(q.ratingScale[0]) >= BigInt(q.ratingScale[1])) errors.push(`Question ${n}: rating min must be less than rating max.`); }
      catch { errors.push(`Question ${n}: rating bounds must be integers.`); }
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
    drandRound: form.isTimelocked && form.revealDateTime ? roundForUnixTime(Math.ceil(revealMsUtc(form.revealDateTime) / 1000)) : undefined,
    padding: form.isTimelocked ? 256 : undefined,
    questions: form.questions.map((q) => {
      const base = { tag: q.tag, prompt: q.prompt };
      if (q.required) base.required = true;
      const opts = q.options.filter((o) => o.trim());
      if (q.tag === Q_CUSTOM) { base.contentAnchorUrl = q.contentAnchor.trim(); base.contentAnchorHash = q._contentAnchorHash || undefined; }
      else if (q.tag === Q_SINGLE_CHOICE) base.options = opts;
      else if (q.tag === Q_MULTI_SELECT) { base.options = opts; base.minSelections = q.minSelections; base.maxSelections = q.maxSelections; }
      else if (q.tag === Q_RANKING) { base.options = opts; base.minRanked = q.minRanked; base.maxRanked = q.maxRanked; }
      else if (q.tag === Q_NUMERIC_RANGE) { base.minValue = q.minValue; base.maxValue = q.maxValue; if (q.step) base.step = q.step; }
      else if (q.tag === Q_POINTS_ALLOCATION) { base.options = opts; base.budget = q.budget; }
      else if (q.tag === Q_RATING) { base.options = opts; base.ratingScale = q.ratingScale; base.requireAll = q.requireAll; }
      return base;
    })
  };
}

// JSON-friendly preview of the v5 native metadatum shape.
function buildPreviewPayload(form) {
  const roles = form.eligibleRoles.map((r) => ROLE_TO_INT[r]).filter((n) => n !== undefined);
  const questions = form.questions.map((q) => {
    const prompt = q.prompt || "(empty)";
    const opts = q.options.filter(Boolean);
    const req = q.required ? [true] : [];
    switch (q.tag) {
      case Q_CUSTOM: return [0, prompt, [q.contentAnchor || "(uri)", "<blake2b-256>"], ...req];
      case Q_SINGLE_CHOICE: return [1, prompt, opts, ...req];
      case Q_MULTI_SELECT: return [2, prompt, opts, q.minSelections, q.maxSelections, ...req];
      case Q_RANKING: return [3, prompt, opts, q.minRanked, q.maxRanked, ...req];
      case Q_NUMERIC_RANGE: return q.step ? [4, prompt, [q.minValue, q.maxValue, q.step], ...req] : [4, prompt, [q.minValue, q.maxValue], ...req];
      case Q_POINTS_ALLOCATION: return [5, prompt, opts, q.budget, ...req];
      case Q_RATING: return [6, prompt, opts, q.ratingScale, q.requireAll ? 1 : 0, ...req];
      default: return null;
    }
  }).filter(Boolean);
  const definition = {
    0: 5, 1: [0, "<owner_vkeyhash>"], 2: form.title, 3: form.description, 4: roles, 5: form.endEpoch,
    6: form.isTimelocked ? [1, "<52db9b…e971>", form.revealDateTime ? roundForUnixTime(Math.ceil(revealMsUtc(form.revealDateTime) / 1000)) : 0, 256] : [0],
    7: questions
  };
  if (form.contentAnchor.trim()) definition[8] = [form.contentAnchor.trim(), "<blake2b-256 of content>"];
  return { [METADATA_LABEL]: [0, [definition]] };
}

export default function CreateSurveyPage() {
  useSeoMeta({ title: "Create a survey", description: "Publish a CIP-179 on-chain survey or poll from your Cardano wallet." });
  const { walletApi } = useContext(WalletContext);
  const navigate = useNavigate();
  const currentEpoch = useCurrentEpoch();
  const [form, setForm] = useState({ title: "", description: "", contentAnchor: "", endEpoch: 0, eligibleRoles: ["DRep"], isTimelocked: false, revealDateTime: "", questions: [newQuestion()] });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  // The end epoch defaults to two epochs out once the current epoch is known.
  const endEpoch = form.endEpoch || (currentEpoch != null ? currentEpoch + 2 : 0);
  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const setQuestions = (fn) => setForm((prev) => ({ ...prev, questions: fn(prev.questions) }));

  if (!walletApi) {
    return (
      <main className="shell page p-survey">
        <Link to="/surveys" className="c-btn c-btn--ghost c-btn--sm"><IconArrowLeft size={16} /> All surveys</Link>
        <div style={{ height: 16 }} />
        <EmptyState title="Sign in with a wallet to create a survey." action={<Button to="/surveys">Back to surveys</Button>}>Publishing a survey is one on-chain transaction signed by your wallet; you pay only the network fee.</EmptyState>
      </main>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const draft = { ...form, endEpoch };
    const errs = validate(draft, currentEpoch);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setSubmitting(true);
    try {
      const caUrl = draft.contentAnchor.trim();
      const caHash = caUrl ? await hashAnchorContent(caUrl) : null;
      if (caUrl && !caHash) throw new Error("The external survey presentation could not be fetched and hashed.");
      const questions = await Promise.all(draft.questions.map(async (q) => {
        if (q.tag === Q_CUSTOM && q.contentAnchor?.trim()) {
          const hash = await hashAnchorContent(q.contentAnchor.trim());
          if (!hash) throw new Error("A custom question schema could not be fetched and hashed.");
          return { ...q, _contentAnchorHash: hash };
        }
        return q;
      }));
      const result = await buildAndSubmitSurveyCreation(walletApi, buildSurveyForm({ ...draft, questions }, caHash));
      fetch("/api/surveys/refresh", { method: "POST" }).catch(() => {});
      navigate(`/surveys/${result.surveyTxId}/${result.surveyIndex}`);
    } catch (err) {
      setErrors([err?.message || "Transaction failed. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  const previewJson = JSON.stringify(buildPreviewPayload({ ...form, endEpoch }), null, 2);
  const previewBytes = new TextEncoder().encode(previewJson).length;

  return (
    <main className="shell page p-survey">
      <Link to="/surveys" className="c-btn c-btn--ghost c-btn--sm" style={{ marginBottom: 12 }}><IconArrowLeft size={16} /> All surveys</Link>
      <PageHeader eyebrow="Surveys" title="Create a survey" lead="Build a CIP-179 v5 on-chain poll recorded under Cardano metadata label 17." />
      <form onSubmit={handleSubmit} className="svy-create">
        <div className="stack">
          <Card title="1 · Basics">
            <div className="stack">
              <Field label="Title">{(id) => <Input id={id} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Dijkstra hard-fork CIP shortlist" required />}</Field>
              <Field label="Description">{(id) => <Textarea id={id} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Explain the purpose and context of this survey." required />}</Field>
              <Field label="Content anchor" hint="Optional URI linking to a supporting document.">{(id) => <Input id={id} type="url" value={form.contentAnchor} onChange={(e) => set("contentAnchor", e.target.value)} placeholder="https://…" />}</Field>
            </div>
          </Card>
          <Card title="2 · Audience" subtitle="Which roles may submit a response. Weighting is decided by the consuming tool, not encoded on chain.">
            <div className="c-chips">{ALL_ROLES.map((role) => { const on = form.eligibleRoles.includes(role); return <Chip key={role} active={on} onClick={() => set("eligibleRoles", on ? form.eligibleRoles.filter((r) => r !== role) : [...form.eligibleRoles, role])}><RolePill role={role} /></Chip>; })}</div>
          </Card>
          <Card title="3 · Duration and mode">
            <div className="stack">
              <div className="row row--4">
                <Field label="End epoch (inclusive)" hint={currentEpoch != null ? `Current epoch ${currentEpoch}.` : "Loading the current epoch…"}>{(id) => (
                  <div className="row" style={{ flexWrap: "nowrap" }}>
                    <Button onClick={() => set("endEpoch", Math.max((currentEpoch ?? 0) + 1, endEpoch - 1))} aria-label="Earlier epoch">−</Button>
                    <Input id={id} type="number" className="num" value={endEpoch || ""} onChange={(e) => set("endEpoch", Number(e.target.value))} style={{ width: 110, textAlign: "center" }} />
                    <Button onClick={() => set("endEpoch", endEpoch + 1)} aria-label="Later epoch">+</Button>
                  </div>
                )}</Field>
              </div>
              <div>
                <span className="c-field__label">Response mode</span>
                <div className="grid grid--2 svy-modes">
                  <button type="button" className={`svy-mode${!form.isTimelocked ? " is-selected" : ""}`} aria-pressed={!form.isTimelocked} onClick={() => set("isTimelocked", false)}><strong>Public</strong><span className="small muted">Responses are visible on chain immediately. Anyone can read the tally in real time.</span></button>
                  <button type="button" className={`svy-mode${form.isTimelocked ? " is-selected" : ""}`} aria-pressed={form.isTimelocked} onClick={() => set("isTimelocked", true)}><strong>Sealed</strong><span className="small muted">Answers are encoded as canonical CBOR and timelock-encrypted on the responder's device until the reveal round.</span></button>
                </div>
              </div>
              {form.isTimelocked ? <SealedConfig revealDateTime={form.revealDateTime} onChange={(v) => set("revealDateTime", v)} /> : null}
            </div>
          </Card>
          <div className="stack">
            <h2 className="c-card__title" style={{ fontSize: "var(--text-lg)" }}>4 · Questions</h2>
            {form.questions.map((q, i) => (
              <QuestionEditor key={q.id} q={q} index={i} total={form.questions.length}
                onChange={(u) => setQuestions((qs) => qs.map((x, idx) => (idx === i ? u : x)))}
                onRemove={() => setQuestions((qs) => (qs.length <= 1 ? qs : qs.filter((_, idx) => idx !== i)))}
                onMoveUp={() => setQuestions((qs) => { if (i === 0) return qs; const n = [...qs]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })}
                onMoveDown={() => setQuestions((qs) => { if (i >= qs.length - 1) return qs; const n = [...qs]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })} />
            ))}
            <Card soft title="Add a question"><div className="c-chips">{Object.entries(METHOD_LABELS).map(([val, lbl]) => <Chip key={val} onClick={() => setQuestions((qs) => [...qs, newQuestion(Number(val))])}>+ {lbl}</Chip>)}</div></Card>
          </div>
        </div>

        <aside className="svy-create__side">
          <Card title="Live preview" subtitle="CIP-179 v5 metadatum" footer={`~${previewBytes} bytes`}>
            <pre className="svy-preview">{previewJson}</pre>
          </Card>
          {errors.length > 0 ? <Alert tone="danger" title="Fix these before publishing:"><ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></Alert> : null}
          <Button type="submit" variant="primary" size="lg" block loading={submitting} disabled={submitting}>{submitting ? "Submitting transaction…" : "Publish survey"}</Button>
          <div style={{ textAlign: "center" }}><Link to="/surveys" className="small muted">Cancel</Link></div>
        </aside>
      </form>
    </main>
  );
}
