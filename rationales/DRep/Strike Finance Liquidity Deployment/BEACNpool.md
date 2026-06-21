<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/1a1aaea00be5eaade078bdf3.md -->
# BEACNpool

**Proposal:** Strike Finance Liquidity Deployment
**Vote:** No
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: gov_action1suskjc6c4nw58c6wtmv77xe79gwj47wp4gvh9cqhhxujwxmam3cqqkz5nwj
Recommendation: **NO**
Score: `-0.5133` (raw `-0.4833` + doctrine-LLM nudge `-0.03`) | Confidence: `1.0` | Readiness: `0.0`
> Reasoning layer (precomputed): The proposal is aligned with public-benefit ecosystem growth and includes some custody, reporting, and risk-trigger structure, but the deterministic assessment is blocked for missing treasury, feasibility, risk, alternatives, and failure-mode analysis. Given the large treasury amount, modeled non-guaranteed yield, ADA-to-USDM conversion risk, and mostly proposer-supplied evidence, BEACN doctrine supports a small cautionary nudge rather than a positive adjustment.

## Plain-language explanation (codex-offline-review)
BEACN records NO on Strike Finance Liquidity Deployment. The decisive concern is that the proposal's risks, precedent, or evidence gaps outweigh the case presented.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: 12-month productive treasury deployment into Strike Finance V2 liquidity infrastructure, with ADA sold for USDM stablecoin liquidity and returned after the deployment period.. The recorded treasury amount is 9,000,000 ADA. The strongest grounded claim is: The proposal requests 9,000,000 ADA for a 12-month treasury-owned liquidity deployment rather than grant funding.

A material weak point is that this claim remains proposer-asserted or thinly supported: The deployment is modeled at a 10% USD-denominated annual percentage rate, generating approximately 135,000 USD or 900,000 ADA-equivalent in annual yield, but returns are not guaranteed. The blocking questions are: missing complete proposal summary; missing budget analysis; missing feasibility assessment.

## Review Tree
- overall_status: `blocked`

### Intake
- status: `complete`
- finding: Action type: TreasuryWithdrawals
- finding: Status: active
- finding: Proposed epoch: 637
- finding: Expires after epoch: 644
- finding: Treasury request: 9.00M ADA
- finding: Anchor pinned locally: yes
- conclusion: Baseline fields and source anchors establish whether the proposal can be reviewed at all.

### Claims and evidence
- status: `thin`
- finding: Proposal anchor: pinned and replayable
- finding: Proposal document read by reasoning layer: yes
- finding: Snapshot freshness source: manifest
- finding: Deep research dossier: required
- finding: Requested: 12-month productive treasury deployment into Strike Finance V2 liquidity infrastructure, with ADA sold for USDM stablecoin liquidity and returned after the deployment period.
- finding: Recipient: Independent council composed of Rami from Snek, Phil from Surf, and James from Monetra/Moneta administering deployment for Strike Finance V2 liquidity infrastructure
- finding: Stated amount: 9,000,000 ADA
- finding: Deliverables: Deploy 9,000,000 ADA sold for USDM into V2 USDM liquidity for scalable execution depth and stablecoin markets, Return realized yield from the first six months to the Cardano Treasury at month 6, Return 100% of treasury-owned deployed assets, including remaining principal and realized yield, at month 12, Provide monthly public transparency reports covering deployment status, liquidity utilization, volume, open interest, P&L, yield, drawdown, stablecoin exposure, market quality metrics, distributions, and material risks, Provide independent third-party assurance reports at deployment confirmation, month-6 yield distribution, and month-12 return of funds
- finding: Deadline/expiry: 12 months, with month-6 yield distribution and final return at month 12
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal requests 9,000,000 ADA for a 12-month treasury-owned liquidity deployment rather than grant funding.
- finding: Claim (economic, supported_in_proposal, high materiality): The deployed ADA will be sold for USDM, with the modeled conversion assuming ADA at 0.15 USD and approximately 1,350,000 USDM deployed.
- finding: Claim (economic, proposer_asserted, high materiality): The deployment is modeled at a 10% USD-denominated annual percentage rate, generating approximately 135,000 USD or 900,000 ADA-equivalent in annual yield, but returns are not guaranteed.
- finding: Claim (adoption, proposer_asserted, high materiality): Strike has processed more than 1.13 billion USD in cumulative volume, facilitated roughly 968,000 to 1,001,000 trades, served over 3,000 unique traders, produced over 1.16 million USD in protocol revenue, and generated over 3.25 million USD in liquidity provider profit.
- finding: Claim (adoption, supported_in_proposal, high materiality): From V2 launch on 2026-03-20 through 2026-06-15, Strike V2 produced 87,288,044 USD total volume, 410,800 total trades, 2,681 users, and 30,105 USD total revenue.
- finding: Claim (economic, supported_in_proposal, high materiality): The Strike Liquidity Provider vault is reported as having 985,271.59 USD TVL, 43.52% APR, +8.85% all-time return, 1.15% maximum drawdown, and a 4.97 Sharpe ratio over two months of public history.
- missing: Independent evidence for: The deployment is modeled at a 10% USD-denominated annual percentage rate, generating approximately 135,000 USD or 900,000 ADA-equivalent in annual yield, but returns are not guaranteed.
- missing: Independent evidence for: Strike has processed more than 1.13 billion USD in cumulative volume, facilitated roughly 968,000 to 1,001,000 trades, served over 3,000 unique traders, produced over 1.16 million USD in protocol revenue, and generated over 3.25 million USD in liquidity provider profit.
- missing: Independent evidence for: Strike V2 has undergone unofficial reviews and an official audit by Christian Schmitz is expected to be finalized by July 1, 2026, with the report to be published upon completion.
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
- finding: Requested ADA: 9.00M ADA
- finding: Budget granularity: unknown
- finding: Milestone payment gates: unknown
- finding: Clawback/refund path: unknown
- finding: Cost/benefit clarity: unknown
- finding: Recurring funding dependency: unknown
- finding: Six-month treasury flow regime: unsustainable
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
- finding: Flag count: 2
- missing: mitigation evidence
- missing: independent assurance
- missing: rollback/remedy path
- missing: dependency map
- conclusion: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.

