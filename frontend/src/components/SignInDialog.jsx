// Sign-in dialog, modelled on DRepTalk's: two methods, a browser wallet or
// cardano-signer on the command line.
//   Wallet: pick a wallet (the common single-wallet case shows as one compact
//   row, "Change wallet" reveals the full picker), choose the role, connect.
//   cardano-signer: choose the role, get a single-use challenge, sign it
//   locally with the role's key, paste the JSON output. The server verifies
//   the signature and checks the identity on-chain, so DReps, SPOs and CC
//   members whose keys never touch a browser can still sign in.
// The flows themselves live in App.jsx (connectWallet, signInWithSigner);
// this component only drives them and turns failures into a next step.
import { useContext, useEffect, useState } from "react";
import { WalletContext } from "../context/WalletContext";
import { WALLET_ROLES, SIGNER_ROLES, roleByKey, rememberRole, defaultMethodForRole } from "../lib/wallet/roles";
import { requestChallenge, challengeToHex } from "../lib/wallet/offlineLogin";
import SegmentedControl from "./wallet/SegmentedControl";
import WalletConnection from "./wallet/WalletConnection";
import { ROLE_ICONS } from "./wallet/roleIcons";
import { IconClose, IconError, IconShieldCheck, IconTerminal, IconWallet } from "./wallet/icons";

const WALLET_ROLE_OPTIONS = WALLET_ROLES.map((r) => ({ value: r.key, label: r.label, icon: ROLE_ICONS[r.key] }));
const SIGNER_ROLE_OPTIONS = SIGNER_ROLES.map((r) => ({ value: r.key, label: r.label, icon: ROLE_ICONS[r.key] }));

const METHOD_OPTIONS = [
  { value: "wallet", label: "Connect a wallet", icon: <IconWallet size={16} /> },
  { value: "signer", label: "Sign with cardano-signer", icon: <IconTerminal size={16} /> }
];

export default function SignInDialog() {
  const wallet = useContext(WalletContext);
  // Render only while the menu is open and nobody is signed in. The panel
  // mounts fresh each time, so its transient state never leaks between opens.
  if (!wallet || !wallet.walletMenuOpen || wallet.loggedIn) return null;
  return <SignInPanel wallet={wallet} />;
}

function SignInPanel({ wallet }) {
  const { wallets, walletScanning, signInRole } = wallet;
  // The method is the user's pick once they make one. Until then it follows
  // the requested role (SPO and CC member only exist on cardano-signer) and,
  // when the scan closes with no wallet extension at all, falls back to
  // cardano-signer instead of showing a dead end.
  const [methodChoice, setMethodChoice] = useState(null);
  const noWalletFound = wallets.length === 0 && !walletScanning;
  const method = methodChoice ?? (noWalletFound ? "signer" : defaultMethodForRole(signInRole));
  const [status, setStatus] = useState({ kind: "idle" }); // idle | connecting | error

  const close = () => wallet.setWalletMenuOpen(false);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") wallet.setWalletMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [wallet]);

  const busy = status.kind === "connecting";

  return (
    <div className="signin-overlay" onClick={close} role="presentation">
      <div
        className="signin-dialog panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="signin-head">
          <div>
            <h3 id="signin-title">Sign in</h3>
            <p className="signin-sub muted">Prove control of a Cardano key and choose how you take part.</p>
          </div>
          <button type="button" className="signin-close" onClick={close} aria-label="Close">
            <IconClose size={16} />
          </button>
        </div>

        <SegmentedControl
          ariaLabel="Sign-in method"
          value={method}
          onChange={(m) => { setMethodChoice(m); setStatus({ kind: "idle" }); }}
          disabled={busy}
          options={METHOD_OPTIONS}
          wrap
        />

        {method === "wallet" ? (
          <WalletMethod wallet={wallet} status={status} setStatus={setStatus} />
        ) : (
          <SignerMethod wallet={wallet} status={status} setStatus={setStatus} />
        )}
      </div>
    </div>
  );
}

// ---- Connect a wallet -------------------------------------------------------

