// The cardano-signer sign-in flow, ported from DRepTalk: the server issues a
// single-use challenge, the user signs it on their own machine with
//   cardano-signer sign --data-hex "<hex>" --secret-key <key>.skey --json
// and pastes the JSON output back. The server verifies the Ed25519 signature,
// derives the identity from the public key and checks it on-chain. Nothing
// here touches a browser wallet, so DReps, SPOs and CC members whose keys
// never leave the CLI can still sign in.

const RAW_SIG_HEX_LEN = 128;
const RAW_PUBKEY_HEX_LEN = 64;

function isHexExact(s, len) {
  return typeof s === "string" && s.length === len && /^[0-9a-f]+$/.test(s);
}

function firstString(...vals) {
  for (const v of vals) {
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
}

/**
 * Extracts the signer material from whatever the user pasted. Accepts the
 * plain cardano-signer JSON ({signature, publicKey}) or two bare hex strings
 * in any order (told apart by length). The --cip30 COSE output is recognised
 * only to explain that the plain command is needed. Returns null when nothing
 * usable is found, so the caller never sends junk to the server.
 */
export function parseSignerOutput(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{")) {
    let obj;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      return null;
    }
    if (!obj || typeof obj !== "object") return null;
    const sig = firstString(obj.signature, obj.signatureHex);
    const pub = firstString(obj.publicKey, obj.publicKeyHex, obj.pubKey);
    if (sig && pub) {
      const out = { kind: "raw", signatureHex: sig.toLowerCase(), publicKeyHex: pub.toLowerCase() };
      return isHexExact(out.signatureHex, RAW_SIG_HEX_LEN) && isHexExact(out.publicKeyHex, RAW_PUBKEY_HEX_LEN) ? out : null;
    }
    if (firstString(obj.COSE_Sign1_hex, obj.cose_sign1_hex) && firstString(obj.COSE_Key_hex, obj.cose_key_hex)) {
      return { kind: "cose" };
    }
    return null;
  }

  const runs = trimmed.toLowerCase().match(/[0-9a-f]+/g) ?? [];
  const sig = runs.find((r) => r.length === RAW_SIG_HEX_LEN);
  const pub = runs.find((r) => r.length === RAW_PUBKEY_HEX_LEN);
  return sig && pub ? { kind: "raw", signatureHex: sig, publicKeyHex: pub } : null;
}

/** UTF-8 hex of the challenge, which is what `--data-hex` signs. */
export function challengeToHex(payload) {
  return Array.from(new TextEncoder().encode(payload), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Requests a fresh single-use challenge from the server. */
export async function requestChallenge() {
  try {
    const res = await fetch("/api/auth/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    });
    if (!res.ok) return { ok: false, error: "Could not get a sign-in challenge. Please try again." };
    const data = await res.json();
    return typeof data?.payload === "string" && data.payload
      ? { ok: true, payload: data.payload }
      : { ok: false, error: "Could not get a sign-in challenge. Please try again." };
  } catch {
    return { ok: false, error: "Could not reach Civitas to get a sign-in challenge." };
  }
}

// Maps the server's terse error codes to clear, role-aware sentences.
export function friendlySignerError(error, role) {
  const e = String(error || "").toLowerCase();
  if (!e) return "Sign-in failed. Please try again.";
  if (e.includes("nonce")) return "Your sign-in challenge expired. Refresh it and sign again.";
  if (e.includes("signature verification")) {
    return "We could not verify that signature. Make sure you signed the exact challenge shown here, with the plain command (no --cip30).";
  }
  if (e.includes("not an active drep")) {
    return "This key is not a registered, active DRep on this network. Register as a DRep first, or check that you signed with drep.skey.";
  }
  if (e.includes("not an active spo")) {
    return "This Calidus key is not registered to an active stake pool on this network. Register a Calidus key for your pool first (CIP-151), then try again.";
  }
  if (e.includes("not an authorized cc")) {
    return "This hot key is not an authorized, key-based Constitutional Committee credential on this network.";
  }
  if (e.includes("rate limit") || e.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  if (e.includes("lookup failed") || e.includes("unavailable")) {
    return `Civitas could not check this ${role === "drep" ? "DRep" : role === "spo" ? "pool" : "committee credential"} on-chain right now. Please try again in a moment.`;
  }
  if (e.includes("invalid request")) return "Something was off with the sign-in request. Refresh the challenge and try again.";
  const msg = String(error).charAt(0).toUpperCase() + String(error).slice(1);
  return /[.!?]$/.test(msg) ? msg : `${msg}.`;
}

/**
 * Completes a cardano-signer sign-in: parses the pasted output, then POSTs the
 * signature and public key with the original challenge. Resolves to
 * { ok: true, identity } or { ok: false, error }; never throws.
 */
export async function loginOffline({ role, payload, pastedText }) {
  const parsed = parseSignerOutput(pastedText);
  if (!parsed) {
    return {
      ok: false,
      error: 'Could not read a signature from what you pasted. Paste the full JSON output of cardano-signer: {"signature": "…", "publicKey": "…"}.'
    };
  }
  if (parsed.kind === "cose") {
    return {
      ok: false,
      error: "That is the --cip30 (COSE) output. Run the plain command shown above, without --cip30, and paste that output instead."
    };
  }

  try {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payload,
        signatureHex: parsed.signatureHex,
        publicKeyHex: parsed.publicKeyHex,
        role
      })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok || !data.identity) {
      return { ok: false, error: friendlySignerError(data?.error || `login failed (HTTP ${res.status})`, role) };
    }
    return { ok: true, identity: data.identity };
  } catch {
    return { ok: false, error: "Could not reach Civitas to verify the signature. Please try again." };
  }
}
