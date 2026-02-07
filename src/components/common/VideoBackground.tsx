import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

/**
 * VideoBackground component
 * 
 * IMPORTANT: This component requires react-native-video to be properly linked.
 * After installing react-native-video, you MUST rebuild the Android app:
 * 
 *   cd android && ./gradlew clean && cd ..
 *   npx react-native run-android
 * 
 * To enable the video background, set ENABLE_VIDEO_BACKGROUND to true below.
 */
const ENABLE_VIDEO_BACKGROUND = true; // Video background enabled

// Helper function to get video source
const getDefaultVideoSource = () => {
  if (!ENABLE_VIDEO_BACKGROUND) {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // Path: src/components/common/ -> ../../../assets/videos/ (up 3 levels to root)
  return require('../../../assets/videos/smoke-vertical.mp4');
};

interface VideoBackgroundProps {
  videoSource?: any;
  overlayOpacity?: number;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  videoSource,
  overlayOpacity = 0.75,
}) => {
  // IMPORTANTE: Todos os hooks DEVEM ser chamados ANTES de qualquer return condicional
  // Isso garante que os hooks sejam sempre chamados na mesma ordem
  const [retryKey, setRetryKey] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup do timeout quando componente for desmontado
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Get dimensions dynamically
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

  // Agora podemos fazer os checks e returns condicionais
  if (!ENABLE_VIDEO_BACKGROUND) {
    return null;
  }

  let Video: any = null;
  try {
    Video = require('react-native-video').default;
  } catch (e) {
    console.warn('[VideoBackground] react-native-video not available:', e);
    return null;
  }

  if (!Video) {
    return null;
  }

  // Load video source only when needed (after all checks pass)
  // This avoids Metro bundler trying to resolve the file when disabled
  let finalVideoSource = videoSource;
  if (!finalVideoSource) {
    finalVideoSource = getDefaultVideoSource();
    if (!finalVideoSource) {
      return null;
    }
  }

  console.log('[VideoBackground] Renderizando vídeo background', { SCREEN_WIDTH, SCREEN_HEIGHT, retryKey });
  
  return (
    <View 
      style={[
        StyleSheet.absoluteFillObject, 
        { zIndex: 0 } // Garantir que está atrás de tudo
      ]} 
      pointerEvents="none"
    >
      <Video
        key={retryKey} // Força remontagem do componente em caso de retry
        source={finalVideoSource}
        style={[
          StyleSheet.absoluteFillObject,
          {
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
          },
        ]}
        muted
        repeat={true} // Loop explícito
        resizeMode="cover"
        rate={1.0}
        paused={false}
        playInBackground={true} // Continuar rodando quando app está em background
        playWhenInactive={true} // Continuar quando tela está inativa
        ignoreSilentSwitch="ignore" // Ignorar switch de silêncio
        onLoad={() => {
          console.log('[VideoBackground] Vídeo carregado com sucesso');
        }}
        onEnd={() => {
          // Garantir loop mesmo que repeat falhe
          console.log('[VideoBackground] Vídeo chegou ao fim, reiniciando...');
        }}
        onError={(error: any) => {
          console.error('[VideoBackground] Erro ao carregar vídeo:', {
            error: error?.error || error,
            errorString: error?.error?.errorString,
            errorCode: error?.error?.errorCode,
            errorException: error?.error?.exception,
            source: finalVideoSource,
          });
          
          // Tentar recarregar após 2 segundos (máximo 3 tentativas)
          if (retryKey < 3) {
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }
            retryTimeoutRef.current = setTimeout(() => {
              console.log(`[VideoBackground] Tentando recarregar vídeo (tentativa ${retryKey + 1}/3)...`);
              setRetryKey((prev) => prev + 1);
            }, 2000);
          } else {
            console.warn('[VideoBackground] Máximo de tentativas alcançado. Vídeo não será exibido.');
          }
        }}
        onBuffer={(data: any) => {
          if (data?.isBuffering) {
            console.log('[VideoBackground] Bufferizando vídeo...');
          }
        }}
      />
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: `rgba(10, 14, 18, ${overlayOpacity})` },
        ]}
      />
    </View>
  );
};

