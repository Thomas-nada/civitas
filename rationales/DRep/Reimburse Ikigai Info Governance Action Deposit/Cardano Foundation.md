<!-- url: https://ipfs.io/ipfs/QmQUV6x3ZDmscGLt9mshdARhPwV9YRD8uVNn5cUmQVUWxM -->
# Cardano Foundation

**Proposal:** Reimburse Ikigai Info Governance Action Deposit
**Vote:** Yes
**Voter ID:** `drep1ydpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsjaelx`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmdiBjHoPXtXfMfZZ3yjbd6v2drr6vQw1jcbuT9KNdTm7C

We support this proposal resubmission to address an early on-chain governance technical issue. The previous proposal submission  (gov_action1654yj97lf7guxsh27phtknq2tsc4dajp95fh7vrucaltjy0502csq7qtkhq) failed to meet the DRep approval threshold and clashed with the Van Rossem hard fork enactment. With no changes to metadata or the reward account, our support remains unchanged. This reimbursement resolves a user error where a 100,000 ADA deposit was lost because cardano-cli permitted unregistered stake addresses for deposits. This aligns with community consensus for fair compensation covering principal and lost staking rewards.
We have previously established the condition in our vote on governance action  gov_action1x2zm0lgd59kjrc9clzgscdlh0ct62l8llr638h6t4a5jj4yqzzyqq2dgc7q: the proposer must provide verifiable proof that they are the original affected party to prevent fraudulent claims. Although this reimbursement proposal was submitted from a stake address different from the original Info Action (stake1u8453de8xhhqa9c4ftvylkke8we84tmaq5hz75qwfgaaf2qac45ja), on-chain data satisfies this condition. The 2026 reimbursement action directs the 103,000 ada treasury withdrawal straight to the original reward account (stake1uys93fhep4lc2u6lu0q09kcxayxzthasded35c0x0w60ugc9s0cm5) that lost the deposit. Anyone can independently verify this provenance by checking the raw on-chain data or blockchain explorers.
Because funds deposited into a reward account can only ever be withdrawn using that specific account's private stake key, the payment target itself enforces identity protection. Even though the submission came from a different address, the funds are cryptographically locked to the original 2024 key holder, satisfying our condition for safe and valid restitution.
