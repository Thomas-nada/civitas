<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmZinnfGqEYa13htG6g6UZ9EMwn31ZPjyb1bH4LCcGp7Sh -->
# Michele_Harmonic

**Proposal:** Update Plutus Cost Models
**Vote:** No
**Voter ID:** `drep1y28jk3gffhcecfhwaf73nfef833q8twqnhw8h7n60kelxus4xlej4`

---

The proposed changes should be proposed under Plutus V4 instead of as an extension of Plutus V3, according to CIP-35 (https://cips.cardano.org/cip/CIP-0035), as they include not backwards-compatible changes.

Additionally, even if all the changes were backwards compatible, extending the set of builtins tends to break all downstream tx builders (classic PPViewHashesDontMatch). This practice should be abolished in favour of upgrading the Plutus version when new builtins are added.
