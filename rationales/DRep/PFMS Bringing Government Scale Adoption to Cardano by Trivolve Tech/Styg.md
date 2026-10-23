<!-- url: https://dreptalk.com/vote-rationale/4ac28f3f92f3e5538a9f7b0b416ded19061765282377e6321e3faf16160edfde.json -->
# Styg

**Proposal:** PFMS Bringing Government Scale Adoption to Cardano by Trivolve Tech
**Vote:** No
**Voter ID:** `drep1yfaq8dsam7nusdccey2x2p684f6ulhr42pv24tslv0terqs3nq50q`

---

# **PFMS: Bringing Government Scale Adoption to Cardano — Voting Rationale**

| Governance Voting Rationale |  |
| ----- | ----- |
| GAID | gov\_action1wfy3vzxurfgq6wrpxg2qdx3t6wm7ng8xwr26h47kxa8xhd20cr5qqz0wzfc |
| Title | PFMS: Bringing Government Scale Adoption to Cardano by Trivolve Tech |
| Type of GA | Treasury Withdrawal |
| Amount | ₳9,600,000 (≈ USD 2.21 million at the proposal's planning rate of USD 0.23; expenditure capped at USD 0.30 per ada) |
| Recipient (on-chain) | `stake1uyyqmz5ae7ct4f26p4t87y2xrrgu7f3e0cpap66zgcnxu0gl7gy6y` (the Cardano Foundation as administrator) |
| Date submitted | 21 October 2026, 11:49 UTC (epoch 662\) |
| Expiration | Epoch 669 (20–25 November 2026\) |

---

# **Contents**

* 1.0 Introduction  
  * 1.1 Summary  
  * 1.2 Description of Governance Action  
* 2.0 Discussion  
  * 2.1 Method  
  * 2.2 What this proposal gets right, stated properly  
  * 2.3 The strongest case, and the seam inside it  
  * 2.4 A count the payee can set  
  * 2.5 Proof at a price  
  * 2.6 What the Treasury buys, and what stays with the state  
  * 2.7 What the Treasury gets back, in its own currency  
  * 2.8 Who sees what  
  * 2.9 What the commons retains  
  * 2.10 Why this is a No and not an abstention  
  * 2.11 Fiduciary verification (external instrument)  
  * 2.12 What would make this a Yes  
  * 2.13 What the vote does not reach  
* 3.0 Conclusion  
* Sources  
* Appendix

---

# **1.0 Introduction**

## **1.1 Summary**

We are voting **NO (remediable)** on PFMS.

This is a serious proposal from a team that has done the thing it says it can do. Trivolve's Forensic Management System has put more than 158,000 transactions on Cardano mainnet, every one of them checkable at a published address, and it is still running. The submission is the cleanest this DRep has read at this size: every document is pinned to content-addressed storage and matches the hash the chain points to, both the proposer and the administrator have signed the metadata, the Cardano Foundation holds the funds, payment is staged against milestones with on-chain evidence, and nothing reaches mainnet before penetration testing. The problem it addresses — that a police department is the only keeper of the records it later relies on in court — is real, and the proposal's own account of what its system can and cannot prove is more honest than most.

The No rests on three findings, each a property of this action and each repairable.

First, the final ₳1.8 million is paid on a transaction count, and the transaction count is set by the batching policy the recipient designs. How many transactions PFMS produces is a function of how often each source commits, not of how much evidence is secured; the policy is to be published only after the vote. The headline value claim — an eighteen per cent lift in Cardano's transaction count — inherits the same property.

Second, the revenue the proposal offers the Treasury comes from a paid, fast-tracked verification service sold to parties in criminal cases, chiefly defense counsel, priced at the operator's discretion from USD 1.89 to several hundred dollars, with seventy per cent going to the Treasury. The free route that is meant to sit beside it is not described. A commons that takes a share of what an accused person pays to check the evidence against them has a relation to that person, and the proposal does not yet say what it is.

Third, the Treasury pays the entire build, including integration with one state's own systems, while the state-specific connector work stays private, the state receives the system without paying for its construction, the recipient keeps the maintenance contract, and the open-source release arrives after sixty per cent of the funds have been disbursed. The revenue share that is meant to balance this has no stated mechanism, audit right or term beyond the administered period.

I wanted to make an educated guess at the Treasury's return and payback period, and the proposal publishes enough to do it. The short answer is that the transaction fees alone do not repay the withdrawal on any horizon worth naming — about seventy thousand ada a year reaches the Treasury from them — and that the whole of the return case rests on how many people pay for verification, at what price. On assumptions I think are reasonable, payback is around a decade, with a plausible range from four years to more than thirty. Section 2.7 sets out the arithmetic and why the number, which I do report, is not what carries this vote.

The external fiduciary instrument this DRep uses reaches No independently, on metric integrity, upfront exposure and the enforceability of the return. I would expect to vote for a corrected version of this proposal.

## **1.2 Description of Governance Action**

This Treasury Withdrawal requests ₳9,600,000 over fifteen months for Trivolve Tech, with Quixy (Vivid Minds Pvt Ltd) as subcontractor, to build the Police Force Management System. PFMS extends Trivolve's existing Forensic Management System, which secures one stage of a criminal case, to five: records that exist before a crime is reported (CCTV, bodycams, control-room calls, number-plate readers, station diaries, armory registers, calibration certificates), the investigation itself, the evidence storeroom known in India as the Malkhana, prosecution filings, and verification in court. At each point a record is created, an edge agent fingerprints it, binds the fingerprint to the device and the officer on duty, batches the fingerprints into a Merkle root, and commits the root to Cardano through stage-specific smart contracts. Only hashes, roots, registry digests and counts go on chain; records and personal data stay in the state's systems. A verification layer later checks a produced record against its stamp and returns the same evidence bundle to prosecution, defense and court. The first deployment is the Indian state of Telangana, which the proposal says has committed to paying transaction fees, infrastructure and maintenance after the build.

The budget runs across eight lines: core blockchain and identity infrastructure ₳2,688,000; stage module engineering ₳2,112,000; integration testing, load proving and handover ₳1,536,000; systems integration ₳1,152,000; edge capture ₳960,000; security testing ₳472,000; project management and audit ₳480,000; and Cardano Foundation administration ₳200,000. Payment comes in five tranches: ₳1.8 million on signing of the administrator contract, then ₳2 million at month three (record definitions, contracts on preprod, credential registry), ₳2 million at month eight (one record end to end through all six engines on preprod for three stages), ₳2 million at month twelve (penetration testing passed, contracts on mainnet, all five stages accepted, 100,000 mainnet transactions from live sources, core code released under Apache 2.0), and ₳1.8 million at month fifteen on at least 390,000 mainnet transactions over three months and the final open-source handover. An independent assurer is to be procured once the first tranche is released and must verify each milestone alongside the Foundation.

The Cardano Foundation is the named administrator, holds the funds unstaked and delegated to abstain, and will contract with Trivolve off-chain. The proposal commits to returning unspent ada, to returning any value above USD 0.30 per ada, and to returning funds on fraud or abandonment. It discloses six Project Catalyst engagements across Funds 12 and 14 totalling about ₳1.49 million, and no prior Treasury Withdrawal. It also commits the revenue from a paid verification service — 70 per cent to the Treasury, 20 per cent to maintenance of core Cardano libraries, 10 per cent to Trivolve. At ₳457.4 million enacted against the ₳500 million Net Change Limit for epochs 613 to 713, this request is about 22.5 per cent of the ₳42.6 million that remains, and it fits alongside the two other withdrawals now pending.

---

# **2.0 Discussion**

## **2.1 Method**

Every governance action gets read; not every action earns the same reading. This DRep runs each one first through an intake that assigns depth before the merits are read, then reads the merits, and selects the vote last, under a discipline whose question is not whether a vote helps something pass but whether a warrant has been derived to deploy delegated stake against it. 

This action earned the deeper reading for three reasons, none of which is its size. The first is permanence: what PFMS writes to the chain is meant never to be removed, and Cardano's association with a state's evidence apparatus would outlast any vote on it. The second is a revenue arrangement whose Treasury share is paid largely by people in criminal proceedings, which is a relationship the commons would be entering, not just a stream it would be receiving. The third is that the proposal's headline value is a transaction count — a number the governance layer itself uses to read whether Cardano is succeeding — and the size of that count is a design parameter of the recipient. Something that conditions how the ecosystem reads its own progress deserves to be read before it is installed.

## **2.2 What this proposal gets right, stated properly**

The track record is real and checkable. The FMS address the proposal publishes shows 158,791 transactions at the time of reading, at a recent pace of roughly 570 a day, which is faster than the eleven thousand a month the proposal claims. The IndianChain address shows 16,628. These are not adoption projections; they are a government system running on Cardano now, operated by the state on its own infrastructure. Very few treasury requests can point to anything comparable.

The submission is a model of procedural care. The on-chain anchor is an IPFS identifier; the metadata it resolves to matches the hash on chain, which this DRep computed; every referenced document — full proposal, summary, work packages and the governance-action PDF — is itself pinned by content identifier and matches the copies in the proposer's repository. Both Trivolve and the Cardano Foundation have signed the metadata. The withdrawal is paid to a Foundation credential delegated to abstain and unstaked from any pool, and the chain confirms that delegation. After reading two proposals this week whose terms lived at locations that could still change, this one deserves to be named as the standard.

The milestones are built against the right failure. Acceptance needs on-chain data, working artifacts and reproducible tests together, so that a report cannot carry a milestone on its own. Contracts freeze before penetration testing and nothing touches mainnet until every finding is fixed and retested. The evidence for acceptance contains only fingerprints and counts, never source records. That is careful engineering governance, and the build risk is lower than its scope suggests because the core is already running.

And the proposal is honest about the limits of what it does. It says plainly that PFMS proves a record has not changed since it was made and who made it, and that it cannot prove the original entry was true. It frames its benefits for the accused as well as the prosecution — the custodial-death footage, the weekend in the lock-up that the station diary says never happened. That is the right account of what tamper-evidence is for, and it is rarer in this genre than it should be.

## **2.3 The strongest case, and the seam inside it**

There is a case for this proposal stronger than the one it makes, and it should be stated before the findings.

This DRep's framework asks of every institution one question in particular: when it requires others to be verifiable, is its own operation verifiable on the same terms, or does transparency run total on the participant and opaque on the operator? PFMS is that question, exported. Its whole premise is that the department that creates a record should not be the only keeper of it, and that a party adverse to the state — a defense lawyer, an accused person, a family — should be able to check the state's account of itself against something the state cannot reach. That is reciprocal visibility applied to police power. On this reading the strongest thing PFMS offers is not transactions or revenue; it is a route around the state's sole custody of the truth about its own conduct, and a public ledger is exactly the kind of thing that can provide one.

That is a description, and from it I am inclined to draw a conclusion: that Cardano's commons should pay to put that route in place. The step between the two is not deductive, and it should be marked rather than smoothed. A description of what tamper-evidence does says nothing by itself about whether the Treasury, rather than the state that will use the system, should fund its construction; nor about whether a route around state custody is actually open to the people it is meant for, which depends on who can obtain the proofs, at what cost and through whose service. Everything that follows lives on the far side of that seam. The relation is worth serving. The questions are about whether this action, as written, serves it.

## **2.4 A count the payee can set**

The first finding is about what is being paid for at the end.

PFMS does not commit one transaction per record. It batches the fingerprints from each source over a window and commits a single root, and it says, correctly, that shorter windows secure evidence sooner and longer ones leave it in off-chain custody for longer. The number of transactions it produces is therefore the number of sources multiplied by how often each commits. The proposal says this itself: the transaction count is a result of the batching process, and the batching intervals are set by the state's requirements and randomised for security. The 1.53 million first-year figure, against roughly 3.2 million evidence items and 1.8 million devices, is a statement about batching cadence, not a measure of how much evidence is secured. Halve the window and the count doubles with no additional evidence protected; lengthen it and the count falls while coverage stays the same.

That is a sound engineering choice and a poor thing to pay on. The final ₳1.8 million is released on at least 390,000 transactions over three months, under a batching policy to be published at the third milestone, after the vote. The tranche is therefore gated on a quantity the recipient controls, measured under rules the electorate has not seen. The same property runs through the value claim: the eighteen per cent lift in Cardano's transaction count, the alignment with the 2030 transactions target, the language of government-scale adoption in the title. A count that can be dialled is a parameter, and paying on it installs the parameter as the definition of success — for this proposal, and for the ecosystem dashboard that will read it as adoption.

None of this suggests any intention to inflate. The repair is simple, and it uses things the proposal already measures. Pay the final tranche on coverage rather than count — the share of registered sources live and committing, evidence items stamped, custody chains unbroken, verification requests served to parties other than the operator — all of which the reconciler and verification layer already report. Publish the batching policy before the vote, or at the first milestone, with the transaction count reported as an outcome rather than a payment gate. And restate the adoption claim in the terms the strongest case uses: how many independent parties can verify a record without asking the department, and through what route.

## **2.5 Proof at a price**

The second finding is the one I would most want the proposer to read, because it is where the proposal's purpose and its revenue model pull against each other.

PFMS will sell a fast-tracked verification service to authorised parties, the proposal's examples being registered defense lawyers and the prosecution. The price starts at USD 1.89 and scales with the size of the dataset to several hundred dollars a request. Seventy per cent goes to the Treasury, twenty per cent to Cardano library maintenance, ten per cent to Trivolve. Those who do not pay can still have records checked through what the proposal calls the existing process. The service will be operated, as far as the proposal says, by the party that takes the ten per cent and sets the price.

Three things are missing, and each matters more in a criminal court than it would anywhere else. The free route is not defined: the proposal does not say whether "the existing process" means the PFMS verification layer at standard priority, or the certificate-and-testimony process the whole system exists to replace, or how long it takes, or who operates it. The proofs are not independently obtainable on the face of it: what goes on chain is a batch root, and checking a single record needs the path that links it to that root and the registry entry that confirms the officer's credential, both of which are held off chain by the operator. And the pricing is a discretion with no stated limit, set by the operator, for a service whose buyers are, in the main, people accused by the state.

The strongest case in section 2.3 was that PFMS gives a party adverse to the state a way to check the state's records without trusting the state. If that route runs through a priced service, operated by a vendor the state pays, with the faster answer going to whoever can pay more, it has not escaped the asymmetry it set out to cure; it has moved it. And the Treasury would be its principal beneficiary. Every payment that makes the return case in section 2.7 work is, mostly, a fee charged to a defendant for checking the evidence against them. The more the commons earns from this arrangement, the more access to proof is priced. That is not an argument against PFMS. It is an argument for writing down, before the vote, what the commons owes the people whose records it would anchor once it takes a share of what they pay.

The repair is within the proposer's gift. State that standard verification through the PFMS layer is free and equivalent in proof content for the accused, defense counsel and the court, with the paid tier buying speed only; publish the proof path and registry entry so that any party with the original record can verify against the chain without the operator; bound the pricing; and either exclude fees paid by the defense from the Treasury share or direct that share to funding free access. A proposal that did those things would make the strongest case its own.

## **2.6 What the Treasury buys, and what stays with the state**

The third finding concerns the boundary between the commons and the state, and it is mostly a question of instrument.

The proposal says the Treasury is not paying for software specific to or owned by one Indian state; it is paying for an open evidence layer that any jurisdiction can adopt. The core engines, contracts, registry, verification layer, batch format and test vectors are to be released under Apache 2.0, and that is a real public asset. But the budget also funds integration with this state's systems — ₳1,152,000 for systems integration, and stage modules that the proposal describes as adapting the forensic engine to Telangana's own laboratory network, forensic vans and CCTNS instance — and the connector configurations that describe the state's police systems are to be kept private. Some of what the Treasury pays for would therefore not be released to the commons. The state, which is the system's user, pays nothing towards its construction; the recipient receives the maintenance contract under a separate agreement with the state; and the open-source release arrives at month twelve, after ₳5.8 million — sixty per cent — has been disbursed.

Governments ordinarily pay to build the systems they run. What the Treasury is buying here is that this system runs on Cardano and that its core is open, and those are both worth buying. But the price of the first is not the price of a full state build, and the second should be visible before most of the money has moved. The revenue share that is meant to return value to the commons has no stated mechanism — no on-chain treasury donation route, no named recipient for the twenty per cent, no audit right over the revenue, no definition of gross or net, and no term beyond the administered period. The proposal records each paid request on chain with its price tier, which is a good start, but a stamp is self-reported and the commitment would be enforceable, if at all, only through a contract the electorate has not seen and whose life is fifteen months.

The repair: separate the generic core from state-specific integration and say who pays for each, with the state or a co-funder carrying the state-specific share or that work released too; publish the core repository as it is built, at least from the second milestone; and write the revenue share into the administrator's contract with an on-chain payment route, audit rights, a defined revenue base and a term that outlasts the build.

## **2.7 What the Treasury gets back, in its own currency**

The proposal argues in terms of transactions and revenue, and I wanted to test that argument on its own terms by estimating the Treasury's return and how long the Treasury would take to recover what it lends. The proposal publishes enough to do this. The arithmetic below uses only its own figures, the chain's current parameters, and measured fees from its existing deployment; the model is in the appendix.

There are two ways money comes back. The first is transaction fees. PFMS commits pay ordinary Cardano fees, which the state is to fund. Fees go to the reward pot, of which the Treasury receives twenty per cent under the current treasury growth rate; the rest goes to pools and delegators. FMS transactions currently cost about 0.23 ada each. At the proposal's floor of 1.53 million transactions a year, PFMS would generate about ₳347,000 in fees, of which about **₳69,000 a year** reaches the Treasury. At that rate the withdrawal would take about 138 years to repay. Even assuming the volume grows by a quarter every year without stopping, recovery takes about sixteen years, and by then PFMS alone would be committing more transactions a year than the whole network commits today. If the system spreads across many states and volume doubles every year, the fee channel repays in about six years — but that is a scenario for the national roll-out the proposal hopes for, not the one it funds. The fee channel is real, and it is not where the return is.

The second is the verification revenue, and here the answer depends almost entirely on one number the proposal does not estimate: how many paid verifications there will be, and at what average price. The table sets out what the return looks like under a range of assumptions, anchored to the proposal's own figure of about 3.2 million evidence items a year in the first deployment, and counted from the vote, with go-live a year later and the first year at half pace.

| Paid verifications a year | Average price | Treasury inflow a year (ada at USD 0.23) | Payback from the vote |
| ----- | ----- | ----- | ----- |
| None (fees only) | — | \~₳69,000 | \~138 years |
| 16,000 (0.5% of evidence items) | USD 10 | \~₳556,000 | \~19 years |
| 32,000 (1%) | USD 10 | \~₳1.04 million | **\~11 years** |
| 64,000 (2%) | USD 10 | \~₳2.0 million | \~6 years |
| 64,000 (2%) | USD 20 | \~₳4.0 million | \~4 years |
| 160,000 (5%) | USD 20 | \~₳9.8 million | \~2.5 years |

My educated guess is the middle row: about one per cent of the year's evidence items going through paid verification at an average of ten dollars, which returns roughly ₳1 million a year and repays the withdrawal in around eleven years from the vote. A reasonable range is four to thirty years, and the short end of that range needs about four times the verification revenue of the middle. Put plainly, the Treasury recovers its ada within a decade only if paid verification becomes routine in the state's criminal process. Two things push the other way. If ada rises against the dollar, the ada payback lengthens, because the revenue is earned in dollars; at fifty cents the central case takes about twenty years, though the Treasury recovers the same dollar value. And none of this counts what the proposal hopes for most — further states adopting the open core without another withdrawal — which would add fee and verification revenue that this model leaves out, and which I do not count because it is not what this action funds.

Three cautions belong with the number, and they are why it does not carry the vote. First, it rests on demand for which the proposal offers no evidence — no pilot data from FMS on verification requests, no survey of defense practice, no comparison with what courts now spend on authentication. Second, the revenue share it depends on is not yet enforceable after the build (section 2.6), so the realistic return is the enforceable one, which today is the fee channel. Third, and most important, the return and the relation the proposal serves partly move in opposite directions: the scenarios that repay the Treasury fastest are the ones in which the most accused people pay the most to check the evidence against them (section 2.5). A fast payback would therefore be evidence about the price of proof as much as about the value of the system. This DRep's framework declines to let a number stand in for that judgment, and the number here, worked through honestly, makes the point by itself: measured in its own currency, the quantity case does not carry the proposal. The relation does, or it does not, and that is what the rest of this rationale reads.

## **2.8 Who sees what**

Four shorter readings sit beside the findings. None carries the vote; each sharpens the specification.

The central fact on which the value of the withdrawal depends — that Telangana has committed to deploy PFMS, pay its fees and infrastructure and maintain it — is in agreements the proposal says are confidential and have been reviewed by the Cardano Foundation. I do not doubt the Foundation's review. But the electorate is being asked to rely on a commitment it cannot see, attested by a party that also co-signed the proposal, will hold the funds, will contract with the recipient, and will accept the milestones. The Foundation can publish a short attestation of the commitment's material terms — the parties, the scope of the deployment, who pays for what, and the term — without disclosing anything confidential. That would turn reliance into verification.

The independent assurer sits inside the recipient's own work package and is procured after the first tranche has been released. Publishing the shortlist and the conflict confirmation is good practice; the assurer would be more independent if the administrator contracted it directly and before any money moved.

The first tranche, ₳1.8 million or nearly nineteen per cent of the total, is released on signature of the administrator contract, before the assurer exists and before any deliverable. For a request this size, that is a larger advance than the commons should carry without a reason stated for it.

And a small point of verification. The proposal describes the Foundation's receiving address as a multi-signature wallet, and the stake credential it pays to is the one the Foundation uses for governance deposit returns. On chain it is a key credential rather than a script, so any multi-signature control is enforced off chain and is not visible to a reader. That is very likely institutional custody working as intended, and the delegation to abstain is confirmed on chain, but this needs to be confirmed. Earlier withdrawals the Foundation administered were paid to a script credential, so the difference is worth a sentence from the administrator.

## **2.9 What the commons retains**

Treasury funds may maintain commons relations; they may not transfer a private surplus. The test is the structure of the claim, not the recipient's status.

There is a surplus here and it should be named without color. It is partly private — the maintenance contract, ten per cent of verification revenue, and the position of sole maintainer of a system the proposal hopes will reach thirty-six states. It is also public but not the commons': a state government receives the construction of a system it will run, and that is a surplus transferred to a public body that is not Cardano. Neither is improper. Both put the burden on the proposal to show what relation of the commons is maintained.

The proposal's own answer comes in two registers. In one, the value is a quantity: transactions, a percentage lift, revenue figures, alignment with a numeric target. That register does not discharge the burden, and section 2.7 shows it would not discharge it on its own terms either. In the other, the value is a relation: a forkable evidence layer the commons keeps, and a route by which a party adverse to the state can check the state's record against something the state cannot change. That register is the right one, and it is stated — but its key terms are missing. The core arrives late, part of the funded work stays private, and the route for the adverse party runs through a paid service whose free alternative is undefined. So the burden is partly discharged and partly attempted in quantities, and the translation the framework asks for is the one sections 2.4 to 2.6 already specify. That places this where a No that specifies is owed, not where an honest disagreement at the margin would call for standing aside.

## **2.10 Why this is a No and not an abstention**

Three grounds for abstaining were live and each is foreclosed.

The first ground was that the ballot might not carry the findings. Some of what this reading surfaced cannot be carried by any single vote, and section 2.13 records it. But the three findings that carry this token — a final tranche gated on a count the recipient sets, a paid verification route whose free alternative is undefined with the Treasury as its principal beneficiary, and a funded scope part of which stays private with a revenue share that cannot yet be enforced — are properties of this action and fixable in it.

The second is that this could fall outside what this DRep's framework reads. It does not, though it presses on the framework's edge, and that should be said. The rights this framework protects are those of Cardano's participants, and the people whose records PFMS would anchor are not, in the main, participants. What brings them within reach is the revenue share: once the commons takes seventy per cent of what an accused person pays to verify the evidence against them, that person stands to the commons in a relation of payment, and the framework's tests on tolls and access apply to them. Whether the commons owes anything to those whose records it anchors when it takes nothing from them is a harder question, and it is carried to the trajectory log rather than settled here.

The third is the unverifiable state commitment, which the external rulebook would treat as a ground for abstaining where a fair Yes or No is unreliable. Here it is not: the No rests on findings that do not depend on the confidential agreement, and the confidential agreement can be made verifiable by attestation.

What pulled hardest the other way should be said. The team has delivered, the chain shows it, the submission is exemplary, and the problem is one of the few where a public ledger's particular property — that nobody inside the institution can reach it — is the whole point. Saying no to an applicant who has done this much right has a cost. It is why each finding is written as a repair.

## **2.11 Fiduciary verification (external instrument)**

This DRep's framework reads the relational and structural question and by design does not read the capital-allocation one. Leaving that region unexamined would raise vigilance rather than lower it, so the proposal was run through the DRep Treasury Rule Book v17 as a subordinate gate, one that can lower a merits-Yes but cannot raise a merits-No.

By economic substance this is open infrastructure built by a firm that will earn recurring revenue from its deployment, which the rulebook reads on its commercial, hybrid and infrastructure scorecard under hybrid treatment. Nominally it is a very large request, and it uses more than a fifth of what remains of the current spending limit. The preflight passes cleanly: immutable references, author signatures, a named administrator with a contract, custody delegated to abstain, the limit respected. Several hard gates do not. Metric integrity fails, because the final payment rests on a count the recipient's own batching policy determines. Upfront exposure exceeds the rulebook's normal ceiling for a request this size. The Treasury-return case rests on a revenue share that is at the evidence level of assertion — a stated intention with no demand evidence and no enforcement mechanism — and the mixed-proposal rule is not met, because the state-specific work and its private outputs are not separated from the public core. Budget clarity is partial: the lines are itemised by component but carry no roles, rates or benchmarks. Against that, the track record, the custody, the preflight and the build discipline score strongly, and at about USD 2.2 million for this scope the price is, if anything, low for what is promised — the risk is breadth, not inflation.

So this is convergence at the conclusion. A rights-derived reading and a capital-stewardship rulebook reach No from opposite directions and meet at the same three places: what the final payment rewards, what the Treasury's return actually is, and what the commons keeps. Had the gate come back clean, the relational No would have stood; had the relational reading passed and the gate failed, the allocation defect would have been dispositive. Its use here is to sharpen the specification.

## **2.12 What would make this a Yes**

Pay on coverage, not count. Gate the final tranche on sources live and committing, evidence items stamped, unbroken custody chains and verification requests served to parties other than the operator. Publish the batching policy before the vote or at the first milestone, and report transaction counts as outcomes.

Make the route to proof free and open. State that standard PFMS verification is free and equivalent in proof content for the accused, defense and court, with any paid tier buying speed only; publish proof paths and registry entries so that anyone holding the original record can verify against the chain without the operator; bound the pricing; and either exclude defense-paid fees from the Treasury share or direct that share to funding free access.

Draw the line between core and state. Separate the generic core from state-specific integration and say who pays for each; release whatever the Treasury pays for. Publish the core repository as it is built, from the second milestone at the latest.

Make the return real. Write the revenue share into the administrator's contract with an on-chain payment route, a named recipient and process for the library-maintenance share, a defined revenue base, audit rights, and a term that outlasts the build.

Let the electorate see what it relies on. Have the Foundation publish an attestation of the material terms of the state commitment; have the administrator contract the assurer before any tranche moves; reduce the signing tranche or tie part of it to the first deliverable; and have the administrator confirm in a sentence how the receiving credential's multi-signature control works.

Do those, and this becomes a proposal this DRep would expect to vote for.

## **2.13 What the vote does not reach**

A vote is a snapshot; the log is the trajectory. Several tensions this proposal makes visible are held here rather than converted into this vote.

The first is between integrity and truth. PFMS proves a record has not changed, not that it was true, and the proposal says so. But a stamped record carries an authority in court that an unstamped one does not, and a machine-made record of a number plate at a place and time already reads as objective. The risk is that verifiability is read as veracity, and that the system's undoubted protection for honest records becomes a presumption for every record that bears a stamp, including those that were false when made. How courts come to treat a PFMS stamp is outside any vote, and it is the question on which the system's net effect on justice will turn.

The second is what the commons owes those whose records it anchors. Cardano's framework protects its participants. PFMS would make the chain the external memory of a state's police apparatus — CCTV, number plates, armories, statements — for millions of people who never chose to participate in Cardano. While the commons takes nothing from them, its obligations to them are unclear; once it takes a share of what they pay, they are clearer (section 2.10). Whether the commons owes non-participants something merely by anchoring records about them is unsettled, and is a candidate for corpus work rather than a vote.

The third is the Treasury as a funder of public-sector procurement. A state that can have its system built by the Cardano Treasury in exchange for choosing Cardano has a reason to choose Cardano, and the next state will ask for the same. That may be a sound adoption strategy. It is also a precedent for the commons paying construction costs that governments ordinarily carry, and the line between buying chain choice and buying a state's IT is one the ecosystem has not drawn.

The fourth is the transaction count as the ecosystem's sense of itself. The 2030 targets read transactions as adoption. A single deployment able to move that figure by double digits through a batching setting shows how easily the measure can be supplied rather than earned. This is not a criticism of PFMS, whose batching is honest engineering; it is a reading of the instrument, and a candidate for a future proposal — that any Treasury-funded deployment reporting transaction counts also report what those transactions secure.

Three smaller readings belong beside these. The claim that verification will cut case resolution time by about thirty per cent is unsourced, and the kind of figure that hardens through repetition. The proposal's title promises government-scale adoption while the funded scope is one state; the distance between name and scope is aspirational rather than misleading, and is tracked across proposals. And the questions this DRep's intake asks that no proposal template yet asks — what reverses this if it is wrong in eighteen months, what reads through it, what would register its degradation — went unanswered because they were never put.

---

# **3.0 Conclusion**

We are voting **NO (remediable)**.

The team has shown on chain that it can build and run government systems on Cardano, the submission is a model of how a large request should be made, and the strongest case for PFMS — a route by which those adverse to the state can check the state's records against something the state cannot reach — is one this DRep's framework exists to value. The refusal is of three structures: a final payment on a count the recipient's own batching determines; a route to proof that runs through a priced service, with the Treasury as its principal beneficiary and the free alternative undefined; and a funded scope part of which stays private, released late, with a return that cannot yet be enforced.

Worked through in its own currency, the Treasury's return is modest by the fee channel and uncertain by the verification channel, with payback most plausibly around a decade — and the faster scenarios are the ones in which proof costs the most. That is why the number, which this rationale reports, is not what decides it.

Each finding is repairable, most of them in the drafting. Pay on coverage, make the route to proof free and open, draw the line between core and state, make the return enforceable, and let the electorate see what it is relying on. That is the whole specification.

Beyond this action, I will carry forward what it makes visible: how courts come to read a stamp, what the commons owes those whose records it anchors, the Treasury's growing role in funding public-sector builds, and an ecosystem measuring itself by a count that can be supplied. This DRep will continue to maintain a state of inquiry around them.

DRep ID: drep1yfaq8dsam7nusdccey2x2p684f6ulhr42pv24tslv0terqs3nq50q DRep Profile: [https\://styg-drep.github.io/coordination-commons/](https://styg-drep.github.io/coordination-commons/)

My thanks to the delegators who make this reading possible, and to Trivolve Tech, Quixy and the Cardano Foundation for a proposal whose care in construction made a careful reading possible.

Stay in touch. X: [https\://x.com/styg50](https://x.com/styg50)

---

# **Sources**

On-chain and IPFS material read on 22 October 2026 (epoch 663).

* Governance action record, anchor, recipient, deposit return and epochs: Koios `proposal_list` (gov\_action1wfy3vz…0wzfc; tx `72491608…c0e8`).  
* Anchor metadata: `ipfs://QmQJM9FmVs1HHeqz4PBEhizicsuXEp3VkdEMjqApG7KsBT` via [ipfs.blockfrost.dev](https://ipfs.blockfrost.dev/ipfs/QmQJM9FmVs1HHeqz4PBEhizicsuXEp3VkdEMjqApG7KsBT); blake2b-256 computed and matched to the on-chain hash `09e2ef6f…e389`.  
* Proposal documents: [Trivolvetech-PFMS/pfms-proposal](https://github.com/Trivolvetech-PFMS/pfms-proposal) (commit `4b5bfc8`); full proposal (`QmWaoh…GVF`, hash `d0dde6fe…7234`), summary (`QmUgHJ…4jb`, `43fddc16…993c`) and work packages (`QmYjjN…m8F2`, `ff318590…56a9`) each matched across IPFS and the repository.  
* Deployment track record: Koios `address_txs` for the FMS address (`addr1wynrwz69…k7wqr`, 158,791 transactions) and the IndianChain address (`addr1w99se2k9…m4czv`, 16,628); fees from Koios `tx_info` on a 40-transaction sample.  
* Net Change Limit, treasury parameters and network fees: Koios `proposal_list` (enacted withdrawals epochs 613+), `epoch_params` (τ \= 0.2), `epoch_info` (epoch 662).  
* Background on FMS: [Cardano Foundation Monthly Update, June 2026](https://cardanofoundation.org/blog/june-2026-activities); [Digital Journal, October 2025](https://www.digitaljournal.com/pr/news/binary-news-network/trivolve-tech-quixy-launch-1988728441.html).  
* Return model: `pfms_roi_model.py` (appendix).

---

# Appendix: Return model 

**Inflow channels.** (1) Fees: transactions × mean fee × τ. τ \= 0.2 (epoch 663). Mean FMS fee 0.227 ada (40-tx sample, epochs 662–663; mean size 1,502 bytes); network mean 0.350 ada/tx (epoch 662: 156,063 tx, ₳54,577 fees). (2) Verification: requests × USD price × 0.70 ÷ ADA/USD. Ask ₳9.6M. No discount rate (Treasury ada earns nothing idle; nominal ada payback). Go-live at month 12; verification at 50% in operating year 1\.

| Scenario | Treasury inflow, yr 1 | 5-yr cumulative | Payback |
| ----- | ----- | ----- | ----- |
| Fees only, 1.53M tx/yr flat | ₳69,462 | ₳347k | \~138 yrs |
| Fees only, \+25%/yr compounding | ₳69,462 | ₳570k | \~16 yrs (requires \~43M PFMS tx/yr by then — \~4× today's whole network) |
| Fees only, ×2/yr multi-state, 0.35 ada/tx | ₳107,100 | ₳3.32M | \~6.4 yrs |
| \+ 16k paid verifications/yr (0.5% of items) @ USD 10 | \~₳556k steady | — | \~19 yrs |
| \+ 32k (1%) @ USD 10 — **central** | \~₳1.04M steady | — | **\~11 yrs** |
| \+ 32k (1%) @ USD 10, ADA USD 0.50 | \~₳517k steady | — | \~20 yrs |
| \+ 64k (2%) @ USD 20 | \~₳3.97M steady | — | \~4 yrs |
| \+ 160k (5%) @ USD 20 | \~₳9.81M steady | — | \~2.5 yrs |

**Break-even (5-year payback, fees flat at floor):** \~322k requests/yr at USD 1.89; \~122k at USD 5; \~61k at USD 10; \~30k at USD 20; \~12k at USD 50 (ADA USD 0.23); roughly double each at ADA USD 0.50.

**Reading.** The fee channel does not repay. Payback is a function of one unestimated variable (paid-verification demand × price) whose realisation is (a) unevidenced, (b) operator-priced, (c) unenforced post-term, (d) charged predominantly to the accused. Rigor on the model raises vigilance (anti-tuning): a precise payback is precise about the price of proof. The model is evidence for the fiduciary gate, not a substitute for judgment, and selects nothing.
