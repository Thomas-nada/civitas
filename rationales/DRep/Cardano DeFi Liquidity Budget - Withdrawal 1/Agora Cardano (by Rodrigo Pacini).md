<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmNU7wkRJ4v757FyF8ECYz2i8CZ7oJtuBgtpUcyjBkj8B4 -->
# Agora Cardano (by Rodrigo Pacini)

**Proposal:** Cardano DeFi Liquidity Budget - Withdrawal 1
**Vote:** No
**Voter ID:** `drep1yt9dq806jcm56wzhnv2yrf6gcyq7h4gap8gxewfykk0dtfs7vf843`

---

# Governance Action Report

## 1. Introduction

A Treasury Withdrawal governance action requests **500,000 ADA** from the Cardano Treasury to establish the legal framework and smart contract infrastructure required for the **Stablecoin DeFi Liquidity Budget**. The withdrawal covers three components: **(1)** formation of a **Cayman Islands Foundation Company (FC)** as the legal vehicle for fund management, **(2)** development of an administrating smart contract and user interfaces, and **(3)** a comprehensive security audit of the smart contract system.

All funds are to be received by an **Amaru contract** administered by a **9-person Interim Committee** with a **5-of-9 multisignature** requirement for disbursements. Named service providers include **Walkers (Cayman) LLP** for legal work, **Invariant0 LLC** for auditing, and **Sundae Labs** for Amaru contract setup and support. The proposal includes an ADA-denominated cost breakdown, notes that some values (e.g., director fees) are estimates, and states that monthly reporting and on-chain oversight mechanisms will apply.

---

## 2. Governance Action Analysis

### Positive aspects

**1) “Rails first” structuring (governance and controls before large capital deployment)**

Building the legal structure + contract + audit + governance before releasing the bulk of the capital signals operational maturity.

Separating “setup” (500k ADA) from “capital deployment” (49.5M ADA) reduces the risk of “releasing everything” without:

an audited contract,  
a legal framework,  
selection processes,  
oversight mechanisms.

From a governance standpoint, this aligns with the idea that the treasury should fund institutional infrastructure when it increases auditability and discipline.

**2) Internal coherence and governance design with checks**

The original Info Action lays out a relatively complete model:

5-of-9 multisig for executive actions,  
a dRep-based tDAO with impeachment, election, and shutdown powers,  
the ability to freeze operations and allow only return-to-treasury flows.

Having the contract hold LP tokens and assets increases on-chain auditability (at least in theory), because tracking fund state and protocol positions becomes easier.

**3) Stablecoin liquidity has a plausible economic rationale**

Stablecoin liquidity is often a real bottleneck for:

onboarding,  
lower-friction trading,  
lower slippage,  
greater attractiveness for market makers,  
higher DeFi composability.

A slippage reduction KPI (e.g., “50% reduction”) connects to practical utility for users and traders and can be interpreted as a collective benefit (not only for a single app).

**4) Attempt to avoid a “pure grant” (treasury return narrative)**

The design mentions revenue return to the treasury (e.g., 15% of monthly revenue converted and sent; annual return expectations).

This creates a “treasury deployment with return” narrative rather than “treasury donation.”

In theory, this is closer to “capital allocation” than “subsidy with no consideration.”

### Negative aspects

**1) Constitutional risk and institutional transition risk (nullification)**

The Treasury Withdrawal was submitted during a period when a new Constitution was being voted on.

If constitutional changes alter requirements, the action may become invalid or require rewriting.

This is not a legal detail. It is a direct governance risk. If CC members were already voting against it, the probability of being blocked was high early on.

**2) “Info Action as authorization” does not hold under the new Constitution**

The CC critique is coherent: under the current Constitution, Budget Info Actions are non-binding and therefore cannot “authorize” or “ground” a withdrawal.

If the Withdrawal depends on “approved by Info Action” as its legitimacy base, it starts with a structural defect.

