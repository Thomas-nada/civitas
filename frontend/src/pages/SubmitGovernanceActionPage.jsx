import { useContext, useMemo, useState } from "react";
import blakejs from "blakejs";
import {
  GOVERNANCE_ACTION_KINDS,
  createGovernanceAction,
  submitGovernanceAction
} from "../actions/governanceActions";
import { WalletContext } from "../context/WalletContext";

const DEFAULT_DEPOSIT = "100000000000";
const ACTION_HELP = {
  ParameterChangeAction: "Change protocol parameters (fees, limits, deposits).",
  HardForkInitiationAction: "Start a protocol version upgrade.",
  TreasuryWithdrawalsAction: "Withdraw ADA from treasury to reward addresses.",
  NoConfidenceAction: "Signal no confidence.",
  UpdateCommitteeAction: "Set committee members, removals, and quorum.",
  NewConstitutionAction: "Point to a new constitution document anchor.",
  InfoAction: "Informational action with no extra action fields."
};

const ACTION_CONFIRMATIONS = {
  TreasuryWithdrawalsAction: [
    "I confirmed each withdrawal address and lovelace amount.",
    "I confirmed the governance policy hash matches current guardrails.",
    "I understand this action moves treasury funds and is irreversible after enactment."
  ],
  ParameterChangeAction: [
    "I confirmed each protocol parameter key/value is intentional and correctly formatted.",
    "I confirmed the governance policy hash matches current guardrails (if required).",
    "I understand this action can change chain-wide protocol behavior."
  ],
  NewConstitutionAction: [
    "I confirmed the constitution anchor URL and hash point to the intended document.",
    "I confirmed the constitution script hash is correct (if provided).",
    "I understand this action can change constitutional/guardrails behavior."
  ],
  HardForkInitiationAction: [
    "I confirmed the target protocol major/minor version is correct.",
    "I understand this action signals a protocol upgrade path."
  ],
  UpdateCommitteeAction: [
    "I confirmed all committee members/removals and term limits are correct.",
    "I confirmed quorum numerator/denominator values are intentional.",
    "I understand this action changes governance committee control."
  ],
  NoConfidenceAction: [
    "I confirmed this no-confidence action is intentional.",
    "I understand this action has major governance consequences."
  ],
  InfoAction: [
    "I confirmed this informational action text/anchor is final."
  ]
};

const SCRIPT_MODE_HELP = {
  none: "Recommended for most users. Use this when your governance action does not require a Plutus script witness.",
  inline: "Use this only if you were given full script CBOR and told to include the whole script directly in this transaction.",
  reference: "Use this only if you already have a script stored on-chain and were given its reference UTxO details (tx hash, index, size, hash)."
};

function resolveIpfsUrl(url) {
  if (!url) return "";
  if (url.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${url.slice(7)}`;
  return url;
}

function asJson(value) {
  return JSON.stringify(value, null, 2);
}

function toNonNegativeInt(raw, label) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer.`);
  return value;
}

function toGovActionId(txHash, txIndexRaw) {
  const normalizedTxHash = String(txHash || "").trim();
  if (!normalizedTxHash) return undefined;
  return {
    txHash: normalizedTxHash,
    txIndex: toNonNegativeInt(txIndexRaw, "Parent tx index")
  };
}

function parseScalar(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  if (text === "true") return true;
  if (text === "false") return false;
  if (/^-?\d+$/.test(text)) return Number(text);
  return text;
}

