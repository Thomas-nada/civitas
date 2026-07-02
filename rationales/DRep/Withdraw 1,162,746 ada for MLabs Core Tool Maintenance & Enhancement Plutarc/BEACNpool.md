<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/b2c269732e1eb5170da18a82.md -->
# BEACNpool

**Proposal:** Withdraw 1,162,746 ada for MLabs Core Tool Maintenance & Enhancement Plutarc
**Vote:** No
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8svfsvefn
Recommendation: **NO**
Score: `-0.3133` (raw `-0.2833` + doctrine-LLM nudge `-0.03`) | Confidence: `0.8333` | Readiness: `0.0`
> Reasoning layer (precomputed): The extracted claims show plausible public-benefit tooling value and some independently checkable governance and administration references, but the deterministic assessment is blocked for missing budget, feasibility, risk, alternatives, and failure-mode analysis. Under BEACN doctrine, a large treasury withdrawal with incomplete diligence and several material assertions should receive a cautious negative nudge rather than extra support.

## Plain-language explanation (codex-offline-review)
BEACN records NO on Withdraw 1,162,746 ada for MLabs Core Tool Maintenance & Enhancement: Plutarc.... The decisive concern is that the proposal's risks, precedent, or evidence gaps outweigh the case presented.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: Withdraw treasury funds for annual maintenance and enhancement of MLabs' Plutarch and Ply tools.. The recorded treasury amount is 1,162,746. The strongest grounded claim is: The proposal requests 1,162,746 ADA, consisting of 1,128,880 ADA for Plutarch and Ply maintenance, compatibility, and developer experience plus a 33,866 ADA Intersect budget administration fee.

A material weak point is that this claim remains proposer-asserted or thinly supported: MLabs says a recent internal audit counted at least 26 teams using Plutarch and Ply in the motivation section, while the rationale section says it conservatively counted at least 15 teams. The blocking questions are: missing complete proposal summary; missing budget analysis; missing feasibility assessment.

## Review Tree
- overall_status: `blocked`

### Intake
- status: `complete`
- finding: Action type: TreasuryWithdrawals
- finding: Status: active
- finding: Proposed epoch: 638
- finding: Expires after epoch: 645
- finding: Treasury request: 1.16M ADA
- finding: Anchor pinned locally: yes
- conclusion: Baseline fields and source anchors establish whether the proposal can be reviewed at all.

