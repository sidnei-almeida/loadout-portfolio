import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = false,
  style,
}) => {
  if (scrollable) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <ScrollView
          style={[styles.container, { backgroundColor: 'transparent' }]}
          contentContainerStyle={[styles.scrollContent, style]}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View style={[styles.container, style, { backgroundColor: 'transparent' }]}>{children}</View>
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

