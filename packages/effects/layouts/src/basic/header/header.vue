<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, useSlots } from 'vue';

import { useRefresh } from '@operon/hooks';
import { preferences, usePreferences } from '@operon/preferences';
import { useAccessStore } from '@operon/stores';

import { useFullscreen, useMagicKeys, whenever } from '@vueuse/core';

import { LockScreenModal } from '../../widgets';
import LogoutConfirmation from '../../widgets/logout-confirmation.vue';
import HeaderWidget from './header-widget.vue';

interface Props {
  /**
   * Avatar
   */
  avatar?: string;
  /**
   * Logo theme
   */
  theme?: string;
  /**
   * User text
   */
  text?: string;
}

defineOptions({
  name: 'LayoutHeader',
});

withDefaults(defineProps<Props>(), {
  avatar: '',
  theme: 'light',
  text: '',
});

const emit = defineEmits<{
  clearPreferencesAndLogout: [];
  logout: [];
  openLockScreen: [];
}>();

const REFERENCE_VALUE = 100;

const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
const accessStore = useAccessStore();
const {
  globalLockScreenShortcutKey,
  globalLogoutShortcutKey,
  globalSearchShortcutKey,
  preferencesButtonPosition,
} = usePreferences();
const slots = useSlots();
const { refresh } = useRefresh();

function isHeaderPosition(pos?: string): boolean {
  return pos === 'header' || pos === 'header-left' || pos === 'header-right';
}

function resolveHeaderZone(pos?: string): 'left' | 'right' | null {
  if (pos === 'header-left') return 'left';
  if (pos === 'header' || pos === 'header-right') return 'right';
  return null;
}

const showLockInHeader = computed(
  () =>
    preferences.widget.lockScreen &&
    isHeaderPosition(preferences.widget.lockScreenButtonPosition),
);

const showLogoutInHeader = computed(() =>
  isHeaderPosition(preferences.widget.logoutButtonPosition),
);

const enableLockScreenShortcutKey = computed(() => {
  return showLockInHeader.value && globalLockScreenShortcutKey.value;
});

const enableLogoutShortcutKey = computed(() => {
  return showLogoutInHeader.value && globalLogoutShortcutKey.value;
});

const lockOpen = ref(false);
const logoutOpen = ref(false);

function handleOpenLock() {
  lockOpen.value = true;
}

function handleSubmitLock(lockScreenPassword: string) {
  lockOpen.value = false;
  accessStore.lockScreen(lockScreenPassword);
}

function handleLogout() {
  logoutOpen.value = true;
}

function handleSubmitLogout() {
  emit('logout');
  logoutOpen.value = false;
}

// Keyboard shortcuts
const keys = useMagicKeys({
  onEventFired(e) {
    if (e.type !== 'keydown' || !e.altKey) return;
    if (
      (e.code === 'KeyQ' && enableLogoutShortcutKey.value) ||
      (e.code === 'KeyL' && enableLockScreenShortcutKey.value)
    ) {
      e.preventDefault();
    }
  },
});
const lockKey = keys['Alt+KeyL'];
const logoutKey = keys['Alt+KeyQ'];

if (lockKey) {
  whenever(lockKey, () => {
    if (enableLockScreenShortcutKey.value) {
      handleOpenLock();
    }
  });
}

if (logoutKey) {
  whenever(logoutKey, () => {
    if (enableLogoutShortcutKey.value) {
      handleLogout();
    }
  });
}

type SlotItem = { index: number; name: string };

const widgetConfigMap = computed<
  Record<string, { slotName: string; zone: 'left' | 'right' | null }>
>(() => {
  const prefZone = preferencesButtonPosition.value.header
    ? resolveHeaderZone(
        (preferences.app.preferencesButtonPosition as string) === 'header-left'
          ? 'header-left'
          : 'header-right',
      )
    : null;

  return {
    logo: {
      slotName: 'logo',
      zone: preferences.widget.logo
        ? resolveHeaderZone(preferences.widget.logoButtonPosition)
        : null,
    },
    breadcrumb: {
      slotName: 'breadcrumb',
      zone: resolveHeaderZone(preferences.widget.breadcrumbButtonPosition),
    },
    globalSearch: {
      slotName: 'global-search',
      zone: preferences.widget.globalSearch
        ? resolveHeaderZone(preferences.widget.globalSearchButtonPosition)
        : null,
    },
    preferences: {
      slotName: 'preferences',
      zone: prefZone,
    },
    themeToggle: {
      slotName: 'theme-toggle',
      zone: preferences.widget.themeToggle
        ? resolveHeaderZone(preferences.widget.themeToggleButtonPosition)
        : null,
    },
    languageToggle: {
      slotName: 'language-toggle',
      zone: preferences.widget.languageToggle
        ? resolveHeaderZone(preferences.widget.languageToggleButtonPosition)
        : null,
    },
    timezone: {
      slotName: 'timezone',
      zone: preferences.widget.timezone
        ? resolveHeaderZone(preferences.widget.timezoneButtonPosition)
        : null,
    },
    fullscreen: {
      slotName: 'fullscreen',
      zone: preferences.widget.fullscreen
        ? resolveHeaderZone(preferences.widget.fullscreenButtonPosition)
        : null,
    },
    refresh: {
      slotName: 'refresh',
      zone: preferences.widget.refresh
        ? resolveHeaderZone(preferences.widget.refreshButtonPosition)
        : null,
    },
    notification: {
      slotName: 'notification',
      zone: preferences.widget.notification
        ? resolveHeaderZone(preferences.widget.notificationButtonPosition)
        : null,
    },
    lockScreenBtn: {
      slotName: 'lock-screen-btn',
      zone: preferences.widget.lockScreen
        ? resolveHeaderZone(preferences.widget.lockScreenButtonPosition)
        : null,
    },
    logoutBtn: {
      slotName: 'logout-btn',
      zone: resolveHeaderZone(preferences.widget.logoutButtonPosition),
    },
    userDropdown: {
      slotName: 'user-dropdown',
      zone: resolveHeaderZone(preferences.widget.userDropdownButtonPosition),
    },
  };
});

