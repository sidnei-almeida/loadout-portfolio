/**
 * Repository for `portfolio_snapshots` + `snapshot_items` tables.
 *
 * A snapshot is an immutable, frozen-in-time picture of the portfolio.
 * Creating one is an atomic operation (header + N items) — if any part
 * fails the whole thing rolls back.
 *
 * The ON DELETE CASCADE on snapshot_items.snapshot_id means deleting
 * a snapshot automatically cleans up its children.
 */

import { getDb, generateId } from '../index';
import { logger } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateSnapshotInput {
  description: string;
  icon?: string;
  total_value: number;
  total_invested: number;
  item_count: number;
}

export interface SnapshotItemInput {
  market_hash_name: string;
  original_price: number;
  quantity: number;
}

/** Lightweight row for the snapshots list screen. */
export interface SnapshotRow {
  id: string;
  snapshot_date: string;
  total_value: number;
  total_invested: number;
  item_count: number;
  description: string | null;
  icon: string;
}

/** Enriched item row returned inside snapshot details (joined with catalog). */
export interface SnapshotItemDetailRow {
  market_hash_name: string;
  original_price: number;
  quantity: number;
  current_price: number;
  icon_url: string;
  image_url_hd: string;
  rarity_color: string;
  category: string;
}

export interface SnapshotDetail {
  snapshot: SnapshotRow;
  items: SnapshotItemDetailRow[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Creates a snapshot with its items in a single ACID transaction.
 *
 * 1. INSERT into portfolio_snapshots (header)
 * 2. INSERT N rows into snapshot_items
 * 3. COMMIT — or ROLLBACK if anything fails
 *
 * @returns The generated snapshot id.
 */
export function createSnapshot(
  data: CreateSnapshotInput,
  items: SnapshotItemInput[],
): string {
  const db = getDb();
  const snapshotId = generateId();

  try {
    db.executeSync('BEGIN TRANSACTION;');

    // 1) Header
    db.executeSync(
      `INSERT INTO portfolio_snapshots
         (id, snapshot_date, total_value, total_invested, item_count, description, icon)
       VALUES (?, datetime('now'), ?, ?, ?, ?, ?);`,
      [
        snapshotId,
        data.total_value,
        data.total_invested,
        data.item_count,
        data.description,
        data.icon ?? 'target',
      ],
    );

    // 2) Items
    for (const item of items) {
      db.executeSync(
        `INSERT INTO snapshot_items
           (id, snapshot_id, market_hash_name, original_price, quantity)
         VALUES (?, ?, ?, ?, ?);`,
        [
          generateId(),
          snapshotId,
          item.market_hash_name,
          item.original_price,
          item.quantity,
        ],
      );
    }

    db.executeSync('COMMIT;');

    logger.log(
      `[snapshotRepo] Created snapshot ${snapshotId}: ` +
      `$${data.total_value.toFixed(2)}, ${items.length} unique skins`,
    );

    return snapshotId;
  } catch (error) {
    db.executeSync('ROLLBACK;');
    logger.error('[snapshotRepo] createSnapshot failed:', error);
    throw error;
  }
}

/**
 * Lists all snapshots, most recent first.
 * Only returns the header data (no items) — used for the list screen.
 */
export function getSnapshots(): SnapshotRow[] {
  try {
    const db = getDb();
    const result = db.executeSync(
      `SELECT id, snapshot_date, total_value, total_invested,
              item_count, description, icon
       FROM portfolio_snapshots
       ORDER BY snapshot_date DESC;`,
    );
    return (result.rows as SnapshotRow[]) ?? [];
  } catch (error) {
    logger.error('[snapshotRepo] getSnapshots failed:', error);
    return [];
  }
}

/**
 * Returns a single snapshot header + its items enriched with current
 * catalog data (current_price, images, rarity).
 *
 * The JOIN brings live catalog metadata while preserving the
 * `original_price` that was frozen at snapshot-creation time.
 */
export function getSnapshotDetails(
  snapshotId: string,
): SnapshotDetail | null {
  try {
    const db = getDb();

    // ---- Header ----
    const headerResult = db.executeSync(
      `SELECT id, snapshot_date, total_value, total_invested,
              item_count, description, icon
       FROM portfolio_snapshots
       WHERE id = ?;`,
      [snapshotId],
    );

    const snapshot = headerResult.rows?.[0] as SnapshotRow | undefined;
    if (!snapshot) {
      return null;
    }

    // ---- Items (joined with catalog for live metadata) ----
    const itemsResult = db.executeSync(
      `SELECT
         si.market_hash_name,
         si.original_price,
         si.quantity,
         COALESCE(c.current_price, 0)  AS current_price,
         COALESCE(c.icon_url, '')      AS icon_url,
         COALESCE(c.image_url_hd, '')  AS image_url_hd,
         COALESCE(c.rarity_color, '')  AS rarity_color,
         COALESCE(c.category, 'Other') AS category
       FROM snapshot_items si
       LEFT JOIN skin_catalog c
         ON si.market_hash_name = c.market_hash_name
       WHERE si.snapshot_id = ?
       ORDER BY (si.original_price * si.quantity) DESC;`,
      [snapshotId],
    );

    const items = (itemsResult.rows as SnapshotItemDetailRow[]) ?? [];

    return { snapshot, items };
  } catch (error) {
    logger.error('[snapshotRepo] getSnapshotDetails failed:', error);
    return null;
  }
}

/**
 * Deletes a snapshot by id.
 * Thanks to ON DELETE CASCADE, all related snapshot_items are removed
 * automatically by SQLite.
 *
 * @returns true if a row was actually deleted.
 */
export function deleteSnapshot(snapshotId: string): boolean {
  try {
    const db = getDb();
    const result = db.executeSync(
      'DELETE FROM portfolio_snapshots WHERE id = ?;',
      [snapshotId],
    );
    const deleted = (result.rowsAffected ?? 0) > 0;

    if (deleted) {
      logger.log(`[snapshotRepo] Deleted snapshot ${snapshotId}`);
    }

    return deleted;
  } catch (error) {
    logger.error('[snapshotRepo] deleteSnapshot failed:', error);
    return false;
  }
}

/**
 * Returns the raw snapshot_items for a given snapshot (no catalog join).
 * Useful for analytics computations that don't need images.
 */
export function getSnapshotItems(
  snapshotId: string,
): SnapshotItemInput[] {
  try {
    const db = getDb();
    const result = db.executeSync(
      `SELECT market_hash_name, original_price, quantity
       FROM snapshot_items
       WHERE snapshot_id = ?;`,
      [snapshotId],
    );
    return (result.rows as SnapshotItemInput[]) ?? [];
  } catch (error) {
    logger.error('[snapshotRepo] getSnapshotItems failed:', error);
    return [];
  }
}

/**
 * Returns the single most recent snapshot header, or null.
 * Handy for "last sync" indicators on the dashboard.
 */
export function getLatestSnapshot(): SnapshotRow | null {
  try {
    const db = getDb();
    const result = db.executeSync(
      `SELECT id, snapshot_date, total_value, total_invested,
              item_count, description, icon
       FROM portfolio_snapshots
       ORDER BY snapshot_date DESC
       LIMIT 1;`,
    );
    return (result.rows?.[0] as SnapshotRow) ?? null;
  } catch (error) {
    logger.error('[snapshotRepo] getLatestSnapshot failed:', error);
    return null;
  }
}
