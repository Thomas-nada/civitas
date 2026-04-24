<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmdBq5qBZuMDCDsiGNKdLiUhFn3mvSDH9816oqmGF8VyhT -->
# Sebastien Guillemot セバ

**Proposal:** Pebble + Gerolamo - HLabs 2026 Budget
**Vote:** No
**Voter ID:** `drep1y2csyxt7u2hl4674pl9cef5lknafaw5nraxvyx033kmd0es3awuv0`

---

Keep in mind this review is in the context of the 2.25m ask

## Pebble

I don't believe an alternative to Aiken that's 50% better will be difference maker in getting Cardano more adoption. Definitely any improvement to Plutus usability is nice and I've heard many good things about Pebble, I would rather fund somebody to try building a totally different approach to UTXO smart contracts that has some solid idea behind it. Especially because although Starstream development is going well and we haven't hit any issues, there's never a sure thing in software engineering so there's always a chance something goes wrong with Starstream (proof generation too slow, transactions too big, people don't like the devx, etc.). Instead of putting all the eggs in the Starstream basket, I'd be more comfortable if there was another alternative plan (even if multiple ways to achieve some end goal getting funded always leads to issues).

Realistically Plutus hasn't really gotten much adoption in the world, and I don't think an iterative improvement will be what gets a new wave of developers to come build on Cardano. It's not a new narrative. It's not a 10x unlock in new capabilities. It's meaningful work and true improvement, but I think Cardano needs some big new ideas. If you ask a lot of the large projects that tried to build on Cardano (either internally or externally), it's not that they weren't able to build because the language was too complicated or they were missing one feature or two. It's often times because they were missing big-ticket features that are fundamentally incompatible with the way Cardano is architectured today. yeah but it doesn't solve the fact events are missing (and basically impossible to properly add), the fact that ABIs are missing (and basically impossible to properly add), that data-heavy use-cases like L2s are infeasible, that privacy / crypto-heavy use-cases are basically blocked, that compute-heavy use-cases can't be atomic, that state channels are missing features to really deliver, that composition is so limited at the protocol level that most dApps live in isolation, etc. etc. etc.. These are the problems almost everybody runs into, and Pebble can make some iterative improvements on these, but almost all of them are fundamental problems at the ledger/plutus core level that Pebble cannot easily address.

For example, if the author is passionate about composability, I'd rather have a proposal where they go deep into what the UTXO could look like in relation to MPC/coSNARKs/FHE/related concepts and try and come up with what the UTXO model could look like in that lens. I think for sure there has got to be multiple ways you could rig the UTXO model to connect to these that gives you orders of magnitude more expressiveness in composability compared to what we have now. It can grow into an alternative to Starstream, or orthogonal to it. it's entirely possible the result of the investigation (just like was the case for Starstream) is that it requires a lot of new cryptography, a lot of hard work, and multiple ledger-level changes to make happen, but I think that's the kind of rethinking and new narrative that Cardano needs

## Gerolamo

Although the project is meaningful and unique, for these kinds of these I always feel like we would end up with a better result (both for our ecosystem and the world) if you instead just put $1m into funding wasm development in general and leveraged the result of that (Wasm makes progress every year and I think a lot of people are sleeping on how much progress has been made, but there are still many areas that I think could make a big difference if improved where standards committees have already agreed and it's just missing an implementer).

For example, this is the kind of thing I'm talking about though

for example, if you need to model code that accesses the file system (often the case in typical nodes), the Wasm Component model allows for this through wasi-filesystem (https://github.com/WebAssembly/WASI/tree/main/proposals)

for threading (another common ask), the new Wasm Component 0.3 supports async and streams, which makes it very easy to implement a lot of concurrency systems (and compile many new kinds of languages into Wasm components). Additionally, with new standards like wasi-gfx, you can outsource certain computations to the user's GPU directly from Wasm which lowers a lot of cases people historically needed threads in Wasm (rendering UI or doing expensive computation)

There's a lot of work being done on Wasm components, but there are still a lot of specification blockers for big projects (ex: how does the Wasm GC proposal compose with the Wasm component system?), as well as implementation blocks (ex: Firefox said they want to implement Wasm Components in the browser natively, but no clear when they'll finish this work), but although there are a lot of work to be done on Wasm components, I think a lot of things are now within reach and could be accelerated over giving up and doing stuff in the JS layer (which historically was the go-to solution). By spending the money to instead make a node like Dingo is compatible with Wasm Components, we probably take on less engineering debt (no need to update Gerolamo every hardfork), and any work we need to do (probably not *that* much work) is beneficial to any project in the web that is built using wasm components (and increasing number of projects, including other Cardano efforts)
