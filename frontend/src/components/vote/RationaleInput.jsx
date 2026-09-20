// A vote's rationale, the way Civitas has always taken it: a URL to a
// document the DRep hosts, or text written here (Markdown, previewed) that
// the server uploads to IPFS as a CIP-100 document. The draft is
// { mode: "url" | "write", url, text }.
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { EMPTY_RATIONALE } from "../../services/voteTxService";

export default function RationaleInput({ value = EMPTY_RATIONALE, onChange, rows = 8, autoFocus = false }) {
  const [preview, setPreview] = useState(false);
  const draft = { ...EMPTY_RATIONALE, ...(value || {}) };
  const set = (patch) => onChange?.({ ...draft, ...patch });

  return (
    <div className="vote-rationale-section">
      <div className="vote-rationale-mode-toggle">
        <button type="button" className={`mode-btn${draft.mode === "url" ? " active" : ""}`} onClick={() => { set({ mode: "url" }); setPreview(false); }}>
          Provide URL
        </button>
        <button type="button" className={`mode-btn${draft.mode === "write" ? " active" : ""}`} onClick={() => { set({ mode: "write" }); setPreview(false); }}>
          Write rationale
        </button>
      </div>

      {draft.mode === "url" ? (
        <label className="vote-rationale-label">
          Rationale URL (optional)
          <input
            type="url"
            value={draft.url}
            onChange={(e) => set({ url: e.target.value })}
            placeholder="https://your-rationale.json  or  ipfs://Qm..."
          />
        </label>
      ) : (
        <div className="vote-rationale-write">
          <div className="vote-rationale-write-tabs">
            <button type="button" className={`mode-btn${!preview ? " active" : ""}`} onClick={() => setPreview(false)}>Write</button>
            <button type="button" className={`mode-btn${preview ? " active" : ""}`} onClick={() => setPreview(true)}>Preview</button>
            <span className="vote-rationale-write-hint">Markdown supported · uploaded to IPFS as CIP-100 JSON</span>
          </div>
          {preview ? (
            <div className="vote-rationale-preview">
              {draft.text.trim()
                ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.text}</ReactMarkdown>
                : <p className="muted">Nothing to preview yet.</p>}
            </div>
          ) : (
            <textarea
              className="vote-rationale-textarea"
              value={draft.text}
              onChange={(e) => set({ text: e.target.value })}
              placeholder="Write your rationale here... (Markdown supported)"
              rows={rows}
              autoFocus={autoFocus}
            />
          )}
        </div>
      )}
    </div>
  );
}
