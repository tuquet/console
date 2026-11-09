<script setup lang="ts">
import type { Component } from 'vue';

import { computed, useId } from 'vue';

import { $t } from '@operon/locales';

import { Label, RadioGroup, RadioGroupItem } from '@operon-core/shadcn-ui';

import { ContentCompact, ContentWide } from '../../icons';

defineOptions({
  name: 'PreferenceLayoutContent',
});

const id = useId();
const modelValue = defineModel<string>({ default: 'wide' });

const components: Record<string, Component> = {
  compact: ContentCompact,
  wide: ContentWide,
};

const PRESET = computed(() => [
  {
    name: $t('preferences.wide'),
    type: 'wide',
  },
  {
    name: $t('preferences.compact'),
    type: 'compact',
  },
]);
</script>

<template>
  <RadioGroup
    v-model="modelValue"
    class="grid grid-cols-2 gap-4 sm:grid-cols-3"
  >
    <div v-for="theme in PRESET" :key="theme.type" class="min-w-0">
      <RadioGroupItem
        :id="`${id}-${theme.type}`"
        :value="theme.type"
        class="peer sr-only"
      />
      <Label
        :for="`${id}-${theme.type}`"
        class="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-input p-3 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-ring"
      >
        <component :is="components[theme.type]" />
        <span class="text-center">{{ theme.name }}</span>
      </Label>
    </div>
  </RadioGroup>
</template>
