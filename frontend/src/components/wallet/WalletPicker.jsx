// Shared wallet picker, ported from DRepTalk. A native <select> cannot render
// the wallet logo each CIP-30 extension exposes (icon is a data URI), so this
// is a list of real radio options styled as rows: logo, name and a CIP-95
// badge, with the selected row marked. Real radios give native keyboard
// (arrow) navigation and screen-reader support; the picker only reports the
// chosen key, connecting stays with the enclosing flow's own button.
import { useId, useState } from "react";
import { IconCheck } from "./icons";

/** First letter of the wallet name, used when the extension exposes no icon. */
function monogram(name) {
  return (String(name || "").trim()[0] ?? "?").toUpperCase();
}

/** Wallet logo, or a monogram when the extension exposes no icon. */
export function WalletMark({ name, icon, size = 28 }) {
  const style = { width: size, height: size };
  return icon ? (
    <img className="wallet-mark" src={icon} alt="" width={size} height={size} style={style} />
  ) : (
    <span className="wallet-mark wallet-mark--mono" aria-hidden="true" style={style}>
      {monogram(name)}
    </span>
  );
}

export default function WalletPicker({ wallets, selected, onSelect, disabled = false, label = "Wallet", hideLabel = false }) {
  const groupName = useId();
  const [focused, setFocused] = useState(null);

  return (
    <div className="wallet-picker">
      {!hideLabel ? <span className="wallet-picker-label">{label}</span> : null}
      <div className="wallet-picker-list">
        {wallets.map((w) => {
          const isSelected = w.key === selected;
          const cls = [
            "wallet-picker-row",
            isSelected ? "is-selected" : "",
            focused === w.key ? "is-focused" : "",
            disabled ? "is-disabled" : ""
          ].filter(Boolean).join(" ");
          return (
            <label key={w.key} className={cls}>
              <input
                type="radio"
                className="wallet-picker-radio"
                name={groupName}
                value={w.key}
                checked={isSelected}
                disabled={disabled}
                onChange={() => onSelect(w.key)}
                onFocus={() => setFocused(w.key)}
                onBlur={() => setFocused(null)}
              />
              <WalletMark name={w.name} icon={w.icon} size={28} />
              <span className="wallet-picker-name">{w.name}</span>
              {w.supportsCip95 ? <span className="wallet-badge">CIP-95</span> : null}
              {isSelected ? <IconCheck size={16} /> : null}
            </label>
          );
        })}
      </div>
    </div>
  );
}
