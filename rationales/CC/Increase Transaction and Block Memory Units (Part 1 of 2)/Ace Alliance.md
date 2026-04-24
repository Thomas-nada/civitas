<!-- url: https://raw.githubusercontent.com/ace-alliance/ace-voting/main/202601/ga85-memunits.json -->
# Ace Alliance

**Proposal:** Increase Transaction and Block Memory Units (Part 1 of 2)
**Vote:** Yes
**Voter ID:** `71aa5b3a9240a02a89c4e2839579ec5eb60c410af0a5bb483e1b8f04`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmTaGSXMcGm2sGGB2rgyhxq6u6cfukH9Rgfv45TCtM5ZKo

The proposed increase to maxTxExecutionUnits\[memory\] and maxBlockExecutionUnits\[memory\] is a strategic enhancement designed to advance the Cardano Blockchain’s mission of providing foundational infrastructure for decentralized systems. By raising the per-transaction limit from 14,000,000 to 16,500,000 units and the per-block limit to 72,000,000 units, this action directly addresses community feedback regarding resource constraints that currently hinder DApp development. These changes align with Tenet 3 of the Cardano Constitution, ensuring that developers are not "unreasonably prevented" from deploying sophisticated applications. This 17.9% increase in transaction headroom provides the immediate flexibility required for more complex smart contracts while maintaining the long-term sustainability and viability of the ecosystem. The increase in the memory units per transaction and per block adheres to all relevant guardrails from MTEU-M-01 to MTEU-M-03 and MBEU-M-01 to MBEU-M-04a.

From a technical perspective, this proposal is rigorously supported by performance data from Node 10.6, ensuring compliance with Article I, Section 2 regarding safeguarding implementation of guardrails. Detailed benchmarking indicates that even with a theoretical 100% increase in the memory budget, block diffusion remains highly predictable and well within the 5-second target for 95% propagation. Specifically, the analysis shows that while allocation rates increase, the impact on critical system resources like Kernel RSS and CPU usage is negligible. This empirical evidence satisfies the requirements of MBEU-M-04a, confirming that the change does not endanger the security, functionality, or performance of the Cardano Blockchain.

Furthermore, this governance action adheres to all constitutional process guardrails, including the 90-day notice period specified in PARAM-04a. By grouping the per-transaction and per-block limits into a single action, the proposal follows the correlation guidelines in NETWORK-02, ensuring a streamlined and transparent update process. This update represents a responsible, data-driven step toward scaling Cardano’s smart contract throughput, balancing the desire for increased capacity with the foundational need for network stability and decentralization.
