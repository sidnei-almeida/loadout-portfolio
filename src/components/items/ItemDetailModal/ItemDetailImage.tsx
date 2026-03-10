import React from 'react';
import { View, Text } from 'react-native';
import FastImage from 'react-native-fast-image';
import { getRarityColor } from '@utils/rarity';
import type { Item } from '@types/item';
import { itemDetailStyles } from './styles';

interface ItemDetailImageProps {
  item: Item;
}

export const ItemDetailImage: React.FC<ItemDetailImageProps> = ({ item }) => {
  const rarityColor = getRarityColor(item.rarity_tag || item.rarity || item.market_hash_name);
  const styles = itemDetailStyles;

  return (
    <>
      {item.image_url ? (
        <View style={styles.imageContainer}>
          <FastImage
            source={{ uri: item.image_url, priority: FastImage.priority.high }}
            style={styles.heroImage}
            resizeMode={FastImage.resizeMode.contain}
          />
        </View>
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: rarityColor + '20' }]}>
          <Text style={styles.placeholderText}>?</Text>
        </View>
      )}

      <View style={styles.assetIdRow}>
        <Text style={styles.assetIdText}>
          {item.asset_id && (
            <>
              <Text style={styles.assetIdLabelInline}>ID: </Text>
              <Text style={styles.assetIdValueInline}>{item.asset_id}</Text>
            </>
          )}
          {item.asset_id && item.paint_seed && (
            <Text style={styles.assetIdSeparator}>  •  </Text>
          )}
          {item.paint_seed && (
            <>
              <Text style={styles.assetIdLabelInline}>SEED: </Text>
              <Text style={styles.assetIdValueInline}>{item.paint_seed}</Text>
            </>
          )}
        </Text>
      </View>
    </>
  );
};
