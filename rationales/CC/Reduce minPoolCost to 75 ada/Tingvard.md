<!-- url: https://ipfs.blockfrost.dev/ipfs/QmY2pGiggxrLvmv9pYN547AiGAgYZyTQQKsc3qMkbharmq -->
# Tingvard

**Proposal:** Reduce minPoolCost to 75 ada
**Vote:** Yes
**Voter ID:** `646d1b3ac94568a422b687db6c47acdf849f1674982ae4f9a494be43`

---

This governance action proposes reducing the minPoolCost protocol parameter from 170 ada to 75 ada, with no other protocol parameters being changed. The proposal provides a detailed technical and economic rationale for the change, including the changing reward environment, the impact of the current fixed-cost floor on smaller stake pools, empirical evidence following the 2023 reduction, and the proposed setting as an interim step toward more structural changes such as minPoolMargin.

The proposal identifies the relevant governance process and states that PCP-006 was published on 30 March 2026, with the proposed parameter change not intended for submission before 30 June 2026. This provides the stated 90-day notice period required by the applicable guardrail. The proposal also states that the Intersect Technical Steering Committee ratified the reduction on 9 July 2026.

From a constitutional perspective, the relevant requirements for this Parameter Update are the applicable parameter-change guardrails. The proposal explicitly addresses PARAM-05a, identifying minPoolCost as a governance-critical parameter and stating the applicable DRep voting threshold, as well as the requirement for Constitutional Committee approval. It also correctly states that an minPoolCost parameter change does not require SPO approval.

The proposal addresses the notice requirement in PARAM-06a, documenting the publication date of PCP-006 and the earliest intended submission date. The stated dates provide more than the required 90-day period.

The proposed value also satisfies the specific minPoolCost guardrails. MPC-01 requires the parameter to be positive, and the proposed value of 75,000,000 Lovelace satisfies this requirement. MPC-02 establishes a ceiling of 500,000,000 Lovelace, which the proposed value is well below. MPC-03 requires the setting to be appropriately calibrated, and the proposal provides supporting economic analysis for the 75 ada value, including its relationship to current reward levels and the delegator penalty experienced by smaller pools.

The proposal also provides a reversion plan if adverse effects are observed. It explains that the parameter can subsequently be returned to 170 ada through another governance action and appropriately notes the non-retroactive nature of the parameter for existing pool registrations. This provides useful operational context, although the existence of a reversion plan is not itself a constitutional requirement.

The proposal includes substantial supporting evidence for the requested change, including the historical calibration of minPoolCost, reward economics, competitive dynamics, Sybil considerations, empirical evidence following the 2023 reduction, and references to PCP-001, PCP-006, the IO Research incentives report, CIP-0023, CIP-0074, CIP-0082 and CIP-1694.

Tingvard's role is to assess whether the governance action complies with the Constitution and applicable guardrails, rather than to determine whether reducing minPoolCost is economically preferable. The proposal's economic arguments and anticipated effects therefore do not themselves determine constitutionality; the relevant question is whether the parameter change satisfies the constitutional and guardrail requirements governing such an action. On the information provided, those requirements are addressed.
