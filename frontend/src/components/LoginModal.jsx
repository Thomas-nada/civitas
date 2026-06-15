import { useContext, useState } from "react";
import { WalletContext } from "../context/WalletContext";

// Only the wallet-connect path (with DRep/Stake key selection) has been tested
// end-to-end. CardanoSigner, MultiSig, and the Calidus key are built but not yet
// validated, so they're hidden behind this flag until they're finished.
const SHOW_ADVANCED = false;

const SIGN_KEYS = [
  { value: "drep", label: "Sign with DRep Key" },
  { value: "stake", label: "Sign with Stake Key" },
  { value: "calidus", label: "Sign with Calidus Key", advanced: true },
];
const VISIBLE_SIGN_KEYS = SIGN_KEYS.filter((k) => SHOW_ADVANCED || !k.advanced);

export default function LoginModal() {
  const wallet = useContext(WalletContext);

  const [tab, setTab] = useState("wallet");          // 'wallet' | 'signer'
  const [multiSig, setMultiSig] = useState(false);
  const [signKey, setSignKey] = useState("stake");   // 'drep' | 'stake' | 'calidus'
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [stakeAddr, setStakeAddr] = useState("");
  const [multiSigId, setMultiSigId] = useState("");
  const [busy, setBusy] = useState(false);

  // Render only when the menu is open and nobody is logged in yet.
  if (!wallet || !wallet.walletMenuOpen || wallet.loggedIn) return null;

  function close() {
    wallet.setWalletMenuOpen(false);
    // reset transient state so reopening starts fresh
    setTab("wallet");
    setMultiSig(false);
    setSelectedWallet(null);
    setStakeAddr("");
    setMultiSigId("");
    setBusy(false);
  }

  const opts = () => ({ signKey, multiSigDRepId: multiSig ? multiSigId.trim() : "" });

  async function handleSelectWallet() {
    if (!selectedWallet) return;
    setBusy(true);
    await wallet.connectWallet(selectedWallet, opts());
    setBusy(false);
  }

  async function handleEnterAddress() {
    if (!stakeAddr.trim()) return;
    setBusy(true);
    await wallet.connectCardanoSigner(stakeAddr, opts());
    setBusy(false);
  }

  return (
    <div className="login-overlay" onClick={close} role="presentation">
      <div className="login-modal panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Login">
        <div className="login-head">
          <h3>Login</h3>
          {SHOW_ADVANCED ? (
            <label className="login-multisig" title="Native-script / multi-sig DRep">
              <span>MultiSig</span>
              <input
                type="checkbox"
                checked={multiSig}
                onChange={(e) => setMultiSig(e.target.checked)}
              />
              <span className="login-switch" aria-hidden="true" />
            </label>
          ) : null}
        </div>

        <p className="login-sub muted">
          {SHOW_ADVANCED
            ? "Use your CIP-95 compatible wallet or the CardanoSigner to sign."
            : "Connect your CIP-95 compatible wallet to sign."}
        </p>

        {SHOW_ADVANCED ? (
          <div className="login-tabs">
            <button
              type="button"
              className={tab === "wallet" ? "active" : ""}
              onClick={() => setTab("wallet")}
            >
              Connect Wallet
            </button>
            <button
              type="button"
              className={tab === "signer" ? "active" : ""}
              onClick={() => setTab("signer")}
            >
              Use CardanoSigner
            </button>
          </div>
        ) : null}

        {SHOW_ADVANCED && multiSig ? (
          <input
            className="login-input"
            placeholder="Enter MultiSig DRep-ID"
            value={multiSigId}
            onChange={(e) => setMultiSigId(e.target.value)}
          />
        ) : null}

        <div className="login-select-wrap">
          <select
            className="login-select"
            value={signKey}
            onChange={(e) => setSignKey(e.target.value)}
          >
            {VISIBLE_SIGN_KEYS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
        </div>

        {!SHOW_ADVANCED || tab === "wallet" ? (
          <>
            <div className="login-wallet-list">
              {wallet.wallets.length === 0 ? (
                <p className="muted" style={{ textAlign: "center", margin: "0.5rem 0" }}>
                  No CIP-30 wallet extension detected.
                </p>
              ) : (
                wallet.wallets.map((w) => (
                  <button
                    key={w.key}
                    type="button"
                    className={`login-wallet-btn${selectedWallet === w.key ? " selected" : ""}`}
                    onClick={() => setSelectedWallet(w.key)}
                  >
                    {w.displayName}
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              className="login-primary"
              disabled={!selectedWallet || busy}
              onClick={handleSelectWallet}
            >
              {busy ? "Connecting…" : "Select Wallet"}
            </button>
          </>
        ) : (
          <>
            <input
              className="login-input"
              placeholder="Please enter your stake address"
              value={stakeAddr}
              onChange={(e) => setStakeAddr(e.target.value)}
            />
            <button
              type="button"
              className="login-primary"
              disabled={!stakeAddr.trim() || busy}
              onClick={handleEnterAddress}
            >
              {busy ? "Checking…" : "Enter Address"}
            </button>
          </>
        )}

        {wallet.walletError ? <p className="login-error">{wallet.walletError}</p> : null}

        <button type="button" className="login-cancel" onClick={close}>Cancel</button>
      </div>
    </div>
  );
}
