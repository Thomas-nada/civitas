// The informational tally of a survey, drawn the way DRepTalk draws it: a
// named reading, not a claimed result. CIP-179 mandates no counting policy,
// so the card says which rules it counted under (the generic CIP-179
// validity rules, nothing beyond them), names the denominator under every
// share, and keeps the DRep head count next to the voting-power figures so a
// counted DRep whose power could not be resolved never disappears from their
// own answer. Bars are shares only for single choice, where the shares add up
// to one whole; every other kind compares options against the leading one.
import { Fragment } from "react";
import { adaLabel } from "../../services/surveyPresentation";

const EXCLUSION_LABELS = {
  "after-deadline": "sent after the closing epoch",
  invalid: "invalid against the definition",
  unproven: "credential not proven by the transaction",
  superseded: "replaced by a later answer",
  undecryptable: "sealed answer that did not reveal"
};

function toBig(value) {
  try {
    return BigInt(value ?? 0);
  } catch {
    return 0n;
  }
}

function pct(numerator, denominator) {
  const d = toBig(denominator);
  if (d === 0n) return null;
  return Number((toBig(numerator) * 10000n) / d) / 100;
}

function pctLabel(value) {
  if (value == null) return "—";
  return `${value < 10 ? value.toFixed(1) : Math.round(value)}%`;
}

function mean(weightedSum, weight, digits = 2) {
  const w = toBig(weight);
  if (w === 0n) return null;
  return (Number(toBig(weightedSum)) / Number(w)).toFixed(digits);
}

function Bar({ share, tone = "mint" }) {
  const width = share == null ? 0 : Math.max(0, Math.min(100, share));
  return (
    <span className="svy-bar" aria-hidden="true">
      <span className={`svy-bar-fill svy-bar-fill--${tone}`} style={{ width: `${width}%` }} />
    </span>
  );
}

function OptionsQuestion({ question, head, weighted, weightedAvailable }) {
  const labels = question.options || [];
  const headByIndex = new Map((head?.options || []).map((o) => [o.index, o]));
  const wByIndex = new Map((weighted?.options || []).map((o) => [o.index, o]));
  const isShare = head?.unit === "singleChoice";
  const leader = (weighted?.options || []).reduce((max, o) => (toBig(o.weight) > max ? toBig(o.weight) : max), 0n);
  const leaderCount = (head?.options || []).reduce((max, o) => Math.max(max, o.count), 0);
  const basisNote = isShare
    ? "Shares divide by the answered voting power of this question."
    : head?.unit === "rankingFirst"
      ? "First-ranked option per answer; bars compare options against the leading one, not shares of a whole."
      : "Several options per answer; bars compare options against the leading one, not shares of a whole.";
  return (
    <>
      <ul className="svy-options">
        {labels.map((label, index) => {
          const h = headByIndex.get(index);
          const w = wByIndex.get(index);
          const count = h?.count ?? 0;
          const weight = w?.weight ?? "0";
          const share = weightedAvailable
            ? (isShare ? pct(weight, weighted?.answeredWeight) : (leader > 0n ? Number((toBig(weight) * 100n) / leader) : 0))
            : (isShare ? pct(count, head?.answeredCount) : (leaderCount > 0 ? (count * 100) / leaderCount : 0));
          return (
            <li key={index} className="svy-option">
              <div className="svy-option-head">
                <span className="svy-option-label">{label}</span>
                <span className="svy-option-figures">
                  {weightedAvailable ? <strong>{adaLabel(weight)}</strong> : null}
                  {weightedAvailable && isShare ? <span className="muted">{pctLabel(pct(weight, weighted?.answeredWeight))}</span> : null}
                  <span className="muted">{count} {count === 1 ? "DRep" : "DReps"}</span>
                </span>
              </div>
              <Bar share={share} tone={weightedAvailable ? "mint" : "muted"} />
            </li>
          );
        })}
      </ul>
      <p className="svy-basis muted">
        {basisNote} Answered by {head?.answeredCount ?? 0} counted {head?.answeredCount === 1 ? "DRep" : "DReps"}
        {weightedAvailable ? ` holding ${adaLabel(weighted?.answeredWeight)}` : ""}.
      </p>
    </>
  );
}

