// React Query hooks for the Civitas API. One cache shared across routes; the
// SSE "snapshot-updated" event invalidates everything under ["v1"] so pages
// refresh with a revalidated (304 when unchanged) request instead of a
// full re-download.

import { useMemo } from "react";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { fetchJson, withSnapshot } from "./client";
import { unpackActors, unpackRationaleIndex } from "./unpack";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export function invalidateSnapshotQueries() {
  return queryClient.invalidateQueries({ queryKey: ["v1"] });
}

const key = (name, snapshotKey, ...rest) => ["v1", name, snapshotKey || "", ...rest];

export function useMeta(snapshotKey = "") {
  return useQuery({ queryKey: key("meta", snapshotKey), queryFn: ({ signal }) => fetchJson(withSnapshot("/api/v1/meta", snapshotKey), { signal }) });
}

export function useActions(snapshotKey = "") {
  return useQuery({ queryKey: key("actions", snapshotKey), queryFn: ({ signal }) => fetchJson(withSnapshot("/api/v1/actions", snapshotKey), { signal }) });
}

export function useAction(proposalId, snapshotKey = "") {
  return useQuery({
    queryKey: key("action", snapshotKey, proposalId),
    enabled: Boolean(proposalId),
    queryFn: ({ signal }) => fetchJson(withSnapshot(`/api/v1/actions/${encodeURIComponent(proposalId)}`, snapshotKey), { signal })
  });
}

export function useActors(type, snapshotKey = "") {
  const query = useQuery({
    queryKey: key("actors", snapshotKey, type),
    enabled: Boolean(type),
    queryFn: ({ signal }) => fetchJson(withSnapshot(`/api/v1/actors/${type}`, snapshotKey), { signal })
  });
  const unpacked = useMemo(() => (query.data ? unpackActors(query.data) : null), [query.data]);
  return { ...query, unpacked, meta: query.data?.meta || null };
}

export function useActor(type, actorId, snapshotKey = "") {
  return useQuery({
    queryKey: key("actor", snapshotKey, type, actorId),
    enabled: Boolean(type && actorId),
    queryFn: ({ signal }) => fetchJson(withSnapshot(`/api/v1/actors/${type}/${encodeURIComponent(actorId)}`, snapshotKey), { signal })
  });
}

export function useRationalesIndex(snapshotKey = "") {
  const query = useQuery({ queryKey: key("rationales", snapshotKey), queryFn: ({ signal }) => fetchJson(withSnapshot("/api/v1/rationales/index", snapshotKey), { signal }) });
  const unpacked = useMemo(() => (query.data ? unpackRationaleIndex(query.data) : null), [query.data]);
  return { ...query, unpacked };
}

export function useStats(snapshotKey = "") {
  return useQuery({ queryKey: key("stats", snapshotKey), queryFn: ({ signal }) => fetchJson(withSnapshot("/api/v1/stats", snapshotKey), { signal }) });
}

export function useDrepSearch(q) {
  const term = String(q || "").trim();
  return useQuery({
    queryKey: ["drep-search", term.toLowerCase()],
    enabled: term.length >= 2,
    staleTime: 5 * 60_000,
    queryFn: ({ signal }) => fetchJson(`/api/v1/search/dreps?q=${encodeURIComponent(term)}`, { signal })
  });
}

export function useDelegationTrend(epochs) {
  return useQuery({
    queryKey: ["delegation-trend", epochs],
    staleTime: 10 * 60_000,
    queryFn: ({ signal }) => fetchJson(`/api/drep-delegation-trend?epochs=${encodeURIComponent(epochs)}`, { signal })
  });
}

export function useDelegationHistory(drepId) {
  return useQuery({
    queryKey: ["delegation-history", drepId],
    enabled: Boolean(drepId),
    staleTime: 10 * 60_000,
    queryFn: ({ signal }) => fetchJson(`/api/drep-delegation-history?id=${encodeURIComponent(drepId)}`, { signal })
  });
}

export function useSyncStatus(options = {}) {
  return useQuery({ queryKey: ["sync-status"], queryFn: ({ signal }) => fetchJson("/api/sync-status", { signal }), staleTime: 10_000, ...options });
}

export function useSurveyLinks() {
  return useQuery({ queryKey: ["surveys", "links"], queryFn: ({ signal }) => fetchJson("/api/surveys/links", { signal }).catch(() => ({})), staleTime: 5 * 60_000 });
}

/** Live on-chain DRep record (current power, metadata verification). Cached 5 minutes server-side. */
export function useDrepLive(drepId, options = {}) {
  return useQuery({
    queryKey: ["drep-live", drepId],
    enabled: Boolean(drepId) && options.enabled !== false,
    staleTime: 5 * 60_000,
    retry: 0,
    queryFn: ({ signal }) => fetchJson(`/api/drep-live?id=${encodeURIComponent(drepId)}`, { signal })
  });
}

/** Stake keys delegating to a DRep. Cached 15 minutes server-side. */
export function useDrepDelegators(drepId, options = {}) {
  return useQuery({
    queryKey: ["drep-delegators", drepId],
    enabled: Boolean(drepId) && options.enabled !== false,
    staleTime: 15 * 60_000,
    retry: 0,
    queryFn: ({ signal }) => fetchJson(`/api/drep-delegators?id=${encodeURIComponent(drepId)}`, { signal })
  });
}

/** Governance events per epoch boundary for the calendar. */
export function useCalendar(fromEpoch, toEpoch, snapshotKey = "") {
  return useQuery({
    queryKey: key("calendar", snapshotKey, fromEpoch, toEpoch),
    enabled: Number.isFinite(fromEpoch) && Number.isFinite(toEpoch),
    placeholderData: (prev) => prev,
    queryFn: ({ signal }) => fetchJson(withSnapshot(`/api/v1/calendar?from=${fromEpoch}&to=${toEpoch}`, snapshotKey), { signal })
  });
}

/* Treasury -------------------------------------------------------------- */
export function useTreasury() {
  // Snapshot-derived, so it lives under the ["v1"] key and revalidates on publish.
  return useQuery({ queryKey: key("treasury", ""), queryFn: ({ signal }) => fetchJson("/api/treasury", { signal }) });
}
export function useTreasuryAdmin() {
  return useQuery({ queryKey: ["treasury-admin"], staleTime: 5 * 60_000, retry: 0, queryFn: ({ signal }) => fetchJson("/api/treasury-admin", { signal }) });
}
export function useTreasuryAdminEvents(limit = 80) {
  return useQuery({ queryKey: ["treasury-admin", "events", limit], staleTime: 5 * 60_000, retry: 0, queryFn: ({ signal }) => fetchJson(`/api/treasury-admin/events?limit=${limit}`, { signal }) });
}
export function useTreasuryProject(projectId) {
  return useQuery({ queryKey: ["treasury-admin", "project", projectId], enabled: Boolean(projectId), staleTime: 5 * 60_000, retry: 0, queryFn: ({ signal }) => fetchJson(`/api/treasury-admin/project?id=${encodeURIComponent(projectId)}`, { signal }) });
}
export function useTreasuryMapping() {
  return useQuery({ queryKey: ["treasury-admin", "mapping"], staleTime: 5 * 60_000, retry: 0, queryFn: ({ signal }) => fetchJson("/api/treasury-admin/mapping", { signal }) });
}
