// Offline regression test for the Koios-first indexer.
//
// A Koios API is simulated from the committed seed snapshot; the full sync
// must rebuild an equivalent snapshot (same proposals, actors, votes,
// outcomes, power, names) with zero Blockfrost requests and a bounded number
// of Koios requests. A delta sync must then pick up a new vote and a new
// proposal with a handful of requests.
//
// Run: CIVITAS_NO_LISTEN=1 node --test test/sync.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { buildKoiosFixture, installFakeFetch, countRequests } from "./helpers/koiosFixture.mjs";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const seedPath = path.join(repoRoot, "snapshot.seed.json");

// Isolate every runtime file the server writes (caches, snapshot, history).
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "civitas-sync-test-"));
process.env.CIVITAS_NO_LISTEN = "1";
process.env.SKIP_BOOT_HYDRATION = "true";
process.env.AUTO_START_SCHEDULER = "false";
process.env.BLOCKFROST_API_KEY = ""; // must never be needed
process.env.KOIOS_REQUEST_DELAY_MS = "0";
process.env.SNAPSHOT_PATH = path.join(tmp, "snapshot.json");
process.env.SNAPSHOT_SEED_PATH = seedPath;
process.env.SNAPSHOT_HISTORY_DIR = path.join(tmp, "history");
process.env.VOTE_TX_TIME_CACHE_PATH = path.join(tmp, "votetimes.json");
process.env.VOTE_TX_RATIONALE_CACHE_PATH = path.join(tmp, "rationales.json");
process.env.SPO_PROFILE_CACHE_PATH = path.join(tmp, "spo.json");
process.env.DREP_META_CACHE_PATH = path.join(tmp, "drepmeta.json");
process.env.NCL_SNAPSHOT_PATH = path.join(tmp, "ncl.json");
process.env.BUG_REPORTS_PATH = path.join(tmp, "bugs.ndjson");
// cgov/IPFS enrichment is external; the fake fetch answers 404 for them.
process.env.CC_RATIONALE_USE_CGOV_FALLBACK = "false";
process.env.DREP_RATIONALE_USE_CGOV_FALLBACK = "false";
process.env.SPO_RATIONALE_USE_CGOV_FALLBACK = "false";

const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const fixture = buildKoiosFixture(seed);
installFakeFetch(fixture);
const { __test: server } = require("../server.js");

// Collects mismatches so one run reports every category at once.
function makeChecker() {
  const problems = [];
  const eq = (a, b, label) => { if (a !== b) problems.push(`${label}: got ${JSON.stringify(a)} expected ${JSON.stringify(b)}`); };
  const deepEq = (a, b, label) => { if (JSON.stringify(a) !== JSON.stringify(b)) problems.push(`${label}: got ${JSON.stringify(a)?.slice(0, 200)} expected ${JSON.stringify(b)?.slice(0, 200)}`); };
  const ok = (cond, label) => { if (!cond) problems.push(label); };
  const done = () => {
    if (problems.length === 0) return;
    const byCategory = new Map();
    for (const p of problems) { const cat = p.split(":")[0].split(" ").slice(-1)[0]; byCategory.set(cat, (byCategory.get(cat) || 0) + 1); }
    const summary = [...byCategory.entries()].map(([k, v]) => `${k}=${v}`).join(", ");
    throw new Error(`${problems.length} mismatches (${summary})\n` + problems.slice(0, 40).join("\n"));
  };
  return { eq, deepEq, ok, done };
}

function votesOf(actors) {
  const out = new Map();
  for (const a of actors) for (const v of a.votes || []) out.set(`${a.id}|${v.proposalId}`, v);
  return out;
}

let full = null;

