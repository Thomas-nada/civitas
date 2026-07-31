<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/119cbcd2078fa23c68dcc9a9.md -->
# BEACNpool

**Proposal:** Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2)
**Vote:** Abstain
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: ab474223d40e2e3540555364be27e161a809c33651408f43d84acff10c0ba306#0
Recommendation: **ABSTAIN**
Score: `0.0` (base + flags + capped margin; LLM lean `+0.02` recorded, not added) | Confidence: `0.65` | Readiness: `0.5`
> Reasoning layer (deterministic-heuristic): Doctrine-aware offline lean for a parameter action: 8 well-supported claim(s), parameter doctrine demands elevated scrutiny. Net bounded adjustment +0.020 (clamped to ±0.05).

## Plain-language explanation (deterministic-heuristic)
BEACN records ABSTAIN on Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2). This is a conservative abstention because the evidence does not justify stronger certainty.

The action is a ParameterChange. The cached anchor describes the request as: Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2). The strongest grounded claim is: Intersect's Parameter Committee proposes a single Parameter Update governance action bundling two independent, previously recommended protocol parameter changes: 1.

Reason code: MISSING_PROTOCOL_READINESS_EVIDENCE.

## Review Tree
- overall_status: `incomplete`

### Intake
- status: `complete`
- finding: Action type: ParameterChange
- finding: Status: active
- finding: Proposed epoch: 646
- finding: Expires after epoch: 653
- finding: Treasury request: not specified
- finding: Anchor pinned locally: yes
- conclusion: Baseline fields and source anchors establish whether the proposal can be reviewed at all.

### Claims and evidence
- status: `complete`
- finding: Proposal anchor: pinned and replayable
- finding: Proposal document read by reasoning layer: yes
- finding: Snapshot freshness source: deep_research_dossiers.csv
- finding: Deep research dossier: not required
- finding: Requested: Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2)
- finding: Recipient: 
- finding: Stated amount: not stated in document
- finding: Deliverables: Intersect's Parameter Committee proposes a single Parameter Update governance action bundling two independent, previously recommended protocol parameter changes: 1., minPoolCost: decrease minPoolCost from 170,000,000 Lovelace (170 ada) to 75,000,000 Lovelace (75 ada), a decrease of approximately 55.9%., Plutus memory unit limits (Part 2 of 2): increase maxTxExecutionUnits[memory] from 16,500,000 to 17,500,000 units (+6.1%) and maxBlockExecutionUnits[memory] from 72,000,000 to 77,500,000 units (+7.6%), completing the two-step, cumulative 25% increase to bot..., These two changes are otherwise unrelated: one lowers the stake pool fixed-fee floor, the other increases Plutus script execution headroom.
- finding: Deadline/expiry: not stated in document
- finding: Claim (technical, independently_verifiable, high materiality): Intersect's Parameter Committee proposes a single Parameter Update governance action bundling two independent, previously recommended protocol parameter changes: 1.
- finding: Claim (technical, independently_verifiable, low materiality): minPoolCost: decrease minPoolCost from 170,000,000 Lovelace (170 ada) to 75,000,000 Lovelace (75 ada), a decrease of approximately 55.9%.
- finding: Claim (technical, independently_verifiable, low materiality): Plutus memory unit limits (Part 2 of 2): increase maxTxExecutionUnits[memory] from 16,500,000 to 17,500,000 units (+6.1%) and maxBlockExecutionUnits[memory] from 72,000,000 to 77,500,000 units (+7.6%), completing the two-step, cumulative 25% increase to bot...
- finding: Claim (technical, independently_verifiable, low materiality): These two changes are otherwise unrelated: one lowers the stake pool fixed-fee floor, the other increases Plutus script execution headroom.
- finding: Claim (technical, independently_verifiable, high materiality): minPoolCost was reduced from 340 ada to 170 ada in 2023 (PCP-001), but the relief that reduction provided has been substantially eroded by the continuing decline in reserve-funded block rewards: the delegator penalty on single-block pools, which fell to ~28...
- finding: Claim (technical, independently_verifiable, low materiality): IO Research's updated incentives report has also reversed its earlier position, now assessing that a high fixed-fee floor favours rather than deters Sybil-style stake fragmentation by large operators.
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
- finding: Flag count: 0
- missing: mitigation evidence
- missing: independent assurance
- missing: rollback/remedy path
- missing: dependency map
- conclusion: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.

### Counterargument pass
- status: `complete`
- finding: Strongest YES: the proposal substantiates "Intersect's Parameter Committee proposes a single Parameter Update governance action bundling two independent, previously recommended protocol parameter changes: 1." and clears the evidence gates.
- finding: Strongest NO: weak controls, unclear delivery, or governance precedent could outweigh the benefit of ParameterChange.
- finding: Strongest hold: if claims cannot be tied to replayable evidence, abstaining avoids overclaiming certainty.
- conclusion: A defensible rationale must show the best opposing case before it reaches a vote.

### Synthesis
- status: `ready`
- finding: Final vote must be derived from completed sections above, not from a prose summary.
- finding: The public rationale should name the decisive section and the strongest counterargument.
- conclusion: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Facts
- Pinned anchor document is available for this action.
- Protocol parameter changes carry system-wide risk.
- Intake: Action type: ParameterChange
- Claims and evidence: Proposal anchor: pinned and replayable
- Risk review: Execution risk: unknown
- Counterargument pass: Strongest YES: the proposal substantiates "Intersect's Parameter Committee proposes a single Parameter Update governance action bundling two independent, previously recommended protocol parameter changes: 1." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- Advisory model lean was +0.020 (display cap ±0.05) and had zero influence on the binding score: Doctrine-aware offline lean for a parameter action: 8 well-supported claim(s), parameter doctrine demands elevated scrutiny. Net bounded adjustment +0.020 (clamped to ±0.05).
- Intake: Baseline fields and source anchors establish whether the proposal can be reviewed at all.
- Claims and evidence: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.
- Risk review: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.
- Counterargument pass: A defensible rationale must show the best opposing case before it reaches a vote.
- Synthesis: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Uncertainty
- No DRep distribution available.
- Protocol action lacks a complete independently pinned readiness packet: constitutional_alignment_pass, impact_analysis_complete, rollback_or_containment_plan, safety_margin_clear
- Risk review missing: mitigation evidence
- Risk review missing: independent assurance
- Risk review status is thin.

## Reproducibility
- input_hash: `14a7a246f72257b647ec5ecf526270f2b5444eaf862dd63eb607d28fa3434ab1`
- snapshot_bundle_hash: `9c37e6d8f505c3fc2919d8960249d561d4fa7d8dc4fd9f866c1d015224ea6573`
- soul_commit: `c813ed97f64dba61150d01964327553baf720d38`
- soul_text_hash: `fa491ed711b9834e5a3c72d35903cec18afe8d93e1262f42ffcb20f5fce2c276`
- resource_registry_commit: `eb5bd214274157aaaaf6475f48d8cd3dd00981db`
- resources_used: `gov_actions_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents, governance_outcomes, protocol_readiness_profiles`
- snapshot_age_seconds: `0`
- uncertainty_band: `MEDIUM`
- evidence_depth_score: `3`
- decision_probs: `{"ABSTAIN": 0.4825, "NO": 0.2588, "YES": 0.2588}`
