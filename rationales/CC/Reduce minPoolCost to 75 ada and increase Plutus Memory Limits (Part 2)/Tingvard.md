<!-- url: https://ipfs.blockfrost.dev/ipfs/QmXfLA8rUmVSu7GWRDe8afZLBHtG6iSoVkjy27q16KMnwL -->
# Tingvard

**Proposal:** Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2)
**Vote:** Yes
**Voter ID:** `646d1b3ac94568a422b687db6c47acdf849f1674982ae4f9a494be43`

---

This governance action is properly framed as a Parameter Update action and proposes changes to three protocol parameter values: minPoolCost, maxTxExecutionUnits[memory], and maxBlockExecutionUnits[memory].

The proposed minPoolCost reduction from 170 ada to 75 ada remains within the constitutional guardrails for minPoolCost. The proposed value is positive and below the maximum permitted value under MPC-01 and MPC-02. The Constitution identifies minPoolCost as a governance-critical parameter and therefore requires the applicable DRep threshold under PARAM-05. The action does not seek to alter the parameter outside the permitted constitutional range.

The proposed increases to the Plutus memory execution limits are likewise within the applicable constitutional guardrails. maxTxExecutionUnits[memory] would increase from 16,500,000 to 17,500,000, remaining below the 40,000,000 maximum under MTEU-M-01 and within the permitted per-epoch increase under MTEU-M-04. maxBlockExecutionUnits[memory] would increase from 72,000,000 to 77,500,000, remaining below the 120,000,000 maximum under MBEU-M-01 and within the permitted per-epoch increase under MBEU-M-03. The proposed block limit also remains greater than the transaction limit, satisfying MEU-M-01.

The action provides evidence of prior technical evaluation, including testing of the complete target values on Preview and performance analysis of the proposed Plutus memory increases. The supplied rationale states that the relevant performance analysis found adequate headroom in the critical timing metrics. This is consistent with the Constitution's requirement that changes to technical and network parameters take security, performance, functionality, and long-term sustainability into account.

The bundling of the changes does not itself create a constitutional violation. minPoolCost belongs to the economic parameter group, while the two Plutus memory limits are directly correlated network parameters. The Constitution does not prohibit multiple parameter changes within a single Parameter Update action where the applicable guardrails are satisfied. The inclusion of the Plutus memory parameters also appropriately brings the action within the SPO voting requirement applicable to parameters critical to the operation of the blockchain.

The proposed changes are also consistent with the constitutional objectives of long-term sustainability and fair treatment under Article I, § 1. The reduction of minPoolCost is intended to address the economic position of smaller stake pools, while the increased Plutus memory limits provide additional execution capacity for applications on Cardano. The Constitution does not prescribe a particular economic setting for minPoolCost, but establishes boundaries within which the parameter may be changed.

The action therefore remains within the constitutional limits applicable to each parameter and provides technical and economic justification for the proposed changes.
