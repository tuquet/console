<script lang="ts" setup>
import type { GrowthPoint } from '#/api';

import { computed } from 'vue';

import { $t } from '@vben/locales';

import { AreaChart } from '@vben-core/shadcn-ui';

const props = defineProps<{
  data: GrowthPoint[];
}>();

const categoryLabel = computed(() => $t('term.workspace'));

const chartData = computed(() => {
  if (!props.data || props.data.length === 0) return [];
  const label = categoryLabel.value;
  return props.data.map((d) => ({
    [label]: d.count,
    date: d.date,
  }));
});
</script>

<template>
  <div class="h-64 w-full sm:h-80">
    <AreaChart
      :data="chartData"
      index="date"
      :categories="[categoryLabel]"
      :show-gradient="true"
      class="h-full w-full"
    />
  </div>
</template>
