import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import { colors, spacing, typography } from '@theme';
import { formatCurrency } from '@utils/currency';
import { getRarityColor } from '@utils/rarity';
import { ImagePlaceholderIcon } from '@components/common/ImagePlaceholderIcon';
import type { Item } from '@types/item';

interface ItemCardProps {
  item: Item;
  onPress?: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onPress }) => {
  const rarityColor = getRarityColor(item.rarity_tag || item.rarity || item.market_hash_name);
  const totalValue = (item.price || item.current_price || 0) * (item.quantity || 1);

  // Parse market_hash_name to separate weapon name, skin, and condition
  // Format: "AWP | Acheron (Minimal Wear)" or "AK-47 | Redline (Field-Tested)"
  const parseItemName = (name: string) => {
    const parts = name.split('|').map(p => p.trim());
    
    if (parts.length > 1) {
      let weapon = parts[0];
      let skinParts = parts.slice(1).join(' | ');
      
      // Extrair condição (ex: "(Minimal Wear)", "(Field-Tested)")
      const conditionMatch = skinParts.match(/\(([^)]+)\)/);
      let condition = null;
      if (conditionMatch) {
        condition = conditionMatch[1];
        skinParts = skinParts.replace(/\([^)]+\)/g, '').trim();
      }
      
      // Abreviar condições comuns
      const conditionAbbr: { [key: string]: string } = {
        'Minimal Wear': 'MW',
        'Field-Tested': 'FT',
        'Well-Worn': 'WW',
        'Factory New': 'FN',
        'Battle-Scarred': 'BS',
      };
      
      const abbreviatedCondition = condition ? conditionAbbr[condition] || condition : null;
      
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

  const { weapon, skin, condition } = parseItemName(item.market_hash_name || '');
  
  // Calcular largura e altura do card baseado na largura da tela (2 colunas com gap)
  // Para manter aspect ratio retrato ~1.4:1, calculamos altura baseado na largura disponível
  const screenWidth = Dimensions.get('window').width;
  const horizontalPadding = spacing.md * 2; // padding do contentContainer (esquerda + direita)
  const gap = spacing.sm; // gap entre cards (horizontal e vertical)
  const availableWidth = screenWidth - horizontalPadding - gap; // Largura disponível menos o gap
  const cardWidth = availableWidth / 2; // Cada card ocupa metade do espaço disponível (menos o gap)
  const cardHeight = cardWidth * 1.4; // Aspect ratio retrato (~1.4:1)

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { 
          width: cardWidth,
          height: cardHeight,
          borderColor: 'rgba(212, 194, 145, 0.3)', // Borda dourada tactical gold
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Badge de Preço - Topo Direito */}
      <View style={styles.priceBadge}>
        <Text style={styles.priceBadgeText}>
          {formatCurrency(totalValue)}
        </Text>
      </View>

      {/* Badge de Float - Topo Esquerdo */}
      {item.float_value !== null && item.float_value !== undefined && (
        <View style={styles.floatBadge}>
          <Text style={styles.floatBadgeText}>
            {item.float_value.toFixed(4)}
          </Text>
        </View>
      )}

      {/* Image - Centro do Card */}
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <FastImage
            source={{ uri: item.image_url, priority: FastImage.priority.normal }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.contain}
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: rarityColor + '20' }]}>
            <ImagePlaceholderIcon size={32} color={colors.textSecondary} />
          </View>
        )}
      </View>

      {/* Informações - Rodapé do Card */}
      <View style={styles.footer}>
        {/* Nome da Arma - Branco/Dourado, Bold */}
        <View style={styles.nameRow}>
          <Text style={styles.weaponName} numberOfLines={1}>
            {weapon}
          </Text>
          {item.is_stattrak && (
            <View style={styles.stattrakBadge}>
              <Text style={styles.stattrakText}>ST</Text>
            </View>
          )}
        </View>
        
        {/* Nome da Skin e Condição - Cinza/Dourado escuro */}
        <View style={styles.skinRow}>
          {skin && (
            <Text style={styles.skinName} numberOfLines={1}>
              {skin}
            </Text>
          )}
          {condition && (
            <Text style={styles.condition}>
              ({condition})
            </Text>
          )}
        </View>
        
        {/* Quantity se > 1 */}
        {item.quantity > 1 && (
          <Text style={styles.quantity}>x{item.quantity}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a', // Cinza escuro neutro (menos amarelado)
    borderRadius: 12, // rounded-xl
    borderWidth: 1, // Thin border
    overflow: 'hidden', // Para clipar badge e conteúdo
    position: 'relative',
    flexDirection: 'column',
    justifyContent: 'space-between',
    // width será definido dinamicamente no style inline baseado no cálculo
    // Remover marginBottom - o gap é controlado pelo columnWrapperStyle
  },
  priceBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    zIndex: 10,
    backgroundColor: '#d4c291', // Tactical Gold
    paddingHorizontal: spacing.xs, // px-2
    paddingVertical: spacing.xs / 2, // py-1
    borderRadius: 6, // rounded
  },
  priceBadgeText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.primaryBold,
    color: '#000000', // Black text
    fontWeight: typography.weights.bold,
  },
  floatBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Background escuro semi-transparente
    paddingHorizontal: spacing.xs, // px-2
    paddingVertical: spacing.xs / 2, // py-1
    borderRadius: 6, // rounded
  },
  floatBadgeText: {
    fontSize: typography.sizes.xs - 1,
    fontFamily: typography.fonts.secondary,
    color: 'rgba(212, 194, 145, 0.8)', // Tactical Gold mais claro
    fontWeight: typography.weights.regular,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.lg, // Espaçamento superior para badge
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    minHeight: 120, // Altura mínima para imagem
  },
  image: {
    width: '100%',
    height: '100%',
    maxHeight: 140,
    backgroundColor: 'transparent',
  },
  imagePlaceholder: {
    width: '80%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  footer: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 194, 145, 0.15)', // Divisor dourado sutil
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  weaponName: {
    fontSize: typography.sizes.sm + 1,
    fontFamily: typography.fonts.primaryBold, // Orbitron-Bold
    color: '#d4c291', // Tactical Gold (ou branco se preferir)
    fontWeight: typography.weights.bold,
    flex: 1,
  },
  skinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    marginBottom: spacing.xs / 2,
  },
  skinName: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.primaryRegular, // Orbitron-Regular
    color: 'rgba(212, 194, 145, 0.7)', // Tactical Gold mais escuro
    fontWeight: typography.weights.regular,
    flex: 1,
  },
  condition: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.secondary,
    color: 'rgba(212, 194, 145, 0.6)', // Tactical Gold ainda mais escuro
  },
  stattrakBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.xs / 2,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stattrakText: {
    fontSize: typography.sizes.xs - 1,
    color: colors.text,
    fontFamily: typography.fonts.secondaryBold,
    fontWeight: typography.weights.bold,
  },
  quantity: {
    fontSize: typography.sizes.xs - 1,
    color: 'rgba(212, 194, 145, 0.5)',
    fontFamily: typography.fonts.secondary,
  },
});

