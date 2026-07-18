<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/09275da26052cc6df25b98ff.md -->
# BEACNpool

**Proposal:** Withdraw 1,162,746 ada for MLabs Core Tool Maintenance & Enhancement Plutarc
**Vote:** Yes
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: b3d452bff7769d7f557ec6b8974760ee6c5e496c276652b654032966621e0ccf#6
Recommendation: **YES**
Score: `0.12` (raw `-0.08` + doctrine-LLM nudge `+0.0`) | Confidence: `0.75` | Readiness: `0.85`
> Reasoning layer (precomputed): The supplied claims show a plausible public-benefit infrastructure case with some independently verifiable governance, benchmark, NCL, prior-funding, and contract-management references, but core adoption counts and expected maintenance impact remain largely proposer asserted and the cost justification is not detailed beyond the work-package total. The deterministic assessment is already ready, so no additional directional nudge is warranted.

## Plain-language explanation (deterministic-heuristic)
BEACN records YES on Withdraw 1,162,746 ada for MLabs Core Tool Maintenance & Enhancement: Plutarc. The deterministic gates found enough evidence and no decisive blocker.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: Annual funding for maintenance and enhancement of Plutarch and Ply, including compatibility, bug fixes, optimizations, documentation, examples, technical blog posts, and developer-experience improvements. It asks the treasury for 1,162,746 ADA. The strongest grounded claim is: Plutarch is a Haskell eDSL for creating efficient Cardano smart contracts through controlled compilation into UPLC, and Ply serializes Plutarch scripts to and from CIP-57 blueprint-style artifacts with inferred types.

A residual watch item: this claim remains proposer-asserted rather than independently shown: MLabs states that Plutarch and Ply have been used throughout the Cardano ecosystem and that a recent internal audit counted at least 26 teams using them.

## Review Tree
- overall_status: `incomplete`

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
- finding: Snapshot freshness source: deep_research_dossiers.csv
- finding: Deep research dossier: complete
- finding: Requested: Annual funding for maintenance and enhancement of Plutarch and Ply, including compatibility, bug fixes, optimizations, documentation, examples, technical blog posts, and developer-experience improvements.
- finding: Recipient: Intersect on behalf of MLabs / vendor, with funds directed to the 2026 Treasury Reserve Smart Contract stake address.
- finding: Stated amount: 1,162,746
- finding: Deliverables: WP1 - Plutarch and Ply Maintenance, Compatibility & Developer Experience, Critical breakages and serious vulnerabilities response, Protocol-era and hard-fork compatibility, Bug fixes, correctness improvements, and optimizations, Documentation, examples, technical blog posts, and developer-experience improvements
- finding: Deadline/expiry: not stated in document
- finding: Claim (technical, supported_in_proposal, high materiality): Plutarch is a Haskell eDSL for creating efficient Cardano smart contracts through controlled compilation into UPLC, and Ply serializes Plutarch scripts to and from CIP-57 blueprint-style artifacts with inferred types.
- finding: Claim (adoption, proposer_asserted, high materiality): MLabs states that Plutarch and Ply have been used throughout the Cardano ecosystem and that a recent internal audit counted at least 26 teams using them.
- finding: Claim (adoption, proposer_asserted, medium materiality): The rationale separately states that MLabs conservatively counted at least 15 teams building with Plutarch and Ply.
- finding: Claim (technical, independently_verifiable, medium materiality): MLabs claims public cross-language benchmarks show Plutarch scripts rank among the smallest in the benchmark suite while requiring comparatively low on-chain compute and memory.
- finding: Claim (technical, proposer_asserted, high materiality): The proposal says the requested funding will help keep Plutarch and Ply reliable, compatible, and useful as Cardano ledger, Plutus, and tooling evolve, including possible Dijkstra-era compatibility if relevant changes land during the funding period.
- finding: Claim (governance, independently_verifiable, high materiality): The proposal states it achieved the required 67% support threshold during the 2026 Intersect Budget Process Hydra Voting phase and was advanced for on-chain Treasury Withdrawal submission under the approved Budget Process Framework.
- missing: Independent evidence for: MLabs states that Plutarch and Ply have been used throughout the Cardano ecosystem and that a recent internal audit counted at least 26 teams using them.
- missing: Independent evidence for: The rationale separately states that MLabs conservatively counted at least 15 teams building with Plutarch and Ply.
- missing: Independent evidence for: The proposal says the requested funding will help keep Plutarch and Ply reliable, compatible, and useful as Cardano ledger, Plutus, and tooling evolve, including possible Dijkstra-era compatibility if relevant changes land during the funding period.
- conclusion: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.

