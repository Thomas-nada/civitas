import { useContext, useEffect, useMemo, useState } from "react";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { WalletContext } from "../context/WalletContext";
import { useEffectiveDrepId } from "../hooks/useEffectiveDrepId";

// Cardano mainnet epoch timing. Shelley epoch 208 began 2020-07-29 21:44:51 UTC.
// Every epoch is exactly 5 days (432000 s), so boundaries keep the same time-of-day.
const SHELLEY_EPOCH_208_START_UNIX = 1596059091;
const EPOCH_SECONDS = 432000;
// Rewards earned during an epoch are distributed at the start of epoch + 2.
const REWARD_DELAY_EPOCHS = 2;

const epochStartMs = (e) => (SHELLEY_EPOCH_208_START_UNIX + (e - 208) * EPOCH_SECONDS) * 1000;
const epochAt = (ms) => 208 + Math.floor((ms / 1000 - SHELLEY_EPOCH_208_START_UNIX) / EPOCH_SECONDS);

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const fmtUtcTime = (ms) =>
  new Date(Math.round(ms / 60000) * 60000)
    .toLocaleTimeString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" });

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
const stripHtml = (value) => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const compactName = (value, max = 72) => {
  const clean = stripHtml(value);
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};
const formatPct = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(2)}%` : "0.00%";
};
const formatAdaShort = (value) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
};

function deriveActionStatus(info) {
  if (!info) return "Unknown";
  if (String(info.outcome || "").toLowerCase() === "pending") return "Active";
  const droppedEpoch = Number(info?.droppedEpoch || 0);
  const expiredEpoch = Number(info?.expiredEpoch || 0);
  const expirationEpoch = Number(info?.expirationEpoch || 0);
  if (droppedEpoch > 0 && expiredEpoch > 0) return expirationEpoch > 0 && droppedEpoch < expirationEpoch ? "Dropped" : "Expired";
  if (droppedEpoch > 0) return expirationEpoch > 0 && droppedEpoch >= expirationEpoch ? "Expired" : "Dropped";
  if (expiredEpoch > 0) return "Expired";
  if (Number(info?.enactedEpoch || 0) > 0) return "Enacted";
  if (Number(info?.ratifiedEpoch || 0) > 0) return "Ratified";
  const governanceType = String(info.governanceType || "").toLowerCase();
  if (governanceType.includes("info action") || governanceType === "info") return "";
  return String(info.outcome || "Unknown");
}

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
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
  const transitionAction = "gov_action1pvv5wmjqhwa4u85vu9f4ydmzu2mgt8n7et967ph2urhx53r70xusqnmm525";
  if (String(proposalId || "") === transitionAction) return true;
  const epoch = Number(submittedEpoch);
  return Number.isFinite(epoch) && epoch >= 534;
}

function buildFallbackVoteStats(payload) {
  const map = new Map();
  function ensure(proposalId) {
    if (!map.has(proposalId)) {
      map.set(proposalId, {
        drep: { yes: 0, no: 0, abstain: 0, noConfidence: 0, other: 0, total: 0 },
        constitutional_committee: { yes: 0, no: 0, abstain: 0, noConfidence: 0, other: 0, total: 0 },
        stake_pool: { yes: 0, no: 0, abstain: 0, noConfidence: 0, other: 0, total: 0 },
        other: { yes: 0, no: 0, abstain: 0, noConfidence: 0, other: 0, total: 0 }
      });
    }
    return map.get(proposalId);
  }
  for (const drep of payload?.dreps || []) {
    for (const vote of drep.votes || []) {
      const stats = ensure(vote.proposalId).drep;
      const v = String(vote.vote || "").toLowerCase();
      if (v === "yes") stats.yes += 1;
      else if (v === "no") stats.no += 1;
      else if (v === "abstain") stats.abstain += 1;
      else if (v.includes("no_confidence")) stats.noConfidence += 1;
      else stats.other += 1;
      stats.total += 1;
    }
  }
  for (const member of payload?.committeeMembers || []) {
    for (const vote of member.votes || []) {
      const stats = ensure(vote.proposalId).constitutional_committee;
      const v = String(vote.vote || "").toLowerCase();
      if (v === "yes") stats.yes += 1;
      else if (v === "no") stats.no += 1;
      else if (v === "abstain") stats.abstain += 1;
      else if (v.includes("no_confidence")) stats.noConfidence += 1;
      else stats.other += 1;
      stats.total += 1;
    }
  }
  return map;
}

function buildDrepPowerStats(payload, proposalInfo) {
  const byProposal = new Map();
  const dreps = payload?.dreps || [];
  const specialDreps = payload?.specialDreps || {};
  const alwaysAbstainId = "drep_always_abstain";
  const alwaysNoConfidenceId = "drep_always_no_confidence";
  const alwaysAbstainPowerAda = Number(specialDreps?.alwaysAbstain?.votingPowerAda || 0);
  const alwaysNoConfidencePowerAda = Number(specialDreps?.alwaysNoConfidence?.votingPowerAda || 0);
  const knownDrepIds = new Set(dreps.map((drep) => drep.id));
  const autoAbstainIds = new Set([alwaysAbstainId]);
  let regularDrepStakeAda = dreps.reduce((sum, drep) => (
    hasActiveDrepVotingPower(drep) ? sum + Number(drep.votingPowerAda || 0) : sum
  ), 0);
  if (knownDrepIds.has(alwaysAbstainId)) {
    regularDrepStakeAda -= Number(dreps.find((drep) => drep.id === alwaysAbstainId)?.votingPowerAda || 0);
  }
  if (knownDrepIds.has(alwaysNoConfidenceId)) {
    regularDrepStakeAda -= Number(dreps.find((drep) => drep.id === alwaysNoConfidenceId)?.votingPowerAda || 0);
  }
  for (const drep of dreps) {
    const votes = drep.votes || [];
    if (votes.length === 0) continue;
    const name = String(drep.name || "").toLowerCase();
    const id = String(drep.id || "").toLowerCase();
    const allAbstain = votes.every((vote) => String(vote.vote || "").toLowerCase() === "abstain");
    if ((name.includes("auto") && name.includes("abstain")) ||
        (name.includes("always") && name.includes("abstain")) ||
        id.includes("always") && id.includes("abstain") ||
        id.includes("auto") && id.includes("abstain") ||
        (allAbstain && (name.includes("abstain") || id.includes("abstain")))) {
      autoAbstainIds.add(drep.id);
    }
  }
  for (const drep of dreps) {
    if (!hasActiveDrepVotingPower(drep)) continue;
    const vp = Number(drep.votingPowerAda || 0);
    for (const vote of drep.votes || []) {
      const proposalId = vote.proposalId;
      if (!byProposal.has(proposalId)) {
        byProposal.set(proposalId, {
          yesPowerAda: 0, noPowerAda: 0, noConfidencePowerAda: 0,
          abstainActivePowerAda: 0, abstainAutoPowerAda: 0,
          noConfidenceAutoPowerAda: 0, otherPowerAda: 0, votedPowerAda: 0
        });
      }
      const stats = byProposal.get(proposalId);
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
    if (!byProposal.has(proposalId)) {
      byProposal.set(proposalId, {
        yesPowerAda: 0, noPowerAda: 0, noConfidencePowerAda: 0,
        abstainActivePowerAda: 0, abstainAutoPowerAda: 0,
        noConfidenceAutoPowerAda: 0, otherPowerAda: 0, votedPowerAda: 0
      });
    }
    const stats = byProposal.get(proposalId);
    if (alwaysAbstainPowerAda > 0) {
      stats.abstainAutoPowerAda += alwaysAbstainPowerAda;
      stats.votedPowerAda += alwaysAbstainPowerAda;
    }
    if (alwaysNoConfidencePowerAda > 0) stats.noConfidenceAutoPowerAda += alwaysNoConfidencePowerAda;
  }
  return {
    regularDrepStakeAda: Math.max(regularDrepStakeAda, 0),
    alwaysAbstainPowerAda,
    alwaysNoConfidencePowerAda,
    byProposal
  };
}

function buildSpoPowerStats(payload, proposalInfo) {
  const byProposal = new Map();
  const proposalIds = Object.keys(proposalInfo || {});
  function ensure(proposalId) {
    if (!byProposal.has(proposalId)) {
      byProposal.set(proposalId, {
        activeYesPowerAda: 0, activeNoPowerAda: 0, activeAbstainPowerAda: 0,
        passiveAlwaysAbstainPowerAda: 0, passiveAlwaysNoConfidencePowerAda: 0, passiveNoVotePowerAda: 0
      });
    }
    return byProposal.get(proposalId);
  }
  for (const spo of payload?.spos || []) {
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

function buildGovernanceActionRows(payload, referenceEpoch) {
  const proposalInfo = payload?.proposalInfo || {};
  const fallbackVoteStats = buildFallbackVoteStats(payload);
  const drepPowerStats = buildDrepPowerStats(payload, proposalInfo);
  const spoPowerStats = buildSpoPowerStats(payload, proposalInfo);
  const committeeMembers = Array.isArray(payload?.committeeMembers) ? payload.committeeMembers : [];
  const committeeMinSize = Number(payload?.thresholdContext?.committeeMinSize || 0);

  return Object.entries(proposalInfo).map(([proposalId, info]) => {
    const status = deriveActionStatus(info);
    const voteStats = info?.voteStats || fallbackVoteStats.get(proposalId) || {};
    const liveNomosModel = info?.nomosModel || null;
    const nomosDrep = liveNomosModel?.drep || null;
    const nomosSpo = liveNomosModel?.spo || null;
    const spoStats = spoPowerStats.byProposal.get(proposalId) || {};
    const powerStats = drepPowerStats.byProposal.get(proposalId) || {};
    const isNoConfidence = isNoConfidenceAction(info?.governanceType);
    const regularDrepStakeAda = Number(drepPowerStats.regularDrepStakeAda || 0);
    const totalActiveStakeAda = regularDrepStakeAda + Number(drepPowerStats.alwaysNoConfidencePowerAda || 0);
    const yesTotalAda = isNoConfidence
      ? Number(powerStats.yesPowerAda || 0) + Number(drepPowerStats.alwaysNoConfidencePowerAda || 0)
      : Number(powerStats.yesPowerAda || 0);
    const noConfidenceTotalAda = isNoConfidence
      ? 0
      : Number(powerStats.noConfidencePowerAda || 0) + Number(powerStats.noConfidenceAutoPowerAda || 0);
    const noTotalAda = Number(powerStats.noPowerAda || 0);
    const notVotedAda = Math.max(
      totalActiveStakeAda - yesTotalAda - noTotalAda - noConfidenceTotalAda - Number(powerStats.abstainActivePowerAda || 0),
      0
    );
    const drepOutcomeBaseAda = Math.max(totalActiveStakeAda - Number(powerStats.abstainActivePowerAda || 0), 0);
    const drepNoSideAda = noTotalAda + noConfidenceTotalAda + notVotedAda;
    const nomosYesAda = toNum(nomosDrep?.yesLovelace) / 1_000_000;
    const nomosNoAda = toNum(nomosDrep?.noLovelace) / 1_000_000;
    const nomosNoConfidenceAda = toNum(nomosDrep?.noConfidenceLovelace ?? nomosDrep?.alwaysNoConfidenceLovelace) / 1_000_000;
    const nomosNotVotedAda = toNum(nomosDrep?.notVotedLovelace) / 1_000_000;
    const nomosActiveAbstainAda = toNum(nomosDrep?.activeAbstainLovelace) / 1_000_000;
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
    const localSpoEffectiveTotalAda = Math.max(
      localSpoActiveYesAda + localSpoActiveNoAda + localSpoActiveAbstainAda +
      localSpoPassiveAlwaysAbstainAda + localSpoPassiveAlwaysNoConfidenceAda + localSpoPassiveNoVoteAda,
      0
    );
    let localSpoYesAda = 0;
    let localSpoNoAda = 0;
    let localSpoAbstainAda = 0;
    let localSpoNotVotedAda = Math.max(localSpoPassiveNoVoteAda, 0);
    let localSpoOutcomeDenAda = 0;
    if (shouldUseNewSpoFormula(proposalId, info?.submittedEpoch)) {
      let localSpoNotVotedCalcAda = localSpoNotVotedAda;
      if (isHardForkAction(info?.governanceType)) {
        localSpoYesAda = localSpoActiveYesAda;
        localSpoAbstainAda = localSpoActiveAbstainAda;
        localSpoNotVotedCalcAda = localSpoNotVotedAda + localSpoPassiveAlwaysNoConfidenceAda + localSpoPassiveAlwaysAbstainAda;
      } else if (isNoConfidenceAction(info?.governanceType)) {
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
    const spoYesAda = useNomosSpo ? toNum(nomosSpo?.yesLovelace) / 1_000_000 : localSpoYesAda;
    const spoNoAda = useNomosSpo ? toNum(nomosSpo?.noLovelace) / 1_000_000 : localSpoNoAda;
    const spoOutcomeDenAda = useNomosSpo ? Math.max(spoYesAda + spoNoAda, 0) : localSpoOutcomeDenAda;
    const spoYesPct = useNomosSpo ? toNum(nomosSpo?.yesPct) : (spoOutcomeDenAda > 0 ? (spoYesAda / spoOutcomeDenAda) * 100 : null);
    const spoNoPct = useNomosSpo ? toNum(nomosSpo?.noPct) : (spoOutcomeDenAda > 0 ? (spoNoAda / spoOutcomeDenAda) * 100 : null);

    const submittedEpoch = Number(info?.submittedEpoch || 0);
    const activeNowCommitteeCount = committeeMembers.filter((member) => String(member?.status || "").toLowerCase() === "active").length;
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
    const epochsUntilExpiration = expirationEpoch && referenceEpoch ? expirationEpoch - referenceEpoch : null;

    return {
      proposalId,
      actionName: info?.actionName || proposalId,
      governanceType: info?.governanceType || "Unknown",
      outcome: info?.outcome || "Unknown",
      status,
      voteStats,
      submittedEpoch: info?.submittedEpoch || null,
      expirationEpoch,
      epochsUntilExpiration,
      ratifiedEpoch: info?.ratifiedEpoch,
      enactedEpoch: info?.enactedEpoch,
      droppedEpoch: info?.droppedEpoch,
      expiredEpoch: info?.expiredEpoch,
      drepYesPowerPct: drepYesPct,
      drepNoPowerPct: drepNoPct,
      spoYesPct,
      spoNoPct,
      drepRequiredPct: drepRequiredPct > 0 ? drepRequiredPct : null,
      spoRequiredPct: spoRequiredPct > 0 ? spoRequiredPct : null,
      ccRequiredPct: info?.thresholdInfo?.ccRequiredPct ?? null,
      ccEligibleCount,
      drepYesPowerAda: useNomos ? nomosYesAda : yesTotalAda,
      drepNoPowerAda: useNomos ? nomosNoAda : noTotalAda,
      drepNoConfidencePowerAda: useNomos ? nomosNoConfidenceAda : noConfidenceTotalAda,
      drepNotVotedPowerAda: useNomos ? nomosNotVotedAda : notVotedAda,
      drepAbstainActivePowerAda: useNomos ? nomosActiveAbstainAda : Number(powerStats.abstainActivePowerAda || 0),
      totalActiveStakeAda: useNomos
        ? nomosYesAda + nomosNoAda + nomosNoConfidenceAda + nomosNotVotedAda + nomosActiveAbstainAda
        : totalActiveStakeAda,
      spoYesAda,
      spoNoAda,
      spoAbstainAda: useNomosSpo
        ? (toNum(nomosSpo?.activeAbstainLovelace) + toNum(nomosSpo?.alwaysAbstainLovelace)) / 1_000_000
        : localSpoAbstainAda,
      spoNotVotedAda: useNomosSpo ? toNum(nomosSpo?.notVotedLovelace) / 1_000_000 : localSpoNotVotedAda
    };
  });
}

function voteSlices(stats) {
  const yes = Number(stats?.yes || 0);
  const no = Number(stats?.no || 0);
  const abstain = Number(stats?.abstain || 0);
  const other = Number(stats?.noConfidence || 0) + Number(stats?.other || 0);
  return { yes, no, abstain, other, total: yes + no + abstain + other };
}

function pctPair(currentPct, requiredPct) {
  if (requiredPct === null || requiredPct === undefined) return null;
  const current = Number(currentPct);
  const required = Number(requiredPct);
  if (!Number.isFinite(required)) return null;
  return `${Number.isFinite(current) ? current.toFixed(2) : "0.00"}%/${required.toFixed(2)}%`;
}

function votingPercentages(info) {
  const ccStats = voteSlices(info?.voteStats?.constitutional_committee || {});
  const ccDen = Math.max(Number(info?.ccEligibleCount || 0), ccStats.total, 1);
  const ccPct = (ccStats.yes / ccDen) * 100;
  const parts = [
    info?.drepRequiredPct != null ? `DRep ${pctPair(info?.drepYesPowerPct, info?.drepRequiredPct)}` : null,
    info?.ccRequiredPct != null ? `CC ${pctPair(ccPct, info?.ccRequiredPct)}` : null,
    info?.spoRequiredPct != null ? `SPO ${pctPair(info?.spoYesPct, info?.spoRequiredPct)}` : null
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "no voting threshold";
}

function actionSupportRows(row) {
  const ccStats = voteSlices(row?.voteStats?.constitutional_committee || {});
  const ccDen = Math.max(Number(row?.ccEligibleCount || 0), ccStats.total, 1);
  const ccPct = (ccStats.yes / ccDen) * 100;
  return [
    row?.drepRequiredPct != null ? {
      key: "drep",
      label: "DRep",
      currentPct: row.drepYesPowerPct,
      requiredPct: row.drepRequiredPct,
      yes: `${formatAdaShort(row.drepYesPowerAda)} ada`,
      no: `${formatAdaShort(Number(row.drepNoPowerAda || 0) + Number(row.drepNoConfidencePowerAda || 0) + Number(row.drepNotVotedPowerAda || 0))} ada`,
      meta: `Active base ${formatAdaShort(row.totalActiveStakeAda)} ada`
    } : null,
    row?.ccRequiredPct != null ? {
      key: "cc",
      label: "CC",
      currentPct: ccPct,
      requiredPct: row.ccRequiredPct,
      yes: `${ccStats.yes}`,
      no: `${ccStats.no}`,
      meta: `${ccStats.yes + ccStats.no + ccStats.abstain}/${row.ccEligibleCount || ccStats.total || 0} cast/eligible`
    } : null,
    row?.spoRequiredPct != null ? {
      key: "spo",
      label: "SPO",
      currentPct: row.spoYesPct,
      requiredPct: row.spoRequiredPct,
      yes: `${formatAdaShort(row.spoYesAda)} ada`,
      no: `${formatAdaShort(row.spoNoAda)} ada`,
      meta: `Not voted ${formatAdaShort(row.spoNotVotedAda)} ada`
    } : null
  ].filter(Boolean);
}

function isInfoAction(row) {
  const type = String(row?.governanceType || "").toLowerCase();
  return type.includes("info action") || type === "info";
}

function eventLabel(type, row, referenceEpoch) {
  const name = compactName(row?.actionName || "Governance action", 96);
  const pct = votingPercentages(row);
  const expirationEpoch = Number(row?.expirationEpoch || 0);
  const epochsLeft = expirationEpoch && referenceEpoch ? Math.max(0, expirationEpoch - referenceEpoch) : null;
  const suffix = epochsLeft == null ? "" : ` - expires in ${plural(epochsLeft, "more epoch")}`;
  if (type === "submitted") return `Submitted: ${name}`;
  if (type === "voting") return `Voting: ${name} ${pct}${suffix}`;
  if (type === "expires") return `Expires: ${name} ${pct}`;
  if (type === "expired") return `Expired: ${name} ${pct}`;
  if (type === "dropped") return `Dropped: ${name} ${pct}`;
  if (type === "ratified") return `Ratified: ${name} ${pct}`;
  if (type === "enacted") return `Enacted: ${name}`;
  return `${name} ${pct}`;
}

function addEpochEvent(map, epoch, type, row, referenceEpoch, voted = false) {
  if (!Number.isFinite(epoch) || epoch <= 0) return;
  if (!map.has(epoch)) map.set(epoch, []);
  map.get(epoch).push({
    proposalId: row.proposalId,
    type,
    label: eventLabel(type, row, referenceEpoch),
    row,
    voted
  });
}

const EVENT_DETAIL_RANK = { submitted: 1, voting: 2, expires: 3, expired: 4, dropped: 5, ratified: 6, enacted: 7 };
const EVENT_PREVIEW_RANK = { expires: 1, expired: 2, dropped: 3, ratified: 4, enacted: 5, submitted: 6, voting: 7 };

function filterVotesAtBoundary(rows, boundaryUnix, includeUntimedVotes) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    ...row,
    votes: (Array.isArray(row?.votes) ? row.votes : []).filter((vote) => {
      const votedAtUnix = Number(vote?.votedAtUnix || 0);
      if (votedAtUnix > 0) return votedAtUnix <= boundaryUnix;
      return includeUntimedVotes;
    })
  }));
}

function snapshotPayloadAtEpoch(payload, epoch, referenceEpoch) {
  if (!payload) return payload;
  const includeLiveVotes = epoch >= referenceEpoch;
  const boundaryUnix = Math.floor(epochStartMs(epoch) / 1000);
  const proposalInfo = Object.fromEntries(Object.entries(payload.proposalInfo || {}).map(([proposalId, info]) => {
    const submittedEpoch = Number(info?.submittedEpoch || 0);
    const copy = { ...info };
    if (submittedEpoch > epoch) copy.nomosModel = null;
    if (epoch < referenceEpoch) {
      copy.nomosModel = null;
      copy.voteStats = null;
    }
    return [proposalId, copy];
  }));
  return {
    ...payload,
    proposalInfo,
    dreps: filterVotesAtBoundary(payload.dreps, boundaryUnix, includeLiveVotes),
    committeeMembers: filterVotesAtBoundary(payload.committeeMembers, boundaryUnix, includeLiveVotes),
    spos: filterVotesAtBoundary(payload.spos, boundaryUnix, includeLiveVotes)
  };
}

function eventTypesAtEpoch(row, epoch, referenceEpoch) {
  const submittedEpoch = Number(row?.submittedEpoch || 0);
  const expirationEpoch = Number(row?.expirationEpoch || 0);
  const ratifiedEpoch = Number(row?.ratifiedEpoch || 0);
  const enactedEpoch = Number(row?.enactedEpoch || 0) || (ratifiedEpoch > 0 && !isInfoAction(row) ? ratifiedEpoch + 1 : 0);
  const droppedEpoch = Number(row?.droppedEpoch || 0);
  const expiredEpoch = Number(row?.expiredEpoch || 0) || (String(row?.status || "") === "Expired" ? expirationEpoch : 0);

  if (epoch > referenceEpoch) {
    return String(row?.status || "") === "Active" && expirationEpoch === epoch ? ["expires"] : [];
  }

  const types = [];
  if (submittedEpoch === epoch) types.push("submitted");
  if (expiredEpoch === epoch) types.push("expired");
  if (droppedEpoch === epoch && (!expirationEpoch || droppedEpoch < expirationEpoch)) types.push("dropped");
  if (ratifiedEpoch === epoch) types.push("ratified");
  if (enactedEpoch === epoch) types.push("enacted");

  const terminalEpochs = [ratifiedEpoch, expiredEpoch, droppedEpoch, expirationEpoch]
    .filter((n) => Number.isFinite(n) && n > 0);
  const terminalEpoch = terminalEpochs.length ? Math.min(...terminalEpochs) : 0;
  const isVotingAtBoundary =
    submittedEpoch > 0 &&
    submittedEpoch < epoch &&
    (!terminalEpoch || epoch < terminalEpoch);
  if (isVotingAtBoundary) types.push("voting");
  return types;
}

function buildActionEvents(payload, currentRows, referenceEpoch, visibleEpochs, votedProposalIds) {
  const map = new Map();
  const currentById = new Map((currentRows || []).map((row) => [row.proposalId, row]));
  for (const epoch of visibleEpochs || []) {
    const snapshotRows = epoch <= referenceEpoch
      ? buildGovernanceActionRows(snapshotPayloadAtEpoch(payload, epoch, referenceEpoch), epoch)
      : currentRows;
    const snapshotById = new Map((snapshotRows || []).map((row) => [row.proposalId, row]));
    for (const currentRow of currentRows || []) {
      const types = eventTypesAtEpoch(currentRow, epoch, referenceEpoch);
      if (types.length === 0) continue;
      const row = snapshotById.get(currentRow.proposalId) || currentById.get(currentRow.proposalId) || currentRow;
      const voted = Boolean(votedProposalIds?.has(currentRow.proposalId));
      for (const type of types) addEpochEvent(map, epoch, type, row, epoch, voted);
    }
  }
  for (const items of map.values()) {
    items.sort((a, b) => {
      const typeDelta = (EVENT_DETAIL_RANK[a.type] || 99) - (EVENT_DETAIL_RANK[b.type] || 99);
      if (typeDelta !== 0) return typeDelta;
      return a.label.localeCompare(b.label);
    });
  }
  return map;
}

function sortedPreviewEvents(events) {
  return [...(events || [])].sort((a, b) => {
    const typeDelta = (EVENT_PREVIEW_RANK[a.type] || 99) - (EVENT_PREVIEW_RANK[b.type] || 99);
    if (typeDelta !== 0) return typeDelta;
    return a.label.localeCompare(b.label);
  });
}

function previewEventsForCell(events, limit) {
  const sorted = sortedPreviewEvents(events);
  const picked = [];
  const used = new Set();
  for (const event of sorted) {
    if (picked.length >= limit) break;
    if (used.has(event.type)) continue;
    picked.push(event);
    used.add(event.type);
  }
  for (const event of sorted) {
    if (picked.length >= limit) break;
    if (picked.includes(event)) continue;
    picked.push(event);
  }
  return picked;
}

function eventSummary(events) {
  const counts = (events || []).reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});
  const parts = [
    counts.expires ? `${counts.expires} expiring` : null,
    counts.expired ? `${counts.expired} expired` : null,
    counts.dropped ? `${counts.dropped} dropped` : null,
    counts.ratified ? `${counts.ratified} ratified` : null,
    counts.enacted ? `${counts.enacted} enacted` : null,
    counts.submitted ? `${counts.submitted} submitted` : null,
    counts.voting ? `${counts.voting} voting` : null
  ].filter(Boolean);
  return parts.slice(0, 3).join(" · ");
}

function downloadIcs(filename, content) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Map of local-date key -> epoch number for every epoch boundary in [startMs, endMs].
function epochBoundariesInRange(startMs, endMs) {
  const map = {};
  let e = epochAt(startMs) - 1;
  while (epochStartMs(e) <= endMs) {
    const bMs = epochStartMs(e);
    if (bMs >= startMs && bMs <= endMs) map[dayKey(new Date(bMs))] = e;
    e++;
  }
  return map;
}

// 42-cell (6 week) grid of local Date objects for the given month.
function buildMonthGrid(year, month) {
  const startDow = new Date(year, month, 1).getDay();
  const gridStart = new Date(year, month, 1 - startDow);
  return Array.from({ length: 42 }, (_, i) =>
    new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
}

function CountdownHeader({ now }) {
  const currentEpoch = epochAt(now);
  const endMs = epochStartMs(currentEpoch + 1);
  const remaining = Math.max(0, endMs - now);
  const totalSec = Math.floor(remaining / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const localStr = new Date(endMs).toLocaleString(undefined, {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const utcStr = new Date(endMs).toLocaleString("en-US", {
    timeZone: "UTC", weekday: "short", year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  const units = [
    { label: days === 1 ? "Day" : "Days", value: days },
    { label: hours === 1 ? "Hour" : "Hours", value: hours },
    { label: minutes === 1 ? "Minute" : "Minutes", value: minutes },
    { label: seconds === 1 ? "Second" : "Seconds", value: seconds },
  ];

  return (
    <div className="ec-countdown panel">
      <div className="ec-countdown-left">
        <h2 className="ec-countdown-title">Current Epoch {currentEpoch} ends:</h2>
        <div className="ec-countdown-times">
          <div><span className="ec-time-label">Local</span> {localStr}</div>
          <div><span className="ec-time-label">UTC</span> {utcStr} UTC</div>
        </div>
      </div>
      <div className="ec-countdown-units">
        {units.map((u) => (
          <div key={u.label} className="ec-unit">
            <div className="ec-unit-value">{u.value}</div>
            <div className="ec-unit-label">{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EpochDetails({ epoch, events, expandedTypes, onToggleType, onOpenEvent }) {
  if (!epoch) return null;
  const grouped = events.reduce((acc, event) => {
    if (!acc[event.type]) acc[event.type] = [];
    acc[event.type].push(event);
    return acc;
  }, {});
  const orderedTypes = ["submitted", "voting", "expires", "expired", "dropped", "ratified", "enacted"].filter((type) => grouped[type]?.length);
  return (
    <section className="ec-detail panel">
      <div className="ec-detail-head">
        <div>
          <h2>Epoch {epoch}</h2>
          <p className="muted">
            Starts {new Date(epochStartMs(epoch)).toLocaleString(undefined, {
              year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
            })} local · {fmtUtcTime(epochStartMs(epoch))} UTC
          </p>
        </div>
        <div className="ec-detail-count">{events.length} action{events.length === 1 ? "" : "s"}</div>
      </div>
      {orderedTypes.length > 0 ? (
        <div className="ec-detail-groups">
          {orderedTypes.map((type) => {
            const isOpen = expandedTypes[type] !== false;
            return (
              <section key={type} className="ec-detail-group">
                <button type="button" className="ec-detail-group-head" onClick={() => onToggleType(type)}>
                  <span className={`ec-detail-dot ec-detail-dot-${type}`} />
                  <strong>{type}</strong>
                  <span>{grouped[type].length}</span>
                  <span className="ec-detail-chevron">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen ? (
                  <div className="ec-detail-list">
                    {grouped[type].map((event, index) => (
                      <button
                        type="button"
                        key={`${event.proposalId}-${event.type}-${index}`}
                        className={`ec-detail-item ec-detail-${event.type}`}
                        onClick={() => onOpenEvent(event)}
                      >
                        <span className="ec-detail-type">{event.type}</span>
                        <span className="ec-detail-copy">{event.label}</span>
                        {event.voted ? <span className="ec-voted-mark" title="Your DRep has voted on this action">✓ Voted</span> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : (
        <p className="muted ec-detail-empty">No governance action events mapped to this epoch.</p>
      )}
    </section>
  );
}

function ActionModal({ event, onClose }) {
  if (!event) return null;
  const row = event.row || {};
  const supportRows = actionSupportRows(row);
  const status = row.status || "Unknown";
  return (
    <div className="ec-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="ec-modal" role="dialog" aria-modal="true" aria-label="Governance action details" onClick={(e) => e.stopPropagation()}>
        <div className="ec-modal-head">
          <div>
            <span className={`ec-modal-kicker ec-modal-kicker-${event.type}`}>{event.type}</span>
            {event.voted ? <span className="ec-voted-mark" title="Your DRep has voted on this action">✓ Voted</span> : null}
            <h2>{row.actionName || "Governance action"}</h2>
            <p className="muted">{row.governanceType || "Unknown type"} · {status}</p>
          </div>
          <button type="button" className="ec-modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>

        <div className="ec-modal-summary">{event.label}</div>

        {supportRows.length > 0 ? (
          <div className="ec-support-grid">
            {supportRows.map((support) => {
              const pct = Math.max(0, Math.min(Number(support.currentPct || 0), 100));
              const req = Math.max(0, Math.min(Number(support.requiredPct || 0), 100));
              return (
                <article key={support.key} className="ec-support-card">
                  <div className="ec-support-title">
                    <strong>{support.label}</strong>
                    <span>{formatPct(support.currentPct)} / {formatPct(support.requiredPct)}</span>
                  </div>
                  <div className="ec-support-track">
                    <span className="ec-support-fill" style={{ width: `${pct}%` }} />
                    <span className="ec-support-threshold" style={{ left: `${req}%` }} />
                  </div>
                  <div className="ec-support-meta">
                    <span>Yes {support.yes}</span>
                    <span>No side {support.no}</span>
                  </div>
                  <p className="muted">{support.meta}</p>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="muted ec-modal-note">No voting threshold is available for this action.</p>
        )}

        <div className="ec-modal-facts">
          <div><span>Submitted</span><strong>{row.submittedEpoch ? `Epoch ${row.submittedEpoch}` : "Unknown"}</strong></div>
          <div><span>Expires</span><strong>{row.expirationEpoch ? `Epoch ${row.expirationEpoch}` : "Unknown"}</strong></div>
          <div><span>Ratified</span><strong>{row.ratifiedEpoch ? `Epoch ${row.ratifiedEpoch}` : "Not yet"}</strong></div>
          <div><span>Enacted</span><strong>{row.enactedEpoch ? `Epoch ${row.enactedEpoch}` : isInfoAction(row) ? "N/A" : "Not yet"}</strong></div>
        </div>

        <div className="ec-modal-actions">
          <a href={`/actions/${encodeURIComponent(row.proposalId || "")}`} className="ec-modal-link">Open Governance Action</a>
          <button type="button" className="ec-modal-secondary" onClick={onClose}>Close</button>
        </div>
      </section>
    </div>
  );
}

function EpochActionsModal({ epoch, events, onClose, onOpenEvent }) {
  if (!epoch) return null;
  const previewEvents = sortedPreviewEvents(events);
  return (
    <div className="ec-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="ec-modal ec-epoch-modal" role="dialog" aria-modal="true" aria-label={`Epoch ${epoch} actions`} onClick={(e) => e.stopPropagation()}>
        <div className="ec-modal-head">
          <div>
            <span className="ec-modal-kicker ec-modal-kicker-voting">Epoch {epoch}</span>
            <h2>All action events</h2>
            <p className="muted">{events.length} action event{events.length === 1 ? "" : "s"} mapped to this epoch</p>
          </div>
          <button type="button" className="ec-modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        {previewEvents.length > 0 ? (
          <div className="ec-epoch-modal-list">
            {previewEvents.map((event, index) => (
              <button
                type="button"
                key={`${event.proposalId}-${event.type}-${index}`}
                className={`ec-epoch-modal-row ec-detail-${event.type}`}
                onClick={() => onOpenEvent(event)}
              >
                <span className={`ec-detail-dot ec-detail-dot-${event.type}`} />
                <strong>{event.type}</strong>
                <span>{event.label}</span>
                {event.voted ? <span className="ec-voted-mark" title="Your DRep has voted on this action">✓ Voted</span> : null}
              </button>
            ))}
          </div>
        ) : (
          <p className="muted ec-detail-empty">No governance action events mapped to this epoch.</p>
        )}
      </section>
    </div>
  );
}

function MonthGrid({ year, month, now, actionEvents, selectedEpoch, onSelectEpoch, onOpenEvent, onOpenEpochEvents, compact = false }) {
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const boundaries = useMemo(
    () => epochBoundariesInRange(cells[0].getTime(), cells[41].getTime() + 86400000),
    [cells]
  );
  const todayKey = dayKey(new Date(now));

  return (
    <div className={`ec-grid${compact ? " ec-grid-compact" : ""}`}>
      {WEEKDAYS.map((d) => (
        <div key={d} className="ec-weekday">{d}</div>
      ))}
      {cells.map((d, i) => {
        const inMonth = d.getMonth() === month;
        const isToday = dayKey(d) === todayKey;
        const epoch = boundaries[dayKey(d)];
        const isPast = epoch != null && epochStartMs(epoch) <= now;
        const stateClass = epoch == null ? "" : isPast ? " ec-cell-past" : " ec-cell-future";
        const actions = epoch != null ? (actionEvents.get(epoch) || []) : [];
        const previewLimit = compact ? 2 : 3;
        const previewActions = previewEventsForCell(actions, previewLimit);
        const summary = eventSummary(actions);
        const isSelected = epoch != null && epoch === selectedEpoch;
        return (
          <div
            key={i}
            className={`ec-cell${inMonth ? "" : " ec-cell-out"}${isToday ? " ec-cell-today" : ""}${stateClass}${isSelected ? " ec-cell-selected" : ""}${epoch != null ? " ec-cell-clickable" : ""}`}
            role={epoch != null ? "button" : undefined}
            tabIndex={epoch != null ? 0 : undefined}
            onClick={epoch != null ? () => onSelectEpoch(epoch) : undefined}
            onKeyDown={epoch != null ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectEpoch(epoch);
              }
            } : undefined}
          >
            <span className="ec-daynum">{d.getDate()}</span>
            {isToday && epoch == null ? <div className="ec-today-tag">Today</div> : null}
            {epoch != null ? (
              <div className="ec-epoch">
                <div className="ec-epoch-num">Epoch <strong>{epoch}</strong></div>
                <div className="ec-epoch-time">{fmtUtcTime(epochStartMs(epoch))} UTC</div>
                <div className="ec-epoch-note">
                  Epoch {epoch - REWARD_DELAY_EPOCHS} rewards distributed
                </div>
                {actions.length > 0 ? (
                  <div className="ec-action-list">
                    {summary ? <div className="ec-action-summary">{summary}</div> : null}
                    {previewActions.map((event, index) => (
                      <button
                        type="button"
                        key={`${event.proposalId}-${event.type}-${index}`}
                        className={`ec-action-chip ec-action-${event.type}${event.voted ? " ec-action-voted" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEvent(event);
                        }}
                      >
                        {event.voted ? <span className="ec-voted-mark" title="Your DRep has voted on this action">✓</span> : null}
                        {compactName(event.label, compact ? 34 : 54)}
                      </button>
                    ))}
                    {actions.length > previewActions.length ? (
                      <button
                        type="button"
                        className="ec-action-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEpoch(epoch);
                          onOpenEpochEvents(epoch);
                        }}
                      >
                        +{actions.length - previewActions.length} more
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {isToday ? <div className="ec-today-inline">Today</div> : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

async function copyTextToClipboard(value) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the older selection-based copy path.
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    document.body.removeChild(textarea);
  }
  return copied;
}

