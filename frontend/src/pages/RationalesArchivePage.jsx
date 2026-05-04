import { useCallback, useEffect, useMemo, useState } from "react";
import { useSeoMeta } from "../hooks/useSeoMeta";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const REPO = "Thomas-nada/civitas";
const BRANCH = "main";
const TREE_URL = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/rationales`;
const CATEGORIES = ["DRep", "CC", "SPO"];
const INDEX_CACHE_KEY = "civitas.rationalesArchive.index.v3";
const CONTENT_CACHE_PREFIX = "civitas.rationalesArchive.file.";
const CACHE_TTL_MS = 60 * 60 * 1000;

function readCache(key) {
  try {
    const cached = window.localStorage.getItem(key);
    if (!cached) return null;
    const payload = JSON.parse(cached);
    if (!payload || Date.now() - Number(payload.ts || 0) > CACHE_TTL_MS) return null;
    return payload.data ?? null;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Best-effort browser cache.
  }
}

function encodePathPart(value) {
  return encodeURIComponent(value).replace(/%2F/g, "/");
}

function cleanFileName(fileName) {
  return String(fileName || "").replace(/\.md$/i, "");
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function formatDateTime(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function parseVote(text) {
  const match = String(text || "").match(/\*{0,2}vote\*{0,2}\s*[:\-\u2013]\s*(.+)/i);
  if (!match) return "Unknown";
  const raw = match[1].replace(/\*+/g, "").trim().toLowerCase();
  if (raw.startsWith("yes")) return "Yes";
  if (raw.startsWith("no")) return "No";
  if (raw.includes("abstain")) return "Abstain";
  return match[1].replace(/\*+/g, "").trim() || "Unknown";
}

function parseVoterId(text) {
  const idLine = String(text || "").split("\n").find((line) => /voter\s*id|drep\s*id|spo\s*id|cc\s*id/i.test(line));
  if (!idLine) return "";
  const match = idLine.match(/`([^`]{8,})`/) || idLine.match(/\b(drep1[a-z0-9]+|pool1[a-z0-9]+|cc_hot1[a-z0-9]+|[a-f0-9]{40,})\b/i);
  return match?.[1] || "";
}

function stripArchiveMetadata(text) {
  const lines = String(text || "").split("\n");
  const body = [];
  for (const line of lines) {
    if (/^\s*---+\s*$/.test(line)) continue;
    if (/^\s*#\s+/.test(line)) continue;
    if (/^\s*\*{0,2}(proposal|voter|vote|drep\s*id|spo\s*id|cc\s*id|id)\*{0,2}\s*[:\-\u2013]/i.test(line)) continue;
    if (/^\s*`?[a-z]+1[a-z0-9]{30,}`?\s*$/i.test(line)) continue;
    body.push(line);
  }
  return body.join("\n").trim();
}

function fileFromTreePath(path) {
  const parts = String(path || "").split("/");
  if (parts.length < 4 || parts[0] !== "rationales") return null;
  const category = parts[1];
  const action = parts[2];
  const fileParts = parts.slice(3);
  const file = fileParts.join("/");
  if (!CATEGORIES.includes(category) || !/\.md$/i.test(file) || file === "README.md") return null;
  const voter = cleanFileName(file);
  return {
    category,
    action,
    file,
    voter,
    key: `${category}/${action}/${file}`
  };
}

function buildArchiveIndex(files) {
  const actionMap = new Map();
  const counts = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));
  const participantKeys = new Set();

  for (const file of files) {
    counts[file.category] += 1;
    participantKeys.add(`${file.category}|${normalizeKey(file.voter)}`);
    if (!actionMap.has(file.action)) {
      actionMap.set(file.action, {
        action: file.action,
        files: [],
        counts: Object.fromEntries(CATEGORIES.map((category) => [category, 0]))
      });
    }
    const action = actionMap.get(file.action);
    action.files.push(file);
    action.counts[file.category] += 1;
  }

  const actions = Array.from(actionMap.values())
    .map((action) => ({
      ...action,
      total: action.files.length,
      files: action.files.sort((a, b) => a.category.localeCompare(b.category) || a.voter.localeCompare(b.voter))
    }))
    .sort((a, b) => a.action.localeCompare(b.action));

  return { actions, counts, participantCount: participantKeys.size };
}

