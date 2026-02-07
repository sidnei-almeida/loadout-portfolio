import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '@theme';
import { formatCurrency } from '@utils/currency';
import { DeleteIcon, PackageIcon, InventoryIcon } from '@components/common';
import type { Snapshot } from '@services/snapshots';

// Helper para garantir valores seguros
const safeTypography = typography || {
  weights: { medium: '500' },
  sizes: { sm: 13 },
};
const safeColors = colors || { text: '#FFFFFF' };

interface SnapshotsListProps {
  snapshots: Snapshot[];
  isLoading?: boolean;
  onSnapshotPress: (snapshot: Snapshot) => void;
  onDeleteSnapshot?: (snapshotId: string) => void;
  comparisonMode?: boolean;
  firstSnapshotId?: string | null;
  selectedSnapshotId?: string | null;
}

export const SnapshotsList: React.FC<SnapshotsListProps> = ({
  snapshots,
  isLoading,
  onSnapshotPress,
  onDeleteSnapshot,
  comparisonMode = false,
  firstSnapshotId = null,
  selectedSnapshotId = null,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Formato: "14 de dez. de 2023"
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const formattedDate = `${month} ${day}, ${year}`;

    return {
      formattedDate, // Data formatada para exibição
    };
  };

  const getSnapshotBadge = (description: string | null) => {
    if (!description) return { text: 'USER', type: 'user' };
    
    const isAuto = 
      description.toLowerCase().includes('automatic') ||
      description === 'Daily Automatic Snapshot';
    
    return {
      text: isAuto ? 'AUTO' : 'USER',
      type: isAuto ? 'auto' : 'user',
    };
  };

  const renderSnapshotItem = ({ item }: { item: Snapshot }) => {
    const { formattedDate } = formatDate(item.snapshot_date);
    const badge = getSnapshotBadge(item.description);
    const title = item.description?.trim() || `Snapshot from ${formattedDate}`;

    const isSelected = selectedSnapshotId === item.id;
    const isFirstSnapshot = firstSnapshotId === item.id;
    const isSelectable = comparisonMode && !isFirstSnapshot;

    return (
      <TouchableOpacity
        style={[
          styles.snapshotCard,
          isSelected && styles.snapshotCardSelected,
          isFirstSnapshot && styles.snapshotCardBase,
          isSelectable && styles.snapshotCardSelectable,
        ]}
        onPress={() => onSnapshotPress(item)}
        activeOpacity={0.7}
      >
        {/* Ícone de lixeira - Absolute no canto superior direito */}
        {/* Não mostrar botão de excluir se for o primeiro snapshot */}
        {onDeleteSnapshot && !isFirstSnapshot && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              onDeleteSnapshot(item.id);
            }}
            activeOpacity={0.7}
          >
            <DeleteIcon size={16} color="#E57373" strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {/* Badge AUTO/USER - Posicionado no canto superior esquerdo */}
        <View style={[styles.badge, badge.type === 'auto' ? styles.badgeAuto : styles.badgeUser]}>
          <Text style={styles.badgeText}>{badge.text}</Text>
        </View>

        <View style={styles.snapshotContent}>
          {/* Coluna da Esquerda: Identificação */}
          <View style={styles.snapshotInfo}>
            {/* Título */}
            <Text style={styles.snapshotTitle} numberOfLines={2}>
              {title}
            </Text>
            {/* Linha 2: Contagem de itens com ícone */}
            <View style={styles.itemCountRow}>
              <InventoryIcon size={14} color="#9CA3AF" strokeWidth={2} />
              <Text style={styles.snapshotItemCount}>
                {item.item_count} {item.item_count === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>

          {/* Coluna da Direita: Financeiro & Meta-dados */}
          <View style={styles.snapshotValues}>
            {/* Valor Principal */}
            <Text style={styles.snapshotTotalValue}>{formatCurrency(item.total_value)}</Text>
            {/* Data imediatamente abaixo do valor */}
            <Text style={styles.snapshotDate}>{formattedDate}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d4c291" />
        <Text style={styles.loadingText}>Loading snapshots...</Text>
      </View>
    );
  }

  if (snapshots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <PackageIcon size={48} color="#9CA3AF" strokeWidth={2} />
        <Text style={styles.emptyMessage}>No snapshots available</Text>
        <Text style={styles.emptySubtitle}>
          Snapshots will be generated automatically as you use the app.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listWrapper}>
      <FlatList
        data={snapshots.sort((a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime())}
        renderItem={renderSnapshotItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listWrapper: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md, // Espaçamento consistente entre cards
  },
  snapshotCard: {
    backgroundColor: '#1c1b19', // Tactical dark background
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.3)', // Tactical Gold elegante
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5, // Android shadow
    minHeight: 100,
  },
  snapshotCardSelected: {
    borderColor: 'rgba(212, 194, 145, 0.6)', // Tactical Gold mais visível quando selecionado
    borderWidth: 1, // Borda fina elegante
    backgroundColor: '#1f1f1f',
    shadowColor: '#d4c291',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  snapshotCardBase: {
    borderColor: 'rgba(212, 194, 145, 0.5)', // Tactical Gold elegante
    borderWidth: 1, // Borda fina elegante
    backgroundColor: '#1a1a1a',
    shadowColor: '#d4c291',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  snapshotCardSelectable: {
    borderColor: 'rgba(212, 194, 145, 0.3)', // Tactical Gold sutil
    borderWidth: 1, // Borda fina
    opacity: 1,
  },
  snapshotContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  snapshotInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  snapshotTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    fontFamily: typography.fonts.primaryBold,
    marginBottom: spacing.xs + 2,
    paddingTop: 24, // Espaço para o badge no topo
    lineHeight: 20,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.xs + 1,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 5,
    borderWidth: 0.5, // Borda bem fina minimalista
  },
  badgeAuto: {
    backgroundColor: 'transparent', // Fundo transparente minimalista
    borderColor: 'rgba(212, 194, 145, 0.3)', // Borda dourada sutil
  },
  badgeUser: {
    backgroundColor: 'transparent', // Fundo transparente minimalista
    borderColor: 'rgba(129, 199, 132, 0.3)', // Borda verde sutil
  },
  badgeText: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: typography.weights.medium,
    color: 'rgba(212, 194, 145, 0.7)', // Dourado mais sutil
    fontFamily: typography.fonts.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    marginTop: 2,
  },
  snapshotItemCount: {
    fontSize: typography.sizes.xs,
    color: '#9CA3AF',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
  },
  snapshotValues: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginTop: 0,
    paddingTop: 24, // Espaço para o ícone de lixeira no canto superior direito
    minWidth: 120,
  },
  snapshotTotalValue: {
    fontSize: typography.sizes.lg + 2, // Destaque maior
    fontWeight: typography.weights.bold,
    color: '#d4c291', // Tactical Gold
    marginBottom: spacing.xs,
    fontFamily: typography.fonts.primaryBold,
    letterSpacing: 0.3,
  },
  snapshotDate: {
    fontSize: typography.sizes.xs,
    color: '#9CA3AF', // Gray-400
    fontFamily: typography.fonts.secondary,
    textAlign: 'right',
    fontWeight: typography.weights.medium,
    lineHeight: 16,
  },
  deleteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent', // Fundo transparente minimalista
    borderWidth: 0.5, // Borda bem fina elegante
    borderColor: 'rgba(229, 115, 115, 0.4)', // Borda vermelha sutil
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 300,
  },
  loadingText: {
    marginTop: spacing.md,
    color: '#9CA3AF',
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 300,
  },
  emptyMessage: {
    fontSize: typography.sizes.md + 2,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
    fontFamily: typography.fonts.primaryBold,
  },
  emptySubtitle: {
    fontSize: typography.sizes.sm,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
});

