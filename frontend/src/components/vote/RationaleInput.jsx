// A vote's rationale: a URL to a document the DRep hosts, or text written
// here (Markdown, previewed) that the server uploads to IPFS as a CIP-100
// document. The draft is { mode: "url" | "write", url, text }.
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { EMPTY_RATIONALE } from "../../services/voteTxService";
import { Field, Input, Segmented, Textarea } from "../../ui";

export default function RationaleInput({ value = EMPTY_RATIONALE, onChange, rows = 8, autoFocus = false }) {
  const [preview, setPreview] = useState(false);
  const draft = { ...EMPTY_RATIONALE, ...(value || {}) };
  const set = (patch) => onChange?.({ ...draft, ...patch });

  return (
    <div className="stack--2" style={{ display: "grid", gap: 8 }}>
      <Segmented
        ariaLabel="Rationale"
        value={draft.mode}
        onChange={(mode) => { set({ mode }); setPreview(false); }}
        options={[{ value: "url", label: "Provide URL" }, { value: "write", label: "Write rationale" }]}
      />
      {draft.mode === "url" ? (
        <Field label="Rationale URL (optional)">{(id) => (
          <Input id={id} type="url" value={draft.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://your-rationale.json or ipfs://Qm…" />
        )}</Field>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <div className="row row--between">
            <Segmented ariaLabel="Editor mode" value={preview ? "preview" : "write"} onChange={(m) => setPreview(m === "preview")} options={[{ value: "write", label: "Write" }, { value: "preview", label: "Preview" }]} />
            <span className="tiny muted">Markdown supported · uploaded to IPFS as CIP-100 JSON</span>
          </div>
          {preview ? (
            <div className="c-card c-card--soft c-card--pad c-prose">
              {draft.text.trim() ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.text}</ReactMarkdown> : <p className="muted">Nothing to preview yet.</p>}
            </div>
          ) : (
            <Textarea value={draft.text} onChange={(e) => set({ text: e.target.value })} placeholder="Write your rationale here… (Markdown supported)" rows={rows} autoFocus={autoFocus} />
          )}
        </div>
      )}
    </div>
  );
}
