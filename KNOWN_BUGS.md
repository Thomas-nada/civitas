# Known Bugs

Use this file to track bugs that are known but not necessarily fixed yet.

## Status Legend
- `open`: Reported, not started
- `investigating`: Being analyzed
- `in_progress`: Fix in progress
- `blocked`: Waiting on dependency or decision
- `fixed`: Code fix completed
- `verified`: Fix confirmed

## Bug List

### BUG-001 - "Now" marker pinned to end of Constitutional Committee Timeline
- Status: `verified`
- Priority: `medium`
- Reported by: `thoma`
- Reported on: `2026-02-26`
- Area: `frontend`
- Environment: `dev`
- Description:
  - In `Stats` -> `Constitutional Committee Timeline`, the vertical line for "now" is rendered at the end of the timeline at epoch `726`.
- Expected:
  - The "now" line should be rendered at the current epoch, not at the timeline end.
- Repro steps:
  1. Open `Stats`.
  2. View `Constitutional Committee Timeline`.
  3. Observe the "now" marker location.
- Notes:
  - Current behavior observed: marker appears at epoch `726` (timeline end).
  - Local fix applied on `2026-02-26`: marker now uses the current epoch and its label is rendered in a separate chip area to avoid overlap with timeline bars.

### BUG-002 - Inconsistent sizing across Stats UI components
- Status: `verified`
- Priority: `medium`
- Reported by: `thoma`
- Reported on: `2026-02-26`
- Area: `frontend`
- Environment: `dev`
- Description:
  - In `Stats`, character and element sizes are visually inconsistent across sections.
  - Lettering, numeric values, and graph-related sizing do not feel standardized.
- Expected:
  - Typography and chart sizing should be normalized so the Stats area feels like a cohesive, unified tool suite.
- Repro steps:
  1. Open `Stats`.
  2. Compare text and number sizes between sections/cards/charts.
  3. Observe inconsistent visual scale and hierarchy.
- Notes:
  - Requested direction: standardize sizes for letters, numbers, graphs, and related UI scale tokens.
  - Local fix completed on `2026-02-26`: introduced shared Stats typography scale tokens and applied them across timeline labels/tooltips, chart axes, legends, and related chart text for consistent sizing.

### BUG-003 - Tool is not mobile-friendly
- Status: `verified`
- Priority: `high`
- Reported by: `thoma`
- Reported on: `2026-02-26`
- Area: `frontend`
- Environment: `dev`
- Description:
  - The tool does not provide a good experience on mobile devices.
- Expected:
  - The full tool should be mobile-friendly, with responsive layouts, readable text, usable controls, and charts/tables that work on small screens.
- Repro steps:
  1. Open the tool on a mobile device or narrow viewport.
  2. Navigate through key pages/features.
  3. Observe layout/usability issues on smaller screens.
- Notes:
  - Broad requirement: responsive/mobile optimization across the product, not a single page fix.
  - Local fix completed on `2026-02-27`:
    - Added responsive layout behavior for topbar/navigation, table/list areas, expanded detail panels, and modal surfaces across breakpoints (`900px`, `680px`, `480px`).
    - Improved small-screen typography, spacing, and touch target sizing for controls and action rows.
    - Improved mobile handling for action vote pie cards and calculation sections.
    - Added touch-friendly horizontal scrolling in table containers to prevent clipped content on narrow viewports.

### BUG-004 - Missing in-app bug reporting for end users
- Status: `verified`
- Priority: `medium`
- Reported by: `thoma`
- Reported on: `2026-02-26`
- Area: `frontend`
- Environment: `dev`
- Description:
  - There is no user-facing feature for reporting bugs directly from the tool.
- Expected:
  - Users should have an accessible in-app bug report flow (for example: report form, optional screenshots/context, and submission confirmation).
- Repro steps:
  1. Use the tool as an end user.
  2. Attempt to report a bug from within the app.
  3. No dedicated bug-reporting feature is available.
- Notes:
  - Requirement is for general users, not internal-only reporting.
  - Local fix completed on `2026-02-26`:
    - Added topbar `Report Bug` button and user-facing modal form.
    - Added backend endpoint `POST /api/bug-report`.
    - Reports are validated and appended to `reports/bug_reports.ndjson`.
    - Added unlisted `/bugs` owner page for triage.
    - Added token-gated admin APIs and UI actions: `approve`, `archive`, `reopen`, `remove`.
    - Added per-report `Copy` button for easy handoff into fixing threads.

### BUG-005 - Governance action details should expand inline instead of sidebar
- Status: `verified`
- Priority: `medium`
- Reported by: `thoma`
- Reported on: `2026-02-26`
- Area: `frontend`
- Environment: `dev`
- Description:
  - On the Actions page, clicking a governance action currently shows details in a sidebar.
  - Desired behavior is an inline dropdown/expandable panel directly under the selected action.
