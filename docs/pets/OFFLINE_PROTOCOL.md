# PROVENIQ PETS (WV) — OFFLINE PROTOCOL

**Version:** 1.0.0  
**Status:** ACTIVE  
**Authoritative Reference:** CANONICAL_LAW.md, DATA_MODEL.md  
**Invariant:** OFFLINE_IDEMPOTENT

---

## 0. PURPOSE

This document defines the deterministic behavior of the PROVENIQ Pets application when operating in degraded or disconnected network conditions. West Virginia's pilot counties (Greenbrier, Kanawha) include significant rural areas with unreliable cellular coverage.

**Design Principle:** The application MUST remain useful in dead zones. Users must be able to report sightings, access emergency contacts, and initiate calls without an active data connection.

---

## 1. OFFLINE CAPABILITY TIERS

### 1.1 Tier Definitions

| Tier | Network State | User Capabilities |
|------|---------------|-------------------|
| **ONLINE** | Full connectivity | All features available; real-time sync |
| **DEGRADED** | Intermittent/slow | Read cached; queue writes; delayed sync |
| **OFFLINE** | No connectivity | Read cached; queue all writes; manual sync on reconnect |

### 1.2 Detection Criteria

```
ONLINE:
  - navigator.onLine === true
  - Last successful API call < 30 seconds ago
  - Latency < 5000ms

DEGRADED:
  - navigator.onLine === true
  - Last successful API call > 30 seconds ago OR latency > 5000ms
  - Connectivity event fired within last 5 minutes

OFFLINE:
  - navigator.onLine === false
  - OR No successful API call in > 120 seconds
  - OR Last 3 consecutive API calls failed
```

### 1.3 Visual Indicators

| State | UI Indicator | Color |
|-------|--------------|-------|
| ONLINE | None or green dot | `#22C55E` |
| DEGRADED | Yellow warning banner | `#F59E0B` |
| OFFLINE | Red banner: "Offline Mode - Changes will sync when connected" | `#EF4444` |

---

## 2. COUNTY PACK CACHING

### 2.1 Pack Contents

Each county pack is a versioned bundle containing:

```
county_pack_<county>_v<version>.zip
├── manifest.json           # Version, checksum, expiry
├── emergency_contacts.json # All contacts for county
├── aco_overrides.json      # Current ACO availability overrides
├── call_scripts/
│   ├── missing_pet.json    # Municipal call script
│   └── found_animal.json
├── phone_numbers.json      # Pre-formatted dial strings
└── map_tiles/              # Optional: offline map tiles (future)
```

### 2.2 Caching Strategy

| Event | Action |
|-------|--------|
| App install | Download pack for user's primary county |
| App launch | Check pack version; download if stale (> 7 days) |
| County change | Download new county pack in background |
| Pack expired | Show warning; allow continued use with stale indicator |

### 2.3 Storage Requirements

| Data Type | Storage Mechanism | Size Budget |
|-----------|-------------------|-------------|
| County packs | IndexedDB | 200KB per county |
| Queued actions | IndexedDB | 1MB total |
| Case cache | IndexedDB | 2MB total |
| Photos (pending upload) | FileSystem API | 50MB total |

### 2.4 Cache Expiry

```javascript
const CACHE_TTL = {
  county_pack: 7 * 24 * 60 * 60 * 1000,     // 7 days
  emergency_contacts: 24 * 60 * 60 * 1000,   // 24 hours
  aco_overrides: 6 * 60 * 60 * 1000,         // 6 hours
  case_list: 15 * 60 * 1000,                 // 15 minutes
  own_cases: 5 * 60 * 1000,                  // 5 minutes
};
```

---

## 3. OFFLINE QUEUE ARCHITECTURE

### 3.1 Queue Structure

```typescript
interface OfflineQueuedAction {
  id: string;                    // Local UUID
  idempotency_key: string;       // UUID v4, required
  action_type: QueueableAction;
  payload: object;               // Full request body
  user_id: string;
  device_id: string;
  created_at: string;            // ISO timestamp
  expires_at: string;            // created_at + 7 days
  sync_status: SyncStatus;
  sync_attempts: number;
  last_sync_attempt: string | null;
  sync_error: string | null;
  resolved_entity_id: string | null;
}

type QueueableAction = 
  | 'CREATE_MISSING_CASE'
  | 'CREATE_FOUND_CASE'
  | 'UPDATE_CASE'
  | 'CREATE_SIGHTING'
  | 'LOG_MUNICIPAL_CALL'
  | 'REQUEST_ER_VET_NOTIFY';

type SyncStatus = 
  | 'PENDING'    // Not yet attempted
  | 'SYNCING'    // Currently in flight
  | 'SYNCED'     // Successfully synced
  | 'FAILED'     // Permanent failure (4xx response)
  | 'CONFLICT';  // Idempotency conflict (already processed)
```

