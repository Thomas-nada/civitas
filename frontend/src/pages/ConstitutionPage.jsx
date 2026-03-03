import { useEffect, useMemo, useState } from "react";
import blakejs from "blakejs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const CONSTITUTION_VERSIONS = [
  {
    id: "current",
    label: "Current",
    ratifiedEpoch: 608,
    enactedEpoch: 609,
    hash: "b368bdad83c727bbfe86425575233fb914eb76d05d89497f7790cf007fd95f52",
    url: "https://ipfs.io/ipfs/bafkreieyuknozbtewyurfqoagvplvykadn6a4u6wglupavdz46bbsnnl6e"
  },
  {
    id: "epoch-541",
    label: "Ratified @ 541",
    ratifiedEpoch: 541,
    enactedEpoch: 542,
    hash: "2a61e2f4b63442978140c77a70daab3961b22b12b63b13949a390c097214d1c5",
    url: "https://ipfs.io/ipfs/bafkreiazhhawe7sjwuthcfgl3mmv2swec7sukvclu3oli7qdyz4uhhuvmy"
  }
];

function statusLabel(entry) {
  if (!entry) return "idle";
  if (entry.status === "loading") return "loading";
  if (entry.status === "error") return "error";
  if (!entry.hashMatches) return "hash mismatch";
  return "verified";
}

