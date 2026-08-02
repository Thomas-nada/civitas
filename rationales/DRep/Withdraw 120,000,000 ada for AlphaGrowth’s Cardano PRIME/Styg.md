<!-- url: https://dreptalk.com/vote-rationale/6c56b92a19f918df1caa32a3aa8ed0499ac3ac289a5f0e9b0ba0a03f72346f43.json -->
# Styg

**Proposal:** Withdraw 120,000,000 ada for AlphaGrowth’s Cardano PRIME
**Vote:** No
**Voter ID:** `drep1yfaq8dsam7nusdccey2x2p684f6ulhr42pv24tslv0terqs3nq50q`

---

# Cardano PRIME Treasury Withdrawal (₳120,000,000) — Voting Rationale

| Governance Voting Rationale |  |
| ----- | :---- |
| GAID | gov_action122wue2k65qq8gmpz795z2axt8apka6ay6xt3pwg8jxj5yfkujmtsqvlfpu7 |
| Title | Cardano PRIME — Treasury Withdrawal of ₳120,000,000 (AlphaGrowth) |
| Type of GA | Treasury Withdrawals |
| Date submitted | Epoch 642 (Jul 9, 2026) |
| Expiration Date | Epoch 649 (Aug 12, 2026) |

# Contents

- [1.0 Introduction](#1.0-introduction)
  - [1.1 Summary](#1.1-summary)
  - [1.2 Description of Governance Action](#1.2-description-of-governance-action)
- [2.0 Discussion](#2.0-discussion)
  - [2.1 What the construction gets right](#2.1-what-the-construction-gets-right)
  - [2.2 Where the finding lives: the private-surplus claim](#2.2-where-the-finding-lives-the-private-surplus-claim)
  - [2.3 A second reading of the same defect: the fiduciary check](#2.3-a-second-reading-of-the-same-defect-the-fiduciary-check)
  - [2.4 Two problems, held apart](#2.4-two-problems-held-apart)
- [3.0 Conclusion](#3.0-conclusion)
- [References / Sources](#references-sources)

# 1.0 Introduction {#1.0-introduction}

## 1.1 Summary {#1.1-summary}

We are voting **NO (remediable)** on the Cardano PRIME treasury withdrawal — and the shape of that NO matters, because it is not a judgment on how the program is built.

On construction, Cardano PRIME is close to a model treasury withdrawal, and this DRep says so at the outset and without reservation. Read as what it plainly is — an openly declared program with a named executor, a named oversight group, a named custodian, and its asset flows on the face of the proposal — it binds its own builder by very nearly the same instruments it would use to bind an ordinary participant. That is exactly the even-handedness one wants to see, and it holds up under scrutiny.

The NO rests on two findings that the quality of the construction does not answer. The first is upstream and is not really the program's own: Cardano PRIME is the consuming half of a spend-before-ceiling pair, and that sequencing problem is addressed in the companion rationale on the Net Change Limit. The second belongs to the program itself: a for-profit withdrawal has to show that its claim on the shared treasury rests on maintaining something the whole ecosystem depends on and can freely use — and this withdrawal's claim rests instead on growth it projects, with a private performance fee attached. Both findings name their own remedy, which is why the vote is remediable rather than terminal: each is specific, and each is fixable in a resubmission.

## 1.2 Description of Governance Action {#1.2-description-of-governance-action}

This Treasury Withdrawals action requests 120,000,000 ada to fund Cardano PRIME, a twelve-month program to improve DeFi protocol readiness, activate incentives, and grow durable liquidity across the ecosystem. AlphaGrowth executes the program under the oversight of an Operating Group, with Intersect acting as Constitutional Administrator and holding the funds in a separate, auditable account.

The proposal is unusually well-instrumented. It runs a phased model — public audit, then gap analysis, then gated deployment, with a decision gate at Month 4 before the third phase. It allocates 2,000,000 ada to independent audit or assurance. It defines six triggers that return funds to the treasury. It ties its performance fee to verified, attributable growth in total value locked, explicitly excluding price effects and TVL not attributable to the program. It reports quarterly, delegates held funds to abstain, discloses that AlphaGrowth has received no treasury funding within the prior twenty-four months, is denominated in ada, and is written to be conditional on an applicable Net Change Limit having enough capacity at enactment. This rationale addresses the withdrawal; a companion rationale addresses that Net Change Limit.

# 2.0 Discussion {#2.0-discussion}

## 2.1 What the construction gets right {#2.1-what-the-construction-gets-right}

Because Cardano PRIME states plainly what it is building, the right first question to ask of it is one of even-handedness: does the program bind its own builder by the same instruments it would apply to an ordinary participant — the ability to inspect, to appeal, to reverse — or does it gather discretion at the top while pointing accountability downward? Run across the parts of the proposal where that question actually bites, the answer is largely reassuring, and that deserves to be stated with the same care a criticism would get.

On transparency, the program's operation is verifiable on the same terms it would ask of others: a separate auditable account, published disbursement records, a funded independent audit, and quarterly metrics. Visibility runs toward the participant rather than being reserved to the operator. On accountability, disbursement decisions carry a published recommendation-and-review process with an Operating Group veto, which means those decisions are reasoned and checkable rather than final and unappealable. And on the durable position the program accumulates, the six return triggers and the twelve-month term bind the program by its own stated terms and cap how much standing it can build up. The asymmetries that do remain — the program holds funds, and it recommends how they are spent — are scoped by a defined mandate and milestone gates, and they are reversible through the return triggers, the term limit, and the audit. This is not a structure that entrenches itself. On its face it guards against the failure it is worried about without quietly reconstituting that failure in a new form. That affirmation is real, and this DRep does not want it lost in what follows.

## 2.2 Where the finding lives: the private-surplus claim {#2.2-where-the-finding-lives-the-private-surplus-claim}

There is a distinct test that any withdrawal drawing treasury funds into a for-profit venture has to meet, and it is worth stating carefully, because it is easy to misread as a question about tax status. It is not about whether the recipient is a company. It is about the structure of the claim being made on the shared treasury. A for-profit that maintains something the whole ecosystem depends on and can freely use — a non-rival, forkable good — has a claim rooted in the commons itself, and that claim is legitimate. A for-profit that projects growth and asks the treasury to fund it while keeping a share of the upside is making a different kind of claim, and expected-value and ecosystem-growth arguments, however sincere and however well-modeled, do not by themselves meet the bar.

Cardano PRIME does not clear that bar, and the reason is structural rather than a matter of controls. The withdrawal funds a growth *program* — turning existing infrastructure into total value locked and liquidity — rather than the maintenance of an existing non-rival good. And it carries a performance fee, a private surplus, justified expressly by the growth it projects. That is an ecosystem-growth claim with a private surplus attached to it, which is exactly the case this test is designed to catch. The program's genuine strengths — the attribution methodology, the return triggers, the funded audit — constrain *how* the surplus is taken and verified; they do not change *what* the underlying claim is.

Because the defect is a specific property of this action with a nameable fix, the honest token is **NO (remediable)** rather than an abstention. Reaching for abstention here would, in mechanical effect, lower the bar for exactly the private-surplus transfer that most warrants scrutiny — which is the opposite of what care requires. The failing structure names its own cure: a resubmission discharges the burden by tying the program's private upside to something the ecosystem keeps rather than to growth it projects — for example, converting the performance fee into a return-to-commons mechanism, or binding the upside to a durable, non-rival asset the ecosystem retains and can freely build on.

## 2.3 A second reading of the same defect: the fiduciary check {#2.3-a-second-reading-of-the-same-defect-the-fiduciary-check}

This DRep's framework deliberately reads relations rather than pricing allocations — it asks how an action treats the commons and its participants, not whether the number is a good deal. The allocation question is real and separate, and to read it this DRep runs the proposal through a distinct capital-stewardship instrument: the DRep Treasury Rule Book maintained by a peer DRep, which reads the things a relational framework by design does not — price, instrument fit, upfront exposure, and opportunity cost against everything else the treasury could fund.

Two of its readings matter here. The proposal's handling of upfront exposure is genuinely well-managed, and this is to its credit: milestone gates, the Month 4 phase gate, and the six return triggers stage the exposure over time rather than releasing 120,000,000 ada at once. But the performance-fee instrument, attached to a growth mandate, is exactly the kind of capture structure this instrument is built to flag — and no score high enough elsewhere can rescue a structure that is wrong at the level of 120,000,000 ada of finite treasury.

What is notable is that this capital-stewardship reading and the commons reading in the previous section arrive at the same conclusion from unrelated starting points — one asking about the shape of a claim on a shared resource, the other about prudent allocation of finite funds. They converge on the same feature: a private surplus resting on a growth projection. This second instrument can only ever lower a favorable judgment; it can never rescue an unfavorable one. Here it does not need to move the vote — the commons reading already reached NO — but its independent agreement, from a different foundation, both confirms the finding and sharpens the description of what a resubmission has to fix.

## 2.4 Two problems, held apart {#2.4-two-problems-held-apart}

It is worth separating the two findings cleanly, because they are not the same kind of problem and they do not have the same owner.

The sequence problem — the spend arriving before the ceiling that is supposed to authorize it — is upstream of this program and belongs to the pairing of the two actions. Cardano PRIME did not create it, and cannot fully resolve it on its own; that finding is carried in the companion rationale. The claim-structure problem — a private surplus resting on projected growth — is the program's own, and it is fixable by the program's authors without waiting on anything the ecosystem decides about the ceiling.

Held as developmental feedback rather than as a verdict, keeping these apart is the more useful message and also the fairer one. It tells the program's authors two separable things. The construction is sound, and this DRep affirms that plainly. And the part to rework is the shape of the claim — a private surplus on a growth projection — which can be reworked independently of the sequencing question entirely. Naming the two apart, rather than letting one contaminate the reading of the other, is the honest way to hold both.

# 3.0 Conclusion {#3.0-conclusion}

We vote **NO (remediable)**. The program is well-constructed, and the even-handedness it shows toward ordinary participants is real; this DRep affirms that without reservation. But the burden a for-profit withdrawal must meet is not met by an ecosystem-growth claim carrying a performance fee, and an independent capital-stewardship reading reaches the same concern from a different direction. Upstream, the withdrawal sits as the consuming half of a spend-before-ceiling pair, addressed in the companion rationale.

The remedy is specific and within reach: rework the surplus so it rests on something the commons keeps rather than on projected growth, and let the ceiling be set before the spend rather than around it. Do both, and this program earns a YES it does not currently earn.

Thank you for reading this rationale and for supporting it with your delegation.

# References / Sources {#references-sources}

The following background may help a reader new to this DRep's approach. Each is linked once, at first relevance:

- *The evaluation framework* — this DRep's standing method of judging governance actions by their long-run trajectory rather than by a single snapshot, first set out in the rationale on the Cardano Constitution. [Coordination Commons](https://styg-drep.github.io/coordination-commons/)
- *The claim a for-profit makes on the shared treasury* — the distinction between maintaining a non-rival, forkable good the ecosystem depends on and funding projected growth for a private return. [Private-Surplus Burden](https://styg-drep.github.io/coordination-commons/instruments/abstention-spines/#appendix-a-the-private-surplus-burden-as-published)
- *The DRep Treasury Rule Book* — the capital-stewardship instrument, maintained by a peer DRep, used here as the independent fiduciary check. [DRep Treasury Rule Book v17](https://docs.google.com/document/d/1ed-IkSj4tDqys3D1jDMspgIZ7O9xSmxQsMPpB_b3DXA/edit?usp=sharing)
- *Companion rationale* — the Net Change Limit Increase, the other half of this pair. [NCL](https://aqua-casual-quelea-615.mypinata.cloud/ipfs/bafybeiafguondl625epf46fuvlqf6owo6vzdcgaptonumg6ql5jyhsdvca)

DRep ID: drep1yfaq8dsam7nusdccey2x2p684f6ulhr42pv24tslv0terqs3nq50q

Stay in touch!
X: https://x.com/styg50
