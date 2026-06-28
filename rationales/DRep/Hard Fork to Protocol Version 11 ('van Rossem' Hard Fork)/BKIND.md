<!-- url: https://smitblockchainops.nl/governance/vote-hardfork-protocol-11-fdd468da.jsonld -->
# BKIND

**Proposal:** Hard Fork to Protocol Version 11 ('van Rossem' Hard Fork)
**Vote:** Yes
**Voter ID:** `drep1ytc6867ae0xmkekvmex79r9akyy28eu8nu03jf3xu9fle6c82l4eq`

---

Action: HardForkInitiation fdd468da5cc4ac8431dcd7e2b3211666c73bc229f85879469f67f1d9d51d344d#0 — upgrade to protocol version 11.0.

I vote Yes because the protocol-11 upgrade is ready by every measure I can verify myself on-chain. I judge this action on that evidence, not on advocacy or authority — consistent with how I registered as a DRep.

I do not take readiness claims on faith. The figures below were produced by my own independent indexer — software that reconstructs chain state from the network genesis and the live Ouroboros node-to-node protocol, decoding raw blocks itself, with no third-party indexer, API, or pre-built dump, and accepting each (slot, hash) only when a quorum of independent relays agrees. I then cross-checked every figure, bit-for-bit, against an independent db-sync instance.

1. Network readiness. The share of blocks signalling protocol 11 has risen monotonically from 49.9% (epoch 632) to 85.7% in the last complete epoch (638) and 86.7% in the current epoch (639). For all seven completed epochs, my independent indexer and db-sync report identical block counts — zero divergence. A rising supermajority of block production already runs protocol-11-capable software; enacting will not strand the network.

2. My own pool. BKIND has signalled protocol 11 since 10 May 2026 (epoch 630), on every block it has produced since, with no reverts. I do not ask the network to adopt what I have not already run myself.

3. Tooling built on protocol 11. Smit Blockchain Operations has built three air-gapped toolkits — SPO Tools, DRep Tools, and Wallet Tools — on the protocol-11 source, and exercised them live on Cardano mainnet (governance votes, DRep registration, delegations, payments). We encountered no issues attributable to the protocol-11 code. Their source and binaries will be released as open source for the community shortly.

On this evidence the upgrade meets my bar — verifiable readiness, not promises.

A constructive note to the protocol developers. Building an independent implementation is the most honest test of how completely a protocol is documented. We hit a meaningful number of edge cases with the same root cause: behaviour that is correct in the reference code but carries no inline documentation — for example SSC proof handling, reward-calculation timing, ledger-state diff APIs, value bounds, and hard-fork-combinator era boundaries. These are documentation gaps, not protocol defects. Because independent verifiability is itself a pillar of decentralisation, better inline documentation lowers the barrier to independent implementations and auditors — and is, in that sense, a decentralisation measure. Developers with questions are welcome to email developmentbkind@gmail.com.
