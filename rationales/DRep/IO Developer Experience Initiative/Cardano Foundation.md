<!-- url: ipfs://QmUCsGQCZEuJv1erBVwcLcbeuPaLoSdw32U7CH6Db5qv5v -->
# Cardano Foundation

**Proposal:** IO Developer Experience Initiative
**Vote:** No
**Voter ID:** `drep1ydpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsjaelx`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmXR142pkGiPyqPBDGgvfr4vLtWaAAkEevFNzxkuzvRunZ

We have decided to create a unified document to record our votes as many of the initiatives are connected. 

We invite the proposers and anyone else from the Cardano Community to carefully review our individual rationales below per proposal, as well as the following table.

| Governance Action Title | CF DRep Vote |
| :---- | :---- |
| 97\. IO \- Developer Experience Initiative | NO |
| 98\. IO \- Cardano Upgrades | YES |
| 99\. IO \- Consensus Initiative | YES |
| 100\. IO & Ensurable Systems \- Cardano Maintenance Initiative | ABSTAIN |
| 101\. IO & Midgard Labs \- L2 Scalability Initiative | ABSTAIN |
| 102\. IO \- Cardano High Assurance Technical Collaboration | YES |
| 103\. IO & VacuumLabs \- Enhancing Plutus \- Performance, Correctness, and Usability | NO |
| 104\. Blockfrost \- Maintenance and Next Generation Indexing | NO  |
| 105\. Pogun \- Capital Without Compromise | YES |

### **Individual Rationales**

The following section contains all nine individual voting rationales for the above-mentioned proposals.

#### **97\. IO \- Developer Experience Initiative**

##### **Summary**

The Cardano Foundation votes NO. We are eager to collaborate on DevX, but this proposal is expensive, lacks financial granularity, and risks duplicating ecosystem efforts. We encourage returning with a leaner, more detailed, and coordinated resubmission addressing the points as recommended below.

##### Rationale Statement

We recognize that developer onboarding is a critical vertical, and we appreciate the proposers targeting legitimate ecosystem pain points. While we fully support the overarching goals, we cannot approve this treasury withdrawal in its current form due to the following structural and financial concerns:

1. **Costs Lacking Granularity:** The request for approximately 900k USD is exceptionally high for a 6-month timeframe. The budget lacks a meaningful Full-Time Equivalent (FTE) breakdown, allocating 81% to a broadly categorized "Development & Engineering" bucket. This makes it difficult to distinguish between community bounties, hackathon prizes, and administrative overhead, hindering our ability to evaluate financial proportionality.Creating CLI tooling, cleaning documentation, and building contract templates can be achieved in a cost-effective way which does not require a budget of this size.  
2. **Overlap with Active CF and Intersect Initiatives:** The proposal intends to restructure the "Developer HUB" using the Developer Portal as its primary entry point. The Developer Portal is already actively maintained, funded, and strategized by the Cardano Foundation alongside Intersect committees. While we are highly receptive to ecosystem contributions, requesting nearly 900k USD to duplicate or restructure ongoing work is inefficient. We would welcome collaboration on this workstream to improve cost efficiency.  
3. **Severe Execution Risk:** The proposal requests funding for only six months. The proposer indicates that the engineering team for these workstreams has not yet been established and will be hired using the funds released from this withdrawal. Setting up a new team and familiarizing them with the necessary ecosystem intricacies will conservatively consume a significant portion of this short timeframe, jeopardizing the delivery schedule. A future proposal would be significantly strengthened by establishing an upfront execution structure. Clearly identifying, aligning, and sharing ownership with ecosystem partners from the outset ensures precise accountability for all deliverables.  
4. **Lack of Long-Term Ownership and Maintenance:** There is no clear transition strategy for the resulting products (such as cardano-init or the contracts library) after the initial six-month funding period. The ecosystem requires continuous, ongoing feedback and maintenance for developer tools, rather than a highly expensive, short-term sprint that risks leaving behind abandoned infrastructure if subsequent funding is not secured.  
5. **Open Source Fragmentation:** While cardano-init is explicitly designed as an aggregation layer to unify and elevate existing ecosystem tools rather than replace them, its long-term value hinges heavily on sustained community buy-in. The proposal’s strategy for allocating bounties and incentives to existing tool maintainers is a strong step toward coordination. However, the primary risk shifts from community fragmentation to the execution of integrations: we must ensure that external toolmakers actively maintain these integrations over time so the aggregator remains a reliable, up-to-date entry point for new developers.

