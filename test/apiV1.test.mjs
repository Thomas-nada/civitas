// /api/v1 contract and payload-size test, run against the committed seed.
// Run: node --test test/apiV1.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const seedPath = path.join(repoRoot, "snapshot.seed.json");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "civitas-api-test-"));
process.env.CIVITAS_NO_LISTEN = "1";
process.env.SKIP_BOOT_HYDRATION = "true";
process.env.AUTO_START_SCHEDULER = "false";
process.env.BLOCKFROST_API_KEY = "";
process.env.SNAPSHOT_PATH = path.join(tmp, "snapshot.json");
process.env.SNAPSHOT_SEED_PATH = seedPath;
process.env.SNAPSHOT_HISTORY_DIR = path.join(tmp, "history");
process.env.VOTE_TX_TIME_CACHE_PATH = path.join(tmp, "votetimes.json");
process.env.VOTE_TX_RATIONALE_CACHE_PATH = path.join(tmp, "rationales.json");
process.env.SPO_PROFILE_CACHE_PATH = path.join(tmp, "spo.json");
process.env.DREP_META_CACHE_PATH = path.join(tmp, "drepmeta.json");
process.env.NCL_SNAPSHOT_PATH = path.join(tmp, "ncl.json");
process.env.BUG_REPORTS_PATH = path.join(tmp, "bugs.ndjson");

// No network: the committee roster refresh must fail fast. Loopback calls
// from this test still go to the real fetch.
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input.url;
  if (url.startsWith("http://127.0.0.1")) return realFetch(input, init);
  return new Response("", { status: 404 });
};

const { __test: server } = require("../server.js");
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
server.hydrateFromSeed();

const gzSize = (obj) => zlib.gzipSync(Buffer.from(JSON.stringify(obj))).length;
const kb = (n) => `${Math.round(n / 1024)} KB`;

function call(pathname) {
  const out = server.apiV1.handle(new URL(`http://localhost${pathname}`));
  assert.ok(out, `route ${pathname}`);
  return out;
}

test("meta", () => {
  const { status, body } = call("/api/v1/meta");
  assert.equal(status, 200);
  assert.equal(body.latestEpoch, seed.latestEpoch);
  assert.equal(body.counts.actions, Object.keys(seed.proposalInfo).length);
  assert.equal(body.counts.dreps, seed.dreps.length);
  assert.equal(body.provider, "koios");
  assert.ok(gzSize(body) < 4 * 1024);
});

test("actions list: one model row per action, small payload", () => {
  const { status, body } = call("/api/v1/actions");
  assert.equal(status, 200);
  assert.equal(body.actions.length, Object.keys(seed.proposalInfo).length);
  const row = body.actions.find((r) => r.status === "Active") || body.actions[0];
  for (const key of ["proposalId", "actionName", "governanceType", "status", "submittedEpoch", "expirationEpoch",
    "voteStats", "totalVotes", "drepYesPowerPct", "drepNoPowerPct", "spoYesPct", "drepRequiredPct", "passingNow", "ccEligibleCount", "isExpiringSoon"]) {
    assert.ok(key in row, `row has ${key}`);
  }
  // Power breakdown adds up to something sensible.
  const yesPlusNo = body.actions.filter((r) => r.drepYesPowerPct !== null && r.drepNoPowerPct !== null);
  assert.ok(yesPlusNo.length > 50);
  for (const r of yesPlusNo.slice(0, 20)) assert.ok(r.drepYesPowerPct >= 0 && r.drepYesPowerPct <= 100.5, `${r.proposalId} yes pct ${r.drepYesPowerPct}`);
  const size = gzSize(body);
  console.log(`actions: ${kb(JSON.stringify(body).length)} raw, ${kb(size)} gzipped`);
  assert.ok(size < 150 * 1024, `actions payload ${kb(size)} should be under 150 KB gzipped`);
});

