<script lang="ts" setup>
import type { BrowserProfileRecord } from '../api/browsers';

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { DataTable } from '@operon/common-ui';
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

import {
  Cpu,
  FileSpreadsheet,
  Globe,
  Plus,
  RefreshCw,
  SearchX,
  Sparkles,
  WifiOff,
} from '@lucide/vue';

import BrowserDeleteDialog from '../components/browsers/browser-delete-dialog.vue';
import BrowserDetailSheet from '../components/browsers/browser-detail-sheet.vue';
import BrowserDriversDialog from '../components/browsers/browser-drivers-dialog.vue';
import BrowserFormDialog from '../components/browsers/browser-form-dialog.vue';
import BrowserImportCsvDialog from '../components/browsers/browser-import-csv-dialog.vue';
import BrowsersTableBulkBar from '../components/browsers/browsers-table-bulk-bar.vue';
import BrowsersTableMetrics from '../components/browsers/browsers-table-metrics.vue';
import BrowsersTableToolbar from '../components/browsers/browsers-table-toolbar.vue';
import { createBrowserColumns } from '../components/browsers/columns';
import { $t } from '../locales';
import { useBrowsersStore } from '../stores/browsers';

defineOptions({ name: 'AutomationBrowsersView' });

const kernel = useKernel();
const store = useBrowsersStore();
const daemon = useDaemonHeartbeat({ intervalMs: 5000 });

const formOpen = ref(false);
const formTarget = ref<BrowserProfileRecord | null>(null);
const detailOpen = ref(false);
const importOpen = ref(false);
const driversOpen = ref(false);
const deleteOpen = ref(false);
const deleteTargets = ref<BrowserProfileRecord[]>([]);
const deleteLoading = ref(false);
let clearSelectionFn: (() => void) | null = null;

onMounted(() => {
  store.subscribeEvents();
  if (daemon.isHealthy.value) {
    void store.fetchBrowsers();
  }
});

onBeforeUnmount(() => {
  store.unsubscribeEvents();
});

watch(
  () => daemon.isHealthy.value,
  (healthy) => {
    if (healthy) {
      void store.fetchBrowsers();
    }
  },
);

function openCreateModal() {
  formTarget.value = null;
  formOpen.value = true;
}

function openEditModal(profile: BrowserProfileRecord) {
  formTarget.value = profile;
  formOpen.value = true;
}

async function openInspectSheet(profile: BrowserProfileRecord) {
  store.detailTarget = profile;
  detailOpen.value = true;
  try {
    await store.inspectBrowser(profile.id);
  } catch {
    // retain table snapshot on detail fetch error
  }
}

function openSingleDelete(profile: BrowserProfileRecord) {
  clearSelectionFn = null;
  deleteTargets.value = [profile];
  deleteOpen.value = true;
}

function openBatchDelete(
  rows: BrowserProfileRecord[],
  clearSelection: () => void,
) {
  if (rows.length === 0) return;
  clearSelectionFn = clearSelection;
  deleteTargets.value = [...rows];
  deleteOpen.value = true;
}

async function handleConfirmDelete(force: boolean) {
  if (deleteTargets.value.length === 0) return;
  deleteLoading.value = true;
  try {
    if (deleteTargets.value.length === 1 && deleteTargets.value[0]) {
      const target = deleteTargets.value[0];
      await store.removeProfile(target.id, force);
      kernel.events.notify(
        'success',
        $t('automation.browsers.deleted_success', { name: target.name }),
      );
    } else {
      const res = await store.batchRemoveSelected(
        force,
        deleteTargets.value.map((p) => p.id),
      );
      clearSelectionFn?.();
      clearSelectionFn = null;
      kernel.events.notify(
        res.deleted.length > 0 ? 'success' : 'warning',
        `${res.deleted.length} deleted, ${res.skipped.length} skipped`,
      );
    }
    deleteOpen.value = false;
  } catch (error: any) {
    kernel.events.notify(
      'error',
      error?.message || $t('automation.overview.browser_action_failed'),
    );
  } finally {
    deleteLoading.value = false;
  }
}

function handleFormSaved(mode: 'create' | 'restart' | 'update', name: string) {
  const key =
    mode === 'create'
      ? 'automation.browsers.created_success'
      : 'automation.browsers.updated_success';
  kernel.events.notify('success', $t(key, { name }));
}

async function handleToggleRun(profile: BrowserProfileRecord) {
  try {
    if (profile.isOnline) {
      await store.stopProfile(profile.id);
      kernel.events.notify(
        'success',
        $t('automation.overview.browser_stopped_profile', {
          name: profile.name,
        }),
      );
    } else {
      await store.launchProfile(profile.id);
      kernel.events.notify(
        'success',
        $t('automation.overview.browser_started_profile', {
          name: profile.name,
        }),
      );
    }
  } catch (error: any) {
    kernel.events.notify(
      'error',
      error?.message || $t('automation.overview.browser_action_failed'),
    );
  }
}

