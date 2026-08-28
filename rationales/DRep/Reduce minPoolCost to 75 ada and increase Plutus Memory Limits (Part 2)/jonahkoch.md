<!-- url: ipfs://QmUp2CKymwegmEmkKsetKB5Yd6Wv3ueHs1LvNiAhaPqmwS -->
# jonahkoch

**Proposal:** Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2)
**Vote:** Abstain
**Voter ID:** `drep1yt8trnz8e5cnylmyygt0pyzrfw92rt9s42kg8t4rhm6t0dstyvmdn`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/Qme8g729zEeaBZ12zpt3rMVyayxmoXseKcu7D8hFtebLWC

I vote Abstain on this parameter-update bundle.
The Plutus memory increase is straightforward and needed. It completes a planned 25% cumulative expansion of maxTxExecutionUnits[memory] and maxBlockExecutionUnits[memory], giving dApp developers headroom that will be required once Leios parallel block production finally arrives. Without the execution-layer capacity, the consensus-layer throughput is just an empty pipe. I'd vote Yes on this part alone.

The minPoolCost reduction to 75 ada is not as clear to me. I have run infrastructure, but I'm not an SPO. The proposal itself calls this a "stopgap" pending minPoolMargin (CIP-0023). Some active SPO have stated directly that 75 ada is not operationally sustainable, especially if ADA falls below about $.20 USD, compounded with reality that reserve-funded block rewards continue declining. The post-2023 drop to 170 ada did not produce a race to the bottom, but we have also seen many pools both with hight and low stake close down over the last two years.  Making sure SPOs can safely maintain modern hardware should be compensated for. Furthermore SPOs are required to vote today as part of CIP-1694 governance this work should be compensated for in addition to legacy SPO responsibilities.

MPC-03 says minPoolCost "should" reflect pool operating costs. I recognize  this is a SHOULD guardrail, not a MUST, and that the Constitution doesn't mandate a specific cost floor. But "should" still carries intent. The Parameter Committee is asking the network to approve a number that even its own rationale admits is incomplete. I'm not comfortable approving any unnecessary risks to operator sustainability.

The deeper problem is bundling. These two changes are unrelated: one is execution-layer capacity, the other is stake-pool economics, "bundled here for submission efficiency", efficiency for the proposer shouldn't force an all-or-nothing vote on the voter. Votes on bundled parameters, means accepting a minPoolCost level I believe is premature.

My abstention is not support for this action, and it is not rejection of Plutus memory expansion on the merits. It's an acknowledgment that I cannot make a reliable Yes/No judgment on the whole when the parts pull in different directions.

If these were split into separate votes, I'd vote Yes on Plutus memory and Abstain on minPoolCost until minPoolMargin is in place.