async function fetchArchiveIndex(signal) {
  const cached = readCache(INDEX_CACHE_KEY);
  if (cached?.actions && cached?.counts && Number(cached?.participantCount || 0) > 0) return cached;

  const res = await fetch(TREE_URL, { signal });
  if (!res.ok) throw new Error(`GitHub returned ${res.status} while loading the rationale archive.`);
  const data = await res.json();
  const files = (Array.isArray(data?.tree) ? data.tree : [])
    .filter((entry) => entry?.type === "blob")
    .map((entry) => fileFromTreePath(entry.path))
    .filter(Boolean);
  const archive = buildArchiveIndex(files);
  writeCache(INDEX_CACHE_KEY, archive);
  return archive;
}

async function fetchMarkdown(entry, signal) {
  const cacheKey = `${CONTENT_CACHE_PREFIX}${entry.category}/${entry.action}/${entry.file}`;
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const url = `${RAW_BASE}/${encodePathPart(entry.category)}/${encodePathPart(entry.action)}/${entry.file.split("/").map(encodePathPart).join("/")}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Could not load ${entry.file}.`);
  const raw = await res.text();
  const data = {
    ...entry,
    raw,
    vote: parseVote(raw),
    voterId: parseVoterId(raw),
    body: stripArchiveMetadata(raw)
  };
  writeCache(cacheKey, data);
  return data;
}

