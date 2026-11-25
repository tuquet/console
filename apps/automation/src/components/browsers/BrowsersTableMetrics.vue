<script setup lang="ts">
import type { VueTable } from '@tanstack/vue-table';

import type { DataTableFeatures } from '@operon/common-ui';

import type { BrowserProfileRecord } from '../../api/browsers';

import { computed } from 'vue';

import { Button } from '@operon-core/shadcn-ui';
import { cn } from '@operon-core/shared/utils';

import { CheckCircle2, Globe, Shield, Wifi } from '@lucide/vue';

import { $t } from '../../locales';

interface Props {
  stats: {
    direct: number;
    proxied: number;
    running: number;
    total: number;
  };
  table: VueTable<DataTableFeatures, BrowserProfileRecord>;
}

const props = defineProps<Props>();

type PresetKey = 'all' | 'direct' | 'proxied' | 'running';

const cards = computed(() => [
  {
    key: 'all' as PresetKey,
    label: $t('automation.browsers.kpi_total'),
    icon: Globe,
    iconClass: 'text-muted-foreground',
    activeClass: 'border-foreground/25 after:bg-primary shadow-2xs',
    value: props.stats.total,
  },
  {
    key: 'running' as PresetKey,
    label: $t('automation.browsers.kpi_running'),
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    activeClass: 'border-emerald-500/40 shadow-2xs after:bg-emerald-500',
    columnId: 'status',
    filterValue: 'online',
    value: props.stats.running,
  },
  {
    key: 'proxied' as PresetKey,
    label: $t('automation.browsers.kpi_proxied'),
    icon: Shield,
    iconClass: 'text-sky-500',
    activeClass: 'border-sky-500/40 shadow-2xs after:bg-sky-500',
    columnId: 'proxy',
    filterValue: 'proxied',
    value: props.stats.proxied,
  },
  {
    key: 'direct' as PresetKey,
    label: $t('automation.browsers.kpi_direct'),
    icon: Wifi,
    iconClass: 'text-muted-foreground',
    activeClass: 'border-foreground/25 after:bg-muted-foreground shadow-2xs',
    columnId: 'proxy',
    filterValue: 'direct',
    value: props.stats.direct,
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
  <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <Button
      v-for="card in cards"
      :key="card.key"
      type="button"
      variant="outline"
      :class="
        cn(
          'bg-card relative flex h-auto w-full flex-col items-stretch justify-between overflow-hidden rounded-lg border px-4 py-3 text-left font-normal whitespace-normal transition-all',
          activeKey === card.key
            ? cn(
                card.activeClass,
                'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5',
              )
            : 'border-border/70 hover:border-border hover:bg-accent/20',
        )
      "
      @click="applyPreset(card)"
    >
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground text-xs font-medium">
          {{ card.label }}
        </span>
        <component :is="card.icon" class="size-3.5" :class="card.iconClass" />
      </div>
      <div class="text-foreground mt-2 font-mono text-2xl font-semibold">
        {{ card.value }}
      </div>
    </Button>
  </div>
</template>
