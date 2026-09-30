<!-- url: https://cardanotech.io/anchordata/gov_action17m7nv783.jsonld -->
# TECH

**Proposal:** Should stakePoolTargetNum (k) be raised from 500 to 1000 (SPO poll)
**Vote:** No
**Voter ID:** `pool15cy4p3axu0m6sfrmxsp46z5cevx3ruksfwjl48730cgx24j4ydz`

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
  "authors": [],
  "body": {
    "comment": "I will vote NO on this proposal, and here are my arguments: 

Cost - Setting k to 1000 would theoretically mean Cardano’s infrastructure would double. In practice it might not fully double — maybe closer to 1.5x as a ballpark estimate. That would still lead to higher stake pool fees for delegators.

Migration - There are far too many dormant ADA wallets. That would put SPOs in a very uncomfortable situation: they’d be forced to set a high fee to chase dormant wallets away (or at least to make a profit from them, since rewards drop on an oversaturated pool), which in turn will chase away the loyal active delegators.

Block propagation time - A higher k would also mean more relays, which would increase block propagation time. That raises the chance of chain forks and height battles, which hurts overall throughput.Cardano already has by far the highest Nakamoto coefficient of any blockchain, and it is still increasing. With this in mind, I struggle to see the point of raising k to 1000."
  },
  "hashAlgorithm": "blake2b-256"
}
