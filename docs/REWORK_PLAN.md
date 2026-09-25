# Civitas rework plan

Branch: `claude/dazzling-hamilton-697zpu` (nothing goes to `main` until you say so).
Status: **awaiting approval**. Nothing below has been implemented yet.

Scope, in your words: rework the whole thing, keep every feature, improve look, feel and
responsiveness, cut Blockfrost requests hard, make governance-action indexing much faster.

This document has four parts:

1. What the audit found (why we burn hundreds of thousands of requests a day).
2. The target architecture (data sources, indexer, API, frontend).
3. The delivery phases, each shippable on its own.
4. Decisions I need from you.

---

## 1. Findings

### 1.1 Where the Blockfrost requests go

Counts below use the committed `snapshot.seed.json` (epoch 657): 158 proposals, 1,681 DReps
(796 with zero voting power), 2,996 SPOs, about 46k vote rows, 27.5k unique vote transactions.

Steady state (instance awake, one delta sync every 10 minutes):

| Call site | Where | Calls per delta | Per day |
|---|---|---|---|
| Phase 3b: re-read every zero-power DRep (`/governance/dreps/{id}`) | `server.js:6405-6434` | ~796 | ~115,000 |
| `fetchEpochEndTimes`: `/epochs/{n}` for every epoch 507..now, on every publish | `server.js:5635`, called from `:5832` | 151 | ~22,000 |
| Phase 3c: top-500 DRep status refresh, hourly | `server.js:6436-6478` | ~83 (avg) | ~12,000 |
| Phase 2: re-read every votes page of every open proposal | `server.js:6216-6229` | ~7 | ~1,000 |
| Everything else in the delta | | ~15 | ~2,000 |

Per restart (Render free plan sleeps after 15 min idle; every wake and every auto-deploy restarts
the process with an empty disk):

| Item | Calls |
|---|---|
| `/txs/{hash}` to get a timestamp for each of 27.5k vote transactions (cache lost on restart) | ~27,500 |
| Per-proposal detail, metadata, tx, block, votes pages | ~1,200 |
| Per-DRep detail and metadata (815 voters × 2) | ~1,600 |
| SPO tx metadata for rationale detection | up to 2,000 |
| Misc (pools, params, special DReps, epochs) | ~200 |
| **Cold full sync total** | **~32,500** (2 to 3 hours at the 180 ms spacing) |

The two GitHub workflows (`sync-rationales.yml` every 12 h, `update-seed.yml` every 4 days) commit
to `main`, and `render.yaml` has `autoDeploy: true`, so each of those commits redeploys and
triggers a cold sync. That is at least two cold syncs a day on top of user-triggered wakes.

Result: roughly 200k to 250k Blockfrost calls per day, near the throttle ceiling of ~475k
(180 ms gap). The 429 retry loop (4 attempts, no `Retry-After`) multiplies this further on bad days.

On-demand routes add hot spots: `/api/drep-delegators` (up to 50 pages per profile view),
`/api/proposal-vote-rationales` (falls through to `/txs/{hash}/cbor` for every vote when cgov is
down, up to ~1,300 calls per page view, re-run on every SSE refresh).

### 1.2 Why it is slow

- Blockfrost has no "all votes since X" endpoint, so the indexer walks every proposal's vote
  pages and then fetches every vote transaction one by one for a timestamp.
- Koios `vote_list` (which already has `block_time`, anchors and voter ids, 1,000 rows per page)
  is **already fetched** for every batch and then discarded except for rationale fields
  (`server.js:2486-2564`).
- Nothing survives a restart on Render free: no snapshot, no caches. Only the committed seed
  survives, and boot hydration from it is **off by default** (`SKIP_BOOT_HYDRATION=true`,
  `server.js:137`).
- The epoch-boundary full rebuild never fires (delta writes `latestEpoch`, then
  `lastEpochAtSync` is set from it, so they always match), and any single failed page marks the
  snapshot incomplete, which forces a *full* rebuild on the next 10-minute tick (a cascade).

### 1.3 Frontend

- No shared data layer. Every page fetches `/api/accountability?view=…` on mount: about 18 MB of
  JSON for the landing page, 15 MB for `/dreps`, the full 31 MB for the rationales archive. The
  server sends it uncompressed with `Cache-Control: no-store`. Every SSE update re-downloads it.