test("full sync rebuilds the seed from Koios with zero Blockfrost requests", async () => {
  fixture.requests.length = 0;
  const started = Date.now();
  full = await server.buildFullSnapshot();
  const elapsedMs = Date.now() - started;

  const blockfrost = countRequests(fixture, (r) => r.host.endsWith("blockfrost.io"));
  const koios = countRequests(fixture, (r) => r.host.includes("koios"));
  const byHost = {};
  for (const r of fixture.requests) byHost[r.host] = (byHost[r.host] || 0) + 1;
  console.log(`full sync: ${koios} Koios requests, ${blockfrost} Blockfrost API requests, ${elapsedMs} ms`, byHost);
  assert.equal(blockfrost, 0, "the sync must not call Blockfrost");
  // proposals 1 + votes ~47 + drep_list 2 + drep_history 2 + drep_updates ~2 +
  // drep_info/metadata ~34 + pool_list 3 + pool_info ~38 + committee 1 + tip 1 +
  // params 1 + voting summaries 158 (KOIOS_VOTING_SUMMARY_SCOPE=all)
  assert.ok(koios < 450, `expected fewer than 450 Koios requests, got ${koios}`);

  assert.ok(server.snapshotIsComplete(full), "snapshot must be complete");
  assert.equal(full.latestEpoch, seed.latestEpoch);
  assert.equal(full.syncMeta?.provider, "koios");
  assert.ok(full.syncMeta.voteWatermarkBlockTime > 0);

  // Expected tallies: each voter's active vote counted once.
  const expectedVoteStats = new Map();
  const bucket = () => ({ yes: 0, no: 0, abstain: 0, noConfidence: 0, other: 0, total: 0 });
  const add = (b, value) => {
    const v = String(value || "").toLowerCase();
    if (v === "yes") b.yes += 1; else if (v === "no") b.no += 1; else if (v === "abstain") b.abstain += 1;
    else if (v.includes("no_confidence")) b.noConfidence += 1; else b.other += 1;
    b.total += 1;
  };
  for (const id of Object.keys(seed.proposalInfo)) {
    expectedVoteStats.set(id, { drep: bucket(), constitutional_committee: bucket(), stake_pool: bucket(), other: bucket() });
  }
  for (const [role, actors] of [["drep", seed.dreps], ["constitutional_committee", seed.committeeMembers], ["stake_pool", seed.spos]]) {
    for (const a of actors) for (const v of a.votes || []) {
      const e = expectedVoteStats.get(v.proposalId);
      if (e) add(e[role], v.vote);
    }
  }

  const check = makeChecker();
  // Proposals: same set, same lifecycle.
  check.deepEq(Object.keys(full.proposalInfo).sort(), Object.keys(seed.proposalInfo).sort());
  for (const [id, info] of Object.entries(seed.proposalInfo)) {
    const got = full.proposalInfo[id];
    check.eq(got.outcome, info.outcome, `${id} outcome`);
    check.eq(got.governanceType, info.governanceType, `${id} type`);
    check.eq(got.submittedEpoch, info.submittedEpoch, `${id} submittedEpoch`);
    check.eq(got.txHash, info.txHash, `${id} txHash`);
    check.eq(got.certIndex, info.certIndex, `${id} certIndex`);
    check.eq(got.expirationEpoch, info.expirationEpoch, `${id} expiration`);
    check.eq(got.enactedEpoch, info.enactedEpoch, `${id} enacted`);
    check.eq(got.depositAda, info.depositAda, `${id} deposit`);
    check.eq(got.actionName, info.actionName, `${id} name`);
    check.deepEq(got.thresholdInfo, info.thresholdInfo, `${id} thresholdInfo`);
    check.deepEq(got.voteStats, expectedVoteStats.get(id), `${id} voteStats`);
  }
  check.deepEq(full.thresholdContext, seed.thresholdContext);
  check.deepEq(full.specialDreps, seed.specialDreps);

  // DReps: same set, same votes, same power, same status, same names.
  const seedDreps = new Map(seed.dreps.map((d) => [d.id, d]));
  const fullDreps = new Map(full.dreps.map((d) => [d.id, d]));
  check.deepEq([...fullDreps.keys()].sort(), [...seedDreps.keys()].sort());
  let nameMatches = 0; let named = 0;
  for (const [id, d] of seedDreps) {
    const g = fullDreps.get(id);
    check.eq(g.votes.length, d.votes.length, `${id} vote count`);
    check.eq(g.votingPowerAda, d.votingPowerAda, `${id} power`);
    // "unknown" in the seed means the old sync never looked the DRep up.
    if (d.status !== "unknown") check.eq(g.status, d.status, `${id} status`);
    if (d.name) { named += 1; if (g.name === d.name) nameMatches += 1; }
    if (d.activeEpoch) check.eq(g.activeEpoch, d.activeEpoch, `${id} activeEpoch`);
  }
  check.ok(nameMatches / Math.max(1, named) > 0.98, `DRep names: ${nameMatches}/${named}`);

  // Every vote: choice, outcome, timestamp, response time, rationale flag.
  const seedVotes = votesOf([...seed.dreps, ...seed.spos, ...seed.committeeMembers]);
  const fullVotes = votesOf([...full.dreps, ...full.spos, ...full.committeeMembers]);
  check.eq(fullVotes.size, seedVotes.size, "total active votes");
  let checked = 0;
  for (const [key, v] of seedVotes) {
    const g = fullVotes.get(key);
    check.ok(g, `missing vote ${key}`);
    check.eq(g.vote, v.vote, `${key} vote`);
    // The old delta never refreshed a vote's outcome once its proposal
    // resolved (10k votes in the seed still say Pending); the correct value
    // is the proposal's current outcome.
    check.eq(g.outcome, seed.proposalInfo[v.proposalId]?.outcome, `${key} outcome`);
    check.eq(g.voteTxHash, v.voteTxHash, `${key} tx`);
    check.eq(g.votedAtUnix, v.votedAtUnix, `${key} votedAt`);
    if (v.responseHours !== null && v.responseHours !== undefined) {
      check.ok(Math.abs(g.responseHours - v.responseHours) < 1e-6, `${key} responseHours`);
    }
    if (v.rationaleUrl) {
      check.eq(g.hasRationale, true, `${key} hasRationale`);
      check.eq(g.rationaleUrl, v.rationaleUrl, `${key} rationaleUrl`);
    }
    checked += 1;
  }
  check.ok(checked > 30000, `checked ${checked} votes`);

  // SPOs: roster, delegation labels and power.
  const seedSpos = new Map(seed.spos.map((s) => [s.id, s]));
  const fullSpos = new Map(full.spos.map((s) => [s.id, s]));
  check.deepEq([...fullSpos.keys()].sort(), [...seedSpos.keys()].sort());
  for (const [id, s] of seedSpos) {
    const g = fullSpos.get(id);
    check.eq(g.delegationStatus, s.delegationStatus, `${id} delegationStatus`);
    check.eq(g.name, s.name, `${id} name`);
    check.ok(Math.abs(Number(g.votingPowerAda) - Number(s.votingPowerAda)) < 0.01, `${id} power`);
  }

  // Committee: same members, names and credentials.
  const seedCc = new Map(seed.committeeMembers.map((m) => [m.id, m]));
  const fullCc = new Map(full.committeeMembers.map((m) => [m.id, m]));
  check.deepEq([...fullCc.keys()].sort(), [...seedCc.keys()].sort());
  let ccNamed = 0;
  for (const [id, m] of seedCc) {
    const g = fullCc.get(id);
    check.eq(g.votes.length, m.votes.length, `cc ${id} votes`);
    if (m.name && g.name === m.name) ccNamed += 1;
    if (m.hotCredential) check.eq(g.hotCredential, m.hotCredential, `cc ${id} hot`);
  }
  check.ok(ccNamed >= seed.committeeMembers.filter((m) => m.name).length - 2, `cc names ${ccNamed}`);
  check.done();
});

