<script setup lang="ts">
import type { SelectOption } from '@operon/types';

import { computed } from 'vue';

import { $t } from '@operon/locales';

import SelectItem from '../select-item.vue';

type LogoDisplayMode = 'full' | 'hidden' | 'icon';

const logoEnable = defineModel<boolean>('logoEnable');
const logoShowText = defineModel<boolean>('logoShowText');
const logoMode = defineModel<'full' | 'icon' | undefined>('logoMode', {
  default: undefined,
});

const logoModeItems = computed((): SelectOption[] => [
  {
    label: $t('preferences.logo.modeHidden'),
    value: 'hidden',
  },
  {
    label: $t('preferences.logo.modeIcon'),
    value: 'icon',
  },
  {
    label: $t('preferences.logo.modeFull'),
    value: 'full',
  },
]);

/** Derive a single display-mode value from the three underlying prefs */
const displayMode = computed<LogoDisplayMode>({
  get() {
    if (!logoEnable.value) return 'hidden';
    return logoShowText.value ? 'full' : 'icon';
  },
  set(val: LogoDisplayMode) {
    if (val === 'hidden') {
      logoEnable.value = false;
    } else if (val === 'icon') {
      logoEnable.value = true;
      logoShowText.value = false;
      logoMode.value = 'icon';
    } else {
      logoEnable.value = true;
      logoShowText.value = true;
      logoMode.value = 'full';
    }
  },
});
</script>

<template>
  <SelectItem v-model="displayMode" :items="logoModeItems">
    {{ $t('preferences.logo.mode') }}
  </SelectItem>
</template>
