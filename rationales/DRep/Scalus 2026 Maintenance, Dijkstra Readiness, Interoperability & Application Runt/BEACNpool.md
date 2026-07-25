<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/7e2b12c1734fb0a735fe473b.md -->
# BEACNpool

**Proposal:** Scalus 2026 Maintenance, Dijkstra Readiness, Interoperability & Application Runt
**Vote:** Yes
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: 3234567a3f48ace25efc150f1369192615974e232ea06e0251701831d9e4486d#0
Recommendation: **YES**
Score: `0.2615` (raw `-0.11` + doctrine-LLM nudge `+0.02`) | Confidence: `0.7854` | Readiness: `0.85`
> Reasoning layer (precomputed): A small positive nudge is justified because the claims describe maintenance of existing open-source infrastructure, a narrowed scope versus the prior proposal, no contingency, milestone delivery, and concrete technical deliverables tied to protocol readiness. The nudge remains small because important adoption and oversight claims are mostly asserted in the document rather than evidenced there, and treasury stewardship still requires caution on a large withdrawal.

## Plain-language explanation (deterministic-heuristic)
BEACN records YES on Scalus 2026: Maintenance, Dijkstra Readiness, Interoperability & Application Runtime. The deterministic gates found enough evidence and no decisive blocker.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: Funding for a 9-month continuation of Scalus covering maintenance, Dijkstra hard-fork readiness, interoperability across JVM and JS/TS ecosystems, and a scoped application runtime. It asks the treasury for 2464844 ADA. The strongest grounded claim is: Scalus is an open-source Cardano development platform built by Lantr Engineering over three years of continuous delivery.

A residual watch item: this claim remains proposer-asserted rather than independently shown: Scalus is used directly by Gummiworm L2, Bifrost, SugarRush, Vela, and DID/DIDComm projects.

## Review Tree
- overall_status: `incomplete`

### Intake
- status: `complete`
- finding: Action type: TreasuryWithdrawals
- finding: Status: active
- finding: Proposed epoch: 640
- finding: Expires after epoch: 647
- finding: Treasury request: 2.46M ADA
- finding: Anchor pinned locally: yes
- conclusion: Baseline fields and source anchors establish whether the proposal can be reviewed at all.

### Claims and evidence
- status: `thin`
- finding: Proposal anchor: pinned and replayable
- finding: Proposal document read by reasoning layer: yes
- finding: Snapshot freshness source: deep_research_dossiers.csv
- finding: Deep research dossier: complete
- finding: Requested: Funding for a 9-month continuation of Scalus covering maintenance, Dijkstra hard-fork readiness, interoperability across JVM and JS/TS ecosystems, and a scoped application runtime.
- finding: Recipient: Lantr Engineering / Scalus
- finding: Stated amount: 2464844
- finding: Deliverables: Ongoing maintenance including bug fixes, dependency upkeep, security patches, and releases, Dijkstra readiness including Plutus V4 support, ledger rules, transaction-builder updates, cost models, nested transactions, accounts, guard scripts, and conformance testing, Improved JS/TS interfaces and documentation for Scalus components embedded in MeshJS, Evolution SDK, and Lucid Evolution, Java/Kotlin integration examples and cleaner integration paths with Cardano Client Lib and Yaci, Scoped runtime components including reactive workers, chain follower, task scheduler, backend workflows, and reference validation
- finding: Deadline/expiry: March 2027
- finding: Claim (technical, supported_in_proposal, high materiality): Scalus is an open-source Cardano development platform built by Lantr Engineering over three years of continuous delivery.
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal asks for ₳2,464,844 over 9 months at a $0.16/ADA reference rate with no contingency.
- finding: Claim (adoption, proposer_asserted, high materiality): Scalus is used directly by Gummiworm L2, Bifrost, SugarRush, Vela, and DID/DIDComm projects.
- finding: Claim (adoption, proposer_asserted, high materiality): Scalus components are reused in MeshJS SDK, Evolution SDK, Lucid Evolution, Cardano Client Lib, and YaciDevKit.
- finding: Claim (adoption, independently_verifiable, medium materiality): The proposer reports three years of development, 4,642 commits, 32 releases, 12 contributors, and 20,000+ monthly Scalus.js downloads.
- finding: Claim (economic, supported_in_proposal, high materiality): This resubmission reduces the prior proposal from ₳8.503M over 12 months to about ₳2.465M over 9 months and narrows scope by removing the standalone L1 node, full L2 integration, broad formal verification, and advanced devnet expansion.
- missing: Independent evidence for: Scalus is used directly by Gummiworm L2, Bifrost, SugarRush, Vela, and DID/DIDComm projects.
- missing: Independent evidence for: Scalus components are reused in MeshJS SDK, Evolution SDK, Lucid Evolution, Cardano Client Lib, and YaciDevKit.
- missing: Independent evidence for: Delivery is described as milestone-based and administered through audited SundaeSwap treasury contracts with an independent oversight board and third-party assurance.
- missing: Independent evidence for: Lantr Engineering says it will commit to public reporting, open community sessions, and on-time milestone delivery for treasury-funded work.
- conclusion: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.

