import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { Screen } from '@components/common/Screen';
import { logger } from '@utils/logger';
import {
  SnapshotsList,
  CreateSnapshotModal,
  SnapshotAnalysisModal,
} from '@components/simulator';
import { PlusIcon } from '@components/common/Icons';
import { useLanguage } from '@contexts/LanguageContext';
import { spacing, typography } from '@theme';
import { useAuth } from '@hooks/useAuth';
import { useSnapshots } from '@hooks/useSnapshots';
import { useCustomAlert } from '@components/common/CustomAlertDialog';
import type { SnapshotRow } from '../database/repositories/snapshotRepo';

export const SimulatorScreen: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { showAlert, AlertDialog } = useCustomAlert();
  const {
    snapshots,
    isLoading: isLoadingSnapshots,
    createSnapshot,
    deleteSnapshot,
  } = useSnapshots();

  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotRow | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  const handleSnapshotPress = useCallback((snapshot: SnapshotRow) => {
    setSelectedSnapshot(snapshot);
    setIsModalVisible(true);
  }, []);

  const handleCreateSnapshot = useCallback(async (description: string, icon?: string) => {
    if (!isAuthenticated) { return; }

    try {
      await createSnapshot({ description, icon });
      showAlert('Success', 'Snapshot created successfully.', 'success');
    } catch (error) {
      logger.error('[SIMULATOR] Error creating snapshot:', error);
      throw error;
    }
  }, [isAuthenticated, createSnapshot, showAlert]);

  const handleDeleteSnapshot = useCallback(async (snapshotId: string) => {
    if (!isAuthenticated) { return; }

    const firstSnapshot = snapshots.length > 0
      ? [...snapshots].sort((a, b) =>
          new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
        )[0]
      : null;

    if (firstSnapshot && firstSnapshot.id === snapshotId) {
      showAlert(
        t('cannotDeleteFirstSnapshotTitle'),
        t('cannotDeleteFirstSnapshotMessage'),
        'warning',
      );
      return;
    }

    showAlert(
      t('confirmDeleteSnapshotTitle'),
      t('confirmDeleteSnapshotMessage'),
      'warning',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSnapshot(snapshotId);
              setSelectedSnapshot(current => {
                if (current?.id === snapshotId) {
                  setIsModalVisible(false);
                  return null;
                }
                return current;
              });
              showAlert(t('sessionSuccess'), t('snapshotDeletedSuccess'), 'success');
            } catch (error) {
              showAlert(t('error'), t('errorDeleteSnapshot'), 'error');
            }
          },
        },
      ],
    );
  }, [isAuthenticated, snapshots, deleteSnapshot, showAlert]);

  return (
    <Screen showPremiumBackground={false}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.listHeader, { paddingTop: statusBarHeight + spacing.md }]}>
            <View style={styles.headerTop}>
              <View style={styles.titleContainer}>
                <Text style={styles.listTitle}>{t('historicalSnapshots')}</Text>
                <Text style={styles.snapshotsCount}>
                  {snapshots.length} {snapshots.length === 1 ? t('snapshot') : t('snapshots')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setIsCreateModalVisible(true)}
                activeOpacity={0.7}
              >
                <PlusIcon size={18} color="#d4c291" strokeWidth={2} />
                <Text style={styles.createButtonLabel}>{t('newLabel')}</Text>
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

        <CreateSnapshotModal
          visible={isCreateModalVisible}
          onClose={() => setIsCreateModalVisible(false)}
          onSubmit={handleCreateSnapshot}
        />

        <SnapshotAnalysisModal
          visible={isModalVisible}
          snapshot={selectedSnapshot}
          snapshots={snapshots}
          onClose={() => {
            setIsModalVisible(false);
            setSelectedSnapshot(null);
          }}
        />

        <AlertDialog />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm + 4,
    borderRadius: 8,
    gap: spacing.xs / 2 + 2,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 194, 145, 0.4)',
    minHeight: 40,
  },
  createButtonLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: '#d4c291',
    fontFamily: typography.fonts.secondarySemiBold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});
