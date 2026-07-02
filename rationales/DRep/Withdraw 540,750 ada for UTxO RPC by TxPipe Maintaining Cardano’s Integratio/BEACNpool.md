<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/d38215cdf093dba3b51935ff.md -->
# BEACNpool

**Proposal:** Withdraw 540,750 ada for UTxO RPC by TxPipe Maintaining Cardano’s Integratio
**Vote:** No
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8s5z9qdza
Recommendation: **NO**
Score: `-0.3133` (raw `-0.2833` + doctrine-LLM nudge `-0.03`) | Confidence: `0.8333` | Readiness: `0.0`
> Reasoning layer (precomputed): The extracted claims show plausible public-benefit developer infrastructure and some independently checkable governance and smart-contract references, but the deterministic assessment is blocked for missing budget, feasibility, risk, alternatives, and failure-mode analysis. Under the doctrine, treasury stewardship and evidence quality outweigh ecosystem-growth upside, so the appropriate bounded nudge is cautious and negative rather than supportive of spending.

## Plain-language explanation (codex-offline-review)
BEACN records NO on Withdraw 540,750 ada for UTxO RPC by TxPipe: Maintaining Cardano’s Integratio.... The decisive concern is that the proposal's risks, precedent, or evidence gaps outweigh the case presented.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: Fund UTxO RPC by TxPipe for maintaining Cardano's integration standard over a 12-month Year 2 period.. The recorded treasury amount is 540750. The strongest grounded claim is: The proposal requests 420,000 ADA plus a 105,000 ADA contingency reserve and a 15,750 ADA Intersect administration fee, totaling 540,750 ADA.

A material weak point is that this claim remains proposer-asserted or thinly supported: The proposer states that UTxO RPC has been adopted by Amaru, Dingo, and the Haskell Cardano node as a query interface. The blocking questions are: missing complete proposal summary; missing budget analysis; missing feasibility assessment.

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
- finding: Requested: Fund UTxO RPC by TxPipe for maintaining Cardano's integration standard over a 12-month Year 2 period.
- finding: Recipient: Intersect Treasury Reserve Smart Contract stake address stake1784sdxt6jjennmstphgdu7l7c2scf5d02a6cve2dgn5s2kq5u3j9v, submitted by Intersect on behalf of TxPipe as vendor
- finding: Stated amount: 540750
- finding: Deliverables: Part-time maintainer for UTxO RPC over 12 months, Maintenance of the protobuf specification, including protocol compatibility, versioning, and documentation, Maintenance of official SDKs, including dependency updates, performance improvements, and bug fixing, Community support including issue triage, external contribution review, ecosystem-feedback enhancements, and public developer communication, AI-friendly documentation and integration resources for AI-driven development workflows
- finding: Deadline/expiry: 12 months; new grant period begins after closure of the existing contract
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal requests 420,000 ADA plus a 105,000 ADA contingency reserve and a 15,750 ADA Intersect administration fee, totaling 540,750 ADA.
- finding: Claim (technical, supported_in_proposal, high materiality): UTxO RPC is described as an open interface specification using Protocol Buffers with SDKs in Rust, Go, Node.js, .NET, Haskell, and Python.
- finding: Claim (adoption, proposer_asserted, high materiality): The proposer states that UTxO RPC has been adopted by Amaru, Dingo, and the Haskell Cardano node as a query interface.
- finding: Claim (technical, independently_verifiable, medium materiality): The project maintains more than 10 repositories covering the core specification, language SDKs, documentation, and provider integrations under the Apache 2.0 license.
- finding: Claim (governance, proposer_asserted, medium materiality): The proposal states that UTxO RPC aligns with Intersect Strategic Pillar 2 focus area A.3 for developer experience and open-source maintenance incentives.
- finding: Claim (governance, independently_verifiable, high materiality): The proposal states it achieved the required 67% support threshold during the 2026 Intersect Budget Process Hydra Voting phase.
- missing: Independent evidence for: The proposer states that UTxO RPC has been adopted by Amaru, Dingo, and the Haskell Cardano node as a query interface.
- missing: Independent evidence for: The proposal states that UTxO RPC aligns with Intersect Strategic Pillar 2 focus area A.3 for developer experience and open-source maintenance incentives.
- missing: Independent evidence for: TxPipe is stated to have received funding through 30 Project Catalyst proposals from Funds 9 through 14, with 26 delivered and 4 under development and on schedule.
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
- finding: Strongest YES: the proposal substantiates "The proposal requests 420,000 ADA plus a 105,000 ADA contingency reserve and a 15,750 ADA Intersect administration fee, totaling 540,750 ADA." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "The proposer states that UTxO RPC has been adopted by Amaru, Dingo, and the Haskell Cardano node as a query interface." — so cost or precedent may outweigh the benefit.
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
- Counterargument pass: Strongest YES: the proposal substantiates "The proposal requests 420,000 ADA plus a 105,000 ADA contingency reserve and a 15,750 ADA Intersect administration fee, totaling 540,750 ADA." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- Doctrine-aware reasoning layer nudged the score by -0.030 (clamped to ±0.05): The extracted claims show plausible public-benefit developer infrastructure and some independently checkable governance and smart-contract references, but the deterministic assessment is blocked for missing budget, feasibility, risk, alternatives, and failure-mode analysis. Under the doctrine, treasury stewardship and evidence quality outweigh ecosystem-growth upside, so the appropriate bounded nudge is cautious and negative rather than supportive of spending.
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
- Claims and evidence missing: Independent evidence for: The proposer states that UTxO RPC has been adopted by Amaru, Dingo, and the Haskell Cardano node as a query interface.
- Claims and evidence missing: Independent evidence for: The proposal states that UTxO RPC aligns with Intersect Strategic Pillar 2 focus area A.3 for developer experience and open-source maintenance incentives.
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
- input_hash: `0f7f9281720280d745a36fae938d91e5d016320eb8b86333ac04fb6079c61b3b`
- snapshot_bundle_hash: `87937097ca2b04d29bfd39e52d38883c2813f7719cb2fb273054066cc8e14dc1`
- soul_commit: `8e5afeb10af64d4e1c9708d4029f95043c3f5354`
- soul_text_hash: `a8c48e8e59534bbaa71af9a923ef942aa2cda51cb9e259331cef24e0da27ae10`
- resource_registry_commit: `7d671706a9a739988611151bb93ebc1eebba6851`
- resources_used: `gov_actions_api, gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents`
- snapshot_age_seconds: `651`
- uncertainty_band: `HIGH`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.1914, "NO": 0.7642, "YES": 0.0443}`
