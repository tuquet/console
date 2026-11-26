<script setup lang="ts">
import type { VueTable } from '@tanstack/vue-table';

import type { DataTableDensity, DataTableFeatures } from '@operon/common-ui';

import type { DriverReleaseItem } from '../../api/browsers';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import {
  DataTableDensityToggle,
  DataTableFacetedFilter,
  DataTableViewOptions,
} from '@operon/common-ui';

import {
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Kbd,
} from '@operon-core/shadcn-ui';

import { CheckCircle2, Cpu, Download, Search, X } from '@lucide/vue';

import { $t } from '../../locales';

interface Props {
  density: DataTableDensity;
  drivers: DriverReleaseItem[];
  isFiltered: boolean;
  table: VueTable<DataTableFeatures, DriverReleaseItem>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  reset: [];
  'update:density': [value: DataTableDensity];
}>();

const searchWrapperRef = ref<HTMLElement | null>(null);

const searchQuery = computed(
  () => (props.table.getColumn('version')?.getFilterValue() as string) ?? '',
);

const stateOptions = computed(() => [
  {
    icon: CheckCircle2,
    label: $t('automation.browsers.drivers_state_installed'),
    value: 'installed',
  },
  {
    icon: Download,
    label: $t('automation.browsers.drivers_state_available'),
    value: 'available',
  },
]);

const channelOptions = computed(() => {
  const unique = [...new Set(props.drivers.map((d) => d.channel))].toSorted();
  return unique.map((ch) => ({
    icon: Cpu,
    label: ch.toUpperCase(),
    value: ch,
  }));
});

const statusOptions = computed(() => {
  const unique = [...new Set(props.drivers.map((d) => d.status))].toSorted();
  return unique.map((st) => ({
    label: st,
    value: st,
  }));
});

function setSearch(value: number | string) {
  props.table.getColumn('version')?.setFilterValue(String(value) || undefined);
}

function handleGlobalSlash(e: KeyboardEvent) {
  if (
    e.key !== '/' ||
    e.metaKey ||
    e.ctrlKey ||
    e.altKey ||
    !searchWrapperRef.value?.offsetParent ||
    ['INPUT', 'SELECT', 'TEXTAREA'].includes(
      (e.target as HTMLElement | null)?.tagName ?? '',
    )
  ) {
    return;
  }
  e.preventDefault();
  searchWrapperRef.value.querySelector('input')?.focus();
}

onMounted(() => window.addEventListener('keydown', handleGlobalSlash));
onBeforeUnmount(() => window.removeEventListener('keydown', handleGlobalSlash));
</script>

<template>
  <div
    class="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between"
  >
    <div class="flex flex-1 flex-wrap items-center gap-1.5">
      <div ref="searchWrapperRef" class="w-full sm:w-[240px] lg:w-[280px]">
        <InputGroup>
          <InputGroupAddon class="pointer-events-none absolute left-0 px-2.5">
            <Search class="size-3.5 opacity-70" />
          </InputGroupAddon>
          <InputGroupInput
            :model-value="searchQuery"
            :placeholder="$t('automation.browsers.drivers_filter_placeholder')"
            class="bg-background text-ui-input h-9 pr-11 pl-8 sm:h-8"
            @update:model-value="setSearch"
          />
          <InputGroupAddon class="absolute right-0 px-2">
            <Button
              v-if="searchQuery"
              type="button"
              variant="ghost"
              size="icon"
              class="size-5 rounded-sm"
              @click="setSearch('')"
            >
              <X class="size-3" />
            </Button>
            <Kbd
              v-else
              class="text-ui-caption hidden h-5 px-1.5 sm:inline-flex"
            >
              /
            </Kbd>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <DataTableFacetedFilter
        :column="table.getColumn('installed')"
        :title="$t('automation.browsers.drivers_col_state')"
        :options="stateOptions"
      />

      <DataTableFacetedFilter
        v-if="channelOptions.length > 0"
        :column="table.getColumn('channel')"
        :title="$t('automation.browsers.drivers_col_channel')"
        :options="channelOptions"
      />

      <DataTableFacetedFilter
        v-if="statusOptions.length > 0"
        :column="table.getColumn('status')"
        :title="$t('automation.browsers.drivers_col_status')"
        :options="statusOptions"
      />

      <Button
        v-if="isFiltered"
        type="button"
        variant="ghost"
        size="sm"
        class="h-8 px-2"
        @click="emit('reset')"
      >
        <X class="mr-1 size-3.5" />
        {{ $t('common.reset') }}
      </Button>
    </div>

    <div class="flex items-center gap-1.5">
      <DataTableDensityToggle
        :model-value="density"
        @update:model-value="(v: DataTableDensity) => emit('update:density', v)"
      />
      <DataTableViewOptions :table="table" />
    </div>
  </div>
</template>
