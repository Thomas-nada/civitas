// Sign-in roles. A role picks which key signs, and therefore what the session
// can do: the DRep key to act as a registered DRep, the stake key for
// everything a delegator does, the Calidus key (CIP-151) for a stake pool
// operator, the hot key for a Constitutional Committee member. `methods` says
// which sign-in method offers the role: a browser wallet (CIP-30/95) or
// cardano-signer on the command line (the only way for an SPO or CC member,
// and the way for a DRep whose keys never touch a browser).
export const ROLES = [
  {
    key: "drep",
    label: "DRep",
    signKey: "drep",
    requiresCip95: true,
    methods: ["wallet", "signer"],
    keyFile: "drep.skey",
    hint: "Sign with your DRep key to vote on governance actions. The key must belong to a registered, active DRep."
  },
  {
    key: "delegator",
    label: "Delegator",
    signKey: "stake",
    methods: ["wallet"],
    hint: "Sign with your stake key to delegate, answer surveys and follow how your DRep votes."
  },
  {
    key: "spo",
    label: "SPO",
    signKey: "calidus",
    methods: ["signer"],
    keyFile: "calidus.skey",
    hint: "Sign with your pool's Calidus key (CIP-151). The key must be registered for an active stake pool."
  },
  {
    key: "cc",
    label: "CC member",
    signKey: "cc-hot",
    methods: ["signer"],
    keyFile: "cc-hot.skey",
    hint: "Sign with your Constitutional Committee hot key. It must be an authorized, key-based committee credential."
  }
];

export const WALLET_ROLES = ROLES.filter((r) => r.methods.includes("wallet"));
export const SIGNER_ROLES = ROLES.filter((r) => r.methods.includes("signer"));
// Every role, for the topbar's "Enter as …" shortcuts.
export const VISIBLE_ROLES = ROLES;
export const DEFAULT_ROLE = "delegator";

export const SIGN_KEY_LABELS = {
  drep: "DRep key",
  stake: "Stake key",
  calidus: "Calidus key",
  "cc-hot": "CC hot key"
};

export function roleByKey(key) {
  return ROLES.find((r) => r.key === key) || null;
}

export function normalizeRole(key) {
  return roleByKey(key) ? key : DEFAULT_ROLE;
}

export function roleLabel(key) {
  return roleByKey(key)?.label || "";
}

export function signKeyForRole(key) {
  return roleByKey(key)?.signKey || "stake";
}

/** The sign-in method a role should open on: wallet when it offers one, else cardano-signer. */
export function defaultMethodForRole(key) {
  const role = roleByKey(key);
  return role && !role.methods.includes("wallet") ? "signer" : "wallet";
}

// The role last signed in with, so the dialog opens on it next time.
const ROLE_STORAGE_KEY = "civitas.signInRole";

export function rememberRole(key) {
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, normalizeRole(key));
  } catch {
    // Storage unavailable; the dialog falls back to the default role.
  }
}

export function recallRole() {
  try {
    return normalizeRole(localStorage.getItem(ROLE_STORAGE_KEY) || "");
  } catch {
    return DEFAULT_ROLE;
  }
}
