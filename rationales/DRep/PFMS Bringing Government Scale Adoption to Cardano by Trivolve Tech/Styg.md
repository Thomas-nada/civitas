<!-- url: https://dreptalk.com/vote-rationale/ff65cf4c9fb45a916ad757ead4a45f81cc9e438dc200e27feb34fb106fa187cd.json -->
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

*Revision 1\. The token is unchanged. This revision adds a section on what kind of system PFMS is, and why the answer decides who should pay and what kind of ledger it needs (§2.3). It recasts the verification finding as the hinge on which the funding question turns (§2.6), adds a fourth finding on what the state commits in return and whether the anchoring can leave a public ledger (§2.8), and makes the return estimate conditional on the state staying (§2.9). It also rewrites the specification so that it doubles as an oversight checklist if the action is enacted without it (§2.14). The changes were prompted by the public discussion after the first rationale and by the votes cast since; §2.15 and appendix A.2 record both.*

---

# **Contents**

* 1.0 Introduction  
  * 1.1 Summary  
  * 1.2 Description of Governance Action  
* 2.0 Discussion  
  * 2.1 Method  
  * 2.2 What this proposal gets right, stated properly  
  * 2.3 What PFMS is, and why the answer decides who pays and which ledger  
  * 2.4 The strongest case, and the seam inside it  
  * 2.5 A count the payee can set  
  * 2.6 Proof at a price: the hinge  
  * 2.7 What the Treasury buys, and what stays with the state  
  * 2.8 What the state owes, and where the anchoring can go  
  * 2.9 What the Treasury gets back, in its own currency  
  * 2.10 Who sees what  
  * 2.11 What the commons retains  
  * 2.12 Why this is a No and not an abstention  
  * 2.13 Fiduciary verification (external instrument)  
  * 2.14 What would make this a Yes, and what to watch if it passes without it  
  * 2.15 What the vote does not reach  
* 3.0 Conclusion  

---

# **1.0 Introduction**

## **1.1 Summary**

We are voting **NO (remediable)** on PFMS.

This is a serious proposal from a team that has done the thing it says it can do. Trivolve's Forensic Management System has put more than 158,000 transactions on Cardano mainnet, every one of them checkable at a published address, and it is still running. The submission is the cleanest this DRep has read at this size. Every document is pinned to content-addressed storage and matches the hash the chain points to, both the proposer and the administrator have signed the metadata, and the Cardano Foundation holds the funds. Payment is staged against milestones with on-chain evidence, and nothing reaches mainnet before penetration testing. The problem it addresses — that a police department is the only keeper of the records it later relies on in court — is real, and the proposal's own account of what its system can and cannot prove is more honest than most.

Most of the No votes cast on this action rest on two claims: that the government should pay to build the system, not just to use it, and that PFMS is "record-keeping", a category that has not produced on-chain activity before and that any chain could host. I share the conclusion and not the reasons. Both claims read PFMS as a service *to* the state. Read as specified, it is an accountability protocol aimed at the party that keeps the records. It proves not only that a record existed, but that a record which should exist does not, that the person who made it was authorised at the time, and that custody followed the rules. A public commons funding a check on state power is close to the textbook case for commons funding, because the institution least likely to pay to be checked is the one being checked. Whether PFMS is that check, or a tool of the state with a public timestamp attached, turns on one thing: whether people adverse to the state can verify a record without going through the state's vendor. As written, they cannot. That is the hinge of this rationale.

The No rests on four findings, each a property of this action and each repairable.

First, the final ₳1.8 million is paid on a transaction count, and the transaction count is set by the batching policy the recipient designs. How many transactions PFMS produces depends on how often each source commits, not on how much evidence is secured, and the policy is to be published only after the vote. The headline value claim — an eighteen per cent lift in Cardano's transaction count — inherits the same property.

Second, and decisively, the route by which those adverse to the state would check its records runs through the operator. The proofs needed to check a single record against the chain are held off chain by the operator. The fast route is a paid service sold mainly to defense counsel, priced at the operator's discretion from USD 1.89 to several hundred dollars, with seventy per cent going to the Treasury. The free route beside it is not described.

Third, the Treasury pays for the entire build, including integration with one state's own systems, while the state-specific connector work stays private, the recipient keeps the maintenance contract, and the open-source release arrives after sixty per cent of the funds have been disbursed. The revenue share meant to balance this has no stated mechanism, audit right or term beyond the administered period.

Fourth, nothing in the proposal binds the state in return. The open core the Treasury pays for — which the proposal presents as removing the state's lock-in to its vendor — removes its lock-in to Cardano as well. After the final milestone, nothing requires the anchoring to stay on Cardano, or on any public ledger at all, and a state-hosted permissioned ledger is available that would quietly dissolve the very property that justifies commons funding.

I made an educated guess at the Treasury's return and payback period, and the proposal publishes enough to do it. Transaction fees alone do not repay the withdrawal on any horizon worth naming: about seventy thousand ada a year reaches the Treasury from them. The whole return case rests on how many people pay for verification, and at what price. On assumptions I think are reasonable, payback is around eleven years, within a plausible range of four to more than thirty, and only if the state stays. A ten per cent annual chance that the anchoring moves elsewhere stretches the central case past thirty years; above about fifteen per cent, it never repays in expectation. Section 2.9 sets out the arithmetic and why the number, which I do report, is not what carries this vote.

The external fiduciary instrument this DRep uses reaches No independently, on metric integrity, upfront exposure, additionality and the enforceability of the return. I would expect to vote for a corrected version of this proposal.