### Counterargument pass
- status: `complete`
- finding: Strongest YES: the proposal substantiates "The proposal requests 9,000,000 ADA for a 12-month treasury-owned liquidity deployment rather than grant funding." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "The deployment is modeled at a 10% USD-denominated annual percentage rate, generating approximately 135,000 USD or 900,000 ADA-equivalent in annual yield, but returns are not guaranteed." — so cost or precedent may outweigh the benefit.
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
- Flag score present (7), reducing confidence.
- Intake: Action type: TreasuryWithdrawals
- Claims and evidence: Proposal anchor: pinned and replayable
- Treasury analysis: Requested ADA: 9.00M ADA
- Risk review: Execution risk: unknown
- Counterargument pass: Strongest YES: the proposal substantiates "The proposal requests 9,000,000 ADA for a 12-month treasury-owned liquidity deployment rather than grant funding." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- Doctrine-aware reasoning layer nudged the score by -0.030 (clamped to ±0.05): The proposal is aligned with public-benefit ecosystem growth and includes some custody, reporting, and risk-trigger structure, but the deterministic assessment is blocked for missing treasury, feasibility, risk, alternatives, and failure-mode analysis. Given the large treasury amount, modeled non-guaranteed yield, ADA-to-USDM conversion risk, and mostly proposer-supplied evidence, BEACN doctrine supports a small cautionary nudge rather than a positive adjustment.
- Intake: Baseline fields and source anchors establish whether the proposal can be reviewed at all.
- Claims and evidence: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.
- Treasury analysis: Treasury votes require a higher bar because they consume shared ADA and create precedent.
- Risk review: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.
- Counterargument pass: A defensible rationale must show the best opposing case before it reaches a vote.
- Synthesis: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Uncertainty
- Treasury diligence dossier incomplete; soft gate applied a -0.1 caution penalty and judged on available repo context (anchor + doctrine + reasoning lean) rather than abstaining.
- Treasury fee-flow signal is in unsustainable regime (advisory penalty applied).
- DRep ratification support is below threshold; this is not treated as active opposition.
- Claims and evidence missing: Independent evidence for: The deployment is modeled at a 10% USD-denominated annual percentage rate, generating approximately 135,000 USD or 900,000 ADA-equivalent in annual yield, but returns are not guaranteed.
- Claims and evidence missing: Independent evidence for: Strike has processed more than 1.13 billion USD in cumulative volume, facilitated roughly 968,000 to 1,001,000 trades, served over 3,000 unique traders, produced over 1.16 million USD in protocol revenue, and generated over 3.25 million USD in liquidity provider profit.
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
- input_hash: `527789055b477294e9eaf27a199f05c2ca93a1d59de511dffbaf304ced8cf9cc`
- snapshot_bundle_hash: `7be216739523f611934b5560509d6d077497a567ae3929093bc5d326afe6cc8a`
- soul_commit: `6bf4a7d7baa636417ad929e543cfb8be8fae1f03`
- soul_text_hash: `a8c48e8e59534bbaa71af9a923ef942aa2cda51cb9e259331cef24e0da27ae10`
- resource_registry_commit: `20e0915ebc437140b55ee25e28adbae01e97032d`
- resources_used: `gov_actions_api, gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents`
- snapshot_age_seconds: `0`
- uncertainty_band: `HIGH`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.1518, "NO": 0.8093, "YES": 0.0389}`
