import { I18n } from 'i18n-js';
import { translations, type Locale } from './translations';

const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export { i18n, translations };
export type { Locale };
