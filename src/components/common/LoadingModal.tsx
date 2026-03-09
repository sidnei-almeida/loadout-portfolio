import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { spacing, typography } from '@theme';

// Helper para garantir valores seguros
const safeTypography = typography || {
  fonts: { primaryMedium: 'Orbitron-Medium', secondary: 'Rajdhani', secondarySemiBold: 'Rajdhani-SemiBold' },
  weights: { medium: '500', semiBold: '600' },
  sizes: { sm: 13, xs: 11 },
};
const safeSpacing = spacing || { md: 16, lg: 24, xl: 32, sm: 8, xs: 4 };

interface LoadingModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  subtitle?: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  visible,
  title = 'LOADING',
  message,
  subtitle,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, fadeAnim, scaleAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <ActivityIndicator size="small" color="#d4c291" />

            {/* Message */}
            {message && (
              <Text style={styles.message}>{message}</Text>
            )}

            {/* Subtitle */}
            {subtitle && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: safeSpacing.lg,
  },
  container: {
    backgroundColor: 'rgba(15, 15, 15, 0.95)',
    borderRadius: 16,
    padding: safeSpacing.xl,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    marginBottom: safeSpacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: safeTypography.sizes.sm + 4 || 17,
    fontFamily: safeTypography.fonts.primaryMedium,
    color: '#d4c291',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 0,
  },
  content: {
    alignItems: 'center',
    gap: safeSpacing.md,
  },
  message: {
    fontSize: safeTypography.sizes.sm || 13,
    fontFamily: safeTypography.fonts.secondary,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: safeSpacing.sm,
  },
  subtitle: {
    fontSize: safeTypography.sizes.xs || 11,
    fontFamily: safeTypography.fonts.secondary,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

