import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, InteractionManager, Platform } from 'react-native';
import { logger } from '@utils/logger';

/**
 * VideoBackground component
 *
 * IMPORTANT: This component requires react-native-video to be properly linked.
 * After installing react-native-video, you MUST rebuild the Android app:
 *
 *   cd android && ./gradlew clean && cd ..
 *   npx react-native run-android
 *
 * Error 1001 "Failed to initialize Player" on Android: pode ocorrer por montagem
 * antecipada ou emulador sem codecs. O componente usa delayed mount e fallback.
 */
const ENABLE_VIDEO_BACKGROUND = true;

/** Cor de fundo quando o vídeo falha (compatível com overlay) */
const FALLBACK_BG_COLOR = '#0a0e12';

const getDefaultVideoSource = () => {
  if (!ENABLE_VIDEO_BACKGROUND) return null;
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
  const [retryKey, setRetryKey] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const [mountReady, setMountReady] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const task = InteractionManager.runAfterInteractions(() => {
      const delay = Platform.OS === 'android' ? 350 : 150;
      timeoutId = setTimeout(() => setMountReady(true), delay);
    });
    return () => {
      task.cancel();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  if (!ENABLE_VIDEO_BACKGROUND) return null;

  let Video: any = null;
  try {
    Video = require('react-native-video').default;
  } catch {
    return null;
  }

  const finalVideoSource = videoSource ?? getDefaultVideoSource();
  if (!finalVideoSource) return null;

  const showFallback = videoFailed || !mountReady;
  const shouldRenderVideo = !videoFailed && mountReady;

  const handleError = (error: any) => {
    logger.error('[VideoBackground] Erro ao carregar vídeo:', {
      errorString: error?.error?.errorString,
      errorCode: error?.error?.errorCode,
    });

    if (retryKey < 2) {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => setRetryKey((k) => k + 1), 2500);
    } else {
      setVideoFailed(true);
    }
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]} pointerEvents="none">
      {showFallback && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: FALLBACK_BG_COLOR },
          ]}
        />
      )}
      {shouldRenderVideo && (
        <Video
          key={retryKey}
          source={finalVideoSource}
          style={[StyleSheet.absoluteFillObject, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }]}
          muted
          repeat
          resizeMode="cover"
          rate={1.0}
          paused={false}
          playInBackground
          playWhenInactive
          ignoreSilentSwitch="ignore"
          onLoad={() => logger.log('[VideoBackground] Vídeo carregado')}
          onError={handleError}
        />
      )}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: `rgba(10, 14, 18, ${overlayOpacity})` },
        ]}
      />
    </View>
  );
};

