<!-- url: ipfs://bafkreibbdixhxtvrzi24nbaddflcy7x65bl22um6cdxr6odsqe6nvg7v6e -->
# Nimuë Lady of the Lake Pool

**Proposal:** CARDANO BLOCKCHAIN ECOSYSTEM CONSTITUTION v2.0
**Vote:** No
**Voter ID:** `drep1ygj02llvuusnhphvhlxf7d2cxhs53twjnwwl5at3zwht4xc6xdgl4`

---

I’ve decided to vote ❌ NO on this proposal to replace the Cardano Constitution. While I strongly support eliminating the budget governance action because it is redundant and unnecessary, I have several concerns with this proposal.

Firstly, this version has simply been presented for a vote without broad community input and discussion to fine-tune it, which is necessary for such an important document. We just had the governance and budget workshop in Las Vegas, where many community members reviewed the current process and raised interesting points. These points could certainly be taken into account when drafting a new version of the constitution. This current proposal feels somewhat premature.

Secondly, this version seems to have merely removed the budget info action while leaving the rest largely unchanged ( except for one small point I will return to later). Rather than only removing the budget info action, I would have preferred to see the budget incorporated into the treasury withdrawal action. This way, we still have budgets, but without the need for separate governance actions to approve them. Since there would no longer be an on-chain budget vote in advance, I believe the constitution should at least mention that an off-chain process to gather DRep sentiment before posting treasury withdrawals on-chain is preferable (like the Ekklesia vote, though no need to name a specific tool, let’s keep it general).

Thirdly, the small point I mentioned earlier: the guardrail about the budget action has suddenly been replaced by the following:
> TREASURY-04a (x) A roadmap that includes the applicable period of the treasury withdrawal must be approved by the DReps via an Info Action with a threshold of greater than 50% of the active voting stake.
This introduces a new step that was not required before. While I think gathering DRep sentiment on the roadmap through an info action can be valuable (we have done this before), it should not be made mandatory. If it is to be included in the constitution, the process should be described more clearly in the main text of the constitution, not only as a brief mention in the guardrails.

Fourthly, I am concerned that the following text was removed from the constitution, as this essentially reduces the powers of the Constitutional Committee (perhaps unintentionally) compared to what they currently have:
> In the case of "Info" actions that propose a Cardano Blockchain ecosystem budget, Constitutional Committee members shall record a vote on-chain that sets forth their opinion as to whether the proposed budget, if it were to be implemented in the form contained in the "Info" action, would violate this Constitution.
> In the case of "Info" actions that propose a withdrawal from the Cardano Blockchain treasury pursuant to a previously approved budget, Constitutional Committee members shall record a vote on-chain that sets forth their opinion as to whether such proposed withdrawal, if made in accordance with such "Info" action, would violate this Constitution.
This text should of course be adapted to reflect a combined budget/treasury withdrawal action, but it’s an important part of the constitution imho.

Fifthly, I have some remarks about the definitions added in this version:
* The definitions are divided between the main text and the guardrails, which appears somewhat chaotic and arbitrary. It would be better to bring them together in the main text (with exceptions for definitions that are specific to the guardrails).
* I would have liked to see, already in the first constitution, a clear statement that the Cardano Blockchain is public and permissionless (as in the Cardano Foundation’s proposal). Since "public" is already present in the definition, please add "permissionless" as well, and make this the first definition for clarity and logical structure.
* The definition of the NCL remains as ambiguous as it is now. This needs to be clarified so that all confusion about its meaning is eliminated and there can be no further debate.
* For the definition of Active Block Production Stake, I believe it is better to use the same wording as in the Shelley Design Specification. So instead of "…that is actively delegated to Stake Pools…" it should say "…that is correctly delegated to non-retired Stake Pools…".

Lastly, I would like to see the NCL implemented on-chain instead of being only an info action. However, since this requires code changes, it can be left for a later update to the constitution.