function slugifyHeading(text) {
  const cleaned = String(text || "")
    .toLowerCase()
    .replace(/[`*_~()[\]{}<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const slug = cleaned.replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");
  return slug || "section";
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let count = 0;
  let index = 0;
  while (true) {
    index = haystack.indexOf(needle, index);
    if (index === -1) break;
    count += 1;
    index += needle.length;
  }
  return count;
}

function parseConstitutionMarkdown(markdown) {
  const lines = String(markdown || "").split("\n");
  const sections = [];
  const headings = [];
  const slugCount = {};

  let current = {
    id: "constitution-top",
    level: 0,
    title: "Top",
    contentLines: []
  };

  function pushCurrent() {
    const content = current.contentLines.join("\n");
    if (!current.title && !content.trim()) return;
    sections.push({
      id: current.id,
      level: current.level,
      title: current.title,
      content
    });
  }

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (match) {
      pushCurrent();
      const level = match[1].length;
      const title = match[2].replace(/\s+#+\s*$/, "").trim();
      const baseSlug = slugifyHeading(title);
      const seen = slugCount[baseSlug] || 0;
      slugCount[baseSlug] = seen + 1;
      const id = seen > 0 ? `${baseSlug}-${seen + 1}` : baseSlug;
      current = { id, level, title, contentLines: [] };
      headings.push({ id, level, title });
    } else {
      current.contentLines.push(line);
    }
  }
  pushCurrent();
  return { sections, headings };
}

export default function ConstitutionPage() {
  const [selectedVersionId, setSelectedVersionId] = useState("current");
  const [docsByVersion, setDocsByVersion] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState("constitution-top");
  const [searchIndex, setSearchIndex] = useState(0);
  const selectedVersion = useMemo(
    () => CONSTITUTION_VERSIONS.find((v) => v.id === selectedVersionId) || CONSTITUTION_VERSIONS[0],
    [selectedVersionId]
  );
  const selectedDoc = docsByVersion[selectedVersion.id] || null;
  const parsedDoc = useMemo(
    () => parseConstitutionMarkdown(selectedDoc?.markdown || ""),
    [selectedDoc?.markdown]
  );
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchMatches = useMemo(() => {
    if (!normalizedSearch) return [];
    return parsedDoc.sections
      .map((section) => {
        const text = `${section.title}\n${section.content}`.toLowerCase();
        const count = countOccurrences(text, normalizedSearch);
        return count > 0 ? { id: section.id, title: section.title, count } : null;
      })
      .filter(Boolean);
  }, [parsedDoc.sections, normalizedSearch]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadConstitution() {
      setDocsByVersion((prev) => {
        if (prev[selectedVersion.id]?.status === "ready") return prev;
        return {
          ...prev,
          [selectedVersion.id]: {
            ...prev[selectedVersion.id],
            status: "loading",
            error: ""
          }
        };
      });

      try {
        const res = await fetch(selectedVersion.url, {
          signal: controller.signal,
          cache: "no-store"
        });
        if (!res.ok) {
          throw new Error(`IPFS fetch failed (${res.status})`);
        }
        const rawText = await res.text();
        const hashHex = blakejs.blake2bHex(new TextEncoder().encode(rawText), null, 32).toLowerCase();
        const expectedHash = selectedVersion.hash.toLowerCase();
        const normalizedMarkdown = rawText.replace(/\r\n?/g, "\n");

        if (cancelled) return;
        setDocsByVersion((prev) => ({
          ...prev,
          [selectedVersion.id]: {
            status: "ready",
            markdown: normalizedMarkdown,
            actualHash: hashHex,
            hashMatches: hashHex === expectedHash,
            fetchedAt: new Date().toISOString(),
            error: ""
          }
        }));
      } catch (error) {
        if (cancelled || error?.name === "AbortError") return;
        setDocsByVersion((prev) => ({
          ...prev,
          [selectedVersion.id]: {
            status: "error",
            markdown: "",
            actualHash: "",
            hashMatches: false,
            fetchedAt: "",
            error: error?.message || "Failed to load constitution from IPFS."
          }
        }));
      }
    }

    loadConstitution();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedVersion.id, selectedVersion.url, selectedVersion.hash]);

  useEffect(() => {
    setSearchQuery("");
    setSearchIndex(0);
    setActiveSectionId("constitution-top");
  }, [selectedVersion.id]);

  useEffect(() => {
    setSearchIndex(0);
  }, [normalizedSearch, selectedVersion.id]);

  useEffect(() => {
    if (selectedDoc?.status !== "ready") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActiveSectionId(visible[0].target.id);
      },
      { root: null, rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.2, 0.6] }
    );

    const targets = Array.from(document.querySelectorAll(".constitution-section-block"));
    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, [selectedDoc?.status, parsedDoc.sections]);

  function jumpToSection(id) {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSectionId(id);
    if (window.history?.replaceState) {
      const cleanPath = `${window.location.pathname}${window.location.search || ""}`;
      window.history.replaceState(null, "", `${cleanPath}#${id}`);
    }
  }

  function stepSearch(delta) {
    if (!searchMatches.length) return;
    const next = (searchIndex + delta + searchMatches.length) % searchMatches.length;
    setSearchIndex(next);
    jumpToSection(searchMatches[next].id);
  }

  return (
    <main className="shell constitution-shell">
      <header className="hero constitution-header">
        <h1>Cardano Constitution</h1>
      </header>

      <section className="panel constitution-toolbar">
        <div className="constitution-version-switch" role="tablist" aria-label="Constitution versions">
          {CONSTITUTION_VERSIONS.map((version) => (
            <button
              key={version.id}
              type="button"
              className={`mode-btn${selectedVersion.id === version.id ? " active" : ""}`}
              role="tab"
              aria-selected={selectedVersion.id === version.id}
              onClick={() => setSelectedVersionId(version.id)}
            >
              {version.label}
            </button>
          ))}
        </div>
        <p className={`constitution-status constitution-status-${statusLabel(selectedDoc).replace(" ", "-")}`}>
          Status: {statusLabel(selectedDoc)}
        </p>
      </section>

      <section className="panel constitution-meta">
        <p>
          Ratified at epoch <strong>{selectedVersion.ratifiedEpoch}</strong>, enacted at epoch{" "}
          <strong>{selectedVersion.enactedEpoch}</strong>.
        </p>
        <p>
          Anchor hash: <code className="mono">{selectedVersion.hash}</code>
        </p>
        <p>
          IPFS source:{" "}
          <a className="ext-link" href={selectedVersion.url} target="_blank" rel="noreferrer">
            {selectedVersion.url}
          </a>
        </p>
        {selectedDoc?.status === "ready" ? (
          <p>
            Computed hash: <code className="mono">{selectedDoc.actualHash}</code>
          </p>
        ) : null}
        {selectedDoc?.status === "error" ? <p className="vote-error">{selectedDoc.error}</p> : null}
        {selectedDoc?.status === "ready" && !selectedDoc.hashMatches ? (
          <p className="vote-error">
            The downloaded content hash does not match the expected on-chain hash for this version.
          </p>
        ) : null}
      </section>

      {selectedDoc?.status === "loading" || !selectedDoc ? (
        <article className="panel constitution-content">
          <p className="muted">Loading constitution from IPFS...</p>
        </article>
      ) : null}

      {selectedDoc?.status === "ready" ? (
        <section className="constitution-layout">
          <aside className="panel constitution-sidebar">
            <h3>Sections</h3>
            <label className="constitution-search">
              <span>Search text</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Word or phrase"
              />
            </label>
            {normalizedSearch ? (
              <div className="constitution-search-tools">
                <p className="muted">
                  {searchMatches.length === 0
                    ? "No matches found."
                    : `${searchMatches.length} section(s) matched`}
                </p>
                {searchMatches.length > 0 ? (
                  <div className="constitution-search-nav">
                    <button type="button" className="mode-btn" onClick={() => stepSearch(-1)}>
                      Prev
                    </button>
                    <button type="button" className="mode-btn" onClick={() => stepSearch(1)}>
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
            <nav className="constitution-toc" aria-label="Constitution sections">
              {parsedDoc.headings.map((heading) => {
                const hit = searchMatches.find((item) => item.id === heading.id);
                return (
                  <button
                    key={heading.id}
                    type="button"
                    className={`${activeSectionId === heading.id ? "active" : ""}${hit ? " has-hit" : ""}`}
                    style={{ paddingLeft: `${0.45 + Math.max(0, heading.level - 1) * 0.5}rem` }}
                    onClick={() => jumpToSection(heading.id)}
                  >
                    <span>{heading.title}</span>
                    {hit ? <strong>{hit.count}</strong> : null}
                  </button>
                );
              })}
            </nav>
          </aside>

          <article className="panel constitution-content constitution-content-main">
            {parsedDoc.sections.map((section) => {
              const HeadingTag = section.level > 0 ? `h${Math.min(section.level, 6)}` : null;
              return (
                <section id={section.id} className="constitution-section-block" key={section.id}>
                  {HeadingTag ? <HeadingTag>{section.title}</HeadingTag> : null}
                  {section.content.trim() ? (
                    <ReactMarkdown className="payload-markdown constitution-markdown" remarkPlugins={[remarkGfm]}>
                      {section.content}
                    </ReactMarkdown>
                  ) : null}
                </section>
              );
            })}
          </article>
        </section>
      ) : null}
    </main>
  );
}
