<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/35da74ffbd3e11824c1ba972.md -->
# BEACNpool

**Proposal:** Net Change Limit Cardano Treasury (Epochs 613-713)
**Vote:** Abstain
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: gov_action15atytcy8ru7mkcs8m7r8mx7k5x36t0h6grtgmak6v5wmf4nq07lsqhakceq
Recommendation: **ABSTAIN**
Score: `-0.07` (raw `-0.05` + doctrine-LLM nudge `-0.02`) | Confidence: `0.59` | Readiness: `0.0`
> Reasoning layer (precomputed): The action improves governance clarity by defining the cap, period, accounting method, and non-withdrawal status, but the central justification for increasing the fiscal guardrail is mostly asserted rather than evidenced in the document. Under treasury stewardship and evidence-quality priorities, that supports a small cautionary nudge rather than a positive adjustment.

## Plain-language explanation (codex-offline-review)
BEACN records ABSTAIN on Net Change Limit: Cardano Treasury (Epochs 613-713). This is a conservative abstention because the evidence does not justify stronger certainty.

The action is a InfoAction. The cached anchor describes the request as: Info action to record DRep agreement to a new Net Change Limit for Cardano Treasury withdrawals for Epochs 613-713.. The recorded treasury amount is No treasury withdrawal requested; proposed Net Change Limit is 500,000,000 ada.. The strongest grounded claim is: The proposal sets a Net Change Limit of 500,000,000 ada, equal to 500,000,000,000,000 lovelace, for Epochs 613-713.

A material weak point is that this claim remains proposer-asserted or thinly supported: The proposal states that this new 500,000,000 ada limit supersedes any prior Net Change Limit for the same period, including the previously agreed 350,000,000 ada limit. Reason code: RULE_THRESHOLD_UNMET.

## Review Tree
- overall_status: `incomplete`

### Intake
- status: `complete`
- finding: Action type: InfoAction
- finding: Status: active
- finding: Proposed epoch: 640
- finding: Expires after epoch: 647
- finding: Treasury request: not specified
- finding: Anchor pinned locally: yes
- conclusion: Baseline fields and source anchors establish whether the proposal can be reviewed at all.

### Claims and evidence
- status: `thin`
- finding: Proposal anchor: pinned and replayable
- finding: Proposal document read by reasoning layer: yes
- finding: Snapshot freshness source: manifest
- finding: Deep research dossier: not required
- finding: Requested: Info action to record DRep agreement to a new Net Change Limit for Cardano Treasury withdrawals for Epochs 613-713.
- finding: Recipient: not stated in document
- finding: Stated amount: No treasury withdrawal requested; proposed Net Change Limit is 500,000,000 ada.
- finding: Deliverables: Set a fixed cap on total ada removed from the Treasury through Treasury Withdrawals during Epochs 613-713., Supersede any prior Net Change Limit for the same period., Count Treasury Withdrawals already debited during the period toward the limit., Record DRep agreement if Yes votes exceed 50% of active voting stake.
- finding: Deadline/expiry: Period begins at the start of Epoch 613 on February 13, 2026 and ends at the close of Epoch 713 on or about July 3, 2027.
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal sets a Net Change Limit of 500,000,000 ada, equal to 500,000,000,000,000 lovelace, for Epochs 613-713.
- finding: Claim (economic, supported_in_proposal, high materiality): The proposed limit caps only Treasury Withdrawals debited from the Cardano Treasury and does not count Treasury inflows.
- finding: Claim (governance, supported_in_proposal, high materiality): The proposal states that it has no direct on-chain effect and does not authorize any Treasury Withdrawal.
- finding: Claim (governance, proposer_asserted, high materiality): The proposal states that this new 500,000,000 ada limit supersedes any prior Net Change Limit for the same period, including the previously agreed 350,000,000 ada limit.
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal states that Treasury Withdrawals already debited during the period count toward the new 500,000,000 ada limit and remain valid.
- finding: Claim (economic, proposer_asserted, medium materiality): The proposer claims the existing 350,000,000 ada limit has been useful but is becoming practically constrained through mid-2027.
- missing: Independent evidence for: The proposal states that this new 500,000,000 ada limit supersedes any prior Net Change Limit for the same period, including the previously agreed 350,000,000 ada limit.
- missing: Independent evidence for: The proposer claims the existing 350,000,000 ada limit has been useful but is becoming practically constrained through mid-2027.
- missing: Independent evidence for: The proposer claims the higher limit preserves DRep ability to consider credible Treasury Withdrawals on their merits while keeping a fixed fiscal guardrail.
- conclusion: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.

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
- finding: Strongest YES: the proposal substantiates "The proposal sets a Net Change Limit of 500,000,000 ada, equal to 500,000,000,000,000 lovelace, for Epochs 613-713." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "The proposal states that this new 500,000,000 ada limit supersedes any prior Net Change Limit for the same period, including the previously agreed 350,000,000 ada limit." — so cost or precedent may outweigh the benefit.
- finding: Strongest hold: if claims cannot be tied to replayable evidence, abstaining avoids overclaiming certainty.
- conclusion: A defensible rationale must show the best opposing case before it reaches a vote.

