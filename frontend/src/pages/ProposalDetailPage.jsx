import { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useSnapshotUpdates } from "../hooks/useSnapshotUpdates";
import MetaVerifyPill from "../components/MetaVerifyPill";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

class MarkdownErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: false }; }
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error) {
      return <pre className="payload-markdown" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{this.props.source}</pre>;
    }
    return this.props.children;
  }
}

function SafeMarkdown({ children }) {
  return (
    <MarkdownErrorBoundary source={children}>
      <div className="payload-markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {children}
        </ReactMarkdown>
      </div>
    </MarkdownErrorBoundary>
  );
}

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

const SHELLEY_EPOCH_208_START_UNIX = 1596059091;
const EPOCH_DURATION_SECONDS = 432000;

function epochStartUnix(epoch) {
  return SHELLEY_EPOCH_208_START_UNIX + (epoch - 208) * EPOCH_DURATION_SECONDS;
}

function epochToDate(epoch) {
  if (!epoch || epoch <= 0) return null;
  return new Date(epochStartUnix(epoch) * 1000);
}

function formatEpochDate(epoch) {
  const d = epochToDate(epoch);
  if (!d) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function deriveStatus(info) {
  if (!info) return "Unknown";
  if (String(info.outcome || "").toLowerCase() === "pending") return "Active";
  const govType = String(info.governanceType || "").toLowerCase();
  if (govType.includes("info action") || govType === "info") return "";
  const droppedEpoch = Number(info?.droppedEpoch || 0);
  const expiredEpoch = Number(info?.expiredEpoch || 0);
  const expirationEpoch = Number(info?.expirationEpoch || 0);
  const hasDropped = droppedEpoch > 0;
  const hasExpired = expiredEpoch > 0;
  if (hasDropped && hasExpired) {
    return expirationEpoch > 0 && droppedEpoch < expirationEpoch ? "Dropped" : "Expired";
  }
  if (hasDropped) return expirationEpoch > 0 && droppedEpoch >= expirationEpoch ? "Expired" : "Dropped";
  if (hasExpired) return "Expired";
  if (info.enactedEpoch !== null && info.enactedEpoch !== undefined) return "Enacted";
  if (info.ratifiedEpoch !== null && info.ratifiedEpoch !== undefined) return "Ratified";
  return String(info.outcome || "Unknown");
}

function statusPillMod(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return "pill--active";
  if (s === "ratified") return "pill--ratified";
  if (s === "enacted") return "pill--enacted";
  if (s === "expired") return "pill--expired";
  if (s === "dropped") return "pill--dropped";
  return "pill--unknown";
}

function votePillMod(vote) {
  const v = String(vote || "").toLowerCase();
  if (v === "yes") return "pill--active";
  if (v === "no") return "pill--dropped";
  if (v === "abstain") return "pill--expired";
  if (v.includes("confidence")) return "pill--ratified";
  return "pill--unknown";
}

async function fetchBrowserKoiosVoteRationales(proposalId) {
  const pid = String(proposalId || "").trim();
  if (!pid) return [];
  const url = `https://api.koios.rest/api/v1/vote_list?proposal_id=eq.${encodeURIComponent(pid)}&order=block_time.desc&limit=1000`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const rows = await res.json().catch(() => []);
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const voteTxHash = String(row?.vote_tx_hash || row?.tx_hash || row?.txHash || "").trim().toLowerCase();
      const rationaleUrl = String(row?.meta_url || row?.anchor_url || row?.metadata_url || row?.url || "").trim();
      const rationaleHash = String(row?.meta_hash || row?.anchor_hash || "").trim();
      const hasRationale = Boolean(rationaleUrl || rationaleHash || row?.meta_json);
      return { voteTxHash, hasRationale, rationaleUrl };
    })
    .filter((row) => row.voteTxHash && row.hasRationale);
}

const PREFERRED_SECTIONS = [
  ["abstract", "Abstract"],
  ["summary", "Summary"],
  ["motivation", "Motivation"],
  ["rationaleStatement", "Rationale"],
  ["rationale", "Rationale"],
  ["precedentDiscussion", "Precedent Discussion"],
  ["counterargumentDiscussion", "Counterarguments"],
  ["conclusion", "Conclusion"],
];

function asPct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  return `${Math.round(Number(value) * 100) / 100}%`;
}

function toFiniteOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function voteSlices(stats) {
  const yes = Number(stats?.yes || 0);
  const no = Number(stats?.no || 0);
  const abstain = Number(stats?.abstain || 0);
  const other = Number(stats?.noConfidence || 0) + Number(stats?.other || 0);
  const total = yes + no + abstain + other;
  return { yes, no, abstain, other, total };
}

function formatAdaCompact(value) {
  return `${Math.round(Number(value || 0)).toLocaleString()} ada`;
}

