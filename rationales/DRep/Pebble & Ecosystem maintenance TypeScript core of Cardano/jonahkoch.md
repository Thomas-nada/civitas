<!-- url: ipfs://QmbQt4NgANrSSmT98t6EYfACUfgYPjg8LRDryRjQJQHeEW -->
# jonahkoch

**Proposal:** Pebble & Ecosystem maintenance TypeScript core of Cardano
**Vote:** Yes
**Voter ID:** `drep1yt8trnz8e5cnylmyygt0pyzrfw92rt9s42kg8t4rhm6t0dstyvmdn`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmQHP2UdKBzXsYpswHKos7TtugfRGJW1xMcvZjEFQfuWua

I'm voting yes on HLabs Pebble and TypeScript tooling maintenance for the same reasons I voted yes on the combined proposal this work was originally part of. Separating Gerolamo into its own proposal sharpens the ask, this is a focused five-FTE investment in developer language infrastructure and protocol-synchronized tooling, and both components stand on their own merits.
Pebble fills a paradigm gap that Aiken structurally cannot close. Aiken is functional-first and the right language for developers thinking in Haskell or ML patterns, but the wrong on-ramp for the 17 million TypeScript and JavaScript developers who think imperatively. Pebble delivers an imperative-first surface syntax those developers already know, compiling to UPLC with published benchmark performance that matches or exceeds Aiken while remaining readable to engineers who have never touched a pure functional language. Requiring UPLC-CAPE submission as a milestone acceptance criterion is the right accountability mechanism, the performance claims are independently verifiable against a public benchmark suite, not self-reported. The TypeScript tooling component (cardano-ledger-ts, ouroboros-miniprotocols-ts, plutus-machine, uplc) is the quieter but equally important half of this ask. These libraries are load-bearing for Mesh, Lucid Evolution, and Midgard. When HLabs ships a hard-fork update, the TypeScript ecosystem ships with it. Hard-fork readiness as Milestone 1.B with CI-green acceptance on a Plutus V4 testnet snapshot as the verifiable criterion, this is exactly the kind of public goods maintenance the treasury should be funding.
At ₳4,600,000 (~$1.15M at $0.25), five FTEs at $200K annually lands right at the threshold I apply before flagging premium compensation and it's a step down from the $225K rate in the combined proposal, which I credit. The 15% contingency is labeled honestly as an optimism-bias buffer and is fully refundable if unused. Milestone 0 draws only 10% at kickoff; the remaining 90% releases quarterly on deliverables the oversight board must co-sign before funds move. The board with Carmuega, Rosa, Gianelloni,  has no HLabs stake, and any single member can pause disbursement unilaterally. Same SundaeLabs escrow, same dual-audit framework already approved on Amaru and Dingo.
The structural concerns from the original vote remain: no explicit labor category breakdown, contingency allocated as a blanket buffer rather than against specific risks, and quarterly rather than monthly financial reporting. Those gaps don't change the vote. The milestone acceptance criteria are objective, the oversight board can enforce discipline, and the refundable contingency limits downside exposure. HLabs has a demonstrated track record maintaining this TypeScript stack in production. This is not speculative funding for unproven builders it is sustaining infrastructure already running in production that the ecosystem depends on.
