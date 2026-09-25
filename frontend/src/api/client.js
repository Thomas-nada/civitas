// Thin fetch wrapper for the Civitas API. The browser handles ETag
// revalidation itself (the server answers 304); this just parses JSON and
// turns HTTP errors into exceptions with the server's message.

export const API_BASE = "";

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function fetchJson(path, { signal, method = "GET", body, headers } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    signal,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(headers || {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data);
  return data;
}

export function withSnapshot(path, snapshotKey) {
  if (!snapshotKey) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}snapshot=${encodeURIComponent(snapshotKey)}`;
}
