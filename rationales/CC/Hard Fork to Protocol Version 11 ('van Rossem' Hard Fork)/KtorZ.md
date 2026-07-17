<!-- url: ipfs://QmUJRDnnXvCCjyYZgSU3dAqSyP9rzG3SGKeT7GF2bWu4NG -->
# KtorZ

**Proposal:** Hard Fork to Protocol Version 11 ('van Rossem' Hard Fork)
**Vote:** Yes
**Voter ID:** `64f97568e72ff7e0035b4bae7bb080a10ec6fae5c0f381ed40053a49`

---

The proposal provides a clear technical rationale, demonstrates consistency with the applicable constitutional guardrails, and includes appropriate consideration of deployment readiness and rollback procedures. I therefore find the proposal constitutionally compliant.

I do, however, have significant reservations regarding two aspects of the proposal.


1. The proposed Plutus changes: the proposal extends new semantics to existing Plutus language versions rather than introducing them through a new language version. Not only does this harm adoption (by breaking people's working code without them having done anything about it), it also changes the behaviour of already-deployed smart contracts and departs from Cardano's established approach of preserving language semantics across protocol upgrades. When confronted to the topic, the core team at IOG has admitted preferring this approach over introducing a new language version, and that "manual checks" had been performed to ensure this was safe. This is, however, a slippery slope and allowing ourselves to open this door is extremely dangerous.

For other reasons that cannot be stated publicly, I do not consider this sufficient to render the proposal unconstitutional, yet I believe such changes should be approached with extreme caution and only where there is a compelling justification (and here, there isn't). 


2. Once again, the retroactive modification of the Plutus cost models have a significant impact on dapps development. While the desire to level-set builtins across all Plutus versions may seem like a genuine good idea, it forces every single tool and application downstream into an upgrade that they could avoid. Opting to access new builtins should be a choice, not something forced onto developers. This makes Cardano extremely annoying to work with, especially when obtaining and manipulating the cost models is as annoying as it is (cf: PPViewHashesDontMatch). This is harming adoption. 


Despite these points and given the overall benefits of the hard fork, I do not identify a constitutional violation. Nevertheless, I encourage future protocol upgrades to preserve backwards compatibility wherever possible by introducing semantic changes through new language versions rather than retroactively altering existing ones.
