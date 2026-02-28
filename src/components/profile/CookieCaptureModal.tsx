import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import CookieManager from '@react-native-cookies/cookies';
import { colors, spacing, typography } from '@theme';
import { useCustomAlert } from '@components/common/CustomAlertDialog';

const STEAM_LOGIN_URL = 'https://steamcommunity.com/login/home/';

const ALLOWED_HOSTS = [
  'steamcommunity.com',
  'steampowered.com',
  'store.steampowered.com',
  'login.steampowered.com',
  'help.steampowered.com',
];

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
  const { showAlert, AlertDialog } = useCustomAlert();
  const [isCapturing, setIsCapturing] = useState(false);

  const handleShouldStartLoad = (request: ShouldStartLoadRequest): boolean => {
    try {
      const url = new URL(request.url);
      return ALLOWED_HOSTS.some(h => url.hostname.endsWith(h));
    } catch {
      return false;
    }
  };

  const handleNavigationStateChange = async (navState: any) => {
    if (isCapturing) { return; }

    const url = navState.url ?? '';
    const isProfilePage =
      url.includes('steamcommunity.com/profiles') ||
      url.includes('steamcommunity.com/id') ||
      url.includes('steamcommunity.com/home');

    if (!isProfilePage) { return; }

    setIsCapturing(true);

    try {
      const cookies = await CookieManager.get('https://steamcommunity.com', true);

      const steamLoginSecure =
        (cookies as any)?.steamLoginSecure?.value ??
        (cookies as any)?.steamLoginSecure ??
        '';

      if (steamLoginSecure) {
        showAlert(
          'Success',
          'Steam session refreshed successfully.',
          'success',
          [{
            text: 'OK',
            onPress: () => {
              onSuccess?.();
              onClose();
            },
          }],
        );
      } else {
        showAlert(
          'Error',
          'Cookies not found after login. Please complete the full login flow.',
          'error',
          [{ text: 'OK' }],
        );
        setIsCapturing(false);
      }
    } catch {
      showAlert('Error', 'Could not capture cookies. Please try again.', 'error', [{ text: 'OK' }]);
      setIsCapturing(false);
    }
  };

  const handleClose = () => {
    if (isCapturing) {
      showAlert(
        'Please wait',
        'Cookie capture is in progress. Please wait for it to finish.',
        'warning',
        [{ text: 'OK' }],
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
          <Text style={styles.title}>Refresh Steam Session</Text>
          <TouchableOpacity
            onPress={handleClose}
            disabled={isCapturing}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Text style={styles.closeButtonText}>CLOSE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Sign in to Steam below. Your session will be captured automatically
            after login.
          </Text>
        </View>

        {isCapturing && (
          <View style={styles.capturingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.capturingText}>Capturing session...</Text>
          </View>
        )}

        <WebView
          source={{ uri: STEAM_LOGIN_URL }}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          style={styles.webview}
        />
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
});
