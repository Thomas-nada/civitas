<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmQ1yFHeihoSggHwsqDAJ57v5kxdZZJmmMeqW39DPiZTaP -->
# Sebastien Guillemot セバ

**Proposal:** IO & VacuumLabs Enhancing Plutus - Performance, Correctness, and Usability
**Vote:** No
**Voter ID:** `drep1y2csyxt7u2hl4674pl9cef5lknafaw5nraxvyx033kmd0es3awuv0`

---

I've thought a lot about this proposal, and decided to vote no. I'll share my rationale below:

First off, as everybody knows, treasury spending is limited and there are a lot of proposals. That means that we have to triage features we want to build this year. In my mind, Plutus is very stable. It's extremely rare that I meet a developer that wants to onboard onto Cardano, and the main blocker ends up being the Plutus usability. Almost always it's a consensus feature, a ledger feature, or a feature that Plutus fundamentally cannot deliver since it wasn't built for it (ex: ZK)

That being said, Plutus does need to be maintained in three important ways even if working on it is not a core bet for how we will grow Cardano:
1. Ensuring correctness (esp. against growing AI threats to code)
2. Performance improvements (Plutus still powers many contracts, so improving Plutus performance benefits every user)
3. Adding new precompiles (ex: upcoming post-quantum primitives being added to Cardano)

However, all three of these features are more "maintenance" than "enhancing Plutus". In fact, the "Cardano Maintenance" proposal by IOG even mentioned Plutus Core maintenance in relation specifically to these points (and post-quantum work is proposed as different treasury proposals, so the cost of adding these precompiles I believe will largely not need to be covered by this proposal)

I think Cardano needs some bold bets right now over maintenance. For example, if you gave developers the choice between making Plutus 1.5x faster or having event support for Cardano, I think a large number of people would pick events (and I think it would have a much bigger effect on Cardano adoption that slightly faster Plutus). However, adding events to Plutus requires a lot of rethinking about how things work (outside the scope of what this proposal is trying to do). I really don't think any of the "Developer experience" improvements mentioned in the proposal will move the needle at all (I think almost everybody will just dismiss these) compared to some of bigger ideas.

However, I'll be monitoring this proposal to see how others vote. If it gets close to passing and I end up being the blocker, I may change my vote to avoid me being the blocker on this passing. I'm voting no mostly to signal my feeling on this proposal, but if the rest of the ecosystem wants this to pass as-is I do feel the Plutus team will use the funding honestly and will try to do their best with the funds received
