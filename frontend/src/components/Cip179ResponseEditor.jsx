import { useMemo } from "react";

function methodTag(methodType) {
  if (methodType?.includes(":custom:")) return 0;
  if (methodType?.includes(":single-choice:")) return 1;
  if (methodType?.includes(":multi-select:")) return 2;
  if (methodType?.includes(":ranking:")) return 3;
  if (methodType?.includes(":numeric-range:")) return 4;
  if (methodType?.includes(":points-allocation:")) return 5;
  if (methodType?.includes(":rating:")) return 6;
  return null;
}

function valueByQuestion(answers) {
  return new Map((answers || []).map((answer) => [answer[1], answer[2]]));
}

export default function Cip179ResponseEditor({ survey, answers, onChange, disabled = false }) {
  const values = useMemo(() => valueByQuestion(answers), [answers]);

  function setAnswer(index, value) {
    const question = survey.details.questions[index];
    const tag = methodTag(question.methodType);
    const next = (answers || []).filter((answer) => answer[1] !== index);
    if (value !== undefined) next.push([tag, index, value]);
    next.sort((a, b) => a[1] - b[1]);
    onChange(next);
  }

  return (
    <div className="cip179-response-editor">
      {(survey?.details?.questions || []).map((question, index) => {
        const tag = methodTag(question.methodType);
        const value = values.get(index);
        const options = question.options || [];
        return (
          <fieldset key={question.questionId || index} className="cip179-response-question" disabled={disabled}>
            <legend>
              <span>Q{index + 1}</span> {question.question}
              {question.required ? <strong> Required</strong> : null}
            </legend>

            {tag === 0 ? (
              question.customTextSupported === false
                ? <p className="vote-notice">{question.customSchemaError || "This custom answer schema is not supported by Civitas."}</p>
                : <textarea
                    rows={3}
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) => setAnswer(index, event.target.value.trim() ? event.target.value : undefined)}
                    placeholder="Response"
                  />
            ) : null}

            {tag === 1 ? options.map((option, optionIndex) => (
              <label key={optionIndex}>
                <input type="radio" name={`cip179-${survey.surveyTxId}-${index}`} checked={value === optionIndex} onChange={() => setAnswer(index, optionIndex)} />
                {option}
              </label>
            )) : null}

            {tag === 2 ? options.map((option, optionIndex) => {
              const selected = Array.isArray(value) ? value : [];
              const checked = selected.includes(optionIndex);
              const atMax = selected.length >= Number(question.maxSelections);
              return (
                <label key={optionIndex}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled || (!checked && atMax)}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...selected, optionIndex]
                        : selected.filter((item) => item !== optionIndex);
                      setAnswer(index, next);
                    }}
                  />
                  {option}
                </label>
              );
            }) : null}

            {tag === 3 ? options.map((option, optionIndex) => {
              const ranked = Array.isArray(value) ? value : [];
              const rank = ranked.indexOf(optionIndex);
              return (
                <button
                  key={optionIndex}
                  type="button"
                  className={`mode-btn${rank >= 0 ? " active" : ""}`}
                  onClick={() => setAnswer(index, rank >= 0
                    ? ranked.filter((item) => item !== optionIndex)
                    : [...ranked, optionIndex].slice(0, question.maxRanked))}
                >
                  {rank >= 0 ? `${rank + 1}. ` : ""}{option}
                </button>
              );
            }) : null}

            {tag === 4 ? (
              <input
                type="number"
                min={question.numericConstraints?.minValue}
                max={question.numericConstraints?.maxValue}
                step={question.numericConstraints?.step || 1}
                value={value ?? ""}
                onChange={(event) => setAnswer(index, event.target.value === "" ? undefined : event.target.value)}
              />
            ) : null}

            {tag === 5 ? options.map((option, optionIndex) => {
              const allocation = new Map(Array.isArray(value) ? value : []);
              return (
                <label key={optionIndex}>
                  {option}
                  <input
                    type="number"
                    min={0}
                    max={question.budget}
                    value={allocation.get(optionIndex) || 0}
                    onChange={(event) => {
                      allocation.set(optionIndex, Number(event.target.value));
                      setAnswer(index, [...allocation].filter(([, points]) => points > 0));
                    }}
                  />
                </label>
              );
            }) : null}

            {tag === 6 ? options.map((option, optionIndex) => {
              const ratings = new Map(Array.isArray(value) ? value : []);
              const scale = question.ratingScale || [1, 5];
              const scaleSize = BigInt(scale[1]) - BigInt(scale[0]) + 1n;
              const updateRating = (rawValue) => {
                if (rawValue === "") ratings.delete(optionIndex);
                else ratings.set(optionIndex, rawValue);
                setAnswer(index, [...ratings]);
              };
              return (
                <label key={optionIndex}>
                  {option}
                  {scaleSize <= 101n ? (
                    <select
                      value={ratings.has(optionIndex) ? ratings.get(optionIndex) : ""}
                      onChange={(event) => updateRating(event.target.value)}
                    >
                      <option value="">Not rated</option>
                      {Array.from({ length: Number(scaleSize) }, (_, offset) => (BigInt(scale[0]) + BigInt(offset)).toString())
                        .map((rating) => <option key={rating} value={rating}>{question.ratingLabels?.[rating] || rating}</option>)}
                    </select>
                  ) : (
                    <input
                      type="number"
                      min={scale[0]}
                      max={scale[1]}
                      value={ratings.has(optionIndex) ? ratings.get(optionIndex) : ""}
                      onChange={(event) => updateRating(event.target.value)}
                    />
                  )}
                </label>
              );
            }) : null}
          </fieldset>
        );
      })}
    </div>
  );
}
