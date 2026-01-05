import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { 
  CachedCountyPack, 
  OfflineQueuedAction,
  County 
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
}

const DB_NAME = 'proveniq-pets';
const DB_VERSION = 1;

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
  const tx = db.transaction(['county-packs', 'offline-queue'], 'readwrite');
  await Promise.all([
    tx.objectStore('county-packs').clear(),
    tx.objectStore('offline-queue').clear(),
    tx.done,
  ]);
}
