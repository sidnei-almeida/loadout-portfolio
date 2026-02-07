/**
 * Hook para buscar dados do portfolio
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { getPortfolioData } from '@services/portfolio';
import type { Portfolio } from '@types/portfolio';

export const usePortfolio = () => {
  const { token, user } = useAuth();

  const {
    data: portfolio,
    isLoading,
    error,
    refetch,
  } = useQuery<Portfolio>({
    queryKey: ['portfolio', user?.steam_id],
    queryFn: () => {
      if (!user?.steam_id || !token) {
        throw new Error('User or token not available');
      }
      return getPortfolioData(user.steam_id, token);
    },
    enabled: !!user?.steam_id && !!token,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    portfolio,
    isLoading,
    error,
    refetch,
    totalValue: portfolio?.total_value || 0,
    items: portfolio?.items || [],
    itemsCount: portfolio?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0,
  };
};

