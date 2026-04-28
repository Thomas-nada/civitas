<!-- url: ipfs://bafkreifiaxw6vhm6slbjl5vmymmxu2fypx3qsgzpzam2ksgf3lebg4vm3e -->
# Cardano Cypherpunks

**Proposal:** Pogun Capital Without Compromise
**Vote:** Abstain
**Voter ID:** `drep1y23wk4w6f2aumc92vl9m3x74xzm6jh4ha9wdq09yfq2sl6q8zlv4l`

---

1. Core thesis — correct, but not unique

They’re right about the opportunity:

Bitcoin = largest idle collateral pool in crypto
Lending = highest monetization layer
Current solutions = structurally flawed (margin-based, oracle risk)

That part is solid.

But:

This is not a unique insight anymore.
There are already:

BitVM-based designs
BTC L2s (Stacks, Botanix, etc.)
Wrapped BTC ecosystems on Ethereum and others

So you’re not funding a category creation — you’re funding a race.

2. The biggest red flag: execution risk (very high)

This is a 3-layer stack with tight coupling:

Credit market (moderate difficulty)
Yield routing (moderate difficulty)
BitVM bridge (extreme difficulty)

The proposal only works economically if ALL THREE succeed.

That’s a classic failure pattern:

bundled dependency risk

Especially:

BitVM is still early-stage engineering
Their custom BABE + Groth16 + Mithril stack is non-trivial to productionize
“1-of-N security” sounds great, but operational reality is messy

If the bridge fails → entire thesis collapses

3. Return model: looks good, but is weak in practice

On paper:

20% EBITDA until repayment
then 5% perpetual

Sounds attractive. In reality:

EBITDA is fully gameable
Costs can be inflated (engineering, infra, “growth”)
No enforcement mechanism beyond reporting

So economically:

This is still a grant with a soft promise of returns

If you want real treasury ROI, you need:

revenue share on gross fees, not EBITDA
or on-chain enforced fee split
4. Institutional narrative is overstated

They lean heavily on:

“institutions want non-liquidation credit”

True in TradFi.

But in crypto:

Institutions already use:
OTC desks
CeFi lenders
structured products

And critically:

They care more about custody risk than liquidation mechanics

So the real blocker is:

bridge + custody trust model

Which is the hardest part of this proposal.

5. KPI projections are aggressive to the point of being unreliable

They claim:

Base case: $450M TVL by 2027
Bull case: $765M TVL

That implies:

capturing a meaningful share of BTCfi
onboarding institutional capital
beating competitors on other chains

Given Cardano’s current position in DeFi:

This is optimistic bordering on unrealistic

6. What is actually good here

To be precise — there are strong elements:

Non-margin lending model → genuinely differentiated
Bond-token concept → interesting primitive
Treasury return framing → directionally correct
Milestone-based funding → good structure

If this were just the credit market, I’d likely say yes.

7. Strategic evaluation (this is the key)

You need to think like a capital allocator:

What are you actually funding?

Not:

a product

But:

a high-risk venture bet in a competitive market
Does treasury have edge here?

No.

Treasury:

cannot pick winners reliably
cannot enforce execution
cannot capture upside effectively
8. What would make this a YES

You could fix this proposal with 3 changes:

Split the proposal
Fund credit market first (~₳3–5M)
Bridge only after proven traction
Hard revenue share
% of protocol fees on-chain (not EBITDA)
Kill or isolate BitVM dependency
Or make it a separate, later governance action
Bottom line
Concept: strong
Market: real
Design: ambitious
Execution risk: extremely high
Treasury structure: insufficiently protected
