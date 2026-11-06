<script setup lang="ts">
import type { SupportedLanguagesType } from '@operon/locales';
import type { CustomPreferencesRecord } from '@operon/preferences';
import type {
  BreadcrumbStyleType,
  BuiltinThemeType,
  ContentCompactType,
  LayoutHeaderMenuAlignType,
  LayoutHeaderModeType,
  LayoutType,
  NavigationStyleType,
  PreferencesButtonPositionType,
  ThemeModeType,
} from '@operon/types';

import type { SegmentedItem } from '@operon-core/shadcn-ui';

import { computed, ref } from 'vue';

import {
  Copy,
  Keyboard,
  LayoutTemplate,
  Palette,
  RotateCw,
  Settings,
} from '@operon/icons';
import { $t, loadLocaleMessages } from '@operon/locales';
import {
  clearCache,
  preferences,
  resetPreferences,
  updateCustomPreferences,
  usePreferences,
} from '@operon/preferences';

import { useVbenModal } from '@operon-core/popup-ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  VbenButton,
  VbenIconButton,
} from '@operon-core/shadcn-ui';
import { globalShareState } from '@operon-core/shared/global-state';

import { useClipboard } from '@vueuse/core';

import {
  Animation,
  Block,
  Breadcrumb,
  BuiltinTheme,
  ColorMode,
  Content,
  Copyright,
  Custom,
  FontSize,
  Footer,
  General,
  GlobalShortcutKeys,
  Header,
  Layout,
  Logo,
  Navigation,
  Radius,
  Sidebar,
  Tabbar,
  Theme,
  Widget,
} from './blocks';

const emit = defineEmits<{ clearPreferencesAndLogout: [] }>();

const message = globalShareState.getMessage();

const appLocale = defineModel<SupportedLanguagesType | undefined>('appLocale', {
  default: undefined,
});
const appTimezone = defineModel<string | undefined>('appTimezone', {
  default: undefined,
});
const appDynamicTitle = defineModel<boolean>('appDynamicTitle');
const appLayout = defineModel<LayoutType | undefined>('appLayout', {
  default: undefined,
});
const appColorGrayMode = defineModel<boolean>('appColorGrayMode');
const appColorWeakMode = defineModel<boolean>('appColorWeakMode');
const appContentCompact = defineModel<ContentCompactType | undefined>(
  'appContentCompact',
  {
    default: undefined,
  },
);
const appWatermark = defineModel<boolean>('appWatermark');
const appWatermarkContent = defineModel<string | undefined>(
  'appWatermarkContent',
  {
    default: undefined,
  },
);
const appEnableCheckUpdates = defineModel<boolean>('appEnableCheckUpdates');
const appEnableCopyPreferences = defineModel<boolean>(
  'appEnableCopyPreferences',
);
const appPreferencesButtonPosition = defineModel<
  PreferencesButtonPositionType | undefined
>('appPreferencesButtonPosition', { default: undefined });

const transitionProgress = defineModel<boolean>('transitionProgress');
const transitionName = defineModel<string | undefined>('transitionName', {
  default: undefined,
});
const transitionLoading = defineModel<boolean>('transitionLoading');
const transitionEnable = defineModel<boolean>('transitionEnable');

const themeColorPrimary = defineModel<string | undefined>('themeColorPrimary', {
  default: undefined,
});
const themeBuiltinType = defineModel<BuiltinThemeType | undefined>(
  'themeBuiltinType',
  {
    default: undefined,
  },
);
const themeMode = defineModel<ThemeModeType | undefined>('themeMode', {
  default: undefined,
});
const themeRadius = defineModel<string | undefined>('themeRadius', {
  default: undefined,
});
const themeFontSize = defineModel<number | undefined>('themeFontSize', {
  default: undefined,
});
const themeSemiDarkSidebar = defineModel<boolean>('themeSemiDarkSidebar');
const themeSemiDarkSidebarSub = defineModel<boolean>('themeSemiDarkSidebarSub');
const themeSemiDarkHeader = defineModel<boolean>('themeSemiDarkHeader');

