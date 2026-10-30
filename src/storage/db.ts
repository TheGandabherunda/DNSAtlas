import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { BenchmarkSession, DnsProvider } from '../types/dns';

interface DnsAtlasDB extends DBSchema {
  sessions: {
    key: string;
    value: BenchmarkSession;
    indexes: { 'by-date': string };
  };
  customProviders: {
    key: string;
    value: DnsProvider;
  };
}

const DB_NAME = 'dnsatlas-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DnsAtlasDB>> | null = null;

function getDb(): Promise<IDBPDatabase<DnsAtlasDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DnsAtlasDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('by-date', 'timestamp');
        }
        if (!db.objectStoreNames.contains('customProviders')) {
          db.createObjectStore('customProviders', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveBenchmarkSession(session: BenchmarkSession): Promise<void> {
  const db = await getDb();
  await db.put('sessions', session);
}

export async function getAllBenchmarkSessions(): Promise<BenchmarkSession[]> {
  const db = await getDb();
  const sessions = await db.getAllFromIndex('sessions', 'by-date');
  return sessions.reverse(); // Newest first
}

export async function getBenchmarkSession(id: string): Promise<BenchmarkSession | undefined> {
  const db = await getDb();
  return db.get('sessions', id);
}

export async function deleteBenchmarkSession(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('sessions', id);
}

export async function clearAllBenchmarkHistory(): Promise<void> {
  const db = await getDb();
  await db.clear('sessions');
}

export async function saveCustomProvider(provider: DnsProvider): Promise<void> {
  const db = await getDb();
  await db.put('customProviders', provider);
}

export async function getAllCustomProviders(): Promise<DnsProvider[]> {
  const db = await getDb();
  return db.getAll('customProviders');
}

export async function deleteCustomProvider(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('customProviders', id);
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  defaultProfile: 'repeated' | 'varied';
  defaultTimeoutMs: number;
  defaultConcurrency: number;
  historyEnabled: boolean;
  activeDataset: 'standard' | 'custom';
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  defaultProfile: 'repeated',
  defaultTimeoutMs: 5000,
  defaultConcurrency: 1,
  historyEnabled: true,
  activeDataset: 'standard',
};

const PREFS_KEY = 'dnsatlas_preferences_v1';

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch {
    // LocalStorage unavailable or corrupt
  }
  return DEFAULT_PREFERENCES;
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore error
  }
}
