<!-- url: ipfs://Qmda2CWoSa1NtKMDYx2ej9KPPsK4TUsqYxDWRT2FHcgaeN -->
# Cardano Foundation

**Proposal:** Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2)
**Vote:** Yes
**Voter ID:** `drep1ydpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsjaelx`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/Qmaaj6Hnzc8Td9rKiJgN9juC1jqos7PzYrTF9sXvYjaDtR

We commend Intersect's Parameter Committee and the author of PCP-006 for this action. Our decision is driven by three factors:

1. **Plutus Change Completion:** This implements the second half of the 25 percent increase to \`maxTxExecutionUnits\[memory\]\` and \`maxBlockExecutionUnits\[memory\]\` approved on 1 October 2025\. Following Preview testing in July 2026, node 10.2 and 10.3 benchmarks show adequate headroom, justifying our continued support.  
2. **Proportionate \`minPoolCost\` Correction:** With rewards near 300 ada per block, the 170 ada floor absorbs \~57 percent of a single-block pool's gross reward, raising the delegator penalty to \~52.8 percent and projecting 100 percent by epoch 758\. Reducing the floor to 75 ada restores that share to \~25 percent, ensuring long-term economic predictability.  
3. **Empirical Evidence:** The 2023 reduction from 340 ada to 170 ada showed that a lower floor does not trigger a race to the bottom; 340 ada remained dominant. Operators can maintain higher fees if necessary, making a repeat concern unlikely.
