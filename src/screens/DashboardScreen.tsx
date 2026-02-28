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
import { storage } from '@services/storage';
import { spacing } from '@theme';
import type { Item } from '@types/item';

const safeSpacing = spacing || { md: 16, xl: 20, xxl: 28 };

type RefreshStepStatus = 'pending' | 'processing' | 'completed';

interface RefreshStep {
  id: string;
  label: string;
  status: RefreshStepStatus;
}

export const DashboardScreen: React.FC = () => {
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSteps, setRefreshSteps] = useState<RefreshStep[]>([
    { id: 'sync', label: 'Syncing inventory with Steam', status: 'pending' },
    { id: 'prices', label: 'Updating price history', status: 'pending' },
    { id: 'load', label: 'Loading updated data', status: 'pending' },
  ]);

  const { steamId } = useAuth();
  const { items, isLoading, refetch, totalValue, invalidate } = usePortfolio();
  const { history, isLoading: isLoadingHistory, refetch: refetchHistory } = usePortfolioHistory(selectedDays);

  const valueChange = useMemo(() => {
    if (!history || history.length < 2) {
      return undefined;
    }

    const currentValue = history[history.length - 1].total_value;
    const firstValue = history[0].total_value;
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
    if (!steamId || isRefreshing) { return; }

    if (storage.isOnCooldown('inventory_sync')) {
      const remaining = Math.ceil(storage.getCooldownRemaining('inventory_sync') / 1000);
      Alert.alert('Cooldown', `Please wait ${remaining}s before refreshing again.`);
      return;
    }

    setIsRefreshing(true);
    resetSteps();

    try {
      // TODO: Wire to Steam sync service (Passo 5)
      updateStep('sync', 'processing');
      await new Promise(r => setTimeout(r, 500));
      updateStep('sync', 'completed');

      updateStep('prices', 'processing');
      await new Promise(r => setTimeout(r, 500));
      updateStep('prices', 'completed');

      updateStep('load', 'processing');
      invalidate();
      await refetch();
      await refetchHistory();
      updateStep('load', 'completed');

      storage.setCooldown('inventory_sync');
    } catch (error) {
      setIsRefreshing(false);
      resetSteps();
      Alert.alert('Error', 'Could not update data. Please try again.');
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

  if (isLoading && items.length === 0) {
    return (
      <Screen showPremiumBackground={false}>
        <Loading fullScreen message="Loading portfolio..." />
      </Screen>
    );
  }

  const currentStepIndex = refreshSteps.findIndex(step => step.status === 'processing');
  const currentStep = currentStepIndex >= 0 ? currentStepIndex : refreshSteps.length - 1;

  return (
    <View style={styles.screenContainer}>
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
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: safeSpacing.md,
    paddingTop: safeSpacing.xl,
    paddingBottom: safeSpacing.xxl * 2,
    zIndex: 1,
  },
});
