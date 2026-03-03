/**
 * Hook for the Simulator screen — snapshot CRUD + What-If analysis.
 *
 * All data comes from local repos and analytics services.
 * React Query handles cache + loading / error states.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getSnapshots,
  getSnapshotDetails,
  createSnapshot as repoCreateSnapshot,
  deleteSnapshot as repoDeleteSnapshot,
  type SnapshotRow,
  type CreateSnapshotInput,
  type SnapshotItemInput,
} from '../database/repositories/snapshotRepo';
import { getInventory, getTotalValue } from '../database/repositories/inventoryRepo';
import {
  calculateWhatIf,
  compareSnapshots as analyticsCompare,
  type WhatIfResult,
  type SnapshotComparison,
} from '../services/analytics/snapshotAnalytics';
import { PORTFOLIO_KEY } from './usePortfolio';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const SNAPSHOTS_KEY = ['snapshots-local'] as const;
const WHATIF_KEY = (id: string) => ['whatif', id] as const;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useSnapshots = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // ---- Snapshot list ----
  const {
    data: snapshots = [],
    isLoading,
    error,
    refetch,
  } = useQuery<SnapshotRow[]>({
    queryKey: SNAPSHOTS_KEY,
    queryFn: () => getSnapshots(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  // ---- Create snapshot ----
  const createMutation = useMutation({
    mutationFn: ({
      description,
      icon,
    }: {
      description: string;
      icon?: string;
    }) => {
      const inventory = getInventory();
      const totalValue = getTotalValue();

      const header: CreateSnapshotInput = {
        description,
        icon,
        total_value: totalValue,
        total_invested: 0,
        item_count: inventory.reduce((sum, r) => sum + r.quantity, 0),
      };

      const items: SnapshotItemInput[] = inventory.map(row => ({
        market_hash_name: row.market_hash_name,
        original_price: row.current_price,
        quantity: row.quantity,
      }));

      const id = repoCreateSnapshot(header, items);
      return Promise.resolve(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SNAPSHOTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [...PORTFOLIO_KEY] });
    },
  });

  // ---- Delete snapshot ----
  const deleteMutation = useMutation({
    mutationFn: (snapshotId: string) => {
      repoDeleteSnapshot(snapshotId);
      return Promise.resolve(snapshotId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SNAPSHOTS_KEY] });
    },
  });

  // ---- What-If analysis (on-demand, cached per snapshot id) ----
  const analyzeSnapshot = useCallback(
    (snapshotId: string): WhatIfResult | null => {
      return calculateWhatIf(snapshotId);
    },
    [],
  );

  // ---- Compare two snapshots ----
  const compare = useCallback(
    (idA: string, idB: string): SnapshotComparison | null => {
      return analyticsCompare(idA, idB);
    },
    [],
  );

  return {
    snapshots,
    isLoading,
    error,
    refetch,

    createSnapshot: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    deleteSnapshot: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    analyzeSnapshot,
    compare,
  };
};

/**
 * Hook that fetches What-If data for a specific snapshot.
 * Separate hook so it can be used inside the analysis modal
 * with its own loading state.
 */
export const useWhatIf = (snapshotId: string | null) => {
  const { isAuthenticated } = useAuth();

  return useQuery<WhatIfResult | null>({
    queryKey: WHATIF_KEY(snapshotId ?? ''),
    queryFn: () => (snapshotId ? calculateWhatIf(snapshotId) : null),
    enabled: isAuthenticated && !!snapshotId,
    staleTime: 30_000,
  });
};
