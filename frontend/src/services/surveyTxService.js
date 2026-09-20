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
import { Transaction, resolvePaymentKeyHash, resolveStakeKeyHash, resolveTxHash } from "@meshsdk/core";
import { deserializeTx } from "@meshsdk/core-cst";
import { bech32 } from "bech32";
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
// Koios' public submit endpoint (no key). Used when the wallet's own submit
// fails: most wallets then hide the node's reason behind a generic error, and
// some relay through their own backend, while Koios reports the ledger rule
// that rejected the transaction.
const KOIOS_SUBMIT_URL = "https://api.koios.rest/api/v1/submittx";

/** The key hashes (hex) of every vkey witness in a signed transaction. */
function witnessedKeyHashes(signedTxHex) {
  const witnessed = new Set();
  const vkeys = deserializeTx(signedTxHex).witnessSet().vkeys();
  for (const witness of vkeys ? vkeys.values() : []) {
    witnessed.add(blakejs.blake2bHex(hexToBytes(String(witness.vkey())), null, 28));
  }
  return witnessed;
}

export class SurveyTxError extends Error {
  constructor(message, code, extra = {}) {
    super(message);
    this.name = "SurveyTxError";
    this.code = code;
    Object.assign(this, extra);
  }
}

// The ledger rules a rejected survey transaction is likely to hit, in plain words.
const NODE_REASONS = [
  ["MissingVKeyWitnessesUTXOW", "the transaction lacks a signature the ledger requires (a required signer was not signed)"],
  ["MissingRequiredSigners", "the transaction lacks a signature the ledger requires (a required signer was not signed)"],
  ["BadInputsUTxO", "its inputs are already spent (a previous submission of this or another transaction may already be on its way; wait a moment and check the wallet)"],
  ["ValueNotConservedUTxO", "its inputs and outputs do not balance"],
  ["FeeTooSmallUTxO", "its fee is too small"],
  ["OutsideValidityIntervalUTxO", "its validity window has passed; try again"],
  ["MaxTxSizeUTxO", "it is larger than the network allows"],
  ["InvalidMetadata", "its metadata is invalid"],
  ["DeserialiseFailure", "it could not be decoded"],
];

function describeNodeRejection(text) {
  const raw = String(text || "");
  for (const [needle, words] of NODE_REASONS) {
    if (raw.includes(needle)) return `The network rejected the transaction: ${words}. (${needle})`;
  }
  const short = raw.replace(/\s+/g, " ").trim().slice(0, 240);
  return `The network rejected the transaction${short ? `: ${short}` : "."}`;
}

