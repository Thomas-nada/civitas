<!-- url: https://smitblockchainops.nl/governance/vote-minpoolcost-part2-ab474223.jsonld -->
# BKIND

**Proposal:** Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2)
**Vote:** No
**Voter ID:** `pool1m83drqwlugdt9jn7jkz8hx3pne53acfkd539d9cj8yr92dr4k9y`

---

Action: parameter change ab474223d40e2e3540555364be27e161a809c33651408f43d84acff10c0ba306#0, Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2).

What is being decided.

One action changes three values: minPoolCost from 170 to 75 ada, maxTxExUnits.mem from 16,500,000 to 17,500,000, and maxBlockExUnits.mem from 72,000,000 to 77,500,000. The steps fields are unchanged from their current values. ExUnits is a single parameter with two fields, so the proposal is correct that nothing else moves.

I verified the document I am voting on. The blake2b-256 digest of the bytes retrieved from ipfs://bafkreifc5ct5fpeu4ygx6k4cqzbyzny7xfmuljywgn7jge3zkf2tidacym equals the anchor hash recorded on chain, f200d39e39a3db74bdaa4f04865b4da38b5403322984c6fdcaf09bd44cacf868.

1. What minPoolCost is.

Two distinct things have to be kept apart, because the proposal acts on only one of them. The fixed fee is the per-pool value each operator declares in its registration certificate. minPoolCost is a single network-wide protocol parameter that sets the minimum the fixed fee may take. The proposal does not remove the fixed fee. It lowers the minimum the fixed fee is allowed to be.

The fixed fee does two things, and both are visible in the design. It recovers the operator's fixed cost: in Rewards.hs lines 122 to 127 the declared fee is subtracted from a pool's rewards before the margin is applied to the remainder, and where the reward does not reach the fee the operator receives the whole of it. Fixed costs do not scale with stake, so they are settled first. It also discloses that cost to delegators, because the fee is declared per pool in the registration certificate on chain rather than set once network-wide, so every operator states what running their pool costs them.

minPoolCost protects both functions by putting a floor under the fixed fee. Pool.hs line 256 refuses a certificate whose declared fee is below minPoolCost. In the whole of the Shelley and Conway source, ppMinPoolCostL occurs exactly once outside the parameter definition, and that is the line. Nothing tests an upper bound. The minimum therefore adds no option to an operator who wants to charge more. It only stops one who would price the fee below their own cost to attract stake.

The proposal uses the minimum for the opposite purpose. It expects that market pressure will lead small pools currently declaring the minimum to lower their declared fee to the new, lower minimum, improving their competitiveness. That is pressure on operators to declare a fee other than what their pool costs them, which is the behaviour the minimum exists to prevent. The information a delegator can read from the fixed fee lies in its variation across pools, and a minimum that competition obliges every small pool to sit on discloses nothing.

I do not object to revisiting the level of the minimum. I object to converting the fixed fee from a disclosure of costs into an instrument of price competition, which is what the stated mechanism requires.

2. Two unrelated changes in one vote.

I support the Plutus memory increase and oppose the fee-floor reduction. This action does not let me record both, and no reading of the counting rules produces a vote that says what I mean.

The two subjects are unrelated, and the proposers say so: these two changes are otherwise unrelated, one lowers the stake pool fixed-fee floor, the other increases Plutus script execution headroom. The ledger keeps them apart as well. cppMinPoolCost sits in the Economic group and is read in one place only, Pool.hs line 256, when a pool certificate is validated. cppMaxTxExUnits and cppMaxBlockExUnits sit in the Network group and are applied when transactions and blocks are validated.

Yet the vote admits no separation. Yes endorses a reduction I consider unjustified. No is recorded against a memory increase I support. Abstaining is worse than it looks: under Ratify.hs line 277 abstained stake leaves both the numerator and the denominator, so withholding support raises the yes-ratio instead of lowering it. On the tally of 28 August 2026, epoch 652, the proposal stands at 59.5%, and had the ten abstaining DReps voted No it would stand at 58.3%. That gap has narrowed sharply, from 8.8 percentage points a day earlier, because two of the largest abstaining DReps, holding 786 million ada between them, changed their vote to Yes on 28 August. The mechanism is unchanged, but the stake that carried that effect has moved into the numerator. This is a snapshot of an open vote: across epochs 648 to 652 the yes-ratio has climbed from 22.7% to 59.5% as support accumulated, and the action remains active until it expires at the end of epoch 653. The bar it must clear is 0.67, not a simple majority.

