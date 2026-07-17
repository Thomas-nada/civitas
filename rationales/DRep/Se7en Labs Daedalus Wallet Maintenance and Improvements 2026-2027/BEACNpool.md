<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/3a5cfea731b3c95be4172eea.md -->
# BEACNpool

**Proposal:** Se7en Labs Daedalus Wallet Maintenance and Improvements 2026-2027
**Vote:** Yes
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: d8de068952df50c862fa1bce9b8180d3387976cbae0fb2c3d9ef84f0faaf64d6#0
Recommendation: **YES**
Score: `0.12` (binding treasury composite; advisory raw signal `-0.11`; LLM lean `+0.02` recorded, not added) | Confidence: `0.75` | Readiness: `0.85`
> Reasoning layer (precomputed): A small positive nudge is justified because the proposal gives concrete deliverables, acceptance criteria, budget categories, milestone oversight, and independently verifiable release/version metrics, while aligning with public-benefit infrastructure maintenance and protocol-safety continuity; the nudge remains small because several adoption and track-record claims are still proposer-asserted and the labor budget is broad for a time-and-materials engagement.

## Plain-language explanation (deterministic-heuristic)
BEACN records YES on Se7en Labs: Daedalus Wallet Maintenance and Improvements 2026-2027. The deterministic gates found enough evidence and no decisive blocker.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: Fund Daedalus Wallet maintenance and improvements for 2026-2027 as a time-and-materials engagement delivered by Se7en Labs, Inc. It asks the treasury for 1,785,333 ADA. The strongest grounded claim is: Daedalus is open-source under Apache License 2.0, and the proposal says funded source code, build tooling, documentation, and release artifacts will remain public assets that anyone can fork.

