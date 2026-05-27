import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
    try {
      const j = await res.json();
      const validation = j?.errors || j?.validationErrors || j?.details;
      const validationMsg = validation ? ` ${JSON.stringify(validation)}` : "";
      msg = `${j?.message || j?.error || res.statusText}${validationMsg}`;
    } catch {
      msg = res.statusText;
    }
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
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g;
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
        const isList = lines.every(l => /^[-*•]\s/.test(l.trim()) || l.trim() === "");
        if (isList) {
          return (
            <ul key={bi} style={{ margin: 0, paddingLeft: "1.3rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              {lines.filter(l => l.trim()).map((l, i) => (
                <li key={i} style={s}>{renderInline(l.replace(/^[-*•]\s*/, ""))}</li>
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

function KeyDetailsCard({ proposal }) {
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

// ─── Proposal Form Helpers ───────────────────────────────────────────────────

function newWp() {
  return { name: "", initiativeType: "", typeOfProposal: "", cannotBreakIntoMilestones: false, summary: "", coreObjectives: [""], milestones: [], budgetBreakdown: [], expectedValue: "", metric: "", supportingDocuments: [newLink()] };
}
function newMilestone() { return { name: "", duration: "", deliverables: "", acceptanceCriteria: "" }; }
function newBudgetRow() { return { costCategory: "", name: "", quantity: "", unitPrice: "", total: "" }; }
function newLink() { return { title: "", url: "" }; }

function normalizeOwnerValue(v) {
  return String(v || "").trim().toLowerCase();
}

function proposalOwnerValues(p) {
  const md = p?.metaData || {};
  return [
    p?.userId,
    p?.owner,
    p?.ownerId,
    p?.createdBy,
    p?.createdById,
    p?.submittedBy,
    p?.submittedById,
    p?.submitter,
    p?.signerAddress,
    p?.proposerId,
    md.userId,
    md.owner,
    md.ownerId,
    md.createdBy,
    md.submittedBy,
    md.submitter,
    md.signerAddress,
    md.submissionSignerAddress,
    md.proposerId,
    md.proposerDetails?.walletAddress,
    md.proposerDetails?.rewardAddress,
  ].map(normalizeOwnerValue).filter(Boolean);
}

function proposalOwnedByWallet(p, walletRewardAddress) {
  if (p?.canEdit === true || p?.ownedByMe === true || p?.isMine === true) return true;
  const wallet = normalizeOwnerValue(walletRewardAddress);
  if (!wallet) return false;
  return proposalOwnerValues(p).includes(wallet);
}

// ─── My Proposals Panel ──────────────────────────────────────────────────────

function MyProposalsPanel({ cycle, walletApi, walletRewardAddress, onClose, onEdit }) {
  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [myProposals, setMyProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  async function fetchMine() {
    if (!cycle?._id || !walletRewardAddress) return;
    setLoading(true);
    setError("");
    try {
      const proposer = encodeURIComponent(walletRewardAddress);
      const data = await apiFetch(`/proposals?vote=${cycle._id}&proposer=${proposer}&status=live,withdrawn,draft&sort=updatedAt&direction=desc&limit=100`);
      const rows = Array.isArray(data) ? data : (data?.data ?? []);
      const ownedRows = rows.filter(p => proposalOwnedByWallet(p, walletRewardAddress));
      const hasOwnershipSignals = rows.some(p =>
        p?.canEdit === true ||
        p?.ownedByMe === true ||
        p?.isMine === true ||
        proposalOwnerValues(p).length > 0
      );
      if (rows.length > 0 && ownedRows.length === 0 && !hasOwnershipSignals) {
        setMyProposals([]);
        setError("The Ekklesia API returned proposals without ownership data, so edit/delete controls are hidden.");
      } else {
        setMyProposals(ownedRows);
      }
      setAuthed(true);
    } catch (e) {
      const msg = String(e.message || "");
      if (msg.includes("401") || msg.includes("403") || msg.includes("Unauthorized")) {
        setAuthed(false);
      } else {
        setError(e.message || "Failed to load proposals.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Try on open — succeeds silently if session cookie is still valid
  useEffect(() => { fetchMine(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAuth() {
    if (!walletApi || !walletRewardAddress) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      const signerAddress = String(walletRewardAddress || "").trim();
      const signType = getSignerType(signerAddress);
      const nonceRes = await apiFetch("/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signerAddress, signType }) });
      const dataHex = nonceRes?.dataHex ?? nonceRes?.data?.dataHex;
      const nonce = nonceRes?.nonce ?? nonceRes?.data?.nonce;
      const payloadHex = dataHex || (nonce ? strToHex(nonce) : "");
      if (!payloadHex) throw new Error("No nonce returned from server.");
      const signAddress = nonceRes?.userIdHex ?? nonceRes?.signerAddressHex ?? signerAddress;
      const signature = await walletApi.signData(payloadHex, signAddress, false);
      await apiFetch("/session", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signerAddress, signature, signType }) });
      setAuthed(true);
      fetchMine();
    } catch (e) {
      setAuthError(e.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleDelete(proposal) {
    if (!proposalOwnedByWallet(proposal, walletRewardAddress)) {
      alert("This proposal is not marked as yours, so Civitas will not delete it.");
      return;
    }
    const id = proposal?._id;
    if (!window.confirm("Delete this proposal? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/proposals/${id}`, { method: "DELETE" });
      setMyProposals(ps => ps.filter(p => p._id !== id));
    } catch (e) {
      alert(e.message || "Failed to delete proposal.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }} onClick={onClose}>
      <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 14, width: "100%", maxWidth: 640, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>My Proposals</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.2rem", lineHeight: 1, padding: "0.2rem" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem" }}>
          {!walletApi ? (
            <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>Connect your wallet using the button in the top bar to view your proposals.</p>
          ) : !authed ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p style={{ fontSize: "0.85rem", margin: 0, color: "var(--text-muted)" }}>Sign in with your wallet to view your proposals.</p>
              <button onClick={handleAuth} disabled={authLoading} className="btn-outline" style={{ alignSelf: "flex-start" }}>
                {authLoading ? "Signing…" : "Sign in with Wallet"}
              </button>
              {authError && <p style={{ color: "var(--red, #f87171)", fontSize: "0.82rem", margin: 0 }}>{authError}</p>}
            </div>
          ) : loading ? (
            <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>Loading your proposals…</p>
          ) : error ? (
            <p style={{ color: "var(--red, #f87171)", fontSize: "0.85rem", margin: 0 }}>{error}</p>
          ) : myProposals.length === 0 ? (
            <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>You haven't submitted any proposals yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {myProposals.map(p => (
                <div key={p._id} style={{ border: "1px solid var(--line)", borderRadius: 9, padding: "0.85rem 1rem", background: "var(--panel)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem", flex: 1 }}>{p.title || "Untitled"}</span>
                    <span className={`pill ${statusPillClass(p.status)}`} style={{ fontSize: "0.68rem", flexShrink: 0 }}>{p.status || "draft"}</span>
                  </div>
                  {p.summary && <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.summary}</p>}
                  {p.metaData?.totalBudget != null && <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--accent)" }}>₳ {Number(p.metaData.totalBudget).toLocaleString()}</p>}
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.2rem" }}>
                    <button onClick={() => proposalOwnedByWallet(p, walletRewardAddress) && onEdit(p)} className="btn-outline" style={{ fontSize: "0.78rem", padding: "0.25rem 0.65rem" }}>Edit</button>
                    <button onClick={() => handleDelete(p)} disabled={deletingId === p._id}
                      style={{ background: "transparent", border: "1px solid color-mix(in srgb, var(--red, #f87171) 40%, transparent)", borderRadius: 7, padding: "0.25rem 0.65rem", fontSize: "0.78rem", color: "var(--red, #f87171)", cursor: "pointer" }}>
                      {deletingId === p._id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Submit Proposal Modal ───────────────────────────────────────────────────

function SubmitProposalModal({ cycle, pillars, walletApi, walletRewardAddress, onClose, onSuccess, initialData, variant = "modal" }) {
  const isPage = variant === "page";
  // ── Auth
  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // ── Draft state
  const [draftId, setDraftId] = useState(() => initialData?._id || null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // §1 Proposal Overview
  const [title, setTitle] = useState(() => initialData?.title || "");
  const [summary, setSummary] = useState(() => initialData?.summary || "");
  const [trackRecord, setTrackRecord] = useState(() => initialData?.metaData?.trackRecord || "");
  const [duration, setDuration] = useState(() => initialData?.metaData?.estimatedDuration != null ? String(initialData.metaData.estimatedDuration) : "");

  // §2 Alignment
  const [selectedPillars, setSelectedPillars] = useState(() => initialData?.metaData?.strategyFramework?.pillars || []);
  const [pillarRationale, setPillarRationale] = useState(() => initialData?.metaData?.strategyFramework?.pillarRationale || "");
  const [kpiAlignment, setKpiAlignment] = useState(() => initialData?.metaData?.strategyFramework?.kpiAlignment || "");

  // §3 Proposer
  const [proposerName, setProposerName] = useState(() => initialData?.metaData?.proposerDetails?.name || "");
  const [proposerLinks, setProposerLinks] = useState(() => {
    const existing = initialData?.metaData?.proposerDetails?.links;
    return existing?.length ? existing : [newLink()];
  });
  const [contactEmail, setContactEmail] = useState(() => initialData?.metaData?.proposerDetails?.email || "");

  // §4 Proposal Details
  const [adaUsdRate, setAdaUsdRate] = useState(() => {
    const rate = initialData?.metaData?.proposalDetails?.conversionRate ?? initialData?.metaData?.conversionRate ?? initialData?.metaData?.adaUsdRate;
    return rate != null ? String(rate) : "";
  });
  const [workPackages, setWorkPackages] = useState(() => {
    const existing = initialData?.metaData?.proposalDetails?.workPackages;
    if (existing?.length) return existing.map(wp => ({
      name: wp.name || "", initiativeType: wp.initiativeType || "",
      typeOfProposal: wp.typeOfProposal || "",
      cannotBreakIntoMilestones: Boolean(wp.cannotBreakIntoMilestones),
      summary: wp.summary || "",
      coreObjectives: wp.coreObjectives?.length ? wp.coreObjectives : [""],
      milestones: (wp.milestones || []).map(m => ({ name: m.name || "", duration: m.duration != null ? String(m.duration) : "", deliverables: m.deliverables || "", acceptanceCriteria: m.acceptanceCriteria || "" })),
      budgetBreakdown: (wp.budgetBreakdown || []).map(r => ({ costCategory: r.costCategory || "", name: r.name || "", quantity: r.quantity != null ? String(r.quantity) : "", unitPrice: r.unitPrice != null ? String(r.unitPrice) : "", total: r.total != null ? String(r.total) : "" })),
      expectedValue: wp.expectedValue || "", metric: wp.metric || "",
      supportingDocuments: wp.supportingDocuments?.length ? wp.supportingDocuments : [newLink()],
    }));
    return [newWp()];
  });

  // §5 Budget Administration
  const [budget, setBudget] = useState(() => initialData?.metaData?.totalBudget != null ? String(initialData.metaData.totalBudget) : "");
  const [administrator, setAdministrator] = useState(() => {
    const admin = initialData?.metaData?.administrator;
    if (!admin || admin === "Yes" || admin === "Intersect") return "Intersect";
    if (admin === "No" || admin === "Other") return "Other";
    return "Other";
  });
  const [otherAdministrator, setOtherAdministrator] = useState(() => initialData?.metaData?.otherAdministrator || "");
  const [intersectFeeAgreed, setIntersectFeeAgreed] = useState(() => Boolean(initialData?.metaData?.intersectAdministratorFeeConsent || initialData?.metaData?.intersectFeeAgreed));
  const [partyType, setPartyType] = useState(() => initialData?.metaData?.contractingParty?.legalEntityType || initialData?.metaData?.partyType || "");
  const [legalEntityName, setLegalEntityName] = useState(() => initialData?.metaData?.contractingParty?.legalEntityName || "");
  const [legalEntityRegistrationNumber, setLegalEntityRegistrationNumber] = useState(() => initialData?.metaData?.contractingParty?.legalEntityRegistrationNumber || "");
  const [legalEntityCountry, setLegalEntityCountry] = useState(() => initialData?.metaData?.contractingParty?.legalEntityCountry || "");
  const [legalEntityAddressLine1, setLegalEntityAddressLine1] = useState(() => initialData?.metaData?.contractingParty?.legalEntityAddressLine1 || "");
  const [legalEntityAddressLine2, setLegalEntityAddressLine2] = useState(() => initialData?.metaData?.contractingParty?.legalEntityAddressLine2 || "");
  const [legalEntityAddressLine3, setLegalEntityAddressLine3] = useState(() => initialData?.metaData?.contractingParty?.legalEntityAddressLine3 || "");
  const [govtIssuedIdNumber, setGovtIssuedIdNumber] = useState(() => initialData?.metaData?.contractingParty?.govtIssuedIdNumber || "");
  const [countryOfResidence, setCountryOfResidence] = useState(() => initialData?.metaData?.contractingParty?.countryOfResidence || "");
  const [residentialAddressLine1, setResidentialAddressLine1] = useState(() => initialData?.metaData?.contractingParty?.residentialAddressLine1 || "");
  const [residentialAddressLine2, setResidentialAddressLine2] = useState(() => initialData?.metaData?.contractingParty?.residentialAddressLine2 || "");
  const [residentialAddressLine3, setResidentialAddressLine3] = useState(() => initialData?.metaData?.contractingParty?.residentialAddressLine3 || "");
  const [primaryContactName, setPrimaryContactName] = useState(() => initialData?.metaData?.primaryContact?.name || "");
  const [primaryContactEmail, setPrimaryContactEmail] = useState(() => initialData?.metaData?.primaryContact?.email || "");
  const [signatoryTitle, setSignatoryTitle] = useState(() => initialData?.metaData?.signatoryContact?.title || initialData?.metaData?.authorizedSignatory?.title || "");
  const [signatoryName, setSignatoryName] = useState(() => initialData?.metaData?.signatoryContact?.name || initialData?.metaData?.authorizedSignatory?.name || "");
  const [signatoryEmail, setSignatoryEmail] = useState(() => initialData?.metaData?.signatoryContact?.email || initialData?.metaData?.authorizedSignatory?.email || "");
  const [signatoryAuthorized, setSignatoryAuthorized] = useState(() => Boolean(initialData?.metaData?.signatoryContact?.authorization || initialData?.metaData?.authorizedSignatory?.authorized));
  const [kycSubmitted, setKycSubmitted] = useState(() => {
    const submitted = initialData?.metaData?.kycInfo?.submitted ?? initialData?.metaData?.kycSubmitted;
    if (submitted === true || String(submitted).toLowerCase() === "yes") return "yes";
    if (submitted === false || String(submitted).toLowerCase() === "no") return "no";
    return "";
  });
  const [kycEmail, setKycEmail] = useState(() => initialData?.metaData?.kycInfo?.email || "");
  const [thirdPartyAssurers, setThirdPartyAssurers] = useState(() => initialData?.metaData?.thirdPartyAssurers || "");

  // §6 Budget Summary
  const [treasuryRepaymentYesNo, setTreasuryRepaymentYesNo] = useState(() => {
    const v = initialData?.metaData?.treasuryRepaymentYesNo;
    if (v === true || v === "yes") return "yes";
    if (v === false || v === "no") return "no";
    return "";
  });
  const [treasuryRepayment, setTreasuryRepayment] = useState(() => initialData?.metaData?.treasuryRepayment || "");
  const [treasuryRepaymentCircumstances, setTreasuryRepaymentCircumstances] = useState(() => initialData?.metaData?.treasuryRepaymentCircumstances || "");
  const [priorFunding, setPriorFunding] = useState(() => initialData?.metaData?.priorFunding || "");
  const [independentAudits, setIndependentAudits] = useState(() => initialData?.metaData?.independentAudits || "");

  // §7 Supporting Info
  const [supportingInfoLinks, setSupportingInfoLinks] = useState(() => initialData?.metaData?.supportingInfoLinks || []);

  // §8 Donation
  const [donationHash, setDonationHash] = useState(() => initialData?.metaData?.treasuryDonationTxHash || initialData?.metaData?.donationHash || "");
  const [donationConfirmed, setDonationConfirmed] = useState(() => Boolean(initialData?.metaData?.treasuryDonationConfirmed || initialData?.metaData?.donation?.confirmed));

  // §9 Legal
  const [declName, setDeclName] = useState(() => initialData?.metaData?.legalDeclarations?.submitterName || initialData?.metaData?.declaration?.name || "");
  const [declEmail, setDeclEmail] = useState(() => initialData?.metaData?.legalDeclarations?.submitterEmail || initialData?.metaData?.declaration?.email || "");
  const [declRole, setDeclRole] = useState(() => initialData?.metaData?.legalDeclarations?.submitterRole || initialData?.metaData?.declaration?.role || "");
  const [legalAuth1, setLegalAuth1] = useState(() => Boolean(initialData?.metaData?.legalDeclarations?.authorizationEntity || initialData?.metaData?.legalAuthorization?.authorizedToSubmit));
  const [legalAuth2, setLegalAuth2] = useState(() => Boolean(initialData?.metaData?.legalDeclarations?.authorizationAttestation || initialData?.metaData?.legalAuthorization?.informationAccurate));

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  async function handleAuth() {
    if (!walletApi || !walletRewardAddress) return;
    setAuthLoading(true);
    setAuthError("");
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
      setAuthError(e.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  function buildProposalPayload(status = "live") {
    const clean = (v) => String(v || "").trim();
    const optional = (v) => clean(v) || undefined;
    const numberOrBlank = (v) => clean(v) ? Number(v) : "";
    const yesNo = (v) => v === "yes" ? "Yes" : v === "no" ? "No" : "";
    const cleanLinks = (arr) => arr
      .filter(l => clean(l.url))
      .map(l => ({ title: clean(l.title) || clean(l.url), url: clean(l.url) }));
    const cleanWorkPackages = workPackages
      .filter(wp => clean(wp.name) || clean(wp.summary) || wp.budgetBreakdown.some(r => clean(r.name)))
      .map(wp => ({
        name: clean(wp.name),
        ...(clean(wp.initiativeType) ? { initiativeType: clean(wp.initiativeType) } : {}),
        ...(clean(wp.typeOfProposal) ? { typeOfProposal: clean(wp.typeOfProposal) } : {}),
        ...(wp.cannotBreakIntoMilestones ? { cannotBreakIntoMilestones: true } : {}),
        ...(clean(wp.summary) ? { summary: clean(wp.summary) } : {}),
        ...(wp.coreObjectives.map(clean).filter(Boolean).length > 0 ? { coreObjectives: wp.coreObjectives.map(clean).filter(Boolean) } : {}),
        ...(wp.milestones.length > 0 ? {
          milestones: wp.milestones
            .filter(m => clean(m.name) || clean(m.deliverables) || clean(m.acceptanceCriteria))
            .map(m => ({
              name: clean(m.name),
              ...(m.duration ? { duration: Number(m.duration) } : {}),
              ...(clean(m.deliverables) ? { deliverables: clean(m.deliverables) } : {}),
              ...(clean(m.acceptanceCriteria) ? { acceptanceCriteria: clean(m.acceptanceCriteria) } : {}),
            })),
        } : {}),
        ...(wp.budgetBreakdown.length > 0 ? {
          budgetBreakdown: wp.budgetBreakdown
            .filter(r => clean(r.costCategory) || clean(r.name))
            .map(r => ({
              costCategory: clean(r.costCategory),
              name: clean(r.name),
              quantity: Number(r.quantity) || 0,
              unitPrice: Number(r.unitPrice) || 0,
              total: Number(r.total) || 0,
            })),
        } : {}),
        ...(clean(wp.expectedValue) ? { expectedValue: clean(wp.expectedValue) } : {}),
        ...(clean(wp.metric) ? { metric: clean(wp.metric) } : {}),
        ...(wp.supportingDocuments.some(l => clean(l.url)) ? { supportingDocuments: cleanLinks(wp.supportingDocuments) } : {}),
      }));
    const workPackageTotal = cleanWorkPackages.reduce((sum, wp) => (
      sum + (wp.budgetBreakdown || []).reduce((rowSum, row) => rowSum + (Number(row.total) || 0), 0)
    ), 0);
    const requestedBudget = budget ? Number(budget) : workPackageTotal;
    const totalBudget = Math.round(clean(administrator) === "Intersect" ? requestedBudget * 1.03 : requestedBudget);

    return {
      voteId: cycle._id,
      status,
      title: clean(title) || "Untitled proposal",
      summary: clean(summary),
      metaData: {
        totalBudget,
        trackRecord: clean(trackRecord),
        estimatedDuration: numberOrBlank(duration),
        treasuryDonationTxHash: clean(donationHash),
        treasuryDonationConfirmed: donationConfirmed,
        administrator: clean(administrator),
        intersectAdministratorFeeConsent: intersectFeeAgreed,
        otherAdministrator: clean(administrator) === "Other" ? clean(otherAdministrator) : "",
        contractingParty: {
          legalEntityType: clean(partyType),
          legalEntityName: clean(legalEntityName),
          legalEntityRegistrationNumber: clean(legalEntityRegistrationNumber),
          legalEntityCountry: clean(legalEntityCountry),
          legalEntityAddressLine1: clean(legalEntityAddressLine1),
          legalEntityAddressLine2: clean(legalEntityAddressLine2),
          legalEntityAddressLine3: clean(legalEntityAddressLine3),
          govtIssuedIdNumber: clean(govtIssuedIdNumber),
          countryOfResidence: clean(countryOfResidence),
          residentialAddressLine1: clean(residentialAddressLine1),
          residentialAddressLine2: clean(residentialAddressLine2),
          residentialAddressLine3: clean(residentialAddressLine3),
        },
        primaryContact: {
          name: clean(primaryContactName),
          email: clean(primaryContactEmail),
        },
        signatoryContact: {
          title: clean(signatoryTitle),
          name: clean(signatoryName),
          email: clean(signatoryEmail),
          authorization: signatoryAuthorized,
        },
        kycInfo: {
          submitted: yesNo(kycSubmitted),
          email: clean(kycEmail),
        },
        ...(clean(thirdPartyAssurers) ? { thirdPartyAssurers: clean(thirdPartyAssurers) } : {}),
        ...(clean(walletRewardAddress) ? { submissionSignerAddress: clean(walletRewardAddress) } : {}),
        proposerDetails: {
          name: clean(proposerName),
          email: clean(contactEmail),
          ...(clean(walletRewardAddress) ? { rewardAddress: clean(walletRewardAddress) } : {}),
          links: cleanLinks(proposerLinks),
        },
        strategyFramework: {
          pillars: selectedPillars,
          pillarRationale: clean(pillarRationale),
          kpiAlignment: clean(kpiAlignment),
        },
        priorFunding: optional(priorFunding) || "",
        independentAudits: optional(independentAudits) || "",
        treasuryRepaymentYesNo: yesNo(treasuryRepaymentYesNo),
        treasuryRepayment: optional(treasuryRepayment) || "",
        treasuryRepaymentCircumstances: optional(treasuryRepaymentCircumstances) || "",
        supportingInfoLinks: cleanLinks(supportingInfoLinks),
        proposalDetails: {
          conversionRate: numberOrBlank(adaUsdRate),
          workPackages: cleanWorkPackages,
        },
        legalDeclarations: {
          submitterName: clean(declName),
          submitterEmail: clean(declEmail),
          submitterRole: clean(declRole),
          authorizationEntity: legalAuth1,
          authorizationAttestation: legalAuth2,
        },
      },
    };
  }

  async function saveProposal(status = "draft") {
    const body = buildProposalPayload(status);
    const path = draftId ? `/proposals/${draftId}` : "/proposals";
    const method = draftId ? "PUT" : "POST";
    const res = await apiFetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const id = res?._id || res?.data?._id || res?.proposal?._id;
    if (id) setDraftId(id);
    return res;
  }

  async function handleSaveDraft() {
    setDraftSaving(true);
    setDraftSaved(false);
    setSubmitError("");
    try {
      await saveProposal("draft");
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2500);
    } catch (e) {
      setSubmitError(e.message || "Failed to save draft.");
    } finally {
      setDraftSaving(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await saveProposal("live");
      setDone(true);
      if (!isPage) onSuccess?.();
    } catch (e) {
      setSubmitError(e.message || "Failed to submit proposal.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Work package helpers
  function updateWp(i, patch) { setWorkPackages(wps => wps.map((w, j) => j === i ? { ...w, ...patch } : w)); }
  function updateWpObj(i, key, patch) { setWorkPackages(wps => wps.map((w, j) => j === i ? { ...w, [key]: w[key].map((x, k) => k === patch.i ? { ...x, ...patch.v } : x) } : w)); }
  function addToWp(i, key, val) { setWorkPackages(wps => wps.map((w, j) => j === i ? { ...w, [key]: [...w[key], val] } : w)); }
  function removeFromWp(i, key, k) { setWorkPackages(wps => wps.map((w, j) => j === i ? { ...w, [key]: w[key].filter((_, m) => m !== k) } : w)); }
  function updateBudgetRow(wi, ri, patch) { setWorkPackages(wps => wps.map((w, j) => { if (j !== wi) return w; const row = { ...w.budgetBreakdown[ri], ...patch }; row.total = (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0); return { ...w, budgetBreakdown: w.budgetBreakdown.map((r, k) => k === ri ? row : r) }; })); }

  function togglePillar(id) {
    setSelectedPillars(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const inp = {
    width: "100%", padding: "0.62rem 0.72rem", borderRadius: 7,
    border: "1px solid var(--line)", background: "color-mix(in srgb, var(--bg) 88%, var(--panel) 12%)",
    color: "var(--text)", fontSize: "0.86rem", boxSizing: "border-box",
    outline: "none",
  };
  const ta = { ...inp, resize: "vertical", minHeight: 120, lineHeight: 1.55 };
  const lbl = { display: "flex", justifyContent: "space-between", gap: "0.75rem", fontSize: "0.74rem", fontWeight: 700, marginBottom: "0.34rem", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" };
  const hint = { margin: "0.05rem 0 0.55rem", color: "var(--text-muted)", fontSize: "0.76rem", lineHeight: 1.5 };
  const addBtn = { background: "var(--mint)", border: "1px solid var(--mint)", borderRadius: 7, padding: "0.36rem 0.72rem", fontSize: "0.78rem", color: "#031311", fontWeight: 700, cursor: "pointer" };
  const ghostBtn = { background: "transparent", border: "1px dashed var(--line)", borderRadius: 7, padding: "0.36rem 0.72rem", fontSize: "0.78rem", color: "var(--text-muted)", cursor: "pointer" };
  const remBtn = { background: "transparent", border: "none", cursor: "pointer", color: "var(--red, #f87171)", fontSize: "0.78rem", padding: "0.2rem 0.4rem", flexShrink: 0 };
  const section = {
    border: "1px solid var(--line)",
    borderRadius: isPage ? 8 : 10,
    background: isPage ? "color-mix(in srgb, var(--panel) 76%, var(--bg) 24%)" : "color-mix(in srgb, var(--panel) 86%, var(--bg) 14%)",
    boxShadow: isPage ? "none" : "0 12px 28px rgba(0,0,0,0.13)",
    padding: isPage ? "0.95rem 1rem 1.05rem" : "1.05rem 1.15rem",
    marginBottom: "0",
    display: "flex",
    flexDirection: "column",
    gap: isPage ? "0.78rem" : "0.9rem",
  };
  const sectionHead = { display: "flex", alignItems: "center", gap: "0.65rem" };
  const sectionTitle = { margin: 0, fontSize: "0.98rem", fontWeight: 800, letterSpacing: "-0.01em" };
  const fieldGroup = { display: "flex", flexDirection: "column", gap: "0.18rem" };
  const toolBar = {
    display: "flex", gap: "0.28rem", alignItems: "center",
    padding: "0.35rem", border: "1px solid var(--line)",
    borderBottom: "none", borderRadius: "7px 7px 0 0", background: "color-mix(in srgb, var(--bg) 72%, var(--panel) 28%)",
  };
  const toolBtn = {
    width: 25, height: 25, borderRadius: 5, border: "1px solid var(--line)",
    background: "var(--bg)", color: "var(--text-muted)", fontSize: "0.75rem",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  };

  function Field({ label, children, help, count }) {
    return (
      <div style={fieldGroup}>
        <label style={lbl}>
          <span>{label}</span>
          {count && <span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: "0.68rem" }}>{count}</span>}
        </label>
        {help && <p style={hint}>{help}</p>}
        {children}
      </div>
    );
  }

  function FormSection({ id, number, title, order, children }) {
    return (
      <section id={id} className={isPage ? "ekk-submit-section" : undefined} style={{ ...section, gridColumn: isPage ? 2 : "auto", ...(order != null ? { order } : {}) }}>
        <div style={sectionHead}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: "color-mix(in srgb, var(--accent) 16%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
            color: "var(--accent)", fontSize: "0.75rem", fontWeight: 800,
            flexShrink: 0,
          }}>{number}</span>
          <h3 style={sectionTitle}>{title}</h3>
        </div>
        {children}
      </section>
    );
  }

  function SectionRail() {
    const items = [
      ["overview", "1", "Proposal Overview"],
      ["strategy", "2", "Strategy"],
      ["proposer", "3", "Proposer"],
      ["details", "4", "Proposal Details"],
      ["work-packages", "5", "Work Packages"],
      ["administration", "6", "Budget Administration"],
      ["summary", "7", "Budget Summary"],
      ["supporting", "8", "Other Supporting Info"],
      ["donation", "9", "Treasury Donation"],
      ["legal", "10", "Legal Declarations"],
    ];
    return (
      <aside className="ekk-submit-rail" style={{ gridColumn: 1, order: 0 }}>
        <p style={{ margin: "0 0 0.65rem", color: "var(--text-muted)", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 800 }}>
          Proposal Flow
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.18rem" }}>
          {items.map(([id, n, label]) => (
            <a key={id} href={`#${id}`} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: "0.45rem", alignItems: "center", padding: "0.32rem 0.2rem", color: "var(--text-muted)", fontSize: "0.78rem", textDecoration: "none" }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--line)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", color: "var(--accent)" }}>{n}</span>
              <span>{label}</span>
            </a>
          ))}
        </div>
      </aside>
    );
  }

  function RichTextarea({ value, onChange, rows = 5, placeholder, maxLength, ...rest }) {
    return (
      <div>
        <div style={toolBar} aria-hidden="true">
          {["B", "I", "U", "H", "•", "1.", "[]"].map(x => <span key={x} style={toolBtn}>{x}</span>)}
        </div>
        <textarea
          value={value}
          onChange={onChange}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
          {...rest}
          style={{ ...ta, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        />
      </div>
    );
  }

  function RadioRow({ name, value, current, onChange, label }) {
    return (
      <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", color: "var(--text)", fontSize: "0.82rem", cursor: "pointer" }}>
        <input type="radio" name={name} checked={current === value} onChange={() => onChange(value)}
          style={{ width: 15, height: 15, margin: 0, flexShrink: 0, cursor: "pointer", accentColor: "var(--mint)" }} />
        {label}
      </label>
    );
  }

  function LinkList({ links, setLinks, placeholder = "https://…" }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {links.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <input value={l.title} onChange={e => setLinks(ls => ls.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
              placeholder="Label" style={{ ...inp, width: 120, flexShrink: 0 }} />
            <input value={l.url} onChange={e => setLinks(ls => ls.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
              placeholder={placeholder} style={inp} />
            <button type="button" onClick={() => setLinks(ls => ls.filter((_, j) => j !== i))} style={remBtn}>✕</button>
          </div>
        ))}
        <button type="button" onClick={() => setLinks(ls => [...ls, newLink()])} style={{ ...addBtn, alignSelf: "flex-start" }}>+ Add Link</button>
      </div>
    );
  }

  return (
    <div
      style={isPage ? { width: "100%" } : {
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "1rem",
      }}
      onClick={isPage ? undefined : onClose}
    >
      <div
        style={{
          background: "var(--bg)", border: isPage ? "none" : "1px solid var(--line)", borderRadius: isPage ? 0 : 14,
          width: "100%", maxWidth: isPage ? 1120 : 700, maxHeight: isPage ? "none" : "92vh",
          display: "flex", flexDirection: "column", boxShadow: isPage ? "none" : "0 24px 64px rgba(0,0,0,0.4)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {!isPage && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "1rem 1.25rem", borderBottom: "1px solid var(--line)", flexShrink: 0,
          }}>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{draftId ? "Edit Proposal" : "Submit a Proposal"}</h2>
            <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.2rem", lineHeight: 1, padding: "0.2rem" }}>✕</button>
          </div>
        )}

        {/* Body */}
        <div style={{ overflowY: isPage ? "visible" : "auto", flex: 1, padding: isPage ? "0" : "1.25rem" }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <p style={{ fontSize: "2rem", margin: "0 0 0.75rem" }}>✓</p>
              <p style={{ fontWeight: 700, fontSize: "1rem", margin: "0 0 0.5rem" }}>Proposal submitted!</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>Your proposal has been submitted and will appear in the list shortly.</p>
              {isPage && (
                <button type="button" onClick={onSuccess} className="btn-outline" style={{ marginTop: "1rem", fontWeight: 600, padding: "0.5rem 1.25rem" }}>
                  Back to Budget
                </button>
              )}
            </div>
          ) : !walletApi ? (
            <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", padding: "1.1rem", maxWidth: 520 }}>
              <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>Connect your wallet using the button in the top bar to submit a proposal.</p>
            </div>
          ) : !authed ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", padding: "1.1rem", maxWidth: 520 }}>
              <p style={{ fontSize: "0.85rem", margin: 0, color: "var(--text-muted)" }}>Sign in with your wallet to continue editing and saving proposal drafts.</p>
              <button onClick={handleAuth} disabled={authLoading} className="btn-outline" style={{ alignSelf: "flex-start" }}>
                {authLoading ? "Signing…" : "Sign in with Wallet"}
              </button>
              {authError && <p style={{ color: "var(--red, #f87171)", fontSize: "0.82rem", margin: 0 }}>{authError}</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={isPage ? "ekk-submit-form" : undefined} style={isPage ? undefined : { display: "flex", flexDirection: "column" }}>
              {isPage && <SectionRail />}
              <FormSection id="overview" number="1" title="Proposal Overview" order={1}>
                <Field label="Proposal Title *" count={`${title.length}/100`}>
                  <input value={title} onChange={e => setTitle(e.target.value)} required maxLength={100} placeholder="Proposal title" style={inp} />
                </Field>
                <div>
                  <h4 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 800 }}>Please describe your whole proposal at a high level</h4>
                  <p style={hint}>Provide a high-level overview of the problem, proposed solution, and the value your overall proposal provides with reference to Cardano's vision. This is the first thing DReps will see.</p>
                  <Field label="Executive Summary *" count={`${summary.length}/2000`}>
                    <RichTextarea value={summary} onChange={e => setSummary(e.target.value)} required rows={5} maxLength={2000} placeholder="Describe your whole proposal at a high level..." />
                  </Field>
                </div>
                <div>
                  <h4 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 800 }}>Why are you the best suited to deliver this work?</h4>
                  <p style={hint}>Describe relevant experience, expertise, delivery history and any supporting credentials.</p>
                  <Field label="Track Record" count={`${trackRecord.length}/5000`}>
                    <RichTextarea value={trackRecord} onChange={e => setTrackRecord(e.target.value)} rows={4} maxLength={5000} placeholder="Enter track record here" />
                  </Field>
                </div>
                <Field
                  label="Estimated Duration (in months)"
                  help="Provide an estimated duration from start to completion. For ongoing operations, specify the number of months this budget covers."
                >
                  <div style={{ display: "flex", alignItems: "center", maxWidth: 220 }}>
                    <input type="number" min="1" max="60" value={duration} onChange={e => setDuration(e.target.value)} placeholder="12" style={{ ...inp, borderTopRightRadius: 0, borderBottomRightRadius: 0 }} />
                    <span style={{ padding: "0.62rem 0.75rem", border: "1px solid var(--line)", borderLeft: "none", borderRadius: "0 7px 7px 0", color: "var(--text-muted)", fontSize: "0.78rem" }}>months</span>
                  </div>
                </Field>
              </FormSection>

              <FormSection id="strategy" number="2" title="Alignment to Strategy Framework" order={2}>
                <div>
                  <h4 style={{ margin: "0 0 0.2rem", fontSize: "0.93rem", fontWeight: 800 }}>To which strategic pillar does your proposal align the most?</h4>
                  <p style={hint}>Select one or more strategic pillars that your proposal supports. You must select at least one.</p>
                </div>
              {pillars.length > 0 && (
                <div>
                  <label style={lbl}>Strategic Pillars</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.5rem" }}>
                    {pillars.map(p => {
                      const active = selectedPillars.includes(p._id);
                      return (
                        <button type="button" key={p._id} onClick={() => togglePillar(p._id)} style={{
                          padding: "0.75rem 0.85rem", borderRadius: 9, fontSize: "0.8rem",
                          border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
                          background: active ? "color-mix(in srgb, var(--accent) 12%, var(--bg))" : "color-mix(in srgb, var(--bg) 72%, var(--panel) 28%)",
                          color: "var(--text)", cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                        }}>
                          <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.66rem", marginBottom: "0.25rem" }}>{p.title?.match(/Pillar\s*\d+/i)?.[0] || "Strategic pillar"}</span>
                          <strong>{p.title?.replace(/^Pillar\s*\d+:\s*/i, "") || p.title}</strong>
                          {p.description && <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.73rem", lineHeight: 1.45, marginTop: "0.28rem" }}>{p.description}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
                <Field label="Why have you selected those pillars?" count={`${pillarRationale.length}/10000`}>
                  <RichTextarea value={pillarRationale} onChange={e => setPillarRationale(e.target.value)} rows={5} maxLength={10000} placeholder="Explain why you chose those pillars." />
                </Field>
                <Field label="Alignment to KPIs" count={`${kpiAlignment.length}/10000`} help="Explain the specific actions, methodologies, or expected impact of your proposal against the Cardano Strategy Framework KPIs.">
                  <RichTextarea value={kpiAlignment} onChange={e => setKpiAlignment(e.target.value)} rows={5} maxLength={10000} placeholder="Explain specific actions, methodologies, or expected impact per KPI." />
                </Field>
              </FormSection>

              <FormSection id="proposer" number="3" title="Proposer" order={3}>
                <Field label="Proposer Public Name *" count={`${proposerName.length}/50`} help="This is the name that will be publicly displayed. For individual submissions use your full name; for company submissions use the company name.">
                  <input value={proposerName} onChange={e => setProposerName(e.target.value)} maxLength={50} placeholder="Your name or company name" style={{ ...inp, maxWidth: 320 }} />
                </Field>
                <Field label="Primary Contact Email *" count={`${contactEmail.length}/254`} help="This email will be used for all proposal-submission related communications.">
                  <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} maxLength={254} placeholder="Enter email address" style={{ ...inp, maxWidth: 320 }} />
                </Field>
                <Field label="Social Media / Website Links" help="Add public links such as your website, Twitter/X, LinkedIn, GitHub, or other relevant profiles.">
                  <LinkList links={proposerLinks} setLinks={setProposerLinks} />
                </Field>
              </FormSection>

              <FormSection id="details" number="4" title="Proposal Details" order={4}>
                <Field label="ADA/USD conversion rate *" help="Specify the ADA/USD conversion rate used for all USD cost estimates contained within this proposal. Note: This rate is for reference only; actual ADA amounts govern all treasury interactions.">
                  <div style={{ display: "flex", alignItems: "center", maxWidth: 260 }}>
                    <input type="number" min="0" step="0.0001" value={adaUsdRate} onChange={e => setAdaUsdRate(e.target.value)} placeholder="0.25" style={{ ...inp, borderTopRightRadius: 0, borderBottomRightRadius: 0 }} />
                    <span style={{ padding: "0.62rem 0.75rem", border: "1px solid var(--line)", borderLeft: "none", borderRadius: "0 7px 7px 0", color: "var(--text-muted)", fontSize: "0.78rem" }}>USD / ADA</span>
                  </div>
                </Field>
              </FormSection>

              <FormSection id="administration" number="6" title="Budget Administration" order={6}>
              <Field label="Who will be the Administrator for this budget proposal if approved?" help="Cardano's Constitution requires each Treasury Withdrawal to specify an Administrator and a third-party auditor. Intersect is the default administrator.">
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", alignSelf: "flex-start" }}>
                  <RadioRow name="administrator" value="Intersect" current={administrator} onChange={setAdministrator} label="Intersect" />
                  <RadioRow name="administrator" value="Other" current={administrator} onChange={setAdministrator} label="Other" />
                </div>
              </Field>
              {administrator === "Intersect" && (
                <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                  <input type="checkbox" checked={intersectFeeAgreed} onChange={e => setIntersectFeeAgreed(e.target.checked)} style={{ marginTop: "0.15rem" }} />
                  I consent to Intersect acting as Administrator and understand this may include an administration fee and milestone-based fund disbursement.
                </label>
              )}
              {administrator === "Other" && (
                <div>
                  <label style={lbl}>Details about other administrator</label>
                  <textarea value={otherAdministrator} onChange={e => setOtherAdministrator(e.target.value)} rows={3}
                    placeholder="Specify who will administer this proposal if approved…" style={ta} />
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div>
                  <label style={lbl}>Contracting Party Type</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.3rem" }}>
                    <RadioRow name="partyType" value="company" current={partyType} onChange={setPartyType} label="Company / Legal Entity" />
                    <RadioRow name="partyType" value="individual" current={partyType} onChange={setPartyType} label="Individual" />
                  </div>
                </div>
                <div>
                  <label style={lbl}>KYC/KYB Submitted</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.3rem" }}>
                    <RadioRow name="kycSubmitted" value="yes" current={kycSubmitted} onChange={setKycSubmitted} label="Yes" />
                    <RadioRow name="kycSubmitted" value="no" current={kycSubmitted} onChange={setKycSubmitted} label="No" />
                  </div>
                </div>
              </div>
              {partyType === "company" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.65rem" }}>
                  <div>
                    <label style={lbl}>Legal Entity Name</label>
                    <input value={legalEntityName} onChange={e => setLegalEntityName(e.target.value)} placeholder="Registered company name" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Registration Number</label>
                    <input value={legalEntityRegistrationNumber} onChange={e => setLegalEntityRegistrationNumber(e.target.value)} placeholder="Tax ID / registration number" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Country of Incorporation</label>
                    <input value={legalEntityCountry} onChange={e => setLegalEntityCountry(e.target.value)} placeholder="Jurisdiction" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Registered Address Line 1</label>
                    <input value={legalEntityAddressLine1} onChange={e => setLegalEntityAddressLine1(e.target.value)} placeholder="Address line 1" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Registered Address Line 2</label>
                    <input value={legalEntityAddressLine2} onChange={e => setLegalEntityAddressLine2(e.target.value)} placeholder="Address line 2" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Registered Address Line 3</label>
                    <input value={legalEntityAddressLine3} onChange={e => setLegalEntityAddressLine3(e.target.value)} placeholder="Address line 3" style={inp} />
                  </div>
                </div>
              )}
              {partyType === "individual" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.65rem" }}>
                  <div>
                    <label style={lbl}>Government-issued ID number</label>
                    <input value={govtIssuedIdNumber} onChange={e => setGovtIssuedIdNumber(e.target.value)} placeholder="ID / passport number" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Country of Residence</label>
                    <input value={countryOfResidence} onChange={e => setCountryOfResidence(e.target.value)} placeholder="Country" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Residential Address Line 1</label>
                    <input value={residentialAddressLine1} onChange={e => setResidentialAddressLine1(e.target.value)} placeholder="Address line 1" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Residential Address Line 2</label>
                    <input value={residentialAddressLine2} onChange={e => setResidentialAddressLine2(e.target.value)} placeholder="Address line 2" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Residential Address Line 3</label>
                    <input value={residentialAddressLine3} onChange={e => setResidentialAddressLine3(e.target.value)} placeholder="Address line 3" style={inp} />
                  </div>
                </div>
              )}
              {kycSubmitted === "no" && (
                <div>
                  <label style={lbl}>KYC/KYB Contact Email</label>
                  <p style={{ ...hint, marginTop: 0 }}>Please provide an email address so Intersect can contact you to initiate the KYC/KYB process.</p>
                  <input type="email" value={kycEmail} onChange={e => setKycEmail(e.target.value)} placeholder="kyc@example.com" style={inp} />
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.65rem" }}>
                <div>
                  <label style={lbl}>Primary Contact Name</label>
                  <input value={primaryContactName} onChange={e => setPrimaryContactName(e.target.value)} placeholder="Contact name" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Primary Contact Email</label>
                  <input type="email" value={primaryContactEmail} onChange={e => setPrimaryContactEmail(e.target.value)} placeholder="contact@example.com" style={inp} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.65rem" }}>
                <div>
                  <label style={lbl}>Authorized Signatory Title</label>
                  <input value={signatoryTitle} onChange={e => setSignatoryTitle(e.target.value)} placeholder="e.g. Director" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Authorized Signatory Name</label>
                  <input value={signatoryName} onChange={e => setSignatoryName(e.target.value)} placeholder="Full name" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Authorized Signatory Email</label>
                  <input type="email" value={signatoryEmail} onChange={e => setSignatoryEmail(e.target.value)} placeholder="signatory@example.com" style={inp} />
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                <input type="checkbox" checked={signatoryAuthorized} onChange={e => setSignatoryAuthorized(e.target.checked)} style={{ marginTop: "0.15rem" }} />
                I confirm that the named authorized signatory has the authority to enter into binding agreements on behalf of the contracting party in relation to this proposal.
              </label>
              <div>
                <label style={lbl}>Third Party Assurers</label>
                <p style={{ ...hint, marginTop: 0 }}>If you have identified or engaged any preferred third-party assurers or auditors for this proposal, please list them here.</p>
                <textarea value={thirdPartyAssurers} onChange={e => setThirdPartyAssurers(e.target.value)} rows={2}
                  placeholder="List any preferred or confirmed third party assurers…" style={ta} />
              </div>
              </FormSection>

              {/* ── Supporting Links ──────────────────────────────────── */}
              <FormSection id="summary" number="7" title="Budget Summary" order={7}>
              {/* Auto-calculated budget table from work packages */}
              {workPackages.some(wp => wp.budgetBreakdown.some(r => Number(r.total) > 0)) && (
                <div>
                  <label style={lbl}>Work Package Cost Summary</label>
                  <div style={{ overflowX: "auto", marginTop: "0.4rem" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                      <thead>
                        <tr style={{ background: "var(--panel)", borderBottom: "1px solid var(--line)" }}>
                          <th style={{ padding: "0.5rem 0.6rem", textAlign: "left", fontWeight: 700, color: "var(--text)" }}>Work Package</th>
                          <th style={{ padding: "0.5rem 0.6rem", textAlign: "right", fontWeight: 700, color: "var(--text)" }}>ADA Cost</th>
                          <th style={{ padding: "0.5rem 0.6rem", textAlign: "right", fontWeight: 700, color: "var(--text)" }}>USD Equivalent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workPackages.map((wp, wi) => {
                          const wpTotal = wp.budgetBreakdown.reduce((s, r) => s + (Number(r.total) || 0), 0);
                          const usd = adaUsdRate ? (wpTotal * Number(adaUsdRate)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
                          return wpTotal > 0 ? (
                            <tr key={wi} style={{ borderBottom: "1px solid var(--line)" }}>
                              <td style={{ padding: "0.45rem 0.6rem", color: "var(--text)" }}>WP{wi + 1}: {wp.name || "Untitled"}</td>
                              <td style={{ padding: "0.45rem 0.6rem", textAlign: "right", color: "var(--text)" }}>₳ {wpTotal.toLocaleString()}</td>
                              <td style={{ padding: "0.45rem 0.6rem", textAlign: "right", color: "var(--text-muted)" }}>${usd}</td>
                            </tr>
                          ) : null;
                        })}
                        {(() => {
                          const grandTotal = workPackages.reduce((s, wp) => s + wp.budgetBreakdown.reduce((rs, r) => rs + (Number(r.total) || 0), 0), 0);
                          const grandUsd = adaUsdRate ? (grandTotal * Number(adaUsdRate)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
                          return (
                            <tr style={{ borderTop: "2px solid var(--line)", fontWeight: 700 }}>
                              <td style={{ padding: "0.45rem 0.6rem", color: "var(--text)" }}>Total</td>
                              <td style={{ padding: "0.45rem 0.6rem", textAlign: "right", color: "var(--text)" }}>₳ {grandTotal.toLocaleString()}</td>
                              <td style={{ padding: "0.45rem 0.6rem", textAlign: "right", color: "var(--text-muted)" }}>${grandUsd}</td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <Field label="Will any portion of the requested funds be returned to the Cardano Treasury?">
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.3rem" }}>
                  <RadioRow name="treasuryRepaymentYesNo" value="yes" current={treasuryRepaymentYesNo} onChange={setTreasuryRepaymentYesNo} label="Yes" />
                  <RadioRow name="treasuryRepaymentYesNo" value="no" current={treasuryRepaymentYesNo} onChange={setTreasuryRepaymentYesNo} label="No" />
                </div>
              </Field>
              {treasuryRepaymentYesNo === "yes" && (
                <>
                  <Field label="Treasury Repayment Details">
                    <textarea value={treasuryRepayment} onChange={e => setTreasuryRepayment(e.target.value)} rows={2}
                      placeholder="Describe the repayment plan…" style={ta} />
                  </Field>
                  <Field label="Circumstances for Repayment">
                    <textarea value={treasuryRepaymentCircumstances} onChange={e => setTreasuryRepaymentCircumstances(e.target.value)} rows={2}
                      placeholder="Under what circumstances would repayment apply?" style={ta} />
                  </Field>
                </>
              )}
              <Field label="Prior Funding" count={`${priorFunding.length}/10000`} help="List any prior funding received from Catalyst, treasury withdrawals, Intersect programs, or related ecosystem grants. Enter 'N/A' if none.">
                <RichTextarea value={priorFunding} onChange={e => setPriorFunding(e.target.value)} rows={4} maxLength={10000} placeholder="Enter details or N/A" />
              </Field>
              <Field label="Independent Audits" count={`${independentAudits.length}/10000`} help="Describe any independent audits that will be conducted for this proposal.">
                <RichTextarea value={independentAudits} onChange={e => setIndependentAudits(e.target.value)} rows={3} maxLength={10000} placeholder="Enter details or N/A" />
              </Field>
              </FormSection>

              <FormSection id="supporting" number="8" title="Other Supporting Info" order={8}>
              <p style={{ margin: "0 0 0.65rem", color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.55 }}>
                Add any additional supporting links relevant to this proposal — such as research papers, prior work, GitHub repositories, presentations, or other evidence.
              </p>
              <LinkList links={supportingInfoLinks} setLinks={setSupportingInfoLinks} placeholder="https://…" />
              </FormSection>

              {/* ── Work Packages ─────────────────────────────────────── */}
              <FormSection id="work-packages" number="5" title="Work Packages" order={5}>
              {workPackages.map((wp, wi) => (
                <div key={wi} style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 0.9rem", background: "var(--panel)", borderBottom: "1px solid var(--line)" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.88rem", flex: 1 }}>WP{wi + 1}: {wp.name || "Untitled"}</span>
                    <button type="button" onClick={() => setWorkPackages(wps => wps.filter((_, j) => j !== wi))} style={remBtn}>Remove</button>
                  </div>
                  <div style={{ padding: "0.9rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div>
                      <label style={lbl}>Work Package Name *</label>
                      <input value={wp.name} onChange={e => updateWp(wi, { name: e.target.value })} placeholder="Work package name" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Type of Proposal</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.3rem" }}>
                        <RadioRow name={`typeOfProposal-${wi}`} value="Technical" current={wp.typeOfProposal} onChange={v => updateWp(wi, { typeOfProposal: v })} label="Technical" />
                        <RadioRow name={`typeOfProposal-${wi}`} value="Non-technical" current={wp.typeOfProposal} onChange={v => updateWp(wi, { typeOfProposal: v })} label="Non-technical" />
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>Initiative Type</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.3rem" }}>
                        <RadioRow name={`initiativeType-${wi}`} value="New Initiative" current={wp.initiativeType} onChange={v => updateWp(wi, { initiativeType: v })} label="New Initiative" />
                        <RadioRow name={`initiativeType-${wi}`} value="Maintenance" current={wp.initiativeType} onChange={v => updateWp(wi, { initiativeType: v })} label="Maintenance" />
                      </div>
                    </div>
                    <div>
                      <label style={lbl}>Summary *</label>
                      <textarea value={wp.summary} onChange={e => updateWp(wi, { summary: e.target.value })} rows={3} placeholder="Describe this work package…" style={ta} />
                    </div>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      <input type="checkbox" checked={wp.cannotBreakIntoMilestones} onChange={e => updateWp(wi, { cannotBreakIntoMilestones: e.target.checked })} style={{ marginTop: "0.15rem" }} />
                      This work package cannot be broken down into milestones
                    </label>

                    {/* Core Objectives */}
                    <div>
                      <label style={lbl}>Core Objectives</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        {wp.coreObjectives.map((obj, oi) => (
                          <div key={oi} style={{ display: "flex", gap: "0.4rem" }}>
                            <input value={obj} onChange={e => updateWp(wi, { coreObjectives: wp.coreObjectives.map((x, k) => k === oi ? e.target.value : x) })}
                              placeholder={`Objective ${oi + 1}`} style={inp} />
                            <button type="button" onClick={() => updateWp(wi, { coreObjectives: wp.coreObjectives.filter((_, k) => k !== oi) })} style={remBtn}>✕</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => updateWp(wi, { coreObjectives: [...wp.coreObjectives, ""] })} style={addBtn}>+ Add objective</button>
                      </div>
                    </div>

                    {/* Milestones */}
                    <div>
                      <label style={lbl}>Milestones</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {wp.milestones.map((m, mi) => (
                          <div key={mi} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "0.65rem 0.8rem", background: "var(--panel)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <span style={{ fontWeight: 600, fontSize: "0.82rem", flex: 1 }}>M{mi + 1}: {m.name || "Untitled"}</span>
                              <button type="button" onClick={() => removeFromWp(wi, "milestones", mi)} style={remBtn}>Remove</button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem" }}>
                              <div>
                                <label style={lbl}>Name</label>
                                <input value={m.name} onChange={e => updateWpObj(wi, "milestones", { i: mi, v: { name: e.target.value } })} placeholder="Milestone name" style={inp} />
                              </div>
                              <div>
                                <label style={lbl}>Duration (weeks)</label>
                                <input type="number" min="1" value={m.duration} onChange={e => updateWpObj(wi, "milestones", { i: mi, v: { duration: e.target.value } })} placeholder="e.g. 4" style={{ ...inp, width: 90 }} />
                              </div>
                            </div>
                            <div>
                              <label style={lbl}>Deliverables</label>
                              <textarea value={m.deliverables} onChange={e => updateWpObj(wi, "milestones", { i: mi, v: { deliverables: e.target.value } })} rows={2} placeholder="What will be delivered?" style={ta} />
                            </div>
                            <div>
                              <label style={lbl}>Acceptance Criteria</label>
                              <textarea value={m.acceptanceCriteria} onChange={e => updateWpObj(wi, "milestones", { i: mi, v: { acceptanceCriteria: e.target.value } })} rows={2} placeholder="How will success be measured?" style={ta} />
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => addToWp(wi, "milestones", newMilestone())} style={addBtn}>+ Add milestone</button>
                      </div>
                    </div>

                    {/* Budget Breakdown */}
                    <div>
                      <label style={lbl}>Budget Breakdown</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        {wp.budgetBreakdown.map((r, ri) => (
                          <div key={ri} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 1fr) minmax(120px, 1fr) 72px 92px 92px auto", gap: "0.35rem", alignItems: "center", minWidth: 620 }}>
                            <input value={r.costCategory} onChange={e => updateBudgetRow(wi, ri, { costCategory: e.target.value })} placeholder="Category" style={inp} />
                            <input value={r.name} onChange={e => updateBudgetRow(wi, ri, { name: e.target.value })} placeholder="Item" style={inp} />
                            <input type="number" min="0" value={r.quantity} onChange={e => updateBudgetRow(wi, ri, { quantity: e.target.value })} placeholder="Qty" style={inp} />
                            <input type="number" min="0" value={r.unitPrice} onChange={e => updateBudgetRow(wi, ri, { unitPrice: e.target.value })} placeholder="Unit ₳" style={inp} />
                            <input value={r.total} readOnly placeholder="Total" style={{ ...inp, background: "var(--panel)", color: "var(--text-muted)" }} />
                            <button type="button" onClick={() => removeFromWp(wi, "budgetBreakdown", ri)} style={remBtn}>✕</button>
                          </div>
                        ))}
                        {wp.budgetBreakdown.length > 0 && (
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "right", paddingRight: "2rem" }}>
                            Total: ₳ {wp.budgetBreakdown.reduce((s, r) => s + (Number(r.total) || 0), 0).toLocaleString()}
                          </div>
                        )}
                        <button type="button" onClick={() => addToWp(wi, "budgetBreakdown", newBudgetRow())} style={addBtn}>+ Add budget item</button>
                      </div>
                    </div>

                    {/* Success Metrics */}
                    <div>
                      <label style={lbl}>Expected Value</label>
                      <textarea value={wp.expectedValue} onChange={e => updateWp(wi, { expectedValue: e.target.value })} rows={2} placeholder="What value does this work package deliver?" style={ta} />
                    </div>
                    <div>
                      <label style={lbl}>Success Metrics</label>
                      <textarea value={wp.metric} onChange={e => updateWp(wi, { metric: e.target.value })} rows={2} placeholder="How will success be measured?" style={ta} />
                    </div>

                    {/* WP Supporting Docs */}
                    <div>
                      <label style={lbl}>Supporting Documents</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {wp.supportingDocuments.map((l, li) => (
                          <div key={li} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                            <input value={l.title} onChange={e => updateWpObj(wi, "supportingDocuments", { i: li, v: { title: e.target.value } })} placeholder="Label" style={{ ...inp, width: 120, flexShrink: 0 }} />
                            <input value={l.url} onChange={e => updateWpObj(wi, "supportingDocuments", { i: li, v: { url: e.target.value } })} placeholder="https://…" style={inp} />
                            <button type="button" onClick={() => removeFromWp(wi, "supportingDocuments", li)} style={remBtn}>✕</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addToWp(wi, "supportingDocuments", newLink())} style={addBtn}>+ Add document</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setWorkPackages(wps => [...wps, newWp()])} style={{ ...addBtn, padding: "0.5rem", width: "100%" }}>
                + Add Work Package
              </button>
              </FormSection>

              {/* ── Donation & Legal ──────────────────────────────────── */}
              <FormSection id="donation" number="9" title="Treasury Donation" order={9}>
              <p style={{ margin: "0 0 0.75rem", color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.55 }}>
                A voluntary donation to the Cardano Treasury may be made to support the ecosystem. If you have made a donation, please provide the transaction hash below.
              </p>
              <div>
                <label style={lbl}>Donation Transaction Hash</label>
                <input value={donationHash} onChange={e => setDonationHash(e.target.value)} placeholder="Transaction hash, if applicable" style={inp} />
              </div>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                <input type="checkbox" checked={donationConfirmed} onChange={e => setDonationConfirmed(e.target.checked)} style={{ marginTop: "0.15rem" }} />
                I confirm that the donation transaction has been submitted to the Cardano blockchain.
              </label>
              </FormSection>
              <FormSection id="legal" number="10" title="Legal Declarations" order={10}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", color: "var(--text-muted)", fontSize: "0.76rem", lineHeight: 1.6 }}>
                {[
                  ["Data Protection", "The proposer acknowledges and consents that the data submitted within this proposal form may be shared with relevant stakeholders as required for the purposes of evaluation, DRep voting, contracting, and treasury withdrawal execution. The proposer confirms they have the right to share any personal or organizational data included in this submission."],
                  ["Anti-Bribery and Anti-Corruption", "The proposer confirms that no bribes, improper payments, kickbacks, or other inducements have been offered or received in connection with this proposal, and that the proposal is submitted in full compliance with applicable anti-bribery and anti-corruption laws."],
                  ["Proposal Authenticity and Intellectual Property", "The proposer confirms that this proposal is original, that the information provided is accurate to the best of their knowledge and belief, and that the execution of the proposed work will not infringe the intellectual property rights of any third party."],
                  ["Conflicts with Existing Obligations", "The proposer confirms that entering into any contract arising from this proposal would not violate or conflict with any existing obligations, agreements, or duties owed to any other party."],
                  ["Compliance with Laws and Regulations", "The proposer confirms compliance with all applicable local, national, and international laws and regulations relevant to the proposed activities, including but not limited to export control laws, data protection regulations, and applicable financial regulations."],
                  ["Sanctions / Restricted Parties", "The proposer confirms that neither the proposing entity nor any of its principals, beneficial owners, employees, or subcontractors engaged in this proposal are subject to any sanctions administered by relevant authorities, including but not limited to OFAC, EU, UN, or UK sanctions lists."],
                  ["No Contract Formation / Limitation of Liability", "The submission of this proposal does not create any binding obligation or entitlement to an award of contract or funding. Intersect and the Cardano community reserve the right to accept or reject any proposal at their sole discretion without liability."],
                ].map(([t, text], i) => (
                  <p key={t} style={{ margin: 0 }}><strong style={{ color: "var(--text)" }}>{i + 1}. {t}</strong><br />{text}</p>
                ))}
              </div>
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "0.85rem" }}>
                <p style={{ margin: "0 0 0.65rem", fontWeight: 700, fontSize: "0.85rem", color: "var(--text)" }}>Declaration of Submitter</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.65rem" }}>
                  <div>
                    <label style={lbl}>Full Name *</label>
                    <input value={declName} onChange={e => setDeclName(e.target.value)} placeholder="Full name of submitter" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Email Address *</label>
                    <input type="email" value={declEmail} onChange={e => setDeclEmail(e.target.value)} placeholder="name@example.com" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Role / Capacity *</label>
                    <input value={declRole} onChange={e => setDeclRole(e.target.value)} placeholder="e.g. Director, Founder, Representative" style={inp} />
                  </div>
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                <input type="checkbox" checked={legalAuth1} onChange={e => setLegalAuth1(e.target.checked)} style={{ marginTop: "0.15rem" }} />
                I confirm that I am duly authorized to submit this proposal on behalf of the proposing entity, and that the entity is legally permitted to enter into agreements in connection with this proposal.
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                <input type="checkbox" checked={legalAuth2} onChange={e => setLegalAuth2(e.target.checked)} style={{ marginTop: "0.15rem" }} />
                I confirm that all information provided in this submission is true, accurate, and complete to the best of my knowledge, and I accept the declarations set out above.
              </label>
              </FormSection>

              {(submitError || draftSaved) && (
                <div className={isPage ? "ekk-submit-status" : undefined} style={{ order: 11 }}>
                  {submitError && <p style={{ color: "var(--red, #f87171)", fontSize: "0.82rem", margin: 0 }}>{submitError}</p>}
                  {draftSaved && <p style={{ color: "var(--accent)", fontSize: "0.82rem", margin: 0 }}>Draft saved.</p>}
                </div>
              )}

              <div className={isPage ? "ekk-submit-actions" : undefined} style={{
                position: isPage ? "sticky" : "static",
                bottom: 0,
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem", flexWrap: "wrap",
                padding: "0.9rem 0",
                borderTop: "1px solid var(--line)",
                background: "color-mix(in srgb, var(--bg) 94%, transparent)",
                backdropFilter: "blur(8px)",
                zIndex: 2,
                order: 11,
              }}>
                <button type="button" onClick={handleSaveDraft} disabled={draftSaving || submitting}
                  className="btn-outline" style={{ fontWeight: 600, padding: "0.5rem 1.25rem" }}>
                  {draftSaving ? "Saving..." : "Save Draft"}
                </button>
                <button type="submit" disabled={submitting || !title.trim() || !summary.trim()}
                  className="btn-outline" style={{ fontWeight: 600, padding: "0.5rem 1.25rem" }}>
                  {submitting ? "Submitting..." : "Submit Proposal"}
                </button>
              </div>
            </form>
          )}
        </div>
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

function InlineVoteSection({ proposalId, voteState }) {
  if (!voteState) return null;
  const { authed, authLoading, authError, vote, onVote, onAuth } = voteState;
  const voteColor = vote === "yes" ? "var(--green, #4ade80)" : vote === "no" ? "var(--red, #f87171)" : vote === "abstain" ? "var(--text-muted)" : null;
  return (
    <div style={{
      border: "1px solid var(--line)", borderRadius: 10, padding: "0.9rem 1rem",
      background: "var(--panel)", marginBottom: "1.25rem",
      display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.75rem",
    }}>
      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", minWidth: 80 }}>Your vote</span>
      {authed ? (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {["yes", "no", "abstain"].map(v => {
            const active = vote === v;
            const c = v === "yes" ? "var(--green, #4ade80)" : v === "no" ? "var(--red, #f87171)" : "var(--text-muted)";
            return (
              <button key={v} onClick={() => onVote(proposalId, v)}
                style={{
                  padding: "0.3rem 0.9rem", borderRadius: 7, fontSize: "0.8rem", fontWeight: 600,
                  cursor: "pointer", textTransform: "capitalize",
                  border: `1px solid ${active ? c : "var(--line)"}`,
                  background: active ? `color-mix(in srgb, ${c} 15%, transparent)` : "transparent",
                  color: active ? c : "var(--text-muted)", transition: "all 0.12s",
                }}>{v}</button>
            );
          })}
        </div>
      ) : (
        <button onClick={onAuth} disabled={authLoading}
          style={{
            padding: "0.3rem 0.9rem", borderRadius: 7, fontSize: "0.8rem", fontWeight: 600,
            cursor: authLoading ? "default" : "pointer",
            border: "1px solid var(--line)", background: "transparent", color: "var(--text-muted)",
          }}
        >
          {authLoading ? "Signing in…" : "Sign in with wallet to vote"}
        </button>
      )}
      {vote && (
        <span style={{
          fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.65rem", borderRadius: 20,
          background: `color-mix(in srgb, ${voteColor} 15%, transparent)`,
          border: `1px solid color-mix(in srgb, ${voteColor} 40%, transparent)`,
          color: voteColor, textTransform: "capitalize",
        }}>
          {vote === "yes" ? "✓ Yes" : vote === "no" ? "✗ No" : "— Abstain"}
        </span>
      )}
      {authError && <span style={{ fontSize: "0.75rem", color: "var(--red, #f87171)" }}>{authError}</span>}
    </div>
  );
}

function ProposalDetail({ proposal, cycleName, pillarById, onBack, walletApi, walletRewardAddress, commentCount, basePath, voteState }) {
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
      <KeyDetailsCard proposal={d} />

      {/* Vote section — top */}
      <InlineVoteSection proposalId={d._id} voteState={voteState} />

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

      {/* Vote section — bottom */}
      <InlineVoteSection proposalId={d._id} voteState={voteState} />

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

function ProposalCard({ proposal, pillarById, onClick, voteState }) {
  // voteState = { authed, authLoading, vote, onVote, onAuth } — optional, omit to hide voting
  const p = proposal;
  const md = p.metaData || {};
  const pillarIds = (md.strategyFramework?.pillars || []).slice(0, 2);
  const pillarNames = pillarIds.map(id => {
    const title = pillarById[id]?.title || "";
    return title.replace(/^Pillar\s*\d+:\s*/i, "") || title;
  }).filter(Boolean);

  const wpsCount = md.proposalDetails?.workPackages?.length || 0;
  const [hovered, setHovered] = useState(false);

  const vote = voteState?.vote;
  const voteColor = vote === "yes" ? "var(--green, #4ade80)" : vote === "no" ? "var(--red, #f87171)" : vote === "abstain" ? "var(--text-muted)" : null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onClick?.(); }}
      style={{
        width: "100%", textAlign: "left", cursor: "pointer",
        background: "var(--panel)",
        border: `1px solid ${voteColor ? voteColor : hovered ? "var(--accent, #5eead4)" : "var(--line)"}`,
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
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexShrink: 0 }}>
          {vote && (
            <span style={{
              fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.55rem", borderRadius: 20,
              background: `color-mix(in srgb, ${voteColor} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${voteColor} 40%, transparent)`,
              color: voteColor, textTransform: "capitalize",
            }}>{vote}</span>
          )}
          {p.status && <span className={`pill ${statusPillClass(p.status)}`} style={{ fontSize: "0.7rem" }}>{p.status}</span>}
        </div>
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

      {/* Inline vote buttons */}
      {voteState && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap",
            paddingTop: "0.5rem", borderTop: "1px solid var(--line)", marginTop: "0.1rem",
          }}
        >
          {voteState.authed ? (
            <>
              {["yes", "no", "abstain"].map(v => {
                const active = vote === v;
                const c = v === "yes" ? "var(--green, #4ade80)" : v === "no" ? "var(--red, #f87171)" : "var(--text-muted)";
                return (
                  <button key={v} onClick={() => voteState.onVote(p._id, v)}
                    style={{
                      padding: "0.25rem 0.75rem", borderRadius: 7, fontSize: "0.75rem", fontWeight: 600,
                      cursor: "pointer", textTransform: "capitalize",
                      border: `1px solid ${active ? c : "var(--line)"}`,
                      background: active ? `color-mix(in srgb, ${c} 15%, transparent)` : "transparent",
                      color: active ? c : "var(--text-muted)", transition: "all 0.12s",
                    }}>{v}</button>
                );
              })}
            </>
          ) : (
            <button
              onClick={() => voteState.onAuth?.()}
              disabled={voteState.authLoading}
              style={{
                padding: "0.25rem 0.75rem", borderRadius: 7, fontSize: "0.75rem", fontWeight: 600,
                cursor: "pointer", border: "1px solid var(--line)", background: "transparent",
                color: "var(--text-muted)", transition: "all 0.12s",
              }}
            >
              {voteState.authLoading ? "Signing in…" : "Sign in to vote"}
            </button>
          )}
        </div>
      )}
    </div>
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

function BudgetExplorer({ allProposals, pillarById, filterPillar, setFilterPillar, setSearch }) {
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

export function EkklesiaSubmitPage({ voteSlug = "cardano-budget-2026", basePath = "/budget" } = {}) {
  const { walletApi, walletRewardAddress } = useContext(WalletContext) || {};
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const [cycle, setCycle] = useState(null);
  const [cycleLoading, setCycleLoading] = useState(true);
  const [cycleError, setCycleError] = useState("");
  const [initialData, setInitialData] = useState(null);
  const [proposalLoading, setProposalLoading] = useState(Boolean(proposalId));
  const [proposalError, setProposalError] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    setCycleLoading(true);
    setCycleError("");
    apiFetch("/votes", { signal: ctrl.signal })
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        const match = list.find(v => v.slug === voteSlug);
        if (match) setCycle(match);
        else setCycleError(`Vote cycle "${voteSlug}" not found.`);
      })
      .catch(e => { if (e.name !== "AbortError") setCycleError(e.message || "Failed to load vote cycle."); })
      .finally(() => setCycleLoading(false));
    return () => ctrl.abort();
  }, [voteSlug]);

  useEffect(() => {
    if (!proposalId) {
      setInitialData(null);
      setProposalLoading(false);
      setProposalError("");
      return;
    }
    const ctrl = new AbortController();
    setProposalLoading(true);
    setProposalError("");
    apiFetch(`/proposals/${proposalId}`, { signal: ctrl.signal })
      .then(data => setInitialData(data?.data ?? data))
      .catch(e => { if (e.name !== "AbortError") setProposalError(e.message || "Failed to load proposal draft."); })
      .finally(() => setProposalLoading(false));
    return () => ctrl.abort();
  }, [proposalId]);

  const cycleName = cycle?.description || cycle?.title || "Cardano Budget 2026";
  useSeoMeta({
    title: proposalId ? `Edit Proposal - ${cycleName}` : `Submit Proposal - ${cycleName}`,
    description: `Create or edit a ${cycleName} proposal draft through the Ekklesia budget API.`
  });

  const goBack = () => navigate(basePath);

  return (
    <main className="shell ekk-submit-page" style={{ padding: "1.15rem 1rem 2.5rem", maxWidth: 1180, margin: "0 auto" }}>
      <header className="ekk-submit-head" style={{
        marginBottom: "1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
      }}>
        <div>
        <button
          type="button"
          onClick={goBack}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.35rem",
            background: "transparent", border: "none", cursor: "pointer",
            color: "var(--text-muted)", fontSize: "0.83rem", padding: "0 0 0.8rem",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Budget proposals
        </button>
        <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          {proposalId ? "Edit Proposal" : "Submit a Proposal"}
        </h1>
        <p style={{ margin: "0.45rem 0 0", color: "var(--text-muted)", fontSize: "0.86rem" }}>
          {cycleName}
        </p>
        </div>
        <div style={{
          border: "1px solid var(--line)",
          borderRadius: 8,
          background: "color-mix(in srgb, var(--panel) 80%, var(--bg) 20%)",
          padding: "0.65rem 0.8rem",
          minWidth: 190,
        }}>
          <p style={{ margin: "0 0 0.18rem", color: "var(--text-muted)", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 800 }}>Mode</p>
          <p style={{ margin: 0, fontSize: "0.84rem", fontWeight: 700 }}>{proposalId ? "Editing draft" : "New draft"}</p>
        </div>
      </header>

      {cycleLoading || proposalLoading ? (
        <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", padding: "2rem", textAlign: "center" }}>
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>Loading submission form...</p>
        </div>
      ) : cycleError || proposalError ? (
        <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", padding: "1rem" }}>
          <p style={{ color: "var(--red, #f87171)", fontSize: "0.85rem", margin: 0 }}>{cycleError || proposalError}</p>
        </div>
      ) : (
        <SubmitProposalModal
          variant="page"
          cycle={cycle}
          pillars={cycle?.metaData?.strategyFramework?.pillars ?? []}
          walletApi={walletApi}
          walletRewardAddress={walletRewardAddress}
          initialData={initialData}
          onClose={goBack}
          onSuccess={goBack}
        />
      )}
    </main>
  );
}

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
  const [filterVote, setFilterVote] = useState(""); // "" | "voted" | "not_voted"
  const [sort, setSort] = useState("submittedAt");

  // ── Voting state ────────────────────────────────────────────────────────────
  const [ballot, setBallot] = useState(null);
  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [pending, setPending] = useState({});    // { [proposalId]: "yes"|"no"|"abstain" } — staged, not yet submitted
  const [confirmed, setConfirmed] = useState({}); // { [proposalId]: "yes"|"no"|"abstain" } — submitted to Hydra
  const [submitState, setSubmitState] = useState("idle"); // "idle"|"drafting"|"signing"|"submitting"|"done"|"error"
  const [submitError, setSubmitError] = useState("");

  const [selected, setSelected] = useState(null);
  const [detailFull, setDetailFull] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [myProposalsOpen, setMyProposalsOpen] = useState(false);

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
  }, [voteSlug]);

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

  // ── Ballot fetch (v1) ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!cycle) return;
    const urlId = cycle.votingUrl?.split("/ballots/")[1]?.split(/[/?#]/)[0];
    const fetchBallot = (id) =>
      apiFetchV1(`/ballots/${id}`)
        .then(data => { const b = data?.data ?? data; setBallot(b); })
        .catch(() => setBallot({ id }));
    if (urlId) { fetchBallot(urlId); return; }
    apiFetchV1(`/ballots?status=live&limit=50`)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        const match = list.find(b =>
          b.slug === voteSlug ||
          (b.title || "").toLowerCase().includes("budget 2026")
        ) || list[0];
        if (match) fetchBallot(match.id || match._id);
      })
      .catch(() => {});
  }, [cycle, voteSlug]);

  // proposalId → v1 questionId (matched by title)
  const proposalToQuestionId = useMemo(() => {
    const questions = ballot?.hydra?.ballot?.questions ?? [];
    if (!questions.length) return {};
    const byTitle = {};
    for (const q of questions) byTitle[q.question] = q.questionId;
    const map = {};
    for (const p of allProposals) {
      const qId = byTitle[p.title];
      if (qId) map[p._id] = qId;
    }
    return map;
  }, [allProposals, ballot]);

  // reverse: questionId → proposalId
  const questionToProposalId = useMemo(() =>
    Object.fromEntries(Object.entries(proposalToQuestionId).map(([pid, qid]) => [qid, pid]))
  , [proposalToQuestionId]);

  // Load previously submitted votes once authed + mapping ready
  useEffect(() => {
    if (!authed || !ballot?.id || !Object.keys(questionToProposalId).length) return;
    apiFetchV1(`/votes/${ballot.id}/mine`)
      .then(data => {
        const votesMap = data?.confirmed?.votes ?? data?.data?.confirmed?.votes ?? {};
        const resolved = {};
        for (const [qId, v] of Object.entries(votesMap)) {
          const proposalId = questionToProposalId[qId];
          if (!proposalId) continue;
          resolved[proposalId] = v.abstain ? "abstain" : v.selection?.[0] === 1 ? "yes" : v.selection?.[0] === 2 ? "no" : "abstain";
        }
        setConfirmed(resolved);
      })
      .catch(() => {});
  }, [authed, ballot?.id, questionToProposalId]);

  // ── Vote auth ───────────────────────────────────────────────────────────────
  const signerAddress = walletRewardAddress || "";
  const signType = getSignerType(walletRewardAddress || "");
  const signingAddress = walletRewardAddress || "";

  async function handleAuth() {
    if (!walletApi || !signerAddress) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      const fetchSession = async (method, body) => {
        const r = await fetch(`${API_V1_BASE}/api/v0/session`, {
          method, credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          let msg;
          try { const j = await r.json(); msg = j?.message || j?.error || r.statusText; } catch { msg = r.statusText; }
          throw new Error(`${r.status} — ${msg}`);
        }
        return method === "POST" ? r.json() : null;
      };
      const nonceRes = await fetchSession("POST", { signerAddress, signType });
      const dataHex = nonceRes?.dataHex ?? nonceRes?.data?.dataHex;
      const nonce = nonceRes?.nonce ?? nonceRes?.data?.nonce;
      const payloadHex = dataHex || (nonce ? strToHex(nonce) : "");
      if (!payloadHex) throw new Error("No nonce returned from server.");
      const signature = await walletApi.signData(payloadHex, signingAddress, false);
      await fetchSession("PUT", { signerAddress, signature, signType });
      setAuthed(true);
    } catch (e) {
      setAuthError(e.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  function effectiveVote(proposalId) {
    return pending[proposalId] ?? (typeof confirmed[proposalId] === "string" ? confirmed[proposalId] : undefined);
  }

  function handleSelectVote(proposalId, choice) {
    if (!authed) {
      // Trigger auth, then stage the vote after success
      handleAuth().then(() => {
        // authed state updates async; stage immediately anyway
        setPending(p => ({ ...p, [proposalId]: choice }));
      });
      return;
    }
    setPending(p => ({ ...p, [proposalId]: choice }));
  }

  async function handleSubmitVotes() {
    if (!ballot?.id) { setSubmitError("Ballot ID not found."); return; }
    if (!Object.keys(pending).length) return;
    setSubmitState("drafting");
    setSubmitError("");
    try {
      const toVoteEntry = (questionId, choice) =>
        choice === "abstain" ? { questionId, abstain: true } : { questionId, selection: [choice === "yes" ? 1 : 2] };
      const allVotes = [];
      for (const [pid, choice] of Object.entries(confirmed)) {
        if (typeof choice !== "string" || pending[pid] !== undefined) continue;
        const qId = proposalToQuestionId[pid];
        if (qId) allVotes.push(toVoteEntry(qId, choice));
      }
      for (const [pid, choice] of Object.entries(pending)) {
        const qId = proposalToQuestionId[pid];
        if (qId) allVotes.push(toVoteEntry(qId, choice));
      }
      const draft = await apiFetchV1(`/votes/${ballot.id}/draft`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votes: allVotes }),
      });
      const packageId = draft?.package?.id ?? draft?.packageId;
      const signingPayloadHex = draft?.signingPayloadHex ?? draft?.merkleRoot;
      if (!packageId || !signingPayloadHex) throw new Error("Draft response missing packageId or signing payload.");
      setSubmitState("signing");
      const sigResult = await walletApi.signData(signingPayloadHex, signingAddress, false);
      const coseSign1Hex = sigResult?.signature ?? sigResult;
      const coseKeyHex = sigResult?.key ?? "";
      setSubmitState("submitting");
      await apiFetchV1(`/votes/${ballot.id}/signature`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, witness: { coseSign1Hex, coseKeyHex } }),
      });
      setConfirmed(c => ({ ...c, ...pending }));
      setPending({});
      setSubmitState("done");
      setTimeout(() => setSubmitState("idle"), 4000);
    } catch (e) {
      setSubmitError(e.message || "Vote submission failed.");
      setSubmitState("error");
    }
  }

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
  }, [basePath, navigate]);

  const closeProposal = useCallback(() => {
    setSelected(null);
    setDetailFull(null);
    navigate(basePath, { replace: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [basePath, navigate]);

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
      if (filterVote === "voted" && !effectiveVote(p._id)) return false;
      if (filterVote === "not_voted" && effectiveVote(p._id)) return false;
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
            voteState={ballot && displayDetail?._id ? {
              authed, authLoading, authError,
              vote: effectiveVote(displayDetail._id),
              onVote: handleSelectVote,
              onAuth: handleAuth,
            } : undefined}
          />
        )
      )}

      {/* ── List view ──────────────────────────────────────────────────── */}
      {!selected && (
        <div>
          {/* Page header */}
          <header style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                {cycle?.description || "Intersect Budget Proposals"}
              </h1>
              <button
                onClick={() => navigate(`${basePath}/results`)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.4rem 0.9rem", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600,
                  cursor: "pointer", flexShrink: 0,
                  background: "color-mix(in srgb, var(--accent, #5eead4) 10%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--accent, #5eead4) 35%, transparent)",
                  color: "var(--accent, #5eead4)", transition: "background 0.15s",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <rect x="1" y="7" width="2.5" height="5" rx="0.5" fill="currentColor" />
                  <rect x="5.25" y="4" width="2.5" height="8" rx="0.5" fill="currentColor" />
                  <rect x="9.5" y="1" width="2.5" height="11" rx="0.5" fill="currentColor" />
                </svg>
                View Results
              </button>
            </div>
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
                pillarById={pillarById}
                filterPillar={filterPillar}
                setFilterPillar={setFilterPillar}
                setSearch={setSearch}
              />

              {/* Submit notice — shown during submission window */}
              {cycle?.submissionStartDate && new Date() <= new Date(cycle.submissionEndDate || cycle.submissionStartDate) && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.6rem",
                  padding: "0.65rem 1rem", marginBottom: "1rem",
                  background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10,
                  fontSize: "0.8rem", color: "var(--text-muted)",
                }}>
                  <span>{walletApi ? "Ready to submit your proposal?" : "Want to submit a proposal? Connect your wallet first."}</span>
                  <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                    <button
                      onClick={() => navigate(`${basePath}/submit`)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "0.35rem",
                        padding: "0.35rem 0.75rem", borderRadius: 7, fontSize: "0.78rem", fontWeight: 600,
                        background: "color-mix(in srgb, var(--accent) 15%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)",
                        color: "var(--accent)", cursor: "pointer", whiteSpace: "nowrap",
                        transition: "background 0.15s",
                      }}
                    >
                      Submit a Proposal
                    </button>
                    <button
                      onClick={() => setMyProposalsOpen(true)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "0.35rem",
                        padding: "0.35rem 0.75rem", borderRadius: 7, fontSize: "0.78rem", fontWeight: 600,
                        background: "transparent",
                        border: "1px solid var(--line)",
                        color: "var(--text-muted)", cursor: "pointer", whiteSpace: "nowrap",
                      }}
                    >
                      My Proposals
                    </button>
                  </div>
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
                <select value={filterVote} onChange={e => setFilterVote(e.target.value)}
                  style={{ padding: "0.38rem 0.55rem", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: "0.82rem" }}>
                  <option value="">All votes</option>
                  <option value="voted">Voted</option>
                  <option value="not_voted">Not voted</option>
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

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingBottom: Object.keys(pending).length ? "5rem" : 0 }}>
                {proposals.map(p => (
                  <ProposalCard
                    key={p._id}
                    proposal={p}
                    pillarById={pillarById}
                    onClick={() => openProposal(p)}
                    voteState={ballot ? {
                      authed, authLoading,
                      vote: effectiveVote(p._id),
                      onVote: handleSelectVote,
                      onAuth: handleAuth,
                    } : undefined}
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

      {myProposalsOpen && (
        <MyProposalsPanel
          cycle={cycle}
          walletApi={walletApi}
          walletRewardAddress={walletRewardAddress}
          onClose={() => setMyProposalsOpen(false)}
          onEdit={(proposal) => {
            setMyProposalsOpen(false);
            navigate(`${basePath}/submit/${proposal._id}`);
          }}
        />
      )}

      {/* ── Sticky submit bar ─────────────────────────────────────────────── */}
      {Object.keys(pending).length > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          background: "var(--panel)", borderTop: "1px solid var(--line)",
          padding: "0.75rem 1.25rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap",
          backdropFilter: "blur(12px)",
        }}>
          <span style={{ fontSize: "0.83rem", color: "var(--text-muted)" }}>
            {Object.keys(pending).length} unsaved vote{Object.keys(pending).length !== 1 ? "s" : ""} staged
          </span>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {submitState === "done" && (
              <span style={{ fontSize: "0.8rem", color: "var(--green, #4ade80)" }}>✓ Ballot submitted</span>
            )}
            {submitError && (
              <span style={{ fontSize: "0.78rem", color: "var(--red, #f87171)", maxWidth: 320 }}>{submitError}</span>
            )}
            <button
              onClick={() => { setPending({}); setSubmitState("idle"); setSubmitError(""); }}
              style={{
                padding: "0.4rem 0.85rem", borderRadius: 7, fontSize: "0.8rem", fontWeight: 600,
                cursor: "pointer", border: "1px solid var(--line)", background: "transparent", color: "var(--text-muted)",
              }}
            >
              Discard
            </button>
            <button
              onClick={handleSubmitVotes}
              disabled={["drafting", "signing", "submitting"].includes(submitState)}
              style={{
                padding: "0.4rem 1rem", borderRadius: 7, fontSize: "0.8rem", fontWeight: 700,
                cursor: ["drafting", "signing", "submitting"].includes(submitState) ? "default" : "pointer",
                border: "1px solid var(--accent, #5eead4)",
                background: "color-mix(in srgb, var(--accent, #5eead4) 15%, transparent)",
                color: "var(--accent, #5eead4)",
              }}
            >
              {submitState === "drafting" ? "Preparing…" : submitState === "signing" ? "Waiting for signature…" : submitState === "submitting" ? "Submitting…" : "Submit ballot"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Budget Vote Page ─────────────────────────────────────────────────────────

// All budget-vote requests go through ekklesia-vote-proxy → intersect.ekklesia.vote
// (session auth at /api/v0/session and vote API at /api/v1/* share the same cookie jar)
const API_V1_BASE = "/ekklesia-vote-proxy";
const API_V1 = `${API_V1_BASE}/api/v1`;

async function apiFetchV1(path, opts = {}) {
  const res = await fetch(`${API_V1}${path}`, { credentials: "include", ...opts });
  if (!res.ok) {
    let msg;
    try {
      const j = await res.json();
      msg = j?.message || j?.error || res.statusText;
    } catch {
      msg = res.statusText;
    }
    throw new Error(`${res.status} — ${msg}`);
  }
  return res.json();
}

// Resolve yes/no/abstain option IDs from a proposal's voteOptions array.
// Returns { yes: number|null, no: number|null } — abstain uses the `abstain: true` flag in v1.
function resolveOptionIds(voteOptions = []) {
  const find = (...labels) => {
    const l = labels.map(s => s.toLowerCase());
    const match = voteOptions.find(o => l.includes(String(o.label || "").toLowerCase()));
    return match ? match.id : null;
  };
  return {
    yes: find("yes"),
    no: find("no"),
  };
}

function VoteButtons({ proposalId, currentVote, onVote }) {
  const opts = [
    { value: "yes", label: "Yes", color: "var(--green, #4ade80)" },
    { value: "no", label: "No", color: "var(--red, #f87171)" },
    { value: "abstain", label: "Abstain", color: "var(--text-muted)" },
  ];
  return (
    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
      {opts.map(o => {
        const active = currentVote === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onVote(proposalId, o.value)}
            style={{
              padding: "0.3rem 0.85rem", borderRadius: 7, fontSize: "0.78rem", fontWeight: 600,
              cursor: "pointer",
              border: `1px solid ${active ? o.color : "var(--line)"}`,
              background: active ? `color-mix(in srgb, ${o.color} 15%, transparent)` : "transparent",
              color: active ? o.color : "var(--text-muted)",
              transition: "all 0.13s",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function VoteProposalRow({ proposal, pillarById, currentVote, isConfirmed, onVote, authed }) {
  const p = proposal;
  const md = p.metaData || {};
  const pillarIds = (md.strategyFramework?.pillars || []).slice(0, 2);
  const pillarNames = pillarIds.map(id => {
    const title = pillarById[id]?.title || "";
    return title.replace(/^Pillar\s*\d+:\s*/i, "") || title;
  }).filter(Boolean);

  return (
    <div style={{
      border: `1px solid ${currentVote ? "color-mix(in srgb, var(--accent, #5eead4) 25%, var(--line))" : "var(--line)"}`,
      borderRadius: 10, padding: "1rem 1.1rem",
      background: "var(--panel)", display: "flex", flexDirection: "column", gap: "0.5rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 0.2rem", fontWeight: 600, fontSize: "0.92rem", lineHeight: 1.35 }}>{p.title}</p>
          {p.summary && (
            <p style={{
              margin: 0, fontSize: "0.78rem", lineHeight: 1.6, color: "var(--text-muted)",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {p.summary}
            </p>
          )}
        </div>
        {md.totalBudget != null && (
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--accent, #5eead4)", flexShrink: 0 }}>
            {formatAda(md.totalBudget)}
          </span>
        )}
      </div>

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

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        {authed ? (
          <VoteButtons proposalId={p._id} currentVote={currentVote} onVote={onVote} />
        ) : (
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Sign in to vote</span>
        )}
        {isConfirmed && currentVote && (
          <span style={{ fontSize: "0.72rem", color: "var(--accent, #5eead4)" }}>✓ Submitted</span>
        )}
        {!isConfirmed && currentVote && (
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Staged — submit ballot to confirm</span>
        )}
      </div>
    </div>
  );
}

export function BudgetVotePage({ voteSlug = "cardano-budget-2026", basePath = "/budget" } = {}) {
  const { walletApi, walletRewardAddress, walletDrep } = useContext(WalletContext) || {};
  const navigate = useNavigate();

  const [cycle, setCycle] = useState(null);
  const [cycleLoading, setCycleLoading] = useState(true);
  const [cycleError, setCycleError] = useState("");

  const [ballot, setBallot] = useState(null); // v1 ballot object with id, status

  const [allProposals, setAllProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [proposalsError, setProposalsError] = useState("");

  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // pending: staged selections not yet submitted { [proposalId]: "yes" | "no" | "abstain" }
  const [pending, setPending] = useState({});
  // confirmed: votes already submitted & confirmed on Hydra { [questionId]: "yes" | "no" | "abstain" }
  const [confirmed, setConfirmed] = useState({});

  // submit state: "idle" | "drafting" | "signing" | "submitting" | "done" | "error"
  const [submitState, setSubmitState] = useState("idle");
  const [submitError, setSubmitError] = useState("");

  const [search, setSearch] = useState("");
  const [filterVote, setFilterVote] = useState(""); // "" | "unselected" | "yes" | "no" | "abstain"

  useSeoMeta({
    title: "DRep Voting — Cardano Budget 2026",
    description: "Cast your DRep vote on Cardano Budget 2026 proposals via the Ekklesia off-chain voting system.",
  });

  // Fetch v0 cycle (for display / proposal list)
  useEffect(() => {
    const ctrl = new AbortController();
    apiFetch("/votes", { signal: ctrl.signal })
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        const match = list.find(v => v.slug === voteSlug);
        if (match) setCycle(match);
        else setCycleError(`Vote cycle "${voteSlug}" not found.`);
      })
      .catch(e => { if (e.name !== "AbortError") setCycleError(e.message || "Failed to load."); })
      .finally(() => setCycleLoading(false));
    return () => ctrl.abort();
  }, [voteSlug]);

  // Discover v1 ballot ID from the cycle's votingUrl field (e.g. "https://intersect.ekklesia.vote/ballots/<id>")
  useEffect(() => {
    if (!cycle) return;
    const urlId = cycle.votingUrl?.split("/ballots/")[1]?.split(/[/?#]/)[0];
    const fetchBallot = (id) =>
      apiFetchV1(`/ballots/${id}`)
        .then(data => {
          const b = data?.data ?? data;
          setBallot(b);
        })
        .catch(() => setBallot({ id }));
    if (urlId) {
      fetchBallot(urlId);
      return;
    }
    // Fallback: query the v1 ballots list
    apiFetchV1(`/ballots?status=live&limit=50`)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        const match = list.find(b =>
          b.slug === voteSlug ||
          b.externalId === cycle._id ||
          (b.title || "").toLowerCase().includes("budget 2026")
        ) || list[0];
        if (match) fetchBallot(match.id || match._id);
      })
      .catch(() => {});
  }, [cycle, voteSlug]);

  // Fetch all live proposals
  useEffect(() => {
    if (!cycle) return;
    const ctrl = new AbortController();
    setProposalsLoading(true);
    setProposalsError("");
    const PAGE_SIZE = 100;
    let page = 1;
    let all = [];
    async function fetchAll() {
      while (true) {
        const data = await apiFetch(`/proposals?vote=${cycle._id}&status=live&limit=${PAGE_SIZE}&page=${page}`, { signal: ctrl.signal });
        const rows = Array.isArray(data) ? data : (data?.data ?? []);
        all = all.concat(rows);
        const meta = data?.meta;
        if (!meta?.hasNextPage || rows.length < PAGE_SIZE) break;
        page++;
      }
      setAllProposals(all);
    }
    fetchAll()
      .catch(e => { if (e.name !== "AbortError") setProposalsError(e.message || "Failed to load proposals."); })
      .finally(() => setProposalsLoading(false));
    return () => ctrl.abort();
  }, [cycle]);

  // Build proposalId → v1 questionId by matching v0 proposal title to ballot.hydra.ballot.questions[].question
  const proposalToQuestionId = useMemo(() => {
    const questions = ballot?.hydra?.ballot?.questions ?? [];
    if (!questions.length) return {};
    // index by exact title for fast lookup
    const byTitle = {};
    for (const q of questions) byTitle[q.question] = q.questionId;
    const map = {};
    for (const p of allProposals) {
      const qId = byTitle[p.title];
      if (qId) map[p._id] = qId;
    }
    return map;
  }, [allProposals, ballot]);

  // Load my confirmed votes from Hydra once authed + ballotId known
  useEffect(() => {
    if (!authed || !ballot?.id) return;
    async function loadConfirmed() {
      try {
        const data = await apiFetchV1(`/votes/${ballot.id}/mine`);
        // votesMap keyed by questionId which equals v0 proposalId for Hydra ballots
        const votesMap = data?.confirmed?.votes ?? data?.data?.confirmed?.votes ?? {};
        const resolved = {};
        for (const [qId, v] of Object.entries(votesMap)) {
          const label = v.abstain ? "abstain" : v.selection?.[0] === 1 ? "yes" : v.selection?.[0] === 2 ? "no" : "abstain";
          resolved[qId] = label; // qId === proposalId for Hydra ballots
        }
        setConfirmed(resolved);
      } catch {
        // not critical
      }
    }
    loadConfirmed();
  }, [authed, ballot]);


  const now = new Date();
  const isVotingActive = cycle
    ? (now >= new Date(cycle.votingStartDate) && now <= new Date(cycle.votingEndDate))
    : false;

  // Always use the stake address for session auth — CIP-30 wallets sign with stake keys only.
  // The Ekklesia server identifies the DRep from the on-chain link to the stake key.
  const signerAddress = walletRewardAddress || "";
  const signType = getSignerType(walletRewardAddress || "");
  const signingAddress = walletRewardAddress || "";

  async function handleAuth() {
    if (!walletApi || !signerAddress) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      // Session auth uses /api/v0/session on intersect.ekklesia.vote (same host as v1 vote API)
      // so the session cookie is valid for subsequent /api/v1/* calls.
      const fetchSession = async (method, body) => {
        const r = await fetch(`${API_V1_BASE}/api/v0/session`, {
          method, credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          let msg;
          try { const j = await r.json(); msg = j?.message || j?.error || r.statusText; } catch { msg = r.statusText; }
          throw new Error(`${r.status} — ${msg}`);
        }
        return method === "POST" ? r.json() : null;
      };
      const nonceRes = await fetchSession("POST", { signerAddress, signType });
      const dataHex = nonceRes?.dataHex ?? nonceRes?.data?.dataHex;
      const nonce = nonceRes?.nonce ?? nonceRes?.data?.nonce;
      const payloadHex = dataHex || (nonce ? strToHex(nonce) : "");
      if (!payloadHex) throw new Error("No nonce returned from server.");
      // Always sign with the stake key (signingAddress = walletRewardAddress).
      // MeshSDK routes DRep-looking addresses through cip95.signData which is not
      // available on the BrowserWallet instance (it was enabled without CIP-95).
      const signature = await walletApi.signData(payloadHex, signingAddress, false);
      await fetchSession("PUT", { signerAddress, signature, signType });
      setAuthed(true);
    } catch (e) {
      setAuthError(e.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  // Stage a vote selection locally — does not submit until handleSubmitVotes()
  function selectVote(proposalId, choice) {
    setPending(p => ({ ...p, [proposalId]: choice }));
  }

  // Effective vote for a proposal: pending overrides confirmed
  function effectiveVote(proposalId) {
    return pending[proposalId] ?? (typeof confirmed[proposalId] === "string" ? confirmed[proposalId] : undefined);
  }

  // Submit all staged votes in one batch via draft → sign → submit
  async function handleSubmitVotes() {
    if (!ballot?.id) { setSubmitError("Ballot ID not found — cannot submit votes."); return; }
    const pendingIds = Object.keys(pending);
    if (!pendingIds.length) return;

    setSubmitState("drafting");
    setSubmitError("");
    try {
      // Build the votes array: pending selections + confirmed votes not overridden by pending
      // Hydra replaces entirely, so we must include ALL intended votes
      const allVotes = [];

      // v1 ballot uses option 1=Yes, 2=No for all questions
      const toVoteEntry = (questionId, choice) => {
        if (choice === "abstain") return { questionId, abstain: true };
        return { questionId, selection: [choice === "yes" ? 1 : 2] };
      };

      // Start with confirmed votes (keyed by v0 proposalId) — keep unless pending overrides
      for (const [proposalId, choice] of Object.entries(confirmed)) {
        if (typeof choice !== "string") continue;
        if (pending[proposalId] !== undefined) continue;
        const questionId = proposalToQuestionId[proposalId];
        if (questionId) allVotes.push(toVoteEntry(questionId, choice));
      }

      // Add pending selections (keyed by v0 proposalId)
      for (const [proposalId, choice] of Object.entries(pending)) {
        const questionId = proposalToQuestionId[proposalId];
        if (questionId) allVotes.push(toVoteEntry(questionId, choice));
      }

      // Step 1: Draft
      const draft = await apiFetchV1(`/votes/${ballot.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votes: allVotes }),
      });
      const packageId = draft?.package?.id ?? draft?.packageId;
      const signingPayloadHex = draft?.signingPayloadHex ?? draft?.merkleRoot;
      if (!packageId || !signingPayloadHex) throw new Error("Draft response missing packageId or signing payload.");

      // Step 2: Sign
      setSubmitState("signing");
      const sigResult = await walletApi.signData(signingPayloadHex, signingAddress, false);
      const coseSign1Hex = sigResult?.signature ?? sigResult;
      const coseKeyHex = sigResult?.key ?? "";

      // Step 3: Submit signature
      setSubmitState("submitting");
      await apiFetchV1(`/votes/${ballot.id}/signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, witness: { coseSign1Hex, coseKeyHex } }),
      });

      // Merge pending into confirmed
      setConfirmed(c => ({ ...c, ...pending }));
      setPending({});
      setSubmitState("done");
    } catch (e) {
      setSubmitError(e.message || "Vote submission failed.");
      setSubmitState("error");
    }
  }

  const pillars = cycle?.metaData?.strategyFramework?.pillars ?? [];
  const pillarById = Object.fromEntries(pillars.map(p => [p._id, p]));

  const pendingCount = Object.keys(pending).length;
  const confirmedCount = Object.keys(confirmed).filter(k => typeof confirmed[k] === "string").length;
  const yesCount = Object.entries({ ...confirmed, ...pending }).filter(([, v]) => v === "yes").length;
  const noCount = Object.entries({ ...confirmed, ...pending }).filter(([, v]) => v === "no").length;
  const abstainCount = Object.entries({ ...confirmed, ...pending }).filter(([, v]) => v === "abstain").length;

  const filtered = allProposals.filter(p => {
    const ev = effectiveVote(p._id);
    if (filterVote === "unselected" && ev) return false;
    if (filterVote === "yes" && ev !== "yes") return false;
    if (filterVote === "no" && ev !== "no") return false;
    if (filterVote === "abstain" && ev !== "abstain") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (p.title || "").toLowerCase().includes(q) ||
        (p.summary || "").toLowerCase().includes(q) ||
        (p.metaData?.proposerDetails?.name || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const isSubmitting = ["drafting", "signing", "submitting"].includes(submitState);
  const submitLabel = { drafting: "Preparing ballot…", signing: "Waiting for signature…", submitting: "Submitting…" }[submitState] || "Submit ballot";

  return (
    <main className="shell" style={{ padding: "1.5rem 1rem", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          onClick={() => navigate(basePath)}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.35rem",
            background: "transparent", border: "none", cursor: "pointer",
            color: "var(--text-muted)", fontSize: "0.83rem", padding: "0 0 1rem",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to proposals
        </button>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          DRep Voting
        </h1>
        <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
          {cycle?.description || "Cardano Budget 2026"} — select your votes below, then submit them all at once
        </p>
        {cycleLoading && <p className="muted" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>Loading cycle…</p>}
        {cycleError && <p style={{ fontSize: "0.85rem", color: "var(--red, #f87171)", marginTop: "0.5rem" }}>{cycleError}</p>}
        {cycle && (
          <div style={{ marginTop: "0.75rem" }}>
            <CycleTimeline cycle={cycle} />
          </div>
        )}
      </div>

      {/* Voting phase warning */}
      {cycle && !isVotingActive && (
        <div style={{
          padding: "0.75rem 1rem", marginBottom: "1.25rem",
          background: "color-mix(in srgb, var(--yellow, #fbbf24) 8%, var(--panel))",
          border: "1px solid color-mix(in srgb, var(--yellow, #fbbf24) 30%, transparent)",
          borderRadius: 10, fontSize: "0.83rem", color: "var(--text-muted)",
        }}>
          {now < new Date(cycle.votingStartDate)
            ? `Voting opens ${formatDate(cycle.votingStartDate)} — come back then to cast your votes.`
            : `Voting closed ${formatDate(cycle.votingEndDate)}.`
          }
        </div>
      )}

      {/* Auth panel */}
      <div style={{
        border: "1px solid var(--line)", borderRadius: 10, padding: "0.9rem 1rem",
        background: "var(--panel)", marginBottom: "1.25rem",
      }}>
        {!walletApi && (
          <p className="muted" style={{ fontSize: "0.84rem", margin: 0 }}>
            Connect your wallet using the button in the top bar to vote.
          </p>
        )}
        {walletApi && !authed && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 0.2rem", fontWeight: 600, fontSize: "0.88rem" }}>
                {signType === "drep" ? "Sign in with your DRep key" : "Sign in with your wallet"}
              </p>
              <p className="muted" style={{ fontSize: "0.8rem", margin: 0 }}>
                {signType === "drep"
                  ? `Voting as DRep: ${signerAddress.slice(0, 20)}…`
                  : "No DRep credential detected. You can still sign in as a stake address."}
              </p>
            </div>
            <button onClick={handleAuth} disabled={authLoading} className="btn-outline" style={{ fontSize: "0.82rem" }}>
              {authLoading ? "Signing…" : "Sign in"}
            </button>
            {authError && <span style={{ fontSize: "0.8rem", color: "var(--red, #f87171)", width: "100%" }}>{authError}</span>}
          </div>
        )}
        {walletApi && authed && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.84rem", color: "var(--accent, #5eead4)", fontWeight: 600 }}>
              ✓ Signed in
            </span>
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              {signerAddress.slice(0, 24)}…
            </span>
          </div>
        )}
      </div>

      {/* Ballot summary + submit */}
      {authed && allProposals.length > 0 && (
        <div style={{
          border: "1px solid var(--line)", borderRadius: 10, padding: "0.9rem 1rem",
          background: "var(--panel)", marginBottom: "1.25rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem",
        }}>
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", fontSize: "0.82rem" }}>
            {[
              { label: "Selected", val: `${pendingCount + confirmedCount} / ${allProposals.length}`, muted: false },
              { label: "Pending submission", val: pendingCount, muted: pendingCount === 0 },
              { label: "Confirmed", val: confirmedCount, muted: confirmedCount === 0 },
              { label: "Yes", val: yesCount },
              { label: "No", val: noCount },
              { label: "Abstain", val: abstainCount },
            ].map(({ label, val, muted }) => (
              <div key={label}>
                <span style={{ color: "var(--text-muted)", marginRight: "0.3rem" }}>{label}:</span>
                <span style={{ fontWeight: 700, color: muted ? "var(--text-muted)" : "var(--text)" }}>{val}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
            <button
              onClick={handleSubmitVotes}
              disabled={isSubmitting || pendingCount === 0}
              style={{
                padding: "0.45rem 1.1rem", borderRadius: 8, fontSize: "0.83rem", fontWeight: 600,
                background: pendingCount > 0 && !isSubmitting
                  ? "color-mix(in srgb, var(--accent, #5eead4) 18%, transparent)"
                  : "transparent",
                border: `1px solid ${pendingCount > 0 && !isSubmitting ? "var(--accent, #5eead4)" : "var(--line)"}`,
                color: pendingCount > 0 && !isSubmitting ? "var(--accent, #5eead4)" : "var(--text-muted)",
                cursor: isSubmitting || pendingCount === 0 ? "default" : "pointer",
                transition: "all 0.13s",
              }}
            >
              {isSubmitting ? submitLabel : `Submit ${pendingCount} vote${pendingCount !== 1 ? "s" : ""}`}
            </button>
            {submitState === "done" && (
              <span style={{ fontSize: "0.75rem", color: "var(--accent, #5eead4)" }}>✓ Ballot submitted</span>
            )}
            {submitError && (
              <span style={{ fontSize: "0.75rem", color: "var(--red, #f87171)", maxWidth: 260, textAlign: "right" }}>{submitError}</span>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: "flex", gap: "0.5rem", flexWrap: "wrap",
        padding: "0.7rem 0.85rem", marginBottom: "0.9rem",
        background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10,
      }}>
        <input
          type="search" placeholder="Search proposals…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: "1 1 180px", padding: "0.38rem 0.65rem", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: "0.82rem" }}
        />
        <select
          value={filterVote} onChange={e => setFilterVote(e.target.value)}
          style={{ padding: "0.38rem 0.55rem", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: "0.82rem" }}
        >
          <option value="">All proposals</option>
          <option value="unselected">Not yet selected</option>
          <option value="yes">Selected Yes</option>
          <option value="no">Selected No</option>
          <option value="abstain">Selected Abstain</option>
        </select>
      </div>

      {proposalsError && (
        <p style={{ fontSize: "0.83rem", color: "var(--red, #f87171)", marginBottom: "0.75rem" }}>{proposalsError}</p>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
        <h2 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>Live proposals</h2>
        <span className="muted" style={{ fontSize: "0.78rem" }}>
          {proposalsLoading ? "Loading…" : `${filtered.length}${filtered.length !== allProposals.length ? ` of ${allProposals.length}` : ""} proposals`}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtered.map(p => (
          <VoteProposalRow
            key={p._id}
            proposal={p}
            pillarById={pillarById}
            currentVote={effectiveVote(p._id)}
            isConfirmed={typeof confirmed[p._id] === "string" && pending[p._id] === undefined}
            onVote={selectVote}
            authed={authed}
          />
        ))}
        {!proposalsLoading && filtered.length === 0 && !proposalsError && (
          <p className="muted" style={{ fontSize: "0.83rem", margin: "1rem 0" }}>
            {allProposals.length === 0 ? "No live proposals found." : "No proposals match your filters."}
          </p>
        )}
      </div>
    </main>
  );
}

// ─── Budget Results Page ──────────────────────────────────────────────────────

export function BudgetResultsPage({ voteSlug = "cardano-budget-2026", basePath = "/budget" } = {}) {
  const navigate = useNavigate();

  const [cycle, setCycle] = useState(null);
  const [ballot, setBallot] = useState(null);
  const [allProposals, setAllProposals] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("yes_desc");

  useSeoMeta({
    title: "Preliminary Results — Cardano Budget 2026",
    description: "Preliminary DRep voting results for Cardano Budget 2026 proposals.",
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    apiFetch("/votes")
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        const match = list.find(v => v.slug === voteSlug) || list[0];
        if (!match) throw new Error(`Vote cycle "${voteSlug}" not found.`);
        return match;
      })
      .then(async (c) => {
        if (cancelled) return;
        setCycle(c);

        const urlId = c.votingUrl?.split("/ballots/")[1]?.split(/[/?#]/)[0];
        let ballotObj = null;
        if (urlId) {
          try {
            const bd = await apiFetchV1(`/ballots/${urlId}`);
            ballotObj = bd?.data ?? bd;
          } catch {
            ballotObj = { id: urlId };
          }
        }
        if (!cancelled) setBallot(ballotObj);

        const ballotId = ballotObj?.id ?? urlId;

        const [proposalResult, resultsResult] = await Promise.allSettled([
          (async () => {
            const PAGE_SIZE = 100;
            let page = 1, all = [];
            while (true) {
              const d = await apiFetch(`/proposals?vote=${c._id}&limit=${PAGE_SIZE}&page=${page}`);
              const rows = Array.isArray(d) ? d : (d?.data ?? []);
              all = all.concat(rows);
              if (!d?.meta?.hasNextPage || rows.length < PAGE_SIZE) break;
              page++;
            }
            return all;
          })(),
          ballotId
            ? apiFetchV1(`/results/ballot/${ballotId}`)
            : Promise.resolve(null),
        ]);

        if (cancelled) return;
        if (proposalResult.status === "fulfilled") setAllProposals(proposalResult.value);
        if (resultsResult.status === "fulfilled" && resultsResult.value) {
          setResults(resultsResult.value);
        } else {
          setError("Results not yet available for this ballot.");
        }
      })
      .catch(e => { if (!cancelled) setError(e.message || "Failed to load."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [voteSlug]);

  // results from /api/v1/results/ballot/{id} is an array of per-question result objects.
  // Each item's .proposalId is the v1 questionId.
  const resultsByQuestionId = useMemo(() => {
    const arr = results?.data ?? (Array.isArray(results) ? results : []);
    return Object.fromEntries(arr.map(r => [r.proposalId, r]));
  }, [results]);

  // Map v1 questionId → v0 proposalId by matching titles
  const questionToProposalId = useMemo(() => {
    const questions = ballot?.hydra?.ballot?.questions ?? [];
    const byTitle = Object.fromEntries(questions.map(q => [q.question, q.questionId]));
    const map = {};
    for (const p of allProposals) {
      const qId = byTitle[p.title];
      if (qId) map[qId] = p._id;
    }
    return map;
  }, [ballot, allProposals]);

  const proposalById = useMemo(() =>
    Object.fromEntries(allProposals.map(p => [p._id, p]))
  , [allProposals]);

  const rows = useMemo(() => {
    const questions = ballot?.hydra?.ballot?.questions ?? [];
    if (!questions.length) return [];

    return questions.map(q => {
      const proposalId = questionToProposalId[q.questionId];
      const proposal = proposalById[proposalId];
      const resultObj = resultsByQuestionId[q.questionId] ?? {};
      const resultArr = resultObj?.results ?? [];

      // Parse Yes / No / Abstain by id (1=Yes, 2=No, "abstain"=Abstain)
      const findR = id => resultArr.find(r => String(r.id) === String(id)) ?? {};
      const yesR = findR(1);
      const noR = findR(2);
      const abstainR = findR("abstain");

      const yesVP = Number(yesR.votingPower ?? 0);
      const noVP = Number(noR.votingPower ?? 0);
      const abstainVP = Number(abstainR.votingPower ?? 0);
      const totalVP = yesVP + noVP + abstainVP;

      const yesCount = Number(yesR.count ?? 0);
      const noCount = Number(noR.count ?? 0);
      const abstainCount = Number(abstainR.count ?? 0);
      const totalCount = yesCount + noCount + abstainCount;

      // Participation stats
      const participation = resultObj?.proposalParticipation ?? {};
      const drepVoters = participation?.voterCount?.drep ?? totalCount;

      return {
        questionId: q.questionId,
        title: proposal?.title ?? q.question,
        budget: proposal?.metaData?.totalBudget ?? null,
        yesVP, noVP, abstainVP, totalVP,
        yesCount, noCount, abstainCount, totalCount,
        drepVoters,
        yesPct: totalVP ? (yesVP / totalVP) * 100 : 0,
        noPct: totalVP ? (noVP / totalVP) * 100 : 0,
        abstainPct: totalVP ? (abstainVP / totalVP) * 100 : 0,
        // Passing = Yes VP > No VP (abstain excluded from threshold)
        passing: (yesVP + noVP) > 0 && yesVP > noVP,
      };
    });
  }, [ballot, resultsByQuestionId, questionToProposalId, proposalById]);

  const sorted = useMemo(() => {
    const r = [...rows];
    if (sort === "yes_desc") return r.sort((a, b) => b.yesPct - a.yesPct);
    if (sort === "no_desc") return r.sort((a, b) => b.noPct - a.noPct);
    if (sort === "total_desc") return r.sort((a, b) => b.drepVoters - a.drepVoters);
    if (sort === "budget") return r.sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0));
    if (sort === "title") return r.sort((a, b) => a.title.localeCompare(b.title));
    return r;
  }, [rows, sort]);

  const passingCount = rows.filter(r => r.totalVP > 0 && r.passing).length;
  const totalDrepVoters = rows.length ? Math.max(...rows.map(r => r.drepVoters)) : 0;

  return (
    <main className="shell" style={{ padding: "1.5rem 1rem", maxWidth: 960, margin: "0 auto" }}>
      <button
        onClick={() => navigate(basePath)}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          background: "transparent", border: "none", cursor: "pointer",
          color: "var(--text-muted)", fontSize: "0.83rem", padding: "0 0 1.25rem",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to proposals
      </button>

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: "0 0 0.4rem", fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Preliminary Results
        </h1>
        <p className="muted" style={{ margin: "0 0 0.75rem", fontSize: "0.9rem" }}>
          {cycle?.description || "Cardano Budget 2026"} — live off-chain DRep vote tallies
        </p>
        {cycle && <CycleTimeline cycle={cycle} />}
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
          Preliminary — results may change until voting closes on {formatDate(cycle?.votingEndDate)}.
        </p>
      </div>

      {loading && <p className="muted" style={{ fontSize: "0.85rem" }}>Loading results…</p>}

      {!loading && error && (
        <div style={{
          padding: "1.25rem", borderRadius: 10, border: "1px solid var(--line)",
          background: "var(--panel)", color: "var(--text-muted)", fontSize: "0.85rem",
        }}>
          {error}
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.6rem", marginBottom: "1.25rem",
          }}>
            {[
              ["Proposals", rows.length],
              ["Currently Passing (Yes > No VP)", passingCount],
              ["Peak DRep Voters", totalDrepVoters || "—"],
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

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ padding: "0.38rem 0.55rem", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: "0.82rem" }}>
              <option value="yes_desc">Sort: Most Yes</option>
              <option value="no_desc">Sort: Most No</option>
              <option value="total_desc">Sort: Most Votes</option>
              <option value="budget">Sort: Budget ↓</option>
              <option value="title">Sort: Title A–Z</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {sorted.map(row => (
              <div key={row.questionId} style={{
                border: "1px solid var(--line)", borderRadius: 10, padding: "0.9rem 1rem",
                background: "var(--panel)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "flex-start" }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem", lineHeight: 1.35, flex: 1 }}>
                    {row.title}
                  </p>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexShrink: 0 }}>
                    {row.budget != null && (
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent, #5eead4)" }}>
                        {formatAda(row.budget)}
                      </span>
                    )}
                    {row.totalVP > 0 && row.passing && (
                      <span style={{
                        fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.55rem", borderRadius: 20,
                        background: "color-mix(in srgb, var(--green, #4ade80) 15%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--green, #4ade80) 40%, transparent)",
                        color: "var(--green, #4ade80)",
                      }}>Passing</span>
                    )}
                    {row.totalVP > 0 && !row.passing && (
                      <span style={{
                        fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.55rem", borderRadius: 20,
                        background: "color-mix(in srgb, var(--red, #f87171) 15%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--red, #f87171) 40%, transparent)",
                        color: "var(--red, #f87171)",
                      }}>Failing</span>
                    )}
                  </div>
                </div>

                {row.totalVP > 0 ? (
                  <>
                    <div style={{
                      display: "flex", height: 8, borderRadius: 4, overflow: "hidden",
                      background: "var(--line)", marginBottom: "0.45rem",
                    }}>
                      {row.yesPct > 0 && <div style={{ width: `${row.yesPct}%`, background: "var(--green, #4ade80)" }} />}
                      {row.noPct > 0 && <div style={{ width: `${row.noPct}%`, background: "var(--red, #f87171)" }} />}
                      {row.abstainPct > 0 && <div style={{ width: `${row.abstainPct}%`, background: "var(--text-muted)", opacity: 0.4 }} />}
                    </div>
                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.74rem", flexWrap: "wrap" }}>
                      <span style={{ color: "var(--green, #4ade80)", fontWeight: 600 }}>
                        Yes {row.yesPct.toFixed(1)}%{" "}
                        <span style={{ fontWeight: 400, opacity: 0.7 }}>({row.yesCount})</span>
                      </span>
                      <span style={{ color: "var(--red, #f87171)", fontWeight: 600 }}>
                        No {row.noPct.toFixed(1)}%{" "}
                        <span style={{ fontWeight: 400, opacity: 0.7 }}>({row.noCount})</span>
                      </span>
                      <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                        Abstain {row.abstainPct.toFixed(1)}%{" "}
                        <span style={{ fontWeight: 400, opacity: 0.7 }}>({row.abstainCount})</span>
                      </span>
                      <span style={{ color: "var(--text-muted)", marginLeft: "auto" }}>
                        {row.drepVoters} DRep{row.drepVoters !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>No votes recorded yet</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && !error && rows.length === 0 && (
        <div style={{
          padding: "2rem", borderRadius: 10, border: "1px solid var(--line)",
          background: "var(--panel)", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem",
        }}>
          No results available yet. Results will appear once voting is underway.
        </div>
      )}
    </main>
  );
}
