import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import CookieManager from '@react-native-cookies/cookies';
import { Card } from '@components/common/Card';
import { Loading } from '@components/common/Loading';
import { useLanguage } from '@contexts/LanguageContext';
import { spacing, typography } from '@theme';
import { useAuth } from '@hooks/useAuth';

interface CookieStatusProps {
  onCapturePress: () => void;
  refreshTrigger?: number;
}

export const CookieStatus: React.FC<CookieStatusProps> = ({ onCapturePress, refreshTrigger }) => {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
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
        <Loading message={t('checkingSession')} />
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('steamSession')}</Text>
        {hasCookies && (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{t('active')}</Text>
          </View>
        )}
      </View>

      <Text style={styles.explanation}>{t('sessionExplanation')}</Text>

      <TouchableOpacity style={styles.button} onPress={onCapturePress} activeOpacity={0.7}>
        <Text style={styles.buttonText}>
          {hasCookies ? t('refreshSession') : t('updateSession')}
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
  pill: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
  },
  pillText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.secondaryBold,
    fontWeight: typography.weights.semiBold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#4ADE80',
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
    backgroundColor: 'rgba(212, 194, 145, 0.05)',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#d4c291',
  },
  buttonText: {
    fontSize: typography.sizes.sm,
    color: '#d4c291',
    fontWeight: typography.weights.semiBold,
    fontFamily: typography.fonts.secondaryBold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
