<!-- url: https://black-obedient-smelt-300.mypinata.cloud/ipfs/bafkreiglxrmnuj77ygzuse24urt76cr4wvh6mcfulmho2jdkvonttuxaiy -->
# HAPPY

**Proposal:** Should stakePoolTargetNum (k) be raised from 500 to 1000 (SPO poll)
**Vote:** No
**Voter ID:** `pool1a8n7f97dmgtgrnl53exccknjdchqxrr9508hlxlgqp6xvjmzhej`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmVuDchFmM8b8yB1hkanSh5qfs2wPnDu6RDKmvkvuKLPAN

## Voting Rationale

**Info Action:** Raising stakePoolTargetNum (k) from 500 to 1000  
**Voter:** HAPPY Staking 🥳  
**SPO Vote:** No

---

## Summary

I vote *No* as an SPO on raising k from 500 to 1000. I share the goal behind the proposal: a higher Nakamoto coefficient through more independent operators, each with enough stake to produce blocks reliably and run a sustainable operation. However, the evidence suggests that raising k does not reach the operators it is meant to help. Instead, it cuts rewards for delegators in around 200 established pools [1]. Much of the displaced stake is likely to be rebalanced by operators who can simply open more pools. The one time k was raised before, that is what happened. There are better-targeted measures available, and I would rather see the Parameter Committee's effort go into those.

## Disclosure

My pool has about 64M ADA delegated at the time of writing and would sit well above the new saturation point of roughly 39M ADA. Until they redelegate, my delegators would earn about 40% less per ADA at k=1000. Nonetheless, I have tried to base this rationale on the published analyses, most of them from sources the proposal's supporters also cite, rather than on my own position.

## Rationale Statement

### 1. Raising k barely helps struggling pools

