/**
 * Context de idioma com persistência em MMKV.
 * Suporta en, pt-BR e es.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { i18n } from '@/i18n';
import { storage } from '@services/storage';
import type { Locale } from '@/i18n/translations';

type TranslationKey = keyof typeof import('@/i18n/translations').translations.en;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, options?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const VALID_LOCALES: Locale[] = ['en', 'pt-BR', 'es'];
function isValidLocale(value: string): value is Locale {
  return VALID_LOCALES.includes(value as Locale);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = storage.getLanguage();
    const loc = isValidLocale(saved) ? saved : 'en';
    i18n.locale = loc;
    return loc;
  });

  useEffect(() => {
    i18n.locale = locale;
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    storage.setLanguage(newLocale);
    setLocaleState(newLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKey, options?: Record<string, string | number>) => {
      try {
        return (i18n.t(key as string, options) as string) || String(key);
      } catch {
        return String(key);
      }
    },
    [locale],
  );

  const value = React.useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
