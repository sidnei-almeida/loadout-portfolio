/**
 * Hook for the portfolio value chart on the Dashboard.
 *
 * In the Local-First model, the "history" is derived from saved
 * snapshots rather than a backend time-series.  Each snapshot
 * represents a frozen-in-time total_value data-point.
 *
 * If fewer than 2 snapshots exist we return an empty array and
 * the chart component hides itself gracefully.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { getSnapshots } from '../database/repositories/snapshotRepo';
import type { PortfolioHistory } from '@types/portfolio';
import { SNAPSHOTS_KEY } from './useSnapshots';

export const usePortfolioHistory = (_days: number = 30) => {
  const { isAuthenticated } = useAuth();

  const {
    data: historyData,
    isLoading,
    error,
    refetch,
  } = useQuery<PortfolioHistory[]>({
    queryKey: [...SNAPSHOTS_KEY, 'history'],
    queryFn: () => {
      const snapshots = getSnapshots();

      return snapshots
        .map(s => ({
          date: s.snapshot_date,
          total_value: s.total_value,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  return {
    history: historyData ?? [],
    isLoading,
    error,
    refetch,
  };
};
