import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@components/common/Screen';
import { Loading } from '@components/common/Loading';
import { ProfileHeader, SecurityStatus, CookieStatus, CookieCaptureModal, LanguageSelector } from '@components/profile';
import { useAuth } from '@hooks/useAuth';
import { useLanguage } from '@contexts/LanguageContext';
import { useProfileCard } from '@hooks/useProfileCard';
import { useCustomAlert } from '@components/common/CustomAlertDialog';
import { spacing, typography } from '@theme';
import { LegalFooter } from '@components/common/LegalFooter';

export const ProfileScreen: React.FC = () => {
  const { logout, steamId } = useAuth();
  const { profileCard, isLoading, refetch } = useProfileCard();
  const { t } = useLanguage();

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );
  const { showAlert, AlertDialog } = useCustomAlert();
  const [isCookieModalVisible, setIsCookieModalVisible] = useState(false);
  const [cookieRefreshTrigger, setCookieRefreshTrigger] = useState(0);

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64;
  const bottomPadding = tabBarHeight + insets.bottom + 24;

  const handleLogout = () => {
    showAlert(
      t('signOutConfirmTitle'),
      t('signOutConfirmMessage'),
      'warning',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('signOut'),
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
    );
  };

  if (isLoading && !profileCard) {
    return (
      <Screen showPremiumBackground={false}>
        <Loading fullScreen message={t('profileLoading')} />
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} style={styles.container} showPremiumBackground={false}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: statusBarHeight + spacing.md,
            paddingBottom: 32 + bottomPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {profileCard && (
          <>
            <ProfileHeader profileCard={profileCard} />

            {profileCard.trust_status && (
              <SecurityStatus trustStatus={profileCard.trust_status} />
            )}

            <CookieStatus
              onCapturePress={() => setIsCookieModalVisible(true)}
              refreshTrigger={cookieRefreshTrigger}
            />
          </>
        )}

        <LanguageSelector />

        <CookieCaptureModal
          visible={isCookieModalVisible}
          onClose={() => setIsCookieModalVisible(false)}
          onSuccess={() => {
            refetch();
            setCookieRefreshTrigger(prev => prev + 1);
          }}
        />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutButtonText}>{t('signOut')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
          <LegalFooter />
        </View>
      </ScrollView>
      <AlertDialog />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  actions: { marginTop: spacing.lg, gap: spacing.md },
  footerContainer: { marginTop: spacing.xl, paddingBottom: spacing.md, alignItems: 'center' },
  logoutButton: {
    backgroundColor: 'rgba(229, 115, 115, 0.05)',
    borderWidth: 1,
    borderColor: '#E57373',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  logoutButtonText: {
    fontSize: typography.sizes.sm,
    color: '#E57373',
    fontWeight: typography.weights.semiBold,
    fontFamily: typography.fonts.secondaryBold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
