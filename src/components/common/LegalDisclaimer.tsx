import React from 'react';
import { Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { useLanguage } from '@contexts/LanguageContext';
import { typography } from '@theme';

const PRIVACY_URL = 'https://sidneioliveira.dev/loadout-portfolio/privacy';

interface LegalDisclaimerProps {
  showPrivacyLink?: boolean;
}

export const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({
  showPrivacyLink = false,
}) => {
  const { t } = useLanguage();
  return (
    <>
      <Text style={styles.text}>{t('legalDisclaimerText')}</Text>
      {showPrivacyLink && (
        <TouchableOpacity
          onPress={() => Linking.openURL(PRIVACY_URL)}
          activeOpacity={0.7}
        >
          <Text style={styles.link}>{t('privacyPolicy')}</Text>
        </TouchableOpacity>
      )}
    </>
  );
};

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
