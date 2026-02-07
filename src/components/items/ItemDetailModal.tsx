import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import FastImage from 'react-native-fast-image';
import Svg, { Polygon, Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { colors, spacing, typography } from '@theme';
import { formatCurrency } from '@utils/currency';
import { getRarityColor } from '@utils/rarity';
import { getItemHistory } from '@services/prices';
import { useAuth } from '@hooks/useAuth';
import type { Item } from '@types/item';
import type { ItemHistoryResponse } from '@services/prices';

// Helper para garantir valores seguros
const safeTypography = typography || {
  fonts: {
    secondaryMedium: 'Rajdhani-Medium',
    mono: 'JetBrainsMono-Regular',
    primarySemiBold: 'Orbitron-SemiBold',
    primaryBold: 'Orbitron-Bold',
  },
  weights: {
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
};
const safeColors = colors || {
  primary: '#FFD700',
  error: '#EF4444',
  success: '#10B981',
};
const safeSpacing = spacing || {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

interface ItemDetailModalProps {
  visible: boolean;
  item: Item | null;
  onClose: () => void;
}

const CHART_PERIODS = [
  { days: 7, label: '7D' },
  { days: 30, label: '30D' },
  { days: 365, label: 'TUDO' },
];

/**
 * Get wear condition from float value
 */
const getWearCondition = (floatValue: number): string => {
  if (floatValue < 0.07) return 'Factory New';
  if (floatValue < 0.15) return 'Minimal Wear';
  if (floatValue < 0.38) return 'Field-Tested';
  if (floatValue < 0.45) return 'Well-Worn';
  return 'Battle-Scarred';
};

/**
 * Format Asset ID for display
 */
const formatAssetId = (assetId: string | undefined): string => {
  if (!assetId) return '-';
  const idStr = String(assetId);
  if (idStr.length > 10) {
    return `${idStr.substring(0, 6)}...${idStr.substring(idStr.length - 4)}`;
  }
  return idStr;
};

/**
 * Calculate summary statistics from chart points
 */
const calculateSummary = (chartPoints: Array<{ date: string; price: number }>) => {
  if (!chartPoints || chartPoints.length === 0) {
    return null;
  }

  // Garantir que todos os preços são números válidos
  const prices = chartPoints
    .map((p) => {
      const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
      return isNaN(price) ? null : price;
    })
    .filter((p): p is number => p !== null && p > 0);
    
  if (prices.length === 0) {
    return null;
  }

  const startPrice = prices[0] || 0;
  const endPrice = prices[prices.length - 1] || 0;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const change = endPrice - startPrice;
  const changePercent = startPrice > 0 ? (change / startPrice) * 100 : 0;

  return {
    start_price: Number(startPrice.toFixed(2)),
    end_price: Number(endPrice.toFixed(2)),
    min_price: Number(minPrice.toFixed(2)),
    max_price: Number(maxPrice.toFixed(2)),
    avg_price: Number(avgPrice.toFixed(2)),
    price_change: Number(change.toFixed(2)),
    price_change_percent: Number(changePercent.toFixed(2)),
  };
};

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

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  visible,
  item,
  onClose,
}) => {
  const { token } = useAuth();
  const [selectedDays, setSelectedDays] = useState(30);
  const [history, setHistory] = useState<ItemHistoryResponse | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Usar ref para evitar dependências circulares no useCallback
  const fullHistoryRef = useRef<ItemHistoryResponse | null>(null);

  // Resetar ao fechar modal
  useEffect(() => {
    if (!visible) {
      setHistory(null);
      setHistoryError(null);
      setIsLoadingHistory(false);
      fullHistoryRef.current = null;
    }
  }, [visible]);

  // Carregar histórico quando período ou item mudar
  useEffect(() => {
    if (!visible || !item || !token) {
      if (!visible) {
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
        // Para 7D, sempre usar dados de 30D e filtrar no frontend
        if (selectedDays === 7) {
          let sourceData = fullHistoryRef.current;

          // Se não temos cache ou cache está vazio, carregar 30D
          if (!sourceData || !sourceData.chart || sourceData.chart.length === 0) {
            console.log('[ITEM_MODAL] Carregando dados de 30D para filtrar 7D...');
            sourceData = await getItemHistory(item.market_hash_name, 30, token);
            if (sourceData && sourceData.chart && sourceData.chart.length > 0) {
              fullHistoryRef.current = sourceData;
              console.log('[ITEM_MODAL] Dados de 30D carregados:', sourceData.chart.length, 'pontos');
            }
          } else {
            console.log('[ITEM_MODAL] Usando cache de 30D para filtrar 7D');
          }

          if (sourceData && sourceData.chart && sourceData.chart.length > 0) {
            // Encontrar a última data disponível no dataset
            const lastPoint = sourceData.chart[sourceData.chart.length - 1];
            if (!lastPoint || !lastPoint.date) {
              console.warn('[ITEM_MODAL] Não foi possível encontrar última data no dataset');
              setHistory({
                market_hash_name: item.market_hash_name,
                chart: [],
                summary: null,
                analysis: null,
              });
              return;
            }

            // Pegar a última data no formato "YYYY-MM-DD"
            const lastDateStr = typeof lastPoint.date === 'string' 
              ? lastPoint.date.trim().split('T')[0]
              : null;
            
            if (!lastDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(lastDateStr)) {
              console.warn('[ITEM_MODAL] Última data em formato inválido:', lastPoint.date);
              setHistory({
                market_hash_name: item.market_hash_name,
                chart: [],
                summary: null,
                analysis: null,
              });
              return;
            }

            // Calcular data de 7 dias antes da última data disponível (não de hoje!)
            // Isso garante que sempre mostramos os últimos 7 dias de DADOS disponíveis
            const lastDate = new Date(lastDateStr + 'T00:00:00Z');
            const sevenDaysBeforeLast = new Date(lastDate.getTime() - 6 * 24 * 60 * 60 * 1000); // 6 dias (incluindo o último = 7 dias)
            sevenDaysBeforeLast.setUTCHours(0, 0, 0, 0);
            const sevenDaysBeforeLastStr = sevenDaysBeforeLast.toISOString().split('T')[0];

            console.log('[ITEM_MODAL] Última data disponível:', lastDateStr);
            console.log('[ITEM_MODAL] Filtrando dados de', sevenDaysBeforeLastStr, 'até', lastDateStr);
            console.log('[ITEM_MODAL] Total de pontos no source:', sourceData.chart.length);
            console.log('[ITEM_MODAL] Primeiros 3 pontos:', sourceData.chart.slice(0, 3).map(p => ({ date: p.date, price: p.price })));
            console.log('[ITEM_MODAL] Últimos 3 pontos:', sourceData.chart.slice(-3).map(p => ({ date: p.date, price: p.price })));

            // Filtrar últimos 7 dias a partir da última data disponível
            // A API retorna datas no formato "YYYY-MM-DD", então podemos comparar strings diretamente
            const filtered7Days = sourceData.chart.filter((point) => {
              if (!point || !point.date) {
                return false;
              }
              
              // Se a data já está no formato "YYYY-MM-DD", comparar diretamente como string
              const pointDateStr = typeof point.date === 'string' 
                ? point.date.trim().split('T')[0]
                : null;
              
              if (!pointDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(pointDateStr)) {
                return false;
              }
              
              // Incluir pontos entre sevenDaysBeforeLastStr (inclusive) e lastDateStr (inclusive)
              const isWithin7Days = pointDateStr >= sevenDaysBeforeLastStr && pointDateStr <= lastDateStr;
              
              return isWithin7Days;
            });

            console.log('[ITEM_MODAL] Pontos filtrados para 7D:', filtered7Days.length);
            if (filtered7Days.length > 0) {
              console.log('[ITEM_MODAL] Exemplo de pontos filtrados:', filtered7Days.slice(0, 3).map(p => ({ date: p.date, price: p.price })));
            } else {
              console.warn('[ITEM_MODAL] Nenhum ponto passou no filtro. Verificando datas...');
              if (sourceData.chart.length > 0) {
                const firstDate = sourceData.chart[0]?.date;
                const lastDate = sourceData.chart[sourceData.chart.length - 1]?.date;
                console.warn('[ITEM_MODAL] Primeira data no dataset:', firstDate);
                console.warn('[ITEM_MODAL] Última data no dataset:', lastDate);
                const lastDateStr = sourceData.chart.length > 0 
                  ? (typeof sourceData.chart[sourceData.chart.length - 1]?.date === 'string' 
                      ? sourceData.chart[sourceData.chart.length - 1].date.trim().split('T')[0] 
                      : null)
                  : null;
                console.warn('[ITEM_MODAL] Data de corte (7 dias atrás da última data):', sevenDaysBeforeLastStr);
                console.warn('[ITEM_MODAL] Comparação:', { lastDate: lastDateStr, sevenDaysBeforeLastStr, isAfter: lastDateStr && lastDateStr >= sevenDaysBeforeLastStr });
              }
            }

            if (filtered7Days.length > 0) {
              // Garantir que os preços são números válidos
              const prices = filtered7Days
                .map((p) => {
                  const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
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
                
                console.log('[ITEM_MODAL] Dados de 7D processados:', {
                  chart_points: filtered7Days.length,
                  summary: calculatedSummary,
                });
              } else {
                console.warn('[ITEM_MODAL] Nenhum preço válido após filtrar 7D');
                setHistory({
                  market_hash_name: item.market_hash_name,
                  chart: [],
                  summary: null,
                  analysis: null,
                });
              }
            } else {
              console.warn('[ITEM_MODAL] Nenhum ponto encontrado nos últimos 7 dias');
              setHistory({
                market_hash_name: item.market_hash_name,
                chart: [],
                summary: null,
                analysis: null,
              });
            }
          } else {
            console.warn('[ITEM_MODAL] Não foi possível obter dados de 30D para filtrar 7D');
            setHistory({
              market_hash_name: item.market_hash_name,
              chart: [],
              summary: null,
              analysis: null,
            });
          }
        } else {
          // Para 30D ou ALL, carregar diretamente
          const data = await getItemHistory(item.market_hash_name, selectedDays, token);

          if (cancelled) return;

          if (data && data.chart && data.chart.length > 0) {
            // Calcular summary se não vier do backend ou se estiver incompleto
            let finalSummary = data.summary;
            
            // Verificar se o summary está completo (deve ter min_price, max_price, avg_price)
            if (!finalSummary || finalSummary.min_price === undefined || finalSummary.max_price === undefined || finalSummary.avg_price === undefined) {
              console.log('[ITEM_MODAL] Summary incompleto do backend, calculando localmente...', finalSummary);
              finalSummary = calculateSummary(data.chart);
            } else {
              // Garantir que os valores são números (não strings)
              finalSummary = {
                start_price: typeof finalSummary.start_price === 'string' ? parseFloat(finalSummary.start_price) : finalSummary.start_price,
                end_price: typeof finalSummary.end_price === 'string' ? parseFloat(finalSummary.end_price) : finalSummary.end_price,
                min_price: typeof finalSummary.min_price === 'string' ? parseFloat(finalSummary.min_price) : finalSummary.min_price,
                max_price: typeof finalSummary.max_price === 'string' ? parseFloat(finalSummary.max_price) : finalSummary.max_price,
                avg_price: typeof finalSummary.avg_price === 'string' ? parseFloat(finalSummary.avg_price) : finalSummary.avg_price,
                price_change: typeof finalSummary.price_change === 'string' ? parseFloat(finalSummary.price_change) : (finalSummary.price_change || 0),
                price_change_percent: typeof finalSummary.price_change_percent === 'string' ? parseFloat(finalSummary.price_change_percent) : (finalSummary.price_change_percent || 0),
              };
              console.log('[ITEM_MODAL] Summary recebido do backend (normalizado):', finalSummary);
            }
            
            const historyData = {
              ...data,
              summary: finalSummary,
            };

            if (selectedDays >= 30) {
              fullHistoryRef.current = historyData;
            }
            setHistory(historyData);
          } else {
            setHistory(data || {
              market_hash_name: item.market_hash_name,
              chart: [],
              summary: null,
              analysis: null,
            });
          }
        }
      } catch (error) {
        if (cancelled) return;
        console.error('[ITEM_MODAL] Erro ao carregar histórico:', error);
        setHistoryError('Error loading price history');
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
  }, [visible, item?.market_hash_name, selectedDays, token]);

  const chartData = useMemo(() => {
    if (!history || !history.chart || !Array.isArray(history.chart) || history.chart.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [] }],
      };
    }

    try {
      const maxPoints = 30;
      let finalData = history.chart;

      if (history.chart.length > maxPoints) {
        const step = Math.max(1, Math.floor(history.chart.length / maxPoints));
        const filtered = history.chart.filter((_, index) => index % step === 0);
        finalData = filtered.length > maxPoints ? filtered.slice(-maxPoints) : filtered;
      }

      const processedData: Array<{ label: string; value: number }> = finalData.map((point, index) => {
        let label = '';
        if (index === 0 || index === finalData.length - 1) {
          try {
            if (point && point.date) {
              const date = new Date(point.date);
              if (!isNaN(date.getTime())) {
                label = `${date.getDate()}/${date.getMonth() + 1}`;
              }
            }
          } catch {
            label = '';
          }
        }

        let value = 0;
        if (point && point.price !== null && point.price !== undefined) {
          const price = typeof point.price === 'number' ? point.price : Number(point.price);
          value = isNaN(price) || price < 0 ? 0 : price;
        }

        return { label, value };
      });

      const labels = processedData.map((item) => item.label);
      const data = processedData.map((item) => item.value);

      const validData = data.filter((val) => val > 0);
      if (validData.length === 0) {
        return {
          labels: [],
          datasets: [{ data: [] }],
        };
      }

      return {
        labels,
        datasets: [
          {
            data,
            color: (opacity = 1) => `rgba(212, 194, 145, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      };
    } catch (error) {
      console.error('[ITEM_MODAL] Erro ao processar dados do gráfico:', error);
      return {
        labels: [],
        datasets: [{ data: [] }],
      };
    }
  }, [history]);

  const screenWidth = Dimensions.get('window').width;
  const rarityColor = item ? getRarityColor(item.rarity_tag || item.rarity || item.market_hash_name) : safeColors.primary;

  if (!item) return null;

  const { weapon, skin, condition } = parseItemName(item.market_hash_name || '');
  const floatValue = item.float_value ?? 0;
  const floatPercentage = Math.min(100, Math.max(0, (floatValue / 1.0) * 100));
  const wearCondition = floatValue > 0 ? getWearCondition(floatValue) : null;

  const hasValidChartData = chartData && chartData.datasets && chartData.datasets[0] && chartData.datasets[0].data.length > 0;
  // Dimensões idênticas ao PortfolioChart do Dashboard
  const cardHeight = 280; // Altura fixa do card (igual ao Dashboard)
  const chartHeight = cardHeight; // Altura do gráfico = altura total do card
  const containerPadding = safeSpacing.md * 2; // Padding do container pai (esquerda + direita)
  const chartWidth = screenWidth - containerPadding; // Largura = tela - padding lateral

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        {/* Header com botão fechar */}
        <View style={[styles.header, { paddingTop: statusBarHeight + safeSpacing.md }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
            <Text style={styles.closeButtonText}>FECHAR</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Seção 1: Header Compacto e Técnico */}
          <View style={styles.headerCompact}>
            {/* LADO ESQUERDO: Identidade */}
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>
                <Text style={styles.headerWeaponName}>{weapon}</Text>
                {skin && (
                  <Text>
                    <Text style={styles.headerSeparator}> | </Text>
                    <Text style={styles.headerSkinName}>{skin}</Text>
                  </Text>
                )}
              </Text>
              {condition && (
                <Text style={styles.headerCondition}>{condition.toUpperCase()}</Text>
              )}
            </View>

            {/* LADO DIREITO: Financeiro */}
            {(history?.summary || item.current_price || item.price) && (
              <View style={styles.headerRight}>
                <Text style={styles.headerPrice}>
                  {formatCurrency(
                    history?.summary?.end_price || item.current_price || item.price || 0
                  )}
                </Text>
                {history?.summary?.price_change_percent !== undefined && (
                  <View
                    style={[
                      styles.headerTrendBadge,
                      history.summary.price_change_percent >= 0
                        ? styles.headerTrendPositive
                        : styles.headerTrendNegative,
                    ]}
                  >
                    <Text
                      style={[
                        styles.headerTrendText,
                        history.summary.price_change_percent >= 0
                          ? styles.headerTrendTextPositive
                          : styles.headerTrendTextNegative,
                      ]}
                    >
                      {history.summary.price_change_percent >= 0 ? '+' : ''}
                      {history.summary.price_change_percent.toFixed(2)}%
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

            {/* Imagem Centralizada */}
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

            {/* Asset ID e Pattern Seed */}
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

          {/* Seção 2: Barra de Float */}
          {floatValue > 0 && (
            <View style={styles.floatSection}>
              {/* Header da Seção Float */}
              <View style={styles.floatHeader}>
                <Text style={styles.floatSectionTitle}>ITEM CONDITION</Text>
              </View>
              
              <View style={styles.floatBarContainer}>
                {/* Barra de Gradiente Multicolorido usando SVG com sombra e bordas refinadas */}
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
                  
                  {/* Linha vertical indicadora com efeito glow */}
                  <View 
                    style={[
                      styles.floatIndicatorLine, 
                      { left: `${floatPercentage}%` }
                    ]}
                  >
                    <View style={styles.floatIndicatorGlow} />
                    <View style={styles.floatIndicatorCore} />
                  </View>

                  {/* Marcador Dourado Refinado (Diamante) */}
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
                      {/* Linha central para mais definição */}
                      <Polygon
                        points="10,2 18,8 10,14 2,8"
                        fill="rgba(255, 255, 255, 0.15)"
                      />
                    </Svg>
                  </View>
                </View>

                {/* Marcadores de Condição (opcional - muito sutil) */}
                <View style={styles.floatConditionMarkers}>
                  <Text style={styles.floatConditionMarker}>FN</Text>
                  <Text style={styles.floatConditionMarker}>MW</Text>
                  <Text style={styles.floatConditionMarker}>FT</Text>
                  <Text style={styles.floatConditionMarker}>WW</Text>
                  <Text style={styles.floatConditionMarker}>BS</Text>
                </View>
              </View>

              {/* Labels da Barra */}
              <View style={styles.floatLabels}>
                <View style={styles.floatValueContainer}>
                  <Text style={styles.floatLabel}>Float Value</Text>
                  <Text style={styles.floatValueText}>{floatValue.toFixed(6)}</Text>
                </View>
                {wearCondition && (
                  <View style={styles.floatWearContainer}>
                    <Text style={styles.floatWearLabel}>Desgaste</Text>
                    <Text style={styles.floatWearText}>{wearCondition}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Seção 3: Histórico de Preço (Mini Chart) */}
          <View style={styles.chartSection}>
            <View style={styles.chartHeader}>
              <Text style={styles.sectionTitle}>History</Text>
              <View style={styles.chartFilters}>
                {CHART_PERIODS.map((period) => (
                  <TouchableOpacity
                    key={period.days}
                    style={[
                      styles.filterButton,
                      selectedDays === period.days && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedDays(period.days)}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        selectedDays === period.days && styles.filterTextActive,
                      ]}
                    >
                      {period.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Chart Card - O gráfico É o card (flutua diretamente) - Estilo idêntico ao Dashboard */}
            <View style={[styles.chartCard, { height: cardHeight }]}>
              {isLoadingHistory ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#d4c291" />
                </View>
              ) : historyError ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{historyError}</Text>
                </View>
              ) : !hasValidChartData ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No history available</Text>
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
          </View>

          {/* Seção 4: Cards de Estatísticas (Grid) */}
          {history?.summary && (
            <View style={styles.statsSection}>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Min</Text>
                  <Text style={styles.statValue}>
                    {formatCurrency(history.summary.min_price)}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Max</Text>
                  <Text style={styles.statValue}>
                    {formatCurrency(history.summary.max_price)}
                  </Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Avg</Text>
                  <Text style={styles.statValue}>
                    {formatCurrency(history.summary.avg_price)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Seção 5: Análise Técnica */}
          {history?.analysis && (
            <View style={styles.analysisSection}>
              <Text style={styles.analysisSectionTitle}>Technical Analysis</Text>

              <View style={styles.analysisContainer}>
                {/* LINHA 1: RSI e Volatilidade (2 Colunas) */}
                <View style={styles.analysisTopRow}>
                  {history.analysis.rsi !== undefined && (
                    <View style={styles.analysisCardSmall}>
                      <Text style={styles.analysisLabel}>RSI</Text>
                      <View style={styles.rsiContainer}>
                        <View style={styles.rsiBar}>
                          <View
                            style={[
                              styles.rsiBarFill,
                              {
                                width: `${Math.min(100, Math.max(0, history.analysis.rsi))}%`,
                                backgroundColor:
                                  history.analysis.rsi > 70
                                    ? safeColors.error
                                    : history.analysis.rsi < 30
                                    ? safeColors.success
                                    : '#d4c291',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.analysisValue}>{history.analysis.rsi.toFixed(1)}</Text>
                      </View>
                      <Text style={styles.analysisStatus}>
                        {history.analysis.rsi_state === 'Oversold'
                          ? 'Oversold'
                          : history.analysis.rsi_state === 'Overbought'
                          ? 'Overbought'
                          : 'Neutral'}
                      </Text>
                    </View>
                  )}

                  {history.analysis.volatility_value !== undefined && (
                    <View style={styles.analysisCardSmall}>
                      <Text style={styles.analysisLabel}>Volatility</Text>
                      <View style={styles.volatilityContainer}>
                        <View style={styles.volatilityBar}>
                          <View
                            style={[
                              styles.volatilityBarFill,
                              {
                                width: `${Math.min(100, Math.max(0, (history.analysis.volatility_value / 10) * 100))}%`,
                                backgroundColor:
                                  history.analysis.volatility === 'High'
                                    ? safeColors.error
                                    : history.analysis.volatility === 'Medium'
                                    ? '#d4c291'
                                    : safeColors.success,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.analysisValue}>
                          {history.analysis.volatility_value.toFixed(1)}%
                        </Text>
                      </View>
                      <Text style={styles.analysisStatus}>
                        {history.analysis.volatility === 'High'
                          ? 'High'
                          : history.analysis.volatility === 'Medium'
                          ? 'Avg'
                          : 'Low'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* LINHA 2: Tendência (Full Width, Layout Horizontal) */}
                {history.summary && history.summary.price_change_percent !== undefined && (
                  <View style={styles.trendCardFullWidth}>
                    <Text style={styles.trendCardLabel}>Overall Trend</Text>
                    <View style={styles.trendCardRight}>
                      <View style={styles.trendCardStatus}>
                        <Text
                          style={[
                            styles.trendCardIcon,
                            {
                              color:
                                history.summary.price_change_percent >= 5
                                  ? '#d4c291'
                                  : history.summary.price_change_percent <= -5
                                  ? '#ef4444'
                                  : '#9ca3af',
                            },
                          ]}
                        >
                          {history.summary.price_change_percent >= 5
                            ? '↗'
                            : history.summary.price_change_percent >= 0
                            ? '→'
                            : history.summary.price_change_percent <= -5
                            ? '↘'
                            : '→'}
                        </Text>
                        <Text style={styles.trendCardStatusText}>
                          {history.summary.price_change_percent >= 5
                            ? 'Alta Forte'
                            : history.summary.price_change_percent >= 0
                            ? 'Alta Leve'
                            : history.summary.price_change_percent <= -5
                            ? 'Queda Forte'
                            : 'Queda Leve'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.trendCardBadge,
                          {
                            backgroundColor:
                              history.summary.price_change_percent >= 0
                                ? 'rgba(16, 185, 129, 0.1)'
                                : 'rgba(239, 68, 68, 0.1)',
                            borderColor:
                              history.summary.price_change_percent >= 0
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
                                history.summary.price_change_percent >= 0
                                  ? '#10b981'
                                  : '#ef4444',
                            },
                          ]}
                        >
                          {history.summary.price_change_percent >= 0 ? '+' : ''}
                          {history.summary.price_change_percent.toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Fundo escuro sólido
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: safeSpacing.md,
    paddingBottom: safeSpacing.sm,
    zIndex: 10, // Garantir que fica acima do conteúdo
  },
  closeButton: {
    paddingVertical: safeSpacing.xs || 4,
    paddingHorizontal: safeSpacing.md || 16,
  },
  closeButtonText: {
    fontSize: safeTypography.sizes.xs || 11,
    fontFamily: safeTypography.fonts.secondarySemiBold || typography?.fonts?.secondarySemiBold || 'Rajdhani-SemiBold',
    color: safeColors.textSecondary || colors?.textSecondary || '#B8BCC8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
  // Header Compacto e Técnico
  headerCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: safeSpacing.lg, // px-5
    paddingTop: safeSpacing.md, // mt-4
    paddingBottom: safeSpacing.md, // mb-4
    marginBottom: safeSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)', // border-white/5
  },
  // LADO ESQUERDO: Identidade
  headerLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18, // text-xl
    fontFamily: safeTypography.fonts.primaryBold,
    fontWeight: safeTypography.weights.bold,
    lineHeight: 22, // leading-tight
  },
  headerWeaponName: {
    color: '#FFFFFF', // Branco para a arma
  },
  headerSeparator: {
    color: '#d4c291', // Dourado para o separador
  },
  headerSkinName: {
    color: '#d4c291', // Tactical Gold para a skin
  },
  headerCondition: {
    fontSize: 10, // text-[10px]
    fontFamily: safeTypography.fonts.secondaryMedium,
    color: '#6B7280', // gray-500
    marginTop: 2, // mt-0.5
    letterSpacing: 3.2, // tracking-[0.2em] = 0.2 * 16px = 3.2px
    fontWeight: safeTypography.weights.medium,
    textTransform: 'uppercase',
  },
  // LADO DIREITO: Financeiro
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: safeSpacing.sm, // gap-3
    marginLeft: safeSpacing.md,
  },
  headerPrice: {
    fontSize: 20, // text-xl
    fontFamily: safeTypography.fonts.mono || safeTypography.fonts.primaryBold, // Usar mono para tabular-nums effect
    fontWeight: safeTypography.weights.bold,
    color: '#d4c291', // Tactical Gold
  },
  headerTrendBadge: {
    paddingHorizontal: safeSpacing.sm, // px-2
    paddingVertical: safeSpacing.xs, // py-1
    borderRadius: 4,
    borderWidth: 1,
  },
  headerTrendPositive: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(16, 185, 129, 0.2)', // verde sutil
  },
  headerTrendNegative: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(239, 68, 68, 0.2)', // vermelho sutil
  },
  headerTrendText: {
    fontSize: 12, // text-xs
    fontFamily: safeTypography.fonts.primaryBold,
    fontWeight: safeTypography.weights.bold,
  },
  headerTrendTextPositive: {
    color: '#10b981', // green-500
  },
  headerTrendTextNegative: {
    color: '#ef4444', // red-500
  },
  imageContainer: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: safeSpacing.sm,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    maxWidth: 300,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: safeSpacing.sm,
  },
  placeholderText: {
    color: safeColors.textSecondary,
    fontSize: safeTypography.sizes.xxl,
  },
  assetIdRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: safeSpacing.md,
    paddingHorizontal: safeSpacing.md,
  },
  assetIdText: {
    fontSize: 12,
    fontFamily: safeTypography.fonts.mono,
    color: '#FFFFFF',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  assetIdLabelInline: {
    fontSize: 12,
    fontFamily: safeTypography.fonts.secondary,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assetIdValueInline: {
    fontSize: 12,
    fontFamily: safeTypography.fonts.mono,
    color: '#FFFFFF',
    fontWeight: safeTypography.weights.medium,
    letterSpacing: 0.5,
  },
  assetIdSeparator: {
    fontSize: 12,
    fontFamily: safeTypography.fonts.secondary,
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  // Float Bar Section
  floatSection: {
    paddingHorizontal: safeSpacing.lg,
    paddingVertical: safeSpacing.md,
    marginBottom: safeSpacing.md,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.15)',
  },
  floatHeader: {
    marginBottom: safeSpacing.md,
  },
  floatSectionTitle: {
    fontSize: 11,
    fontFamily: safeTypography.fonts.secondaryMedium,
    color: '#d4c291',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  floatBarContainer: {
    position: 'relative',
    marginBottom: safeSpacing.md,
  },
  floatBarWrapper: {
    position: 'relative',
    height: 28,
    marginBottom: safeSpacing.xs + 2,
  },
  floatBar: {
    width: '100%',
    height: 28,
    borderRadius: 6,
  },
  floatIndicatorLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 5,
    transform: [{ translateX: -1 }],
  },
  floatIndicatorGlow: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    left: -1,
    right: -1,
    backgroundColor: '#ffffff',
    opacity: 0.3,
    borderRadius: 1,
  },
  floatIndicatorCore: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 1,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  floatMarker: {
    position: 'absolute',
    top: -8,
    zIndex: 10,
    transform: [{ translateX: -10 }], // Compensar metade da largura (20/2 = 10)
    shadowColor: '#d4c291',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  floatConditionMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: safeSpacing.xs,
  },
  floatConditionMarker: {
    fontSize: 9,
    fontFamily: safeTypography.fonts.secondary,
    color: '#6B7280',
    opacity: 0.5,
    letterSpacing: 0.5,
  },
  floatLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: safeSpacing.lg,
  },
  floatValueContainer: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  floatMiddleContainer: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    justifyContent: 'flex-start',
  },
  floatPatternLabel: {
    fontSize: 10,
    fontFamily: safeTypography.fonts.secondary,
    color: '#6B7280',
    marginBottom: safeSpacing.xs / 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    width: '100%',
  },
  floatPatternText: {
    fontSize: 14,
    fontFamily: safeTypography.fonts.mono,
    color: '#FFFFFF',
    fontWeight: safeTypography.weights.medium,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  floatLabel: {
    fontSize: 10,
    fontFamily: safeTypography.fonts.secondary,
    color: '#6B7280',
    marginBottom: safeSpacing.xs / 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  floatValueText: {
    fontSize: 14,
    fontFamily: safeTypography.fonts.mono,
    color: '#FFFFFF',
    fontWeight: safeTypography.weights.medium,
    letterSpacing: 0.5,
  },
  floatWearContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  floatWearLabel: {
    fontSize: 10,
    fontFamily: safeTypography.fonts.secondary,
    color: '#6B7280',
    marginBottom: safeSpacing.xs / 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  floatWearText: {
    fontSize: 14,
    fontFamily: safeTypography.fonts.secondaryMedium,
    color: '#d4c291',
    fontWeight: safeTypography.weights.semiBold,
    textAlign: 'right',
  },
  // Chart Section
  chartSection: {
    padding: safeSpacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: safeSpacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: safeTypography.fonts.primarySemiBold,
    color: '#d4c291',
    fontWeight: safeTypography.weights.semiBold,
  },
  chartFilters: {
    flexDirection: 'row',
    gap: safeSpacing.xs,
  },
  filterButton: {
    paddingHorizontal: safeSpacing.md,
    paddingVertical: safeSpacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    borderColor: '#d4c291',
    backgroundColor: '#2a2a2a', // Cinza escuro em vez de dourado
  },
  filterText: {
    fontSize: 12,
    fontFamily: safeTypography.fonts.secondaryMedium,
    color: '#9CA3AF',
    fontWeight: safeTypography.weights.medium,
  },
  filterTextActive: {
    color: '#d4c291',
    fontWeight: safeTypography.weights.semiBold,
  },
  chartCard: {
    // O gráfico É o card - estilo aplicado diretamente aqui, sem wrapper adicional
    // Estilo idêntico ao PortfolioChart do Dashboard
    backgroundColor: '#1c1b19', // Tactical dark background
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
  // Stats Section
  statsSection: {
    paddingHorizontal: safeSpacing.lg,
    paddingBottom: safeSpacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: safeSpacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1c1b19',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.1)',
    borderRadius: 12,
    padding: safeSpacing.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: safeTypography.fonts.secondary,
    color: '#6B7280',
    marginBottom: safeSpacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontFamily: safeTypography.fonts.primarySemiBold,
    color: '#d4c291',
    fontWeight: safeTypography.weights.semiBold,
  },
  // Analysis Section
  analysisSection: {
    padding: safeSpacing.lg,
    paddingBottom: safeSpacing.xl,
  },
  analysisSectionTitle: {
    fontSize: 12,
    fontFamily: safeTypography.fonts.primaryBold,
    color: '#d4c291',
    fontWeight: safeTypography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 2, // tracking-wider
    marginBottom: safeSpacing.sm,
  },
  analysisContainer: {
    flexDirection: 'column',
    gap: safeSpacing.sm,
    marginTop: safeSpacing.md,
  },
  analysisTopRow: {
    flexDirection: 'row',
    gap: safeSpacing.sm,
  },
  analysisCardSmall: {
    flex: 1,
    backgroundColor: '#1c1b19',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)',
    borderRadius: 12,
    padding: safeSpacing.sm || 8,
    alignItems: 'center',
  },
  analysisCard: {
    flex: 1,
    backgroundColor: '#1c1b19',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.1)',
    borderRadius: 12,
    padding: safeSpacing.md,
    alignItems: 'center',
  },
  analysisLabel: {
    fontSize: 11,
    fontFamily: safeTypography.fonts.secondary,
    color: '#6B7280',
    marginBottom: safeSpacing.sm,
  },
  analysisValue: {
    fontSize: 18,
    fontFamily: safeTypography.fonts.primarySemiBold,
    color: '#FFFFFF',
    fontWeight: safeTypography.weights.bold,
    marginBottom: safeSpacing.xs,
  },
  analysisStatus: {
    fontSize: 11,
    fontFamily: safeTypography.fonts.secondary,
    color: '#9CA3AF',
  },
  rsiContainer: {
    width: '100%',
    marginBottom: safeSpacing.xs,
  },
  rsiBar: {
    height: 8,
    backgroundColor: '#292524',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: safeSpacing.xs,
  },
  rsiBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Volatilidade Bar (igual ao RSI)
  volatilityContainer: {
    width: '100%',
    marginBottom: safeSpacing.xs,
  },
  volatilityBar: {
    height: 8,
    backgroundColor: '#292524',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: safeSpacing.xs,
  },
  volatilityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Tendência Widget (legado - mantido para compatibilidade)
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: safeSpacing.xs,
    marginBottom: safeSpacing.xs,
  },
  trendIcon: {
    fontSize: 24,
    fontWeight: safeTypography.weights.bold,
  },
  trendText: {
    fontSize: 14,
    fontFamily: safeTypography.fonts.primarySemiBold,
    color: '#FFFFFF',
    fontWeight: safeTypography.weights.semiBold,
  },
  trendValue: {
    fontSize: 16,
    fontFamily: safeTypography.fonts.primaryBold,
    fontWeight: safeTypography.weights.bold,
    marginTop: safeSpacing.xs,
  },
  // Tendência Card Full Width (Novo Layout)
  trendCardFullWidth: {
    backgroundColor: '#1c1b19',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.2)',
    borderRadius: 12,
    paddingHorizontal: safeSpacing.md,
    paddingVertical: safeSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  trendCardLabel: {
    fontSize: 11,
    fontFamily: safeTypography.fonts.secondaryMedium,
    color: '#6B7280',
    fontWeight: safeTypography.weights.medium,
    textTransform: 'uppercase',
  },
  trendCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: safeSpacing.sm,
  },
  trendCardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: safeSpacing.xs,
  },
  trendCardIcon: {
    fontSize: 18,
    fontWeight: safeTypography.weights.bold,
  },
  trendCardStatusText: {
    fontSize: 14,
    fontFamily: safeTypography.fonts.primaryBold,
    color: '#d4c291',
    fontWeight: safeTypography.weights.bold,
  },
  trendCardBadge: {
    paddingHorizontal: safeSpacing.sm,
    paddingVertical: safeSpacing.xs / 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  trendCardBadgeText: {
    fontSize: 12,
    fontFamily: safeTypography.fonts.primaryBold,
    fontWeight: safeTypography.weights.bold,
  },
});
