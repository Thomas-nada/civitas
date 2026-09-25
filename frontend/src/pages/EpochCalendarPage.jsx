// Epoch calendar: a live countdown to the next boundary, a month grid with
// every epoch boundary and the governance events that land on it (from
// /api/v1/calendar), a detail panel for the selected epoch, and the Google
// Calendar feed. Events for the DRep you act as are marked as voted.
import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { WalletContext } from "../context/WalletContext";
import { useEffectiveDrepId } from "../hooks/useEffectiveDrepId";
import { useActor, useCalendar } from "../api/queries";
import { Alert, Button, Card, CopyButton, Disclosure, IconButton, KeyValue, Modal, PageHeader, Pill, Segmented, Skeleton, StatusPill } from "../ui";
import { IconArrowLeft, IconArrowRight, IconCalendar } from "../ui/icons";
import { EPOCH_DURATION_SECONDS, SHELLEY_EPOCH_START_UNIX, formatAdaCompact, formatPct } from "../lib/governance/format";

const REWARD_DELAY_EPOCHS = 2;
const epochStartMs = (e) => (SHELLEY_EPOCH_START_UNIX + (e - 208) * EPOCH_DURATION_SECONDS) * 1000;
const epochAt = (ms) => 208 + Math.floor((ms / 1000 - SHELLEY_EPOCH_START_UNIX) / EPOCH_DURATION_SECONDS);
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const EVENT_TYPES = ["submitted", "voting", "expires", "expired", "dropped", "ratified", "enacted"];
const DETAIL_RANK = { submitted: 1, voting: 2, expires: 3, expired: 4, dropped: 5, ratified: 6, enacted: 7 };
const PREVIEW_RANK = { expires: 1, expired: 2, dropped: 3, ratified: 4, enacted: 5, submitted: 6, voting: 7 };

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const fmtUtcTime = (ms) => new Date(Math.round(ms / 60000) * 60000).toLocaleTimeString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" });
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const compact = (value, max) => { const s = String(value || "").replace(/\s+/g, " ").trim(); return s.length > max ? `${s.slice(0, max - 1)}…` : s; };
const pctPair = (cur, req) => (req == null ? null : `${Number.isFinite(Number(cur)) ? Number(cur).toFixed(1) : "0.0"}% / ${Number(req).toFixed(0)}%`);

