<!-- url: ipfs://QmZhtJwT7VGPWWPP6s9B2PwrqfGdjxHxnetVNkXo5qmLjM -->
# HOSKY

**Proposal:** Hard Fork to Protocol Version 11 ('van Rossem' Hard Fork)
**Vote:** Yes
**Voter ID:** `drep1yf2jzhuc4f7eu2yay9d9ta3dykxxcwn34wz8kak7nhd7vcgrxn7ns`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmVB58NUaC1PCcBNxtsxcGnVopbz3yziQ72GiJmPgDz5jG

## Vote: Yes

This is the van Rossem intra-era hard fork to Protocol Version 11. It bundles a focused set of Plutus performance and capability gains, ledger-consistency hardening, and node-level security fixes into a single coordinated upgrade, with no treasury spend and no change to transaction shape. The Cardano First framework reads as a clean Yes, led by Scalability.

HOSKY already supported naming this fork, voting Yes on the van Rossem naming action. This vote is the technical follow-through.

## Pillar Analysis

### Scalability (lead pillar)

This is the heart of the upgrade and the reason it earns a Yes. The new primitives attack real, named bottlenecks rather than adding surface area for its own sake: a constant-time `Array` type replaces `O(n)` list indexing, `dropList` unlocks efficient redeemer-indexing, a native `Value` type removes the generic-map overhead that sits under most contracts, and `case`-expressions in UPLC let the interpreter dispatch on `Data` tags directly instead of chained `if`/`equalsInteger`/`unConstrData` patterns. Each of those is a direct execution-cost reduction. BLS12-381 multi-scalar multiplication and on-chain modular exponentiation make pairing-based zero-knowledge proofs practical on Cardano instead of offloaded off-chain. Because the fork is intra-era, all of this lands without forcing a transaction-format migration on the ecosystem.

### Adoption

Unifying the built-in set across Plutus V1, V2, and V3 is the quiet win here. Historically new functionality was reachable only by recompiling to the latest Plutus version; after van Rossem, existing V1 and V2 scripts gain the full built-in set in place. That lowers the upgrade tax on every contract already deployed, and the expanded cryptographic primitives open a class of applications (ZK, advanced DeFi) that were impractical before. More capability for builders at lower cost is the adoption mechanic.

### Decentralization

Two things cut toward decentralization. First, VRF key hash uniqueness is promoted to a ledger predicate, so no two stake pools can register or operate with the same VRF key, closing an SPO-level attack vector at the protocol layer. Second, the activation gate itself is decentralized: HARDFORK-04 requires 85% of stake by active stake to be on a capable node before ratification, which puts SPOs, not any single entity, in control of when the fork goes live.

### Governance Transparency

Promoting the Constitutional Committee voting restriction from a mempool-only check to a ledger predicate is a governance-correctness improvement. Where an offending vote could previously only be rejected at the mempool layer, it now produces a deterministic on-chain failure that every participant observes identically regardless of submission path. The clearer non-matching-withdrawals predicate and the detailed `PPView` mismatch reporting are smaller transparency and diagnosability gains in the same direction.

### Economic Sustainability

A hard fork carries no treasury withdrawal and the proposal deposit is refundable, so the direct cost to the ecosystem is zero. The lasting effect is the opposite of a cost: cheaper script execution across the board lowers on-chain operating cost for every DApp that uses the new primitives. This is protocol improvement that pays for itself in reduced fees and execution units.

## Risks I'm Accepting With This Yes

### SPO readiness gate

The fork should only ratify once at least 85% of stake by active stake is on a PV11-capable node (HARDFORK-04). If readiness is short at ratification time, activating anyway would risk a disorderly upgrade. I am accepting this because the gate is explicit, the Constitutional Committee and SPOs verify it, and Intersect's Hard Fork Working Group publishes the readiness reports the verification rests on. The correct behaviour if the threshold is not met is simply not to ratify, and that is built into the action.

### Irreversibility

Protocol Version 11 is a permanent change to on-chain ledger rules, and reversion is only possible through the CIP-0135 disaster-recovery process in extreme circumstances. I am accepting this because the testing posture is strong: reports show no behavioural regressions, complete spec-to-implementation conformance on the new ledger rules, security audits on the BLS primitives and on execution costs, and a published performance report showing no regression against PV10. The companion cost-model action is also a live safety valve, the new primitives can be disabled at the cost-model level if a problem appears post-fork.

### Companion cost-model dependency

The new Plutus primitives only become usable once the companion cost-model parameter action is enacted, so this fork and that action are coupled in practice. I am accepting this because the coupling is deliberate and protective: separating primitive availability from primitive cost gives governance a clean lever to switch the primitives off without reverting the fork itself.

## Bottom Line

Real execution-cost reductions and new cryptographic capability for builders, ledger and SPO-security hardening, deterministic governance rules, zero treasury cost, and a decentralized SPO-gated activation backed by clean testing and audits. **Yes.**
