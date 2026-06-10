<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmbWGVRofu7HvoTcpmiHaooxZQYW3Xjpith6BSqdtsGu3n -->
# RCADA

**Proposal:** Update Plutus Cost Models
**Vote:** Yes
**Voter ID:** `drep1yf7kjx5rlyuyzxkr4dzyccdfs8tesh29amrtcpyplu3asnqjgmdz3`

---

RCADA votes YES on Update Plutus Cost Models.

RCADA supports this parameter update because it is a necessary technical step to prepare Cardano for the new Plutus primitives that become available after the van Rossem hard fork to Protocol Version 11. The proposal also improves consistency by making Plutus primitives available across Plutus V1, V2, and V3, and it updates costs for some existing primitives based on benchmarking data.

This is not a Treasury withdrawal and does not fund a project or vendor. It is a technical parameter update intended to ensure that Plutus script execution is priced correctly and safely as the platform gains new capabilities. Cost models are important because they determine how much CPU and memory a script operation is expected to consume. Without accurate cost models, new primitives cannot be responsibly enabled on mainnet.

RCADA views this as important developer and infrastructure maintenance. The new primitives support areas such as cryptography, list manipulation, array operations, and value/data manipulation. These improvements can make smart contracts more capable, efficient, and predictable, especially for more advanced applications and future interoperability use cases.

The process behind this update appears strong. The proposal states that the changes were recommended by Intersect’s Parameter Committee, confirmed by Intersect’s Technical Steering Committee, and tested through equivalent changes on SanchoNet, Preview, and Preprod before being submitted for mainnet approval.

RCADA also notes that the proposal directly addresses the relevant constitutional guardrails. The metadata states that cost model values were benchmarked on the reference architecture, that the update is required because new Plutus primitives are being introduced, and that none of the new cost model values are negative.

The main caution is timing and communication. The new primitives will only become available after the Protocol Version 11 hard fork, while some changes to existing primitives take effect immediately when this parameter update is enacted. Developers should be aware of that distinction and should review whether any existing scripts are affected by updated costs for current primitives.

Overall, this appears to be a well-scoped, benchmarked, reviewed, and testnet-deployed technical update. It supports Cardano’s smart contract roadmap without creating Treasury spend or broad governance risk.

For these reasons, RCADA votes YES.

RCADA's full vote assessment can be found here: "https://brolloks.github.io/rcada-drep-votes/."
