import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@components/common/Card';
import { AlertCircleIcon } from '@components/common/Icons';
import { useLanguage } from '@contexts/LanguageContext';
import { spacing, typography } from '@theme';
import type { TrustStatus } from '@types/user';

interface SecurityStatusProps {
  trustStatus: TrustStatus;
}

export const SecurityStatus: React.FC<SecurityStatusProps> = ({ trustStatus }) => {
  const { t } = useLanguage();
  const isClean = !trustStatus.vac_banned &&
                 !trustStatus.community_banned &&
                 trustStatus.game_ban_count === 0 &&
                 (trustStatus.economy_ban === 'none' || !trustStatus.economy_ban);

  const getStatusInfo = () => {
    if (isClean) {
      return {
        text: t('secure'),
        bgColor: 'rgba(34, 197, 94, 0.06)',
        textColor: '#4ADE80',
        summary: t('noSecurityIssues'),
      };
    }

    return {
      text: t('activeAlerts'),
      bgColor: 'rgba(245, 158, 11, 0.06)',
      textColor: '#FBBF24',
      summary: t('securityIssuesDetected'),
    };
  };

  const statusInfo = getStatusInfo();

  const getStatusSummary = () => {
    if (isClean) return t('noSecurityIssues');

    const issues: string[] = [];
    if (trustStatus.vac_banned) issues.push(t('vacBanActive'));
    if (trustStatus.community_banned) issues.push(t('communityBanDetected'));
    if (trustStatus.game_ban_count > 0) {
      issues.push(t('gameBans', { count: trustStatus.game_ban_count }));
    }
    if (trustStatus.economy_ban && trustStatus.economy_ban !== 'none') {
      issues.push(`${t('economyBan')} ${trustStatus.economy_ban}`);
    }

    return `${t('issuesDetected')} ${issues.join(', ')}`;
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('accountStatus')}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: statusInfo.bgColor }]}>
          <Text style={[styles.pillText, { color: statusInfo.textColor }]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>
      
      <Text style={styles.summary}>{getStatusSummary()}</Text>
      
      {!isClean && (
        <View style={styles.list}>
          {trustStatus.vac_banned && (
            <View style={styles.listItem}>
              <AlertCircleIcon size={16} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.listItemText}>{t('vacBanActive')}</Text>
            </View>
          )}
          
          {trustStatus.community_banned && (
            <View style={styles.listItem}>
              <AlertCircleIcon size={16} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.listItemText}>{t('communityBanDetected')}</Text>
            </View>
          )}
          
          {trustStatus.game_ban_count > 0 && (
            <View style={styles.listItem}>
              <AlertCircleIcon size={16} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.listItemText}>
                {t('gameBans', { count: trustStatus.game_ban_count })}
              </Text>
            </View>
          )}
          
          {trustStatus.economy_ban && trustStatus.economy_ban !== 'none' && (
            <View style={styles.listItem}>
              <AlertCircleIcon size={16} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.listItemText}>
                {t('economyBan')} {trustStatus.economy_ban}
              </Text>
            </View>
          )}
        </View>
      )}
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
  titleContainer: {
    flex: 1,
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
  },
  pillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    fontFamily: typography.fonts.secondaryBold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summary: {
    fontSize: typography.sizes.sm,
    color: '#9CA3AF',
    marginBottom: spacing.md,
    lineHeight: 20,
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  listItemText: {
    fontSize: typography.sizes.sm,
    color: '#FFFFFF',
    lineHeight: 20,
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
});

