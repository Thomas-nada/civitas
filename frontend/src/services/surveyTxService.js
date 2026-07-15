import {
  METADATA_LABEL,
  Role,
  SPEC_VERSION,
  encodePayload,
  validateDefinition,
  validateResponse,
} from "cip-179";
import { hexToBytes } from "cip-179/domain";
import {
  QUICKNET_CHAIN_HASH,
  maxPlaintextSize,
  sealAnswers,
} from "cip-179/tlock";
import {
  Transaction,
  resolvePaymentKeyHash,
  resolveStakeKeyHash,
} from "@meshsdk/core";
import { HexBlob, TransactionMetadatum } from "@meshsdk/core-cst";
import blakejs from "blakejs";

export { METADATA_LABEL };

export const ROLE_TO_INT = {
  DRep: Role.DRep,
  SPO: Role.SPO,
  CC: Role.CC,
  Stakeholder: Role.Stakeholder,
  Keyholder: Role.Keyholder,
};

export const Q_CUSTOM = 0;
export const Q_SINGLE_CHOICE = 1;
export const Q_MULTI_SELECT = 2;
export const Q_RANKING = 3;
export const Q_NUMERIC_RANGE = 4;
export const Q_POINTS_ALLOCATION = 5;
export const Q_RATING = 6;

export const metadatumCodec = {
  metadatumToCbor(metadatum) {
    return hexToBytes(TransactionMetadatum.fromCore(metadatum).toCbor());
  },
  cborToMetadatum(bytes) {
    return TransactionMetadatum.fromCbor(HexBlob.fromBytes(bytes)).toCore();
  },
};

function cleanHashHex(value, bytes, label) {
  const hex = String(value || "").replace(/^0x/, "").trim().toLowerCase();
  if (!new RegExp(`^[0-9a-f]{${bytes * 2}}$`).test(hex)) {
    throw new Error(`${label} must be a ${bytes}-byte hexadecimal value.`);
  }
  return hex;
}

function contentAnchor(uri, hashHex) {
  return {
    uri: String(uri || "").trim(),
    hash: hexToBytes(cleanHashHex(hashHex, 32, "Content anchor hash")),
  };
}

export async function hashAnchorContent(url) {
  try {
    const raw = String(url || "").trim();
    if (!raw) return null;
    const target = raw.startsWith("ipfs://")
      ? `https://ipfs.io/ipfs/${raw.slice(7)}`
      : raw;
    const res = await fetch(target);
    if (!res.ok) return null;
    return blakejs.blake2bHex(new Uint8Array(await res.arrayBuffer()), null, 32);
  } catch {
    return null;
  }
}

function options(labels) {
  return { type: "options", labels: labels.map((label) => String(label)) };
}

function toQuestion(question) {
  const base = { prompt: String(question.prompt), required: question.required === true };
  switch (question.tag) {
    case Q_CUSTOM:
      return {
        ...base,
        type: "custom",
        methodSchema: contentAnchor(question.contentAnchorUrl, question.contentAnchorHash),
      };
    case Q_SINGLE_CHOICE:
      return { ...base, type: "singleChoice", options: options(question.options) };
    case Q_MULTI_SELECT:
      return {
        ...base,
        type: "multiSelect",
        options: options(question.options),
        minSelections: Number(question.minSelections ?? 0),
        maxSelections: Number(question.maxSelections),
      };
    case Q_RANKING:
      return {
        ...base,
        type: "ranking",
        options: options(question.options),
        minRanked: Number(question.minRanked),
        maxRanked: Number(question.maxRanked),
      };
    case Q_NUMERIC_RANGE:
      return {
        ...base,
        type: "numericRange",
        constraints: {
          min: BigInt(question.minValue),
          max: BigInt(question.maxValue),
          ...(question.step != null ? { step: BigInt(question.step) } : {}),
        },
      };
    case Q_POINTS_ALLOCATION:
      return {
        ...base,
        type: "pointsAllocation",
        options: options(question.options),
        budget: Number(question.budget),
      };
    case Q_RATING:
      return {
        ...base,
        type: "rating",
        options: options(question.options),
        scale: {
          type: "numeric",
          constraints: {
            min: BigInt(question.ratingScale?.[0] ?? 1),
            max: BigInt(question.ratingScale?.[1] ?? 5),
          },
        },
        requireAll: question.requireAll === true,
      };
    default:
      throw new Error(`Unsupported question type tag: ${question.tag}`);
  }
}

