import type { Component } from 'vue';

import { defineAsyncComponent, h } from 'vue';

export interface MicroAppManifest<TRoute = any> {
  /** Unique micro-app identifier (e.g. 'automation', 'system', 'tenants') */
  id: string;
  /** Human-readable display name */
  name?: string;
  /** Version string */
  version?: string;
  /** Default redirect subpath relative to app root */
  defaultPath: string;
  /** Generates route records given an i18n translation function */
  routes: (t: (key: string) => string) => TRoute[];
}

export interface RemoteRouteOptions<TRoute = any> {
  /** Micro-app identifier */
  appId: string;
  /** Dev server port (e.g. 5321) */
  devPort?: number;
  /** Dev server hostname (default: localhost) */
  devHost?: string;
  /** Fallback manifest bundled with the application */
  manifest: MicroAppManifest<TRoute>;
  /** i18n translation function */
  t: (key: string) => string;
  /** Whether to attempt dynamic remote loading in development. Default: true */
  preferDynamic?: boolean;
  /** Fallback timeout in ms before defaulting to bundled component. Default: 5000 */
  timeoutMs?: number;
}

/**
 * Creates route records that dynamically load views from an active micro-app dev server,
 * with seamless fallback to the local bundled component if the remote server is offline.
 */
export function createRemoteRoute<
  TRoute extends Record<string, any> = Record<string, any>,
>(options: RemoteRouteOptions<TRoute>): TRoute[] {
  const {
    appId,
    devHost = 'localhost',
    devPort,
    manifest,
    preferDynamic = true,
    t,
    timeoutMs = 5000,
  } = options;

  const rawRoutes = manifest.routes(t);

  return rawRoutes.map((route) => {
    if (typeof route.component === 'function') {
      const originalLoader = route.component as () => Promise<Component>;

      const dynamicComponent = defineAsyncComponent({
        loader: async (): Promise<Component> => {
          // Check if running in browser development environment
          const isDev =
            typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' ||
              window.location.hostname === '127.0.0.1' ||
              Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV));

          if (isDev && preferDynamic && devPort) {
            try {
              const remoteUrl = `http://${devHost}:${devPort}/src/remote-entry.ts`;
              const remoteMod = (await import(
                /* @vite-ignore */ remoteUrl
              )) as Record<string, unknown>;
              const remoteManifest = (remoteMod[`${appId}Manifest`] ||
                remoteMod.default ||
                remoteMod.manifest) as MicroAppManifest<TRoute> | undefined;

              if (
                remoteManifest &&
                typeof remoteManifest.routes === 'function'
              ) {
                const remoteRoutes = remoteManifest.routes(t);
                const matchingRoute = remoteRoutes.find(
                  (r) => r.name === route.name || r.path === route.path,
                );
                if (
                  matchingRoute &&
                  typeof matchingRoute.component === 'function'
                ) {
                  const resolved = await (
                    matchingRoute.component as () => Promise<Component>
                  )();
                  return resolved;
                }
              }
            } catch {
              // Remote dev server offline or unreachable; fall through to bundled component
            }
          }

          // Fallback: invoke original bundled component loader
          const fallbackResolved = await originalLoader();
          return fallbackResolved;
        },
        loadingComponent: {
          render() {
            return h(
              'div',
              {
                class:
                  'flex items-center justify-center p-12 text-sm text-muted-foreground animate-pulse',
              },
              [h('span', `Loading @operon/${appId} module...`)],
            );
          },
        },
        errorComponent: {
          render() {
            return h(
              'div',
              {
                class:
                  'm-6 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-destructive',
              },
              [
                h(
                  'h3',
                  { class: 'text-base font-semibold' },
                  `Micro-App Unavailable: @operon/${appId}`,
                ),
                h(
                  'p',
                  { class: 'mt-1 text-xs opacity-90' },
                  `Could not load module from remote (port ${devPort || 'N/A'}) or bundled fallback.`,
                ),
              ],
            );
          },
        },
        timeout: timeoutMs,
      });

      return {
        ...route,
        component: dynamicComponent,
      };
    }

    return route;
  });
}
