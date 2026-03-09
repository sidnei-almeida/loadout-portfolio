import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { spacing } from '@theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(13, 17, 23, 0.85)',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)', // Borda dourada tactical gold
    // Sombra premium
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
});

