// Shared Cardano wallet discovery (CIP-30 + CIP-95 detection), ported from
// DRepTalk's sign-in flow. Wallet extensions inject window.cardano
// asynchronously, often after React mounts, so a single check on mount
// frequently finds nothing. The hook re-scans on a short interval (and on
// window load) until wallets appear, prefers the wallet the user last signed
// in with, and never overrules a wallet the user picked by hand.
import { useCallback, useEffect, useRef, useState } from "react";

// localStorage key remembering the wallet last used successfully. With several
// extensions installed, defaulting to the first injected wallet routinely
// picks the wrong one; preferring the remembered key keeps sign-in on the
// wallet the user actually uses. Same key the previous connect flow wrote, so
// returning visitors keep their remembered wallet.
export const LAST_WALLET_STORAGE_KEY = "civitas.wallet";

function isValidWalletEntry(v) {
  return Boolean(v) && typeof v === "object" && typeof v.enable === "function" && typeof v.name === "string";
}

/**
 * Pure: maps a window.cardano-like object to the list of valid CIP-30 wallet
 * entries. Invalid or missing entries are skipped. Some extensions register
 * the same wallet under two keys (Typhon answers to `typhon` and
 * `typhoncip30`); those collapse to one row per wallet name, preferring the
 * key that names the CIP-30 surface.
 */
export function listCardanoWallets(cardano) {
  if (!cardano || typeof cardano !== "object") return [];
  const byName = new Map();
  for (const [key, raw] of Object.entries(cardano)) {
    if (!isValidWalletEntry(raw)) continue;
    const entry = {
      key,
      name: raw.name,
      icon: typeof raw.icon === "string" ? raw.icon : "",
      supportsCip95: Array.isArray(raw.supportedExtensions)
        ? raw.supportedExtensions.some((e) => e && e.cip === 95)
        : false,
      raw
    };
    const nameKey = raw.name.trim().toLowerCase();
    const existing = byName.get(nameKey);
    if (!existing || (!existing.key.includes("cip30") && key.includes("cip30"))) {
      byName.set(nameKey, entry);
    }
  }
  return Array.from(byName.values());
}

/** True when both lists describe the same wallets in the same order. */
function sameWalletList(a, b) {
  if (a.length !== b.length) return false;
  return a.every((w, i) => w.key === b[i].key && w.supportsCip95 === b[i].supportsCip95 && w.icon === b[i].icon);
}

/** Persists the wallet key after a successful sign-in. Safe without localStorage. */
export function rememberWallet(key) {
  try {
    localStorage.setItem(LAST_WALLET_STORAGE_KEY, key);
  } catch {
    // Storage unavailable (private mode, blocked); the default stays first-found.
  }
}

/** Safe without localStorage. */
export function recallWallet() {
  try {
    return localStorage.getItem(LAST_WALLET_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Picks the selection for a freshly scanned wallet list: a deliberate pick by
 * the user when still present, else the remembered last-used wallet, else the
 * current auto-filled selection, else the first one found.
 *
 * `currentIsUserPick` keeps the remembered wallet from losing a race:
 * extensions inject at different times, so an early scan can see only one of
 * two installed wallets. A selection derived from that partial list is
 * provisional and yields as soon as the remembered wallet appears; a wallet
 * the user actually clicked is never overruled. Pure.
 */
export function chooseSelectedWallet(current, remembered, found, currentIsUserPick) {
  if (currentIsUserPick && current && found.some((w) => w.key === current)) return current;
  if (remembered && found.some((w) => w.key === remembered)) return remembered;
  if (current && found.some((w) => w.key === current)) return current;
  return found[0]?.key ?? "";
}

/**
 * Enumerates the installed Cardano wallets. Returns the list, the selected
 * key, a setter (calling it marks the selection as the user's own, so later
 * scans leave it alone) and `scanning`, which stays true until a wallet is
 * found or the scan window closes. An empty list is the normal state for the
 * first few hundred milliseconds, so callers that must not act on "no wallet"
 * too early should wait for `scanning` to turn false.
 */
export function useCardanoWallets() {
  const [wallets, setWallets] = useState([]);
  const [selected, setSelected] = useState("");
  const [scanning, setScanning] = useState(true);
  // Set once the user picks a wallet themselves. A ref, not state: only the
  // scan loop reads it.
  const userPickedRef = useRef(false);

  const setSelectedByUser = useCallback((key) => {
    userPickedRef.current = true;
    setSelected(key);
  }, []);

  useEffect(() => {
    const remembered = recallWallet();
    const scan = () => {
      const found = listCardanoWallets(window.cardano);
      // Keep the array identity stable when nothing changed so consumers that
      // depend on `wallets` (memoised callbacks, effects) don't churn every tick.
      setWallets((prev) => (sameWalletList(prev, found) ? prev : found));
      setSelected((cur) => chooseSelectedWallet(cur, remembered, found, userPickedRef.current));
      if (found.length > 0) setScanning(false);
    };

    scan();
    // Re-scan every 300ms for ~6s to catch extensions that inject late (and
    // more than one that injects at different times); cheap and bounded.
    let tries = 0;
    const interval = setInterval(() => {
      tries++;
      scan();
      if (tries >= 20) {
        clearInterval(interval);
        // Window closed: an empty list now means there really is no wallet.
        setScanning(false);
      }
    }, 300);
    // Some extensions only finish injecting at window 'load'.
    const onLoad = () => scan();
    window.addEventListener("load", onLoad);

    return () => {
      clearInterval(interval);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return { wallets, selected, setSelected: setSelectedByUser, scanning };
}
