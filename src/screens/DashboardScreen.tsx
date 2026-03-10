import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@components/common/Screen';
import { Loading } from '@components/common/Loading';
import { RefreshProgressModal } from '@components/common/RefreshProgressModal';
import { ValueCard, PortfolioChart, ItemsList } from '@components/portfolio';
import { ItemDetailModal } from '@components/items/ItemDetailModal';
import { usePortfolio } from '@hooks/usePortfolio';
import { usePortfolioHistory } from '@hooks/usePortfolioHistory';
import { useAuth } from '@hooks/useAuth';
import { useLanguage } from '@contexts/LanguageContext';
import { useTacticalToast } from '@contexts/TacticalToastContext';
import { spacing, typography } from '@theme';
import { logger } from '@utils/logger';
import { syncInventory, syncPrices, syncProfile } from '@services/sync';
import { getCatalog } from '../database/repositories/catalogRepo';
import { getItemCount, getInventory, getTotalValue } from '../database/repositories/inventoryRepo';
import { createSnapshot, type SnapshotItemInput } from '../database/repositories/snapshotRepo';
import type { Item } from '@types/item';

const safeSpacing = spacing || { md: 16, xl: 20, xxl: 28 };
const PROFILE_QUERY_KEY = ['profile-card'] as const;

type RefreshStepStatus = 'pending' | 'processing' | 'completed';

interface RefreshStep {
  id: string;
  label: string;
  status: RefreshStepStatus;
}

