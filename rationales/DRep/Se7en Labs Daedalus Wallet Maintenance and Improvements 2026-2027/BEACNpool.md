<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/17f10fad8c8ced7c647fbd3c.md -->
# BEACNpool

**Proposal:** Se7en Labs Daedalus Wallet Maintenance and Improvements 2026-2027
**Vote:** No
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: d8de068952df50c862fa1bce9b8180d3387976cbae0fb2c3d9ef84f0faaf64d6#0
Recommendation: **NO**
Score: `-0.11` (binding treasury composite; advisory raw signal `-0.11`; LLM lean `+0.0` recorded, not added) | Confidence: `0.7475` | Readiness: `0.85`
> Reasoning layer (precomputed): The extracted claims show strong public-benefit alignment for established open-source wallet infrastructure and include some independently verifiable delivery metrics and NCL assertions, but several material adoption, track-record, cost, and operational claims remain proposer-asserted within the document. The deterministic assessment is already ready, and the evidence mix does not justify an additional directional nudge beyond the mechanical review.

## Plain-language explanation (deterministic-heuristic)
BEACN records NO on Se7en Labs: Daedalus Wallet Maintenance and Improvements 2026-2027. On the evidence available to BEACN's published review, the request does not clear the bar for spending shared treasury funds.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: Daedalus Wallet Maintenance and Improvements 2026-2027 delivered by Se7en Labs, Inc. It asks the treasury for 1,785,333 ADA. The strongest grounded claim is: The proposal commits to a compatible stable Daedalus release at least 2 weeks before every mainnet hard fork and says release timing and version-currency metrics are independently verifiable from public GitHub repositories and the Cardano mainnet chain.

A material claim remains proposer-asserted or thinly supported: Daedalus is described as Cardano's only full-node desktop wallet, running an embedded Cardano node and deriving wallet and governance data directly from chain data without third-party APIs or trusted backends.

## Review Tree
- overall_status: `incomplete`

### Intake
- status: `complete`
- finding: Action type: TreasuryWithdrawals
- finding: Status: active
- finding: Proposed epoch: 639
- finding: Expires after epoch: 646
- finding: Treasury request: 1.79M ADA
- finding: Anchor pinned locally: yes
- conclusion: Baseline fields and source anchors establish whether the proposal can be reviewed at all.

### Claims and evidence
- status: `thin`
- finding: Proposal anchor: pinned and replayable
- finding: Proposal document read by reasoning layer: yes
- finding: Snapshot freshness source: deep_research_dossiers.csv
- finding: Deep research dossier: complete
- finding: Requested: Daedalus Wallet Maintenance and Improvements 2026-2027 delivered by Se7en Labs, Inc.
- finding: Recipient: Se7en Labs, Inc. via Intersect administration and milestone-based disbursement
- finding: Stated amount: 1,785,333
- finding: Deliverables: Protocol maintenance including node upgrades, wallet backend updates, hard fork readiness, platform support, dependency maintenance, Nix build infrastructure, and release engineering, Compatible Daedalus stable release at least 2 weeks before each mainnet hard fork, Leios, Peras, and Nested Transactions readiness as those protocols progress toward testnet or mainnet, Keystone and Flex hardware wallet support, plus additional newer hardware wallet models as they emerge during the contract period, CIP-30 dApp connector implementation within Daedalus with documentation and interoperability verification, Ongoing user support through GitHub, community forums, and direct channels, including Japanese-language support, Full Japanese translation maintained across all new features, Architecture assessment covering current state, options, resource estimates, and recommendation, Independent financial audit and test hardware acquisition, with unspent labor, hardware, and audit budget returned to the treasury
- finding: Deadline/expiry: Contract year through 2026-2027; architecture assessment by Q3 2027; IOG contract stated as closing August 31, 2026
- finding: Claim (technical, proposer_asserted, high materiality): Daedalus is described as Cardano's only full-node desktop wallet, running an embedded Cardano node and deriving wallet and governance data directly from chain data without third-party APIs or trusted backends.
- finding: Claim (adoption, proposer_asserted, high materiality): The proposal states Daedalus has approximately 4,000 monthly active users according to opt-in telemetry, while asserting the true count is meaningfully higher because privacy-conscious users are less likely to opt in.
- finding: Claim (technical, proposer_asserted, high materiality): Se7en Labs says it assumed Daedalus responsibility under an IOG contract in January 2026 and shipped Mithril Snapshot Bootstrap, UTxO-HD/LSM backend integration, Apple Silicon builds, a release CLI, Nix build modernization, and Daedalus 8.0 and 11.0 during that contract period.
- finding: Claim (technical, independently_verifiable, high materiality): The proposal commits to a compatible stable Daedalus release at least 2 weeks before every mainnet hard fork and says release timing and version-currency metrics are independently verifiable from public GitHub repositories and the Cardano mainnet chain.
- finding: Claim (technical, supported_in_proposal, high materiality): The scope includes maintaining Electron, Node.js, wallet dependencies, reproducible Nix builds, signing continuity, and all platform targets across Windows, macOS x86_64, macOS aarch64, and Linux.
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal requests 1,785,333 ADA, consisting of 1,666,667 ADA for team labor, 33,333 ADA for test hardware, 33,333 ADA for financial audit, and 52,000 ADA for Intersect budget administration.
- missing: Independent evidence for: Daedalus is described as Cardano's only full-node desktop wallet, running an embedded Cardano node and deriving wallet and governance data directly from chain data without third-party APIs or trusted backends.
- missing: Independent evidence for: The proposal states Daedalus has approximately 4,000 monthly active users according to opt-in telemetry, while asserting the true count is meaningfully higher because privacy-conscious users are less likely to opt in.
- missing: Independent evidence for: Se7en Labs says it assumed Daedalus responsibility under an IOG contract in January 2026 and shipped Mithril Snapshot Bootstrap, UTxO-HD/LSM backend integration, Apple Silicon builds, a release CLI, Nix build modernization, and Daedalus 8.0 and 11.0 during that contract period.
- missing: Independent evidence for: The proposer states that any unspent labor, hardware, and audit budget at contract close will be returned to the treasury.
- conclusion: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.

