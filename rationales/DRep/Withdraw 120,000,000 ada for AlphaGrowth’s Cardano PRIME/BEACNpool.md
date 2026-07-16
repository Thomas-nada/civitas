<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/509e939e05c452be5946d86d.md -->
# BEACNpool

**Proposal:** Withdraw 120,000,000 ada for AlphaGrowth’s Cardano PRIME
**Vote:** No
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: 529dccaadaa000746c22f1682574cb3f436eeba4d19710b90791a54226dc96d7#0
Recommendation: **NO**
Score: `-0.135` (binding treasury composite; advisory raw signal `-0.56`; LLM lean `-0.01` recorded, not added) | Confidence: `0.7837` | Readiness: `0.65`
> Reasoning layer (precomputed): The claims show meaningful governance controls and return mechanisms, but the treasury analysis is incomplete and several high-level ecosystem-need claims are asserted rather than evidenced in the anchor text; under the doctrine this supports only a very small cautionary nudge, not a directional override.

## Plain-language explanation (deterministic-heuristic)
BEACN records NO on Withdraw 120,000,000 ada for AlphaGrowth’s Cardano PRIME. On the evidence available to BEACN's published review, the request does not clear the bar for spending shared treasury funds.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: Treasury withdrawal to fund AlphaGrowth's Cardano PRIME, a 12-month community-overseen program for DeFi readiness, incentives, and durable liquidity growth across Cardano markets. It asks the treasury for 120,000,000 ADA. The strongest grounded claim is: Cardano PRIME is described as a 12-month community-overseen program to improve DeFi protocol readiness, activate incentives responsibly, and grow durable liquidity across Cardano markets.

A material claim remains proposer-asserted or thinly supported: The proposal states that as of June 2026 Cardano DeFi has approximately $90 million in TVL and $45 million in stablecoin supply.

## Review Tree
- overall_status: `incomplete`

### Intake
- status: `complete`
- finding: Action type: TreasuryWithdrawals
- finding: Status: active
- finding: Proposed epoch: 642
- finding: Expires after epoch: 649
- finding: Treasury request: 120.00M ADA
- finding: Anchor pinned locally: yes
- conclusion: Baseline fields and source anchors establish whether the proposal can be reviewed at all.

### Claims and evidence
- status: `thin`
- finding: Proposal anchor: pinned and replayable
- finding: Proposal document read by reasoning layer: yes
- finding: Snapshot freshness source: deep_research_dossiers.csv
- finding: Deep research dossier: complete
- finding: Requested: Treasury withdrawal to fund AlphaGrowth's Cardano PRIME, a 12-month community-overseen program for DeFi readiness, incentives, and durable liquidity growth across Cardano markets.
- finding: Recipient: 2026 Treasury Reserve Smart Contract stake address stake1784sdxt6jjennmstphgdu7l7c2scf5d02a6cve2dgn5s2kq5u3j9v; Intersect is stated to manage the withdrawn funds directly.
- finding: Stated amount: 120,000,000
- finding: Deliverables: Phase 1 public current-state audit, Phase 2 identification of integration, product, and ecosystem-support gaps, Phase 3 deployment of incentives and capital after Operating Group affirmation of the release plan, Published recommendations and disbursement records, Quarterly financial and ecosystem impact metrics reporting, Independent audit or assurance allocation of 2,000,000 ada, Return-to-treasury triggers for unused, unearned, unreleased, or excess funds
- finding: Deadline/expiry: 12 months
- finding: Claim (adoption, supported_in_proposal, high materiality): Cardano PRIME is described as a 12-month community-overseen program to improve DeFi protocol readiness, activate incentives responsibly, and grow durable liquidity across Cardano markets.
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal requests 120,000,000 ada, with USD figures included only as planning references using a $0.16 per ADA assumption.
- finding: Claim (governance, supported_in_proposal, high materiality): Intersect will act as Constitutional Administrator, manage the withdrawn funds directly, and use a separate auditable account for program funds.
- finding: Claim (governance, supported_in_proposal, high materiality): Program funds are to be released through milestone-gated and action-gated processes, including a Month 4 Phase 3 release gate and Operating Group review with veto or conditioning power over material actions.
- finding: Claim (economic, supported_in_proposal, high materiality): The withdrawal is conditional on an applicable Net Change Limit under TREASURY-01a having enough remaining capacity to cover the withdrawal in full at enactment.
- finding: Claim (adoption, proposer_asserted, medium materiality): The proposal states that as of June 2026 Cardano DeFi has approximately $90 million in TVL and $45 million in stablecoin supply.
- missing: Independent evidence for: The proposal states that as of June 2026 Cardano DeFi has approximately $90 million in TVL and $45 million in stablecoin supply.
- missing: Independent evidence for: The proposal states that Cardano's infrastructure progress through USDCx, LayerZero, Pyth, Dune, and other additions has not yet converted into enough durable DeFi liquidity, application depth, LP participation, or institutional awareness.
- missing: Independent evidence for: AlphaGrowth has not received Cardano Treasury funding within the prior 24 months.
- conclusion: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.

