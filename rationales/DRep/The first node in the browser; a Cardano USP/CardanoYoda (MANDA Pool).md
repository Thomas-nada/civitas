<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmXPNEh3STaQjiQXTMMF1dU8cVfhuzdRE1Va4XqAWewDy2 -->
# CardanoYoda (MANDA Pool)

**Proposal:** The first node in the browser; a Cardano USP
**Vote:** Yes
**Voter ID:** `drep1y2m0g4r66pyaw3p7u454wc0p4f0ygm8ueaev0mgd3tvwm7sskqwqp`

---

As a DRep, I decided to vote YES for the proposal: The first node in the browser; a Cardano USP.

This proposal concerns Gerolamo, a TypeScript implementation of a Cardano node, scoped specifically to the browser-extension light-node use case. The goal is to deliver a production-ready Cardano light node that can run in the browser and expose a messaging API to dApps and wallets. This would allow applications to obtain locally verified chain data instead of relying entirely on trusted external servers.

The main reason I support this proposal is that Gerolamo could help move Cardano wallets and dApps toward a more trust-minimized model. Today, many applications depend heavily on backend providers, indexers, APIs, or other server-side infrastructure. This is convenient, but it also creates dependency on external services. A browser-based validating node could allow users and developers to interact with Cardano with stronger local verification guarantees.

This does not only matter for users who explicitly demand maximum sovereignty. Most users probably do not think in terms of “full validation” or “trust minimization.” However, they can still benefit from applications that are more reliable, more responsive, and less dependent on centralized infrastructure. If delivered successfully, Gerolamo could make stronger security assumptions available through ordinary browser-based applications.

I also see value in Gerolamo from the perspective of client diversity. Cardano should not rely forever on a single dominant node implementation or one main codebase at the networking and validation layer. Gerolamo is not funded here as a block-producing node, and server-side relay roles are explicitly out of scope under this proposal. However, a successful TypeScript implementation of ledger validation, networking, and browser-based node architecture could become an important foundation for future alternative node work.

That said, my YES vote is not without concerns.

I also note that Gerolamo has received previous funding, and based on the public project status, the final milestone from that earlier funding appears to remain paused or unfinished. I do not consider this, by itself, a reason to reject the current proposal, especially because the new proposal has a clearer scope and a stronger milestone-based structure. However, I would still like HLabs to provide a clear retrospective on the previous funding.

Second, the proposal still carries high execution risk. A browser-based Cardano node is technically plausible, but difficult. The hardest part is not simply making something sync in a browser. The hard part is the correct and robust implementation of ledger rules, chain selection, rollback handling, Plutus validation, protocol parameter changes, storage behavior, and conformance with the reference implementation.

The author's clarification was useful, especially regarding the proxy architecture, Mithril, browser runtime assumptions, and the distinction between technical feasibility and production readiness. However, it also confirms that conformance is not currently a milestone-gated requirement, even though a significant part of the Haskell node conformance tests has reportedly been ported, and more work is ongoing.

Third, I recognize that demand for this kind of infrastructure is not always easy to prove in advance. Users do not usually ask directly for client diversity, local validation, or reduced RPC dependency, but they can benefit from these properties indirectly through more resilient and trust-minimized applications. 

For this reason, I do not consider the absence of a fully proven demand to be a reason to reject the proposal. However, adoption remains an important factor to watch. I would welcome clear communication from HLabs during delivery about potential wallet or dApp integrations, proxy operator interest, and usage indicators that show whether Gerolamo is moving from technical capability toward practical ecosystem adoption.

In conclusion, I am voting YES because I believe Gerolamo addresses an important long-term infrastructure need for Cardano: more trust-minimized dApps and wallets, reduced dependency on centralized backend services, stronger client diversity, and a potentially distinctive browser-based validation model.

At the same time, I recognize that this is an ambitious infrastructure proposal with meaningful technical and adoption risks. My YES vote reflects support for the direction, the potential ecosystem benefits, and the team’s continued work, while also recognizing that delivery should be followed closely by the community. In particular, I will be looking for transparent reporting on progress, conformance work, benchmarks, adoption signals, and how the team builds on lessons from the previous Gerolamo funding.

If you'd like to support my work, consider delegating to the MANDA pool and backing me as a DRep. Your support is the only way I can get time for governance.

MANDA Pool ID:
pool1c3fjkls7d2aujud8y5xy5e0azu0ueatwn34u7jy3ql85ze3xya8

My DRep ID:
drep1y2m0g4r66pyaw3p7u454wc0p4f0ygm8ueaev0mgd3tvwm7sskqwqp
