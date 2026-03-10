/**
 * Repository for the `inventory_items` table.
 *
 * Each row represents a single PHYSICAL item in the user's Steam inventory
 * (3× AK-47 Redline = 3 rows with different asset_ids).
 *
 * The main read method (`getInventory`) returns items **grouped** by
 * market_hash_name with a `quantity` column and catalog metadata via JOIN,
 * which is what the UI grid needs.  For per-copy details (float, seed)
 * use `getItemsByMarketName`.
 */

import { getDb, generateId } from '../index';
import { logger } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of items coming from the Steam inventory parser. */
export interface InventoryItemInput {
  asset_id: string;
  market_hash_name: string;
  float_value?: number | null;
  paint_seed?: number | null;
  is_stattrak?: boolean;
  inspect_link?: string | null;
  is_storage_unit?: boolean;
  storage_unit_item_count?: number | null;
  custom_display_name?: string | null;
}

/** Aggregated row returned by `getInventory()` — one per skin name (or per Storage Unit). */
export interface InventoryGroupedRow {
  market_hash_name: string;
  quantity: number;
  current_price: number;
  icon_url: string;
  image_url_hd: string;
  rarity_color: string;
  category: string;
  is_stattrak: number;
  asset_id?: string;
  is_storage_unit?: number;
  storage_unit_item_count?: number | null;
  custom_display_name?: string | null;
}

/** Raw individual item returned by `getItemsByMarketName()`. */
export interface InventoryItemRow {
  id: string;
  asset_id: string;
  market_hash_name: string;
  float_value: number | null;
  paint_seed: number | null;
  is_stattrak: number;
  acquired_at: string;
  inspect_link: string | null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Full-replace of the inventory: deletes every existing row and inserts
 * the new set from Steam.  Runs inside a single transaction so the user
 * never sees a partially-empty inventory.
 *
 * @returns Number of items inserted.
 */
export function replaceInventory(items: InventoryItemInput[]): number {
  const db = getDb();

  try {
    db.executeSync('BEGIN TRANSACTION;');

    db.executeSync('DELETE FROM inventory_items;');

    for (const item of items) {
      db.executeSync(
        `INSERT INTO inventory_items
           (id, asset_id, market_hash_name, float_value, paint_seed, is_stattrak, inspect_link,
            is_storage_unit, storage_unit_item_count, custom_display_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          generateId(),
          item.asset_id,
          item.market_hash_name,
          item.float_value ?? null,
          item.paint_seed ?? null,
          item.is_stattrak ? 1 : 0,
          item.inspect_link ?? null,
          item.is_storage_unit ? 1 : 0,
          item.storage_unit_item_count ?? null,
          item.custom_display_name ?? null,
        ],
      );
    }

    db.executeSync('COMMIT;');
    logger.log(`[inventoryRepo] Replaced inventory: ${items.length} items`);
    return items.length;
  } catch (error) {
    db.executeSync('ROLLBACK;');
    logger.error('[inventoryRepo] replaceInventory failed:', error);
    throw error;
  }
}

/**
 * Returns inventory items **grouped by skin** with quantity and catalog
 * metadata.  This is the primary data source for the Inventory screen grid.
 *
 * Ordered by total line value (quantity × price) descending.
 */
export function getInventory(): InventoryGroupedRow[] {
  try {
    const db = getDb();
    const result = db.executeSync(`
      SELECT
        i.market_hash_name,
        COUNT(*)                             AS quantity,
        COALESCE(c.current_price, 0)         AS current_price,
        COALESCE(c.icon_url, '')             AS icon_url,
        COALESCE(c.image_url_hd, '')         AS image_url_hd,
        COALESCE(c.rarity_color, '')         AS rarity_color,
        COALESCE(c.category, 'Other')        AS category,
        MAX(i.is_stattrak)                   AS is_stattrak,
        MAX(i.asset_id)                     AS asset_id,
        MAX(i.is_storage_unit)               AS is_storage_unit,
        MAX(i.storage_unit_item_count)       AS storage_unit_item_count,
        MAX(i.custom_display_name)           AS custom_display_name
      FROM inventory_items i
      LEFT JOIN skin_catalog c
        ON i.market_hash_name = c.market_hash_name
      GROUP BY i.market_hash_name,
               COALESCE(CASE WHEN i.is_storage_unit = 1 THEN i.asset_id END, '')
      ORDER BY (COUNT(*) * COALESCE(c.current_price, 0)) DESC;
    `);
    return (result.rows as InventoryGroupedRow[]) ?? [];
  } catch (error) {
    logger.error('[inventoryRepo] getInventory failed:', error);
    return [];
  }
}

/**
 * Returns every individual copy of a given skin (for the item-detail view
 * where the user can see float value, paint seed, etc.).
 */
export function getItemsByMarketName(
  marketHashName: string,
): InventoryItemRow[] {
  try {
    const db = getDb();
    const result = db.executeSync(
      `SELECT * FROM inventory_items
       WHERE market_hash_name = ?
       ORDER BY float_value ASC;`,
      [marketHashName],
    );
    return (result.rows as InventoryItemRow[]) ?? [];
  } catch (error) {
    logger.error('[inventoryRepo] getItemsByMarketName failed:', error);
    return [];
  }
}

/**
 * Quick count of total individual items in the inventory.
 */
export function getItemCount(): number {
  try {
    const db = getDb();
    const result = db.executeSync('SELECT COUNT(*) AS cnt FROM inventory_items;');
    return (result.rows?.[0]?.cnt as number) ?? 0;
  } catch (error) {
    logger.error('[inventoryRepo] getItemCount failed:', error);
    return 0;
  }
}

/**
 * Returns the sum of all items' current prices (from catalog).
 * Useful for quick portfolio total without a full getInventory() call.
 */
export function getTotalValue(): number {
  try {
    const db = getDb();
    const result = db.executeSync(`
      SELECT COALESCE(SUM(c.current_price), 0) AS total
      FROM inventory_items i
      LEFT JOIN skin_catalog c
        ON i.market_hash_name = c.market_hash_name;
    `);
    return (result.rows?.[0]?.total as number) ?? 0;
  } catch (error) {
    logger.error('[inventoryRepo] getTotalValue failed:', error);
    return 0;
  }
}
