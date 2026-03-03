/**
 * Local replacement for the legacy `getItemHistory` that used to call the backend.
 * Now reads from the local SQLite price_history + technical analysis engine.
 */

import { getPriceHistory } from '../database/repositories/priceHistoryRepo';
import { calculateTechnicalAnalysis } from './analytics/technicalAnalysis';
import type { ItemHistoryResponse, PricePoint, PriceSummary, TechnicalAnalysis } from '../types/prices';

/**
 * Builds an `ItemHistoryResponse` entirely from local data.
 *
 * @param marketHashName  The skin's market_hash_name.
 * @param days            How many days of history to include (default 30).
 */
export function getItemHistory(
  marketHashName: string,
  days: number = 30,
): ItemHistoryResponse | null {
  const rows = getPriceHistory(marketHashName, days);

  if (rows.length === 0) {
    return null;
  }

  const chart: PricePoint[] = rows.map(r => ({
    date: r.recorded_at,
    price: r.price,
  }));

  const prices = chart.map(p => p.price);

  const summary: PriceSummary = {
    start_price: prices[0],
    end_price: prices[prices.length - 1],
    min_price: Math.min(...prices),
    max_price: Math.max(...prices),
    avg_price: prices.reduce((a, b) => a + b, 0) / prices.length,
    price_change: prices[prices.length - 1] - prices[0],
    price_change_percent:
      prices[0] > 0
        ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
        : 0,
  };

  let analysis: TechnicalAnalysis | null = null;
  if (prices.length >= 2) {
    const currentPrice = prices[prices.length - 1];
    const ta = calculateTechnicalAnalysis(prices, currentPrice);
    analysis = {
      rsi: ta.rsi,
      rsi_state: ta.rsiState,
      volatility_value: ta.volatilityValue,
      volatility: ta.volatility,
      trend: ta.trend,
    };
  }

  return {
    market_hash_name: marketHashName,
    chart,
    summary,
    analysis,
  };
}
