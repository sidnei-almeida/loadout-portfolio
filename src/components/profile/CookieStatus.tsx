import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '@components/common/Card';
import { Loading } from '@components/common/Loading';
import { colors, spacing, typography } from '@theme';
import { checkCookiesStatus } from '@services/cookies';
import { useAuth } from '@hooks/useAuth';

interface CookieStatusProps {
  onCapturePress: () => void;
  refreshTrigger?: number;
}

export const CookieStatus: React.FC<CookieStatusProps> = ({ onCapturePress, refreshTrigger }) => {
  const { token } = useAuth();
  const [hasCookies, setHasCookies] = useState<boolean | null>(null);
  const [cookiesUpdatedAt, setCookiesUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const formatTimeAgo = (dateString: string | null): string => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays === 0) {
      if (diffHours === 0) {
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} min ago`;
      } else {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
      }
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const loadStatus = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const status = await checkCookiesStatus(token);
      setHasCookies(status.has_cookies);
      setCookiesUpdatedAt(status.cookies_updated_at || null);
    } catch (error) {
      console.error('[COOKIES] Erro ao verificar status:', error);
      setHasCookies(false);
      setCookiesUpdatedAt(null);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadStatus();
    }
  }, [token, loadStatus, refreshTrigger]);

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
        {hasCookies && cookiesUpdatedAt && (
          <Text style={styles.lastLoginText}>
            Last login: {formatTimeAgo(cookiesUpdatedAt)}
          </Text>
        )}
      </View>

      <Text style={styles.explanation}>
        You may need to update your session from time to time if you see inventory or price update errors. Cookies are required so the API can fetch your inventory and skin prices.
      </Text>

      <TouchableOpacity style={styles.button} onPress={onCapturePress} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Update Session</Text>
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
  lastLoginText: {
    fontSize: typography.sizes.xs,
    color: '#9CA3AF',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
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

