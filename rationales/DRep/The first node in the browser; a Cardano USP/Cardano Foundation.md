<!-- url: ipfs://QmSW8mbUcL1FCPuiv1pMtmoVqTJDVyqjfVWZzevE7c5SXi -->
# Cardano Foundation

**Proposal:** The first node in the browser; a Cardano USP
**Vote:** No
**Voter ID:** `drep1ydpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsjaelx`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmcnU2jmgVuNMLLKkhwLrv6BzGkaAcBFzEXF2vugdLmxXm

Our assessment team and internal Subject Matter Experts (SMEs) have thoroughly reviewed this proposal. While the concept of a trustless browser node is innovative and conceptually intriguing, we are unable to support this treasury withdrawal due to the combination of the following considerations:

1. **Lack of Market Validation:** We are concerned about the potential traction for Gerolamo. While it is a fascinating tool, it currently appears tailored to a relatively niche audience, which does not yet justify a treasury expenditure of this scale. We respectfully suggest that an idea like this might be better suited for initial bootstrapping. If the broader market and user base demonstrate strong demand, it could certainly be reconsidered in the future.  
2. **Significant Technical Constraints:** The technical feasibility of running a fully validating node within a browser presents notable challenges. Managing the Cardano Ledger State via IndexedDB is highly ambitious given that modern browsers restrict local storage, which introduces risks of performance degradation or data eviction over time. Furthermore, an independent review of the current public repositories suggests the codebase currently defers intricate calculations to centralized infrastructure (like Blockfrost) rather than executing true local ledger management. This draws into question the core premise of a fully trustless node.  
3. **Refining Acceptance Criteria:** The current milestones define "production readiness" primarily through connectivity metrics (e.g., syncing to tip). While important, we believe a production-ready validating node requires more comprehensive benchmarks. We strongly encourage the inclusion of rigorous, property-based conformance testing or differential testing against the core node to mathematically guarantee the correctness of ledger validation.  
4. **Missing Architectural Design Decisions:** The proposal would greatly benefit from a more robust and detailed architectural blueprint. Given the well-documented limitations of browser environments, we would need a clearer technical explanation of exactly how Gerolamo will sustainably navigate these resource constraints during extended use to ensure long-term stability and reliability.  
5. **Budget Transparency and Efficiency:** The proposal requests 5 Full-Time Equivalents (FTEs) structured as a lumped sum of $200k/FTE, plus a 15% contingency, totaling $1.15M.  For a project that is  “mostly done” as written in the proposal, with only limited API integration work and packaging remaining, we struggle to justify the requested amount. We also note that Harmonic Laboratories was already funded in 2025 through the Intersect budget administration process to deliver a “fully functional light node that can run in the browser.” An additional treasury request of $1.15M for what seems to be a continuation of that workstream at substantially higher FTE rates is not something we can support.
