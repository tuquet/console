import type { LayoutType } from '@operon-core/typings';

import type { OperonLayoutProps } from '../operon-layout';

import { computed } from 'vue';

export function useLayout(props: OperonLayoutProps) {
  const currentLayout = computed(() =>
    props.isMobile ? 'sidebar-nav' : (props.layout as LayoutType),
  );

  /**
   * Whether to display content in full screen, without sidebar, footer, header, and tabbar
   */
  const isFullContent = computed(() => currentLayout.value === 'full-content');

  /**
   * Whether header navigation mode
   */
  const isHeaderNav = computed(() => currentLayout.value === 'header-nav');

  /**
   * Whether mixed navigation mode
   */
  const isMixedNav = computed(
    () =>
      currentLayout.value === 'mixed-nav' ||
      currentLayout.value === 'header-sidebar-nav',
  );

  return {
    currentLayout,
    isFullContent,
    isHeaderNav,
    isMixedNav,
  };
}
