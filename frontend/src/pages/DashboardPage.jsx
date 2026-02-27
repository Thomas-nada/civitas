import { Fragment, useCallback, useContext, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Transaction } from "@meshsdk/core";
import { WalletContext } from "../context/WalletContext";

const scoreWeights = {
  attendance: 0.45,
  transparency: 0.3,
  consistency: 0.15,
  responsiveness: 0.1
};

function round(v) {
  return Math.round(v * 10) / 10;
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

function hasVoteRationaleSignal(vote) {
  if (vote?.hasRationale === true) return true;
  return Boolean(String(vote?.rationaleUrl || "").trim());
}

function MetricInfo({ text, label = "How calculated" }) {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return (
    <span className="metric-info">
      <button type="button" className="metric-info-trigger" aria-label={label} title={label}>i</button>
      <div className="metric-info-pop" role="tooltip">
        {lines.map((line, idx) => (
          <p key={`${label}-${idx}`}>{line}</p>
        ))}
      </div>
    </span>
  );
}

function committeeQualityTooltip(row) {
  const cast = Number(row?.cast || 0);
  return [
    "CC rationale quality score (0-100):",
    "Per-vote score = Availability (0 or 25) + Structure (0-45) + Constitutional grounding (0-30).",
    "Availability: URL valid and reachable; otherwise 0.",
    "Structure: CIP-136 required fields, section checks, body-length band, and signature-name match.",
    "Constitutional grounding: Article/Section citations + RelevantArticles references.",
    `Displayed value is the average across ${cast} scoped vote${cast === 1 ? "" : "s"}.`
  ].join("\n");
}

function attendanceTooltip(row) {
  const cast = Number(row?.cast || 0);
  const eligible = Number(row?.totalEligibleVotes || 0);
  const pct = Number(row?.attendance || 0);
  return [
    "Attendance score:",
    "Formula: cast / eligible * 100",
    `Current: ${cast} / ${eligible} = ${pct}%`
  ].join("\n");
}

function transparencyTooltip(row, isCommittee) {
  const count = Number(row?.transparencyCount || 0);
  const total = Number(row?.transparencyTotal || 0);
  const pct = Number(row?.transparencyScore || 0);
  return isCommittee
    ? [
      "Committee transparency:",
      "Displayed from rationale-coverage counts in scoped votes.",
      `Current: ${count} / ${total} = ${pct}%`
    ].join("\n")
    : [
      "Transparency score:",
      "Formula: votes with rationale signal / cast votes * 100",
      `Current: ${count} / ${total} = ${pct}%`
    ].join("\n");
}

function consistencyTooltip(row, isCommittee) {
  if (isCommittee) return committeeQualityTooltip(row);
  const matches = Number(row?.consistencyMatches || 0);
  const total = Number(row?.consistencyTotal || 0);
  const pct = Number(row?.consistency || 0);
  return [
    "Consistency score:",
    "Formula: comparable votes matching outcome / comparable votes * 100",
    `Current: ${matches} / ${total} = ${pct}%`
  ].join("\n");
}

function abstainTooltip(row) {
  const count = Number(row?.abstainCount || 0);
  const total = Number(row?.abstainTotal || 0);
  const pct = Number(row?.abstainRate || 0);
  return [
    "Abstain rate:",
    "Formula: abstain votes / cast votes * 100",
    `Current: ${count} / ${total} = ${pct}%`
  ].join("\n");
}

function responsivenessTooltip(row) {
  const avgHours = row?.avgResponseHours;
  const pct = Number(row?.responsiveness || 0);
  if (avgHours === null || avgHours === undefined) {
    return [
      "Responsiveness score:",
      "Formula: max(0, 100 - (avgResponseHours / (24*30))*100)",
      "Current: no response-time data in scoped votes."
    ].join("\n");
  }
  return [
    "Responsiveness score:",
    "Formula: max(0, 100 - (avgResponseHours / (24*30))*100)",
    `Current: avg ${round(Number(avgHours))}h => ${pct}%`
  ].join("\n");
}

function accountabilityTooltip(row, isCommittee, includeAttendance, includeTransparency, includeAlignment, includeResponsiveness) {
  if (isCommittee) {
    return [
      "Committee accountability score:",
      "Weighted average of enabled metrics.",
      "Weights: Attendance 45%, Rationale quality 35%, Responsiveness 10%.",
      `Current score: ${Number(row?.accountability || 0)}%`
    ].join("\n");
  }
  const enabled = [];
  if (includeAttendance) enabled.push("Attendance 45%");
  if (includeTransparency) enabled.push("Transparency 30%");
  if (includeAlignment) enabled.push("Consistency 15%");
  if (includeResponsiveness) enabled.push("Responsiveness 10%");
  return [
    "Accountability score:",
    "Weighted average of enabled metrics.",
    `Enabled weights: ${enabled.length > 0 ? enabled.join(", ") : "none"}.`,
    `Current score: ${Number(row?.accountability || 0)}%`
  ].join("\n");
}

function scoreCommitteeRationaleQuality(vote) {
  const precomputed = Number(vote?.rationaleQualityScore);
  if (Number.isFinite(precomputed) && precomputed >= 0) {
    return Math.max(0, Math.min(100, precomputed));
  }
  const url = String(vote?.rationaleUrl || "").trim();
  const hasSignal = hasVoteRationaleSignal(vote);
  const bodyLength = Math.max(0, Number(vote?.rationaleBodyLength || 0));
  const sectionCount = Math.max(0, Number(vote?.rationaleSectionCount || 0));
  // Rounded, dataset-based body-length bands derived from current CC rationale distribution.
  // Thresholds (chars): 2000, 3300, 4500, 5900.
  const bodyLengthBand =
    bodyLength >= 5900 ? 4 :
    bodyLength >= 4500 ? 3 :
    bodyLength >= 3300 ? 2 :
    bodyLength >= 2000 ? 1 : 0;
  let score = 0;
  if (hasSignal) score += 35;
  if (url) {
    const looksLikeReference = /^https?:\/\//i.test(url) || /^ipfs:\/\//i.test(url) || /\/ipfs\//i.test(url);
    if (looksLikeReference) score += 15;
    const hasCid = /\b(bafy[a-z0-9]{20,}|Qm[1-9A-HJ-NP-Za-km-z]{20,})\b/i.test(url);
    if (hasCid) score += 10;
  }
  score += bodyLengthBand * 8.75; // 0, 8.75, 17.5, 26.25, 35
  if (sectionCount > 0) score += Math.min(5, sectionCount);
  return Math.max(0, Math.min(100, score));
}

function committeeStatusClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return "good";
  if (s === "retired") return "mid";
  return "low";
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

const CC_TERM_OVERRIDES_BY_HOT = {
  cc_hot1qvr7p6ms588athsgfd0uez5m9rlhwu3g9dt7wcxkjtr4hhsq6ytv2: { seatStartEpoch: 507, expirationEpoch: 596 },
  cc_hot1qv7fa08xua5s7qscy9zct3asaa5a3hvtdc8sxexetcv3unq7cfkq5: { seatStartEpoch: 507, expirationEpoch: 580 },
  cc_hot1qwzuglw5hx3wwr5gjewerhtfhcvz64s9kgam2fgtrj2t7eqs00fzv: { seatStartEpoch: 507, expirationEpoch: 580 },
  cc_hot1qdnedkra2957t6xzzwygdgyefd5ctpe4asywauqhtzlu9qqkttvd9: { seatStartEpoch: 507, expirationEpoch: 580 },
  cc_hot1q0wzkpcxzzfs4mf4yk6yx7d075vqtyx2tnxsr256he6gnwq6yfy5w: { seatStartEpoch: 507, expirationEpoch: 580 },
  cc_hot1qdqp9j44qfnwlkx9h78kts8hvee4ycc7czrw0xl4lqhsw4gcxgkpt: { seatStartEpoch: 507, expirationEpoch: 580 }
};

const CC_TERM_OVERRIDES_BY_NAME = {
  "cardano atlantic council": { seatStartEpoch: 507, expirationEpoch: 596 },
  "intersect constitutional council": { seatStartEpoch: 507, expirationEpoch: 580 },
  emurgo: { seatStartEpoch: 507, expirationEpoch: 580 },
  "cardano foundation": { seatStartEpoch: 507, expirationEpoch: 580 },
  "cardano japan": { seatStartEpoch: 507, expirationEpoch: 580 },
  "input | output": { seatStartEpoch: 507, expirationEpoch: 580 },
  "input output": { seatStartEpoch: 507, expirationEpoch: 580 }
};

function getCommitteeTermOverride(actor) {
  const hot = String(actor?.hotCredential || "").trim().toLowerCase();
  const name = String(actor?.name || "").trim().toLowerCase();
  return CC_TERM_OVERRIDES_BY_HOT[hot] || CC_TERM_OVERRIDES_BY_NAME[name] || null;
}

function getCommitteeEligibilityWindow(actor, proposalInfo) {
  const termOverride = getCommitteeTermOverride(actor);
  const startEpoch = Number(termOverride?.seatStartEpoch || actor?.seatStartEpoch || 0);
  const endEpoch = Number(termOverride?.expirationEpoch || actor?.expirationEpoch || 0);
  const hasStartEpoch = Number.isFinite(startEpoch) && startEpoch > 0;
  const hasEndEpoch = Number.isFinite(endEpoch) && endEpoch > 0;
  const actorStatus = String(actor?.status || "").toLowerCase();
  const allVoteEpochs = (actor?.votes || [])
    .map((vote) => Number(proposalInfo?.[vote.proposalId]?.submittedEpoch || 0))
    .filter((epoch) => Number.isFinite(epoch) && epoch > 0);
  const lastVoteEpoch = allVoteEpochs.length > 0 ? Math.max(...allVoteEpochs) : 0;
  const inferredRetiredEndEpoch = actorStatus === "retired" && !hasEndEpoch && lastVoteEpoch > 0 ? lastVoteEpoch : 0;
  const inferredExpiredEndEpoch = actorStatus === "expired" && !hasEndEpoch && lastVoteEpoch > 0 ? lastVoteEpoch : 0;
  const inferredEndEpoch = inferredRetiredEndEpoch || inferredExpiredEndEpoch || 0;
  const effectiveEndEpoch =
    hasEndEpoch && inferredEndEpoch > 0
      ? Math.min(endEpoch, inferredEndEpoch)
      : hasEndEpoch
        ? endEpoch
        : inferredEndEpoch;
  const hasEffectiveEndEpoch = Number.isFinite(effectiveEndEpoch) && effectiveEndEpoch > 0;
  return { startEpoch, hasStartEpoch, effectiveEndEpoch, hasEffectiveEndEpoch };
}

function formatSnapshotAge(isoString, nowMs) {
  if (!isoString) return "N/A";
  const ts = new Date(isoString).getTime();
  if (!Number.isFinite(ts)) return "N/A";
  const deltaMs = Math.max(0, nowMs - ts);
  const minutes = Math.floor(deltaMs / 60000);
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours <= 0) return `${minutes}m ago`;
  return `${hours}h ${remMinutes}m ago`;
}

