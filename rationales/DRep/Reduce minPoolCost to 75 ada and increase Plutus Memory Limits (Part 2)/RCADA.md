<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmfRXrDTgxjMnzih4CbBWja2M7KAzUPpS3VQNFMWnj2upT -->
# RCADA

**Proposal:** Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2)
**Vote:** Yes
**Voter ID:** `drep1yf7kjx5rlyuyzxkr4dzyccdfs8tesh29amrtcpyplu3asnqjgmdz3`

---

RCADA votes **YES** on **Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2)**.

RCADA supports this parameter update because both changes are bounded, evidence-based, and aligned with the long-term health of the Cardano ecosystem.

RCADA supports the reduction of `minPoolCost` from **170 ada to 75 ada**. As block rewards continue to decline, the current fixed-fee floor creates a growing disadvantage for smaller pools, especially pools producing only one or a few blocks per epoch. This can make it harder for smaller independent SPOs to compete for delegation and can weaken the practical diversity of the stake pool ecosystem. The proposal notes that the delegator penalty for single-block pools has risen again since the 2023 reduction and may continue worsening if no further action is taken. 

RCADA has already indicated support for this direction during the earlier Intersect / Hydra voting stages relating to `minPoolCost` reduction. This vote is consistent with that position. Lowering the floor to **75 ada** does not force any operator to reduce fees, but it gives smaller pools more flexibility to compete and helps reduce a structural disadvantage in the delegation market.

RCADA also supports the Plutus memory-limit increase. This action completes the second part of a previously recommended two-step increase, raising `maxTxExecutionUnits[memory]` to **17,500,000** and `maxBlockExecutionUnits[memory]` to **77,500,000**, completing the cumulative **25%** increase. The proposal states that this change was recommended by the Parameter Committee, ratified by the Technical Steering Committee, tested on Preview, and supported by performance analysis showing adequate timing headroom. 

RCADA recognises that the two changes are not directly related. Bundling unrelated parameter changes is not ideal because it can make voter choice less precise. However, in this case both changes are individually supportable, both have gone through relevant review processes, and the proposal is transparent about the bundling.

RCADA expects continued monitoring after enactment. For `minPoolCost`, the ecosystem should watch for any unexpected effects on stake fragmentation, treasury inflows, and pool registration behaviour. For Plutus memory limits, the ecosystem should continue monitoring block performance, DApp usage, and whether the additional headroom improves developer experience without creating network stress.

On balance, RCADA supports this action because it improves small-pool competitiveness, supports decentralisation, completes a staged and reviewed Plutus capacity increase, and reflects a measured approach to parameter governance.

RCADA’s full vote assessment can be found here:
https://brolloks.github.io/rcada-drep-votes/