const sidebarEnable = defineModel<boolean>('sidebarEnable');
const sidebarWidth = defineModel<number | undefined>('sidebarWidth', {
  default: undefined,
});
const sidebarDraggable = defineModel<boolean>('sidebarDraggable');
const sidebarCollapsed = defineModel<boolean>('sidebarCollapsed');
const sidebarCollapsedShowTitle = defineModel<boolean>(
  'sidebarCollapsedShowTitle',
);
const sidebarAutoActivateChild = defineModel<boolean>(
  'sidebarAutoActivateChild',
);
const sidebarExpandOnHover = defineModel<boolean>('sidebarExpandOnHover');
const sidebarCollapsedButton = defineModel<boolean>('sidebarCollapsedButton');
const sidebarFixedButton = defineModel<boolean>('sidebarFixedButton');
const headerEnable = defineModel<boolean>('headerEnable');
const headerMode = defineModel<LayoutHeaderModeType | undefined>('headerMode', {
  default: undefined,
});
const headerMenuAlign = defineModel<LayoutHeaderMenuAlignType | undefined>(
  'headerMenuAlign',
  { default: undefined },
);

const breadcrumbEnable = defineModel<boolean>('breadcrumbEnable');
const breadcrumbShowIcon = defineModel<boolean>('breadcrumbShowIcon');
const breadcrumbShowHome = defineModel<boolean>('breadcrumbShowHome');
const breadcrumbStyleType = defineModel<BreadcrumbStyleType | undefined>(
  'breadcrumbStyleType',
  { default: undefined },
);
const breadcrumbHideOnlyOne = defineModel<boolean>('breadcrumbHideOnlyOne');

const tabbarEnable = defineModel<boolean>('tabbarEnable');
const tabbarShowIcon = defineModel<boolean>('tabbarShowIcon');
const tabbarShowRefresh = defineModel<boolean>('tabbarShowRefresh');
const tabbarShowMore = defineModel<boolean>('tabbarShowMore');
const tabbarShowMaximize = defineModel<boolean>('tabbarShowMaximize');
const tabbarPersist = defineModel<boolean>('tabbarPersist');
const tabbarVisitHistory = defineModel<boolean>('tabbarVisitHistory');
const tabbarDraggable = defineModel<boolean>('tabbarDraggable');
const tabbarWheelable = defineModel<boolean>('tabbarWheelable');
const tabbarStyleType = defineModel<string | undefined>('tabbarStyleType', {
  default: undefined,
});
const tabbarMaxCount = defineModel<number | undefined>('tabbarMaxCount', {
  default: undefined,
});
const tabbarMiddleClickToClose = defineModel<boolean>(
  'tabbarMiddleClickToClose',
);

const navigationStyleType = defineModel<NavigationStyleType | undefined>(
  'navigationStyleType',
  { default: undefined },
);
const navigationSplit = defineModel<boolean>('navigationSplit');
const navigationAccordion = defineModel<boolean>('navigationAccordion');

const logoEnable = defineModel<boolean>('logoEnable');
const logoShowText = defineModel<boolean>('logoShowText');
const logoLogoMode = defineModel<'full' | 'icon' | undefined>('logoLogoMode', {
  default: undefined,
});

const footerEnable = defineModel<boolean>('footerEnable');
const footerFixed = defineModel<boolean>('footerFixed');

const copyrightSettingShow = defineModel<boolean>('copyrightSettingShow');
const copyrightEnable = defineModel<boolean>('copyrightEnable');
const copyrightCompanyName = defineModel<string | undefined>(
  'copyrightCompanyName',
  {
    default: undefined,
  },
);
const copyrightCompanySiteLink = defineModel<string | undefined>(
  'copyrightCompanySiteLink',
  { default: undefined },
);
const copyrightDate = defineModel<string | undefined>('copyrightDate', {
  default: undefined,
});
const copyrightIcp = defineModel<string | undefined>('copyrightIcp', {
  default: undefined,
});
const copyrightIcpLink = defineModel<string | undefined>('copyrightIcpLink', {
  default: undefined,
});

