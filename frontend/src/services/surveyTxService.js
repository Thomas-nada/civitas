/**
 * CIP-0179 survey transaction building.
 * Ported from the reference implementation (TestnetBlockchain.ts).
 * Uses the MeshJS Transaction class already available in Civitas.
 */
import { Transaction } from "@meshsdk/core";

const METADATA_LABEL = 17;
const MAX_METADATA_STR_BYTES = 64;

function chunkString(str, maxBytes) {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  if (encoded.length <= maxBytes) return [str];
  const decoder = new TextDecoder();
  const chunks = [];
  let offset = 0;
  while (offset < encoded.length) {
    let end = Math.min(offset + maxBytes, encoded.length);
    while (end > offset && (encoded[end] & 0xc0) === 0x80) end--;
    chunks.push(decoder.decode(encoded.slice(offset, end)));
    offset = end;
  }
  return chunks;
}

function toCardanoMetadata(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    const chunks = chunkString(value, MAX_METADATA_STR_BYTES);
    return chunks.length === 1 ? chunks[0] : chunks;
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : String(value);
  }
  if (typeof value === "boolean") return value ? 1 : 0;
  if (Array.isArray(value)) return value.map(toCardanoMetadata);
  if (typeof value === "object") {
    const result = new Map();
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      result.set(k, toCardanoMetadata(v));
    }
    return result;
  }
  return String(value);
}

async function buildAndSubmitMetadataTx(walletApi, innerPayload) {
  const utxos = await walletApi.getUtxos();
  if (!utxos || utxos.length === 0) {
    throw new Error("No UTxOs found in wallet. Fund your wallet with ADA and try again.");
  }
  const changeAddress = await walletApi.getChangeAddress();
  const safeContent = toCardanoMetadata(innerPayload);

  const tx = new Transaction({ initiator: walletApi });
  tx.sendLovelace(changeAddress, "2000000");
  tx.setMetadata(METADATA_LABEL, safeContent);

  const unsignedTx = await tx.build();
  const signedTx = await walletApi.signTx(unsignedTx);
  const txHash = await walletApi.submitTx(signedTx);
  return txHash;
}

/**
 * Build and submit a survey creation transaction.
 * @param {object} walletApi  - BrowserWallet instance from WalletContext
 * @param {object} surveyDetails - CIP-0179 surveyDetails object
 * @returns {Promise<{surveyTxId: string}>}
 */
export async function buildAndSubmitSurveyCreation(walletApi, surveyDetails) {
  const canonicalDetails = {
    specVersion: surveyDetails.specVersion ?? "1.0.0",
    title: surveyDetails.title,
    description: surveyDetails.description,
    questions: surveyDetails.questions,
    roleWeighting: surveyDetails.roleWeighting,
    endEpoch: surveyDetails.endEpoch,
  };
  const innerPayload = { surveyDetails: canonicalDetails };
  const txHash = await buildAndSubmitMetadataTx(walletApi, innerPayload);
  return { surveyTxId: txHash };
}

/**
 * Build and submit a survey response transaction.
 * @param {object} walletApi     - BrowserWallet instance from WalletContext
 * @param {string} surveyTxId   - Transaction ID of the survey definition
 * @param {string} responderRole - "DRep" | "SPO" | "CC" | "Stakeholder"
 * @param {Array}  answers       - [{questionId, selection?, numericValue?, customValue?}]
 * @returns {Promise<{txId: string}>}
 */
export async function buildAndSubmitSurveyResponse(walletApi, surveyTxId, responderRole, answers) {
  const canonicalResponse = {
    specVersion: "1.0.0",
    surveyTxId,
    responderRole,
    answers,
  };
  const innerPayload = { surveyResponse: canonicalResponse };
  const txHash = await buildAndSubmitMetadataTx(walletApi, innerPayload);
  return { txId: txHash };
}
