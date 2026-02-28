/**
 * Pure-math technical analysis functions.
 *
 * Ported 1:1 from the Python backend (analysis_service.py).
 * These are stateless — they take price arrays and return numbers.
 * No database or repo calls happen here.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RsiState = 'Overbought' | 'Neutral' | 'Oversold';
export type VolatilityLevel = 'High' | 'Medium' | 'Low';
export type TrendDirection = 'Bullish' | 'Bearish' | 'Neutral';
export type Signal = 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL';

export interface TrendResult {
  changePercent: number;
  status: string;
  sma: number;
}

export interface TechnicalAnalysisResult {
  rsi: number;
  rsiState: RsiState;
  rsiStatus: string;
  volatility: VolatilityLevel;
  volatilityValue: number;
  trend: TrendDirection;
  trend30d: string;
  trendStatus: string;
  momentum7d: number;
  signal: Signal;
  signalColor: string;
}

// ---------------------------------------------------------------------------
// RSI — Relative Strength Index (Wilder's smoothing)
// ---------------------------------------------------------------------------

/**
 * Computes RSI using Wilder's exponential smoothing method.
 *
 * Algorithm:
 *  1. Compute daily price deltas.
 *  2. Separate into gains (positive deltas) and losses (abs of negative).
 *  3. Seed average gain/loss from first `periods` deltas (SMA).
 *  4. Smooth remaining deltas: avg = (prev_avg × (periods-1) + current) / periods
 *  5. RS = avg_gain / avg_loss → RSI = 100 - 100/(1+RS)
 *
 * @param prices  Array of prices, oldest first.
 * @param periods Number of look-back periods (default 14).
 * @returns RSI value between 0 and 100.
 */
export function calculateRSI(prices: number[], periods: number = 14): number {
  if (prices.length < periods + 1) {
    return 50.0; // Neutral when insufficient data
  }

  const deltas: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    deltas.push(prices[i] - prices[i - 1]);
  }

  const gains = deltas.map(d => (d > 0 ? d : 0));
  const losses = deltas.map(d => (d < 0 ? -d : 0));

  // Seed with simple average of first N periods
  let avgGain = gains.slice(0, periods).reduce((a, b) => a + b, 0) / periods;
  let avgLoss = losses.slice(0, periods).reduce((a, b) => a + b, 0) / periods;

  // Wilder smoothing for remaining periods
  for (let i = periods; i < gains.length; i++) {
    avgGain = (avgGain * (periods - 1) + gains[i]) / periods;
    avgLoss = (avgLoss * (periods - 1) + losses[i]) / periods;
  }

  if (avgLoss === 0) {
    return 100.0;
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return round(Math.max(0, Math.min(100, rsi)), 2);
}

// ---------------------------------------------------------------------------
// Volatility — standard deviation of log returns
// ---------------------------------------------------------------------------

/**
 * Computes volatility as the population standard deviation of logarithmic
 * returns: σ = sqrt( Σ(rᵢ - r̄)² / N )
 *
 * Log returns are used because they are time-additive and better model
 * the multiplicative nature of price changes.
 *
 * @returns Volatility as a decimal (e.g. 0.045 = 4.5%).
 */
export function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) {
    return 0;
  }

  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
  }

  if (returns.length < 2) {
    return 0;
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length;

  return round(Math.sqrt(variance), 4);
}

// ---------------------------------------------------------------------------
// Trend — current price vs. Simple Moving Average
// ---------------------------------------------------------------------------

/**
 * Compares the current price against the SMA of the last N periods.
 *
 * changePercent = ((currentPrice - SMA) / SMA) × 100
 *
 *  > +5 %  → "Alta"  (bullish)
 *  < -5 %  → "Baixa" (bearish)
 *  else    → "Neutra"
 */
export function calculateTrend(
  currentPrice: number,
  historyPrices: number[],
  smaPeriods: number = 30,
): TrendResult {
  if (!historyPrices.length || historyPrices.length < smaPeriods) {
    return { changePercent: 0, status: 'Dados insuficientes', sma: 0 };
  }

  const recent = historyPrices.slice(-smaPeriods);
  const sma = recent.reduce((a, b) => a + b, 0) / recent.length;

  if (sma === 0) {
    return { changePercent: 0, status: 'Dados insuficientes', sma: 0 };
  }

  const changePercent = ((currentPrice - sma) / sma) * 100;

  let status: string;
  if (changePercent > 5) {
    status = 'Alta';
  } else if (changePercent < -5) {
    status = 'Baixa';
  } else {
    status = 'Neutra';
  }

  return {
    changePercent: round(changePercent, 2),
    status,
    sma: round(sma, 2),
  };
}

// ---------------------------------------------------------------------------
// Composite — full technical analysis for a single item
// ---------------------------------------------------------------------------

/**
 * Aggregates RSI + volatility + trend + momentum + signal into a single
 * result object.  This is what the Item Detail modal renders.
 *
 * Signal logic (same as Python):
 *   RSI < 30  AND  trend = Bullish → STRONG BUY
 *   RSI < 35                       → BUY
 *   RSI > 70                       → SELL
 *   else                           → HOLD
 */
