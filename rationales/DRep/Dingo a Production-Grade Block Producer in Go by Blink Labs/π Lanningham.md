<!-- url: https://314pool.com/votes/f35285db3c4e085ad331843b3007737952b8a322bb3216311edc37fdf44ad3da00.jsonld -->
# π Lanningham

**Proposal:** Dingo a Production-Grade Block Producer in Go by Blink Labs
**Vote:** Yes
**Voter ID:** `drep1y2sld9e4nmasqfpusd5e67rwczj4l20d3653jgs38r4mams52y4jx`

---

I am voting YES on governance action f35285db3c4e085ad331843b3007737952b8a322bb3216311edc37fdf44ad3da#0.

Dingo, a Go block producing node, is a clear net-value-add to our ecosystem, and Blink Labs is the only company that can deliver it.

Because of the security properties of Ouroboros, the Cardano network needs to reach a state where no single node has more than 50% of the stake. Without that, any single bug in the Haskell node threatens to permanently ratify a bad ledger state. For example, a bug in the Haskell node could ratify a ledger state with more than the 45 billion max supply of ADA, or corrupt wallet balance. We're lucky that the high-assurance engineering employed by Input Output has insulated us against such failures for 8 years, but the law of large numbers (and the increasing pace of innovation and change from Peras, Leios, and other large initiatives) tells us that it *will* happen eventually.

Such a bug would likely completely and permanently destroy trust in the network. Since we are already fighting with our hands tied behind our back in the arena of public perception, the network would likely not survive such a blow.

Instead, if the network operates with a diverse set of nodes, all with less than 50% of the stake, we are innoculated against such bugs. If the haskell node had 45% stake, and several alternative nodes had 55% of the stake, then such a bug would be rejected by the rest of the network well before making it past the 2160 block event horizon that makes it permanent.

Yes, Amaru is working on building an alternative node implementation in Rust, but a single alternative node alone cannot bring the stake distribution below 50% in the long term. Each additional node that gets built makes it easier to spread the stake across node implementations and reduces our risk of this kind of catastrophic total failure.

Of course, such diversity brings with it it's own risks and challenges; A bug in a node with a large portion of the stake can cause a short lived fork, which is economically disruptive, as we saw last year in the pig-chain fork. As such, we need these alternative nodes to be built by competent and proven teams who understand the responsibility and dangers of a non-conforming node. We need engineers who are dedicated not just to implementing what we *know* about the behavior of the Cardano node, but finding and implementing what we *don't* know.

For example, this is why I remain skeptical of AI driven node implementations. AI is very good these days, I use it every day to accelerate the work I do. But their skill is *deceptive*. Given the way they are trained, they are very good at implementing the things that *have already been implemented many times*. It is very easy for an AI coded node to *appear* to be progressing very quickly, implementing the things that are well known surface areas by this point: node to node protocols, node to client protocols, even a first pass at ledger validation.

But the bugs and subtle differences that lie off the beaten path can prove nearly incredibly damaging. These are the untrodden path, and it is much harder for an AI alone, without the guidance of an experienced engineer with deep Cardano expertise.

Indeed, by funding multiple teams, each with their own perspective, each building in a different language, but all collaborating and sharing notes, we dramatically increase the likelihood that *all* such efforts will be successful. The blindspots that a rust engineer, or one architectural design might have can be revealed by a completely different implementation. Because these teams share test suites and notes, each initiative is strengthened by the others, up to a point of diminishing returns.

This is why I believe it is valuable, even essential, to fund teams like Dingo.

You can find a larger writeup justifying my vote [here](https://314pool.com/post/dingo-vote-2026.md).
