import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { useSnapshotKey, withSnapshotParam } from "../hooks/useSnapshotKey";
import { useEffectiveDrepId } from "../hooks/useEffectiveDrepId";
import { WalletContext } from "../context/WalletContext";
import { useActions, useActor, useSurveyLinks } from "../api/queries";
import { LivePill, SnapshotBanner } from "../components/LiveStatus";
import TesseraRespond from "../components/survey/TesseraRespond";
import {
  Alert, Button, Checkbox, Field, Input, Modal, PageHeader, Pill, Segmented, Select, Skeleton, StatGrid, StatTile, StatusPill, Textarea, Tooltip, DataTable
} from "../ui";
import { IconSearch } from "../ui/icons";
import { epochToDate, formatAdaCompact, formatCountdown, formatEpochDate, formatPct, round, shortHash, shortType } from "../lib/governance/format";

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "votes", label: "Most votes" },
  { value: "deposit", label: "Largest deposit" },
  { value: "name", label: "Name" }
];

function isDrepVoteEligibleAction(row) {
  return row?.status === "Active" && Boolean(row?.txHash);
}

/** Yes/No power bar with the required threshold marker. */
function VoteBarCell({ yesPct, noPct, thresholdPct, notEligible, ccMode, yesCount, noCount, ccElig }) {
  if (notEligible) return <span className="muted">N/A</span>;
  const safe = (v) => Math.max(0, Math.min(Number(v) || 0, 100));
  if (ccMode) {
    const den = ccElig > 0 ? ccElig : Math.max(yesCount + noCount, 1);
    const yPct = (yesCount / den) * 100;
    const nPct = (noCount / den) * 100;
    return (
      <div className="p-actions__bar">
        <div className="c-bar" role="img" aria-label={`Committee: ${yesCount} yes, ${noCount} no of ${den}`}>
          <span className="c-bar__seg c-bar__seg--yes" style={{ width: `${Math.min(yPct, 100)}%` }} />
          <span className="c-bar__seg c-bar__seg--no" style={{ width: `${Math.min(nPct, 100 - Math.min(yPct, 100))}%` }} />
          {thresholdPct > 0 ? <span className="c-bar__marker" style={{ left: `${Math.min(thresholdPct, 100)}%` }} /> : null}
        </div>
        <div className="p-actions__bar-text num">
          <span className="yes">Y {yesCount}</span>
          <span className="no">N {noCount}</span>
          {ccElig > 0 ? <span className="muted">/ {ccElig}</span> : null}
        </div>
      </div>
    );
  }
  return (
    <div className="p-actions__bar">
      <div className="c-bar" role="img" aria-label={`Yes ${round(safe(yesPct))}%, No ${round(safe(noPct))}%${thresholdPct > 0 ? `, threshold ${thresholdPct}%` : ""}`}>
        <span className="c-bar__seg c-bar__seg--yes" style={{ width: `${safe(yesPct)}%` }} />
        <span className="c-bar__seg c-bar__seg--no" style={{ width: `${Math.min(safe(noPct), 100 - safe(yesPct))}%` }} />
        {thresholdPct > 0 ? <span className="c-bar__marker" style={{ left: `${Math.min(thresholdPct, 100)}%` }} /> : null}
      </div>
      <div className="p-actions__bar-text num">
        <span className="yes">{formatPct(safe(yesPct), 1)}</span>
        {thresholdPct > 0 ? <span className="muted">/ {formatPct(thresholdPct, 0)}</span> : null}
      </div>
    </div>
  );
}

function ExpiryCountdown({ row, nowMs }) {
  if (!row?.isExpiringSoon || !row?.expirationEpoch) return null;
  const target = epochToDate(row.expirationEpoch);
  if (!target) return null;
  const remainingMs = target.getTime() - Number(nowMs || Date.now());
  return <Pill tone="warning" size="sm">{remainingMs <= 0 ? "expires now" : `expires in ${formatCountdown(remainingMs)}`}</Pill>;
}