function formatVotingPowerPct(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return "0%";
  if (n < 0.01) return "<0.01%";
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function formatDrepPowerShares(row) {
  const total = formatVotingPowerPct(row?.votingPowerPctTotal);
  const active = formatVotingPowerPct(row?.votingPowerPctActive);
  return `${total} total | ${active} active`;
}

function formatSpoPowerShare(row) {
  const total = formatVotingPowerPct(row?.votingPowerPctTotal);
  const active = formatVotingPowerPct(row?.votingPowerPctActive);
  return `${total} total | ${active} active`;
}

function isSpoAlwaysAbstainStatus(status) {
  return String(status || "").trim().toLowerCase() === "always abstain";
}

function linkTypeFromRef(ref) {
  const uri = String(ref?.uri || "").toLowerCase();
  const label = String(ref?.label || "").toLowerCase();
  const text = `${uri} ${label}`;
  if (text.includes("x.com") || text.includes("twitter.com") || text.includes(" x ")) return "x";
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
  const fromLines = raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (fromLines.length > 1) return fromLines;
  const sentences = raw
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= 2) return [raw];
  const chunks = [];
  for (let i = 0; i < sentences.length; i += 2) {
    chunks.push(sentences.slice(i, i + 2).join(" "));
  }
  return chunks;
}

