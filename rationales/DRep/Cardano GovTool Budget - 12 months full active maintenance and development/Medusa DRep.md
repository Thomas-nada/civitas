<!-- url: https://adawallet.io/public_files/votes/9d213a57684d7ddf6f3350c80d042639ecbed5ccccc4a05bf54959a086593e7b.jsonld -->
# Medusa DRep

**Proposal:** Cardano GovTool Budget - 12 months full active maintenance and development
**Vote:** No
**Voter ID:** `drep1yg5pzxhp0lu0m7757ww2hke8qhcuqgqt3c2ezphngwytz4gjr6yge`

---

As a developer and DevOps specialist, I believe the requested amount is significantly overestimated and does not reflect the actual needs of a project of this type.

I also run an independent node and indexer. The Medusa cluster consists of 5 servers: one server running cardano-db-sync with 12 cores and 64 GB of RAM; three servers running cardano-node, providing redundancy and data to the db-sync, each with 8 cores and 24 GB of RAM; and a frontend server with 4 cores and 4 GB of RAM. Each server is connected to a reliable 2 Gbps channel.

The cluster operates stably and without interruption, serving around 600 unique users per day on average, with peaks reaching 1,000 at epoch boundaries. While that may not sound like a lot, wallet synchronization happens continuously, and in reality, the cluster processes tens or even hundreds of thousands of requests daily — even when users take no active actions after logging in.

I pay around $100 per month in total for this infrastructure.

You are requesting approximately $27,500 per month for infrastructure and maintenance(I’m not even considering the other items or amounts — only this one), based on the current exchange rate.

Even if all 948 DReps registered in the Cardano network — and we both know that’s objectively impossible — accessed your service and voted, it wouldn’t produce even 1% of the load my cluster handles. That’s assuming they all logged in and voted on the same day, which is also highly unrealistic. Voting events are infrequent and spread over time. Yes, nodes and db-sync do operate between voting periods as well — but so do mine, even when nobody is accessing them. Three nodes and one db-sync — all for $100 per month.

So my answer is “NO.”
