export interface Item {
  market_hash_name: string;
  image_url?: string;
  price: number;
  current_price?: number;
  quantity: number;
  float_value?: number;
  paint_seed?: number;
  is_stattrak?: boolean;
  rarity?: string;
  rarity_tag?: string;
  asset_id?: string;
  collection?: string;
  category?: string;
}

export interface ItemHistory {
  market_hash_name: string;
  chart: {
    id: string;
    label: string;
    color: string;
    points: Array<{ x: string; y: number }>;
  };
  summary?: {
    start_value: number;
    end_value: number;
    absolute_change: number;
    percentage_change: number;
  };
  analysis?: {
    rsi?: number;
    volatility?: number;
    trend?: number;
    signal?: string;
  };
}

