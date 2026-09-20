// Human-readable descriptions for CIP-30 wallet errors, ported from DRepTalk.
// CIP-30 errors carry { code, info }; we prefer info, then message, then a
// caller-supplied fallback.

/**
 * Error raised by the sign-in flow itself (as opposed to the wallet), carrying
 * a short machine code the dialog can act on: "not-a-drep", "no-cip95",
 * "network", "rejected", "missing".
 */
export class WalletFlowError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "WalletFlowError";
    this.code = code || "";
  }
}

/** The error's own detail string, or undefined when it has none. */
export function walletErrorDetail(err) {
  const detail =
    (typeof err?.info === "string" && err.info) ||
    (typeof err?.message === "string" && err.message) ||
    "";
  return detail || undefined;
}

/**
 * True when a CIP-30 wallet error is an explicit user rejection:
 * APIError Refused (-3) on enable(), DataSignError UserDeclined (3) on signData().
 */
export function isUserDecline(err) {
  const code = err?.code;
  return code === 3 || code === -3;
}

/**
 * Detects the "stale inputs" rejection that happens when a second transaction
 * is submitted before the first one has confirmed: the wallet still returns
 * the old UTxO set, so the new tx reuses inputs the first tx already spent.
 * Returns a friendly message, or null for unrelated errors.
 */
export function staleInputsMessage(err) {
  const code = err?.code;
  const lower = (walletErrorDetail(err) ?? "").toLowerCase();
  if (
    code === 3997 ||
    lower.includes("inputs are spent") ||
    lower.includes("already been included") ||
    lower.includes("badinputsutxo")
  ) {
    return "Your previous transaction is still confirming. Please wait about 20 seconds, then try again.";
  }
  return null;
}

/**
 * Maps a wallet/network failure to a readable sentence: the detail
 * sentence-cased and punctuated, or the fallback when none is available.
 */
export function readableError(err, fallback = "Something went wrong. Please try again.") {
  if (err instanceof WalletFlowError) return err.message;
  const stale = staleInputsMessage(err);
  if (stale) return stale;
  const detail = walletErrorDetail(err) ?? "";
  if (!detail) return fallback;
  const msg = detail.charAt(0).toUpperCase() + detail.slice(1);
  return /[.!?]$/.test(msg) ? msg : `${msg}.`;
}
