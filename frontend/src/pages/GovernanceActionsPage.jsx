import { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Transaction } from "@meshsdk/core";
import blakejs from "blakejs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { WalletContext } from "../context/WalletContext";

function round(value) {
  return Math.round(value * 100) / 100;
}

// Cardano Shelley epoch start: epoch 208 began ~July 29, 2020 21:44:51 UTC
const SHELLEY_EPOCH_START_UNIX = 1596059091;
const EPOCH_DURATION_SECONDS = 432000; // 5 days
const EXPIRING_SOON_EPOCHS = 1; // one epoch ~= 5 days
const SPO_FORMULA_TRANSITION_EPOCH = 534;
const SPO_FORMULA_TRANSITION_GOV_ACTION =
  "gov_action1pvv5wmjqhwa4u85vu9f4ydmzu2mgt8n7et967ph2urhx53r70xusqnmm525";

function epochToApproxDate(epoch) {
  if (!epoch || epoch <= 0) return null;
  const unixSeconds = SHELLEY_EPOCH_START_UNIX + (epoch - 208) * EPOCH_DURATION_SECONDS;
  return new Date(unixSeconds * 1000);
}

function approxCurrentEpochFromNow() {
  const nowUnix = Math.floor(Date.now() / 1000);
  const delta = nowUnix - SHELLEY_EPOCH_START_UNIX;
  if (!Number.isFinite(delta) || delta < 0) return null;
  return 208 + Math.floor(delta / EPOCH_DURATION_SECONDS);
}

function formatEpochDate(epoch) {
  if (!epoch || epoch <= 0) return null;
  const date = epochToApproxDate(epoch);
  if (!date) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function asPct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  return `${round(Number(value))}%`;
}

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toFiniteOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isAlwaysAbstainSpo(spo) {
  const status = String(spo?.delegationStatus || "").toLowerCase();
  const literal = String(spo?.delegatedDrepLiteralRaw || spo?.delegatedDrepLiteral || "").toLowerCase();
  return status.includes("always abstain") || literal.includes("always_abstain");
}

function isAlwaysNoConfidenceSpo(spo) {
  const status = String(spo?.delegationStatus || "").toLowerCase();
  const literal = String(spo?.delegatedDrepLiteralRaw || spo?.delegatedDrepLiteral || "").toLowerCase();
  return status.includes("always no confidence") || literal.includes("always_no_confidence");
}

function isHardForkAction(governanceType) {
  const t = String(governanceType || "").toLowerCase();
  return t.includes("hard fork") || t.includes("hardfork");
}

function isNoConfidenceAction(governanceType) {
  const t = String(governanceType || "").toLowerCase();
  return t.includes("no confidence") || t.includes("noconfidence");
}

function shouldUseNewSpoFormula(proposalId, submittedEpoch) {
  if (String(proposalId || "") === SPO_FORMULA_TRANSITION_GOV_ACTION) return true;
  const epoch = Number(submittedEpoch);
  return Number.isFinite(epoch) && epoch >= SPO_FORMULA_TRANSITION_EPOCH;
}

function deriveStatus(info) {
  if (!info) return "Unknown";
  if (String(info.outcome || "").toLowerCase() === "pending") return "Active";
  const governanceType = String(info.governanceType || "").toLowerCase();
  const isInfoAction = governanceType.includes("info action") || governanceType === "info";
  if (isInfoAction) return "";
  if (info.enactedEpoch !== null && info.enactedEpoch !== undefined) return "Enacted";
  if (info.ratifiedEpoch !== null && info.ratifiedEpoch !== undefined) return "Ratified";
  if (info.droppedEpoch !== null && info.droppedEpoch !== undefined) return "Dropped";
  if (governanceType.includes("treasury") && info.expiredEpoch !== null && info.expiredEpoch !== undefined) return "Dropped";
  if (info.expiredEpoch !== null && info.expiredEpoch !== undefined) return "Expired";
  return String(info.outcome || "Unknown");
}

function statusPillClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "enacted" || s === "ratified") return "good";
  if (s === "dropped") return "low";
  return "mid";
}

function voteSlices(stats) {
  const yes = Number(stats?.yes || 0);
  const no = Number(stats?.no || 0);
  const abstain = Number(stats?.abstain || 0);
  const other = Number(stats?.noConfidence || 0) + Number(stats?.other || 0);
  const total = yes + no + abstain + other;
  return { yes, no, abstain, other, total };
}

function eligibleVoteGroups(row) {
  const groups = [];
  const drepEligible = Number(row?.drepRequiredPct || 0) > 0 || Number(row?.voteStats?.drep?.total || 0) > 0;
  const ccEligible = row?.thresholdInfo?.ccRequiredPct != null || Number(row?.voteStats?.constitutional_committee?.total || 0) > 0;
  const spoEligible = row?.thresholdInfo?.poolRequiredPct != null || Number(row?.voteStats?.stake_pool?.total || 0) > 0;
  if (drepEligible) groups.push({ key: "drep", label: "DRep", stats: row?.voteStats?.drep || {} });
  if (ccEligible) groups.push({ key: "cc", label: "CC", stats: row?.voteStats?.constitutional_committee || {} });
  if (spoEligible) groups.push({ key: "spo", label: "SPO", stats: row?.voteStats?.stake_pool || {} });
  return groups;
}

function formatAdaCompact(value) {
  return `${Math.round(Number(value || 0)).toLocaleString()} ada`;
}

function formatAdaShort(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n >= 1_000_000_000) return `${round(n / 1_000_000_000)}B`;
  if (n >= 1_000_000) return `${round(n / 1_000_000)}M`;
  if (n >= 1_000) return `${round(n / 1_000)}K`;
  return `${Math.round(n)}`;
}

