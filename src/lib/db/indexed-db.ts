import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type {
  CachedCountyPack,
  OfflineQueuedAction,
  County,
  PetGoBagProfile,
  SightingReportExtended,
  SightingNotification
} from '@/lib/types';

// Database schema definition
interface ProveniqPetsDB extends DBSchema {
  'county-packs': {
    key: County;
    value: CachedCountyPack;
    indexes: { 'by-expires': string };
  };
  'offline-queue': {
    key: string;
    value: OfflineQueuedAction;
    indexes: {
      'by-status': string;
      'by-created': string;
    };
  };
  'pet-go-bag': {
    key: string;
    value: PetGoBagProfile;
    indexes: { 'by-updated': string };
  };
  'sighting-reports': {
    key: string;
    value: SightingReportExtended;
    indexes: {
      'by-status': string;
      'by-priority': string;
      'by-created': string;
    };
  };
}

const DB_NAME = 'proveniq-pets';
const DB_VERSION = 3;

let dbInstance: IDBPDatabase<ProveniqPetsDB> | null = null;

/**
 * Initialize and get the IndexedDB database instance
 * Per OFFLINE_PROTOCOL.md: Queue persists across app restarts
 */
export async function getDB(): Promise<IDBPDatabase<ProveniqPetsDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<ProveniqPetsDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // County packs store
      if (!db.objectStoreNames.contains('county-packs')) {
        const countyPackStore = db.createObjectStore('county-packs', {
          keyPath: 'county',
        });
        countyPackStore.createIndex('by-expires', 'expires_at');
      }

      // Offline queue store
      if (!db.objectStoreNames.contains('offline-queue')) {
        const queueStore = db.createObjectStore('offline-queue', {
          keyPath: 'id',
        });
        queueStore.createIndex('by-status', 'sync_status');
        queueStore.createIndex('by-created', 'created_at');
      }

      // Pet go-bag store (local-only pet profiles)
      if (!db.objectStoreNames.contains('pet-go-bag')) {
        const petStore = db.createObjectStore('pet-go-bag', {
          keyPath: 'id',
        });
        petStore.createIndex('by-updated', 'updated_at');
      }

      // Sighting reports store
      if (!db.objectStoreNames.contains('sighting-reports')) {
        const sightingStore = db.createObjectStore('sighting-reports', {
          keyPath: 'id',
        });
        sightingStore.createIndex('by-status', 'status');
        sightingStore.createIndex('by-priority', 'priority');
        sightingStore.createIndex('by-created', 'created_at');
      }
    },
  });

  return dbInstance;
}

/**
 * Close the database connection
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Clear all data (for testing or logout)
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['county-packs', 'offline-queue', 'pet-go-bag', 'sighting-reports'], 'readwrite');
  await Promise.all([
    tx.objectStore('county-packs').clear(),
    tx.objectStore('offline-queue').clear(),
    tx.objectStore('pet-go-bag').clear(),
    tx.objectStore('sighting-reports').clear(),
    tx.done,
  ]);
}

/**
 * Save a sighting report to IndexedDB
 */
export async function saveSightingReport(report: Omit<SightingReportExtended, 'id' | 'created_at' | 'updated_at' | 'notifications'>): Promise<string> {
  const db = await getDB();
  const id = `sighting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const fullReport: SightingReportExtended = {
    ...report,
    id,
    created_at: now,
    updated_at: now,
    notifications: [],
  };

  await db.put('sighting-reports', fullReport);
  return id;
}

/**
 * Get all sighting reports, sorted by priority and creation date
 */
export async function getSightingReports(): Promise<SightingReportExtended[]> {
  const db = await getDB();
  const reports = await db.getAll('sighting-reports');

  // Sort by priority (HIGH first) then by creation date (newest first)
  const priorityOrder = { 'HIGH': 0, 'MEDIUM': 1, 'LOW': 2 };
  return reports.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Get a specific sighting report by ID
 */
export async function getSightingReport(id: string): Promise<SightingReportExtended | undefined> {
  const db = await getDB();
  return await db.get('sighting-reports', id);
}

/**
 * Update a sighting report status and/or add a notification
 */
export async function updateSightingReport(
  id: string,
  updates: Partial<Pick<SightingReportExtended, 'status'>>,
  notification?: Omit<SightingNotification, 'id' | 'timestamp' | 'read'>
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('sighting-reports', 'readwrite');

  const report = await tx.store.get(id);
  if (!report) throw new Error(`Sighting report ${id} not found`);

  const updatedReport = {
    ...report,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (notification) {
    const newNotification: SightingNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    updatedReport.notifications = [...(report.notifications || []), newNotification];
  }

  await tx.store.put(updatedReport);
  await tx.done;
}

/**
 * Mark notifications as read for a sighting report
 */
export async function markNotificationsRead(sightingId: string, notificationIds?: string[]): Promise<void> {
  const db = await getDB();
  const report = await db.get('sighting-reports', sightingId);
  if (!report) return;

  const updatedNotifications = (report.notifications || []).map(notif => {
    if (!notificationIds || notificationIds.includes(notif.id)) {
      return { ...notif, read: true };
    }
    return notif;
  });

  await db.put('sighting-reports', {
    ...report,
    notifications: updatedNotifications,
    updated_at: new Date().toISOString(),
  });
}
