/**
 * SQLite schema for the Loadout local-first database.
 *
 * Design principles:
 *  - Single-user: no user_id columns (the device IS the user).
 *  - TEXT for dates (ISO-8601) and UUIDs (SQLite has no native types).
 *  - INTEGER for booleans (0/1).
 *  - REAL for prices (IEEE-754 double — sufficient for market values).
 *  - Explicit indexes on every foreign-key and common WHERE clause.
 */

export const DB_NAME = 'loadout.db';

export const SCHEMA_VERSION = 2;

// Migration v1 → v2: Storage Unit support (is_storage_unit, storage_unit_item_count, custom_display_name)
export const MIGRATION_V1_TO_V2: string[] = [
  'ALTER TABLE inventory_items ADD COLUMN is_storage_unit INTEGER NOT NULL DEFAULT 0;',
  'ALTER TABLE inventory_items ADD COLUMN storage_unit_item_count INTEGER;',
  'ALTER TABLE inventory_items ADD COLUMN custom_display_name TEXT;',
];

// ---------------------------------------------------------------------------
// Table: skin_catalog
// ---------------------------------------------------------------------------
// Canonical cache of every skin the user has ever owned or viewed.
// Rows are upserted whenever a sync brings new descriptions from Steam.
// ---------------------------------------------------------------------------
const CREATE_SKIN_CATALOG = `
CREATE TABLE IF NOT EXISTS skin_catalog (
  market_hash_name  TEXT    PRIMARY KEY,
  icon_url          TEXT    NOT NULL DEFAULT '',
  image_url_hd      TEXT    NOT NULL DEFAULT '',
  current_price     REAL    NOT NULL DEFAULT 0,
  rarity_color      TEXT    NOT NULL DEFAULT '',
  category          TEXT    NOT NULL DEFAULT 'Other',
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);
`;

// ---------------------------------------------------------------------------
// Table: inventory_items
// ---------------------------------------------------------------------------
// One row per PHYSICAL item in the user's Steam inventory.
// If the user owns 3× AK-47 Redline, there are 3 rows with distinct asset_id.
// Quantity is computed at query time via COUNT/GROUP BY.
// ---------------------------------------------------------------------------
const CREATE_INVENTORY_ITEMS = `
CREATE TABLE IF NOT EXISTS inventory_items (
  id                        TEXT    PRIMARY KEY,
  asset_id                  TEXT    NOT NULL,
  market_hash_name          TEXT    NOT NULL,
  float_value               REAL,
  paint_seed                INTEGER,
  is_stattrak               INTEGER NOT NULL DEFAULT 0,
  acquired_at               TEXT    NOT NULL DEFAULT (datetime('now')),
  inspect_link              TEXT,
  is_storage_unit           INTEGER NOT NULL DEFAULT 0,
  storage_unit_item_count   INTEGER,
  custom_display_name      TEXT,

  FOREIGN KEY (market_hash_name) REFERENCES skin_catalog(market_hash_name)
    ON DELETE SET NULL
);
`;

const IDX_INVENTORY_MARKET = `
CREATE INDEX IF NOT EXISTS idx_inventory_market
  ON inventory_items(market_hash_name);
`;

const IDX_INVENTORY_ASSET = `
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_asset
  ON inventory_items(asset_id);
`;

// ---------------------------------------------------------------------------
// Table: price_history
// ---------------------------------------------------------------------------
// Daily price/volume for each skin. Populated by the client-side Steam
// Market fetcher. The UNIQUE constraint prevents duplicate days.
// ---------------------------------------------------------------------------
const CREATE_PRICE_HISTORY = `
CREATE TABLE IF NOT EXISTS price_history (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  market_hash_name  TEXT    NOT NULL,
  price             REAL    NOT NULL,
  volume            INTEGER NOT NULL DEFAULT 0,
  recorded_at       TEXT    NOT NULL,

  FOREIGN KEY (market_hash_name) REFERENCES skin_catalog(market_hash_name)
    ON DELETE CASCADE,

  UNIQUE (market_hash_name, recorded_at)
);
`;

