<script setup lang="ts">
import type { MenuRecordRaw } from '@operon/types';

import { onMounted, onUnmounted, ref } from 'vue';

import { Search } from '@operon/icons';
import { $t } from '@operon/locales';
import { isWindowsOs } from '@operon/utils';

import {
  Button,
  CommandDialog,
  CommandInput,
  CommandList,
} from '@operon-core/shadcn-ui';

import { useMagicKeys, whenever } from '@vueuse/core';

import SearchPanel from './search-panel.vue';

defineOptions({
  name: 'GlobalSearch',
});

const props = withDefaults(
  defineProps<{
    enableShortcutKey?: boolean;
    menus?: MenuRecordRaw[];
    /** Whether to show trigger button (can hide when embedded in containers like dropdown) */
    showButton?: boolean;
  }>(),
  {
    enableShortcutKey: true,
    menus: () => [],
    showButton: true,
  },
);

const open = ref(false);
const keyword = ref('');

function handleClose() {
  open.value = false;
  keyword.value = '';
}

function toggleOpen() {
  open.value = !open.value;
}

// Reset keyword when dialog closes
function handleOpenChange(val: boolean) {
  if (!val) keyword.value = '';
}

const keys = useMagicKeys();
const cmd = isWindowsOs() ? keys['ctrl+k'] : keys['cmd+k'];
if (cmd) {
  whenever(cmd, () => {
    if (props.enableShortcutKey) {
      open.value = true;
    }
  });
}

const preventDefaultBrowserSearchHotKey = (event: KeyboardEvent) => {
  if (event.key?.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
  }
};

const toggleKeydownListener = () => {
  if (props.enableShortcutKey) {
    window.addEventListener('keydown', preventDefaultBrowserSearchHotKey);
  } else {
    window.removeEventListener('keydown', preventDefaultBrowserSearchHotKey);
  }
};

// Expose to parent component to allow triggering search modal externally
defineExpose({
  open: () => (open.value = true),
  close: () => (open.value = false),
  toggle: toggleOpen,
});

onMounted(() => {
  toggleKeydownListener();

  // Allow external components (e.g. titlebar menubar) to open the search
  // modal via a lightweight custom event: window.dispatchEvent(new Event('open-global-search'))
  const handleExternalOpen = () => (open.value = true);
  window.addEventListener('open-global-search', handleExternalOpen);

  onUnmounted(() => {
    window.removeEventListener('keydown', preventDefaultBrowserSearchHotKey);
    window.removeEventListener('open-global-search', handleExternalOpen);
  });
});
</script>

<template>
  <div>
    <CommandDialog
      v-model:open="open"
      close-class="top-3"
      @update:open="handleOpenChange"
    >
      <!--
        We bypass CommandDialog's internal filter (filterState.search) in favour of
        SearchPanel's own throttled fuzzy search. CommandInput is used only as a
        styled text field — its value is kept in sync with our `keyword` ref.
      -->
      <CommandInput
        v-model="keyword"
        :filter-fn="() => true"
        :placeholder="$t('ui.widgets.search.searchNavigate')"
      />
      <CommandList class="max-h-[450px]">
        <SearchPanel :keyword="keyword" :menus="menus" @close="handleClose" />
      </CommandList>
    </CommandDialog>

    <Button
      v-if="showButton"
      type="button"
      variant="ghost"
      size="icon"
      :title="$t('ui.widgets.search.title')"
      :aria-label="$t('ui.widgets.search.title')"
      :aria-keyshortcuts="
        enableShortcutKey ? (isWindowsOs() ? 'Control+K' : 'Meta+K') : undefined
      "
      @click="toggleOpen"
    >
      <Search />
    </Button>
  </div>
</template>
