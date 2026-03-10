/**
 * TacticalToast — Avisos no estilo "terminal" para o tema Tactical Gold.
 * Overlay no topo da tela, animação suave, tipografia monoespaçada.
 *
 * Tipos: cooldown | error | warning | info
 * Formato: [ TIPO ] - Mensagem (valor numérico em dourado quando aplicável)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { typography } from '@theme';

const TACTICAL_GOLD = '#d4c291';
const BORDER_ERROR = 'rgba(239, 68, 68, 0.6)';
const BORDER_WARNING = 'rgba(245, 158, 11, 0.5)';
const BORDER_INFO = 'rgba(212, 194, 145, 0.35)';
const BG = '#0a0a0a';
const MONO_FONT = typography?.fonts?.monoRegular ?? typography?.fonts?.mono ?? 'JetBrainsMono-Regular';

export type TacticalToastType = 'cooldown' | 'error' | 'warning' | 'info';

interface TacticalToastProps {
  visible: boolean;
  type: TacticalToastType;
  message: string;
  /** Extração do tempo para destaque (ex: "24s", "2min") — se null, usa regex em message */
  timeValue?: string | null;
  onDismiss: () => void;
  /** Duração em ms antes de auto-dismiss (0 = não auto-dismiss) */
  duration?: number;
  position?: 'top' | 'bottom';
}

const TYPE_LABELS: Record<TacticalToastType, string> = {
  cooldown: 'COOLDOWN',
  error: 'ERRO',
  warning: 'AVISO',
  info: 'INFO',
};

/** Extrai padrões como "24s", "2min" da mensagem */
function extractTimeFromMessage(message: string): string | null {
  const m = message.match(/(\d+(?:s|sec|min|m)\b)/i);
  return m ? m[1] : null;
}

export const TacticalToast: React.FC<TacticalToastProps> = ({
  visible,
  type,
  message,
  timeValue,
  onDismiss,
  duration = 5000,
  position = 'top',
}) => {
  const [isExiting, setIsExiting] = React.useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(position === 'top' ? -20 : 20)).current;

  useEffect(() => {
    if (visible) {
      setIsExiting(false);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const t = duration > 0 ? setTimeout(onDismiss, duration) : null;
      return () => {
        if (t) clearTimeout(t);
      };
    } else {
      setIsExiting(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: position === 'top' ? -20 : 20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setIsExiting(false));
    }
  }, [visible, duration, onDismiss, position, opacity, translateY]);

  if (!visible && !isExiting) return null;

  const borderColor =
    type === 'error' ? BORDER_ERROR :
    type === 'warning' ? BORDER_WARNING :
    BORDER_INFO;

  const extracted = timeValue ?? extractTimeFromMessage(message);
  let displayMessage = message;
  if (extracted) {
    displayMessage = message.replace(extracted, '{{TIME}}');
  }

  const parts = displayMessage.split('{{TIME}}');

  return (
    <Animated.View
      style={[
        styles.overlay,
        position === 'top' ? styles.overlayTop : styles.overlayBottom,
        { opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={[styles.container, { borderColor }]}
        onPress={onDismiss}
        activeOpacity={1}
      >
        <Text style={styles.bracket}>[</Text>
        <Text style={styles.typeLabel}>{TYPE_LABELS[type]}</Text>
        <Text style={styles.bracket}>]</Text>
        <Text style={styles.dash}> — </Text>
        {parts.length === 1 ? (
          <Text style={styles.message}>{message}</Text>
        ) : (
          <Text style={styles.message}>
            {parts[0]}
            <Text style={styles.timeHighlight}>{extracted}</Text>
            {parts[1]}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 16,
    zIndex: 99999,
    elevation: 99999,
  },
  overlayTop: {
    top: 0,
  },
  overlayBottom: {
    bottom: 0,
  },
  container: {
    backgroundColor: BG,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  bracket: {
    fontFamily: MONO_FONT,
    fontSize: 12,
    color: 'rgba(180, 180, 180, 0.9)',
    letterSpacing: 1.5,
  },
  typeLabel: {
    fontFamily: MONO_FONT,
    fontSize: 12,
    fontWeight: '600',
    color: TACTICAL_GOLD,
    letterSpacing: 1.5,
  },
  dash: {
    fontFamily: MONO_FONT,
    fontSize: 12,
    color: 'rgba(180, 180, 180, 0.85)',
    letterSpacing: 0.5,
  },
  message: {
    fontFamily: MONO_FONT,
    fontSize: 12,
    color: 'rgba(220, 220, 220, 0.95)',
    letterSpacing: 0.8,
    flex: 1,
  },
  timeHighlight: {
    color: TACTICAL_GOLD,
    fontWeight: '600',
  },
});
