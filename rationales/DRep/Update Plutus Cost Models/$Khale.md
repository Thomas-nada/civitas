<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmVeKcGQq2dezUu8h6Zad7aodqU1z6ssKwsosFq3oX9fVG -->
# $Khale

**Proposal:** Update Plutus Cost Models
**Vote:** Yes
**Voter ID:** `drep1y2ltat8kjqrmnff3lkkpxy0j5tn66d3m0gy64dc92asft5g6dl9ws`

---

I am voting YES on “Update Plutus Cost Models.” This is a narrowly scoped technical parameter update that enables the new Plutus primitives introduced with the van Rossem hard fork (Protocol Version 11), extends relevant primitives consistently across Plutus V1, V2, and V3, and adjusts some existing primitive cost models based on fresh benchmarking data. Without this action, those new CIPs and capabilities could not be safely and properly used on mainnet, which would unnecessarily limit developer functionality after the hard fork.
For this kind of highly technical change, DReps cannot reasonably verify every individual cost-model coefficient. The key question is whether the process is credible, transparent, and aligned with the guardrails. In this case, the changes have been benchmarked on the reference architecture, recommended by Intersect’s Parameter Committee, confirmed by the Technical Steering Committee, deployed and tested on SanchoNet, Preview, and Preprod testnets, and documented with public benchmarking data and methodology. The update is explicitly framed as consistent with PCM‑01, PCM‑02, and PCM‑03 (benchmark-derived values, updates for new primitives, no negative costs).
There is some risk that a small number of existing Plutus V3 scripts close to their CPU limits may be affected by the increased costs for certain integer operations and equalsByteString, and there is an ongoing discussion about Plutus versioning hygiene under CIP‑35 when adding new built-ins. However, these risks have been openly acknowledged, developers have been given testnet environments and advance notice to adapt, and the change is tightly coupled to enabling core functionality for Protocol Version 11 rather than introducing discretionary behaviour.
My YES should therefore be understood as support for the established benchmarking and governance process for cost-model updates, and for keeping Plutus cost models aligned with protocol upgrades, rather than as a blanket endorsement of every future change of this type. I encourage the technical committees to continue improving versioning discipline and communication around backwards-compatibility, but in this specific case, I believe approving the update is in the best interest of the network and its developers.
