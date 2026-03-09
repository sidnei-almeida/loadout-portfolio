/**
 * SnapshotAnalysisModal — Local-First version.
 *
 * Replaces all backend API calls with local analytics services.
 * Uses an adapter to map the new WhatIfResult to the old SnapshotAnalysis
 * shape that WhatIfSimulator and ComparisonResults already render.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import {
  WhatIfSimulator,
  ComparisonSelectMode,
  ComparisonResults,
  SnapshotsList,
} from './index';
import { CompareIcon, ArrowLeftIcon, LoadingModal } from '@components/common';
import { useLanguage } from '@contexts/LanguageContext';
import { colors, spacing, typography } from '@theme';
import {
  calculateWhatIf,
  compareSnapshots as localCompare,
  type WhatIfResult,
  type SnapshotComparison as LocalComparison,
} from '../../services/analytics/snapshotAnalytics';
import type { SnapshotRow } from '../../database/repositories/snapshotRepo';
import type { SnapshotAnalysis, SnapshotComparison } from '@types/snapshot';
import { logger } from '@utils/logger';

const safeTypography = typography || {
  fonts: { secondary: 'Rajdhani', secondaryBold: 'Rajdhani-Bold', secondarySemiBold: 'Rajdhani-SemiBold', primaryBold: 'Orbitron-Bold' },
  weights: { medium: '500', semiBold: '600', bold: '700' },
  sizes: { xs: 11, sm: 13, md: 15 },
};

// ---------------------------------------------------------------------------
// Adapters — map local analytics types to the shapes the UI components expect
// ---------------------------------------------------------------------------

function adaptWhatIf(r: WhatIfResult): SnapshotAnalysis {
  return {
    snapshot_date: r.snapshotDate,
    original_value: r.originalValue,
    projected_value: r.projectedValue,
    current_value: r.currentValue,
    absolute_gain: r.absoluteGain,
    roi_percent: r.roiPercent,
    simulated_vs_original: r.simulatedVsOriginal,
    current_vs_simulated: r.currentVsSimulated,
    top_movers: [
      ...r.topGainers.map(m => ({ name: m.name, change_absolute: m.changeAbsolute, change_percent: m.changePercent })),
      ...r.topLosers.map(m => ({ name: m.name, change_absolute: m.changeAbsolute, change_percent: m.changePercent })),
    ],
    items: r.items.map(i => ({
      market_hash_name: i.marketHashName,
      original_price: i.originalPrice,
      current_price: i.currentPrice,
      quantity: i.quantity,
      image_url: i.imageUrl || null,
    })),
    liquidity_score: 0,
    liquidity_label: 'N/A',
    volatility_value: 0,
    volatility_label: 'N/A',
  };
}

function adaptComparison(c: LocalComparison): SnapshotComparison {
  return {
    older_snapshot: { id: c.older.id, date: c.older.date, value: c.older.value, item_count: c.older.itemCount },
    newer_snapshot: { id: c.newer.id, date: c.newer.date, value: c.newer.value, item_count: c.newer.itemCount },
    value_change: c.valueChange,
    value_change_percent: c.valueChangePercent,
    item_count_change: c.itemCountChange,
    added_items: c.addedItems.map(i => ({ name: i.name, quantity: i.quantity, value: i.value, image_url: i.imageUrl || null })),
    removed_items: c.removedItems.map(i => ({ name: i.name, quantity: i.quantity, value: i.value, image_url: i.imageUrl || null })),
    changed_items: c.changedItems.map(i => ({
      name: i.name, old_quantity: i.oldQuantity, new_quantity: i.newQuantity,
      quantity_change: i.quantityChange, image_url: i.imageUrl || null,
    })),
    summary: { items_added: c.summary.added, items_removed: c.summary.removed, items_changed: c.summary.changed },
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SnapshotAnalysisModalProps {
  visible: boolean;
  snapshot: SnapshotRow | null;
  snapshots: SnapshotRow[];
  onClose: () => void;
}

export const SnapshotAnalysisModal: React.FC<SnapshotAnalysisModalProps> = ({
  visible,
  snapshot,
  snapshots,
  onClose,
}) => {
  const { t } = useLanguage();
  const [analysis, setAnalysis] = useState<SnapshotAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [firstSnapshot, setFirstSnapshot] = useState<SnapshotRow | null>(null);
  const [comparison, setComparison] = useState<SnapshotComparison | null>(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);

  const loadAnalysis = useCallback(() => {
    if (!snapshot) {
      setAnalysis(null);
      return;
    }

    setIsLoadingAnalysis(true);
    setAnalysis(null);

    try {
      const result = calculateWhatIf(snapshot.id);
      if (result) {
        setAnalysis(adaptWhatIf(result));
      }
      setFirstSnapshot(snapshot);
    } catch (error) {
      logger.error('[MODAL] Error loading analysis:', error);
      Alert.alert(t('error'), t('errorLoadAnalysisMessage'));
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [snapshot]);

  useEffect(() => {
    if (visible && snapshot) {
      loadAnalysis();
      setComparisonMode(false);
      setComparison(null);
      setFirstSnapshot(snapshot);
    } else if (!visible) {
      setAnalysis(null);
      setComparisonMode(false);
      setComparison(null);
      setFirstSnapshot(null);
    }
  }, [visible, snapshot, loadAnalysis]);

  const handleComparePress = () => {
    if (snapshots.length < 2) {
      Alert.alert('Notice', 'You need at least 2 snapshots to compare.');
      return;
    }
    setComparisonMode(true);
    setComparison(null);
    setFirstSnapshot(snapshot);
  };

  const handleExitComparisonMode = () => {
    setComparisonMode(false);
    setComparison(null);
    if (snapshot) {
      loadAnalysis();
    }
  };

  const handleSecondSnapshotSelect = (secondSnapshot: SnapshotRow) => {
    if (!firstSnapshot) { return; }

    if (secondSnapshot.id === firstSnapshot.id) {
      Alert.alert('Notice', 'Select a different snapshot to compare.');
      return;
    }

    setIsLoadingComparison(true);
    setComparison(null);

    try {
      const result = localCompare(firstSnapshot.id, secondSnapshot.id);
      if (result) {
        setComparison(adaptComparison(result));
      }
    } catch (error) {
      logger.error('[MODAL] Error comparing snapshots:', error);
      Alert.alert(t('error'), t('errorCompareMessage'));
      handleExitComparisonMode();
    } finally {
      setIsLoadingComparison(false);
    }
  };

  if (!snapshot) { return null; }

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const bottomNavBarHeight = Platform.OS === 'android' ? 60 : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose} statusBarTranslucent={true}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: statusBarHeight + spacing.xs }]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {comparisonMode ? t('compareSnapshots') : t('snapshotAnalysis')}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {!comparisonMode && snapshots.length > 1 && (
              <TouchableOpacity onPress={handleComparePress} style={styles.compareHeaderButton}>
                <CompareIcon size={22} color="#d4c291" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <Text style={styles.closeButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {comparisonMode && !comparison && !isLoadingComparison ? (
          <View style={[styles.content, { paddingBottom: bottomNavBarHeight }]}>
            <ComparisonSelectMode firstSnapshot={firstSnapshot!} isLoading={false} />
            <View style={styles.snapshotsListContainer}>
              <Text style={styles.selectSnapshotTitle}>{t('selectAnotherSnapshot')}</Text>
              <SnapshotsList
                snapshots={snapshots.filter(s => s.id !== firstSnapshot?.id)}
                isLoading={false}
                onSnapshotPress={handleSecondSnapshotSelect}
                onDeleteSnapshot={undefined}
              />
            </View>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomNavBarHeight + spacing.md }}>
            {comparisonMode ? (
              comparison ? (
                <>
                  <View style={styles.backButtonContainer}>
                    <TouchableOpacity style={styles.backButton} onPress={handleExitComparisonMode}>
                      <View style={styles.backButtonContent}>
                        <ArrowLeftIcon size={18} color="#d4c291" strokeWidth={2} />
                        <Text style={styles.backButtonText}>{t('backToAnalysis')}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <ComparisonResults comparison={comparison} />
                </>
              ) : (
                <ComparisonSelectMode firstSnapshot={firstSnapshot!} isLoading={false} />
              )
            ) : analysis ? (
              <WhatIfSimulator snapshot={snapshot} analysis={analysis} currentPortfolioValue={0} />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('errorLoadingAnalysis')}</Text>
              </View>
            )}
          </ScrollView>
        )}

        <LoadingModal visible={isLoadingAnalysis} title={t('loadingAnalysis')} message={t('processingSnapshotData')} />
        <LoadingModal visible={isLoadingComparison && comparisonMode} title={t('comparingSnapshots')} message={t('analyzingDifferences')} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingBottom: spacing.xs,
    borderBottomWidth: 1, borderBottomColor: 'rgba(212, 194, 145, 0.2)', backgroundColor: '#121212',
  },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: '#FFFFFF', fontFamily: typography.fonts.primaryBold, letterSpacing: 0.5, textTransform: 'uppercase' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  compareHeaderButton: { padding: spacing.xs, justifyContent: 'center', alignItems: 'center', minWidth: 40 },
  closeButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  closeButtonText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.secondarySemiBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  content: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, minHeight: 400 },
  emptyText: { fontSize: typography.sizes.md, color: colors.textSecondary, fontFamily: typography.fonts.secondary },
  backButtonContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backButtonContainer: { padding: spacing.md, paddingBottom: spacing.sm },
  backButton: { backgroundColor: 'transparent', padding: spacing.md, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212, 194, 145, 0.2)' },
  backButtonText: { fontSize: safeTypography.sizes.md, fontWeight: safeTypography.weights.semiBold, color: '#d4c291', fontFamily: safeTypography.fonts.secondaryBold, letterSpacing: 0.5 },
  snapshotsListContainer: { flex: 1, marginTop: spacing.sm },
  selectSnapshotTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: '#FFFFFF', marginBottom: spacing.md, paddingHorizontal: spacing.md, fontFamily: typography.fonts.primaryBold, letterSpacing: 0.5, textTransform: 'uppercase' },
});
