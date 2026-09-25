"use strict";

/**
 * /api/v1: compact, cacheable read endpoints.
 *
 * Every page used to download the whole snapshot (15 to 31 MB of JSON) and
 * aggregate it in the browser. These endpoints serve what a page renders:
 *
 *   GET /api/v1/meta                     snapshot and sync status
 *   GET /api/v1/actions                  one model row per governance action
 *   GET /api/v1/actions/:id              one action with its votes and metadata
 *   GET /api/v1/actors/:type             drep | spo | committee, packed votes
 *   GET /api/v1/actors/:type/:id         one actor with full votes
 *   GET /api/v1/rationales/index         action names + votes that carry a rationale
 *   GET /api/v1/stats                    the packed bundle the Stats page needs
 *
 * All accept ?snapshot=<epoch-NNN.json> for the historical view.
 *
 * The module receives a context object from server.js (snapshot access,
 * committee normalisation, sync state) so it has no module-level state of its
 * own and can be unit tested.
 */

const model = require("./governanceModel");

const ACTOR_TYPES = new Set(["drep", "spo", "committee"]);

function toFinite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function roundOrNull(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const k = 10 ** digits;
  return Math.round(n * k) / k;
}

/** Small per-action index used by the packed actor payloads. */
function buildProposalIndex(proposalInfo) {
  const entries = Object.entries(proposalInfo || {});
  entries.sort((a, b) => Number(b[1]?.submittedAtUnix || 0) - Number(a[1]?.submittedAtUnix || 0));
  const rows = entries.map(([id, info]) => ({
    id,
    name: info?.actionName || id,
    type: info?.governanceType || "Unknown",
    outcome: info?.outcome || "Unknown",
    status: model.deriveStatus(info),
    submittedEpoch: toFinite(info?.submittedEpoch),
    submittedAtUnix: toFinite(info?.submittedAtUnix) || 0,
    expirationEpoch: toFinite(info?.expirationEpoch),
    ratifiedEpoch: toFinite(info?.ratifiedEpoch),
    enactedEpoch: toFinite(info?.enactedEpoch),
    droppedEpoch: toFinite(info?.droppedEpoch),
    expiredEpoch: toFinite(info?.expiredEpoch),
    votes: {
      drep: Number(info?.voteStats?.drep?.total || 0),
      spo: Number(info?.voteStats?.stake_pool?.total || 0),
      cc: Number(info?.voteStats?.constitutional_committee?.total || 0)
    },
    withdrawalAmountAda: model.withdrawalAmountAda(info)
  }));
  const indexById = new Map(rows.map((row, i) => [row.id, i]));
  return { rows, indexById };
}

/** Actor row without its vote list. */
function actorHead(row, type) {
  const base = {
    id: row.id,
    name: row.name || "",
    status: row.status || "",
    votingPowerAda: Number(row.votingPowerAda || 0),
    consistency: roundOrNull(row.consistency),
    transparencyScore: row.transparencyScore ?? null,
    totalEligibleVotes: Number(row.totalEligibleVotes || 0),
    firstVoteBlockTime: Number.isFinite(Number(row.firstVoteBlockTime)) && Number(row.firstVoteBlockTime) < Number.MAX_SAFE_INTEGER ? Number(row.firstVoteBlockTime) : null,
    voteCount: Array.isArray(row.votes) ? row.votes.length : 0
  };
  if (type === "drep") {
    return {
      ...base,
      active: row.active ?? null,
      retired: row.retired ?? null,
      expired: row.expired ?? null,
      activeEpoch: row.activeEpoch ?? null,
      lastActiveEpoch: row.lastActiveEpoch ?? null,
      hasScript: row.hasScript ?? null,
      profile: {
        name: row.profile?.name || "",
        // A data: URI image (some profiles embed hundreds of KB) is left to
        // the detail endpoint; the list only says one exists.
        imageUrl: String(row.profile?.imageUrl || "").startsWith("data:") ? "" : (row.profile?.imageUrl || ""),
        hasEmbeddedImage: String(row.profile?.imageUrl || "").startsWith("data:"),
        bio: String(row.profile?.bio || "").slice(0, 280)
      }
    };
  }
  if (type === "spo") {
    return {
      ...base,
      homepage: row.homepage || "",
      delegatedDrepLiteralRaw: row.delegatedDrepLiteralRaw || "",
      delegatedDrepLiteral: row.delegatedDrepLiteral || "",
      delegationStatus: row.delegationStatus || "Unknown"
    };
  }
  return {
    ...base,
    hotCredential: row.hotCredential || null,
    coldCredential: row.coldCredential || null,
    hotHex: row.hotHex || null,
    coldHex: row.coldHex || null,
    seatStartEpoch: row.seatStartEpoch ?? null,
    expirationEpoch: row.expirationEpoch ?? null,
    koiosVoterId: row.koiosVoterId || ""
  };
}

