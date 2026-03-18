import { useEffect, useRef, useState } from "react";

/**
 * Opens an SSE connection to /api/events and calls onUpdate() whenever a
 * "snapshot-updated" event arrives. Falls back to polling if SSE fails or
 * is unsupported.
 *
 * @param {object}   opts
 * @param {() => void} opts.onUpdate   Called when a fresh snapshot is available.
 * @param {boolean}  [opts.enabled=true] Set to false to disable (e.g. historical snapshot views).
 * @param {number}   [opts.pollMs=90000] Fallback polling interval in ms (default 90 seconds).
 */
export function useSnapshotUpdates({ onUpdate, enabled = true, pollMs = 90_000 }) {
  const [isLive, setIsLive] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled) return;
    if (typeof EventSource === "undefined") return;

    let es;
    let pollTimer;

    function startPolling() {
      setIsLive(false);
      pollTimer = setInterval(() => {
        onUpdateRef.current();
        setLastUpdatedAt(new Date());
      }, pollMs);
    }

    function connect() {
      es = new EventSource("/api/events");

      // Mark as live as soon as the connection opens — we're connected to
      // the server's event stream even if no snapshot update has fired yet.
      es.onopen = () => {
        setIsLive(true);
      };

      es.addEventListener("snapshot-updated", (e) => {
        try {
          const { updatedAt } = JSON.parse(e.data);
          setLastUpdatedAt(new Date(updatedAt));
        } catch {
          setLastUpdatedAt(new Date());
        }
        setIsLive(true);
        onUpdateRef.current();
      });

      es.onerror = () => {
        es.close();
        setIsLive(false);
        startPolling();
      };
    }

    connect();
    return () => {
      es?.close();
      clearInterval(pollTimer);
    };
  }, [enabled, pollMs]);

  return { isLive, lastUpdatedAt };
}
