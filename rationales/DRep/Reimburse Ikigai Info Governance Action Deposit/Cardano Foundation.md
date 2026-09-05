<!-- url: ipfs://QmawbxBQNNnTjiCd8d3mQiFqPTYUEvCUZs3g2jLxmpprAc -->
# Cardano Foundation

**Proposal:** Reimburse Ikigai Info Governance Action Deposit
**Vote:** Yes
**Voter ID:** `drep1ydpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsjaelx`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmTzJxArrbRtW99K1iCB6tSiWu8qLDb57NoCoy84pJNdhd

This proposal aims to correct a well-documented technical issue from the first weeks of on-chain governance. The Cardano Foundation supports this action based on the following:

- **Correcting a Protocol-Level Flaw:** This is not a typical funding request, but a reimbursement. An early pioneer of the governance system lost their deposit due to a bug in the node that allowed an unregistered stake key to be used, a flaw that has since been fixed. We reject the counterargument that this was simple user error; the technical requirements were not documented in an accessible way for the community at the time. Upholding the integrity of the governance system means making this user whole.
- **Community-Aligned Action:** There has been widespread, long-standing community agreement that this reimbursement is the right and fair thing to do. Voting "yes" aligns with this community consensus and strengthens trust in the governance process.
- **Reasonable Compensation:** The request for 103,000 ada is reasonable. It covers the 100,000 ada principal and a modest 3,000 ada to compensate for lost staking rewards and other opportunities. This additional amount is a fair calculation to fully restore the user to the position they would have been in.



## Condition for Treasury Withdrawal
Our support for this budget info action is given with one clear condition for the subsequent treasury withdrawal: **the proposer must provide verifiable proof that they are the original, affected party.**
This current proposal was submitted from a different stake address (`stake1u8453de8xhhqa9c4ftvylkke8we84tmaq5hz75qwfgaaf2qac45ja`) than the one that lost the deposit (`stake1uys93fhep4lc2u6lu0q09kcxayxzthasded35c0x0w60ugc9s0cm5`). To prevent a fraudulent claim and ensure the correct party is reimbursed, the proposer must, at the treasury withdrawal stage, provide definitive proof of identity.

This proof could be provided in one of two ways:
1. **Direct Payout:** The treasury withdrawal is submitted with the payout address set to the original, affected stake address (`...c9s0cm5`).
2. **Cryptographic Proof:** The proposer provides a message signed by the stake key associated with the original (`...c9s0cm5`) address, confirming their identity and directing the funds to the new address.

Without such proof, we will not support the final treasury withdrawal.
