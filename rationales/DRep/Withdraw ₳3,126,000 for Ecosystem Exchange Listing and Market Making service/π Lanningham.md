<!-- url: https://www.314pool.com/votes/treasury-withdrawals-2025-batch-1.jsonld -->
# π Lanningham

**Proposal:** Withdraw ₳3,126,000 for Ecosystem Exchange Listing and Market Making service
**Vote:** No
**Voter ID:** `drep1y2sld9e4nmasqfpusd5e67rwczj4l20d3653jgs38r4mams52y4jx`

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
            "uri": "CIP100:reference-uri"
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
    }
  },
  "body": {
    "comment": "This justification serves as a batch justification for my votes on the 39 treasury withdrawals in 2025 administered by Intersect.\n\nHere is a brief description on my methodology:\n\n- I identified what I believe would be a reasonable spend from the treasury\n  - I estimated the total inflows of ADA over the next year (roughly 308 million ADA)\n  - I estimated the network-wide staking returns (roughly 3.63% annually)\n  - I estimated how much we'd need to spend from the treasury for the treasury to experience the same return (~242 million ADA)\n- I identified each proposal where I believed I had a conflict of interest.\n- I identified each proposal that I could find a public commitment to return surplus ADA.\n- I identified whether each proposal was an "omnibus" proposal, asking us to vote on multiple proposals.\n- I assigned each proposal a score between 0 and 1 on the dimensions of Ecosystem Need, Confidence of Delivery, and Confidence of Quality\n- I estimated how much I thought each proposal would cost to produce, giving the benefit of the doubt towards those that had detailed breakdowns of employees\n- I identified any proposals that had a portion of the funds destined for other entities, such as Catalyst and the Builder DAO\n- I computed the "actual" amount of ADA they were asking for: The amount being asked, minus the amount being distributed to other parties, and then factoring in the surplus ADA commitment at current prices\n- I computed a "normalized log profit ratio" as `1 + log(estimatedCost with 20% profit margin / actualRequest)`\n  - This gave a score below 1 for things which I estimated would make greater than 20% profit for the proposers, and higher than 1 for those that would make less\n- I then multiplied the ecosystem need, confidence of delivery, confidence of quality, the normalized log profit ratio, and a 10% penalty for omnibus proposals to get a final score.\n- I sorted these scores from highest to lowest\n- Finally, I decided to vote yes on proposals from the top to the bottom until I breached my spending target of 242 million ADA\n  - For this I used the original amount requested, not the adjusted amount, as there is no guarantee those funds will flow back to the treasury\n  - This went slightly over, but not by much, and would result in a 2.66% return for the treasury\n  - If the proposals that committed to returning funds do so, it'd result in a 7.12% return for the treasury\n\nThis methodology is not perfect, and still has quite a bit of subjectivity to it. For that reason, I won't be publishing each projects score, as I don't want to create drama and cause debates about whether someone should have been a 0.8 instead of a 0.7.\nI should also emphasize that most of the proposals were great, and drawing the line anywhere would be painful, so please do not take it personally if I didn't vote for you.\n\nIn future funding rounds, the following changes would improve my scoring:\n\n- Avoid Omnibus proposals; this year I went relatively light, because we're still figuring out the process and there was lots of confusion. In future years, if I use the same methodology, the omnibus penalty will be higher.\n- Clearly outline your costs, and provide more justification for them. In many cases, proposals _only_ gave a total number, and didn't outline the team involved, and so I took a pessemistic assumption, which hurt the normalized log profit ratio.\n- Much of the detail of the proposal was provided elsewhere, such as on Ekklesia or external persentations, but wasn't included in the on-chain proposal. In the future, I will only consider what is on-chain.\n- Please clearly delineate your intended policy for surplus ADA in the case of an increased price; It's ok to say that if you're absorbing the downside risk, you should also get (some or all of) the upside as well, but just be clear in the proposal.\n- As feedback for Intersect, much of the proposal real estate was taken up by the repetitive voting procedures. In the future, I would recommend publishing those separately on-chain using CIP-100 style metadata, and then just referencing them, perhaps as a dedicated metadata field.\n- Many proposals did not do a great job of justifying their value, or comparing to existing solutions in the space. Please spend more effort on giving (and backing with evidence) the quantifiable benefits to the ecosystem out of your proposal.\n\nThe proposals that would have prevented a conflict of interest for me are the following:\n\n- Midgard Optimistic Rollups - There is a small chance that Sundae Labs may be contracted to help with Midgard given how close Sundae Labs and Anastasia Labs are.\n- Blockfrost Platform community budget proposal - There is a small chance that Sundae Labs may be contracted to help with this proposal, given our experience with Hydra and our past work with Blockfrost\n- 2025 Input Output Engineering Core Development Proposal - Sundae Labs is currently contracted to work on at least one of the projects covered by this proposal\n- MBO for the Cardano Ecosystem: Intersect - Sundae Labs built the treasury contracts and portal used by intersect to administer treasury funds, and is currently in discussions to renew that contract\n\nThe following _might_ have presented a conflict of interest, but I determined they would not:\n\n- OSC Budget Proposal - Paid Open Source Model - We are contributors to Open Source, and may ultimately be a recipient of these funds, but we currently have had no active discussions or plans to do so.\n- Catalyst 2025 - We have recieved Catalyst funding before, but currently have no plans to seek direct funding in the covered rounds; This may change based on circumstance.\n- Pallas, Dolos, UTxORPC - We are contributing to these projects via several ongoing projects of our own, but have no plans to ask for funding from TxPipe for doing so\n\nIn the end, this led to me deciding I would have voted YES on all proposals except the following (in no particular order):\n\n- Ecosystem Exchange Listing and Market Making service pool\n  - This proposal tried to emphasize that the team receives no funds, it goes to Cardano projects; but those funds are then just used to pay for Flowdesk services, and so I didn't understand the distinction. The proposal listed 3 team members, funded only through the end of 2025, which made the normalized profit ratio very very low for the size of the ask.\n- Expanding Stablecoin / Cardano Native Asset Support / Fiat Ramps\n  - It was unclear to me what the need for this was, specifically as a public good; Ultimately this sounded like a business venture for Anzens, which would drive a lot of revenue for them, which made me wonder why the treasury should pay for it. Additionally, given the history of delays on the Anzens project, I had slightly lower confidence of delivery.\n- MLabs Research towards Tooling for Elliptic Curves\n  - The proposal was unclear why this was needed, or which projects were looking for these primitives; Also, it being Plutarch specific greatly limited the utility or value of it in my eyes.\n- MLabs Core Tool Maintenance & Enhancement: Cardano.nix\n  - I rated this very very low on the ecosystem need scale; Nix, in my experience over the last 4 years, does nothing but slow teams down and fail to deliver on it's reproducible build promise.\n- Hardware Wallets Maintenance\n  - I rated this highly on value, confidence of delivery, and confidence of quality; unfortunately, the normalized profit ratio based on the stated resources was extremely low, suggesting to me this was greatly over-priced\n- Ledger App Rewrite\n  - I rated this fairly low on the ecosystem need axis, mostly because it felt like double dipping with regards to the maintenance, and it was unclear what would happen if one passed and the other didn't. This also scored low on the normalized profit ratio.\n- High Yield RWA Asset for Cardano: Tokenized Real Estate\n  - I rated this very low on confidence in delivery; Those using the Haus branding (whether it's the same team or a different team) have a history of raising large funds and not delivering; They do not seem keen on building on Cardano, only doing so if there's money for them; Also, the problem they proport to solve, on the regulatory side, is a massive massive undertaking.\n\nNote that due to several weeks of travel without access to my keys, many of the 39 proposals were ratified before I cast my vote. I include my justification here regardless, so that my delegators can see how I would have voted.",
    "references": [
        {
            "label": "Extended Justification",
            "uri": "https://314pool.com/post/2025-treasury-withdrawals"
        }
    ],
    "externalUpdates": [
        {
            "title": "Personal Blog",
            "uri": "https://314pool.com/"
        }
    ]
  },
  "hashAlgorithm": "blake2b-256"
}
