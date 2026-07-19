<!-- url: ipfs://QmZNdziVgeBMDxC9D1wV9ET967UoJqcS5fc3DiD62f9GoU -->
# jonahkoch

**Proposal:** Withdraw 540,750 ada for Pallas by TxPipe Maintaining Cardano's Core Rust Li
**Vote:** Yes
**Voter ID:** `drep1yt8trnz8e5cnylmyygt0pyzrfw92rt9s42kg8t4rhm6t0dstyvmdn`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmPbyqepsfynVhb2zXB1TXYYSd1gvFBwP4Y4QwNJm6sB2u

Voting yes. Pallas is the highest-clarity proposal in this batch. It's year-2 maintenance funding for the Rust library that the entire Cardano developer toolchain depends on, from a team with a verified delivery record, at a cost that is obviously proportionate to the scope.
The dependency argument is worth stating directly: you cannot vote no on Pallas without implicitly accepting that Aiken, Dolos, Mithril, Amaru, Oura, and UTxO-RPC should absorb the maintenance cost themselves or fork the primitives. Neither of those outcomes is efficient, and both create fragmentation in a part of the ecosystem that benefits specifically from being shared infrastructure. The shared-library model, one team responsible for protocol primitives, many projects consuming them, is how you avoid a scenario where every Rust project in the ecosystem maintains its own serialization layer and diverges over time. That's the outcome Pallas prevents.
"Year 2" is also a stronger justification than it might appear. This isn't a new team making promises. TxPipe already delivered year 1 on schedule. DReps are being asked to renew a known-good arrangement, not initiate a new one. The risk profile is lower than any other proposal in this portfolio.
At ₳540,750 (~$135K), this is among the smallest asks in the 2026 Intersect budget relative to the surface area it covers. That's not unusual for maintenance work — the costs are largely labor for protocol tracking rather than greenfield development, but it makes the value calculation straightforward.
