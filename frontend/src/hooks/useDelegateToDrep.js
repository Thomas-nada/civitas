// Builds and submits a vote delegation certificate with the connected wallet.
import { useContext, useState } from "react";
import { WalletContext } from "../context/WalletContext";
import { readableError } from "../lib/wallet/walletError";

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