Without a transition/grandfathering clause, the CC tends to evaluate only the current text and require the Withdrawal to be self-contained, without “references as substitutes.”

**3) Mutable documentation (GitHub) vs immutability requirement**

If supporting documentation points to mutable URLs, this violates an explicit constitutional immutability requirement (as alleged by some CC members).

Even with a “commit hash,” if the primary URL or evidence package is not explicitly immutable, it remains vulnerable to:

later content changes,  
ambiguity about which version was “approved.”

This compromises integrity and verifiability.

**4) Severe institutional problem: KPIs and commitments outside the binding document**

A central point: with Info Actions losing normative effect, everything not inside the Treasury Withdrawal does not exist as an enforceable commitment.

If KPIs (slippage, returns, reporting) stayed in the Info Action and were not carried into the Withdrawal:

they cannot be enforced,  
continuity cannot be conditioned,  
ex post claims that “they promised” cannot be justified.

This destroys accountability. What remains is reputational trust, which is the opposite of robust governance.

**5) Conceptual issue: “DeFi” label vs centralized execution**

The naming is criticized: calling it “DeFi Liquidity Budget” can mislead perception.

Execution is centralized:

committee,  
legal structure,  
integration with desks/OTC,  
administrative decisions.

The community may interpret “DeFi” in the strong sense (operational decentralization), but the mechanism looks closer to an administered fund with governance.

This matters because many people vote on headlines, not full reading.

**6) Overlap / double funding with already-approved initiatives (PentaD as example)**

A medium-weight argument is raised: another large initiative is already approved and funded with the objective of integrations and improvements that tend to impact liquidity and attractiveness.

Even if it is not “the same thing,” there is overlap in outcomes:

stablecoin/integrations may increase liquidity indirectly,  
improved on/off-ramp infrastructure and partnerships may change the landscape.

If significant capital is already allocated to this “vector,” adding another 50M on the same axis may be inefficient.

**7) Structural critique: subsidy for commercial niche and market distortion**

This is treated as a high-weight argument:

Treasury funding for open source/public goods makes sense (market failure, low commercial appeal).

Treasury funding for commercial projects should require harder consideration (equity-like, loan, robust revenue share, or another mechanism that internalizes risk).

Subsidizing liquidity may become a band-aid that:

does not solve the structural cause of DeFi weakness in Cardano,  
creates dependence on incentives,  
repeats market patterns (temporary yield farming, mercenary liquidity).

DeFi in Cardano has had enough time (years) and many initiatives have already failed. Before allocating more, there should be:

a diagnosis,  
a retrospective,  
an evaluation of historical ROI,  
an understanding of what went wrong.

**8) Proposed return is low for high risk (poor risk/return profile)**

The annual return KPI (e.g., 4%) looks low relative to:

stablecoin depeg risk,  
impermanent loss risk,  
oracle / market structure risk,  
committee operational risk,  
regulatory/jurisdictional risk,  
smart contract / bridge / custody / desk risk.

A comparison is made implicitly to conservative real-world alternatives where similar returns do not require this degree of operational and crypto-specific risk.

Result: too much risk for too little upside in terms of treasury return.

**9) “If it’s so good, VC funds it” argument**

A provocative but relevant point is raised:

If the risk/return profile were truly attractive and well-priced, private capital (VC/market makers) could fund it.

This reinforces the “treasury as subsidy” thesis: if the market does not fund it, risk-adjusted return may not be good enough, or the design depends on the treasury as a patient donor.

**10) Preference for investment in research and structural solutions**

A superior long-term alternative is suggested:

invest a fraction of this amount into research and development of DeFi models suited to eUTXO,  
architecture standards, tooling, primitives, design space,  
a decentralized and replicable approach.

This targets causes rather than symptoms (liquidity) and reduces dependence on recurring capital injections.

**11) Budget is still crude and weakly anchored to external references**

Notes such as “director fees estimated” and high-level breakdowns are flagged.

