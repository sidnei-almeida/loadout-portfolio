import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors, spacing, typography } from '@theme';
import type { PortfolioHistory } from '@types/portfolio';

// Helper para garantir valores seguros
const safeTypography = typography || {
  fonts: { 
    secondaryMedium: 'Rajdhani-Medium',
    primarySemiBold: 'Orbitron-SemiBold',
    secondaryRegular: 'Rajdhani-Regular',
    secondary: 'Rajdhani'
  },
  weights: { medium: '500', semiBold: '600' },
  sizes: { xs: 11, sm: 13, lg: 18 },
};
const safeColors = colors || { textMuted: '#6B7280', textSecondary: '#B8BCC8' };
const safeSpacing = spacing || { xs: 4, sm: 8, md: 16, lg: 24, xl: 20 };

interface PortfolioChartProps {
  history: PortfolioHistory[];
  isLoading?: boolean;
  onDaysChange?: (days: number) => void;
  selectedDays?: number;
}

const CHART_PERIODS = [
  { days: 7, label: '7D' },
  { days: 30, label: '30D' },
  { days: 90, label: '90D' },
  { days: 365, label: 'ALL' },
];

export const PortfolioChart: React.FC<PortfolioChartProps> = ({
  history,
  isLoading = false,
  onDaysChange,
  selectedDays = 30,
}) => {
  const [localSelectedDays, setLocalSelectedDays] = useState(selectedDays);

  const handleDaysChange = (days: number) => {
    setLocalSelectedDays(days);
    onDaysChange?.(days);
  };

  // Dimensões fixas para evitar loop infinito
  const screenWidth = Dimensions.get('window').width;
  const cardHeight = 280; // Altura fixa do card (sem loop infinito)
  const chartHeight = cardHeight; // Altura do gráfico = altura total do card (sem padding interno)
  // Largura do gráfico = largura da tela - padding lateral do container pai (Screen/scrollContent)
  // O padding do container pai já existe para não tocar as laterais da tela
  const containerPadding = safeSpacing.md * 2; // Padding do Screen/scrollContent (esquerda + direita)
  const chartWidth = screenWidth - containerPadding; // Largura = tela - padding lateral (para não tocar bordas)

  const chartData = useMemo(() => {
    if (!history || history.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            data: [],
          },
        ],
      };
    }

    // Limitar a 30 pontos para performance
    const maxPoints = 30;
    const step = Math.max(1, Math.floor(history.length / maxPoints));
    const filteredHistory = history.filter((_, index) => index % step === 0);

    // Se ainda tiver muitos pontos, pegar apenas os últimos
    const finalHistory =
      filteredHistory.length > maxPoints
        ? filteredHistory.slice(-maxPoints)
        : filteredHistory;

    const labels = finalHistory.map((_, index) => {
      if (index === 0 || index === finalHistory.length - 1) {
        const date = new Date(finalHistory[index].date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }
      return '';
    });

    const data = finalHistory.map((point) => point.total_value);

    return {
      labels,
      datasets: [
        {
          data,
          // Linha Tactical Gold: Ouro tático CS2
          color: (opacity = 1) => `rgba(212, 194, 145, ${opacity})`, // Tactical Gold #d4c291
          strokeWidth: 2, // Linha padrão (2px)
        },
      ],
    };
  }, [history]);


  const hasData = history && history.length > 0;

  return (
    <React.Fragment>
      {/* Header Premium: Título à esquerda, Filtros à direita */}
      {/* SEMPRE VISÍVEL: Header mantido mesmo sem dados para permitir mudança de filtro */}
      <View style={styles.header}>
        {/* Lado Esquerdo: Título */}
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Portfolio variation</Text>
        </View>

        {/* Lado Direito: Filtros de Data - Minimalistas */}
        <View style={styles.selectorsContainer}>
          {CHART_PERIODS.map((period) => (
            <TouchableOpacity
              key={period.days}
              style={[
                styles.selectorButton,
                localSelectedDays === period.days && styles.selectorButtonActive,
              ]}
              onPress={() => handleDaysChange(period.days)}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.selectorText,
                  localSelectedDays === period.days && styles.selectorTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Chart Card - O gráfico É o card (flutua diretamente) */}
      <View style={[styles.chartCard, { height: cardHeight }]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#d4c291" />
          </View>
        ) : !hasData ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No historical data</Text>
          </View>
        ) : (
          <LineChart
            data={chartData}
            width={chartWidth}
            height={chartHeight}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: 'transparent',
              backgroundGradientTo: 'transparent',
              decimalPlaces: 0,
              // Linha Tactical Gold: Ouro tático CS2
              color: (opacity = 1) => `rgba(212, 194, 145, ${opacity})`, // Tactical Gold #d4c291
              // Labels com contraste sutil
              labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`, // Gray-400
              formatYLabel: (value) => {
                const num = Number(value);
                if (isNaN(num)) return '0';
                if (num >= 1000) {
                  return `${(num / 1000).toFixed(1)}k`;
                }
                return num.toFixed(0);
              },
              // Pontos completamente invisíveis
              propsForDots: {
                r: '0', // Radius 0 = invisível
                strokeWidth: '0',
                stroke: 'transparent',
              },
              // Grid lines sutis e escuros (quase invisíveis)
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#292524', // Muito escuro, quase invisível
                strokeWidth: 0.5,
              },
            }}
            bezier
            style={styles.chart}
            // Configuração Tactical: visual limpo com grid sutil
            withInnerLines={true} // Grid horizontal sutil
            withOuterLines={false} // Sem linhas externas (bordas)
            withVerticalLines={true} // Grid vertical sutil
            withHorizontalLines={true} // Grid horizontal sutil
            withDots={false} // Sem pontos visíveis
          />
        )}
      </View>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Título à esquerda, filtros à direita
    alignItems: 'center',
    marginBottom: safeSpacing.lg,
    width: '100%', // Força ocupar toda largura
  },
  headerLeft: {
    flex: 1, // Ocupa espaço disponível
    marginRight: safeSpacing.md,
  },
  headerTitle: {
    fontSize: safeTypography.sizes.lg,
    fontFamily: safeTypography.fonts.primarySemiBold,
    color: '#d4c291', // Tactical Gold
    marginBottom: safeSpacing.xs / 2,
    fontWeight: safeTypography.weights.semiBold,
  },
  headerSubtitle: {
    fontSize: safeTypography.sizes.sm,
    fontFamily: safeTypography.fonts.secondaryRegular,
    color: safeColors.textMuted,
  },
  selectorsContainer: {
    flexDirection: 'row',
    gap: safeSpacing.xs / 2, // Gap menor para visual mais compacto
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // bg-white/5 - Estilo Vercel
    padding: safeSpacing.xs / 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-end', // Alinha botões à direita
    flexShrink: 0, // Não encolhe, mantém tamanho
  },
  selectorButton: {
    paddingVertical: safeSpacing.xs / 2,
    paddingHorizontal: safeSpacing.sm,
    borderRadius: 6,
    backgroundColor: 'transparent', // Transparente por padrão
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorButtonActive: {
    backgroundColor: '#d4c291', // Tactical Gold quando ativo
  },
  selectorText: {
    fontSize: safeTypography.sizes.xs,
    fontFamily: safeTypography.fonts.secondaryMedium,
    color: safeColors.textMuted, // Cinza sutil
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: safeTypography.weights.medium,
  },
  selectorTextActive: {
    color: '#000000', // Preto quando ativo (alto contraste sobre dourado)
    fontWeight: safeTypography.weights.semiBold,
  },
  chartCard: {
    // O gráfico É o card - estilo aplicado diretamente aqui, sem wrapper
    backgroundColor: '#1c1b19', // Tactical dark background
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.3)', // Tactical Gold 30% opacity
    borderRadius: 16, // rounded-2xl
    padding: 0, // Sem padding - gráfico ocupa 100% do espaço
    width: '100%',
    marginBottom: safeSpacing.xl, // Espaçamento inferior
    alignItems: 'center',
    justifyContent: 'center',
    // Efeito de profundidade sutil
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  chart: {
    marginVertical: 0,
    marginHorizontal: 0, // Sem margens horizontais
    borderRadius: 12, // Bordas arredondadas para combinar com o container
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Ocupa todo o espaço disponível dentro do card
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Ocupa todo o espaço disponível dentro do card
  },
  emptyText: {
    color: safeColors.textSecondary,
    fontSize: safeTypography.sizes.sm,
    fontFamily: safeTypography.fonts.secondary,
  },
});