- JS/CSS bundles are never browser-cached: the hashed-asset regex in `server.js:8057` expects
  `name.<hex8>.js` but Vite emits `name-<base64url>.js`.
- `@meshsdk/core` and the Cardano serialisation libs are statically imported by the landing
  route, so `React.lazy` does not keep them out of the first load.
- One 9,868-line `index.css`, 580 inline `style={{}}` blocks, 15 media queries at 11 different
  widths, about 200 dead classes, roughly 20 button variants, 3 unrelated modal implementations.
- The body font (`Space Grotesk`) and mono font (`IBM Plex Mono`) are referenced but never
  loaded; only Orbitron is. The app renders in system fonts.
- Light theme is broken on Stats, Treasury, Intersect, Blockfrost and the voter profile chart by
  hard-coded dark colours in inline styles.
- Routes that share a component (`/dreps`, `/spos`, `/committee`; `/` and `/actions`; the three
  profile routes) keep stale state when switching between them, and `?snapshot=` is read once
  from `window.location`.
- Accessibility: clickable `<tr role="button">` with nested links and tooltips, no focus trap in
  modals, hover-only nav dropdowns, sortable `<th onClick>` without keyboard support.
- The two UI e2e tests in `e2e/critical-flows.spec.js` already fail (they expect an inline
  expanding row that no longer exists). CI does not run Playwright, so nobody noticed.
- Without `frontend/dist`, the server falls back to serving the repo root, which exposes
  `server.js`, `snapshot.seed.json` and `.env` if present.

---

## 2. Target architecture

### 2.1 Data sources: Koios first, Blockfrost demoted to optional fallback

Every Blockfrost call the indexer makes today has a Koios equivalent that returns the same data in
far fewer calls, and half of them are already used in the codebase:

| Need | Today (Blockfrost) | Target (Koios) |
|---|---|---|
| Proposal list + status epochs + metadata | list pages + 4 calls per proposal (~640) | `GET /proposal_list` (1 to 2 pages) |
| All votes with timestamps and anchors | votes pages (~540) + `/txs/{hash}` per vote (27.5k) | `GET /vote_list` ordered by `block_time`, 1,000 per page (~47 cold, 1 per delta with a watermark) |
| DRep list, status, power | 17 list pages + 1 to 2 calls per DRep (~2,400) | `GET /drep_list` (2) + `GET /drep_history?epoch_no=` (2, already used) + `POST /drep_info` in batches of 50 (~34) |
| DRep metadata | 1 per DRep | `POST /drep_metadata` batches (~34), only for changed anchors |
| DRep delegators | up to 50 pages | `GET /drep_delegators` (1,000 per page) |
| Pools + delegated DRep | 30 pages + 2 per pool (~6,000) | `GET /pool_list` (3) + `POST /pool_info` (already used, has `reward_addr_delegated_drep`) |
| Committee | Koios already | unchanged |
| Epoch end times (151 per publish) | `/epochs/{n}` | arithmetic from the Shelley genesis constants already in `server.js:167-168` |
| Current epoch, params | `/epochs/latest`, `/parameters` | `GET /tip`, `GET /epoch_params` |
| Wallet delegation | `/accounts/{stake}` | `POST /account_info` |
| Script CBOR | `/scripts/{h}/cbor` | `POST /script_info` |
| IPFS pinning of rationales | Blockfrost IPFS (separate key) | unchanged |

Budget after the change:

| Sync | Koios calls | Blockfrost calls | Wall time |
|---|---|---|---|
| Cold full sync | ~170 | 0 | ~1 to 2 minutes |
| Delta (every 10 min) | ~5 | 0 | seconds |
| Per day, steady state | ~1,000 to 2,000 | 0 (fallback only) | |

Koios limits: public tier 5,000 requests per day without a key, free registered key 50,000 per
day, burst 100 requests per 10 seconds. The public tier is enough for the numbers above. A free
key gives headroom; the code already reads `KOIOS_API_KEY`.

Blockfrost stays wired as an optional fallback provider behind a provider interface, with a hard
daily budget (`BLOCKFROST_DAILY_BUDGET`, default a few thousand). When the budget is spent the
provider refuses further calls for the day and the sync continues on Koios. That makes the bill a
ceiling rather than a hope.

**Demeter.run.** I looked at it, since you asked. Two relevant products:

