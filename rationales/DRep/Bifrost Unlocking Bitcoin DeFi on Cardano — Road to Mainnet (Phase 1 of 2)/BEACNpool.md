<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/ea66be6f21ecb082d87c2361.md -->
# BEACNpool

**Proposal:** Bifrost Unlocking Bitcoin DeFi on Cardano — Road to Mainnet (Phase 1 of 2)
**Vote:** No
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: gov_action1mlvplrdk2t7eyclqeca77ppmfq3sghkr5hdppjqhdqdd573r7q6qqms7jwt
Recommendation: **NO**
Score: `-0.4133` (raw `-0.3833` + doctrine-LLM nudge `-0.03`) | Confidence: `0.67` | Readiness: `0.8`
> Reasoning layer (precomputed): The proposal describes a potentially high-public-benefit infrastructure project, but the deterministic assessment marks claims and evidence as thin and treasury analysis as incomplete for a large treasury withdrawal; under BEACN's hierarchy, evidence quality and treasury stewardship warrant a small cautionary negative nudge beyond the mechanical score.

## Plain-language explanation (precomputed)
BEACN voted NO because this is a large treasury withdrawal with high execution risk, and key claims needed for confidence were not independently supported by the review evidence.

The proposal requested ₳12,332,031 for Phase 1 of Bifrost, a Bitcoin-Cardano bridge by FluidTokens and Lantr Engineering, running from July 2026 to March 2027. It aims to move from a working testnet toward launch readiness, including audits, formal verification, ecosystem readiness, stewardship design, economic foundations, and an audited Cardano mainnet bridge under controlled access. The proposer also stated that public rollout and 24 months of operations would come later in a Phase 2 proposal.

Several important claims were supported in the proposal itself: Bifrost is described as a permissionless Bitcoin-Cardano bridge secured by Cardano’s SPO ecosystem, the requested amount and timeline were clear, Catalyst Fund 14 support was identified, and the proposal stated there would be no bridge token, no founder allocation, open-source components, public reporting, and an independent stewardship structure to be determined. But other high-importance claims remained proposer-asserted rather than independently evidenced, including that the bridge is already on testnet with working peg-ins and peg-outs and participating SPOs, and that Phase 1 will end with an audited mainnet bridge in both federated and SPO-threshold custody modes.

The review gates did not clear strongly enough for a YES. The anchor document was available and replayable, and the counterargument pass found a real strongest case for approval: the project could be high-public-benefit infrastructure if delivered. But treasury actions require elevated scrutiny because they spend shared ADA and set precedent. Here, the treasury diligence dossier was incomplete, treasury flow was flagged as unsustainable, milestone-gated disbursement was missing, claims-and-evidence status was thin, and the risk review lacked independent assurance plus a rollback or remedy path. On the available evidence, BEACN judged that the cost and risk outweighed the supported case for funding.

## Review Tree
- overall_status: `incomplete`

### Intake
- status: `complete`
- finding: Action type: TreasuryWithdrawals
- finding: Status: active
- finding: Proposed epoch: 640
- finding: Expires after epoch: 647
- finding: Treasury request: 12.33M ADA
- finding: Anchor pinned locally: yes
- conclusion: Baseline fields and source anchors establish whether the proposal can be reviewed at all.

### Claims and evidence
- status: `thin`
- finding: Proposal anchor: pinned and replayable
- finding: Proposal document read by reasoning layer: yes
- finding: Snapshot freshness source: deep_research_dossiers.csv
- finding: Deep research dossier: required
- finding: Requested: Fund Phase 1 of 2 for Bifrost, a Bitcoin-Cardano bridge, to move from working testnet to launch readiness.
- finding: Recipient: FluidTokens and Lantr Engineering
- finding: Stated amount: 12332031
- finding: Deliverables: Hardening of Bifrost from working testnet toward launch readiness, Security audits, Formal verification, Ecosystem and partner readiness, Stewardship structure and economic foundations for launch, Audited bridge running on Cardano mainnet in federated and SPO-threshold custody modes under controlled access
- finding: Deadline/expiry: March 2027
- finding: Claim (technical, supported_in_proposal, high materiality): Bifrost is designed as a permissionless Bitcoin-Cardano bridge secured by Cardano's existing SPO ecosystem that brings BTC onto Cardano as a native Cardano asset.
- finding: Claim (technical, proposer_asserted, high materiality): The bridge is on testnet today under Catalyst Fund 14, with working peg-ins and peg-outs and participating SPOs.
- finding: Claim (economic, supported_in_proposal, high materiality): FluidTokens and Lantr Engineering request ₳12,332,031 for a 9-month delivery period from July 2026 to March 2027, including a 10% refundable contingency.
- finding: Claim (technical, proposer_asserted, high materiality): By the end of Phase 1, Bifrost will be an audited bridge running on Cardano mainnet in both federated and SPO-threshold custody modes under controlled access.
- finding: Claim (governance, supported_in_proposal, high materiality): Public rollout and 24 months of operations are intentionally deferred to a Phase 2 proposal in Q1 2027 after the bridge has been proven on-chain.
- finding: Claim (technical, proposer_asserted, high materiality): Bifrost claims custody of locked BTC will be distributed across 400+ Cardano SPOs weighted by delegation rather than held by a company, foundation, or fixed signing committee.
- missing: Independent evidence for: The bridge is on testnet today under Catalyst Fund 14, with working peg-ins and peg-outs and participating SPOs.
- missing: Independent evidence for: By the end of Phase 1, Bifrost will be an audited bridge running on Cardano mainnet in both federated and SPO-threshold custody modes under controlled access.
- missing: Independent evidence for: Bifrost claims custody of locked BTC will be distributed across 400+ Cardano SPOs weighted by delegation rather than held by a company, foundation, or fixed signing committee.
- missing: Independent evidence for: The proposal targets 1,200 BTC TVL, about 600,000 annual transactions, and 3,000 fBTC-holding wallets by Q2 2029 as Cardano 2030 KPI contributions.
- conclusion: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.

