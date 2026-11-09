<script setup lang="ts">
import type { Component } from 'vue';

import type { LayoutType } from '@operon/types';

import { computed, useId } from 'vue';

import { $t } from '@operon/locales';

import { Label, RadioGroup, RadioGroupItem } from '@operon-core/shadcn-ui';

import {
  FullContent,
  HeaderMixedNav,
  HeaderNav,
  HeaderSidebarNav,
  MixedNav,
  SidebarNav,
} from '../../icons';

interface PresetItem {
  name: string;
  tip: string;
  type: LayoutType;
}

defineOptions({
  name: 'PreferenceLayout',
});

const id = useId();
const modelValue = defineModel<LayoutType>({ default: 'sidebar-nav' });

const components: Record<LayoutType, Component> = {
  'full-content': FullContent,
  'header-nav': HeaderNav,
  'mixed-nav': MixedNav,
  'sidebar-nav': SidebarNav,
  'header-mixed-nav': HeaderMixedNav,
  'header-sidebar-nav': HeaderSidebarNav,
};

const PRESET = computed((): PresetItem[] => [
  {
    name: $t('preferences.vertical'),
    tip: $t('preferences.verticalTip'),
    type: 'sidebar-nav',
  },
  {
    name: $t('preferences.horizontal'),
    tip: $t('preferences.horizontalTip'),
    type: 'header-nav',
  },
  {
    name: $t('preferences.headerSidebarNav'),
    tip: $t('preferences.headerSidebarNavTip'),
    type: 'header-sidebar-nav',
  },
  {
    name: $t('preferences.mixedMenu'),
    tip: $t('preferences.mixedMenuTip'),
    type: 'mixed-nav',
  },
  {
    name: $t('preferences.headerTwoColumn'),
    tip: $t('preferences.headerTwoColumnTip'),
    type: 'header-mixed-nav',
  },
  {
    name: $t('preferences.fullContent'),
    tip: $t('preferences.fullContentTip'),
    type: 'full-content',
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
        :title="theme.tip"
        class="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-input p-3 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-ring"
      >
        <component :is="components[theme.type]" />
        <span class="text-center">{{ theme.name }}</span>
      </Label>
    </div>
  </RadioGroup>
</template>
