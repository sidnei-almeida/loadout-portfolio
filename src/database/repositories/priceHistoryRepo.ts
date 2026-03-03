/**
 * Repository for the `price_history` table.
 *
 * Stores daily price+volume time-series data fetched client-side from
 * the Steam Community Market.  The UNIQUE(market_hash_name, recorded_at)
 * constraint lets us safely use INSERT OR IGNORE for idempotent batch loads.
 */

import { getDb } from '../index';
import { logger } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Single data-point to insert (already parsed from Steam's raw format). */
export interface PricePointInput {
  market_hash_name: string;
  price: number;
  volume: number;
  /** ISO-8601 date string, e.g. "2024-12-13" */
  recorded_at: string;
}

/** Row returned by getPriceHistory(). */
export interface PricePointRow {
  price: number;
  volume: number;
  recorded_at: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Batch-inserts price history points.  Duplicate (market_hash_name + date)
 * rows are silently skipped thanks to INSERT OR IGNORE.
 *
 * @returns Number of new rows actually inserted.
 */
export function insertPriceBatch(points: PricePointInput[]): number {
  if (points.length === 0) {
    return 0;
  }

  const db = getDb();
  let inserted = 0;

  try {
    db.executeSync('BEGIN TRANSACTION;');

    for (const p of points) {
      const result = db.executeSync(
        `INSERT OR IGNORE INTO price_history
           (market_hash_name, price, volume, recorded_at)
         VALUES (?, ?, ?, ?);`,
        [p.market_hash_name, p.price, p.volume, p.recorded_at],
      );
      inserted += result.rowsAffected ?? 0;
    }

    db.executeSync('COMMIT;');
    return inserted;
  } catch (error) {
    db.executeSync('ROLLBACK;');
    logger.error('[priceHistoryRepo] insertPriceBatch failed:', error);
    throw error;
  }
}

/**
 * Returns the price time-series for a given skin within the last N days.
 * Ordered oldest → newest (ready for chart rendering).
 */
export function getPriceHistory(
  marketHashName: string,
  days: number = 30,
): PricePointRow[] {
  try {
    const db = getDb();
    const result = db.executeSync(
      `SELECT price, volume, recorded_at
       FROM price_history
       WHERE market_hash_name = ?
         AND recorded_at >= date('now', '-' || ? || ' days')
       ORDER BY recorded_at ASC;`,
      [marketHashName, days],
    );
    return (result.rows as PricePointRow[]) ?? [];
  } catch (error) {
    logger.error('[priceHistoryRepo] getPriceHistory failed:', error);
    return [];
  }
}

/**
 * Returns the most recent price point for a skin, or null.
 */
export function getLatestPrice(
  marketHashName: string,
): PricePointRow | null {
  try {
    const db = getDb();
    const result = db.executeSync(
      `SELECT price, volume, recorded_at
       FROM price_history
       WHERE market_hash_name = ?
       ORDER BY recorded_at DESC
       LIMIT 1;`,
      [marketHashName],
    );
    return (result.rows?.[0] as PricePointRow) ?? null;
  } catch (error) {
    logger.error('[priceHistoryRepo] getLatestPrice failed:', error);
    return null;
  }
}

/**
 * Returns all price points within the last N days for a list of skins.
 * Useful for portfolio-wide analytics (volatility, trend projection).
 */
export function getBulkPriceHistory(
  marketHashNames: string[],
  days: number = 30,
): { market_hash_name: string; price: number; volume: number; recorded_at: string }[] {
  if (marketHashNames.length === 0) {
    return [];
  }

  try {
    const db = getDb();
    const placeholders = marketHashNames.map(() => '?').join(',');
    const result = db.executeSync(
      `SELECT market_hash_name, price, volume, recorded_at
       FROM price_history
       WHERE market_hash_name IN (${placeholders})
         AND recorded_at >= date('now', '-' || ? || ' days')
       ORDER BY market_hash_name, recorded_at ASC;`,
      [...marketHashNames, days],
    );
    return (result.rows as any[]) ?? [];
  } catch (error) {
    logger.error('[priceHistoryRepo] getBulkPriceHistory failed:', error);
    return [];
  }
}

/**
 * Deletes history older than N days to prevent unbounded DB growth.
 * Call periodically (e.g. on app startup or after a sync).
 *
 * @returns Number of rows deleted.
 */
export function pruneOldHistory(keepDays: number = 365): number {
  try {
    const db = getDb();
    const result = db.executeSync(
      `DELETE FROM price_history
       WHERE recorded_at < date('now', '-' || ? || ' days');`,
      [keepDays],
    );
    const deleted = result.rowsAffected ?? 0;
    if (deleted > 0) {
      logger.log(`[priceHistoryRepo] Pruned ${deleted} old price rows`);
    }
    return deleted;
  } catch (error) {
    logger.error('[priceHistoryRepo] pruneOldHistory failed:', error);
    return 0;
  }
}