function WalletMethod({ wallet, status, setStatus }) {
  const { wallets, selectedWallet, selectWallet, walletScanning, signInRole } = wallet;
  const [role, setRole] = useState(roleByKey(signInRole)?.methods.includes("wallet") ? signInRole : "delegator");

  const current = wallets.find((w) => w.key === selectedWallet) ?? wallets[0] ?? null;
  const roleMeta = roleByKey(role);
  const busy = status.kind === "connecting";

  function changeRole(next) {
    setRole(next);
    setStatus({ kind: "idle" });
  }

  async function signIn(roleOverride) {
    if (!current) return;
    const r = roleOverride || role;
    if (roleOverride) changeRole(roleOverride);
    setStatus({ kind: "connecting" });
    const result = await wallet.connectWallet(current.key, { role: r });
    if (result?.ok) {
      // App closes the dialog on success; only the role preference is left to remember.
      rememberRole(r);
      return;
    }
    setStatus({ kind: "error", message: result?.error || "Sign-in failed. Please try again.", code: result?.code || "" });
  }

  if (wallets.length === 0) {
    // While the scan is still running no verdict has been reached: saying
    // "no wallet detected" would be false on a device that has one that
    // simply injected late.
    return (
      <div className="signin-card">
        <p role="status" aria-live="polite" className="signin-empty muted">
          {walletScanning
            ? "Looking for a wallet extension…"
            : "No Cardano wallet extension detected. Install one such as Lace, Eternl or Typhon and reload this page, or sign in with cardano-signer."}
        </p>
      </div>
    );
  }

  return (
    <div className="signin-card">
      <section className="signin-step">
        <span className="signin-step-title">1. Your wallet</span>
        <WalletConnection
          wallets={wallets}
          selected={current?.key || ""}
          onSelect={selectWallet}
          disabled={busy}
          label=""
          requiresCip95={Boolean(roleMeta?.requiresCip95)}
        />
      </section>

      <section className="signin-step">
        <span className="signin-step-title">2. Sign in as</span>
        <SegmentedControl
          ariaLabel="Sign in as"
          value={role}
          onChange={changeRole}
          disabled={busy}
          options={WALLET_ROLE_OPTIONS}
        />
        {roleMeta?.hint ? <p className="signin-hint muted">{roleMeta.hint}</p> : null}
      </section>

      <button
        type="button"
        className="signin-primary"
        onClick={() => signIn()}
        disabled={busy || !current}
      >
        <IconShieldCheck size={16} />
        {busy ? "Connecting…" : `Connect ${current ? current.name : "wallet"}`}
      </button>

      <p className="signin-trust muted">
        <IconShieldCheck size={14} />
        Connecting only shares your addresses with Civitas. Nothing is submitted and no fees are charged until you sign a transaction.
      </p>

      <StatusCallout
        status={status}
        connectingText="Approve the connection request in your wallet…"
        onReset={() => setStatus({ kind: "idle" })}
        onSwitchRole={role !== "delegator" ? () => signIn("delegator") : null}
      />
    </div>
  );
}

// ---- Sign with cardano-signer ----------------------------------------------

