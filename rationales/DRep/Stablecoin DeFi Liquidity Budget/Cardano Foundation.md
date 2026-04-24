<!-- url: ipfs://QmVX1nbcVoVgNyjG8jdK1gng5dUdR5ocNtc2e97ssJC2oL -->
# Cardano Foundation

**Proposal:** Stablecoin DeFi Liquidity Budget
**Vote:** Yes
**Voter ID:** `drep1ydpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsjaelx`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmQDpskBRwSEmhrH6LqikZWELxMFKWda6yvuBakhxq5jn7

We commend the proposing team for their effort and for tackling the challenge of stablecoin liquidity on Cardano. The initiative to establish a structured, on-chain governance process for liquidity deployment is very welcome and lines up with our own efforts. Our YES vote is a recognition of these facts and a reflection of the willingness by the proposers to collaborate on solving the remaining practical challenges.
However, to proceed successfully from the proposal stage to withdrawals, a treasury request of this magnitude that also establishes new governance mechanisms, must provide satisfactory answers on all key challenges. In its current form, the proposal does not yet do this. We provide an overview of our requirements and recommendations below.

---

## Recommendations for a Revised Proposal
Our support for any future treasury withdrawal is contingent upon the proposing team addressing the key remaining challenges. We have separated these into requirements for our future support and an additional set of recommendations.

### Minimal Requirements
The following are the key challenges the team must provide satisfactory answers for in the subsequent treasury withdrawal requests. For the Phase 2 requirements, we may add additional or further clarify existing requirements subsequent to Phase 1 results.

#### For the Phase 1 Treasury Withdrawal Request - 500k ada:
1. **Legal and Operational Structure:** The proposal must detail the legal structure and jurisdiction that will be used as a legal nexus for the committee and associated governance mechanisms and provide a rationale for the choices made.
2. **Conflict of Interest Policy:** A conflict of interest policy for committee members and any other decision makers, outlining consequences for non-disclosure.
3. **Selection Framework:** The specific, detailed criteria for evaluating and selecting stablecoins, DeFi protocols, and DEXs, including any limitations on such selections, must be published before any treasury withdrawals are submitted. The protocol application (RFP) process must also require applicants to disclose any relationships with committee members. If a conflict of interest (COI) is discovered after the fact, we expect the affected protocol to be blacklisted and the involved committee member to be removed from the committee.
4. **Clarification of Metrics:** The metrics currently provided to measure success and manage community expectations (e.g. "4% Annual Returns") must be clarified  (e.g. to distinguish between portfolio APY and the actual distribution yield to the treasury). This includes the intended improvements to the user experience in Cardano DeFi. Additionally a clear formula for calculating monthly revenue must be provided.
5. **Asset Management Strategy Principles:** An outline of the overall approach to the asset management lifecycle for the fund.

#### For the Phase 2 Treasury Withdrawal Request - 49.5M ada:
1. **Legal and Operational Structure:** The governance and contractual framework for the legal structure and its constituent components (e.g. board, committee(s), other) must be fully developed and publicly available. This includes but is not necessarily limited to e.g. articles of association, organisational regulations, other internal policies and regulations (insofar as they are not security relevant; e.g. custody setup), etc. 
2. **Projections and Simulations:** Suitable projections and simulations that map out the likely outcomes of the liquidity injections for the Cardano ecosystem and by extension provide a justification for the withdrawal amount.
3. **Advisors & Service Providers:** The advisors and service providers envisaged for the operational phase must be identified and a rationale should be provided for the selection of each one.
4. **Risk Management:** A formal risk management framework and assessment, including contingency and disaster recovery plans (e.g. committee out of action) for the legal structure must be available.
5. **Asset Management Strategy:** A fully fledged strategy to address the lifecycle of liquidity positions must be available, including an approach and strategy for unwinding and reallocating capital over the long term.
6. **Operational Procedures:** An operational framework with associated processes must be available (e.g. for committee operations, voting, eligibility selection, wind-up etc.).

### Recommendations
The following are recommendations that we would strongly suggest for consideration by the proposal team going forward. We believe they are critical for strengthening the proposal’s safety and viability.
1. **Governance and Security Design:**
    - **Fund Return Process:** The administrating smart contract should include a technical failsafe that allows a tDAO vote to directly and automatically trigger the return of funds to the treasury without committee cooperation.
    - **Committee Member Qualifications:** The proposal should establish minimum requirements for committee candidates (e.g., KYC, Sanctions Checks) and allow for voluntary resignation.
    - **tDAO Action Prioritization:** A clear process for prioritizing tDAO votes should be defined to prevent the mechanism from being used to deliberately block urgent actions.
    - **Governance Protocol Flexibility:** A plan should be outlined for how critical updates could be made to the "immutable section" of the Governance Protocol if a vulnerability is discovered.
    - **Time Delays and Vetos:** To minimize the opportunity for frontrunning and provide an additional safeguard for committee overreach, suitable time delays between committee decisions and on-chain execution should be considered, possibly alongside tDAO veto power as a backstop.
    - **Dual-Approval for Key Decisions:** Simply increasing the committee voting threshold does not sufficiently mitigate the risk of a captured committee. We recommend implementing a dual-approval mechanism for critical decisions (e.g. deploying funds to a new protocol). This would require both a majority vote from the administrative committee (e.g. 5/9) AND a separate approval from the tDAO (e.g., a 33% active stake 'yes' vote). This or similar mechanisms would introduce a vital check and balance on the decision making process and increase operational security for the committee, ensuring alignment between the expert committee and tDAO.
2. **tDAO Integrity and Mechanics:**
    - **Membership Rules:** The rules should explicitly prevent administrative committee members from simultaneously serving as DReps within the tDAO.
    - **Voting Power Snapshots:** The proposal should commit to a high-frequency (e.g., daily) snapshot of DRep voting power to accurately reflect the state of delegation.
    - **Clarification of tDAO Voting Mechanics:** The proposal should specify how non-votes are treated and should consider establishing minimum quorum requirements.
DRep and Committee Compensation and Liability: The proposal should address if, why and how DReps and committee members will be compensated for their oversight role, how to ensure that they “turn up for work” if they do receive compensation and what, if any, legal exposure they could have.

**Note on Governance and Oversight**
To ensure transparency, we acknowledge the participation of our CTO, Giorgio Zinetti, as a member of the administrative committee for this proposal. We view his involvement as providing critical technical expertise and oversight to the initiative, helping to ensure its operational soundness.