export const DashboardScreen: React.FC = () => {
  const { t } = useLanguage();
  const { showCooldown, showError } = useTacticalToast();
  const queryClient = useQueryClient();
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSteps, setRefreshSteps] = useState<RefreshStep[]>(() => [
    { id: 'sync', label: t('syncingInventory'), status: 'pending' },
    { id: 'prices', label: t('updatingPrices'), status: 'pending' },
    { id: 'profile', label: t('syncingProfile'), status: 'pending' },
    { id: 'load', label: t('loadingData'), status: 'pending' },
  ]);

  const { steamId } = useAuth();
  const { items, isLoading, refetch, totalValue, invalidate } = usePortfolio();
  const { history, isLoading: isLoadingHistory, refetch: refetchHistory } = usePortfolioHistory(selectedDays);

  const valueChange = useMemo(() => {
    if (!history || !Array.isArray(history) || history.length < 2) {
      return undefined;
    }

    const currentValue = Number(history[history.length - 1]?.total_value) || 0;
    const firstValue = Number(history[0]?.total_value) || 0;
    const changeValue = currentValue - firstValue;
    const changePercent = firstValue > 0 ? (changeValue / firstValue) * 100 : 0;

    if (typeof changeValue !== 'number' || !Number.isFinite(changeValue)) {
      return undefined;
    }

    return {
      value: changeValue,
      percent: Number.isFinite(changePercent) ? changePercent : 0,
    };
  }, [history]);

  const updateStep = useCallback((stepId: string, status: RefreshStepStatus) => {
    setRefreshSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status } : step
    ));
  }, []);

  const resetSteps = useCallback(() => {
    setRefreshSteps([
      { id: 'sync', label: t('syncingInventory'), status: 'pending' },
      { id: 'prices', label: t('updatingPrices'), status: 'pending' },
      { id: 'profile', label: t('syncingProfile'), status: 'pending' },
      { id: 'load', label: t('loadingData'), status: 'pending' },
    ]);
  }, [t]);

  const handleRefreshComplete = useCallback(() => {
    setIsRefreshing(false);
    resetSteps();
  }, [resetSteps]);

  const handleRefresh = async () => {
    if (!steamId || isRefreshing) { return; }

    setIsRefreshing(true);
    resetSteps();

    try {
      // Step 1: Sync inventory from Steam
      updateStep('sync', 'processing');
      try {
        await syncInventory(steamId);
      } catch (err: any) {
        if (err?.message?.startsWith('COOLDOWN:')) {
          showCooldown(err.message);
          setIsRefreshing(false);
          resetSteps();
          return;
        }
        logger.warn('[Dashboard] Inventory sync failed:', err?.message);
      }
      updateStep('sync', 'completed');

      // Step 2: Sync prices for cataloged skins
      updateStep('prices', 'processing');
      try {
        const catalog = getCatalog();
        const names = catalog.map(s => s.market_hash_name);
        if (names.length > 0) {
          await syncPrices(names);
        }
      } catch (err: any) {
        if (err?.message?.startsWith('COOLDOWN:')) {
          showCooldown(err.message);
        } else {
          logger.warn('[Dashboard] Price sync failed:', err?.message);
        }
      }
      updateStep('prices', 'completed');

      // Step 3: Sync profile (name + avatar)
      updateStep('profile', 'processing');
      try {
        await syncProfile(steamId);
        queryClient.invalidateQueries({ queryKey: [...PROFILE_QUERY_KEY] });
      } catch (err: any) {
        if (err?.message?.startsWith('COOLDOWN:')) {
          showCooldown(err.message);
        } else {
          logger.warn('[Dashboard] Profile sync failed:', err?.message);
        }
      }
      updateStep('profile', 'completed');

      // Step 4: Reload local data + auto-snapshot
      updateStep('load', 'processing');

      const count = getItemCount();
      if (count > 0) {
        try {
          const inv = getInventory();
          const totalVal = getTotalValue();
          const snapshotItems: SnapshotItemInput[] = inv.map(row => ({
            market_hash_name: row.market_hash_name,
            original_price: row.current_price,
            quantity: row.quantity,
          }));
          const today = new Date().toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          });
          createSnapshot(
            {
              description: `Automatic - ${today}`,
              icon: 'refresh',
              total_value: totalVal,
              total_invested: totalVal,
              item_count: count,
            },
            snapshotItems,
          );
          logger.log(`[Dashboard] Auto-snapshot: ${count} items, $${totalVal.toFixed(2)}`);
        } catch (err: any) {
          logger.warn('[Dashboard] Auto-snapshot failed:', err?.message);
        }
      }

      invalidate();
      await refetch();
      await refetchHistory();
      updateStep('load', 'completed');

    } catch (error) {
      logger.error('[Dashboard] Refresh failed:', error);
      setIsRefreshing(false);
      resetSteps();
      showError(t('errorUpdateData'));
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
      <Screen>
        <Loading fullScreen message={t('loadingPortfolio')} />
      </Screen>
    );
  }

  const currentStepIndex = refreshSteps.findIndex(step => step.status === 'processing');
  const currentStep = currentStepIndex >= 0 ? currentStepIndex : refreshSteps.length - 1;

  if (!isLoading && items.length === 0 && !isRefreshing) {
    return (
      <View style={styles.screenContainer}>
        <Screen style={styles.scrollContent}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>{t('noInventoryData')}</Text>
            <Text style={styles.emptySubtitle}>{t('noInventorySubtitle')}</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleRefresh}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyButtonText}>{t('syncNow')}</Text>
            </TouchableOpacity>
          </View>
        </Screen>

        <RefreshProgressModal
          visible={isRefreshing}
          currentStep={currentStep}
          steps={refreshSteps}
          onComplete={handleRefreshComplete}
        />
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <Screen scrollable style={styles.scrollContent}>
        <ValueCard
          totalValue={Number(totalValue) || 0}
          change={valueChange}
          onRefresh={handleRefresh}
          isLoading={isLoading || isRefreshing}
        />

        <PortfolioChart
          history={Array.isArray(history) ? history : []}
          isLoading={isLoadingHistory}
          selectedDays={selectedDays}
          onDaysChange={setSelectedDays}
        />

        <ItemsList
          items={Array.isArray(items) ? items : []}
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

const safeTypography = typography || {
  fonts: { secondaryBold: 'Rajdhani-Bold', secondaryRegular: 'Rajdhani-Regular' },
  weights: { bold: '700' },
  sizes: { md: 15, sm: 13 },
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: safeSpacing.xl,
    paddingTop: 120,
    gap: safeSpacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: safeTypography.fonts.secondaryBold,
    fontWeight: safeTypography.weights.bold,
    color: '#D4C291',
    letterSpacing: 2,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: safeTypography.sizes.sm,
    fontFamily: safeTypography.fonts.secondaryRegular,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: safeSpacing.md,
  },
  emptyButton: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#D4C291',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyButtonText: {
    fontSize: safeTypography.sizes.md,
    fontFamily: safeTypography.fonts.secondaryBold,
    fontWeight: safeTypography.weights.bold,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
