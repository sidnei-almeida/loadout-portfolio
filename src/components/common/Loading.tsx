import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@theme';

// Helper para garantir valores seguros
const safeTypography = typography || {
  fonts: { primaryMedium: 'Roboto' },
  sizes: { sm: 13 },
};
const safeSpacing = spacing || { lg: 24, md: 16 };

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading...',
  fullScreen = false,
}) => {
  // Garantir que message seja sempre uma string válida
  const displayMessage = typeof message === 'string' && message.trim() 
    ? message.toUpperCase() 
    : 'LOADING...';

  // Estilos inline para evitar problemas com StyleSheet
  const containerStyle = fullScreen 
    ? {
        flex: 1,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        backgroundColor: 'transparent', // Transparente para o vídeo aparecer
      }
    : {
        padding: safeSpacing.lg,
        alignItems: 'center' as const,
        backgroundColor: 'transparent', // Transparente para o vídeo aparecer
      };

  const messageStyle = {
    marginTop: safeSpacing.md,
    color: '#d4c291',
    fontSize: safeTypography.sizes.sm,
    fontFamily: safeTypography.fonts.primaryMedium,
    letterSpacing: 1.5,
    opacity: 0.9,
  };

  return (
    <View style={containerStyle}>
      <ActivityIndicator size="large" color="#d4c291" />
      <Text style={messageStyle}>{displayMessage}</Text>
    </View>
  );
};

