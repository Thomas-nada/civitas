"use strict";

/**
 * Governance action model: the per-action voting-power breakdown, threshold
 * progress and lifecycle status that the Actions explorer, the action detail
 * page and the epoch calendar render.
 *
 * This is a server-side port of the computation the Actions page used to run
 * in the browser over the whole snapshot (every DRep × every vote, every SPO
 * × every action). Computing it once per snapshot and serving ~150 small rows
 * replaces an 18 MB download per page view.
 *
 * Pure functions, no I/O. Kept in one place so the numbers agree everywhere.
 */

const SHELLEY_EPOCH_START_UNIX = 1596059091;
const EPOCH_DURATION_SECONDS = 432000;
const EXPIRING_SOON_EPOCHS = 1;
const SPO_FORMULA_TRANSITION_EPOCH = 534;
const SPO_FORMULA_TRANSITION_GOV_ACTION =
  "gov_action1pvv5wmjqhwa4u85vu9f4ydmzu2mgt8n7et967ph2urhx53r70xusqnmm525";

function round2(value) {
  return Math.round(value * 100) / 100;
}

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function approxCurrentEpochFromNow(nowUnix = Math.floor(Date.now() / 1000)) {
  const delta = nowUnix - SHELLEY_EPOCH_START_UNIX;
  if (!Number.isFinite(delta) || delta < 0) return null;
  return 208 + Math.floor(delta / EPOCH_DURATION_SECONDS);
}

function isAlwaysAbstainSpo(spo) {
  const status = String(spo?.delegationStatus || "").toLowerCase();
  const literal = String(spo?.delegatedDrepLiteralRaw || spo?.delegatedDrepLiteral || "").toLowerCase();
  return status.includes("always abstain") || literal.includes("always_abstain");
}

function isAlwaysNoConfidenceSpo(spo) {
  const status = String(spo?.delegationStatus || "").toLowerCase();
  const literal = String(spo?.delegatedDrepLiteralRaw || spo?.delegatedDrepLiteral || "").toLowerCase();
  return status.includes("always no confidence") || literal.includes("always_no_confidence");
}

function isHardForkAction(governanceType) {
  const t = String(governanceType || "").toLowerCase();
  return t.includes("hard fork") || t.includes("hardfork");
}

function isNoConfidenceAction(governanceType) {
  const t = String(governanceType || "").toLowerCase();
  return t.includes("no confidence") || t.includes("noconfidence");
}

function hasActiveDrepVotingPower(drep) {
  const status = String(drep?.status || "").trim().toLowerCase();
  return status !== "expired" && status !== "retired";
}

function shouldUseNewSpoFormula(proposalId, submittedEpoch) {
  if (String(proposalId || "") === SPO_FORMULA_TRANSITION_GOV_ACTION) return true;
  const epoch = Number(submittedEpoch);
  return Number.isFinite(epoch) && epoch >= SPO_FORMULA_TRANSITION_EPOCH;
}

/** Display status of an action from its lifecycle fields. */
function deriveStatus(info) {
  if (!info) return "Unknown";
  if (String(info.outcome || "").toLowerCase() === "pending") return "Active";
  const governanceType = String(info.governanceType || "").toLowerCase();
  const isInfoAction = governanceType.includes("info action") || governanceType === "info";
  if (isInfoAction) return "";
  const droppedEpoch = Number(info?.droppedEpoch || 0);
  const expiredEpoch = Number(info?.expiredEpoch || 0);
  const expirationEpoch = Number(info?.expirationEpoch || 0);
  const hasDropped = Number.isFinite(droppedEpoch) && droppedEpoch > 0;
  const hasExpired = Number.isFinite(expiredEpoch) && expiredEpoch > 0;
  if (hasDropped && hasExpired) {
    if (Number.isFinite(expirationEpoch) && expirationEpoch > 0 && droppedEpoch < expirationEpoch) return "Dropped";
    return "Expired";
  }
  if (hasDropped) {
    if (Number.isFinite(expirationEpoch) && expirationEpoch > 0 && droppedEpoch >= expirationEpoch) return "Expired";
    return "Dropped";
  }
  if (hasExpired) return "Expired";
  if (info.enactedEpoch !== null && info.enactedEpoch !== undefined) return "Enacted";
  if (info.ratifiedEpoch !== null && info.ratifiedEpoch !== undefined) return "Ratified";
  return String(info.outcome || "Unknown");
}

