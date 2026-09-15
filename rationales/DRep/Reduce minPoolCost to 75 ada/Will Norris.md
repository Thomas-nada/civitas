<!-- url: https://fuegoiq.xyz/r/61716f5a07a57375a92b394a569b6665aa6ba3db8e42604443a4d65a40eede08.json -->
# Will Norris

**Proposal:** Reduce minPoolCost to 75 ada
**Vote:** Yes
**Voter ID:** `drep1ytuufvd6maykgfcp20fxgpx7g6a9z2suchqehfejwdsx8cgpx80yg`

---

I vote **YES** to reduce `minPoolCost` from ₳170 to ₳75.

I supported this change when it was previously bundled with the Plutus memory-limit increase, and I support it even more strongly now that the two unrelated parameter changes have been separated.

The fixed `minPoolCost` increasingly disadvantages smaller and independent stake pools as block rewards decline. For pools producing only one or a few blocks per epoch, a fixed ₳170 cost can consume a disproportionately large share of gross rewards, reducing returns to delegators and making smaller pools less competitive against large and multi-pool operators.

Reducing the floor to ₳75 does not force SPOs to charge ₳75. It simply gives operators greater freedom to determine an appropriate cost structure for their own pool and allows greater competition within the staking market.

I also believe unbundling this change is better governance.

The previous action required an SPO vote because it included security-relevant Plutus parameters. This standalone change affects only `minPoolCost`, which is an economic protocol parameter and therefore correctly follows the DRep and Constitutional Committee ratification path without requiring an SPO vote.

SPO views remain extremely valuable, and the linked CIP-179 survey provides an excellent mechanism for gathering wider ecosystem input on the longer-term direction of Cardano's pool fee structure.

This should not be seen as the final solution to staking economics. I continue to support broader work around proportional minimum margins, `k`, pledge incentives and other mechanisms that can improve the viability of independent operators while strengthening decentralisation.

But reducing `minPoolCost` to ₳75 is a sensible, evidence-based interim step.

**More flexibility. More competition. Fewer structural disadvantages for smaller pools.**

I vote **YES**.
