// "Delegate voting power to this DRep": builds and submits the vote
// delegation certificate with the connected wallet. A DRep holding a high
// share of active voting power gets a decentralisation prompt first.
import { useContext, useState } from "react";
import { WalletContext } from "../../context/WalletContext";
import { readableError } from "../../lib/wallet/walletError";
import { explorerTxUrl } from "../../services/surveyNetwork";
import { round1 } from "../../lib/governance/scoring";
import { Alert, Button, Modal } from "../../ui";

export function useDelegateToDrep(drepId) {
  const wallet = useContext(WalletContext);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { tone, text, txHash }

  async function submit() {
    if (!drepId) return false;
    if (!wallet?.walletApi) { setNotice({ tone: "warning", text: "Connect your wallet in the top bar to delegate." }); return false; }
    if (!wallet.walletRewardAddress) { setNotice({ tone: "warning", text: "No reward address found in the connected wallet. Delegation needs a stake key." }); return false; }
    try {
      setBusy(true); setNotice(null);
      const { Transaction } = await import("@meshsdk/core");
      const tx = new Transaction({ initiator: wallet.walletApi, verbose: false });
      tx.setNetwork("mainnet");
      tx.txBuilder.voteDelegationCertificate({ dRepId: drepId }, wallet.walletRewardAddress);
      const unsigned = await tx.build();
      const signed = await wallet.walletApi.signTx(unsigned, true, true);
      const txHash = await wallet.walletApi.submitTx(signed);
      setNotice({ tone: "success", text: "Delegation submitted. It takes effect from the next epoch boundary.", txHash });
      return true;
    } catch (e) {
      setNotice({ tone: "danger", text: readableError(e, "The delegation transaction could not be submitted.") });
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { wallet, busy, notice, setNotice, submit };
}

export default function DelegateButton({ drepId, riskLabel, activeSharePct, size, block, children }) {
  const { wallet, busy, notice, setNotice, submit } = useDelegateToDrep(drepId);
  const [confirm, setConfirm] = useState(false);
  const connected = Boolean(wallet?.walletApi);

  async function onClick() {
    if (connected && riskLabel === "High") { setConfirm(true); return; }
    await submit();
  }

  return (
    <div className="stack--2">
      <Button variant="primary" size={size} block={block} onClick={onClick} loading={busy} disabled={busy || !drepId}>
        {busy ? "Submitting…" : children || "Delegate voting power to this DRep"}
      </Button>
      {!connected ? <span className="tiny muted">Connect your wallet in the top bar to delegate.</span> : null}
      {notice ? (
        <Alert tone={notice.tone}>
          {notice.text}{" "}
          {notice.txHash ? <a className="mono" href={explorerTxUrl(notice.txHash)} target="_blank" rel="noreferrer">{notice.txHash.slice(0, 16)}…</a> : null}
        </Alert>
      ) : null}
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Delegation concentration" size="sm" footer={
        <div className="row row--end">
          <Button onClick={() => { setConfirm(false); setNotice({ tone: "info", text: "Delegation cancelled. Consider a DRep with a lower delegated share." }); }}>Cancel</Button>
          <Button variant="primary" onClick={async () => { setConfirm(false); await submit(); }}>Continue anyway</Button>
        </div>
      }>
        <p>This DRep already holds <strong>{round1(activeSharePct)}%</strong> of active voting power.</p>
        <p className="muted small">For a healthier spread of governance power, consider delegating to a DRep with a lower share. You can still continue if this is your deliberate choice.</p>
      </Modal>
    </div>
  );
}
