import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSeoMeta } from "../hooks/useSeoMeta";

const API_BASE = "";

const GOV_ACTION_ID = "gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8sgx6wlxf";
const THRESHOLD = 0.67;
const REFRESH_MS = 2 * 60 * 1000;

// ── tiny helpers ──────────────────────────────────────────────────────────────
const fmt  = (n, d = 0) => Number(n).toLocaleString("en", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtM = (ada)      => (ada / 1e6).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " M";
const pct  = (n)        => (n * 100).toFixed(2) + "%";
const ts   = (ms)       => ms ? new Date(ms).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }) : "—";

const VOTE_CYCLE = ["Yes", "No", "Abstain", ""];
function nextVote(v) { return VOTE_CYCLE[(VOTE_CYCLE.indexOf(v) + 1) % VOTE_CYCLE.length]; }

const VOTE_COLOR = {
  Yes:     { bg: "var(--green-soft, rgba(45,125,79,.18))", border: "rgba(45,125,79,.5)", text: "#4ade80" },
  No:      { bg: "var(--rose-soft, rgba(192,57,43,.18))", border: "rgba(192,57,43,.5)", text: "#f87171" },
  Abstain: { bg: "rgba(127,140,141,.18)", border: "rgba(127,140,141,.45)", text: "#9ca3af" },
  "":      { bg: "transparent", border: "var(--line)", text: "var(--text-muted)" },
};

function VotePill({ vote, onClick, locked = false }) {
  const c = VOTE_COLOR[vote] || VOTE_COLOR[""];
  return (
    <button
      onClick={locked ? undefined : onClick}
      title={locked ? `On-chain: ${vote}` : "Click to cycle vote"}
      style={{
        background: c.bg, border: `1px solid ${c.border}`, color: c.text,
        borderRadius: 5, padding: "2px 10px", fontSize: 12, fontWeight: 600,
        cursor: locked ? "default" : "pointer", minWidth: 68, textAlign: "center",
        whiteSpace: "nowrap", transition: "all .15s",
        opacity: locked ? 0.85 : 1,
      }}
    >
      {locked ? "🔒 " : ""}{vote || "Not Voted"}
    </button>
  );
}

