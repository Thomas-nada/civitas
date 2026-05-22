<!-- url: https://raw.githubusercontent.com/adosiawolf/drep-rationale/refs/heads/main/0078 -->
# Kyle Solomon

**Proposal:** IO & Ensurable Systems Cardano Maintenance Initiative
**Vote:** Abstain
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
    "title": "Voting rationale for action gov_action1w0shrfxqwv95kk0v4cn34wylz25a2cmqkq5jpc0e2yrahhqava3qx4njfhm",
    "givenName": "Kyle Solomon",
    "image": {
      "@type": "ImageObject",
      "contentUrl": "https://raw.githubusercontent.com/adosiawolf/m/refs/heads/master/solomon-team-400x400.jpeg"
    },
    "comment": "I am voting ABSTAIN on supporting the IO & Ensurable Systems: Cardano Maintenance Initiative.\n\n
	This is the least transparent of all the IO proposals. Maintaining the Haskell node is abhsolutely necessary, though I cannot adequately assess this proposal given the lack of transparency. If we do indeeed need to spend > $15M annually to maintain the node, we have a very serious revenue problem which needs to be prioritized immediately. \n
	Based on community sentiment I do not believe this proposal will pass as-is. Please resubmit with a greater degree of transparency such that adequate assessment can be made."
   },
  "authors": [
    {
      "name": "Kyle Solomon"
    }
  ],
  "hashAlgorithm": "blake2b-256"
}
