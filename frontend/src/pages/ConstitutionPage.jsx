// The Cardano Constitution, fetched from IPFS and hash-verified against the
// on-chain anchor, with a section outline, text search and version switch.
import { useEffect, useMemo, useState } from "react";
import { useSeoMeta } from "../hooks/useSeoMeta";
import blakejs from "blakejs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Alert, Button, Card, Input, KeyValue, PageHeader, Pill, Segmented, Skeleton } from "../ui";
import { IconSearch } from "../ui/icons";

const CONSTITUTION_VERSIONS = [
  { id: "current", label: "Current", ratifiedEpoch: 608, enactedEpoch: 609, hash: "b368bdad83c727bbfe86425575233fb914eb76d05d89497f7790cf007fd95f52", url: "https://ipfs.io/ipfs/bafkreieyuknozbtewyurfqoagvplvykadn6a4u6wglupavdz46bbsnnl6e" },
  { id: "epoch-541", label: "Ratified at 541", ratifiedEpoch: 541, enactedEpoch: 542, hash: "2a61e2f4b63442978140c77a70daab3961b22b12b63b13949a390c097214d1c5", url: "https://ipfs.io/ipfs/bafkreiazhhawe7sjwuthcfgl3mmv2swec7sukvclu3oli7qdyz4uhhuvmy" }
];

