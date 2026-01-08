import { cleanupExpired, get, set, setStore } from '@/lib/sync/idempotency-store';

declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare const expect: (value: unknown) => any;
declare const beforeEach: (fn: () => void) => void;

describe('Sync Queue Idempotency (in-memory)', () => {

  // Reset in-memory store before each test
  beforeEach(() => {
    setStore(new Map());
  });

  it('stores and retrieves idempotency records', () => {
    const key = 'key-123';
    const record = {
      idempotency_key: key,
      status: 'SYNCED' as const,
      resolved_entity_id: 'entity-456',
      created_at: new Date().toISOString(),
    };
    set(record);
    const retrieved = get(key);
    expect(retrieved).toEqual(record);
  });

  it('cleans up expired records', () => {
    const oldKey = 'old-key';
    const now = new Date();
    const expired = new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(); // 25h ago
    const record = {
      idempotency_key: oldKey,
      status: 'SYNCED' as const,
      created_at: expired,
    };
    set(record);
    // Because get auto-cleans expired entries, we expect undefined even before cleanupExpired
    expect(get(oldKey)).toBeUndefined();
    // After explicit cleanup, still undefined
    cleanupExpired();
    expect(get(oldKey)).toBeUndefined();
  });
});