function GoogleCalendarHelpModal({ feedUrl, copyStatus, copyFlash, onClose, onCopy }) {
  if (!feedUrl) return null;
  return (
    <div className="ec-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="ec-modal ec-google-feed-modal" role="dialog" aria-modal="true" aria-label="Google Calendar feed instructions" onClick={(e) => e.stopPropagation()}>
        <div className="ec-modal-head">
          <div>
            <span className="ec-modal-kicker ec-modal-kicker-voting">Google Calendar feed</span>
            <h3>Feed URL copied</h3>
          </div>
          <button type="button" className="ec-modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>

        <div className="ec-google-feed-copy">
          <span>{copyStatus || "Feed URL copied to clipboard"}</span>
          <input readOnly value={feedUrl} onFocus={(event) => event.currentTarget.select()} />
          <button type="button" className={`ec-modal-secondary ${copyFlash ? "copied" : ""}`} onClick={onCopy}>
            {copyFlash ? "Copied!" : "Copy again"}
          </button>
        </div>

        <ol className="ec-google-feed-steps">
          <li>In Google Calendar, use <strong>Other calendars</strong> and choose <strong>From URL</strong>.</li>
          <li>Paste the copied Civitas feed URL into the calendar address field.</li>
          <li>Click <strong>Add calendar</strong>. Google will keep checking the live feed for updates.</li>
        </ol>

        <div className="ec-modal-actions">
          <a href="https://calendar.google.com/calendar/u/0/r/settings/addbyurl" target="_blank" rel="noreferrer" className="ec-modal-link">Open Google Calendar</a>
          <button type="button" className="ec-modal-secondary" onClick={onClose}>Done</button>
        </div>
      </section>
    </div>
  );
}

