<!-- url: https://beacnpool.github.io/beacn-drep-web/data/output/public/r/533333ea6036c4f07c9eb5d6.md -->
# BEACNpool

**Proposal:** Withdraw 1,684,050 ada for Tx3 by TxPipe Open API Layer for Cardano's dApp P
**Vote:** No
**Voter ID:** `drep1yg3fzjm63hjg37k3rtdt7wx0mgmn303lwv2s50xxkjzsv5qfhynxg`

---

# Rationale: gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8sj72rg72
Recommendation: **NO**
Score: `-0.3133` (raw `-0.2833` + doctrine-LLM nudge `-0.03`) | Confidence: `0.8333` | Readiness: `0.0`
> Reasoning layer (precomputed): The extracted claims show plausible public-benefit ecosystem growth and some independently checkable governance references, but the deterministic assessment is blocked by missing budget, feasibility, risk, alternatives, and failure-mode analysis for a large treasury withdrawal. Under the doctrine, weak or incomplete evidence on a significant spend justifies a small cautionary nudge rather than rewarding plausible adoption upside.

## Plain-language explanation (codex-offline-review)
BEACN records NO on Withdraw 1,684,050 ada for Tx3 by TxPipe: Open API Layer for Cardano's dApp P.... The decisive concern is that the proposal's risks, precedent, or evidence gaps outweigh the case presented.

The action is a TreasuryWithdrawals. The cached anchor describes the request as: Fund Tx3 by TxPipe: an open API layer for Cardano dApp protocols with developer and agent-facing infrastructure.. The recorded treasury amount is 1,684,050. The strongest grounded claim is: The proposal requests 1,308,000 ADA plus a 327,000 ADA contingency reserve over 12 months, with a total withdrawal of 1,684,050 ADA including a 49,050 ADA Intersect Budget Administration fee.

A material weak point is that this claim remains proposer-asserted or thinly supported: Tx3 is intended to provide a single standardized interface so developers or AI agents can discover, integrate, and compose Cardano protocols through one consistent surface. The blocking questions are: missing complete proposal summary; missing budget analysis; missing feasibility assessment.

## Review Tree
- overall_status: `blocked`

### Intake
- status: `complete`
- finding: Action type: TreasuryWithdrawals
- finding: Status: active
- finding: Proposed epoch: 638
- finding: Expires after epoch: 645
- finding: Treasury request: 1.68M ADA
- finding: Anchor pinned locally: yes
- conclusion: Baseline fields and source anchors establish whether the proposal can be reviewed at all.

