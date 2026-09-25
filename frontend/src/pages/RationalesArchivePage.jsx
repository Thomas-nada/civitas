// The rationale archive: every fetchable vote rationale, committed as
// Markdown in the repository under rationales/<body>/<action>/<voter>.md.
// The file list comes from the GitHub tree, the vote metadata (dates, ids,
// transaction hashes) from the compact /api/v1/rationales/index.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { useRationalesIndex } from "../api/queries";
import { Alert, Button, Card, Chip, Input, PageHeader, RolePill, Select, Skeleton, StatGrid, StatTile, VotePill } from "../ui";
import { IconArrowLeft, IconSearch } from "../ui/icons";
import { formatDateTime } from "../lib/governance/format";

const REPO = "Thomas-nada/civitas";
const BRANCH = "main";
const TREE_URL = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/rationales`;
const CATEGORIES = ["DRep", "CC", "SPO"];
const ROLE_BY_CATEGORY = { DRep: "drep", CC: "constitutional_committee", SPO: "stake_pool" };
const INDEX_CACHE_KEY = "civitas.rationalesArchive.index.v3";
const CONTENT_CACHE_PREFIX = "civitas.rationalesArchive.file.";
const CACHE_TTL_MS = 60 * 60 * 1000;

function readCache(key) { try { const c = JSON.parse(window.localStorage.getItem(key) || "null"); return c && Date.now() - Number(c.ts || 0) <= CACHE_TTL_MS ? c.data ?? null : null; } catch { return null; } }
function writeCache(key, data) { try { window.localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch { /* full or blocked */ } }
const enc = (v) => encodeURIComponent(v).replace(/%2F/g, "/");
const norm = (v) => String(v || "").trim().toLowerCase().replace(/\s+/g, " ");
function parseVote(text) {
  const m = String(text || "").match(/\*{0,2}vote\*{0,2}\s*[:\-–]\s*(.+)/i);
  if (!m) return "Unknown";
  const raw = m[1].replace(/\*+/g, "").trim().toLowerCase();
  return raw.startsWith("yes") ? "Yes" : raw.startsWith("no") ? "No" : raw.includes("abstain") ? "Abstain" : m[1].replace(/\*+/g, "").trim() || "Unknown";
}
function parseVoterId(text) {
  const line = String(text || "").split("\n").find((l) => /voter\s*id|drep\s*id|spo\s*id|cc\s*id/i.test(l));
  const m = line && (line.match(/`([^`]{8,})`/) || line.match(/\b(drep1[a-z0-9]+|pool1[a-z0-9]+|cc_hot1[a-z0-9]+|[a-f0-9]{40,})\b/i));
  return m?.[1] || "";
}
function stripMetadata(text) {
  return String(text || "").split("\n").filter((line) => !/^\s*---+\s*$/.test(line) && !/^\s*#\s+/.test(line) && !/^\s*\*{0,2}(proposal|voter|vote|drep\s*id|spo\s*id|cc\s*id|id)\*{0,2}\s*[:\-–]/i.test(line) && !/^\s*`?[a-z]+1[a-z0-9]{30,}`?\s*$/i.test(line)).join("\n").trim();
}
function fileFromPath(path) {
  const parts = String(path || "").split("/");
  if (parts.length < 4 || parts[0] !== "rationales") return null;
  const [, category, action, ...rest] = parts;
  const file = rest.join("/");
  if (!CATEGORIES.includes(category) || !/\.md$/i.test(file) || file === "README.md") return null;
  return { category, action, file, voter: file.replace(/\.md$/i, ""), key: `${category}/${action}/${file}` };
}
function buildIndex(files) {
  const byAction = new Map(); const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])); const participants = new Set();
  for (const f of files) {
    counts[f.category] += 1; participants.add(`${f.category}|${norm(f.voter)}`);
    if (!byAction.has(f.action)) byAction.set(f.action, { action: f.action, files: [], counts: Object.fromEntries(CATEGORIES.map((c) => [c, 0])) });
    const a = byAction.get(f.action); a.files.push(f); a.counts[f.category] += 1;
  }
  const actions = [...byAction.values()].map((a) => ({ ...a, total: a.files.length, files: a.files.sort((x, y) => x.category.localeCompare(y.category) || x.voter.localeCompare(y.voter)) })).sort((a, b) => a.action.localeCompare(b.action));
  return { actions, counts, participantCount: participants.size };
}
async function fetchArchiveIndex(signal) {
  const cached = readCache(INDEX_CACHE_KEY);
  if (cached?.actions && Number(cached?.participantCount || 0) > 0) return cached;
  const res = await fetch(TREE_URL, { signal });
  if (!res.ok) throw new Error(`GitHub returned ${res.status} while loading the rationale archive.`);
  const data = await res.json();
  const archive = buildIndex((data?.tree || []).filter((e) => e?.type === "blob").map((e) => fileFromPath(e.path)).filter(Boolean));
  writeCache(INDEX_CACHE_KEY, archive);
  return archive;
}
async function fetchMarkdown(entry, signal) {
  const cacheKey = `${CONTENT_CACHE_PREFIX}${entry.key}`;
  const cached = readCache(cacheKey);
  if (cached) return cached;
  const res = await fetch(`${RAW_BASE}/${enc(entry.category)}/${enc(entry.action)}/${entry.file.split("/").map(enc).join("/")}`, { signal });
  if (!res.ok) throw new Error(`Could not load ${entry.file}.`);
  const raw = await res.text();
  const sourceUrl = (raw.match(/<!--\s*url:\s*(https?:\/\/\S+)\s*-->/) || [])[1] || "";
  let authorImageUrl = "";
  if (sourceUrl) {
    try {
      const doc = await (await fetch(sourceUrl, { signal })).json();
      for (const author of Array.isArray(doc?.authors) ? doc.authors : []) { const u = String(author?.imageUrl || author?.image || "").trim(); if (u) { authorImageUrl = /^ipfs:\/\//.test(u) ? `https://ipfs.blockfrost.dev/ipfs/${u.slice(7)}` : u; break; } }
    } catch { /* optional */ }
  }
  const data = { ...entry, raw, vote: parseVote(raw), voterId: parseVoterId(raw), body: stripMetadata(raw), sourceUrl, authorImageUrl };
  writeCache(cacheKey, data);
  return data;
}

export default function RationalesArchivePage() {
  useSeoMeta({ title: "Rationales Archive", description: "Browse DRep and SPO vote rationales on Cardano governance actions — searchable by proposal type, voter, and decision." });
  const [archive, setArchive] = useState(null);
  const [archiveError, setArchiveError] = useState("");
  const index = useRationalesIndex();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [listFilter, setListFilter] = useState("");
  const [voteFilter, setVoteFilter] = useState("All");
  const [sort, setSort] = useState("name");
  const [fileVotes, setFileVotes] = useState(new Map());
  const [reader, setReader] = useState({ key: "", loading: false, data: null, error: "" });
  const [mobilePane, setMobilePane] = useState("browse"); // browse | list | read
  const loadedRef = useRef(new Set());

  useEffect(() => {
    const controller = new AbortController();
    fetchArchiveIndex(controller.signal).then(setArchive).catch((e) => { if (e?.name !== "AbortError") setArchiveError(e?.message || "Failed to load the rationale archive."); });
    return () => controller.abort();
  }, []);

  // Vote metadata by (category, action name, voter name / id).
  const meta = useMemo(() => {
    const actionsByName = new Map(); const votesByName = new Map(); const votesById = new Map();
    for (const a of index.unpacked?.actions || []) if (a.actionName) actionsByName.set(norm(a.actionName), a);
    for (const v of index.unpacked?.votes || []) {
      const category = v.role === "drep" ? "DRep" : v.role === "constitutional_committee" ? "CC" : "SPO";
      const key = `${category}|${norm(v.actionName)}`;
      if (v.actorName) votesByName.set(`${key}|${norm(v.actorName)}`, v);
      for (const id of [v.actorId, v.hotCredential, v.koiosVoterId]) if (id) votesById.set(`${key}|${norm(id)}`, v);
    }
    return { actionsByName, votesByName, votesById };
  }, [index.unpacked]);

  const actions = useMemo(() => archive?.actions || [], [archive]);
  const visibleActions = useMemo(() => { const q = query.trim().toLowerCase(); return actions.filter((a) => (category === "All" || a.counts[category] > 0) && (!q || a.action.toLowerCase().includes(q))); }, [actions, query, category]);
  const matchingVoters = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const map = new Map();
    for (const a of actions) for (const f of a.files) {
      if ((category !== "All" && f.category !== category) || !f.voter.toLowerCase().includes(q)) continue;
      const k = norm(f.voter);
      if (!map.has(k)) map.set(k, { voter: f.voter, total: 0, counts: {} });
      const e = map.get(k); e.total += 1; e.counts[f.category] = (e.counts[f.category] || 0) + 1;
    }
    return [...map.values()].sort((a, b) => a.voter.localeCompare(b.voter));
  }, [query, actions, category]);
  const actionEntry = useMemo(() => (selectedVoter ? null : visibleActions.find((a) => a.action === selectedAction) || visibleActions[0] || null), [selectedVoter, selectedAction, visibleActions]);
  const withMeta = useCallback((f) => ({ ...f, actionMeta: meta.actionsByName.get(norm(f.action)) || null, voteMeta: meta.votesByName.get(`${f.category}|${norm(f.action)}|${norm(f.voter)}`) || null }), [meta]);
  const baseFiles = useMemo(() => {
    if (selectedVoter) { const q = norm(selectedVoter); return actions.flatMap((a) => a.files.filter((f) => norm(f.voter) === q && (category === "All" || f.category === category)).map(withMeta)); }
    return (actionEntry?.files || []).filter((f) => category === "All" || f.category === category).map(withMeta);
  }, [selectedVoter, actionEntry, actions, category, withMeta]);

  // Preload the vote line of each visible file so the list can show and filter by vote.
  useEffect(() => {
    const controller = new AbortController();
    for (const f of baseFiles) {
      if (loadedRef.current.has(f.key)) continue;
      loadedRef.current.add(f.key);
      fetchMarkdown(f, controller.signal).then((d) => { if (!controller.signal.aborted) setFileVotes((m) => new Map(m).set(d.key, d.vote)); }).catch(() => loadedRef.current.delete(f.key));
    }
    return () => controller.abort();
  }, [baseFiles]);

  const voteCounts = useMemo(() => {
    const q = listFilter.trim().toLowerCase();
    const base = q ? baseFiles.filter((f) => (selectedVoter ? f.action : f.voter).toLowerCase().includes(q)) : baseFiles;
    const counts = { All: base.length, Yes: 0, No: 0, Abstain: 0 };
    for (const f of base) { const v = fileVotes.get(f.key); if (counts[v] !== undefined) counts[v] += 1; }
    return counts;
  }, [baseFiles, listFilter, fileVotes, selectedVoter]);
  const displayFiles = useMemo(() => {
    const q = listFilter.trim().toLowerCase();
    let list = q ? baseFiles.filter((f) => (selectedVoter ? f.action : f.voter).toLowerCase().includes(q)) : baseFiles;
    if (voteFilter !== "All") list = list.filter((f) => fileVotes.get(f.key) === voteFilter);
    const order = { Yes: 0, No: 1, Abstain: 2 };
    const name = (f) => (selectedVoter ? f.action : f.voter);
    return [...list].sort((a, b) => sort === "vote" ? ((order[fileVotes.get(a.key)] ?? 3) - (order[fileVotes.get(b.key)] ?? 3)) || name(a).localeCompare(name(b)) : sort === "date" ? (b.voteMeta?.votedAtUnix || 0) - (a.voteMeta?.votedAtUnix || 0) : name(a).localeCompare(name(b)));
  }, [baseFiles, listFilter, voteFilter, sort, fileVotes, selectedVoter]);

  const open = useCallback(async (entry) => {
    if (!entry) return;
    setReader({ key: entry.key, loading: true, data: null, error: "" });
    setMobilePane("read");
    try {
      const data = await fetchMarkdown(entry);
      const byId = data.voterId ? meta.votesById.get(`${data.category}|${norm(data.action)}|${norm(data.voterId)}`) : null;
      setReader({ key: entry.key, loading: false, error: "", data: { ...data, actionMeta: entry.actionMeta || meta.actionsByName.get(norm(data.action)) || null, voteMeta: byId || entry.voteMeta || null } });
    } catch (e) {
      setReader({ key: entry.key, loading: false, data: null, error: e?.message || "Failed to load the rationale." });
    }
  }, [meta]);

  // The list controls and the reader follow the selected action or voter.
  const viewKey = `${selectedVoter || ""}|${actionEntry?.action || ""}|${category}`;
  const [lastViewKey, setLastViewKey] = useState(viewKey);
  if (viewKey !== lastViewKey) { setLastViewKey(viewKey); setListFilter(""); setVoteFilter("All"); setReader({ key: "", loading: false, data: null, error: "" }); }
  useEffect(() => { if (displayFiles.length && !reader.key) open(displayFiles[0]); }, [displayFiles, reader.key, open]);

  const loading = !archive && !archiveError;
  const participantCount = archive?.participantCount || 0;
  const r = reader.data;

  return (
    <main className={`shell page p-rat p-rat--${mobilePane}`}>
      <PageHeader eyebrow="Governance archive" title="Rationales" lead="Every fetchable rationale from DReps, Constitutional Committee members and SPOs. Some are missing because their IPFS links could not be fetched, timed out or no longer resolve." />
      <div className="stack">
        <StatGrid>
          <StatTile label="Governance actions" value={loading ? "…" : actions.length.toLocaleString()} />
          <StatTile label="Participants" value={loading ? "…" : participantCount.toLocaleString()} />
          {CATEGORIES.map((c) => <StatTile key={c} label={`${c} rationales`} value={loading ? "…" : (archive?.counts[c] || 0).toLocaleString()} />)}
        </StatGrid>
        <div className="c-toolbar">
          <div className="c-search c-toolbar__grow"><span className="c-search__icon"><IconSearch size={16} /></span><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by governance action or voter name…" aria-label="Search the archive" /></div>
          <div className="c-chips">{["All", ...CATEGORIES].map((c) => <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>)}</div>
        </div>
        {archiveError ? <Alert tone="danger">{archiveError}</Alert> : null}
        {loading ? <Skeleton kind="card" /> : (
          <div className="p-rat__layout">
            <Card className="p-rat__pane p-rat__browse" title={query.trim() ? "Results" : "Actions"} subtitle={`${visibleActions.length} action${visibleActions.length === 1 ? "" : "s"}${matchingVoters.length ? ` · ${matchingVoters.length} voter${matchingVoters.length === 1 ? "" : "s"}` : ""}`}>
              <div className="p-rat__list">
                {visibleActions.length > 0 && matchingVoters.length > 0 ? <div className="caps muted p-rat__group">Governance actions</div> : null}
                {visibleActions.map((a) => (
                  <button key={a.action} type="button" className={`p-rat__item${!selectedVoter && actionEntry?.action === a.action ? " is-active" : ""}`} onClick={() => { setSelectedVoter(null); setSelectedAction(a.action); setMobilePane("list"); }}>
                    <span>{a.action}</span><small>{CATEGORIES.filter((c) => a.counts[c] > 0).map((c) => `${c} ${a.counts[c]}`).join(" · ")}</small>
                  </button>
                ))}
                {matchingVoters.length > 0 ? <div className="caps muted p-rat__group">Voters</div> : null}
                {matchingVoters.map((v) => (
                  <button key={v.voter} type="button" className={`p-rat__item p-rat__item--voter${selectedVoter === v.voter ? " is-active" : ""}`} onClick={() => { setSelectedVoter(v.voter); setMobilePane("list"); }}>
                    <span>{v.voter}</span><small>{CATEGORIES.filter((c) => v.counts[c] > 0).map((c) => `${c} ${v.counts[c]}`).join(" · ")} · {v.total} rationale{v.total === 1 ? "" : "s"}</small>
                  </button>
                ))}
                {visibleActions.length === 0 && matchingVoters.length === 0 ? <p className="muted small">No matching actions or voters.</p> : null}
              </div>
            </Card>

            <Card className="p-rat__pane p-rat__files" title={<span className="row">{selectedVoter ? <Button size="sm" variant="ghost" icon={<IconArrowLeft size={14} />} aria-label="Back to actions" onClick={() => setSelectedVoter(null)} /> : <Button size="sm" variant="ghost" className="p-rat__mobile-back" icon={<IconArrowLeft size={14} />} aria-label="Back" onClick={() => setMobilePane("browse")} />}<span>{selectedVoter || actionEntry?.action || "Select a governance action"}</span></span>} subtitle={displayFiles.length !== baseFiles.length ? `${displayFiles.length} of ${baseFiles.length} rationales` : `${baseFiles.length} rationale${baseFiles.length === 1 ? "" : "s"}${selectedVoter ? ` across ${new Set(baseFiles.map((f) => f.action)).size} actions` : ""}`}>
              {baseFiles.length > 0 ? (
                <div className="stack--2" style={{ marginBottom: 10 }}>
                  <Input size="sm" type="search" value={listFilter} onChange={(e) => setListFilter(e.target.value)} placeholder={selectedVoter ? "Filter by action…" : "Filter voters…"} aria-label={selectedVoter ? "Filter by action" : "Filter voters"} />
                  <div className="row row--between">
                    <div className="c-chips">{["All", "Yes", "No", "Abstain"].map((v) => <Chip key={v} active={voteFilter === v} count={v === "All" ? undefined : voteCounts[v]} onClick={() => setVoteFilter(v)}>{v}</Chip>)}</div>
                    <Select size="sm" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort rationales"><option value="name">{selectedVoter ? "Action A–Z" : "Voter A–Z"}</option><option value="vote">By vote</option><option value="date">By date</option></Select>
                  </div>
                </div>
              ) : null}
              {baseFiles.length === 0 && !selectedVoter ? <p className="muted small">No fetchable rationale files are listed for this action and body.</p> : null}
              {baseFiles.length > 0 && displayFiles.length === 0 ? <p className="muted small">No rationales match the current filters.</p> : null}
              <div className="p-rat__list">
                {displayFiles.map((f) => {
                  const vote = fileVotes.get(f.key);
                  return (
                    <button type="button" key={f.key} className={`p-rat__item${reader.key === f.key ? " is-active" : ""}`} onClick={() => open(f)}>
                      <span className="row row--between" style={{ width: "100%" }}><span>{selectedVoter ? f.action : f.voter}</span>{vote && vote !== "Unknown" ? <VotePill vote={vote} size="sm" /> : null}</span>
                      <small>{f.category} · {f.voteMeta?.votedAtUnix ? formatDateTime(f.voteMeta.votedAtUnix) : "date unknown"}</small>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="p-rat__pane p-rat__reader">
              <Button size="sm" variant="ghost" className="p-rat__mobile-back" icon={<IconArrowLeft size={14} />} onClick={() => setMobilePane("list")}>Back to the list</Button>
              {reader.error ? <Alert tone="danger">{reader.error}</Alert> : reader.loading ? <Skeleton kind="text" count={8} /> : r ? (
                <div className="stack">
                  <div className="row row--between">
                    <div><div className="row" style={{ gap: 6 }}><RolePill role={ROLE_BY_CATEGORY[r.category]} size="sm" /><span className="caps muted">Rationale</span></div><h2 className="c-card__title" style={{ fontSize: "var(--text-lg)", marginTop: 4 }}>{r.voter}</h2><p className="small muted" style={{ margin: 0 }}>{r.actionMeta?.id ? <Link to={`/actions/${encodeURIComponent(r.actionMeta.id)}`}>{r.action}</Link> : r.action}</p></div>
                    <VotePill vote={r.vote} />
                  </div>
                  <div className="c-kv">
                    <dt>Governance action ID</dt><dd className="mono break">{r.actionMeta?.id || "Unknown"}</dd>
                    <dt>Action submitted</dt><dd>{formatDateTime(r.actionMeta?.submittedAt) || "Unknown"}</dd>
                    <dt>Rationale date</dt><dd>{formatDateTime(r.voteMeta?.votedAtUnix) || "Unknown"}</dd>
                    {r.voteMeta?.rationaleUrl ? <><dt>Source</dt><dd><a className="mono break" href={r.voteMeta.rationaleUrl} target="_blank" rel="noreferrer">{r.voteMeta.rationaleUrl}</a></dd></> : null}
                    {r.voteMeta?.actorId ? <><dt>Voter</dt><dd><Link className="mono break" to={`/${r.category === "DRep" ? "dreps" : r.category === "SPO" ? "spos" : "committee"}/${encodeURIComponent(r.voteMeta.actorId)}`}>{r.voteMeta.actorId}</Link></dd></> : null}
                  </div>
                  <div className="c-prose">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.body || r.raw || "No rationale body text available."}</ReactMarkdown>
                    {r.authorImageUrl ? <figure style={{ margin: "16px 0 0" }}><figcaption className="tiny muted">Signature</figcaption><img src={r.authorImageUrl} alt="Author signature" style={{ maxHeight: 120 }} /></figure> : null}
                  </div>
                  {r.sourceUrl ? <p className="tiny muted">Archived from <a className="mono break" href={r.sourceUrl} target="_blank" rel="noreferrer">{r.sourceUrl}</a></p> : null}
                </div>
              ) : <p className="muted small">Select a rationale to read the archived Markdown.</p>}
            </Card>
          </div>
        )}
        {index.error ? <p className="tiny muted">Vote metadata is unavailable: {index.error.message}</p> : null}
      </div>
    </main>
  );
}
