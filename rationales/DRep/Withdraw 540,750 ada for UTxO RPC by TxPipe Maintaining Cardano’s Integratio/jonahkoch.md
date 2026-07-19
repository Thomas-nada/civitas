<!-- url: ipfs://Qmc661PuZzTdehVipAT5kA8pz5TyMRZkBm51GwYxMCUsXG -->
# jonahkoch

**Proposal:** Withdraw 540,750 ada for UTxO RPC by TxPipe Maintaining Cardano’s Integratio
**Vote:** Yes
**Voter ID:** `drep1yt8trnz8e5cnylmyygt0pyzrfw92rt9s42kg8t4rhm6t0dstyvmdn`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmeG1KqUdr9xVJ5q2Wjj2WftKQooYGDiDQfsRXji28FdV6

Voting yes. UTxO RPC is one of the clearest cases this cycle for what developer tooling treasury funding should look like, a small ask maintaining a standard that independent teams have already chosen to build on.
The validator for this proposal isn't TxPipe's claims about the standard; it's the adoption pattern. Amaru, Dingo, and the Haskell Cardano node have independently adopted UTxO RPC as their query interface. Three node implementations converging on the same standard without being compelled to is exactly how you know something is solving a real problem. A unified query interface across node clients directly supports the client diversity Cardano needs — it lowers the cost of building and maintaining alternative implementations by giving them a common integration surface.
The multi-language SDK coverage matters for a different reason. Cardano's developer acquisition problem isn't primarily technical, it's that builders arriving from Python, Go, or Rust ecosystems face unnecessary friction before they can do anything useful. SDKs in six languages cut that friction at the point where developers make their first decision about whether Cardano is worth their time.
At ₳540,750, this is proportionally one of the smallest infrastructure asks in the entire cycle. TxPipe has delivered 26 of 30 Catalyst proposals and their current Intersect 2025 workstreams — Pallas, Dolos, and UTxO RPC Year 1 — are all on schedule. This is not a team asking for trust; this is a team asking for continuation of work they've already proven they complete.
The milestone details living in PSSC metadata rather than the proposal document is the only structural gap worth noting, future submissions should make those visible to DReps before the vote. It doesn't change this vote.
