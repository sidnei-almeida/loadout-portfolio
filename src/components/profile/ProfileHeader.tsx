import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import FastImage from 'react-native-fast-image';
import { Card } from '@components/common/Card';
import { CopyIcon, ProfileIcon, ClockIcon } from '@components/common/Icons';
import { useCustomAlert } from '@components/common/CustomAlertDialog';
import { useLanguage } from '@contexts/LanguageContext';
import { spacing, typography } from '@theme';
import type { UserProfileCard } from '@types/user';

/** Converte código país (BR, US) em emoji de bandeira */
function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const u = (c: string) => 0x1f1e6 - 65 + c.toUpperCase().charCodeAt(0);
  return String.fromCodePoint(u(code[0]), u(code[1]));
}

/** Nomes de países comuns para exibição */
const COUNTRY_NAMES: Record<string, string> = {
  BR: 'Brasil', US: 'EUA', GB: 'Reino Unido', DE: 'Alemanha', FR: 'França',
  RU: 'Rússia', CN: 'China', JP: 'Japão', KR: 'Coreia do Sul', PT: 'Portugal',
  ES: 'Espanha', IT: 'Itália', PL: 'Polônia', AR: 'Argentina', MX: 'México',
  CA: 'Canadá', AU: 'Austrália', IN: 'Índia', NL: 'Holanda', SE: 'Suécia',
};

interface ProfileHeaderProps {
  profileCard: UserProfileCard;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profileCard }) => {
  const { showAlert, AlertDialog } = useCustomAlert();
  const { t } = useLanguage();
  const avatarUri = profileCard.avatar_full ?? profileCard.avatar_url;
  const hasStats =
    profileCard.steam_level != null ||
    profileCard.country_code ||
    (profileCard.account_age_years != null && profileCard.account_age_years >= 0);

  const handleOpenSteamProfile = () => {
    if (profileCard.profile_url) Linking.openURL(profileCard.profile_url);
  };

  const handleCopySteamId = () => {
    Clipboard.setString(profileCard.steam_id);
    showAlert(t('copied'), t('copiedMessage'), 'success');
  };

  const countryLabel = profileCard.country_code
    ? COUNTRY_NAMES[profileCard.country_code] || profileCard.country_code
    : '';

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <FastImage
              source={{ uri: avatarUri, priority: FastImage.priority.high }}
              style={styles.avatar}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <ProfileIcon size={40} color="rgba(212, 194, 145, 0.6)" strokeWidth={2} />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>{profileCard.persona_name}</Text>

          <View style={styles.steamIdContainer}>
            <Text style={styles.steamIdLabel}>{t('steamId')}</Text>
            <Text style={styles.steamIdValue} numberOfLines={1} ellipsizeMode="middle">
              {profileCard.steam_id}
            </Text>
            <TouchableOpacity onPress={handleCopySteamId} style={styles.copyButton} activeOpacity={0.7}>
              <CopyIcon size={16} color="#d4c291" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {hasStats && (
            <View style={styles.statsRow}>
              {profileCard.steam_level != null && (
                <View style={styles.statPill}>
                  <View style={styles.statBadge} />
                  <Text style={styles.statText}>Lv. {profileCard.steam_level}</Text>
                </View>
              )}
              {profileCard.country_code && (
                <View style={styles.statPill}>
                  <Text style={styles.statFlag}>{countryCodeToFlag(profileCard.country_code)}</Text>
                  <Text style={styles.statText}>{countryLabel}</Text>
                </View>
              )}
              {profileCard.account_age_years != null && profileCard.account_age_years >= 0 && (
                <View style={styles.statPill}>
                  <ClockIcon size={12} color="rgba(212, 194, 145, 0.8)" strokeWidth={2} />
                  <Text style={styles.statText}>
                    {profileCard.account_age_years} {profileCard.account_age_years === 1 ? t('year') : t('years')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {profileCard.profile_url && (
            <TouchableOpacity onPress={handleOpenSteamProfile} style={styles.linkButton} activeOpacity={0.7}>
              <Text style={styles.linkText}>{t('viewProfileOnSteam')}</Text>
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
  avatarContainer: {
    width: 80,
    height: 80,
    marginRight: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(212, 194, 145, 0.3)',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(212, 194, 145, 0.3)',
    backgroundColor: 'rgba(28, 27, 25, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: typography.sizes.xs,
    color: '#6B7280',
    marginRight: spacing.xs,
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
    flexShrink: 0,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    marginHorizontal: -2,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    marginHorizontal: 2,
    marginBottom: 4,
    backgroundColor: 'rgba(212, 194, 145, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.15)',
  },
  statBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d4c291',
    marginRight: spacing.xs,
  },
  statFlag: {
    marginRight: spacing.xs,
    fontSize: 14,
  },
  statText: {
    fontSize: typography.sizes.xs,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.semiBold,
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