### 3.2 Queue Ordering

Actions MUST be synced in **creation order** to preserve causality.

```
INVARIANT: QUEUE_ORDER_PRESERVED
├─ Actions synced in FIFO order (created_at ascending)
├─ If action A depends on action B, B must sync first
│   └─ Example: Sighting for case X must wait for case X creation
├─ Parallel sync allowed ONLY for independent actions
└─ On conflict, pause queue and surface to user
```

### 3.3 Dependency Graph

```
CREATE_MISSING_CASE ──────────────────┐
                                      │
CREATE_SIGHTING (linked) ◄────────────┤
                                      │
LOG_MUNICIPAL_CALL ◄──────────────────┤
                                      │
REQUEST_ER_VET_NOTIFY ◄───────────────┘
```

**Dependency Resolution:**

1. If `CREATE_SIGHTING` references a `missing_case_id` that is also queued locally:
   - Replace local case ID placeholder with resolved ID after case syncs
   - Do not attempt sighting sync until case sync completes

2. Implementation uses **two-phase ID**:
   - `local_id`: UUID generated client-side (used for UI references)
   - `server_id`: UUID returned after sync (used for API calls)

---

## 4. IDEMPOTENCY PROTOCOL

### 4.1 Key Generation

```typescript
function generateIdempotencyKey(): string {
  return crypto.randomUUID(); // UUID v4
}

// Key must be generated ONCE when action is created
// Key must persist through all retry attempts
// Key must NOT be regenerated on retry
```

### 4.2 Server-Side Handling

```
Request received with Idempotency-Key header
    │
    ▼
┌─────────────────────────────────────────┐
│ Check idempotency store for key         │
│ (Redis/DB with 24-hour TTL)             │
└─────────────────────────────────────────┘
    │
    ├─── Key NOT found ──────────────────────────┐
    │                                            ▼
    │                               ┌─────────────────────────┐
    │                               │ Execute request         │
    │                               │ Store response with key │
    │                               │ Return response (2xx)   │
    │                               └─────────────────────────┘
    │
    └─── Key FOUND ──────────────────────────────┐
                                                  ▼
                                    ┌─────────────────────────┐
                                    │ Return cached response  │
                                    │ Do NOT re-execute       │
                                    │ HTTP 200 (not 409)      │
                                    └─────────────────────────┘
```

### 4.3 Client-Side Behavior

```typescript
async function syncQueuedAction(action: OfflineQueuedAction): Promise<SyncResult> {
  // Use SAME idempotency key for all retries
  const headers = {
    'Authorization': `Bearer ${await getToken()}`,
    'Idempotency-Key': action.idempotency_key,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(getEndpoint(action.action_type), {
      method: 'POST',
      headers,
      body: JSON.stringify(action.payload),
    });

    if (response.ok) {
      // Success - may be new or idempotent replay
      return { status: 'SYNCED', data: await response.json() };
    }

    if (response.status === 409) {
      // Rare: explicit conflict (shouldn't happen with proper idempotency)
      return { status: 'CONFLICT', error: 'Duplicate processed' };
    }

    if (response.status >= 400 && response.status < 500) {
      // Client error - do not retry
      return { status: 'FAILED', error: await response.text() };
    }

    // Server error - retry later
    throw new Error(`Server error: ${response.status}`);
    
  } catch (error) {
    // Network error - retry later
    return { status: 'PENDING', error: error.message };
  }
}
```

### 4.4 Idempotency Window

| Environment | TTL |
|-------------|-----|
| Production | 24 hours |
| Staging | 1 hour |

After TTL expires, same idempotency key may be reused (old action already committed or abandoned).

---

## 5. REPLAY SAFETY

### 5.1 Safe Actions (Naturally Idempotent)

| Action | Why Safe |
|--------|----------|
| CREATE with idempotency_key | Server deduplicates |
| GET requests | Read-only |
| Status checks | Read-only |

### 5.2 Unsafe Actions (Require Protection)

| Action | Protection Mechanism |
|--------|---------------------|
| CREATE without key | ❌ PROHIBITED - All creates require key |
| UPDATE | Optimistic locking via `updated_at` check |
| DELETE | Idempotent by nature (deleting deleted = OK) |
| INCREMENT/counter | ❌ NOT USED - Use event-sourced patterns |

### 5.3 Update Conflict Resolution

```typescript
interface UpdatePayload {
  // Include last-known updated_at
  expected_updated_at: string;
  // New field values
  changes: Record<string, any>;
}

// Server rejects if current updated_at !== expected_updated_at
// Client must refetch and re-apply changes
```

