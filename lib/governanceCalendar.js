"use strict";

/**
 * Epoch calendar events: which governance actions were submitted, voting,
 * expiring, expired, dropped, ratified or enacted at each epoch boundary,
 * with the vote position as it stood at that boundary (votes cast later
 * are left out for past epochs). Computed on the server from the snapshot
 * so the calendar page downloads a few kilobytes instead of every vote.
 */

const model = require("./governanceModel");

const SHELLEY_EPOCH_START_UNIX = 1596059091;
const EPOCH_SECONDS = 432000;

function epochStartUnix(epoch) {
  return SHELLEY_EPOCH_START_UNIX + (Number(epoch) - 208) * EPOCH_SECONDS;
}
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function isInfoAction(type) {
  const t = String(type || "").toLowerCase();
  return t.includes("info action") || t === "info";
}

function eventTypesAtEpoch(row, epoch, referenceEpoch) {
  const submittedEpoch = toNum(row.submittedEpoch);
  const expirationEpoch = toNum(row.expirationEpoch);
  const ratifiedEpoch = toNum(row.ratifiedEpoch);
  const enactedEpoch = toNum(row.enactedEpoch) || (ratifiedEpoch > 0 && !isInfoAction(row.governanceType) ? ratifiedEpoch + 1 : 0);
  const droppedEpoch = toNum(row.droppedEpoch);
  const expiredEpoch = toNum(row.expiredEpoch) || (row.status === "Expired" ? expirationEpoch : 0);
  if (epoch > referenceEpoch) return row.status === "Active" && expirationEpoch === epoch ? ["expires"] : [];
  const types = [];
  if (submittedEpoch === epoch) types.push("submitted");
  if (expiredEpoch === epoch) types.push("expired");
  if (droppedEpoch === epoch && (!expirationEpoch || droppedEpoch < expirationEpoch)) types.push("dropped");
  if (ratifiedEpoch === epoch) types.push("ratified");
  if (enactedEpoch === epoch) types.push("enacted");
  const terminal = [ratifiedEpoch, expiredEpoch, droppedEpoch, expirationEpoch].filter((n) => n > 0);
  const terminalEpoch = terminal.length ? Math.min(...terminal) : 0;
  if (submittedEpoch > 0 && submittedEpoch < epoch && (!terminalEpoch || epoch < terminalEpoch)) types.push("voting");
  return types;
}

/** Votes cast on or before the epoch boundary (untimed votes only for live epochs). */
function votesAtBoundary(actors, boundaryUnix, includeUntimed) {
  return (Array.isArray(actors) ? actors : []).map((actor) => ({
    ...actor,
    votes: (actor.votes || []).filter((vote) => {
      const t = toNum(vote?.votedAtUnix);
      return t > 0 ? t <= boundaryUnix : includeUntimed;
    })
  }));
}

function snapshotAtEpoch(snapshot, epoch, referenceEpoch) {
  const live = epoch >= referenceEpoch;
  const boundaryUnix = epochStartUnix(epoch);
  const proposalInfo = {};
  for (const [id, info] of Object.entries(snapshot?.proposalInfo || {})) {
    const copy = { ...info };
    if (toNum(info?.submittedEpoch) > epoch || !live) copy.nomosModel = null;
    if (!live) copy.voteStats = null;
    proposalInfo[id] = copy;
  }
  return {
    ...snapshot,
    proposalInfo,
    dreps: votesAtBoundary(snapshot?.dreps, boundaryUnix, live),
    spos: votesAtBoundary(snapshot?.spos, boundaryUnix, live),
    committeeMembers: votesAtBoundary(snapshot?.committeeMembers, boundaryUnix, live)
  };
}

function slimRow(row) {
  const cc = row.voteStats?.constitutional_committee || {};
  return {
    proposalId: row.proposalId,
    actionName: row.actionName,
    governanceType: row.governanceType,
    status: row.status,
    submittedEpoch: row.submittedEpoch ?? null,
    expirationEpoch: row.expirationEpoch ?? null,
    ratifiedEpoch: row.ratifiedEpoch ?? null,
    enactedEpoch: row.enactedEpoch ?? null,
    droppedEpoch: row.droppedEpoch ?? null,
    expiredEpoch: row.expiredEpoch ?? null,
    drepYesPowerPct: row.drepYesPowerPct ?? null,
    drepRequiredPct: row.drepRequiredPct ?? null,
    drepYesPowerAda: Math.round(toNum(row.drepYesPowerAda)),
    drepNoSideAda: Math.round(toNum(row.drepNoPowerAda) + toNum(row.drepNoConfidencePowerAda) + toNum(row.drepNotVotedPowerAda)),
    totalActiveStakeAda: Math.round(toNum(row.totalActiveStakeAda)),
    ccRequiredPct: row.ccRequiredPct ?? null,
    ccYes: toNum(cc.yes),
    ccNo: toNum(cc.no),
    ccAbstain: toNum(cc.abstain),
    ccEligibleCount: toNum(row.ccEligibleCount),
    spoYesPct: row.spoYesPct ?? null,
    spoRequiredPct: row.spoRequiredPct ?? null,
    spoYesAda: Math.round(toNum(row.spoYesAda)),
    spoNoAda: Math.round(toNum(row.spoNoAda)),
    spoNotVotedAda: Math.round(toNum(row.spoNotVotedAda))
  };
}

/**
 * Returns { referenceEpoch, from, to, epochs: { [epoch]: [{ type, row }] } }.
 * `computeRowsAt(epoch)` may be memoised by the caller; it defaults to a
 * fresh computation per epoch.
 */
function buildCalendar(snapshot, fromEpoch, toEpoch, { computeRowsAt } = {}) {
  const referenceEpoch = toNum(snapshot?.latestEpoch) || 208 + Math.floor((Date.now() / 1000 - SHELLEY_EPOCH_START_UNIX) / EPOCH_SECONDS);
  const from = Math.max(208, Math.floor(toNum(fromEpoch)) || referenceEpoch - 6);
  const to = Math.min(from + 60, Math.max(from, Math.floor(toNum(toEpoch)) || referenceEpoch + 12));
  const currentRows = model.computeActionModels(snapshot);
  const rowsAt = computeRowsAt || ((epoch) => model.computeActionModels(snapshotAtEpoch(snapshot, epoch, referenceEpoch), { referenceEpoch: epoch }));
  const epochs = {};
  for (let epoch = from; epoch <= to; epoch += 1) {
    const events = [];
    let rowsById = null;
    for (const current of currentRows) {
      const types = eventTypesAtEpoch(current, epoch, referenceEpoch);
      if (types.length === 0) continue;
      if (!rowsById) {
        const rows = epoch <= referenceEpoch ? rowsAt(epoch) : currentRows;
        rowsById = new Map(rows.map((r) => [r.proposalId, r]));
      }
      const row = slimRow(rowsById.get(current.proposalId) || current);
      for (const type of types) events.push({ type, row });
    }
    if (events.length) epochs[epoch] = events;
  }
  return { referenceEpoch, from, to, epochs };
}

module.exports = { buildCalendar, snapshotAtEpoch, eventTypesAtEpoch, epochStartUnix };
