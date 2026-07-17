<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/3acbb91820a61a786b277c29.md -->
# BEACNpool

**Proposal:** Eternl Path to Sustainability - v2
**Vote:** Yes
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: fbb8d1a4a8d6b62f8cd706944a0582b884c2b90187b8fada7953d5c6a33eb5a7#0
Recommendation: **YES**
Score: `0.2055` (raw `-0.33` + doctrine-LLM nudge `-0.02`) | Confidence: `0.7414` | Readiness: `0.8`
> Reasoning layer (precomputed): The proposal describes a significant existing wallet operation, a concrete budget, and some treasury-protection mechanisms, but the deterministic assessment marks claims and evidence as thin and several high-materiality adoption, uptime, audit-independence, and repayment assumptions remain proposer-asserted rather than independently verified in the supplied claims. Under BEACN doctrine, plausible ecosystem benefit does not justify a positive nudge when treasury stewardship and evidence quality remain under-supported, so a small cautionary adjustment is warranted.

## Plain-language explanation (deterministic-heuristic)
BEACN records YES on Eternl: Path to Sustainability - v2. The deterministic gates found enough evidence and no decisive blocker.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: Treasury withdrawal to fund 12 months of Eternl operations, maintenance, improvements, infrastructure, support, administration, and audit/oversight activity. It asks the treasury for 2350000 ADA. The strongest grounded claim is: The proposal asks for ₳2,350,000 at about $0.1787 per Ada to cover approximately $420,000 of annual operating costs for 12 months.

A residual watch item: this claim remains proposer-asserted rather than independently shown: Eternl is a non-custodial Cardano light wallet for web, browser extension, Android, and iOS used for payments, staking, governance, and DApp interaction.

## Review Tree
- overall_status: `incomplete`

### Intake
- status: `complete`
- finding: Action type: TreasuryWithdrawals
- finding: Status: active
- finding: Proposed epoch: 637
- finding: Expires after epoch: 644
- finding: Treasury request: 2.35M ADA
- finding: Anchor pinned locally: yes
- conclusion: Baseline fields and source anchors establish whether the proposal can be reviewed at all.

### Claims and evidence
- status: `thin`
- finding: Proposal anchor: pinned and replayable
- finding: Proposal document read by reasoning layer: yes
- finding: Snapshot freshness source: deep_research_dossiers.csv
- finding: Deep research dossier: complete
- finding: Requested: Treasury withdrawal to fund 12 months of Eternl operations, maintenance, improvements, infrastructure, support, administration, and audit/oversight activity.
- finding: Recipient: Tastenkunst GmbH, Eternl
- finding: Stated amount: 2350000
- finding: Deliverables: Frontend maintenance and cross-platform development for browser extension, web/PWA, iOS, Android, and beta channels, Backend infrastructure and operations including multi-region servers, Cardano nodes, DBSync/indexers, application services, metadata aggregation, and monitoring, User support through Discord ticketing, Telegram, project support channels, wiki maintenance, and educational videos, Governance tooling enhancements including DRep dashboards, proposal browsers, in-wallet voting, and proposal creation, Eternl Core rewrite, Eternl Hub, enhanced hardware wallet support, enhanced wallet data export, and continued protocol/CIP compatibility work, Independent audits of treasury fund use in February 2027 and August 2027 plus public oversight metrics
- finding: Deadline/expiry: 12-month delivery period from August 2026 to July 2027
- finding: Claim (adoption, proposer_asserted, high materiality): Eternl is a non-custodial Cardano light wallet for web, browser extension, Android, and iOS used for payments, staking, governance, and DApp interaction.
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal asks for ₳2,350,000 at about $0.1787 per Ada to cover approximately $420,000 of annual operating costs for 12 months.
- finding: Claim (economic, supported_in_proposal, high materiality): The budget is allocated as ₳1,292,500 frontend, ₳587,500 backend, ₳117,500 support, ₳305,500 admin, and ₳47,000 audits.
- finding: Claim (economic, proposer_asserted, high materiality): Eternl will convert up to $420,000 worth of Ada into stablecoins in a public company wallet and return any Ada above that amount to the treasury.
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal funds 6.0 FTE distributed across 10 contributors at $70,000 per FTE.
- finding: Claim (adoption, proposer_asserted, high materiality): Eternl has about 100,000 browser extension installs and about 30,000 Android and iOS installs, and about 5,500 Pro users at $96 per year would cover the $420,000 annual cost.
- missing: Independent evidence for: Eternl is a non-custodial Cardano light wallet for web, browser extension, Android, and iOS used for payments, staking, governance, and DApp interaction.
- missing: Independent evidence for: Eternl will convert up to $420,000 worth of Ada into stablecoins in a public company wallet and return any Ada above that amount to the treasury.
- missing: Independent evidence for: Eternl has about 100,000 browser extension installs and about 30,000 Android and iOS installs, and about 5,500 Pro users at $96 per year would cover the $420,000 annual cost.
- missing: Independent evidence for: Independent audits by a party unaffiliated with Tastenkunst GmbH or the Eternl team are planned for February 2027 and August 2027 to review fund receipt, custody, conversion, spending, balances, Pro income relevant to repayment, and refunds or repayments.
- conclusion: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.

