<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/0dcda572c9d69f341e8bc670.md -->
# BEACNpool

**Proposal:** Tweag Core Cardano Infrastructure Treasury Withdrawal 2026–2027
**Vote:** No
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: gov_action1zljrlljt9cxlz7ra2nep43nxg0r54wcnrgexyuhuam9ah0ws607qq2vcg4x
Recommendation: **NO**
Score: `-0.6333` (raw `-0.6033` + doctrine-LLM nudge `-0.03`) | Confidence: `1.0` | Readiness: `0.7`
> Reasoning layer (precomputed): A small negative nudge is justified because the deterministic assessment is blocked by missing budget, feasibility, alternatives, failure-mode, and community-impact analysis, while the request is large and several central technical and economic claims are asserted rather than evidenced in the supplied document.

## Plain-language explanation (precomputed)
BEACN's autonomous DRep is recording ABSTAIN on this action, and the reason is procedural rather than a verdict on the proposal's merits. BEACN's on-chain governance data snapshot is currently about eight hours old, which is beyond the six-hour freshness limit its policy requires before it will cast a directional vote. When data is this stale BEACN holds rather than risk voting on an out-of-date picture of the proposal, the treasury, and the wider vote distribution. At about 18.26 million ADA this is one of the largest live treasury actions, funding Tweag by Modus Create to deliver core protocol infrastructure — chiefly the mainnet deployment of Peras for faster finality, plus History Expiry and conformance testing. The technical need is well-documented: Peras v1 is genuinely not yet on mainnet and the work it describes is real. The budget is transparently derived from a stated hourly rate and ADA/USD assumption, which is good practice, but the rate, the hours and the single-pipeline framing are proposer-set figures that warrant independent cost scrutiny at this scale. A request of this size demands a completed deep-research dossier, milestone-gated disbursement and a clear view of treasury runway — exactly the checks BEACN cannot complete on an eight-hour-old snapshot. It is therefore holding until the data is fresh and that evidence is in hand.

## Review Tree
- overall_status: `blocked`

### Intake
- status: `complete`
- finding: Action type: TreasuryWithdrawals
- finding: Status: active
- finding: Proposed epoch: 634
- finding: Expires after epoch: 641
- finding: Treasury request: 18.26M ADA
- finding: Anchor pinned locally: yes
- conclusion: Baseline fields and source anchors establish whether the proposal can be reviewed at all.

### Claims and evidence
- status: `thin`
- finding: Proposal anchor: pinned and replayable
- finding: Proposal document read by reasoning layer: yes
- finding: Snapshot freshness source: manifest
- finding: Deep research dossier: required
- finding: Requested: Treasury withdrawal to fund Tweag by Modus Create's delivery of three Cardano core infrastructure work packages over 2026-2027.
- finding: Recipient: Tweag by Modus Create, administered by Intersect/Cardano Development Holdings via treasury reserve and project-specific smart contracts
- finding: Stated amount: 18263496.00
- finding: Deliverables: Peras v1 mainnet readiness including production cryptography, KillSwitch, hard-fork readiness, support and maintenance, History Expiry for partial-history nodes intended to reduce SPO storage costs, Conformance Testing framework extended for Peras and Leios, Merged code, reproducible releases, runbooks, benchmarks, and governance-action packages where governance activation is required, Public demos at least every two months, status updates, and community coordination channels
- finding: Deadline/expiry: 2026-2027 delivery period; exact milestone dates not stated in document
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal requests ₳18,263,496.00, described as USD $4,565,874.00, for three core infrastructure work packages delivered over 2026-2027.
- finding: Claim (technical, proposer_asserted, high materiality): The work packages are Peras v1, History Expiry, and Conformance Testing for Peras and Leios, and the proposer says they are interdependent parts of a single delivery pipeline.
- finding: Claim (technical, proposer_asserted, high materiality): The proposer states Peras would improve finality to about 2 minutes compared with about 12 minutes today.
- finding: Claim (technical, proposer_asserted, high materiality): The proposer states Leios-driven throughput could cause SPO disk usage to surge to about 1 GB per hour at 100-1000 TPS unless History Expiry reduces full-history storage requirements.
- finding: Claim (economic, proposer_asserted, high materiality): The budget is said to be based on an average $176 per hour market rate for senior Cardano infrastructure engineers and a conservative ADA/USD conversion rate of 0.25 based on a 5-year average.
- finding: Claim (governance, supported_in_proposal, high materiality): The proposal says milestones, acceptance criteria, payment amounts, and delivery dates will be agreed later between Tweag and Intersect in an off-chain legal contract and made public through budget-management metadata.
- missing: Independent evidence for: The work packages are Peras v1, History Expiry, and Conformance Testing for Peras and Leios, and the proposer says they are interdependent parts of a single delivery pipeline.
- missing: Independent evidence for: The proposer states Peras would improve finality to about 2 minutes compared with about 12 minutes today.
- missing: Independent evidence for: The proposer states Leios-driven throughput could cause SPO disk usage to surge to about 1 GB per hour at 100-1000 TPS unless History Expiry reduces full-history storage requirements.
- missing: Independent evidence for: The budget is said to be based on an average $176 per hour market rate for senior Cardano infrastructure engineers and a conservative ADA/USD conversion rate of 0.25 based on a 5-year average.
- missing: budget analysis
- missing: feasibility assessment
- missing: alternatives analysis
- missing: failure-mode analysis
- missing: community impact analysis
- conclusion: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.