test("action detail: votes for one action", () => {
  const pending = Object.entries(seed.proposalInfo).find(([, info]) => info.outcome === "Pending");
  const [id] = pending;
  const { status, body } = call(`/api/v1/actions/${id}`);
  assert.equal(status, 200);
  assert.equal(body.action.proposalId, id);
  assert.ok(body.model && body.model.proposalId === id);
  const expected = seed.dreps.filter((d) => d.votes.some((v) => v.proposalId === id)).length
    + seed.spos.filter((d) => d.votes.some((v) => v.proposalId === id)).length
    + seed.committeeMembers.filter((d) => d.votes.some((v) => v.proposalId === id)).length;
  assert.equal(body.votes.length, expected);
  assert.ok(body.votes.every((v) => v.voterId && v.role && v.vote));
  assert.ok(body.votes[0].votedAtUnix >= body.votes[body.votes.length - 1].votedAtUnix, "newest first");
  console.log(`action detail (${body.votes.length} votes): ${kb(gzSize(body))} gzipped`);
  assert.equal(call("/api/v1/actions/gov_action1doesnotexist").status, 404);
});

test("actors: packed votes keep every vote and field the dashboards score on", () => {
  for (const [type, list] of [["drep", seed.dreps], ["spo", seed.spos], ["committee", seed.committeeMembers]]) {
    const { status, body } = call(`/api/v1/actors/${type}`);
    assert.equal(status, 200);
    assert.equal(body.actors.length, list.length, `${type} count`);
    assert.equal(body.proposals.length, Object.keys(seed.proposalInfo).length);
    const totalVotes = list.reduce((s, a) => s + a.votes.length, 0);
    const packedVotes = body.actors.reduce((s, a) => s + a.v.p.length, 0);
    assert.equal(packedVotes, totalVotes, `${type} packed votes`);
    // Spot-check one voter round-trips.
    const sample = list.find((a) => a.votes.length > 3);
    const packed = body.actors.find((a) => a.id === sample.id);
    const base = body.packing.timeBaseUnix;
    for (const [i, v] of sample.votes.entries()) {
      assert.equal(body.proposals[packed.v.p[i]].id, v.proposalId);
      assert.equal(body.voteCodes[packed.v.c[i]], v.vote === "Yes" ? "Yes" : v.vote === "No" ? "No" : v.vote === "Abstain" ? "Abstain" : body.voteCodes[packed.v.c[i]]);
      assert.equal(packed.v.r[i], v.hasRationale === true ? 1 : v.hasRationale === false ? 0 : -1);
      const ts = packed.v.t[i] > 0 ? base + packed.v.t[i] * 60 : 0;
      assert.ok(Math.abs(ts - (v.votedAtUnix || 0)) <= 30, `${type} votedAt within 30 s`);
    }
    const size = gzSize(body);
    console.log(`actors/${type}: ${kb(JSON.stringify(body).length)} raw, ${kb(size)} gzipped`);
    assert.ok(size < 450 * 1024, `${type} payload ${kb(size)} should be under 450 KB gzipped`);
  }
});

test("actor detail", () => {
  const drep = seed.dreps.find((d) => d.votes.length > 10 && d.name);
  const { status, body } = call(`/api/v1/actors/drep/${drep.id}`);
  assert.equal(status, 200);
  assert.equal(body.actor.id, drep.id);
  assert.equal(body.actor.name, drep.name);
  assert.equal(body.actor.votes.length, drep.votes.length);
  assert.ok(body.actor.votes.every((v) => body.proposals[v.proposalId]));
  assert.ok(gzSize(body) < 60 * 1024);
  assert.equal(call("/api/v1/actors/drep/drep1nope").status, 404);
  assert.equal(call("/api/v1/actors/nope/x").status, 404);
});

