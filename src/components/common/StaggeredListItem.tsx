import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const STAGGER_DELAY_MS = 50;
const ENTRANCE_DURATION = 400;

const easeOutExp = Easing.out(Easing.exp);

interface StaggeredListItemProps {
  children: React.ReactNode;
  index: number;
  style?: object;
}

/**
 * Wrapper para animação de entrada em cascata: fade-in + slide-up sutil.
 * opacity: 0 → 1, translateY: 20 → 0, delay incremental (50ms por item).
 */
export const StaggeredListItem: React.FC<StaggeredListItemProps> = ({
  children,
  index,
  style,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = index * STAGGER_DELAY_MS;

    const timer = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: ENTRANCE_DURATION,
        easing: easeOutExp,
      });
      translateY.value = withTiming(0, {
        duration: ENTRANCE_DURATION,
        easing: easeOutExp,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
};
