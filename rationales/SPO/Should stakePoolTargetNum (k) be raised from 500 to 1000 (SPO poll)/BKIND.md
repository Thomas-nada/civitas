<!-- url: https://smitblockchainops.nl/governance/vote-k1000-poll-f6fd3678.jsonld -->
# BKIND

**Proposal:** Should stakePoolTargetNum (k) be raised from 500 to 1000 (SPO poll)
**Vote:** Yes
**Voter ID:** `pool1m83drqwlugdt9jn7jkz8hx3pne53acfkd539d9cj8yr92dr4k9y`

---

Action: info action f6fd3678f12edc58dd8739560149fcdb0b8b6fc77a5f303d49c87c74d1fccb4c#0, Should stakePoolTargetNum (k) be raised from 500 to 1000? (SPO poll).

What is being decided. This is an Info Action: it changes no parameter and has no on-chain effect. It asks whether sufficient SPO support exists to proceed with a later Parameter Change action raising stakePoolTargetNum from 500 to 1000. The document declares its own standard for reading the result, and how that standard should be interpreted is disputed in the community. That dispute does not touch this vote: an explicit Yes, cast with the pool's full stake, counts identically under every reading on the table.

I verified the document I am voting on. The blake2b-256 digest of the bytes retrieved from https://gateway.pinata.cloud/ipfs/bafkreia3u74dgyvg5v3u7wxwip44wwqzyhynqqm4wzyhkkwevaiynlihnm equals the anchor hash recorded on chain, ab85aad06200d7d7ec79181b68d0651083ffdd9b9bcd15c54212d4d681a9b680.

I take part in Cardano governance in two roles, as operator of the BKIND stake pool and as DRep. My registered DRep rationale commits me to two things: keeping power on this network dispersed, and holding every proposal to evidence rather than narrative (drep17x37hhwtekakdnx7fh3ge0d3pz370pulruvjvfhp207wkl2slp4, smitblockchainops.nl/governance/drep.jsonld). This vote applies both, and my position is unchanged since I registered: the Cardano ledger should be carried by a broad network of independently owned pools.

The evidence below is reproducible from cardano-db-sync and verified against my own independently built indexer.

1. Concentration is rising. The top-50 pools' share of active stake grew from 14.1% at epoch 400 to 18.2% at epoch 653, monotonically. 158 pools now control half of all delegated stake, down from roughly 198 at epoch 300. While k sits still, concentration has only one direction: up.

2. The pool register overstates the real network. 2,896 pools are registered (epoch 655), but only 1,339 produced a block in 2026. 1,495 registered pools produced nothing this year and none of their registered relay addresses answers as a Cardano node: I probed all 2,449 registered relay endpoints, with node-to-node handshakes on everything that accepted TCP; a handful of addresses still respond, but with a refused connection, a web server, or silence. Together these pools hold 0.21% of active stake. Claims about the size of the pool network should therefore be based on the 1,339 pools that actually produce, not on the register.
