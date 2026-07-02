<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/284319a49694ab0b13717cd1.md -->
# BEACNpool

**Proposal:** Se7en Labs Daedalus Wallet Maintenance and Improvements 2026-2027
**Vote:** No
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: gov_action1mr0qdz2jmagvsch6r08fhqvq6vu8jakt4c8m9s7ea7z0p740vntqq4yjd6j
Recommendation: **NO**
Score: `-0.3133` (raw `-0.2833` + doctrine-LLM nudge `-0.03`) | Confidence: `0.8333` | Readiness: `0.0`
> Reasoning layer (precomputed): The claims show plausible public-good maintenance value and some independently verifiable success metrics, but the deterministic assessment reports missing budget, feasibility, risk, alternatives, and failure-mode analysis for a large treasury withdrawal. Under BEACN's hierarchy, treasury stewardship and evidence quality justify a small cautious negative nudge rather than rewarding the proposal's public-benefit framing.

## Plain-language explanation (codex-offline-review)
BEACN records NO on Se7en Labs: Daedalus Wallet Maintenance and Improvements 2026-2027. The decisive concern is that the proposal's risks, precedent, or evidence gaps outweigh the case presented.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: Treasury withdrawal to fund Daedalus Wallet Maintenance and Improvements 2026-2027 delivered by Se7en Labs, Inc.. The recorded treasury amount is 1,785,333 ADA. The strongest grounded claim is: The proposal states that Daedalus private keys are generated and stored on the user's device, never transmitted externally, and that open-source Apache 2.0 licensing allows anyone to audit this behavior.

A material weak point is that this claim remains proposer-asserted or thinly supported: Daedalus is described as Cardano's only full-node desktop wallet, running an embedded Cardano node and deriving wallet and governance data directly from chain without third-party APIs or trusted backends. The blocking questions are: missing complete proposal summary; missing budget analysis; missing feasibility assessment.

## Review Tree
- overall_status: `blocked`

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
- finding: Snapshot freshness source: manifest
- finding: Deep research dossier: required
- finding: Requested: Treasury withdrawal to fund Daedalus Wallet Maintenance and Improvements 2026-2027 delivered by Se7en Labs, Inc.
- finding: Recipient: Se7en Labs, Inc. through Intersect administration and milestone-based disbursement controls
- finding: Stated amount: 1,785,333 ADA
- finding: Deliverables: Protocol maintenance including node upgrades, wallet backend updates, dependency updates, security patches, platform compatibility, and hard fork readiness, Compatible Daedalus release at least 2 weeks before each mainnet hard fork, Leios, Peras, and Nested Transactions readiness, Keystone and Flex hardware wallet support, plus additional newer hardware wallet models as they emerge, CIP-30 dApp connector implementation in Daedalus, Responsive user support across GitHub, community forums, and direct channels, including Japanese-language support, Full Japanese translation across all new features, Architecture assessment published publicly with recommendation and rationale, Independent financial audit and test hardware support
- finding: Deadline/expiry: Contract year through 2026-2027; ongoing maintenance and user support for 52 weeks; architecture assessment by Q3 2027
- finding: Claim (technical, proposer_asserted, high materiality): Daedalus is described as Cardano's only full-node desktop wallet, running an embedded Cardano node and deriving wallet and governance data directly from chain without third-party APIs or trusted backends.
- finding: Claim (technical, independently_verifiable, high materiality): The proposal states that Daedalus private keys are generated and stored on the user's device, never transmitted externally, and that open-source Apache 2.0 licensing allows anyone to audit this behavior.
- finding: Claim (adoption, proposer_asserted, medium materiality): The document says opt-in telemetry shows approximately 4,000 monthly active Daedalus users, while asserting the true count is meaningfully higher because privacy-conscious users are less likely to opt in.
- finding: Claim (technical, proposer_asserted, high materiality): Se7en Labs says it assumed Daedalus responsibility under an IOG contract in January 2026 and shipped Mithril Snapshot Bootstrap, UTxO-HD/LSM backend work, Apple Silicon builds, a drt release CLI, Nix build modernization, and Daedalus 8.0 and 11.0.
- finding: Claim (technical, supported_in_proposal, high materiality): The team claims it has the necessary Haskell/cardano-node integration, Electron/React frontend, Nix build, release engineering, and QA capabilities for Daedalus maintenance.
- finding: Claim (technical, supported_in_proposal, high materiality): The proposal commits to keeping Daedalus compatible with upcoming protocol changes by integrating cardano-node and cardano-wallet releases and publishing compatible stable releases at least 2 weeks before each mainnet hard fork.
- missing: Independent evidence for: Daedalus is described as Cardano's only full-node desktop wallet, running an embedded Cardano node and deriving wallet and governance data directly from chain without third-party APIs or trusted backends.
- missing: Independent evidence for: The document says opt-in telemetry shows approximately 4,000 monthly active Daedalus users, while asserting the true count is meaningfully higher because privacy-conscious users are less likely to opt in.
- missing: Independent evidence for: Se7en Labs says it assumed Daedalus responsibility under an IOG contract in January 2026 and shipped Mithril Snapshot Bootstrap, UTxO-HD/LSM backend work, Apple Silicon builds, a drt release CLI, Nix build modernization, and Daedalus 8.0 and 11.0.
- missing: complete proposal summary
- missing: budget analysis
- missing: feasibility assessment
- missing: risk analysis
- missing: alternatives analysis
- missing: failure-mode analysis
- missing: community impact analysis
- conclusion: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.

