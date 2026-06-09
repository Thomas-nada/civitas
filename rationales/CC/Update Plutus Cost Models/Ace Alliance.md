<!-- url: ipfs://QmUBFHovtzSz5BHXauMaEXSFWqxf9WvkZn4kcmJiqdmN9w -->
# Ace Alliance

**Proposal:** Update Plutus Cost Models
**Vote:** Yes
**Voter ID:** `71aa5b3a9240a02a89c4e2839579ec5eb60c410af0a5bb483e1b8f04`

---

"Update Plutus Cost Models" is a Protocol Parameter Change governance action
submitted by Intersect's Parameter Committee that proposes to update the
`costModels` protocol parameter to accomplish three things: assign cost model
entries for thirteen new built-in Plutus primitives defined across CIP-0109,
CIP-0132, CIP-0133, CIP-0138, and CIP-0153, which become available following the
van Rossem hard fork to Protocol Version 11; extend several previously V3-only
primitives to Plutus V1 and V2; and revise benchmarked CPU cost settings for
`equalsByteString` across all three language versions and for four
integer-division primitives (`divideInteger`, `modInteger`, `quotientInteger`,
`remainderInteger`) in V3 only. New primitive entries activate only after
enactment of the PV11 hard fork; adjustments to existing primitives take effect
immediately upon enactment of this governance action. The benchmarking
underpinning the proposed values was performed by the IOE Plutus Core developer
team. IOE is the technical engineering division of IOG, the entity historically
most closely associated with Cardano's core development. We note this
relationship once and apply identical constitutional scrutiny regardless of
origin.

**Article II.6.1-2 (Governance Action Standards).** The action anchors its
justification to an immutable IPFS document (anchor hash
`828cf92b170812446820c9f393446a2daf7d7e47d5f87354fe9f9e21a2635fb4`). The
document provides a title, abstract, and substantive rationale including
technical evaluation, testnet deployment records, benchmarking references, and
an explicit guardrail compliance analysis authored by the proposer. It
references Intersect Parameter Committee meeting notes from 2026-03-05 and
2026-03-19, and TSC confirmation from 2026-05-13. The proposal satisfies the
format and rationale content standards of Article II.6.1 and II.6.2.

**Article II.6.3 (Technical Review Requirement).** The Constitution requires
that "Parameter Update" actions "undergo sufficient technical review and
scrutiny as mandated by the Guardrails." This action documents a layered review
chain: recommendation by Intersect's Parameter Committee across two triweekly
meetings; confirmation by Intersect's Technical Steering Committee; and
sequential testnet deployment on SanchoNet (March 2026), Preview (April 2026),
and Preprod (May 2026), with an on-chain governance action identifier provided
for each. The multi-stage testnet track record constitutes sufficient technical
review under Article II.6.3.

**Appendix I.2 (PARAM Guardrails).** PARAM-01 prohibits changes to any protocol
parameter not explicitly named in the constitution. The `costModels` parameter
is explicitly named and governed under Appendix I.2.4. PARAM-01 is satisfied.
PARAM-02a applies to listed parameters that lack checkable guardrails; it does
not govern here because PCM-01 through PCM-04 provide specific guardrails for
cost models.

**Appendix I.2.4 (PCM-01 through PCM-04).** PCM-01 requires cost model values to
be set by benchmarking on a reference architecture. The proposal states that all
settings were validated by the IOE Plutus Core developer team on the same
reference machine used for the existing mainnet cost models, and links to
publicly accessible GitHub Actions benchmarking results. This guardrail is not
checkable by the automated guardrails script (designated non-automated in the
constitution as "x/unquantifiable") but is addressed with sufficient specificity
on the face of the proposal. PCM-02 requires the cost model to be updated when
new primitives are introduced. Thirteen new built-in primitives become available
at the PV11 hard fork; PCM-02 not only permits this update but makes it
mandatory. PCM-03a requires that cost model values should not normally be
negative. The proposal states that none of the new cost model values is
negative, which we find accurate. We note that the V3 cost model diff includes a
negative intermediate polynomial coefficient (`"c02": -900`) within the
`quadratic_in_x_and_y` formulas for the four integer-division primitives;
however, these formulas use the `const_above_diagonal` model type, which
enforces a constant execution floor of 85,848 units regardless of intermediate
terms. No computed execution cost can be negative. The plain meaning of PCM-03a
governs execution-cost values, not polynomial coefficients, and the proposal's
representation is accurate. PCM-04 requires a cost model to be supplied for each
Plutus language version the protocol supports. The proposal provides cost model
diffs for V1, V2, and V3. All four guardrails are satisfied.
