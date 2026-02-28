export interface Snapshot {
  id: string;
  snapshot_date: string;
  description: string | null;
  icon: string | null;
  total_value: number;
  total_invested?: number;
  item_count: number;
  /** @deprecated alias kept for backwards compat */
  items_count?: number;
}

export interface SnapshotAnalysis {
  snapshot_date: string;
  original_value: number;
  projected_value: number;
  current_value: number;
  absolute_gain: number;
  roi_percent: number;
  simulated_vs_original?: {
    absolute: number;
    percent: number;
  };
  current_vs_simulated?: {
    absolute: number;
    percent: number;
  };
  top_movers: Array<{
    name: string;
    change_percent: number;
    change_absolute: number;
    market_hash_name?: string;
    change?: number;
  }>;
  items?: Array<{
    market_hash_name: string;
    original_price: number;
    current_price: number;
    quantity: number;
    image_url: string | null;
  }>;
  chart_comparison?: {
    labels: string[];
    values: number[];
  };
  history_chart?: any | null;
  liquidity_score?: number;
  liquidity_label?: string;
  volatility_value?: number;
  volatility_label?: string;
}

export interface SnapshotComparison {
  older_snapshot: {
    id: string;
    date: string;
    value: number;
    item_count: number;
  };
  newer_snapshot: {
    id: string;
    date: string;
    value: number;
    item_count: number;
  };
  value_change: number;
  value_change_percent: number;
  item_count_change: number;
  added_items: Array<{
    name: string;
    quantity: number;
    value: number;
    image_url?: string | null;
  }>;
  removed_items: Array<{
    name: string;
    quantity: number;
    value: number;
    image_url?: string | null;
  }>;
  changed_items?: Array<{
    name: string;
    old_quantity: number;
    new_quantity: number;
    quantity_change: number;
    image_url?: string | null;
  }>;
  summary?: {
    items_added: number;
    items_removed: number;
    items_changed: number;
  };
}
