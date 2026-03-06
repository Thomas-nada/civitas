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
  // MeshJS txBuilder.proposal() passes anchor directly to toCardanoAnchor,
  // which reads anchorUrl and anchorDataHash — not url/hash.
  return { anchorUrl: url, anchorDataHash: hash };
}

function resolveNetwork(walletNetworkId, network) {
  if (network) return network;
  return Number(walletNetworkId) === 1 ? "mainnet" : "preview";
}

function pickPureLovelaceCollateral(utxos = []) {
  return utxos.find((utxo) => {
    const amount = Array.isArray(utxo?.output?.amount) ? utxo.output.amount : [];
    return amount.length === 1 && String(amount[0]?.unit || "") === "lovelace";
  });
}

async function ensureCollateral(tx, walletApi, needsCollateral) {
  if (!needsCollateral) return;

  const fromWalletCollateral = await walletApi.getCollateral?.().catch(() => []);
  if (Array.isArray(fromWalletCollateral) && fromWalletCollateral.length > 0) {
    tx.setCollateral([fromWalletCollateral[0]]);
    return;
  }

  const utxos = await walletApi.getUtxos?.().catch(() => []);
  const fallback = pickPureLovelaceCollateral(Array.isArray(utxos) ? utxos : []);
  if (fallback) {
    tx.setCollateral([fallback]);
    return;
  }

  throw new Error(
    "No collateral UTxO available. Create a pure-ADA UTxO in your wallet, then retry."
  );
}

function extractMinimumRequiredFeeLovelace(errorLike) {
  const raw = String(errorLike?.message || errorLike || "");
  const marker = "Data:";
  const markerIndex = raw.indexOf(marker);
  if (markerIndex === -1) return null;
  const jsonPart = raw.slice(markerIndex + marker.length).trim();
  try {
    const parsed = JSON.parse(jsonPart);
    const value = Number(parsed?.minimumRequiredFee?.ada?.lovelace);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function extractMinimumRequiredFeeFromEvaluation(evalData) {
  const stack = [evalData];
  while (stack.length > 0) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;

    const value = Number(cur?.minimumRequiredFee?.ada?.lovelace);
    if (Number.isFinite(value) && value > 0) return value;

    for (const v of Object.values(cur)) {
      if (v && typeof v === "object") stack.push(v);
    }
  }
  return null;
}

async function evaluateTxCbor(txCbor) {
  const evalRes = await fetch("http://127.0.0.1:8080/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txCbor })
  });
  const evalData = await evalRes.json();
  return { evalRes, evalData };
}

async function buildGovernanceTx({
  walletApi,
  walletNetworkId,
  governanceAction,
  normalizedAnchor,
  rewardAddress,
  deposit,
  network,
  script,
  feeOverride
}) {
  const tx = new Transaction({ initiator: walletApi, verbose: false });
  tx.setNetwork(resolveNetwork(walletNetworkId, network));
  tx.txBuilder.proposal(governanceAction, normalizedAnchor, rewardAddress, String(deposit));
  applyProposalScript(tx.txBuilder, script);
  await ensureCollateral(tx, walletApi, Boolean(script));
  if (feeOverride) tx.txBuilder.setFee(String(feeOverride));

  const unsignedTx = await tx.build();
  return { unsignedTx };
}

