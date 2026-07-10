<!-- url: ipfs://QmS3y6JnNTQwMbjXKJLPxR2Qbujzj7vTqX4jFeP7eLfxcj -->
# Ace Alliance

**Proposal:** Hard Fork to Protocol Version 11 ('van Rossem' Hard Fork)
**Vote:** Yes
**Voter ID:** `71aa5b3a9240a02a89c4e2839579ec5eb60c410af0a5bb483e1b8f04`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: ipfs://QmXAfxZJkamSf5nCvhR8XJ85iRmQHznf1mgHHhsoXi45ZT

"Hard Fork to Protocol Version 11 ('van Rossem' Hard Fork)" is a Hard Fork Initiation governance action proposing to upgrade Cardano mainnet from Protocol Version 10.0 to Protocol Version 11.0. The upgrade is intra-era: the ledger remains in the Conway era and the transaction format is unchanged. On-chain effects include activation of five sets of new Plutus primitives (CIP-0109, CIP-0132, CIP-0133, CIP-0138, CIP-0153), unification of built-in function availability across Plutus V1, V2, and V3, native `case` expressions on `Bool`, `Integer`, and `Data` in Untyped Plutus Core, and several ledger and node enhancements (VRF key hash uniqueness enforced at the ledger level; revised reference input rules for Plutus V1/V2; the Constitutional Committee voting restriction promoted from a mempool check to a ledger predicate; a rewritten non-matching withdrawals predicate; and improved `PPView` mismatch reporting). The governance action was recommended by Intersect's Hard Fork Working Group on 2026-06-15 and endorsed by Intersect's Technical Steering Committee on 2026-06-16. Intersect is an industry body closely associated with IOG, the entity historically most involved in Cardano's core protocol development; we note this connection once and apply identical constitutional scrutiny regardless of origin.

**Article II.6.1-2 (Governance Action Standards).** The proposal anchors its justification to an immutable IPFS document (anchor hash `7f683eaf65629963cdc726e0cb7d3be295eb586fc5ba93985878f98e29cee897`). The document provides a title, abstract, motivation, and a detailed rationale covering technical evaluation (functionality, security, performance, sustainability) and an explicit guardrail compliance analysis authored by the proposer. It names the Hard Fork Working Group's recommendation date (2026-06-15) and the TSC endorsement date (2026-06-16), links to published performance benchmark results for cardano-node 11.0.1, and references security audits for Plutus BLS primitives and execution costs across all new primitives. The proposal satisfies the format and rationale content standards of Article II.6.1 and II.6.2.

**Article II.6.3 (Technical Review Requirement).** The Constitution requires "Hard Fork Initiation" actions to "undergo sufficient technical review and scrutiny as mandated by the Guardrails." The proposal documents a layered review chain: recommendation by Intersect's Hard Fork Working Group (2026-06-15), endorsement by Intersect's Technical Steering Committee (2026-06-16), security audits for Plutus BLS primitives and all new primitive execution costs, and publicly accessible performance results for cardano-node 11.0.1 showing no regressions in standard value, Plutus, and voting benchmarks. This constitutes sufficient technical review under Article II.6.3.

**Appendix I.4 (HARDFORK Guardrails).** Eight guardrails govern Hard Fork Initiation actions. We assess each in turn.

**HARDFORK-01** requires the major protocol version to be the same as or one greater than the immediately prior version; if one greater, the minor version must be zero. The current protocol version is 10.0; this action proposes version 11.0. The major version increases by exactly one and the minor version is zero. HARDFORK-01 is satisfied.

**HARDFORK-02a** applies only when the major protocol version does not change. Because the major version changes from 10 to 11, HARDFORK-02a does not apply. The minor-version requirement in this case is governed by HARDFORK-01.

**HARDFORK-03** requires at least one of the protocol versions (major or minor or both) to change. The major version changes from 10 to 11. HARDFORK-03 is satisfied.

**HARDFORK-04a** (non-automated, marked "x") requires that at least 85% of stake pools by active stake have upgraded to a node version capable of processing the new protocol rules before ratification. This guardrail cannot be checked by the automated guardrails script and must be assessed by the Constitutional Committee at the time of voting. As of 2026-06-30, Intersect's Hard Fork Working Group readiness reports confirm that the SPO block-signaling threshold for Protocol Version 11 readiness has been met, and that DApp and exchange ecosystem readiness thresholds have also been met. HARDFORK-04a is satisfied.

**HARDFORK-05** (non-automated, marked "x") requires any new updatable protocol parameters introduced by the hard fork to be included in the Appendix with guardrails defined. The proposal states, and we find, that no new updatable protocol parameters are introduced. HARDFORK-05 is satisfied.

**HARDFORK-06** (non-automated, marked "x") requires settings for any new protocol parameters to be included in the appropriate Genesis file. No new protocol parameters are introduced, so no Genesis file changes are required. HARDFORK-06 is satisfied.

**HARDFORK-07** (non-automated, marked "x") requires deprecated protocol parameters to be indicated in the Appendix. The proposal states, and we find, that no protocol parameters are deprecated. HARDFORK-07 is satisfied.

**HARDFORK-08** (semi-automated, marked "~") requires new Plutus versions to be supported by a version-specific Plutus cost model covering each available primitive. This hard fork introduces no new Plutus language version; new primitives are made available across the existing Plutus V1, V2, and V3 versions. Cost model entries for the new primitives are enacted by a companion Protocol Parameter Change governance action (`gov_action1eqhnsdyf3exhp5mqt7sdjtl7xy69wqg8tvg854psns2jt72cra3qqrcnr8r`), which Ace Alliance has separately assessed as Constitutional. The new primitive entries activate only after enactment of the PV11 hard fork. HARDFORK-08 is satisfied.
