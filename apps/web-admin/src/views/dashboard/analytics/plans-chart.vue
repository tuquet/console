<script lang="ts" setup>
import type { PlanBreakdown } from '#/api';

import { computed } from 'vue';

import { DonutChart } from '@vben-core/shadcn-ui';

const props = defineProps<{
  data: PlanBreakdown;
}>();

const chartData = computed(() => {
  if (!props.data) return [];
  return [
    {
      name: 'Pro Plan',
      value: props.data.pro,
    },
    {
      name: 'Free Tier',
      value: props.data.free,
    },
    {
      name: 'Enterprise',
      value: props.data.enterprise,
    },
  ].filter((item) => item.value > 0);
});

const colors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
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
