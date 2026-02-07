/**
 * Serviços relacionados ao portfolio
 */

import { apiClient } from './api';
import type { Portfolio, PortfolioHistory } from '@types/portfolio';

export interface PortfolioHistoryResponse {
  steam_id: string;
  history: PortfolioHistory[];
}

/**
 * Busca dados do portfolio atual
 */
export async function getPortfolioData(
  steamId: string,
  token: string
): Promise<Portfolio> {
  const steamIdStr = String(steamId);
  const data = await apiClient.get<Portfolio>(
    `/portfolio/current/${steamIdStr}`,
    token
  );

  // Converter steam_id para string
  if (data.steam_id) {
    data.steam_id = String(data.steam_id);
  }

  return data;
}

/**
 * Busca histórico do portfolio
 */
export async function getPortfolioHistory(
  steamId: string,
  days: number,
  token: string
): Promise<PortfolioHistoryResponse> {
  const steamIdStr = String(steamId);
  const data = await apiClient.get<PortfolioHistoryResponse>(
    `/portfolio/history/${steamIdStr}?days=${days}`,
    token
  );

  if (data.steam_id) {
    data.steam_id = String(data.steam_id);
  }

  return data;
}

