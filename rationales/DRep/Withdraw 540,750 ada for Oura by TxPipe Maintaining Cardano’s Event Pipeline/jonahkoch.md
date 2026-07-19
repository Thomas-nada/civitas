<!-- url: ipfs://QmayQRZEqCiYXEaXg8Zcso7fznraCnXAMQtdBhArYFJjCz -->
# jonahkoch

**Proposal:** Withdraw 540,750 ada for Oura by TxPipe Maintaining Cardano’s Event Pipeline
**Vote:** Yes
**Voter ID:** `drep1yt8trnz8e5cnylmyygt0pyzrfw92rt9s42kg8t4rhm6t0dstyvmdn`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmTHaMAoCnMy1is6UFFXJ3v7Jgsbi14N2fXqrubhYc5ksT

Voting yes. Oura solves a problem that every data-intensive Cardano application has to solve: getting blockchain events from the node into the rest of the stack. Building that pipeline from scratch — handling the node-to-client protocol, parsing events, managing reconnections, routing to downstream systems, is weeks of infrastructure work that every team currently has to do themselves or pay a commercial API provider to abstract. Oura exists so they don't.
The open-source case is worth stating explicitly. Blockfrost, Maestro, and similar commercial API providers are good products, but they create a dependency that open-source infrastructure doesn't. Projects that need to own their own data pipeline, for latency, cost, sovereignty, or reliability reasons, need something like Oura. The ecosystem benefit of maintaining it in the commons rather than forcing every project to roll their own is real, even if it's harder to quantify than Pallas's dependency chain.
The "first Intersect ask" note is worth acknowledging but not weighing heavily. Oura has been maintained through Catalyst and is in active use. Adding Intersect-backed stability to it is a reasonable next step in its funding trajectory.
The one place I'd push back in future submissions: "Maintenance and Enhancement" needs sharper definition for a pipeline tool than for a protocol library. What output sinks or source adapters are planned? What performance targets? The enhancement scope is genuinely unclear in a way that warrants specificity the next time around.