test("rationales index and stats bundle", () => {
  const idx = call("/api/v1/rationales/index");
  assert.equal(idx.status, 200);
  assert.equal(idx.body.actions.length, Object.keys(seed.proposalInfo).length);
  const expectedRationales = [...seed.dreps, ...seed.spos, ...seed.committeeMembers]
    .reduce((s, a) => s + a.votes.filter((v) => v.rationaleUrl || v.hasRationale === true).length, 0);
  assert.equal(idx.body.votes.a.length, expectedRationales);
  assert.ok(idx.body.urls.length > 1000);
  assert.ok(idx.body.actors.every((a) => a.id && a.role));
  assert.ok(gzSize(idx.body) < 400 * 1024, `rationales index ${kb(gzSize(idx.body))}`);
  console.log(`rationales index: ${kb(gzSize(idx.body))} gzipped`);
  const stats = call("/api/v1/stats");
  assert.equal(stats.status, 200);
  const s = stats.body.stats;
  assert.equal(s.counts.proposals, Object.keys(seed.proposalInfo).length);
  assert.equal(s.counts.dreps, seed.dreps.filter((d) => !/always_/.test(d.id)).length);
  assert.ok(s.byType.length > 0 && s.byEpoch.length > 0 && s.ccAttendance.length > 0 && s.timeline.length > 0);
  assert.ok(s.drepAttendance.reduce((a, b) => a + b.value, 0) === s.counts.dreps);
  assert.ok(s.power.drepNakamoto > 0);
  const size = gzSize(stats.body);
  console.log(`stats: ${kb(size)} gzipped`);
  assert.ok(size < 40 * 1024, `stats ${kb(size)}`);
  const search = call("/api/v1/search/dreps?q=" + encodeURIComponent(seed.dreps.find((d) => d.name)?.name.slice(0, 4) || "drep"));
  assert.equal(search.status, 200);
  assert.ok(search.body.results.length > 0);
});

test("calendar: events per epoch with boundary vote positions", () => {
  const ref = seed.latestEpoch;
  const { status, body } = call(`/api/v1/calendar?from=${ref - 6}&to=${ref + 6}`);
  assert.equal(status, 200);
  assert.equal(body.referenceEpoch, ref);
  const epochs = Object.keys(body.epochs).map(Number);
  assert.ok(epochs.length > 0);
  assert.ok(epochs.every((e) => e >= ref - 6 && e <= ref + 6));
  const events = Object.values(body.epochs).flat();
  assert.ok(events.every((e) => e.type && e.row?.proposalId && e.row?.actionName));
  assert.ok(events.some((e) => e.type === "voting" || e.type === "submitted"));
  const size = gzSize(body);
  console.log(`calendar (13 epochs): ${kb(size)} gzipped`);
  assert.ok(size < 60 * 1024, `calendar ${kb(size)}`);
  // A second call is served from the per-epoch memo and is identical.
  assert.deepEqual(call(`/api/v1/calendar?from=${ref - 6}&to=${ref + 6}`).body.epochs, body.epochs);
});

test("HTTP: gzip, ETag and 304", async () => {
  const http = server.httpServer;
  await new Promise((resolve) => http.listen(0, "127.0.0.1", resolve));
  const port = http.address().port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/v1/actions`, { headers: { "accept-encoding": "gzip" } });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-encoding"), "gzip");
    assert.ok(res.headers.get("etag"));
    assert.match(res.headers.get("cache-control"), /max-age/);
    const body = await res.json();
    assert.equal(body.actions.length, Object.keys(seed.proposalInfo).length);
    const again = await fetch(`http://127.0.0.1:${port}/api/v1/actions`, { headers: { "if-none-match": res.headers.get("etag") } });
    assert.equal(again.status, 304);
    // Legacy route is compressed and revalidatable too.
    const legacy = await fetch(`http://127.0.0.1:${port}/api/accountability?view=actions`, { headers: { "accept-encoding": "gzip" } });
    assert.equal(legacy.status, 200);
    assert.equal(legacy.headers.get("content-encoding"), "gzip");
    assert.ok(legacy.headers.get("etag"));
  } finally {
    await new Promise((resolve) => http.close(resolve));
  }
});