function applyProposalScript(txBuilder, script) {
  console.log("[applyProposalScript] called, script =", JSON.stringify(script));
  if (!script || typeof script !== "object") {
    console.log("[applyProposalScript] early return — script is null/undefined/non-object");
    return;
  }

  const version = script.version || "V3";
  if (script.reference) {
    const ref = script.reference;
    console.log("[applyProposalScript] using reference script:", ref);
    txBuilder.proposalTxInReference(
      ref.txHash,
      ref.txIndex,
      String(ref.scriptSize),
      ref.scriptHash,
      version
    );
  } else if (script.scriptCbor) {
    console.log("[applyProposalScript] using inline script, cborLen =", script.scriptCbor.length);
    txBuilder.proposalScript(script.scriptCbor, version);
  } else {
    console.warn("[applyProposalScript] script object has neither reference nor scriptCbor — no script added");
  }

  console.log("[applyProposalScript] proposalItem after script setup:", JSON.stringify(txBuilder.proposalItem));

  if (script.redeemer !== undefined) {
    const redeemer = script.redeemer;
    console.log("[applyProposalScript] using explicit redeemer:", redeemer);
    txBuilder.proposalRedeemerValue(
      redeemer.value ?? redeemer,
      redeemer.type,
      redeemer.exUnits
    );
  } else {
    console.log("[applyProposalScript] applying default void redeemer (constr 0 [])");
    txBuilder.proposalRedeemerValue(
      { constructor: 0, fields: [] },
      "JSON",
      { mem: 14_000_000, steps: 10_000_000_000 }
    );
  }

  console.log("[applyProposalScript] proposalItem.redeemer after setting:", JSON.stringify(txBuilder.proposalItem?.redeemer));
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
  let { unsignedTx } = await buildGovernanceTx({
    walletApi,
    walletNetworkId,
    governanceAction,
    normalizedAnchor,
    rewardAddress,
    deposit,
    network,
    script
  });
  let signedTx = "";

  // Preflight evaluate unsigned tx to catch insufficient-fee before first sign prompt.
  // This keeps the common path to a single wallet signature.
  try {
    const { evalRes, evalData } = await evaluateTxCbor(unsignedTx);
    const minimumRequiredFee = !evalRes.ok ? extractMinimumRequiredFeeFromEvaluation(evalData) : null;
    if (minimumRequiredFee) {
      const paddedFee = minimumRequiredFee + 100_000;
      console.warn(`[Civitas] pre-sign fee adjust using evaluateTransaction: fee=${paddedFee} lovelace.`);
      ({ unsignedTx } = await buildGovernanceTx({
        walletApi,
        walletNetworkId,
        governanceAction,
        normalizedAnchor,
        rewardAddress,
        deposit,
        network,
        script,
        feeOverride: paddedFee
      }));
    }
  } catch (evalErr) {
    console.warn("[Civitas] Pre-sign evaluate skipped:", evalErr.message);
  }

  signedTx = await walletApi.signTx(unsignedTx, true, true);

  // --- Evaluate the transaction via Blockfrost before submitting ---
  // This gives us the exact Plutus failure reason (script logic rejection vs
  // budget exhaustion) without wasting a collateral output.
  try {
    const { evalRes, evalData } = await evaluateTxCbor(signedTx);
    console.group("[Civitas] Blockfrost tx evaluation");
    console.log("HTTP status:", evalRes.status);
    console.log("Result:", JSON.stringify(evalData, null, 2));
    console.groupEnd();

    // Only block submission if Ogmios definitively says the script failed.
    // Generic 500s (e.g. network issues, unsupported era) are non-fatal.
    if (evalData?.isFailure) {
      const detail = JSON.stringify(evalData.evaluation?.result?.EvaluationFailure ?? evalData.evaluation, null, 2);
      throw new Error(`Script evaluation failed (tx not submitted):\n${detail}`);
    }
  } catch (evalErr) {
    // Re-throw only definitive script failures.
    if (evalErr.message?.startsWith("Script evaluation failed")) throw evalErr;
    console.warn("[Civitas] Evaluate skipped:", evalErr.message);
  }
  // --- End evaluation ---

  let txHash;
  try {
    txHash = await walletApi.submitTx(signedTx);
  } catch (submitErr) {
    const minimumRequiredFee = extractMinimumRequiredFeeLovelace(submitErr);
    if (!minimumRequiredFee) throw submitErr;

    const paddedFee = minimumRequiredFee + 100_000;
    console.warn(`[Civitas] submitTx insufficient fee. Retrying with fee=${paddedFee} lovelace.`);
    ({ unsignedTx } = await buildGovernanceTx({
      walletApi,
      walletNetworkId,
      governanceAction,
      normalizedAnchor,
      rewardAddress,
      deposit,
      network,
      script,
      feeOverride: paddedFee
    }));
    signedTx = await walletApi.signTx(unsignedTx, true, true);
    txHash = await walletApi.submitTx(signedTx);
  }

  return {
    txHash,
    unsignedTx,
    signedTx
  };
}
