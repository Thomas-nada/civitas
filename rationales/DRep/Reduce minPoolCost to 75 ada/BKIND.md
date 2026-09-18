<!-- url: https://smitblockchainops.nl/governance/vote-minpoolcost75-75e7882a.jsonld -->
# BKIND

**Proposal:** Reduce minPoolCost to 75 ada
**Vote:** No
**Voter ID:** `drep1ytc6867ae0xmkekvmex79r9akyy28eu8nu03jf3xu9fle6c82l4eq`

---

Action: parameter change 75e7882a8ef2bc39517bffbfb654e89f525def5a8364d81e11fc5facafc6dd9b#0, Reduce minPoolCost to 75 ada.

What is being decided. One parameter moves: minPoolCost from 170 to 75 ada. I verified the on-chain payload: only that change, with the correct predecessor reference and guardrails script. Without the bundled security parameter of action 154, SPOs cannot vote on this action; DReps and the Constitutional Committee decide alone.

I verified the document I am voting on. The blake2b-256 digest of the bytes retrieved from https://gateway.pinata.cloud/ipfs/bafkreidy6ftyudcx6lwkualmjbgkurhlqo35s6jarq3phxendcr5el6n34 equals the anchor hash recorded on chain, e32f6117912d810c82f0f153e7bf787024870ddb82601113e580c7d86bd8f384.

At action 154 I voted No with a full rationale on chain: I supported the Plutus memory increase, opposed this cut, and objected that one vote could not record both. The proposer has now unbundled the two, which is the form my rationale asked for, and I credit that. This vote is therefore about the cut alone.

The mechanism is unchanged since I analysed it at 154. The fixed fee recovers an operator's fixed costs, which do not scale with stake, and discloses those costs on chain; minPoolCost is read in exactly one place in the ledger, the validation that refuses a certificate priced below it. It stops underpricing and enables nothing else. The proposal expects market pressure to push declared fees down to the new floor: pressure to declare a fee other than what the pool costs to run, the behaviour the minimum exists to prevent. I do not object to revisiting the level. I object to converting a disclosure of costs into an instrument of price competition.

The measurement, re-run at epoch 653 across the 765 public operators (margin below 100%) whose pool earned a reward: removing 95 ada costs the median operator 21.2% of take-home income; the 233 operators declaring exactly 170 lose 39.2%; the lowest income class (88 operators) 52.1%, the highest (97 operators) 6.3%. The 98 pools at 100% margin are untouched, collected 66.1% of all operator income that epoch, and paid their delegators 1.8 ada in total. At 154 (epoch 645) these figures were 21.3, 38.7, 51.5, 6.2 and 67.8 percent: materially unchanged, on both of my independent data sources.

A small operator has two options and no third: match the lower fee and lose that income while the servers cost what they cost, or hold it and advertise a lower return to delegators who compare precisely that number. Competition on a fixed fee is competition in who can best afford to give up fixed income, and that is by construction the party who needs it least.
