/**
 * Loadout by Elite - React Native App
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@contexts/AuthContext';
import { AppNavigator } from '@navigation/AppNavigator';
import { queryClient } from '@services/queryClient';
import { colors } from '@theme';

function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar 
              barStyle="light-content" 
              backgroundColor="transparent" 
              translucent={true}
            />
            <AppNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Transparente para o vídeo aparecer
  },
});

export default App;
