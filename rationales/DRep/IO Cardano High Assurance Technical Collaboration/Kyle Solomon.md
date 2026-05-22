<!-- url: https://raw.githubusercontent.com/adosiawolf/drep-rationale/refs/heads/main/0080 -->
# Kyle Solomon

**Proposal:** IO Cardano High Assurance Technical Collaboration
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
    "title": "Voting rationale for action gov_action1w0shrfxqwv95kk0v4cn34wylz25a2cmqkq5jpc0e2yrahhqava3q2yd5rxu",
    "givenName": "Kyle Solomon",
    "image": {
      "@type": "ImageObject",
      "contentUrl": "https://raw.githubusercontent.com/adosiawolf/m/refs/heads/master/solomon-team-400x400.jpeg"
    },
    "comment": "I am voting YES on supporting the IO: Cardano High Assurance Technical Collaboration proposal.\n\n
    While the 60-70% developer onboarding attrition claim appears unsubstantiated and adoption dependancy is explicitly out of scope but central to KPI claims, the prosal merits outweight the shortcomings:\n
    1. Formal verification is a genuine differentiator for Cardano - this a solid direction for a platform positioning itself as high-assurance \n
	2. Blaster has production proof-of-concept on real DApps (Djed, USDCx), so real world value has been provided and this isn't speculative R&D \n
	3. The consortium model distributing work across seven organizations is genuinely good for long-term ecosystem health \n
	4. The equivalence checking tool (formally proving two UPLC programs are semantically identical) is a technically compelling and underappreciated deliverable — it enables safe aggressive optimization \n
	5. CBDE addresses a documented real problem; multi-day Nix setup is a well-known pain point in the ecosystem \n
	6. At ~$3.1M for 12 months across seven organizations, the headline price is not unreasonable for this scope of formal methods work \n
	7. The roadmap is the detailed and sequenced, and provides clear quarterly milestones"
   },
  "authors": [
    {
      "name": "Kyle Solomon"
    }
  ],
  "hashAlgorithm": "blake2b-256"
}
