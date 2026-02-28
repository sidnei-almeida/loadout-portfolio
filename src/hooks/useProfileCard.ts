/**
 * Hook for the Profile screen.
 *
 * Reads the cached profile card from MMKV.  The card is written
 * after a successful Steam API fetch (using the embedded API key)
 * which will be handled by the sync layer in the future.
 *
 * For now, if no cached card exists, returns null and the screen
 * shows a placeholder.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { storage } from '@services/storage';
import type { UserProfileCard } from '@types/user';

const PROFILE_KEY = ['profile-card'] as const;

export const useProfileCard = () => {
  const { isAuthenticated, steamId } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: profileCard,
    isLoading,
    error,
    refetch,
  } = useQuery<UserProfileCard | null>({
    queryKey: PROFILE_KEY,
    queryFn: () => {
      const cached = storage.getProfileCard<UserProfileCard>();
      if (cached) {
        return cached;
      }
      if (steamId) {
        return {
          steam_id: steamId,
          persona_name: `Steam User`,
          trust_status: {
            vac_banned: false,
            community_banned: false,
            game_ban_count: 0,
            economy_ban: 'none',
          },
        } as UserProfileCard;
      }
      return null;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [...PROFILE_KEY] });
  }, [queryClient]);

  return {
    profileCard: profileCard ?? null,
    isLoading,
    error,
    refetch,
    invalidate,
  };
};
