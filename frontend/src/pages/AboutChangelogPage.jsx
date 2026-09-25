import { useSeoMeta } from "../hooks/useSeoMeta";
import { Button, PageHeader } from "../ui";

const RELEASES = [
  {
    version: "v2.0",
    title: "Koios indexing, compact API and a new interface",
    entries: [
      "Governance data is indexed from Koios; Blockfrost is an optional fallback with a daily budget instead of the primary source.",
      "New /api/v1 endpoints serve each page a few kilobytes instead of the whole snapshot, compressed and cacheable.",
      "The interface is rebuilt on a shared design system with a light theme, phone layouts and keyboard-accessible menus, tables and dialogs.",
      "Statistics and the epoch calendar are aggregated on the server, so those pages load in a fraction of the time."
    ]
  },
  {
    version: "v1.1",
    title: "Delegation risk, DRep registration and guides",
    entries: [
      "Added DRep delegation risk scoring contribution to accountability metrics.",
      "Added wallet-based DRep registration directly in Civitas.",
      "Improved governance action submission reliability (script handling, collateral, fee and re-sign flow).",
      "Locked the submission flow to single-network deployment behaviour.",
      "Fixed network-data consistency issues (no mixed mainnet and testnet views).",
      "Expanded the governance guides with practical in-tool walkthroughs.",
      "Added the interactive CC credentials wizard with individual, multisig and Plutus tracks.",
      "Reorganised the guides navigation and updated naming for clarity."
    ]
  }
];

export default function AboutChangelogPage() {
  useSeoMeta({ title: "Changelog" });
  return (
    <main className="shell page p-about">
      <PageHeader eyebrow="About" title="Changelog" actions={<Button to="/about">← About</Button>} />
      <div className="stack">
        {RELEASES.map((r) => (
          <article key={r.version} className="c-card c-card--pad c-prose">
            <h2 style={{ marginTop: 0 }}><span className="mono" style={{ color: "var(--color-accent)" }}>{r.version}</span> · {r.title}</h2>
            <ul>{r.entries.map((e) => <li key={e}>{e}</li>)}</ul>
          </article>
        ))}
      </div>
    </main>
  );
}
