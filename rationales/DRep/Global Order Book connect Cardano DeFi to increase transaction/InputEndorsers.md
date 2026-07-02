<!-- url: ipfs://QmYoYetREbxVpJkHQqD693Yp14dnXXykFwzx6H8TF2ZjNb -->
# InputEndorsers

**Proposal:** Global Order Book connect Cardano DeFi to increase transaction
**Vote:** No
**Voter ID:** `drep1y2hlgh9600zjlt39dh54z7z8d65kahneck8yhh7ugmzc9as0xrzqd`

---

## DRep Assessment Rationale

I am using a personal **Cardano DRep Commercial Treasury Rule Book v6** that I created to reflect some of my thinking and help me assess commercial and commercial/hybrid proposals more consistently.

This framework may still evolve. I am being assisted with AI in this process because I want to create a process that I can apply relatively neutrally across the large number of proposals requesting funding. If a proposal is borderline, I will look at it even more closely.

The document is here:
https://docs.google.com/document/d/1fXaNY3L8oGWEGJmMubTKn7FnyhXCzOhiophXzFQFC_c/edit?usp=sharing

---

## Assessment

I think **Work Package 3 (WP3): American Options** is currently the weakest and riskiest part of the proposal. It probably has the highest market-adoption risk. I would vote **No** on a proposal that includes WP3.

**WP1 and WP4** are much cleaner public infrastructure.

* **WP1** maintains DeFi Kernel as a public standard.
* **WP4** gives wallets, bots, indexers, and dApps SDK tooling.

**WP2** is still commercial, but it is the better product bet. Leveraged spot trading has a clearer user story than American options.

---

## Scorecard

| Category                                      |        Score |
| --------------------------------------------- | -----------: |
| Public value, additionality, ecosystem gap    |      11 / 13 |
| Business quality and traction                 |        4 / 6 |
| Price versus value                            |        5 / 7 |
| Applicant integrity and past delivery         |        6 / 8 |
| Public asset, open-source, data rights        |       8 / 12 |
| Treasury upside, instrument fit, risk sharing |       8 / 15 |
| Milestones, verification, anti-gaming         |       9 / 13 |
| Risk management, margin of safety             |       8 / 12 |
| Sustainability and exit plan                  |        6 / 9 |
| Opportunity cost and competitive neutrality   |        3 / 5 |
| **Base score**                                | **68 / 100** |
| DRep conviction adjustment                    |       **+2** |
| **Final score**                               | **70 / 100** |

---

## Conditional Support Terms

I would consider **Conditional Support** only if the proposal were revised to include the following terms as binding conditions, not merely as general intentions.

### WP1 and WP4 should be true public assets

The registry, SDK, adapters, schemas, documentation, examples, and related tooling should be published in public repositories under a permissive license such as MIT or Apache-2.0, with clear documentation, tests where applicable, tagged releases, and practical fork rights before final payment.

### WP2 should provide stronger Treasury upside

The current 5% protocol-fee return for 12 months is not enough for a Treasury-funded commercial DeFi primitive. I would want either a longer protocol-fee share, a higher fee share from the Treasury-funded leverage product, a repayment trigger, or another enforceable economic return to the Treasury.

### Disbursement should be milestone-based with low upfront exposure

The proposal should define payment amounts per milestone, acceptance criteria, deadlines, evidence required, and failure rules. Upfront funding should be limited, especially for WP2.

### Verification should be independent and evidence-based

Milestones should not rely only on applicant dashboards or self-reporting. Verification should use public repositories, audit reports, on-chain data, published script hashes, independent milestone review, and clear evidence that each deliverable was completed.

### The trading-volume KPI should include an anti-wash covenant

The **$1M rolling 30-day trading-volume KPI** for WP2 should exclude related-party trading, subsidized trading, circular volume, bot farming, applicant-funded activity, rebate-driven usage, wash trading, and other artificial volume.

### Security review should remain mandatory before mainnet release

WP2 involves leverage, collateral, borrowing, liquidation, and debt accounting. A bad design could harm users quickly.

Mainnet deployment should require a completed security review or audit, an issue-resolution report, and a rule that unresolved critical issues block release.

---

## Plain-English Rationale

With WP3 removed, the proposal becomes focused enough to consider. It funds a public registry, reusable SDK tooling, and one serious DeFi primitive instead of trying to fund a full leverage-plus-options roadmap.

I would still not treat it as a normal grant. WP2 gives Dano commercial upside. The Treasury should receive stronger protection and stronger public assets.

**Conditional yes if the open-source, milestone, anti-gaming, audit, and Treasury-upside terms are tightened.**
