# Civitas

Governance intelligence for Cardano.

This repo contains:
- A Node.js backend that syncs governance data from Blockfrost + Koios, builds snapshots, and serves API/static assets.
- A React frontend (served from `frontend/dist`) with DRep, SPO, Committee, and Governance Action views.
- A legacy static UI (`index.html` + `app.js`) used only when `frontend/dist` is missing.

## Purpose

Civitas is built to make on-chain governance legible, verifiable, and decision-useful:
- Surface how DReps, SPOs, and Constitutional Committee members actually participate.
- Turn proposal flow, thresholds, and voting power into actionable context.
- Provide transparent metrics that can be inspected and challenged.

## What the tool currently does

- Syncs governance proposals + votes in batches from Blockfrost.
- Enriches proposals with Koios `proposal_voting_summary`.
- Computes proposal-level DRep and SPO voting-power breakdowns and threshold progress.
- Resolves proposal metadata/rationale, DRep metadata/profile, and vote rationale links.
- Tracks special DReps:
  - `drep_always_abstain`
  - `drep_always_no_confidence`
- Persists data snapshots (`snapshot.accountability.json`) and epoch history files (`snapshot_history/epoch-*.json`) to keep analysis stable and reproducible.
- Supports historical "time travel" reads by snapshot file key.
- Exposes sync status, backfill control, proposal metadata, and vote rationale APIs.
- Frontend includes wallet-assisted on-chain vote delegation to selected DRep (via Mesh/CIP-30 wallet extension).

## Runtime model

- Immediate sync on startup (`runSync({ publishNow: true })`).
- Scheduled sync window defaults: `11:00,23:00 UTC` (builds pending snapshot).
- Scheduled publish window defaults: `00:00,12:00 UTC` (promotes pending snapshot).
- Optional interval fallback (`SYNC_USE_INTERVAL_FALLBACK=true` + `SYNC_INTERVAL_MS`).

## Requirements

- Node.js 20+ recommended.
- Blockfrost mainnet key for full functionality.
- Koios is used heavily; optional API key supported.

## Setup

1. Install frontend deps:
```powershell
npm --prefix frontend install
```

2. Build frontend:
```powershell
npm run build
```

3. Configure env (example):
```powershell
$env:BLOCKFROST_API_KEY="YOUR_BLOCKFROST_KEY"
```

4. Start backend:
```powershell
npm start
```

Open: `http://127.0.0.1:8080`

## API

- `GET /api/health`
- `GET /api/accountability`
  - optional query: `snapshot=<epoch-XYZ.json>`
- `GET /api/sync-status`
- `POST /api/sync-now`
- `GET /api/snapshot-history`
- `POST /api/backfill-epoch-snapshots`
  - optional query: `force=true`
- `GET /api/proposal-metadata?proposalId=<id>`
- `GET /api/vote-rationale?proposalId=<id>&voterId=<id>&voterRole=<drep|constitutional_committee>[&url=<anchor>]`

## Frontend routes

- `/` landing page
- `/dreps` DRep dashboard
- `/spos` SPO governance dashboard
- `/committee` Constitutional Committee dashboard
- `/actions` Governance Action explorer
- `/guide` guide page
- `/about` about page

Historical view is supported via `?snapshot=epoch-XYZ.json`.

## Metrics and scoring (current implementation)

In the React dashboard (`frontend/src/pages/DashboardPage.jsx`):
- `attendance`: votes cast / eligible actions in current filter scope.
- `transparency`: vote rationale availability ratio (`hasRationale`) in selected vote set.
- `consistency`: yes/no alignment with finalized yes/no outcomes.
- `responsiveness` (DRep/SPO): inverse of average response hours.
- Score is weighted by enabled toggles:
  - attendance `0.45`
  - transparency `0.30`
  - consistency `0.15`
  - responsiveness `0.10`

Notes:
- Committee eligibility window is term-aware and adjusted by hardcoded overrides.
- DRep eligibility excludes pre-participation governance era (`DREP_PARTICIPATION_START_EPOCH`, default `534`).
- Governance action explorer displays threshold progress and pass/fail against required DRep/SPO thresholds.

## Key environment variables

Network/sources:
- `BLOCKFROST_API_KEY` (required for sync)
- `BLOCKFROST_BASE_URL` (default `https://cardano-mainnet.blockfrost.io/api/v0`)
- `KOIOS_BASE_URL` (default `https://api.koios.rest/api/v1`)
- `KOIOS_API_KEY` (optional)

HTTP:
- `HOST` (default `127.0.0.1`)
- `PORT` (default `8080`)
- `FRONTEND_DIST_PATH` (default `./frontend/dist`)

Sync and pagination:
- `PROPOSAL_PAGE_SIZE` (default `100`)
- `PROPOSAL_MAX_PAGES` (default `1000`)
- `PROPOSAL_VOTES_PAGE_SIZE` (default `100`)
- `PROPOSAL_VOTES_MAX_PAGES` (default `200`)
- `PROPOSAL_SCAN_LIMIT` (default `0` = no cap)
- `SYNC_BATCH_SIZE` (default `5`)
- `SYNC_CONCURRENCY` (default `1`)
- `SYNC_STARTUP_DELAY_MS` (default `3000`)
- `SYNC_START_UTC_HOURS` (default `11,23`)
- `SNAPSHOT_EXPOSE_UTC_HOURS` (default `0,12`)
- `SYNC_USE_INTERVAL_FALLBACK` (default `false`)
- `SYNC_INTERVAL_MS` (default `10800000`)

Timeout/retry:
- `BLOCKFROST_MAX_RETRIES` (default `3`)
- `BLOCKFROST_REQUEST_TIMEOUT_MS` (default `10000`)
- `BLOCKFROST_REQUEST_DELAY_MS` (default `180`)
- `KOIOS_MAX_RETRIES` (default `4`)
- `KOIOS_REQUEST_TIMEOUT_MS` (default `15000`)
- `KOIOS_REQUEST_DELAY_MS` (default `120`)

Snapshot/storage:
- `SNAPSHOT_PATH` (default `./snapshot.accountability.json`)
- `SNAPSHOT_HISTORY_DIR` (default `./snapshot_history`)
- `SNAPSHOT_SCHEMA_VERSION` (default `1`)
- `EPOCH_SNAPSHOT_START_EPOCH` (default `507`)
- `VOTE_TX_TIME_CACHE_PATH` (default `./cache.voteTxTimes.json`)
- `VOTE_TX_TIME_MAX_LOOKUPS` (default `40000`)
- `SPECIAL_DREP_REFRESH_MS` (default `900000`)
- `DREP_LIMIT` (default `0` = no cap)
- `DREP_PARTICIPATION_START_EPOCH` (default `534`)

## Repo notes

- `server.js` is the source of truth for backend behavior.
- `frontend/src/` is the source of truth for current UI behavior.
- Root `index.html`, `app.js`, `styles.css` are legacy fallback UI assets.
- `_tmp_*` files and `CARDANO_GOVERNANCE_REPORT.md` are analysis/research artifacts, not runtime dependencies.
