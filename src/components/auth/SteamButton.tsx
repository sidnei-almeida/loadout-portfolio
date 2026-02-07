import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { SteamIcon } from '@components/common/Icons';
import { typography, spacing, colors } from '@theme';

interface SteamButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  title?: string;
}

export const SteamButton: React.FC<SteamButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
  style,
  title = 'SIGN IN WITH STEAM',
}) => {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.button,
          disabled && styles.buttonDisabled,
        ]}
      >
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <SteamIcon size={20} color="#FFFFFF" />
              <Text style={styles.text}>{title}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    width: '100%',
    minHeight: 52,
    backgroundColor: '#121212', // Dark solid background (almost black)
    borderRadius: 10, // Angular, less rounded (tactical)
    borderWidth: 1,
    borderColor: '#d4c291', // Tactical Gold border
    // Subtle shadow for depth
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm + 2,
    minHeight: 52,
  },
  text: {
    fontFamily: typography.fonts.secondarySemiBold,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semiBold,
    color: '#FFFFFF', // White text for contrast
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
