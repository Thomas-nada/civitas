<!-- url: ipfs://bafkreibwbu3t3jvp6evt2dupv2o3fcc7bp2uzw3gf7teo3pngpy6hhsuky -->
# Ace Alliance

**Proposal:** Reduce minPoolCost to 75 ada
**Vote:** Yes
**Voter ID:** `71aa5b3a9240a02a89c4e2839579ec5eb60c410af0a5bb483e1b8f04`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: ipfs://bafkreiav3crz2txlzwxev2o5pwfreqhgqk6rrf4mfs7bxs2am5mlpdosya

"Reduce minPoolCost to 75 ada" (gov_action1whncs25w727rj5tml7lmv48gnaf9mm66sdjds8s3l306et7xmkdsqzqd7s2) is a Protocol Parameter Change Governance Action that would reduce minPoolCost from 170,000,000 lovelace (170 ada) to 75,000,000 lovelace (75 ada) and changes no other parameter. The same reduction formed part of an earlier bundled action that also carried the second step of a Plutus memory increase. We previously considered that action and found it constitutional, and it expired at epoch 653 without ratification. This action carries the minPoolCost change forward on its own, with the same target value and the same supporting record, and without the memory parameters. Our analysis of the minPoolCost change therefore carries forward, and we confirm below that it holds on the record of this submission.

Under Article II.6.1, governance actions "shall follow a standardized and legible format before being recorded or enacted on-chain," with an anchor document that is "immutable and incapable of being altered after submission." The anchor is a content-addressed IPFS URL, the blake2b-256 hash of the document retrieved at that URL matches the hash recorded on-chain, and the document supplies the title, abstract, motivation, rationale, and supporting materials that Article II.6.2 requires. Under Article II.6.3, "Parameter Update" actions "shall undergo sufficient technical review and scrutiny as mandated by the Guardrails to ensure that the governance action does not endanger the security, functionality, performance, or long-term sustainability of the Cardano Blockchain." The reduction is the subject of Parameter Committee proposal PCP-006, published on 30 March 2026 and ratified by the Intersect Technical Steering Committee on 9 July 2026, and the anchor sets out the economic evidence, the revised Sybil-resistance analysis, and the post-2023 empirical record on which that review rested. On the record before us, that is sufficient.

The Appendix I guardrails are met. minPoolCost is named in Appendix I.2.2, so PARAM-01 is satisfied, and the proposed value satisfies MPC-01 and MPC-02 because it is not negative and does not exceed 500 ada. Appendix I.2.1 lists minPoolCost among the parameters critical to the governance system. PARAM-05a therefore applies its DRep threshold, a requirement enforced by the ledger, and the 90-day interval of PARAM-06a is satisfied by the roughly 165 days between the publication of PCP-006 and the submission of this action at epoch 654. minPoolCost is not among the parameters critical to the operation of the blockchain, so PARAM-03a and PARAM-04a are not engaged and the action does not require SPO ratification. Appendix I.2.6 requires that "A specific reversion/recovery plan must be produced for each parameter change." The anchor supplies one: it identifies a return to 170 ada as the reversion path, and it states plainly that a reversion would bind only new or updated pool registrations, since pools that lower their declared cost cannot be compelled to raise it again. The Constitution anticipates this limitation in noting that "not all changes can be reverted," and the proposal discloses it rather than obscuring it.
