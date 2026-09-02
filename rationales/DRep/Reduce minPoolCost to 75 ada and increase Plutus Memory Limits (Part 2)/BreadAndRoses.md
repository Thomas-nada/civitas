<!-- url: https://ipfs.io/ipfs/QmNWJ3TKHYc7Yytw6gigEfC1b6SsL3gGsduzmDVFVeWNaa -->
# BreadAndRoses

**Proposal:** Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2)
**Vote:** Yes
**Voter ID:** `drep1yff7cs985wzeu2jjx48sld002rleqsrz8qtt3hp8whk9vnc5vq23n`

---

This action makes two independent changes. First, it lets stake pools set their fixed fee as low as 75 ADA instead of 170 ADA. Pools are not forced to lower their fee, but smaller pools can use the lower floor to improve the return offered to delegators. The strongest evidence separate from PCP-006 is the Input Output Research incentives report: after the earlier 340→170 ADA reduction, 340 remained the dominant fee and 170 became a challenger tier rather than causing a market-wide race to the bottom. The same report identifies 873 of 1,614 active pools below the delegation level associated with consistent block production and argues that the fixed fee can favour multi-pool fragmentation by well-capitalised operators. This supports lowering the floor, although it does not independently prove that 75 ADA is the correct calibration.

Second, it completes a staged 25% increase from the original Plutus memory limits. Part 1 is already enacted. Part 2 adds only 1M transaction-memory units and 5.5M block-memory units, remaining within the Constitution's numerical guardrails. Official node 10.3 benchmarks tested much larger 1.5× and 2× budgets under an intentionally saturated workload and found predictable costs without an absolute network-performance risk, while still recommending conservative staging because deployed scripts can become dependent on higher limits.

Delivery is unusually feasible because there is no vendor, budget or long implementation chain: if ratified, the ledger changes the parameters. The strongest objection is governance quality. The action bundles unrelated economic and technical choices. Its claim that the minPoolCost change was ratified by the TSC on 9 July is not supported by the accessible minutes: the bundle was still being drafted on 8 July, and a 5–1 vote on 15 July approved concurrent Pre-Prod/Mainnet submission. The proposal also supplies no current pool-operating-cost study, numeric reversion thresholds or independently reviewed post-Part-1 mainnet telemetry.

Those shortcomings justify Medium rather than High confidence and require explicit feedback, but they do not outweigh the source-supported direction, low implementation burden and substantial safety headroom. The risk-adjusted recommendation is therefore YES.
