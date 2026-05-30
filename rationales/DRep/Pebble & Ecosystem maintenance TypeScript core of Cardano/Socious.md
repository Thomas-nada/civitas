<!-- url: ipfs://QmQxhxaVQEprLczZea7mU17DLdCDEXAavvZ9F5GoYupDEv -->
# Socious

**Proposal:** Pebble & Ecosystem maintenance TypeScript core of Cardano
**Vote:** Yes
**Voter ID:** `drep1ytcv4ax77s0enqef56qjflf4d8zjgxulukme9uf5p8cfaagysjppn`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmZnQv4ojiYpasUpTBmQsPst6VS75UNxLyaQz1TBA9Q8B6

We are voting YES. This withdrawal funds open-source public goods at two layers Cardano structurally depends on: better smart-contract developer ergonomics (Pebble) and ongoing maintenance of the TypeScript core that a large share of the ecosystem builds and runs on (libraries, tooling, and the TypeScript node). These are exactly the kind of infrastructure the treasury exists to fund, because no single commercial actor has a direct incentive to pay for them. We weighed the concerns raised in earlier deliberation on the related work — packaging, FTE accounting, and the Constitutional Committee's posture — and concluded they argue for tighter reporting and milestone-gated disbursement, not for defunding the work.

What this funds
Pebble — a strongly-typed smart-contract DSL (a first-class language with its own syntax and compiler) that compiles to UPLC (Untyped Plutus Core) and exposes onchain/offchain type ecosystems for contract and dApp integration. It lowers the barrier to writing correct on-chain code on Cardano.
TypeScript core / ecosystem maintenance — continued upkeep of the TypeScript libraries, tooling, and node work (including the Gerolamo TypeScript node) that a large part of the builder community relies on. This is the unglamorous, high-leverage maintenance layer that keeps the application ecosystem healthy.
Why we support it
1. Maintenance of shared infrastructure is a treasury-shaped cost. The TypeScript stack is a commons: many teams depend on it, but its upkeep is under-provided by markets because no one team captures the full benefit of maintaining it. Funding it from the treasury is precisely the gap community funding is meant to fill.

2. Client and tooling diversity is a resilience requirement. A maintained TypeScript node and toolchain reduces the network's dependence on a single canonical implementation and a single language community. Diversity at the node and tooling layer lowers correlated-failure risk — one bug or supply-chain issue affecting every node at once.

3. Developer ergonomics drive the application layer. Cardano's EUTXO model is powerful but has a steeper on-ramp than account-based chains. A type-safe DSL that compiles to UPLC (Pebble) eliminates a class of on-chain bugs and widens the funnel of developers who can ship safely. Tooling that makes the platform easier to build on compounds over years.

4. Meets the world's largest developer population where it is. TypeScript is one of the most widely used languages globally. Lowering the language barrier to building and running Cardano infrastructure is among the higher-leverage uses of ecosystem funding.

5. Accountable, known builder. The work continues existing, inspectable open-source output from a named team (Harmonic Labs / Michele Nuzzi) rather than a speculative proposal from an unproven group. Treasury money is lower-risk when it extends work that already lives in public.

Concerns we weighed
An honest YES has to address the issues raised in deliberation on the related action:

Packaging / scope clarity. The earlier bundled version (Pebble + Gerolamo — HLabs 2026 Budget, GA95) drew valid criticism for combining distinct workstreams under one budget, which blurs accountability. We support funding each deliverable against its own milestones and budget line, and read the "TypeScript core maintenance" framing as a step toward clearer scoping — provided the line items are itemized.
FTE accounting / potential double-counting. Reviewers flagged possible double-counting of full-time-equivalents across workstreams. This is a reporting-quality problem that warrants a transparent staffing breakdown and milestone-tied disbursement — it does not establish that the work lacks value.
Constitutional Committee posture. A CC body previously raised an unconstitutionality finding on the related action, and HLabs published a public response. We read this as a governance-process dispute about scope and documentation standards rather than a judgment that the deliverables are without merit. We weight the substance heavily while backing the CC's push for tighter proposal hygiene.
Conditions we'd attach (and watch)
Itemized budget: Pebble and the TypeScript-core maintenance lines scoped and costed separately.
Milestone-gated disbursement rather than a single up-front withdrawal.
A transparent staffing/FTE table that resolves the double-counting question.
Public, inspectable deliverables (repos, releases) tied to each milestone.
Bottom line
Cardano needs maintained core tooling and more than one language community building on it — and both are hard to fund through normal market incentives, which is exactly why the treasury should. The objections to this work are about how the spend is packaged and reported, not whether it is worth doing. We vote YES on the substance and back the call for itemized, milestone-gated funding.
