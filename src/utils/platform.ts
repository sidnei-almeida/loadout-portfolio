/**
 * Platform utilities
 */

import { Platform } from 'react-native';

export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';
export const isWeb = Platform.OS === 'web';

export const platform = {
  isAndroid,
  isIOS,
  isWeb,
  OS: Platform.OS,
};

