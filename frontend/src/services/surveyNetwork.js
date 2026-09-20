// Surveys (CIP-179) are read from mainnet, like the rest of Civitas. The
// epoch calendar here is the ledger's wall-clock one (Byron epochs on
// mainnet were the same 432 000 s as a Shelley epoch, so one anchor covers
// the whole history): epoch e starts at EPOCH_ZERO_UNIX + e x SECONDS_PER_EPOCH.
export const SURVEY_NETWORK = "mainnet";

const EPOCH_ZERO_UNIX = 1506203091; // 2017-09-23T21:44:51Z, mainnet systemStart
const SECONDS_PER_EPOCH = 432000;

export function explorerTxUrl(txHash) {
  return `https://cardanoscan.io/transaction/${txHash}`;
}

/** Unix seconds at which `epoch` starts. */
export function epochStartUnix(epoch) {
  return EPOCH_ZERO_UNIX + Number(epoch) * SECONDS_PER_EPOCH;
}

/** The calendar's current epoch: what decides whether a survey is still open. */
export function currentCalendarEpoch(nowMs = Date.now()) {
  return Math.floor((nowMs / 1000 - EPOCH_ZERO_UNIX) / SECONDS_PER_EPOCH);
}

const DATE_FMT = { year: "numeric", month: "short", day: "numeric" };

/**
 * A survey accepts responses through `endEpoch` inclusive, so it closes when
 * that epoch completes: the start of the following epoch.
 */
export function epochEndDate(endEpoch) {
  if (endEpoch == null || !Number.isFinite(Number(endEpoch))) return "—";
  return new Date(epochStartUnix(Number(endEpoch) + 1) * 1000).toLocaleDateString(undefined, DATE_FMT);
}

/** The deadline as one line: "until 12 Oct 2026 (through epoch 660)" while open, the epoch alone after. */
export function deadlineLabel(lifecycle, endEpoch) {
  const through = `through epoch ${endEpoch}`;
  return lifecycle === "open" ? `until ${epochEndDate(endEpoch)} (${through})` : through;
}

export function formatUnixDate(unixSeconds) {
  if (!unixSeconds) return "—";
  return new Date(Number(unixSeconds) * 1000).toLocaleDateString(undefined, DATE_FMT);
}