function VoteMixPie({ group, row }) {
  const { key, label, stats } = group;
  const isCommittee = key === "cc";
  const isSpo = key === "spo";
  const isDrep = key === "drep";
  const asActivePct = (value, base) => (base > 0 ? (Number(value || 0) / base) * 100 : 0);

  const drepActiveBaseAda = Number(row?.totalActiveStakeAda || 0);
  const drepYesAda = Number(row?.drepYesPowerAda || 0);
  const drepNoAda = Number(row?.drepNoPowerAda || 0);
  const drepAbstainAda = Number(row?.drepAbstainActivePowerAda || 0);
  const drepNotVotedAda = Math.max(drepActiveBaseAda - drepYesAda - drepNoAda - drepAbstainAda, 0);
  const drepOutcomeBaseAda = Math.max(drepActiveBaseAda - drepAbstainAda, 0);
  const drepYesPct = asActivePct(drepYesAda, drepOutcomeBaseAda);
  const drepNoPct = asActivePct(drepNoAda, drepOutcomeBaseAda);
  const drepAbstainPct = asActivePct(drepAbstainAda, drepActiveBaseAda);
  const drepNotVotedPct = asActivePct(drepNotVotedAda, drepOutcomeBaseAda);

  // SPO distribution model aligned with cgov/Nomos ledger buckets:
  // - spoNoAda already includes not-voted where the formula requires it.
  // - Pie intentionally excludes abstain and shows only Yes/No(outcome).
  const spoYesAda = Number(row?.spoYesAda || 0);
  const spoNoWithNotVotedAda = Number(row?.spoNoAda || 0);
  const spoAbstainAda = Number(row?.spoAbstainAda || 0);
  const spoNotVotedAda = Number(row?.spoNotVotedAda || 0);
  const spoOutcomeTotalAda = Math.max(spoYesAda + spoNoWithNotVotedAda, 0);
  const spoYesPctDisplay = spoOutcomeTotalAda > 0 ? (spoYesAda / spoOutcomeTotalAda) * 100 : 0;
  const spoNoPctDisplay = spoOutcomeTotalAda > 0 ? (spoNoWithNotVotedAda / spoOutcomeTotalAda) * 100 : 0;
  const spoYesPctPie = spoYesPctDisplay;
  const spoNoPctPie = spoNoPctDisplay;

  const { yes, no, abstain, total } = voteSlices(stats);
  const ccCastCount = yes + no + abstain;
  const ccEligibleCount = Math.max(Number(row?.ccEligibleCount || 0), 0);
  const ccNotVotedCount = Math.max(ccEligibleCount - ccCastCount, 0);
  const ccDenominator = ccEligibleCount > 0 ? ccEligibleCount : total;
  const defaultYesPct = total > 0 ? (yes / total) * 100 : 0;
  const defaultNoPct = total > 0 ? (no / total) * 100 : 0;
  const defaultAbstainPct = total > 0 ? (abstain / total) * 100 : 0;
  const defaultOtherPct = Math.max(0, 100 - defaultYesPct - defaultNoPct - defaultAbstainPct);
  const ccYesPct = ccDenominator > 0 ? (yes / ccDenominator) * 100 : 0;
  const ccNoPct = ccDenominator > 0 ? (no / ccDenominator) * 100 : 0;
  const ccAbstainPct = ccDenominator > 0 ? (abstain / ccDenominator) * 100 : 0;
  const ccNotVotedPct = ccDenominator > 0 ? (ccNotVotedCount / ccDenominator) * 100 : 0;

  const pieYesPct = isCommittee
    ? ccYesPct
    : (isDrep ? drepYesPct : (isSpo ? spoYesPctPie : defaultYesPct));
  const pieNoPct = isCommittee
    ? ccNoPct
    : (isDrep ? drepNoPct : (isSpo ? spoNoPctPie : defaultNoPct));
  const pieAbstainPct = isCommittee
    ? ccAbstainPct
    : (isDrep ? 0 : (isSpo ? 0 : defaultAbstainPct));
  const pieOtherPct = isCommittee
    ? ccNotVotedPct
    : (isDrep ? drepNotVotedPct : (isSpo ? 0 : defaultOtherPct));
  const thresholdPct = isDrep
    ? toFiniteOrNull(row?.drepRequiredPct)
    : (isSpo
      ? toFiniteOrNull(row?.spoRequiredPct)
      : (isCommittee ? toFiniteOrNull(row?.thresholdInfo?.ccRequiredPct) : null));
  const thresholdAngle = thresholdPct !== null
    ? Math.max(0, Math.min(100, thresholdPct)) * 3.6
    : null;
  const centerValue = isDrep
    ? formatAdaShort(drepActiveBaseAda)
    : (isCommittee ? ccCastCount : (isSpo ? formatAdaShort(spoOutcomeTotalAda) : total));
  const bg = `conic-gradient(#54e4bc 0 ${pieYesPct}%, #ff6f7d ${pieYesPct}% ${pieYesPct + pieNoPct}%, #ffc766 ${pieYesPct + pieNoPct}% ${pieYesPct + pieNoPct + pieAbstainPct}%, #7c8fa8 ${pieYesPct + pieNoPct + pieAbstainPct}% ${pieYesPct + pieNoPct + pieAbstainPct + pieOtherPct}%)`;
  return (
    <article className="action-vote-pie-card">
      <p className="action-vote-pie-title">{label}</p>
      <div className="action-vote-pie-body">
        <div className="action-vote-pie" style={{ background: bg }}>
          {thresholdAngle !== null ? (
            <div
              aria-hidden="true"
              className="action-vote-pie-threshold"
              style={{ "--threshold-angle": `${thresholdAngle}deg` }}
            />
          ) : null}
          <span>{centerValue}</span>
        </div>
        <div className="action-vote-pie-meta">
          {isCommittee ? (
            <>
              <p><span className="vote-label vote-label-yes">Constitutional</span> <strong>{yes}</strong></p>
              <p><span className="vote-label vote-label-no">Unconstitutional</span> <strong>{no}</strong></p>
              <p><span className="vote-label vote-label-abstain">Abstain</span> <strong>{abstain}</strong></p>
              <p><span className="vote-label vote-label-not-voted">Not voted</span> <strong>{ccNotVotedCount}</strong></p>
            </>
          ) : isSpo ? (
            <>
              <p>
                <span className="vote-label vote-label-yes">Yes</span> <strong>{asPct(spoYesPctDisplay)}</strong>{" "}
                ({formatAdaCompact(spoYesAda)})
              </p>
              <p>
                <span className="vote-label vote-label-no">No</span> <strong>{asPct(spoNoPctDisplay)}</strong>{" "}
                ({formatAdaCompact(spoNoWithNotVotedAda)})
                {" "}includes not voted: <strong>{formatAdaCompact(spoNotVotedAda)}</strong>
              </p>
              <p>
                <span className="vote-label vote-label-abstain">Abstain (active + always)</span>{" "}
                <strong>{formatAdaCompact(spoAbstainAda)}</strong>
              </p>
            </>
          ) : (
            <>
              <p><span className="vote-label vote-label-yes">Yes</span> <strong>{asPct(drepYesPct)}</strong> ({formatAdaCompact(drepYesAda)})</p>
              <p><span className="vote-label vote-label-no">No</span> <strong>{asPct(drepNoPct)}</strong> ({formatAdaCompact(drepNoAda)})</p>
              <p><span className="vote-label vote-label-abstain">Abstain</span> <strong>{asPct(drepAbstainPct)}</strong> ({formatAdaCompact(drepAbstainAda)})</p>
            </>
          )}
        </div>
      </div>
      <details className="action-vote-calc">
        <summary>Expandable full calculation</summary>
        {isCommittee ? (
          <p>
            Constitutional: <strong>{yes}</strong> | Unconstitutional: <strong>{no}</strong> | Abstain: <strong>{abstain}</strong> | Not voted: <strong>{ccNotVotedCount}</strong> | Eligible: <strong>{ccDenominator}</strong>
          </p>
        ) : isSpo ? (
          <>
            <p>Yes: <strong>{asPct(spoYesPctDisplay)}</strong> ({formatAdaCompact(spoYesAda)})</p>
            <p>
              No: <strong>{asPct(spoNoPctDisplay)}</strong> ({formatAdaCompact(spoNoWithNotVotedAda)}) | Not voted in No: <strong>{formatAdaCompact(spoNotVotedAda)}</strong>
            </p>
            <p>Abstain (active + always): <strong>{formatAdaCompact(spoAbstainAda)}</strong></p>
            {row?.spoRequiredPct !== null ? (
              <p>Threshold progress: <strong>{asPct(row?.spoYesPct)}</strong> / <strong>{asPct(row?.spoRequiredPct)}</strong></p>
            ) : null}
          </>
        ) : (
          <>
            <p>Yes: <strong>{asPct(drepYesPct)}</strong> ({formatAdaCompact(drepYesAda)})</p>
            <p>No: <strong>{asPct(drepNoPct)}</strong> ({formatAdaCompact(drepNoAda)})</p>
            <p>Abstain: <strong>{asPct(drepAbstainPct)}</strong> ({formatAdaCompact(drepAbstainAda)})</p>
            <p>Not voted: <strong>{asPct(drepNotVotedPct)}</strong> ({formatAdaCompact(drepNotVotedAda)})</p>
            <p>Total active stake: <strong>{formatAdaCompact(drepActiveBaseAda)}</strong></p>
          </>
        )}
      </details>
    </article>
  );
}

function roleTotalVotes(voteStats) {
  const drep = Number(voteStats?.drep?.total || 0);
  const cc = Number(voteStats?.constitutional_committee?.total || 0);
  const spo = Number(voteStats?.stake_pool?.total || 0);
  const other = Number(voteStats?.other?.total || 0);
  return drep + cc + spo + other;
}

