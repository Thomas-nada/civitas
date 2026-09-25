import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSnapshotUpdates } from "../hooks/useSnapshotUpdates";
import { formatRelative } from "../lib/governance/format";

/** "Live · updated 2 minutes ago" pill, or a connecting state. */
export function LivePill({ enabled = true, generatedAt }) {
  const { isLive, lastUpdatedAt } = useSnapshotUpdates({ enabled });
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  if (!enabled) return null;
  const when = lastUpdatedAt || (generatedAt ? new Date(generatedAt) : null);
  return (
    <span className={`live-pill${isLive ? " is-live" : ""}`} title={isLive ? "Receiving live updates" : "Reconnecting to live updates"}>
      <span className={`c-dot${isLive ? " c-dot--live" : ""}`} />
      {isLive ? "Live" : "Connecting"}
      {when ? <span className="muted">· updated {formatRelative(when)}</span> : null}
    </span>
  );
}

/** Banner shown on every data page when viewing a historical snapshot. */
export function SnapshotBanner({ snapshotKey, latestEpoch, backTo }) {
  if (!snapshotKey) return null;
  return (
    <div className="snapshot-banner" role="status">
      <span>
        Viewing historical snapshot <b className="mono">{snapshotKey}</b>{latestEpoch ? <> (epoch {latestEpoch})</> : null}. Live updates are paused.
      </span>
      <Link to={backTo || window.location.pathname} className="c-btn c-btn--sm">Back to live data</Link>
    </div>
  );
}