The two halves also carry different risk. A memory limit reverts cleanly: it is applied at validation, so restoring the old value restores the old behaviour from the next block. minPoolCost does not. Pool.hs line 256 checks it only when a certificate is submitted and never re-applies it to registrations already on chain. The proposers state the consequence themselves: SPOs who lower their declared cost below 170 ada while the floor is 75 ada cannot be compelled to raise it back to 170 ada if the parameter is later reverted. One reversion plan is presented for both halves, and it lends the reversibility of one to the other.

The reasons given for combining them do not carry that cost. The proposers cite submission efficiency and a wish to allow SPOs to give input on minPoolCost. The 100,000 ada deposit is returned to the proposer under Epoch.hs lines 195 to 199, and governance actions run concurrently, with two submitted in epoch 646 alone, so a separate submission costs no additional ada and no additional time. On the second reason: minPoolCost carries the tag NoStakePoolGroup, for which paramChangeThreshold returns NoVotingAllowed under Internal.hs lines 395 to 402. Attaching maxBlockExUnits, a SecurityGroup parameter, gives stake pools a 51% vote on their own fee floor that the ledger withholds from them. The proposers acknowledge this is a consequence of bundling rather than a requirement of PARAM-05 itself.

That this can be done separately is not speculation. Part 1 of the same memory increase, action c21b00f90f18fce4003edf42b0b0d455126e01c946e80cc5341a9f9750caf795 index 0, the identical two parameters, submitted alone, was ratified at epoch 613 and took effect at epoch 614, with 225 DReps in favour, 4 against and 6 abstaining.

3. The measure works against the operators it names.

This is my central objection.

The stated purpose is to improve the position of small pools. The instrument is those pools' income.

Because the fixed fee is deducted before the margin, a large pool's income is the margin on tens of millions of delegated ada and the fixed fee is a rounding error, while for a small pool the fixed fee is the income. The declared margins show it: the median runs from 1% in the smallest size band to 4% in the largest, and in the group already sitting on the current floor it is 1.5% on 4.6 million ada of stake.

That asymmetry decides who can afford to compete on the fee. Measured on the actual leader rewards at epoch 645, across the 752 pools that declare a margin below 100% and actually earned a reward that epoch, so that their delegators receive something, removing 95 ada from an operator's declared fee costs the median public operator 21.3% of the income the operator takes home. For the operators already declaring 170 ada it costs 38.7%. For the lowest income class, 84 operators, it costs 51.5%. For the highest income class, 95 operators, it costs 6.2%. And for the roughly 98 pools that declare a 100% margin it costs nothing at all.

Those last pools are not a rounding error in the ledger's accounts: they collect 67.8% of all operator income on the network. At epoch 645, 91 of the 98 paid their delegators nothing whatever, and all 98 together paid out 3 ada. For them the fixed fee is irrelevant, because they keep the entire reward either way.

A small operator then has two options and no third. Match the lower fee, and lose that income while the servers, the bandwidth and the time cost exactly what they cost today. Or hold the fee, and advertise a lower return than the pool beside it, to delegators who compare precisely that number. There is no branch on which the position improves. Competition on a fixed fee is competition in who can best afford to give up fixed income, and that is by construction the party who needs it least.

The obvious rejoinder is that a lower fee attracts delegation, and the margin on that new stake repays the fee it gave up. For these pools it does not. Among all 2,541 public pools declaring a margin below 100%, which is the wider population of which the 752 measured above are those that also earned a reward at epoch 645, the median margin is 1.5%, and among those below the viability threshold a quarter declare exactly zero. At a margin of 1.5%, and at the epoch-645 reward rate used below, replacing 95 ada of forgone fixed fee each epoch would take roughly 22 million ada of fresh delegation, just over a quarter of a saturated pool, on a pool defined by having almost none. At zero margin no delegation repays it at all. The attraction is in any case largely zero-sum: stake drawn to one small pool is stake another loses, and what little could come from the handful of saturated pools need not land on one this small, and saturation caps what any single pool can hold in any case. The rejoinder ends where it began: the fixed fee is the income.

