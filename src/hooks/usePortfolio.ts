/**
 * Hook for the Dashboard — portfolio value, items grid, and analytics.
 *
 * Data flows exclusively through local repos + analytics service.
 * React Query is still used for cache-invalidation and loading states.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  getInventory,
  getTotalValue,
  getItemCount,
} from '../database/repositories/inventoryRepo';
import {
  calculatePortfolioAnalytics,
  type PortfolioAnalytics,
} from '../services/analytics/portfolioAnalytics';
import type { InventoryGroupedRow } from '../database/repositories/inventoryRepo';
import type { Item } from '@types/item';

// ---------------------------------------------------------------------------
// Mapping: InventoryGroupedRow → Item (the shape the UI already expects)
// ---------------------------------------------------------------------------

function toItem(row: InventoryGroupedRow): Item {
  return {
    market_hash_name: row.market_hash_name,
    image_url: row.image_url_hd || row.icon_url || undefined,
    price: row.current_price * row.quantity,
    current_price: row.current_price,
    quantity: row.quantity,
    is_stattrak: row.is_stattrak === 1,
    rarity: row.rarity_color || undefined,
    category: row.category || undefined,
  };
}

// ---------------------------------------------------------------------------
// Query keys (centralised for easy invalidation)
// ---------------------------------------------------------------------------

export const PORTFOLIO_KEY = ['portfolio-local'] as const;
export const ANALYTICS_KEY = ['portfolio-analytics'] as const;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const usePortfolio = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // ---- Inventory items (grouped) ----
  const {
    data: inventoryData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: PORTFOLIO_KEY,
    queryFn: () => {
      const rows = getInventory();
      const items = rows.map(toItem);
      const totalValue = getTotalValue();
      const itemsCount = getItemCount();
      return { items, totalValue, itemsCount };
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // ---- Analytics (heavier computation, separate cache entry) ----
  const { data: analytics } = useQuery<PortfolioAnalytics>({
    queryKey: ANALYTICS_KEY,
    queryFn: () => calculatePortfolioAnalytics(),
    enabled: isAuthenticated && (inventoryData?.items?.length ?? 0) > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // ---- Invalidation helper (call after sync / price refresh) ----
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [...PORTFOLIO_KEY] });
    queryClient.invalidateQueries({ queryKey: [...ANALYTICS_KEY] });
  }, [queryClient]);

  return {
    items: inventoryData?.items ?? [],
    totalValue: inventoryData?.totalValue ?? 0,
    itemsCount: inventoryData?.itemsCount ?? 0,
    analytics: analytics ?? null,
    isLoading,
    error,
    refetch,
    invalidate,
  };
};