### Claims and evidence
- status: `thin`
- finding: Proposal anchor: pinned and replayable
- finding: Proposal document read by reasoning layer: yes
- finding: Snapshot freshness source: manifest
- finding: Deep research dossier: required
- finding: Requested: Fund Tx3 by TxPipe: an open API layer for Cardano dApp protocols with developer and agent-facing infrastructure.
- finding: Recipient: 2026 Treasury Reserve Smart Contract stake address stake1784sdxt6jjennmstphgdu7l7c2scf5d02a6cve2dgn5s2kq5u3j9v
- finding: Stated amount: 1,684,050
- finding: Deliverables: Open standardized interface across Cardano on-chain protocols, Documentation, auto-generated multi-language SDKs, and live JSON-RPC endpoints, Agent-first documentation, Protocol skills packaging operations, MCP server for agents to discover and call published protocols, 12 additional protocol onboardings, 3 per quarter, with developer and agent coverage
- finding: Deadline/expiry: 12 months
- finding: Claim (economic, supported_in_proposal, high materiality): The proposal requests 1,308,000 ADA plus a 327,000 ADA contingency reserve over 12 months, with a total withdrawal of 1,684,050 ADA including a 49,050 ADA Intersect Budget Administration fee.
- finding: Claim (technical, proposer_asserted, high materiality): Tx3 is intended to provide a single standardized interface so developers or AI agents can discover, integrate, and compose Cardano protocols through one consistent surface.
- finding: Claim (adoption, proposer_asserted, high materiality): The proposer states that Cardano currently lacks a common interface mechanism across the ecosystem, forcing integrators to relearn each protocol and raising integration costs.
- finding: Claim (technical, proposer_asserted, high materiality): The proposal says Tx3 describes each protocol once with a verified interface definition that produces documentation, auto-generated SDKs in multiple languages, and live JSON-RPC endpoints.
- finding: Claim (adoption, independently_verifiable, medium materiality): The proposer states that Catalyst Fund 14 has already put the Tx3 developer layer into production with 5 protocols live on the Tx3 Protocol Registry at https://tx3.land.
- finding: Claim (technical, supported_in_proposal, high materiality): The proposal funds 12 additional protocol onboardings, 3 per quarter, plus development of an MCP server and skill framework as shared infrastructure for all protocols on the registry.
- missing: Independent evidence for: Tx3 is intended to provide a single standardized interface so developers or AI agents can discover, integrate, and compose Cardano protocols through one consistent surface.
- missing: Independent evidence for: The proposer states that Cardano currently lacks a common interface mechanism across the ecosystem, forcing integrators to relearn each protocol and raising integration costs.
- missing: Independent evidence for: The proposal says Tx3 describes each protocol once with a verified interface definition that produces documentation, auto-generated SDKs in multiple languages, and live JSON-RPC endpoints.
- missing: Independent evidence for: The document states audit and oversight are covered through Intersect administration, technically capable third parties, reporting obligations, and milestone-based disbursement controls.
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
- finding: Requested ADA: 1.68M ADA
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
- finding: Strongest YES: the proposal substantiates "The proposal requests 1,308,000 ADA plus a 327,000 ADA contingency reserve over 12 months, with a total withdrawal of 1,684,050 ADA including a 49,050 ADA Intersect Budget Administration fee." and clears the evidence gates.
- finding: Strongest NO: a material claim is unsupported — "Tx3 is intended to provide a single standardized interface so developers or AI agents can discover, integrate, and compose Cardano protocols through one consistent surface." — so cost or precedent may outweigh the benefit.
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
- Treasury analysis: Requested ADA: 1.68M ADA
- Risk review: Execution risk: unknown
- Counterargument pass: Strongest YES: the proposal substantiates "The proposal requests 1,308,000 ADA plus a 327,000 ADA contingency reserve over 12 months, with a total withdrawal of 1,684,050 ADA including a 49,050 ADA Intersect Budget Administration fee." and clears the evidence gates.
- Synthesis: Final vote must be derived from completed sections above, not from a prose summary.

## Inferences
- Doctrine-aware reasoning layer nudged the score by -0.030 (clamped to ±0.05): The extracted claims show plausible public-benefit ecosystem growth and some independently checkable governance references, but the deterministic assessment is blocked by missing budget, feasibility, risk, alternatives, and failure-mode analysis for a large treasury withdrawal. Under the doctrine, weak or incomplete evidence on a significant spend justifies a small cautionary nudge rather than rewarding plausible adoption upside.
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
- Claims and evidence missing: Independent evidence for: Tx3 is intended to provide a single standardized interface so developers or AI agents can discover, integrate, and compose Cardano protocols through one consistent surface.
- Claims and evidence missing: Independent evidence for: The proposer states that Cardano currently lacks a common interface mechanism across the ecosystem, forcing integrators to relearn each protocol and raising integration costs.
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
- input_hash: `17ba3129d7451bd908bf7fdcd301b9ceecc3a8a77afd5d57b50f90936071a786`
- snapshot_bundle_hash: `5cb3efa344be967410c4012b79d43e9bec5c2dd4ea3e801cbd55638dcb30ad34`
- soul_commit: `8e5afeb10af64d4e1c9708d4029f95043c3f5354`
- soul_text_hash: `a8c48e8e59534bbaa71af9a923ef942aa2cda51cb9e259331cef24e0da27ae10`
- resource_registry_commit: `7d671706a9a739988611151bb93ebc1eebba6851`
- resources_used: `gov_actions_api, gov_actions_snapshot, treasury_withdrawals_snapshot, drep_vote_history_snapshot, gov_actions_all_snapshot, gov_actions_active_snapshot, gov_treasury_recipients_snapshot, gov_action_flags_snapshot, gov_poll_runs_snapshot, top_drep_votes_snapshot, gov_anchor_documents`
- snapshot_age_seconds: `651`
- uncertainty_band: `HIGH`
- evidence_depth_score: `4`
- decision_probs: `{"ABSTAIN": 0.1914, "NO": 0.7642, "YES": 0.0443}`