### Synthesis
- status: `ready`
- finding: Final vote must be derived from completed sections above, not from a prose summary.
- finding: The public rationale should name the decisive section and the strongest counterargument.
- conclusion: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Facts
- Pinned anchor document is available for this action.
- Flag score present (3), reducing confidence.
- Intake: Action type: InfoAction
- Claims and evidence: Proposal anchor: pinned and replayable
- Risk review: Execution risk: unknown
- Counterargument pass: Strongest YES: the proposal substantiates "The proposal sets a Net Change Limit of 500,000,000 ada, equal to 500,000,000,000,000 lovelace, for Epochs 613-713." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- Doctrine-aware reasoning layer nudged the score by -0.020 (clamped to ±0.05): The action improves governance clarity by defining the cap, period, accounting method, and non-withdrawal status, but the central justification for increasing the fiscal guardrail is mostly asserted rather than evidenced in the document. Under treasury stewardship and evidence-quality priorities, that supports a small cautionary nudge rather than a positive adjustment.
- Intake: Baseline fields and source anchors establish whether the proposal can be reviewed at all.
- Claims and evidence: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.
- Risk review: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.
- Counterargument pass: A defensible rationale must show the best opposing case before it reaches a vote.
- Synthesis: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Uncertainty
- DRep ratification support is below threshold; this is not treated as active opposition.
- Claims and evidence missing: Independent evidence for: The proposal states that this new 500,000,000 ada limit supersedes any prior Net Change Limit for the same period, including the previously agreed 350,000,000 ada limit.
- Claims and evidence missing: Independent evidence for: The proposer claims the existing 350,000,000 ada limit has been useful but is becoming practically constrained through mid-2027.
- Claims and evidence status is thin.
- Risk review missing: mitigation evidence
- Risk review missing: independent assurance
- Risk review status is thin.

## Reproducibility
- input_hash: `1f057a8db26f3a5e92893bd1bf11e639b7278aa11fc00383f2810e29890d02d6`
- snapshot_bundle_hash: `eada819a20f90d67017e3961e26ca1244146e5dfdc9f70712f16b1daaefcef11`
- soul_commit: `8e5afeb10af64d4e1c9708d4029f95043c3f5354`
- soul_text_hash: `a8c48e8e59534bbaa71af9a923ef942aa2cda51cb9e259331cef24e0da27ae10`
- resource_registry_commit: `b97265e867768077aac16ceb31ccfe1be639d187`
- resources_used: `gov_actions_api, gov_actions_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents`
- snapshot_age_seconds: `799`
- uncertainty_band: `MEDIUM`
- evidence_depth_score: `3`
- decision_probs: `{"ABSTAIN": 0.4675, "NO": 0.3363, "YES": 0.1963}`
