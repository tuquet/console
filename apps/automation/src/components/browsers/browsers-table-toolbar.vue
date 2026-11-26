<script setup lang="ts">
import type { VueTable } from '@tanstack/vue-table';

import type { DataTableDensity, DataTableFeatures } from '@operon/common-ui';

import type { BrowserProfileRecord } from '../../api/browsers';

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

import { Cloud, HardDrive, Laptop, Search, Shield, Wifi, X } from '@lucide/vue';

import { $t } from '../../locales';

interface Props {
  density: DataTableDensity;
  isFiltered: boolean;
  table: VueTable<DataTableFeatures, BrowserProfileRecord>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  reset: [];
  'update:density': [value: DataTableDensity];
}>();

const searchWrapperRef = ref<HTMLElement | null>(null);

const searchQuery = computed(
  () => (props.table.getColumn('name')?.getFilterValue() as string) ?? '',
);

const statusOptions = computed(() => [
  { label: $t('automation.browsers.status_online'), value: 'online' },
  { label: $t('automation.browsers.status_offline'), value: 'offline' },
]);

const sourceOptions = computed(() => [
  {
    icon: HardDrive,
    label: $t('automation.browsers.source_local'),
    value: 'local',
  },
  {
    icon: Cloud,
    label: $t('automation.browsers.source_cloud'),
    value: 'cloud',
  },
]);

const proxyOptions = computed(() => [
  {
    icon: Shield,
    label: $t('automation.overview.browser_filter_proxied'),
    value: 'proxied',
  },
  {
    icon: Wifi,
    label: $t('automation.overview.browser_filter_direct'),
    value: 'direct',
  },
]);

const platformOptions = [
  { icon: Laptop, label: 'Windows', value: 'windows' },
  { icon: Laptop, label: 'macOS', value: 'macos' },
  { icon: Laptop, label: 'Linux', value: 'linux' },
];

function setSearch(value: number | string) {
  props.table.getColumn('name')?.setFilterValue(String(value) || undefined);
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
            :placeholder="$t('automation.browsers.search_placeholder')"
            class="bg-background h-8 pr-11 pl-8"
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
              <X class="size-3.5" />
            </Button>
            <Kbd v-else class="pointer-events-none">/</Kbd>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <DataTableFacetedFilter
        v-if="table.getColumn('status')"
        :column="table.getColumn('status')"
        :title="$t('automation.browsers.filter_status')"
        :options="statusOptions"
      />
      <DataTableFacetedFilter
        v-if="table.getColumn('source')"
        :column="table.getColumn('source')"
        :title="$t('automation.browsers.filter_source')"
        :options="sourceOptions"
      />
      <DataTableFacetedFilter
        v-if="table.getColumn('proxy')"
        :column="table.getColumn('proxy')"
        :title="$t('automation.browsers.filter_proxy')"
        :options="proxyOptions"
      />
      <DataTableFacetedFilter
        v-if="table.getColumn('platform')"
        :column="table.getColumn('platform')"
        :title="$t('automation.overview.browser_filter_platform')"
        :options="platformOptions"
      />

      <Button
        v-if="isFiltered"
        variant="ghost"
        size="sm"
        class="text-muted-foreground hover:text-foreground h-8 px-2.5"
        @click="emit('reset')"
      >
        Reset
        <X class="ml-1 size-3.5" />
      </Button>
    </div>

    <div class="flex items-center gap-2">
      <DataTableDensityToggle
        :model-value="density"
        @update:model-value="(val) => emit('update:density', val)"
      />
      <DataTableViewOptions :table="table" />
    </div>
  </div>
</template>
