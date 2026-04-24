<!-- url: ipfs://QmYiRwqQqSm73KtbN39GWervRjyscXV5eAxXhzY1BJkdhS -->
# Cardano Foundation

**Proposal:** Decrease Treasury Tax from 20% to 10%
**Vote:** No
**Voter ID:** `6796d87d5169e5e8c2138886a0994b69858735ec08eef01758bfc280`

---

{
    "@context":
    {
        "@language": "en-us",
        "CIP100": "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#",
        "CIP136": "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0136/README.md#",
        "hashAlgorithm": "CIP100:hashAlgorithm",
        "body":
        {
            "@id": "CIP136:body",
            "@context":
            {
                "references":
                {
                    "@id": "CIP100:references",
                    "@container": "@set",
                    "@context":
                    {
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
                "internalVote":
                {
                    "@id": "CIP136:internalVote",
                    "@container": "@set",
                    "@context":
                    {
                        "constitutional": "CIP136:constitutional",
                        "unconstitutional": "CIP136:unconstitutional",
                        "abstain": "CIP136:abstain",
                        "didNotVote": "CIP136:didNotVote"
                    }
                }
            }
        },
        "authors":
        {
            "@id": "CIP100:authors",
            "@container": "@set",
            "@context":
            {
                "did": "@id",
                "name": "http://xmlns.com/foaf/0.1/name",
                "witness":
                {
                    "@id": "CIP100:witness",
                    "@context":
                    {
                        "witnessAlgorithm": "CIP100:witnessAlgorithm",
                        "publicKey": "CIP100:publicKey",
                        "signature": "CIP100:signature"
                    }
                }
            }
        }
    },
    "hashAlgorithm": "blake2b-256",
    "body":
    {
        "summary": "The proposal to reduce the treasury growth rate from 20% to 10% is unconstitutional because it lacks the required comprehensive technical review set forth in Article 3, Section 5, and a mandatory reversion plan, risking long-term treasury sustainability. Although the proposed rate falls within the acceptable quantitative range, essential procedural safeguards are not addressed. Please find a pdf version of this here: ipfs://QmR1CRENc26WNbQgV5Bptbz7LNxZJvNdKr55JB9fRDBoaJ",
        "rationaleStatement": "**Understanding Governance Actions** This governance action (Action ID: gov_action1js2s9v92zpxg2rge0y3jt9zy626he2m67x9kx9phw4r942kvsn6sqfym0d7) proposes reducing the treasury_growth rate from 0.2 (20%) to 0.1 (10%), to boost staking rewards. While the adjustment is numerically compliant with the guardrails (TC-01/TC-02) outlined in Appendix 1, Section 2.2, it lacks the comprehensive technical review required by Article 3, Section 5. Consequently, the proposal fails to demonstrate how it would serve the key economic parameter goals, namely, ensuring long-term economic sustainability, adequately rewarding stake pools and ada owners, and balancing incentives among all ecosystem stakeholders. **Constitutional Compliance** 1. **Procedural and Formal Requirements:** The governance action follows a standardized format, including a title, abstract, and rationale, as generally expected under Article 3, Section 5. However, the substance of this rationale is deficient. The governance action is compliant with the guardrails for the parameter `treasury_growth_rate` (TC01-05) in Appendix 1, Section 2.2 Crucially, the action fails to provide a reversion/recovery plan, a mandatory requirement for all parameter changes as stipulated in Appendix 1, Section 2.6. . The action fails to address network security concerns related to changing economic parameters, failing to pass the counter-indicators in Appendix 1, Section 2.2. . 2. **Substantive Compliance and Guardrails:** Article 3, Section 5 mandates "sufficient technical review and scrutiny" for all protocol parameter change governance actions, particularly to not endanger the long-term sustainability. The rationale relies heavily on assumptions and projections about ada price appreciation without presenting concrete data, modeling, or independent analysis. There is a clear absence of this required technical review provided in the metadata. This constitutes a significant violation of Article 3, Section 5. While the proposal aims to improve staking incentives, potentially aligning with Article 1, Section 1, Tenet 4, the lack of rigorous analysis raises concerns about its impact on the long-term sustainability of the Cardano Blockchain, potentially conflicting with Tenet 9. Ensuring long-term sustainability and balancing economic incentives are goals when managing economic parameters, as listed in Appendix 1, Section 2.2. Changes to such economic parameters must account for counter-indicators to such changes, which was not fulfilled in this proposed governance action. The guardrails TC-01 and TC-02 within Appendix 1, Section 2.2 are met numerically, as the proposed value is within range.",
        "precedentDiscussion": "Previous governance actions, such as the Plutus V3 cost model update have underscored the necessity for comprehensive technical scrutiny, robust risk mitigation strategies and a reversion plan. The failure to meet these standards in the current proposal sets an unfavorable precedent, potentially lowering the bar for future economic parameter changes and risking the long-term sustainability and viability of the Cardano Blockchain. Past actions, such as the Plutus V3 cost model update (Action ID: gov_action1k2jertppnnndejjcglszfqq4yzw8evzrd2nt66rr6rqlz54xp0zsq05ecsn), have established the necessity for a detailed technical review, careful scrutiny, and the inclusion of a reversion plan. Failing to meet these standards in the current proposal creates a troubling precedent that could undermine the future viability of economic parameter changes on Cardano.",
        "counterargumentDiscussion": "Proponents of the treasury cut reduction argue that it will directly enhance staking rewards and incentivize broader participation. However, this perspective does not adequately address the long-term role of the treasury as the funding source for “the ongoing operation, maintenance and future development of the Cardano Blockchain ecosystem,” as outlined in Article 4, Section 1. Without rigorous technical validation and an established fallback plan, the proposal risks depleting resources necessary for future network sustainability.",
        "conclusion": "The governance action to reduce the treasury growth rate from 20% to 10% is unconstitutional in its current form.",
        "internalVote":
        {
            "constitutional": 1,
            "unconstitutional": 4,
            "abstain": 0,
            "didNotVote": 2,
            "againstVote": 0
        },
        "references":
        [
            {
                "@type": "relevantArticles",
                "label": "Article I section 1. TENET 4+9",
                "uri": "ipfs://bafkreiazhhawe7sjwuthcfgl3mmv2swec7sukvclu3oli7qdyz4uhhuvmy"
            },
            {
                "@type": "relevantArticles",
                "label": "Article III section 5.",
                "uri": "ipfs://bafkreiazhhawe7sjwuthcfgl3mmv2swec7sukvclu3oli7qdyz4uhhuvmy"
            },
            {
                "@type": "relevantArticles",
                "label": "Article IV section 1.",
                "uri": "ipfs://bafkreiazhhawe7sjwuthcfgl3mmv2swec7sukvclu3oli7qdyz4uhhuvmy"
            },
            {
                "@type": "relevantArticles",
                "label": "Article VII section 1.",
                "uri": "ipfs://bafkreiazhhawe7sjwuthcfgl3mmv2swec7sukvclu3oli7qdyz4uhhuvmy"
            },
            {
                "@type": "relevantArticles",
                "label": "Appendix I, Section 2.2 (TC01-05)",
                "uri": "ipfs://bafkreiazhhawe7sjwuthcfgl3mmv2swec7sukvclu3oli7qdyz4uhhuvmy"
            },
            {
                "@type": "relevantArticles",
                "label": "Appendix I, Section 2.6",
                "uri": "ipfs://bafkreiazhhawe7sjwuthcfgl3mmv2swec7sukvclu3oli7qdyz4uhhuvmy"
            },
            {
                "@type": "Other",
                "label": "Rationale pdf",
                "uri": "ipfs://QmR1CRENc26WNbQgV5Bptbz7LNxZJvNdKr55JB9fRDBoaJ
            }
        ]
    },
    "authors":
    [
        {
            "name": "Cardano Foundation"
        }
    ]
}
