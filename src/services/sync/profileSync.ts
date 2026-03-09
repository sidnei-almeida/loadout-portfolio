/**
 * Profile Sync — obtém o perfil Steam e persiste em MMKV.
 *
 * Local-first: prioridade 1 = fetch da página Steam com cookies (profileFromWeb).
 * Fallback: Steam Web API se a chave estiver configurada (steam_level, trust_status, etc).
 */

import Config from 'react-native-config';
import { storage } from '../storage';
import type { UserProfileCard, TrustStatus } from '../../types/user';
import { defaultTrustStatus } from '../../types/user';
import {
  isProfileOnCooldown,
  registerProfileSync,
} from './cooldownManager';
import { fetchProfileFromWeb } from './profileFromWeb';
import { logger } from '../../utils/logger';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface ProfileSyncResult {
  profileCard: UserProfileCard;
}

// ---------------------------------------------------------------------------
// Main entry-point
// ---------------------------------------------------------------------------

/**
 * Sincroniza o perfil Steam e persiste em MMKV.
 *
 * 1. Tenta obter via Web (cookies) — nome + avatar
 * 2. Se API key configurada, complementa com steam_level e trust_status
 * 3. Se Web falhar e houver API key, usa API como fallback completo
 *
 * @param steamId  64-bit Steam ID.
 */
export async function syncProfile(steamId: string): Promise<ProfileSyncResult> {
  if (isProfileOnCooldown()) {
    throw new Error('COOLDOWN:Profile was synced recently.');
  }

  const apiKey = resolveApiKey();

  // Prioridade 1: obter via Web (cookies)
  const webProfile = await fetchProfileFromWeb(steamId);

  if (webProfile) {
    const profileCard: UserProfileCard = {
      steam_id: steamId,
      persona_name: webProfile.persona_name,
      avatar_full: webProfile.avatar_full || undefined,
      avatar_url: webProfile.avatar_full || undefined,
      profile_url: webProfile.profile_url,
      trust_status: defaultTrustStatus,
      steam_level: webProfile.steam_level,
      account_age_years: estimateAgeFromMemberSince(webProfile.account_created),
      country_code: webProfile.country_code,
      updated_at: new Date().toISOString(),
    };

    // API complementa trust_status e sobrescreve steam_level se disponível
    if (apiKey) {
      try {
        const trustStatus = await fetchTrustStatus(apiKey, steamId);
        const steamLevel = await fetchSteamLevel(apiKey, steamId);
        profileCard.trust_status = trustStatus;
        if (steamLevel !== undefined) profileCard.steam_level = steamLevel;
      } catch {
        // Mantém defaults
      }
    }

    storage.setProfileCard(profileCard as unknown as Record<string, unknown>);
    registerProfileSync();
    logger.log(
      `[profileSync] Profile synced via Web for "${profileCard.persona_name}" (${steamId})`,
    );
    return { profileCard };
  }

  // Prioridade 2: fallback para Steam API (requer API key)
  if (apiKey) {
    return syncProfileViaApi(steamId, apiKey);
  }

  throw new Error(
    'Could not fetch profile. Steam session may have expired — try signing in again. ' +
      'No Steam API key configured for fallback.',
  );
}

// ---------------------------------------------------------------------------
// Steam API fallback
// ---------------------------------------------------------------------------

async function syncProfileViaApi(
  steamId: string,
  apiKey: string,
): Promise<ProfileSyncResult> {
  const summaryUrl =
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/` +
    `?key=${apiKey}&steamids=${steamId}`;

  const summaryRes = await fetch(summaryUrl, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!summaryRes.ok) {
    throw new Error(`Steam API returned HTTP ${summaryRes.status}`);
  }

  const summaryData = await summaryRes.json();
  const player = summaryData?.response?.players?.[0];

  if (!player) {
    throw new Error('Player not found in Steam API response.');
  }

  const trustStatus = await fetchTrustStatus(apiKey, steamId);
  const steamLevel = await fetchSteamLevel(apiKey, steamId);
  const avatarUrl = player.avatarfull ?? player.avatarmedium ?? player.avatar;

  const profileCard: UserProfileCard = {
    steam_id: steamId,
    persona_name: player.personaname ?? 'Unknown',
    avatar_full: avatarUrl,
    avatar_url: avatarUrl,
    profile_url: player.profileurl,
    country_code: player.loccountrycode ?? undefined,
    account_age_years: estimateAccountAge(player.timecreated),
    steam_level: steamLevel,
    trust_status: trustStatus,
    updated_at: new Date().toISOString(),
  };

  storage.setProfileCard(profileCard as unknown as Record<string, unknown>);
  registerProfileSync();
  logger.log(
    `[profileSync] Profile synced via API for "${profileCard.persona_name}" (${steamId})`,
  );
  return { profileCard };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveApiKey(): string | null {
  return storage.getSteamApiKey() || Config.STEAM_API_KEY || null;
}

async function fetchTrustStatus(
  apiKey: string,
  steamId: string,
): Promise<TrustStatus> {
  const defaults: TrustStatus = { ...defaultTrustStatus };

  try {
    const url =
      `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/` +
      `?key=${apiKey}&steamids=${steamId}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!res.ok) {
      return defaults;
    }

    const data = await res.json();
    const ban = data?.players?.[0];
    if (!ban) {
      return defaults;
    }

    return {
      vac_banned: ban.VACBanned ?? false,
      community_banned: ban.CommunityBanned ?? false,
      game_ban_count: ban.NumberOfGameBans ?? 0,
      economy_ban: ban.EconomyBan ?? 'none',
    };
  } catch {
    return defaults;
  }
}

async function fetchSteamLevel(
  apiKey: string,
  steamId: string,
): Promise<number | undefined> {
  try {
    const url =
      `https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/` +
      `?key=${apiKey}&steamid=${steamId}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!res.ok) {
      return undefined;
    }

    const data = await res.json();
    return data?.response?.player_level ?? undefined;
  } catch {
    return undefined;
  }
}

function estimateAgeFromMemberSince(memberSince?: string): number | undefined {
  if (!memberSince || typeof memberSince !== 'string') return undefined;
  const months: Record<string, number> = {
    jan: 0, janeiro: 0, january: 0,
    fev: 1, feb: 1, fevereiro: 1, february: 1,
    mar: 2, marco: 2, march: 2,
    apr: 3, abr: 3, april: 3, abril: 3,
    mai: 4, may: 4, maio: 4,
    jun: 5, june: 5, junho: 5,
    jul: 6, july: 6, julho: 6,
    ago: 7, aug: 7, agosto: 7, august: 7,
    set: 8, sep: 8, sept: 8, setembro: 8, september: 8,
    out: 9, oct: 9, outubro: 9, october: 9,
    nov: 10, november: 10, novembro: 10,
    dez: 11, dec: 11, dezembro: 11, december: 11,
  };
  const parts = memberSince.trim().toLowerCase().split(/\s+/);
  if (parts.length < 2) return undefined;
  const year = parseInt(parts[1], 10);
  const mon = months[parts[0]] ?? months[parts[0].slice(0, 3)];
  if (isNaN(year) || mon === undefined) return undefined;
  const created = new Date(year, mon, 1);
  const now = new Date();
  const years = (now.getTime() - created.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.floor(years);
}

function estimateAccountAge(timecreated?: number): number | undefined {
  if (!timecreated) {
    return undefined;
  }
  const created = new Date(timecreated * 1000);
  const now = new Date();
  const years =
    (now.getTime() - created.getTime()) /
    (365.25 * 24 * 60 * 60 * 1000);
  return Math.floor(years);
}