const shortcutKeysEnable = defineModel<boolean>('shortcutKeysEnable');
const shortcutKeysGlobalSearch = defineModel<boolean>(
  'shortcutKeysGlobalSearch',
);
const shortcutKeysGlobalLogout = defineModel<boolean>(
  'shortcutKeysGlobalLogout',
);
const shortcutKeysGlobalEscape = defineModel<boolean>(
  'shortcutKeysGlobalEscape',
);
const shortcutKeysGlobalLockScreen = defineModel<boolean>(
  'shortcutKeysGlobalLockScreen',
);

const widgetGlobalSearchButtonPosition = defineModel<string | undefined>(
  'widgetGlobalSearchButtonPosition',
  { default: undefined },
);
const widgetFullscreenButtonPosition = defineModel<string | undefined>(
  'widgetFullscreenButtonPosition',
  { default: undefined },
);
const widgetLanguageToggleButtonPosition = defineModel<string | undefined>(
  'widgetLanguageToggleButtonPosition',
  { default: undefined },
);
const widgetNotificationButtonPosition = defineModel<string | undefined>(
  'widgetNotificationButtonPosition',
  { default: undefined },
);
const widgetThemeToggleButtonPosition = defineModel<string | undefined>(
  'widgetThemeToggleButtonPosition',
  { default: undefined },
);
const widgetLockScreenButtonPosition = defineModel<string | undefined>(
  'widgetLockScreenButtonPosition',
  { default: undefined },
);
const widgetLogoutButtonPosition = defineModel<string | undefined>(
  'widgetLogoutButtonPosition',
  { default: undefined },
);
const widgetOrder = defineModel<string[]>('widgetOrder', { required: true });
const widgetRefreshButtonPosition = defineModel<string | undefined>(
  'widgetRefreshButtonPosition',
  { default: undefined },
);
const widgetTimezoneButtonPosition = defineModel<string | undefined>(
  'widgetTimezoneButtonPosition',
  { default: undefined },
);

const {
  customPreferences,
  diffCustomPreference,
  diffPreference,
  isDark,
  isFullContent,
  isHeaderNav,
  isHeaderSidebarNav,
  isMixedNav,
  preferencesExtension,
  isSideMixedNav,
  isSideMode,
  isSideNav,
} = usePreferences();
const { copy } = useClipboard({ legacy: true });

const [Modal] = useVbenModal();

const activeTab = ref('appearance');

const customPreferencesTab = computed(() => {
  return preferencesExtension.value;
});

const mergedDiffPreference = computed(() => {
  const result: Record<string, unknown> = {};

  if (diffPreference.value) {
    Object.assign(result, diffPreference.value);
  }

  if (diffCustomPreference.value) {
    result.custom = diffCustomPreference.value;
  }

  return Object.keys(result).length > 0 ? result : undefined;
});

const tabs = computed((): SegmentedItem[] => {
  return [
    {
      icon: Palette,
      label: $t('preferences.appearance'),
      value: 'appearance',
    },
    {
      icon: LayoutTemplate,
      label: $t('preferences.layout'),
      value: 'layout',
    },
    {
      icon: Keyboard,
      label: $t('preferences.shortcutKeys.title'),
      value: 'shortcutKey',
    },
    {
      icon: Settings,
      label: $t('preferences.general'),
      value: 'general',
    },
  ];
});

const showBreadcrumbConfig = computed(() => {
  return (
    !isFullContent.value &&
    !isMixedNav.value &&
    !isHeaderNav.value &&
    preferences.header.enable
  );
});

async function handleCopy() {
  await copy(JSON.stringify(mergedDiffPreference.value, null, 2));

  message.copyPreferencesSuccess?.(
    $t('preferences.copyPreferencesSuccessTitle'),
    $t('preferences.copyPreferencesSuccess'),
  );
}

