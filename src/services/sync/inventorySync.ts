/**
 * Inventory Sync — fetches the user's CS2 inventory directly from
 * Steam Community and persists it locally.
 *
 * Steam's inventory endpoint returns two separate arrays:
 *   • `assets`       — individual item instances (assetid, classid, instanceid)
 *   • `descriptions` — shared metadata keyed by (classid + instanceid)
 *
 * The merge step joins these two arrays to produce the data we need for
 * both `skin_catalog` (metadata: image, rarity, category) and
 * `inventory_items` (per-copy rows: asset_id, market_hash_name, float, etc.).
 */

import { replaceInventory } from '../../database/repositories/inventoryRepo';
import { upsertSkins } from '../../database/repositories/catalogRepo';
import type { InventoryItemInput } from '../../database/repositories/inventoryRepo';
import type { SkinCatalogInput } from '../../database/repositories/catalogRepo';
import {
  isInventoryOnCooldown,
  getInventoryCooldownRemaining,
  registerInventorySync,
  formatCooldown,
} from './cooldownManager';
import { storage } from '../storage';
import { extractCookies } from './steamCookies';
import { logger } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Types — raw shapes returned by Steam's JSON API
// ---------------------------------------------------------------------------

interface SteamAsset {
  appid: number;
  contextid: string;
  assetid: string;
  classid: string;
  instanceid: string;
  amount: string;
}

interface SteamTag {
  category: string;
  internal_name: string;
  localized_category_name: string;
  localized_tag_name: string;
  color?: string;
}

interface SteamDescription {
  appid: number;
  classid: string;
  instanceid: string;
  market_hash_name: string;
  market_name: string;
  icon_url: string;
  icon_url_large?: string;
  tags?: SteamTag[];
  actions?: Array<{ link: string; name: string }>;
  type?: string;
  tradable?: number;
  marketable?: number;
  /** Nested descriptions (e.g. "Number of items: 42") */
  descriptions?: Array<{ value?: string; type?: string }>;
  fraudwarnings?: string[];
}

