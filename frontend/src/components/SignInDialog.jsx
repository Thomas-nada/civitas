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
import WalletConnection from "./wallet/WalletConnection";
import { ROLE_ICONS } from "./wallet/roleIcons";
import { IconShieldCheck, IconTerminal, IconWallet } from "./wallet/icons";
import { Alert, Button, CopyButton, Modal, Segmented, Textarea } from "../ui";

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
  const [methodChoice, setMethodChoice] = useState(null);
  const noWalletFound = wallets.length === 0 && !walletScanning;
  const method = methodChoice ?? (noWalletFound ? "signer" : defaultMethodForRole(signInRole));
  const [status, setStatus] = useState({ kind: "idle" }); // idle | connecting | error
  const busy = status.kind === "connecting";
  return (
    <Modal open onClose={() => wallet.setWalletMenuOpen(false)} title="Sign in" size="sm">
      <div className="stack">
        <p className="small muted" style={{ margin: 0 }}>Prove control of a Cardano key and choose how you take part.</p>
        <Segmented ariaLabel="Sign-in method" value={method} onChange={(m) => { setMethodChoice(m); setStatus({ kind: "idle" }); }} disabled={busy} options={METHOD_OPTIONS} />
        {method === "wallet" ? <WalletMethod wallet={wallet} status={status} setStatus={setStatus} /> : <SignerMethod wallet={wallet} status={status} setStatus={setStatus} />}
      </div>
    </Modal>
  );
}

function Step({ title, actions, children }) {
  return (
    <section className="si-step">
      <div className="row row--between"><span className="caps">{title}</span>{actions}</div>
      {children}
    </section>
  );
}

/* Connect a wallet ------------------------------------------------------- */
function WalletMethod({ wallet, status, setStatus }) {
  const { wallets, selectedWallet, selectWallet, walletScanning, signInRole } = wallet;
  const [role, setRole] = useState(roleByKey(signInRole)?.methods.includes("wallet") ? signInRole : "delegator");
  const current = wallets.find((w) => w.key === selectedWallet) ?? wallets[0] ?? null;
  const roleMeta = roleByKey(role);
  const busy = status.kind === "connecting";
  const changeRole = (next) => { setRole(next); setStatus({ kind: "idle" }); };

  async function signIn(roleOverride) {
    if (!current) return;
    const r = roleOverride || role;
    if (roleOverride) changeRole(roleOverride);
    setStatus({ kind: "connecting" });
    const result = await wallet.connectWallet(current.key, { role: r });
    if (result?.ok) { rememberRole(r); return; }
    setStatus({ kind: "error", message: result?.error || "Sign-in failed. Please try again.", code: result?.code || "" });
  }

  if (wallets.length === 0) {
    return <Alert tone="info" role="status">{walletScanning ? "Looking for a wallet extension…" : "No Cardano wallet extension detected. Install one such as Lace, Eternl or Typhon and reload this page, or sign in with cardano-signer."}</Alert>;
  }
  return (
    <div className="stack">
      <Step title="1. Your wallet"><WalletConnection wallets={wallets} selected={current?.key || ""} onSelect={selectWallet} disabled={busy} label="" requiresCip95={Boolean(roleMeta?.requiresCip95)} /></Step>
      <Step title="2. Sign in as">
        <Segmented ariaLabel="Sign in as" value={role} onChange={changeRole} disabled={busy} options={WALLET_ROLE_OPTIONS} />
        {roleMeta?.hint ? <p className="small muted" style={{ margin: "8px 0 0" }}>{roleMeta.hint}</p> : null}
      </Step>
      <Button variant="primary" block icon={<IconShieldCheck size={16} />} onClick={() => signIn()} disabled={busy || !current} loading={busy}>{busy ? "Connecting…" : `Connect ${current ? current.name : "wallet"}`}</Button>
      <TrustNote>Connecting only shares your addresses with Civitas. Nothing is submitted and no fees are charged until you sign a transaction.</TrustNote>
      <StatusCallout status={status} connectingText="Approve the connection request in your wallet…" onReset={() => setStatus({ kind: "idle" })} onSwitchRole={role !== "delegator" ? () => signIn("delegator") : null} />
    </div>
  );
}