At the time of this revision, two DReps that had said they would abstain while their operator winds down have cast about 613 million ada Yes, more than half of all Yes and No stake cast. This action may be enacted without any of the changes this rationale asks for. The specification in §2.14 is written to serve twice: as what a resubmission would need, and, if the action passes, as what can still be secured through the administrator's contract and the proposer's own commitments, and what to watch for at each milestone.

## **1.2 Description of Governance Action**

This Treasury Withdrawal requests ₳9,600,000 over fifteen months for Trivolve Tech, with Quixy (Vivid Minds Pvt Ltd) as subcontractor, to build the Police Force Management System. PFMS extends Trivolve's existing Forensic Management System, which secures one stage of a criminal case, to five. The first is records that exist before a crime is reported: CCTV, bodycams, control-room calls, number-plate readers, station diaries, armory registers and calibration certificates. The others are the investigation itself, the evidence storeroom known in India as the Malkhana, prosecution filings, and verification in court. At each point a record is created, an edge agent fingerprints it, binds the fingerprint to the device and the officer on duty, batches the fingerprints into a Merkle root, and commits the root to Cardano through stage-specific smart contracts. Only hashes, roots, registry digests and counts go on chain; records and personal data stay in the state's systems. A verification layer later checks a produced record against its stamp and returns the same evidence bundle to prosecution, defense and court. The first deployment is the Indian state of Telangana, which the proposal says has committed to paying transaction fees, infrastructure and maintenance after the build.

The budget runs across eight lines: core blockchain and identity infrastructure ₳2,688,000; stage module engineering ₳2,112,000; integration testing, load proving and handover ₳1,536,000; systems integration ₳1,152,000; edge capture ₳960,000; security testing ₳472,000; project management and audit ₳480,000; and Cardano Foundation administration ₳200,000. Payment comes in five tranches:

* ₳1.8 million on signing of the administrator contract.  
* ₳2 million at month three: record definitions, contracts on preprod, credential registry.  
* ₳2 million at month eight: one record end to end through all six engines on preprod for three stages.  
* ₳2 million at month twelve: penetration testing passed, contracts on mainnet, all five stages accepted, 100,000 mainnet transactions from live sources, core code released under Apache 2.0.  
* ₳1.8 million at month fifteen: at least 390,000 mainnet transactions over three months and the final open-source handover.

An independent assurer is to be procured once the first tranche is released and must verify each milestone alongside the Foundation.

The Cardano Foundation is the named administrator, holds the funds unstaked and delegated to abstain, and will contract with Trivolve off-chain. The proposal commits to returning unspent ada, to returning any value above USD 0.30 per ada, and to returning funds on fraud or abandonment. It discloses six Project Catalyst engagements across Funds 12 and 14 totalling about ₳1.49 million, and no prior Treasury Withdrawal. It also commits the revenue from a paid verification service: 70 per cent to the Treasury, 20 per cent to maintenance of core Cardano libraries, 10 per cent to Trivolve. At ₳457.4 million enacted against the ₳500 million Net Change Limit for epochs 613 to 713, this request is about 22.5 per cent of the ₳42.6 million that remains, and it fits alongside the two other withdrawals now pending.

---

# **2.0 Discussion**

## **2.1 Method**

Every governance action gets read; not every action earns the same reading. This DRep runs each one first through an intake that assigns depth before the merits are read, then reads the merits, and selects the vote last. The question for the vote is not whether it helps something pass but whether a warrant has been derived to deploy delegated stake against it. 

This action earned the deepest reading for three reasons, none of which is its size. The first is permanence: what PFMS writes to the chain is meant never to be removed, and Cardano's association with a state's evidence apparatus would outlast any vote on it. The second is a revenue arrangement whose Treasury share is paid largely by people in criminal proceedings, which is a relationship the commons would be entering, not just a stream it would be receiving. The third is that the proposal's headline value is a transaction count — a number the governance layer itself uses to read whether Cardano is succeeding — and the size of that count is a design parameter of the recipient. Something that conditions how the ecosystem reads its own progress deserves to be read before it is installed.

## **2.2 What this proposal gets right, stated properly**

The track record is real and checkable. The FMS address the proposal publishes showed 158,791 transactions when first read, at a recent pace of roughly 570 a day, faster than the eleven thousand a month the proposal claims. The IndianChain address showed 16,628. These are not adoption projections; they are a government system running on Cardano now, operated by the state on its own infrastructure. Very few treasury requests can point to anything comparable.

The submission is a model of procedural care. The on-chain anchor is an IPFS identifier, and the metadata it resolves to matches the hash on chain, which this DRep computed. Every referenced document — full proposal, summary, work packages and the governance-action PDF — is itself pinned by content identifier and matches the copies in the proposer's repository. Both Trivolve and the Cardano Foundation have signed the metadata. The withdrawal is paid to a Foundation credential delegated to abstain and unstaked from any pool, and the chain confirms that delegation. After reading two proposals that week whose terms lived at locations that could still change, this one deserves to be named as the standard.

The milestones are built against the right failure. Acceptance needs on-chain data, working artifacts and reproducible tests together, so that a report cannot carry a milestone on its own. Contracts freeze before penetration testing and nothing touches mainnet until every finding is fixed and retested. The evidence for acceptance contains only fingerprints and counts, never source records. That is careful engineering governance, and the build risk is lower than its scope suggests because the core is already running.

And the proposal is honest about the limits of what it does. It says plainly that PFMS proves a record has not changed since it was made and who made it, and that it cannot prove the original entry was true. It frames its benefits for the accused as well as the prosecution: the custodial-death footage, the weekend in the lock-up that the station diary says never happened. That is the right account of what tamper-evidence is for, and it is rarer in this genre than it should be.

## **2.3 What PFMS is, and why the answer decides who pays and which ledger**

