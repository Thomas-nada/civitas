<!-- url: https://adawallet.io/public_files/votes/495bd3cd44ea6bc0b4c2dbb1e4cdc7e214874c2c07490a4e2476a627ef911280.jsonld -->
# MDS

**Proposal:** Tempo for Cardono Governance - Maintenance & Development Budget for 2025
**Vote:** No
**Voter ID:** `pool1vc8jhqtwjrjwsfk6a0enx47hd2ufg98c34ta6lvl0zv0uhpech9`

---

As a developer and DevOps specialist, I believe the requested amount is significantly overestimated and does not reflect the actual needs of a project of this type.

I also run an independent node and indexer. The Medusa cluster consists of 5 servers: one server running cardano-db-sync with 12 cores and 64 GB of RAM; three servers running cardano-node, providing redundancy and data to the db-sync, each with 8 cores and 24 GB of RAM; and a frontend server with 4 cores and 4 GB of RAM. Each server is connected to a reliable 2 Gbps channel.

The cluster operates stably and without interruption, serving around 600 unique users per day on average, with peaks reaching 1,000 at epoch boundaries. While that may not sound like a lot, wallet synchronization happens continuously, and in reality, the cluster processes tens or even hundreds of thousands of requests daily — even when users take no active actions after logging in.

I pay around $100 per month in total for this infrastructure.

You are requesting approximately $20,000 per month for infrastructure, based on the current exchange rate.

Even if all 948 DReps registered in the Cardano network — and we both know that’s objectively impossible — accessed your service and voted, it wouldn’t produce even 1% of the load my cluster handles. That’s assuming they all logged in and voted on the same day, which is also highly unrealistic. Voting events are infrequent and spread over time. Yes, nodes and db-sync do operate between voting periods as well — but so do mine, even when nobody is accessing them. Three nodes and one db-sync — all for $100 per month.

So my answer is “NO.”