export default function GovernanceActionsPage() {
  useSeoMeta({
    title: "Governance Actions",
    description: "All active and historical Cardano governance proposals — filter by type, status, and voting outcome. Track DRep, SPO, and CC votes in real time."
  });
  const navigate = useNavigate();
  const snapshotKey = useSnapshotKey();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const typeFilter = params.get("type") || "";
  const statusFilter = params.get("status") || "";
  const sortBy = params.get("sort") || "newest";
  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const actionsQuery = useActions(snapshotKey);
  const surveyLinksQuery = useSurveyLinks();
  const surveyLinks = surveyLinksQuery.data?.byAction || {};
  const meta = actionsQuery.data?.meta || null;
  const allRows = actionsQuery.data?.actions || [];

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  // Voting (DRep sessions only).
  const wallet = useContext(WalletContext);
  const effectiveDrepId = useEffectiveDrepId(wallet);
  const myDrep = useActor("drep", effectiveDrepId || "", snapshotKey);
  const votedProposalIds = useMemo(() => new Set((myDrep.data?.actor?.votes || []).map((v) => v.proposalId)), [myDrep.data]);
  const canVote = Boolean(wallet?.actingAsDrep);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows
      .filter((row) => !q || row.actionName.toLowerCase().includes(q) || row.proposalId.toLowerCase().includes(q) || String(row.txHash || "").toLowerCase().includes(q))
      .filter((row) => (typeFilter ? row.governanceType === typeFilter : true))
      .filter((row) => (statusFilter ? row.status === statusFilter : true))
      .sort((a, b) => {
        if (sortBy === "newest") return (b.submittedAtUnix || 0) - (a.submittedAtUnix || 0);
        if (sortBy === "oldest") return (a.submittedAtUnix || 0) - (b.submittedAtUnix || 0);
        if (sortBy === "votes") return b.totalVotes - a.totalVotes;
        if (sortBy === "deposit") return b.depositAda - a.depositAda;
        return a.actionName.localeCompare(b.actionName);
      });
  }, [allRows, query, typeFilter, statusFilter, sortBy]);

  const typeOptions = useMemo(() => Array.from(new Set(allRows.map((row) => row.governanceType))).sort(), [allRows]);
  const statusOptions = useMemo(() => Array.from(new Set(allRows.map((row) => row.status).filter(Boolean))).sort(), [allRows]);
  const activeCount = allRows.filter((row) => row.status === "Active").length;
  const enactedCount = allRows.filter((row) => row.status === "Enacted").length;
  const expiringSoonCount = allRows.filter((row) => row.isExpiringSoon).length;

  // ── Batch voting state ───────────────────────────────────────────────────
  const [batchVoteIds, setBatchVoteIds] = useState({});
  const [batchVoteDrafts, setBatchVoteDrafts] = useState({});
  const [batchVoteModalOpen, setBatchVoteModalOpen] = useState(false);
  const [batchVoteStep, setBatchVoteStep] = useState(0);
  const [batchVoteMdPreview, setBatchVoteMdPreview] = useState(false);
  const [proposalSurveys, setProposalSurveys] = useState({});
  const [surveysLoading, setSurveysLoading] = useState(false);
  const [surveyLoadError, setSurveyLoadError] = useState("");
  const [batchSurveyRecords, setBatchSurveyRecords] = useState({});
  const [batchResponder, setBatchResponder] = useState(null);
  const [voteSubmitting, setVoteSubmitting] = useState(false);
  const [voteNotice, setVoteNotice] = useState("");
  const [voteError, setVoteError] = useState("");
  const [votedTxHash, setVotedTxHash] = useState("");
  const [voteSyncStatus, setVoteSyncStatus] = useState("");
  const voteSyncPollRef = useRef(null);
  useEffect(() => () => { if (voteSyncPollRef.current) clearInterval(voteSyncPollRef.current); }, []);

  function toggleBatchVoteSelection(row) {
    if (!isDrepVoteEligibleAction(row)) return;
    setBatchVoteIds((prev) => {
      const next = { ...prev };
      if (next[row.proposalId]) {
        delete next[row.proposalId];
        setBatchVoteDrafts((drafts) => { const d = { ...drafts }; delete d[row.proposalId]; return d; });
      } else {
        next[row.proposalId] = true;
        setBatchVoteDrafts((drafts) => ({ ...drafts, [row.proposalId]: drafts[row.proposalId] || { choice: "", rationaleUrl: "" } }));
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
    for (const row of rows) if (isDrepVoteEligibleAction(row)) next[row.proposalId] = true;
    setBatchVoteIds(next);
    setBatchVoteDrafts((prev) => {
      const drafts = {};
      for (const proposalId of Object.keys(next)) drafts[proposalId] = prev[proposalId] || { choice: "", rationaleUrl: "" };
      return drafts;
    });
  }
  function updateBatchVoteDraft(proposalId, patch) {
    setBatchVoteDrafts((prev) => ({
      ...prev,
      [proposalId]: { choice: "", rationaleMode: "url", rationaleUrl: "", rationaleText: "", ...(prev[proposalId] || {}), ...patch }
    }));
  }

  const selectedBatchVoteRows = useMemo(() => rows.filter((row) => batchVoteIds[row.proposalId] && isDrepVoteEligibleAction(row)), [rows, batchVoteIds]);
  const batchVoteCount = selectedBatchVoteRows.length;
  const selectedBatchProposalKey = selectedBatchVoteRows.map((row) => row.proposalId).sort().join("|");

  // Drop selections that stopped being eligible (status changed).
  useEffect(() => {
    setBatchVoteIds((prev) => {
      const entries = Object.entries(prev);
      if (!entries.length) return prev;
      const eligibleIds = new Set(rows.filter(isDrepVoteEligibleAction).map((row) => row.proposalId));
      const next = {};
      let changed = false;
      for (const [proposalId, on] of entries) {
        if (on && eligibleIds.has(proposalId)) next[proposalId] = true; else changed = true;
      }
      if (changed) setBatchVoteDrafts((drafts) => Object.fromEntries(Object.keys(next).filter((id) => drafts[id]).map((id) => [id, drafts[id]])));
      return changed ? next : prev;
    });
  }, [rows]);

  // Linked CIP-179 surveys for the selected actions.
  useEffect(() => {
    if (!selectedBatchProposalKey) { setProposalSurveys({}); setSurveyLoadError(""); return undefined; }
    let cancelled = false;
    setSurveysLoading(true);
    setSurveyLoadError("");
    Promise.all(selectedBatchVoteRows.map(async (row) => {
      const response = await fetch(`/api/proposal-survey?proposalId=${encodeURIComponent(row.proposalId)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Failed to resolve a linked survey.");
      return [row.proposalId, payload];
    }))
      .then((entries) => { if (!cancelled) setProposalSurveys(Object.fromEntries(entries)); })
      .catch((error) => { if (!cancelled) setSurveyLoadError(error?.message || "Failed to resolve linked surveys."); })
      .finally(() => { if (!cancelled) setSurveysLoading(false); });
    return () => { cancelled = true; };
  }, [selectedBatchProposalKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const pending = Object.values(proposalSurveys).filter((link) => link?.available && link.survey?.record && !batchSurveyRecords[link.surveyRef]);
    if (!pending.length) return undefined;
    let cancelled = false;
    import("cip-179/tally")
      .then(({ decodeSurveyRecord }) => {
        if (cancelled) return;
        const next = {};
        for (const link of pending) {
          try { next[link.surveyRef] = decodeSurveyRecord(link.survey.record); } catch { /* no form for it */ }
        }
        setBatchSurveyRecords((prev) => ({ ...prev, ...next }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [proposalSurveys]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!batchVoteModalOpen || !wallet?.walletApi || !wallet?.actingAsDrep) { setBatchResponder(null); return undefined; }
    let cancelled = false;
    import("../services/surveyTxService")
      .then(({ responderCredentials, Role }) => responderCredentials(wallet.walletApi, { includeDrep: true, drepPubKeyHex: wallet?.walletDrep?.pubDRepKey || "" }).then(({ responder }) => {
        if (cancelled) return;
        setBatchResponder(responder[Role.DRep] ? { [Role.DRep]: responder[Role.DRep] } : null);
      }))
      .catch(() => { if (!cancelled) setBatchResponder(null); });
    return () => { cancelled = true; };
  }, [batchVoteModalOpen, wallet?.walletApi, wallet?.actingAsDrep, wallet?.walletDrep?.pubDRepKey]);

  const batchSurveyAnswerCount = selectedBatchVoteRows.filter((row) => batchVoteDrafts[row.proposalId]?.surveyAnswer).length;
  const batchVoteReadyCount = selectedBatchVoteRows.filter((row) => batchVoteDrafts[row.proposalId]?.choice).length;
  const batchVoteReady = batchVoteCount > 0 && batchVoteReadyCount === batchVoteCount && !surveysLoading;

  function resolveIpfsUrl(url) {
    return typeof url === "string" && url.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${url.slice(7)}` : url;
  }
  async function uploadRationale(text) {
    setVoteNotice("Uploading rationale to IPFS…");
    const res = await fetch("/api/upload-rationale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comment: text }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "IPFS upload failed.");
    setVoteNotice("");
    return { anchorUrl: data.ipfsUrl, anchorDataHash: data.contentHash };
  }
  async function buildVoteAnchor(rawUrl) {
    const url = String(rawUrl || "").trim();
    const resolved = resolveIpfsUrl(url);
    if (!resolved) return undefined;
    try {
      setVoteNotice("Fetching rationale to compute anchor hash…");
      const [res, blakejs] = await Promise.all([fetch(resolved), import("blakejs")]);
      const text = await res.text();
      const hashHex = blakejs.blake2bHex(new TextEncoder().encode(text), null, 32);
      setVoteNotice("");
      return { anchorUrl: url || resolved, anchorDataHash: hashHex };
    } catch {
      setVoteNotice("Could not fetch rationale URL: voting without anchor.");
      return undefined;
    }
  }
  function startVoteSyncPolling(snapshotAtSubmit) {
    let attempts = 0;
    setVoteSyncStatus("polling");
    if (voteSyncPollRef.current) clearInterval(voteSyncPollRef.current);
    voteSyncPollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const res = await fetch("/api/sync-status");
        if (res.ok) {
          const status = await res.json();
          const latest = String(status?.lastCompletedAt || "");
          if (latest && latest !== snapshotAtSubmit) {
            setVoteSyncStatus("synced");
            clearInterval(voteSyncPollRef.current);
            voteSyncPollRef.current = null;
            return;
          }
        }
      } catch { /* ignore */ }
      if (attempts >= 15) {
        setVoteSyncStatus("timeout");
        clearInterval(voteSyncPollRef.current);
        voteSyncPollRef.current = null;
      }
    }, 20_000);
  }

  async function submitBatchVote() {
    const rowsToVote = selectedBatchVoteRows.map((row) => ({ row, draft: batchVoteDrafts[row.proposalId] || { choice: "", rationaleUrl: "" } }));
    if (!rowsToVote.length || !wallet?.walletApi || !canVote || rowsToVote.some((item) => !item.draft.choice)) return;
    try {
      setVoteSubmitting(true);
      setBatchVoteModalOpen(false);
      setVoteError("");
      setVoteNotice("");
      setVotedTxHash("");
      setVoteSyncStatus("");
      const drepIdCip105 = wallet.walletDrep.dRepIDCip105;
      if (wallet.walletNetworkId !== 1) setVoteNotice("Warning: wallet is on testnet. Proceeding anyway…");
      const surveyAnswers = rowsToVote.map(({ draft }) => draft.surveyAnswer).filter(Boolean);
      setVoteNotice(`Building transaction with ${rowsToVote.length} vote${rowsToVote.length === 1 ? "" : "s"}${surveyAnswers.length ? ` and ${surveyAnswers.length} survey ${surveyAnswers.length === 1 ? "answer" : "answers"}` : ""}…`);
      const { Transaction } = await import("@meshsdk/core");
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
      if (surveyAnswers.length) {
        // One label-17 payload holds every answer: a CIP-179 responses payload is
        // [tag, [response, ...]]; each form emits one with a single response.
        const merged = [surveyAnswers[0].payload[0], surveyAnswers.flatMap((answer) => answer.payload[1])];
        tx.setMetadata(17, merged);
      }
      const unsignedTx = await tx.build();
      setVoteNotice("Please sign the transaction in your wallet…");
      const signedTx = await wallet.walletApi.signTx(unsignedTx, true, true);
      setVoteNotice("Submitting to chain…");
      const txHash = await wallet.walletApi.submitTx(signedTx);
      setVotedTxHash(txHash);
      setVoteNotice("");
      setBatchVoteIds({});
      setBatchVoteDrafts({});
      startVoteSyncPolling(String(meta?.sync?.lastCompletedAt || meta?.generatedAt || ""));
    } catch (e) {
      setVoteError(e?.message || "Vote transaction failed.");
      setVoteNotice("");
    } finally {
      setVoteSubmitting(false);
    }
  }

  const columns = useMemo(() => {
    const cols = [];
    if (canVote) {
      cols.push({
        key: "select", label: "Vote", compact: true, hideLabel: false,
        render: (row) => (
          <Checkbox
            checked={Boolean(batchVoteIds[row.proposalId])}
            disabled={!isDrepVoteEligibleAction(row) || voteSubmitting}
            onChange={() => toggleBatchVoteSelection(row)}
            label={<span className="sr-only">Select {row.actionName} for DRep vote</span>}
          />
        )
      });
    }
    cols.push(
      {
        key: "action", label: "Action", span: true,
        render: (row) => {
          const link = surveyLinks[row.proposalId]?.[0];
          return (
            <div className="p-actions__title">
              <Link to={withSnapshotParam(`/actions/${encodeURIComponent(row.proposalId)}`, snapshotKey)} className="c-table__row-link p-actions__name">{row.actionName}</Link>
              <div className="p-actions__meta">
                <span className="c-hash">{shortHash(row.proposalId, 10)}</span>
                {row.depositAda > 0 ? <Pill size="sm" tone="neutral" title="Deposit">{formatAdaCompact(row.depositAda)}</Pill> : null}
                {row.withdrawalAmountAda ? <Pill size="sm" tone="info" title="Treasury withdrawal">{formatAdaCompact(row.withdrawalAmountAda)} withdrawal</Pill> : null}
                <ExpiryCountdown row={row} nowMs={nowMs} />
                {link ? <Pill size="sm" tone={link.lifecycle === "open" ? "accent" : "neutral"} title={`Linked CIP-179 survey: ${link.title || "untitled"} (${link.lifecycleLabel})`}>Survey{link.lifecycle === "open" ? " open" : ""}</Pill> : null}
                {votedProposalIds.has(row.proposalId) ? <Pill size="sm" tone="success" title="Your DRep has voted on this action">✓ Voted</Pill> : null}
              </div>
            </div>
          );
        }
      },
      { key: "type", label: "Type", compact: true, render: (row) => <span className="small">{shortType(row.governanceType)}</span> },
      { key: "status", label: "Status", compact: true, render: (row) => <StatusPill status={row.status} size="sm" /> },
      {
        key: "drep", label: "DReps",
        render: (row) => {
          const isInfo = String(row.governanceType || "").toLowerCase().includes("info");
          return <VoteBarCell yesPct={row.drepYesPowerPct} noPct={row.drepNoPowerPct} thresholdPct={row.drepRequiredPct} notEligible={!isInfo && !row.drepRequiredPct && !row.voteStats?.drep?.total} />;
        }
      },
      {
        key: "spo", label: "SPOs",
        render: (row) => {
          const isInfo = String(row.governanceType || "").toLowerCase().includes("info");
          const notEligible = !isInfo && row.spoRequiredPct === null && row.spoYesAda === 0 && row.spoNoAda === 0;
          return <VoteBarCell yesPct={row.spoYesPct} noPct={row.spoNoPct} thresholdPct={row.spoRequiredPct} notEligible={notEligible} />;
        }
      },
      {
        key: "cc", label: "Committee",
        render: (row) => {
          const cc = row.voteStats?.constitutional_committee || {};
          const isInfo = String(row.governanceType || "").toLowerCase().includes("info");
          const notEligible = !isInfo && row.ccRequiredPct === null && Number(cc.yes || 0) === 0 && Number(cc.no || 0) === 0;
          return <VoteBarCell ccMode yesCount={Number(cc.yes || 0)} noCount={Number(cc.no || 0)} ccElig={row.ccEligibleCount} thresholdPct={row.ccRequiredPct} notEligible={notEligible} />;
        }
      },
      {
        key: "expires", label: "Expires", compact: true,
        render: (row) => row.expirationEpoch ? (
          <span className="small">
            {formatEpochDate(row.expirationEpoch)}
            <span className="c-table__sub">Epoch {row.expirationEpoch}</span>
          </span>
        ) : <span className="muted">—</span>
      }
    );
    return cols;
  }, [canVote, batchVoteIds, voteSubmitting, surveyLinks, votedProposalIds, nowMs, snapshotKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const loading = actionsQuery.isLoading;
  const error = actionsQuery.error?.message || "";

  return (
    <main className="shell page p-actions">
      <PageHeader
        eyebrow={<><span>Governance</span>{meta?.latestEpoch ? <span className="muted">· epoch {meta.latestEpoch}</span> : null}</>}
        title="Governance actions"
        lead="Every proposal on the Cardano ledger with its DRep, SPO and Constitutional Committee votes against the thresholds it needs to pass."
        actions={<LivePill enabled={!snapshotKey} generatedAt={meta?.generatedAt} />}
      />
      <SnapshotBanner snapshotKey={snapshotKey} latestEpoch={meta?.latestEpoch} backTo="/actions" />

      <StatGrid>
        <StatTile label="Total actions" value={loading ? <Skeleton width={60} /> : allRows.length} />
        <StatTile label="Active" value={loading ? <Skeleton width={40} /> : activeCount} tone="accent" hint="Open for voting" />
        <StatTile label="Enacted" value={loading ? <Skeleton width={40} /> : enactedCount} />
        <StatTile label="Expiring soon" value={loading ? <Skeleton width={40} /> : expiringSoonCount} tone={expiringSoonCount ? "warning" : undefined} hint="Within one epoch" />
      </StatGrid>

      <div className="c-toolbar p-actions__toolbar">
        <div className="c-search c-toolbar__grow">
          <span className="c-search__icon"><IconSearch size={16} /></span>
          <Input value={query} onChange={(e) => setParam("q", e.target.value)} placeholder="Search by name, action id or tx hash" aria-label="Search governance actions" />
        </div>
        <Select value={typeFilter} onChange={(e) => setParam("type", e.target.value)} aria-label="Governance type">
          <option value="">All types</option>
          {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(e) => setParam("status", e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={sortBy} onChange={(e) => setParam("sort", e.target.value)} aria-label="Sort">
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
      </div>

      {canVote ? (
        <div className="c-card c-card--soft p-actions__batch" aria-label="DRep voting controls">
          <div className="p-actions__batch-summary">
            <strong className="num">{batchVoteCount}</strong>
            <span>{batchVoteCount === 1 ? "action selected" : "actions selected"}</span>
            {batchVoteCount ? <span className="muted">· {batchVoteReadyCount}/{batchVoteCount} ready</span> : null}
            {batchSurveyAnswerCount ? <span className="muted">· {batchSurveyAnswerCount} survey {batchSurveyAnswerCount === 1 ? "answer" : "answers"} attached</span> : null}
          </div>
          <div className="row">
            <Button size="sm" onClick={selectVisibleDrepActions}>Select visible</Button>
            <Button size="sm" onClick={clearBatchVoteSelection} disabled={!batchVoteCount}>Clear</Button>
            <Button size="sm" variant="primary" disabled={!batchVoteCount || voteSubmitting} onClick={() => { setVoteError(""); setVoteNotice(""); setVotedTxHash(""); setBatchVoteStep(0); setBatchVoteMdPreview(false); setBatchVoteModalOpen(true); }}>
              Review {batchVoteCount === 1 ? "vote" : "votes"}
            </Button>
          </div>
        </div>
      ) : null}

      {(voteSubmitting || voteNotice || voteError || votedTxHash) ? (
        <div className="stack--2 p-actions__vote-status">
          {voteSubmitting && !voteNotice ? <Alert tone="info">Submitting vote…</Alert> : null}
          {voteNotice ? <Alert tone="info">{voteNotice}</Alert> : null}
          {voteError ? <Alert tone="danger">{voteError}</Alert> : null}
          {votedTxHash ? (
            <Alert tone="success" title="Vote submitted.">
              <a href={`https://cardanoscan.io/transaction/${votedTxHash}`} target="_blank" rel="noreferrer" className="mono">{votedTxHash.slice(0, 16)}…</a>
              {voteSyncStatus === "polling" ? " Waiting for Civitas to index…" : null}
              {voteSyncStatus === "synced" ? " Civitas has indexed this vote." : null}
              {voteSyncStatus === "timeout" ? " Civitas indexing check timed out; the vote is on-chain regardless." : null}
            </Alert>
          ) : null}
        </div>
      ) : null}

      {error ? <Alert tone="danger" title="Could not load governance actions.">{error}</Alert> : null}

      {loading ? (
        <div className="stack--2"><Skeleton kind="row" count={8} /></div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.proposalId}
          onRowClick={(row) => navigate(withSnapshotParam(`/actions/${encodeURIComponent(row.proposalId)}`, snapshotKey))}
          emptyMessage="No governance actions match these filters."
          caption="Governance actions"
          className="p-actions__table"
        />
      )}
      <p className="small muted" style={{ marginTop: 12 }}>
        Showing {rows.length} of {allRows.length} actions. Bars show yes/no voting power against the threshold marker; committee shows member counts.
      </p>

      {batchVoteModalOpen && canVote && selectedBatchVoteRows.length ? (() => {
        const total = selectedBatchVoteRows.length;
        const stepIdx = Math.min(batchVoteStep, total - 1);
        const row = selectedBatchVoteRows[stepIdx];
        const draft = batchVoteDrafts[row.proposalId] || {};
        const rationaleMode = draft.rationaleMode ?? "url";
        const linked = proposalSurveys[row.proposalId];
        const firstLinkedRow = linked?.surveyRef ? selectedBatchVoteRows.find((item) => proposalSurveys[item.proposalId]?.surveyRef === linked.surveyRef) : null;
        const showLinkedEditor = linked?.available && firstLinkedRow?.proposalId === row.proposalId;
        return (
          <Modal
            open
            size="lg"
            onClose={() => setBatchVoteModalOpen(false)}
            title={total === 1 ? "Confirm vote" : `Vote ${stepIdx + 1} of ${total}`}
            footer={(
              <div className="row row--between" style={{ width: "100%" }}>
                <div className="row">
                  <Button size="sm" onClick={() => { setBatchVoteStep(stepIdx - 1); setBatchVoteMdPreview(false); }} disabled={stepIdx === 0}>← Previous</Button>
                  <Button size="sm" onClick={() => { setBatchVoteStep(stepIdx + 1); setBatchVoteMdPreview(false); }} disabled={stepIdx === total - 1}>Next →</Button>
                  <span className="small muted num">{batchVoteReadyCount}/{total} ready</span>
                </div>
                <div className="row">
                  <Button onClick={() => setBatchVoteModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" onClick={submitBatchVote} disabled={voteSubmitting || !batchVoteReady}>
                    Submit {total === 1 ? "vote" : `${total} votes`} on-chain
                  </Button>
                </div>
              </div>
            )}
          >
            <div className="stack">
              <p className="small muted">Voting as DRep <span className="mono">{wallet.walletDrep.dRepIDCip105}</span></p>
              <div>
                <strong>{row.actionName}</strong>
                <div className="c-hash">{shortHash(row.proposalId, 12)}</div>
              </div>
              <div className="row" role="group" aria-label={`Vote choice for ${row.actionName}`}>
                {["Yes", "No", "Abstain"].map((choice) => (
                  <Button
                    key={choice}
                    variant={draft.choice === choice ? (choice === "Yes" ? "primary" : choice === "No" ? "danger" : "soft") : "outline"}
                    aria-pressed={draft.choice === choice}
                    onClick={() => updateBatchVoteDraft(row.proposalId, { choice })}
                  >
                    {choice}
                  </Button>
                ))}
              </div>
              <Segmented
                ariaLabel="Rationale"
                value={rationaleMode}
                onChange={(mode) => { updateBatchVoteDraft(row.proposalId, { rationaleMode: mode }); setBatchVoteMdPreview(false); }}
                options={[{ value: "url", label: "Provide URL" }, { value: "write", label: "Write rationale" }]}
              />
              {rationaleMode === "url" ? (
                <Field label="Rationale URL (optional, CIP-100 / IPFS)">{(id) => (
                  <Input id={id} type="url" value={draft.rationaleUrl || ""} onChange={(e) => updateBatchVoteDraft(row.proposalId, { rationaleUrl: e.target.value })} placeholder="https://your-rationale.json or ipfs://Qm…" />
                )}</Field>
              ) : (
                <div className="stack--2">
                  <div className="row row--between">
                    <Segmented ariaLabel="Editor mode" value={batchVoteMdPreview ? "preview" : "write"} onChange={(m) => setBatchVoteMdPreview(m === "preview")} options={[{ value: "write", label: "Write" }, { value: "preview", label: "Preview" }]} />
                    <span className="tiny muted">Markdown supported · uploaded to IPFS as CIP-100 JSON</span>
                  </div>
                  {batchVoteMdPreview ? (
                    <div className="c-card c-card--soft c-card--pad c-prose">
                      {draft.rationaleText?.trim() ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.rationaleText}</ReactMarkdown> : <p className="muted">Nothing to preview yet.</p>}
                    </div>
                  ) : (
                    <Textarea value={draft.rationaleText || ""} onChange={(e) => updateBatchVoteDraft(row.proposalId, { rationaleText: e.target.value })} placeholder="Write your rationale here… (Markdown supported)" rows={10} autoFocus />
                  )}
                </div>
              )}

              {surveysLoading ? <p className="small muted">Checking this action for a CIP-179 survey…</p> : null}
              {surveyLoadError ? <Alert tone="warning">Linked survey lookup failed. You can still submit the governance vote.</Alert> : null}
              {linked?.linked && !linked.available ? <Alert tone="warning">Linked survey unavailable: {linked.problem}</Alert> : null}
              {linked?.available && !showLinkedEditor ? <p className="small muted">This action links the same survey shown with {firstLinkedRow?.actionName}.</p> : null}
              {showLinkedEditor ? (() => {
                const surveyOpen = linked.survey.lifecycle === "open";
                const record = batchSurveyRecords[linked.surveyRef];
                const attached = draft.surveyAnswer;
                return (
                  <section className="c-card c-card--pad c-card--accent stack--2">
                    <div className="row row--between">
                      <div>
                        <div className="caps">CIP-179 survey linked to this action</div>
                        <h4>{linked.survey.title || "Untitled survey"}</h4>
                        {linked.survey.description ? <p className="small muted">{linked.survey.description}</p> : null}
                      </div>
                      <Button size="sm" to={`/surveys/${linked.survey.txHash}/${linked.survey.index}`} onClick={() => setBatchVoteModalOpen(false)}>Open survey</Button>
                    </div>
                    <p className="tiny muted">
                      A survey answer is separate from your vote: it is survey metadata, not a governance vote, and it neither replaces nor implies one. Answered here, it rides in the same transaction as this batch of votes, as a DRep answer.
                    </p>
                    {attached ? (
                      <Alert tone="success">
                        Answer attached to this batch{attached.answered != null ? ` (${attached.answered} ${attached.answered === 1 ? "question" : "questions"} answered)` : ""}. It goes on chain when you submit the votes.{" "}
                        <button type="button" className="c-btn c-btn--sm c-btn--ghost" onClick={() => updateBatchVoteDraft(row.proposalId, { surveyAnswer: null })}>Remove</button>
                      </Alert>
                    ) : !surveyOpen ? (
                      <p className="small muted">This survey is {String(linked.survey.lifecycleLabel || linked.survey.lifecycle).toLowerCase()}; it no longer accepts answers.</p>
                    ) : !batchResponder ? (
                      <p className="small muted">Reading the DRep credential…</p>
                    ) : !record ? (
                      <p className="small muted">Loading the survey form…</p>
                    ) : (
                      <div>
                        <p className="small muted">Fill in the survey and press its <strong>Sign &amp; submit</strong>: in a batch that only attaches the answer here. Nothing is signed until you submit the votes.</p>
                        <TesseraRespond
                          definition={record.definition}
                          surveyRef={record.ref}
                          responder={batchResponder}
                          tipEpoch={linked.currentEpoch}
                          cancelled={false}
                          onResponse={(result) => {
                            const answered = Array.isArray(result?.payload?.[1]?.[0]?.[4]) ? result.payload[1][0][4].length : null;
                            updateBatchVoteDraft(row.proposalId, { surveyAnswer: { payload: result.payload, surveyRef: linked.surveyRef, answered } });
                          }}
                          onError={(e) => setVoteError(e?.message || "The survey form reported an error.")}
                        />
                      </div>
                    )}
                  </section>
                );
              })() : null}
              {wallet.walletNetworkId !== 1 ? <Alert tone="warning">Wallet is on testnet: the vote will be submitted to testnet.</Alert> : null}
              <Tooltip label="About voting">Votes are built as one transaction and signed by your wallet with the DRep key. Rationale anchors are hashed with BLAKE2b-256.</Tooltip>
            </div>
          </Modal>
        );
      })() : null}
    </main>
  );
}
