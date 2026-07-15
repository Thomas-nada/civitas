import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { Link, useNavigate } from "react-router-dom";
import { useSnapshotUpdates } from "../hooks/useSnapshotUpdates";
import { useEffectiveDrepId } from "../hooks/useEffectiveDrepId";
import { Transaction } from "@meshsdk/core";
import { encodePayload, METADATA_LABEL } from "cip-179";
import blakejs from "blakejs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { WalletContext } from "../context/WalletContext";
import Cip179ResponseEditor from "../components/Cip179ResponseEditor";
import { buildSurveyResponse } from "../services/surveyTxService";
import { validateSurveyAnswers } from "../services/surveyAnswerService";
import { hydrateSurveyPresentation } from "../services/surveyPresentationService";

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

function formatCountdown(msRemaining) {
  const totalMinutes = Math.max(0, Math.floor(Number(msRemaining || 0) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return `${days}d:${String(hours).padStart(2, "0")}h:${String(minutes).padStart(2, "0")}m`;
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

function hasActiveDrepVotingPower(drep) {
  const status = String(drep?.status || "").trim().toLowerCase();
  return status !== "expired" && status !== "retired";
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
  // Final terminal states must override ratified/enacted labels if present due to stale cached fields.
  const droppedEpoch = Number(info?.droppedEpoch || 0);
  const expiredEpoch = Number(info?.expiredEpoch || 0);
  const expirationEpoch = Number(info?.expirationEpoch || 0);
  const hasDropped = Number.isFinite(droppedEpoch) && droppedEpoch > 0;
  const hasExpired = Number.isFinite(expiredEpoch) && expiredEpoch > 0;
  if (hasDropped && hasExpired) {
    // If it was dropped before natural expiry, classify as Dropped.
    // Otherwise treat as Expired (the expiry path is what users care about).
    if (Number.isFinite(expirationEpoch) && expirationEpoch > 0 && droppedEpoch < expirationEpoch) return "Dropped";
    return "Expired";
  }
  if (hasDropped) {
    // Many providers encode natural expiry with droppedEpoch when expiration is reached.
    // Treat drop at/after expiration as Expired, and only pre-expiration drops as Dropped.
    if (Number.isFinite(expirationEpoch) && expirationEpoch > 0 && droppedEpoch >= expirationEpoch) return "Expired";
    return "Dropped";
  }
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

function formatHashCompact(govActionId) {
  if (!govActionId) return "—";
  const bare = govActionId.replace(/^gov_action1/, "");
  if (bare.length <= 14) return bare;
  return `${bare.slice(0, 8)}…${bare.slice(-6)}`;
}

const TYPE_SHORT = {
  "treasury withdrawal": "Treasury W/D",
  "treasury withdrawals": "Treasury W/D",
  "info action": "Info Action",
  "info": "Info Action",
  "parameter change": "Param Change",
  "hard fork": "Hard Fork",
  "no confidence": "No Confidence",
  "new committee": "New Committee",
  "update committee": "Update CC",
  "constitution": "Constitution",
};

function shortType(type) {
  const t = String(type || "").toLowerCase().trim();
  return TYPE_SHORT[t] || type || "Unknown";
}

function VoteBarCell({ yesPct, noPct, thresholdPct, notEligible, ccMode, yesCount, noCount, ccElig }) {
  if (notEligible) return <span className="muted vote-bar-na">N/A</span>;
  const fmtPct = (value) => `${round(Number(value) || 0)}%`;
  if (ccMode) {
    const den = ccElig > 0 ? ccElig : Math.max(yesCount + noCount, 1);
    const yPct = (yesCount / den) * 100;
    return (
      <div className="vote-bar-wrap">
        <div className="vote-bar-track">
          <div className="vote-bar-yes" style={{ width: `${Math.min(yPct, 100)}%` }} />
          {thresholdPct !== null && thresholdPct > 0 && (
            <div className="vote-bar-threshold" style={{ left: `${Math.min(thresholdPct, 100)}%` }} />
          )}
        </div>
        <div className="vote-bar-text">
          <span className="vote-bar-yes-txt">Y:{yesCount}</span>
          <span className="vote-bar-sep">/</span>
          <span className="vote-bar-no-txt">N:{noCount}</span>
          {ccElig > 0 && <span className="vote-bar-elig muted"> /{ccElig}</span>}
        </div>
      </div>
    );
  }
  const safe = (v) => Math.max(0, Math.min(Number(v) || 0, 100));
  return (
    <div className="vote-bar-wrap">
      <div className="vote-bar-track">
        <div className="vote-bar-yes" style={{ width: `${safe(yesPct)}%` }} />
        <div className="vote-bar-no" style={{ width: `${safe(noPct)}%`, left: `${safe(yesPct)}%` }} />
        {thresholdPct !== null && thresholdPct > 0 && (
          <div className="vote-bar-threshold" style={{ left: `${Math.min(thresholdPct, 100)}%` }} />
        )}
      </div>
      <div className="vote-bar-text">
        <span className="vote-bar-yes-txt">{fmtPct(safe(yesPct))}</span>
        {thresholdPct !== null && thresholdPct > 0 && (
          <span className="vote-bar-req muted">/{fmtPct(thresholdPct)}</span>
        )}
      </div>
    </div>
  );
}

function ExpiryCountdownPill({ row, nowMs }) {
  if (!row?.isExpiringSoon || !row?.expirationEpoch) return null;
  const target = epochToApproxDate(row.expirationEpoch);
  if (!target) return null;
  const remainingMs = target.getTime() - Number(nowMs || Date.now());
  if (remainingMs <= 0) return <span className="expiry-countdown-pill">expires now</span>;
  return <span className="expiry-countdown-pill">expires in {formatCountdown(remainingMs)}</span>;
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
  const ccEligible = row?.ccRequiredPct != null;
  const spoEligible = row?.spoRequiredPct != null;
  if (drepEligible) groups.push({ key: "drep", label: "DRep", stats: row?.voteStats?.drep || {} });
  if (ccEligible) groups.push({ key: "cc", label: "CC", stats: row?.voteStats?.constitutional_committee || {} });
  if (spoEligible) groups.push({ key: "spo", label: "SPO", stats: row?.voteStats?.stake_pool || {} });
  return groups;
}

function isDrepVoteEligibleAction(row) {
  return row?.status === "Active" && Boolean(row?.txHash);
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
  const drepNoConfidenceAda = Number(row?.drepNoConfidencePowerAda || 0);
  const drepAbstainAda = Number(row?.drepAbstainActivePowerAda || 0);
  const drepNotVotedAda = Number.isFinite(Number(row?.drepNotVotedPowerAda))
    ? Number(row?.drepNotVotedPowerAda || 0)
    : Math.max(drepActiveBaseAda - drepYesAda - drepNoAda - drepNoConfidenceAda - drepAbstainAda, 0);
  const drepOutcomeBaseAda = Math.max(drepActiveBaseAda - drepAbstainAda, 0);
  const drepNoSideAda = drepNoAda + drepNoConfidenceAda + drepNotVotedAda;
  const drepYesPct = asActivePct(drepYesAda, drepOutcomeBaseAda);
  const drepNoPct = asActivePct(drepNoSideAda, drepOutcomeBaseAda);
  const drepAbstainPct = asActivePct(drepAbstainAda, drepActiveBaseAda);
  const drepNotVotedPct = 0;

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
      : (isCommittee ? toFiniteOrNull(row?.ccRequiredPct) : null));
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
              <p><span className="vote-label vote-label-no">No side</span> <strong>{asPct(drepNoPct)}</strong> ({formatAdaCompact(drepNoSideAda)})</p>
              <p><span className="vote-label vote-label-no">No</span> <strong>{formatAdaCompact(drepNoAda)}</strong></p>
              <p><span className="vote-label vote-label-no">No Confidence</span> <strong>{formatAdaCompact(drepNoConfidenceAda)}</strong></p>
              <p><span className="vote-label vote-label-not-voted">Not voted</span> <strong>{formatAdaCompact(drepNotVotedAda)}</strong></p>
              <p><span className="vote-label vote-label-abstain">Abstain</span> <strong>{asPct(drepAbstainPct)}</strong> ({formatAdaCompact(drepAbstainAda)})</p>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function VoteMiniPie({ group, row }) {
  const { key, stats } = group;
  const isCommittee = key === "cc";
  const isSpo = key === "spo";
  const isDrep = key === "drep";
  const asActivePct = (v, b) => (b > 0 ? (Number(v || 0) / b) * 100 : 0);

  const drepBase = Number(row?.totalActiveStakeAda || 0);
  const drepYes = Number(row?.drepYesPowerAda || 0);
  const drepNo = Number(row?.drepNoPowerAda || 0);
  const drepNoConfidence = Number(row?.drepNoConfidencePowerAda || 0);
  const drepAbstain = Number(row?.drepAbstainActivePowerAda || 0);
  const drepNotVoted = Number.isFinite(Number(row?.drepNotVotedPowerAda))
    ? Number(row?.drepNotVotedPowerAda || 0)
    : Math.max(drepBase - drepYes - drepNo - drepNoConfidence - drepAbstain, 0);
  const drepOutcomeBase = Math.max(drepBase - drepAbstain, 0);
  const drepYesPct = asActivePct(drepYes, drepOutcomeBase);
  const drepNoPct = asActivePct(drepNo + drepNoConfidence + drepNotVoted, drepOutcomeBase);
  const drepNotVotedPct = 0;

  const spoYes = Number(row?.spoYesAda || 0);
  const spoNo = Number(row?.spoNoAda || 0);
  const spoTotal = Math.max(spoYes + spoNo, 0);
  const spoYesPct = spoTotal > 0 ? (spoYes / spoTotal) * 100 : 0;
  const spoNoPct = spoTotal > 0 ? (spoNo / spoTotal) * 100 : 0;

  const { yes, no, abstain } = voteSlices(stats);
  const ccCast = yes + no + abstain;
  const ccElig = Math.max(Number(row?.ccEligibleCount || 0), 0);
  const ccDen = ccElig > 0 ? ccElig : Math.max(ccCast, 1);
  const ccYesPct = (yes / ccDen) * 100;
  const ccNoPct = (no / ccDen) * 100;
  const ccAbstainPct = (abstain / ccDen) * 100;
  const ccNotVotedPct = (Math.max(ccElig - ccCast, 0) / ccDen) * 100;

  const pieYesPct = isDrep ? drepYesPct : (isCommittee ? ccYesPct : spoYesPct);
  const pieNoPct = isDrep ? drepNoPct : (isCommittee ? ccNoPct : spoNoPct);
  const pieAbstainPct = isCommittee ? ccAbstainPct : 0;
  const pieOtherPct = isDrep ? drepNotVotedPct : (isCommittee ? ccNotVotedPct : 0);

  const thresholdPct = isDrep
    ? toFiniteOrNull(row?.drepRequiredPct)
    : isSpo ? toFiniteOrNull(row?.spoRequiredPct)
    : isCommittee ? toFiniteOrNull(row?.ccRequiredPct) : null;
  const thresholdAngle = thresholdPct !== null ? Math.max(0, Math.min(100, thresholdPct)) * 3.6 : null;

  const bg = `conic-gradient(#54e4bc 0 ${pieYesPct}%, #ff6f7d ${pieYesPct}% ${pieYesPct + pieNoPct}%, #ffc766 ${pieYesPct + pieNoPct}% ${pieYesPct + pieNoPct + pieAbstainPct}%, #7c8fa8 ${pieYesPct + pieNoPct + pieAbstainPct}% ${pieYesPct + pieNoPct + pieAbstainPct + pieOtherPct}%)`;
  const centerText = isCommittee ? `${yes}/${ccElig || ccCast}` : `${Math.round(pieYesPct)}%`;
  const label = isDrep ? "DRep" : isCommittee ? "CC" : "SPO";

  return (
    <div className="action-vote-mini-pie">
      <div className="action-vote-pie action-vote-pie--mini" style={{ background: bg }}>
        {thresholdAngle !== null ? (
          <div aria-hidden="true" className="action-vote-pie-threshold" style={{ "--threshold-angle": `${thresholdAngle}deg` }} />
        ) : null}
        <span>{centerText}</span>
      </div>
      <p className="action-vote-mini-label">{label}</p>
    </div>
  );
}

function VoteMiniPies({ row }) {
  const groups = eligibleVoteGroups(row);
  if (groups.length === 0) return <span className="muted">—</span>;
  return (
    <div className="action-vote-mini-pies">
      {groups.map((group) => <VoteMiniPie key={group.key} group={group} row={row} />)}
    </div>
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
  useSeoMeta({
    title: "Governance Actions",
    description: "All active and historical Cardano governance proposals — filter by type, status, and voting outcome. Track DRep, SPO, and CC votes in real time."
  });
  const navigate = useNavigate();
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
  const [nowMs, setNowMs] = useState(() => Date.now());
  // --- Voting state (wallet state is global via WalletContext) ---
  const wallet = useContext(WalletContext);
  const effectiveDrepId = useEffectiveDrepId(wallet);
  const votedProposalIds = useMemo(() => {
    if (!effectiveDrepId || !Array.isArray(payload?.dreps)) return new Set();
    const target = effectiveDrepId.toLowerCase();
    const drep = payload.dreps.find((d) => String(d?.id || "").toLowerCase() === target);
    return new Set((drep?.votes || []).map((v) => String(v?.proposalId || "")));
  }, [effectiveDrepId, payload]);
  const [voteChoice, setVoteChoice] = useState("");
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [voteRationaleUrl, setVoteRationaleUrl] = useState("");
  const [voteRationaleMode, setVoteRationaleMode] = useState("url"); // "url" | "write"
  const [voteRationaleText, setVoteRationaleText] = useState("");
  const [batchVoteIds, setBatchVoteIds] = useState({});
  const [batchVoteDrafts, setBatchVoteDrafts] = useState({});
  const [batchVoteModalOpen, setBatchVoteModalOpen] = useState(false);
  const [batchVoteStep, setBatchVoteStep] = useState(0);
  const [batchVoteMdPreview, setBatchVoteMdPreview] = useState(false);
  const [proposalSurveys, setProposalSurveys] = useState({});
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [skippedSurveys, setSkippedSurveys] = useState({});
  const [surveysLoading, setSurveysLoading] = useState(false);
  const [surveyLoadError, setSurveyLoadError] = useState("");
  const [voteSubmitting, setVoteSubmitting] = useState(false);
  const [voteNotice, setVoteNotice] = useState("");
  const [voteError, setVoteError] = useState("");
  const [votedTxHash, setVotedTxHash] = useState("");
  const [voteSyncStatus, setVoteSyncStatus] = useState(""); // "polling" | "synced" | "timeout"
  const voteSyncPollRef = useRef(null);
  const detailPanelRef = useRef(null);
  const latestSnapshotRef = useRef("");
  const syncPollBusyRef = useRef(false);

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
      latestSnapshotRef.current = String(data?.lastSyncCompletedAt || data?.generatedAt || "");
    } catch (e) {
      setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [snapshotKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live updates via SSE (replaces the previous 10s sync-status polling).
  const { isLive, lastUpdatedAt } = useSnapshotUpdates({
    enabled: !snapshotKey,
    onUpdate: () => loadData({ silent: true }),
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

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
    let regularDrepStakeAda = dreps.reduce((sum, drep) => (
      hasActiveDrepVotingPower(drep) ? sum + Number(drep.votingPowerAda || 0) : sum
    ), 0);
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
      if (!hasActiveDrepVotingPower(drep)) continue;
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
      const noConfidenceTotalAda = isNoConfidence
        ? 0
        : powerStats.noConfidencePowerAda + powerStats.noConfidenceAutoPowerAda;
      const noTotalAda = powerStats.noPowerAda;
      const notVotedAda = Math.max(
        totalActiveStakeAda - yesTotalAda - noTotalAda - noConfidenceTotalAda - powerStats.abstainActivePowerAda,
        0
      );
      const drepOutcomeBaseAda = Math.max(totalActiveStakeAda - powerStats.abstainActivePowerAda, 0);
      const drepNoSideAda = noTotalAda + noConfidenceTotalAda + notVotedAda;

      const nomosYesAda = toNum(nomosDrep?.yesLovelace) / 1_000_000;
      const nomosNoAda = toNum(nomosDrep?.noLovelace) / 1_000_000;
      const nomosAbstainAda = toNum(nomosDrep?.abstainLovelace) / 1_000_000;
      const nomosNotVotedAda = toNum(nomosDrep?.notVotedLovelace) / 1_000_000;
      const nomosActiveAbstainAda = toNum(nomosDrep?.activeAbstainLovelace) / 1_000_000;
      const nomosNoConfidenceAda = toNum(nomosDrep?.noConfidenceLovelace ?? nomosDrep?.alwaysNoConfidenceLovelace) / 1_000_000;
      const nomosDelegatedAda = (toNum(nomosDrep?.derivedTotalLovelace) || 0) / 1_000_000;
      const nomosActiveAda = nomosYesAda + nomosNoAda + nomosNoConfidenceAda + nomosNotVotedAda + nomosActiveAbstainAda;
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
      const drepYesPct = useNomos ? toNum(nomosDrep?.yesPct) : (drepOutcomeBaseAda > 0 ? (yesTotalAda / drepOutcomeBaseAda) * 100 : null);
      const drepNoPct = useNomos ? toNum(nomosDrep?.noPct) : (drepOutcomeBaseAda > 0 ? (drepNoSideAda / drepOutcomeBaseAda) * 100 : null);
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
        drepAbstainActivePowerAda: useNomos ? nomosActiveAbstainAda : powerStats.abstainActivePowerAda,
        drepAbstainAutoPowerAda: useNomos ? toNum(nomosDrep?.alwaysAbstainLovelace) / 1_000_000 : powerStats.abstainAutoPowerAda,
        drepNoConfidencePowerAda: useNomos ? nomosNoConfidenceAda : noConfidenceTotalAda,
        drepNoConfidenceAutoPowerAda: useNomos ? toNum(nomosDrep?.alwaysNoConfidenceLovelace) / 1_000_000 : powerStats.noConfidenceAutoPowerAda,
        drepYesPowerPct: drepYesPct,
        drepNoPowerPct: drepNoPct,
        drepNotVotedPowerAda: useNomos ? nomosNotVotedAda : notVotedAda,
        drepNotVotedPowerPct: useNomos ? toNum(nomosDrep?.notVotedPct) : (totalActiveStakeAda > 0 ? (notVotedAda / totalActiveStakeAda) * 100 : null),
        drepAbstainPowerPct: useNomos ? toNum(nomosDrep?.abstainPct) : (totalDelegatedStakeAda > 0 ? (abstainPowerAda / totalDelegatedStakeAda) * 100 : null),
        drepAbstainActivePowerPct: totalDelegatedStakeAda > 0 ? (powerStats.abstainActivePowerAda / totalDelegatedStakeAda) * 100 : null,
        drepAbstainAutoPowerPct: useNomos ? (nomosDelegatedAda > 0 ? (toNum(nomosDrep?.alwaysAbstainLovelace) / 1_000_000 / nomosDelegatedAda) * 100 : null) : (totalDelegatedStakeAda > 0 ? (powerStats.abstainAutoPowerAda / totalDelegatedStakeAda) * 100 : null),
        drepNoConfidencePowerPct: useNomos
          ? (nomosActiveAda > 0 ? (nomosNoConfidenceAda / nomosActiveAda) * 100 : null)
          : (totalActiveStakeAda > 0 ? (noConfidenceTotalAda / totalActiveStakeAda) * 100 : null),
        drepNoConfidenceAutoPowerPct: useNomos ? (nomosDelegatedAda > 0 ? (toNum(nomosDrep?.alwaysNoConfidenceLovelace) / 1_000_000 / nomosDelegatedAda) * 100 : null) : (totalDelegatedStakeAda > 0 ? (powerStats.noConfidenceAutoPowerAda / totalDelegatedStakeAda) * 100 : null),
        drepTurnoutPowerPct: useNomos
          ? (nomosActiveAda > 0 ? ((nomosYesAda + nomosNoAda + nomosNoConfidenceAda) / nomosActiveAda) * 100 : null)
          : (totalActiveStakeAda > 0 ? ((yesTotalAda + noTotalAda + noConfidenceTotalAda) / totalActiveStakeAda) * 100 : null),
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
        ccRequiredPct: info?.thresholdInfo?.ccRequiredPct ?? null,
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

  function toggleBatchVoteSelection(row) {
    if (!isDrepVoteEligibleAction(row)) return;
    setBatchVoteIds((prev) => {
      const next = { ...prev };
      if (next[row.proposalId]) {
        delete next[row.proposalId];
        setBatchVoteDrafts((drafts) => {
          const draftNext = { ...drafts };
          delete draftNext[row.proposalId];
          return draftNext;
        });
      } else {
        next[row.proposalId] = true;
        setBatchVoteDrafts((drafts) => ({
          ...drafts,
          [row.proposalId]: drafts[row.proposalId] || { choice: "", rationaleUrl: "" }
        }));
      }
      return next;
    });
  }

  function clearBatchVoteSelection() {
    setBatchVoteIds({});
    setBatchVoteDrafts({});
    setBatchVoteModalOpen(false);
  }

  function selectVisibleDrepActions() {
    const next = {};
    for (const row of rows) {
      if (isDrepVoteEligibleAction(row)) {
        next[row.proposalId] = true;
      }
    }
    setBatchVoteIds(next);
    setBatchVoteDrafts((prev) => {
      const drafts = {};
      for (const proposalId of Object.keys(next)) {
        drafts[proposalId] = prev[proposalId] || { choice: "", rationaleUrl: "" };
      }
      return drafts;
    });
  }

  function updateBatchVoteDraft(proposalId, patch) {
    setBatchVoteDrafts((prev) => ({
      ...prev,
      [proposalId]: {
        choice: "",
        rationaleMode: "url",
        rationaleUrl: "",
        rationaleText: "",
        ...(prev[proposalId] || {}),
        ...patch
      }
    }));
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
  const selectedBatchVoteRows = useMemo(
    () => rows.filter((row) => (
      batchVoteIds[row.proposalId] &&
      isDrepVoteEligibleAction(row)
    )),
    [rows, batchVoteIds]
  );
  const batchVoteCount = selectedBatchVoteRows.length;
  const selectedBatchProposalKey = selectedBatchVoteRows.map((row) => row.proposalId).sort().join("|");
  const distinctLinkedSurveys = useMemo(() => {
    const unique = new Map();
    for (const row of selectedBatchVoteRows) {
      const linked = proposalSurveys[row.proposalId];
      if (linked?.available && !unique.has(linked.surveyRef)) unique.set(linked.surveyRef, linked);
    }
    return [...unique.values()];
  }, [selectedBatchVoteRows, proposalSurveys]);
  // Voting is a DRep-only action: require a registered DRep signed in with the
  // DRep key (non-DReps and stake-key sessions cannot select or cast votes).
  const canVote = Boolean(wallet?.actingAsDrep);
  const showBatchVoteColumn = canVote;

  const activeCount = rows.filter((row) => row.status === "Active").length;
  const enactedCount = rows.filter((row) => row.status === "Enacted").length;
  const expiringSoonCount = rows.filter((row) => row.isExpiringSoon).length;

  useEffect(() => {
    setBatchVoteIds((prev) => {
      const entries = Object.entries(prev);
      if (!entries.length) return prev;
      const eligibleIds = new Set(
        rows
          .filter(isDrepVoteEligibleAction)
          .map((row) => row.proposalId)
      );
      const next = {};
      let changed = false;
      for (const [proposalId, selectedForBatch] of entries) {
        if (selectedForBatch && eligibleIds.has(proposalId)) next[proposalId] = true;
        else changed = true;
      }
      if (changed) {
        setBatchVoteDrafts((drafts) => {
          const draftNext = {};
          for (const proposalId of Object.keys(next)) {
            if (drafts[proposalId]) draftNext[proposalId] = drafts[proposalId];
          }
          return draftNext;
        });
      }
      return changed ? next : prev;
    });
  }, [rows]);

  useEffect(() => {
    if (!selectedBatchProposalKey) {
      setProposalSurveys({});
      setSurveyLoadError("");
      return;
    }
    let cancelled = false;
    setSurveysLoading(true);
    setSurveyLoadError("");
    Promise.all(selectedBatchVoteRows.map(async (row) => {
      const response = await fetch(`/api/proposal-survey?proposalId=${encodeURIComponent(row.proposalId)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Failed to resolve a linked survey.");
      if (payload.available) {
        try {
          payload.survey = await hydrateSurveyPresentation(payload.survey);
        } catch (presentationError) {
          payload.presentationError = presentationError?.message || "External survey presentation could not be verified.";
        }
      }
      return [row.proposalId, payload];
    }))
      .then((entries) => { if (!cancelled) setProposalSurveys(Object.fromEntries(entries)); })
      .catch((error) => { if (!cancelled) setSurveyLoadError(error?.message || "Failed to resolve linked surveys."); })
      .finally(() => { if (!cancelled) setSurveysLoading(false); });
    return () => { cancelled = true; };
  }, [selectedBatchProposalKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const batchVoteReadyCount = selectedBatchVoteRows.filter((row) => batchVoteDrafts[row.proposalId]?.choice).length;
  const linkedSurveysReady = distinctLinkedSurveys.every((linked) => (
    skippedSurveys[linked.surveyRef] ||
    validateSurveyAnswers(linked.survey, surveyAnswers[linked.surveyRef] || []).length === 0
  ));
  const batchVoteReady = batchVoteCount > 0 && batchVoteReadyCount === batchVoteCount && !surveysLoading && linkedSurveysReady;

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

  async function uploadRationale(text) {
    setVoteNotice("Uploading rationale to IPFS...");
    const res = await fetch("/api/upload-rationale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: text })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "IPFS upload failed.");
    setVoteNotice("");
    return { anchorUrl: data.ipfsUrl, anchorDataHash: data.contentHash };
  }

  async function buildVoteAnchor(rawUrl) {
    const url = String(rawUrl || "").trim();
    const rationaleUrlTrimmed = resolveIpfsUrl(url);
    if (!rationaleUrlTrimmed) return undefined;
    try {
      setVoteNotice("Fetching rationale to compute anchor hash...");
      const res = await fetch(rationaleUrlTrimmed);
      const text = await res.text();
      const bytes = new TextEncoder().encode(text);
      const hashHex = blakejs.blake2bHex(bytes, null, 32);
      setVoteNotice("");
      return { anchorUrl: url || rationaleUrlTrimmed, anchorDataHash: hashHex };
    } catch {
      setVoteNotice("Could not fetch rationale URL - voting without anchor.");
      return undefined;
    }
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
    if (!selected || !wallet?.walletApi || !canVote || !voteChoice) return;
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

      // 3. Optional rationale anchor
      const anchor = voteRationaleMode === "write" && voteRationaleText.trim()
        ? await uploadRationale(voteRationaleText.trim())
        : await buildVoteAnchor(voteRationaleUrl);

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

  async function submitBatchVote() {
    const rowsToVote = selectedBatchVoteRows.map((row) => ({
      row,
      draft: batchVoteDrafts[row.proposalId] || { choice: "", rationaleUrl: "" }
    }));
    if (
      !rowsToVote.length ||
      !wallet?.walletApi ||
      !canVote ||
      rowsToVote.some((item) => !item.draft.choice)
    ) return;
    try {
      setVoteSubmitting(true);
      setBatchVoteModalOpen(false);
      setVoteError("");
      setVoteNotice("");
      setVotedTxHash("");
      setVoteSyncStatus("");

      const drepIdCip105 = wallet.walletDrep.dRepIDCip105;

      if (wallet.walletNetworkId !== 1) {
        setVoteNotice("Warning: wallet is on testnet. Proceeding anyway...");
      }

      setVoteNotice(`Building transaction with ${rowsToVote.length} votes...`);
      const tx = new Transaction({ initiator: wallet.walletApi, verbose: false });
      tx.setNetwork("mainnet");
      for (const { row, draft } of rowsToVote) {
        const anchor = draft.rationaleMode === "write" && draft.rationaleText?.trim()
          ? await uploadRationale(draft.rationaleText.trim())
          : await buildVoteAnchor(draft.rationaleUrl);
        tx.txBuilder.vote(
          { type: "DRep", drepId: drepIdCip105 },
          { txHash: row.txHash, txIndex: row.certIndex ?? 0 },
          { voteKind: draft.choice, ...(anchor ? { anchor } : {}) }
        );
      }

      const cip179Responses = [];
      for (const linked of distinctLinkedSurveys) {
        if (skippedSurveys[linked.surveyRef]) continue;
        const survey = linked.survey;
        const answerTuples = surveyAnswers[linked.surveyRef] || [];
        const problems = validateSurveyAnswers(survey, answerTuples);
        if (problems.length) throw new Error(problems.join(" "));
        if (survey.details?.isTimelocked) setVoteNotice(`Encrypting response for ${survey.details.title}...`);
        const built = await buildSurveyResponse(
          wallet.walletApi,
          survey.surveyTxId,
          survey.surveyIndex,
          "DRep",
          answerTuples,
          survey.details?.isTimelocked
            ? { drandRound: survey.details.drandRound, padding: survey.details.padding }
            : undefined,
          undefined,
          survey.details,
        );
        cip179Responses.push(built.response);
      }
      if (cip179Responses.length) {
        tx.setMetadata(METADATA_LABEL, encodePayload({ type: "responses", responses: cip179Responses }));
      }

      const unsignedTx = await tx.build();
      setVoteNotice("Please sign the transaction in your wallet...");
      const signedTx = await wallet.walletApi.signTx(unsignedTx, true, true);
      setVoteNotice("Submitting to chain...");
      const txHash = await wallet.walletApi.submitTx(signedTx);
      setVotedTxHash(txHash);
      setVoteNotice("");
      setBatchVoteIds({});
      setBatchVoteDrafts({});

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
        <div className="hero-title-row">
          <h1>Governance Action Explorer</h1>
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

      {canVote ? (
        <section className="batch-vote-toolbar" aria-label="DRep voting controls">
          <div className="batch-vote-summary">
            <strong>{batchVoteCount}</strong>
            <span>{batchVoteCount === 1 ? "action selected" : "actions selected"}</span>
            {batchVoteCount ? <span>{batchVoteReadyCount}/{batchVoteCount} ready</span> : null}
          </div>
          <div className="batch-vote-actions">
            <button type="button" className="mode-btn" onClick={selectVisibleDrepActions}>
              Select visible
            </button>
            <button type="button" className="mode-btn" onClick={clearBatchVoteSelection} disabled={!batchVoteCount}>
              Clear
            </button>
            <button
              type="button"
              className="vote-confirm-submit"
              disabled={!batchVoteCount || voteSubmitting}
              onClick={() => {
                setVoteError("");
                setVoteNotice("");
                setVotedTxHash("");
                setBatchVoteStep(0);
                setBatchVoteMdPreview(false);
                setBatchVoteModalOpen(true);
              }}
            >
              Review {batchVoteCount === 1 ? "vote" : "votes"}
            </button>
          </div>
        </section>
      ) : null}

      {(voteSubmitting || voteNotice || voteError || votedTxHash) ? (
        <section className="layout">
          <div className="panel vote-status-panel">
            {voteSubmitting && !voteNotice && <p className="vote-notice">Submitting vote…</p>}
            {voteNotice && <p className="vote-notice">{voteNotice}</p>}
            {voteError && <p className="vote-error">{voteError}</p>}
            {votedTxHash && (
              <p className="vote-success">
                Vote submitted!{" "}
                <a
                  href={`https://cardanoscan.io/transaction/${votedTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ext-link"
                >
                  {votedTxHash.slice(0, 16)}…
                </a>
                {voteSyncStatus === "polling" && " Waiting for Civitas to index…"}
                {voteSyncStatus === "synced" && " Civitas has indexed this vote."}
                {voteSyncStatus === "timeout" && " (Civitas indexing check timed out — vote is on-chain regardless.)"}
              </p>
            )}
          </div>
        </section>
      ) : null}

      <section className="layout layout-modal">
        <div className="panel table-panel">
          <table className="mobile-cards-table">
            <thead>
              <tr>
                {showBatchVoteColumn ? <th className="ga-select-heading">Vote</th> : null}
                <th>Action ID</th>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>DRep</th>
                <th>SPO</th>
                <th>CC</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={showBatchVoteColumn ? 9 : 8} className="muted">
                    No governance actions match these filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const ccStats = row.voteStats?.constitutional_committee || {};
                  const ccYes = Number(ccStats.yes || 0);
                  const ccNo = Number(ccStats.no || 0);
                  // Info actions have no ratification thresholds but ALL bodies can vote —
                  // never show N/A for them.
                  const isInfoAction = String(row.governanceType || "").toLowerCase().includes("info");
                  const spoNotEligible = !isInfoAction && row.spoRequiredPct === null && row.spoYesAda === 0 && row.spoNoAda === 0;
                  const ccNotEligible = !isInfoAction && row.ccRequiredPct === null && ccYes === 0 && ccNo === 0;
                  const drepVoteEligible = isDrepVoteEligibleAction(row);
                  const batchSelected = Boolean(batchVoteIds[row.proposalId]);
                  const navUrl = `/actions/${encodeURIComponent(row.proposalId)}${snapshotKey ? `?snapshot=${encodeURIComponent(snapshotKey)}` : ""}`;
                  return (
                    <tr
                      key={row.proposalId}
                      className={row.isExpiringSoon ? "expiring-soon-row" : ""}
                      onClick={() => navigate(navUrl)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(navUrl); }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open details for ${row.actionName}`}
                    >
                      {showBatchVoteColumn ? (
                        <td
                          data-label="Batch"
                          className="ga-select-cell"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={batchSelected}
                            disabled={!drepVoteEligible || voteSubmitting}
                            onChange={() => toggleBatchVoteSelection(row)}
                            aria-label={`Select ${row.actionName} for DRep vote`}
                          />
                        </td>
                      ) : null}
                      <td data-label="Action ID" className="ga-hash-cell">
                        <span className="ga-hash">{formatHashCompact(row.proposalId)}</span>
                      </td>
                      <td data-label="Title" className="ga-title-cell">
                        <div className="ga-title-wrap">
                          {row.depositAda > 0 && <span className="ada-badge">₳{formatAdaShort(row.depositAda)}</span>}
                          <span className="ga-title-main">
                            <span className="ga-title-name">{row.actionName}</span>
                            <ExpiryCountdownPill row={row} nowMs={nowMs} />
                          </span>
                        </div>
                      </td>
                      <td data-label="Type" className="ga-type-cell">
                        <span className="ga-type">{shortType(row.governanceType)}</span>
                      </td>
                      <td data-label="Status" className="ga-status-cell">
                        {row.status ? <span className={`pill ${statusPillMod(row.status)}`}>{row.status}</span> : null}
                        {votedProposalIds.has(row.proposalId) ? (
                          <span className="pill ga-voted-pill" title="Your DRep has voted on this action">✓ Voted</span>
                        ) : null}
                      </td>
                      <td data-label="DRep">
                        <VoteBarCell
                          yesPct={row.drepYesPowerPct}
                          noPct={row.drepNoPowerPct}
                          thresholdPct={row.drepRequiredPct}
                          notEligible={!isInfoAction && !row.drepRequiredPct && !row.voteStats?.drep?.total}
                        />
                      </td>
                      <td data-label="SPO">
                        <VoteBarCell
                          yesPct={row.spoYesPct}
                          noPct={row.spoNoPct}
                          thresholdPct={row.spoRequiredPct}
                          notEligible={spoNotEligible}
                        />
                      </td>
                      <td data-label="CC">
                        <VoteBarCell
                          ccMode
                          yesCount={ccYes}
                          noCount={ccNo}
                          ccElig={row.ccEligibleCount}
                          thresholdPct={row.ccRequiredPct}
                          notEligible={ccNotEligible}
                        />
                      </td>
                      <td data-label="Expires" className="ga-expires-cell">
                        {row.expirationEpoch ? (
                          <>
                            <div>{formatEpochDate(row.expirationEpoch)}</div>
                            <div className="muted" style={{ fontSize: "0.7rem" }}>Ep {row.expirationEpoch}</div>
                          </>
                        ) : <span className="muted">—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      {/* Vote confirmation modal */}
      {voteModalOpen && selected && voteChoice && canVote ? (
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

              <div className="vote-rationale-section">
                <div className="vote-rationale-mode-toggle">
                  <button
                    type="button"
                    className={`mode-btn${voteRationaleMode === "url" ? " active" : ""}`}
                    onClick={() => setVoteRationaleMode("url")}
                  >
                    Provide URL
                  </button>
                  <button
                    type="button"
                    className={`mode-btn${voteRationaleMode === "write" ? " active" : ""}`}
                    onClick={() => setVoteRationaleMode("write")}
                  >
                    Write rationale
                  </button>
                </div>
                {voteRationaleMode === "url" ? (
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
                ) : (
                  <label className="vote-rationale-label">
                    Rationale (uploaded to IPFS as CIP-100 JSON)
                    <textarea
                      value={voteRationaleText}
                      onChange={(e) => setVoteRationaleText(e.target.value)}
                      placeholder="Write your rationale here..."
                      rows={6}
                      autoFocus
                    />
                  </label>
                )}
              </div>

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

      {batchVoteModalOpen && canVote && selectedBatchVoteRows.length ? (() => {
        const total = selectedBatchVoteRows.length;
        const stepIdx = Math.min(batchVoteStep, total - 1);
        const row = selectedBatchVoteRows[stepIdx];
        const draft = batchVoteDrafts[row.proposalId] || {};
        const rationaleMode = draft.rationaleMode ?? "url";
        const linked = proposalSurveys[row.proposalId];
        const firstLinkedRow = linked?.surveyRef
          ? selectedBatchVoteRows.find((item) => proposalSurveys[item.proposalId]?.surveyRef === linked.surveyRef)
          : null;
        const showLinkedEditor = linked?.available && firstLinkedRow?.proposalId === row.proposalId;
        return (
          <div className="image-modal-backdrop" role="presentation" onClick={() => setBatchVoteModalOpen(false)}>
            <div className="image-modal vote-confirm-modal vote-confirm-modal--batch" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="image-modal-close" onClick={() => setBatchVoteModalOpen(false)}>
                Cancel
              </button>

              <div className="batch-step-header">
                <h3 className="rationale-modal-title">
                  {total === 1 ? "Confirm Vote" : `Vote ${stepIdx + 1} / ${total}`}
                </h3>
                <span className="batch-step-ready">{batchVoteReadyCount}/{total} ready</span>
              </div>

              <div className="vote-confirm-body">
                <p className="muted batch-drep-id">Voting as DRep: <span className="mono">{wallet.walletDrep.dRepIDCip105}</span></p>

                <div className="batch-vote-item">
                  <div className="batch-vote-item-head">
                    <strong>{row.actionName}</strong>
                    <span className="mono">{formatHashCompact(row.proposalId)}</span>
                  </div>

                  <div className="batch-vote-choice-row" role="group" aria-label={`Vote choice for ${row.actionName}`}>
                    {["Yes", "No", "Abstain"].map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        className={`mode-btn vote-choice-btn vote-choice-btn--${choice.toLowerCase()}${draft.choice === choice ? " active" : ""}`}
                        onClick={() => updateBatchVoteDraft(row.proposalId, { choice })}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>

                  <div className="vote-rationale-section">
                    <div className="vote-rationale-mode-toggle">
                      <button
                        type="button"
                        className={`mode-btn${rationaleMode === "url" ? " active" : ""}`}
                        onClick={() => { updateBatchVoteDraft(row.proposalId, { rationaleMode: "url" }); setBatchVoteMdPreview(false); }}
                      >
                        Provide URL
                      </button>
                      <button
                        type="button"
                        className={`mode-btn${rationaleMode === "write" ? " active" : ""}`}
                        onClick={() => { updateBatchVoteDraft(row.proposalId, { rationaleMode: "write" }); setBatchVoteMdPreview(false); }}
                      >
                        Write rationale
                      </button>
                    </div>

                    {rationaleMode === "url" ? (
                      <label className="vote-rationale-label">
                        Rationale URL (optional)
                        <input
                          type="url"
                          value={draft.rationaleUrl || ""}
                          onChange={(e) => updateBatchVoteDraft(row.proposalId, { rationaleUrl: e.target.value })}
                          placeholder="https://your-rationale.json  or  ipfs://Qm..."
                        />
                      </label>
                    ) : (
                      <div className="vote-rationale-write">
                        <div className="vote-rationale-write-tabs">
                          <button
                            type="button"
                            className={`mode-btn${!batchVoteMdPreview ? " active" : ""}`}
                            onClick={() => setBatchVoteMdPreview(false)}
                          >
                            Write
                          </button>
                          <button
                            type="button"
                            className={`mode-btn${batchVoteMdPreview ? " active" : ""}`}
                            onClick={() => setBatchVoteMdPreview(true)}
                          >
                            Preview
                          </button>
                          <span className="vote-rationale-write-hint">Markdown supported · uploaded to IPFS as CIP-100 JSON</span>
                        </div>
                        {batchVoteMdPreview ? (
                          <div className="vote-rationale-preview">
                            {draft.rationaleText?.trim()
                              ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.rationaleText}</ReactMarkdown>
                              : <p className="muted">Nothing to preview yet.</p>
                            }
                          </div>
                        ) : (
                          <textarea
                            className="vote-rationale-textarea"
                            value={draft.rationaleText || ""}
                            onChange={(e) => updateBatchVoteDraft(row.proposalId, { rationaleText: e.target.value })}
                            placeholder="Write your rationale here... (Markdown supported)"
                            rows={10}
                            autoFocus
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {surveysLoading ? <p className="muted">Checking this action for a CIP-179 survey...</p> : null}
                  {surveyLoadError ? <p className="vote-notice">Linked survey lookup failed. You can still submit the governance vote.</p> : null}
                  {linked?.linked && !linked.available ? (
                    <p className="vote-notice">Linked survey unavailable: {linked.problem}</p>
                  ) : null}
                  {linked?.presentationError ? <p className="vote-notice">{linked.presentationError}</p> : null}
                  {linked?.available && !showLinkedEditor ? (
                    <p className="muted">This action links the same survey shown with {firstLinkedRow?.actionName}.</p>
                  ) : null}
                  {showLinkedEditor ? (
                    <section className="cip179-linked-survey">
                      <div className="cip179-linked-survey-head">
                        <div>
                          <span className="sq-qtype-label">CIP-179 Survey</span>
                          <h4>{linked.survey.details.title}</h4>
                          {linked.survey.details.description ? <p className="muted">{linked.survey.details.description}</p> : null}
                        </div>
                        <label>
                          <input
                            type="checkbox"
                            checked={Boolean(skippedSurveys[linked.surveyRef])}
                            onChange={(event) => setSkippedSurveys((previous) => ({ ...previous, [linked.surveyRef]: event.target.checked }))}
                          />
                          Skip survey
                        </label>
                      </div>
                      {!skippedSurveys[linked.surveyRef] ? (
                        <>
                          <Cip179ResponseEditor
                            survey={linked.survey}
                            answers={surveyAnswers[linked.surveyRef] || []}
                            onChange={(answers) => setSurveyAnswers((previous) => ({ ...previous, [linked.surveyRef]: answers }))}
                          />
                          {validateSurveyAnswers(linked.survey, surveyAnswers[linked.surveyRef] || []).map((problem) => (
                            <p key={problem} className="vote-notice">{problem}</p>
                          ))}
                        </>
                      ) : <p className="muted">Only the governance vote will be submitted for this action.</p>}
                    </section>
                  ) : null}
                </div>

                {wallet.walletNetworkId !== 1 ? (
                  <p className="vote-notice">Wallet is on testnet — vote will be submitted to testnet.</p>
                ) : null}

                <div className="vote-confirm-actions batch-step-actions">
                  <div className="batch-step-nav">
                    <button
                      type="button"
                      className="mode-btn"
                      onClick={() => { setBatchVoteStep(stepIdx - 1); setBatchVoteMdPreview(false); }}
                      disabled={stepIdx === 0}
                    >
                      ← Prev
                    </button>
                    <button
                      type="button"
                      className="mode-btn"
                      onClick={() => { setBatchVoteStep(stepIdx + 1); setBatchVoteMdPreview(false); }}
                      disabled={stepIdx === total - 1}
                    >
                      Next →
                    </button>
                  </div>
                  <div className="batch-step-submit">
                    <button type="button" className="mode-btn" onClick={() => setBatchVoteModalOpen(false)}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="vote-confirm-submit vote-confirm-submit--yes"
                      onClick={submitBatchVote}
                      disabled={voteSubmitting || !batchVoteReady}
                    >
                      Submit {total === 1 ? "Vote" : `${total} Votes`} On-Chain
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })() : null}

    </main>
  );
}
