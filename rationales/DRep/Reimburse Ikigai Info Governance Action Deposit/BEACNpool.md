<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/8b1eaed5984013b98431057a.md -->
# BEACNpool

**Proposal:** Reimburse Ikigai Info Governance Action Deposit
**Vote:** No
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: 7d37220b71806410cc8adfbdafbad494e1ce3fdc674ab13c88a72b3b27de78d9#0
Recommendation: **NO**
Score: `-0.25` (binding treasury composite; advisory raw signal `-0.25`; LLM lean `+0.0` recorded, not added) | Confidence: `0.7525` | Readiness: `0.75`
> Reasoning layer (precomputed): The deterministic assessment already captures that the review is incomplete and the claims evidence is thin; under BEACN doctrine, missing independently verified diligence should remain a needs-more-info state rather than becoming a directional penalty.

## Plain-language explanation (deterministic-heuristic)
BEACN records NO on Reimburse Ikigai Info Governance Action Deposit. On the evidence available to BEACN's published review, the request does not clear the bar for spending shared treasury funds.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: Reimburse the lost deposit for the Ikigai Info governance action, plus claimed missed staking rewards. It asks the treasury for 103000 ADA. The strongest grounded claim is: An Info governance action titled "Cardanoの生きがい - Ikigai -" was submitted in September 2024 as a symbolic action thanking contributors and expressing hope for Cardano's future.

A material claim remains proposer-asserted or thinly supported: The proposer says a Cardano node bug allowed an unregistered stake key to be used, preventing the submitter from recovering a 100000 ADA governance action deposit.

## Review Tree
- overall_status: `incomplete`

### Intake
- status: `complete`
- finding: Action type: TreasuryWithdrawals
- finding: Status: active
- finding: Proposed epoch: 649
- finding: Expires after epoch: 656
- finding: Treasury request: 103.0k ADA
- finding: Anchor pinned locally: yes
- conclusion: Baseline fields and source anchors establish whether the proposal can be reviewed at all.

### Claims and evidence
- status: `thin`
- finding: Proposal anchor: pinned and replayable
- finding: Proposal document read by reasoning layer: yes
- finding: Snapshot freshness source: deep_research_dossiers.csv
- finding: Deep research dossier: complete
- finding: Requested: Reimburse the lost deposit for the Ikigai Info governance action, plus claimed missed staking rewards.
- finding: Recipient: Ikigai Info governance action submitter; exact recipient address not stated in document
- finding: Stated amount: 103000
- finding: Deliverables: Immediate on-chain treasury distribution to the intended recipient upon enactment
- finding: Deadline/expiry: not stated in document
- finding: Claim (governance, independently_verifiable, medium materiality): An Info governance action titled "Cardanoの生きがい - Ikigai -" was submitted in September 2024 as a symbolic action thanking contributors and expressing hope for Cardano's future.
- finding: Claim (technical, proposer_asserted, high materiality): The proposer says a Cardano node bug allowed an unregistered stake key to be used, preventing the submitter from recovering a 100000 ADA governance action deposit.
- finding: Claim (governance, proposer_asserted, medium materiality): The proposer says there was significant community sentiment at the time that the Ikigai deposit should be reimbursed.
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal requests 103000 ADA, consisting of the original 100000 ADA deposit plus 3000 ADA for missed staking rewards at 2% per annum.
- finding: Claim (economic, proposer_asserted, medium materiality): The proposer states the withdrawal has no associated costs or expenses beyond the reimbursement amount.
- finding: Claim (economic, proposer_asserted, medium materiality): The proposer states there are no circumstances under which the withdrawal would be refunded to the Cardano Treasury.
- missing: Independent evidence for: The proposer says a Cardano node bug allowed an unregistered stake key to be used, preventing the submitter from recovering a 100000 ADA governance action deposit.
- missing: Independent evidence for: The proposer says there was significant community sentiment at the time that the Ikigai deposit should be reimbursed.
- missing: Independent evidence for: The proposer states the withdrawal has no associated costs or expenses beyond the reimbursement amount.
- missing: Independent evidence for: The proposer states there are no circumstances under which the withdrawal would be refunded to the Cardano Treasury.
- conclusion: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.

### Treasury analysis
- status: `complete`
- finding: Requested ADA: 103000
- finding: Budget granularity: confirmed
- finding: Milestone payment gates: not confirmed
- finding: Clawback/refund path: not confirmed
- finding: Cost/benefit clarity: unknown
- finding: Recurring funding dependency: not confirmed
- finding: Six-month treasury flow regime: unsustainable (basis: total inflow (tau + donations) vs enacted withdrawals)
- finding: Financial confidence: 0.62
- missing: milestone-gated disbursement
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
- finding: Rollback/remedy path: not confirmed
- finding: Flag count: 2
- missing: independent assurance
- missing: rollback/remedy path
- missing: dependency map
- conclusion: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.

### Counterargument pass
- status: `complete`
- finding: Strongest YES: the proposal substantiates "An Info governance action titled "Cardanoの生きがい - Ikigai -" was submitted in September 2024 as a symbolic action thanking contributors and expressing hope for Cardano's future." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "The proposer says a Cardano node bug allowed an unregistered stake key to be used, preventing the submitter from recovering a 100000 ADA governance action deposit." — so cost or precedent may outweigh the benefit.
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
- Treasury profile: one-time reimbursement — milestone-gating expectations do not apply.
- Flag score present (3), reducing confidence.
- Intake: Action type: TreasuryWithdrawals
- Claims and evidence: Proposal anchor: pinned and replayable
- Treasury analysis: Requested ADA: 103000
- Risk review: Execution risk: unknown
- Counterargument pass: Strongest YES: the proposal substantiates "An Info governance action titled "Cardanoの生きがい - Ikigai -" was submitted in September 2024 as a symbolic action thanking contributors and expressing hope for Cardano's future." and clears the evidence gates.
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
- Treasury flow signal is in unsustainable regime, ratio 2.14 (total inflow (tau + donations) vs enacted withdrawals); advisory penalty applied.
- DRep ratification support is below threshold; this is not treated as active opposition.
- Claims and evidence missing: Independent evidence for: The proposer says a Cardano node bug allowed an unregistered stake key to be used, preventing the submitter from recovering a 100000 ADA governance action deposit.
- Claims and evidence missing: Independent evidence for: The proposer says there was significant community sentiment at the time that the Ikigai deposit should be reimbursed.
- Claims and evidence status is thin.
- Treasury analysis missing: milestone-gated disbursement
- Treasury analysis missing: sustainability path
- Risk review missing: independent assurance
- Risk review missing: rollback/remedy path

## Reproducibility
- input_hash: `da996962812726b5cbe88331d9004c2fc913ed07dddd6d186525e18ec4dbcf8e`
- snapshot_bundle_hash: `7f21f810c929dfca44bd2216f5e112e7b213e202c4f5ff27f1d7b10a71666fcb`
- soul_commit: `c813ed97f64dba61150d01964327553baf720d38`
- soul_text_hash: `fa491ed711b9834e5a3c72d35903cec18afe8d93e1262f42ffcb20f5fce2c276`
- resource_registry_commit: `7532f2d0da41a7116f5a6d587dedd0b18bd03c80`
- resources_used: `gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents, deep_research_dossiers, ecosystem_value_profiles, treasury_policy_state, treasury_portfolio, governance_outcomes, protocol_readiness_profiles`
- snapshot_age_seconds: `0`
- uncertainty_band: `MEDIUM`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.2143, "NO": 0.7382, "YES": 0.0474}`
