// Expands the columnar packed votes from /api/v1/actors/:type into the vote
// objects the dashboards score on, using the proposal index for outcomes and
// response times. Kept as plain functions so the scoring code stays simple.

const VOTE_BY_CODE = { 0: "Other", 1: "Yes", 2: "No", 3: "Abstain", 4: "No confidence" };

export function unpackActors(payload) {
  if (!payload || !Array.isArray(payload.actors)) return { proposals: [], proposalById: new Map(), actors: [] };
  const proposals = payload.proposals || [];
  const base = Number(payload.packing?.timeBaseUnix || 0);
  const proposalById = new Map(proposals.map((p) => [p.id, p]));
  const actors = payload.actors.map((a) => {
    const v = a.v || { p: [], c: [], r: [], t: [] };
    const votes = new Array(v.p.length);
    for (let i = 0; i < v.p.length; i += 1) {
      const p = proposals[v.p[i]];
      const votedAtUnix = v.t[i] > 0 ? base + v.t[i] * 60 : null;
      const submitted = Number(p?.submittedAtUnix || 0);
      const responseHours = votedAtUnix && submitted > 0 && votedAtUnix >= submitted ? (votedAtUnix - submitted) / 3600 : null;
      votes[i] = {
        proposalId: p?.id || "",
        vote: VOTE_BY_CODE[v.c[i]] || "Other",
        outcome: p?.outcome || "",
        hasRationale: v.r[i] === 1 ? true : v.r[i] === 0 ? false : null,
        responseHours,
        votedAtUnix,
        votedAt: votedAtUnix ? new Date(votedAtUnix * 1000).toISOString() : null,
        rationaleQualityScore: Array.isArray(v.q) ? (v.q[i] >= 0 ? v.q[i] / 10 : null) : undefined
      };
    }
    const { v: _v, ...rest } = a;
    return { ...rest, votes };
  });
  return { proposals, proposalById, actors };
}

/** proposalInfo-shaped map from the proposal index (what the old pages read). */
export function proposalInfoFromIndex(proposals) {
  const out = {};
  for (const p of Array.isArray(proposals) ? proposals : []) {
    out[p.id] = {
      actionName: p.name,
      governanceType: p.type,
      outcome: p.outcome,
      status: p.status,
      submittedEpoch: p.submittedEpoch,
      submittedAtUnix: p.submittedAtUnix,
      submittedAt: p.submittedAtUnix ? new Date(p.submittedAtUnix * 1000).toISOString() : null,
      expirationEpoch: p.expirationEpoch,
      ratifiedEpoch: p.ratifiedEpoch,
      enactedEpoch: p.enactedEpoch,
      droppedEpoch: p.droppedEpoch,
      expiredEpoch: p.expiredEpoch,
      withdrawalAmountAda: p.withdrawalAmountAda,
      voteStats: {
        drep: { total: p.votes?.drep || 0 },
        stake_pool: { total: p.votes?.spo || 0 },
        constitutional_committee: { total: p.votes?.cc || 0 }
      }
    };
  }
  return out;
}

export function unpackRationaleIndex(payload) {
  if (!payload) return { actions: [], votes: [] };
  const base = Number(payload.packing?.timeBaseUnix || 0);
  const v = payload.votes || { a: [], x: [], c: [], t: [], u: [] };
  const votes = [];
  for (let i = 0; i < v.a.length; i += 1) {
    const actor = payload.actors[v.a[i]];
    const action = payload.actions[v.x[i]];
    if (!actor || !action) continue;
    votes.push({
      actorId: actor.id,
      actorName: actor.name || "",
      role: actor.role,
      hotCredential: actor.hotCredential || "",
      koiosVoterId: actor.koiosVoterId || "",
      proposalId: action.id,
      actionName: action.actionName,
      vote: VOTE_BY_CODE[v.c[i]] || "Other",
      rationaleUrl: v.u[i] >= 0 ? payload.urls[v.u[i]] : "",
      votedAtUnix: v.t[i] > 0 ? base + v.t[i] * 60 : null
    });
  }
  return { actions: payload.actions || [], votes };
}