---

## 6. SYNC LIFECYCLE

### 6.1 Sync Trigger Conditions

| Trigger | Action |
|---------|--------|
| Network online event | Start sync after 2s debounce |
| App foreground | Check queue, start sync if pending |
| User manual sync | Immediate sync attempt |
| Background sync (PWA) | Periodic sync if enabled |
| Action queued while online | Immediate sync attempt |

### 6.2 Sync State Machine

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
              ┌─────────┐                                 │
     ───────► │ PENDING │ ◄────────────────────┐          │
              └────┬────┘                      │          │
                   │                           │          │
                   │ Network available         │          │
                   │ + Queue not empty         │          │
                   ▼                           │          │
              ┌─────────┐                      │          │
              │ SYNCING │                      │          │
              └────┬────┘                      │          │
                   │                           │          │
         ┌─────────┼─────────┐                 │          │
         │         │         │                 │          │
         ▼         ▼         ▼                 │          │
    ┌────────┐ ┌────────┐ ┌────────┐           │          │
    │ SYNCED │ │ FAILED │ │CONFLICT│           │          │
    └────────┘ └───┬────┘ └───┬────┘           │          │
                   │          │                │          │
                   │          └────────────────┘          │
                   │                                      │
                   │ Retry (5xx/network error)            │
                   └──────────────────────────────────────┘
```

### 6.3 Retry Policy

```typescript
const RETRY_CONFIG = {
  max_attempts: 5,
  base_delay_ms: 1000,
  max_delay_ms: 60000,
  backoff_factor: 2,
  jitter_factor: 0.1,
};

function calculateDelay(attempt: number): number {
  const exponential = RETRY_CONFIG.base_delay_ms * 
    Math.pow(RETRY_CONFIG.backoff_factor, attempt - 1);
  const capped = Math.min(exponential, RETRY_CONFIG.max_delay_ms);
  const jitter = capped * RETRY_CONFIG.jitter_factor * Math.random();
  return capped + jitter;
}

// Attempt 1: ~1000ms
// Attempt 2: ~2000ms
// Attempt 3: ~4000ms
// Attempt 4: ~8000ms
// Attempt 5: ~16000ms
```

### 6.4 Failure Handling

| Failure Type | Action |
|--------------|--------|
| Network error | Retry with backoff |
| 5xx server error | Retry with backoff |
| 4xx client error | Mark FAILED, surface to user |
| 401 Unauthorized | Refresh token, retry once |
| 409 Conflict | Mark CONFLICT, surface to user |
| Timeout (30s) | Retry with backoff |
| Max retries exceeded | Mark FAILED, surface to user |

---

## 7. OFFLINE-CAPABLE FEATURES

### 7.1 Feature Availability Matrix

| Feature | ONLINE | DEGRADED | OFFLINE |
|---------|--------|----------|---------|
| **View emergency contacts** | ✓ Live | ✓ Cached | ✓ Cached |
| **Make emergency call** | ✓ | ✓ | ✓ (native dialer) |
| **View call script** | ✓ Live | ✓ Cached | ✓ Cached |
| **Create missing case** | ✓ Immediate | ✓ Queued | ✓ Queued |
| **Create found case** | ✓ Immediate | ✓ Queued | ✓ Queued |
| **Report sighting** | ✓ Immediate | ✓ Queued | ✓ Queued |
| **Log municipal call** | ✓ Immediate | ✓ Queued | ✓ Queued |
| **View own cases** | ✓ Live | ✓ Cached | ✓ Cached |
| **View public case list** | ✓ Live | ⚠ Stale | ⚠ Stale |
| **View match suggestions** | ✓ Live | ❌ | ❌ |
| **Moderator actions** | ✓ Live | ❌ | ❌ |
| **ER vet notification** | ✓ Immediate | ✓ Queued | ✓ Queued* |

*ER vet notification queued offline may be time-sensitive. User warned.

### 7.2 Offline-Specific UI States

**Queued Action Indicator:**

```
┌─────────────────────────────────────────────┐
│ ⏳ Sighting Saved Locally                   │
│                                             │
│ This sighting will be submitted when        │
│ you're back online.                         │
│                                             │
│ [View Queue (3 pending)]                    │
└─────────────────────────────────────────────┘
```

**Stale Data Warning:**

```
┌─────────────────────────────────────────────┐
│ ⚠️ Showing cached data from 2 hours ago     │
│ [Refresh when online]                       │
└─────────────────────────────────────────────┘
```

**Emergency Action Warning (Offline):**

```
┌─────────────────────────────────────────────┐
│ ⚠️ Emergency Notification Queued            │
│                                             │
│ You're offline. The vet notification will   │
│ be sent when you reconnect.                 │
│                                             │
│ For immediate help, call directly:          │
│ [📞 Call +1-304-555-1234]                   │
└─────────────────────────────────────────────┘
```

---

## 8. PHOTO HANDLING (OFFLINE)

### 8.1 Capture Flow

```
User takes/selects photo
    │
    ▼
