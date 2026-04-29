import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useSnapshotUpdates } from "../hooks/useSnapshotUpdates";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

function formatAdaCompact(value) {
  return `${Math.round(Number(value || 0)).toLocaleString()} ada`;
}

function formatVotePower(role, value) {
  if (role === "CC") return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return formatAdaCompact(n);
}

function extractTreasuryAmountAda(info) {
  if (!info) return 0;
  const withdrawals = info.metadataJson?.body?.onChain?.withdrawals;
  if (Array.isArray(withdrawals)) {
    const total = withdrawals.reduce((s, r) => s + Number(r?.withdrawalAmount || 0), 0);
    if (total > 0) return total / 1_000_000;
  }
  const entries = Array.isArray(info.governanceDescription?.contents?.[0]) ? info.governanceDescription.contents[0] : [];
  const total = entries.reduce((s, item) => s + Number(Array.isArray(item) ? item[1] : 0), 0);
  return total > 0 ? total / 1_000_000 : 0;
}

function epochFromUnix(unixSeconds) {
  const unix = Number(unixSeconds || 0);
  if (!Number.isFinite(unix) || unix <= 0) return null;
  const SHELLEY_EPOCH_208_START_UNIX = 1596059091;
  const EPOCH_SECONDS = 5 * 24 * 60 * 60;
  if (unix < SHELLEY_EPOCH_208_START_UNIX) return null;
  return 208 + Math.floor((unix - SHELLEY_EPOCH_208_START_UNIX) / EPOCH_SECONDS);
}

function normalizeActionPayload(selected, liveMetadata) {
  const metaSource =
    (liveMetadata && typeof liveMetadata === "object" && liveMetadata.json_metadata && typeof liveMetadata.json_metadata === "object"
      ? liveMetadata.json_metadata
      : null) ||
    (selected?.metadataJson && typeof selected.metadataJson === "object" ? selected.metadataJson : null);
  const source =
    metaSource ||
    (selected?.governanceDescription && typeof selected.governanceDescription === "object" ? selected.governanceDescription : {});
  const body = source.body && typeof source.body === "object" ? source.body : source;
  const refs = Array.isArray(body.references) ? body.references : [];

  const references = refs
    .map((ref) => {
      if (!ref || typeof ref !== "object") return null;
      const uri = String(ref.uri || ref.url || ref.href || "").trim();
      if (!uri) return null;
      return {
        label: String(ref.label || ref.title || uri).trim(),
        uri,
        type: String(ref["@type"] || ref.type || "Reference").trim() || "Reference"
      };
    })
    .filter(Boolean);

  const sections = [];
  for (const [key, value] of Object.entries(body || {})) {
    if (key === "references") continue;
    if (typeof value === "string" && value.trim()) {
      sections.push({ key, title: key.replace(/_/g, " "), type: "text", content: value.trim() });
    }
  }

  return {
    title: String(body.title || body.name || selected?.actionName || "").trim(),
    sections,
    references,
    raw: source,
    metadataUrl: String(liveMetadata?.url || selected?.metadataUrl || "").trim(),
    metadataHash: String(liveMetadata?.hash || selected?.metadataHash || "").trim()
  };
}

