// The informational tally of a survey, drawn the way DRepTalk draws it: a
// named reading, not a claimed result. CIP-179 mandates no counting policy,
// so the card says which rules it counted under (the generic CIP-179
// validity rules, nothing beyond them), names the denominator under every
// share, and keeps the DRep head count next to the voting-power figures so a
// counted DRep whose power could not be resolved never disappears from their
// own answer. Bars are shares only for single choice, where the shares add up
// to one whole; every other kind compares options against the leading one.
import { adaLabel } from "../../services/surveyPresentation";
import { Card, Pill } from "../../ui";

const EXCLUSION_LABELS = {
  "after-deadline": "sent after the closing epoch",
  invalid: "invalid against the definition",
  unproven: "credential not proven by the transaction",
  superseded: "replaced by a later answer",
  undecryptable: "sealed answer that did not reveal"
};

function toBig(value) { try { return BigInt(value ?? 0); } catch { return 0n; } }
function pct(numerator, denominator) { const d = toBig(denominator); return d === 0n ? null : Number((toBig(numerator) * 10000n) / d) / 100; }
function pctLabel(value) { return value == null ? "—" : `${value < 10 ? value.toFixed(1) : Math.round(value)}%`; }
function mean(weightedSum, weight, digits = 2) { const w = toBig(weight); return w === 0n ? null : (Number(toBig(weightedSum)) / Number(w)).toFixed(digits); }

function Bar({ share, tone = "accent" }) {
  const width = share == null ? 0 : Math.max(0, Math.min(100, share));
  return <div className="c-bar" aria-hidden="true"><span className={`c-bar__seg c-bar__seg--${tone}`} style={{ width: `${width}%` }} /></div>;
}

function Option({ label, figures, share, tone }) {
  return (
    <li className="svy-option">
      <div className="svy-option__head"><span className="svy-option__label">{label}</span><span className="svy-option__figures">{figures}</span></div>
      <Bar share={share} tone={tone} />
    </li>
  );
}

function OptionsQuestion({ question, head, weighted, weightedAvailable }) {
  const labels = question.options || [];
  const headByIndex = new Map((head?.options || []).map((o) => [o.index, o]));
  const wByIndex = new Map((weighted?.options || []).map((o) => [o.index, o]));
  const isShare = head?.unit === "singleChoice";
  const leader = (weighted?.options || []).reduce((max, o) => (toBig(o.weight) > max ? toBig(o.weight) : max), 0n);
  const leaderCount = (head?.options || []).reduce((max, o) => Math.max(max, o.count), 0);
  const basis = isShare ? "Shares divide by the answered voting power of this question." : head?.unit === "rankingFirst" ? "First-ranked option per answer; bars compare options against the leading one, not shares of a whole." : "Several options per answer; bars compare options against the leading one, not shares of a whole.";
  return (
    <>
      <ul className="svy-options">
        {labels.map((label, index) => {
          const count = headByIndex.get(index)?.count ?? 0;
          const weight = wByIndex.get(index)?.weight ?? "0";
          const share = weightedAvailable ? (isShare ? pct(weight, weighted?.answeredWeight) : leader > 0n ? Number((toBig(weight) * 100n) / leader) : 0) : isShare ? pct(count, head?.answeredCount) : leaderCount > 0 ? (count * 100) / leaderCount : 0;
          return (
            <Option key={index} label={label} share={share} tone={weightedAvailable ? "accent" : "muted"} figures={<>
              {weightedAvailable ? <strong>{adaLabel(weight)}</strong> : null}
              {weightedAvailable && isShare ? <span className="muted">{pctLabel(pct(weight, weighted?.answeredWeight))}</span> : null}
              <span className="muted">{count} {count === 1 ? "DRep" : "DReps"}</span>
            </>} />
          );
        })}
      </ul>
      <p className="tiny muted">{basis} Answered by {head?.answeredCount ?? 0} counted {head?.answeredCount === 1 ? "DRep" : "DReps"}{weightedAvailable ? ` holding ${adaLabel(weighted?.answeredWeight)}` : ""}.</p>
    </>
  );
}

