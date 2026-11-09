import type { RouteRecordRaw } from 'vue-router';

import type { AppPlatform } from '#/utils/platform';

export type RoutePlatform = 'all' | 'desktop' | 'web';

/**
 * Filter route tree by checking meta.platform against the active platform ('desktop' | 'web').
 * - If route.meta.platform is 'desktop', it only appears on Desktop (Tauri).
 * - If route.meta.platform is 'web', it only appears on Web browser.
 * - If route.meta.platform is 'all' or omitted, it appears on both platforms.
 * - Children are filtered recursively.
 * - If a parent route has no own component and all its children were filtered out, it is pruned.
 *
 * @param routes - List of RouteRecordRaw objects
 * @param platform - Current running platform ('desktop' | 'web')
 */
export function filterRoutesByPlatform(
  routes: RouteRecordRaw[],
  platform: AppPlatform,
): RouteRecordRaw[] {
  if (!Array.isArray(routes) || routes.length === 0) {
    return [];
  }

  const result: RouteRecordRaw[] = [];

  for (const route of routes) {
    const routePlatform =
      (route.meta as undefined | { platform?: RoutePlatform })?.platform ??
      'all';

    if (routePlatform !== 'all' && routePlatform !== platform) {
      continue;
    }

    const cloned = { ...route };
    if (Array.isArray(cloned.children) && cloned.children.length > 0) {
      cloned.children = filterRoutesByPlatform(cloned.children, platform);
      if (cloned.children.length === 0 && !cloned.component) {
        // Prune empty parent route
        continue;
      }
    }

    result.push(cloned);
  }

  return result;
}
