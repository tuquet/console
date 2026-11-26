<script lang="ts" setup>
import type { BrowserProfileRecord } from '../api/browsers';

import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { routeLocationKey } from 'vue-router';

import { DataTable } from '@operon/common-ui';
import { useDaemonHeartbeat, useKernel } from '@operon/kernel';

import {
  Badge,
  Button,
  Card,
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@operon-core/shadcn-ui';

import { Cpu, Globe, Radio, SearchX, Sparkles, WifiOff } from '@lucide/vue';

import BrowserDeleteDialog from '../components/browsers/browser-delete-dialog.vue';
import BrowserDetailSheet from '../components/browsers/browser-detail-sheet.vue';
import BrowserFormSheet from '../components/browsers/browser-form-sheet.vue';
import BrowserImportCsvDialog from '../components/browsers/browser-import-csv-dialog.vue';
import BrowsersTableBulkBar from '../components/browsers/browsers-table-bulk-bar.vue';
import BrowsersTableMetrics from '../components/browsers/browsers-table-metrics.vue';
import BrowsersTableToolbar from '../components/browsers/browsers-table-toolbar.vue';
import { createBrowserColumns } from '../components/browsers/columns';
import CommandCenterHud from '../components/browsers/command-center-hud.vue';
import SseMissionPanel from '../components/browsers/sse-mission-panel.vue';
import DriversPanel from '../components/drivers/drivers-panel.vue';
import { $t } from '../locales';
import { useBrowserDriversStore } from '../stores/browser-drivers';
import { useBrowsersStore } from '../stores/browsers';

defineOptions({ name: 'AutomationBrowsersView' });

type CenterPanel = 'drivers' | 'live' | 'profiles';

const kernel = useKernel();
const store = useBrowsersStore();
const driversStore = useBrowserDriversStore();
const daemon = useDaemonHeartbeat({ intervalMs: 5000 });
const maybeRoute = inject(routeLocationKey, null);

function resolveInitialPanel(): CenterPanel {
  const queryPanel =
    (typeof maybeRoute?.query?.panel === 'string'
      ? maybeRoute.query.panel
      : new URLSearchParams(window.location.search).get('panel')) || '';
  if (queryPanel === 'drivers' || queryPanel === 'live') {
    return queryPanel;
  }
  return 'profiles';
}

const activePanel = ref<CenterPanel>(resolveInitialPanel());
const showTelemetryRail = ref(true);

const formOpen = ref(false);
const formTarget = ref<BrowserProfileRecord | null>(null);
const detailOpen = ref(false);
const importOpen = ref(false);
const deleteOpen = ref(false);
const deleteTargets = ref<BrowserProfileRecord[]>([]);
const deleteLoading = ref(false);
let clearSelectionFn: (() => void) | null = null;

const runningProfiles = computed(() =>
  store.items.filter((item) => item.isOnline),
);

const installedDriverCount = computed(
  () => driversStore.drivers.filter((d) => d.installed).length,
);

const activeDownloadPercent = computed<null | number>(() => {
  for (const state of Object.values(driversStore.driverProgress)) {
    if (state.stage === 'downloading' || state.stage === 'extracting') {
      return state.percent;
    }
  }
  return null;
});

onMounted(() => {
  store.subscribeEvents();
  if (daemon.isHealthy.value) {
    void store.fetchBrowsers();
    void driversStore.fetchDrivers().catch(() => {});
  }
});

onBeforeUnmount(() => {
  store.unsubscribeEvents();
});

watch(
  () => daemon.isHealthy.value,
  (healthy) => {
    if (healthy) {
      store.subscribeEvents();
      void store.fetchBrowsers();
      void driversStore.fetchDrivers().catch(() => {});
    }
  },
);

watch(
  () => maybeRoute?.query?.panel,
  (panel) => {
    if (panel === 'drivers' || panel === 'live' || panel === 'profiles') {
      activePanel.value = panel;
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

async function openInspectById(id: string) {
  const existing = store.items.find((b) => b.id === id);
  if (existing) {
    await openInspectSheet(existing);
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

async function runWithToast(
  action: () => Promise<unknown>,
  fallbackError = $t('automation.overview.browser_action_failed'),
) {
  try {
    const successMsg = await action();
    if (typeof successMsg === 'string' && successMsg) {
      kernel.events.notify('success', successMsg);
    }
  } catch (error: any) {
    kernel.events.notify('error', error?.message || fallbackError);
  }
}

async function handleToggleRun(profile: BrowserProfileRecord) {
  await runWithToast(async () => {
    if (profile.isOnline) {
      await store.stopProfile(profile.id);
      return $t('automation.overview.browser_stopped_profile', {
        name: profile.name,
      });
    }
    await store.launchProfile(profile.id);
    return $t('automation.overview.browser_started_profile', {
      name: profile.name,
    });
  });
}

async function handleKillAll() {
  await runWithToast(async () => {
    const res = await store.killAllSessions();
    return res.message || $t('automation.browsers.cmd_stop_all_done');
  });
}

async function handleDuplicate(profile: BrowserProfileRecord) {
  await runWithToast(async () => {
    const cloned = await store.cloneProfile(profile.id);
    return $t('automation.browsers.cloned_success', { name: cloned.name });
  });
}

async function handleSetDefault(profile: BrowserProfileRecord) {
  await runWithToast(async () => {
    await store.makeDefaultProfile(profile.id);
    return $t('automation.browsers.default_set_success', {
      name: profile.name,
    });
  });
}

async function handleUnbind(profile: BrowserProfileRecord) {
  await runWithToast(async () => {
    await store.unbindProfile(profile.id);
    return $t('automation.overview.browser_unbind_success', {
      name: profile.name,
    });
  });
}

async function handleProbeRow(profile: BrowserProfileRecord) {
  if (!profile.proxy) return;
  try {
    const res = await store.probeProxy(profile.proxy);
    kernel.events.notify(
      res.alive ? 'success' : 'error',
      res.alive
        ? $t('automation.browsers.proxy_alive_msg', {
            ip: res.egressIp || 'unknown',
            rtt: res.rttMs,
          })
        : $t('automation.browsers.proxy_dead_msg', {
            error: res.error || 'timeout',
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
  if (rows.length === 0) return;
  const { started, total } = await store.batchLaunchSelected(rows);
  if (total === 0) {
    kernel.events.notify(
      'warning',
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
  if (rows.length === 0) return;
  const { stopped, total } = await store.batchStopSelected(rows);
  if (total === 0) {
    kernel.events.notify(
      'warning',
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
  await runWithToast(() => store.autoDetect());
}

function handleRefreshActive() {
  if (activePanel.value === 'drivers') {
    void driversStore.fetchDrivers();
    return;
  }
  void store.fetchBrowsers();
}

function reconnectSse() {
  store.unsubscribeEvents();
  store.subscribeEvents();
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
  <div
    class="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3 sm:gap-3.5 sm:p-5"
  >
    <CommandCenterHud
      :active-download-percent="activeDownloadPercent"
      :active-driver-version="driversStore.activeDriverVersion"
      :daemon-healthy="daemon.isHealthy.value"
      :killing-all="store.killingAll"
      :loading="store.loading || driversStore.driversLoading"
      :running-count="store.stats.running"
      :show-telemetry-rail="showTelemetryRail"
      :sse-status="store.sseStatus"
      @import-csv="importOpen = true"
      @kill-all="handleKillAll"
      @new-profile="openCreateModal"
      @open-drivers="activePanel = 'drivers'"
      @reconnect-sse="reconnectSse"
      @refresh="handleRefreshActive"
      @toggle-telemetry-rail="showTelemetryRail = !showTelemetryRail"
    />

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
          <h3 class="text-foreground text-base">
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

    <div v-else class="flex min-h-0 flex-1 gap-4 overflow-hidden">
      <Tabs
        v-model="activePanel"
        :unmount-on-hide="false"
        class="flex min-h-0 min-w-0 flex-1 flex-col gap-3"
      >
        <TabsList
          class="grid w-full grid-cols-3 sm:w-fit sm:grid-cols-none sm:inline-flex"
        >
          <TabsTrigger value="profiles" class="text-ui-label gap-1.5">
            <Globe class="size-3.5" />
            <span>{{ $t('automation.browsers.cmd_tab_fleet') }}</span>
            <Badge variant="secondary">{{ store.stats.total }}</Badge>
          </TabsTrigger>
          <TabsTrigger value="drivers" class="text-ui-label gap-1.5">
            <Cpu class="size-3.5" />
            <span>{{ $t('automation.browsers.drivers_btn') }}</span>
            <Badge variant="secondary">{{ installedDriverCount }}</Badge>
          </TabsTrigger>
          <TabsTrigger value="live" class="text-ui-label gap-1.5 xl:hidden">
            <Radio class="size-3.5" />
            <span>{{ $t('automation.browsers.cmd_tab_live') }}</span>
            <Badge variant="secondary">{{ store.liveEvents.length }}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="profiles"
          class="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <DataTable
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
              #toolbar="{
                table,
                density,
                setDensity,
                isFiltered,
                resetFilters,
              }"
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
              <Empty class="min-h-[200px]">
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
                </EmptyHeader>
                <div class="mt-3 flex justify-center">
                  <Button
                    v-if="store.items.length > 0"
                    size="sm"
                    variant="outline"
                    @click="resetFilters"
                  >
                    {{ $t('common.reset') }}
                  </Button>
                  <Button
                    v-else
                    size="sm"
                    variant="outline"
                    @click="handleAutoDetect"
                  >
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
        </TabsContent>

        <TabsContent
          value="drivers"
          class="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <DriversPanel embedded />
        </TabsContent>

        <TabsContent
          value="live"
          class="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden xl:hidden"
        >
          <SseMissionPanel
            :events="store.liveEvents"
            :is-mutating="(id) => store.isMutating(id)"
            :last-event-at="store.lastEventAt"
            :running-profiles="runningProfiles"
            :sse-status="store.sseStatus"
            @clear-events="store.clearLiveEvents()"
            @inspect-profile="openInspectSheet"
            @inspect-target-id="openInspectById"
            @stop-profile="handleToggleRun"
          />
        </TabsContent>
      </Tabs>

      <!-- Desktop Live Mission Rail -->
      <aside
        v-if="showTelemetryRail"
        class="hidden min-h-0 w-[340px] shrink-0 flex-col xl:flex"
      >
        <SseMissionPanel
          :events="store.liveEvents"
          :is-mutating="(id) => store.isMutating(id)"
          :last-event-at="store.lastEventAt"
          :running-profiles="runningProfiles"
          :sse-status="store.sseStatus"
          @clear-events="store.clearLiveEvents()"
          @inspect-profile="openInspectSheet"
          @inspect-target-id="openInspectById"
          @stop-profile="handleToggleRun"
        />
      </aside>
    </div>

    <BrowserFormSheet
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
    <BrowserDeleteDialog
      v-model:open="deleteOpen"
      :targets="deleteTargets"
      :loading="deleteLoading"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>
