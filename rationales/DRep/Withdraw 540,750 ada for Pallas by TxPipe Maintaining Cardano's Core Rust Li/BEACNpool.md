<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/6bbfae479d166c938d7885df.md -->
# BEACNpool

**Proposal:** Withdraw 540,750 ada for Pallas by TxPipe Maintaining Cardano's Core Rust Li
**Vote:** No
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8ssd0ztd8
Recommendation: **NO**
Score: `-0.3133` (raw `-0.2833` + doctrine-LLM nudge `-0.03`) | Confidence: `0.8333` | Readiness: `0.0`
> Reasoning layer (precomputed): The claims describe plausible public-benefit infrastructure and some independently verifiable governance and audit references, but the deterministic assessment remains blocked for missing budget, feasibility, risk, alternatives, and failure-mode analysis. Under BEACN's hierarchy, that evidence gap warrants a small cautionary nudge against spending rather than a positive lean.

## Plain-language explanation (codex-offline-review)
BEACN records NO on Withdraw 540,750 ada for Pallas by TxPipe: Maintaining Cardano's Core Rust Li.... The decisive concern is that the proposal's risks, precedent, or evidence gaps outweigh the case presented.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: Treasury withdrawal to fund Pallas by TxPipe: Maintaining Cardano's Core Rust Libraries, Year 2, including part-time maintenance over 12 months and Intersect administration.. The recorded treasury amount is 540,750. The strongest grounded claim is: The proposal requests 420,000 ADA plus a 105,000 ADA contingency reserve to fund a part-time Pallas maintainer over 12 months at an annual rate of $105,000 USD.

A material weak point is that this claim remains proposer-asserted or thinly supported: The proposal states that Pallas is shared infrastructure used by projects including Aiken, Dolos, Lucid, Oura, Mithril, Amaru, UTxO-RPC, and others. The blocking questions are: missing complete proposal summary; missing budget analysis; missing feasibility assessment.

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
- finding: Requested: Treasury withdrawal to fund Pallas by TxPipe: Maintaining Cardano's Core Rust Libraries, Year 2, including part-time maintenance over 12 months and Intersect administration.
- finding: Recipient: 2026 Treasury Reserve Smart Contract stake address stake1784sdxt6jjennmstphgdu7l7c2scf5d02a6cve2dgn5s2kq5u3j9v
- finding: Stated amount: 540,750
- finding: Deliverables: Essential maintenance of the Pallas codebase including dependency updates, Cardano protocol compatibility, performance improvements, bug fixing, and documentation., Community support including issue triage, review of external contributions, ecosystem-feedback-driven enhancements, and public communication with the developer community., Upgrade Pallas compatibility with AI-driven development workflows through AI-friendly documentation and integration resources., Milestone-based disbursement controls and reporting obligations through Intersect and third-party oversight.
- finding: Deadline/expiry: 12 months; new grant period begins after closure of the existing contract
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal requests 420,000 ADA plus a 105,000 ADA contingency reserve to fund a part-time Pallas maintainer over 12 months at an annual rate of $105,000 USD.
- finding: Claim (economic, supported_in_proposal, high materiality): The on-chain withdrawal amount is 540,750 ADA, consisting of 525,000 ADA for Pallas maintenance and enhancement plus a 15,750 ADA Intersect budget administration fee.
- finding: Claim (technical, supported_in_proposal, high materiality): Pallas is a collection of Rust crates re-implementing core Ouroboros and Cardano primitives including CBOR encoding, cryptographic operations, mini-protocol networking, multi-era ledger traversal, transaction building, and address handling.
- finding: Claim (adoption, proposer_asserted, high materiality): The proposal states that Pallas is shared infrastructure used by projects including Aiken, Dolos, Lucid, Oura, Mithril, Amaru, UTxO-RPC, and others.
- finding: Claim (adoption, independently_verifiable, medium materiality): The proposal reports Pallas has over 649 pull requests, 199 stars, 91 forks, 60 contributors, and 214,446 crates.io downloads, with links to the GitHub and crates.io pages.
- finding: Claim (technical, supported_in_proposal, high materiality): The maintainer work is organized into essential codebase maintenance, community support, and AI-friendly documentation and integration resources.
- missing: Independent evidence for: The proposal states that Pallas is shared infrastructure used by projects including Aiken, Dolos, Lucid, Oura, Mithril, Amaru, UTxO-RPC, and others.
- missing: Independent evidence for: The proposal states TxPipe has received funding through 30 Project Catalyst proposals across Funds 9 through 14, with 26 successfully delivered and 4 currently under development and on schedule.
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
- finding: Strongest YES: the proposal substantiates "The proposal requests 420,000 ADA plus a 105,000 ADA contingency reserve to fund a part-time Pallas maintainer over 12 months at an annual rate of $105,000 USD." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "The proposal states that Pallas is shared infrastructure used by projects including Aiken, Dolos, Lucid, Oura, Mithril, Amaru, UTxO-RPC, and others." — so cost or precedent may outweigh the benefit.
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
- Counterargument pass: Strongest YES: the proposal substantiates "The proposal requests 420,000 ADA plus a 105,000 ADA contingency reserve to fund a part-time Pallas maintainer over 12 months at an annual rate of $105,000 USD." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- Doctrine-aware reasoning layer nudged the score by -0.030 (clamped to ±0.05): The claims describe plausible public-benefit infrastructure and some independently verifiable governance and audit references, but the deterministic assessment remains blocked for missing budget, feasibility, risk, alternatives, and failure-mode analysis. Under BEACN's hierarchy, that evidence gap warrants a small cautionary nudge against spending rather than a positive lean.
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
- Claims and evidence missing: Independent evidence for: The proposal states that Pallas is shared infrastructure used by projects including Aiken, Dolos, Lucid, Oura, Mithril, Amaru, UTxO-RPC, and others.
- Claims and evidence missing: Independent evidence for: The proposal states TxPipe has received funding through 30 Project Catalyst proposals across Funds 9 through 14, with 26 successfully delivered and 4 currently under development and on schedule.
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
- input_hash: `5299290923807cec9a98846e593ee44e67c852edf47fe2b50717edd1f8ad6be8`
- snapshot_bundle_hash: `c0f2b8e2117e231e9e1163e8015de9545fbaadcff218020db0d238a0a7ac79f0`
- soul_commit: `8e5afeb10af64d4e1c9708d4029f95043c3f5354`
- soul_text_hash: `a8c48e8e59534bbaa71af9a923ef942aa2cda51cb9e259331cef24e0da27ae10`
- resource_registry_commit: `7d671706a9a739988611151bb93ebc1eebba6851`
- resources_used: `gov_actions_api, gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents`
- snapshot_age_seconds: `651`
- uncertainty_band: `HIGH`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.1914, "NO": 0.7642, "YES": 0.0443}`
