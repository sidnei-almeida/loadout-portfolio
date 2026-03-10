import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Modal, Platform, StatusBar } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import type { ChartPoint } from '@components/common/InteractiveChart';
import { getItemHistory } from '@services/itemHistory';
import type { Item } from '@types/item';
import type { ItemHistoryResponse } from '@types/prices';
import { logger } from '@utils/logger';
import { useLanguage } from '@contexts/LanguageContext';
import { calculateSummary } from './utils';
import { itemDetailStyles } from './styles';
import { ItemDetailHeader } from './ItemDetailHeader';
import { ItemDetailImage } from './ItemDetailImage';
import { ItemDetailFloatBar } from './ItemDetailFloatBar';
import { ItemDetailChart } from './ItemDetailChart';
import { ItemDetailStats } from './ItemDetailStats';
import { ItemDetailAnalysis } from './ItemDetailAnalysis';

interface ItemDetailModalProps {
  visible: boolean;
  item: Item | null;
  onClose: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  visible,
  item,
  onClose,
}) => {
  const { t } = useLanguage();
  const [selectedDays, setSelectedDays] = useState(30);
  const [history, setHistory] = useState<ItemHistoryResponse | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const fullHistoryRef = useRef<ItemHistoryResponse | null>(null);

  useEffect(() => {
    if (!visible) {
      setHistory(null);
      setHistoryError(null);
      setIsLoadingHistory(false);
      fullHistoryRef.current = null;
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !item || item.is_storage_unit) {
      if (!visible || item?.is_storage_unit) {
        setHistory(null);
        setHistoryError(null);
        setIsLoadingHistory(false);
      }
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setIsLoadingHistory(true);
      setHistoryError(null);

      try {
        if (selectedDays === 7) {
          let sourceData = fullHistoryRef.current;

          if (!sourceData || !sourceData.chart || sourceData.chart.length === 0) {
            logger.log('[ITEM_MODAL] Carregando dados de 30D para filtrar 7D...');
            sourceData = getItemHistory(item.market_hash_name, 30);
            if (sourceData && sourceData.chart && sourceData.chart.length > 0) {
              fullHistoryRef.current = sourceData;
            }
          }

          if (sourceData && sourceData.chart && sourceData.chart.length > 0) {
            const lastPoint = sourceData.chart[sourceData.chart.length - 1];
            if (!lastPoint?.date) {
              setHistory({
                market_hash_name: item.market_hash_name,
                chart: [],
                summary: null,
                analysis: null,
              });
              return;
            }

            const lastDateStr =
              typeof lastPoint.date === 'string'
                ? lastPoint.date.trim().split('T')[0]
                : null;

            if (!lastDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(lastDateStr)) {
              setHistory({
                market_hash_name: item.market_hash_name,
                chart: [],
                summary: null,
                analysis: null,
              });
              return;
            }

            const lastDate = new Date(lastDateStr + 'T00:00:00Z');
            const sevenDaysBeforeLast = new Date(
              lastDate.getTime() - 6 * 24 * 60 * 60 * 1000
            );
            sevenDaysBeforeLast.setUTCHours(0, 0, 0, 0);
            const sevenDaysBeforeLastStr = sevenDaysBeforeLast
              .toISOString()
              .split('T')[0];

            const filtered7Days = sourceData.chart.filter((point) => {
              if (!point?.date) return false;
              const pointDateStr =
                typeof point.date === 'string'
                  ? point.date.trim().split('T')[0]
                  : null;
              if (!pointDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(pointDateStr))
                return false;
              return (
                pointDateStr >= sevenDaysBeforeLastStr &&
                pointDateStr <= lastDateStr
              );
            });

            if (filtered7Days.length > 0) {
              const prices = filtered7Days
                .map((p) => {
                  const price =
                    typeof p.price === 'string' ? parseFloat(p.price) : p.price;
                  return isNaN(price) ? null : price;
                })
                .filter((p): p is number => p !== null && p > 0);

              if (prices.length > 0) {
                const calculatedSummary = calculateSummary(filtered7Days);
                setHistory({
                  market_hash_name: sourceData.market_hash_name,
                  chart: filtered7Days,
                  summary: calculatedSummary,
                  analysis: sourceData.analysis || null,
                });
              } else {
                setHistory({
                  market_hash_name: item.market_hash_name,
                  chart: [],
                  summary: null,
                  analysis: null,
                });
              }
            } else {
              setHistory({
                market_hash_name: item.market_hash_name,
                chart: [],
                summary: null,
                analysis: null,
              });
            }
          } else {
            setHistory({
              market_hash_name: item.market_hash_name,
              chart: [],
              summary: null,
              analysis: null,
            });
          }
        } else {
          const data = getItemHistory(item.market_hash_name, selectedDays);

          if (cancelled) return;

          if (data?.chart?.length) {
            let finalSummary = data.summary;

            if (
              !finalSummary ||
              finalSummary.min_price === undefined ||
              finalSummary.max_price === undefined ||
              finalSummary.avg_price === undefined
            ) {
              finalSummary = calculateSummary(data.chart);
            } else {
              finalSummary = {
                start_price:
                  typeof finalSummary.start_price === 'string'
                    ? parseFloat(finalSummary.start_price)
                    : finalSummary.start_price,
                end_price:
                  typeof finalSummary.end_price === 'string'
                    ? parseFloat(finalSummary.end_price)
                    : finalSummary.end_price,
                min_price:
                  typeof finalSummary.min_price === 'string'
                    ? parseFloat(finalSummary.min_price)
                    : finalSummary.min_price,
                max_price:
                  typeof finalSummary.max_price === 'string'
                    ? parseFloat(finalSummary.max_price)
                    : finalSummary.max_price,
                avg_price:
                  typeof finalSummary.avg_price === 'string'
                    ? parseFloat(finalSummary.avg_price)
                    : finalSummary.avg_price,
                price_change:
                  typeof finalSummary.price_change === 'string'
                    ? parseFloat(finalSummary.price_change)
                    : finalSummary.price_change ?? 0,
                price_change_percent:
                  typeof finalSummary.price_change_percent === 'string'
                    ? parseFloat(finalSummary.price_change_percent)
                    : finalSummary.price_change_percent ?? 0,
              };
            }

            const historyData = { ...data, summary: finalSummary };
            if (selectedDays >= 30) {
              fullHistoryRef.current = historyData;
            }
            setHistory(historyData);
          } else {
            setHistory(
              data || {
                market_hash_name: item.market_hash_name,
                chart: [],
                summary: null,
                analysis: null,
              }
            );
          }
        }
      } catch (error) {
        if (cancelled) return;
        logger.error('[ITEM_MODAL] Erro ao carregar histórico:', error);
        setHistoryError(t('errorLoadingHistory'));
        setHistory(null);
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [visible, item?.market_hash_name, selectedDays, t]);

  const chartPoints: ChartPoint[] = useMemo(() => {
    if (
      !history?.chart ||
      !Array.isArray(history.chart) ||
      history.chart.length === 0
    ) {
      return [];
    }
    try {
      return history.chart
        .map((point) => {
          if (!point) return null;
          const price =
            typeof point.price === 'number' ? point.price : Number(point.price);
          if (isNaN(price) || price <= 0) return null;
          return { value: price, date: point.date } as ChartPoint;
        })
        .filter((p): p is ChartPoint => p !== null);
    } catch (error) {
      logger.error('[ITEM_MODAL] Erro ao processar dados do gráfico:', error);
      return [];
    }
  }, [history]);

  const statusBarHeight =
    Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  if (!item) return null;

  const isStorageUnit = item.is_storage_unit === true;
  const floatValue = item.float_value ?? 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={itemDetailStyles.container}>
        <ItemDetailHeader
          item={item}
          history={history}
          onClose={onClose}
          statusBarHeight={statusBarHeight}
        />

        <ScrollView
          style={itemDetailStyles.content}
          showsVerticalScrollIndicator={false}
        >
          <ItemDetailImage item={item} />

          {!isStorageUnit && floatValue > 0 && (
            <ItemDetailFloatBar floatValue={floatValue} />
          )}

          {!isStorageUnit && (
            <ItemDetailChart
              selectedDays={selectedDays}
              onDaysChange={setSelectedDays}
              chartPoints={chartPoints}
              isLoadingHistory={isLoadingHistory}
              historyError={historyError}
            />
          )}

          {!isStorageUnit && history?.summary && (
            <ItemDetailStats history={history} />
          )}

          {!isStorageUnit && history?.analysis && (
            <ItemDetailAnalysis history={history} />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};
