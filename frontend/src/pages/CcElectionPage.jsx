import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = "/ekklesia-proxy/api/v0";

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...opts,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return res.json();
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function ExternalLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0 }}>
      <path d="M4.5 2H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.5M6.5 1H10m0 0v3.5M10 1 5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const APPLICANT_TYPE_LABELS = {
  individual: "Individual",
  organisation: "Organisation",
  consortium: "Consortium",
};

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
    }}>
      {label}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const map = {
    live: { label: "Active", color: "#34d399" },
    draft: { label: "Draft", color: "var(--text-muted)" },
    withdrawn: { label: "Withdrawn", color: "#f87171" },
  };
  const c = map[s] || { label: status || "Unknown", color: "var(--text-muted)" };
  return (
    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: c.color, letterSpacing: "0.04em" }}>
      {c.label}
    </span>
  );
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

function CandidateCard({ candidate, onClick }) {
  const md = candidate?.metaData || {};
  const applicantType = md.applicantType || md.applicant_type || md.type || candidate.applicantType || "";
  const name = candidate.title || md.name || md.applicantName || "Unnamed Candidate";
  const summary = candidate.summary || md.summary || md.bio || "";
  const links = md.links || md.socialLinks || md.supportingInfoLinks || [];

  return (
    <button
      onClick={onClick}
      style={{
        display: "block", width: "100%", textAlign: "left",
        background: "var(--panel)", border: "1px solid var(--line)",
        borderRadius: 12, padding: "1rem 1.1rem", cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--accent, #5eead4)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(94,234,212,0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "var(--line)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {applicantType && <ApplicantTypeBadge type={applicantType} />}
          <StatusBadge status={candidate.status} />
        </div>
        {candidate.commentCount > 0 && (
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", flexShrink: 0, display: "flex", alignItems: "center", gap: "0.25rem" }}>
            💬 {candidate.commentCount}
          </span>
        )}
      </div>

      <p style={{ margin: "0 0 0.4rem", fontWeight: 700, fontSize: "0.97rem", lineHeight: 1.3 }}>{name}</p>

      {summary && (
        <p style={{
          margin: "0 0 0.5rem", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {summary}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.35rem" }}>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          Submitted {formatDate(candidate.submittedAt)}
        </span>
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
  const paras = String(text).split(/\n{2,}/);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {paras.map((p, i) => (
        <p key={i} style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text)" }}>
          {p.split("\n").map((line, j, arr) => (
            <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
          ))}
        </p>
      ))}
    </div>
  );
}

function FieldBlock({ label, children }) {
  if (!children) return null;
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <p style={{ margin: "0 0 0.35rem", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function CandidateDetail({ candidate, onBack }) {
  const md = candidate?.metaData || {};
  const applicantType = md.applicantType || md.applicant_type || md.type || candidate.applicantType || "";
  const name = candidate.title || md.name || md.applicantName || "Unnamed Candidate";
  const summary = candidate.summary || md.summary || md.bio || "";

  const links = [
    ...(md.links || []),
    ...(md.socialLinks || []),
    ...(md.supportingInfoLinks || []),
    ...(md.proposerDetails?.links || []),
  ].filter((l, i, arr) => l?.url && arr.findIndex(x => x.url === l.url) === i);

  const stakeKey = md.stakeKey || md.stakeAddress || md.walletAddress || md.rewardAddress || "";
  const drepKey = md.drepId || md.drepKey || md.drep || "";
  const coldKey = md.coldKey || md.ccColdKey || "";
  const experience = md.experience || md.trackRecord || md.background || "";
  const motivations = md.motivations || md.motivation || md.whyRunning || "";
  const commitments = md.commitments || md.commitment || md.pledges || "";

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <button
        onClick={onBack}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          background: "transparent", border: "none", cursor: "pointer",
          color: "var(--text-muted)", fontSize: "0.83rem", padding: "0 0 1.25rem",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to candidates
      </button>

      {/* Header */}
      <div style={{
        border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden",
        background: "var(--panel)", marginBottom: "1rem",
      }}>
        <div style={{ padding: "1.25rem 1.4rem", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
            {applicantType && <ApplicantTypeBadge type={applicantType} />}
            <StatusBadge status={candidate.status} />
          </div>
          <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{name}</h1>
          {summary && (
            <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{summary}</p>
          )}
        </div>

        {/* On-chain identifiers */}
        {(stakeKey || drepKey || coldKey) && (
          <div style={{ padding: "0.8rem 1.4rem", borderBottom: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {stakeKey && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)", minWidth: 80 }}>Stake Key</span>
                <code style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "var(--accent, #5eead4)", wordBreak: "break-all" }}>{stakeKey}</code>
              </div>
            )}
            {drepKey && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)", minWidth: 80 }}>DRep ID</span>
                <code style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "var(--accent, #5eead4)", wordBreak: "break-all" }}>{drepKey}</code>
              </div>
            )}
            {coldKey && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)", minWidth: 80 }}>Cold Key</span>
                <code style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "var(--accent, #5eead4)", wordBreak: "break-all" }}>{coldKey}</code>
              </div>
            )}
          </div>
        )}

        {/* Links */}
        {links.length > 0 && (
          <div style={{ padding: "0.8rem 1.4rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            {links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.3rem",
                  fontSize: "0.8rem", color: "var(--accent, #5eead4)", textDecoration: "none",
                  padding: "0.3rem 0.7rem", border: "1px solid color-mix(in srgb, var(--accent, #5eead4) 30%, transparent)",
                  borderRadius: 20, background: "color-mix(in srgb, var(--accent, #5eead4) 6%, transparent)",
                }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
              >
                <ExternalLinkIcon />
                {l.title || l.url}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Candidate details */}
      <div style={{ border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)", padding: "1.1rem 1.4rem" }}>
        {motivations && (
          <FieldBlock label="Why are they running?">
            <RichText text={motivations} />
          </FieldBlock>
        )}
        {experience && (
          <FieldBlock label="Experience & Background">
            <RichText text={experience} />
          </FieldBlock>
        )}
        {commitments && (
          <FieldBlock label="Commitments & Pledges">
            <RichText text={commitments} />
          </FieldBlock>
        )}

        {/* Catch-all: render any extra metaData fields not already displayed */}
        {Object.entries(md).filter(([key]) => ![
          "applicantType", "applicant_type", "type", "name", "applicantName",
          "summary", "bio", "links", "socialLinks", "supportingInfoLinks",
          "stakeKey", "stakeAddress", "walletAddress", "rewardAddress",
          "drepId", "drepKey", "drep", "coldKey", "ccColdKey",
          "experience", "trackRecord", "background",
          "motivations", "motivation", "whyRunning",
          "commitments", "commitment", "pledges",
          "proposerDetails",
        ].includes(key) && typeof md[key] === "string" && md[key].trim()).map(([key, val]) => (
          <FieldBlock key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}>
            <RichText text={val} />
          </FieldBlock>
        ))}

        {!motivations && !experience && !commitments && Object.entries(md).filter(([k]) => typeof md[k] === "string" && md[k].trim()).length === 0 && (
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>No additional details available.</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const VOTE_SLUG = "cc-vote-2026";
const BASE_PATH = "/cc-election";
const PAGE_SIZE = 100;

export default function CcElectionPage() {
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
    if (match && (!selected || selected._id !== urlCandidateId)) {
      openCandidate(match, true);
    } else if (!match) {
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
    if (!urlCandidateId && selected) {
      setSelected(null);
      setDetailFull(null);
    }
  }, [urlCandidateId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived applicant types from actual data
  const applicantTypes = useMemo(() => {
    const types = new Set();
    allCandidates.forEach(c => {
      const t = c.metaData?.applicantType || c.metaData?.applicant_type || c.metaData?.type || c.applicantType || "";
      if (t) types.add(String(t).toLowerCase());
    });
    return [...types];
  }, [allCandidates]);

  const displayed = useMemo(() => {
    let list = allCandidates;

    if (filterType) {
      list = list.filter(c => {
        const t = String(c.metaData?.applicantType || c.metaData?.applicant_type || c.metaData?.type || c.applicantType || "").toLowerCase();
        return t === filterType;
      });
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => {
        const name = (c.title || c.metaData?.name || c.metaData?.applicantName || "").toLowerCase();
        const summary = (c.summary || c.metaData?.summary || "").toLowerCase();
        return name.includes(q) || summary.includes(q);
      });
    }

    return [...list].sort((a, b) => {
      if (sort === "name") return (a.title || "").localeCompare(b.title || "");
      if (sort === "commentCount") return (b.commentCount ?? 0) - (a.commentCount ?? 0);
      if (sort === "updatedAt") return new Date(b.updatedAt) - new Date(a.updatedAt);
      return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
    });
  }, [allCandidates, filterType, search, sort]);

  // Submission window check
  const now = new Date();
  const submissionOpen = cycle
    ? now >= new Date(cycle.submissionStartDate) && now <= new Date(cycle.submissionEndDate)
    : false;
  const votingOpen = cycle
    ? now >= new Date(cycle.votingStartDate) && now <= new Date(cycle.votingEndDate)
    : false;

  const displayDetail = detailFull ?? selected;

  return (
    <main className="shell" style={{ padding: "1.5rem 1rem", maxWidth: 960, margin: "0 auto" }}>

      {/* ── Detail view ─────────────────────────────────────────────────── */}
      {selected && (
        detailLoading ? (
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <button onClick={closeCandidate} style={{
              display: "inline-flex", alignItems: "center", gap: "0.35rem",
              background: "transparent", border: "none", cursor: "pointer",
              color: "var(--text-muted)", fontSize: "0.83rem", padding: "0 0 1.25rem",
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to candidates
            </button>
            <div style={{
              border: "1px solid var(--line)", borderRadius: 12,
              background: "var(--panel)", padding: "2.5rem", textAlign: "center",
            }}>
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>Loading candidate…</p>
            </div>
          </div>
        ) : (
          <CandidateDetail proposal={displayDetail} onBack={closeCandidate} candidate={displayDetail} />
        )
      )}

      {/* ── List view ───────────────────────────────────────────────────── */}
      {!selected && (
        <div>
          {/* Header */}
          <header style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                {cycle?.title || "Constitutional Committee Election 2026"}
              </h1>
              {votingOpen && (
                <span style={{
                  padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700,
                  background: "color-mix(in srgb, var(--accent, #5eead4) 12%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--accent, #5eead4) 35%, transparent)",
                  color: "var(--accent, #5eead4)", letterSpacing: "0.05em",
                }}>
                  VOTING OPEN
                </span>
              )}
              {submissionOpen && !votingOpen && (
                <span style={{
                  padding: "0.2rem 0.65rem", borderRadius: 20, fontSize: "0.7rem", fontWeight: 700,
                  background: "color-mix(in srgb, #fbbf24 12%, transparent)",
                  border: "1px solid color-mix(in srgb, #fbbf24 35%, transparent)",
                  color: "#fbbf24", letterSpacing: "0.05em",
                }}>
                  APPLICATIONS OPEN
                </span>
              )}
            </div>

            {cycle?.description && cycle.description !== cycle.title && (
              <p style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                {cycle.description}
              </p>
            )}

            {cycleLoading && <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>Loading…</p>}
            {cycleError && <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--red, #f87171)" }}>{cycleError}</p>}
            {cycle && <ElectionTimeline cycle={cycle} />}
          </header>

          {cycle && (
            <>
              {/* Stats row */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.6rem", marginBottom: "1.25rem",
              }}>
                {[
                  ["Candidates", candidatesLoading ? "…" : allCandidates.length],
                  ["Matching Search", candidatesLoading ? "…" : displayed.length],
                  ["Voting Opens", formatDate(cycle.votingStartDate)],
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

              {/* Submission callout */}
              {submissionOpen && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.6rem",
                  padding: "0.75rem 1rem", marginBottom: "1rem",
                  background: "color-mix(in srgb, #fbbf24 8%, var(--panel))",
                  border: "1px solid color-mix(in srgb, #fbbf24 30%, transparent)", borderRadius: 10,
                  fontSize: "0.83rem",
                }}>
                  <span style={{ color: "var(--text-muted)" }}>
                    Nominations open — applications close <strong style={{ color: "var(--text)" }}>{formatDate(cycle.submissionEndDate)}</strong>
                  </span>
                  <a
                    href="https://docs.intersectmbo.org/cardano/constitutional-committee"
                    target="_blank" rel="noreferrer"
                    style={{
                      color: "var(--accent, #5eead4)", fontSize: "0.8rem", textDecoration: "none",
                      display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                  >
                    Learn more <ExternalLinkIcon />
                  </a>
                </div>
              )}

              {/* Controls */}
              <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="search"
                  placeholder="Search candidates…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    flex: 1, minWidth: 180, padding: "0.5rem 0.75rem",
                    border: "1px solid var(--line)", borderRadius: 8,
                    background: "var(--panel)", color: "var(--text)", fontSize: "0.85rem",
                  }}
                />

                {/* Type filter pills */}
                {applicantTypes.length > 0 && (
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <button
                      onClick={() => setFilterType("")}
                      style={{
                        padding: "0.35rem 0.75rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
                        border: "1px solid",
                        borderColor: filterType === "" ? "var(--accent)" : "var(--line)",
                        background: filterType === "" ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
                        color: filterType === "" ? "var(--accent)" : "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      All
                    </button>
                    {applicantTypes.map(t => {
                      const active = filterType === t;
                      const colors = APPLICANT_TYPE_COLORS[t] || {};
                      return (
                        <button key={t} onClick={() => setFilterType(active ? "" : t)}
                          style={{
                            padding: "0.35rem 0.75rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
                            border: `1px solid ${active ? (colors.border || "var(--accent)") : "var(--line)"}`,
                            background: active ? (colors.bg || "transparent") : "transparent",
                            color: active ? (colors.text || "var(--accent)") : "var(--text-muted)",
                            cursor: "pointer",
                          }}
                        >
                          {APPLICANT_TYPE_LABELS[t] || t}
                        </button>
                      );
                    })}
                  </div>
                )}

                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  style={{
                    padding: "0.5rem 0.6rem", border: "1px solid var(--line)",
                    borderRadius: 8, background: "var(--panel)", color: "var(--text)", fontSize: "0.82rem",
                  }}
                >
                  <option value="submittedAt">Newest first</option>
                  <option value="name">Name A–Z</option>
                  <option value="commentCount">Most discussed</option>
                  <option value="updatedAt">Recently updated</option>
                </select>
              </div>

              {/* Error */}
              {candidatesError && (
                <p style={{ color: "var(--red, #f87171)", fontSize: "0.85rem", marginBottom: "1rem" }}>{candidatesError}</p>
              )}

              {/* Loading skeleton */}
              {candidatesLoading && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{
                      background: "var(--panel)", border: "1px solid var(--line)",
                      borderRadius: 12, padding: "1rem 1.1rem", height: 140,
                      animation: "pulse 1.5s ease-in-out infinite",
                    }} />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!candidatesLoading && allCandidates.length === 0 && (
                <div style={{
                  background: "var(--panel)", border: "1px solid var(--line)",
                  borderRadius: 14, padding: "3rem 2rem", textAlign: "center",
                }}>
                  <p style={{ margin: "0 0 0.4rem", fontSize: "1.5rem" }}>🗳️</p>
                  <p style={{ margin: "0 0 0.5rem", fontWeight: 700, fontSize: "0.97rem" }}>No applications yet</p>
                  <p className="muted" style={{ margin: 0, fontSize: "0.85rem", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
                    {submissionOpen
                      ? `The submission window is open until ${formatDate(cycle?.submissionEndDate)}. Candidates can apply via the Intersect nomination portal.`
                      : "No candidates have submitted applications for this election."}
                  </p>
                </div>
              )}

              {/* No match state */}
              {!candidatesLoading && allCandidates.length > 0 && displayed.length === 0 && (
                <div style={{
                  background: "var(--panel)", border: "1px solid var(--line)",
                  borderRadius: 12, padding: "2rem", textAlign: "center",
                }}>
                  <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>No candidates match your filters.</p>
                </div>
              )}

              {/* Candidate grid */}
              {!candidatesLoading && displayed.length > 0 && (
                <>
                  <p style={{ margin: "0 0 0.75rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {displayed.length} candidate{displayed.length !== 1 ? "s" : ""}
                    {filterType && ` · ${APPLICANT_TYPE_LABELS[filterType] || filterType}`}
                    {search && ` matching "${search}"`}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
                    {displayed.map(c => (
                      <CandidateCard key={c._id} candidate={c} onClick={() => openCandidate(c)} />
                    ))}
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
