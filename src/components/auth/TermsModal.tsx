import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors, spacing, typography } from '@theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Dark overlay for text readability (glassmorphism effect) */}
        <View style={styles.overlay} />

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>TERMS OF SERVICE</Text>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.lastUpdated}>
              Last updated: {new Date().toLocaleDateString('en-US')}
            </Text>

            <Text style={styles.sectionTitle}>1. ACCEPTANCE OF TERMS</Text>
            <Text style={styles.paragraph}>
              By accessing and using the Loadout Portfolio app, you agree to comply with and be bound by these Terms of Service. If you do not agree to any part of these terms, you must not use our service.
            </Text>

            <Text style={styles.sectionTitle}>2. STEAM AUTHENTICATION</Text>
            <Text style={styles.paragraph}>
              LOADOUT uses authentication through the Steam platform. By signing in, you authorize our app to access public information from your Steam account, including your Counter-Strike 2 item inventory. We do not collect or store Steam passwords or login credentials. All credentials are exchanged directly between your device and Valve's servers.
            </Text>

            <Text style={styles.paragraph}>
              You are responsible for keeping your Steam account secure and for all activity under your account.
            </Text>

            <Text style={styles.sectionTitle}>3. USE OF SERVICE</Text>
            <Text style={styles.paragraph}>
              LOADOUT is a platform for viewing and managing your Counter-Strike 2 skin inventory. You agree to use our service only for lawful purposes and in accordance with Steam's Terms of Service.
            </Text>

            <Text style={styles.paragraph}>
              You must not use the app for any illegal or unauthorized purpose, including but not limited to violating any local, national, or international regulation.
            </Text>

            <Text style={styles.sectionTitle}>4. DATA AND PRIVACY (LOCAL-FIRST)</Text>
            <Text style={styles.paragraph}>
              LOADOUT operates on a 100% Local-First architecture. All data — including your inventory, price history, snapshots, and preferences — is stored exclusively on your device using on-device databases (SQLite and MMKV). We do not operate servers, cloud databases, or any remote data collection infrastructure.
            </Text>

            <Text style={styles.paragraph}>
              Your Steam credentials are exchanged directly between your device and Valve's servers via a secure WebView. We never intercept, transmit, or store your password. If you uninstall the app, all locally stored data is permanently and irreversibly deleted.
            </Text>

            <Text style={styles.sectionTitle}>5. SERVICE AVAILABILITY</Text>
            <Text style={styles.paragraph}>
              We strive to keep the service available 24/7 but do not guarantee that the app will always be available, uninterrupted, or error-free. We may suspend or modify the service at any time, with or without notice.
            </Text>

            <Text style={styles.sectionTitle}>6. DATA ACCURACY AND MONETARY VALUES</Text>
            <Text style={styles.paragraph}>
              Prices and values shown in the app are for informational purposes only. All monetary figures are estimates derived from publicly available Steam Community Market data. The app does NOT facilitate, broker, or enable any purchase, sale, or exchange of virtual items for real currency.
            </Text>

            <Text style={styles.paragraph}>
              You acknowledge that item prices may vary and that the values shown are estimates based on third-party data. No financial advice is provided.
            </Text>

            <Text style={styles.sectionTitle}>7. INTELLECTUAL PROPERTY</Text>
            <Text style={styles.paragraph}>
              Loadout Portfolio is an independent, third-party application. It is NOT affiliated with, endorsed by, sponsored by, or in any way officially connected to Valve Corporation. Counter-Strike, Counter-Strike 2 (CS2), Steam, and the Steam logo are registered trademarks and/or trademarks of Valve Corporation. All in-game item names and images are the property of Valve Corporation.
            </Text>

            <Text style={styles.paragraph}>
              The app's own interface, code, and original design elements are the property of the developer and are protected by applicable intellectual property laws.
            </Text>

            <Text style={styles.sectionTitle}>8. LIMITATION OF LIABILITY</Text>
            <Text style={styles.paragraph}>
              LOADOUT is provided "as is" and "as available." We make no warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </Text>

            <Text style={styles.paragraph}>
              In no event shall we be liable for any direct, indirect, incidental, special, or consequential damages arising from the use or inability to use our service.
            </Text>

            <Text style={styles.sectionTitle}>9. CHANGES TO TERMS</Text>
            <Text style={styles.paragraph}>
              We reserve the right to modify these Terms of Service at any time. Changes take effect immediately upon posting. It is your responsibility to review these terms periodically.
            </Text>

            <Text style={styles.sectionTitle}>10. CONTACT</Text>
            <Text style={styles.paragraph}>
              If you have any questions about these Terms of Service, please contact us through our official support channels.
            </Text>

            <View style={styles.spacer} />
          </ScrollView>

          {/* Footer with Back Button */}
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Dark overlay for text readability
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + spacing.md, // Safe area + header spacing
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
    color: '#d4c291', // Tactical Gold
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
    // Subtle glow effect
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
    color: '#CCCCCC', // Light gray for readability
    lineHeight: 22, // Good line height for reading
    marginBottom: spacing.md,
    textAlign: 'left',
  },
  spacer: {
    height: spacing.xxl, // Extra space at bottom before footer
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 194, 145, 0.15)', // Tactical Gold border
  },
  backButton: {
    width: '100%',
    minHeight: 48,
    backgroundColor: '#121212', // Dark solid background (tactical style)
    borderRadius: 10, // Angular, less rounded
    borderWidth: 1,
    borderColor: '#d4c291', // Tactical Gold border
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    // Subtle shadow
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

