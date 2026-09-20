// The DRep vote on one governance action, on the action's own page: Yes /
// No / Abstain with a rationale (URL or written and uploaded), signed and
// submitted with the signed-in DRep wallet. Independent of any survey.
import { useContext, useMemo, useState } from "react";
import { WalletContext } from "../../context/WalletContext";
import { explorerTxUrl } from "../../services/surveyNetwork";
import { EMPTY_RATIONALE, VOTE_CHOICES, resolveRationaleAnchor, submitDrepVote } from "../../services/voteTxService";
import { readableError } from "../../lib/wallet/walletError";
import RationaleInput from "./RationaleInput";

function pillFor(vote) {
  const v = String(vote || "").toLowerCase();
  if (v === "yes") return "pill--active";
  if (v === "no") return "pill--dropped";
  if (v === "abstain") return "pill--expired";
  return "pill--unknown";
}

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

  // Only a DRep session votes; the page stays as it is for everyone else.
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

  return (
    <section className="stats-section stats-section--wide">
      <div className="panel dvp" style={{ margin: 0 }}>
        <div className="dvp-head">
          <div className="dvp-head-copy">
            <span className="dvp-kicker">Your DRep vote</span>
            <div className="dvp-status">
              {currentVote ? (
                <>
                  <span className={`pill ${pillFor(currentVote.vote)}`}>{currentVote.vote || "voted"}</span>
                  <span className="muted">is your vote on record for this action{isActive ? "; a new vote replaces it" : ""}.</span>
                </>
              ) : isActive ? (
                <span className="muted">You have not voted on this action yet.</span>
              ) : null}
            </div>
          </div>
          {isActive && !open && phase.kind !== "done" ? (
            <button type="button" className="btn-primary" onClick={() => setOpen(true)}>{currentVote ? "Change vote" : "Vote as DRep"}</button>
          ) : null}
        </div>

        {phase.kind === "done" ? (
          <div className="svy-success" style={{ padding: 0 }}>
            <strong>Vote submitted: {phase.choice}.</strong>
            <span className="muted">
              {phase.anchored ? "The rationale anchor went on chain with it. " : "No rationale was attached. "}
              It shows here once Civitas has synced the chain, usually within a few minutes.
            </span>
            <span className="mono" style={{ fontSize: "0.8rem" }}>
              Transaction: <a className="ext-link" href={explorerTxUrl(phase.txHash)} target="_blank" rel="noreferrer">{phase.txHash}</a>
            </span>
          </div>
        ) : null}

        {isActive && open && phase.kind !== "done" ? (
          <div className="dvp-form">
            <p className="muted batch-drep-id" style={{ margin: 0 }}>Voting as DRep: <span className="mono">{drepId}</span> on <strong>{actionName || proposalId}</strong></p>
            <div className="batch-vote-choice-row" role="group" aria-label="Vote choice">
              {VOTE_CHOICES.map((c) => (
                <button key={c} type="button" className={`mode-btn vote-choice-btn vote-choice-btn--${c.toLowerCase()}${choice === c ? " active" : ""}`} onClick={() => setChoice(c)}>{c}</button>
              ))}
            </div>
            <RationaleInput value={rationale} onChange={setRationale} />
            {phase.kind === "working" ? <p className="muted" style={{ margin: 0 }}>{phase.note}</p> : null}
            {phase.kind === "error" ? <p className="vote-error" style={{ margin: 0 }}>{phase.message}</p> : null}
            <div className="dvp-actions">
              <button
                type="button"
                className={`vote-confirm-submit${choice ? ` vote-confirm-submit--${choice.toLowerCase()}` : ""}`}
                disabled={!choice || phase.kind === "working"}
                onClick={submit}
              >
                {phase.kind === "working" ? "Working…" : choice ? `Submit ${choice} vote` : "Choose Yes, No or Abstain"}
              </button>
              <button type="button" className="mode-btn" disabled={phase.kind === "working"} onClick={() => { setOpen(false); setPhase({ kind: "idle" }); }}>Cancel</button>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: "0.76rem" }}>
              One transaction, signed with your DRep key; the wallet pays only the network fee. A rationale you write is uploaded to IPFS as a CIP-100 document and anchored to the vote; a URL you provide is fetched and hashed for the anchor.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
