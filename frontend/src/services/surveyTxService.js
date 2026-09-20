// The transactions Civitas builds for CIP-179 surveys, all through the
// signed-in CIP-30 wallet (MeshSDK): publishing a survey definition,
// cancelling one, and attaching the label-17 response payload that Tessera's
// <tessera-respond> form produces. No private key ever reaches Civitas and
// there is no deposit: the wallet pays the network fee and nothing else.
import {
  METADATA_LABEL,
  Role,
  SPEC_VERSION,
  describeProblems,
  encodePayload,
  problemSeverity,
  validateDefinition
} from "cip-179";
import { QUICKNET_CHAIN_HASH, hexToBytes } from "cip-179/domain";
import { maxPlaintextSize } from "cip-179/tlock";
import { Transaction, resolvePaymentKeyHash, resolveStakeKeyHash } from "@meshsdk/core";
import blakejs from "blakejs";

export { METADATA_LABEL, Role };

export const ROLE_TO_INT = {
  DRep: Role.DRep,
  SPO: Role.SPO,
  CC: Role.CC,
  Stakeholder: Role.Stakeholder,
  Keyholder: Role.Keyholder
};

export const Q_CUSTOM = 0;
export const Q_SINGLE_CHOICE = 1;
export const Q_MULTI_SELECT = 2;
export const Q_RANKING = 3;
export const Q_NUMERIC_RANGE = 4;
export const Q_POINTS_ALLOCATION = 5;
export const Q_RATING = 6;

// cip-179 validators return problems with a severity; only error-severity
// problems make a structure invalid (warnings are SHOULD-level).
function errorProblems(problems) {
  return problems.filter((problem) => problemSeverity(problem) === "error");
}

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
    hash: hexToBytes(cleanHashHex(hashHex, 32, "Content anchor hash"))
  };
}