/* Sign with cardano-signer ----------------------------------------------- */
function SignerMethod({ wallet, status, setStatus }) {
  const { signInRole } = wallet;
  const [role, setRole] = useState(roleByKey(signInRole)?.methods.includes("signer") ? signInRole : "drep");
  const [step, setStep] = useState("identity"); // identity | sign
  const [challenge, setChallenge] = useState({ payload: "", error: "", seq: 0 });
  const [pasted, setPasted] = useState("");
  const roleMeta = roleByKey(role);
  const busy = status.kind === "connecting";

  // A challenge is single-use and short-lived: fetch one on entering the sign
  // step, again on Refresh, and again after a failed attempt.
  useEffect(() => {
    if (step !== "sign") return undefined;
    let cancelled = false;
    requestChallenge().then((res) => { if (!cancelled) setChallenge((c) => ({ ...c, payload: res.ok ? res.payload : "", error: res.ok ? "" : res.error })); });
    return () => { cancelled = true; };
  }, [step, challenge.seq]);

  const refreshChallenge = () => { setStatus({ kind: "idle" }); setPasted(""); setChallenge((c) => ({ payload: "", error: "", seq: c.seq + 1 })); };
  const dataHex = challenge.payload ? challengeToHex(challenge.payload) : "";
  const command = dataHex ? `cardano-signer sign --data-hex "${dataHex}" --secret-key ${roleMeta?.keyFile || "key.skey"} --json` : "";

  async function submit() {
    if (!challenge.payload) return;
    setStatus({ kind: "connecting" });
    const result = await wallet.signInWithSigner({ role, payload: challenge.payload, pastedText: pasted });
    if (result?.ok) return;
    setStatus({ kind: "error", message: result?.error || "Sign-in failed. Please try again.", code: "" });
    setChallenge((c) => ({ payload: "", error: "", seq: c.seq + 1 }));
  }

  return (
    <div className="stack">
      <Step title="Sign in as">
        <Segmented ariaLabel="Sign in as" value={role} onChange={(r) => { setRole(r); setStatus({ kind: "idle" }); }} disabled={busy || step === "sign"} options={SIGNER_ROLE_OPTIONS} />
        {roleMeta?.hint ? <p className="small muted" style={{ margin: "8px 0 0" }}>{roleMeta.hint}</p> : null}
      </Step>
      {step === "identity" ? (
        <>
          <Button variant="primary" block onClick={() => { setStatus({ kind: "idle" }); setStep("sign"); }}>Continue →</Button>
          <TrustNote>You sign a one-time message with your own key. Your keys stay on your machine, nothing is submitted and no fees are charged.</TrustNote>
        </>
      ) : (
        <>
          <Step title="1. Sign this challenge" actions={<Button size="sm" variant="ghost" onClick={refreshChallenge} disabled={busy}>Refresh</Button>}>
            <p className="small muted" style={{ margin: "6px 0 8px" }}>Run this on the machine that holds <code>{roleMeta?.keyFile}</code>, then paste the JSON it prints below. The challenge expires after a few minutes and can be used once.</p>
            <pre className="si-code">{command || (challenge.error ? challenge.error : "Loading challenge…")}</pre>
            {command ? <CopyButton value={command} label="Copy command" variant="default">Copy command</CopyButton> : null}
          </Step>
          <Step title="2. Paste the cardano-signer output">
            <Textarea className="mono" value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder={'{ "signature": "…", "publicKey": "…" }'} rows={5} disabled={busy} spellCheck={false} aria-label="cardano-signer output" />
          </Step>
          <Button variant="primary" block icon={<IconShieldCheck size={16} />} onClick={submit} disabled={busy || !challenge.payload || !pasted.trim()} loading={busy}>{busy ? "Verifying…" : "Sign in with the pasted signature"}</Button>
          <TrustNote>You sign a one-time message with your own key. Your keys stay on your machine, nothing is submitted and no fees are charged.</TrustNote>
          <StatusCallout status={status} connectingText="Verifying your signature…" onReset={() => setStatus({ kind: "idle" })} onSwitchRole={null} />
          <div style={{ textAlign: "center" }}><Button size="sm" variant="ghost" onClick={() => { setStep("identity"); setStatus({ kind: "idle" }); }} disabled={busy}>Change role</Button></div>
        </>
      )}
    </div>
  );
}

function TrustNote({ children }) {
  return <p className="tiny muted row" style={{ margin: 0, flexWrap: "nowrap", alignItems: "flex-start" }}><IconShieldCheck size={14} style={{ flex: "none", marginTop: 2 }} /><span>{children}</span></p>;
}

// Progress line while a prompt is open; on failure, the reason plus a way
// forward. The wallet flow tags the two DRep dead ends ("not-a-drep",
// "no-cip95") so the dialog can offer delegator sign-in in one click.
function StatusCallout({ status, connectingText, onReset, onSwitchRole }) {
  if (status.kind === "connecting") return <p role="status" aria-live="polite" className="small muted" style={{ margin: 0 }}>{connectingText}</p>;
  if (status.kind !== "error") return null;
  const canSwitch = Boolean(onSwitchRole) && ["not-a-drep", "no-cip95", "lookup-failed"].includes(status.code);
  return (
    <Alert tone="danger" role="alert">
      {status.message}
      <div className="row" style={{ marginTop: 8 }}>
        <Button size="sm" onClick={onReset}>Try again</Button>
        {canSwitch ? <><span className="muted small">or</span><Button size="sm" variant="ghost" onClick={onSwitchRole}>sign in as a delegator</Button></> : null}
      </div>
    </Alert>
  );
}