function ccPct(row) {
  const den = Math.max(row.ccEligibleCount || 0, (row.ccYes || 0) + (row.ccNo || 0) + (row.ccAbstain || 0), 1);
  return ((row.ccYes || 0) / den) * 100;
}
function percentages(row) {
  const parts = [
    row.drepRequiredPct != null ? `DRep ${pctPair(row.drepYesPowerPct, row.drepRequiredPct)}` : null,
    row.ccRequiredPct != null ? `CC ${pctPair(ccPct(row), row.ccRequiredPct)}` : null,
    row.spoRequiredPct != null ? `SPO ${pctPair(row.spoYesPct, row.spoRequiredPct)}` : null
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "no voting threshold";
}
function eventLabel(event, epoch) {
  const row = event.row;
  const name = compact(row.actionName || "Governance action", 96);
  const left = row.expirationEpoch ? Math.max(0, row.expirationEpoch - epoch) : null;
  const suffix = left == null ? "" : ` · expires in ${plural(left, "more epoch")}`;
  switch (event.type) {
    case "submitted": return `Submitted: ${name}`;
    case "voting": return `Voting: ${name} · ${percentages(row)}${suffix}`;
    case "expires": return `Expires: ${name} · ${percentages(row)}`;
    case "expired": return `Expired: ${name} · ${percentages(row)}`;
    case "dropped": return `Dropped: ${name} · ${percentages(row)}`;
    case "ratified": return `Ratified: ${name} · ${percentages(row)}`;
    case "enacted": return `Enacted: ${name}`;
    default: return name;
  }
}
function supportRows(row) {
  return [
    row.drepRequiredPct != null && { key: "drep", label: "DReps", current: row.drepYesPowerPct, required: row.drepRequiredPct, yes: formatAdaCompact(row.drepYesPowerAda), no: formatAdaCompact(row.drepNoSideAda), meta: `Active base ${formatAdaCompact(row.totalActiveStakeAda)}` },
    row.ccRequiredPct != null && { key: "cc", label: "Committee", current: ccPct(row), required: row.ccRequiredPct, yes: String(row.ccYes || 0), no: String(row.ccNo || 0), meta: `${(row.ccYes || 0) + (row.ccNo || 0) + (row.ccAbstain || 0)} of ${row.ccEligibleCount || 0} cast` },
    row.spoRequiredPct != null && { key: "spo", label: "SPOs", current: row.spoYesPct, required: row.spoRequiredPct, yes: formatAdaCompact(row.spoYesAda), no: formatAdaCompact(row.spoNoAda), meta: `Not voted ${formatAdaCompact(row.spoNotVotedAda)}` }
  ].filter(Boolean);
}
function summary(events) {
  const counts = {};
  for (const e of events) counts[e.type] = (counts[e.type] || 0) + 1;
  return [["expires", "expiring"], ["expired", "expired"], ["dropped", "dropped"], ["ratified", "ratified"], ["enacted", "enacted"], ["submitted", "submitted"], ["voting", "voting"]]
    .filter(([k]) => counts[k]).slice(0, 3).map(([k, w]) => `${counts[k]} ${w}`).join(" · ");
}
function previewEvents(events, limit) {
  const sorted = [...events].sort((a, b) => (PREVIEW_RANK[a.type] || 99) - (PREVIEW_RANK[b.type] || 99) || a.label.localeCompare(b.label));
  const picked = []; const used = new Set();
  for (const e of sorted) { if (picked.length >= limit) break; if (used.has(e.type)) continue; picked.push(e); used.add(e.type); }
  for (const e of sorted) { if (picked.length >= limit) break; if (!picked.includes(e)) picked.push(e); }
  return picked;
}
function monthGrid(year, month) {
  const startDow = new Date(year, month, 1).getDay();
  const first = new Date(year, month, 1 - startDow);
  return Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + i));
}
function boundariesInRange(startMs, endMs) {
  const map = {};
  for (let e = epochAt(startMs) - 1; epochStartMs(e) <= endMs; e += 1) {
    const ms = epochStartMs(e);
    if (ms >= startMs) map[dayKey(new Date(ms))] = e;
  }
  return map;
}

/* Countdown --------------------------------------------------------------- */
function Countdown({ now }) {
  const current = epochAt(now);
  const endMs = epochStartMs(current + 1);
  const total = Math.max(0, Math.floor((endMs - now) / 1000));
  const units = [["Days", Math.floor(total / 86400)], ["Hours", Math.floor((total % 86400) / 3600)], ["Minutes", Math.floor((total % 3600) / 60)], ["Seconds", total % 60]];
  const progress = ((now - epochStartMs(current)) / (EPOCH_DURATION_SECONDS * 1000)) * 100;
  return (
    <Card accent className="p-cal__countdown">
      <div className="p-cal__countdown-left">
        <div className="caps" style={{ color: "var(--color-accent)" }}>Current epoch</div>
        <div className="p-cal__epoch-big num">{current}</div>
        <div className="small muted">Ends {new Date(endMs).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} local · {fmtUtcTime(endMs)} UTC</div>
        <div className="c-bar" style={{ marginTop: 10 }}><span className="c-bar__seg c-bar__seg--accent" style={{ width: `${Math.min(100, progress)}%` }} /></div>
      </div>
      <div className="p-cal__units" role="timer" aria-label="Time until the next epoch">
        {units.map(([label, value]) => <div key={label} className="p-cal__unit"><span className="num">{String(value).padStart(2, "0")}</span><span>{label}</span></div>)}
      </div>
    </Card>
  );
}

