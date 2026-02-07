import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PremiumBackgroundProps {
  children?: React.ReactNode;
}

export const PremiumBackground: React.FC<PremiumBackgroundProps> = ({ children }) => {
  const glow1Anim = useRef(new Animated.Value(1)).current;
  const glow2Anim = useRef(new Animated.Value(1)).current;
  const glow1Opacity = useRef(new Animated.Value(0.35)).current;
  const glow2Opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    // Animação contínua para os glows
    const createGlowAnimation = (
      scaleAnim: Animated.Value,
      opacityAnim: Animated.Value,
      delay: number = 0
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.15,
              duration: 4000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.55,
              duration: 4000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 4000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.35,
              duration: 4000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    const glow1Animation = createGlowAnimation(glow1Anim, glow1Opacity);
    const glow2Animation = createGlowAnimation(glow2Anim, glow2Opacity, 2000);

    glow1Animation.start();
    glow2Animation.start();

    return () => {
      glow1Animation.stop();
      glow2Animation.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Base gradient background */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <SvgRadialGradient id="baseGradient" cx="50%" cy="0%" r="100%">
            <Stop offset="0%" stopColor="rgba(34, 47, 74, 0.95)" stopOpacity="1" />
            <Stop offset="55%" stopColor="rgba(10, 14, 18, 0.97)" stopOpacity="1" />
            <Stop offset="100%" stopColor="#05070c" stopOpacity="1" />
          </SvgRadialGradient>
          {/* Overlay gradient */}
          <SvgRadialGradient id="overlayGradient" cx="50%" cy="50%" r="70%">
            <Stop offset="0%" stopColor="rgba(255, 215, 0, 0.08)" stopOpacity="0.7" />
            <Stop offset="35%" stopColor="transparent" stopOpacity="0" />
            <Stop offset="65%" stopColor="transparent" stopOpacity="0" />
            <Stop offset="100%" stopColor="rgba(59, 130, 246, 0.12)" stopOpacity="0.7" />
          </SvgRadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#baseGradient)" />
        <Rect width="100%" height="100%" fill="url(#overlayGradient)" />
      </Svg>

      {/* Grid pattern - padrão sutil de linhas */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" opacity={0.25}>
        <Defs>
          <SvgRadialGradient id="gridGradient" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="rgba(255, 215, 0, 0.015)" stopOpacity="1" />
            <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        {/* Criar algumas linhas principais do grid - otimizado */}
        {Array.from({ length: Math.min(20, Math.ceil(SCREEN_HEIGHT / 40)) }).map((_, i) => (
          <Rect
            key={`h-${i}`}
            x="0"
            y={i * 40}
            width="100%"
            height={0.5}
            fill="rgba(255, 215, 0, 0.015)"
          />
        ))}
        {Array.from({ length: Math.min(15, Math.ceil(SCREEN_WIDTH / 40)) }).map((_, i) => (
          <Rect
            key={`v-${i}`}
            x={i * 40}
            y="0"
            width={0.5}
            height="100%"
            fill="rgba(255, 215, 0, 0.015)"
          />
        ))}
      </Svg>

      {/* Animated glows */}
      <Animated.View
        style={[
          styles.glow1,
          {
            transform: [{ scale: glow1Anim }],
            opacity: glow1Opacity,
          },
        ]}
      >
        <View style={styles.glowInner1} />
      </Animated.View>

      <Animated.View
        style={[
          styles.glow2,
          {
            transform: [{ scale: glow2Anim }],
            opacity: glow2Opacity,
          },
        ]}
      >
        <View style={styles.glowInner2} />
      </Animated.View>

      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute',
    top: -SCREEN_HEIGHT * 0.05,
    left: -SCREEN_WIDTH * 0.1,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  glowInner1: {
    width: '100%',
    height: '100%',
    borderRadius: 140,
    backgroundColor: 'rgba(255, 215, 0, 0.7)',
    // Blur effect simulado com opacidade
  },
  glow2: {
    position: 'absolute',
    bottom: -SCREEN_HEIGHT * 0.1,
    right: -SCREEN_WIDTH * 0.2,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  glowInner2: {
    width: '100%',
    height: '100%',
    borderRadius: 140,
    backgroundColor: 'rgba(71, 178, 255, 0.65)',
  },
});

