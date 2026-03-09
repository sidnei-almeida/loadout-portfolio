/**
 * Key-value storage powered by react-native-mmkv.
 *
 * Replaces the old AsyncStorage-based module.  MMKV is synchronous and
 * ~30× faster, which matters for cooldown checks and auth-gate reads
 * that happen on every app start.
 *
 * Domains:
 *  - Auth / session  → steam_id, cookies presence flag
 *  - User profile    → cached Steam profile card (JSON)
 *  - Cooldowns       → timestamps keyed by operation name
 *  - Preferences     → currency, language, theme, etc.
 */

import { MMKV } from 'react-native-mmkv';

export const mmkv = new MMKV({ id: 'loadout-storage' });

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

const Keys = {
  STEAM_ID: 'auth.steam_id',
  HAS_SESSION: 'auth.has_session',
  STEAM_SESSION_ID: 'auth.steam_session_id',
  STEAM_LOGIN_SECURE: 'auth.steam_login_secure',
  PROFILE_CARD: 'cache.profile_card',
  STEAM_API_KEY: 'config.steam_api_key',
  CURRENCY: 'prefs.currency',
  LANGUAGE: 'prefs.language',
  COOLDOWN_PREFIX: 'cooldown.',
} as const;

// ---------------------------------------------------------------------------
// Auth / Session
// ---------------------------------------------------------------------------

export const storage = {
  // ---- Steam identity ----

  setSteamId(steamId: string): void {
    mmkv.set(Keys.STEAM_ID, steamId);
  },

  getSteamId(): string | null {
    return mmkv.getString(Keys.STEAM_ID) ?? null;
  },

  setHasSession(value: boolean): void {
    mmkv.set(Keys.HAS_SESSION, value);
  },

  getHasSession(): boolean {
    return mmkv.getBoolean(Keys.HAS_SESSION) ?? false;
  },

  // ---- Steam session cookies (captured while WebView is alive) ----

  setSteamCookies(sessionId: string, steamLoginSecure: string): void {
    mmkv.set(Keys.STEAM_SESSION_ID, sessionId);
    mmkv.set(Keys.STEAM_LOGIN_SECURE, steamLoginSecure);
  },

  getSteamCookies(): { sessionId: string; steamLoginSecure: string } | null {
    const sessionId = mmkv.getString(Keys.STEAM_SESSION_ID);
    const steamLoginSecure = mmkv.getString(Keys.STEAM_LOGIN_SECURE);
    if (!sessionId || !steamLoginSecure) {
      return null;
    }
    return { sessionId, steamLoginSecure };
  },

  // ---- Cached profile card (JSON blob) ----

  setProfileCard(card: Record<string, unknown>): void {
    mmkv.set(Keys.PROFILE_CARD, JSON.stringify(card));
  },

  getProfileCard<T = Record<string, unknown>>(): T | null {
    const raw = mmkv.getString(Keys.PROFILE_CARD);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  // ---- Steam API Key (embedded or user-provided) ----

  setSteamApiKey(key: string): void {
    mmkv.set(Keys.STEAM_API_KEY, key);
  },

  getSteamApiKey(): string | null {
    return mmkv.getString(Keys.STEAM_API_KEY) ?? null;
  },

  // ---- Preferences ----

  setCurrency(code: string): void {
    mmkv.set(Keys.CURRENCY, code);
  },

  getCurrency(): string {
    return mmkv.getString(Keys.CURRENCY) ?? 'USD';
  },

  setLanguage(locale: string): void {
    mmkv.set(Keys.LANGUAGE, locale);
  },

  getLanguage(): string {
    return mmkv.getString(Keys.LANGUAGE) ?? 'en';
  },

  // ---- Cooldowns (rate-limit tracking) ----

  /**
   * Records "now" as the last time `operation` ran.
   */
  setCooldown(operation: string): void {
    mmkv.set(`${Keys.COOLDOWN_PREFIX}${operation}`, Date.now());
  },

  /**
   * Returns the remaining cooldown in milliseconds (0 if expired).
   * @param operation  Unique name (e.g. "price_refresh", "inventory_sync")
   * @param windowMs   Cooldown window in ms (default 3 min)
   */
  getCooldownRemaining(operation: string, windowMs: number = 3 * 60 * 1000): number {
    const lastRun = mmkv.getNumber(`${Keys.COOLDOWN_PREFIX}${operation}`);
    if (!lastRun) {
      return 0;
    }
    const elapsed = Date.now() - lastRun;
    return Math.max(0, windowMs - elapsed);
  },

  /**
   * Returns `true` when the operation is still in cooldown.
   */
  isOnCooldown(operation: string, windowMs: number = 3 * 60 * 1000): boolean {
    return this.getCooldownRemaining(operation, windowMs) > 0;
  },

  // ---- Housekeeping ----

  /**
   * Wipes everything (logout).
   */
  clear(): void {
    mmkv.clearAll();
  },
};
