import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-wagmi-charts';

export interface ChartPoint {
  value: number;
  date?: string;
}

interface InteractiveChartProps {
  data: ChartPoint[];
  width: number;
  height: number;
  lineColorRgba?: string;
}

const GOLD = '#d4c291';
const GOLD_FADED = 'rgba(212, 194, 145, 0.25)';
const BG = '#1c1b19';

function toTimestamp(dateStr?: string, index?: number): number {
  if (dateStr) {
    const ms = new Date(dateStr).getTime();
    if (!isNaN(ms)) return ms;
  }
  return Date.now() - (index ?? 0) * 86_400_000;
}

function formatCurrencyLabel(v: string) {
  const n = Number(v);
  if (isNaN(n)) return '$0';
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  width,
  height,
}) => {
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
      <View style={[styles.empty, { width, height, backgroundColor: BG }]}>
        <Text style={styles.emptyText}>Not enough data</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <LineChart.Provider data={wagmiData}>
        <LineChart width={width} height={height}>
          <LineChart.Path color={GOLD} width={2}>
            <LineChart.Gradient color={GOLD_FADED} />
          </LineChart.Path>

          <LineChart.CursorCrosshair color={GOLD}>
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
            format={({ value }) => formatCurrencyLabel(value)}
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
    backgroundColor: BG,
    overflow: 'hidden',
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
    backgroundColor: 'rgba(28, 27, 25, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tooltipText: {
    color: GOLD,
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
    color: GOLD,
    fontSize: 12,
    fontFamily: 'Rajdhani-Medium',
  },
  dateText: {
    color: 'rgba(156, 163, 175, 0.5)',
    fontSize: 11,
    fontFamily: 'Rajdhani-Regular',
  },
});
