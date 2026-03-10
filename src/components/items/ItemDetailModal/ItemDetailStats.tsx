import React from 'react';
import { View, Text } from 'react-native';
import { useLanguage } from '@contexts/LanguageContext';
import { formatCurrency } from '@utils/currency';
import type { ItemHistoryResponse } from '@types/prices';
import { itemDetailStyles } from './styles';

interface ItemDetailStatsProps {
  history: ItemHistoryResponse;
}

export const ItemDetailStats: React.FC<ItemDetailStatsProps> = ({ history }) => {
  const { t } = useLanguage();
  const styles = itemDetailStyles;

  if (!history?.summary) return null;

  const { min_price, max_price, avg_price } = history.summary;

  return (
    <View style={styles.statsSection}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('statMin')}</Text>
          <Text style={styles.statValue}>{formatCurrency(min_price)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('statMax')}</Text>
          <Text style={styles.statValue}>{formatCurrency(max_price)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('statAvg')}</Text>
          <Text style={styles.statValue}>{formatCurrency(avg_price)}</Text>
        </View>
      </View>
    </View>
  );
};