async function handleClearCache() {
  await resetPreferences();
  await clearCache();
  emit('clearPreferencesAndLogout');
}

async function handleReset() {
  if (!mergedDiffPreference.value) {
    return;
  }
  await resetPreferences();
  await loadLocaleMessages(preferences.app.locale);
}

function handleCustomPreferencesUpdate(updates: CustomPreferencesRecord) {
  updateCustomPreferences(updates);
}
</script>

<template>
  <Modal
    :description="$t('preferences.subtitle')"
    :fullscreen-button="false"
    :title="$t('preferences.title')"
    class="flex h-[88vh] max-h-[88vh] w-[min(1100px,96vw)] max-w-none flex-col overflow-hidden p-0"
    content-class="flex-1 overflow-hidden p-0"
    footer-class="border-t border-border px-6 py-3"
    header-class="border-b border-border px-6 py-0 shrink-0"
  >
    <!-- Header extra: reset button — placed inside title slot for proper alignment -->
    <template #title>
      <div class="flex h-14 items-center justify-between">
        <div class="flex flex-col gap-0.5">
          <span class="text-base font-semibold leading-none">{{
            $t('preferences.title')
          }}</span>
          <span class="text-xs text-muted-foreground">{{
            $t('preferences.subtitle')
          }}</span>
        </div>
        <VbenIconButton
          :disabled="!mergedDiffPreference"
          :tooltip="$t('preferences.resetTip')"
          class="relative mr-8"
          @click="handleReset"
        >
          <span
            v-if="mergedDiffPreference"
            class="absolute right-0.5 top-0.5 size-2 rounded-sm bg-primary"
          ></span>
          <RotateCw class="size-4" />
        </VbenIconButton>
      </div>
    </template>

    <!-- Body: 2-column layout -->
    <div class="flex size-full overflow-hidden">
      <!-- LEFT NAV — desktop (≥ md) -->
      <nav
        class="hidden w-52 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-border px-2 py-4 md:flex"
      >
        <p
          class="mb-1 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60"
        >
          {{ $t('preferences.title') }}
        </p>
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :data-active="activeTab === tab.value"
          class="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-foreground"
          type="button"
          @click="activeTab = tab.value"
        >
          <component :is="tab.icon" class="size-4 shrink-0" />
          {{ tab.label }}
        </button>
      </nav>

      <!-- MOBILE NAV — select dropdown (< md) -->
      <div
        class="flex w-full shrink-0 flex-col overflow-hidden md:hidden md:w-0"
      >
        <div class="border-b border-border px-4 py-2.5">
          <Select v-model="activeTab">
            <SelectTrigger class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="tab in tabs"
                :key="tab.value"
                :value="tab.value"
              >
                {{ tab.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Mobile content -->
        <div class="flex-1 overflow-y-auto px-4 py-4">
          <template v-if="activeTab === 'appearance'">
            <Block :title="$t('preferences.theme.title')">
              <Theme
                v-model="themeMode"
                v-model:theme-semi-dark-header="themeSemiDarkHeader"
                v-model:theme-semi-dark-sidebar="themeSemiDarkSidebar"
                v-model:theme-semi-dark-sidebar-sub="themeSemiDarkSidebarSub"
              />
            </Block>
            <Block :title="$t('preferences.theme.builtin.title')">
              <BuiltinTheme
                v-model="themeBuiltinType"
                v-model:theme-color-primary="themeColorPrimary"
                :is-dark="isDark"
              />
            </Block>
            <Block :title="$t('preferences.theme.radius')">
              <Radius v-model="themeRadius" />
            </Block>
            <Block :title="$t('preferences.typography.title')">
              <Custom
                v-if="customPreferencesTab?.fields.length"
                :fields="customPreferencesTab.fields"
                :values="customPreferences"
                @update="handleCustomPreferencesUpdate"
              />
              <FontSize v-model="themeFontSize" />
            </Block>
            <Block :title="$t('preferences.other')">
              <ColorMode
                v-model:app-color-gray-mode="appColorGrayMode"
                v-model:app-color-weak-mode="appColorWeakMode"
              />
            </Block>
          </template>

          <template v-else-if="activeTab === 'layout'">
            <Block :title="$t('preferences.layout')">
              <Layout v-model="appLayout" />
            </Block>
            <Block :title="$t('preferences.content')">
              <Content v-model="appContentCompact" />
            </Block>
            <Block :title="$t('preferences.logo.title')">
              <Logo
                v-model:logo-enable="logoEnable"
                v-model:logo-mode="logoLogoMode"
                v-model:logo-show-text="logoShowText"
              />
            </Block>
            <Block :title="$t('preferences.sidebar.title')">
              <Sidebar
                v-model:sidebar-auto-activate-child="sidebarAutoActivateChild"
                v-model:sidebar-collapsed="sidebarCollapsed"
                v-model:sidebar-collapsed-button="sidebarCollapsedButton"
                v-model:sidebar-collapsed-show-title="sidebarCollapsedShowTitle"
                v-model:sidebar-draggable="sidebarDraggable"
                v-model:sidebar-enable="sidebarEnable"
                v-model:sidebar-expand-on-hover="sidebarExpandOnHover"
                v-model:sidebar-fixed-button="sidebarFixedButton"
                v-model:sidebar-width="sidebarWidth"
                :current-layout="appLayout"
                :disabled="!isSideMode"
              />
            </Block>
            <Block :title="$t('preferences.header.title')">
              <Header
                v-model:header-enable="headerEnable"
                v-model:header-menu-align="headerMenuAlign"
                v-model:header-mode="headerMode"
                :disabled="isFullContent"
              />
            </Block>
            <Block :title="$t('preferences.navigationMenu.title')">
              <Navigation
                v-model:navigation-accordion="navigationAccordion"
                v-model:navigation-split="navigationSplit"
                v-model:navigation-style-type="navigationStyleType"
                :disabled="isFullContent"
                :disabled-navigation-split="!isMixedNav"
              />
            </Block>
            <Block :title="$t('preferences.breadcrumb.title')">
              <Breadcrumb
                v-model:breadcrumb-enable="breadcrumbEnable"
                v-model:breadcrumb-hide-only-one="breadcrumbHideOnlyOne"
                v-model:breadcrumb-show-home="breadcrumbShowHome"
                v-model:breadcrumb-show-icon="breadcrumbShowIcon"
                v-model:breadcrumb-style-type="breadcrumbStyleType"
                :disabled="
                  !showBreadcrumbConfig ||
                  !(isSideNav || isSideMixedNav || isHeaderSidebarNav)
                "
              />
            </Block>
            <Block :title="$t('preferences.tabbar.title')">
              <Tabbar
                v-model:tabbar-draggable="tabbarDraggable"
                v-model:tabbar-enable="tabbarEnable"
                v-model:tabbar-max-count="tabbarMaxCount"
                v-model:tabbar-middle-click-to-close="tabbarMiddleClickToClose"
                v-model:tabbar-persist="tabbarPersist"
                v-model:tabbar-show-icon="tabbarShowIcon"
                v-model:tabbar-show-maximize="tabbarShowMaximize"
                v-model:tabbar-show-more="tabbarShowMore"
                v-model:tabbar-show-refresh="tabbarShowRefresh"
                v-model:tabbar-style-type="tabbarStyleType"
                v-model:tabbar-visit-history="tabbarVisitHistory"
                v-model:tabbar-wheelable="tabbarWheelable"
              />
            </Block>
            <Block :title="$t('preferences.widget.title')">
              <Widget
                v-model:app-preferences-button-position="
                  appPreferencesButtonPosition
                "
                v-model:widget-fullscreen-button-position="
                  widgetFullscreenButtonPosition
                "
                v-model:widget-global-search-button-position="
                  widgetGlobalSearchButtonPosition
                "
                v-model:widget-language-toggle-button-position="
                  widgetLanguageToggleButtonPosition
                "
                v-model:widget-lock-screen-button-position="
                  widgetLockScreenButtonPosition
                "
                v-model:widget-logout-button-position="
                  widgetLogoutButtonPosition
                "
                v-model:widget-notification-button-position="
                  widgetNotificationButtonPosition
                "
                v-model:widget-order="widgetOrder"
                v-model:widget-refresh-button-position="
                  widgetRefreshButtonPosition
                "
                v-model:widget-theme-toggle-button-position="
                  widgetThemeToggleButtonPosition
                "
                v-model:widget-timezone-button-position="
                  widgetTimezoneButtonPosition
                "
              />
            </Block>
            <Block :title="$t('preferences.footer.title')">
              <Footer
                v-model:footer-enable="footerEnable"
                v-model:footer-fixed="footerFixed"
              />
            </Block>
            <Block
              v-if="copyrightSettingShow"
              :title="$t('preferences.copyright.title')"
            >
              <Copyright
                v-model:copyright-company-name="copyrightCompanyName"
                v-model:copyright-company-site-link="copyrightCompanySiteLink"
                v-model:copyright-date="copyrightDate"
                v-model:copyright-enable="copyrightEnable"
                v-model:copyright-icp="copyrightIcp"
                v-model:copyright-icp-link="copyrightIcpLink"
                :disabled="!footerEnable"
              />
            </Block>
          </template>

          <template v-else-if="activeTab === 'shortcutKey'">
            <Block :title="$t('preferences.shortcutKeys.global')">
              <GlobalShortcutKeys
                v-model:shortcut-keys-enable="shortcutKeysEnable"
                v-model:shortcut-keys-escape="shortcutKeysGlobalEscape"
                v-model:shortcut-keys-global-search="shortcutKeysGlobalSearch"
                v-model:shortcut-keys-lock-screen="shortcutKeysGlobalLockScreen"
                v-model:shortcut-keys-logout="shortcutKeysGlobalLogout"
              />
            </Block>
          </template>

          <template v-else-if="activeTab === 'general'">
            <Block :title="$t('preferences.general')">
              <General
                v-model:app-dynamic-title="appDynamicTitle"
                v-model:app-enable-check-updates="appEnableCheckUpdates"
                v-model:app-enable-copy-preferences="appEnableCopyPreferences"
                v-model:app-locale="appLocale"
                v-model:app-timezone="appTimezone"
                v-model:app-watermark="appWatermark"
                v-model:app-watermark-content="appWatermarkContent"
              />
            </Block>
            <Block :title="$t('preferences.animation.title')">
              <Animation
                v-model:transition-enable="transitionEnable"
                v-model:transition-loading="transitionLoading"
                v-model:transition-name="transitionName"
                v-model:transition-progress="transitionProgress"
              />
            </Block>
          </template>
        </div>
      </div>

      <!-- DESKTOP CONTENT — right panel (≥ md) -->
      <div class="hidden flex-1 overflow-y-auto md:block">
        <div class="mx-auto max-w-3xl px-8 py-6 space-y-2">
          <template v-if="activeTab === 'appearance'">
            <Block :title="$t('preferences.theme.title')">
              <Theme
                v-model="themeMode"
                v-model:theme-semi-dark-header="themeSemiDarkHeader"
                v-model:theme-semi-dark-sidebar="themeSemiDarkSidebar"
                v-model:theme-semi-dark-sidebar-sub="themeSemiDarkSidebarSub"
              />
            </Block>
            <Block :title="$t('preferences.theme.builtin.title')">
              <BuiltinTheme
                v-model="themeBuiltinType"
                v-model:theme-color-primary="themeColorPrimary"
                :is-dark="isDark"
              />
            </Block>
            <Block :title="$t('preferences.theme.radius')">
              <Radius v-model="themeRadius" />
            </Block>
            <Block :title="$t('preferences.typography.title')">
              <Custom
                v-if="customPreferencesTab?.fields.length"
                :fields="customPreferencesTab.fields"
                :values="customPreferences"
                @update="handleCustomPreferencesUpdate"
              />
              <FontSize v-model="themeFontSize" />
            </Block>
            <Block :title="$t('preferences.other')">
              <ColorMode
                v-model:app-color-gray-mode="appColorGrayMode"
                v-model:app-color-weak-mode="appColorWeakMode"
              />
            </Block>
          </template>

          <template v-else-if="activeTab === 'layout'">
            <Block :title="$t('preferences.layout')">
              <Layout v-model="appLayout" />
            </Block>
            <Block :title="$t('preferences.content')">
              <Content v-model="appContentCompact" />
            </Block>
            <Block :title="$t('preferences.logo.title')">
              <Logo
                v-model:logo-enable="logoEnable"
                v-model:logo-mode="logoLogoMode"
                v-model:logo-show-text="logoShowText"
              />
            </Block>
            <Block :title="$t('preferences.sidebar.title')">
              <Sidebar
                v-model:sidebar-auto-activate-child="sidebarAutoActivateChild"
                v-model:sidebar-collapsed="sidebarCollapsed"
                v-model:sidebar-collapsed-button="sidebarCollapsedButton"
                v-model:sidebar-collapsed-show-title="sidebarCollapsedShowTitle"
                v-model:sidebar-draggable="sidebarDraggable"
                v-model:sidebar-enable="sidebarEnable"
                v-model:sidebar-expand-on-hover="sidebarExpandOnHover"
                v-model:sidebar-fixed-button="sidebarFixedButton"
                v-model:sidebar-width="sidebarWidth"
                :current-layout="appLayout"
                :disabled="!isSideMode"
              />
            </Block>
            <Block :title="$t('preferences.header.title')">
              <Header
                v-model:header-enable="headerEnable"
                v-model:header-menu-align="headerMenuAlign"
                v-model:header-mode="headerMode"
                :disabled="isFullContent"
              />
            </Block>
            <Block :title="$t('preferences.navigationMenu.title')">
              <Navigation
                v-model:navigation-accordion="navigationAccordion"
                v-model:navigation-split="navigationSplit"
                v-model:navigation-style-type="navigationStyleType"
                :disabled="isFullContent"
                :disabled-navigation-split="!isMixedNav"
              />
            </Block>
            <Block :title="$t('preferences.breadcrumb.title')">
              <Breadcrumb
                v-model:breadcrumb-enable="breadcrumbEnable"
                v-model:breadcrumb-hide-only-one="breadcrumbHideOnlyOne"
                v-model:breadcrumb-show-home="breadcrumbShowHome"
                v-model:breadcrumb-show-icon="breadcrumbShowIcon"
                v-model:breadcrumb-style-type="breadcrumbStyleType"
                :disabled="
                  !showBreadcrumbConfig ||
                  !(isSideNav || isSideMixedNav || isHeaderSidebarNav)
                "
              />
            </Block>
            <Block :title="$t('preferences.tabbar.title')">
              <Tabbar
                v-model:tabbar-draggable="tabbarDraggable"
                v-model:tabbar-enable="tabbarEnable"
                v-model:tabbar-max-count="tabbarMaxCount"
                v-model:tabbar-middle-click-to-close="tabbarMiddleClickToClose"
                v-model:tabbar-persist="tabbarPersist"
                v-model:tabbar-show-icon="tabbarShowIcon"
                v-model:tabbar-show-maximize="tabbarShowMaximize"
                v-model:tabbar-show-more="tabbarShowMore"
                v-model:tabbar-show-refresh="tabbarShowRefresh"
                v-model:tabbar-style-type="tabbarStyleType"
                v-model:tabbar-visit-history="tabbarVisitHistory"
                v-model:tabbar-wheelable="tabbarWheelable"
              />
            </Block>
            <Block :title="$t('preferences.widget.title')">
              <Widget
                v-model:app-preferences-button-position="
                  appPreferencesButtonPosition
                "
                v-model:widget-fullscreen-button-position="
                  widgetFullscreenButtonPosition
                "
                v-model:widget-global-search-button-position="
                  widgetGlobalSearchButtonPosition
                "
                v-model:widget-language-toggle-button-position="
                  widgetLanguageToggleButtonPosition
                "
                v-model:widget-lock-screen-button-position="
                  widgetLockScreenButtonPosition
                "
                v-model:widget-logout-button-position="
                  widgetLogoutButtonPosition
                "
                v-model:widget-notification-button-position="
                  widgetNotificationButtonPosition
                "
                v-model:widget-order="widgetOrder"
                v-model:widget-refresh-button-position="
                  widgetRefreshButtonPosition
                "
                v-model:widget-theme-toggle-button-position="
                  widgetThemeToggleButtonPosition
                "
                v-model:widget-timezone-button-position="
                  widgetTimezoneButtonPosition
                "
              />
            </Block>
            <Block :title="$t('preferences.footer.title')">
              <Footer
                v-model:footer-enable="footerEnable"
                v-model:footer-fixed="footerFixed"
              />
            </Block>
            <Block
              v-if="copyrightSettingShow"
              :title="$t('preferences.copyright.title')"
            >
              <Copyright
                v-model:copyright-company-name="copyrightCompanyName"
                v-model:copyright-company-site-link="copyrightCompanySiteLink"
                v-model:copyright-date="copyrightDate"
                v-model:copyright-enable="copyrightEnable"
                v-model:copyright-icp="copyrightIcp"
                v-model:copyright-icp-link="copyrightIcpLink"
                :disabled="!footerEnable"
              />
            </Block>
          </template>

          <template v-else-if="activeTab === 'shortcutKey'">
            <Block :title="$t('preferences.shortcutKeys.global')">
              <GlobalShortcutKeys
                v-model:shortcut-keys-enable="shortcutKeysEnable"
                v-model:shortcut-keys-escape="shortcutKeysGlobalEscape"
                v-model:shortcut-keys-global-search="shortcutKeysGlobalSearch"
                v-model:shortcut-keys-lock-screen="shortcutKeysGlobalLockScreen"
                v-model:shortcut-keys-logout="shortcutKeysGlobalLogout"
              />
            </Block>
          </template>

          <template v-else-if="activeTab === 'general'">
            <Block :title="$t('preferences.general')">
              <General
                v-model:app-dynamic-title="appDynamicTitle"
                v-model:app-enable-check-updates="appEnableCheckUpdates"
                v-model:app-enable-copy-preferences="appEnableCopyPreferences"
                v-model:app-locale="appLocale"
                v-model:app-timezone="appTimezone"
                v-model:app-watermark="appWatermark"
                v-model:app-watermark-content="appWatermarkContent"
              />
            </Block>
            <Block :title="$t('preferences.animation.title')">
              <Animation
                v-model:transition-enable="transitionEnable"
                v-model:transition-loading="transitionLoading"
                v-model:transition-name="transitionName"
                v-model:transition-progress="transitionProgress"
              />
            </Block>
          </template>
        </div>
      </div>
    </div>

    <!-- Footer actions -->
    <template #footer>
      <div class="flex w-full items-center gap-2">
        <VbenButton
          v-if="appEnableCopyPreferences"
          :disabled="!mergedDiffPreference"
          size="sm"
          variant="default"
          @click="handleCopy"
        >
          <Copy class="mr-1.5 size-3" />
          {{ $t('preferences.copyPreferences') }}
        </VbenButton>
        <VbenButton
          :disabled="!mergedDiffPreference"
          size="sm"
          variant="ghost"
          @click="handleClearCache"
        >
          {{ $t('preferences.clearAndLogout') }}
        </VbenButton>
      </div>
    </template>
  </Modal>
</template>
