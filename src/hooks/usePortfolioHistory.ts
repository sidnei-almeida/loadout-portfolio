/**
 * Hook para buscar histórico do portfolio
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { getPortfolioHistory } from '@services/portfolio';
import type { PortfolioHistoryResponse } from '@services/portfolio';

export const usePortfolioHistory = (days: number = 30) => {
  const { token, user } = useAuth();

  const {
    data: historyData,
    isLoading,
    error,
    refetch,
  } = useQuery<PortfolioHistoryResponse>({
    queryKey: ['portfolio-history', user?.steam_id, days],
    queryFn: () => {
      if (!user?.steam_id || !token) {
        throw new Error('User or token not available');
      }
      return getPortfolioHistory(user.steam_id, days, token);
    },
    enabled: !!user?.steam_id && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    history: historyData?.history || [],
    isLoading,
    error,
    refetch,
  };
};

