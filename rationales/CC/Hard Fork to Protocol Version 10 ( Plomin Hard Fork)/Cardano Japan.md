<!-- url: https://raw.githubusercontent.com/Cardano-Japan-ICC/Rationale/vote/GA-HardFork-ProtocolVer10.json -->
# Cardano Japan

**Proposal:** Hard Fork to Protocol Version 10 ( Plomin Hard Fork)
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
        "authors": {
            "@id": "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#authors",
            "@container": "@set",
            "@context": {
                "did": "@id",
                "name": "http://xmlns.com/foaf/0.1/name",
                "witness": {
                    "@id": "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#witness",
                    "@context": {
                        "witnessAlgorithm": "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#witnessAlgorithm",
                        "publicKey": "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#publicKey",
                        "signature": "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#signature"
                    }
                }
            }
        }
    },
"hashAlgorithm": "blake2b-256",
    "authors": [
      { "name": "Cardano Japan"
      }
    ],
  "body": {
    "summary": "Hard Fork to Protocol Version 10 --> is constitutional.",
    "rationaleStatement": "Constitutional”: We all concluded the governance action is constitutional, as it does not conflict with the current constitution.",
    "internalVote": {
      "constitutional": 5,
      "unconstitutional": 0,
      "abstain": 0,
      "didNotVote": 0
    },
  }
  ]
}
