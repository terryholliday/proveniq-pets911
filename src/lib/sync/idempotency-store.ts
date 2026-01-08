/**
 * In-memory idempotency store for /api/sync/queue
 * FAIL-CLOSED: Persists only in process memory; restarts wipe state.
 * Deterministic: Simple Map with TTL per OFFLINE_PROTOCOL.md.
 */

export interface IdempotencyRecord {
  idempotency_key: string;
  status: 'SYNCED' | 'CONFLICT' | 'FAILED';
  resolved_entity_id?: string;
  error?: string;
  created_at: string;
}

/**
 * In-memory TTL-based store
 * Allows test injection via setStore
 */
let store = new Map<string, IdempotencyRecord>();

/**
 * Inject a new store (for tests)
 */
export function setStore(newStore: Map<string, IdempotencyRecord>): void {
  store = newStore;
}

/**
 * TTL for idempotency records: 24 hours
 */
const TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Cleanup expired entries (call periodically)
 */
export function cleanupExpired(): void {
  const now = Date.now();
  Array.from(store.entries()).forEach(([key, record]) => {
    if (now - new Date(record.created_at).getTime() > TTL_MS) {
      store.delete(key);
    }
  });
}

/**
 * Check if an idempotency key exists and return its record
 */
export function get(key: string): IdempotencyRecord | undefined {
  const record = store.get(key);
  if (!record) return undefined;
  // If expired, delete and return undefined
  if (Date.now() - new Date(record.created_at).getTime() > TTL_MS) {
    store.delete(key);
    return undefined;
  }
  return record;
}

/**
 * Record a new idempotency result
 */
export function set(record: IdempotencyRecord): void {
  store.set(record.idempotency_key, record);
}

/**
 * Debug helper: count entries
 */
export function size(): number {
  return store.size;
}
