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

export function useStatsBundle(snapshotKey = "") {
  const query = useQuery({ queryKey: key("stats", snapshotKey), queryFn: ({ signal }) => fetchJson(withSnapshot("/api/v1/stats", snapshotKey), { signal }) });
  const unpacked = useMemo(() => {
    if (!query.data) return null;
    const d = query.data;
    const packing = d.packing;
    const unpack = (actors) => unpackActors({ proposals: d.proposals, actors, packing }).actors;
    return {
      meta: d.meta,
      proposals: d.proposals,
      actions: d.actions,
      dreps: unpack(d.dreps),
      spos: unpack(d.spos),
      committee: unpack(d.committee)
    };
  }, [query.data]);
  return { ...query, unpacked };
}

export function useSyncStatus(options = {}) {
  return useQuery({ queryKey: ["sync-status"], queryFn: ({ signal }) => fetchJson("/api/sync-status", { signal }), staleTime: 10_000, ...options });
}

export function useSurveyLinks() {
  return useQuery({ queryKey: ["surveys", "links"], queryFn: ({ signal }) => fetchJson("/api/surveys/links", { signal }).catch(() => ({})), staleTime: 5 * 60_000 });
}
