<!-- url: https://ipfs.blockfrost.dev/ipfs/QmVEzGfHqAEXF6eH5gXpYVg96dVC1c7ZtNJntv7VavS2Fx -->
# Tingvard

**Proposal:** Reduce the committeeMinSize parameter from 7 to 5
**Vote:** Yes
**Voter ID:** `646d1b3ac94568a422b687db6c47acdf849f1674982ae4f9a494be43`

---

This governance action is a Parameter Change action proposing to reduce the committeeMinSize parameter from 7 to 5.

The proposal explains that the current Constitutional Committee has 7 members, which is equal to the current committeeMinSize value of 7. This creates operational fragility because a resignation, expiration, or other reduction in registered committee members could cause the Constitutional Committee to fall below the minimum required size, preventing governance actions that require Constitutional Committee approval from progressing.

The proposed change does not reduce the actual number of Constitutional Committee members. It changes only the minimum number of registered committee members required for the Constitutional Committee to remain operational on-chain.

The proposal states that the change is intended to create an operational buffer while maintaining constitutional safeguards. It also notes that the current election process is intended to maintain a 7-seat Constitutional Committee and that the change is not intended to lower the existing number of seats.

The proposal identifies the relevant guardrails for committeeMinSize:

CMS-01: committeeMinSize must not be negative.
CMS-02: committeeMinSize must not be lower than 3.
CMS-03: committeeMinSize must not exceed 10.

A value of 5 satisfies all three guardrails.

The proposal also states that committeeMinSize is considered a parameter critical to governance and that an off-chain proposal was published on 2025-11-11. It references the Parameter Committee process and the PCP-005 discussion, and states that the proposal has undergone appropriate technical review and scrutiny.

The action also includes a reversion plan. The proposal explains that the change is reversible if needed, provided there are at least 7 Constitutional Committee members, and that reverting to 7 would only halt governance if the Constitutional Committee had fewer than 7 registered members at the time of reversion.

Tingvard therefore finds that the proposal satisfies the relevant constitutional requirements for this Parameter Change.
