<!-- url: ipfs://QmUX6PXpyMhygajUNJZkKKU8s7yGv5e1AE7XiTYtFepNGK -->
# Ace Alliance

**Proposal:** The first node in the browser; a Cardano USP
**Vote:** Yes
**Voter ID:** `71aa5b3a9240a02a89c4e2839579ec5eb60c410af0a5bb483e1b8f04`

---

"The first node in the browser; a Cardano USP" (gov_action1guz68e8zkwphcdc8wnp40cclkv92qgnel7xnffmsmp2ljp09qtwqq596k4c) is a Treasury Withdrawal Governance Action requesting 4,600,000 ada to fund twelve months of engineering on Gerolamo, a TypeScript Cardano light node packaged as a browser extension, at a stated 5 FTE. As a Treasury Withdrawal it is governed by both the general proposal standards of Article II, Section 6 and the additional standards of Article II, Section 7. The proposer is Harmonic Laboratories, an independent R&D firm. Our review is confined to whether the action satisfies the Constitution. The strategic, competitive, and "USP" claims in the proposal text are matters of policy for DReps and the community to weigh, not questions of constitutionality.

**Article II.6.1 (Standardized Format and Immutable Anchor).** The action is submitted in a standardized, legible format and anchors an off-chain document at `ipfs://QmbQPrRhUUtvqNitu9mgC8esM3kXmR5iHGhEkLX1UZaLDy` with hash `444fb6a73db89d873a028eae85ce645f06965487901050bd46f6cacd8565eccc`. The IPFS content addressing makes the document immutable and allows any observer to confirm the on-chain action matches the final off-chain version.

**Article II.6.2 (Sufficient Rationale).** The proposal contains a title, an abstract, a detailed motivation and rationale, a budget breakdown, a milestone schedule with acceptance criteria, and supporting references. This satisfies the minimum content requirement.

**Article II.7.1 (Terms of the Withdrawal).** The proposal states the purpose (delivering a production-ready browser-based Cardano light node), a defined twelve-month delivery period (kickoff plus Q2 2026 through Q1 2027), and the relevant costs (5 FTE valued at 200,000 USD per FTE per year, plus a 15% refundable contingency, converted at 0.25 ADA/USD to a 4,600,000 ada total). Refund circumstances are specified through a contract-level "Failsafe Sweep" that returns unused funds to the Treasury after expiration and through the refundable nature of the 600,000 ada contingency reserve.

**Article II.7.2 (Disclosure of Prior Treasury Funding).** The proposal's own constitutionality checklist addresses Section 7.2 by pointing to a 2025 retrospective of past funding and deliverables. The constitutional requirement is disclosure, and the proposal provides that disclosure through its supporting materials. On the record before us, that is sufficient.

**Article II.7.3 (Net Change Limit).** A Net Change Limit must be set and must not be exceeded. The 350M ADA NCL for the period spanning epochs 613 to 713 is treated as set and active. The 4,600,000 ada requested here is well within that limit.

**Article II.7.4 (Audit Allocation).** The proposal allocates funding, within the FTE cost structure, for a periodic independent financial audit performed by a third party with no operational involvement in HLabs, conducted on a quarterly basis with a final assessment, and scoped to ex-post verification of treasury disbursements and traceability of fund flows. This satisfies the requirement to allocate ada for periodic independent audits and oversight metrics.

**Article II.7.5 (Administrators).** The proposal designates an Independent Oversight Board (Santiago Carmuega, Lucas Rosa, and Chris Gianelloni) responsible for reviewing milestones, co-signing disbursements, and halting funding if deliverables are not met. These named administrators are responsible for monitoring fund usage and ensuring deliverables are achieved.

**Article II.7.6 (Custody and Delegation).** Funds are held in the audited SundaeLabs treasury-contracts escrow (`treasury.ak` / `vendor.ak`) in separate, on-chain-auditable accounts. The contract enforces auto-abstain DRep delegation and prohibits SPO delegation for all escrowed funds. This satisfies the separate-account and abstain-delegation requirements.

**Appendix I.3 (Treasury Guardrails).** TREASURY-01a is met because the NCL was set by DReps via on-chain governance action exceeding the 50% threshold. TREASURY-02a is met because the 4,600,000 ada withdrawal does not exceed that limit. TREASURY-03a is met because the withdrawal is denominated in ada. No other guardrail group is engaged.
