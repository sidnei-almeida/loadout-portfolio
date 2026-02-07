import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, Platform, TouchableOpacity, Text } from 'react-native';
import { Screen } from '@components/common/Screen';
import { Loading } from '@components/common/Loading';
import { ProfileHeader, SecurityStatus, CookieStatus, CookieCaptureModal } from '@components/profile';
import { useAuth } from '@hooks/useAuth';
import { useProfileCard } from '@hooks/useProfileCard';
import { useCustomAlert } from '@components/common/CustomAlertDialog';
import { spacing, typography } from '@theme';

export const ProfileScreen: React.FC = () => {
  const { logout } = useAuth();
  const { profileCard, isLoading, refetch } = useProfileCard();
  const { showAlert, AlertDialog } = useCustomAlert();
  const [isCookieModalVisible, setIsCookieModalVisible] = useState(false);
  const [cookieRefreshTrigger, setCookieRefreshTrigger] = useState(0);

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  const handleLogout = () => {
    showAlert(
      'Sign out',
      'Are you sure you want to sign out?',
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  if (isLoading && !profileCard) {
    return (
      <Screen showPremiumBackground={false}>
        <Loading fullScreen message="Loading profile..." />
      </Screen>
    );
  }

  return (
    <Screen scrollable style={styles.container} showPremiumBackground={false}>
      <View style={[styles.content, { paddingTop: statusBarHeight + spacing.md }]}>
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
        
        <CookieCaptureModal
          visible={isCookieModalVisible}
          onClose={() => setIsCookieModalVisible(false)}
          onSuccess={() => {
            // Recarregar dados do perfil e status dos cookies após captura bem-sucedida
            refetch();
            setCookieRefreshTrigger(prev => prev + 1);
          }}
        />
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutButtonText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
      <AlertDialog />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  logoutButton: {
    backgroundColor: 'transparent',
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
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.secondaryBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

