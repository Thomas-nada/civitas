<!-- url: ipfs://QmSzzFun6cSYbd4YnWLeGBAPp3LHSpF5kGdSY3Dskq7jhK -->
# jonahkoch

**Proposal:** IO Consensus Initiative
**Vote:** Yes
**Voter ID:** `drep1yt8trnz8e5cnylmyygt0pyzrfw92rt9s42kg8t4rhm6t0dstyvmdn`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmQ7HVrL4ohPYgSRmRcKB7MDrrt4StYdFAC4Ykf2npBmHc

Leios is the protocol change that makes Cardano's 2030 transaction targets structurally achievable. Without it, scaling from ~800K to 27M monthly transactions is impossible. I'm voting YES.
The financial case is sound, ₳27,714,342 (~$6.65M at $0.24) with 86% allocated to development. For 6–9 months of consensus layer work, with a cross-functional team doing simultaneous rewrite of consensus components, Agda conformance testing against the formal specification, adversarial red-teaming, and full hard-fork ecosystem preparation, the implied engineering cost lands in the right range for this caliber of distributed systems work. This is high-difficulty protocol engineering, not commodity development.
This proposal builds on demonstrated delivery. The 2025/26 cycle produced CIP-164 (merged), an alpha feature-complete Leios implementation, and a public testnet deployment. The 26/27 cycle has a clear objective: progress from SRL 5 through SRL 8 to a mainnet-ready release candidate. Development tracker and monthly review meetings with public demos are established and ongoing.
What specifically resonates: The Agda formal specification conformance testing is the right level of rigor for a protocol change at this scale because, you don't want to make a consensus-layer-upgrade to Cardano without it. Leios enhances Praos rather than replacing it, preserving Cardano's security model and SPO economic viability while delivering a 10–65x throughput increase. The hard-fork enabling workstream explicitly includes preparation of updated guardrails and governance rationale documents, IO is scoping the full governance pathway, not just the engineering milestone.
Honest disclosure on known limitations: The Delta EB adversarial stake assumption has a ceiling at 25% adversarial stake, meaning maximum throughput parameters may not be achievable at day-one hard fork. Higher SPO operational costs are acknowledged. External dependencies, HFWG acceptance, third-party infrastructure readiness, governance timing, are explicitly out of IO's control, with success defined by completing the engineering activities, not by mainnet activation. This scoping is appropriate and honest.
