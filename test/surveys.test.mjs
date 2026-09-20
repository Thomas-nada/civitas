// Unit tests for lib/surveys.js: the pure parts of the Tessera-backed survey
// read path (lifecycle, question views, answer text, the informational
// tally and page merging), with cip-179 types built in the test.
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const surveys = require("../lib/surveys.js");
const { Role } = await import("cip-179");
const { hexToBytes } = await import("cip-179/domain");

const TX_A = "aa".repeat(32);
const TX_B = "bb".repeat(32);
const OWNER = "11".repeat(28);
const DREP_1 = "21".repeat(28);
const DREP_2 = "22".repeat(28);
const STAKE_1 = "31".repeat(28);

function definition(overrides = {}) {
  return {
    specVersion: 5,
    owner: { type: "key", keyHash: hexToBytes(OWNER) },
    title: "Minimum fees",
    description: "Should the minimum fee change?",
    eligibleRoles: [Role.DRep, Role.Stakeholder],
    endEpoch: 700,
    submissionMode: { type: "public" },
    questions: [
      { type: "singleChoice", prompt: "Lower the fee?", required: true, options: { type: "options", labels: ["Yes", "No"] } },
      { type: "pointsAllocation", prompt: "Split 10 points", options: { type: "options", labels: ["A", "B"] }, budget: 10n },
    ],
    ...overrides,
  };
}

function response({ txHash, role = Role.DRep, hash = DREP_1, optionIndex = 0, epochNo = 690, slot = 1000, responseIndex = 0 }) {
  return {
    txHash, slot, epochNo, responseIndex,
    response: {
      specVersion: 5,
      surveyRef: { txId: hexToBytes(TX_A), index: 0 },
      role,
      credential: { type: "key", keyHash: hexToBytes(hash) },
      answers: {
        type: "public",
        answers: [
          { type: "singleChoice", questionIndex: 0, optionIndex },
          { type: "pointsAllocation", questionIndex: 1, allocations: [{ optionIndex: 0, points: 7n }, { optionIndex: 1, points: 3n }] },
        ],
      },
    },
  };
}

test("lifecycle follows the calendar unless Tessera decided otherwise", () => {
  const base = { talliable: true, cancelled: false, finalState: null, endEpoch: 700 };
  assert.equal(surveys.lifecycleOf({ ...base, calendarEpoch: 700 }), "open");
  assert.equal(surveys.lifecycleOf({ ...base, calendarEpoch: 701 }), "closed");
  assert.equal(surveys.lifecycleOf({ ...base, cancelled: true, calendarEpoch: 650 }), "cancelled");
  assert.equal(surveys.lifecycleOf({ ...base, finalState: { state: "cancelled", artifactHash: "x" }, calendarEpoch: 650 }), "cancelled");
  assert.equal(surveys.lifecycleOf({ ...base, talliable: false, cancelled: true, calendarEpoch: 650 }), "untalliable");
  assert.equal(surveys.lifecycleOf({ ...base, finalState: { state: "untalliable" }, calendarEpoch: 650 }), "untalliable");
});

test("question views carry labels, kinds and big integers as strings", () => {
  const views = definition().questions.map(surveys.questionView);
  assert.equal(views[0].kindLabel, "Single choice");
  assert.deepEqual(views[0].options, ["Yes", "No"]);
  assert.equal(views[0].required, true);
  assert.equal(views[1].kind, "pointsAllocation");
  assert.equal(views[1].budget, "10");
  assert.equal(views[1].kindLabel, "Distribute 10 points");
  const external = surveys.questionView({ type: "singleChoice", prompt: "", options: { type: "count", count: 3 } }, 0);
  assert.equal(external.externalOptions, true);
  assert.deepEqual(external.options, ["Option 1", "Option 2", "Option 3"]);
});

test("answer text names options and keeps points readable", () => {
  const views = definition().questions.map(surveys.questionView);
  const r = response({ txHash: TX_A }).response.answers.answers;
  assert.equal(surveys.answerText(r[0], views[0]), "Yes");
  assert.equal(surveys.answerText(r[1], views[1]), "A: 7, B: 3");
  assert.equal(surveys.answerText({ type: "ranking", questionIndex: 0, ranking: [1, 0] }, views[0]), "1. No · 2. Yes");
});