export default function EpochCalendarPage() {
  useSeoMeta({
    title: "Epoch Calendar",
    description: "Cardano epoch boundaries, reward distribution dates, and a live countdown to the next epoch.",
  });

  const [now, setNow] = useState(() => Date.now());
  const [actionsPayload, setActionsPayload] = useState(null);
  const [actionsError, setActionsError] = useState("");
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/accountability?view=actions")
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) throw new Error(data?.error || "Failed to load live actions.");
        setActionsPayload(data);
      })
      .catch((error) => {
        if (!cancelled) setActionsError(error.message || "Failed to load live actions.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [mode, setMode] = useState("month"); // "month" | "multi"
  const [selectedEpoch, setSelectedEpoch] = useState(() => epochAt(Date.now()));
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [popupEpoch, setPopupEpoch] = useState(null);
  const [expandedTypes, setExpandedTypes] = useState({});
  const [calendarNotice, setCalendarNotice] = useState("");
  const [calendarHelpOpen, setCalendarHelpOpen] = useState(false);
  const [calendarCopied, setCalendarCopied] = useState(false);
  const [calendarCopyStatus, setCalendarCopyStatus] = useState("");
  const [calendarCopyFlash, setCalendarCopyFlash] = useState(false);
  const calendarFeedUrl = `${window.location.origin}/api/epoch-calendar.ics`;

  useEffect(() => {
    if (!selectedEvent && !popupEpoch && !calendarHelpOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedEvent(null);
        setPopupEpoch(null);
        setCalendarHelpOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedEvent, popupEpoch, calendarHelpOpen]);

  function shiftMonth(delta) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }
  function goToday() {
    const d = new Date();
    setView({ year: d.getFullYear(), month: d.getMonth() });
    setSelectedEpoch(epochAt(Date.now()));
  }

  const multiMonths = useMemo(() => {
    const span = mode === "multi" ? 3 : 1;
    return Array.from({ length: span }, (_, i) => {
      const d = new Date(view.year, view.month + i, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }, [view, mode]);

  const visibleEpochs = useMemo(() => {
    const first = multiMonths[0];
    const last = multiMonths[multiMonths.length - 1];
    const start = new Date(first.year, first.month, 1).getTime();
    const end = new Date(last.year, last.month + 1, 0, 23, 59, 59, 999).getTime();
    const epochs = [];
    let epoch = epochAt(start) - 1;
    while (epochStartMs(epoch) <= end) {
      if (epochStartMs(epoch) >= start) epochs.push(epoch);
      epoch++;
    }
    return epochs;
  }, [multiMonths]);

  const referenceEpoch = Number(actionsPayload?.latestEpoch || 0) || epochAt(now);
  const actionRows = useMemo(
    () => buildGovernanceActionRows(actionsPayload, referenceEpoch),
    [actionsPayload, referenceEpoch]
  );
  const wallet = useContext(WalletContext);
  const effectiveDrepId = useEffectiveDrepId(wallet);
  const votedProposalIds = useMemo(() => {
    if (!effectiveDrepId || !Array.isArray(actionsPayload?.dreps)) return new Set();
    const target = effectiveDrepId.toLowerCase();
    const drep = actionsPayload.dreps.find((d) => String(d?.id || "").toLowerCase() === target);
    return new Set((drep?.votes || []).map((v) => String(v?.proposalId || "")));
  }, [effectiveDrepId, actionsPayload]);
  const actionEvents = useMemo(
    () => buildActionEvents(actionsPayload, actionRows, referenceEpoch, visibleEpochs, votedProposalIds),
    [actionsPayload, actionRows, referenceEpoch, visibleEpochs, votedProposalIds]
  );
  const effectiveSelectedEpoch = visibleEpochs.includes(selectedEpoch)
    ? selectedEpoch
    : (visibleEpochs[0] || selectedEpoch);
  const selectedEvents = actionEvents.get(effectiveSelectedEpoch) || [];
  const popupEvents = popupEpoch ? (actionEvents.get(popupEpoch) || []) : [];
  const visibleActionCount = useMemo(
    () => visibleEpochs.reduce((sum, epoch) => sum + (actionEvents.get(epoch)?.length || 0), 0),
    [visibleEpochs, actionEvents]
  );

  async function copyCalendarFeedUrl(statusPrefix = "Feed URL", repeated = false) {
    const copied = await copyTextToClipboard(calendarFeedUrl);
    setCalendarCopied(copied);
    setCalendarCopyStatus(copied
      ? `${repeated ? "Copied again" : statusPrefix} at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
      : "Copy failed. Select the URL field and copy it manually.");
    setCalendarCopyFlash(copied);
    if (copied) {
      window.setTimeout(() => setCalendarCopyFlash(false), 1400);
    }
    return copied;
  }

  async function importVisibleCalendar() {
    // Single source of truth: the server feed, which auto-reflects the live
    // Civitas calendar each epoch. Subscribing to it (not importing a file) is
    // what keeps Google Calendar mirrored.
    const onLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (!onLocalhost) {
      await copyCalendarFeedUrl("Feed URL");
      setCalendarHelpOpen(true);
      setCalendarNotice("Civitas copied the calendar feed URL. Open Google Calendar when you're ready, then paste it into the From URL field and click Add calendar.");
      return;
    }
    // Google's servers can't reach localhost, so a live subscription isn't
    // possible here. Download the real feed so you can test a one-time import;
    // use the deployed URL with "From URL" for an auto-updating mirror.
    try {
      const res = await fetch(calendarFeedUrl);
      if (!res.ok) throw new Error("feed unavailable");
      const content = await res.text();
      downloadIcs("cardano-epoch-calendar.ics", content);
      setCalendarNotice("Downloaded the live feed as a file (one-time import test). For an auto-updating mirror you must deploy Civitas and subscribe to the feed URL — Google can't read localhost.");
    } catch {
      setCalendarNotice("Couldn't fetch the feed — make sure the Civitas server is running.");
    }
  }
  function toggleType(type) {
    setExpandedTypes((prev) => ({ ...prev, [type]: prev[type] === false }));
  }

  return (
    <main className="shell ec-page">
      <CountdownHeader now={now} />

      <div className="ec-toolbar">
        <h1 className="ec-month-title">
          {mode === "multi"
            ? `${MONTHS[multiMonths[0].month].slice(0, 3)} – ${MONTHS[multiMonths[multiMonths.length - 1].month].slice(0, 3)} ${multiMonths[multiMonths.length - 1].year}`
            : `${MONTHS[view.month]} ${view.year}`}
        </h1>

        <div className="ec-mode-toggle">
          <button type="button" className={mode === "month" ? "active" : ""} onClick={() => setMode("month")}>Month</button>
          <button type="button" className={mode === "multi" ? "active" : ""} onClick={() => setMode("multi")}>Multi-Month</button>
        </div>

        <div className="ec-nav">
          <button type="button" className={`ec-import-btn ${calendarCopied ? "copied" : ""}`} onClick={importVisibleCalendar}>
            {calendarCopied ? "Feed copied" : "Google Calendar feed"}
          </button>
          <button type="button" className="ec-today-btn" onClick={goToday}>today</button>
          <div className="ec-arrows">
            <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}>‹</button>
            <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)}>›</button>
          </div>
        </div>
      </div>

      {calendarNotice ? (
        <div className="ec-calendar-feed-note" role="status" aria-live="polite">
          <span>{calendarNotice}</span>
          <input readOnly value={calendarFeedUrl} onFocus={(event) => event.currentTarget.select()} />
          {!["localhost", "127.0.0.1"].includes(window.location.hostname) ? (
            <button type="button" onClick={() => setCalendarHelpOpen(true)}>Show steps</button>
          ) : null}
        </div>
      ) : null}

      <div className="ec-legend" aria-label="Calendar event legend">
        {["submitted", "voting", "expires", "expired", "ratified", "enacted"].map((type) => (
          <span key={type} className={`ec-legend-item ec-legend-${type}`}>
            <span />
            {type}
          </span>
        ))}
      </div>

      {multiMonths.map((m) => (
        <section key={`${m.year}-${m.month}`} className="ec-month-block">
          {mode === "multi" ? <h3 className="ec-multi-title">{MONTHS[m.month]} {m.year}</h3> : null}
          <MonthGrid
            year={m.year}
            month={m.month}
            now={now}
            actionEvents={actionEvents}
            selectedEpoch={effectiveSelectedEpoch}
            onSelectEpoch={setSelectedEpoch}
            onOpenEvent={setSelectedEvent}
            onOpenEpochEvents={setPopupEpoch}
            compact={mode === "multi"}
          />
        </section>
      ))}

      <EpochDetails
        epoch={effectiveSelectedEpoch}
        events={selectedEvents}
        expandedTypes={expandedTypes}
        onToggleType={toggleType}
        onOpenEvent={setSelectedEvent}
      />
      <EpochActionsModal
        epoch={popupEpoch}
        events={popupEvents}
        onClose={() => setPopupEpoch(null)}
        onOpenEvent={(event) => {
          setPopupEpoch(null);
          setSelectedEvent(event);
        }}
      />
      <ActionModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      <GoogleCalendarHelpModal
        feedUrl={calendarHelpOpen ? calendarFeedUrl : ""}
        copyStatus={calendarCopyStatus}
        copyFlash={calendarCopyFlash}
        onClose={() => setCalendarHelpOpen(false)}
        onCopy={() => copyCalendarFeedUrl("Feed URL", true)}
      />

      <p className="ec-footnote muted">
        Epochs last 5 days and are shown as boundary points at {fmtUtcTime(epochStartMs(epochAt(now) + 1))} UTC. Staking rewards earned
        during an epoch are distributed at the start of the epoch two cycles later. Google Calendar import uses a live feed on deployed Civitas and a fallback .ics download on localhost.
        {" "}Live action data: {actionsError ? actionsError : `${visibleActionCount} action state ${visibleActionCount === 1 ? "entry" : "entries"} in this view`}.
      </p>
    </main>
  );
}
