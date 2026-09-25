# Civitas

Governance intelligence for Cardano: every governance action, every DRep, SPO and Constitutional Committee vote, scored, searchable and explained.

This repo contains:
- A Node.js backend (`server.js`, `lib/`) that indexes governance data from Koios, builds snapshots, and serves a compact JSON API and the built frontend.
- A React frontend (`frontend/`) served from `frontend/dist`.

Screenshots of the main pages, in both themes, are under [`docs/screens`](docs/screens). The rework that produced the current architecture is described in [`docs/REWORK_PLAN.md`](docs/REWORK_PLAN.md).

## Purpose

Civitas is built to make on-chain governance legible, verifiable, and decision-useful:
- Surface how DReps, SPOs, and Constitutional Committee members actually participate.
- Turn proposal flow, thresholds, and voting power into actionable context.
- Provide transparent metrics that can be inspected and challenged.

## What the tool does

- Indexes governance proposals, votes, DReps, stake pools and the committee from [Koios](https://koios.rest). A full rebuild costs a few hundred Koios requests; after that, delta syncs (new proposals and votes since a watermark) cost a handful of requests every ten minutes. Blockfrost is optional: an IPFS gateway and a budget-capped fallback.
- Computes proposal-level DRep and SPO voting-power breakdowns and threshold progress, with Koios `proposal_voting_summary` where available.
- Resolves proposal metadata, DRep profiles (CIP-119) and vote rationale documents (CIP-100 / CIP-136), and verifies anchor hashes.
- Tracks the special DReps (`drep_always_abstain`, `drep_always_no_confidence`).
- Persists the snapshot (`snapshot.accountability.json`) and epoch history files (`snapshot_history/epoch-*.json`) for reproducible, historical ("time travel") reads via `?snapshot=epoch-NNN.json`.
- Serves everything the interface needs through `/api/v1`: compact, gzip-compressed, ETag-cacheable payloads (a page loads tens of kilobytes instead of a multi-megabyte snapshot), pushed live to open pages over server-sent events.
- Frontend: governance actions and detail pages, DRep / SPO / committee dashboards with accountability scores, voter profiles with delegation and delegators, statistics, an epoch calendar with a Google Calendar feed, treasury (net change limit, spending pace, post-approval delivery from the Intersect Administration API), the rationale archive, live vote trackers, the constitution, the CIP library and guides.
- Wallet features (CIP-30 / CIP-95): sign in as DRep or delegator, delegate voting power, register as a DRep, vote on actions with an uploaded rationale, and answer or publish CIP-179 surveys. Keys that never touch a browser can sign in with `cardano-signer`.
- Surveys & polls (CIP-179) are read from [Tessera](https://github.com/mpizenberg/Tessera), the reference CIP-179 index (`TESSERA_BACKEND_URL`, mainnet by default).

## Runtime model

- On boot the server hydrates from the last snapshot (or the committed seed) and serves immediately.
- A delta sync runs every `DELTA_POLL_MS` (default 10 minutes): new proposals, new votes since the vote watermark, refreshed outcomes and DRep power.
- A full rebuild runs at `SYNC_START_UTC_HOURS` (default 11:00 and 23:00 UTC) and at most once per `FULL_REBUILD_INTERVAL_MS`.
- Every publish pushes a `snapshot-updated` event to connected browsers, which revalidate their cached pages (a `304` when nothing changed).

## Requirements

- Node.js 20+.
- Network access to Koios. A free Koios account key (`KOIOS_API_KEY`) raises the daily limit from about 5,000 to 50,000 requests; the indexer stays well below either.
- Optional: a Blockfrost key for the IPFS gateway and fallback lookups.

## Setup

```sh
npm ci                      # server deps (cip-179, Tessera client, Playwright)
npm ci --prefix frontend    # frontend deps
npm run build               # builds frontend/dist
cp .env.example .env        # then edit
npm start                   # http://127.0.0.1:8080
```

For frontend development with hot reload: `npm run dev:frontend` (proxies `/api` to the server on port 8080).

## Tests

```sh
npm run lint        # frontend lint
npm run test:unit   # cip-179 and survey helpers
npm run test:sync   # full and delta sync against a Koios fixture built from the seed (offline)
npm run test:api    # /api/v1 contract, payload sizes, gzip and ETag (offline)
npm run test        # boots the server and checks health
npm run test:e2e    # Playwright, desktop and phone, against the seed
npm run ci          # all of the above except e2e
```

Screenshots of every route in both themes: `node scripts/screenshots.mjs docs/screens` (needs a built frontend).

## API

Compact, cacheable endpoints used by the interface (all accept `?snapshot=epoch-NNN.json`):

- `GET /api/v1/meta` — snapshot and sync status
- `GET /api/v1/actions` — one model row per governance action (thresholds, power breakdown, status)
- `GET /api/v1/actions/:id` — one action with its votes and metadata
- `GET /api/v1/actors/:type` — `drep` | `spo` | `committee`, with packed votes
- `GET /api/v1/actors/:type/:id` — one actor with its full votes
- `GET /api/v1/rationales/index` — actions and votes that carry a rationale
- `GET /api/v1/stats` — aggregated, chart-ready statistics
- `GET /api/v1/calendar?from=&to=` — governance events per epoch boundary
- `GET /api/v1/search/dreps?q=` — DReps matching a name or id fragment
- `GET /api/events` — server-sent `snapshot-updated` events

Other endpoints:

- `GET /api/health`, `GET /api/sync-status`, `POST /api/sync-now`
- `GET /api/accountability` — the full snapshot (legacy; large)
- `GET /api/snapshot-history`, `POST /api/backfill-epoch-snapshots`
- `GET /api/proposal-metadata?proposalId=<id>`
- `GET /api/vote-rationale?proposalId=<id>&voterId=<id>&voterRole=<drep|stake_pool|constitutional_committee>[&url=<anchor>]`
- `GET /api/drep-live?id=`, `GET /api/drep-delegators?id=`, `GET /api/drep-delegation-trend?epochs=`, `GET /api/drep-delegation-history?id=`
- `GET /api/treasury`, `GET /api/treasury-admin`, `GET /api/treasury-admin/events`, `GET /api/treasury-admin/project?id=`, `GET /api/treasury-admin/mapping`
- `GET /api/epoch-calendar.ics` — subscribable calendar feed
- `GET /api/intersect?proposal=<track>` — live vote tracker
- `GET /api/cips`, `GET /api/cips/:id`
- `POST /api/auth/challenge`, `POST /api/auth/verify` — cardano-signer sign-in
- `GET /api/surveys`, `GET /api/surveys/<txHash>/<index>`, `GET /api/surveys/tx/<txHash>`, `GET /api/surveys/links`, `GET /api/proposal-survey?proposalId=<id>`
- `POST /api/bug-report`, `GET /api/bug-reports`, `POST /api/bug-reports/action`

## Frontend routes

- `/actions`, `/actions/:id` — governance actions and detail
- `/dreps`, `/dreps/:id`, `/spos`, `/spos/:id`, `/committee`, `/committee/:id` — dashboards and profiles
- `/delegate/:drepId` — one-click delegate landing page
- `/stats`, `/epochs`, `/treasury`, `/treasury/explorer`, `/treasury/explorer/:projectId`
- `/governance/rationales` — rationale archive
- `/surveys`, `/surveys/create`, `/surveys/:txHash/:index`
- `/intersect`, `/blockfrost` — live vote trackers
- `/constitution`, `/cips`, `/cips/:id`, `/guide`, `/about`, `/about/changelog`, `/bugs`

## Metrics and scoring

Scores are computed in the browser from the packed actor payload by `frontend/src/lib/governance/scoring.js`, shared by the dashboards and the profiles:

- Attendance: votes cast / eligible actions. DReps are eligible from `DREP_PARTICIPATION_START_EPOCH` (534); SPOs for actions with stake-pool votes; committee members for actions inside their seat term, excluding no-confidence, new-committee and early-dropped actions.
- Transparency: votes carrying a rationale / votes cast.
- Alignment: votes matching the final outcome / comparable (Yes or No) votes. For the committee, rationale quality (CIP-136 structure and constitutional grounding) takes this slot.
- Responsiveness: `max(0, 100 − avg response hours / 720 × 100)`.
- Delegation risk (DReps): share of active voting power scaled so that 0.9% maps to 100.
- Accountability: weighted average of the enabled metrics (DRep 35/25/15/10/15, SPO 45/30/15/10, committee 55/45).

Statistics and the calendar are aggregated on the server (`lib/governanceStats.js`, `lib/governanceCalendar.js`); the action model is `lib/governanceModel.js`.

## Key environment variables

See `.env.example` for the full list with defaults. The ones that matter most:

- `KOIOS_API_KEY` — optional free key; `KOIOS_BASE_URL`, `KOIOS_VOTING_SUMMARY_SCOPE` (`all` | `pending`)
- `BLOCKFROST_API_KEY` — optional; `BLOCKFROST_DAILY_BUDGET` caps Blockfrost use (0 disables it)
- `DELTA_POLL_MS`, `DELTA_VOTE_OVERLAP_SECONDS`, `SYNC_START_UTC_HOURS`, `SNAPSHOT_EXPOSE_UTC_HOURS`, `FULL_REBUILD_INTERVAL_MS`
- `SNAPSHOT_PATH`, `SNAPSHOT_HISTORY_DIR`, `SNAPSHOT_SEED_PATH`
- `HOST`, `PORT`, `CANONICAL_URL`, `FRONTEND_DIST_PATH`
- `TESSERA_BACKEND_URL`, `TESSERA_APP_URL`
- `BUG_REPORTS_TOKEN`, `OPERATIONS_API_TOKEN` and the rate-limit settings

## Repo notes

- `server.js` is the source of truth for backend behaviour; `lib/` holds the Koios source, the action model, the v1 API, statistics and the calendar.
- `frontend/src/` is the source of truth for the interface: `ui/` is the component kit, `styles/` the design tokens and page styles, `api/` the React Query hooks, `lib/governance/` the scoring and formatting helpers.
- `snapshot.seed.json` is the committed snapshot the server (and the tests) start from; `.github/workflows/update-seed.yml` refreshes it.
- `rationales/` is the archived rationale Markdown, refreshed by `.github/workflows/sync-rationales.yml`.