┌─────────────────────────────────────────┐
│ Compress to max 1024px, 80% JPEG        │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Store in FileSystem API / IndexedDB     │
│ Generate local blob URL for display     │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ Add to queued action payload as         │
│ { local_photo_id: "uuid" }              │
└─────────────────────────────────────────┘
```

### 8.2 Upload Flow (On Sync)

```
Sync triggered
    │
    ▼
┌─────────────────────────────────────────┐
│ For each queued action with photos:     │
│   1. Upload photo to storage            │
│   2. Get storage URL                    │
│   3. Replace local_photo_id with URL    │
│   4. Submit action                      │
└─────────────────────────────────────────┘
```

### 8.3 Storage Limits

| Limit | Value |
|-------|-------|
| Max photo size (raw) | 10MB |
| Max photo size (compressed) | 500KB |
| Max photos per action | 5 |
| Max total pending photos | 50MB |
| Auto-cleanup after | 7 days |

---

## 9. DATA CONSISTENCY

### 9.1 Optimistic UI

For queued actions, update local state immediately:

```typescript
async function createSighting(data: SightingInput) {
  const action = createQueuedAction('CREATE_SIGHTING', data);
  
  // 1. Save to queue
  await saveToQueue(action);
  
  // 2. Optimistically update local cache
  await updateLocalCache('sightings', {
    id: action.id,  // Local ID
    ...data,
    _pending: true,
    _queued_at: action.created_at,
  });
  
  // 3. Trigger sync if online
  if (isOnline()) {
    syncQueue();
  }
  
  // 4. Return immediately with local data
  return { id: action.id, queued: true };
}
```

### 9.2 Reconciliation on Sync

When queued action syncs:

```typescript
async function onActionSynced(action: OfflineQueuedAction, serverResponse: any) {
  // 1. Update queue status
  action.sync_status = 'SYNCED';
  action.resolved_entity_id = serverResponse.data.id;
  await updateQueue(action);
  
  // 2. Replace local entity with server entity
  await replaceLocalEntity(action.id, serverResponse.data);
  
  // 3. Update any references to local ID
  await updateReferences(action.id, serverResponse.data.id);
  
  // 4. Notify UI
  emitEvent('entity_synced', { local_id: action.id, server_id: serverResponse.data.id });
}
```

### 9.3 Conflict Resolution

If local and server state diverge:

| Conflict Type | Resolution |
|---------------|------------|
| Server has newer data | Server wins; merge local changes if possible |
| Local has uncommitted changes | Queue changes; apply after fetch |
| Concurrent edits | Last-write-wins with conflict notification |
| Deleted on server | Remove from local; notify user if had pending changes |

---

## 10. TESTING REQUIREMENTS

### 10.1 Offline Scenario Tests

| Test Case | Expected Behavior |
|-----------|-------------------|
| Create sighting while offline | Queued, shown with pending indicator |
| App killed while offline with queue | Queue persists on next launch |
| Sync fails with 500 | Retry with backoff |
| Sync fails with 400 | Mark failed, surface error |
| Duplicate idempotency key | Server returns cached response |
| Photo upload fails | Retry photo, then action |
| Network flaps during sync | Resume correctly, no duplicates |
| Queue expires (7 days) | Auto-cleanup with warning |

### 10.2 Service Worker Tests

```typescript
describe('Service Worker Offline Behavior', () => {
  it('serves cached county pack when offline');
  it('queues POST requests when offline');
  it('replays queue on reconnection');
  it('handles background sync registration');
  it('purges expired cache entries');
});
```

---

## 11. MONITORING & ALERTS

### 11.1 Metrics to Track

| Metric | Purpose |
|--------|---------|
| `queue_length` | Number of pending actions per user |
| `sync_latency_ms` | Time from queue to sync |
| `sync_success_rate` | Percentage of successful syncs |
| `retry_count_distribution` | How many retries needed |
| `idempotency_hit_rate` | Duplicate requests detected |
| `offline_session_duration` | How long users stay offline |

### 11.2 Alerts

| Condition | Alert |
|-----------|-------|
| Queue > 50 items for > 24h | User may be stuck offline |
| Sync success rate < 95% | Potential server issue |
| Retry rate > 30% | Network or server degradation |
| Idempotency hit rate > 5% | Possible client-side bug |

---

**END OF OFFLINE PROTOCOL v1.0.0**
