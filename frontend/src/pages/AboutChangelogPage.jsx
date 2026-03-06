import { Link } from "react-router-dom";

const version = "v1.1";
const changelog = [
  "Added wallet-based DRep registration directly in Civitas.",
  "Improved governance action submission reliability (script handling, collateral, fee/re-sign flow).",
  "Locked submission flow to single-network deployment behavior (no per-form network switching).",
  "Fixed network-data consistency issues (prevented mixed mainnet/testnet data views).",
  "Expanded Governance Guides with practical in-tool walkthroughs.",
  "Added interactive CC Credentials wizard with Individual, Multisig, and Plutus tracks.",
  "Reorganized the Guides page navigation and updated naming for clarity."
];

export default function AboutChangelogPage() {
  return (
    <main className="shell">
      <section className="landing-section">
        <h1>Changelog ({version})</h1>
        <div className="panel" style={{ padding: "1rem" }}>
          <ul>
            {changelog.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
          <p><Link className="inline-link" to="/about">Back to About</Link></p>
        </div>
      </section>
    </main>
  );
}
