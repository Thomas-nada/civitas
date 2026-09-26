// Accountability scoring for DReps, SPOs and committee members, computed in
// the browser from the packed actor payloads (/api/v1/actors/:type). One
// place for the formulas the dashboards, profiles and stats page show, so a
// score reads the same everywhere.

import { isActiveAction } from "./status";

export const DREP_SCORE_WEIGHTS = { attendance: 0.35, transparency: 0.25, consistency: 0.15, responsiveness: 0.1, delegationRisk: 0.15 };
export const SPO_SCORE_WEIGHTS = { attendance: 0.45, transparency: 0.3, consistency: 0.15, responsiveness: 0.1 };
// Attendance and rationale quality weigh the same, as the production site
// has always scored the committee.
export const COMMITTEE_SCORE_WEIGHTS = { attendance: 0.45, rationaleQuality: 0.45 };

export const DREP_DELEGATION_RISK_REFERENCE_SHARE_PCT = 0.9;
export const DREP_DELEGATION_RISK_MEDIUM_CUTOFF = 45;
export const DREP_DELEGATION_RISK_HIGH_CUTOFF = 75;
export const DEFAULT_DREP_PARTICIPATION_START_EPOCH = 534;

export const ALWAYS_ABSTAIN_ID = "drep_always_abstain";
export const ALWAYS_NO_CONFIDENCE_ID = "drep_always_no_confidence";

export function round1(v) {
  return Math.round(Number(v || 0) * 10) / 10;
}

export function formatResponseHours(hours) {
  if (hours === null || hours === undefined || Number.isNaN(hours)) return "N/A";
  if (hours < 24) return `${round1(hours)}h`;
  return `${round1(hours / 24)}d`;
}

export function voteLabelForActor(voteValue, actorType) {
  const normalized = String(voteValue || "").trim().toLowerCase();
  if (!normalized) return "No vote";
  if (actorType === "committee") {
    if (normalized === "yes") return "Constitutional";
    if (normalized === "no") return "Unconstitutional";
  }
  if (normalized === "yes") return "Yes";
  if (normalized === "no") return "No";
  if (normalized === "abstain") return "Abstain";
  if (normalized === "no_confidence" || normalized === "no confidence") return "No confidence";
  return normalized.replace(/_/g, " ");
}

export function isSpoAlwaysAbstainStatus(status) {
  return String(status || "").trim().toLowerCase() === "always abstain";
}

export function delegationConcentrationRiskScore(sharePctActive) {
  const share = Number(sharePctActive || 0);
  if (!Number.isFinite(share) || share <= 0) return 0;
  // ~0.9% active share maps to 100 risk on the current dataset.
  return Math.max(0, Math.min(100, round1((share / DREP_DELEGATION_RISK_REFERENCE_SHARE_PCT) * 100)));
}

export function delegationConcentrationRiskLabel(score) {
  const value = Number(score || 0);
  if (value >= DREP_DELEGATION_RISK_HIGH_CUTOFF) return "High";
  if (value >= DREP_DELEGATION_RISK_MEDIUM_CUTOFF) return "Medium";
  return "Low";
}

