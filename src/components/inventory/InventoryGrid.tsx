import React from 'react';
import { FlatList, StyleSheet, View, Text } from 'react-native';
import { ItemCard } from '@components/items/ItemCard';
import { Loading } from '@components/common/Loading';
import { colors, spacing } from '@theme';
import type { Item } from '@types/item';

interface InventoryGridProps {
  items: Item[];
  isLoading?: boolean;
  onItemPress?: (item: Item) => void;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  items,
  isLoading = false,
  onItemPress,
}) => {
  const renderItem = ({ item }: { item: Item }) => (
    <ItemCard item={item} onPress={() => onItemPress?.(item)} />
  );

  const keyExtractor = (item: Item, index: number) =>
    `${item.market_hash_name}-${item.asset_id || index}`;

  if (isLoading && items.length === 0) {
    return (
      <View style={styles.container}>
        <Loading message="Loading inventory..." />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No items found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={2}
      contentContainerStyle={styles.listContent}
      style={styles.list}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={5}
      initialNumToRender={10}
      columnWrapperStyle={styles.row}
      // Remover getItemLayout pois não funciona bem com numColumns > 1
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm, // Gap vertical entre linhas
    gap: spacing.sm, // Gap horizontal entre cards na mesma linha
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});