Much of the public discussion of this proposal describes it as record-keeping, notes that earlier records-on-chain efforts never produced lasting on-chain activity, and concludes that any chain could host it. If PFMS were record-keeping, all three would be fair. It is worth being exact about why it is not, because the exactness decides the two questions every voter on this action is answering, whether or not they say so: who should pay, and why the ledger matters.

A record-keeping system proves that something existed at a time. As specified, PFMS does four things beyond that.

It proves absence, not just presence. Every commit carries a count of the records expected, captured and sealed for that source and window. It also carries the list of approved devices and officers in force at that moment. Each device keeps a numbered local queue, so a deleted record leaves a missing number, and a camera that goes quiet is marked silent rather than assumed fine. Because the device list itself is committed, de-registering a camera after the fact shows too. That is the custodial-death case the proposal describes: a dead camera and cut footage stop looking the same.

It proves authority as of the moment. Each record's fingerprint is signed together with the device's identity and the officer's credential, and a digest of the credential registry travels in every commit. The question answered is not whether an officer is authorized now, but whether the credential was valid and unrevoked when the record was made. A registry state cannot be constructed afterwards to authorise a signature.

It enforces lawful sequence. The stage contracts check each batch's transitions against the state the previous batch left behind. An exhibit cannot be reissued while it is checked out; destruction needs two officers to sign; a transition that breaks a rule still lands on chain, recorded as rejected.

And it makes the stages reconcile. The exhibit list is generated from the stamped evidence-room records rather than retyped, so a seized item left off the list has a stamp with nothing pointing to it.

The accurate description is an **accountability protocol**: proof of presence, absence, authority and lawful sequence, against a record the party that commits cannot revise. That changes both questions.

On the record-keeping reading, a state database with a timestamping service would do, so would a ledger the state hosts itself, and the state should pay for its own records. On the accountability reading, the person asking the question is someone adverse to the state, and what they need to know is whether the state can rewrite its own account. A ledger the state hosts leaves the state as custodian of the thing meant to constrain it. The constraint needs a public, permissionless ledger. It does not strictly need Cardano: among public ledgers, the proposal's case for this one is real but comparative. And the funding logic reverses. A government seldom pays to be checked, and a market seldom pays for a check on a government. That gap is what a commons treasury can fill, and nothing else in the picture will.

The objection to commons funding is right on the facts as written, though not for the reason usually given. Whether PFMS is a check on the state or a tool of it does not depend on its architecture, which is the former, but on who can reach that architecture. As written, the proofs that tie a single record to its committed batch, and the registry entry behind each digest, are held by the operator. The verification layer, in the proposal's words, "supplies the entry the digest binds." A defense lawyer cannot check a record against Cardano without going through the state's vendor, possibly for a fee. In that configuration every property above exists on chain and can be used only through the party it is meant to check. Functionally, that is record-keeping: a public timestamp that only the state can use. Section 2.6 sets out the repair, and why it is the hinge.

The proposal invites the misreading. It leads with transaction counts and a percentage lift, and its strongest properties sit in its technical section. Section 2.5 returns to this: a count the recipient can set is the weakest way to describe the strongest thing the system does.

## **2.4 The strongest case, and the seam inside it**

There is a case for this proposal stronger than the one it makes, and it should be stated before the findings.

This DRep's framework asks one question of every institution in particular. When it requires others to be verifiable, is its own operation verifiable on the same terms, or does transparency run total on the participant and opaque on the operator? PFMS is that question, exported. Its whole premise is that the department that creates a record should not be the only keeper of it, and that a party adverse to the state — a defense lawyer, an accused person, a family — should be able to check the state's account of itself against something the state cannot reach. That is reciprocal visibility applied to police power. On this reading the strongest thing PFMS offers is not transactions or revenue. It is a route around the state's sole custody of the truth about its own conduct, and a public ledger is exactly the kind of thing that can provide one.

That is a description, and from it I am inclined to draw a conclusion: that Cardano's commons should pay to put that route in place. The step between the two is not deductive, and it should be marked rather than smoothed. A description of what tamper-evidence does says nothing by itself about whether the Treasury, rather than the state that will use the system, should fund its construction. Nor does it say whether a route around state custody is actually open to the people it is meant for, which depends on who can obtain the proofs, at what cost and through whose service.

Others cross the same seam by a different route: a government shows it needs a system by paying for it. That reading carries a reciprocity insight this one should honour, namely that the state's side of the relationship should be something it can feel, and section 2.8 takes it up. It also has a blind spot this framework is placed to see: willingness to pay measures PFMS as a service to the state, and cannot register it as a constraint on the state. Everything that follows lives on the far side of the seam. The relation is worth serving. The questions are about whether this governance action, as written, serves it.

## **2.5 A count the payee can set**

The first finding is about what is being paid for at the end.

PFMS does not commit one transaction per record. It batches the fingerprints from each source over a window and commits a single root, and it says, correctly, that shorter windows secure evidence sooner and longer ones leave it in off-chain custody for longer. The number of transactions it produces is therefore the number of sources multiplied by how often each commits. The proposal says this itself: the transaction count is a result of the batching process, and the batching intervals are set by the state's requirements and randomised for security. The 1.53 million first-year figure, against roughly 3.2 million evidence items and 1.8 million devices, is a statement about batching cadence, not a measure of how much evidence is secured. Halve the window and the count doubles with no additional evidence protected; lengthen it and the count falls while coverage stays the same.

That is a sound engineering choice and a poor thing to pay on. The final ₳1.8 million is released on at least 390,000 transactions over three months, under a batching policy to be published at the third milestone, after the vote. The tranche is therefore gated on a quantity the recipient controls, measured under rules the electorate has not seen. The same property runs through the value claim: the eighteen per cent lift in Cardano's transaction count, the alignment with the 2030 transactions target, the language of government-scale adoption in the title. A count that can be dialled is a parameter, and paying on it installs the parameter as the definition of success, for this proposal and for the ecosystem dashboard that will read it as adoption. It is also why skeptics about the transaction volume are right about the metric while wrong about the category.

