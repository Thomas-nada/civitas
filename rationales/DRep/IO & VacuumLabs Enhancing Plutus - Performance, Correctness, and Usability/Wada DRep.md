<!-- url: ipfs://bafkreiej4wqxoozwkxlwtwtycyabjbbxl4znpjondjsolnqythr7che2ly -->
# Wada DRep

**Proposal:** IO & VacuumLabs Enhancing Plutus - Performance, Correctness, and Usability
**Vote:** Yes
**Voter ID:** `drep1y2jnqfamg4tq5aepxhggzhqg7pq5gunph4wypkyh9q3qt2cru5m2j`

---

This proposal addresses several foundational weaknesses and long-standing friction points within the Plutus ecosystem that materially affect developer productivity, smart contract efficiency, protocol safety, and Cardano’s long-term competitiveness as a programmable blockchain platform. The identified issues around execution inefficiencies, tooling complexity, incomplete formal specification coverage, and limitations in expressiveness are legitimate technical concerns that have been acknowledged by developers and infrastructure contributors across the ecosystem. As Cardano adoption expands and smart contract usage becomes increasingly sophisticated, improving the underlying Plutus infrastructure is no longer optional but necessary to sustain growth, reliability, and developer retention.

We believe that the proposed workstreams collectively strengthen multiple layers of the smart contract stack. The implementation of new built-in functions such as CIP-0156 and CIP-0168 directly improves execution efficiency by reducing the need for expensive on-chain looping and repetitive script patterns. Improvements such as built-in casing on Data and investigations into reducing unnecessary interpreter overhead could lower execution costs, reduce script sizes, and improve throughput efficiency across decentralized applications. These are meaningful infrastructure enhancements that can benefit virtually every Plutus-based application deployed on Cardano.

The proposal also delivers important long-term ecosystem value through its emphasis on formal verification, conformance testing, and security auditing. As node diversity becomes increasingly important to Cardano’s decentralization strategy, having stronger implementation-independent specifications and property-based conformance testing becomes critical for preventing consensus inconsistencies across future node clients and evaluators. Expanding the Plutus metatheory and formalizing built-in semantics in Agda strengthens Cardano’s research-driven foundations and reinforces the network’s reputation for correctness and high assurance engineering.

Equally important are the developer experience improvements outlined within the proposal. The current onboarding and tooling experience for Plutus developers remains significantly more complex than competing ecosystems, particularly due to dependency management, compiler friction, and difficult setup requirements. Efforts to simplify installation, reduce reliance on Nix, improve compiler ergonomics, and deliver clearer source-level error messaging represent practical improvements that can lower barriers to entry and improve developer adoption over time.
