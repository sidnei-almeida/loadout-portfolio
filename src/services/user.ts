/**
 * Serviços relacionados ao usuário
 */

import { apiClient } from './api';
import type { UserProfileCard } from '@types/user';

/**
 * Busca dados do profile card enriquecido do usuário
 */
export async function getUserProfileCard(token: string): Promise<UserProfileCard> {
  const data = await apiClient.get<UserProfileCard>('/users/me/profile-card', token);
  
  // Converter steam_id para string
  if (data.steam_id) {
    data.steam_id = String(data.steam_id);
  }
  
  return data;
}

