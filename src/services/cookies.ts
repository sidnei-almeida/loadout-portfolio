/**
 * Serviços relacionados à captura de cookies Steam
 */

import { apiClient } from './api';

export interface CookiesStatus {
  has_cookies: boolean;
  status: 'valid' | 'missing' | 'error' | 'unauthorized';
  login_url?: string | null;
  message?: string;
  cookies_updated_at?: string | null;
}

export interface CaptureCookiesResult {
  success: boolean;
  message: string;
  status?: 'saved' | 'already_saved' | 'error';
}

/**
 * Verifica o status dos cookies da Steam para o usuário autenticado
 */
export async function checkCookiesStatus(token: string): Promise<CookiesStatus> {
  try {
    console.log('[COOKIES] Verificando status dos cookies...');
    
    // Fazer request manual sem body para evitar erro de validação do Pydantic
    // O endpoint retorna login_url quando não tem cookies (Modo 1)
    const API_BASE_URL = 'https://skinfolio-backend-v2.onrender.com/api/v1';
    const response = await fetch(
      `${API_BASE_URL}/auth/capture-steam-session?platform=mobile`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // Não enviar body - endpoint aceita requisição sem body para retornar login_url
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        return {
          has_cookies: false,
          status: 'unauthorized',
          login_url: null,
          message: 'Invalid token',
        };
      }

      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('[COOKIES] Resposta do servidor:', {
      has_cookies: data.has_cookies,
      has_login_url: !!data.login_url,
      message: data.message,
    });

    // Se já tem cookies, retornar sucesso
    if (data.has_cookies) {
      return {
        has_cookies: true,
        status: 'valid',
        login_url: null,
        message: data.message || 'Cookies valid',
        cookies_updated_at: data.cookies_updated_at || null,
      };
    }

    // Se não tem cookies mas tem login_url, retornar para captura
    if (data.login_url) {
      return {
        has_cookies: false,
        status: 'missing',
        login_url: data.login_url,
        message: data.message || 'Cookies not found. Tap to update.',
        cookies_updated_at: null,
      };
    }

    // Se não tem cookies nem login_url, erro
    return {
      has_cookies: false,
      status: 'error',
      login_url: null,
      message: data.message || 'Could not get login URL',
      cookies_updated_at: null,
    };
  } catch (error) {
    console.error('[COOKIES] Erro ao verificar status:', error);
    
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return {
        has_cookies: false,
        status: 'unauthorized',
        login_url: null,
        message: 'Invalid token',
      };
    }

    return {
      has_cookies: false,
      status: 'error',
      login_url: null,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Envia cookies capturados para o backend
 */
export async function saveCookies(
  sessionId: string,
  steamLoginSecure: string,
  token: string
): Promise<CaptureCookiesResult> {
  try {
    const data = await apiClient.post<CaptureCookiesResult>(
      '/auth/capture-steam-session?platform=mobile',
      {
        session_id: sessionId,
        steam_login_secure: steamLoginSecure,
      },
      token
    );

    return {
      success: true,
      message: data.message || 'Cookies saved successfully',
      status: data.status || 'saved',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error saving cookies',
      status: 'error',
    };
  }
}

