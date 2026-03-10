import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const PRESS_SCALE = 0.97;
const PRESS_OPACITY = 0.9;
const PRESS_DURATION = 80;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 400,
  mass: 0.8,
};

interface PressableScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: object;
  disabled?: boolean;
}

/**
 * Wrapper tático para microinteração de toque: scale sutil (1 → 0.97) e opacity (1 → 0.9).
 * Transição rápida no press, spring pesado (sem bounce) na soltura.
 */
export const PressableScale: React.FC<PressableScaleProps> = ({
  children,
  onPress,
  style,
  disabled = false,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const gesture = Gesture.Tap()
    .enabled(!disabled)
    .onBegin(() => {
      scale.value = withTiming(PRESS_SCALE, { duration: PRESS_DURATION });
      opacity.value = withTiming(PRESS_OPACITY, { duration: PRESS_DURATION });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, SPRING_CONFIG);
      opacity.value = withSpring(1, SPRING_CONFIG);
    })
    .onEnd(() => {
      if (onPress) {
        runOnJS(onPress)();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
};
