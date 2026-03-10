import type { ItemHistoryResponse } from '@types/prices';

export const CHART_PERIODS_BASE = [
  { days: 7, labelKey: '7D' as const },
  { days: 30, labelKey: '30D' as const },
  { days: 90, labelKey: '90D' as const },
  { days: 365, labelKey: 'all' as const },
];

export type WearConditionKey =
  | 'wearFactoryNew'
  | 'wearMinimalWear'
  | 'wearFieldTested'
  | 'wearWellWorn'
  | 'wearBattleScarred';

export const getWearConditionKey = (floatValue: number): WearConditionKey => {
  if (floatValue < 0.07) return 'wearFactoryNew';
  if (floatValue < 0.15) return 'wearMinimalWear';
  if (floatValue < 0.38) return 'wearFieldTested';
  if (floatValue < 0.45) return 'wearWellWorn';
  return 'wearBattleScarred';
};

export const CONDITION_TO_KEY: Record<string, WearConditionKey> = {
  'Factory New': 'wearFactoryNew',
  'Minimal Wear': 'wearMinimalWear',
  'Field-Tested': 'wearFieldTested',
  'Well-Worn': 'wearWellWorn',
  'Battle-Scarred': 'wearBattleScarred',
};

export const parseItemName = (name: string) => {
  const parts = name.split('|').map((p) => p.trim());
  if (parts.length > 1) {
    const weapon = parts[0];
    let skinParts = parts.slice(1).join(' | ');
    const conditionMatch = skinParts.match(/\(([^)]+)\)/);
    let condition: string | null = null;
    if (conditionMatch) {
      condition = conditionMatch[1];
      skinParts = skinParts.replace(/\([^)]+\)/g, '').trim();
    }
    return { weapon, skin: skinParts || null, condition };
  }
  return { weapon: name, skin: null, condition: null };
};

export const calculateSummary = (
  chartPoints: Array<{ date: string; price: number }>
) => {
  if (!chartPoints || chartPoints.length === 0) return null;
  const prices = chartPoints
    .map((p) => {
      const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
      return isNaN(price) ? null : price;
    })
    .filter((p): p is number => p !== null && p > 0);
  if (prices.length === 0) return null;
  const startPrice = prices[0] || 0;
  const endPrice = prices[prices.length - 1] || 0;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const change = endPrice - startPrice;
  const changePercent = startPrice > 0 ? (change / startPrice) * 100 : 0;
  return {
    start_price: Number(startPrice.toFixed(2)),
    end_price: Number(endPrice.toFixed(2)),
    min_price: Number(minPrice.toFixed(2)),
    max_price: Number(maxPrice.toFixed(2)),
    avg_price: Number(avgPrice.toFixed(2)),
    price_change: Number(change.toFixed(2)),
    price_change_percent: Number(changePercent.toFixed(2)),
  };
};
