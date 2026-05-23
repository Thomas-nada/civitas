<!-- url: ipfs://QmV9vYBYt1fQCTscWrcfAAGvDkkxa4awVe4WxRaAJNebrh -->
# HOSKY

**Proposal:** IO Cardano Upgrades
**Vote:** Yes
**Voter ID:** `drep1yf2jzhuc4f7eu2yay9d9ta3dykxxcwn34wz8kak7nhd7vcgrxn7ns`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmWqjUcBnsMbn86grgo5fWd1Ym3ZHr8zzco8GGYJSLPJ4i

## Vote: Yes

₳13.10M for three coordinated platform-level upgrades: CIP-159 Account Address Enhancement, CPS-23 Multi-Asset Treasury CIP design, and Babel Fees. Each removes a concrete barrier to adoption and ecosystem economics.

The HOSKY Cardano First framework reads strongly across multiple pillars.

## Pillar Analysis

### Adoption (lead pillar)

Babel Fees lets users pay transaction fees in any Cardano native asset (USDC, bridged BTC, stablecoins) instead of requiring ADA first. For Bitcoin holders bridging in and stablecoin users entering DeFi, this removes the most concrete friction point in onboarding.

CIP-159 lifts the minUTxOValue floor that today blocks wallets from charging micro-fees, which directly enables wallet product-market fit on Cardano fees. Cheaper batcher and aggregator economics follow from the same change.

### Economic Sustainability

CPS-23 Multi-Asset Treasury begins the CIP design work to let the Cardano Treasury hold stablecoins alongside ADA, which directly addresses ADA-price-volatility exposure on multi-year treasury budgets. The Eternl proposal in the broader budget surfaces exactly this problem ($133k short of the proposed USD amount due to ADA price decline). Multi-Asset Treasury is the structural fix.

Babel Fees creates a new SPO revenue stream (10 to 50% markup on fee conversions), broadening SPO economics beyond staking rewards.

### Scalability (indirect)

CIP-159 provides the account primitives that L2 solutions need to manage user-deposited ADA reserves cleanly. Not a throughput pillar in itself, but the L1 plumbing that L2 economics require. Direct enabler for the Midgard-class rollup workstream and any future Cardano L2 that manages user funds.

### Governance Transparency

Standard Intersect 2025 TRSC pattern: milestone-gated disbursement, third-party Assurer, unspent funds return to Treasury. Same shape as Pebble + Gerolamo, Dingo, Amaru, and the Plutus collaboration.

The IO and Ensurable Systems collaboration distributes delivery between two teams. CIP-159 Phase 1 is targeted for Dijkstra (cardano-node-12.x, Q3 2026); Babel Fees rides on top of the separately funded CIP-118 Nested Transactions primitive; CPS-23 design feeds into a future implementation cycle.

## Risks I'm Accepting With This Yes

### Bundle of three workstreams at different maturity levels

CIP-159 is concrete protocol work targeted for a specific era. WS2 (Multi-Asset Treasury) is CIP design only, not implementation. Babel Fees depends on separately funded CIP-118 Nested Transactions. The legs deliver standalone value but the bundle hides cross-leg dependency risk.

### Hard-fork timing

CIP-159 needs Dijkstra to actually land. If Dijkstra slips, the engineering is complete but economically inert until activation. The funded work has standalone value either way.

### WS2 is design, not implementation

Multi-Asset Treasury is the CIP specification work; the actual treasury changes are downstream and will need separate funding. A Yes here is not a Yes on the future implementation ask.

### Babel Fees deployment is contingent on CIP-118

Babel Fees is built on top of Nested Transactions. If CIP-118 implementation is delayed, Babel Fees cannot deploy regardless of what this proposal funds.

### Slate aggregation

Part of the roughly ₳141.9M IO slate across seven actions. Each action stands alone.

## Bottom Line

Foundational L1 work that pays back to every wallet, DApp, and onboarding flow on Cardano. **Yes.**
