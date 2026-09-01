<!-- url: ipfs://QmUUtZXJCSxddsxH29WNvoJEU25Dix3jqHPQ2uGBeVbQWm -->
# Cardano Curia

**Proposal:** Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2)
**Vote:** Yes
**Voter ID:** `84feba943c574d25984175cf8257959e6b3a1c64143d85e64fef6bd5`

---

## Governance action

This governance action is a Protocol Parameter Change proposing three effective parameter changes: reduction of minPoolCost from 170 ada to 75 ada, increase of maxTxExecutionUnits[memory] from 16,500,000 to 17,500,000 units, and increase of maxBlockExecutionUnits[memory] from 72,000,000 to 77,500,000 units. The Plutus memory changes constitute Part 2 of the previously reviewed staged increase and complete the intended cumulative 25 percent increase from the original values.

## Governance action standards

Cardano Curia finds that the action is properly framed as a Parameter Update and provides a sufficiently clear description of the parameters being changed, their existing and proposed values, the reasons for the changes, and the supporting technical and economic evaluation. The proposal is anchored using content-addressed governance metadata, supporting the immutability and auditability requirements applicable to governance actions.

Article II, Section 6 requires Parameter Update actions to undergo sufficient technical review and scrutiny so that they do not endanger the security, functionality, performance, or long-term sustainability of the Cardano Blockchain. The supporting record demonstrates prior technical review, testing and performance analysis for the proposed Plutus memory limits, together with an economic rationale for the minPoolCost adjustment.

## minPoolCost

The proposal reduces minPoolCost from 170 ada to 75 ada. This remains within the applicable mandatory guardrails. MPC-01 requires minPoolCost not to be negative, and MPC-02 establishes a maximum of 500 ada. The proposed 75 ada value satisfies both requirements.

MPC-03 further provides that minPoolCost should be set in line with the economic cost of operating a stake pool. The proposal explains that the economic environment has changed materially since the earlier calibration of the parameter, including declining block rewards and changing operating economics. The proposed adjustment is therefore supported by an identifiable economic rationale rather than being an arbitrary parameter change.

Because minPoolCost is identified as a parameter critical to the governance system, the applicable DRep voting requirement under PARAM-05a is engaged. The proposal was also publicly developed sufficiently in advance of the on-chain action to satisfy the constitutional expectation for prior publication and review under PARAM-06a.

Cardano Curia further notes that lowering minPoolCost does not compel any stake pool operator to adopt a particular operating margin or fee strategy. It adjusts the protocol-level minimum and provides operators with greater flexibility while remaining inside the constitutional boundaries established for the parameter.

## Plutus memory limits

The action increases maxTxExecutionUnits[memory] from 16,500,000 to 17,500,000 units. This remains substantially below the 40,000,000-unit maximum established by MTEU-M-01. The increase is 1,000,000 units, which is also below the 2,500,000-unit per-epoch change guidance in MTEU-M-04.

The action increases maxBlockExecutionUnits[memory] from 72,000,000 to 77,500,000 units. This remains substantially below the 120,000,000-unit maximum established by MBEU-M-01. The 5,500,000-unit increase also remains below the 10,000,000-unit per-epoch change guidance in MBEU-M-03.

The proposed block memory limit remains significantly greater than the transaction memory limit, consistent with MEU-M-01. Neither parameter is decreased, and the proposed values remain positive and well within their mandatory ceilings.

The proposal supplies evidence of technical evaluation of the complete intended increase, including testing of the target memory values and performance analysis indicating adequate headroom in relevant timing metrics. This supports compliance with the performance-oriented requirements of MBEU-M-04a and Article II, Section 6 regarding security, functionality and network performance.

Increasing the Plutus memory limits provides additional execution capacity for applications while preserving the constitutional requirement that parameter changes remain within safe operational boundaries. The staged approach is also consistent with the guardrails' preference for measured rather than abrupt parameter adjustments.

## Voting requirements

The action engages both governance-critical and security-relevant parameter categories. minPoolCost engages the applicable DRep requirement, while maxBlockExecutionUnits[memory] is a parameter critical to blockchain operation and therefore engages the applicable SPO voting requirement under PARAM-03a. The governance action does not seek to bypass or diminish either voting body's constitutional role.

## Bundling of changes

Cardano Curia acknowledges that the minPoolCost adjustment and Plutus memory-limit increases address different policy objectives. Bundling can reduce voter granularity because voters must evaluate the package as one governance action. Nevertheless, the Constitution does not prohibit such bundling where each parameter change independently complies with the applicable guardrails and the combined action preserves all required voting thresholds.

The two Plutus memory parameters are directly correlated and are appropriately considered together. The minPoolCost change independently satisfies its economic and governance-system guardrails. Cardano Curia therefore identifies no constitutional violation arising solely from their inclusion in the same Parameter Update action.

## Constitutional determination

Each effective parameter change remains inside the applicable mandatory constitutional limits. The proposal provides adequate economic and technical justification, preserves the roles of DReps and SPOs, follows a measured staged approach for the Plutus memory increase, and provides supporting evidence addressing network performance and sustainability.

Cardano Curia therefore finds no constitutional basis to reject this governance action.
