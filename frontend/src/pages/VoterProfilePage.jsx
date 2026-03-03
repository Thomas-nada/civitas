import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Transaction } from "@meshsdk/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { WalletContext } from "../context/WalletContext";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

function round(v) {
  return Math.round(Number(v || 0) * 10) / 10;
}

function fmt(n, dec = 0) {
  if (!Number.isFinite(Number(n))) return "-";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function formatResponseHours(hours) {
  if (hours === null || hours === undefined || Number.isNaN(hours)) return "N/A";
  if (hours < 24) return `${round(hours)}h`;
  return `${round(hours / 24)}d`;
}

function formatVoteLabelForActor(voteValue, actorType) {
  const normalized = String(voteValue || "").trim().toLowerCase();
  if (!normalized) return "No vote";
  if (actorType === "committee") {
    if (normalized === "yes") return "Constitutional";
    if (normalized === "no") return "Unconstitutional";
  }
  if (normalized === "yes") return "Yes";
  if (normalized === "no") return "No";
  if (normalized === "abstain") return "Abstain";
  if (normalized === "no_confidence") return "No confidence";
  return normalized.replace(/_/g, " ");
}

function epochFromUnix(unixSeconds) {
  const unix = Number(unixSeconds || 0);
  if (!Number.isFinite(unix) || unix <= 0) return null;
  // Shelley era reference:
  // epoch 208 started at 2020-07-29T21:44:51Z and epoch length is 5 days.
  const SHELLEY_EPOCH_208_START_UNIX = 1596059091;
  const EPOCH_SECONDS = 5 * 24 * 60 * 60;
  if (unix < SHELLEY_EPOCH_208_START_UNIX) return null;
  return 208 + Math.floor((unix - SHELLEY_EPOCH_208_START_UNIX) / EPOCH_SECONDS);
}

function resolveVoteResponseHours(vote, proposalInfo) {
  if (typeof vote?.responseHours === "number") return vote.responseHours;
  const votedAtUnix = Number(vote?.votedAtUnix || 0);
  const submittedAtUnix = Number(proposalInfo?.[vote?.proposalId]?.submittedAtUnix || 0);
  if (!Number.isFinite(votedAtUnix) || !Number.isFinite(submittedAtUnix)) return null;
  if (votedAtUnix <= 0 || submittedAtUnix <= 0 || votedAtUnix < submittedAtUnix) return null;
  return (votedAtUnix - submittedAtUnix) / 3600;
}

function scoreRationaleQuality(vote) {
  const precomputed = Number(vote?.rationaleQualityScore);
  if (Number.isFinite(precomputed) && precomputed >= 0) {
    return Math.max(0, Math.min(100, precomputed));
  }
  const hasSignal = Boolean(vote?.hasRationale) || Boolean(String(vote?.rationaleUrl || "").trim());
  const url = String(vote?.rationaleUrl || "").trim();
  const bodyLength = Math.max(0, Number(vote?.rationaleBodyLength || 0));
  const sectionCount = Math.max(0, Number(vote?.rationaleSectionCount || 0));
  const bodyLengthBand = bodyLength >= 5900 ? 4 : bodyLength >= 4500 ? 3 : bodyLength >= 3300 ? 2 : bodyLength >= 2000 ? 1 : 0;
  let score = 0;
  if (hasSignal) score += 35;
  if (url) {
    const looksLikeReference = /^https?:\/\//i.test(url) || /^ipfs:\/\//i.test(url) || /\/ipfs\//i.test(url);
    if (looksLikeReference) score += 15;
    const hasCid = /\b(bafy[a-z0-9]{20,}|Qm[1-9A-HJ-NP-Za-km-z]{20,})\b/i.test(url);
    if (hasCid) score += 10;
  }
  score += bodyLengthBand * 8.75;
  if (sectionCount > 0) score += Math.min(5, sectionCount);
  return Math.max(0, Math.min(100, score));
}

function linkTypeFromRef(ref) {
  const text = `${ref?.label || ""} ${ref?.uri || ""}`.toLowerCase();
  if (text.includes("x.com") || text.includes("twitter")) return "x";
  if (text.includes("linktr.ee") || text.includes("linktree")) return "linktree";
  if (text.includes("github.com")) return "github";
  if (text.includes("linkedin.com")) return "linkedin";
  if (text.includes("t.me") || text.includes("telegram")) return "telegram";
  if (text.includes("discord")) return "discord";
  if (text.includes("youtube.com") || text.includes("youtu.be")) return "youtube";
  if (text.includes("medium.com")) return "medium";
  return "web";
}

function linkIcon(type) {
  if (type === "x") return "X";
  if (type === "linktree") return "LT";
  if (type === "github") return "GH";
  if (type === "linkedin") return "IN";
  if (type === "telegram") return "TG";
  if (type === "discord") return "DS";
  if (type === "youtube") return "YT";
  if (type === "medium") return "M";
  return "WWW";
}

function splitProfileText(input) {
  const raw = String(input || "").trim();
  if (!raw) return [];
  const fromLines = raw.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (fromLines.length > 1) return fromLines;
  const sentences = raw.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length <= 2) return [raw];
  const chunks = [];
  for (let i = 0; i < sentences.length; i += 2) chunks.push(sentences.slice(i, i + 2).join(" "));
  return chunks;
}

