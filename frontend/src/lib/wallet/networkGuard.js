// Fail clearly when the wallet is on a different Cardano network than the app,
// instead of letting signData/submit fail with the wallet's own cryptic error.
// Civitas talks to mainnet unless the frontend is built with
// VITE_CARDANO_NETWORK=preprod (to match the server's Blockfrost/Koios base
// URLs). CIP-30 getNetworkId(): 1 = mainnet, 0 = testnets.
const configured = String(import.meta.env.VITE_CARDANO_NETWORK || "mainnet").trim().toLowerCase();

export const APP_NETWORK = ["preprod", "preview", "testnet"].includes(configured) ? configured : "mainnet";

/** Short, user-facing name of the app's network (also what the user switches the wallet to). */
export const APP_NETWORK_LABEL = APP_NETWORK === "mainnet"
  ? "Mainnet"
  : APP_NETWORK.charAt(0).toUpperCase() + APP_NETWORK.slice(1);

export function expectedNetworkId() {
  return APP_NETWORK === "mainnet" ? 1 : 0;
}

export function isExpectedNetwork(walletNetworkId) {
  return walletNetworkId === expectedNetworkId();
}

/** The one user-facing wording for a wallet/app network mismatch. */
export function networkMismatchMessage(walletNetworkId) {
  const from = walletNetworkId == null ? "a different network" : walletNetworkId === 1 ? "Mainnet" : "a testnet";
  return `Your wallet is on ${from}, but Civitas is running on ${APP_NETWORK_LABEL}. Switch your wallet to ${APP_NETWORK_LABEL} and try again.`;
}
