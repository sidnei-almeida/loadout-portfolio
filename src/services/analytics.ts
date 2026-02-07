/**
 * Serviços relacionados às análises do portfolio
 */

import { apiClient } from './api';

export interface RiskScore {
  score: number;
  label: string;
  factors: {
    concentration?: { label: string; value: number };
    volatility?: { label: string; value: number };
    liquidity?: { label: string; value: number };
  };
}

export interface CategoryValue {
  category: string;
  value: number;
  count: number;
  percent: number;
}

export interface TopItem {
  name: string;
  value: number;
  percent: number;
  category: string;
  rarity: string;
}

export interface RarityBreakdown {
  [rarity: string]: {
    count: number;
    value: number;
    percent: number;
    color: string;
  };
}

export interface TrendProjection {
  projected_value_30d: number;
  trend_percent: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface PortfolioAnalytics {
  total_value: number;
  risk_score: RiskScore;
  value_by_category: CategoryValue[];
  top_items: TopItem[];
  rarity_breakdown: RarityBreakdown;
  trend_projection: TrendProjection;
  liquidity?: {
    score: number;
    label: string;
  };
}

export interface BestWorstItems {
  best: {
    name: string;
    roi_percent: number;
    roi_absolute: number;
  } | null;
  worst: {
    name: string;
    roi_percent: number;
    roi_absolute: number;
  } | null;
}

export interface MarketScenario {
  percent: number;
  projected_value: number;
  absolute_change: number;
}

export interface MarketScenariosResponse {
  current_value: number;
  scenarios: MarketScenario[];
}

/**
 * Busca análises completas do portfolio
 */
export async function getPortfolioAnalytics(token: string): Promise<PortfolioAnalytics> {
  try {
    console.log('[ANALYTICS] Carregando analytics do portfolio...');
    
    const data = await apiClient.get<PortfolioAnalytics>(
      '/analysis/portfolio/analytics',
      token
    );
    
    console.log('[ANALYTICS] ✅ Analytics carregadas:', {
      risk_score: data.risk_score?.score,
      categories_count: data.value_by_category?.length,
      top_items_count: data.top_items?.length,
    });
    
    return data;
  } catch (error) {
    console.error('[ANALYTICS] ❌ Erro ao carregar analytics:', error);
    throw error;
  }
}

/**
 * Busca melhores e piores itens (maior/menor ROI)
 */
export async function getBestWorstItems(token: string): Promise<BestWorstItems> {
  try {
    console.log('[ANALYTICS] Carregando best/worst items...');
    
    const data = await apiClient.get<BestWorstItems>(
      '/analysis/portfolio/best-worst',
      token
    );
    
    console.log('[ANALYTICS] ✅ Best/worst items carregados:', {
      best: data.best?.name,
      worst: data.worst?.name,
    });
    
    return data;
  } catch (error) {
    console.error('[ANALYTICS] ❌ Erro ao carregar best/worst items:', error);
    throw error;
  }
}

/**
 * Busca cenários de mercado (What-If com diferentes percentuais)
 * 
 * @param token - Token JWT
 * @param scenarios - Array de percentuais (ex: [-20, -10, 0, 10, 20])
 */
export async function getMarketScenarios(
  token: string,
  scenarios: number[] = [-20, -10, -5, 0, 5, 10, 20]
): Promise<MarketScenariosResponse> {
  try {
    console.log('[ANALYTICS] Carregando market scenarios...');
    
    const scenariosStr = scenarios.join(',');
    const data = await apiClient.get<MarketScenariosResponse>(
      `/analysis/portfolio/scenarios?scenarios=${scenariosStr}`,
      token
    );
    
    console.log('[ANALYTICS] ✅ Market scenarios carregados:', {
      scenarios_count: data.scenarios?.length,
    });
    
    return data;
  } catch (error) {
    console.error('[ANALYTICS] ❌ Erro ao carregar market scenarios:', error);
    throw error;
  }
}

