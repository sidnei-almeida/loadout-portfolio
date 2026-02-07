import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import CookieManager from '@react-native-cookies/cookies';
import { colors, spacing, typography } from '@theme';
import { API_BASE_URL } from '@services/api';
import { saveCookies } from '@services/cookies';
import { extractTokenFromCallbackUrl } from '@services/auth';
import { syncInventory, updatePriceHistoryForInventory } from '@services/inventory';
import { queryClient } from '@services/queryClient';
import { useAuth } from '@hooks/useAuth';

interface SteamLoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (token: string) => Promise<void>;
}

const CALLBACK_URL_SCHEME = 'loadout://auth-callback';

export const SteamLoginModal: React.FC<SteamLoginModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { updatePostLoginSyncStep, setPostLoginSyncing, resetPostLoginSyncSteps } = useAuth();
  const [loginUrl, setLoginUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading state
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Carregar URL de login quando o modal abrir
      const url = `${API_BASE_URL}/auth/login?platform=mobile`;
      setLoginUrl(url);
      setIsLoading(true);
      setPageLoaded(false);
    } else {
      // Reset states when modal closes
      setPageLoaded(false);
      setIsLoading(true);
    }
  }, [visible]);

  // Pulse animation for loading text
  useEffect(() => {
    if (isLoading && !pageLoaded) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [isLoading, pageLoaded]);

  /**
   * Extrai o token JWT da URL de callback
   * Formato esperado: loadout://auth-callback?token=JWT_TOKEN
   */
  const extractTokenFromCallbackUrl = (url: string): string | null => {
    try {
      // Remover o scheme para poder usar URL
      const urlWithoutScheme = url.replace(`${CALLBACK_URL_SCHEME}?`, 'http://dummy?');
      const parsedUrl = new URL(urlWithoutScheme);
      const token = parsedUrl.searchParams.get('token');
      return token;
    } catch (error) {
      console.error('[AUTH] Erro ao extrair token da URL:', error);
      // Fallback: tentar regex
      const match = url.match(/[?&]token=([^&]+)/);
      return match ? match[1] : null;
    }
  };

  const handleNavigationStateChange = async (navState: any) => {
    const currentUrl = navState.url;

    console.log('[AUTH] Navegação:', currentUrl);

    // Check if page finished loading (not loading anymore)
    if (!navState.loading && currentUrl && !currentUrl.includes('loadout://')) {
      // Page has loaded (Steam login page is visible)
      setPageLoaded(true);
      setIsLoading(false);
    }

    // Verificar se é o callback com token
    if (currentUrl.includes('loadout://auth-callback') || currentUrl.startsWith(CALLBACK_URL_SCHEME)) {
      setIsProcessing(true);

      try {
        const token = extractTokenFromCallbackUrl(currentUrl);

        if (token) {
          console.log('[AUTH] Token extraído do callback:', token);
          
          // INICIAR sincronização IMEDIATAMENTE - ANTES de qualquer coisa
          // Isso garante que o loading apareça assim que o usuário volta para o app
          console.log('[AUTH] ⚡ Iniciando sincronização IMEDIATAMENTE (antes de fechar modal)...');
          setPostLoginSyncing(true);
          resetPostLoginSyncSteps();

          // Tentar capturar e salvar cookies também (se possível)
          try {
            const cookies = await CookieManager.get('https://steamcommunity.com', true);
            const sessionId = (cookies as any).sessionid?.value || (cookies as any).sessionid;
            const steamLoginSecure = (cookies as any).steamLoginSecure?.value || (cookies as any).steamLoginSecure;

            if (sessionId && steamLoginSecure) {
              console.log('[AUTH] Cookies capturados durante login, enviando para o backend...');
              
              // Salvar cookies no backend imediatamente
              const saveResult = await saveCookies(sessionId, steamLoginSecure, token);
              
              if (saveResult.success) {
                console.log('[AUTH] ✅ Cookies salvos no backend com sucesso!', saveResult.message);
              } else {
                console.warn('[AUTH] ⚠️ Não foi possível salvar cookies no backend:', saveResult.message);
                // Não é crítico, pode tentar capturar depois via CookieCaptureModal
              }
            } else {
              console.warn('[AUTH] Cookies Steam não encontrados (sessionId ou steamLoginSecure ausentes)');
            }
          } catch (cookieError) {
            console.warn('[AUTH] Não foi possível capturar/salvar cookies durante login:', cookieError);
            // Não é crítico, pode capturar depois via CookieCaptureModal
          }
          
          // Fechar modal e chamar callback de sucesso
          // Isso carrega o user no AuthContext
          // O loading já está ativo agora, então o app será bloqueado
          onClose();
          await onSuccess(token);
          
          // Executar sincronização de forma assíncrona (não bloqueia o callback)
          (async () => {
            try {
              console.log('[AUTH] 🔄 Iniciando sincronização de inventário após login...');
              
              // Buscar user via API usando o token
              // Aguardar um pouco para garantir que o backend processou o login
              await new Promise(resolve => setTimeout(resolve, 500));
              
              const currentToken = token;
              let currentUser = null;
              
              // Buscar user via API para obter steamId
              try {
                const { apiClient } = await import('@services/api');
                currentUser = await apiClient.get('/users/me', currentToken);
              } catch (err) {
                console.warn('[AUTH] ⚠️ Erro ao buscar user após login:', err);
                setPostLoginSyncing(false);
                return;
              }
              
              if (!currentUser || !currentUser.steam_id) {
                console.warn('[AUTH] ⚠️ User não disponível após login, sincronização será pulada');
                setPostLoginSyncing(false);
                return;
              }
              
              const steamId = String(currentUser.steam_id);
              console.log('[AUTH] ✅ User disponível, steamId:', steamId);
              
              // Etapa 1: Sincronizar inventário (mesma lógica do refresh)
              // Isso cria snapshot automático no primeiro login via /inventory/upload
              console.log('[AUTH] 📡 Etapa 1: Sincronizando inventário com Steam...');
              updatePostLoginSyncStep('sync', 'processing');
              const syncResult = await syncInventory(currentToken, steamId);
              console.log('[AUTH] ✅ Sincronização concluída:', syncResult);
              updatePostLoginSyncStep('sync', 'completed');
              
              // Pequeno delay
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // Etapa 2: Atualizar histórico de preços
              console.log('[AUTH] 💰 Etapa 2: Atualizando histórico de preços...');
              updatePostLoginSyncStep('prices', 'processing');
              await updatePriceHistoryForInventory(currentToken).catch((error) => {
                console.warn('[AUTH] Erro ao atualizar histórico (não crítico):', error);
              });
              updatePostLoginSyncStep('prices', 'completed');
              
              // Pequeno delay
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // Etapa 3: Invalidar cache e recarregar dados
              console.log('[AUTH] 🔄 Etapa 3: Invalidando cache e recarregando dados...');
              updatePostLoginSyncStep('load', 'processing');
              await queryClient.invalidateQueries({ 
                queryKey: ['portfolio', steamId] 
              });
              await queryClient.invalidateQueries({ 
                queryKey: ['portfolio-history', steamId] 
              });
              updatePostLoginSyncStep('load', 'completed');
              
              // Aguardar um pouco antes de liberar o app (para o usuário ver "TUDO PRONTO")
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              console.log('[AUTH] ✅ Sincronização completa após login concluída!');
              setPostLoginSyncing(false);
            } catch (syncError) {
              console.error('[AUTH] ❌ Erro na sincronização de inventário após login:', syncError);
              // Em caso de erro, ainda liberar o app (usuário pode tentar refresh depois)
              setPostLoginSyncing(false);
            }
          })();
        } else {
          Alert.alert('Error', 'Token not found in callback. Please try again.');
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('[AUTH] Erro ao processar callback:', error);
        Alert.alert('Error', 'Error processing login. Please try again.');
        setIsProcessing(false);
      }
    }

    // Verificar se chegou no perfil da Steam (pode indicar login completo, mas sem callback ainda)
    if (
      !currentUrl.includes('loadout://') &&
      (currentUrl.includes('steamcommunity.com/profiles') ||
        currentUrl.includes('steamcommunity.com/id') ||
        currentUrl.includes('steamcommunity.com/home'))
    ) {
      console.log('[AUTH] Login Steam detectado, aguardando callback...');
    }
  };

  const handleClose = () => {
    if (isProcessing) {
      Alert.alert('Please wait', 'Login is being processed. Please wait.');
      return;
    }
    onClose();
  };

  // Custom loading component to mask Render server wake-up
  const renderLoading = () => (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#d4c291" />
      <Animated.Text
        style={[
          styles.loadingText,
          {
            opacity: pulseAnim,
          },
        ]}
      >
        ESTABLISHING SECURE CONNECTION...
      </Animated.Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header Tático */}
        <View style={styles.header}>
          <Text style={styles.title}>SIGN IN WITH STEAM</Text>
          <View style={styles.headerRight}>
            {!isProcessing && (
              <TouchableOpacity
                onPress={handleClose}
                disabled={isProcessing}
                style={styles.cancelButton}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.secureText}>Secure connection</Text>
        </View>

        {/* Content Area */}
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#d4c291" />
            <Text style={styles.processingText}>PROCESSING LOGIN...</Text>
          </View>
        ) : loginUrl ? (
          <View style={styles.webviewContainer}>
            <WebView
              source={{ uri: loginUrl }}
              onNavigationStateChange={handleNavigationStateChange}
              onLoadEnd={() => {
                // Page has finished loading - hide loading overlay
                setTimeout(() => {
                  setPageLoaded(true);
                  setIsLoading(false);
                }, 500); // Small delay to ensure page is fully rendered
              }}
              onShouldStartLoadWithRequest={(request) => {
                // Interceptar requisições para o callback URL
                if (request.url.includes('loadout://auth-callback')) {
                  handleNavigationStateChange({ url: request.url });
                  return false; // Não carregar a URL, vamos processar manualmente
                }
                return true;
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              thirdPartyCookiesEnabled={true}
              sharedCookiesEnabled={true}
              style={styles.webview}
              startInLoadingState={true}
              renderLoading={renderLoading}
            />
            {/* Show loading overlay while page hasn't loaded yet */}
            {isLoading && !pageLoaded && (
              <View style={styles.loadingOverlayAbsolute}>
                {renderLoading()}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <ActivityIndicator size="large" color="#d4c291" />
            <Text style={styles.loadingText}>CARREGANDO URL DE LOGIN...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl + 4, // Safe area padding
    paddingBottom: spacing.md,
    backgroundColor: '#0F0F0F', // Almost black gray (tactical)
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 194, 145, 0.15)', // Tactical Gold accent border
    position: 'relative',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: '#d4c291', // Tactical Gold
    fontFamily: typography.fonts.primaryBold,
    textTransform: 'uppercase',
    letterSpacing: 2, // Military/industrial spacing
    marginBottom: spacing.xs,
  },
  headerRight: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.xl + 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  cancelButtonText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.secondarySemiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  secureText: {
    fontSize: typography.sizes.xs - 1,
    fontFamily: typography.fonts.secondaryRegular,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: spacing.xs / 2,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  processingText: {
    fontSize: typography.sizes.md,
    color: '#d4c291', // Tactical Gold
    fontFamily: typography.fonts.secondarySemiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000', // Black background
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: '#000000', // Solid black background
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingOverlayAbsolute: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 10,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.secondarySemiBold,
    color: '#d4c291', // Tactical Gold
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.error,
    fontFamily: typography.fonts.secondarySemiBold,
    textAlign: 'center',
  },
});

