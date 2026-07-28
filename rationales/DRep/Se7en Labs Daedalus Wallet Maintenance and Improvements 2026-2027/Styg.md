<!-- url: https://dreptalk.com/vote-rationale/5c6e82ca7361afb9cc987197406a7ed9d601d6480f1848547b4facee59d8fc38.json -->
# Styg

**Proposal:** Se7en Labs Daedalus Wallet Maintenance and Improvements 2026-2027
**Vote:** Yes
**Voter ID:** `drep1yfaq8dsam7nusdccey2x2p684f6ulhr42pv24tslv0terqs3nq50q`

---

# **Se7en Labs: Daedalus Wallet Maintenance and Improvements 2026–2027 — Voting Rationale**

| Governance Voting Rationale |  |
| ----- | :---- |
| GAID | gov\_action1mr0qdz2jmagvsch6r08fhqvq6vu8jakt4c8m9s7ea7z0p740vntqq4yjd6j |
| Title | Se7en Labs: Daedalus Wallet Maintenance and Improvements 2026–2027 |
| Type of GA | Treasury Withdrawal |
| Amount | 1,785,333 ADA (1,666,667 labor · 33,333 test hardware · 33,333 financial audit · 52,000 Intersect administration) |
| Date submitted | Epoch 639 (Jun 23, 2026\)  |
| Expiration Date | Epoch 646 (Jul 28, 2026\)  |

---

# **Contents**

* 1.0 Introduction  
  * 1.1 Summary  
  * 1.2 Description of Governance Action  
* 2.0 Discussion  
  * 2.1 Method  
  * 2.2 The sort, published  
  * 2.3 The good, stated as a relation  
  * 2.4 The private-surplus burden  
  * 2.5 The floor, and the six rights in brief  
  * 2.6 What the vote does not reach  
  * 2.7 Fiduciary verification (external instrument)  
* 3.0 Conclusion

---

# **1.0 Introduction**

## **1.1 Summary**

We are voting **YES** on this governance action to fund twelve months of maintenance and development for Daedalus, delivered by Se7en Labs.

