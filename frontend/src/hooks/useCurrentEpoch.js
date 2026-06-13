import { useEffect, useState } from "react";

let _cached = null;
let _promise = null;

function fetchNetworkEpoch() {
  if (!_promise) {
    _promise = fetch("/api/network")
      .then((r) => r.json())
      .then((d) => { _cached = d.currentEpoch; return _cached; })
      .catch(() => null);
  }
  return _promise;
}

export function useCurrentEpoch() {
  const [epoch, setEpoch] = useState(_cached);
  useEffect(() => {
    if (_cached !== null) { setEpoch(_cached); return; }
    fetchNetworkEpoch().then((e) => { if (e != null) setEpoch(e); });
  }, []);
  return epoch;
}