Even with auditor-days, the following are missing:

salary references,  
benchmarks,  
vendor quotes,  
robust justification for amounts.

For an “administrative/legal” phase, precision should be higher because this is where “governance and control” is being purchased.

### Risks and concerns

**1) Psychological trade-off: sunk cost trap (even if small vs total)**

Even if it is “only” 500k vs 50M (1%), there is still risk of psychological and institutional bias:

“we already spent on structure, so now we must go all the way.”

This effect is treated as minor, but acknowledged as possible. In governance, “minor” effects can become dominant narratives.

**2) Real risk of money loss due to non-binding sequence**

Because withdrawals are separate and non-binding, a plausible scenario exists:

Withdrawal 1 approved,  
structure built,  
Withdrawal 2 not approved due to market change, NCL ceiling, budget competition, or political support loss.

In that case, 500k becomes sunk cost and fails to achieve the macro objective.

This is not exotic: governance shifts quickly, especially with NCL revisited frequently.

**3) Technical and operational risks remain even with “anti-collusion”**

Even with reputation and governance mechanisms, risks remain:

collusion (5 signatures can be obtained),  
process failures (protocol/desk selection),  
conflicts of interest,  
human error in management,  
political capture of the tDAO,  
“soft corruption” via indirect incentives.

Mitigation exists, but risk does not go to zero. Capital size amplifies any failure.

### Potential impacts

**Economic —** Allocating 50M ADA now is a large share of the current NCL (without needing exact fractions). In a constrained environment, the evidentiary and return bar should be higher. The annual return KPI (e.g., 4%) looks low relative to the risk bundle (depeg, IL, oracles, operational, regulatory, technical). Subsidizing liquidity may create incentive dependence and repeat mercenary liquidity dynamics. If the market does not fund it, risk-adjusted return may not be strong, or the design depends on the treasury as a patient donor.

**Technical —** An audited contract is proposed, but technical and operational risks remain: depeg, impermanent loss, oracle/market structure, smart contract/bridge/custody/desk risk, plus process failures and human error.

**Governance / political —** Constitutional change may invalidate the action or require rewriting. Non-binding Budget Info Actions weaken the “approved by Info Action” base. Commitments outside the binding document reduce enforceability (KPIs, reporting, shutdown). Non-binding sequencing across withdrawals creates sunk-cost risk if the second stage fails. Risk of tDAO political capture and multisig collusion remains.

**Reputational —** “DeFi Liquidity Budget” may mislead perception while execution is centralized (committee, legal structure, administrative decisions). Many vote on headlines, not full reading.

---

## 3. Vote and Rationale

Vote: **NO**

The core of the negative vote is conceptual and economic, not only constitutional:

rejection of subsidizing a commercial niche in a constrained environment,  
high opportunity cost,  
low return for high risk,  
risk of repeating the pattern of subsidized DeFi initiatives that do not sustain.

Additionally, even if the concept were acceptable, the current design fails on formal governance:

dependency on a non-binding Info Action,  
absence of binding KPIs inside the Withdrawal,  
risk of “phase 1 approved, phase 2 rejected.”

**What could move toward ABSTAIN or YES (conditional, but unlikely)**

Macro change (more bullish market, more treasury slack).  
Size reduction (smaller share of NCL).  
More convincing and robust return to treasury (better risk/return pricing).  
KPIs, metrics, reporting, and shutdown conditions inside the binding document.  
Better-defined risk mitigations (depeg, IL, oracles, operational risk).  
Explicit coordination with already-approved initiatives, reducing overlap.  
A “post-mortem” / evaluation stage of past DeFi investment history before another large allocation.

---

## 4. Conclusion

Separating “setup” from “capital deployment” reduces premature release risk, but formal failures and economic risks remain: reliance on a non-binding Info Action, KPIs outside the enforceable document, sunk-cost risk across withdrawals, and a weak risk/return profile for subsidizing a commercial niche in a constrained environment.