/* Event modal ------------------------------------------------------------- */
function EventModal({ event, onClose }) {
  const row = event?.row;
  return (
    <Modal open={Boolean(event)} onClose={onClose} title={row?.actionName || "Governance action"} size="lg" footer={event ? <div className="row row--end"><Button onClick={onClose}>Close</Button><Button variant="primary" to={`/actions/${encodeURIComponent(row.proposalId)}`}>Open governance action</Button></div> : null}>
      {event ? (
        <div className="stack">
          <div className="row">
            <Pill tone="neutral" className={`p-cal__type p-cal__type--${event.type}`}>{event.type}</Pill>
            {event.voted ? <Pill tone="success" size="sm">✓ Your DRep voted</Pill> : null}
            <span className="small muted">{row.governanceType}</span>
            {row.status ? <StatusPill status={row.status} size="sm" /> : null}
          </div>
          <p className="small">{event.label}</p>
          {supportRows(row).length > 0 ? (
            <div className="grid grid--3">
              {supportRows(row).map((s) => (
                <div key={s.key} className="c-card c-card--soft c-card--pad">
                  <div className="row row--between"><strong>{s.label}</strong><span className="num small">{formatPct(s.current, 1)} / {formatPct(s.required, 0)}</span></div>
                  <div className="c-bar" style={{ margin: "8px 0" }}><span className="c-bar__seg c-bar__seg--yes" style={{ width: `${Math.max(0, Math.min(100, Number(s.current) || 0))}%` }} /><span className="c-bar__marker" style={{ left: `${Math.min(100, Number(s.required) || 0)}%` }} /></div>
                  <div className="row row--between tiny"><span style={{ color: "var(--color-vote-yes)" }}>Yes {s.yes}</span><span style={{ color: "var(--color-vote-no)" }}>No side {s.no}</span></div>
                  <div className="tiny muted" style={{ marginTop: 4 }}>{s.meta}</div>
                </div>
              ))}
            </div>
          ) : <p className="muted small">No voting threshold is available for this action.</p>}
          <KeyValue items={[
            ["Submitted", row.submittedEpoch ? `Epoch ${row.submittedEpoch}` : "Unknown"],
            ["Expires", row.expirationEpoch ? `Epoch ${row.expirationEpoch}` : "Unknown"],
            ["Ratified", row.ratifiedEpoch ? `Epoch ${row.ratifiedEpoch}` : "Not yet"],
            ["Enacted", row.enactedEpoch ? `Epoch ${row.enactedEpoch}` : String(row.governanceType || "").toLowerCase().includes("info") ? "N/A" : "Not yet"]
          ]} />
        </div>
      ) : null}
    </Modal>
  );
}

