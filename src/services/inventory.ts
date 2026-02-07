/**
 * Serviços relacionados à sincronização de inventário
 */

import CookieManager from '@react-native-cookies/cookies';
import { apiClient } from './api';
import { fetchAndUploadPriceHistoryBatch } from './prices';
import type { Item } from '@types/item';

export interface SyncInventoryResult {
  success: boolean;
  status: 'success' | 'already_synced' | 'error';
  items_synced?: number;
  items_count?: number;
  total_items?: number;
  new_items_synced?: number;
  count?: number;
  message?: string;
}

/**
 * Busca inventário completo da Steam com paginação (garante pegar todos os itens)
 * @param steamId - Steam ID do usuário
 * @param token - Token JWT de autenticação
 * @returns Dados completos do inventário
 */
async function fetchInventoryFromSteam(steamId: string, token: string): Promise<any> {
  // Buscar cookies do usuário
  const cookies = await CookieManager.get('https://steamcommunity.com', true);
  
  // Extrair cookies necessários
  const sessionId = cookies?.sessionid?.value || cookies?.sessionid;
  const steamLoginSecure = cookies?.steamLoginSecure?.value || cookies?.steamLoginSecure;
  
  // Log apenas metadados (sem valores) - apenas em desenvolvimento
  if (__DEV__) {
    console.log('[INVENTORY_FETCH] Cookies encontrados (metadados apenas):', {
      hasSessionId: !!sessionId,
      hasSteamLoginSecure: !!steamLoginSecure,
      sessionIdLength: sessionId?.length || 0,
      steamLoginSecureLength: steamLoginSecure?.length || 0,
    });
  }
  
  if (!sessionId || !steamLoginSecure) {
    if (__DEV__) {
      console.error('[INVENTORY_FETCH] ❌ Cookies não encontrados ou incompletos');
    }
    throw new Error('Cookies not found. Please sign in to Steam again.');
  }
  
  // Dados acumulados de todas as páginas
  const fullData: any = {
    assets: [],
    descriptions: [],
    asset_properties: [],
    total_inventory_count: 0,
  };
  
  let startAssetId: string | null = null;
  let pageNumber = 1;
  const maxItemsPerPage = 2000; // Máximo da Steam
  
  if (__DEV__) {
    console.log('[INVENTORY_FETCH] 📊 Configuração de paginação:', { maxItemsPerPage, pageNumber });
  }
  
  while (true) {
    // Construir URL com paginação
    const timestamp = Date.now();
    let url = `https://steamcommunity.com/inventory/${steamId}/730/2?l=english&count=${maxItemsPerPage}&include_properties=1&_=${timestamp}`;
    
    if (startAssetId) {
      url += `&start_assetid=${startAssetId}`;
    }
    
    // Removido log de URL para não expor informações de cookies via Cookie header
    if (__DEV__) {
      console.log(`[INVENTORY_FETCH] 📄 Página ${pageNumber} - Start AssetID: ${startAssetId || 'N/A'}`);
    }
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cookie': `sessionid=${sessionId}; steamLoginSecure=${steamLoginSecure}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Referer': `https://steamcommunity.com/profiles/${steamId}/inventory/`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      
      const responseStartTime = Date.now();
      
      if (!response.ok) {
        const responseTime = Date.now() - responseStartTime;
        if (__DEV__) {
          console.error(`[INVENTORY_FETCH] ❌ Erro HTTP: ${response.status} ${response.statusText} (tempo: ${responseTime}ms)`);
        }
        
        if (response.status === 403) {
          throw new Error('Inventory is private or cookies are invalid');
        }
        if (response.status === 429) {
          throw new Error('Steam rate limit reached. Please wait a few minutes.');
        }
        throw new Error(`Error fetching inventory: ${response.status} ${response.statusText}`);
      }
      
      const responseTime = Date.now() - responseStartTime;
      if (__DEV__) {
        console.log(`[INVENTORY_FETCH] ✅ Resposta recebida (tempo: ${responseTime}ms)`);
      }
      
      const data = await response.json();
      
      // Verificar se a resposta é válida
      if (!data || typeof data !== 'object') {
        if (__DEV__) {
          console.error('[INVENTORY_FETCH] ❌ Resposta não é um objeto válido');
        }
        throw new Error('Invalid response from Steam');
      }
      
      const pageAssets = data.assets || [];
      const pageDescriptions = data.descriptions || [];
      const pageProperties = data.asset_properties || [];
      const totalInventoryCount = data.total_inventory_count || 0;
      const moreItems = data.more_items;
      const lastAssetId = data.last_assetid;
      
      console.log(`[INVENTORY_FETCH] 📦 Dados recebidos da página ${pageNumber}:`);
      console.log(`  • Assets: ${pageAssets.length}`);
      console.log(`  • Descriptions: ${pageDescriptions.length}`);
      console.log(`  • Asset Properties: ${Array.isArray(pageProperties) ? pageProperties.length : typeof pageProperties}`);
      console.log(`  • Total no inventário (reportado): ${totalInventoryCount}`);
      console.log(`  • Mais itens? ${moreItems ? 'Sim' : 'Não'}`);
      console.log(`  • Last AssetID: ${lastAssetId || 'N/A'}`);
      
      // Acumular dados
      fullData.assets.push(...pageAssets);
      fullData.descriptions.push(...pageDescriptions);
      
      // Processar asset_properties (pode vir como array ou objeto)
      if (Array.isArray(pageProperties)) {
        fullData.asset_properties.push(...pageProperties);
      } else if (typeof pageProperties === 'object' && pageProperties !== null) {
        fullData.asset_properties.push(...Object.values(pageProperties));
      }
      
      // Atualizar totais acumulados
      const totalAssetsSoFar = fullData.assets.length;
      const totalDescriptionsSoFar = fullData.descriptions.length;
      
      console.log(`[INVENTORY_FETCH] 📊 Totais acumulados até agora:`);
      console.log(`  • Assets: ${totalAssetsSoFar}`);
      console.log(`  • Descriptions: ${totalDescriptionsSoFar}`);
      
      // Verificar se há mais páginas
      if (moreItems === 1 || moreItems === true) {
        startAssetId = lastAssetId;
        if (!startAssetId) {
          console.warn('[INVENTORY_FETCH] ⚠️ AVISO: more_items=1 mas last_assetid não encontrado');
          console.warn('[INVENTORY_FETCH] ⚠️ Parando paginação (pode haver mais itens não buscados)');
          break;
        }
        pageNumber++;
        if (__DEV__) {
          console.log(`[INVENTORY_FETCH] ⏭️ Há mais itens. Continuando para página ${pageNumber}...`);
        }
        // Delay entre requisições para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // Não há mais itens
        if (__DEV__) {
          console.log(`[INVENTORY_FETCH] ✅ Todas as páginas buscadas!`);
        }
        break;
      }
    } catch (error) {
      if (__DEV__) {
        console.error(`[INVENTORY_FETCH] ❌ Erro ao buscar página ${pageNumber}:`, error);
      }
      throw error;
    }
  }
  
  fullData.total_inventory_count = fullData.assets.length;
  
  console.log('='.repeat(60));
  console.log('[INVENTORY_FETCH] ✅ BUSCA COMPLETA FINALIZADA');
  console.log('[INVENTORY_FETCH] 📊 Resumo final:');
  console.log(`  • Total de páginas processadas: ${pageNumber}`);
  console.log(`  • Total de assets encontrados: ${fullData.assets.length}`);
  console.log(`  • Total de descriptions: ${fullData.descriptions.length}`);
  console.log(`  • Total de asset_properties: ${Array.isArray(fullData.asset_properties) ? fullData.asset_properties.length : 'N/A'}`);
  console.log('='.repeat(60));
  
  if (fullData.assets.length === 0) {
    if (__DEV__) {
      if (__DEV__) {
      console.error('[INVENTORY_FETCH] ❌ ERRO: Nenhum asset encontrado!');
    }
    }
    throw new Error('No items found in inventory. Check that you have items and that cookies are valid.');
  }
  
  return fullData;
}