- *Hosted db-sync (PostgreSQL over a connection string).* This is the fastest possible indexer:
  one SQL query returns every vote since a block, with anchors and timestamps, and one more gives
  DRep power per epoch. It is pay-as-you-go on connection time and free for open-source projects
  according to their site. It adds a Postgres dependency and a credential to manage.
- *Blockfrost-compatible API powered by Dolos.* Same request-shaped problem as Blockfrost, and
  the governance endpoints only landed in Dolos during 2026 with incomplete parity. Not a fit.

Recommendation: do Koios first, since it gets you to zero Blockfrost calls and a two-minute full
sync with no new vendor. Build the indexer behind a small provider interface (`getProposals`,
`getVotesSince`, `getDrepsBatch`, `getPools`, `getCommittee`, `getTip`) so that a Demeter
db-sync adapter can be added later as a third provider. I would add that adapter only if you have
or want a Demeter account; it needs a connection string to be tested. See Decision 2.

### 2.2 Indexer

New `server/sync/` module replacing `buildFullSnapshot` and `buildDeltaSnapshot`:

- **Full sync**: `proposal_list`, `vote_list` (all pages), `drep_list` + `drep_history` +
  `drep_info` batches, `pool_list` + `pool_info` batches, `committee_info`, `tip`,
  `epoch_params`. Derive everything the current snapshot schema needs (proposalInfo, dreps, spos,
  committeeMembers, specialDreps, thresholdContext, voteStats, nomosModel from
  `proposal_voting_summary` for open proposals only). Output the **same snapshot schema** the
  frontend and the seed workflow consume, so nothing downstream breaks.
- **Delta sync**: `tip`, `proposal_list`, `vote_list?block_time=gt.<watermark minus 2 hours>`
  (the overlap absorbs rollbacks and late indexing; votes are upserted per voter/proposal keeping
  the newest tx), `drep_info` only for voters seen in the delta, `proposal_voting_summary` only
  for proposals that gained votes. About five calls.
- **Epoch boundary**: detected from `tip.epoch_no` versus the snapshot, which triggers one full
  sync (fixes the never-firing rebuild), plus the daily safety net stays.
- **Failure handling**: a failed page marks only that entity stale and is retried next delta; it
  no longer flips the whole snapshot to "incomplete" and forces a full rebuild cascade. Honour
  `Retry-After` on 429, single global limiter per provider, no parallel bursts.
- **Rationale signals** stay as today (Koios `meta_url`/`meta_json`, cgov fallback, IPFS gateways)
  but with a TTL on the caches and negative caching, so a cgov outage cannot route traffic to the
  Blockfrost CBOR path.

### 2.3 Persistence on an ephemeral disk

- Boot hydration from `snapshot.seed.json` becomes the default (`SKIP_BOOT_HYDRATION=false`).
  A restart then costs one delta, not a cold sync.
- Vote timestamps already live in the seed (`votedAtUnix` on every vote), so the
  `cache.voteTxTimes.json` file is no longer needed at all. The DRep metadata cache and SPO
  profile cache are folded into the seed export.
- The two bot workflows commit with `[skip render]` in the message so they stop redeploying the
  service. The seed workflow keeps running every 4 days (it now also refreshes the caches inside
  the seed).
- Sync state (`proposalDeltaPollState`, watermarks, last-refresh timestamps) is written into the
  snapshot so it survives restarts.

### 2.4 API

Versioned, compact, cacheable endpoints under `/api/v1/`, with the old `/api/accountability`
kept as a thin compatibility layer during the transition and removed at the end:

| Endpoint | Replaces | Payload (gzipped, estimated) |
|---|---|---|
| `GET /api/v1/actions` — one row per action with server-computed vote tallies, power breakdown, thresholds, survey link, status, expiry | `view=actions` (~4.3 MB gz) | < 100 KB |
| `GET /api/v1/actions/:id` — one action with its votes, metadata, rationale, threshold model | `view=actions` + 3 extra routes | 20 to 300 KB |
| `GET /api/v1/actors/:type` — DReps / SPOs / CC as compact columnar rows: per-actor fields plus a packed vote list `[proposalIndex, voteCode, hasRationale, responseHours]` | `view=drep|spo|committee` (~3 to 4 MB gz) | 150 to 400 KB |
| `GET /api/v1/actors/:type/:id` — one profile with full vote history | `view=drep` for one DRep (15 MB) | < 50 KB |
| `GET /api/v1/stats` — pre-aggregated series for the Stats page | `view=stats` (18 MB) | < 200 KB |
| `GET /api/v1/rationales/index` — action names and vote lookup for the archive | `view=all` (31 MB) | < 100 KB |
| `GET /api/v1/meta` — snapshot key, generatedAt, epoch, tip, sync status | `/api/sync-status`, `/api/network` | 1 KB |

