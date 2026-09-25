"use strict";

/**
 * Governance data source backed by Koios.
 *
 * Every method returns objects shaped like the Blockfrost responses the
 * snapshot builder was written against, so the derivation code (outcomes,
 * thresholds, scores, committee reconciliation) does not have to change while
 * the acquisition layer moves from thousands of per-item Blockfrost requests
 * to a handful of bulk Koios reads.
 *
 * Request budget for a full mainnet sync (epoch ~657):
 *   proposal_list 1 · vote_list ~47 · drep_list 2 · drep_history 2 ·
 *   drep_info ~34 · drep_metadata ~34 · drep_updates ~5 · pool_list 3 ·
 *   pool_info ~38 · committee_info 1 · tip 1 · epoch_params 1  ≈ 170 calls.
 * A delta is tip + proposal_list + vote_list(since watermark) ≈ 3 to 5 calls.
 *
 * The module is dependency-injected (koiosGet / koiosPost) so it can be unit
 * tested against recorded fixtures without network access.
 */

const SHELLEY_EPOCH_208_START_UNIX = 1596059091;
const CARDANO_EPOCH_SECONDS = 432000;

function epochFromUnix(unix) {
  const t = Number(unix);
  if (!Number.isFinite(t) || t <= 0) return null;
  return 208 + Math.floor((t - SHELLEY_EPOCH_208_START_UNIX) / CARDANO_EPOCH_SECONDS);
}

const PROPOSAL_TYPE_TO_BLOCKFROST = {
  parameterchange: "parameter_change",
  hardforkinitiation: "hard_fork_initiation",
  treasurywithdrawals: "treasury_withdrawals",
  noconfidence: "no_confidence",
  newcommittee: "new_committee",
  newconstitution: "new_constitution",
  infoaction: "info_action"
};

