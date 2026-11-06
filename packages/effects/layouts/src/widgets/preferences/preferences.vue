<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Settings } from '@operon/icons';
import { $t, loadLocaleMessages } from '@operon/locales';
import { preferences, updatePreferences } from '@operon/preferences';
import { capitalizeFirstLetter } from '@operon/utils';

import { VbenButton } from '@operon-core/shadcn-ui';

import PreferencesModal from './preferences-modal.vue';

interface Props {
  /** Whether to show button */
  showButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showButton: true,
});

const emit = defineEmits<{ clearPreferencesAndLogout: [] }>();

const open = ref(false);

// Expose method to open preferences modal
defineExpose({
  open: () => {
    open.value = true;
  },
});

/**
 * Transform preferences to Vue props
 * preferences.widget.fullscreen=>widgetFullscreen
 */
const attrs = computed(() => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(preferences)) {
    for (const [subKey, subValue] of Object.entries(value)) {
      result[`${key}${capitalizeFirstLetter(subKey)}`] = subValue;
    }
  }
  return result;
});

/**
 * Transform preferences to Vue listeners
 * preferences.widget.fullscreen=>@update:widgetFullscreen
 */
const listen = computed(() => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(preferences)) {
    if (typeof value === 'object') {
      for (const subKey of Object.keys(value)) {
        result[`update:${key}${capitalizeFirstLetter(subKey)}`] = async (
          val: any,
        ) => {
          const currentVal = (preferences as Record<string, any>)[key]?.[
            subKey
          ];
          if (!Array.isArray(val) && currentVal === val) {
            return;
          }
          updatePreferences({ [key]: { [subKey]: val } });
          if (key === 'app' && subKey === 'locale') {
            await loadLocaleMessages(val);
          }
        };
      }
    } else {
      result[key] = value;
    }
  }
  return result;
});
</script>
<template>
  <div>
    <PreferencesModal
      v-model:open="open"
      :widget-order="[...preferences.widget.order]"
      v-bind="{ ...$attrs, ...attrs }"
      v-on="listen"
      @clear-preferences-and-logout="emit('clearPreferencesAndLogout')"
    />

    <!-- Button to open preferences (can be overridden) -->
    <slot>
      <VbenButton
        v-if="props.showButton"
        :title="$t('preferences.title')"
        class="flex-col-center size-10 cursor-pointer rounded-l-lg rounded-r-none border-none bg-primary"
        @click="open = true"
      >
        <Settings class="size-5" />
      </VbenButton>
    </slot>
  </div>
</template>