/** CC rationale quality (0–100); uses the server's score when present. */
export function scoreCommitteeRationaleQuality(vote) {
  const precomputed = Number(vote?.rationaleQualityScore);
  if (Number.isFinite(precomputed) && precomputed >= 0) return Math.max(0, Math.min(100, precomputed));
  const url = String(vote?.rationaleUrl || "").trim();
  const hasSignal = vote?.hasRationale === true || Boolean(url);
  const bodyLength = Math.max(0, Number(vote?.rationaleBodyLength || 0));
  const sectionCount = Math.max(0, Number(vote?.rationaleSectionCount || 0));
  const bodyLengthBand = bodyLength >= 5900 ? 4 : bodyLength >= 4500 ? 3 : bodyLength >= 3300 ? 2 : bodyLength >= 2000 ? 1 : 0;
  let score = 0;
  if (hasSignal) score += 35;
  if (url) {
    if (/^https?:\/\//i.test(url) || /^ipfs:\/\//i.test(url) || /\/ipfs\//i.test(url)) score += 15;
    if (/\b(bafy[a-z0-9]{20,}|Qm[1-9A-HJ-NP-Za-km-z]{20,})\b/i.test(url)) score += 10;
  }
  score += bodyLengthBand * 8.75;
  if (sectionCount > 0) score += Math.min(5, sectionCount);
  return Math.max(0, Math.min(100, score));
}

export function resolveVoteResponseHours(vote, proposalInfo) {
  if (typeof vote?.responseHours === "number") return vote.responseHours;
  const votedAtUnix = Number(vote?.votedAtUnix || 0);
  const submittedAtUnix = Number(proposalInfo?.[vote?.proposalId]?.submittedAtUnix || 0);
  if (votedAtUnix <= 0 || submittedAtUnix <= 0 || votedAtUnix < submittedAtUnix) return null;
  return (votedAtUnix - submittedAtUnix) / 3600;
}

// Committee term overrides for seats whose on-chain window is not reported.
const CC_TERM_OVERRIDES_BY_HOT = {
  cc_hot1qvr7p6ms588athsgfd0uez5m9rlhwu3g9dt7wcxkjtr4hhsq6ytv2: { seatStartEpoch: 507, expirationEpoch: 596 },
  cc_hot1qv7fa08xua5s7qscy9zct3asaa5a3hvtdc8sxexetcv3unq7cfkq5: { seatStartEpoch: 507, expirationEpoch: 580 },
  cc_hot1qwzuglw5hx3wwr5gjewerhtfhcvz64s9kgam2fgtrj2t7eqs00fzv: { seatStartEpoch: 507, expirationEpoch: 580 },
  cc_hot1qdnedkra2957t6xzzwygdgyefd5ctpe4asywauqhtzlu9qqkttvd9: { seatStartEpoch: 507, expirationEpoch: 580 },
  cc_hot1q0wzkpcxzzfs4mf4yk6yx7d075vqtyx2tnxsr256he6gnwq6yfy5w: { seatStartEpoch: 507, expirationEpoch: 580 },
  cc_hot1qdqp9j44qfnwlkx9h78kts8hvee4ycc7czrw0xl4lqhsw4gcxgkpt: { seatStartEpoch: 507, expirationEpoch: 580 }
};
const CC_TERM_OVERRIDES_BY_NAME = {
  "cardano atlantic council": { seatStartEpoch: 507, expirationEpoch: 596 },
  "intersect constitutional council": { seatStartEpoch: 507, expirationEpoch: 580 },
  emurgo: { seatStartEpoch: 507, expirationEpoch: 580 },
  "cardano foundation": { seatStartEpoch: 507, expirationEpoch: 580 },
  "cardano japan": { seatStartEpoch: 507, expirationEpoch: 580 },
  "input | output": { seatStartEpoch: 507, expirationEpoch: 580 },
  "input output": { seatStartEpoch: 507, expirationEpoch: 580 }
};

function committeeTermOverride(actor) {
  const hot = String(actor?.hotCredential || "").trim().toLowerCase();
  const name = String(actor?.name || "").trim().toLowerCase();
  return CC_TERM_OVERRIDES_BY_HOT[hot] || CC_TERM_OVERRIDES_BY_NAME[name] || null;
}

export function committeeEligibilityWindow(actor, proposalInfo) {
  const override = committeeTermOverride(actor);
  const startEpoch = Number(override?.seatStartEpoch || actor?.seatStartEpoch || 0);
  const endEpoch = Number(override?.expirationEpoch || actor?.expirationEpoch || 0);
  const hasStartEpoch = Number.isFinite(startEpoch) && startEpoch > 0;
  const hasEndEpoch = Number.isFinite(endEpoch) && endEpoch > 0;
  const status = String(actor?.status || "").toLowerCase();
  const voteEpochs = (actor?.votes || [])
    .map((vote) => Number(proposalInfo?.[vote.proposalId]?.submittedEpoch || 0))
    .filter((epoch) => Number.isFinite(epoch) && epoch > 0);
  const lastVoteEpoch = voteEpochs.length > 0 ? Math.max(...voteEpochs) : 0;
  const inferredEndEpoch = (status === "retired" || status === "expired") && !hasEndEpoch && lastVoteEpoch > 0 ? lastVoteEpoch : 0;
  const effectiveEndEpoch = hasEndEpoch && inferredEndEpoch > 0 ? Math.min(endEpoch, inferredEndEpoch) : hasEndEpoch ? endEpoch : inferredEndEpoch;
  const hasEffectiveEndEpoch = Number.isFinite(effectiveEndEpoch) && effectiveEndEpoch > 0;
  return { startEpoch, hasStartEpoch, effectiveEndEpoch, hasEffectiveEndEpoch };
}

export function committeeProposalTerminalEpoch(info) {
  const candidates = [info?.enactedEpoch, info?.ratifiedEpoch, info?.droppedEpoch, info?.expiredEpoch, info?.expirationEpoch]
    .map((x) => Number(x || 0))
    .filter((x) => Number.isFinite(x) && x > 0);
  return candidates.length === 0 ? null : Math.min(...candidates);
}

function isEarlyDropped(info) {
  const dropped = Number(info?.droppedEpoch || 0);
  const expiration = Number(info?.expirationEpoch || 0);
  return dropped > 0 && expiration > 0 && dropped < expiration;
}

/** Participation rules per body: which actions count toward attendance. */
export function makeParticipationRules(proposalInfo, drepParticipationStartEpoch = DEFAULT_DREP_PARTICIPATION_START_EPOCH) {
  const startEpoch = Number(drepParticipationStartEpoch || DEFAULT_DREP_PARTICIPATION_START_EPOCH);
  return {
    drep(proposalId) {
      const info = proposalInfo[proposalId] || {};
      const submittedEpoch = Number(info.submittedEpoch || 0);
      if (submittedEpoch > 0) return submittedEpoch >= startEpoch;
      return Number(info?.voteStats?.drep?.total || 0) > 0;
    },
    spo(proposalId) {
      return Number(proposalInfo[proposalId]?.voteStats?.stake_pool?.total || 0) > 0;
    },
    committee(proposalId) {
      const info = proposalInfo[proposalId] || {};
      const type = String(info?.governanceType || "").toLowerCase();
      if (type.includes("no confidence") || type.includes("new committee")) return false;
      // An action dropped before its natural expiry does not count against CC attendance.
      if (isEarlyDropped(info)) return false;
      return true;
    }
  };
}

/** Merges the Always Abstain / Always No Confidence pseudo-DReps into the list. */
export function mergeSpecialDreps(dreps, specialDreps) {
  const byId = new Map();
  for (const row of Array.isArray(dreps) ? dreps : []) {
    const key = String(row?.id || "").trim().toLowerCase();
    if (key) byId.set(key, row);
  }
  const apply = (specialKey, drepId, fallbackName) => {
    const power = Number(specialDreps?.[specialKey]?.votingPowerAda || 0);
    const existing = byId.get(drepId) || { id: drepId, name: fallbackName, votes: [], votingPowerAda: 0, voteCount: 0 };
    const merged = { ...existing, name: existing.name || fallbackName };
    if (power > 0) merged.votingPowerAda = power;
    byId.set(drepId, merged);
  };
  apply("alwaysAbstain", ALWAYS_ABSTAIN_ID, "Always Abstain");
  apply("alwaysNoConfidence", ALWAYS_NO_CONFIDENCE_ID, "Always No Confidence");
  return Array.from(byId.values());
}

/** Total and active (minus auto-abstain) voting power for a body. */
export function votingPowerTotals(actors, actorType) {
  const total = actors.reduce((sum, a) => sum + Number(a?.votingPowerAda || 0), 0);
  let abstain = 0;
  if (actorType === "drep") abstain = Number(actors.find((a) => String(a?.id || "").toLowerCase() === ALWAYS_ABSTAIN_ID)?.votingPowerAda || 0);
  if (actorType === "spo") abstain = actors.filter((a) => isSpoAlwaysAbstainStatus(a?.delegationStatus)).reduce((sum, a) => sum + Number(a?.votingPowerAda || 0), 0);
  return { total, abstain, active: Math.max(0, total - abstain) };
}

/**
 * Scores every actor. options:
 *   actorType: "drep" | "spo" | "committee"
 *   proposalInfo: id -> { governanceType, outcome, submittedEpoch, submittedAtUnix, voteStats, ...epochs }
 *   selectedAction, selectedTypes (Set), includeActiveActions
 *   include: { attendance, transparency, alignment, responsiveness, delegationRisk }
 *   drepParticipationStartEpoch, powerTotals ({ total, active })
 */
export function scoreActors(actors, options) {
  const {
    actorType, proposalInfo, selectedAction = "", selectedTypes = new Set(), includeActiveActions = true,
    include = {}, drepParticipationStartEpoch, powerTotals
  } = options;
  const isDrep = actorType === "drep";
  const isSpo = actorType === "spo";
  const isCommittee = actorType === "committee";
  const rules = makeParticipationRules(proposalInfo, drepParticipationStartEpoch);
  const totals = powerTotals || votingPowerTotals(actors, actorType);

  const proposalPasses = (proposalId) => {
    const info = proposalInfo[proposalId];
    if (!info) return false;
    if (selectedAction && proposalId !== selectedAction) return false;
    if (!includeActiveActions && isActiveAction(info)) return false;
    if (selectedTypes.size > 0 && !selectedTypes.has(info.governanceType || "Unknown")) return false;
    return true;
  };
  const filteredProposalIds = Object.keys(proposalInfo).filter(proposalPasses);
  const drepEligibleIds = isDrep ? filteredProposalIds.filter(rules.drep) : [];
  const spoEligibleIds = isSpo ? filteredProposalIds.filter(rules.spo) : [];
  const committeeEligibleIds = isCommittee ? filteredProposalIds.filter(rules.committee) : [];

  const weights = isDrep ? DREP_SCORE_WEIGHTS : SPO_SCORE_WEIGHTS;
  const wAttendance = include.attendance !== false ? (isCommittee ? COMMITTEE_SCORE_WEIGHTS.attendance : weights.attendance) : 0;
  const wTransparency = !isCommittee && include.transparency ? weights.transparency : 0;
  const wAlignment = !isCommittee && include.alignment ? weights.consistency : 0;
  const wResponsiveness = !isCommittee && include.responsiveness ? weights.responsiveness : 0;
  const wDelegationRisk = isDrep && include.delegationRisk ? DREP_SCORE_WEIGHTS.delegationRisk : 0;
  const wRationaleQuality = isCommittee && include.alignment ? COMMITTEE_SCORE_WEIGHTS.rationaleQuality : 0;
  const activeWeight = wAttendance + wTransparency + wAlignment + wResponsiveness + wDelegationRisk + wRationaleQuality;

  return actors.map((actor) => {
    const window = isCommittee ? committeeEligibilityWindow(actor, proposalInfo) : null;
    const { startEpoch = 0, hasStartEpoch = false, effectiveEndEpoch = 0, hasEffectiveEndEpoch = false } = window || {};
    const insideSeat = (proposalId) => {
      if (!isCommittee || (!hasStartEpoch && !hasEffectiveEndEpoch)) return true;
      const info = proposalInfo[proposalId] || {};
      const proposalEpoch = Number(info.submittedEpoch || 0);
      if (hasStartEpoch) {
        // An action still open when the seat began is the member's to vote on.
        const closeEpoch = committeeProposalTerminalEpoch(info);
        if (closeEpoch && closeEpoch < startEpoch) return false;
      }
      if (hasEffectiveEndEpoch && proposalEpoch > 0 && proposalEpoch > effectiveEndEpoch) return false;
      return true;
    };

    const votes = (actor.votes || []).filter((vote) => proposalPasses(vote.proposalId) && insideSeat(vote.proposalId));
    const scopedVotes = isDrep ? votes.filter((v) => rules.drep(v.proposalId)) : isSpo ? votes.filter((v) => rules.spo(v.proposalId)) : votes;
    const cast = scopedVotes.length;

    let totalEligibleVotes = selectedAction ? 1 : Math.max(filteredProposalIds.length, 1);
    if (isDrep) totalEligibleVotes = selectedAction ? (drepEligibleIds.includes(selectedAction) ? 1 : 0) : drepEligibleIds.length;
    if (isSpo) totalEligibleVotes = selectedAction ? (spoEligibleIds.includes(selectedAction) ? 1 : 0) : spoEligibleIds.length;
    if (isCommittee) {
      if (hasStartEpoch || hasEffectiveEndEpoch) {
        const voted = new Set(votes.map((v) => v.proposalId));
        let eligible = 0;
        for (const proposalId of committeeEligibleIds) {
          if (!insideSeat(proposalId)) continue;
          if (hasEffectiveEndEpoch && !voted.has(proposalId)) {
            const terminalEpoch = committeeProposalTerminalEpoch(proposalInfo[proposalId]);
            if (!terminalEpoch || terminalEpoch > effectiveEndEpoch) continue;
          }
          eligible += 1;
        }
        totalEligibleVotes = Math.max(eligible, cast, 0);
      } else {
        totalEligibleVotes = Math.max(committeeEligibleIds.length, cast, 0);
      }
    }

    const attendance = totalEligibleVotes > 0 ? (cast / totalEligibleVotes) * 100 : 0;
    const comparable = scopedVotes.filter((v) => { const o = String(v.outcome || "").toLowerCase(); return o === "yes" || o === "no"; });
    const consistencyMatches = comparable.filter((v) => String(v.vote).toLowerCase() === String(v.outcome).toLowerCase()).length;
    const consistencyTotal = comparable.length;
    const consistency = consistencyTotal > 0 ? (consistencyMatches / consistencyTotal) * 100 : 0;
    const responseValues = scopedVotes.map((v) => resolveVoteResponseHours(v, proposalInfo)).filter((v) => v !== null);
    const avgResponseHours = responseValues.length > 0 ? responseValues.reduce((s, v) => s + v, 0) / responseValues.length : null;
    const responsiveness = avgResponseHours === null ? 0 : Math.max(0, 100 - (avgResponseHours / (24 * 30)) * 100);
    const abstainCount = scopedVotes.filter((v) => String(v.vote).toLowerCase() === "abstain").length;
    const abstainRate = cast > 0 ? (abstainCount / cast) * 100 : 0;
    const transparencyCount = isCommittee ? cast : scopedVotes.filter((v) => v.hasRationale !== false).length;
    const transparency = cast > 0 ? (transparencyCount / cast) * 100 : 0;
    const committeeQuality = isCommittee && cast > 0 ? scopedVotes.reduce((sum, v) => sum + scoreCommitteeRationaleQuality(v), 0) / cast : 0;
    const consistencyMetric = isCommittee ? committeeQuality : consistency;

    const power = Number(actor.votingPowerAda || 0);
    const isAutoAbstain = isDrep ? String(actor?.id || "").toLowerCase() === ALWAYS_ABSTAIN_ID : isSpo ? isSpoAlwaysAbstainStatus(actor?.delegationStatus) : false;
    const vpPctTotal = !isCommittee && totals.total > 0 ? (power / totals.total) * 100 : 0;
    const vpPctActive = !isCommittee && !isAutoAbstain && totals.active > 0 ? (power / totals.active) * 100 : 0;
    const delegationRiskScore = isDrep ? delegationConcentrationRiskScore(vpPctActive) : 0;
    const delegationRiskLabel = isDrep ? delegationConcentrationRiskLabel(delegationRiskScore) : "";
    const delegationRiskContribution = isDrep ? Math.max(0, Math.min(100, 100 - delegationRiskScore)) : 0;

    const weighted = isCommittee
      ? attendance * wAttendance + committeeQuality * wRationaleQuality
      : attendance * wAttendance + transparency * wTransparency + consistencyMetric * wAlignment + responsiveness * wResponsiveness + delegationRiskContribution * wDelegationRisk;
    const accountability = activeWeight > 0 ? weighted / activeWeight : 0;

    return {
      ...actor,
      seatStartEpoch: isCommittee && hasStartEpoch ? startEpoch : actor.seatStartEpoch ?? null,
      expirationEpoch: isCommittee && hasEffectiveEndEpoch ? effectiveEndEpoch : actor.expirationEpoch ?? null,
      votes: scopedVotes,
      cast,
      totalEligibleVotes,
      attendance: round1(attendance),
      consistency: round1(consistencyMetric),
      consistencyMatches: isCommittee ? null : consistencyMatches,
      consistencyTotal: isCommittee ? null : consistencyTotal,
      transparencyScore: round1(transparency),
      transparencyCount,
      transparencyTotal: cast,
      abstainRate: round1(abstainRate),
      abstainCount,
      abstainTotal: cast,
      avgResponseHours: avgResponseHours === null ? null : round1(avgResponseHours),
      responseSampleCount: responseValues.length,
      responsiveness: round1(responsiveness),
      accountability: round1(accountability),
      votingPowerPctTotal: vpPctTotal,
      votingPowerPctActive: vpPctActive,
      delegationRiskScore,
      delegationRiskLabel,
      delegationRiskContribution
    };
  });
}

/** The actions an actor could have voted on (for the voted / missed views). */
export function actorActionRows(actor, options) {
  const { actorType, proposalInfo, selectedAction = "", selectedTypes = new Set(), includeActiveActions = true, drepParticipationStartEpoch } = options;
  const rules = makeParticipationRules(proposalInfo, drepParticipationStartEpoch);
  const voteByProposal = new Map((actor?.votes || []).map((vote) => [vote.proposalId, vote]));
  const window = actorType === "committee" ? committeeEligibilityWindow(actor, proposalInfo) : null;
  const eligible = (proposalId) => {
    const info = proposalInfo[proposalId] || {};
    if (actorType === "drep") return rules.drep(proposalId);
    if (actorType === "spo") return rules.spo(proposalId);
    if (!rules.committee(proposalId)) return false;
    const proposalEpoch = Number(info.submittedEpoch || 0);
    if (proposalEpoch > 0) {
      if (window?.hasStartEpoch && proposalEpoch < window.startEpoch) return false;
      if (window?.hasEffectiveEndEpoch && proposalEpoch > window.effectiveEndEpoch) return false;
    }
    if (window?.hasEffectiveEndEpoch && !voteByProposal.has(proposalId)) {
      const terminalEpoch = committeeProposalTerminalEpoch(info);
      if (!terminalEpoch || terminalEpoch > window.effectiveEndEpoch) return false;
    }
    return true;
  };
  return Object.keys(proposalInfo)
    .filter((proposalId) => {
      const info = proposalInfo[proposalId];
      if (selectedAction && proposalId !== selectedAction) return false;
      if (!includeActiveActions && isActiveAction(info)) return false;
      if (selectedTypes.size > 0 && !selectedTypes.has(info.governanceType || "Unknown")) return false;
      return true;
    })
    .map((proposalId) => {
      const info = proposalInfo[proposalId] || {};
      return {
        proposalId,
        actionName: info.actionName || proposalId,
        governanceType: info.governanceType || "Unknown",
        outcome: info.outcome || "Unknown",
        status: info.status || "",
        submittedEpoch: Number(info.submittedEpoch || 0),
        submittedAtUnix: Number(info.submittedAtUnix || 0),
        vote: voteByProposal.get(proposalId) || null,
        eligible: eligible(proposalId)
      };
    })
    .sort((a, b) => (b.submittedAtUnix - a.submittedAtUnix) || a.actionName.localeCompare(b.actionName));
}

/* Tooltip text for the metric columns ------------------------------------ */
export const metricHelp = {
  attendance: (row) => [
    "Attendance: votes cast / eligible actions × 100.",
    `${row.cast} / ${row.totalEligibleVotes} = ${row.attendance}%`
  ],
  transparency: (row, isCommittee) => [
    isCommittee ? "Committee transparency: rationale coverage across scoped votes." : "Transparency: votes carrying a rationale / votes cast × 100.",
    `${row.transparencyCount ?? 0} / ${row.transparencyTotal ?? 0} = ${row.transparencyScore ?? 0}%`
  ],
  consistency: (row) => [
    "Alignment: votes matching the final outcome / comparable (Yes or No) votes × 100.",
    `${row.consistencyMatches ?? 0} / ${row.consistencyTotal ?? 0} = ${row.consistency}%`
  ],
  rationaleQuality: (row) => [
    "CC rationale quality (0–100), averaged over scoped votes.",
    "Per vote: availability (0 or 25) + structure (0–45: CIP-136 fields, sections, body length, signature) + constitutional grounding (0–30: article citations).",
    `Average over ${row.cast} vote${row.cast === 1 ? "" : "s"}: ${row.consistency}%`
  ],
  abstain: (row) => [
    "Abstain rate: abstain votes / votes cast × 100.",
    `${row.abstainCount ?? 0} / ${row.abstainTotal ?? 0} = ${row.abstainRate}%`
  ],
  responsiveness: (row) => [
    "Responsiveness: max(0, 100 − avg response hours / 720 × 100).",
    row.avgResponseHours === null || row.avgResponseHours === undefined
      ? "No response-time data in scoped votes."
      : `Average ${formatResponseHours(row.avgResponseHours)} over ${row.responseSampleCount} vote${row.responseSampleCount === 1 ? "" : "s"} → ${row.responsiveness}%`
  ],
  delegationRisk: (row) => {
    const label = row.delegationRiskLabel || delegationConcentrationRiskLabel(row.delegationRiskScore);
    return [
      label === "High"
        ? "A high share of active delegated power, which can concentrate governance outcomes."
        : label === "Medium"
          ? "A meaningful share of active delegated power; worth monitoring over time."
          : "A lower concentration footprint relative to the active delegation set.",
      `Share of active voting power: ${round1(row.votingPowerPctActive)}%.`
    ];
  },
  accountability: (row, actorType, include) => {
    const parts = [];
    if (actorType === "committee") parts.push("Attendance 50%", "Rationale quality 50%");
    else {
      const w = actorType === "drep" ? DREP_SCORE_WEIGHTS : SPO_SCORE_WEIGHTS;
      if (include.attendance !== false) parts.push(`Attendance ${w.attendance * 100}%`);
      if (include.transparency) parts.push(`Transparency ${w.transparency * 100}%`);
      if (include.alignment) parts.push(`Alignment ${w.consistency * 100}%`);
      if (include.responsiveness) parts.push(`Responsiveness ${w.responsiveness * 100}%`);
      if (actorType === "drep" && include.delegationRisk) parts.push("Delegation decentralisation 15% (100 − risk)");
    }
    return ["Accountability: weighted average of the enabled metrics.", `Weights: ${parts.length ? parts.join(", ") : "none"}.`, `Score: ${row.accountability}%`];
  }
};