- Expected:
  - Clicking a governance action should expand details below that action item.
  - The expanded detail panel must be collapsible, so users can close it and return to the compact list view without losing context.
  - The expanded area should support richer content over time (additional details, graphs, and related context).
- Repro steps:
  1. Open the Actions page.
  2. Click a governance action.
  3. Details appear in sidebar instead of expanding under the clicked item.
- Notes:
  - UX direction: replace sidebar-driven detail view with per-row expandable disclosure.
  - Local fix completed on `2026-02-26`: Actions page now uses inline expandable rows with collapsible detail panels.
  - Extended UX consistency update on `2026-02-26`: DReps, SPOs, and Committee pages now also use inline expandable row details.

### BUG-006 - Recent Constitutional Committee votes can be missing from Actions tally
- Status: `verified`
- Priority: `high`
- Reported by: `thoma`
- Reported on: `2026-02-27`
- Area: `backend`
- Environment: `dev`
- Description:
  - For some proposals (example: `gov_action19uhuy5uame2s60yrh6n8cyds8ps5q7tkh05dqlzmpcfy429p9w4qq5ll3g0`), a recent CC vote was not reflected in Actions.
  - This indicates recent votes can be dropped or not reflected in proposal-level tallies.
- Expected:
  - Recent CC votes should appear reliably in proposal tallies and Actions details.
- Repro steps:
  1. Open `Actions`.
  2. Inspect proposal `gov_action19uhuy5uame2s60yrh6n8cyds8ps5q7tkh05dqlzmpcfy429p9w4qq5ll3g0`.
  3. Compare CC tally to recent official vote activity.
- Notes:
  - Local fix completed on `2026-02-27`:
    - Made incremental vote pagination order-safe (no early page break on first known tx hash).
    - Switched actor vote merge to upsert-per-proposal so newer votes replace stale entries.
    - Recompute `proposalInfo[proposalId].voteStats` from actor maps during incremental sync so Actions tallies stay current.

### BUG-007 - Operational sync/backfill endpoints are not admin-protected
- Status: `fixed`
- Priority: `high`
- Reported by: `codex-audit`
- Reported on: `2026-02-27`
- Area: `backend`
- Environment: `dev`
- Description:
  - Several high-impact operational endpoints can be called without admin authentication.
  - Affected endpoints: `POST /api/backfill-epoch-snapshots`, `POST /api/sync-now`, `POST /api/warm-rationales`, `POST /api/promote-pending-snapshot`.
- Expected:
  - These endpoints should require admin authorization (token and/or allowlist) before executing.
- Repro steps:
  1. Call one of the endpoints above without auth headers.
  2. Observe `200/202` accepted responses and job execution.
  3. Confirm no admin check is enforced.
- Notes:
  - Risk: public trigger of expensive operations, sync churn, and potential denial-of-service/cost amplification.
  - Local fix completed on `2026-02-27`:
    - Added required admin auth checks to:
      - `POST /api/backfill-epoch-snapshots`
      - `POST /api/sync-now`
      - `POST /api/warm-rationales`
      - `POST /api/promote-pending-snapshot`
    - Added `OPERATIONS_API_TOKEN` config (defaults to `BUG_REPORTS_TOKEN` when unset).

### BUG-008 - Bug admin token accepted via query string
- Status: `fixed`
- Priority: `high`
- Reported by: `codex-audit`
- Reported on: `2026-02-27`
- Area: `backend`
- Environment: `dev`
- Description:
  - Bug admin auth currently accepts `?token=...` in URL query parameters.
- Expected:
  - Admin token should only be accepted via secure headers (`x-bug-admin-token` or `Authorization: Bearer`), never query params.
- Repro steps:
  1. Request `GET /api/bug-reports?token=<admin-token>`.
  2. Observe successful auth.
  3. Confirm query token path is enabled.
- Notes:
  - Risk: token leakage via logs, browser history, referrer headers, and shared links.
  - Local fix completed on `2026-02-27`:
    - Removed query-string token auth path.
    - Bug admin auth now accepts header tokens only (`x-bug-admin-token` or `Authorization: Bearer`).

### BUG-009 - Frontend lint/CI gate currently failing
- Status: `fixed`
- Priority: `medium`
- Reported by: `codex-audit`
- Reported on: `2026-02-27`
- Area: `frontend`
- Environment: `dev`
- Description:
  - `npm run lint` currently fails with multiple errors, preventing a clean quality gate.
- Expected:
  - Lint should pass cleanly so `npm run ci` can be enforced as a release gate.
