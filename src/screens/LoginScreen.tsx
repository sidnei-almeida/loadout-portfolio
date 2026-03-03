import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Screen } from '@components/common/Screen';
import { SteamButton } from '@components/auth/SteamButton';
import { SteamLoginModal } from '@components/auth/SteamLoginModal';
import { TermsModal } from '@components/auth/TermsModal';
import { LegalFooter } from '@components/common/LegalFooter';
import { useAuth } from '@hooks/useAuth';
import { colors, spacing, typography } from '@theme';
import { logger } from '@utils/logger';
import { storage } from '@services/storage';
import { syncProfile } from '@services/sync/profileSync';
import { syncInventory } from '@services/sync/inventorySync';
import { syncPrices } from '@services/sync/priceSync';
import { getCatalog } from '../database/repositories/catalogRepo';
import { getItemCount, getInventory, getTotalValue } from '../database/repositories/inventoryRepo';
import { createSnapshot, type SnapshotItemInput } from '../database/repositories/snapshotRepo';

const safeTypography = typography || {
  fonts: { secondaryBold: 'Rajdhani-Bold' },
  weights: { bold: '700' },
};
const safeSpacing = spacing || { sm: 8, md: 16, xl: 20, xxl: 28 };

export const LoginScreen: React.FC = () => {
  const {
    login,
    setPostLoginSyncing,
    updatePostLoginSyncStep,
    resetPostLoginSyncSteps,
  } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSuccess = async (steamId: string) => {
    setIsLoading(true);
    const syncErrors: string[] = [];

    try {
      resetPostLoginSyncSteps();
      setPostLoginSyncing(true);

      // Pre-flight: verify Steam cookies were saved to MMKV by the WebView
      const savedCookies = storage.getSteamCookies();
      if (!savedCookies?.sessionId || !savedCookies?.steamLoginSecure) {
        logger.error('[LOGIN] Steam cookies not found in MMKV after WebView login');
        Alert.alert(
          'Session Error',
          'Steam cookies were not captured. Please try signing in again.',
        );
        setPostLoginSyncing(false);
        setIsLoading(false);
        return;
      }
      logger.log('[LOGIN] Steam cookies verified in MMKV, starting sync...');

      // Step 1: Sync inventory from Steam
      updatePostLoginSyncStep('sync', 'processing');
      logger.log(`[LOGIN] Step 1: syncInventory(${steamId})`);
      try {
        const result = await syncInventory(steamId);
        logger.log(`[LOGIN] Inventory synced OK: ${result.itemsSynced} items, ${result.uniqueSkins} skins, ${result.pages} pages`);
      } catch (err: any) {
        syncErrors.push(`Inventory: ${err?.message}`);
        logger.error('[LOGIN] Inventory sync FAILED:', err?.message);
      }
      updatePostLoginSyncStep('sync', 'completed');

      // Step 2: Sync prices (only if catalog has items)
      updatePostLoginSyncStep('prices', 'processing');
      const catalog = getCatalog();
      logger.log(`[LOGIN] Step 2: catalog has ${catalog.length} skins`);
      const skinNames = catalog.map(s => s.market_hash_name);
      if (skinNames.length > 0) {
        try {
          const priceResult = await syncPrices(skinNames);
          logger.log(`[LOGIN] Prices synced: ${priceResult.success}/${priceResult.total}`);
        } catch (err: any) {
          syncErrors.push(`Prices: ${err?.message}`);
          logger.warn('[LOGIN] Price sync failed:', err?.message);
        }
      } else {
        logger.warn('[LOGIN] Skipping price sync: catalog is empty (inventory sync likely failed)');
      }
      updatePostLoginSyncStep('prices', 'completed');

      // Step 3: Sync Steam profile + create initial snapshot
      updatePostLoginSyncStep('load', 'processing');
      try {
        await syncProfile(steamId);
        logger.log('[LOGIN] Profile synced successfully');
      } catch (err: any) {
        syncErrors.push(`Profile: ${err?.message}`);
        logger.warn('[LOGIN] Profile sync failed:', err?.message);
      }

      // Auto-create baseline snapshot if inventory has items
      const itemCount = getItemCount();
      if (itemCount > 0) {
        try {
          const inventory = getInventory();
          const totalVal = getTotalValue();
          const snapshotItems: SnapshotItemInput[] = inventory.map(row => ({
            market_hash_name: row.market_hash_name,
            original_price: row.current_price,
            quantity: row.quantity,
          }));
          const today = new Date().toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          });
          createSnapshot(
            {
              description: `Automatic - ${today}`,
              icon: 'camera',
              total_value: totalVal,
              total_invested: totalVal,
              item_count: itemCount,
            },
            snapshotItems,
          );
          logger.log(`[LOGIN] Auto-snapshot created: ${itemCount} items, $${totalVal.toFixed(2)}`);
        } catch (err: any) {
          logger.warn('[LOGIN] Auto-snapshot failed:', err?.message);
        }
      }

      // Authenticate BEFORE marking the last step complete.
      // The RefreshProgressModal auto-calls onComplete 1.5s after all
      // steps are 'completed', which sets isPostLoginSyncing=false.
      login(steamId);
      updatePostLoginSyncStep('load', 'completed');

      // Show sync issues to user (non-blocking)
      if (syncErrors.length > 0) {
        setTimeout(() => {
          Alert.alert(
            'Sync Issues',
            'Some data could not be synced:\n\n' + syncErrors.join('\n'),
            [{ text: 'OK' }],
          );
        }, 2000);
      }

    } catch (error) {
      logger.error('[LOGIN] Error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.', [
        { text: 'OK' },
      ]);
      setPostLoginSyncing(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={styles.container} showPremiumBackground={false}>
      <View style={styles.content}>
        <View style={styles.topSection}>
          <Text style={styles.loadoutText}>LOADOUT</Text>
        </View>

        <View style={styles.middleSection} />

        <View style={styles.bottomSection}>
          <View style={styles.buttonContainer}>
            <SteamButton
              onPress={() => setShowLoginModal(true)}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>

          <Text style={styles.agreeText}>
            By signing in, you agree to the{' '}
            <Text style={styles.agreeLink} onPress={() => setShowTerms(true)}>
              Terms of Service
            </Text>
          </Text>

          <LegalFooter />
        </View>
      </View>

      <SteamLoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
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
    marginTop: safeSpacing.xxl,
  },
  loadoutText: {
    fontSize: 48,
    fontFamily: safeTypography.fonts.secondaryBold,
    fontWeight: safeTypography.weights.bold,
    color: '#D4C291',
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
  agreeText: {
    fontSize: 10,
    fontFamily: safeTypography.fonts.secondaryBold,
    color: 'rgba(212, 194, 145, 0.4)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  agreeLink: {
    color: 'rgba(212, 194, 145, 0.7)',
    textDecorationLine: 'underline',
  },
});
