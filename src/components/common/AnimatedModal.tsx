import React, { useEffect } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const MODAL_DURATION = 320;
const MODAL_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);

interface AnimatedModalProps {
  visible: boolean;
  onRequestClose?: () => void;
  children: React.ReactNode;
  overlayStyle?: object;
  contentStyle?: object;
  transparent?: boolean;
  statusBarTranslucent?: boolean;
}

/**
 * Modal com entrada suave: fade-in + scale-up (0.95 → 1.0).
 * Curva iOS weighted para sensação premium, sem bounce.
 */
export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  visible,
  onRequestClose,
  children,
  overlayStyle,
  contentStyle,
  transparent = true,
  statusBarTranslucent = true,
}) => {
  const overlayOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.95);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, {
        duration: MODAL_DURATION,
        easing: MODAL_EASING,
      });
      contentScale.value = withTiming(1, {
        duration: MODAL_DURATION,
        easing: MODAL_EASING,
      });
    } else {
      overlayOpacity.value = withTiming(0, {
        duration: MODAL_DURATION * 0.8,
        easing: MODAL_EASING,
      });
      contentScale.value = withTiming(0.95, {
        duration: MODAL_DURATION * 0.8,
        easing: MODAL_EASING,
      });
    }
  }, [visible]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType="none"
      onRequestClose={onRequestClose}
      statusBarTranslucent={statusBarTranslucent}
    >
      <Animated.View style={[styles.overlay, overlayStyle, overlayAnimatedStyle]}>
        <Animated.View style={[styles.contentWrapper, contentStyle, contentAnimatedStyle]}>
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: '100%',
  },
});
