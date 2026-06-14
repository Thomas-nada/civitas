<!-- url: https://ipfs.blockfrost.dev/ipfs/QmQZPmZZKGPTfWUaf2qeZp2Ju7cc9A71u7ENxuzgFaESsJ -->
# Tingvard

**Proposal:** Update Plutus Cost Models
**Vote:** Yes
**Voter ID:** `646d1b3ac94568a422b687db6c47acdf849f1674982ae4f9a494be43`

---

This governance action is properly framed as a Parameter Change action and must therefore be assessed under the applicable constitutional requirements for protocol parameter updates, together with the relevant guardrails for Plutus cost models.

The proposal satisfies Article II, Section 6, §1 by presenting the governance action in a standardized and legible format. It includes a title, abstract, motivation, rationale, supporting references, and the on-chain parameter change data.

The proposal satisfies Article II, Section 6, §2 by providing sufficient rationale for the requested parameter change. The action explains that the update is intended to enable new Plutus primitives following the van Rossem hard fork to Protocol Version 11, make Plutus primitives available across Plutus V1, V2, and V3, and update selected existing primitive settings based on benchmarking data.

The proposal identifies the technical basis for the change. It states that the changes were recommended by Intersect’s Parameter Committee, confirmed by Intersect’s Technical Steering Committee, enacted on SanchoNet, Preview, and Preprod testnets, and supported by benchmarking results.

The proposal addresses the relevant Plutus cost model guardrails. It states that PCM-01 is satisfied because the cost model settings were validated by the IOE Plutus Core developer team against the same reference machine and implementation as the existing mainnet Plutus cost model settings. It states that PCM-02 is satisfied because the cost model is being updated due to the introduction of new Plutus primitives following the upgrade to Protocol Version 11. It states that PCM-03 is satisfied because none of the new cost model values are negative.

The proposal also provides the affected primitive categories and the concrete cost model differences for Plutus V1, Plutus V2, and Plutus V3. This gives sufficient clarity as to what parameter values are being changed and why.

Tingvard therefore finds that the proposal satisfies the applicable constitutional requirements for a Parameter Change action.
