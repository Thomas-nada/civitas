<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmPAoiV8wniaeJgAjcqWGy4LrtuTZEcfzhvTsakKPVerEW -->
# RCADA

**Proposal:** IO & VacuumLabs Enhancing Plutus - Performance, Correctness, and Usability
**Vote:** Yes
**Voter ID:** `drep1yf7kjx5rlyuyzxkr4dzyccdfs8tesh29amrtcpyplu3asnqjgmdz3`

---

## RCADA Rationale

RCADA votes **YES** on the **IO & VacuumLabs: Enhancing Plutus - Performance, Correctness, and Usability** Treasury Withdrawal proposal.

We support this proposal because Plutus is foundational to Cardano’s smart contract ecosystem. The cost, expressiveness, correctness, and usability of Plutus directly affect what developers can build, how safely they can build it, and whether Cardano can remain competitive as a serious platform for DeFi, high-assurance applications, zero-knowledge use cases, and broader on-chain utility.

This proposal addresses three connected areas: improving Plutus capabilities and execution efficiency, strengthening formal specification and conformance testing, and improving developer experience. RCADA sees these as mutually reinforcing rather than unrelated workstreams. A smart contract platform should be cheaper to use, easier to build with, and more rigorously specified as the ecosystem matures.

The performance and capability work is important because execution costs remain a practical constraint for Cardano applications. Features such as built-in casing on `Data`, implementation of `multiIndexArray` from CIP-0156, additional `BuiltinValue` functions from CIP-0168, and investigation into scope-check removal, laziness, and memoization could reduce script size, lower execution budgets, and unlock more efficient contract patterns. These improvements can make Cardano more attractive to developers and improve the user experience of applications that depend on Plutus. 

RCADA also values the formal specification, correctness, and security work. As alternative node implementations and independent Plutus evaluators become more realistic, Cardano needs stronger implementation-independent specifications and conformance testing. A property-based conformance framework, Agda formalisation of built-in semantics, and structured security review of evaluator and costing logic all help reduce the risk of subtle consensus or execution differences. This is exactly the type of foundational work that supports a safer multi-client future. 

The developer-experience work is also welcome. Cardano smart contract development has a reputation for being powerful but difficult to approach. Better compiler architecture, clearer source-level error messages, reduced boilerplate, broader GHC support, and simpler setup without heavy Nix or native dependency friction could help more developers move from experimentation to production. RCADA has consistently encouraged practical documentation, tooling, and onboarding improvements, and this proposal includes meaningful steps in that direction.

We also view the collaboration with **VacuumLabs** positively. RCADA does not want Cardano’s core infrastructure to depend indefinitely on a single organisation. At the same time, the answer is not simply to replace one dominant provider with another. The healthier path is progressive multi-party stewardship, where specialist teams contribute to shared public infrastructure according to their strengths. The IO and VacuumLabs co-venture is a constructive example of that model for Plutus.

However, our YES vote should not be read as unconditional endorsement of every future protocol change described in this proposal.

Some of the benefits depend on future hard-fork activation. The proposal states that language and built-in extensions require a hard fork for activation on mainnet, with Dijkstra as the target. RCADA views this vote as support for development readiness, formalisation, testing, and implementation work. Any future hard-fork activation should remain subject to separate technical, governance, ecosystem, and constitutional review. 

We also note the familiar concern around budget transparency. The proposal requests **₳11,877,575**, with a large share grouped under development. While specialist compiler, language, formal-methods, and security work is expensive and requires rare expertise, future proposals would benefit from clearer partner-level cost attribution, staffing assumptions, and milestone-level payment detail. Treasury-funded technical work should be understandable and auditable by the wider community, not only by insiders.

RCADA also encourages early and continuous coordination with downstream tooling teams. Plutus changes can affect compilers, wallets, indexers, auditors, alternative evaluators, DApp developers, and educational resources. To avoid unnecessary disruption, these improvements should be accompanied by strong documentation, migration guidance, conformance tests, examples, and public communication.

Overall, RCADA believes this proposal is well aligned with Cardano’s strategic needs. It strengthens the smart contract foundation, supports formal correctness, improves performance, improves developer usability, and helps distribute Plutus stewardship across expert teams. It is a broad proposal, but the workstreams are connected by a coherent goal: making Plutus cheaper, safer, and easier to use.

For these reasons, RCADA votes **YES**, while emphasising the importance of downstream coordination, clear documentation, separate scrutiny for future hard-fork activation, measurable delivery, and improved cost transparency in future Plutus funding requests.

RCADA's full vote assessment can be found here: "https://brolloks.github.io/rcada-drep-votes/".
