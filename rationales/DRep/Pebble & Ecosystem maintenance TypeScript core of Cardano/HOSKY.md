<!-- url: ipfs://QmR49vocRaFDW9NR1g6tLfHbNt1C8maATdWhR1SBJK679q -->
# HOSKY

**Proposal:** Pebble & Ecosystem maintenance TypeScript core of Cardano
**Vote:** Yes
**Voter ID:** `drep1yf2jzhuc4f7eu2yay9d9ta3dykxxcwn34wz8kak7nhd7vcgrxn7ns`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmcbyJbWvBi15SWq3mwAFbdymCiAuYT2nvoZh19s8DGfEY

Voting Yes. ₳4,600,000 over 12 months for Harmonic Laboratories across two tracks: Pebble, an imperative smart-contract language compiling to UPLC, and ongoing maintenance of the TypeScript stack that production projects already depend on. Gerolamo is funded under a separate action and voted independently. Strong fit across the Cardano First framework:

- **Adoption:** Lead pillar. Pebble gives the TypeScript and Web2 developer pool a familiar imperative syntax that compiles to on-chain code, the highest-leverage onboarding lever Cardano has. The maintenance half matters as much: the HLabs stack (cardano-ledger-ts, ouroboros-miniprotocols-ts, plutus-machine, uplc) already sits under Mesh, Lucid Evolution, and Midgard, so this is infrastructure the existing builder base ships on today, kept synchronized with each hard fork.
- **Decentralization:** HLabs is an independent, Cardano-native R&D firm, not an incumbent. Funding a second serious tooling lineage outside the IO, CF, and Intersect orbit reduces single-vendor concentration in the parts of the stack developers touch daily. Same logic as my Yes on Amaru, Dingo, and Pebble + Gerolamo.
- **Scalability:** Pebble compiles to optimized UPLC that, per HLabs' published benchmarks, outperforms Aiken and stays competitive with Plutarch. Smaller, cheaper scripts are a direct execution-efficiency gain. The proposal commits Pebble to public UPLC-CAPE benchmark submissions, so the performance claim is verifiable against Intersect's suite rather than self-reported.
- **Economic Sustainability:** Contested. ₳4.6M is a grant, not a loan, so no capital returns directly. What makes it acceptable: the ask follows the Amaru FTE-valuation standard (5 FTE at $200k, 0.25 ADA/USD, 15% contingency), every quarter is gated on accepted deliverables, and non-delivery sweeps funds back rather than spending them anyway.
- **Governance Transparency:** Funds sit in the audited SundaeSwap treasury.ak / vendor.ak escrow and release only as an independent oversight committee co-signs each milestone, against public artifacts (tagged npm release, UPLC-CAPE submission, green CI log) rather than self-reported progress. Milestone 0 draws only ₳400,000 at kickoff, contingency is held back across the engineering quarters, and an independent third-party financial audit runs quarterly plus a final assessment.

Splitting Gerolamo into a separate action means this ask funds a tighter scope than the earlier combined HLabs budget did.

**Risks I'm accepting with this Yes:**

1. **Greenfield language adoption.** Pebble is pre-production, and the thesis that TypeScript-shaped syntax pulls new builders onto Cardano is unproven on-chain. Aiken already holds the functional-programming segment. If Pebble fails to attract developers, the language half underdelivers.
2. **Single-vendor dependency.** Funding HLabs deepens reliance on one firm for critical TypeScript infrastructure; if HLabs stalls, Mesh, Lucid Evolution, and Midgard inherit the exposure. Milestone gating protects the money, not the concentration in the dependency graph.
3. **Grant with no repayment.** Recovery depends on the non-delivery sweep, not revenue or repayment. I accept that the public-good nature of core tooling justifies a grant structure, the same way prior core-infrastructure withdrawals have been treated.

Critical TypeScript infrastructure the ecosystem already runs on, a new on-ramp for the largest developer pool on earth, milestone-gated escrow with independent oversight. Yes.
