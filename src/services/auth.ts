/**
 * Serviço de autenticação Steam
 * 
 * NOTA: A autenticação agora usa WebView interno via SteamLoginModal
 * para permitir captura de cookies. Esta função é mantida para compatibilidade
 * mas o fluxo real acontece no componente.
 */

import { API_BASE_URL } from './api';

export interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * Retorna a URL de login Steam
 * O login real acontece via SteamLoginModal usando WebView interno
 */
export function getSteamLoginUrl(): string {
  return `${API_BASE_URL}/auth/login?platform=mobile`;
}

/**
 * @deprecated Use SteamLoginModal component instead
 * Esta função está obsoleta porque InAppBrowser abre navegador externo
 * e não permite capturar cookies. Use SteamLoginModal para WebView interno.
 */
export async function loginWithSteam(): Promise<AuthResult> {
  console.warn('[AUTH] loginWithSteam() está obsoleta. Use SteamLoginModal component.');
    return {
      success: false,
    error: 'Use SteamLoginModal component for WebView-based login',
    };
}

/**
 * Extrai o token JWT da URL de callback
 * Formato esperado: loadout://auth-callback?token=JWT_TOKEN
 */
function extractTokenFromCallbackUrl(url: string): string | null {
  try {
    // Remover o scheme para poder usar URL
    const urlWithoutScheme = url.replace(`${CALLBACK_URL_SCHEME}?`, 'http://dummy?');
    const parsedUrl = new URL(urlWithoutScheme);
    const token = parsedUrl.searchParams.get('token');
    return token;
  } catch (error) {
    console.error('[AUTH] Erro ao extrair token da URL:', error);
    // Fallback: tentar regex
    const match = url.match(/[?&]token=([^&]+)/);
    return match ? match[1] : null;
  }
}

/**
 * Fecha o InAppBrowser se estiver aberto
 */
export async function closeInAppBrowser(): Promise<void> {
  try {
    if (await InAppBrowser.isAvailable()) {
      await InAppBrowser.closeAuth();
    }
  } catch (error) {
    console.warn('[AUTH] Erro ao fechar InAppBrowser:', error);
  }
}

