<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/a2b77737b860580d634684d1.md -->
# BEACNpool

**Proposal:** Reimburse Ikigai Info Governance Action Deposit
**Vote:** Abstain
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: 7d37220b71806410cc8adfbdafbad494e1ce3fdc674ab13c88a72b3b27de78d9#0
Recommendation: **ABSTAIN**
Score: `0.0` (binding treasury composite; advisory raw signal `0.0`; LLM lean `+0.0` recorded, not added) | Confidence: `0.1` | Readiness: `0`


## Plain-language explanation (deterministic-heuristic)
BEACN records ABSTAIN on Reimburse Ikigai Info Governance Action Deposit. This is a conservative abstention because the evidence does not justify stronger certainty.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: Reimburse Ikigai Info Governance Action Deposit. The strongest grounded claim is: In September 2024, only weeks after the Chang hard fork to introduce on-chain governance, an Info governance action titled Cardanoの生きがい - Ikigai - was submitted.

A material claim remains proposer-asserted or thinly supported: There was significant sentiment at the time that the Ikigai Info governance action deposit should be reimbursed. Open blockers: treasury_amount_lovelace is missing, zero, or non-positive for a treasury withdrawal (backfill via beacn-drep-resources/scripts/backfill_treasury_amounts.py). BEACN's own independent diligence is also incomplete — before this vote could move to YES, BEACN's published review still needs complete proposal summary; budget analysis; feasibility assessment. Reason code: MISSING_BASELINE_EVIDENCE.

## Review Tree
- overall_status: `blocked`

### Intake
- status: `blocked`
- finding: Action type: TreasuryWithdrawals
- finding: Status: active
- finding: Proposed epoch: 649
- finding: Expires after epoch: 656
- finding: Treasury request: not specified
- finding: Anchor pinned locally: yes
- missing: treasury_amount_lovelace is missing, zero, or non-positive for a treasury withdrawal (backfill via beacn-drep-resources/scripts/backfill_treasury_amounts.py)
- conclusion: Baseline fields and source anchors establish whether the proposal can be reviewed at all.

### Claims and evidence
- status: `thin`
- finding: Proposal anchor: pinned and replayable
- finding: Proposal document read by reasoning layer: yes
- finding: Snapshot freshness source: deep_research_dossiers.csv
- finding: Deep research dossier: required
- finding: Requested: Reimburse Ikigai Info Governance Action Deposit.
- finding: Recipient: 
- finding: Stated amount: not stated in document
- finding: Deliverables: In September 2024, only weeks after the Chang hard fork to introduce on-chain governance, an Info governance action titled Cardanoの生きがい - Ikigai - was submitted., This was only a symbolic governance action, as it simply asked the community whether they agreed with a statement thanking those that helped get Cardano to this point and expressing a sense of hope for the future., Unfortunately, due to a bug in the code of the Cardano node that permitted an unregistered stake key to be used in the governance action, the submitter was unable to recover their deposit of 100K ADA., While the community expressed at the time the importance of reimbursing this deposit via a treasury withdrawal; once the ability to do so became available, following the Plomin hard fork; unfortunately none of the entity based budget submissions included it.
- finding: Deadline/expiry: not stated in document
- finding: Claim (economic, independently_verifiable, high materiality): In September 2024, only weeks after the Chang hard fork to introduce on-chain governance, an Info governance action titled Cardanoの生きがい - Ikigai - was submitted.
- finding: Claim (economic, supported_in_proposal, medium materiality): This was only a symbolic governance action, as it simply asked the community whether they agreed with a statement thanking those that helped get Cardano to this point and expressing a sense of hope for the future.
- finding: Claim (technical, supported_in_proposal, medium materiality): Unfortunately, due to a bug in the code of the Cardano node that permitted an unregistered stake key to be used in the governance action, the submitter was unable to recover their deposit of 100K ADA.
- finding: Claim (economic, supported_in_proposal, high materiality): While the community expressed at the time the importance of reimbursing this deposit via a treasury withdrawal; once the ability to do so became available, following the Plomin hard fork; unfortunately none of the entity based budget submissions included it.
- finding: Claim (economic, proposer_asserted, medium materiality): There was significant sentiment at the time that the Ikigai Info governance action deposit should be reimbursed.
- finding: Claim (economic, proposer_asserted, medium materiality): It was considered that the submitter should not lose one hundred thousand ADA, for being an early pioneer of Cardano governance.
- missing: Independent evidence for: There was significant sentiment at the time that the Ikigai Info governance action deposit should be reimbursed.
- missing: Independent evidence for: It was considered that the submitter should not lose one hundred thousand ADA, for being an early pioneer of Cardano governance.
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
- finding: Requested ADA: not specified
- finding: Budget granularity: unknown
- finding: Milestone payment gates: unknown
- finding: Clawback/refund path: unknown
- finding: Cost/benefit clarity: unknown
- finding: Recurring funding dependency: unknown
- finding: Six-month treasury flow regime: unsustainable (basis: total inflow (tau + donations) vs enacted withdrawals)
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
- finding: Strongest YES: the proposal substantiates "In September 2024, only weeks after the Chang hard fork to introduce on-chain governance, an Info governance action titled Cardanoの生きがい - Ikigai - was submitted." though 8 review blocker(s) remain open.
- finding: Strongest NO: a material claim is unsupported — "There was significant sentiment at the time that the Ikigai Info governance action deposit should be reimbursed." — so cost or precedent may outweigh the benefit.
- finding: Strongest hold: a treasury action without a complete deep-research dossier cannot be voted directionally without pretending certainty.
- conclusion: A defensible rationale must show the best opposing case before it reaches a vote.

