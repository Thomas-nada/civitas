<!-- url: https://ipfs.blockfrost.dev/ipfs/QmaMF3wzetVQsHLpNci9FeBCGQHZq1wKRnRqDL2Crb3zBK -->
# Tingvard

**Proposal:** AURORA Open infrastructure for bringing real credit markets to Cardano
**Vote:** No
**Voter ID:** `646d1b3ac94568a422b687db6c47acdf849f1674982ae4f9a494be43`

---

This governance action requests 940,000 ADA from the Cardano Treasury to fund approximately five months of delivery, across four milestones, of open credit-market infrastructure for Cardano. The infrastructure comprises a Metadata Standard, a Verification Framework, the AURORA Discovery Engine, open APIs, filtering and query tooling, a Capital Provider Profile Standard, developer tooling and a reference implementation. Fairway is the Treasury Withdrawal Recipient and lead implementer.

This action is properly framed as a Treasury Withdrawals action and must therefore be assessed under Article II, Section 6 and Article II, Section 7 of the Constitution, together with the applicable treasury guardrails in Appendix I.

Tingvard’s assessment is based on the governance action metadata anchored on-chain, whose content is verified by its on-chain hash. The anchored metadata states that the full AURORA Treasury Proposal “forms part of this funding request”, and that “Sections 5, 7, 9 and 11 specify budget reallocations, implementation payments, independent administration, audits, prior funding disclosure, refund conditions and Net Change Limit compliance.” The full proposal is referenced as a GitHub release page. No hash for it is given in the metadata, and its owner can still edit or replace the release or move its tag. Tingvard has reviewed the version of the full proposal published before submission (blake2b-256 be2a64ee64c7990e9cc77aa165f083a41b0bf3e4e36a2d59ac9612afcb0f7cbc) and has used it to corroborate the anchored metadata.

The proposal satisfies Article II, Section 6, §2. It includes a title, abstract, motivation, rationale and references to supporting material.

The proposal satisfies Article II, Section 7, §1 as to the purpose of the withdrawal and the period for delivery. The anchored metadata identifies the infrastructure to be funded and a delivery period of approximately five months across four milestones.

The action satisfies Article II, Section 7, §3 and TREASURY-01a and TREASURY-02a. The applicable Net Change Limit of 500,000,000 ADA covering epochs 613 to 713 has been agreed on-chain, and the enacted withdrawals in that period leave sufficient remaining capacity for this request. The withdrawal is denominated in ada, satisfying TREASURY-03a.

The proposal satisfies Article II, Section 7, §4, with a concern. The anchored metadata provides for independent Treasury-use audits following publication of the M2 technical outputs and during M4 before project closure, and includes independent Treasury-use oversight within the funded scope. However, the amount allocated and the oversight metrics appear only in the unhashed full proposal, and the auditor is not yet named.

The proposal satisfies Article II, Section 7, §5, with a concern. The anchored metadata states that funds are “initially received into an independent 3-of-5 AURORA Treasury multisignature” and that “Implementation contributors hold no signing keys to the administrator-controlled Treasury multisignature”. Tingvard has verified on-chain that the withdrawal destination is a script credential requiring at least three of five distinct signing keys. Unlike the action assessed in the “Governance Incentives Framework 2026” ruling, this action therefore fixes an administrator structure, independent of the recipient, in its hashed metadata and on-chain, and that structure is in place at the point of withdrawal. The identities of the five administrators, however, appear only in the unhashed full proposal, under the heading “Proposed AURORA Treasury Administrators”.

The action satisfies Article II, Section 7, §6. Tingvard has verified on-chain that the destination account is a dedicated multisignature script account, is not delegated to an SPO, and is delegated to the predefined abstain voting option.

The constitutional defects are found under Article II, Section 6, §1, and under Article II, Section 7, §1 and §2. Each is sufficient on its own to render the action unconstitutional.

Article II, Section 6, §1 requires a URL hosting a document that outlines the proposed governance action, and the hash of that document. It further requires that “The document hosted by such a URL shall be immutable and incapable of being altered after submission”.

The anchor is hosted at a GitHub branch URL (refs/heads/main), whose content can be changed after submission by a single commit to that branch. The anchor file still matches its on-chain hash, the repository shows no changes after submission, and Tingvard does not find that its content has changed. Article II, Section 6, §1, however, requires the hosted document to be immutable and incapable of being altered after submission, not merely unaltered. A matching hash shows whether a document has changed; it does not make it incapable of change. If a matching hash were sufficient, the requirement of immutability would add nothing to the requirement to provide the hash. The full proposal’s own Section 11 stated that the final governance action would reference an immutable canonical version “hosted through IPFS or an equivalent content-addressed storage system … through the applicable URI and cryptographic hash”. That was not done.

Tingvard therefore finds that the action fails to satisfy Article II, Section 6, §1.

Article II, Section 7 places its requirements on the “Treasury Withdrawals” action itself. Article II, Section 7, §1 requires the action to specify the terms of the withdrawal, including “the relevant costs and expenses of the proposed activities” and the “circumstances under which the withdrawal might be refunded to the Cardano Treasury”. Article II, Section 7, §2 requires the action to “disclose whether the prospective recipient … has received ada from the Cardano Treasury within the last 24 months”.

The anchored metadata states the total request of 940,000 ADA but does not set out the relevant costs and expenses of the proposed activities. It does not state any circumstances under which the withdrawal might be refunded to the Cardano Treasury. It does not state whether Fairway has received ada from the Cardano Treasury within the last 24 months. In each case it states only that these terms are specified in another document.

That document is not fixed by the action. It is not hashed in the metadata, and the release through which it is referenced can be edited, replaced or re-tagged by its owner. Off-chain content becomes part of a governance action by being fixed by a hash, as Article II, Section 6, §1 provides. This document was not.

This is not a minor drafting issue. The terms in question operate after enactment: they determine what the funds may be spent on, when unspent funds must be returned to the Treasury, and what prior funding the voters were told about. A term that the proposer can still change after the vote is not a term specified by the action.

In the earlier Treasury Withdrawal actions Tingvard has checked, such as the IO and Tweag treasury withdrawals, the anchored metadata stated the required terms itself, including prior treasury receipts. Referenced documents supplemented terms the action already contained. This action instead delegates the required terms to a document outside the action.

Tingvard therefore finds that the action fails to satisfy Article II, Section 7, §1 as to costs and refund circumstances, and Article II, Section 7, §2.

Tingvard has considered Article I, Section 1, Tenets 3, 6, 8 and 9. Open, Apache-licensed infrastructure for credit-market discovery is consistent with the Tenets, and Tingvard does not find a clear, objective failure under any of them.
