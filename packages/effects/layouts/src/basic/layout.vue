<script lang="ts" setup>
import type { SetupContext } from 'vue';

import type { MenuRecordRaw } from '@operon/types';

import { computed, useSlots, watch } from 'vue';

import { useRefresh } from '@operon/hooks';
import { Settings } from '@operon/icons';
import { $t, i18n } from '@operon/locales';
import {
  preferences,
  updatePreferences,
  usePreferences,
} from '@operon/preferences';
import {
  useAccessStore,
  useTabbarStore,
  useTimezoneStore,
} from '@operon/stores';
import { cloneDeep, mapTree } from '@operon/utils';

import { VbenAdminLayout } from '@operon-core/layout-ui';
import { VbenBackTop, VbenButton, VbenLogo } from '@operon-core/shadcn-ui';
import { ELEMENT_ID_LAYOUT_SCROLL } from '@operon-core/shared/constants';

import { Breadcrumb, CheckUpdates, Preferences } from '../widgets';
import { LayoutContent, LayoutContentSpinner } from './content';
import { Copyright } from './copyright';
import { LayoutFooter } from './footer';
import { LayoutHeader } from './header';
import {
  LayoutExtraMenu,
  LayoutMenu,
  useExtraMenu,
  useMixedMenu,
} from './menu';
import { LayoutTabbar } from './tabbar';
import { useLayoutScroll } from './use-layout-scroll';

defineOptions({ name: 'BasicLayout' });

const props = withDefaults(defineProps<Props>(), {
  logoSrc: '',
  logoSrcDark: '',
  logoText: '',
  avatar: '',
  text: '',
});

const emit = defineEmits<{
  clearPreferencesAndLogout: [];
  clickLogo: [];
  logout: [];
}>();

interface Props {
  /** Custom Logo image URL; uses preferences default if omitted */
  logoSrc?: string;
  /** Custom dark theme Logo image URL */
  logoSrcDark?: string;
  /** Custom Logo text; uses preferences default if omitted */
  logoText?: string;
  /** Override sidebar logo visibility */
  sidebarLogoVisible?: boolean;
  /** User avatar image URL */
  avatar?: string;
  /** User text (e.g. username) */
  text?: string;
}

/** Resolved Logo image URL (custom takes priority, falls back to default) */
const finalLogoSrc = computed(() => props.logoSrc || preferences.logo.source);
/** Resolved dark theme Logo image URL */
const finalLogoSrcDark = computed(
  () => props.logoSrcDark || preferences.logo.sourceDark,
);
/** Resolved Logo text (custom takes priority, falls back to default app name) */
const finalLogoText = computed(() => props.logoText || preferences.app.name);

const slots: SetupContext['slots'] = useSlots();

const isSidebarLogoVisible = computed(() => {
  if (props.sidebarLogoVisible !== undefined) {
    return props.sidebarLogoVisible;
  }
  return preferences.logo.enable;
});

const {
  isDark,
  isHeaderNav,
  isMixedNav,
  isMobile,
  isSideMode,
  isHeaderMixedNav,
  isHeaderSidebarNav,
  layout,
  preferencesButtonPosition,
  sidebarCollapsed,
  theme,
} = usePreferences();
const accessStore = useAccessStore();
const timezoneStore = useTimezoneStore();
const { refresh } = useRefresh();
const layoutScrollTarget = `#${ELEMENT_ID_LAYOUT_SCROLL}`;

useLayoutScroll();

const sidebarTheme = computed(() => {
  const dark = isDark.value || preferences.theme.semiDarkSidebar;
  return dark ? 'dark' : 'light';
});

const sidebarThemeSub = computed(() => {
  const dark = isDark.value || preferences.theme.semiDarkSidebarSub;
  return dark ? 'dark' : 'light';
});

const headerTheme = computed(() => {
  const dark = isDark.value || preferences.theme.semiDarkHeader;
  return dark ? 'dark' : 'light';
});

