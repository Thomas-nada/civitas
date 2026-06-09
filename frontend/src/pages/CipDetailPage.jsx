import { Component, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSeoMeta } from "../hooks/useSeoMeta";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const CIP_RAW_BASE = "https://raw.githubusercontent.com/cardano-foundation/CIPs/master";

function statusPillMod(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return "pill--active";
  if (s === "proposed") return "pill--ratified";
  if (s === "draft") return "pill--unknown";
  if (s === "inactive" || s === "deprecated") return "pill--expired";
  return "pill--unknown";
}

function formatCipId(id) {
  if (!id) return "";
  const m = id.match(/^(CIP|CPS)-0*(\d+)$/);
  if (m) return `${m[1]}-${m[2]}`;
  return id;
}

// "Frederic Johnson <frederic@foo.com>" → "Frederic Johnson"
function parseAuthorName(raw) {
  const s = String(raw || "").trim();
  const m = s.match(/^(.+?)\s*<[^>]+>$/);
  return m ? m[1].trim() : s;
}

// Rewrites relative image/link src values to absolute raw GitHub URLs so
// diagrams and assets embedded in CIP markdown render correctly.
function resolveRelativeUrl(src, cipId) {
  if (!src) return src;
  if (/^https?:\/\//.test(src) || /^ipfs:\/\//.test(src)) return src;
  if (src.startsWith("#")) return src;
  // Strip leading ./
  const clean = src.replace(/^\.\//, "");
  return `${CIP_RAW_BASE}/${cipId}/${clean}`;
}

class MarkdownErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: false }; }
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error) {
      return (
        <pre className="payload-markdown" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {this.props.source}
        </pre>
      );
    }
    return this.props.children;
  }
}

export default function CipDetailPage() {
  const { cipId } = useParams();
  const [cip, setCip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useSeoMeta({
    title: cip ? `${formatCipId(cip.id)} — ${cip.title}` : "CIP",
    description: cip
      ? `${formatCipId(cip.id)}: ${cip.title}. Status: ${cip.status}. Category: ${cip.category}.`
      : "Cardano Improvement Proposal"
  });

  useEffect(() => {
    if (!cipId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setCip(null);
    fetch(`/api/cips/${encodeURIComponent(cipId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        setCip(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load CIP.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [cipId]);

  if (loading) {
    return (
      <main className="page shell">
        <section className="status-row"><p className="muted">Loading {cipId}…</p></section>
      </main>
    );
  }

  if (error || !cip) {
    return (
      <main className="page shell">
        <section className="status-row">
          <p className="muted">{error || "CIP not found."}</p>
          <Link className="inline-link" to="/cips">← Back to CIP Library</Link>
        </section>
      </main>
    );
  }

  const imageComponents = {
    img({ src, alt, ...props }) {
      return (
        <img
          src={resolveRelativeUrl(src, cip.id)}
          alt={alt || ""}
          style={{ maxWidth: "100%" }}
          {...props}
        />
      );
    },
    a({ href, children, ...props }) {
      const resolved = resolveRelativeUrl(href, cip.id);
      const isExternal = resolved && /^https?:\/\//.test(resolved);
      return (
        <a
          href={resolved}
          className="inline-link"
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          {...props}
        >
          {children}
        </a>
      );
    }
  };

  return (
    <main className="page shell stats-page">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <section className="pdp-head">
        <Link className="pdp-back" to="/cips">← CIP Library</Link>

        {/* CIP number + status badges on one line above the title */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0.75rem 0 0.5rem" }}>
          <span
            className="mono pill pill--unknown"
            style={{ fontSize: "0.78rem", letterSpacing: "0.03em" }}
          >
            {formatCipId(cip.id)}
          </span>
          {cip.status && (
            <span className={`pill ${statusPillMod(cip.status)}`}>{cip.status}</span>
          )}
        </div>

        <h1 className="pdp-title" style={{ marginBottom: "0.75rem" }}>{cip.title}</h1>

        {/* Meta strip: category · created · license · github */}
        <div className="pdp-meta-strip">
          {cip.category && <span className="pdp-meta-type">{cip.category}</span>}
          {cip.created && <span className="pdp-meta-item">Created {cip.created}</span>}
          {cip.license && <span className="pdp-meta-item">{cip.license}</span>}
          <span className="pdp-meta-item">
            <a
              className="inline-link"
              href={`https://github.com/cardano-foundation/CIPs/tree/master/${cip.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub ↗
            </a>
          </span>
        </div>

        {/* Authors — names only, no email addresses */}
        {cip.authors?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.75rem" }}>
            {cip.authors.map((a, i) => (
              <span
                key={i}
                style={{
                  fontSize: "0.8rem",
                  padding: "0.15rem 0.55rem",
                  borderRadius: "999px",
                  background: "var(--surface-soft-3)",
                  border: "1px solid var(--line)",
                  color: "var(--text-muted)",
                }}
              >
                {parseAuthorName(a)}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── Content ────────────────────────────────────────────────── */}
      <section className="stats-section stats-section--wide">
        <MarkdownErrorBoundary source={cip.content}>
          <div className="payload-markdown cip-markdown">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={imageComponents}
            >
              {cip.content}
            </ReactMarkdown>
          </div>
        </MarkdownErrorBoundary>
      </section>
    </main>
  );
}