function toAnswer(tuple) {
  const [tag, questionIndex, value] = tuple;
  switch (tag) {
    case Q_CUSTOM:
      if (typeof value === "string" && new TextEncoder().encode(value).length > 64) {
        throw new Error(`Custom answer ${questionIndex + 1} exceeds Cardano's 64-byte metadata text limit.`);
      }
      return { type: "custom", questionIndex, value };
    case Q_SINGLE_CHOICE:
      return { type: "singleChoice", questionIndex, optionIndex: Number(value) };
    case Q_MULTI_SELECT:
      return { type: "multiSelect", questionIndex, optionIndices: value.map(Number) };
    case Q_RANKING:
      return { type: "ranking", questionIndex, ranking: value.map(Number) };
    case Q_NUMERIC_RANGE:
      return { type: "numeric", questionIndex, value: BigInt(value) };
    case Q_POINTS_ALLOCATION:
      return {
        type: "pointsAllocation",
        questionIndex,
        allocations: value.map(([optionIndex, points]) => ({ optionIndex, points })),
      };
    case Q_RATING:
      return {
        type: "rating",
        questionIndex,
        ratings: value.map(([optionIndex, rating]) => ({ optionIndex, rating: BigInt(rating) })),
      };
    default:
      throw new Error(`Unsupported answer type tag: ${tag}`);
  }
}

function tagFromMethod(methodType) {
  if (methodType?.includes(":custom:")) return Q_CUSTOM;
  if (methodType?.includes(":single-choice:")) return Q_SINGLE_CHOICE;
  if (methodType?.includes(":multi-select:")) return Q_MULTI_SELECT;
  if (methodType?.includes(":ranking:")) return Q_RANKING;
  if (methodType?.includes(":numeric-range:")) return Q_NUMERIC_RANGE;
  if (methodType?.includes(":points-allocation:")) return Q_POINTS_ALLOCATION;
  if (methodType?.includes(":rating:")) return Q_RATING;
  return null;
}

export function definitionFromDetails(details) {
  const owner = details.ownerCredential?.type === "script"
    ? { type: "script", scriptHash: hexToBytes(cleanHashHex(details.ownerCredential.hash, 28, "Survey owner script hash")) }
    : { type: "key", keyHash: hexToBytes(cleanHashHex(details.ownerCredential?.hash || details.ownerKeyHash, 28, "Survey owner key hash")) };
  const questions = details.questions.map((question) => toQuestion({
    tag: tagFromMethod(question.methodType),
    prompt: question.question,
    required: question.required,
    options: question.options,
    minSelections: question.minSelections,
    maxSelections: question.maxSelections,
    minRanked: question.minRanked,
    maxRanked: question.maxRanked,
    minValue: question.numericConstraints?.minValue,
    maxValue: question.numericConstraints?.maxValue,
    step: question.numericConstraints?.step,
    budget: question.budget,
    ratingScale: question.ratingScale,
    requireAll: question.requireAll,
    contentAnchorUrl: question.contentAnchor?.uri,
    contentAnchorHash: question.contentAnchor?.hash,
  }));
  return {
    specVersion: SPEC_VERSION,
    owner,
    title: details.title,
    description: details.description,
    eligibleRoles: details.eligibleRoles.map((role) => ROLE_TO_INT[role]),
    endEpoch: Number(details.endEpoch),
    submissionMode: details.isTimelocked
      ? {
          type: "sealed",
          chainHash: details.drandChainHash ? hexToBytes(details.drandChainHash) : QUICKNET_CHAIN_HASH,
          round: Number(details.drandRound),
          paddingSize: Number(details.padding),
        }
      : { type: "public" },
    questions,
    ...(details.contentAnchor ? { contentAnchor: contentAnchor(details.contentAnchor.uri, details.contentAnchor.hash) } : {}),
  };
}

async function buildAndSubmitMetadataTx(walletApi, payload, signerHashes = []) {
  const utxos = await walletApi.getUtxos();
  if (!utxos?.length) {
    throw new Error("No UTxOs found in wallet. Fund your wallet with ADA and try again.");
  }
  const changeAddress = await walletApi.getChangeAddress();
  const tx = new Transaction({ initiator: walletApi });
  tx.sendLovelace(changeAddress, "2000000");
  tx.setMetadata(METADATA_LABEL, encodePayload(payload));
  for (const signerHash of new Set(signerHashes.filter(Boolean))) {
    tx.txBuilder.requiredSignerHash(signerHash);
  }
  const unsignedTx = await tx.build();
  const signedTx = await walletApi.signTx(unsignedTx, true, true);
  return walletApi.submitTx(signedTx);
}