/**
 * Sincroniza o inventário do usuário com a Steam
 * 
 * Busca o inventário completo no frontend usando cookies da sessão Steam
 * e envia para o backend processar e salvar.
 * 
 * @param steamId - Steam ID do usuário
 * @param token - Token JWT de autenticação
 * @returns Resultado da sincronização
 */
export async function syncInventory(token: string, steamId?: string): Promise<SyncInventoryResult> {
  try {
    console.log('[INVENTORY_SYNC] 🔄 Iniciando sincronização de inventário...');
    
    // Se não tiver steamId, buscar do contexto de auth
    if (!steamId) {
      // Tentar buscar do contexto (será passado pelo chamador)
      throw new Error('Steam ID is required to sync inventory');
    }
    
    // Buscar inventário completo da Steam no frontend
    const fetchStartTime = Date.now();
    const inventoryData = await fetchInventoryFromSteam(steamId, token);
    const fetchDuration = Date.now() - fetchStartTime;
    
    console.log('[INVENTORY_SYNC] ✅ Busca da Steam concluída em', fetchDuration, 'ms');
    console.log('[INVENTORY_SYNC] 📤 Preparando dados para envio ao backend...');
    console.log('[INVENTORY_SYNC] 📊 Dados preparados:');
    console.log(`  • Assets: ${inventoryData.assets?.length || 0}`);
    console.log(`  • Descriptions: ${inventoryData.descriptions?.length || 0}`);
    console.log(`  • Asset Properties: ${Array.isArray(inventoryData.asset_properties) ? inventoryData.asset_properties.length : 'N/A'}`);
    
    const uploadStartTime = Date.now();
    console.log('[INVENTORY_SYNC] 📡 Enviando dados do inventário para o backend (/inventory/upload)...');
    
    // Enviar dados para o backend processar
    const data = await apiClient.post<SyncInventoryResult>(
      '/inventory/upload',
      {
        inventory_data: inventoryData,
      },
      token
    );
    
    const uploadDuration = Date.now() - uploadStartTime;
    console.log('[INVENTORY_SYNC] ✅ Dados enviados e processados em', uploadDuration, 'ms');
    
    // Normalizar resposta
    const itemsCount = 
      data.items_synced || 
      data.total_items || 
      data.new_items_synced || 
      data.items_count || 
      data.count || 
      0;
    
    console.log('[INVENTORY_SYNC] ✅ Sincronização concluída com sucesso!');
    console.log('[INVENTORY_SYNC] 📊 Resultado:', {
      items_synced: itemsCount,
      status: data.status,
      message: data.message,
    });
    
    return {
      success: true,
      status: data.status || 'success',
      items_synced: itemsCount,
      items_count: itemsCount,
      total_items: itemsCount,
      message: data.message || `Inventory updated: ${itemsCount} items synced`,
    };
  } catch (error) {
    console.error('[INVENTORY_SYNC] ❌ Erro ao sincronizar inventário:', error);
    
    if (error instanceof Error) {
      // Detectar erros relacionados a cookies/sessão Steam
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes('cookie') ||
        errorMessage.includes('sessão') ||
        errorMessage.includes('session') ||
        errorMessage.includes('expirad') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('privado')
      ) {
        throw new Error('STEAM_SESSION_INVALID');
      }
      
      if (error.message === 'UNAUTHORIZED') {
        throw new Error('UNAUTHORIZED');
      }
    }
    
    throw new Error(`Failed to sync inventory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Sincroniza o inventário SEM criar snapshot automático
 * 
 * @param token - Token JWT de autenticação
 * @returns Resultado da sincronização
 */
export async function syncInventoryNoSnapshot(token: string): Promise<SyncInventoryResult> {
  try {
    console.log('[INVENTORY_SYNC] Iniciando sincronização de inventário (sem snapshot)...');
    
    const data = await apiClient.post<SyncInventoryResult>(
      '/inventory/refresh-no-snap',
      {}, // Backend busca cookies do banco automaticamente
      token
    );
    
    // Normalizar resposta
    const itemsCount = 
      data.items_synced || 
      data.total_items || 
      data.new_items_synced || 
      data.items_count || 
      data.count || 
      0;
    
    console.log('[INVENTORY_SYNC] ✅ Inventário sincronizado (sem snapshot):', {
      items_synced: itemsCount,
      status: data.status,
    });
    
    return {
      success: true,
      status: data.status || 'success',
      items_synced: itemsCount,
      items_count: itemsCount,
      total_items: itemsCount,
      message: data.message || `Inventory updated: ${itemsCount} items synced (no snapshot created)`,
    };
  } catch (error) {
    console.error('[INVENTORY_SYNC] ❌ Erro ao sincronizar inventário:', error);
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes('cookie') ||
        errorMessage.includes('sessão') ||
        errorMessage.includes('session') ||
        errorMessage.includes('expirad') ||
        errorMessage.includes('expired') ||
        errorMessage.includes('invalid')
      ) {
        throw new Error('STEAM_SESSION_INVALID');
      }
      
      if (error.message === 'UNAUTHORIZED') {
        throw new Error('UNAUTHORIZED');
      }
    }
    
    throw new Error(`Failed to sync inventory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Busca lista de itens do inventário
 */
export async function getInventoryItems(token: string): Promise<Item[]> {
  try {
    const data = await apiClient.get<{ items: Item[] }>('/inventory/', token);
    return data.items || [];
  } catch (error) {
    console.error('[INVENTORY] Erro ao buscar lista de itens:', error);
    return [];
  }
}

/**
 * Atualiza histórico de preços para todas as skins do inventário
 * @param token - Token JWT de autenticação
 */
// Flag para evitar execuções duplicadas simultâneas
let isUpdatingPriceHistory = false;

export async function updatePriceHistoryForInventory(token: string): Promise<void> {
  // Evitar execuções duplicadas simultâneas
  if (isUpdatingPriceHistory) {
    console.log('[PRICE_HISTORY_SYNC] ⚠️ Atualização já em andamento, ignorando chamada duplicada');
    return;
  }
  
  isUpdatingPriceHistory = true;
  try {
    console.log('[PRICE_HISTORY_SYNC] Buscando lista de itens do inventário...');
    const items = await getInventoryItems(token);
    
    if (items.length === 0) {
      console.log('[PRICE_HISTORY_SYNC] Nenhum item encontrado no inventário');
      return;
    }
    
    // Extrair market_hash_names únicos
    const uniqueMarketHashNames = Array.from(
      new Set(items.map(item => item.market_hash_name).filter(Boolean))
    );
    
    console.log(`[PRICE_HISTORY_SYNC] Encontrados ${uniqueMarketHashNames.length} skins únicas para atualizar histórico`);
    
    if (uniqueMarketHashNames.length === 0) {
      return;
    }
    
    // Buscar e enviar histórico para todas as skins
    const stats = await fetchAndUploadPriceHistoryBatch(
      uniqueMarketHashNames,
      token,
      (current, total) => {
        if (current % 5 === 0 || current === total) {
          console.log(`[PRICE_HISTORY_SYNC] Progresso: ${current}/${total} skins processadas`);
        }
      }
    );
    
    console.log(`[PRICE_HISTORY_SYNC] ✅ Concluído: ${stats.success}/${stats.total} sucesso, ${stats.failed} falhas`);
  } catch (error) {
    console.error('[PRICE_HISTORY_SYNC] Erro ao atualizar histórico:', error);
    throw error;
  } finally {
    isUpdatingPriceHistory = false;
  }
}
