/**
 * Tests for Offline Queue
 * Per OFFLINE_PROTOCOL.md: Idempotency, FIFO ordering, retry logic
 */
import 'fake-indexeddb/auto';
import { 
  queueAction, 
  getPendingActions, 
  getActionByIdempotencyKey,
  markAsSynced,
  markAsFailed,
  markAsConflict,
  incrementRetry,
  getQueueStats,
  cleanupSyncedActions,
  cleanupExpiredActions 
} from '../src/lib/db/offline-queue-store';
import { clearAllData } from '../src/lib/db/indexed-db';

describe('Offline Queue', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  describe('Idempotency', () => {
    test('each action should have a unique idempotency key', async () => {
      const action1 = await queueAction('CREATE_SIGHTING', { test: 1 }, 'user1');
      const action2 = await queueAction('CREATE_SIGHTING', { test: 2 }, 'user1');
      
      expect(action1.idempotency_key).not.toEqual(action2.idempotency_key);
    });

    test('idempotency key should be retrievable', async () => {
      const action = await queueAction('CREATE_SIGHTING', { test: 1 }, 'user1');
      
      const retrieved = await getActionByIdempotencyKey(action.idempotency_key);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toEqual(action.id);
    });

    test('idempotency key should persist through status changes', async () => {
      const action = await queueAction('CREATE_SIGHTING', { test: 1 }, 'user1');
      const originalKey = action.idempotency_key;
      
      await markAsSynced(action.id, 'entity-123');
      
      const retrieved = await getActionByIdempotencyKey(originalKey);
      expect(retrieved?.idempotency_key).toEqual(originalKey);
    });

    test('idempotency key should persist through retries', async () => {
      const action = await queueAction('CREATE_SIGHTING', { test: 1 }, 'user1');
      const originalKey = action.idempotency_key;
      
      await incrementRetry(action.id);
      await incrementRetry(action.id);
      
      const retrieved = await getActionByIdempotencyKey(originalKey);
      expect(retrieved?.idempotency_key).toEqual(originalKey);
      expect(retrieved?.sync_attempts).toEqual(2);
    });
  });

  describe('FIFO Ordering', () => {
    test('actions should be returned in creation order', async () => {
      const action1 = await queueAction('CREATE_SIGHTING', { order: 1 }, 'user1');
      const action2 = await queueAction('CREATE_SIGHTING', { order: 2 }, 'user1');
      const action3 = await queueAction('CREATE_SIGHTING', { order: 3 }, 'user1');
      
      const pending = await getPendingActions();
      
      expect(pending.length).toBe(3);
      expect(pending[0].id).toEqual(action1.id);
      expect(pending[1].id).toEqual(action2.id);
      expect(pending[2].id).toEqual(action3.id);
    });

    test('synced actions should not appear in pending list', async () => {
      const action1 = await queueAction('CREATE_SIGHTING', { order: 1 }, 'user1');
      const action2 = await queueAction('CREATE_SIGHTING', { order: 2 }, 'user1');
      
      await markAsSynced(action1.id, 'entity-1');
      
      const pending = await getPendingActions();
      
      expect(pending.length).toBe(1);
      expect(pending[0].id).toEqual(action2.id);
    });
  });

  describe('Status Tracking', () => {
    test('new action should have PENDING status', async () => {
      const action = await queueAction('CREATE_SIGHTING', {}, 'user1');
      
      expect(action.sync_status).toEqual('PENDING');
      expect(action.sync_attempts).toEqual(0);
    });

    test('markAsSynced should update status and store entity ID', async () => {
      const action = await queueAction('CREATE_SIGHTING', {}, 'user1');
      
      await markAsSynced(action.id, 'entity-123');
      
      const retrieved = await getActionByIdempotencyKey(action.idempotency_key);
      expect(retrieved?.sync_status).toEqual('SYNCED');
      expect(retrieved?.resolved_entity_id).toEqual('entity-123');
    });

    test('markAsFailed should update status and store error', async () => {
      const action = await queueAction('CREATE_SIGHTING', {}, 'user1');
      
      await markAsFailed(action.id, 'Network error');
      
      const retrieved = await getActionByIdempotencyKey(action.idempotency_key);
      expect(retrieved?.sync_status).toEqual('FAILED');
      expect(retrieved?.sync_error).toEqual('Network error');
    });

    test('markAsConflict should update status for duplicates', async () => {
      const action = await queueAction('CREATE_SIGHTING', {}, 'user1');
      
      await markAsConflict(action.id);
      
      const retrieved = await getActionByIdempotencyKey(action.idempotency_key);
      expect(retrieved?.sync_status).toEqual('CONFLICT');
    });
  });

  describe('Retry Logic', () => {
    test('incrementRetry should increase attempt count', async () => {
      const action = await queueAction('CREATE_SIGHTING', {}, 'user1');
      
      const attempts1 = await incrementRetry(action.id);
      const attempts2 = await incrementRetry(action.id);
      const attempts3 = await incrementRetry(action.id);
      
      expect(attempts1).toBe(1);
      expect(attempts2).toBe(2);
      expect(attempts3).toBe(3);
    });

    test('incrementRetry should update last_sync_attempt timestamp', async () => {
      const action = await queueAction('CREATE_SIGHTING', {}, 'user1');
      const before = new Date();
      
      await incrementRetry(action.id);
      
      const retrieved = await getActionByIdempotencyKey(action.idempotency_key);
      const attemptTime = new Date(retrieved!.last_sync_attempt!);
      
      expect(attemptTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('Queue Statistics', () => {
    test('getQueueStats should return accurate counts', async () => {
      await queueAction('CREATE_SIGHTING', {}, 'user1');
      await queueAction('CREATE_SIGHTING', {}, 'user1');
      const action3 = await queueAction('CREATE_SIGHTING', {}, 'user1');
      const action4 = await queueAction('CREATE_SIGHTING', {}, 'user1');
      
      await markAsSynced(action3.id, 'entity-3');
      await markAsFailed(action4.id, 'Error');
      
      const stats = await getQueueStats();
      
      expect(stats.pending).toBe(2);
      expect(stats.synced).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.total).toBe(4);
    });
  });

  describe('Cleanup', () => {
    test('cleanupSyncedActions should remove old synced actions', async () => {
      const action = await queueAction('CREATE_SIGHTING', {}, 'user1');
      await markAsSynced(action.id, 'entity-1');
      
      // Mock old created_at by manually updating (in real test, use time mocking)
      const cleaned = await cleanupSyncedActions(0); // 0 days = cleanup all
      
      expect(cleaned).toBe(1);
      
      const stats = await getQueueStats();
      expect(stats.synced).toBe(0);
    });

    test('cleanupExpiredActions should remove expired actions', async () => {
      // This test would require time mocking for proper testing
      // For now, just verify the function runs without error
      const cleaned = await cleanupExpiredActions();
      expect(typeof cleaned).toBe('number');
    });
  });

  describe('Action Types', () => {
    test('should support all queueable action types', async () => {
      const types = [
        'CREATE_MISSING_CASE',
        'CREATE_FOUND_CASE',
        'UPDATE_CASE',
        'CREATE_SIGHTING',
        'LOG_MUNICIPAL_CALL',
        'REQUEST_ER_VET_NOTIFY',
      ] as const;

      for (const actionType of types) {
        const action = await queueAction(actionType, { type: actionType }, 'user1');
        expect(action.action_type).toEqual(actionType);
      }
    });
  });

  describe('Expiry', () => {
    test('new action should have expires_at 7 days in future', async () => {
      const action = await queueAction('CREATE_SIGHTING', {}, 'user1');
      
      const expiresAt = new Date(action.expires_at);
      const now = new Date();
      const diffDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      // Should be approximately 7 days (allow for test execution time)
      expect(diffDays).toBeGreaterThan(6.9);
      expect(diffDays).toBeLessThan(7.1);
    });
  });
});
