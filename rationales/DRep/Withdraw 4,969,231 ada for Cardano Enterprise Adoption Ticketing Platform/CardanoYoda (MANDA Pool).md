<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmWZh8icXL2dv7rkLdtS1tzxJd2W7ZjtKQCp4Q7QXbRZJH -->
# CardanoYoda (MANDA Pool)

**Proposal:** Withdraw 4,969,231 ada for Cardano Enterprise Adoption Ticketing Platform
**Vote:** Abstain
**Voter ID:** `drep1y2m0g4r66pyaw3p7u454wc0p4f0ygm8ueaev0mgd3tvwm7sskqwqp`

---

As a DRep, I vote ABSTAIN on the proposal: Withdraw 4,969,231 ada for Cardano Enterprise Adoption: Ticketing Platform.

My rationale:

I see both positives and serious concerns.

On the positive side, this proposal is connected to a real company with an existing ticketing business. Sellout appears to be a real service with real users, and Anvil is a credible Cardano development partner. I also appreciate that the proposal attempts to bring a real-world commercial use case to Cardano, which is something the ecosystem should generally welcome.

However, I remain skeptical about the actual added value of blockchain in this specific use case.

A tokenized ticket has clear value before the event, but after the event, its utility becomes much weaker. Unless there is a concrete loyalty, collectible, or future-access model, the NFT mostly becomes an expired ticket record. The proposal does not sufficiently explain why this long-term on-chain footprint creates meaningful value for users or for Cardano.

There is also a more fundamental issue: owning an NFT ticket does not by itself guarantee admission to the event. The buyer still depends on a trusted third party. In this model, the NFT is not the same as owning a fully on-chain asset like ADA. It represents an off-chain promise that must still be honored in the real world.

The proposal also appears to rely heavily on custodial wallets and hidden blockchain UX. That may be good for normal users, but it weakens the self-custody argument. If ticket buyers do not manage their wallets, do not interact with Cardano directly, and continue to rely on Sellout’s system for redemption, then Cardano risks becoming a backend ledger rather than essential infrastructure.

I am also concerned about the economics of minUTxO. If every purchased ticket becomes a CIP-68 NFT, then ADA must be attached to token-bearing UTxOs. At a small scale, this may be manageable. At a larger scale, it becomes a real operational capital requirement. If old tickets remain in wallets after events, the minUTxO requirement can keep growing over time. This is a significant barrier to scaling the product.

Related to this, the proposal does not clearly explain who owns or benefits from the ADA used for minUTxO. If the wallets are custodial, then Sellout appears to control the ADA reserve required to operate the system. If this ADA is delegated, staking rewards may also accrue to Sellout unless another arrangement is clearly defined. If a customer exports a ticket to self-custody, it is unclear whether the customer receives the required min ADA together with the NFT, whether they must provide ADA themselves, or how that ADA is later recovered.

This is not a minor implementation detail. It affects user experience, capital requirements, ownership, staking rewards, and the real meaning of self-custody.

In addition, ADA locked for minUTxO should not be treated as strong economic activity or productive TVL. It is mostly operational liquidity required to make the NFT design work. It may support staking, and it may sit under the control of the custodial operator, but it is not the same as active capital used in DeFi or organic user demand for ADA.

The repayment mechanism is positive in principle, but I am not convinced it is strong enough. Based on the expected ticket volume and fee-share structure, repayment of roughly $1.09M could take many years, possibly around 15 years under conservative assumptions. That makes the repayment more like long-term upside than strong Treasury protection.

I am also uncomfortable with the Treasury funding a private company’s product development, Web2 integration, salaries, marketing, and business expansion unless the Cardano-specific value is very clear. In this case, I do not think the proposal fully proves that Cardano is necessary for the core ticketing business.

Many parts of ticketing can be implemented in Web2. Users are also not strongly motivated to take advantage of self-custody if the event experience still depends on the ticketing provider and venue.

For these reasons, I cannot vote YES.

At the same time, I do not want to vote NO because this is still a real business trying to use Cardano in a real-world service. I want Cardano to be adopted by actual companies and not only by crypto-native projects. 

If the team can prove the model, generate real usage, and show that Cardano brings measurable value to organizers, artists, venues, or buyers, then this could become useful learning for the ecosystem.

Therefore, I abstain.

I would like to see a future version with a clearer explanation of why Cardano’s role in the ticketing system is important, how self-custody works in practice, how minUTxO is handled at scale, who owns the ADA attached to ticket UTxOs, who receives staking rewards, what happens to tickets after events, how users benefit from NFT ownership, and a more realistic repayment model.

I would also like to see Sellout have more skin in the game and cover part of the cost of integrating its business with Cardano.

If you'd like to support my work, consider delegating to the MANDA pool and backing me as a DRep. Your support is the only way I can get time for governance.

MANDA Pool ID:
pool1c3fjkls7d2aujud8y5xy5e0azu0ueatwn34u7jy3ql85ze3xya8

My DRep ID:
drep1y2m0g4r66pyaw3p7u454wc0p4f0ygm8ueaev0mgd3tvwm7sskqwqp

Buy me a beer:
https://pay.cexplorer.io/pay/c0410d5b237b6ec0
