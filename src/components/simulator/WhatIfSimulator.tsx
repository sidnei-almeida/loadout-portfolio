import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  FlatList,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { LineChart } from 'react-native-chart-kit';
import { colors, spacing, typography } from '@theme';
import { formatCurrency } from '@utils/currency';
import { getRarityColor } from '@utils/rarity';
import { ImagePlaceholderIcon } from '@components/common/ImagePlaceholderIcon';
import type { Snapshot, SnapshotAnalysis } from '@services/snapshots';

// Helper para garantir valores seguros
const safeTypography = typography || {
  fonts: { primary: 'Orbitron', secondary: 'Rajdhani' },
  weights: { medium: '500', bold: '700' },
  sizes: { xs: 11, sm: 13, md: 15, lg: 18 },
};
const safeColors = colors || { text: '#FFFFFF', textSecondary: '#B8BCC8' };

interface WhatIfSimulatorProps {
  snapshot: Snapshot;
  analysis: SnapshotAnalysis | null;
  isLoading?: boolean;
  currentPortfolioValue?: number;
}

/**
 * Parse market_hash_name to extract weapon, skin, and condition
 */
const parseItemName = (name: string) => {
  const parts = name.split('|').map((p) => p.trim());

  if (parts.length > 1) {
    const weapon = parts[0];
    let skinParts = parts.slice(1).join(' | ');

    // Extract condition (e.g., "(Minimal Wear)", "(Field-Tested)")
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

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  snapshot,
  analysis,
  isLoading,
  currentPortfolioValue = 0,
}) => {
  if (!analysis) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Select a snapshot to see the analysis</Text>
      </View>
    );
  }

  // Os 3 valores do backend
  const originalValue = analysis.original_value ?? snapshot.total_value ?? 0;
  const currentValue = analysis.current_value ?? currentPortfolioValue ?? 0;
  const simulatedValue = analysis.projected_value ?? originalValue; // Valor Simulado
  
  // Calcular variações
  const currentVsOriginal = currentValue - originalValue;
  const simulatedVsOriginal = simulatedValue - originalValue;
  const currentVsSimulated = currentValue - simulatedValue;
  
  const roiAbsolute = analysis.absolute_gain ?? currentVsOriginal;
  const roiPercent = analysis.roi_percent ?? (originalValue > 0 ? (currentVsOriginal / originalValue) * 100 : 0);
  
  const isPositive = roiAbsolute >= 0;
  const isZeroDay = Math.abs(roiAbsolute) < 0.01;

  const screenWidth = Dimensions.get('window').width;

  // Preparar dados do gráfico de evolução
  let evolutionChartData = { labels: [] as string[], datasets: [{ data: [] as number[] }] };
  if (analysis.history_chart && Array.isArray(analysis.history_chart) && analysis.history_chart.length > 0) {
    const history = analysis.history_chart;
    const labels = history
      .filter((_, i) => i === 0 || i === history.length - 1 || i % Math.ceil(history.length / 10) === 0)
      .map((point: any) => {
        const date = new Date(point.date || point.x);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      });
    
    const actualData = history.map((point: any) => point.total_value ?? point.y ?? 0);

    evolutionChartData = {
      labels,
      datasets: [
        {
          data: actualData,
          color: (opacity = 1) => `rgba(212, 194, 145, ${opacity})`, // Tactical Gold
          strokeWidth: 2,
        },
      ],
    };
  }

  // Usar lista de itens do backend (já vem com imagens)
  const portfolioItems = useMemo(() => {
    // Se o backend retornou a lista de items, usar ela (já tem imagens)
    if (analysis.items && analysis.items.length > 0) {
      return analysis.items.map((item) => ({
        id: item.market_hash_name,
        market_hash_name: item.market_hash_name,
        price: item.current_price * item.quantity, // Valor total atual
        image_url: item.image_url,
        quantity: item.quantity,
      }));
    }
    
    // Fallback para top_movers (caso o backend não retorne items ainda)
    if (analysis.top_movers && analysis.top_movers.length > 0) {
      return analysis.top_movers.map((mover) => ({
        id: mover.name,
        market_hash_name: mover.name,
        price: 0, // Valor não disponível sem items
        image_url: null,
        quantity: 1,
      }));
    }
    
    return [];
  }, [analysis.items, analysis.top_movers]);

  const renderPortfolioItem = ({ item }: { item: any }) => {
    const { weapon, skin } = parseItemName(item.market_hash_name);
    const rarityColor = getRarityColor(item.rarity_tag || item.rarity || item.market_hash_name);
    
    return (
      <View style={styles.portfolioItemRow}>
        {/* Thumbnail */}
        <View style={styles.itemThumbnail}>
          {item.image_url ? (
            <FastImage
              source={{ uri: item.image_url, priority: FastImage.priority.normal }}
              style={styles.itemImage}
              resizeMode={FastImage.resizeMode.contain}
            />
          ) : (
            <View style={styles.itemImagePlaceholder}>
              <ImagePlaceholderIcon size={20} color={safeColors.textSecondary} />
            </View>
          )}
          {/* Indicador de raridade - pontinho colorido no canto */}
          <View style={[styles.rarityIndicator, { backgroundColor: rarityColor }]} />
        </View>

        {/* Nome */}
        <View style={styles.itemNameContainer}>
          <Text style={styles.itemWeaponName} numberOfLines={1}>
            {weapon}
          </Text>
          {skin && (
            <Text style={styles.itemSkinName} numberOfLines={1}>
              {skin}
            </Text>
          )}
        </View>

        {/* Valor */}
        <Text style={styles.itemValue}>{formatCurrency(item.price || 0)}</Text>
      </View>
    );
  };

  // Cores para os valores (baseadas nas variações)
  const currentVsOriginalColor = currentVsOriginal >= 0 ? '#81C784' : '#E57373';
  const simulatedVsOriginalColor = simulatedVsOriginal >= 0 ? '#81C784' : '#E57373';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
      {/* Hero Section: 3 values (Original, Current, Simulated) */}
      <View style={styles.heroCard}>
        <View style={styles.heroSection}>
          <Text style={styles.heroLabel}>Original</Text>
          <Text style={styles.heroValue}>{formatCurrency(originalValue)}</Text>
        </View>
        <Text style={styles.heroArrow}>→</Text>
        <View style={styles.heroSection}>
          <Text style={styles.heroLabel}>Current</Text>
          <Text style={[styles.heroValue, { color: currentVsOriginalColor }]}>
            {formatCurrency(currentValue)}
          </Text>
        </View>
        <Text style={styles.heroArrow}>→</Text>
        <View style={styles.heroSection}>
          <Text style={styles.heroLabel}>Simulated</Text>
          <Text style={[styles.heroValue, { color: simulatedVsOriginalColor }]}>
            {formatCurrency(simulatedValue)}
          </Text>
        </View>
      </View>

      {/* Cards de Métricas Secundárias (ROI e Liquidez) */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>ROI</Text>
          <Text style={[styles.metricValue, isPositive ? styles.metricValuePositive : styles.metricValueNegative]}>
            {isPositive ? '+' : ''}{roiPercent.toFixed(2)}%
          </Text>
          <Text style={[styles.metricSubtext, isPositive ? styles.metricSubtextPositive : styles.metricSubtextNegative]}>
            {isPositive ? '+' : ''}{formatCurrency(Math.abs(roiAbsolute))}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Liquidity</Text>
          <Text style={styles.metricValue}>{analysis.liquidity_score || 0}</Text>
          <View style={styles.liquidityProgress}>
            <View
              style={[
                styles.liquidityProgressFill,
                { width: `${Math.min(100, Math.max(0, analysis.liquidity_score || 0))}%` },
              ]}
            />
          </View>
          <Text style={styles.metricSubtext}>{analysis.liquidity_label || 'N/A'}</Text>
        </View>
      </View>

      {/* Gráfico de Comparação: Original vs Atual vs Simulado */}
      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionTitle}>Value Comparison</Text>
        </View>
        <View style={styles.comparisonChartCard}>
          <LineChart
            data={{
              labels: ['Original', 'Current', 'Simulated'],
              datasets: [
                {
                  data: [originalValue, currentValue, simulatedValue],
                  color: (opacity = 1) => `rgba(212, 194, 145, ${opacity})`, // Tactical Gold
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth - spacing.md * 2}
            height={220}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: 'transparent',
              backgroundGradientTo: 'transparent',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(212, 194, 145, ${opacity})`, // Tactical Gold
              labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
              formatYLabel: (value) => {
                const num = Number(value);
                if (isNaN(num)) return '0';
                if (num >= 1000) {
                  return `${(num / 1000).toFixed(1)}k`;
                }
                return num.toFixed(0);
              },
              propsForDots: {
                r: '0', // Radius 0 = invisível
                strokeWidth: '0',
                stroke: 'transparent',
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#292524', // Muito escuro, quase invisível
                strokeWidth: 0.5,
              },
            }}
            bezier
            style={styles.comparisonChart}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={true}
            withHorizontalLines={true}
            withDots={false}
          />
        </View>
      </View>

      {/* Seção: Composição do Portfólio */}
      {portfolioItems.length > 0 && (
        <View style={styles.portfolioSection}>
          <Text style={styles.sectionTitle}>Items in this Snapshot</Text>
          <View style={styles.portfolioList}>
            {portfolioItems.map((item, index) => (
              <React.Fragment key={item.id || index}>
                {renderPortfolioItem({ item })}
                {index < portfolioItems.length - 1 && <View style={styles.itemDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      )}

      {/* Gráfico de Evolução (opcional, mantido para referência) */}
      {!isZeroDay && evolutionChartData.labels.length > 0 && (
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Evolution: Actual vs Projected</Text>
          </View>
          <LineChart
            data={evolutionChartData}
            width={screenWidth - spacing.lg * 2}
            height={200}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: 'transparent',
              backgroundGradientTo: 'transparent',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(212, 194, 145, ${opacity})`, // Tactical Gold
              labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
              formatYLabel: (value) => {
                const num = Number(value);
                if (isNaN(num)) return '0';
                if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
                return num.toFixed(0);
              },
              propsForDots: {
                r: '0',
                strokeWidth: '0',
                stroke: 'transparent',
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#292524',
                strokeWidth: 0.5,
              },
            }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={true}
            withHorizontalLines={true}
            withDots={false}
          />
        </View>
      )}

      {isZeroDay && (
        <View style={styles.zeroDayContainer}>
          <Text style={styles.zeroDayText}>
            Evolution analysis available from tomorrow.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: safeTypography.sizes.md,
    color: safeColors.textSecondary,
    textAlign: 'center',
    fontFamily: safeTypography.fonts.secondary,
  },
  // Hero Section
  heroCard: {
    backgroundColor: '#1a1a1a', // Cinza carvão muito escuro (ligeiramente mais claro que o background)
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)', // Tactical Gold 20%
  },
  heroSection: {
    alignItems: 'center',
    flex: 1,
  },
  heroLabel: {
    fontSize: safeTypography.sizes.xs,
    color: safeColors.textSecondary,
    marginBottom: spacing.xs,
    fontFamily: safeTypography.fonts.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: safeTypography.sizes.md + 2 || 17,
    fontWeight: safeTypography.weights.bold,
    color: '#FFFFFF', // Branco/Cinza Claro para valor original
    fontFamily: safeTypography.fonts.primary,
  },
  heroValuePositive: {
    color: '#81C784', // Verde pastel suave (se lucro)
  },
  heroValueNegative: {
    color: '#E57373', // Vermelho pastel suave (se prejuízo)
  },
  heroArrow: {
    fontSize: 20,
    color: '#d4c291', // Dourado (Tactical Gold)
    marginHorizontal: spacing.xs,
    fontFamily: safeTypography.fonts.secondary,
  },
  // Cards de Métricas
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)', // Tactical Gold 20% - borda muito fina
  },
  metricLabel: {
    fontSize: safeTypography.sizes.xs,
    color: safeColors.textSecondary,
    marginBottom: spacing.xs,
    fontFamily: safeTypography.fonts.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: safeTypography.sizes.xl || 22,
    fontWeight: safeTypography.weights.bold,
    color: '#FFFFFF',
    marginBottom: spacing.xs / 2,
    fontFamily: safeTypography.fonts.primary,
  },
  metricValuePositive: {
    color: '#81C784', // Verde pastel
  },
  metricValueNegative: {
    color: '#E57373', // Vermelho pastel
  },
  metricSubtext: {
    fontSize: safeTypography.sizes.xs,
    color: safeColors.textSecondary,
    fontFamily: safeTypography.fonts.secondary,
  },
  metricSubtextPositive: {
    color: '#81C784',
  },
  metricSubtextNegative: {
    color: '#E57373',
  },
  liquidityProgress: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  liquidityProgressFill: {
    height: '100%',
    backgroundColor: '#d4c291', // Tactical Gold
    borderRadius: 2,
  },
  // Seção de Composição do Portfólio
  portfolioSection: {
    marginBottom: spacing.lg,
  },
  portfolioList: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)',
    overflow: 'hidden',
  },
  portfolioItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 56,
  },
  itemThumbnail: {
    width: 40,
    height: 40,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    overflow: 'visible',
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
  itemImage: {
    width: 40,
    height: 40,
  },
  itemImagePlaceholder: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
  },
  itemNameContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  itemWeaponName: {
    fontSize: safeTypography.sizes.md || 15,
    fontWeight: safeTypography.weights.bold,
    color: '#FFFFFF',
    fontFamily: safeTypography.fonts.primary,
    marginBottom: 2,
  },
  itemSkinName: {
    fontSize: safeTypography.sizes.xs,
    color: safeColors.textSecondary,
    fontFamily: safeTypography.fonts.secondary,
  },
  itemValue: {
    fontSize: safeTypography.sizes.md,
    fontWeight: safeTypography.weights.bold,
    color: '#d4c291', // Tactical Gold
    fontFamily: safeTypography.fonts.primary,
    textAlign: 'right',
  },
  itemDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // Linha divisória em cinza sutil
    marginLeft: spacing.md + 40 + spacing.sm, // Alinhar com o conteúdo (thumbnail reduzido + margin + padding)
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
  // Seção do Gráfico
  chartSection: {
    marginBottom: spacing.lg,
  },
  chartHeader: {
    // Sem marginBottom - o espaçamento vem do sectionTitle
  },
  sectionTitle: {
    fontSize: safeTypography.sizes.lg || 18,
    fontFamily: safeTypography.fonts.primary,
    color: '#d4c291', // Tactical Gold
    fontWeight: safeTypography.weights.semiBold,
    marginBottom: spacing.md,
  },
  // Gráfico de Comparação
  comparisonChartCard: {
    backgroundColor: '#1c1b19', // Tactical dark background (mesmo do Dashboard)
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.3)', // Tactical Gold 30% opacity
    borderRadius: 16, // rounded-2xl
    padding: 0, // Sem padding - gráfico ocupa 100% do espaço
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    // Efeito de profundidade sutil
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  comparisonChart: {
    marginVertical: 0,
    marginHorizontal: 0,
    borderRadius: 12,
  },
  // Gráfico
  chartCard: {
    backgroundColor: '#1c1b19',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.3)',
    borderRadius: 16,
    padding: 0,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  chartHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  chartTitle: {
    fontSize: safeTypography.sizes.lg || 18,
    fontFamily: safeTypography.fonts.primary,
    color: '#d4c291',
    fontWeight: safeTypography.weights.medium,
  },
  chart: {
    borderRadius: 16,
  },
  zeroDayContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)',
  },
  zeroDayText: {
    fontSize: safeTypography.sizes.sm,
    color: safeColors.textSecondary,
    textAlign: 'center',
    fontFamily: safeTypography.fonts.secondary,
  },
});
