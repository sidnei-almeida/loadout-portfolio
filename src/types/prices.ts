export interface PricePoint {
  date: string;
  price: number;
}

export interface PriceSummary {
  start_price: number;
  end_price: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  price_change: number;
  price_change_percent: number;
  volume?: number;
}

export interface TechnicalAnalysis {
  rsi: number;
  rsi_state?: 'Oversold' | 'Overbought' | 'Neutral';
  rsi_status?: string;
  volatility_value: number;
  volatility?: 'High' | 'Medium' | 'Low';
  trend?: 'Bullish' | 'Bearish' | 'Neutral';
  trend_status?: string;
  trend_30d?: string;
  moving_average_7d?: number;
  moving_average_30d?: number;
}

export interface ItemHistoryResponse {
  market_hash_name: string;
  chart: PricePoint[];
  summary: PriceSummary | null;
  analysis: TechnicalAnalysis | null;
}
