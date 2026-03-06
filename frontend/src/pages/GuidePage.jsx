import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const tocGroups = [
  {
    title: "Foundations",
    items: [
      { id: "cardano-governance", label: "Cardano Governance" },
      { id: "constitution", label: "The Constitution" },
      { id: "governance-actions", label: "Governance Actions" },
      { id: "dreps", label: "DReps" },
      { id: "spos", label: "Stake Pool Operators" },
      { id: "committee", label: "Constitutional Committee" },
      { id: "ncl", label: "Net Change Limit" },
      { id: "scoring", label: "How Scores Work" }
    ]
  },
  {
    title: "Using Civitas",
    items: [
      { id: "tool-drep-delegation", label: "Delegating to a DRep" },
      { id: "tool-drep-delegation-risk", label: "DRep Delegation Risk" },
      { id: "tool-drep-voting", label: "Voting as a DRep" },
      { id: "tool-drep-registration", label: "DRep Registration" },
      { id: "tool-submit-actions", label: "Submit Actions" },
      { id: "tool-cc-cold-credentials", label: "CC Credentials" }
    ]
  },
  {
    title: "Reference",
    items: [{ id: "history", label: "Snapshot History" }]
  }
];

const ccWizardTracks = {
  individual: [
    {
      title: "Create a workspace for files",
      summary: "Keep CC credential files isolated so copy/paste commands are predictable.",
      commands: [
        {
          label: "Create folder and enter it",
          text: `mkdir cc-credentials
cd cc-credentials`
        }
      ]
    },
    {
      title: "Generate cold keys (offline identity)",
      summary: "Cold keys define the committee member identity. Keep the signing key offline.",
      commands: [
        {
          label: "Generate cold verification/signing keys",
          text: `cardano-cli latest governance committee key-gen-cold \\
  --cold-verification-key-file cc-cold.vkey \\
  --cold-signing-key-file cc-cold.skey`
        }
      ]
    },
    {
      title: "Compute cold key hash",
      summary: "This hash is the on-chain identifier referenced in committee update actions.",
      commands: [
        {
          label: "Derive cold credential hash",
          text: `cardano-cli latest governance committee key-hash \\
  --verification-key-file cc-cold.vkey > cc-key.hash`
        }
      ]
    },
    {
      title: "Generate hot keys (operational signer)",
      summary: "Hot keys are used for day-to-day voting after authorization.",
      commands: [
        {
          label: "Generate hot verification/signing keys",
          text: `cardano-cli latest governance committee key-gen-hot \\
  --verification-key-file cc-hot.vkey \\
  --signing-key-file cc-hot.skey`
        }
      ]
    },
    {
      title: "Create hot-key authorization certificate",
      summary: "Bind the hot key to the cold credential.",
      commands: [
        {
          label: "Create authorization cert",
          text: `cardano-cli latest governance committee create-hot-key-authorization-certificate \\
  --cold-verification-key-file cc-cold.vkey \\
  --hot-verification-key-file cc-hot.vkey \\
  --out-file cc-authorization.cert`
        }
      ]
    },
    {
      title: "Submit certificate transaction",
      summary:
        "Build/sign/submit a transaction carrying cc-authorization.cert. Sign with payment key and cold key.",
      commands: [
        {
          label: "Build transaction body",
          text: `cardano-cli latest transaction build \\
  --tx-in <TX_IN> \\
  --change-address <PAYMENT_ADDR> \\
  --certificate-file cc-authorization.cert \\
  --out-file tx.raw`
        },
        {
          label: "Sign transaction (payment + cold)",
          text: `cardano-cli latest transaction sign \\
  --tx-body-file tx.raw \\
  --signing-key-file payment.skey \\
  --signing-key-file cc-cold.skey \\
  --out-file tx.signed`
        },
        {
          label: "Submit transaction",
          text: "cardano-cli latest transaction submit --tx-file tx.signed"
        }
      ]
    }
  ],
  multisig: [
    {
      title: "Generate each member cold key pair",
      summary: "Each multisig member creates a cold key pair and shares only verification material.",
      commands: [
        {
          label: "Run per member (example member1)",
          text: `cardano-cli latest governance committee key-gen-cold \\
  --cold-verification-key-file member1-cold.vkey \\
  --cold-signing-key-file member1-cold.skey`
        },
        {
          label: "Hash each member cold key",
          text: `cardano-cli latest governance committee key-hash \\
  --verification-key-file member1-cold.vkey > member1-cold.hash`
        }
      ]
    },
    {
      title: "Create cold multisig script",
      summary: "Build a simple script (for example, 2-of-3) from member cold key hashes.",
      commands: [
        {
          label: "cold.script template (2-of-3)",
          text: `{
  "type": "atLeast",
  "required": 2,
  "scripts": [
    { "type": "sig", "keyHash": "<member1_cold_key_hash>" },
    { "type": "sig", "keyHash": "<member2_cold_key_hash>" },
    { "type": "sig", "keyHash": "<member3_cold_key_hash>" }
  ]
}`
        },
        {
          label: "Hash cold script",
          text: "cardano-cli hash script --script-file cold.script"
        }
      ]
    },
    {
      title: "Generate and hash hot keys for members",
      summary: "Create hot keys for operational voting control and hash each hot key.",
      commands: [
        {
          label: "Run per member (example member1)",
          text: `cardano-cli latest governance committee key-gen-hot \\
  --verification-key-file member1-hot.vkey \\
  --signing-key-file member1-hot.skey`
        },
        {
          label: "Hash each member hot key",
          text: `cardano-cli latest governance committee key-hash \\
  --verification-key-file member1-hot.vkey > member1-hot.hash`
        }
      ]
    },
    {
      title: "Create hot multisig script",
      summary: "Use the same threshold model (or another policy) for the hot side.",
      commands: [
        {
          label: "hot.script template (2-of-3)",
          text: `{
  "type": "atLeast",
  "required": 2,
  "scripts": [
    { "type": "sig", "keyHash": "<member1_hot_key_hash>" },
    { "type": "sig", "keyHash": "<member2_hot_key_hash>" },
    { "type": "sig", "keyHash": "<member3_hot_key_hash>" }
  ]
}`
        },
        {
          label: "Hash hot script",
          text: "cardano-cli hash script --script-file hot.script"
        }
      ]
    },
    {
      title: "Create hot-key authorization certificate",
      summary: "Authorize the hot script using the cold script hash.",
      commands: [
        {
          label: "Create authorization cert from script hashes",
          text: `cardano-cli latest governance committee create-hot-key-authorization-certificate \\
  --cold-script-hash <cold_script_hash> \\
  --hot-script-hash <hot_script_hash> \\
  --out-file cc-authorization.cert`
        }
      ]
    },
    {
      title: "Submit certificate transaction",
      summary:
        "Include cold.script in the cert witness path and collect enough cold signatures to satisfy threshold.",
      commands: [
        {
          label: "Build transaction body",
          text: `cardano-cli latest transaction build \\
  --tx-in <TX_IN> \\
  --change-address <PAYMENT_ADDR> \\
  --certificate-file cc-authorization.cert \\
  --certificate-script-file cold.script \\
  --out-file tx.raw`
        },
        {
          label: "Sign with payment key and enough cold signers",
          text: `cardano-cli latest transaction sign \\
  --tx-body-file tx.raw \\
  --signing-key-file payment.skey \\
  --signing-key-file member1-cold.skey \\
  --signing-key-file member2-cold.skey \\
  --out-file tx.signed`
        },
        {
          label: "Submit transaction",
          text: "cardano-cli latest transaction submit --tx-file tx.signed"
        }
      ]
    }
  ]
};

