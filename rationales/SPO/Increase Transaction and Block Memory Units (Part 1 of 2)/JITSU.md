<!-- url: ipfs://QmPDh6rUKdiSSWufWQjCCKkhbpyZcJGzmWCMGZQ39qSaep -->
# JITSU

**Proposal:** Increase Transaction and Block Memory Units (Part 1 of 2)
**Vote:** Yes
**Voter ID:** `pool1jkxwcqkaaacvd77rf9lrj3qsgvtktqh7cglu3awsy34h5eava4d`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmPk5kQ2U5xUTJPxfZZYUrVRwTMW6V4S4ZuTz37qk532Zi

1. Unlocking Complex dApps
Many advanced DeFi protocols (like DEXs with complex routing or lending platforms) require significant memory to execute their logic.

The Bottleneck: Without enough memory units, developers are forced to split one logical action into multiple smaller transactions.

The Fix: Increasing limits allows for more sophisticated, single-transaction interactions, making the user experience smoother and more "Ethereum-like" in terms of what a single click can accomplish.

2. Increasing Network Throughput
While "throughput" often refers to speed, in Cardano's case, it's also about block density.

If block memory limits are low, a block might look "empty" (under its byte-size limit) but actually be "full" because the scripts within it have exhausted the memory budget.

Raising these units allows more transactions to be packed into every 20-second block, effectively increasing the network's overall capacity without needing to change the block timing.

3. Preparation for Mass Adoption
As more users migrate to Cardano, the demand for script execution grows. Staying ahead of the "saturation point" prevents the fee spikes or congestion seen on other chains. This change is a proactive step to ensure the plumbing is wide enough for the expected flow of traffic.
