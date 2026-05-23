<!-- url: ipfs://QmVv1wNo99U9PtEyK48sSSFKbZdFVSStDiMJnCd4VTGcfE -->
# HOSKY

**Proposal:** IO Cardano High Assurance Technical Collaboration
**Vote:** Yes
**Voter ID:** `drep1yf2jzhuc4f7eu2yay9d9ta3dykxxcwn34wz8kak7nhd7vcgrxn7ns`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmdR7J3s7H3VN1mYfYamYtWbuqARmjxJCfEXRPJm3t4Cza

## Vote: Yes

₳13.08M for two workstreams that operationalise Cardano's security-and-correctness differentiator for the broader developer pool.

Blaster, IO's automated formal verification tool, scales from single-script to full DApp-level verification with native integration into Aiken, Pebble, Scalus, and Futura. CBDE (Container-Based Developer Environment) replaces a multi-day Nix setup with a one-command containerized Plinth toolkit. The HOSKY Cardano First framework reads strongly across multiple pillars.

## Pillar Analysis

### Adoption (lead pillar)

CBDE eliminates the Nix-and-C-library setup step that the proposal characterizes as the source of 60-70% developer onboarding attrition; the target is under 20%. Blaster's VS Code extension, language integrations, and Common Vulnerability Library mean formal verification stops being a specialist activity and becomes a default in the standard developer workflow.

Both shift Cardano's security promise from "available to teams with formal methods budgets" to "available to every Plinth developer by default."

### Decentralization

The Blaster work is structured as a real multi-team consortium: Lantr (Scalus), Harmonic Labs (Pebble), SAIB (Futura), Midgard Labs, IO (Aiken), No.Witness Labs, and TxPipe each own defined work packages. The Common Vulnerability Library and the Universal Annotation Language are delivered as shared public infrastructure that any future language team can integrate against.

Same logic as my Yes on Pebble + Gerolamo and Dingo on distributed stewardship.

### Scalability

The equivalence checking tool enables aggressive UPLC optimization with machine-checked semantic preservation, which is the kind of compounding tooling improvement that pays back to every contract. Reducing execution-unit consumption per transaction is a complementary throughput lever to Leios, not a substitute. Lean-Blaster as an automated formal verification backend for Lean 4, with formal UPLC semantics and a CEK machine formalization, is genuine research-grade infrastructure that the optimization work compounds against.

### Governance Transparency

Standard Intersect 2025 TRSC pattern: milestone-gated disbursement, third-party Assurer, unspent funds return to Treasury.

Cardano's claim to be the chain for serious applications rests on formal methods being usable in practice. This proposal funds the work that makes that claim operational for the developer pool that does not bring a formal methods background.

## Risks I'm Accepting With This Yes

### Blaster pivot from IO-internal to public infrastructure

Blaster has been an internal tool used on IO-led DApps (Djed, USDCx). Restructuring as a multi-team consortium with cross-language integration is a real shift. The consortium model is the right structural shape but execution risk exists.

### CBDE depends on the already-funded cardano-init

CBDE integrates with the cardano-init Setup CLI from the Developer Experience proposal. Cross-proposal dependency that sits outside this proposal's scope.

### Self-reported KPIs

"3-5x increase in active Plinth developers within 12 months" and the 60-70% to under 20% drop-off reduction are proposer-estimated. The structural deliverables (Blaster integrations, CBDE container, VS Code extension, Common Vulnerability Library, equivalence checker) are independently verifiable; the downstream adoption claims will need community measurement.

### Formal methods adoption is downstream of education and culture

Funding the tooling does not guarantee community uptake. Developer training and DApp-team buy-in are the harder parts and not in scope here.

### Slate aggregation

Part of the roughly ₳141.9M IO slate across seven actions. Each action stands alone.

## Bottom Line

Cardano's security differentiator becomes real only when formal verification is a default option in the standard developer workflow. **Yes.**
