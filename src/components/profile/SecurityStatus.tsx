import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@components/common/Card';
import { CheckCircleIcon, AlertCircleIcon } from '@components/common/Icons';
import { colors, spacing, typography } from '@theme';
import type { TrustStatus } from '@types/user';

interface SecurityStatusProps {
  trustStatus: TrustStatus;
}

export const SecurityStatus: React.FC<SecurityStatusProps> = ({ trustStatus }) => {
  const isClean = !trustStatus.vac_banned && 
                 !trustStatus.community_banned && 
                 trustStatus.game_ban_count === 0 &&
                 (trustStatus.economy_ban === 'none' || !trustStatus.economy_ban);

  const getStatusInfo = () => {
    if (isClean) {
      return {
        text: 'Secure',
        bgColor: 'rgba(34, 197, 94, 0.15)',
        borderColor: '#22C55E',
        textColor: '#22C55E',
        icon: CheckCircleIcon,
        summary: 'No security issues detected.',
      };
    }
    
    return {
      text: 'Active Alerts',
      bgColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: '#F59E0B',
      textColor: '#F59E0B',
      icon: AlertCircleIcon,
      summary: 'Security issues detected on this account.',
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const getStatusSummary = () => {
    if (isClean) {
      return 'No security issues detected.';
    }
    
    const issues = [];
    if (trustStatus.vac_banned) issues.push('VAC ban');
    if (trustStatus.community_banned) issues.push('Community ban');
    if (trustStatus.game_ban_count > 0) issues.push(`${trustStatus.game_ban_count} game ban(s)`);
    if (trustStatus.economy_ban && trustStatus.economy_ban !== 'none') {
      issues.push(`Economy ban: ${trustStatus.economy_ban}`);
    }
    
    return `Issues detected: ${issues.join(', ')}`;
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Account Status</Text>
        </View>
        <View style={[
          styles.pill,
          {
            backgroundColor: statusInfo.bgColor,
            borderColor: statusInfo.borderColor,
          }
        ]}>
          <StatusIcon size={14} color={statusInfo.textColor} strokeWidth={2.5} />
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
              <Text style={styles.listItemText}>
                VAC ban active
              </Text>
            </View>
          )}
          
          {trustStatus.community_banned && (
            <View style={styles.listItem}>
              <AlertCircleIcon size={16} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.listItemText}>
                Community ban detected
              </Text>
            </View>
          )}
          
          {trustStatus.game_ban_count > 0 && (
            <View style={styles.listItem}>
              <AlertCircleIcon size={16} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.listItemText}>
                {trustStatus.game_ban_count} game ban(s) on record
              </Text>
            </View>
          )}
          
          {trustStatus.economy_ban && trustStatus.economy_ban !== 'none' && (
            <View style={styles.listItem}>
              <AlertCircleIcon size={16} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.listItemText}>
                Economy ban: {trustStatus.economy_ban}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.xs,
  },
  pillText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    fontFamily: typography.fonts.secondaryBold,
    letterSpacing: 0.3,
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

