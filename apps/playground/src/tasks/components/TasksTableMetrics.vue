<script setup lang="ts">
import type { VueTable } from '@tanstack/vue-table';

import type { DataTableFeatures } from '../../components/data-table';
import type { Task } from '../data/schema';

import { computed } from 'vue';

import { Progress } from '@operon-core/shadcn-ui';
import { cn } from '@operon-core/shared/utils';

import { CheckCircle2, Flame, Layers, Timer } from '@lucide/vue';

interface TasksTableMetricsProps {
  metrics: {
    completionRate: number;
    done: number;
    highPriority: number;
    inProgress: number;
    total: number;
  };
  table: VueTable<DataTableFeatures, Task>;
}

const props = defineProps<TasksTableMetricsProps>();

const activeFilterKey = computed(() => {
  const filters = props.table.atoms.columnFilters.get();
  if (filters.length === 0) return 'all';
  const first = filters.length === 1 ? filters[0] : undefined;
  if (first) {
    const val = Array.isArray(first.value) ? first.value : [];
    if (first.id === 'status' && val.length === 1 && val[0] === 'in progress') {
      return 'in-progress';
    }
    if (first.id === 'priority' && val.length === 1 && val[0] === 'high') {
      return 'high';
    }
    if (first.id === 'status' && val.length === 1 && val[0] === 'done') {
      return 'done';
    }
  }
  return 'custom';
});

const inProgressShare = computed(() =>
  props.metrics.total > 0
    ? Math.round((props.metrics.inProgress / props.metrics.total) * 100)
    : 0,
);

const highPriorityShare = computed(() =>
  props.metrics.total > 0
    ? Math.round((props.metrics.highPriority / props.metrics.total) * 100)
    : 0,
);

function applyPreset(preset: 'all' | 'done' | 'high' | 'in-progress') {
  if (preset === 'all' || activeFilterKey.value === preset) {
    props.table.resetColumnFilters();
    return;
  }
  props.table.resetColumnFilters();
  if (preset === 'in-progress') {
    props.table.getColumn('status')?.setFilterValue(['in progress']);
  } else if (preset === 'high') {
    props.table.getColumn('priority')?.setFilterValue(['high']);
  } else if (preset === 'done') {
    props.table.getColumn('status')?.setFilterValue(['done']);
  }
}
</script>

<template>
  <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <button
      type="button"
      :class="
        cn(
          'bg-card relative flex flex-col justify-between overflow-hidden rounded-lg border px-4 py-3 text-left transition-all focus-visible:outline-hidden',
          activeFilterKey === 'all'
            ? 'border-foreground/25 after:bg-primary shadow-2xs after:absolute after:inset-x-0 after:bottom-0 after:h-0.5'
            : 'border-border/70 hover:border-border hover:bg-accent/20',
        )
      "
      @click="applyPreset('all')"
    >
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground text-xs font-medium">
          All Issues
        </span>
        <Layers class="text-muted-foreground size-3.5" />
      </div>
      <div class="mt-2 flex items-baseline justify-between gap-2">
        <span
          class="text-foreground font-mono text-xl font-semibold tracking-tight"
        >
          {{ metrics.total }}
        </span>
        <span class="text-muted-foreground font-mono text-[11px]">
          Active queue
        </span>
      </div>
    </button>

    <button
      type="button"
      :class="
        cn(
          'bg-card relative flex flex-col justify-between overflow-hidden rounded-lg border px-4 py-3 text-left transition-all focus-visible:outline-hidden',
          activeFilterKey === 'in-progress'
            ? 'border-sky-500/40 shadow-2xs after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-sky-500'
            : 'border-border/70 hover:border-border hover:bg-accent/20',
        )
      "
      @click="applyPreset('in-progress')"
    >
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground text-xs font-medium">
          In Progress
        </span>
        <Timer class="size-3.5 text-sky-500" />
      </div>
      <div class="mt-2 flex items-baseline justify-between gap-2">
        <span
          class="text-foreground font-mono text-xl font-semibold tracking-tight"
        >
          {{ metrics.inProgress }}
        </span>
        <span class="text-muted-foreground font-mono text-[11px]">
          {{ inProgressShare }}% of total
        </span>
      </div>
    </button>

    <button
      type="button"
      :class="
        cn(
          'bg-card relative flex flex-col justify-between overflow-hidden rounded-lg border px-4 py-3 text-left transition-all focus-visible:outline-hidden',
          activeFilterKey === 'high'
            ? 'border-rose-500/40 shadow-2xs after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-rose-500'
            : 'border-border/70 hover:border-border hover:bg-accent/20',
        )
      "
      @click="applyPreset('high')"
    >
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground text-xs font-medium">
          High Priority
        </span>
        <Flame class="size-3.5 text-rose-500" />
      </div>
      <div class="mt-2 flex items-baseline justify-between gap-2">
        <span
          class="text-foreground font-mono text-xl font-semibold tracking-tight"
        >
          {{ metrics.highPriority }}
        </span>
        <span class="text-muted-foreground font-mono text-[11px]">
          {{ highPriorityShare }}% urgent
        </span>
      </div>
    </button>

    <button
      type="button"
      :class="
        cn(
          'bg-card relative flex flex-col justify-between overflow-hidden rounded-lg border px-4 py-3 text-left transition-all focus-visible:outline-hidden',
          activeFilterKey === 'done'
            ? 'border-emerald-500/40 shadow-2xs after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-emerald-500'
            : 'border-border/70 hover:border-border hover:bg-accent/20',
        )
      "
      @click="applyPreset('done')"
    >
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground text-xs font-medium">Completed</span>
        <CheckCircle2 class="size-3.5 text-emerald-500" />
      </div>
      <div class="mt-2 flex items-center justify-between gap-3">
        <span
          class="text-foreground font-mono text-xl font-semibold tracking-tight"
        >
          {{ metrics.completionRate }}%
        </span>
        <div class="flex flex-1 items-center justify-end gap-2">
          <Progress
            :model-value="metrics.completionRate"
            class="h-1.5 max-w-16"
          />
          <span
            class="text-muted-foreground font-mono text-[11px] whitespace-nowrap"
          >
            {{ metrics.done }}/{{ metrics.total }}
          </span>
        </div>
      </div>
    </button>
  </div>
</template>
