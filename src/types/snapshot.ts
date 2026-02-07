export interface Snapshot {
  id: string;
  snapshot_date: string;
  description?: string;
  icon?: string;
  total_value: number;
  total_invested?: number;
  items_count: number;
}

export interface SnapshotAnalysis {
  snapshot_date: string;
  original_value: number;
  projected_value: number;
  current_value: number;
  absolute_gain: number;
  roi_percent: number;
  top_movers?: Array<{
    market_hash_name: string;
    change: number;
    change_percent: number;
  }>;
  liquidity_score?: number;
  liquidity_label?: string;
  volatility_value?: number;
  volatility_label?: string;
}

export interface SnapshotComparison {
  snapshot1: Snapshot;
  snapshot2: Snapshot;
  value_difference: number;
  percent_difference: number;
  items_added: number;
  items_removed: number;
}