function toBlockfrostGovernanceType(proposalType) {
  const raw = String(proposalType || "").trim();
  if (!raw) return "unknown";
  const key = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (PROPOSAL_TYPE_TO_BLOCKFROST[key]) return PROPOSAL_TYPE_TO_BLOCKFROST[key];
  // CamelCase → snake_case fallback for any type added later.
  return raw.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

function toBlockfrostVoterRole(voterRole) {
  const raw = String(voterRole || "").toLowerCase();
  if (raw.includes("committee") || raw.includes("constitutional")) return "constitutional_committee";
  if (raw.includes("drep")) return "drep";
  if (raw === "spo" || raw.includes("pool")) return "spo";
  return raw;
}

function nullableEpoch(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseMaybeJson(value) {
  if (value && typeof value === "object") return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function createKoiosGovernanceSource(options = {}) {
  const koiosGet = options.koiosGet;
  const koiosPost = options.koiosPost;
  const log = typeof options.log === "function" ? options.log : () => {};
  const PAGE = Math.max(1, Math.min(1000, Number(options.pageSize) || 1000));
  const DEFAULT_MAX_ROWS = Number(options.maxRows) || 500000;
  if (typeof koiosGet !== "function" || typeof koiosPost !== "function") {
    throw new Error("createKoiosGovernanceSource requires koiosGet and koiosPost");
  }

  // Offset-paginated GET. `pathWithQuery` must not already contain limit/offset.
  async function pageAll(pathWithQuery, { maxRows = DEFAULT_MAX_ROWS, onPage } = {}) {
    const out = [];
    let offset = 0;
    const sep = pathWithQuery.includes("?") ? "&" : "?";
    while (offset < maxRows) {
      const rows = await koiosGet(`${pathWithQuery}${sep}limit=${PAGE}&offset=${offset}`);
      if (!Array.isArray(rows) || rows.length === 0) break;
      out.push(...rows);
      if (typeof onPage === "function") onPage(rows, offset);
      if (rows.length < PAGE) break;
      offset += rows.length;
    }
    return out;
  }

  // Bulk POST with adaptive batch size (Koios answers 413 when the body is
  // over the tier's payload limit; halve and retry).
  async function postBatched(path, bodyKey, ids, { batchSize = 50, minBatch = 5 } = {}) {
    const clean = Array.from(new Set((Array.isArray(ids) ? ids : []).map((v) => String(v || "").trim()).filter(Boolean)));
    const out = [];
    let size = Math.max(minBatch, batchSize);
    for (let i = 0; i < clean.length;) {
      const chunk = clean.slice(i, i + size);
      let rows;
      try {
        rows = await koiosPost(path, { [bodyKey]: chunk });
      } catch (error) {
        const message = String(error?.message || "");
        if (message.includes("413") && size > minBatch) {
          size = Math.max(minBatch, Math.floor(size / 2));
          log(`[koios] ${path}: payload too large, batch size -> ${size}`);
          continue;
        }
        throw error;
      }
      if (Array.isArray(rows)) out.push(...rows);
      i += chunk.length;
    }
    return out;
  }

  // ── Chain ────────────────────────────────────────────────────────────────

  async function getTip() {
    const rows = await koiosGet("/tip");
    const row = Array.isArray(rows) ? rows[0] : rows;
    const epoch = Number(row?.epoch_no || 0);
    return {
      epoch: Number.isFinite(epoch) && epoch > 0 ? epoch : null,
      blockTime: Number(row?.block_time || 0) || null,
      blockNo: Number(row?.block_no || 0) || null,
      absSlot: Number(row?.abs_slot || 0) || null
    };
  }

  // Protocol parameters. Koios and Blockfrost share the db-sync column names
  // (dvt_*, pvt_*, committee_min_size, drep_activity …).
  async function getEpochParams(epoch) {
    const query = Number.isFinite(Number(epoch)) && Number(epoch) > 0 ? `/epoch_params?_epoch_no=${Number(epoch)}` : "/epoch_params?limit=1";
    const rows = await koiosGet(query);
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row || typeof row !== "object") return null;
    return { ...row, pvt_p_p_security_group: row.pvt_p_p_security_group ?? row.pvtpp_security_group ?? null };
  }

  // ── Proposals ────────────────────────────────────────────────────────────

  function mapProposalRow(row) {
    const id = String(row?.proposal_id || "").trim();
    const txHash = String(row?.proposal_tx_hash || "").trim().toLowerCase();
    const certIndex = Number(row?.proposal_index);
    const blockTime = Number(row?.block_time || 0) || 0;
    const detail = {
      tx_hash: txHash,
      cert_index: Number.isFinite(certIndex) ? certIndex : 0,
      governance_type: toBlockfrostGovernanceType(row?.proposal_type),
      governance_description: parseMaybeJson(row?.proposal_description),
      deposit: row?.deposit === null || row?.deposit === undefined ? null : String(row.deposit),
      return_address: String(row?.return_address || ""),
      expiration: nullableEpoch(row?.expiration),
      ratified_epoch: nullableEpoch(row?.ratified_epoch),
      enacted_epoch: nullableEpoch(row?.enacted_epoch),
      dropped_epoch: nullableEpoch(row?.dropped_epoch),
      expired_epoch: nullableEpoch(row?.expired_epoch),
      block_epoch: nullableEpoch(row?.proposed_epoch) ?? epochFromUnix(blockTime),
      previous_gov_action_id: row?.previous_gov_action_proposal_id || null,
      withdrawal: Array.isArray(row?.withdrawal) ? row.withdrawal : null,
      param_proposal: parseMaybeJson(row?.param_proposal)
    };
    const metaUrl = String(row?.meta_url || "").trim();
    const metaHash = String(row?.meta_hash || "").trim().toLowerCase();
    const metadata = {
      tx_hash: txHash,
      cert_index: detail.cert_index,
      url: metaUrl,
      hash: metaHash,
      json_metadata: parseMaybeJson(row?.meta_json),
      bytes: null,
      koios_meta_is_valid: row?.meta_is_valid ?? null,
      koios_meta_comment: row?.meta_comment ?? null
    };
    return {
      id,
      tx_hash: txHash,
      cert_index: detail.cert_index,
      governance_type: detail.governance_type,
      detail,
      metadata,
      blockTime,
      blockEpoch: detail.block_epoch,
      raw: row
    };
  }

  // Every governance action ever submitted, newest first (like Blockfrost).
  async function listProposals() {
    const rows = await pageAll("/proposal_list?order=block_time.desc");
    return rows.map(mapProposalRow).filter((p) => p.id);
  }

  // ── Votes ────────────────────────────────────────────────────────────────

  function mapVoteRow(row) {
    const txHash = String(row?.vote_tx_hash || "").trim().toLowerCase();
    const metaUrl = String(row?.meta_url || "").trim();
    const metaHash = String(row?.meta_hash || "").trim().toLowerCase();
    return {
      tx_hash: txHash,
      cert_index: null,
      voter_role: toBlockfrostVoterRole(row?.voter_role),
      voter: String(row?.voter_id || "").trim(),
      vote: String(row?.vote || "").trim().toLowerCase(),
      proposal_id: String(row?.proposal_id || "").trim(),
      block_time: Number(row?.block_time || 0) || 0,
      block_height: Number(row?.block_height || 0) || 0,
      epoch_no: nullableEpoch(row?.epoch_no),
      meta_url: metaUrl,
      meta_hash: metaHash,
      meta_json: parseMaybeJson(row?.meta_json),
      // Aliases the existing helpers look at (getVoteRationaleUrl, hasVoteRationale).
      anchor_url: metaUrl,
      anchor_hash: metaHash
    };
  }

  /**
   * Votes in ascending chain order. `sinceBlockTime` (unix seconds, exclusive)
   * turns this into an incremental read; `proposalId` narrows to one action.
   * The `onPage` callback lets a caller persist a watermark as pages land.
   */
  async function listVotes({ sinceBlockTime = 0, proposalId = "", maxRows } = {}) {
    const filters = ["order=block_time.asc,vote_tx_hash.asc"];
    if (Number.isFinite(Number(sinceBlockTime)) && Number(sinceBlockTime) > 0) {
      filters.push(`block_time=gt.${Math.floor(Number(sinceBlockTime))}`);
    }
    if (proposalId) filters.push(`proposal_id=eq.${encodeURIComponent(proposalId)}`);
    const rows = await pageAll(`/vote_list?${filters.join("&")}`, { maxRows });
    return rows.map(mapVoteRow).filter((v) => v.tx_hash && v.voter && v.proposal_id);
  }

  async function getProposalVotingSummary(proposalId) {
    const id = String(proposalId || "").trim();
    if (!id) return null;
    const rows = await koiosGet(`/proposal_voting_summary?_proposal_id=${encodeURIComponent(id)}`);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row && typeof row === "object" ? { ...row, proposal_id: id } : null;
  }

  // ── DReps ────────────────────────────────────────────────────────────────

  async function listDrepIds() {
    const rows = await pageAll("/drep_list");
    const ids = new Set();
    for (const row of rows) {
      const id = String(row?.drep_id || "").trim();
      if (id) ids.add(id);
    }
    return ids;
  }

  // Voting power per DRep for an epoch (includes drep_always_abstain and
  // drep_always_no_confidence). Values in ADA.
  async function getDrepPowerForEpoch(epoch) {
    const out = new Map();
    const e = Number(epoch);
    if (!Number.isFinite(e) || e <= 0) return out;
    const rows = await pageAll(`/drep_history?epoch_no=eq.${e}`, { maxRows: 50000 });
    for (const row of rows) {
      const id = String(row?.drep_id || "").trim();
      if (!id) continue;
      const ada = Number(row?.amount || 0) / 1_000_000;
      out.set(id, Number.isFinite(ada) ? Math.max(0, ada) : 0);
    }
    return out;
  }

  /**
   * DRep registration state, Blockfrost-shaped:
   * { drep_id, hex, amount, active, retired, expired, has_script,
   *   active_epoch, last_active_epoch, expires_epoch_no, meta_url, meta_hash }
   * `registrationEpochs` (Map id → epoch) fills active_epoch when known and
   * `drepActivity` (protocol param, default 20) derives last_active_epoch.
   */
  async function getDrepDetails(ids, { registrationEpochs = null, drepActivity = 20 } = {}) {
    const rows = await postBatched("/drep_info", "_drep_ids", ids);
    const out = new Map();
    for (const info of rows) {
      const id = String(info?.drep_id || "").trim();
      if (!id) continue;
      const status = typeof info.drep_status === "string" ? info.drep_status.toLowerCase() : "";
      const registered = status ? status === "registered" : info.registered !== false;
      const retired = !registered;
      const expired = registered && info.active === false;
      const active = registered && !expired;
      const expires = nullableEpoch(info.expires_epoch_no);
      const activity = Number.isFinite(Number(drepActivity)) && Number(drepActivity) > 0 ? Number(drepActivity) : 20;
      out.set(id, {
        drep_id: id,
        hex: String(info.hex || ""),
        amount: info.amount === null || info.amount === undefined ? "0" : String(info.amount),
        active,
        retired,
        expired,
        has_script: info.has_script === true,
        active_epoch: registrationEpochs instanceof Map ? (registrationEpochs.get(id) ?? null) : null,
        last_active_epoch: expires !== null ? expires - activity : null,
        expires_epoch_no: expires,
        deposit: info.deposit ?? null,
        meta_url: String(info.meta_url || ""),
        meta_hash: String(info.meta_hash || "").toLowerCase(),
        live_delegator_count: Number(info.live_delegator_count || 0) || 0
      });
    }
    return out;
  }

  // DRep metadata envelopes, Blockfrost-shaped ({ url, hash, json_metadata, bytes }).
  async function getDrepMetadata(ids) {
    const rows = await postBatched("/drep_metadata", "_drep_ids", ids);
    const out = new Map();
    for (const row of rows) {
      const id = String(row?.drep_id || "").trim();
      if (!id) continue;
      out.set(id, {
        drep_id: id,
        hex: String(row.hex || ""),
        url: String(row.meta_url || "").trim(),
        hash: String(row.meta_hash || "").trim().toLowerCase(),
        json_metadata: parseMaybeJson(row.meta_json),
        bytes: typeof row.bytes === "string" ? row.bytes : null,
        koios_is_valid: row.is_valid ?? null,
        koios_warning: row.warning ?? null
      });
    }
    return out;
  }

  // First registration epoch per DRep (from the global drep_updates stream).
  async function getDrepRegistrationEpochs() {
    const rows = await pageAll("/drep_updates?action=eq.registered&order=block_time.asc", { maxRows: 100000 });
    const out = new Map();
    for (const row of rows) {
      const id = String(row?.drep_id || "").trim();
      if (!id || out.has(id)) continue;
      const epoch = epochFromUnix(row?.block_time);
      if (epoch !== null) out.set(id, epoch);
    }
    return out;
  }

  // Power of the two special DReps for an epoch, from the same drep_history
  // read the sync already makes when `powerMap` is supplied.
  async function getSpecialDreps(epoch, powerMap = null) {
    const map = powerMap instanceof Map ? powerMap : await getDrepPowerForEpoch(epoch);
    const pick = (id) => {
      const ada = Number(map.get(id));
      return { id, active: true, votingPowerAda: Number.isFinite(ada) ? Math.floor(ada) : 0 };
    };
    return {
      alwaysAbstain: pick("drep_always_abstain"),
      alwaysNoConfidence: pick("drep_always_no_confidence")
    };
  }

  async function getDrepDelegators(drepId, { maxRows = 5000 } = {}) {
    const id = String(drepId || "").trim();
    if (!id) return [];
    const rows = await pageAll(`/drep_delegators?_drep_id=${encodeURIComponent(id)}`, { maxRows });
    return rows
      .map((row) => ({
        address: String(row?.stake_address || "").trim(),
        amountAda: Math.floor(Number(row?.amount || 0) / 1_000_000)
      }))
      .filter((row) => row.address);
  }

  // ── Pools ────────────────────────────────────────────────────────────────

  /**
   * Registered pools with the fields the SPO roster needs:
   * { id, name, ticker, homepage, status, rewardAccount, delegatedDrep,
   *   votingPowerAda, liveStakeAda, activeStakeAda }
   */
  async function listPools({ withDelegation = true } = {}) {
    const listRows = await pageAll("/pool_list?pool_status=eq.registered", { maxRows: 20000 });
    const ids = listRows.map((row) => String(row?.pool_id_bech32 || "").trim()).filter(Boolean);
    const infoById = new Map();
    if (withDelegation && ids.length > 0) {
      const infoRows = await postBatched("/pool_info", "_pool_bech32_ids", ids, { batchSize: 80, minBatch: 10 });
      for (const row of infoRows) {
        const id = String(row?.pool_id_bech32 || "").trim();
        if (id) infoById.set(id, row);
      }
    }
    const out = [];
    for (const row of listRows) {
      const id = String(row?.pool_id_bech32 || "").trim();
      if (!id) continue;
      const info = infoById.get(id) || null;
      const metaJson = parseMaybeJson(info?.meta_json);
      const ticker = String(row?.ticker || metaJson?.ticker || "").trim();
      const name = String(ticker || metaJson?.name || "").trim();
      const homepage = String(metaJson?.homepage || row?.meta_url || info?.meta_url || "").trim();
      const liveStakeAda = Number(info?.live_stake || 0) / 1_000_000;
      const activeStakeAda = Number(row?.active_stake || info?.active_stake || 0) / 1_000_000;
      const power = Number.isFinite(liveStakeAda) && liveStakeAda > 0 ? liveStakeAda : activeStakeAda;
      out.push({
        id,
        name,
        ticker,
        homepage,
        status: String(row?.pool_status || info?.pool_status || "registered").toLowerCase(),
        rewardAccount: String(info?.reward_addr || row?.reward_addr || "").trim(),
        delegatedDrep: String(info?.reward_addr_delegated_drep || "").trim(),
        votingPowerAda: Number.isFinite(power) ? Math.max(0, power) : 0,
        liveStakeAda: Number.isFinite(liveStakeAda) ? liveStakeAda : 0,
        activeStakeAda: Number.isFinite(activeStakeAda) ? activeStakeAda : 0,
        raw: info
      });
    }
    return out;
  }

  // ── Committee ────────────────────────────────────────────────────────────

  async function getCommitteeInfo() {
    const rows = await koiosGet("/committee_info");
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  // ── Accounts / scripts (used by on-demand routes) ────────────────────────

  async function getAccountInfo(stakeAddress) {
    const addr = String(stakeAddress || "").trim();
    if (!addr) return null;
    const rows = await koiosPost("/account_info", { _stake_addresses: [addr] });
    const row = Array.isArray(rows) ? rows.find((r) => r?.stake_address === addr) || rows[0] : null;
    if (!row) return null;
    return {
      stake_address: String(row.stake_address || addr),
      status: String(row.status || ""),
      drep_id: String(row.delegated_drep || "").trim(),
      pool_id: String(row.delegated_pool || "").trim(),
      total_balance: String(row.total_balance || "0")
    };
  }

  async function getScriptInfo(scriptHash) {
    const hash = String(scriptHash || "").trim().toLowerCase();
    if (!hash) return null;
    const rows = await koiosPost("/script_info", { _script_hashes: [hash] });
    const row = Array.isArray(rows) ? rows.find((r) => String(r?.script_hash || "").toLowerCase() === hash) || rows[0] : null;
    if (!row) return null;
    return {
      script_hash: hash,
      type: String(row.type || ""),
      bytes: typeof row.bytes === "string" ? row.bytes : null,
      size: Number(row.size || 0) || null,
      creation_tx_hash: String(row.creation_tx_hash || "")
    };
  }

  return {
    name: "koios",
    epochFromUnix,
    getTip,
    getEpochParams,
    listProposals,
    listVotes,
    getProposalVotingSummary,
    listDrepIds,
    getDrepPowerForEpoch,
    getDrepDetails,
    getDrepMetadata,
    getDrepRegistrationEpochs,
    getSpecialDreps,
    getDrepDelegators,
    listPools,
    getCommitteeInfo,
    getAccountInfo,
    getScriptInfo,
    // exposed for tests
    _internal: { mapProposalRow, mapVoteRow, toBlockfrostGovernanceType, toBlockfrostVoterRole, pageAll, postBatched }
  };
}

module.exports = {
  createKoiosGovernanceSource,
  epochFromUnix,
  toBlockfrostGovernanceType,
  toBlockfrostVoterRole,
  SHELLEY_EPOCH_208_START_UNIX,
  CARDANO_EPOCH_SECONDS
};