### Synthesis
- status: `blocked`
- finding: Final vote must be derived from completed sections above, not from a prose summary.
- finding: The public rationale should name the decisive section and the strongest counterargument.
- missing: treasury_amount_lovelace is missing, zero, or non-positive for a treasury withdrawal (backfill via beacn-drep-resources/scripts/backfill_treasury_amounts.py)
- missing: missing complete proposal summary
- missing: missing budget analysis
- missing: missing feasibility assessment
- missing: missing risk analysis
- missing: missing alternatives analysis
- missing: missing failure-mode analysis
- missing: missing community impact analysis
- conclusion: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Facts
- Critical evidence fields are missing for this action.
- Intake: Action type: TreasuryWithdrawals
- Claims and evidence: Proposal anchor: pinned and replayable
- Treasury analysis: Requested ADA: not specified
- Risk review: Execution risk: unknown
- Counterargument pass: Strongest YES: the proposal substantiates "In September 2024, only weeks after the Chang hard fork to introduce on-chain governance, an Info governance action titled Cardanoの生きがい - Ikigai - was submitted." though 8 review blocker(s) remain open.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- Cannot produce a responsible recommendation without baseline evidence.
- Intake: Baseline fields and source anchors establish whether the proposal can be reviewed at all.
- Claims and evidence: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.
- Treasury analysis: Treasury votes require a higher bar because they consume shared ADA and create precedent.
- Risk review: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.
- Counterargument pass: A defensible rationale must show the best opposing case before it reaches a vote.
- Synthesis: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Uncertainty
- Missing: treasury_amount_lovelace is missing, zero, or non-positive for a treasury withdrawal (backfill via beacn-drep-resources/scripts/backfill_treasury_amounts.py)
- Intake missing: treasury_amount_lovelace is missing, zero, or non-positive for a treasury withdrawal (backfill via beacn-drep-resources/scripts/backfill_treasury_amounts.py)
- Intake status is blocked.
- Claims and evidence missing: Independent evidence for: There was significant sentiment at the time that the Ikigai Info governance action deposit should be reimbursed.
- Claims and evidence missing: Independent evidence for: It was considered that the submitter should not lose one hundred thousand ADA, for being an early pioneer of Cardano governance.
- Claims and evidence status is thin.
- Treasury analysis missing: line-item budget
- Treasury analysis missing: milestone-gated disbursement
- Treasury analysis status is incomplete.
- Risk review missing: mitigation evidence
- Risk review missing: independent assurance
- Risk review status is thin.
- Synthesis missing: treasury_amount_lovelace is missing, zero, or non-positive for a treasury withdrawal (backfill via beacn-drep-resources/scripts/backfill_treasury_amounts.py)

## Missing Evidence
- treasury_amount_lovelace is missing, zero, or non-positive for a treasury withdrawal (backfill via beacn-drep-resources/scripts/backfill_treasury_amounts.py)

## Reproducibility
- input_hash: `8a69762de047fd76e8513737db9a02ad99652b4068337b941653571ff3faed5a`
- snapshot_bundle_hash: `9deaa4dbd2d24e3aee2b67111206de2067b8959e9c759bd5373facc8006ab3d7`
- soul_commit: `c813ed97f64dba61150d01964327553baf720d38`
- soul_text_hash: `fa491ed711b9834e5a3c72d35903cec18afe8d93e1262f42ffcb20f5fce2c276`
- resource_registry_commit: `eebee129fad1bcd2cf354cc1a043b52431332ba6`
- resources_used: `gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents, deep_research_dossiers, ecosystem_value_profiles, treasury_policy_state, treasury_portfolio, governance_outcomes, protocol_readiness_profiles`
- snapshot_age_seconds: `0`
- uncertainty_band: `LOW`
- evidence_depth_score: `3`
- decision_probs: `{"ABSTAIN": 0.345, "NO": 0.3275, "YES": 0.3275}`
