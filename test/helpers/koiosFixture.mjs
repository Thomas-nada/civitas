// Builds an in-memory Koios API from a Civitas snapshot (normally the
// committed seed) and installs a fake global fetch that serves it. Every
// request is recorded so tests can assert on request counts and on the
// absence of Blockfrost traffic. No network access is needed.

const SHELLEY_EPOCH_208_START_UNIX = 1596059091;
const CARDANO_EPOCH_SECONDS = 432000;

const TYPE_TO_KOIOS = {
  "treasury withdrawals": "TreasuryWithdrawals",
  "info action": "InfoAction",
  "parameter change": "ParameterChange",
  "hard fork initiation": "HardForkInitiation",
  "new committee": "NewCommittee",
  "new constitution": "NewConstitution",
  "no confidence": "NoConfidence"
};

const ROLE_TO_KOIOS = {
  drep: "DRep",
  stake_pool: "SPO",
  constitutional_committee: "ConstitutionalCommittee"
};

function epochStartUnix(epoch) {
  return SHELLEY_EPOCH_208_START_UNIX + (Number(epoch) - 208) * CARDANO_EPOCH_SECONDS;
}

function lovelace(ada) {
  return String(Math.round(Number(ada || 0) * 1_000_000));
}

// Minimal PostgREST filter support: col=eq.x, col=gt.x, col=gte.x, col=lt.x,
// order=a.asc,b.desc, limit, offset. Unknown params are ignored.
function applyQuery(rows, params) {
  let out = rows.slice();
  for (const [key, raw] of params.entries()) {
    if (["order", "limit", "offset", "select"].includes(key)) continue;
    if (key.startsWith("_")) continue; // RPC params handled by the endpoint
    const m = /^(eq|gt|gte|lt|lte|neq)\.(.*)$/.exec(raw);
    if (!m) continue;
    const [, op, valRaw] = m;
    out = out.filter((row) => {
      const v = row[key];
      const val = typeof v === "number" ? Number(valRaw) : String(valRaw);
      if (op === "eq") return v === val || String(v) === String(val);
      if (op === "neq") return v !== val;
      if (op === "gt") return Number(v) > Number(val);
      if (op === "gte") return Number(v) >= Number(val);
      if (op === "lt") return Number(v) < Number(val);
      if (op === "lte") return Number(v) <= Number(val);
      return true;
    });
  }
  const order = params.get("order");
  if (order) {
    const keys = order.split(",").map((part) => {
      const [col, dir] = part.split(".");
      return { col, desc: dir === "desc" };
    });
    out.sort((a, b) => {
      for (const { col, desc } of keys) {
        const av = a[col]; const bv = b[col];
        if (av === bv) continue;
        const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
        if (cmp !== 0) return desc ? -cmp : cmp;
      }
      return 0;
    });
  }
  const offset = Number(params.get("offset") || 0);
  const limit = Number(params.get("limit") || 1000);
  return out.slice(offset, offset + limit);
}

