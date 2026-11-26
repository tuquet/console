<script setup lang="ts">
import type { VueTable } from '@tanstack/vue-table';

import type { DataTableFeatures } from '@operon/common-ui';

import type { DriverReleaseItem } from '../../api/browsers';

import { computed } from 'vue';

import { Card } from '@operon-core/shadcn-ui';
import { cn } from '@operon-core/shared/utils';

import { CheckCircle2, Cpu, Download, ShieldCheck } from '@lucide/vue';

import { $t } from '../../locales';

interface Props {
  drivers: DriverReleaseItem[];
  table: VueTable<DataTableFeatures, DriverReleaseItem>;
}

const props = defineProps<Props>();

type PresetKey = 'all' | 'available' | 'installed' | 'lts';

const stats = computed(() => {
  const total = props.drivers.length;
  const installed = props.drivers.filter((d) => d.installed).length;
  const available = total - installed;
  const lts = props.drivers.filter(
    (d) => d.channel.toLowerCase() === 'lts',
  ).length;
  return { available, installed, lts, total };
});

function sharePercent(count: number): number {
  return stats.value.total > 0
    ? Math.round((count / stats.value.total) * 100)
    : 0;
}

const cards = computed(() => [
  {
    key: 'all' as PresetKey,
    label: $t('automation.browsers.drivers_kpi_total'),
    icon: Cpu,
    value: stats.value.total,
    subtext: `${stats.value.installed}/${stats.value.total}`,
  },
  {
    key: 'installed' as PresetKey,
    label: $t('automation.browsers.drivers_kpi_installed'),
    icon: CheckCircle2,
    columnId: 'installed',
    filterValue: 'installed',
    value: stats.value.installed,
    subtext: `${sharePercent(stats.value.installed)}%`,
  },
  {
    key: 'available' as PresetKey,
    label: $t('automation.browsers.drivers_kpi_available'),
    icon: Download,
    columnId: 'installed',
    filterValue: 'available',
    value: stats.value.available,
    subtext: `${sharePercent(stats.value.available)}%`,
  },
  {
    key: 'lts' as PresetKey,
    label: $t('automation.browsers.drivers_kpi_lts'),
    icon: ShieldCheck,
    columnId: 'channel',
    filterValue: 'lts',
    value: stats.value.lts,
    subtext: `${sharePercent(stats.value.lts)}%`,
  },
]);

const activeKey = computed<string>(() => {
  const filters = props.table.atoms.columnFilters.get();
  if (filters.length === 0) return 'all';
  if (filters.length === 1 && filters[0]) {
    const first = filters[0];
    const val = Array.isArray(first.value) ? first.value : [];
    const matched = cards.value.find(
      (c) =>
        c.columnId === first.id && val.length === 1 && val[0] === c.filterValue,
    );
    if (matched) return matched.key;
  }
  return 'custom';
});

function applyPreset(card: (typeof cards.value)[number]) {
  const shouldClear = card.key === 'all' || activeKey.value === card.key;
  props.table.resetColumnFilters();
  if (!shouldClear && card.columnId && card.filterValue) {
    props.table.getColumn(card.columnId)?.setFilterValue([card.filterValue]);
  }
}
</script>

<template>
  <div class="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
    <button
      v-for="card in cards"
      :key="card.key"
      type="button"
      class="text-left focus:outline-none"
      @click="applyPreset(card)"
    >
      <Card
        :class="
          cn(
            'hover:border-primary/40 flex flex-col gap-0.5 p-2.5 shadow-none transition-colors sm:gap-1 sm:p-3',
            activeKey === card.key && 'border-primary bg-primary/5',
          )
        "
      >
        <div class="flex items-center justify-between gap-2">
          <span
            class="text-ui-caption sm:text-ui-label text-muted-foreground font-medium"
          >
            {{ card.label }}
          </span>
          <component :is="card.icon" class="text-muted-foreground size-3.5" />
        </div>
        <div class="flex items-baseline justify-between gap-2">
          <span class="text-base tabular-nums sm:text-xl">
            {{ card.value }}
          </span>
          <span class="text-ui-caption text-muted-foreground">
            {{ card.subtext }}
          </span>
        </div>
      </Card>
    </button>
  </div>
</template>