##### Conclusion

The Cardano Foundation votes NO. While the ambition to improve Cardano's developer experience is valued, this proposal's steep cost, execution risks, and overlapping scope prevent us from approving it in its current form. To secure approval, a resubmission must be leaner, more cost-effective and provide a granular FTE budget breakdown for financial transparency. It should also integrate with active Cardano Foundation and Intersect initiatives to avoid duplicating ongoing work, establish an execution structure with a pre-identified team to ensure delivery within the tight six-month window, and outline a strategy for long-term maintenance and community buy-in.

#### **98\. IO \- Cardano Upgrades**

##### **Summary**

The Cardano Foundation votes YES. CIP-159, CPS-23, and Native Babel Fees have potential to improve L2 reserves, protect against volatility, and improve onboarding. Despite certain budget and execution concerns, we view the 13.1M ada ask as an acceptable investment.

##### **Rationale Statement**

We recognize the impact these three platform-level capabilities will have on Cardano’s economic models and ecosystem growth. We are voting YES based on the following technical and strategic assessments:

1. **Critical Infrastructure and Economic Resilience:** The CIP-159 (Account Address Enhancements) upgrade bridges the gap between UTXO and Account models. By solving the minUTxO constraints, it enables micro-fee collection, cheaper DeFi batcher operations, and introduces new smart contract paradigms more familiar to EVM developers. Furthermore, it is a prerequisite for seamless L2 reserve management. CPS-23 (Multi-Asset Treasury) enables the Cardano Treasury to hold stablecoins or other native assets, which is a next step for long-term sustainability. It could protect the ecosystem's funding runway from ADA price volatility and introduce the potential for diverse treasury holdings.  
2. **Native Babel Fees and Onboarding:** While non-native (smart contract-based) Babel fees currently exist within the ecosystem, they have struggled to gain significant traction. Allowing users to interact with Cardano DApps using stablecoins or bridged assets without first acquiring ADA will hopefully be a driver for mainstream institutional and retail adoption.

3\. **Feedback for Ongoing Alignment:**  While we support funding this initiative, there are elements of this proposal which raised concerns and we wish to offer feedback.

Implementing CIP-159 fundamentally alters Cardano's accounting model. With alternative nodes like Amaru and Dingo actively in development, introducing such massive ledger changes requires careful coordination. Making frequent, significant modifications directly onto the Layer 1 core ledger introduces substantial maintenance fatigue for open-source builders, which can be lessened with coordination. We urge IO to collaborate to establish a clear framework for alignment with other node implementation and material downstream tooling teams to prevent consensus fragmentation.

Workstream 2 allocates roughly $565,000 USD primarily to design and draft the Multi-Asset Treasury CIP. For a design-phase deliverable, this is a premium investment. We expect this effort to feature rigorous, high-quality deliverables, contributions to improvements to the overall CIP process and extensive community consultation to reflect the amount.

Workstream 3 includes integration with the Lace wallet. Given the use of treasury funds, we expect the IO team to ensure that the underlying infrastructure for Native Babel Fees is open and easily accessible for all ecosystem wallets, Tx builders (e.g., Mesh, Lucid Evolution), and indexers, rather than focusing support solely on its own products.

*Although these concerns are valid, we appreciate the dialogue with IOG on this proposal which contributed to this voting decision.* 

##### **Conclusion**

The Cardano Foundation votes YES. The combination of Account Enhancements, a Multi-Asset Treasury, and Native Babel Fees represents a step forward for Cardano's scalability, developer experience, and economic sustainability.

#### **99\. IO \- Consensus Initiative**

##### Summary

The Cardano Foundation votes YES. Leios is important for scaling Cardano and long-term competitiveness. Despite concerns over budget opacity and prior funding overlaps, delaying this upgrade risks ecosystem stagnation. We approve to ensure development continuity.

##### Rationale Statement

