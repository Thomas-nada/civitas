<!-- url: https://coffeepool.jp/voting/rationale_PlominHF.json -->
# KISSA

**Proposal:** Hard Fork to Protocol Version 10 ( Plomin Hard Fork)
**Vote:** Yes
**Voter ID:** `pool1lugxr82p89qm35spzwccle405t5dfdznhrasyrtr2cyv2vyfud6`

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
  "authors": [CoffeePool/CardanoKissa],
  "body": {
    "comment": "We vote “Yes” on the Plomin hard fork. However, we would like to explicitly state that there are still concerns regarding the decentralization of DRep delegation and the security of the Cardano Node."
  },
  "hashAlgorithm": "blake2b-256"
}
