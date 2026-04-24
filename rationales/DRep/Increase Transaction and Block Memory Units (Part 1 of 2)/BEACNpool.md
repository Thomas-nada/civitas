<!-- url: ipfs://bafkreicrb4esd47a2epounxg2v7ihzsvavrm5kjca2eco3uru3slqvjg2m -->
# BEACNpool

**Proposal:** Increase Transaction and Block Memory Units (Part 1 of 2)
**Vote:** Yes
**Voter ID:** `drep1y2jn8fk0cn6wd6et3evnykea0glhw7t20xnhwss4xxjlczq29343n`

---

Why YES

Directly reduces friction for Plutus development and users: Raising maxTxExecutionUnits[memory] helps scripts fit within per‑tx limits without awkward refactors/splitting, which reduces failed transactions and complexity.
Keeps tx vs block constraints consistent: Increasing both per‑tx and per‑block memory in tandem preserves the current “how many max-size Plutus txs fit in a block” relationship (still effectively ~4), avoiding a lopsided constraint that would create new bottlenecks.
Incremental + within guardrails: This step uses the maximum allowed per-epoch increments (MTEU‑M‑04 + MBEU‑M‑03) and is explicitly structured as Part 1 of 2 to respect MTEU/MBEU change-rate limits and reduce risk.
Evidence-based + tested: The change was benchmarked on node 10.2/10.3 by IOE performance/tracing, and equivalent updates were already enacted on Preview and PreProd without reported systemic issues. That’s the right pattern for low-risk parameter evolution.
No cost model change / no new primitives: Keeping scope tight (only memory-unit ceilings) lowers the surface area for unintended side effects.
Risk note / what I’ll watch

Any parameter increase can stress block propagation on weaker hardware/networks. I’m comfortable voting YES because the proposal includes benchmarking against diffusion budgets and claims adequate headroom, but I’ll be watching for: increased missed slots, longer validation times, or relay/BP resource regression after enactment.
Part 2 should remain conditional on mainnet telemetry after Part 1: if real-world metrics disagree with benchmarks, Part 2 should be delayed or resized.
Bottom line: This is a conservative, well-justified step that improves smart-contract throughput and developer ergonomics while respecting constitutional guardrails and operational safety—so YES.