export default function ProposalDetailPage() {
  const { proposalId } = useParams();
  const [searchParams] = useSearchParams();
  const snapshotKey = String(searchParams.get("snapshot") || "").trim();
  const decodedProposalId = decodeURIComponent(String(proposalId || "")).trim();

  const [payload, setPayload] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rationaleModal, setRationaleModal] = useState({ open: false, key: "", title: "", proposalId: "" });
  const [voteRationaleText, setVoteRationaleText] = useState({});
  const [voteRationaleLoading, setVoteRationaleLoading] = useState({});
  const [voteRationaleError, setVoteRationaleError] = useState({});
  const [detailTab, setDetailTab] = useState("votes");
  const [roleFilter, setRoleFilter] = useState("all");
  const [voteFilter, setVoteFilter] = useState("all");
  const [rationaleFilter, setRationaleFilter] = useState("all");
  const [voteSearch, setVoteSearch] = useState("");

  const silentRefreshRef = useRef(false);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (snapshotKey) params.set("snapshot", snapshotKey);
      params.set("view", "all");
      const res = await fetch(`${API_BASE}/api/accountability?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load proposal.");
      setPayload(data);

      const mRes = await fetch(`${API_BASE}/api/proposal-metadata?proposalId=${encodeURIComponent(decodedProposalId)}`);
      const mData = await mRes.json().catch(() => ({}));
      if (mRes.ok) setMetadata(mData);
    } catch (e) {
      if (!silent) setError(e.message || "Failed to load proposal.");
    } finally {
      if (!silent) setLoading(false);
      silentRefreshRef.current = false;
    }
  }, [decodedProposalId, snapshotKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live updates via SSE — silently refresh when server publishes a new snapshot.
  const { isLive, lastUpdatedAt } = useSnapshotUpdates({
    enabled: !snapshotKey,
    onUpdate: () => {
      if (!silentRefreshRef.current) {
        silentRefreshRef.current = true;
        loadData({ silent: true });
      }
    },
  });

  const snapshotInfo = payload?.proposalInfo?.[decodedProposalId] || null;
  // Supplement snapshot fields that may be null with live values from the metadata endpoint.
  // Also covers the case where the proposal isn't in the snapshot yet.
  const info = snapshotInfo || metadata
    ? {
        ...(snapshotInfo || {}),
        submittedEpoch: snapshotInfo?.submittedEpoch ?? metadata?.submittedEpoch ?? null,
        expirationEpoch: snapshotInfo?.expirationEpoch ?? metadata?.expirationEpoch ?? null,
        enactedEpoch: snapshotInfo?.enactedEpoch ?? metadata?.enactedEpoch ?? null,
        ratifiedEpoch: snapshotInfo?.ratifiedEpoch ?? metadata?.ratifiedEpoch ?? null,
        droppedEpoch: snapshotInfo?.droppedEpoch ?? metadata?.droppedEpoch ?? null,
        expiredEpoch: snapshotInfo?.expiredEpoch ?? metadata?.expiredEpoch ?? null,
        txHash: snapshotInfo?.txHash ?? metadata?.txHash ?? null,
        governanceType: snapshotInfo?.governanceType ?? metadata?.governanceType ?? null,
      }
    : null;

  const payloadDoc = useMemo(
    () => normalizeActionPayload({ ...(info || {}), actionName: info?.actionName || decodedProposalId }, metadata || null),
    [info, metadata, decodedProposalId]
  );

  const allVotes = useMemo(() => {
    if (!payload || !decodedProposalId) return [];
    const rows = [];
    const pushVotes = (actors, role) => {
      for (const actor of Array.isArray(actors) ? actors : []) {
        for (const vote of Array.isArray(actor?.votes) ? actor.votes : []) {
          if (String(vote?.proposalId || "") !== decodedProposalId) continue;
          const votedAtUnix = Number(vote?.votedAtUnix || 0);
          const votedEpoch = epochFromUnix(votedAtUnix);
          rows.push({
            role,
            voter: String(actor?.name || actor?.id || "Unknown"),
            voterId: String(actor?.id || ""),
            voterRole: role === "DRep" ? "drep" : role === "CC" ? "constitutional_committee" : "stake_pool",
            votingPowerAda: role === "CC" ? null : Number(actor?.votingPowerAda || 0),
            vote: String(vote?.vote || ""),
            outcome: String(vote?.outcome || ""),
            voteTxHash: String(vote?.voteTxHash || "").trim(),
            votedAtUnix,
            votedAt: vote?.votedAt || null,
            votedEpoch,
            rationaleUrl: String(vote?.rationaleUrl || "").trim(),
            hasRationale: Boolean(vote?.hasRationale)
          });
        }
      }
    };
    pushVotes(payload?.dreps, "DRep");
    pushVotes(payload?.committeeMembers, "CC");
    pushVotes(payload?.spos, "SPO");
    return rows.sort((a, b) => {
      const timeDelta = Number(b.votedAtUnix || 0) - Number(a.votedAtUnix || 0);
      if (timeDelta !== 0) return timeDelta;
      return String(a.voter || "").localeCompare(String(b.voter || ""));
    });
  }, [payload, decodedProposalId]);

  const filteredVotes = useMemo(() => {
    const normalizedQuery = String(voteSearch || "").trim().toLowerCase();
    return allVotes.filter((row) => {
      if (roleFilter !== "all" && row.role !== roleFilter) return false;
      if (voteFilter !== "all" && String(row.vote || "").toLowerCase() !== voteFilter) return false;
      const hasRationale = Boolean(row.rationaleUrl || row.hasRationale);
      if (rationaleFilter === "with" && !hasRationale) return false;
      if (rationaleFilter === "without" && hasRationale) return false;
      if (!normalizedQuery) return true;
      const haystack = [
        row.voter,
        row.voterId,
        row.role,
        row.votingPowerAda,
        row.vote,
        row.outcome,
        row.votedEpoch
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      return haystack.includes(normalizedQuery);
    });
  }, [allVotes, roleFilter, voteFilter, rationaleFilter, voteSearch]);

  useEffect(() => {
    if (!rationaleModal.open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [rationaleModal.open]);

  if (loading) {
    return <main className="page shell"><section className="status-row"><p className="muted">Loading proposal details...</p></section></main>;
  }

  if (error || !info) {
    return (
      <main className="page shell">
        <section className="status-row"><p className="muted">{error || "Proposal not found."}</p></section>
      </main>
    );
  }

  async function loadVoteRationale(item) {
    if (!item) return;
    const key = `${decodedProposalId}-${item.role}-${item.voterId}-${item.voteTxHash || ""}`;
    if (voteRationaleLoading[key] || voteRationaleText[key]) return;
    try {
      setVoteRationaleLoading((prev) => ({ ...prev, [key]: true }));
      setVoteRationaleError((prev) => ({ ...prev, [key]: "" }));
      const params = new URLSearchParams();
      if (item.rationaleUrl) params.set("url", item.rationaleUrl);
      if (item.voteTxHash) params.set("voteTxHash", item.voteTxHash);
      params.set("proposalId", decodedProposalId);
      params.set("voterId", item.voterId || "");
      params.set("voterRole", item.voterRole || "");
      const res = await fetch(`${API_BASE}/api/vote-rationale?${params.toString()}`);
      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error("Vote rationale endpoint returned non-JSON response.");
      }
      if (!res.ok) throw new Error(data.error || "Failed to load vote rationale.");
      const markdownBody = String(data?.rationaleText || "").trim();
      setVoteRationaleText((prev) => ({
        ...prev,
        [key]: markdownBody || "No rationale body text available."
      }));
    } catch (e) {
      setVoteRationaleError((prev) => ({ ...prev, [key]: e.message || "Failed to load rationale." }));
    } finally {
      setVoteRationaleLoading((prev) => ({ ...prev, [key]: false }));
    }
  }

  function openVoteRationaleModal(item) {
    if (!item) return;
    const key = `${decodedProposalId}-${item.role}-${item.voterId}-${item.voteTxHash || ""}`;
    setRationaleModal({
      open: true,
      key,
      title: `${item.role} · ${item.voter}`,
      proposalId: decodedProposalId
    });
    loadVoteRationale(item);
  }

  const isTreasury = String(info.governanceType || "").toLowerCase().includes("treasury");
  const treasuryAmountAda = isTreasury ? extractTreasuryAmountAda(info) : 0;

  return (
    <main className="page shell stats-page">
      <section className="page-head">
        <p className="eyebrow">Proposal Detail</p>
        <div className="hero-title-row">
          <h1>{payloadDoc.title || info?.actionName || decodedProposalId}</h1>
          {!snapshotKey && (
            <span
              className={`live-badge${isLive ? " live-badge--live" : ""}`}
              title={isLive ? "Receiving live updates via SSE" : "Waiting for server connection…"}
            >
              {isLive ? "● Live" : "○ Connecting…"}
              {lastUpdatedAt && (
                <> · updated {Math.round((Date.now() - lastUpdatedAt.getTime()) / 1000)}s ago</>
              )}
            </span>
          )}
        </div>
        <p className="mono">{decodedProposalId}</p>
        <p><Link className="inline-link" to={`/actions${snapshotKey ? `?snapshot=${encodeURIComponent(snapshotKey)}` : ""}`}>Back to actions</Link></p>
      </section>

      {metadata?.hashMismatch ? (
        <section className="stats-section stats-section--wide">
          <div className="stats-section-body" style={{ background: "rgba(255,180,0,0.08)", border: "1px solid rgba(255,180,0,0.35)", borderRadius: "6px", padding: "12px 16px" }}>
            <p style={{ margin: 0 }}><strong>Hash mismatch warning:</strong> The metadata content at the anchor URL does not match the hash registered on-chain. This may indicate the document was modified after submission. Displaying content for reference only.</p>
          </div>
        </section>
      ) : null}

      <section className="stats-section stats-section--wide">
        <h2 className="stats-section-title">Timeline</h2>
        <div className="stats-section-body meta">
          {treasuryAmountAda > 0 && (
            <p>Amount: <strong>₳{Math.round(treasuryAmountAda).toLocaleString()}</strong></p>
          )}
          <p>Submitted epoch: <strong>{info.submittedEpoch || "-"}</strong></p>
          <p>Expiration epoch: <strong>{info.expirationEpoch || "-"}</strong></p>
          <p>Ratified epoch: <strong>{info.ratifiedEpoch || "-"}</strong></p>
          <p>Enacted epoch: <strong>{info.enactedEpoch || "-"}</strong></p>
          <p>Dropped epoch: <strong>{info.droppedEpoch || "-"}</strong></p>
          <p>Expired epoch: <strong>{info.expiredEpoch || "-"}</strong></p>
        </div>
      </section>

      <section className="stats-section stats-section--wide">
        <div className="detail-tabs">
          <button
            type="button"
            className={`detail-tab${detailTab === "votes" ? " detail-tab--active" : ""}`}
            onClick={() => setDetailTab("votes")}
          >
            Votes
          </button>
          <button
            type="button"
            className={`detail-tab${detailTab === "metadata" ? " detail-tab--active" : ""}`}
            onClick={() => setDetailTab("metadata")}
          >
            Metadata
          </button>
        </div>

        {detailTab === "metadata" ? (
          <div className="stats-section-body">
            {payloadDoc.sections.map((section) => (
              <section className="rationale-section" key={`${decodedProposalId}-${section.key}`}>
                <h4>{section.title}</h4>
                {section.type === "json" ? (
                  <pre className="json-pre payload-pretty">{JSON.stringify(section.content, null, 2)}</pre>
                ) : (
                  <ReactMarkdown className="payload-markdown" remarkPlugins={[remarkGfm]}>
                    {section.content}
                  </ReactMarkdown>
                )}
              </section>
            ))}
            {payloadDoc.sections.length === 0 ? <p className="muted">No metadata body sections available.</p> : null}
          </div>
        ) : (
        <div className="stats-section-body">
          <div className="proposal-vote-filters">
            <label>
              <span>Role</span>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">All groups</option>
                <option value="DRep">DRep</option>
                <option value="CC">Constitutional Committee</option>
                <option value="SPO">SPO</option>
              </select>
            </label>
            <label>
              <span>Vote</span>
              <select value={voteFilter} onChange={(e) => setVoteFilter(e.target.value)}>
                <option value="all">All votes</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="abstain">Abstain</option>
                <option value="noconfidence">No confidence</option>
              </select>
            </label>
            <label>
              <span>Rationale</span>
              <select value={rationaleFilter} onChange={(e) => setRationaleFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="with">With rationale</option>
                <option value="without">Without rationale</option>
              </select>
            </label>
            <label className="proposal-vote-filters-search">
              <span>Search</span>
              <input
                value={voteSearch}
                onChange={(e) => setVoteSearch(e.target.value)}
                placeholder="Voter, ID, vote, outcome, epoch..."
              />
            </label>
            <p className="muted proposal-vote-filters-count">
              Showing <strong>{filteredVotes.length}</strong> of <strong>{allVotes.length}</strong> votes
            </p>
          </div>
          <div className="table-panel">
            <table className="mobile-cards-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Voter</th>
                  <th>Voting Power</th>
                  <th>Vote</th>
                  <th>Outcome</th>
                  <th>Epoch</th>
                  <th>Time</th>
                  <th>Rationale</th>
                </tr>
              </thead>
              <tbody>
                {filteredVotes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="muted">
                      {allVotes.length === 0 ? "No votes found for this proposal." : "No votes match the selected filters."}
                    </td>
                  </tr>
                ) : (
                  filteredVotes.map((row, idx) => (
                    <tr key={`${row.role}-${row.voterId}-${row.votedAtUnix || 0}-${idx}`}>
                      <td data-label="Role">{row.role}</td>
                      <td data-label="Voter">
                        <div>{row.voter}</div>
                        {row.voterId ? <div className="muted mono">{row.voterId}</div> : null}
                      </td>
                      <td data-label="Voting Power">{formatVotePower(row.role, row.votingPowerAda)}</td>
                      <td data-label="Vote">{row.vote || "-"}</td>
                      <td data-label="Outcome">{row.outcome || "-"}</td>
                      <td data-label="Epoch">{row.votedEpoch || "-"}</td>
                      <td data-label="Time">{row.votedAt ? new Date(row.votedAt).toLocaleString() : "-"}</td>
                      <td data-label="Rationale">
                        {row.rationaleUrl || row.hasRationale ? (
                          <button type="button" className="mode-btn" onClick={() => openVoteRationaleModal(row)}>
                            Open rationale
                          </button>
                        ) : "None"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </section>

      {rationaleModal.open ? (
        <div className="image-modal-backdrop" role="presentation" onClick={() => setRationaleModal({ open: false, key: "", title: "", proposalId: "" })}>
          <div className="image-modal rationale-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="image-modal-close"
              onClick={() => setRationaleModal({ open: false, key: "", title: "", proposalId: "" })}
            >
              Close
            </button>
            <h3 className="rationale-modal-title">{rationaleModal.title}</h3>
            <p className="mono">{rationaleModal.proposalId}</p>
            <div className="rationale-modal-content">
              {voteRationaleLoading[rationaleModal.key] ? (
                <p className="muted">Loading rationale...</p>
              ) : voteRationaleError[rationaleModal.key] ? (
                <p className="muted">Rationale error: {voteRationaleError[rationaleModal.key]}</p>
              ) : (
                <ReactMarkdown className="payload-markdown" remarkPlugins={[remarkGfm]}>
                  {voteRationaleText[rationaleModal.key] || "No rationale body text available."}
                </ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