async function submitViaKoios(signedTxHex) {
  const res = await fetch(KOIOS_SUBMIT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/cbor" },
    body: hexToBytes(signedTxHex),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new SurveyTxError(describeNodeRejection(text), "node-rejected", { nodeMessage: text });
  const hash = text.trim().replace(/^"|"$/g, "");
  return /^[0-9a-f]{64}$/i.test(hash) ? hash.toLowerCase() : resolveTxHash(signedTxHex);
}

/** A CIP-129 `gov_action1…` id as the { txHash, txIndex } a vote names. */
export function govActionRef(actionId) {
  const { prefix, words } = bech32.decode(String(actionId || "").trim(), 1000);
  if (prefix !== "gov_action") throw new Error("Not a governance action id.");
  const bytes = bech32.fromWords(words);
  if (bytes.length < 33) throw new Error("Malformed governance action id.");
  const txHash = Array.from(bytes.slice(0, 32), (b) => b.toString(16).padStart(2, "0")).join("");
  let txIndex = 0;
  for (const b of bytes.slice(32)) txIndex = (txIndex << 8) | b;
  return { txHash, txIndex };
}

function resolveIpfsUrl(url) {
  const s = String(url || "").trim();
  return s.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${s.slice(7)}` : s;
}

/** The vote anchor for a rationale URL: the document's blake2b-256, or undefined without a URL. */
export async function buildVoteAnchor(rawUrl) {
  const url = String(rawUrl || "").trim();
  if (!url) return undefined;
  const res = await fetch(resolveIpfsUrl(url));
  if (!res.ok) throw new Error(`The rationale URL could not be fetched (HTTP ${res.status}).`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  return { anchorUrl: url, anchorDataHash: blakejs.blake2bHex(bytes, null, 32) };
}

/**
 * One label-17 transaction, optionally carrying a DRep vote on a governance
 * action (`vote` = { drepId, actionId, choice: "Yes" | "No" | "Abstain",
 * anchor? }). With the vote the transaction is CIP-179's mechanism B: the
 * ledger enforces the DRep witness for the vote, and that vote proves the
 * response credential when the action is one the survey links.
 */
async function buildAndSubmitMetadataTx(walletApi, metadatum, signerHashes = [], { vote } = {}) {
  const utxos = await walletApi.getUtxos();
  if (!utxos?.length) {
    throw new Error("No UTxOs found in wallet. Fund your wallet with ADA and try again.");
  }
  const changeAddress = await walletApi.getChangeAddress();
  const tx = new Transaction({ initiator: walletApi });
  tx.sendLovelace(changeAddress, "2000000");
  tx.setMetadata(METADATA_LABEL, metadatum);
  const required = [...new Set(signerHashes.filter(Boolean).map((h) => String(h).toLowerCase()))];
  for (const signerHash of required) {
    tx.txBuilder.requiredSignerHash(signerHash);
  }
  if (vote) {
    const { txHash, txIndex } = govActionRef(vote.actionId);
    tx.txBuilder.vote(
      { type: "DRep", drepId: vote.drepId },
      { txHash, txIndex },
      { voteKind: vote.choice, ...(vote.anchor ? { anchor: vote.anchor } : {}) },
    );
  }
  const unsignedTx = await tx.build();
  const signedTx = await walletApi.signTx(unsignedTx, true, true);

  // A required signer the wallet did not sign for would be rejected by the
  // node with a message most wallets swallow; say which key is missing
  // before anything is submitted.
  let missing = [];
  try {
    const witnessed = witnessedKeyHashes(signedTx);
    missing = required.filter((h) => !witnessed.has(h));
  } catch {
    // If the signed transaction cannot be decoded here, let the network judge it.
  }
  if (missing.length) {
    throw new SurveyTxError(
      "The wallet signed the transaction, but not with every key this answer has to prove.",
      "unsigned-required-signer",
      { missing },
    );
  }

  try {
    return await walletApi.submitTx(signedTx);
  } catch (walletError) {
    // The wallet's submit failed without a usable reason; submit through
    // Koios, which either gets the transaction on chain or names the rule.
    try {
      return await submitViaKoios(signedTx);
    } catch (koiosError) {
      if (koiosError instanceof SurveyTxError) throw koiosError;
      throw walletError;
    }
  }
}

/**
 * Attaches a ready-made label-17 payload (what <tessera-respond> emits) and
 * submits it, proving `signerHashes` via required signers. Resolves to the
 * transaction hash.
 */
export async function submitLabel17Payload(walletApi, payload, signerHashes = [], options = {}) {
  return buildAndSubmitMetadataTx(walletApi, payload, signerHashes, options);
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
 * registered DRep signed in with the DRep key answers as a DRep. The DRep
 * key itself is the session's CIP-95 public key (`drepPubKeyHex`, read
 * from the raw wallet API at sign-in); Mesh's getDRep() is only a fallback,
 * since it needs the wallet enabled with CIP-95 through Mesh.
 */
export async function responderCredentials(walletApi, { includeDrep = false, drepPubKeyHex = "" } = {}) {
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
    let drepHash = "";
    const pubKey = String(drepPubKeyHex || "").trim().toLowerCase();
    if (/^[0-9a-f]{64}$/.test(pubKey)) {
      drepHash = blakejs.blake2bHex(hexToBytes(pubKey), null, 28);
    } else {
      try {
        const drep = await walletApi.getDRep();
        if (drep?.publicKeyHash) drepHash = String(drep.publicKeyHash).toLowerCase();
      } catch {
        // Wallet without CIP-95 through Mesh: no DRep credential to offer.
      }
    }
    if (drepHash) {
      responder[Role.DRep] = { type: "key", keyHash: hexToBytes(drepHash) };
      hashes[Role.DRep] = drepHash;
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
