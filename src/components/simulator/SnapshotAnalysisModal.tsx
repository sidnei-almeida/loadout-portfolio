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
import { colors, spacing, typography } from '@theme';
import {
  getSnapshotAnalysis,
  compareSnapshots,
  type Snapshot,
  type SnapshotAnalysis,
  type SnapshotComparison,
} from '@services/snapshots';

// Helper para garantir valores seguros
const safeTypography = typography || {
  fonts: { secondary: 'Rajdhani' },
  weights: { medium: '500' },
  sizes: { md: 15 },
};
const safeColors = colors || { text: '#FFFFFF' };

interface SnapshotAnalysisModalProps {
  visible: boolean;
  snapshot: Snapshot | null;
  snapshots: Snapshot[];
  token: string | null;
  onClose: () => void;
}

export const SnapshotAnalysisModal: React.FC<SnapshotAnalysisModalProps> = ({
  visible,
  snapshot,
  snapshots,
  token,
  onClose,
}) => {
  const [analysis, setAnalysis] = useState<SnapshotAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [firstSnapshot, setFirstSnapshot] = useState<Snapshot | null>(null);
  const [comparison, setComparison] = useState<SnapshotComparison | null>(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);

  const loadAnalysis = useCallback(async () => {
    if (!snapshot || !token) {
      setAnalysis(null);
      return;
    }

    setIsLoadingAnalysis(true);
    setAnalysis(null);
    try {
      const analysisData = await getSnapshotAnalysis(token, snapshot.id);
      setAnalysis(analysisData);
      setFirstSnapshot(snapshot); // Definir como primeiro snapshot para comparação
    } catch (error) {
      console.error('[MODAL] Erro ao carregar análise:', error);
      Alert.alert(
        'Error',
        'Could not load snapshot analysis. Please try again.'
      );
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [snapshot, token]);

  useEffect(() => {
    if (visible && snapshot) {
      loadAnalysis();
      setComparisonMode(false);
      setComparison(null);
      setFirstSnapshot(snapshot);
    } else if (!visible) {
      // Resetar ao fechar
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
    // Voltar para análise What-If do snapshot original
    if (snapshot) {
      loadAnalysis();
    }
  };

  const handleSecondSnapshotSelect = async (secondSnapshot: Snapshot) => {
    if (!token || !firstSnapshot) return;

    if (secondSnapshot.id === firstSnapshot.id) {
      Alert.alert('Notice', 'Select a different snapshot to compare.');
      return;
    }

    setIsLoadingComparison(true);
    setComparison(null);

    try {
      const comparisonData = await compareSnapshots(
        token,
        firstSnapshot.id,
        secondSnapshot.id
      );
      setComparison(comparisonData);
    } catch (error) {
      console.error('[MODAL] Erro ao comparar snapshots:', error);
      Alert.alert(
        'Error',
        'Could not compare snapshots. Please try again.'
      );
      handleExitComparisonMode();
    } finally {
      setIsLoadingComparison(false);
    }
  };

  if (!snapshot) return null;

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const bottomNavBarHeight = Platform.OS === 'android' ? 60 : 0; // Altura aproximada do menu de navegação

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: statusBarHeight + spacing.xs }]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {comparisonMode ? 'Compare Snapshots' : 'Snapshot Analysis'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {!comparisonMode && snapshots.length > 1 && (
              <TouchableOpacity onPress={handleComparePress} style={styles.compareHeaderButton}>
                <CompareIcon size={22} color="#d4c291" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <Text style={styles.closeButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {comparisonMode && !comparison && !isLoadingComparison ? (
          // Modo Comparação: seleção de snapshot (usa View com FlatList, sem ScrollView)
          <View style={[styles.content, { paddingBottom: bottomNavBarHeight }]}>
            <ComparisonSelectMode firstSnapshot={firstSnapshot!} isLoading={false} />
            <View style={styles.snapshotsListContainer}>
              <Text style={styles.selectSnapshotTitle}>
                Select another snapshot
              </Text>
              <SnapshotsList
                snapshots={snapshots.filter(s => s.id !== firstSnapshot?.id)}
                isLoading={false}
                onSnapshotPress={handleSecondSnapshotSelect}
                onDeleteSnapshot={undefined}
              />
            </View>
          </View>
        ) : (
          // Outros casos: usa ScrollView
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: bottomNavBarHeight + spacing.md }}
          >
            {comparisonMode ? (
              // Modo Comparação
              comparison ? (
                <>
                  <View style={styles.backButtonContainer}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handleExitComparisonMode}
                    >
                      <View style={styles.backButtonContent}>
                        <ArrowLeftIcon size={18} color="#d4c291" strokeWidth={2} />
                        <Text style={styles.backButtonText}>Back to Analysis</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <ComparisonResults comparison={comparison} />
                </>
              ) : (
                // Mostrar seleção de snapshot quando não estiver carregando comparação
                <ComparisonSelectMode firstSnapshot={firstSnapshot!} isLoading={false} />
              )
            ) : analysis ? (
              // Análise What-If
              <WhatIfSimulator
                snapshot={snapshot}
                analysis={analysis}
                currentPortfolioValue={0}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Error loading analysis</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Loading Modal para análise */}
        <LoadingModal
          visible={isLoadingAnalysis}
          title="LOADING ANALYSIS"
          message="Processing snapshot data..."
        />

        {/* Loading Modal para comparação */}
        <LoadingModal
          visible={isLoadingComparison && comparisonMode}
          title="COMPARING SNAPSHOTS"
          message="Analyzing differences between snapshots..."
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Tactical Gold background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 194, 145, 0.2)', // Tactical Gold 20% opacity
    backgroundColor: '#121212',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    fontFamily: typography.fonts.primaryBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  compareHeaderButton: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  closeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  closeButtonText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.secondarySemiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 400,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontFamily: typography.fonts.secondary,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backButtonContainer: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    backgroundColor: 'transparent',
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)',
  },
  backButtonText: {
    fontSize: safeTypography.sizes.md,
    fontWeight: safeTypography.weights.semiBold,
    color: '#d4c291',
    fontFamily: safeTypography.fonts.secondaryBold,
    letterSpacing: 0.5,
  },
  snapshotsListContainer: {
    flex: 1,
    marginTop: spacing.sm,
  },
  selectSnapshotTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    fontFamily: typography.fonts.primaryBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

