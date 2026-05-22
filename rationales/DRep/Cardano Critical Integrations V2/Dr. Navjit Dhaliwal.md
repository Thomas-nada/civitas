<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmRfPcf7WimSVd9EwBMAPWXLHNyLwQRwfeaMvqYY2pNBM3 -->
# Dr. Navjit Dhaliwal

**Proposal:** Cardano Critical Integrations V2
**Vote:** No
**Voter ID:** `drep1yfya5pwcm2zw0e60c3pkqscq6spge7m0k6jtxkfsymv68gs2z56e5`

---

This proposal is not transparent enough for another 23 million $ADA after 70 million $ADA was already approved for Pentad V1. 

About 90% of the budget sits inside one confidential bucket for "integration and maintenance costs," with no public vendor level breakdown for Circle, LayerZero, Pyth, Dune or Fireblocks. I understand the NDA between the actual integrations but who is doing the maintenance? Who are the 3rd party vendors? Who is providing the infra? 

The proposal also allows funds to be converted into stablecoins and held with a custodian, including minting and custody fees, without clearly quantifying those costs up front. Steering Committee discretion remains very broad and reporting is only bi-annual.

On the V1 integrations: 

$USDCx is live but it is USDCx via Circle xReserve, not the broader "USDC/USDT on Cardano" story many people had in mind, prior to the proposal. Cardano's stablecoin market cap is still only very low, with about $16.6 million USDCx, so the realized liquidity impact remains much smaller than the narrative suggests - majority of the deploy by one founding entity with $NIGHT pairing.

But what about Dune and Pyth? What do they bring?

- Dune is an analytics/data platform. For Cardano, it gives SQL queryable onchain data, APIs/DataShare and dashboards for things like transactions, fees, staking, validator activity, smart contracts and user activity. A project usually does not need a deep protocol integration to "use Dune" - it mainly uses Dune by querying the indexed Cardano data and publishing dashboards or internal analytics on top of it. In other words, Dune is mostly a data visibility layer, not a protocol capability layer

- Pyth is an oracle/market data network. Projects integrate it when they need external price feeds for things like perps, lending, synthetics or risk engines. The integration path is more technical than Dune -developers fetch signed price updates off-chain with Pyth's SDK, then pass those updates onchain, where their validator checks the Pyth state UTxO/reference input and verifies the price update in the transaction flow. So Pyth is a runtime dependency for DeFi logic

Their impact on Cardano is still limited - both are mostly enablers, not direct adoption engines. Dune makes Cardano easier to analyze, compare, and monitor but analytics alone do not bring liquidity or users. We already have Taptools and Xerberus that do this.

Pyth is oracle infrastructure, but oracle access alone does not create volume unless multiple serious DeFi apps actually integrate and use it at scale. 

Are there competing Cardano native tools already? Yes.

For analytics and data access, Cardano already has ecosystem native tools like @TapTools, Cardanoscan, @cexplorer_io, @StatsAda and other explorers/analytics products. Dune's advantage is not that Cardano had no analytics before - its advantage is that it puts Cardano data inside a crosschain platform already used by crypto researchers, fund and growth teams. That is useful but it is still different from saying it created new enterprise adoption on its own. We also have oracles on Cardano already

Does this provide enterprise adoption? No. 

Dune can help enterprise or institutional teams see and compare Cardano data more easily and Pyth can help DeFi products build with institutional style pricing infrastructure. But neither one, by itself, is an enterprise adoption event. 

LayerZero

This is probably the integration with the highest upside but it is also the clearest example of why I do not think the proposal is fully candid in its top line framing.

The official CCI V1 closure report says LayerZero is only in advanced stages and is targeting Q3 for launch. It also says that OFT deployments on Cardano are explicitly out of scope for V1 and may need separate governance actions later. So LayerZero is not a cleanly delivered/live integration 

That is reinforced by LayerZero's own public developer docs. The "Get Started" docs currently tell developers to choose from EVM, Solana, Aptos or Hyperliquid and the public mainnet endpoint deployment page I checked does not list Cardano. That does not prove Cardano work is nonexistent but it does show that from a public builder and market perspective, Cardano does not yet look like a standard first class live LayerZero environment.

Fireblocks

The proposal presents Fireblocks as a new full native integration funded in V2, expected to cover $ADA, CNTs, staking and governance workflows. That already means V2 is not purely a maintenance proposal. It is partly a new integration proposal bundled inside a maintenance budget.

The official CCI V1 closure report is explicit that Fireblocks did not result in a V1 disbursement and that the ecosystem instead got an Iagon SDK level Fireblocks integration outside V1. The report even acknowledges that this delivered "material institutional access." Meanwhile, the public Fireblocks GitHub repo for cardano-raw-sdk describes a Fireblocks/Iagon integration that already supports:

- ADA and CNT transfers
- governance operations
- staking operations
- and mainnet/preprod/preview support through the Iagon API

That is exactly why I have an issue with the V2 framing.

The proposal and closure report effectively say -
yes, Iagon delivered something meaningful but "most institutional counterparties" still need a full native L1 Fireblocks integration. The problem is that this is asserted, not really proven. There are no named counterparties, no quantified demand, no pipeline value, no expected custody volumes, no exchange listings tied to it and no business case explanation for why the existing Iagon path is not sufficient for a larger portion of the market. It also contradicts discussions Iagon has had with business partners wanting to use the solution.

From a business perspective, that means V2 is undervaluing an existing ecosystem delivered stop-gap while asking Treasury to pay again for a deeper version without clearly quantifying the incremental return.

For transparency - I am the CEO of Iagon and Iagon works with Fireblocks. That may create a perceived conflict of interest, so I want to disclose it clearly.

My comments on Fireblocks should be read as focused on governance, scope clarity and Treasury accountability, not as a statement against Fireblocks as a company or product. My issue is not with Fireblocks itself. My issue is whether this proposal clearly justifies the additional Treasury spend and properly explains the incremental value to Cardano.

The transparency problem

The proposal does mention maintenance and infrastructure costs

- attestor operations for Circle
- DVN and endpoint operations for LayerZero
- oracle feed continuity and publisher incentives for Pyth
- schema/subgraph maintenance for Dune.

But it does not break any of that down by vendor, by integration, by FTE, by infrastructure unit cost or by SLA cost. Everything is rolled into the same ~90% bucket. 

That is not good enough for Treasury capital. The response to this is basically - confidentiality. But confidentiality may be commercially understandable and still governance poor.

If the community cannot see the 3rd party cost structure, then the community cannot really judge whether the renewals are well priced, whether the value is proportional or whether one vendor is being overpaid relative to ecosystem benefit.

The proposal is too opaque. Too much money sits in a confidential bucket. Too much discretion sits with the Steering Committee. Too little hard ROI is shown for what V1 already bought.
