import React from 'react';
import { View, Text, ActivityIndicator, Dimensions } from 'react-native';
import { ChartHeader } from '@components/common/ChartHeader';
import { InteractiveChart, ChartPoint } from '@components/common/InteractiveChart';
import { useLanguage } from '@contexts/LanguageContext';
import { CHART_PERIODS_BASE } from './utils';
import { itemDetailStyles, safeSpacing } from './styles';

interface ItemDetailChartProps {
  selectedDays: number;
  onDaysChange: (days: number) => void;
  chartPoints: ChartPoint[];
  isLoadingHistory: boolean;
  historyError: string | null;
}

const CARD_HEIGHT = 280;

export const ItemDetailChart: React.FC<ItemDetailChartProps> = ({
  selectedDays,
  onDaysChange,
  chartPoints,
  isLoadingHistory,
  historyError,
}) => {
  const { t } = useLanguage();
  const screenWidth = Dimensions.get('window').width;
  const containerPadding = safeSpacing.md * 2;
  const chartWidth = screenWidth - containerPadding;
  const hasValidChartData = chartPoints.length > 0;
  const styles = itemDetailStyles;

  return (
    <View style={styles.chartSection}>
      <ChartHeader
        title={t('history')}
        subtitle={t('priceVariation')}
        periods={CHART_PERIODS_BASE.map((p) => ({
          days: p.days,
          label: p.labelKey === 'all' ? t('all') : p.labelKey,
        }))}
        selectedDays={selectedDays}
        onDaysChange={onDaysChange}
      />

      <View style={[styles.chartCard, { height: CARD_HEIGHT }]} collapsable={false}>
        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#d4c291" />
          </View>
        ) : historyError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{historyError}</Text>
          </View>
        ) : !hasValidChartData ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('noHistoryAvailable')}</Text>
          </View>
        ) : (
          <InteractiveChart
            data={chartPoints}
            width={chartWidth}
            height={CARD_HEIGHT}
            selectedDays={selectedDays}
          />
        )}
      </View>
    </View>
  );
};
