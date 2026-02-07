/**
 * Hook para buscar dados do profile card
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { getUserProfileCard } from '@services/user';
import type { UserProfileCard } from '@types/user';

export const useProfileCard = () => {
  const { token } = useAuth();

  const {
    data: profileCard,
    isLoading,
    error,
    refetch,
  } = useQuery<UserProfileCard>({
    queryKey: ['profile-card'],
    queryFn: () => {
      if (!token) {
        throw new Error('Token not available');
      }
      return getUserProfileCard(token);
    },
    enabled: !!token,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
  });

  return {
    profileCard,
    isLoading,
    error,
    refetch,
  };
};