The margins involved are not abstract. Of the 1,406 pools that produced a block in 2026, 159, which is 11.3%, produced one block a month or less, and 213, which is 15.1%, produced no more than about one and a half blocks a month. For the pools that make about one block a month, the median operator income over epochs 605 to 645 works out at 2,715 ada a year, and at the ADA price on 28 August 2026 that is about 566 US dollars, before a single hosting invoice. Over those same forty epochs the number of pools paying their delegators anything at all fell from 830 to 752.

One further point the proposal never addresses. The minimum is denominated in ada, and the costs a fixed fee at the minimum exists to cover are not. minPoolCost was set to 170 at epoch 445, on 27 October 2023, when ada traded near 0.29 US dollars, so a fixed fee at the minimum then recovered about 49 dollars. At the ADA price on 28 August 2026 it recovers about 35, more than a quarter less in real terms, which no one ever voted on. The cut to 75 takes it to about 16. The proposal removes 56% of the nominal amount on top of an erosion the exchange rate had already delivered, and it mentions the rate nowhere. The figures are 170 ada at 0.2895 US dollars on 27 October 2023, close from Yahoo Finance, and at 0.2085 US dollars on 28 August 2026, spot from CoinGecko and matched by Coinbase. The change to the minimum is on chain at epoch 445.

4. The reduction acts on a variable that is not the constraint.

The proposal presents the reduction as preparatory: a healthy ecosystem of smaller pools must be economically viable before any future k increase is effective, so improving small-pool economics via this reduction is a prerequisite step, not an alternative. That makes k the destination and the fee floor the road to it. The two can be measured against each other.

A pool covers its cost when its rewards exceed its fixed fee. At the measured epoch-645 rate of 0.00028954 ada of reward per ada of stake per epoch, that threshold sits near 587,000 ada of delegation at a minimum of 170, and near 259,000 ada at a minimum of 75. Measured at epoch 650: 1,511 pools sit below 259,000 ada and are still short of the floor even at 75, of which 154 produce blocks, holding 42 million ada between them. A further 153 pools sit between 259,000 and 587,000 ada and are the ones this change brings above the floor, of which 130 produce, holding 64 million ada. And 1,016 pools sit above 587,000 ada and are already above the floor at 170, of which 995 produce, holding 21,406 million ada.

The reduction changes the arithmetic for 153 pools holding 64 million ada between them, which is 0.3% of all delegated stake, and 130 of those already produce blocks. Ten times as many pools remain below the threshold even at 75 ada.

stakePoolTargetNum moves quantities of a different order. Saturation is circulation divided by k, currently 77.6 million ada, and only 7 pools stand above it, with 101 million ada in excess. Raising k to 750 would place 154 pools above the line and put 2,504 million ada, which is 11.6% of all delegated stake, under pressure to move, and at k equal to 1,000 it would be 4,908 million.

That is not a projection. k has been changed once, from 150 to 500 at epoch 234 in December 2020. At epoch 233 not one pool of 1,276 stood above saturation. One epoch later, 74 pools held 3,638 million ada above the new line. By epoch 239 the excess was 261 million and by epoch 244 it was 101 million: 93% of it moved within five epochs, about twenty-five days.

The number of producing pools rose from 537 at epoch 233 to 858 at epoch 250 over the same window. I do not attribute that growth to the change, because the ecosystem was expanding and the producing count was already climbing by roughly 2.5% per epoch beforehand. What is directly attributable is the drain itself, because that stake sat above the new ceiling the moment it was lowered.

Set the two side by side. The step described as a prerequisite reaches 0.3% of delegated stake. The change it is said to prepare for has already, once, moved 3.6 billion ada in a month. k has never been proposed: of the eight parameter-change actions in Cardano's history, none contains stakePoolTargetNum and none contains poolPledgeInfluence. k has stood untouched for 416 epochs. It carries the tag NoStakePoolGroup under PParams.hs line 660, so operators have no vote on it in that capacity either.

One qualification belongs here. Stake displaced from saturated pools goes wherever delegators send it, which need not be to small pools. The figures bound what could move, not what would. They establish the order of magnitude, and it is not the fee floor.

