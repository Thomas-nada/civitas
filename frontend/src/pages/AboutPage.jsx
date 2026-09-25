import { Link } from "react-router-dom";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { Button, PageHeader } from "../ui";

export default function AboutPage() {
  useSeoMeta({ title: "About", description: "Learn why Civitas was built — making Cardano governance transparent, accessible, and accountable for DReps, SPOs, and ada holders." });
  return (
    <main className="shell page p-about">
      <PageHeader eyebrow="About" title="Why we built Civitas" actions={<Button to="/about/changelog">Changelog</Button>} />
      <article className="c-card c-card--pad-lg c-prose p-about__doc">
        <p>Cardano governance has matured quickly, but understanding what is actually happening on chain is still too difficult for most people.</p>
        <p>Data exists, yet it is fragmented across explorers, APIs, forum threads and social media posts. Important context is often hard to verify, and many participants are left making decisions with partial information. We built Civitas to close that gap.</p>
        <p><strong>Civitas exists to make governance legible, verifiable and decision-useful.</strong></p>
        <p>That means showing who participates, not just who is registered; revealing voting behaviour over time, not one-off snapshots; surfacing rationale coverage and accountability signals that can be inspected and challenged; and turning thresholds, outcomes and participation patterns into clear, comparable metrics.</p>
        <p>We are not building a black box that tells people what to think. We are building transparent tooling so anyone can inspect governance activity, question assumptions and make better-informed decisions.</p>
        <p>At its core, Civitas is about public accountability in a decentralised system: if governance power shapes the protocol, governance behaviour should be understandable by everyone.</p>
        <p><Link to="/guide">Read the governance guide →</Link></p>
      </article>
    </main>
  );
}
