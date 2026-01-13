# Offline Sync Compliance Checklist (OFFLINE_PROTOCOL)

This checklist ensures the offline sync subsystem respects causality, idempotency, and resilience per OFFLINE_PROTOCOL.md.

## Core Invariants

### 1. FIFO Ordering (Causality)
- [ ] Actions are synced in `created_at` ascending order.
- [ ] `getPendingActions()` sorts by `created_at` before processing.
- [ ] No parallel processing: actions are processed sequentially.
- [ ] Tests verify fetch order matches enqueue order.

### 2. Idempotency (Exactly-Once)
- [ ] Every queued POST includes an `idempotency_key`.
- [ ] `Idempotency-Key` header is sent to backend.
- [ ] Backend returns 409 for duplicate idempotency keys.
- [ ] Client treats 409 as success (idempotent conflict).
- [ ] Idempotency records are stored locally with TTL (24h).
- [ ] Tests assert duplicate keys do not cause side effects.

### 3. Retry Policy (Exponential Backoff + Jitter)
- [ ] Server errors (5xx) trigger retries.
- [ ] Client errors (4xx) are marked FAILED immediately.
- [ ] Max attempts: 5.
- [ ] Base delay: 1000 ms.
- [ ] Backoff factor: 2.
- [ ] Jitter factor: 0.1.
- [ ] Retry attempts increment `sync_attempts`.
- [ ] After max attempts, action is marked FAILED.

### 4. Dependency Resolution
- [ ] Actions depending on a local entity wait until that entity is synced.
- [ ] `canSyncAction` checks `missing_case_id` dependencies.
- [ ] Dependent actions remain PENDING until dependency is SYNCED.
- [ ] Tests verify dependent actions do not sync before dependencies.

### 5. Fail-Closed Behavior
- [ ] If backend is unreachable, actions remain PENDING.
- [ ] No silent drops or optimistic local-only commits.
- [ ] Errors are logged with `sync_error`.
- [ ] UI shows actionable status (pending/failed/synced).

## Implementation Checklist

### API Layer (`/api/sync/queue`)
- [ ] Batch endpoint processes actions in FIFO order.
- [ ] Returns deterministic results for duplicate idempotency keys.
- [ ] Returns 503 when unavailable (fail-closed).
- [ ] Uses in-memory or database idempotency store with TTL.

### Sync Worker (`sync-worker.ts`)
- [ ] `processQueue` respects FIFO ordering.
- [ ] `syncAction` includes `Idempotency-Key` header.
- [ ] Handles 409 as success (idempotent conflict).
- [ ] Implements exponential backoff with jitter.
- [ ] Stops retrying after 5 attempts.
- [ ] Emits sync events for UI updates.
- [ ] Uses `FakeFetch` in tests for deterministic behavior.

### Offline Queue Store (`offline-queue-store.ts`)
- [ ] `queueAction` generates deterministic idempotency key.
- [ ] `getPendingActions` sorts by `created_at`.
- [ ] `markAsSynced` stores `resolved_entity_id`.
- [ ] `markAsFailed` stores error message and increments attempts.
- [ ] `markAsConflict` for idempotency duplicates.
- [ ] `incrementRetry` updates attempt count and timestamp.
- [ ] TTL cleanup for old records (7 days for SYNCED, 24h for idempotency).

## Testing Checklist

### Unit Tests
- [ ] Idempotency store CRUD and TTL behavior.
- [ ] Backoff calculation deterministic with seeded RNG.
- [ ] Dependency check logic.

### E2E Tests
- [ ] FIFO order invariant with multiple actions.
- [ ] Idempotency: duplicate key returns CONFLICT.
- [ ] Retry on server error; fail-fast on client error.
- [ ] Dependency resolution prevents out-of-order sync.
- [ ] Fail-closed when backend unavailable.

### Compliance Tests
- [ ] Run `npm run test:PetMayday-alert-compliance` on each commit.
- [ ] Run `npm run test:sync-worker-e2e` in CI.
- [ ] Mutation testing (opt-in) for critical paths.

## Operational Checklist

### Monitoring
- [ ] Queue depth metrics (pending/synced/failed).
- [ ] Retry attempt distribution.
- [ ] Idempotency conflict rate.
- [ ] Dependency wait time.

### Debugging
- [ ] Logs include `idempotency_key` and `action_id`.
- [ ] Sync events emitted with actionable status.
- [ ] Admin view of queue state (for ops).

### Security & Privacy
- [ ] No sensitive data in idempotency keys.
- [ ] Auth tokens included in sync requests.
- [ ] Local storage encrypted if possible.
- [ ] Data purged after TTL.

## References

- [OFFLINE_PROTOCOL.md](./OFFLINE_PROTOCOL.md) – Full protocol specification
- [CANONICAL_LAW.md](./CANONICAL_LAW.md) – Governance and fail-closed rules
- [PetMayday Alert Compliance](./PetMayday_ALERT_COMPLIANCE.md) – Alert-specific compliance

---

**Non-negotiable:** Any deviation from this checklist MUST be approved by the Canon Guardrail and documented in the Impact Ledger.
