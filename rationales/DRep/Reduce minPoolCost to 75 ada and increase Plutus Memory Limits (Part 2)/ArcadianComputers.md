<!-- url: ipfs://bafkreigfuilxpljk2uvcabm67nbviyqgyva4olzngurxapmq6yjs6ttot4 -->
# ArcadianComputers

**Proposal:** Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2)
**Vote:** Yes
**Voter ID:** `drep1yg7xcypymvedd0nn2gcn3zhwhv2d25nfteuxs9re5a7j97c3v4dxw`

---

I am voting Yes on this proposal.

I believe reducing minPoolCost from 170 ADA to 75 ADA is a reasonable and necessary stopgap while Cardano works toward a better long-term solution based on a proportional or variable minimum pool cost.

The economics that originally justified a relatively high fixed minPoolCost have changed significantly. Block rewards have continued to decline, and a fixed 170 ADA cost now represents a disproportionately large percentage of the rewards earned by small pools that may only produce one or two blocks in an epoch. That directly reduces the return available to their delegators and makes it more difficult for smaller independent pools to compete with large, consistently producing operators.

I also think the experience since the previous reduction from 340 ADA to 170 ADA is important. We did not see the ecosystem collapse into a universal race to the minimum fee. Pool operators continued to price their services differently, while the lower floor gave smaller pools additional flexibility when they needed it. Reducing the minimum to 75 ADA likewise does not require any operator to charge 75 ADA; it simply gives them the ability to do so.

I am also persuaded by the updated incentive analysis suggesting that a large fixed minimum cost is not necessarily an effective Sybil deterrent and may actually benefit large operators capable of splitting stake among multiple pools and collecting the fixed fee repeatedly.

Ultimately, however, I do not believe that repeatedly choosing a new fixed ADA value is the ideal long-term solution. A proportional minPoolMargin, or another mechanism that allows the minimum cost to scale with pool rewards and network economics, makes substantially more sense to me than attempting to periodically recalibrate a static number. I therefore view 75 ADA as an appropriate intermediate step while that more complete solution is developed and implemented.

I also support completing the previously evaluated increase to the Plutus memory limits included in this action. This is the second step of the planned 25% increase, has already undergone technical review and testnet evaluation, and provides additional execution headroom for Plutus applications without changing the fundamental capacity relationship between transaction and block limits.

For those reasons, I support the proposal as a practical improvement to the current reward structure and network capacity while Cardano continues working toward a more durable solution for stake pool economics.
