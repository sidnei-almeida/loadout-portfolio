/**
 * Serviços relacionados a preços e histórico de itens
 */

import { apiClient } from './api';
import CookieManager from '@react-native-cookies/cookies';

export interface PricePoint {
  date: string;
  price: number;
}

export interface PriceSummary {
  start_price: number;
  end_price: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  price_change: number;
  price_change_percent: number;
  volume?: number;
}

export interface TechnicalAnalysis {
  rsi: number;
  rsi_state?: 'Oversold' | 'Overbought' | 'Neutral';
  rsi_status?: string;
  volatility_value: number;
  volatility?: 'High' | 'Medium' | 'Low';
  trend?: 'Bullish' | 'Bearish' | 'Neutral';
  trend_status?: string;
  trend_30d?: string;
  moving_average_7d?: number;
  moving_average_30d?: number;
}

export interface ItemHistoryResponse {
  market_hash_name: string;
  chart: PricePoint[];
  summary: PriceSummary | null;
  analysis: TechnicalAnalysis | null;
}

/**
 * Busca histórico de preços de um item
 * 
 * @param marketHashName - Nome do item (market_hash_name)
 * @param days - Número de dias de histórico (7, 30, ou 365)
 * @param token - Token JWT de autenticação
 */
export async function getItemHistory(
  marketHashName: string,
  days: number = 30,
  token: string
): Promise<ItemHistoryResponse | null> {
  try {
    console.log('[PRICES] Carregando histórico de preços...', { marketHashName, days });
    
    const encodedName = encodeURIComponent(marketHashName);
    const data = await apiClient.get<any>(
      `/prices/${encodedName}/history?days=${days}`,
      token
    );
    
    // Caso vazio: backend retorna {history: [], summary: null}
    if (data.history && Array.isArray(data.history) && data.history.length === 0) {
      return {
        market_hash_name: data.market_hash_name || marketHashName,
        chart: [],
        summary: null,
        analysis: null,
      };
    }
    
    // Normalizar formato: backend retorna {chart: [{x: "date", y: price}]} 
    // Precisamos converter para {date: "date", price: price}
    let chartPoints: PricePoint[] = [];
    
    if (data.chart && Array.isArray(data.chart)) {
      chartPoints = data.chart.map((point: any) => {
        // Backend retorna {x: "2023-11-21", y: 150.50}
        if (point.x && point.y !== undefined) {
          return {
            date: point.x,
            price: typeof point.y === 'number' ? point.y : Number(point.y),
          };
        }
        // Formato alternativo {date: "...", price: ...}
        if (point.date && point.price !== undefined) {
          return {
            date: point.date,
            price: typeof point.price === 'number' ? point.price : Number(point.price),
          };
        }
        // Fallback: tentar qualquer formato
        return {
          date: point.date || point.x || '',
          price: typeof point.price !== 'undefined' 
            ? (typeof point.price === 'number' ? point.price : Number(point.price))
            : (typeof point.y !== 'undefined' ? (typeof point.y === 'number' ? point.y : Number(point.y)) : 0),
        };
      }).filter((point: PricePoint) => point.date && !isNaN(point.price) && point.price > 0);
    } else if (data.history && Array.isArray(data.history)) {
      // Formato alternativo com history
      chartPoints = data.history.map((point: any) => ({
        date: point.date || point.x || '',
        price: typeof point.price !== 'undefined' 
          ? (typeof point.price === 'number' ? point.price : Number(point.price))
          : (typeof point.y !== 'undefined' ? (typeof point.y === 'number' ? point.y : Number(point.y)) : 0),
      })).filter((point: PricePoint) => point.date && !isNaN(point.price) && point.price > 0);
    }
    
    console.log('[PRICES] Dados normalizados:', {
      original_length: data.chart?.length || data.history?.length || 0,
      normalized_length: chartPoints.length,
      first_point: chartPoints[0],
      last_point: chartPoints[chartPoints.length - 1],
    });
    
    return {
      market_hash_name: data.market_hash_name || marketHashName,
      chart: chartPoints,
      summary: data.summary || null,
      analysis: data.analysis || null,
    };
  } catch (error) {
    // 404 significa que o item não tem histórico ainda (normal para itens novos)
    if (error instanceof Error && error.message.includes('404')) {
      console.log('[PRICES] Item sem histórico ainda:', marketHashName);
      return null;
    }
    console.error('[PRICES] Erro ao buscar histórico:', error);
    throw error;
  }
}