None of this suggests any intention to inflate. The repair is simple, and it uses things the proposal already measures. Pay the final tranche on coverage rather than count: the share of registered sources live and committing, evidence items stamped, custody chains unbroken, and verification requests served to parties other than the operator. The reconciler and verification layer already report all of these. Publish the batching policy before the vote, or at the first milestone, with the transaction count reported as an outcome rather than a payment gate. And restate the adoption claim in the terms section 2.3 uses: how many independent parties can verify a record without asking the department, and through what route.

## **2.6 Proof at a price: the hinge**

This is the finding on which the others turn, and the one I would most want the proposer to read, because it is where the proposal's purpose and its revenue model pull against each other.

PFMS will sell a fast-tracked verification service to authorised parties, the proposal's examples being registered defense lawyers and the prosecution. The price starts at USD 1.89 and scales with the size of the dataset to several hundred dollars a request. Seventy per cent goes to the Treasury, twenty per cent to Cardano library maintenance, ten per cent to Trivolve. Those who do not pay can still have records checked through what the proposal calls the existing process. As far as the proposal says, the service will be operated by the party that takes the ten per cent and sets the price.

Three things are missing, and each matters more in a criminal court than it would anywhere else.

* **The free route is not defined.** The proposal does not say whether "the existing process" means the PFMS verification layer at standard priority, or the certificate-and-testimony process the whole system exists to replace, nor how long it takes, nor who operates it.  
* **The proofs are not independently obtainable.** What goes on chain is a batch root. Checking a single record needs the path that links it to that root and the registry entry that confirms the officer's credential, and both are held off chain by the operator.  
* **The pricing has no stated limit.** It is a discretion set by the operator, for a service whose buyers are, in the main, people accused by the state.

The strongest case in section 2.4 was that PFMS gives a party adverse to the state a way to check the state's records without trusting the state. If that route runs through a priced service, operated by a vendor the state pays, with the faster answer going to whoever can pay more, it has not escaped the asymmetry it set out to cure; it has moved it. And the Treasury would be its principal beneficiary. Every payment that makes the return case in section 2.9 work is, mostly, a fee charged to a defendant for checking the evidence against them. The more the commons earns from this arrangement, the more access to proof is priced.

This is why the verification route is the hinge rather than one finding among several. It decides three questions at once. If those adverse to the state can verify a record without the operator, PFMS is a check on the state: funding by a third party is appropriate, the public ledger is structurally necessary, and the system is not record-keeping in any sense that matters. If they cannot, PFMS is a tool of the state with a public timestamp: the government should pay for it, the ledger is a commodity backend, and "record-keeping" is an accurate functional description. As written, it is closer to the second. Every other finding in this rationale is a matter of terms; this one decides what the terms are for.

The repair is within the proposer's gift.

* State that standard verification through the PFMS layer is free and equivalent in proof content for the accused, defense counsel and the court, with the paid tier buying speed only.  
* Publish the proof path and registry entry, so that any party holding the original record can verify it against the chain without the operator.  
* Bound the pricing.  
* Either exclude fees paid by the defense from the Treasury share, or direct that share to funding free access.

A proposal that did those things would make the strongest case its own, and would answer the "government should pay" and "record-keeping" objections on the merits rather than by assertion.

## **2.7 What the Treasury buys, and what stays with the state**

The third finding concerns the boundary between the commons and the state, and it is mostly a question of instrument.

The proposal says the Treasury is not paying for software specific to or owned by one Indian state; it is paying for an open evidence layer that any jurisdiction can adopt. The core engines, contracts, registry, verification layer, batch format and test vectors are to be released under Apache 2.0, and that is a real public asset. But the budget also funds integration with this state's systems. That includes ₳1,152,000 for systems integration, and stage modules the proposal describes as adapting the forensic engine to Telangana's own laboratory network, forensic vans and CCTNS instance. The connector configurations that describe the state's police systems are to be kept private, so some of what the Treasury pays for would not be released to the commons. The state pays nothing towards construction. The recipient receives the maintenance contract under a separate agreement with the state. And the open-source release arrives at month twelve, after ₳5.8 million — sixty per cent — has been disbursed.

Governments ordinarily pay to build the systems they run. What the Treasury is buying here is an open core and the anchoring of a state's evidence on a public ledger, and on the reading in section 2.3 both are worth buying. But the price of those is not the price of a full state build, and the open core should be visible before most of the money has moved. The revenue share meant to return value to the commons has no stated mechanism. There is no on-chain payment route, no named recipient for the twenty per cent, no audit right over the revenue, no definition of gross or net, and no term beyond the administered period. The proposal records each paid request on chain with its price tier, which is a good start. But a stamp is self-reported, and the commitment would be enforceable, if at all, only through a contract the electorate has not seen and whose life is fifteen months.

The repair has three parts.

* Separate the generic core from state-specific integration and say who pays for each, with the state or a co-funder carrying the state-specific share, or that work released too.  
* Publish the core repository as it is built, from the second milestone at the latest.  
* Write the revenue share into the administrator's contract with an on-chain payment route, audit rights, a defined revenue base and a term that outlasts the build.

## **2.8 What the state owes, and where the anchoring can go**

The fourth finding takes up what the "government should pay" objection is reaching for, and finds a gap that neither our first rationale nor that objection named.

