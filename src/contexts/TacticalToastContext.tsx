/**
 * Context global para TacticalToast — permite exibir avisos táticos
 * de qualquer lugar do app sem passar props.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { View } from 'react-native';
import { TacticalToast, type TacticalToastType } from '@components/common/TacticalToast';
import { useLanguage } from '@contexts/LanguageContext';

interface ToastState {
  visible: boolean;
  type: TacticalToastType;
  message: string;
  timeValue?: string | null;
}

interface TacticalToastContextType {
  showToast: (type: TacticalToastType, message: string, options?: { timeValue?: string; duration?: number }) => void;
  showCooldown: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  hideToast: () => void;
}

const TacticalToastContext = createContext<TacticalToastContextType | null>(null);

const INITIAL: ToastState = {
  visible: false,
  type: 'info',
  message: '',
  timeValue: null,
};

/** Extrai o tempo da mensagem COOLDOWN: "Wait 24s before..." → { displayMessage, timeValue } */
function parseCooldownMessage(
  msg: string,
  t: (key: string) => string,
): { displayMessage: string; timeValue?: string } {
  const m = msg.match(/(\d+(?:s|sec|min|m)\b)/i);
  const timeValue = m ? m[1] : undefined;
  const displayMessage = timeValue
    ? `${t('cooldown')} ${timeValue}`
    : msg.replace(/^COOLDOWN:\s*/i, '').trim() || msg;
  return { displayMessage, timeValue };
}

export function TacticalToastProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [state, setState] = useState<ToastState>(INITIAL);
  const [duration, setDuration] = useState(5000);

  const hideToast = useCallback(() => {
    setState(prev => ({ ...prev, visible: false }));
  }, []);

  const showToast = useCallback((
    type: TacticalToastType,
    message: string,
    options?: { timeValue?: string; duration?: number },
  ) => {
    setDuration(options?.duration ?? 5000);
    setState({
      visible: true,
      type,
      message,
      timeValue: options?.timeValue ?? null,
    });
  }, []);

  const showCooldown = useCallback((message: string) => {
    const { displayMessage, timeValue } = parseCooldownMessage(message, t);
    setDuration(5000);
    setState({
      visible: true,
      type: 'cooldown',
      message: displayMessage,
      timeValue: timeValue ?? null,
    });
  }, [t]);

  const showError = useCallback((message: string) => {
    setDuration(5000);
    setState({
      visible: true,
      type: 'error',
      message,
      timeValue: null,
    });
  }, []);

  const showWarning = useCallback((message: string) => {
    setDuration(5000);
    setState({
      visible: true,
      type: 'warning',
      message,
      timeValue: null,
    });
  }, []);

  const showInfo = useCallback((message: string) => {
    setDuration(4000);
    setState({
      visible: true,
      type: 'info',
      message,
      timeValue: null,
    });
  }, []);

  const value = React.useMemo(
    () => ({
      showToast,
      showCooldown,
      showError,
      showWarning,
      showInfo,
      hideToast,
    }),
    [showToast, showCooldown, showError, showWarning, showInfo, hideToast],
  );

  return (
    <TacticalToastContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        <TacticalToast
          visible={state.visible}
          type={state.type}
          message={state.message}
          timeValue={state.timeValue}
          onDismiss={hideToast}
          duration={duration}
          position="top"
        />
      </View>
    </TacticalToastContext.Provider>
  );
}

export function useTacticalToast(): TacticalToastContextType {
  const ctx = useContext(TacticalToastContext);
  if (!ctx) throw new Error('useTacticalToast must be used within TacticalToastProvider');
  return ctx;
}
