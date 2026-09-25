// Live DRep vote tracker for one treasury withdrawal: on-chain votes plus the
// Ekklesia ballot as a prediction, editable per DRep to model outcomes.
// Replaces the separate Intersect and Blockfrost pages; the track list says
// which proposals are followed.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { fetchJson } from "../api/client";
import RationaleModal from "../components/RationaleModal";
import { Alert, Button, Card, Chip, DataTable, Input, PageHeader, Pill, Segmented, Skeleton, StatGrid, StatTile } from "../ui";
import { IconDownload, IconRefresh, IconSearch } from "../ui/icons";
import { formatAdaCompact, formatPct } from "../lib/governance/format";

const TRACKS = {
  intersect: { key: "intersect", label: "Intersect", title: "Intersect: governance coordination & technical stewardship", subtitle: "Treasury withdrawal · 25,400,000 ADA", govActionId: "gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8sgx6wlxf" },
  tsc: { key: "tsc", label: "Intersect TSC", title: "Intersect Technical Steering Committee support", subtitle: "Treasury withdrawal · 1,193,000 ADA", govActionId: "gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8sxypfkyr" },
  blockfrost: { key: "blockfrost", label: "Blockfrost", title: "Blockfrost: open-source infrastructure", subtitle: "Treasury withdrawal", govActionId: "gov_action12sumv9qky4pkenmqp7gshv9nxqdk9zyn8gkd77fewkyy3t5tnxtsq457vgq" }
};
const THRESHOLD = 0.67;
const REFRESH_MS = 2 * 60 * 1000;
const VOTE_CYCLE = ["Yes", "No", "Abstain", ""];
const STORAGE_KEY = "civitas_pred_intersect";
const FILTERS = ["All", "Yes", "No", "Abstain", "Not voted", "Voted on-chain", "Ekklesia only", "Mismatch"];
const nextVote = (v) => VOTE_CYCLE[(VOTE_CYCLE.indexOf(v) + 1) % VOTE_CYCLE.length];
const pct = (n) => formatPct(n * 100, 2);
const when = (ms) => (ms ? new Date(ms).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }) : "—");

function VoteChip({ vote, onClick, locked }) {
  const tone = vote === "Yes" ? "yes" : vote === "No" ? "no" : vote === "Abstain" ? "abstain" : "neutral";
  if (locked || !onClick) return <Pill tone={tone} size="sm" outline={!vote} title={locked ? `On chain: ${vote}` : undefined}>{locked ? "🔒 " : ""}{vote || "Not voted"}</Pill>;
  return <button type="button" className={`c-pill c-pill--${tone} c-pill--sm${vote ? "" : " c-pill--outline"} vt-chip`} onClick={onClick} title="Click to cycle the predicted vote">{vote || "Not voted"}</button>;
}

function ThresholdBar({ yesPct, label, large }) {
  const clamped = Math.min(1, Math.max(0, yesPct));
  const tone = clamped >= THRESHOLD ? "yes" : clamped > 0.6 ? "warning" : "no";
  return (
    <div>
      {label ? <div className="row row--between small" style={{ marginBottom: 4 }}><span className="muted">{label}</span><strong className="num" style={{ color: `var(--color-vote-${tone === "warning" ? "abstain" : tone})` }}>{pct(yesPct)}</strong></div> : null}
      <div className={`c-bar${large ? " c-bar--lg" : ""}`}><span className={`c-bar__seg c-bar__seg--${tone}`} style={{ width: `${clamped * 100}%` }} /><span className="c-bar__marker" style={{ left: `${THRESHOLD * 100}%` }} title="67% threshold" /></div>
    </div>
  );
}

function readOverrides() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {}; } catch { return {}; } }

