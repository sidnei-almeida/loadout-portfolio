export interface Portfolio {
  steam_id: string;
  total_value: number;
  items: Item[];
  timestamp: string;
}

export interface PortfolioHistory {
  date: string;
  total_value: number;
}

export interface PortfolioHistoryResponse {
  steam_id: string;
  history: PortfolioHistory[];
}

