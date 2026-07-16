// Surveys (CIP-0179) can be browsed on preview or mainnet independently of the
// rest of Civitas, which is always mainnet. This module centralises that
// per-network choice: persistence, the API query param, explorer links, and
// epoch→date math (which differs by network).

const STORAGE_KEY = "civitas.surveys.network";

export const SURVEY_NETWORKS = ["mainnet", "preview"];
export const DEFAULT_SURVEY_NETWORK = "mainnet";

export const SURVEY_NETWORK_LABELS = {
  mainnet: "Mainnet",
  preview: "Preview",
};

export function getSurveyNetwork() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return SURVEY_NETWORKS.includes(v) ? v : DEFAULT_SURVEY_NETWORK;
  } catch {
    return DEFAULT_SURVEY_NETWORK;
  }
}

export function setSurveyNetwork(network) {
  try {
    if (SURVEY_NETWORKS.includes(network)) localStorage.setItem(STORAGE_KEY, network);
  } catch {
    // storage unavailable — the choice just won't persist across reloads
  }
}

// Cardanoscan explorer base per network.
export function explorerTxUrl(network, txHash) {
  const base = network === "preview" ? "https://preview.cardanoscan.io" : "https://cardanoscan.io";
  return `${base}/transaction/${txHash}`;
}

// Epoch → wall-clock end date. A survey accepts responses through `endEpoch`, so
// it ends when that epoch completes — the start of the following epoch. Mainnet
// anchors on the Shelley epoch-208 boundary (5-day epochs); preview is a Shelley
// testnet from genesis (1-day epochs). Preview genesis is derived from chain
// data (block time − slot = 1666656000, 2022-10-25T00:00:00Z).
const EPOCH_PARAMS = {
  mainnet: { anchorUnix: 1596059091, anchorEpoch: 208, lengthSec: 432000 },
  preview: { anchorUnix: 1666656000, anchorEpoch: 0, lengthSec: 86400 },
};

export function epochEndDate(network, endEpoch) {
  if (endEpoch == null) return "—";
  const p = EPOCH_PARAMS[network] || EPOCH_PARAMS.mainnet;
  const unix = p.anchorUnix + (endEpoch + 1 - p.anchorEpoch) * p.lengthSec;
  return new Date(unix * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
