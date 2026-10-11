<!-- url: https://raw.githubusercontent.com/hephy-io/mainnet/refs/heads/main/drep_rationales/GA157-ppu-mpc.jsonld -->
# Hephaestus Stake Pool [HEPHY]

**Proposal:** Reduce minPoolCost to 75 ada
**Vote:** Yes
**Voter ID:** `drep1y2zu74gt8sxtrxcngqsmrnupkzrtmlqshmvmm5qtuhxx6xqt7yhaw`

---

I vote YES on the Parameter Update action "Reduce minPoolCost to 75 ada" (75e7882a8ef2bc39517bffbfb654e89f525def5a8364d81e11fc5facafc6dd9b#0).

Stake pool operators should be free to set their own fees without being unfairly burdened by a disproportionate minPoolCost parameter. This parameter sets a minimum, it does not mean that all pools will suddenly be forced to comply with the minimum. In fact, "race to the bottom" concerns were proven to be largely unfounded following the previous reduction of minPoolCost from 340 to 170.

I still see a number of early SPOs running pools near the 1 block per epoch levels and continuing to charge a 340 ada fee, meaning that their delegators don't even see any rewards when they make a single block in an epoch and it even eats into their rewards on the second block, if they're lucky enough to make more than one, and yet those delegators still don't move.

Continuing to force new and small pools to charge a minPoolCost that is a higher percentage of block rewards today than in the past puts them at an unfair disadvantage when explorers and wallets report "Return on Ada" or "ROA" as a determining factor for selecting a "good" pool. Early SPOs had the luxury of block rewards being >1000 ada with minPoolCost at 340. New and small SPOs today have to compete with a reality where block rewards have fallen to ~285 ada and even a strongly delegated pool has returns of ~1.98%. I would sooner see "Lifetime ROA" abolished from wallets and explorers too, as it skews the reality of staking on Cardano today compared to the past. Advertising an OG stake pool as having "lifetime returns" of 3.75% is completely unrepresentative of the present-day reality that the returns for that same pool on a 1-year, or 3-month time frame is ~2%. These pools are given an unfair attractiveness on explorers and wallet interfaces due to an unrealistic representation of the present-day reality. A new pool today will never have a "lifetime ROA" greater than 2.2% and so is already fighting against an implicit incumbent advantage stretching back almost 6 years.

Lowering minPoolCost at least gives new and small SPOs a lever by which they can try to make that "ROA" number in explorers and wallets a little more attractive than being heavily penalised by being forced to take a disproportionate amount of block rewards as they continue to decline over time.

While I appreciate the conversations and calls for minPoolMargin this is still something that requires a hard fork and is months away. Updating minPoolCost in line with present-day realities is something achievable now.
