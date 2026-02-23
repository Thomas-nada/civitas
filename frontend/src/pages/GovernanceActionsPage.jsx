import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function round(value) {
  return Math.round(value * 100) / 100;
}

function asPct(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  return `${round(Number(value))}%`;
}

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isNoConfidenceAction(governanceType) {
  const t = String(governanceType || "").toLowerCase();
  return t.includes("no confidence") || t.includes("noconfidence");
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
  const [payloadModalOpen, setPayloadModalOpen] = useState(false);
  const [proposalMetadataCache, setProposalMetadataCache] = useState({});
  const [proposalMetadataLoading, setProposalMetadataLoading] = useState(false);
  const [proposalMetadataError, setProposalMetadataError] = useState("");
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

  const rows = useMemo(() => {
    const list = Object.entries(proposalInfo).map(([proposalId, info]) => {
      const status = deriveStatus(info);
      const voteStats = info?.voteStats || fallbackVoteStats.get(proposalId) || {};
      const nomosDrep = info?.nomosModel?.drep || null;
      const nomosSpo = info?.nomosModel?.spo || null;
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

      const useNomos = Boolean(nomosDrep);
      const drepRequiredPct = toNum(info?.thresholdInfo?.drepRequiredPct);
      const spoRequiredPct = toNum(info?.thresholdInfo?.poolRequiredPct);
      const drepYesPct = useNomos ? toNum(nomosDrep?.yesPct) : (totalActiveStakeAda > 0 ? (yesTotalAda / totalActiveStakeAda) * 100 : null);
      const drepNoPct = useNomos ? toNum(nomosDrep?.noPct) : (totalActiveStakeAda > 0 ? (noTotalAda / totalActiveStakeAda) * 100 : null);
      const spoYesPct = nomosSpo ? toNum(nomosSpo.yesPct) : null;
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

      return {
        proposalId,
        actionName: info?.actionName || proposalId,
        governanceType: info?.governanceType || "Unknown",
        outcome: info?.outcome || "Unknown",
        status,
        submittedAt: info?.submittedAt || null,
        submittedAtUnix: Number(info?.submittedAtUnix || 0),
        depositAda: Number(info?.depositAda || 0),
        thresholdInfo: info?.thresholdInfo || {},
        voteStats,
        totalVotes: roleTotalVotes(voteStats),
        txHash: info?.txHash || null,
        returnAddress: info?.returnAddress || "",
        certIndex: info?.certIndex,
        expirationEpoch: info?.expirationEpoch,
        ratifiedEpoch: info?.ratifiedEpoch,
        enactedEpoch: info?.enactedEpoch,
        droppedEpoch: info?.droppedEpoch,
        expiredEpoch: info?.expiredEpoch,
        governanceDescription: info?.governanceDescription || null,
        modelSource: useNomos ? "nomos-koios" : "local-fallback",
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
        spoNoPct: nomosSpo ? toNum(nomosSpo.noPct) : null,
        spoAbstainPct: nomosSpo ? toNum(nomosSpo.abstainPct) : null,
        spoNotVotedPct: nomosSpo ? toNum(nomosSpo.notVotedPct) : null,
        spoYesAda: nomosSpo ? toNum(nomosSpo.yesLovelace) / 1_000_000 : null,
        spoNoAda: nomosSpo ? toNum(nomosSpo.noLovelace) / 1_000_000 : null,
        spoAbstainAda: nomosSpo ? toNum(nomosSpo.abstainLovelace) / 1_000_000 : null,
        spoNotVotedAda: nomosSpo ? toNum(nomosSpo.notVotedLovelace) / 1_000_000 : null,
        drepRequiredPct: drepRequiredPct > 0 ? drepRequiredPct : null,
        spoRequiredPct: spoRequiredPct > 0 ? spoRequiredPct : null,
        drepThresholdMet,
        spoThresholdMet,
        passingNow
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
  }, [proposalInfo, fallbackVoteStats, drepPowerStats, query, typeFilter, statusFilter, sortBy]);

  useEffect(() => {
    if (!rows.length) {
      setSelectedWithUrl("");
      return;
    }
    if (selectedId && !rows.some((row) => row.proposalId === selectedId)) {
      setSelectedWithUrl("");
    }
  }, [rows, selectedId]);

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

  useEffect(() => {
    if (!payloadModalOpen || !selected?.proposalId) return;
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
  }, [payloadModalOpen, selected?.proposalId, proposalMetadataCache]);

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

      <section className="layout">
        <div className="panel">
          <table>
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
                rows.map((row) => (
                  <tr
                    key={row.proposalId}
                    className={row.proposalId === selectedId ? "active" : ""}
                    onClick={() => setSelectedWithUrl(row.proposalId)}
                    role="button"
                    tabIndex={0}
                  >
                    <td>{row.actionName}</td>
                    <td>{row.governanceType}</td>
                    <td>{row.status ? <span className={`pill ${statusPillClass(row.status)}`}>{row.status}</span> : ""}</td>
                    <td>{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "Unknown"}</td>
                    <td>
                      {asPct(row.drepYesPowerPct)} / {asPct(row.drepNoPowerPct)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <aside className="detail panel">
          {!selected ? (
            <p className="muted">Select a governance action to inspect details.</p>
          ) : (
            <>
              <h2>{selected.actionName}</h2>
              <p className="mono">{selected.proposalId}</p>
              <div className="meta">
                <p>
                  Type: <strong>{selected.governanceType}</strong>
                </p>
                <p>
                  Status: {selected.status ? <span className={`pill ${statusPillClass(selected.status)}`}>{selected.status}</span> : ""}
                </p>
                <p>
                  Submitted: <strong>{selected.submittedAt ? new Date(selected.submittedAt).toLocaleString() : "Unknown"}</strong>
                </p>
                <p>
                  Deposit: <strong>{Number(selected.depositAda || 0).toLocaleString()} ada</strong>
                </p>
                <p>
                  Required DRep threshold: <strong>{asPct(selected.thresholdInfo?.drepRequiredPct)}</strong>
                </p>
                <p>
                  Required SPO threshold: <strong>{asPct(selected.thresholdInfo?.poolRequiredPct)}</strong>
                </p>
                <p>
                  Threshold profile: <strong>{selected.thresholdInfo?.thresholdLabel || "N/A"}</strong>
                </p>
                <p>
                  Vote model: <strong>{selected.modelSource === "nomos-koios" ? "Nomos/Koios" : "Local fallback"}</strong>
                </p>
                {selected.thresholdInfo?.parameterGroup ? (
                  <p>
                    Parameter group: <strong>{selected.thresholdInfo.parameterGroup}</strong>
                  </p>
                ) : null}
                {selected.txHash ? (
                  <p>
                    Tx:{" "}
                    <a className="ext-link" href={`https://cardanoscan.io/transaction/${selected.txHash}`} target="_blank" rel="noreferrer">
                      {selected.txHash}
                    </a>
                  </p>
                ) : null}
              </div>

              <h3>DRep Voting Power Breakdown</h3>
              <div className="vote-list">
                <article className="vote-item">
                  <h3>DRep Power (Active Stake Model)</h3>
                  <p>
                    Threshold progress: <strong>{asPct(selected.drepYesPowerPct)}</strong>
                    {selected.drepRequiredPct !== null ? (
                      <>
                        {" "}
                        / <strong>{asPct(selected.drepRequiredPct)}</strong> (
                        <strong>{selected.drepThresholdMet ? "met" : "not met"}</strong>)
                      </>
                    ) : null}
                  </p>
                  <p>
                    Yes (of active stake): <strong>{asPct(selected.drepYesPowerPct)}</strong>
                  </p>
                  <p>
                    No (of active stake): <strong>{asPct(selected.drepNoPowerPct)}</strong>
                  </p>
                  <p>
                    Not voted (of active stake): <strong>{asPct(selected.drepNotVotedPowerPct)}</strong>
                  </p>
                  <p>
                    Abstain (of delegated): <strong>{asPct(selected.drepAbstainPowerPct)}</strong>
                  </p>
                  <details>
                    <summary>Show full calculation details</summary>
                    <p>
                      Total delegated stake: <strong>{Math.round(selected.totalDelegatedStakeAda || 0).toLocaleString()} ada</strong>
                    </p>
                    <p>
                      Total active stake: <strong>{Math.round(selected.totalActiveStakeAda || 0).toLocaleString()} ada</strong>
                    </p>
                    <p>
                      Yes ada: <strong>{Math.round(selected.drepYesPowerAda || 0).toLocaleString()} ada</strong>
                    </p>
                    <p>
                      No ada: <strong>{Math.round(selected.drepNoPowerAda || 0).toLocaleString()} ada</strong>
                    </p>
                    <p>
                      Not voted ada: <strong>{Math.round(selected.drepNotVotedPowerAda || 0).toLocaleString()} ada</strong>
                    </p>
                    <p>
                      Abstain total ada: <strong>{Math.round(selected.drepAbstainPowerAda || 0).toLocaleString()} ada</strong>
                    </p>
                    <p>
                      Active abstain: <strong>{asPct(selected.drepAbstainActivePowerPct)}</strong> (
                      {Math.round(selected.drepAbstainActivePowerAda || 0).toLocaleString()} ada)
                    </p>
                    <p>
                      Automated abstain: <strong>{asPct(selected.drepAbstainAutoPowerPct)}</strong> (
                      {Math.round(selected.drepAbstainAutoPowerAda || 0).toLocaleString()} ada)
                    </p>
                    <p>
                      Automated no confidence: <strong>{asPct(selected.drepNoConfidenceAutoPowerPct)}</strong> (
                      {Math.round(selected.drepNoConfidenceAutoPowerAda || 0).toLocaleString()} ada)
                    </p>
                    <p>
                      No confidence (total): <strong>{asPct(selected.drepNoConfidencePowerPct)}</strong> (
                      {Math.round(selected.drepNoConfidencePowerAda || 0).toLocaleString()} ada)
                    </p>
                    {!selected.hasAutoAbstainPower ? <p className="muted">Automated abstain DRep power detected: none in current snapshot.</p> : null}
                    <p>For non-`NoConfidence` actions, auto no confidence is counted as No. For `NoConfidence`, it is counted as Yes.</p>
                  </details>
                </article>
                <article className="vote-item">
                  <h3>Constitutional Committee (Vote Count)</h3>
                  <p>
                    Constitutional: <strong>{selected.voteStats?.constitutional_committee?.yes || 0}</strong> | Unconstitutional:{" "}
                    <strong>{selected.voteStats?.constitutional_committee?.no || 0}</strong> | Abstain:{" "}
                    <strong>{selected.voteStats?.constitutional_committee?.abstain || 0}</strong> | Total:{" "}
                    <strong>{selected.voteStats?.constitutional_committee?.total || 0}</strong>
                  </p>
                </article>
                <article className="vote-item">
                  <h3>Stake Pools</h3>
                  {selected.spoRequiredPct !== null ? (
                    <p>
                      Threshold progress: <strong>{asPct(selected.spoYesPct)}</strong> / <strong>{asPct(selected.spoRequiredPct)}</strong> (
                      <strong>{selected.spoThresholdMet ? "met" : "not met"}</strong>)
                    </p>
                  ) : null}
                  {selected.spoYesPct === null ? (
                    <p>
                      Yes: <strong>{selected.voteStats?.stake_pool?.yes || 0}</strong> | No:{" "}
                      <strong>{selected.voteStats?.stake_pool?.no || 0}</strong> | Abstain:{" "}
                      <strong>{selected.voteStats?.stake_pool?.abstain || 0}</strong> | Total:{" "}
                      <strong>{selected.voteStats?.stake_pool?.total || 0}</strong>
                    </p>
                  ) : (
                    <>
                      <p>
                        Yes: <strong>{asPct(selected.spoYesPct)}</strong> ({Math.round(selected.spoYesAda || 0).toLocaleString()} ada)
                      </p>
                      <p>
                        No: <strong>{asPct(selected.spoNoPct)}</strong> ({Math.round(selected.spoNoAda || 0).toLocaleString()} ada)
                      </p>
                      <p>
                        Not voted: <strong>{asPct(selected.spoNotVotedPct)}</strong> ({Math.round(selected.spoNotVotedAda || 0).toLocaleString()} ada)
                      </p>
                      <p>
                        Abstain: <strong>{asPct(selected.spoAbstainPct)}</strong> ({Math.round(selected.spoAbstainAda || 0).toLocaleString()} ada)
                      </p>
                    </>
                  )}
                </article>
              </div>

              <h3>Governance Payload</h3>
              <button type="button" className="mode-btn" onClick={() => setPayloadModalOpen(true)}>
                Open governance payload
              </button>
            </>
          )}
        </aside>
      </section>
      {payloadModalOpen && selected ? (
        <div className="image-modal-backdrop" role="presentation" onClick={() => setPayloadModalOpen(false)}>
          <div className="image-modal payload-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="image-modal-close" onClick={() => setPayloadModalOpen(false)}>
              Close
            </button>
            <h3 className="rationale-modal-title">{payloadDoc.title || "Governance Payload"}</h3>
            <p className="mono">{selected.proposalId}</p>
            <div className="rationale-modal-content">
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
                <section className="rationale-section" key={`${selected.proposalId}-${section.key}`}>
                  <h4>{section.title}</h4>
                  {section.type === "json" ? (
                    <pre className="json-pre payload-pretty">{JSON.stringify(section.content, null, 2)}</pre>
                  ) : (
                    <p className="payload-text">{section.content}</p>
                  )}
                </section>
              ))}
              {payloadDoc.references.length > 0 ? (
                <section className="rationale-section">
                  <h4>References</h4>
                  <div className="vote-list">
                    {payloadDoc.references.map((ref) => (
                      <article className="vote-item" key={`${selected.proposalId}-${ref.uri}`}>
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
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
