export interface User {
  id: string;
  steam_id: string;
  username: string;
  avatar_url?: string;
  created_at?: string;
}

export interface TrustStatus {
  vac_banned: boolean;
  community_banned: boolean;
  game_ban_count: number;
  economy_ban: string;
}

export interface UserProfileCard {
  steam_id: string;
  persona_name: string;
  /** URL da foto de perfil (184x184). Steam API: avatarfull */
  avatar_full?: string;
  /** Fallback para avatar (versões antigas ou avatar_url) */
  avatar_url?: string;
  profile_url?: string;
  country_code?: string;
  account_age_years?: number;
  steam_level?: number;
  trust_status?: TrustStatus;
  updated_at?: string;
}

/** Valores padrão quando o perfil vem da web (sem Steam API) */
export const defaultTrustStatus: TrustStatus = {
  vac_banned: false,
  community_banned: false,
  game_ban_count: 0,
  economy_ban: 'none',
};

