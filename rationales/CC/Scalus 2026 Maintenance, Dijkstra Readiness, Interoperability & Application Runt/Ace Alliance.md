<!-- url: ipfs://Qmdkc6hEJxj91JxtE5ZDiew3APWoXdbJz5GyE28RxRYM1M -->
# Ace Alliance

**Proposal:** Scalus 2026 Maintenance, Dijkstra Readiness, Interoperability & Application Runt
**Vote:** Yes
**Voter ID:** `71aa5b3a9240a02a89c4e2839579ec5eb60c410af0a5bb483e1b8f04`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: ipfs://QmY46q1kGKQ9eaK3nBtmZkCAb6YWePAfYZsnpNrtKdR7w7

"Scalus 2026: Maintenance, Dijkstra Readiness, Interoperability & Application Runtime" (gov_action1xg69v73lfzkwyhhuz583x6geyc2ewn3r96sxuqj3wqvrrk0yfpksqqa63yc) is a Treasury Withdrawals Governance Action and is therefore governed by both the general proposal standards in Article II, Section 6 and the additional Treasury Withdrawal standards in Article II, Section 7 of the Cardano Constitution. The Action seeks to withdraw 2,464,844 ada from the Cardano Treasury, budgeted at a conservative 0.16 USD per ada planning rate with no contingency, to fund nine months of Scalus maintenance, Dijkstra hard fork readiness, and interoperability work across the JVM and JavaScript and TypeScript toolchains. The vendor is Lantr Engineering, the sole delivery party, which has built Scalus for three years. This is a reduced resubmission: the prior Scalus Treasury Withdrawal expired without ratification, and this version cuts the ask from 4,500,000 ada over twelve months to 2,464,844 ada over nine, removing the L1 node scope and third-party dependencies.

**Article II.6 (Governance Action Standards).** The procedural standards are satisfied. The action anchors to an IPFS-hosted document with the on-chain blake2b-256 hash e6b117c2522a69b1b693dd863181aa42b86d71fc928b5b5d40cc906d43515500, a content-addressed form that is immutable once posted, and the metadata supplies the title, abstract, motivation, rationale, itemized budget, quarterly milestone plan, and supporting references that Article II.6.2 requires.

**Article II.7.1 (Terms of the Withdrawal).** The terms-of-withdrawal requirement is met, and the refund prong is enforced at the contract level rather than promised in prose. The proposal specifies the purpose (the maintenance, Dijkstra readiness, and interoperability scope enumerated above), a nine-month delivery period on quarterly milestones, itemized costs, and the circumstances of refund: the escrow's Sweep action returns unused funds early with the signature of the vendor and any one oversight board member, and funds remaining in the contract after expiration sweep back to the Cardano Treasury automatically, enforced at the contract level and incapable of being overridden.

**Article II.7.2 (Prior Treasury Funding Disclosure).** The disclosure requirement is satisfied. The proposal discloses, in tabular form with identifiers, Lantr Engineering's 657,692 ada 2025 Treasury Budget receipt for the Scalus DApps Development Platform and three prior Project Catalyst awards for Scalus across Funds 11 and 13.

**Article II.7.3 (Net Change Limit).** A Net Change Limit of 500,000,000 ada is in force for the period spanning epochs 613 through 713, agreed by the DReps through the Net Change Limit Info Action (gov_action15atytcy8ru7mkcs8m7r8mx7k5x36t0h6grtgmak6v5wmf4nq07lsqhakceq) at the greater-than-50-percent active voting stake threshold TREASURY-01a requires, superseding the prior 350,000,000 ada limit for the same period. The 2,464,844 ada requested here is well within it, on its own and in aggregate with the other withdrawals pending at the time of this review, satisfying guardrail TREASURY-02a; the withdrawal is denominated in ada, satisfying TREASURY-03a.

**Article II.7.4 (Audit and Oversight Allocation).** The proposal allocates ada for audit and oversight as part of the funding request, and does so explicitly. No.Witness Labs, which holds no stake in Lantr Engineering, performs periodic third-party audits with quarterly technical reviews published to the community and is remunerated with funds explicitly allocated in the proposal for that purpose; an external financial auditor will scrutinize the project's finances with a report targeted for Q2 2027, likewise remunerated from an explicit allocation; and oversight metrics run through the milestone schedule and public reporting commitments.

**Article II.7.5 (Designated Administrator).** The proposal designates an administration structure distinct from the recipient. Funds are held and released through the SundaeSwap treasury-contracts framework, whose treasury and vendor validators have been independently audited by TxPipe and MLabs and are in production use on mainnet, and a three-member independent oversight board (Chris Gianelloni of Blink Labs, Matthias Benkort of the Cardano Foundation, and Riley Kilgore of IOG), whose members hold no stake in Lantr Engineering, co-signs disbursements, reviews milestones, and can pause or halt funding under a published permission scheme that requires board majority for disbursement. This is the same escrow architecture this Committee has previously found constitutional.

**Article II.7.6 (Custody and Delegation of Held Funds).** The on-chain withdrawal destination is stake17xzhu4tdpl4gdsupfmn3yjlngt2f3mjes3v6wwg9yd767ps8k5qvl, a script-locked stake address (CIP-19 mainnet header byte 0xf1) that we verified on-chain at the time of this review as not delegated to any stake pool and delegated to the predefined always-abstain DRep. The treasury contract itself enforces auto-abstain DRep delegation and no SPO delegation for all funds in escrow, so the Article's holding requirements are satisfied by contract logic for the life of the deployment.

**Appendix I (Guardrails).** Only the Treasury Withdrawal guardrails in Appendix I.3 are engaged, and each is met as set out under Article II.7.3 above. The parameter, hard-fork, no-confidence, constitution, and committee guardrail groups are not engaged by a Treasury Withdrawals action.
