export type Net = "mainnet" | "preprod" | "preview";

export const NETWORKS: Net[] = ["mainnet", "preprod", "preview"];

/**
 * Koios answers CORS preflights but its actual responses lack
 * Access-Control-Allow-Origin, so browsers block direct calls. We go through a
 * same-origin proxy instead: `/koios/<network>/…` → `https://<net>.koios.rest/api/v1/…`.
 * Vite proxies it in dev/preview (vite.config.ts); netlify.toml / vercel.json do it
 * when hosted. Set VITE_KOIOS_PROXY to point at your own proxy elsewhere.
 */
const KOIOS_PROXY: string = import.meta.env.VITE_KOIOS_PROXY ?? `${import.meta.env.BASE_URL}koios`;
export const KOIOS_BASE: Record<Net, string> = {
  mainnet: `${KOIOS_PROXY}/mainnet`,
  preprod: `${KOIOS_PROXY}/preprod`,
  preview: `${KOIOS_PROXY}/preview`,
};

const EXPLORER: Record<Net, string> = {
  mainnet: "https://cardanoscan.io",
  preprod: "https://preprod.cardanoscan.io",
  preview: "https://preview.cardanoscan.io",
};

/** Our own metadata label for app-specific records (wish commit/reveal). */
export const APP_LABEL = 2512;
export const APP_ID = "cardano-advent";

/** The December this calendar belongs to. In January we keep last year's calendar open. */
export const CAL_YEAR = (() => {
  const now = new Date();
  return now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
})();

// ---------- tiny safe localStorage wrapper ----------
export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* private mode etc. — fine, state just won't persist */
    }
  },
  del(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

// ---------- network ----------

const savedNet = store.get<unknown>("network", "mainnet");
export const state: { network: Net } = {
  // Mainnet is the default: its read-only doors are the liveliest. Once a wallet
  // connects, the network follows the wallet (see wallet.ts `connect`).
  network: NETWORKS.includes(savedNet as Net) ? (savedNet as Net) : "mainnet",
};

/** Switch network. Does nothing (and fires no event) if `n` is already selected. */
export function setNetwork(n: Net) {
  if (!NETWORKS.includes(n) || n === state.network) return;
  state.network = n;
  store.set("network", n);
  window.dispatchEvent(new CustomEvent("network-changed"));
}

/** Per-network storage key, so testnet letters don't mix with mainnet ones. */
export const nkey = (k: string) => `${state.network}:${CAL_YEAR}:${k}`;

// ---------- sneak peek (session only) ----------

const PEEK_KEY = "advent:peek";
let peekMem = false; // used when sessionStorage is unavailable

/** True while "sneak peek" is on for this browser tab. Never persisted beyond the session. */
export function peekOn(): boolean {
  try {
    return sessionStorage.getItem(PEEK_KEY) === "1";
  } catch {
    return peekMem;
  }
}

export function setPeek(on: boolean) {
  peekMem = on;
  try {
    if (on) sessionStorage.setItem(PEEK_KEY, "1");
    else sessionStorage.removeItem(PEEK_KEY);
  } catch {
    /* ignore */
  }
}

// `?peek` turns it on for this tab; `?peek=0` turns it off again.
try {
  const q = new URLSearchParams(location.search);
  if (q.has("peek")) setPeek(!/^(0|false|off|no)$/i.test(q.get("peek") ?? ""));
} catch {
  /* ignore */
}
// Older builds stored peek forever in localStorage. Drop that so real visitors get real dates.
store.del("peek");

// ---------- door dates and opened doors ----------

const validDay = (day: number) => Number.isInteger(day) && day >= 1 && day <= 24;

/** Date gate: local midnight on Dec `day`. Always open in dev builds, or while peek is on. */
export function isUnlocked(day: number): boolean {
  if (!validDay(day)) return false;
  if (import.meta.env.DEV || peekOn()) return true;
  return Date.now() >= new Date(CAL_YEAR, 11, day).getTime();
}

const OPENED_KEY = `opened:${CAL_YEAR}`;

/** Day → ISO timestamp of the first time that door was opened, for this year's calendar. */
export function getOpened(): Record<number, string> {
  const raw = store.get<unknown>(OPENED_KEY, null);
  const out: Record<number, string> = {};
  if (Array.isArray(raw)) {
    // old format: number[] with no timestamps
    const now = new Date().toISOString();
    for (const d of raw) if (validDay(Number(d))) out[Number(d)] = now;
    store.set(OPENED_KEY, out);
  } else if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>))
      if (validDay(Number(k)) && typeof v === "string") out[Number(k)] = v;
  }
  return out;
}

/** Forget which doors were opened (dev reset). Wallet-personal data such as wish salts is kept. */
export function resetOpened() {
  store.del(OPENED_KEY);
}

/** Record that a door was opened. Returns true if this was the first time. */
export function markOpened(day: number): boolean {
  if (!validDay(day)) return false;
  const opened = getOpened();
  if (opened[day]) return false;
  opened[day] = new Date().toISOString();
  store.set(OPENED_KEY, opened);
  return true;
}

// ---------- explorer links ----------

const seg = (s: string) => encodeURIComponent(String(s));
export const explorerTx = (hash: string) => `${EXPLORER[state.network]}/transaction/${seg(hash)}`;
export const explorerBlock = (hash: string) => `${EXPLORER[state.network]}/block/${seg(hash)}`;
export const explorerPool = (id: string) => `${EXPLORER[state.network]}/pool/${seg(id)}`;
export const explorerToken = (fingerprint: string) => `${EXPLORER[state.network]}/token/${seg(fingerprint)}`;
export const explorerAddress = (addr: string) => `${EXPLORER[state.network]}/address/${seg(addr)}`;
/** Cexplorer asset page: it draws on-chain SVG pictures, which some wallets (Vespr) don't. */
export const pictureExplorer = (fingerprint: string) =>
  `https://${state.network === "mainnet" ? "" : `${state.network}.`}cexplorer.io/asset/${seg(fingerprint)}`;
