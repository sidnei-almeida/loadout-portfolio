/**
 * ErrorBoundary - captura erros de renderização e exibe a mensagem real.
 * Útil para debug quando o Red Box não mostra o texto do erro.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { i18n } from '@/i18n';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      const { error, errorInfo } = this.state;
      return (
        <View style={styles.container}>
          <Text style={styles.title}>{i18n.t('appError')}</Text>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator>
            <Text style={styles.label}>{i18n.t('errorMessage')}:</Text>
            <Text style={styles.message}>{error.message}</Text>
            {error.stack && (
              <>
                <Text style={styles.label}>{i18n.t('errorStack')}:</Text>
                <Text style={styles.stack}>{error.stack}</Text>
              </>
            )}
            {errorInfo?.componentStack && (
              <>
                <Text style={styles.label}>{i18n.t('errorComponent')}:</Text>
                <Text style={styles.stack}>{errorInfo.componentStack}</Text>
              </>
            )}
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d4c291',
    marginTop: 12,
  },
  message: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 4,
  },
  stack: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  scroll: {
    maxHeight: 400,
  },
});
