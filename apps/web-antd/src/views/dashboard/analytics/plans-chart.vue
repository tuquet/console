<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { PlanBreakdown } from '#/api';

import { nextTick, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const props = defineProps<{
  data: PlanBreakdown;
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

function updateChart() {
  if (!props.data) return;

  const chartData = [
    {
      itemStyle: { color: '#38bdf8' },
      name: 'Pro Plan',
      value: props.data.pro,
    },
    {
      itemStyle: { color: '#94a3b8' },
      name: 'Free Tier',
      value: props.data.free,
    },
    {
      itemStyle: { color: '#a855f7' },
      name: 'Enterprise',
      value: props.data.enterprise,
    },
  ].filter((item) => item.value > 0);

  nextTick(() => {
    renderEcharts({
      legend: {
        bottom: '2%',
        itemGap: 12,
        itemHeight: 10,
        itemWidth: 10,
        left: 'center',
        textStyle: { color: '#94a3b8', fontSize: 11 },
      },
      series: [
        {
          avoidLabelOverlap: true,
          center: ['50%', '42%'],
          data: chartData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              shadowOffsetX: 0,
            },
            label: {
              color: '#f8fafc',
              fontSize: 13,
              fontWeight: 'bold',
              show: true,
            },
          },
          itemStyle: {
            borderColor: '#0f172a',
            borderRadius: 6,
            borderWidth: 2,
          },
          label: {
            formatter: '{b}: {c}',
            show: false,
          },
          name: 'Gói Dịch Vụ',
          radius: ['38%', '62%'],
          type: 'pie',
        },
      ],
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        borderColor: 'rgba(71, 85, 105, 0.6)',
        textStyle: { color: '#f8fafc' },
        trigger: 'item',
      },
    });
  });
}

watch(() => props.data, updateChart, { deep: true, immediate: true });
</script>

<template>
  <div class="h-64 w-full sm:h-80">
    <EchartsUI ref="chartRef" />
  </div>
</template>
