import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '@components/common/PressableScale';
import FastImage from 'react-native-fast-image';
import { colors, spacing, typography } from '@theme';
import { formatCurrency } from '@utils/currency';
import { ImagePlaceholderIcon } from '@components/common/ImagePlaceholderIcon';
import { useLanguage } from '@contexts/LanguageContext';
import type { Item } from '@types/item';

// Helper para garantir valores seguros
const safeColors = colors || { textSecondary: '#B8BCC8', textMuted: '#6B7280' };
const safeSpacing = spacing || { xs: 4, sm: 8, md: 16 };

interface ItemIconViewProps {
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

    // Abreviar condições comuns para 2 letras
    const conditionAbbr: { [key: string]: string } = {
      'Minimal Wear': 'MW',
      'Field-Tested': 'FT',
      'Well-Worn': 'WW',
      'Factory New': 'FN',
      'Battle-Scarred': 'BS',
    };
    
    const abbreviatedCondition = condition ? conditionAbbr[condition] || condition.substring(0, 2).toUpperCase() : null;

    return {
      weapon,
      skin: skinParts || null,
      condition: abbreviatedCondition,
    };
  }
  return {
    weapon: name,
    skin: null,
    condition: null,
  };
};

export const ItemIconView: React.FC<ItemIconViewProps> = ({ item, onPress }) => {
  const { t } = useLanguage();
  const totalValue = (item.price || item.current_price || 0) * (item.quantity || 1);
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
      {/* Imagem com nome da arma no topo */}
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <FastImage
            source={{ uri: item.image_url, priority: FastImage.priority.normal }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.contain}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <ImagePlaceholderIcon size={24} color={safeColors.textSecondary} />
          </View>
        )}
        
        {/* Nome da arma e wear (ou ENCRYPTED VAULT para Storage Unit) */}
        <View style={styles.nameOverlay}>
          <Text style={styles.weaponName} numberOfLines={1}>
            {displayTitle}
          </Text>
          {isStorageUnit ? (
            <Text style={styles.encryptedVaultSubtitle}>{t('storageUnitEncryptedVault')}</Text>
          ) : (
            condition && <Text style={styles.condition}>{condition}</Text>
          )}
        </View>
      </View>

      {/* Nome da skin e preço (ou [ XX ITEMS ] para Storage Unit) */}
      <View style={styles.bottomRow}>
        {!isStorageUnit && skin && (
          <Text style={styles.skinName} numberOfLines={1}>
            {skin}
          </Text>
        )}
        {isStorageUnit ? (
          <Text style={styles.storageUnitCountText} numberOfLines={1}>
            [ {item.storage_unit_item_count ?? '?'} {t('storageUnitItems')} ]
          </Text>
        ) : (
          <Text style={styles.price} numberOfLines={1}>
            {formatCurrency(totalValue)}
          </Text>
        )}
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: safeSpacing.sm,
    flex: 1,
    marginHorizontal: safeSpacing.xs / 2,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#1a1a1a', // Cinza escuro neutro
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.3)', // Borda dourada tactical gold
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: safeSpacing.xs / 2,
    position: 'relative',
  },
  nameOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: safeSpacing.xs / 2,
    paddingVertical: 2,
    paddingHorizontal: safeSpacing.xs / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.75)', // Fundo semi-transparente para legibilidade
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  weaponName: {
    fontSize: 9,
    fontFamily: typography?.fonts?.primaryBold || 'Orbitron-Bold',
    color: '#FFFFFF',
    fontWeight: '700',
    flexShrink: 1,
  },
  condition: {
    fontSize: 8,
    fontFamily: typography?.fonts?.secondary || 'Rajdhani',
    color: safeColors.textMuted,
    fontWeight: '500',
    flexShrink: 0,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: safeSpacing.xs / 2,
  },
  skinName: {
    fontSize: 8,
    fontFamily: typography?.fonts?.secondary || 'Rajdhani',
    color: safeColors.textSecondary,
    flex: 1,
  },
  price: {
    fontSize: 10,
    fontFamily: typography?.fonts?.secondary || 'Rajdhani',
    color: '#d4c291',
    fontWeight: '600',
    flexShrink: 0,
  },
  storageUnitCountText: {
    fontSize: 10,
    fontFamily: typography?.fonts?.monoRegular ?? typography?.fonts?.mono ?? 'JetBrainsMono-Regular',
    color: '#d4c291',
    fontWeight: '600',
    flexShrink: 0,
  },
  encryptedVaultSubtitle: {
    fontSize: 8,
    fontFamily: typography?.fonts?.secondary || 'Rajdhani',
    color: 'rgba(180, 180, 180, 0.85)',
    letterSpacing: 1.5,
    flexShrink: 0,
  },
});