For a pool that isn't full, k changes only one thing: the small bonus a pool earns for its operator's pledge [4]. Raising k to 1000 roughly doubles that bonus (estimated from IOG's figures at k=500 [2]):

- 100k ADA pledge: from about +0.04% to about +0.08% extra reward.
- 1M ADA pledge: from about +0.3% to about +0.6%. The increase is less than a hundredth of a percentage point of yield.
- 10M ADA pledge: from about +3% to about +6%.

So yes, rewards go up. But the extra reward is meaningful only for operators who can pledge millions of ADA, not for the small operators the proposal says it wants to help [1]. A typical small pool earns practically the same either way.

The stake a pool needs to make a block reliably every epoch is about 3M ADA, and k doesn't change that. There are 873 active pools below that line [2]. For them, the proposal changes almost nothing.

The only way they gain is if delegators leave the big pools and move to small pools. More stake would mean more blocks, and the pool's fixed fee would take a smaller bite out of each delegator's rewards. Whether that happens depends entirely on delegators actually moving.

### 2. The stake is unlikely to move, and even less likely to move to small pools

About 5.9B ADA of delegated stake has not transacted in a year. About 42% of delegations have not changed pool in over two and a half years [1]. When delegators were given two epochs to react to the 2023 SPO poll, few used the chance [14].

Of the ~12.9B ADA in pools above the new cap, about 5.7B sits in 86 pools with twenty or fewer stake keys: exchanges, custodians and private operators [1]. For them, a new pool costs a 500 ADA deposit and maybe some infrastructure. They are likely to split their existing stake, not release it to independent operators [1, 7].

The stake above the new cap itself is about 4.9B ADA [7]. Suppose a generous tenth of it moved, and all of it went to pools below 3M ADA. That is about 0.55M ADA per pool. A typical struggling pool needs around 2M ADA more to reach the line where it reliably produces blocks.

### 3. The cost falls on the delegators

Every delegator in an affected pool takes the reduction, not only the stake above the cap. In a pool of around 64M ADA, like mine, delegators lose about 40% of their reward per ADA until they move [1]. Attentive holders will move within an epoch or two. People who set up delegation years ago and rarely check will carry the loss indefinitely.

The reward they lose is not passed on to smaller pools. It goes back to the reserve. No pool gains from it.

### 4. The last increase produced more pools, not more operators

When k went from 150 to 500, the displaced stake went largely into new pools opened by groups that already ran pools. IOG's own summary is that the increase "*did not produce a proportional increase in independent entities; it produced multi-pool expansion by existing operators*" [3]. The Parameter Committee's 2026 notes reach the same conclusion: "*increasing k had little effect on stake spreading, with large pools simply splitting*" [8]. Shortly afterwards, IOG warned that any further change in k should come only after changing the formula for the pledge influence parameter (a0); otherwise the result would be "*the same operators just running twice as many pools*" [6]. a0 has not been changed since.

Introducing a pledge leverage limit (L, as proposed in CIP-50 [13]) first would make far more sense. L caps the stake a pool can earn rewards on at a multiple of its pledge. Operators could then no longer absorb displaced stake by opening low-pledge pools, so a later increase in k would push stake towards operators with real skin in the game. This matches the order IOG's successor analysis recommends: fix the fee layer, then add a stake cap, and only then revisit k [3].

The design research points the same way [5]. With pledge influence at its current, borderline setting, raising k past a certain point *lowers* the number of independent groups.

### 5. Who the change actually reaches

The proposal is presented as a way to help new and small operators. In practice, as points 1–4 show, its only direct and certain effect is on established pools and their delegators. Private and custodial operators can work around it by opening more pools. Small pools gain only if stake moves, and the evidence says little of it will.

I do not question the good intentions of the proponents. But a measure whose main certain effect falls on experienced, independent operators who grew their pools through years of service is hard to describe as a measure for new operators. Independent, publicly delegated pools of my size are part of Cardano's decentralisation too. They should not be the group left paying for a change that does not deliver its stated benefit.

### 6. The example it sets for new operators

The pool operators we hope to attract are building toward something. They win delegators, run reliable infrastructure, and grow a pool over years. Look at what raising k now signals to them. If you succeed and reach the top of the range, the target may be moved, and a large part of what you built will start working against you.

I do not think that is the intended message. But that is how it will read to someone deciding whether building a pool for the long term is worth the effort. Stable, predictable rules are part of what makes the operator role attractive in the first place.

### 7. Raising the Nakamoto coefficient: unstaked ADA and CEXs

The aim of raising k is to make Cardano more decentralised, which means raising its Nakamoto coefficient. But k only limits how much stake a single pool earns rewards on, not how much stake a single operator can control. What matters for decentralisation is how many independent entities run pools and how stake is spread between them. Counted by pools, Cardano's Nakamoto coefficient is close to 80; grouped by the entities behind those pools, estimates go as low as about 15 [1, 2]. An operator can respond to a higher k simply by running more pools, which leaves the entity-level picture unchanged.

The biggest untapped source of stake for community pools is ADA that isn't delegated at all or sits on centralised exchanges. About 16B ADA, roughly 42% of circulating supply, takes no part in consensus [2]. On top of that, pools run by exchanges, custodians and private operators hold billions more [1, 12], and they are likely to respond to a higher k by opening more pools rather than releasing stake [1, 7].

Raising k only reshuffles stake that is already delegated. The losers are the suddenly oversaturated pools and the delegators least likely to notice the change. Bringing new stake in is different: as IOG's report puts it, it is "*a positive-sum gain for the entire ecosystem, simultaneously increasing network security and the viability of smaller pools*" [2].

So, bringing in new stake will do more to improve decentralisation (measured by the Nakamoto coefficient) than raising k. The number of independent entities matters, not the number of pools:

- When a large group splits one pool into two, the pool count goes up, but the same entity still controls the same stake.
- With pledge influence where it is, the design research finds that pushing k past a certain point *lowers* the Nakamoto coefficient [5].

Moving exchange-held or unstaked ADA into independent community pools works on both sides of the count:

- ADA that leaves an exchange's pools reduces one of the biggest holders directly.
- Newly staked ADA in independent pools increases the total, so the "more than half" line moves up.

For example, if 2B ADA of currently unstaked ADA went to independent pools, the halfway line would rise by about 1B ADA. The largest groups, whose stake has not grown, would need additional entities to reach it. Raising k can only reshuffle stake between pools, often ones run by the same groups.

I would welcome a real effort, from the community and the Parameter Committee: wallets and exchanges that make self-custody and delegation simple, outreach aimed at people who hold ADA on exchanges, research into why so much ADA stays unstaked, lower transaction base fees to make Cardano more competitive with other blockchains, and pressure on exchanges to let customers delegate to community pools, or to delegate part of their custodial ADA to community pools themselves.

Every ADA that moves from an exchange or a dormant wallet to a community pool is real decentralisation, whatever k is set to.
