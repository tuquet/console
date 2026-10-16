import type { App } from 'vue';
import type { Router } from 'vue-router';

import * as Sentry from '@sentry/vue';

export interface BugsinkConfig {
  dsn?: string;
  enabled?: boolean;
  environment?: string;
  release?: string;
}

/**
 * Default Bugsink DSN provided for the Tuquet project
 */
export const DEFAULT_BUGSINK_DSN =
  'https://9691efe9e0064c9f828dd7463dc3d414@tuquet.bugsink.com/1';

/**
 * Initialize Bugsink (Sentry-compatible) error logging for Vue 3 application
 */
export function initBugsink(
  app: App,
  router?: Router,
  customConfig?: BugsinkConfig,
) {
  const dsn =
    customConfig?.dsn ||
    import.meta.env.VITE_BUGSINK_DSN ||
    DEFAULT_BUGSINK_DSN;

  const isExplicitlyDisabled =
    customConfig?.enabled === false ||
    import.meta.env.VITE_BUGSINK_ENABLED === 'false';

  if (!dsn || isExplicitlyDisabled) {
    return;
  }

  const environment =
    customConfig?.environment ||
    import.meta.env.MODE ||
    (import.meta.env.PROD ? 'production' : 'development');

  const release =
    customConfig?.release ||
    import.meta.env.VITE_APP_VERSION ||
    '5.8.0';

  try {
    Sentry.init({
      app,
      dsn,
      environment,
      release,
      integrations: [
        ...(router ? [Sentry.browserTracingIntegration({ router })] : []),
      ],
      // 100% of errors are captured
      sampleRate: 1.0,
      // Sample 20% of transactions in production to conserve bandwidth, 100% in development
      tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
      // Filter out non-actionable or transient browser exceptions
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Network request failed',
        'AbortError',
        'Failed to fetch dynamically imported module',
      ],
      beforeSend(event) {
        // Tag events specifically as Specter Admin client
        event.tags = {
          ...event.tags,
          app: 'specter-admin',
        };
        return event;
      },
    });

    const maskedDsn = dsn.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.info(`[Bugsink] Error tracker initialized (${environment}) -> ${maskedDsn}`);
  } catch (err) {
    console.warn('[Bugsink] Failed to initialize error tracker:', err);
  }
}

/**
 * Manually capture an exception and send to Bugsink
 */
export function captureError(error: unknown, context?: Record<string, any>) {
  try {
    Sentry.captureException(error, {
      extra: context,
    });
  } catch {
    // Fail-safe: error logging must never crash the UI
  }
}

/**
 * Manually send an informational or warning message to Bugsink
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>,
) {
  try {
    Sentry.captureMessage(message, {
      extra: context,
      level,
    });
  } catch {
    // Fail-safe
  }
}

export { Sentry };