// ── Threshold bar ─────────────────────────────────────────────────────────────
function ThresholdBar({ yesPct, label, small }) {
  const over = yesPct >= THRESHOLD;
  const pctClamped = Math.min(1, Math.max(0, yesPct));
  const color = over ? "#4ade80" : pctClamped > 0.6 ? "#fbbf24" : "#f87171";
  const h = small ? 10 : 18;
  return (
    <div>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: small ? 11 : 13, marginBottom: 4, color: "var(--text-muted)" }}>
          <span>{label}</span>
          <span style={{ color, fontWeight: 700 }}>{pct(yesPct)}</span>
        </div>
      )}
      <div style={{ position: "relative", height: h, borderRadius: h, background: "rgba(255,255,255,.07)", overflow: "visible" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%", borderRadius: h,
          width: `${pctClamped * 100}%`, minWidth: pctClamped > 0 ? 4 : 0,
          background: color, transition: "width .4s cubic-bezier(.4,0,.2,1), background .3s",
        }} />
        {/* 67% marker */}
        <div style={{
          position: "absolute", left: `${THRESHOLD * 100}%`, top: small ? -2 : -4,
          width: 2, height: small ? h + 4 : h + 8, background: "rgba(255,255,255,.7)",
          borderRadius: 1, transform: "translateX(-1px)",
        }} />
        {!small && (
          <div style={{
            position: "absolute", left: `${THRESHOLD * 100}%`, top: h + 6,
            fontSize: 10, color: "rgba(255,255,255,.5)", transform: "translateX(-50%)",
          }}>67%</div>
        )}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, wide }) {
  return (
    <div style={{
      background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10,
      padding: "14px 18px", flex: wide ? "2 1 200px" : "1 1 140px",
    }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || "var(--text)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function IntersectPage() {
  useSeoMeta({ title: "Intersect Vote Tracker", description: "Live DRep vote tracker for the Intersect treasury withdrawal — 25,400,000 ADA." });

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [overrides, setOverrides] = useState({});   // drep.id → "Yes"|"No"|"Abstain"|""
  const [search, setSearch]       = useState("");
  const [filterVote, setFilterVote] = useState("All");
  const [sortCol, setSortCol]     = useState("rank");
  const [sortDir, setSortDir]     = useState("asc");
  const [lastRefresh, setLastRefresh] = useState(null);
  const timerRef = useRef(null);

  // ── Rationale modal ───────────────────────────────────────────────────────
  const [rationaleModal, setRationaleModal]       = useState({ open: false, key: "", title: "" });
  const [rationaleText, setRationaleText]         = useState({});
  const [rationaleLoading, setRationaleLoading]   = useState({});
  const [rationaleError, setRationaleError]       = useState({});

  async function loadRationale(drep) {
    const key = drep.id;
    if (rationaleLoading[key] || rationaleText[key]) return;
    setRationaleLoading(p => ({ ...p, [key]: true }));
    setRationaleError(p => ({ ...p, [key]: "" }));
    try {
      const params = new URLSearchParams({ proposalId: GOV_ACTION_ID, voterId: drep.id, voterRole: "drep" });
      if (drep.rationaleUrl) params.set("url", drep.rationaleUrl);
      if (drep.voteTxHash)   params.set("voteTxHash", drep.voteTxHash);
      const res  = await fetch(`${API_BASE}/api/vote-rationale?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setRationaleText(p => ({ ...p, [key]: String(data.rationaleText || "").trim() || "No rationale text available." }));
    } catch (e) {
      setRationaleError(p => ({ ...p, [key]: e.message || "Failed to load rationale." }));
    } finally {
      setRationaleLoading(p => ({ ...p, [key]: false }));
    }
  }

  function openRationale(drep) {
    setRationaleModal({ open: true, key: drep.id, title: drep.name || drep.id });
    loadRationale(drep);
  }

  function closeRationale() { setRationaleModal(m => ({ ...m, open: false })); }

  const load = useCallback(async (soft = false) => {
    if (!soft) setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/intersect");
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const d = await res.json();
      setData(d);
      setLastRefresh(Date.now());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 2 min
  useEffect(() => {
    timerRef.current = setInterval(() => load(true), REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [load]);

  // ── Derived: predicted vote per DRep (override > hybrid > blank) ──────────
  const predictedVotes = useMemo(() => {
    if (!data) return {};
    const out = {};
    for (const d of data.dreps) out[d.id] = overrides[d.id] !== undefined ? overrides[d.id] : d.hybridVote;
    return out;
  }, [data, overrides]);

  // ── Live stats from predicted votes ──────────────────────────────────────
  const liveStats = useMemo(() => {
    if (!data) return null;
    let yesAda = 0, noAda = 0, absAda = 0, yesCt = 0, noCt = 0, absCt = 0;
    for (const d of data.dreps) {
      const v = predictedVotes[d.id] || "";
      if (v === "Yes")    { yesAda += d.vpAda; yesCt++; }
      else if (v === "No"){ noAda  += d.vpAda; noCt++;  }
      else if (v === "Abstain") { absAda += d.vpAda; absCt++; }
    }
    const denom  = data.totalActiveAda - absAda;
    const yesPct = denom > 0 ? yesAda / denom : 0;
    const gap    = yesAda - THRESHOLD * denom;
    return { yesAda, noAda, absAda, yesCt, noCt, absCt, denom, yesPct, gap };
  }, [data, predictedVotes]);

  // ── Filtered + sorted dreps for table ────────────────────────────────────
  const displayDreps = useMemo(() => {
    if (!data) return [];
    let list = data.dreps;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
    }
    if (filterVote !== "All") {
      list = list.filter(d => {
        const pv = predictedVotes[d.id] || "";
        if (filterVote === "Mismatch") return d.mismatch;
        if (filterVote === "Voted On-Chain") return !!d.onChainVote;
        if (filterVote === "Ekklesia Only") return d.inEkklesia && !d.votedOnChain;
        if (filterVote === "Not Voted") return !pv;
        return pv === filterVote;
      });
    }
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortCol === "rank")  return dir * (a.rank - b.rank);
      if (sortCol === "vp")    return dir * (a.vpAda - b.vpAda);
      if (sortCol === "name")  return dir * a.name.localeCompare(b.name);
      if (sortCol === "vote")  return dir * ((predictedVotes[a.id]||"").localeCompare(predictedVotes[b.id]||""));
      return 0;
    });
  }, [data, search, filterVote, predictedVotes, sortCol, sortDir]);

  const resetOverrides = () => setOverrides({});
  const overrideCount = Object.keys(overrides).length;

  function downloadCSV() {
    const snap = new Date(data.fetchedAt).toISOString().slice(0, 19).replace("T", " ") + " UTC";
    const headers = ["Rank","Name","DRep ID","VP (ADA)","Ekklesia Vote","On-chain Vote","Predicted Vote","Mismatch","Has Rationale","Voted At (UTC)"];
    const escape = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = data.dreps.map(d => [
      d.rank,
      escape(d.name || ""),
      escape(d.id),
      Math.round(d.vpAda),
      escape(d.ekkVote || ""),
      escape(d.onChainVote || ""),
      escape(predictedVotes[d.id] || ""),
      d.mismatch ? "YES" : "",
      d.hasRationale ? "YES" : "",
      d.votedAtUnix ? new Date(d.votedAtUnix * 1000).toISOString().slice(0, 19).replace("T", " ") : "",
    ].join(","));
    const csv = [
      `# Intersect Treasury Withdrawal — DRep Vote Tracker`,
      `# Snapshot: ${snap} · Total active stake: ${Math.round(data.totalActiveAda).toLocaleString()} ADA`,
      headers.join(","),
      ...rows,
    ].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `intersect-votes-${new Date(data.fetchedAt).toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Sort header ───────────────────────────────────────────────────────────
  function SortHdr({ col, children }) {
    const active = sortCol === col;
    return (
      <th
        onClick={() => { if (active) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir("asc"); } }}
        style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
          color: active ? "var(--mint)" : "var(--text-muted)", paddingRight: 8 }}
      >
        {children} {active ? (sortDir === "asc" ? "↑" : "↓") : <span style={{ opacity: .3 }}>↕</span>}
      </th>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  if (loading && !data) return (
    <main className="shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <div>Loading live vote data…</div>
      </div>
    </main>
  );

  if (error) return (
    <main className="shell" style={{ padding: "2rem" }}>
      <div style={{ color: "var(--rose)" }}>Error: {error}</div>
      <button onClick={() => load()} style={{ marginTop: 12, padding: "6px 16px", cursor: "pointer" }}>Retry</button>
    </main>
  );

  const { onChainStats, hybridStats, totalActiveAda, fetchedAt, latestOnChainAt } = data;
  const passing = liveStats.yesPct >= THRESHOLD;

  return (
    <main className="shell" style={{ paddingBottom: "4rem" }}>
      {/* ── Hero ── */}
      <div style={{ background: "linear-gradient(135deg, var(--bg-soft) 0%, rgba(30,58,95,.35) 100%)", borderBottom: "1px solid var(--line)", padding: "28px 32px 24px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>
                Treasury Withdrawal · 25,400,000 ADA
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--text)" }}>
                Intersect: Governance coordination &amp; technical stewardship
              </h1>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, fontFamily: "monospace" }}>
                {GOV_ACTION_ID}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {overrideCount > 0 && (
                <button onClick={resetOverrides} style={{
                  padding: "6px 14px", borderRadius: 6, border: "1px solid var(--amber)",
                  background: "rgba(255,199,0,.1)", color: "var(--amber)", cursor: "pointer", fontSize: 12,
                }}>↩ Reset {overrideCount} edit{overrideCount !== 1 ? "s" : ""}</button>
              )}
              <button onClick={() => load(true)} style={{
                padding: "6px 14px", borderRadius: 6, border: "1px solid var(--line)",
                background: "var(--panel)", color: "var(--text-muted)", cursor: "pointer", fontSize: 12,
              }}>⟳ Refresh</button>
              <button onClick={downloadCSV} style={{
                padding: "6px 14px", borderRadius: 6, border: "1px solid var(--line)",
                background: "var(--panel)", color: "var(--text-muted)", cursor: "pointer", fontSize: 12,
              }}>⬇ Download CSV</button>
            </div>
          </div>

          {/* big status badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "10px 20px", borderRadius: 8, marginBottom: 20,
            background: passing ? "rgba(74,222,128,.12)" : "rgba(248,113,113,.12)",
            border: `1px solid ${passing ? "rgba(74,222,128,.35)" : "rgba(248,113,113,.35)"}`,
          }}>
            <span style={{ fontSize: 22 }}>{passing ? "✅" : "❌"}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: passing ? "#4ade80" : "#f87171" }}>
                {passing ? "ON TRACK TO PASS" : "NOT YET ON TRACK"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Predicted {pct(liveStats.yesPct)} Yes · need 67% · {liveStats.gap >= 0 ? `buffer ${fmtM(liveStats.gap)}` : `gap ${fmtM(-liveStats.gap)}`} · threshold {pct(THRESHOLD)}
              </div>
            </div>
          </div>

          {/* Threshold bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 700 }}>
            <ThresholdBar yesPct={liveStats.yesPct} label={`Predicted${overrideCount > 0 ? " (edited)" : ""} — ${pct(liveStats.yesPct)}`} />
            <ThresholdBar yesPct={onChainStats.yesPct} label={`On-chain only — ${pct(onChainStats.yesPct)}`} small />
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}>
            Data fetched {ts(fetchedAt)} · Latest on-chain vote {ts(latestOnChainAt)}
            {lastRefresh && <span> · Auto-refresh in {Math.round((REFRESH_MS - (Date.now() - lastRefresh)) / 1000 / 60)} min</span>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "24px 32px" }}>
        {/* ── Stat cards ── */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
          <StatCard label="Predicted Yes" value={pct(liveStats.yesPct)} sub={`${fmtM(liveStats.yesAda)} · ${liveStats.yesCt} DReps`} color={passing ? "#4ade80" : "#f87171"} />
          <StatCard label="Predicted No" value={fmtM(liveStats.noAda)} sub={`${liveStats.noCt} DReps`} color="#f87171" />
          <StatCard label="Predicted Abstain" value={fmtM(liveStats.absAda)} sub={`${liveStats.absCt} DReps (excl. from denom)`} />
          <StatCard label="Gap / Buffer" value={(liveStats.gap >= 0 ? "+" : "−") + fmtM(Math.abs(liveStats.gap))} sub={`to 67% of ${fmtM(liveStats.denom)}`} color={liveStats.gap >= 0 ? "#4ade80" : "#fbbf24"} />
          <StatCard label="On-chain Voted" value={pct(onChainStats.yesPct)} sub={`${onChainStats.total} DReps voted on-chain`} />
        </div>

        {/* ── Panel: two-col summary ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
          {[
            { title: "On-Chain Votes", stats: onChainStats },
            { title: "Predicted (Ekklesia + on-chain)", stats: { ...hybridStats, yesPct: liveStats.yesPct, yesAda: liveStats.yesAda, noAda: liveStats.noAda, absAda: liveStats.absAda, yesCt: liveStats.yesCt, noCt: liveStats.noCt, absCt: liveStats.absCt, denom: liveStats.denom } },
          ].map(({ title, stats }) => (
            <div key={title} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12 }}>{title}</div>
              <ThresholdBar yesPct={stats.yesPct} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 14 }}>
                {[
                  ["Yes", stats.yesCt, stats.yesAda, VOTE_COLOR.Yes.text],
                  ["No", stats.noCt, stats.noAda, VOTE_COLOR.No.text],
                  ["Abstain", stats.absCt, stats.absAda, VOTE_COLOR.Abstain.text],
                ].map(([lbl, ct, ada, c]) => (
                  <div key={lbl} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{lbl}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: c }}>{ct} DReps</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{fmtM(ada)}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-muted)", textAlign: "right" }}>
                Total active stake: {fmtM(totalActiveAda)} · Denominator: {fmtM(stats.denom)}
              </div>
            </div>
          ))}
        </div>

        {/* ── Instruction callout ── */}
        <div style={{ background: "rgba(84,228,188,.07)", border: "1px solid rgba(84,228,188,.2)", borderRadius: 8, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "var(--text-muted)" }}>
          <strong style={{ color: "var(--mint)" }}>Interactive:</strong> Click any <em>Predicted Vote</em> pill to cycle through Yes → No → Abstain → Not Voted. Stats and bars update live. 🔒 = on-chain (locked). <strong style={{ color: "var(--amber)" }}>⚡ Mismatch</strong> = on-chain differs from Ekklesia.
        </div>

        {/* ── Filters ── */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
          <input
            placeholder="Search DRep name or ID…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              padding: "7px 14px", borderRadius: 6, border: "1px solid var(--line)",
              background: "var(--bg-soft)", color: "var(--text)", fontSize: 13, minWidth: 240,
            }}
          />
          {["All", "Yes", "No", "Abstain", "Not Voted", "Voted On-Chain", "Ekklesia Only", "Mismatch"].map(f => (
            <button key={f} onClick={() => setFilterVote(f)} style={{
              padding: "6px 13px", borderRadius: 6, fontSize: 12, cursor: "pointer",
              border: filterVote === f ? "1px solid var(--mint)" : "1px solid var(--line)",
              background: filterVote === f ? "rgba(84,228,188,.12)" : "var(--panel)",
              color: filterVote === f ? "var(--mint)" : "var(--text-muted)",
              fontWeight: filterVote === f ? 600 : 400,
            }}>{f}</button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>
            {displayDreps.length} / {data.dreps.length} DReps
          </span>
        </div>

        {/* ── Table ── */}
        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--line)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--bg-soft)", borderBottom: "1px solid var(--line)" }}>
                <SortHdr col="rank" style={{ padding: "10px 12px" }}>#</SortHdr>
                <SortHdr col="name">DRep</SortHdr>
                <th style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>Ekklesia</th>
                <th style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>On-Chain 🔒</th>
                <SortHdr col="vote">Predicted ▼</SortHdr>
                <SortHdr col="vp">VP (ADA)</SortHdr>
                <th style={{ color: "var(--text-muted)" }}></th>
              </tr>
            </thead>
            <tbody>
              {displayDreps.map((d, i) => {
                const pred = predictedVotes[d.id] || "";
                const isEdited = overrides[d.id] !== undefined;
                const rowBg = i % 2 === 0 ? "transparent" : "rgba(255,255,255,.025)";
                return (
                  <tr key={d.id} style={{ background: rowBg, borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                    <td style={{ padding: "8px 12px", color: "var(--text-muted)", fontSize: 12, width: 44 }}>
                      {d.rank}
                    </td>
                    <td style={{ padding: "8px 12px", maxWidth: 220 }}>
                      <div style={{ fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {d.name || <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>Unnamed DRep</span>}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
                        {d.id}
                      </div>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      {d.ekkVote ? <VotePill vote={d.ekkVote} locked /> : <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      {d.onChainVote ? <VotePill vote={d.onChainVote} locked /> : <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <VotePill
                        vote={pred}
                        onClick={() => setOverrides(ov => ({
                          ...ov,
                          [d.id]: nextVote(pred),
                        }))}
                        locked={!!d.onChainVote}
                      />
                      {isEdited && <span style={{ fontSize: 10, color: "var(--amber)", marginLeft: 4 }}>edited</span>}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text)" }}>
                      {fmtM(d.vpAda)}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center", whiteSpace: "nowrap" }}>
                      {d.mismatch && (
                        <span title={`On-chain: ${d.onChainVote} · Ekklesia: ${d.ekkVote}`}
                          style={{ fontSize: 11, color: "var(--amber)", whiteSpace: "nowrap" }}>⚡ mismatch</span>
                      )}
                      {(d.hasRationale || d.rationaleUrl) && (
                        <button
                          type="button"
                          className="mode-btn"
                          onClick={() => openRationale(d)}
                          style={{ marginLeft: d.mismatch ? 6 : 0, fontSize: 11, padding: "2px 8px" }}
                        >
                          Rationale
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {displayDreps.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    No DReps match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 14, lineHeight: 1.6 }}>
          <strong>Methodology:</strong> Threshold = 67% of active DRep VP minus abstain VP. Always-no-confidence ({fmtM(data.alwaysNoConfAda)}) counted on No side. Not-voted DReps count against Yes. Predicted: on-chain vote used where cast, Ekklesia ballot otherwise. Top 500 DReps by voting power shown. Deregistered DReps excluded.
        </div>
      </div>

      {/* ── Rationale modal ── */}
      {rationaleModal.open && (
        <div className="image-modal-backdrop" role="presentation" onClick={closeRationale}>
          <div className="image-modal rationale-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <button type="button" className="image-modal-close" onClick={closeRationale}>Close</button>
            <h3 className="rationale-modal-title">{rationaleModal.title}</h3>
            <div className="rationale-modal-content">
              {rationaleLoading[rationaleModal.key] ? (
                <p className="muted">Loading rationale…</p>
              ) : rationaleError[rationaleModal.key] ? (
                <p className="muted">Error: {rationaleError[rationaleModal.key]}</p>
              ) : (
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {rationaleText[rationaleModal.key] || ""}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
