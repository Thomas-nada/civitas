<!-- url: https://dreptalk.com/vote-rationale/20441fcd7ced60fe463d2197be727380e9f8560337086b61704bc52fddf7da6d.json -->
# CardanoLeo

**Proposal:** Reduce minPoolCost to 75 ada
**Vote:** Yes
**Voter ID:** `drep1y28xhrjxe496rnle8ln3slpggnp8leu3mn244ujrhwet0cc2vmte4`

---

**Vote: YES**

I support reducing `minPoolCost` from **170 ada to 75 ada**.

---

### **1. Core Incentive & Arbitrage Mechanics**

The strongest case for this change is not delegator yield — **it's incentive design**. A high fixed-fee floor rewards single-block pools disproportionately: as long as a pool produces at least one block in an epoch, it draws the full fixed fee out of that block's reward before anything is split with delegators. The fewer blocks a pool produces, the larger a share of its reward the floor consumes.

A well-capitalized operator can exploit this by splitting stake across many single-block pools rather than consolidating into fewer, better-performing ones, collecting the floor repeatedly instead of once. **Lowering the floor directly weakens that arbitrage.**

This matters more for genuine decentralization than pool count itself:

* Of the **1,614 active pools** referenced in this proposal, **873 sit below the delegation threshold** needed for consistent block production.
* *Note:* The underlying incentives report doesn't break that 873 down by cause. Some share reflects fee-farming of this kind, while some reflects other factors like sticky delegation or insufficient network-wide stake to saturate more pools. While I don't have a precise split, the incentive distortion itself is real regardless of the mix.

---

### **2. Impact on Small, Independent Pools**

I don't think **75 ada** meaningfully changes the survival odds of a small, genuinely independent pool. At current ada prices, that is roughly two days' worth of the fixed fee over a five-day epoch — well below the operating cost of a properly run node, regardless of where the floor sits.

The argument that this reduction *"saves small pools"* is weaker than the argument that it **removes an outsized payout specifically for single-block operation**.

---

### **3. Empirical Precedent (2023 Reduction)**

The 2023 precedent (**340 ada → 170 ada**) is relevant evidence here:

* The feared *"race-to-the-bottom"* in operator pricing didn't materialize.
* **340 ada** remained the dominant fee setting among established pools.

This history gives the current reduction an empirical basis rather than a purely theoretical one.

---

### **4. Key Reservation & Structural Timeline**

My one reservation: this reduction is explicitly framed as an interim step ahead of a proportional `minPoolMargin` ([CIP-0023](https://www.google.com/search?q=https://cips.cardano.org/cips/cip23/&utm_source=gemini)), which by current sequencing is still roughly two hard forks away.

**I would like to see Intersect and the Technical Steering Committee (TSC) commit to a concrete timeline for that structural work**, ensuring this floor doesn't become a permanent substitute for the more complete fix it is meant to bridge toward.

---

### **Conclusion**

I am voting **YES** on the substance of the case as submitted, with the expectation of a clear CIP-0023 timeline noted for the record.

---

### **DRep Delegation Info**

* **CIP-1694 DRep ID:**
```text
drep1y28xhrjxe496rnle8ln3slpggnp8leu3mn244ujrhwet0cc2vmte4

```

* **Legacy DRep ID (CIP-105):**
```text
drep13e4cu3kdfwsul7fluuv8c2zycfl70ywu64d0ysamk2m7xrv7rsv

```
