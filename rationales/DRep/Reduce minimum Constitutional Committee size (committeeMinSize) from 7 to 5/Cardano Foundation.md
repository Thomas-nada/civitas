<!-- url: ipfs://QmS5UucrthjdBCUfSg4vPGfSUWs81oFNe1Ur5iNiLbhJgZ -->
# Cardano Foundation

**Proposal:** Reduce minimum Constitutional Committee size (committeeMinSize) from 7 to 5
**Vote:** Yes
**Voter ID:** `drep1ydpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsjaelx`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/Qme5BP2NANtYfeqtoPC46g5KhDdHgK9in7ZwDhPUdh59j3

Establishing a minimum Constitutional Committee size of 5 instead of 7 creates a safety margin for operational resilience. This adjustment allows the committee to remain functional even if two members resign unexpectedly, preventing the governance stall experienced in December 2025. This is a practical governance improvement that ensures constitutional necessity and continuity of ecosystem operations. Furthermore, this reduction in minimum size does not change the percentage of the committee required to ratify actions; it simply lowers the floor for what constitutes a valid, active committee.

We also acknowledge a technical "root-reference" conflict because the “Increase Transaction and Block Memory Units (Part 1 of 2)” proposal has already successfully passed. Since every parameter change must reference the hash of the last ratified change, the current proposal will be technically invalidated. Additionally, while 5 is a responsible minimum, it should not be viewed as a target total size. Reducing the active committee to 5 significantly changes the veto delta—the number of dissenting votes required to block an action. Specifically, a committee of 5 requires only 2 dissenting votes to block a Governance Action, whereas a committee of 7 requires 3 dissenting votes. Therefore, we encourage maintaining a Committee size above the minimum in future voting rounds.
