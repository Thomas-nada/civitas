<!-- url: https://raw.githubusercontent.com/EMGDRep/rationale/refs/heads/main/PlutusHFjsonld -->
# EMURGO

**Proposal:** Update Plutus Cost Models
**Vote:** Yes
**Voter ID:** `drep1ytvlwvyjmzfyn56n0zz4f6lj94wxhmsl5zky6knnzrf4jygpyahug`

---

Summary

EMURGO as a DRep votes YES on the parameter change titled "Update Plutus Cost Models", with rationale outlined below.

Rationale

This governance action updates the Plutus cost models across V1, V2, and V3 to prepare for the van Rossem hard fork and Protocol Version 11. The changes serve three purposes: providing cost model settings for new Plutus primitives that will become available after the hard fork, ensuring consistency by making previously V3-only primitives available in V1 and V2, and updating existing primitive settings based on benchmarking data.

The new primitives introduced span cryptographic operations, list and array manipulation, and value handling, covering modular exponentiation, multi-scalar multiplication over BLS12-381, array builtins, and MaryEraValue operations. These additions expand the capabilities available to smart contract developers and enable more efficient on-chain computation, particularly for cryptographic and cross-chain use cases.

EMURGO is satisfied that the process behind this change is sound. The changes were recommended by Intersect's Parameter Committee in March 2026, confirmed by the Technical Steering Committee in May 2026, and validated through equivalent enactments on SanchoNet, Preview, and Preprod testnets prior to this mainnet proposal. All cost model values have been benchmarked against the reference architecture, no values are negative, and the action is consistent with constitutional guardrails PCM-01, PCM-02, and PCM-03. For these reasons, EMURGO votes YES.
