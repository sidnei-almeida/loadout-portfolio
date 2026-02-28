import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Screen } from '@components/common/Screen';
import { SteamButton } from '@components/auth/SteamButton';
import { SteamLoginModal } from '@components/auth/SteamLoginModal';
import { TermsModal } from '@components/auth/TermsModal';
import { useAuth } from '@hooks/useAuth';
import { colors, spacing, typography } from '@theme';
import { LegalDisclaimer } from '@components/common/LegalDisclaimer';
import { logger } from '@utils/logger';

const safeTypography = typography || {
  fonts: {
    secondaryRegular: 'Rajdhani-Regular',
    secondary: 'Rajdhani',
    primaryBold: 'Orbitron-Bold',
    secondaryBold: 'Rajdhani-Bold',
  },
  weights: { medium: '500', bold: '700' },
  sizes: { xs: 11 },
};
const safeColors = colors || { textSecondary: '#B8BCC8', primary: '#FFD700' };
const safeSpacing = spacing || { xs: 8, sm: 8, md: 16, xl: 20, xxl: 28 };

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onSteamLogin = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = async (steamId: string) => {
    setIsLoading(true);
    try {
      login(steamId);
    } catch (error) {
      logger.error('[LOGIN] Error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={styles.container} showPremiumBackground={false}>
      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.loadoutWrapper}>
            <Text style={styles.loadoutText}>LOADOUT</Text>
          </View>
        </View>

        <View style={styles.middleSection} />

        <View style={styles.bottomSection}>
          <View style={styles.buttonContainer}>
            <SteamButton
              onPress={onSteamLogin}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>

          <Text style={styles.poweredBy}>Powered By Steam Web API</Text>

          <Text style={styles.loginNote}>
            By signing in, you agree to our{' '}
            <Text
              style={styles.termsLink}
              onPress={() => setShowTermsModal(true)}
            >
              terms of service
            </Text>
          </Text>

          <LegalDisclaimer showPrivacyLink />
        </View>
      </View>

      <SteamLoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />

      <TermsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: safeSpacing.xl,
    paddingTop: safeSpacing.xxl * 2,
    paddingBottom: safeSpacing.xl * 1.5,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    zIndex: 1,
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
  },
  loadoutWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: safeSpacing.xxl,
  },
  loadoutText: {
    fontSize: 48,
    fontFamily: safeTypography?.fonts?.secondaryBold || 'Rajdhani-Bold',
    fontWeight: safeTypography?.weights?.bold || '700',
    color: '#d4c291',
    letterSpacing: 4,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(212, 194, 145, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  middleSection: {
    flex: 1,
    minHeight: safeSpacing.xxl * 2,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: safeSpacing.md,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: safeSpacing.sm,
  },
  poweredBy: {
    fontSize: 9,
    fontFamily: safeTypography.fonts.secondaryRegular,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: safeTypography.weights.medium,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: safeSpacing.xs,
  },
  loginNote: {
    fontSize: safeTypography.sizes.xs - 1,
    fontFamily: safeTypography.fonts.secondary,
    color: safeColors.textSecondary,
    textAlign: 'center',
    opacity: 0.5,
  },
  termsLink: {
    color: '#d4c291',
    opacity: 0.8,
    textDecorationLine: 'underline',
  },
});
