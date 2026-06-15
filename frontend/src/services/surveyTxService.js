/**
 * CIP-0179 v4 survey transaction building.
 * Definition and response records are integer-keyed CBOR maps.
 * Question type tags: 0=custom, 1=single-choice, 2=multi-select,
 *   3=ranking, 4=numeric-range, 5=points-allocation, 6=rating.
 * Role eligibility replaces role weighting (no weighting in v4).
 */
import { Transaction, resolvePaymentKeyHash } from "@meshsdk/core";
import { timelockEncrypt, mainnetClient, Buffer as TlockBuffer } from "tlock-js";
import blakejs from "blakejs";

export const METADATA_LABEL = 80085; // TODO: revert to 17 after mainnet testing
const SPEC_VERSION = 4;

// drand quicknet mainnet chain hash (32 bytes)
const QUICKNET_CHAIN_HASH_HEX = "52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971";

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

// CIP-0179 content_anchor = [chunked_text_uri, blake2b_256_hash(32 bytes)].
// Used by both the survey definition (key 8) and the response rationale (key 5).
// A 32-byte zero hash is used when no content hash is available (the hash is an
// integrity hint and, for response rationale, purely informational per spec).
function encodeContentAnchor(url, hashHex) {
  const clean = String(hashHex || "").replace(/^0x/, "").trim().toLowerCase();
  const hashBytes = /^[0-9a-f]{64}$/.test(clean) ? hexToBytes(clean) : new Uint8Array(32);
  return [chunkText(String(url).trim()), hashBytes];
}

