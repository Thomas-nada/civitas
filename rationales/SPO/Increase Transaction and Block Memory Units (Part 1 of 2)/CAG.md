<!-- url: ipfs://Qmf2pJEcKj6pG8HdhoCPG3mUyqpPWSYBnm873sWWBCsiP6 -->
# CAG

**Proposal:** Increase Transaction and Block Memory Units (Part 1 of 2)
**Vote:** Yes
**Voter ID:** `pool1nqheyct9a0mxn80cwp9pd5guncfu3rzwqtmru0l94accz7gjcgl`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/Qmes4gmDUkKWXJGXPQ2D7JZA8rV32vLwLhjcAwVejVGbme

Our support for this proposal is driven by the following factors:

- **Developer Experience & Scalability:** Increasing the per-transaction memory limit by ~17.9% and the per-block limit by ~16.1% addresses immediate pain points for developers. It allows for more complex Plutus scripts to run without requiring inefficient workarounds, while maintaining the capacity to fit four maximum-sized transactions per block.

- **Technical Validation:** We rely on the data provided by the IOE Performance and Tracing team. Detailed benchmarking (on node versions 10.2 and 10.3) indicates that despite the increased memory budget, critical system resources (Kernel RSS, CPU usage) remain stable, and block diffusion remains well within the target of 95% propagation within 5 seconds.

- **Process & Guardrail Compliance:** This proposal is the result of over a year of analysis by the Intersect Parameter Committee. We specifically point to the "Part 1 of 2" implementation strategy in this instance because it is required by the Constitutional Guardrails (specifically MTEU-M-04), which limit the maximum increase per epoch. In general, we advocate for bundling parameter changes to minimize the frequency of governance actions requiring Stake Pool Operator (SPO) votes, thereby reducing their operational burden.