I want to be precise about the character of this YES, because the [framework I vote by](https://styg-drep.github.io/coordination-commons/) treats a for-profit entity drawing 1.78M ADA from the treasury as a claim that must be examined at its structure rather than waved through on its usefulness or refused on its tax status. Both of those shortcuts are errors, and the sort exists to avoid them.

Three things carry the vote. First, the action [sorts shallow](https://styg-drep.github.io/coordination-commons/instruments/intake-and-sort/):  it is a discrete, named-deliverable maintenance grant that lapses on its own terms, and the sort's most useful service here is to refuse the commercial sector label as a routing key. Second, the load-bearing test for any treasury withdrawal to a for-profit — [the published private-surplus burden](https://styg-drep.github.io/coordination-commons/instruments/abstention-spines/#appendix-a-the-private-surplus-burden-as-published) — is not merely attempted but discharged about as completely as a for-profit maintainer can discharge it. Third, the good, stated as a relation rather than a deliverable, is a genuine commons relation with direct rights anchoring: Daedalus is the only full-node desktop wallet, the primary path by which a non-technical participant reaches the chain without trusting a third-party backend. Funding its maintenance strengthens the rights it touches and harms none.

This is a YES on the merits of the action. It is not a YES to everything the proposal says about itself. Several signals the reading surfaced:  the proposal's self-referential justification against a strategy framework its own authors produced, its KPI framing, and the standing single-maintainer dependency it services, are real, but they are readings of the ecosystem's trajectory and vocabulary, not findings about this action that the ballot could carry. They are recorded below and carried to the trajectory log rather than converted into the vote.

## **1.2 Description of Governance Action**

This is a Treasury Withdrawal funding a twelve-month, time-and-materials engagement by Se7en Labs, Inc. for maintenance and improvement of the Daedalus desktop wallet. Daedalus is Cardano's only full-node desktop wallet: it runs an embedded node, derives all wallet and governance data directly from the chain with no third-party APIs or trusted backends, and generates and stores keys on-device. It is released under the Apache License 2.0.

The scope covers three registers. Protocol maintenance:  node currency, hard-fork readiness, and Leios/Peras/Nested-Transactions compatibility, with a compatible release at least two weeks before every mainnet hard fork. Ecosystem expansion:  Keystone and Flex hardware-wallet support, a CIP-30 dApp connector, and Japanese localisation. And user support, with a scoped architecture assessment published regardless of outcome.

Administration and oversight run through Intersect as administrator and independent milestone verifier under Article II.7.5, using the Sundae Labs treasury-management smart-contract framework, with a six-entity Oversight Committee, milestone-based disbursement controls, monthly disbursement against verified work, and unspent budget returned to the treasury at contract close. The proposal states compliance with the 350M Net Change Limit for the applicable window, and discloses that Se7en Labs has received no treasury ADA in the prior 24 months, having operated under a direct IOG contract for Daedalus maintenance since January 2026\.

---

# **2.0 Discussion**

## **2.1 Method**

Every governance action gets read; not every action earns the same reading. This DRep runs each action first through the intake and sort, which assigns a lane (how much analysis the action earns and which instruments run on it)  before any merits are read and before any standing policy is applied. The sort returns depth, never a verdict. The token is then selected downstream, under the [abstention-spine discipline](https://styg-DRep.github.io/coordination-commons/instruments/abstention-spines/), where the operative question is not whether a vote helps a proposal pass but whether a warrant has been derived to deploy delegated stake against it.

Reading the merits first and then choosing the depth is how depth ends up chosen to fit a conclusion already reached, so the order is held. The sort is published with the rationale, because a reader who disagrees with the vote is owed the ability to locate whether the disagreement is about the sort or about the analysis, and those are different arguments, and only one of them is about the proposal.

## **2.2 The sort, published**

|  | Reading |
| ----- | ----- |
| **Axis 1 — wall / knob / wall-building** | **Knob.** A discrete twelve-month engagement with named deliverables that sunsets at term and returns unspent funds. No structural constraint is treated as tunable; no default is installed where a per-action decision now stands. Renewal is not by default — each cycle requires a fresh proposal. The claim reconstructs cleanly as service compensation and sits under, not senior to, the commons' discretion. |
| **Axis 2 — exit-remediability** | **R3 — reversal by inaction**, with a logged mild decay note. Measured at the failure mode: if the engagement proves wrong, not renewing is the default, and monthly milestone-gated disbursement stops a mid-stream problem before it completes. The deeper failure mode — a sole full-node wallet falling behind at a hard fork — is a *pre-existing* ecosystem dependency this action services and reduces, not one it manufactures; vendor-specific lock-in is bounded by Apache-2.0 forkability and the documented drt/Nix toolchain. Terminal band stays R3. |
| **Axis 3 — epistemic-dependency depth** | **D1**, brushing D2. What reads through Daedalus reads mostly within its own domain: settlement access for its user cohort. Its governance-data-from-chain property is a positive for informational integrity, not a dependency risk. Critically, if Daedalus degraded, the degradation would register through public GitHub repositories and mainnet — external to the vendor, the opposite of a self-concealing D3 signature. The proposal makes its own success metrics externally verifiable by design. |
| **Lane** | **Shallow.** Procedural check, Hippocratic floor, public-goods reconstruction, vote, short rationale. |

The sort ran before merits and before any standing policy. That ordering is key here, and the case it protects against is exactly this one: a for-profit entity maintaining a widely-used open-source tool carries a commercial sector label while presenting a non-rivalrous good with discrete delivery, which is a commons-derived claim by every axis that matters. A standing policy keyed to the sector label would fire on it wrongly, and because explicit abstention has a direction (it lowers the passage bar) the mis-fire would not be a null act. This proposal is the Archetype A the calibration was written around, and the sort keeps standing policy from doing work the derivation did not authorize.

## **2.3 The good, stated as a relation**

Asked what the good is as a relation rather than a deliverable, the proposal answers largely in deliverables:  node upgrades, a connector, a localisation. But a genuine relation is present and it is the one that matters: Daedalus is the only full-node desktop wallet in the ecosystem, and therefore the primary mechanism through which a participant without command-line fluency runs a full node and reaches the chain without trusting a third-party API or backend. The good being funded is the *maintained existence of a non-custodial, non-intermediated path to settlement* for the cohort that would otherwise have no alternative preserving that standard.

That is a capacity the commons maintains, not a product a vendor sells, which is what makes it a public good in this framework's sense. On rivalry: the good is non-rival and non-excludable. Under Apache 2.0 the source is public in perpetuity and forkable by anyone; there is no captured customer relationship, no subscription, no token, no IP exclusivity. No participant is excluded, and no mechanism of exclusion is created.

The relation is directly rights-anchored. It is settlement access (Right I) for the self-sovereign cohort, and it is exit integrity and productive autonomy (Right VI): a forkable, auditable, on-device-key wallet is precisely the arrangement under which a participant can exit any custodial or backend relationship without forfeiting access. Maintaining it moves both rights in the protective direction.

## **2.4 The private-surplus burden**

The published burden is the test this proposal must pass, and it is worth stating in its own terms: treasury funds may fund the maintenance of commons relations; they may not fund the transfer of a private surplus. This is a test of claim structure, not of the recipient, a for-profit maintaining a non-rival good the ecosystem depends on presents a commons-derived claim, and the recipient's tax status is not asked and does not bear on the answer. Where a proposal seeks funds for an activity generating private surplus, the burden is on the proposal to show that a commons relation is maintained, stated in relation terms; expected-value and ecosystem-growth arguments do not discharge it.

The proposal's "Nature of This Proposal" section is an unusually direct answer to exactly this burden. It states that Se7en Labs does not monetize Daedalus usage and captures no customer relationship, subscription revenue, token value, or IP exclusivity; that all funded outputs are public assets in perpetuity, forkable under Apache 2.0; and that the treasury is funding maintenance of community infrastructure rather than subsidizing a private business expansion. What Se7en Labs receives is service compensation: labor at USD-denominated rates, invoiced at spot and converted to stablecoin, which is the legitimate-service-compensation category the corrupted-terms test in Right I explicitly preserves, not extraction beyond service value.

The burden is therefore not merely attempted in good faith; it is discharged, and the claim structure is commons-derived on every axis the framework recognises. Under the burden-contested spine's outcome table, a discharged burden with the relation genuinely served returns the proposal to evaluation on the merits like anything else, no standing abstain fires, because the standing thing is the burden, and the burden is met.

One qualification: the proposal's KPI-alignment section leans on expected-value and ecosystem-growth arguments:  MAU toward one million, transaction counts toward a 2030 target, which are exactly the arguments the burden says do *not* discharge the relation question, because they answer a quantity question in place of the relation question. What saves this is that the proposal does not *rely* on those arguments to discharge the burden; it discharges the burden separately and completely on claim structure, and the growth framing is decoration in the ecosystem's current vocabulary rather than the load-bearing justification. The burden's own answerability clause also applies charitably here: to the extent the growth matters, maintaining Daedalus produces growth in *productive settlement capacity* for the self-sovereign cohort, which is productive activity, not price, valuation, or attention. The growth framing is logged as a vocabulary signal; it does not convert a discharged burden into a contested one.

## **2.5 The floor, and the six rights in brief**

The shallow lane runs the Hippocratic floor and a public-goods reconstruction, and both are already substantially answered above. Read against the [six rights](https://styg-drep.github.io/coordination-commons/foundations/rights/#section-iii-the-derived-rights) as violation tests, the action harms none and strengthens several. Settlement access (Right I) is maintained at its only full-node desktop point of entry. Self-determination (Right VI) — exit integrity and productive autonomy specifically — is strengthened by a forkable, non-custodial, on-device-key wallet. Informational integrity (Right IV) is served rather than strained: the wallet derives governance and chain data directly from the chain, key handling is auditable because the source is open, and the proposal's success metrics are independently verifiable from public repositories and mainnet without reliance on applicant self-reporting. No monetary parameter is touched, so unit-of-account integrity (Right II) is not engaged. Governance participation (Right III) and commons integrity (Right V) are not harmed; the administration architecture — Intersect as independent milestone verifier, a six-entity Oversight Committee, monthly disbursement against verified work, unspent-returns — is a contestable, auditable arrangement rather than a concentrating one.

The floor is cleared comfortably. No abstention spine triggers: the finding is expressible as a property of this action, the derivation has purchase (so not jurisdictional), the burden is discharged (so not burden-contested), the constitution- and framework-required completeness items are present (so not insufficiency), and this DRep holds only the general participant interest that does not disqualify (so not reflexive). The honest token is YES.

## **2.6 What the vote does not reach**

A vote is a snapshot; the log is the trajectory; and trajectory over snapshot is the commitment this framework was built to keep. Four signals the reading surfaced belong in the trajectory log rather than in this vote, and I record them here so the YES is not mistaken for silence on them.

**The self-referential justification.** The proposal grounds its primary motivation in the Cardano Vision & Strategy framework and its pillar structure — and Se7en Labs members served as chair and vice-chair of the Product Committee that produced that framework, ratified by DRep supermajority in January 2026\. Nothing about this is a violation, and the strategy is a legitimate object to cite. But the standard against which the proposal measures its own alignment is a standard the proposer helped author, and that is an asymmetry signal in the register of the narrative-accuracy and asymmetry tests — a reading about KPI-authoring concentration in the ecosystem, not about this action harming a commons relation. It is logged as a trajectory item about who writes the yardstick, not as a finding the ballot reaches.

**The quantity vocabulary.** As noted under the burden, the KPI framing performs the quantity substitution the framework exists to catch. It does not carry this proposal's justification, so it does not move the vote — but the fact that a proposal this cleanly commons-derived still reaches instinctively for MAU and transaction targets is itself a reading of the ecosystem's present vocabulary, and it belongs in the log as such.

**The single-maintainer dependency.** The proposal's own expected-value case is that a Daedalus user running an incompatible node at a hard fork cannot sync at all, where a lite-wallet user can switch backends — which is to say the ecosystem depends on a single maintainer for its only full-node desktop path. This is a real client-diversity and contestability concern (Right I decentralization, Right V contestability). The correct response is not to withhold funds from the one wallet that exists — that would *increase* the failure mode — but to fund the maintenance now and carry the client-diversity concern as a standing trajectory item, one the proposal itself gestures at through its ≥2-full-node-client framing and its scoped architecture assessment. The structural remedy is a second independent full-node wallet, and this grant is not it. This is the one trajectory item that does not rest on this framework alone: as recorded in §2.7, the external fiduciary read reaches the same soft spot from the capital-stewardship side, and the convergence of two independently grounded instruments on one concern is what raises it from a note to a candidate for a future proposal.

**The decay note.** Remediability here is R3 (the action lapses on its own terms) , but dependency-servicing grants are where renewal can quietly become the default. Each future cycle should remain a genuine per-action decision, not a renewal-by-inertia — and the client-diversity item above is what keeps the renewal a choice rather than a hostage situation. This is recorded now, at the opening cycle, precisely so the movement between sorts across renewals can be read as the finding it would be, rather than discovered late.

There is also a light governance-hygiene observation, short of any of the above. The proposal bundles existential maintenance with discretionary feature work (the CIP-30 connector, hardware-wallet support, the architecture assessment) into a single T\&M ask. This is not the bundling fail-state the framework arrests on — that reading is reserved for heterogeneous structural or constitutional changes fused into one indivisible, correction-foreclosing action. Here the budget summary is transparent that the features ride nearly for free on a maintenance team that must exist regardless, and monthly milestone-gated disbursement makes the scope severable in practice. It clears, and is noted only for completeness.

## **2.7 Fiduciary verification (external instrument)**

This DRep's framework reads the relational and structural question — whether a commons relation is harmed — and by design does not read the capital-allocation question: price, instrument fit, size-calibrated discipline, upfront exposure, and opportunity cost. That axis is an acknowledged gap in our coverage, and under our own field-fitness discipline an unexamined region raises vigilance rather than lowering it. We therefore ran the proposal through the [DRep Treasury Rule Book v17](https://docs.google.com/document/d/1ed-IkSj4tDqys3D1jDMspgIZ7O9xSmxQsMPpB_b3DXA/edit?usp=sharing) (credit: [@InputEndorsers](https://x.com/InputEndorsers), [drep1y2hlgh9600zjlt39dh54z7z8d65kahneck8yhh7ugmzc9as0xrzqd](https://dreptalk.com/dreps/inputendorsers-xrzqd/)), which we have separately reviewed with positive findings, as a fiduciary gate — one that can lower a merits-YES but cannot raise a merits-NO.

The gate clears. Classified Large by nominal request, the proposal meets every universal hard gate and clears the Large-band threshold on the Public-Good and Civic-Service scorecard with the recurring-maintenance module active; upfront exposure is staged monthly against independently verified work, well inside the rulebook's risk-calibrated caps. We record the pass and its structure rather than a single number, consistent with both instruments' shared position that a score is evidence for judgment, not a substitute for it.

The verification's substantive contribution is a convergence. The score's thinnest categories — continuity and succession, and neutrality and decentralization — are where the rulebook's maintenance module flags bus-factor and hereditary-capture risk, and these are the same concern this rationale logged in §2.6 as the single-maintainer and client-diversity trajectory item, reached from capital-stewardship rather than rights-derivation. Two independent instruments flagging one soft spot strengthens the case for that trajectory item. Had the fiduciary read instead surfaced excess exposure, unbenchmarked pricing, or a capture structure, it would have been dispositive on the allocation question notwithstanding the relational pass; here it was not, because the structure is sound.

---

# **3.0 Conclusion**

We are voting **YES**. The action sorts shallow — a discrete, sunsetting, forkable-public-good maintenance grant that lapses on its own terms and reverses by inaction. The private-surplus burden, which is the test that governs a for-profit drawing on the treasury, is discharged on claim structure rather than dodged. The good, stated as a relation, is the maintained existence of the only non-custodial full-node desktop path to the chain — settlement access and exit integrity for the cohort that has no alternative preserving those standards — and funding it moves those rights in the protective direction while harming no commons relation. The administration is contestable and milestone-gated, and the reversibility is clean. The fiduciary axis our framework does not itself read was checked against an external instrument and cleared, as a gate that could have lowered this vote and did not. On the merits, this is what a treasury withdrawal should look like.

The YES ratifies the action; it does not ratify the vocabulary the action is dressed in. This DRep carries forward four trajectory items — the self-referential yardstick, the quantity framing, the single-maintainer dependency, and the renewal-decay caution — none of which the ballot can reach, and one of which, client diversity, is a candidate for a future proposal rather than a future vote. That is the division of labor the framework keeps: the vote answers the action, and the log answers the trajectory. This vote answers the action, and the action is sound.

DRep ID: drep1yfaq8dsam7nusdccey2x2p684f6ulhr42pv24tslv0terqs3nq50q  

DRep Profile: [DRep Talk Profile](https://dreptalk.com/dreps/styg-nq50q/)

[The Coordination Commons](https://styg-drep.github.io/coordination-commons/) \- DRep reference

Stay in touch. X: [https://x.com/styg50](https://x.com/styg50)

[IPFS of rationale](https://aqua-casual-quelea-615.mypinata.cloud/ipfs/bafkreiaoiuxbsdvcd5hylttkbpj46frzzatk26lnkqcjjxgx4hk5bjljea)
