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
  avatar_full?: string;
  profile_url?: string;
  country_code?: string;
  account_age_years?: number;
  steam_level?: number;
  trust_status: TrustStatus;
  updated_at?: string;
}

