// DRep / SPO / Constitutional Committee dashboards: every actor scored on
// attendance, transparency, alignment, responsiveness and (for DReps)
// delegation concentration, filterable by action and governance type.
// Data: one packed /api/v1/actors/:type payload, scored in the browser.
import { useContext, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { useSnapshotKey, withSnapshotParam } from "../hooks/useSnapshotKey";
import { WalletContext } from "../context/WalletContext";
import { useActors } from "../api/queries";
import { proposalInfoFromIndex } from "../api/unpack";
import { LivePill, SnapshotBanner } from "../components/LiveStatus";
import { getSoftCoercedDrepMatch } from "../constants/softCoercedDreps";
import { SHOW_DELEGATION_AWARENESS_UI } from "../constants/featureFlags";
import {
  Alert, Button, Card, Checkbox, Chip, DataTable, Disclosure, Field, Input, Menu, PageHeader, Pagination, Pill, Select, Skeleton, StatGrid, StatTile, Switch, Tooltip
} from "../ui";
import { IconChevronDown, IconSearch } from "../ui/icons";
import { formatAdaCompact, formatPct, truncateMiddle } from "../lib/governance/format";
import {
  DREP_DELEGATION_RISK_HIGH_CUTOFF, DREP_DELEGATION_RISK_MEDIUM_CUTOFF, formatResponseHours, isSpoAlwaysAbstainStatus,
  mergeSpecialDreps, metricHelp, scoreActors, votingPowerTotals
} from "../lib/governance/scoring";

const PAGE_SIZES = [50, 100, 200, "all"];
const LABELS = {
  drep: { title: "DReps", one: "DRep", lead: "Every registered Delegated Representative, scored on how they vote and explain themselves.", seo: "Browse all Cardano Delegated Representatives — voting records, accountability scores, rationale coverage, and delegation stats." },
  spo: { title: "Stake pool operators", one: "Stake pool", lead: "Stake pools that take part in governance, scored on their voting record.", seo: "Cardano Stake Pool Operator governance participation — voting records, accountability scores, and delegation status." },
  committee: { title: "Constitutional Committee", one: "Member", lead: "Committee members and their constitutionality assessments.", seo: "Cardano Constitutional Committee member voting records, constitutionality assessments, and participation metrics." }
};

function Metric({ value, sub, help, label, tone }) {
  return (
    <div className="p-dash__metric">
      <span className="p-dash__metric-value">
        {tone ? <Pill tone={tone} size="sm">{value}</Pill> : <strong className="num">{value}</strong>}
        {help ? <Tooltip label={label}>{help.map((line, i) => <span key={i} style={{ display: "block", marginTop: i ? 4 : 0 }}>{line}</span>)}</Tooltip> : null}
      </span>
      {sub ? <span className="p-dash__metric-sub num">{sub}</span> : null}
    </div>
  );
}

function scoreTone(score) {
  return score >= 75 ? "success" : score >= 50 ? "warning" : "danger";
}
function riskTone(score) {
  return score >= DREP_DELEGATION_RISK_HIGH_CUTOFF ? "danger" : score >= DREP_DELEGATION_RISK_MEDIUM_CUTOFF ? "warning" : "success";
}

function titleCase(value, fallback) {
  return String(value || fallback || "").replace(/\b\w/g, (m) => m.toUpperCase());
}

function cardanoscanCredentialLink(credential) {
  const value = String(credential || "").trim();
  if (value.startsWith("cc_cold1")) return `https://cardanoscan.io/ccmember/${encodeURIComponent(value)}`;
  if (value.startsWith("cc_hot1")) return `https://cardanoscan.io/cchot/${encodeURIComponent(value)}`;
  return `https://cardanoscan.io/search?query=${encodeURIComponent(value)}`;
}

/** Register the connected wallet as a DRep (Mesh is loaded on demand). */
function DrepRegistrationCard() {
  const wallet = useContext(WalletContext);
  const [open, setOpen] = useState(false);
  const [drepId, setDrepId] = useState("");
  const [deposit, setDeposit] = useState("500000000");
  const [anchorUrl, setAnchorUrl] = useState("");
  const [anchorHash, setAnchorHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { tone, text }
  const walletDrepId = String(wallet?.walletDrep?.dRepIDCip105 || "").trim();

  useEffect(() => { if (walletDrepId && !drepId) setDrepId(walletDrepId); }, [walletDrepId, drepId]);

  async function register() {
    if (!wallet?.walletApi) { setNotice({ tone: "warning", text: "Connect your wallet in the top bar to register as a DRep." }); return; }
    if (!wallet.walletRewardAddress) { setNotice({ tone: "warning", text: "No reward address found in the connected wallet. Registration needs a stake key." }); return; }
    const depositLovelace = Number(deposit || 0);
    if (!Number.isFinite(depositLovelace) || depositLovelace <= 0) { setNotice({ tone: "danger", text: "The deposit must be a positive lovelace amount." }); return; }
    const url = anchorUrl.trim();
    const hash = anchorHash.trim();
    if ((url && !hash) || (!url && hash)) { setNotice({ tone: "danger", text: "Provide both the anchor URL and its hash, or leave both empty." }); return; }
    try {
      setBusy(true); setNotice(null);
      const [{ Transaction, resolveStakeKeyHash }, { hexToBech32 }] = await Promise.all([import("@meshsdk/core"), import("@meshsdk/core-cst")]);
      let id = drepId.trim() || walletDrepId;
      if (!id) {
        const stakeKeyHash = String(resolveStakeKeyHash(String(wallet.walletRewardAddress)) || "").trim();
        id = stakeKeyHash ? String(hexToBech32("drep", stakeKeyHash) || "").trim() : "";
      }
      if (!id) throw new Error("Could not derive a DRep ID from the connected wallet. Enter one manually.");
      const tx = new Transaction({ initiator: wallet.walletApi, verbose: false });
      tx.setNetwork("mainnet");
      tx.txBuilder.drepRegistrationCertificate(id, url && hash ? { url, hash } : undefined, depositLovelace);
      const unsigned = await tx.build();
      const signed = await wallet.walletApi.signTx(unsigned, true, true);
      const txHash = await wallet.walletApi.submitTx(signed);
      setNotice({ tone: "success", text: `DRep registration submitted. Transaction ${txHash}` });
    } catch (e) {
      setNotice({ tone: "danger", text: `Registration failed: ${e?.message || "the transaction could not be built."}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-dash__register" title="Become a DRep" subtitle="Register the connected wallet as a Delegated Representative. Your wallet signs the certificate; the deposit is returned when you retire." actions={<Button variant={open ? "default" : "primary"} onClick={() => setOpen((v) => !v)} aria-expanded={open}>{open ? "Hide form" : "Register as a DRep"}</Button>}>
      {open ? (
        <div className="stack">
          <div className="grid grid--2">
            <Field label="DRep ID (CIP-105)" hint="Optional. Derived from the connected wallet when empty.">{(id) => <Input id={id} value={drepId} onChange={(e) => setDrepId(e.target.value)} placeholder="drep1…" className="mono" />}</Field>
            <Field label="Deposit (lovelace)">{(id) => <Input id={id} inputMode="numeric" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="500000000" className="mono" />}</Field>
            <Field label="Anchor URL" hint="Optional CIP-119 profile document.">{(id) => <Input id={id} value={anchorUrl} onChange={(e) => setAnchorUrl(e.target.value)} placeholder="https://… or ipfs://…" />}</Field>
            <Field label="Anchor hash" hint="blake2b-256 of the document.">{(id) => <Input id={id} value={anchorHash} onChange={(e) => setAnchorHash(e.target.value)} placeholder="hex" className="mono" />}</Field>
          </div>
          {!wallet?.walletApi ? <p className="small muted">Connect your wallet in the top bar to enable registration.</p> : null}
          {notice ? <Alert tone={notice.tone}>{notice.text}</Alert> : null}
          <div className="row"><Button variant="primary" onClick={register} loading={busy} disabled={busy}>{busy ? "Submitting…" : "Register connected wallet as DRep"}</Button></div>
        </div>
      ) : notice ? <Alert tone={notice.tone}>{notice.text}</Alert> : null}
    </Card>
  );
}

export default function DashboardPage({ actorType }) {
  const isDrep = actorType === "drep";
  const isSpo = actorType === "spo";
  const isCommittee = actorType === "committee";
  const labels = LABELS[actorType] || LABELS.drep;
  useSeoMeta({ title: isDrep ? "DRep Dashboard" : isSpo ? "SPO Dashboard" : "Constitutional Committee", description: labels.seo });
  const navigate = useNavigate();
  const snapshotKey = useSnapshotKey();
  const [params, setParams] = useSearchParams();
  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };
  const search = params.get("q") || "";
  const deferredSearch = useDeferredValue(search);
  const sortBy = params.get("sort") || "accountability";
  const sortDir = params.get("dir") || (sortBy === "name" ? "asc" : "desc");
  const selectedAction = params.get("action") || "";

  const [minAttendance, setMinAttendance] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [includeActiveActions, setIncludeActiveActions] = useState(true);
  const [include, setInclude] = useState({ attendance: true, transparency: !isCommittee, alignment: isCommittee, responsiveness: isCommittee, delegationRisk: isDrep });
  const [includePreviousMembers, setIncludePreviousMembers] = useState(false);
  const [pageSize, setPageSize] = useState(50);
  const setInc = (key) => (value) => setInclude((prev) => ({ ...prev, [key]: value }));

  const query = useActors(actorType, snapshotKey);
  const meta = query.meta;
  const proposalInfo = useMemo(() => proposalInfoFromIndex(query.unpacked?.proposals || []), [query.unpacked]);
  const actors = useMemo(() => {
    const list = query.unpacked?.actors || [];
    return isDrep ? mergeSpecialDreps(list, meta?.specialDreps) : list;
  }, [query.unpacked, isDrep, meta]);
  const power = useMemo(() => votingPowerTotals(actors, actorType), [actors, actorType]);

  const actionOptions = useMemo(() => (query.unpacked?.proposals || []).map((p) => ({ id: p.id, name: p.name })).sort((a, b) => a.name.localeCompare(b.name)), [query.unpacked]);
  const typeOptions = useMemo(() => Array.from(new Set((query.unpacked?.proposals || []).map((p) => p.type || "Unknown"))).sort(), [query.unpacked]);
  const totalSpoVotes = useMemo(() => (query.unpacked?.proposals || []).reduce((sum, p) => sum + Number(p.votes?.spo || 0), 0), [query.unpacked]);

  const scored = useMemo(() => scoreActors(actors, {
    actorType, proposalInfo, selectedAction, selectedTypes: new Set(selectedTypes), includeActiveActions, include,
    drepParticipationStartEpoch: meta?.drepParticipationStartEpoch, powerTotals: power
  }), [actors, actorType, proposalInfo, selectedAction, selectedTypes, includeActiveActions, include, meta, power]);

  const rows = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return scored
      .filter((row) => (isCommittee ? row.cast > 0 : true))
      .filter((row) => (isCommittee && !includePreviousMembers ? String(row.status || "").toLowerCase() === "active" : true))
      .filter((row) => row.attendance >= minAttendance)
      .filter((row) => !q || (row.name || "").toLowerCase().includes(q) || row.id.toLowerCase().includes(q))
      .sort((a, b) => {
        const delta = sortBy === "name" ? (a.name || a.id).localeCompare(b.name || b.id) : (a[sortBy] ?? 0) - (b[sortBy] ?? 0);
        return sortDir === "asc" ? delta : -delta;
      });
  }, [scored, deferredSearch, isCommittee, includePreviousMembers, minAttendance, sortBy, sortDir]);

  // The page resets whenever the row set changes; keyed state instead of an effect.
  const filterKey = JSON.stringify([deferredSearch, sortBy, sortDir, selectedAction, selectedTypes, includeActiveActions, includePreviousMembers, minAttendance, pageSize]);
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (next) => setPageState({ key: filterKey, page: typeof next === "function" ? next(page) : next });
  const size = isCommittee || pageSize === "all" ? Math.max(rows.length, 1) : Number(pageSize);
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = useMemo(() => rows.slice((currentPage - 1) * size, currentPage * size), [rows, currentPage, size]);

  const profilePath = (id) => withSnapshotParam(`/${isDrep ? "dreps" : isSpo ? "spos" : "committee"}/${encodeURIComponent(id)}`, snapshotKey);
  const alignmentLabel = isCommittee ? "Rationale quality" : "Alignment";

  const columns = useMemo(() => {
    const cols = [
      {
        key: "name", label: labels.one, span: true, sortable: true, defaultDir: "asc", sortValue: (row) => row.name || row.id, className: "p-dash__col-name",
        render: (row) => {
          const awareness = isDrep && SHOW_DELEGATION_AWARENESS_UI ? getSoftCoercedDrepMatch(row.id) : null;
          return (
            <div className="p-dash__actor">
              <span className="row" style={{ gap: 6 }}>
                <span className="c-table__primary">{row.name || (isDrep ? "Unnamed DRep" : isCommittee ? row.id : "Unnamed pool")}</span>
                {isCommittee ? <Pill size="sm" status={String(row.status || "expired").toLowerCase() === "active" ? "active" : String(row.status || "").toLowerCase() === "retired" ? "retired" : "expired"}>{titleCase(row.status, "expired")}</Pill> : null}
                {isSpo && isSpoAlwaysAbstainStatus(row.delegationStatus) ? <Pill size="sm" tone="success">{row.delegationStatus}</Pill> : null}
                {awareness ? <Pill size="sm" tone="warning" title={`Shown in local delegation-awareness list: ${awareness.label}`}>Awareness</Pill> : null}
              </span>
              {!isCommittee ? <span className="p-dash__power num"><strong>{formatAdaCompact(row.votingPowerAda)}</strong> <span className="muted">· {formatPct(row.votingPowerPctTotal, 2)} total · {formatPct(row.votingPowerPctActive, 2)} active</span></span> : null}
              {isCommittee ? (
                <span className="c-table__sub mono">
                  {row.hotCredential ? <a href={cardanoscanCredentialLink(row.hotCredential)} target="_blank" rel="noreferrer">hot {truncateMiddle(row.hotCredential, 12, 6)}</a> : null}
                  {row.hotCredential && row.coldCredential ? " · " : null}
                  {row.coldCredential ? <a href={cardanoscanCredentialLink(row.coldCredential)} target="_blank" rel="noreferrer">cold {truncateMiddle(row.coldCredential, 12, 6)}</a> : null}
                </span>
              ) : <span className="c-table__sub mono">{truncateMiddle(row.id, 16, 8)}</span>}
              {awareness?.reason ? <span className="c-table__sub" title={awareness.reason}>Reason: {awareness.reason}</span> : null}
            </div>
          );
        }
      },
      { key: "attendance", label: "Attendance", align: "right", sortable: true, render: (row) => <Metric value={`${row.attendance}%`} sub={`${row.cast}/${row.totalEligibleVotes}`} help={metricHelp.attendance(row)} label="How attendance is calculated" /> }
    ];
    if (!isCommittee) cols.push({ key: "transparencyScore", label: "Transparency", align: "right", sortable: true, render: (row) => <Metric value={`${row.transparencyScore ?? 0}%`} sub={`${row.transparencyCount ?? 0}/${row.transparencyTotal ?? 0}`} help={metricHelp.transparency(row, false)} label="How transparency is calculated" /> });
    cols.push({ key: "consistency", label: alignmentLabel, align: "right", sortable: true, render: (row) => <Metric value={`${row.consistency}%`} sub={isCommittee ? null : `${row.consistencyMatches ?? 0}/${row.consistencyTotal ?? 0}`} help={isCommittee ? metricHelp.rationaleQuality(row) : metricHelp.consistency(row)} label={`How ${alignmentLabel.toLowerCase()} is calculated`} /> });
    cols.push({ key: "abstainRate", label: "Abstain", align: "right", sortable: true, render: (row) => <Metric value={`${row.abstainRate}%`} sub={`${row.abstainCount ?? 0}/${row.abstainTotal ?? 0}`} help={metricHelp.abstain(row)} label="How the abstain rate is calculated" /> });
    if (isDrep) cols.push({ key: "delegationRiskScore", label: "Delegation risk", align: "right", sortable: true, render: (row) => <Metric tone={riskTone(row.delegationRiskScore)} value={`${row.delegationRiskScore}%`} sub={`${row.delegationRiskLabel} · ${formatPct(row.votingPowerPctActive, 2)} active`} help={metricHelp.delegationRisk(row)} label="Delegation concentration risk" /> });
    if (!isCommittee) cols.push({ key: "responsiveness", label: "Responsiveness", align: "right", sortable: true, render: (row) => <Metric value={`${row.responsiveness ?? 0}%`} sub={formatResponseHours(row.avgResponseHours)} help={metricHelp.responsiveness(row)} label="How responsiveness is calculated" /> });
    if (isCommittee) cols.push({ key: "term", label: "Term", align: "right", render: (row) => <span className="num small">{row.seatStartEpoch ? `E${row.seatStartEpoch}` : "?"} → {row.expirationEpoch ? `E${row.expirationEpoch}` : "?"}</span> });
    cols.push({ key: "accountability", label: "Score", align: "right", sortable: true, render: (row) => <Metric tone={scoreTone(row.accountability)} value={row.accountability} help={metricHelp.accountability(row, actorType, include)} label="How the accountability score is calculated" /> });
    return cols;
  }, [actorType, isDrep, isSpo, isCommittee, labels.one, alignmentLabel, include]);

  const sortOptions = [
    ["accountability", "Accountability score"], ["attendance", "Attendance"], ["consistency", alignmentLabel], ["abstainRate", "Abstain rate"],
    !isCommittee && ["transparencyScore", "Transparency"], !isCommittee && ["votingPowerAda", "Voting power"], isDrep && ["delegationRiskScore", "Delegation risk"], ["name", "Name"]
  ].filter(Boolean);

  return (
    <main className="shell page p-dash">
      <SnapshotBanner snapshotKey={snapshotKey} latestEpoch={meta?.latestEpoch} />
      <PageHeader eyebrow="Participants" title={labels.title} lead={labels.lead} actions={<LivePill enabled={!snapshotKey} generatedAt={meta?.generatedAt} />} />

      {query.isLoading ? (
        <div className="stack" aria-busy="true"><div className="c-stats"><Skeleton kind="card" count={4} /></div><Skeleton kind="row" count={8} /></div>
      ) : query.error ? (
        <Alert tone="danger" title="Could not load the dashboard.">{query.error.message}</Alert>
      ) : (
        <div className="stack--6">
          <StatGrid>
            <StatTile label={`Visible ${labels.title.toLowerCase()}`} value={rows.length.toLocaleString()} hint={`of ${actors.length.toLocaleString()} tracked`} />
            <StatTile label="Governance actions" value={Object.keys(proposalInfo).length.toLocaleString()} hint={selectedAction ? "1 selected" : includeActiveActions ? "active included" : "closed only"} />
            {!isCommittee ? <StatTile label="Total voting power" value={formatAdaCompact(power.total)} hint={`${formatAdaCompact(power.abstain)} auto-abstain`} /> : null}
            {!isCommittee ? <StatTile label="Active voting power" value={formatAdaCompact(power.active)} hint="excludes always-abstain" tone="accent" /> : null}
            {isCommittee ? <StatTile label="Active members" value={actors.filter((a) => String(a.status || "").toLowerCase() === "active").length} hint={`${actors.length} seats tracked`} /> : null}
          </StatGrid>

          {isDrep ? <DrepRegistrationCard /> : null}

          {isSpo && totalSpoVotes === 0 ? <Alert tone="info">No stake-pool governance votes were detected in the current snapshot. The SPO dashboard fills in when proposals include stake-pool votes.</Alert> : null}

          <Card className="p-dash__filters" pad>
            <div className="c-toolbar">
              <div className="c-search c-toolbar__grow">
                <span className="c-search__icon"><IconSearch size={16} /></span>
                <Input value={search} onChange={(e) => setParam("q", e.target.value)} placeholder={`Search ${labels.one.toLowerCase()} name or ID…`} aria-label={`Search ${labels.title}`} />
              </div>
              <Select value={sortBy} onChange={(e) => setParam("sort", e.target.value === "accountability" ? "" : e.target.value)} aria-label="Sort by">
                {sortOptions.map(([value, label]) => <option key={value} value={value}>Sort: {label}</option>)}
              </Select>
              <Select value={selectedAction} onChange={(e) => setParam("action", e.target.value)} aria-label="Governance action" className="p-dash__action-select">
                <option value="">All governance actions</option>
                {actionOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
              </Select>
              <Menu label="Governance types" trigger={({ props }) => <Button {...props}>{selectedTypes.length === 0 ? "All types" : `${selectedTypes.length} type${selectedTypes.length === 1 ? "" : "s"}`} <IconChevronDown size={14} /></Button>}>
                <div className="p-dash__type-menu">
                  {typeOptions.map((type) => <Checkbox key={type} label={type} checked={selectedTypes.includes(type)} onChange={(on) => setSelectedTypes((prev) => (on ? [...prev, type] : prev.filter((t) => t !== type)))} />)}
                  <div className="row" style={{ marginTop: 8 }}>
                    <Button size="sm" onClick={() => setSelectedTypes(typeOptions)}>All</Button>
                    <Button size="sm" onClick={() => setSelectedTypes([])}>Clear</Button>
                  </div>
                </div>
              </Menu>
            </div>
            {selectedTypes.length > 0 ? <div className="c-chips" style={{ marginTop: 10 }}>{selectedTypes.map((t) => <Chip key={t} active onClick={() => setSelectedTypes((prev) => prev.filter((x) => x !== t))} title="Remove">{t} ×</Chip>)}</div> : null}
            <Disclosure title="Score settings" className="p-dash__settings">
              <div className="p-dash__settings-grid">
                <label className="c-field">
                  <span className="c-field__label">Minimum attendance · {minAttendance}%</span>
                  <input className="c-range" type="range" min="0" max="100" value={minAttendance} onChange={(e) => setMinAttendance(Number(e.target.value))} />
                </label>
                <div className="p-dash__switches">
                  <Switch checked={includeActiveActions} onChange={setIncludeActiveActions} label="Count active actions" />
                  <Switch checked={include.attendance} onChange={setInc("attendance")} label="Attendance in score" />
                  {!isCommittee ? <Switch checked={include.transparency} onChange={setInc("transparency")} label="Transparency in score" /> : null}
                  <Switch checked={include.alignment} onChange={setInc("alignment")} label={`${alignmentLabel} in score`} />
                  {!isCommittee ? <Switch checked={include.responsiveness} onChange={setInc("responsiveness")} label="Responsiveness in score" /> : null}
                  {isDrep ? <Switch checked={include.delegationRisk} onChange={setInc("delegationRisk")} label="Delegation risk in score" /> : null}
                  {isCommittee ? <Switch checked={includePreviousMembers} onChange={setIncludePreviousMembers} label="Include previous members" /> : null}
                </div>
              </div>
            </Disclosure>
          </Card>

          <div className="p-dash__table">
            <DataTable
              columns={columns}
              rows={pagedRows}
              getRowKey={(row) => row.id}
              onRowClick={(row) => navigate(profilePath(row.id))}
              sort={{ key: sortBy, dir: sortDir }}
              onSortChange={(next) => {
                const nextParams = new URLSearchParams(params);
                if (next?.key && next.key !== "accountability") nextParams.set("sort", next.key); else nextParams.delete("sort");
                const defaultDir = next?.key === "name" ? "asc" : "desc";
                if (next?.dir && next.dir !== defaultDir) nextParams.set("dir", next.dir); else nextParams.delete("dir");
                setParams(nextParams, { replace: true });
              }}
              stickyFirst
              emptyMessage={`No ${labels.title.toLowerCase()} match the selected filters.`}
              caption={`${labels.title} accountability`}
              footer={!isCommittee && rows.length > 0 ? <Pagination page={currentPage} pageSize={pageSize} total={rows.length} onPage={setPage} onPageSize={setPageSize} pageSizes={PAGE_SIZES} /> : null}
            />
          </div>
        </div>
      )}
    </main>
  );
}
