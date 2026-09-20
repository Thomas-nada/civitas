// Wording shared by the survey list, the survey page and its tally, kept out
// of the component files so each surface names the same state the same way.

const LIFECYCLE_LABELS = {
  open: "Open",
  closed: "Closed",
  cancelled: "Cancelled",
  untalliable: "Invalid definition"
};

export function lifecycleLabel(lifecycle) {
  return LIFECYCLE_LABELS[lifecycle] || lifecycle || "";
}

// One wording for the participation figure. Tessera's own counting, never
// Civitas': the audited in-window DRep count while a survey runs (a proof
// still pending is counted), the tally artifact's DRep responders once it is
// finalized. A survey DReps cannot answer shows its distinct responders.
export function participationLabel(survey) {
  if (survey.lifecycle === "cancelled" || survey.lifecycle === "untalliable") return "no count";
  const drepEligible = (survey.eligibleRoles || []).includes("DRep");
  const dreps = survey.countedByRole?.DRep;
  if (drepEligible && dreps != null) {
    const noun = dreps === 1 ? "DRep response" : "DRep responses";
    return survey.finalState?.state === "finalized" ? `${dreps} ${noun} counted at close` : `${dreps} ${noun} counted`;
  }
  if (survey.responseCount != null) {
    return `${survey.responseCount} ${survey.responseCount === 1 ? "response" : "responses"}`;
  }
  return "count pending";
}

function toBig(value) {
  try {
    return BigInt(value ?? 0);
  } catch {
    return 0n;
  }
}

/** Lovelace (string or bigint) as a compact ada figure: "39.6M ₳". */
export function adaLabel(lovelace) {
  const ada = Number(toBig(lovelace)) / 1_000_000;
  if (!Number.isFinite(ada)) return "—";
  const abs = Math.abs(ada);
  const compact = abs >= 1e9 ? `${(ada / 1e9).toFixed(2)}B`
    : abs >= 1e6 ? `${(ada / 1e6).toFixed(1)}M`
      : abs >= 1e3 ? `${(ada / 1e3).toFixed(1)}k`
        : ada.toFixed(abs < 10 ? 2 : 0);
  return `${compact} ₳`;
}

// The state of a governance action, worded as the action pages word it
// (same rules as ProposalDetailPage's deriveStatus), for the action cards a
// survey shows.
export function actionStatus(info) {
  if (!info) return "";
  if (String(info.outcome || "").toLowerCase() === "pending") return "Active";
  const govType = String(info.governanceType || "").toLowerCase();
  if (govType.includes("info action") || govType === "info") return "";
  const droppedEpoch = Number(info.droppedEpoch || 0);
  const expiredEpoch = Number(info.expiredEpoch || 0);
  const expirationEpoch = Number(info.expirationEpoch || 0);
  if (droppedEpoch > 0 && expiredEpoch > 0) {
    return expirationEpoch > 0 && droppedEpoch < expirationEpoch ? "Dropped" : "Expired";
  }
  if (droppedEpoch > 0) return expirationEpoch > 0 && droppedEpoch >= expirationEpoch ? "Expired" : "Dropped";
  if (expiredEpoch > 0) return "Expired";
  if (Number(info.enactedEpoch || 0) > 0) return "Enacted";
  if (Number(info.ratifiedEpoch || 0) > 0) return "Ratified";
  return String(info.outcome || "");
}

export function actionStatusPill(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return "pill--active";
  if (s === "ratified") return "pill--ratified";
  if (s === "enacted") return "pill--enacted";
  if (s === "expired") return "pill--expired";
  if (s === "dropped") return "pill--dropped";
  return "pill--unknown";
}
