# Pet911 Testing Strategy (App)

This document describes how to test **PetNexus Pet911 (PWA app)** end-to-end, including **dispatch orders**, **volunteer workflows**, and **moderator/sysop procedures**, without risking production data.

## Goals

- Catch regressions in **critical safety flows** (Emergency Assist, Dispatch, Volunteer Operations, Moderator actions).
- Validate **canonical law** invariants (fail-closed access, no false hope, auditability).
- Provide a path to **stress/load testing** the highest-risk endpoints and workflows.

## Environments (Fail-Closed)

### Required: Dedicated staging/test Supabase project

Automated integration/stress tests must run against a **non-production** Supabase project (or a local stack).

- Do **not** point load tests at production.
- Use separate credentials/keys, and separate Twilio credentials (or unset them).

### Minimal environment knobs

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (only needed for auth flows; most dispatch APIs here use service role)
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional: Twilio vars for webhook/SMS procedure testing:
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

## Roles & Procedures (What must be covered)

- **Anonymous user**
  - Home, Emergency Assist, Resources, Support Companion (UI + accessibility)
- **Requester (finder)**
  - Creates a dispatch request; receives updates
- **Volunteer**
  - Sees offers; accepts/declines; progresses to EN_ROUTE/ARRIVED/COMPLETED
- **Moderator / SYSOP**
  - Approves/suspends volunteers; dispatch oversight and assignments (where implemented)

## Test Pyramid & Tooling

### Unit tests (Jest)

Use for:
- Pure logic: scoring, filters, state transitions, formatter utilities.
- Offline queue and idempotency helpers.
- Safety classifiers (guardrails, crisis routing).

Command:
- `npm test`

### Integration tests (API + DB)

Use for:
- Next route handlers that touch Supabase (dispatch request/update/history, Twilio webhook).
- DB constraints and audit writes (e.g., `dispatch_assignments` append-only ledger behavior).

Implementation approach:
- Prefer **service role** Supabase client for seeding + cleanup.
- Use explicit opt-in for anything that writes to a real DB.

### E2E tests (Playwright)

Use for:
- Browser-level verification of pages and routing.
- “Happy path” user journeys when the backing environment is available.

Commands:
- `npm run e2e:install`
- `npm run e2e`

## Dispatch Orders: What to verify

### Data model (high level)

- `dispatch_requests`
  - Current “source of truth” row for assignment + execution state (`PENDING → ACCEPTED → EN_ROUTE → ARRIVED → COMPLETED` etc).
- `dispatch_assignments`
  - Append-only **audit ledger**: `OFFERED`, `ACCEPTED`, `DECLINED`, `REASSIGNED`, etc.
- `dispatch_notifications`
  - Notification log, used by Twilio response matching in current implementation.

### Required procedure checks

1. **Request creation**
   - Inserts `dispatch_requests` with correct required fields and `expires_at`.
   - Computes match candidates correctly (capabilities + radius + transport constraints).
2. **Assignment / status updates**
   - `PATCH /api/dispatch/request` updates timestamps appropriately (`accepted_at`, `arrived_at`, `completed_at`).
   - Writes an audit row in `dispatch_assignments` for allowed actions.
3. **Volunteer SMS response (Twilio webhook)**
   - Incoming `Y/N` updates `dispatch_requests` from `PENDING` only.
   - Writes `dispatch_assignments` (`ACCEPTED` / `DECLINED`) with `meta.source = twilio`.
   - Updates `dispatch_notifications.response_*` and volunteer stats.

## Stress / Load Testing Plan

Use a dedicated staging environment and run these as scheduled jobs (nightly/weekly), not on every PR.

### Recommended stress scenarios

- **Burst dispatch creation**: 100–500 `POST /api/dispatch/request` over 1–2 minutes.
- **Concurrent status updates**: multiple volunteers update different dispatches concurrently.
- **Webhook spike**: 200–1,000 Twilio webhook posts with mixed accept/decline payloads (idempotency + stability).
- **Queue/history reads**: high read QPS on `/api/dispatch/history` for active volunteers.

### Success criteria (example targets)

- 95th percentile latency:
  - Request creation: < 800ms
  - History read: < 400ms
- Error rate:
  - < 0.5% (excluding intentional 4xx validation failures)
- No data corruption:
  - No invalid state transitions
  - Audit ledger rows are appended and consistent

## CI / Release Gates (Suggested)

- PR gate:
  - Typecheck/build
  - Jest unit tests
  - Playwright smoke E2E
- Nightly:
  - Playwright integration suite (dispatch procedures against staging DB)
  - Optional: light load test
- Release:
  - Full load test + manual acceptance checklist

## Task Assignments (Suggested Ownership)

- **Engineering**
  - Keep unit tests current for all new features.
  - Maintain integration tests for dispatch + safety-critical procedures.
- **QA**
  - Own the “release checklist” and exploratory testing playbook.
  - Validate new moderator flows (edge cases + usability).
- **Ops/Sysop**
  - Own load test schedules, monitoring alerts, incident review.
  - Validate audit log availability and retention.