async function handleSetDefault(profile: BrowserProfileRecord) {
  try {
    await store.makeDefaultProfile(profile.id);
    kernel.events.notify(
      'success',
      $t('automation.browsers.default_set_success', { name: profile.name }),
    );
  } catch (error: any) {
    kernel.events.notify(
      'error',
      error?.message || $t('automation.overview.browser_action_failed'),
    );
  }
}

async function handleDuplicate(profile: BrowserProfileRecord) {
  try {
    const cloned = await store.cloneProfile(profile.id);
    kernel.events.notify(
      'success',
      $t('automation.browsers.cloned_success', { name: cloned.name }),
    );
  } catch (error: any) {
    kernel.events.notify(
      'error',
      error?.message || $t('automation.overview.browser_action_failed'),
    );
  }
}

async function handleUnbind(profile: BrowserProfileRecord) {
  try {
    await store.unbindProfile(profile.id);
    kernel.events.notify(
      'success',
      $t('automation.overview.browser_unbind_success', { name: profile.name }),
    );
  } catch (error: any) {
    kernel.events.notify(
      'error',
      error?.message || $t('automation.overview.browser_unbind_failed'),
    );
  }
}

async function handleProbeRow(profile: BrowserProfileRecord) {
  if (!profile.proxy) return;
  try {
    const res = await store.probeProxy(profile.proxy);
    kernel.events.notify(
      res.alive ? 'success' : 'error',
      res.alive
        ? $t('automation.browsers.proxy_alive_msg', {
            ip: res.egressIp || res.protocol,
            rtt: res.rttMs,
          })
        : $t('automation.browsers.proxy_dead_msg', {
            error: res.error || 'failed',
          }),
    );
  } catch (error: any) {
    kernel.events.notify(
      'error',
      error?.message || $t('automation.overview.browser_action_failed'),
    );
  }
}

async function handleBatchLaunch(rows: BrowserProfileRecord[]) {
  const { started, total } = await store.batchLaunchSelected(rows);
  if (total === 0) {
    kernel.events.notify(
      'info',
      $t('automation.overview.browser_batch_all_running'),
    );
    return;
  }
  kernel.events.notify(
    started > 0 ? 'success' : 'error',
    $t('automation.overview.browser_batch_started', {
      count: started,
      total,
    }),
  );
}

async function handleBatchStop(rows: BrowserProfileRecord[]) {
  const { stopped, total } = await store.batchStopSelected(rows);
  if (total === 0) {
    kernel.events.notify(
      'info',
      $t('automation.overview.browser_batch_none_running'),
    );
    return;
  }
  kernel.events.notify(
    stopped > 0 ? 'success' : 'error',
    $t('automation.overview.browser_batch_stopped', {
      count: stopped,
      total,
    }),
  );
}

async function handleAutoDetect() {
  try {
    await store.autoDetect();
  } catch (error: any) {
    kernel.events.notify(
      'error',
      error?.message || $t('automation.overview.browser_action_failed'),
    );
  }
}

