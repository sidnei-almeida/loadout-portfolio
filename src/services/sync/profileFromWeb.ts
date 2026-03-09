/**
 * Profile From Web — obtém nome e avatar do perfil Steam via fetch com cookies.
 *
 * Local-first: não usa Steam API. Faz fetch da página de perfil com os cookies
 * do usuário (mesmo padrão do inventorySync) e extrai persona_name e avatar_full.
 *
 * Estratégia: tenta JSON (?json=1), depois parse de HTML como fallback.
 */

import { extractCookies } from './steamCookies';
import { logger } from '../../utils/logger';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface ProfileFromWebResult {
  persona_name: string;
  avatar_full: string;
  profile_url?: string;
  /** Nível Steam (extraído do HTML quando possível) */
  steam_level?: number;
  /** Código do país (ex: BR, US) */
  country_code?: string;
  /** Data de criação da conta (formato ISO ou ano) */
  account_created?: string;
}

/**
 * Busca o perfil Steam via web e extrai nome + avatar.
 *
 * @param steamId  Steam ID 64-bit
 * @returns { persona_name, avatar_full } ou null se falhar
 */
export async function fetchProfileFromWeb(
  steamId: string,
): Promise<ProfileFromWebResult | null> {
  try {
    const { sessionId, steamLoginSecure } = await extractCookies();
    const cookieHeader = `sessionid=${sessionId}; steamLoginSecure=${steamLoginSecure}`;
    const profileUrl = `https://steamcommunity.com/profiles/${steamId}`;

    logger.log(`[profileFromWeb] Fetching profile for ${steamId}`);

    const res = await fetch(profileUrl, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
        'User-Agent': USER_AGENT,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        Referer: 'https://steamcommunity.com/',
      },
    });

    if (!res.ok) {
      logger.warn(`[profileFromWeb] HTTP ${res.status}`);
      return null;
    }

    const html = await res.text();

    // Tenta extrair via parse de HTML
    const result = parseProfileHtml(html, steamId);
    if (result) {
      logger.log(`[profileFromWeb] Extracted: ${result.persona_name}`);
      return result;
    }

    logger.warn('[profileFromWeb] Could not parse profile data from HTML');
    return null;
  } catch (err) {
    logger.warn('[profileFromWeb] Error:', (err as Error).message);
    return null;
  }
}

function parseProfileHtml(
  html: string,
  steamId: string,
): ProfileFromWebResult | null {
  // 1. Nome: <title>Steam Community :: PersonaName</title>
  const titleMatch = html.match(
    /<title>\s*Steam Community\s*::\s*(.+?)<\/title>/i,
  );
  const persona_name = titleMatch
    ? decodeHtmlEntities(titleMatch[1].trim())
    : null;

  if (!persona_name) {
    return null;
  }

  // 2. Avatar: og:image (geralmente full ou medium — normalizar para full)
  let avatar_full: string | null = null;

  const ogImageMatch = html.match(
    /<meta\s+property="og:image"\s+content="([^"]+)"/i,
  );
  if (ogImageMatch) {
    avatar_full = ogImageMatch[1].trim();
    // Steam: _medium.jpg → _full.jpg para 184x184
    if (avatar_full.includes('_medium.')) {
      avatar_full = avatar_full.replace('_medium.', '_full.');
    } else if (!avatar_full.includes('_full.') && avatar_full.includes('.jpg')) {
      avatar_full = avatar_full.replace('.jpg', '_full.jpg');
    }
  }

  // Fallback: img.playerAvatar
  if (!avatar_full) {
    const avatarMatch = html.match(
      /<img[^>]+class="[^"]*playerAvatar[^"]*"[^>]+src="([^"]+)"/i,
    );
    if (avatarMatch) {
      avatar_full = avatarMatch[1].trim();
      if (avatar_full.includes('_medium.')) {
        avatar_full = avatar_full.replace('_medium.', '_full.');
      }
    }
  }

  if (!avatar_full) {
    logger.log('[profileFromWeb] Avatar not found in HTML, using name only');
  }

  // 3. Steam Level — padrões comuns no HTML
  let steam_level: number | undefined;
  const levelMatch =
    html.match(/friendPlayerLevel[\s\S]*?(\d+)/i) ??
    html.match(/player_level["\s:]+(\d+)/i) ??
    html.match(/level["\s:]*(\d+)/i);
  if (levelMatch) {
    const n = parseInt(levelMatch[1], 10);
    if (!isNaN(n) && n >= 0 && n < 9999) steam_level = n;
  }

  // 4. Country — og:locale (ex: "pt_BR") ou links de país
  let country_code: string | undefined;
  const localeMatch = html.match(/og:locale["\s]+content="([a-z]{2})_[A-Z]{2}"/i);
  if (localeMatch) {
    country_code = localeMatch[1].toUpperCase();
  } else {
    const countryMatch = html.match(/steamcommunity\.com\/profiles\/.*?country=([A-Z]{2})/i);
    if (countryMatch) country_code = countryMatch[1].toUpperCase();
  }

  // 5. Member since — "Member since" + mês ano (opcional, frágil)
  let account_created: string | undefined;
  const memberMatch = html.match(/member\s+since[:\s]+([A-Za-z]+\s+\d{4})/i);
  if (memberMatch) {
    account_created = memberMatch[1].trim();
  }

  return {
    persona_name,
    avatar_full: avatar_full ?? '',
    profile_url: `https://steamcommunity.com/profiles/${steamId}`,
    steam_level,
    country_code,
    account_created,
  };
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}
