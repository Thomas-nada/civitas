// Opened doors that follow the wallet to every device.
//
// The first time a wallet connects on a device, it signs one free message (CIP-8, no
// transaction) proving it holds the wallet's stake key. The Civitas server checks it and hands
// back a token for this device. From then on, every door opened here is sent with that token,
// and the server keeps the union of all devices' doors per wallet. Connecting the same wallet
// anywhere else brings them all back.
import { CAL_YEAR, mergeProgress, progressMasks, store } from "./config";
import { type ConnectedWallet, signMessage } from "./wallet";

/** Where the server's progress API lives: /advent/api/progress inside Civitas. */
const API = (import.meta.env.VITE_PROGRESS_API as string | undefined) ?? `${import.meta.env.BASE_URL}api/progress`;

/** The address that names the wallet: the stake address is the same on every device. */
const walletAddress = (w: ConnectedWallet) => w.rewardAddress ?? w.changeAddress;
const tokenKey = (w: ConnectedWallet) => `sync:${w.network}:${CAL_YEAR}:${walletAddress(w)}`;

/** True once this device has a token for the wallet, so opened doors are saved for it. */
export const isLinked = (w: ConnectedWallet) => typeof store.get<unknown>(tokenKey(w), null) === "string";

export class SyncUnavailable extends Error {}

interface Masks {
  opened?: string;
  onday?: string;
}

async function post<T>(path: string, body: unknown, token?: string): Promise<{ status: number; data: T | null }> {
  let r: Response;
  try {
    r = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new SyncUnavailable("We couldn't reach the server to save your opened doors. They're kept on this device for now.");
  }
  const data = (await r.json().catch(() => null)) as T | null;
  return { status: r.status, data };
}

/** The message the wallet shows. The server reads Wallet, Network, Site and Time back from it. */
function message(w: ConnectedWallet): string {
  return [
    `Cardano Advent ${CAL_YEAR}: remember the doors I open, on all my devices.`,
    "",
    `Wallet: ${walletAddress(w)}`,
    `Network: ${w.network}`,
    `Site: ${location.host}`,
    `Time: ${new Date().toISOString()}`,
    "",
    "Signing is free. It is not a transaction: nothing is sent and nothing is spent.",
  ].join("\n");
}

const local = (): Masks => progressMasks() ?? {};

/** Sign once on this device and get a token. Throws if the wallet declines or the server says no. */
async function link(w: ConnectedWallet): Promise<Masks> {
  const text = message(w);
  const sig = await signMessage(text, walletAddress(w));
  const { status, data } = await post<Masks & { token?: string; error?: string }>(
    "/session",
    { net: w.network, address: walletAddress(w), message: text, signature: sig.signature, key: sig.key, ...local() },
  );
  if (status === 404) throw new SyncUnavailable("Saving opened doors across devices isn't available on this copy of the calendar.");
  if (status !== 200 || !data?.token) throw new Error(data?.error || "The server couldn't check that signature. Please try again.");
  store.set(tokenKey(w), data.token);
  return data;
}

/**
 * Send this device's doors and take back the wallet's full set. Without a token for this device,
 * does nothing unless `ask` is set, in which case the wallet is asked for its one signature.
 * Resolves to the days newly marked here and whether the device is (now) linked.
 */
export async function syncProgress(w: ConnectedWallet, ask: boolean): Promise<{ added: number[]; linked: boolean; first: boolean }> {
  const token = store.get<unknown>(tokenKey(w), null);
  let data: Masks | null = null;
  let first = false;
  if (typeof token === "string") {
    const r = await post<Masks>("", local(), token);
    if (r.status === 200) data = r.data;
    else if (r.status === 401) store.del(tokenKey(w)); // expired or from another server: sign again
    else if (r.status === 404) return { added: [], linked: false, first };
    else throw new SyncUnavailable("The server couldn't save your opened doors just now. They're kept on this device, and we'll try again.");
  }
  if (!data) {
    if (!ask) return { added: [], linked: false, first };
    data = await link(w);
    first = true;
  }
  return { added: mergeProgress(data ?? {}, new Date().toISOString()), linked: true, first };
}

let pushTimer = 0;
/** After a door opens: send the doors to the server a moment later (only on a linked device). */
export function pushSoon(w: ConnectedWallet | null) {
  if (!w || !isLinked(w)) return;
  clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    syncProgress(w, false).catch((e) => console.warn("progress push", e));
  }, 1200);
}
