import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { colors, spacing, typography } from '@theme';

// Helper para garantir valores seguros
const safeTypography = typography || {
  fonts: { primaryMedium: 'Orbitron-Medium', primaryExtraBold: 'Orbitron-ExtraBold', secondarySemiBold: 'Rajdhani-SemiBold' },
  weights: { semiBold: '600' },
  sizes: { xs: 11 },
};
const safeColors = colors || { textSecondary: '#B8BCC8', error: '#EF4444', textMuted: '#6B7280' };
const safeSpacing = spacing || { xs: 8, sm: 8, md: 16, lg: 18, xl: 20 };
import { formatCurrency } from '@utils/currency';
import { RefreshIcon, ArrowUpIcon, ArrowDownIcon } from '@components/common';

interface ValueCardProps {
  totalValue: number;
  change?: {
    value: number;
    percent: number;
  };
  onRefresh?: () => void;
  isLoading?: boolean;
}

// Hook para animação de contagem de números
const useCountAnimation = (targetValue: number, duration: number = 1000) => {
  const [displayValue, setDisplayValue] = useState(() => targetValue || 0);
  const animationRef = useRef<number | null>(null);
  const startValueRef = useRef(targetValue || 0);
  const targetValueRef = useRef(targetValue || 0);
  const isMountedRef = useRef(true);
  const displayValueRef = useRef(targetValue || 0);

  // Atualizar displayValueRef sempre que displayValue mudar (sem useEffect para evitar loops)
  displayValueRef.current = displayValue;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const endValue = targetValue || 0;
    
    // Se não há mudança significativa, não animar
    if (Math.abs(endValue - targetValueRef.current) < 0.01) {
      targetValueRef.current = endValue;
      return;
    }

    // Atualizar referências
    const previousTarget = targetValueRef.current;
    targetValueRef.current = endValue;

    // Cancelar animação anterior se existir
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Se o valor mudou significativamente, atualizar startValue com o valor atual do display
    if (Math.abs(previousTarget - endValue) > 0.01) {
      startValueRef.current = displayValueRef.current;
    }

    // Função de easing cubic-out (igual ao app antigo)
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const startTime = Date.now();
    const startValue = startValueRef.current;

    const animate = () => {
      if (!isMountedRef.current) {
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = startValue + (endValue - startValue) * easedProgress;

      if (isMountedRef.current) {
        setDisplayValue(current);
        displayValueRef.current = current;
      }

      if (progress < 1 && isMountedRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        if (isMountedRef.current) {
          setDisplayValue(endValue);
          displayValueRef.current = endValue;
          startValueRef.current = endValue;
        }
        animationRef.current = null;
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [targetValue, duration]);

  return displayValue;
};

export const ValueCard: React.FC<ValueCardProps> = ({
  totalValue = 0,
  change,
  onRefresh,
  isLoading = false,
}) => {
  // Garantir que totalValue seja um número válido
  const safeTotalValue = typeof totalValue === 'number' && !isNaN(totalValue) ? totalValue : 0;
  const displayValue = useCountAnimation(safeTotalValue, 800);
  const animatedScale = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação de scale quando o valor muda
    Animated.sequence([
      Animated.timing(animatedScale, {
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [safeTotalValue, animatedScale]);

  // Animação de rotação do botão de refresh
  const rotationLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  
  useEffect(() => {
    if (isLoading) {
      // Iniciar rotação contínua
      rotateAnim.setValue(0);
      rotationLoopRef.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      rotationLoopRef.current.start();
    } else {
      // Parar a animação e resetar
      if (rotationLoopRef.current) {
        rotationLoopRef.current.stop();
        rotationLoopRef.current = null;
      }
      rotateAnim.stopAnimation(() => {
        rotateAnim.setValue(0);
      });
    }
    
    return () => {
      if (rotationLoopRef.current) {
        rotationLoopRef.current.stop();
        rotationLoopRef.current = null;
      }
    };
  }, [isLoading, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getChangeColor = () => {
    if (!change) return safeColors.textSecondary;
    if (change.value > 0) return '#22C55E'; // Bright green
    if (change.value < 0) return safeColors.error;
    return safeColors.textSecondary;
  };

  const getChangeIcon = () => {
    if (!change) return null;
    if (change.value > 0) return <ArrowUpIcon size={16} color="#22C55E" strokeWidth={2.5} />;
    if (change.value < 0) return <ArrowDownIcon size={16} color={safeColors.error} strokeWidth={2.5} />;
    return null;
  };

  const formatChange = () => {
    if (!change) return 'Loading history...';
    const sign = change.value >= 0 ? '+' : '';
    return `${sign}${formatCurrency(change.value)} (${sign}${change.percent.toFixed(2)}%)`;
  };

  const getChangeStyle = () => {
    if (!change) return styles.changeNeutral;
    if (change.value > 0) return styles.changePositive;
    if (change.value < 0) return styles.changeNegative;
    return styles.changeNeutral;
  };

  // Font size responsivo - usar useMemo para evitar recálculos
  const fontSize = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    // clamp(2.25rem, 7vw, 3.5rem) do CSS = aproximadamente 36px a 56px
    return Math.max(36, Math.min(screenWidth * 0.14, 56)); // Entre 36px e 56px
  }, []);
  
  // Valor formatado para exibição - sempre garantir que haja um valor
  const formattedValue = displayValue !== undefined && displayValue !== null 
    ? formatCurrency(displayValue) 
    : formatCurrency(0);

  return (
    <View style={styles.card}>
      {/* Refresh Button */}
      {onRefresh && (
        <TouchableOpacity
          onPress={onRefresh}
          disabled={isLoading}
          style={styles.refreshButton}
        >
          <Animated.View
            style={{
              transform: [{ rotate: rotation }],
            }}
          >
            <RefreshIcon 
              size={18} 
              color="#d4c291" 
              strokeWidth={2} 
            />
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.label}>CURRENT VALUE</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Valor Principal - Orbitron Extra Bold */}
        <View style={styles.valueContainer}>
          <Animated.Text 
            style={[
              styles.amount, 
              { 
                fontSize: fontSize + 4, // Slightly larger
                lineHeight: (fontSize + 4) * 1.1,
                transform: [{ scale: animatedScale }]
              }
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit={false}
            minimumFontScale={1}
            allowFontScaling={true}
          >
            {formattedValue || '$0.00'}
          </Animated.Text>
        </View>

        {/* Change Badge - Less rounded, tactical */}
        {change && (
          <View style={[styles.changeContainer, getChangeStyle()]}>
            {getChangeIcon() && (
              <View style={styles.changeIconContainer}>
                {getChangeIcon()}
              </View>
            )}
            <Text style={[styles.changeText, { color: getChangeColor() }]}>
              {formatChange()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent', // Transparent to show dark gradient background
    paddingVertical: safeSpacing.xl + safeSpacing.md, // Generous top spacing
    paddingHorizontal: safeSpacing.lg,
    marginBottom: safeSpacing.xl,
    position: 'relative',
  },
  refreshButton: {
    position: 'absolute',
    top: safeSpacing.xl,
    right: safeSpacing.lg,
    zIndex: 10,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  header: {
    marginBottom: safeSpacing.md,
  },
  label: {
    fontSize: safeTypography.sizes.xs,
    fontFamily: safeTypography.fonts.primaryMedium, // Orbitron-Medium
    color: '#d4c291', // Tactical Gold
    textTransform: 'uppercase',
    letterSpacing: 2, // Tracking
    opacity: 0.9,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  valueContainer: {
    marginBottom: safeSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: safeSpacing.sm,
  },
  amount: {
    fontFamily: safeTypography.fonts.primaryExtraBold, // Orbitron-ExtraBold
    letterSpacing: -0.5,
    color: '#d4c291', // Tactical Gold
    // Leve text-shadow dourado para destacar
    textShadowColor: 'rgba(212, 194, 145, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    textAlign: 'center',
    includeFontPadding: true,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: safeSpacing.xs,
    paddingHorizontal: safeSpacing.md,
    paddingVertical: safeSpacing.xs + 2,
    borderRadius: 6, // Less rounded (tactical)
    borderWidth: 1,
  },
  changeNeutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  changePositive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)', // Dark green translucent
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  changeNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  changeIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeText: {
    fontSize: safeTypography.sizes.xs + 1,
    fontFamily: safeTypography.fonts.secondarySemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: safeTypography.weights.semiBold,
  },
});
