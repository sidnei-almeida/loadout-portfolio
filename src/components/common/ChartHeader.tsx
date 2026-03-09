/**
 * Cabeçalho padronizado para gráficos — título, subtítulo e filtro de período.
 * Usado em PortfolioChart (Home), ItemDetailModal, WhatIfSimulator.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { spacing, typography, colors } from '@theme';

const safeTypography = typography || {
  fonts: { primarySemiBold: 'Orbitron-SemiBold', secondaryRegular: 'Rajdhani-Regular', secondaryMedium: 'Rajdhani-Medium' },
  weights: { semiBold: '600', medium: '500' },
  sizes: { sm: 13, lg: 18 },
};
const safeColors = colors || { textMuted: '#6B7280' };
const safeSpacing = spacing || { xs: 4, sm: 8, md: 16, lg: 24 };

export interface ChartPeriod {
  days: number;
  label: string;
}

interface ChartHeaderProps {
  title: string;
  subtitle?: string;
  periods: ChartPeriod[];
  selectedDays: number;
  onDaysChange: (days: number) => void;
}

export const ChartHeader: React.FC<ChartHeaderProps> = ({
  title,
  subtitle,
  periods,
  selectedDays,
  onDaysChange,
}) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle ? (
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      ) : null}
    </View>
    {periods.length > 0 && (
      <View style={styles.selectorsContainer}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.days}
            style={[
              styles.selectorButton,
              selectedDays === period.days && styles.selectorButtonActive,
            ]}
            onPress={() => onDaysChange(period.days)}
            activeOpacity={0.6}
          >
            <Text
              style={[
                styles.selectorText,
                selectedDays === period.days && styles.selectorTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

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
    fontSize: 11,
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
});