function SignerMethod({ wallet, status, setStatus }) {
  const { signInRole } = wallet;
  const [role, setRole] = useState(roleByKey(signInRole)?.methods.includes("signer") ? signInRole : "drep");
  const [step, setStep] = useState("identity"); // 'identity' | 'sign'
  const [challenge, setChallenge] = useState({ payload: "", error: "", seq: 0 });
  const [pasted, setPasted] = useState("");
  const [copied, setCopied] = useState(false);

  const roleMeta = roleByKey(role);
  const busy = status.kind === "connecting";

  // A challenge is single-use and short-lived: fetch one on entering the sign
  // step, again on Refresh, and again after a failed attempt.
  useEffect(() => {
    if (step !== "sign") return undefined;
    let cancelled = false;
    requestChallenge().then((res) => {
      if (cancelled) return;
      setChallenge((c) => ({ ...c, payload: res.ok ? res.payload : "", error: res.ok ? "" : res.error }));
    });
    return () => { cancelled = true; };
  }, [step, challenge.seq]);

  function refreshChallenge() {
    setStatus({ kind: "idle" });
    setPasted("");
    setChallenge((c) => ({ payload: "", error: "", seq: c.seq + 1 }));
  }

  function changeRole(next) {
    setRole(next);
    setStatus({ kind: "idle" });
  }

  const dataHex = challenge.payload ? challengeToHex(challenge.payload) : "";
  const command = dataHex
    ? `cardano-signer sign --data-hex "${dataHex}" --secret-key ${roleMeta?.keyFile || "key.skey"} --json`
    : "";

  async function copyCommand() {
    if (!command) return;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked in an insecure context; the command stays selectable.
    }
  }

  async function submit() {
    if (!challenge.payload) return;
    setStatus({ kind: "connecting" });
    const result = await wallet.signInWithSigner({ role, payload: challenge.payload, pastedText: pasted });
    if (result?.ok) return; // App closes the dialog on success.
    setStatus({ kind: "error", message: result?.error || "Sign-in failed. Please try again.", code: "" });
    // The challenge was consumed by the attempt; get a fresh one for the retry.
    setChallenge((c) => ({ payload: "", error: "", seq: c.seq + 1 }));
  }

  return (
    <div className="signin-card">
      <section className="signin-step">
        <span className="signin-step-title">Sign in as</span>
        <SegmentedControl
          ariaLabel="Sign in as"
          value={role}
          onChange={changeRole}
          disabled={busy || step === "sign"}
          options={SIGNER_ROLE_OPTIONS}
        />
        {roleMeta?.hint ? <p className="signin-hint muted">{roleMeta.hint}</p> : null}
      </section>

      {step === "identity" ? (
        <>
          <button type="button" className="signin-primary" onClick={() => { setStatus({ kind: "idle" }); setStep("sign"); }}>
            Continue
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <TrustNote />
        </>
      ) : (
        <>
          <section className="signin-step">
            <div className="signin-step-head">
              <span className="signin-step-title">1. Sign this challenge</span>
              <button type="button" className="link-btn" onClick={refreshChallenge} disabled={busy}>Refresh</button>
            </div>
            <p className="signin-hint muted">
              Run this on the machine that holds <code>{roleMeta?.keyFile}</code>, then paste the JSON it prints below. The challenge expires after a few minutes and can be used once.
            </p>
            <code className="signin-code">
              {command || (challenge.error ? challenge.error : "Loading challenge…")}
            </code>
            {command ? (
              <button type="button" className="signin-secondary" onClick={copyCommand}>
                {copied ? "Copied" : "Copy command"}
              </button>
            ) : null}
          </section>

          <section className="signin-step">
            <label className="signin-field">
              <span className="signin-step-title">2. Paste the cardano-signer output</span>
              <textarea
                className="signin-input signin-textarea"
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder={'{ "signature": "…", "publicKey": "…" }'}
                rows={5}
                disabled={busy}
                spellCheck={false}
              />
            </label>
          </section>

          <button
            type="button"
            className="signin-primary"
            onClick={submit}
            disabled={busy || !challenge.payload || !pasted.trim()}
          >
            <IconShieldCheck size={16} />
            {busy ? "Verifying…" : "Sign in with pasted signature"}
          </button>

          <TrustNote />

          <StatusCallout
            status={status}
            connectingText="Verifying your signature…"
            onReset={() => setStatus({ kind: "idle" })}
            onSwitchRole={null}
          />

          <div className="signin-center">
            <button
              type="button"
              className="link-btn"
              onClick={() => { setStep("identity"); setStatus({ kind: "idle" }); }}
              disabled={busy}
            >
              Change role
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TrustNote() {
  return (
    <p className="signin-trust muted">
      <IconShieldCheck size={14} />
      You sign a one-time message with your own key. Your keys stay on your machine, nothing is submitted and no fees are charged.
    </p>
  );
}

// Progress line while a prompt is open; on failure, the reason plus a way
// forward. The wallet flow tags the two DRep dead ends ("not-a-drep",
// "no-cip95") so the dialog can offer delegator sign-in in one click.
function StatusCallout({ status, connectingText, onReset, onSwitchRole }) {
  if (status.kind === "connecting") {
    return (
      <p role="status" aria-live="polite" className="signin-status muted">
        {connectingText}
      </p>
    );
  }
  if (status.kind !== "error") return null;
  const canSwitch = Boolean(onSwitchRole) && ["not-a-drep", "no-cip95", "lookup-failed"].includes(status.code);
  return (
    <div className="callout callout--error" role="alert">
      <IconError size={18} className="callout-icon" />
      <div className="callout-body">
        {status.message}
        <div className="callout-actions">
          <button type="button" className="link-btn" onClick={onReset}>Try again</button>
          {canSwitch ? (
            <>
              <span className="muted">or</span>
              <button type="button" className="link-btn" onClick={onSwitchRole}>sign in as a delegator</button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
