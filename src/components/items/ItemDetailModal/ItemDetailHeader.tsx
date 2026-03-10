import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLanguage } from '@contexts/LanguageContext';
import { formatCurrency } from '@utils/currency';
import type { Item } from '@types/item';
import type { ItemHistoryResponse } from '@types/prices';
import { CONDITION_TO_KEY, parseItemName } from './utils';
import { itemDetailStyles, safeSpacing } from './styles';

interface ItemDetailHeaderProps {
  item: Item;
  history: ItemHistoryResponse | null;
  onClose: () => void;
  statusBarHeight: number;
}

export const ItemDetailHeader: React.FC<ItemDetailHeaderProps> = ({
  item,
  history,
  onClose,
  statusBarHeight,
}) => {
  const { t } = useLanguage();
  const styles = itemDetailStyles;

  const isStorageUnit = item.is_storage_unit === true;
  const { weapon, skin, condition } = parseItemName(item.market_hash_name || '');
  const displayTitle = isStorageUnit
    ? (item.custom_display_name ?? item.market_hash_name ?? 'Storage Unit')
    : weapon;

  return (
    <>
      <View style={[styles.header, { paddingTop: statusBarHeight + safeSpacing.md }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
          <Text style={styles.closeButtonText}>{t('close')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerCompact}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            <Text style={styles.headerWeaponName}>{displayTitle}</Text>
            {!isStorageUnit && skin && (
              <Text>
                <Text style={styles.headerSeparator}> | </Text>
                <Text style={styles.headerSkinName}>{skin}</Text>
              </Text>
            )}
          </Text>
          {!isStorageUnit && condition && (
            <Text style={styles.headerCondition}>
              {(CONDITION_TO_KEY[condition] ? t(CONDITION_TO_KEY[condition]) : condition).toUpperCase()}
            </Text>
          )}
        </View>

        {isStorageUnit ? (
          <View style={styles.headerRight}>
            <Text style={styles.storageUnitBadgeText}>
              [ <Text style={styles.storageUnitBadgeNumber}>{item.storage_unit_item_count ?? '?'}</Text> {t('storageUnitItems')} ] • {t('storageUnitEncrypted')}
            </Text>
          </View>
        ) : (history?.summary || item.current_price || item.price) ? (
          <View style={styles.headerRight}>
            <Text style={styles.headerPrice}>
              {formatCurrency(
                history?.summary?.end_price || item.current_price || item.price || 0
              )}
            </Text>
            {history?.summary?.price_change_percent !== undefined && (
              <View
                style={[
                  styles.headerTrendBadge,
                  history.summary.price_change_percent >= 0
                    ? styles.headerTrendPositive
                    : styles.headerTrendNegative,
                ]}
              >
                <Text
                  style={[
                    styles.headerTrendText,
                    history.summary.price_change_percent >= 0
                      ? styles.headerTrendTextPositive
                      : styles.headerTrendTextNegative,
                  ]}
                >
                  {history.summary.price_change_percent >= 0 ? '+' : ''}
                  {history.summary.price_change_percent.toFixed(2)}%
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>
    </>
  );
};
