import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography } from '@theme';
import { formatCurrency } from '@utils/currency';
import { CompareIcon } from '@components/common';
import type { Snapshot } from '@services/snapshots';

interface ComparisonSelectModeProps {
  firstSnapshot: Snapshot;
  isLoading?: boolean;
}

export const ComparisonSelectMode: React.FC<ComparisonSelectModeProps> = ({
  firstSnapshot,
  isLoading,
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    }).toUpperCase();
  };

  // O loading agora é tratado pelo LoadingModal no componente pai
  if (isLoading) {
    return null; // Retornar null quando estiver carregando (o modal vai aparecer)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <CompareIcon size={24} color="#d4c291" strokeWidth={2.5} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Comparison Mode</Text>
          <Text style={styles.subtitle}>
            Selecione outro snapshot na lista abaixo para comparar
          </Text>
        </View>
      </View>
      <View style={styles.firstSnapshotCard}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Snapshot Base</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            {firstSnapshot.description ? (
              <Text style={styles.snapshotTitle} numberOfLines={2}>
                {firstSnapshot.description}
              </Text>
            ) : (
              <Text style={styles.snapshotTitle}>
                Snapshot de {formatDate(firstSnapshot.snapshot_date)}
              </Text>
            )}
            <View style={styles.snapshotMeta}>
              <Text style={styles.snapshotMetaText}>
                {formatDate(firstSnapshot.snapshot_date)}
              </Text>
              <Text style={styles.snapshotMetaSeparator}>•</Text>
              <Text style={styles.snapshotMetaText}>
                {firstSnapshot.item_count || 0} {firstSnapshot.item_count === 1 ? 'item' : 'itens'}
              </Text>
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.snapshotValue}>{formatCurrency(firstSnapshot.total_value)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: spacing.lg,
    margin: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a2a', // Cinza escuro em vez de dourado
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.md + 2,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    fontFamily: typography.fonts.primaryBold,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: '#9CA3AF',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
    lineHeight: 20,
  },
  firstSnapshotCard: {
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: '#d4c291',
    shadowColor: '#d4c291',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a2a2a', // Cinza escuro em vez de dourado
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.4)',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#d4c291',
    fontFamily: typography.fonts.secondaryBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  snapshotTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    fontFamily: typography.fonts.primaryBold,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  snapshotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    flexWrap: 'wrap',
  },
  snapshotMetaText: {
    fontSize: typography.sizes.xs,
    color: '#9CA3AF',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
  },
  snapshotMetaSeparator: {
    fontSize: typography.sizes.xs,
    color: '#9CA3AF',
    marginHorizontal: spacing.xs / 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  snapshotValue: {
    fontSize: typography.sizes.lg + 2,
    fontWeight: typography.weights.bold,
    color: '#d4c291',
    fontFamily: typography.fonts.primaryBold,
    letterSpacing: 0.3,
  },
});