const logoClass = computed(() => {
  const { collapsedShowTitle } = preferences.sidebar;
  const classes: string[] = [];

  if (collapsedShowTitle && sidebarCollapsed.value && !isMixedNav.value) {
    classes.push('mx-auto');
  }

  return classes.join(' ');
});

const isMenuRounded = computed(() => {
  return preferences.navigation.styleType === 'rounded';
});

const logoCollapsed = computed(() => {
  if (isMobile.value && sidebarCollapsed.value) {
    return true;
  }
  if (isHeaderNav.value || isMixedNav.value || isHeaderSidebarNav.value) {
    return false;
  }
  return sidebarCollapsed.value || isHeaderMixedNav.value;
});

const showHeaderNav = computed(() => {
  return (
    !isMobile.value &&
    (isHeaderNav.value || isMixedNav.value || isHeaderMixedNav.value)
  );
});

const logoTheme = computed(() => {
  const showLogoInHeader =
    !isSideMode.value ||
    isHeaderSidebarNav.value ||
    isMixedNav.value ||
    isMobile.value;
  return showLogoInHeader ? headerTheme.value : sidebarTheme.value;
});

const {
  handleMenuSelect,
  handleMenuOpen,
  headerActive,
  headerMenus,
  sidebarActive,
  sidebarMenus,
  mixHeaderMenus,
  sidebarVisible,
} = useMixedMenu();

const { extraActiveMenu, extraMenus } = useExtraMenu(mixHeaderMenus);

const extraDomainTitle = computed(() => {
  const activeKey = extraActiveMenu.value;
  const activeItem = mixHeaderMenus.value.find(
    (item) => item.path === activeKey || item.name === activeKey,
  );
  return activeItem ? $t(activeItem.name) : finalLogoText.value;
});

/**
 * Wrap menu items and translate menu titles
 * @param menus Raw menu data
 * @param deep Whether to wrap deeply (in mixed layout only first level is wrapped)
 */
function wrapperMenus(menus: MenuRecordRaw[], deep: boolean = true) {
  return deep
    ? mapTree(menus, (item) => {
        return { ...cloneDeep(item), name: $t(item.name) };
      })
    : menus.map((item) => {
        return { ...cloneDeep(item), name: $t(item.name) };
      });
}

function toggleSidebar() {
  updatePreferences({
    sidebar: {
      hidden: !preferences.sidebar.hidden,
    },
  });
}

function clearPreferencesAndLogout() {
  emit('clearPreferencesAndLogout');
}

function handleLogout() {
  emit('logout');
}

function clickLogo() {
  emit('clickLogo');
}

const tabbarStore = useTabbarStore();

function refreshAll() {
  tabbarStore.cachedTabs.clear();
  refresh();
}

// Refresh page when language updates
// i18n.global.locale updates after preferences; wait for full locale loading
watch(i18n.global.locale, refreshAll, { flush: 'post' });

// Refresh page when timezone updates
watch(() => timezoneStore.timezone, refreshAll, { flush: 'post' });

const headerSlots = computed(() => {
  return Object.keys(slots).filter((key) => key.startsWith('header-'));
});
</script>

