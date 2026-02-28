import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CookieManager from '@react-native-cookies/cookies';
import { Card } from '@components/common/Card';
import { Loading } from '@components/common/Loading';
import { colors, spacing, typography } from '@theme';
import { useAuth } from '@hooks/useAuth';

interface CookieStatusProps {
  onCapturePress: () => void;
  refreshTrigger?: number;
}

export const CookieStatus: React.FC<CookieStatusProps> = ({ onCapturePress, refreshTrigger }) => {
  const { isAuthenticated } = useAuth();
  const [hasCookies, setHasCookies] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    if (!isAuthenticated) { return; }

    setIsLoading(true);
    try {
      const cookies = await CookieManager.get('https://steamcommunity.com', true);
      const hasSession =
        !!((cookies as any)?.steamLoginSecure?.value ?? (cookies as any)?.steamLoginSecure);
      setHasCookies(hasSession);
    } catch {
      setHasCookies(false);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) { loadStatus(); }
  }, [isAuthenticated, loadStatus, refreshTrigger]);

  if (isLoading) {
    return (
      <Card>
        <Loading message="Checking Steam session..." />
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Steam Session</Text>
        {hasCookies && (
          <Text style={styles.statusBadge}>Active</Text>
        )}
      </View>

      <Text style={styles.explanation}>
        You may need to update your session from time to time if you see inventory
        or price update errors.
      </Text>

      <TouchableOpacity style={styles.button} onPress={onCapturePress} activeOpacity={0.8}>
        <Text style={styles.buttonText}>
          {hasCookies ? 'Refresh Session' : 'Update Session'}
        </Text>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    fontFamily: typography.fonts.primaryBold,
    letterSpacing: 0.5,
  },
  statusBadge: {
    fontSize: typography.sizes.xs,
    color: '#4ADE80',
    fontFamily: typography.fonts.secondaryBold,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  explanation: {
    fontSize: typography.sizes.sm,
    color: '#9CA3AF',
    marginBottom: spacing.md,
    lineHeight: 20,
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
  },
  button: {
    backgroundColor: '#d4c291',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4c291',
  },
  buttonText: {
    fontSize: typography.sizes.sm,
    color: '#000000',
    fontWeight: typography.weights.bold,
    fontFamily: typography.fonts.secondaryBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