export default function RationalesArchivePage() {
  useSeoMeta({
    title: "Rationales Archive",
    description: "Browse DRep and SPO vote rationales on Cardano governance actions — searchable by proposal type, voter, and decision."
  });
  const [archive, setArchive] = useState({ actions: [], counts: Object.fromEntries(CATEGORIES.map((category) => [category, 0])) });
  const [metadata, setMetadata] = useState({ actionsByName: new Map(), votesByName: new Map(), votesById: new Map() });
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedAction, setSelectedAction] = useState("");
  const [query, setQuery] = useState("");
  const [selectedFileKey, setSelectedFileKey] = useState("");
  const [selectedRationale, setSelectedRationale] = useState(null);
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [loadingRationale, setLoadingRationale] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadIndex() {
      setLoadingIndex(true);
      setError("");
      try {
        const next = await fetchArchiveIndex(controller.signal);
        if (!cancelled) setArchive(next);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load rationale archive.");
      } finally {
        if (!cancelled) setLoadingIndex(false);
      }
    }

    loadIndex();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMetadata() {
      setLoadingMetadata(true);
      try {
        const res = await fetch("/api/accountability?view=all");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load governance metadata.");

        const actionsByName = new Map();
        for (const [proposalId, info] of Object.entries(data?.proposalInfo || {})) {
          const actionName = String(info?.actionName || "").trim();
          if (!actionName) continue;
          actionsByName.set(normalizeKey(actionName), {
            proposalId,
            actionName,
            governanceType: info?.governanceType || "",
            submittedAt: info?.submittedAt || null,
            txHash: info?.txHash || "",
            certIndex: info?.certIndex ?? null
          });
        }

        const votesByName = new Map();
        const votesById = new Map();
        const addRows = (rows, category) => {
          for (const row of Array.isArray(rows) ? rows : []) {
            const voterName = String(row?.name || "").trim();
            const voterId = String(row?.id || row?.hotCredential || row?.koiosVoterId || "").trim();
            for (const vote of Array.isArray(row?.votes) ? row.votes : []) {
              const proposal = data?.proposalInfo?.[vote?.proposalId];
              const actionName = String(proposal?.actionName || "").trim();
              if (!actionName) continue;
              const meta = {
                category,
                voterName,
                voterId,
                proposalId: vote?.proposalId || "",
                actionName,
                voteTxHash: vote?.voteTxHash || "",
                rationaleUrl: vote?.rationaleUrl || "",
                votedAt: vote?.votedAt || null,
                votedAtUnix: vote?.votedAtUnix || null,
                responseHours: vote?.responseHours ?? null
              };
              if (voterName) votesByName.set(`${category}|${normalizeKey(actionName)}|${normalizeKey(voterName)}`, meta);
              if (voterId) votesById.set(`${category}|${normalizeKey(actionName)}|${normalizeKey(voterId)}`, meta);
            }
          }
        };

        addRows(data?.dreps, "DRep");
        addRows(data?.committeeMembers, "CC");
        addRows(data?.spos, "SPO");

        if (!cancelled) setMetadata({ actionsByName, votesByName, votesById });
      } catch {
        if (!cancelled) setMetadata({ actionsByName: new Map(), votesByName: new Map(), votesById: new Map() });
      } finally {
        if (!cancelled) setLoadingMetadata(false);
      }
    }

    loadMetadata();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return archive.actions.filter((action) => {
      if (selectedCategory !== "All" && (action.counts[selectedCategory] || 0) === 0) return false;
      if (!q) return true;
      return action.action.toLowerCase().includes(q);
    });
  }, [archive.actions, query, selectedCategory]);

  const selectedActionEntry = useMemo(() => {
    if (!selectedAction) return visibleActions[0] || null;
    return visibleActions.find((item) => item.action === selectedAction) || visibleActions[0] || null;
  }, [selectedAction, visibleActions]);

  const files = useMemo(() => {
    const action = selectedActionEntry;
    if (!action) return [];
    const actionMeta = metadata.actionsByName.get(normalizeKey(action.action)) || null;
    return action.files
      .filter((file) => selectedCategory === "All" || file.category === selectedCategory)
      .map((file) => ({
        ...file,
        actionMeta,
        voteMeta: metadata.votesByName.get(`${file.category}|${normalizeKey(file.action)}|${normalizeKey(file.voter)}`) || null
      }));
  }, [metadata, selectedActionEntry, selectedCategory]);

  const uniqueParticipantCount = useMemo(() => {
    if (Number(archive.participantCount || 0) > 0) return Number(archive.participantCount || 0);
    const participantKeys = new Set();
    for (const action of archive.actions) {
      for (const file of Array.isArray(action.files) ? action.files : []) {
        participantKeys.add(`${file.category}|${normalizeKey(file.voter)}`);
      }
    }
    return participantKeys.size;
  }, [archive]);

  const selectRationale = useCallback(async (entry) => {
    if (!entry) return;
    const controller = new AbortController();
    setSelectedFileKey(entry.key);
    setLoadingRationale(true);
    setFileError("");
    try {
      const data = await fetchMarkdown(entry, controller.signal);
      const idVoteMeta = data.voterId
        ? metadata.votesById.get(`${data.category}|${normalizeKey(data.action)}|${normalizeKey(data.voterId)}`)
        : null;
      setSelectedRationale({
        ...data,
        actionMeta: entry.actionMeta || metadata.actionsByName.get(normalizeKey(data.action)) || null,
        voteMeta: idVoteMeta || entry.voteMeta || null
      });
    } catch (e) {
      setFileError(e?.message || "Failed to load rationale.");
      setSelectedRationale(null);
    } finally {
      setLoadingRationale(false);
    }
  }, [metadata]);

  useEffect(() => {
    setSelectedRationale(null);
    setSelectedFileKey("");
    setFileError("");
  }, [selectedActionEntry?.action, selectedCategory]);

  useEffect(() => {
    if (!files.length || selectedFileKey) return;
    selectRationale(files[0]);
  }, [files, selectRationale, selectedFileKey]);

  return (
    <main className="shell rationales-archive-page">
      <header className="hero">
        <p className="eyebrow">Governance Archive</p>
        <h1>Rationales</h1>
        <p className="muted">
          This archive contains all fetchable rationales for Cardano governance bodies: DReps, Constitutional Committee members,
          and SPOs. Some rationales are missing because their IPFS links could not be fetched, timed out, or no longer resolved.
        </p>
      </header>

      <section className="cards rationales-archive-stats" aria-label="Rationale archive summary">
        <article className="card">
          <p>Governance Actions</p>
          <strong>{loadingIndex ? "..." : archive.actions.length.toLocaleString()}</strong>
        </article>
        <article className="card">
          <p>Unique Participants</p>
          <strong>{loadingIndex ? "..." : uniqueParticipantCount.toLocaleString()}</strong>
        </article>
        {CATEGORIES.map((category) => (
          <article className="card" key={category}>
            <p>{category} Rationales</p>
            <strong>{loadingIndex ? "..." : (archive.counts[category] || 0).toLocaleString()}</strong>
          </article>
        ))}
      </section>

      <section className="controls rationales-archive-controls">
        <label>
          Search archive
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search governance actions..." />
        </label>
        <label>
          Governance body
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="All">All bodies</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          Governance action
          <select value={selectedActionEntry?.action || ""} onChange={(e) => setSelectedAction(e.target.value)}>
            {visibleActions.length === 0 ? <option value="">No matching actions</option> : null}
            {visibleActions.map((entry) => (
              <option key={entry.action} value={entry.action}>
                {entry.action}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="status-row">
        <p className="muted">
          {loadingIndex || loadingMetadata
            ? "Loading rationale archive..."
            : error || `${visibleActions.length.toLocaleString()} governance actions in this view; ${files.length.toLocaleString()} rationales for the selected action.`}
        </p>
      </section>

      <section className="rationales-archive-layout">
        <aside className="panel rationales-archive-list" aria-label="Rationale files">
          <div className="rationales-archive-list-head">
            <h2>{selectedCategory === "All" ? "All Bodies" : selectedCategory}</h2>
            <p className="muted">{selectedActionEntry?.action || "Select a governance action."}</p>
          </div>

          {files.length === 0 ? <p className="muted">No fetchable rationale files are listed for this action and body.</p> : null}
          <div className="rationales-archive-file-list">
            {files.map((file) => (
              <button
                type="button"
                key={file.key}
                className={`rationales-archive-file${selectedFileKey === file.key ? " active" : ""}`}
                onClick={() => selectRationale(file)}
              >
                <span>{file.voter}</span>
                <small>{file.category} | {file.voteMeta?.votedAt ? formatDateTime(file.voteMeta.votedAt) : file.actionMeta?.proposalId || "metadata pending"}</small>
              </button>
            ))}
          </div>
        </aside>

        <article className="panel rationales-archive-reader">
          {fileError ? <p className="muted">{fileError}</p> : null}
          {loadingRationale ? <p className="muted">Loading rationale...</p> : null}
          {!loadingRationale && selectedRationale ? (
            <>
              <div className="rationales-archive-reader-head">
                <div>
                  <p className="eyebrow">{selectedRationale.category} Rationale</p>
                  <h2>{selectedRationale.voter}</h2>
                  <p className="muted">{selectedRationale.action}</p>
                </div>
                <span className="pill mid">{selectedRationale.vote}</span>
              </div>
              <dl className="rationales-archive-meta">
                <div>
                  <dt>Governance Action ID</dt>
                  <dd>{selectedRationale.actionMeta?.proposalId || "Unknown"}</dd>
                </div>
                <div>
                  <dt>Action Submitted</dt>
                  <dd>{formatDateTime(selectedRationale.actionMeta?.submittedAt)}</dd>
                </div>
                <div>
                  <dt>Rationale Date</dt>
                  <dd>{formatDateTime(selectedRationale.voteMeta?.votedAt)}</dd>
                </div>
                <div>
                  <dt>Vote Transaction</dt>
                  <dd>{selectedRationale.voteMeta?.voteTxHash || "Unknown"}</dd>
                </div>
              </dl>
              <div className="payload-markdown rationales-archive-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedRationale.body || selectedRationale.raw || "No rationale body text available."}
                </ReactMarkdown>
              </div>
            </>
          ) : null}
          {!loadingRationale && !selectedRationale && !fileError ? (
            <p className="muted">Select a rationale to read the archived Markdown.</p>
          ) : null}
        </article>
      </section>
    </main>
  );
}
