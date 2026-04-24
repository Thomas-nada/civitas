<!-- url: ipfs://Qmawib226vUeNxu523GvJTkhbMPGL9va2CbwqyUFSoV8Rw -->
# Ace Alliance

**Proposal:** Cardano Summit 2026 and TOKEN2049 Singapore
**Vote:** Yes
**Voter ID:** `71aa5b3a9240a02a89c4e2839579ec5eb60c410af0a5bb483e1b8f04`

---

A [PDF version][pdf-link] of this rationale is also made available.

[pdf-link]: https://ipfs.io/ipfs/QmSpgm8kP7C1wGuWgfRCKRXcmv7w3apQnsMmhpL7FgvRdu

This TWGA requests 14,076,539 ada (approximately $3.66M USD at $0.26/ada) to fund two co-located Singapore events in October 2026: the Cardano Foundation-hosted Cardano Summit 2026 (Oct 5–6, 9,615,385 ada) and an EMURGO-managed Title Sponsorship at TOKEN2049 (Oct 7–8, 4,461,154 ada). Funds are withdrawn to a Sundae Labs treasury contract and split into two isolated vendor contracts, one per proposer, with milestone-based disbursement under a four-party Oversight Committee (DQuadrant, Intersect, NMKR, Sundae Labs).

Article II.6.1 (Metadata Format). The metadata is served from immutable IPFS (ipfs://QmPZ6yDL62ms5ZGQfrPUXEDANrY9e2qrrzWVXRzbhJennk) with a matching anchor hash referenced on-chain (c183fa5432c8f149aa9b4fe5b7e512a7e94474f804a4e1d4b3d2e561d32b6fb9), and conforms to CIP-0108. Post-submission tampering is cryptographically foreclosed.

Article II.6.2 (Metadata Structure). The metadata contains a title, abstract, motivation, rationale, and a full references section linking the PDF proposal, concept deck, 2025 results, 2025 KPI tracking report, and a live KPI/smart-contract dashboard (https://treasurywithdrawals.cardanofoundation.org).

Article II.7 (Treasury Withdrawals). This TWGA satisfies all six requirements:

* II.7.1 (Terms). Purpose is clearly stated (delivery of Cardano Summit 2026 and Title Sponsorship of TOKEN2049 in Singapore). The delivery period is specified (events on October 5–8, 2026, with final milestone reporting and refund obligations extending up to six months post-event). Relevant costs are broken out line-by-line across ten Summit cost categories (venues/logistics 47.08%, speakers 4.18%, marketing 5.72%, production 8.89%, program 9.60%, sponsors/expo 9.43%, design 4.27%, hackathon 1.95%, legal/audit/tax 3.55%, external PM 5.33%) and four TOKEN2049 categories (sponsorship package 60.34%, booth build 18.97%, staffing 17.24%, legal/audit/tax 3.45%). Refund circumstances are enumerated: (i) event cancellation before vendor payments, (ii) unspent ada returned within six months, and (iii) Ada-price-appreciation profit returned within six months. The 2025 revenue carry-over of USD 313,000 is disclosed and already deducted from the gross ask.

* II.7.2 (Prior Funding Disclosure). The proposal discloses that both the Cardano Foundation and EMURGO received ada in 2025 under the "Unveiling the First Unified Global Events Marketing Strategy for Cardano" TWGA and the "Cardano Summit 2025 and regional tech events" TWGA. References to both prior governance actions are included, along with links to ongoing milestone reporting on the Intersect dashboard. The Constitution requires disclosure, not absence, of prior funding; the disclosure requirement is satisfied.

* II.7.3 (Net Change Limit). A Net Change Limit of 350,000,000 ada covering epochs 613–713 is in effect. Consistent with the precedent Ace Alliance established in the Amaru Treasury Withdrawal 2026 rationale and reaffirmed in the Cardano x Draper Dragon: Orion Fund rationale, the 350M ada NCL is treated as definitively set and active. The 14,076,539 ada requested in this proposal will not exceed the NCL. 

* II.7.4 (Periodic Independent Audits and Oversight Metrics). The Summit budget allocates USD 100,000 and the TOKEN2049 budget allocates USD 40,000 (totalling USD 140,000) for legal, audit, and tax services. The Cardano Foundation is subject to annual audit by Grant Thornton, and has, via the Reeve platform, attested its 2025 financials on-chain. Both proposers are engaging Grant Thornton, subject to final terms, for additional assurance that funds are paid to the correct wallets. A publicly available dashboard (https://treasurywithdrawals.cardanofoundation.org) tracks smart-contract state, KPI delivery, and milestone progress. Section 7 of the proposal commits to a detailed KPI scorecard across attendance, enterprise adoption, hackathon, ecosystem/governance, and media. These provisions satisfy the requirement for periodic independent audits and observable oversight metrics.

* II.7.5 (Administrator). Administrators are specified: the Cardano Foundation administers the Summit vendor contract and EMURGO administers the TOKEN2049 vendor contract. Administration is executed through the Sundae Labs treasury contract framework (treasury.ak / vendor.ak), governed by a four-member Oversight Committee (DQuadrant, Intersect, NMKR, Sundae Labs). Disburse operations require 3-of-4 Oversight Committee authorization. This continues the established practice, previously accepted by the CC, of administrator-plus-smart-contract governance over withdrawn funds.

* II.7.6 (Custody). Withdrawn ada flows to a single treasury contract script and is then routed into two cryptographically isolated vendor contracts. The proposal states the treasury and vendor script addresses are delegated to the auto-abstain DRep and are not delegated to any SPO, satisfying the neutrality requirements of the Constitution. Milestone conditions, pause/resume/modify, and expiration-triggered sweeping of unspent funds back to the Treasury are enforced on-chain. Each vendor is cryptographically prevented from accessing the other's funds.

Appendix I (Guardrails).

* TREASURY-02a: The 14,076,539 ada requested wil not exceed the 350M ada NCL.

* TREASURY-03a: The withdrawal is denominated in ada as required.