function pickText(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function titleFromKey(key) {
  const clean = String(key || "").replace(/^@/, "").replace(/_/g, " ");
  if (!clean) return "Field";
  return clean
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
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
      const uri = pickText(ref.uri, ref.url, ref.href);
      if (!uri) return null;
      return {
        label: pickText(ref.label, ref.title, uri),
        uri,
        type: pickText(ref["@type"], ref.type, "Reference")
      };
    })
    .filter(Boolean);

  const sections = [];
  const preferred = [
    ["abstract", "Abstract"],
    ["summary", "Summary"],
    ["motivation", "Motivation"],
    ["rationaleStatement", "Rationale"],
    ["rationale", "Rationale"],
    ["precedentDiscussion", "Precedent"],
    ["counterargumentDiscussion", "Counterarguments"],
    ["conclusion", "Conclusion"]
  ];
  const usedKeys = new Set(["title", "name", "references"]);
  for (const [key, label] of preferred) {
    const value = body?.[key];
    if (typeof value === "string" && value.trim()) {
      sections.push({ key, title: label, type: "text", content: value.trim() });
      usedKeys.add(key);
    }
  }
  for (const [key, value] of Object.entries(body || {})) {
    if (usedKeys.has(key)) continue;
    if (typeof value === "string" && value.trim()) {
      sections.push({ key, title: titleFromKey(key), type: "text", content: value.trim() });
      continue;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      sections.push({ key, title: titleFromKey(key), type: "text", content: String(value) });
      continue;
    }
    if (value && typeof value === "object") {
      sections.push({ key, title: titleFromKey(key), type: "json", content: value });
    }
  }

  return {
    title: pickText(body.title, body.name, selected?.actionName),
    sections,
    references,
    raw: source,
    metadataUrl: pickText(liveMetadata?.url, selected?.metadataUrl),
    metadataHash: pickText(liveMetadata?.hash, selected?.metadataHash)
  };
}

