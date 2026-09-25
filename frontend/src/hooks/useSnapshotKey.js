import { useSearchParams } from "react-router-dom";

/** The ?snapshot=<epoch-NNN.json> historical key, read reactively. */
export function useSnapshotKey() {
  const [params] = useSearchParams();
  return params.get("snapshot") || "";
}

/** Appends the current snapshot key to an in-app path so history views stay in history. */
export function withSnapshotParam(path, snapshotKey) {
  if (!snapshotKey) return path;
  return `${path}${path.includes("?") ? "&" : "?"}snapshot=${encodeURIComponent(snapshotKey)}`;
}
