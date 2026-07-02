<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/ce0ec646aafd3b4100ec8ddb.md -->
# BEACNpool

**Proposal:** Withdraw 540,750 ada for by TxPipe Dolos Maintaining Cardano's Lightweight D
**Vote:** No
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8sztttste
Recommendation: **NO**
Score: `-0.3133` (raw `-0.2833` + doctrine-LLM nudge `-0.03`) | Confidence: `0.8333` | Readiness: `0.0`
> Reasoning layer (precomputed): The claims include some checkable governance and open-source evidence, but the deterministic assessment reports missing budget, feasibility, risk, alternatives, and failure-mode analysis for a treasury withdrawal, so the doctrine's treasury stewardship and evidence-quality priorities justify a small cautionary nudge rather than a positive adjustment.

## Plain-language explanation (codex-offline-review)
BEACN records NO on Withdraw 540,750 ada for by TxPipe Dolos: Maintaining Cardano's Lightweight D.... The decisive concern is that the proposal's risks, precedent, or evidence gaps outweigh the case presented.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: Fund Year 2 maintenance of Dolos, a lightweight Cardano data node, including maintenance, community support, and AI-friendly documentation/integration resources.. The recorded treasury amount is 540,750. The strongest grounded claim is: The proposal requests 540,750 ADA total, consisting of 525,000 ADA for Dolos maintenance and enhancement and a 15,750 ADA Intersect budget administration fee.

A material weak point is that this claim remains proposer-asserted or thinly supported: The document claims Dolos aligns with Intersect Strategic Pillar 2, focus area A.3 Developer Experience, by maintaining open-source Cardano infrastructure. The blocking questions are: missing complete proposal summary; missing budget analysis; missing feasibility assessment.

## Review Tree
- overall_status: `blocked`

### Intake
- status: `complete`
- finding: Action type: TreasuryWithdrawals
- finding: Status: active
- finding: Proposed epoch: 638
- finding: Expires after epoch: 645
- finding: Treasury request: 540.8k ADA
- finding: Anchor pinned locally: yes
- conclusion: Baseline fields and source anchors establish whether the proposal can be reviewed at all.

### Claims and evidence
- status: `thin`
- finding: Proposal anchor: pinned and replayable
- finding: Proposal document read by reasoning layer: yes
- finding: Snapshot freshness source: manifest
- finding: Deep research dossier: required
- finding: Requested: Fund Year 2 maintenance of Dolos, a lightweight Cardano data node, including maintenance, community support, and AI-friendly documentation/integration resources.
- finding: Recipient: Intersect on behalf of TxPipe / Dolos vendor; withdrawal reward address stake1784sdxt6jjennmstphgdu7l7c2scf5d02a6cve2dgn5s2kq5u3j9v
- finding: Stated amount: 540,750
- finding: Deliverables: Part-time maintainer for Dolos over 12 months, Dependency updates, Cardano protocol compatibility, performance improvements, bug fixing, and documentation, Issue triage, review of external contributions, ecosystem-feedback-driven enhancements, and public communication, AI-friendly documentation and integration resources, Milestone-based disbursement controls through Intersect treasury management smart contracts
- finding: Deadline/expiry: 12 months; new grant period begins after closure of the existing contract
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal requests 540,750 ADA total, consisting of 525,000 ADA for Dolos maintenance and enhancement and a 15,750 ADA Intersect budget administration fee.
- finding: Claim (economic, supported_in_proposal, high materiality): The motivation states the funding covers 420,000 ADA plus a 105,000 ADA contingency reserve for a part-time Dolos maintainer over 12 months at an annual rate of $105,000 USD.
- finding: Claim (technical, supported_in_proposal, high materiality): Dolos is described as a Rust-based lightweight Cardano data node that indexes ledger primitives and exposes five query interfaces including Mini-Blockfrost, UTxO-RPC, Mini-Kupo, and an Ouroboros N2C Unix socket.
- finding: Claim (adoption, independently_verifiable, medium materiality): The document claims Dolos has 939 commits, 80 releases, 129 stars, 51 forks, and 27 contributors.
- finding: Claim (adoption, independently_verifiable, medium materiality): The proposal claims Dolos remains fully open-source and actively welcomes broader developer community contributions.
- finding: Claim (governance, proposer_asserted, medium materiality): The document claims Dolos aligns with Intersect Strategic Pillar 2, focus area A.3 Developer Experience, by maintaining open-source Cardano infrastructure.
- missing: Independent evidence for: The document claims Dolos aligns with Intersect Strategic Pillar 2, focus area A.3 Developer Experience, by maintaining open-source Cardano infrastructure.
- missing: Independent evidence for: The proposal states TxPipe has received 30 Project Catalyst proposals across Funds 9 through 14, with 26 delivered and 4 under development and on schedule, plus 2025 Intersect maintenance funding for Pallas, Dolos, and UTxO RPC that is being delivered on schedule.
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
- finding: Requested ADA: 540.8k ADA
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
- finding: Strongest YES: the proposal substantiates "The proposal requests 540,750 ADA total, consisting of 525,000 ADA for Dolos maintenance and enhancement and a 15,750 ADA Intersect budget administration fee." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "The document claims Dolos aligns with Intersect Strategic Pillar 2, focus area A.3 Developer Experience, by maintaining open-source Cardano infrastructure." — so cost or precedent may outweigh the benefit.
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
- Treasury analysis: Requested ADA: 540.8k ADA
- Risk review: Execution risk: unknown
- Counterargument pass: Strongest YES: the proposal substantiates "The proposal requests 540,750 ADA total, consisting of 525,000 ADA for Dolos maintenance and enhancement and a 15,750 ADA Intersect budget administration fee." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- Doctrine-aware reasoning layer nudged the score by -0.030 (clamped to ±0.05): The claims include some checkable governance and open-source evidence, but the deterministic assessment reports missing budget, feasibility, risk, alternatives, and failure-mode analysis for a treasury withdrawal, so the doctrine's treasury stewardship and evidence-quality priorities justify a small cautionary nudge rather than a positive adjustment.
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
- Claims and evidence missing: Independent evidence for: The document claims Dolos aligns with Intersect Strategic Pillar 2, focus area A.3 Developer Experience, by maintaining open-source Cardano infrastructure.
- Claims and evidence missing: Independent evidence for: The proposal states TxPipe has received 30 Project Catalyst proposals across Funds 9 through 14, with 26 delivered and 4 under development and on schedule, plus 2025 Intersect maintenance funding for Pallas, Dolos, and UTxO RPC that is being delivered on schedule.
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
- input_hash: `fa4ce80921e5ccb5cf8177f81e9e238bda292650ae6a6541593bcd6423d3bd2e`
- snapshot_bundle_hash: `401e54e994a3452fc527dc92677d833f48efda0b4c08114b05d609101abcc209`
- soul_commit: `8e5afeb10af64d4e1c9708d4029f95043c3f5354`
- soul_text_hash: `a8c48e8e59534bbaa71af9a923ef942aa2cda51cb9e259331cef24e0da27ae10`
- resource_registry_commit: `7d671706a9a739988611151bb93ebc1eebba6851`
- resources_used: `gov_actions_api, gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents`
- snapshot_age_seconds: `651`
- uncertainty_band: `HIGH`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.1914, "NO": 0.7642, "YES": 0.0443}`
