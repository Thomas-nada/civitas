import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

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

  let regularDrepStakeAda = dreps.reduce((s, d) => s + Number(d.votingPowerAda || 0), 0);
  if (knownIds.has(ALWAYS_ABSTAIN_ID)) regularDrepStakeAda -= Number(dreps.find((d) => d.id === ALWAYS_ABSTAIN_ID)?.votingPowerAda || 0);
  if (knownIds.has(ALWAYS_NO_CONFIDENCE_ID)) regularDrepStakeAda -= Number(dreps.find((d) => d.id === ALWAYS_NO_CONFIDENCE_ID)?.votingPowerAda || 0);
  const alwaysAbstainPowerAda = Number(dreps.find((d) => d.id === ALWAYS_ABSTAIN_ID)?.votingPowerAda || 0);
  const alwaysNoConfidencePowerAda = Number(dreps.find((d) => d.id === ALWAYS_NO_CONFIDENCE_ID)?.votingPowerAda || 0);
  const totalActiveStakeAda = Math.max(regularDrepStakeAda, 0) + alwaysNoConfidencePowerAda;

  const drepPs = { yesPowerAda: 0, noPowerAda: 0, abstainActivePowerAda: 0, abstainAutoPowerAda: alwaysAbstainPowerAda };
  for (const drep of dreps) {
    const vp = Number(drep.votingPowerAda || 0);
    const vote = (drep.votes || []).find((v) => v.proposalId === proposalId);
    if (!vote) continue;
    const v = String(vote.vote || "").toLowerCase();
    if (v === "yes") drepPs.yesPowerAda += vp;
    else if (v === "no") drepPs.noPowerAda += vp;
    else if (v === "abstain") {
      if (autoAbstainIds.has(drep.id)) drepPs.abstainAutoPowerAda += vp;
      else drepPs.abstainActivePowerAda += vp;
    }
  }

  const govType = String(info?.governanceType || "").toLowerCase();
  const isNoConf = govType.includes("no confidence") || govType.includes("noconfidence");
  const isHardFork = govType.includes("hard fork") || govType.includes("hardfork");
  const yesTotalAda = isNoConf ? drepPs.yesPowerAda + alwaysNoConfidencePowerAda : drepPs.yesPowerAda;
  const noTotalAda = isNoConf ? drepPs.noPowerAda : drepPs.noPowerAda + alwaysNoConfidencePowerAda;

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

