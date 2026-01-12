# Pet911 Testing Strategy (Website)

This document describes how to test the **Pet911 marketing/ops website**, with emphasis on **moderator/sysop dispatch operations**.

## Goals

- Verify critical public pages render and remain accessible (home, privacy, terms).
- Validate authentication and authority gating for **SYSOP** and **MODERATOR** tools.
- Exercise the **dispatch queue + assignment** workflow end-to-end against a staging DB.
- Stress test admin APIs safely (staging only).

## Environments (Fail-Closed)

### Required: Dedicated staging/test Supabase project

Admin E2E/integration tests require a Supabase project with:
- `volunteers`, `dispatch_requests`, `dispatch_assignments`, `dispatch_notifications`, `training_module_completions`
- Auth enabled for email/password

Never run load tests against production.

### Minimal environment knobs

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional (only if you want to verify SMS sending paths):
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

## Roles & What must be covered

- **Unauthenticated**
  - Public pages
  - `/admin/sysop` redirects to `/login`
  - `/admin/mods/dispatch` prompts sign-in
- **Authenticated non-admin volunteer**
  - Forbidden from moderator APIs (`403`)
- **Moderator / SYSOP (ACTIVE)**
  - Can load dispatch queue (`GET /api/admin/dispatch/queue`)
  - Can compute candidates + assign a volunteer (`POST /api/admin/dispatch/assign`)
  - Assignment appends an audit row (`dispatch_assignments.action = OFFERED`)

## Test Pyramid & Tooling

### Unit tests

Use for:
- Authority gating logic (pure helpers)
- UI utilities
- Formatting/validation helpers

### Integration tests (API + DB)

Use for:
- `/api/admin/dispatch/queue` auth + role enforcement
- `/api/admin/dispatch/assign` candidate ranking + assignment + audit row

Implementation approach:
- Create test users + volunteer profiles via **service role** admin API.
- Seed dispatch requests directly.
- Cleanup by deleting seeded rows and test users.

### E2E tests (Playwright)

Use for:
- Browser-level verification of page routing and admin UI behavior.
- Full dispatch assignment workflow when staging DB is available.

Commands:
- `npm run e2e:install`
- `npm run e2e`

## Stress / Load Testing Plan (Staging only)

Target endpoints:
- `GET /api/admin/dispatch/queue`
- `POST /api/admin/dispatch/assign` (candidate computation)

Scenarios:
- 10–50 moderators refreshing queue concurrently.
- 100–500 dispatch requests in queue (pagination/ordering correctness).
- Rapid candidate recomputation + assignment attempts (race condition checks).

Success criteria (example targets):
- 95th percentile latency:
  - Queue read: < 500ms
  - Candidate compute: < 1s
- Error rate:
  - < 1% (excluding expected 401/403 from negative tests)

## CI / Release Gates (Suggested)

- PR gate:
  - Build
  - Playwright smoke E2E
- Nightly (staging):
  - Moderator dispatch integration/E2E suite
  - Light load test

