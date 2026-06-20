import { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Transaction } from "@meshsdk/core";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { WalletContext } from "../context/WalletContext";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// One-click delegate landing page, meant to be shared as a link in social
// posts/replies. Loads just enough DRep info to show a name + delegate
// button; the wallet popup happens here on Civitas, never inside the post.
export default function DelegatePage() {
  const { drepId } = useParams();
  const decodedId = decodeURIComponent(String(drepId || "")).trim();
  const wallet = useContext(WalletContext);
  const [drep, setDrep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [delegating, setDelegating] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/api/drep-live?id=${encodeURIComponent(decodedId)}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) throw new Error(data?.error || "Failed to load DRep.");
        setDrep(data);
      })
      .catch((e) => { if (!cancelled) setError(e.message || "Failed to load DRep."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [decodedId]);

  useSeoMeta({
    title: drep?.name ? `Delegate to ${drep.name}` : "Delegate to a DRep",
    description: drep?.name
      ? `One-click delegate your Cardano governance voting power to ${drep.name} on Civitas.`
      : "One-click delegate your Cardano governance voting power on Civitas."
  });

  async function handleDelegate() {
    if (!decodedId) return;
    if (!wallet?.walletApi) {
      setNotice("Connect your wallet in the top bar, then click Delegate again.");
      return;
    }
    if (!wallet.walletRewardAddress) {
      setNotice("No reward address found in connected wallet. Delegation requires a stake/reward address.");
      return;
    }
    try {
      setDelegating(true);
      setNotice("");
      const tx = new Transaction({ initiator: wallet.walletApi, verbose: false });
      tx.setNetwork("mainnet");
      tx.txBuilder.voteDelegationCertificate({ dRepId: decodedId }, wallet.walletRewardAddress);
      const unsignedTx = await tx.build();
      const signedTx = await wallet.walletApi.signTx(unsignedTx, true, true);
      const txHash = await wallet.walletApi.submitTx(signedTx);
      setNotice(`Delegation submitted on-chain. Tx: ${txHash}`);
    } catch (e) {
      setNotice(`Delegation failed: ${e?.message || "Delegation transaction failed."}`);
    } finally {
      setDelegating(false);
    }
  }

  return (
    <main className="page shell delegate-page">
      <section className="page-head">
        <p className="eyebrow">Delegate</p>
        {loading ? (
          <h1>Loading DRep…</h1>
        ) : error ? (
          <h1>DRep not found</h1>
        ) : (
          <h1>Delegate to {drep?.name || decodedId}</h1>
        )}
        <p className="muted mono">{decodedId}</p>
      </section>

      {error ? (
        <section className="status-row">
          <p className="muted">{error}</p>
        </section>
      ) : (
        <section className="stats-section stats-section--wide">
          <div className="stats-section-body">
            {drep?.profile?.imageUrl ? (
              <img className="profile-image" src={drep.profile.imageUrl} alt={`${drep.name || decodedId} profile`} />
            ) : null}
            <div className="meta drep-profile">
              <button type="button" className="delegate-cta" onClick={handleDelegate} disabled={loading || delegating}>
                {delegating ? "Submitting Delegation..." : "Delegate Voting Power To This DRep"}
              </button>
              {!wallet?.walletApi ? <p className="muted">Connect your wallet in the top bar to enable delegation.</p> : null}
              {notice ? <p className="muted">{notice}</p> : null}
              <p><Link className="inline-link" to={`/dreps/${encodeURIComponent(decodedId)}`}>View full DRep profile</Link></p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