function VoteMixPie({ group, info }) {
  const { key, label, stats } = group;
  const isCommittee = key === "cc";
  const isSpo = key === "spo";
  const isDrep = key === "drep";
  const asActivePct = (value, base) => (base > 0 ? (Number(value || 0) / base) * 100 : 0);

  const drepActiveBaseAda = Number(info?.totalActiveStakeAda || 0);
  const drepYesAda = Number(info?.drepYesPowerAda || 0);
  const drepNoAda = Number(info?.drepNoPowerAda || 0);
  const drepAbstainAda = Number(info?.drepAbstainActivePowerAda || 0);
  const drepNotVotedAda = Math.max(drepActiveBaseAda - drepYesAda - drepNoAda - drepAbstainAda, 0);
  const drepOutcomeBaseAda = Math.max(drepActiveBaseAda - drepAbstainAda, 0);
  const drepYesPct = asActivePct(drepYesAda, drepOutcomeBaseAda);
  const drepNoPct = asActivePct(drepNoAda, drepOutcomeBaseAda);
  const drepAbstainPct = asActivePct(drepAbstainAda, drepActiveBaseAda);
  const drepNotVotedPct = asActivePct(drepNotVotedAda, drepOutcomeBaseAda);

  const spoYesAda = Number(info?.spoYesAda || 0);
  const spoNoWithNotVotedAda = Number(info?.spoNoAda || 0);
  const spoAbstainAda = Number(info?.spoAbstainAda || 0);
  const spoNotVotedAda = Number(info?.spoNotVotedAda || 0);
  const spoOutcomeTotalAda = Math.max(spoYesAda + spoNoWithNotVotedAda, 0);
  const spoYesPctDisplay = spoOutcomeTotalAda > 0 ? (spoYesAda / spoOutcomeTotalAda) * 100 : 0;
  const spoNoPctDisplay = spoOutcomeTotalAda > 0 ? (spoNoWithNotVotedAda / spoOutcomeTotalAda) * 100 : 0;

  const { yes, no, abstain, total } = voteSlices(stats);
  const ccCastCount = yes + no + abstain;
  const ccEligibleCount = Math.max(Number(info?.ccEligibleCount || 0), 0);
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

  const pieYesPct = isCommittee ? ccYesPct : (isDrep ? drepYesPct : (isSpo ? spoYesPctDisplay : defaultYesPct));
  const pieNoPct = isCommittee ? ccNoPct : (isDrep ? drepNoPct : (isSpo ? spoNoPctDisplay : defaultNoPct));
  const pieAbstainPct = isCommittee ? ccAbstainPct : (isDrep ? 0 : (isSpo ? 0 : defaultAbstainPct));
  const pieOtherPct = isCommittee ? ccNotVotedPct : (isDrep ? drepNotVotedPct : (isSpo ? 0 : defaultOtherPct));

  const thresholdPct = isDrep
    ? toFiniteOrNull(info?.drepRequiredPct)
    : (isSpo
      ? toFiniteOrNull(info?.thresholdInfo?.poolRequiredPct)
      : (isCommittee ? toFiniteOrNull(info?.thresholdInfo?.ccRequiredPct) : null));
  const thresholdAngle = thresholdPct !== null ? Math.max(0, Math.min(100, thresholdPct)) * 3.6 : null;

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
  const [voteRationaleLoading, setVoteRationaleLoading] = useState({});
  const [voteRationaleError, setVoteRationaleError] = useState({});
  const [roleFilter, setRoleFilter] = useState("all");
  const [voteFilter, setVoteFilter] = useState("all");
  const [rationaleFilter, setRationaleFilter] = useState("all");
  const [voteSearch, setVoteSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams();
        if (snapshotKey) params.set("snapshot", snapshotKey);
        params.set("view", "all");
        const res = await fetch(`${API_BASE}/api/accountability?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load proposal.");
        if (!cancelled) setPayload(data);

        const mRes = await fetch(`${API_BASE}/api/proposal-metadata?proposalId=${encodeURIComponent(decodedProposalId)}`);
        const mData = await mRes.json().catch(() => ({}));
        if (!cancelled && mRes.ok) setMetadata(mData);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load proposal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [decodedProposalId, snapshotKey]);

  const info = payload?.proposalInfo?.[decodedProposalId] || null;

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
          rows.push({
            role,
            voter: String(actor?.name || actor?.id || "Unknown"),
            voterId: String(actor?.id || ""),
            voterRole: role === "DRep" ? "drep" : role === "CC" ? "constitutional_committee" : "stake_pool",
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

  const voteGroups = eligibleVoteGroups(pieInfo);

  return (
    <main className="page shell stats-page">
      <section className="page-head">
        <p className="eyebrow">Proposal Detail</p>
        <h1>{info.actionName || decodedProposalId}</h1>
        <p className="mono">{decodedProposalId}</p>
        <p><Link className="inline-link" to={`/actions${snapshotKey ? `?snapshot=${encodeURIComponent(snapshotKey)}` : ""}`}>Back to actions</Link></p>
      </section>

      <section className="stats-section stats-section--wide">
        <h2 className="stats-section-title">Timeline</h2>
        <div className="stats-section-body meta">
          <p>Submitted epoch: <strong>{info.submittedEpoch || "-"}</strong></p>
          <p>Expiration epoch: <strong>{info.expirationEpoch || "-"}</strong></p>
          <p>Ratified epoch: <strong>{info.ratifiedEpoch || "-"}</strong></p>
          <p>Enacted epoch: <strong>{info.enactedEpoch || "-"}</strong></p>
          <p>Dropped epoch: <strong>{info.droppedEpoch || "-"}</strong></p>
          <p>Expired epoch: <strong>{info.expiredEpoch || "-"}</strong></p>
        </div>
      </section>

      <section className="stats-section stats-section--wide">
        <h2 className="stats-section-title">Votes</h2>
        {pieInfo?.thresholdInfo?.parameterGroup ? (
          <p className="muted">Parameter group: <strong>{pieInfo.thresholdInfo.parameterGroup}</strong></p>
        ) : null}
        <div className="action-vote-pies">
          {voteGroups.map((group) => (
            <VoteMixPie key={group.key} group={group} info={pieInfo} />
          ))}
          {voteGroups.length === 0 ? <p className="muted">No vote data available.</p> : null}
        </div>
      </section>

      <section className="stats-section stats-section--wide">
        <h2 className="stats-section-title">Governance Payload</h2>
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
          {payloadDoc.sections.length === 0 ? <p className="muted">No payload body sections available.</p> : null}
        </div>
      </section>

      <section className="stats-section stats-section--wide">
        <h2 className="stats-section-title">All Votes</h2>
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
                    <td colSpan={7} className="muted">
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
