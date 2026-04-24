<!-- url: ipfs://QmaWDNwCRxCvq2Lf4ULCi7dirB6uUdg2L6xGm7TuG6XxBS -->
# Cardano Foundation

**Proposal:** Amaru Treasury Withdrawal 2025
**Vote:** Yes
**Voter ID:** `6796d87d5169e5e8c2138886a0994b69858735ec08eef01758bfc280`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmRkFLNDtRTmfxRuUfiWTvNnhhfQvNPaMnLDqM3cunTocd

This governance action (`gov_action1vrkk4dpuss8l3z9g4uc2rmf8ks0f7j534zvz9v4k85dlc54wa3zsqq68rx0`) requests a treasury withdrawal of 1,500,000 ada (1,500,000,000,000 lovelace) to execute the funding for the Amaru project, as authorized by a previously DRep-approved budget (`gov_action1h4ygjv0hjfj3lmafcm76rpdzcm8vsvj9k5wejn3npyxwxm3fesnqqw9kxxz`). The withdrawal is split across five distinct, publicly verifiable addresses, each corresponding to a specific scope of work to be administered by the Amaru Maintainer Committee.


## Constitutional Alignment

This proposal demonstrates comprehensive alignment with the constitutional framework:

- **Article III, Section 5 (Procedural Requirements):** This section mandates a standardized format with a verifiable "URL and hash of all documented off-chain content" and that on-chain and off-chain content be "identical." The proposal provides a detailed rationale linked via an immutable IPFS address (ipfs://bafkreifw3qs7brjn4tdvyprnh2r343oerbdghasp5ws6ro55frbpll3dta) with a verified hash. A verification check was performed, confirming that the withdrawal amounts and receiving script hashes specified in the on-chain action are identical to the human-readable addresses and amounts listed in the metadata. The proposal fully meets all procedural requirements of Article III, Section 5.


- **Article IV, Sections 3 and Appendix I, Guardrails (Budgetary and NCL Compliance):** These sections require any treasury withdrawal to be pursuant to an approved budget (Art IV, Sec 3; TREASURY-04a), not violate the active Net Change Limit (NCL) (Art IV, Sec 3; TREASURY-02a), and be denominated in ada (TREASURY-03a). The action is explicitly made pursuant to an approved budget and is denominated in ada. A manual check was performed, confirming compliance with the active Net Change Limit  (`gov_action1nd3t833j7v5sz65k3tp9yyvztw60sjcjgcgjr37682s3m7frwrusqmd2k80`), which is 350,000,000 ada. As of this assessment, no funds have been withdrawn from the treasury under this NCL. As the requested withdrawal of 1.5M ada is well within the available 350M ada limit and is pursuant to an approved budget, the proposal meets these requirements.


- **Article IV, Section 4 (Audit):** This section requires that funding requests make provisions for independent audits. The proposal confirms that provisions for a financial auditor are covered within the 'ad-hoc' budget scope and directly references the PRAGMA framework, which contains provisions for dispute resolution. The proposal meets the requirements of Article IV, Section 4.


- **Article IV, Section 5 (Handling of Administered Funds):** This section mandates that so long as any ada held directly or indirectly by an administrator after a treasury withdrawal, such ada "shall not be delegated to an SPO but must be delegated to the predefined auto abstain voting option." The applicability of this section is ambiguous in the context of self-administered funds, however, in any event, should the section be applicable, this proposal will fulfil the provisions of this section. 
The proposal's self-assessment and rationale detail an on-chain smart contract solution designed to technically enforce this rule for the five treasury addresses. A verification of the five receiving stake addresses (`stake17xrqac8khkprtpp2jz90mpkujjwye8dt6a9sjewrvjudx9ggg4u5y`, `stake17xrh74lqhhxgzelfsn0wq5kcm4e5dmluprlcpg5mq30p5yqhgk7k8`, `stake17xd74ehu0l4d5mx0sfz4fd0r5jvw4v2jqkkfyjxrlwvnkhccrqj9l`, `stake17xnev6rc25xwz8kg4qae8lq6dcg964z00py5gqgxd387pncv8fq8g`, `stake178jztxzwynajcp4dva5gy9udmmnwg7ueffvf4c7hpjqhc7gtj5nzz`) confirms that they are delegated to the pre-defined auto-abstain voting option and are not delegated to a stake pool.
