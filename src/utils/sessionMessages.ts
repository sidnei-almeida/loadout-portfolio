type TranslateFn = (key: string, options?: Record<string, string | number>) => string;

const SESSION_EXPIRED_KEYS: Array<{ titleKey: string; messageKey: string }> = [
  { titleKey: 'sessionExpired1Title', messageKey: 'sessionExpired1Message' },
  { titleKey: 'sessionExpired2Title', messageKey: 'sessionExpired2Message' },
  { titleKey: 'sessionExpired3Title', messageKey: 'sessionExpired3Message' },
  { titleKey: 'sessionExpired4Title', messageKey: 'sessionExpired4Message' },
  { titleKey: 'sessionExpired5Title', messageKey: 'sessionExpired5Message' },
  { titleKey: 'sessionExpired6Title', messageKey: 'sessionExpired6Message' },
];

/**
 * Returns friendly messages for session expired (translated)
 */
export function getSessionExpiredMessage(t: TranslateFn): { title: string; message: string } {
  const randomIndex = Math.floor(Math.random() * SESSION_EXPIRED_KEYS.length);
  const { titleKey, messageKey } = SESSION_EXPIRED_KEYS[randomIndex];
  return {
    title: t(titleKey),
    message: t(messageKey),
  };
}