function roleTotalVotes(voteStats) {
  const drep = Number(voteStats?.drep?.total || 0);
  const cc = Number(voteStats?.constitutional_committee?.total || 0);
  const spo = Number(voteStats?.stake_pool?.total || 0);
  const other = Number(voteStats?.other?.total || 0);
  return drep + cc + spo + other;
}

function emptyRoleBucket() {
  return { yes: 0, no: 0, abstain: 0, noConfidence: 0, other: 0, total: 0 };
}

function addToBucket(bucket, voteValue) {
  const v = String(voteValue || "").toLowerCase();
  if (v === "yes") bucket.yes += 1;
  else if (v === "no") bucket.no += 1;
  else if (v === "abstain") bucket.abstain += 1;
  else if (v.includes("no_confidence")) bucket.noConfidence += 1;
  else bucket.other += 1;
  bucket.total += 1;
}

/** ADA withdrawn by a treasury action, from its governance description. */
function withdrawalAmountAda(info) {
  const gd = info?.governanceDescription;
  if (gd?.tag === "TreasuryWithdrawals" && Array.isArray(gd?.contents?.[0])) {
    const lovelace = gd.contents[0].reduce((s, item) => s + Number(Array.isArray(item) ? item[1] : 0), 0);
    if (lovelace > 0) return lovelace / 1_000_000;
  }
  return null;
}

/**
 * DRep voting power per action: yes/no/abstain/no-confidence ADA, with the
 * auto-abstain DReps and the two special DReps separated out.
 */
function computeDrepPowerStats({ dreps, proposalInfo, specialDreps }) {
  const byProposal = new Map();
  const list = Array.isArray(dreps) ? dreps : [];
  const alwaysAbstainId = "drep_always_abstain";
  const alwaysNoConfidenceId = "drep_always_no_confidence";
  const alwaysAbstainPowerAda = Number(specialDreps?.alwaysAbstain?.votingPowerAda || 0);
  const alwaysNoConfidencePowerAda = Number(specialDreps?.alwaysNoConfidence?.votingPowerAda || 0);
  const autoAbstainIds = new Set();
  const knownDrepIds = new Set(list.map((drep) => drep.id));
  let regularDrepStakeAda = list.reduce((sum, drep) => (
    hasActiveDrepVotingPower(drep) ? sum + Number(drep.votingPowerAda || 0) : sum
  ), 0);
  if (knownDrepIds.has(alwaysAbstainId)) {
    const row = list.find((drep) => drep.id === alwaysAbstainId);
    regularDrepStakeAda -= Number(row?.votingPowerAda || 0);
  }
  if (knownDrepIds.has(alwaysNoConfidenceId)) {
    const row = list.find((drep) => drep.id === alwaysNoConfidenceId);
    regularDrepStakeAda -= Number(row?.votingPowerAda || 0);
  }
  autoAbstainIds.add(alwaysAbstainId);

  for (const drep of list) {
    const votes = drep.votes || [];
    if (votes.length === 0) continue;
    const name = String(drep.name || "").toLowerCase();
    const id = String(drep.id || "").toLowerCase();
    const allAbstain = votes.every((vote) => String(vote.vote || "").toLowerCase() === "abstain");
    if (name.includes("auto") && name.includes("abstain")) autoAbstainIds.add(drep.id);
    else if (name.includes("always") && name.includes("abstain")) autoAbstainIds.add(drep.id);
    else if (id.includes("always") && id.includes("abstain")) autoAbstainIds.add(drep.id);
    else if (id.includes("auto") && id.includes("abstain")) autoAbstainIds.add(drep.id);
    else if (allAbstain && (name.includes("abstain") || id.includes("abstain"))) autoAbstainIds.add(drep.id);
  }

  const ensure = (proposalId) => {
    if (!byProposal.has(proposalId)) {
      byProposal.set(proposalId, {
        yesPowerAda: 0,
        noPowerAda: 0,
        noConfidencePowerAda: 0,
        abstainActivePowerAda: 0,
        abstainAutoPowerAda: 0,
        noConfidenceAutoPowerAda: 0,
        otherPowerAda: 0,
        votedPowerAda: 0
      });
    }
    return byProposal.get(proposalId);
  };

  for (const drep of list) {
    if (!hasActiveDrepVotingPower(drep)) continue;
    const vp = Number(drep.votingPowerAda || 0);
    for (const vote of drep.votes || []) {
      const stats = ensure(vote.proposalId);
      const v = String(vote.vote || "").toLowerCase();
      if (v === "yes") stats.yesPowerAda += vp;
      else if (v === "no") stats.noPowerAda += vp;
      else if (v === "abstain") {
        if (autoAbstainIds.has(drep.id)) stats.abstainAutoPowerAda += vp;
        else stats.abstainActivePowerAda += vp;
      } else if (v.includes("no_confidence")) stats.noConfidencePowerAda += vp;
      else stats.otherPowerAda += vp;
      stats.votedPowerAda += vp;
    }
  }

  for (const proposalId of Object.keys(proposalInfo || {})) {
    const stats = ensure(proposalId);
    if (alwaysAbstainPowerAda > 0) {
      stats.abstainAutoPowerAda += alwaysAbstainPowerAda;
      stats.votedPowerAda += alwaysAbstainPowerAda;
    }
    if (alwaysNoConfidencePowerAda > 0) {
      stats.noConfidenceAutoPowerAda += alwaysNoConfidencePowerAda;
    }
  }

  return {
    regularDrepStakeAda: Math.max(regularDrepStakeAda, 0),
    autoAbstainIds,
    alwaysAbstainPowerAda,
    alwaysNoConfidencePowerAda,
    byProposal
  };
}

