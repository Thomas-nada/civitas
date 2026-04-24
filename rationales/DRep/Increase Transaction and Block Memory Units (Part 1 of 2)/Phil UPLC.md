<!-- url: ipfs://Qmd73vd9CUFJQgLtA2t2yPivqqzGXw4mUGLjEnLKzG39EM -->
# Phil UPLC

**Proposal:** Increase Transaction and Block Memory Units (Part 1 of 2)
**Vote:** No
**Voter ID:** `drep1yg343cyuckglj48a6gpcey7fkfcy5x5f9g65wme3ne9q2mgaedmkm`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmWQ8CCeCshzqNacpnRNCEianZXubeDgorxb4HVYSiDWrg

This proposal should have passed two years ago. As it stands now the increase is far too conservative, and meaningless, instead we should focus on reducing the ex-unit (mem and CPU) cost of CEK operations to account for the massive amount of optimization work that has been done over the years. The memory cost of the term AST node is 100 which is a hundred times higher than it should be (it should be 1). 

Instead of increasing the budget, we should reduce ex-memory costs of cek ops to accurately reflect the memory that the ops consume.
