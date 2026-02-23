# Civitas Roadmap

Last updated: 2026-02-22

## Deferred Priorities (Explicitly Parked)

### 4. Alerts and subscriptions
Goal: Watchlists + notifications for DRep/CC/proposal events.

Scope:
- Watchlists for DReps, CC members, and governance actions.
- Notification channels: webhook first (MVP), then email/Telegram.
- Event triggers:
  - new vote cast
  - missed vote (policy-defined cutoff)
  - threshold changes
  - proposal status transitions (ratified/enacted/dropped/expired)

Status: Deferred until after proposal intelligence + production hardening baseline.

### 5. Proposal intelligence layer
Goal: Normalize each governance action into decision-ready sections.

Required sections:
- what changes
- who is affected
- required thresholds
- current path to pass
- key references

Implementation policy:
- Deterministic/rule-based parsing only (no built-in AI dependency).
- Use existing snapshot fields: governance type/description, threshold info, vote-power model, and metadata fields.

Status: Next major feature.

### 8. Public API mode
Goal: Stable read-only API for external consumers.

Core requirements:
- Versioned endpoints (`/api/v1/...`).
- Contract stability (additive changes only within v1).
- Pagination, rate limits, and cache headers.
- Response metadata on every endpoint:
  - schemaVersion
  - snapshotKey
  - generatedAt
  - coverage indicators

Status: Deferred until closer to production readiness.

## Agreed Sequencing
1. Implement #5 (Proposal intelligence layer).
2. Finish production hardening baseline (#7 essentials).
3. Implement #8 (Public API mode).
4. Implement #4 (alerts/subscriptions) on top of stable API/event model.

## Notes
- #8 should not be exposed publicly before schema and operational behavior are stable.
- An internal/non-public API namespace can be used earlier for frontend-only needs.
