import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text, FlatList, ScrollView, Platform, StatusBar } from 'react-native';
import { Screen } from '@components/common/Screen';
import { SearchBar } from '@components/common/SearchBar';
import { FilterChips } from '@components/common/FilterChips';
import { type SortOption } from '@components/common/SortSelector';
import { FilterIcon, GridIcon, IconsIcon, DetailsIcon } from '@components/common/Icons';
import { ItemCard } from '@components/items/ItemCard';
import { ItemIconView } from '@components/items/ItemIconView';
import { ItemDetailRow } from '@components/items/ItemDetailRow';
import { ItemDetailModal } from '@components/items/ItemDetailModal';
import { Loading } from '@components/common/Loading';
import { usePortfolio } from '@hooks/usePortfolio';
import { spacing, colors, typography } from '@theme';
import {
  filterItems,
  sortItems,
  SORT_OPTIONS,
  CATEGORY_OPTIONS,
  RARITY_OPTIONS,
  type SortValue,
} from '@utils/filters';
import type { Item } from '@types/item';

export type ViewMode = 'cards' | 'icons' | 'details';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCategories: string[];
  selectedRarities: string[];
  onCategoryToggle: (value: string) => void;
  onRarityToggle: (value: string) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions: SortOption[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  selectedCategories,
  selectedRarities,
  onCategoryToggle,
  onRarityToggle,
  sortValue,
  onSortChange,
  sortOptions,
  viewMode,
  onViewModeChange,
}) => {
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const bottomNavBarHeight = Platform.OS === 'android' ? 64 : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.content, { paddingBottom: bottomNavBarHeight }]}>
          <View style={[modalStyles.header, { paddingTop: statusBarHeight + spacing.xs }]}>
            <Text style={modalStyles.headerTitle}>FILTERS AND OPTIONS</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <Text style={modalStyles.closeText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[modalStyles.scrollContent, { paddingBottom: spacing.xl + 20 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionTitle}>VIEW</Text>
              <View style={modalStyles.viewModeSelector}>
                <TouchableOpacity
                  style={[modalStyles.viewModeButton, viewMode === 'cards' && modalStyles.viewModeButtonActive]}
                  onPress={() => onViewModeChange('cards')}
                  activeOpacity={0.8}
                >
                  <GridIcon size={18} color={viewMode === 'cards' ? '#000000' : '#d4c291'} strokeWidth={2} />
                  <Text style={[modalStyles.viewModeLabel, viewMode === 'cards' && modalStyles.viewModeLabelActive]}>Cards</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modalStyles.viewModeButton, viewMode === 'icons' && modalStyles.viewModeButtonActive]}
                  onPress={() => onViewModeChange('icons')}
                  activeOpacity={0.8}
                >
                  <IconsIcon size={18} color={viewMode === 'icons' ? '#000000' : '#d4c291'} strokeWidth={2} />
                  <Text style={[modalStyles.viewModeLabel, viewMode === 'icons' && modalStyles.viewModeLabelActive]}>Icons</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modalStyles.viewModeButton, viewMode === 'details' && modalStyles.viewModeButtonActive]}
                  onPress={() => onViewModeChange('details')}
                  activeOpacity={0.8}
                >
                  <DetailsIcon size={18} color={viewMode === 'details' ? '#000000' : '#d4c291'} strokeWidth={2} />
                  <Text style={[modalStyles.viewModeLabel, viewMode === 'details' && modalStyles.viewModeLabelActive]}>Details</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={modalStyles.section}>
              <Text style={modalStyles.sectionTitle}>SORT BY</Text>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[modalStyles.sortOption, sortValue === option.value && modalStyles.sortOptionActive]}
                  onPress={() => onSortChange(option.value)}
                >
                  <Text style={[modalStyles.sortOptionText, sortValue === option.value && modalStyles.sortOptionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FilterChips label="CATEGORY" options={CATEGORY_OPTIONS} selectedValues={selectedCategories} onToggle={onCategoryToggle} />
            <FilterChips label="RARITY" options={RARITY_OPTIONS} selectedValues={selectedRarities} onToggle={onRarityToggle} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export const InventoryScreen: React.FC = () => {
  const { items, isLoading } = usePortfolio();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const [sortValue, setSortValue] = useState<SortValue>('price_desc');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const filteredAndSortedItems = useMemo(() => {
    let filtered = filterItems(items, searchQuery, selectedCategories, selectedRarities);
    filtered = sortItems(filtered, sortValue);
    return filtered;
  }, [items, searchQuery, selectedCategories, selectedRarities, sortValue]);

  const hasActiveFilters = selectedCategories.length > 0 || selectedRarities.length > 0;

  const handleCategoryToggle = (value: string) => {
    setSelectedCategories(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const handleRarityToggle = (value: string) => {
    setSelectedRarities(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const handleItemPress = (item: Item) => {
    setSelectedItem(item);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedItem(null);
  };

  const buttonHeight = 42;
  const buttonSize = buttonHeight;

  const renderItem = ({ item }: { item: Item }) => {
    const handlePress = () => handleItemPress(item);
    switch (viewMode) {
      case 'cards': return <ItemCard item={item} onPress={handlePress} />;
      case 'icons': return <ItemIconView item={item} onPress={handlePress} />;
      case 'details': return <ItemDetailRow item={item} onPress={handlePress} />;
      default: return <ItemCard item={item} onPress={handlePress} />;
    }
  };

  const keyExtractor = (item: Item, index: number) => `${item.market_hash_name}-${item.asset_id || index}`;

  const getListConfig = () => {
    switch (viewMode) {
      case 'cards': return { numColumns: 2, columnWrapperStyle: styles.row };
      case 'icons': return { numColumns: 3, columnWrapperStyle: styles.row };
      case 'details': return { numColumns: 1, columnWrapperStyle: undefined };
      default: return { numColumns: 2, columnWrapperStyle: styles.row };
    }
  };

  const listConfig = getListConfig();

  return (
    <View style={styles.screenContainer}>
      <View style={styles.headerContainer}>
        <View style={styles.toolbar}>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search items..." style={styles.searchBar} />
          <TouchableOpacity
            style={[styles.filterButton, { width: buttonSize, height: buttonSize }, (hasActiveFilters || sortValue !== 'price_desc') && styles.filterButtonActive]}
            onPress={() => setIsFilterModalVisible(true)}
            activeOpacity={0.8}
          >
            <FilterIcon size={18} color={(hasActiveFilters || sortValue !== 'price_desc') ? '#000000' : '#d4c291'} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.resultsContainer}>
        {isLoading && filteredAndSortedItems.length === 0 ? (
          <Loading message="Loading inventory..." />
        ) : filteredAndSortedItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        ) : (
          <FlatList
            key={`inventory-${viewMode}`}
            data={filteredAndSortedItems}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={listConfig.numColumns}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={10}
            columnWrapperStyle={listConfig.columnWrapperStyle}
          />
        )}
      </View>

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        selectedCategories={selectedCategories}
        selectedRarities={selectedRarities}
        onCategoryToggle={handleCategoryToggle}
        onRarityToggle={handleRarityToggle}
        sortValue={sortValue}
        onSortChange={value => setSortValue(value as SortValue)}
        sortOptions={SORT_OPTIONS as SortOption[]}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <ItemDetailModal visible={isModalVisible} item={selectedItem} onClose={handleCloseModal} />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: { flex: 1, position: 'relative', backgroundColor: 'transparent' },
  headerContainer: { paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.sm, zIndex: 1 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  searchBar: { flex: 1 },
  filterButton: { borderRadius: 8, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212, 194, 145, 0.2)' },
  filterButtonActive: { backgroundColor: '#d4c291', borderColor: '#d4c291' },
  resultsContainer: { flex: 1, zIndex: 1 },
  list: { flex: 1 },
  listContent: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  row: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: spacing.sm, gap: spacing.sm },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyText: { color: colors.textSecondary, fontSize: 16 },
});

const modalStyles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#1c1b19', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderTopColor: 'rgba(212, 194, 145, 0.3)', maxHeight: '90%', minHeight: '50%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: 'rgba(212, 194, 145, 0.2)' },
  headerTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: '#FFFFFF', fontFamily: typography.fonts.primaryBold, letterSpacing: 0.5, textTransform: 'uppercase' },
  closeButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  closeText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.secondarySemiBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  scrollContent: { padding: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semiBold, color: '#d4c291', fontFamily: typography.fonts.secondaryBold, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 1 },
  viewModeSelector: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  viewModeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(212, 194, 145, 0.2)' },
  viewModeButtonActive: { backgroundColor: '#d4c291', borderColor: '#d4c291' },
  viewModeLabel: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.secondary, color: '#d4c291' },
  viewModeLabelActive: { color: '#000000', fontFamily: typography.fonts.secondaryBold, fontWeight: typography.weights.bold },
  sortOption: { paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: 8, marginBottom: spacing.xs },
  sortOptionActive: { backgroundColor: '#2a2a2a' },
  sortOptionText: { fontSize: typography.sizes.md, fontFamily: typography.fonts.secondary, color: colors.text },
  sortOptionTextActive: { color: '#d4c291', fontFamily: typography.fonts.secondaryBold },
});
