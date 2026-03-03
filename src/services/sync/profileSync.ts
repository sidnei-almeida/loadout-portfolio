/**
 * Profile Sync — fetches the Steam profile using the Steam Web API
 * (`ISteamUser/GetPlayerSummaries`) and caches it locally in MMKV.
 *
 * The API key can be embedded at build time or set at runtime via
 * `storage.setSteamApiKey()`.  Only public profile data is fetched.
 */

import Config from 'react-native-config';
import { storage } from '../storage';
import type { UserProfileCard, TrustStatus } from '../../types/user';
import {
  isProfileOnCooldown,
  registerProfileSync,
} from './cooldownManager';
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
 * Fetches the user's Steam public profile and persists it as a
 * `UserProfileCard` in MMKV.
 *
 * @param steamId  64-bit Steam ID.
 * @throws if no API key is available, cooldown is active, or Steam errors.
 */
export async function syncProfile(steamId: string): Promise<ProfileSyncResult> {
  // ---- Cooldown gate ----
  if (isProfileOnCooldown()) {
    throw new Error('COOLDOWN:Profile was synced recently.');
  }

  const apiKey = resolveApiKey();
  if (!apiKey) {
    throw new Error(
      'No Steam API key configured. Set one in Settings or embed it in the build.',
    );
  }

  // ---- Fetch player summary ----
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

  // ---- Fetch player bans (trust status) ----
  const trustStatus = await fetchTrustStatus(apiKey, steamId);

  // ---- Fetch Steam level ----
  const steamLevel = await fetchSteamLevel(apiKey, steamId);

  // ---- Build profile card ----
  const profileCard: UserProfileCard = {
    steam_id: steamId,
    persona_name: player.personaname ?? 'Unknown',
    avatar_full: player.avatarfull ?? player.avatarmedium ?? player.avatar,
    profile_url: player.profileurl,
    country_code: player.loccountrycode ?? undefined,
    account_age_years: estimateAccountAge(player.timecreated),
    steam_level: steamLevel,
    trust_status: trustStatus,
    updated_at: new Date().toISOString(),
  };

  // ---- Persist in MMKV ----
  storage.setProfileCard(profileCard as unknown as Record<string, unknown>);

  // ---- Register cooldown ----
  registerProfileSync();

  logger.log(
    `[profileSync] Profile synced for "${profileCard.persona_name}" (${steamId})`,
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
  const defaults: TrustStatus = {
    vac_banned: false,
    community_banned: false,
    game_ban_count: 0,
    economy_ban: 'none',
  };

  try {
    const url =
      `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/` +
      `?key=${apiKey}&steamids=${steamId}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!res.ok) { return defaults; }

    const data = await res.json();
    const ban = data?.players?.[0];
    if (!ban) { return defaults; }

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

    if (!res.ok) { return undefined; }

    const data = await res.json();
    return data?.response?.player_level ?? undefined;
  } catch {
    return undefined;
  }
}

function estimateAccountAge(timecreated?: number): number | undefined {
  if (!timecreated) { return undefined; }
  const created = new Date(timecreated * 1000);
  const now = new Date();
  const years =
    (now.getTime() - created.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return Math.floor(years);
}
