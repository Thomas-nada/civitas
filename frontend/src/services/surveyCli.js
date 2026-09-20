// Answering a survey from a cardano-signer session (no browser wallet): the
// role's credential for Tessera's form, the finished label-17 payload as a
// cardano-cli metadata file, the command that carries it, and the signed
// transaction handed back for submission through Koios.
import blakejs from "blakejs";
import { bech32 } from "bech32";
import { Role, submitViaKoios } from "./surveyTxService";
import { hexToBytes } from "cip-179/domain";

const HEX28 = /^[0-9a-f]{56}$/i;

function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** The 28-byte key hash inside a bech32 id: CIP-129 ids carry a 1-byte header first. */
function keyHashFromBech32(id) {
  const { words } = bech32.decode(String(id || "").trim(), 1000);
  const bytes = bech32.fromWords(words);
  if (bytes.length === 28) return bytesToHex(bytes);
  if (bytes.length === 29) return bytesToHex(bytes.slice(1));
  throw new Error("Unexpected id length.");
}

/**
 * The credential a cardano-signer session answers with, by the session's
 * role: an SPO's pool cold key (the pool id), a CC member's hot key, a
 * DRep's DRep key. Returns { role, roleName, keyHash, signerKey } or null.
 * `signerKey` names the key file that must witness the transaction.
 */
export function cliCredential(identity) {
  if (!identity?.role) return null;
  try {
    switch (identity.role) {
      case "spo": {
        if (!identity.poolId) return null;
        return { role: Role.SPO, roleName: "SPO", keyHash: keyHashFromBech32(identity.poolId), signerKey: "the pool's cold key (cold.skey)" };
      }
      case "cc": {
        const keyHash = HEX28.test(identity.hotKeyHash || "")
          ? identity.hotKeyHash.toLowerCase()
          : identity.publicKeyHex
            ? blakejs.blake2bHex(hexToBytes(identity.publicKeyHex), null, 28)
            : identity.ccHotId ? keyHashFromBech32(identity.ccHotId) : "";
        if (!keyHash) return null;
        return { role: Role.CC, roleName: "CC", keyHash, signerKey: "the committee hot key (cc-hot.skey)" };
      }
      case "drep": {
        const keyHash = identity.publicKeyHex
          ? blakejs.blake2bHex(hexToBytes(identity.publicKeyHex), null, 28)
          : identity.drepId ? keyHashFromBech32(identity.drepId) : "";
        if (!keyHash) return null;
        return { role: Role.DRep, roleName: "DRep", keyHash, signerKey: "the DRep key (drep.skey)" };
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/** cardano-cli's detailed metadata JSON schema for a CIP-179 metadatum. */
export function metadatumToCliJson(m) {
  if (typeof m === "bigint" || typeof m === "number") return { int: Number(m) <= Number.MAX_SAFE_INTEGER ? Number(m) : m.toString() };
  if (typeof m === "string") return { string: m };
  if (m instanceof Uint8Array) return { bytes: bytesToHex(m) };
  if (Array.isArray(m)) return { list: m.map(metadatumToCliJson) };
  if (m instanceof Map) return { map: Array.from(m, ([k, v]) => ({ k: metadatumToCliJson(k), v: metadatumToCliJson(v) })) };
  throw new Error("Unsupported metadatum value.");
}

/** The whole metadata file: label 17 → the payload. */
export function metadataFileJson(payload) {
  return JSON.stringify({ 17: metadatumToCliJson(payload) }, null, 2);
}

/** The cardano-cli steps that carry the answer, for the user to adapt. */
export function cliCommands({ keyHash, signerKey }) {
  return [
    `# 1. Build: your own funding UTxO and change address; the answer rides as metadata,
#    and the credential is proven by the required signer.
cardano-cli conway transaction build \\
  --mainnet \\
  --tx-in <TX_HASH>#<IX> \\
  --change-address <YOUR_ADDRESS> \\
  --metadata-json-file civitas-survey-answer.json \\
  --required-signer-hash ${keyHash} \\
  --witness-override 2 \\
  --out-file answer.raw`,
    `# 2. Sign with the payment key that owns the UTxO and with ${signerKey}.
cardano-cli conway transaction sign \\
  --mainnet \\
  --tx-body-file answer.raw \\
  --signing-key-file payment.skey \\
  --signing-key-file <ROLE_KEY>.skey \\
  --out-file answer.signed`,
    `# 3. Submit here (paste answer.signed below) or yourself:
cardano-cli conway transaction submit --mainnet --tx-file answer.signed`,
  ];
}

/** The signed transaction as hex, from raw hex or a cardano-cli envelope. */
export function signedTxHexFrom(input) {
  const text = String(input || "").trim();
  if (!text) return "";
  if (/^[0-9a-f]+$/i.test(text)) return text.toLowerCase();
  try {
    const parsed = JSON.parse(text);
    const hex = String(parsed?.cborHex || "").trim();
    if (/^[0-9a-f]+$/i.test(hex)) return hex.toLowerCase();
  } catch {
    // not JSON
  }
  return "";
}

/** Submits a signed transaction (hex) through Koios; resolves to its hash. */
export function submitSignedHex(hex) {
  return submitViaKoios(hex);
}

/** A file download of the metadata JSON. */
export function downloadTextFile(name, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