function cardanoscanSearchLink(query) {
  return `https://cardanoscan.io/search?query=${encodeURIComponent(query)}`;
}

function cardanoscanCredentialLink(credential) {
  const value = String(credential || "").trim();
  if (!value) return cardanoscanSearchLink("");
  if (value.startsWith("cc_cold1")) return `https://cardanoscan.io/ccmember/${encodeURIComponent(value)}`;
  if (value.startsWith("cc_hot1")) return `https://cardanoscan.io/cchot/${encodeURIComponent(value)}`;
  return cardanoscanSearchLink(value);
}

function actorList(payload, actorType) {
  if (actorType === "drep") {
    const rows = Array.isArray(payload?.dreps) ? payload.dreps : [];
    const byId = new Map(rows.map((row) => [String(row?.id || "").trim().toLowerCase(), row]).filter(([id]) => Boolean(id)));
    const inject = (specialKey, drepId, fallbackName) => {
      const special = payload?.specialDreps?.[specialKey];
      const specialPower = Number(special?.votingPowerAda || 0);
      const key = String(drepId || "").trim().toLowerCase();
      if (!key) return;
      const existing = byId.get(key) || { id: drepId, name: fallbackName, votes: [], votingPowerAda: 0 };
      if (!existing.name) existing.name = fallbackName;
      if (specialPower > 0) existing.votingPowerAda = specialPower;
      byId.set(key, existing);
    };
    inject("alwaysAbstain", "drep_always_abstain", "Always Abstain");
    inject("alwaysNoConfidence", "drep_always_no_confidence", "Always No Confidence");
    return Array.from(byId.values());
  }
  if (actorType === "spo") return Array.isArray(payload?.spos) ? payload.spos : [];
  return Array.isArray(payload?.committeeMembers) ? payload.committeeMembers : [];
}