export async function buildAndSubmitSurveyCreation(walletApi, surveyForm) {
  const ownerKeyHash = resolvePaymentKeyHash(await walletApi.getChangeAddress());
  const questions = surveyForm.questions.map(toQuestion);
  const definition = {
    specVersion: SPEC_VERSION,
    owner: { type: "key", keyHash: hexToBytes(ownerKeyHash) },
    title: String(surveyForm.title),
    description: String(surveyForm.description),
    eligibleRoles: surveyForm.eligibleRoles.map((role) => ROLE_TO_INT[role]),
    endEpoch: Number(surveyForm.endEpoch),
    submissionMode: surveyForm.isTimelocked
      ? {
          type: "sealed",
          chainHash: QUICKNET_CHAIN_HASH,
          round: Number(surveyForm.drandRound),
          paddingSize: Math.max(Number(surveyForm.padding || 0), maxPlaintextSize(questions)),
        }
      : { type: "public" },
    questions,
    ...(surveyForm.contentAnchorUrl
      ? { contentAnchor: contentAnchor(surveyForm.contentAnchorUrl, surveyForm.contentAnchorHash) }
      : {}),
  };
  const errors = validateDefinition(definition);
  if (errors.length) throw new Error(`Invalid CIP-179 survey: ${errors.join("; ")}`);
  const txHash = await buildAndSubmitMetadataTx(
    walletApi,
    { type: "definitions", definitions: [definition] },
    [ownerKeyHash],
  );
  return { surveyTxId: txHash, surveyIndex: 0 };
}

async function responderCredential(walletApi, responderRole) {
  if (responderRole === "DRep") {
    const drep = await walletApi.getDRep();
    if (!drep?.publicKeyHash) throw new Error("This wallet does not expose a CIP-95 DRep key.");
    return { role: Role.DRep, hash: drep.publicKeyHash };
  }
  if (responderRole === "Stakeholder") {
    const [rewardAddress] = await walletApi.getRewardAddresses();
    if (!rewardAddress) throw new Error("This wallet does not expose a stake credential.");
    return { role: Role.Stakeholder, hash: resolveStakeKeyHash(rewardAddress) };
  }
  if (responderRole === "Keyholder") {
    const changeAddress = await walletApi.getChangeAddress();
    return { role: Role.Keyholder, hash: resolvePaymentKeyHash(changeAddress) };
  }
  throw new Error(`${responderRole} responses require a signing key that browser wallets do not expose.`);
}

export async function buildSurveyResponse(
  walletApi,
  surveyTxId,
  surveyIndex,
  responderRole,
  answerTuples,
  sealOpts,
  rationale,
  definition,
) {
  const signer = await responderCredential(walletApi, responderRole);
  const answers = answerTuples.map(toAnswer);
  const responseAnswers = sealOpts?.drandRound
    ? {
        type: "sealed",
        ciphertext: await sealAnswers(
          metadatumCodec,
          answers,
          Number(sealOpts.drandRound),
          Number(sealOpts.padding),
        ),
      }
    : { type: "public", answers };
  const response = {
    specVersion: SPEC_VERSION,
    surveyRef: {
      txId: hexToBytes(cleanHashHex(surveyTxId, 32, "Survey transaction id")),
      index: Number(surveyIndex),
    },
    role: signer.role,
    credential: { type: "key", keyHash: hexToBytes(cleanHashHex(signer.hash, 28, "Responder key hash")) },
    answers: responseAnswers,
    ...(rationale?.url
      ? { rationale: contentAnchor(rationale.url, rationale.hash) }
      : {}),
  };
  if (definition) {
    const resolvedDefinition = definition.questions?.[0]?.type ? definition : definitionFromDetails(definition);
    const errors = validateResponse(resolvedDefinition, response);
    if (errors.length) throw new Error(`Invalid CIP-179 response: ${errors.join("; ")}`);
  }
  return { response, signerHash: signer.hash };
}

export async function buildAndSubmitSurveyResponse(
  walletApi,
  surveyTxId,
  surveyIndex,
  responderRole,
  answers,
  sealOpts,
  rationale,
  definition,
) {
  const built = await buildSurveyResponse(
    walletApi,
    surveyTxId,
    surveyIndex,
    responderRole,
    answers,
    sealOpts,
    rationale,
    definition,
  );
  const txHash = await buildAndSubmitMetadataTx(
    walletApi,
    { type: "responses", responses: [built.response] },
    [built.signerHash],
  );
  return { txId: txHash };
}

export async function getConnectedPaymentKeyHash(walletApi) {
  return resolvePaymentKeyHash(await walletApi.getChangeAddress());
}

export async function buildAndSubmitSurveyCancellation(walletApi, surveyTxId, surveyIndex) {
  const ownerKeyHash = await getConnectedPaymentKeyHash(walletApi);
  const cancellation = {
    txId: hexToBytes(cleanHashHex(surveyTxId, 32, "Survey transaction id")),
    index: Number(surveyIndex ?? 0),
  };
  const txHash = await buildAndSubmitMetadataTx(
    walletApi,
    { type: "cancellations", cancellations: [cancellation] },
    [ownerKeyHash],
  );
  return { txId: txHash };
}
