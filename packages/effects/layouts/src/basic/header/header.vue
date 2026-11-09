<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, useSlots } from 'vue';

import { useRefresh } from '@operon/hooks';
import {
  LockKeyhole,
  LogOut,
  Maximize,
  Minimize,
  RotateCw,
} from '@operon/icons';
import { $t } from '@operon/locales';
import { preferences, usePreferences } from '@operon/preferences';
import { useAccessStore } from '@operon/stores';

import { Button } from '@operon-core/shadcn-ui';

import { useFullscreen, useMagicKeys, whenever } from '@vueuse/core';

import {
  GlobalSearch,
  LanguageToggle,
  LockScreenModal,
  Notification,
  PreferencesButton,
  ThemeToggle,
  TimezoneButton,
} from '../../widgets';
import LogoutConfirmation from '../../widgets/logout-confirmation.vue';

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

const showLockInHeader = computed(
  () =>
    preferences.widget.lockScreen &&
    preferences.widget.lockScreenButtonPosition === 'header',
);

const showLogoutInHeader = computed(
  () => preferences.widget.logoutButtonPosition === 'header',
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

/**
 * Slot list item type
 */
type SlotItem = { index: number; name: string };

const rightSlots = computed(() => {
  const list: Array<SlotItem> = [];

  // Iterate by widget.order and check if each widget should display in header
  const widgetChecks: Record<string, { slotName: string; visible: boolean }> = {
    globalSearch: {
      visible:
        preferences.widget.globalSearch &&
        preferences.widget.globalSearchButtonPosition === 'header',
      slotName: 'global-search',
    },
    preferences: {
      visible: preferencesButtonPosition.value.header,
      slotName: 'preferences',
    },
    themeToggle: {
      visible:
        preferences.widget.themeToggle &&
        preferences.widget.themeToggleButtonPosition === 'header',
      slotName: 'theme-toggle',
    },
    languageToggle: {
      visible:
        preferences.widget.languageToggle &&
        preferences.widget.languageToggleButtonPosition === 'header',
      slotName: 'language-toggle',
    },
    timezone: {
      visible:
        preferences.widget.timezone &&
        preferences.widget.timezoneButtonPosition === 'header',
      slotName: 'timezone',
    },
    fullscreen: {
      visible:
        preferences.widget.fullscreen &&
        preferences.widget.fullscreenButtonPosition === 'header',
      slotName: 'fullscreen',
    },
    refresh: {
      visible:
        preferences.widget.refresh &&
        preferences.widget.refreshButtonPosition === 'header',
      slotName: 'refresh',
    },
    notification: {
      visible:
        preferences.widget.notification &&
        preferences.widget.notificationButtonPosition === 'header',
      slotName: 'notification',
    },
    lockScreenBtn: {
      visible:
        preferences.widget.lockScreen &&
        preferences.widget.lockScreenButtonPosition === 'header',
      slotName: 'lock-screen-btn',
    },
    logoutBtn: {
      visible: preferences.widget.logoutButtonPosition === 'header',
      slotName: 'logout-btn',
    },
  };

  for (const key of preferences.widget.order) {
    const check = widgetChecks[key];
    if (check?.visible) {
      list.push({ index: REFERENCE_VALUE + list.length, name: check.slotName });
    }
  }

  // Append user custom slots (header-right-N) at the end
  Object.keys(slots).forEach((key) => {
    if (key.startsWith('header-right')) {
      const slotIndex = Number(key.split('-')[2]);
      const index = Number.isNaN(slotIndex) ? nextIndex(list) : slotIndex;
      list.push({ index, name: key });
    }
  });
  // Append user dropdown after the configured widgets.
  const userDropdownIndex = Math.min(1000, nextIndex(list));
  list.push({ index: userDropdownIndex, name: 'user-dropdown' });

  // Sort by index to maintain slot order
  return list.toSorted((a, b) => a.index - b.index);
});

const leftSlots = computed(() => {
  const list: Array<SlotItem> = [];

  Object.keys(slots).forEach((key) => {
    // Adapt slot name, e.g. first slot name: header-left-1
    if (key.startsWith('header-left')) {
      // Extract third placeholder number; assign fallback sort index if not a number
      const slotIndex = Number(key.split('-')[2]);
      const index = Number.isNaN(slotIndex) ? nextIndex(list) : slotIndex;
      list.push({ index, name: key });
    }
  });
  // Sort by index to maintain slot order
  return list.toSorted((a, b) => a.index - b.index);
});

/**
 * Get next index value in list (for sorting)
 * @param list List
 */
function nextIndex(list: Array<SlotItem>) {
  const index =
    list.length > 0 ? Math.max(...list.map((item) => item.index)) : 0;
  return index + 1;
}

function clearPreferencesAndLogout() {
  emit('clearPreferencesAndLogout');
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

  <template
    v-for="slot in leftSlots.filter((item) => item.index < REFERENCE_VALUE)"
    :key="slot.name"
  >
    <slot :name="slot.name">
      <template v-if="slot.name === 'refresh'">
        <Button
          class="my-0 mr-1 rounded-md"
          @click="refresh"
          variant="ghost"
          size="icon"
        >
          <RotateCw />
        </Button>
      </template>
    </slot>
  </template>
  <div class="hidden h-full items-center lg:flex">
    <slot name="breadcrumb"></slot>
  </div>
  <template
    v-for="slot in leftSlots.filter((item) => item.index > REFERENCE_VALUE)"
    :key="slot.name"
  >
    <slot :name="slot.name"></slot>
  </template>
  <div
    :class="`menu-align-${preferences.header.menuAlign}`"
    class="flex h-full min-w-0 flex-1 items-center"
  >
    <slot name="menu"></slot>
  </div>
  <div class="flex-1 h-full min-w-8"></div>
  <div class="flex h-full min-w-0 shrink-0 items-center">
    <template v-for="slot in rightSlots" :key="slot.name">
      <slot :name="slot.name">
        <template v-if="slot.name === 'global-search'">
          <GlobalSearch
            :enable-shortcut-key="globalSearchShortcutKey"
            :menus="accessStore.accessMenus"
            class="mr-1"
          />
        </template>

        <template v-else-if="slot.name === 'preferences'">
          <PreferencesButton
            class="mr-1 hidden md:flex"
            @clear-preferences-and-logout="clearPreferencesAndLogout"
          />
        </template>
        <template v-else-if="slot.name === 'theme-toggle'">
          <ThemeToggle class="mr-1 hidden md:flex" />
        </template>
        <template v-else-if="slot.name === 'language-toggle'">
          <LanguageToggle class="mr-1 hidden md:flex" />
        </template>
        <template v-else-if="slot.name === 'fullscreen'">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="mr-1 hidden md:flex"
            :title="$t('preferences.widget.fullscreen')"
            :aria-label="$t('preferences.widget.fullscreen')"
            :aria-pressed="isFullscreen"
            @click="toggleFullscreen"
          >
            <Minimize v-if="isFullscreen" />
            <Maximize v-else />
          </Button>
        </template>
        <template v-else-if="slot.name === 'timezone'">
          <TimezoneButton class="mr-1 hidden md:flex" />
        </template>
        <template v-else-if="slot.name === 'lock-screen-btn'">
          <Button
            class="mr-1 hidden md:flex"
            :aria-label="$t('ui.widgets.lockScreen.title')"
            :title="$t('ui.widgets.lockScreen.title')"
            @click="handleOpenLock"
            variant="ghost"
            size="icon"
          >
            <LockKeyhole />
          </Button>
        </template>
        <template v-else-if="slot.name === 'logout-btn'">
          <Button
            class="mr-1 hidden md:flex"
            :aria-label="$t('common.logout')"
            :title="$t('common.logout')"
            @click="handleLogout"
            variant="ghost"
            size="icon"
          >
            <LogOut />
          </Button>
        </template>
        <template v-else-if="slot.name === 'notification'">
          <Notification class="mr-1" />
        </template>
        <template v-else-if="slot.name === 'refresh'">
          <Button
            class="my-0 mr-1 rounded-md"
            :aria-label="$t('preferences.widget.refresh')"
            :title="$t('preferences.widget.refresh')"
            @click="refresh"
            variant="ghost"
            size="icon"
          >
            <RotateCw />
          </Button>
        </template>
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