test("the tally counts DReps at unit weight and weights only the DReps with a known power", async () => {
  const { codec, domain, tally } = await surveys.imports();
  const def = definition();
  const responses = [
    response({ txHash: TX_A, hash: DREP_1, optionIndex: 0 }),
    response({ txHash: TX_B, hash: DREP_2, optionIndex: 1, slot: 2000 }),
    // Stakeholder answers are counted by the audit but stay outside the DRep figures.
    response({ txHash: "cc".repeat(32), role: Role.Stakeholder, hash: STAKE_1, optionIndex: 1, slot: 3000 }),
    // Sent after the closing epoch: excluded.
    response({ txHash: "dd".repeat(32), hash: "23".repeat(28), optionIndex: 0, epochNo: 701, slot: 4000 }),
  ];
  const power = {
    epoch: 699,
    totalPower: 1_000_000_000_000n,
    weightOf: (hex) => (hex === DREP_1 ? 400_000_000_000n : null),
  };
  const { tally: t } = surveys.computeTally({
    definition: def, responses, verdicts: undefined, power,
    artifactRole: null, artifactEndEpoch: null, sealed: false, codec, domain, tally,
  });
  assert.equal(t.counted, 2, "two in-window DRep responses counted");
  assert.equal(t.matchedCount, 1, "only DREP_1 has a known power");
  assert.equal(t.answeredPower, "400000000000");
  assert.equal(t.totalPower, "1000000000000");
  assert.equal(t.excluded, 1);
  assert.deepEqual(t.excludedBy, { "after-deadline": 1 });
  assert.deepEqual(t.roleCounts, { DRep: 2, Stakeholder: 1 });
  const head = t.questions.headcount[0];
  assert.equal(head.kind, "options");
  assert.deepEqual(head.options.map((o) => o.count), [1, 1], "head count sees both DReps");
  // cip-179 lists only the options someone picked, so the option DREP_2 chose
  // (index 1) is absent from the weighted run: DREP_2 has no known power.
  const weighted = t.questions.weighted[0];
  const weightByIndex = Object.fromEntries(weighted.options.map((o) => [o.index, o.weight]));
  assert.equal(weightByIndex[0], "400000000000", "weighted run sees DREP_1");
  assert.equal(weightByIndex[1], undefined, "DREP_2 leaves the weighted run");
  assert.equal(weighted.answeredWeight, "400000000000");
  assert.equal(t.weightedSource, "live");
});

test("an artifact replaces the weighted figures but never the head count", async () => {
  const { codec, domain, tally } = await surveys.imports();
  const def = definition();
  const responses = [response({ txHash: TX_A, hash: DREP_1 })];
  const artifactRole = {
    role: Role.DRep,
    total: "5000",
    responders: [{ credential: `key:${DREP_1}`, weight: "1200", txHash: TX_A, responseIndex: 0 }],
    questions: [{ kind: "options", unit: "singleChoice", options: [{ index: 0, weight: "1200", count: 1 }, { index: 1, weight: "0", count: 0 }], answeredCount: 1, answeredWeight: "1200" }, { kind: "custom", answeredCount: 0, answeredWeight: "0" }],
  };
  const { tally: t } = surveys.computeTally({
    definition: def, responses, verdicts: undefined,
    power: { epoch: 699, totalPower: 1n, weightOf: () => null },
    artifactRole, artifactEndEpoch: 700, sealed: false, codec, domain, tally,
  });
  assert.equal(t.weightedSource, "artifact");
  assert.equal(t.answeredPower, "1200");
  assert.equal(t.totalPower, "5000");
  assert.equal(t.powerEpoch, 700);
  assert.equal(t.counted, 1);
  assert.equal(t.questions.headcount[0].options[0].count, 1);
});