### Treasury analysis
- status: `complete`
- finding: Requested ADA: 1162746
- finding: Budget granularity: confirmed
- finding: Milestone payment gates: confirmed
- finding: Clawback/refund path: unknown
- finding: Cost/benefit clarity: unknown
- finding: Recurring funding dependency: unknown
- finding: Six-month treasury flow regime: stressed (basis: total inflow (tau + donations) vs enacted withdrawals)
- finding: Financial confidence: 0.58
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
- finding: Rollback/remedy path: unknown
- finding: Flag count: 1
- missing: independent assurance
- missing: rollback/remedy path
- missing: dependency map
- conclusion: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.

### Counterargument pass
- status: `complete`
- finding: Strongest YES: the proposal substantiates "Plutarch is a Haskell eDSL for creating efficient Cardano smart contracts through controlled compilation into UPLC, and Ply serializes Plutarch scripts to and from CIP-57 blueprint-style artifacts with inferred types." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "MLabs states that Plutarch and Ply have been used throughout the Cardano ecosystem and that a recent internal audit counted at least 26 teams using them." — so cost or precedent may outweigh the benefit.
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
- Treasury analysis: Requested ADA: 1162746
- Risk review: Execution risk: unknown
- Counterargument pass: Strongest YES: the proposal substantiates "Plutarch is a Haskell eDSL for creating efficient Cardano smart contracts through controlled compilation into UPLC, and Ply serializes Plutarch scripts to and from CIP-57 blueprint-style artifacts with inferred types." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- DRep ratification support is material but below threshold; treated as a modest context signal.
- Directional YES cleared ecosystem benefit, delivery, cost-efficiency, downside-protection, and portfolio-capacity floors.
- Intake: Baseline fields and source anchors establish whether the proposal can be reviewed at all.
- Claims and evidence: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.
- Treasury analysis: Treasury votes require a higher bar because they consume shared ADA and create precedent.
- Risk review: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.
- Counterargument pass: A defensible rationale must show the best opposing case before it reaches a vote.
- Synthesis: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Uncertainty
- Treasury flow signal is in stressed regime (total inflow (tau + donations) vs enacted withdrawals).
- Claims and evidence missing: Independent evidence for: MLabs states that Plutarch and Ply have been used throughout the Cardano ecosystem and that a recent internal audit counted at least 26 teams using them.
- Claims and evidence missing: Independent evidence for: The rationale separately states that MLabs conservatively counted at least 15 teams building with Plutarch and Ply.
- Claims and evidence status is thin.
- Treasury analysis missing: sustainability path
- Treasury analysis missing: cost-benefit clarity
- Risk review missing: independent assurance
- Risk review missing: rollback/remedy path

## Reproducibility
- input_hash: `e5bec8a9357911e6d13bc190c4fee101926ece04d865e8e0f14bf6a01cc8cdaa`
- snapshot_bundle_hash: `1c2d0cd642a777e2d4fd53a788285b9e479b4169cd50ecc3f6e22f621ba653aa`
- soul_commit: `d866057afd0ecaf599eb0202220b1ec8339b9b09`
- soul_text_hash: `a8c48e8e59534bbaa71af9a923ef942aa2cda51cb9e259331cef24e0da27ae10`
- resource_registry_commit: `4d394ccfc21657ebcbf2e1dbb3e210682b5ea383`
- resources_used: `gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents, deep_research_dossiers, ecosystem_value_profiles, treasury_policy_state, treasury_portfolio, governance_outcomes, protocol_readiness_profiles`
- snapshot_age_seconds: `3`
- uncertainty_band: `MEDIUM`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.2263, "NO": 0.1263, "YES": 0.6475}`
