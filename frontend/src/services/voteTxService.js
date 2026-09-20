// A DRep's governance vote on one action, with its rationale anchor: either a
// document the DRep hosts (URL, hashed here) or one written in Civitas and
// uploaded to IPFS as CIP-100 JSON by the server. Shared by the action page's
// vote panel and the survey form's "vote with the answer" option.
import { Transaction } from "@meshsdk/core";
import { buildVoteAnchor, govActionRef, submitSignedTx } from "./surveyTxService";

export const VOTE_CHOICES = ["Yes", "No", "Abstain"];

/** An empty rationale draft: a URL, or text written and uploaded. */
export const EMPTY_RATIONALE = { mode: "url", url: "", text: "" };

/** Uploads a written rationale as CIP-100 JSON; resolves to its anchor. */
export async function uploadRationale(text) {
  const res = await fetch("/api/upload-rationale", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment: String(text || "").trim() })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "The rationale could not be uploaded to IPFS.");
  return { anchorUrl: data.ipfsUrl, anchorDataHash: data.contentHash };
}

/**
 * The anchor for a rationale draft ({ mode: "url" | "write", url, text }):
 * undefined when the draft is empty, so a vote without rationale stays valid.
 */
export async function resolveRationaleAnchor(draft) {
  if (!draft) return undefined;
  if (draft.mode === "write") {
    const text = String(draft.text || "").trim();
    return text ? uploadRationale(text) : undefined;
  }
  return buildVoteAnchor(draft.url);
}

/**
 * Builds, signs and submits a DRep vote. Resolves to the transaction hash.
 * `vote` = { drepId, actionId (gov_action1…), choice, anchor? }.
 */
export async function submitDrepVote(walletApi, vote) {
  if (!VOTE_CHOICES.includes(vote.choice)) throw new Error("Choose Yes, No or Abstain.");
  const utxos = await walletApi.getUtxos();
  if (!utxos?.length) throw new Error("No UTxOs found in wallet. Fund your wallet with ADA and try again.");
  const { txHash, txIndex } = govActionRef(vote.actionId);
  const tx = new Transaction({ initiator: walletApi, verbose: false });
  tx.setNetwork("mainnet");
  tx.txBuilder.vote(
    { type: "DRep", drepId: vote.drepId },
    { txHash, txIndex },
    { voteKind: vote.choice, ...(vote.anchor ? { anchor: vote.anchor } : {}) }
  );
  const unsignedTx = await tx.build();
  const signedTx = await walletApi.signTx(unsignedTx, true, true);
  return submitSignedTx(walletApi, signedTx);
}