export function buildKoiosFixture(seed, overrides = {}) {
  const latestEpoch = Number(seed.latestEpoch);
  const nowUnix = Math.floor(Date.now() / 1000);

  const proposalList = Object.entries(seed.proposalInfo).map(([id, info]) => ({
    block_time: Number(info.submittedAtUnix || 0),
    proposal_id: id,
    proposal_tx_hash: info.txHash,
    proposal_index: Number(info.certIndex ?? 0),
    proposal_type: TYPE_TO_KOIOS[String(info.governanceType || "").toLowerCase()] || "InfoAction",
    proposal_description: info.governanceDescription || null,
    deposit: lovelace(info.depositAda),
    return_address: info.returnAddress || "",
    proposed_epoch: info.submittedEpoch ?? null,
    ratified_epoch: info.ratifiedEpoch ?? null,
    enacted_epoch: info.enactedEpoch ?? null,
    dropped_epoch: info.droppedEpoch ?? null,
    expired_epoch: info.expiredEpoch ?? null,
    expiration: info.expirationEpoch ?? null,
    meta_url: info.metadataUrl || null,
    meta_hash: info.metadataHash || null,
    meta_json: info.metadataJson || null,
    meta_comment: null,
    meta_language: null,
    meta_is_valid: null,
    withdrawal: null,
    param_proposal: null
  }));
  const proposalTypeById = new Map(proposalList.map((p) => [p.proposal_id, p.proposal_type]));

  const drepById = new Map(seed.dreps.map((d) => [d.id, d]));
  const voteList = [];
  const pushVote = (voterRole, voterId, vote, proposalId) => {
    const t = Number(vote.votedAtUnix || 0);
    voteList.push({
      vote_tx_hash: String(vote.voteTxHash || "").toLowerCase(),
      voter_role: ROLE_TO_KOIOS[voterRole] || voterRole,
      voter_id: voterId,
      proposal_id: proposalId,
      proposal_tx_hash: seed.proposalInfo[proposalId]?.txHash || "",
      proposal_index: Number(seed.proposalInfo[proposalId]?.certIndex ?? 0),
      proposal_type: proposalTypeById.get(proposalId) || "InfoAction",
      epoch_no: t > 0 ? 208 + Math.floor((t - SHELLEY_EPOCH_208_START_UNIX) / CARDANO_EPOCH_SECONDS) : null,
      block_height: 0,
      block_time: t,
      vote: String(vote.vote || ""),
      meta_url: vote.rationaleUrl || null,
      meta_hash: vote.rationaleUrl ? "00".repeat(32) : null,
      meta_json: null
    });
  };
  for (const drep of seed.dreps) {
    for (const v of drep.votes || []) {
      if (!v.voteTxHash) continue;
      pushVote("drep", drep.id, v, v.proposalId);
      for (const h of v.voteHistory || []) if (h.voteTxHash) pushVote("drep", drep.id, { ...h, proposalId: v.proposalId }, v.proposalId);
    }
  }
  for (const spo of seed.spos) {
    for (const v of spo.votes || []) {
      if (!v.voteTxHash) continue;
      pushVote("stake_pool", spo.id, v, v.proposalId);
      for (const h of v.voteHistory || []) if (h.voteTxHash) pushVote("stake_pool", spo.id, { ...h, proposalId: v.proposalId }, v.proposalId);
    }
  }
  for (const cc of seed.committeeMembers) {
    const voterId = cc.koiosVoterId || cc.hotCredential || cc.id;
    for (const v of cc.votes || []) {
      if (!v.voteTxHash) continue;
      pushVote("constitutional_committee", voterId, v, v.proposalId);
      for (const h of v.voteHistory || []) if (h.voteTxHash) pushVote("constitutional_committee", voterId, { ...h, proposalId: v.proposalId }, v.proposalId);
    }
  }
  // Dedupe (a tx can appear both as active vote and in another row's history).
  const seenVotes = new Set();
  const dedupedVotes = voteList.filter((v) => {
    const key = `${v.vote_tx_hash}|${v.voter_id}|${v.proposal_id}`;
    if (seenVotes.has(key)) return false;
    seenVotes.add(key);
    return true;
  });

  const drepList = seed.dreps.map((d) => ({
    drep_id: d.id,
    hex: "",
    has_script: Boolean(d.hasScript),
    drep_status: d.retired ? "retired" : "registered"
  }));
  const drepHistory = seed.dreps
    .filter((d) => Number(d.votingPowerAda || 0) > 0)
    .map((d) => ({ drep_id: d.id, epoch_no: latestEpoch, amount: lovelace(d.votingPowerAda) }));
  for (const key of ["alwaysAbstain", "alwaysNoConfidence"]) {
    const sd = seed.specialDreps?.[key];
    if (sd?.id && !drepById.has(sd.id)) drepHistory.push({ drep_id: sd.id, epoch_no: latestEpoch, amount: lovelace(sd.votingPowerAda) });
  }
  const drepUpdates = seed.dreps
    .filter((d) => Number(d.activeEpoch || 0) > 0)
    .map((d) => ({ drep_id: d.id, hex: "", has_script: Boolean(d.hasScript), update_tx_hash: "", cert_index: 0, block_time: epochStartUnix(d.activeEpoch), action: "registered", deposit: "500000000", meta_url: null, meta_hash: null, meta_json: null }));

  const drepInfoFor = (ids) => ids.map((id) => {
    const d = drepById.get(id);
    if (!d) return null;
    return {
      drep_id: id,
      hex: "",
      has_script: Boolean(d.hasScript),
      drep_status: d.retired ? "retired" : "registered",
      deposit: "500000000",
      active: d.retired ? false : !d.expired,
      expires_epoch_no: Number(d.lastActiveEpoch || 0) > 0 ? Number(d.lastActiveEpoch) + 20 : null,
      amount: lovelace(d.votingPowerAda),
      meta_url: d.profile?.name || d.name ? `https://meta.invalid/drep/${id}.json` : null,
      meta_hash: d.profile?.name || d.name ? `${id.slice(-8)}`.padEnd(64, "0") : null,
      live_delegator_count: 0
    };
  }).filter(Boolean);

  const drepMetadataFor = (ids) => ids.map((id) => {
    const d = drepById.get(id);
    if (!d || !(d.profile?.name || d.name)) return null;
    const p = d.profile || {};
    return {
      drep_id: id,
      hex: "",
      has_script: Boolean(d.hasScript),
      meta_url: `https://meta.invalid/drep/${id}.json`,
      meta_hash: `${id.slice(-8)}`.padEnd(64, "0"),
      meta_json: {
        "@context": {},
        hashAlgorithm: "blake2b-256",
        body: {
          givenName: p.name || d.name,
          bio: p.bio || "",
          motivations: p.motivations || "",
          objectives: p.objectives || "",
          qualifications: p.qualifications || "",
          email: p.email || "",
          image: p.imageUrl ? { "@type": "ImageObject", contentUrl: p.imageUrl } : undefined,
          references: Array.isArray(p.references) ? p.references : []
        }
      },
      bytes: null,
      warning: null,
      language: "en-us",
      comment: null,
      is_valid: true
    };
  }).filter(Boolean);

  const spoById = new Map(seed.spos.map((s) => [s.id, s]));
  const poolList = seed.spos.map((s) => ({
    pool_id_bech32: s.id,
    pool_id_hex: "",
    active_epoch_no: null,
    margin: null,
    fixed_cost: null,
    pledge: null,
    deposit: null,
    reward_addr: `stake1${s.id.slice(-20)}`,
    owners: null,
    relays: [],
    ticker: s.name || null,
    pool_group: null,
    meta_url: s.homepage || null,
    meta_hash: null,
    pool_status: "registered",
    active_stake: lovelace(s.votingPowerAda),
    retiring_epoch: null
  }));
  const poolInfoFor = (ids) => ids.map((id) => {
    const s = spoById.get(id);
    if (!s) return null;
    return {
      pool_id_bech32: id,
      pool_id_hex: "",
      reward_addr: `stake1${id.slice(-20)}`,
      reward_addr_delegated_drep: s.delegatedDrepLiteralRaw || null,
      meta_url: s.homepage || null,
      meta_hash: null,
      meta_json: { name: s.name || "", ticker: s.name || "", homepage: s.homepage || "" },
      pool_status: "registered",
      active_stake: lovelace(s.votingPowerAda),
      live_stake: lovelace(s.votingPowerAda),
      live_delegators: 0,
      voting_power: lovelace(s.votingPowerAda)
    };
  }).filter(Boolean);

  const committeeInfo = [{
    proposal_id: null,
    proposal_tx_hash: null,
    proposal_index: null,
    quorum_numerator: 2,
    quorum_denominator: 3,
    members: seed.committeeMembers
      .filter((m) => m.hotCredential && m.hotHex)
      .map((m) => ({
        status: "authorized",
        cc_cold_id: m.coldCredential || null,
        cc_cold_hex: m.coldHex || null,
        cc_cold_has_script: false,
        cc_hot_id: m.hotCredential,
        cc_hot_hex: m.hotHex,
        cc_hot_has_script: false,
        expiration_epoch: m.expirationEpoch ?? latestEpoch + 10
      }))
  }];

  const epochParams = [{
    epoch_no: latestEpoch,
    era: "Conway",
    dvt_motion_no_confidence: (seed.thresholdContext?.drep?.motionNoConfidence ?? 67) / 100,
    dvt_committee_normal: (seed.thresholdContext?.drep?.committeeNormal ?? 67) / 100,
    dvt_committee_no_confidence: (seed.thresholdContext?.drep?.committeeNoConfidence ?? 60) / 100,
    dvt_update_to_constitution: (seed.thresholdContext?.drep?.updateToConstitution ?? 75) / 100,
    dvt_hard_fork_initiation: (seed.thresholdContext?.drep?.hardForkInitiation ?? 60) / 100,
    dvt_p_p_network_group: (seed.thresholdContext?.drep?.networkGroup ?? 67) / 100,
    dvt_p_p_economic_group: (seed.thresholdContext?.drep?.economicGroup ?? 67) / 100,
    dvt_p_p_technical_group: (seed.thresholdContext?.drep?.technicalGroup ?? 67) / 100,
    dvt_p_p_gov_group: (seed.thresholdContext?.drep?.govGroup ?? 75) / 100,
    dvt_treasury_withdrawal: (seed.thresholdContext?.drep?.treasuryWithdrawal ?? 67) / 100,
    pvt_motion_no_confidence: (seed.thresholdContext?.pool?.motionNoConfidence ?? 51) / 100,
    pvt_committee_normal: (seed.thresholdContext?.pool?.committeeNormal ?? 51) / 100,
    pvt_committee_no_confidence: (seed.thresholdContext?.pool?.committeeNoConfidence ?? 51) / 100,
    pvt_hard_fork_initiation: (seed.thresholdContext?.pool?.hardForkInitiation ?? 51) / 100,
    pvtpp_security_group: (seed.thresholdContext?.pool?.securityGroup ?? 51) / 100,
    committee_min_size: seed.thresholdContext?.committeeMinSize ?? 7,
    gov_action_lifetime: 6,
    drep_activity: 20
  }];

  const state = {
    latestEpoch,
    nowUnix,
    proposalList,
    voteList: dedupedVotes,
    drepList,
    drepHistory,
    drepUpdates,
    poolList,
    committeeInfo,
    epochParams,
    drepInfoFor,
    drepMetadataFor,
    poolInfoFor,
    votingSummaries: new Map(),
    ...overrides
  };

  const requests = [];
  function record(url, method, status) {
    requests.push({ url, method, status, host: new URL(url).host });
  }
  function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  }

  async function fakeFetch(input, init = {}) {
    const url = typeof input === "string" ? input : input.url;
    const method = String(init.method || "GET").toUpperCase();
    const u = new URL(url);
    if (!u.host.includes("koios")) {
      record(url, method, 404);
      return new Response("", { status: 404 });
    }
    const p = u.pathname.replace(/^\/api\/v1/, "");
    const q = u.searchParams;
    let body = null;
    const parseBody = () => { try { return JSON.parse(init.body || "{}"); } catch { return {}; } };
    switch (true) {
      case p === "/tip":
        body = [{ hash: "", era: "Conway", epoch_no: state.latestEpoch, abs_slot: 0, epoch_slot: 0, block_no: 0, block_time: state.nowUnix }];
        break;
      case p === "/epoch_params":
        body = state.epochParams;
        break;
      case p === "/proposal_list":
        body = applyQuery(state.proposalList, q);
        break;
      case p === "/vote_list":
        body = applyQuery(state.voteList, q);
        break;
      case p === "/proposal_voting_summary": {
        const id = q.get("_proposal_id");
        body = state.votingSummaries.has(id) ? [state.votingSummaries.get(id)] : [];
        break;
      }
      case p === "/drep_list":
        body = applyQuery(state.drepList, q);
        break;
      case p === "/drep_history": {
        const rows = state.drepHistory.map((r) => ({ ...r }));
        body = applyQuery(rows, q);
        break;
      }
      case p === "/drep_updates":
        body = applyQuery(state.drepUpdates, q);
        break;
      case p === "/drep_delegators":
        body = [];
        break;
      case p === "/pool_list":
        body = applyQuery(state.poolList, q);
        break;
      case p === "/committee_info":
        body = state.committeeInfo;
        break;
      case p === "/drep_info" && method === "POST":
        body = state.drepInfoFor(parseBody()._drep_ids || []);
        break;
      case p === "/drep_metadata" && method === "POST":
        body = state.drepMetadataFor(parseBody()._drep_ids || []);
        break;
      case p === "/pool_info" && method === "POST":
        body = state.poolInfoFor(parseBody()._pool_bech32_ids || []);
        break;
      case p === "/account_info" && method === "POST":
        body = [];
        break;
      case p === "/script_info" && method === "POST":
        body = [];
        break;
      default:
        record(url, method, 404);
        return jsonResponse({ error: "not found" }, 404);
    }
    record(url, method, 200);
    return jsonResponse(body);
  }

  return { state, requests, fakeFetch };
}

export function installFakeFetch(fixture) {
  const original = globalThis.fetch;
  globalThis.fetch = fixture.fakeFetch;
  return () => { globalThis.fetch = original; };
}

export function countRequests(fixture, predicate = () => true) {
  return fixture.requests.filter(predicate).length;
}
