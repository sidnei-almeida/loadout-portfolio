import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Polygon, Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { useLanguage } from '@contexts/LanguageContext';
import { getWearConditionKey } from './utils';
import { itemDetailStyles, safeSpacing } from './styles';

interface ItemDetailFloatBarProps {
  floatValue: number;
}

export const ItemDetailFloatBar: React.FC<ItemDetailFloatBarProps> = ({
  floatValue,
}) => {
  const { t } = useLanguage();
  const screenWidth = Dimensions.get('window').width;
  const floatPercentage = Math.min(100, Math.max(0, (floatValue / 1.0) * 100));
  const wearCondition = floatValue > 0 ? t(getWearConditionKey(floatValue)) : null;
  const styles = itemDetailStyles;

  return (
    <View style={styles.floatSection}>
      <View style={styles.floatHeader}>
        <Text style={styles.floatSectionTitle}>{t('itemCondition')}</Text>
      </View>

      <View style={styles.floatBarContainer}>
        <View style={styles.floatBarWrapper}>
          <Svg height={28} width={screenWidth - safeSpacing.lg * 2} style={styles.floatBar}>
            <Defs>
              <SvgLinearGradient id="floatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#b0c3d9" stopOpacity="1" />
                <Stop offset="14.28%" stopColor="#5e98d9" stopOpacity="1" />
                <Stop offset="28.57%" stopColor="#4b69ff" stopOpacity="1" />
                <Stop offset="42.86%" stopColor="#8847ff" stopOpacity="1" />
                <Stop offset="57.14%" stopColor="#d32ce6" stopOpacity="1" />
                <Stop offset="71.43%" stopColor="#eb4b4b" stopOpacity="1" />
                <Stop offset="100%" stopColor="#e4ae39" stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <Rect
              x="0"
              y="0"
              width={screenWidth - safeSpacing.lg * 2}
              height="28"
              rx="6"
              fill="url(#floatGradient)"
              opacity="0.95"
            />
          </Svg>

          <View style={[styles.floatIndicatorLine, { left: `${floatPercentage}%` }]}>
            <View style={styles.floatIndicatorGlow} />
            <View style={styles.floatIndicatorCore} />
          </View>

          <View style={[styles.floatMarker, { left: `${floatPercentage}%` }]}>
            <Svg width={20} height={16} viewBox="0 0 20 16">
              <Defs>
                <SvgLinearGradient id="markerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#f5e6b8" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#d4c291" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              <Polygon
                points="10,0 20,8 10,16 0,8"
                fill="url(#markerGradient)"
                stroke="#1a1a1a"
                strokeWidth="1.5"
              />
              <Polygon
                points="10,2 18,8 10,14 2,8"
                fill="rgba(255, 255, 255, 0.15)"
              />
            </Svg>
          </View>
        </View>

        <View style={styles.floatConditionMarkers}>
          <Text style={styles.floatConditionMarker}>FN</Text>
          <Text style={styles.floatConditionMarker}>MW</Text>
          <Text style={styles.floatConditionMarker}>FT</Text>
          <Text style={styles.floatConditionMarker}>WW</Text>
          <Text style={styles.floatConditionMarker}>BS</Text>
        </View>
      </View>

      <View style={styles.floatLabels}>
        <View style={styles.floatValueContainer}>
          <Text style={styles.floatLabel}>{t('floatValue')}</Text>
          <Text style={styles.floatValueText}>{floatValue.toFixed(6)}</Text>
        </View>
        {wearCondition && (
          <View style={styles.floatWearContainer}>
            <Text style={styles.floatWearLabel}>{t('wear')}</Text>
            <Text style={styles.floatWearText}>{wearCondition}</Text>
          </View>
        )}
      </View>
    </View>
  );
};
