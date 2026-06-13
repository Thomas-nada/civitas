<!-- url: ipfs://Qmde7BNv3d5FR8V5ej9S7WixLkBsANr5pWTfSheqpyvFZA -->
# Cardano Curia

**Proposal:** Update Plutus Cost Models
**Vote:** Yes
**Voter ID:** `84feba943c574d25984175cf8257959e6b3a1c64143d85e64fef6bd5`

---

Cardano Curia votes YES on the "Update Plutus Cost Models" Protocol Parameter Change governance action. The action updates the Plutus cost model entries to support new built-in primitives and revised benchmarked CPU cost settings. We classify this as a Protocol Parameter Change affecting the costModels parameter.

The relevant constitutional requirements are the Governance Action Standards for transparency, immutable supporting documentation, sufficient rationale, and technical review for Parameter Update actions. The relevant guardrails are the Plutus Cost Models guardrails, PCM-01 through PCM-04. These require cost model values to be benchmarked on a reference architecture, require the cost model to be updated when new primitives are introduced or a new Plutus language version is added, discourage normally negative cost model values unless justified, and require a cost model for each supported Plutus language version.

We find the action constitutional because costModels is an explicitly recognized protocol parameter; the proposal provides a substantive rationale and technical-review trail; the supplied rationale states that benchmarked values were produced by the IOE Plutus Core developer team; and the proposal provides cost model diffs for Plutus V1, V2, and V3. The update is also consistent with PCM-02 because new primitives require corresponding cost model coverage.

No constitutional conflict was identified. The action appears aligned with the Constitution's requirements for transparent, technically reviewed Parameter Update actions and does not appear, on the face of the provided rationale, to endanger the security, functionality, performance, or long-term sustainability of the Cardano Blockchain.
