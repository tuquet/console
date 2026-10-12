import type { VNode } from 'vue';
import type {
  RouteLocationNormalizedLoaded,
  RouteLocationNormalizedLoadedGeneric,
} from 'vue-router';

import { computed } from 'vue';

import { preferences, usePreferences } from '@vben/preferences';

/**
 * Transform component and attach name automatically
 * @param component
 * @param route
 */
export function transformComponent(
  component: VNode,
  route: RouteLocationNormalizedLoadedGeneric,
) {
  // Component view not found; return fallback view if set, otherwise throw error
  if (!component) {
    console.error(
      'Component view not found，please check the route configuration',
    );
    return undefined;
  }

  const routeName = route.name as string;
  // Return directly if component lacks name
  if (!routeName) {
    return component;
  }
  const componentName = (component?.type as any)?.name;

  // Return directly if name is already set
  if (componentName) {
    return component;
  }

  // Return directly if componentName matches routeName
  if (componentName === routeName) {
    return component;
  }

  // Set name
  component.type ||= {};
  (component.type as any).name = routeName;

  return component;
}

/**
 * Layout composables
 */
export function useLayoutHook() {
  const { keepAlive } = usePreferences();
  /**
   * Whether to use animations
   */
  const getEnabledTransition = computed(() => {
    const { transition } = preferences;
    const transitionName = transition.name;
    return transitionName && transition.enable;
  });

  /**
   * Get route transition animation
   * @param _route
   */
  function getTransitionName(_route: RouteLocationNormalizedLoaded) {
    // Do not use animation if disabled in preferences
    const { tabbar, transition } = preferences;
    const transitionName = transition.name;
    if (!transitionName || !transition.enable) {
      return;
    }

    // If tabs disabled or caching disabled, use global transition config
    if (!tabbar.enable || !keepAlive) {
      return transitionName;
    }

    // Do not use animation if page was already loaded
    // if (route.meta.loaded) {
    //   return;
    // }
    // Pages already open and loaded skip transition animation
    // const inTabs = getCachedTabs.value.includes(route.name as string);

    // return inTabs && route.meta.loaded ? undefined : transitionName;
    return transitionName;
  }

  return {
    getEnabledTransition,
    getTransitionName,
  };
}