### Treasury analysis
- status: `incomplete`
- finding: Requested ADA: 12332031
- finding: Budget granularity: confirmed
- finding: Milestone payment gates: unknown
- finding: Clawback/refund path: unknown
- finding: Cost/benefit clarity: confirmed
- finding: Recurring funding dependency: confirmed
- finding: Six-month treasury flow regime: unsustainable (basis: total inflow (tau + donations) vs enacted withdrawals)
- finding: Financial confidence: 0.78
- missing: milestone-gated disbursement
- conclusion: Treasury votes require a higher bar because they consume shared ADA and create precedent.

### Risk review
- status: `complete`
- finding: Execution risk: high
- finding: Governance risk: medium
- finding: Technical risk: high
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
- finding: Strongest YES: the proposal substantiates "Bifrost is designed as a permissionless Bitcoin-Cardano bridge secured by Cardano's existing SPO ecosystem that brings BTC onto Cardano as a native Cardano asset." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "The bridge is on testnet today under Catalyst Fund 14, with working peg-ins and peg-outs and participating SPOs." — so cost or precedent may outweigh the benefit.
- finding: Strongest hold: a treasury action without a complete deep-research dossier cannot be voted directionally without pretending certainty.
- conclusion: A defensible rationale must show the best opposing case before it reaches a vote.

### Synthesis
- status: `ready`
- finding: Final vote must be derived from completed sections above, not from a prose summary.
- finding: The public rationale should name the decisive section and the strongest counterargument.
- conclusion: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Facts
- Pinned anchor document is available for this action.
- Treasury withdrawal actions require elevated scrutiny.
- Flag score present (4), reducing confidence.
- Intake: Action type: TreasuryWithdrawals
- Claims and evidence: Proposal anchor: pinned and replayable
- Treasury analysis: Requested ADA: 12332031
- Risk review: Execution risk: high
- Counterargument pass: Strongest YES: the proposal substantiates "Bifrost is designed as a permissionless Bitcoin-Cardano bridge secured by Cardano's existing SPO ecosystem that brings BTC onto Cardano as a native Cardano asset." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- Doctrine-aware reasoning layer nudged the score by -0.030 (clamped to ±0.05): The proposal describes a potentially high-public-benefit infrastructure project, but the deterministic assessment marks claims and evidence as thin and treasury analysis as incomplete for a large treasury withdrawal; under BEACN's hierarchy, evidence quality and treasury stewardship warrant a small cautionary negative nudge beyond the mechanical score.
- Intake: Baseline fields and source anchors establish whether the proposal can be reviewed at all.
- Claims and evidence: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.
- Treasury analysis: Treasury votes require a higher bar because they consume shared ADA and create precedent.
- Risk review: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.
- Counterargument pass: A defensible rationale must show the best opposing case before it reaches a vote.
- Synthesis: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Uncertainty
- Treasury diligence dossier incomplete; soft gate applied a -0.1 caution penalty and judged on available repo context (anchor + doctrine + reasoning lean) rather than abstaining.
- Treasury flow signal is in unsustainable regime, ratio 2.28 (total inflow (tau + donations) vs enacted withdrawals); advisory penalty applied.
- DRep ratification support is below threshold; this is not treated as active opposition.
- Claims and evidence missing: Independent evidence for: The bridge is on testnet today under Catalyst Fund 14, with working peg-ins and peg-outs and participating SPOs.
- Claims and evidence missing: Independent evidence for: By the end of Phase 1, Bifrost will be an audited bridge running on Cardano mainnet in both federated and SPO-threshold custody modes under controlled access.
- Claims and evidence status is thin.
- Treasury analysis missing: milestone-gated disbursement
- Treasury analysis status is incomplete.
- Risk review missing: independent assurance
- Risk review missing: rollback/remedy path

## Reproducibility
- input_hash: `bf451b6e6071baca7ea33af022c0f5821efbcaaa86d0735b75f2c6a08e3399f1`
- snapshot_bundle_hash: `128a30bad768855bd8240bd590dac974f5c65e30e93a17a158e367e7ce987185`
- soul_commit: `6831a5e0ecdb429fd793fe9b865f94a0af9b0e31`
- soul_text_hash: `a8c48e8e59534bbaa71af9a923ef942aa2cda51cb9e259331cef24e0da27ae10`
- resource_registry_commit: `3a194b6032448cec2eb7ae69ff68fc7e02a22fe7`
- resources_used: `gov_actions_api, gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents, deep_research_dossiers`
- snapshot_age_seconds: `30`
- uncertainty_band: `MEDIUM`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.1957, "NO": 0.7629, "YES": 0.0414}`
