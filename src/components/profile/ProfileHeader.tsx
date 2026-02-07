import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import FastImage from 'react-native-fast-image';
import { Card } from '@components/common/Card';
import { CopyIcon } from '@components/common/Icons';
import { useCustomAlert } from '@components/common/CustomAlertDialog';
import { colors, spacing, typography } from '@theme';
import type { UserProfileCard } from '@types/user';

interface ProfileHeaderProps {
  profileCard: UserProfileCard;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profileCard }) => {
  const { showAlert, AlertDialog } = useCustomAlert();

  const handleOpenSteamProfile = () => {
    if (profileCard.profile_url) {
      Linking.openURL(profileCard.profile_url);
    }
  };

  const handleCopySteamId = () => {
    Clipboard.setString(profileCard.steam_id);
    showAlert('Copiado!', 'Steam ID copiado para a área de transferência.', 'success');
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        {profileCard.avatar_full && (
          <FastImage
            source={{ uri: profileCard.avatar_full, priority: FastImage.priority.high }}
            style={styles.avatar}
            resizeMode={FastImage.resizeMode.cover}
          />
        )}
        
        <View style={styles.info}>
          <Text style={styles.name}>{profileCard.persona_name}</Text>
          
          <View style={styles.steamIdContainer}>
            <Text style={styles.steamIdLabel}>Steam ID:</Text>
            <Text style={styles.steamIdValue} numberOfLines={1} ellipsizeMode="middle">
              {profileCard.steam_id}
            </Text>
            <TouchableOpacity onPress={handleCopySteamId} style={styles.copyButton} activeOpacity={0.7}>
              <CopyIcon size={16} color="#d4c291" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          
          {profileCard.steam_level && (
            <Text style={styles.level}>Level {profileCard.steam_level}</Text>
          )}
          
          {profileCard.account_age_years !== undefined && (
            <Text style={styles.age}>
              Conta criada há {profileCard.account_age_years} {profileCard.account_age_years === 1 ? 'ano' : 'anos'}
            </Text>
          )}
          
          {profileCard.profile_url && (
            <TouchableOpacity onPress={handleOpenSteamProfile} style={styles.linkButton} activeOpacity={0.7}>
              <Text style={styles.linkText}>View profile on Steam →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <AlertDialog />
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
    alignItems: 'flex-start',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(212, 194, 145, 0.3)',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    fontFamily: typography.fonts.primaryBold,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
  },
  steamIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    flexWrap: 'nowrap',
  },
  steamIdLabel: {
    fontSize: typography.sizes.sm,
    color: '#9CA3AF',
    marginRight: spacing.xs,
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
    flexShrink: 0,
  },
  steamIdValue: {
    fontSize: typography.sizes.sm,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    fontWeight: typography.weights.medium,
    flex: 1,
    minWidth: 0,
    marginRight: spacing.xs,
  },
  copyButton: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  level: {
    fontSize: typography.sizes.sm,
    color: '#9CA3AF',
    marginBottom: spacing.xs,
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
  },
  age: {
    fontSize: typography.sizes.sm,
    color: '#9CA3AF',
    marginBottom: spacing.sm,
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
  },
  linkButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  linkText: {
    fontSize: typography.sizes.sm,
    color: '#d4c291',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.semiBold,
    letterSpacing: 0.3,
  },
});

