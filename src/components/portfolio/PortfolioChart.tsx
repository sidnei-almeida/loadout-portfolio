import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useLanguage } from '@contexts/LanguageContext';
import { spacing, colors, typography } from '@theme';

const safeColors = colors || { textSecondary: '#B8BCC8' };
const safeTypography = typography || { fonts: { secondary: 'Rajdhani-Regular' }, sizes: { sm: 13 } };
import { InteractiveChart, ChartPoint } from '@components/common/InteractiveChart';
import { ChartHeader } from '@components/common/ChartHeader';
import { chartCardStyle } from '@theme/chartTheme';
import type { PortfolioHistory } from '@types/portfolio';

const safeSpacing = spacing || { md: 16 };
const CHART_PERIODS_BASE = [
  { days: 7, labelKey: '7D' as const },
  { days: 30, labelKey: '30D' as const },
  { days: 90, labelKey: '90D' as const },
  { days: 365, labelKey: 'all' as const },
];

interface PortfolioChartProps {
  history: PortfolioHistory[];
  isLoading?: boolean;
  onDaysChange?: (days: number) => void;
  selectedDays?: number;
}

export const PortfolioChart: React.FC<PortfolioChartProps> = ({
  history,
  isLoading = false,
  onDaysChange,
  selectedDays = 30,
}) => {
  const { t } = useLanguage();
  const [localSelectedDays, setLocalSelectedDays] = useState(selectedDays);

  const handleDaysChange = (days: number) => {
    setLocalSelectedDays(days);
    onDaysChange?.(days);
  };

  const screenWidth = Dimensions.get('window').width;
  const cardHeight = 280;
  const containerPadding = safeSpacing.md * 2;
  const chartWidth = screenWidth - containerPadding;

  const chartPoints: ChartPoint[] = useMemo(() => {
    if (!history || !Array.isArray(history) || history.length === 0) return [];
    return history
      .map((point) => ({
        value: Number(point?.total_value) || 0,
        date: point?.date || '',
      }))
      .filter((p) => typeof p.value === 'number' && Number.isFinite(p.value));
  }, [history]);

  const hasData = chartPoints.length > 0;

  return (
    <React.Fragment>
      <ChartHeader
        title={t('history')}
        subtitle={t('portfolioVariation')}
        periods={CHART_PERIODS_BASE.map(p => ({ days: p.days, label: p.labelKey === 'all' ? t('all') : p.labelKey }))}
        selectedDays={localSelectedDays}
        onDaysChange={handleDaysChange}
      />

      <View style={[styles.chartCard, { height: cardHeight }]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#d4c291" />
          </View>
        ) : !hasData ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('noHistoricalData')}</Text>
          </View>
        ) : (
          <InteractiveChart
            data={chartPoints}
            width={chartWidth}
            height={cardHeight}
            selectedDays={localSelectedDays}
          />
        )}
      </View>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    ...chartCardStyle,
    width: '100%',
    marginBottom: safeSpacing.xl,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyText: {
    color: safeColors.textSecondary,
    fontSize: safeTypography.sizes.sm,
    fontFamily: safeTypography.fonts.secondary,
  },
});

