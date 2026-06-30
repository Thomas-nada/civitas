import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { WalletContext } from "../context/WalletContext";

const API_BASE = "/ekklesia-proxy/api/v0";
const VOTE_SLUG = "cc-vote-2026";
const BASE_PATH = "/cc-election";
const PAGE_SIZE = 100;

// The CC election ballot itself lives on intersect.ekklesia.vote (same host as
// budget voting), not on hydra-voting.intersectmbo.org — so v1 ballot/vote
// calls and their session auth go through ekklesia-vote-proxy, separately
// from the /ekklesia-proxy session used for nominations/comments above.
const VOTE_PROXY_BASE = "/ekklesia-vote-proxy";
const API_V1 = `${VOTE_PROXY_BASE}/api/v1`;

async function apiFetchV1(path, opts = {}) {
  const res = await fetch(`${API_V1}${path}`, { credentials: "include", ...opts });
  if (!res.ok) {
    let msg;
    try {
      const j = await res.json();
      msg = j?.message || j?.error || res.statusText;
    } catch { msg = res.statusText; }
    throw new Error(`${res.status} — ${msg}`);
  }
  return res.json();
}

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
      console.error("API error body:", JSON.stringify(j));
      const detail = Array.isArray(j?.errors) ? j.errors.map(e => e?.message || e?.field || JSON.stringify(e)).join("; ")
                   : Array.isArray(j?.details) ? j.details.map(e => e?.message || JSON.stringify(e)).join("; ")
                   : null;
      msg = [j?.message || j?.error, detail].filter(Boolean).join(": ") || JSON.stringify(j) || res.statusText;
    } catch { msg = res.statusText; }
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
  const res = await apiFetch("/session", {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signerAddress, signature, signType }),
  });
  return res;
}

// Triggers a re-render at the exact moment a future date arrives (e.g. submissionStartDate).
function useAutoRefreshAt(dateStr) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!dateStr) return;
    const ms = new Date(dateStr) - Date.now();
    if (ms <= 0 || ms > 2 * 60 * 60 * 1000) return; // only schedule if within 2 hours
    const id = setTimeout(() => setTick(t => t + 1), ms);
    return () => clearTimeout(id);
  }, [dateStr]);
}

// ─── Shared UI pieces ─────────────────────────────────────────────────────────

function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0 }}>
      <path d="M4.5 2H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.5M6.5 1H10m0 0v3.5M10 1 5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TRACK_LABELS = { individual: "Individual", organisation: "Organisation", consortium: "Consortium" };
const TRACK_COLORS = {
  individual:  { bg: "color-mix(in srgb,#6366f1 12%,transparent)", border: "color-mix(in srgb,#6366f1 35%,transparent)", text: "#818cf8" },
  organisation:{ bg: "color-mix(in srgb,#10b981 12%,transparent)", border: "color-mix(in srgb,#10b981 35%,transparent)", text: "#34d399" },
  consortium:  { bg: "color-mix(in srgb,#f59e0b 12%,transparent)", border: "color-mix(in srgb,#f59e0b 35%,transparent)", text: "#fbbf24" },
};

