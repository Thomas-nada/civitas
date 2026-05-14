<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmUuLQo9xkda8UajkHNLT7FgtRuBksgS6Abq1TdCVHVxwo -->
# Dori

**Proposal:** Pebble & Ecosystem maintenance TypeScript core of Cardano
**Vote:** Abstain
**Voter ID:** `drep1yteh8udkttzy7frwl6yj5wzyqc04kx65pwwrqefx9j52ymgr6kuak`

---

I am voting Abstain on the Pebble & Ecosystem maintenance: TypeScript core of Cardano proposal.

This proposal bundles two tracks of work: maintenance of the TypeScript tooling stack, and accelerated development of a new smart contract language, Pebble. My positions on these two are clearly different, and because the proposal does not allow them to be evaluated separately, I am voting Abstain.

I strongly agree with funding the TypeScript tooling maintenance. `cardano-ledger-ts`, `ouroboros-miniprotocols-ts`, `plutus-machine`, and `uplc` are foundational libraries that most of the Cardano TypeScript ecosystem depends on, including Mesh, Lucid Evolution, and Midgard L2. If this maintenance lags during a hard fork, the entire downstream ecosystem stalls along with it. This is public-goods infrastructure, and I believe the Treasury should fund it.

However, I am skeptical about the case for funding Pebble.

1. There is no empirical evidence of demand. The proposal argues that since TS/JS is the largest developer pool in the world, an imperative-syntax language will draw them to Cardano. But there is no concrete signal showing that TypeScript developers who chose not to come to Cardano point to "Aiken's functional paradigm" as the blocker. If anything, in an era where AI has sharply lowered the cost of learning a new language, I think the real barrier is not the language itself but the structural difference between the market-standard EVM and the eUTxO model. Pebble does not address this fundamental barrier.

2. HLabs' own adoption target is very modest. Despite a potential target pool of millions of TS/Solidity developers, the 12-month goal is only 20 developers. Spending ₳3.5M to onboard developers at that scale is difficult to justify.

3. Aiken is already working well. Aiken became the default quickly after mainnet release, and Cardano developer activity has remained steady. There is no observable signal supporting the hypothesis that "the functional paradigm is the bottleneck blocking developer inflow."

I think Cardano's real bottleneck for developer onboarding lies elsewhere. TVL and commercial opportunity, network effects, the learning curve of the eUTxO model itself, and gaps in documentation and tutorials are the larger problems, and Pebble does not solve any of them.

I recognize the value of the tooling maintenance while remaining skeptical about the funding case for Pebble. For these reasons, I am voting Abstain.
