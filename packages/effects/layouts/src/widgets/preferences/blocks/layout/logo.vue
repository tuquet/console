<script setup lang="ts">
import type { SelectOption } from '@operon/types';

import { computed } from 'vue';

import { $t } from '@operon/locales';

import SelectItem from '../select-item.vue';
import SwitchItem from '../switch-item.vue';

const logoEnable = defineModel<boolean>('logoEnable');
const logoShowText = defineModel<boolean>('logoShowText');
const logoMode = defineModel<'full' | 'icon' | undefined>('logoMode', {
  default: undefined,
});

const logoModeItems = computed((): SelectOption[] => [
  {
    label: $t('preferences.logo.modeIcon'),
    value: 'icon',
  },
  {
    label: $t('preferences.logo.modeFull'),
    value: 'full',
  },
]);
</script>

<template>
  <SwitchItem v-model="logoEnable">
    {{ $t('preferences.logo.visible') }}
  </SwitchItem>
  <SwitchItem v-model="logoShowText" :disabled="!logoEnable">
    {{ $t('preferences.logo.showText') }}
  </SwitchItem>
  <SelectItem v-model="logoMode" :disabled="!logoEnable" :items="logoModeItems">
    {{ $t('preferences.logo.mode') }}
  </SelectItem>
</template>
