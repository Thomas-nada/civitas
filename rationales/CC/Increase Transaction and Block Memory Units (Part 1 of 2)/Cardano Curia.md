<!-- url: ipfs://QmUfhfh87wvLrGWGxDseVhK6ua4y3CyeeCxFnGC9n1Ud2r -->
# Cardano Curia

**Proposal:** Increase Transaction and Block Memory Units (Part 1 of 2)
**Vote:** Yes
**Voter ID:** `84feba943c574d25984175cf8257959e6b3a1c64143d85e64fef6bd5`

---

## What is being proposed
This governance action proposes a **Protocol Parameter Change** (part 1 of a linked two-step plan) to increase Plutus script memory execution limits, and explicitly states that **no other protocol parameters or cost model settings** will be changed.

The proposed updates are:
- `maxTxExecutionUnits[memory]`: **14,000,000 → 16,500,000** (+2,500,000)
- `maxBlockExecutionUnits[memory]`: **62,000,000 → 72,000,000** (+10,000,000)

## Constitutional and guardrails consistency (v2.4)
### Execution-budget guardrails
The proposed values and deltas are consistent with the applicable Guardrails:
- `maxTxExecutionUnits[memory]` remains below the hard cap (MTEU-M-01), is non-negative (MTEU-M-02), is not decreased (MTEU-M-03), and the increase equals the maximum recommended per-epoch increment (MTEU-M-04).
- `maxBlockExecutionUnits[memory]` remains below the hard cap (MBEU-M-01), is non-negative (MBEU-M-02), and the change equals the maximum recommended per-epoch increment (MBEU-M-03).
- The rationale states that **benchmarking/simulation** has been performed for the per-block change and that Praos timing guarantees remain intact, directly targeting the mandatory performance requirement in MBEU-M-04a.
- The relationship `maxBlockExecutionUnits[memory] ≥ maxTxExecutionUnits[memory]` is preserved (MEU-M-01).

### Voting and process guardrails for critical parameters
The rationale explicitly acknowledges that `maxBlockExecutionUnits[memory]` is a **critical protocol parameter** and therefore requires the additional SPO voting threshold alongside DRep approval (PARAM-03a).

It also addresses the notice expectation for critical parameter updates (PARAM-04a), stating that the intent to propose the on-chain change was published off-chain on **2025-07-07** and is not being justified as a Severity 1/2 emergency relaxation.

### Network-change cadence and correlation
The two parameters changed here are directly correlated and are proposed together in alignment with NETWORK-02. The rationale also asserts that recent linked updates did not violate the cadence restriction for these parameters (NETWORK-01).

## Technical scrutiny and evidence (as described in the rationale)
The rationale reports:
- Intersect Parameter Committee recommendation (2025-05-08) and Intersect Technical Steering Committee ratification (2025-10-01).
- Equivalent testnet enactments: Preview (October 2025) and PreProd (November 2025).
- Performance evaluation by IOE’s Performance & Tracing team (node versions 10.2 and 10.3), concluding adequate timing headroom and no breach of Praos timing guarantees.

These points are the appropriate types of evidence for the Constitution’s expectation that parameter updates receive sufficient technical review and do not endanger security, functionality, performance, or long-term sustainability.

## Tenets alignment
The stated motivation—reducing developer friction, reducing inefficient transaction-splitting, and enabling more useful work per block while staying within measured safety margins—aligns with the Constitution’s Tenets, particularly:
- enabling developers to deploy applications without unreasonable barriers; and
- avoiding unreasonable waste of resources while evolving the system safely.

## Determination
Based on the stated deltas, guardrails mapping, and the described benchmarking and review process, Cardano Curia identifies **no clear conflict** with Constitution v2.4 and therefore finds the action **constitutional**.
