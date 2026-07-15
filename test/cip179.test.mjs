import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import {
  Role,
  SPEC_VERSION,
  decodePayload,
  encodePayload,
  validateDefinition,
  validateResponse,
} from "cip-179";
import { hexToBytes } from "cip-179/domain";
import { evolutionCodec } from "cip-179/evolution";
import { Transaction } from "../frontend/node_modules/@meshsdk/core/dist/index.js";
import { sealAnswers, revealWithBeacon } from "../frontend/node_modules/cip-179/dist/tlock/index.js";
import { buildSurveyResponse, metadatumCodec } from "../frontend/src/services/surveyTxService.js";
import { DREP_VOTE_TX_CBOR } from "../node_modules/cip-179/dist/txproof/fixtures/voteTxs.js";

const require = createRequire(import.meta.url);
const { buildIndex, decodeCborPayload, parseGovernanceLink } = require("../lib/cip179.js");

const HASH28 = hexToBytes("11".repeat(28));
const HASH32 = hexToBytes("22".repeat(32));

const definition = {
  specVersion: SPEC_VERSION,
  owner: { type: "key", keyHash: HASH28 },
  title: "Civitas v5 fixture",
  description: "Exercises every built-in CIP-179 question type.",
  eligibleRoles: [Role.DRep, Role.Stakeholder, Role.Keyholder],
  endEpoch: 900,
  submissionMode: { type: "public" },
  questions: [
    { type: "custom", prompt: "Comment", methodSchema: { uri: "https://example.com/schema", hash: HASH32 } },
    { type: "singleChoice", prompt: "Choose", options: { type: "options", labels: ["A", "B"] }, required: true },
    { type: "multiSelect", prompt: "Select", options: { type: "options", labels: ["A", "B", "C"] }, minSelections: 0, maxSelections: 2 },
    { type: "ranking", prompt: "Rank", options: { type: "options", labels: ["A", "B", "C"] }, minRanked: 1, maxRanked: 3 },
    { type: "numericRange", prompt: "Number", constraints: { min: 0n, max: 10n, step: 2n } },
    { type: "pointsAllocation", prompt: "Allocate", options: { type: "options", labels: ["A", "B"] }, budget: 100 },
    { type: "rating", prompt: "Rate", options: { type: "options", labels: ["A", "B"] }, scale: { type: "numeric", constraints: { min: 1n, max: 5n } }, requireAll: true },
  ],
};

const response = {
  specVersion: SPEC_VERSION,
  surveyRef: { txId: HASH32, index: 7 },
  role: Role.DRep,
  credential: { type: "key", keyHash: HASH28 },
  answers: {
    type: "public",
    answers: [
      { type: "custom", questionIndex: 0, value: "Text" },
      { type: "singleChoice", questionIndex: 1, optionIndex: 0 },
      { type: "multiSelect", questionIndex: 2, optionIndices: [] },
      { type: "ranking", questionIndex: 3, ranking: [2, 0] },
      { type: "numeric", questionIndex: 4, value: 6n },
      { type: "pointsAllocation", questionIndex: 5, allocations: [{ optionIndex: 0, points: 60 }, { optionIndex: 1, points: 40 }] },
      { type: "rating", questionIndex: 6, ratings: [{ optionIndex: 0, rating: 5n }, { optionIndex: 1, rating: 3n }] },
    ],
  },
};

test("v5 definition encodes as an array containing integer-keyed maps", async () => {
  assert.deepEqual(validateDefinition(definition), []);
  const metadatum = encodePayload({ type: "definitions", definitions: [definition] });
  assert.ok(Array.isArray(metadatum));
  assert.equal(metadatum[0], 0n);
  assert.ok(metadatum[1][0] instanceof Map);
  assert.deepEqual([...metadatum[1][0].keys()], [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n]);

  const cbor = evolutionCodec.metadatumToCbor(metadatum);
  assert.equal(cbor[0], 0x82);
  const decoded = await decodeCborPayload(Buffer.from(cbor).toString("hex"));
  assert.equal(decoded.type, "definitions");
  assert.equal(decoded.definitions[0].specVersion, SPEC_VERSION);
  assert.equal(decoded.definitions[0].questions[6].requireAll, true);
});

test("Mesh preserves native arrays and integer-keyed maps", () => {
  for (const payload of [
    { type: "definitions", definitions: [definition] },
    { type: "responses", responses: [response] },
  ]) {
    const tx = new Transaction({ initiator: {} });
    tx.setMetadata(17, encodePayload(payload));
    const metadatum = tx.txBuilder.meshTxBuilderBody.metadata.get(17n);
    assert.ok(Array.isArray(metadatum));
    assert.equal(metadatum[0], payload.type === "definitions" ? 0n : 1n);
    assert.ok(metadatum[1][0] instanceof Map);
    assert.ok([...metadatum[1][0].keys()].every((key) => typeof key === "bigint"));
  }
});

test("governance links require v5 and a uint16 survey index", async () => {
  const linked = (specVersion, surveyIndex) => ({
    body: {
      cip179: {
        specVersion,
        kind: "survey-link",
        surveyTxId: "22".repeat(32),
        surveyIndex,
      },
    },
  });
  assert.deepEqual((await parseGovernanceLink(linked(5, 7))).surveyRef, { txId: "22".repeat(32), index: 7 });
  assert.equal((await parseGovernanceLink(linked(4, 7))).surveyRef, null);
  assert.equal((await parseGovernanceLink(linked(5, 65536))).surveyRef, null);
});

