// The DRep vote on one governance action, on the action's own page: Yes /
// No / Abstain with a rationale (URL or written and uploaded), signed and
// submitted with the signed-in DRep wallet. Independent of any survey.
import { useContext, useMemo, useState } from "react";
import { WalletContext } from "../../context/WalletContext";
import { explorerTxUrl } from "../../services/surveyNetwork";
import { EMPTY_RATIONALE, VOTE_CHOICES, resolveRationaleAnchor, submitDrepVote } from "../../services/voteTxService";
import { readableError } from "../../lib/wallet/walletError";
import RationaleInput from "./RationaleInput";
import { Alert, Button, Card, VotePill } from "../../ui";

export default function DrepVotePanel({ proposalId, actionName, status, votes = [] }) {
  const wallet = useContext(WalletContext);
  const [choice, setChoice] = useState("");
  const [rationale, setRationale] = useState(EMPTY_RATIONALE);
  const [phase, setPhase] = useState({ kind: "idle" }); // idle | working | done | error
  const [open, setOpen] = useState(false);

  const isActive = String(status || "").toLowerCase() === "active";
  const drepId = wallet?.walletDrep?.dRepIDCip105 || wallet?.walletDrepId || "";
  const currentVote = useMemo(() => {
    const id = String(wallet?.walletDrepId || "").toLowerCase();
    if (!id) return null;
    return votes.find((v) => v.role === "DRep" && String(v.voterId || "").toLowerCase() === id) || null;
  }, [votes, wallet?.walletDrepId]);

  if (!wallet?.actingAsDrep) return null;
  if (!isActive && !currentVote) return null;

  async function submit() {
    if (!wallet?.walletApi || !choice || phase.kind === "working") return;
    setPhase({ kind: "working", note: rationale.mode === "write" && rationale.text.trim() ? "Uploading the rationale to IPFS…" : rationale.url.trim() ? "Hashing the rationale document…" : "Building the transaction…" });
    try {
      const anchor = await resolveRationaleAnchor(rationale);
      setPhase({ kind: "working", note: "Please sign the vote in your wallet…" });
      const txHash = await submitDrepVote(wallet.walletApi, { drepId, actionId: proposalId, choice, anchor });
      setPhase({ kind: "done", txHash, choice, anchored: Boolean(anchor) });
    } catch (e) {
      setPhase({ kind: "error", message: readableError(e, "The vote could not be submitted.") });
    }
  }

  const variantFor = (c) => (choice !== c ? "outline" : c === "Yes" ? "primary" : c === "No" ? "danger" : "soft");

  return (
    <Card accent className="p-detail__block" title="Your DRep vote" subtitle={currentVote ? (isActive ? "A new vote replaces the one on record." : "Your vote on record for this action.") : "You have not voted on this action yet."} actions={
      isActive && !open && phase.kind !== "done" ? <Button variant="primary" onClick={() => setOpen(true)}>{currentVote ? "Change vote" : "Vote as DRep"}</Button> : null
    }>
      {currentVote ? <p className="row"><span className="muted small">On record:</span> <VotePill vote={currentVote.vote || "voted"} /></p> : null}

      {phase.kind === "done" ? (
        <Alert tone="success" title={`Vote submitted: ${phase.choice}.`}>
          {phase.anchored ? "The rationale anchor went on chain with it. " : "No rationale was attached. "}
          It shows here once Civitas has synced the chain, usually within a few minutes.{" "}
          <a className="mono" href={explorerTxUrl(phase.txHash)} target="_blank" rel="noreferrer">{phase.txHash.slice(0, 16)}…</a>
        </Alert>
      ) : null}

      {isActive && open && phase.kind !== "done" ? (
        <div className="stack" style={{ marginTop: currentVote ? 12 : 0 }}>
          <p className="small muted">Voting as DRep <span className="mono">{drepId}</span> on <strong>{actionName || proposalId}</strong></p>
          <div className="row" role="group" aria-label="Vote choice">
            {VOTE_CHOICES.map((c) => (
              <Button key={c} variant={variantFor(c)} aria-pressed={choice === c} onClick={() => setChoice(c)}>{c}</Button>
            ))}
          </div>
          <RationaleInput value={rationale} onChange={setRationale} />
          {phase.kind === "working" ? <Alert tone="info">{phase.note}</Alert> : null}
          {phase.kind === "error" ? <Alert tone="danger">{phase.message}</Alert> : null}
          <div className="row">
            <Button variant="primary" disabled={!choice || phase.kind === "working"} loading={phase.kind === "working"} onClick={submit}>
              {phase.kind === "working" ? "Working…" : choice ? `Submit ${choice} vote` : "Choose Yes, No or Abstain"}
            </Button>
            <Button disabled={phase.kind === "working"} onClick={() => { setOpen(false); setPhase({ kind: "idle" }); }}>Cancel</Button>
          </div>
          <p className="tiny muted">
            One transaction, signed with your DRep key; the wallet pays only the network fee. A rationale you write is uploaded to IPFS as a CIP-100 document and anchored to the vote; a URL you provide is fetched and hashed for the anchor.
          </p>
        </div>
      ) : null}
    </Card>
  );
}