### Treasury analysis
- status: `complete`
- finding: Requested ADA: 2350000
- finding: Budget granularity: confirmed
- finding: Milestone payment gates: not confirmed
- finding: Clawback/refund path: confirmed
- finding: Cost/benefit clarity: unknown
- finding: Recurring funding dependency: confirmed
- finding: Six-month treasury flow regime: stressed (basis: total inflow (tau + donations) vs enacted withdrawals)
- finding: Financial confidence: 0.72
- missing: milestone-gated disbursement
- missing: cost-benefit clarity
- conclusion: Treasury votes require a higher bar because they consume shared ADA and create precedent.

### Risk review
- status: `complete`
- finding: Execution risk: unknown
- finding: Governance risk: medium
- finding: Technical risk: unknown
- finding: Treasury exposure risk: medium
- finding: Mitigation evidence: confirmed
- finding: Independent assurance: not confirmed
- finding: Rollback/remedy path: confirmed
- finding: Flag count: 2
- missing: independent assurance
- missing: dependency map
- conclusion: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.

### Counterargument pass
- status: `complete`
- finding: Strongest YES: the proposal substantiates "The proposal asks for ₳2,350,000 at about $0.1787 per Ada to cover approximately $420,000 of annual operating costs for 12 months." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "Eternl is a non-custodial Cardano light wallet for web, browser extension, Android, and iOS used for payments, staking, governance, and DApp interaction." — so cost or precedent may outweigh the benefit.
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
- Flag score present (3), reducing confidence.
- Intake: Action type: TreasuryWithdrawals
- Claims and evidence: Proposal anchor: pinned and replayable
- Treasury analysis: Requested ADA: 2350000
- Risk review: Execution risk: unknown
- Counterargument pass: Strongest YES: the proposal substantiates "The proposal asks for ₳2,350,000 at about $0.1787 per Ada to cover approximately $420,000 of annual operating costs for 12 months." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- DRep ratification support is material but below threshold; treated as a modest context signal.
- Advisory model lean was -0.020 (display cap ±0.05) and had zero influence on the binding score: The proposal describes a significant existing wallet operation, a concrete budget, and some treasury-protection mechanisms, but the deterministic assessment marks claims and evidence as thin and several high-materiality adoption, uptime, audit-independence, and repayment assumptions remain proposer-asserted rather than independently verified in the supplied claims. Under BEACN doctrine, plausible ecosystem benefit does not justify a positive nudge when treasury stewardship and evidence quality remain under-supported, so a small cautionary adjustment is warranted.
- Directional YES cleared ecosystem benefit, delivery, cost-efficiency, downside-protection, and portfolio-capacity floors.
- Intake: Baseline fields and source anchors establish whether the proposal can be reviewed at all.
- Claims and evidence: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.
- Treasury analysis: Treasury votes require a higher bar because they consume shared ADA and create precedent.
- Risk review: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.
- Counterargument pass: A defensible rationale must show the best opposing case before it reaches a vote.
- Synthesis: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Uncertainty
- Treasury flow signal is in stressed regime (total inflow (tau + donations) vs enacted withdrawals).
- No milestone-gated disbursement documented.
- Claims and evidence missing: Independent evidence for: Eternl is a non-custodial Cardano light wallet for web, browser extension, Android, and iOS used for payments, staking, governance, and DApp interaction.
- Claims and evidence missing: Independent evidence for: Eternl will convert up to $420,000 worth of Ada into stablecoins in a public company wallet and return any Ada above that amount to the treasury.
- Claims and evidence status is thin.
- Treasury analysis missing: milestone-gated disbursement
- Treasury analysis missing: cost-benefit clarity
- Risk review missing: independent assurance
- Risk review missing: dependency map

## Reproducibility
- input_hash: `cde679405104c3ba60fc123e2e43798e524c0886571b8b1e851ad88ed14a3689`
- snapshot_bundle_hash: `a0af960ea526b7e2cf53cc4a2adc1d385dfd0face955ff87d904de23f01c611c`
- soul_commit: `d866057afd0ecaf599eb0202220b1ec8339b9b09`
- soul_text_hash: `a8c48e8e59534bbaa71af9a923ef942aa2cda51cb9e259331cef24e0da27ae10`
- resource_registry_commit: `45e29dd06273ee8ec35264b00dafd2aa30667f62`
- resources_used: `gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents, deep_research_dossiers, ecosystem_value_profiles, treasury_policy_state, treasury_portfolio, governance_outcomes, protocol_readiness_profiles`
- snapshot_age_seconds: `2`
- uncertainty_band: `MEDIUM`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.2255, "NO": 0.0496, "YES": 0.7249}`
