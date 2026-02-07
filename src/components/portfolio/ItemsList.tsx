import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Top5ItemRow } from './Top5ItemRow';
import { colors, spacing, typography } from '@theme';
import type { Item } from '@types/item';

// Helper para garantir valores seguros
const safeTypography = typography || {
  fonts: { 
    primaryMedium: 'Orbitron-Medium', 
    primarySemiBold: 'Orbitron-SemiBold',
    secondary: 'Rajdhani', 
    secondaryRegular: 'Rajdhani-Regular' 
  },
  weights: { medium: '500', semiBold: '600' },
  sizes: { sm: 13, xs: 11, lg: 18 },
};
const safeColors = colors || { textSecondary: '#B8BCC8', primary: '#FFD700' };
const safeSpacing = spacing || { xs: 4, md: 16, lg: 18, xl: 20, sm: 8 };

interface ItemsListProps {
  items: Item[];
  isLoading?: boolean;
  onItemPress?: (item: Item) => void;
}

export const ItemsList: React.FC<ItemsListProps> = ({
  items,
  isLoading = false,
  onItemPress,
}) => {
  // Ordenar itens por valor (maior primeiro) e limitar a TOP 5
  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const valueA = (a.price || a.current_price || 0) * (a.quantity || 1);
      const valueB = (b.price || b.current_price || 0) * (b.quantity || 1);
      return valueB - valueA;
    });
    return sorted.slice(0, 5); // Limit to TOP 5
  }, [items]);

  // Contagem total de itens
  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>TOP 5 MOST VALUABLE SKINS</Text>
          {totalItems > 0 && (
            <Text style={styles.itemsCount}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</Text>
          )}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={safeColors.primary} />
        </View>
      </View>
    );
  }

  if (sortedItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>TOP 5 MOST VALUABLE SKINS</Text>
          {totalItems > 0 && (
            <Text style={styles.itemsCount}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</Text>
          )}
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Title com contagem total */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>TOP 5 MOST VALUABLE SKINS</Text>
        <Text style={styles.itemsCount}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</Text>
      </View>

      {/* Compact Data Rows */}
      <View style={styles.portfolioList}>
        {sortedItems.map((item, index) => (
          <React.Fragment key={`${item.market_hash_name}-${item.asset_id || index}`}>
            <Top5ItemRow
              item={item}
              onPress={() => onItemPress?.(item)}
            />
            {index < sortedItems.length - 1 && <View style={styles.itemDivider} />}
          </React.Fragment>
        ))}
      </View>

      {/* Footer Text */}
      <Text style={styles.footerText}>
        See all details and items in the Inventory tab.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: safeSpacing.lg,
  },
  titleContainer: {
    marginBottom: safeSpacing.md,
  },
  title: {
    fontSize: safeTypography.sizes.xs, // Mesmo tamanho do "VALOR ATUAL"
    fontFamily: safeTypography.fonts.primaryMedium, // Orbitron-Medium - mesmo do "VALOR ATUAL"
    color: '#d4c291', // Tactical Gold - mesmo padrão do "VALOR ATUAL"
    textTransform: 'uppercase',
    letterSpacing: 2, // Mesmo letter spacing do "VALOR ATUAL"
    opacity: 0.9, // Mesma opacidade do "VALOR ATUAL"
    marginBottom: safeSpacing.xs / 2, // Espaçamento abaixo do título
  },
  itemsCount: {
    fontSize: safeTypography.sizes.sm - 2, // Menor que o título
    fontFamily: safeTypography.fonts.secondary,
    color: safeColors.textSecondary || '#B8BCC8', // Cinza mais discreto
    fontWeight: '400', // Peso menor que o título
    textTransform: 'none', // Sem uppercase
    letterSpacing: 0, // Sem letter spacing adicional
    marginTop: safeSpacing.xs / 2, // Espaçamento acima do contador
  },
  portfolioList: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)',
    overflow: 'hidden',
    marginBottom: safeSpacing.md,
  },
  itemDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: safeSpacing.md + 40 + safeSpacing.sm, // Alinhar com o conteúdo
    marginRight: safeSpacing.md,
  },
  loadingContainer: {
    paddingVertical: safeSpacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: safeSpacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: safeColors.textSecondary,
    fontSize: safeTypography.sizes.sm,
    fontFamily: safeTypography.fonts.secondary,
  },
  footerText: {
    fontSize: safeTypography.sizes.xs,
    fontFamily: safeTypography.fonts.secondaryRegular,
    color: '#333333', // Very dark gray
    textAlign: 'center',
    marginTop: safeSpacing.sm,
  },
});

