import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@theme';
import { SearchIcon } from './Icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search items...',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6B7280" // Gray-500
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.iconContainer}>
        <SearchIcon size={18} color="#6B7280" strokeWidth={2} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 18, 0.4)', // bg-black/30 equivalent
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)', // Tactical Gold 20% opacity
    borderRadius: 12, // rounded-xl
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2, // py-2.5 equivalent
    position: 'relative',
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text,
    fontFamily: typography.fonts.secondary,
    padding: 0, // Remove default padding
    margin: 0,
  },
  iconContainer: {
    marginLeft: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

