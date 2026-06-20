import { useEffect, useState } from "react";

// Resolves the DRep relevant to the connected wallet: the wallet's own DRep
// when signed in with a DRep key, otherwise the DRep it currently delegates
// stake to (for plain stake-key sessions).
export function useEffectiveDrepId(wallet) {
  const [delegatedDrepId, setDelegatedDrepId] = useState("");
  const ownDrepId = wallet?.actingAsDrep ? String(wallet?.walletDrep?.dRepIDCip105 || "") : "";
  const rewardAddress = String(wallet?.walletRewardAddress || "").trim();

  useEffect(() => {
    if (ownDrepId || !wallet?.walletApi || !rewardAddress) {
      setDelegatedDrepId("");
      return undefined;
    }
    let active = true;
    fetch(`/api/wallet-delegation?rewardAddress=${encodeURIComponent(rewardAddress)}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) setDelegatedDrepId(String(data?.delegatedDrepLiteralRaw || ""));
      })
      .catch(() => {
        if (active) setDelegatedDrepId("");
      });
    return () => {
      active = false;
    };
  }, [ownDrepId, wallet?.walletApi, rewardAddress]);

  return ownDrepId || delegatedDrepId || "";
}