interface SteamInventoryPage {
  assets?: SteamAsset[];
  descriptions?: SteamDescription[];
  more_items?: number | boolean;
  last_assetid?: string;
  total_inventory_count?: number;
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface InventorySyncResult {
  itemsSynced: number;
  uniqueSkins: number;
  pages: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 2000;
const PAGE_DELAY_MS = 2000;
const STEAM_CDN = 'https://community.akamai.steamstatic.com/economy/image/';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ---------------------------------------------------------------------------
// Storage Unit helpers (robust parsing, fallbacks)
// ---------------------------------------------------------------------------

function isStorageUnit(name: string | undefined): boolean {
  return (name?.toLowerCase().includes('storage unit') ?? false);
}

/** Extract item count from descriptions array. Returns null if not found. */
function extractItemCount(desc: SteamDescription): number | null {
  try {
    const values = desc.descriptions
      ?.map(d => d?.value)
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
      ?? [];
    const text = values.join(' ');
    // Patterns: "Number of items: 42", "42 items", "Items: 42"
    const m = text.match(/\b(?:number\s+of\s+items?|items?)\s*:?\s*(\d+)/i)
      ?? text.match(/(\d+)\s*items?\b/i);
    if (m?.[1]) {
      const n = parseInt(m[1], 10);
      return Number.isNaN(n) ? null : n;
    }
    return null;
  } catch {
    return null;
  }
}

/** Extract custom display name from fraudwarnings or market_name. */
function extractCustomName(desc: SteamDescription): string | null {
  try {
    const fraud = desc.fraudwarnings ?? [];
    for (const entry of fraud) {
      const msg = typeof entry === 'string' ? entry : (entry as { message?: string; value?: string })?.message ?? (entry as { message?: string; value?: string })?.value ?? '';
      if (typeof msg !== 'string' || !msg) continue;
      const m = msg.match(/renamed\s+to\s+["']([^"']+)["']/i);
      if (m?.[1]?.trim()) return m[1].trim();
    }
    const mn = desc.market_name?.trim();
    if (mn && mn !== 'Storage Unit' && mn.length > 0) return mn;
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main entry-point
// ---------------------------------------------------------------------------

/**
 * Fetches the full CS2 inventory from Steam and saves it locally.
 *
 * @param steamId  64-bit Steam ID.
 * @throws if on cooldown, cookies are missing, or Steam returns an error.
 */
export async function syncInventory(steamId: string): Promise<InventorySyncResult> {
  // ---- 1. Cooldown gate ----
  if (isInventoryOnCooldown()) {
    const remaining = formatCooldown(getInventoryCooldownRemaining());
    throw new Error(`COOLDOWN:Wait ${remaining} before syncing again.`);
  }

  // ---- 2. Extract cookies from the shared WebView cookie jar ----
  const { sessionId, steamLoginSecure } = await extractCookies();
  const cookieHeader = `sessionid=${sessionId}; steamLoginSecure=${steamLoginSecure}`;

  logger.log(`[inventorySync] Cookie header length: ${cookieHeader.length}, sessionId length: ${sessionId.length}`);

  // ---- 3. Paginated fetch ----
  const allAssets: SteamAsset[] = [];
  const allDescriptions: SteamDescription[] = [];
  let startAssetId: string | null = null;
  let page = 0;

  while (true) {
    page++;
    const url = buildInventoryUrl(steamId, startAssetId);

    logger.log(`[inventorySync] Fetching: ${url.substring(0, 80)}...`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
        'User-Agent': USER_AGENT,
        Accept: 'application/json, text/javascript, */*; q=0.01',
        Referer: `https://steamcommunity.com/profiles/${steamId}/inventory/`,
      },
    });

    logger.log(`[inventorySync] HTTP ${response.status} (${response.statusText})`);

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Inventory is private or cookies are invalid (HTTP 403).');
      }
      if (response.status === 429) {
        throw new Error('Steam rate limit reached. Please wait a few minutes.');
      }
      const body = await response.text().catch(() => '');
      logger.error(`[inventorySync] Error body: ${body.substring(0, 200)}`);
      throw new Error(`Steam returned HTTP ${response.status}`);
    }

    const rawText = await response.text();
    let data: SteamInventoryPage;
    try {
      data = JSON.parse(rawText);
    } catch {
      logger.error(`[inventorySync] Invalid JSON response: ${rawText.substring(0, 200)}`);
      throw new Error('Steam returned invalid JSON. The session may have expired.');
    }

    if (data.assets) { allAssets.push(...data.assets); }
    if (data.descriptions) { allDescriptions.push(...data.descriptions); }

    logger.log(
      `[inventorySync] Page ${page}: +${data.assets?.length ?? 0} assets, ` +
      `total so far: ${allAssets.length}`,
    );

    const hasMore = data.more_items === 1 || data.more_items === true;
    if (hasMore && data.last_assetid) {
      startAssetId = data.last_assetid;
      await sleep(PAGE_DELAY_MS);
    } else {
      break;
    }
  }

  if (allAssets.length === 0) {
    throw new Error('No items found in inventory.');
  }

  // ---- 4. Merge assets × descriptions ----
  const { inventoryItems, catalogEntries } = mergeAssetsAndDescriptions(
    allAssets,
    allDescriptions,
  );

  // ---- 5. Persist locally ----
  upsertSkins(catalogEntries);
  const synced = replaceInventory(inventoryItems);

  // ---- 6. Register cooldown only if we actually saved items ----
  if (synced > 0) {
    registerInventorySync();
  }

  logger.log(
    `[inventorySync] Done: ${synced} items, ${catalogEntries.length} catalog entries, ${page} pages`,
  );

  return {
    itemsSynced: synced,
    uniqueSkins: catalogEntries.length,
    pages: page,
  };
}

// ---------------------------------------------------------------------------
// Merge logic — the critical join between assets and descriptions
// ---------------------------------------------------------------------------

