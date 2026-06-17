// Shadow-preview badge for CIP governance-metadata verification.
// Renders nothing unless a verification object is provided (backend flag on).
export default function MetaVerifyPill({ verification, style }) {
  const v = verification;
  if (!v) return null;

  if (v.fetched === false || v.error) {
    return (
      <span
        className="meta-verify-pill"
        style={{ borderColor: "var(--line)", color: "var(--text-muted)", background: "var(--surface-soft)", ...style }}
        title="Anchor content could not be fetched"
      >
        ◇ metadata unreachable
      </span>
    );
  }

  const ok = v.anchorHashValid === true;
  return (
    <span
      className="meta-verify-pill"
      title={`${v.cip || "metadata"} · anchor hash ${ok ? "matches on-chain" : "MISMATCH"} · schema ${v.schemaValid ? "conformant" : "non-standard"}`}
      style={{
        borderColor: ok ? "color-mix(in srgb, var(--mint) 50%, transparent)" : "color-mix(in srgb, var(--rose) 55%, transparent)",
        color: ok ? "var(--mint)" : "var(--rose)",
        background: ok ? "color-mix(in srgb, var(--mint) 12%, transparent)" : "color-mix(in srgb, var(--rose) 12%, transparent)",
        ...style,
      }}
    >
      {ok ? "✓ Metadata verified" : "⚠ Content changed"}
      <span style={{ opacity: 0.7, fontWeight: 400 }}>· {v.cip || "—"}</span>
      {!v.schemaValid ? <span style={{ color: "var(--amber)", opacity: 0.9 }}>· non-standard schema</span> : null}
    </span>
  );
}
