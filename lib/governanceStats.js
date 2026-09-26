"use strict";

/**
 * The Stats page model, aggregated once per snapshot on the server. The page
 * used to download every actor's votes (megabytes) and bucket them in the
 * browser; the result here is a few kilobytes of chart-ready rows.
 */

const model = require("./governanceModel");

const SPECIAL_ID_RE = /always_abstain|always_no_confidence/i;

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function pct(a, b) {
  return b ? Math.round((a / b) * 100) : 0;
}

// Committee seats whose on-chain window is not reported (mirrors the client).
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

function committeeWindow(actor, proposalInfo) {
  const hot = String(actor?.hotCredential || "").trim().toLowerCase();
  const name = String(actor?.name || "").trim().toLowerCase();
  const override = CC_TERM_OVERRIDES_BY_HOT[hot] || CC_TERM_OVERRIDES_BY_NAME[name] || null;
  const startEpoch = toNum(override?.seatStartEpoch || actor?.seatStartEpoch);
  const endEpoch = toNum(override?.expirationEpoch || actor?.expirationEpoch);
  const hasStartEpoch = startEpoch > 0;
  const hasEndEpoch = endEpoch > 0;
  const status = String(actor?.status || "").toLowerCase();
  let lastVoteEpoch = 0;
  for (const vote of actor?.votes || []) {
    const e = toNum(proposalInfo?.[vote?.proposalId]?.submittedEpoch);
    if (e > lastVoteEpoch) lastVoteEpoch = e;
  }
  const inferredEndEpoch = (status === "retired" || status === "expired") && !hasEndEpoch && lastVoteEpoch > 0 ? lastVoteEpoch : 0;
  const effectiveEndEpoch = hasEndEpoch && inferredEndEpoch > 0 ? Math.min(endEpoch, inferredEndEpoch) : hasEndEpoch ? endEpoch : inferredEndEpoch;
  return { startEpoch, hasStartEpoch, effectiveEndEpoch, hasEffectiveEndEpoch: effectiveEndEpoch > 0 };
}

function terminalEpoch(info) {
  const candidates = [info?.enactedEpoch, info?.ratifiedEpoch, info?.droppedEpoch, info?.expiredEpoch, info?.expirationEpoch].map(toNum).filter((x) => x > 0);
  return candidates.length ? Math.min(...candidates) : null;
}

function requiresCommitteeParticipation(info) {
  const type = String(info?.governanceType || "").toLowerCase();
  if (type.includes("no confidence") || type.includes("new committee")) return false;
  const dropped = toNum(info?.droppedEpoch);
  const expiration = toNum(info?.expirationEpoch);
  if (dropped > 0 && expiration > 0 && dropped < expiration) return false;
  return true;
}

function sortedPowers(rows) {
  return rows.map((r) => toNum(r?.votingPowerAda)).filter((n) => n > 0).sort((a, b) => b - a);
}
function entitiesForShare(powers, sharePct, strict) {
  if (!powers.length) return null;
  const total = powers.reduce((s, n) => s + n, 0);
  if (!(total > 0) || !(sharePct > 0)) return null;
  const target = total * (sharePct / 100);
  let acc = 0;
  for (let i = 0; i < powers.length; i += 1) {
    acc += powers[i];
    if (strict ? acc > target : acc >= target) return i + 1;
  }
  return powers.length;
}

/**
 * snapshot: { proposalInfo, dreps, spos, committeeMembers (normalised), specialDreps, thresholdContext, latestEpoch }
 */
