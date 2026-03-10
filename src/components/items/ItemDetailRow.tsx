import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@components/common/PressableScale';
import FastImage from 'react-native-fast-image';
import { useLanguage } from '@contexts/LanguageContext';
import { colors, spacing, typography } from '@theme';
import { formatCurrency } from '@utils/currency';
import { getRarityColor } from '@utils/rarity';
import { ImagePlaceholderIcon } from '@components/common/ImagePlaceholderIcon';
import type { Item } from '@types/item';

// Helper para garantir valores seguros
const safeTypography = typography || {
  fonts: { primary: 'Orbitron', secondary: 'Rajdhani', primaryBold: 'Orbitron-Bold', secondaryMedium: 'Rajdhani-Medium' },
  weights: { medium: '500', bold: '700' },
  sizes: { xs: 11, sm: 13, md: 15 },
};
const safeColors = colors || { text: '#FFFFFF', textSecondary: '#B8BCC8', textMuted: '#6B7280' };
const safeSpacing = spacing || { xs: 4, sm: 8, md: 16 };

interface ItemDetailRowProps {
  item: Item;
  onPress?: () => void;
}

/**
 * Parse market_hash_name to extract weapon, skin, and condition
 */
const parseItemName = (name: string) => {
  const parts = name.split('|').map((p) => p.trim());

  if (parts.length > 1) {
    const weapon = parts[0];
    let skinParts = parts.slice(1).join(' | ');

    const conditionMatch = skinParts.match(/\(([^)]+)\)/);
    let condition = null;
    if (conditionMatch) {
      condition = conditionMatch[1];
      skinParts = skinParts.replace(/\([^)]+\)/g, '').trim();
    }

    return {
      weapon,
      skin: skinParts || null,
      condition,
    };
  }
  return {
    weapon: name,
    skin: null,
    condition: null,
  };
};

const CONDITION_TO_KEY: Record<string, 'wearFactoryNew' | 'wearMinimalWear' | 'wearFieldTested' | 'wearWellWorn' | 'wearBattleScarred'> = {
  'Factory New': 'wearFactoryNew',
  'Minimal Wear': 'wearMinimalWear',
  'Field-Tested': 'wearFieldTested',
  'Well-Worn': 'wearWellWorn',
  'Battle-Scarred': 'wearBattleScarred',
};

