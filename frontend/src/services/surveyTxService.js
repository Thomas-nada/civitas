/**
 * CIP-0179 v4 survey transaction building.
 * Definition and response records are integer-keyed CBOR maps.
 * Question type tags: 0=custom, 1=single-choice, 2=multi-select,
 *   3=ranking, 4=numeric-range, 5=points-allocation, 6=rating.
 * Role eligibility replaces role weighting (no weighting in v4).
 */
import { Transaction, resolvePaymentKeyHash } from "@meshsdk/core";

export const METADATA_LABEL = 80085; // TODO: revert to 17 after mainnet testing
const SPEC_VERSION = 4;

export const ROLE_TO_INT = { DRep: 0, SPO: 1, CC: 2, Stakeholder: 3, Owner: 4 };

export const Q_CUSTOM            = 0;
export const Q_SINGLE_CHOICE     = 1;
export const Q_MULTI_SELECT      = 2;
export const Q_RANKING           = 3;
export const Q_NUMERIC_RANGE     = 4;
export const Q_POINTS_ALLOCATION = 5;
export const Q_RATING            = 6;

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function chunkText(str) {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  if (encoded.length <= 64) return str;
  const decoder = new TextDecoder();
  const chunks = [];
  let offset = 0;
  while (offset < encoded.length) {
    let end = Math.min(offset + 64, encoded.length);
    while (end > offset && (encoded[end] & 0xc0) === 0x80) end--;
    chunks.push(decoder.decode(encoded.slice(offset, end)));
    offset = end;
  }
  return chunks;
}

function encodeQuestion(q) {
  const prompt = chunkText(q.prompt);
  const req = q.required === true ? [true] : [];
  switch (q.tag) {
    case Q_CUSTOM:
      // [0, prompt, content_anchor] — required not supported for custom
      return [Q_CUSTOM, prompt, q.contentAnchor ?? ""];
    case Q_SINGLE_CHOICE:
      return [Q_SINGLE_CHOICE, prompt, q.options.map(chunkText), ...req];
    case Q_MULTI_SELECT:
      return [Q_MULTI_SELECT, prompt, q.options.map(chunkText), q.minSelections ?? 0, q.maxSelections, ...req];
    case Q_RANKING:
      return [Q_RANKING, prompt, q.options.map(chunkText), q.minRanked ?? 0, q.maxRanked ?? q.options.length, ...req];
    case Q_NUMERIC_RANGE: {
      const c = q.step != null ? [q.minValue, q.maxValue, q.step] : [q.minValue, q.maxValue];
      return [Q_NUMERIC_RANGE, prompt, c, ...req];
    }
    case Q_POINTS_ALLOCATION:
      return [Q_POINTS_ALLOCATION, prompt, q.options.map(chunkText), q.budget ?? 100, ...req];
    case Q_RATING:
      return [Q_RATING, prompt, q.options.map(chunkText), q.ratingScale ?? [1, 5], ...req];
    default:
      throw new Error(`Unsupported question type tag: ${q.tag}`);
  }
}

async function buildAndSubmitMetadataTx(walletApi, payload) {
  const utxos = await walletApi.getUtxos();
  if (!utxos || utxos.length === 0) {
    throw new Error("No UTxOs found in wallet. Fund your wallet with ADA and try again.");
  }
  const changeAddress = await walletApi.getChangeAddress();
  const tx = new Transaction({ initiator: walletApi });
  tx.sendLovelace(changeAddress, "2000000");
  tx.setMetadata(METADATA_LABEL, payload);
  const unsignedTx = await tx.build();
  const signedTx = await walletApi.signTx(unsignedTx);
  const txHash = await walletApi.submitTx(signedTx);
  return txHash;
}

