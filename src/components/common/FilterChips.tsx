import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, typography } from '@theme';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterChipsProps {
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  label,
  options,
  selectedValues,
  onToggle,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.chip,
                isSelected && styles.chipActive,
              ]}
              onPress={() => onToggle(option.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// Helper para garantir valores seguros
const safeTypography = typography || {
  fonts: { secondary: 'Rajdhani', secondaryBold: 'Rajdhani-Bold' },
  weights: { semiBold: '600', medium: '500' },
  sizes: { sm: 13 },
};
const safeColors = colors || { text: '#FFFFFF', textSecondary: '#9CA3AF' };
const safeSpacing = spacing || { md: 16, sm: 8, xs: 4 };

const styles = StyleSheet.create({
  container: {
    marginBottom: safeSpacing.lg || 24,
  },
  label: {
    fontSize: safeTypography.sizes.sm || 13,
    fontWeight: safeTypography.weights.semiBold,
    color: '#d4c291', // Tactical Gold
    marginBottom: safeSpacing.md,
    fontFamily: safeTypography.fonts.secondaryBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chipsContainer: {
    gap: safeSpacing.sm,
    paddingRight: safeSpacing.md,
  },
  chip: {
    paddingHorizontal: safeSpacing.md + 4,
    paddingVertical: safeSpacing.sm + 2,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)', // Tactical Gold 20% opacity
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#d4c291', // Tactical Gold
    borderColor: '#d4c291',
  },
  chipText: {
    fontSize: safeTypography.sizes.sm || 13,
    color: '#9CA3AF', // Gray-400
    fontFamily: safeTypography.fonts.secondary,
    fontWeight: safeTypography.weights.medium,
  },
  chipTextActive: {
    color: '#000000', // Black text on gold background
    fontFamily: safeTypography.fonts.secondaryBold,
    fontWeight: safeTypography.weights.semiBold,
  },
});

