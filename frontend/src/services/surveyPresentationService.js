import blakejs from "blakejs";

const MAX_BYTES = 1_000_000;
const MAX_QUESTIONS = 100;
const MAX_OPTIONS = 100;

function gatewayUrl(uri) {
  const value = String(uri || "").trim();
  if (value.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${value.slice(7)}`;
  if (/^https:\/\//i.test(value)) return value;
  throw new Error("External survey presentation must use HTTPS or IPFS.");
}

function checkedLabels(value, expected, field) {
  if (!Array.isArray(value) || value.length !== expected || value.length > MAX_OPTIONS) {
    throw new Error(`${field} must contain exactly ${expected} labels.`);
  }
  if (!value.every((label) => typeof label === "string" && label.trim())) {
    throw new Error(`${field} contains an invalid label.`);
  }
  return value.map((label) => label.trim());
}

async function fetchVerifiedJson(anchor, kind) {
  const response = await fetch(gatewayUrl(anchor.uri));
  if (!response.ok) throw new Error(`${kind} returned HTTP ${response.status}.`);
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_BYTES) throw new Error(`${kind} is too large.`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error(`${kind} is too large.`);
  const digest = blakejs.blake2bHex(bytes, null, 32);
  if (digest.toLowerCase() !== String(anchor.hash).toLowerCase()) {
    throw new Error(`${kind} hash does not match its on-chain anchor.`);
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function hydrateSurveyPresentation(survey) {
  let hydrated = survey;
  const anchor = survey?.details?.contentAnchor;
  if (anchor?.uri && anchor?.hash) {
    const document = await fetchVerifiedJson(anchor, "External survey presentation");

    if (document?.specVersion !== 5 || document?.kind !== "cardano-survey-presentation") {
      throw new Error("External survey presentation is not the CIP-179 v5 JSON profile.");
    }
    const questions = survey.details.questions || [];
    if (!Array.isArray(document.questions) || document.questions.length !== questions.length || questions.length > MAX_QUESTIONS) {
      throw new Error("External survey presentation question count does not match the on-chain definition.");
    }

    hydrated = {
      ...survey,
      details: {
        ...survey.details,
        title: survey.details.title || String(document.title || ""),
        description: survey.details.description || String(document.description || ""),
        questions: questions.map((question, index) => {
          const external = document.questions[index] || {};
          const next = { ...question, question: question.question || String(external.prompt || "") };
          if (question.externalOptions) next.options = checkedLabels(external.options, question.options.length, `questions[${index}].options`);
          if (question.externalRatingLabels) {
            next.ratingLabels = checkedLabels(external.ratingLabels, question.ratingScale[1] + 1, `questions[${index}].ratingLabels`);
          }
          return next;
        }),
        presentationVerified: true,
      },
    };
  }

  const questions = await Promise.all((hydrated.details.questions || []).map(async (question) => {
    if (!question.methodType?.includes(":custom:") || !question.contentAnchor) return question;
    try {
      const schema = await fetchVerifiedJson(question.contentAnchor, "Custom question schema");
      const type = schema?.type || schema?.schema?.type || schema?.answer?.type;
      return { ...question, customTextSupported: type === "string" };
    } catch (error) {
      return { ...question, customTextSupported: false, customSchemaError: error?.message || "Custom question schema is unavailable." };
    }
  }));
  return { ...hydrated, details: { ...hydrated.details, questions } };
}