We recognize the impact that the Consensus Initiative (Leios) will have on the network’s capacity. We are voting YES based on the following technical and strategic assessments:

1. **Essential Base Layer Scaling:** Scaling through Leios is fundamentally positive and provides Cardano with a massive upgrade. To ensure Cardano remains competitive with newer Layer 1 blockchains in terms of throughput, upgrading the base protocol is non-negotiable. This prevents the network from adopting unsustainable design patterns, such as forcing all high-volume activity to Layer 2 solutions.  
2. **Core Infrastructure Investment:** This proposal is a direct investment in the core protocol infrastructure. The Leios research phase has produced solid, academic-level work fully in the spirit of a peer-reviewed blockchain.  
3. **Development Continuity:** Leios development requires highly specialized knowledge. Voting NO at this critical juncture would risk halting momentum, meaning expert engineering teams would need to be replaced or re-assembled at a later date. Approving this proposal ensures the unbroken continuation of the roadmap toward the Dijkstra era.

##### Conclusion

The Cardano Foundation votes YES. We recognize that Leios is a credible path available to meet Cardano's 2030 scaling ambitions. While we have significant concerns regarding the insufficiently detailed, escalating budget, the risk of derailing base-layer scaling is too significant.

#### **100\. IO & Ensurable Systems \- Cardano Maintenance Initiative**

##### **Summary**

The Cardano Foundation votes ABSTAIN. We appreciate the dialogue with IOG on this proposal, which contributed to our voting decision. While continuous maintenance is important for long-term network stability, this 62.1M ada proposal presents fiscal uncertainty and the scope appears to duplicate funding of other concurrent initiatives.

##### **Rationale Statement**

While the critical importance of keeping the network operating securely is undisputed, our evaluation reflects several material concerns regarding the current formulation of the proposal:

1. **Lack of Budget Detail/Potential Duplications:** This proposal bundles nine maintenance workstreams into a single budget, grouping 74% (46M ada) of the funds into a broad "Development" category, which, without a granular Full-Time Equivalent (FTE) headcount breakdown, limits the capacity to verify cost efficiency. Additionally, given that the same development teams contribute across multiple initiatives, there appears to be a funding overlap with resources already requested in the Upgrades, Plutus,  Consensus, and Developer Experience proposals. Providing a more detailed budget breakdown would help the community in conducting a clear cost-benefit analysis and ensure there is no duplication of funding.  
2. **Lack of Quantifiable Deliverables:** The proposal functions structurally as an open-ended funding commitment lacking defined technical boundaries, presenting a deficit of tangible deliverables, milestones, or open-source repository evidence mapping out the work. Without clear engineering baselines, it acts as an unquantifiable blanket retainer that challenges our ability to properly assess the proposal.  
3. **Substantial Budget Inflation:** The requested amount of 62.1M ada (approximately 14.9M USD) represents a high allocation of treasury resources. Industry baselines indicate that these costs are significantly inflated relative to the actual operational overhead required for equivalent DevOps and core maintenance tasks.   
4. **Structural Preference for Targeted Initiatives:** The Cardano Foundation maintains a clear structural preference for a modular funding framework wherever possible. Funding generalized blanket proposals introduces fiscal uncertainty, whereas smaller, targeted sub-proposals (such as specific consensus, developer experience, or scaling layer initiatives) feature transparent line-item budgets and clearly defined milestones that allow for rigorous milestone-based verification.  
5. **Node Diversity Risks:** To support a healthy multi-client ecosystem, overarching services such as global network monitoring and core documentation (e.g., the Cardano Blueprint) should be gradually decoupled from node-specific maintenance to ensure a completely product-agnostic and inclusive infrastructure landscape.

##### **Conclusion**

The Cardano Foundation votes ABSTAIN. We appreciate the critical nature of network maintenance and the expertise of the proposing teams. However, we require greater financial transparency, and a more node-agnostic approach to ecosystem tooling in order to properly assess this proposal. If this proposal does not reach the required approval threshold, we ask the proposers to refine and resubmit. A resubmission would greatly benefit from a decoupled structure, detailed FTE allocations, and an independent oversight mechanism to ensure verifiable and neutral delivery.

#### **101\. IO & Midgard Labs \- L2 Scalability Initiative**

