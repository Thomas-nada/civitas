<!-- url: https://dreptalk.com/vote-rationale/268cbbf388160a5ca053487aac44055c983c68581709c4be003551d1081501b1.json -->
# Styg

**Proposal:** Scalus 2026 Maintenance, Dijkstra Readiness, Interoperability & Application Runt
**Vote:** Yes
**Voter ID:** `drep1yfaq8dsam7nusdccey2x2p684f6ulhr42pv24tslv0terqs3nq50q`

---

# Scalus 2026 — Treasury Withdrawal (₳2,464,844) — Voting Rationale

| Governance Voting Rationale |  |
| ----- | :---- |
| GAID | gov_action1xg69v73lfzkwyhhuz583x6geyc2ewn3r96sxuqj3wqvrrk0yfpksqqa63yc |
| Title | Scalus 2026: Maintenance, Dijkstra Readiness, Interoperability & Application Runtime (Lantr Engineering) |
| Type of GA | Treasury Withdrawals |
| Date submitted | Epoch 640 (Jun 29, 2026) |
| Expiration Date | Epoch 647 (Aug 2, 2026) |

# Contents

- [1.0 Introduction](#1.0-introduction)
  - [1.1 Summary](#1.1-summary)
  - [1.2 Description of Governance Action](#1.2-description-of-governance-action)
- [2.0 Discussion](#2.0-discussion)
  - [2.1 The question a for-profit treasury request has to answer](#2.1-the-question-a-for-profit-treasury-request-has-to-answer)
  - [2.2 Why this reads as a low-scrutiny proposal — and why that is the right reading](#2.2-why-this-reads-as-a-low-scrutiny-proposal)
  - [2.3 The construction, and the money it asks for](#2.3-the-construction-and-the-money-it-asks-for)
  - [2.4 What the vote does not reach](#2.4-what-the-vote-does-not-reach)
- [3.0 Conclusion](#3.0-conclusion)
- [References / Sources](#references-sources)

# 1.0 Introduction {#1.0-introduction}

## 1.1 Summary {#1.1-summary}

We are voting **YES** on the Scalus 2026 treasury withdrawal — ₳2,464,844 over nine months to Lantr Engineering, to maintain the Scalus development platform, ready it for the Dijkstra hard fork, deepen its reuse across the JVM and JavaScript stacks, and ship a scoped first step toward an application runtime.

The reason is straightforward, and its being straightforward is the point. Scalus is open-source infrastructure the ecosystem already depends on — directly, in the protocols built on it, and indirectly, through its components embedded in tooling many teams use every day (MeshJS, Lucid Evolution, Evolution SDK, the Cardano Client Lib, Yaci). Keeping a shared, freely forkable good like that maintained and current through a protocol transition is close to the clearest case there is for what the treasury exists to fund.

There is a test this DRep applies to any treasury request from a for-profit entity, and it is worth naming because Lantr is one: a for-profit drawing treasury funds has to show its claim rests on maintaining something the whole ecosystem depends on and can freely use, not on growth it projects while keeping the upside. Scalus meets that test plainly — the good is a non-rival public asset under an open licence, and the ask funds the effort to maintain and extend it, with no private-surplus mechanism attached. The construction around the money is sound, the amount is modest, the exposure is staged, and the whole thing reverses simply by not being renewed. This is a proposal with little that could go wrong unseen, and that is exactly what a low-scrutiny reading means. The one thing worth carrying forward is not an objection but a note for future cycles, set out at the end.

## 1.2 Description of Governance Action {#1.2-description-of-governance-action}

This Treasury Withdrawals action requests ₳2,464,844 (about $394,375 at the proposal's $0.16/ADA reference rate) for nine months of milestone-based work, July 2026 through March 2027, with no contingency. Lantr Engineering is the sole vendor. The work spans three lines beyond continuous maintenance: readiness for the Dijkstra hard fork (Plutus V4, nested transactions, accounts, and the associated ledger and tooling changes), interoperability improvements across the JVM and JS/TS ecosystems, and a bounded first release of an application runtime, validated through reference applications and early users.

The funds are held and released through the audited SundaeSwap treasury-contracts framework, with milestone-based vesting, an independent oversight board (members from Blink Labs, the Cardano Foundation, and IOG) that co-signs disbursements and can pause or halt funding, third-party technical assurance from No.Witness Labs, and an independent financial audit. Escrowed funds are set to auto-abstain in governance and cannot be delegated to a stake pool, and anything unspent at expiry sweeps back to the treasury automatically. The proposal is a reduced resubmission of an earlier, larger Scalus proposal (₳8.5M over twelve months), rescoped to answer the scale concerns raised in that vote. It discloses prior funding — earlier Catalyst awards and a 2025 treasury grant of ₳657,692 — and sits within the current 350M net-change limit at submission.

# 2.0 Discussion {#2.0-discussion}

## 2.1 The question a for-profit treasury request has to answer {#2.1-the-question-a-for-profit-treasury-request-has-to-answer}

The treasury is a shared resource, held in trust for the whole ecosystem, and a for-profit company asking to draw from it raises a fair question about the shape of the claim. This DRep states that question as a standing test, published so it is applied the same way every time: the question is not whether the recipient is a company — it is whether the thing being funded is the maintenance of something the ecosystem collectively depends on and can freely use, or the funding of a private venture that keeps its own upside. The first is a claim rooted in the commons. The second is not, and arguments from projected growth do not convert one into the other.

Scalus discharges that test about as cleanly as a for-profit request can. The good is open-source under Apache 2.0 — non-rival, freely usable, and forkable, so nothing here is enclosed or made exclusive. Its degradation would be felt across the ecosystem precisely because so much tooling embeds its components, which is the mark of a genuine commons relation rather than a private one. And the ask carries no private-surplus instrument: no performance fee, no equity, no revenue share. The funding buys engineering effort, priced as effort, against a public asset the ecosystem keeps regardless of how Lantr fares commercially. That the same team also builds commercial products on top of Scalus does not change this — the platform itself remains the shared, forkable good, and the treasury is paying to maintain that good, not to underwrite the products. This is worth saying with some care because the contrast is real: a request that asked the treasury to fund growth while routing the resulting upside to a private party would be a different proposal facing a much harder question. This one does not.

## 2.2 Why this reads as a low-scrutiny proposal — and why that is the right reading {#2.2-why-this-reads-as-a-low-scrutiny-proposal}

This DRep sorts every action before reading its merits, to decide how much scrutiny it earns — the goal being to spend the most attention where the most could go wrong without announcing itself. Scalus earns a light reading, and it is worth being explicit that "light" is a description of risk surface, not of quality. A few things account for it. This is a single, self-contained decision, not one half of a pair of actions arranged so the real commitment lands where scrutiny is lowest — a maneuver this DRep watches for, and which is simply absent here. It tunes a spend within the existing rules rather than changing any structural constraint or installing a standing default. If it proves a poor use of funds in eighteen months, reversing it costs nothing more than declining to renew: the term ends on its own, unspent funds return automatically, and because the code is open-source and forkable, the ecosystem keeps everything already built and no party is left holding leverage against the reversal. And if the work degraded, the degradation would show up loudly through ordinary channels — public repositories, releases, download counts, conformance tests, third-party assurance, and the many dependent projects that would notice breakage first.

None of those readings requires trust in the proposer; they are properties of the action's structure, and they are the reason this proposal does not need the deeper machinery this DRep reserves for actions that can fail quietly or irreversibly. Most sound proposals read this way. A framework that manufactured suspicion here would be miscalibrated, and part of what this reading is for is to say plainly when there is little to contest.

## 2.3 The construction, and the money it asks for {#2.3-the-construction-and-the-money-it-asks-for}

This DRep's framework reads relations rather than pricing allocations, so the question of whether ₳2,464,844 is well spent — the right amount, the right instrument, a good use of finite treasury against everything else it could fund — is read through a separate capital-stewardship instrument maintained by a peer DRep. For open-source infrastructure, that instrument treats the continuity of the public asset itself as the principal return to the treasury, which is the right frame for what this is.

On that reading the proposal is in good order. The amount is modest — roughly on par, in dollar terms, with the single 2025 grant, and a substantial reduction from the earlier version. The exposure is staged rather than released at once: milestone vesting, a board that must co-sign disbursements and any one of whose members can pause a milestone, and an automatic sweep of anything unused. The delivery record is real — every milestone of the 2025 cycle was delivered on time, with additional work beyond the committed scope. The ADA pricing is honest: the $0.16 reference rate sits slightly below the current market price of around $0.17, and the proposal commits to hedging into stable assets on receipt, a direct and candid response to the roughly fifty-percent purchasing-power loss the 2025 grant suffered as ADA fell during that delivery window. Most importantly for a capital-stewardship read, there is no private-capture structure for the instrument to flag — no upside routed away from the commons. The allocation reading concurs with the vote; it finds nothing that should lower it.

## 2.4 What the vote does not reach {#2.4-what-the-vote-does-not-reach}

A few observations belong in this DRep's longer-run record rather than in the vote, because they are about trajectory across cycles rather than about this action, which is sound.

The first concerns the application runtime. It is the one workstream that reaches beyond maintaining what already exists toward building something new, and while it is bounded, open-source, and validated with real teams this cycle, it is the part most worth watching over time. An application runtime that the ecosystem comes to build on could, in a few cycles, become infrastructure whose health the ecosystem reads *through* — at which point a future Scalus proposal would earn a deeper look than this one does. That is a note for the next reading, not a reservation on this one.

The second is about recurring funding generally. This is the second Scalus treasury withdrawal in twenty-four months, and a maintainer the ecosystem depends on can, over enough cycles, drift from being funded because it earns each round toward being funded because too much now depends on it to stop. The thing that keeps that exit genuinely open is the forkability of the code, and the honest discipline is to re-read at each renewal whether that exit is still real. Today it plainly is.

The last is not about Scalus at all. The proposal's own retrospective describes a treasury process where a bundled budgeting path stretched five to six months from proposal to first payment, offered no protection against ADA's decline, and carried standing governance risk in the bundling itself — enough that this proposer, like others before it, chose to submit independently and on-chain instead. That teams capable of maintaining critical infrastructure are routing around the coordinated process is a signal about the process worth tracking on its own, separately from any single vote.

# 3.0 Conclusion {#3.0-conclusion}

We vote **YES**. Scalus is public infrastructure the ecosystem already relies on, the request maintains and extends it as a freely forkable common good, and the for-profit test that a treasury request of this kind must meet is met plainly — the claim rests on a maintained commons relation, not on a private surplus. The construction is sound, the amount modest, the exposure staged, the delivery record demonstrated, and the whole action reverses by simply not being renewed.

The framework's work here was not to find fault but to confirm that the burden is discharged and the risk surface is genuinely shallow, and to say so without manufacturing scrutiny the action does not warrant. The one thing carried forward is a matter for future cycles rather than this vote: to re-read, as the runtime grows and the funding recurs, whether the ecosystem's exit from this dependency stays as open as the code's licence currently keeps it.

Thank you for reading this rationale and for supporting it with your delegation. And the work continues...

# References / Sources {#references-sources}

The following background may help a reader new to this DRep's approach:

- *The evaluation framework* — this DRep's standing method of judging governance actions by their long-run trajectory and their risk of failing unseen, rather than by a single snapshot, first set out in the rationale on the Cardano Constitution. [Coordination Commons](https://styg-drep.github.io/coordination-commons/)
- *The claim a for-profit makes on the shared treasury* — the published test distinguishing the maintenance of a non-rival, forkable good the ecosystem depends on from the funding of a private surplus. [Private-Surplus Burden](https://styg-drep.github.io/coordination-commons/instruments/abstention-spines/#appendix-a-the-private-surplus-burden-as-published)
- *The DRep Treasury Rule Book* — the capital-stewardship instrument, maintained by a peer DRep, used here as the allocation check. [DREP Treasury Rulebook v17](https://docs.google.com/document/d/1ed-IkSj4tDqys3D1jDMspgIZ7O9xSmxQsMPpB_b3DXA/edit?tab=t.0)

DRep ID: drep1yfaq8dsam7nusdccey2x2p684f6ulhr42pv24tslv0terqs3nq50q

Stay in touch!
X: https://x.com/styg50

---