function NumericQuestion({ head, weighted, weightedAvailable }) {
  const values = [...(head?.values || [])].sort((a, b) => (toBig(a.value) < toBig(b.value) ? -1 : 1));
  return (
    <>
      <div className="c-stats" style={{ marginBottom: 10 }}>
        <div className="c-stat"><span className="c-stat__label">Mean per DRep</span><span className="c-stat__value">{mean(head?.weightedSum, head?.answeredWeight) ?? "—"}</span></div>
        {weightedAvailable ? <div className="c-stat"><span className="c-stat__label">Mean, power-weighted</span><span className="c-stat__value">{mean(weighted?.weightedSum, weighted?.answeredWeight) ?? "—"}</span></div> : null}
        <div className="c-stat"><span className="c-stat__label">Answered</span><span className="c-stat__value">{head?.answeredCount ?? 0}</span></div>
      </div>
      {values.length ? <ul className="svy-values">{values.map((v) => <li key={v.value}><span className="mono">{v.value}</span><span className="muted">× {v.count}</span></li>)}</ul> : null}
    </>
  );
}

function PerOptionQuestion({ question, head, weighted, weightedAvailable }) {
  const labels = question.options || [];
  const headByIndex = new Map((head?.perOption || []).map((o) => [o.index, o]));
  const wByIndex = new Map((weighted?.perOption || []).map((o) => [o.index, o]));
  const isRating = head?.unit === "rating";
  const scaleMax = isRating ? Number(question.scaleMax ?? 0) : null;
  const totalPoints = (head?.perOption || []).reduce((s, o) => s + Number(toBig(o.weightedSum)), 0);
  return (
    <>
      <ul className="svy-options">
        {labels.map((label, index) => {
          const h = headByIndex.get(index); const w = wByIndex.get(index);
          const headFigure = isRating ? mean(h?.weightedSum, h?.answeredWeight ?? h?.count) : String(toBig(h?.weightedSum));
          const weightedFigure = weightedAvailable ? (isRating ? mean(w?.weightedSum, w?.answeredWeight) : mean(w?.weightedSum, w?.answeredWeight, 1)) : null;
          const share = isRating ? (scaleMax > 0 && headFigure != null ? (Number(headFigure) / scaleMax) * 100 : 0) : totalPoints > 0 ? (Number(headFigure) / totalPoints) * 100 : 0;
          return (
            <Option key={index} label={label} share={share} tone="muted" figures={<>
              <strong>{headFigure ?? "—"}{isRating ? ` / ${scaleMax}` : " pts"}</strong>
              {weightedAvailable && weightedFigure != null ? <span className="muted">{isRating ? `${weightedFigure} weighted` : `${weightedFigure} pts per ₳-weighted answer`}</span> : null}
              <span className="muted">{h?.count ?? 0} {h?.count === 1 ? "DRep" : "DReps"}</span>
            </>} />
          );
        })}
      </ul>
      <p className="tiny muted">{isRating ? "Each option is rated by its own group of DReps; bars sit within the declared scale and are not parts of one whole." : "Points summed over counted DReps; bars compare options against the total points allocated."}</p>
    </>
  );
}

function QuestionTally({ question, head, weighted, weightedAvailable }) {
  return (
    <section className="svy-q">
      <div className="svy-q__head">
        <span className="caps muted">Question {question.index + 1}</span>
        <p className="svy-q__prompt">{question.prompt}{question.required ? <span className="svy-q__req" title="An answer must include this question"> *</span> : null}</p>
        <p className="tiny muted">{question.kindLabel}</p>
      </div>
      {!head ? <p className="muted small">No reading for this question.</p>
        : head.kind === "options" ? <OptionsQuestion question={question} head={head} weighted={weighted} weightedAvailable={weightedAvailable} />
        : head.kind === "numeric" ? <NumericQuestion head={head} weighted={weighted} weightedAvailable={weightedAvailable} />
        : head.kind === "perOption" ? <PerOptionQuestion question={question} head={head} weighted={weighted} weightedAvailable={weightedAvailable} />
        : <p className="muted small">Custom-format answers: {head.answeredCount} counted {head.answeredCount === 1 ? "DRep" : "DReps"} answered. Open the Responses tab to read them.</p>}
    </section>
  );
}

