export default function AboutPage() {
  return (
    <main className="shell">
      <section className="landing-section">
        <h1>Why We Built Civitas</h1>
        <div className="panel" style={{ padding: "1rem" }}>
          <p>Cardano governance has matured quickly, but understanding what is actually happening on-chain is still too difficult for most people.</p>
          <p>Data exists, yet it is fragmented across explorers, APIs, forum threads, and social media posts. Important context is often hard to verify, and many participants are left making decisions with partial information. We built Civitas to close that gap.</p>
          <p>Civitas exists to make governance legible, verifiable, and decision-useful.</p>
          <p>That means showing who participates, not just who is registered; revealing voting behavior over time, not one-off snapshots; surfacing rationale coverage and accountability signals that can be inspected and challenged; and turning thresholds, outcomes, and participation patterns into clear, comparable metrics.</p>
          <p>We are not building a black box that tells people what to think. We are building transparent tooling so anyone can inspect governance activity, question assumptions, and make better-informed decisions.</p>
          <p>At its core, Civitas is about public accountability in a decentralized system: if governance power shapes the protocol, governance behavior should be understandable by everyone.</p>
        </div>
      </section>
    </main>
  );
}
