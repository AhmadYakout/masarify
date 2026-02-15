import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

type PersistenceEngine = 'sqlite' | 'localStorage';

const DATABASE_NAME = 'masarify_local_state';
const DATABASE_VERSION = 1;
const CURRENT_SCHEMA_VERSION = 1;
const META_TABLE = 'app_meta';
const STATE_TABLE = 'app_state';
const SCHEMA_VERSION_KEY = 'schema_version';

let sqliteConnection: SQLiteConnection | null = null;
let sqliteDatabase: SQLiteDBConnection | null = null;
let initializationPromise: Promise<void> | null = null;
let activeEngine: PersistenceEngine = 'localStorage';
let activeSchemaVersion = 0;
let fallbackWarningPrinted = false;

const STORAGE_ENGINE_FALLBACK_PREFIX = '[Masarify][Persistence]';

const isNativeRuntime = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage;
};

const readLocalStorageRaw = (key: string): string | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  return storage.getItem(key);
};

const writeLocalStorageRaw = (key: string, payload: string): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(key, payload);
};

const removeLocalStorageValue = (key: string): void => {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(key);
};

const parseJsonPayload = <T>(raw: string | null): T | null => {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const warnAndFallbackToLocalStorage = (error: unknown): void => {
  activeEngine = 'localStorage';
  sqliteDatabase = null;
  activeSchemaVersion = 0;

  if (fallbackWarningPrinted) {
    return;
  }

  fallbackWarningPrinted = true;
  const message = error instanceof Error ? error.message : 'Unknown SQLite startup error';
  console.warn(
    `${STORAGE_ENGINE_FALLBACK_PREFIX} SQLite unavailable, using localStorage fallback. Reason: ${message}`
  );
};

const getSqliteConnection = (): SQLiteConnection => {
  if (!sqliteConnection) {
    sqliteConnection = new SQLiteConnection(CapacitorSQLite);
  }
  return sqliteConnection;
};

const ensureMetaTable = async (db: SQLiteDBConnection): Promise<void> => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${META_TABLE} (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
};

const getSchemaVersion = async (db: SQLiteDBConnection): Promise<number> => {
  const response = await db.query(`SELECT value FROM ${META_TABLE} WHERE key = ? LIMIT 1;`, [
    SCHEMA_VERSION_KEY,
  ]);
  const row = response.values?.[0] as { value?: string } | undefined;
  const parsed = Number(row?.value ?? '0');
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const setSchemaVersion = async (db: SQLiteDBConnection, version: number): Promise<void> => {
  await db.run(
    `
      INSERT INTO ${META_TABLE} (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value;
    `,
    [SCHEMA_VERSION_KEY, String(version)]
  );
};

const migrateToV1 = async (db: SQLiteDBConnection): Promise<void> => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${STATE_TABLE} (
      key TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_app_state_updated_at
      ON ${STATE_TABLE} (updated_at);
  `);
};

const runSchemaMigrations = async (db: SQLiteDBConnection): Promise<void> => {
  await ensureMetaTable(db);
  let version = await getSchemaVersion(db);

  if (version > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported schema version ${String(version)}. Expected <= ${String(
        CURRENT_SCHEMA_VERSION
      )}.`
    );
  }

  if (version < 1) {
    await migrateToV1(db);
    version = 1;
    await setSchemaVersion(db, version);
  }

  activeSchemaVersion = version;
};

const connectSqliteDatabase = async (): Promise<SQLiteDBConnection> => {
  const sqlite = getSqliteConnection();
  const consistency = await sqlite.checkConnectionsConsistency();
  const existing = await sqlite.isConnection(DATABASE_NAME, false);
  const db =
    consistency.result && existing.result
      ? await sqlite.retrieveConnection(DATABASE_NAME, false)
      : await sqlite.createConnection(DATABASE_NAME, false, 'no-encryption', DATABASE_VERSION, false);

  await db.open();
  await runSchemaMigrations(db);
  return db;
};

const initializePersistence = async (): Promise<void> => {
  if (!isNativeRuntime()) {
    activeEngine = 'localStorage';
    activeSchemaVersion = 0;
    return;
  }

  try {
    sqliteDatabase = await connectSqliteDatabase();
    activeEngine = 'sqlite';
  } catch (error) {
    warnAndFallbackToLocalStorage(error);
  }
};

const ensureInitialized = async (): Promise<void> => {
  if (!initializationPromise) {
    initializationPromise = initializePersistence();
  }
  await initializationPromise;
};

const readSqliteRaw = async (key: string): Promise<string | null> => {
  if (!sqliteDatabase) {
    return null;
  }
  const response = await sqliteDatabase.query(
    `SELECT payload FROM ${STATE_TABLE} WHERE key = ? LIMIT 1;`,
    [key]
  );
  const row = response.values?.[0] as { payload?: string } | undefined;
  return typeof row?.payload === 'string' ? row.payload : null;
};

const writeSqliteRaw = async (key: string, payload: string): Promise<void> => {
  if (!sqliteDatabase) {
    return;
  }

  await sqliteDatabase.run(
    `
      INSERT INTO ${STATE_TABLE} (key, payload, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at;
    `,
    [key, payload, new Date().toISOString()]
  );
};

const removeSqliteValue = async (key: string): Promise<void> => {
  if (!sqliteDatabase) {
    return;
  }
  await sqliteDatabase.run(`DELETE FROM ${STATE_TABLE} WHERE key = ?;`, [key]);
};

export const loadPersistedState = async <T>(key: string): Promise<T | null> => {
  await ensureInitialized();

  if (activeEngine === 'sqlite') {
    try {
      const raw = await readSqliteRaw(key);
      if (raw) {
        return parseJsonPayload<T>(raw);
      }

      // One-time lazy migration path from legacy localStorage into SQLite.
      const localFallback = readLocalStorageRaw(key);
      if (localFallback) {
        await writeSqliteRaw(key, localFallback);
        return parseJsonPayload<T>(localFallback);
      }
      return null;
    } catch (error) {
      warnAndFallbackToLocalStorage(error);
    }
  }

  return parseJsonPayload<T>(readLocalStorageRaw(key));
};

export const savePersistedState = async <T>(key: string, value: T): Promise<void> => {
  const payload = JSON.stringify(value);

  // Keep local copy as a safety mirror for fallback/recovery.
  writeLocalStorageRaw(key, payload);

  await ensureInitialized();
  if (activeEngine !== 'sqlite') {
    return;
  }

  try {
    await writeSqliteRaw(key, payload);
  } catch (error) {
    warnAndFallbackToLocalStorage(error);
  }
};

export const removePersistedState = async (key: string): Promise<void> => {
  removeLocalStorageValue(key);

  await ensureInitialized();
  if (activeEngine !== 'sqlite') {
    return;
  }

  try {
    await removeSqliteValue(key);
  } catch (error) {
    warnAndFallbackToLocalStorage(error);
  }
};

export const getPersistenceDiagnostics = async (): Promise<{
  engine: PersistenceEngine;
  schemaVersion: number;
}> => {
  await ensureInitialized();
  return {
    engine: activeEngine,
    schemaVersion: activeSchemaVersion,
  };
};