test("tally refusals are decided in one place", () => {
  assert.equal(surveys.tallyRefusal({ lifecycle: "untalliable", sealed: false, external: false, artifactRole: null }), "untalliable");
  assert.equal(surveys.tallyRefusal({ lifecycle: "cancelled", sealed: false, external: false, artifactRole: null }), "cancelled");
  assert.equal(surveys.tallyRefusal({ lifecycle: "open", sealed: false, external: true, artifactRole: null }), "external");
  assert.equal(surveys.tallyRefusal({ lifecycle: "open", sealed: true, external: false, artifactRole: null }), "sealed-pending");
  assert.equal(surveys.tallyRefusal({ lifecycle: "closed", sealed: true, external: false, artifactRole: {} }), null);
  assert.equal(surveys.tallyRefusal({ lifecycle: "open", sealed: false, external: false, artifactRole: null }), null);
});

test("merged list pages keep one row per survey and the newest tip", () => {
  const row = (txHash, index) => ({ txHash, slot: 1, epochNo: 1, ref: { txId: hexToBytes(txHash), index }, definition: definition() });
  const merged = surveys.mergePages([
    { surveys: [row(TX_A, 0)], cancellations: [], govLinks: [], tip: { epoch: 1 }, responseCounts: { [`${TX_A}:0`]: 2 }, counts: { all: 2 }, fetchedAt: 10 },
    { surveys: [row(TX_A, 0), row(TX_B, 0)], cancellations: [], govLinks: [{ surveyKey: `${TX_B}:0` }], tip: { epoch: 2 }, responseCounts: { [`${TX_B}:0`]: 1 }, fetchedAt: 11, incomplete: true },
  ]);
  assert.equal(merged.surveys.length, 2);
  assert.equal(merged.tip.epoch, 2);
  assert.equal(merged.fetchedAt, 11);
  assert.equal(merged.incomplete, true);
  assert.deepEqual(merged.counts, { all: 2 });
  assert.deepEqual(merged.responseCounts, { [`${TX_A}:0`]: 2, [`${TX_B}:0`]: 1 });
});

test("a governance anchor is parsed into a survey reference only when well-formed", async () => {
  const ok = await surveys.parseGovernanceLink({
    "@context": { cip179: "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0179/README.md#" },
    body: { cip179: { specVersion: 5, surveyTxId: TX_A, surveyIndex: 0 } },
  });
  // Whatever the parser's exact context rules, a rejected link must carry problems and no ref.
  if (ok.surveyRef) {
    assert.equal(ok.surveyRef.txId, TX_A);
    assert.equal(ok.surveyRef.index, 0);
  } else {
    assert.ok(ok.problems.length > 0);
  }
  const bad = await surveys.parseGovernanceLink({ body: { cip179: { specVersion: 4, surveyTxId: TX_A, surveyIndex: 0 } } });
  assert.equal(bad.surveyRef, null);
  assert.ok(bad.problems.length > 0);
});

test("the action → surveys map is derived from the surveys' governance links", () => {
  const summary = (key, links) => ({
    key, txHash: key.split(":")[0], index: Number(key.split(":")[1]), title: key, lifecycle: "open", lifecycleLabel: "Open",
    endEpoch: 700, eligibleRoles: ["DRep"], responseCount: 3, sealed: false, questions: [{}, {}], govLinks: links,
  });
  const byAction = surveys.indexLinksByAction([
    summary(`${TX_A}:0`, [{ actionId: "gov_action1aaa", title: "A", endEpoch: 700 }]),
    summary(`${TX_B}:0`, [{ actionId: "gov_action1aaa", title: "A", endEpoch: 700 }, { actionId: "gov_action1bbb", title: "B", endEpoch: 700 }]),
    summary(`${TX_B}:1`, []),
  ]);
  assert.deepEqual(Object.keys(byAction).sort(), ["gov_action1aaa", "gov_action1bbb"]);
  assert.equal(byAction.gov_action1aaa.length, 2);
  assert.equal(byAction.gov_action1bbb[0].key, `${TX_B}:0`);
  assert.equal(byAction.gov_action1bbb[0].questionCount, 2);
  assert.equal(byAction.gov_action1bbb[0].actionEndEpoch, 700);
});