### Treasury analysis
- status: `incomplete`
- finding: Requested ADA: 1.79M ADA
- finding: Budget granularity: unknown
- finding: Milestone payment gates: unknown
- finding: Clawback/refund path: unknown
- finding: Cost/benefit clarity: unknown
- finding: Recurring funding dependency: unknown
- finding: Six-month treasury flow regime: unknown (stale snapshot)
- finding: Financial confidence: unknown
- missing: line-item budget
- missing: milestone-gated disbursement
- missing: sustainability path
- missing: cost-benefit clarity
- conclusion: Treasury votes require a higher bar because they consume shared ADA and create precedent.

### Risk review
- status: `thin`
- finding: Execution risk: unknown
- finding: Governance risk: unknown
- finding: Technical risk: unknown
- finding: Treasury exposure risk: unknown
- finding: Mitigation evidence: unknown
- finding: Independent assurance: unknown
- finding: Rollback/remedy path: unknown
- finding: Flag count: 1
- missing: mitigation evidence
- missing: independent assurance
- missing: rollback/remedy path
- missing: dependency map
- conclusion: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.

### Counterargument pass
- status: `complete`
- finding: Strongest YES: the proposal substantiates "The proposal states that Daedalus private keys are generated and stored on the user's device, never transmitted externally, and that open-source Apache 2.0 licensing allows anyone to audit this behavior." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "Daedalus is described as Cardano's only full-node desktop wallet, running an embedded Cardano node and deriving wallet and governance data directly from chain without third-party APIs or trusted backends." — so cost or precedent may outweigh the benefit.
- finding: Strongest hold: a treasury action without a complete deep-research dossier cannot be voted directionally without pretending certainty.
- conclusion: A defensible rationale must show the best opposing case before it reaches a vote.

### Synthesis
- status: `blocked`
- finding: Final vote must be derived from completed sections above, not from a prose summary.
- finding: The public rationale should name the decisive section and the strongest counterargument.
- missing: missing complete proposal summary
- missing: missing budget analysis
- missing: missing feasibility assessment
- missing: missing risk analysis
- missing: missing alternatives analysis
- missing: missing failure-mode analysis
- missing: missing community impact analysis
- conclusion: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Facts
- Pinned anchor document is available for this action.
- Treasury withdrawal actions require elevated scrutiny.
- Flag score present (4), reducing confidence.
- Intake: Action type: TreasuryWithdrawals
- Claims and evidence: Proposal anchor: pinned and replayable
- Treasury analysis: Requested ADA: 1.79M ADA
- Risk review: Execution risk: unknown
- Counterargument pass: Strongest YES: the proposal substantiates "The proposal states that Daedalus private keys are generated and stored on the user's device, never transmitted externally, and that open-source Apache 2.0 licensing allows anyone to audit this behavior." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- Doctrine-aware reasoning layer nudged the score by -0.030 (clamped to ±0.05): The claims show plausible public-good maintenance value and some independently verifiable success metrics, but the deterministic assessment reports missing budget, feasibility, risk, alternatives, and failure-mode analysis for a large treasury withdrawal. Under BEACN's hierarchy, treasury stewardship and evidence quality justify a small cautious negative nudge rather than rewarding the proposal's public-benefit framing.
- Intake: Baseline fields and source anchors establish whether the proposal can be reviewed at all.
- Claims and evidence: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.
- Treasury analysis: Treasury votes require a higher bar because they consume shared ADA and create precedent.
- Risk review: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.
- Counterargument pass: A defensible rationale must show the best opposing case before it reaches a vote.
- Synthesis: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Uncertainty
- Treasury diligence dossier incomplete; soft gate applied a -0.1 caution penalty and judged on available repo context (anchor + doctrine + reasoning lean) rather than abstaining.
- Treasury fee-flow snapshot is stale (epoch 621, ~19 epochs behind); regime treated as UNKNOWN and NOT scored. Refresh export_governance_risk_metrics.
- DRep ratification support is below threshold; this is not treated as active opposition.
- Claims and evidence missing: Independent evidence for: Daedalus is described as Cardano's only full-node desktop wallet, running an embedded Cardano node and deriving wallet and governance data directly from chain without third-party APIs or trusted backends.
- Claims and evidence missing: Independent evidence for: The document says opt-in telemetry shows approximately 4,000 monthly active Daedalus users, while asserting the true count is meaningfully higher because privacy-conscious users are less likely to opt in.
- Claims and evidence status is thin.
- Treasury analysis missing: line-item budget
- Treasury analysis missing: milestone-gated disbursement
- Treasury analysis status is incomplete.
- Risk review missing: mitigation evidence
- Risk review missing: independent assurance
- Risk review status is thin.
- Synthesis missing: missing complete proposal summary
- Synthesis missing: missing budget analysis
- Synthesis status is blocked.

## Reproducibility
- input_hash: `6bb9dba489ddcc2cbfea4970c53431274430549b9c923233a36a60a5c5af356c`
- snapshot_bundle_hash: `33f05c8e06244dd1446d24c36504d2aa034969467d1977d5de05ea941f785cf9`
- soul_commit: `8e5afeb10af64d4e1c9708d4029f95043c3f5354`
- soul_text_hash: `a8c48e8e59534bbaa71af9a923ef942aa2cda51cb9e259331cef24e0da27ae10`
- resource_registry_commit: `7d671706a9a739988611151bb93ebc1eebba6851`
- resources_used: `gov_actions_api, gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents`
- snapshot_age_seconds: `650`
- uncertainty_band: `HIGH`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.1914, "NO": 0.7642, "YES": 0.0443}`
