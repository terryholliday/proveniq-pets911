import { getDB } from './indexed-db';
import { generateIdempotencyKey, getDeviceId, calculateExpiryTimestamp } from '@/lib/utils/idempotency';
import type {
  OfflineQueuedAction,
  QueueableAction,
  SyncStatus
} from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

let sequenceCounter = Date.now(); // Initialize with timestamp to avoid collisions across reloads if possible

/**
 * Add action to offline queue
 * Per OFFLINE_PROTOCOL.md: Every offline-queued POST MUST include an idempotency_key
 */
export async function queueAction(
  actionType: QueueableAction,
  payload: Record<string, unknown>,
  userId: string
): Promise<OfflineQueuedAction> {
  const db = await getDB();

  const action: OfflineQueuedAction = {
    id: uuidv4(),
    idempotency_key: generateIdempotencyKey(),
    action_type: actionType,
    payload,
    user_id: userId,
    device_id: getDeviceId(),
    created_at: new Date().toISOString(),
    expires_at: calculateExpiryTimestamp(),
    sync_status: 'PENDING',
    sync_attempts: 0,
    last_sync_attempt: null,
    sync_error: null,
    resolved_entity_id: null,
    sequence_number: sequenceCounter++,
  };

  await db.put('offline-queue', action);

  return action;
}

/**
 * Get all pending actions (FIFO order by created_at)
 * Per OFFLINE_PROTOCOL.md: Actions MUST be synced in creation order to preserve causality
 */
export async function getPendingActions(): Promise<OfflineQueuedAction[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('offline-queue', 'by-status', 'PENDING');

  // Sort by sequence_number ascending (Strict FIFO)
  return all.sort((a, b) =>
    (a.sequence_number || 0) - (b.sequence_number || 0)
  );
}

/**
 * Get action by ID
 */
export async function getAction(id: string): Promise<OfflineQueuedAction | undefined> {
  const db = await getDB();
  return db.get('offline-queue', id);
}

/**
 * Resolve queued dependencies for a case once the case has synced.
 * Currently supports resolving `missing_case_id` in CREATE_SIGHTING actions.
 */
export async function resolveCaseDependencies(
  clientCaseId: string,
  resolvedCaseId: string
): Promise<number> {
  const db = await getDB();
  const all = await db.getAll('offline-queue');

  let updated = 0;

  for (const action of all) {
    if (action.sync_status !== 'PENDING') continue;
    if (action.action_type !== 'CREATE_SIGHTING') continue;

    const payload = action.payload as Record<string, unknown>;
    if (payload.missing_case_id !== clientCaseId) continue;

    const nextPayload: Record<string, unknown> = { ...payload, case_id: resolvedCaseId };
    delete (nextPayload as any).missing_case_id;

    await db.put('offline-queue', {
      ...action,
      payload: nextPayload,
    });
    updated++;
  }

  return updated;
}

/**
 * Get action by idempotency key
 */
export async function getActionByIdempotencyKey(
  idempotencyKey: string
): Promise<OfflineQueuedAction | undefined> {
  const db = await getDB();
  const all = await db.getAll('offline-queue');
  return all.find(a => a.idempotency_key === idempotencyKey);
}

/**
 * Update action sync status
 */
export async function updateActionStatus(
  id: string,
  status: SyncStatus,
  updates?: Partial<Pick<OfflineQueuedAction, 'sync_error' | 'resolved_entity_id' | 'sync_attempts' | 'last_sync_attempt'>>
): Promise<void> {
  const db = await getDB();
  const action = await db.get('offline-queue', id);

  if (!action) {
    throw new Error(`Action not found: ${id}`);
  }

  const updated: OfflineQueuedAction = {
    ...action,
    sync_status: status,
    ...updates,
  };

  await db.put('offline-queue', updated);
}

/**
 * Mark action as syncing
 */
export async function markAsSyncing(id: string): Promise<void> {
  await updateActionStatus(id, 'SYNCING', {
    last_sync_attempt: new Date().toISOString(),
  });
}

/**
 * Mark action as synced with resolved entity ID
 */
export async function markAsSynced(
  id: string,
  resolvedEntityId: string
): Promise<void> {
  await updateActionStatus(id, 'SYNCED', {
    resolved_entity_id: resolvedEntityId,
  });
}

/**
 * Mark action as failed
 */
export async function markAsFailed(id: string, error: string): Promise<void> {
  const db = await getDB();
  const action = await db.get('offline-queue', id);

  if (!action) {
    throw new Error(`Action not found: ${id}`);
  }

  await updateActionStatus(id, 'FAILED', {
    sync_error: error,
    sync_attempts: action.sync_attempts + 1,
    last_sync_attempt: new Date().toISOString(),
  });
}

/**
 * Mark action as conflict (duplicate idempotency key already processed)
 */
export async function markAsConflict(id: string): Promise<void> {
  await updateActionStatus(id, 'CONFLICT', {
    sync_error: 'Duplicate processed - idempotency conflict',
  });
}

/**
 * Increment retry count and update last attempt
 * Per OFFLINE_PROTOCOL.md: max_attempts: 5
 */
export async function incrementRetry(id: string): Promise<number> {
  const db = await getDB();
  const action = await db.get('offline-queue', id);

  if (!action) {
    throw new Error(`Action not found: ${id}`);
  }

  const newAttempts = action.sync_attempts + 1;

  await updateActionStatus(id, 'PENDING', {
    sync_attempts: newAttempts,
    last_sync_attempt: new Date().toISOString(),
  });

  return newAttempts;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
  conflict: number;
  total: number;
}> {
  const db = await getDB();
  const all = await db.getAll('offline-queue');

  const stats = {
    pending: 0,
    syncing: 0,
    synced: 0,
    failed: 0,
    conflict: 0,
    total: all.length,
  };

  for (const action of all) {
    switch (action.sync_status) {
      case 'PENDING':
        stats.pending++;
        break;
      case 'SYNCING':
        stats.syncing++;
        break;
      case 'SYNCED':
        stats.synced++;
        break;
      case 'FAILED':
        stats.failed++;
        break;
      case 'CONFLICT':
        stats.conflict++;
        break;
    }
  }

  return stats;
}

/**
 * Remove synced actions older than specified age
 * Per OFFLINE_PROTOCOL.md: SYNCED actions retained for 7 days
 */
export async function cleanupSyncedActions(maxAgeDays: number = 7): Promise<number> {
  const db = await getDB();
  const all = await db.getAll('offline-queue');
  const cutoff = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);

  let cleaned = 0;

  for (const action of all) {
    if (
      action.sync_status === 'SYNCED' &&
      new Date(action.created_at).getTime() <= cutoff
    ) {
      await db.delete('offline-queue', action.id);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Remove expired actions
 * Per OFFLINE_PROTOCOL.md: Queue expires after 7 days
 */
export async function cleanupExpiredActions(): Promise<number> {
  const db = await getDB();
  const all = await db.getAll('offline-queue');
  const now = new Date();

  let cleaned = 0;

  for (const action of all) {
    if (new Date(action.expires_at) < now) {
      await db.delete('offline-queue', action.id);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Get all actions (for debugging/admin)
 */
export async function getAllActions(): Promise<OfflineQueuedAction[]> {
  const db = await getDB();
  return db.getAll('offline-queue');
}

/**
 * Delete action by ID
 */
export async function deleteAction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('offline-queue', id);
}
