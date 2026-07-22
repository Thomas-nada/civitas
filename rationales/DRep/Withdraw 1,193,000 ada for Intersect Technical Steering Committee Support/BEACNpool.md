<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/9dad321021955d045e79c767.md -->
# BEACNpool

**Proposal:** Withdraw 1,193,000 ada for Intersect Technical Steering Committee Support
**Vote:** Yes
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: b3d452bff7769d7f557ec6b8974760ee6c5e496c276652b654032966621e0ccf#3
Recommendation: **YES**
Score: `0.189` (raw `-0.08` + doctrine-LLM nudge `+0.02`) | Confidence: `0.7672` | Readiness: `0.85`
> Reasoning layer (precomputed): A small positive adjustment is justified because the extracted claims show a detailed work-package budget, explicit governance and treasury-control mechanisms, independently checkable budget-process and smart-contract references, and alignment with technical governance and DRep decision support. The nudge remains small because some important stewardship claims, including full expenditure accounting and return of unspent funds, are commitments rather than already evidenced outcomes.

## Plain-language explanation (deterministic-heuristic)
BEACN records YES on Withdraw 1,193,000 ada for Intersect Technical Steering Committee Support. The deterministic gates found enough evidence and no decisive blocker.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: Treasury withdrawal to fund Intersect Technical Steering Committee support for 12 months across community engagement, protocol governance, and independent technical review. It asks the treasury for 1,193,000 ADA. The strongest grounded claim is: The proposal requests $298,250, stated as 1,193,000 ADA, to support Technical Steering Committee activities for 12 months.

A residual watch item: this claim remains proposer-asserted rather than independently shown: Technical workshops, the Security Council, and the Bug Bounty Programme are funded separately through the main Intersect budget and are not included in this request.

## Review Tree
- overall_status: `incomplete`

### Intake
- status: `complete`
- finding: Action type: TreasuryWithdrawals
- finding: Status: active
- finding: Proposed epoch: 638
- finding: Expires after epoch: 645
- finding: Treasury request: 1.19M ADA
- finding: Anchor pinned locally: yes
- conclusion: Baseline fields and source anchors establish whether the proposal can be reviewed at all.

### Claims and evidence
- status: `thin`
- finding: Proposal anchor: pinned and replayable
- finding: Proposal document read by reasoning layer: yes
- finding: Snapshot freshness source: deep_research_dossiers.csv
- finding: Deep research dossier: complete
- finding: Requested: Treasury withdrawal to fund Intersect Technical Steering Committee support for 12 months across community engagement, protocol governance, and independent technical review.
- finding: Recipient: Intersect Treasury Reserve Smart Contract stake address stake1784sdxt6jjennmstphgdu7l7c2scf5d02a6cve2dgn5s2kq5u3j9v, submitted by Intersect on behalf of the vendor.
- finding: Stated amount: 1,193,000
- finding: Deliverables: WP 1: Community-Facing Technical Coordination for 256,000 ADA, including expert attendance at ecosystem events and commissioned technical reports., WP 2: Protocol Governance and Evolution for 832,000 ADA, including support for the Parameter Committee, CIP editors, and Hard Fork Working Group., WP 3: Technical Review for 105,000 ADA, including establishment of a pilot independent technical review programme launching in 2027.
- finding: Deadline/expiry: 12 months; pilot independent technical review programme launching in 2027
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal requests $298,250, stated as 1,193,000 ADA, to support Technical Steering Committee activities for 12 months.
- finding: Claim (adoption, supported_in_proposal, medium materiality): WP 1 funds attendance of technical experts at major ecosystem events and commissioning of technical reports.
- finding: Claim (technical, supported_in_proposal, high materiality): WP 2 funds the Parameter Committee, CIP editors, and Hard Fork Working Group.
- finding: Claim (governance, supported_in_proposal, high materiality): WP 3 funds establishment of a pilot independent technical review programme launching in 2027 with conflict-of-interest provisions, published recusals, and open reviewer selection against documented criteria.
- finding: Claim (economic, proposer_asserted, medium materiality): Technical workshops, the Security Council, and the Bug Bounty Programme are funded separately through the main Intersect budget and are not included in this request.
- finding: Claim (economic, proposer_asserted, high materiality): All expenditure will be fully accounted for and any unspent funds returned to the Cardano treasury.
- missing: Independent evidence for: Technical workshops, the Security Council, and the Bug Bounty Programme are funded separately through the main Intersect budget and are not included in this request.
- missing: Independent evidence for: All expenditure will be fully accounted for and any unspent funds returned to the Cardano treasury.
- conclusion: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.