test("delta sync picks up a new vote and a new proposal with a handful of requests", async () => {
  assert.ok(full, "full sync result required");
  const base = full;
  const watermark = server.computeVoteWatermark(base);
  const pending = Object.entries(base.proposalInfo).find(([, info]) => info.outcome === "Pending");
  assert.ok(pending, "need a pending proposal in the seed");
  const [pendingId] = pending;
  const drep = base.dreps.find((d) => d.votes.length > 5 && !d.votes.some((v) => v.proposalId === pendingId));
  assert.ok(drep, "need a DRep without a vote on the pending proposal");

  // A brand new vote after the watermark, plus a re-vote by another DRep.
  const newTx = "ab".repeat(32);
  fixture.state.voteList.push({
    vote_tx_hash: newTx, voter_role: "DRep", voter_id: drep.id, proposal_id: pendingId,
    proposal_tx_hash: base.proposalInfo[pendingId].txHash, proposal_index: 0, proposal_type: "InfoAction",
    epoch_no: base.latestEpoch, block_height: 1, block_time: watermark + 600, vote: "No",
    meta_url: "https://example.invalid/rationale.jsonld", meta_hash: "11".repeat(32), meta_json: null
  });
  const revoter = base.dreps.find((d) => d.votes.some((v) => v.proposalId === pendingId && v.vote === "Yes"));
  assert.ok(revoter, "need a DRep that voted Yes on the pending proposal");
  const reTx = "cd".repeat(32);
  fixture.state.voteList.push({
    vote_tx_hash: reTx, voter_role: "DRep", voter_id: revoter.id, proposal_id: pendingId,
    proposal_tx_hash: base.proposalInfo[pendingId].txHash, proposal_index: 0, proposal_type: "InfoAction",
    epoch_no: base.latestEpoch, block_height: 2, block_time: watermark + 900, vote: "Abstain",
    meta_url: null, meta_hash: null, meta_json: null
  });
  // A brand new proposal with one vote.
  const newProposalId = "gov_action1newproposal000000000000000000000000000000000000000000000000000";
  fixture.state.proposalList.push({
    block_time: watermark + 100, proposal_id: newProposalId, proposal_tx_hash: "ef".repeat(32), proposal_index: 0,
    proposal_type: "InfoAction", proposal_description: { tag: "InfoAction" }, deposit: "100000000000",
    return_address: "stake1test", proposed_epoch: base.latestEpoch, ratified_epoch: null, enacted_epoch: null,
    dropped_epoch: null, expired_epoch: null, expiration: base.latestEpoch + 6,
    meta_url: "https://example.invalid/new.jsonld", meta_hash: "22".repeat(32),
    meta_json: { body: { title: "Brand new info action", abstract: "Test", rationale: "Because." } }
  });
  fixture.state.voteList.push({
    vote_tx_hash: "12".repeat(32), voter_role: "SPO", voter_id: base.spos[0].id, proposal_id: newProposalId,
    proposal_tx_hash: "ef".repeat(32), proposal_index: 0, proposal_type: "InfoAction",
    epoch_no: base.latestEpoch, block_height: 3, block_time: watermark + 1200, vote: "Yes",
    meta_url: null, meta_hash: null, meta_json: null
  });

  // A pending proposal resolves (enacted) between syncs.
  const resolving = Object.entries(base.proposalInfo).find(([id, info]) => info.outcome === "Pending" && id !== pendingId);
  assert.ok(resolving, "need a second pending proposal");
  const [resolvingId] = resolving;
  const resolvingRow = fixture.state.proposalList.find((p) => p.proposal_id === resolvingId);
  resolvingRow.ratified_epoch = base.latestEpoch;
  resolvingRow.enacted_epoch = base.latestEpoch;
  const resolvingVoter = base.dreps.find((d) => d.votes.some((v) => v.proposalId === resolvingId && v.vote === "Yes"));
  assert.ok(resolvingVoter, "need a Yes voter on the resolving proposal");

  fixture.requests.length = 0;
  const delta = await server.buildDeltaSnapshot(base);
  const koios = countRequests(fixture, (r) => r.host.includes("koios"));
  const blockfrost = countRequests(fixture, (r) => r.host.endsWith("blockfrost.io"));
  console.log(`delta sync: ${koios} Koios requests, ${blockfrost} Blockfrost requests`);
  assert.equal(blockfrost, 0);
  // tip 1, proposal_list 1, vote_list 1, new proposal votes 1, its summary 1,
  // pending summary 1, drep_info 1 + drep_metadata 1 for the two voters,
  // hourly power/status refresh (drep_history 2 + drep_info ~10) when due.
  assert.ok(koios <= 25, `expected at most 25 Koios requests, got ${koios}`);

  const got = delta.dreps.find((d) => d.id === drep.id);
  const newVote = got.votes.find((v) => v.proposalId === pendingId);
  assert.ok(newVote, "new vote merged");
  assert.equal(newVote.vote, "No");
  assert.equal(newVote.voteTxHash, newTx);
  assert.equal(newVote.votedAtUnix, watermark + 600);
  assert.equal(newVote.hasRationale, true);
  assert.equal(newVote.rationaleUrl, "https://example.invalid/rationale.jsonld");

  const re = delta.dreps.find((d) => d.id === revoter.id).votes.find((v) => v.proposalId === pendingId);
  assert.equal(re.vote, "Abstain", "re-vote replaces the active vote");
  assert.equal(re.voteTxHash, reTx);
  assert.ok(Array.isArray(re.voteHistory) && re.voteHistory.some((h) => h.vote === "Yes"), "previous vote kept in history");

  assert.ok(delta.proposalInfo[newProposalId], "new proposal indexed");
  assert.equal(delta.proposalInfo[newProposalId].actionName, "Brand new info action");
  assert.equal(delta.proposalInfo[newProposalId].outcome, "Pending");
  assert.equal(delta.proposalInfo[newProposalId].voteStats.stake_pool.yes, 1);
  assert.equal(delta.proposalInfo[pendingId].voteStats.drep.no, base.proposalInfo[pendingId].voteStats.drep.no + 1);
  assert.equal(delta.syncMeta.voteWatermarkBlockTime, watermark + 1200);

  assert.equal(delta.proposalInfo[resolvingId].outcome, "Yes", "resolved proposal outcome");
  const resolvedVote = delta.dreps.find((d) => d.id === resolvingVoter.id).votes.find((v) => v.proposalId === resolvingId);
  assert.equal(resolvedVote.outcome, "Yes", "vote outcome follows the proposal");
  const beforeConsistency = resolvingVoter.consistency;
  const afterConsistency = delta.dreps.find((d) => d.id === resolvingVoter.id).consistency;
  assert.notEqual(afterConsistency, undefined);
  assert.ok(afterConsistency >= 0 && afterConsistency <= 100);
  console.log(`consistency for ${resolvingVoter.id}: ${beforeConsistency} -> ${afterConsistency}`);
  assert.equal(delta.proposalCount, base.proposalCount + 1);

  // Nothing else moved.
  const untouched = base.dreps.find((d) => d.id !== drep.id && d.id !== revoter.id && d.votes.length > 0);
  const untouchedAfter = delta.dreps.find((d) => d.id === untouched.id);
  assert.deepEqual(untouchedAfter.votes, untouched.votes);

  // Running the delta again with nothing new is idempotent and cheap.
  fixture.requests.length = 0;
  const again = await server.buildDeltaSnapshot(delta);
  const koiosAgain = countRequests(fixture, (r) => r.host.includes("koios"));
  console.log(`idle delta: ${koiosAgain} Koios requests`);
  assert.ok(koiosAgain <= 6, `idle delta should be ~3 requests, got ${koiosAgain}`);
  assert.equal(again.syncMeta.voteWatermarkBlockTime, delta.syncMeta.voteWatermarkBlockTime);
  assert.equal(votesOf(again.dreps).size, votesOf(delta.dreps).size);
});
