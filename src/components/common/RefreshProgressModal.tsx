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
import { CheckCircleIcon } from './Icons';

// Helper para garantir valores seguros
const safeTypography = typography || {
  fonts: { primaryMedium: 'Orbitron-Medium', secondary: 'Rajdhani', secondarySemiBold: 'Rajdhani-SemiBold' },
  weights: { medium: '500', semiBold: '600' },
  sizes: { sm: 13, xs: 11 },
};
const safeSpacing = spacing || { md: 16, lg: 24, xl: 32, sm: 8, xs: 4 };

interface RefreshStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed';
}

interface RefreshProgressModalProps {
  visible: boolean;
  currentStep: number;
  steps: RefreshStep[];
  onComplete?: () => void;
}

export const RefreshProgressModal: React.FC<RefreshProgressModalProps> = ({
  visible,
  currentStep,
  steps,
  onComplete,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;

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
      checkmarkAnim.setValue(0);
    }
  }, [visible, fadeAnim, scaleAnim, checkmarkAnim]);

  // Animar checkmark quando uma etapa é completada
  const completedCount = steps.filter(s => s.status === 'completed').length;
  
  useEffect(() => {
    if (completedCount > 0 && visible) {
      checkmarkAnim.setValue(0);
      Animated.spring(checkmarkAnim, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [completedCount, visible, checkmarkAnim]);

  // Verificar se todas as etapas foram concluídas
  const allCompleted = steps.every(step => step.status === 'completed');
  const isProcessing = steps.some(step => step.status === 'processing');

  useEffect(() => {
    if (allCompleted && !isProcessing && visible && onComplete) {
      // Aguardar um pouco antes de chamar onComplete
      const timer = setTimeout(() => {
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [allCompleted, isProcessing, visible, onComplete]);

  const renderStep = (step: RefreshStep, index: number) => {
    const isActive = step.status === 'processing';
    const isCompleted = step.status === 'completed';
    const isPending = step.status === 'pending';

    return (
      <View key={step.id} style={styles.stepContainer}>
        <View style={styles.stepIconContainer}>
          {isCompleted ? (
            <CheckCircleIcon size={24} color="#22C55E" strokeWidth={2.5} />
          ) : isActive ? (
            <ActivityIndicator size="small" color="#d4c291" />
          ) : (
            <View style={[styles.stepDot, isPending && styles.stepDotPending]} />
          )}
        </View>
        <View style={styles.stepContent}>
          <Text
            style={[
              styles.stepLabel,
              isActive && styles.stepLabelActive,
              isCompleted && styles.stepLabelCompleted,
              isPending && styles.stepLabelPending,
            ]}
          >
            {step.label}
          </Text>
        </View>
      </View>
    );
  };

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
            <Text style={styles.title}>UPDATING DATA</Text>
            <View style={styles.titleUnderline} />
          </View>

          {/* Steps */}
          <View style={styles.stepsContainer}>
            {steps.map((step, index) => renderStep(step, index))}
          </View>

          {/* Footer - Mostrar "Tudo pronto" quando concluído */}
          {allCompleted && !isProcessing && (
            <Animated.View
              style={[
                styles.footer,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <CheckCircleIcon size={32} color="#22C55E" strokeWidth={2.5} />
              <Text style={styles.completeMessage}>ALL DONE</Text>
            </Animated.View>
          )}
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
    maxWidth: 420,
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.3)', // Tactical Gold border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    marginBottom: safeSpacing.xl,
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
  stepsContainer: {
    gap: safeSpacing.md,
    marginBottom: safeSpacing.lg,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: safeSpacing.md,
  },
  stepIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#d4c291',
    opacity: 0.6,
  },
  stepDotPending: {
    backgroundColor: '#6B7280',
    opacity: 0.4,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: safeTypography.sizes.sm || 13,
    fontFamily: safeTypography.fonts.secondary,
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  stepLabelActive: {
    color: '#d4c291',
    fontFamily: safeTypography.fonts.secondarySemiBold,
    fontWeight: safeTypography.weights.semiBold,
  },
  stepLabelCompleted: {
    color: '#22C55E',
    fontFamily: safeTypography.fonts.secondarySemiBold,
    fontWeight: safeTypography.weights.semiBold,
  },
  stepLabelPending: {
    color: '#6B7280',
    opacity: 0.6,
  },
  footer: {
    marginTop: safeSpacing.lg,
    paddingTop: safeSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 194, 145, 0.15)',
    alignItems: 'center',
    gap: safeSpacing.sm,
  },
  completeMessage: {
    fontSize: safeTypography.sizes.sm + 2 || 15,
    fontFamily: safeTypography.fonts.secondarySemiBold,
    color: '#22C55E',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: safeTypography.weights.semiBold,
  },
});

