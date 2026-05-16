<!-- url: ipfs://QmQ6CyFQsNTiofdDgqcfbax44R9RjACsgjpZZ14jzZ8Tg9 -->
# jonahkoch

**Proposal:** IO & VacuumLabs Enhancing Plutus - Performance, Correctness, and Usability
**Vote:** Yes
**Voter ID:** `drep1yt8trnz8e5cnylmyygt0pyzrfw92rt9s42kg8t4rhm6t0dstyvmdn`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmUNJD3KNmge4duTfzGEkgzKSH5k4qeWB4buGjagetNqRW

I'm voting yes because Plutus is the substrate that every Cardano smart contract runs on, and this proposal funds three interconnected improvements around execution efficiency, formal correctness, and developer onboarding which compound directly, the outcomes the ecosystem needs.
The deliverables that align most explicitly with priorities I've stated are in Workstreams 2 and 3. The property-based conformance testing framework, by extending the existing 1,982-test suite with randomly generated programs, it is a direct benefitting enabler of node diversity I've consistently voted to support. Amaru, Dingo, and Gerolamo all need a conformance framework that covers edge cases beyond handwritten tests; this proposal builds it. The Agda formalization of programmatic built-in types and functions extends the same rigorous specification methodology IO applied to the Leios and High Assurance proposals, consistent and cumulative, exactly the kind of infrastructure investment that compounds over time. On the developer experience side: no-Nix installation, source-level error messages, standalone compiler binaries, single-command setup. These are not conveniences. They are the difference between a developer's first Cardano project succeeding or failing. Every friction point that gets removed is a developer retained. The accessibility mandate runs through all three workstreams.
The VacuumLabs co-venture is worth naming explicitly. This isn't IO funding IO work with IO people. VacuumLabs is an independent specialist firm with deep Haskell and formal methods expertise contributing to Plutus as shared public infrastructure. That distributed ownership model supports multiple expert teams stewarding core infrastructure rather than a single organization.  This is exactly the structural outcome a maturing ecosystem should be building toward and IO continues to show a mandate to distributing the workload. At ₳11,877,575 (~$2.85M at $0.24), with 86% allocated to development and unspent funds returned, the ask is proportionate for scope. The implied FTE cost runs slightly above my $200K annualized benchmark at roughly $223K per engineer; given that Agda formal methods specialists, GHC compiler engineers, and Haskell security auditors are genuinely scarce expertise, the rate is defensible.
The risks are honestly disclosed and well-contained. The scope check investigation delivers a CIP or a report regardless of outcome, we have a time-boxed deliverable either way. CIP-0168 isn't yet ratified, a real risk that the proposal tracks closely. The new UPLC features require the Dijkstra hard fork for mainnet activation, which is out of scope for this proposal but honestly stated. None of these change the vote.