// Timestamps are sent as minutes since the Conway era start and response
// times as tenths of an hour: small integers compress several times better
// than unix seconds and floats, and the precision is more than the UI shows.
const PACK_TIME_BASE_UNIX = 1725000000; // 2024-08-30, shortly before Conway
function packTime(unix) {
  const t = Number(unix || 0);
  return t > 0 ? Math.max(0, Math.round((t - PACK_TIME_BASE_UNIX) / 60)) : 0;
}
function unpackTime(minutes) {
  const m = Number(minutes || 0);
  return m > 0 ? PACK_TIME_BASE_UNIX + m * 60 : 0;
}

/**
 * Packed votes, columnar: { p: proposalIndex[], c: voteCode[], r: hasRationale[]
 * (1|0|-1), t: votedAt minutes since PACK_TIME_BASE_UNIX (0 = unknown),
 * q: rationale quality ×10 (committee only, -1 = none) }.
 * Response time is (votedAt - proposal.submittedAtUnix), derived client-side
 * from the proposal index, so it is not sent.
 */
function packVotes(votes, indexById, type) {
  const p = []; const c = []; const r = []; const t = []; const q = [];
  for (const vote of Array.isArray(votes) ? votes : []) {
    const idx = indexById.get(String(vote?.proposalId || ""));
    if (idx === undefined) continue;
    p.push(idx);
    c.push(model.voteCode(vote?.vote));
    r.push(vote?.hasRationale === true ? 1 : vote?.hasRationale === false ? 0 : -1);
    t.push(packTime(vote?.votedAtUnix));
    if (type === "committee") {
      const qs = Number(vote?.rationaleQualityScore);
      q.push(Number.isFinite(qs) ? Math.round(qs * 10) : -1);
    }
  }
  const out = { p, c, r, t };
  if (type === "committee") out.q = q;
  return out;
}

/** Full vote row for detail payloads. */
function fullVote(vote, proposalInfo) {
  const info = proposalInfo?.[vote?.proposalId] || null;
  return {
    proposalId: vote?.proposalId || "",
    vote: vote?.vote || "",
    outcome: info?.outcome || vote?.outcome || "",
    voteTxHash: String(vote?.voteTxHash || "").toLowerCase(),
    hasRationale: vote?.hasRationale ?? null,
    rationaleUrl: vote?.rationaleUrl || "",
    rationaleBodyLength: Number(vote?.rationaleBodyLength || 0),
    rationaleSectionCount: Number(vote?.rationaleSectionCount || 0),
    rationaleQualityScore: roundOrNull(vote?.rationaleQualityScore, 1),
    rationaleScoringSignals: vote?.rationaleScoringSignals || null,
    responseHours: roundOrNull(vote?.responseHours),
    votedAtUnix: Number(vote?.votedAtUnix || 0) || null,
    votedAt: vote?.votedAt || (vote?.votedAtUnix ? new Date(Number(vote.votedAtUnix) * 1000).toISOString() : null),
    voteHistory: Array.isArray(vote?.voteHistory) && vote.voteHistory.length > 0
      ? vote.voteHistory.map((h) => ({ vote: h?.vote || "", voteTxHash: String(h?.voteTxHash || "").toLowerCase(), votedAtUnix: Number(h?.votedAtUnix || 0) || null }))
      : undefined
  };
}

