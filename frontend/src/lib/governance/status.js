// Action status helpers (mirrors lib/governanceModel.js on the server).

export function deriveStatus(info) {
  if (!info) return "Unknown";
  if (info.status) return info.status;
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

export function isActiveAction(info) {
  const outcome = String(info?.outcome || "").trim().toLowerCase();
  return outcome === "pending" || outcome === "active" || outcome === "open" || outcome === "in_progress";
}

export function isNoConfidenceAction(type) {
  const t = String(type || "").toLowerCase();
  return t.includes("no confidence") || t.includes("noconfidence");
}
export function isInfoAction(type) {
  const t = String(type || "").toLowerCase();
  return t.includes("info action") || t === "info";
}

/** Which bodies vote on an action, from its threshold info. */
export function eligibleVoteGroups(row) {
  const info = row?.thresholdInfo || {};
  const type = String(row?.governanceType || "").toLowerCase();
  const drep = Number(info.drepRequiredPct) > 0 || isInfoAction(type);
  const spo = Number(info.poolRequiredPct) > 0 || isInfoAction(type);
  const cc = !isNoConfidenceAction(type) && !type.includes("new committee");
  return { drep, spo, cc };
}
