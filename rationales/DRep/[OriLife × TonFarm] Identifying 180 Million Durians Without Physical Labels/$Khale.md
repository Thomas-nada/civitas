<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmTG9Dae1gxQaPV68Hs2qsc7uDDs2dfjhzcCCqd9tptqys -->
# $Khale

**Proposal:** [OriLife × TonFarm] Identifying 180 Million Durians Without Physical Labels
**Vote:** Yes
**Voter ID:** `drep1y2ltat8kjqrmnff3lkkpxy0j5tn66d3m0gy64dc92asft5g6dl9ws`

---

I am voting YES on “[OriLife × TonFarm] Identifying 180 Million Durians Without Physical Labels.”
This proposal is a rare combination of real‑world urgency, technical maturity, modest treasury exposure, and strong governance safeguards.

Real regulatory demand in a large market
Vietnam’s durian exports to China exceed USD 3.3B/year, with China accounting for over 90% of export value. The 2025 scandal (17 people prosecuted, plantation codes revoked, thousands of containers delayed) showed how easily peelable QR labels can be reused to disguise unregistered or contaminated fruit.
Circular 11/2026/TT‑BCT now legally requires food production establishments to connect to a national Traceability System and provide records from 1 December 2026, with sanctions for non‑compliance.
Existing traceability deployments (e.g., TE‑FOOD) have operated at scale in Vietnam but remain label‑based and therefore vulnerable to exactly the fraud that triggered the scandal.
OriLife responds to this with a label‑free, legally driven model:
Adoption is driven by farm‑level legal obligation, not voluntary enterprise subscriptions.
Bio‑ID uses the fruit’s skin texture as the identifier, so there is no label to peel and reattach; the fraud vector is closed at its source.
This is precisely the kind of high‑stakes, non‑discretionary real‑world use case I want Cardano to be involved in.

Proven team and technical maturity
The Alliance has already done the hard learning:
In 2024, TonFarm deployed QR‑based traceability on TON across multiple farms in Đắk Lắk, manually attaching labels and hashing each fruit individually on‑chain, only to see that model fail on detachable labels, centralized mutable databases, and linear per‑fruit costs.
From that, they built durable assets: two harvest seasons of UX with older farmers, institutional trust across 46 communes, standardized onboarding, offline queue logic, and a formally registered copyright for the ongoing work.
The current stack is already live or prototyped:
Bio‑ID demo at orilife.io shows the fruit‑fingerprinting working on real images.
VeData batching has been tested on Cardano preprod, committing batched fruit state changes in a single eUTxO transaction.
LampNet and PhoenixKey prototypes are online, with open‑source code available.
The three companies cover field operations, R&D/IP, and product/UX, and have already self‑invested roughly USD 500k before this governance action. That’s a credible base to build from.

Scope, cost, and Cardano fit
The ask is 2,400,000 ADA, anchored at USD 0.25/ADA (~USD 600k).
Targets at full scale (M7):
12,000 ha, ~12,000 farm households, 24,000 PhoenixKey DIDs, ~1.2M trees, and ~180M fruits per season.
Around 1.0–1.2M on‑chain events per year, primarily VeData anchors and setup; commercial escrow and labor‑contract modules are optional, used where their dispute‑resolution value justifies the fee.
Approximately 75,000 ADA permanently locked at M4 in farm NFTs, wallets, and escrow contracts.
Technically, the design makes good use of Cardano:
VeData uses eUTxO + sparse Merkle trees to batch up to ~15,000 fruit updates into a single transaction, bringing per‑fruit cost down to ~USD 0.000009 at ADA 0.25—roughly 19,000× cheaper than the previous one‑tx‑per‑fruit model on TON (~USD 0.17/fruit).
LampNet applies a five‑layer validation pipeline (device, image authenticity, GPS bounds, timestamp, biological plausibility) before any data hits Cardano, and Hydra heads further optimize decommit throughput.
PhoenixKey builds on Cardano’s W3C DID stack, and Midnight is planned for ZK proofs and view keys; if Midnight is delayed, trade‑secret fields remain off‑chain while consumer‑facing data stays on L1.
This is a textbook example of Cardano’s primitives being used for what they were designed to do: high‑integrity, cost‑predictable state commitments and standards‑aligned identity.

Governance, ADA‑price handling, and treasury protection
The governance and risk controls are unusually strong:
Funds are held in Intersect‑managed escrow contracts, with per‑milestone releases only on 2‑of‑3 IOB signatures.
The initial M0 advance (360k ADA) can be clawed back if M1 is not submitted within 90 days; a missing 30‑day spending report freezes subsequent milestones.
Overdue milestones automatically return ADA to the Treasury; project termination triggers a sweep of all remaining ADA back within 14 days.
ADA‑price risk is explicitly handled:
At or above 0.25: full planned scope executes.
Below 0.25: the Alliance commits to self‑funding the shortfall rather than shrinking scope.
Above 0.30: surplus first reimburses prior self‑funding, then goes to contingency or ecosystem reinvestment.
This gives the treasury protection against both downside and unearned windfalls and ensures scope is not quietly cut if the price moves against the proposers.

Responding to ROI and “fit” objections
I’ve read the NO rationales carefully (YUTA, EMURGO, Socious, TriangleForces, Army of Spies). I agree this is not a “pure financial ROI” proposal:
The direct fee stream to L1 (~28–29k ADA/year at scale) is modest relative to the ask, and the MAGIC economy is a relatively closed loop.
Farmers and exporters, under legal pressure, may be able to fund similar infra commercially without treasury involvement.
Where I differ is in how I interpret the treasury’s role and the returns here:
For a ~2.4M ADA risk, Cardano gets a credible chance at being the backbone for a legally mandated traceability system in a USD 3B+ export sector, plus locked ADA, tens of thousands of DID‑backed users, and a high‑quality reference deployment.
The ongoing costs are not treasury‑subsidized; users pay on‑chain fees in MAGIC credits denominated in VND, and the system is designed to be economically competitive with existing label and RFID solutions.
The proposal is one of the most thoughtful I’ve seen in terms of price hedging, clawbacks, and milestone‑based disbursement, which substantially limits treasury risk.
Given the scale of the problem, the regulatory pull, and the modest size and structure of this ask, I judge this to be a reasonable, bounded risk to take in order to showcase Cardano in exactly the kind of real‑world, legally enforced supply‑chain context the ecosystem needs.
For these reasons, I am comfortable voting YES on this proposal.
