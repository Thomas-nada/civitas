// "Delegate voting power to this DRep": builds and submits the vote
// delegation certificate with the connected wallet. A DRep holding a high
// share of active voting power gets a decentralisation prompt first.
import { useState } from "react";
import { explorerTxUrl } from "../../services/surveyNetwork";
import { round1 } from "../../lib/governance/scoring";
import { useDelegateToDrep } from "../../hooks/useDelegateToDrep";
import { Alert, Button, Modal } from "../../ui";

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
