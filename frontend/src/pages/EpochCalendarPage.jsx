import { useEffect, useMemo, useState } from "react";
import { useSeoMeta } from "../hooks/useSeoMeta";

// Cardano mainnet epoch timing. Shelley epoch 208 began 2020-07-29 21:44:51 UTC.
// Every epoch is exactly 5 days (432000 s), so boundaries keep the same time-of-day.
const SHELLEY_EPOCH_208_START_UNIX = 1596059091;
const EPOCH_SECONDS = 432000;
// Rewards earned during an epoch are distributed at the start of epoch + 2.
const REWARD_DELAY_EPOCHS = 2;

const epochStartMs = (e) => (SHELLEY_EPOCH_208_START_UNIX + (e - 208) * EPOCH_SECONDS) * 1000;
const epochAt = (ms) => 208 + Math.floor((ms / 1000 - SHELLEY_EPOCH_208_START_UNIX) / EPOCH_SECONDS);

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const fmtUtcTime = (ms) =>
  new Date(Math.round(ms / 60000) * 60000)
    .toLocaleTimeString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" });

// Map of local-date key -> epoch number for every epoch boundary in [startMs, endMs].
function epochBoundariesInRange(startMs, endMs) {
  const map = {};
  let e = epochAt(startMs) - 1;
  while (epochStartMs(e) <= endMs) {
    const bMs = epochStartMs(e);
    if (bMs >= startMs && bMs <= endMs) map[dayKey(new Date(bMs))] = e;
    e++;
  }
  return map;
}

// 42-cell (6 week) grid of local Date objects for the given month.
function buildMonthGrid(year, month) {
  const startDow = new Date(year, month, 1).getDay();
  const gridStart = new Date(year, month, 1 - startDow);
  return Array.from({ length: 42 }, (_, i) =>
    new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
}

function CountdownHeader({ now }) {
  const currentEpoch = epochAt(now);
  const endMs = epochStartMs(currentEpoch + 1);
  const remaining = Math.max(0, endMs - now);
  const totalSec = Math.floor(remaining / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const localStr = new Date(endMs).toLocaleString(undefined, {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const utcStr = new Date(endMs).toLocaleString("en-US", {
    timeZone: "UTC", weekday: "short", year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  const units = [
    { label: days === 1 ? "Day" : "Days", value: days },
    { label: hours === 1 ? "Hour" : "Hours", value: hours },
    { label: minutes === 1 ? "Minute" : "Minutes", value: minutes },
    { label: seconds === 1 ? "Second" : "Seconds", value: seconds },
  ];

  return (
    <div className="ec-countdown panel">
      <div className="ec-countdown-left">
        <h2 className="ec-countdown-title">Current Epoch {currentEpoch} ends:</h2>
        <div className="ec-countdown-times">
          <div><span className="ec-time-label">Local</span> {localStr}</div>
          <div><span className="ec-time-label">UTC</span> {utcStr} UTC</div>
        </div>
      </div>
      <div className="ec-countdown-units">
        {units.map((u) => (
          <div key={u.label} className="ec-unit">
            <div className="ec-unit-value">{u.value}</div>
            <div className="ec-unit-label">{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthGrid({ year, month, now, compact = false }) {
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const boundaries = useMemo(
    () => epochBoundariesInRange(cells[0].getTime(), cells[41].getTime() + 86400000),
    [cells]
  );
  const todayKey = dayKey(new Date(now));

  return (
    <div className={`ec-grid${compact ? " ec-grid-compact" : ""}`}>
      {WEEKDAYS.map((d) => (
        <div key={d} className="ec-weekday">{d}</div>
      ))}
      {cells.map((d, i) => {
        const inMonth = d.getMonth() === month;
        const isToday = dayKey(d) === todayKey;
        const epoch = boundaries[dayKey(d)];
        const isPast = epoch != null && epochStartMs(epoch) <= now;
        const stateClass = epoch == null ? "" : isPast ? " ec-cell-past" : " ec-cell-future";
        return (
          <div
            key={i}
            className={`ec-cell${inMonth ? "" : " ec-cell-out"}${isToday ? " ec-cell-today" : ""}${stateClass}`}
          >
            <span className="ec-daynum">{d.getDate()}</span>
            {isToday && epoch == null ? <div className="ec-today-tag">Today</div> : null}
            {epoch != null ? (
              <div className="ec-epoch">
                <div className="ec-epoch-num">Epoch <strong>{epoch}</strong></div>
                <div className="ec-epoch-time">{fmtUtcTime(epochStartMs(epoch))} UTC</div>
                <div className="ec-epoch-note">
                  Epoch {epoch - REWARD_DELAY_EPOCHS} rewards distributed
                </div>
                {isToday ? <div className="ec-today-inline">Today</div> : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function EpochCalendarPage() {
  useSeoMeta({
    title: "Epoch Calendar",
    description: "Cardano epoch boundaries, reward distribution dates, and a live countdown to the next epoch.",
  });

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [mode, setMode] = useState("month"); // "month" | "multi"

  function shiftMonth(delta) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }
  function goToday() {
    const d = new Date();
    setView({ year: d.getFullYear(), month: d.getMonth() });
  }

  const multiMonths = useMemo(() => {
    const span = mode === "multi" ? 3 : 1;
    return Array.from({ length: span }, (_, i) => {
      const d = new Date(view.year, view.month + i, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }, [view, mode]);

  return (
    <main className="shell ec-page">
      <CountdownHeader now={now} />

      <div className="ec-toolbar">
        <h1 className="ec-month-title">
          {mode === "multi"
            ? `${MONTHS[multiMonths[0].month].slice(0, 3)} – ${MONTHS[multiMonths[multiMonths.length - 1].month].slice(0, 3)} ${multiMonths[multiMonths.length - 1].year}`
            : `${MONTHS[view.month]} ${view.year}`}
        </h1>

        <div className="ec-mode-toggle">
          <button type="button" className={mode === "month" ? "active" : ""} onClick={() => setMode("month")}>Month</button>
          <button type="button" className={mode === "multi" ? "active" : ""} onClick={() => setMode("multi")}>Multi-Month</button>
        </div>

        <div className="ec-nav">
          <button type="button" className="ec-today-btn" onClick={goToday}>today</button>
          <div className="ec-arrows">
            <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}>‹</button>
            <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)}>›</button>
          </div>
        </div>
      </div>

      {multiMonths.map((m, i) => (
        <section key={`${m.year}-${m.month}`} className="ec-month-block">
          {mode === "multi" ? <h3 className="ec-multi-title">{MONTHS[m.month]} {m.year}</h3> : null}
          <MonthGrid year={m.year} month={m.month} now={now} compact={mode === "multi"} />
        </section>
      ))}

      <p className="ec-footnote muted">
        Epochs last 5 days and roll over at {fmtUtcTime(epochStartMs(epochAt(now) + 1))} UTC. Staking rewards earned
        during an epoch are distributed at the start of the epoch two cycles later.
      </p>
    </main>
  );
}
