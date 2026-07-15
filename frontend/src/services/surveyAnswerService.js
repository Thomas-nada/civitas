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

export function validateSurveyAnswers(survey, answers) {
  const values = new Map((answers || []).map((answer) => [answer[1], answer[2]]));
  const problems = [];
  for (const [index, question] of (survey?.details?.questions || []).entries()) {
    const value = values.get(index);
    if (question.required && value === undefined) problems.push(`Question ${index + 1} is required.`);
    if (value === undefined) continue;
    const tag = methodTag(question.methodType);
    if (tag === 0 && typeof value === "string" && new TextEncoder().encode(value).length > 64) {
      problems.push(`Question ${index + 1} must be at most 64 UTF-8 bytes.`);
    }
    if (tag === 2 && (value.length < question.minSelections || value.length > question.maxSelections)) {
      problems.push(`Question ${index + 1} requires ${question.minSelections}-${question.maxSelections} selections.`);
    }
    if (tag === 3 && (value.length < question.minRanked || value.length > question.maxRanked)) {
      problems.push(`Question ${index + 1} requires ${question.minRanked}-${question.maxRanked} ranked options.`);
    }
    if (tag === 5 && value.reduce((sum, pair) => sum + Number(pair[1]), 0) !== question.budget) {
      problems.push(`Question ${index + 1} must allocate exactly ${question.budget} points.`);
    }
    if (tag === 6 && question.requireAll && value.length !== question.options.length) {
      problems.push(`Question ${index + 1} requires a rating for every option.`);
    }
  }
  if (!answers?.length) problems.push("Answer at least one question or skip this survey.");
  return problems;
}
