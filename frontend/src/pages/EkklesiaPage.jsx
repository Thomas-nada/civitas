import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { useNavigate, useParams } from "react-router-dom";
import { WalletContext } from "../context/WalletContext";

const API_BASE = "/ekklesia-proxy/api/v0";

// ─── Helpers ────────────────────────────────────────────────────────────────

function statusPillClass(s) {
  const v = String(s || "").toLowerCase();
  if (v === "live" || v === "active") return "good";
  if (v === "draft") return "mid";
  if (v === "withdrawn" || v === "closed") return "low";
  return "";
}

function formatAda(n) {
  if (n == null) return null;
  return "₳ " + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d)) return v;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) +
    " at " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) + " UTC";
}

function strToHex(str) {
  return Array.from(new TextEncoder().encode(str)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function getSignerType(address) {
  if (String(address || "").trim().toLowerCase().startsWith("drep1")) return "drep";
  return "stake";
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", ...opts });
  if (!res.ok) {
    let msg;
    try { const j = await res.json(); msg = j?.message || j?.error || res.statusText; } catch { msg = res.statusText; }
    throw new Error(`${res.status} — ${msg}`);
  }
  return res.json();
}

// ─── Primitives ──────────────────────────────────────────────────────────────

function Chevron({ open }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
      style={{ flexShrink: 0, transition: "transform 0.18s", transform: open ? "rotate(180deg)" : "none", color: "var(--text-muted)" }}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M1.5 9.5L9.5 1.5M9.5 1.5H4M9.5 1.5V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// A collapsible question-style block (matches reference's card-per-question pattern)
function QBlock({ question, children, defaultOpen = false, hint }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      border: "1px solid var(--line)",
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: "0.6rem",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "0.75rem", padding: "0.9rem 1rem", background: "var(--panel)",
          border: "none", cursor: "pointer", textAlign: "left", color: "var(--text)",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "0.9rem", flex: 1, lineHeight: 1.35 }}>{question}</span>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexShrink: 0 }}>
          {hint && (
            <span title={hint} style={{
              width: 20, height: 20, borderRadius: "50%", border: "1px solid var(--line)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.7rem", color: "var(--text-muted)", cursor: "help",
            }}>?</span>
          )}
          <Chevron open={open} />
        </div>
      </button>
      {open && (
        <div style={{ padding: "0.9rem 1rem", borderTop: "1px solid var(--line)", background: "var(--bg)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// A lightweight collapsible used inside work packages (milestones, budget categories)
function InnerCollapsible({ title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 8, marginBottom: "0.4rem", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "0.5rem", padding: "0.65rem 0.85rem", background: "var(--panel)",
          border: "none", cursor: "pointer", textAlign: "left", color: "var(--text)",
        }}
      >
        <span style={{ fontSize: "0.84rem", fontWeight: 500, flex: 1 }}>{title}</span>
        {subtitle && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{subtitle}</span>}
        <Chevron open={open} />
      </button>
      {open && (
        <div style={{ padding: "0.65rem 0.85rem", borderTop: "1px solid var(--line)", background: "var(--bg)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <h2 style={{ margin: "1.75rem 0 0.75rem", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
      {children}
    </h2>
  );
}

// Renders inline markdown: **bold**, *italic*, `code`, [text](url)
function renderInline(text) {
  const parts = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[([^\]]+)\]\((https?:\/\/[^\)]+)\))/g;
  let last = 0, m, key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2] != null) parts.push(<strong key={key++}>{m[2]}</strong>);
    else if (m[3] != null) parts.push(<em key={key++}>{m[3]}</em>);
    else if (m[4] != null) parts.push(<code key={key++} style={{ fontSize: "0.82em", background: "var(--bg)", padding: "0.1em 0.3em", borderRadius: 3 }}>{m[4]}</code>);
    else if (m[5] != null) parts.push(<a key={key++} href={m[6]} target="_blank" rel="noreferrer" style={{ color: "var(--accent, #5eead4)" }}>{m[5]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function RichText({ text }) {
  if (!text) return null;
  const str = String(text);
  // Split into blocks on blank lines
  const blocks = str.split(/\n{2,}/);
  const s = { margin: 0, fontSize: "0.84rem", lineHeight: 1.75, wordBreak: "break-word" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        // Detect bullet list block
        const isList = lines.every(l => /^[\-\*\•]\s/.test(l.trim()) || l.trim() === "");
        if (isList) {
          return (
            <ul key={bi} style={{ margin: 0, paddingLeft: "1.3rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              {lines.filter(l => l.trim()).map((l, i) => (
                <li key={i} style={s}>{renderInline(l.replace(/^[\-\*\•]\s*/, ""))}</li>
              ))}
            </ul>
          );
        }
        // Detect heading
        const hm = block.match(/^(#{1,3})\s+(.+)/);
        if (hm) {
          const lvl = hm[1].length;
          const fs = lvl === 1 ? "1rem" : lvl === 2 ? "0.9rem" : "0.85rem";
          return <p key={bi} style={{ ...s, fontWeight: 700, fontSize: fs }}>{renderInline(hm[2])}</p>;
        }
        // Mixed content: render line-by-line preserving single newlines
        return (
          <p key={bi} style={s}>
            {lines.map((line, li) => (
              <span key={li}>
                {renderInline(line)}
                {li < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function ExternalLinks({ links }) {
  if (!links?.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      {links.map((l, i) => (
        <a key={i} href={l.url} target="_blank" rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            fontSize: "0.84rem", color: "var(--accent, #5eead4)", textDecoration: "none",
          }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
          onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
        >
          <ExternalLinkIcon />
          {l.title || l.url}
        </a>
      ))}
    </div>
  );
}

// ─── Key Details Card ─────────────────────────────────────────────────────────

function KeyDetailsCard({ proposal, pillarById }) {
  const d = proposal;
  const md = d?.metaData || {};

  return (
    <div style={{
      border: "1px solid var(--line)", borderRadius: 12,
      background: "var(--panel)", overflow: "hidden", marginBottom: "0.25rem",
    }}>
      <div style={{ padding: "1.1rem 1.25rem", borderBottom: "1px solid var(--line)" }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem" }}>Key Details</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        {/* Left col */}
        <div style={{ padding: "1rem 1.25rem", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {md.totalBudget != null && (
            <div>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Requested budget
              </p>
              <p style={{ margin: "0 0 0.1rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--accent, #5eead4)", lineHeight: 1.2 }}>
                {Number(md.totalBudget).toLocaleString()} ADA
              </p>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            {md.estimatedDuration && (
              <div>
                <p style={{ margin: "0 0 0.2rem", fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span>⏱</span> Estimated duration
                </p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>{md.estimatedDuration} months</p>
              </div>
            )}
            {md.administrator && (
              <div>
                <p style={{ margin: "0 0 0.2rem", fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span>✓</span> Administrator
                </p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>{md.administrator}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right col */}
        <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {md.proposerDetails?.name && (
            <div>
              <p style={{ margin: "0 0 0.2rem", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                🏠 Proposer
              </p>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem" }}>{md.proposerDetails.name}</p>
            </div>
          )}
          {md.proposerDetails?.links?.length > 0 && (
            <div>
              <p style={{ margin: "0 0 0.3rem", fontSize: "0.7rem", color: "var(--text-muted)" }}>Social Links</p>
              <ExternalLinks links={md.proposerDetails.links} />
            </div>
          )}
          {md.supportingInfoLinks?.length > 0 && (
            <div>
              <p style={{ margin: "0 0 0.3rem", fontSize: "0.7rem", color: "var(--text-muted)" }}>Supporting Links</p>
              <ExternalLinks links={md.supportingInfoLinks} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: "0.65rem 1.25rem", borderTop: "1px solid var(--line)",
        display: "flex", gap: "1.5rem", flexWrap: "wrap",
      }}>
        {d._id && (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ opacity: 0.5 }}>#</span> Proposal ID: <code style={{ fontSize: "0.72rem", fontFamily: "monospace" }}>{d._id}</code>
          </span>
        )}
        {d.submittedAt && (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ opacity: 0.5 }}>⏱</span> Submitted: {formatDateTime(d.submittedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Pillar Cards ─────────────────────────────────────────────────────────────

function PillarCard({ pillar, index }) {
  const num = pillar.title?.match(/Pillar\s*(\d+)/i)?.[1] || (index + 1);
  const shortTitle = pillar.title?.replace(/^Pillar\s*\d+:\s*/i, "") || pillar.title;
  return (
    <div style={{
      border: "1px solid var(--line)", borderRadius: 8, padding: "0.75rem 0.9rem",
      background: "var(--panel)", marginBottom: "0.4rem",
    }}>
      <p style={{ margin: "0 0 0.2rem", fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
        🏛 Pillar {num}
      </p>
      <p style={{ margin: "0 0 0.2rem", fontWeight: 700, fontSize: "0.88rem" }}>{shortTitle}</p>
      {pillar.description && (
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.55 }}>{pillar.description}</p>
      )}
    </div>
  );
}

// ─── Budget Table ─────────────────────────────────────────────────────────────

function BudgetByCategory({ rows, wpTotal }) {
  if (!rows?.length) return null;

  // Group by costCategory
  const cats = {};
  for (const r of rows) {
    const cat = r.costCategory || "Other";
    if (!cats[cat]) cats[cat] = [];
    cats[cat].push(r);
  }

  return (
    <div>
      {Object.entries(cats).map(([cat, items]) => {
        const catTotal = items.reduce((s, r) => s + (Number(r.total) || 0), 0);
        return (
          <InnerCollapsible key={cat} title={cat} subtitle={formatAda(catTotal)}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr>
                  {["Item", "Qty", "Unit (₳)", "Total (₳)"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "0.25rem 0.5rem", color: "var(--text-muted)", fontWeight: 500, borderBottom: "1px solid var(--line)", fontSize: "0.7rem" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid color-mix(in srgb, var(--line) 40%, transparent)" }}>
                    <td style={{ padding: "0.3rem 0.5rem" }}>{r.name}</td>
                    <td style={{ padding: "0.3rem 0.5rem" }}>{r.quantity}</td>
                    <td style={{ padding: "0.3rem 0.5rem" }}>{Number(r.unitPrice || 0).toLocaleString()}</td>
                    <td style={{ padding: "0.3rem 0.5rem", fontWeight: 600 }}>{Number(r.total || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </InnerCollapsible>
        );
      })}

      {/* Total bar — dark like reference */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0.7rem 1rem", borderRadius: 8, marginTop: "0.3rem",
        background: "var(--accent-muted, color-mix(in srgb, var(--accent, #5eead4) 15%, var(--panel)))",
        border: "1px solid color-mix(in srgb, var(--accent, #5eead4) 30%, transparent)",
      }}>
        <span style={{ fontWeight: 700, fontSize: "0.83rem" }}>Total work package budget</span>
        <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--accent, #5eead4)" }}>
          {formatAda(wpTotal)}
        </span>
      </div>
    </div>
  );
}

// ─── Work Package ─────────────────────────────────────────────────────────────

function WorkPackageDetail({ wp, index }) {
  const wpTotal = wp.budgetBreakdown?.reduce((s, r) => s + (Number(r.total) || 0), 0) || 0;
  const [open, setOpen] = useState(index === 0);

  return (
    <div style={{
      border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden",
      marginBottom: "0.75rem",
    }}>
      {/* WP header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "0.75rem", padding: "1rem 1.1rem", background: "var(--panel)",
          border: "none", cursor: "pointer", textAlign: "left", color: "var(--text)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>WP{index + 1}: {wp.name}</span>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
            {wp.initiativeType && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{wp.initiativeType}</span>}
            {wp.milestones?.length > 0 && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{wp.milestones.length} milestone{wp.milestones.length !== 1 ? "s" : ""}</span>}
            {wpTotal > 0 && <span style={{ fontSize: "0.75rem", color: "var(--accent, #5eead4)", fontWeight: 600 }}>{formatAda(wpTotal)}</span>}
          </div>
        </div>
        <Chevron open={open} />
      </button>

      {open && (
        <div style={{ background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
          {/* Summary */}
          {wp.summary && (
            <div style={{ padding: "0.9rem 1.1rem", borderBottom: "1px solid var(--line)" }}>
              <RichText text={wp.summary} />
            </div>
          )}

          {/* Core objectives */}
          {wp.coreObjectives?.length > 0 && (
            <div style={{ padding: "0.75rem 1.1rem", borderBottom: "1px solid var(--line)" }}>
              <p style={{ margin: "0 0 0.4rem", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>Core Objectives</p>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                {wp.coreObjectives.map((o, i) => <li key={i} style={{ fontSize: "0.84rem" }}>{o}</li>)}
              </ul>
            </div>
          )}

          {/* Milestones — individually collapsible */}
          {wp.milestones?.length > 0 && (
            <div style={{ padding: "0.75rem 1.1rem", borderBottom: "1px solid var(--line)" }}>
              <QBlock question="How will this work package be delivered?" defaultOpen={true}>
                {wp.milestones.map((m, i) => (
                  <InnerCollapsible key={i} title={`${m.name}${m.duration ? ` — ${m.duration}w` : ""}`} defaultOpen={i === 0}>
                    {m.deliverables && (
                      <div style={{ marginBottom: m.acceptanceCriteria ? "0.65rem" : 0 }}>
                        <p style={{ margin: "0 0 0.2rem", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>Deliverables</p>
                        <RichText text={m.deliverables} />
                      </div>
                    )}
                    {m.acceptanceCriteria && (
                      <div>
                        <p style={{ margin: "0 0 0.2rem", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>Acceptance Criteria</p>
                        <RichText text={m.acceptanceCriteria} />
                      </div>
                    )}
                  </InnerCollapsible>
                ))}
              </QBlock>
            </div>
          )}

          {/* Supporting docs */}
          {wp.supportingDocuments?.length > 0 && (
            <div style={{ padding: "0.75rem 1.1rem", borderBottom: "1px solid var(--line)" }}>
              <QBlock question="Is there any extra material you would like to share about this work package?" defaultOpen={true}>
                <ExternalLinks links={wp.supportingDocuments} />
              </QBlock>
            </div>
          )}

          {/* Budget breakdown */}
          {wp.budgetBreakdown?.length > 0 && (
            <div style={{ padding: "0.75rem 1.1rem", borderBottom: "1px solid var(--line)" }}>
              <QBlock question="What's the budget estimated for this Work Package?" defaultOpen={true}>
                <p style={{ margin: "0 0 0.6rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>Budget breakdown by category and item.</p>
                <BudgetByCategory rows={wp.budgetBreakdown} wpTotal={wpTotal} />
              </QBlock>
            </div>
          )}

          {/* Success metrics / expected value */}
          {(wp.expectedValue || wp.metric) && (
            <div style={{ padding: "0.75rem 1.1rem" }}>
              {wp.expectedValue && (
                <QBlock question="What is the expected value of this work package?">
                  <RichText text={wp.expectedValue} />
                </QBlock>
              )}
              {wp.metric && (
                <QBlock question="What are the success metrics?">
                  <RichText text={wp.metric} />
                </QBlock>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Comments ─────────────────────────────────────────────────────────────────

function CommentsSection({ proposalId, walletApi, walletRewardAddress }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitOk, setSubmitOk] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (!proposalId) return;
    setLoading(true);
    apiFetch(`/comments?proposal=${proposalId}&limit=50`)
      .then(r => setComments(Array.isArray(r) ? r : (r?.data ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [proposalId]);

  async function handleAuth() {
    if (!walletApi || !walletRewardAddress) return;
    setAuthLoading(true);
    setSubmitError("");
    try {
      const signerAddress = String(walletRewardAddress || "").trim();
      const signType = getSignerType(signerAddress);
      const nonceRes = await apiFetch("/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerAddress, signType }),
      });
      const dataHex = nonceRes?.dataHex ?? nonceRes?.data?.dataHex;
      const nonce = nonceRes?.nonce ?? nonceRes?.data?.nonce;
      const payloadHex = dataHex || (nonce ? strToHex(nonce) : "");
      if (!payloadHex) throw new Error("No nonce returned from server.");
      const signAddress = nonceRes?.userIdHex ?? nonceRes?.signerAddressHex ?? signerAddress;
      const signature = await walletApi.signData(payloadHex, signAddress, false);
      await apiFetch("/session", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerAddress, signature, signType }),
      });
      setAuthed(true);
    } catch (e) {
      setSubmitError(e.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSubmit() {
    if (!commentText.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    setSubmitOk(false);
    try {
      await apiFetch("/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, content: commentText.trim() }),
      });
      setSubmitOk(true);
      setCommentText("");
      const updated = await apiFetch(`/comments?proposal=${proposalId}&limit=50`);
      setComments(Array.isArray(updated) ? updated : (updated?.data ?? []));
    } catch (e) {
      setSubmitError(e.message || "Failed to submit comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Compose */}
      <div style={{
        border: "1px solid var(--line)", borderRadius: 10, padding: "0.9rem 1rem",
        background: "var(--panel)", marginBottom: "1rem",
      }}>
        <p style={{ margin: "0 0 0.6rem", fontWeight: 600, fontSize: "0.88rem" }}>Leave a comment</p>
        {!walletApi && (
          <p className="muted" style={{ fontSize: "0.83rem", margin: 0 }}>
            Connect your wallet using the button in the top bar to comment.
          </p>
        )}
        {walletApi && !authed && (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <p className="muted" style={{ fontSize: "0.83rem", margin: 0, flex: 1 }}>
              Sign in with your wallet to leave a comment.
            </p>
            <button onClick={handleAuth} disabled={authLoading}
              className="btn-outline" style={{ fontSize: "0.82rem" }}>
              {authLoading ? "Signing…" : "Sign in with Wallet"}
            </button>
            {submitError && <span style={{ fontSize: "0.8rem", color: "var(--red, #f87171)", width: "100%" }}>{submitError}</span>}
          </div>
        )}
        {walletApi && authed && (
          <div>
            <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="Write your comment…" rows={3}
              style={{
                width: "100%", padding: "0.55rem 0.7rem", borderRadius: 7,
                border: "1px solid var(--line)", background: "var(--bg)",
                color: "var(--text)", fontSize: "0.84rem", resize: "vertical", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "0.5rem" }}>
              <button onClick={handleSubmit} disabled={submitting || !commentText.trim()}
                className="btn-outline" style={{ fontSize: "0.82rem" }}>
                {submitting ? "Submitting…" : "Submit"}
              </button>
              {submitOk && <span style={{ fontSize: "0.8rem", color: "var(--accent, #5eead4)" }}>Comment posted!</span>}
              {submitError && <span style={{ fontSize: "0.8rem", color: "var(--red, #f87171)" }}>{submitError}</span>}
            </div>
          </div>
        )}
      </div>

      {loading && <p className="muted" style={{ fontSize: "0.83rem" }}>Loading comments…</p>}
      {!loading && comments.length === 0 && (
        <p className="muted" style={{ fontSize: "0.83rem" }}>No comments yet. Be the first.</p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {comments.map(c => (
          <div key={c._id} style={{
            padding: "0.7rem 0.9rem",
            background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 9
          }}>
            <p style={{ margin: "0 0 0.3rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--text)" }}>{c.author?.name || c.proposerId || "Anonymous"}</strong>
              {" · "}{formatDate(c.createdAt)}
            </p>
            <p style={{ margin: 0, fontSize: "0.84rem", lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {c.content || c.text || c.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Share Row ────────────────────────────────────────────────────────────────

function ShareRow({ proposalId, title, basePath }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}${basePath}/${proposalId}`;
  const text = `${title} — via @CivitasExplorer`;

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const btnStyle = {
    display: "inline-flex", alignItems: "center", gap: "0.35rem",
    padding: "0.28rem 0.65rem", borderRadius: 20, fontSize: "0.74rem",
    border: "1px solid var(--line)", background: "var(--panel)",
    color: "var(--text-muted)", cursor: "pointer", textDecoration: "none",
    transition: "border-color 0.12s, color 0.12s",
  };

  return (
    <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}>Share:</span>

      {/* Copy link */}
      <button onClick={copyLink} style={btnStyle}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent, #5eead4)"; e.currentTarget.style.color = "var(--accent, #5eead4)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--text-muted)"; }}
      >
        {copied ? (
          <>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Copied!
          </>
        ) : (
          <>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1" y="3" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M3.5 3V2a1 1 0 011-1h4.5a1 1 0 011 1v6a1 1 0 01-1 1H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            Copy link
          </>
        )}
      </button>

      {/* X / Twitter */}
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank" rel="noreferrer" style={btnStyle}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#e7e7e7"; e.currentTarget.style.color = "var(--text)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--text-muted)"; }}
      >
        <svg width="11" height="11" viewBox="0 0 1200 1227" fill="currentColor">
          <path d="M714.2 519.3 1160.9 0H1055L667.1 450.9 357.5 0H0L468.5 681.8 0 1226.4h105.9l409.6-476.2 327 476.2H1200L714.2 519.3zM569.2 687.9l-47.5-68L149.4 87.2h162.6l300.5 430.3 47.5 68 390.8 559.4H888.2L569.2 687.9z" />
        </svg>
        Post on X
      </a>

      {/* Telegram */}
      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`}
        target="_blank" rel="noreferrer" style={btnStyle}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#29b6f6"; e.currentTarget.style.color = "#29b6f6"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--text-muted)"; }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
        </svg>
        Telegram
      </a>

      {/* LinkedIn */}
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank" rel="noreferrer" style={btnStyle}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#0a66c2"; e.currentTarget.style.color = "#0a66c2"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--text-muted)"; }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        LinkedIn
      </a>
    </div>
  );
}

// ─── Proposal Detail Page ─────────────────────────────────────────────────────

function ProposalDetail({ proposal, cycleName, pillarById, onBack, walletApi, walletRewardAddress, commentCount, basePath }) {
  const d = proposal;
  const md = d?.metaData || {};
  const wps = md.proposalDetails?.workPackages || [];
  const pillarIds = md.strategyFramework?.pillars || [];
  const pillars = pillarIds.map((id, i) => pillarById[id] || { _id: id, title: id, description: null, _idx: i });

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          background: "transparent", border: "none", cursor: "pointer",
          color: "var(--text-muted)", fontSize: "0.83rem", padding: "0 0 1.25rem",
          transition: "color 0.12s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to {cycleName || "proposals"}
      </button>

      {/* Title */}
      <h1 style={{ margin: "0 0 0.75rem", fontSize: "clamp(1.3rem, 3vw, 1.75rem)", fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.02em" }}>
        {d.title}
      </h1>

      {/* Badges + share row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {d.status && <span className={`pill ${statusPillClass(d.status)}`}>{d.status}</span>}
          {commentCount > 0 && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
              padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.75rem",
              border: "1px solid var(--line)", background: "var(--panel)", color: "var(--text-muted)",
            }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 1h9v7H6.5L4 10V8H1V1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {commentCount} comment{commentCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <ShareRow proposalId={d._id} title={d.title} basePath={basePath} />
      </div>

      {/* Key Details card */}
      <KeyDetailsCard proposal={d} pillarById={pillarById} />

      {/* ── Proposal Overview ─────────────────────────────────────────── */}
      {d.summary && (
        <>
          <SectionHeading>Proposal Overview</SectionHeading>
          <QBlock question="Please describe your whole proposal at a high level" defaultOpen={true}>
            <RichText text={d.summary} />
          </QBlock>
          {md.trackRecord && (
            <QBlock question="Why are you the best suited to deliver this work?">
              <RichText text={md.trackRecord} />
            </QBlock>
          )}
          {md.priorFunding && (
            <QBlock question="Have you received prior funding?">
              <RichText text={md.priorFunding} />
            </QBlock>
          )}
          {md.independentAudits && (
            <QBlock question="Are there any independent audits of your work?">
              <RichText text={md.independentAudits} />
            </QBlock>
          )}
          {md.treasuryRepayment && (
            <QBlock question="Treasury repayment">
              <p style={{ margin: 0, fontSize: "0.84rem" }}>{md.treasuryRepayment}</p>
              {md.treasuryRepaymentCircumstances && (
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.84rem", color: "var(--text-muted)" }}>
                  {md.treasuryRepaymentCircumstances}
                </p>
              )}
            </QBlock>
          )}
        </>
      )}

      {/* ── Work Packages ─────────────────────────────────────────────── */}
      {wps.length > 0 && (
        <>
          <SectionHeading>Work Packages</SectionHeading>
          {wps.map((wp, i) => (
            <WorkPackageDetail key={i} wp={wp} index={i} />
          ))}
        </>
      )}

      {/* ── Alignment ─────────────────────────────────────────────────── */}
      {(pillars.length > 0 || md.strategyFramework?.pillarRationale || md.strategyFramework?.kpiAlignment) && (
        <>
          <SectionHeading>Alignment to Cardano 2030 Strategy framework</SectionHeading>
          {pillars.length > 0 && (
            <QBlock question="To which strategic pillar does your proposal align the most?" defaultOpen={true}
              hint="The Cardano 2030 strategy defines 5 pillars that proposals may align to">
              {pillars.map((p, i) => <PillarCard key={p._id} pillar={p} index={i} />)}
            </QBlock>
          )}
          {md.strategyFramework?.pillarRationale && (
            <QBlock question="How does your proposal align to this pillar?" defaultOpen={true}>
              <RichText text={md.strategyFramework.pillarRationale} />
            </QBlock>
          )}
          {md.strategyFramework?.kpiAlignment && (
            <QBlock question="How does your proposal align to Cardano's 2030 KPIs?">
              <RichText text={md.strategyFramework.kpiAlignment} />
            </QBlock>
          )}
        </>
      )}

      {/* ── Comments ──────────────────────────────────────────────────── */}
      <SectionHeading>Comments</SectionHeading>
      <CommentsSection
        proposalId={d._id}
        walletApi={walletApi}
        walletRewardAddress={walletRewardAddress}
      />

      <div style={{ height: "3rem" }} />
    </div>
  );
}

// ─── Proposal Card (list view) ────────────────────────────────────────────────

function ProposalCard({ proposal, pillarById, onClick }) {
  const p = proposal;
  const md = p.metaData || {};
  const pillarIds = (md.strategyFramework?.pillars || []).slice(0, 2);
  const pillarNames = pillarIds.map(id => {
    const title = pillarById[id]?.title || "";
    return title.replace(/^Pillar\s*\d+:\s*/i, "") || title;
  }).filter(Boolean);

  const wpsCount = md.proposalDetails?.workPackages?.length || 0;

  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer",
        background: "var(--panel)",
        border: `1px solid ${hovered ? "var(--accent, #5eead4)" : "var(--line)"}`,
        borderRadius: 10, padding: "1rem 1.1rem",
        transition: "border-color 0.15s",
        display: "flex", flexDirection: "column", gap: "0.45rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", alignItems: "flex-start" }}>
        <h3 style={{
          margin: 0, fontSize: "0.92rem", fontWeight: 600, lineHeight: 1.35,
          flex: 1, minWidth: 0,
          color: hovered ? "var(--accent, #5eead4)" : "var(--text)",
          transition: "color 0.15s",
        }}>{p.title}</h3>
        {p.status && <span className={`pill ${statusPillClass(p.status)}`} style={{ flexShrink: 0, fontSize: "0.7rem" }}>{p.status}</span>}
      </div>

      {p.summary && (
        <p style={{
          margin: 0, fontSize: "0.78rem", lineHeight: 1.6, color: "var(--text-muted)",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {p.summary}
        </p>
      )}

      {pillarNames.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
          {pillarNames.map((t, i) => (
            <span key={i} style={{
              fontSize: "0.68rem", padding: "0.1rem 0.5rem", borderRadius: 20,
              background: "color-mix(in srgb, var(--accent, #5eead4) 8%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent, #5eead4) 22%, transparent)",
              color: "var(--accent, #5eead4)",
            }}>{t}</span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
        {md.proposerDetails?.name && <span>{md.proposerDetails.name}</span>}
        {md.totalBudget != null && (
          <span style={{ fontWeight: 700, color: "var(--text)" }}>{formatAda(md.totalBudget)}</span>
        )}
        {wpsCount > 0 && <span>{wpsCount} work package{wpsCount !== 1 ? "s" : ""}</span>}
        {p.commentCount > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 1h9v7H6.5L4 10V8H1V1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {p.commentCount}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Cycle Timeline ───────────────────────────────────────────────────────────

function CycleTimeline({ cycle }) {
  const now = new Date();

  const phases = [
    { label: "Submission", start: cycle.submissionStartDate, end: cycle.submissionEndDate },
    { label: "Review", start: cycle.reviewStartDate, end: cycle.reviewEndDate },
    { label: "Voting", start: cycle.votingStartDate, end: cycle.votingEndDate },
  ].filter(p => p.start && p.end);

  function phaseStatus(start, end) {
    const s = new Date(start), e = new Date(end);
    if (now < s) return "upcoming";
    if (now > e) return "done";
    return "active";
  }

  return (
    <div style={{ display: "flex", gap: "0", alignItems: "stretch", flexWrap: "wrap" }}>
      {phases.map((phase, i) => {
        const status = phaseStatus(phase.start, phase.end);
        const isActive = status === "active";
        const isDone = status === "done";

        return (
          <div key={phase.label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              padding: "0.5rem 0.85rem",
              borderRadius: 8,
              border: `1px solid ${isActive ? "var(--accent, #5eead4)" : "var(--line)"}`,
              background: isActive
                ? "color-mix(in srgb, var(--accent, #5eead4) 8%, var(--panel))"
                : "var(--panel)",
              display: "flex", flexDirection: "column", gap: "0.15rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                  background: isActive ? "var(--accent, #5eead4)" : isDone ? "var(--text-muted)" : "var(--line)",
                  boxShadow: isActive ? "0 0 6px var(--accent, #5eead4)" : "none",
                }} />
                <span style={{
                  fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: isActive ? "var(--accent, #5eead4)" : isDone ? "var(--text-muted)" : "var(--text)",
                }}>
                  {phase.label}
                  {isActive && <span style={{ marginLeft: "0.35rem", fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>· Active</span>}
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {formatDate(phase.start)} – {formatDate(phase.end)}
              </span>
            </div>

            {i < phases.length - 1 && (
              <svg width="20" height="10" viewBox="0 0 20 10" fill="none" style={{ flexShrink: 0, color: "var(--line)", margin: "0 -1px" }}>
                <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Budget Explorer ─────────────────────────────────────────────────────────

const PILLAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
];

function BudgetExplorer({ allProposals, pillars, pillarById, filterPillar, setFilterPillar, setSearch }) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState("pillars"); // "pillars" | "proposers" | "status"

  const total = allProposals.reduce((s, p) => s + (p.metaData?.totalBudget ?? 0), 0);
  if (!total || allProposals.length === 0) return null;

  // ── Pillar breakdown ──────────────────────────────────────────────────────
  // A proposal may belong to multiple pillars; split budget equally across them
  const pillarTotals = {};
  allProposals.forEach(p => {
    const pPillars = p.metaData?.strategyFramework?.pillars ?? [];
    const share = pPillars.length > 0 ? (p.metaData?.totalBudget ?? 0) / pPillars.length : 0;
    pPillars.forEach(pid => {
      pillarTotals[pid] = (pillarTotals[pid] ?? 0) + share;
    });
  });
  const pillarRows = Object.entries(pillarTotals)
    .map(([pid, amt]) => ({ pid, amt, label: pillarById[pid]?.title ?? pid }))
    .sort((a, b) => b.amt - a.amt);

  // ── Proposer breakdown ────────────────────────────────────────────────────
  const proposerTotals = {};
  allProposals.forEach(p => {
    const name = p.metaData?.proposerDetails?.name || "Unknown";
    proposerTotals[name] = (proposerTotals[name] ?? 0) + (p.metaData?.totalBudget ?? 0);
  });
  const proposerRows = Object.entries(proposerTotals)
    .map(([name, amt]) => ({ name, amt }))
    .sort((a, b) => b.amt - a.amt)
    .slice(0, 10);

  const barMax = tab === "pillars" ? (pillarRows[0]?.amt ?? 1) : (proposerRows[0]?.amt ?? 1);

  const tabStyle = (t) => ({
    padding: "0.3rem 0.75rem", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600,
    border: "1px solid",
    borderColor: tab === t ? "var(--accent)" : "var(--line)",
    background: tab === t ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "transparent",
    color: tab === t ? "var(--accent)" : "var(--text-muted)",
    cursor: "pointer", transition: "all 0.15s",
  });

  return (
    <div style={{
      background: "var(--panel)", border: "1px solid var(--line)",
      borderRadius: 12, marginBottom: "1rem", overflow: "hidden",
    }}>
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.75rem 1rem", background: "transparent", border: "none",
          cursor: "pointer", color: "var(--text)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--accent)", flexShrink: 0 }}>
            <rect x="1" y="8" width="3" height="5" rx="1" fill="currentColor" />
            <rect x="5.5" y="5" width="3" height="8" rx="1" fill="currentColor" />
            <rect x="10" y="2" width="3" height="11" rx="1" fill="currentColor" />
          </svg>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Budget Explorer
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 400 }}>
            · {formatAda(total)} across {allProposals.length} proposals
          </span>
        </span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{
          color: "var(--text-muted)", transition: "transform 0.2s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }}>
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{ padding: "0 1rem 1rem" }}>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem" }}>
            {[["pillars", "By Pillar"], ["proposers", "By Proposer"]].map(([t, label]) => (
              <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>{label}</button>
            ))}
          </div>

          {/* Pillar bars */}
          {tab === "pillars" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {pillarRows.map(({ pid, amt, label }, i) => {
                const pct = (amt / barMax) * 100;
                const active = filterPillar === pid;
                const color = PILLAR_COLORS[i % PILLAR_COLORS.length];
                return (
                  <button
                    key={pid}
                    onClick={() => setFilterPillar(active ? "" : pid)}
                    style={{
                      display: "grid", gridTemplateColumns: "160px 1fr 100px",
                      alignItems: "center", gap: "0.6rem",
                      background: active ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent",
                      border: `1px solid ${active ? "var(--accent)" : "transparent"}`,
                      borderRadius: 8, padding: "0.45rem 0.6rem",
                      cursor: "pointer", textAlign: "left", width: "100%",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: "0.75rem", color: "var(--text)", fontWeight: active ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {label}
                    </span>
                    <div style={{ height: 8, background: "var(--line)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "right", whiteSpace: "nowrap" }}>
                      {formatAda(Math.round(amt))}
                    </span>
                  </button>
                );
              })}
              {filterPillar && (
                <button
                  onClick={() => setFilterPillar("")}
                  style={{ alignSelf: "flex-start", fontSize: "0.72rem", color: "var(--accent)", background: "transparent", border: "none", cursor: "pointer", padding: "0.2rem 0", marginTop: "0.1rem" }}
                >
                  ✕ Clear pillar filter
                </button>
              )}
            </div>
          )}

          {/* Proposer bars */}
          {tab === "proposers" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {proposerRows.map(({ name, amt }, i) => {
                const pct = (amt / barMax) * 100;
                const color = PILLAR_COLORS[i % PILLAR_COLORS.length];
                return (
                  <button
                    key={name}
                    onClick={() => setSearch(name)}
                    style={{
                      display: "grid", gridTemplateColumns: "160px 1fr 100px",
                      alignItems: "center", gap: "0.6rem",
                      background: "transparent", border: "1px solid transparent",
                      borderRadius: 8, padding: "0.45rem 0.6rem",
                      cursor: "pointer", textAlign: "left", width: "100%",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 6%, transparent)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize: "0.75rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {name}
                    </span>
                    <div style={{ height: 8, background: "var(--line)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "right", whiteSpace: "nowrap" }}>
                      {formatAda(amt)}
                    </span>
                  </button>
                );
              })}
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                Click a proposer to search their proposals.
                {proposerRows.length === 10 && " Showing top 10 by budget."}
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EkklesiaPage({ voteSlug, basePath = "/budget" } = {}) {
  const { walletApi, walletRewardAddress } = useContext(WalletContext) || {};
  const { proposalId: urlProposalId } = useParams();
  const navigate = useNavigate();

  const [cycle, setCycle] = useState(null);
  const [cycleLoading, setCycleLoading] = useState(true);
  const [cycleError, setCycleError] = useState("");

  const [allProposals, setAllProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [proposalsError, setProposalsError] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPillar, setFilterPillar] = useState("");
  const [sort, setSort] = useState("submittedAt");

  const [selected, setSelected] = useState(null);
  const [detailFull, setDetailFull] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const proposalAbortRef = useRef(null);
  const pageTopRef = useRef(null);

  useEffect(() => {
    const ctrl = new AbortController();
    apiFetch("/votes", { signal: ctrl.signal })
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        const match = voteSlug
          ? list.find(v => v.slug === voteSlug)  // strict — never fall back to wrong cycle
          : list[0];
        if (match) {
          setCycle(match);
        } else if (voteSlug) {
          setCycleError(`Vote cycle "${voteSlug}" not found.`);
        }
      })
      .catch(e => { if (e.name !== "AbortError") setCycleError(e.message || "Failed to load."); })
      .finally(() => setCycleLoading(false));
    return () => ctrl.abort();
  }, []);

  const fetchProposals = useCallback(async (voteId) => {
    proposalAbortRef.current?.abort();
    const ctrl = new AbortController();
    proposalAbortRef.current = ctrl;
    setProposalsLoading(true);
    setProposalsError("");
    try {
      // Fetch all pages (API max limit=100 per page)
      const PAGE_SIZE = 100;
      let page = 1;
      let all = [];
      while (true) {
        const data = await apiFetch(`/proposals?vote=${voteId}&limit=${PAGE_SIZE}&page=${page}`, { signal: ctrl.signal });
        const rows = Array.isArray(data) ? data : (data?.data ?? []);
        all = all.concat(rows);
        const meta = data?.meta;
        if (!meta?.hasNextPage || rows.length < PAGE_SIZE) break;
        page++;
      }
      setAllProposals(all);
    } catch (e) {
      if (e.name !== "AbortError") setProposalsError(e.message || "Failed to load proposals.");
    } finally {
      setProposalsLoading(false);
    }
  }, []);

  useEffect(() => { if (cycle) fetchProposals(cycle._id); }, [cycle, fetchProposals]);

  const openProposal = useCallback(async (p, skipNav = false) => {
    setSelected(p);
    setDetailFull(null);
    setDetailLoading(true);
    if (!skipNav) navigate(`${basePath}/${p._id}`, { replace: false });
    pageTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const data = await apiFetch(`/proposals/${p._id}`);
      setDetailFull(data?.data ?? data);
    } catch {
      setDetailFull(p);
    } finally {
      setDetailLoading(false);
    }
  }, [navigate]);

  const closeProposal = useCallback(() => {
    setSelected(null);
    setDetailFull(null);
    navigate(basePath, { replace: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigate]);

  // Auto-open proposal when URL contains an ID (direct link or browser back/forward)
  useEffect(() => {
    if (!urlProposalId || !allProposals.length) return;
    const match = allProposals.find(p => p._id === urlProposalId);
    if (match && (!selected || selected._id !== urlProposalId)) {
      openProposal(match, true);
    } else if (!match && urlProposalId) {
      // Not in list yet — fetch directly
      setSelected({ _id: urlProposalId, title: "Loading…" });
      setDetailFull(null);
      setDetailLoading(true);
      apiFetch(`/proposals/${urlProposalId}`)
        .then(data => setDetailFull(data?.data ?? data))
        .catch(() => {})
        .finally(() => setDetailLoading(false));
    }
  }, [urlProposalId, allProposals]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear selection when URL goes back to /budget
  useEffect(() => {
    if (!urlProposalId && selected) {
      setSelected(null);
      setDetailFull(null);
    }
  }, [urlProposalId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pillars = cycle?.metaData?.strategyFramework?.pillars ?? [];
  const pillarById = Object.fromEntries(pillars.map(p => [p._id, p]));

  const proposals = allProposals
    .filter(p => {
      if (filterStatus && p.status !== filterStatus) return false;
      if (filterPillar && !p.metaData?.strategyFramework?.pillars?.includes(filterPillar)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.title?.toLowerCase().includes(q) ||
          p.summary?.toLowerCase().includes(q) ||
          (p.metaData?.proposerDetails?.name || "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "title") return (a.title || "").localeCompare(b.title || "");
      if (sort === "totalBudget") return (b.metaData?.totalBudget ?? 0) - (a.metaData?.totalBudget ?? 0);
      if (sort === "commentCount") return (b.commentCount ?? 0) - (a.commentCount ?? 0);
      if (sort === "updatedAt") return new Date(b.updatedAt) - new Date(a.updatedAt);
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    });

  const totalBudgetRequested = proposals.reduce((s, p) => s + (p.metaData?.totalBudget ?? 0), 0);
  const displayDetail = detailFull ?? selected;
  const cycleName = cycle?.description || cycle?.title || "Proposals";

  // Dynamic SEO from cycle data
  useSeoMeta({
    title: cycle?.title || cycleName,
    description: cycle?.description || `Track ${cycleName} — proposal breakdown, participation, and live voting results.`
  });

  return (
    <main className="shell" style={{ padding: "1.5rem 1rem", maxWidth: 960, margin: "0 auto" }}>
      <div ref={pageTopRef} />

      {/* ── Detail view ────────────────────────────────────────────────── */}
      {selected && (
        detailLoading ? (
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <button onClick={closeProposal} style={{
              display: "inline-flex", alignItems: "center", gap: "0.35rem",
              background: "transparent", border: "none", cursor: "pointer",
              color: "var(--text-muted)", fontSize: "0.83rem", padding: "0 0 1.25rem",
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to {cycleName}
            </button>
            <div style={{
              border: "1px solid var(--line)", borderRadius: 12,
              background: "var(--panel)", padding: "2.5rem", textAlign: "center",
            }}>
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>Loading proposal…</p>
            </div>
          </div>
        ) : (
          <ProposalDetail
            proposal={displayDetail}
            cycleName={cycleName}
            pillarById={pillarById}
            onBack={closeProposal}
            walletApi={walletApi}
            walletRewardAddress={walletRewardAddress}
            commentCount={selected.commentCount || 0}
            basePath={basePath}
          />
        )
      )}

      {/* ── List view ──────────────────────────────────────────────────── */}
      {!selected && (
        <div>
          {/* Page header */}
          <header style={{ marginBottom: "1.5rem" }}>
            <h1 style={{ margin: "0 0 0.75rem", fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
              {cycle?.description || "Intersect Budget Proposals"}
            </h1>
            {cycleLoading && <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>Loading…</p>}
            {cycleError && <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--red, #f87171)" }}>{cycleError}</p>}
            {cycle && <CycleTimeline cycle={cycle} />}
          </header>

          {cycle && (
            <>
              {/* Stats */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.6rem", marginBottom: "1.25rem",
              }}>
                {[
                  ["Proposals", proposalsLoading ? "…" : allProposals.length],
                  ["Matching Filters", proposalsLoading ? "…" : proposals.length],
                  ["Total Budget Requested", proposalsLoading ? "…" : formatAda(totalBudgetRequested)],
                ].map(([label, value]) => (
                  <div key={label} style={{
                    background: "var(--panel)", border: "1px solid var(--line)",
                    borderRadius: 10, padding: "0.75rem 0.9rem",
                  }}>
                    <p style={{ margin: "0 0 0.2rem", fontSize: "0.67rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</p>
                    <p style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Budget Explorer */}
              <BudgetExplorer
                allProposals={allProposals}
                pillars={pillars}
                pillarById={pillarById}
                filterPillar={filterPillar}
                setFilterPillar={setFilterPillar}
                setSearch={setSearch}
              />

              {/* Submit notice — only shown when the cycle has a submission window URL */}
              {cycle?.submissionStartDate && new Date() <= new Date(cycle.submissionEndDate || cycle.submissionStartDate) && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.6rem",
                  padding: "0.65rem 1rem", marginBottom: "1rem",
                  background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10,
                  fontSize: "0.8rem", color: "var(--text-muted)",
                }}>
                  <span>Want to submit? Submissions are made through Intersect's Hydra Voting platform.</span>
                  <a
                    href={`https://hydra-voting.intersectmbo.org/${cycle.form || "budget-process"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.35rem",
                      padding: "0.35rem 0.75rem", borderRadius: 7, fontSize: "0.78rem", fontWeight: 600,
                      background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)",
                      color: "var(--accent)", textDecoration: "none", whiteSpace: "nowrap",
                      transition: "background 0.15s",
                    }}
                  >
                    Submit on Hydra
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M2 9L9 2M9 2H4M9 2v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                </div>
              )}

              {/* Filters */}
              <div style={{
                display: "flex", gap: "0.5rem", flexWrap: "wrap",
                padding: "0.7rem 0.85rem", marginBottom: "0.9rem",
                background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10,
              }}>
                <input type="search" placeholder="Search proposals…" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ flex: "1 1 180px", padding: "0.38rem 0.65rem", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: "0.82rem" }} />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  style={{ padding: "0.38rem 0.55rem", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: "0.82rem" }}>
                  <option value="">All statuses</option>
                  <option value="live">Live</option>
                  <option value="draft">Draft</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
                <select value={filterPillar} onChange={e => setFilterPillar(e.target.value)}
                  style={{ padding: "0.38rem 0.55rem", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: "0.82rem", maxWidth: 220 }}>
                  <option value="">All pillars</option>
                  {pillars.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
                <select value={sort} onChange={e => setSort(e.target.value)}
                  style={{ padding: "0.38rem 0.55rem", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: "0.82rem" }}>
                  <option value="submittedAt">Newest</option>
                  <option value="title">Title A–Z</option>
                  <option value="totalBudget">Budget ↓</option>
                  <option value="commentCount">Comments ↓</option>
                  <option value="updatedAt">Updated</option>
                </select>
              </div>

              {proposalsError && (
                <p style={{ fontSize: "0.83rem", color: "var(--red, #f87171)", marginBottom: "0.75rem" }}>{proposalsError}</p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
                <h2 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>Proposal index</h2>
                <span className="muted" style={{ fontSize: "0.78rem" }}>
                  {proposalsLoading ? "Loading…" : `${proposals.length}${proposals.length !== allProposals.length ? ` of ${allProposals.length}` : ""} proposals`}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {proposals.map(p => (
                  <ProposalCard
                    key={p._id}
                    proposal={p}
                    pillarById={pillarById}
                    onClick={() => openProposal(p)}
                  />
                ))}
                {!proposalsLoading && proposals.length === 0 && !proposalsError && (
                  <p className="muted" style={{ fontSize: "0.83rem", margin: "1rem 0" }}>No proposals match your filters.</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
