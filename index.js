/**
 * @format
 */

import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';

// Captura erros não tratados e exibe no console (ajuda no debug)
if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // eslint-disable-next-line no-console
    console.error('[FATAL]', isFatal ? 'FATAL' : 'ERROR', error?.message || error, error?.stack);
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

const Root = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

AppRegistry.registerComponent(appName, () => Root);