/** Vote counts per action per role, from the actor vote lists. */
function computeFallbackVoteStats({ dreps, committeeMembers, spos }) {
  const map = new Map();
  const ensure = (proposalId) => {
    if (!map.has(proposalId)) {
      map.set(proposalId, {
        drep: emptyRoleBucket(),
        constitutional_committee: emptyRoleBucket(),
        stake_pool: emptyRoleBucket(),
        other: emptyRoleBucket()
      });
    }
    return map.get(proposalId);
  };
  for (const drep of Array.isArray(dreps) ? dreps : []) {
    for (const vote of drep.votes || []) addToBucket(ensure(vote.proposalId).drep, vote.vote);
  }
  for (const member of Array.isArray(committeeMembers) ? committeeMembers : []) {
    for (const vote of member.votes || []) addToBucket(ensure(vote.proposalId).constitutional_committee, vote.vote);
  }
  for (const spo of Array.isArray(spos) ? spos : []) {
    for (const vote of spo.votes || []) addToBucket(ensure(vote.proposalId).stake_pool, vote.vote);
  }
  return map;
}

/** SPO stake per action: active votes and the passive buckets. */
function computeSpoPowerStats({ spos, proposalInfo }) {
  const byProposal = new Map();
  const proposalIds = Object.keys(proposalInfo || {});
  const ensure = (proposalId) => {
    if (!byProposal.has(proposalId)) {
      byProposal.set(proposalId, {
        activeYesPowerAda: 0,
        activeNoPowerAda: 0,
        activeAbstainPowerAda: 0,
        passiveAlwaysAbstainPowerAda: 0,
        passiveAlwaysNoConfidencePowerAda: 0,
        passiveNoVotePowerAda: 0
      });
    }
    return byProposal.get(proposalId);
  };
  for (const spo of Array.isArray(spos) ? spos : []) {
    const vp = Number(spo?.votingPowerAda || 0);
    const votesByProposal = new Map((spo?.votes || []).map((vote) => [String(vote?.proposalId || ""), vote]));
    const spoAlwaysAbstain = isAlwaysAbstainSpo(spo);
    const spoAlwaysNoConfidence = isAlwaysNoConfidenceSpo(spo);
    for (const proposalId of proposalIds) {
      const vote = votesByProposal.get(proposalId);
      const stats = ensure(proposalId);
      if (!vote) {
        if (spoAlwaysAbstain) stats.passiveAlwaysAbstainPowerAda += vp;
        else if (spoAlwaysNoConfidence) stats.passiveAlwaysNoConfidencePowerAda += vp;
        else stats.passiveNoVotePowerAda += vp;
        continue;
      }
      const v = String(vote.vote || "").toLowerCase();
      if (v === "yes") stats.activeYesPowerAda += vp;
      else if (v === "no") stats.activeNoPowerAda += vp;
      else if (v === "abstain") stats.activeAbstainPowerAda += vp;
      else stats.passiveNoVotePowerAda += vp;
    }
  }
  return { byProposal };
}