function parseMemberList(raw) {
  return String(raw || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function memberFileBase(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "member";
}

function memberHashPlaceholder(name, scope) {
  const prefix = scope === "cold" ? "COLD" : "HOT";
  return `PASTE_${memberFileBase(name).toUpperCase()}_${prefix}_HASH`;
}

function clampThreshold(value, total) {
  const parsed = Number(value || 1);
  const min = 1;
  const max = Math.max(1, total);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function buildMultisigSteps(config) {
  const coldMembers = parseMemberList(config.coldMembers);
  const hotMembers = parseMemberList(config.hotMembers);
  const safeColdMembers = coldMembers.length ? coldMembers : ["Alice", "Bob", "Carol"];
  const safeHotMembers = hotMembers.length ? hotMembers : ["Alice", "Bob", "Carol"];
  const coldThreshold = clampThreshold(config.coldThreshold, safeColdMembers.length);
  const hotThreshold = clampThreshold(config.hotThreshold, safeHotMembers.length);
  const coldScriptHash = String(config.coldScriptHash || "PASTE_COLD_SCRIPT_HASH").trim();
  const hotScriptHash = String(config.hotScriptHash || "PASTE_HOT_SCRIPT_HASH").trim();
  const coldScript = {
    type: "atLeast",
    required: coldThreshold,
    scripts: safeColdMembers.map((name) => ({ type: "sig", keyHash: memberHashPlaceholder(name, "cold") }))
  };
  const hotScript = {
    type: "atLeast",
    required: hotThreshold,
    scripts: safeHotMembers.map((name) => ({ type: "sig", keyHash: memberHashPlaceholder(name, "hot") }))
  };
  const coldWitnessBlocks = safeColdMembers.map((name) => {
    const base = memberFileBase(name);
    return {
      label: `${name} cold witness`,
      text: `cardano-cli latest transaction witness \\
  --tx-body-file tx.body \\
  --signing-key-file ${base}-cold.skey \\
  --out-file ${base}.witness`
    };
  });
  const witnessList = safeColdMembers.map((name) => `--witness-file ${memberFileBase(name)}.witness`).join(" \\\n  ");

  return [
    {
      title: "Configure members and thresholds",
      summary: "Set guardians/operators once. The next steps auto-generate copy-ready commands from these values.",
      commands: []
    },
    {
      title: "Generate cold keys for guardians",
      summary: `Cold side is ${coldThreshold}-of-${safeColdMembers.length}. Run these on each guardian cold machine.`,
      commands: safeColdMembers.flatMap((name) => {
        const base = memberFileBase(name);
        return [
          {
            label: `${name} cold key generation`,
            text: `cardano-cli latest governance committee key-gen-cold \\
  --cold-verification-key-file ${base}-cold.vkey \\
  --cold-signing-key-file ${base}-cold.skey`
          },
          {
            label: `${name} cold key hash`,
            text: `cardano-cli latest governance committee key-hash \\
  --verification-key-file ${base}-cold.vkey > ${base}-cold.hash`
          }
        ];
      })
    },
    {
      title: "Build cold multisig identity",
      summary: "Create cold.script and hash it. Paste the resulting script hash for the authorization step.",
      commands: [
        {
          label: "cold.script",
          text: JSON.stringify(coldScript, null, 2)
        },
        {
          label: "Hash cold script",
          text: "cardano-cli hash script --script-file cold.script"
        }
      ]
    },
    {
      title: "Generate hot keys for operators",
      summary: `Hot side is ${hotThreshold}-of-${safeHotMembers.length}. Run these on operator hot machines.`,
      commands: safeHotMembers.flatMap((name) => {
        const base = memberFileBase(name);
        return [
          {
            label: `${name} hot key generation`,
            text: `cardano-cli latest governance committee key-gen-hot \\
  --verification-key-file ${base}-hot.vkey \\
  --signing-key-file ${base}-hot.skey`
          },
          {
            label: `${name} hot key hash`,
            text: `cardano-cli latest governance committee key-hash \\
  --verification-key-file ${base}-hot.vkey > ${base}-hot.hash`
          }
        ];
      })
    },
    {
      title: "Build hot voting script",
      summary: "Create hot.script and hash it. Paste the resulting hash for the authorization step.",
      commands: [
        {
          label: "hot.script",
          text: JSON.stringify(hotScript, null, 2)
        },
        {
          label: "Hash hot script",
          text: "cardano-cli hash script --script-file hot.script"
        }
      ]
    },
    {
      title: "Create authorization certificate",
      summary: "Use your actual cold/hot script hashes to create the bridge certificate.",
      commands: [
        {
          label: "cc-authorization.cert",
          text: `cardano-cli latest governance committee create-hot-key-authorization-certificate \\
  --cold-script-hash ${coldScriptHash} \\
  --hot-script-hash ${hotScriptHash} \\
  --out-file cc-authorization.cert`
        }
      ]
    },
    {
      title: "Collect guardian witnesses and submit",
      summary: "Build on hot machine, collect cold witnesses, assemble, then submit.",
      commands: [
        {
          label: "Build tx body (hot machine)",
          text: `cardano-cli latest transaction build \\
  --tx-in "<TX_ID>#<INDEX>" \\
  --change-address "<PAYMENT_ADDR>" \\
  --certificate-file cc-authorization.cert \\
  --certificate-script-file cold.script \\
  --witness-override ${safeColdMembers.length + 1} \\
  --out-file tx.body`
        },
        ...coldWitnessBlocks,
        {
          label: "Assemble and submit (hot machine)",
          text: `cardano-cli latest transaction assemble \\
  --tx-body-file tx.body \\
  --witness-file payment.witness \\
  ${witnessList} \\
  --out-file tx.signed

cardano-cli latest transaction submit --tx-file tx.signed`
        }
      ]
    }
  ];
}

const ccPlutusSteps = [
  {
    title: "Set up Credential Manager environment",
    summary: "Plutus credential flow is managed via Credential Manager tools (`orchestrator-cli`, `cc-sign`, `tx-bundle`).",
    commands: [
      {
        label: "Clone and enter shell (example)",
        text: `mkdir -p ~/repos
cd ~/repos
git clone git@github.com:IntersectMBO/credential-manager.git
cd credential-manager
nix develop`
      },
      {
        label: "Optional local testnet bootstrap",
        text: `deploy-local-testnet
# Open a new shell, return to repo, then:
nix develop
setup-orchestrator`
      }
    ]
  },
  {
    title: "Initialize cold credential scripts",
    summary: "Generate cold Plutus assets and script hashes from CA + membership + delegation certs.",
    commands: [
      {
        label: "Build cold assets (testnet example)",
        text: `orchestrator-cli init-cold \\
  --seed-input "$(get-orchestrator-ada-only | jq -r '.key')" \\
  --testnet \\
  --ca-cert example-certificates/ca-cert.pem \\
  --membership-cert example-certificates/child-1.cert \\
  --membership-cert example-certificates/child-2.cert \\
  --membership-cert example-certificates/child-3.cert \\
  --delegation-cert example-certificates/child-4.cert \\
  --delegation-cert example-certificates/child-5.cert \\
  --delegation-cert example-certificates/child-6.cert \\
  -o init-cold`
      },
      {
        label: "Inspect cold outputs",
        text: "ls init-cold -1"
      }
    ]
  },
  {
    title: "Initialize hot credential scripts",
    summary: "Generate hot Plutus assets tied to the cold NFT policy + token name.",
    commands: [
      {
        label: "Build hot assets (testnet example)",
        text: `orchestrator-cli init-hot \\
  --seed-input "$(get-orchestrator-ada-only | jq -r '.key')" \\
  --testnet \\
  --cold-nft-policy-id "$(cat init-cold/minting.plutus.hash)" \\
  --cold-nft-token-name "$(cat init-cold/nft-token-name)" \\
  --voting-cert example-certificates/child-7.cert \\
  --voting-cert example-certificates/child-8.cert \\
  --voting-cert example-certificates/child-9.cert \\
  -o init-hot`
      },
      {
        label: "Inspect hot outputs",
        text: "ls init-hot -1"
      }
    ]
  },
  {
    title: "Create authorization assets",
    summary: "Prepare certificate + datum + redeemer by spending the cold NFT state UTxO.",
    commands: [
      {
        label: "Fetch cold NFT UTxO",
        text: `cardano-cli conway query utxo --address $(cat init-cold/nft.addr) --output-json > cold-nft.utxo
# or helper:
fetch-cold-nft-utxo`
      },
      {
        label: "Generate authorization files",
        text: `orchestrator-cli authorize \\
  -u cold-nft.utxo \\
  --cold-credential-script-file init-cold/credential.plutus \\
  --hot-credential-script-file init-hot/credential.plutus \\
  --out-dir authorize`
      },
      {
        label: "Inspect generated files",
        text: "ls authorize -1"
      }
    ]
  },
  {
    title: "Build authorization transaction bundle",
    summary: "Build a tx bundle so any valid delegation signer subset can co-sign.",
    commands: [
      {
        label: "Build tx bundle",
        text: `tx-bundle build \\
  --tx-in "$(get-orchestrator-ada-only | jq -r '.key')" \\
  --tx-in-collateral "$(get-orchestrator-ada-only | jq -r '.key')" \\
  --tx-in $(cardano-cli query utxo --address $(cat init-cold/nft.addr) --output-json | jq -r 'keys[0]') \\
  --tx-in-script-file init-cold/nft.plutus \\
  --tx-in-inline-datum-present \\
  --tx-in-redeemer-file authorize/redeemer.json \\
  --tx-out "$(cat authorize/value)" \\
  --tx-out-inline-datum-file authorize/datum.json \\
  --required-signer-group-name delegation \\
  --required-signer-group-threshold 2 \\
  --required-signer-hash $(orchestrator-cli extract-pub-key-hash example-certificates/child-4.cert) \\
  --required-signer-hash $(orchestrator-cli extract-pub-key-hash example-certificates/child-5.cert) \\
  --required-signer-hash $(orchestrator-cli extract-pub-key-hash example-certificates/child-6.cert) \\
  --certificate-file authorize/authorizeHot.cert \\
  --certificate-script-file init-cold/credential.plutus \\
  --certificate-redeemer-value {} \\
  --change-address $(cat orchestrator.addr) \\
  --out-file authorize/body.txbundle`
      }
    ]
  },
  {
    title: "Sign, assemble, submit, verify",
    summary: "Collect delegation witnesses, add orchestrator witness, submit, then verify committee state.",
    commands: [
      {
        label: "Delegation witnesses (example child-4/child-5)",
        text: `cc-sign \\
  --tx-bundle-file authorize/body.txbundle \\
  --private-key-file example-certificates/children/child-4/child-4.private \\
  --out-file authorize/child-4.witbundle

cc-sign -q \\
  --tx-bundle-file authorize/body.txbundle \\
  --private-key-file example-certificates/children/child-5/child-5.private \\
  --out-file authorize/child-5.witbundle`
      },
      {
        label: "Orchestrator witness + assemble + submit",
        text: `tx-bundle witness --all \\
  --tx-bundle-file authorize/body.txbundle \\
  --signing-key-file orchestrator.skey \\
  --out-file authorize/orchestrator.witbundle

tx-bundle assemble \\
  --tx-bundle-file authorize/body.txbundle \\
  --witness-bundle-file authorize/child-4.witbundle \\
  --witness-bundle-file authorize/child-5.witbundle \\
  --witness-bundle-file authorize/orchestrator.witbundle \\
  --out-file authorize/tx.json

cardano-cli conway transaction submit --tx-file authorize/tx.json`
      },
      {
        label: "Verify authorization on-chain",
        text: `cardano-cli conway query committee-state \\
  --cold-script-hash $(cat init-cold/credential.plutus.hash)`
      }
    ]
  }
];

export default function GuidePage() {
  const [history, setHistory] = useState([]);
  const [showAllSnapshots, setShowAllSnapshots] = useState(false);
  const [activeSection, setActiveSection] = useState("cardano-governance");
  const [ccWizardTrack, setCcWizardTrack] = useState("individual");
  const [ccWizardStep, setCcWizardStep] = useState(0);
  const [ccCopyNotice, setCcCopyNotice] = useState("");
  const [ccColdMembers, setCcColdMembers] = useState("Alice, Bob, Carol");
  const [ccColdThreshold, setCcColdThreshold] = useState("2");
  const [ccHotMembers, setCcHotMembers] = useState("Alice, Bob, Carol");
  const [ccHotThreshold, setCcHotThreshold] = useState("2");
  const [ccColdScriptHash, setCcColdScriptHash] = useState("");
  const [ccHotScriptHash, setCcHotScriptHash] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/snapshot-history")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setHistory(Array.isArray(data?.history) ? data.history : []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const visibleHistory = showAllSnapshots ? history : history.slice(0, 5);
  const ccSteps = useMemo(() => {
    if (ccWizardTrack === "individual") return ccWizardTracks.individual || [];
    if (ccWizardTrack === "plutus") return ccPlutusSteps;
    return buildMultisigSteps({
      coldMembers: ccColdMembers,
      coldThreshold: ccColdThreshold,
      hotMembers: ccHotMembers,
      hotThreshold: ccHotThreshold,
      coldScriptHash: ccColdScriptHash,
      hotScriptHash: ccHotScriptHash
    });
  }, [ccWizardTrack, ccColdMembers, ccColdThreshold, ccHotMembers, ccHotThreshold, ccColdScriptHash, ccHotScriptHash]);
  const ccCurrentStep = ccSteps[ccWizardStep] || null;

  useEffect(() => {
    if (ccWizardStep < ccSteps.length) return;
    setCcWizardStep(Math.max(0, ccSteps.length - 1));
  }, [ccWizardStep, ccSteps.length]);

  async function copyCcText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      setCcCopyNotice(`Copied: ${label}`);
      window.setTimeout(() => setCcCopyNotice(""), 2000);
    } catch {
      setCcCopyNotice("Copy failed. Clipboard permission may be blocked.");
      window.setTimeout(() => setCcCopyNotice(""), 2500);
    }
  }

  function renderSection() {
    switch (activeSection) {

      case "cardano-governance":
        return (
          <section className="wiki-section panel">
            <h2>How Cardano Governance Works</h2>
            <p>
              Cardano's governance model — introduced by the Conway era in 2024 — is one of the most
              sophisticated on-chain governance systems in the blockchain industry. Instead of a small
              team or foundation making all decisions, three independent bodies must agree before any
              change to the protocol takes effect.
            </p>

            <h3 className="guide-subhead">The Foundation: A Written Constitution</h3>
            <p>
              Underpinning the entire system is the <strong>Cardano Constitution</strong> — a ratified,
              on-chain document that defines the rules all governance participants must operate within.
              It sets the boundaries for what can be proposed, what the Constitutional Committee must
              enforce, and what the community agreed to when Conway-era governance was activated. Without
              the constitution, there would be no shared reference point for what is and is not legitimate.
            </p>

            <h3 className="guide-subhead">The Three Pillars</h3>
            <div className="guide-three-col">
              <div className="guide-card">
                <p className="guide-card-title">DReps</p>
                <p>Delegated Representatives. Ada holders delegate their voting power to a DRep they trust.
                DReps vote on most governance actions on behalf of their delegators.</p>
              </div>
              <div className="guide-card">
                <p className="guide-card-title">SPOs</p>
                <p>Stake Pool Operators. The people who run the nodes that secure Cardano's blockchain.
                SPOs have voting rights on a specific subset of governance actions that affect the protocol directly.</p>
              </div>
              <div className="guide-card">
                <p className="guide-card-title">Constitutional Committee</p>
                <p>A small group of elected members who act as constitutional guardians. They can veto
                any governance action they deem unconstitutional, regardless of how DReps and SPOs vote.</p>
              </div>
            </div>

            <h3 className="guide-subhead">Why Three Bodies?</h3>
            <p>
              The three-body design prevents any single group from having unchecked control. DReps represent
              the broader Ada-holding community. SPOs represent the infrastructure operators who run the
              network. The Constitutional Committee protects the foundational rules that all three bodies
              agreed to when Cardano's constitution was ratified.
            </p>
            <p>
              A governance action typically needs supermajority support from both DReps and SPOs (where
              applicable), <em>and</em> must not be vetoed by the Constitutional Committee. All three
              checks must pass for a proposal to be enacted.
            </p>

            <h3 className="guide-subhead">The Role of Ada Holders</h3>
            <p>
              If you hold Ada, you are part of Cardano governance — even if indirectly. You delegate your
              voting power to a DRep. If you do not actively choose one, your stake is effectively silent.
              Choosing a DRep who votes and explains their reasoning is the single most impactful governance
              decision most Ada holders will make.
            </p>
            <p>
              Civitas exists to make it easy to evaluate those choices. Who is actually showing up? Who votes
              with rationale? Who responds quickly? The data is all on-chain — we just make it readable.
            </p>
          </section>
        );

      case "constitution":
        return (
          <section className="wiki-section panel">
            <h2>The Cardano Constitution</h2>
            <p>
              The Cardano Constitution is the foundational legal and governance document of the Cardano
              blockchain. It was ratified by the community in late 2024 through a global series of
              constitutional conventions and an on-chain vote, making it one of the most broadly
              legitimised governance documents in the blockchain industry.
            </p>

            <h3 className="guide-subhead">What It Does</h3>
            <p>
              The constitution defines the rights and responsibilities of all Cardano participants,
              the rules by which governance actions must be evaluated, and the guardrails that protect
              the protocol from harmful changes. It is not just a philosophical statement — it contains
              concrete, enforceable rules. Protocol parameters must stay within constitution-defined
              ranges. Treasury withdrawals must comply with the Net Change Limit. The Constitutional
              Committee exists specifically to enforce these rules on every governance action.
            </p>
            <p>
              Critically, the constitution is itself subject to governance. It can be amended through
              a Constitutional Amendment action, which requires DRep supermajority approval and CC
              ratification. This means the community can evolve its own rules — but only through the
              same deliberate, checked process that governs everything else.
            </p>

            <h3 className="guide-subhead">On-Chain Anchoring</h3>
            <p>
              The constitution is anchored on-chain via a content hash. The hash stored on the Cardano
              ledger points to the canonical document, making it verifiable that the text has not been
              altered since ratification. When the CC reviews a governance action for constitutionality,
              they are evaluating it against this anchored text — not an informal understanding or
              social consensus.
            </p>

            <h3 className="guide-subhead">The Interim Constitution</h3>
            <p>
              Before the full constitution was ratified, Cardano operated under an interim constitution
              — a temporary document that allowed Conway-era governance to begin while the community
              worked through the convention process. The interim constitution was replaced by the
              ratified constitution once the on-chain vote concluded. Historical governance actions
              submitted under the interim constitution were reviewed against its rules at the time.
            </p>

            <h3 className="guide-subhead">Why It Matters for This Tool</h3>
            <p>
              Every metric on Civitas is ultimately a measure of how well governance participants are
              fulfilling their constitutional roles. A DRep who never votes is failing their delegators
              as defined by the governance model the constitution establishes. A CC member who votes
              without explanation is making constitutional judgements that the community cannot audit.
              The constitution is the standard — Civitas measures performance against it.
            </p>
          </section>
        );

      case "dreps":
        return (
          <section className="wiki-section panel">
            <h2>Delegated Representatives (DReps)</h2>
            <p>
              DReps are the primary voting actors in Cardano governance. Any Ada holder can register as a
              DRep. When you delegate to a DRep, your Ada's proportional weight is added to their voting
              power. DReps vote on the vast majority of governance actions, including treasury withdrawals,
              protocol parameter changes, and hard forks.
            </p>

            <h3 className="guide-subhead">How DRep Voting Power Works</h3>
            <p>
              Voting power is denominated in lovelace (1 ada = 1,000,000 lovelace). A DRep's power equals
              the total active stake delegated to them. Power is not fixed — it changes every epoch as
              delegators join or leave. A DRep with 2% of total active voting power effectively controls
              2% of the DRep vote on any proposal they vote on.
            </p>
            <p>
              Two special "DReps" exist by default: <strong>Always Abstain</strong> and{" "}
              <strong>Always No Confidence</strong>. Delegating to Always Abstain keeps your stake counted
              for quorum but never casts a directional vote. Always No Confidence is a permanent no-confidence
              signal. Both are excluded from active voting power calculations on this dashboard.
            </p>

            <h3 className="guide-subhead">What to Look For</h3>
            <p>
              A high attendance score means the DRep is actually voting — not just registered and collecting
              delegation rewards while being absent. Transparency tells you whether they are explaining their
              votes with a rationale. A DRep who votes but never explains why is harder to hold accountable
              than one who publishes clear reasoning on every vote.
            </p>
            <p>
              Alignment shows whether a DRep's yes/no votes tend to match final outcomes. A very high
              alignment score can mean the DRep is thoughtful and reads proposals well — or it can mean
              they are a late voter who waits to see which way the wind is blowing. Use it together with
              the responsiveness column to distinguish the two.
            </p>

            <h3 className="guide-subhead">Term and Eligibility</h3>
            <p>
              DReps become eligible from the epoch they first register. Actions submitted before a DRep
              registered are excluded from their attendance calculation — it would be unfair to count them
              as absent for proposals they had no standing to vote on. This makes the attendance figure
              an honest measure of participation since joining governance.
            </p>

          </section>
        );

      case "tool-drep-registration":
        return (
          <section className="wiki-section panel">
            <h2>Use Civitas: Register As a DRep</h2>
            <p>
              Civitas lets you register the connected wallet as a DRep directly from the DRep dashboard using
              wallet-connect signing. This is for wallets that are not already registered as a DRep.
            </p>

            <h3 className="guide-subhead">Where to Find It</h3>
            <p>
              Open the <Link className="inline-link" to="/dreps">DRep dashboard</Link>. In the DRep Registration
              panel, click <strong>Register as a DRep</strong> to reveal the registration form.
            </p>

            <h3 className="guide-subhead">What the Form Uses</h3>
            <p>
              The DRep ID is auto-derived from your connected wallet reward address. You can still enter a manual
              DRep ID as an override, but this is optional. Deposit defaults to <strong>500 ada</strong> (
              <code>500000000</code> lovelace), which is the protocol deposit for DRep registration.
            </p>
            <p>
              Anchor URL and anchor hash are optional metadata fields. If you provide one, you must provide both.
            </p>

            <h3 className="guide-subhead">Step-by-Step</h3>
            <ol>
              <li>Connect your wallet from the top bar.</li>
              <li>Go to <Link className="inline-link" to="/dreps">DReps</Link>.</li>
              <li>Click <strong>Register as a DRep</strong>.</li>
              <li>Leave DRep ID empty for auto-derive, or enter a manual ID.</li>
              <li>Confirm deposit and optional anchor fields.</li>
              <li>Click <strong>Register Connected Wallet As DRep</strong>.</li>
              <li>Sign in your wallet when prompted, then submit.</li>
            </ol>

            <h3 className="guide-subhead">After Submission</h3>
            <p>
              Civitas shows the transaction hash once submitted. Registration status on explorer/indexer views may
              take some time to reflect depending on chain confirmation and indexer sync delay.
            </p>
          </section>
        );

      case "tool-drep-delegation":
        return (
          <section className="wiki-section panel">
            <h2>Use Civitas: Delegating to a DRep</h2>
            <p>
              This flow delegates your stake voting power to a selected DRep directly from the DRep pages with wallet-connect.
            </p>

            <h3 className="guide-subhead">Prerequisites</h3>
            <ol>
              <li>Connect a wallet in the top bar.</li>
              <li>Wallet must expose a reward/stake address.</li>
              <li>Use the tool on the network you intend to delegate on.</li>
            </ol>

            <h3 className="guide-subhead">Step-by-Step</h3>
            <ol>
              <li>Open <Link className="inline-link" to="/dreps">DReps</Link>.</li>
              <li>Select a DRep from the table to open details.</li>
              <li>Review attendance, transparency, alignment, responsiveness, and vote history.</li>
              <li>Click the delegation action in the selected DRep panel.</li>
              <li>Approve/sign in your wallet extension.</li>
              <li>Submit and save the transaction hash shown by Civitas.</li>
            </ol>

            <h3 className="guide-subhead">Choosing a Delegation Target</h3>
            <p>
              Delegating to a normal DRep gives that DRep your voting power. Delegating to <strong>Always Abstain</strong> keeps
              your stake participating without directional votes. Delegating to <strong>Always No Confidence</strong> is a persistent
              no-confidence posture.
            </p>

            <h3 className="guide-subhead">After Delegation</h3>
            <p>
              On-chain confirmation is immediate after inclusion, but indexers and dashboards may lag briefly before reflecting the new status.
            </p>
          </section>
        );

      case "tool-drep-delegation-risk":
        return (
          <section className="wiki-section panel">
            <h2>Use Civitas: DRep Delegation Risk</h2>
            <p>
              Civitas includes a <strong>Delegation Risk</strong> indicator to highlight delegation concentration.
              The purpose is decentralization awareness, not a judgment of any individual DRep.
            </p>

            <h3 className="guide-subhead">What It Represents</h3>
            <p>
              The indicator reflects how large a DRep&apos;s share is within <strong>active delegated voting power</strong>.
              A larger share means one actor has greater influence over governance outcomes if they vote consistently.
            </p>
            <p>
              Risk levels are shown as:
            </p>
            <ol>
              <li><strong>Low</strong>: lower concentration footprint.</li>
              <li><strong>Medium</strong>: meaningful concentration that should be monitored.</li>
              <li><strong>High</strong>: strong concentration signal where decentralization tradeoffs are more significant.</li>
            </ol>

            <h3 className="guide-subhead">How To Use It</h3>
            <ol>
              <li>Open <Link className="inline-link" to="/dreps">DReps</Link>.</li>
              <li>Sort by <strong>Delegation Risk</strong> if you want to prioritize decentralization review.</li>
              <li>Open a DRep profile and compare risk with attendance, rationale behavior, and responsiveness.</li>
              <li>Choose the delegation target that best matches your decentralization and governance priorities.</li>
            </ol>

            <h3 className="guide-subhead">Delegation Warning Modal</h3>
            <p>
              If you attempt to delegate to a DRep marked <strong>High</strong>, Civitas shows an in-app warning modal
              before submission. The modal:
            </p>
            <ol>
              <li>shows the DRep&apos;s current active-share context,</li>
              <li>kindly asks you to consider a lower-concentration option, and</li>
              <li>lets you either cancel or continue intentionally.</li>
            </ol>

            <h3 className="guide-subhead">Important Context</h3>
            <p>
              Delegation Risk is an awareness signal, not financial advice and not a reputation score. It should be used
              together with qualitative factors such as voting rationale quality, policy alignment, and response behavior.
            </p>
          </section>
        );

      case "tool-drep-voting":
        return (
          <section className="wiki-section panel">
            <h2>Use Civitas: Voting as a DRep</h2>
            <p>
              Civitas lets an already registered DRep cast governance votes from the Actions page using connected wallet signing.
            </p>

            <h3 className="guide-subhead">Prerequisites</h3>
            <ol>
              <li>Connect a wallet that exposes DRep identity in CIP-105 format.</li>
              <li>Have enough ada for transaction fees (and collateral if script conditions apply).</li>
              <li>Pick an active governance action and clear vote choice (Yes, No, Abstain).</li>
            </ol>

            <h3 className="guide-subhead">Step-by-Step</h3>
            <ol>
              <li>Open <Link className="inline-link" to="/actions">Governance Actions</Link>.</li>
              <li>Open the proposal you want to vote on.</li>
              <li>Select your vote choice as DRep.</li>
              <li>Optionally include rationale metadata/anchor if your workflow supports it.</li>
              <li>Build vote transaction and review any validation warnings.</li>
              <li>Sign in your wallet, then submit.</li>
              <li>Record tx hash and verify the vote appears after sync.</li>
            </ol>

            <h3 className="guide-subhead">Common Issues</h3>
            <ol>
              <li>No DRep identity in wallet: connect a wallet that exposes `dRepIDCip105`.</li>
              <li>Fee too low: rebuild the transaction and re-sign.</li>
              <li>Script/collateral errors: ensure required script witnesses and collateral are included before final sign.</li>
            </ol>
          </section>
        );

      case "spos":
        return (
          <section className="wiki-section panel">
            <h2>Stake Pool Operators (SPOs)</h2>
            <p>
              Stake pool operators run the nodes that produce blocks and secure the Cardano network. In
              governance, SPOs have a focused but important role: they vote on a specific subset of
              governance actions where their infrastructure expertise is most relevant.
            </p>

            <h3 className="guide-subhead">What SPOs Vote On</h3>
            <p>
              SPOs vote on <strong>hard fork initiations</strong>, <strong>protocol parameter changes</strong>,{" "}
              <strong>motions of no confidence</strong>, and <strong>updates to the Constitutional Committee</strong>.
              They do not vote on treasury withdrawals or constitutional amendments — those are reserved for
              DReps and the Constitutional Committee. This design gives SPOs a meaningful check on changes
              that directly affect the network's operation and governance structure, without giving them
              authority over how treasury funds are spent.
            </p>

            <h3 className="guide-subhead">SPO Voting Power</h3>
            <p>
              SPO voting power is derived from the total active stake in their pool — not the stake the
              operator personally holds, but all stake delegated to that pool by the community. This ties
              governance influence directly to the trust the community places in each pool operator.
            </p>
            <p>
              A large pool with low governance participation is a meaningful signal: the operator's
              stake-weighted voice is being left unused. The SPO dashboard surface this directly through
              attendance and the active voting power summary at the top of the page.
            </p>

            <h3 className="guide-subhead">Rationale and Accountability</h3>
            <p>
              SPOs are not required to publish rationale for their votes — but the best operators do.
              Transparency scores on the SPO page reflect whether pools are attaching vote metadata or
              rationale anchors. An SPO who consistently votes with clear reasoning is a more accountable
              network participant than one who votes silently.
            </p>

          </section>
        );

      case "committee":
        return (
          <section className="wiki-section panel">
            <h2>Constitutional Committee</h2>
            <p>
              The Constitutional Committee (CC) is Cardano's constitutional safeguard. Members are elected
              through an off-chain election and then their credentials are ratified via a governance action.
              They serve fixed terms. Their role is not to represent the majority —
              it is to protect the constitution from being violated, even by a popular majority.
            </p>

            <h3 className="guide-subhead">How the CC Votes</h3>
            <p>
              CC members vote <strong>Constitutional</strong>, <strong>Unconstitutional</strong>, or{" "}
              <strong>Abstain</strong> on every governance action. If a threshold of CC members rule an
              action unconstitutional, it is blocked — regardless of DRep or SPO votes. This makes the CC
              a hard constitutional brake on the system.
            </p>
            <p>
              CC members do not vote "Yes" or "No" on policy — they vote on constitutionality. A CC member
              who thinks a treasury withdrawal is bad governance policy but constitutional should still vote
              Constitutional. Conflating these roles is one of the most common misunderstandings about the
              CC's function.
            </p>

            <h3 className="guide-subhead">Threshold and Confidence</h3>
            <p>
              The CC has a quorum threshold. If the committee falls below the minimum active members — whether
              through resignations, expired terms, or no-confidence votes — the entire governance system
              enters a protected state where most governance actions cannot be ratified. This incentivises the
              community to maintain an active, healthy CC at all times.
            </p>

            <h3 className="guide-subhead">What Civitas Measures for CC</h3>
            <p>
              CC scoring focuses on three things: <strong>Attendance</strong> (did they vote on every eligible
              action?), <strong>Rationale Quality</strong> (when they declared an action constitutional or
              unconstitutional, did they publish a reachable, structured, constitution-grounded rationale?),
              and <strong>Responsiveness</strong> (how quickly did they vote after a proposal was submitted?).
            </p>
            <p>
              Alignment (outcome matching) is excluded: a CC member's job is constitutional review, not
              predicting majority outcomes.
            </p>

            <h3 className="guide-subhead">Terms and Eligibility</h3>
            <p>
              Each CC member has a seat start epoch and an expiration epoch. Civitas uses these term boundaries
              to calculate eligibility accurately — a member cannot be marked absent for proposals that fell
              outside their active term. Members with expired terms are shown with a distinct status indicator.
            </p>

          </section>
        );

      case "tool-submit-actions":
        return (
          <section className="wiki-section panel">
            <h2>Use Civitas: Submit Governance Actions</h2>
            <p>
              This section is a practical walkthrough for submitting governance actions from Civitas, even if
              you are new to Cardano governance.
            </p>

            <h3 className="guide-subhead">Before You Start</h3>
            <p>
              Open <Link className="inline-link" to="/actions/submit">Submit Governance Action</Link> and connect
              your wallet in the top bar. You need enough ada for:
            </p>
            <ol>
              <li>the governance action deposit (typically 100,000 ada),</li>
              <li>transaction fees, and</li>
              <li>collateral for script execution when using script proposals.</li>
            </ol>
            <p>
              Prepare an anchor URL and anchor data hash. The anchor is the public reference to the proposal
              document voters will read.
            </p>

            <h3 className="guide-subhead">What You Fill In Every Time</h3>
            <ol>
              <li>Select the governance action type.</li>
              <li>Set your reward account and deposit amount.</li>
              <li>Enter anchor URL and anchor data hash.</li>
              <li>Fill action-specific fields (depends on type).</li>
              <li>If submitting as script proposal, add script/redeemer/ex-units and collateral-ready wallet inputs.</li>
              <li>Build, sign, and submit in your wallet.</li>
            </ol>

            <h3 className="guide-subhead">All Governance Action Types</h3>
            <div className="guide-types-list">
              <div className="guide-type-row">
                <span className="guide-type-label">Treasury Withdrawal</span>
                <span className="guide-type-desc">Specify one or more reward/stake addresses and withdrawal amounts. Policy/guardrail fields must match current on-chain rules.</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">Protocol Parameter Change</span>
                <span className="guide-type-desc">Set only parameters you intend to change. Governance voters will review technical and economic impact.</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">Hard Fork Initiation</span>
                <span className="guide-type-desc">Provide the target protocol version details required by the ledger for a fork proposal.</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">No Confidence</span>
                <span className="guide-type-desc">Proposes removal of confidence in the current Constitutional Committee.</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">New Constitutional Committee</span>
                <span className="guide-type-desc">Defines committee membership and threshold updates for the next committee state.</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">Constitutional Amendment</span>
                <span className="guide-type-desc">References a new constitution anchor/hash to update constitutional text and framework.</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">Info Action</span>
                <span className="guide-type-desc">Non-binding signaling action used for sentiment and governance direction.</span>
              </div>
            </div>

            <h3 className="guide-subhead">Script Proposals: What Usually Fails</h3>
            <ol>
              <li>
                <strong>Script integrity hash mismatch:</strong> script/redeemer/cost model context changed after signing.
                Rebuild and re-sign with final values.
              </li>
              <li>
                <strong>Missing script witness:</strong> include the script in witnesses (or valid reference input for supported versions).
              </li>
              <li>
                <strong>No collateral:</strong> script transactions need collateral inputs.
              </li>
              <li>
                <strong>Insufficient fee:</strong> script execution budget increases minimum fee; rebuild with updated ex-units/size.
              </li>
            </ol>

            <h3 className="guide-subhead">Beginner Submission Flow</h3>
            <ol>
              <li>Draft the proposal document first and publish it (for anchor URL).</li>
              <li>Compute and verify the anchor data hash.</li>
              <li>Enter all fields in Submit Governance Action.</li>
              <li>Use defaults/auto-fill guardrails where available, then review manually.</li>
              <li>Build transaction and inspect any validation errors.</li>
              <li>If prompted to re-sign, do it with the unchanged final tx body.</li>
              <li>Submit and save the tx hash for tracking on the Actions page.</li>
            </ol>

            <h3 className="guide-subhead">After Submission</h3>
            <p>
              New actions appear after chain confirmation and indexer sync. If it does not show immediately, wait
              for the next sync cycle and refresh the Actions dashboard.
            </p>
          </section>
        );

      case "tool-cc-cold-credentials":
        return (
          <section className="wiki-section panel">
            <h2>Use Civitas: Constitutional Committee Credentials</h2>
            <p>
              Follow the step wizard below. Pick your track, then copy/paste each command in order.
            </p>
            <p>
              Track 1 is <strong>Individual (key)</strong>. Track 2 is <strong>Multisig (simple script)</strong>.
              Track 3 is <strong>Plutus script</strong>. Cold credentials are long-term identity; hot credentials are for operational voting.
            </p>

            <h3 className="guide-subhead">Prerequisites</h3>
            <ol>
              <li>`cardano-cli` installed and using a version that supports Conway governance commands.</li>
              <li>Access to the target Cardano network (socket/config, network flag, and synced node access).</li>
              <li>A payment address and signing key with enough ada for transaction fees.</li>
              <li>For key track: one secure offline machine for cold keys and one online machine for submission.</li>
              <li>For multisig track: agreed member list, threshold rules, and secure key custody process.</li>
              <li>For Plutus track: `credential-manager` toolchain available (`orchestrator-cli`, `cc-sign`, `tx-bundle`).</li>
              <li>A secure way to move transaction bodies/witnesses between offline and online machines (for example encrypted USB workflow).</li>
            </ol>

            <div className="vote-confirm-actions">
              <button
                type="button"
                className={ccWizardTrack === "individual" ? "mode-btn active" : "mode-btn"}
                onClick={() => {
                  setCcWizardTrack("individual");
                  setCcWizardStep(0);
                }}
              >
                Individual (key)
              </button>
              <button
                type="button"
                className={ccWizardTrack === "multisig" ? "mode-btn active" : "mode-btn"}
                onClick={() => {
                  setCcWizardTrack("multisig");
                  setCcWizardStep(0);
                }}
              >
                Multisig (script)
              </button>
              <button
                type="button"
                className={ccWizardTrack === "plutus" ? "mode-btn active" : "mode-btn"}
                onClick={() => {
                  setCcWizardTrack("plutus");
                  setCcWizardStep(0);
                }}
              >
                Plutus (script)
              </button>
            </div>

            {ccCurrentStep ? (
              <div className="guide-wizard">
                <div className="guide-stepper">
                  {ccSteps.map((step, idx) => (
                    <button
                      key={`cc-step-${step.title}`}
                      type="button"
                      className={`guide-step-dot${idx === ccWizardStep ? " active" : ""}${idx < ccWizardStep ? " done" : ""}`}
                      onClick={() => setCcWizardStep(idx)}
                      aria-label={`Go to step ${idx + 1}`}
                      title={`${idx + 1}. ${step.title}`}
                    />
                  ))}
                </div>
                <p className="muted">
                  Step {ccWizardStep + 1} of {ccSteps.length}
                </p>
                <h3 className="guide-subhead">{ccCurrentStep.title}</h3>
                <p>{ccCurrentStep.summary}</p>
                {ccWizardTrack === "multisig" && ccWizardStep === 0 ? (
                  <div className="controls dashboard-controls">
                    <label>
                      Cold Members (comma-separated)
                      <input value={ccColdMembers} onChange={(e) => setCcColdMembers(e.target.value)} placeholder="Alice, Bob, Carol" />
                    </label>
                    <label>
                      Cold Threshold
                      <input type="number" min="1" value={ccColdThreshold} onChange={(e) => setCcColdThreshold(e.target.value)} placeholder="2" />
                    </label>
                    <label>
                      Hot Members (comma-separated)
                      <input value={ccHotMembers} onChange={(e) => setCcHotMembers(e.target.value)} placeholder="Alice, Bob, Carol" />
                    </label>
                    <label>
                      Hot Threshold
                      <input type="number" min="1" value={ccHotThreshold} onChange={(e) => setCcHotThreshold(e.target.value)} placeholder="2" />
                    </label>
                    <label>
                      Cold Script Hash (optional now)
                      <input value={ccColdScriptHash} onChange={(e) => setCcColdScriptHash(e.target.value)} placeholder="Paste after hashing cold.script" />
                    </label>
                    <label>
                      Hot Script Hash (optional now)
                      <input value={ccHotScriptHash} onChange={(e) => setCcHotScriptHash(e.target.value)} placeholder="Paste after hashing hot.script" />
                    </label>
                  </div>
                ) : null}
                {ccWizardTrack === "multisig" && ccWizardStep === 5 ? (
                  <div className="controls dashboard-controls">
                    <label>
                      Cold Script Hash
                      <input value={ccColdScriptHash} onChange={(e) => setCcColdScriptHash(e.target.value)} placeholder="Required for certificate command" />
                    </label>
                    <label>
                      Hot Script Hash
                      <input value={ccHotScriptHash} onChange={(e) => setCcHotScriptHash(e.target.value)} placeholder="Required for certificate command" />
                    </label>
                  </div>
                ) : null}
                {(ccCurrentStep.commands || []).map((cmd) => (
                  <div key={`${ccCurrentStep.title}-${cmd.label}`} className="guide-command-block">
                    <div className="guide-command-head">
                      <strong>{cmd.label}</strong>
                      <button type="button" className="mode-btn" onClick={() => copyCcText(cmd.text, cmd.label)}>
                        Copy
                      </button>
                    </div>
                    <pre><code>{cmd.text}</code></pre>
                  </div>
                ))}
                {ccCopyNotice ? <p className="muted">{ccCopyNotice}</p> : null}
                <div className="vote-confirm-actions">
                  <button
                    type="button"
                    className="mode-btn"
                    disabled={ccWizardStep === 0}
                    onClick={() => setCcWizardStep((prev) => Math.max(0, prev - 1))}
                  >
                    {ccWizardStep > 0 ? `Back: ${ccSteps[ccWizardStep - 1].title}` : "Previous"}
                  </button>
                  <button
                    type="button"
                    className="mode-btn"
                    disabled={ccWizardStep >= ccSteps.length - 1}
                    onClick={() => setCcWizardStep((prev) => Math.min(ccSteps.length - 1, prev + 1))}
                  >
                    {ccWizardStep < ccSteps.length - 1 ? `Next: ${ccSteps[ccWizardStep + 1].title}` : "Next"}
                  </button>
                </div>
              </div>
            ) : null}

            <h3 className="guide-subhead">Operational Notes</h3>
            <ol>
              <li>Cold key/hash (or cold script hash) is what governance actions reference for CC membership.</li>
              <li>If hot credentials are rotated, issue and submit a new authorization certificate.</li>
              <li>Keep cold signing keys offline; use hot credentials for routine voting operations.</li>
              <li>For now, this guide intentionally excludes the Plutus-script credential path.</li>
            </ol>

            <p>
              Official reference:{" "}
              <a
                className="inline-link"
                href="https://developers.cardano.org/docs/get-started/infrastructure/cardano-cli/governance/constitutional%20committee/"
                target="_blank"
                rel="noreferrer"
              >
                Cardano Developer Portal - Constitutional committee
              </a>
              {" "}and{" "}
              <a
                className="inline-link"
                href="https://credential-manager.readthedocs.io/en/latest/operations/authorizing-the-hot-credential/"
                target="_blank"
                rel="noreferrer"
              >
                Credential Manager - Authorizing the Hot Credential
              </a>
            </p>
          </section>
        );

      case "governance-actions":
        return (
          <section className="wiki-section panel">
            <h2>Governance Actions</h2>
            <p>
              A governance action is a formal on-chain proposal to change something about Cardano. Anyone can
              submit one by depositing 100,000 ada (refunded if ratified; kept if the proposal expires). Once
              submitted, it enters a fixed 6-epoch voting window.
            </p>

            <h3 className="guide-subhead">Action Types</h3>
            <div className="guide-types-list">
              <div className="guide-type-row">
                <span className="guide-type-label">Hard Fork Initiation</span>
                <span className="guide-type-desc">Triggers an upgrade to a new protocol version. Requires DRep, SPO, and CC approval.</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">Protocol Parameter Change</span>
                <span className="guide-type-desc">Modifies a protocol parameter such as block size, fees, or staking rewards. DRep and CC required; SPO for security-group params.</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">Treasury Withdrawal</span>
                <span className="guide-type-desc">Moves Ada from the Cardano treasury to specified addresses. DRep and CC approval required. SPOs do not vote.</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">Info Action</span>
                <span className="guide-type-desc">A non-binding signal poll with no on-chain effect. Used to gauge community sentiment before a binding proposal.</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">No Confidence</span>
                <span className="guide-type-desc">A vote of no confidence in the current Constitutional Committee. If passed, triggers a CC election process.</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">New Constitutional Committee</span>
                <span className="guide-type-desc">Proposes a new CC composition or threshold. Requires DRep and SPO approval; not reviewed by CC (conflict of interest).</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">Constitutional Amendment</span>
                <span className="guide-type-desc">Changes the text of the Cardano constitution. Requires DRep and CC approval.</span>
              </div>
            </div>

            <h3 className="guide-subhead">Lifecycle of a Proposal</h3>
            <p>
              After submission, a proposal is <strong>Open</strong> while voting is in progress. At the end
              of the voting window it is either <strong>Ratified</strong> (thresholds met) or{" "}
              <strong>Expired</strong> (thresholds not met). Ratified actions are then{" "}
              <strong>Enacted</strong> in the following epoch. Actions can also be{" "}
              <strong>Dropped</strong> if a competing action of the same type was already enacted first.
            </p>
            <p>
              The Actions page shows per-proposal vote breakdowns for all three bodies, current threshold
              requirements, and the live vote power progression so you can see exactly how close each proposal
              is to passing or failing.
            </p>

          </section>
        );

      case "ncl":
        return (
          <section className="wiki-section panel">
            <h2>Net Change Limit (NCL)</h2>
            <p>
              The Net Change Limit is a guardrail on Cardano treasury spending. It defines the maximum total
              ada that can be withdrawn from the treasury within a given governance period — regardless of how
              many individual withdrawal proposals pass.
            </p>

            <h3 className="guide-subhead">Why It Exists</h3>
            <p>
              Without an NCL, a series of individually approved treasury withdrawals could collectively drain
              the treasury far beyond what the community would accept in aggregate. The NCL enforces a spending
              ceiling at the constitutional level, making treasury stewardship a bounded, predictable process.
            </p>
            <p>
              Even if every individual withdrawal proposal passes with full DRep and CC approval, the sum of
              all enacted withdrawals within the period cannot exceed the NCL. This is enforced by the protocol
              itself, not by social convention.
            </p>

            <h3 className="guide-subhead">What Civitas Tracks</h3>
            <p>
              The NCL page shows enacted treasury withdrawals for the current and previous NCL windows,
              measured against the limit for each period. You can see how much of the period's budget has
              been used, which proposals consumed it, and how much headroom remains.
            </p>
            <p>
              This is one of the most direct ways to understand treasury health: not just whether individual
              proposals passed, but what the cumulative draw on Cardano's shared funds has been.
            </p>

          </section>
        );

      case "scoring":
        return (
          <section className="wiki-section panel">
            <h2>How Scores Work</h2>
            <p>
              Every actor on Civitas receives an <strong>Accountability Score</strong> — a weighted composite
              of measurable, on-chain behaviors. The goal is not to produce a single "correct" ranking, but
              to surface objective signals that let you form your own view.
            </p>

            <h3 className="guide-subhead">Role-Based Equations</h3>
            <p>
              Civitas now computes accountability with role-specific weighted averages:
            </p>
            <p>
              <strong>DRep score</strong>:{" "}
              <code>
                0.35*Attendance + 0.25*Transparency + 0.15*Consistency + 0.10*Responsiveness + 0.15*DelegationDecentralization
              </code>
            </p>
            <p>
              <strong>SPO score</strong>:{" "}
              <code>
                0.45*Attendance + 0.30*Transparency + 0.15*Consistency + 0.10*Responsiveness
              </code>
            </p>
            <p>
              <strong>CC score</strong>:{" "}
              <code>
                0.45*Attendance + 0.35*RationaleQuality + 0.10*Responsiveness
              </code>
            </p>
            <p>
              If you toggle a metric off in the dashboard, Civitas removes that term and renormalizes by the
              remaining active weights.
            </p>

            <h3 className="guide-subhead">Attendance (DRep 35%, SPO/CC 45%)</h3>
            <p>
              The share of eligible proposals an actor actually voted on.{" "}
              <code>cast votes ÷ eligible proposals</code>. Eligibility is role-aware and term-aware:
              DReps are only eligible from their registration epoch, CC members only within their seat term,
              SPOs only on actions requiring SPO participation. An actor cannot be penalised for proposals
              they had no standing to vote on.
            </p>

            <h3 className="guide-subhead">Transparency (DRep 25%, SPO 30%) — DReps and SPOs only</h3>
            <p>
              The share of cast votes accompanied by a rationale signal —{" "}
              a metadata anchor, IPFS link, or other rationale reference.{" "}
              <code>votes with rationale ÷ votes cast</code>. Voting without explanation is legal
              but weakens democratic accountability. This metric rewards actors who communicate their reasoning.
            </p>

            <h3 className="guide-subhead">Consistency (15%) — DReps and SPOs only</h3>
            <p>
              On proposals with a final binary outcome (yes/no), consistency measures whether the actor's vote
              matched the result. <code>matching votes ÷ comparable votes</code>. Abstain votes are excluded.
              High consistency can mean either strong policy judgement or late voting — pair with responsiveness
              to tell them apart.
            </p>

            <h3 className="guide-subhead">Delegation Decentralization (15%) — DReps only</h3>
            <p>
              This term converts delegation concentration risk into a positive contribution:
              <code>DelegationDecentralization = 100 - DelegationRisk</code>.
              A DRep with lower concentration risk receives a higher decentralization contribution.
            </p>
            <p>
              Delegation risk itself is derived from active delegated voting-power share and scaled into a 0-100 range.
              In practice, this means large concentration footprints reduce the final accountability score, while
              broadly distributed delegation improves it.
            </p>

            <h3 className="guide-subhead">Rationale Quality (35%) — CC only</h3>
            <p>
              For Constitutional Committee members, each vote gets a 0–100 rationale score:
              <br />
              <strong>Availability (0 or 25):</strong> full points only if the rationale URL is valid
              (<code>http(s)</code> or <code>ipfs://</code>) <em>and</em> reachable.
              <br />
              <strong>Structure (0–45):</strong> CIP-136-style fields and checks:
              summary present, rationaleStatement present, summary length ≤ 300 chars, rationaleStatement length ≥ 400 chars,
              optional sections (precedent/counterargument/conclusion), total body length band, and signature containing the member name.
              <br />
              <strong>Constitutional grounding (0–30):</strong> distinct constitution citations in text plus
              <code>RelevantArticles</code> references.
              <br />
              Total body-length band thresholds are: 2000 / 3300 / 4500 / 5900 chars.
              The displayed member value is the average across scoped CC votes.
            </p>

            <h3 className="guide-subhead">Responsiveness (10%)</h3>
            <p>
              How quickly an actor votes after a proposal is submitted.{" "}
              <code>average hours between proposal submission and vote</code>, normalized by:
              <code>max(0, 100 - (avgHours / (24*30))*100)</code>.{" "}
              A responsive actor is engaged and deliberate rather than waiting until the last moment.
            </p>

            <h3 className="guide-subhead">A Score Is a Starting Point</h3>
            <p>
              A high score means an actor is active, communicative, and prompt — based on observable on-chain
              data. It does not mean their votes are correct, that their policy positions match yours, or that
              they are the right choice for your delegation. Read the individual vote history, check their
              rationales, and use the score as a filter, not a verdict.
            </p>
          </section>
        );

      case "history":
        return (
          <section className="wiki-section panel">
            <h2>Snapshot History</h2>
            <p>
              Civitas captures epoch-boundary snapshots of governance state. Each snapshot preserves the
              complete set of proposals, votes, and actor metrics as they stood at that point in time.
              Historical snapshots let you review how governance looked in a specific epoch without being
              affected by subsequent changes.
            </p>
            <p>
              Click any epoch link below to open that snapshot in the relevant dashboard.
            </p>

            <div className="wiki-history-box">
              {history.length === 0 ? (
                <p className="muted">No historical snapshots available yet.</p>
              ) : (
                <>
                  {visibleHistory.map((item) => (
                    <p key={item.key}>
                      <span className="mono">Epoch {item.epoch ?? "?"}</span>{" "}-{" "}
                      <Link className="inline-link" to={`/dreps?snapshot=${encodeURIComponent(item.key)}`}>DRep</Link>{" "}|{" "}
                      <Link className="inline-link" to={`/spos?snapshot=${encodeURIComponent(item.key)}`}>SPO</Link>{" "}|{" "}
                      <Link className="inline-link" to={`/committee?snapshot=${encodeURIComponent(item.key)}`}>Committee</Link>{" "}|{" "}
                      <Link className="inline-link" to={`/actions?snapshot=${encodeURIComponent(item.key)}`}>Actions</Link>
                    </p>
                  ))}
                  {history.length > 5 ? (
                    <button type="button" className="mode-btn" onClick={() => setShowAllSnapshots((v) => !v)}>
                      {showAllSnapshots ? "Collapse snapshot list" : `Show all ${history.length} snapshots`}
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </section>
        );

      default:
        return null;
    }
  }

  return (
    <main className="shell wiki-guide-shell">
      <header className="hero wiki-header">
        <h1>Governance Guides</h1>
        <p>Everything you need to understand Cardano governance and how to use Civitas to follow it.</p>
      </header>

      <section className="wiki-layout">
        <aside className="wiki-sidebar panel">
          <h3>Contents</h3>
          <nav aria-label="Guide sections" className="wiki-nav">
            {tocGroups.map((group) => (
              <div key={group.title} className="wiki-nav-group">
                <p className="wiki-nav-title">{group.title}</p>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={activeSection === item.id ? "active" : ""}
                    onClick={() => setActiveSection(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <article className="wiki-content">
          {renderSection()}
        </article>
      </section>
    </main>
  );
}
