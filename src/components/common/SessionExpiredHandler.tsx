import React, { useEffect, useRef } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useLanguage } from '@contexts/LanguageContext';
import { useCustomAlert } from './CustomAlertDialog';
import { getSessionExpiredMessage } from '@utils/sessionMessages';

/**
 * Componente que monitora a expiração da sessão e exibe um alerta
 * quando detecta que o usuário foi deslogado por sessão expirada
 */
export const SessionExpiredHandler: React.FC = () => {
  const { sessionExpired, clearSessionExpired } = useAuth();
  const { t } = useLanguage();
  const { showAlert, AlertDialog } = useCustomAlert();
  const hasShownAlertRef = useRef(false);

  useEffect(() => {
    if (sessionExpired && !hasShownAlertRef.current) {
      hasShownAlertRef.current = true;
      const { title, message } = getSessionExpiredMessage(t);

      showAlert(
        title,
        message,
        'warning',
        [
          {
            text: t('ok'),
            onPress: () => {
              clearSessionExpired();
              hasShownAlertRef.current = false;
            },
          },
        ]
      );
    }
  }, [sessionExpired, showAlert, clearSessionExpired, t]);

  // Resetar flag quando sessionExpired for limpo
  useEffect(() => {
    if (!sessionExpired) {
      hasShownAlertRef.current = false;
    }
  }, [sessionExpired]);

  return <AlertDialog />;
};

