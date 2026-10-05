<!-- url: ipfs://QmScoc5qaitVUfnwmHGMEvPXhWLb42HYdpXCWNVent6V57 -->
# CAG

**Proposal:** Should stakePoolTargetNum (k) be raised from 500 to 1000 (SPO poll)
**Vote:** No
**Voter ID:** `pool1nqheyct9a0mxn80cwp9pd5guncfu3rzwqtmru0l94accz7gjcgl`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmWANwpwAbQ1ezQhD6MFkZsmBHsLt2t96bNeFAs26fXUZW

We thank the stake pool operators whose work keeps the Cardano network producing blocks every epoch. We also recognise the care the proposer has taken to set out the mechanics of k neutrally, including its limits.

This is the view applies both to the Foundation's DRep vote and to the votes cast by the Foundation's stake pools.

Our vote is based on the following factors:

* **More pool IDs are not more operators.** The proposal states that raising k would not automatically "create new pools or independent operators" or prevent an operator "from registering more pool IDs". At k=1000, the saturation point would be about 38.9 million ada. On-chain data for epoch 655 shows 214 pools above that line, and 83 of them have fewer than 20 delegating addresses. These are mostly private or custodial pools. Raising k would leave about 4.9 billion ada above the new cap, and almost half of it (2.3 billion) sits in those 83 pools. In our view, operators of this kind can split their stake across new pools with little effort, leaving control of that stake unchanged.  
* **The reward pot does not grow.** As the proposal notes, total epoch reward resources are unchanged; only the saturation limit decreases. We believe lower-saturated pools struggle in large part because a fixed fee absorbs much of the reward on one or two blocks per epoch, and because they rarely attract enough stake to produce blocks consistently. k changes neither the fixed fee nor where redelegated stake goes. In our view, halving the maximum potential reward per pool would also ask the network to sustain twice as many viable pools from the same resources while reserves decline. We see the pending proposal to lower minPoolCost to 75 ada as an interim correction rather than a definitive answer to stake pool economics, and we look forward to the structural work on the minPoolMargin parameter (CIP-0023), which would reduce the distortion caused by a fixed floor.  
* **The cost falls on passive delegators.** k last changed in December 2020\. The proposal acknowledges that delegators in pools above the new saturation point "could receive fewer rewards", and that those who do not actively monitor saturation "may bear that opportunity cost longer". The proposal itself asks whether a lower saturation point would disadvantage community pools that built their delegation over many years. We expect it would, because those pools cannot coordinate a controlled redelegation.
