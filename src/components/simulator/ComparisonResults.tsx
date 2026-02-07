import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { colors, spacing, typography } from '@theme';
import { formatCurrency } from '@utils/currency';
import { getRarityColor } from '@utils/rarity';
import { PackageIcon, MoneyIcon, DiamondIcon, ArrowUpIcon, ArrowDownIcon, CheckIcon, ImagePlaceholderIcon } from '@components/common';
import type { SnapshotComparison } from '@services/snapshots';

// Helper para garantir valores seguros
const safeTypography = typography || {
  fonts: { secondary: 'Rajdhani' },
  weights: { medium: '500' },
  sizes: { sm: 13, xs: 11 },
};
const safeColors = colors || { text: '#FFFFFF' };
const safeSpacing = spacing || { sm: 8 };

interface ComparisonResultsProps {
  comparison: SnapshotComparison;
}

export const ComparisonResults: React.FC<ComparisonResultsProps> = ({ comparison }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    }).toUpperCase();
  };

  const valueChange = comparison.value_change || 0;
  const percentChange = comparison.value_change_percent || 0;
  const isPositive = valueChange > 0;
  const isNegative = valueChange < 0;

  const olderSnapshot = comparison.older_snapshot;
  const newerSnapshot = comparison.newer_snapshot;

  const totalChanges = (comparison.summary?.items_added || comparison.added_items?.length || 0) +
    (comparison.summary?.items_removed || comparison.removed_items?.length || 0) +
    (comparison.summary?.items_changed || comparison.changed_items?.length || 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Variation Analysis</Text>
        <View style={styles.dateRange}>
          <Text style={styles.date}>{formatDate(olderSnapshot.date)}</Text>
          <Text style={styles.dateArrow}>→</Text>
          <Text style={styles.date}>{formatDate(newerSnapshot.date)}</Text>
        </View>
      </View>

      {/* Hero Number */}
      <View style={[styles.heroCard, isPositive ? styles.heroPositive : isNegative ? styles.heroNegative : styles.heroNeutral]}>
        <View style={styles.heroIconContainer}>
          {isPositive ? (
            <ArrowUpIcon size={32} color="#81C784" strokeWidth={3} />
          ) : isNegative ? (
            <ArrowDownIcon size={32} color="#E57373" strokeWidth={3} />
          ) : (
            <View style={{ width: 32, height: 32 }} />
          )}
        </View>
        <Text style={[styles.heroValue, isPositive ? styles.heroValuePositive : isNegative ? styles.heroValueNegative : {}]}>
          {isPositive ? '+' : ''}{formatCurrency(valueChange)}
        </Text>
        <Text style={[styles.heroPercent, isPositive ? styles.heroPercentPositive : isNegative ? styles.heroPercentNegative : {}]}>
          {isPositive ? '+' : ''}{percentChange.toFixed(2)}%
        </Text>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <PackageIcon size={24} color="#d4c291" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>
            {olderSnapshot.item_count} → {newerSnapshot.item_count}
          </Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <MoneyIcon size={24} color="#d4c291" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{formatCurrency(olderSnapshot.value)}</Text>
          <Text style={styles.statLabel}>Initial Value</Text>
        </View>
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <DiamondIcon size={24} color="#d4c291" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{formatCurrency(newerSnapshot.value)}</Text>
          <Text style={styles.statLabel}>Final Value</Text>
        </View>
      </View>

      {/* Changes Details */}
      <View style={styles.changesSection}>
        <View style={styles.changesHeader}>
          <Text style={styles.changesTitle}>Change Details</Text>
          <Text style={styles.changesCount}>
            {totalChanges} {totalChanges === 1 ? 'change' : 'changes'}
          </Text>
        </View>

          {totalChanges === 0 ? (
          <View style={styles.emptyState}>
            <CheckIcon size={32} color="#81C784" strokeWidth={2.5} />
            <Text style={styles.emptyText}>
              No changes detected between snapshots
            </Text>
          </View>
        ) : (
          <View style={styles.diffItemsList}>
            {/* Items Added */}
            {comparison.added_items && comparison.added_items.length > 0 && (
              <View style={styles.portfolioSection}>
                <Text style={styles.diffSectionTitle}>Items Added</Text>
                <View style={styles.portfolioList}>
                  {comparison.added_items.map((item, index) => {
                  // Parse do nome do item (similar ao WhatIfSimulator)
                  const parseItemName = (name: string) => {
                    const parts = name.split('|');
                    if (parts.length >= 2) {
                      const weapon = parts[0].trim();
                      const skinPart = parts[1].trim();
                      const skinParts = skinPart.split('(');
                      const skin = skinParts[0].trim();
                      const condition = skinParts.length > 1 ? skinParts[1].replace(')', '').trim() : null;
                      return { weapon, skin, condition };
                    }
                    return { weapon: name, skin: null, condition: null };
                  };
                  const { weapon, skin } = parseItemName(item.name);
                  
                  return (
                    <React.Fragment key={index}>
                      <View style={styles.portfolioItemRow}>
                        {/* Thumbnail */}
                        <View style={styles.itemThumbnail}>
                          {item.image_url ? (
                            <FastImage
                              source={{ uri: item.image_url, priority: FastImage.priority.normal }}
                              style={styles.itemImage}
                              resizeMode={FastImage.resizeMode.contain}
                            />
                          ) : (
                            <View style={styles.itemImagePlaceholder}>
                              <ImagePlaceholderIcon size={20} color="#9CA3AF" />
                            </View>
                          )}
                        </View>

                        {/* Nome */}
                        <View style={styles.itemNameContainer}>
                          <Text style={styles.itemWeaponName} numberOfLines={1}>
                            {weapon}
                          </Text>
                          {skin && (
                            <Text style={styles.itemSkinName} numberOfLines={1}>
                              {skin}
                            </Text>
                          )}
                        </View>

                        {/* Valor com indicador verde + */}
                        <View style={styles.itemValueContainer}>
                          <Text style={[styles.itemValuePositive]}>+{formatCurrency(item.value)}</Text>
                        </View>
                      </View>
                      {index < comparison.added_items.length - 1 && <View style={styles.itemDivider} />}
                    </React.Fragment>
                  );
                  })}
                </View>
              </View>
            )}

            {/* Items Removed */}
            {comparison.removed_items && comparison.removed_items.length > 0 && (
              <View style={styles.portfolioSection}>
                <Text style={styles.diffSectionTitle}>Items Removed</Text>
                <View style={styles.portfolioList}>
                  {comparison.removed_items.map((item, index) => {
                  // Parse do nome do item (similar ao WhatIfSimulator)
                  const parseItemName = (name: string) => {
                    const parts = name.split('|');
                    if (parts.length >= 2) {
                      const weapon = parts[0].trim();
                      const skinPart = parts[1].trim();
                      const skinParts = skinPart.split('(');
                      const skin = skinParts[0].trim();
                      const condition = skinParts.length > 1 ? skinParts[1].replace(')', '').trim() : null;
                      return { weapon, skin, condition };
                    }
                    return { weapon: name, skin: null, condition: null };
                  };
                  const { weapon, skin } = parseItemName(item.name);
                  
                  return (
                    <React.Fragment key={index}>
                      <View style={styles.portfolioItemRow}>
                        {/* Thumbnail */}
                        <View style={styles.itemThumbnail}>
                          {item.image_url ? (
                            <FastImage
                              source={{ uri: item.image_url, priority: FastImage.priority.normal }}
                              style={styles.itemImage}
                              resizeMode={FastImage.resizeMode.contain}
                            />
                          ) : (
                            <View style={styles.itemImagePlaceholder}>
                              <ImagePlaceholderIcon size={20} color="#9CA3AF" />
                            </View>
                          )}
                          {/* Indicador de raridade - pontinho colorido no canto */}
                          {(() => {
                            const rarityColor = getRarityColor(item.name);
                            return <View style={[styles.rarityIndicator, { backgroundColor: rarityColor }]} />;
                          })()}
                        </View>

                        {/* Nome */}
                        <View style={styles.itemNameContainer}>
                          <Text style={styles.itemWeaponName} numberOfLines={1}>
                            {weapon}
                          </Text>
                          {skin && (
                            <Text style={styles.itemSkinName} numberOfLines={1}>
                              {skin}
                            </Text>
                          )}
                        </View>

                        {/* Valor com indicador vermelho - */}
                        <View style={styles.itemValueContainer}>
                          <Text style={[styles.itemValueNegative]}>-{formatCurrency(item.value)}</Text>
                        </View>
                      </View>
                      {index < comparison.removed_items.length - 1 && <View style={styles.itemDivider} />}
                    </React.Fragment>
                  );
                  })}
                </View>
              </View>
            )}

            {/* Items with quantity changed */}
            {comparison.changed_items && comparison.changed_items.length > 0 && (
              <>
                <Text style={styles.diffSectionTitle}>Quantity Changed</Text>
                {comparison.changed_items.map((item, index) => (
                  <View key={index} style={[styles.diffItem, styles.diffItemChanged]}>
                    {/* Imagem */}
                    <View style={styles.itemImageContainer}>
                      {item.image_url ? (
                        <FastImage
                          source={{ uri: item.image_url, priority: FastImage.priority.normal }}
                          style={styles.itemImage}
                          resizeMode={FastImage.resizeMode.contain}
                        />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <ImagePlaceholderIcon size={20} color="#9CA3AF" />
                        </View>
                      )}
                    </View>
                    {/* Informações */}
                    <View style={styles.diffItemInfo}>
                      <Text style={styles.diffItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={styles.diffItemMetaRow}>
                        <View style={[styles.diffBadge, styles.diffBadgeChanged]}>
                          <Text style={styles.diffBadgeText}>Qty Changed</Text>
                        </View>
                        <Text style={styles.diffItemMeta}>
                          {item.old_quantity} → {item.new_quantity}
                        </Text>
                      </View>
                    </View>
                    {/* Mudança */}
                    <Text
                      style={[
                        styles.diffItemValue,
                        item.quantity_change > 0 ? styles.diffValuePositive : styles.diffValueNegative,
                      ]}
                    >
                      {item.quantity_change > 0 ? '+' : ''}{item.quantity_change}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)',
  },
  headerTitle: {
    fontSize: typography.sizes.md + 2,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
    fontFamily: typography.fonts.primaryBold,
    letterSpacing: 0.5,
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  date: {
    fontSize: typography.sizes.sm,
    color: '#9CA3AF',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
  },
  dateArrow: {
    fontSize: typography.sizes.md,
    color: '#d4c291',
    fontWeight: typography.weights.bold,
  },
  heroCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: spacing.xl,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)',
  },
  heroPositive: {
    backgroundColor: 'rgba(129, 199, 132, 0.15)', // Pastel green 15%
    borderColor: 'rgba(129, 199, 132, 0.3)',
  },
  heroNegative: {
    backgroundColor: 'rgba(229, 115, 115, 0.15)', // Pastel red 15%
    borderColor: 'rgba(229, 115, 115, 0.3)',
  },
  heroNeutral: {
    backgroundColor: '#1a1a1a',
    borderColor: 'rgba(212, 194, 145, 0.2)',
  },
  heroIconContainer: {
    marginBottom: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    fontFamily: typography.fonts.primaryBold,
  },
  heroValuePositive: {
    color: '#81C784',
  },
  heroValueNegative: {
    color: '#E57373',
  },
  heroPercent: {
    fontSize: typography.sizes.lg,
    color: '#9CA3AF',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
  },
  heroPercentPositive: {
    color: '#81C784',
  },
  heroPercentNegative: {
    color: '#E57373',
  },
  statsBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    fontFamily: typography.fonts.primaryBold,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: '#9CA3AF',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
  },
  changesSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)',
  },
  changesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  changesTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    fontFamily: typography.fonts.primaryBold,
    letterSpacing: 0.5,
  },
  changesCount: {
    fontSize: typography.sizes.sm,
    color: '#9CA3AF',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
  },
  diffItemsList: {
    gap: spacing.sm,
  },
  diffSectionTitle: {
    fontSize: safeTypography.sizes.sm,
    fontWeight: safeTypography.weights.semiBold,
    color: '#d4c291',
    marginTop: safeSpacing.md,
    marginBottom: spacing.sm,
    fontFamily: typography.fonts.secondaryBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Estilos copiados do WhatIfSimulator para manter consistência
  portfolioSection: {
    marginBottom: spacing.lg,
  },
  portfolioList: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)',
    overflow: 'hidden',
  },
  portfolioItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 56,
  },
  itemThumbnail: {
    width: 40,
    height: 40,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    overflow: 'visible',
  },
  itemImage: {
    width: 40,
    height: 40,
  },
  itemImagePlaceholder: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
  },
  itemNameContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemWeaponName: {
    fontSize: safeTypography.sizes.md || 15,
    fontWeight: safeTypography.weights.bold,
    color: '#FFFFFF',
    fontFamily: typography.fonts.primary,
    marginBottom: 2,
  },
  itemSkinName: {
    fontSize: safeTypography.sizes.xs,
    color: safeColors.textSecondary,
    fontFamily: typography.fonts.secondary,
  },
  itemValueContainer: {
    alignItems: 'flex-end',
  },
  itemValue: {
    fontSize: safeTypography.sizes.md,
    fontWeight: safeTypography.weights.bold,
    color: '#d4c291', // Tactical Gold
    fontFamily: typography.fonts.primary,
    textAlign: 'right',
  },
  itemValuePositive: {
    fontSize: safeTypography.sizes.md,
    fontWeight: safeTypography.weights.bold,
    color: '#81C784', // Verde para adicionados
    fontFamily: typography.fonts.primary,
    textAlign: 'right',
  },
  itemValueNegative: {
    fontSize: safeTypography.sizes.md,
    fontWeight: safeTypography.weights.bold,
    color: '#E57373', // Vermelho para removidos
    fontFamily: typography.fonts.primary,
    textAlign: 'right',
  },
  itemDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // Linha divisória em cinza sutil
    marginLeft: spacing.md + 40 + spacing.sm, // Alinhar com o conteúdo (thumbnail 40px + marginRight spacing.sm + padding horizontal spacing.md)
    marginRight: spacing.md, // Margem direita para alinhar com o padding do container
  },
  rarityIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#1a1a1a', // Borda escura para contraste
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  // Mantidos para itens com quantidade alterada (ainda usa o design antigo)
  diffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: spacing.sm + 2,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.1)',
    minHeight: 64,
  },
  itemImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  diffItemChanged: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  diffBadgeChanged: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
  },
  diffItemMeta: {
    fontSize: typography.sizes.xs,
    color: '#9CA3AF',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.xs,
  },
  diffItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs / 2,
    flexWrap: 'wrap',
  },
  diffItemInfo: {
    flex: 1,
    marginRight: spacing.sm,
    justifyContent: 'center',
  },
  diffItemName: {
    fontSize: typography.sizes.sm,
    color: '#FFFFFF',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.bold,
    lineHeight: 18,
  },
  diffBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  diffBadgeText: {
    fontSize: safeTypography.sizes.xs,
    fontWeight: safeTypography.weights.medium,
    color: safeColors.text,
    fontFamily: safeTypography.fonts.secondary,
  },
  diffItemValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.primaryBold,
    textAlign: 'right',
    minWidth: 80,
  },
  diffValuePositive: {
    color: '#81C784',
  },
  diffValueNegative: {
    color: '#E57373',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: typography.fonts.secondary,
    marginTop: spacing.sm,
  },
});



