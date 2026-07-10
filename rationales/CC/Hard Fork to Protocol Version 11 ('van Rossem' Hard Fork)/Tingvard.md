<!-- url: https://ipfs.blockfrost.dev/ipfs/QmXn54EgcjHg2AHqZNUggTshUgkPV6Sxu7ebtwjhTpUMM7 -->
# Tingvard

**Proposal:** Hard Fork to Protocol Version 11 ('van Rossem' Hard Fork)
**Vote:** Yes
**Voter ID:** `646d1b3ac94568a422b687db6c47acdf849f1674982ae4f9a494be43`

---

This governance action proposes to upgrade Cardano Mainnet to Protocol Version 11.0 through an intra-era hard fork, remaining within the Conway era.

The proposal explains that the hard fork introduces new Plutus primitives, makes built-in functions available consistently across Plutus V1, V2 and V3, supports case expressions for built-in types in Untyped Plutus Core, and introduces several ledger and node-level improvements.

The proposal provides technical rationale for the upgrade, including functionality, security, performance, and sustainability considerations. It states that the action was recommended by Intersect’s Hard Fork Working Group on 2026-06-15 and endorsed by Intersect’s Technical Steering Committee on 2026-06-16.

The proposal identifies the applicable hard fork guardrails:

HARDFORK-01
HARDFORK-02
HARDFORK-03
HARDFORK-04
HARDFORK-05
HARDFORK-06
HARDFORK-07
HARDFORK-08

The proposed change from protocol version 10.0 to 11.0 satisfies HARDFORK-01, HARDFORK-02, and HARDFORK-03. The major version increases by one, the minor version remains 0, and at least one protocol version component changes.

The proposal states that HARDFORK-05, HARDFORK-06, and HARDFORK-07 are satisfied because no new protocol parameters are introduced and none are deprecated.

The proposal states that HARDFORK-08 is satisfied because no new Plutus version is introduced. The new Plutus primitives are made available across Plutus V1, V2 and V3, with the corresponding cost model entries provided through a separate protocol parameter update governance action.

HARDFORK-04 requires that at least 85% of stake pools by active stake should have upgraded to a Cardano node version capable of processing the new protocol version before ratification. The proposal acknowledges this requirement and states that readiness will need to be determined before ratification, supported by readiness reports from Intersect’s Hard Fork Working Group.

Tingvard therefore finds that the proposal satisfies the relevant constitutional requirements, provided that the HARDFORK-04 readiness condition is met before ratification.
