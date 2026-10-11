<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { nextTick, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const props = defineProps<{
  coreCount: number;
  moduleCount: number;
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

function updateChart() {
  const chartData = [
    {
      itemStyle: { color: '#0284c7' },
      name: 'Core Kernel (System)',
      value: props.coreCount,
    },
    {
      itemStyle: { color: '#10b981' },
      name: 'Service Modules',
      value: props.moduleCount,
    },
  ].filter((item) => item.value > 0);

  nextTick(() => {
    renderEcharts({
      legend: {
        bottom: '2%',
        left: 'center',
        textStyle: { color: '#94a3b8' },
      },
      series: [
        {
          data: chartData,
          itemStyle: {
            borderColor: '#0f172a',
            borderRadius: 6,
            borderWidth: 2,
          },
          label: {
            formatter: '{b}\n{c} Plugins',
            show: true,
          },
          name: 'Hệ Sinh Thái Plugins',
          radius: ['40%', '65%'],
          roseType: 'radius',
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

watch(() => [props.coreCount, props.moduleCount], updateChart, {
  immediate: true,
});
</script>

<template>
  <div class="h-64 w-full sm:h-80">
    <EchartsUI ref="chartRef" />
  </div>
</template>
