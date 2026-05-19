<!-- url: ipfs://QmS24D735PfEX5cR1SiwSqXWgbGpoZaLQmzDTreALU87Mp -->
# HOSKY

**Proposal:** IO & VacuumLabs Enhancing Plutus - Performance, Correctness, and Usability
**Vote:** Yes
**Voter ID:** `drep1yf2jzhuc4f7eu2yay9d9ta3dykxxcwn34wz8kak7nhd7vcgrxn7ns`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmSw7DoFAQqTGj8emCfFohPZPMZs7x8SvoRXX6enL9M6q5

Voting Yes. ₳11.88M for three workstreams on the Plutus smart-contract platform: language capabilities and primitives, formal verification and conformance, and developer experience. Plutus is the execution layer for every DApp on Cardano. Strong fit across the Cardano First framework:

Scalability: Lead pillar. Cheaper execution per script means more transactions fit into the same block, the L1 throughput lever that does not require a hard fork or an L2. Casing on Data and the new built-ins (already-ratified CIP-0156 multiIndexArray, CIP-0168 BuiltinValue) replace verbose on-chain loops with single primitive calls. Scope-check removal (subject to Dijkstra hard-fork timing) recovers about 25% of script preparation overhead with no security cost.
Decentralization: Workstream 2 extends the Plutus metatheory in Agda and builds a property-based conformance framework. This is what lets alternative node clients verify their Plutus evaluator agrees with the canonical one on edge cases. Compounds as Cardano's node diversity grows. Same logic as my Yes on Amaru, Dingo, Pebble + Gerolamo.
Adoption: Workstream 3 replaces the GHC-plugin-based Plinth compiler with a standalone toolchain that does not require Nix or hand-installed C libraries. That has been the first-day stumbling block for developers coming from EVM or Web2 ecosystems. Single-command installation removes the friction.
Governance Transparency: Standard Intersect 2025 TRSC pattern: milestone-gated disbursement, third-party Assurer, unspent funds return to Treasury.

The VacuumLabs co-venture distributes Plutus maintenance across two expert teams rather than concentrating it in one. CIP-0156 and CIP-0168 are already community-ratified; this funds the implementation that closes those governance decisions.
Risks I'm accepting with this Yes:

Hard-fork-gated deliverables. Scope-check removal and new cost-model built-ins need Dijkstra to land. If Dijkstra slips, those deliverables are complete but economically inert until activation. The funded engineering still has standalone value.
Workstream 2 overlaps the Maintenance Initiative. The Plutus evaluator security audit and conformance maintenance also appear in the ₳62.1M IO & Ensurable Systems scope. The boundary is not perfectly clean.
Self-reported impact metrics. Cost-reduction and node-diversity claims need community measurement; the structural deliverables (CIP implementations, Agda formalization, standalone compiler) are independently verifiable.
Slate aggregation. Part of the ~₳141.9M IO slate across seven actions. Each action stands alone.

Foundational L1 work. Yes.
