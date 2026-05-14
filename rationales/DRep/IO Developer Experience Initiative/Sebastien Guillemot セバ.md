<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmXunanGbfxWwzCjaExWp8kmvkm3VVhKLQLh1Z8Z8JNsdW -->
# Sebastien Guillemot セバ

**Proposal:** IO Developer Experience Initiative
**Vote:** Abstain
**Voter ID:** `drep1y2csyxt7u2hl4674pl9cef5lknafaw5nraxvyx033kmd0es3awuv0`

---

I feel like this initiative is maybe a bit too vague in its current form.

Some initiatives like the Developer HUB, Community Collaboration, Developer Outreach, etc. require a fairly different skill set and team than cardano-init and ContractsLibrary. Although I trust IOG to do both in a sense, I think Cardano needs some bold bets at the moment and I'd prefer to see some bold bet on a specific idea that the community can rally around for developer onboarding

For example, I think "cardano-init" as described is not necessarily bad, but it won't really go deep enough to really solve some of the developer onboarding problems. In the pat few years, tools like yaci-devkit, dolos and utxorpc have made it much simpler to spin up node and start indexing, but *how* to make your Cardano project easy to index is still an unsolved problem. Other than some problems like Plutus not having events (making it hard to have a no-code way to index your app as you develop it, even with tools like utxorpc and dolos), even the orchestration about what transactions you need to make to setup your localhost testnet for your app are hard to specify. There have been attempts at this in Ethereum (ex: TheGraph, hardhat ignition), but they're hard to port to Cardano both because they're a bit old (use patterns and techniques that computer science in general can solve in better ways now), but also because Cardano doesn't have the same composability that people usually leverage when using an OpenZeppelin-like project to compose templates together. I think a more comprehensive solution would probably take some of these older ideas, some other attempts at this like EffectStream (fka Paima Engine), tx3, Starstream, etc. and try and figure out how to apply some of these ideas in the contract deployment setting (esp. in relation to what Cardano can do today, and possibly some upcoming features like nested transactions which may help with this)

All that to say, I think some of these solutions are more complex to properly solve. Cleaning up tools like aiken-mdx so you can have an OpenZeppelin-like UI for seeing different contracts on Cardano to leverage any pre-existing tools to build your dApps is definitely a step in the right direction, but I think you would get more excitement from layout out a more comprehensive vision (even if your proposal cannot build the comprehensive vision in one shot, having a comprehensive vision would make it clearer for other developers, dReps, etc.. what you're trying to do, why this doesn't overlap with previously funded initiatives, and the background to decide if this is a good bet to make)