function createApiV1(ctx) {
  const {
    getSnapshot,
    readSnapshotFromHistory,
    normalizeCommitteeMembersForApi,
    getSyncState,
    getSpecialDrepsFallback,
    schemaVersion,
    configuredNetwork,
    provider
  } = ctx;

  // Model rows and packed payloads are memoised per snapshot identity so a
  // burst of page loads after a publish costs one computation.
  const memo = new Map();
  function memoFor(source, key, compute) {
    const id = `${source?.generatedAt || ""}|${source?.latestEpoch || ""}|${Object.keys(source?.proposalInfo || {}).length}|${key}`;
    if (memo.has(id)) return memo.get(id);
    const value = compute();
    if (memo.size > 24) memo.delete(memo.keys().next().value);
    memo.set(id, value);
    return value;
  }

  function resolveSource(url) {
    const requestedSnapshot = String(url.searchParams.get("snapshot") || "").trim();
    const historical = requestedSnapshot ? readSnapshotFromHistory(requestedSnapshot) : null;
    const source = historical || getSnapshot();
    return { source, historical: Boolean(historical), snapshotKey: requestedSnapshot || "" };
  }

  function committeeRows(source) {
    return memoFor(source, "committee", () =>
      normalizeCommitteeMembersForApi(source?.committeeMembers || [], source?.latestEpoch, source?.proposalInfo));
  }

  function meta(source, extra) {
    const sync = getSyncState();
    const hasSpecial = source?.specialDreps && Object.keys(source.specialDreps).length > 0;
    return {
      schemaVersion: source?.schemaVersion || schemaVersion,
      apiVersion: 1,
      provider,
      network: source?.network || configuredNetwork,
      generatedAt: source?.generatedAt || null,
      latestEpoch: source?.latestEpoch || null,
      drepParticipationStartEpoch: source?.drepParticipationStartEpoch || null,
      thresholdContext: source?.thresholdContext || {},
      specialDreps: hasSpecial ? source.specialDreps : (getSpecialDrepsFallback() || {}),
      counts: {
        actions: Object.keys(source?.proposalInfo || {}).length,
        dreps: Array.isArray(source?.dreps) ? source.dreps.length : 0,
        spos: Array.isArray(source?.spos) ? source.spos.length : 0,
        committee: Array.isArray(source?.committeeMembers) ? source.committeeMembers.length : 0
      },
      sync: {
        syncing: Boolean(sync?.syncing),
        lastStartedAt: sync?.lastStartedAt || null,
        lastCompletedAt: sync?.lastCompletedAt || null,
        lastError: sync?.lastError || null,
        lastSyncMode: sync?.lastSyncMode || null
      },
      syncMeta: source?.syncMeta || null,
      ...extra
    };
  }

  function actionModels(source) {
    return memoFor(source, "actions", () => {
      const scoped = { ...source, committeeMembers: committeeRows(source) };
      return model.computeActionModels(scoped);
    });
  }

  function packedActors(source, type) {
    return memoFor(source, `actors:${type}`, () => {
      const { rows: proposals, indexById } = buildProposalIndex(source?.proposalInfo || {});
      const list = type === "drep" ? source?.dreps : type === "spo" ? source?.spos : committeeRows(source);
      const actors = (Array.isArray(list) ? list : []).map((row) => ({
        ...actorHead(row, type),
        v: packVotes(row.votes, indexById, type)
      }));
      return { proposals, actors };
    });
  }

  function findActor(source, type, id) {
    const target = String(id || "").trim().toLowerCase();
    const list = type === "drep" ? source?.dreps : type === "spo" ? source?.spos : committeeRows(source);
    const rows = Array.isArray(list) ? list : [];
    const byId = rows.find((row) => String(row?.id || "").trim().toLowerCase() === target);
    if (byId || type !== "committee") return byId || null;
    // Committee members are also addressed by their hot or cold credential.
    return rows.find((row) => [row?.hotCredential, row?.coldCredential, row?.hotHex, row?.coldHex, row?.koiosVoterId]
      .some((v) => String(v || "").trim().toLowerCase() === target)) || null;
  }

  // Returns { status, body, cache } or null when the path is not a v1 route.
  function handle(url) {
    const pathname = url.pathname;
    if (!pathname.startsWith("/api/v1/")) return null;
    const { source, historical, snapshotKey } = resolveSource(url);
    const extra = { snapshotKey, historical };
    const parts = pathname.slice("/api/v1/".length).split("/").filter(Boolean).map((p) => decodeURIComponent(p));
    const cache = historical ? "public, max-age=3600" : "public, max-age=30";

    if (parts.length === 1 && parts[0] === "meta") {
      return { status: 200, body: meta(source, extra), cache };
    }

    if (parts[0] === "actions" && parts.length === 1) {
      const actions = actionModels(source);
      return { status: 200, body: { meta: meta(source, extra), actions }, cache };
    }

    if (parts[0] === "actions" && parts.length === 2) {
      const id = parts[1];
      const info = source?.proposalInfo?.[id];
      if (!info) return { status: 404, body: { error: "Action not found in this snapshot." }, cache: "no-store" };
      const row = actionModels(source).find((r) => r.proposalId === id) || null;
      const proposalInfo = source.proposalInfo;
      const votes = [];
      const collect = (list, role) => {
        for (const actor of Array.isArray(list) ? list : []) {
          for (const vote of actor.votes || []) {
            if (vote?.proposalId !== id) continue;
            votes.push({
              voterId: actor.id,
              voterName: actor.name || "",
              role,
              votingPowerAda: Number(actor.votingPowerAda || 0),
              actorStatus: actor.status || "",
              ...fullVote(vote, proposalInfo)
            });
          }
        }
      };
      collect(source.dreps, "drep");
      collect(source.spos, "stake_pool");
      collect(committeeRows(source), "constitutional_committee");
      votes.sort((a, b) => Number(b.votedAtUnix || 0) - Number(a.votedAtUnix || 0));
      const committee = committeeRows(source).map((m) => ({
        id: m.id, name: m.name || "", status: m.status || "", seatStartEpoch: m.seatStartEpoch ?? null, expirationEpoch: m.expirationEpoch ?? null
      }));
      const action = {
        proposalId: id,
        actionName: info.actionName || id,
        rationale: info.rationale || "",
        metadataJson: info.metadataJson || null,
        metadataUrl: info.metadataUrl || null,
        metadataHash: info.metadataHash || null,
        governanceType: info.governanceType || "Unknown",
        governanceDescription: info.governanceDescription || null,
        outcome: info.outcome || "Unknown",
        status: model.deriveStatus(info),
        submittedAt: info.submittedAt || null,
        submittedAtUnix: Number(info.submittedAtUnix || 0),
        submittedEpoch: info.submittedEpoch ?? null,
        txHash: info.txHash || null,
        certIndex: info.certIndex ?? null,
        depositAda: Number(info.depositAda || 0),
        returnAddress: info.returnAddress || "",
        expirationEpoch: info.expirationEpoch ?? null,
        ratifiedEpoch: info.ratifiedEpoch ?? null,
        enactedEpoch: info.enactedEpoch ?? null,
        droppedEpoch: info.droppedEpoch ?? null,
        expiredEpoch: info.expiredEpoch ?? null,
        thresholdInfo: info.thresholdInfo || null,
        voteStats: info.voteStats || null,
        koiosVotingSummary: info.koiosVotingSummary || null,
        nomosModel: info.nomosModel || null
      };
      return { status: 200, body: { meta: meta(source, extra), action, model: row, votes, committee }, cache };
    }

    if (parts[0] === "actors" && parts.length === 2 && ACTOR_TYPES.has(parts[1])) {
      const type = parts[1];
      const { proposals, actors } = packedActors(source, type);
      return {
        status: 200,
        body: {
          meta: meta(source, extra),
          type,
          voteCodes: model.VOTE_LABEL_BY_CODE,
          packing: {
            layout: "columnar",
            fields: { p: "proposalIndex", c: "voteCode", r: "hasRationale (1|0|-1)", t: `minutes since ${PACK_TIME_BASE_UNIX} (0 = unknown)`, ...(type === "committee" ? { q: "rationaleQualityScore × 10 (-1 = none)" } : {}) },
            timeBaseUnix: PACK_TIME_BASE_UNIX
          },
          proposals,
          actors
        },
        cache
      };
    }

    if (parts[0] === "actors" && parts.length === 3 && ACTOR_TYPES.has(parts[1])) {
      const type = parts[1];
      const actor = findActor(source, type, parts[2]);
      if (!actor) return { status: 404, body: { error: "Actor not found in this snapshot." }, cache: "no-store" };
      const proposalInfo = source?.proposalInfo || {};
      const proposals = {};
      const { rows } = buildProposalIndex(proposalInfo);
      const rowById = new Map(rows.map((r) => [r.id, r]));
      const votes = (actor.votes || []).map((vote) => {
        const p = rowById.get(vote?.proposalId);
        if (p) proposals[p.id] = p;
        return fullVote(vote, proposalInfo);
      });
      const { votes: _omit, ...rest } = actor;
      return {
        status: 200,
        body: {
          meta: meta(source, extra),
          type,
          actor: { ...rest, votes },
          proposals,
          actionCount: rows.length
        },
        cache
      };
    }

    if (parts[0] === "rationales" && parts[1] === "index" && parts.length === 2) {
      // Columnar: votes reference the actors and actions tables by index and
      // the rationale URL table by index. Transaction hashes are not sent
      // (fetch the actor detail for one vote's hash).
      const actions = [];
      const actionIndex = new Map();
      for (const [proposalId, info] of Object.entries(source?.proposalInfo || {})) {
        actionIndex.set(proposalId, actions.length);
        actions.push({
          id: proposalId,
          actionName: info?.actionName || proposalId,
          governanceType: info?.governanceType || "",
          submittedAt: info?.submittedAt || null,
          txHash: info?.txHash || "",
          certIndex: info?.certIndex ?? null
        });
      }
      const actors = [];
      const urls = [];
      const urlIndex = new Map();
      const votes = { a: [], x: [], c: [], t: [], u: [] };
      const collect = (list, role) => {
        for (const actor of Array.isArray(list) ? list : []) {
          let actorIdx = -1;
          for (const vote of actor.votes || []) {
            if (!vote?.rationaleUrl && vote?.hasRationale !== true) continue;
            const x = actionIndex.get(vote.proposalId);
            if (x === undefined) continue;
            if (actorIdx < 0) {
              actorIdx = actors.length;
              actors.push({ id: actor.id, name: actor.name || "", role, hotCredential: actor.hotCredential || undefined, koiosVoterId: actor.koiosVoterId || undefined });
            }
            const url = String(vote.rationaleUrl || "");
            let u = -1;
            if (url) {
              if (!urlIndex.has(url)) { urlIndex.set(url, urls.length); urls.push(url); }
              u = urlIndex.get(url);
            }
            votes.a.push(actorIdx);
            votes.x.push(x);
            votes.c.push(model.voteCode(vote.vote));
            votes.t.push(packTime(vote.votedAtUnix));
            votes.u.push(u);
          }
        }
      };
      collect(source?.dreps, "drep");
      collect(source?.spos, "stake_pool");
      collect(committeeRows(source), "constitutional_committee");
      return {
        status: 200,
        body: {
          meta: meta(source, extra),
          voteCodes: model.VOTE_LABEL_BY_CODE,
          packing: { layout: "columnar", fields: { a: "actorIndex", x: "actionIndex", c: "voteCode", t: `minutes since ${PACK_TIME_BASE_UNIX}`, u: "urlIndex (-1 = none)" }, timeBaseUnix: PACK_TIME_BASE_UNIX },
          actions,
          actors,
          urls,
          votes
        },
        cache
      };
    }

    if (parts.length === 1 && parts[0] === "stats") {
      const dreps = packedActors(source, "drep");
      const spos = packedActors(source, "spo");
      const committee = packedActors(source, "committee");
      return {
        status: 200,
        body: {
          meta: meta(source, extra),
          voteCodes: model.VOTE_LABEL_BY_CODE,
          packing: { layout: "columnar", timeBaseUnix: PACK_TIME_BASE_UNIX },
          proposals: dreps.proposals,
          actions: actionModels(source),
          dreps: dreps.actors,
          spos: spos.actors,
          committee: committee.actors
        },
        cache
      };
    }

    return { status: 404, body: { error: "Unknown /api/v1 route." }, cache: "no-store" };
  }

  return { handle, actionModels, packedActors, buildProposalIndex };
}

module.exports = { createApiV1, buildProposalIndex, packVotes, packTime, unpackTime, PACK_TIME_BASE_UNIX, actorHead, fullVote };
