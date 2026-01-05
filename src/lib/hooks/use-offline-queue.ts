'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  queueAction, 
  getPendingActions, 
  getQueueStats,
  getAllActions,
  deleteAction 
} from '@/lib/db/offline-queue-store';
import { triggerSync } from '@/lib/sync/sync-worker';
import type { OfflineQueuedAction, QueueableAction, SyncStatus } from '@/lib/types';

interface QueueStats {
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
  conflict: number;
  total: number;
}

interface UseOfflineQueueResult {
  stats: QueueStats;
  pendingActions: OfflineQueuedAction[];
  allActions: OfflineQueuedAction[];
  isLoading: boolean;
  isSyncing: boolean;
  queueAction: (
    actionType: QueueableAction,
    payload: Record<string, unknown>
  ) => Promise<OfflineQueuedAction>;
  syncNow: () => Promise<void>;
  removeAction: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage offline action queue
 * Per OFFLINE_PROTOCOL.md: Queue persists across app restarts
 */
export function useOfflineQueue(userId: string | null): UseOfflineQueueResult {
  const [stats, setStats] = useState<QueueStats>({
    pending: 0,
    syncing: 0,
    synced: 0,
    failed: 0,
    conflict: 0,
    total: 0,
  });
  const [pendingActions, setPendingActions] = useState<OfflineQueuedAction[]>([]);
  const [allActions, setAllActions] = useState<OfflineQueuedAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Refresh queue data
  const refresh = useCallback(async () => {
    try {
      const [newStats, pending, all] = await Promise.all([
        getQueueStats(),
        getPendingActions(),
        getAllActions(),
      ]);
      setStats(newStats);
      setPendingActions(pending);
      setAllActions(all);
    } catch (error) {
      console.error('Failed to refresh queue:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await refresh();
      setIsLoading(false);
    };
    load();
  }, [refresh]);

  // Listen for sync events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSyncEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      
      if (detail.type === 'sync_started') {
        setIsSyncing(true);
      } else if (detail.type === 'sync_completed' || detail.type === 'sync_error') {
        setIsSyncing(false);
        refresh();
      } else if (detail.type === 'action_synced' || detail.type === 'action_failed') {
        refresh();
      }
    };

    window.addEventListener('proveniq-sync', handleSyncEvent);
    return () => window.removeEventListener('proveniq-sync', handleSyncEvent);
  }, [refresh]);

  // Queue a new action
  const queue = useCallback(async (
    actionType: QueueableAction,
    payload: Record<string, unknown>
  ): Promise<OfflineQueuedAction> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const action = await queueAction(actionType, payload, userId);
    await refresh();

    // If online, trigger sync immediately
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      triggerSync().catch(console.error);
    }

    return action;
  }, [userId, refresh]);

  // Trigger manual sync
  const syncNow = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.onLine) {
      return;
    }

    setIsSyncing(true);
    try {
      await triggerSync();
    } finally {
      setIsSyncing(false);
      await refresh();
    }
  }, [refresh]);

  // Remove action from queue
  const removeAction = useCallback(async (id: string) => {
    await deleteAction(id);
    await refresh();
  }, [refresh]);

  return {
    stats,
    pendingActions,
    allActions,
    isLoading,
    isSyncing,
    queueAction: queue,
    syncNow,
    removeAction,
    refresh,
  };
}

/**
 * Get status badge color for sync status
 */
export function getSyncStatusColor(status: SyncStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'SYNCING':
      return 'bg-blue-100 text-blue-800';
    case 'SYNCED':
      return 'bg-green-100 text-green-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    case 'CONFLICT':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get human-readable action type label
 */
export function getActionTypeLabel(actionType: QueueableAction): string {
  switch (actionType) {
    case 'CREATE_MISSING_CASE':
      return 'Report Missing Pet';
    case 'CREATE_FOUND_CASE':
      return 'Report Found Animal';
    case 'CREATE_SIGHTING':
      return 'Report Sighting';
    case 'LOG_MUNICIPAL_CALL':
      return 'Log Call Outcome';
    case 'REQUEST_ER_VET_NOTIFY':
      return 'ER Vet Notification';
    case 'UPDATE_CASE':
      return 'Update Case';
    default:
      return actionType;
  }
}
