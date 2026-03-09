import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Text as SvgText, G } from 'react-native-svg';
import { LineChart } from 'react-native-wagmi-charts';
import { useLanguage } from '@contexts/LanguageContext';
import { CHART_COLORS } from '../../theme/chartTheme';

/** Grade (grid) que preenche o card inteiro */
const ChartGrid: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const hLines = [0, 1, 2, 3, 4].map((i) => (height * i) / 4);
  const vLines = [0, 1, 2, 3, 4].map((i) => (width * i) / 4);

  return (
    <G>
      {hLines.map((y, i) => (
        <Line key={`h-${i}`} x1={0} y1={y} x2={width} y2={y} stroke={CHART_COLORS.grid} strokeWidth={1} />
      ))}
      {vLines.map((x, i) => (
        <Line key={`v-${i}`} x1={x} y1={0} x2={x} y2={height} stroke={CHART_COLORS.grid} strokeWidth={1} />
      ))}
    </G>
  );
};

/** Formata valor para label do eixo Y */
const formatAxisValue = (v: number): string => {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
};

/** Máximo de labels no eixo X (evita poluição visual) */
const MAX_X_TICKS = 6;

/** Formata data conforme o período (curto = d/m, longo = mês/ano) */
const formatXLabel = (ts: number, periodDays: number, monthNames: string[]): string => {
  const d = new Date(ts);
  if (periodDays <= 30) {
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
  if (periodDays <= 90) {
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
  return `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
};

/** Gera ticks do eixo X: 1 ponto → 1 label, 2 pontos → 2 labels, 3+ → até 6 labels uniformes */
const getXTicksForPeriod = (
  startTs: number,
  endTs: number,
  width: number,
  selectedDays: number,
  dataLength: number,
  monthNames: string[],
): Array<{ label: string; x: number; ts: number }> => {
  const leftPad = 12;
  const rightPad = 12;
  const usableW = width - leftPad - rightPad;
  const spanMs = endTs - startTs;

  // 1 ponto: só uma data (centrada)
  if (dataLength <= 1) {
    return [{
      label: formatXLabel(endTs, selectedDays, monthNames),
      x: leftPad + usableW / 2,
      ts: endTs,
    }];
  }

  // 2 pontos: início e fim
  if (dataLength === 2) {
    return [
      { label: formatXLabel(startTs, selectedDays, monthNames), x: leftPad, ts: startTs },
      { label: formatXLabel(endTs, selectedDays, monthNames), x: width - rightPad, ts: endTs },
    ];
  }

  // 3+ pontos: 4 a 6 labels uniformemente distribuídos (best practice)
  const count = Math.min(MAX_X_TICKS, Math.max(4, Math.min(dataLength, 6)));
  return Array.from({ length: count }, (_, i) => {
    const frac = count === 1 ? 0 : i / (count - 1);
    const ts = startTs + spanMs * frac;
    const x = leftPad + (usableW * i) / (count - 1);
    return { label: formatXLabel(ts, selectedDays, monthNames), x, ts };
  });
};

/** Infere período em dias a partir do span dos dados (para gráficos sem filtro explícito) */
const inferSelectedDays = (startTs: number, endTs: number): number => {
  const days = Math.ceil((endTs - startTs) / 86400000);
  if (days <= 7) return 7;
  if (days <= 30) return 30;
  if (days <= 90) return 90;
  return 365;
};

/** Ticks estáticos dos eixos (valores e datas) */
const ChartAxisTicks: React.FC<{
  width: number;
  height: number;
  data: Array<{ timestamp: number; value: number }>;
  /** Número real de pontos (1 ou 2 → mostra 1 ou 2 labels; 3+ → até 6) */
  originalPointCount: number;
  selectedDays?: number;
  monthNames: string[];
}> = ({ width, height, data, originalPointCount, selectedDays, monthNames }) => {
  if (!data || data.length < 1) return null;
  const startTs = data[0].timestamp;
  const endTs = data[data.length - 1].timestamp;
  const effectiveDays = selectedDays ?? inferSelectedDays(startTs, endTs);
  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const pad = (maxVal - minVal) * 0.05 || 1;
  const range = maxVal - minVal + pad * 2;
  const ticksY = [0, 1, 2, 3].map((i) => {
    const frac = i / 3;
    const val = minVal - pad + range * frac;
    const y = height - 36 - (height - 56) * frac;
    return { val, y };
  });
  const ticksX = getXTicksForPeriod(startTs, endTs, width, effectiveDays, originalPointCount, monthNames);
  const xFontSize = 10;
  return (
    <G>
      {ticksY.map(({ val, y }, i) => (
        <SvgText
          key={`y-${i}`}
          x={10}
          y={y}
          fill={CHART_COLORS.label}
          fontSize={10}
          fontFamily="Rajdhani-Medium"
          opacity={0.7}
          textAnchor="start"
        >
          {formatAxisValue(val)}
        </SvgText>
      ))}
      {ticksX.map(({ label, x }, i) => (
        <SvgText
          key={`x-${i}`}
          x={x}
          y={height - 8}
          fill={CHART_COLORS.label}
          fontSize={xFontSize}
          fontFamily="Rajdhani-Regular"
          opacity={0.6}
          textAnchor="middle"
        >
          {label}
        </SvgText>
      ))}
    </G>
  );
};

export interface ChartPoint {
  value: number;
  date?: string;
}

interface InteractiveChartProps {
  data: ChartPoint[];
  width: number;
  height: number;
  /** Período selecionado (7, 30, 90, 365) — define a densidade dos ticks no eixo X */
  selectedDays?: number;
  lineColorRgba?: string;
}

function toTimestamp(dateStr?: string, index?: number): number {
  if (dateStr) {
    const ms = new Date(dateStr).getTime();
    if (!isNaN(ms)) return ms;
  }
  return Date.now() - (index ?? 0) * 86_400_000;
}

// Worklet obrigatório: LineChart.PriceText usa format dentro de useDerivedValue (UI thread)
// Ver: https://docs.swmansion.com/react-native-worklets/docs/guides/troubleshooting#tried-to-synchronously-call-a-non-worklet-function-on-the-ui-thread
const formatPriceWorklet = ({ value }: { value: string }) => {
  'worklet';
  const n = Number(value);
  if (isNaN(n)) return '$0';
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
};

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  width,
  height,
  selectedDays = 30,
}) => {
  const { t } = useLanguage();
  const monthNames = useMemo(() => [
    t('monthJan'), t('monthFeb'), t('monthMar'), t('monthApr'), t('monthMay'), t('monthJun'),
    t('monthJul'), t('monthAug'), t('monthSep'), t('monthOct'), t('monthNov'), t('monthDec'),
  ], [t]);

  const wagmiData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const points = data
      .map((p, i) => ({
        timestamp: toTimestamp(p.date, data.length - 1 - i),
        value: typeof p.value === 'number' && p.value > 0 ? p.value : 0,
      }))
      .filter((p) => p.value > 0);

    if (points.length < 2) {
      if (points.length === 1) {
        return [
          { timestamp: points[0].timestamp - 86_400_000, value: points[0].value },
          points[0],
        ];
      }
      return [];
    }

    return points;
  }, [data]);

  if (wagmiData.length < 2) {
    return (
      <View style={[styles.empty, { width, height, backgroundColor: CHART_COLORS.background }]}>
        <Text style={styles.emptyText}>{t('notEnoughData')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.chartCard, { width, height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <ChartGrid width={width} height={height} />
        <ChartAxisTicks
          width={width}
          height={height}
          data={wagmiData}
          originalPointCount={data.length}
          selectedDays={selectedDays}
          monthNames={monthNames}
        />
      </Svg>
      <LineChart.Provider data={wagmiData}>
        <LineChart width={width} height={height}>
          <LineChart.Path color={CHART_COLORS.line} width={1}>
            <LineChart.Gradient color={CHART_COLORS.lineFaded} />
          </LineChart.Path>

          <LineChart.CursorCrosshair color={CHART_COLORS.line}>
            <LineChart.Tooltip
              textStyle={styles.tooltipText}
              style={styles.tooltip}
            />
            <LineChart.Tooltip position="bottom">
              <LineChart.DatetimeText
                style={styles.tooltipDate}
                options={{ day: 'numeric', month: 'short' }}
              />
            </LineChart.Tooltip>
          </LineChart.CursorCrosshair>
        </LineChart>

        <View style={styles.priceRow}>
          <LineChart.PriceText
            format={formatPriceWorklet}
            style={styles.priceText}
          />
          <LineChart.DatetimeText
            style={styles.dateText}
            options={{ day: 'numeric', month: 'short', year: 'numeric' }}
          />
        </View>
      </LineChart.Provider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: CHART_COLORS.background,
    overflow: 'hidden',
  },
  chartCard: {
    borderWidth: 1,
    borderColor: CHART_COLORS.border,
    borderRadius: 16,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
    fontFamily: 'Rajdhani-Regular',
  },
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderWidth: 1,
    borderColor: CHART_COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tooltipText: {
    color: CHART_COLORS.line,
    fontSize: 14,
    fontFamily: 'Rajdhani-SemiBold',
    fontWeight: '600',
  },
  tooltipDate: {
    color: 'rgba(156, 163, 175, 0.7)',
    fontSize: 11,
    fontFamily: 'Rajdhani-Regular',
    textAlign: 'center',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 4,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  priceText: {
    color: CHART_COLORS.line,
    fontSize: 12,
    fontFamily: 'Rajdhani-Medium',
  },
  dateText: {
    color: 'rgba(156, 163, 175, 0.5)',
    fontSize: 11,
    fontFamily: 'Rajdhani-Regular',
  },
});
