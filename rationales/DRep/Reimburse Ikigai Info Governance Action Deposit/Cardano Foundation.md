<!-- url: https://ipfs.io/ipfs/QmXMSAGidowACErDfxevYpbP7Nm4xQDKQVaZwjBJbNv7vx -->
# Cardano Foundation

**Proposal:** Reimburse Ikigai Info Governance Action Deposit
**Vote:** Yes
**Voter ID:** `drep1ydpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsjaelx`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmYnVx9ZN478kEVbujrvVvcAiVt9YhGsu2jC7kqgEoHi3m

We support this proposal to resolve a documented technical issue from early on-chain governance. Our support is based on correcting a user error where a 100,000 ada deposit was lost due to the cardano-cli not blocking unregistered stake addresses for governance action deposits. This decision aligns with long-standing community consensus for fair reimbursement, and providing reasonable compensation that covers the principal plus lost staking rewards.

We have previously established the condition in our vote on governance action gov_action1x2zm0lgd59kjrc9clzgscdlh0ct62l8llr638h6t4a5jj4yqzzyqq2dgc7q: the proposer must provide verifiable proof that they are the original affected party to prevent fraudulent claims. Although this reimbursement proposal was submitted from a stake address different from the original Info Action (stake1u8453de8xhhqa9c4ftvylkke8we84tmaq5hz75qwfgaaf2qac45ja), on-chain data satisfies this condition. The 2026 reimbursement action directs the 103,000 ada treasury withdrawal straight to the original reward account (stake1uys93fhep4lc2u6lu0q09kcxayxzthasded35c0x0w60ugc9s0cm5) that lost the deposit. Anyone can independently verify this provenance by checking the raw on-chain data or blockchain explorers.

Because funds deposited into a reward account can only ever be withdrawn using that specific account's private stake key, the payment target itself enforces identity protection. Even though the submission came from a different address, the funds are cryptographically locked to the original 2024 key holder, satisfying our condition for safe and valid restitution.