The state is not getting PFMS free. It pays the transaction fees, of which the Treasury receives a fifth. It pays for infrastructure, including the capture agents at each source, the nodes, the signing service and disaster recovery. And it pays Trivolve for maintenance. What it does not do is owe the commons anything. Its commitment is confidential, and it has no term, no consequence for leaving, and no undertaking about where its records are anchored. Our first rationale treated that confidentiality as a disclosure problem, to be answered by an attestation. It is also a reciprocity problem. On the state's side, the build is never registered as owed to the commons.

It matters because the state can leave. The proposal says that open-sourcing the core "mitigates vendor lock-in concerns for the state government." It does, and it removes the state's lock-in to Cardano just as thoroughly. The last obligation in the proposal is 390,000 transactions in months thirteen to fifteen. After that, repointing the commit engine at another ledger is largely configuration. There are two ways out, and they are not equal.

* **Moving to another public ledger** harms the commons: Cardano paid, and another chain gets the fees and the reference deployment. The accountability relation survives.  
* **Moving to a ledger the state hosts** destroys the relation itself, and does so quietly. India's Ministry of Electronics and Information Technology already offers a permissioned national blockchain stack, Vishvasya, hosted in National Informatics Centre data centres, one of them in Hyderabad, Telangana's capital. A PFMS anchored there would keep stamping while nothing outside the state could check it. Every property in section 2.3 would remain in the code and be gone in substance.

The proposal also offers its own precedent as evidence that the state will stay: FMS "was funded and delivered as a complete solution, after which the state took over its operation." It does not say who funded FMS. Press coverage places FMS in Uttar Pradesh, while PFMS is for Telangana, so "the same model already works" describes a different state's relationship. If a government paid for FMS, the case that Treasury funding is necessary is much weaker. If Project Catalyst paid, the pattern is that the commons builds and the state runs, and the evidence that matters is whether that state's commitment has held.

The repair gives the "government should pay" objection what it is really asking for — a commitment the state can feel, skin in the game — without making payment for the build the test of whether the relation is real.

* A commitment in the state agreement, attested by the administrator, that anchoring stays on a public, permissionless ledger. This matters more than anything else in this section and costs least.  
* A term of anchoring on Cardano, with a consequence for leaving early that someone is actually bound by, whether repayment, forfeiture or reversion.  
* The state, or a co-funder, carrying the state-specific integration (section 2.7).  
* The state accepting that proof paths and registry entries are public (section 2.6).  
* Disclosure of who funded FMS.

## **2.9 What the Treasury gets back, in its own currency**

The proposal argues in terms of transactions and revenue, and I wanted to test that argument on its own terms by estimating the Treasury's return and how long the Treasury would take to recover what it lends. The proposal publishes enough to do this. The arithmetic below uses only its own figures, the chain's current parameters, and measured fees from its existing deployment; the model is in the appendix.

There are two ways money comes back. The first is transaction fees. PFMS commits pay ordinary Cardano fees, which the state is to fund. Fees go to the reward pot, of which the Treasury receives twenty per cent under the current treasury growth rate; the rest goes to pools and delegators. FMS transactions currently cost about 0.23 ada each. At the proposal's floor of 1.53 million transactions a year, PFMS would generate about ₳347,000 in fees, of which about **₳69,000 a year** reaches the Treasury. At that rate the withdrawal would take about 138 years to repay. Even if volume grew by a quarter every year without stopping, recovery would take about sixteen years, and by then PFMS alone would be committing more transactions a year than the whole network commits today. If the system spreads across many states and volume doubles every year, the fee channel repays in about six years, but that is a scenario for the national roll-out the proposal hopes for, not the one it funds. The fee channel is real, and it is not where the return is.

The second is the verification revenue, and here the answer depends almost entirely on one number the proposal does not estimate: how many paid verifications there will be, and at what average price. The table sets out the return under a range of assumptions. It is anchored to the proposal's own figure of about 3.2 million evidence items a year in the first deployment, and counted from the vote, with go-live a year later and the first year at half pace.

| Paid verifications a year | Average price | Treasury inflow a year (ada at USD 0.23) | Payback from the vote |
| ----- | ----- | ----- | ----- |
| None (fees only) | — | \~₳69,000 | \~138 years |
| 16,000 (0.5% of evidence items) | USD 10 | \~₳556,000 | \~19 years |
| 32,000 (1%) | USD 10 | \~₳1.04 million | **\~11 years** |
| 64,000 (2%) | USD 10 | \~₳2.0 million | \~6 years |
| 64,000 (2%) | USD 20 | \~₳4.0 million | \~4 years |
| 160,000 (5%) | USD 20 | \~₳9.8 million | \~2.5 years |

My educated guess is the middle row. About one per cent of the year's evidence items go through paid verification at an average of ten dollars, returning roughly ₳1 million a year and repaying the withdrawal in around eleven years from the vote. A reasonable range is four to thirty years, and the short end needs about four times the verification revenue of the middle. Put plainly, the Treasury recovers its ada within a decade only if paid verification becomes routine in the state's criminal process. If ada rises against the dollar, the ada payback lengthens, because the revenue is earned in dollars; at fifty cents the central case takes about twenty years, though the Treasury recovers the same dollar value. And none of this counts what the proposal hopes for most — further states adopting the open core without another withdrawal — which is left out because it is not what this action funds.

Every figure above also assumes the state stays on Cardano for as long as the payback takes, and section 2.8 shows nothing makes it. Rerunning the central case with an annual chance that the anchoring moves elsewhere:

| Annual chance the anchoring moves | Expected total Treasury inflow | Payback |
| ----- | ----- | ----- |
| 0% | effectively unbounded | \~11 years |
| 5% | \~₳20 million | \~14 years |
| 10% | \~₳10 million | \~34 years, and only just |
| 15% or more | less than ₳9.6 million | never, in expectation |

