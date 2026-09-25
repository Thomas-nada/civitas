// The rationale behind one vote, fetched through /api/vote-rationale (which
// resolves the anchor URL or the vote transaction's metadata) and rendered as
// Markdown. Loaded documents are cached for the session.
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchJson } from "../api/client";
import MetaVerifyPill from "./MetaVerifyPill";
import { Alert, Modal, Skeleton } from "../ui";

const cache = new Map();

export function rationaleKey(item) {
  return [item?.proposalId, item?.voterRole, item?.voterId, item?.voteTxHash || item?.rationaleUrl || ""].join("|");
}

async function loadRationale(item) {
  const key = rationaleKey(item);
  if (cache.has(key)) return cache.get(key);
  const params = new URLSearchParams();
  if (item.rationaleUrl) params.set("url", item.rationaleUrl);
  if (item.voteTxHash) params.set("voteTxHash", item.voteTxHash);
  params.set("proposalId", item.proposalId || "");
  params.set("voterId", item.voterId || "");
  params.set("voterRole", item.voterRole || "");
  const promise = fetchJson(`/api/vote-rationale?${params.toString()}`).then((d) => ({
    text: String(d?.rationaleText || "").trim(),
    sections: Array.isArray(d?.rationaleSections) ? d.rationaleSections.filter((s) => s?.title && s?.text) : [],
    image: String(d?.authorImageUrl || "").trim(),
    verification: d?.metadataVerification || null
  })).catch((e) => { cache.delete(key); throw e; });
  cache.set(key, promise);
  return promise;
}

/**
 * item: { proposalId, voterId, voterRole ("drep" | "stake_pool" | "constitutional_committee"),
 *         voteTxHash, rationaleUrl, title, subtitle }
 */
export default function RationaleModal({ item, onClose }) {
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    if (!item) return undefined;
    let alive = true;
    setState({ loading: true });
    loadRationale(item)
      .then((data) => { if (alive) setState({ loading: false, ...data }); })
      .catch((e) => { if (alive) setState({ loading: false, error: e?.message || "Failed to load the rationale." }); });
    return () => { alive = false; };
  }, [item]);

  return (
    <Modal open={Boolean(item)} onClose={onClose} title={item?.title || "Vote rationale"} size="lg">
      {item ? (
        <div className="stack">
          {item.subtitle ? <p className="c-hash break">{item.subtitle}</p> : null}
          {state.loading ? <Skeleton kind="text" count={6} /> : state.error ? <Alert tone="danger">{state.error}</Alert> : (
            <div className="c-prose">
              {state.verification ? <MetaVerifyPill verification={state.verification} style={{ marginBottom: 12 }} /> : null}
              {state.text ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.text}</ReactMarkdown>
                : state.sections?.length ? state.sections.map((s, i) => <section key={i}><h3>{s.title}</h3>{String(s.text).split(/\n\n+/).map((chunk, j) => <p key={j}>{chunk.trim()}</p>)}</section>)
                : <p className="muted">No rationale body text available.</p>}
              {state.image ? <figure style={{ margin: "16px 0 0" }}><figcaption className="tiny muted">Signature</figcaption><img src={state.image} alt="Author signature" style={{ maxHeight: 120 }} /></figure> : null}
            </div>
          )}
          {item.rationaleUrl ? <a className="small mono break" href={item.rationaleUrl} target="_blank" rel="noreferrer">{item.rationaleUrl}</a> : null}
        </div>
      ) : null}
    </Modal>
  );
}