/**
 * Busca histórico de preços diretamente da Steam e envia para o backend
 * @param marketHashName - Nome do item (market_hash_name)
 * @param token - Token JWT de autenticação
 * @returns Número de registros inseridos ou 0 se falhar
 */
export async function fetchAndUploadPriceHistory(
  marketHashName: string,
  token: string
): Promise<number> {
  try {
    console.log('[PRICES] Buscando histórico diretamente da Steam para:', marketHashName);
    
    // Buscar cookies do usuário
    const cookies = await CookieManager.get('https://steamcommunity.com', true);
    
    // Extrair cookies necessários
    const sessionId = cookies?.sessionid?.value || cookies?.sessionid;
    const steamLoginSecure = cookies?.steamLoginSecure?.value || cookies?.steamLoginSecure;
    
    if (!sessionId || !steamLoginSecure) {
      console.warn('[PRICES] Cookies não encontrados, não é possível buscar histórico');
      return -1; // -1 indica erro real
    }
    
    // Construir URL da Steam
    const encodedName = encodeURIComponent(marketHashName);
    const steamUrl = `https://steamcommunity.com/market/pricehistory/?appid=730&market_hash_name=${encodedName}`;
    
    // Fazer requisição com cookies
    const response = await fetch(steamUrl, {
      method: 'GET',
      headers: {
        'Cookie': `sessionid=${sessionId}; steamLoginSecure=${steamLoginSecure}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Referer': 'https://steamcommunity.com/market/',
      },
    });
    
    if (!response.ok) {
      console.warn(`[PRICES] Erro ao buscar histórico: ${response.status} ${response.statusText}`);
      return -1; // -1 indica erro real
    }
    
    const data = await response.json();
    
    if (!data.success || !data.prices || !Array.isArray(data.prices)) {
      console.warn('[PRICES] Resposta da Steam inválida ou sem preços');
      return -1; // -1 indica erro real
    }
    
    if (data.prices.length === 0) {
      console.log(`[PRICES] Nenhum dado de histórico disponível na Steam para ${marketHashName}`);
      return -1; // Sem dados = erro
    }
    
    // Enviar dados para o backend
    const uploadResponse = await apiClient.post<{ status: string; records_inserted: number }>(
      '/prices/history/upload',
      {
        market_hash_name: marketHashName,
        history_data: data.prices,
      },
      token
    );
    
    const inserted = uploadResponse.records_inserted || 0;
    if (inserted > 0) {
      console.log(`[PRICES] ✅ Histórico enviado para o backend: ${inserted} novos registros inseridos`);
    } else {
      console.log(`[PRICES] ✅ Histórico já estava atualizado no backend (nenhum registro novo necessário)`);
    }
    // Sempre retornar 1 para sucesso (tanto com novos registros quanto quando já estava atualizado)
    // -1 indica erro real (já retornado anteriormente se houver erro)
    return 1;
    
  } catch (error) {
    console.error('[PRICES] Erro ao buscar/enviar histórico:', error);
    return -1; // -1 indica erro real
  }
}

/**
 * Busca e atualiza histórico de preços para múltiplas skins
 * @param marketHashNames - Array de nomes de skins
 * @param token - Token JWT de autenticação
 * @param onProgress - Callback opcional para progresso (current, total)
 * @returns Estatísticas do upload
 */
export async function fetchAndUploadPriceHistoryBatch(
  marketHashNames: string[],
  token: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ total: number; success: number; failed: number }> {
  const stats = { total: marketHashNames.length, success: 0, failed: 0 };
  
    for (let i = 0; i < marketHashNames.length; i++) {
    const marketHashName = marketHashNames[i];
    
    if (onProgress) {
      onProgress(i + 1, marketHashNames.length);
    }
    
    try {
      const result = await fetchAndUploadPriceHistory(marketHashName, token);
      // A função retorna:
      // - 1 = sucesso (novos registros inseridos OU já estava atualizado - ambos são sucesso)
      // - -1 = erro real (falha na requisição, sem cookies, etc)
      if (result > 0) {
        stats.success++;
      } else {
        stats.failed++;
      }
      
      // Delay entre requisições para não sobrecarregar a Steam
      if (i < marketHashNames.length - 1) {
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1000)); // 1 segundo de delay
      }
    } catch (error) {
      console.error(`[PRICES] Erro ao processar ${marketHashName}:`, error);
      stats.failed++;
    }
  }
  
  console.log(`[PRICES] Batch concluído: ${stats.success}/${stats.total} sucesso, ${stats.failed} falhas`);
  return stats;
}

