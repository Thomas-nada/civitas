<!-- url: ipfs://bafkreidl5vqagtk5rwk2rzzxkpnqyxtfak4csfn5l4yeodtrmmdms3eabe -->
# Cardanians

**Proposal:** Increase Transaction and Block Memory Units (Part 1 of 2)
**Vote:** Yes
**Voter ID:** `drep1yt4lyf0fwlrz8k6j5evd3rxw0sqp67qkh36su98a97q3qsc0h03y4`

---

This change increases the Plutus memory budget at both the transaction and block level, which directly addresses a real bottleneck for builders: some useful scripts and app flows hit the current ceiling and are forced into awkward workarounds (splitting logic, extra transactions, less efficient designs). Raising the ceiling is a straightforward way to unlock more practical on-chain functionality and improve developer experience.

Importantly, this is a measured, incremental step (“Part 1 of 2”), not a jump into unknown territory. The proposal increases:

a) maxTxExecutionUnits (memory) from 14,000,000 → 16,500,000 (+2.5M, ~+17.9%)

b) maxBlockExecutionUnits (memory) from 62,000,000 → 72,000,000 (+10M, ~+16.1%)

These values are intentionally coordinated so the network retains the same basic shape of capacity (e.g., still fitting four maximum-sized transactions per block), rather than creating a mismatch that could concentrate resources into fewer, heavier transactions.

From a governance and safety perspective, the proposal is framed explicitly to stay within the constitutional guardrails (including the per-epoch limit on how much these parameters should move). It also follows the expected process: it has been deployed on Preview and PreProd testnets first, and the supporting performance work (IOE benchmarking) indicates adequate headroom in critical timing metrics. In other words, it’s not just “we think it’s fine” — it’s “we tested it and the network can handle it within the intended budgets.”

Risks still exist and should be acknowledged. Increasing execution limits can be hard to “roll back” in practice if contracts begin relying on the higher limits. That’s exactly why we prefer this conservative, phased approach with prior testnet validation and clearly bounded increments. On balance, this is the kind of pragmatic, data-informed parameter tuning that helps Cardano scale utility for real applications while staying disciplined on operational safety.