function formatAdaShort(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n >= 1_000_000_000) return `${Math.round((n / 1_000_000_000) * 100) / 100}B`;
  if (n >= 1_000_000) return `${Math.round((n / 1_000_000) * 100) / 100}M`;
  if (n >= 1_000) return `${Math.round((n / 1_000) * 100) / 100}K`;
  return `${Math.round(n)}`;
}

function extractTreasuryAmountAda(info) {
  if (!info) return 0;
  if (Number(info.withdrawalAmountAda || 0) > 0) return Number(info.withdrawalAmountAda);
  const withdrawals = info.metadataJson?.body?.onChain?.withdrawals;
  if (Array.isArray(withdrawals)) {
    const total = withdrawals.reduce((s, r) => s + Number(r?.withdrawalAmount || 0), 0);
    if (total > 0) return total / 1_000_000;
  }
  const entries = Array.isArray(info.governanceDescription?.contents?.[0]) ? info.governanceDescription.contents[0] : [];
  const total = entries.reduce((s, item) => s + Number(Array.isArray(item) ? item[1] : 0), 0);
  return total > 0 ? total / 1_000_000 : 0;
}

function eligibleVoteGroups(info) {
  const groups = [];
  const drepEligible = Number(info?.thresholdInfo?.drepRequiredPct || 0) > 0 || Number(info?.voteStats?.drep?.total || 0) > 0;
  const ccEligible = info?.thresholdInfo?.ccRequiredPct != null;
  const spoEligible = info?.thresholdInfo?.poolRequiredPct != null;
  if (drepEligible) groups.push({ key: "drep", label: "DRep", stats: info?.voteStats?.drep || {} });
  if (ccEligible) groups.push({ key: "cc", label: "Constitutional Committee", stats: info?.voteStats?.constitutional_committee || {} });
  if (spoEligible) groups.push({ key: "spo", label: "SPO", stats: info?.voteStats?.stake_pool || {} });
  return groups;
}

function hasActiveDrepVotingPower(drep) {
  const status = String(drep?.status || "").trim().toLowerCase();
  return status !== "expired" && status !== "retired";
}

const SPO_FORMULA_TRANSITION_EPOCH = 534;
const SPO_FORMULA_TRANSITION_GOV_ACTION = "gov_action1pvv5wmjqhwa4u85vu9f4ydmzu2mgt8n7et967ph2urhx53r70xusqnmm525";