function parseProtocolParamLines(raw) {
  const lines = String(raw || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const updates = {};

  for (const line of lines) {
    const splitAt = line.indexOf("=");
    if (splitAt <= 0) throw new Error(`Invalid protocol update line: "${line}". Use key=value format.`);
    const key = line.slice(0, splitAt).trim();
    const value = line.slice(splitAt + 1).trim();
    if (!key) throw new Error(`Missing key in line: "${line}".`);
    updates[key] = parseScalar(value);
  }

  return updates;
}

function normalizeCredential(kind, hash) {
  const type = kind === "ScriptHash" ? "ScriptHash" : "KeyHash";
  if (type === "ScriptHash") return { type, scriptHash: hash };
  return { type, keyHash: hash };
}

function HelpTip({ text }) {
  if (!text) return null;
  return (
    <span className="submit-gov-tip" tabIndex={0} aria-label="Field help">
      <span className="submit-gov-tip-icon" aria-hidden="true">i</span>
      <span className="submit-gov-tip-popover" role="tooltip">{text}</span>
    </span>
  );
}

function FieldWithHelp({ label, help, children }) {
  return (
    <label className="submit-gov-field-label">
      <span className="submit-gov-label-row">
        <span>{label}</span>
        <HelpTip text={help} />
      </span>
      {children}
    </label>
  );
}

export default function SubmitGovernanceActionPage() {
  const wallet = useContext(WalletContext);
  const [actionKind, setActionKind] = useState("InfoAction");
  const [anchorUrl, setAnchorUrl] = useState("");
  const [anchorHash, setAnchorHash] = useState("");
  const [rewardAddress, setRewardAddress] = useState(wallet?.walletRewardAddress || "");
  const [deposit, setDeposit] = useState(DEFAULT_DEPOSIT);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [guardrailsWarning, setGuardrailsWarning] = useState("");
  const [txHash, setTxHash] = useState("");
  const [guardrailsLoading, setGuardrailsLoading] = useState(false);
  const [inlineScriptLoading, setInlineScriptLoading] = useState(false);
  const [scriptMode, setScriptMode] = useState("none");
  const [scriptVersion, setScriptVersion] = useState("V3");
  const [scriptCbor, setScriptCbor] = useState("");
  const [referenceTxHash, setReferenceTxHash] = useState("");
  const [referenceTxIndex, setReferenceTxIndex] = useState("0");
  const [referenceScriptSize, setReferenceScriptSize] = useState("");
  const [referenceScriptHash, setReferenceScriptHash] = useState("");

  const [parentTxHash, setParentTxHash] = useState("");
  const [parentTxIndex, setParentTxIndex] = useState("0");

  const [parameterLines, setParameterLines] = useState("");
  const [parameterPolicyHash, setParameterPolicyHash] = useState("");

  const [hardForkMajor, setHardForkMajor] = useState("10");
  const [hardForkMinor, setHardForkMinor] = useState("0");

  const [treasuryRows, setTreasuryRows] = useState([{ rewardAddress: "", lovelace: "" }]);
  const [treasuryPolicyHash, setTreasuryPolicyHash] = useState("");

  const [committeeRows, setCommitteeRows] = useState([{ credentialType: "KeyHash", credentialHash: "", termLimit: "" }]);
  const [removeRows, setRemoveRows] = useState([{ credentialType: "KeyHash", credentialHash: "" }]);
  const [quorumNumerator, setQuorumNumerator] = useState("1");
  const [quorumDenominator, setQuorumDenominator] = useState("2");

  const [constitutionUrl, setConstitutionUrl] = useState("");
  const [constitutionHash, setConstitutionHash] = useState("");
  const [constitutionScriptHash, setConstitutionScriptHash] = useState("");

  const connected = Boolean(wallet?.walletApi);
  const [checklistState, setChecklistState] = useState({});
  const networkLabel = useMemo(() => {
    if (wallet?.walletNetworkId === 1) return "mainnet";
    if (wallet?.walletNetworkId === 0) return "testnet (not supported for submissions)";
    return "unknown";
  }, [wallet?.walletNetworkId]);
  const isGuardrailsAction = actionKind === "TreasuryWithdrawalsAction" || actionKind === "ParameterChangeAction";
  const confirmationItems = useMemo(
    () =>
      (ACTION_CONFIRMATIONS[actionKind] || []).map((label, index) => ({
        id: `${actionKind}-${index}`,
        label
      })),
    [actionKind]
  );
  const allConfirmationsChecked = useMemo(
    () => confirmationItems.every((item) => Boolean(checklistState[item.id])),
    [confirmationItems, checklistState]
  );

  function buildActionPayload() {
    const parentGovActionId = toGovActionId(parentTxHash, parentTxIndex);

    if (actionKind === "ParameterChangeAction") {
      const protocolParamUpdates = parseProtocolParamLines(parameterLines);
      const payload = { protocolParamUpdates };
      if (parentGovActionId) payload.govActionId = parentGovActionId;
      if (String(parameterPolicyHash || "").trim()) payload.policyHash = String(parameterPolicyHash).trim();
      return payload;
    }

    if (actionKind === "HardForkInitiationAction") {
      const payload = {
        protocolVersion: {
          major: toNonNegativeInt(hardForkMajor, "Hard fork major"),
          minor: toNonNegativeInt(hardForkMinor, "Hard fork minor")
        }
      };
      if (parentGovActionId) payload.govActionId = parentGovActionId;
      return payload;
    }

    if (actionKind === "TreasuryWithdrawalsAction") {
      const withdrawals = {};
      for (const row of treasuryRows) {
        const reward = String(row.rewardAddress || "").trim();
        const lovelace = String(row.lovelace || "").trim();
        if (!reward && !lovelace) continue;
        if (!reward || !lovelace) throw new Error("Each treasury withdrawal row needs both reward address and lovelace.");
        withdrawals[reward] = lovelace;
      }
      if (Object.keys(withdrawals).length === 0) throw new Error("Add at least one treasury withdrawal.");
      const payload = { withdrawals };
      if (String(treasuryPolicyHash || "").trim()) payload.policyHash = String(treasuryPolicyHash).trim();
      return payload;
    }

    if (actionKind === "NoConfidenceAction") {
      return parentGovActionId ? { govActionId: parentGovActionId } : {};
    }

    if (actionKind === "UpdateCommitteeAction") {
      const members = committeeRows
        .map((row) => {
          const hash = String(row.credentialHash || "").trim();
          const term = String(row.termLimit || "").trim();
          if (!hash && !term) return null;
          if (!hash || !term) throw new Error("Each committee member row needs credential hash and term limit.");
          return {
            stakeCredential: normalizeCredential(row.credentialType, hash),
            termLimit: toNonNegativeInt(term, "Committee member term limit")
          };
        })
        .filter(Boolean);
      if (members.length === 0) throw new Error("Add at least one committee member.");

      const membersToRemove = removeRows
        .map((row) => {
          const hash = String(row.credentialHash || "").trim();
          if (!hash) return null;
          return normalizeCredential(row.credentialType, hash);
        })
        .filter(Boolean);

      const payload = {
        committee: {
          members,
          quorumThreshold: {
            numerator: toNonNegativeInt(quorumNumerator, "Quorum numerator"),
            denominator: toNonNegativeInt(quorumDenominator, "Quorum denominator")
          }
        },
        membersToRemove
      };
      if (parentGovActionId) payload.govActionId = parentGovActionId;
      return payload;
    }

    if (actionKind === "NewConstitutionAction") {
      const url = String(constitutionUrl || "").trim();
      const hash = String(constitutionHash || "").trim();
      if (!url) throw new Error("Constitution anchor URL is required.");
      if (!hash) throw new Error("Constitution anchor hash is required.");
      const payload = {
        constitution: {
          anchor: { url, hash }
        }
      };
      if (String(constitutionScriptHash || "").trim()) {
        payload.constitution.scriptHash = String(constitutionScriptHash).trim();
      }
      if (parentGovActionId) payload.govActionId = parentGovActionId;
      return payload;
    }

    return {};
  }

  const payloadBuild = useMemo(() => {
    try {
      const payload = buildActionPayload();
      return { payload, json: asJson(payload), error: "" };
    } catch (e) {
      return { payload: null, json: "{}", error: e?.message || "Invalid action form input." };
    }
  }, [
    actionKind,
    parentTxHash,
    parentTxIndex,
    parameterLines,
    parameterPolicyHash,
    hardForkMajor,
    hardForkMinor,
    treasuryRows,
    treasuryPolicyHash,
    committeeRows,
    removeRows,
    quorumNumerator,
    quorumDenominator,
    constitutionUrl,
    constitutionHash,
    constitutionScriptHash
  ]);

  const fullProposalBuild = useMemo(() => {
    if (!payloadBuild.payload) return null;

    let script = undefined;
    if (scriptMode === "inline" && String(scriptCbor || "").trim()) {
      script = {
        mode: "inline",
        version: scriptVersion,
        scriptCbor: String(scriptCbor).trim()
      };
    } else if (
      scriptMode === "reference" &&
      String(referenceTxHash || "").trim() &&
      String(referenceScriptSize || "").trim() &&
      String(referenceScriptHash || "").trim()
    ) {
      script = {
        mode: "reference",
        version: scriptVersion,
        reference: {
          txHash: String(referenceTxHash).trim(),
          txIndex: Number(referenceTxIndex || 0),
          scriptSize: String(referenceScriptSize).trim(),
          scriptHash: String(referenceScriptHash).trim()
        }
      };
    }

    return {
      governanceAction: {
        kind: actionKind,
        action: payloadBuild.payload
      },
      anchor: {
        url: String(anchorUrl || "").trim(),
        hash: String(anchorHash || "").trim()
      },
      rewardAddress: String(rewardAddress || "").trim(),
      deposit: String(deposit || DEFAULT_DEPOSIT).trim(),
      network: "mainnet",
      script: script || null
    };
  }, [
    actionKind,
    payloadBuild.payload,
    anchorUrl,
    anchorHash,
    rewardAddress,
    deposit,
    wallet?.walletNetworkId,
    scriptMode,
    scriptVersion,
    scriptCbor,
    referenceTxHash,
    referenceTxIndex,
    referenceScriptSize,
    referenceScriptHash
  ]);

  async function generateAnchorHash() {
    try {
      setError("");
      setNotice("");
      const url = String(anchorUrl || "").trim();
      if (!url) throw new Error("Anchor URL is required before hashing.");
      setNotice("Fetching anchor content...");
      const res = await fetch(resolveIpfsUrl(url));
      if (!res.ok) throw new Error(`Anchor fetch failed (${res.status}).`);
      const text = await res.text();
      const bytes = new TextEncoder().encode(text);
      setAnchorHash(blakejs.blake2bHex(bytes, null, 32));
      setNotice("Anchor hash generated.");
    } catch (e) {
      setNotice("");
      setError(e?.message || "Failed to generate anchor hash.");
    }
  }

  function updateTreasuryRow(index, key, value) {
    setTreasuryRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  function updateCommitteeRow(index, key, value) {
    setCommitteeRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  function updateRemoveRow(index, key, value) {
    setRemoveRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  async function fetchLatestGuardrails(network) {
    const res = await fetch(`/api/guardrails/latest?network=${encodeURIComponent(network)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 400 && data?.configuredNetwork && data?.requestedNetwork) {
        throw new Error(
          `Guardrails auto-fill network mismatch: backend is ${data.configuredNetwork}, but wallet/page requested ${data.requestedNetwork}. ` +
          `Either switch the form network to ${data.configuredNetwork} or restart backend with Blockfrost ${data.requestedNetwork} settings.`
        );
      }
      throw new Error(data.error || "Failed to fetch guardrails.");
    }
    return data;
  }

  async function autofillGuardrails() {
    if (!isGuardrailsAction) {
      setError("Auto-fill guardrails is currently supported for TreasuryWithdrawalsAction and ParameterChangeAction.");
      return;
    }
    try {
      setGuardrailsLoading(true);
      setError("");
      setNotice("");
      setGuardrailsWarning("");
      const selectedNetwork = "mainnet";
      const data = await fetchLatestGuardrails(selectedNetwork);

      const policyHash = String(data?.policyHash || "").trim().toLowerCase();
      if (!policyHash) throw new Error("Guardrails policy hash was missing in response.");
      if (actionKind === "TreasuryWithdrawalsAction") setTreasuryPolicyHash(policyHash);
      if (actionKind === "ParameterChangeAction") setParameterPolicyHash(policyHash);

      const preset = data?.referencePreset;
      if (preset && preset.txHash && Number.isFinite(Number(preset.txIndex)) && preset.scriptSize && preset.scriptHash) {
        const presetHash = String(preset.scriptHash || "").trim().toLowerCase();
        const stalePreset = Boolean(presetHash) && presetHash !== policyHash;
        setScriptMode("reference");
        setScriptVersion(String(preset.version || "V3"));
        setReferenceTxHash(String(preset.txHash));
        setReferenceTxIndex(String(preset.txIndex));
        setReferenceScriptSize(String(preset.scriptSize));
        setReferenceScriptHash(String(preset.scriptHash || policyHash).trim().toLowerCase());
        if (stalePreset) {
          setGuardrailsWarning(
            `Server reference preset looks stale for ${selectedNetwork}: preset hash ${presetHash} does not match latest on-chain guardrails hash ${policyHash}. ` +
            "Update GUARDRAILS_REFERENCE_PRESETS_JSON before submitting."
          );
          setNotice(`Loaded latest guardrails hash from ${data?.sourceActionType === "new_constitution" ? "NewConstitutionAction" : "TreasuryWithdrawalsAction"} (${selectedNetwork}).`);
        } else {
          setNotice(`Guardrails loaded: latest hash + reference script preset (${selectedNetwork}).`);
        }
      } else {
        setNotice(
          `Guardrails hash loaded from ${data?.sourceActionType === "new_constitution" ? "NewConstitutionAction" : "TreasuryWithdrawalsAction"} (${selectedNetwork}). ` +
          "Reference script preset is not configured on server."
        );
      }
    } catch (e) {
      setError(e?.message || "Failed to auto-fill guardrails.");
    } finally {
      setGuardrailsLoading(false);
    }
  }

  async function useInlineGuardrailsFromPolicyHash() {
    if (!isGuardrailsAction) {
      setError("Inline guardrails fetch is currently supported for TreasuryWithdrawalsAction and ParameterChangeAction.");
      return;
    }
    const hash = String(actionKind === "ParameterChangeAction" ? parameterPolicyHash : treasuryPolicyHash || "").trim().toLowerCase();
    if (!/^[0-9a-f]{56}$/.test(hash)) {
      setError("Set a valid 56-char governance policy hash first, then fetch inline script.");
      return;
    }
    try {
      setInlineScriptLoading(true);
      setError("");
      setNotice("");
      const res = await fetch(`/api/scripts/cbor?hash=${encodeURIComponent(hash)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to fetch script CBOR.");
      const cbor = String(data?.cbor || "").trim();
      if (!cbor) throw new Error("Server returned empty script CBOR.");
      setScriptMode("inline");
      if (String(data?.version || "").trim()) setScriptVersion(String(data.version).trim());
      setScriptCbor(cbor);
      setNotice("Inline script loaded from policy hash. Script mode switched to Inline.");
    } catch (e) {
      setError(e?.message || "Failed to fetch inline script.");
    } finally {
      setInlineScriptLoading(false);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!wallet?.walletApi) {
      setError("Connect wallet first.");
      return;
    }

    if (payloadBuild.error || !payloadBuild.payload) {
      setError(payloadBuild.error || "Action payload is invalid.");
      return;
    }
    if (!allConfirmationsChecked) {
      setError("Please confirm all required pre-submit checkboxes.");
      return;
    }

    try {
      setSubmitting(true);
      setNotice("");
      setError("");
      setTxHash("");

      const governanceAction = createGovernanceAction(actionKind, payloadBuild.payload);

      let script;
      if (scriptMode === "inline") {
        if (!scriptCbor.trim()) throw new Error("Script CBOR is required for inline mode.");
        script = {
          version: scriptVersion,
          scriptCbor: scriptCbor.trim()
        };
      }
      if (scriptMode === "reference") {
        if (!referenceTxHash.trim() || !referenceScriptSize.trim() || !referenceScriptHash.trim()) {
          throw new Error("Reference script fields are required for reference mode.");
        }
        if (isGuardrailsAction) {
          const selectedNetwork = "mainnet";
          const latest = await fetchLatestGuardrails(selectedNetwork);
          const latestHash = String(latest?.policyHash || "").trim().toLowerCase();
          const policyHash = String(actionKind === "ParameterChangeAction" ? parameterPolicyHash : treasuryPolicyHash || "").trim().toLowerCase();
          const referenceHash = String(referenceScriptHash || "").trim().toLowerCase();
          if (!policyHash) {
            throw new Error(`Governance Policy Hash is required when using reference script mode for ${actionKind}.`);
          }
          if (!latestHash) {
            throw new Error("Unable to verify latest guardrails hash from backend.");
          }
          if (policyHash !== latestHash) {
            throw new Error(`Governance Policy Hash does not match latest on-chain guardrails hash (${latestHash}).`);
          }
          if (referenceHash !== latestHash) {
            throw new Error(`Reference Script Hash does not match latest on-chain guardrails hash (${latestHash}).`);
          }
        }
        script = {
          version: scriptVersion,
          reference: {
            txHash: referenceTxHash.trim(),
            txIndex: Number(referenceTxIndex || 0),
            scriptSize: referenceScriptSize.trim(),
            scriptHash: referenceScriptHash.trim()
          }
        };
      }

      setNotice("Building, signing, and submitting transaction...");
      const result = await submitGovernanceAction({
        walletApi: wallet.walletApi,
        walletNetworkId: wallet.walletNetworkId,
        governanceAction,
        anchor: { url: anchorUrl.trim(), hash: anchorHash.trim() },
        rewardAddress: rewardAddress.trim(),
        deposit: String(deposit || DEFAULT_DEPOSIT).trim(),
        network: "mainnet",
        script
      });

      setTxHash(result.txHash);
      setNotice("Governance action submitted on-chain.");
    } catch (e) {
      setNotice("");
      setError(e?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="shell submit-gov-shell">
      <header className="hero">
        <h1>Submit Governance Action</h1>
        <p className="muted">
          Connected wallet network: <strong>{networkLabel}</strong>
        </p>
      </header>

      <section className="panel submit-gov-panel">
        {!connected ? <p className="muted">Connect your wallet in the top bar before submitting.</p> : null}

        <form className="submit-gov-form" onSubmit={onSubmit}>
          <FieldWithHelp label="Action Type" help={ACTION_HELP[actionKind]}>
            <select value={actionKind} onChange={(e) => setActionKind(e.target.value)}>
              {GOVERNANCE_ACTION_KINDS.map((kind) => (
                <option key={kind} value={kind}>{kind}</option>
              ))}
            </select>
          </FieldWithHelp>

          {(actionKind === "ParameterChangeAction" || actionKind === "HardForkInitiationAction" || actionKind === "NoConfidenceAction" || actionKind === "UpdateCommitteeAction" || actionKind === "NewConstitutionAction") ? (
            <>
              <FieldWithHelp label="Parent Governance Action Tx Hash (optional)" help="Use only if this action depends on a prior governance action.">
                <input type="text" value={parentTxHash} onChange={(e) => setParentTxHash(e.target.value)} placeholder="tx hash" />
              </FieldWithHelp>
              <FieldWithHelp label="Parent Tx Index" help="Output index in the parent transaction (usually 0).">
                <input type="number" min="0" value={parentTxIndex} onChange={(e) => setParentTxIndex(e.target.value)} />
              </FieldWithHelp>
            </>
          ) : null}

          {actionKind === "ParameterChangeAction" ? (
            <>
              <FieldWithHelp label="Protocol Parameter Updates (one per line, key=value)" help="Example: maxTxSize=16384">
                <textarea value={parameterLines} onChange={(e) => setParameterLines(e.target.value)} rows={8} spellCheck={false} className="submit-gov-json" placeholder={"maxTxSize=16384\ntxFeeFixed=155381\nstakeAddressDeposit=2000000"} />
              </FieldWithHelp>
              <FieldWithHelp label="Governance Policy Hash (optional)" help="Only required for policy-controlled parameter actions.">
                <input type="text" value={parameterPolicyHash} onChange={(e) => setParameterPolicyHash(e.target.value)} />
              </FieldWithHelp>
              <div className="submit-gov-inline">
                <button type="button" className="mode-btn" onClick={autofillGuardrails} disabled={guardrailsLoading}>
                  {guardrailsLoading ? "Loading guardrails..." : "Auto-fill guardrails"}
                </button>
                <button type="button" className="mode-btn" onClick={useInlineGuardrailsFromPolicyHash} disabled={inlineScriptLoading}>
                  {inlineScriptLoading ? "Loading inline script..." : "Use inline from policy hash"}
                </button>
                <HelpTip text="Fetches latest on-chain guardrails hash (from NewConstitutionAction when available) and can load inline script CBOR from that hash." />
              </div>
            </>
          ) : null}

          {actionKind === "HardForkInitiationAction" ? (
            <>
              <FieldWithHelp label="Protocol Major Version" help="Target major protocol version.">
                <input type="number" min="0" value={hardForkMajor} onChange={(e) => setHardForkMajor(e.target.value)} />
              </FieldWithHelp>
              <FieldWithHelp label="Protocol Minor Version" help="Target minor protocol version.">
                <input type="number" min="0" value={hardForkMinor} onChange={(e) => setHardForkMinor(e.target.value)} />
              </FieldWithHelp>
            </>
          ) : null}

          {actionKind === "TreasuryWithdrawalsAction" ? (
            <fieldset className="submit-gov-guided">
              <legend>Treasury Withdrawals <HelpTip text="Add one row per payout destination. Amount is lovelace (1 ADA = 1,000,000 lovelace)." /></legend>
              {treasuryRows.map((row, index) => (
                <div className="submit-gov-inline" key={`treasury-row-${index}`}>
                  <input type="text" value={row.rewardAddress} onChange={(e) => updateTreasuryRow(index, "rewardAddress", e.target.value)} placeholder="stake1..." />
                  <input type="text" value={row.lovelace} onChange={(e) => updateTreasuryRow(index, "lovelace", e.target.value)} placeholder="lovelace" />
                  {treasuryRows.length > 1 ? <button type="button" className="mode-btn" onClick={() => setTreasuryRows((prev) => prev.filter((_, i) => i !== index))}>Remove</button> : null}
                </div>
              ))}
              <button type="button" className="mode-btn" onClick={() => setTreasuryRows((prev) => [...prev, { rewardAddress: "", lovelace: "" }])}>Add Withdrawal</button>
              <FieldWithHelp label="Governance Policy Hash (optional)" help="Only required if withdrawals are policy-constrained.">
                <input type="text" value={treasuryPolicyHash} onChange={(e) => setTreasuryPolicyHash(e.target.value)} />
              </FieldWithHelp>
              <div className="submit-gov-inline">
                <button type="button" className="mode-btn" onClick={autofillGuardrails} disabled={guardrailsLoading}>
                  {guardrailsLoading ? "Loading guardrails..." : "Auto-fill guardrails"}
                </button>
                <button type="button" className="mode-btn" onClick={useInlineGuardrailsFromPolicyHash} disabled={inlineScriptLoading}>
                  {inlineScriptLoading ? "Loading inline script..." : "Use inline from policy hash"}
                </button>
                <HelpTip text="Fetches latest on-chain guardrails hash (from NewConstitutionAction when available) and optional server-configured reference script preset." />
              </div>
            </fieldset>
          ) : null}

          {actionKind === "UpdateCommitteeAction" ? (
            <fieldset className="submit-gov-guided">
              <legend>Committee Update <HelpTip text="Set committee members, removals, and quorum threshold." /></legend>
              <p className="muted">Committee members to include</p>
              {committeeRows.map((row, index) => (
                <div className="submit-gov-inline" key={`member-row-${index}`}>
                  <select value={row.credentialType} onChange={(e) => updateCommitteeRow(index, "credentialType", e.target.value)}>
                    <option value="KeyHash">KeyHash</option>
                    <option value="ScriptHash">ScriptHash</option>
                  </select>
                  <input type="text" value={row.credentialHash} onChange={(e) => updateCommitteeRow(index, "credentialHash", e.target.value)} placeholder="credential hash" />
                  <input type="number" min="0" value={row.termLimit} onChange={(e) => updateCommitteeRow(index, "termLimit", e.target.value)} placeholder="term limit" />
                  {committeeRows.length > 1 ? <button type="button" className="mode-btn" onClick={() => setCommitteeRows((prev) => prev.filter((_, i) => i !== index))}>Remove</button> : null}
                </div>
              ))}
              <button type="button" className="mode-btn" onClick={() => setCommitteeRows((prev) => [...prev, { credentialType: "KeyHash", credentialHash: "", termLimit: "" }])}>Add Member</button>

              <p className="muted">Committee members to remove</p>
              {removeRows.map((row, index) => (
                <div className="submit-gov-inline" key={`remove-row-${index}`}>
                  <select value={row.credentialType} onChange={(e) => updateRemoveRow(index, "credentialType", e.target.value)}>
                    <option value="KeyHash">KeyHash</option>
                    <option value="ScriptHash">ScriptHash</option>
                  </select>
                  <input type="text" value={row.credentialHash} onChange={(e) => updateRemoveRow(index, "credentialHash", e.target.value)} placeholder="credential hash" />
                  {removeRows.length > 1 ? <button type="button" className="mode-btn" onClick={() => setRemoveRows((prev) => prev.filter((_, i) => i !== index))}>Remove</button> : null}
                </div>
              ))}
              <button type="button" className="mode-btn" onClick={() => setRemoveRows((prev) => [...prev, { credentialType: "KeyHash", credentialHash: "" }])}>Add Removal</button>

              <FieldWithHelp label="Quorum Numerator" help="Top number of quorum fraction.">
                <input type="number" min="0" value={quorumNumerator} onChange={(e) => setQuorumNumerator(e.target.value)} />
              </FieldWithHelp>
              <FieldWithHelp label="Quorum Denominator" help="Bottom number. Example: 1/2.">
                <input type="number" min="1" value={quorumDenominator} onChange={(e) => setQuorumDenominator(e.target.value)} />
              </FieldWithHelp>
            </fieldset>
          ) : null}

          {actionKind === "NewConstitutionAction" ? (
            <>
              <FieldWithHelp label="Constitution Anchor URL" help="Use https:// or ipfs://.">
                <input type="url" value={constitutionUrl} onChange={(e) => setConstitutionUrl(e.target.value)} placeholder="https://... or ipfs://..." />
              </FieldWithHelp>
              <FieldWithHelp label="Constitution Anchor Hash" help="blake2b-256 hash of constitution content.">
                <input type="text" value={constitutionHash} onChange={(e) => setConstitutionHash(e.target.value)} placeholder="blake2b-256 hex" />
              </FieldWithHelp>
              <FieldWithHelp label="Constitution Script Hash (optional)" help="Only required when constitution includes script hash.">
                <input type="text" value={constitutionScriptHash} onChange={(e) => setConstitutionScriptHash(e.target.value)} />
              </FieldWithHelp>
            </>
          ) : null}

          {actionKind === "NoConfidenceAction" ? <p className="muted">No additional fields are required for NoConfidenceAction.</p> : null}
          {actionKind === "InfoAction" ? <p className="muted">No additional fields are required for InfoAction.</p> : null}

          <FieldWithHelp label="Anchor URL" help="Proposal metadata URL (description/spec/rationale).">
            <input type="url" value={anchorUrl} onChange={(e) => setAnchorUrl(e.target.value)} placeholder="https://... or ipfs://..." required />
          </FieldWithHelp>

          <FieldWithHelp label="Anchor Hash (blake2b-256 hex)" help="Must match exact content at Anchor URL.">
            <input type="text" value={anchorHash} onChange={(e) => setAnchorHash(e.target.value)} placeholder="64-char hex" required />
          </FieldWithHelp>

          <div className="submit-gov-inline">
            <button type="button" className="mode-btn" onClick={generateAnchorHash}>Fetch URL And Hash</button>
            <HelpTip text="Auto-calculates hash from URL content." />
          </div>

          <FieldWithHelp label="Reward Address" help="Deposit refunds go here when governance rules allow.">
            <input type="text" value={rewardAddress} onChange={(e) => setRewardAddress(e.target.value)} placeholder="stake1..." required />
          </FieldWithHelp>

          <FieldWithHelp label="Deposit (lovelace)" help="Default: 100000000000 (100,000 ADA).">
            <input type="text" value={deposit} onChange={(e) => setDeposit(e.target.value)} required />
          </FieldWithHelp>

          <FieldWithHelp label="Network" help="Civitas governance submissions use mainnet only.">
            <input type="text" value="mainnet" readOnly />
          </FieldWithHelp>

          <fieldset className="submit-gov-script">
            <legend>Optional Script Proposal Settings <HelpTip text="Needed only for script-based proposals." /></legend>
            <FieldWithHelp
              label="Script Mode"
              help="If unsure, choose No script. Inline and Reference are advanced options for script-governed proposals."
            >
              <select value={scriptMode} onChange={(e) => setScriptMode(e.target.value)}>
                <option value="none">No script</option>
                <option value="inline">Inline script</option>
                <option value="reference">Reference script</option>
              </select>
            </FieldWithHelp>
            <p className="submit-gov-script-note">
              {SCRIPT_MODE_HELP[scriptMode]}
            </p>

            {scriptMode !== "none" ? (
              <>
                <FieldWithHelp label="Script Version" help="Plutus version of the proposal script.">
                  <select value={scriptVersion} onChange={(e) => setScriptVersion(e.target.value)}>
                    <option value="V1">V1</option>
                    <option value="V2">V2</option>
                    <option value="V3">V3</option>
                  </select>
                </FieldWithHelp>

                {scriptMode === "inline" ? (
                  <FieldWithHelp label="Script CBOR" help="Hex CBOR of the script.">
                    <textarea value={scriptCbor} onChange={(e) => setScriptCbor(e.target.value)} rows={5} spellCheck={false} className="submit-gov-json" />
                  </FieldWithHelp>
                ) : null}

                {scriptMode === "reference" ? (
                  <>
                    <FieldWithHelp label="Reference Tx Hash" help="Transaction hash containing reference script UTxO.">
                      <input type="text" value={referenceTxHash} onChange={(e) => setReferenceTxHash(e.target.value)} placeholder="transaction hash" />
                    </FieldWithHelp>
                    <FieldWithHelp label="Reference Tx Index" help="Output index of reference script UTxO.">
                      <input type="number" min="0" value={referenceTxIndex} onChange={(e) => setReferenceTxIndex(e.target.value)} />
                    </FieldWithHelp>
                    <FieldWithHelp label="Script Size (bytes)" help="Size in bytes of referenced script.">
                      <input type="text" value={referenceScriptSize} onChange={(e) => setReferenceScriptSize(e.target.value)} />
                    </FieldWithHelp>
                    <FieldWithHelp label="Script Hash" help="Hash of referenced script.">
                      <input type="text" value={referenceScriptHash} onChange={(e) => setReferenceScriptHash(e.target.value)} />
                    </FieldWithHelp>
                  </>
                ) : null}
              </>
            ) : null}
          </fieldset>

          <FieldWithHelp label="Generated Action Payload JSON (read-only)" help="Exact payload sent for selected governance action type.">
            <textarea value={payloadBuild.json} rows={12} readOnly spellCheck={false} className="submit-gov-json submit-gov-preview" />
          </FieldWithHelp>
          <FieldWithHelp
            label="Generated Full Proposal JSON (read-only)"
            help="Full object this form will submit: governance action + anchor + reward address + deposit + network + script settings."
          >
            <textarea
              value={asJson(fullProposalBuild || {})}
              rows={14}
              readOnly
              spellCheck={false}
              className="submit-gov-json submit-gov-preview"
            />
          </FieldWithHelp>

          <fieldset className="submit-gov-guided">
            <legend>Pre-submit Confirmations <HelpTip text="Mandatory checks to confirm you manually verified critical inputs for this action type." /></legend>
            {confirmationItems.map((item) => (
              <label key={item.id} className="submit-gov-checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(checklistState[item.id])}
                  onChange={(e) =>
                    setChecklistState((prev) => ({
                      ...prev,
                      [item.id]: e.target.checked
                    }))
                  }
                />
                <span>{item.label}</span>
              </label>
            ))}
          </fieldset>

          {payloadBuild.error ? <p className="vote-error">{payloadBuild.error}</p> : null}

          <div className="vote-confirm-actions">
            <button
              type="submit"
              className="mode-btn active"
              disabled={submitting || !connected || Boolean(payloadBuild.error) || !allConfirmationsChecked}
            >
              {submitting ? "Submitting..." : "Submit Governance Action"}
            </button>
          </div>
        </form>

        {notice ? <p className="vote-notice">{notice}</p> : null}
        {isGuardrailsAction && guardrailsWarning ? <p className="vote-error">{guardrailsWarning}</p> : null}
        {error ? <p className="vote-error">{error}</p> : null}
        {txHash ? (
          <p className="vote-success">
            Submitted transaction:{" "}
            <a className="ext-link" href={`https://cardanoscan.io/transaction/${txHash}`} target="_blank" rel="noreferrer">
              {txHash}
            </a>
          </p>
        ) : null}
      </section>
    </main>
  );
}
