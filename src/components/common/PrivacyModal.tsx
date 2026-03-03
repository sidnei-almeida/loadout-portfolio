import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography } from '@theme';

interface PrivacyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.overlay} />

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>PRIVACY POLICY</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.lastUpdated}>
              Last updated: {new Date().toLocaleDateString('en-US')}
            </Text>

            <Text style={styles.sectionTitle}>1. LOCAL-FIRST ARCHITECTURE</Text>
            <Text style={styles.paragraph}>
              Loadout Portfolio is built on a 100% Local-First architecture. All your data — including inventory items, price history, portfolio snapshots, and preferences — is stored exclusively on your device using on-device databases (SQLite and MMKV). We do not operate servers, cloud databases, or any remote data collection infrastructure.
            </Text>

            <Text style={styles.sectionTitle}>2. DATA WE DO NOT COLLECT</Text>
            <Text style={styles.paragraph}>
              We do not collect, transmit, store, or process any personal data on external servers. Specifically, we do not collect:
            </Text>
            <Text style={styles.bulletItem}>• Personal identification information</Text>
            <Text style={styles.bulletItem}>• Steam credentials or passwords</Text>
            <Text style={styles.bulletItem}>• Usage analytics or telemetry</Text>
            <Text style={styles.bulletItem}>• Location data</Text>
            <Text style={styles.bulletItem}>• Device identifiers for tracking</Text>
            <Text style={styles.bulletItem}>• Advertising identifiers</Text>

            <Text style={styles.sectionTitle}>3. STEAM AUTHENTICATION</Text>
            <Text style={styles.paragraph}>
              When you sign in, your Steam credentials are exchanged directly between your device and Valve Corporation's servers through a secure WebView. Loadout Portfolio never intercepts, reads, transmits, or stores your Steam password. The only data retained locally on your device are session cookies necessary to access your public inventory.
            </Text>

            <Text style={styles.sectionTitle}>4. STEAM API USAGE</Text>
            <Text style={styles.paragraph}>
              The app makes direct API calls from your device to Steam's public APIs to fetch your inventory data and market prices. These requests go directly from your device to Valve's servers — they never pass through any intermediary server operated by us.
            </Text>

            <Text style={styles.sectionTitle}>5. ON-DEVICE STORAGE</Text>
            <Text style={styles.paragraph}>
              All data is stored in encrypted local databases on your device:
            </Text>
            <Text style={styles.bulletItem}>• SQLite: Inventory items, price history, portfolio snapshots</Text>
            <Text style={styles.bulletItem}>• MMKV: Session tokens, preferences, cooldown timers</Text>
            <Text style={styles.paragraph}>
              This data never leaves your device and is not backed up to any cloud service controlled by us.
            </Text>

            <Text style={styles.sectionTitle}>6. DATA DELETION</Text>
            <Text style={styles.paragraph}>
              If you uninstall Loadout Portfolio, all locally stored data is permanently and irreversibly deleted from your device. You can also clear all app data at any time through your device's system settings.
            </Text>

            <Text style={styles.sectionTitle}>7. THIRD-PARTY SERVICES</Text>
            <Text style={styles.paragraph}>
              The only third-party service the app communicates with is Valve Corporation's Steam platform (steamcommunity.com and steampowered.com). We do not integrate any third-party analytics, advertising, or tracking SDKs.
            </Text>

            <Text style={styles.sectionTitle}>8. CHILDREN'S PRIVACY</Text>
            <Text style={styles.paragraph}>
              Loadout Portfolio does not knowingly collect any data from children under the age of 13. Since we do not collect any personal data from any user, this policy applies universally.
            </Text>

            <Text style={styles.sectionTitle}>9. CHANGES TO THIS POLICY</Text>
            <Text style={styles.paragraph}>
              We may update this Privacy Policy from time to time. Any changes will be reflected in the app with an updated "Last updated" date. Your continued use of the app constitutes acceptance of the updated policy.
            </Text>

            <Text style={styles.sectionTitle}>10. CONTACT</Text>
            <Text style={styles.paragraph}>
              If you have any questions about this Privacy Policy, please contact us through our official support channels.
            </Text>

            <View style={styles.spacer} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>BACK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.lg,
    zIndex: 1,
  },
  header: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: typography.fonts.primary,
    fontWeight: typography.weights.bold,
    color: '#d4c291',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(212, 194, 145, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  lastUpdated: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.secondary,
    color: colors.textSecondary,
    opacity: 0.7,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: typography.sizes.md + 2,
    fontFamily: typography.fonts.secondarySemiBold,
    fontWeight: typography.weights.semiBold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  paragraph: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.secondary,
    color: '#CCCCCC',
    lineHeight: 22,
    marginBottom: spacing.md,
    textAlign: 'left',
  },
  bulletItem: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.secondary,
    color: '#CCCCCC',
    lineHeight: 22,
    marginBottom: 4,
    paddingLeft: spacing.md,
  },
  spacer: {
    height: spacing.xxl,
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 194, 145, 0.15)',
  },
  backButton: {
    width: '100%',
    minHeight: 48,
    backgroundColor: '#121212',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d4c291',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonText: {
    fontFamily: typography.fonts.secondarySemiBold,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semiBold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