Four cautions belong with the number, and they are why it does not carry the vote.

1. It rests on demand for which the proposal offers no evidence: no pilot data from FMS on verification requests, no survey of defense practice, no comparison with what courts now spend on authentication.  
2. The revenue share it depends on is not yet enforceable after the build (section 2.7), so the realistic return is the enforceable one, which today is the fee channel.  
3. It depends on a continued presence that nothing in the action secures (section 2.8).  
4. Most important, the return and the relation partly move in opposite directions. The scenarios that repay the Treasury fastest are those in which the most accused people pay the most to check the evidence against them (section 2.6). A fast payback would be evidence about the price of proof as much as about the value of the system.

This DRep's framework declines to let a number stand in for that judgment, and the number here, worked through honestly, makes the point by itself. Measured in its own currency, the quantity case does not carry the proposal. The relation does, or it does not, and that is what the rest of this rationale reads.

## **2.10 Who sees what**

Four shorter readings sit beside the findings. None carries the vote; each sharpens the specification.

The central fact on which the value of the withdrawal depends — that Telangana has committed to deploy PFMS, pay its fees and infrastructure and maintain it — is in agreements the proposal says are confidential and have been reviewed by the Cardano Foundation. I do not doubt the Foundation's review. But the electorate is being asked to rely on a commitment it cannot see, attested by a party that also co-signed the proposal, will hold the funds, will contract with the recipient, and will accept the milestones. The Foundation can publish a short attestation of the commitment's material terms without disclosing anything confidential: the parties, the scope of the deployment, who pays for what, the term, and, after section 2.8, the anchoring commitment. That would turn reliance into verification.

The independent assurer sits inside the recipient's own work package and is procured after the first tranche has been released. Publishing the shortlist and the conflict confirmation is good practice, but the assurer would be more independent if the administrator contracted it directly, before any money moved.

The first tranche, ₳1.8 million or nearly nineteen per cent of the total, is released on signature of the administrator contract, before the assurer exists and before any deliverable. For a request this size, that is a larger advance than the commons should carry without a reason stated for it.

And a small point of verification. The proposal describes the Foundation's receiving address as a multi-signature wallet, and the stake credential it pays to is the one the Foundation uses for governance deposit returns. On chain it is a key credential rather than a script, so any multi-signature control is enforced off chain and is not visible to a reader. That is very likely institutional custody working as intended, and the delegation to abstain is confirmed on chain. Earlier withdrawals the Foundation administered were paid to a script credential, so the difference is worth a sentence from the administrator.

## **2.11 What the commons retains**

Treasury funds may maintain commons relations; they may not transfer a private surplus. The test is the structure of the claim, not the recipient's status.

There is a surplus here, and it should be named without color. Part of it is private: the maintenance contract, ten per cent of verification revenue, and the position of sole maintainer of a system the proposal hopes will reach thirty-six states. Part of it is public but not the commons': a state government receives the construction of a system it will run, with no obligation to the commons in return (section 2.8). Neither is improper. Both put the burden on the proposal to show what relation of the commons is maintained.

The proposal's own answer comes in two registers. In one, the value is a quantity: transactions, a percentage lift, revenue figures, alignment with a numeric target. That register does not discharge the burden, and section 2.9 shows it would not discharge it on its own terms either. In the other, the value is a relation: a forkable evidence layer the commons keeps, and a route by which a party adverse to the state can check the state's record against something the state cannot change. That register is the right one, and it is stated, but its key terms are missing. The core arrives late, part of the funded work stays private, the anchoring can leave a public ledger, and the route for the adverse party runs through the operator. So the burden is partly discharged and partly attempted in quantities, and the translation the framework asks for is the one sections 2.5 to 2.8 already specify. That places this where a No that specifies is owed, not where an honest disagreement at the margin would call for standing aside.

## **2.12 Why this is a No and not an abstention**

Three grounds for abstaining were live, and each is foreclosed.

The first is that the ballot cannot carry the findings. Some of what this reading surfaced cannot be carried by any single vote, and section 2.15 records it. But the four findings that carry this token — a final tranche gated on a count the recipient sets, a verification route that runs through the operator, a funded scope part of which stays private with an unenforceable return, and a state that owes nothing and can leave — are properties of this action and fixable in it.

The second is that this falls outside what this DRep's framework reads. It does not, though it presses on the framework's edge, and that should be said. The rights this framework protects are those of Cardano's participants, and the people whose records PFMS would anchor are not, in the main, participants. What brings them within reach is the revenue share: once the commons takes seventy per cent of what an accused person pays to verify the evidence against them, that person stands to the commons in a relation of payment, and the framework's tests on tolls and access apply. Whether the commons owes anything to those whose records it anchors when it takes nothing from them is a harder question, carried to the trajectory log rather than settled here.

The third is the unverifiable state commitment, which the external rulebook would treat as a ground for abstaining where a fair Yes or No is unreliable. Here it is not. The No rests on findings that do not depend on the confidential agreement, and that agreement can be made verifiable by attestation.

This No should not be counted with the others for reasons it does not share. Most No votes on this action rest on the claims that the government should pay and that PFMS is record-keeping. This one holds that, remediated, PFMS is close to exactly what a public, permissionless commons should fund: infrastructure by which people can check the state's account of them against something the state cannot reach. The No is a claim about this action's terms, not about the category.

What pulled hardest the other way should be said. The team has delivered, the chain shows it, the submission is exemplary, and the problem is one of the few where a public ledger's particular property — that nobody inside the institution can reach it — is the whole point. Saying no to an applicant who has done this much right has a cost. It is why each finding is written as a repair.

## **2.13 Fiduciary verification (external instrument)**

