import {
  getPendingActions,
  markAsSyncing,
  markAsSynced,
  markAsFailed,
  markAsConflict,
  incrementRetry,
  getAction
} from '@/lib/db/offline-queue-store';
import { getEndpointForAction } from '@/lib/api/client';
import type { OfflineQueuedAction, SyncStatus } from '@/lib/types';

// Retry configuration per OFFLINE_PROTOCOL.md
const RETRY_CONFIG = {
  max_attempts: 5,
  base_delay_ms: 1000,
  max_delay_ms: 60000,
  backoff_factor: 2,
  jitter_factor: 0.1,
};

export interface SyncResult {
  status: SyncStatus;
  data?: {
    data?: {
      id?: string;
      case?: { id?: string };
      sighting?: { id?: string };
      log_id?: string;
    };
  };
  error?: string;
}

type SyncEventType = 'sync_started' | 'sync_completed' | 'action_synced' | 'action_failed' | 'sync_error';

interface SyncEventDetail {
  type: SyncEventType;
  actionId?: string;
  total?: number;
  synced?: number;
  failed?: number;
  error?: string;
}

/**
 * Calculate retry delay with exponential backoff and jitter
 * Per OFFLINE_PROTOCOL.md
 */
function calculateDelay(attempt: number): number {
  const exponential = RETRY_CONFIG.base_delay_ms *
    Math.pow(RETRY_CONFIG.backoff_factor, attempt - 1);
  const capped = Math.min(exponential, RETRY_CONFIG.max_delay_ms);
  const jitter = capped * RETRY_CONFIG.jitter_factor * Math.random();
  return capped + jitter;
}

/**
 * Get auth token (stub - implement with Firebase Auth)
 */
async function getAuthToken(): Promise<string | null> {
  // TODO: Implement Firebase Auth token retrieval
  return null;
}

/**
 * Sync a single queued action
 * Per OFFLINE_PROTOCOL.md: Use SAME idempotency key for all retries
 */
async function syncAction(action: OfflineQueuedAction): Promise<SyncResult> {
  const endpoint = getEndpointForAction(action.action_type);
  const token = await getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Idempotency-Key': action.idempotency_key,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(action.payload),
    });

    if (response.ok) {
      const data = await response.json();
      return { status: 'SYNCED', data };
    }

    if (response.status === 409) {
      // Idempotency conflict - already processed
      return { status: 'CONFLICT', error: 'Duplicate processed' };
    }

    if (response.status >= 400 && response.status < 500) {
      // Client error - do not retry
      const errorData = await response.json().catch(() => ({}));
      return {
        status: 'FAILED',
        error: errorData.error?.message || `Client error: ${response.status}`
      };
    }

    // Server error - should retry
    throw new Error(`Server error: ${response.status}`);

  } catch (error) {
    // Network error or server error - mark as pending for retry
    return {
      status: 'PENDING',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Emit sync event (for UI updates)
 */
function emitSyncEvent(detail: SyncEventDetail): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('proveniq-sync', { detail }));
  }
}

/**
 * Process the offline queue
 * Per OFFLINE_PROTOCOL.md: Actions MUST be synced in creation order (FIFO)
 */
export async function processQueue(): Promise<{
  synced: number;
  failed: number;
  pending: number;
}> {
  const pendingActions = await getPendingActions();

  if (pendingActions.length === 0) {
    return { synced: 0, failed: 0, pending: 0 };
  }

  emitSyncEvent({
    type: 'sync_started',
    total: pendingActions.length
  });

  let synced = 0;
  let failed = 0;
  let pending = 0;

  // Process in order (FIFO)
  for (const action of pendingActions) {
    // Check if max retries exceeded
    if (action.sync_attempts >= RETRY_CONFIG.max_attempts) {
      await markAsFailed(action.id, 'Max retry attempts exceeded');
      failed++;
      emitSyncEvent({
        type: 'action_failed',
        actionId: action.id,
        error: 'Max retry attempts exceeded'
      });
      continue;
    }

    // Mark as syncing
    await markAsSyncing(action.id);

    // Attempt sync
    const result = await syncAction(action);

    switch (result.status) {
      case 'SYNCED':
        const data = result.data as any;
        const entityId = data?.data?.id ||
          data?.data?.case?.id ||
          data?.data?.sighting?.id ||
          data?.data?.log_id ||
          'unknown';
        await markAsSynced(action.id, String(entityId));
        synced++;
        emitSyncEvent({ type: 'action_synced', actionId: action.id });
        break;

      case 'CONFLICT':
        await markAsConflict(action.id);
        synced++; // Count as synced since it was already processed
        break;

      case 'FAILED':
        await markAsFailed(action.id, result.error || 'Unknown error');
        failed++;
        emitSyncEvent({
          type: 'action_failed',
          actionId: action.id,
          error: result.error
        });
        break;

      case 'PENDING':
        // Increment retry counter and keep as pending
        const attempts = await incrementRetry(action.id);
        pending++;

        // If this was a network error and we have more attempts, wait before continuing
        if (attempts < RETRY_CONFIG.max_attempts) {
          const delay = calculateDelay(attempts);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        break;
    }
  }

  emitSyncEvent({
    type: 'sync_completed',
    synced,
    failed,
    total: pendingActions.length
  });

  return { synced, failed, pending };
}

/**
 * Start sync when network becomes available
 * Per OFFLINE_PROTOCOL.md: Start sync after 2s debounce
 */
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export function scheduleSyncOnReconnect(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    // Debounce - wait 2 seconds before syncing
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }

    syncTimeout = setTimeout(() => {
      processQueue().catch(error => {
        emitSyncEvent({
          type: 'sync_error',
          error: error instanceof Error ? error.message : 'Sync failed'
        });
      });
    }, 2000);
  });
}

/**
 * Trigger immediate sync (for user-initiated sync)
 */
export async function triggerSync(): Promise<{
  synced: number;
  failed: number;
  pending: number;
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, failed: 0, pending: 0 };
  }

  return processQueue();
}

/**
 * Check if an action can be synced (has dependencies resolved)
 * Per OFFLINE_PROTOCOL.md: If action A depends on action B, B must sync first
 */
export async function canSyncAction(action: OfflineQueuedAction): Promise<boolean> {
  // Check if this action depends on a local case ID that hasn't synced yet
  const payload = action.payload as Record<string, unknown>;

  if (action.action_type === 'CREATE_SIGHTING' && payload.missing_case_id) {
    // Check if the case ID is a local ID (not synced yet)
    const caseId = payload.missing_case_id as string;
    const dependentAction = await getAction(caseId);

    if (dependentAction && dependentAction.sync_status !== 'SYNCED') {
      return false;
    }
  }

  return true;
}

// Initialize sync on module load
if (typeof window !== 'undefined') {
  scheduleSyncOnReconnect();
}
