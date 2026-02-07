import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '@theme';

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
  const rotateAnim = useRef(new Animated.Value(0)).current;

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

      // Animação de rotação contínua
      rotateAnim.setValue(0);
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      rotateAnim.stopAnimation();
    }
  }, [visible, fadeAnim, scaleAnim, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
            <View style={styles.titleUnderline} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Loading Spinner com animação de rotação */}
            <Animated.View
              style={{
                transform: [{ rotate: rotation }],
              }}
            >
              <ActivityIndicator size="large" color="#d4c291" />
            </Animated.View>

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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: safeSpacing.lg,
  },
  container: {
    backgroundColor: '#1c1b19', // Tactical dark background
    borderRadius: 16,
    padding: safeSpacing.xl,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.3)', // Tactical Gold border
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
    color: '#d4c291', // Tactical Gold
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: safeSpacing.xs,
  },
  titleUnderline: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(212, 194, 145, 0.5)',
    marginTop: safeSpacing.xs,
  },
  content: {
    alignItems: 'center',
    gap: safeSpacing.md,
  },
  message: {
    fontSize: safeTypography.sizes.sm || 13,
    fontFamily: safeTypography.fonts.secondary,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: safeSpacing.sm,
  },
  subtitle: {
    fontSize: safeTypography.sizes.xs || 11,
    fontFamily: safeTypography.fonts.secondary,
    color: '#9CA3AF',
    textAlign: 'center',
    letterSpacing: 0.3,
    opacity: 0.8,
  },
});

