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
