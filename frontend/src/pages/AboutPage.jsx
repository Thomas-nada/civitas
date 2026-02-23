export default function AboutPage() {
  return (
    <main className="shell">
      <header className="hero">
        <h1>Team Behind Civitas</h1>
        <p>Civitas is built by people who care about governance quality, evidence, and practical tools the Cardano community can actually use.</p>
      </header>

      <section className="cards landing-grid">
        <article className="card">
          <p>Thomas</p>
          <strong>Builder and Governance Contributor</strong>
          <p className="muted">Thomas is a self-described vibrant vibe coder who is deeply engaged in Cardano governance and focused on building useful tools the community can benefit from.</p>
          <p className="muted">He is also a member of Tingvard, a Constitutional Committee member, and brings governance context directly into product decisions.</p>
        </article>
        <article className="card">
          <p>PatchRunner_ADA</p>
          <strong>Engineering Copilot</strong>
          <p className="muted">PatchRunner_ADA is the project nickname for the coding copilot used in this workspace. It helps design, implement, and test Civitas features quickly.</p>
          <p className="muted">Core strengths: data-pipeline debugging, API integration, metrics logic, UX iteration, and fast backend/frontend patching for Cardano governance workflows.</p>
        </article>
        <article className="card">
          <p>Working Style</p>
          <strong>Build Fast, Verify Hard</strong>
          <p className="muted">The team runs with a practical loop: ship improvements, validate against real governance behavior, and keep iterating until the outputs are trustworthy.</p>
        </article>
      </section>

      <section className="landing-section">
        <h2>Why We Built Civitas</h2>
        <div className="panel" style={{ padding: "1rem" }}>
          <p>Cardano governance data exists, but it is fragmented across endpoints, formats, and tools. That makes oversight harder than it should be.</p>
          <p>Civitas was built to turn that fragmented data into one coherent accountability surface for DReps, SPOs, the Constitutional Committee, and governance actions.</p>
          <p>The purpose is simple: make voting power, participation, and rationale quality legible enough that community members can challenge, trust, or improve governance decisions with evidence.</p>
        </div>
      </section>
    </main>
  );
}
