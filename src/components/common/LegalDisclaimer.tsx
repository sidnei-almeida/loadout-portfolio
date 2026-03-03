import React from 'react';
import { Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { typography } from '@theme';

const PRIVACY_URL = 'https://sidneioliveira.dev/loadout-portfolio/privacy';

interface LegalDisclaimerProps {
  showPrivacyLink?: boolean;
}

export const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({
  showPrivacyLink = false,
}) => (
  <>
    <Text style={styles.text}>
      Loadout Portfolio is not affiliated with, endorsed by, or connected to
      Valve Corporation. Counter-Strike, CS2, and the Steam logo are registered
      trademarks of Valve Corporation.
    </Text>
    {showPrivacyLink && (
      <TouchableOpacity
        onPress={() => Linking.openURL(PRIVACY_URL)}
        activeOpacity={0.7}
      >
        <Text style={styles.link}>Privacy Policy</Text>
      </TouchableOpacity>
    )}
  </>
);

const styles = StyleSheet.create({
  text: {
    fontSize: 9,
    fontFamily: typography.fonts.secondaryRegular,
    color: 'rgba(255, 255, 255, 0.35)',
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 24,
  },
  link: {
    fontSize: 9,
    fontFamily: typography.fonts.secondaryRegular,
    color: 'rgba(212, 194, 145, 0.5)',
    textAlign: 'center',
    marginTop: 6,
    textDecorationLine: 'underline',
  },
});
