<!-- url: ipfs://QmbP25M2xssZqRa7JTBkgbKufaPZeinHCvJmffJbMugNTZ -->
# Cardano Foundation

**Proposal:** Reduce minPoolCost to 75 ada
**Vote:** Yes
**Voter ID:** `drep1ydpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsjaelx`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmXeDE3K7Dm4qaxAyGfUX7rTRmpyrZwNQhtsydSNrcs31L

We supported this same reduction when it was proposed in a previously bundled parameter change (gov\_action14dr5yg75pchr2sz42djtuflpvx5qnsek29qg7s7cft8lzrqt5vrqqtqntpk), and we see no change in circumstances that would warrant a different position now.&nbsp;

&nbsp;

Our decision is driven by the following factors:

&nbsp;

* **Proportionate \`minPoolCost\` Correction:** With rewards near 300 ada per block, the 170 ada floor absorbs \~57 percent of a single-block pool's gross reward, raising the delegator penalty to \~52.8 percent and projecting 100 percent by epoch 758\. Reducing the floor to 75 ada restores that share to \~25 percent, ensuring long-term economic predictability.  
* **Empirical Evidence:** The 2023 reduction from 340 ada to 170 ada showed that a lower floor does not trigger a race to the bottom; 340 ada remained dominant. Operators can maintain higher fees if necessary, making a repeat concern unlikely.  
* **The security case for a high floor has weakened.** IO Research's updated incentives report reverses its earlier assessment, finding that a high fixed fee more plausibly favours Sybil-style stake fragmentation by large operators than deters it. We believe a staged move to 75 ada, rather than to zero, is the measured response while the structural work on a proportional \`minPoolMargin\` under CIP-23 proceeds.