- Repro steps:
  1. Run `npm run lint`.
  2. Observe errors in `App.jsx`, `StatsPage.jsx`, `DashboardPage.jsx`, `GovernanceActionsPage.jsx`.
  3. Confirm non-zero exit and CI failure.
- Notes:
  - Current audit run found `10 errors` and `18 warnings`.
  - Local fix completed on `2026-02-27`:
    - Cleared lint errors so `npm run lint` exits successfully.
    - Confirmed `npm run ci` now passes (lint + build + smoke test).

### BUG-010 - Frontend dependency audit includes unresolved high-severity vulnerabilities
- Status: `fixed`
- Priority: `medium`
- Reported by: `codex-audit`
- Reported on: `2026-02-27`
- Area: `frontend`
- Environment: `dev`
- Description:
  - `npm audit` for `frontend` reports unresolved vulnerabilities in the dependency graph.
- Expected:
  - Dependencies should be upgraded/pinned so known high/moderate vulnerabilities are remediated.
- Repro steps:
  1. Run `npm audit --json` in `frontend`.
  2. Observe vulnerabilities including high severity findings.
  3. Verify unresolved status in current lockfile tree.
- Notes:
  - Audit snapshot: `13` total findings (`2 high`, `5 moderate`, `6 low`).
  - Local fix completed on `2026-02-27`:
    - Upgraded `@meshsdk/core` to `1.9.0-beta.100`.
    - Added overrides for `rollup`, `minimatch`, and `undici` to patched ranges.
    - Post-fix `npm audit` result: `0 high`, `0 moderate`, remaining findings are `low` only.

### BUG-011 - Bug report storage writes are not concurrency-safe
- Status: `fixed`
- Priority: `medium`
- Reported by: `codex-audit`
- Reported on: `2026-02-27`
- Area: `backend`
- Environment: `dev`
- Description:
  - Bug reports are persisted in NDJSON with read/modify/write flows and no locking.
  - Concurrent admin actions can race and overwrite changes.
- Expected:
  - Storage layer should support atomic updates and safe concurrent writes.
- Repro steps:
  1. Trigger simultaneous admin actions (e.g., approve/archive/remove) on bug records.
  2. Observe potential lost update behavior due to whole-file rewrite.
  3. Confirm no lock/transaction mechanism is present.
- Notes:
  - Suggested direction: migrate to SQLite for transactional safety and queryability.
  - Local fix completed on `2026-02-27`:
    - Added in-process write serialization lock for bug-report append/update flows to prevent race overwrites.

## Recommended Upgrades / Additions

### UPG-001 - Protect operational endpoints with admin auth
- Priority: `high`
- Description:
  - Require admin auth for sync/backfill/promotion/warm endpoints.
  - Optionally restrict by IP allowlist in server deployment.

### UPG-002 - Remove query-token auth for bug admin APIs
- Priority: `high`
- Description:
  - Accept admin token only in headers, not URL query parameters.
  - Reduces accidental token exposure in logs and browser history.

### UPG-003 - Migrate bug report storage from NDJSON to SQLite
- Priority: `medium`
- Description:
  - Add atomic state transitions (`open` -> `approved` -> `archived`) with transactions.
  - Improves reliability and future extensibility.

### UPG-004 - Make `npm run ci` mandatory pre-push / pre-release
- Priority: `medium`
- Description:
  - Enforce lint/build/smoke checks before deployment.
  - Prevents regressions from bypassing quality gates.

### UPG-005 - Add E2E tests for critical flows
- Priority: `medium`
- Description:
  - Add Playwright (or similar) coverage for:
    - Actions expand/collapse behavior
    - Bug report submit/admin actions
    - Mobile layout checks on key pages

### UPG-006 - Add rate limits for write/ops endpoints
- Priority: `medium`
- Description:
  - Apply per-IP/per-window limits to:
    - `POST /api/bug-report`
    - operational admin endpoints

### UPG-007 - Add sync observability metrics
- Priority: `medium`
- Description:
  - Track sync durations, error rates, queue/lock state, and endpoint invocations.
  - Use structured logs and lightweight metrics to speed debugging.

### UPG-008 - Reduce frontend bundle size via code splitting
- Priority: `medium`
- Description:
  - Introduce chunking strategy for heavier routes/modules.
  - Target smaller initial payload and better mobile performance.

## Entry Template

### BUG-XXX - <short title>
- Status: `open`
- Priority: `high | medium | low`
- Reported by: `<name>`
- Reported on: `YYYY-MM-DD`
- Area: `<frontend | backend | infra | data | other>`
- Environment: `<dev | staging | prod>`
- Description:
  - <what is happening>
- Expected:
  - <what should happen>
- Repro steps:
  1. <step 1>
  2. <step 2>
  3. <step 3>
- Notes:
  - <extra context, logs, links>
