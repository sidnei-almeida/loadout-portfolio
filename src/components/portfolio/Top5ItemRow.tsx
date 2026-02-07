import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import { colors, spacing, typography } from '@theme';
import { formatCurrency } from '@utils/currency';
import { ImagePlaceholderIcon } from '@components/common/ImagePlaceholderIcon';
import { getRarityColor } from '@utils/rarity';
import type { Item } from '@types/item';

// Helper para garantir valores seguros
const safeTypography = typography || {
  fonts: { primaryMedium: 'Orbitron-Medium', primaryRegular: 'Orbitron-Regular', primaryBold: 'Orbitron-Bold', secondary: 'Rajdhani' },
  weights: { bold: '700', semibold: '600' },
  sizes: { sm: 13, xs: 11 },
};
const safeColors = colors || { text: '#FFFFFF', textMuted: '#6B7280', textSecondary: '#B8BCC8' };
const safeSpacing = spacing || { sm: 8, md: 16 };

interface Top5ItemRowProps {
  item: Item;
  onPress?: () => void;
}

export const Top5ItemRow: React.FC<Top5ItemRowProps> = ({ item, onPress }) => {
  const totalValue = (item.price || item.current_price || 0) * (item.quantity || 1);

  // Obter cor da raridade para a borda vertical
  const rarityColor = getRarityColor(item.rarity_tag || item.rarity || item.market_hash_name);

  // Parse market_hash_name to separate weapon name and skin
  const parseItemName = (name: string) => {
    const parts = name.split('|').map(p => p.trim());
    if (parts.length > 1) {
      // Abbreviate common conditions to save space
      let skinName = parts.slice(1).join(' | ');
      
      // Função auxiliar: substituir evitando parênteses duplos
      const abbreviateCondition = (text: string, fullName: string, abbreviation: string) => {
        // Se já tem a abreviação, pular
        if (text.includes(`(${abbreviation})`)) {
          return text;
        }
        
        // Verificar se o texto está entre parênteses: ex: "(Minimal Wear)"
        const parenthesesMatch = text.match(new RegExp(`\\(([^)]*${fullName}[^)]*)\\)`, 'gi'));
        if (parenthesesMatch) {
          // Está entre parênteses - substituir apenas o conteúdo interno
          return text.replace(
            new RegExp(`\\(([^)]*${fullName}[^)]*)\\)`, 'gi'),
            (match, innerText) => {
              const replaced = innerText.replace(new RegExp(fullName, 'gi'), abbreviation);
              return `(${replaced})`;
            }
          );
        }
        
        // Não está entre parênteses - substituir normalmente
        return text.replace(new RegExp(fullName, 'gi'), abbreviation);
      };
      
      // Mapeamento de condições para abreviações
      const conditions = [
        { full: 'Minimal Wear', abbr: 'MW' },
        { full: 'Field-Tested', abbr: 'FT' },
        { full: 'Well-Worn', abbr: 'WW' },
        { full: 'Factory New', abbr: 'FN' },
        { full: 'Battle-Scarred', abbr: 'BS' },
      ];
      
      // Aplicar abreviações
      conditions.forEach(({ full, abbr }) => {
        skinName = abbreviateCondition(skinName, full, abbr);
      });
      
      // Limpar parênteses duplos que possam ter sido criados (segurança extra)
      skinName = skinName.replace(/\(\(/g, '(').replace(/\)\)/g, ')');
      
      return {
        weapon: parts[0],
        skin: `| ${skinName}`,
      };
    }
    return {
      weapon: name,
      skin: null,
    };
  };

  const { weapon, skin } = parseItemName(item.market_hash_name || '');

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image - Small, compact */}
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
        {/* Indicador de raridade - pontinho colorido no canto */}
        <View style={[styles.rarityIndicator, { backgroundColor: rarityColor }]} />
      </View>

      {/* Name Container - Hierarquia tipográfica */}
      <View style={styles.nameContainer}>
        {/* Nome da arma (elemento principal) */}
        <Text style={styles.weaponName} numberOfLines={1}>
          {weapon}
        </Text>
        {/* Nome da skin e desgaste (segunda linha, menor e mais suave) */}
        {skin && (
          <Text style={styles.skinName} numberOfLines={1}>
            {skin}
          </Text>
        )}
      </View>

      {/* Price - Texto independente à direita, sem container */}
      <View style={styles.priceContainer}>
        <Text style={styles.price} numberOfLines={1}>
          {formatCurrency(totalValue)}
        </Text>
        {item.quantity > 1 && (
          <Text style={styles.quantity}>x{item.quantity}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: safeSpacing.sm,
    paddingHorizontal: safeSpacing.md,
    backgroundColor: 'transparent', // Transparente - o container pai já tem fundo
    borderWidth: 0,
    borderRadius: 0,
    minHeight: 56,
    position: 'relative',
  },
  imageContainer: {
    width: 40,
    height: 40,
    marginRight: safeSpacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    overflow: 'visible',
    position: 'relative',
  },
  image: {
    width: 40,
    height: 40,
    backgroundColor: 'transparent',
  },
  imagePlaceholder: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
  },
  rarityIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#1a1a1a', // Borda escura para contraste
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 2,
  },
  nameContainer: {
    flex: 1, // Ocupa espaço disponível
    justifyContent: 'center',
    paddingRight: safeSpacing.md,
  },
  weaponName: {
    fontSize: safeTypography.sizes.sm + 1, // Tamanho maior para destaque
    fontFamily: safeTypography.fonts.primaryBold || 'Roboto',
    color: safeColors.text, // Branco ou cinza muito claro
    fontWeight: safeTypography.weights.bold, // Bold ou Semibold para hierarquia
    marginBottom: 2, // Espaçamento menor entre nome e skin
  },
  skinName: {
    fontSize: safeTypography.sizes.xs, // Tamanho menor
    fontFamily: safeTypography.fonts.primaryRegular || 'Roboto',
    color: safeColors.textMuted, // Cinza suave (muted/secondary)
    lineHeight: (safeTypography.sizes.xs || 11) * 1.3, // Line height para melhor legibilidade
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 80,
  },
  price: {
    // Preço como texto independente, sem container retangular
    fontSize: (safeTypography.sizes.sm || 13) + 3, // Tamanho ligeiramente maior que o nome da arma
    fontFamily: safeTypography.fonts.primaryBold || 'Roboto',
    color: '#d4c291', // Mesma cor dourada/bege do valor total principal
    fontWeight: safeTypography.weights.bold, // Bold para destaque
    textAlign: 'right',
  },
  quantity: {
    fontSize: safeTypography.sizes.xs - 1,
    color: safeColors.textMuted,
    fontFamily: safeTypography.fonts.secondary || 'Roboto',
    marginTop: 2,
  },
});
