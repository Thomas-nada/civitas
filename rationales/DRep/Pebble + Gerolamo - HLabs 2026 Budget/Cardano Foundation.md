<!-- url: ipfs://Qmdco4N2Zfwa4oK4jkRuebyKGhLkkb4Y75vdjfiGkAJPoF -->
# Cardano Foundation

**Proposal:** Pebble + Gerolamo - HLabs 2026 Budget
**Vote:** No
**Voter ID:** `drep1ydpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsjaelx`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmZ3h6nWxVwtWrWGZ8dHAn3pjQaaLiDDWnyJFaUvmP6471

The Cardano Foundation recognizes Harmonic Laboratories (HLabs) as a dedicated and highly skilled team that has consistently delivered value to the Cardano ecosystem. However, after extensive review by our Governance Advisory Team and internal Subject Matter Experts, we are unable to support the entirety of this proposal.

Our decision is driven by the following factors:

1. **Strong Support for Pebble & Maintenance**: We see strategic value in **Pebble**. The roadmap for this workstream is plausible, realistic, and contains explicit features and targets. An imperative, TypeScript-inspired language that compiles to highly optimized UPLC is an ideal "gateway" to attract the millions of global Web2 developers to Cardano. We also view the ongoing hard-fork maintenance of critical TS libraries (`cardano-ledger-ts`, `plutus-machine`) as essential public good infrastructure.  

2. **Concerns Regarding Gerolamo (Browser Node)**: While the concept of a browser-based node is technically interesting, there is significant skepticism regarding its practical utility and user adoption. Furthermore, our technical reviewers found the milestones somewhat vague, with subtle, unclear differences among phases (e.g., "syncs to tip" vs. "server-side relay syncs" vs. "reaches a 'trustless' tip"). Most critically, the defined "production-readiness" criteria focus almost exclusively on syncing and connectivity. Syncing with public networks is simply not sufficient to constitute a production node; the criteria completely miss rigorous testing for correctness and strict conformance with other nodes.  

3. **Budget Efficiency & Retrospective Contradictions**: The total ask of 10 FTEs (valued at $225,000 per FTE annually) appears high for the proposed scope. Our review of the team's 2025 retrospective indicates that much of Gerolamo is already "mostly done" and Pebble is essentially presented as a working product. Requesting a 10 FTE budget for what appears to be finishing touches and maintenance, while pricing the workstreams entirely separately despite likely being covered by the same small team, is something we believe merits further optimization or explanation, if the cost is otherwise justified.  

4. **Contingency Buffer**: Adding a flat 25% contingency buffer on top of an already significant 10-FTE baseline effectively locks up an additional \~1.6 million ADA. We believe this buffer is larger than necessary for the proposed scope.

## Recommendation for a Revised Proposal

We do not want to see the momentum behind Pebble stall. We strongly encourage HLabs to unbundle this proposal and submit a separate, highly focused Treasury Withdrawal exclusively for **Pebble** and the ongoing **TypeScript tooling maintenance**.