This DRep's framework reads the relational and structural question and by design does not read the capital-allocation one. Leaving that region unexamined would raise vigilance rather than lower it, so the proposal was run through the DRep Treasury Rule Book v17 as a subordinate gate, one that can lower a merits-Yes but cannot raise a merits-No.

By economic substance this is open infrastructure built by a firm that will earn recurring revenue from its deployment, which the rulebook reads on its commercial, hybrid and infrastructure scorecard under hybrid treatment. Nominally it is a very large request, and it uses more than a fifth of what remains of the current spending limit. The preflight passes cleanly: immutable references, author signatures, a named administrator with a contract, custody delegated to abstain, the limit respected.

Several hard gates do not.

* **Metric integrity fails**, because the final payment rests on a count the recipient's own batching policy determines.  
* **Upfront exposure** exceeds the rulebook's normal ceiling for a request this size.  
* **The Treasury-return case** rests on a revenue share at the evidence level of assertion: a stated intention, with no demand evidence and no enforcement mechanism.  
* **The mixed-proposal rule is not met**, because the state-specific work and its private outputs are not separated from the public core.  
* **The funding-architecture screen is incomplete.** It asks why the actor who will use the system will not pay for it, and what the alternatives are. The proposal answers with a public-good claim about the open core, which this rationale accepts in part (section 2.3). It does not make the market-failure case for the state-specific build, does not say who funded the precedent it relies on, and does not compare state co-funding.  
* **Budget clarity is partial**: the lines are itemised by component but carry no roles, rates or benchmarks.

Against that, the track record, the custody, the preflight and the build discipline score strongly. At about USD 2.2 million for this scope the price is, if anything, low for what is promised; the risk is breadth, not inflation.

So this is convergence at the conclusion. A rights-derived reading and a capital-stewardship rulebook reach No from opposite directions and meet at the same places: what the final payment rewards, what the Treasury's return actually is, what the commons keeps, and what the state contributes. Had the gate come back clean, the relational No would have stood; had the relational reading passed and the gate failed, the allocation defect would have been dispositive. Its use here is to sharpen the specification.

## **2.14 What would make this a Yes, and what to watch if it passes without it**

The specification is unchanged in purpose and now has six parts.

**Make the route to proof free and independent of the operator.** This comes first because it is the hinge. State that standard PFMS verification is free and equivalent in proof content for the accused, defense and court, with any paid tier buying speed only. Publish proof paths and registry entries so that anyone holding the original record can verify it against the chain without the operator. Bound the pricing. Either exclude defense-paid fees from the Treasury share, or direct that share to funding free access.

**Pay on coverage, not count.** Gate the final tranche on sources live and committing, evidence items stamped, unbroken custody chains, and verification requests served to parties other than the operator. Publish the batching policy before the vote or at the first milestone, and report transaction counts as outcomes.

**Draw the line between core and state.** Separate the generic core from state-specific integration and say who pays for each, and release whatever the Treasury pays for. Publish the core repository as it is built, from the second milestone at the latest.

**Bind the state in return.** Commit in the state agreement, attested, that anchoring stays on a public, permissionless ledger. Set a term of anchoring on Cardano with a consequence for early departure that binds someone. Disclose who funded FMS.

**Make the return real.** Write the revenue share into the administrator's contract with an on-chain payment route, a named recipient and process for the library-maintenance share, a defined revenue base, audit rights, and a term that outlasts the build.

**Let the electorate see what it relies on.** Have the Foundation publish an attestation of the material terms of the state commitment. Have the administrator contract the assurer before any tranche moves. Reduce the signing tranche, or tie part of it to the first deliverable. And have the administrator confirm in a sentence how the receiving credential's multi-signature control works.

Do those, and this becomes a proposal this DRep would expect to vote for.

**If the action is enacted as written**, the specification becomes an oversight checklist, and more of it can be reached than the ballot suggests. The administrator has yet to write its contract with the recipient, and a proposer can always commit to more than its action requires.

*Reachable through the administrator's contract and the assurer:*

* Contracting the assurer before the first tranche, rather than after it.  
* Requiring coverage reporting alongside the transaction count at the fourth milestone.  
* An enforceable revenue share with an on-chain route, audit rights and a term beyond the build.  
* A published attestation of the state commitment, including the anchoring commitment.

*Reachable through the proposer's own public commitments, which would be stricter than the action and so consistent with it:*

* Free and equivalent standard verification.  
* Published proof paths and registry entries.  
* Exempting defense requests from fees, or directing that share to free access.  
* Opening the core repository from the second milestone.  
* Disclosing who funded FMS.

*Not reachable once enacted:*

* The tranche sizes, including the signing tranche.  
* The transaction count as the formal trigger for the final payment.  
* The fact that funding preceded any visible commitment from the state.

*What to watch, by milestone:*

* **Milestone 1:** whether the batching policy is published early, and whether the record definitions include what a third party needs to verify independently.  
* **Milestone 2:** whether the core repository is public and whether the assurer was contracted by the administrator.  
* **Milestone 3, the decisive one:** whether the verification layer can be used by someone other than the operator. This is when the batching policy, contract addresses and open-source release all land.  
* **Milestone 4:** what share of registered sources are live, not only how many transactions arrived.  
* **After milestone 4:** whether the anchoring stays where it was funded to be.

## **2.15 What the vote does not reach**

A vote is a snapshot; the log is the trajectory. Several tensions this proposal makes visible are held here rather than converted into this vote.

The first is between integrity and truth. PFMS proves a record has not changed, not that it was true, and the proposal says so. But a stamped record carries an authority in court that an unstamped one does not, and a machine-made record of a number plate at a place and time already reads as objective. The risk is that verifiability is read as veracity, and that the system's undoubted protection for honest records becomes a presumption for every record that bears a stamp, including those that were false when made. How courts come to treat a PFMS stamp is outside any vote, and it is the question on which the system's net effect on justice will turn.