export default function DashboardPage({ actorType }) {
  const PAGE_SIZE_OPTIONS = [50, 100, 200, "all"];
  const isDrep = actorType === "drep";
  const isSpo = actorType === "spo";
  const isCommittee = !isDrep && !isSpo;
  const actorLabel = isDrep ? "DRep" : isSpo ? "Stake Pool" : "Committee Member";
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const snapshotKey = queryParams.get("snapshot") || "";
  const initialSelectedId = queryParams.get("id") || "";
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [minAttendance, setMinAttendance] = useState(0);
  const [sortBy, setSortBy] = useState("accountability");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const typePickerRef = useRef(null);
  const [includeActiveActions, setIncludeActiveActions] = useState(true);
  const [includeAttendance, setIncludeAttendance] = useState(true);
  const [includeTransparency, setIncludeTransparency] = useState(!isCommittee);
  const [includeAlignment, setIncludeAlignment] = useState(isCommittee);
  const [includeResponsiveness, setIncludeResponsiveness] = useState(isCommittee);
  const [includePreviousCommitteeMembers, setIncludePreviousCommitteeMembers] = useState(false);
  const [detailVoteView, setDetailVoteView] = useState("voted");
  const [voteRationaleText, setVoteRationaleText] = useState({});
  const [voteRationaleSections, setVoteRationaleSections] = useState({});
  const [voteRationaleLoading, setVoteRationaleLoading] = useState({});
  const [voteRationaleError, setVoteRationaleError] = useState({});
  // Wallet state is global — read from WalletContext
  const wallet = useContext(WalletContext);
  const [delegateNotice, setDelegateNotice] = useState("");
  const [delegating, setDelegating] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [profileImageOpen, setProfileImageOpen] = useState(false);
  const [rationaleModal, setRationaleModal] = useState({ open: false, key: "", title: "", proposalId: "" });
  const latestSnapshotRef = useRef("");
  const syncPollBusyRef = useRef(false);
  const detailPanelRef = useRef(null);
  const useModalDetails = false;
  const cacheKey = useMemo(
    () => `civitas.accountability.${actorType}.${snapshotKey || "latest"}`,
    [actorType, snapshotKey]
  );

  const loadData = useCallback(async () => {
    try {
      setError("");
      const params = new URLSearchParams();
      if (snapshotKey) params.set("snapshot", snapshotKey);
      params.set("view", actorType);
      const endpoint = `/api/accountability?${params.toString()}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load dashboard data.");
      setPayload(data);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch {
        // Ignore session storage failures.
      }
      latestSnapshotRef.current = String(data?.lastSyncCompletedAt || data?.generatedAt || "");
    } catch (e) {
      setError(e.message);
    }
  }, [cacheKey, snapshotKey]);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") {
          setPayload(parsed);
          latestSnapshotRef.current = String(parsed?.lastSyncCompletedAt || parsed?.generatedAt || "");
        }
      }
    } catch {
      // Ignore stale cache parse errors.
    }
    loadData();
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
          await loadData();
        }
      } catch {
        // Ignore background poll errors; visible load errors are handled by loadData.
      } finally {
        syncPollBusyRef.current = false;
      }
    };
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, [loadData, snapshotKey]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!typeMenuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!typePickerRef.current) return;
      if (!typePickerRef.current.contains(event.target)) {
        setTypeMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setTypeMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [typeMenuOpen]);

  async function prepareDelegation() {
    if (!selected) return;
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

      const tx = new Transaction({
        initiator: wallet.walletApi,
        verbose: false
      });
      tx.setNetwork("mainnet");
      tx.txBuilder.voteDelegationCertificate(
        {
          dRepId: selected.id
        },
        wallet.walletRewardAddress
      );

      const unsignedTx = await tx.build();
      const signedTx = await wallet.walletApi.signTx(unsignedTx, true, true);
      const txHash = await wallet.walletApi.submitTx(signedTx);

      setDelegateNotice(`Delegation submitted on-chain. Tx: ${txHash}`);
    } catch (e) {
      const message = e?.message || "Delegation transaction failed.";
      setDelegateNotice(`Delegation failed: ${message}`);
    } finally {
      setDelegating(false);
    }
  }

  async function loadVoteRationale(item) {
    if (!item?.vote) return;
    const key = `${selected?.id || ""}-${item.proposalId}`;
    if (voteRationaleLoading[key] || voteRationaleText[key]) return;
    try {
      setVoteRationaleLoading((prev) => ({ ...prev, [key]: true }));
      setVoteRationaleError((prev) => ({ ...prev, [key]: "" }));
      const params = new URLSearchParams();
      if (item.vote.rationaleUrl) params.set("url", item.vote.rationaleUrl);
      if (item.vote.voteTxHash) params.set("voteTxHash", item.vote.voteTxHash);
      params.set("proposalId", item.proposalId);
      params.set(
        "voterId",
        isDrep ? selected?.id || "" : isSpo ? selected?.id || "" : selected?.hotCredential || selected?.id || ""
      );
      params.set("voterRole", isDrep ? "drep" : isSpo ? "stake_pool" : "constitutional_committee");
      const res = await fetch(`/api/vote-rationale?${params.toString()}`);
      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error("Vote rationale endpoint returned non-JSON response.");
      }
      if (!res.ok) throw new Error(data.error || "Failed to load vote rationale.");
      const sections = Array.isArray(data?.rationaleSections)
        ? data.rationaleSections
            .map((section) => ({
              title: String(section?.title || "").trim(),
              text: String(section?.text || "").trim()
            }))
            .filter((section) => section.title && section.text)
        : [];
      setVoteRationaleSections((prev) => ({ ...prev, [key]: sections }));
      setVoteRationaleText((prev) => ({
        ...prev,
        [key]: data?.rationaleText?.trim() || "No rationale text found for this vote metadata."
      }));
    } catch (e) {
      setVoteRationaleError((prev) => ({ ...prev, [key]: e.message || "Failed to load rationale." }));
    } finally {
      setVoteRationaleLoading((prev) => ({ ...prev, [key]: false }));
    }
  }

  function openVoteRationaleModal(item) {
    if (!item?.vote) return;
    const key = `${selected?.id || ""}-${item.proposalId}`;
    setRationaleModal({
      open: true,
      key,
      title: item.actionName || item.proposalId,
      proposalId: item.proposalId
    });
    loadVoteRationale(item);
  }

  const proposalInfo = payload?.proposalInfo || {};
  const mergedDrepActors = useMemo(() => {
    const dreps = Array.isArray(payload?.dreps) ? payload.dreps : [];
    const byId = new Map(
      dreps.map((row) => [String(row?.id || "").trim().toLowerCase(), { ...row }]).filter(([id]) => Boolean(id))
    );
    const applySpecial = (specialKey, drepId, fallbackName) => {
      const special = payload?.specialDreps?.[specialKey];
      const specialPower = Number(special?.votingPowerAda || 0);
      const key = String(drepId || "").trim().toLowerCase();
      if (!key) return;
      const existing = byId.get(key) || {
        id: drepId,
        name: fallbackName,
        votes: [],
        votingPowerAda: 0
      };
      const merged = { ...existing };
      if (!merged.name) merged.name = fallbackName;
      if (specialPower > 0) merged.votingPowerAda = specialPower;
      byId.set(key, merged);
    };
    applySpecial("alwaysAbstain", "drep_always_abstain", "Always Abstain");
    applySpecial("alwaysNoConfidence", "drep_always_no_confidence", "Always No Confidence");
    return Array.from(byId.values());
  }, [payload]);
  const actors = isDrep ? mergedDrepActors : isSpo ? payload?.spos || [] : payload?.committeeMembers || [];

  const totalVotingPower = useMemo(
    () => mergedDrepActors.reduce((sum, d) => sum + Number(d.votingPowerAda || 0), 0),
    [mergedDrepActors]
  );
  const autoAbstainVotingPower = useMemo(
    () =>
      Number(
        mergedDrepActors.find((d) => String(d?.id || "").trim().toLowerCase() === "drep_always_abstain")?.votingPowerAda || 0
      ),
    [mergedDrepActors]
  );
  const activeVotingPower = useMemo(
    () => Math.max(0, totalVotingPower - autoAbstainVotingPower),
    [totalVotingPower, autoAbstainVotingPower]
  );
  const totalSpoVotingPower = useMemo(
    () => (isSpo ? actors.reduce((sum, row) => sum + Number(row?.votingPowerAda || 0), 0) : 0),
    [actors, isSpo]
  );
  const spoAlwaysAbstainVotingPower = useMemo(
    () => (
      isSpo
        ? actors
            .filter((row) => isSpoAlwaysAbstainStatus(row?.delegationStatus))
            .reduce((sum, row) => sum + Number(row?.votingPowerAda || 0), 0)
        : 0
    ),
    [actors, isSpo]
  );
  const activeSpoVotingPower = useMemo(
    () => Math.max(0, totalSpoVotingPower - spoAlwaysAbstainVotingPower),
    [totalSpoVotingPower, spoAlwaysAbstainVotingPower]
  );

  const actionOptions = useMemo(
    () =>
      Object.entries(proposalInfo)
        .map(([proposalId, info]) => ({ proposalId, actionName: info?.actionName || proposalId }))
        .sort((a, b) => a.actionName.localeCompare(b.actionName)),
    [proposalInfo]
  );

  const typeOptions = useMemo(
    () =>
      Array.from(new Set(Object.values(proposalInfo).map((x) => x?.governanceType || "Unknown"))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [proposalInfo]
  );

  const totalSpoVoteCount = useMemo(
    () =>
      Object.values(proposalInfo).reduce(
        (sum, info) => sum + Number(info?.voteStats?.stake_pool?.total || 0),
        0
      ),
    [proposalInfo]
  );

  const isActiveAction = (proposalId) => {
    const outcome = String(proposalInfo[proposalId]?.outcome || "").trim().toLowerCase();
    return outcome === "pending" || outcome === "active" || outcome === "open" || outcome === "in_progress";
  };
  const isEarlyDroppedAction = (proposalId) => {
    const info = proposalInfo[proposalId] || {};
    const droppedEpoch = Number(info?.droppedEpoch || 0);
    const expirationEpoch = Number(info?.expirationEpoch || 0);
    if (!Number.isFinite(droppedEpoch) || droppedEpoch <= 0) return false;
    if (!Number.isFinite(expirationEpoch) || expirationEpoch <= 0) return false;
    return droppedEpoch < expirationEpoch;
  };
  const governanceTypeForProposal = (proposalId) => proposalInfo[proposalId]?.governanceType || "Unknown";
  const drepParticipationStartEpoch = Number(payload?.drepParticipationStartEpoch || 534);
  const requiresDrepParticipation = (proposalId) => {
    const info = proposalInfo[proposalId] || {};
    const submittedEpoch = Number(info.submittedEpoch || 0);
    if (Number.isFinite(submittedEpoch) && submittedEpoch > 0) {
      return submittedEpoch >= drepParticipationStartEpoch;
    }
    return Number(info?.voteStats?.drep?.total || 0) > 0;
  };
  const requiresCommitteeParticipation = (proposalId) => {
    const info = proposalInfo[proposalId] || {};
    const type = String(info?.governanceType || "").toLowerCase();
    if (type.includes("no confidence")) return false;
    if (type.includes("new committee")) return false;
    // If a proposal is dropped before its natural expiry window closes,
    // do not penalize CC attendance for that proposal.
    if (isEarlyDroppedAction(proposalId)) return false;
    return true;
  };
  const requiresSpoParticipation = (proposalId) => {
    const info = proposalInfo[proposalId] || {};
    return Number(info?.voteStats?.stake_pool?.total || 0) > 0;
  };
  const committeeProposalTerminalEpoch = (proposalId) => {
    const info = proposalInfo[proposalId] || {};
    const candidates = [
      Number(info.enactedEpoch || 0),
      Number(info.ratifiedEpoch || 0),
      Number(info.droppedEpoch || 0),
      Number(info.expiredEpoch || 0),
      Number(info.expirationEpoch || 0)
    ].filter((x) => Number.isFinite(x) && x > 0);
    if (candidates.length === 0) return null;
    return Math.min(...candidates);
  };
  const toggleGovernanceType = (type) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const rows = useMemo(() => {
    const selectedTypeSet = new Set(selectedTypes);
    const filteredProposalIds = Object.keys(proposalInfo).filter((proposalId) => {
      if (selectedAction && proposalId !== selectedAction) return false;
      if (!includeActiveActions && isActiveAction(proposalId)) return false;
      if (selectedTypeSet.size > 0 && !selectedTypeSet.has(governanceTypeForProposal(proposalId))) return false;
      return true;
    });
    const filteredProposalEpochs = new Map(
      filteredProposalIds.map((proposalId) => [proposalId, Number(proposalInfo[proposalId]?.submittedEpoch || 0)])
    );
    const data = actors
      .map((actor) => {
        const eligibility = isCommittee ? getCommitteeEligibilityWindow(actor, proposalInfo) : null;
        const startEpoch = Number(eligibility?.startEpoch || 0);
        const hasStartEpoch = Boolean(eligibility?.hasStartEpoch);
        const effectiveEndEpoch = Number(eligibility?.effectiveEndEpoch || 0);
        const hasEffectiveEndEpoch = Boolean(eligibility?.hasEffectiveEndEpoch);
        const votes = (actor.votes || []).filter((vote) => {
          if (selectedAction && vote.proposalId !== selectedAction) return false;
          if (!includeActiveActions && isActiveAction(vote.proposalId)) return false;
          if (selectedTypeSet.size > 0 && !selectedTypeSet.has(governanceTypeForProposal(vote.proposalId))) return false;
          if (isCommittee && (hasStartEpoch || hasEffectiveEndEpoch)) {
            const proposalEpoch = Number(proposalInfo[vote.proposalId]?.submittedEpoch || 0);
            if (Number.isFinite(proposalEpoch) && proposalEpoch > 0) {
              if (hasStartEpoch && proposalEpoch < startEpoch) return false;
              if (hasEffectiveEndEpoch && proposalEpoch > effectiveEndEpoch) return false;
            }
          }
          return true;
        });

        let scopedVotes = votes;
        if (isDrep) {
          scopedVotes = votes.filter((vote) => requiresDrepParticipation(vote.proposalId));
        } else if (isSpo) {
          scopedVotes = votes.filter((vote) => requiresSpoParticipation(vote.proposalId));
        }

        const cast = scopedVotes.length;
        let totalEligibleVotes = selectedAction ? 1 : Math.max(filteredProposalIds.length, 1);
        if (isDrep) {
          const drepEligibleProposalIds = filteredProposalIds.filter((proposalId) => requiresDrepParticipation(proposalId));
          if (selectedAction) {
            totalEligibleVotes = drepEligibleProposalIds.includes(selectedAction) ? 1 : 0;
          } else {
            totalEligibleVotes = drepEligibleProposalIds.length;
          }
        }
        if (isCommittee) {
          const committeeEligibleProposalIds = filteredProposalIds.filter((proposalId) => requiresCommitteeParticipation(proposalId));
          const actorVoteByProposal = new Set(votes.map((v) => v.proposalId));
          if (hasStartEpoch || hasEffectiveEndEpoch) {
            let eligible = 0;
            for (const proposalId of committeeEligibleProposalIds) {
              const proposalEpoch = Number(filteredProposalEpochs.get(proposalId) || 0);
              if (Number.isFinite(proposalEpoch) && proposalEpoch > 0) {
                if (hasStartEpoch && proposalEpoch < startEpoch) continue;
                if (hasEffectiveEndEpoch && proposalEpoch > effectiveEndEpoch) continue;
              }
              if (hasEffectiveEndEpoch && !actorVoteByProposal.has(proposalId)) {
                const terminalEpoch = committeeProposalTerminalEpoch(proposalId);
                if (!terminalEpoch || terminalEpoch > effectiveEndEpoch) continue;
              }
              eligible += 1;
            }
            totalEligibleVotes = Math.max(eligible, cast, 0);
          } else {
            totalEligibleVotes = Math.max(committeeEligibleProposalIds.length, cast, 0);
          }
        }
        if (isSpo) {
          const spoEligibleProposalIds = filteredProposalIds.filter((proposalId) => requiresSpoParticipation(proposalId));
          if (selectedAction) {
            totalEligibleVotes = spoEligibleProposalIds.includes(selectedAction) ? 1 : 0;
          } else {
            totalEligibleVotes = spoEligibleProposalIds.length;
          }
        }
        const attendance = totalEligibleVotes > 0 ? cast / totalEligibleVotes * 100 : 0;
        const comparable = scopedVotes.filter((vote) => {
          const o = String(vote.outcome || "").toLowerCase();
          return o === "yes" || o === "no";
        });
        const consistencyMatches = comparable.filter(
          (v) => String(v.vote).toLowerCase() === String(v.outcome).toLowerCase()
        ).length;
        const consistencyTotal = comparable.length;
        const consistency = consistencyTotal > 0 ? consistencyMatches / consistencyTotal * 100 : 0;
        const responseValues = scopedVotes
          .map((v) => (typeof v.responseHours === "number" ? v.responseHours : null))
          .filter((v) => v !== null);
        const avgResponseHours =
          responseValues.length > 0 ? responseValues.reduce((s, v) => s + v, 0) / responseValues.length : null;
        const responsiveness = avgResponseHours === null ? 0 : Math.max(0, 100 - avgResponseHours / (24 * 30) * 100);
        const abstainCount = scopedVotes.filter((v) => String(v.vote).toLowerCase() === "abstain").length;
        const abstainTotal = cast;
        const abstainRate = abstainTotal > 0 ? abstainCount / abstainTotal * 100 : 0;
        const transparencyCount = isCommittee
          ? cast
          : scopedVotes.filter((v) => v.hasRationale !== false).length;
        const transparencyTotal = cast;
        const committeeQuality =
          transparencyTotal > 0
            ? scopedVotes.reduce((sum, vote) => sum + scoreCommitteeRationaleQuality(vote), 0) / transparencyTotal
            : 0;
        const transparency = transparencyTotal > 0 ? (transparencyCount / transparencyTotal) * 100 : 0;
        const consistencyMetric = isCommittee ? committeeQuality : consistency;
        const vpPctTotal = isDrep
          ? (totalVotingPower > 0 ? Number(actor.votingPowerAda || 0) / totalVotingPower * 100 : 0)
          : isSpo
            ? (totalSpoVotingPower > 0 ? Number(actor.votingPowerAda || 0) / totalSpoVotingPower * 100 : 0)
            : 0;
        const isAlwaysAbstainDrep = String(actor?.id || "").trim().toLowerCase() === "drep_always_abstain";
        const isAlwaysAbstainSpo = isSpo && isSpoAlwaysAbstainStatus(actor?.delegationStatus);
        const vpPctActive = isDrep
          ? (isAlwaysAbstainDrep ? 0 : (activeVotingPower > 0 ? Number(actor.votingPowerAda || 0) / activeVotingPower * 100 : 0))
          : isSpo
            ? (isAlwaysAbstainSpo ? 0 : (activeSpoVotingPower > 0 ? Number(actor.votingPowerAda || 0) / activeSpoVotingPower * 100 : 0))
            : 0;

        const wAttendance = includeAttendance ? scoreWeights.attendance : 0;
        const wTransparency = !isCommittee && includeTransparency ? scoreWeights.transparency : 0;
        const wAlignment = !isCommittee && includeAlignment ? scoreWeights.consistency : 0;
        const wResponsiveness = (isDrep || isSpo) && includeResponsiveness ? scoreWeights.responsiveness : 0;
        // CC-specific weights: attendance 45%, rationale quality 35%, responsiveness 10%, breadth 10%
        const wRationaleQuality = isCommittee && includeAlignment ? 0.35 : 0;
        const wCcResponsiveness = isCommittee && includeResponsiveness ? 0.1 : 0;
        const activeWeight = wAttendance + wTransparency + wAlignment + wResponsiveness + wRationaleQuality + wCcResponsiveness;
        const weighted = isCommittee
          ? attendance * wAttendance + committeeQuality * wRationaleQuality + responsiveness * wCcResponsiveness
          : attendance * wAttendance + transparency * wTransparency + consistencyMetric * wAlignment + responsiveness * wResponsiveness;
        const accountability = activeWeight > 0 ? weighted / activeWeight : 0;

        return {
          ...actor,
          seatStartEpoch: isCommittee && hasStartEpoch ? startEpoch : null,
          expirationEpoch: isCommittee && hasEffectiveEndEpoch ? effectiveEndEpoch : null,
          votes: scopedVotes,
          cast,
          totalEligibleVotes,
          attendance: round(attendance),
          consistency: round(consistencyMetric),
          consistencyMatches: isCommittee ? null : consistencyMatches,
          consistencyTotal: isCommittee ? null : consistencyTotal,
          transparencyScore: round(transparency),
          transparencyCount,
          transparencyTotal,
          abstainRate: round(abstainRate),
          abstainCount,
          abstainTotal,
          avgResponseHours: avgResponseHours === null ? null : round(avgResponseHours),
          responsiveness: round(responsiveness),
          accountability: round(accountability),
          votingPowerPct: vpPctTotal,
          votingPowerPctTotal: vpPctTotal,
          votingPowerPctActive: vpPctActive
        };
      })
      .filter((row) => (isCommittee ? row.cast > 0 : true))
      .filter((row) => (isCommittee ? (includePreviousCommitteeMembers ? true : String(row.status || "").toLowerCase() === "active") : true))
      .filter((row) => row.attendance >= minAttendance)
      .filter((row) => {
        if (!deferredSearch.trim()) return true;
        const q = deferredSearch.trim().toLowerCase();
        return (row.name || "").toLowerCase().includes(q) || row.id.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sortBy === "name") return (a.name || a.id).localeCompare(b.name || b.id);
        return (b[sortBy] ?? 0) - (a[sortBy] ?? 0);
      });
    return data;
  }, [
    actors,
    includeActiveActions,
    selectedAction,
    selectedTypes,
    includeAttendance,
    includeTransparency,
    includeAlignment,
    includeResponsiveness,
    includePreviousCommitteeMembers,
    minAttendance,
    deferredSearch,
    sortBy,
    proposalInfo,
    payload,
    isDrep,
    isCommittee,
    isSpo,
    totalVotingPower,
    activeVotingPower,
    totalSpoVotingPower,
    activeSpoVotingPower
  ]);

  useEffect(() => {
    if (!rows.length) {
      setSelectedWithUrl("");
      return;
    }
    if (selectedId && !rows.some((r) => r.id === selectedId)) {
      setSelectedWithUrl("");
    }
  }, [rows, selectedId]);

  useEffect(() => {
    setPage(1);
  }, [minAttendance, deferredSearch, sortBy, selectedAction, selectedTypes, includeActiveActions, includePreviousCommitteeMembers, pageSize]);

  const effectivePageSize = useMemo(() => {
    if (isCommittee) return Math.max(rows.length, 1);
    if (pageSize === "all") return Math.max(rows.length, 1);
    const n = Number(pageSize);
    return Number.isFinite(n) && n > 0 ? n : 50;
  }, [pageSize, rows.length, isCommittee]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(rows.length / effectivePageSize)), [rows.length, effectivePageSize]);
  const currentPage = Math.min(page, totalPages);
  const pagedRows = useMemo(() => {
    if (isCommittee) return rows;
    if (pageSize === "all") return rows;
    const start = (currentPage - 1) * effectivePageSize;
    return rows.slice(start, start + effectivePageSize);
  }, [rows, currentPage, effectivePageSize, pageSize, isCommittee]);

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

  useEffect(() => {
    const shouldLockScroll =
      Boolean(rationaleModal?.open) ||
      Boolean(profileImageOpen) ||
      (useModalDetails && Boolean(selectedId));
    if (!shouldLockScroll) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [rationaleModal?.open, profileImageOpen, useModalDetails, selectedId]);

  const selected = rows.find((r) => r.id === selectedId);
  const showResponsivenessColumn = isDrep || isSpo || isCommittee;
  const showTransparencyColumn = !isCommittee;
  const transparencyLabel = "Transparency";
  const alignmentLabel = isCommittee ? "Rationale Quality" : "Alignment";
  const tableColSpan = isCommittee ? 8 : showResponsivenessColumn ? 7 : 6;

  function setSelectedWithUrl(nextId) {
    setSelectedId(nextId);
    const url = new URL(window.location.href);
    if (nextId) url.searchParams.set("id", nextId);
    else url.searchParams.delete("id");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  const detailActions = useMemo(() => {
    if (!selected) return [];
    const selectedTypeSet = new Set(selectedTypes);
    const proposalIds = Object.keys(proposalInfo).filter((proposalId) => {
      if (selectedAction && proposalId !== selectedAction) return false;
      if (!includeActiveActions && isActiveAction(proposalId)) return false;
      if (selectedTypeSet.size > 0 && !selectedTypeSet.has(governanceTypeForProposal(proposalId))) return false;
      return true;
    });

    const voteByProposal = new Map((selected.votes || []).map((vote) => [vote.proposalId, vote]));
    const committeeEligibility = isCommittee ? getCommitteeEligibilityWindow(selected, proposalInfo) : null;
    const isDrepEligibleProposal = (proposalId) => {
      if (!isDrep) return true;
      return requiresDrepParticipation(proposalId);
    };
    const isCommitteeEligibleProposal = (proposalId) => {
      if (!isCommittee) return true;
      if (!requiresCommitteeParticipation(proposalId)) return false;
      const proposalEpoch = Number(proposalInfo[proposalId]?.submittedEpoch || 0);
      if (Number.isFinite(proposalEpoch) && proposalEpoch > 0) {
        if (committeeEligibility?.hasStartEpoch && proposalEpoch < committeeEligibility.startEpoch) return false;
        if (committeeEligibility?.hasEffectiveEndEpoch && proposalEpoch > committeeEligibility.effectiveEndEpoch) return false;
      }
      if (committeeEligibility?.hasEffectiveEndEpoch) {
        const alreadyVoted = voteByProposal.has(proposalId);
        if (!alreadyVoted) {
          const terminalEpoch = committeeProposalTerminalEpoch(proposalId);
          if (!terminalEpoch || terminalEpoch > committeeEligibility.effectiveEndEpoch) return false;
        }
      }
      return true;
    };
    const isSpoEligibleProposal = (proposalId) => {
      if (!isSpo) return true;
      return requiresSpoParticipation(proposalId);
    };
    const all = proposalIds
      .map((proposalId) => {
        const info = proposalInfo[proposalId] || {};
        const vote = voteByProposal.get(proposalId) || null;
        return {
          proposalId,
          actionName: info.actionName || proposalId,
          governanceType: info.governanceType || "Unknown",
          outcome: info.outcome || "Unknown",
          submittedAtUnix: Number(info.submittedAtUnix || 0),
          submittedAt: info.submittedAt || null,
          vote
        };
      })
      .sort((a, b) => {
        const delta = (b.submittedAtUnix || 0) - (a.submittedAtUnix || 0);
        if (delta !== 0) return delta;
        return a.actionName.localeCompare(b.actionName);
      });

    if (detailVoteView === "missed") {
      return all.filter(
        (item) =>
          !item.vote &&
          (isDrep
            ? isDrepEligibleProposal(item.proposalId)
            : isCommittee
              ? isCommitteeEligibleProposal(item.proposalId)
              : isSpoEligibleProposal(item.proposalId))
      );
    }
    if (detailVoteView === "all") return all;
    return all.filter((item) => item.vote);
  }, [
    selected,
    selectedAction,
    selectedTypes,
    includeActiveActions,
    proposalInfo,
    detailVoteView,
    isActiveAction,
    governanceTypeForProposal,
    isDrep,
    isCommittee,
    isSpo,
    requiresDrepParticipation,
    requiresCommitteeParticipation,
    requiresSpoParticipation,
    committeeProposalTerminalEpoch
  ]);

  return (
    <main className="shell">
      <header className="hero dashboard-header">
        <div>
          <h1>{isDrep ? "DRep Dashboard" : isSpo ? "Stake Pool Governance Dashboard" : "Constitutional Committee Dashboard"}</h1>
        </div>
      </header>

      <section className="cards">
        <article className="card">
          <p>Visible {actorLabel}s</p>
          <strong>{rows.length}</strong>
        </article>
        <article className="card">
          <p>Total Governance Actions</p>
          <strong>{Object.keys(proposalInfo).length}</strong>
        </article>
        {isDrep ? (
          <>
            <article className="card">
              <p>Total Voting Power</p>
              <strong>{`${Number(totalVotingPower).toLocaleString()} ada`}</strong>
            </article>
            <article className="card">
              <p>Active Voting Power</p>
              <strong>{`${Number(activeVotingPower).toLocaleString()} ada`}</strong>
            </article>
          </>
        ) : isSpo ? (
          <>
            <article className="card">
              <p>Total Voting Power</p>
              <strong>{`${Number(totalSpoVotingPower).toLocaleString()} ada`}</strong>
            </article>
            <article className="card">
              <p>Active Voting Power</p>
              <strong>{`${Number(activeSpoVotingPower).toLocaleString()} ada`}</strong>
            </article>
          </>
        ) : null}
        <article className="card">
          <p>Snapshot</p>
          <strong>{formatSnapshotAge(payload?.generatedAt, nowMs)}</strong>
          {payload?.historical ? <p className="muted">History: {payload.snapshotKey}</p> : null}
        </article>
      </section>

      <div className="filter-block panel">
        <section className="controls dashboard-controls">
          <label>
            Search {actorLabel}
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or ID..." />
          </label>
          <label>
            Minimum Attendance
            <input type="range" min="0" max="100" value={minAttendance} onChange={(e) => setMinAttendance(Number(e.target.value))} />
            <span>{minAttendance}%</span>
          </label>
          <label>
            Sort By
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="accountability">Accountability Score</option>
              <option value="attendance">Attendance</option>
              <option value="consistency">{alignmentLabel}</option>
              <option value="abstainRate">Abstain Rate</option>
              {showTransparencyColumn ? <option value="transparencyScore">{transparencyLabel}</option> : null}
              {(isDrep || isSpo) ? <option value="votingPowerAda">Voting Power</option> : null}
              <option value="name">Name</option>
            </select>
          </label>
          <label>
            Governance Action
            <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)}>
              <option value="">All governance actions</option>
              {actionOptions.map((opt) => (
                <option key={opt.proposalId} value={opt.proposalId}>
                  {opt.actionName}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="dashboard-type-row">
          <div className="type-picker" ref={typePickerRef}>
            <p>Governance Types</p>
            <button type="button" className="type-trigger" onClick={() => setTypeMenuOpen((v) => !v)}>
              {selectedTypes.length === 0 ? "All governance types" : `${selectedTypes.length} selected`}
            </button>
            {typeMenuOpen ? (
              <div className="type-popover panel">
                <div className="type-chip-list">
                  {typeOptions.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={selectedTypes.includes(type) ? "type-chip active" : "type-chip"}
                      onClick={() => toggleGovernanceType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <div className="type-popover-actions">
                  <button type="button" onClick={() => setSelectedTypes(typeOptions)}>
                    Select all
                  </button>
                  <button type="button" onClick={() => setSelectedTypes([])}>
                    Clear
                  </button>
                  <button type="button" onClick={() => setTypeMenuOpen(false)}>
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="dashboard-toggle-row">
          <label className="toggle dashboard-toggle">
            Include Active Actions
            <input type="checkbox" checked={includeActiveActions} onChange={(e) => setIncludeActiveActions(e.target.checked)} />
          </label>
          <label className="toggle dashboard-toggle">
            Include Attendance In Score
            <input type="checkbox" checked={includeAttendance} onChange={(e) => setIncludeAttendance(e.target.checked)} />
          </label>
          {!isCommittee ? (
            <label className="toggle dashboard-toggle">
              Include Transparency In Score
              <input
                type="checkbox"
                checked={includeTransparency}
                onChange={(e) => setIncludeTransparency(e.target.checked)}
              />
            </label>
          ) : null}
          <label className="toggle dashboard-toggle">
            {isCommittee ? "Include Rationale Quality In Score" : "Include Alignment In Score"}
            <input type="checkbox" checked={includeAlignment} onChange={(e) => setIncludeAlignment(e.target.checked)} />
          </label>
          {(isDrep || isSpo || isCommittee) ? (
            <label className="toggle dashboard-toggle">
              Include Responsiveness In Score
              <input type="checkbox" checked={includeResponsiveness} onChange={(e) => setIncludeResponsiveness(e.target.checked)} />
            </label>
          ) : null}
          {isCommittee ? (
            <label className="toggle dashboard-toggle">
              Include Previous CC Members
              <input
                type="checkbox"
                checked={includePreviousCommitteeMembers}
                onChange={(e) => setIncludePreviousCommitteeMembers(e.target.checked)}
              />
            </label>
          ) : null}
        </section>
      </div>

      {error ? (
        <section className="status-row">
          <p className="muted">Error: {error}</p>
        </section>
      ) : null}

      {isSpo && !error && totalSpoVoteCount === 0 ? (
        <section className="status-row">
          <p className="muted">
            No stake-pool governance votes were detected in the current snapshot window. The SPO dashboard will populate when proposals include stake-pool role votes.
          </p>
        </section>
      ) : null}

      <section className="layout dashboard-layout layout-modal">
        <div className="panel table-panel">
          <table className="mobile-cards-table">
            <thead>
              <tr>
                <th>{actorLabel}</th>
                <th>Attendance</th>
                {showTransparencyColumn ? <th>{transparencyLabel}</th> : null}
                <th>{alignmentLabel}</th>
                <th>Abstain</th>
        {showResponsivenessColumn ? <th>Responsiveness</th> : null}
        {isCommittee ? <th>Term start</th> : null}
        {isCommittee ? <th>Term End</th> : null}
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={tableColSpan} className="muted">
                    No actors match the selected filters.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <Fragment key={row.id}>
                  <tr
                    className={row.id === selectedId ? "active" : ""}
                    onClick={() => setSelectedWithUrl(row.id === selectedId ? "" : row.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedWithUrl(row.id === selectedId ? "" : row.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={row.id === selectedId ? "true" : "false"}
                  >
                    <td data-label={actorLabel}>
                      {isDrep ? (
                        <>
                          <div className="drep-row-block">
                            <div className="drep-row-line drep-row-name">
                              {row.name ? <strong>{row.name}</strong> : <strong>Unnamed DRep</strong>}
                            </div>
                            <div className="drep-row-line drep-row-power">
                              {Number(row.votingPowerAda || 0).toLocaleString()} ada
                            </div>
                            <div className="drep-row-line drep-row-shares">
                              {formatDrepPowerShares(row)}
                            </div>
                            <div className="drep-row-line mono drep-row-credentials">
                              <a
                                className="ext-link"
                                href={`https://cardanoscan.io/drep/${encodeURIComponent(row.id)}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {row.id}
                              </a>
                            </div>
                          </div>
                        </>
                      ) : isCommittee ? (
                        <div className="cc-actor-block">
                          <div className="cc-actor-name">{row.name || row.id}</div>
                          <div className="cc-actor-status">
                            <span className={`pill ${committeeStatusClass(row.status)}`}>
                              {String(row.status || "expired").replace(/\b\w/g, (m) => m.toUpperCase())}
                            </span>
                          </div>
                          <div className="mono cc-actor-creds">
                            {row.hotCredential ? (
                              <div>
                                Hot:{" "}
                                <a className="ext-link" href={cardanoscanCredentialLink(row.hotCredential)} target="_blank" rel="noreferrer">
                                  {row.hotCredential}
                                </a>
                              </div>
                            ) : null}
                            {row.coldCredential ? (
                              <div>
                                Cold:{" "}
                                <a className="ext-link" href={cardanoscanCredentialLink(row.coldCredential)} target="_blank" rel="noreferrer">
                                  {row.coldCredential}
                                </a>
                              </div>
                            ) : null}
                            {!row.hotCredential && !row.coldCredential ? row.id : null}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="drep-row-block">
                            <div className="drep-row-line drep-row-name">
                              <strong>{row.name || "N/A"}</strong>
                              {isSpoAlwaysAbstainStatus(row.delegationStatus) ? (
                                <span className="pill good">{row.delegationStatus}</span>
                              ) : null}
                            </div>
                            <div className="drep-row-line drep-row-power">
                              {Number(row.votingPowerAda || 0).toLocaleString()} ada
                            </div>
                            <div className="drep-row-line drep-row-shares">
                              {formatSpoPowerShare(row)}
                            </div>
                            <div className="drep-row-line mono drep-row-credentials">
                              <a
                                className="ext-link"
                                href={`https://cardanoscan.io/pool/${encodeURIComponent(row.id)}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {row.id}
                              </a>
                            </div>
                          </div>
                        </>
                      )}
                    </td>
                    <td data-label="Attendance">
                      <span className="metric-value-with-info">
                        <strong>{row.attendance}%</strong>
                        <MetricInfo text={attendanceTooltip(row)} label="Attendance calculation" />
                      </span>
                      <div className="muted">
                        {row.cast}/{row.totalEligibleVotes}
                      </div>
                    </td>
                    {showTransparencyColumn ? (
                    <td data-label={transparencyLabel}>
                      <span className="metric-value-with-info">
                        <strong>{row.transparencyScore ?? 0}%</strong>
                        <MetricInfo text={transparencyTooltip(row, isCommittee)} label="Transparency calculation" />
                      </span>
                      <div className="muted">
                        {row.transparencyCount ?? 0}/{row.transparencyTotal ?? 0}
                      </div>
                    </td>
                    ) : null}
                    <td data-label={alignmentLabel}>
                      <span className="metric-value-with-info">
                        <strong>{row.consistency}%</strong>
                        <MetricInfo text={consistencyTooltip(row, isCommittee)} label="Consistency calculation" />
                      </span>
                      <div className="muted">
                        {isCommittee ? "" : `${row.consistencyMatches ?? 0}/${row.consistencyTotal ?? 0}`}
                      </div>
                    </td>
                    <td data-label="Abstain">
                      <span className="metric-value-with-info">
                        <strong>{row.abstainRate}%</strong>
                        <MetricInfo text={abstainTooltip(row)} label="Abstain calculation" />
                      </span>
                      <div className="muted">
                        {row.abstainCount ?? 0}/{row.abstainTotal ?? 0}
                      </div>
                    </td>
                    {showResponsivenessColumn ? (
                      <td data-label="Responsiveness">
                        {row.avgResponseHours === null ? (
                          <span className="muted">—</span>
                        ) : (
                          <>
                            <span className="metric-value-with-info">
                              <strong>{row.responsiveness ?? 0}%</strong>
                              <MetricInfo text={responsivenessTooltip(row)} label="Responsiveness calculation" />
                            </span>
                            <div className="muted">{formatResponseHours(row.avgResponseHours)}</div>
                          </>
                        )}
                      </td>
                    ) : null}
                    {isCommittee ? (
                      <td data-label="Term start">
                        {row.seatStartEpoch ? (
                          <>
                            Epoch {row.seatStartEpoch}
                          </>
                        ) : (
                          <span className="muted">Unknown</span>
                        )}
                      </td>
                    ) : null}
                    {isCommittee ? (
                      <td data-label="Term end">
                        {row.expirationEpoch ? (
                          <>Epoch {row.expirationEpoch}</>
                        ) : (
                          <span className="muted">Unknown</span>
                        )}
                      </td>
                    ) : null}
                    <td data-label="Score">
                      <span className="metric-value-with-info">
                        <span className={`pill ${row.accountability >= 75 ? "good" : row.accountability >= 50 ? "mid" : "low"}`}>
                          {row.accountability}
                        </span>
                        <MetricInfo
                          text={accountabilityTooltip(row, isCommittee, includeAttendance, includeTransparency, includeAlignment, includeResponsiveness)}
                          label="Accountability calculation"
                        />
                      </span>
                    </td>
                  </tr>
                  {row.id === selectedId && selected ? (
                    <tr className="action-expanded-row">
                      <td colSpan={tableColSpan}>
                        <div ref={detailPanelRef} className="detail panel action-inline-detail">
                          {selected.name ? <h2>{selected.name}</h2> : (isSpo ? <h2>N/A</h2> : null)}
                          {isDrep && selected.profile?.imageUrl ? (
                            <button type="button" className="profile-image-inline-btn" onClick={() => setProfileImageOpen(true)}>
                              <img className="profile-image" src={selected.profile.imageUrl} alt={`${selected.name || selected.id} profile`} />
                            </button>
                          ) : null}
                          {isDrep ? (
                            <button type="button" className="delegate-cta" onClick={prepareDelegation} disabled={delegating}>
                              {delegating ? "Submitting Delegation..." : "Delegate Voting Power To This DRep"}
                            </button>
                          ) : null}
                          {isDrep && !wallet?.walletApi ? <p className="muted">Connect your wallet in the top bar to enable delegation.</p> : null}
                          {isDrep && delegateNotice ? <p className="muted">{delegateNotice}</p> : null}
                          <p className="mono">
                            {isDrep ? (
                              <a
                                className="ext-link"
                                href={`https://cardanoscan.io/drep/${encodeURIComponent(selected.id)}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {selected.id}
                              </a>
                            ) : isCommittee ? (
                              <span>
                                {selected.hotCredential ? (
                                  <>
                                    Hot:{" "}
                                    <a className="ext-link" href={cardanoscanCredentialLink(selected.hotCredential)} target="_blank" rel="noreferrer">
                                      {selected.hotCredential}
                                    </a>{" "}
                                  </>
                                ) : null}
                                {selected.coldCredential ? (
                                  <>
                                    Cold:{" "}
                                    <a className="ext-link" href={cardanoscanCredentialLink(selected.coldCredential)} target="_blank" rel="noreferrer">
                                      {selected.coldCredential}
                                    </a>
                                  </>
                                ) : null}
                                {!selected.hotCredential && !selected.coldCredential ? selected.id : null}
                              </span>
                            ) : (
                              <a
                                className="ext-link"
                                href={`https://cardanoscan.io/pool/${encodeURIComponent(selected.id)}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {selected.id}
                              </a>
                            )}
                          </p>
                          <div className="meta">
                            <p>
                              Attendance:{" "}
                              <span className="metric-value-with-info">
                                <strong>{selected.attendance}%</strong>
                                <MetricInfo text={attendanceTooltip(selected)} label="Attendance calculation" />
                              </span>{" "}
                              ({selected.cast}/{selected.totalEligibleVotes})
                            </p>
                          {showTransparencyColumn ? (
                          <p>
                            {transparencyLabel}:{" "}
                            <span className="metric-value-with-info">
                              <strong>{selected.transparencyScore ?? 0}% ({selected.transparencyCount ?? 0}/{selected.transparencyTotal ?? 0})</strong>
                              <MetricInfo text={transparencyTooltip(selected, isCommittee)} label="Transparency calculation" />
                            </span>
                          </p>
                          ) : null}
                            <p>
                              {alignmentLabel}:{" "}
                              <span className="metric-value-with-info">
                                <strong>
                                  {selected.consistency}% {isCommittee ? "" : `(${selected.consistencyMatches ?? 0}/${selected.consistencyTotal ?? 0})`}
                                </strong>
                                <MetricInfo text={consistencyTooltip(selected, isCommittee)} label="Consistency calculation" />
                              </span>
                            </p>
                            <p>
                              Abstain rate:{" "}
                              <span className="metric-value-with-info">
                                <strong>{selected.abstainRate}% ({selected.abstainCount ?? 0}/{selected.abstainTotal ?? 0})</strong>
                                <MetricInfo text={abstainTooltip(selected)} label="Abstain calculation" />
                              </span>
                            </p>
                            {(isDrep || isSpo || isCommittee) ? (
                              <p>
                                Avg response time:{" "}
                                <span className="metric-value-with-info">
                                  <strong>{formatResponseHours(selected.avgResponseHours)}</strong>
                                  <MetricInfo text={responsivenessTooltip(selected)} label="Responsiveness calculation" />
                                </span>
                              </p>
                            ) : null}
                            {isDrep ? (
                              <p>
                                Voting power:{" "}
                                <strong className="drep-power-lines">
                                  <span className="drep-power-amount">{Number(selected.votingPowerAda || 0).toLocaleString()} ada</span>
                                  <span className="drep-power-shares">{formatDrepPowerShares(selected)}</span>
                                </strong>
                              </p>
                            ) : isCommittee ? (
                              <p>
                                Committee status:{" "}
                                <strong>{String(selected.status || "expired").replace(/\b\w/g, (m) => m.toUpperCase())}</strong>
                              </p>
                            ) : null}
                            {isSpo ? (
                              <>
                                <p>
                                  Pool status: <strong>{String(selected.status || "registered").replace(/\b\w/g, (m) => m.toUpperCase())}</strong>
                                </p>
                                {isSpoAlwaysAbstainStatus(selected.delegationStatus) ? (
                                  <>
                                    <p>
                                      Delegation posture: <strong>{selected.delegationStatus}</strong>
                                    </p>
                                    <p>
                                      Delegated DRep literal: <strong>{selected.delegatedDrepLiteralRaw || "None"}</strong>
                                    </p>
                                  </>
                                ) : null}
                                {selected.homepage ? (
                                  <p>
                                    Homepage:{" "}
                                    <a className="ext-link" href={selected.homepage} target="_blank" rel="noreferrer">
                                      {selected.homepage}
                                    </a>
                                  </p>
                                ) : null}
                              </>
                            ) : null}
                            {isCommittee ? (
                              <>
                                <p>
                                  Term started:{" "}
                                  <strong>
                                    {selected.seatStartEpoch ? `Epoch ${selected.seatStartEpoch}` : "Unknown"}
                                  </strong>
                                </p>
                                <p>
                                  Term expiry:{" "}
                                  <strong>
                                    {selected.expirationEpoch ? `Epoch ${selected.expirationEpoch}` : "Unknown"}
                                  </strong>
                                </p>
                              </>
                            ) : null}
                          </div>
                          {isDrep ? (
                            <div className="meta drep-profile">
                              <h3 className="detail-section-title">DRep Profile</h3>
                              {selected.profile?.email ? (
                                <p className="profile-row">
                                  <span className="profile-label">Email</span>
                                  <a className="ext-link" href={`mailto:${selected.profile.email}`}>
                                    {selected.profile.email}
                                  </a>
                                </p>
                              ) : null}
                              {selected.profile?.bio ? (
                                <div className="profile-block">
                                  <h4>Bio</h4>
                                  {splitProfileText(selected.profile.bio).map((line, idx) => (
                                    <p key={`bio-${selected.id}-${idx}`}>{line}</p>
                                  ))}
                                </div>
                              ) : null}
                              {selected.profile?.motivations ? (
                                <div className="profile-block">
                                  <h4>Motivations</h4>
                                  {splitProfileText(selected.profile.motivations).map((line, idx) => (
                                    <p key={`mot-${selected.id}-${idx}`}>{line}</p>
                                  ))}
                                </div>
                              ) : null}
                              {selected.profile?.objectives ? (
                                <div className="profile-block">
                                  <h4>Objectives</h4>
                                  {splitProfileText(selected.profile.objectives).map((line, idx) => (
                                    <p key={`obj-${selected.id}-${idx}`}>{line}</p>
                                  ))}
                                </div>
                              ) : null}
                              {selected.profile?.qualifications ? (
                                <div className="profile-block">
                                  <h4>Qualifications</h4>
                                  {splitProfileText(selected.profile.qualifications).map((line, idx) => (
                                    <p key={`qual-${selected.id}-${idx}`}>{line}</p>
                                  ))}
                                </div>
                              ) : null}
                              {Array.isArray(selected.profile?.references) && selected.profile.references.length > 0 ? (
                                <>
                                  <h4 className="profile-links-title">Links</h4>
                                  <div className="vote-list profile-links">
                                    {selected.profile.references.slice(0, 8).map((ref) => (
                                      <article className="vote-item profile-link-item" key={`${selected.id}-${ref.uri}`}>
                                        <a className="ext-link profile-link-anchor" href={ref.uri} target="_blank" rel="noreferrer">
                                          <span className={`link-chip link-chip-${linkTypeFromRef(ref)}`}>{linkIcon(linkTypeFromRef(ref))}</span>
                                          <span>{ref.label || ref.uri}</span>
                                        </a>
                                      </article>
                                    ))}
                                  </div>
                                </>
                              ) : null}
                            </div>
                          ) : null}

                          <h3 className="detail-section-title">Governance Actions</h3>
                          <p className="muted">Sorted by proposal submission time: newest first.</p>
                          <div className="detail-mode-switch">
                            <button
                              type="button"
                              className={detailVoteView === "voted" ? "mode-btn active" : "mode-btn"}
                              onClick={() => setDetailVoteView("voted")}
                            >
                              Voted
                            </button>
                            <button
                              type="button"
                              className={detailVoteView === "missed" ? "mode-btn active" : "mode-btn"}
                              onClick={() => setDetailVoteView("missed")}
                            >
                              Missed
                            </button>
                            <button
                              type="button"
                              className={detailVoteView === "all" ? "mode-btn active" : "mode-btn"}
                              onClick={() => setDetailVoteView("all")}
                            >
                              All Actions
                            </button>
                          </div>
                          <div className="vote-list">
                            {detailActions.length === 0 ? (
                              <p className="muted">No governance actions in this view.</p>
                            ) : (
                              detailActions.map((item) => {
                              return (
                                <article className="vote-item" key={`${selected.id}-${item.proposalId}`}>
                                  <h3>{item.actionName}</h3>
                                  <p className="mono">
                                    {item.governanceType} | {item.proposalId}
                                  </p>
                                  <p>
                                    Submitted:{" "}
                                    <strong>{item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "Unknown"}</strong>
                                  </p>
                                  <p>
                                    Vote: <strong>{formatVoteLabelForActor(item.vote ? item.vote.vote : "", actorType)}</strong> | Final outcome:{" "}
                                    <strong>{item.vote ? item.vote.outcome : item.outcome}</strong>
                                  </p>
                                  {isDrep ? (
                                    <p>
                                      Response time: <strong>{formatResponseHours(item.vote?.responseHours ?? null)}</strong>
                                    </p>
                                  ) : null}
                                  {item.vote && (!isSpo || item.vote.hasRationale === true || String(item.vote.rationaleUrl || "").trim()) ? (
                                    <>
                                      <button type="button" className="mode-btn" onClick={() => openVoteRationaleModal(item)}>
                                        Open vote rationale
                                      </button>
                                    </>
                                  ) : null}
                                </article>
                              );
                              })
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
          {rows.length > 0 && !isCommittee ? (
            <div className="table-pager">
              <label className="pager-size">
                Per page
                <select
                  value={String(pageSize)}
                  onChange={(e) => setPageSize(e.target.value === "all" ? "all" : Number(e.target.value))}
                >
                  {PAGE_SIZE_OPTIONS.map((opt) => (
                    <option key={String(opt)} value={String(opt)}>
                      {opt === "all" ? "All" : opt}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="mode-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || pageSize === "all"}
              >
                Previous
              </button>
              <span className="muted">
                Page {currentPage} / {totalPages} ({rows.length.toLocaleString()} total)
              </span>
              <button
                type="button"
                className="mode-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || pageSize === "all"}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>

      </section>
      {useModalDetails && selected ? (
        <div className="detail-backdrop" role="presentation" onClick={() => setSelectedWithUrl("")} />
      ) : null}
      {isDrep && profileImageOpen && selected?.profile?.imageUrl ? (
        <div className="image-modal-backdrop" role="presentation" onClick={() => setProfileImageOpen(false)}>
          <div className="image-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="image-modal-close" onClick={() => setProfileImageOpen(false)}>
              Close
            </button>
            <img className="image-modal-img" src={selected.profile.imageUrl} alt={`${selected.name || selected.id} profile`} />
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
              ) : (voteRationaleSections[rationaleModal.key] || []).length > 0 ? (
                <div className="rationale-sections">
                  {(voteRationaleSections[rationaleModal.key] || []).map((section, idx) => (
                    <section className="rationale-section" key={`${rationaleModal.key}-${idx}`}>
                      <h4>{section.title}</h4>
                      {section.text.split(/\n\n+/).map((chunk, cIdx) => (
                        <p className="rationale-text" key={`${rationaleModal.key}-${idx}-${cIdx}`}>{chunk.trim()}</p>
                      ))}
                    </section>
                  ))}
                </div>
              ) : (
                <p className="rationale-text">{voteRationaleText[rationaleModal.key] || "No rationale available."}</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
