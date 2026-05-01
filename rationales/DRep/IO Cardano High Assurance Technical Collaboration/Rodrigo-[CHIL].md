<!-- url: https://gateway.pinata.cloud/ipfs/Qmafm1wUUaTHNRxgcqfvCbJCgayeTWbRsacyMtkaPfbN1y -->
# Rodrigo-[CHIL]

**Proposal:** IO Cardano High Assurance Technical Collaboration
**Vote:** Yes
**Voter ID:** `drep1y2j2q9pcl855969ea9csrhdta6slnamctgzuvuqnnkl6fusqyjy36`

---

**Vote: Yes**

Formal verification is foundational infrastructure for Cardano's next phase. As smart contracts grow in complexity — composing multiple scripts, interacting with oracles, MCPs, and autonomous agents — the attack surface expands beyond what testing and manual audits can reliably cover. Formal methods are the only approach that can prove the absence of vulnerabilities, not merely detect the ones testers thought to look for.

Cardano's eUTxO model is uniquely suited to formal reasoning: discrete state, determinism, no side effects. Blaster operating on UPLC as the common compilation target means investment in verification infrastructure benefits every smart contract language simultaneously — Aiken, Pebble, Scalus, Futura, and any future language that compiles to UPLC.

The technical scope is well-designed. Extending Blaster from single-contract to DApp-level verification addresses a real gap: production protocols are multi-script systems, and verifying scripts in isolation cannot capture cross-script invariants. The equivalence checking tool enables aggressive UPLC optimization with machine-checked correctness guarantees, directly improving throughput utilization. The Common Vulnerability Library and VS Code extension lower the barrier so that formal verification becomes part of the standard development workflow rather than an expert-only capability.

The collaboration model distributing work across Lantr, Harmonic Labs, SAIB, Midgard Labs, TxPipe, and No.Witness Labs is a welcome step toward decentralizing critical tooling expertise beyond IO.

CBDE addresses a real friction point. Multi-day environment setup is a measurable barrier to developer adoption, and packaging the full high-assurance toolkit into a single-command initialization is a practical contribution to onboarding.

**However, this approval comes with noted concerns:**

The budget allocates 86% to "Development" across both workstreams but provides no breakdown by collaborating team. The pr
