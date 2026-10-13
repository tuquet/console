<script lang="ts" setup>
import type { GrowthPoint } from '#/api';

import { computed } from 'vue';

import { AreaChart } from '@vben-core/shadcn-ui';

const props = defineProps<{
  data: GrowthPoint[];
}>();

const chartData = computed(() => {
  if (!props.data || props.data.length === 0) return [];
  return props.data.map((d) => ({
    count: d.count,
    date: d.date,
  }));
});
</script>

<template>
  <div class="h-64 w-full sm:h-80">
    <AreaChart
      :data="chartData"
      index="date"
      :categories="['count']"
      :colors="['hsl(var(--chart-1))']"
      :show-gradient="true"
      class="h-full w-full"
    />
  </div>
</template>
