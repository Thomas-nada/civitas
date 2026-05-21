<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmWDujrbsiDjV7VCT2daLZbhTs1sqbvm7qffPoRwMQqoTT -->
# Sebastien Guillemot セバ

**Proposal:** IO Cardano Upgrades
**Vote:** Yes
**Voter ID:** `drep1y2csyxt7u2hl4674pl9cef5lknafaw5nraxvyx033kmd0es3awuv0`

---

In my mind, account support for Cardano is a big bet, which is exactly the kind of bet we should be making as an ecosystem at the moment. I think it will simplify a lot of things (esp. in relation to the treasury), will strengthen concepts like observer scripts (esp. in relation to multi-token support which can be used as indicators of the state of an account), and help avoid a lot of min UTXO issues that have been bottlenecks for different apps.

Given the fact a lot of the power of account address comes from using token to encode state, I think the "Cardano Multi-Asset Treasury" part of this proposal makes sense. In my mind, the main benefit is not really the treasury, but the fact that the treasury is an account means that it indirectly benefits from this multi-token account work and could enable for some more interesting treasury proposals (esp. in relation to stablecoin holdings as part of the treasury).

Lastly, I think the Nested Transactions feature outlined will be critical in making a lot of this work. Right now, there's no way for dApps to upgrade atomically between Plutus versions (you can't use two different Plutus versions in the same tx). Similarly, people won't be able to update their dApps to the new account address system atomically without this feature. Even more, new VMs like Starstream will need this feature to talk easily with Plutus.

In my mind, these three features together form a very logical bundle, and a strong logical bet on how we can increase adoption of Cardano.
