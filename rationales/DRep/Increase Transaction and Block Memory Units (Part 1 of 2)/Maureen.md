<!-- url: ipfs://QmVe9bVXRk1mtc17aqATjmuaL25Ed18BHriGnruQrLWAnd -->
# Maureen

**Proposal:** Increase Transaction and Block Memory Units (Part 1 of 2)
**Vote:** Yes
**Voter ID:** `drep1y22hlaj8wuyygpnjy5cf96tg9tgvjrz39kxvqgv898uj9scfc55t7`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmdfRXzhWuHy6M7qepgp8oMhqREFSPeATxoaNr9UgaNEUG

My vote is YES.

This proposal simply increases the Plutus memory limits per transaction and per block. Nothing else changes. No economic parameters, no consensus rules, no hidden tradeoffs. It just gives scripts more headroom to run.

Right now, developers regularly hit memory ceilings and are forced to split logic across multiple transactions or add unnecessary workarounds. That wastes time, increases fees, and makes apps harder to build and maintain. These limits are artificial bottlenecks, not security features.
The increase is modest and controlled. About 16 to 18 percent. It stays fully within the guardrails. It was benchmarked. It was tested on Preview and PreProd. Performance and propagation targets remain safe. There is no evidence of risk to node operators or decentralization.
So this is not a philosophical decision. It is a practical one.