const REFUSALS = {
  untalliable: "Tessera decided this survey's definition is invalid, so no answer to it is counted.",
  cancelled: "The owner cancelled this survey. No tally is drawn for a cancelled survey.",
  external: "This survey keeps its question texts in an external document that Civitas does not load, so its answers are not tallied here.",
  "sealed-pending": "Sealed survey: the answers are timelock-encrypted and nothing can be counted until the survey closes and Tessera publishes its tally artifact."
};

export default function SurveyTally({ survey, tally, refusal, artifact }) {
  const questions = survey?.questions || [];
  if (refusal || !tally) {
    return (
      <Card title="Informational tally" subtitle={REFUSALS[refusal] || "No tally is available for this survey."}>
        {questions.length ? questions.map((q) => (
          <section key={q.index} className="svy-q">
            <div className="svy-q__head"><span className="caps muted">Question {q.index + 1}</span><p className="svy-q__prompt">{q.prompt}{q.required ? <span className="svy-q__req"> *</span> : null}</p><p className="tiny muted">{q.kindLabel}</p></div>
            {q.options ? <ul className="svy-plain-options">{q.options.map((o, i) => <li key={i}>{o}</li>)}</ul> : null}
          </section>
        )) : null}
      </Card>
    );
  }
  const weightedAvailable = tally.matchedCount > 0 && toBig(tally.answeredPower) > 0n;
  const fromArtifact = tally.weightedSource === "artifact";
  const turnout = pct(tally.answeredPower, tally.totalPower);
  const otherRoles = Object.entries(tally.roleCounts || {}).filter(([role]) => role !== "DRep");
  const exclusions = Object.entries(tally.excludedBy || {});
  return (
    <Card title="Informational tally" actions={<Pill tone={fromArtifact ? "success" : "neutral"} size="sm" outline>{fromArtifact ? "Final: from the published tally artifact" : "Provisional: live reading"}</Pill>}
      subtitle={<>Counted under CIP-179's own validity rules and nothing beyond them: no survey-specific rules, no allow-lists, no custom weighting. Only DRep responses are counted. {tally.counted} {tally.counted === 1 ? "DRep response" : "DRep responses"} counted{weightedAvailable ? `; ${tally.matchedCount} of them matched to voting power at epoch ${tally.powerEpoch ?? "—"}${fromArtifact ? " (the survey's closing epoch, as the artifact committed it)" : " (the newest epoch Civitas holds, so figures move while the survey is open)"}.` : "; none could be matched to a voting power, so only head counts are shown."}</>}
      footer={<div className="stack--2">
        {weightedAvailable && turnout != null ? <p style={{ margin: 0 }}>Turnout {pctLabel(turnout)}: {adaLabel(tally.answeredPower)} of {adaLabel(tally.totalPower)}{fromArtifact ? " (the artifact's own electorate total)" : " (voting power of registered DReps in the Civitas snapshot)"}.</p> : null}
        {exclusions.length ? <p style={{ margin: 0 }}>{tally.excluded} DRep {tally.excluded === 1 ? "response" : "responses"} not counted: {exclusions.map(([key, n]) => `${n} ${EXCLUSION_LABELS[key] || key}`).join(", ")}.</p> : null}
        {otherRoles.length ? <p style={{ margin: 0 }}>Other roles also answered ({otherRoles.map(([role, n]) => `${n} ${role}`).join(", ")}); those responses sit outside every figure above.</p> : null}
        {survey?.tesseraUrl ? <p style={{ margin: 0 }}>Tessera shows its own informational tally of the same survey under its own stated rule: <a href={survey.tesseraUrl} target="_blank" rel="noreferrer">open on Tessera ↗</a></p> : null}
        {artifact?.hash ? <p className="mono" style={{ margin: 0 }}>Artifact {artifact.hash.slice(0, 16)}…</p> : null}
      </div>}>
      {questions.map((q) => <QuestionTally key={q.index} question={q} head={tally.questions?.headcount?.[q.index]} weighted={tally.questions?.weighted?.[q.index]} weightedAvailable={weightedAvailable} />)}
    </Card>
  );
}