/**
 * Steam returns items in two separate arrays:
 *
 *  `assets` = [{ assetid, classid, instanceid, ... }]   ← one per physical copy
 *  `descriptions` = [{ classid, instanceid, market_hash_name, icon_url, tags, ... }]
 *                                                        ← one per unique skin
 *
 * The join key is the composite `classid + "_" + instanceid`.
 *
 * For each asset we look up its matching description to obtain the
 * market_hash_name, images, rarity colour, category, and inspect link.
 *
 * Returns two arrays:
 *  - `inventoryItems`  → one row per physical copy  (→ inventory_items table)
 *  - `catalogEntries`  → one row per unique skin     (→ skin_catalog table)
 */
function mergeAssetsAndDescriptions(
  assets: SteamAsset[],
  descriptions: SteamDescription[],
): {
  inventoryItems: InventoryItemInput[];
  catalogEntries: SkinCatalogInput[];
} {
  // Build a lookup map: "classid_instanceid" → SteamDescription
  const descMap = new Map<string, SteamDescription>();
  for (const desc of descriptions) {
    const key = `${desc.classid}_${desc.instanceid}`;
    descMap.set(key, desc);
  }

  const inventoryItems: InventoryItemInput[] = [];
  const catalogSeen = new Set<string>();
  const catalogEntries: SkinCatalogInput[] = [];

  for (const asset of assets) {
    const key = `${asset.classid}_${asset.instanceid}`;
    const desc = descMap.get(key);

    if (!desc) {
      logger.warn(`[inventorySync] Asset ${asset.assetid} has no matching description (key=${key})`);
      continue;
    }

    // ---- Extract tags ----
    const rarityTag = desc.tags?.find(
      t => t.category === 'Rarity' || t.category === 'Quality',
    );
    const categoryTag = desc.tags?.find(t => t.category === 'Type');
    const isStatTrak = desc.market_hash_name.startsWith('StatTrak');

    // ---- Extract inspect link (if present) ----
    let inspectLink: string | null = null;
    if (desc.actions?.length) {
      const inspectAction = desc.actions.find(a =>
        a.link?.includes('csgo_econ_action_preview'),
      );
      if (inspectAction) {
        inspectLink = inspectAction.link
          .replace('%owner_steamid%', '')
          .replace('%assetid%', asset.assetid);
      }
    }

    // ---- Build inventory row (one per physical copy) ----
    const baseItem: InventoryItemInput = {
      asset_id: asset.assetid,
      market_hash_name: desc.market_hash_name,
      is_stattrak: isStatTrak,
      inspect_link: inspectLink,
    };

    if (isStorageUnit(desc.market_hash_name)) {
      baseItem.is_storage_unit = true;
      baseItem.storage_unit_item_count = extractItemCount(desc);
      baseItem.custom_display_name = extractCustomName(desc);
    }

    inventoryItems.push(baseItem);

    // ---- Build catalog row (deduplicated per market_hash_name) ----
    if (!catalogSeen.has(desc.market_hash_name)) {
      catalogSeen.add(desc.market_hash_name);

      const iconUrl = desc.icon_url
        ? `${STEAM_CDN}${desc.icon_url}`
        : '';
      const imageUrlHd = desc.icon_url_large
        ? `${STEAM_CDN}${desc.icon_url_large}`
        : iconUrl;

      catalogEntries.push({
        market_hash_name: desc.market_hash_name,
        icon_url: iconUrl,
        image_url_hd: imageUrlHd,
        rarity_color: rarityTag?.color ? `#${rarityTag.color}` : '',
        category: categoryTag?.localized_tag_name ?? 'Other',
      });
    }
  }

  logger.log(
    `[inventorySync] Merge complete: ${inventoryItems.length} items, ` +
    `${catalogEntries.length} unique skins ` +
    `(${assets.length - inventoryItems.length} orphan assets skipped)`,
  );

  return { inventoryItems, catalogEntries };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInventoryUrl(steamId: string, startAssetId: string | null): string {
  const ts = Date.now();
  let url =
    `https://steamcommunity.com/inventory/${steamId}/730/2` +
    `?l=english&count=${ITEMS_PER_PAGE}&include_properties=1&_=${ts}`;
  if (startAssetId) {
    url += `&start_assetid=${startAssetId}`;
  }
  return url;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
