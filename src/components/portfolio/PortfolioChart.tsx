import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '@theme';
import { InteractiveChart, ChartPoint } from '@components/common/InteractiveChart';
import type { PortfolioHistory } from '@types/portfolio';

const safeTypography = typography || {
  fonts: {
    secondaryMedium: 'Rajdhani-Medium',
    primarySemiBold: 'Orbitron-SemiBold',
    secondaryRegular: 'Rajdhani-Regular',
    secondary: 'Rajdhani',
  },
  weights: { medium: '500', semiBold: '600' },
  sizes: { xs: 11, sm: 13, lg: 18 },
};
const safeColors = colors || { textMuted: '#6B7280', textSecondary: '#B8BCC8' };
const safeSpacing = spacing || { xs: 4, sm: 8, md: 16, lg: 24, xl: 20 };

interface PortfolioChartProps {
  history: PortfolioHistory[];
  isLoading?: boolean;
  onDaysChange?: (days: number) => void;
  selectedDays?: number;
}

const CHART_PERIODS = [
  { days: 7, label: '7D' },
  { days: 30, label: '30D' },
  { days: 90, label: '90D' },
  { days: 365, label: 'ALL' },
];

export const PortfolioChart: React.FC<PortfolioChartProps> = ({
  history,
  isLoading = false,
  onDaysChange,
  selectedDays = 30,
}) => {
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
    if (!history || history.length === 0) return [];
    return history.map((point) => ({
      value: point.total_value,
      date: point.date,
    }));
  }, [history]);

  const hasData = chartPoints.length > 0;

  return (
    <React.Fragment>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Portfolio variation</Text>
        </View>

        <View style={styles.selectorsContainer}>
          {CHART_PERIODS.map((period) => (
            <TouchableOpacity
              key={period.days}
              style={[
                styles.selectorButton,
                localSelectedDays === period.days && styles.selectorButtonActive,
              ]}
              onPress={() => handleDaysChange(period.days)}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.selectorText,
                  localSelectedDays === period.days && styles.selectorTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.chartCard, { height: cardHeight }]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#d4c291" />
          </View>
        ) : !hasData ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No historical data</Text>
          </View>
        ) : (
          <InteractiveChart
            data={chartPoints}
            width={chartWidth}
            height={cardHeight}
          />
        )}
      </View>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: safeSpacing.lg,
    width: '100%',
  },
  headerLeft: {
    flex: 1,
    marginRight: safeSpacing.md,
  },
  headerTitle: {
    fontSize: safeTypography.sizes.lg,
    fontFamily: safeTypography.fonts.primarySemiBold,
    color: '#d4c291',
    marginBottom: safeSpacing.xs / 2,
    fontWeight: safeTypography.weights.semiBold,
  },
  headerSubtitle: {
    fontSize: safeTypography.sizes.sm,
    fontFamily: safeTypography.fonts.secondaryRegular,
    color: safeColors.textMuted,
  },
  selectorsContainer: {
    flexDirection: 'row',
    gap: safeSpacing.xs / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: safeSpacing.xs / 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  selectorButton: {
    paddingVertical: safeSpacing.xs / 2,
    paddingHorizontal: safeSpacing.sm,
    borderRadius: 6,
    backgroundColor: 'transparent',
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorButtonActive: {
    backgroundColor: '#d4c291',
  },
  selectorText: {
    fontSize: safeTypography.sizes.xs,
    fontFamily: safeTypography.fonts.secondaryMedium,
    color: safeColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: safeTypography.weights.medium,
  },
  selectorTextActive: {
    color: '#000000',
    fontWeight: safeTypography.weights.semiBold,
  },
  chartCard: {
    backgroundColor: '#1c1b19',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.12)',
    borderRadius: 16,
    padding: 0,
    width: '100%',
    marginBottom: safeSpacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
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

