// Compact wallet summary, ported from DRepTalk. The common case is a single
// wallet, so it shows as one row instead of a full radio list. "Change wallet"
// appears only when more than one wallet is present and reveals the shared
// WalletPicker on demand. Nothing here connects: the enclosing flow's own
// button does that, which is why the label is caller-provided.
import { useState } from "react";
import WalletPicker, { WalletMark } from "./WalletPicker";
import { IconWarning } from "./icons";

export default function WalletConnection({
  wallets,
  selected,
  onSelect,
  disabled = false,
  label = "Selected wallet",
  note,
  // Set by flows that need the CIP-95 extension (signing in as a DRep). Only
  // shows when the chosen wallet cannot do it; saying so here beats letting
  // the user click through to the failure.
  requiresCip95 = false
}) {
  const [changing, setChanging] = useState(false);
  const current = wallets.find((w) => w.key === selected) ?? wallets[0];
  const canChange = wallets.length > 1;

  if (!current) return null;

  const missingCip95 = requiresCip95 && !current.supportsCip95;

  return (
    <div className="wallet-card">
      <div className="wallet-card-row">
        <WalletMark name={current.name} icon={current.icon} size={32} />
        <div className="wallet-card-text">
          {label ? <p className="wallet-card-label">{label}</p> : null}
          <p className="wallet-card-name">
            <span>{current.name}</span>
            {current.supportsCip95 ? <span className="wallet-badge">CIP-95</span> : null}
          </p>
        </div>
        {canChange ? (
          <button
            type="button"
            className="wallet-card-change"
            onClick={() => setChanging((c) => !c)}
            disabled={disabled}
          >
            {changing ? "Cancel" : "Change wallet"}
          </button>
        ) : null}
      </div>

      {changing ? (
        <div className="wallet-card-picker">
          <WalletPicker
            wallets={wallets}
            selected={current.key}
            onSelect={(key) => {
              onSelect(key);
              setChanging(false);
            }}
            disabled={disabled}
            hideLabel
          />
        </div>
      ) : null}

      {missingCip95 ? (
        <div className="callout callout--warning" role="status" style={{ marginTop: "0.8rem" }}>
          <IconWarning size={18} className="callout-icon" />
          <div className="callout-body">
            {current.name} does not advertise CIP-95, which signing in as a DRep requires.{" "}
            {canChange ? "Choose another wallet above." : "Use a DRep-capable wallet such as Eternl, Lace or Typhon."}
          </div>
        </div>
      ) : null}

      {note ? <p className="wallet-card-note">{note}</p> : null}
    </div>
  );
}
