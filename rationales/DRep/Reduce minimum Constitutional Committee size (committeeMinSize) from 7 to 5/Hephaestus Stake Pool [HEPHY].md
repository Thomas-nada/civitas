<!-- url: https://raw.githubusercontent.com/hephy-io/mainnet/refs/heads/main/drep_rationales/GA088-param-cc.jsonld -->
# Hephaestus Stake Pool [HEPHY]

**Proposal:** Reduce minimum Constitutional Committee size (committeeMinSize) from 7 to 5
**Vote:** No
**Voter ID:** `drep1y2zu74gt8sxtrxcngqsmrnupkzrtmlqshmvmm5qtuhxx6xqt7yhaw`

---

I am voting NO on this Parameter Update proposal” Reduce minimum Constitutional Committee size (committeeMinSize) from 7 to 5” (dfdac5921ab657241fce58583d61bef59a369e01d2ba78191d6df6632a07fdfd#0). I have many thoughts on this proposal and the wider state of Cardano governance recently and that particular rationale was becoming extensive. As it stands now though, the future of this proposal is unclear as it is about to become null and void and so this vote is submitted in urgency to maintain voting record.

What? Exactly. When certain governance action types are submitted, they are required to reference the previously enacted action of that type. The four types are Update Committee, Update Constitution, Hard Fork and Parameter Update. The previous Parameter Update action was “Plutus V3 Cost Model Parameter Changes Prior to Chang#2” (b2a591ac219ce6dcca5847e0248015209c7cb0436aa6bd6863d0c1f152a60bc5#0) way back in November 2024.

This proposal was submitted at the same time as another existing Parameter Update proposal, “Increase Transaction and Block Memory Units (Part 1 of 2)” (c21b00f90f18fce4003edf42b0b0d455126e01c946e80cc5341a9f9750caf795#0). It referenced the same previously enacted governance action, which means that there would be a conflict if both were to pass as the earliest one would render the later one invalid. The newly enacted parameter update becomes the new “prevGovActionId”, meaning that the second proposal then have an incorrect reference.

Could this have been avoided? Yes. First witnessed on SanchoNet during simultaneous Update Committee actions, and then shortly after on mainnet, someone can submit a second proposal of the same type, if they pre-emptively reference the currently active proposal. There remains a risk here in the event that the earlier live action could still fail to pass, in which case the later one would too as it would once again be referencing an action that wasn’t enacted.

What this situation highlights is, the need for greater communication and co-ordination when it comes to governance action proposals with on-chain effects. It may be okay to throw as many Info Actions out there as you like at any one time, they have no on-chain effects. While we exist in a permissionless system and anyone is free to submit their own actions, if they have access to the required deposits, Update Committee, Update Constitution, Hard Forks and Parameter Updates, are usually submitted after much co-ordination, effort and research. They are often timed in order to avoid issues such as this. This year alone we have two Mem Unit updates, a Plutus Cost Model update and a Hard Fork action in the pipeline, that I know of. To have an individual essentially running around and playing with all of the governance knobs and dials that they can get their hands on at the moment is, frankly, counter-productive. The Parameter and Hard Fork committees may be put on edge unnecessarily now, unsure of whether their extensively co-ordinated and timed proposals now run the risk of colliding with a proposal from out of nowhere.

This is a theme that has continued since the recent Constitution update. For those that missed the recording of the Technical Steering Committee meeting dated January 21, 2026, one aspect that was overlooked in the rewriting of the Constitution was that changing the wording of the “PARAM-04a” guardrail. It was changed from “3 months” to “90 days” and as a result, the guardrail name should have also changed to “PARAM-04b” to highlight this amendment as per the Parameter Committee guidelines. They were not consulted, this did not happen and they have been left reasonably perplexed at the whole process. (Source: https://youtu.be/_jS-egZUH4c?t=3118).

I bring all of this up because it highlights a pattern of behaviour heading into an already busy Parameter Update period this year that really requires much better co-ordination going forward. Cardano is an ecosystem, not an individual.
