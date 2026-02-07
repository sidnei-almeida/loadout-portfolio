import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import CookieManager from '@react-native-cookies/cookies';
import { colors, spacing, typography } from '@theme';
import { checkCookiesStatus, saveCookies } from '@services/cookies';
import { useAuth } from '@hooks/useAuth';
import { useCustomAlert } from '@components/common/CustomAlertDialog';

interface CookieCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CookieCaptureModal: React.FC<CookieCaptureModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { token } = useAuth();
  const { showAlert, AlertDialog } = useCustomAlert();
  const [loginUrl, setLoginUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const loadLoginUrl = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const status = await checkCookiesStatus(token);
      
      if (status.has_cookies) {
        showAlert(
          'Cookies already saved',
          'You already have valid cookies saved. No need to capture again.',
          'success',
          [{ text: 'OK', onPress: onClose }]
        );
        return;
      }

      if (status.login_url) {
        setLoginUrl(status.login_url);
      } else {
        const errorMessage = status.message || status.status === 'error' 
          ? 'Could not get login URL.' 
          : status.status === 'unauthorized'
          ? 'Session expired. Please sign in again.'
          : 'Could not get login URL.';
        showAlert('Error', errorMessage, 'error', [{ text: 'OK', onPress: onClose }]);
      }
    } catch {
      showAlert('Error', 'Could not check cookie status.', 'error', [{ text: 'OK', onPress: onClose }]);
    } finally {
      setIsLoading(false);
    }
  }, [token, onClose]);

  useEffect(() => {
    if (visible && token) {
      loadLoginUrl();
    }
  }, [visible, token, loadLoginUrl]);

  const handleNavigationStateChange = async (navState: any) => {
    // Verificar se chegou no perfil da Steam (login completo)
    if (
      navState.url.includes('steamcommunity.com/profiles') ||
      navState.url.includes('steamcommunity.com/id') ||
      navState.url.includes('steamcommunity.com/home')
    ) {
      setIsCapturing(true);
      
      try {
        // Capturar cookies usando CookieManager
        // CookieManager.get retorna um objeto onde as chaves são os nomes dos cookies
        const cookies = await CookieManager.get('https://steamcommunity.com', true);
        
        // CookieManager retorna um objeto com cookies como propriedades
        // Formato: { cookieName: { name, value, ... }, ... }
        const sessionId = (cookies as any).sessionid?.value || (cookies as any).sessionid;
        const steamLoginSecure = (cookies as any).steamLoginSecure?.value || (cookies as any).steamLoginSecure;
        
        // Se não encontrou, tentar formato alternativo (array)
        let sessionIdValue = sessionId;
        let steamLoginSecureValue = steamLoginSecure;
        
        if (!sessionIdValue || !steamLoginSecureValue) {
          // Tentar como array se o formato acima não funcionar
          const cookiesArray = Array.isArray(cookies) ? cookies : Object.values(cookies);
          const sessionCookie = cookiesArray.find((c: any) => c.name === 'sessionid' || (c as any).sessionid);
          const steamCookie = cookiesArray.find((c: any) => c.name === 'steamLoginSecure' || (c as any).steamLoginSecure);
          
          sessionIdValue = sessionCookie?.value || sessionCookie?.sessionid;
          steamLoginSecureValue = steamCookie?.value || steamCookie?.steamLoginSecure;
        }

        if (sessionIdValue && steamLoginSecureValue && token) {
          // Enviar cookies para o backend
          const result = await saveCookies(sessionIdValue, steamLoginSecureValue, token);
          
          if (result.success) {
            showAlert(
              'Success',
              'Cookies captured and saved successfully.',
              'success',
              [{ 
                text: 'OK', 
                onPress: () => {
                  onSuccess?.();
                  onClose();
                }
              }]
            );
          } else {
            showAlert('Error', result.message || 'Could not save cookies.', 'error', [{ text: 'OK' }]);
            setIsCapturing(false);
          }
        } else {
          showAlert(
            'Error',
            'Cookies not found after login. Make sure you complete the login flow.',
            'error',
            [{ text: 'OK' }]
          );
          setIsCapturing(false);
        }
      } catch (error) {
        console.error('[COOKIES] Erro ao capturar cookies:', error);
        showAlert('Error', 'Could not capture cookies. Please try again.', 'error', [{ text: 'OK' }]);
        setIsCapturing(false);
      }
    }
  };

  const handleClose = () => {
    if (isCapturing) {
      showAlert(
        'Please wait',
        'Cookie capture is in progress. Please wait for it to finish.',
        'warning',
        [{ text: 'OK' }]
      );
      return;
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Capture Steam Cookies</Text>
          <TouchableOpacity 
            onPress={handleClose} 
            disabled={isCapturing} 
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>CLOSE</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : loginUrl ? (
          <>
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Sign in to Steam in the window below. After you sign in, cookies will be captured automatically.
              </Text>
            </View>

            {isCapturing && (
              <View style={styles.capturingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.capturingText}>Capturing cookies...</Text>
              </View>
            )}

            <WebView
              source={{ uri: loginUrl }}
              onNavigationStateChange={handleNavigationStateChange}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              thirdPartyCookiesEnabled={true}
              sharedCookiesEnabled={true}
              style={styles.webview}
            />
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error loading login URL</Text>
          </View>
        )}
      </View>
      <AlertDialog />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semiBold,
    color: colors.text,
    fontFamily: typography.fonts.primary,
  },
  closeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  closeButtonText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.secondarySemiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  infoContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  capturingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  capturingText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  webview: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.error,
  },
});

