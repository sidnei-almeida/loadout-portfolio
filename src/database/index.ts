/**
 * Database initialisation and lifecycle for the Loadout local-first app.
 *
 * Uses @op-engineering/op-sqlite (JSI-based, fastest SQLite for RN).
 * Call `initDatabase()` once at app startup (before any repo call).
 * After that, import `getDb()` from anywhere to get the open handle.
 */

import { open, type DB } from '@op-engineering/op-sqlite';
import { DB_NAME, SCHEMA_VERSION, SCHEMA_STATEMENTS, MIGRATION_V1_TO_V2 } from './schema';
import { logger } from '../utils/logger';

let _db: DB | null = null;

/**
 * Generates a random UUID v4 string for use as primary key.
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns the singleton database handle.
 * Throws if called before `initDatabase()`.
 */
export function getDb(): DB {
  if (!_db) {
    throw new Error(
      '[DB] Database not initialised. Call initDatabase() first.',
    );
  }
  return _db;
}

/**
 * Opens (or creates) the SQLite database file, runs any pending
 * migrations, and stores the handle for `getDb()`.
 *
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export async function initDatabase(): Promise<void> {
  if (_db) {
    return;
  }

  logger.log('[DB] Opening database…');
  _db = open({ name: DB_NAME });

  const currentVersion = getSchemaVersion();

  if (currentVersion < SCHEMA_VERSION) {
    logger.log(
      `[DB] Schema upgrade: v${currentVersion} → v${SCHEMA_VERSION}`,
    );
    if (currentVersion === 1 && SCHEMA_VERSION === 2) {
      runMigrationV1ToV2();
    } else {
      applySchema();
    }
    setSchemaVersion(SCHEMA_VERSION);
  } else {
    _db.executeSync('PRAGMA journal_mode = WAL;');
    _db.executeSync('PRAGMA foreign_keys = ON;');
  }

  logger.log('[DB] Ready');
}

/**
 * Closes the database. Call on app shutdown if needed.
 */
export function closeDatabase(): void {
  if (_db) {
    _db.close();
    _db = null;
    logger.log('[DB] Closed');
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function applySchema(): void {
  if (!_db) {
    return;
  }

  for (const sql of SCHEMA_STATEMENTS) {
    _db.executeSync(sql);
  }
}

function runMigrationV1ToV2(): void {
  if (!_db) {
    return;
  }
  for (const sql of MIGRATION_V1_TO_V2) {
    try {
      _db.executeSync(sql);
      logger.log(`[DB] Migration: ${sql.substring(0, 60)}...`);
    } catch (err) {
      logger.error('[DB] Migration failed:', err);
      throw err;
    }
  }
}

function getSchemaVersion(): number {
  if (!_db) {
    return 0;
  }

  try {
    const tableCheck = _db.executeSync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='_meta';",
    );
    if (!tableCheck.rows || tableCheck.rows.length === 0) {
      return 0;
    }

    const result = _db.executeSync(
      "SELECT value FROM _meta WHERE key = 'schema_version';",
    );
    if (result.rows && result.rows.length > 0) {
      return Number(result.rows[0].value) || 0;
    }
  } catch {
    return 0;
  }

  return 0;
}

function setSchemaVersion(version: number): void {
  if (!_db) {
    return;
  }

  _db.executeSync(
    `INSERT OR REPLACE INTO _meta (key, value) VALUES ('schema_version', ?);`,
    [String(version)],
  );
}
