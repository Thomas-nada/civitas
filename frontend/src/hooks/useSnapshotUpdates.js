import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * One shared EventSource to /api/events for the whole app. Every subscriber
 * is called on "snapshot-updated"; when the stream drops it reconnects with
 * backoff and, while disconnected, polls subscribers every `pollMs`.
 */
const state = { es: null, live: false, lastUpdatedAt: null, listeners: new Set(), watchers: new Set(), retryMs: 2000, pollTimer: null, reconnectTimer: null };

function notifyWatchers() {
  for (const w of state.watchers) w();
}
function emitUpdate() {
  for (const fn of state.listeners) { try { fn(); } catch { /* ignore */ } }
}

function startPolling(pollMs) {
  if (state.pollTimer) return;
  state.pollTimer = setInterval(() => { emitUpdate(); }, pollMs);
}
function stopPolling() {
  if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }
}

function connect(pollMs) {
  if (state.es || typeof EventSource === "undefined") return;
  const es = new EventSource("/api/events");
  state.es = es;
  es.onopen = () => {
    state.live = true;
    state.retryMs = 2000;
    stopPolling();
    notifyWatchers();
  };
  es.addEventListener("snapshot-updated", (e) => {
    try {
      const { updatedAt } = JSON.parse(e.data);
      state.lastUpdatedAt = new Date(updatedAt);
    } catch {
      state.lastUpdatedAt = new Date();
    }
    state.live = true;
    notifyWatchers();
    emitUpdate();
  });
  es.onerror = () => {
    es.close();
    state.es = null;
    state.live = false;
    notifyWatchers();
    startPolling(pollMs);
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = setTimeout(() => { if (state.listeners.size > 0 || state.watchers.size > 0) connect(pollMs); }, state.retryMs);
    state.retryMs = Math.min(60_000, state.retryMs * 2);
  };
}

function disconnectIfIdle() {
  if (state.listeners.size > 0 || state.watchers.size > 0) return;
  state.es?.close();
  state.es = null;
  state.live = false;
  stopPolling();
  clearTimeout(state.reconnectTimer);
}

function subscribeWatcher(cb) {
  state.watchers.add(cb);
  return () => { state.watchers.delete(cb); disconnectIfIdle(); };
}
const getSnapshotState = () => `${state.live ? 1 : 0}|${state.lastUpdatedAt ? state.lastUpdatedAt.getTime() : 0}`;

/**
 * @param {object}   opts
 * @param {() => void} [opts.onUpdate] Called when a fresh snapshot is published.
 * @param {boolean}  [opts.enabled=true] false for historical snapshot views.
 * @param {number}   [opts.pollMs=90000] Fallback polling interval while disconnected.
 */
export function useSnapshotUpdates({ onUpdate, enabled = true, pollMs = 90_000 } = {}) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const key = useSyncExternalStore(subscribeWatcher, getSnapshotState, () => "0|0");
  const [, live, last] = key.match(/^(\d)\|(\d+)$/) || [];
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const listener = () => { onUpdateRef.current?.(); setTick((t) => t + 1); };
    state.listeners.add(listener);
    connect(pollMs);
    return () => { state.listeners.delete(listener); disconnectIfIdle(); };
  }, [enabled, pollMs]);

  return {
    isLive: enabled && live === "1",
    lastUpdatedAt: Number(last) > 0 ? new Date(Number(last)) : null,
    updateCount: tick
  };
}
