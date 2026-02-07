import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, Alert, View } from 'react-native';
import { Screen } from '@components/common/Screen';
import { Loading } from '@components/common/Loading';
import { RefreshProgressModal } from '@components/common/RefreshProgressModal';
import { ValueCard, PortfolioChart, ItemsList } from '@components/portfolio';
import { ItemDetailModal } from '@components/items/ItemDetailModal';
import { usePortfolio } from '@hooks/usePortfolio';
import { usePortfolioHistory } from '@hooks/usePortfolioHistory';
import { useAuth } from '@hooks/useAuth';
import { syncInventory, updatePriceHistoryForInventory } from '@services/inventory';
import { queryClient } from '@services/queryClient';
import { spacing, colors } from '@theme';
import type { Item } from '@types/item';

// Helper para garantir valores seguros
const safeSpacing = spacing || { md: 16, xl: 20, xxl: 28 };

type RefreshStepStatus = 'pending' | 'processing' | 'completed';

interface RefreshStep {
  id: string;
  label: string;
  status: RefreshStepStatus;
}

export const DashboardScreen: React.FC = () => {
  // All hooks must be called unconditionally and in the same order
  // useState hooks first
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSteps, setRefreshSteps] = useState<RefreshStep[]>([
    { id: 'sync', label: 'Syncing inventory with Steam', status: 'pending' },
    { id: 'prices', label: 'Updating price history', status: 'pending' },
    { id: 'load', label: 'Loading updated data', status: 'pending' },
  ]);
  
  // Custom hooks after useState
  const { token, user } = useAuth();
  const { portfolio, isLoading, refetch, totalValue, items } = usePortfolio();
  const { history, isLoading: isLoadingHistory, refetch: refetchHistory } = usePortfolioHistory(selectedDays);

  // Calcular mudança de valor baseado no histórico (comparando com o primeiro snapshot)
  const valueChange = useMemo(() => {
    if (!history || history.length < 1) {
      return undefined;
    }

    const currentValue = history[history.length - 1].total_value;
    const firstValue = history[0].total_value; // Primeiro snapshot
    const changeValue = currentValue - firstValue;
    const changePercent = firstValue > 0 ? (changeValue / firstValue) * 100 : 0;

    return {
      value: changeValue,
      percent: changePercent,
    };
  }, [history]);

  const updateStep = useCallback((stepId: string, status: RefreshStepStatus) => {
    setRefreshSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status } : step
    ));
  }, []);

  const resetSteps = useCallback(() => {
    setRefreshSteps([
      { id: 'sync', label: 'Syncing inventory with Steam', status: 'pending' },
      { id: 'prices', label: 'Updating price history', status: 'pending' },
      { id: 'load', label: 'Loading updated data', status: 'pending' },
    ]);
  }, []);

  const handleRefreshComplete = useCallback(() => {
    setIsRefreshing(false);
    resetSteps();
  }, [resetSteps]);

  const handleRefresh = async () => {
    if (!token || isRefreshing) return;

    console.log('[DASHBOARD] 🔄 Iniciando refresh completo...');
    setIsRefreshing(true);
    resetSteps();

    try {
      // Etapa 1: Sincronizar inventário
      console.log('[DASHBOARD] 📡 Etapa 1: Sincronizando inventário com Steam...');
      updateStep('sync', 'processing');
      const syncResult = await syncInventory(token, user?.steam_id);
      console.log('[DASHBOARD] ✅ Sincronização concluída:', syncResult);
      updateStep('sync', 'completed');

      // Pequeno delay para melhor visualização
      await new Promise(resolve => setTimeout(resolve, 300));

      // Etapa 2: Atualizar histórico de preços
      console.log('[DASHBOARD] 💰 Etapa 2: Atualizando histórico de preços...');
      updateStep('prices', 'processing');
      await updatePriceHistoryForInventory(token).catch((error) => {
        console.warn('[DASHBOARD] Erro ao atualizar histórico (não crítico):', error);
      });
      updateStep('prices', 'completed');

      // Pequeno delay para melhor visualização
      await new Promise(resolve => setTimeout(resolve, 300));

      // Etapa 3: Invalidar cache e recarregar dados
      console.log('[DASHBOARD] 🔄 Etapa 3: Invalidando cache e recarregando dados...');
      updateStep('load', 'processing');
      
      // Invalidar cache do React Query antes de fazer refetch
      await queryClient.invalidateQueries({ 
        queryKey: ['portfolio', user?.steam_id] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['portfolio-history', user?.steam_id, selectedDays] 
      });
      
      // Forçar refetch ignorando cache
      const [portfolioResult, historyResult] = await Promise.all([
        refetch(),
        refetchHistory()
      ]);
      
      console.log('[DASHBOARD] ✅ Dados recarregados:', {
        portfolio: portfolioResult.data?.items?.length || 0,
        history: historyResult.data?.history?.length || 0,
      });
      
      updateStep('load', 'completed');
    } catch (error) {
      console.error('[DASHBOARD] Erro ao atualizar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Resetar steps em caso de erro
      setIsRefreshing(false);
      resetSteps();
      
      if (errorMessage === 'STEAM_SESSION_INVALID') {
        Alert.alert(
          'Session Expired',
          'Your Steam session expired. Please go to Profile and update your session.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Could not update data. Please try again.');
      }
    }
  };

  const handleItemPress = (item: Item) => {
    setSelectedItem(item);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedItem(null);
  };

  if (isLoading && !portfolio) {
    return (
      <Screen showPremiumBackground={false}>
        <Loading fullScreen message="Loading portfolio..." />
      </Screen>
    );
  }

  // Calcular step atual baseado no status das etapas
  const currentStepIndex = refreshSteps.findIndex(step => step.status === 'processing');
  const currentStep = currentStepIndex >= 0 ? currentStepIndex : refreshSteps.length - 1;

  return (
    <View style={styles.screenContainer}>
      {/* Scrollable Content */}
      <Screen scrollable style={styles.scrollContent} showPremiumBackground={false}>
        <ValueCard
          totalValue={totalValue}
          change={valueChange}
          onRefresh={handleRefresh}
          isLoading={isLoading || isRefreshing}
        />

        <PortfolioChart
          history={history}
          isLoading={isLoadingHistory}
          selectedDays={selectedDays}
          onDaysChange={setSelectedDays}
        />

        <ItemsList
          items={items}
          isLoading={isLoading}
          onItemPress={handleItemPress}
        />
      </Screen>

      {/* Refresh Progress Modal */}
      <RefreshProgressModal
        visible={isRefreshing}
        currentStep={currentStep}
        steps={refreshSteps}
        onComplete={handleRefreshComplete}
      />

      <ItemDetailModal
        visible={isModalVisible}
        item={selectedItem}
        onClose={handleCloseModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent', // Transparente para o vídeo aparecer
  },
  scrollContent: {
    padding: safeSpacing.md,
    paddingTop: safeSpacing.xl,
    paddingBottom: safeSpacing.xxl * 2, // Extra padding at bottom for last items
    zIndex: 1, // Ensure content is above video background
  },
});