A correction on a related point. The proposal states that the reduction has a marginal effect on the treasury. The treasury take is computed as deltaT1 equals tau times rPot in PulsingReward.hs lines 138 to 141, before any pool-level distribution occurs, so the treasury draws the same amount from the reward pot either way; what lowering the minimum changes is only the split between operator and delegator inside the remainder. The one channel by which that split touches the treasury at all is third-order, through rewards forfeited by deregistered accounts under IncrementalStake.hs line 121, and it is a speck, not the marginal effect the proposal describes.

5. The 2023 reduction left no trace.

minPoolCost was halved once already, from 340 to 170 ada at epoch 445 in October 2023. That is the one place where the proposal's mechanism can be checked against outcome rather than expectation.

Counting for each calendar year the pools registered and not retired at year end, and how many of them minted at least one block that year: in 2020, epochs 208 to 238, 1,486 pools were active at year end and 971 of them produced at least one block, 65.3%, with 1,065 pools producing a block at some point in the year. In 2021, epochs 239 to 311, 3,151 were active and 1,927 produced, 61.2%, with 2,210 in all. In 2022, epochs 312 to 384, 3,216 were active and 1,854 produced, 57.6%, with 2,036 in all. In 2023, epochs 385 to 457, 3,113 were active and 1,688 produced, 54.2%, with 1,873 in all. In 2024, epochs 458 to 530, 3,039 were active and 1,501 produced, 49.4%, with 1,617 in all. In 2025, epochs 531 to 603, 2,948 were active and 1,421 produced, 48.2%, with 1,513 in all. And in 2026 so far, epochs 604 to 650, 2,896 were active and 1,336 produced, 46.1%, with 1,406 in all.

2020 covers 31 epochs from the Shelley start and is not comparable, because d was still 0.32 at the end of that year, so most blocks came from federated nodes. 2026 covers 47 epochs rather than a full 73.

The registered population has been broadly stable. The producing population has not: from 2,210 in 2021 to 1,406 so far in 2026, while total block production stayed flat at roughly 1.5 million per year. The same blocks are made by steadily fewer pools.

Around the change itself, nothing happens. The ten-epoch means of the per-epoch count of producing pools run 1,127 over epochs 425 to 434, 1,111 over 435 to 444, 1,088 over 445 to 454 with the new floor in force, then 1,090, 1,078, 1,079, 1,086, and 1,084 over 495 to 504. That is flat for sixty epochs afterwards, within the band it occupied before.

And most pools never followed. Of the pools that produced a block in the last twenty epochs, 59.3% still declare 340 ada and 30.0% declare 170. 205 epochs after the floor was halved, the majority of producing pools have never moved to it, and those that did are disproportionately the smallest: 43.4% of producing pools below 1 million ada of stake declare 170, against 17.3% in the 10 to 30 million band.

I make no causal claim here, and I tested two and discarded them. The decline in producing pools does steepen, but only from around epoch 505, ten months after the change, and the apparent break disappears entirely under a 60-epoch window. New pools entering production did fall by 61% after the change, but new registrations fell by 57% over the same period and the ratio between them barely moved, so that fall belongs to people no longer starting pools rather than to the floor.

What remains does not depend on attribution. The reduction produced no visible improvement in the population it was aimed at, on any measure available: not in the number of producing pools, not in the output of the pools that adopted it, and not in how many chose to adopt it. A second reduction is now proposed on the strength of a mechanism whose first application left no trace.

Sources.

Every figure above comes from an independent decode of the chain bytes, measured at epoch 650 unless stated otherwise, and every source reference is to cardano-ledger-conway-1.22.1.0 and cardano-ledger-shelley-1.18.1.0. Each figure was then checked, row by row, against an independent cardano-db-sync instance: a different decoder, a different ledger replay, a different schema, written by IOG. The two agree exactly on the declared cost, margin and pledge of all 6,161 pools, on 5,376 rows of per-pool stake at epochs 645 and 650, on 1,849 rows of per-pool block counts, on the leader and member rewards of all 904 pools that earned anything at epoch 645, on the DRep stake distribution, and on every one of the 256 votes cast on this action as of 25 August 2026. The comparison produced no differences at all. The single row db-sync holds that I do not is a 500 ada pool-deposit refund, which it records as a reward type and I do not. The live vote tally quoted earlier has moved past that cross-checked snapshot and is measured on db-sync alone, by a method that reproduces the doubly-checked series through epoch 651 to the lovelace. The queries behind each number are available on request, and I will supply them to anyone who wants to check a claim rather than take it on trust.