### Claims and evidence
- status: `thin`
- finding: Proposal anchor: pinned and replayable
- finding: Proposal document read by reasoning layer: yes
- finding: Snapshot freshness source: manifest
- finding: Deep research dossier: required
- finding: Requested: Withdraw treasury funds for annual maintenance and enhancement of MLabs' Plutarch and Ply tools.
- finding: Recipient: Intersect Treasury Reserve Smart Contract stake address stake1784sdxt6jjennmstphgdu7l7c2scf5d02a6cve2dgn5s2kq5u3j9v, submitted by Intersect on behalf of the vendor MLabs
- finding: Stated amount: 1,162,746
- finding: Deliverables: WP1 - Plutarch and Ply Maintenance, Compatibility & Developer Experience, Critical breakages and serious vulnerabilities, Protocol-era and hard-fork compatibility, Bug fixes, correctness improvements, and optimizations, Documentation, examples, technical blog posts, and developer-experience improvements
- finding: Deadline/expiry: not stated in document
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal requests 1,162,746 ADA, consisting of 1,128,880 ADA for Plutarch and Ply maintenance, compatibility, and developer experience plus a 33,866 ADA Intersect budget administration fee.
- finding: Claim (technical, supported_in_proposal, high materiality): Plutarch is described as a Haskell eDSL for creating efficient Cardano smart contracts through controlled compilation into UPLC, and Ply is described as helping serialize Plutarch scripts to and from CIP-57 blueprint-style artifacts with inferred types.
- finding: Claim (adoption, proposer_asserted, high materiality): MLabs says a recent internal audit counted at least 26 teams using Plutarch and Ply in the motivation section, while the rationale section says it conservatively counted at least 15 teams.
- finding: Claim (technical, independently_verifiable, medium materiality): The proposal claims Plutarch scripts rank among the smallest in MLabs' public cross-language benchmark suite while requiring comparatively low on-chain compute and memory.
- finding: Claim (technical, proposer_asserted, high materiality): The funding period is expected to cover ongoing Cardano ledger, Plutus, and tooling evolution, including possible protocol-era compatibility for major ledger updates such as the Dijkstra era if relevant changes land.
- finding: Claim (technical, supported_in_proposal, medium materiality): The proposal says the work priority order is critical breakages and vulnerabilities, protocol-era and hard-fork compatibility, bug fixes and optimizations, then documentation and developer-experience improvements.
- missing: Independent evidence for: MLabs says a recent internal audit counted at least 26 teams using Plutarch and Ply in the motivation section, while the rationale section says it conservatively counted at least 15 teams.
- missing: Independent evidence for: The funding period is expected to cover ongoing Cardano ledger, Plutus, and tooling evolution, including possible protocol-era compatibility for major ledger updates such as the Dijkstra era if relevant changes land.
- missing: Independent evidence for: The proposal states audit and oversight costs are included in the proposal overhead and that independent oversight will be provided through Intersect and technically capable third parties with reporting obligations and milestone-based disbursement controls.
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
- finding: Requested ADA: 1.16M ADA
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
- finding: Strongest YES: the proposal substantiates "The proposal requests 1,162,746 ADA, consisting of 1,128,880 ADA for Plutarch and Ply maintenance, compatibility, and developer experience plus a 33,866 ADA Intersect budget administration fee." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "MLabs says a recent internal audit counted at least 26 teams using Plutarch and Ply in the motivation section, while the rationale section says it conservatively counted at least 15 teams." — so cost or precedent may outweigh the benefit.
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
- Treasury analysis: Requested ADA: 1.16M ADA
- Risk review: Execution risk: unknown
- Counterargument pass: Strongest YES: the proposal substantiates "The proposal requests 1,162,746 ADA, consisting of 1,128,880 ADA for Plutarch and Ply maintenance, compatibility, and developer experience plus a 33,866 ADA Intersect budget administration fee." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- Doctrine-aware reasoning layer nudged the score by -0.030 (clamped to ±0.05): The extracted claims show plausible public-benefit tooling value and some independently checkable governance and administration references, but the deterministic assessment is blocked for missing budget, feasibility, risk, alternatives, and failure-mode analysis. Under BEACN doctrine, a large treasury withdrawal with incomplete diligence and several material assertions should receive a cautious negative nudge rather than extra support.
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
- Claims and evidence missing: Independent evidence for: MLabs says a recent internal audit counted at least 26 teams using Plutarch and Ply in the motivation section, while the rationale section says it conservatively counted at least 15 teams.
- Claims and evidence missing: Independent evidence for: The funding period is expected to cover ongoing Cardano ledger, Plutus, and tooling evolution, including possible protocol-era compatibility for major ledger updates such as the Dijkstra era if relevant changes land.
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
- input_hash: `ccf871a53a1b5f40b75525e56d8b04ed9297c073be1f7cee02772cb181fa0e09`
- snapshot_bundle_hash: `058cd2ecc8aca80073226443f5c8c1e6bc83ec12d540fa2379de735ae59217eb`
- soul_commit: `8e5afeb10af64d4e1c9708d4029f95043c3f5354`
- soul_text_hash: `a8c48e8e59534bbaa71af9a923ef942aa2cda51cb9e259331cef24e0da27ae10`
- resource_registry_commit: `7d671706a9a739988611151bb93ebc1eebba6851`
- resources_used: `gov_actions_api, gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents`
- snapshot_age_seconds: `651`
- uncertainty_band: `HIGH`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.1914, "NO": 0.7642, "YES": 0.0443}`
