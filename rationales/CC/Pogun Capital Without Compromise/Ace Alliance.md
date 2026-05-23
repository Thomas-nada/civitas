<!-- url: ipfs://QmYc6w34anx4Mmz4rLH9Td7cxeUSKsGheiJFgoTJ9dTZ6z -->
# Ace Alliance

**Proposal:** Pogun Capital Without Compromise
**Vote:** Yes
**Voter ID:** `71aa5b3a9240a02a89c4e2839579ec5eb60c410af0a5bb483e1b8f04`

---

This Treasury Withdrawal Governance Action (TWGA) requests ₳12,290,000 (approximately $2,950,000 USD at a reference rate of $0.24/ada) to fund a twelve-month delivery program (Q2 2026 through Q1 2027) for the Pogun protocol: a non-margin peer-to-peer credit market, an integrated yield application, and a BitVM-based trust-minimized Bitcoin bridge. Pogun is developed by Input Output, and pursuant to Section 6.4 of the proposal, a written off-chain Legal Contract will be entered into between Input Output and Cardano Development Holdings, administered by Intersect.

**Article II.6.1 (Metadata Format).** The metadata is hosted at an immutable IPFS anchor (`ipfs://QmVdGh1cXgsMXGRS7mzxurxtkaqhU7VJMjx4piNSSHrBs2`) and the anchor hash (`32e2975fc7645b394806fc26651f558bb90a20705a606298633c66f8c6798168`) is recorded on-chain. Post-submission tampering is cryptographically foreclosed. The proposal conforms to CIP-108 structure.

**Article II.6.2 (Sufficient Rationale).** The proposal provides a title, abstract, motivation, full rationale across credit market, yield application, and bridge components, a governance and advisory structure, a technical specification, a financial model, KPIs against Vision 2030 targets, phased deliverables and milestones, a budget and administration framework, prior funding disclosure, and a reporting commitment. The required minimum content is present.

**Article II.7.1 (Terms of the Withdrawal).** The proposal specifies the purpose (delivery of the three Pogun components, plus operations and yield expansion readiness). The delivery period is Q2 2026 through Q1 2027, broken into four sequential phases each tied to a tranche disbursement. Relevant costs are itemized in Section 6.2 across five categories (Product/Engineering/R&D 51%, Growth 19%, Security Audits 13%, Legal & Compliance 10%, Ops & Infrastructure 7%). Refund circumstances are enumerated in Section 6.5 across five distinct triggers: milestone failure with no remediation within 90 days, team dissolution, fundamental technical infeasibility of the BitVM bridge as determined by independent technical review, voluntary termination, and partial delivery. The terms requirement is satisfied.

**Article II.7.2 (Prior Funding Disclosure).** Section 7 of the proposal discloses that no prior treasury funds have been directed toward Pogun specifically, and separately discloses Input Output's broader treasury funding history across five workstreams (Blockfrost, Catalyst, IOE, IOR, Governance), totalling ₳130,708,860 allocated with ₳78,459,777 received to date, each with its corresponding governance action identifier. The Constitution requires disclosure, not absence, of prior funding; the disclosure requirement is satisfied.

**Article II.7.3 (Net Change Limit).** A Net Change Limit of 350,000,000 ada covering epochs 613 to 713 is in effect. The 12,290,000 ada requested in this proposal does not exceed the remaining NCL balance.

**Article II.7.4 (Periodic Independent Audits and Oversight Metrics).** The proposal allocates 13% of the total budget (₳1,597,700 / $383,500) to security audits, including a TxPipe formal audit of the credit market smart contracts (Phase 1, with completion expected by 27 May 2026), independent audits for bridge contracts, proof circuits, and operator software (Phase 3), and ongoing third-party assurer review of milestone completion (Section 6.4, funded from this withdrawal). Oversight metrics are implemented through Intersect's delivery assurance function, an on-chain TRSC/PSSC framework with a five-member Oversight Committee (Sundae Labs, Cardano Foundation, Dquadrant, Xerberus, NMKR) providing checks and balances on Intersect administration, and a community-auditable dashboard. Quarterly reporting (Section 8) covers fund usage, milestone status, and on-chain reconciliation of treasury return payments.

**Article II.7.5 (Designated Administrator).** Intersect is designated as administrator pursuant to a Legal Contract with Cardano Development Holdings. Administrative actions over the Treasury Reserve Smart Contract and Project-Specific Smart Contracts require multi-party authorization across Intersect admins, Intersect leadership, and the external Oversight Committee, with thresholds varying by action type (Fund, Disperse, Pause/Resume, Sweep, Reorganize). A third-party assurer signs off milestone completion at each phase gate.

**Article II.7.6 (Custody and Delegation).** Section 6.5 states that all administrator-held ada will be kept in separate, community-auditable accounts. Section 6.4 specifies that all instances of the TRSC and PSSCs cannot be staked with an SPO and will be delegated to the auto-abstain predefined DRep. This has been verified. The proposal cites the existing 2025 TRSC reserve contract address (`stake17xzc8pt7fgf0lc0x7eq6z7z6puhsxmzktna7dluahrj6g6ghh5qjr`) and contemplates migration to a 2026 reserve contract via the on-chain disburse action. This satisfies the custody and neutrality requirements.

**Appendix I (Guardrails).**

* TREASURY-02a: The 12,290,000 ada requested does not exceed the 350M ada NCL.
* TREASURY-03a: The withdrawal is denominated in ada as required.
