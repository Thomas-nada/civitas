// The signed-in session as persisted across reloads. Two kinds:
//   wallet — which CIP-30 wallet and which role; restoring re-runs the same
//            connect flow the dialog uses (the wallet re-approves), so a reload
//            keeps the user on the key they signed in with.
//   signer — an identity proven offline with cardano-signer. Re-signing a
//            challenge on every reload would be painful, so the verified
//            identity is kept for a bounded time, like DRepTalk's session.
import { normalizeRole } from "./roles";

const SESSION_STORAGE_KEY = "civitas.session";
const SIGNER_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== "object") return null;
    // Sessions written before `kind` existed are wallet sessions.
    const kind = s.kind === "signer" ? "signer" : "wallet";
    if (kind === "wallet") {
      if (typeof s.walletKey !== "string" || !s.walletKey) return null;
      return { kind, walletKey: s.walletKey, role: normalizeRole(s.role) };
    }
    if (!s.identity || typeof s.identity !== "object") return null;
    if (!(Number(s.expiresAt) > Date.now())) return null;
    return { kind, role: normalizeRole(s.role), identity: s.identity, expiresAt: Number(s.expiresAt) };
  } catch {
    return null;
  }
}

export function writeWalletSession({ walletKey, role }) {
  write({ kind: "wallet", walletKey, role });
}

export function writeSignerSession({ role, identity }) {
  write({ kind: "signer", role, identity, expiresAt: Date.now() + SIGNER_SESSION_TTL_MS });
}

function write(session) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable; the session simply won't survive a reload.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}
