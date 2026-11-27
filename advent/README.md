# Cardano Advent Calendar 🎄₳

> **Inside Civitas:** this folder is served at **www.civitasexplorer.com/advent/** by the Civitas `server.js`, which also forwards `/advent/koios/<network>/…` to Koios (set `KOIOS_API_TOKEN` on Render for a higher rate limit). Render builds it with `npm run build:advent` from the repo root (`vite build --mode civitas`). The Netlify / Vercel / Render notes below are for running the calendar on its own.


A 24-door advent calendar where every door opens onto the live Cardano blockchain. Doors unlock on their day in December, using the visitor's local time. 14 of the doors need no wallet.

```
npm install
npm run dev        # http://localhost:5173 (every door is unlocked in dev)
```

The production build keeps the real dates. To try every door on a deployed copy, add `?peek` to the URL. It lasts for that browser tab only (`?peek=0` turns it off).

## The doors

| Day | Door | What it does | Cost |
|---|---|---|---|
| 1 | The Chain's Heartbeat | Live block height with a pulse that beats on every new block, and the pools that baked the last few | free |
| 2 | Who Baked This Block? | The stake pool behind the newest block | free |
| 3 | Transaction Snowfall | Recent transactions as tappable snowflakes, sized by ADA moved | free |
| 4 | Fortune Cookie | A fortune picked by the newest block hash (1 in 256 cookies is golden) | free |
| 5 | Naughty or Nice? | Scores your wallet on staking, voting delegation and activity | free, wallet |
| 6 | Epoch Advent Wreath | One candle per day of the current epoch | free |
| 7 | The Great ADA Gift Pile | All 45B ADA as 100 presents: circulating, treasury, rewards, reserves | free |
| 8 | Sign the Nice List | A certificate signed by your wallet (CIP-30 `signData`), with a wax seal drawn from the signature | free, wallet |
| 9 | Block-Hash Tree | A tree decorated by a block hash | free |
| 10 | UTxO Snowman | Your UTxOs rolled into a snowman | free, wallet |
| 11 | Stake Pool Party | Your pool, or a random "Secret Santa" pool to unwrap | free |
| 12 | Letter to Santa | A CIP-20 message (label 674) written on-chain | ~0.17 ₳ fee |
| 13 | Santa's Mailbox | Your letters read back, plus notes other people attached to transactions in the last few minutes | free |
| 14 | Treasury Stockings | Treasury requests as stockings on a mantel, sized by ADA asked | free |
| 15 | Mint an Ornament | An NFT whose art is shaped by a block hash and your key, stored fully on-chain (CIP-25) | ~0.3 ₳ fee, ~1.2 ₳ stays with the NFT |
| 16 | Biggest Gift | The biggest and smallest gift and the cheapest fee in the last 10 blocks | free |
| 17 | Gift a Friend | Send ADA with a card attached; `$handle` on mainnet; a review step before the wallet opens | fee + gift |
| 18 | Christmas in Slots | An advent candle burning down to Christmas, counted in slots | free |
| 19 | DRep Carolers | Your DRep, or a random one, singing their pitch | free |
| 20 | Ghost of Christmas Past | The first block of every past Christmas Day, as snow globes | free |
| 21 | Seal a Secret Wish | Puts only a SHA-256 fingerprint of a wish on-chain, with a downloadable reveal code | ~0.17 ₳ fee |
| 22 | Hang Your Ornaments | Your ornaments on your own tree, read from the chain, with a shareable `?tree=` link | free, wallet |
| 23 | Elf Workload Report | 20 sleighs loaded to the fullness of the last 20 blocks | free |
| 24 | Light the Star | Mints a personal Christmas Star (needs an ornament) and reveals your wish | ~0.3 ₳ fee |

Several doors have a **Share** button that draws a 1200×1200 picture and opens the phone's share sheet (or downloads the PNG on desktop).

Above the grid, a village scene lights one bulb on the tree for every door you've opened and reacts to each new block. Sound is generated in the browser and off by default (speaker button in the header). Door *N* plays note *N* of "Jingle Bells".

### The ornament policy

Each visitor gets their own minting policy, a native script that requires **their key** and is only valid **before Dec 26 00:00 UTC**:

```json
{ "type": "all", "scripts": [
  { "type": "sig", "keyHash": "<your payment key hash>" },
  { "type": "before", "slot": "<slot of Dec 26 00:00 UTC>" } ] }
```

After that nobody can mint under it again, so the ornaments are a real limited edition. The key is chosen once (used addresses first) and remembered per wallet. When looking for ornaments, the app also tries every address the wallet reports, so wallets that rotate their change address still find them. Minting the same token name twice is refused. Every NFT the app mints carries `app: "cardano-advent"` in its 721 metadata.

The doors show the closing time in the visitor's own time zone, which is Dec 25 evening in the Americas. After the lock, Door 24 can still reveal a sealed wish without minting.

### The wish (commit and reveal)

Door 21 puts `sha256(wish + "|" + salt)` on-chain under metadata label `2512`. The wish and salt are saved in the browser *before* the wallet is asked to sign, and can be downloaded as a reveal code. Door 24 publishes them, in the Star's mint transaction or on their own, so anyone can re-hash them and check they match.

## Networks

**Mainnet is the default**, because its live data makes the read-only doors interesting. When a wallet connects, the app follows the wallet's network. For testnets it tells preprod and preview apart by looking up one of the wallet's coins. When it is on mainnet with a wallet connected, the header shows a "Mainnet · real ADA" marker. People can switch to Preprod or Preview from the wallet sheet and use test ADA from the [faucet](https://docs.cardano.org/cardano-testnets/tools/faucet).

## How it works

- **Chain reads:** [Koios](https://koios.rest) (`src/koios.ts`): timeouts, one retry on 429/5xx, small batched POST bodies, a short cache, and one shared block poller (`onBlock`) that pauses in background tabs.
- **Wallet and transactions:** [Mesh SDK](https://meshjs.dev) 1.9 with any CIP-30 wallet (`src/wallet.ts`). Mesh (~1.7 MB gzipped) only loads when someone connects a wallet. Wallet state is re-read before every transaction, and the TTL comes from the chain tip, not the computer's clock.
- **Doors:** `src/doors/early.ts` (1–12), `src/doors/late.ts` (13–24), shared helpers in `src/doors/shared.ts`. Each door is `{ day, title, emoji, kind, teaser, render(el) }`.
- **Shell:** `src/main.ts`, which covers the grid, door choreography, the `<dialog>` modal, the wallet sheet, deep links (`#day-N`, `?tree=`, `?o=` progress links for phones) and the snow.
- **Art:** `src/art.ts` (ornament, star, tree, snowman, door icons), `src/share.ts` (share cards), `src/scene.ts` (village scene), `src/sound.ts` (Web Audio).

## Before launch

1. **Site URL for link previews.** `index.html` uses absolute URLs for `og:image`. They come from `VITE_SITE_URL`, falling back to Netlify's `URL` or Vercel's `VERCEL_PROJECT_PRODUCTION_URL` at build time. On other hosts set `VITE_SITE_URL=https://your.site` (no trailing slash). `npm run og` regenerates `public/og.png`.
2. **Koios rate limits.** The public tier allows about 5,000 requests a day per IP, and every visitor reaches Koios through your host's proxy, so they may all share one quota. Register a free Koios token and add `Authorization: Bearer <token>` to the proxied requests. That needs an edge or serverless function with the token in an environment variable; don't put the token in `netlify.toml` or `vercel.json`, which are committed.
3. **Test with real wallets on preprod**: Lace, Eternl, Vespr, and a Ledger through one of them, before the transaction doors open (Day 12 is the first).

### Koios proxy

Koios answers CORS preflights, but its actual responses don't include `Access-Control-Allow-Origin`, so browsers block direct calls. The app calls `/koios/<network>/…` on its own origin instead, and that path gets proxied:

- **dev / `npm run preview`:** `vite.config.ts`
- **Netlify:** `netlify.toml`
- **Vercel:** `vercel.json`
- **Render:** `render.yaml` (Static Site rewrites)
- **Anything else:** set up the same rewrite, or point `VITE_KOIOS_PROXY` at a proxy you run.

## Build

```
npm run build      # → dist/
```
