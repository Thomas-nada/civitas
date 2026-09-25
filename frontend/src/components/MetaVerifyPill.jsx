import { Pill } from "../ui";

// Badge for CIP governance-metadata verification. Renders nothing unless a
// verification object is provided (backend flag on).
export default function MetaVerifyPill({ verification, style }) {
  const v = verification;
  if (!v) return null;
  if (v.fetched === false || v.error) {
    return <Pill tone="neutral" outline style={style} title="Anchor content could not be fetched">◇ metadata unreachable</Pill>;
  }
  const ok = v.anchorHashValid === true;
  return (
    <Pill tone={ok ? "success" : "danger"} style={style} title={`${v.cip || "metadata"} · anchor hash ${ok ? "matches on-chain" : "MISMATCH"} · schema ${v.schemaValid ? "conformant" : "non-standard"}`}>
      {ok ? "✓ Metadata verified" : "⚠ Content changed"}
      <span style={{ opacity: 0.7, fontWeight: 400 }}>· {v.cip || "—"}</span>
      {!v.schemaValid ? <span style={{ color: "var(--color-warning)" }}>· non-standard schema</span> : null}
    </Pill>
  );
}
