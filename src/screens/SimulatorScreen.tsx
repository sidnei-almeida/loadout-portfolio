import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { Screen } from '@components/common/Screen';
import {
  SnapshotsList,
  CreateSnapshotModal,
  SnapshotAnalysisModal,
} from '@components/simulator';
import { PlusIcon } from '@components/common/Icons';
import { colors, spacing, typography } from '@theme';
import { useAuth } from '@hooks/useAuth';
import { useCustomAlert } from '@components/common/CustomAlertDialog';
import {
  listSnapshots,
  createSnapshot,
  deleteSnapshot,
  type Snapshot,
} from '@services/snapshots';

export const SimulatorScreen: React.FC = () => {
  // All hooks must be called in the same order on every render
  const { token } = useAuth();
  const { showAlert, AlertDialog } = useCustomAlert();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  // Calcular altura da status bar para Android
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  // All useCallback hooks must come before useEffect
  const loadSnapshots = useCallback(async () => {
    if (!token) return;

    setIsLoadingSnapshots(true);
    try {
      const data = await listSnapshots(token);
      setSnapshots(data);
    } catch (error) {
      console.error('[SIMULATOR] Erro ao carregar snapshots:', error);
      showAlert(
        'Error',
        'Could not load snapshots. Please try again.',
        'error'
      );
    } finally {
      setIsLoadingSnapshots(false);
    }
  }, [token]);

  const handleSnapshotPress = useCallback((snapshot: Snapshot) => {
    setSelectedSnapshot(snapshot);
    setIsModalVisible(true);
  }, []);

  const handleCreateSnapshot = useCallback(async (description: string, icon?: string) => {
    if (!token) return;

    try {
      await createSnapshot(token, description, icon);
      await loadSnapshots();
      showAlert('Success', 'Snapshot created successfully.', 'success');
    } catch (error) {
      console.error('[SIMULATOR] Erro ao criar snapshot:', error);
      throw error;
    }
  }, [token, loadSnapshots]);

  const handleDeleteSnapshot = useCallback(async (snapshotId: string) => {
    if (!token) return;

    // Identificar o primeiro snapshot (mais antigo)
    const firstSnapshot = snapshots.length > 0 
      ? [...snapshots].sort((a, b) => 
          new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
        )[0]
      : null;

    // Verificar se é o primeiro snapshot
    if (firstSnapshot && firstSnapshot.id === snapshotId) {
      showAlert(
        'Cannot delete',
        'The first snapshot cannot be deleted because it is needed to calculate inventory profit/loss.',
        'warning'
      );
      return;
    }

    showAlert(
      'Confirm delete',
      'Are you sure you want to delete this snapshot? This action cannot be undone.',
      'warning',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSnapshot(token, snapshotId);
              setSelectedSnapshot((current) => {
                if (current?.id === snapshotId) {
                  setIsModalVisible(false);
                  return null;
                }
                return current;
              });
              await loadSnapshots();
              showAlert('Success', 'Snapshot deleted successfully.', 'success');
            } catch (error: any) {
              console.error('[SIMULATOR] Erro ao excluir snapshot:', error);
              
              // Verificar se é erro 403 (proteção do primeiro snapshot)
              if (error?.response?.status === 403 || error?.message?.includes('primeiro snapshot')) {
                showAlert(
                  'Cannot delete',
                  'The first snapshot cannot be deleted because it is needed to calculate inventory profit/loss.',
                  'warning'
                );
              } else {
                showAlert(
                  'Error',
                  'Could not delete the snapshot. Please try again.',
                  'error'
                );
              }
            }
          },
        },
      ]
    );
  }, [token, loadSnapshots, showAlert, snapshots]);

  // useEffect hooks must come after all useCallback hooks
  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  return (
    <Screen showPremiumBackground={false}>
      <View style={styles.container}>
        {/* Content - Apenas lista de snapshots */}
        <View style={styles.content}>
          <View style={[styles.listHeader, { paddingTop: statusBarHeight + spacing.md }]}>
            <View style={styles.headerTop}>
              <View style={styles.titleContainer}>
                <Text style={styles.listTitle}>Historical Snapshots</Text>
                <Text style={styles.snapshotsCount}>
                  {snapshots.length} {snapshots.length === 1 ? 'snapshot' : 'snapshots'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setIsCreateModalVisible(true)}
                activeOpacity={0.7}
              >
                <PlusIcon size={18} color="#d4c291" strokeWidth={2} />
                <Text style={styles.createButtonLabel}>NEW</Text>
              </TouchableOpacity>
            </View>
          </View>

          <SnapshotsList
            snapshots={snapshots}
            isLoading={isLoadingSnapshots}
            onSnapshotPress={handleSnapshotPress}
            onDeleteSnapshot={handleDeleteSnapshot}
            firstSnapshotId={
              snapshots.length > 0
                ? [...snapshots].sort((a, b) => 
                    new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
                  )[0].id
                : null
            }
          />
        </View>

        {/* Create Snapshot Modal */}
        <CreateSnapshotModal
          visible={isCreateModalVisible}
          onClose={() => setIsCreateModalVisible(false)}
          onSubmit={handleCreateSnapshot}
        />

        {/* Snapshot Analysis Modal */}
        <SnapshotAnalysisModal
          visible={isModalVisible}
          snapshot={selectedSnapshot}
          snapshots={snapshots}
          token={token}
          onClose={() => {
            setIsModalVisible(false);
            setSelectedSnapshot(null);
          }}
        />

        {/* Custom Alert Dialog */}
        <AlertDialog />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Transparente para o vídeo aparecer
  },
  content: {
    flex: 1,
  },
  listHeader: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 194, 145, 0.15)',
    backgroundColor: '#121212',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  listTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    fontFamily: typography.fonts.primaryBold,
    letterSpacing: 0.3,
  },
  snapshotsCount: {
    fontSize: typography.sizes.xs,
    color: '#9CA3AF',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', // Fundo transparente para elegância
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm + 4,
    borderRadius: 8,
    gap: spacing.xs / 2 + 2,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 194, 145, 0.4)', // Borda dourada sutil
    minHeight: 40,
  },
  createButtonLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: '#d4c291', // Texto dourado para combinar com o ícone
    fontFamily: typography.fonts.secondarySemiBold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});
