<!-- url: ipfs://QmNVuvpMzEWE4iJ4AzUuEgkbUAH6wCC96AKcZ14YVEiAEj -->
# HOSKY

**Proposal:** IO Hydra
**Vote:** Yes
**Voter ID:** `drep1yf2jzhuc4f7eu2yay9d9ta3dykxxcwn34wz8kak7nhd7vcgrxn7ns`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmXvqW5ajvDfxSy7exTL2wy1BjHEmxkSPyc2Uf7mknrCTD

## Vote: Yes

5,100,781 ADA to harden Hydra v2 into a feature-complete, production-grade Layer 2: sub-second finality, near-zero fees, and high throughput, with Cardano L1 as the settlement backstop. This action has been separated out from the broader bundled IO ask, which is the right call and part of why it earns a clean Yes: Hydra can now be judged on its own merits rather than carried or dragged by unrelated workstreams. The Cardano First framework reads strongly, led by Scalability.

Hydra is important and needed. It is the only production-grade L2 Cardano has, and it is already running real workloads rather than asking the treasury to fund a hypothesis.

## Pillar Analysis

### Scalability (lead pillar)

This is as direct a Scalability case as the framework gets. Cardano L1 finalises in minutes to hours at roughly $0.17 per transaction and 7-10 TPS, and high-performance verticals (DeFi, agent micropayments, gaming, consumer payments) exclude Cardano at the selection stage because of it. Leios and Peras will expand the base layer, but by the constraints of the scaling trilemma the L1 cannot reach the zero-fee, sub-second envelope that these applications require. Hydra closes that gap today as an L2 that extends L1 rather than competing with it, anchoring activity back to L1 through head opening and settlement. Funding v2 hardening is funding the one scaling lever that is already live in production.

### Adoption

The adoption evidence is concrete and on-chain, not projected. Delta DeFi runs its entire perpetual-DEX product on Hydra, Masumi runs live agent-to-agent commerce with co-signed snapshots, Glacier Drop routed more than 30 million users through it, and Intersect's own voting infrastructure runs on it, with Blockfrost, VTech Labs, and Midgard building on top. A hardened v2 lowers the integration barrier for the provisional users under evaluation (Bodega, Atlas DeFi, Wingriders, and others). This is infrastructure with a real and growing user base.

### Governance Transparency

The disbursement structure is the standard milestone-gated Intersect TRSC pattern with independent third-party assurance, and the unbundling itself is a transparency win: DReps vote on Hydra as a discrete, accountable line item with its own milestones and KPIs rather than as one strand of a multi-workstream bundle. The KPI alignment (TVL, transactions, active users, throughput, reliability, protocol revenue) gives the community measurable acceptance criteria.

### Economic Sustainability (contested)

At 5,100,781 ADA this is a grant, not a loan, so it carries the usual mark against the pillar: no contractual principal return. Two things make it acceptable. The amount is modest relative to the infrastructure it hardens, and the design explicitly supports routing a portion of in-head fees to the L1 treasury on settlement, so Hydra activity can reinforce rather than only consume the base-layer economy. The milestone gating and Intersect administration bound the downside in the standard way.

## Risks I'm Accepting With This Yes

### IOG-led core infrastructure

The proposer is Input Output, so this deepens reliance on the largest incumbent for a critical piece of the scaling stack. I am accepting this because Hydra is open-source core infrastructure with an external user base already depending on it, the work is administered by Intersect rather than self-administered, and the alternative (leaving the only production L2 under-resourced) is worse for the ecosystem than the concentration cost.

### Grant with no repayment

Recovery depends on milestone non-delivery sweeping funds back, not on revenue or repayment. I am accepting this because production scaling infrastructure is a public good in the same category as the core tooling withdrawals HOSKY has already supported, and the optional L1 fee-routing mechanic gives it a sustainability story that pure grants lack.

### L2 settlement and security assumptions

Hydra's guarantees rest on participants co-signing snapshots and on correct L1 settlement; a feature-complete v2 is still maturing security-critical paths. I am accepting this because the funding is specifically for hardening and operational excellence, with independent assurance gating the milestones.

## Bottom Line

The only production-grade L2 on Cardano, already carrying real workloads, now unbundled so it stands on its own, funded at a modest milestone-gated ask to harden v2. Scalability and adoption are unambiguous, the grant economics are the cost. **Yes.**
