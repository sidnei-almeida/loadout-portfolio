/**
 * SteamLoginModal — Local-First version.
 *
 * Opens a WebView directly to Steam Community login.
 * After the user signs in, we detect the redirect to their profile,
 * extract `steamLoginSecure` cookie (which contains the steamId),
 * store session data in MMKV, and report success.
 *
 * No backend is involved.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import CookieManager from '@react-native-cookies/cookies';
import { useLanguage } from '@contexts/LanguageContext';
import { useCustomAlert } from '@components/common/CustomAlertDialog';
import { colors, spacing, typography } from '@theme';
import { storage } from '@services/storage';
import { logger } from '@utils/logger';

interface SteamLoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (steamId: string) => Promise<void>;
}

const STEAM_LOGIN_URL = 'https://steamcommunity.com/login/home/?goto=';

const ALLOWED_HOSTS = [
  'steamcommunity.com',
  'steampowered.com',
  'store.steampowered.com',
  'login.steampowered.com',
  'help.steampowered.com',
];

export const SteamLoginModal: React.FC<SteamLoginModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const { showAlert, AlertDialog } = useCustomAlert();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const processedRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setPageLoaded(false);
      setIsProcessing(false);
      processedRef.current = false;
    }
  }, [visible]);

  useEffect(() => {
    if (isLoading && !pageLoaded) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    }
  }, [isLoading, pageLoaded, pulseAnim]);

  /**
   * Extracts steamId from the `steamLoginSecure` cookie.
   * The cookie value format is: `steamId||tokenHash`
   */
  const extractSteamIdFromCookies = async (): Promise<string | null> => {
    try {
      const cookies = await CookieManager.get('https://steamcommunity.com', true);
      const raw =
        (cookies as any)?.steamLoginSecure?.value ??
        (cookies as any)?.steamLoginSecure;

      if (typeof raw === 'string' && raw.includes('%7C%7C')) {
        return decodeURIComponent(raw).split('||')[0];
      }
      if (typeof raw === 'string' && raw.includes('||')) {
        return raw.split('||')[0];
      }

      return null;
    } catch {
      return null;
    }
  };

  const handleNavigationStateChange = async (navState: any) => {
    const url: string = navState.url ?? '';

    if (!navState.loading && url && !url.includes('about:blank')) {
      setPageLoaded(true);
      setIsLoading(false);
    }

    const isLoggedIn =
      url.includes('steamcommunity.com/profiles/') ||
      url.includes('steamcommunity.com/id/') ||
      url.includes('steamcommunity.com/my');

    if (isLoggedIn && !processedRef.current) {
      processedRef.current = true;
      setIsProcessing(true);

      try {
        const steamId = await extractSteamIdFromCookies();

        if (!steamId) {
          const profileMatch = url.match(/steamcommunity\.com\/profiles\/(\d+)/);
          if (profileMatch) {
            await finishLogin(profileMatch[1]);
            return;
          }
          showAlert(t('error'), t('errorDetectSteamId'), 'error');
          processedRef.current = false;
          setIsProcessing(false);
          return;
        }

        await finishLogin(steamId);
      } catch (error) {
        logger.error('[AUTH] Error processing login:', error);
        showAlert(t('error'), t('sessionErrorCapture'), 'error');
        processedRef.current = false;
        setIsProcessing(false);
      }
    }
  };

  const finishLogin = async (steamId: string) => {
    // Capture cookies NOW while the WebView is still alive.
    // On Android, CookieManager.get() may fail after WebView unmounts.
    try {
      const cookies = await CookieManager.get('https://steamcommunity.com', true);
      const sessionId =
        (cookies as any)?.sessionid?.value ?? (cookies as any)?.sessionid ?? '';
      const steamLoginSecure =
        (cookies as any)?.steamLoginSecure?.value ??
        (cookies as any)?.steamLoginSecure ??
        '';

      if (sessionId && steamLoginSecure) {
        storage.setSteamCookies(sessionId, steamLoginSecure);
        logger.log('[AUTH] Cookies saved to MMKV before WebView close');
      } else {
        logger.warn('[AUTH] Could not read cookies before close', {
          hasSessionId: !!sessionId,
          hasLoginSecure: !!steamLoginSecure,
        });
      }

      await CookieManager.flush();
    } catch (err) {
      logger.warn('[AUTH] CookieManager.flush failed:', err);
    }

    storage.setSteamId(steamId);
    storage.setHasSession(true);

    onClose();
    await onSuccess(steamId);
  };

  const handleShouldStartLoad = (request: ShouldStartLoadRequest): boolean => {
    try {
      const url = new URL(request.url);
      return ALLOWED_HOSTS.some(h => url.hostname.endsWith(h));
    } catch {
      return false;
    }
  };

  const handleClose = () => {
    if (isProcessing) {
      showAlert(t('pleaseWait'), t('pleaseWaitMessage'), 'info');
      return;
    }
    onClose();
  };

  const renderLoading = () => (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#d4c291" />
      <Animated.Text style={[styles.loadingText, { opacity: pulseAnim }]}>
        {t('establishingSecureConnection')}
      </Animated.Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('signInWithSteam')}</Text>
          <View style={styles.headerRight}>
            {!isProcessing && (
              <TouchableOpacity onPress={handleClose} style={styles.cancelButton} activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>{t('cancelLogin')}</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.secureText}>{t('secureConnection')}</Text>
        </View>

        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#d4c291" />
            <Text style={styles.processingText}>{t('processingLogin')}</Text>
          </View>
        ) : (
          <View style={styles.webviewContainer}>
            <WebView
              source={{ uri: STEAM_LOGIN_URL }}
              onNavigationStateChange={handleNavigationStateChange}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              onLoadEnd={() => {
                setTimeout(() => {
                  setPageLoaded(true);
                  setIsLoading(false);
                }, 500);
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              thirdPartyCookiesEnabled={true}
              sharedCookiesEnabled={true}
              style={styles.webview}
              startInLoadingState={true}
              renderLoading={renderLoading}
            />
            {isLoading && !pageLoaded && (
              <View style={styles.loadingOverlayAbsolute}>{renderLoading()}</View>
            )}
          </View>
        )}
      </View>
      <AlertDialog />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl + 4,
    paddingBottom: spacing.md,
    backgroundColor: '#0F0F0F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 194, 145, 0.15)',
    position: 'relative',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#d4c291',
    fontFamily: typography.fonts.primaryBold,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  headerRight: { position: 'absolute', right: spacing.lg, top: spacing.xl + 4, flexDirection: 'row', alignItems: 'center' },
  cancelButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  cancelButtonText: { fontSize: typography.sizes.xs, fontFamily: typography.fonts.secondarySemiBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  secureText: { fontSize: typography.sizes.xs - 1, fontFamily: typography.fonts.secondaryRegular, color: 'rgba(255, 255, 255, 0.4)', marginTop: spacing.xs / 2 },
  processingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg, padding: spacing.xl, backgroundColor: colors.background },
  processingText: { fontSize: typography.sizes.md, color: '#d4c291', fontFamily: typography.fonts.secondarySemiBold, textTransform: 'uppercase', letterSpacing: 1 },
  webviewContainer: { flex: 1, position: 'relative' },
  webview: { flex: 1, backgroundColor: '#000000' },
  loadingOverlay: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  loadingOverlayAbsolute: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000', zIndex: 10 },
  loadingText: { fontSize: typography.sizes.sm, fontFamily: typography.fonts.secondarySemiBold, color: '#d4c291', textTransform: 'uppercase', letterSpacing: 2, marginTop: spacing.md },
});