/**
 * Build and submit a CIP-179 v4 survey creation transaction.
 * @param {object} walletApi   - BrowserWallet instance
 * @param {object} surveyForm  - { title, description, endEpoch, eligibleRoles, questions }
 *   eligibleRoles: string[]  e.g. ["DRep", "SPO"]
 *   questions: [{ tag, prompt, options?, minSelections?, maxSelections?,
 *                 minRanked?, maxRanked?, minValue?, maxValue?, step?,
 *                 budget?, ratingScale?, contentAnchor? }]
 * @returns {Promise<{surveyTxId: string}>}
 */
export async function buildAndSubmitSurveyCreation(walletApi, surveyForm) {
  const changeAddress = await walletApi.getChangeAddress();
  const ownerKeyHashHex = resolvePaymentKeyHash(changeAddress);
  const owner = [0, hexToBytes(ownerKeyHashHex)]; // [VKeyHash, hash_bytes]

  const eligibleRoleInts = (surveyForm.eligibleRoles ?? [])
    .map((r) => ROLE_TO_INT[r])
    .filter((n) => n !== undefined);

  // v4 definition: integer-keyed map
  // Key 0: spec_version  Key 1: owner  Key 2: title  Key 3: description
  // Key 4: eligible_roles  Key 5: end_epoch  Key 6: submission_mode  Key 7: questions
  // Key 8: content_anchor (optional URI)
  const definition = new Map([
    [0, SPEC_VERSION],
    [1, owner],
    [2, chunkText(surveyForm.title)],
    [3, chunkText(surveyForm.description)],
    [4, eligibleRoleInts],
    [5, surveyForm.endEpoch],
    [6, surveyForm.isTimelocked ? [1] : [0]], // submission_mode: 0=public 1=sealed
    [7, surveyForm.questions.map(encodeQuestion)],
    ...(surveyForm.contentAnchor?.trim() ? [[8, chunkText(surveyForm.contentAnchor.trim())]] : []),
  ]);

  // envelope: [tag=0 (definitions), [definition]]
  const txHash = await buildAndSubmitMetadataTx(walletApi, [0, [definition]]);
  return { surveyTxId: txHash };
}

/**
 * Build and submit a CIP-179 v4 survey response transaction.
 * @param {object} walletApi     - BrowserWallet instance
 * @param {string} surveyTxId    - Transaction hash of the survey definition
 * @param {number} surveyIndex   - Position of the survey in the definitions array
 * @param {string} responderRole - "DRep"|"SPO"|"CC"|"Stakeholder"|"Owner"
 * @param {Array}  answers       - v4 answer tuples: [tag, questionIndex, value]
 *   Custom:        [0, qi, any]
 *   Single-choice: [1, qi, optionIndex]
 *   Multi-select:  [2, qi, [optionIndices]]
 *   Ranking:       [3, qi, [rankedOptionIndices]]
 *   Numeric-range: [4, qi, intValue]
 *   Points-alloc:  [5, qi, [[optIdx, points], ...]]
 *   Rating:        [6, qi, [[optIdx, score], ...]]
 * @returns {Promise<{txId: string}>}
 */
export async function buildAndSubmitSurveyResponse(walletApi, surveyTxId, surveyIndex, responderRole, answers) {
  const changeAddress = await walletApi.getChangeAddress();
  const responderKeyHashHex = resolvePaymentKeyHash(changeAddress);
  const credential = [0, hexToBytes(responderKeyHashHex)];

  const surveyRef = [hexToBytes(surveyTxId), surveyIndex];
  const roleInt = ROLE_TO_INT[responderRole];
  if (roleInt === undefined) throw new Error(`Unknown responder role: ${responderRole}`);

  // v4 response: integer-keyed map
  // Key 0: spec_version  Key 1: survey_ref  Key 2: role  Key 3: credential  Key 4: answers
  const response = new Map([
    [0, SPEC_VERSION],
    [1, surveyRef],
    [2, roleInt],
    [3, credential],
    [4, answers],
  ]);

  // envelope: [tag=1 (responses), [response]]
  const txHash = await buildAndSubmitMetadataTx(walletApi, [1, [response]]);
  return { txId: txHash };
}