### Treasury analysis
- status: `complete`
- finding: Requested ADA: 1785333
- finding: Budget granularity: confirmed
- finding: Milestone payment gates: confirmed
- finding: Clawback/refund path: unknown
- finding: Cost/benefit clarity: unknown
- finding: Recurring funding dependency: unknown
- finding: Six-month treasury flow regime: stressed (basis: total inflow (tau + donations) vs enacted withdrawals)
- finding: Financial confidence: 0.62
- missing: sustainability path
- missing: cost-benefit clarity
- conclusion: Treasury votes require a higher bar because they consume shared ADA and create precedent.

### Risk review
- status: `complete`
- finding: Execution risk: medium
- finding: Governance risk: medium
- finding: Technical risk: medium
- finding: Treasury exposure risk: high
- finding: Mitigation evidence: confirmed
- finding: Independent assurance: not confirmed
- finding: Rollback/remedy path: unknown
- finding: Flag count: 1
- missing: independent assurance
- missing: rollback/remedy path
- missing: dependency map
- conclusion: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.

### Counterargument pass
- status: `complete`
- finding: Strongest YES: the proposal substantiates "The proposal commits to a compatible stable Daedalus release at least 2 weeks before every mainnet hard fork and says release timing and version-currency metrics are independently verifiable from public GitHub repositories and the Cardano mainnet chain." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "Daedalus is described as Cardano's only full-node desktop wallet, running an embedded Cardano node and deriving wallet and governance data directly from chain data without third-party APIs or trusted backends." — so cost or precedent may outweigh the benefit.
- finding: Strongest hold: if claims cannot be tied to replayable evidence, abstaining avoids overclaiming certainty.
- conclusion: A defensible rationale must show the best opposing case before it reaches a vote.

### Synthesis
- status: `ready`
- finding: Final vote must be derived from completed sections above, not from a prose summary.
- finding: The public rationale should name the decisive section and the strongest counterargument.
- conclusion: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Facts
- Pinned anchor document is available for this action.
- Treasury withdrawal actions require elevated scrutiny.
- Intake: Action type: TreasuryWithdrawals
- Claims and evidence: Proposal anchor: pinned and replayable
- Treasury analysis: Requested ADA: 1785333
- Risk review: Execution risk: medium
- Counterargument pass: Strongest YES: the proposal substantiates "The proposal commits to a compatible stable Daedalus release at least 2 weeks before every mainnet hard fork and says release timing and version-currency metrics are independently verifiable from public GitHub repositories and the Cardano mainnet chain." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- Directional NO forced: the applicable Net Change Limit is exhausted — treasury withdrawals already enacted within this NCL period leave no remaining capacity.
- Intake: Baseline fields and source anchors establish whether the proposal can be reviewed at all.
- Claims and evidence: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.
- Treasury analysis: Treasury votes require a higher bar because they consume shared ADA and create precedent.
- Risk review: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.
- Counterargument pass: A defensible rationale must show the best opposing case before it reaches a vote.
- Synthesis: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Uncertainty
- Treasury flow signal is in stressed regime (total inflow (tau + donations) vs enacted withdrawals).
- DRep ratification support is below threshold; this is not treated as active opposition.
- Claims and evidence missing: Independent evidence for: Daedalus is described as Cardano's only full-node desktop wallet, running an embedded Cardano node and deriving wallet and governance data directly from chain data without third-party APIs or trusted backends.
- Claims and evidence missing: Independent evidence for: The proposal states Daedalus has approximately 4,000 monthly active users according to opt-in telemetry, while asserting the true count is meaningfully higher because privacy-conscious users are less likely to opt in.
- Claims and evidence status is thin.
- Treasury analysis missing: sustainability path
- Treasury analysis missing: cost-benefit clarity
- Risk review missing: independent assurance
- Risk review missing: rollback/remedy path

## Reproducibility
- input_hash: `af726baa9dfcd655d080aeaf9b08d2a34d344f3d1f82a12d09ad989580db4005`
- snapshot_bundle_hash: `e3ef6fee7a3cba642c8cdbb66e9a833c2fe4fde0de9a43ae02954e43f38f4d66`
- soul_commit: `c813ed97f64dba61150d01964327553baf720d38`
- soul_text_hash: `fa491ed711b9834e5a3c72d35903cec18afe8d93e1262f42ffcb20f5fce2c276`
- resource_registry_commit: `c606ba518ed256218f696ae088168d3a931d452b`
- resources_used: `gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents, deep_research_dossiers, ecosystem_value_profiles, treasury_policy_state, treasury_portfolio, governance_outcomes, protocol_readiness_profiles`
- snapshot_age_seconds: `0`
- uncertainty_band: `MEDIUM`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.2266, "NO": 0.6369, "YES": 0.1366}`