const tooltipStyle = {
  contentStyle: { background: "#1a2530", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#e8f0f4" },
  itemStyle: { color: "#e8f0f4" }
};

export default function VoterProfilePage({ actorType }) {
  const { actorId } = useParams();
  const [searchParams] = useSearchParams();
  const snapshot = String(searchParams.get("snapshot") || "").trim();
  const decodedId = decodeURIComponent(String(actorId || "")).trim();
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");
  const [imageOpen, setImageOpen] = useState(false);
  const [rationaleModal, setRationaleModal] = useState({ open: false, key: "", title: "", proposalId: "" });
  const [voteRationaleText, setVoteRationaleText] = useState({});
  const [voteRationaleLoading, setVoteRationaleLoading] = useState({});
  const [voteRationaleError, setVoteRationaleError] = useState({});
  const wallet = useContext(WalletContext);
  const [delegateNotice, setDelegateNotice] = useState("");
  const [delegating, setDelegating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setError("");
        const params = new URLSearchParams();
        if (snapshot) params.set("snapshot", snapshot);
        params.set("view", actorType);
        const res = await fetch(`${API_BASE}/api/accountability?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load profile data.");
        if (!cancelled) setPayload(data);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load profile data.");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [actorType, snapshot]);

  const proposalInfo = payload?.proposalInfo || {};
  const actors = useMemo(() => actorList(payload, actorType), [payload, actorType]);
  const actor = useMemo(() => {
    const target = decodedId.toLowerCase();
    return actors.find((row) => String(row?.id || "").trim().toLowerCase() === target) || null;
  }, [actors, decodedId]);

  const voteRows = useMemo(() => {
    if (!actor) return [];
    return (Array.isArray(actor.votes) ? actor.votes : [])
      .map((vote) => {
        const info = proposalInfo?.[vote.proposalId] || {};
        const submittedEpoch = Number(info?.submittedEpoch || 0);
        const submittedAtUnix = Number(info?.submittedAtUnix || 0);
        const votedAtUnix = Number(vote?.votedAtUnix || 0);
        const votedEpoch = epochFromUnix(votedAtUnix) ?? (submittedEpoch > 0 ? submittedEpoch : null);
        const comparableOutcome = String(vote?.outcome || "").toLowerCase();
        const comparableVote = String(vote?.vote || "").toLowerCase();
        const responseHours = resolveVoteResponseHours(vote, proposalInfo);
        return {
          proposalId: String(vote?.proposalId || ""),
          governanceType: String(info?.governanceType || "Unknown"),
          actionName: String(info?.actionName || vote?.proposalId || "Unknown"),
          submittedEpoch,
          votedEpoch,
          votedAtUnix,
          submittedAtUnix,
          submittedAt: info?.submittedAt || null,
          voteLabel: formatVoteLabelForActor(vote?.vote, actorType),
          outcome: String(vote?.outcome || info?.outcome || "Unknown"),
          voteTxHash: String(vote?.voteTxHash || ""),
          responseHours,
          rationaleScore: actorType === "committee" ? scoreRationaleQuality(vote) : null,
          hasRationale: Boolean(vote?.hasRationale) || Boolean(String(vote?.rationaleUrl || "").trim()),
          rationaleUrl: String(vote?.rationaleUrl || "").trim()
        };
      })
      .sort((a, b) => {
        const epochDelta = (a.votedEpoch || 0) - (b.votedEpoch || 0);
        if (epochDelta !== 0) return epochDelta;
        return (a.votedAtUnix || 0) - (b.votedAtUnix || 0);
      });
  }, [actor, proposalInfo, actorType]);

  const byEpoch = useMemo(() => {
    const map = new Map();
    for (const row of voteRows) {
      const epoch = Number(row.votedEpoch || 0);
      if (!Number.isFinite(epoch) || epoch <= 0) continue;
      if (!map.has(epoch)) {
        map.set(epoch, { epoch, totalCast: 0, yes: 0, no: 0, abstain: 0, noConfidence: 0, responseCount: 0, responseSum: 0, rationaleCount: 0, rationaleSum: 0 });
      }
      const bucket = map.get(epoch);
      bucket.totalCast += 1;
      const vote = String(row.voteLabel || "").toLowerCase();
      if (vote.includes("yes") || vote.includes("constitutional")) bucket.yes += 1;
      else if (vote.includes("no") || vote.includes("unconstitutional")) bucket.no += 1;
      else if (vote.includes("abstain")) bucket.abstain += 1;
      else if (vote.includes("confidence")) bucket.noConfidence += 1;
      if (Number.isFinite(row.responseHours)) {
        bucket.responseCount += 1;
        bucket.responseSum += Number(row.responseHours);
      }
      if (actorType === "committee" && Number.isFinite(row.rationaleScore)) {
        bucket.rationaleCount += 1;
        bucket.rationaleSum += Number(row.rationaleScore);
      }
    }
    const sorted = Array.from(map.values()).sort((a, b) => a.epoch - b.epoch).map((row) => ({
      ...row,
      responseHours: row.responseCount > 0 ? round(row.responseSum / row.responseCount) : null,
      rationaleQuality: row.rationaleCount > 0 ? round(row.rationaleSum / row.rationaleCount) : null
    }));
    let runningTotal = 0;
    return sorted.map((row, idx) => {
      runningTotal += Number(row.totalCast || 0);
      return {
        ...row,
        cumulativeCast: runningTotal
      };
    });
  }, [voteRows, actorType]);

  const headline = useMemo(() => {
    if (!actor) return null;
    const responseRows = voteRows.filter((row) => Number.isFinite(row.responseHours));
    const rationaleRows = voteRows.filter((row) => Number.isFinite(row.rationaleScore));
    const avgResponse = responseRows.length > 0 ? round(responseRows.reduce((sum, row) => sum + row.responseHours, 0) / responseRows.length) : null;
    const rationaleQuality = rationaleRows.length > 0 ? round(rationaleRows.reduce((sum, row) => sum + row.rationaleScore, 0) / rationaleRows.length) : 0;
    return {
      totalVotes: voteRows.length,
      avgResponse,
      rationaleQuality,
      votingPowerAda: Number(actor?.votingPowerAda || 0)
    };
  }, [actor, voteRows]);

  const listPath = actorType === "drep" ? "/dreps" : actorType === "spo" ? "/spos" : "/committee";
  const isCommittee = actorType === "committee";
  const isDrep = actorType === "drep";

  async function prepareDelegation() {
    if (!isDrep || !actor) return;
    if (!wallet?.walletApi) {
      setDelegateNotice("Connect your wallet in the top bar to submit delegation on-chain.");
      return;
    }
    if (!wallet.walletRewardAddress) {
      setDelegateNotice("No reward address found in connected wallet. Delegation requires a stake/reward address.");
      return;
    }
    try {
      setDelegating(true);
      setDelegateNotice("");
      const tx = new Transaction({ initiator: wallet.walletApi, verbose: false });
      tx.setNetwork("mainnet");
      tx.txBuilder.voteDelegationCertificate({ dRepId: actor.id }, wallet.walletRewardAddress);
      const unsignedTx = await tx.build();
      const signedTx = await wallet.walletApi.signTx(unsignedTx, true, true);
      const txHash = await wallet.walletApi.submitTx(signedTx);
      setDelegateNotice(`Delegation submitted on-chain. Tx: ${txHash}`);
    } catch (e) {
      setDelegateNotice(`Delegation failed: ${e?.message || "Delegation transaction failed."}`);
    } finally {
      setDelegating(false);
    }
  }

  async function loadVoteRationale(item) {
    if (!item) return;
    const key = `${actor?.id || ""}-${item.proposalId}`;
    if (voteRationaleLoading[key] || voteRationaleText[key]) return;
    try {
      setVoteRationaleLoading((prev) => ({ ...prev, [key]: true }));
      setVoteRationaleError((prev) => ({ ...prev, [key]: "" }));
      const params = new URLSearchParams();
      if (item.rationaleUrl) params.set("url", item.rationaleUrl);
      if (item.voteTxHash) params.set("voteTxHash", item.voteTxHash);
      params.set("proposalId", item.proposalId);
      params.set("voterId", actor?.id || "");
      params.set("voterRole", isDrep ? "drep" : isCommittee ? "constitutional_committee" : "stake_pool");
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
    const key = `${actor?.id || ""}-${item.proposalId}`;
    setRationaleModal({
      open: true,
      key,
      title: item.actionName || item.proposalId,
      proposalId: item.proposalId
    });
    loadVoteRationale(item);
  }

  useEffect(() => {
    const shouldLock = imageOpen || rationaleModal.open;
    if (!shouldLock) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [imageOpen, rationaleModal.open]);

  if (error) {
    return (
      <main className="page shell">
        <section className="status-row"><p className="muted">Error: {error}</p></section>
      </main>
    );
  }

  if (!payload || !actor) {
    return (
      <main className="page shell">
        <section className="status-row"><p className="muted">Loading voter profile...</p></section>
      </main>
    );
  }

  return (
    <main className="page shell stats-page">
      <section className="page-head">
        <p className="eyebrow">Voter Profile</p>
        <h1>{actor.name || actor.id}</h1>
        <p className="muted mono">{actor.id}</p>
        <p><Link className="inline-link" to={`${listPath}${snapshot ? `?snapshot=${encodeURIComponent(snapshot)}` : ""}`}>Back to dashboard</Link></p>
      </section>

      <section className="stats-kpis">
        <article className="stats-kpi"><p className="stats-kpi-label">Votes Cast</p><strong className="stats-kpi-value">{fmt(headline.totalVotes)}</strong></article>
        <article className="stats-kpi"><p className="stats-kpi-label">Avg Response</p><strong className="stats-kpi-value">{formatResponseHours(headline.avgResponse)}</strong></article>
        {isCommittee ? (
          <article className="stats-kpi"><p className="stats-kpi-label">Rationale Quality</p><strong className="stats-kpi-value">{fmt(headline.rationaleQuality)}%</strong></article>
        ) : null}
      </section>

      {isDrep ? (
        <section className="stats-section stats-section--wide">
          <h2 className="stats-section-title">DRep Profile</h2>
          <div className="stats-section-body">
            {actor?.profile?.imageUrl ? (
              <button type="button" className="profile-image-inline-btn" onClick={() => setImageOpen(true)}>
                <img className="profile-image" src={actor.profile.imageUrl} alt={`${actor.name || actor.id} profile`} />
              </button>
            ) : null}
            <div className="meta drep-profile">
              <button type="button" className="delegate-cta" onClick={prepareDelegation} disabled={delegating}>
                {delegating ? "Submitting Delegation..." : "Delegate Voting Power To This DRep"}
              </button>
              {!wallet?.walletApi ? <p className="muted">Connect your wallet in the top bar to enable delegation.</p> : null}
              {delegateNotice ? <p className="muted">{delegateNotice}</p> : null}
              {actor.profile?.email ? (
                <p className="profile-row">
                  <span className="profile-label">Email</span>
                  <a className="ext-link" href={`mailto:${actor.profile.email}`}>{actor.profile.email}</a>
                </p>
              ) : null}
              {actor.profile?.bio ? (
                <div className="profile-block">
                  <h4>Bio</h4>
                  {splitProfileText(actor.profile.bio).map((line, idx) => <p key={`bio-${actor.id}-${idx}`}>{line}</p>)}
                </div>
              ) : null}
              {actor.profile?.motivations ? (
                <div className="profile-block">
                  <h4>Motivations</h4>
                  {splitProfileText(actor.profile.motivations).map((line, idx) => <p key={`mot-${actor.id}-${idx}`}>{line}</p>)}
                </div>
              ) : null}
              {actor.profile?.objectives ? (
                <div className="profile-block">
                  <h4>Objectives</h4>
                  {splitProfileText(actor.profile.objectives).map((line, idx) => <p key={`obj-${actor.id}-${idx}`}>{line}</p>)}
                </div>
              ) : null}
              {actor.profile?.qualifications ? (
                <div className="profile-block">
                  <h4>Qualifications</h4>
                  {splitProfileText(actor.profile.qualifications).map((line, idx) => <p key={`qual-${actor.id}-${idx}`}>{line}</p>)}
                </div>
              ) : null}
              {Array.isArray(actor.profile?.references) && actor.profile.references.length > 0 ? (
                <>
                  <h4 className="profile-links-title">Links</h4>
                  <div className="vote-list profile-links">
                    {actor.profile.references.slice(0, 12).map((ref) => {
                      const type = linkTypeFromRef(ref);
                      return (
                        <article className="vote-item profile-link-item" key={`${actor.id}-${ref.uri}`}>
                          <a className="ext-link profile-link-anchor" href={ref.uri} target="_blank" rel="noreferrer">
                            <span className={`link-chip link-chip-${type}`}>{linkIcon(type)}</span>
                            <span>{ref.label || ref.uri}</span>
                          </a>
                        </article>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="stats-section stats-section--wide">
        <h2 className="stats-section-title">Profile Details</h2>
        <div className="stats-section-body">
          <div className="meta">
            {isDrep ? (
              <>
                <p>
                  DRep ID:{" "}
                  <a className="ext-link mono" href={`https://cardanoscan.io/drep/${encodeURIComponent(actor.id)}`} target="_blank" rel="noreferrer">
                    {actor.id}
                  </a>
                </p>
                <p>
                  Voting power: <strong>{fmt(Number(actor?.votingPowerAda || 0))} ada</strong>
                </p>
              </>
            ) : null}
            {actorType === "spo" ? (
              <>
                <p>
                  Pool ID:{" "}
                  <a className="ext-link mono" href={`https://cardanoscan.io/pool/${encodeURIComponent(actor.id)}`} target="_blank" rel="noreferrer">
                    {actor.id}
                  </a>
                </p>
                <p>
                  Pool status: <strong>{String(actor?.status || "registered").replace(/\b\w/g, (m) => m.toUpperCase())}</strong>
                </p>
                <p>
                  Voting power: <strong>{fmt(Number(actor?.votingPowerAda || 0))} ada</strong>
                </p>
                {actor?.delegationStatus ? (
                  <p>
                    Delegation posture: <strong>{actor.delegationStatus}</strong>
                  </p>
                ) : null}
                {actor?.delegatedDrepLiteralRaw ? (
                  <p>
                    Delegated DRep literal: <strong className="mono">{actor.delegatedDrepLiteralRaw}</strong>
                  </p>
                ) : null}
                {actor?.homepage ? (
                  <p>
                    Homepage:{" "}
                    <a className="ext-link" href={actor.homepage} target="_blank" rel="noreferrer">
                      {actor.homepage}
                    </a>
                  </p>
                ) : null}
              </>
            ) : null}
            {isCommittee ? (
              <>
                <p>
                  Committee status:{" "}
                  <strong>{String(actor?.status || "expired").replace(/\b\w/g, (m) => m.toUpperCase())}</strong>
                </p>
                <p>
                  Term started: <strong>{actor?.seatStartEpoch ? `Epoch ${actor.seatStartEpoch}` : "Unknown"}</strong>
                </p>
                <p>
                  Term expiry: <strong>{actor?.expirationEpoch ? `Epoch ${actor.expirationEpoch}` : "Unknown"}</strong>
                </p>
                {actor?.hotCredential ? (
                  <p>
                    Hot credential:{" "}
                    <a className="ext-link mono" href={cardanoscanCredentialLink(actor.hotCredential)} target="_blank" rel="noreferrer">
                      {actor.hotCredential}
                    </a>
                  </p>
                ) : null}
                {actor?.coldCredential ? (
                  <p>
                    Cold credential:{" "}
                    <a className="ext-link mono" href={cardanoscanCredentialLink(actor.coldCredential)} target="_blank" rel="noreferrer">
                      {actor.coldCredential}
                    </a>
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
          {Array.isArray(actor?.profile?.references) && actor.profile.references.length > 0 ? (
            <>
              <h4 className="profile-links-title">Links</h4>
              <div className="vote-list profile-links">
                {actor.profile.references.slice(0, 12).map((ref) => {
                  const type = linkTypeFromRef(ref);
                  return (
                    <article className="vote-item profile-link-item" key={`${actor.id}-detail-${ref.uri}`}>
                      <a className="ext-link profile-link-anchor" href={ref.uri} target="_blank" rel="noreferrer">
                        <span className={`link-chip link-chip-${type}`}>{linkIcon(type)}</span>
                        <span>{ref.label || ref.uri}</span>
                      </a>
                    </article>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section className="stats-section stats-section--wide">
        <h2 className="stats-section-title">Voting History</h2>
        <div className="stats-section-body">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byEpoch} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
              <XAxis dataKey="epoch" />
              <YAxis allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Legend />
              <Bar dataKey="yes" stackId="a" fill="#54e4bc" name="Yes/Constitutional" />
              <Bar dataKey="no" stackId="a" fill="#ff6f7d" name="No/Unconstitutional" />
              <Bar dataKey="abstain" stackId="a" fill="#ffc766" name="Abstain" />
              <Bar dataKey="noConfidence" stackId="a" fill="#7eb8ff" name="No Confidence" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="stats-section stats-section--wide">
        <h2 className="stats-section-title">Recent Votes</h2>
        <div className="stats-section-body">
          <div className="table-panel">
            <table className="mobile-cards-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Epoch</th>
                  <th>Vote</th>
                  <th>Outcome</th>
                  <th>Response</th>
                  <th>Rationale</th>
                </tr>
              </thead>
              <tbody>
                {[...voteRows].reverse().slice(0, 200).map((row) => (
                  <tr key={`${row.proposalId}-${row.votedEpoch || row.submittedEpoch || 0}-${row.votedAtUnix || 0}`}>
                    <td data-label="Action">
                      <div>{row.actionName}</div>
                      <div className="muted mono">{row.proposalId}</div>
                    </td>
                    <td data-label="Epoch">{row.votedEpoch || "-"}</td>
                    <td data-label="Vote">{row.voteLabel}</td>
                    <td data-label="Outcome">{row.outcome}</td>
                    <td data-label="Response">{formatResponseHours(row.responseHours)}</td>
                    <td data-label="Rationale">
                      {row.rationaleUrl || row.hasRationale ? (
                        <button type="button" className="mode-btn" onClick={() => openVoteRationaleModal(row)}>
                          Open rationale
                        </button>
                      ) : "None"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {actorType === "drep" && actor?.profile?.imageUrl && imageOpen ? (
        <div className="image-modal-backdrop" role="presentation" onClick={() => setImageOpen(false)}>
          <div className="image-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="image-modal-close" onClick={() => setImageOpen(false)}>Close</button>
            <img className="image-modal-img" src={actor.profile.imageUrl} alt={`${actor.name || actor.id} profile`} />
          </div>
        </div>
      ) : null}

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
