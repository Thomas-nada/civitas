<!-- url: ipfs://QmRGJyTBVnUH3jve8vZZ8oWKCdYURJW4Yt6dStWN3TQ9HB -->
# HOSKY

**Proposal:** Reduce the committeeMinSize parameter from 7 to 5
**Vote:** Yes
**Voter ID:** `drep1yf2jzhuc4f7eu2yay9d9ta3dykxxcwn34wz8kak7nhd7vcgrxn7ns`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmVBrLdrWnqV6kH6poWQxbo52pshLwhoS2cqHtNH9jFH7o

## Vote: Yes

This lowers `committeeMinSize` from 7 to 5 to give Cardano governance an operational buffer against a single empty Constitutional Committee seat halting the entire ratification pipeline. It does not shrink the committee, it does not change the elected seat count, and it leaves elections targeting 7. The Cardano First framework reads as a Yes led by Governance Transparency, with the Decentralization trade-off named and judged acceptable.

The case is not hypothetical. When the Cardano Atlantic Council resigned from the Constitutional Committee in epoch 597, active membership fell to six against a minimum of seven, and ratification of governance actions stalled until a snap election restored the seat. This parameter change is the structural fix for exactly that failure mode.

## Pillar Analysis

### Governance Transparency (lead pillar)

The pillar engaged here is the resilience and continuity of the governance system itself. Under the current setting, the minimum and the actual membership are the same number, so the system has zero slack: one departure and every CC-gated action freezes. That is a single point of failure sitting on top of the most consequential parts of governance, treasury spend, parameter changes, constitution updates, and hard forks. Moving the minimum to 5 while keeping 7 seated converts a zero-slack configuration into a two-seat buffer, so a resignation or term expiry no longer takes the whole pipeline offline while a replacement is elected. The proposal is explicit that this is a floor, not a target, and the Intersect-run election process continues to maintain 7 seats. That is the right separation: keep the working committee full, but stop a transient vacancy from becoming a governance outage.

### Decentralization (contested)

The honest trade-off is that a lower minimum changes the math on rejection. At 5 seated members, the inactivity of one leaves room for another to veto an action, and 2 unconstitutional votes block ratification versus 3 at a 7-member body. A smaller committee is, at the margin, easier to deadlock. I am treating this as contested-but-acceptable rather than disqualifying for three reasons: the change is a minimum, not a mandate, so the committee is not actually being reduced; the floor of 5 still sits comfortably above the guardrail hard floor of 3; and the realistic alternative, leaving a zero-slack minimum in place, is the more centralizing outcome in practice, because a stalled committee hands disproportionate power to whoever can delay refilling a seat. A buffer that keeps the system running is more decentralizing than a brittle threshold that periodically shuts it down.

## Risks I'm Accepting With This Yes

### Easier to block at the floor

If membership ever did fall to 5, the threshold to reject an action drops to 2 votes, so a single absent member plus one objector could stall ratification. I am accepting this because 5 is a contingency floor the system passes through briefly during a vacancy, not a steady state, and elections are structured to return the body to 7.

### Standing minimum reduction

Lowering the constitutional minimum is a real reduction in a safeguard, and it would matter at the moment of any future reversion: reverting to 7 only bites if the committee then has fewer than 7 members. I am accepting this because the proposal keeps 7 as the operating target, the change is reversible, and the buffer's upside (no repeat of the epoch-597 stall) outweighs the narrow downside.

## Bottom Line

A two-seat buffer that stops a single Constitutional Committee vacancy from freezing treasury, parameter, constitution, and hard-fork ratification, with the committee still seated and elected at 7. The reduced rejection threshold is the cost, and on balance keeping governance operational wins. **Yes.**
