import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLanguage } from '@contexts/LanguageContext';
import { spacing, typography } from '@theme';
import { AnimatedModal } from './AnimatedModal';

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
  const { t } = useLanguage();

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

  const renderStep = (step: RefreshStep) => {
    const isActive = step.status === 'processing';
    const isCompleted = step.status === 'completed';
    const isPending = step.status === 'pending';

    return (
      <View key={step.id} style={styles.stepContainer}>
        <View style={styles.stepIconContainer}>
          {isCompleted ? (
            <Text style={styles.stepDotCompleted}>•</Text>
          ) : isActive ? (
            <ActivityIndicator size="small" color="#d4c291" />
          ) : (
            <View style={styles.stepDotPending} />
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
    <AnimatedModal
      visible={visible}
      overlayStyle={styles.overlay}
      contentStyle={styles.container}
      statusBarTranslucent
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('updatingData')}</Text>
      </View>

      {/* Steps */}
      <View style={styles.stepsContainer}>
        {steps.map((step) => renderStep(step))}
      </View>

      {/* Footer - Mostrar "Tudo pronto" quando concluído */}
      {allCompleted && !isProcessing && (
        <View style={styles.footer}>
          <Text style={styles.footerDot}>•</Text>
          <Text style={styles.completeMessage}>{t('allDone')}</Text>
        </View>
      )}
    </AnimatedModal>
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
    maxWidth: 420,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    color: '#d4c291',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 0,
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
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotCompleted: {
    fontSize: 20,
    color: '#d4c291',
    lineHeight: 24,
  },
  stepDotPending: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: safeTypography.sizes.sm || 13,
    fontFamily: safeTypography.fonts.secondary,
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  stepLabelActive: {
    color: '#FFFFFF',
    fontFamily: safeTypography.fonts.secondarySemiBold,
    fontWeight: safeTypography.weights.semiBold,
  },
  stepLabelCompleted: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: safeTypography.fonts.secondary,
    fontWeight: safeTypography.weights.medium,
  },
  stepLabelPending: {
    color: '#4B5563',
    opacity: 0.8,
  },
  footer: {
    marginTop: safeSpacing.lg,
    paddingTop: safeSpacing.lg,
    alignItems: 'center',
    gap: safeSpacing.sm,
  },
  footerDot: {
    fontSize: 18,
    color: '#d4c291',
    lineHeight: 22,
  },
  completeMessage: {
    fontSize: safeTypography.sizes.sm + 2 || 15,
    fontFamily: safeTypography.fonts.secondarySemiBold,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: safeTypography.weights.semiBold,
  },
});

