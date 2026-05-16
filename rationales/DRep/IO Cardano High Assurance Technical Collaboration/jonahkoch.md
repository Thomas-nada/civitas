<!-- url: ipfs://QmUFkz2izK2zzcKN1xuvvg4kSQ7bP57xcJNyo8bu5kAFCS -->
# jonahkoch

**Proposal:** IO Cardano High Assurance Technical Collaboration
**Vote:** Yes
**Voter ID:** `drep1yt8trnz8e5cnylmyygt0pyzrfw92rt9s42kg8t4rhm6t0dstyvmdn`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmQqa8RUFx5m36iTMPUesr8hzXBZGVcaG61yT9qsRSfZf1

I'm voting yes because this proposal makes Cardano's formal verification capability accessible and accessible is the operative word. Blaster already proved correctness properties for Djed and USDCx at production scale. The 2025/26 cycle demonstrated the core works. This cycle opens that tooling to the full ecosystem, extends it from single-contract to DApp-level verification, integrates it into four smart contract languages, and delivers it through a developer environment that replaces multi-day Nix configuration with a 60-second initialization.
At ₳13,078,578 (~$3.14M at $0.24) with 86% allocated to development across a nine-organization consortium consisting of IO, Lantr (Scalus), Harmonic Labs (Pebble), SAIB (Futura), Midgard Labs (Aiken), TxPipe, and No.Witness Labs each holding defined work packages, this is complex orchestration efficiently structured for its scope and duration and only possible by IO. Formal methods specialists with production-level Lean 4 depth are scarce; and therefore the implied FTE cost is appropriate. The workstream split (₳10.1M Blaster, ₳2.97M CBDE) is transparent.
Three deliverables align directly with priorities I hold and use to inform my decisions. The Container-Based Developer Environment converts the multi-day Nix setup barrier into a single command, this is the accessibility work that makes Cardano's high-assurance tooling available to developers who are building, not just the narrow cohort that can configure it. The Common Vulnerability Library containing pre-built property templates for Double Satisfaction, Large Value Attack, and Large Datum Attack, produced with auditing partners and open for contribution, democratizes security analysis that currently requires expensive specialist. The VS Code Extension V2 includes an LLM-friendly counterexample format for AI-assisted debugging, which is exactly the kind of AI/LLM integration that should be embedded in Cardano's developer tooling from the start rather than bolted on afterward and early alignment is critical.
The proposal is honest about the hard parts. Scaling from single-contract to multi-script DApp-level verification is rated "Medium" likelihood and "High" severity; the formal methods team is small and subject to IO reprioritization risk. It's equally honest about what's not funded: community outreach is a stated benefit dependency requiring coordination with the Developer Experience Initiative, while this proposal builds the tools, it’s not the distribution flywheel. Standard milestone-based Intersect governance keeps funding accountable.