### Treasury analysis
- status: `complete`
- finding: Requested ADA: 1193000
- finding: Budget granularity: confirmed
- finding: Milestone payment gates: confirmed
- finding: Clawback/refund path: unknown
- finding: Cost/benefit clarity: unknown
- finding: Recurring funding dependency: unknown
- finding: Six-month treasury flow regime: stressed (basis: total inflow (tau + donations) vs enacted withdrawals)
- finding: Financial confidence: 0.55
- missing: sustainability path
- missing: cost-benefit clarity
- conclusion: Treasury votes require a higher bar because they consume shared ADA and create precedent.

### Risk review
- status: `complete`
- finding: Execution risk: unknown
- finding: Governance risk: unknown
- finding: Technical risk: unknown
- finding: Treasury exposure risk: unknown
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
- finding: Strongest YES: the proposal substantiates "The proposal requests $298,250, stated as 1,193,000 ADA, to support Technical Steering Committee activities for 12 months." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "Technical workshops, the Security Council, and the Bug Bounty Programme are funded separately through the main Intersect budget and are not included in this request." — so cost or precedent may outweigh the benefit.
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
- Treasury analysis: Requested ADA: 1193000
- Risk review: Execution risk: unknown
- Counterargument pass: Strongest YES: the proposal substantiates "The proposal requests $298,250, stated as 1,193,000 ADA, to support Technical Steering Committee activities for 12 months." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- DRep ratification support is material but below threshold; treated as a modest context signal.
- Advisory model lean was +0.020 (display cap ±0.05) and had zero influence on the binding score: A small positive adjustment is justified because the extracted claims show a detailed work-package budget, explicit governance and treasury-control mechanisms, independently checkable budget-process and smart-contract references, and alignment with technical governance and DRep decision support. The nudge remains small because some important stewardship claims, including full expenditure accounting and return of unspent funds, are commitments rather than already evidenced outcomes.
- Directional YES cleared ecosystem benefit, delivery, cost-efficiency, downside-protection, and portfolio-capacity floors.
- Intake: Baseline fields and source anchors establish whether the proposal can be reviewed at all.
- Claims and evidence: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.
- Treasury analysis: Treasury votes require a higher bar because they consume shared ADA and create precedent.
- Risk review: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.
- Counterargument pass: A defensible rationale must show the best opposing case before it reaches a vote.
- Synthesis: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Uncertainty
- Treasury flow signal is in stressed regime (total inflow (tau + donations) vs enacted withdrawals).
- Claims and evidence missing: Independent evidence for: Technical workshops, the Security Council, and the Bug Bounty Programme are funded separately through the main Intersect budget and are not included in this request.
- Claims and evidence missing: Independent evidence for: All expenditure will be fully accounted for and any unspent funds returned to the Cardano treasury.
- Claims and evidence status is thin.
- Treasury analysis missing: sustainability path
- Treasury analysis missing: cost-benefit clarity
- Risk review missing: independent assurance
- Risk review missing: rollback/remedy path

## Reproducibility
- input_hash: `2130fbef6c33109b1d2e9e4ad8a697d1f1466981450dea685bb02f97a0c2354a`
- snapshot_bundle_hash: `523ff43d2dbc5b3ad872fba00e8205788f2622cb2dad6e6e56012137c9412a70`
- soul_commit: `d866057afd0ecaf599eb0202220b1ec8339b9b09`
- soul_text_hash: `a8c48e8e59534bbaa71af9a923ef942aa2cda51cb9e259331cef24e0da27ae10`
- resource_registry_commit: `d43566c2ec38caf2768100e67762e66da78895a8`
- resources_used: `gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents, deep_research_dossiers, ecosystem_value_profiles, treasury_policy_state, treasury_portfolio, governance_outcomes, protocol_readiness_profiles`
- snapshot_age_seconds: `6`
- uncertainty_band: `MEDIUM`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.2241, "NO": 0.0551, "YES": 0.7208}`