The second is what the commons owes those whose records it anchors. Cardano's framework protects its participants. PFMS would make the chain the external memory of a state's police apparatus — CCTV, number plates, armories, statements — for millions of people who never chose to participate in Cardano. While the commons takes nothing from them, its obligations to them are unclear; once it takes a share of what they pay, they are clearer (section 2.12). Whether the commons owes non-participants something merely by anchoring records about them is unsettled, and is a candidate for corpus work rather than a vote.

The third is who pays for accountability infrastructure. The discussion around this action has largely assumed that the user of a system should fund it, and for services that is right. But a system whose value lies in constraining its user will rarely be funded by that user, and seldom by a market. A public commons may be one of the few institutions placed to fund checks on power that no one inside the checked institution will buy. That is a claim about the role of a constitutional treasury, not about this proposal, and it is a candidate for corpus work. It sits beside the fourth tension, not in place of it.

The fourth is the Treasury as a funder of public-sector procurement. A state that can have its system built by the Cardano Treasury in exchange for choosing Cardano has a reason to choose Cardano, and the next state will ask for the same. That may be a sound adoption strategy. It is also a precedent for the commons paying construction costs that governments ordinarily carry, and the line between buying chain choice and buying a state's IT is one the ecosystem has not drawn. The third and fourth tensions pull against each other, and this rationale does not settle which governs; it asks the proposal to separate the parts each would fund.

The fifth is the transaction count as the ecosystem's sense of itself. The 2030 targets read transactions as adoption. A single deployment able to move that figure by double digits through a batching setting shows how easily the measure can be supplied rather than earned. This is not a criticism of PFMS, whose batching is honest engineering; it is a reading of the instrument, and a candidate for a future proposal: any Treasury-funded deployment reporting transaction counts should also report what those transactions secure.

The sixth is how this vote is being decided. Two DReps, Yoroi Wallet and EMURGO, had said they would vote Abstain while their operator winds down, and directed their delegators to move elsewhere. They never delegated that stake to the predefined Always Abstain option, so the commitment remained a statement rather than a constraint. On 29 October both voted Yes on this action, together about 613 million ada, more than half of all Yes and No stake cast at the time. Their announced deregistration date falls after this action's voting window closes. This alleges no coordination, and the long relationships among Cardano's founding entities are mostly collaborative. The finding is structural. A commitment to abstain that is not executed on chain is a discretion, and this one has been used on votes it can decide. Whatever this action's outcome, it now carries that, which is unfair to every DRep who did the reading and to a proposer who did not ask for those votes. The remedy is a norm rather than a vote: a DRep that commits to abstaining while winding down should delegate its stake to Always Abstain, or deregister. That is a candidate for the proposal-standard and DRep-practice work this DRep is engaged in.

Three smaller readings belong beside these. The claim that verification will cut case resolution time by about thirty per cent is unsourced, and the kind of figure that hardens through repetition. The proposal's title promises government-scale adoption while the funded scope is one state; the distance between name and scope is aspirational rather than misleading, and is tracked across proposals. And the questions this DRep's intake asks that no proposal template yet asks — what reverses this if it is wrong in eighteen months, what reads through it, what would register its degradation — went unanswered because they were never put. Section 2.8's finding is, in part, an answer to the first of them.

---

# **3.0 Conclusion**

We are voting **NO (remediable)**.

The team has shown on chain that it can build and run government systems on Cardano, and the submission is a model of how a large request should be made. Read as specified, PFMS is not record-keeping but an accountability protocol: a route by which those adverse to the state can check the state's records against something the state cannot reach. That is the kind of system a public, permissionless commons is better placed to fund than the state it constrains.

The refusal is of four structures. First, a route to proof that runs through the operator, with the Treasury as principal beneficiary of the paid lane. This one is the hinge: it decides whether PFMS is a check on the state or a tool of it, and with that, who should pay and why a public ledger matters. Second, a final payment on a count the recipient's own batching determines. Third, a funded scope part of which stays private, released late, with a return that cannot yet be enforced. Fourth, a state that owes the commons nothing and can take the anchoring anywhere, including somewhere no one outside the state can check.

Worked through in its own currency, the Treasury's return is modest by the fee channel and uncertain by the verification channel. Payback is most plausibly around a decade, conditional on a continued presence nothing secures, and the faster scenarios are the ones in which proof costs the most. That is why the number, which this rationale reports, is not what decides it.

Each finding is repairable, most of them in the drafting: make the route to proof free and independent of the operator, pay on coverage, draw the line between core and state, bind the state to a public ledger, make the return enforceable, and let the electorate see what it is relying on. If the action passes without them, much of the list can still be secured through the administrator's contract and the proposer's own commitments, and the third milestone is where it will be visible whether it was.

Beyond this action, I will carry forward what it makes visible: how courts come to read a stamp, what the commons owes those whose records it anchors, who pays for accountability infrastructure, the Treasury's growing role in funding public-sector builds, an ecosystem measuring itself by a count that can be supplied, and stake committed to abstention that is deployed when it decides. This DRep will continue to maintain a state of inquiry around them.

DRep ID: drep1yfaq8dsam7nusdccey2x2p684f6ulhr42pv24tslv0terqs3nq50q DRep Profile: [https\://styg-drep.github.io/coordination-commons/](https://styg-drep.github.io/coordination-commons/)

My thanks to the delegators who make this reading possible, and to Trivolve Tech, Quixy and the Cardano Foundation for a proposal whose care in construction made a careful reading possible.

Stay in touch. X: [https\://x.com/styg50](https://x.com/styg50)

---
