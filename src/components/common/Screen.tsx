import React from 'react';
import { View, StyleSheet, ViewStyle, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumBackground } from './PremiumBackground';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  showPremiumBackground?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = false,
  style,
  showPremiumBackground = true,
}) => {
  const content = showPremiumBackground ? (
    <PremiumBackground>{children}</PremiumBackground>
  ) : (
    children
  );

  if (scrollable) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        {showPremiumBackground ? (
          <PremiumBackground>
          <ScrollView
            style={[styles.container, { backgroundColor: 'transparent' }]}
            contentContainerStyle={[
              styles.scrollContent,
              style,
              { backgroundColor: 'transparent' },
            ]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {children}
          </ScrollView>
          </PremiumBackground>
        ) : (
          <ScrollView
            style={[styles.container, { backgroundColor: 'transparent' }]}
            contentContainerStyle={[
              styles.scrollContent,
              style,
            ]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {children}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      {showPremiumBackground ? (
        <PremiumBackground>
          <View style={[styles.container, style]}>{children}</View>
        </PremiumBackground>
      ) : (
        <View style={[styles.container, style, { backgroundColor: 'transparent' }]}>{children}</View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent', // Transparente para o vídeo aparecer
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Transparente para o vídeo aparecer
  },
  scrollContent: {
    flexGrow: 1,
  },
});

