<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { DataTable, SchemaSheet } from '@operon/common-ui';
import { useDaemonHeartbeat, useKernel } from '@operon/kernel';

import {
  Button,
  Card,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from '@operon-core/shadcn-ui';
import { cn } from '@operon-core/shared/utils';

import { Cpu, RefreshCw, SearchX, WifiOff } from '@lucide/vue';

import { $t } from '../../locales';
import { useBrowserDriversStore } from '../../stores/browser-drivers';
import { useBrowsersStore } from '../../stores/browsers';
import { createDriverColumns } from './columns';
import { createDriverDetailSchema } from './driver-detail-schema';
import DriversTableMetrics from './drivers-table-metrics.vue';
import DriversTableToolbar from './drivers-table-toolbar.vue';

defineOptions({ name: 'AutomationDriversPanel' });

const props = withDefaults(
  defineProps<{
    embedded?: boolean;
  }>(),
  {
    embedded: false,
  },
);

const kernel = useKernel();
const browsersStore = useBrowsersStore();
const driversStore = useBrowserDriversStore();
const daemon = useDaemonHeartbeat({ intervalMs: 5000 });

const busyVersion = ref<null | string>(null);
const inspectedVersion = ref<null | string>(null);
const detailOpen = ref(false);
const hasRunningSessions = computed(() => browsersStore.stats.running > 0);
const inspectedDriver = computed(
  () =>
    driversStore.drivers.find((d) => d.version === inspectedVersion.value) ??
    null,
);

function openDriverDetail(driver: { version: string }) {
  inspectedVersion.value = driver.version;
  detailOpen.value = true;
}

function notifyError(title: string, error: unknown) {
  const msg =
    error instanceof Error
      ? error.message
      : $t('automation.overview.browser_action_failed');
  driversStore.pushDriverNotification('error', title, msg);
  return msg;
}

async function refreshAll() {
  try {
    await driversStore.fetchDrivers();
  } catch (error) {
    notifyError($t('automation.browsers.drivers_title'), error);
  }
}

async function handleInstall(version: string) {
  try {
    browsersStore.subscribeEvents();
    await driversStore.installDriver(version);
  } catch (error) {
    const msg = notifyError(
      $t('automation.browsers.driver_download_failed', { version }),
      error,
    );
    driversStore.driverProgress[version] = {
      error: msg,
      percent: 0,
      stage: 'error',
    };
  }
}

async function handleSelect(version: string) {
  busyVersion.value = version;
  try {
    await driversStore.useDriver(version);
    kernel.events.notify(
      'success',
      $t('automation.browsers.driver_selected_msg', { version }),
    );
  } catch (error) {
    notifyError($t('automation.browsers.drivers_title'), error);
  } finally {
    busyVersion.value = null;
  }
}

async function handleUninstall(version: string) {
  busyVersion.value = version;
  try {
    await driversStore.uninstallDriver(version);
    kernel.events.notify(
      'success',
      $t('automation.browsers.driver_uninstalled_msg', { version }),
    );
  } catch (error) {
    notifyError($t('automation.browsers.drivers_title'), error);
  } finally {
    busyVersion.value = null;
  }
}

const detailSchema = createDriverDetailSchema({
  getProgress: (version) => driversStore.driverProgress[version],
  hasRunningSessions: () => hasRunningSessions.value,
  isBusy: (version) => busyVersion.value === version,
  onCopy: () => kernel.events.notify('success', $t('common.copied')),
  onInstall: handleInstall,
  onSelect: handleSelect,
  onUninstall: handleUninstall,
});

const columns = createDriverColumns(
  {
    onInstall: handleInstall,
    onSelect: handleSelect,
    onUninstall: handleUninstall,
  },
  {
    getProgress: (version) => driversStore.driverProgress[version],
    hasRunningSessions: () => hasRunningSessions.value,
    isBusy: (version) => busyVersion.value === version,
  },
);

onMounted(() => {
  browsersStore.subscribeEvents();
  if (daemon.isHealthy.value && driversStore.drivers.length === 0) {
    void refreshAll();
  }
});

onBeforeUnmount(() => {
  if (!props.embedded) {
    browsersStore.unsubscribeEvents();
  }
});

watch(
  () => daemon.isHealthy.value,
  (healthy) => {
    if (healthy) {
      browsersStore.subscribeEvents();
      void refreshAll();
    }
  },
);
</script>

<template>
  <div
    :class="
      cn(
        'flex min-h-0 flex-1 flex-col gap-3 overflow-hidden',
        !embedded && 'h-full p-3 sm:p-5',
      )
    "
  >
    <div
      v-if="!embedded"
      class="flex flex-wrap items-center justify-between gap-2"
    >
      <div class="flex flex-wrap items-center gap-2">
        <Cpu class="text-primary size-4" />
        <h2 class="text-base font-semibold tracking-tight">
          {{ $t('automation.browsers.drivers_title') }}
        </h2>
      </div>

      <Button
        variant="outline"
        size="sm"
        class="h-8 gap-1.5 shadow-none"
        :disabled="!daemon.isHealthy.value || driversStore.driversLoading"
        @click="refreshAll"
      >
        <RefreshCw
          class="size-3.5"
          :class="{ 'animate-spin': driversStore.driversLoading }"
        />
        <span>{{ $t('common.refresh') }}</span>
      </Button>
    </div>

    <Card
      v-if="!daemon.isHealthy.value && driversStore.drivers.length === 0"
      class="flex flex-1 flex-col items-center justify-center p-8 text-center shadow-none"
    >
      <WifiOff class="text-muted-foreground mb-3 size-9 opacity-60" />
      <p class="text-sm font-medium">
        {{ $t('automation.browsers.offline_title') }}
      </p>
      <p class="text-ui-body text-muted-foreground mt-1 max-w-md">
        {{ $t('automation.browsers.offline_desc') }}
      </p>
    </Card>

    <div
      v-else-if="
        driversStore.driversLoading && driversStore.drivers.length === 0
      "
      class="flex flex-col gap-3"
    >
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Skeleton v-for="idx in 4" :key="idx" class="h-20 w-full rounded-xl" />
      </div>
      <Skeleton class="h-64 w-full rounded-xl" />
    </div>

    <DataTable
      v-else
      class="min-h-0 flex-1"
      interactive-rows
      :columns="columns"
      :data="driversStore.drivers"
      row-key="version"
      :empty-title="$t('automation.browsers.drivers_empty_title')"
      :empty-description="$t('automation.browsers.drivers_empty_desc')"
      @row-click="openDriverDetail"
    >
      <template #header="{ table }">
        <DriversTableMetrics :drivers="driversStore.drivers" :table="table" />
      </template>

      <template
        #toolbar="{ table, density, setDensity, isFiltered, resetFilters }"
      >
        <DriversTableToolbar
          :density="density"
          :drivers="driversStore.drivers"
          :is-filtered="isFiltered"
          :table="table"
          @update:density="setDensity"
          @reset="resetFilters"
        />
      </template>

      <template #empty="{ resetFilters }">
        <Empty class="min-h-[240px]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX class="text-muted-foreground size-5" />
            </EmptyMedia>
            <EmptyTitle>
              {{ $t('automation.browsers.drivers_empty_title') }}
            </EmptyTitle>
            <EmptyDescription>
              {{ $t('automation.browsers.drivers_empty_desc') }}
            </EmptyDescription>
          </EmptyHeader>
          <Button
            variant="outline"
            size="sm"
            class="mt-4"
            @click="resetFilters"
          >
            {{ $t('common.reset') }}
          </Button>
        </Empty>
      </template>
    </DataTable>

    <SchemaSheet
      v-model:open="detailOpen"
      mode="view"
      :close-label="$t('common.close')"
      :record="inspectedDriver"
      :schema="detailSchema"
    />
  </div>
</template>
