import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Screen } from '@components/common/Screen';
import { SteamButton } from '@components/auth/SteamButton';
import { SteamLoginModal } from '@components/auth/SteamLoginModal';
import { TermsModal } from '@components/auth/TermsModal';
import { useAuth } from '@hooks/useAuth';
import { colors, spacing, typography } from '@theme';

// Helper para garantir valores seguros
const safeTypography = typography || {
  fonts: { 
    secondaryRegular: 'Rajdhani-Regular', 
    secondary: 'Rajdhani',
    primaryBold: 'Orbitron-Bold',
  },
  weights: { medium: '500', bold: '700' },
  sizes: { xs: 11 },
};
const safeColors = colors || { textSecondary: '#B8BCC8', primary: '#FFD700' };
const safeSpacing = spacing || { xs: 8, sm: 8, md: 16, xl: 20, xxl: 28 };

export const LoginScreen: React.FC = () => {
  const { handleSteamLogin } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onSteamLogin = () => {
    setShowLoginModal(true);
  };

  const handleLoginSuccess = async (token: string) => {
    setIsLoading(true);
    try {
      const result = await handleSteamLogin(token);
      
      if (!result.success) {
        Alert.alert(
          'Login Error',
          result.error || 'Could not sign in. Please try again.',
          [{ text: 'OK' }]
        );
      }
      // Se sucesso, o AuthContext já redireciona automaticamente
    } catch (error) {
      console.error('[LOGIN] Erro:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={styles.container} showPremiumBackground={false}>
      {/* Content - positioned above video with space-between layout */}
      <View style={styles.content}>
        {/* Top Section: LOADOUT Logo */}
        <View style={styles.topSection}>
          <View style={styles.loadoutWrapper}>
            <Text style={styles.loadoutText}>LOADOUT</Text>
          </View>
        </View>

        {/* Middle Section: Empty space (video breathes here) */}
        <View style={styles.middleSection} />

        {/* Bottom Section: Button, Branding, Legal */}
        <View style={styles.bottomSection}>
          {/* Botão Steam Tático */}
          <View style={styles.buttonContainer}>
            <SteamButton
              onPress={onSteamLogin}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>

          {/* Powered By Text - Discreto */}
          <Text style={styles.poweredBy}>Powered By Steam Web API</Text>

          {/* Termos de serviço - Rodapé absoluto */}
          <Text style={styles.loginNote}>
            By signing in, you agree to our{' '}
            <Text
              style={styles.termsLink}
              onPress={() => setShowTermsModal(true)}
            >
              terms of service
            </Text>
          </Text>
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
    backgroundColor: 'transparent', // Transparente para o vídeo aparecer
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: safeSpacing.xl,
    paddingTop: safeSpacing.xxl * 2, // Generous top padding (SafeArea)
    paddingBottom: safeSpacing.xl * 1.5, // Bottom padding for safe area
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    zIndex: 1, // Ensure content is above video and overlay
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
  },
  loadoutWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: safeSpacing.xxl, // Generous top margin for prominence
  },
  loadoutText: {
    fontSize: 48,
    fontFamily: typography?.fonts?.secondaryBold || 'Rajdhani-Bold',
    fontWeight: typography?.weights?.bold || '700',
    color: '#d4c291', // Tactical Gold
    letterSpacing: 4, // Letter spacing para elegância
    textTransform: 'uppercase',
    // Drop shadow to make gold pop against smoke background
    textShadowColor: 'rgba(212, 194, 145, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  middleSection: {
    flex: 1, // Takes up available space (breathing room for video)
    minHeight: safeSpacing.xxl * 2, // Minimum height
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
    color: 'rgba(255, 255, 255, 0.6)', // White with reduced opacity
    fontWeight: safeTypography.weights.medium,
    letterSpacing: 3, // Increased letter spacing for sophistication
    textTransform: 'uppercase',
    marginBottom: safeSpacing.xs,
  },
  loginNote: {
    fontSize: safeTypography.sizes.xs - 1, // Slightly smaller
    fontFamily: safeTypography.fonts.secondary,
    color: safeColors.textSecondary,
    textAlign: 'center',
    opacity: 0.5, // Reduced opacity (lowest hierarchy)
  },
  termsLink: {
    color: '#d4c291', // Tactical Gold for link
    opacity: 0.8,
    textDecorationLine: 'underline',
  },
});
