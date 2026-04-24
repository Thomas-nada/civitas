<!-- url: https://raw.githubusercontent.com/Agora-Cardano/dRep_metadata_storage/refs/heads/main/Governance_Actions/DeFiBudget25.jsonld -->
# Agora Cardano (by Rodrigo Pacini)

**Proposal:** Cardano Treasury DeFi Liquidity Budget
**Vote:** No
**Voter ID:** `drep1yt9dq806jcm56wzhnv2yrf6gcyq7h4gap8gxewfykk0dtfs7vf843`

---

Proposer has publicly stated that he will resubmit the proposal due to a small editing inconsistency, as can be seen in his tweet below. Because of this I vote no.

Link https://x.com/ElderM/status/1920131131581530246

Full text below.

`Post Mortem on the Info Action Hash

Brief recap:
I submitted an info action requesting 50 million ADA to increase liquidity in the Cardano DeFi ecosystem. Almost all of the funds were to go into DeFi protocols, and not to pay any specific person or organization. After submitting, http://gov.tools showed that the document hash was correct while most other tools show it is incorrect.

It looks like there were two breakdowns in the process:
1. I generated the info action file, and before submitting I looked it over and found that the URL link was too long and there was something to fix in the Rationale section. I regenerated the file and used the Github edit function, which inserted an extra character at the end of the file.
2. Gov Tools has a guard rail to check the document at the link. When it does the check, it stripped the last character of the document, which showed a perfect match to the file they generated. Thus, on http://gov.tools the hash is showing it is valid.

I have been talking to the Gov Tools team and they have raised an issue and will be putting a fix in. Unfortunately, I cannot just update the file on Github because I linked to the committed version of the file exactly to prevent this kind of situation (where the file could purposefully or accidentally be tampered with). I will have to resubmit.`
