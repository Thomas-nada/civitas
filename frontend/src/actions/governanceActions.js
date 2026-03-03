import { Transaction } from "@meshsdk/core";

export const GOVERNANCE_ACTION_KINDS = Object.freeze([
  "ParameterChangeAction",
  "HardForkInitiationAction",
  "TreasuryWithdrawalsAction",
  "NoConfidenceAction",
  "UpdateCommitteeAction",
  "NewConstitutionAction",
  "InfoAction"
]);

function validateGovernanceAction(governanceAction) {
  if (!governanceAction || typeof governanceAction !== "object") {
    throw new Error("governanceAction is required.");
  }
  const kind = String(governanceAction.kind || "");
  if (!GOVERNANCE_ACTION_KINDS.includes(kind)) {
    throw new Error(`Unsupported governance action kind: ${kind || "unknown"}.`);
  }
  if (!("action" in governanceAction) || typeof governanceAction.action !== "object" || governanceAction.action === null) {
    throw new Error("governanceAction.action must be an object.");
  }
}

function normalizeAnchor(anchor) {
  if (!anchor || typeof anchor !== "object") {
    throw new Error("anchor is required.");
  }
  const url = String(anchor.url || "").trim();
  const hash = String(anchor.hash || "").trim();
  if (!url) throw new Error("anchor.url is required.");
  if (!hash) throw new Error("anchor.hash is required.");
  return { url, hash };
}

function resolveNetwork(walletNetworkId, network) {
  if (network) return network;
  return Number(walletNetworkId) === 1 ? "mainnet" : "preprod";
}

function applyProposalScript(txBuilder, script) {
  if (!script || typeof script !== "object") return;

  const version = script.version || "V3";
  if (script.reference) {
    const ref = script.reference;
    txBuilder.proposalTxInReference(
      ref.txHash,
      ref.txIndex,
      String(ref.scriptSize),
      ref.scriptHash,
      version
    );
  } else if (script.scriptCbor) {
    txBuilder.proposalScript(script.scriptCbor, version);
  }

  if (script.redeemer !== undefined) {
    const redeemer = script.redeemer;
    txBuilder.proposalRedeemerValue(
      redeemer.value ?? redeemer,
      redeemer.type,
      redeemer.exUnits
    );
  }
}

export function createGovernanceAction(kind, action = {}) {
  const governanceAction = { kind, action };
  validateGovernanceAction(governanceAction);
  return governanceAction;
}

export async function submitGovernanceAction({
  walletApi,
  walletNetworkId,
  governanceAction,
  anchor,
  rewardAddress,
  deposit = "100000000000",
  network,
  script
}) {
  if (!walletApi) throw new Error("walletApi is required.");
  if (!rewardAddress) throw new Error("rewardAddress is required.");

  validateGovernanceAction(governanceAction);
  const normalizedAnchor = normalizeAnchor(anchor);
  const tx = new Transaction({ initiator: walletApi, verbose: false });
  tx.setNetwork(resolveNetwork(walletNetworkId, network));

  tx.txBuilder.proposal(governanceAction, normalizedAnchor, rewardAddress, String(deposit));
  applyProposalScript(tx.txBuilder, script);

  const unsignedTx = await tx.build();
  const signedTx = await walletApi.signTx(unsignedTx, true, true);
  const txHash = await walletApi.submitTx(signedTx);

  return {
    txHash,
    unsignedTx,
    signedTx
  };
}
