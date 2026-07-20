<!-- url: ipfs://bafkreicwqobv4t3aevw27y3l4d75xw6hovt75isdjbaa326g7o4js7uf3e -->
# Todd

**Proposal:** Bifrost Unlocking Bitcoin DeFi on Cardano — Road to Mainnet (Phase 1 of 2)
**Vote:** Yes
**Voter ID:** `drep1y2edf5yw90jcpt55pm4336y40gty468gk56un56z8pu2wfcklamyv`

---

I am voting YES on Bifrost: Unlocking Bitcoin DeFi on Cardano — Road to Mainnet (Phase 1 of 2).

The strategic case is sound: Bitcoin liquidity is the largest addressable pool of capital in crypto, Cardano's eUTxO architecture and native-asset model are genuinely well suited to host it, and the ecosystem currently lacks a credible BTC rail. But strategic alignment alone would not earn my yes — what moved me is the combination of demonstrated delivery and grant construction.

On delivery: this is not a paper proposal. The bridge is live on testnet under an active Catalyst Fund 14 grant, with early milestones approved and the remainder on track. Both vendors are Cardano-native with verifiable track records — FluidTokens has shipped externally audited DeFi products on Cardano since 2022, and Lantr delivered its prior 2025 treasury workstream (Scalus) in full. Prior funding is disclosed per Article II §7.2.

On construction: this is among the best-administered treasury asks I have evaluated. Funds sit in the audited SundaeSwap treasury-contracts escrow with milestone-gated vesting, auto-abstain delegation, and an automatic sweep of unspent funds back to the Treasury. An independent oversight board (Blink Labs, Cardano Foundation, IOG members with no stake in the vendors) co-signs disbursements, and any single member can pause a milestone. Independent technical assurance and a financial audit are budgeted. The ask is priced at a $0.16/ADA reference rate that matches spot at the time of my vote, so the USD value of the request is what it claims to be. The budget allocation is appropriate to the risk profile of a bridge: roughly three-quarters flows to engineering and security, with over $550K committed to external audits, formal verification, penetration testing, and a bug bounty before any public exposure.

Finally, the phasing is a real control, not a framing device. Phase 1 ends at an audited private mainnet under controlled access; public launch and operations require a separate Phase 2 vote with on-chain proof in hand. DReps retain a genuine off-ramp.

**Additional information about your vote:**

My yes is conditional in spirit. I am recording the risks I expect the oversight board, the proposers, and the community to address before Phase 2:

1. The federated fallback mode is undefined. The proposal names it as a continuity layer but does not specify federation membership, activation triggers, or powers. This is the trust concentration point in an otherwise decentralized custody story. I expect full specification — including named signers — published before any mainnet BTC is locked, and I will treat its absence as grounds to oppose Phase 2.

2. The SPO participation assumptions are unproven at scale. FROST/Schnorr is mature cryptography, but no production system runs it across 400+ stake-weighted signers, and five SPOs participate on testnet today against a Phase 2 assumption of 400 active signers at month six. I expect Phase 1 reporting to show a credible onboarding trajectory and a defined minimum viable signer set, and I expect analysis of custody-weight concentration given Cardano's actual delegation distribution.

3. This is effectively a ~$3.3M two-phase commitment. Phase 2 (~$1.3M plus 24 months of subsidized operations) is already scoped, and Phase 1 approval creates momentum toward it. I am voting for Phase 1 on its own merits and will evaluate Phase 2 independently, including whether the ecosystem-readiness deliverables (SPO pledges, dApp commitments) represent binding intent rather than expressions of interest.

4. Treasury returns are back-loaded and speculative. Even the base case reaches only 1,200 BTC TVL by mid-2029, and fee surplus flowing back to the Treasury begins in Year 3–4 at the earliest under a provisional economic model. I weigh this proposal as strategic infrastructure, not as a near-term return on treasury capital, and I expect the hardened economic model published at M3 to be conservative.

5. The disclosed hedging of a portion of the ADA into stable assets is defensible for protecting fixed audit costs, but with ADA near multi-year lows I expect conversion amounts, timing, and venues to appear in the public transaction journal.
