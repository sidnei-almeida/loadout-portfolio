/**
 * Price Sync — fetches price history from Steam Market for each skin
 * and persists the data locally.
 *
 * Steam's price history endpoint is aggressive with HTTP 429.
 * We enforce a per-item delay (3 s) and a global cooldown (15 min)
 * to avoid getting the user's IP flagged.
 */

import CookieManager from '@react-native-cookies/cookies';
import { insertPriceBatch } from '../../database/repositories/priceHistoryRepo';
import { updatePrices } from '../../database/repositories/catalogRepo';
import type { PricePointInput } from '../../database/repositories/priceHistoryRepo';
import {
  isPriceOnCooldown,
  getPriceCooldownRemaining,
  registerPriceSync,
  formatCooldown,
} from './cooldownManager';
import { logger } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface PriceSyncResult {
  total: number;
  success: number;
  failed: number;
  pointsInserted: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTER_REQUEST_DELAY_MS = 3_000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ---------------------------------------------------------------------------
// Main entry-point
// ---------------------------------------------------------------------------

/**
 * Fetches the last ~30 days of market price data for a list of skins
 * and saves it into `price_history` + updates `skin_catalog.current_price`.
 *
 * @param marketHashNames  List of skins to refresh.
 * @param onProgress       Optional callback `(current, total) => void`.
 */
export async function syncPrices(
  marketHashNames: string[],
  onProgress?: (current: number, total: number) => void,
): Promise<PriceSyncResult> {
  // ---- Cooldown gate ----
  if (isPriceOnCooldown()) {
    const remaining = formatCooldown(getPriceCooldownRemaining());
    throw new Error(`COOLDOWN:Wait ${remaining} before refreshing prices.`);
  }

  const { sessionId, steamLoginSecure } = await extractCookies();
  const cookieHeader = `sessionid=${sessionId}; steamLoginSecure=${steamLoginSecure}`;

  const result: PriceSyncResult = {
    total: marketHashNames.length,
    success: 0,
    failed: 0,
    pointsInserted: 0,
  };

  const latestPrices: Array<{ market_hash_name: string; price: number }> = [];

  for (let i = 0; i < marketHashNames.length; i++) {
    const name = marketHashNames[i];
    onProgress?.(i + 1, marketHashNames.length);

    try {
      const points = await fetchPriceHistory(name, cookieHeader);

      if (points.length > 0) {
        const inserted = insertPriceBatch(points);
        result.pointsInserted += inserted;

        // The latest data point becomes the "current price" in the catalog
        const latest = points[points.length - 1];
        latestPrices.push({ market_hash_name: name, price: latest.price });
      }

      result.success++;
    } catch (err: any) {
      if (err?.message?.includes('429')) {
        logger.warn(
          `[priceSync] HTTP 429 at item ${i + 1}/${marketHashNames.length}. Stopping batch.`,
        );
        result.failed += marketHashNames.length - i;
        break;
      }
      logger.warn(`[priceSync] Failed for "${name}":`, err?.message);
      result.failed++;
    }

    // Delay between items (skip after the last one)
    if (i < marketHashNames.length - 1) {
      await sleep(INTER_REQUEST_DELAY_MS);
    }
  }

  // Bulk-update the current_price column in skin_catalog
  if (latestPrices.length > 0) {
    updatePrices(latestPrices);
  }

  // Only register cooldown if we actually got price data
  if (result.success > 0) {
    registerPriceSync();
  }

  logger.log(
    `[priceSync] Done: ${result.success}/${result.total} ok, ` +
    `${result.failed} failed, ${result.pointsInserted} new data points`,
  );

  return result;
}

// ---------------------------------------------------------------------------
// Single-item fetch + parse
// ---------------------------------------------------------------------------

/**
 * Steam's `/market/pricehistory` returns a `prices` array where each entry is:
 *   ["MMM DD YYYY HH: +Z", price, volume_string]
 *
 * We parse this into our `PricePointInput` format, keeping only one row
 * per day (the last data point of each day) to match the schema.
 */
async function fetchPriceHistory(
  marketHashName: string,
  cookieHeader: string,
): Promise<PricePointInput[]> {
  const encodedName = encodeURIComponent(marketHashName);
  const url =
    `https://steamcommunity.com/market/pricehistory/` +
    `?appid=730&market_hash_name=${encodedName}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Cookie: cookieHeader,
      'User-Agent': USER_AGENT,
      Accept: 'application/json, text/javascript, */*; q=0.01',
      Referer: 'https://steamcommunity.com/market/',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${marketHashName}`);
  }

  const data = await response.json();

  if (!data.success || !Array.isArray(data.prices)) {
    return [];
  }

  // Deduplicate to one point per calendar day (keep the latest)
  const dayMap = new Map<string, PricePointInput>();

  for (const entry of data.prices as [string, number, string][]) {
    const [dateStr, price, volumeStr] = entry;
    const isoDate = parseSteamDate(dateStr);
    if (!isoDate) { continue; }

    dayMap.set(isoDate, {
      market_hash_name: marketHashName,
      price,
      volume: parseInt(volumeStr, 10) || 0,
      recorded_at: isoDate,
    });
  }

  // Return sorted oldest → newest
  return Array.from(dayMap.values()).sort(
    (a, b) => a.recorded_at.localeCompare(b.recorded_at),
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parses Steam's quirky date format "MMM DD YYYY HH: +0" → "YYYY-MM-DD".
 *
 * Example input:  "Dec 13 2024 01: +0"
 * Expected output: "2024-12-13"
 */
function parseSteamDate(raw: string): string | null {
  const MONTHS: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04',
    May: '05', Jun: '06', Jul: '07', Aug: '08',
    Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };

  const match = raw.match(/^(\w{3})\s+(\d{1,2})\s+(\d{4})/);
  if (!match) { return null; }

  const [, mon, day, year] = match;
  const mm = MONTHS[mon];
  if (!mm) { return null; }

  return `${year}-${mm}-${day.padStart(2, '0')}`;
}

async function extractCookies(): Promise<{
  sessionId: string;
  steamLoginSecure: string;
}> {
  const cookies = await CookieManager.get('https://steamcommunity.com', true);

  const sessionId =
    (cookies as any)?.sessionid?.value ?? (cookies as any)?.sessionid ?? '';
  const steamLoginSecure =
    (cookies as any)?.steamLoginSecure?.value ??
    (cookies as any)?.steamLoginSecure ??
    '';

  if (!sessionId || !steamLoginSecure) {
    throw new Error(
      'Steam cookies not found. Please sign in to Steam again.',
    );
  }

  return { sessionId, steamLoginSecure };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
