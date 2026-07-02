<!-- url: ipfs://QmWSJQtU3RngW2gKSo6yKPZReNdQLQMc2edXNnp1LqLdeJ -->
# jonahkoch

**Proposal:** Reduce the committeeMinSize parameter from 7 to 5
**Vote:** No
**Voter ID:** `drep1yt8trnz8e5cnylmyygt0pyzrfw92rt9s42kg8t4rhm6t0dstyvmdn`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmSFQa1Sn9ornWGvsNGasEj6V9eNBC8hzEiSS3qDsqJiaB

I'm voting no on the committeeMinSize reduction, and the reasoning centers on a principle I raised in the proposal discussion at Dreptalk.com: governance resilience should come from structural constraints that make bad outcomes impossible, not from parameter adjustments that assume good outcomes from individual actors.
The proposal frames 7=7 (floor equals actual count) as a fragility. I'd frame it differently: it's a guarantee. When the floor equals the number of seated members, every individual's continued participation is load-bearing. That creates institutional pressure that no parameter tweak can replicate, it makes departure costly in a way that everyone involved understands before they accept the seat. Lowering the floor to 5 removes that pressure for any member serving on a 7-member committee, making marginal departures slightly more rational while simultaneously expanding the governance failure surface: 6-member tie scenarios become plausible where they weren't before, and the effective veto power of any two members on a 5-member committee increases meaningfully relative to the current 3-of-7 required to block.
I also don't think this proposal addresses the actual problem, which is that Cardano lacks a comprehensive CC succession mechanism, reserve seat program, or compensation model that makes long-term service sustainable. Those are process and resource problems. If the ecosystem can fund tens of millions of ADA toward nodes, tooling, and events in a single budget cycle, it can fund mechanisms to make CC membership viable and replace departing members promptly. That's the fix. Reducing the floor doesn't solve the recruitment problem, but rather it makes the consequences of the recruitment problem marginally less severe while introducing new governance pathways to impasse.
This governance action is reversible if the CC stays at 7 or above, and I note the reversion plan exists. But the appropriate time to address operational resilience in the CC is before a member departs and governance halts, through proactive elections, reserve memberships, and succession protocols, and not by adjusting the floor parameter after the fact.
Problem 1. The institutional pressure argument runs backward. Right now, the floor being set at 7 creates a powerful structural incentive to maintain full membership. Every CC member knows that their departure doesn't just reduce quorum, it breaks governance entirely. That's a feature, not a bug. It concentrates accountability. Lowering the floor to 5 doesn't just create a buffer; it reduces the institutional cost of resignation for any individual member, making departure marginally easier to rationalize.
Problem 2. The tie scenario is underweighted in the proposal. At 6 active CC members with a 2/3 threshold, a 3:3 split fails the threshold. No tiebreaker exists. A 6-member CC under this parameter regime would make 3:3 impasse a structurally plausible outcome for any governance action with genuine controversy.
Problem 3. The root cause is process, not parameters. Lowering the floor parameter papers over the recruitment and retention problem without solving it.
Problem 4. The precedent is real, not theoretical.
The guardrails allow committeeMinSize down to 3. Once 7→5 passes, the next "operational resilience" argument for 5→3 is structurally identical. The proposal says this isn't the intent, but intent and outcome diverge over time, especially as different governance participants cycle in.