const columns = createBrowserColumns(
  {
    onDelete: openSingleDelete,
    onDuplicate: handleDuplicate,
    onEdit: openEditModal,
    onInspect: openInspectSheet,
    onProbeProxy: handleProbeRow,
    onSetDefault: handleSetDefault,
    onToggleRun: handleToggleRun,
    onUnbind: handleUnbind,
  },
  {
    isMutating: (id) => store.isMutating(id),
    scopeMode: computed(() => store.scopeMode),
  },
);
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-3.5 overflow-hidden p-4 sm:p-5">
    <!-- Top Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <Globe class="text-primary size-4" />
        <h2 class="text-base font-semibold tracking-tight">
          {{ $t('automation.browsers.title') }}
        </h2>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 shadow-none"
          :disabled="!daemon.isHealthy.value"
          @click="driversOpen = true"
        >
          <Cpu class="size-3.5" />
          <span>{{ $t('automation.browsers.drivers_btn') }}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 shadow-none"
          :disabled="!daemon.isHealthy.value || store.loading"
          @click="store.fetchBrowsers()"
        >
          <RefreshCw
            class="size-3.5"
            :class="{ 'animate-spin': store.loading }"
          />
          <span>{{ $t('common.refresh') }}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 shadow-none"
          :disabled="!daemon.isHealthy.value"
          @click="importOpen = true"
        >
          <FileSpreadsheet class="size-3.5" />
          <span>{{ $t('automation.browsers.import_csv') }}</span>
        </Button>

        <Button
          size="sm"
          class="h-8 gap-1.5"
          :disabled="!daemon.isHealthy.value"
          @click="openCreateModal"
        >
          <Plus class="size-3.5" />
          <span>{{ $t('automation.browsers.new_profile') }}</span>
        </Button>
      </div>
    </div>

    <!-- Loading Skeleton on Initial Heartbeat -->
    <div v-if="daemon.isInitialChecking.value" class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card v-for="idx in 4" :key="idx" class="border-border p-4">
          <Skeleton class="h-3.5 w-24" />
          <Skeleton class="mt-2 h-6 w-12" />
        </Card>
      </div>
      <Card class="border-border p-4">
        <Skeleton v-for="idx in 4" :key="idx" class="mb-3 h-10 w-full" />
      </Card>
    </div>

    <!-- Daemon Offline Gate -->
    <Card
      v-else-if="!daemon.isHealthy.value"
      class="flex flex-col items-start justify-between gap-4 border-amber-500/30 bg-amber-500/5 p-6 sm:flex-row sm:items-center"
    >
      <div class="flex items-start gap-3">
        <WifiOff class="mt-0.5 size-6 shrink-0 text-amber-500" />
        <div>
          <h3 class="text-foreground text-base font-semibold">
            {{ $t('automation.browsers.offline_title') }}
          </h3>
          <p class="text-muted-foreground mt-1 text-sm">
            {{ $t('automation.browsers.offline_desc') }}
          </p>
        </div>
      </div>
      <Button size="sm" variant="outline" @click="daemon.checkNow()">
        {{ $t('common.refresh') }}
      </Button>
    </Card>

    <DataTable
      v-else
      class="min-h-0 flex-1"
      :columns="columns"
      :data="store.items"
      :loading="store.loading"
      row-key="id"
      enable-row-selection
      interactive-rows
      @row-click="openInspectSheet"
    >
      <template #header="{ table }">
        <BrowsersTableMetrics :table="table" :stats="store.stats" />
      </template>

      <template
        #toolbar="{ table, density, setDensity, isFiltered, resetFilters }"
      >
        <BrowsersTableToolbar
          :table="table"
          :density="density"
          :is-filtered="isFiltered"
          @update:density="setDensity"
          @reset="resetFilters"
        />
      </template>

      <template #empty="{ resetFilters }">
        <Empty class="min-h-[240px]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX
                v-if="store.items.length > 0"
                class="text-muted-foreground size-5"
              />
              <Globe v-else class="text-muted-foreground size-5" />
            </EmptyMedia>
            <EmptyTitle>
              {{ $t('automation.browsers.empty_title') }}
            </EmptyTitle>
            <EmptyDescription>
              {{ $t('automation.browsers.empty_desc') }}
            </EmptyDescription>
          </EmptyHeader>
          <div class="mt-4 flex flex-wrap justify-center gap-2">
            <Button
              v-if="store.items.length > 0"
              size="sm"
              variant="outline"
              @click="resetFilters"
            >
              Reset
            </Button>
            <Button size="sm" @click="openCreateModal">
              <Plus class="mr-1.5 size-3.5" />
              <span>{{ $t('automation.browsers.new_profile') }}</span>
            </Button>
            <Button size="sm" variant="outline" @click="importOpen = true">
              <FileSpreadsheet class="mr-1.5 size-3.5" />
              <span>{{ $t('automation.browsers.import_csv') }}</span>
            </Button>
            <Button size="sm" variant="outline" @click="handleAutoDetect">
              <Sparkles class="mr-1.5 size-3.5" />
              <span>{{ $t('automation.browsers.auto_detect') }}</span>
            </Button>
          </div>
        </Empty>
      </template>

      <template #footer="{ selectedRows, clearSelection }">
        <BrowsersTableBulkBar
          :selected-browsers="selectedRows"
          @batch-launch="handleBatchLaunch(selectedRows)"
          @batch-stop="handleBatchStop(selectedRows)"
          @batch-delete="openBatchDelete(selectedRows, clearSelection)"
          @clear="clearSelection"
        />
      </template>
    </DataTable>

    <BrowserFormDialog
      v-model:open="formOpen"
      :target="formTarget"
      @saved="handleFormSaved"
    />
    <BrowserDetailSheet
      v-model:open="detailOpen"
      :profile="store.detailTarget"
      @edit="
        (profile) => {
          detailOpen = false;
          openEditModal(profile);
        }
      "
    />
    <BrowserImportCsvDialog v-model:open="importOpen" />
    <BrowserDriversDialog v-model:open="driversOpen" />
    <BrowserDeleteDialog
      v-model:open="deleteOpen"
      :targets="deleteTargets"
      :loading="deleteLoading"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>