export default function GovernanceActionsPage() {
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const snapshotKey = queryParams.get("snapshot") || "";
  const initialSelectedProposal = queryParams.get("id") || "";
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedId, setSelectedId] = useState(initialSelectedProposal);
  const [proposalMetadataCache, setProposalMetadataCache] = useState({});
  const [proposalVotingSummaryCache, setProposalVotingSummaryCache] = useState({});
  const [proposalMetadataLoading, setProposalMetadataLoading] = useState(false);
  const [proposalMetadataError, setProposalMetadataError] = useState("");
  // --- Voting state (wallet state is global via WalletContext) ---
  const wallet = useContext(WalletContext);
  const [voteChoice, setVoteChoice] = useState("");
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [voteRationaleUrl, setVoteRationaleUrl] = useState("");
  const [voteSubmitting, setVoteSubmitting] = useState(false);
  const [voteNotice, setVoteNotice] = useState("");
  const [voteError, setVoteError] = useState("");
  const [votedTxHash, setVotedTxHash] = useState("");
  const [voteSyncStatus, setVoteSyncStatus] = useState(""); // "polling" | "synced" | "timeout"
  const voteSyncPollRef = useRef(null);
  const detailPanelRef = useRef(null);
  const latestSnapshotRef = useRef("");
  const syncPollBusyRef = useRef(false);
  const cacheKey = useMemo(
    () => `civitas.accountability.actions.${snapshotKey || "latest"}`,
    [snapshotKey]
  );

  const loadData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (snapshotKey) params.set("snapshot", snapshotKey);
      params.set("view", "actions");
      const endpoint = `/api/accountability?${params.toString()}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load governance actions.");
      setPayload(data);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch {
        // Ignore session storage failures.
      }
      latestSnapshotRef.current = String(data?.lastSyncCompletedAt || data?.generatedAt || "");
    } catch (e) {
      setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [cacheKey, snapshotKey]);

  useEffect(() => {
    let hydrated = false;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") {
          setPayload(parsed);
          setLoading(false);
          latestSnapshotRef.current = String(parsed?.lastSyncCompletedAt || parsed?.generatedAt || "");
          hydrated = true;
        }
      }
    } catch {
      // Ignore stale cache parse errors.
    }
    loadData({ silent: hydrated });
  }, [cacheKey, loadData]);

  useEffect(() => {
    if (snapshotKey) return undefined;
    const poll = async () => {
      if (syncPollBusyRef.current) return;
      syncPollBusyRef.current = true;
      try {
        const res = await fetch("/api/sync-status");
        const status = await res.json();
        if (!res.ok) return;
        const latest = String(status?.lastCompletedAt || "");
        if (latest && latest !== latestSnapshotRef.current) {
          await loadData({ silent: true });
        }
      } catch {
        // Ignore background poll errors.
      } finally {
        syncPollBusyRef.current = false;
      }
    };
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, [loadData, snapshotKey]);

  const proposalInfo = payload?.proposalInfo || {};
  const drepPowerStats = useMemo(() => {
    const byProposal = new Map();
    const dreps = payload?.dreps || [];
    const specialDreps = payload?.specialDreps || {};
    const alwaysAbstainId = "drep_always_abstain";
    const alwaysNoConfidenceId = "drep_always_no_confidence";
    const alwaysAbstainPowerAda = Number(specialDreps?.alwaysAbstain?.votingPowerAda || 0);
    const alwaysNoConfidencePowerAda = Number(specialDreps?.alwaysNoConfidence?.votingPowerAda || 0);
    const autoAbstainIds = new Set();
    const knownDrepIds = new Set(dreps.map((drep) => drep.id));
    let regularDrepStakeAda = dreps.reduce((sum, drep) => sum + Number(drep.votingPowerAda || 0), 0);
    if (knownDrepIds.has(alwaysAbstainId)) {
      const row = dreps.find((drep) => drep.id === alwaysAbstainId);
      regularDrepStakeAda -= Number(row?.votingPowerAda || 0);
    }
    if (knownDrepIds.has(alwaysNoConfidenceId)) {
      const row = dreps.find((drep) => drep.id === alwaysNoConfidenceId);
      regularDrepStakeAda -= Number(row?.votingPowerAda || 0);
    }
    autoAbstainIds.add(alwaysAbstainId);

    for (const drep of dreps) {
      const votes = drep.votes || [];
      if (votes.length === 0) continue;
      const name = String(drep.name || "").toLowerCase();
      const id = String(drep.id || "").toLowerCase();
      const allAbstain = votes.every((vote) => String(vote.vote || "").toLowerCase() === "abstain");
      if (name.includes("auto") && name.includes("abstain")) autoAbstainIds.add(drep.id);
      else if (name.includes("always") && name.includes("abstain")) autoAbstainIds.add(drep.id);
      else if (id.includes("always") && id.includes("abstain")) autoAbstainIds.add(drep.id);
      else if (id.includes("auto") && id.includes("abstain")) autoAbstainIds.add(drep.id);
      else if (allAbstain && (name.includes("abstain") || id.includes("abstain"))) autoAbstainIds.add(drep.id);
    }

    for (const drep of dreps) {
      const vp = Number(drep.votingPowerAda || 0);
      for (const vote of drep.votes || []) {
        const proposalId = vote.proposalId;
        if (!byProposal.has(proposalId)) {
          byProposal.set(proposalId, {
            yesPowerAda: 0,
            noPowerAda: 0,
            noConfidencePowerAda: 0,
            abstainActivePowerAda: 0,
            abstainAutoPowerAda: 0,
            noConfidenceAutoPowerAda: 0,
            otherPowerAda: 0,
            votedPowerAda: 0
          });
        }
        const stats = byProposal.get(proposalId);
        const v = String(vote.vote || "").toLowerCase();
        if (v === "yes") stats.yesPowerAda += vp;
        else if (v === "no") stats.noPowerAda += vp;
        else if (v === "abstain") {
          if (autoAbstainIds.has(drep.id)) stats.abstainAutoPowerAda += vp;
          else stats.abstainActivePowerAda += vp;
        } else if (v.includes("no_confidence")) stats.noConfidencePowerAda += vp;
        else stats.otherPowerAda += vp;
        stats.votedPowerAda += vp;
      }
    }

    for (const proposalId of Object.keys(proposalInfo)) {
      if (!byProposal.has(proposalId)) {
        byProposal.set(proposalId, {
          yesPowerAda: 0,
          noPowerAda: 0,
          noConfidencePowerAda: 0,
          abstainActivePowerAda: 0,
          abstainAutoPowerAda: 0,
          noConfidenceAutoPowerAda: 0,
          otherPowerAda: 0,
          votedPowerAda: 0
        });
      }
      const stats = byProposal.get(proposalId);
      if (alwaysAbstainPowerAda > 0) {
        stats.abstainAutoPowerAda += alwaysAbstainPowerAda;
        stats.votedPowerAda += alwaysAbstainPowerAda;
      }
      if (alwaysNoConfidencePowerAda > 0) {
        stats.noConfidenceAutoPowerAda += alwaysNoConfidencePowerAda;
      }
    }

    return {
      regularDrepStakeAda: Math.max(regularDrepStakeAda, 0),
      autoAbstainIds,
      alwaysAbstainPowerAda,
      alwaysNoConfidencePowerAda,
      byProposal
    };
  }, [payload, proposalInfo]);

  const fallbackVoteStats = useMemo(() => {
    const map = new Map();
    function ensure(proposalId) {
      if (!map.has(proposalId)) {
        map.set(proposalId, {
          drep: { yes: 0, no: 0, abstain: 0, noConfidence: 0, other: 0, total: 0 },
          constitutional_committee: { yes: 0, no: 0, abstain: 0, noConfidence: 0, other: 0, total: 0 },
          stake_pool: { yes: 0, no: 0, abstain: 0, noConfidence: 0, other: 0, total: 0 },
          other: { yes: 0, no: 0, abstain: 0, noConfidence: 0, other: 0, total: 0 }
        });
      }
      return map.get(proposalId);
    }
    const drepRows = payload?.dreps || [];
    for (const drep of drepRows) {
      for (const vote of drep.votes || []) {
        const stats = ensure(vote.proposalId).drep;
        const v = String(vote.vote || "").toLowerCase();
        if (v === "yes") stats.yes += 1;
        else if (v === "no") stats.no += 1;
        else if (v === "abstain") stats.abstain += 1;
        else if (v.includes("no_confidence")) stats.noConfidence += 1;
        else stats.other += 1;
        stats.total += 1;
      }
    }
    const ccRows = payload?.committeeMembers || [];
    for (const member of ccRows) {
      for (const vote of member.votes || []) {
        const stats = ensure(vote.proposalId).constitutional_committee;
        const v = String(vote.vote || "").toLowerCase();
        if (v === "yes") stats.yes += 1;
        else if (v === "no") stats.no += 1;
        else if (v === "abstain") stats.abstain += 1;
        else if (v.includes("no_confidence")) stats.noConfidence += 1;
        else stats.other += 1;
        stats.total += 1;
      }
    }
    return map;
  }, [payload]);

  const spoPowerStats = useMemo(() => {
    const byProposal = new Map();
    const spos = payload?.spos || [];
    const proposalIds = Object.keys(proposalInfo || {});
    function ensure(proposalId) {
      if (!byProposal.has(proposalId)) {
        byProposal.set(proposalId, {
          activeYesPowerAda: 0,
          activeNoPowerAda: 0,
          activeAbstainPowerAda: 0,
          passiveAlwaysAbstainPowerAda: 0,
          passiveAlwaysNoConfidencePowerAda: 0,
          passiveNoVotePowerAda: 0
        });
      }
      return byProposal.get(proposalId);
    }
    for (const spo of spos) {
      const vp = Number(spo?.votingPowerAda || 0);
      const votesByProposal = new Map((spo?.votes || []).map((vote) => [String(vote?.proposalId || ""), vote]));
      const spoAlwaysAbstain = isAlwaysAbstainSpo(spo);
      const spoAlwaysNoConfidence = isAlwaysNoConfidenceSpo(spo);
      for (const proposalId of proposalIds) {
        const vote = votesByProposal.get(proposalId);
        const stats = ensure(proposalId);
        if (!vote) {
          if (spoAlwaysAbstain) stats.passiveAlwaysAbstainPowerAda += vp;
          else if (spoAlwaysNoConfidence) stats.passiveAlwaysNoConfidencePowerAda += vp;
          else stats.passiveNoVotePowerAda += vp;
          continue;
        }
        const v = String(vote.vote || "").toLowerCase();
        if (v === "yes") stats.activeYesPowerAda += vp;
        else if (v === "no") stats.activeNoPowerAda += vp;
        else if (v === "abstain") stats.activeAbstainPowerAda += vp;
        else stats.passiveNoVotePowerAda += vp;
      }
    }
    return { byProposal };
  }, [payload, proposalInfo]);

  const referenceEpoch = useMemo(() => {
    const snapshotEpoch = Number(payload?.latestEpoch || 0);
    if (Number.isFinite(snapshotEpoch) && snapshotEpoch > 0) return snapshotEpoch;
    return approxCurrentEpochFromNow();
  }, [payload?.latestEpoch]);

  const rows = useMemo(() => {
    const committeeMembers = Array.isArray(payload?.committeeMembers) ? payload.committeeMembers : [];
    const committeeMinSize = Number(payload?.thresholdContext?.committeeMinSize || 0);
    const list = Object.entries(proposalInfo).map(([proposalId, info]) => {
      const status = deriveStatus(info);
      const voteStats = info?.voteStats || fallbackVoteStats.get(proposalId) || {};
      const liveNomosModel = proposalVotingSummaryCache[proposalId]?.nomosModel || info?.nomosModel || null;
      const nomosDrep = liveNomosModel?.drep || null;
      const nomosSpo = liveNomosModel?.spo || null;
      const spoStats = spoPowerStats.byProposal.get(proposalId) || {
        activeYesPowerAda: 0,
        activeNoPowerAda: 0,
        activeAbstainPowerAda: 0,
        passiveAlwaysAbstainPowerAda: 0,
        passiveAlwaysNoConfidencePowerAda: 0,
        passiveNoVotePowerAda: 0
      };
      const powerStats = drepPowerStats.byProposal.get(proposalId) || {
        yesPowerAda: 0,
        noPowerAda: 0,
        noConfidencePowerAda: 0,
        abstainActivePowerAda: 0,
        abstainAutoPowerAda: 0,
        noConfidenceAutoPowerAda: 0,
        otherPowerAda: 0,
        votedPowerAda: 0
      };
      const isNoConfidence = isNoConfidenceAction(info?.governanceType);
      const regularDrepStakeAda = Number(drepPowerStats.regularDrepStakeAda || 0);
      const totalActiveStakeAda = regularDrepStakeAda + Number(drepPowerStats.alwaysNoConfidencePowerAda || 0);
      const totalDelegatedStakeAda = totalActiveStakeAda + Number(drepPowerStats.alwaysAbstainPowerAda || 0);
      const abstainPowerAda = powerStats.abstainActivePowerAda + powerStats.abstainAutoPowerAda;
      const yesTotalAda = isNoConfidence
        ? powerStats.yesPowerAda + Number(drepPowerStats.alwaysNoConfidencePowerAda || 0)
        : powerStats.yesPowerAda;
      const noTotalAda = isNoConfidence
        ? powerStats.noPowerAda
        : powerStats.noPowerAda + Number(drepPowerStats.alwaysNoConfidencePowerAda || 0);
      const notVotedAda = Math.max(totalActiveStakeAda - yesTotalAda - noTotalAda, 0);

      const nomosYesAda = toNum(nomosDrep?.yesLovelace) / 1_000_000;
      const nomosNoAda = toNum(nomosDrep?.noLovelace) / 1_000_000;
      const nomosAbstainAda = toNum(nomosDrep?.abstainLovelace) / 1_000_000;
      const nomosNotVotedAda = toNum(nomosDrep?.notVotedLovelace) / 1_000_000;
      const nomosDelegatedAda = (toNum(nomosDrep?.derivedTotalLovelace) || 0) / 1_000_000;
      const nomosActiveAda = nomosYesAda + nomosNoAda;
      const nomosSpoYesAda = toNum(nomosSpo?.yesLovelace) / 1_000_000;
      const nomosSpoNoAda = toNum(nomosSpo?.noLovelace) / 1_000_000;
      const nomosSpoAbstainAda = toNum(nomosSpo?.abstainLovelace) / 1_000_000;
      const nomosSpoNotVotedAda = toNum(nomosSpo?.notVotedLovelace) / 1_000_000;
      const nomosSpoEffectiveTotalAda = toNum(nomosSpo?.effectiveTotalLovelace) / 1_000_000;
      const nomosSpoActiveAbstainAda = toNum(nomosSpo?.activeAbstainLovelace) / 1_000_000;
      const nomosSpoAlwaysAbstainAda = toNum(nomosSpo?.alwaysAbstainLovelace) / 1_000_000;

      const useNomos = Boolean(nomosDrep);
      const drepRequiredPct = toNum(info?.thresholdInfo?.drepRequiredPct);
      const spoRequiredPct = toNum(info?.thresholdInfo?.poolRequiredPct);
      const drepYesPct = useNomos ? toNum(nomosDrep?.yesPct) : (totalActiveStakeAda > 0 ? (yesTotalAda / totalActiveStakeAda) * 100 : null);
      const drepNoPct = useNomos ? toNum(nomosDrep?.noPct) : (totalActiveStakeAda > 0 ? (noTotalAda / totalActiveStakeAda) * 100 : null);
      const useNomosSpo = Boolean(nomosSpo);
      const localSpoActiveYesAda = Number(spoStats.activeYesPowerAda || 0);
      const localSpoActiveNoAda = Number(spoStats.activeNoPowerAda || 0);
      const localSpoActiveAbstainAda = Number(spoStats.activeAbstainPowerAda || 0);
      const localSpoPassiveAlwaysAbstainAda = Number(spoStats.passiveAlwaysAbstainPowerAda || 0);
      const localSpoPassiveAlwaysNoConfidenceAda = Number(spoStats.passiveAlwaysNoConfidencePowerAda || 0);
      const localSpoPassiveNoVoteAda = Number(spoStats.passiveNoVotePowerAda || 0);
      const localSpoBreakdownSumAda =
        localSpoActiveYesAda +
        localSpoActiveNoAda +
        localSpoActiveAbstainAda +
        localSpoPassiveAlwaysAbstainAda +
        localSpoPassiveAlwaysNoConfidenceAda +
        localSpoPassiveNoVoteAda;
      const localSpoEffectiveTotalAda = Math.max(localSpoBreakdownSumAda, 0);
      const localSpoIsNoConfidence = isNoConfidenceAction(info?.governanceType);
      const localSpoIsHardFork = isHardForkAction(info?.governanceType);
      const localUseNewSpoFormula = shouldUseNewSpoFormula(proposalId, info?.submittedEpoch);

      let localSpoYesAda = 0;
      let localSpoNoAda = 0;
      let localSpoAbstainAda = 0;
      let localSpoNotVotedAda = Math.max(localSpoPassiveNoVoteAda, 0);
      let localSpoOutcomeDenAda = 0;

      if (localUseNewSpoFormula) {
        let localSpoNotVotedCalcAda = localSpoNotVotedAda;
        if (localSpoIsHardFork) {
          localSpoYesAda = localSpoActiveYesAda;
          localSpoAbstainAda = localSpoActiveAbstainAda;
          localSpoNotVotedCalcAda = localSpoNotVotedAda + localSpoPassiveAlwaysNoConfidenceAda + localSpoPassiveAlwaysAbstainAda;
        } else if (localSpoIsNoConfidence) {
          localSpoYesAda = localSpoActiveYesAda + localSpoPassiveAlwaysNoConfidenceAda;
          localSpoAbstainAda = localSpoActiveAbstainAda + localSpoPassiveAlwaysAbstainAda;
        } else {
          localSpoYesAda = localSpoActiveYesAda;
          localSpoAbstainAda = localSpoActiveAbstainAda + localSpoPassiveAlwaysAbstainAda;
        }
        localSpoNoAda = localSpoActiveNoAda + Math.max(localSpoNotVotedCalcAda, 0);
        localSpoOutcomeDenAda = Math.max(localSpoEffectiveTotalAda - localSpoAbstainAda, 0);
      } else {
        localSpoYesAda = localSpoActiveYesAda;
        localSpoNoAda = localSpoActiveNoAda + localSpoPassiveAlwaysNoConfidenceAda;
        localSpoAbstainAda = localSpoActiveAbstainAda + localSpoPassiveAlwaysAbstainAda;
        localSpoOutcomeDenAda = Math.max(localSpoActiveYesAda + localSpoActiveNoAda + localSpoPassiveAlwaysNoConfidenceAda, 0);
      }

      const spoYesAda = useNomosSpo ? nomosSpoYesAda : localSpoYesAda;
      const spoNoAda = useNomosSpo ? nomosSpoNoAda : localSpoNoAda;
      const spoAlwaysAbstainAda = useNomosSpo ? nomosSpoAlwaysAbstainAda : localSpoPassiveAlwaysAbstainAda;
      const spoAbstainAda = useNomosSpo
        ? (nomosSpoActiveAbstainAda + nomosSpoAlwaysAbstainAda)
        : localSpoAbstainAda;
      const spoNotVotedAda = useNomosSpo ? nomosSpoNotVotedAda : localSpoNotVotedAda;
      const spoEffectiveTotalAda = useNomosSpo ? nomosSpoEffectiveTotalAda : localSpoEffectiveTotalAda;
      const spoOutcomeDenAda = useNomosSpo ? Math.max(spoYesAda + spoNoAda, 0) : localSpoOutcomeDenAda;
      const spoYesPct = useNomosSpo
        ? toNum(nomosSpo?.yesPct)
        : (spoOutcomeDenAda > 0 ? (spoYesAda / spoOutcomeDenAda) * 100 : null);
      const spoNoPct = useNomosSpo
        ? toNum(nomosSpo?.noPct)
        : (spoOutcomeDenAda > 0 ? (spoNoAda / spoOutcomeDenAda) * 100 : null);
      const spoAbstainPct = useNomosSpo
        ? toNum(nomosSpo?.abstainPct)
        : (spoEffectiveTotalAda > 0 ? (spoAbstainAda / spoEffectiveTotalAda) * 100 : null);
      const spoNotVotedPct = spoEffectiveTotalAda > 0 ? (spoNotVotedAda / spoEffectiveTotalAda) * 100 : null;
      const drepThresholdMet = drepRequiredPct > 0 && drepYesPct !== null ? drepYesPct >= drepRequiredPct : null;
      const spoThresholdMet = spoRequiredPct > 0 && spoYesPct !== null ? spoYesPct >= spoRequiredPct : null;
      const passingNow =
        drepThresholdMet === false
          ? false
          : spoThresholdMet === false
            ? false
            : drepThresholdMet === true
              ? (spoThresholdMet === null ? true : spoThresholdMet)
            : null;
      const submittedEpoch = Number(info?.submittedEpoch || 0);
      const activeNowCommitteeCount = committeeMembers.filter((member) => String(member?.status || "").toLowerCase() === "active").length;
      const ccEligibleCountFromEpoch = submittedEpoch > 0
        ? committeeMembers.filter((member) => {
            const start = Number(member?.seatStartEpoch || 0);
            const end = Number(member?.expirationEpoch || 0);
            if (start > 0 && submittedEpoch < start) return false;
            if (end > 0 && submittedEpoch > end) return false;
            return true;
          }).length
        : 0;
      const ccEligibleCount = ccEligibleCountFromEpoch > 0
        ? ccEligibleCountFromEpoch
        : (activeNowCommitteeCount > 0 ? activeNowCommitteeCount : committeeMinSize);
      const expirationEpoch = Number(info?.expirationEpoch || 0) || null;
      const epochsUntilExpiration = expirationEpoch && referenceEpoch
        ? (expirationEpoch - referenceEpoch)
        : null;
      const isExpiringSoon =
        status === "Active" &&
        Number.isFinite(epochsUntilExpiration) &&
        epochsUntilExpiration >= 0 &&
        epochsUntilExpiration <= EXPIRING_SOON_EPOCHS;

      return {
        proposalId,
        actionName: info?.actionName || proposalId,
        governanceType: info?.governanceType || "Unknown",
        outcome: info?.outcome || "Unknown",
        status,
        submittedAt: info?.submittedAt || null,
        submittedAtUnix: Number(info?.submittedAtUnix || 0),
        submittedEpoch: info?.submittedEpoch || null,
        depositAda: Number(info?.depositAda || 0),
        thresholdInfo: info?.thresholdInfo || {},
        voteStats,
        totalVotes: roleTotalVotes(voteStats),
        txHash: info?.txHash || null,
        returnAddress: info?.returnAddress || "",
        certIndex: info?.certIndex,
        expirationEpoch,
        epochsUntilExpiration,
        isExpiringSoon,
        ratifiedEpoch: info?.ratifiedEpoch,
        enactedEpoch: info?.enactedEpoch,
        droppedEpoch: info?.droppedEpoch,
        expiredEpoch: info?.expiredEpoch,
        governanceDescription: info?.governanceDescription || null,
        modelSource: (useNomos || useNomosSpo) ? "nomos-koios" : "local-fallback",
        totalDelegatedStakeAda: useNomos ? nomosDelegatedAda : totalDelegatedStakeAda,
        totalActiveStakeAda: useNomos ? nomosActiveAda : totalActiveStakeAda,
        drepPowerVotedAda: powerStats.votedPowerAda,
        drepYesPowerAda: useNomos ? nomosYesAda : yesTotalAda,
        drepNoPowerAda: useNomos ? nomosNoAda : noTotalAda,
        drepAbstainPowerAda: useNomos ? nomosAbstainAda : abstainPowerAda,
        drepAbstainActivePowerAda: useNomos ? toNum(nomosDrep?.activeAbstainLovelace) / 1_000_000 : powerStats.abstainActivePowerAda,
        drepAbstainAutoPowerAda: useNomos ? toNum(nomosDrep?.alwaysAbstainLovelace) / 1_000_000 : powerStats.abstainAutoPowerAda,
        drepNoConfidencePowerAda: useNomos ? toNum(nomosDrep?.alwaysNoConfidenceLovelace) / 1_000_000 : powerStats.noConfidencePowerAda + powerStats.noConfidenceAutoPowerAda,
        drepNoConfidenceAutoPowerAda: useNomos ? toNum(nomosDrep?.alwaysNoConfidenceLovelace) / 1_000_000 : powerStats.noConfidenceAutoPowerAda,
        drepYesPowerPct: drepYesPct,
        drepNoPowerPct: drepNoPct,
        drepNotVotedPowerAda: useNomos ? nomosNotVotedAda : notVotedAda,
        drepNotVotedPowerPct: useNomos ? toNum(nomosDrep?.notVotedPct) : (totalActiveStakeAda > 0 ? (notVotedAda / totalActiveStakeAda) * 100 : null),
        drepAbstainPowerPct: useNomos ? toNum(nomosDrep?.abstainPct) : (totalDelegatedStakeAda > 0 ? (abstainPowerAda / totalDelegatedStakeAda) * 100 : null),
        drepAbstainActivePowerPct: totalDelegatedStakeAda > 0 ? (powerStats.abstainActivePowerAda / totalDelegatedStakeAda) * 100 : null,
        drepAbstainAutoPowerPct: useNomos ? (nomosDelegatedAda > 0 ? (toNum(nomosDrep?.alwaysAbstainLovelace) / 1_000_000 / nomosDelegatedAda) * 100 : null) : (totalDelegatedStakeAda > 0 ? (powerStats.abstainAutoPowerAda / totalDelegatedStakeAda) * 100 : null),
        drepNoConfidencePowerPct: totalActiveStakeAda > 0 ? ((powerStats.noConfidencePowerAda + powerStats.noConfidenceAutoPowerAda) / totalActiveStakeAda) * 100 : null,
        drepNoConfidenceAutoPowerPct: useNomos ? (nomosDelegatedAda > 0 ? (toNum(nomosDrep?.alwaysNoConfidenceLovelace) / 1_000_000 / nomosDelegatedAda) * 100 : null) : (totalDelegatedStakeAda > 0 ? (powerStats.noConfidenceAutoPowerAda / totalDelegatedStakeAda) * 100 : null),
        drepTurnoutPowerPct: useNomos ? toNum(nomosDrep?.yesPct) + toNum(nomosDrep?.noPct) : (totalActiveStakeAda > 0 ? ((yesTotalAda + noTotalAda) / totalActiveStakeAda) * 100 : null),
        hasAutoAbstainPower: useNomos ? toNum(nomosDrep?.alwaysAbstainLovelace) > 0 : Number(drepPowerStats.alwaysAbstainPowerAda || 0) > 0,
        spoYesPct,
        spoNoPct,
        spoAbstainPct,
        spoNotVotedPct,
        spoYesAda,
        spoNoAda,
        spoAbstainAda,
        spoNotVotedAda,
        spoAlwaysAbstainAda,
        drepRequiredPct: drepRequiredPct > 0 ? drepRequiredPct : null,
        spoRequiredPct: spoRequiredPct > 0 ? spoRequiredPct : null,
        drepThresholdMet,
        spoThresholdMet,
        passingNow,
        ccEligibleCount
      };
    });

    return list
      .filter((row) => {
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        return (
          row.actionName.toLowerCase().includes(q) ||
          row.proposalId.toLowerCase().includes(q) ||
          row.txHash?.toLowerCase().includes(q)
        );
      })
      .filter((row) => (typeFilter ? row.governanceType === typeFilter : true))
      .filter((row) => (statusFilter ? row.status === statusFilter : true))
      .sort((a, b) => {
        if (sortBy === "newest") return (b.submittedAtUnix || 0) - (a.submittedAtUnix || 0);
        if (sortBy === "oldest") return (a.submittedAtUnix || 0) - (b.submittedAtUnix || 0);
        if (sortBy === "votes") return b.totalVotes - a.totalVotes;
        if (sortBy === "deposit") return b.depositAda - a.depositAda;
        return a.actionName.localeCompare(b.actionName);
      });
  }, [proposalInfo, proposalVotingSummaryCache, fallbackVoteStats, drepPowerStats, spoPowerStats, query, typeFilter, statusFilter, sortBy, referenceEpoch]);

  useEffect(() => {
    if (!rows.length) {
      setSelectedWithUrl("");
      return;
    }
    if (selectedId && !rows.some((row) => row.proposalId === selectedId)) {
      setSelectedWithUrl("");
    }
  }, [rows, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    if (!detailPanelRef.current) return;
    detailPanelRef.current.scrollTop = 0;
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return undefined;
    const onPointerDown = (event) => {
      const node = detailPanelRef.current;
      if (!node) return;
      const target = event.target;
      if (target instanceof Node && node.contains(target)) return;
      setSelectedWithUrl("");
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [selectedId]);

  function setSelectedWithUrl(nextId) {
    setSelectedId(nextId);
    const url = new URL(window.location.href);
    if (nextId) url.searchParams.set("id", nextId);
    else url.searchParams.delete("id");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  const selected = rows.find((row) => row.proposalId === selectedId);
  const payloadDoc = useMemo(
    () => normalizeActionPayload(selected, proposalMetadataCache[selected?.proposalId || ""] || null),
    [selected, proposalMetadataCache]
  );
  const typeOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.governanceType))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.status).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const activeCount = rows.filter((row) => row.status === "Active").length;
  const enactedCount = rows.filter((row) => row.status === "Enacted").length;
  const expiringSoonCount = rows.filter((row) => row.isExpiringSoon).length;

  // Reset vote UI when selected action changes
  useEffect(() => {
    setVoteChoice("");
    setVoteModalOpen(false);
    setVoteRationaleUrl("");
    setVoteNotice("");
    setVoteError("");
    setVotedTxHash("");
    setVoteSyncStatus("");
    if (voteSyncPollRef.current) {
      clearInterval(voteSyncPollRef.current);
      voteSyncPollRef.current = null;
    }
  }, [selectedId]);

  // Resolve IPFS URIs to HTTP gateway URLs
  function resolveIpfsUrl(url) {
    if (typeof url === "string" && url.startsWith("ipfs://")) {
      return `https://ipfs.io/ipfs/${url.slice(7)}`;
    }
    return url;
  }

  // Start post-vote sync polling — polls /api/sync-status every 20s for up to 5 min
  function startVoteSyncPolling(snapshotAtSubmit) {
    let attempts = 0;
    const maxAttempts = 15;
    setVoteSyncStatus("polling");
    if (voteSyncPollRef.current) clearInterval(voteSyncPollRef.current);
    voteSyncPollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const res = await fetch("/api/sync-status");
        if (!res.ok) return;
        const status = await res.json();
        const latest = String(status?.lastCompletedAt || "");
        if (latest && latest !== snapshotAtSubmit) {
          setVoteSyncStatus("synced");
          clearInterval(voteSyncPollRef.current);
          voteSyncPollRef.current = null;
          return;
        }
      } catch {
        // ignore network errors during polling
      }
      if (attempts >= maxAttempts) {
        setVoteSyncStatus("timeout");
        clearInterval(voteSyncPollRef.current);
        voteSyncPollRef.current = null;
      }
    }, 20_000);
  }

  async function submitVote() {
    if (!selected || !wallet?.walletApi || !wallet?.walletDrep || !voteChoice) return;
    try {
      setVoteSubmitting(true);
      setVoteModalOpen(false);
      setVoteError("");
      setVoteNotice("");
      setVotedTxHash("");
      setVoteSyncStatus("");

      // 1. DRep credential already fetched at connect time — use from context
      const drepIdCip105 = wallet.walletDrep.dRepIDCip105;

      // 2. Warn if not mainnet
      if (wallet.walletNetworkId !== 1) {
        setVoteNotice("Warning: wallet is on testnet. Proceeding anyway...");
      }

      // 3. Optional rationale anchor (with IPFS resolution)
      let anchor;
      const rationaleUrlTrimmed = resolveIpfsUrl(voteRationaleUrl.trim());
      if (rationaleUrlTrimmed) {
        try {
          setVoteNotice("Fetching rationale to compute anchor hash...");
          const res = await fetch(rationaleUrlTrimmed);
          const text = await res.text();
          const bytes = new TextEncoder().encode(text);
          const hashHex = blakejs.blake2bHex(bytes, null, 32);
          // Store original URL (may be ipfs://) in anchor, HTTP URL used only for fetching
          anchor = { url: voteRationaleUrl.trim() || rationaleUrlTrimmed, hash: hashHex };
          setVoteNotice("");
        } catch {
          setVoteNotice("Could not fetch rationale URL — voting without anchor.");
          anchor = undefined;
        }
      }

      // 4. Build vote transaction
      setVoteNotice("Building transaction...");
      const tx = new Transaction({ initiator: wallet.walletApi, verbose: false });
      tx.setNetwork("mainnet");
      tx.txBuilder.vote(
        { type: "DRep", drepId: drepIdCip105 },
        { txHash: selected.txHash, txIndex: selected.certIndex ?? 0 },
        { voteKind: voteChoice, ...(anchor ? { anchor } : {}) }
      );

      const unsignedTx = await tx.build();
      setVoteNotice("Please sign the transaction in your wallet...");
      const signedTx = await wallet.walletApi.signTx(unsignedTx, true, true);
      setVoteNotice("Submitting to chain...");
      const txHash = await wallet.walletApi.submitTx(signedTx);
      setVotedTxHash(txHash);
      setVoteNotice("");

      // 5. Start polling for backend sync confirmation
      const snapshotAtSubmit = String(latestSnapshotRef.current || "");
      startVoteSyncPolling(snapshotAtSubmit);
    } catch (e) {
      const msg = e?.message || "Vote transaction failed.";
      setVoteError(msg);
      setVoteNotice("");
    } finally {
      setVoteSubmitting(false);
    }
  }

  useEffect(() => {
    if (!selected?.proposalId) return;
    const key = selected.proposalId;
    if (proposalMetadataCache[key]) return;
    let cancelled = false;
    const run = async () => {
      try {
        setProposalMetadataLoading(true);
        setProposalMetadataError("");
        const res = await fetch(`/api/proposal-metadata?proposalId=${encodeURIComponent(key)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load proposal metadata.");
        if (cancelled) return;
        setProposalMetadataCache((prev) => ({ ...prev, [key]: data }));
      } catch (e) {
        if (!cancelled) setProposalMetadataError(e.message || "Failed to load proposal metadata.");
      } finally {
        if (!cancelled) setProposalMetadataLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selected?.proposalId, proposalMetadataCache]);

  useEffect(() => {
    if (!selected?.proposalId) return;
    const key = selected.proposalId;
    if (proposalVotingSummaryCache[key]) return;
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`/api/proposal-voting-summary?proposalId=${encodeURIComponent(key)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        if (cancelled) return;
        if (data?.nomosModel && typeof data.nomosModel === "object") {
          setProposalVotingSummaryCache((prev) => ({ ...prev, [key]: data }));
        }
      } catch {
        // Keep existing snapshot data if Koios summary fetch fails.
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selected?.proposalId, proposalVotingSummaryCache]);

  return (
    <main className="shell">
      <header className="hero">
        <h1>Governance Action Explorer</h1>
      </header>

      <section className="cards">
        <article className="card">
          <p>Total Actions</p>
          <strong>{rows.length}</strong>
        </article>
        <article className="card">
          <p>Active Actions</p>
          <strong>{activeCount}</strong>
        </article>
        <article className="card">
          <p>Enacted</p>
          <strong>{enactedCount}</strong>
        </article>
        <article className="card">
          <p>Expiring Soon (&lt;= 5d)</p>
          <strong>{expiringSoonCount}</strong>
        </article>
      </section>

      <section className="controls">
        <label>
          Search
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Action name, ID, tx hash..." />
        </label>
        <label>
          Governance Type
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="votes">Most votes</option>
            <option value="deposit">Largest deposit</option>
            <option value="name">Name</option>
          </select>
        </label>
      </section>

      <section className="status-row">
        <div className="header-links">
          <p className="muted">
            {loading ? "Loading actions..." : error ? `Error: ${error}` : payload?.historical ? `Historical snapshot: ${payload.snapshotKey}` : ""}
          </p>
        </div>
      </section>

      <section className="layout layout-modal">
        <div className="panel table-panel">
          <table className="mobile-cards-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Type</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Yes / No (active)</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No governance actions match these filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isExpanded = row.proposalId === selectedId;
                  return (
                    <Fragment key={row.proposalId}>
                      <tr
                        className={`${isExpanded ? "active" : ""}${row.isExpiringSoon ? " expiring-soon-row" : ""}`}
                        onClick={() => setSelectedWithUrl(isExpanded ? "" : row.proposalId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedWithUrl(isExpanded ? "" : row.proposalId);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded ? "true" : "false"}
                      >
                        <td data-label="Action">{row.actionName}</td>
                        <td data-label="Type">{row.governanceType}</td>
                        <td data-label="Status">
                          {row.status ? <span className={`pill ${statusPillClass(row.status)}`}>{row.status}</span> : ""}
                          {row.isExpiringSoon ? <span className="pill warn">Expiring in {Math.max(0, Number(row.epochsUntilExpiration || 0))} ep</span> : null}
                        </td>
                        <td data-label="Submitted">
                          {row.submittedEpoch ? <span>Epoch {row.submittedEpoch}</span> : null}
                          {row.submittedAt ? <div className="muted">{new Date(row.submittedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</div> : null}
                          {row.isExpiringSoon && row.expirationEpoch ? (
                            <div className="expiring-inline-note">
                              Expires by epoch {row.expirationEpoch}
                            </div>
                          ) : null}
                        </td>
                        <td data-label="Yes / No (active)">
                          {asPct(row.drepYesPowerPct)} / {asPct(row.drepNoPowerPct)}
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr className="action-expanded-row">
                          <td colSpan={5}>
                            <div ref={detailPanelRef} className="detail panel action-inline-detail">
                              <h2>{row.actionName}</h2>
                              <p className="mono">{row.proposalId}</p>
                              <div className="meta action-inline-meta">
                                <p>
                                  Type: <strong>{row.governanceType}</strong>
                                </p>
                                <p>
                                  Status: {row.status ? <span className={`pill ${statusPillClass(row.status)}`}>{row.status}</span> : ""}
                                  {row.isExpiringSoon ? <span className="pill warn">Expiring in {Math.max(0, Number(row.epochsUntilExpiration || 0))} epoch(s)</span> : null}
                                </p>
                                <p>
                                  Submitted:{" "}
                                  <strong>
                                    {row.submittedEpoch ? `Epoch ${row.submittedEpoch}` : ""}
                                    {row.submittedEpoch && row.submittedAt ? " · " : ""}
                                    {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : (!row.submittedEpoch ? "Unknown" : "")}
                                  </strong>
                                </p>
                                {row.expirationEpoch ? (
                                  <p>
                                    Expires:{" "}
                                    <strong>
                                      Epoch {row.expirationEpoch}
                                      {formatEpochDate(row.expirationEpoch) ? ` · ~${formatEpochDate(row.expirationEpoch)}` : ""}
                                    </strong>
                                  </p>
                                ) : null}
                                {row.isExpiringSoon ? (
                                  <p className="expiring-warning-text">
                                    Expiry alert: this action is inside the expiring-soon window.
                                  </p>
                                ) : null}
                                <p>
                                  Deposit: <strong>{Number(row.depositAda || 0).toLocaleString()} ada</strong>
                                </p>
                                <p>
                                  Required DRep threshold: <strong>{asPct(row.thresholdInfo?.drepRequiredPct)}</strong>
                                </p>
                                {row.thresholdInfo?.ccRequiredPct != null ? (
                                  <p>
                                    Required CC threshold: <strong>{asPct(row.thresholdInfo.ccRequiredPct)}</strong>
                                  </p>
                                ) : null}
                                {row.thresholdInfo?.poolRequiredPct != null ? (
                                  <p>
                                    Required SPO threshold: <strong>{asPct(row.thresholdInfo.poolRequiredPct)}</strong>
                                  </p>
                                ) : null}
                                {row.thresholdInfo?.parameterGroup ? (
                                  <p>
                                    Parameter group: <strong>{row.thresholdInfo.parameterGroup}</strong>
                                  </p>
                                ) : null}
                                {row.txHash ? (
                                  <p>
                                    Tx:{" "}
                                    <a className="ext-link" href={`https://cardanoscan.io/transaction/${row.txHash}`} target="_blank" rel="noreferrer">
                                      {row.txHash}
                                    </a>
                                  </p>
                                  ) : null}
                              </div>

                              <section className="action-vote-pies">
                                {eligibleVoteGroups(row).map((group) => (
                                  <VoteMixPie key={`${row.proposalId}-${group.key}`} group={group} row={row} />
                                ))}
                              </section>

                              {row.status === "Active" ? (
                                <div className="vote-cast-section">
                                  <h3 className="detail-section-title">Cast Your Vote</h3>

                                  {!wallet?.walletApi ? (
                                    <p className="muted">Connect your wallet in the top bar to vote on this action.</p>
                                  ) : !wallet.walletDrep ? (
                                    <p className="muted">Connected wallet has no DRep credential. Only registered DReps can vote on governance actions.</p>
                                  ) : (
                                    <>
                                      <div className="vote-choice-row">
                                        {["Yes", "No", "Abstain"].map((choice) => (
                                          <button
                                            key={choice}
                                            type="button"
                                            className={`vote-choice-btn${voteChoice === choice ? " active" : ""}`}
                                            onClick={() => { setVoteChoice(choice); setVoteModalOpen(true); }}
                                            disabled={voteSubmitting}
                                          >
                                            {choice}
                                          </button>
                                        ))}
                                      </div>
                                      {voteSubmitting ? <p className="vote-notice">{voteNotice || "Submitting vote..."}</p> : null}
                                    </>
                                  )}

                                  {voteError ? <p className="vote-error">{voteError}</p> : null}
                                  {!voteSubmitting && voteNotice && !votedTxHash ? <p className="vote-notice">{voteNotice}</p> : null}
                                  {votedTxHash ? (
                                    <div className="vote-submitted">
                                      <p className="vote-success">
                                        Vote submitted! Tx:{" "}
                                        <a
                                          className="ext-link"
                                          href={`https://cardanoscan.io/transaction/${votedTxHash}`}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          {votedTxHash.slice(0, 16)}…
                                        </a>
                                      </p>
                                      {voteSyncStatus === "polling" ? (
                                        <p className="vote-notice">Waiting for snapshot to update…</p>
                                      ) : voteSyncStatus === "synced" ? (
                                        <p className="vote-success">✓ Vote confirmed in latest snapshot.</p>
                                      ) : voteSyncStatus === "timeout" ? (
                                        <p className="vote-notice">Snapshot not yet updated — your vote is on-chain. Refresh in a few minutes.</p>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}

                              <section className="action-payload-details">
                                <h3 className="detail-section-title">Governance Payload</h3>
                                {proposalMetadataLoading ? <p className="muted">Loading metadata...</p> : null}
                                {proposalMetadataError ? <p className="muted">Metadata error: {proposalMetadataError}</p> : null}
                                {payloadDoc.metadataUrl ? (
                                  <section className="rationale-section">
                                    <h4>Metadata URL</h4>
                                    <a className="ext-link" href={payloadDoc.metadataUrl} target="_blank" rel="noreferrer">
                                      {payloadDoc.metadataUrl}
                                    </a>
                                    {payloadDoc.metadataHash ? <p className="mono">{payloadDoc.metadataHash}</p> : null}
                                  </section>
                                ) : null}
                                {payloadDoc.sections.map((section) => (
                                  <section className="rationale-section" key={`${row.proposalId}-${section.key}`}>
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
                                {payloadDoc.references.length > 0 ? (
                                  <section className="rationale-section">
                                    <h4>References</h4>
                                    <div className="vote-list">
                                      {payloadDoc.references.map((ref) => (
                                        <article className="vote-item" key={`${row.proposalId}-${ref.uri}`}>
                                          <p className="mono">{ref.type}</p>
                                          <a className="ext-link" href={ref.uri} target="_blank" rel="noreferrer">
                                            {ref.label}
                                          </a>
                                        </article>
                                      ))}
                                    </div>
                                  </section>
                                ) : null}
                                <details className="payload-raw">
                                  <summary>Raw JSON</summary>
                                  <pre className="json-pre payload-pretty">{JSON.stringify(payloadDoc.raw || {}, null, 2)}</pre>
                                </details>
                              </section>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      {/* Vote confirmation modal */}
      {voteModalOpen && selected && voteChoice && wallet?.walletDrep ? (
        <div className="image-modal-backdrop" role="presentation" onClick={() => setVoteModalOpen(false)}>
          <div className="image-modal vote-confirm-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="image-modal-close" onClick={() => setVoteModalOpen(false)}>
              Cancel
            </button>
            <h3 className="rationale-modal-title">Confirm Your Vote</h3>
            <div className="vote-confirm-body">
              <p className="vote-confirm-action">{selected.actionName}</p>
              <div className={`vote-confirm-badge vote-confirm-badge--${voteChoice.toLowerCase()}`}>
                {voteChoice}
              </div>
              <p className="muted">Voting as DRep: <span className="mono">{wallet.walletDrep.dRepIDCip105}</span></p>

              <label className="vote-rationale-label">
                Rationale URL (optional — CIP-100 / IPFS supported)
                <input
                  type="url"
                  value={voteRationaleUrl}
                  onChange={(e) => setVoteRationaleUrl(e.target.value)}
                  placeholder="https://your-rationale.json  or  ipfs://Qm..."
                  autoFocus
                />
              </label>

              {wallet.walletNetworkId !== 1 ? (
                <p className="vote-notice">⚠ Wallet is on testnet — vote will be submitted to testnet.</p>
              ) : null}

              <div className="vote-confirm-actions">
                <button type="button" className="mode-btn" onClick={() => setVoteModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={`vote-confirm-submit vote-confirm-submit--${voteChoice.toLowerCase()}`}
                  onClick={submitVote}
                >
                  Submit {voteChoice} Vote On-Chain
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </main>
  );
}