// Best-effort blake2b-256 of the content at an anchor URL. Returns 64-char hex
// or null if the content can't be fetched (e.g. CORS). Never throws.
export async function hashAnchorContent(url) {
  try {
    const raw = String(url || "").trim();
    if (!raw) return null;
    const target = raw.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${raw.slice(7)}` : raw;
    const res = await fetch(target);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    return blakejs.blake2bHex(bytes, null, 32);
  } catch {
    return null;
  }
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
  const req = q.required === true ? [1] : [];
  switch (q.tag) {
    case Q_CUSTOM:
      // [0, prompt, content_anchor, ?required] where content_anchor = [uri, hash]
      return [Q_CUSTOM, prompt, encodeContentAnchor(q.contentAnchorUrl ?? "", q.contentAnchorHash), ...req];
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
  const definition = {
    "0": SPEC_VERSION,
    "1": owner,
    "2": chunkText(surveyForm.title),
    "3": chunkText(surveyForm.description),
    "4": eligibleRoleInts,
    "5": surveyForm.endEpoch,
    "6": surveyForm.isTimelocked
      ? [1, hexToBytes(QUICKNET_CHAIN_HASH_HEX), surveyForm.drandRound ?? 0, surveyForm.padding ?? 256]
      : [0],
    "7": surveyForm.questions.map(encodeQuestion),
    ...(surveyForm.contentAnchorUrl?.trim()
      ? { "8": encodeContentAnchor(surveyForm.contentAnchorUrl, surveyForm.contentAnchorHash) }
      : {}),
  };

  // envelope: [tag=0 (definitions), [definition]]
  const txHash = await buildAndSubmitMetadataTx(walletApi, [0, [definition]]);
  return { surveyTxId: txHash };
}

/**
 * Timelock-encrypt plaintext answers for a sealed survey.
 * Serialises answers to JSON bytes, pads to paddingSize, encrypts with drand quicknet tlock,
 * then returns the armored ciphertext chunked into ≤64-byte Uint8Arrays.
 */
async function sealAnswers(answers, drandRound, paddingSize) {
  const encoder = new TextEncoder();
  let plainBytes = encoder.encode(JSON.stringify(answers));

  if (plainBytes.length < paddingSize) {
    const padded = new Uint8Array(paddingSize);
    padded.set(plainBytes);
    plainBytes = padded;
  }

  const client = mainnetClient();
  const armored = await timelockEncrypt(drandRound, TlockBuffer.from(plainBytes), client);

  const cipherBytes = encoder.encode(armored);
  const chunks = [];
  for (let i = 0; i < cipherBytes.length; i += 64) {
    chunks.push(cipherBytes.slice(i, i + 64));
  }
  return chunks;
}

/**
 * Build and submit a CIP-179 v4 survey response transaction.
 * @param {object}  walletApi     - BrowserWallet instance
 * @param {string}  surveyTxId   - Transaction hash of the survey definition
 * @param {number}  surveyIndex  - Position of the survey in the definitions array
 * @param {string}  responderRole - "DRep"|"SPO"|"CC"|"Stakeholder"|"Owner"
 * @param {Array}   answers      - v4 answer tuples: [tag, questionIndex, value]
 * @param {object}  [sealOpts]   - { drandRound: number, padding: number } for sealed surveys
 * @param {object}  [rationale]  - optional voter rationale { url: string, hash?: hex } → key 5
 * @returns {Promise<{txId: string}>}
 */
export async function buildAndSubmitSurveyResponse(walletApi, surveyTxId, surveyIndex, responderRole, answers, sealOpts, rationale) {
  const changeAddress = await walletApi.getChangeAddress();
  const responderKeyHashHex = resolvePaymentKeyHash(changeAddress);
  const credential = [0, hexToBytes(responderKeyHashHex)];

  const surveyRef = [hexToBytes(surveyTxId), surveyIndex];
  const roleInt = ROLE_TO_INT[responderRole];
  if (roleInt === undefined) throw new Error(`Unknown responder role: ${responderRole}`);

  // For sealed surveys, key 4 is chunked_bytes (tlock ciphertext) instead of plaintext answers
  let responseAnswers = answers;
  if (sealOpts?.drandRound) {
    responseAnswers = await sealAnswers(answers, sealOpts.drandRound, sealOpts.padding ?? 256);
  }

  // v4 response: integer-keyed map
  // Key 0: spec_version  Key 1: survey_ref  Key 2: role  Key 3: credential  Key 4: answers/ciphertext
  // Key 5: content_anchor (optional voter rationale)
  const response = {
    "0": SPEC_VERSION,
    "1": surveyRef,
    "2": roleInt,
    "3": credential,
    "4": responseAnswers,
    ...(rationale?.url?.trim() ? { "5": encodeContentAnchor(rationale.url, rationale.hash) } : {}),
  };

  // envelope: [tag=1 (responses), [response]]
  const txHash = await buildAndSubmitMetadataTx(walletApi, [1, [response]]);
  return { txId: txHash };
}

/**
 * Resolve the connected wallet's payment key hash (hex). Used to check whether
 * the connected wallet owns a survey (and may therefore cancel it).
 * @param {object} walletApi - BrowserWallet instance
 * @returns {Promise<string>} payment key hash hex
 */
export async function getConnectedPaymentKeyHash(walletApi) {
  const changeAddress = await walletApi.getChangeAddress();
  return resolvePaymentKeyHash(changeAddress);
}

/**
 * Build and submit a CIP-179 survey cancellation transaction. Per spec, the
 * cancellation must be signed by the survey owner's credential — the backend
 * only honours a cancellation whose signer matches the definition's owner key
 * hash, so this must be sent from the same wallet that created the survey.
 * @param {object} walletApi   - BrowserWallet instance
 * @param {string} surveyTxId  - Transaction hash of the survey definition
 * @param {number} surveyIndex - Position of the survey in the definitions array
 * @returns {Promise<{txId: string}>}
 */
export async function buildAndSubmitSurveyCancellation(walletApi, surveyTxId, surveyIndex) {
  const surveyRef = [hexToBytes(surveyTxId), surveyIndex ?? 0];
  // envelope: [tag=2 (cancellations), [survey_ref]]
  const txHash = await buildAndSubmitMetadataTx(walletApi, [2, [surveyRef]]);
  return { txId: txHash };
}
