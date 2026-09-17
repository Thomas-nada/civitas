<!-- url: https://dreptalk.com/vote-rationale/ed575735648c4ce15db5eafa68638927f9d8df4974c343dafbeacde5354ac685.json -->
# CardanoLeo

**Proposal:** Withdraw 11,787,063 ada for the OpenZeppelin Stack administered by Intersect
**Vote:** No
**Voter ID:** `drep1y28xhrjxe496rnle8ln3slpggnp8leu3mn244ujrhwet0cc2vmte4`

---

**Vote: NO**

I support OpenZeppelin coming into Cardano. A reusable, audited contracts library would raise the baseline quality of what gets shipped here, and the trust OpenZeppelin already has with EVM developers is not something Cardano can create on its own. **I am voting against this proposal, not against the firm, and not against the work itself.**

---

### **1. Overlap with work already funded**

The treasury is not choosing between two sketches. IO’s *Developer Experience Initiative* (₳3,601,926) was enacted on May 29, 2026. The Q3 2026 deliverable is explicit: a `ContractsLibrary` *"inspired by OpenZeppelin’s role in the EVM ecosystem,"* with at least five ready-to-audit contracts. The public repo (`input-output-hk/contracts-library`) says the same thing.

* About **3.6 million ada** is already committed to an OpenZeppelin-style library.
* This proposal asks for another **11,787,063 ada** for a second library of similar scope.

The text mentions working with IO, but it **does not publish a gap analysis**, nor does it specify which library teams should treat as the standard. Q3 2026 is when the first library is due. The sensible order is to evaluate what that grant actually delivered, then decide whether a second library is worth buying. Until those questions are answered, this is not complementary work so much as the risk of paying twice.

---

### **2. The smart contract language is still unset**

Workstream B states that the specific smart contract language will be decided during the initial evaluation phase. For a contracts library, that choice **is close to the core product itself** — it determines who can import the code and whether it fits the toolchain teams are actively using.

The proposal requests **USD $1,831,000 upfront** while leaving the language selection until *after* funding is secured. With the language unset, there is no reliable way to assess whether the library will align with what developers are actually building.

---

### **3. Surplus from the stablecoin conversion is not addressed**

The budget uses **USD $0.16 per ada** as a reference rate. The full delivery amount of **11,443,750 ada** converts at contract signature, rather than converting only the necessary amount to reach USD $1,831,000. At a recent spot price near **USD $0.196**, that conversion yields approximately **USD $2.24 million** — roughly **USD $410,000 (22%) above** the stated delivery budget.

A conservative reference rate is reasonable, but converting the entire ada amount regardless of spot price is a distinct financial choice that the proposal fails to explain. It specifies only two mechanics:

1. The full delivery amount converts at signature.
2. Unused funds sweep back to the treasury at expiry.

*Sweep* simply means the smart contract returns remaining funds when the term ends — it is not an immediate swap or return mechanism. What happens to the surplus generated at conversion (*returned immediately, retained in the contract, or made accessible to the vendor*) is completely unwritten. Until this gap is closed, the treasury is being asked to approve an over-provision with no formal rule governing the extra capital.

---

### **4. The security retainer is a vendor self-review**

Workstream C is scoped exclusively to OpenZeppelin-produced code. Audit costs sit within overhead, pointing to Intersect’s administration fee as oversight. However, Intersect handles disbursement and milestone verification — **not an independent technical review of the contracts.** This withdrawal sets aside no dedicated capital for a third-party code audit.

*Note: This point does not rest on Article II.7.4 (which governs periodic financial/fund-use audits).* My view is distinct: for a **USD $1.83 million library** intended for ecosystem-wide adoption, vendor self-review is insufficient. **Independent technical audits should be scoped and funded separately**, rather than folded into the vendor's internal security retainer.

---

### **Conclusion & Next Steps**

OpenZeppelin has explicitly stated that if this proposal does not pass, they will gather community feedback and submit a revised version. A **NO** vote is therefore inexpensive — it requests a clearer scope and a tighter financial/technical structure without asking OpenZeppelin to leave Cardano.

I welcome a revised submission. At a minimum, a revised text should:

* **Spell out the division of scope** with the already-funded IO `ContractsLibrary`, specifying which standard teams should adopt.
* **Finalize the smart contract language** prior to requesting funds.
* **Convert only the ada required** at spot rates upon milestone release, returning any conversion surplus immediately.
* **Fund an independent third-party technical audit** separately from the vendor's internal security review.
* **Stage the three workstreams sequentially** rather than bundling them into a single all-or-nothing engagement.