### Treasury analysis
- status: `complete`
- finding: Requested ADA: 120000000
- finding: Budget granularity: not confirmed
- finding: Milestone payment gates: confirmed
- finding: Clawback/refund path: confirmed
- finding: Cost/benefit clarity: unknown
- finding: Recurring funding dependency: unknown
- finding: Six-month treasury flow regime: stressed (basis: total inflow (tau + donations) vs enacted withdrawals)
- finding: Financial confidence: 0.58
- missing: line-item budget
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
- finding: Rollback/remedy path: confirmed
- finding: Flag count: 0
- missing: independent assurance
- missing: dependency map
- conclusion: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.

### Counterargument pass
- status: `complete`
- finding: Strongest YES: the proposal substantiates "Cardano PRIME is described as a 12-month community-overseen program to improve DeFi protocol readiness, activate incentives responsibly, and grow durable liquidity across Cardano markets." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "The proposal states that as of June 2026 Cardano DeFi has approximately $90 million in TVL and $45 million in stablecoin supply." — so cost or precedent may outweigh the benefit.
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
- Treasury analysis: Requested ADA: 120000000
- Risk review: Execution risk: unknown
- Counterargument pass: Strongest YES: the proposal substantiates "Cardano PRIME is described as a 12-month community-overseen program to improve DeFi protocol readiness, activate incentives responsibly, and grow durable liquidity across Cardano markets." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- Advisory model lean was -0.010 (display cap ±0.05) and had zero influence on the binding score: The claims show meaningful governance controls and return mechanisms, but the treasury analysis is incomplete and several high-level ecosystem-need claims are asserted rather than evidenced in the anchor text; under the doctrine this supports only a very small cautionary nudge, not a directional override.
- Directional NO is supported by affirmative independent evidence of waste, duplication, excessive cost, or failed delivery — not by missing information.
- Intake: Baseline fields and source anchors establish whether the proposal can be reviewed at all.
- Claims and evidence: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.
- Treasury analysis: Treasury votes require a higher bar because they consume shared ADA and create precedent.
- Risk review: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.
- Counterargument pass: A defensible rationale must show the best opposing case before it reaches a vote.
- Synthesis: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Uncertainty
- Treasury flow signal is in stressed regime (total inflow (tau + donations) vs enacted withdrawals).
- Proposal requests over 50% of rolling available capacity.
- No DRep distribution available.
- Claims and evidence missing: Independent evidence for: The proposal states that as of June 2026 Cardano DeFi has approximately $90 million in TVL and $45 million in stablecoin supply.
- Claims and evidence missing: Independent evidence for: The proposal states that Cardano's infrastructure progress through USDCx, LayerZero, Pyth, Dune, and other additions has not yet converted into enough durable DeFi liquidity, application depth, LP participation, or institutional awareness.
- Claims and evidence status is thin.
- Treasury analysis missing: line-item budget
- Treasury analysis missing: sustainability path
- Risk review missing: independent assurance
- Risk review missing: dependency map

## Reproducibility
- input_hash: `a48564851aca797afd3cdc70e052326bad47af7618015daa28b42b0eef86837e`
- snapshot_bundle_hash: `4ee540b81bc814fa441637eb58ebaaadf0dfa4eab429a5703fb1c81de0b8adf2`
- soul_commit: `c813ed97f64dba61150d01964327553baf720d38`
- soul_text_hash: `fa491ed711b9834e5a3c72d35903cec18afe8d93e1262f42ffcb20f5fce2c276`
- resource_registry_commit: `3e3c343fc0dd14a03a92aad1216ba6620b3d0185`
- resources_used: `gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents, deep_research_dossiers, ecosystem_value_profiles, treasury_policy_state, treasury_portfolio, governance_outcomes, protocol_readiness_profiles`
- snapshot_age_seconds: `0`
- uncertainty_band: `MEDIUM`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.222, "NO": 0.6709, "YES": 0.107}`