function slugifyHeading(text) {
  const cleaned = String(text || "").toLowerCase().replace(/[`*_~()[\]{}<>]/g, "").replace(/\s+/g, " ").trim();
  return cleaned.replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-") || "section";
}
function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let count = 0; let index = 0;
  for (;;) { index = haystack.indexOf(needle, index); if (index === -1) break; count += 1; index += needle.length; }
  return count;
}
function parseConstitutionMarkdown(markdown) {
  const lines = String(markdown || "").split("\n");
  const sections = []; const headings = []; const slugCount = {};
  let current = { id: "constitution-top", level: 0, title: "Top", contentLines: [] };
  const push = () => { const content = current.contentLines.join("\n"); if (!current.title && !content.trim()) return; sections.push({ id: current.id, level: current.level, title: current.title, content }); };
  for (const line of lines) {
    const m = line.match(/^(#{1,6})\s+(.*)$/);
    if (!m) { current.contentLines.push(line); continue; }
    push();
    const level = m[1].length; const title = m[2].trim();
    const base = slugifyHeading(title);
    slugCount[base] = (slugCount[base] || 0) + 1;
    const id = slugCount[base] > 1 ? `${base}-${slugCount[base]}` : base;
    current = { id, level, title, contentLines: [] };
    headings.push({ id, level, title });
  }
  push();
  return { sections, headings };
}

const STATUS = { loading: ["Loading", "neutral"], error: ["Error", "danger"], mismatch: ["Hash mismatch", "danger"], verified: ["Hash verified", "success"] };

export default function ConstitutionPage() {
  useSeoMeta({ title: "Cardano Constitution", description: "Read and search the full Cardano Constitution, ratified on-chain. Navigate by section, verify hash integrity, and compare versions." });
  const [versionId, setVersionId] = useState("current");
  const [docs, setDocs] = useState({});
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState("constitution-top");
  const [matchIndex, setMatchIndex] = useState(0);
  const version = CONSTITUTION_VERSIONS.find((v) => v.id === versionId) || CONSTITUTION_VERSIONS[0];
  const doc = docs[version.id] || null;
  const parsed = useMemo(() => parseConstitutionMarkdown(doc?.markdown || ""), [doc?.markdown]);
  const needle = query.trim().toLowerCase();
  const matches = useMemo(() => needle ? parsed.sections.map((s) => { const n = countOccurrences(`${s.title}\n${s.content}`.toLowerCase(), needle); return n > 0 ? { id: s.id, title: s.title, count: n } : null; }).filter(Boolean) : [], [parsed.sections, needle]);

  useEffect(() => {
    if (docs[version.id]?.status === "ready" || docs[version.id]?.status === "loading") return undefined;
    const controller = new AbortController();
    setDocs((prev) => ({ ...prev, [version.id]: { status: "loading" } }));
    fetch(version.url, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => { if (!res.ok) throw new Error(`IPFS fetch failed (${res.status})`); return res.text(); })
      .then((raw) => {
        const hash = blakejs.blake2bHex(new TextEncoder().encode(raw), null, 32).toLowerCase();
        setDocs((prev) => ({ ...prev, [version.id]: { status: "ready", markdown: raw.replace(/\r\n?/g, "\n"), actualHash: hash, hashMatches: hash === version.hash.toLowerCase() } }));
      })
      .catch((e) => { if (e?.name !== "AbortError") setDocs((prev) => ({ ...prev, [version.id]: { status: "error", error: e?.message || "Failed to load the constitution from IPFS." } })); });
    return () => controller.abort();
  }, [version, docs]);

  useEffect(() => {
    if (doc?.status !== "ready") return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
    }, { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.2, 0.6] });
    document.querySelectorAll(".p-const__section").forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [doc?.status, parsed.sections]);

  function jumpTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search || ""}#${id}`);
  }
  function step(delta) {
    if (!matches.length) return;
    const next = (matchIndex + delta + matches.length) % matches.length;
    setMatchIndex(next);
    jumpTo(matches[next].id);
  }
  const statusKey = !doc || doc.status === "loading" ? "loading" : doc.status === "error" ? "error" : doc.hashMatches ? "verified" : "mismatch";
  const [statusLabel, statusTone] = STATUS[statusKey];

  return (
    <main className="shell page p-const">
      <PageHeader eyebrow="Governance" title="Cardano Constitution" lead="The ratified document every governance action is judged against, read straight from its IPFS anchor and verified against the on-chain hash."
        actions={<Segmented ariaLabel="Constitution version" value={version.id} onChange={(id) => { setVersionId(id); setQuery(""); setMatchIndex(0); setActiveId("constitution-top"); }} options={CONSTITUTION_VERSIONS.map((v) => ({ value: v.id, label: v.label }))} />} />

      <div className="stack--6">
        <Card title={<span className="row">Anchor <Pill tone={statusTone} size="sm">{statusLabel}</Pill></span>} subtitle={`Ratified at epoch ${version.ratifiedEpoch}, enacted at epoch ${version.enactedEpoch}.`}>
          <KeyValue items={[
            ["Anchor hash", <span key="h" className="mono break">{version.hash}</span>],
            ["IPFS source", <a key="u" className="mono break" href={version.url} target="_blank" rel="noreferrer">{version.url}</a>],
            doc?.status === "ready" && ["Computed hash", <span key="c" className="mono break">{doc.actualHash}</span>]
          ]} />
          {doc?.status === "error" ? <Alert tone="danger" className="p-const__alert">{doc.error}</Alert> : null}
          {doc?.status === "ready" && !doc.hashMatches ? <Alert tone="danger" className="p-const__alert">The downloaded content hash does not match the expected on-chain hash for this version.</Alert> : null}
        </Card>

        {doc?.status === "ready" ? (
          <div className="p-const__layout">
            <aside className="p-const__side">
              <Card pad>
                <div className="c-search"><span className="c-search__icon"><IconSearch size={16} /></span><Input value={query} onChange={(e) => { setQuery(e.target.value); setMatchIndex(0); }} placeholder="Search the text…" aria-label="Search the constitution" /></div>
                {needle ? (
                  <div className="row row--between" style={{ marginTop: 8 }}>
                    <span className="small muted">{matches.length === 0 ? "No matches." : `${matches.length} section${matches.length === 1 ? "" : "s"} match`}</span>
                    {matches.length > 0 ? <span className="row"><Button size="sm" onClick={() => step(-1)}>Prev</Button><Button size="sm" onClick={() => step(1)}>Next</Button></span> : null}
                  </div>
                ) : null}
                <nav className="p-const__toc" aria-label="Constitution sections">
                  {parsed.headings.map((h) => {
                    const hit = matches.find((m) => m.id === h.id);
                    return (
                      <button key={h.id} type="button" className={`p-const__toc-item${activeId === h.id ? " is-active" : ""}${hit ? " has-hit" : ""}`} style={{ paddingLeft: `${8 + Math.max(0, h.level - 1) * 10}px` }} onClick={() => jumpTo(h.id)}>
                        <span>{h.title}</span>{hit ? <Pill size="sm" tone="accent">{hit.count}</Pill> : null}
                      </button>
                    );
                  })}
                </nav>
              </Card>
            </aside>
            <article className="c-card c-card--pad-lg c-prose p-const__doc">
              {parsed.sections.map((section) => {
                const Tag = section.level > 0 ? `h${Math.min(section.level, 6)}` : null;
                return (
                  <section id={section.id} className="p-const__section" key={section.id}>
                    {Tag ? <Tag>{section.title}</Tag> : null}
                    {section.content.trim() ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown> : null}
                  </section>
                );
              })}
            </article>
          </div>
        ) : doc?.status === "error" ? null : <Card pad><Skeleton kind="text" count={8} /></Card>}
      </div>
    </main>
  );
}
