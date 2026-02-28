/**
 * Portfolio-wide analytics for the Dashboard screen.
 *
 * Consumes only the local repositories (no SQL here).
 * Ported from `analysis_service.py → calculate_portfolio_analytics()`.
 */

import { getInventory, getTotalValue } from '../../database/repositories/inventoryRepo';
import { getBulkPriceHistory } from '../../database/repositories/priceHistoryRepo';
import type { InventoryGroupedRow } from '../../database/repositories/inventoryRepo';
import {
  calculateVolatility,
  volumeToLiquidityScore,
  liquidityLabel,
} from './technicalAnalysis';

// ---------------------------------------------------------------------------
// Constants — same lookup tables as the Python backend
// ---------------------------------------------------------------------------

const RARITY_NAMES: Record<string, string> = {
  '#b0c3d9': 'Consumer Grade',
  '#5e98d9': 'Industrial Grade',
  '#4b69ff': 'Mil-Spec',
  '#8847ff': 'Restricted',
  '#d32ce6': 'Classified',
  '#eb4b4b': 'Covert',
  '#e4ae39': 'Contraband',
  '#ffd700': 'Extraordinary',
  '#ade55c': 'High Grade',
  '#8650ac': 'Exotic',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryBreakdown {
  category: string;
  value: number;
  count: number;
  percent: number;
}

export interface RarityBreakdown {
  rarity: string;
  count: number;
  value: number;
  percent: number;
  color: string;
}

export interface Concentration {
  topItemPercent: number;
  top3Percent: number;
  hhiIndex: number;
  riskLevel: string;
}

export interface TopItem {
  name: string;
  value: number;
  percent: number;
  category: string;
  rarity: string;
}

export interface RiskScore {
  score: number;
  label: string;
  factors: {
    concentration: { score: number; weight: number; label: string };
    volatility: { score: number; weight: number; label: string };
    illiquidity: { score: number; weight: number; label: string };
  };
}

export interface TrendProjection {
  projectedValue30d: number;
  trendPercent: number;
  trendDirection: 'up' | 'down' | 'stable';
  confidence: 'high' | 'medium' | 'low';
  rSquared?: number;
}

export interface PortfolioAnalytics {
  totalValue: number;
  totalItems: number;
  categoryBreakdown: CategoryBreakdown[];
  rarityBreakdown: RarityBreakdown[];
  concentration: Concentration;
  topItems: TopItem[];
  riskScore: RiskScore;
  liquidity: { score: number; label: string };
  volatility: { value: number; label: string };
  trendProjection: TrendProjection;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRarityName(color: string): string {
  if (!color) { return 'Unknown'; }
  return RARITY_NAMES[color.toLowerCase().trim()] ?? 'Unknown';
}

function round(v: number, d: number): number {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

// ---------------------------------------------------------------------------
// Main entry-point
// ---------------------------------------------------------------------------

export function calculatePortfolioAnalytics(): PortfolioAnalytics {
  const inventory = getInventory();

  const empty: PortfolioAnalytics = {
    totalValue: 0,
    totalItems: 0,
    categoryBreakdown: [],
    rarityBreakdown: [],
    concentration: { topItemPercent: 0, top3Percent: 0, hhiIndex: 0, riskLevel: 'N/A' },
    topItems: [],
    riskScore: { score: 0, label: 'Sem dados', factors: {
      concentration: { score: 0, weight: 0.4, label: 'N/A' },
      volatility: { score: 0, weight: 0.3, label: 'N/A' },
      illiquidity: { score: 0, weight: 0.3, label: 'N/A' },
    }},
    liquidity: { score: 0, label: 'Sem dados' },
    volatility: { value: 0, label: 'Sem dados' },
    trendProjection: { projectedValue30d: 0, trendPercent: 0, trendDirection: 'stable', confidence: 'low' },
  };

  if (inventory.length === 0) {
    return empty;
  }

  // Each row already has quantity × 1 grouped entry from the repo JOIN.
  // We need to expand into "per-unit" logic for some metrics.
  const totalValue = getTotalValue();
  const totalItems = inventory.reduce((sum, r) => sum + r.quantity, 0);

  // -----------------------------------------------------------------------
  // 1. Category Breakdown
  // -----------------------------------------------------------------------
  const catMap = new Map<string, { value: number; count: number }>();
  for (const row of inventory) {
    const cat = row.category || 'Other';
    const lineValue = row.current_price * row.quantity;
    const prev = catMap.get(cat) ?? { value: 0, count: 0 };
    catMap.set(cat, { value: prev.value + lineValue, count: prev.count + row.quantity });
  }

  const categoryBreakdown: CategoryBreakdown[] = [...catMap.entries()]
    .map(([category, d]) => ({
      category,
      value: round(d.value, 2),
      count: d.count,
      percent: totalValue > 0 ? round((d.value / totalValue) * 100, 1) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // -----------------------------------------------------------------------
  // 2. Rarity Breakdown
  // -----------------------------------------------------------------------
  const rarMap = new Map<string, { count: number; value: number; color: string }>();
  for (const row of inventory) {
    const rarity = getRarityName(row.rarity_color);
    const lineValue = row.current_price * row.quantity;
    const prev = rarMap.get(rarity) ?? { count: 0, value: 0, color: row.rarity_color };
    rarMap.set(rarity, {
      count: prev.count + row.quantity,
      value: prev.value + lineValue,
      color: prev.color || row.rarity_color,
    });
  }

  const rarityBreakdown: RarityBreakdown[] = [...rarMap.entries()]
    .map(([rarity, d]) => ({
      rarity,
      count: d.count,
      value: round(d.value, 2),
      percent: totalValue > 0 ? round((d.value / totalValue) * 100, 1) : 0,
      color: d.color,
    }))
    .sort((a, b) => b.value - a.value);

  // -----------------------------------------------------------------------
  // 3. Concentration (HHI + top-item %)
  // -----------------------------------------------------------------------
  const lineValues = inventory
    .map(r => r.current_price * r.quantity)
    .sort((a, b) => b - a);

  const topItemPercent = totalValue > 0 ? (lineValues[0] / totalValue) * 100 : 0;
  const top3Value = lineValues.slice(0, 3).reduce((a, b) => a + b, 0);
  const top3Percent = totalValue > 0 ? (top3Value / totalValue) * 100 : 0;

  /**
   * HHI (Herfindahl-Hirschman Index) measures market concentration.
   * Each item's market-share % is squared and summed.
   * Normalized to 0-100 via: (HHI - 10000/N) / (10000 - 10000/N) × 100
   * where N = number of distinct items.
   */
  let hhiRaw = 0;
  for (const row of inventory) {
    const share = totalValue > 0 ? ((row.current_price * row.quantity) / totalValue) * 100 : 0;
    hhiRaw += share ** 2;
  }

  const n = inventory.length;
  let hhiNorm = n > 1
    ? ((hhiRaw - 10000 / n) / (10000 - 10000 / n)) * 100
    : 100;
  hhiNorm = Math.max(0, Math.min(100, hhiNorm));

  let concRisk: string;
  if (topItemPercent > 50) { concRisk = 'Muito Alto'; }
  else if (topItemPercent > 30) { concRisk = 'Alto'; }
  else if (topItemPercent > 20) { concRisk = 'Moderado'; }
  else { concRisk = 'Baixo'; }

  const concentration: Concentration = {
    topItemPercent: round(topItemPercent, 1),
    top3Percent: round(top3Percent, 1),
    hhiIndex: round(hhiNorm, 1),
    riskLevel: concRisk,
  };

  // -----------------------------------------------------------------------
  // 4. Top 5 Items by total value
  // -----------------------------------------------------------------------
  const topItems: TopItem[] = [...inventory]
    .sort((a, b) => (b.current_price * b.quantity) - (a.current_price * a.quantity))
    .slice(0, 5)
    .map(r => ({
      name: r.market_hash_name,
      value: round(r.current_price * r.quantity, 2),
      percent: totalValue > 0
        ? round(((r.current_price * r.quantity) / totalValue) * 100, 1)
        : 0,
      category: r.category,
      rarity: getRarityName(r.rarity_color),
    }));

  // -----------------------------------------------------------------------
  // 5. Liquidity & Volatility (from price history)
  // -----------------------------------------------------------------------
  const marketNames = inventory.map(r => r.market_hash_name);
  const bulkHistory = getBulkPriceHistory(marketNames, 30);

  const { liquidityResult, volatilityResult } =
    computeLiquidityAndVolatility(bulkHistory, marketNames);

  // -----------------------------------------------------------------------
  // 6. Risk Score (composite: 40 % concentration + 30 % volatility + 30 % illiquidity)
  // -----------------------------------------------------------------------
  const concScore = Math.min(100, topItemPercent * 2);
  const volScore = Math.min(100, volatilityResult.value * 10);
  const illiqScore = 100 - liquidityResult.score;

  const riskScoreValue = concScore * 0.4 + volScore * 0.3 + illiqScore * 0.3;

  let riskLabel: string;
  if (riskScoreValue >= 70) { riskLabel = 'Alto'; }
  else if (riskScoreValue >= 40) { riskLabel = 'Moderado'; }
  else { riskLabel = 'Baixo'; }

  const riskScore: RiskScore = {
    score: round(riskScoreValue, 1),
    label: riskLabel,
    factors: {
      concentration: { score: round(concScore, 1), weight: 0.4, label: concRisk },
      volatility: { score: round(volScore, 1), weight: 0.3, label: volatilityResult.label },
      illiquidity: { score: round(illiqScore, 1), weight: 0.3, label: illiqScore < 40 ? 'Baixa' : 'Alta' },
    },
  };

  // -----------------------------------------------------------------------
  // 7. Trend Projection (30-day linear regression on summed daily values)
  // -----------------------------------------------------------------------
  const trendProjection = computeTrendProjection(bulkHistory, totalValue);

  return {
    totalValue: round(totalValue, 2),
    totalItems,
    categoryBreakdown,
    rarityBreakdown,
    concentration,
    topItems,
    riskScore,
    liquidity: liquidityResult,
    volatility: volatilityResult,
    trendProjection,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface BulkRow {
  market_hash_name: string;
  price: number;
  volume: number;
  recorded_at: string;
}

function computeLiquidityAndVolatility(
  bulkHistory: BulkRow[],
  marketNames: string[],
): {
  liquidityResult: { score: number; label: string };
  volatilityResult: { value: number; label: string };
} {
  if (bulkHistory.length === 0) {
    return {
      liquidityResult: { score: 0, label: 'Sem dados' },
      volatilityResult: { value: 0, label: 'Sem dados' },
    };
  }

  // Group by item
  const byItem = new Map<string, { prices: number[]; volumes: number[] }>();
  for (const row of bulkHistory) {
    let entry = byItem.get(row.market_hash_name);
    if (!entry) {
      entry = { prices: [], volumes: [] };
      byItem.set(row.market_hash_name, entry);
    }
    entry.prices.push(row.price);
    entry.volumes.push(row.volume);
  }

  // ---- Liquidity ----
  const liqScores: number[] = [];
  for (const name of marketNames) {
    const entry = byItem.get(name);
    if (entry && entry.volumes.length > 0) {
      const avgVol = entry.volumes.reduce((a, b) => a + b, 0) / entry.volumes.length;
      liqScores.push(volumeToLiquidityScore(avgVol));
    } else {
      liqScores.push(10);
    }
  }
  const liqScore = liqScores.length > 0
    ? round(liqScores.reduce((a, b) => a + b, 0) / liqScores.length, 1)
    : 0;

  // ---- Volatility (avg of per-item volatilities, in %) ----
  const vols: number[] = [];
  for (const entry of byItem.values()) {
    if (entry.prices.length >= 2) {
      vols.push(calculateVolatility(entry.prices) * 100);
    }
  }
  const avgVol = vols.length > 0
    ? round(vols.reduce((a, b) => a + b, 0) / vols.length, 2)
    : 0;

  let volLabel: string;
  if (avgVol > 5) { volLabel = 'Alta'; }
  else if (avgVol > 2) { volLabel = 'Média'; }
  else { volLabel = 'Baixa'; }

  return {
    liquidityResult: { score: liqScore, label: liquidityLabel(liqScore) },
    volatilityResult: { value: avgVol, label: volLabel },
  };
}

/**
 * 30-day linear regression on aggregated daily portfolio value.
 *
 * Ordinary Least Squares:
 *   slope (m) = Σ((xᵢ - x̄)(yᵢ - ȳ)) / Σ((xᵢ - x̄)²)
 *   intercept (b) = ȳ - m·x̄
 *   projected = b + m·(N + 30)
 *
 * Confidence derived from R²:
 *   R² = 1 - SS_res / SS_tot
 *   ≥ 0.7 → high, ≥ 0.4 → medium, else → low
 */
function computeTrendProjection(
  bulkHistory: BulkRow[],
  currentTotalValue: number,
): TrendProjection {
  const fallback: TrendProjection = {
    projectedValue30d: currentTotalValue,
    trendPercent: 0,
    trendDirection: 'stable',
    confidence: 'low',
  };

  if (bulkHistory.length === 0 || currentTotalValue <= 0) {
    return fallback;
  }

  // Aggregate total portfolio value per day
  const dailyMap = new Map<string, number>();
  for (const row of bulkHistory) {
    const date = row.recorded_at.slice(0, 10);
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + row.price);
  }

  const sortedDays = [...dailyMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  if (sortedDays.length < 7) {
    return fallback;
  }

  const values = sortedDays.map(d => d[1]);
  const nn = values.length;
  const xs = Array.from({ length: nn }, (_, i) => i);

  const xMean = xs.reduce((a, b) => a + b, 0) / nn;
  const yMean = values.reduce((a, b) => a + b, 0) / nn;

  let num = 0;
  let den = 0;
  for (let i = 0; i < nn; i++) {
    const dx = xs[i] - xMean;
    num += dx * (values[i] - yMean);
    den += dx * dx;
  }

  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;

  const projected = Math.max(0, intercept + slope * (nn + 30));

  const trendPercent = currentTotalValue > 0
    ? ((projected - currentTotalValue) / currentTotalValue) * 100
    : 0;

  let trendDirection: 'up' | 'down' | 'stable';
  if (trendPercent > 2) { trendDirection = 'up'; }
  else if (trendPercent < -2) { trendDirection = 'down'; }
  else { trendDirection = 'stable'; }

  // R² for confidence
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < nn; i++) {
    const predicted = intercept + slope * xs[i];
    ssRes += (values[i] - predicted) ** 2;
    ssTot += (values[i] - yMean) ** 2;
  }

  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  let confidence: 'high' | 'medium' | 'low';
  if (rSquared >= 0.7) { confidence = 'high'; }
  else if (rSquared >= 0.4) { confidence = 'medium'; }
  else { confidence = 'low'; }

  return {
    projectedValue30d: round(projected, 2),
    trendPercent: round(trendPercent, 2),
    trendDirection,
    confidence,
    rSquared: round(rSquared, 3),
  };
}
