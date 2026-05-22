<!-- url: https://raw.githubusercontent.com/adosiawolf/drep-rationale/refs/heads/main/0075 -->
# Kyle Solomon

**Proposal:** IO Developer Experience Initiative
**Vote:** Yes
**Voter ID:** `drep1ytzshxuma6cwrnlv2ucyclfqw3k4nu4nuudmh2z87j9hncsk9dhy4`

---

{
  "@context": {
    "CIP100": "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#",
    "hashAlgorithm": "CIP100:hashAlgorithm",
    "body": {
      "@id": "CIP100:body",
      "@context": {
        "references": {
          "@id": "CIP100:references",
          "@container": "@set",
          "@context": {
            "GovernanceMetadata": "CIP100:GovernanceMetadataReference",
            "Other": "CIP100:OtherReference",
            "label": "CIP100:reference-label",
            "uri": "CIP100:reference-uri",
            "referenceHash": {
              "@id": "CIP100:referenceHash",
              "@context": {
                "hashDigest": "CIP100:hashDigest",
                "hashAlgorithm": "CIP100:hashAlgorithm"
              }
            }
          }
        },
        "comment": "CIP100:comment",
        "externalUpdates": {
          "@id": "CIP100:externalUpdates",
          "@context": {
            "title": "CIP100:update-title",
            "uri": "CIP100:uri"
          }
        }
      }
    },
    "authors": {
      "@id": "CIP100:authors",
      "@container": "@set",
      "@context": {
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
  "body": {
    "title": "Voting rationale for action gov_action1w0shrfxqwv95kk0v4cn34wylz25a2cmqkq5jpc0e2yrahhqava3qqfu3vtv",
    "givenName": "Kyle Solomon",
    "image": {
      "@type": "ImageObject",
      "contentUrl": "https://raw.githubusercontent.com/adosiawolf/m/refs/heads/master/solomon-team-400x400.jpeg"
    },
    "comment": "I am voting YES to support the IO: Developer Experience Initiative.\n\n
    The ask is reasonable and modest for 6 months for a cross-functional team in this space. The problem diagnosis is credible and grounded and the deliverables are concrete and actionable, more than vague strategy documents. The cardano-init and contracts library are genuinely high-leverage - poor onboarding is a documented barrier to ecosystem growth and bounties are an efficient mechanism for distributed improvement.\n
    The initiative is too important to forego, and I do not agree with IO running with this proposal alone. My criticisms are as follows: \n\n
1. The 30% growth rate target is poorly defined. \"Relative growth rate of 0.3\" is introduced but never anchored to a concrete number. How many new developers does 30% acceleration actually mean in 6 months? Without a baseline figure and measurement methodology, this KPI is unverifiable.\n
2. The measurement hackathon is the only accountability mechanism for impact, and occurs at the very end of the proposal period. There's no interim check on whether developer growth is actually moving, only a measurement at the beginning and the end. This is backwards as we want early signals, not a retrospective at the close. Furthermore, not leveraging existing in-person ecosystem hackathons seems a misstep.\n
3. The MAU and Monthly Transaction KPI claims are overreached. The leap from \"better developer tooling\" to \"increased MAU\" involves many intermediate steps — DApp quality, user acquisition, retention — none of which this proposal controls. Claiming \"Yes - Fully\" aligned is an overclaim.\n
4. No team is named or described. The resources section says the team will include TypeScript engineers, DApp developers, Rust specialists, and DevRel — but no one is identified. The proposal explicitly acknowledges hiring hasn't happened yet, with \"Medium\" likelihood of hiring delays. For a 6-month program, starting without a team is a real execution risk.\n
5. The contracts library scope is vague for DeFi. Committing to \"at least 5 ready-to-audit contracts\" including DEX and lending contracts in one quarter is ambitious. These are complex, security-critical components. \"Ready-to-audit\" is not the same as \"safe to use\", and the proposal doesn't clarify how developers will understand the distinction.\n
6. Dependency on external parties is underweighted as a risk. The Developer HUB requires coordination with Cardano Foundation, Intersect, and community tool maintainers. The proposal notes PRs might not get merged, but treats this as a minor known limitation rather than a central project risk. If the portal owners don't cooperate, this deliverable stalls. The proposal should have been a joint initiative among relevant stakeholders.\n\n
Conclusion: if the proposal fails proposer should realign and resubmit the proposal with joint support from the Cadano Foundation and Intersect. Third the costs and engineering overhead expenditure to ~$250k target."
   },
  "authors": [
    {
      "name": "Kyle Solomon"
    }
  ],
  "hashAlgorithm": "blake2b-256"
}