const IDX_PRICE_HISTORY_LOOKUP = `
CREATE INDEX IF NOT EXISTS idx_price_history_lookup
  ON price_history(market_hash_name, recorded_at);
`;

// ---------------------------------------------------------------------------
// Table: portfolio_snapshots
// ---------------------------------------------------------------------------
// A frozen-in-time picture of the portfolio's value. Created manually by
// the user or automatically after each inventory refresh.
// ---------------------------------------------------------------------------
const CREATE_PORTFOLIO_SNAPSHOTS = `
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id              TEXT    PRIMARY KEY,
  snapshot_date   TEXT    NOT NULL DEFAULT (datetime('now')),
  total_value     REAL    NOT NULL DEFAULT 0,
  total_invested  REAL    NOT NULL DEFAULT 0,
  item_count      INTEGER NOT NULL DEFAULT 0,
  description     TEXT,
  icon            TEXT    NOT NULL DEFAULT 'target'
);
`;

const IDX_SNAPSHOTS_DATE = `
CREATE INDEX IF NOT EXISTS idx_snapshots_date
  ON portfolio_snapshots(snapshot_date);
`;

// ---------------------------------------------------------------------------
// Table: snapshot_items
// ---------------------------------------------------------------------------
// The items that belong to a snapshot. Aggregated per market_hash_name
// (unlike inventory_items which stores every physical copy).
// ---------------------------------------------------------------------------
const CREATE_SNAPSHOT_ITEMS = `
CREATE TABLE IF NOT EXISTS snapshot_items (
  id                TEXT    PRIMARY KEY,
  snapshot_id       TEXT    NOT NULL,
  market_hash_name  TEXT    NOT NULL,
  original_price    REAL    NOT NULL DEFAULT 0,
  quantity          INTEGER NOT NULL DEFAULT 1,

  FOREIGN KEY (snapshot_id) REFERENCES portfolio_snapshots(id)
    ON DELETE CASCADE,
  FOREIGN KEY (market_hash_name) REFERENCES skin_catalog(market_hash_name)
    ON DELETE SET NULL
);
`;

const IDX_SNAPSHOT_ITEMS_SNAPSHOT = `
CREATE INDEX IF NOT EXISTS idx_snapshot_items_snapshot
  ON snapshot_items(snapshot_id);
`;

const IDX_SNAPSHOT_ITEMS_MARKET = `
CREATE INDEX IF NOT EXISTS idx_snapshot_items_market
  ON snapshot_items(market_hash_name);
`;

// ---------------------------------------------------------------------------
// Internal: schema version tracking
// ---------------------------------------------------------------------------
const CREATE_META = `
CREATE TABLE IF NOT EXISTS _meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

// ---------------------------------------------------------------------------
// Ordered list of all DDL statements to run on first boot / migration.
// ---------------------------------------------------------------------------
export const SCHEMA_STATEMENTS: string[] = [
  // Pragmas (must run before any DDL)
  'PRAGMA journal_mode = WAL;',
  'PRAGMA foreign_keys = ON;',

  // Meta
  CREATE_META,

  // Tables
  CREATE_SKIN_CATALOG,
  CREATE_INVENTORY_ITEMS,
  CREATE_PRICE_HISTORY,
  CREATE_PORTFOLIO_SNAPSHOTS,
  CREATE_SNAPSHOT_ITEMS,

  // Indexes
  IDX_INVENTORY_MARKET,
  IDX_INVENTORY_ASSET,
  IDX_PRICE_HISTORY_LOOKUP,
  IDX_SNAPSHOTS_DATE,
  IDX_SNAPSHOT_ITEMS_SNAPSHOT,
  IDX_SNAPSHOT_ITEMS_MARKET,
];