The packed vote list keeps every client-side score toggle, slider and filter working exactly as
today (the scoring code moves into a shared module and is unit tested against the current
outputs).

Cross-cutting: gzip/brotli on every JSON response, strong ETags with `If-None-Match` support so
SSE refreshes cost a 304 when nothing changed, correct `immutable` caching for Vite's hashed
assets, `Cache-Control: public, max-age=60` on read endpoints, and the historical `?snapshot=`
parameter honoured on all v1 endpoints. All existing write and admin endpoints stay as they are.

### 2.5 Frontend

Keep the brand (dark default, mint accent, Orbitron display face, the animated background as an
opt-in that respects reduced motion). Rebuild the foundation under it:

- **Design tokens**: colour (semantic: surface, text, accent, success, danger, warning, and vote
  yes/no/abstain), spacing scale, type scale, radius, elevation, z-index, for dark and light.
  Theme set before first paint (inline script + `prefers-color-scheme`).
- **Self-hosted fonts**: Orbitron for display, Space Grotesk for body, IBM Plex Mono for
  identifiers, loaded with `font-display: swap`.
- **Component kit** (plain React + CSS modules, no new UI library): Button, IconButton, Tabs,
  Pill, Card, StatTile, DataTable (scroll wrapper, sticky first column, sort buttons with
  `aria-sort`, card layout under 680 px), Modal (focus trap, Escape, scroll lock, return focus),
  Tooltip (click/tap on touch), Disclosure, Skeleton, EmptyState, ErrorState, Toast.
- **Shell**: click-to-open accessible nav menus, mobile drawer holding nav, theme, Report Bug and
  account, 44 px touch targets, skip link, a real Suspense skeleton instead of a blank screen.
- **Data layer**: TanStack Query with a shared cache across routes, the SSE `snapshot-updated`
  event invalidating queries (with a reconnecting fallback), ETag-aware fetches.
- **Routing state**: `key` per route so shared components remount, filters/sort/tab/section in
  `useSearchParams` so every view is deep-linkable, `?snapshot=` read reactively.
- **Page work** (every feature listed in section 3 is preserved):
  - Actions: same table, KPIs, filters, batch vote wizard, survey answers in the same tx; large
    lists virtualised; heavy libs loaded on first vote action.
  - Action detail: same tabs and blocks; vote filters, rationale modal, MetaVerifyPill,
    treasury delivery block; fetches only its own action.
  - DReps/SPOs/CC dashboards: same scoring toggles, slider, type popover, registration form,
    pager; scoring runs off the packed vote list; virtualised "All" view; tooltip and links no
    longer trigger row navigation.
  - Voter profile, delegate landing, stats, treasury (all three pages), epoch calendar, surveys
    (list, create, detail, respond, CLI answer), rationales archive, constitution, CIPs, guide,
    about, changelog, intersect, blockfrost, bugs: restyled on the kit, responsive tables and
    charts, light theme fixed, chart colours from tokens, countdowns isolated so a 1 s tick does
    not re-render a page.
- **Performance**: `manualChunks` for mesh, recharts and markdown; polyfills scoped to the wallet
  chunk; per-frame `:root` writes replaced by a CSS animation; the 400 ms zoom poll removed;
  dead code deleted (about 450 lines in Dashboard, unused pie components, single-vote modal,
  the orphaned NCL page, ~200 dead CSS classes).
- **Legacy static UI** (`index.html`, `app.js`, `styles.css` at the repo root): retired. The
  server returns a "frontend not built" page instead of serving the repo root.

### 2.6 Backend structure

`server.js` (11k lines) is split into modules without changing behaviour of the parts not being
rewritten: `server/config.js`, `server/http/` (router, static, compression, etag),
`server/providers/{koios,blockfrost}.js`, `server/sync/`, `server/store/` (snapshot, seed,
history), `server/domain/` (scoring, thresholds, nomos, rationale signals), `server/routes/*.js`,
`server/index.js`. `lib/surveys.js` stays as is.