<template>
  <VbenAdminLayout
    :content-compact="preferences.app.contentCompact"
    :content-compact-width="preferences.app.contentCompactWidth"
    :content-padding="preferences.app.contentPadding"
    :content-padding-bottom="preferences.app.contentPaddingBottom"
    :content-padding-left="preferences.app.contentPaddingLeft"
    :content-padding-right="preferences.app.contentPaddingRight"
    :content-padding-top="preferences.app.contentPaddingTop"
    :footer-enable="preferences.footer.enable"
    :footer-fixed="preferences.footer.fixed"
    :footer-height="preferences.footer.height"
    :header-height="preferences.header.height"
    :header-hidden="preferences.header.hidden"
    :header-mode="preferences.header.mode"
    :header-theme="headerTheme"
    :header-toggle-sidebar-button="preferences.widget.sidebarToggle"
    :header-visible="preferences.header.enable"
    :is-mobile="preferences.app.isMobile"
    :layout="layout"
    :sidebar-draggable="preferences.sidebar.draggable"
    :sidebar-collapse="preferences.sidebar.collapsed"
    :sidebar-collapse-show-title="preferences.sidebar.collapsedShowTitle"
    :sidebar-enable="sidebarVisible"
    :sidebar-collapsed-button="preferences.sidebar.collapsedButton"
    :sidebar-fixed-button="preferences.sidebar.fixedButton"
    :sidebar-expand-on-hover="preferences.sidebar.expandOnHover"
    :sidebar-extra-collapse="preferences.sidebar.extraCollapse"
    :sidebar-extra-collapsed-width="preferences.sidebar.extraCollapsedWidth"
    :sidebar-hidden="preferences.sidebar.hidden"
    :sidebar-theme="sidebarTheme"
    :sidebar-theme-sub="sidebarThemeSub"
    :sidebar-width="preferences.sidebar.width"
    :side-collapse-width="preferences.sidebar.collapseWidth"
    :sidebar-logo-visible="isSidebarLogoVisible"
    :tabbar-enable="preferences.tabbar.enable"
    :tabbar-height="preferences.tabbar.height"
    :z-index="preferences.app.zIndex"
    @toggle-sidebar="toggleSidebar"
    @update:sidebar-collapse="
      (value: boolean) => updatePreferences({ sidebar: { collapsed: value } })
    "
    @update:sidebar-enable="
      (value: boolean) => updatePreferences({ sidebar: { enable: value } })
    "
    @update:sidebar-expand-on-hover="
      (value: boolean) =>
        updatePreferences({ sidebar: { expandOnHover: value } })
    "
    @update:sidebar-extra-collapse="
      (value: boolean) =>
        updatePreferences({ sidebar: { extraCollapse: value } })
    "
    @update:sidebar-width="
      (value: number) => updatePreferences({ sidebar: { width: value } })
    "
  >
    <!-- logo -->
    <template v-if="isSidebarLogoVisible" #logo>
      <slot
        :collapsed="logoCollapsed"
        :is-mobile="preferences.app.isMobile"
        name="logo"
      >
        <VbenLogo
          v-if="preferences.logo.enable"
          :fit="preferences.logo.fit"
          :class="logoClass"
          :collapsed="logoCollapsed"
          :src="finalLogoSrc"
          :src-dark="finalLogoSrcDark"
          :text="finalLogoText"
          :show-text="preferences.logo.showText"
          :logo-mode="preferences.logo.logoMode"
          :full-logo-height="preferences.logo.fullLogoHeight"
          :theme="logoTheme"
          @click="clickLogo"
        >
          <template v-if="$slots['logo-text']" #text>
            <slot name="logo-text"></slot>
          </template>
        </VbenLogo>
      </slot>
    </template>
    <!-- Header area -->
    <template #header>
      <LayoutHeader
        :avatar="avatar"
        :theme="theme"
        :text="text"
        @clear-preferences-and-logout="clearPreferencesAndLogout"
        @logout="handleLogout"
      >
        <template
          v-if="!showHeaderNav && preferences.breadcrumb.enable"
          #breadcrumb
        >
          <Breadcrumb
            :hide-when-only-one="preferences.breadcrumb.hideOnlyOne"
            :show-home="preferences.breadcrumb.showHome"
            :show-icon="preferences.breadcrumb.showIcon"
            :type="preferences.breadcrumb.styleType"
          />
        </template>
        <template v-if="showHeaderNav" #menu>
          <LayoutMenu
            :default-active="headerActive"
            :menus="wrapperMenus(headerMenus)"
            :rounded="isMenuRounded"
            :theme="headerTheme"
            class="w-full"
            mode="horizontal"
            @select="handleMenuSelect"
          />
        </template>
        <template #user-dropdown>
          <slot name="user-dropdown"></slot>
        </template>
        <template #notification>
          <slot name="notification"></slot>
        </template>
        <template v-for="item in headerSlots" #[item]>
          <slot :name="item"></slot>
        </template>
      </LayoutHeader>
    </template>
    <!-- Sidebar menu area -->
    <template #menu>
      <LayoutMenu
        :accordion="preferences.navigation.accordion"
        :collapse="preferences.sidebar.collapsed"
        :collapse-show-title="preferences.sidebar.collapsedShowTitle"
        :default-active="sidebarActive"
        :menus="wrapperMenus(sidebarMenus)"
        :rounded="isMenuRounded"
        :theme="sidebarTheme"
        mode="vertical"
        @open="handleMenuOpen"
        @select="handleMenuSelect"
      />
    </template>
    <!-- Sidebar extra area -->
    <template #side-extra>
      <LayoutExtraMenu
        :accordion="preferences.navigation.accordion"
        :collapse="preferences.sidebar.extraCollapse"
        :menus="wrapperMenus(extraMenus)"
        :rounded="isMenuRounded"
        :theme="sidebarThemeSub"
      />
    </template>
    <template #side-extra-title>
      <slot :title="extraDomainTitle" name="side-extra-title">
        <div class="flex h-full items-center px-3">
          <span
            class="font-semibold tracking-tight text-foreground truncate select-none"
          >
            {{ extraDomainTitle }}
          </span>
        </div>
      </slot>
    </template>

    <template
      v-if="preferencesButtonPosition.sidebarBottom"
      #side-bottom="{ collapsed }"
    >
      <div class="min-w-0">
        <Preferences
          class="w-full"
          @clear-preferences-and-logout="clearPreferencesAndLogout"
        >
          <template #default="{ open }">
            <VbenButton
              variant="ghost"
              :size="collapsed ? 'icon' : 'default'"
              class="h-8 justify-start gap-2 px-2"
              :title="$t('preferences.settingsTitle')"
              :aria-label="$t('preferences.settingsTitle')"
              @click="open"
            >
              <Settings class="size-4 shrink-0" />
              <!-- <span v-if="!collapsed" class="truncate">{{ $t('preferences.settingsTitle') }}</span> -->
            </VbenButton>
          </template>
        </Preferences>
      </div>
    </template>

    <template #tabbar>
      <LayoutTabbar
        v-if="preferences.tabbar.enable"
        :show-icon="preferences.tabbar.showIcon"
        :theme="theme"
      />
    </template>

    <!-- Main content -->
    <template #content>
      <LayoutContent />
    </template>

    <template v-if="preferences.transition.loading" #content-overlay>
      <LayoutContentSpinner />
    </template>

    <!-- Footer -->
    <template v-if="preferences.footer.enable" #footer>
      <LayoutFooter>
        <slot name="footer">
          <Copyright
            v-if="preferences.copyright.enable"
            v-bind="preferences.copyright"
          />
          <div v-else class="text-muted-foreground">
            Copyright © {{ preferences.copyright.date || '2026' }}
            <a
              v-if="preferences.copyright.companyName"
              :href="
                preferences.copyright.companySiteLink || 'javascript:void(0)'
              "
              class="mx-1 hover:text-primary-hover"
              target="_blank"
            >
              {{ preferences.copyright.companyName }}
            </a>
          </div>
        </slot>
      </LayoutFooter>
    </template>

    <template #extra>
      <slot name="extra"></slot>
      <CheckUpdates
        v-if="preferences.app.enableCheckUpdates"
        :check-updates-interval="preferences.app.checkUpdatesInterval"
      />

      <Transition v-if="preferences.widget.lockScreen" name="slide-up">
        <slot v-if="accessStore.isLockScreen" name="lock-screen"></slot>
      </Transition>

      <template v-if="preferencesButtonPosition.fixed">
        <Preferences
          class="fixed top-1/2 right-0 z-100 -translate-y-1/2 transform"
          @clear-preferences-and-logout="clearPreferencesAndLogout"
        />
      </template>
      <VbenBackTop :target="layoutScrollTarget" />
    </template>
  </VbenAdminLayout>
</template>
