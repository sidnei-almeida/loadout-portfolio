/**
 * Dev-only logger.
 *
 * Every call is gated behind `__DEV__` so that production bundles
 * contain zero logging output.  Hermes will tree-shake the bodies
 * away entirely in release builds.
 */

type LogArgs = Parameters<typeof console.log>;

export const logger = {
  log(...args: LogArgs): void {
    if (__DEV__) { console.log(...args); }
  },

  warn(...args: LogArgs): void {
    if (__DEV__) { console.warn(...args); }
  },

  error(...args: LogArgs): void {
    if (__DEV__) { console.error(...args); }
  },
};
