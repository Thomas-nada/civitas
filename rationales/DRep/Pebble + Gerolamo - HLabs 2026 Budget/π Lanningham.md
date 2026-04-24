<!-- url: https://314pool.com/votes/b11527fbcdc9d41e8f497de64a029a18673a5eefc413718459046f0b7a1a665600.jsonld -->
# π Lanningham

**Proposal:** Pebble + Gerolamo - HLabs 2026 Budget
**Vote:** Yes
**Voter ID:** `drep1y2sld9e4nmasqfpusd5e67rwczj4l20d3653jgs38r4mams52y4jx`

---

I am voting YES on governance action b11527fbcdc9d41e8f497de64a029a18673a5eefc413718459046f0b7a1a6656#0.

I came very close to voting NO or ABSTAIN on this proposal, but ultimately came in as a YES.

(Nearly) All arguments for node diversity that I made in my [Dingo vote](https://314pool.com/post/dingo-vote-2026) apply year as well.

However, here is why I was on the fence and this was a much harder decision to make for me:
1. Feasibility
I believe the vision of having a full typescript node that runs in the browser is a pipe dream and likely to fail for many reasons:
- Communication challenges between the browser and other nodes; unless we fundamentally change *all* node implementations, the browser node will always be dependent on a separate backend relay.
- Performance challenges; The performance budget for Cardano nodes, is already challenging to hit: a node has to produce a block within 1 second, propagate blocks efficiently, evaluate many chains, hold a lot of state in memory or persisted to disk, etc; While not insurmountable for typescript currently, it's a huge engineering lift. And this likely becomes impossible to do safely for the full Leios protocol.

In the end, despite high chance of failure in the *end goal*, I think this is a case of landing among the stars. Even if the project fails, it will produce artifacts that are well worth the cost:
- Additional skilled engineers focused on contributing to conformance testing and specification of the Cardano protocol
- Useful parsing and validation libraries for use in the browser
- Light-wallet / trustless validation primitives for dApps

2. Overlap

In my estimation, there is a spiritual overlap between the deliverables in Intersect administered [Gerolamo vote from last year](https://2025budget.intersectmbo.org/ballots/680d1b63565577986442d123/proposals/680d1b64565577986442d27e) and this one.

Consider the following excerpts from proposal deliverables from both proposals:

2025 budget:
> The goal is to have a fully functional light node that can run in the browser and can be integrated in dApps and wallets.
This proposal
> a production-ready light node (Gerolamo);

In the end, last years ask was sufficiently small, and "production-ready" load bearing enough that I'm willing to overlook this.

3. Delivery risk

I am not as certain about Harmonic Labs' ability to deliver as I am of Blink Labs on the Dingo node. Based on milestone submission for the [previous Intersect administered](https://treasury.sundae.fi/instances/9e65e4ed7d6fd86fc4827d2b45da6d2c601fb920e8bfd794b8ecc619/project/EC-0014-25) project, milestone submission has come in consistently late.

Additionally, a cursory glance at [the teams Github](https://github.com/HarmonicLabs/) seems to indicate they have 3 developers currently. This proposal asks for funding for 10 engineers (it doesn't specify which of these are already part of the project vs net-new additions, so charitably, this is covering the existing teams salary and 7 new hires). However, running a team of 3 engineers, and running a team of 10 engineers, are fundamentally different beasts; Unlike Dingo, where the team has practical real-world experience running larger teams and big open source projects, HLabs' ability to scale their team is unproven. Hiring that many engineers in a short period of time adds additional risks. They also run the risk of stretching themselves thin with other projects, such as their [unreleased DEX](https://gravitydex.app/) and [unfinished Catalyst projects](https://www.catalystexplorer.com/en/proposals?p=1&q=HLabs).

In the end, I know the engineers involved are competent (by their existing deliveries on other projects) and well intentioned. Their 3rd party oversight board consists of respected community members, using well tested and familiar contracts (written in part by myself). This limits the risk to opportunity cost (the risk that we allocate funds out of our NCL that cannot be used elsewhere), not risk of lost funds.

4. Omnibus

I have a [documented preference](https://314pool.com/post/2025-treasury-withdrawals) against omnibus proposals; Lumping Gerolamo, Pebble, and maintenance on existing libraries here is immediately distasteful for me.

That being said, the 3 projects likely have a high degree of overlap, and so I can see why pooling resources for them is valuable.

5. My personal conflict of interest

If I'm being totally honest, I have a conflict of interest here. This is why, had I decided the balance of the above was pushing me towards a no, I likely would have voted Abstain instead. Michele and I do not get along, and I do not believe he engages in protocol level discussions in a healthy way. He escalates tensions, discounts hard work and analysis from smart thinkers if it doesn't align with his goals, and has a tendency to assume that if he can't see the utility in something, it doesn't exist.

Him and I are also building competing products with different priorities, which doesn't do either of us any favors in giving the other a benefit of the doubt.

(And if you're reading this, Michele, no, I'm not talking behind your back. I can't tag you in on-chain metadata, nor do I consider speaking publicly about you in a way consistent with feedback I've tried to share with you before to be 'talking behind your back', nor is it censorship to reserve my energy for interacting with people who don't exhaust me; Your accusations to this effect fall flat because I've never tried to hide how my opinion about you has evolved over time in response to your own behavior, even if that has been in *public* discussions with other people. For what it's worth, I don't bear you any ill will, and hope you're successful in your endeavors for the benefit of us all. I just don't have the energy to participate in the kind of energy-draining "proof-by-exhaustion" argumentation tactics that you sometimes resort to.)

In the end, however, the reason I have a framework to evaluate proposals is exactly to identify these personal biases, be transparent about them, and attempt to correct for them in the way I vote. I don't believe  I believe all of the above reservations are valid, and *still* don't override the existential threat to Cardano that is our reliance on a single node.

You can find a larger writeup justifying my vote [here](https://314pool.com/post/gerolamo-vote-2026).