function buildZoneSlots(targetZone: 'left' | 'right'): SlotItem[] {
  const list: SlotItem[] = [];
  const prefix = targetZone === 'left' ? 'header-left' : 'header-right';

  for (const key of preferences.widget.order) {
    const entry = widgetConfigMap.value[key];
    if (entry?.zone === targetZone) {
      list.push({
        index: REFERENCE_VALUE + list.length,
        name: entry.slotName,
      });
    }
  }

  Object.keys(slots).forEach((key) => {
    if (key.startsWith(prefix)) {
      const slotIndex = Number(key.split('-')[2]);
      const index = Number.isNaN(slotIndex) ? nextIndex(list) : slotIndex;
      list.push({ index, name: key });
    }
  });

  return list.toSorted((a, b) => a.index - b.index);
}

const leftSlots = computed(() => buildZoneSlots('left'));
const rightSlots = computed(() => buildZoneSlots('right'));

function nextIndex(list: Array<SlotItem>) {
  const index =
    list.length > 0 ? Math.max(...list.map((item) => item.index)) : 0;
  return index + 1;
}

function openGlobalSearch() {
  window.dispatchEvent(
    new CustomEvent('open-command-palette', {
      detail: { mode: 'navigation', initialValue: '' },
    }),
  );
}

onMounted(() => {
  const handleOpenLockModal = () => {
    if (showLockInHeader.value) {
      lockOpen.value = true;
    }
  };
  window.addEventListener('open-lock-screen-modal', handleOpenLockModal);
  onUnmounted(() => {
    window.removeEventListener('open-lock-screen-modal', handleOpenLockModal);
  });
});
</script>

<template>
  <LockScreenModal
    v-model:open="lockOpen"
    v-if="showLockInHeader || lockOpen"
    :avatar="avatar"
    :text="text"
    @submit="handleSubmitLock"
  />

  <LogoutConfirmation
    v-if="showLogoutInHeader"
    v-model:open="logoutOpen"
    @confirm="handleSubmitLogout"
  />

  <div class="flex h-full min-w-0 shrink-0 items-center">
    <template v-for="slot in leftSlots" :key="slot.name">
      <div
        v-if="slot.name === 'breadcrumb'"
        class="hidden h-full items-center lg:flex"
      >
        <slot name="breadcrumb"></slot>
      </div>
      <slot v-else :name="slot.name">
        <HeaderWidget
          :name="slot.name"
          :is-fullscreen="isFullscreen"
          :global-search-shortcut-key="globalSearchShortcutKey"
          @open-global-search="openGlobalSearch"
          @toggle-fullscreen="toggleFullscreen"
          @open-lock="handleOpenLock"
          @logout="handleLogout"
          @refresh="refresh"
        />
      </slot>
    </template>
  </div>

  <div
    :class="`menu-align-${preferences.header.menuAlign}`"
    class="flex h-full min-w-0 flex-1 items-center"
  >
    <slot name="menu"></slot>
  </div>
  <div class="flex-1 h-full min-w-8"></div>
  <div class="flex h-full min-w-0 shrink-0 items-center">
    <template v-for="slot in rightSlots" :key="slot.name">
      <div
        v-if="slot.name === 'breadcrumb'"
        class="hidden h-full items-center lg:flex"
      >
        <slot name="breadcrumb"></slot>
      </div>
      <slot v-else :name="slot.name">
        <HeaderWidget
          :name="slot.name"
          :is-fullscreen="isFullscreen"
          :global-search-shortcut-key="globalSearchShortcutKey"
          @open-global-search="openGlobalSearch"
          @toggle-fullscreen="toggleFullscreen"
          @open-lock="handleOpenLock"
          @logout="handleLogout"
          @refresh="refresh"
        />
      </slot>
    </template>
  </div>
</template>
<style lang="scss" scoped>
.menu-align-start {
  --menu-align: start;
}

.menu-align-center {
  --menu-align: center;
}

.menu-align-end {
  --menu-align: end;
}
</style>
