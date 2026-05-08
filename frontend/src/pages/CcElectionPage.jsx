import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { WalletContext } from "../context/WalletContext";

const API_BASE = "/ekklesia-proxy/api/v0";
const VOTE_SLUG = "cc-vote-2026";
const BASE_PATH = "/cc-election";
const PAGE_SIZE = 100;

// ─── Utilities ───────────────────────────────────────────────────────────────

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
      msg = j?.message || j?.error || res.statusText;
    } catch {
      msg = res.statusText;
    }
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return res.json();
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0 }}>
      <path d="M4.5 2H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.5M6.5 1H10m0 0v3.5M10 1 5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const APPLICANT_TYPE_LABELS = { individual: "Individual", organisation: "Organisation", consortium: "Consortium" };
const APPLICANT_TYPE_COLORS = {
  individual: { bg: "color-mix(in srgb, #6366f1 12%, transparent)", border: "color-mix(in srgb, #6366f1 35%, transparent)", text: "#818cf8" },
  organisation: { bg: "color-mix(in srgb, #10b981 12%, transparent)", border: "color-mix(in srgb, #10b981 35%, transparent)", text: "#34d399" },
  consortium: { bg: "color-mix(in srgb, #f59e0b 12%, transparent)", border: "color-mix(in srgb, #f59e0b 35%, transparent)", text: "#fbbf24" },
};

function ApplicantTypeBadge({ type }) {
  const t = String(type || "").toLowerCase();
  const label = APPLICANT_TYPE_LABELS[t] || type || "Unknown";
  const colors = APPLICANT_TYPE_COLORS[t] || { bg: "var(--panel)", border: "var(--line)", text: "var(--text-muted)" };
  return (
    <span style={{
      padding: "0.18rem 0.55rem", borderRadius: 20, fontSize: "0.68rem", fontWeight: 700,
      letterSpacing: "0.04em", display: "inline-block",
      background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text,
    }}>{label}</span>
  );
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const map = {
    live: { label: "Submitted", color: "#34d399" },
    draft: { label: "Draft", color: "#fbbf24" },
    withdrawn: { label: "Withdrawn", color: "#f87171" },
  };
  const c = map[s] || { label: status || "Unknown", color: "var(--text-muted)" };
  return <span style={{ fontSize: "0.68rem", fontWeight: 700, color: c.color, letterSpacing: "0.04em" }}>{c.label}</span>;
}

// ─── Timeline ────────────────────────────────────────────────────────────────