function computePieInfo(info, proposalId, payload) {
  if (!info || !payload) return info || {};
  const dreps = Array.isArray(payload.dreps) ? payload.dreps : [];
  const spos = Array.isArray(payload.spos) ? payload.spos : [];
  const committeeMembers = Array.isArray(payload.committeeMembers) ? payload.committeeMembers : [];

  // === DRep power ===
  const ALWAYS_ABSTAIN_ID = "drep_always_abstain";
  const ALWAYS_NO_CONFIDENCE_ID = "drep_always_no_confidence";
  const knownIds = new Set(dreps.map((d) => d.id));
  const autoAbstainIds = new Set([ALWAYS_ABSTAIN_ID]);
  for (const drep of dreps) {
    const name = String(drep.name || "").toLowerCase();
    const id = String(drep.id || "").toLowerCase();
    const allAbstain = (drep.votes || []).every((v) => String(v.vote || "").toLowerCase() === "abstain");
    if (name.includes("auto") && name.includes("abstain")) autoAbstainIds.add(drep.id);
    else if (name.includes("always") && name.includes("abstain")) autoAbstainIds.add(drep.id);
    else if (id.includes("always") && id.includes("abstain")) autoAbstainIds.add(drep.id);
    else if (id.includes("auto") && id.includes("abstain")) autoAbstainIds.add(drep.id);
    else if (allAbstain && (name.includes("abstain") || id.includes("abstain"))) autoAbstainIds.add(drep.id);
  }

  let regularDrepStakeAda = dreps.reduce((s, d) => (
    hasActiveDrepVotingPower(d) ? s + Number(d.votingPowerAda || 0) : s
  ), 0);
  if (knownIds.has(ALWAYS_ABSTAIN_ID)) regularDrepStakeAda -= Number(dreps.find((d) => d.id === ALWAYS_ABSTAIN_ID)?.votingPowerAda || 0);
  if (knownIds.has(ALWAYS_NO_CONFIDENCE_ID)) regularDrepStakeAda -= Number(dreps.find((d) => d.id === ALWAYS_NO_CONFIDENCE_ID)?.votingPowerAda || 0);
  const alwaysAbstainPowerAda = Number(dreps.find((d) => d.id === ALWAYS_ABSTAIN_ID)?.votingPowerAda || 0);
  const alwaysNoConfidencePowerAda = Number(dreps.find((d) => d.id === ALWAYS_NO_CONFIDENCE_ID)?.votingPowerAda || 0);
  const totalActiveStakeAda = Math.max(regularDrepStakeAda, 0) + alwaysNoConfidencePowerAda;

  const drepPs = { yesPowerAda: 0, noPowerAda: 0, noConfidencePowerAda: 0, abstainActivePowerAda: 0, abstainAutoPowerAda: alwaysAbstainPowerAda };
  for (const drep of dreps) {
    if (!hasActiveDrepVotingPower(drep)) continue;
    const vp = Number(drep.votingPowerAda || 0);
    const vote = (drep.votes || []).find((v) => v.proposalId === proposalId);
    if (!vote) continue;
    const v = String(vote.vote || "").toLowerCase();
    if (v === "yes") drepPs.yesPowerAda += vp;
    else if (v === "no") drepPs.noPowerAda += vp;
    else if (v === "abstain") {
      if (autoAbstainIds.has(drep.id)) drepPs.abstainAutoPowerAda += vp;
      else drepPs.abstainActivePowerAda += vp;
    } else if (v.includes("no_confidence")) drepPs.noConfidencePowerAda += vp;
  }

  const govType = String(info?.governanceType || "").toLowerCase();
  const isNoConf = govType.includes("no confidence") || govType.includes("noconfidence");
  const isHardFork = govType.includes("hard fork") || govType.includes("hardfork");
  const yesTotalAda = isNoConf ? drepPs.yesPowerAda + alwaysNoConfidencePowerAda : drepPs.yesPowerAda;
  const noTotalAda = drepPs.noPowerAda;
  const noConfidenceTotalAda = isNoConf ? 0 : drepPs.noConfidencePowerAda + alwaysNoConfidencePowerAda;
  const drepNotVotedAda = Math.max(
    totalActiveStakeAda - yesTotalAda - noTotalAda - noConfidenceTotalAda - drepPs.abstainActivePowerAda,
    0
  );

  // === SPO power ===
  const spoStats = { activeYesPowerAda: 0, activeNoPowerAda: 0, activeAbstainPowerAda: 0, passiveAlwaysAbstainPowerAda: 0, passiveAlwaysNoConfidencePowerAda: 0, passiveNoVotePowerAda: 0 };
  for (const spo of spos) {
    const vp = Number(spo.votingPowerAda || 0);
    const status = String(spo?.delegationStatus || "").toLowerCase();
    const literal = String(spo?.delegatedDrepLiteralRaw || spo?.delegatedDrepLiteral || "").toLowerCase();
    const spoAlwaysAbstain = status.includes("always abstain") || literal.includes("always_abstain");
    const spoAlwaysNoConf = status.includes("always no confidence") || literal.includes("always_no_confidence");
    const vote = (spo.votes || []).find((v) => v.proposalId === proposalId);
    if (!vote) {
      if (spoAlwaysAbstain) spoStats.passiveAlwaysAbstainPowerAda += vp;
      else if (spoAlwaysNoConf) spoStats.passiveAlwaysNoConfidencePowerAda += vp;
      else spoStats.passiveNoVotePowerAda += vp;
    } else {
      const v = String(vote.vote || "").toLowerCase();
      if (v === "yes") spoStats.activeYesPowerAda += vp;
      else if (v === "no") spoStats.activeNoPowerAda += vp;
      else if (v === "abstain") spoStats.activeAbstainPowerAda += vp;
      else spoStats.passiveNoVotePowerAda += vp;
    }
  }

  const epoch = Number(info?.submittedEpoch);
  const useNewSpoFormula = String(proposalId || "") === SPO_FORMULA_TRANSITION_GOV_ACTION ||
    (Number.isFinite(epoch) && epoch >= SPO_FORMULA_TRANSITION_EPOCH);
  const spoNotVotedAda = Math.max(spoStats.passiveNoVotePowerAda, 0);
  let spoYesAda, spoNoAda, spoAbstainAda;
  if (useNewSpoFormula) {
    if (isHardFork) {
      spoYesAda = spoStats.activeYesPowerAda;
      spoAbstainAda = spoStats.activeAbstainPowerAda;
      spoNoAda = spoStats.activeNoPowerAda + spoNotVotedAda + spoStats.passiveAlwaysNoConfidencePowerAda + spoStats.passiveAlwaysAbstainPowerAda;
    } else if (isNoConf) {
      spoYesAda = spoStats.activeYesPowerAda + spoStats.passiveAlwaysNoConfidencePowerAda;
      spoAbstainAda = spoStats.activeAbstainPowerAda + spoStats.passiveAlwaysAbstainPowerAda;
      spoNoAda = spoStats.activeNoPowerAda + spoNotVotedAda;
    } else {
      spoYesAda = spoStats.activeYesPowerAda;
      spoAbstainAda = spoStats.activeAbstainPowerAda + spoStats.passiveAlwaysAbstainPowerAda;
      spoNoAda = spoStats.activeNoPowerAda + spoNotVotedAda;
    }
  } else {
    spoYesAda = spoStats.activeYesPowerAda;
    spoNoAda = spoStats.activeNoPowerAda + spoStats.passiveAlwaysNoConfidencePowerAda;
    spoAbstainAda = spoStats.activeAbstainPowerAda + spoStats.passiveAlwaysAbstainPowerAda;
  }

  // === CC eligible count ===
  const submittedEpoch = Number(info?.submittedEpoch || 0);
  const activeNowCount = committeeMembers.filter((m) => String(m?.status || "").toLowerCase() === "active").length;
  const ccEligibleCountFromEpoch = submittedEpoch > 0
    ? committeeMembers.filter((m) => {
        const start = Number(m?.seatStartEpoch || 0);
        const end = Number(m?.expirationEpoch || 0);
        if (start > 0 && start > submittedEpoch) return false;
        if (end > 0 && end < submittedEpoch) return false;
        return true;
      }).length
    : 0;
  const committeeMinSize = Number(payload?.thresholdContext?.committeeMinSize || 0);
  const ccEligibleCount = ccEligibleCountFromEpoch > 0
    ? ccEligibleCountFromEpoch
    : (activeNowCount > 0 ? activeNowCount : committeeMinSize);

  return {
    ...info,
    totalActiveStakeAda,
    drepYesPowerAda: yesTotalAda,
    drepNoPowerAda: noTotalAda,
    drepNoConfidencePowerAda: noConfidenceTotalAda,
    drepNotVotedPowerAda: drepNotVotedAda,
    drepAbstainActivePowerAda: drepPs.abstainActivePowerAda,
    spoYesAda,
    spoNoAda,
    spoAbstainAda,
    spoNotVotedAda,
    ccEligibleCount,
    drepRequiredPct: info?.thresholdInfo?.drepRequiredPct,
  };
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
  const usedKeys = new Set(["references"]);
  for (const [key, label] of PREFERRED_SECTIONS) {
    const value = body?.[key];
    if (typeof value === "string" && value.trim()) {
      sections.push({ key, title: label, type: "text", content: value.trim() });
      usedKeys.add(key);
    }
  }
  for (const [key, value] of Object.entries(body || {})) {
    if (usedKeys.has(key)) continue;
    const raw = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").trim();
    const title = raw.replace(/\b\w/g, (m) => m.toUpperCase());
    if (typeof value === "string" && value.trim()) {
      sections.push({ key, title, type: "text", content: value.trim() });
    } else if (value && typeof value === "object") {
      sections.push({ key, title, type: "json", content: value });
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

function VoteBarCard({ group, info }) {
  const { key, label, stats } = group;
  const isCommittee = key === "cc";
  const isSpo = key === "spo";
  const isDrep = key === "drep";
  const asActivePct = (value, base) => (base > 0 ? (Number(value || 0) / base) * 100 : 0);

  // DRep
  const drepActiveBaseAda = Number(info?.totalActiveStakeAda || 0);
  const drepYesAda = Number(info?.drepYesPowerAda || 0);
  const drepNoAda = Number(info?.drepNoPowerAda || 0);
  const drepNoConfidenceAda = Number(info?.drepNoConfidencePowerAda || 0);
  const drepAbstainAda = Number(info?.drepAbstainActivePowerAda || 0);
  const drepNotVotedAda = Number.isFinite(Number(info?.drepNotVotedPowerAda))
    ? Number(info?.drepNotVotedPowerAda || 0)
    : Math.max(drepActiveBaseAda - drepYesAda - drepNoAda - drepNoConfidenceAda - drepAbstainAda, 0);
  const drepOutcomeBaseAda = Math.max(drepActiveBaseAda - drepAbstainAda, 0);
  const drepNoSideAda = drepNoAda + drepNoConfidenceAda + drepNotVotedAda;
  const drepYesPct = asActivePct(drepYesAda, drepOutcomeBaseAda);
  const drepNoPct = asActivePct(drepNoSideAda, drepOutcomeBaseAda);
  const drepAbstainPct = asActivePct(drepAbstainAda, drepActiveBaseAda);

  // SPO
  const spoYesAda = Number(info?.spoYesAda || 0);
  const spoNoWithNotVotedAda = Number(info?.spoNoAda || 0);
  const spoAbstainAda = Number(info?.spoAbstainAda || 0);
  const spoNotVotedAda = Number(info?.spoNotVotedAda || 0);
  const spoOutcomeTotalAda = Math.max(spoYesAda + spoNoWithNotVotedAda, 0);
  const spoYesPct = spoOutcomeTotalAda > 0 ? (spoYesAda / spoOutcomeTotalAda) * 100 : 0;
  const spoNoPct = spoOutcomeTotalAda > 0 ? (spoNoWithNotVotedAda / spoOutcomeTotalAda) * 100 : 0;

  // CC
  const { yes, no, abstain } = voteSlices(stats);
  const ccCastCount = yes + no + abstain;
  const ccEligibleCount = Math.max(Number(info?.ccEligibleCount || 0), 0);
  const ccNotVotedCount = Math.max(ccEligibleCount - ccCastCount, 0);
  const ccOutcomeBase = Math.max(ccEligibleCount - abstain, yes + no + ccNotVotedCount);
  const ccDenominator = ccOutcomeBase > 0 ? ccOutcomeBase : (yes + no + ccNotVotedCount) || 1;
  const ccYesPct = (yes / ccDenominator) * 100;
  const ccNoPct = (no / ccDenominator) * 100;

  const yesPct = isCommittee ? ccYesPct : (isDrep ? drepYesPct : spoYesPct);
  const noPct  = isCommittee ? ccNoPct  : (isDrep ? drepNoPct  : spoNoPct);

  const thresholdPct = isDrep
    ? toFiniteOrNull(info?.drepRequiredPct)
    : isSpo
      ? toFiniteOrNull(info?.thresholdInfo?.poolRequiredPct)
      : toFiniteOrNull(info?.thresholdInfo?.ccRequiredPct);

  const clamp = (v) => Math.max(0, Math.min(100, v));
  const yW = clamp(yesPct);
  const nW = clamp(noPct);
  const restW = Math.max(0, 100 - yW - nW);

  return (
    <article className="vbc">
      <div className="vbc-header">
        <span className="vbc-label">{label}</span>
        {thresholdPct !== null && (
          <span className="vbc-threshold-label">Required: {thresholdPct}%</span>
        )}
      </div>

      <div className="vbc-bar-wrap">
        <div className="vbc-bar-track">
          <div className="vbc-bar-yes" style={{ width: `${yW}%` }} />
          <div className="vbc-bar-no"  style={{ width: `${nW}%` }} />
          <div className="vbc-bar-rest" style={{ width: `${restW}%` }} />
        </div>
        {thresholdPct !== null && (
          <div className="vbc-bar-threshold" style={{ left: `${clamp(thresholdPct)}%` }} aria-hidden="true" />
        )}
      </div>

      <div className="vbc-stats">
        {isCommittee ? (
          <>
            {yes > 0 && <span className="vbc-stat vbc-stat--yes">Constitutional <strong>{yes}</strong></span>}
            {no > 0 && <span className="vbc-stat vbc-stat--no">Unconstitutional <strong>{no}</strong></span>}
            {abstain > 0 && <span className="vbc-stat vbc-stat--abs">Abstain <strong>{abstain}</strong></span>}
            {ccNotVotedCount > 0 && <span className="vbc-stat vbc-stat--rest">Not voted <strong>{ccNotVotedCount}</strong></span>}
          </>
        ) : isSpo ? (
          <>
            <span className="vbc-stat vbc-stat--yes">Yes <strong>{asPct(spoYesPct)}</strong> <em>{formatAdaCompact(spoYesAda)}</em></span>
            <div className="vbc-no-group">
              <span className="vbc-stat vbc-stat--no">No <strong>{asPct(spoNoPct)}</strong> <em>{formatAdaCompact(spoNoWithNotVotedAda)}</em></span>
              <div className="vbc-no-breakdown">
                {(spoNoWithNotVotedAda - spoNotVotedAda) > 0 && (
                  <span>Voted No <em>{formatAdaCompact(spoNoWithNotVotedAda - spoNotVotedAda)}</em></span>
                )}
                {spoNotVotedAda > 0 && <span>Not voted <em>{formatAdaCompact(spoNotVotedAda)}</em></span>}
              </div>
            </div>
            {spoAbstainAda > 0 && <span className="vbc-stat vbc-stat--abs">Abstain <em>{formatAdaCompact(spoAbstainAda)}</em></span>}
          </>
        ) : (
          <>
            <span className="vbc-stat vbc-stat--yes">Yes <strong>{asPct(drepYesPct)}</strong> <em>{formatAdaCompact(drepYesAda)}</em></span>
            <div className="vbc-no-group">
              <span className="vbc-stat vbc-stat--no">No <strong>{asPct(drepNoPct)}</strong> <em>{formatAdaCompact(drepNoSideAda)}</em></span>
              <div className="vbc-no-breakdown">
                {drepNoAda > 0 && <span>Voted No <em>{formatAdaCompact(drepNoAda)}</em></span>}
                {drepNoConfidenceAda > 0 && <span>No Confidence <em>{formatAdaCompact(drepNoConfidenceAda)}</em></span>}
                {drepNotVotedAda > 0 && <span>Not voted <em>{formatAdaCompact(drepNotVotedAda)}</em></span>}
              </div>
            </div>
            {drepAbstainAda > 0 && <span className="vbc-stat vbc-stat--abs">Abstain <strong>{asPct(drepAbstainPct)}</strong> <em>{formatAdaCompact(drepAbstainAda)}</em></span>}
            <span className="vbc-stat vbc-stat--rest">Active stake <em>{formatAdaCompact(drepActiveBaseAda)}</em></span>
          </>
        )}
      </div>
    </article>
  );
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
  const [voteRationaleImage, setVoteRationaleImage] = useState({});
  const [voteRationaleLoading, setVoteRationaleLoading] = useState({});
  const [voteRationaleVerify, setVoteRationaleVerify] = useState({});
  const [voteRationaleError, setVoteRationaleError] = useState({});
  const [voteRationaleSignals, setVoteRationaleSignals] = useState({});
  const [detailTab, setDetailTab] = useState("votes");
  const [roleFilter, setRoleFilter] = useState("all");
  const [voteFilter, setVoteFilter] = useState("all");
  const [rationaleFilter, setRationaleFilter] = useState("all");
  const [voteSearch, setVoteSearch] = useState("");

  const [nowMs, setNowMs] = useState(() => Date.now());
  const silentRefreshRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (snapshotKey) params.set("snapshot", snapshotKey);
      params.set("view", "actions");
      params.set("proposalId", decodedProposalId);
      const [res, mRes, vrRes] = await Promise.all([
        fetch(`${API_BASE}/api/accountability?${params.toString()}`),
        fetch(`${API_BASE}/api/proposal-metadata?proposalId=${encodeURIComponent(decodedProposalId)}`),
        fetch(`${API_BASE}/api/proposal-vote-rationales?proposalId=${encodeURIComponent(decodedProposalId)}`)
      ]);
      const [data, mData, vrData] = await Promise.all([
        res.json(),
        mRes.json().catch(() => ({})),
        vrRes.json().catch(() => ({}))
      ]);
      if (!res.ok) throw new Error(data.error || "Failed to load proposal.");
      setPayload(data);
      if (mRes.ok) setMetadata(mData);
      let voteRationaleRows = vrRes.ok && Array.isArray(vrData?.votes) ? vrData.votes : [];
      if (vrRes.ok && voteRationaleRows.length === 0) {
        voteRationaleRows = await fetchBrowserKoiosVoteRationales(decodedProposalId).catch(() => []);
      }
      if (vrRes.ok && Array.isArray(voteRationaleRows)) {
        setVoteRationaleSignals(Object.fromEntries(
          voteRationaleRows
            .map((vote) => [String(vote?.voteTxHash || "").trim().toLowerCase(), {
              hasRationale: Boolean(vote?.hasRationale),
              rationaleUrl: String(vote?.rationaleUrl || "").trim()
            }])
            .filter(([tx]) => Boolean(tx))
        ));
      }
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
  const { isLive } = useSnapshotUpdates({
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

  const seoTitle = info?.actionName
    ? info.governanceType
      ? `${info.actionName} — ${info.governanceType}`
      : info.actionName
    : "Governance Proposal";
  const seoDesc = info?.actionName
    ? `Vote breakdown, DRep rationales, and outcome for "${info.actionName}" — a Cardano ${info.governanceType || "governance"} proposal.`
    : "Detailed voting breakdown, DRep and SPO rationales, and outcome for a Cardano governance proposal.";
  useSeoMeta({ title: seoTitle, description: seoDesc });

  const payloadDoc = useMemo(
    () => normalizeActionPayload({ ...(info || {}), actionName: info?.actionName || decodedProposalId }, metadata || null),
    [info, metadata, decodedProposalId]
  );

  const pieInfo = useMemo(
    () => computePieInfo(info, decodedProposalId, payload),
    [info, decodedProposalId, payload]
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
          const txHash = String(vote?.voteTxHash || "").trim().toLowerCase();
          const rationaleSignal = txHash ? voteRationaleSignals[txHash] : null;
          const rationaleUrl = String(vote?.rationaleUrl || rationaleSignal?.rationaleUrl || "").trim();
          rows.push({
            role,
            voter: String(actor?.name || actor?.id || "Unknown"),
            voterId: String(actor?.id || ""),
            voterRole: role === "DRep" ? "drep" : role === "CC" ? "constitutional_committee" : "stake_pool",
            vote: String(vote?.vote || ""),
            outcome: String(vote?.outcome || ""),
            voteTxHash: txHash,
            votedAtUnix,
            votedAt: vote?.votedAt || null,
            votedEpoch,
            rationaleUrl,
            hasRationale: Boolean(vote?.hasRationale || rationaleSignal?.hasRationale || rationaleUrl),
            votingPowerAda: Number(actor?.votingPowerAda || 0)
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
  }, [payload, decodedProposalId, voteRationaleSignals]);

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
      const imageUrl = String(data?.authorImageUrl || "").trim();
      if (imageUrl) {
        setVoteRationaleImage((prev) => ({ ...prev, [key]: imageUrl }));
      }
      setVoteRationaleVerify((prev) => ({ ...prev, [key]: data?.metadataVerification || null }));
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

  const voteGroups = eligibleVoteGroups(pieInfo);
  const isTreasury = String(info.governanceType || "").toLowerCase().includes("treasury");
  const treasuryAmountAda = isTreasury ? extractTreasuryAmountAda(info) : 0;
  const status = deriveStatus(info);
  const expiryEndUnix = info.expirationEpoch ? epochStartUnix(info.expirationEpoch + 1) : null;
  const msUntilExpiry = expiryEndUnix ? Math.max(0, expiryEndUnix * 1000 - nowMs) : null;
  const countdownStr = status === "Active" && msUntilExpiry !== null ? formatCountdown(msUntilExpiry) : null;
  const expiryDateStr = info.expirationEpoch ? formatEpochDate(info.expirationEpoch) : null;
  const submittedDateStr = info.submittedEpoch ? formatEpochDate(info.submittedEpoch) : null;
  const closeModal = () => setRationaleModal({ open: false, key: "", title: "", proposalId: "" });

  return (
    <main className="page shell stats-page">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <section className="pdp-head">
        <Link className="pdp-back" to={`/actions${snapshotKey ? `?snapshot=${encodeURIComponent(snapshotKey)}` : ""}`}>
          ← All Governance Actions
        </Link>
        <div className="pdp-title-row">
          <h1 className="pdp-title">{payloadDoc.title || info?.actionName || decodedProposalId}</h1>
          <div className="pdp-title-badges">
            {status && <span className={`pill ${statusPillMod(status)}`}>{status}</span>}
            {!snapshotKey && (
              <span className={`live-badge${isLive ? " live-badge--live" : ""}`}>
                {isLive ? "● Live" : "○ Connecting…"}
              </span>
            )}
          </div>
        </div>
        <MetaVerifyPill verification={metadata?.metadataVerification} style={{ marginTop: "0.5rem" }} />
        <div className="pdp-meta-strip">
          {info.governanceType && <span className="pdp-meta-type">{info.governanceType}</span>}
          {isTreasury && treasuryAmountAda > 0 && (
            <span className="ada-badge">₳{Math.round(treasuryAmountAda).toLocaleString()}</span>
          )}
          {info.submittedEpoch && (
            <span className="pdp-meta-item">
              Submitted Ep&nbsp;{info.submittedEpoch}{submittedDateStr ? ` · ${submittedDateStr}` : ""}
            </span>
          )}
          {info.expirationEpoch && (
            <span className="pdp-meta-item">
              Expires Ep&nbsp;{info.expirationEpoch}{expiryDateStr ? ` · ${expiryDateStr}` : ""}
            </span>
          )}
          {countdownStr && (
            <span className="pdp-countdown">{countdownStr} remaining</span>
          )}
          {info.ratifiedEpoch > 0 && <span className="pdp-meta-item">Ratified Ep&nbsp;{info.ratifiedEpoch}</span>}
          {info.enactedEpoch > 0 && <span className="pdp-meta-item">Enacted Ep&nbsp;{info.enactedEpoch}</span>}
          {info.expiredEpoch > 0 && <span className="pdp-meta-item muted">Expired Ep&nbsp;{info.expiredEpoch}</span>}
          {info.droppedEpoch > 0 && <span className="pdp-meta-item muted">Dropped Ep&nbsp;{info.droppedEpoch}</span>}
        </div>
        <p className="mono muted pdp-action-id">{decodedProposalId}</p>
      </section>

      {/* ── Hash mismatch warning ───────────────────────────────────── */}
      {metadata?.hashMismatch && (
        <section className="stats-section stats-section--wide">
          <div className="pdp-warning">
            <strong>Hash mismatch:</strong> The metadata at the anchor URL does not match the on-chain hash. Content shown for reference only.
          </div>
        </section>
      )}

      {/* ── Voting ─────────────────────────────────────────────────── */}
      <section className="stats-section stats-section--wide">
        <h2 className="stats-section-title">Voting</h2>
        {pieInfo?.thresholdInfo?.parameterGroup && (
          <p className="muted" style={{ marginBottom: "0.75rem" }}>
            Parameter group: <strong>{pieInfo.thresholdInfo.parameterGroup}</strong>
          </p>
        )}
        <div className="vbc-list">
          {voteGroups.map((group) => (
            <VoteBarCard key={group.key} group={group} info={pieInfo} />
          ))}
          {voteGroups.length === 0 && <p className="muted">No vote data available.</p>}
        </div>
      </section>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <section className="stats-section stats-section--wide">
        <div className="detail-tabs">
          <button type="button" className={`detail-tab${detailTab === "votes" ? " detail-tab--active" : ""}`} onClick={() => setDetailTab("votes")}>
            Votes
          </button>
          <button type="button" className={`detail-tab${detailTab === "payload" ? " detail-tab--active" : ""}`} onClick={() => setDetailTab("payload")}>
            Metadata
          </button>
        </div>

        {/* ── Metadata tab ─────────────────────────────────────────── */}
        {detailTab === "payload" ? (
          <div className="stats-section-body pdp-metadata-body">
            {payloadDoc.sections.length === 0 && (
              <p className="muted">No metadata body sections available.</p>
            )}
            {payloadDoc.sections.map((section, i) => (
              <details key={`${decodedProposalId}-${section.key}`} className="pdp-meta-section" open={i === 0}>
                <summary className="pdp-meta-section-title">{section.title}</summary>
                <div className="pdp-meta-section-body">
                  {section.type === "json" ? (
                    <pre className="json-pre payload-pretty">{JSON.stringify(section.content, null, 2)}</pre>
                  ) : (
                    <SafeMarkdown>{section.content}</SafeMarkdown>
                  )}
                </div>
              </details>
            ))}
            {payloadDoc.references.length > 0 && (
              <details className="pdp-meta-section">
                <summary className="pdp-meta-section-title">References</summary>
                <div className="pdp-meta-section-body">
                  <ul className="pdp-references">
                    {payloadDoc.references.map((ref, i) => (
                      <li key={i}>
                        <a href={ref.uri} target="_blank" rel="noopener noreferrer" className="inline-link">
                          {ref.label !== ref.uri ? ref.label : ref.uri}
                        </a>
                        {ref.type && ref.type !== "Reference" && ref.type !== ref.label && (
                          <span className="muted"> · {ref.type}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            )}
            {payloadDoc.metadataUrl && (
              <p className="muted pdp-anchor-line">
                Anchor URL:{" "}
                <a href={payloadDoc.metadataUrl} target="_blank" rel="noopener noreferrer" className="inline-link mono">
                  {payloadDoc.metadataUrl}
                </a>
              </p>
            )}
          </div>
        ) : (

        /* ── Votes tab ───────────────────────────────────────────── */
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
              <input value={voteSearch} onChange={(e) => setVoteSearch(e.target.value)} placeholder="Voter, ID, vote, epoch…" />
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
                  <th>Vote</th>
                  <th>Voting Power</th>
                  <th>Epoch</th>
                  <th>Rationale</th>
                </tr>
              </thead>
              <tbody>
                {filteredVotes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted">
                      {allVotes.length === 0 ? "No votes found for this proposal." : "No votes match the selected filters."}
                    </td>
                  </tr>
                ) : (
                  filteredVotes.map((row, idx) => (
                    <tr key={`${row.role}-${row.voterId}-${row.votedAtUnix || 0}-${idx}`}>
                      <td data-label="Role">
                        <span className="pdp-role-badge">{row.role}</span>
                      </td>
                      <td data-label="Voter">
                        <div className="pdp-voter-name">{row.voter}</div>
                        {row.voterId && (
                          <div className="muted mono pdp-voter-id">
                            {row.voterId.length > 24 ? `${row.voterId.slice(0, 12)}…${row.voterId.slice(-8)}` : row.voterId}
                          </div>
                        )}
                      </td>
                      <td data-label="Vote">
                        {row.vote
                          ? <span className={`pill ${votePillMod(row.vote)}`}>{row.vote}</span>
                          : <span className="muted">—</span>}
                      </td>
                      <td data-label="Voting Power">
                        {row.votingPowerAda > 0
                          ? <span className="pdp-vp">₳{formatAdaShort(row.votingPowerAda)}</span>
                          : row.role === "CC"
                            ? <span className="muted">—</span>
                            : <span className="muted pdp-vp-pending" title="Voting power is 0 in the current epoch snapshot. New DRep registrations take 2 epochs to appear.">₳0</span>}
                      </td>
                      <td data-label="Epoch">{row.votedEpoch || "—"}</td>
                      <td data-label="Rationale">
                        {row.rationaleUrl || row.hasRationale ? (
                          <button type="button" className="mode-btn" onClick={() => openVoteRationaleModal(row)}>
                            View
                          </button>
                        ) : <span className="muted">—</span>}
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

      {/* ── Rationale modal ────────────────────────────────────────── */}
      {rationaleModal.open && (
        <div className="image-modal-backdrop" role="presentation" onClick={closeModal}>
          <div className="image-modal rationale-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="image-modal-close" onClick={closeModal}>Close</button>
            <h3 className="rationale-modal-title">{rationaleModal.title}</h3>
            <p className="mono muted" style={{ fontSize: "0.78rem" }}>{rationaleModal.proposalId}</p>
            <div className="rationale-modal-content">
              {voteRationaleLoading[rationaleModal.key] ? (
                <p className="muted">Loading rationale…</p>
              ) : voteRationaleError[rationaleModal.key] ? (
                <p className="muted">Error: {voteRationaleError[rationaleModal.key]}</p>
              ) : (
                <div className="payload-markdown">
                  {voteRationaleVerify[rationaleModal.key] ? (
                    <MetaVerifyPill verification={voteRationaleVerify[rationaleModal.key]} style={{ marginBottom: "0.75rem" }} />
                  ) : null}
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {voteRationaleText[rationaleModal.key] || "No rationale body text available."}
                  </ReactMarkdown>
                  {voteRationaleImage[rationaleModal.key] ? (
                    <div className="rationale-author-image">
                      <p className="muted" style={{ fontSize: "0.8rem", marginBottom: "0.4rem" }}>Signature</p>
                      <img
                        src={voteRationaleImage[rationaleModal.key]}
                        alt="Author signature"
                        className="rationale-signature-img"
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
