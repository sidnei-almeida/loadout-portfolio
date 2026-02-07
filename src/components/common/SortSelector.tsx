import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors, spacing, typography } from '@theme';

export interface SortOption {
  value: string;
  label: string;
}

interface SortSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: SortOption[];
}

export const SortSelector: React.FC<SortSelectorProps> = ({
  value,
  onChange,
  options,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sort by</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={value}
          onValueChange={onChange}
          style={styles.picker}
          dropdownIconColor={colors.primary}
        >
          {options.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
              color={colors.text}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontFamily: typography.fonts.secondary,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  picker: {
    color: colors.text,
  },
});