/* Month grid -------------------------------------------------------------- */
function MonthGrid({ year, month, now, eventsByEpoch, selectedEpoch, onSelect, onOpenEvent, onOpenEpoch, compactCells }) {
  const cells = useMemo(() => monthGrid(year, month), [year, month]);
  const boundaries = useMemo(() => boundariesInRange(cells[0].getTime(), cells[41].getTime() + 86400000), [cells]);
  const todayKey = dayKey(new Date(now));
  return (
    <div className={`p-cal__grid${compactCells ? " p-cal__grid--compact" : ""}`} role="grid" aria-label={`${MONTHS[month]} ${year}`}>
      {WEEKDAYS.map((d) => <div key={d} className="p-cal__weekday" role="columnheader">{d}</div>)}
      {cells.map((d, i) => {
        const inMonth = d.getMonth() === month;
        const isToday = dayKey(d) === todayKey;
        const epoch = boundaries[dayKey(d)];
        const events = epoch != null ? eventsByEpoch.get(epoch) || [] : [];
        const isPast = epoch != null && epochStartMs(epoch) <= now;
        const preview = previewEvents(events, compactCells ? 2 : 3);
        const cls = ["p-cal__cell", !inMonth && "is-out", isToday && "is-today", epoch != null && (isPast ? "is-past" : "is-future"), epoch === selectedEpoch && "is-selected", epoch != null && "is-epoch"].filter(Boolean).join(" ");
        return (
          <div key={i} className={cls} role={epoch != null ? "button" : "gridcell"} tabIndex={epoch != null ? 0 : undefined} onClick={epoch != null ? () => onSelect(epoch) : undefined} onKeyDown={epoch != null ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(epoch); } } : undefined} aria-label={epoch != null ? `Epoch ${epoch} boundary, ${plural(events.length, "event")}` : undefined}>
            <span className="p-cal__daynum num"><span><span className="p-cal__dow">{WEEKDAYS[d.getDay()]} {MONTHS[d.getMonth()].slice(0, 3)} </span>{d.getDate()}</span>{isToday ? <span className="p-cal__today">today</span> : null}</span>
            {epoch != null ? (
              <div className="p-cal__epoch">
                <div className="p-cal__epoch-num">Epoch <strong>{epoch}</strong> <span className="muted">{fmtUtcTime(epochStartMs(epoch))} UTC</span></div>
                {!compactCells ? <div className="tiny muted">Epoch {epoch - REWARD_DELAY_EPOCHS} rewards paid</div> : null}
                {events.length > 0 ? (
                  <div className="p-cal__events">
                    {summary(events) ? <div className="tiny muted">{summary(events)}</div> : null}
                    {preview.map((event, idx) => (
                      <button type="button" key={`${event.row.proposalId}-${event.type}-${idx}`} className={`p-cal__chip p-cal__chip--${event.type}${event.voted ? " is-voted" : ""}`} onClick={(e) => { e.stopPropagation(); onOpenEvent(event); }} title={event.label}>
                        {event.voted ? "✓ " : ""}{compact(event.label, compactCells ? 30 : 46)}
                      </button>
                    ))}
                    {events.length > preview.length ? <button type="button" className="p-cal__more" onClick={(e) => { e.stopPropagation(); onSelect(epoch); onOpenEpoch(epoch); }}>+{events.length - preview.length} more</button> : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* Page -------------------------------------------------------------------- */
export default function EpochCalendarPage() {
  useSeoMeta({ title: "Epoch Calendar", description: "Cardano epoch boundaries, reward distribution dates, and a live countdown to the next epoch." });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [mode, setMode] = useState("month");
  const [selectedEpoch, setSelectedEpoch] = useState(() => epochAt(Date.now()));
  const [openEvent, setOpenEvent] = useState(null);
  const [openEpoch, setOpenEpoch] = useState(null);
  const [feedOpen, setFeedOpen] = useState(false);
  const feedUrl = `${window.location.origin}/api/epoch-calendar.ics`;

  const months = useMemo(() => Array.from({ length: mode === "multi" ? 3 : 1 }, (_, i) => { const d = new Date(view.year, view.month + i, 1); return { year: d.getFullYear(), month: d.getMonth() }; }), [view, mode]);
  const [fromEpoch, toEpoch, visibleEpochs] = useMemo(() => {
    const first = months[0]; const last = months[months.length - 1];
    const start = new Date(first.year, first.month, 1).getTime();
    const end = new Date(last.year, last.month + 1, 0, 23, 59, 59, 999).getTime();
    const list = [];
    for (let e = epochAt(start) - 1; epochStartMs(e) <= end; e += 1) if (epochStartMs(e) >= start) list.push(e);
    return [list[0] ?? epochAt(start), list[list.length - 1] ?? epochAt(end), list];
  }, [months]);

  const calendar = useCalendar(fromEpoch, toEpoch);
  const wallet = useContext(WalletContext);
  const drepId = useEffectiveDrepId(wallet);
  const myDrep = useActor("drep", drepId || "");
  const votedIds = useMemo(() => new Set((myDrep.data?.actor?.votes || []).map((v) => v.proposalId)), [myDrep.data]);

  const eventsByEpoch = useMemo(() => {
    const map = new Map();
    for (const [epoch, events] of Object.entries(calendar.data?.epochs || {})) {
      const e = Number(epoch);
      const list = events.map((event) => ({ ...event, label: eventLabel(event, e), voted: votedIds.has(event.row.proposalId) }));
      list.sort((a, b) => (DETAIL_RANK[a.type] || 99) - (DETAIL_RANK[b.type] || 99) || a.label.localeCompare(b.label));
      map.set(e, list);
    }
    return map;
  }, [calendar.data, votedIds]);

  const effectiveEpoch = visibleEpochs.includes(selectedEpoch) ? selectedEpoch : visibleEpochs[0] || selectedEpoch;
  const selectedEvents = eventsByEpoch.get(effectiveEpoch) || [];
  const visibleCount = visibleEpochs.reduce((sum, e) => sum + (eventsByEpoch.get(e)?.length || 0), 0);
  const shiftMonth = (delta) => setView((v) => { const d = new Date(v.year, v.month + delta, 1); return { year: d.getFullYear(), month: d.getMonth() }; });
  const goToday = () => { const d = new Date(); setView({ year: d.getFullYear(), month: d.getMonth() }); setSelectedEpoch(epochAt(Date.now())); };
  const onLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const title = mode === "multi" ? `${MONTHS[months[0].month].slice(0, 3)} – ${MONTHS[months[months.length - 1].month].slice(0, 3)} ${months[months.length - 1].year}` : `${MONTHS[view.month]} ${view.year}`;
  const grouped = EVENT_TYPES.map((type) => [type, selectedEvents.filter((e) => e.type === type)]).filter(([, list]) => list.length);

  return (
    <main className="shell page p-cal">
      <PageHeader eyebrow="Insights" title="Epoch calendar" lead="Every epoch boundary with the governance actions submitted, voting, expiring or enacted on it." actions={<Button icon={<IconCalendar size={16} />} onClick={() => setFeedOpen(true)}>Google Calendar feed</Button>} />
      <div className="stack--6">
        <Countdown now={now} />

        <div className="p-cal__toolbar">
          <h2 className="p-cal__title">{title}</h2>
          <Segmented ariaLabel="Calendar span" value={mode} onChange={setMode} options={[{ value: "month", label: "Month" }, { value: "multi", label: "3 months" }]} />
          <div className="row">
            <Button size="sm" onClick={goToday}>Today</Button>
            <IconButton size="sm" label="Previous month" onClick={() => shiftMonth(-1)}><IconArrowLeft size={16} /></IconButton>
            <IconButton size="sm" label="Next month" onClick={() => shiftMonth(1)}><IconArrowRight size={16} /></IconButton>
          </div>
        </div>
        <div className="p-cal__legend" aria-label="Event legend">{EVENT_TYPES.map((t) => <span key={t} className="c-legend__item"><span className={`p-cal__swatch p-cal__swatch--${t}`} />{t}</span>)}</div>
        {calendar.error ? <Alert tone="warning">Live action data is unavailable: {calendar.error.message}</Alert> : null}

        {months.map((m) => (
          <section key={`${m.year}-${m.month}`}>
            {mode === "multi" ? <h3 className="p-cal__month-title">{MONTHS[m.month]} {m.year}</h3> : null}
            {calendar.isLoading ? <Skeleton kind="card" /> : (
              <MonthGrid year={m.year} month={m.month} now={now} eventsByEpoch={eventsByEpoch} selectedEpoch={effectiveEpoch} onSelect={setSelectedEpoch} onOpenEvent={setOpenEvent} onOpenEpoch={setOpenEpoch} compactCells={mode === "multi"} />
            )}
          </section>
        ))}

        <Card title={`Epoch ${effectiveEpoch}`} subtitle={`Starts ${new Date(epochStartMs(effectiveEpoch)).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} local · ${fmtUtcTime(epochStartMs(effectiveEpoch))} UTC`} actions={<Pill tone="neutral">{plural(selectedEvents.length, "event")}</Pill>}>
          {grouped.length === 0 ? <p className="muted">No governance action events land on this epoch boundary.</p> : grouped.map(([type, list]) => (
            <Disclosure key={type} defaultOpen title={<span className="row" style={{ gap: 8 }}><span className={`p-cal__swatch p-cal__swatch--${type}`} />{type} <span className="muted">({list.length})</span></span>}>
              <div className="p-cal__list">
                {list.map((event, idx) => (
                  <button type="button" key={`${event.row.proposalId}-${idx}`} className={`p-cal__item p-cal__item--${event.type}`} onClick={() => setOpenEvent(event)}>
                    <span className="p-cal__item-label">{event.label}</span>
                    {event.voted ? <Pill tone="success" size="sm">✓ Voted</Pill> : null}
                  </button>
                ))}
              </div>
            </Disclosure>
          ))}
        </Card>

        <p className="tiny muted">
          Epochs last 5 days and are shown as boundary points at {fmtUtcTime(epochStartMs(epochAt(now) + 1))} UTC. Staking rewards earned during an epoch are paid at the start of the epoch two cycles later.
          {" "}{calendar.data ? `${visibleCount} action ${visibleCount === 1 ? "event" : "events"} in this view, positions as they stood at each boundary.` : ""}
        </p>
      </div>

      <EventModal event={openEvent} onClose={() => setOpenEvent(null)} />
      <Modal open={openEpoch != null} onClose={() => setOpenEpoch(null)} title={`Epoch ${openEpoch}: all events`}>
        <div className="p-cal__list">
          {(eventsByEpoch.get(openEpoch) || []).map((event, idx) => (
            <button type="button" key={`${event.row.proposalId}-${idx}`} className={`p-cal__item p-cal__item--${event.type}`} onClick={() => { setOpenEpoch(null); setOpenEvent(event); }}>
              <span className={`p-cal__swatch p-cal__swatch--${event.type}`} /><span className="p-cal__item-label">{event.label}</span>{event.voted ? <Pill tone="success" size="sm">✓ Voted</Pill> : null}
            </button>
          ))}
        </div>
      </Modal>
      <Modal open={feedOpen} onClose={() => setFeedOpen(false)} title="Google Calendar feed" footer={<div className="row row--end"><Button onClick={() => setFeedOpen(false)}>Done</Button><Button variant="primary" href="https://calendar.google.com/calendar/u/0/r/settings/addbyurl" target="_blank" rel="noreferrer">Open Google Calendar</Button></div>}>
        <div className="stack">
          <p className="small muted">Subscribe to the live feed and Google keeps your calendar mirrored every epoch. {onLocalhost ? "Google's servers cannot reach localhost, so use the deployed Civitas URL for a live subscription." : ""}</p>
          <div className="row" style={{ flexWrap: "nowrap" }}><input className="c-input mono" readOnly value={feedUrl} onFocus={(e) => e.currentTarget.select()} aria-label="Feed URL" /><CopyButton value={feedUrl} label="Copy feed URL" variant="default">Copy</CopyButton></div>
          <ol className="c-prose small" style={{ margin: 0 }}>
            <li>In Google Calendar, open <strong>Other calendars</strong> and choose <strong>From URL</strong>.</li>
            <li>Paste the feed URL into the calendar address field.</li>
            <li>Click <strong>Add calendar</strong>. Google refreshes the feed on its own.</li>
          </ol>
          <p className="tiny muted">Prefer a one-time import? <a href={feedUrl} download="cardano-epoch-calendar.ics">Download the .ics file</a>. <Link to="/actions">All actions</Link></p>
        </div>
      </Modal>
    </main>
  );
}
