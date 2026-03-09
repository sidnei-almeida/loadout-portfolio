/**
 * Steam cookies — extração compartilhada de cookies de sessão.
 *
 * Prioridade: MMKV (capturado no WebView) → CookieManager nativo.
 * Usado por inventorySync, profileFromWeb, priceSync.
 */

import CookieManager from '@react-native-cookies/cookies';
import { storage } from '../storage';
import { logger } from '../../utils/logger';

export async function extractCookies(): Promise<{
  sessionId: string;
  steamLoginSecure: string;
}> {
  // Prioridade 1: MMKV (mais confiável — capturado com WebView vivo)
  const mmkvCookies = storage.getSteamCookies();
  if (mmkvCookies?.sessionId && mmkvCookies?.steamLoginSecure) {
    logger.log('[steamCookies] Using cookies from MMKV');
    return mmkvCookies;
  }

  // Prioridade 2: CookieManager (pode falhar no Android após unmount do WebView)
  logger.log('[steamCookies] MMKV cookies not found, trying CookieManager...');
  const cookies = await CookieManager.get('https://steamcommunity.com', true);

  const sessionId =
    (cookies as any)?.sessionid?.value ?? (cookies as any)?.sessionid ?? '';
  const steamLoginSecure =
    (cookies as any)?.steamLoginSecure?.value ??
    (cookies as any)?.steamLoginSecure ??
    '';

  logger.log(
    `[steamCookies] CookieManager: sessionId=${sessionId ? 'YES' : 'NO'}, loginSecure=${steamLoginSecure ? 'YES' : 'NO'}`,
  );

  if (!sessionId || !steamLoginSecure) {
    throw new Error(
      'Steam cookies not found. Please sign in to Steam again.',
    );
  }

  return { sessionId, steamLoginSecure };
}
