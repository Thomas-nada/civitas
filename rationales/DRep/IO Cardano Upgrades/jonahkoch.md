<!-- url: ipfs://QmQgn2rhjP4cRZcA4bEer2KYsftnxRHNKDrwUpVBysY2fL -->
# jonahkoch

**Proposal:** IO Cardano Upgrades
**Vote:** Yes
**Voter ID:** `drep1yt8trnz8e5cnylmyygt0pyzrfw92rt9s42kg8t4rhm6t0dstyvmdn`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmfNdJRCpmF75sAJAvLqAV1vK6YeZjJ95CWZ72wALdof5J

I'm voting yes because these three workstreams collectively remove the economic constraints that limit what Cardano can do for wallets, DeFi protocols, and anyone arriving from Bitcoin or a stablecoin. CIP-159 Account Address Enhancement lifts the minUTxOValue barrier that has prevented Cardano wallets from collecting micro-fees at all, the average transaction costs ~0.39 ADA, but the minimum UTxO requirement forces wallets to charge at least ~1 ADA in overhead, making micro-fee revenue economically indefensible. That single constraint suppresses wallet product-market fit, inflates DeFi batcher costs across the entire ecosystem, and blocks the L2 reserve patterns that scaling solutions need. Fixing it is protocol infrastructure, much more than a simply product enhancement.
Two of the three workstreams align directly with governance priorities I've stated publicly. CPS-23 Multi-Asset Treasury begins the design work that makes it possible for the Cardano Treasury to hold stablecoins, directly addressing the ADA price volatility problem that undermines every treasury-denominated governance proposal, including this one. Babel Fees takes the principle of meeting users where they are and applies it to DeFi onboarding: BTC holders and USDC users should be able to transact on Cardano the moment they arrive, without first acquiring ADA. That is the public-utility promise of this network made real for the next generation of users.
At ₳13,103,039 (~$3.1M at the proposal's $0.24/ADA reference rate), with 86% of the budget allocated to development across three clearly separated workstream allocations, the cost structure is proportionate. Implied annualized cost per senior protocol engineer runs approximately $250–300K, within range for ledger-level specialists. The execution risks worth naming are honest ones: WS3 (Babel Fees) has a hard dependency on CIP-118 (Nested Transactions), which is separately funded and not yet on testnet, and the Babel Fees MVP launches as a single closed-network provider with the operating entity still an open decision  because, permissionless multi-provider architecture arrives in a later iteration. Both are disclosed in the proposal's own risk table and are appropriately managed by the milestone structure rather than the vote.
