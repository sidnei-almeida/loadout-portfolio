/**
 * Serviços relacionados aos snapshots do portfolio
 */

import { apiClient } from './api';

export interface Snapshot {
  id: string;
  snapshot_date: string;
  description: string | null;
  icon: string | null;
  total_value: number;
  total_invested: number;
  item_count: number;
}

export interface SnapshotsListResponse {
  snapshots: Snapshot[];
}

export interface CreateSnapshotRequest {
  description: string;
  icon?: string;
}

export interface CreateSnapshotResponse {
  id: string;
  snapshot_date: string;
  description: string;
  icon: string;
  total_value: number;
  item_count: number;
  message: string;
}

export interface SnapshotAnalysis {
  snapshot_date: string;
  original_value: number; // Valor do snapshot na data em que foi criado
  projected_value: number; // Valor SIMULADO (o que o snapshot teria hoje se mantido)
  current_value: number; // Valor ATUAL do inventário do usuário (hoje)
  absolute_gain: number; // Ganho/perda real (current_value - original_value)
  roi_percent: number; // ROI percentual (current_value vs original_value)
  simulated_vs_original?: {
    absolute: number;
    percent: number;
  };
  current_vs_simulated?: {
    absolute: number;
    percent: number;
  };
  top_movers: Array<{
    name: string;
    change_percent: number;
    change_absolute: number;
  }>;
  items?: Array<{
    market_hash_name: string;
    original_price: number;
    current_price: number;
    quantity: number;
    image_url: string | null;
  }>;
  chart_comparison?: {
    labels: string[];
    values: number[];
  };
  history_chart?: any | null;
  liquidity_score: number;
  liquidity_label: string;
  volatility_value: number;
  volatility_label: string;
}

export interface SnapshotComparison {
  older_snapshot: {
    id: string;
    date: string;
    value: number;
    item_count: number;
  };
  newer_snapshot: {
    id: string;
    date: string;
    value: number;
    item_count: number;
  };
  value_change: number;
  value_change_percent: number;
  item_count_change: number;
  added_items: Array<{
    name: string;
    quantity: number;
    value: number;
    image_url?: string | null;
  }>;
  removed_items: Array<{
    name: string;
    quantity: number;
    value: number;
    image_url?: string | null;
  }>;
  changed_items?: Array<{
    name: string;
    old_quantity: number;
    new_quantity: number;
    quantity_change: number;
    image_url?: string | null;
  }>;
  summary?: {
    items_added: number;
    items_removed: number;
    items_changed: number;
  };
}

/**
 * Lista todos os snapshots do usuário
 */
export async function listSnapshots(token: string): Promise<Snapshot[]> {
  try {
    console.log('[SNAPSHOTS] Carregando lista de snapshots...');
    
    const data = await apiClient.get<SnapshotsListResponse>(
      '/analysis/snapshots',
      token
    );
    
    console.log('[SNAPSHOTS] ✅ Snapshots carregados:', {
      count: data.snapshots?.length || 0,
    });
    
    return data.snapshots || [];
  } catch (error) {
    console.error('[SNAPSHOTS] ❌ Erro ao carregar snapshots:', error);
    throw error;
  }
}

/**
 * Cria um novo snapshot manual do portfolio atual
 * 
 * @param token - Token JWT
 * @param description - Título/descrição do snapshot (obrigatório)
 * @param icon - Ícone do snapshot (opcional, padrão: 'target')
 */
export async function createSnapshot(
  token: string,
  description: string,
  icon: string = 'target'
): Promise<CreateSnapshotResponse> {
  try {
    console.log('[SNAPSHOTS] Criando snapshot manual...', { description, icon });
    
    const data = await apiClient.post<CreateSnapshotResponse>(
      '/analysis/snapshots/create',
      {
        description,
        icon,
      },
      token
    );
    
    console.log('[SNAPSHOTS] ✅ Snapshot criado:', {
      id: data.id,
      description: data.description,
      total_value: data.total_value,
    });
    
    return data;
  } catch (error) {
    console.error('[SNAPSHOTS] ❌ Erro ao criar snapshot:', error);
    throw error;
  }
}

/**
 * Deleta um snapshot
 */
export async function deleteSnapshot(token: string, snapshotId: string): Promise<void> {
  try {
    console.log('[SNAPSHOTS] Deletando snapshot...', { snapshotId });
    
    await apiClient.delete(`/analysis/snapshots/${snapshotId}`, token);
    
    console.log('[SNAPSHOTS] ✅ Snapshot deletado:', { snapshotId });
  } catch (error) {
    console.error('[SNAPSHOTS] ❌ Erro ao deletar snapshot:', error);
    throw error;
  }
}

/**
 * Busca análise What-If de um snapshot
 * 
 * Calcula o que aconteceria se você tivesse mantido o snapshot até hoje
 */
export async function getSnapshotAnalysis(
  token: string,
  snapshotId: string
): Promise<SnapshotAnalysis> {
  try {
    console.log('[SNAPSHOTS] Carregando análise What-If...', { snapshotId });
    
    const data = await apiClient.get<SnapshotAnalysis>(
      `/analysis/snapshots/${snapshotId}/analyze`,
      token
    );
    
    console.log('[SNAPSHOTS] ✅ Análise What-If carregada:', {
      roi_percent: data.roi_percent,
      absolute_gain: data.absolute_gain,
    });
    
    return data;
  } catch (error) {
    console.error('[SNAPSHOTS] ❌ Erro ao carregar análise:', error);
    throw error;
  }
}

/**
 * Compara dois snapshots
 */
export async function compareSnapshots(
  token: string,
  snapshotId1: string,
  snapshotId2: string
): Promise<SnapshotComparison> {
  try {
    console.log('[SNAPSHOTS] Comparando snapshots...', { snapshotId1, snapshotId2 });
    
    const data = await apiClient.get<SnapshotComparison>(
      `/analysis/snapshots/compare?snapshot_id_1=${snapshotId1}&snapshot_id_2=${snapshotId2}`,
      token
    );
    
    console.log('[SNAPSHOTS] ✅ Snapshots comparados:', {
      percentage_change: data.percentage_change,
      absolute_change: data.absolute_change,
    });
    
    return data;
  } catch (error) {
    console.error('[SNAPSHOTS] ❌ Erro ao comparar snapshots:', error);
    throw error;
  }
}