function computeStats(snapshot) {
  const proposalInfo = snapshot?.proposalInfo || {};
  const proposals = Object.entries(proposalInfo).map(([proposalId, info]) => ({ proposalId, ...info }));
  const dreps = (Array.isArray(snapshot?.dreps) ? snapshot.dreps : []).filter((d) => !SPECIAL_ID_RE.test(String(d?.id || "")));
  const spos = Array.isArray(snapshot?.spos) ? snapshot.spos : [];
  const cc = Array.isArray(snapshot?.committeeMembers) ? snapshot.committeeMembers : [];
  const special = snapshot?.specialDreps || {};
  const currentEpoch = toNum(snapshot?.latestEpoch) || null;

  // Proposals by type / outcome / submitted epoch.
  const typeMap = new Map();
  const outcomeMap = new Map();
  const epochMap = new Map();
  for (const p of proposals) {
    const type = p.governanceType || "Unknown";
    const outcome = p.outcome || "Unknown";
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
    outcomeMap.set(outcome, (outcomeMap.get(outcome) || 0) + 1);
    const ep = toNum(p.submittedEpoch);
    if (ep > 0) {
      if (!epochMap.has(ep)) epochMap.set(ep, { epoch: ep, total: 0, passed: 0, failed: 0, pending: 0 });
      const row = epochMap.get(ep);
      row.total += 1;
      const lo = outcome.toLowerCase();
      if (lo === "yes" || lo === "enacted" || lo === "ratified") row.passed += 1;
      else if (lo === "no" || lo === "dropped" || lo === "expired") row.failed += 1;
      else row.pending += 1;
    }
  }
  const byType = [...typeMap.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  const byOutcome = [...outcomeMap.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  const byEpoch = [...epochMap.values()].sort((a, b) => a.epoch - b.epoch);

  // Votes by role (from the per-action tallies).
  const roles = { drep: { yes: 0, no: 0, abstain: 0 }, cc: { yes: 0, no: 0, abstain: 0 }, spo: { yes: 0, no: 0, abstain: 0 } };
  for (const p of proposals) {
    const vs = p.voteStats || {};
    for (const [key, bucket] of [["drep", vs.drep], ["cc", vs.constitutional_committee], ["spo", vs.stake_pool]]) {
      roles[key].yes += toNum(bucket?.yes);
      roles[key].no += toNum(bucket?.no);
      roles[key].abstain += toNum(bucket?.abstain);
    }
  }
  const votesByRole = [
    { role: "DReps", ...roles.drep },
    { role: "Committee", ...roles.cc },
    { role: "SPOs", ...roles.spo }
  ];
  const totals = votesByRole.reduce((acc, r) => ({ yes: acc.yes + r.yes, no: acc.no + r.no, abstain: acc.abstain + r.abstain }), { yes: 0, no: 0, abstain: 0 });

  // Epoch range for the timelines.
  const ccStarts = cc.map((m) => toNum(m.seatStartEpoch)).filter(Boolean);
  const ccEnds = cc.map((m) => toNum(m.expirationEpoch)).filter(Boolean);
  const submitted = proposals.map((p) => toNum(p.submittedEpoch)).filter(Boolean);
  const ends = proposals.flatMap((p) => [toNum(p.expirationEpoch), toNum(p.enactedEpoch), toNum(p.ratifiedEpoch)]).filter(Boolean);
  const epochMin = Math.max(Math.min(...ccStarts, ...submitted, 9999), 500);
  const epochMax = Math.max(...ccEnds, ...ends, toNum(currentEpoch), epochMin + 10);

  // DReps.
  const activeDreps = dreps.filter((d) => d.active === true).length;
  const retiredDreps = dreps.filter((d) => d.retired === true).length;
  const totalDrepAda = dreps.reduce((s, d) => s + toNum(d.votingPowerAda), 0);
  const attendanceBuckets = [
    { name: "100%", value: 0 }, { name: "75–99%", value: 0 }, { name: "50–74%", value: 0 }, { name: "25–49%", value: 0 }, { name: "<25%", value: 0 }
  ];
  const transparencyBuckets = [
    { name: "High (70+)", value: 0 }, { name: "Mid (40–69)", value: 0 }, { name: "Low (21–39)", value: 0 }, { name: "None (≤20)", value: 0 }
  ];
  const responseBuckets = [{ name: "< 24h", value: 0 }, { name: "1–3d", value: 0 }, { name: "3–7d", value: 0 }, { name: "> 7d", value: 0 }];
  const responseTimes = [];
  for (const d of dreps) {
    const a = pct((d.votes || []).length, toNum(d.totalEligibleVotes) || 1);
    attendanceBuckets[a === 100 ? 0 : a >= 75 ? 1 : a >= 50 ? 2 : a >= 25 ? 3 : 4].value += 1;
    const sc = toNum(d.transparencyScore);
    transparencyBuckets[sc >= 70 ? 0 : sc >= 40 ? 1 : sc > 20 ? 2 : 3].value += 1;
    for (const v of d.votes || []) {
      let h = v?.responseHours;
      if ((h === null || h === undefined) && toNum(v?.votedAtUnix) > 0) {
        const s = toNum(proposalInfo[v.proposalId]?.submittedAtUnix);
        if (s > 0 && toNum(v.votedAtUnix) >= s) h = (toNum(v.votedAtUnix) - s) / 3600;
      }
      if (h === null || h === undefined || !(h >= 0)) continue;
      responseTimes.push(h);
      responseBuckets[h < 24 ? 0 : h < 72 ? 1 : h < 168 ? 2 : 3].value += 1;
    }
  }
  responseTimes.sort((a, b) => a - b);
  const medianResponseHours = responseTimes.length ? responseTimes[Math.floor(responseTimes.length / 2)] : null;
  const topDreps = [...dreps].sort((a, b) => toNum(b.votingPowerAda) - toNum(a.votingPowerAda)).slice(0, 10)
    .map((d) => ({ id: d.id, name: d.name || `${String(d.id).slice(0, 14)}…`, votingPowerAda: toNum(d.votingPowerAda) }));

  // Participation over time: votes cast per submitted epoch, per body.
  const participation = new Map();
  for (const p of proposals) {
    const epoch = toNum(p.submittedEpoch);
    if (epoch <= 0) continue;
    if (!participation.has(epoch)) participation.set(epoch, { epoch, drepCast: 0, ccCast: 0, spoCast: 0 });
    const row = participation.get(epoch);
    const vs = p.voteStats || {};
    if (toNum(p.thresholdInfo?.drepRequiredPct) > 0 || toNum(vs.drep?.total) > 0) row.drepCast += toNum(vs.drep?.total);
    // Every committee vote cast counts here (the chart shows votes cast, and
    // it is what the production site has always plotted).
    row.ccCast += toNum(vs.constitutional_committee?.total);
    if (p.thresholdInfo?.poolRequiredPct != null || toNum(vs.stake_pool?.total) > 0) row.spoCast += toNum(vs.stake_pool?.total);
  }
  const participationByEpoch = [...participation.values()].sort((a, b) => a.epoch - b.epoch);

  // Committee attendance per seat.
  const ccEligibleIds = Object.keys(proposalInfo).filter((id) => requiresCommitteeParticipation(proposalInfo[id]));
  const ccAttendance = cc.map((m) => {
    const w = committeeWindow(m, proposalInfo);
    const inWindow = (proposalId) => {
      const e = toNum(proposalInfo[proposalId]?.submittedEpoch);
      if (e > 0) {
        if (w.hasStartEpoch && e < w.startEpoch) return false;
        if (w.hasEffectiveEndEpoch && e > w.effectiveEndEpoch) return false;
      }
      return true;
    };
    const votes = (m.votes || []).filter((v) => inWindow(v.proposalId));
    const voted = new Set(votes.map((v) => v.proposalId));
    let eligible = ccEligibleIds.length;
    if (w.hasStartEpoch || w.hasEffectiveEndEpoch) {
      eligible = 0;
      for (const proposalId of ccEligibleIds) {
        if (!inWindow(proposalId)) continue;
        if (w.hasEffectiveEndEpoch && !voted.has(proposalId)) {
          const t = terminalEpoch(proposalInfo[proposalId]);
          if (!t || t > w.effectiveEndEpoch) continue;
        }
        eligible += 1;
      }
    }
    const cast = votes.length;
    const totalEligible = Math.max(eligible, cast, 0);
    const count = (value) => votes.filter((v) => String(v?.vote || "").toLowerCase() === value).length;
    return {
      id: m.id,
      name: m.name || String(m.id || "").slice(0, 12),
      status: m.status || "expired",
      seatStartEpoch: toNum(m.seatStartEpoch) || null,
      expirationEpoch: toNum(m.expirationEpoch) || null,
      cast,
      eligible: totalEligible,
      pct: pct(cast, totalEligible || 1),
      withRationale: votes.filter((v) => v?.hasRationale).length,
      constitutional: count("yes"),
      unconstitutional: count("no"),
      abstain: count("abstain")
    };
  }).sort((a, b) => b.pct - a.pct);

  // SPOs.
  const delegationMap = new Map();
  for (const s of spos) {
    const key = s.delegationStatus || "Unknown";
    delegationMap.set(key, (delegationMap.get(key) || 0) + 1);
  }
  const byDelegation = [...delegationMap.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  const totalSpoAda = spos.reduce((s, p) => s + toNum(p.votingPowerAda), 0);

  // Concentration.
  const drepPowers = sortedPowers(dreps);
  const spoPowers = sortedPowers(spos);
  const tc = snapshot?.thresholdContext || {};
  const thresholdRows = [
    ["Motion of no confidence", tc?.drep?.motionNoConfidence], ["Committee (normal)", tc?.drep?.committeeNormal], ["Constitution update", tc?.drep?.updateToConstitution],
    ["Hard fork initiation", tc?.drep?.hardForkInitiation], ["Network group", tc?.drep?.networkGroup], ["Economic group", tc?.drep?.economicGroup],
    ["Technical group", tc?.drep?.technicalGroup], ["Governance group", tc?.drep?.govGroup], ["Treasury withdrawal", tc?.drep?.treasuryWithdrawal]
  ].map(([threshold, v]) => [threshold, toNum(v)]).filter(([, v]) => v > 0);
  const drepThresholdReach = (thresholdRows.length ? thresholdRows : [["50% majority", 50], ["66.7% supermajority", 66.7]])
    .sort((a, b) => a[1] - b[1])
    .map(([threshold, requiredPct]) => ({ threshold, requiredPct, topDrepsNeeded: entitiesForShare(drepPowers, requiredPct, false) || 0 }));

  // Timeline rows (slim).
  const timeline = proposals
    .filter((p) => toNum(p.submittedEpoch) > 0)
    .map((p) => ({
      proposalId: p.proposalId,
      actionName: p.actionName || p.proposalId,
      governanceType: p.governanceType || "Unknown",
      outcome: p.outcome || "Pending",
      status: model.deriveStatus(p),
      submittedEpoch: toNum(p.submittedEpoch),
      endEpoch: terminalEpoch(p)
    }))
    .sort((a, b) => a.submittedEpoch - b.submittedEpoch);

  const committee = cc.map((m) => ({
    id: m.id, name: m.name || "", status: m.status || "expired", seatStartEpoch: toNum(m.seatStartEpoch) || null, expirationEpoch: toNum(m.expirationEpoch) || null
  }));

  return {
    currentEpoch,
    epochMin,
    epochMax,
    counts: {
      proposals: proposals.length,
      actionTypes: byType.length,
      totalVotes: totals.yes + totals.no + totals.abstain,
      dreps: dreps.length,
      activeDreps,
      retiredDreps,
      committee: cc.length,
      activeCommittee: cc.filter((m) => String(m.status || "").toLowerCase() === "active").length,
      spos: spos.length
    },
    power: {
      drepAda: totalDrepAda,
      spoAda: totalSpoAda,
      alwaysAbstainAda: toNum(special.alwaysAbstain?.votingPowerAda),
      alwaysNoConfidenceAda: toNum(special.alwaysNoConfidence?.votingPowerAda),
      drepNakamoto: entitiesForShare(drepPowers, 50, true),
      spoNakamoto: entitiesForShare(spoPowers, 50, true)
    },
    byType,
    byOutcome,
    byEpoch,
    participationByEpoch,
    votesByRole,
    voteTotals: totals,
    drepAttendance: attendanceBuckets,
    drepTransparency: transparencyBuckets,
    drepResponse: responseBuckets,
    medianResponseHours,
    topDreps,
    drepThresholdReach,
    ccAttendance,
    committee,
    byDelegation,
    timeline
  };
}

module.exports = { computeStats };
