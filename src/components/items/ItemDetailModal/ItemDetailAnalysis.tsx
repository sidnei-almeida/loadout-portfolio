import React from 'react';
import { View, Text } from 'react-native';
import { useLanguage } from '@contexts/LanguageContext';
import type { ItemHistoryResponse } from '@types/prices';
import { itemDetailStyles, safeColors } from './styles';

interface ItemDetailAnalysisProps {
  history: ItemHistoryResponse;
}

export const ItemDetailAnalysis: React.FC<ItemDetailAnalysisProps> = ({
  history,
}) => {
  const { t } = useLanguage();
  const styles = itemDetailStyles;

  if (!history?.analysis) return null;
  const { analysis, summary } = history;

  return (
    <View style={styles.analysisSection}>
      <Text style={styles.analysisSectionTitle}>{t('technicalAnalysis')}</Text>

      <View style={styles.analysisContainer}>
        <View style={styles.analysisTopRow}>
          {analysis.rsi !== undefined && (
            <View style={styles.analysisCardSmall}>
              <Text style={styles.analysisLabel}>{t('rsi')}</Text>
              <View style={styles.rsiContainer}>
                <View style={styles.rsiBar}>
                  <View
                    style={[
                      styles.rsiBarFill,
                      {
                        width: `${Math.min(100, Math.max(0, analysis.rsi))}%`,
                        backgroundColor:
                          analysis.rsi > 70
                            ? safeColors.error
                            : analysis.rsi < 30
                            ? safeColors.success
                            : '#d4c291',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.analysisValue}>{analysis.rsi.toFixed(1)}</Text>
              </View>
              <Text style={styles.analysisStatus}>
                {analysis.rsi_state === 'Oversold'
                  ? t('oversold')
                  : analysis.rsi_state === 'Overbought'
                  ? t('overbought')
                  : t('neutral')}
              </Text>
            </View>
          )}

          {analysis.volatility_value !== undefined && (
            <View style={styles.analysisCardSmall}>
              <Text style={styles.analysisLabel}>{t('volatility')}</Text>
              <View style={styles.volatilityContainer}>
                <View style={styles.volatilityBar}>
                  <View
                    style={[
                      styles.volatilityBarFill,
                      {
                        width: `${Math.min(100, Math.max(0, (analysis.volatility_value / 10) * 100))}%`,
                        backgroundColor:
                          analysis.volatility === 'High'
                            ? safeColors.error
                            : analysis.volatility === 'Medium'
                            ? '#d4c291'
                            : safeColors.success,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.analysisValue}>
                  {analysis.volatility_value.toFixed(1)}%
                </Text>
              </View>
              <Text style={styles.analysisStatus}>
                {analysis.volatility === 'High'
                  ? t('volatilityHigh')
                  : analysis.volatility === 'Medium'
                  ? t('volatilityAvg')
                  : t('volatilityLow')}
              </Text>
            </View>
          )}
        </View>

        {summary && summary.price_change_percent !== undefined && (
          <View style={styles.trendCardFullWidth}>
            <Text style={styles.trendCardLabel}>{t('overallTrend')}</Text>
            <View style={styles.trendCardRight}>
              <View style={styles.trendCardStatus}>
                <Text
                  style={[
                    styles.trendCardIcon,
                    {
                      color:
                        summary.price_change_percent >= 5
                          ? '#d4c291'
                          : summary.price_change_percent <= -5
                          ? '#ef4444'
                          : '#9ca3af',
                    },
                  ]}
                >
                  {summary.price_change_percent >= 5
                    ? '↗'
                    : summary.price_change_percent >= 0
                    ? '→'
                    : summary.price_change_percent <= -5
                    ? '↘'
                    : '→'}
                </Text>
                <Text style={styles.trendCardStatusText}>
                  {summary.price_change_percent >= 5
                    ? t('strongRise')
                    : summary.price_change_percent >= 0
                    ? t('mildRise')
                    : summary.price_change_percent <= -5
                    ? t('strongFall')
                    : t('mildFall')}
                </Text>
              </View>
              <View
                style={[
                  styles.trendCardBadge,
                  {
                    backgroundColor:
                      summary.price_change_percent >= 0
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(239, 68, 68, 0.1)',
                    borderColor:
                      summary.price_change_percent >= 0
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.trendCardBadgeText,
                    {
                      color:
                        summary.price_change_percent >= 0 ? '#10b981' : '#ef4444',
                    },
                  ]}
                >
                  {summary.price_change_percent >= 0 ? '+' : ''}
                  {summary.price_change_percent.toFixed(2)}%
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};