function ElectionTimeline({ cycle }) {
  const now = new Date();
  const phases = [
    { label: "Submission", start: cycle.submissionStartDate, end: cycle.submissionEndDate },
    { label: "Feedback", start: cycle.feedbackStartDate, end: cycle.feedbackEndDate },
    { label: "Voting", start: cycle.votingStartDate, end: cycle.votingEndDate },
  ].filter(p => p.start && p.end);

  function phaseStatus(start, end) {
    const s = new Date(start), e = new Date(end);
    if (now < s) return "upcoming";
    if (now > e) return "done";
    return "active";
  }

  return (
    <div style={{ display: "flex", gap: 0, alignItems: "stretch", flexWrap: "wrap" }}>
      {phases.map((phase, i) => {
        const status = phaseStatus(phase.start, phase.end);
        const isActive = status === "active";
        const isDone = status === "done";
        return (
          <div key={phase.label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              padding: "0.5rem 0.85rem", borderRadius: 8,
              border: `1px solid ${isActive ? "var(--accent, #5eead4)" : "var(--line)"}`,
              background: isActive ? "color-mix(in srgb, var(--accent, #5eead4) 8%, var(--panel))" : "var(--panel)",
              display: "flex", flexDirection: "column", gap: "0.15rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                  background: isActive ? "var(--accent, #5eead4)" : isDone ? "var(--text-muted)" : "var(--line)",
                  boxShadow: isActive ? "0 0 6px var(--accent, #5eead4)" : "none",
                }} />
                <span style={{
                  fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
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

// ─── Candidate Card ──────────────────────────────────────────────────────────

function getCandidateName(c) {
  return c.title || c.metaData?.applicantName || c.metaData?.name || "Unnamed Candidate";
}

function getApplicantType(c) {
  return String(c.metaData?.applicantType || c.metaData?.applicant_type || c.applicantType || "").toLowerCase();
}

function CandidateCard({ candidate, onClick }) {
  const md = candidate?.metaData || {};
  const name = getCandidateName(candidate);
  const type = getApplicantType(candidate);
  const summary = candidate.summary || md.summary || md.bio || "";
  const links = [...(md.links || []), ...(md.socialLinks || [])].filter(l => l?.url);

  return (
    <button onClick={onClick}
      style={{
        display: "block", width: "100%", textAlign: "left",
        background: "var(--panel)", border: "1px solid var(--line)",
        borderRadius: 12, padding: "1rem 1.1rem", cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent, #5eead4)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(94,234,212,0.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {type && <ApplicantTypeBadge type={type} />}
          <StatusBadge status={candidate.status} />
        </div>
        {candidate.commentCount > 0 && (
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", flexShrink: 0 }}>💬 {candidate.commentCount}</span>
        )}
      </div>
      <p style={{ margin: "0 0 0.4rem", fontWeight: 700, fontSize: "0.97rem", lineHeight: 1.3 }}>{name}</p>
      {summary && (
        <p style={{
          margin: "0 0 0.5rem", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{summary}</p>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.35rem" }}>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Submitted {formatDate(candidate.submittedAt)}</span>
        {links.length > 0 && (
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.2rem" }}>
            <ExternalLinkIcon /> {links.length} link{links.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Candidate Detail ─────────────────────────────────────────────────────────

function RichText({ text }) {
  if (!text) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {String(text).split(/\n{2,}/).map((p, i) => (
        <p key={i} style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.7 }}>
          {p.split("\n").map((line, j, arr) => <span key={j}>{line}{j < arr.length - 1 && <br />}</span>)}
        </p>
      ))}
    </div>
  );
}

function FieldBlock({ label, children }) {
  if (!children) return null;
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</p>
      {children}
    </div>
  );
}

function CandidateDetail({ candidate, onBack }) {
  const md = candidate?.metaData || {};
  const name = getCandidateName(candidate);
  const type = getApplicantType(candidate);
  const summary = candidate.summary || md.summary || "";
  const links = [...(md.links || []), ...(md.socialLinks || []), ...(md.supportingInfoLinks || [])]
    .filter((l, i, arr) => l?.url && arr.findIndex(x => x.url === l.url) === i);
  const stakeKey = md.stakeKey || md.stakeAddress || md.walletAddress || md.rewardAddress || "";
  const drepKey = md.drepId || md.drepKey || md.drep || "";
  const coldKey = md.coldKey || md.ccColdKey || "";

  const knownKeys = new Set(["applicantType", "applicant_type", "type", "name", "applicantName",
    "summary", "bio", "links", "socialLinks", "supportingInfoLinks",
    "stakeKey", "stakeAddress", "walletAddress", "rewardAddress",
    "drepId", "drepKey", "drep", "coldKey", "ccColdKey",
    "experience", "trackRecord", "background", "motivations", "motivation",
    "whyRunning", "commitments", "commitment", "pledges", "email",
    "proposerDetails"]);

  const extraFields = Object.entries(md).filter(([k, v]) => !knownKeys.has(k) && typeof v === "string" && v.trim());

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <button onClick={onBack} style={{
        display: "inline-flex", alignItems: "center", gap: "0.35rem",
        background: "transparent", border: "none", cursor: "pointer",
        color: "var(--text-muted)", fontSize: "0.83rem", padding: "0 0 1.25rem",
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to candidates
      </button>

      <div style={{ border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", background: "var(--panel)", marginBottom: "1rem" }}>
        <div style={{ padding: "1.25rem 1.4rem", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
            {type && <ApplicantTypeBadge type={type} />}
            <StatusBadge status={candidate.status} />
          </div>
          <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{name}</h1>
          {summary && <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{summary}</p>}
        </div>

        {(stakeKey || drepKey || coldKey) && (
          <div style={{ padding: "0.8rem 1.4rem", borderBottom: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {[["Stake Key", stakeKey], ["DRep ID", drepKey], ["Cold Key", coldKey]].filter(([, v]) => v).map(([label, val]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)", minWidth: 80 }}>{label}</span>
                <code style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "var(--accent, #5eead4)", wordBreak: "break-all" }}>{val}</code>
              </div>
            ))}
          </div>
        )}

        {links.length > 0 && (
          <div style={{ padding: "0.8rem 1.4rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem",
                  color: "var(--accent, #5eead4)", textDecoration: "none",
                  padding: "0.3rem 0.7rem", border: "1px solid color-mix(in srgb, var(--accent, #5eead4) 30%, transparent)",
                  borderRadius: 20, background: "color-mix(in srgb, var(--accent, #5eead4) 6%, transparent)",
                }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
              >
                <ExternalLinkIcon />{l.title || l.url}
              </a>
            ))}
          </div>
        )}
      </div>

      <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", padding: "1.25rem 1.4rem" }}>
        {(md.motivations || md.motivation || md.whyRunning) && (
          <FieldBlock label="Why they're running"><RichText text={md.motivations || md.motivation || md.whyRunning} /></FieldBlock>
        )}
        {(md.experience || md.trackRecord || md.background) && (
          <FieldBlock label="Experience & Background"><RichText text={md.experience || md.trackRecord || md.background} /></FieldBlock>
        )}
        {(md.commitments || md.commitment || md.pledges) && (
          <FieldBlock label="Commitments & Pledges"><RichText text={md.commitments || md.commitment || md.pledges} /></FieldBlock>
        )}
        {extraFields.map(([key, val]) => (
          <FieldBlock key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}>
            <RichText text={val} />
          </FieldBlock>
        ))}
        {!md.motivations && !md.motivation && !md.whyRunning && !md.experience && !md.trackRecord && !md.background && !md.commitments && extraFields.length === 0 && (
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>No additional details available.</p>
        )}
      </div>
    </div>
  );
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function doWalletAuth(walletApi, walletRewardAddress) {
  const signerAddress = String(walletRewardAddress || "").trim();
  const signType = getSignerType(signerAddress);
  const nonceRes = await apiFetch("/session", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signerAddress, signType }),
  });
  const dataHex = nonceRes?.dataHex ?? nonceRes?.data?.dataHex;
  const nonce = nonceRes?.nonce ?? nonceRes?.data?.nonce;
  const payloadHex = dataHex || (nonce ? strToHex(nonce) : "");
  if (!payloadHex) throw new Error("No nonce returned from server.");
  const signAddress = nonceRes?.userIdHex ?? nonceRes?.signerAddressHex ?? signerAddress;
  const signature = await walletApi.signData(payloadHex, signAddress, false);
  await apiFetch("/session", {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signerAddress, signature, signType }),
  });
}

// ─── My Nominations Panel ────────────────────────────────────────────────────

function MyNominationsPanel({ cycle, walletApi, walletRewardAddress, onClose, onEdit }) {
  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [nominations, setNominations] = useState([]);
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
      setNominations(rows);
      setAuthed(true);
    } catch (e) {
      const msg = String(e.message || "");
      if (msg.includes("401") || msg.includes("403") || msg.includes("Unauthorized")) setAuthed(false);
      else setError(e.message || "Failed to load nominations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchMine(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAuth() {
    if (!walletApi || !walletRewardAddress) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      await doWalletAuth(walletApi, walletRewardAddress);
      setAuthed(true);
      fetchMine();
    } catch (e) {
      setAuthError(e.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleDelete(nom) {
    if (!window.confirm("Delete this nomination? This cannot be undone.")) return;
    setDeletingId(nom._id);
    try {
      await apiFetch(`/proposals/${nom._id}`, { method: "DELETE" });
      setNominations(ns => ns.filter(n => n._id !== nom._id));
    } catch (e) {
      alert(e.message || "Failed to delete nomination.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 14, width: "100%", maxWidth: 640, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>My Nominations</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.2rem", lineHeight: 1, padding: "0.2rem" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem" }}>
          {!walletApi ? (
            <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>Connect your wallet to view your nominations.</p>
          ) : !authed ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p style={{ fontSize: "0.85rem", margin: 0, color: "var(--text-muted)" }}>Sign in with your wallet to view your nominations.</p>
              <button onClick={handleAuth} disabled={authLoading} className="btn-outline" style={{ alignSelf: "flex-start" }}>
                {authLoading ? "Signing…" : "Sign in with Wallet"}
              </button>
              {authError && <p style={{ color: "var(--red, #f87171)", fontSize: "0.82rem", margin: 0 }}>{authError}</p>}
            </div>
          ) : loading ? (
            <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>Loading your nominations…</p>
          ) : error ? (
            <p style={{ color: "var(--red, #f87171)", fontSize: "0.85rem", margin: 0 }}>{error}</p>
          ) : nominations.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>You haven't submitted any nominations yet.</p>
              <button onClick={onClose} className="btn-outline" style={{ alignSelf: "flex-start", fontSize: "0.82rem" }}>
                Start a new nomination
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {nominations.map(n => (
                <div key={n._id} style={{ border: "1px solid var(--line)", borderRadius: 9, padding: "0.85rem 1rem", background: "var(--panel)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem", flex: 1 }}>{getCandidateName(n)}</span>
                    <StatusBadge status={n.status} />
                  </div>
                  {n.summary && <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.summary}</p>}
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Updated {formatDateTime(n.updatedAt)}
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.2rem" }}>
                    <button onClick={() => { onClose(); onEdit(n); }} className="btn-outline" style={{ fontSize: "0.78rem", padding: "0.25rem 0.65rem" }}>Edit</button>
                    <button onClick={() => handleDelete(n)} disabled={deletingId === n._id}
                      style={{ background: "transparent", border: "1px solid color-mix(in srgb, var(--red, #f87171) 40%, transparent)", borderRadius: 7, padding: "0.25rem 0.65rem", fontSize: "0.78rem", color: "var(--red, #f87171)", cursor: "pointer" }}>
                      {deletingId === n._id ? "Deleting…" : "Delete"}
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

// ─── Nomination Form ──────────────────────────────────────────────────────────

const inp = {
  width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8,
  border: "1px solid var(--line)", background: "var(--bg)",
  color: "var(--text)", fontSize: "0.85rem", boxSizing: "border-box",
};
const ta = { ...inp, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 };
const lbl = { display: "block", marginBottom: "0.3rem", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)" };
const hint = { margin: "0 0 0.5rem", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.55 };

function FormSection({ title, number, children }) {
  return (
    <section style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", marginBottom: "1rem" }}>
      <div style={{ padding: "0.9rem 1.2rem", borderBottom: "1px solid var(--line)", background: "var(--panel)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent, #5eead4)", color: "#0a0f1a", fontSize: "0.72rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{number}</span>
        <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>{title}</span>
      </div>
      <div style={{ padding: "1.1rem 1.2rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
        {children}
      </div>
    </section>
  );
}

function Field({ label, help, count, children }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
        <label style={lbl}>{label}</label>
        {count && <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{count}</span>}
      </div>
      {help && <p style={hint}>{help}</p>}
      {children}
    </div>
  );
}

function RadioRow({ name, value, current, onChange, label }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem" }}>
      <input type="radio" name={name} value={value} checked={current === value} onChange={() => onChange(value)}
        style={{ accentColor: "var(--accent, #5eead4)", width: 15, height: 15 }} />
      {label}
    </label>
  );
}

function LinkRow({ link, onChange, onRemove }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.4rem", alignItems: "center" }}>
      <input value={link.title} onChange={e => onChange({ ...link, title: e.target.value })} placeholder="Label (e.g. Twitter)" style={inp} />
      <input value={link.url} onChange={e => onChange({ ...link, url: e.target.value })} placeholder="https://…" style={inp} />
      <button type="button" onClick={onRemove}
        style={{ padding: "0.5rem 0.65rem", border: "1px solid var(--line)", borderRadius: 7, background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.82rem" }}>✕</button>
    </div>
  );
}

function NominationForm({ cycle, walletApi, walletRewardAddress, initialData, onClose, onSuccess }) {
  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [draftId, setDraftId] = useState(() => initialData?._id || null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // § Applicant
  const [applicantName, setApplicantName] = useState(() => initialData?.title || initialData?.metaData?.applicantName || "");
  const [applicantType, setApplicantType] = useState(() => initialData?.metaData?.applicantType || "individual");
  const [summary, setSummary] = useState(() => initialData?.summary || initialData?.metaData?.summary || "");

  // § Background
  const [motivations, setMotivations] = useState(() => initialData?.metaData?.motivations || "");
  const [experience, setExperience] = useState(() => initialData?.metaData?.experience || "");
  const [commitments, setCommitments] = useState(() => initialData?.metaData?.commitments || "");

  // § On-chain
  const [coldKey, setColdKey] = useState(() => initialData?.metaData?.coldKey || "");
  const [drepId, setDrepId] = useState(() => initialData?.metaData?.drepId || "");

  // § Contact
  const [links, setLinks] = useState(() => initialData?.metaData?.links?.length ? initialData.metaData.links : [{ title: "", url: "" }]);
  const [email, setEmail] = useState(() => initialData?.metaData?.email || "");

  // § Legal
  const [declared, setDeclared] = useState(false);

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
      await doWalletAuth(walletApi, walletRewardAddress);
      setAuthed(true);
    } catch (e) {
      setAuthError(e.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  }

  function buildPayload(status = "draft") {
    const clean = v => String(v || "").trim();
    const cleanLinks = links.filter(l => clean(l.url)).map(l => ({ title: clean(l.title) || clean(l.url), url: clean(l.url) }));
    return {
      voteId: cycle._id,
      status,
      title: clean(applicantName) || "Unnamed Candidate",
      summary: clean(summary),
      metaData: {
        applicantType: clean(applicantType),
        applicantName: clean(applicantName),
        motivations: clean(motivations),
        experience: clean(experience),
        commitments: clean(commitments),
        coldKey: clean(coldKey),
        drepId: clean(drepId),
        email: clean(email),
        links: cleanLinks,
      },
    };
  }

  async function saveDraft() {
    if (!authed) return;
    setDraftSaving(true);
    setDraftSaved(false);
    setSubmitError("");
    try {
      const payload = buildPayload("draft");
      if (draftId) {
        await apiFetch(`/proposals/${draftId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        const res = await apiFetch("/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const id = res?._id || res?.data?._id;
        if (id) setDraftId(id);
      }
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (e) {
      setSubmitError(e.message || "Failed to save draft.");
    } finally {
      setDraftSaving(false);
    }
  }

  async function handleSubmit(status) {
    if (!authed || submitting) return;
    if (status === "live" && !declared) { setSubmitError("Please confirm the declaration before submitting."); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = buildPayload(status);
      if (draftId) {
        await apiFetch(`/proposals/${draftId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        const res = await apiFetch("/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const id = res?._id || res?.data?._id;
        if (id) setDraftId(id);
      }
      setDone(true);
      setTimeout(() => onSuccess?.(), 1500);
    } catch (e) {
      setSubmitError(e.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <p style={{ fontSize: "2rem", margin: "0 0 0.75rem" }}>✅</p>
        <p style={{ fontWeight: 700, fontSize: "1rem", margin: "0 0 0.4rem" }}>Nomination saved!</p>
        <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>Redirecting…</p>
      </div>
    );
  }

  return (
    <div>
      {/* Auth gate */}
      {!walletApi && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "1rem 1.2rem", background: "var(--panel)", marginBottom: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>Connect your wallet using the button in the top bar to save and submit your nomination.</p>
        </div>
      )}
      {walletApi && !authed && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "1rem 1.2rem", background: "var(--panel)", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>Sign in with your wallet to save drafts and submit.</p>
          <button onClick={handleAuth} disabled={authLoading} className="btn-outline" style={{ fontSize: "0.82rem" }}>
            {authLoading ? "Signing…" : "Sign in with Wallet"}
          </button>
          {authError && <span style={{ fontSize: "0.8rem", color: "var(--red, #f87171)", width: "100%" }}>{authError}</span>}
        </div>
      )}

      <FormSection number="1" title="Applicant Details">
        <Field label="Full Name / Entity Name *" help="Your legal name or the name of your organisation.">
          <input value={applicantName} onChange={e => setApplicantName(e.target.value)} maxLength={100} placeholder="Your name or organisation name" style={inp} />
        </Field>
        <Field label="Applicant Type *">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.2rem" }}>
            <RadioRow name="applicantType" value="individual" current={applicantType} onChange={setApplicantType} label="Individual" />
            <RadioRow name="applicantType" value="organisation" current={applicantType} onChange={setApplicantType} label="Organisation" />
            <RadioRow name="applicantType" value="consortium" current={applicantType} onChange={setApplicantType} label="Consortium" />
          </div>
        </Field>
        <Field label="Executive Summary *" count={`${summary.length}/2000`} help="A high-level overview of who you are and why you're running. This is the first thing voters see.">
          <textarea value={summary} onChange={e => setSummary(e.target.value)} maxLength={2000} rows={4} placeholder="Brief bio and motivation…" style={ta} />
        </Field>
      </FormSection>

      <FormSection number="2" title="Background & Credentials">
        <Field label="Why are you running?" count={`${motivations.length}/5000`} help="Your reasons for seeking a seat on the Constitutional Committee.">
          <textarea value={motivations} onChange={e => setMotivations(e.target.value)} maxLength={5000} rows={5} placeholder="Describe your motivations…" style={ta} />
        </Field>
        <Field label="Relevant Experience" count={`${experience.length}/5000`} help="Legal, governance, or blockchain experience relevant to this role.">
          <textarea value={experience} onChange={e => setExperience(e.target.value)} maxLength={5000} rows={5} placeholder="Describe your relevant experience and background…" style={ta} />
        </Field>
        <Field label="Commitments" count={`${commitments.length}/3000`} help="What you commit to if elected — transparency, availability, areas of focus.">
          <textarea value={commitments} onChange={e => setCommitments(e.target.value)} maxLength={3000} rows={4} placeholder="Describe your commitments if elected…" style={ta} />
        </Field>
      </FormSection>

      <FormSection number="3" title="On-Chain Identifiers">
        <p style={{ ...hint, margin: 0 }}>Optional — provide your Cardano on-chain keys for voter verification. These can be added later.</p>
        <Field label="CC Cold Credential" help="Your Constitutional Committee cold verification key.">
          <input value={coldKey} onChange={e => setColdKey(e.target.value)} placeholder="cc_cold_vk…" style={inp} />
        </Field>
        <Field label="DRep ID" help="If you are a registered DRep, provide your DRep ID.">
          <input value={drepId} onChange={e => setDrepId(e.target.value)} placeholder="drep1…" style={inp} />
        </Field>
      </FormSection>

      <FormSection number="4" title="Contact & Links">
        <Field label="Contact Email" help="Used for election-related communications. Not publicly displayed.">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ ...inp, maxWidth: 360 }} />
        </Field>
        <Field label="Social & Website Links" help="Website, Twitter/X, LinkedIn, GitHub, or other public profiles.">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {links.map((l, i) => (
              <LinkRow key={i} link={l}
                onChange={updated => setLinks(ls => ls.map((x, j) => j === i ? updated : x))}
                onRemove={() => setLinks(ls => ls.filter((_, j) => j !== i))} />
            ))}
            <button type="button" onClick={() => setLinks(ls => [...ls, { title: "", url: "" }])}
              style={{ alignSelf: "flex-start", padding: "0.35rem 0.75rem", border: "1px dashed var(--line)", borderRadius: 7, background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}>
              + Add link
            </button>
          </div>
        </Field>
      </FormSection>

      <FormSection number="5" title="Declaration">
        <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer", fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
          <input type="checkbox" checked={declared} onChange={e => setDeclared(e.target.checked)} style={{ marginTop: "0.2rem", accentColor: "var(--accent, #5eead4)", flexShrink: 0 }} />
          I confirm that the information provided is accurate and complete. I understand that submitting this nomination constitutes a formal application for the Cardano Constitutional Committee, and that any false or misleading information may result in disqualification.
        </label>
      </FormSection>

      {submitError && (
        <p style={{ color: "var(--red, #f87171)", fontSize: "0.83rem", margin: "0 0 1rem" }}>{submitError}</p>
      )}

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}>
        {authed && (
          <button type="button" onClick={saveDraft} disabled={draftSaving}
            style={{ padding: "0.6rem 1.1rem", borderRadius: 8, border: "1px solid var(--line)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem" }}>
            {draftSaving ? "Saving…" : draftSaved ? "Draft saved ✓" : "Save Draft"}
          </button>
        )}
        <button type="button" onClick={() => handleSubmit("live")} disabled={!authed || submitting || !declared}
          style={{
            padding: "0.65rem 1.4rem", borderRadius: 8, border: "none",
            background: authed && declared ? "var(--accent, #5eead4)" : "var(--panel)",
            color: authed && declared ? "#0a0f1a" : "var(--text-muted)",
            fontWeight: 700, fontSize: "0.88rem", cursor: authed && declared ? "pointer" : "not-allowed",
            transition: "background 0.15s",
          }}>
          {submitting ? "Submitting…" : "Submit Nomination"}
        </button>
      </div>
    </div>
  );
}

// ─── Submit Page ──────────────────────────────────────────────────────────────

export function CcElectionSubmitPage() {
  const { walletApi, walletRewardAddress } = useContext(WalletContext) || {};
  const { nominationId } = useParams();
  const navigate = useNavigate();

  const [cycle, setCycle] = useState(null);
  const [cycleLoading, setCycleLoading] = useState(true);
  const [cycleError, setCycleError] = useState("");
  const [initialData, setInitialData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(Boolean(nominationId));

  useEffect(() => {
    const ctrl = new AbortController();
    apiFetch("/votes", { signal: ctrl.signal })
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        const match = list.find(v => v.slug === VOTE_SLUG);
        if (match) setCycle(match);
        else setCycleError(`Election "${VOTE_SLUG}" not found.`);
      })
      .catch(e => { if (e.name !== "AbortError") setCycleError(e.message || "Failed to load."); })
      .finally(() => setCycleLoading(false));
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!nominationId) { setInitialLoading(false); return; }
    const ctrl = new AbortController();
    apiFetch(`/proposals/${nominationId}`, { signal: ctrl.signal })
      .then(data => setInitialData(data?.data ?? data))
      .catch(() => {})
      .finally(() => setInitialLoading(false));
    return () => ctrl.abort();
  }, [nominationId]);

  const goBack = () => navigate(BASE_PATH);

  return (
    <main className="shell" style={{ padding: "1.25rem 1rem 3rem", maxWidth: 860, margin: "0 auto" }}>
      <button onClick={goBack} style={{
        display: "inline-flex", alignItems: "center", gap: "0.35rem",
        background: "transparent", border: "none", cursor: "pointer",
        color: "var(--text-muted)", fontSize: "0.83rem", padding: "0 0 1rem",
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        CC Election 2026
      </button>

      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          {nominationId ? "Edit Nomination" : "Submit Nomination"}
        </h1>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.86rem" }}>Constitutional Committee Election 2026</p>
      </header>

      {cycleLoading || initialLoading ? (
        <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", padding: "2rem", textAlign: "center" }}>
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>Loading…</p>
        </div>
      ) : cycleError ? (
        <p style={{ color: "var(--red, #f87171)", fontSize: "0.85rem" }}>{cycleError}</p>
      ) : (
        <NominationForm
          cycle={cycle}
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

// ─── Main List Page ───────────────────────────────────────────────────────────

export default function CcElectionPage() {
  const { walletApi, walletRewardAddress } = useContext(WalletContext) || {};
  const { candidateId: urlCandidateId } = useParams();
  const navigate = useNavigate();

  const [cycle, setCycle] = useState(null);
  const [cycleLoading, setCycleLoading] = useState(true);
  const [cycleError, setCycleError] = useState("");

  const [allCandidates, setAllCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState("");

  const [selected, setSelected] = useState(null);
  const [detailFull, setDetailFull] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sort, setSort] = useState("submittedAt");
  const [myNomOpen, setMyNomOpen] = useState(false);

  // Load vote cycle
  useEffect(() => {
    const ctrl = new AbortController();
    apiFetch("/votes", { signal: ctrl.signal })
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        const match = list.find(v => v.slug === VOTE_SLUG);
        if (match) setCycle(match);
        else setCycleError(`Election "${VOTE_SLUG}" not found.`);
      })
      .catch(e => { if (e.name !== "AbortError") setCycleError(e.message || "Failed to load."); })
      .finally(() => setCycleLoading(false));
    return () => ctrl.abort();
  }, []);

  // Load candidates
  useEffect(() => {
    if (!cycle) return;
    const ctrl = new AbortController();
    setCandidatesLoading(true);
    setCandidatesError("");
    (async () => {
      try {
        let page = 1, all = [];
        while (true) {
          const data = await apiFetch(`/proposals?vote=${cycle._id}&limit=${PAGE_SIZE}&page=${page}`, { signal: ctrl.signal });
          const rows = Array.isArray(data) ? data : (data?.data ?? []);
          all = all.concat(rows);
          const meta = data?.meta;
          if (!meta?.hasNextPage || rows.length < PAGE_SIZE) break;
          page++;
        }
        setAllCandidates(all);
      } catch (e) {
        if (e.name !== "AbortError") setCandidatesError(e.message || "Failed to load candidates.");
      } finally {
        setCandidatesLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [cycle]);

  const openCandidate = useCallback(async (c, skipNav = false) => {
    setSelected(c);
    setDetailFull(null);
    setDetailLoading(true);
    if (!skipNav) navigate(`${BASE_PATH}/${c._id}`, { replace: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const data = await apiFetch(`/proposals/${c._id}`);
      setDetailFull(data?.data ?? data);
    } catch {
      setDetailFull(c);
    } finally {
      setDetailLoading(false);
    }
  }, [navigate]);

  const closeCandidate = useCallback(() => {
    setSelected(null);
    setDetailFull(null);
    navigate(BASE_PATH, { replace: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigate]);

  // Auto-open from URL
  useEffect(() => {
    if (!urlCandidateId || !allCandidates.length) return;
    const match = allCandidates.find(c => c._id === urlCandidateId);
    if (match && (!selected || selected._id !== urlCandidateId)) openCandidate(match, true);
    else if (!match) {
      setSelected({ _id: urlCandidateId, title: "Loading…" });
      setDetailFull(null);
      setDetailLoading(true);
      apiFetch(`/proposals/${urlCandidateId}`)
        .then(data => setDetailFull(data?.data ?? data))
        .catch(() => {})
        .finally(() => setDetailLoading(false));
    }
  }, [urlCandidateId, allCandidates]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!urlCandidateId && selected) { setSelected(null); setDetailFull(null); }
  }, [urlCandidateId]); // eslint-disable-line react-hooks/exhaustive-deps

  const applicantTypes = useMemo(() => {
    const types = new Set();
    allCandidates.forEach(c => { const t = getApplicantType(c); if (t) types.add(t); });
    return [...types];
  }, [allCandidates]);

  const displayed = useMemo(() => {
    let list = allCandidates;
    if (filterType) list = list.filter(c => getApplicantType(c) === filterType);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => getCandidateName(c).toLowerCase().includes(q) || (c.summary || "").toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sort === "name") return getCandidateName(a).localeCompare(getCandidateName(b));
      if (sort === "commentCount") return (b.commentCount ?? 0) - (a.commentCount ?? 0);
      if (sort === "updatedAt") return new Date(b.updatedAt) - new Date(a.updatedAt);
      return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
    });
  }, [allCandidates, filterType, search, sort]);

  const now = new Date();
  const submissionOpen = cycle
    ? now >= new Date(cycle.submissionStartDate) && now <= new Date(cycle.submissionEndDate)
    : false;
  const votingOpen = cycle
    ? now >= new Date(cycle.votingStartDate) && now <= new Date(cycle.votingEndDate)
    : false;
  // Draft window: allow drafting from cycle creation until submission window closes
  const draftingAllowed = cycle
    ? now <= new Date(cycle.submissionEndDate)
    : false;

  const displayDetail = detailFull ?? selected;

  return (
    <main className="shell" style={{ padding: "1.5rem 1rem", maxWidth: 960, margin: "0 auto" }}>

      {myNomOpen && cycle && (
        <MyNominationsPanel
          cycle={cycle}
          walletApi={walletApi}
          walletRewardAddress={walletRewardAddress}
          onClose={() => setMyNomOpen(false)}
          onEdit={nom => navigate(`${BASE_PATH}/submit/${nom._id}`)}
        />
      )}

      {/* ── Detail view ──────────────────────────────────────────────── */}
      {selected && (
        detailLoading ? (
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <button onClick={closeCandidate} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.83rem", padding: "0 0 1.25rem" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back to candidates
            </button>
            <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", padding: "2.5rem", textAlign: "center" }}>
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>Loading candidate…</p>
            </div>
          </div>
        ) : (
          <CandidateDetail candidate={displayDetail} onBack={closeCandidate} />
        )
      )}

      {/* ── List view ────────────────────────────────────────────────── */}
      {!selected && (
        <div>
          <header style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  {cycle?.title || "Constitutional Committee Election 2026"}
                </h1>
                {votingOpen && (
                  <span style={{ padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, background: "color-mix(in srgb, var(--accent, #5eead4) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--accent, #5eead4) 35%, transparent)", color: "var(--accent, #5eead4)", letterSpacing: "0.05em" }}>VOTING OPEN</span>
                )}
                {submissionOpen && !votingOpen && (
                  <span style={{ padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, background: "color-mix(in srgb, #fbbf24 12%, transparent)", border: "1px solid color-mix(in srgb, #fbbf24 35%, transparent)", color: "#fbbf24", letterSpacing: "0.05em" }}>NOMINATIONS OPEN</span>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                {walletApi && (
                  <button onClick={() => setMyNomOpen(true)} className="btn-outline" style={{ fontSize: "0.82rem" }}>
                    My Nominations
                  </button>
                )}
                {draftingAllowed && (
                  <button onClick={() => navigate(`${BASE_PATH}/submit`)}
                    style={{
                      padding: "0.5rem 1rem", borderRadius: 8, border: "none",
                      background: "var(--accent, #5eead4)", color: "#0a0f1a",
                      fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                    }}>
                    {submissionOpen ? "Submit Nomination" : "Start Draft"}
                  </button>
                )}
              </div>
            </div>

            {cycle?.description && cycle.description !== cycle.title && (
              <p style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.55 }}>{cycle.description}</p>
            )}
            {cycleLoading && <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>Loading…</p>}
            {cycleError && <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--red, #f87171)" }}>{cycleError}</p>}
            {cycle && <ElectionTimeline cycle={cycle} />}
          </header>

          {cycle && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem", marginBottom: "1.25rem" }}>
                {[
                  ["Candidates", candidatesLoading ? "…" : allCandidates.length],
                  ["Matching Search", candidatesLoading ? "…" : displayed.length],
                  ["Voting Opens", formatDate(cycle.votingStartDate)],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10, padding: "0.75rem 0.9rem" }}>
                    <p style={{ margin: "0 0 0.2rem", fontSize: "0.67rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</p>
                    <p style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <input type="search" placeholder="Search candidates…" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, minWidth: 180, padding: "0.5rem 0.75rem", border: "1px solid var(--line)", borderRadius: 8, background: "var(--panel)", color: "var(--text)", fontSize: "0.85rem" }} />
                {applicantTypes.length > 0 && (
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <button onClick={() => setFilterType("")}
                      style={{ padding: "0.35rem 0.75rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, border: "1px solid", borderColor: filterType === "" ? "var(--accent)" : "var(--line)", background: filterType === "" ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent", color: filterType === "" ? "var(--accent)" : "var(--text-muted)", cursor: "pointer" }}>
                      All
                    </button>
                    {applicantTypes.map(t => {
                      const active = filterType === t;
                      const colors = APPLICANT_TYPE_COLORS[t] || {};
                      return (
                        <button key={t} onClick={() => setFilterType(active ? "" : t)}
                          style={{ padding: "0.35rem 0.75rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, border: `1px solid ${active ? (colors.border || "var(--accent)") : "var(--line)"}`, background: active ? (colors.bg || "transparent") : "transparent", color: active ? (colors.text || "var(--accent)") : "var(--text-muted)", cursor: "pointer" }}>
                          {APPLICANT_TYPE_LABELS[t] || t}
                        </button>
                      );
                    })}
                  </div>
                )}
                <select value={sort} onChange={e => setSort(e.target.value)}
                  style={{ padding: "0.5rem 0.6rem", border: "1px solid var(--line)", borderRadius: 8, background: "var(--panel)", color: "var(--text)", fontSize: "0.82rem" }}>
                  <option value="submittedAt">Newest first</option>
                  <option value="name">Name A–Z</option>
                  <option value="commentCount">Most discussed</option>
                  <option value="updatedAt">Recently updated</option>
                </select>
              </div>

              {candidatesError && <p style={{ color: "var(--red, #f87171)", fontSize: "0.85rem", marginBottom: "1rem" }}>{candidatesError}</p>}

              {candidatesLoading && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
                  {[1, 2, 3].map(i => <div key={i} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, height: 140 }} />)}
                </div>
              )}

              {!candidatesLoading && allCandidates.length === 0 && (
                <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: "3rem 2rem", textAlign: "center" }}>
                  <p style={{ margin: "0 0 0.4rem", fontSize: "1.5rem" }}>🗳️</p>
                  <p style={{ margin: "0 0 0.5rem", fontWeight: 700, fontSize: "0.97rem" }}>No candidates yet</p>
                  <p className="muted" style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
                    {draftingAllowed
                      ? `Nominations are open${submissionOpen ? "" : " — you can start a draft now and submit when the window opens"}. Submissions close ${formatDate(cycle?.submissionEndDate)}.`
                      : "No candidates have submitted applications for this election."}
                  </p>
                  {draftingAllowed && (
                    <button onClick={() => navigate(`${BASE_PATH}/submit`)}
                      style={{ padding: "0.65rem 1.4rem", borderRadius: 8, border: "none", background: "var(--accent, #5eead4)", color: "#0a0f1a", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>
                      {submissionOpen ? "Submit a Nomination" : "Start a Draft"}
                    </button>
                  )}
                </div>
              )}

              {!candidatesLoading && allCandidates.length > 0 && displayed.length === 0 && (
                <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "2rem", textAlign: "center" }}>
                  <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>No candidates match your filters.</p>
                </div>
              )}

              {!candidatesLoading && displayed.length > 0 && (
                <>
                  <p style={{ margin: "0 0 0.75rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {displayed.length} candidate{displayed.length !== 1 ? "s" : ""}{filterType && ` · ${APPLICANT_TYPE_LABELS[filterType] || filterType}`}{search && ` matching "${search}"`}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
                    {displayed.map(c => <CandidateCard key={c._id} candidate={c} onClick={() => openCandidate(c)} />)}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