export const ItemDetailRow: React.FC<ItemDetailRowProps> = ({ item, onPress }) => {
  const { t } = useLanguage();
  const rarityColor = getRarityColor(item.rarity_tag || item.rarity || item.market_hash_name);
  const totalValue = (item.price || item.current_price || 0) * (item.quantity || 1);
  const unitPrice = item.price || item.current_price || 0;
  const isStorageUnit = item.is_storage_unit === true;
  const { weapon, skin, condition } = parseItemName(item.market_hash_name || '');
  const displayTitle = isStorageUnit
    ? (item.custom_display_name ?? item.market_hash_name ?? 'Storage Unit')
    : weapon;

  return (
    <PressableScale
      style={styles.container}
      onPress={onPress}
    >
      {/* Borda vertical de raridade */}
      <View style={[styles.rarityBorder, { backgroundColor: rarityColor }]} />

      {/* Thumbnail */}
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <FastImage
            source={{ uri: item.image_url, priority: FastImage.priority.normal }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.contain}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <ImagePlaceholderIcon size={32} color={safeColors.textSecondary} />
          </View>
        )}
      </View>

      {/* Coluna Central: Informações do Item */}
      <View style={styles.infoContainer}>
        {/* Linha 1: Nome da arma + Nome da skin + StatTrak */}
        <View style={styles.nameRow}>
          <View style={styles.weaponSkinRow}>
            <Text style={styles.weaponName} numberOfLines={1}>
              {displayTitle}
            </Text>
            {!isStorageUnit && skin && (
              <>
                <Text style={styles.skinSeparator}> • </Text>
                <Text style={styles.skinName} numberOfLines={1}>
                  {skin}
                </Text>
              </>
            )}
          </View>
          {!isStorageUnit && item.is_stattrak && (
            <View style={styles.stattrakBadge}>
              <Text style={styles.stattrakText}>ST</Text>
            </View>
          )}
        </View>

        {/* Linha 2: Wear + Quantidade (ou ENCRYPTED VAULT para Storage Unit) */}
        <View style={styles.metadataRow}>
          {isStorageUnit ? (
            <Text style={styles.encryptedVaultSubtitle}>{t('storageUnitEncryptedVault')}</Text>
          ) : (
            <>
              {condition && (
                <Text style={styles.condition}>{CONDITION_TO_KEY[condition] ? t(CONDITION_TO_KEY[condition]) : condition}</Text>
              )}
              {item.quantity > 1 && (
                <>
                  {condition && <Text style={styles.metadataSeparator}> • </Text>}
                  <Text style={styles.quantity}>{t('quantityShort')}: {item.quantity}</Text>
                </>
              )}
            </>
          )}
        </View>
      </View>

      {/* Coluna Direita: Valores e Float (ou [ XX ITEMS ] para Storage Unit) */}
      <View style={styles.valueContainer}>
        {isStorageUnit ? (
          <Text style={styles.storageUnitCountText}>
            [ {item.storage_unit_item_count ?? '?'} {t('storageUnitItems')} ]
          </Text>
        ) : (
          <>
            {/* Preço Total */}
            <Text style={styles.totalPrice}>{formatCurrency(totalValue)}</Text>
            {/* Preço Unitário (se quantidade > 1) */}
            {item.quantity > 1 && (
              <Text style={styles.unitPrice}>{formatCurrency(unitPrice)} {t('perUnit')}</Text>
            )}
            {/* Float abaixo do preço */}
            {item.float_value != null && (
              <Text style={styles.floatValue}>{t('floatShort')}: {item.float_value.toFixed(4)}</Text>
            )}
          </>
        )}
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a', // Cinza escuro neutro
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.3)', // Borda dourada tactical gold
    borderRadius: 12,
    paddingVertical: safeSpacing.sm,
    paddingHorizontal: safeSpacing.md,
    marginBottom: safeSpacing.xs,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 64, // Altura mínima reduzida para card mais compacto
  },
  rarityBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  imageContainer: {
    width: 56,
    height: 56,
    marginRight: safeSpacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0, // Não encolhe
  },
  image: {
    width: 56,
    height: 56,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
  },
  infoContainer: {
    flex: 1,
    marginRight: safeSpacing.sm,
    justifyContent: 'center', // Centralizar verticalmente
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: safeSpacing.xs,
    marginBottom: 2,
    justifyContent: 'space-between',
  },
  weaponSkinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
  },
  weaponName: {
    fontSize: safeTypography.sizes.sm,
    fontFamily: safeTypography.fonts.primaryBold,
    color: safeColors.text,
    fontWeight: safeTypography.weights.bold,
  },
  skinSeparator: {
    fontSize: safeTypography.sizes.sm,
    color: safeColors.textSecondary,
    marginHorizontal: 4,
  },
  stattrakBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: safeSpacing.xs / 2,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  stattrakText: {
    fontSize: safeTypography.sizes.xs - 1,
    color: safeColors.text,
    fontFamily: safeTypography.fonts.secondary,
    fontWeight: safeTypography.weights.bold,
  },
  skinName: {
    fontSize: safeTypography.sizes.sm,
    fontFamily: safeTypography.fonts.secondary,
    color: safeColors.textSecondary,
    flexShrink: 1,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  condition: {
    fontSize: safeTypography.sizes.xs,
    fontFamily: safeTypography.fonts.secondary,
    color: safeColors.textMuted,
  },
  metadataSeparator: {
    fontSize: safeTypography.sizes.xs,
    color: safeColors.textMuted,
    marginHorizontal: 2,
  },
  quantity: {
    fontSize: safeTypography.sizes.xs,
    fontFamily: safeTypography.fonts.secondary,
    color: safeColors.textMuted,
  },
  valueContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 90,
    flexShrink: 0,
  },
  totalPrice: {
    fontSize: safeTypography.sizes.md,
    fontFamily: safeTypography.fonts.primaryBold,
    color: '#d4c291',
    fontWeight: safeTypography.weights.bold,
    marginBottom: 2,
  },
  unitPrice: {
    fontSize: safeTypography.sizes.xs,
    fontFamily: safeTypography.fonts.secondary,
    color: safeColors.textMuted,
    marginBottom: 2,
  },
  floatValue: {
    fontSize: safeTypography.sizes.xs,
    fontFamily: safeTypography.fonts.secondary,
    color: safeColors.textMuted,
  },
  storageUnitCountText: {
    fontSize: safeTypography.sizes.md,
    fontFamily: safeTypography.fonts.monoRegular ?? safeTypography.fonts.mono ?? 'JetBrainsMono-Regular',
    color: '#d4c291',
    fontWeight: '600',
    textAlign: 'right',
  },
  encryptedVaultSubtitle: {
    fontSize: safeTypography.sizes.xs,
    fontFamily: safeTypography.fonts.secondary,
    color: 'rgba(180, 180, 180, 0.85)',
    letterSpacing: 1.5,
  },
});

