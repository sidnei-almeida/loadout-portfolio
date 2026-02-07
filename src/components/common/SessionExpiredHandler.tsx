import React, { useEffect, useRef } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useCustomAlert } from './CustomAlertDialog';
import { getSessionExpiredMessage } from '@utils/sessionMessages';

/**
 * Componente que monitora a expiração da sessão e exibe um alerta divertido
 * quando detecta que o usuário foi deslogado por sessão expirada
 */
export const SessionExpiredHandler: React.FC = () => {
  const { sessionExpired, clearSessionExpired } = useAuth();
  const { showAlert, AlertDialog } = useCustomAlert();
  const hasShownAlertRef = useRef(false);

  useEffect(() => {
    if (sessionExpired && !hasShownAlertRef.current) {
      hasShownAlertRef.current = true;
      const { title, message } = getSessionExpiredMessage();
      
      showAlert(
        title,
        message,
        'warning',
        [
          {
            text: 'OK',
            onPress: () => {
              clearSessionExpired();
              hasShownAlertRef.current = false;
            },
          },
        ]
      );
    }
  }, [sessionExpired, showAlert, clearSessionExpired]);

  // Resetar flag quando sessionExpired for limpo
  useEffect(() => {
    if (!sessionExpired) {
      hasShownAlertRef.current = false;
    }
  }, [sessionExpired]);

  return <AlertDialog />;
};