export default function VoteTrackerPage({ initialTrack = "intersect" }) {
  useSeoMeta({ title: "Vote tracker", description: "Live DRep vote tracker for treasury withdrawals: on-chain votes, Ekklesia ballots and an editable prediction." });
  const [track, setTrack] = useState(initialTrack);
  const meta = TRACKS[track] || TRACKS.intersect;
  const query = useQuery({ queryKey: ["intersect", track], refetchInterval: REFRESH_MS, queryFn: ({ signal }) => fetchJson(`/api/intersect?proposal=${track}`, { signal }) });
  const data = query.data;
  const [allOverrides, setAllOverrides] = useState(readOverrides);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(allOverrides)); } catch { /* ignore */ } }, [allOverrides]);
  const overrides = useMemo(() => { const o = {}; for (const [id, val] of Object.entries(allOverrides[track] || {})) o[id] = val && typeof val === "object" ? val.v : val; return o; }, [allOverrides, track]);
  const cycle = useCallback((id, current) => setAllOverrides((prev) => ({ ...prev, [track]: { ...(prev[track] || {}), [id]: { v: nextVote(current), t: Date.now() } } })), [track]);
  const reset = () => setAllOverrides((prev) => ({ ...prev, [track]: {} }));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [rationale, setRationale] = useState(null);

  // A real on-chain vote cast after an override wins over it.
  useEffect(() => {
    if (!data) return;
    const votedAt = {};
    for (const d of data.dreps) if (d.votedAtUnix) votedAt[d.id] = d.votedAtUnix * 1000;
    setAllOverrides((prev) => {
      const cur = prev[track];
      if (!cur || Object.keys(cur).length === 0) return prev;
      let changed = false; const next = {};
      for (const [id, val] of Object.entries(cur)) {
        const t = val && typeof val === "object" ? Number(val.t || 0) : 0;
        if (t && votedAt[id] && votedAt[id] > t) { changed = true; continue; }
        next[id] = val;
      }
      return changed ? { ...prev, [track]: next } : prev;
    });
  }, [data, track]);

  const predicted = useMemo(() => { const out = {}; for (const d of data?.dreps || []) out[d.id] = overrides[d.id] !== undefined ? overrides[d.id] : d.hybridVote ?? d.onChainVote; return out; }, [data, overrides]);
  const live = useMemo(() => {
    if (!data) return null;
    let yesAda = 0, noAda = 0, absAda = 0, yesCt = 0, noCt = 0, absCt = 0;
    for (const d of data.dreps) {
      if (d.counted === false) continue;
      const v = predicted[d.id] || "";
      if (v === "Yes") { yesAda += d.vpAda; yesCt += 1; } else if (v === "No") { noAda += d.vpAda; noCt += 1; } else if (v === "Abstain") { absAda += d.vpAda; absCt += 1; }
    }
    const denom = data.totalActiveAda - absAda;
    return { yesAda, noAda, absAda, yesCt, noCt, absCt, denom, yesPct: denom > 0 ? yesAda / denom : 0, gap: yesAda - THRESHOLD * denom };
  }, [data, predicted]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.dreps || []).filter((d) => {
      if (q && !d.name.toLowerCase().includes(q) && !d.id.toLowerCase().includes(q)) return false;
      const pv = predicted[d.id] || "";
      switch (filter) {
        case "All": return true;
        case "Mismatch": return d.mismatch;
        case "Voted on-chain": return Boolean(d.onChainVote);
        case "Ekklesia only": return d.inEkklesia && !d.votedOnChain;
        case "Not voted": return !pv;
        default: return pv === filter;
      }
    });
  }, [data, search, filter, predicted]);
  const overrideCount = Object.keys(overrides).length;

  function downloadCsv() {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      `# ${meta.title} — DRep vote tracker`, `# Snapshot: ${new Date(data.fetchedAt).toISOString()} · Total active stake: ${Math.round(data.totalActiveAda).toLocaleString()} ADA`,
      ["Rank", "Name", "DRep ID", "Status", "Counted", "VP (ADA)", "Ekklesia vote", "On-chain vote", "Predicted vote", "Mismatch", "Has rationale", "Voted at (UTC)"].join(","),
      ...data.dreps.map((d) => [d.rank, esc(d.name || ""), esc(d.id), esc(d.status || "active"), d.counted === false ? "NO" : "YES", Math.round(d.vpAda), esc(d.ekkVote || ""), esc(d.onChainVote || ""), esc(predicted[d.id] || ""), d.mismatch ? "YES" : "", d.hasRationale ? "YES" : "", d.votedAtUnix ? new Date(d.votedAtUnix * 1000).toISOString() : ""].join(","))
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = `${track}-votes-${new Date(data.fetchedAt).toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  const columns = [
    { key: "rank", label: "#", compact: true, sortable: true, defaultDir: "asc", render: (d) => <span className="num muted">{d.rank}</span> },
    { key: "name", label: "DRep", span: true, sortable: true, defaultDir: "asc", sortValue: (d) => d.name || d.id, render: (d) => <div className="vt-drep"><span className="c-table__primary">{d.name || <span className="muted">Unnamed DRep</span>}{d.counted === false ? <Pill tone="danger" size="sm" outline style={{ marginLeft: 6 }}>{d.status === "expired" ? "Expired" : "Retired"} · not counted</Pill> : null}</span><span className="c-table__sub mono">{d.id}</span></div> },
    { key: "ekk", label: "Ekklesia", compact: true, render: (d) => d.ekkVote ? <VoteChip vote={d.ekkVote} locked /> : <span className="muted">—</span> },
    { key: "onchain", label: "On-chain", compact: true, render: (d) => d.onChainVote ? <VoteChip vote={d.onChainVote} locked /> : <span className="muted">—</span> },
    { key: "vote", label: "Predicted", compact: true, sortable: true, sortValue: (d) => predicted[d.id] || "", render: (d) => <span className="row" style={{ gap: 4 }}><VoteChip vote={predicted[d.id] || ""} onClick={d.counted === false ? null : () => cycle(d.id, predicted[d.id] || "")} locked={d.counted === false} />{overrides[d.id] !== undefined ? <span className="tiny" style={{ color: "var(--color-warning)" }}>edited</span> : null}</span> },
    { key: "vpAda", label: "Voting power", align: "right", sortable: true, render: (d) => d.counted === false ? <span className="muted">—</span> : <span className="num">{formatAdaCompact(d.vpAda)}</span> },
    { key: "extra", label: "", compact: true, hideLabel: true, render: (d) => <span className="row" style={{ gap: 6 }}>{d.mismatch ? <Pill tone="warning" size="sm" title={`On chain: ${d.onChainVote} · Ekklesia: ${d.ekkVote}`}>⚡ mismatch</Pill> : null}{d.hasRationale || d.rationaleUrl ? <Button size="sm" onClick={() => setRationale({ proposalId: meta.govActionId, voterId: d.id, voterRole: "drep", voteTxHash: d.voteTxHash, rationaleUrl: d.rationaleUrl, title: d.name || d.id, subtitle: meta.govActionId })}>Rationale</Button> : null}</span> }
  ];

  const trackPicker = <Segmented ariaLabel="Tracked proposal" value={track} onChange={setTrack} options={Object.values(TRACKS).map((t) => ({ value: t.key, label: t.label }))} />;

  if (query.isLoading && !data) return <main className="shell page p-tracker" aria-busy="true"><PageHeader eyebrow="Vote tracker" title="Loading live vote data…" actions={trackPicker} /><div className="c-stats"><Skeleton kind="card" count={4} /></div></main>;
  if (query.error && !data) return <main className="shell page p-tracker"><PageHeader eyebrow="Vote tracker" title={meta.title} actions={trackPicker} /><Alert tone="danger" title="Could not load the tracker.">{query.error.message} <Button size="sm" onClick={() => query.refetch()}>Retry</Button></Alert></main>;

  const { onChainStats, hybridStats, totalActiveAda, fetchedAt, latestOnChainAt } = data;
  const passing = live.yesPct >= THRESHOLD;
  const summaries = [
    { title: "On-chain votes", stats: onChainStats },
    { title: "Predicted (Ekklesia + on-chain)", stats: { ...hybridStats, yesPct: live.yesPct, yesAda: live.yesAda, noAda: live.noAda, absAda: live.absAda, yesCt: live.yesCt, noCt: live.noCt, absCt: live.absCt, denom: live.denom } }
  ];

  return (
    <main className="shell page p-tracker">
      <PageHeader eyebrow={meta.subtitle} title={meta.title} actions={trackPicker}>
        <div className="row" style={{ marginTop: 8 }}><span className="c-hash break">{meta.govActionId}</span><Button size="sm" to={`/actions/${encodeURIComponent(meta.govActionId)}`}>Open action</Button></div>
      </PageHeader>
      <div className="stack--6">
        <Card accent>
          <div className="vt-status">
            <div>
              <Pill tone={passing ? "success" : "danger"}>{passing ? "On track to pass" : "Not yet on track"}</Pill>
              <p className="small muted" style={{ margin: "8px 0 0" }}>Predicted {pct(live.yesPct)} Yes · need {pct(THRESHOLD)} · {live.gap >= 0 ? `buffer ${formatAdaCompact(live.gap)}` : `gap ${formatAdaCompact(-live.gap)}`}</p>
            </div>
            <div className="row">
              {overrideCount > 0 ? <Button size="sm" variant="soft" onClick={reset}>↩ Reset {overrideCount} edit{overrideCount === 1 ? "" : "s"}</Button> : null}
              <Button size="sm" icon={<IconRefresh size={14} />} onClick={() => query.refetch()} loading={query.isFetching}>Refresh</Button>
              <Button size="sm" icon={<IconDownload size={14} />} onClick={downloadCsv}>CSV</Button>
            </div>
          </div>
          <div className="stack--2" style={{ marginTop: 16, maxWidth: 720 }}>
            <ThresholdBar yesPct={live.yesPct} label={`Predicted${overrideCount > 0 ? " (edited)" : ""}`} large />
            <ThresholdBar yesPct={onChainStats.yesPct} label="On-chain only" />
          </div>
          <p className="tiny muted" style={{ marginTop: 10 }}>Data fetched {when(fetchedAt)} · latest on-chain vote {when(latestOnChainAt)} · refreshes every 2 minutes.</p>
        </Card>

        <StatGrid>
          <StatTile label="Predicted yes" value={pct(live.yesPct)} hint={`${formatAdaCompact(live.yesAda)} · ${live.yesCt} DReps`} tone={passing ? "accent" : "danger"} />
          <StatTile label="Predicted no" value={formatAdaCompact(live.noAda)} hint={`${live.noCt} DReps`} tone="danger" />
          <StatTile label="Predicted abstain" value={formatAdaCompact(live.absAda)} hint={`${live.absCt} DReps, excluded from the denominator`} />
          <StatTile label={live.gap >= 0 ? "Buffer" : "Gap"} value={formatAdaCompact(Math.abs(live.gap))} hint={`to 67% of ${formatAdaCompact(live.denom)}`} tone={live.gap >= 0 ? "accent" : "warning"} />
          <StatTile label="On-chain voted" value={pct(onChainStats.yesPct)} hint={`${onChainStats.total} DReps voted on chain`} />
        </StatGrid>

        <div className="grid grid--2">
          {summaries.map(({ title, stats }) => (
            <Card key={title} title={title} footer={`Total active stake ${formatAdaCompact(totalActiveAda)} · denominator ${formatAdaCompact(stats.denom)}`}>
              <ThresholdBar yesPct={stats.yesPct} />
              <div className="grid grid--3" style={{ marginTop: 14, textAlign: "center" }}>
                {[["Yes", stats.yesCt, stats.yesAda, "yes"], ["No", stats.noCt, stats.noAda, "no"], ["Abstain", stats.absCt, stats.absAda, "abstain"]].map(([lbl, ct, ada, tone]) => (
                  <div key={lbl}><div className="tiny muted">{lbl}</div><div className="num" style={{ fontWeight: 700, color: `var(--color-vote-${tone})` }}>{ct} DReps</div><div className="tiny muted num">{formatAdaCompact(ada)}</div></div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Alert tone="info"><strong>Interactive:</strong> click any predicted vote to cycle Yes → No → Abstain → Not voted, including DReps who already voted on chain, to model an expected change. Figures and bars update live. 🔒 marks a recorded vote. <strong>⚡ Mismatch</strong> means the on-chain vote differs from the Ekklesia ballot.</Alert>

        <div className="c-toolbar">
          <div className="c-search c-toolbar__grow"><span className="c-search__icon"><IconSearch size={16} /></span><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search DRep name or ID…" aria-label="Search DReps" /></div>
          <div className="c-chips">{FILTERS.map((f) => <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</Chip>)}</div>
          <span className="small muted"><b className="num">{rows.length}</b> / {data.dreps.length} DReps</span>
        </div>
        <DataTable columns={columns} rows={rows} getRowKey={(d) => d.id} defaultSort={{ key: "rank", dir: "asc" }} emptyMessage="No DReps match the current filter." caption="DRep votes" />
        <p className="tiny muted"><strong>Methodology:</strong> threshold is 67% of active DRep voting power minus abstain power. Always-no-confidence ({formatAdaCompact(data.alwaysNoConfAda)}) counts on the No side. Not-voted DReps count against Yes. Predicted: the on-chain vote where cast, the Ekklesia ballot otherwise. Top 500 DReps by voting power shown; deregistered DReps excluded.</p>
      </div>
      <RationaleModal item={rationale} onClose={() => setRationale(null)} />
    </main>
  );
}
