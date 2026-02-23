import { openDB, type IDBPDatabase } from 'idb';
import type { Graph } from '../types/graph';
import type { AreaMeta } from '../types/area';
import type { HistoryEntry } from '../types/history';
import type { StatusData } from '../types/status';

const DB_NAME = 'ski-route-planner';
const DB_VERSION = 2;

interface SkiRouteDB {
  areas: {
    key: string;
    value: {
      id: string;
      graph: Graph;
      geo: GeoJSON.FeatureCollection;
      meta: AreaMeta;
      cachedAt: string;
    };
  };
  settings: {
    key: string;
    value: unknown;
  };
  history: {
    key: string;
    value: HistoryEntry;
  };
  status: {
    key: string;
    value: StatusData;
  };
}

let dbPromise: Promise<IDBPDatabase<SkiRouteDB>> | null = null;

function getDb(): Promise<IDBPDatabase<SkiRouteDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SkiRouteDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('areas')) {
          db.createObjectStore('areas', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('status')) {
          db.createObjectStore('status', { keyPath: 'areaId' });
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheArea(
  areaId: string,
  graph: Graph,
  geo: GeoJSON.FeatureCollection,
  meta: AreaMeta,
): Promise<void> {
  const db = await getDb();

  // One-area-at-a-time: clear previous areas
  const tx = db.transaction('areas', 'readwrite');
  await tx.store.clear();
  await tx.store.put({
    id: areaId,
    graph,
    geo,
    meta,
    cachedAt: new Date().toISOString(),
  });
  await tx.done;
}

export async function getCachedArea(areaId: string) {
  const db = await getDb();
  return db.get('areas', areaId);
}

export async function getCachedAreaId(): Promise<string | null> {
  const db = await getDb();
  const keys = await db.getAllKeys('areas');
  return keys.length > 0 ? String(keys[0]) : null;
}

export async function clearCache(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('areas', 'readwrite');
  await tx.store.clear();
  await tx.done;
}

// History functions
export async function addHistoryEntry(entry: HistoryEntry): Promise<void> {
  const db = await getDb();
  await db.put('history', entry);
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const db = await getDb();
  const entries = await db.getAll('history');
  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('history', id);
}

// Status functions
export async function cacheStatus(status: StatusData): Promise<void> {
  const db = await getDb();
  await db.put('status', status);
}

export async function getCachedStatus(areaId: string): Promise<StatusData | undefined> {
  const db = await getDb();
  return db.get('status', areaId);
}