### 2.7 Tests and CI

- Provider adapters tested against recorded Koios fixtures (`node --test`), including the delta
  watermark, re-vote upsert and rollback overlap.
- Scoring/threshold domain module tested against outputs computed from the current seed so the
  numbers users see today do not drift.
- Playwright fixed and run in CI on a built `frontend/dist`: actions list → detail → back with
  `?snapshot`, dashboards on Desktop Chrome and Pixel 7, survey fixture, bug report flow, light
  theme smoke.
- Request-budget assertion: a full sync in replay mode must make 0 Blockfrost calls and fewer
  than 250 provider calls.

---

## 3. Phases

Each phase ends with a passing `npm run ci`, a pushed branch and a short report. You can stop or
redirect after any phase. Order is chosen so the cost problem is fixed first.

**Phase 0: Stop the bleeding (small diff, could be cherry-picked to `main` immediately).**
1. Delete Phase 3b's per-DRep refetch; take zero-power DRep power from the `drep_history` call
   that already runs. Remove Phase 3c's hourly 500-call refresh in favour of the same source.
2. Compute epoch end times arithmetically; drop the 151 `/epochs/{n}` calls per publish.
3. Use the `block_time` already in the fetched Koios `vote_list` rows; stop the `/txs/{hash}`
   timestamp lookups.
4. Default `SKIP_BOOT_HYDRATION=false`; `[skip render]` on bot commits; fix the epoch-boundary
   check and the incomplete-snapshot rebuild cascade; honour `Retry-After`.
5. TTL and negative caching on the on-demand hot spots (`/api/proposal-vote-rationales`,
   `/api/drep-delegators`, cgov maps).
Expected effect: from ~200k+ per day to under ~5k per day on Blockfrost, and cold sync from
~32k calls to ~3k. Estimated size: about a day of work.

**Phase 1: Koios-first indexer and persistence** (sections 2.1 to 2.3, 2.6 for providers/sync/
store). Zero Blockfrost calls in steady state, full sync in about two minutes, snapshot schema
unchanged. Includes the Blockfrost daily budget and the provider interface. Blockfrost stays
available for anything Koios cannot answer, behind the budget.

**Phase 2: API v1, compression, caching** (section 2.4). Frontend switched page by page to the
new endpoints behind the query layer; old `view=` endpoints kept until every page has moved.

**Phase 3: Frontend rework** (section 2.5). Tokens, fonts, component kit and shell first, then
pages in this order: Actions and detail, dashboards and profiles, stats, treasury, calendar,
surveys, rationales, constitution/CIPs/guide/about, intersect/blockfrost/bugs/delegate. A
screenshot set (desktop and Pixel 7, dark and light) is committed under `docs/screens/` per page
so you can review the look without running anything.

**Phase 4: Hardening.** Tests and CI (2.7), README and `.env.example` rewritten for the new
variables, `KNOWN_BUGS.md` updated, dead config removed, legacy UI removed.

---

## 4. Decisions I need from you

1. **Koios key.** Do you have (or want to register) a free Koios key? The public tier is enough
   for the projected volume, but a key doubles as insurance. I will read it from the existing
   `KOIOS_API_KEY` variable either way.
2. **Demeter.** My recommendation is Koios only in this pass, with the provider interface ready
   for a db-sync adapter. If you would rather have the Demeter db-sync adapter built now, I need
   a connection string set in the Render environment, and I would test it there rather than here.
3. **Visual direction.** I plan to keep the current identity (dark-first, mint accent, Orbitron
   headings, optional animated background) and modernise the execution. Say so if you want a
   different look, or share a reference.
4. **Legacy static UI.** I plan to delete the root `index.html`, `app.js` and `styles.css`.
5. **Verification environment.** This sandbox's network policy blocks `api.koios.rest`,
   `blockfrost.io` and `demeter.run`, so I cannot make live calls from here. I will develop the
   providers against recorded fixtures and a replay mode. To let me verify live syncs myself,
   allow those hosts in this environment's network settings; otherwise I will give you a
   one-command check to run (`npm run sync:dry`) that prints the request ledger for one full sync.

Reply with "go" (and answers to 1 to 5 where you differ from my recommendation) and I will start
with Phase 0.