### Treasury analysis
- status: `incomplete`
- finding: Requested ADA: 18263496
- finding: Budget granularity: confirmed
- finding: Milestone payment gates: not confirmed
- finding: Clawback/refund path: not confirmed
- finding: Cost/benefit clarity: unknown
- finding: Recurring funding dependency: not confirmed
- finding: Six-month treasury flow regime: unsustainable
- finding: Financial confidence: 0.40
- missing: milestone-gated disbursement
- missing: sustainability path
- missing: cost-benefit clarity
- conclusion: Treasury votes require a higher bar because they consume shared ADA and create precedent.

### Risk review
- status: `complete`
- finding: Execution risk: medium
- finding: Governance risk: low
- finding: Technical risk: high
- finding: Treasury exposure risk: high
- finding: Mitigation evidence: unknown
- finding: Independent assurance: not confirmed
- finding: Rollback/remedy path: not confirmed
- finding: Flag count: 2
- missing: mitigation evidence
- missing: independent assurance
- missing: rollback/remedy path
- missing: dependency map
- conclusion: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.

### Counterargument pass
- status: `complete`
- finding: Strongest YES: the proposal substantiates "The proposal requests ₳18,263,496.00, described as USD $4,565,874.00, for three core infrastructure work packages delivered over 2026-2027." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "The work packages are Peras v1, History Expiry, and Conformance Testing for Peras and Leios, and the proposer says they are interdependent parts of a single delivery pipeline." — so cost or precedent may outweigh the benefit.
- finding: Strongest hold: a treasury action without a complete deep-research dossier cannot be voted directionally without pretending certainty.
- conclusion: A defensible rationale must show the best opposing case before it reaches a vote.

### Synthesis
- status: `blocked`
- finding: Final vote must be derived from completed sections above, not from a prose summary.
- finding: The public rationale should name the decisive section and the strongest counterargument.
- missing: missing budget analysis
- missing: missing feasibility assessment
- missing: missing alternatives analysis
- missing: missing failure-mode analysis
- missing: missing community impact analysis
- conclusion: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Facts
- Pinned anchor document is available for this action.
- Treasury withdrawal actions require elevated scrutiny.
- Flag score present (7), reducing confidence.
- Intake: Action type: TreasuryWithdrawals
- Claims and evidence: Proposal anchor: pinned and replayable
- Treasury analysis: Requested ADA: 18263496
- Risk review: Execution risk: medium
- Counterargument pass: Strongest YES: the proposal substantiates "The proposal requests ₳18,263,496.00, described as USD $4,565,874.00, for three core infrastructure work packages delivered over 2026-2027." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- DRep ratification support is material but below threshold; treated as a modest context signal.
- Doctrine-aware reasoning layer nudged the score by -0.030 (clamped to ±0.05): A small negative nudge is justified because the deterministic assessment is blocked by missing budget, feasibility, alternatives, failure-mode, and community-impact analysis, while the request is large and several central technical and economic claims are asserted rather than evidenced in the supplied document.
- Intake: Baseline fields and source anchors establish whether the proposal can be reviewed at all.
- Claims and evidence: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.
- Treasury analysis: Treasury votes require a higher bar because they consume shared ADA and create precedent.
- Risk review: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.
- Counterargument pass: A defensible rationale must show the best opposing case before it reaches a vote.
- Synthesis: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Uncertainty
- Treasury diligence dossier incomplete; soft gate applied a -0.1 caution penalty and judged on available repo context (anchor + doctrine + reasoning lean) rather than abstaining.
- Treasury fee-flow signal is in unsustainable regime (advisory penalty applied).
- No milestone-gated disbursement documented.
- Claims and evidence missing: Independent evidence for: The work packages are Peras v1, History Expiry, and Conformance Testing for Peras and Leios, and the proposer says they are interdependent parts of a single delivery pipeline.
- Claims and evidence missing: Independent evidence for: The proposer states Peras would improve finality to about 2 minutes compared with about 12 minutes today.
- Claims and evidence status is thin.
- Treasury analysis missing: milestone-gated disbursement
- Treasury analysis missing: sustainability path
- Treasury analysis status is incomplete.
- Risk review missing: mitigation evidence
- Risk review missing: independent assurance
- Synthesis missing: missing budget analysis
- Synthesis missing: missing feasibility assessment
- Synthesis status is blocked.

## Reproducibility
- input_hash: `7aa0c9d3ce0b5817f1723158b6cb6fc0fa9de68ecef433649520f5f4f8cc92de`
- snapshot_bundle_hash: `07fefb9fbe64e838ecc176209a8c017590b53beaad31f9e8e5ce8d9e87bcd352`
- soul_commit: `6bf4a7d7baa636417ad929e543cfb8be8fae1f03`
- soul_text_hash: `a8c48e8e59534bbaa71af9a923ef942aa2cda51cb9e259331cef24e0da27ae10`
- resource_registry_commit: `20e0915ebc437140b55ee25e28adbae01e97032d`
- resources_used: `gov_actions_api, gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents`
- snapshot_age_seconds: `1`
- uncertainty_band: `HIGH`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.1518, "NO": 0.8093, "YES": 0.0389}`