function NumericQuestion({ head, weighted, weightedAvailable }) {
  const values = [...(head?.values || [])].sort((a, b) => (toBig(a.value) < toBig(b.value) ? -1 : 1));
  const wMean = weightedAvailable ? mean(weighted?.weightedSum, weighted?.answeredWeight) : null;
  const hMean = mean(head?.weightedSum, head?.answeredWeight);
  return (
    <>
      <dl className="svy-facts">
        <div><dt>Mean (per DRep)</dt><dd>{hMean ?? "—"}</dd></div>
        {weightedAvailable ? <div><dt>Mean (voting-power weighted)</dt><dd>{wMean ?? "—"}</dd></div> : null}
        <div><dt>Answered</dt><dd>{head?.answeredCount ?? 0}</dd></div>
      </dl>
      {values.length ? (
        <ul className="svy-values">
          {values.map((v) => (
            <li key={v.value}><span className="mono">{v.value}</span><span className="muted">× {v.count}</span></li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function PerOptionQuestion({ question, head, weighted, weightedAvailable }) {
  const labels = question.options || [];
  const headByIndex = new Map((head?.perOption || []).map((o) => [o.index, o]));
  const wByIndex = new Map((weighted?.perOption || []).map((o) => [o.index, o]));
  const isRating = head?.unit === "rating";
  const scaleMax = isRating ? Number(question.scaleMax ?? 0) : null;
  const leader = (head?.perOption || []).reduce((max, o) => {
    const m = Number(mean(o.weightedSum, o.answeredWeight ?? o.count) ?? 0);
    return m > max ? m : max;
  }, 0);
  return (
    <>
      <ul className="svy-options">
        {labels.map((label, index) => {
          const h = headByIndex.get(index);
          const w = wByIndex.get(index);
          // Points: total points at unit weight is a sum, at voting power a
          // weighted sum; rating: each option is rated by its own group, so the
          // mean is within the declared scale.
          const headFigure = isRating
            ? mean(h?.weightedSum, h?.answeredWeight ?? h?.count)
            : String(toBig(h?.weightedSum));
          const weightedFigure = weightedAvailable
            ? (isRating ? mean(w?.weightedSum, w?.answeredWeight) : mean(w?.weightedSum, w?.answeredWeight, 1))
            : null;
          const share = isRating
            ? (scaleMax > 0 && headFigure != null ? (Number(headFigure) / scaleMax) * 100 : 0)
            : (leader > 0 ? (Number(headFigure) / (head?.perOption || []).reduce((s, o) => s + Number(toBig(o.weightedSum)), 0)) * 100 : 0);
          return (
            <li key={index} className="svy-option">
              <div className="svy-option-head">
                <span className="svy-option-label">{label}</span>
                <span className="svy-option-figures">
                  <strong>{headFigure ?? "—"}{isRating ? ` / ${scaleMax}` : " pts"}</strong>
                  {weightedAvailable && weightedFigure != null ? (
                    <span className="muted">{isRating ? `${weightedFigure} weighted` : `${weightedFigure} pts per ₳-weighted answer`}</span>
                  ) : null}
                  <span className="muted">{h?.count ?? 0} {h?.count === 1 ? "DRep" : "DReps"}</span>
                </span>
              </div>
              <Bar share={share} tone="muted" />
            </li>
          );
        })}
      </ul>
      <p className="svy-basis muted">
        {isRating
          ? "Each option is rated by its own group of DReps; bars sit within the declared scale and are not parts of one whole."
          : "Points summed over counted DReps; bars compare options against the total points allocated."}
      </p>
    </>
  );
}

function QuestionTally({ question, head, weighted, weightedAvailable }) {
  return (
    <section className="svy-tally-q">
      <div className="svy-tally-q-head">
        <span className="svy-q-number">Question {question.index + 1}</span>
        <p className="svy-q-prompt">
          {question.prompt}
          {question.required ? <span className="svy-q-req" title="An answer must include this question"> *</span> : null}
        </p>
        <p className="svy-q-kind muted">{question.kindLabel}</p>
      </div>
      {!head ? (
        <p className="muted">No reading for this question.</p>
      ) : head.kind === "options" ? (
        <OptionsQuestion question={question} head={head} weighted={weighted} weightedAvailable={weightedAvailable} />
      ) : head.kind === "numeric" ? (
        <NumericQuestion head={head} weighted={weighted} weightedAvailable={weightedAvailable} />
      ) : head.kind === "perOption" ? (
        <PerOptionQuestion question={question} head={head} weighted={weighted} weightedAvailable={weightedAvailable} />
      ) : (
        <p className="muted">Custom-format answers: {head.answeredCount} counted {head.answeredCount === 1 ? "DRep" : "DReps"} answered. Open the Responses tab to read them.</p>
      )}
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
      <section className="svy-tally panel">
        <h3 className="svy-tally-title">Informational tally</h3>
        <p className="muted">{REFUSALS[refusal] || "No tally is available for this survey."}</p>
        {questions.length ? (
          <ol className="svy-questions">
            {questions.map((q) => (
              <li key={q.index} className="svy-q">
                <span className="svy-q-number">Question {q.index + 1}</span>
                <p className="svy-q-prompt">{q.prompt}{q.required ? <span className="svy-q-req"> *</span> : null}</p>
                <p className="svy-q-kind muted">{q.kindLabel}</p>
                {q.options ? <ul className="svy-q-options">{q.options.map((o, i) => <li key={i}>{o}</li>)}</ul> : null}
              </li>
            ))}
          </ol>
        ) : null}
      </section>
    );
  }

  const weightedAvailable = tally.matchedCount > 0 && toBig(tally.answeredPower) > 0n;
  const fromArtifact = tally.weightedSource === "artifact";
  const turnout = pct(tally.answeredPower, tally.totalPower);
  const otherRoles = Object.entries(tally.roleCounts || {}).filter(([role]) => role !== "DRep");
  const exclusions = Object.entries(tally.excludedBy || {});

  return (
    <section className="svy-tally panel">
      <div className="svy-tally-head">
        <h3 className="svy-tally-title">Informational tally</h3>
        <span className="svy-badge svy-badge--muted">{fromArtifact ? "Final: from the published tally artifact" : "Provisional: live reading"}</span>
      </div>
      <p className="muted svy-tally-rule">
        Counted under CIP-179's own validity rules and nothing beyond them: no survey-specific rules, no allow-lists, no custom weighting.
        Only DRep responses are counted. {tally.counted} {tally.counted === 1 ? "DRep response" : "DRep responses"} counted
        {weightedAvailable
          ? `; ${tally.matchedCount} of them matched to voting power at epoch ${tally.powerEpoch ?? "—"}${fromArtifact ? " (the survey's closing epoch, as the artifact committed it)" : " (the newest epoch Civitas holds, so figures move while the survey is open)"}.`
          : "; none could be matched to a voting power, so only head counts are shown."}
      </p>

      {questions.map((q) => (
        <QuestionTally
          key={q.index}
          question={q}
          head={tally.questions?.headcount?.[q.index]}
          weighted={tally.questions?.weighted?.[q.index]}
          weightedAvailable={weightedAvailable}
        />
      ))}

      <div className="svy-tally-foot">
        {weightedAvailable && turnout != null ? (
          <p className="svy-turnout">
            Turnout {pctLabel(turnout)}: {adaLabel(tally.answeredPower)} of {adaLabel(tally.totalPower)}
            {fromArtifact ? " (the artifact's own electorate total)" : " (voting power of registered DReps in the Civitas snapshot)"}.
          </p>
        ) : null}
        {exclusions.length ? (
          <dl className="svy-excl">
            <dt>{tally.excluded} DRep {tally.excluded === 1 ? "response" : "responses"} not counted</dt>
            {exclusions.map(([key, n]) => (
              <Fragment key={key}><dd>{n} {EXCLUSION_LABELS[key] || key}</dd></Fragment>
            ))}
          </dl>
        ) : null}
        {otherRoles.length ? (
          <p className="muted svy-note">
            Other roles also answered ({otherRoles.map(([role, n]) => `${n} ${role}`).join(", ")}); those responses sit outside every figure above.
          </p>
        ) : null}
        {survey?.tesseraUrl ? (
          <p className="muted svy-note">
            Tessera shows its own informational tally of the same survey under its own stated rule: <a className="ext-link" href={survey.tesseraUrl} target="_blank" rel="noreferrer">open on Tessera ↗</a>
          </p>
        ) : null}
        {artifact?.hash ? <p className="muted svy-note mono">Artifact {artifact.hash.slice(0, 16)}…</p> : null}
      </div>
    </section>
  );
}
