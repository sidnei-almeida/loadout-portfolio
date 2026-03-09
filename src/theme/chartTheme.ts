/**
 * Tema padronizado para todos os gráficos do app (Portfolio, Skins, Snapshots).
 * Design: fundo preto, grid sutil, linha golden-brown, área preenchida escura.
 */

// Cores do design dos gráficos
export const CHART_COLORS = {
  /** Fundo do gráfico */
  background: '#000000',
  /** Linha do gráfico - golden-brown/light olive */
  line: '#b8a88a',
  /** Linha com opacidade (gradiente) - mais proeminente, mantém transparência */
  lineFaded: 'rgba(184, 168, 138, 0.5)',
  /** Preenchimento sob a linha - dark olive */
  fillFrom: '#5C523A',
  /** Preenchimento no bottom - transparente */
  fillTo: '#000000',
  /** Grid horizontal/vertical - linhas finas visíveis */
  grid: 'rgba(120, 120, 120, 0.5)',
  /** Labels dos eixos */
  label: '#FFFFFF',
  /** Borda do container - mesma borda fina dos cards de armas (Inventory modal) */
  border: 'rgba(212, 194, 145, 0.3)',
} as const;

/** Config compartilhada para react-native-chart-kit */
export const chartKitConfig = {
  backgroundColor: CHART_COLORS.background,
  backgroundGradientFrom: CHART_COLORS.background,
  backgroundGradientTo: CHART_COLORS.background,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(184, 168, 138, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  fillShadowGradientFrom: CHART_COLORS.fillFrom,
  fillShadowGradientFromOpacity: 0.8,
  fillShadowGradientTo: CHART_COLORS.background,
  fillShadowGradientToOpacity: 0,
  formatYLabel: (value: string | number) => {
    const num = typeof value === 'number' ? value : Number(value);
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
    stroke: CHART_COLORS.grid,
    strokeWidth: 1.5,
  },
} as const;

/** Style para LineChart (chart-kit): reduz padding para grade ocupar mais o card */
export const chartKitChartStyle = {
  borderRadius: 12,
  paddingTop: 8,
  paddingRight: 36,
  paddingBottom: 8,
  marginVertical: 0,
  marginHorizontal: 0,
};

/** Estilo do container dos gráficos - card arredondado, borda fina como cards de armas */
export const chartContainerStyle = {
  backgroundColor: CHART_COLORS.background,
  borderWidth: 1,
  borderColor: CHART_COLORS.border,
  borderRadius: 16,
  overflow: 'hidden' as const,
  padding: 0,
};

/** Estilos padronizados do card de gráfico (Home, ItemDetail, Simulator) */
export const chartCardStyle = {
  backgroundColor: CHART_COLORS.background,
  borderWidth: 1,
  borderColor: CHART_COLORS.border,
  borderRadius: 16,
  padding: 0,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  overflow: 'hidden' as const,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 6,
};
