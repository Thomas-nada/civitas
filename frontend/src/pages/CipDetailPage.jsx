// One CIP or CPS, rendered from its Markdown in the CIPs repository.
import { Component } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { fetchJson } from "../api/client";
import { Alert, PageHeader, Pill, Skeleton } from "../ui";
import { IconArrowLeft } from "../ui/icons";

const CIP_RAW_BASE = "https://raw.githubusercontent.com/cardano-foundation/CIPs/master";
function statusTone(status) {
  const s = String(status || "").toLowerCase();
  return s === "active" ? "success" : s === "proposed" ? "warning" : s === "inactive" || s === "deprecated" ? "danger" : "neutral";
}
function formatCipId(id) { const m = String(id || "").match(/^(CIP|CPS)-0*(\d+)$/); return m ? `${m[1]}-${m[2]}` : id || ""; }
// "Frederic Johnson <frederic@foo.com>" → "Frederic Johnson"
function authorName(raw) { const m = String(raw || "").trim().match(/^(.+?)\s*<[^>]+>$/); return m ? m[1].trim() : String(raw || "").trim(); }
// Relative image and link targets resolve against the CIP's folder on GitHub.
function resolveUrl(src, cipId) {
  if (!src || /^https?:\/\//.test(src) || /^ipfs:\/\//.test(src) || src.startsWith("#")) return src;
  return `${CIP_RAW_BASE}/${cipId}/${src.replace(/^\.\//, "")}`;
}

class MarkdownErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: false }; }
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{this.props.source}</pre> : this.props.children; }
}

export default function CipDetailPage() {
  const { cipId } = useParams();
  const query = useQuery({ queryKey: ["cips", cipId], enabled: Boolean(cipId), staleTime: 30 * 60_000, queryFn: ({ signal }) => fetchJson(`/api/cips/${encodeURIComponent(cipId)}`, { signal }) });
  const cip = query.data && !query.data.error ? query.data : null;
  useSeoMeta({ title: cip ? `${formatCipId(cip.id)} — ${cip.title}` : "CIP", description: cip ? `${formatCipId(cip.id)}: ${cip.title}. Status: ${cip.status}. Category: ${cip.category}.` : "Cardano Improvement Proposal" });

  if (query.isLoading) return <main className="shell page p-cips" aria-busy="true"><Skeleton kind="text" width={120} /><div style={{ height: 12 }} /><Skeleton kind="title" width="60%" /><div style={{ height: 24 }} /><Skeleton kind="text" count={10} /></main>;
  if (!cip) {
    return (
      <main className="shell page p-cips">
        <Link to="/cips" className="c-btn c-btn--ghost c-btn--sm"><IconArrowLeft size={16} /> CIP library</Link>
        <div style={{ height: 16 }} />
        <Alert tone="warning" title="CIP not found.">{query.error?.message || query.data?.error}</Alert>
      </main>
    );
  }
  const components = {
    img: ({ src, alt, ...props }) => <img src={resolveUrl(src, cip.id)} alt={alt || ""} style={{ maxWidth: "100%" }} {...props} />,
    a: ({ href, children, ...props }) => { const resolved = resolveUrl(href, cip.id); const external = resolved && /^https?:\/\//.test(resolved); return <a href={resolved} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...props}>{children}</a>; }
  };

  return (
    <main className="shell page p-cips">
      <Link to="/cips" className="c-btn c-btn--ghost c-btn--sm" style={{ marginBottom: 12 }}><IconArrowLeft size={16} /> CIP library</Link>
      <PageHeader eyebrow={<><span className="mono">{formatCipId(cip.id)}</span>{cip.status ? <Pill size="sm" tone={statusTone(cip.status)}>{cip.status}</Pill> : null}</>} title={cip.title}>
        <div className="row small muted" style={{ marginTop: 8, gap: 14 }}>
          {cip.category ? <span>{cip.category}</span> : null}
          {cip.created ? <span>Created {cip.created}</span> : null}
          {cip.license ? <span>{cip.license}</span> : null}
          <a href={`https://github.com/cardano-foundation/CIPs/tree/master/${cip.id}`} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        </div>
        {cip.authors?.length ? <div className="row" style={{ marginTop: 8 }}>{cip.authors.map((a, i) => <Pill key={i} tone="neutral" size="sm" outline>{authorName(a)}</Pill>)}</div> : null}
      </PageHeader>
      <article className="c-card c-card--pad-lg c-prose p-cips__doc">
        <MarkdownErrorBoundary source={cip.content}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{cip.content}</ReactMarkdown>
        </MarkdownErrorBoundary>
      </article>
    </main>
  );
}
