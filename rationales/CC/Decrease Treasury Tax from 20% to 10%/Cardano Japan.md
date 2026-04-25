<!-- url: https://ipfs.io/ipfs/QmVac6eFZ9mNyut3DZEizb9EH72oKqWURDCtTUu1Mcnv8Z -->
# Cardano Japan

**Proposal:** Decrease Treasury Tax from 20% to 10%
**Vote:** Yes
**Voter ID:** `4012cab50266efd8c5bf8f65c0f7667352631ec086e79bf5f82f0755`

---

{
  "@context": {
    "@language": "en",
    "CIP100": "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#",
    "CIP136": "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0136/README.md#",
    "hashAlgorithm": "CIP100:hashAlgorithm",
    "body": {
      "@id": "CIP136:body",
      "@context": {
        "references": {
          "@id": "CIP100:references",
          "@container": "@set",
          "@context": {
            "GovernanceMetadata": "CIP100:GovernanceMetadataReference",
            "Other": "CIP100:OtherReference",
            "label": "CIP100:reference-label",
            "uri": "CIP100:reference-uri",
            "RelevantArticles": "CIP136:RelevantArticles"
          }
        },
        "summary": "CIP136:summary",
        "rationaleStatement": "CIP136:rationaleStatement",
        "precedentDiscussion": "CIP136:precedentDiscussion",
        "counterargumentDiscussion": "CIP136:counterargumentDiscussion",
        "conclusion": "CIP136:conclusion",
        "internalVote": {
          "@id": "CIP136:internalVote",
          "@container": "@set",
          "@context": {
            "constitutional": "CIP136:constitutional",
            "unconstitutional": "CIP136:unconstitutional",
            "abstain": "CIP136:abstain",
            "didNotVote": "CIP136:didNotVote"
          }
        }
      }
    },
    "authors": {
      "@id": "CIP100:authors",
      "@container": "@set",
      "@context": {
        "did": "@id",
        "name": "http://xmlns.com/foaf/0.1/name",
        "witness": {
          "@id": "CIP100:witness",
          "@context": {
            "witnessAlgorithm": "CIP100:witnessAlgorithm",
            "publicKey": "CIP100:publicKey",
            "signature": "CIP100:signature"
          }
        }
      }
    }
  },
  "hashAlgorithm": "blake2b-256",
  "authors": [
    { "name": "Cardano Japan" }
  ],
  "body": {
    "summary": "Decrease Treasury Tax from 20% to 10%  --> is constitutional.",
    "rationaleStatement": "[Constitutional] A review of this governance action was conducted based on the Cardano Blockchain Constitution, with multiple perspectives exchanged regarding its constitutionality. After discussions, the proposal was deemed constitutional by a majority vote of 3 in favor and 2 against. While some opinions raised concerns about the lack of a recovery plan, the prevailing view was that this proposal remains within constitutional guardrails and does not fundamentally threaten network security or sustainability. [Constitutional Analysis] 1. Compliance with Treasury Cut Guardrails (Appendix I, Section 2.2) The Cardano Constitution establishes guardrails for treasury cut adjustments as follows:  - TC-01: The treasury cut must not be lower than 10% (0.1). - TC-02: The treasury cut must not exceed 30% (0.3). [Pro-Constitution Argument]  - This proposal sets the treasury cut at exactly 10%, which remains within these guardrails, ensuring constitutional compliance. [Anti-Constitution Argument]  - While acknowledging that the proposal is within the guardrails, concerns were raised about the lack of a monitoring and verification plan to assess the impact of this change. 2. Network Security and Sustainability (Article III, Section 5, Paragraph 3) The Cardano Constitution mandates that protocol parameter changes must not endanger the security, functionality, performance, or long-term sustainability of the Cardano blockchain. [Pro-Constitution Argument]   The treasury cut adjustment only changes the distribution of existing ADA and does not modify fundamental consensus mechanisms or staking incentives.  - There is no evidence suggesting that this change introduces systemic risks to network security or sustainability.  - Past protocol parameter changes, such as Plutus upgrades, have been approved under similar considerations. [Anti-Constitution Argument]  - The Cardano Foundation has noted that the impact of this change should be monitored, and mechanisms should be in place to restore the previous setting if necessary. However, the governance action does not specify how this monitoring will be conducted.  - There have been cases where parameter changes did not yield expected results, raising the need for a clear trial period and contingency measures.  3. Recovery Plan Requirements (Appendix I, Section 2.6) The Cardano Constitution requires all governance actions involving parameter changes to include a recovery plan, which must specify:  1. How to revert the parameter to a previous state if necessary.  2. How to recover the network in case of catastrophic failure. [Pro-Constitution Argument]  - The treasury cut is a simple parameter that can be easily reversed through a future governance action.  - Therefore, the lack of an explicit recovery plan is a minor procedural issue and does not constitute a constitutional violation. [Anti-Constitution Argument]  - The required recovery plan is not explicitly stated, which raises concerns about constitutional compliance. - If an issue arises, the absence of a clear recovery plan could delay corrective action. However, it is strongly recommended that future proposals explicitly include a recovery plan to enhance governance transparency and constitutional alignment.  [Technical and Economic Considerations]  1. Network Impact  - This proposal affects ADA distribution but does not alter fundamental blockchain mechanics.  - It does not interfere with transaction validation, staking pools, or consensus mechanisms. 2. Economic Implications  - The decision of whether increasing staking rewards or increasing treasury reserves better contributes to the growth of the Cardano ecosystem should be determined by the community through DRep voting.  - The long-term impact of this ADA redistribution should be continuously monitored to ensure ecosystem sustainability and expansion. [Recommendations for Future Governance Actions] 1. Explicitly include a recovery plan in all economic parameter proposals to ensure full compliance with Appendix I, Section 2.6.  2. Establish monitoring mechanisms to assess the impact of treasury cut adjustments on network sustainability and staking participation.  [Conclusion] This governance action was deemed constitutional by a 3-2 majority vote.
However, the lack of a recovery plan and the need for impact monitoring were recognized as issues that should be addressed in future proposals.
[Final Verdict: Constitutional] The approval or rejection of this proposal should be determined through community discussion and the governance process.",
    "internalVote": {
      "constitutional": 3,
      "unconstitutional": 2,
      "abstain": 0,
      "didNotVote": 0
    }
  }
}
