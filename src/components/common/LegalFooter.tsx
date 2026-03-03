import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { typography } from '@theme';
import { PrivacyModal } from './PrivacyModal';
import { LegalNoticeModal } from './LegalNoticeModal';

export const LegalFooter: React.FC = () => {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showLegal, setShowLegal] = useState(false);

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setShowPrivacy(true)} activeOpacity={0.7}>
          <Text style={styles.link}>Privacy Policy</Text>
        </TouchableOpacity>

        <Text style={styles.dot}>•</Text>

        <TouchableOpacity onPress={() => setShowLegal(true)} activeOpacity={0.7}>
          <Text style={styles.link}>Legal Notice</Text>
        </TouchableOpacity>
      </View>

      <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <LegalNoticeModal visible={showLegal} onClose={() => setShowLegal(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  link: {
    fontSize: 10,
    fontFamily: typography.fonts.secondaryRegular,
    color: 'rgba(212, 194, 145, 0.5)',
    letterSpacing: 0.3,
  },
  dot: {
    fontSize: 8,
    color: 'rgba(212, 194, 145, 0.3)',
    marginHorizontal: 8,
  },
});