##### **Summary**

The Cardano Foundation votes ABSTAIN. While Layer 2 scaling is important for enterprise DApps, the proposal's lack of budget granularity, contested IP, and unresolved 2025 milestones introduce uncertainty. While we do not oppose this proposal, we urge a refined resubmission if it does not pass.

##### **Rationale Statement**

We support the technological objectives and the necessity of Layer 2 scaling, however we require further clarity regarding the following uncertainties before we are able to support:

1. **Unclear Scope and Structural Bundling:** The proposal bundles two Layer 2 technologies at different stages of their respective product lifecycles into a single governance action. Furthermore, the financial distribution is skewed; despite being a titular focus of the initiative, the Midgard workstream receives only 9% of the allocated funding, while Hydra consumes approximately 73%.  
2. **Milestone Accountability and Prior Deliverables:** Midgard's 2025 funded milestones under contract EC-0001-25 were previously reported as past due and paused. While new evidence was submitted on May 19 to claim milestones 2–5, these submissions remain pending final verification. Committing additional treasury resources without a fully finalized reconciliation of past deliverables introduces significant fiscal uncertainty.  
3. **Budget Granularity and Potential Overlaps:** The 10.4M ada request lacks a granular breakdown. The technical scope for Workstream 2 (Hydra) closely mirrors the team's existing public roadmap and open pull requests, making it difficult to isolate net-new work from previously funded core engineering efforts. Additionally, the 1.8M ada requested for a bespoke Data Availability (DA) prototype does not sufficiently clarify why existing modular alternatives are unsuitable.  
4. **Technical, IP, and Organizational Risks:** The proposal contains contradictory timelines regarding the Midgard mainnet launch (end of 2026 versus Q1 2027). Subject Matter Experts (SMEs) also noted unresolved authorship and payment disputes (e.g., PR \#434) that introduce contested-IP risks. Finally, the legal distinction and relationship between "Midgard Labs" and Anastasia Labs require clarification to ensure accountability.   
5. **Unsubstantiated Metrics and Commercial Dependencies:** Performance claims such as "10,000+ TPS" are presented without concrete benchmarking data or baseline metrics. Furthermore, the proposal relies heavily on specific commercial partners (like Delta DeFi and Masumi) continuing to build, without providing contingency plans. Ideally, commercial entities utilizing the stack for enterprise applications should contribute to the hardening of the infrastructure they rely upon.

##### **Conclusion**

The Cardano Foundation votes ABSTAIN. We appreciate the dialogue with IOG on this proposal which contributed to our voting decision. We value the technical ambition of this initiative and respect the engineering teams involved, but we cannot support this proposal in its current state without proper budget breakdowns, clarity on IP, and clear accountability for past milestones. If this proposal does not reach the required approval threshold, we ask the proposers to refine and resubmit their initiative.

#### 102\. IO \- Cardano High Assurance Technical Collaboration

##### **Summary**

The Cardano Foundation votes YES. Automating formal verification is a strategic public good that reinforces network security. Despite significant concerns regarding budget opacity and adoption risks, the ecosystem benefits outweigh the reservations.

##### Rationale Statement

We support this proposal because it aligns with Cardano's core value proposition of security, correctness, and determinism. Our YES vote is grounded in the following primary drivers:

1. **Strategic Digital Trust Infrastructure:** Cardano’s underlying smart contract model, based on Lambda calculus and determinism, is uniquely positioned for formal mathematical verification. Recent high-profile vulnerabilities in EVM-based DeFi protocols, such as the \~$300M Kelp DAO exploit, highlight that verifiable security is a strict prerequisite for institutional adoption. This enables a shift away from high-risk environments toward highly secure, institutional-grade DeFi applications.  
2. **Universal Ecosystem Support via UPLC:** The proposed automated verification tool, Blaster, operates directly on Untyped Plutus Core (UPLC). This architectural choice is strategic, as it avoids siloed development and simultaneously supports developers across the ecosystem, regardless of whether they write in Aiken, Plutus, or other high-level smart contract languages.  
3. **Lowering the Barrier to Entry:** Historically, formal verification has been restricted to specialized experts. By providing a Lean4-based verification enabler, integrating it directly into native toolchains (e.g., VS Code), and offering extended "one-click" containerized developer environments, this initiative significantly democratizes access to production-ready, secure smart contract development.  
4. **AI-Agentic Workflow Readiness:** As software engineering transitions toward AI-assisted development, the emphasis on robust Command Line Interfaces (CLIs) within this proposal provides a strong, secure foundation for future integration with autonomous AI agents, ensuring Cardano's toolchain remains forward-looking.  
5. **Reusable and Auditable Components:** The initiative focuses on delivering shareable, property-tested domain components. The ability to utilize pre-audited building blocks is of significance for developers aiming to construct larger, secure solutions rapidly.

##### Conclusion

The Cardano Foundation votes YES. We recognize that providing accessible, automated formal verification for all Cardano smart contracts is a valuable public good that solidifies our competitive advantage in security and correctness. If this proposal does not reach the required approval threshold, we respectfully ask the proposers to improve and resubmit their initiative with granular budget breakdowns and mitigated ecosystem dependencies.

#### 103\. IO & VacuumLabs \- Enhancing Plutus \- Performance, Correctness, and Usability

##### **Summary**

The Cardano Foundation votes NO. While we appreciate the proposer's efforts to enhance Plutus, this proposal suffers from budget opacity, bundling of Plinth-specific tools, and unmitigated downstream ecosystem burdens.

##### **Rationale Statement**

While we support the technological objectives to improve the foundational smart contract layer, we are unable to support this treasury withdrawal in its current form due to the following considerations:

1. **Unjustified Bundling and Disproportionate Beneficiaries:** The proposal combines broad, ecosystem-wide UPLC infrastructure upgrades with developer-experience improvements (Workstream 3\) exclusively focused on Plinth, the canonical Haskell-based language. Aiken is currently the most popular smart contract language on Cardano; funding Plinth-specific tooling at this scale without separating the budget disadvantages the broader developer base who do not utilize the Haskell stack.  
2. **Budget Opacity and Lack of Financial Granularity:** The 11.8M ada request lacks a workstream-level budget split, grouping 86% of funds into a generic "Development" bucket. It is impossible to determine the financial allocation and ownership split between IO and VacuumLabs, nor is it clear how this withdrawal differs from the previously funded 2025 Plutus Core Roadmap and Maintenance initiatives.  
3. **Downstream Tooling Breakage and Ecosystem Burden:** Adding new built-ins to existing Plutus versions frequently breaks deployed community tooling. This dynamic forces downstream compiler maintainers (e.g., Aiken, Scalus) to execute abrupt, unfunded upgrades to survive hard forks. The proposal lacks mechanisms for experimental feature testing, nor does it provide financial or technical support to assist downstream maintainers in integrating these changes.  
4. **Feature Bloat vs. Demonstrated Market Demand:** The Cardano network currently supports hundreds of built-in functions, many of which remain heavily underutilized by developers. Introducing highly exotic cryptographic primitives (such as the Poseidon hash) without proven, active market demand adds unnecessary complexity to the developer experience and the core protocol without delivering immediate, tangible value to decentralized applications.

##### **Conclusion**

While we appreciate IO and VacuumLabs' efforts to advance the Plutus platform, we are unable to support this treasury withdrawal due to insufficient budget granularity, bundling of Plinth-specific tools, and unmitigated burdens on downstream maintainers. If the proposers resubmit this proposal, we respectfully ask that they make improvements to address the burden on downstream maintainers and include leaner, decoupled workstreams and transparent financial allocations.

#### 104\. Blockfrost \- Maintenance and Next Generation Indexing

##### **Summary**

The Cardano Foundation votes NO. Although we see the potential in elements of this proposal, it requires further financial transparency, clearer open-source commitments, conflict disclosure, and a separation of commercial operations from public goods.

##### **Rationale Statement**

While we support the technological objectives of Project Cayley to modernize Cardano's indexing infrastructure, we are unable to support this treasury withdrawal in its current form due to the following considerations:

1. **Financial Separation of Public Goods and Commercial Operations:** We appreciate the importance of accessible developer tiers, however, utilizing treasury funds to cover the operational overhead of Blockfrost’s free tier presents structural challenges. The proposal frames the free tier as a public good, but it also serves as a commercial onboarding funnel without disclosing underlying conversion metrics. Approving this operational subsidy risks establishing an unsustainable ecosystem precedent for other private infrastructure providers.  
2. **Financial Transparency:** The 7.9M ada treasury funding commitment lacks explicit breakdown across workstreams, role rates, and specific milestone payments, with 86% of the budget grouped under a generic "Development" bucket.  
3. **Verifiability of Performance and Metrics Baselines:** The proposal's claim that Blockfrost handles approximately 90% of Cardano's free-tier API traffic lacks an independent data source or explicit measurement methodology. The platform's granular request architecture makes it difficult to evaluate the proposed baseline costs, given that it does not bundle data into single queries and could theoretically inflate query metrics.   
4. **Technical Specifications and Open-Source Commitments:** Project Cayley outlines compelling concepts like "slice indexing" and the "Mandoline indexer," but lacks reference architectures, public repositories, or linked design documentation. Critically, for a treasury funded public good, the proposal does not clarify the licensing or intellectual property frameworks, nor does it provide a comparative analysis against existing indexing solutions such as Kupo, Carp, Dolos, Oura, or UTxO RPC.  
5. **Disclosure of Strategic Inter-Entity Relationships:** The proposal does not disclose the economic relationship between Blockfrost and Input Output Global (IOG), despite a publicly confirmed investment. In decentralized governance, a clear conflict-management framework and transparent relationship disclosures are vital when treasury assets flow into commercial entities where a core protocol developer holds a financial stake.  
6. **Operational Sustainability:**  The lack of a long-term phase-out strategy or path to self-sustainability for Blockfrost leaves it unclear if this operational support is intended to become a recurring public expense.

##### **Conclusion**

We value the technical vision to optimize Cardano's indexing capabilities, but the bundled integration of a commercial subsidy and undisclosed corporate dependencies prevents us from supporting this treasury withdrawal. If this proposal does not reach the required approval threshold and if the  proposers resubmit, we respectfully ask them to refine their initiative to address the issues of transparency, sustainability, and the technical points set out above. 

#### 105\. Pogun \- Capital Without Compromise

##### **Summary**

The Cardano Foundation votes YES. This R\&D initiative introduces an innovative credit model and a revenue-sharing mechanism for the treasury, despite notable execution and business risks.

##### **Rationale Statement**

Our support for this initiative is driven by the following considerations:

1. **Venture Repayment Model:** Unlike typical infrastructure grants that act as purely extractive capital outlays, this proposal introduces a venture-like financial return structure. Committing 20% of quarterly EBITDA until the principal is repaid, followed by a 5% perpetual return, establishes a valuable precedent for how the public treasury can capture upside and ensure long-term economic sustainability.  
2. **Innovative Non-Margin Architecture:** The proposal pioneers a peer-to-peer, oracle-free credit market on Cardano that replicates traditional finance risk models.   
3. **Strategic Bitcoin Liquidity Integration:** Bringing Bitcoin interoperability and liquidity to Cardano is one of the most effective methods to drive immediate application-layer utility. By focusing development as an application layer overlay, the project introduces zero tool-breaking complexity or risk directly into the ledger.  
4. **Risk-Mitigated Tranche Structure:** The milestone framework is divided into four distinct tranches. This operational sequencing ensures that the project must successfully prove its technical concepts and achieve defined delivery baselines before subsequent capital is released.  
5. **High-Value R\&D Spillover Effects:** Even if the ultimate startup roadmap encounters unforeseen market hurdles, the initiative is valuable as a research and development exercise. The technical execution is expected to yield useful secondary artifacts, salvageable open-source tooling, and cryptographic advancements that will directly benefit adjacent Bitcoin bridging efforts on Cardano.  
6. **Strong Academic and Technical Advisory:** The technical architecture is robust and driven by a deeply competent core team. The strategic inclusion of prominent external researchers, such as Robin Linus, onto the advisory board provides credibility to the trust-minimized technical roadmap.

##### **Conclusion**

In conclusion, the Cardano Foundation votes YES, viewing Pogun as an impactful application-layer initiative that establishes a framework for treasury value recapture. We support this treasury funding commitment as a venture-style bet for the network.