export function calculateTechnicalAnalysis(
  prices: number[],
  currentPrice?: number,
  rsiPeriods: number = 14,
  smaPeriods: number = 30,
): TechnicalAnalysisResult {
  if (!prices.length || prices.length < 2) {
    return {
      rsi: 50,
      rsiState: 'Neutral',
      rsiStatus: 'Dados insuficientes',
      volatility: 'Low',
      volatilityValue: 0,
      trend: 'Neutral',
      trend30d: '+0.00%',
      trendStatus: 'Neutra',
      momentum7d: 0,
      signal: 'HOLD',
      signalColor: '#fbbf24',
    };
  }

  const price = currentPrice ?? prices[prices.length - 1];

  // ---- RSI ----
  const rsi = calculateRSI(prices, rsiPeriods);

  let rsiState: RsiState;
  let rsiStatus: string;
  if (rsi > 70) {
    rsiState = 'Overbought';
    rsiStatus = 'Sobrecomprado (Cuidado)';
  } else if (rsi < 30) {
    rsiState = 'Oversold';
    rsiStatus = 'Oportunidade (Sobrevendido)';
  } else {
    rsiState = 'Neutral';
    rsiStatus = 'Neutro';
  }

  // ---- Volatility ----
  const volDecimal = calculateVolatility(prices);
  const volPercent = round(volDecimal * 100, 2);

  let volatilityLevel: VolatilityLevel;
  if (volPercent > 5) {
    volatilityLevel = 'High';
  } else if (volPercent > 2) {
    volatilityLevel = 'Medium';
  } else {
    volatilityLevel = 'Low';
  }

  // ---- Trend (SMA-30) ----
  const trend = calculateTrend(price, prices, smaPeriods);
  const trendPercent = trend.changePercent;

  let trendDirection: TrendDirection;
  let trendStatus: string;
  if (trendPercent > 0) {
    trendDirection = 'Bullish';
    trendStatus = 'Alta';
  } else if (trendPercent < 0) {
    trendDirection = 'Bearish';
    trendStatus = 'Baixa';
  } else {
    trendDirection = 'Neutral';
    trendStatus = 'Neutra';
  }

  // ---- Momentum 7d ----
  let momentum7d = 0;
  if (prices.length >= 7) {
    const price7dAgo = prices[prices.length - 7];
    if (price7dAgo > 0) {
      momentum7d = round(((price - price7dAgo) / price7dAgo) * 100, 2);
    }
  }

  // ---- Signal ----
  let signal: Signal;
  let signalColor: string;

  if (rsi < 30 && trendDirection === 'Bullish') {
    signal = 'STRONG BUY';
    signalColor = '#4ade80';
  } else if (rsi < 35) {
    signal = 'BUY';
    signalColor = '#22c55e';
  } else if (rsi > 70) {
    signal = 'SELL';
    signalColor = '#ef4444';
  } else {
    signal = 'HOLD';
    signalColor = '#fbbf24';
  }

  const sign = trendPercent >= 0 ? '+' : '';

  return {
    rsi,
    rsiState,
    rsiStatus,
    volatility: volatilityLevel,
    volatilityValue: volPercent,
    trend: trendDirection,
    trend30d: `${sign}${trendPercent.toFixed(2)}%`,
    trendStatus,
    momentum7d,
    signal,
    signalColor,
  };
}

// ---------------------------------------------------------------------------
// Liquidity score (portfolio-wide, based on volume)
// ---------------------------------------------------------------------------

/**
 * Maps average daily volume to a 0-100 score using the same thresholds
 * as the Python backend:
 *
 *   >= 100 → 100
 *   >= 50  → 80-100
 *   >= 20  → 60-80
 *   >= 10  → 40-60
 *   >= 5   → 20-40
 *   < 5    → 0-20 (proportional)
 */
export function volumeToLiquidityScore(avgVolume: number): number {
  let score: number;
  if (avgVolume >= 100) {
    score = 100;
  } else if (avgVolume >= 50) {
    score = 80 + ((avgVolume - 50) * 20) / 50;
  } else if (avgVolume >= 20) {
    score = 60 + ((avgVolume - 20) * 20) / 30;
  } else if (avgVolume >= 10) {
    score = 40 + ((avgVolume - 10) * 20) / 10;
  } else if (avgVolume >= 5) {
    score = 20 + ((avgVolume - 5) * 20) / 5;
  } else {
    score = avgVolume * 4;
  }
  return Math.min(100, Math.max(0, score));
}

export function liquidityLabel(score: number): string {
  if (score >= 80) { return 'Alta Liquidez'; }
  if (score >= 60) { return 'Boa Liquidez'; }
  if (score >= 40) { return 'Média Liquidez'; }
  if (score >= 20) { return 'Baixa Liquidez'; }
  return 'Muito Baixa';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
