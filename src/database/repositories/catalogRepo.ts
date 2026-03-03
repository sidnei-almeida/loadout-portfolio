/**
 * Repository for the `skin_catalog` table.
 *
 * The catalog is a local cache of skin metadata (images, rarity, price).
 * It is populated from two sources:
 *   1. Inventory sync  → provides icon_url, image_url_hd, rarity_color
 *   2. Price refresh    → provides current_price
 *
 * The upsert logic is intentionally "non-destructive": empty/zero incoming
 * values never overwrite existing good data (see ON CONFLICT clause).
 */

import { getDb } from '../index';
import { logger } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkinCatalogInput {
  market_hash_name: string;
  icon_url?: string;
  image_url_hd?: string;
  current_price?: number;
  rarity_color?: string;
  category?: string;
}

export interface SkinCatalogRow {
  market_hash_name: string;
  icon_url: string;
  image_url_hd: string;
  current_price: number;
  rarity_color: string;
  category: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------

const UPSERT_SQL = `
INSERT INTO skin_catalog
  (market_hash_name, icon_url, image_url_hd, current_price, rarity_color, category, updated_at)
VALUES
  (?, ?, ?, ?, ?, ?, datetime('now'))
ON CONFLICT(market_hash_name) DO UPDATE SET
  icon_url     = CASE WHEN excluded.icon_url     != '' THEN excluded.icon_url     ELSE skin_catalog.icon_url     END,
  image_url_hd = CASE WHEN excluded.image_url_hd != '' THEN excluded.image_url_hd ELSE skin_catalog.image_url_hd END,
  current_price= CASE WHEN excluded.current_price >  0 THEN excluded.current_price ELSE skin_catalog.current_price END,
  rarity_color = CASE WHEN excluded.rarity_color  != '' THEN excluded.rarity_color  ELSE skin_catalog.rarity_color  END,
  category     = CASE WHEN excluded.category != '' AND excluded.category != 'Other'
                      THEN excluded.category ELSE skin_catalog.category END,
  updated_at   = datetime('now');
`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Inserts or updates a single skin in the catalog.
 */
export function upsertSkin(skin: SkinCatalogInput): void {
  try {
    const db = getDb();
    db.executeSync(UPSERT_SQL, [
      skin.market_hash_name,
      skin.icon_url ?? '',
      skin.image_url_hd ?? '',
      skin.current_price ?? 0,
      skin.rarity_color ?? '',
      skin.category ?? 'Other',
    ]);
  } catch (error) {
    logger.error('[catalogRepo] upsertSkin failed:', error);
    throw error;
  }
}

/**
 * Batch-upserts multiple skins inside a single transaction.
 */
export function upsertSkins(skins: SkinCatalogInput[]): void {
  if (skins.length === 0) {
    return;
  }

  const db = getDb();
  try {
    db.executeSync('BEGIN TRANSACTION;');

    for (const skin of skins) {
      db.executeSync(UPSERT_SQL, [
        skin.market_hash_name,
        skin.icon_url ?? '',
        skin.image_url_hd ?? '',
        skin.current_price ?? 0,
        skin.rarity_color ?? '',
        skin.category ?? 'Other',
      ]);
    }

    db.executeSync('COMMIT;');
  } catch (error) {
    db.executeSync('ROLLBACK;');
    logger.error('[catalogRepo] upsertSkins failed:', error);
    throw error;
  }
}

/**
 * Updates only the price for a single skin (used by price fetcher).
 */
export function updatePrice(marketHashName: string, price: number): void {
  try {
    const db = getDb();
    db.executeSync(
      `UPDATE skin_catalog
         SET current_price = ?, updated_at = datetime('now')
       WHERE market_hash_name = ?;`,
      [price, marketHashName],
    );
  } catch (error) {
    logger.error('[catalogRepo] updatePrice failed:', error);
    throw error;
  }
}

/**
 * Batch-updates prices inside a single transaction.
 */
export function updatePrices(
  items: { market_hash_name: string; price: number }[],
): void {
  if (items.length === 0) {
    return;
  }

  const db = getDb();
  try {
    db.executeSync('BEGIN TRANSACTION;');

    for (const item of items) {
      db.executeSync(
        `UPDATE skin_catalog
           SET current_price = ?, updated_at = datetime('now')
         WHERE market_hash_name = ?;`,
        [item.price, item.market_hash_name],
      );
    }

    db.executeSync('COMMIT;');
  } catch (error) {
    db.executeSync('ROLLBACK;');
    logger.error('[catalogRepo] updatePrices failed:', error);
    throw error;
  }
}

/**
 * Returns a single skin by market_hash_name, or null.
 */
export function getSkin(marketHashName: string): SkinCatalogRow | null {
  try {
    const db = getDb();
    const result = db.executeSync(
      'SELECT * FROM skin_catalog WHERE market_hash_name = ?;',
      [marketHashName],
    );
    return (result.rows?.[0] as SkinCatalogRow) ?? null;
  } catch (error) {
    logger.error('[catalogRepo] getSkin failed:', error);
    return null;
  }
}

/**
 * Returns every skin in the catalog (useful for populating pickers).
 */
export function getCatalog(): SkinCatalogRow[] {
  try {
    const db = getDb();
    const result = db.executeSync(
      'SELECT * FROM skin_catalog ORDER BY current_price DESC;',
    );
    return (result.rows as SkinCatalogRow[]) ?? [];
  } catch (error) {
    logger.error('[catalogRepo] getCatalog failed:', error);
    return [];
  }
}
