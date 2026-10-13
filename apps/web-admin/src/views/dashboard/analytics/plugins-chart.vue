<script lang="ts" setup>
import { computed } from 'vue';

import { DonutChart } from '@vben-core/shadcn-ui';

const props = defineProps<{
  coreCount: number;
  moduleCount: number;
}>();

const chartData = computed(() => {
  return [
    {
      name: 'Core Kernel (System)',
      value: props.coreCount,
    },
    {
      name: 'Service Modules',
      value: props.moduleCount,
    },
  ].filter((item) => item.value > 0);
});

const colors = [
  '#0284c7', // Core Kernel (System): Sky-600
  '#10b981', // Service Modules: Emerald-500
];
</script>

<template>
  <div class="flex h-64 w-full items-center justify-center sm:h-80">
    <DonutChart
      :colors="colors"
      :data="chartData"
      category="value"
      class="h-full w-full"
      index="name"
    />
  </div>
</template>