### Treasury analysis
- status: `complete`
- finding: Requested ADA: 0
- finding: Budget granularity: confirmed
- finding: Milestone payment gates: confirmed
- finding: Clawback/refund path: confirmed
- finding: Cost/benefit clarity: confirmed
- finding: Recurring funding dependency: unknown
- finding: Six-month treasury flow regime: stressed (basis: total inflow (tau + donations) vs enacted withdrawals)
- finding: Financial confidence: 0.82
- missing: sustainability path
- conclusion: Treasury votes require a higher bar because they consume shared ADA and create precedent.

### Risk review
- status: `complete`
- finding: Execution risk: medium
- finding: Governance risk: medium
- finding: Technical risk: medium
- finding: Treasury exposure risk: medium
- finding: Mitigation evidence: confirmed
- finding: Independent assurance: not confirmed
- finding: Rollback/remedy path: confirmed
- finding: Flag count: 1
- missing: independent assurance
- missing: dependency map
- conclusion: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.

### Counterargument pass
- status: `complete`
- finding: Strongest YES: the proposal substantiates "Scalus is an open-source Cardano development platform built by Lantr Engineering over three years of continuous delivery." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "Scalus is used directly by Gummiworm L2, Bifrost, SugarRush, Vela, and DID/DIDComm projects." — so cost or precedent may outweigh the benefit.
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
- Treasury analysis: Requested ADA: 0
- Risk review: Execution risk: medium
- Counterargument pass: Strongest YES: the proposal substantiates "Scalus is an open-source Cardano development platform built by Lantr Engineering over three years of continuous delivery." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- Advisory model lean was +0.020 (display cap ±0.05) and had zero influence on the binding score: A small positive nudge is justified because the claims describe maintenance of existing open-source infrastructure, a narrowed scope versus the prior proposal, no contingency, milestone delivery, and concrete technical deliverables tied to protocol readiness. The nudge remains small because important adoption and oversight claims are mostly asserted in the document rather than evidenced there, and treasury stewardship still requires caution on a large withdrawal.
- Directional YES cleared ecosystem benefit, delivery, cost-efficiency, downside-protection, and portfolio-capacity floors.
- Intake: Baseline fields and source anchors establish whether the proposal can be reviewed at all.
- Claims and evidence: Each claim must map to replayable public evidence; proposer assertions alone are not enough for confidence.
- Treasury analysis: Treasury votes require a higher bar because they consume shared ADA and create precedent.
- Risk review: Risk is not a side note; unmitigated execution or governance risk can dominate an otherwise attractive proposal.
- Counterargument pass: A defensible rationale must show the best opposing case before it reaches a vote.
- Synthesis: The vote is only credible if the assessment tree shows enough work for a skeptical delegator to audit.

## Uncertainty
- Treasury flow signal is in stressed regime (total inflow (tau + donations) vs enacted withdrawals).
- DRep ratification support is below threshold; this is not treated as active opposition.
- Claims and evidence missing: Independent evidence for: Scalus is used directly by Gummiworm L2, Bifrost, SugarRush, Vela, and DID/DIDComm projects.
- Claims and evidence missing: Independent evidence for: Scalus components are reused in MeshJS SDK, Evolution SDK, Lucid Evolution, Cardano Client Lib, and YaciDevKit.
- Claims and evidence status is thin.
- Treasury analysis missing: sustainability path
- Risk review missing: independent assurance
- Risk review missing: dependency map

## Reproducibility
- input_hash: `7dfde31a646a08a0808f010a20549d4665b76640fb04fdea5244566dd3cefefc`
- snapshot_bundle_hash: `c485419ca85814a7f5c84697005b5a6dca954414e902cc958e7f38f8b60a7c2d`
- soul_commit: `d866057afd0ecaf599eb0202220b1ec8339b9b09`
- soul_text_hash: `a8c48e8e59534bbaa71af9a923ef942aa2cda51cb9e259331cef24e0da27ae10`
- resource_registry_commit: `45e29dd06273ee8ec35264b00dafd2aa30667f62`
- resources_used: `gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents, deep_research_dossiers, ecosystem_value_profiles, treasury_policy_state, treasury_portfolio, governance_outcomes, protocol_readiness_profiles`
- snapshot_age_seconds: `1`
- uncertainty_band: `MEDIUM`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.2074, "NO": 0.0467, "YES": 0.7459}`
