/**
 * Loadout by Elite - React Native App (Local-First)
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@contexts/AuthContext';
import { AppNavigator } from '@navigation/AppNavigator';
import { queryClient } from '@services/queryClient';
import { initDatabase } from './src/database';

function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch(err => {
        console.error('[APP] Database init failed:', err);
        setDbError(err instanceof Error ? err.message : 'Unknown error');
      });
  }, []);

  if (dbError) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>LOADOUT</Text>
        <Text style={styles.errorText}>Database error: {dbError}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>LOADOUT</Text>
        <ActivityIndicator size="large" color="#d4c291" style={styles.spinner} />
        <Text style={styles.splashSubtitle}>LOADING ARMORY...</Text>
      </View>
    );
  }

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
    backgroundColor: 'transparent',
  },
  splash: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  splashTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: '#d4c291',
    letterSpacing: 6,
  },
  splashSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(212, 194, 145, 0.6)',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  spinner: {
    marginTop: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default App;