/** blake2b-256 of a document at `url` (https or ipfs://), for a content anchor. */
export async function hashAnchorContent(url) {
  try {
    const raw = String(url || "").trim();
    if (!raw) return null;
    const target = raw.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${raw.slice(7)}` : raw;
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
        methodSchema: contentAnchor(question.contentAnchorUrl, question.contentAnchorHash)
      };
    case Q_SINGLE_CHOICE:
      return { ...base, type: "singleChoice", options: options(question.options) };
    case Q_MULTI_SELECT:
      return {
        ...base,
        type: "multiSelect",
        options: options(question.options),
        minSelections: Number(question.minSelections ?? 0),
        maxSelections: Number(question.maxSelections)
      };
    case Q_RANKING:
      return {
        ...base,
        type: "ranking",
        options: options(question.options),
        minRanked: Number(question.minRanked),
        maxRanked: Number(question.maxRanked)
      };
    case Q_NUMERIC_RANGE:
      return {
        ...base,
        type: "numericRange",
        constraints: {
          min: BigInt(question.minValue),
          max: BigInt(question.maxValue),
          ...(question.step != null && question.step !== "" ? { step: BigInt(question.step) } : {})
        }
      };
    case Q_POINTS_ALLOCATION:
      return {
        ...base,
        type: "pointsAllocation",
        options: options(question.options),
        budget: BigInt(question.budget)
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
            max: BigInt(question.ratingScale?.[1] ?? 5)
          }
        },
        requireAll: question.requireAll === true
      };
    default:
      throw new Error(`Unsupported question type tag: ${question.tag}`);
  }
}

// Builds, signs and submits a transaction carrying `metadatum` at label 17,
// with every hash in `signerHashes` as a required signer (CIP-179 mechanism
// A: the carrying transaction proves the credentials it names).
async function buildAndSubmitMetadataTx(walletApi, metadatum, signerHashes = []) {
  const utxos = await walletApi.getUtxos();
  if (!utxos?.length) {
    throw new Error("No UTxOs found in wallet. Fund your wallet with ADA and try again.");
  }
  const changeAddress = await walletApi.getChangeAddress();
  const tx = new Transaction({ initiator: walletApi });
  tx.sendLovelace(changeAddress, "2000000");
  tx.setMetadata(METADATA_LABEL, metadatum);
  for (const signerHash of new Set(signerHashes.filter(Boolean))) {
    tx.txBuilder.requiredSignerHash(signerHash);
  }
  const unsignedTx = await tx.build();
  const signedTx = await walletApi.signTx(unsignedTx, true, true);
  return walletApi.submitTx(signedTx);
}

/**
 * Attaches a ready-made label-17 payload (what <tessera-respond> emits) and
 * submits it, proving `signerHashes` via required signers. Resolves to the
 * transaction hash.
 */
export async function submitLabel17Payload(walletApi, payload, signerHashes = []) {
  return buildAndSubmitMetadataTx(walletApi, payload, signerHashes);
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
          paddingSize: Math.max(Number(surveyForm.padding || 0), maxPlaintextSize(questions))
        }
      : { type: "public" },
    questions,
    ...(surveyForm.contentAnchorUrl
      ? { contentAnchor: contentAnchor(surveyForm.contentAnchorUrl, surveyForm.contentAnchorHash) }
      : {})
  };
  const errors = errorProblems(validateDefinition(definition));
  if (errors.length) throw new Error(`Invalid CIP-179 survey: ${describeProblems(errors).join("; ")}`);
  const txHash = await buildAndSubmitMetadataTx(
    walletApi,
    encodePayload({ type: "definitions", definitions: [definition] }),
    [ownerKeyHash]
  );
  return { surveyTxId: txHash, surveyIndex: 0 };
}

export async function getConnectedPaymentKeyHash(walletApi) {
  return resolvePaymentKeyHash(await walletApi.getChangeAddress());
}

/**
 * The credentials the connected wallet can answer as, keyed by CIP-179 role
 * number for <tessera-respond>, plus each credential's hash hex for the
 * required-signer proof. `includeDrep` is decided by the session: only a
 * registered DRep signed in with the DRep key answers as a DRep.
 */
export async function responderCredentials(walletApi, { includeDrep = false } = {}) {
  const responder = {};
  const hashes = {};
  const changeAddress = await walletApi.getChangeAddress();
  const paymentHash = resolvePaymentKeyHash(changeAddress);
  responder[Role.Keyholder] = { type: "key", keyHash: hexToBytes(paymentHash) };
  hashes[Role.Keyholder] = paymentHash;
  try {
    const [rewardAddress] = await walletApi.getRewardAddresses();
    if (rewardAddress) {
      const stakeHash = resolveStakeKeyHash(rewardAddress);
      responder[Role.Stakeholder] = { type: "key", keyHash: hexToBytes(stakeHash) };
      hashes[Role.Stakeholder] = stakeHash;
    }
  } catch {
    // No stake credential exposed; the wallet answers as a keyholder only.
  }
  if (includeDrep) {
    try {
      const drep = await walletApi.getDRep();
      if (drep?.publicKeyHash) {
        responder[Role.DRep] = { type: "key", keyHash: hexToBytes(drep.publicKeyHash) };
        hashes[Role.DRep] = drep.publicKeyHash;
      }
    } catch {
      // Wallet without CIP-95: no DRep credential to offer.
    }
  }
  return { responder, hashes };
}

export async function buildAndSubmitSurveyCancellation(walletApi, surveyTxId, surveyIndex) {
  const ownerKeyHash = await getConnectedPaymentKeyHash(walletApi);
  const cancellation = {
    txId: hexToBytes(cleanHashHex(surveyTxId, 32, "Survey transaction id")),
    index: Number(surveyIndex ?? 0)
  };
  const txHash = await buildAndSubmitMetadataTx(
    walletApi,
    encodePayload({ type: "cancellations", cancellations: [cancellation] }),
    [ownerKeyHash]
  );
  return { txId: txHash };
}