/**
 * One model row per action. `snapshot` is a (possibly compact) snapshot:
 * { proposalInfo, dreps, spos, committeeMembers, specialDreps, thresholdContext,
 *   latestEpoch }. `votingSummaryOverrides` maps proposalId → { nomosModel }
 * for a fresher Koios summary than the snapshot carries.
 */
function computeActionModels(snapshot, { votingSummaryOverrides = null, referenceEpoch = null } = {}) {
  const proposalInfo = snapshot?.proposalInfo && typeof snapshot.proposalInfo === "object" ? snapshot.proposalInfo : {};
  const dreps = Array.isArray(snapshot?.dreps) ? snapshot.dreps : [];
  const spos = Array.isArray(snapshot?.spos) ? snapshot.spos : [];
  const committeeMembers = Array.isArray(snapshot?.committeeMembers) ? snapshot.committeeMembers : [];
  const specialDreps = snapshot?.specialDreps || {};
  const committeeMinSize = Number(snapshot?.thresholdContext?.committeeMinSize || 0);

  const drepPowerStats = computeDrepPowerStats({ dreps, proposalInfo, specialDreps });
  const fallbackVoteStats = computeFallbackVoteStats({ dreps, committeeMembers, spos });
  const spoPowerStats = computeSpoPowerStats({ spos, proposalInfo });
  const refEpoch = (() => {
    if (Number.isFinite(Number(referenceEpoch)) && Number(referenceEpoch) > 0) return Number(referenceEpoch);
    const snapshotEpoch = Number(snapshot?.latestEpoch || 0);
    if (Number.isFinite(snapshotEpoch) && snapshotEpoch > 0) return snapshotEpoch;
    return approxCurrentEpochFromNow();
  })();
  const activeNowCommitteeCount = committeeMembers.filter((member) => String(member?.status || "").toLowerCase() === "active").length;

  return Object.entries(proposalInfo).map(([proposalId, info]) => {
    const status = deriveStatus(info);
    const voteStats = info?.voteStats || fallbackVoteStats.get(proposalId) || {};
    const liveNomosModel = votingSummaryOverrides?.[proposalId]?.nomosModel || info?.nomosModel || null;
    const nomosDrep = liveNomosModel?.drep || null;
    const nomosSpo = liveNomosModel?.spo || null;
    const spoStats = spoPowerStats.byProposal.get(proposalId) || {
      activeYesPowerAda: 0,
      activeNoPowerAda: 0,
      activeAbstainPowerAda: 0,
      passiveAlwaysAbstainPowerAda: 0,
      passiveAlwaysNoConfidencePowerAda: 0,
      passiveNoVotePowerAda: 0
    };
    const powerStats = drepPowerStats.byProposal.get(proposalId) || {
      yesPowerAda: 0,
      noPowerAda: 0,
      noConfidencePowerAda: 0,
      abstainActivePowerAda: 0,
      abstainAutoPowerAda: 0,
      noConfidenceAutoPowerAda: 0,
      otherPowerAda: 0,
      votedPowerAda: 0
    };
    const isNoConfidence = isNoConfidenceAction(info?.governanceType);
    const regularDrepStakeAda = Number(drepPowerStats.regularDrepStakeAda || 0);
    const totalActiveStakeAda = regularDrepStakeAda + Number(drepPowerStats.alwaysNoConfidencePowerAda || 0);
    const totalDelegatedStakeAda = totalActiveStakeAda + Number(drepPowerStats.alwaysAbstainPowerAda || 0);
    const abstainPowerAda = powerStats.abstainActivePowerAda + powerStats.abstainAutoPowerAda;
    const yesTotalAda = isNoConfidence
      ? powerStats.yesPowerAda + Number(drepPowerStats.alwaysNoConfidencePowerAda || 0)
      : powerStats.yesPowerAda;
    const noConfidenceTotalAda = isNoConfidence
      ? 0
      : powerStats.noConfidencePowerAda + powerStats.noConfidenceAutoPowerAda;
    const noTotalAda = powerStats.noPowerAda;
    const notVotedAda = Math.max(
      totalActiveStakeAda - yesTotalAda - noTotalAda - noConfidenceTotalAda - powerStats.abstainActivePowerAda,
      0
    );
    const drepOutcomeBaseAda = Math.max(totalActiveStakeAda - powerStats.abstainActivePowerAda, 0);
    const drepNoSideAda = noTotalAda + noConfidenceTotalAda + notVotedAda;

    const nomosYesAda = toNum(nomosDrep?.yesLovelace) / 1_000_000;
    const nomosNoAda = toNum(nomosDrep?.noLovelace) / 1_000_000;
    const nomosAbstainAda = toNum(nomosDrep?.abstainLovelace) / 1_000_000;
    const nomosNotVotedAda = toNum(nomosDrep?.notVotedLovelace) / 1_000_000;
    const nomosActiveAbstainAda = toNum(nomosDrep?.activeAbstainLovelace) / 1_000_000;
    const nomosNoConfidenceAda = toNum(nomosDrep?.noConfidenceLovelace ?? nomosDrep?.alwaysNoConfidenceLovelace) / 1_000_000;
    const nomosDelegatedAda = (toNum(nomosDrep?.derivedTotalLovelace) || 0) / 1_000_000;
    const nomosActiveAda = nomosYesAda + nomosNoAda + nomosNoConfidenceAda + nomosNotVotedAda + nomosActiveAbstainAda;
    const nomosSpoYesAda = toNum(nomosSpo?.yesLovelace) / 1_000_000;
    const nomosSpoNoAda = toNum(nomosSpo?.noLovelace) / 1_000_000;
    const nomosSpoAbstainAda = toNum(nomosSpo?.abstainLovelace) / 1_000_000;
    const nomosSpoNotVotedAda = toNum(nomosSpo?.notVotedLovelace) / 1_000_000;
    const nomosSpoEffectiveTotalAda = toNum(nomosSpo?.effectiveTotalLovelace) / 1_000_000;
    const nomosSpoActiveAbstainAda = toNum(nomosSpo?.activeAbstainLovelace) / 1_000_000;
    const nomosSpoAlwaysAbstainAda = toNum(nomosSpo?.alwaysAbstainLovelace) / 1_000_000;

    const useNomos = Boolean(nomosDrep);
    const drepRequiredPct = toNum(info?.thresholdInfo?.drepRequiredPct);
    const spoRequiredPct = toNum(info?.thresholdInfo?.poolRequiredPct);
    const drepYesPct = useNomos ? toNum(nomosDrep?.yesPct) : (drepOutcomeBaseAda > 0 ? (yesTotalAda / drepOutcomeBaseAda) * 100 : null);
    const drepNoPct = useNomos ? toNum(nomosDrep?.noPct) : (drepOutcomeBaseAda > 0 ? (drepNoSideAda / drepOutcomeBaseAda) * 100 : null);
    const useNomosSpo = Boolean(nomosSpo);
    const localSpoActiveYesAda = Number(spoStats.activeYesPowerAda || 0);
    const localSpoActiveNoAda = Number(spoStats.activeNoPowerAda || 0);
    const localSpoActiveAbstainAda = Number(spoStats.activeAbstainPowerAda || 0);
    const localSpoPassiveAlwaysAbstainAda = Number(spoStats.passiveAlwaysAbstainPowerAda || 0);
    const localSpoPassiveAlwaysNoConfidenceAda = Number(spoStats.passiveAlwaysNoConfidencePowerAda || 0);
    const localSpoPassiveNoVoteAda = Number(spoStats.passiveNoVotePowerAda || 0);
    const localSpoBreakdownSumAda =
      localSpoActiveYesAda +
      localSpoActiveNoAda +
      localSpoActiveAbstainAda +
      localSpoPassiveAlwaysAbstainAda +
      localSpoPassiveAlwaysNoConfidenceAda +
      localSpoPassiveNoVoteAda;
    const localSpoEffectiveTotalAda = Math.max(localSpoBreakdownSumAda, 0);
    const localSpoIsNoConfidence = isNoConfidenceAction(info?.governanceType);
    const localSpoIsHardFork = isHardForkAction(info?.governanceType);
    const localUseNewSpoFormula = shouldUseNewSpoFormula(proposalId, info?.submittedEpoch);

    let localSpoYesAda = 0;
    let localSpoNoAda = 0;
    let localSpoAbstainAda = 0;
    let localSpoNotVotedAda = Math.max(localSpoPassiveNoVoteAda, 0);
    let localSpoOutcomeDenAda = 0;

    if (localUseNewSpoFormula) {
      let localSpoNotVotedCalcAda = localSpoNotVotedAda;
      if (localSpoIsHardFork) {
        localSpoYesAda = localSpoActiveYesAda;
        localSpoAbstainAda = localSpoActiveAbstainAda;
        localSpoNotVotedCalcAda = localSpoNotVotedAda + localSpoPassiveAlwaysNoConfidenceAda + localSpoPassiveAlwaysAbstainAda;
      } else if (localSpoIsNoConfidence) {
        localSpoYesAda = localSpoActiveYesAda + localSpoPassiveAlwaysNoConfidenceAda;
        localSpoAbstainAda = localSpoActiveAbstainAda + localSpoPassiveAlwaysAbstainAda;
      } else {
        localSpoYesAda = localSpoActiveYesAda;
        localSpoAbstainAda = localSpoActiveAbstainAda + localSpoPassiveAlwaysAbstainAda;
      }
      localSpoNoAda = localSpoActiveNoAda + Math.max(localSpoNotVotedCalcAda, 0);
      localSpoOutcomeDenAda = Math.max(localSpoEffectiveTotalAda - localSpoAbstainAda, 0);
    } else {
      localSpoYesAda = localSpoActiveYesAda;
      localSpoNoAda = localSpoActiveNoAda + localSpoPassiveAlwaysNoConfidenceAda;
      localSpoAbstainAda = localSpoActiveAbstainAda + localSpoPassiveAlwaysAbstainAda;
      localSpoOutcomeDenAda = Math.max(localSpoActiveYesAda + localSpoActiveNoAda + localSpoPassiveAlwaysNoConfidenceAda, 0);
    }

    const spoYesAda = useNomosSpo ? nomosSpoYesAda : localSpoYesAda;
    const spoNoAda = useNomosSpo ? nomosSpoNoAda : localSpoNoAda;
    const spoAlwaysAbstainAda = useNomosSpo ? nomosSpoAlwaysAbstainAda : localSpoPassiveAlwaysAbstainAda;
    const spoAbstainAda = useNomosSpo
      ? (nomosSpoActiveAbstainAda + nomosSpoAlwaysAbstainAda)
      : localSpoAbstainAda;
    const spoNotVotedAda = useNomosSpo ? nomosSpoNotVotedAda : localSpoNotVotedAda;
    const spoEffectiveTotalAda = useNomosSpo ? nomosSpoEffectiveTotalAda : localSpoEffectiveTotalAda;
    const spoOutcomeDenAda = useNomosSpo ? Math.max(spoYesAda + spoNoAda, 0) : localSpoOutcomeDenAda;
    const spoYesPct = useNomosSpo
      ? toNum(nomosSpo?.yesPct)
      : (spoOutcomeDenAda > 0 ? (spoYesAda / spoOutcomeDenAda) * 100 : null);
    const spoNoPct = useNomosSpo
      ? toNum(nomosSpo?.noPct)
      : (spoOutcomeDenAda > 0 ? (spoNoAda / spoOutcomeDenAda) * 100 : null);
    const spoAbstainPct = useNomosSpo
      ? toNum(nomosSpo?.abstainPct)
      : (spoEffectiveTotalAda > 0 ? (spoAbstainAda / spoEffectiveTotalAda) * 100 : null);
    const spoNotVotedPct = spoEffectiveTotalAda > 0 ? (spoNotVotedAda / spoEffectiveTotalAda) * 100 : null;
    const drepThresholdMet = drepRequiredPct > 0 && drepYesPct !== null ? drepYesPct >= drepRequiredPct : null;
    const spoThresholdMet = spoRequiredPct > 0 && spoYesPct !== null ? spoYesPct >= spoRequiredPct : null;
    const passingNow =
      drepThresholdMet === false
        ? false
        : spoThresholdMet === false
          ? false
          : drepThresholdMet === true
            ? (spoThresholdMet === null ? true : spoThresholdMet)
            : null;
    const submittedEpoch = Number(info?.submittedEpoch || 0);
    const ccEligibleCountFromEpoch = submittedEpoch > 0
      ? committeeMembers.filter((member) => {
          const start = Number(member?.seatStartEpoch || 0);
          const end = Number(member?.expirationEpoch || 0);
          if (start > 0 && submittedEpoch < start) return false;
          if (end > 0 && submittedEpoch > end) return false;
          return true;
        }).length
      : 0;
    const ccEligibleCount = ccEligibleCountFromEpoch > 0
      ? ccEligibleCountFromEpoch
      : (activeNowCommitteeCount > 0 ? activeNowCommitteeCount : committeeMinSize);
    const expirationEpoch = Number(info?.expirationEpoch || 0) || null;
    const epochsUntilExpiration = expirationEpoch && refEpoch
      ? (expirationEpoch - refEpoch)
      : null;
    const isExpiringSoon =
      status === "Active" &&
      Number.isFinite(epochsUntilExpiration) &&
      epochsUntilExpiration >= 0 &&
      epochsUntilExpiration <= EXPIRING_SOON_EPOCHS;

    return {
      proposalId,
      actionName: info?.actionName || proposalId,
      governanceType: info?.governanceType || "Unknown",
      outcome: info?.outcome || "Unknown",
      status,
      submittedAt: info?.submittedAt || null,
      submittedAtUnix: Number(info?.submittedAtUnix || 0),
      submittedEpoch: info?.submittedEpoch || null,
      depositAda: Number(info?.depositAda || 0),
      withdrawalAmountAda: withdrawalAmountAda(info),
      thresholdInfo: info?.thresholdInfo || {},
      voteStats,
      totalVotes: roleTotalVotes(voteStats),
      txHash: info?.txHash || null,
      returnAddress: info?.returnAddress || "",
      certIndex: info?.certIndex,
      expirationEpoch,
      epochsUntilExpiration,
      isExpiringSoon,
      ratifiedEpoch: info?.ratifiedEpoch,
      enactedEpoch: info?.enactedEpoch,
      droppedEpoch: info?.droppedEpoch,
      expiredEpoch: info?.expiredEpoch,
      metadataUrl: info?.metadataUrl || null,
      metadataHash: info?.metadataHash || null,
      modelSource: (useNomos || useNomosSpo) ? "nomos-koios" : "local-fallback",
      totalDelegatedStakeAda: useNomos ? nomosDelegatedAda : totalDelegatedStakeAda,
      totalActiveStakeAda: useNomos ? nomosActiveAda : totalActiveStakeAda,
      drepPowerVotedAda: powerStats.votedPowerAda,
      drepYesPowerAda: useNomos ? nomosYesAda : yesTotalAda,
      drepNoPowerAda: useNomos ? nomosNoAda : noTotalAda,
      drepAbstainPowerAda: useNomos ? nomosAbstainAda : abstainPowerAda,
      drepAbstainActivePowerAda: useNomos ? nomosActiveAbstainAda : powerStats.abstainActivePowerAda,
      drepAbstainAutoPowerAda: useNomos ? toNum(nomosDrep?.alwaysAbstainLovelace) / 1_000_000 : powerStats.abstainAutoPowerAda,
      drepNoConfidencePowerAda: useNomos ? nomosNoConfidenceAda : noConfidenceTotalAda,
      drepNoConfidenceAutoPowerAda: useNomos ? toNum(nomosDrep?.alwaysNoConfidenceLovelace) / 1_000_000 : powerStats.noConfidenceAutoPowerAda,
      drepYesPowerPct: drepYesPct,
      drepNoPowerPct: drepNoPct,
      drepNotVotedPowerAda: useNomos ? nomosNotVotedAda : notVotedAda,
      drepNotVotedPowerPct: useNomos ? toNum(nomosDrep?.notVotedPct) : (totalActiveStakeAda > 0 ? (notVotedAda / totalActiveStakeAda) * 100 : null),
      drepAbstainPowerPct: useNomos ? toNum(nomosDrep?.abstainPct) : (totalDelegatedStakeAda > 0 ? (abstainPowerAda / totalDelegatedStakeAda) * 100 : null),
      drepAbstainActivePowerPct: totalDelegatedStakeAda > 0 ? (powerStats.abstainActivePowerAda / totalDelegatedStakeAda) * 100 : null,
      drepAbstainAutoPowerPct: useNomos ? (nomosDelegatedAda > 0 ? (toNum(nomosDrep?.alwaysAbstainLovelace) / 1_000_000 / nomosDelegatedAda) * 100 : null) : (totalDelegatedStakeAda > 0 ? (powerStats.abstainAutoPowerAda / totalDelegatedStakeAda) * 100 : null),
      drepNoConfidencePowerPct: useNomos
        ? (nomosActiveAda > 0 ? (nomosNoConfidenceAda / nomosActiveAda) * 100 : null)
        : (totalActiveStakeAda > 0 ? (noConfidenceTotalAda / totalActiveStakeAda) * 100 : null),
      drepNoConfidenceAutoPowerPct: useNomos ? (nomosDelegatedAda > 0 ? (toNum(nomosDrep?.alwaysNoConfidenceLovelace) / 1_000_000 / nomosDelegatedAda) * 100 : null) : (totalDelegatedStakeAda > 0 ? (powerStats.noConfidenceAutoPowerAda / totalDelegatedStakeAda) * 100 : null),
      drepTurnoutPowerPct: useNomos
        ? (nomosActiveAda > 0 ? ((nomosYesAda + nomosNoAda + nomosNoConfidenceAda) / nomosActiveAda) * 100 : null)
        : (totalActiveStakeAda > 0 ? ((yesTotalAda + noTotalAda + noConfidenceTotalAda) / totalActiveStakeAda) * 100 : null),
      hasAutoAbstainPower: useNomos ? toNum(nomosDrep?.alwaysAbstainLovelace) > 0 : Number(drepPowerStats.alwaysAbstainPowerAda || 0) > 0,
      spoYesPct,
      spoNoPct,
      spoAbstainPct,
      spoNotVotedPct,
      spoYesAda,
      spoNoAda,
      spoAbstainAda,
      spoNotVotedAda,
      spoAlwaysAbstainAda,
      drepRequiredPct: drepRequiredPct > 0 ? drepRequiredPct : null,
      spoRequiredPct: spoRequiredPct > 0 ? spoRequiredPct : null,
      ccRequiredPct: info?.thresholdInfo?.ccRequiredPct ?? null,
      drepThresholdMet,
      spoThresholdMet,
      passingNow,
      ccEligibleCount
    };
  });
}

/** Vote choice as a small integer for packed payloads. */
function voteCode(value) {
  const v = String(value || "").toLowerCase();
  if (v === "yes") return 1;
  if (v === "no") return 2;
  if (v === "abstain") return 3;
  if (v.includes("no_confidence")) return 4;
  return 0;
}

const VOTE_LABEL_BY_CODE = { 0: "Other", 1: "Yes", 2: "No", 3: "Abstain", 4: "No confidence" };

module.exports = {
  EXPIRING_SOON_EPOCHS,
  SHELLEY_EPOCH_START_UNIX,
  EPOCH_DURATION_SECONDS,
  VOTE_LABEL_BY_CODE,
  round2,
  toNum,
  approxCurrentEpochFromNow,
  deriveStatus,
  isAlwaysAbstainSpo,
  isAlwaysNoConfidenceSpo,
  isHardForkAction,
  isNoConfidenceAction,
  hasActiveDrepVotingPower,
  shouldUseNewSpoFormula,
  roleTotalVotes,
  withdrawalAmountAda,
  computeDrepPowerStats,
  computeFallbackVoteStats,
  computeSpoPowerStats,
  computeActionModels,
  voteCode
};