test("all built-in response variants round-trip and validate", async () => {
  assert.deepEqual(validateResponse(definition, response), []);
  const metadatum = encodePayload({ type: "responses", responses: [response] });
  const cbor = evolutionCodec.metadatumToCbor(metadatum);
  const decoded = await decodeCborPayload(Buffer.from(cbor).toString("hex"));
  assert.equal(decoded.type, "responses");
  assert.equal(decoded.responses[0].answers.type, "public");
  assert.equal(decoded.responses[0].answers.answers.length, 7);
  assert.deepEqual(decoded.responses[0].answers.answers[2].optionIndices, []);
});

test("detailed-schema-shaped string maps are rejected", () => {
  const malformed = new Map([["list", [new Map([["int", 0n]])]]]);
  assert.throws(() => decodePayload(malformed), /expected.*list|payload/i);
});

test("custom text answers fail before exceeding Cardano's metadata limit", async () => {
  const wallet = { getDRep: async () => ({ publicKeyHash: "11".repeat(28) }) };
  await assert.rejects(
    buildSurveyResponse(wallet, "22".repeat(32), 0, "DRep", [[0, 0, "é".repeat(33)]]),
    /64-byte metadata text limit/,
  );
});

test("legacy spec versions are not accepted by the v5 validator", () => {
  const legacy = { ...definition, specVersion: 4 };
  assert.ok(validateDefinition(legacy).some((problem) => problem.includes("spec_version")));
});

test("sealed answers use canonical CBOR and raw interoperable ciphertext", async () => {
  const answers = response.answers.answers.slice(1, 4);
  const beacon = {
    round: 1_000_000,
    randomness: "b22aad4794f7451896f7a371aa46106fd84d919f3f569acd5b2fddf1d1440af3",
    signature: "83ad29e4c409f9470fc2ef02f90214df49e02b441a1a241a82d622d9f608ef98fd8b11a029f1bee9d9e83b45088abe72",
  };
  const ciphertext = await sealAnswers(metadatumCodec, answers, beacon.round, 512);
  assert.ok(ciphertext instanceof Uint8Array);
  assert.ok(ciphertext.length > 512);
  const sealedResponse = { ...response, answers: { type: "sealed", ciphertext } };
  const [revealed] = await revealWithBeacon(metadatumCodec, [sealedResponse], beacon);
  assert.deepEqual(revealed?.answers, { type: "public", answers });
});

test("the indexer consumes CBOR, verifies proof, and keeps explicit survey indexes", async () => {
  const definitionTx = "aa".repeat(32);
  const responseTx = "bb".repeat(32);
  const signerHash = "d16978b7f8052ad3383bee5930d37ec05fe483ff4477d50df3585c57";
  const indexedDefinition = {
    ...definition,
    owner: { type: "key", keyHash: hexToBytes(signerHash) },
    eligibleRoles: [Role.DRep],
  };
  const indexedResponse = {
    ...response,
    surveyRef: { txId: hexToBytes(definitionTx), index: 1 },
    credential: { type: "key", keyHash: hexToBytes(signerHash) },
  };
  const definitionsCbor = Buffer.from(evolutionCodec.metadatumToCbor(encodePayload({
    type: "definitions",
    definitions: [indexedDefinition, indexedDefinition],
  }))).toString("hex");
  const responsesCbor = Buffer.from(evolutionCodec.metadatumToCbor(encodePayload({
    type: "responses",
    responses: [indexedResponse],
  }))).toString("hex");

  const get = async (endpoint) => {
    if (endpoint.startsWith("/metadata/txs/labels/17/cbor")) return [
      { tx_hash: definitionTx, metadata: definitionsCbor },
      { tx_hash: responseTx, cbor_metadata: `\\x${responsesCbor}` },
    ];
    if (endpoint === `/txs/${definitionTx}/cbor` || endpoint === `/txs/${responseTx}/cbor`) return { cbor: DREP_VOTE_TX_CBOR };
    if (endpoint === `/txs/${definitionTx}`) return { slot: 100, index: 0, block: "block1", block_time: 1_700_000_000 };
    if (endpoint === `/txs/${responseTx}`) return { slot: 101, index: 1, block: "block1", block_time: 1_700_000_001 };
    if (endpoint === "/blocks/block1") return { epoch: 800 };
    throw new Error(`unexpected endpoint ${endpoint}`);
  };

  const index = await buildIndex({ get, maxPages: 1 });
  assert.equal(index.surveys.length, 2);
  assert.equal(index.surveys[1].surveyIndex, 1);
  assert.deepEqual(index.surveys[1].details.ownerCredential, { type: "key", hash: signerHash });
  assert.equal(index.responsesBySurvey[`${definitionTx}:1`].length, 1);
  assert.equal(index.responsesBySurvey[`${definitionTx}:1`][0].responderRole, "DRep");
  assert.equal(index.responsesBySurvey[`${definitionTx}:1`][0].responseIndex, 0);
});

test("definitions must remain open after their inclusion epoch", async () => {
  const txHash = "aa".repeat(32);
  const expired = { ...definition, endEpoch: 800 };
  const cbor = Buffer.from(evolutionCodec.metadatumToCbor(encodePayload({
    type: "definitions",
    definitions: [expired],
  }))).toString("hex");
  const get = async (endpoint) => {
    if (endpoint.startsWith("/metadata/txs/labels/17/cbor")) return [{ tx_hash: txHash, metadata: cbor }];
    if (endpoint === `/txs/${txHash}/cbor`) return { cbor: DREP_VOTE_TX_CBOR };
    if (endpoint === `/txs/${txHash}`) return { slot: 100, index: 0, block: "block1", block_time: 1_700_000_000 };
    if (endpoint === "/blocks/block1") return { epoch: 800 };
    throw new Error(`unexpected endpoint ${endpoint}`);
  };
  const index = await buildIndex({ get, maxPages: 1 });
  assert.equal(index.surveys.length, 0);
});
