<!-- url: ipfs://QmXrAdiCTezUs1LGuQHS2mFghTNF6rRJVtSkTUw3Sa5TWk -->
# Ace Alliance

**Proposal:** Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2)
**Vote:** Yes
**Voter ID:** `71aa5b3a9240a02a89c4e2839579ec5eb60c410af0a5bb483e1b8f04`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: ipfs://QmTqUPF2RMZDxuPMaVgF8wXx2hVqbjQe3Fh9W5p9x8LMEd

"Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2)" (gov_action14dr5yg75pchr2sz42djtuflpvx5qnsek29qg7s7cft8lzrqt5vrqqtqntpk) is a Protocol Parameter Change Governance Action proposed through the Intersect Parameter Committee. It bundles two previously recommended changes: a reduction of minPoolCost from 170 ada to 75 ada, and the second and final step of an approved 25 percent increase to the Plutus memory limits, raising maxTxExecutionUnits memory from 16,500,000 to 17,500,000 units and maxBlockExecutionUnits memory from 72,000,000 to 77,500,000 units. The action also restates both execution step limits at their current values, which effects no change.

Under Article II.6.1, governance actions "shall follow a standardized and legible format before being recorded or enacted on-chain" with an anchor document that is "immutable and incapable of being altered after submission". The proposal anchor is a content addressed IPFS document whose hash matches the on-chain record, and it contains the title, abstract, justification, and supporting materials that Article II.6.2 requires.

Under Article II.6.3, "Hard Fork Initiation" and "Parameter Update" actions "shall undergo sufficient technical review and scrutiny as mandated by the Guardrails to ensure that the governance action does not endanger the security, functionality, performance, or long-term sustainability of the Cardano Blockchain." The record here is substantial. The minPoolCost reduction is the subject of Parameter Committee proposal PCP-006, published 30 March 2026 and ratified by the Intersect Technical Steering Committee on 9 July 2026. The memory increase was recommended by the Parameter Committee on 8 May 2025 and ratified by the Technical Steering Committee on 1 October 2025, covering the complete two step plan of which Part 1 was enacted at epoch 614; the full target values of both memory parameters were exercised together on the Preview testnet in July 2026. On the record before us, that is sufficient.

The Appendix I parameter guardrails are met on the on-chain values. The memory increases satisfy the hard bounds of MTEU-M-01, which requires that maxTxExecutionUnits memory "must not exceed 40,000,000 units", and MBEU-M-01, which caps maxBlockExecutionUnits memory at 120,000,000 units, and neither parameter is decreased. The per epoch change limits that necessitated the two step structure are respected: this action increases the transaction memory limit by 1,000,000 units against the 2,500,000 unit guidance of MTEU-M-04, and the block memory limit by 5,500,000 units against the 10,000,000 unit guidance of MBEU-M-03. The minPoolCost reduction satisfies MPC-01 and MPC-02, remaining non negative and below the 500 ada ceiling. Both critical parameter tracks of Appendix I.2.1 are engaged and satisfied: maxBlockExecutionUnits is critical to the operation of the blockchain, so under PARAM-03a and Article II.5.1 the action requires SPO ratification, and the 90 day interval of PARAM-04a between off-chain publication and on-chain submission is exceeded by more than a year; minPoolCost is critical to the governance system, so PARAM-05a applies its DRep threshold and the 90 day interval of PARAM-06a is satisfied by the roughly 111 days between the publication of PCP-006 and submission. These threshold requirements are enforced by the ledger and are noted here as satisfied preconditions rather than open questions.
