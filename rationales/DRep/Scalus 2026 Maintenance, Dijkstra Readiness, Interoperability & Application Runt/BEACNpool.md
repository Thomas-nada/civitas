<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/96225eaeb6fd7537112fb397.md -->
# BEACNpool

**Proposal:** Scalus 2026 Maintenance, Dijkstra Readiness, Interoperability & Application Runt
**Vote:** No
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: gov_action1xg69v73lfzkwyhhuz583x6geyc2ewn3r96sxuqj3wqvrrk0yfpksqqa63yc
Recommendation: **NO**
Score: `-0.3133` (raw `-0.2833` + doctrine-LLM nudge `-0.03`) | Confidence: `0.8333` | Readiness: `0.0`
> Reasoning layer (precomputed): The extracted claims show plausible public-benefit infrastructure and some independently checkable adoption claims, but the deterministic assessment is blocked for missing budget, feasibility, risk, alternatives, and failure-mode analysis. Under a large treasury withdrawal, the evidence gaps justify a small cautionary nudge rather than a positive adjustment.

## Plain-language explanation (codex-offline-review)
BEACN records NO on Scalus 2026: Maintenance, Dijkstra Readiness, Interoperability & Application Runtime. The decisive concern is that the proposal's risks, precedent, or evidence gaps outweigh the case presented.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: Scalus 2026: Maintenance, Dijkstra readiness, interoperability, and a scoped application runtime over 9 months. The recorded treasury amount is 2464844. The strongest grounded claim is: Scalus components are reused inside MeshJS, Evolution SDK, Lucid Evolution, Cardano Client Lib, and YaciDevKit.

A material weak point is that this claim remains proposer-asserted or thinly supported: Scalus is an established open-source Cardano development platform built by Lantr Engineering over three years of continuous delivery. The blocking questions are: missing complete proposal summary; missing budget analysis; missing feasibility assessment.

## Review Tree
- overall_status: `blocked`

### Intake
- status: `complete`
- finding: Action type: TreasuryWithdrawals
- finding: Status: active
- finding: Proposed epoch: 640
- finding: Expires after epoch: 647
- finding: Treasury request: 2.46M ADA
- finding: Anchor pinned locally: yes
- conclusion: Baseline fields and source anchors establish whether the proposal can be reviewed at all.

### Claims and evidence
- status: `thin`
- finding: Proposal anchor: pinned and replayable
- finding: Proposal document read by reasoning layer: yes
- finding: Snapshot freshness source: manifest
- finding: Deep research dossier: required
- finding: Requested: Scalus 2026: Maintenance, Dijkstra readiness, interoperability, and a scoped application runtime over 9 months
- finding: Recipient: Lantr Engineering
- finding: Stated amount: 2464844
- finding: Deliverables: Ongoing maintenance: bug fixes, dependency upkeep, security patches, releases, Dijkstra developer preview with initial Plutus V4 support in the compiler and standard library, Improved JS/TS interfaces and documentation for components embedded in MeshJS, Evolution SDK, and Lucid Evolution, Foundational runtime components and reactive workers, Dijkstra ledger rules and transaction-builder updates for new builtins, cost models, nested transactions, accounts, and guard scripts, Conformance testing, Java/Kotlin integration with Spring Boot and Ktor examples, Cleaner integration paths with Cardano Client Lib and Yaci, Runtime chain follower and task scheduler
- finding: Deadline/expiry: March 2027
- finding: Claim (adoption, proposer_asserted, high materiality): Scalus is an established open-source Cardano development platform built by Lantr Engineering over three years of continuous delivery.
- finding: Claim (adoption, independently_verifiable, high materiality): Scalus components are reused inside MeshJS, Evolution SDK, Lucid Evolution, Cardano Client Lib, and YaciDevKit.
- finding: Claim (adoption, independently_verifiable, high materiality): Protocols and applications including Gummiworm L2, Bifrost, SugarRush, Vela, and DID/DIDComm are built on Scalus.
- finding: Claim (adoption, independently_verifiable, medium materiality): Scalus has 4,642 commits across 32 releases, 12 contributors, and Scalus.js reaches more than 20,000 downloads per month.
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal asks for ₳2,464,844 over 9 months, equivalent to about $394,375 at a $0.16/ADA reference rate, with no contingency.
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal is a reduced resubmission from a prior ₳8,503,000 12-month proposal, with FTE reduced from 8.25 to 2.25 and L1 node, full L2 integration, and broad formal verification removed from scope.
- missing: Independent evidence for: Scalus is an established open-source Cardano development platform built by Lantr Engineering over three years of continuous delivery.
- missing: Independent evidence for: Delivery is proposed to be milestone-based and administered through audited SundaeSwap treasury contracts with an independent oversight board and third-party assurance.
- missing: Independent evidence for: Dijkstra hard fork readiness is claimed to be needed because Plutus V4 support, nested transactions, guard script types, and accounts affect smart contract development, Plutus evaluation, transaction building, ledger rules, testing, and workflows.
- missing: Independent evidence for: Lantr Engineering states that every prior Scalus milestone was delivered on time and commits to public reporting, open community sessions, and on-time milestone delivery for treasury-funded work.
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
- finding: Requested ADA: 2.46M ADA
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
- finding: Strongest YES: the proposal substantiates "Scalus components are reused inside MeshJS, Evolution SDK, Lucid Evolution, Cardano Client Lib, and YaciDevKit." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "Scalus is an established open-source Cardano development platform built by Lantr Engineering over three years of continuous delivery." — so cost or precedent may outweigh the benefit.
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
- Treasury analysis: Requested ADA: 2.46M ADA
- Risk review: Execution risk: unknown
- Counterargument pass: Strongest YES: the proposal substantiates "Scalus components are reused inside MeshJS, Evolution SDK, Lucid Evolution, Cardano Client Lib, and YaciDevKit." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- Doctrine-aware reasoning layer nudged the score by -0.030 (clamped to ±0.05): The extracted claims show plausible public-benefit infrastructure and some independently checkable adoption claims, but the deterministic assessment is blocked for missing budget, feasibility, risk, alternatives, and failure-mode analysis. Under a large treasury withdrawal, the evidence gaps justify a small cautionary nudge rather than a positive adjustment.
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
- Claims and evidence missing: Independent evidence for: Scalus is an established open-source Cardano development platform built by Lantr Engineering over three years of continuous delivery.
- Claims and evidence missing: Independent evidence for: Delivery is proposed to be milestone-based and administered through audited SundaeSwap treasury contracts with an independent oversight board and third-party assurance.
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
- input_hash: `04c7a41029d8308c2728e2c6fc8a6aff5331d281488f8e93d5b946d003ac1148`
- snapshot_bundle_hash: `ca5f0c9783e5136074de0a3201d3098ac2e7d0bd7144cafbff96b53e7529ade0`
- soul_commit: `8e5afeb10af64d4e1c9708d4029f95043c3f5354`
- soul_text_hash: `a8c48e8e59534bbaa71af9a923ef942aa2cda51cb9e259331cef24e0da27ae10`
- resource_registry_commit: `7d671706a9a739988611151bb93ebc1eebba6851`
- resources_used: `gov_actions_api, gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents`
- snapshot_age_seconds: `650`
- uncertainty_band: `HIGH`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.1914, "NO": 0.7642, "YES": 0.0443}`
