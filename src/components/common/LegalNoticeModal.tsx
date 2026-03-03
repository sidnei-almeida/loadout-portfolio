import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { typography } from '@theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LegalNoticeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({
  visible,
  onClose,
}) => (
  <Modal
    visible={visible}
    animationType="fade"
    transparent
    onRequestClose={onClose}
  >
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>LEGAL NOTICE</Text>

        <View style={styles.divider} />

        <Text style={styles.body}>
          Loadout Portfolio is not affiliated with, endorsed by, or connected to
          Valve Corporation. Counter-Strike, CS2, and the Steam logo are
          registered trademarks of Valve Corporation.
        </Text>

        <Text style={styles.body}>
          All in-game item names, images, and assets are the property of Valve
          Corporation. Monetary values shown are community market estimates for
          informational purposes only.
        </Text>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={styles.closeText}>UNDERSTOOD</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.15)',
    paddingVertical: 28,
    paddingHorizontal: 24,
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  title: {
    fontSize: 16,
    fontFamily: typography.fonts.secondaryBold,
    fontWeight: '700',
    color: '#D4C291',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 194, 145, 0.12)',
    marginVertical: 18,
  },
  body: {
    fontSize: 13,
    fontFamily: typography.fonts.secondaryRegular,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  closeButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.3)',
  },
  closeText: {
    fontSize: 12,
    fontFamily: typography.fonts.secondarySemiBold,
    fontWeight: '600',
    color: '#D4C291',
    letterSpacing: 2,
  },
});
