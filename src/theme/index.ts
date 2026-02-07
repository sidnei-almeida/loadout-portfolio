/**
 * Tema consolidado do Loadout
 */

import { colors as colorsOriginal } from './colors';
import { typography as typographyOriginal } from './typography';
import { spacing as spacingOriginal } from './spacing';

// Garantir que os valores sempre existam (proteção contra undefined)
export const typography = typographyOriginal || {
  fonts: {
    primary: 'Orbitron',
    primaryRegular: 'Orbitron-Regular',
    primaryMedium: 'Orbitron-Medium',
    primarySemiBold: 'Orbitron-SemiBold',
    primaryBold: 'Orbitron-Bold',
    primaryExtraBold: 'Orbitron-ExtraBold',
    secondary: 'Rajdhani',
    secondaryRegular: 'Rajdhani-Regular',
    secondaryMedium: 'Rajdhani-Medium',
    secondarySemiBold: 'Rajdhani-SemiBold',
    secondaryBold: 'Rajdhani-Bold',
  },
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
};

export const colors = colorsOriginal || {
  primary: '#FFD700',
  text: '#FFFFFF',
  textSecondary: '#B8BCC8',
  textMuted: '#6B7280',
  error: '#EF4444',
};

export const spacing = spacingOriginal || {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Exportar objeto consolidado (usar valores seguros)
export const theme = {
  colors,
  typography,
  spacing,
};

export type Theme = typeof theme;

// Hook para usar tema (será implementado quando necessário)
export const useTheme = () => theme;