A residual watch item: this claim remains proposer-asserted rather than independently shown: Daedalus is described as Cardano's only full-node desktop wallet, running an embedded Cardano node and deriving wallet and governance data directly from chain without third-party APIs or trusted backends.

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
- finding: Requested: Fund Daedalus Wallet maintenance and improvements for 2026-2027 as a time-and-materials engagement delivered by Se7en Labs, Inc.
- finding: Recipient: Se7en Labs, Inc. through Intersect administration and monthly disbursement controls
- finding: Stated amount: 1,785,333
- finding: Deliverables: Protocol maintenance including node and wallet backend updates, hard fork readiness, and releases at least 2 weeks before each mainnet hard fork, Hardware wallet support for Keystone and Flex, plus newer hardware wallet models as they emerge, CIP-30 dApp connector implementation within Daedalus with documentation and interoperability verification, User support across GitHub, community forums, and direct channels, including Japanese-language support and full Japanese translation for shipped features, Architecture assessment published by Q3 2027, Test hardware acquisition and independent financial audit
- finding: Deadline/expiry: Contract year through 2026-2027; specific milestones include 52 weeks maintenance and support, 26 weeks Leios/Peras readiness, 20 weeks CIP-30, 12 weeks hardware wallet support, 8 weeks architecture assessment, and architecture assessment by Q3 2027
- finding: Claim (technical, proposer_asserted, high materiality): Daedalus is described as Cardano's only full-node desktop wallet, running an embedded Cardano node and deriving wallet and governance data directly from chain without third-party APIs or trusted backends.
- finding: Claim (technical, supported_in_proposal, high materiality): Daedalus is open-source under Apache License 2.0, and the proposal says funded source code, build tooling, documentation, and release artifacts will remain public assets that anyone can fork.
- finding: Claim (adoption, proposer_asserted, medium materiality): The proposal says opt-in telemetry shows approximately 4,000 monthly active Daedalus users, while asserting the true count is meaningfully higher because privacy-conscious full-node users are less likely to opt in.
- finding: Claim (technical, proposer_asserted, high materiality): Se7en Labs states it assumed responsibility for Daedalus under an IOG contract in January 2026 and shipped Mithril snapshot bootstrap, UTxO-HD/LSM backend integration, Apple Silicon builds, a release CLI, Nix modernization, and Daedalus 8.0 and 11.0.
- finding: Claim (technical, supported_in_proposal, high materiality): The proposal commits to compatible Daedalus releases at least 2 weeks before every mainnet hard fork and to keeping cardano-node no more than 2 major versions behind mainnet recommended at any time.
- finding: Claim (governance, independently_verifiable, high materiality): The proposal says release timing and version-currency success metrics are independently verifiable from public GitHub repositories and the Cardano mainnet chain without relying on applicant self-reporting.
- missing: Independent evidence for: Daedalus is described as Cardano's only full-node desktop wallet, running an embedded Cardano node and deriving wallet and governance data directly from chain without third-party APIs or trusted backends.
- missing: Independent evidence for: The proposal says opt-in telemetry shows approximately 4,000 monthly active Daedalus users, while asserting the true count is meaningfully higher because privacy-conscious full-node users are less likely to opt in.
- missing: Independent evidence for: Se7en Labs states it assumed responsibility for Daedalus under an IOG contract in January 2026 and shipped Mithril snapshot bootstrap, UTxO-HD/LSM backend integration, Apple Silicon builds, a release CLI, Nix modernization, and Daedalus 8.0 and 11.0.
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
- finding: Strongest YES: the proposal substantiates "Daedalus is open-source under Apache License 2.0, and the proposal says funded source code, build tooling, documentation, and release artifacts will remain public assets that anyone can fork." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "Daedalus is described as Cardano's only full-node desktop wallet, running an embedded Cardano node and deriving wallet and governance data directly from chain without third-party APIs or trusted backends." — so cost or precedent may outweigh the benefit.
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
- Counterargument pass: Strongest YES: the proposal substantiates "Daedalus is open-source under Apache License 2.0, and the proposal says funded source code, build tooling, documentation, and release artifacts will remain public assets that anyone can fork." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- Advisory model lean was +0.020 (display cap ±0.05) and had zero influence on the binding score: A small positive nudge is justified because the proposal gives concrete deliverables, acceptance criteria, budget categories, milestone oversight, and independently verifiable release/version metrics, while aligning with public-benefit infrastructure maintenance and protocol-safety continuity; the nudge remains small because several adoption and track-record claims are still proposer-asserted and the labor budget is broad for a time-and-materials engagement.
- Directional YES cleared ecosystem benefit, delivery, cost-efficiency, downside-protection, and portfolio-capacity floors.
- Intake: Baseline fields and source anchors establish whether the proposal can be reviewed at all.
- Claims and evidence: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.
- Treasury analysis: Treasury votes require a higher bar because they consume shared ADA and create precedent.
- Risk review: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.
- Counterargument pass: A defensible rationale must show the best opposing case before it reaches a vote.
- Synthesis: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Uncertainty
- Treasury flow signal is in stressed regime (total inflow (tau + donations) vs enacted withdrawals).
- DRep ratification support is below threshold; this is not treated as active opposition.
- Claims and evidence missing: Independent evidence for: Daedalus is described as Cardano's only full-node desktop wallet, running an embedded Cardano node and deriving wallet and governance data directly from chain without third-party APIs or trusted backends.
- Claims and evidence missing: Independent evidence for: The proposal says opt-in telemetry shows approximately 4,000 monthly active Daedalus users, while asserting the true count is meaningfully higher because privacy-conscious full-node users are less likely to opt in.
- Claims and evidence status is thin.
- Treasury analysis missing: sustainability path
- Treasury analysis missing: cost-benefit clarity
- Risk review missing: independent assurance
- Risk review missing: rollback/remedy path

## Reproducibility
- input_hash: `6fd07ad0d9250e334b8a5bd3220f1e847307a029ead4c2fff3355e2ef1c1ca0b`
- snapshot_bundle_hash: `442f277f455d06ea90e900be70943984652f48af769d9c391a801e3bacd96230`
- soul_commit: `c813ed97f64dba61150d01964327553baf720d38`
- soul_text_hash: `fa491ed711b9834e5a3c72d35903cec18afe8d93e1262f42ffcb20f5fce2c276`
- resource_registry_commit: `d68b33ee7989803aaecd7edc03d77c134a98a7f1`
- resources_used: `gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents, deep_research_dossiers, ecosystem_value_profiles, treasury_policy_state, treasury_portfolio, governance_outcomes, protocol_readiness_profiles`
- snapshot_age_seconds: `0`
- uncertainty_band: `MEDIUM`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.2263, "NO": 0.1263, "YES": 0.6475}`
