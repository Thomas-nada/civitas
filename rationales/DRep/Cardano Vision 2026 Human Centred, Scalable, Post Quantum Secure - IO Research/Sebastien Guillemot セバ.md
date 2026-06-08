<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmdY8vUrgmgHzNkiRhoeyPWsvKAc2EVaDJ67QKpE2obV2p -->
# Sebastien Guillemot セバ

**Proposal:** Cardano Vision 2026 Human Centred, Scalable, Post Quantum Secure - IO Research
**Vote:** Yes
**Voter ID:** `drep1y2csyxt7u2hl4674pl9cef5lknafaw5nraxvyx033kmd0es3awuv0`

---

Generally supportive, but here is my ranking of priority from the items listed:
- Consensus improvements
- Data availability
- Post-quantum (VRF/KES)
- EasySM (maybe, little detail on what this actual is)
- Mithril

Here are the ones I'm less sure of given the current capabilities/priorities of Cardano:
- compliance use cases
- Identity / selective disclosure of identity
- SPO incentives
- HSM-enabled node CPS and prototype integration for secure KES/VRF key management
- Hydra

Here are things I don't really feel are research problems
- minUTXO / atomic swap prototype
- agent chain specification
- Babel fees (there are different constructions possible (esp. with ZK), but we should build a v1 before going too far on research on this

Unsure
- Cavefish protocol: it's a very interesting primitive. I feel for any powerful enough privacy-preserving ZK system, you can achieve a similar result with recursive SNARKs. Therefore, this proposal is useful when you don't have / don't want ZK compute on the L1 (just use plain signatures). I do think there is some possibilities for this to be powerful (esp. around the fact that the onchain cost is low given you don't need an onchain verifier circuit). I'd be interested in seeing the CPS - especially on how this might relate to babel fees which has a bit of conceptual overlap
- ZK verification toolkit (unclear why should be done other than just precompiles). There are ways general "recursive systems" could help, but it's a bit vague which Cardano initiative this would be targeted to (Starstream, Midnight, bridging, identity, something else?). Fundamental theoretical research is fine (many open problems), but just not enough specification provided for me to really judge this one
