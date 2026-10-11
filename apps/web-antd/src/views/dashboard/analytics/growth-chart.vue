<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { GrowthPoint } from '#/api';

import { nextTick, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const props = defineProps<{
  data: GrowthPoint[];
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

function updateChart() {
  if (!props.data || props.data.length === 0) return;

  const dates = props.data.map((d) => d.date);
  const counts = props.data.map((d) => d.count);

  nextTick(() => {
    renderEcharts({
      grid: {
        bottom: '8%',
        containLabel: true,
        left: '2%',
        right: '4%',
        top: '12%',
      },
      series: [
        {
          areaStyle: {
            color: {
              colorStops: [
                { color: 'rgba(56, 189, 248, 0.4)', offset: 0 },
                { color: 'rgba(56, 189, 248, 0.02)', offset: 1 },
              ],
              type: 'linear',
              x: 0,
              x2: 0,
              y: 0,
              y2: 1,
            },
          },
          data: counts,
          itemStyle: {
            color: '#38bdf8',
          },
          lineStyle: {
            color: '#38bdf8',
            width: 2.5,
          },
          name: 'Tổng số Workspace',
          smooth: true,
          symbolSize: 8,
          type: 'line',
        },
      ],
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        borderColor: 'rgba(71, 85, 105, 0.6)',
        textStyle: { color: '#f8fafc' },
        trigger: 'axis',
      },
      xAxis: {
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
        boundaryGap: false,
        data: dates,
        type: 'category',
      },
      yAxis: {
        axisLabel: { color: '#94a3b8' },
        minInterval: 1,
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } },
        type: 'value',
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
