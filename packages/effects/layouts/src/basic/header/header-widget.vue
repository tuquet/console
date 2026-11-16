<script lang="ts" setup>
import { useRouter } from 'vue-router';

import {
  LockKeyhole,
  LogOut,
  Maximize,
  Minimize,
  RotateCw,
  Search,
} from '@operon/icons';
import { $t } from '@operon/locales';
import { preferences } from '@operon/preferences';
import { isWindowsOs } from '@operon/utils';

import { Button, VbenLogo } from '@operon-core/shadcn-ui';

import {
  LanguageToggle,
  Notification,
  PreferencesButton,
  ThemeToggle,
  TimezoneButton,
} from '../../widgets';

defineProps<{
  globalSearchShortcutKey?: boolean;
  isFullscreen: boolean;
  name: string;
}>();

defineEmits<{
  logout: [];
  openGlobalSearch: [];
  openLock: [];
  refresh: [];
  toggleFullscreen: [];
}>();

const router = useRouter();
</script>

<template>
  <VbenLogo
    v-if="name === 'logo'"
    :src="preferences.logo.source"
    :src-dark="preferences.logo.sourceDark"
    :text="preferences.app.name"
    :logo-size="22"
    collapsed
    class="mr-1 cursor-pointer"
    @click="router.push(preferences.app.defaultHomePath)"
  />

  <Button
    v-else-if="name === 'global-search'"
    type="button"
    variant="ghost"
    size="icon"
    class="mr-1"
    :title="$t('ui.widgets.search.title')"
    :aria-label="$t('ui.widgets.search.title')"
    :aria-keyshortcuts="
      globalSearchShortcutKey
        ? isWindowsOs()
          ? 'Control+K'
          : 'Meta+K'
        : undefined
    "
    @click="$emit('openGlobalSearch')"
  >
    <Search />
  </Button>

  <PreferencesButton
    v-else-if="name === 'preferences'"
    class="mr-1 hidden md:flex"
  />
  <ThemeToggle
    v-else-if="name === 'theme-toggle'"
    class="mr-1 hidden md:flex"
  />
  <LanguageToggle
    v-else-if="name === 'language-toggle'"
    class="mr-1 hidden md:flex"
  />

  <Button
    v-else-if="name === 'fullscreen'"
    type="button"
    variant="ghost"
    size="icon"
    class="mr-1 hidden md:flex"
    :title="$t('preferences.widget.fullscreen')"
    :aria-label="$t('preferences.widget.fullscreen')"
    :aria-pressed="isFullscreen"
    @click="$emit('toggleFullscreen')"
  >
    <Minimize v-if="isFullscreen" />
    <Maximize v-else />
  </Button>

  <TimezoneButton v-else-if="name === 'timezone'" class="mr-1 hidden md:flex" />

  <Button
    v-else-if="name === 'lock-screen-btn'"
    class="mr-1 hidden md:flex"
    :aria-label="$t('ui.widgets.lockScreen.title')"
    :title="$t('ui.widgets.lockScreen.title')"
    variant="ghost"
    size="icon"
    @click="$emit('openLock')"
  >
    <LockKeyhole />
  </Button>

  <Button
    v-else-if="name === 'logout-btn'"
    class="mr-1 hidden md:flex"
    :aria-label="$t('common.logout')"
    :title="$t('common.logout')"
    variant="ghost"
    size="icon"
    @click="$emit('logout')"
  >
    <LogOut />
  </Button>

  <Notification v-else-if="name === 'notification'" class="mr-1" />

  <Button
    v-else-if="name === 'refresh'"
    class="my-0 mr-1 rounded-md"
    :aria-label="$t('preferences.widget.refresh')"
    :title="$t('preferences.widget.refresh')"
    variant="ghost"
    size="icon"
    @click="$emit('refresh')"
  >
    <RotateCw />
  </Button>
</template>