function TrackBadge({ type }) {
  const t = String(type || "").toLowerCase();
  const label = TRACK_LABELS[t] || type || "";
  const c = TRACK_COLORS[t] || { bg: "var(--panel)", border: "var(--line)", text: "var(--text-muted)" };
  return label ? (
    <span style={{ padding: "0.18rem 0.55rem", borderRadius: 20, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.04em", display: "inline-block", background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>{label}</span>
  ) : null;
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const map = {
    live: { label: "Submitted", color: "#34d399" },
    draft: { label: "Draft", color: "#fbbf24" },
    withdrawn: { label: "Withdrawn", color: "#f87171" },
    withdrawnbyproposer: { label: "Withdrawn by Proposer", color: "#f87171" },
    withdrawnbyadmin: { label: "Withdrawn by Admin", color: "#f87171" },
  };
  const c = map[s] || { label: status || "", color: "var(--text-muted)" };
  return c.label ? <span style={{ fontSize: "0.68rem", fontWeight: 700, color: c.color, letterSpacing: "0.04em" }}>{c.label}</span> : null;
}

function isWithdrawnStatus(status) {
  return ["withdrawnbyproposer", "withdrawnbyadmin", "withdrawn"].includes(String(status || "").toLowerCase());
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function ElectionTimeline({ cycle }) {
  const now = new Date();
  const phases = [
    { label: "Submission", start: cycle.submissionStartDate, end: cycle.submissionEndDate },
    { label: "Feedback",   start: cycle.feedbackStartDate,   end: cycle.feedbackEndDate   },
    { label: "Voting",     start: cycle.votingStartDate,     end: cycle.votingEndDate     },
  ].filter(p => p.start && p.end);

  function phaseStatus(s, e) {
    if (now < new Date(s)) return "upcoming";
    if (now > new Date(e)) return "done";
    return "active";
  }

  return (
    <div style={{ display: "flex", gap: 0, alignItems: "stretch", flexWrap: "wrap" }}>
      {phases.map((phase, i) => {
        const st = phaseStatus(phase.start, phase.end);
        const isActive = st === "active", isDone = st === "done";
        return (
          <div key={phase.label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ padding: "0.5rem 0.85rem", borderRadius: 8, border: `1px solid ${isActive ? "var(--accent,#5eead4)" : "var(--line)"}`, background: isActive ? "color-mix(in srgb,var(--accent,#5eead4) 8%,var(--panel))" : "var(--panel)", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: isActive ? "var(--accent,#5eead4)" : isDone ? "var(--text-muted)" : "var(--line)", boxShadow: isActive ? "0 0 6px var(--accent,#5eead4)" : "none", flexShrink: 0 }} />
                <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: isActive ? "var(--accent,#5eead4)" : isDone ? "var(--text-muted)" : "var(--text)" }}>
                  {phase.label}{isActive && <span style={{ marginLeft: "0.35rem", fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>· Active</span>}
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{formatDate(phase.start)} – {formatDate(phase.end)}</span>
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

// ─── Candidate helpers ─────────────────────────────────────────────────────────

function getTrack(c) { return String(c?.metaData?.track || c?.metaData?.applicantType || c?.applicantType || "").toLowerCase(); }
function getCandidateName(c) {
  const md = c?.metaData || {};
  return c?.title || md.individual?.fullNameOrAlias || md.organisation?.organisationName || md.consortium?.consortiumName || md.fullName || "Unnamed Candidate";
}
function getProposerId(c) { return c?.proposerId || c?.proposer || c?.userId || ""; }

function CopyTextButton({ value, label = "Copy" }) {
  if (!value) return null;
  return (
    <button type="button" onClick={() => navigator.clipboard?.writeText(String(value)).catch(() => {})}
      style={{ border: "1px solid var(--line)", borderRadius: 6, background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.68rem", padding: "0.16rem 0.45rem", flexShrink: 0 }}>
      {label}
    </button>
  );
}

function AdminTimelinePanel({ candidate }) {
  const proposerId = getProposerId(candidate);
  const withdrawal = candidate?.withdrawalDetails || candidate?.withdrawal || null;
  const item = { label: "", value: "" };
  const timeline = [
    { ...item, label: "Proposal ID", value: candidate?._id },
    { ...item, label: "Proposer", value: proposerId, copy: true },
    { ...item, label: "Status", value: candidate?.status },
    { ...item, label: "Version", value: candidate?.version },
    { ...item, label: "Created", value: formatDateTime(candidate?.createdAt) },
    { ...item, label: "Submitted", value: formatDateTime(candidate?.submittedAt) },
    { ...item, label: "Updated", value: formatDateTime(candidate?.updatedAt) },
    { ...item, label: "Comments", value: Number(candidate?.commentCount || 0) },
  ].filter(row => row.value !== undefined && row.value !== null && row.value !== "");

  const withdrawalRows = withdrawal ? [
    { label: "Withdrawn At", value: formatDateTime(withdrawal.date || withdrawal.createdAt) },
    { label: "Withdrawn By", value: withdrawal.userId || withdrawal.proposerId },
    { label: "Reason", value: withdrawal.category },
    { label: "Comment", value: withdrawal.comment },
  ].filter(row => row.value) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
      <section style={{ border: "1px solid color-mix(in srgb,#f59e0b 35%,transparent)", borderRadius: 10, background: "color-mix(in srgb,#f59e0b 5%,transparent)", padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f59e0b", background: "color-mix(in srgb,#f59e0b 14%,transparent)", border: "1px solid color-mix(in srgb,#f59e0b 35%,transparent)", borderRadius: 5, padding: "0.18rem 0.5rem" }}>Admin metadata</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>API record and timeline</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "0.65rem" }}>
          {timeline.map(row => (
            <div key={row.label} style={{ minWidth: 0 }}>
              <p style={{ margin: "0 0 0.22rem", fontSize: "0.63rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>{row.label}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text)", fontFamily: row.copy || row.label.includes("ID") ? "monospace" : "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.value}</p>
                {row.copy && <CopyTextButton value={row.value} />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {withdrawalRows.length > 0 && (
        <section style={{ border: "1px solid color-mix(in srgb,var(--red,#f87171) 35%,transparent)", borderRadius: 10, background: "color-mix(in srgb,var(--red,#f87171) 5%,transparent)", padding: "1rem" }}>
          <p style={{ margin: "0 0 0.85rem", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--red,#f87171)" }}>Withdrawal details</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "0.65rem" }}>
            {withdrawalRows.map(row => (
              <div key={row.label} style={{ minWidth: 0 }}>
                <p style={{ margin: "0 0 0.22rem", fontSize: "0.63rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>{row.label}</p>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text)", overflowWrap: "anywhere" }}>{row.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <details style={{ border: "1px solid var(--line)", borderRadius: 10, background: "var(--panel)", overflow: "hidden" }}>
        <summary style={{ cursor: "pointer", padding: "0.75rem 1rem", fontSize: "0.76rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Raw nomination data</summary>
        <pre style={{ margin: 0, padding: "1rem", borderTop: "1px solid var(--line)", maxHeight: 420, overflow: "auto", fontSize: "0.72rem", lineHeight: 1.55, color: "var(--text-muted)", background: "var(--bg)" }}>{JSON.stringify(candidate, null, 2)}</pre>
      </details>
    </div>
  );
}

// ─── Voting Rules ─────────────────────────────────────────────────────────────

function VotingRulesPanel({ cycle, ballotQuestion }) {
  const [open, setOpen] = useState(true);
  const min = ballotQuestion?.minSelections ?? 1;
  const max = ballotQuestion?.maxSelections ?? 4;
  const total = ballotQuestion?.options?.length ?? 0;

  return (
    <div style={{ border: "1px solid color-mix(in srgb,var(--accent,#5eead4) 30%,transparent)", borderRadius: 12, background: "color-mix(in srgb,var(--accent,#5eead4) 4%,var(--panel))", marginBottom: "1rem", overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", padding: "0.85rem 1.1rem", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", color: "var(--text)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "0.88rem" }}>
          <span aria-hidden="true">🗳️</span> Voting rules
        </span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, transition: "transform .15s", transform: open ? "rotate(180deg)" : "none", color: "var(--text-muted)" }}>
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: "0 1.1rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.84rem", lineHeight: 1.65, color: "var(--text-muted)" }}>
          <p style={{ margin: 0 }}>
            This is an <strong style={{ color: "var(--text)" }}>approval vote</strong> — your choices are not ranked.
            Select between <strong style={{ color: "var(--text)" }}>{min}</strong> and{" "}
            <strong style={{ color: "var(--text)" }}>{max}</strong> of the {total || "listed"} candidates you want to
            serve on the Constitutional Committee, then submit your ballot once.
          </p>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <li>Only registered DReps may vote, weighted by their delegated voting power.</li>
            <li>You can change your selections and resubmit at any time before voting closes — each submission replaces your previous ballot.</li>
            <li>Approving a candidate does not rank or weight them against each other; every approved candidate counts equally.</li>
            <li>Voting closes <strong style={{ color: "var(--text)" }}>{formatDateTime(cycle?.votingEndDate)}</strong>. Votes cannot be changed after that.</li>
          </ul>
          <p style={{ margin: 0 }}>
            Click <strong style={{ color: "var(--text)" }}>Sign in to vote</strong> on any candidate to authenticate your
            wallet, then use <strong style={{ color: "var(--text)" }}>Approve</strong> on up to {max} candidates. A bar
            at the bottom of the page lets you review and submit your staged selections.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Candidate Card ──────────────────────────────────────────────────────────

// CC election ballot is a single approval vote: "select up to N candidates".
// `voteState.selected` is a Set of candidateIds currently approved (staged or confirmed).
function VoteButtonRow({ candidateId, voteState }) {
  if (!voteState) return null;
  const { authed, authLoading, selected, maxSelections, isConfirmed, onToggle, onAuth } = voteState;
  if (!authed) {
    return (
      <button onClick={e => { e.stopPropagation(); onAuth(); }} disabled={authLoading}
        style={{ padding: "0.28rem 0.75rem", borderRadius: 6, fontSize: "0.76rem", fontWeight: 600, cursor: "pointer",
          border: "1px solid var(--accent,#5eead4)", background: "color-mix(in srgb,var(--accent,#5eead4) 12%,transparent)",
          color: "var(--accent,#5eead4)" }}>
        {authLoading ? "Signing in…" : "Sign in to vote"}
      </button>
    );
  }
  const active = selected.has(candidateId);
  const atLimit = !active && maxSelections && selected.size >= maxSelections;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
      <button onClick={() => !atLimit && onToggle(candidateId)} disabled={atLimit}
        style={{ padding: "0.25rem 0.8rem", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, cursor: atLimit ? "not-allowed" : "pointer",
          border: `1px solid ${active ? "var(--accent,#5eead4)" : "var(--line)"}`,
          background: active ? "color-mix(in srgb,var(--accent,#5eead4) 18%,transparent)" : "transparent",
          color: active ? "var(--accent,#5eead4)" : "var(--text-muted)", opacity: atLimit ? 0.5 : 1, transition: "all 0.12s" }}>
        {active ? "✓ Approved" : "Approve"}
      </button>
      {active && !isConfirmed && <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>staged</span>}
      {active && isConfirmed && <span style={{ fontSize: "0.68rem", color: "var(--accent,#5eead4)" }}>submitted</span>}
    </div>
  );
}

function CandidateCard({ candidate, onClick, voteState }) {
  const track   = getTrack(candidate);
  const name    = getCandidateName(candidate);
  const tc      = TRACK_COLORS[track] || { bg: "var(--panel)", border: "var(--line)", text: "var(--text-muted)" };
  const initials = name.split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase() || "?";
  const md      = candidate?.metaData || {};
  const bio     = candidate.summary || md.biography || md.organisationDescription || md.motivation || "";
  const links   = [...(md.links || []), ...(md.socialLinks || [])].filter(l => l?.url);

  return (
    <button onClick={onClick} style={{ display: "block", width: "100%", textAlign: "left", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "1rem 1.1rem", cursor: "pointer", transition: "border-color .15s,box-shadow .15s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent,#5eead4)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(94,234,212,.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <TrackBadge type={track} />
          <StatusBadge status={candidate.status} />
        </div>
        {candidate.commentCount > 0 && <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", flexShrink: 0 }}>💬 {candidate.commentCount}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: tc.bg, border: `2px solid ${tc.border}`, color: tc.text, fontSize: "0.95rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, letterSpacing: "-0.02em" }}>
          {initials}
        </div>
        <p style={{ margin: 0, fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.3, color: "var(--text)" }}>{name}</p>
      </div>
      {bio && <p style={{ margin: "0 0 0.5rem", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{bio}</p>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.35rem" }}>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Submitted {formatDate(candidate.submittedAt)}</span>
        {links.length > 0 && <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.2rem" }}><ExternalLinkIcon /> {links.length} link{links.length !== 1 ? "s" : ""}</span>}
      </div>
      {voteState && (
        <div style={{ marginTop: "0.6rem", paddingTop: "0.6rem", borderTop: "1px solid var(--line)" }}>
          <VoteButtonRow candidateId={candidate._id} voteState={voteState} />
        </div>
      )}
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

function DetailField({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</p>
      <RichText text={value} />
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
      await doWalletAuth(walletApi, walletRewardAddress);
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
    <div style={{ border: "1px solid var(--line)", borderRadius: 16, background: "var(--panel)", padding: "1.75rem", marginBottom: "1.25rem" }}>
      <p style={{ margin: "0 0 1.25rem", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Comments</p>

      {/* Compose */}
      <div style={{
        border: "1px solid var(--line)", borderRadius: 10, padding: "0.9rem 1rem",
        background: "var(--bg)", marginBottom: "1rem",
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
                border: "1px solid var(--line)", background: "var(--panel)",
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
            background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 9,
          }}>
            <p style={{ margin: "0 0 0.3rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--text)" }}>{c.author?.name || c.author?._id || "Anonymous"}</strong>
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

function CandidateDetail({ candidate, onBack, isAdmin = false, walletApi, walletRewardAddress, voteState }) {
  const md    = candidate?.metaData || {};
  const track = getTrack(candidate);
  const td    = md[track] || {};
  const name  = getCandidateName(candidate);
  const tc    = TRACK_COLORS[track] || { bg: "var(--panel)", border: "var(--line)", text: "var(--text-muted)" };

  const initials = name.split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase() || "?";

  const links = [
    td.xUsername        && { title: "X / Twitter", url: `https://x.com/${td.xUsername}` },
    td.linkedinUsername && { title: "LinkedIn",    url: `https://linkedin.com/in/${td.linkedinUsername}` },
    td.website          && { title: "Website",     url: td.website },
    ...(Array.isArray(td.otherLinks) ? td.otherLinks : []),
    ...(Array.isArray(md.links) ? md.links : []),
  ].filter(Boolean).filter((l, i, a) => l?.url && a.findIndex(x => x.url === l.url) === i);

  const coldKey  = md.coldCredentialHash || "";
  const credType = md.coldCredentialType || md.credentialType || "";
  const region   = resolveRegion(td.geographicRegion) || resolveRegion(md.geographicRegion);
  const poolId   = td.poolId             || md.poolId           || "";
  const drepId   = td.drepId             || md.drepId           || "";

  const govFields = [
    ["Professional Background",          td.professionalBackground || td.organisationalAreasOfExpertise || md.professionalBackground],
    ["Governance Experience",             td.governanceExperience   || md.governanceExperience],
    ["Brief Biography",                   td.briefBiography         || td.organisationDescription       || md.biography],
    ["Conflict of Interest",              td.conflictOfInterestStatement || md.conflictOfInterest],
    ["Cardano Contributions",             td.contributionsToCardano || md.cardanoContributions],
    ["Motivation",                        td.motivation             || md.motivation],
    ["Views on Decentralised Governance", td.decentralisedGovernanceImportance || md.decentralisationViews],
    ["Constitutional Interpretation",     td.constitutionalInterpretation      || md.constitutionalInterpretation],
    ["Unique Perspective / Skills",       td.perspectiveYouWouldBring          || md.uniquePerspective],
    ["Transparency & Communication Plan", td.transparencyApproach              || md.transparencyPlan],
    ["Internal Decision-Making Process",  td.internalDecisionMakingProcess     || md.internalDecisionMaking],
  ].filter(([, v]) => v);

  const adminFields = [
    ["Contact Email",  td.contactEmail  || md.contactEmail],
    ["Contact Person", td.contactPerson || md.contactPerson],
  ].filter(([, v]) => v);

  const members = md.consortium?.members || md.members || [];

  const SectionLabel = ({ children }) => (
    <p style={{ margin: "0 0 1.25rem", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
      <span style={{ flex: 1, height: 1, background: "var(--line)", display: "inline-block" }} />
      {children}
      <span style={{ flex: 1, height: 1, background: "var(--line)", display: "inline-block" }} />
    </p>
  );

  const GovField = ({ label, value }) => value ? (
    <div style={{ paddingBottom: "1.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--line)" }}>
      <p style={{ margin: "0 0 0.5rem", fontSize: "0.67rem", fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: tc.text, opacity: 0.85 }}>{label}</p>
      <RichText text={value} />
    </div>
  ) : null;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Back */}
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.82rem", padding: "0 0 1.5rem", transition: "color .15s" }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--text)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Back to candidates
      </button>

      {/* Hero card */}
      <div style={{ border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", background: "var(--panel)", marginBottom: "1.25rem" }}>
        {/* Accent bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${tc.text} 0%, transparent 100%)`, opacity: 0.7 }} />

        <div style={{ padding: "1.75rem 1.75rem 1.5rem" }}>
          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", marginBottom: "1.25rem" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: tc.bg, border: `2px solid ${tc.border}`, color: tc.text, fontSize: "1.3rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, letterSpacing: "-0.02em" }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: "0.1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <TrackBadge type={track} />
                <StatusBadge status={candidate.status} />
              </div>
              <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15 }}>{name}</h1>
            </div>
          </div>

          {/* Summary */}
          {(candidate.summary || td.briefBiography || md.biography) && (
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.75, borderLeft: `3px solid ${tc.border}`, paddingLeft: "0.9rem" }}>
              {candidate.summary || td.briefBiography || md.biography}
            </p>
          )}

          {/* Meta chips */}
          {(region || poolId || drepId) && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: links.length > 0 ? "0.85rem" : 0 }}>
              {region && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", padding: "0.25rem 0.65rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--line)", color: "var(--text)" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>Region</span> {region}
                </span>
              )}
              {poolId && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", padding: "0.25rem 0.65rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--line)", color: "var(--accent,#5eead4)", fontFamily: "monospace" }}>
                  <span style={{ color: "var(--text-muted)", fontFamily: "inherit", fontSize: "0.68rem" }}>Pool</span> {poolId}
                </span>
              )}
              {drepId && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", padding: "0.25rem 0.65rem", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--line)", color: "var(--accent,#5eead4)", fontFamily: "monospace" }}>
                  <span style={{ color: "var(--text-muted)", fontFamily: "inherit", fontSize: "0.68rem" }}>DRep</span> {drepId}
                </span>
              )}
            </div>
          )}

          {/* Links */}
          {links.length > 0 && (
            <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
              {links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: "var(--accent,#5eead4)", textDecoration: "none", padding: "0.3rem 0.75rem", border: "1px solid color-mix(in srgb,var(--accent,#5eead4) 30%,transparent)", borderRadius: 20, background: "color-mix(in srgb,var(--accent,#5eead4) 6%,transparent)", transition: "background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "color-mix(in srgb,var(--accent,#5eead4) 14%,transparent)"}
                  onMouseLeave={e => e.currentTarget.style.background = "color-mix(in srgb,var(--accent,#5eead4) 6%,transparent)"}>
                  <ExternalLinkIcon />{l.title || l.url}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Cold credential strip */}
        {coldKey && (
          <div style={{ padding: "1rem 1.75rem", borderTop: "1px solid var(--line)", background: "color-mix(in srgb,var(--accent,#5eead4) 3%,var(--bg))", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ color: "var(--accent,#5eead4)", marginTop: "0.2rem", flexShrink: 0 }}>
              <path d="M5.5 8.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 0L5 13.5l1.5-1 1 1.5 1-1.5 1.5 1L9 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Cold Credential{credType && <span style={{ color: "var(--accent,#5eead4)", marginLeft: "0.4rem" }}>· {credType}</span>}
              </p>
              <code style={{ fontSize: "0.76rem", fontFamily: "monospace", color: "var(--accent,#5eead4)", wordBreak: "break-all", lineHeight: 1.55 }}>{coldKey}</code>
            </div>
          </div>
        )}
      </div>

      {/* Vote panel */}
      {voteState && (
        <div style={{ border: "1px solid color-mix(in srgb,var(--accent,#5eead4) 30%,transparent)", borderRadius: 12, background: "color-mix(in srgb,var(--accent,#5eead4) 5%,var(--panel))", padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 0.2rem", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--accent,#5eead4)" }}>
              Your vote · Voting Open{voteState.maxSelections ? ` · ${voteState.selected.size} of ${voteState.maxSelections} selected` : ""}
            </p>
            {voteState.authError && <p style={{ margin: "0 0 0.4rem", fontSize: "0.78rem", color: "var(--red,#f87171)" }}>{voteState.authError}</p>}
            <VoteButtonRow candidateId={candidate?._id} voteState={voteState} />
          </div>
        </div>
      )}

      {/* Governance statement */}
      {govFields.length > 0 && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 16, background: "var(--panel)", padding: "1.75rem", marginBottom: "1.25rem" }}>
          <SectionLabel>Governance Statement</SectionLabel>
          <div>
            {govFields.map(([label, val], i) => (
              <div key={label} style={i === govFields.length - 1 ? { paddingBottom: 0, marginBottom: 0 } : { paddingBottom: "1.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--line)" }}>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.67rem", fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: tc.text, opacity: 0.9 }}>{label}</p>
                <RichText text={val} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consortium members */}
      {track === "consortium" && members.length > 0 && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 16, background: "var(--panel)", padding: "1.75rem", marginBottom: "1.25rem" }}>
          <SectionLabel>Consortium Members</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {members.map((m, i) => {
              const mName   = m.fullNameOrAlias || m.name || `Member ${i + 1}`;
              const mInit   = mName.split(/\s+/).slice(0,2).map(w => w[0] || "").join("").toUpperCase() || "?";
              const mRegion = resolveRegion(m.geographicRegion);
              const mPool   = m.poolId  || "";
              const mDrep   = m.drepId  || "";
              const mLinks  = [
                m.xUsername        && { title: "X / Twitter", url: `https://x.com/${m.xUsername}` },
                m.linkedinUsername && { title: "LinkedIn",    url: `https://linkedin.com/in/${m.linkedinUsername}` },
                m.website          && { title: "Website",     url: m.website },
                ...(Array.isArray(m.otherLinks) ? m.otherLinks : []),
              ].filter(Boolean).filter(l => l?.url);
              const mGovFields = [
                ["Brief Biography",          m.briefBiography],
                ["Professional Background",  m.professionalBackground],
                ["Governance Experience",    m.governanceExperience],
                ["Conflict of Interest",     m.conflictOfInterestStatement],
              ].filter(([, v]) => v);
              return (
                <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", background: "var(--bg)" }}>
                  {/* Member header */}
                  <div style={{ padding: "1rem 1.1rem", display: "flex", alignItems: "flex-start", gap: "0.9rem" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: tc.bg, border: `1.5px solid ${tc.border}`, color: tc.text, fontSize: "0.82rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {mInit}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 0.4rem", fontWeight: 700, fontSize: "0.92rem" }}>{mName}</p>
                      {(mRegion || mPool || mDrep) && (
                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: mLinks.length ? "0.5rem" : 0 }}>
                          {mRegion && <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.55rem", borderRadius: 5, background: "var(--panel)", border: "1px solid var(--line)" }}><span style={{ color: "var(--text-muted)" }}>Region </span>{mRegion}</span>}
                          {mPool   && <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.55rem", borderRadius: 5, background: "var(--panel)", border: "1px solid var(--line)", color: "var(--accent,#5eead4)", fontFamily: "monospace" }}><span style={{ color: "var(--text-muted)", fontFamily: "inherit" }}>Pool </span>{mPool}</span>}
                          {mDrep   && <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.55rem", borderRadius: 5, background: "var(--panel)", border: "1px solid var(--line)", color: "var(--accent,#5eead4)", fontFamily: "monospace" }}><span style={{ color: "var(--text-muted)", fontFamily: "inherit" }}>DRep </span>{mDrep}</span>}
                        </div>
                      )}
                      {mLinks.length > 0 && (
                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                          {mLinks.map((l, li) => (
                            <a key={li} href={l.url} target="_blank" rel="noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.73rem", color: "var(--accent,#5eead4)", textDecoration: "none", padding: "0.22rem 0.6rem", border: "1px solid color-mix(in srgb,var(--accent,#5eead4) 30%,transparent)", borderRadius: 20, background: "color-mix(in srgb,var(--accent,#5eead4) 6%,transparent)" }}>
                              <ExternalLinkIcon />{l.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Member governance fields */}
                  {mGovFields.length > 0 && (
                    <div style={{ borderTop: "1px solid var(--line)", padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: 0 }}>
                      {mGovFields.map(([label, val], fi) => (
                        <div key={label} style={fi < mGovFields.length - 1 ? { paddingBottom: "1rem", marginBottom: "1rem", borderBottom: "1px solid var(--line)" } : {}}>
                          <p style={{ margin: "0 0 0.4rem", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: tc.text, opacity: 0.85 }}>{label}</p>
                          <RichText text={val} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin-only private fields */}
      {isAdmin && adminFields.length > 0 && (
        <div style={{ border: "1px solid color-mix(in srgb,#f59e0b 35%,transparent)", borderRadius: 16, background: "color-mix(in srgb,#f59e0b 4%,transparent)", padding: "1.5rem 1.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f59e0b", background: "color-mix(in srgb,#f59e0b 14%,transparent)", border: "1px solid color-mix(in srgb,#f59e0b 35%,transparent)", borderRadius: 5, padding: "0.18rem 0.5rem" }}>Admin only</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Private — not visible to the public</span>
          </div>
          {adminFields.map(([label, val], i) => (
            <div key={label} style={i === adminFields.length - 1 ? {} : { paddingBottom: "1rem", marginBottom: "1rem", borderBottom: "1px solid color-mix(in srgb,#f59e0b 20%,transparent)" }}>
              <p style={{ margin: "0 0 0.35rem", fontSize: "0.67rem", fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: "#f59e0b", opacity: 0.8 }}>{label}</p>
              <RichText text={val} />
            </div>
          ))}
        </div>
      )}

      <CommentsSection proposalId={candidate?._id} walletApi={walletApi} walletRewardAddress={walletRewardAddress} />
    </div>
  );
}

// ─── Form primitives ──────────────────────────────────────────────────────────

const inp = { width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: "0.85rem", boxSizing: "border-box" };
const ta  = { ...inp, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 };
const lbl = { display: "block", marginBottom: "0.3rem", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)" };
const hint = { margin: "0 0 0.5rem", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.55 };

function FormSection({ number, title, children }) {
  return (
    <section style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", marginBottom: "1rem" }}>
      <div style={{ padding: "0.9rem 1.2rem", borderBottom: "1px solid var(--line)", background: "var(--panel)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent,#5eead4)", color: "#0a0f1a", fontSize: "0.72rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{number}</span>
        <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>{title}</span>
      </div>
      <div style={{ padding: "1.1rem 1.2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>{children}</div>
    </section>
  );
}

function Field({ label, help, required, count, children, private: isPrivate }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.3rem" }}>
        <label style={lbl}>{label}{required && " *"}{isPrivate && <span style={{ marginLeft: "0.4rem", fontSize: "0.65rem", fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text-muted)", opacity: 0.7 }}>private</span>}</label>
        {count && <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{count}</span>}
      </div>
      {help && <p style={hint}>{help}</p>}
      {children}
    </div>
  );
}

function RadioRow({ name, value, current, onChange, label, description }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }}>
      <input type="radio" name={name} value={value} checked={current === value} onChange={() => onChange(value)} style={{ accentColor: "var(--accent,#5eead4)", width: 15, height: 15, marginTop: "0.15rem", flexShrink: 0 }} />
      <span>
        <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>{label}</span>
        {description && <span style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{description}</span>}
      </span>
    </label>
  );
}

function LinkRow({ link, onChange, onRemove }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr auto", gap: "0.4rem", alignItems: "center" }}>
      <input value={link.title} onChange={e => onChange({ ...link, title: e.target.value })} placeholder="Label (e.g. Twitter)" style={inp} />
      <input value={link.url}   onChange={e => onChange({ ...link, url:   e.target.value })} placeholder="https://…" style={inp} />
      <button type="button" onClick={onRemove} style={{ padding: "0.5rem 0.65rem", border: "1px solid var(--line)", borderRadius: 7, background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
    </div>
  );
}

function LinkList({ links, setLinks }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {links.map((l, i) => (
        <LinkRow key={i} link={l}
          onChange={v => setLinks(ls => ls.map((x, j) => j === i ? v : x))}
          onRemove={()  => setLinks(ls => ls.filter((_, j) => j !== i))} />
      ))}
      <button type="button" onClick={() => setLinks(ls => [...ls, { title: "", url: "" }])}
        style={{ alignSelf: "flex-start", padding: "0.35rem 0.75rem", border: "1px dashed var(--line)", borderRadius: 7, background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}>
        + Add link
      </button>
    </div>
  );
}

const REGIONS = ["Africa", "Asia-Pacific", "Caribbean", "Central America & Mexico", "Eastern Europe", "Latin America", "Middle East", "North America", "Oceania", "South Asia", "Southeast Asia", "Western Europe", "Other / Global"];

const REGION_ID_MAP = {
  "69fdd609097eb3121a64b4d3": "Africa",
  "69fdd609097eb3121a64b4d4": "Asia-Pacific",
  "69fdd609097eb3121a64b4d5": "Caribbean",
  "69fdd609097eb3121a64b4d6": "Central America & Mexico",
  "69fdd609097eb3121a64b4d7": "Eastern Europe",
  "69fdd609097eb3121a64b4d8": "Latin America",
  "69fdd609097eb3121a64b4d9": "Middle East",
  "69fdd609097eb3121a64b4da": "North America",
  "69fdd609097eb3121a64b4db": "Oceania",
  "69fdd609097eb3121a64b4dd": "South Asia",
  "69fdd609097eb3121a64b4de": "Southeast Asia",
  "69fdd609097eb3121a64b4df": "Western Europe",
  "69fdd609097eb3121a64b4dc": "Other / Global",
};

const REGION_LABEL_TO_ID = Object.fromEntries(
  Object.entries(REGION_ID_MAP).map(([id, label]) => [label, id])
);

function resolveRegion(v) {
  if (!v) return "";
  return REGION_ID_MAP[v] || (REGIONS.includes(v) ? v : "");
}

function regionToId(v) {
  if (!v) return "";
  return REGION_LABEL_TO_ID[v] || v;
}

function RegionSelect({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inp, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", paddingRight: "2.25rem", cursor: "pointer" }}>
      <option value="">No region (optional)</option>
      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
    </select>
  );
}

function SocialLinksFields({ xUsername, onX, linkedinUsername, onLinkedin, website, onWebsite, otherLinks, onOtherLinks }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <Field label="X / Twitter">
        <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
          <span style={{ padding: "0.6rem 0.75rem", background: "var(--panel)", borderRight: "1px solid var(--line)", fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>x.com/</span>
          <input value={xUsername} onChange={e => onX(e.target.value)} maxLength={100} placeholder="username" style={{ ...inp, border: "none", borderRadius: 0, flex: 1 }} />
        </div>
      </Field>
      <Field label="LinkedIn">
        <div style={{ display: "flex", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
          <span style={{ padding: "0.6rem 0.75rem", background: "var(--panel)", borderRight: "1px solid var(--line)", fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>linkedin.com/in/</span>
          <input value={linkedinUsername} onChange={e => onLinkedin(e.target.value)} maxLength={100} placeholder="username" style={{ ...inp, border: "none", borderRadius: 0, flex: 1 }} />
        </div>
      </Field>
      <Field label="Website">
        <input value={website} onChange={e => onWebsite(e.target.value)} placeholder="https://example.com" style={inp} />
      </Field>
      <Field label="Additional Links">
        <LinkList links={otherLinks} setLinks={onOtherLinks} />
      </Field>
    </div>
  );
}

// ─── Track Selector ───────────────────────────────────────────────────────────

function TrackSelector({ value, onChange }) {
  const tracks = [
    { key: "individual",   label: "Individual",   desc: "A single person standing for election to the CC." },
    { key: "organisation", label: "Organisation", desc: "A legal entity or company applying as a single CC seat." },
    { key: "consortium",   label: "Consortium",   desc: "A group of at least two individuals applying jointly." },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {tracks.map(t => {
        const active = value === t.key;
        const c = TRACK_COLORS[t.key];
        return (
          <button key={t.key} type="button" onClick={() => onChange(t.key)} style={{ padding: "0.85rem 1rem", borderRadius: 10, textAlign: "left", border: `1px solid ${active ? c.border : "var(--line)"}`, background: active ? c.bg : "transparent", cursor: "pointer", transition: "all .15s" }}>
            <span style={{ display: "block", fontWeight: 700, fontSize: "0.92rem", color: active ? c.text : "var(--text)" }}>{t.label}</span>
            <span style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{t.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current, total, label }) {
  return (
    <div style={{ marginBottom: "1.75rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.55rem" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Step {current + 1} of {total}
        </span>
        <span style={{ fontSize: "0.92rem", fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= current ? "var(--accent,#5eead4)" : "var(--line)", transition: "background .25s" }} />
        ))}
      </div>
    </div>
  );
}

// ─── Nomination Form ──────────────────────────────────────────────────────────

function NominationForm({ cycle, walletApi, walletRewardAddress, initialData, onSuccess }) {
  const navigate = useNavigate();

  const [authed,      setAuthed]      = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError,   setAuthError]   = useState("");

  const [draftId,    setDraftId]    = useState(() => initialData?._id || null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaved,  setDraftSaved]  = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [done,        setDone]        = useState(false);

  const md = initialData?.metaData || {};
  const initTrack = () => String(md.track || md.applicantType || "individual").toLowerCase();
  const [track, setTrack] = useState(initTrack);

  // Track-specific sub-object from saved data
  const itd = md[initTrack()] || {};

  // §1 – identity
  const [fullName,         setFullName]         = useState(() => initialData?.title || itd.fullNameOrAlias || itd.organisationName || itd.consortiumName || "");
  const [contactEmail,     setContactEmail]     = useState(() => itd.contactEmail || "");
  const [contactPerson,    setContactPerson]    = useState(() => itd.contactPerson || "");
  const [geographicRegion, setGeographicRegion] = useState(() => resolveRegion(itd.geographicRegion) || "");
  const [poolId,           setPoolId]           = useState(() => itd.poolId || "");
  const [drepId,           setDrepId]           = useState(() => itd.drepId || "");
  const [xUsername,        setXUsername]        = useState(() => itd.xUsername || "");
  const [linkedinUsername, setLinkedinUsername] = useState(() => itd.linkedinUsername || "");
  const [website,          setWebsite]          = useState(() => itd.website || "");
  const [otherLinks,       setOtherLinks]       = useState(() => Array.isArray(itd.otherLinks) ? itd.otherLinks.filter(l => l?.url) : []);
  const [orgDescription,   setOrgDescription]   = useState(() => itd.organisationDescription || "");

  // §2 – background
  const [professionalBackground, setProfessionalBackground] = useState(() => itd.professionalBackground || itd.organisationalAreasOfExpertise || "");
  const [governanceExperience,   setGovernanceExperience]   = useState(() => itd.governanceExperience || "");

  // §3 – governance statement
  const [biography,              setBiography]              = useState(() => itd.briefBiography || initialData?.summary || "");
  const [conflictOfInterest,     setConflictOfInterest]     = useState(() => itd.conflictOfInterestStatement || "");
  const [cardanoContributions,   setCardanoContributions]   = useState(() => itd.contributionsToCardano || "");
  const [motivation,             setMotivation]             = useState(() => itd.motivation || "");
  const [decentralisationViews,  setDecentralisationViews]  = useState(() => itd.decentralisedGovernanceImportance || "");
  const [constitutionalInterp,   setConstitutionalInterp]   = useState(() => itd.constitutionalInterpretation || "");
  const [uniquePerspective,      setUniquePerspective]      = useState(() => itd.perspectiveYouWouldBring || "");
  const [transparencyPlan,       setTransparencyPlan]       = useState(() => itd.transparencyApproach || "");
  const [internalDecisionMaking, setInternalDecisionMaking] = useState(() => itd.internalDecisionMakingProcess || md.consortium?.internalDecisionMakingProcess || "");

  // §4 – cold credentials
  const [coldCredentialHash, setColdCredentialHash] = useState(() => md.coldCredentialHash || "");
  const [credentialType,     setCredentialType]     = useState(() => { const t = md.coldCredentialType || "keyCredential"; return (t === "Key Credential" || t === "Key credential") ? "keyCredential" : (t === "Script Credential" || t === "Script credential") ? "scriptCredential" : t; });

  // §5 – consortium members
  const emptyMem = () => ({ name: "", geographicRegion: "", poolId: "", drepId: "", xUsername: "", linkedinUsername: "", website: "", otherLinks: [], bio: "", professionalBackground: "", governanceExperience: "", conflictOfInterest: "" });
  const [members, setMembers] = useState(() => {
    const m = md.consortium?.members || [];
    const mapped = m.map(mem => ({
      ...emptyMem(),
      name: mem.fullNameOrAlias || "",
      geographicRegion: resolveRegion(mem.geographicRegion) || "",
      poolId: mem.poolId || "",
      drepId: mem.drepId || "",
      xUsername: mem.xUsername || "",
      linkedinUsername: mem.linkedinUsername || "",
      website: mem.website || "",
      otherLinks: Array.isArray(mem.otherLinks) ? mem.otherLinks.filter(l => l?.url) : [],
      bio: mem.briefBiography || "",
      professionalBackground: mem.professionalBackground || "",
      governanceExperience: mem.governanceExperience || "",
      conflictOfInterest: mem.conflictOfInterestStatement || "",
    }));
    return mapped.length >= 2 ? mapped : [emptyMem(), emptyMem()];
  });

  // §6 – declarations
  const [declAccuracy,   setDeclAccuracy]   = useState(() => Boolean(md.declarationAgreement?.accuracyPublicVisibilityConsent));
  const [declPublic,     setDeclPublic]     = useState(() => Boolean(md.declarationAgreement?.accuracyPublicVisibilityConsent));
  const [declVouching,   setDeclVouching]   = useState(() => Boolean(md.declarationAgreement?.memberIdentityVouching));
  const [declTerms,      setDeclTerms]      = useState(() => Boolean(md.declarationAgreement?.termsAndConditionsAgreement));

  async function handleAuth() {
    setAuthLoading(true); setAuthError("");
    try { await doWalletAuth(walletApi, walletRewardAddress); setAuthed(true); }
    catch (e) { setAuthError(e.message || "Authentication failed."); }
    finally { setAuthLoading(false); }
  }

  function buildPayload(status = "draft") {
    const clean = v => String(v || "").trim();
    const cleanLinks = arr => (arr || []).filter(l => clean(l.url)).map(l => ({ title: clean(l.title) || clean(l.url), url: clean(l.url) }));

    const sharedGov = {
      xUsername: clean(xUsername), linkedinUsername: clean(linkedinUsername),
      website: clean(website), otherLinks: cleanLinks(otherLinks),
      conflictOfInterestStatement:       clean(conflictOfInterest),
      contributionsToCardano:            clean(cardanoContributions),
      motivation:                        clean(motivation),
      decentralisedGovernanceImportance: clean(decentralisationViews),
      constitutionalInterpretation:      clean(constitutionalInterp),
      perspectiveYouWouldBring:          clean(uniquePerspective),
      transparencyApproach:              clean(transparencyPlan),
    };

    const emptyGov = { xUsername: "", linkedinUsername: "", website: "", otherLinks: [], conflictOfInterestStatement: "", contributionsToCardano: "", motivation: "", decentralisedGovernanceImportance: "", constitutionalInterpretation: "", perspectiveYouWouldBring: "", transparencyApproach: "" };
    const emptyMember = { fullNameOrAlias: "", geographicRegion: "", briefBiography: "", professionalBackground: "", governanceExperience: "", xUsername: "", linkedinUsername: "", website: "", otherLinks: [], conflictOfInterestStatement: "" };
    const cleanMember = m => { const r = { ...m }; if (!r.poolId) delete r.poolId; if (!r.drepId) delete r.drepId; return r; };

    return {
      voteId: cycle._id,
      status,
      title: clean(fullName) || "Unnamed Candidate",
      summary: clean(biography) || clean(orgDescription),
      metaData: {
        track,
        coldCredentialHash: clean(coldCredentialHash),
        coldCredentialType: clean(credentialType).toLowerCase().includes("script") ? "scriptCredential" : "keyCredential",
        declarationAgreement: {
          accuracyPublicVisibilityConsent: declAccuracy && declPublic,
          termsAndConditionsAgreement:     declTerms,
          memberIdentityVouching:          declVouching,
        },
        individual: track === "individual" ? cleanMember({
          fullNameOrAlias: clean(fullName), contactEmail: clean(contactEmail),
          geographicRegion: regionToId(geographicRegion), poolId: clean(poolId), drepId: clean(drepId),
          professionalBackground: clean(professionalBackground), governanceExperience: clean(governanceExperience),
          briefBiography: clean(biography), ...sharedGov,
        }) : { fullNameOrAlias: "", contactEmail: "", geographicRegion: "", professionalBackground: "", governanceExperience: "", briefBiography: "", ...emptyGov },
        organisation: track === "organisation" ? cleanMember({
          organisationName: clean(fullName), organisationDescription: clean(orgDescription),
          geographicRegion: regionToId(geographicRegion), contactPerson: clean(contactPerson), contactEmail: clean(contactEmail),
          poolId: clean(poolId), drepId: clean(drepId),
          organisationalAreasOfExpertise: clean(professionalBackground), governanceExperience: clean(governanceExperience),
          ...sharedGov,
        }) : { organisationName: "", organisationDescription: "", geographicRegion: "", contactPerson: "", contactEmail: "", organisationalAreasOfExpertise: "", governanceExperience: "", ...emptyGov },
        consortium: track === "consortium" ? {
          consortiumName: clean(fullName), contactPerson: clean(contactPerson), contactEmail: clean(contactEmail),
          internalDecisionMakingProcess: clean(internalDecisionMaking),
          members: members.map(m => cleanMember({
            ...emptyMember,
            fullNameOrAlias: clean(m.name), geographicRegion: regionToId(m.geographicRegion),
            poolId: clean(m.poolId), drepId: clean(m.drepId),
            xUsername: clean(m.xUsername), linkedinUsername: clean(m.linkedinUsername),
            website: clean(m.website), otherLinks: cleanLinks(m.otherLinks),
            briefBiography: clean(m.bio),
            professionalBackground: clean(m.professionalBackground),
            governanceExperience: clean(m.governanceExperience),
            conflictOfInterestStatement: clean(m.conflictOfInterest),
          })),
          ...sharedGov,
        } : { consortiumName: "", contactPerson: "", contactEmail: "", internalDecisionMakingProcess: "", members: [], ...emptyGov },
      },
    };
  }

  async function saveDraft() {
    setDraftSaving(true); setDraftSaved(false); setSubmitError("");
    try {
      const payload = buildPayload("draft");
      if (draftId) {
        await apiFetch(`/proposals/${draftId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        const res = await apiFetch("/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const id = res?._id || res?.data?._id;
        if (id) { setDraftId(id); navigate(`${BASE_PATH}/submit/${id}`, { replace: true }); }
      }
      setDraftSaved(true); setTimeout(() => setDraftSaved(false), 3000);
    } catch (e) { setSubmitError(e.message || "Failed to save draft."); }
    finally { setDraftSaving(false); }
  }

  async function handleSubmit(status) {
    setSubmitting(true); setSubmitError("");
    try {
      const payload = buildPayload(status);
      console.log("Submitting payload metaData:", JSON.stringify(payload.metaData, null, 2));
      if (draftId) {
        await apiFetch(`/proposals/${draftId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        const res = await apiFetch("/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const id = res?._id || res?.data?._id;
        if (id) setDraftId(id);
      }
      setDone(true); setTimeout(() => onSuccess?.(), 1500);
    } catch (e) { setSubmitError(e.message || "Submission failed."); }
    finally { setSubmitting(false); }
  }

  useAutoRefreshAt(cycle?.submissionStartDate);

  const declOk = declAccuracy && declPublic && declTerms && (track !== "consortium" || declVouching);

  const submissionOpen = cycle ? new Date() >= new Date(cycle.submissionStartDate) && new Date() <= new Date(cycle.submissionEndDate) : false;

  const govTA = (val, set, ph, maxLen = 3000) => (
    <textarea value={val} onChange={e => set(e.target.value)} maxLength={maxLen} rows={5} placeholder={ph} style={ta} />
  );

  // ── Wizard step management ──
  const stepKeys = useMemo(() => {
    if (track === "consortium") return ["track", "identity", "governance", "credentials", "members", "declaration"];
    return ["track", "identity", "background", "governance", "credentials", "declaration"];
  }, [track]);

  const stepLabels = useMemo(() => ({
    track: "Candidate Track",
    identity: track === "individual" ? "Identity & Contact" : track === "organisation" ? "Organisation Details" : "Consortium Details",
    background: "Background & Expertise",
    governance: track === "consortium" ? "Consortium Governance" : track === "individual" ? "Biography & Governance" : "Governance Statement",
    credentials: "Cold Credentials",
    members: "Consortium Members",
    declaration: "Declaration & Agreement",
  }), [track]);

  const [step, setStep] = useState(0);
  const currentKey = stepKeys[step];
  const isLastStep = step === stepKeys.length - 1;

  function goNext() {
    if (authed) saveDraft();
    setStep(s => Math.min(s + 1, stepKeys.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goBack() {
    setStep(s => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      {/* Wallet auth — always visible at top */}
      {!walletApi && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "0.9rem 1.1rem", background: "var(--panel)", marginBottom: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>Connect your wallet using the button in the top bar to save and submit.</p>
        </div>
      )}
      {walletApi && !authed && (
        <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "0.9rem 1.1rem", background: "var(--panel)", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>Sign in with your wallet to save drafts and submit.</p>
          <button onClick={handleAuth} disabled={authLoading} className="btn-outline" style={{ fontSize: "0.82rem" }}>
            {authLoading ? "Signing…" : "Sign in with Wallet"}
          </button>
          {authError && <span style={{ fontSize: "0.8rem", color: "var(--red,#f87171)", width: "100%" }}>{authError}</span>}
        </div>
      )}

      {/* Step progress indicator */}
      <StepIndicator current={step} total={stepKeys.length} label={stepLabels[currentKey]} />

      {/* ── Step content ── */}

      {currentKey === "track" && (
        <FormSection number={step + 1} title="Candidate Track">
          <p style={hint}>Select the track that best describes your candidacy.</p>
          <TrackSelector value={track} onChange={v => { setTrack(v); setMembers(ms => ms.length >= 2 ? ms : [{ name: "", role: "", bio: "" }, { name: "", role: "", bio: "" }]); }} />
        </FormSection>
      )}

      {currentKey === "identity" && track === "individual" && (
        <FormSection number={step + 1} title="Identity & Contact">
          <Field label="Full Name / Alias" required help="Your publicly displayed name.">
            <input value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100} placeholder="Your name or public alias" style={inp} />
          </Field>
          <Field label="Contact Email" required private help="Used for election communications. Not publicly displayed.">
            <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} maxLength={254} placeholder="you@example.com" style={{ ...inp, maxWidth: 360 }} />
          </Field>
          <Field label="Geographic Region" help="The region you primarily represent (optional).">
            <RegionSelect value={geographicRegion} onChange={setGeographicRegion} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Field label="Pool ID" help="Your stake pool ID, if applicable."><input value={poolId} onChange={e => setPoolId(e.target.value)} placeholder="pool1…" style={inp} /></Field>
            <Field label="DRep ID"  help="Your DRep ID, if applicable."><input value={drepId}  onChange={e => setDrepId(e.target.value)}  placeholder="drep1…" style={inp} /></Field>
          </div>
          <SocialLinksFields xUsername={xUsername} onX={setXUsername} linkedinUsername={linkedinUsername} onLinkedin={setLinkedinUsername} website={website} onWebsite={setWebsite} otherLinks={otherLinks} onOtherLinks={setOtherLinks} />
        </FormSection>
      )}

      {currentKey === "identity" && track === "organisation" && (
        <FormSection number={step + 1} title="Organisation Details">
          <Field label="Organisation Name" required help="Publicly displayed name of your organisation.">
            <input value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100} placeholder="Organisation name" style={inp} />
          </Field>
          <Field label="Organisational Description" required count={`${orgDescription.length}/1000`}>
            <textarea value={orgDescription} onChange={e => setOrgDescription(e.target.value)} maxLength={1000} rows={3} placeholder="Brief description of your organisation…" style={ta} />
          </Field>
          <Field label="Geographic Region">
            <RegionSelect value={geographicRegion} onChange={setGeographicRegion} />
          </Field>
          <Field label="Contact Person" required private><input value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Name of primary contact" style={{ ...inp, maxWidth: 360 }} /></Field>
          <Field label="Contact Email"  required private><input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} maxLength={254} placeholder="contact@org.com" style={{ ...inp, maxWidth: 360 }} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Field label="Pool ID"><input value={poolId} onChange={e => setPoolId(e.target.value)} placeholder="pool1…" style={inp} /></Field>
            <Field label="DRep ID"><input value={drepId}  onChange={e => setDrepId(e.target.value)} placeholder="drep1…" style={inp} /></Field>
          </div>
          <SocialLinksFields xUsername={xUsername} onX={setXUsername} linkedinUsername={linkedinUsername} onLinkedin={setLinkedinUsername} website={website} onWebsite={setWebsite} otherLinks={otherLinks} onOtherLinks={setOtherLinks} />
        </FormSection>
      )}

      {currentKey === "identity" && track === "consortium" && (
        <FormSection number={step + 1} title="Consortium Details">
          <Field label="Consortium Name" required><input value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100} placeholder="Consortium name" style={inp} /></Field>
          <Field label="Contact Person"  required private><input value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Primary contact name" style={{ ...inp, maxWidth: 360 }} /></Field>
          <Field label="Contact Email"   required private><input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} maxLength={254} placeholder="contact@example.com" style={{ ...inp, maxWidth: 360 }} /></Field>
          <SocialLinksFields xUsername={xUsername} onX={setXUsername} linkedinUsername={linkedinUsername} onLinkedin={setLinkedinUsername} website={website} onWebsite={setWebsite} otherLinks={otherLinks} onOtherLinks={setOtherLinks} />
        </FormSection>
      )}

      {currentKey === "background" && (
        <FormSection number={step + 1} title="Background & Expertise">
          <Field label={track === "individual" ? "Professional Background" : "Areas of Expertise"} required count={`${professionalBackground.length}/2000`}>
            {govTA(professionalBackground, setProfessionalBackground, "Describe your professional background and areas of expertise…", 2000)}
          </Field>
          <Field label="Governance Experience" required count={`${governanceExperience.length}/2000`} help="Experience with governance at any level — Cardano, corporate, civic, or other.">
            {govTA(governanceExperience, setGovernanceExperience, "Describe your governance experience…", 2000)}
          </Field>
        </FormSection>
      )}

      {currentKey === "governance" && (
        <FormSection number={step + 1} title={track === "consortium" ? "Consortium Governance Statement" : track === "individual" ? "Biography & Governance Statement" : "Governance Statement"}>
          {track === "individual" && (
            <Field label="Brief Biography" required count={`${biography.length}/2000`} help="Who you are — background, community involvement, Cardano journey.">
              {govTA(biography, setBiography, "Write your biography…", 2000)}
            </Field>
          )}
          <Field label="Conflict of Interest" help="Disclose any potential conflicts. Leave blank if none." count={`${conflictOfInterest.length}/2000`}>
            {govTA(conflictOfInterest, setConflictOfInterest, "Disclose any conflicts of interest, or leave blank…", 2000)}
          </Field>
          <Field label={track === "consortium" ? "Member Contributions to Cardano" : "Cardano Contributions"} required count={`${cardanoContributions.length}/2000`}>
            {govTA(cardanoContributions, setCardanoContributions, "Describe your contributions to the Cardano ecosystem…", 2000)}
          </Field>
          <Field label="Motivation" required count={`${motivation.length}/2000`} help="Why are you running for the Constitutional Committee?">
            {govTA(motivation, setMotivation, "Explain your motivation for standing as a CC member…", 2000)}
          </Field>
          <Field label={track === "consortium" ? "Importance of Decentralisation" : "Views on Decentralised Governance"} required count={`${decentralisationViews.length}/2000`}>
            {govTA(decentralisationViews, setDecentralisationViews, "Describe your views on decentralised governance…", 2000)}
          </Field>
          <Field label="Constitutional Interpretation Approach" required count={`${constitutionalInterp.length}/2000`} help="How would you interpret the Cardano Constitution when reviewing governance actions?">
            {govTA(constitutionalInterp, setConstitutionalInterp, "Describe your approach to interpreting the Constitution…", 2000)}
          </Field>
          <Field label={track === "consortium" ? "Unique Strengths" : "Unique Perspective / Skills"} required count={`${uniquePerspective.length}/2000`}>
            {govTA(uniquePerspective, setUniquePerspective, "What unique perspective or skills do you bring…", 2000)}
          </Field>
          <Field label="Transparency & Communication Plan" required count={`${transparencyPlan.length}/2000`} help="How will you communicate your decisions and reasoning to the community?">
            {govTA(transparencyPlan, setTransparencyPlan, "Describe your transparency and communication approach…", 2000)}
          </Field>
          {track === "consortium" && (
            <Field label="Internal Decision-Making Process" required count={`${internalDecisionMaking.length}/2000`} help="How does your consortium reach consensus on governance votes?">
              {govTA(internalDecisionMaking, setInternalDecisionMaking, "Describe how your consortium makes decisions…", 2000)}
            </Field>
          )}
        </FormSection>
      )}

      {currentKey === "credentials" && (
        <FormSection number={step + 1} title="Cold Credentials">
          <p style={hint}>You must generate a CC cold key before submission. See the <a href="https://docs.intersectmbo.org/cardano/constitutional-committee/cc-election-2026/cold-credential-guide" target="_blank" rel="noreferrer" style={{ color: "var(--accent,#5eead4)" }}>Cold Credential Guide</a>.</p>
          <Field label="Cold Credential Hash" required help="Your cc_cold1… credential hash." count={`${coldCredentialHash.length}/61`}>
            <input value={coldCredentialHash} onChange={e => setColdCredentialHash(e.target.value)} maxLength={61} placeholder="cc_cold1…" style={inp} />
          </Field>
          <Field label="Credential Type" required>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.2rem" }}>
              <RadioRow name="credType" value="keyCredential"    current={credentialType} onChange={setCredentialType} label="Key Credential" />
              <RadioRow name="credType" value="scriptCredential" current={credentialType} onChange={setCredentialType} label="Script Credential" />
            </div>
          </Field>
        </FormSection>
      )}

      {currentKey === "members" && (
        <FormSection number={step + 1} title="Consortium Members">
          <p style={hint}>Minimum 2 members required. All member profiles are publicly visible.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {members.map((m, i) => {
              const upd = patch => setMembers(ms => ms.map((x, j) => j === i ? { ...x, ...patch } : x));
              return (
                <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--line)", background: "var(--panel)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>Member {i + 1}</span>
                    {members.length > 2 && (
                      <button type="button" onClick={() => setMembers(ms => ms.filter((_, j) => j !== i))}
                        style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}>Remove</button>
                    )}
                  </div>
                  <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    <Field label="Full Name / Alias" required count={`${m.name.length}/100`}>
                      <input value={m.name} onChange={e => upd({ name: e.target.value })} maxLength={100} placeholder="Full name or alias" style={inp} />
                    </Field>
                    <Field label="Geographic Region">
                      <RegionSelect value={m.geographicRegion} onChange={v => upd({ geographicRegion: v })} />
                    </Field>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <Field label="Pool ID"><input value={m.poolId} onChange={e => upd({ poolId: e.target.value })} placeholder="pool1…" style={inp} /></Field>
                      <Field label="DRep ID"><input value={m.drepId} onChange={e => upd({ drepId: e.target.value })} placeholder="drep1…" style={inp} /></Field>
                    </div>
                    <div>
                      <label style={{ ...lbl, marginBottom: "0.5rem" }}>Social & Profile Links</label>
                      <SocialLinksFields
                        xUsername={m.xUsername} onX={v => upd({ xUsername: v })}
                        linkedinUsername={m.linkedinUsername} onLinkedin={v => upd({ linkedinUsername: v })}
                        website={m.website} onWebsite={v => upd({ website: v })}
                        otherLinks={m.otherLinks} onOtherLinks={v => upd({ otherLinks: v })}
                      />
                    </div>
                    <Field label="Brief Biography" required count={`${m.bio.length}/2000`}>
                      <textarea value={m.bio} onChange={e => upd({ bio: e.target.value })} maxLength={2000} rows={3} placeholder="Brief biography…" style={ta} />
                    </Field>
                    <Field label="Professional Background" count={`${m.professionalBackground.length}/2000`}>
                      <textarea value={m.professionalBackground} onChange={e => upd({ professionalBackground: e.target.value })} maxLength={2000} rows={3} placeholder="Professional background and expertise…" style={ta} />
                    </Field>
                    <Field label="Governance Experience" count={`${m.governanceExperience.length}/2000`}>
                      <textarea value={m.governanceExperience} onChange={e => upd({ governanceExperience: e.target.value })} maxLength={2000} rows={3} placeholder="Governance experience at any level…" style={ta} />
                    </Field>
                    <Field label="Conflict of Interest" count={`${m.conflictOfInterest.length}/2000`}>
                      <textarea value={m.conflictOfInterest} onChange={e => upd({ conflictOfInterest: e.target.value })} maxLength={2000} rows={2} placeholder="Disclose any conflicts of interest, or leave blank…" style={ta} />
                    </Field>
                  </div>
                </div>
              );
            })}
            <button type="button" onClick={() => setMembers(ms => [...ms, emptyMem()])}
              style={{ alignSelf: "flex-start", padding: "0.4rem 0.85rem", border: "1px dashed var(--line)", borderRadius: 7, background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.82rem" }}>
              + Add Member
            </button>
          </div>
        </FormSection>
      )}

      {currentKey === "declaration" && (
        <FormSection number={step + 1} title="Declaration & Agreement">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer", fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
              <input type="checkbox" checked={declAccuracy} onChange={e => setDeclAccuracy(e.target.checked)} style={{ marginTop: "0.18rem", accentColor: "var(--accent,#5eead4)", flexShrink: 0 }} />
              I confirm that all information provided in this application is accurate and complete to the best of my knowledge.
            </label>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer", fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
              <input type="checkbox" checked={declPublic} onChange={e => setDeclPublic(e.target.checked)} style={{ marginTop: "0.18rem", accentColor: "var(--accent,#5eead4)", flexShrink: 0 }} />
              I consent to my application (excluding private fields) being publicly visible on the CC Election platform.
            </label>
            {track === "consortium" && (
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer", fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                <input type="checkbox" checked={declVouching} onChange={e => setDeclVouching(e.target.checked)} style={{ marginTop: "0.18rem", accentColor: "var(--accent,#5eead4)", flexShrink: 0 }} />
                I declare that all consortium members listed have consented to their participation and public visibility in this application (Member Identity Vouching).
              </label>
            )}
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer", fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
              <input type="checkbox" checked={declTerms} onChange={e => setDeclTerms(e.target.checked)} style={{ marginTop: "0.18rem", accentColor: "var(--accent,#5eead4)", flexShrink: 0 }} />
              I accept the <a href="https://hydra-voting.intersectmbo.org/terms" target="_blank" rel="noreferrer" style={{ color: "var(--accent,#5eead4)" }}>Terms & Conditions</a> and the <a href="https://docs.intersectmbo.org/cardano/constitutional-committee/code-of-conduct" target="_blank" rel="noreferrer" style={{ color: "var(--accent,#5eead4)" }}>Code of Conduct</a> for CC candidates.
            </label>
          </div>
        </FormSection>
      )}

      {submitError && <p style={{ color: "var(--red,#f87171)", fontSize: "0.83rem", margin: "0.5rem 0" }}>{submitError}</p>}

      {/* Navigation bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--line)" }}>
        <div>
          {step > 0 && (
            <button type="button" onClick={goBack}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid var(--line)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Back
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {authed && (
            <button type="button" onClick={saveDraft} disabled={draftSaving}
              style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "1px solid var(--line)", background: "transparent", color: draftSaved ? "var(--accent,#5eead4)" : "var(--text-muted)", cursor: "pointer", fontSize: "0.82rem" }}>
              {draftSaving ? "Saving…" : draftSaved ? "Saved ✓" : "Save Draft"}
            </button>
          )}
          {!isLastStep ? (
            <button type="button" onClick={goNext}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.65rem 1.25rem", borderRadius: 8, border: "none", background: "var(--accent,#5eead4)", color: "#0a0f1a", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>
              Continue
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          ) : (
            <>
              {submissionOpen ? (
                <button type="button" onClick={() => handleSubmit("live")} disabled={!authed || submitting || !declOk}
                  style={{ padding: "0.65rem 1.4rem", borderRadius: 8, border: "none", background: authed && declOk ? "var(--accent,#5eead4)" : "var(--panel)", color: authed && declOk ? "#0a0f1a" : "var(--text-muted)", fontWeight: 700, fontSize: "0.88rem", cursor: authed && declOk ? "pointer" : "not-allowed" }}>
                  {submitting ? "Submitting…" : "Submit Nomination"}
                </button>
              ) : (
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Submission opens {formatDate(cycle?.submissionStartDate)}</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── My Nominations Panel ─────────────────────────────────────────────────────

function MyNominationsPanel({ cycle, walletApi, walletRewardAddress, onClose, onEdit }) {
  const [authed,      setAuthed]      = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError,   setAuthError]   = useState("");
  const [nominations, setNominations] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [deletingId,    setDeletingId]    = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  async function fetchMine() {
    if (!cycle?._id || !walletRewardAddress) return;
    setLoading(true); setError("");
    try {
      const proposer = encodeURIComponent(walletRewardAddress);
      const data = await apiFetch(`/proposals?vote=${cycle._id}&proposer=${proposer}&status=live,withdrawnByProposer,withdrawnByAdmin,draft&sort=updatedAt&direction=desc&limit=100`);
      setNominations(Array.isArray(data) ? data : (data?.data ?? []));
      setAuthed(true);
    } catch (e) {
      const msg = String(e.message || "");
      if (msg.includes("401") || msg.includes("403") || msg.includes("Unauthorized")) setAuthed(false);
      else setError(e.message || "Failed to load.");
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchMine(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAuth() {
    setAuthLoading(true); setAuthError("");
    try { await doWalletAuth(walletApi, walletRewardAddress); setAuthed(true); fetchMine(); }
    catch (e) { setAuthError(e.message || "Authentication failed."); }
    finally { setAuthLoading(false); }
  }

  async function handleDelete(nom) {
    if (!window.confirm("Delete this draft? This cannot be undone.")) return;
    setDeletingId(nom._id);
    try { await apiFetch(`/proposals/${nom._id}`, { method: "DELETE" }); setNominations(ns => ns.filter(n => n._id !== nom._id)); }
    catch (e) { alert(e.message || "Failed to delete."); }
    finally { setDeletingId(null); }
  }

  async function handleWithdraw(nom) {
    const category = window.prompt("Withdrawal reason:\n1. Inappropriate content\n2. Spam\n3. Policy violation\n4. Duplicate submission\n5. Other\n\nEnter the reason exactly as listed:");
    if (!category) return;
    const VALID = ["Inappropriate content", "Spam", "Policy violation", "Duplicate submission", "Other"];
    if (!VALID.includes(category)) { alert("Invalid category. Please enter one of the listed reasons exactly."); return; }
    const comment = window.prompt("Add a comment (required):");
    if (!comment?.trim()) { alert("A comment is required."); return; }
    setWithdrawingId(nom._id);
    try {
      await apiFetch(`/proposals/${nom._id}/withdraw`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category, comment: comment.trim() }) });
      setNominations(ns => ns.map(n => n._id === nom._id ? { ...n, status: "withdrawnByProposer" } : n));
    } catch (e) { alert(e.message || "Failed to withdraw."); }
    finally { setWithdrawingId(null); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }} onClick={onClose}>
      <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 14, width: "100%", maxWidth: 640, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,.4)" }} onClick={e => e.stopPropagation()}>
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
              <button onClick={handleAuth} disabled={authLoading} className="btn-outline" style={{ alignSelf: "flex-start" }}>{authLoading ? "Signing…" : "Sign in with Wallet"}</button>
              {authError && <p style={{ color: "var(--red,#f87171)", fontSize: "0.82rem", margin: 0 }}>{authError}</p>}
            </div>
          ) : loading ? (
            <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>Loading…</p>
          ) : error ? (
            <p style={{ color: "var(--red,#f87171)", fontSize: "0.85rem", margin: 0 }}>{error}</p>
          ) : nominations.length === 0 ? (
            <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>No nominations yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {nominations.map(n => (
                <div key={n._id} style={{ border: "1px solid var(--line)", borderRadius: 9, padding: "0.85rem 1rem", background: "var(--panel)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <TrackBadge type={getTrack(n)} />
                      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{getCandidateName(n)}</span>
                    </div>
                    <StatusBadge status={n.status} />
                  </div>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)" }}>Updated {formatDateTime(n.updatedAt)}</p>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.2rem" }}>
                    {n.status === "draft" && <button onClick={() => { onClose(); onEdit(n); }} className="btn-outline" style={{ fontSize: "0.78rem", padding: "0.25rem 0.65rem" }}>Edit</button>}
                    {n.status === "draft" && (
                      <button onClick={() => handleDelete(n)} disabled={deletingId === n._id}
                        style={{ background: "transparent", border: "1px solid color-mix(in srgb,var(--red,#f87171) 40%,transparent)", borderRadius: 7, padding: "0.25rem 0.65rem", fontSize: "0.78rem", color: "var(--red,#f87171)", cursor: "pointer" }}>
                        {deletingId === n._id ? "Deleting…" : "Delete"}
                      </button>
                    )}
                    {n.status === "live" && (
                      <button onClick={() => handleWithdraw(n)} disabled={withdrawingId === n._id}
                        style={{ background: "transparent", border: "1px solid color-mix(in srgb,var(--red,#f87171) 40%,transparent)", borderRadius: 7, padding: "0.25rem 0.65rem", fontSize: "0.78rem", color: "var(--red,#f87171)", cursor: "pointer" }}>
                        {withdrawingId === n._id ? "Withdrawing…" : "Withdraw"}
                      </button>
                    )}
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

// ─── Admin Nominations Panel ──────────────────────────────────────────────────

function AdminNominationsPanel({ cycle, onClose, onView, onAdminConfirmed }) {
  const { walletApi, walletRewardAddress } = useContext(WalletContext) || {};
  const [nominations,    setNominations]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [query,          setQuery]          = useState("");
  const [adminWithdrawingId, setAdminWithdrawingId] = useState(null);

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  useEffect(() => {
    if (!cycle?._id) return;
    const ctrl = new AbortController();
    setLoading(true); setError("");
    (async () => {
      try {
        let page = 1, all = [];
        while (true) {
          const data = await apiFetch(`/proposals?vote=${cycle._id}&status=live,withdrawnByProposer,withdrawnByAdmin,draft&sort=updatedAt&direction=desc&limit=100&page=${page}`, { signal: ctrl.signal });
          const rows = Array.isArray(data) ? data : (data?.data ?? []);
          all = all.concat(rows);
          if (!data?.meta?.hasNextPage || rows.length < 100) break;
          page++;
        }
        setNominations(all);
        onAdminConfirmed?.();
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Failed to load.");
      } finally { setLoading(false); }
    })();
    return () => ctrl.abort();
  }, [cycle]);

  const isWithdrawn = n => isWithdrawnStatus(n.status);

  async function handleAdminWithdraw(nom) {
    const name = getCandidateName(nom);
    const confirmed = window.confirm(
      `⚠️ ADMIN WITHDRAWAL — USE ONLY WHEN ABSOLUTELY NECESSARY ⚠️\n\n` +
      `You are about to forcibly withdraw "${name}"'s nomination on their behalf.\n\n` +
      `This should only be used for:\n` +
      `  • Illegal or seriously harmful content\n` +
      `  • A verified request from the candidate who cannot self-withdraw\n\n` +
      `This action is logged and irreversible. Are you sure?`
    );
    if (!confirmed) return;
    const category = window.prompt(
      `Reason for admin withdrawal of "${name}":\n\n` +
      `  1. Inappropriate content\n` +
      `  2. Spam\n` +
      `  3. Policy violation\n` +
      `  4. Duplicate submission\n` +
      `  5. Other\n\n` +
      `Enter the reason exactly as listed:`
    );
    const VALID = ["Inappropriate content", "Spam", "Policy violation", "Duplicate submission", "Other"];
    if (!category) return;
    if (!VALID.includes(category)) { alert("Invalid category. Enter one of the listed reasons exactly."); return; }
    const comment = window.prompt(`Add an admin comment explaining the withdrawal (required):`);
    if (!comment?.trim()) { alert("A comment is required."); return; }
    setAdminWithdrawingId(nom._id);
    try {
      await apiFetch(`/proposals/${nom._id}/withdraw`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category, comment: comment.trim() }) });
      setNominations(ns => ns.map(n => n._id === nom._id ? { ...n, status: "withdrawnByAdmin" } : n));
    } catch (e) { alert(e.message || "Failed to withdraw."); }
    finally { setAdminWithdrawingId(null); }
  }

  const filtered = nominations.filter(n => {
    if (statusFilter !== "all") {
      if (statusFilter === "withdrawn" && !isWithdrawn(n)) return false;
      if (statusFilter !== "withdrawn" && n.status !== statusFilter) return false;
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      if (!getCandidateName(n).toLowerCase().includes(q) && !getProposerId(n).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts = { draft: 0, live: 0, withdrawn: 0 };
  nominations.forEach(n => {
    if (n.status === "draft") counts.draft++;
    else if (n.status === "live") counts.live++;
    else if (isWithdrawn(n)) counts.withdrawn++;
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }} onClick={onClose}>
      <div style={{ background: "var(--bg)", border: "1px solid color-mix(in srgb,#f59e0b 35%,transparent)", borderRadius: 14, width: "100%", maxWidth: 700, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,.5)" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--line)", flexShrink: 0, gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f59e0b", background: "color-mix(in srgb,#f59e0b 15%,transparent)", border: "1px solid color-mix(in srgb,#f59e0b 35%,transparent)", borderRadius: 4, padding: "0.15rem 0.45rem" }}>Admin</span>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>All Nominations</h2>
            {!loading && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{nominations.length} total · {counts.draft} draft · {counts.live} live · {counts.withdrawn} withdrawn</span>}
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.2rem", lineHeight: 1, padding: "0.2rem", flexShrink: 0 }}>✕</button>
        </div>

        {/* Filters */}
        <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--line)", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}>
          <input type="search" placeholder="Search by name or address…" value={query} onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, minWidth: 160, padding: "0.4rem 0.65rem", border: "1px solid var(--line)", borderRadius: 7, background: "var(--panel)", color: "var(--text)", fontSize: "0.82rem" }} />
          {["all", "draft", "live", "withdrawn"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ padding: "0.3rem 0.65rem", borderRadius: 20, fontSize: "0.73rem", fontWeight: 600, border: "1px solid", cursor: "pointer",
                borderColor: statusFilter === s ? "#f59e0b" : "var(--line)",
                background: statusFilter === s ? "color-mix(in srgb,#f59e0b 12%,transparent)" : "transparent",
                color: statusFilter === s ? "#f59e0b" : "var(--text-muted)" }}>
              {s === "all" ? `All (${nominations.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${counts[s] ?? 0})`}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ overflowY: "auto", flex: 1, padding: "0.75rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {loading ? (
            <p className="muted" style={{ fontSize: "0.85rem", margin: "0.5rem 0" }}>Loading…</p>
          ) : error ? (
            <p style={{ color: "var(--red,#f87171)", fontSize: "0.85rem", margin: 0 }}>{error}</p>
          ) : filtered.length === 0 ? (
            <p className="muted" style={{ fontSize: "0.85rem", margin: "0.5rem 0" }}>No nominations match.</p>
          ) : filtered.map(n => (
            <div key={n._id} style={{ border: "1px solid var(--line)", borderRadius: 9, padding: "0.8rem 1rem", background: "var(--panel)", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                  <TrackBadge type={getTrack(n)} />
                  <StatusBadge status={n.status} />
                  <span style={{ fontWeight: 600, fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getCandidateName(n)}</span>
                </div>
                {n.proposer && <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.proposer}</p>}
                <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)" }}>Updated {formatDateTime(n.updatedAt)}</p>
              </div>
              <button onClick={() => { onClose(); onView(n); }} className="btn-outline" style={{ fontSize: "0.78rem", padding: "0.28rem 0.7rem", flexShrink: 0 }}>View</button>
              {n.status === "live" && (
                <button onClick={() => handleAdminWithdraw(n)} disabled={adminWithdrawingId === n._id}
                  title="Last resort only — forcibly withdraws this nomination"
                  style={{ background: "transparent", border: "1px solid color-mix(in srgb,var(--red,#f87171) 40%,transparent)", borderRadius: 7, padding: "0.28rem 0.7rem", fontSize: "0.75rem", color: "var(--red,#f87171)", cursor: "pointer", flexShrink: 0, fontWeight: 600 }}>
                  {adminWithdrawingId === n._id ? "Withdrawing…" : "⚠ Force Withdraw"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Submit Page (export) ────────────────────────────────────────────────────

export function CcElectionSubmitPage() {
  const { walletApi, walletRewardAddress } = useContext(WalletContext) || {};
  const { nominationId } = useParams();
  const navigate = useNavigate();

  const [cycle,          setCycle]          = useState(null);
  const [cycleLoading,   setCycleLoading]   = useState(true);
  const [cycleError,     setCycleError]     = useState("");
  const [initialData,    setInitialData]    = useState(null);
  const [initialLoading, setInitialLoading] = useState(Boolean(nominationId));

  useEffect(() => {
    const ctrl = new AbortController();
    apiFetch("/votes", { signal: ctrl.signal })
      .then(data => { const list = Array.isArray(data) ? data : (data?.data ?? []); const m = list.find(v => v.slug === VOTE_SLUG); if (m) setCycle(m); else setCycleError("Election not found."); })
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
      <button onClick={goBack} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.83rem", padding: "0 0 1rem" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        CC Election 2026
      </button>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{nominationId ? "Edit Nomination" : "Submit Nomination"}</h1>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.86rem" }}>Constitutional Committee Election 2026</p>
      </header>
      {!walletApi ? (
        <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", padding: "3rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ opacity: 0.4 }}>
            <rect x="4" y="14" width="32" height="22" rx="4" stroke="currentColor" strokeWidth="2" />
            <path d="M13 14v-4a7 7 0 0 1 14 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="25" r="3" fill="currentColor" />
          </svg>
          <div>
            <p style={{ margin: "0 0 0.35rem", fontWeight: 700, fontSize: "1rem" }}>Wallet required</p>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>Connect your wallet using the button in the top bar to access the nomination form.</p>
          </div>
        </div>
      ) : cycleLoading || initialLoading ? (
        <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", padding: "2rem", textAlign: "center" }}>
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>Loading…</p>
        </div>
      ) : cycleError ? (
        <p style={{ color: "var(--red,#f87171)", fontSize: "0.85rem" }}>{cycleError}</p>
      ) : (
        <NominationForm cycle={cycle} walletApi={walletApi} walletRewardAddress={walletRewardAddress} initialData={initialData} onSuccess={goBack} />
      )}
    </main>
  );
}

// ─── Main List Page ───────────────────────────────────────────────────────────

export default function CcElectionPage() {
  const { walletApi, walletRewardAddress } = useContext(WalletContext) || {};
  const { candidateId: urlCandidateId } = useParams();
  const navigate = useNavigate();

  const [cycle,             setCycle]             = useState(null);
  const [cycleLoading,      setCycleLoading]      = useState(true);
  const [cycleError,        setCycleError]        = useState("");
  const [allCandidates,     setAllCandidates]     = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError,   setCandidatesError]   = useState("");
  const [selected,          setSelected]          = useState(null);
  const [detailFull,        setDetailFull]        = useState(null);
  const [detailLoading,     setDetailLoading]     = useState(false);
  const [search,            setSearch]            = useState("");
  const [filterType,        setFilterType]        = useState("");
  const [sort,              setSort]              = useState("submittedAt");
  const [myNomOpen,         setMyNomOpen]         = useState(false);

  // ── Voting state ───────────────────────────────────────────────────────────
  // The CC election ballot is a single approval-style question: "select up to
  // N candidates". `pendingApprovals`/`confirmedApprovals` are Sets of candidateId.
  const [ballot,             setBallot]             = useState(null);
  const [voteAuthed,         setVoteAuthed]         = useState(false);
  const [voteAuthLoading,    setVoteAuthLoading]    = useState(false);
  const [voteAuthError,      setVoteAuthError]      = useState("");
  const [pendingApprovals,   setPendingApprovals]   = useState(() => new Set());
  const [confirmedApprovals, setConfirmedApprovals] = useState(() => new Set());
  const [submitState,        setSubmitState]        = useState("idle");
  const [submitError,        setSubmitError]        = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    apiFetch("/votes", { signal: ctrl.signal })
      .then(data => { const list = Array.isArray(data) ? data : (data?.data ?? []); const m = list.find(v => v.slug === VOTE_SLUG); if (m) setCycle(m); else setCycleError(`Election "${VOTE_SLUG}" not found.`); })
      .catch(e => { if (e.name !== "AbortError") setCycleError(e.message || "Failed to load."); })
      .finally(() => setCycleLoading(false));
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!cycle) return;
    const ctrl = new AbortController();
    setCandidatesLoading(true); setCandidatesError("");
    (async () => {
      try {
        let page = 1, all = [];
        while (true) {
          const data = await apiFetch(`/proposals?vote=${cycle._id}&limit=${PAGE_SIZE}&page=${page}`, { signal: ctrl.signal });
          const rows = Array.isArray(data) ? data : (data?.data ?? []);
          all = all.concat(rows);
          if (!data?.meta?.hasNextPage || rows.length < PAGE_SIZE) break;
          page++;
        }
        setAllCandidates(all);
      } catch (e) { if (e.name !== "AbortError") setCandidatesError(e.message || "Failed to load."); }
      finally { setCandidatesLoading(false); }
    })();
    return () => ctrl.abort();
  }, [cycle]);

  const openCandidate = useCallback(async (c, skipNav = false) => {
    setSelected(c); setDetailFull(null); setDetailLoading(true);
    if (!skipNav) navigate(`${BASE_PATH}/${c._id}`, { replace: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
    try { const data = await apiFetch(`/proposals/${c._id}`); setDetailFull(data?.data ?? data); }
    catch { setDetailFull(c); }
    finally { setDetailLoading(false); }
  }, [navigate]);

  const closeCandidate = useCallback(() => {
    setSelected(null); setDetailFull(null);
    navigate(BASE_PATH, { replace: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigate]);

  useEffect(() => {
    if (!urlCandidateId || !allCandidates.length) return;
    const m = allCandidates.find(c => c._id === urlCandidateId);
    if (m && (!selected || selected._id !== urlCandidateId)) openCandidate(m, true);
    else if (!m) {
      setSelected({ _id: urlCandidateId, title: "Loading…" }); setDetailFull(null); setDetailLoading(true);
      apiFetch(`/proposals/${urlCandidateId}`).then(d => setDetailFull(d?.data ?? d)).catch(() => {}).finally(() => setDetailLoading(false));
    }
  }, [urlCandidateId, allCandidates]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!urlCandidateId && selected) { setSelected(null); setDetailFull(null); } }, [urlCandidateId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ballot fetch (v1, lives on intersect.ekklesia.vote) ──────────────────────
  useEffect(() => {
    if (!cycle) return;
    const urlId = cycle.votingUrl?.split("/ballots/")[1]?.split(/[/?#]/)[0];
    if (!urlId) {
      apiFetchV1("/ballots?status=live&limit=20")
        .then(data => {
          const list = Array.isArray(data) ? data : (data?.data ?? []);
          const m = list.find(b => (b.title || "").toLowerCase().includes("constitutional committee")) || list[0];
          if (m) setBallot(m);
        })
        .catch(() => {});
      return;
    }
    apiFetchV1(`/ballots/${urlId}`)
      .then(data => setBallot(data?.data ?? data))
      .catch(() => setBallot({ id: urlId }));
  }, [cycle]);

  // The ballot has a single multi-choice question; each option corresponds to
  // one candidate, matched by name. minSelections/maxSelections cap approvals.
  const ballotQuestion = ballot?.hydra?.ballot?.questions?.[0];
  const maxSelections  = ballotQuestion?.maxSelections || 0;

  const candidateToOptionId = useMemo(() => {
    const options = ballotQuestion?.options ?? [];
    if (!options.length) return {};
    const byLabel = Object.fromEntries(options.map(o => [String(o.label || "").trim().toLowerCase(), o.value]));
    const map = {};
    for (const c of allCandidates) {
      const id = byLabel[getCandidateName(c).trim().toLowerCase()] ?? byLabel[String(c.title || "").trim().toLowerCase()];
      if (id != null) map[c._id] = id;
    }
    return map;
  }, [allCandidates, ballotQuestion]);

  const optionIdToCandidateId = useMemo(() =>
    Object.fromEntries(Object.entries(candidateToOptionId).map(([cid, oid]) => [oid, cid]))
  , [candidateToOptionId]);

  // Load previously submitted votes once authed + mapping ready
  useEffect(() => {
    if (!voteAuthed || !ballot?.id || !ballotQuestion || !Object.keys(optionIdToCandidateId).length) return;
    apiFetchV1(`/votes/${ballot.id}/mine`)
      .then(data => {
        const votesMap = data?.confirmed?.votes ?? data?.data?.confirmed?.votes ?? {};
        const v = votesMap[ballotQuestion.questionId];
        const ids = new Set((v?.selection ?? []).map(oid => optionIdToCandidateId[oid]).filter(Boolean));
        setConfirmedApprovals(ids);
        setPendingApprovals(ids); // seed staged selections with what's already on-chain
      })
      .catch(() => {});
  }, [voteAuthed, ballot?.id, ballotQuestion, optionIdToCandidateId]);

  async function handleVoteAuth() {
    if (!walletApi || !walletRewardAddress) return;
    setVoteAuthLoading(true);
    setVoteAuthError("");
    try {
      const signerAddress = String(walletRewardAddress || "").trim();
      const signType = getSignerType(signerAddress);
      const fetchSession = async (method, body) => {
        const r = await fetch(`${VOTE_PROXY_BASE}/api/v0/session`, {
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
      const signature = await walletApi.signData(payloadHex, signerAddress, false);
      await fetchSession("PUT", { signerAddress, signature, signType });
      setVoteAuthed(true);
    } catch (e) {
      setVoteAuthError(e.message || "Authentication failed.");
    } finally {
      setVoteAuthLoading(false);
    }
  }

  const approvedSet = useMemo(() => {
    const s = new Set(confirmedApprovals);
    for (const id of pendingApprovals) s.add(id);
    return s;
  }, [confirmedApprovals, pendingApprovals]);

  const isDirty = useMemo(() => {
    if (pendingApprovals.size !== confirmedApprovals.size) return true;
    for (const id of pendingApprovals) if (!confirmedApprovals.has(id)) return true;
    return false;
  }, [pendingApprovals, confirmedApprovals]);

  function handleToggleApproval(candidateId) {
    if (!voteAuthed) {
      handleVoteAuth().then(() => setPendingApprovals(prev => { const s = new Set(prev); s.add(candidateId); return s; }));
      return;
    }
    setSubmitState("idle"); setSubmitError("");
    setPendingApprovals(prev => {
      const s = new Set(prev);
      if (s.has(candidateId)) s.delete(candidateId); else s.add(candidateId);
      return s;
    });
  }

  async function handleSubmitVotes() {
    if (!ballot?.id || !ballotQuestion || !walletApi) return;
    setSubmitError("");
    try {
      const selection = [...pendingApprovals].map(cId => candidateToOptionId[cId]).filter(v => v != null);
      const votes = [{ questionId: ballotQuestion.questionId, selection }];

      // Step 1: reserve nonce and get signing payload
      setSubmitState("drafting");
      const draft = await apiFetchV1(`/votes/${ballot.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votes }),
      });
      const pkg = draft?.package ?? draft?.data?.package;
      const packageId = pkg?.id;
      const signingPayloadHex = draft?.signingPayloadHex ?? draft?.data?.signingPayloadHex;
      if (!packageId || !signingPayloadHex) throw new Error("Draft response missing packageId or signingPayloadHex.");

      // Step 2: sign the merkle root (UTF-8 bytes of the 64-char hex string)
      setSubmitState("signing");
      const sig = await walletApi.signData(signingPayloadHex, walletRewardAddress, false);
      const coseSign1Hex = sig?.signature ?? sig;
      const coseKeyHex = sig?.key ?? "";

      // Step 3: submit signature — Hydra auto-submits when threshold met
      setSubmitState("submitting");
      await apiFetchV1(`/votes/${ballot.id}/signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, witness: { coseSign1Hex, coseKeyHex } }),
      });

      setConfirmedApprovals(new Set(pendingApprovals));
      setSubmitState("done");
    } catch (e) {
      setSubmitError(e.message || "Vote submission failed.");
      setSubmitState("error");
    }
  }

  const applicantTypes = useMemo(() => { const s = new Set(); allCandidates.forEach(c => { const t = getTrack(c); if (t) s.add(t); }); return [...s]; }, [allCandidates]);

  const displayed = useMemo(() => {
    let list = allCandidates;
    if (filterType) list = list.filter(c => getTrack(c) === filterType);
    if (search.trim()) { const q = search.trim().toLowerCase(); list = list.filter(c => getCandidateName(c).toLowerCase().includes(q) || (c.summary || "").toLowerCase().includes(q)); }
    return [...list].sort((a, b) => {
      if (sort === "name") return getCandidateName(a).localeCompare(getCandidateName(b));
      if (sort === "commentCount") return (b.commentCount ?? 0) - (a.commentCount ?? 0);
      if (sort === "updatedAt") return new Date(b.updatedAt) - new Date(a.updatedAt);
      return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
    });
  }, [allCandidates, filterType, search, sort]);

  useAutoRefreshAt(cycle?.submissionStartDate);

  const now = new Date();
  const submissionOpen = cycle ? now >= new Date(cycle.submissionStartDate) && now <= new Date(cycle.submissionEndDate) : false;
  const votingOpen     = cycle ? now >= new Date(cycle.votingStartDate)     && now <= new Date(cycle.votingEndDate)     : false;
  const draftingAllowed = cycle ? now <= new Date(cycle.submissionEndDate) : false;
  const displayDetail = detailFull ?? selected;

  return (
    <main className="shell" style={{ padding: "1.5rem 1rem", maxWidth: 960, margin: "0 auto" }}>
      {myNomOpen && cycle && (
        <MyNominationsPanel cycle={cycle} walletApi={walletApi} walletRewardAddress={walletRewardAddress}
          onClose={() => setMyNomOpen(false)}
          onEdit={nom => navigate(`${BASE_PATH}/submit/${nom._id}`)} />
      )}

{/* ── Detail view ─────────────────────────── */}
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
        ) : <CandidateDetail candidate={displayDetail} onBack={closeCandidate} walletApi={walletApi} walletRewardAddress={walletRewardAddress}
              voteState={votingOpen && ballot && ballotQuestion && displayDetail?._id ? {
                authed: voteAuthed, authLoading: voteAuthLoading, authError: voteAuthError,
                selected: approvedSet, maxSelections, isConfirmed: confirmedApprovals.has(displayDetail._id),
                onToggle: handleToggleApproval, onAuth: handleVoteAuth,
              } : undefined} />
      )}

      {/* ── List view ───────────────────────────── */}
      {!selected && (
        <div>
          <header style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{cycle?.title || "Constitutional Committee Election 2026"}</h1>
                {votingOpen && <span style={{ padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, background: "color-mix(in srgb,var(--accent,#5eead4) 12%,transparent)", border: "1px solid color-mix(in srgb,var(--accent,#5eead4) 35%,transparent)", color: "var(--accent,#5eead4)", letterSpacing: "0.05em" }}>VOTING OPEN</span>}
                {submissionOpen && !votingOpen && <span style={{ padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700, background: "color-mix(in srgb,#fbbf24 12%,transparent)", border: "1px solid color-mix(in srgb,#fbbf24 35%,transparent)", color: "#fbbf24", letterSpacing: "0.05em" }}>NOMINATIONS OPEN</span>}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, alignItems: "center", flexWrap: "wrap" }}>
                {(votingOpen || new Date() > new Date(cycle?.votingStartDate || 0)) && (
                  <button onClick={() => navigate(`${BASE_PATH}/results`)}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                      background: "color-mix(in srgb,var(--accent,#5eead4) 10%,transparent)", border: "1px solid color-mix(in srgb,var(--accent,#5eead4) 35%,transparent)", color: "var(--accent,#5eead4)" }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                      <rect x="1" y="7" width="2.5" height="5" rx="0.5" fill="currentColor" />
                      <rect x="5.25" y="4" width="2.5" height="8" rx="0.5" fill="currentColor" />
                      <rect x="9.5" y="1" width="2.5" height="11" rx="0.5" fill="currentColor" />
                    </svg>
                    View Results
                  </button>
                )}
                {walletApi && <button onClick={() => setMyNomOpen(true)} className="btn-outline" style={{ fontSize: "0.82rem" }}>My Candidacy</button>}
                {walletApi && votingOpen && ballot && ballotQuestion && !voteAuthed && (
                  <button onClick={handleVoteAuth} disabled={voteAuthLoading}
                    className="btn-outline" style={{ fontSize: "0.82rem" }}>
                    {voteAuthLoading ? "Loading…" : "See my votes"}
                  </button>
                )}
                {walletApi && votingOpen && voteAuthed && confirmedApprovals.size > 0 && (
                  <span style={{ fontSize: "0.82rem", color: "var(--accent,#5eead4)", fontWeight: 600 }}>
                    ✓ {confirmedApprovals.size} vote{confirmedApprovals.size !== 1 ? "s" : ""} submitted
                  </span>
                )}
                {draftingAllowed && (
                  <button onClick={() => navigate(`${BASE_PATH}/submit`)} style={{ padding: "0.5rem 1rem", borderRadius: 8, border: "none", background: "var(--accent,#5eead4)", color: "#0a0f1a", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
                    {submissionOpen ? "Submit Nomination" : "Start Draft"}
                  </button>
                )}
              </div>
            </div>
            {cycleLoading && <p className="muted" style={{ margin: "0 0 0.75rem", fontSize: "0.85rem" }}>Loading…</p>}
            {cycleError  && <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "var(--red,#f87171)" }}>{cycleError}</p>}
            {cycle && <ElectionTimeline cycle={cycle} />}
          </header>

          {cycle && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.6rem", marginBottom: "1.25rem" }}>
                {[["Candidates", candidatesLoading ? "…" : allCandidates.length], ["Matching", candidatesLoading ? "…" : displayed.length], votingOpen ? ["Voting Closes", formatDate(cycle.votingEndDate)] : ["Voting Opens", formatDate(cycle.votingStartDate)]].map(([label, value]) => (
                  <div key={label} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10, padding: "0.75rem 0.9rem" }}>
                    <p style={{ margin: "0 0 0.2rem", fontSize: "0.67rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</p>
                    <p style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>{value}</p>
                  </div>
                ))}
              </div>

              {votingOpen && ballotQuestion && <VotingRulesPanel cycle={cycle} ballotQuestion={ballotQuestion} />}

              <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <input type="search" placeholder="Search candidates…" value={search} onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, minWidth: 180, padding: "0.5rem 0.75rem", border: "1px solid var(--line)", borderRadius: 8, background: "var(--panel)", color: "var(--text)", fontSize: "0.85rem" }} />
                {applicantTypes.length > 0 && (
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <button onClick={() => setFilterType("")} style={{ padding: "0.35rem 0.75rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, border: "1px solid", borderColor: filterType === "" ? "var(--accent)" : "var(--line)", background: filterType === "" ? "color-mix(in srgb,var(--accent) 12%,transparent)" : "transparent", color: filterType === "" ? "var(--accent)" : "var(--text-muted)", cursor: "pointer" }}>All</button>
                    {applicantTypes.map(t => { const active = filterType === t; const c = TRACK_COLORS[t] || {}; return <button key={t} onClick={() => setFilterType(active ? "" : t)} style={{ padding: "0.35rem 0.75rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, border: `1px solid ${active ? (c.border || "var(--accent)") : "var(--line)"}`, background: active ? (c.bg || "transparent") : "transparent", color: active ? (c.text || "var(--accent)") : "var(--text-muted)", cursor: "pointer" }}>{TRACK_LABELS[t] || t}</button>; })}
                  </div>
                )}
                <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: "0.5rem 0.6rem", border: "1px solid var(--line)", borderRadius: 8, background: "var(--panel)", color: "var(--text)", fontSize: "0.82rem" }}>
                  <option value="submittedAt">Newest first</option>
                  <option value="name">Name A–Z</option>
                  <option value="commentCount">Most discussed</option>
                  <option value="updatedAt">Recently updated</option>
                </select>
              </div>

              {candidatesError && <p style={{ color: "var(--red,#f87171)", fontSize: "0.85rem", marginBottom: "1rem" }}>{candidatesError}</p>}

              {candidatesLoading && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "0.75rem" }}>{[1,2,3].map(i => <div key={i} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, height: 140 }} />)}</div>}

              {!candidatesLoading && allCandidates.length === 0 && (
                <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: "3rem 2rem", textAlign: "center" }}>
                  <p style={{ margin: "0 0 0.4rem", fontSize: "1.5rem" }}>🗳️</p>
                  <p style={{ margin: "0 0 0.5rem", fontWeight: 700, fontSize: "0.97rem" }}>No candidates yet</p>
                  <p className="muted" style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
                    {draftingAllowed ? `${submissionOpen ? "Nominations are open" : "You can start a draft now — the submission window opens"} ${submissionOpen ? `— submissions close ${formatDate(cycle?.submissionEndDate)}` : `${formatDate(cycle?.submissionStartDate)}`}.` : "No candidates submitted."}
                  </p>
                  {draftingAllowed && (
                    <button onClick={() => navigate(`${BASE_PATH}/submit`)} style={{ padding: "0.65rem 1.4rem", borderRadius: 8, border: "none", background: "var(--accent,#5eead4)", color: "#0a0f1a", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>
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
                    {displayed.length} candidate{displayed.length !== 1 ? "s" : ""}{filterType && ` · ${TRACK_LABELS[filterType] || filterType}`}{search && ` matching "${search}"`}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "0.75rem" }}>
                    {displayed.map(c => <CandidateCard key={c._id} candidate={c} onClick={() => openCandidate(c)}
                        voteState={votingOpen && ballot && ballotQuestion ? {
                          authed: voteAuthed, authLoading: voteAuthLoading, authError: voteAuthError,
                          selected: approvedSet, maxSelections, isConfirmed: confirmedApprovals.has(c._id),
                          onToggle: handleToggleApproval, onAuth: handleVoteAuth,
                        } : undefined} />)}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Sticky vote submit bar ───────────────────────────────────────── */}
      {isDirty && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          background: "var(--panel)", borderTop: "1px solid var(--line)",
          padding: "0.75rem 1.25rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap",
          backdropFilter: "blur(12px)",
        }}>
          <span style={{ fontSize: "0.83rem", color: "var(--text-muted)" }}>
            {pendingApprovals.size} of {maxSelections || "?"} candidates selected — unsaved changes
          </span>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {submitState === "done" && (
              <span style={{ fontSize: "0.8rem", color: "var(--accent,#5eead4)" }}>✓ Votes submitted</span>
            )}
            {submitError && (
              <span style={{ fontSize: "0.78rem", color: "var(--red,#f87171)", maxWidth: 320 }}>{submitError}</span>
            )}
            <button
              onClick={() => { setPendingApprovals(new Set(confirmedApprovals)); setSubmitState("idle"); setSubmitError(""); }}
              style={{ padding: "0.4rem 0.85rem", borderRadius: 7, fontSize: "0.8rem", fontWeight: 600,
                cursor: "pointer", border: "1px solid var(--line)", background: "transparent", color: "var(--text-muted)" }}>
              Discard
            </button>
            <button
              onClick={handleSubmitVotes}
              disabled={["drafting", "signing", "submitting"].includes(submitState)}
              style={{ padding: "0.4rem 1rem", borderRadius: 7, fontSize: "0.8rem", fontWeight: 700,
                cursor: ["drafting", "signing", "submitting"].includes(submitState) ? "default" : "pointer",
                border: "1px solid var(--accent,#5eead4)",
                background: "color-mix(in srgb,var(--accent,#5eead4) 15%,transparent)",
                color: "var(--accent,#5eead4)" }}>
              {submitState === "drafting" ? "Preparing…" : submitState === "signing" ? "Waiting for signature…" : submitState === "submitting" ? "Submitting…" : "Submit votes"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Preliminary Results Page (/cc-election/results) ────────────────────────

export function CcElectionResultsPage() {
  const navigate = useNavigate();

  const [cycle, setCycle] = useState(null);
  const [cycleLoading, setCycleLoading] = useState(true);
  const [ballot, setBallot] = useState(null);
  const [allCandidates, setAllCandidates] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("votingPower_desc");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    apiFetch("/votes")
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        const match = list.find(v => v.slug === VOTE_SLUG);
        if (!match) throw new Error(`Election "${VOTE_SLUG}" not found.`);
        return match;
      })
      .then(async (c) => {
        if (cancelled) return;
        setCycle(c);
        setCycleLoading(false);

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

        const [candidatesResult, resultsResult] = await Promise.allSettled([
          (async () => {
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
          ballotId ? apiFetchV1(`/results/ballot/${ballotId}`) : Promise.resolve(null),
        ]);

        if (cancelled) return;
        if (candidatesResult.status === "fulfilled") setAllCandidates(candidatesResult.value);
        if (resultsResult.status === "fulfilled" && resultsResult.value) {
          setResults(resultsResult.value);
        } else {
          setError("Results not yet available for this ballot.");
        }
      })
      .catch(e => { if (!cancelled) setError(e.message || "Failed to load."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const ballotQuestion = ballot?.hydra?.ballot?.questions?.[0];
  const maxSelections = ballotQuestion?.maxSelections ?? 0;

  // results endpoint returns one object per question; CC election has exactly one.
  const resultRow = useMemo(() => {
    const arr = results?.data ?? (Array.isArray(results) ? results : []);
    return arr.find(r => r.proposalId === ballotQuestion?.questionId) ?? arr[0] ?? null;
  }, [results, ballotQuestion]);

  const candidateByName = useMemo(() =>
    Object.fromEntries(allCandidates.map(c => [getCandidateName(c).trim().toLowerCase(), c]))
  , [allCandidates]);

  const rows = useMemo(() => {
    // The results array includes a pseudo-option ("Abstain", id "abstain") that
    // isn't a real candidate — exclude anything that doesn't resolve to one.
    const options = resultRow?.results ?? [];
    const totalVP = resultRow?.ballotParticipation?.totalVotingPower?.drep ?? 0;
    return options
      .map(o => {
        const candidate = candidateByName[String(o.label || "").trim().toLowerCase()];
        const votingPower = Number(o.votingPower ?? 0);
        const count = Number(o.count ?? 0);
        const pctOfBallot = totalVP > 0 ? (votingPower / totalVP) * 100 : 0;
        return { id: o.id, label: o.label, candidate, votingPower, count, pctOfBallot };
      })
      .filter(r => r.candidate);
  }, [resultRow, candidateByName]);

  const sorted = useMemo(() => {
    const r = [...rows];
    if (sort === "votingPower_desc") return r.sort((a, b) => b.votingPower - a.votingPower);
    if (sort === "count_desc") return r.sort((a, b) => b.count - a.count);
    if (sort === "label") return r.sort((a, b) => a.label.localeCompare(b.label));
    return r;
  }, [rows, sort]);

  const totalVotingPowerInVote = resultRow?.ballotParticipation?.totalVotingPower?.drep ?? 0;
  const totalVoters = resultRow?.ballotParticipation?.voterCount?.drep ?? 0;
  const maxVP = rows.length ? Math.max(...rows.map(r => r.votingPower)) : 0;

  const fmtAdaCompact = vp => {
    if (!vp) return "₳0";
    const ada = vp / 1e6;
    if (ada >= 1e9) return `₳${(ada / 1e9).toFixed(1)}B`;
    if (ada >= 1e6) return `₳${(ada / 1e6).toFixed(1)}M`;
    if (ada >= 1e3) return `₳${(ada / 1e3).toFixed(0)}K`;
    return `₳${Math.round(ada).toLocaleString()}`;
  };

  // Ranked by voting power, descending — the top `maxSelections` would be elected if the vote closed now.
  const leadingIds = useMemo(() => {
    if (!maxSelections) return new Set();
    return new Set([...rows].sort((a, b) => b.votingPower - a.votingPower).slice(0, maxSelections).map(r => r.id));
  }, [rows, maxSelections]);

  return (
    <main className="shell" style={{ padding: "1.5rem 1rem", maxWidth: 960, margin: "0 auto" }}>
      <button onClick={() => navigate(BASE_PATH)} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.83rem", padding: "0 0 1.25rem" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Back to candidates
      </button>

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: "0 0 0.4rem", fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Preliminary Results</h1>
        <p className="muted" style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>
          {cycle?.title || "Constitutional Committee Election 2026"} — live DRep approval-vote tallies
        </p>
        {cycle && <ElectionTimeline cycle={cycle} />}
        <p style={{ margin: "0.75rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
          Preliminary — results may change until voting closes on {formatDateTime(cycle?.votingEndDate)}.
          {maxSelections > 0 && ` The top ${maxSelections} by voting power are highlighted as currently leading.`}
        </p>
      </div>

      {(loading || cycleLoading) && <p className="muted" style={{ fontSize: "0.85rem" }}>Loading results…</p>}

      {!loading && !cycleLoading && error && (
        <div style={{ padding: "1.25rem", borderRadius: 10, border: "1px solid var(--line)", background: "var(--panel)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {!loading && !cycleLoading && !error && rows.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0.6rem", marginBottom: "1.25rem" }}>
            <div style={{ background: "var(--panel)", border: "1px solid var(--accent,#5eead4)", borderRadius: 10, padding: "0.85rem 1rem" }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.67rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Total voting power in vote</p>
              <p style={{ margin: 0, fontSize: "2rem", fontWeight: 800, color: "var(--accent,#5eead4)", letterSpacing: "-0.02em" }}>{fmtAdaCompact(totalVotingPowerInVote)}</p>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>across {totalVoters} DRep{totalVoters !== 1 ? "s" : ""} who have voted</p>
            </div>
            <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10, padding: "0.85rem 1rem" }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.67rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Candidates</p>
              <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800 }}>{rows.length}</p>
            </div>
            <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10, padding: "0.85rem 1rem" }}>
              <p style={{ margin: "0 0 0.25rem", fontSize: "0.67rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>Seats up for election</p>
              <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "var(--accent,#5eead4)" }}>{maxSelections || "—"}</p>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
            <select value={sort} onChange={e => setSort(e.target.value)}
              style={{ padding: "0.38rem 0.55rem", borderRadius: 7, border: "1px solid var(--line)", background: "var(--bg)", color: "var(--text)", fontSize: "0.82rem" }}>
              <option value="votingPower_desc">Sort: Most voting power</option>
              <option value="count_desc">Sort: Most DReps</option>
              <option value="label">Sort: Name A–Z</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {sorted.map((row, i) => {
              const leading = leadingIds.has(row.id);
              const track = row.candidate ? getTrack(row.candidate) : "";
              const tc = TRACK_COLORS[track] || {};
              const barPct = maxVP > 0 ? (row.votingPower / maxVP) * 100 : 0;
              return (
                <div key={row.id}
                  onClick={() => row.candidate && navigate(`${BASE_PATH}/${row.candidate._id}`)}
                  role={row.candidate ? "button" : undefined} tabIndex={row.candidate ? 0 : undefined}
                  style={{
                    border: `1px solid ${leading ? "var(--accent,#5eead4)" : "var(--line)"}`, borderRadius: 10, padding: "0.9rem 1rem",
                    background: leading ? "color-mix(in srgb,var(--accent,#5eead4) 5%,var(--panel))" : "var(--panel)",
                    cursor: row.candidate ? "pointer" : "default", transition: "border-color 0.15s",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", flexShrink: 0, width: "1.4rem" }}>#{i + 1}</span>
                      {track && <TrackBadge type={track} />}
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem", lineHeight: 1.35 }}>{row.label}</p>
                    </div>
                    {leading && (
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.55rem", borderRadius: 20, flexShrink: 0,
                        background: "color-mix(in srgb,var(--accent,#5eead4) 15%,transparent)", border: "1px solid color-mix(in srgb,var(--accent,#5eead4) 40%,transparent)", color: "var(--accent,#5eead4)" }}>
                        Leading
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: "color-mix(in srgb,var(--text-muted) 12%,transparent)", marginBottom: "0.45rem" }}>
                    <div style={{ width: `${barPct}%`, background: leading ? "var(--accent,#5eead4)" : tc.text || "var(--text-muted)", flexShrink: 0 }} />
                  </div>
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.74rem", flexWrap: "wrap", alignItems: "baseline" }}>
                    <span style={{ color: "var(--accent,#5eead4)", fontWeight: 600 }}>{fmtAdaCompact(row.votingPower)} approval power</span>
                    <span style={{ color: "var(--text-muted)" }}>{row.count} DRep{row.count !== 1 ? "s" : ""}</span>
                    <span style={{ color: "var(--text-muted)" }}>{row.pctOfBallot.toFixed(1)}% of ballot stake</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && !cycleLoading && !error && rows.length === 0 && (
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: "3rem 2rem", textAlign: "center" }}>
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>No votes have been cast yet.</p>
        </div>
      )}
    </main>
  );
}

// ─── Admin Page (/ccadmin) ───────────────────────────────────────────────────

export function CcAdminPage() {
  const { walletApi, walletRewardAddress } = useContext(WalletContext) || {};

  const [cycle,        setCycle]        = useState(null);
  const [cycleLoading, setCycleLoading] = useState(true);
  const [authed,       setAuthed]       = useState(false);
  const [authLoading,  setAuthLoading]  = useState(false);
  const [authError,    setAuthError]    = useState("");
  const [nominations,  setNominations]  = useState([]);
  const [nomLoading,   setNomLoading]   = useState(false);
  const [nomError,     setNomError]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query,        setQuery]        = useState("");
  const [selected,     setSelected]     = useState(null);
  const [detailFull,   setDetailFull]   = useState(null);
  const [detailLoading,setDetailLoading]= useState(false);
  const [adminWithdrawingId, setAdminWithdrawingId] = useState(null);

  useEffect(() => {
    apiFetch("/votes")
      .then(data => { const list = Array.isArray(data) ? data : (data?.data ?? []); const m = list.find(v => v.slug === VOTE_SLUG); if (m) setCycle(m); })
      .catch(() => {}).finally(() => setCycleLoading(false));
  }, []);

  useEffect(() => { setAuthed(false); setNominations([]); setSelected(null); setAuthError(""); }, [walletApi]);

  async function handleAuth() {
    setAuthLoading(true); setAuthError("");
    try { await doWalletAuth(walletApi, walletRewardAddress); setAuthed(true); fetchAll(cycle); }
    catch (e) { setAuthError(e.message || "Sign-in failed."); }
    finally { setAuthLoading(false); }
  }

  async function fetchAll(c) {
    if (!c?._id) return;
    setNomLoading(true); setNomError("");
    try {
      let page = 1, all = [];
      while (true) {
        const data = await apiFetch(`/proposals?vote=${c._id}&status=live,withdrawn,draft&sort=updatedAt&direction=desc&limit=100&page=${page}`);
        const rows = Array.isArray(data) ? data : (data?.data ?? []);
        all = all.concat(rows);
        if (!data?.meta?.hasNextPage || rows.length < 100) break;
        page++;
      }
      setNominations(all);
    } catch (e) { setNomError(e.message || "Failed to load. You may not have admin access."); }
    finally { setNomLoading(false); }
  }

  async function openDetail(nom) {
    setSelected(nom); setDetailFull(null); setDetailLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try { const d = await apiFetch(`/proposals/${nom._id}`); setDetailFull(d?.data ?? d); }
    catch { setDetailFull(nom); }
    finally { setDetailLoading(false); }
  }

  async function handleAdminWithdraw(nom) {
    const name = getCandidateName(nom);
    const confirmed = window.confirm(
      `ADMIN WITHDRAWAL - USE ONLY WHEN ABSOLUTELY NECESSARY\n\n` +
      `You are about to forcibly withdraw "${name}"'s nomination on their behalf.\n\n` +
      `This should only be used for:\n` +
      `  - Illegal or seriously harmful content\n` +
      `  - A verified request from the candidate who cannot self-withdraw\n\n` +
      `This action is logged and irreversible. Are you sure?`
    );
    if (!confirmed) return;

    const category = window.prompt(
      `Reason for admin withdrawal of "${name}":\n\n` +
      `  1. Inappropriate content\n` +
      `  2. Spam\n` +
      `  3. Policy violation\n` +
      `  4. Duplicate submission\n` +
      `  5. Other\n\n` +
      `Enter the reason exactly as listed:`
    );
    const validCategories = ["Inappropriate content", "Spam", "Policy violation", "Duplicate submission", "Other"];
    if (!category) return;
    if (!validCategories.includes(category)) { alert("Invalid category. Enter one of the listed reasons exactly."); return; }

    const comment = window.prompt("Add an admin comment explaining the withdrawal (required):");
    if (!comment?.trim()) { alert("A comment is required."); return; }

    setAdminWithdrawingId(nom._id);
    try {
      const res = await apiFetch(`/proposals/${nom._id}/withdraw`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, comment: comment.trim() }),
      });
      const updated = res?.data ?? { ...nom, status: "withdrawnByAdmin" };
      setNominations(ns => ns.map(n => n._id === nom._id ? { ...n, ...updated, status: updated.status || "withdrawnByAdmin" } : n));
      setSelected(s => s?._id === nom._id ? { ...s, ...updated, status: updated.status || "withdrawnByAdmin" } : s);
      setDetailFull(d => d?._id === nom._id ? { ...d, ...updated, status: updated.status || "withdrawnByAdmin" } : d);
    } catch (e) {
      alert(e.message || "Failed to withdraw.");
    } finally {
      setAdminWithdrawingId(null);
    }
  }

  const counts = { draft: 0, live: 0, withdrawn: 0 };
  nominations.forEach(n => {
    if (n.status === "draft") counts.draft++;
    else if (n.status === "live") counts.live++;
    else if (isWithdrawnStatus(n.status)) counts.withdrawn++;
  });

  const filtered = nominations.filter(n => {
    if (statusFilter !== "all") {
      if (statusFilter === "withdrawn" && !isWithdrawnStatus(n.status)) return false;
      if (statusFilter !== "withdrawn" && n.status !== statusFilter) return false;
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      if (!getCandidateName(n).toLowerCase().includes(q) && !getProposerId(n).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const amber = { bg: "color-mix(in srgb,#f59e0b 8%,transparent)", border: "color-mix(in srgb,#f59e0b 35%,transparent)", text: "#f59e0b" };
  const badge = { fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: amber.text, background: "color-mix(in srgb,#f59e0b 15%,transparent)", border: `1px solid ${amber.border}`, borderRadius: 4, padding: "0.15rem 0.45rem" };

  if (selected) {
    const display = detailFull ?? selected;
    return (
      <main className="shell" style={{ padding: "1.5rem 1rem", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <button onClick={() => { setSelected(null); setDetailFull(null); }} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.83rem", padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Back to all nominations
          </button>
          <span style={badge}>Admin</span>
        </div>
        {detailLoading ? (
          <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", padding: "2.5rem", textAlign: "center" }}>
            <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>Loading…</p>
          </div>
        ) : (
          <>
            {display.status === "live" && (
              <div style={{ border: "1px solid color-mix(in srgb,var(--red,#f87171) 45%,transparent)", borderRadius: 10, background: "color-mix(in srgb,var(--red,#f87171) 8%,transparent)", padding: "0.9rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: "0 0 0.2rem", fontWeight: 800, color: "var(--red,#f87171)", fontSize: "0.86rem" }}>Admin withdrawal available</p>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.78rem" }}>Use only for serious content issues or verified candidate requests.</p>
                </div>
                <button onClick={() => handleAdminWithdraw(display)} disabled={adminWithdrawingId === display._id}
                  style={{ background: "var(--red,#f87171)", border: "1px solid var(--red,#f87171)", borderRadius: 8, padding: "0.45rem 0.85rem", color: "#0a0f1a", cursor: adminWithdrawingId === display._id ? "wait" : "pointer", fontWeight: 800, fontSize: "0.8rem", flexShrink: 0 }}>
                  {adminWithdrawingId === display._id ? "Withdrawing..." : "Force Withdraw"}
                </button>
              </div>
            )}
            <AdminTimelinePanel candidate={display} />
            <CandidateDetail candidate={display} onBack={() => { setSelected(null); setDetailFull(null); }} isAdmin={true} walletApi={walletApi} walletRewardAddress={walletRewardAddress} />
          </>
        )}
      </main>
    );
  }

  return (
    <main className="shell" style={{ padding: "1.5rem 1rem", maxWidth: 860, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <span style={badge}>Admin</span>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>CC Election — Admin</h1>
      </div>

      {!walletApi ? (
        <div style={{ border: `1px solid ${amber.border}`, borderRadius: 12, background: amber.bg, padding: "3rem 2rem", textAlign: "center" }}>
          <p style={{ margin: "0 0 0.35rem", fontWeight: 700 }}>Connect your wallet</p>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>Use the Connect Wallet button in the top bar, then sign in below.</p>
        </div>
      ) : !authed ? (
        <div style={{ border: `1px solid ${amber.border}`, borderRadius: 12, background: amber.bg, padding: "2rem", display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "flex-start" }}>
          <p style={{ margin: 0, fontSize: "0.88rem" }}>Sign in with your wallet to access admin tools.</p>
          <button onClick={handleAuth} disabled={authLoading || cycleLoading}
            style={{ padding: "0.55rem 1.2rem", borderRadius: 8, border: `1px solid ${amber.border}`, background: amber.bg, color: amber.text, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
            {authLoading ? "Signing in…" : "Sign in with Wallet"}
          </button>
          {authError && <p style={{ margin: 0, color: "var(--red,#f87171)", fontSize: "0.82rem" }}>{authError}</p>}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.6rem", marginBottom: "1.25rem" }}>
            {[["Total", nominations.length], ["Draft", counts.draft], ["Live", counts.live], ["Withdrawn", counts.withdrawn]].map(([label, val]) => (
              <div key={label} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10, padding: "0.75rem 0.9rem" }}>
                <p style={{ margin: "0 0 0.2rem", fontSize: "0.67rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</p>
                <p style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>{nomLoading ? "…" : val}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <input type="search" placeholder="Search by name or wallet address…" value={query} onChange={e => setQuery(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: "0.5rem 0.75rem", border: "1px solid var(--line)", borderRadius: 8, background: "var(--panel)", color: "var(--text)", fontSize: "0.85rem" }} />
            {["all", "draft", "live", "withdrawn"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ padding: "0.35rem 0.75rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, border: "1px solid", cursor: "pointer",
                  borderColor: statusFilter === s ? amber.text : "var(--line)",
                  background: statusFilter === s ? amber.bg : "transparent",
                  color: statusFilter === s ? amber.text : "var(--text-muted)" }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* List */}
          {nomLoading && <p className="muted" style={{ fontSize: "0.85rem" }}>Loading nominations…</p>}
          {nomError && <p style={{ color: "var(--red,#f87171)", fontSize: "0.85rem" }}>{nomError}</p>}
          {!nomLoading && !nomError && filtered.length === 0 && <p className="muted" style={{ fontSize: "0.85rem" }}>No nominations match.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {filtered.map(n => (
              <div key={n._id} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "0.85rem 1.1rem", background: "var(--panel)", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                    <TrackBadge type={getTrack(n)} />
                    <StatusBadge status={n.status} />
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{getCandidateName(n)}</span>
                  </div>
                  {getProposerId(n) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
                      <span style={{ fontSize: "0.64rem", color: "var(--text-muted)", flexShrink: 0 }}>Proposer</span>
                      <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--text-muted)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getProposerId(n)}</p>
                      <CopyTextButton value={getProposerId(n)} />
                    </div>
                  )}
                  <p style={{ margin: "0.1rem 0 0", fontSize: "0.7rem", color: "var(--text-muted)" }}>Updated {formatDateTime(n.updatedAt)}</p>
                </div>
                <button onClick={() => openDetail(n)} className="btn-outline" style={{ fontSize: "0.78rem", padding: "0.28rem 0.7rem", flexShrink: 0 }}>View</button>
                {n.status === "live" && (
                  <button onClick={() => handleAdminWithdraw(n)} disabled={adminWithdrawingId === n._id}
                    title="Forcibly withdraw this live nomination"
                    style={{ background: "transparent", border: "1px solid color-mix(in srgb,var(--red,#f87171) 45%,transparent)", borderRadius: 7, padding: "0.28rem 0.7rem", fontSize: "0.75rem", color: "var(--red,#f87171)", cursor: adminWithdrawingId === n._id ? "wait" : "pointer", flexShrink: 0, fontWeight: 800 }}>
                    {adminWithdrawingId === n._id ? "Withdrawing..." : "Force Withdraw"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
