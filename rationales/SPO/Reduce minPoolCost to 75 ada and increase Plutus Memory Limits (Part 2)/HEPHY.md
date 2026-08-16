<!-- url: https://raw.githubusercontent.com/hephy-io/mainnet/refs/heads/main/drep_rationales/GA152-ppu-pm2_mpc.jsonld -->
# HEPHY

**Proposal:** Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2)
**Vote:** Yes
**Voter ID:** `pool17n47upcpnzsdks0yd409nf79sg6hqy73twg87eddwh24uj745rt`

---

I vote YES on the Protocol Parameter Update action "Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2)" (ab474223d40e2e3540555364be27e161a809c33651408f43d84acff10c0ba306#0).

### On bundling
It is unfortunate that these two parameter updates were bundled into the same action. It has been demonstrated on-chain that chaining governance actions of the same type can be coordinated successfully. This bundling denies governance actors the ability to assess each on their merits and muddies the waters about who is actually voting on what. minPoolCost, although a parameter that impacts SPO operations, is not actually voted on by SPOs. Bundling it with the Plutus memory units action that DOES require an SPO vote makes it appear as though SPOs have a say on minPoolCost, when they do not. It was also a risk as minPoolCost could be seen as a more contentious update than the Plutus memory units update which has already seen "Part 1" [approved earlier this year](https://adastat.net/governances/c21b00f90f18fce4003edf42b0b0d455126e01c946e80cc5341a9f9750caf79500). I would have preferred to have seen the Plutus memory limits proposal submitted first, with minPoolCost chained to it, and appropriate educational communications put forth as to the reasoning and sequencing of their submissions and potential ratifications.

### Plutus memory units
I vote YES on the Plutus memory units increase as it is "Part 2" of the proposed increase from earlier this year. This was not possible to achieve in one step due to Constitutional guardrails limiting the size of the increase in one step. "Part 1" was approved, has been enacted and live for a number of months now with no ill side-effects. Therefore, I trust the benchmarking and analysis of the Technical Steering and Parameter Committees and vote YES.

### minPoolCost reduction
I also vote YES on the reduction of minPoolCost. While Bitcoin has its widely acknowledged and often celebrated "halving" events, Cardano also experiences its own "halvings". The only difference is, Bitcoin reward halvings are step-changes, while Cardano rewards decline along a curve every epoch. As a result, it often goes unnoticed. Block rewards are now below 300 ada, in 2020 they were above 1000 ada. minPoolCost is the minimum fixed fee imposed by the network and is deducted from any block rewards earned in an epoch. If no blocks are produced, no fee is taken. As block rewards decline, this fixed fee negatively impacts smaller pools that make less blocks per epoch than larger pools. A pool only making one block per epoch is forced to take ~57% of the rewards in fees (if margin is set to 0%), reducing their ability to offer more competitive returns each epoch that they validate blocks. When minPoolCost was last reduced from 340 to 170 there were concerns about a "race to the bottom" which history has shown did not materialise and many pools still operate with a 340 ada fee today. This reduction lowers the minimum while still allowing operators the freedom to choose any number above that.
