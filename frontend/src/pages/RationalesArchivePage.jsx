import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  } catch {}
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

function parseIpfsSourceUrl(raw) {
  const match = String(raw || "").match(/<!--\s*url:\s*(https?:\/\/\S+)\s*-->/);
  return match?.[1]?.trim() || "";
}

function resolveIpfsGateway(url) {
  if (!url) return "";
  if (/^ipfs:\/\//.test(url)) return `https://ipfs.blockfrost.dev/ipfs/${url.slice(7)}`;
  return url;
}

function parseVote(text) {
  const match = String(text || "").match(/\*{0,2}vote\*{0,2}\s*[:\-–]\s*(.+)/i);
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
    if (/^\s*\*{0,2}(proposal|voter|vote|drep\s*id|spo\s*id|cc\s*id|id)\*{0,2}\s*[:\-–]/i.test(line)) continue;
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
  return { category, action, file, voter, key: `${category}/${action}/${file}` };
}

function buildArchiveIndex(files) {
  const actionMap = new Map();
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  const participantKeys = new Set();

  for (const file of files) {
    counts[file.category] += 1;
    participantKeys.add(`${file.category}|${normalizeKey(file.voter)}`);
    if (!actionMap.has(file.action)) {
      actionMap.set(file.action, {
        action: file.action,
        files: [],
        counts: Object.fromEntries(CATEGORIES.map((c) => [c, 0]))
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

  // Fetch the IPFS source document to extract the author signature image
  const ipfsUrl = parseIpfsSourceUrl(raw);
  let authorImageUrl = "";
  if (ipfsUrl) {
    try {
      const ipfsRes = await fetch(ipfsUrl, { signal });
      if (ipfsRes.ok) {
        const json = await ipfsRes.json();
        for (const author of (Array.isArray(json?.authors) ? json.authors : [])) {
          const rawUrl = String(author?.imageUrl || author?.image || "").trim();
          if (rawUrl) { authorImageUrl = resolveIpfsGateway(rawUrl); break; }
        }
      }
    } catch {}
  }

  const data = {
    ...entry,
    raw,
    vote: parseVote(raw),
    voterId: parseVoterId(raw),
    body: stripArchiveMetadata(raw),
    ipfsUrl,
    authorImageUrl,
  };
  writeCache(cacheKey, data);
  return data;
}

function votePillClass(vote) {
  if (vote === "Yes") return "good";
  if (vote === "No") return "low";
  return "mid";
}

export default function RationalesArchivePage() {
  useSeoMeta({
    title: "Rationales Archive",
    description: "Browse DRep and SPO vote rationales on Cardano governance actions — searchable by proposal type, voter, and decision."
  });

  const [archive, setArchive] = useState({ actions: [], counts: Object.fromEntries(CATEGORIES.map((c) => [c, 0])) });
  const [metadata, setMetadata] = useState({ actionsByName: new Map(), votesByName: new Map(), votesById: new Map() });
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedVoter, setSelectedVoter] = useState(null); // voter name string, null = action mode
  const [query, setQuery] = useState("");
  const [selectedFileKey, setSelectedFileKey] = useState("");
  const [selectedRationale, setSelectedRationale] = useState(null);
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [loadingRationale, setLoadingRationale] = useState(false);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");

  // Shared filter/sort state for both action mode and voter mode
  const [listFilter, setListFilter] = useState(""); // voter name in action mode, action name in voter mode
  const [voteFilter, setVoteFilter] = useState("All");
  const [fileSort, setFileSort] = useState("name");
  const [fileVotes, setFileVotes] = useState(new Map());
  const loadedVoteKeysRef = useRef(new Set());
  const preloadControllerRef = useRef(null);

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
    return () => { cancelled = true; controller.abort(); };
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
            proposalId, actionName,
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
                category, voterName, voterId,
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
    return () => { cancelled = true; };
  }, []);

  // Actions filtered by search query + category
  const visibleActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return archive.actions.filter((action) => {
      if (selectedCategory !== "All" && (action.counts[selectedCategory] || 0) === 0) return false;
      if (!q) return true;
      return action.action.toLowerCase().includes(q);
    });
  }, [archive.actions, query, selectedCategory]);

  // Voters matching the search query
  const matchingVoters = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const voterMap = new Map();
    for (const action of archive.actions) {
      for (const file of action.files) {
        if (selectedCategory !== "All" && file.category !== selectedCategory) continue;
        if (!file.voter.toLowerCase().includes(q)) continue;
        const key = normalizeKey(file.voter);
        if (!voterMap.has(key)) voterMap.set(key, { voter: file.voter, total: 0, counts: {} });
        const entry = voterMap.get(key);
        entry.total++;
        entry.counts[file.category] = (entry.counts[file.category] || 0) + 1;
      }
    }
    return Array.from(voterMap.values()).sort((a, b) => a.voter.localeCompare(b.voter));
  }, [query, archive.actions, selectedCategory]);

  const selectedActionEntry = useMemo(() => {
    if (selectedVoter) return null;
    if (!selectedAction) return visibleActions[0] || null;
    return visibleActions.find((item) => item.action === selectedAction) || visibleActions[0] || null;
  }, [selectedVoter, selectedAction, visibleActions]);

  // Files for the selected action (action mode)
  const actionFiles = useMemo(() => {
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

  // Files for the selected voter across all actions (voter mode)
  const voterFiles = useMemo(() => {
    if (!selectedVoter) return [];
    const q = normalizeKey(selectedVoter);
    const results = [];
    for (const action of archive.actions) {
      for (const file of action.files) {
        if (normalizeKey(file.voter) !== q) continue;
        if (selectedCategory !== "All" && file.category !== selectedCategory) continue;
        const actionMeta = metadata.actionsByName.get(normalizeKey(action.action)) || null;
        const voteMeta = metadata.votesByName.get(`${file.category}|${normalizeKey(file.action)}|${normalizeKey(file.voter)}`) || null;
        results.push({ ...file, actionMeta, voteMeta });
      }
    }
    return results;
  }, [selectedVoter, archive.actions, metadata, selectedCategory]);

  const baseFiles = selectedVoter ? voterFiles : actionFiles;

  // Pre-load votes for the current view
  useEffect(() => {
    const filesToLoad = selectedVoter ? voterFiles : (selectedActionEntry?.files || []);
    if (!filesToLoad.length) return;

    preloadControllerRef.current?.abort();
    const controller = new AbortController();
    preloadControllerRef.current = controller;

    for (const file of filesToLoad) {
      if (loadedVoteKeysRef.current.has(file.key)) continue;
      loadedVoteKeysRef.current.add(file.key);
      fetchMarkdown(file, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) {
            setFileVotes((prev) => { const m = new Map(prev); m.set(data.key, data.vote); return m; });
          }
        })
        .catch(() => { loadedVoteKeysRef.current.delete(file.key); });
    }
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVoter, selectedActionEntry?.action]);

  // Reset list controls when the view changes
  useEffect(() => {
    setListFilter("");
    setVoteFilter("All");
  }, [selectedVoter, selectedActionEntry?.action, selectedCategory]);

  // Vote counts (respects list filter but not vote filter — for chip labels)
  const voteCounts = useMemo(() => {
    const q = listFilter.trim().toLowerCase();
    let base = baseFiles;
    if (q) {
      base = selectedVoter
        ? base.filter((f) => f.action.toLowerCase().includes(q))
        : base.filter((f) => f.voter.toLowerCase().includes(q));
    }
    const counts = { All: base.length, Yes: 0, No: 0, Abstain: 0 };
    for (const f of base) {
      const vote = fileVotes.get(f.key);
      if (vote === "Yes") counts.Yes++;
      else if (vote === "No") counts.No++;
      else if (vote === "Abstain") counts.Abstain++;
    }
    return counts;
  }, [baseFiles, listFilter, fileVotes, selectedVoter]);

  // Filtered + sorted files for the middle panel
  const displayFiles = useMemo(() => {
    const q = listFilter.trim().toLowerCase();
    let result = baseFiles;

    if (q) {
      result = selectedVoter
        ? result.filter((f) => f.action.toLowerCase().includes(q))
        : result.filter((f) => f.voter.toLowerCase().includes(q));
    }
    if (voteFilter !== "All") result = result.filter((f) => fileVotes.get(f.key) === voteFilter);

    const voteOrder = { Yes: 0, No: 1, Abstain: 2 };
    return [...result].sort((a, b) => {
      if (fileSort === "vote") {
        const va = voteOrder[fileVotes.get(a.key)] ?? 3;
        const vb = voteOrder[fileVotes.get(b.key)] ?? 3;
        return va - vb || (selectedVoter ? a.action.localeCompare(b.action) : a.voter.localeCompare(b.voter));
      }
      if (fileSort === "date") return (b.voteMeta?.votedAtUnix || 0) - (a.voteMeta?.votedAtUnix || 0);
      return selectedVoter ? a.action.localeCompare(b.action) : a.voter.localeCompare(b.voter);
    });
  }, [baseFiles, listFilter, voteFilter, fileSort, fileVotes, selectedVoter]);

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

  // Clear reader when the view changes
  useEffect(() => {
    setSelectedRationale(null);
    setSelectedFileKey("");
    setFileError("");
  }, [selectedVoter, selectedActionEntry?.action, selectedCategory]);

  // Auto-select first item when the list changes
  useEffect(() => {
    if (!displayFiles.length || selectedFileKey) return;
    selectRationale(displayFiles[0]);
  }, [displayFiles, selectRationale, selectedFileKey]);

  const voterActionCount = useMemo(
    () => new Set(voterFiles.map((f) => f.action)).size,
    [voterFiles]
  );

  const showSectionLabels = visibleActions.length > 0 && matchingVoters.length > 0;

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
          Search
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by governance action or voter name..."
          />
        </label>
        <div className="rationales-archive-category-pills">
          <span>Governance body</span>
          <div className="rationales-archive-pill-group">
            {["All", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`rationales-archive-cat-pill${selectedCategory === cat ? " active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="status-row">
        <p className="muted">
          {loadingIndex || loadingMetadata
            ? "Loading rationale archive..."
            : error || (() => {
                if (selectedVoter) return `Showing ${displayFiles.length} rationale${displayFiles.length !== 1 ? "s" : ""} by ${selectedVoter}`;
                return `${visibleActions.length.toLocaleString()} governance actions · ${displayFiles.length.toLocaleString()} rationales shown`;
              })()}
        </p>
      </section>

      <section className="rationales-archive-layout">
        {/* Actions + Voters panel */}
        <aside className="panel rationales-archive-actions" aria-label="Governance actions and voters">
          <div className="rationales-archive-actions-head">
            <h2>{query.trim() ? "Results" : "Actions"}</h2>
            <p className="muted">
              {loadingIndex ? "Loading..." : `${visibleActions.length} action${visibleActions.length !== 1 ? "s" : ""}${matchingVoters.length ? ` · ${matchingVoters.length} voter${matchingVoters.length !== 1 ? "s" : ""}` : ""}`}
            </p>
          </div>

          <div className="rationales-archive-action-list">
            {/* Governance actions section */}
            {visibleActions.length > 0 && (
              <>
                {showSectionLabels && (
                  <p className="rationales-archive-results-label">
                    Governance Actions <span>{visibleActions.length}</span>
                  </p>
                )}
                {visibleActions.map((entry) => (
                  <button
                    key={entry.action}
                    type="button"
                    className={`rationales-archive-action-item${!selectedVoter && selectedActionEntry?.action === entry.action ? " active" : ""}`}
                    onClick={() => {
                      setSelectedVoter(null);
                      setSelectedAction(entry.action);
                    }}
                  >
                    <span>{entry.action}</span>
                    <small>
                      {CATEGORIES.filter((cat) => (entry.counts[cat] || 0) > 0)
                        .map((cat) => `${cat} ${entry.counts[cat]}`)
                        .join(" · ")}
                    </small>
                  </button>
                ))}
              </>
            )}

            {/* Voters section */}
            {matchingVoters.length > 0 && (
              <>
                {showSectionLabels && (
                  <p className="rationales-archive-results-label rationales-archive-results-label--voter">
                    Voters <span>{matchingVoters.length}</span>
                  </p>
                )}
                {matchingVoters.map((v) => (
                  <button
                    key={v.voter}
                    type="button"
                    className={`rationales-archive-action-item rationales-archive-action-item--voter${selectedVoter === v.voter ? " active" : ""}`}
                    onClick={() => {
                      setSelectedVoter(v.voter);
                      setSelectedRationale(null);
                      setSelectedFileKey("");
                    }}
                  >
                    <span>{v.voter}</span>
                    <small>
                      {CATEGORIES.filter((cat) => (v.counts[cat] || 0) > 0)
                        .map((cat) => `${cat} ${v.counts[cat]}`)
                        .join(" · ")}
                      {" · "}
                      {v.total} rationale{v.total !== 1 ? "s" : ""}
                    </small>
                  </button>
                ))}
              </>
            )}

            {visibleActions.length === 0 && matchingVoters.length === 0 && !loadingIndex && (
              <p className="muted">No matching actions or voters.</p>
            )}
          </div>
        </aside>

        {/* Rationales list panel */}
        <aside className="panel rationales-archive-list" aria-label="Rationale files">
          <div className="rationales-archive-list-head">
            {selectedVoter ? (
              <>
                <div className="rationales-archive-voter-head">
                  <button
                    type="button"
                    className="rationales-archive-back-btn"
                    onClick={() => setSelectedVoter(null)}
                    title="Back to actions"
                  >
                    ←
                  </button>
                  <div>
                    <h2>{selectedVoter}</h2>
                    <p className="muted">
                      {displayFiles.length !== voterFiles.length
                        ? `${displayFiles.length} of ${voterFiles.length} rationales`
                        : `${voterFiles.length} rationale${voterFiles.length !== 1 ? "s" : ""} across ${voterActionCount} action${voterActionCount !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2>{selectedActionEntry?.action || "Select a governance action."}</h2>
                <p className="muted">
                  {displayFiles.length !== actionFiles.length
                    ? `${displayFiles.length} of ${actionFiles.length} rationales`
                    : `${actionFiles.length} rationale${actionFiles.length !== 1 ? "s" : ""}`}
                </p>
              </>
            )}
          </div>

          {baseFiles.length > 0 && (
            <div className="rationales-archive-list-controls">
              <input
                type="search"
                placeholder={selectedVoter ? "Filter by action..." : "Search voters..."}
                value={listFilter}
                onChange={(e) => setListFilter(e.target.value)}
                aria-label={selectedVoter ? "Filter by action" : "Search voters"}
              />
              <div className="rationales-archive-vote-chips">
                {["All", "Yes", "No", "Abstain"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`rationales-archive-vote-chip vote-${v.toLowerCase()}${voteFilter === v ? " active" : ""}`}
                    onClick={() => setVoteFilter(v)}
                    title={v === "All" ? `All ${voteCounts.All} rationales` : `${voteCounts[v]} voted ${v}`}
                  >
                    {v}
                    {v !== "All" && voteCounts[v] > 0
                      ? <span className="vote-chip-count">{voteCounts[v]}</span>
                      : null}
                  </button>
                ))}
              </div>
              <select
                value={fileSort}
                onChange={(e) => setFileSort(e.target.value)}
                aria-label="Sort rationales"
                className="rationales-archive-sort-select"
              >
                <option value="name">{selectedVoter ? "Action A–Z" : "Voter A–Z"}</option>
                <option value="vote">By vote</option>
                <option value="date">By date</option>
              </select>
            </div>
          )}

          {baseFiles.length === 0 && !selectedVoter && (
            <p className="muted">No fetchable rationale files are listed for this action and body.</p>
          )}
          {baseFiles.length > 0 && displayFiles.length === 0 && (
            <p className="muted">No rationales match the current filters.</p>
          )}

          <div className="rationales-archive-file-list">
            {displayFiles.map((file) => {
              const vote = fileVotes.get(file.key);
              return (
                <button
                  type="button"
                  key={file.key}
                  className={`rationales-archive-file${selectedFileKey === file.key ? " active" : ""}`}
                  onClick={() => selectRationale(file)}
                >
                  <div className="rationales-archive-file-row">
                    <span>{selectedVoter ? file.action : file.voter}</span>
                    {vote && vote !== "Unknown"
                      ? <span className={`pill ${votePillClass(vote)}`}>{vote}</span>
                      : null}
                  </div>
                  <small>
                    {file.category}
                    {" · "}
                    {file.voteMeta?.votedAt
                      ? formatDateTime(file.voteMeta.votedAt)
                      : file.actionMeta?.proposalId || "metadata pending"}
                  </small>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Reader panel */}
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
                <span className={`pill ${votePillClass(selectedRationale.vote)}`}>{selectedRationale.vote}</span>
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
                {selectedRationale.authorImageUrl ? (
                  <div className="rationale-author-image">
                    <p className="muted" style={{ fontSize: "0.8rem", marginBottom: "0.4rem" }}>Signature</p>
                    <img
                      src={selectedRationale.authorImageUrl}
                      alt="Author signature"
                      className="rationale-signature-img"
                    />
                  </div>
                ) : null}
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
