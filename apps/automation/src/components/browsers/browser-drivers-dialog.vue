<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { useKernel } from '@operon/kernel';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Progress,
  Skeleton,
} from '@operon-core/shadcn-ui';

import { Check, Cpu, Download, Trash2 } from '@lucide/vue';

import { $t } from '../../locales';
import { useBrowserDriversStore } from '../../stores/browser-drivers';
import { useBrowsersStore } from '../../stores/browsers';

defineOptions({ name: 'BrowserDriversDialog' });

const open = defineModel<boolean>('open', { default: false });

const kernel = useKernel();
const store = useBrowsersStore();
const driversStore = useBrowserDriversStore();
const busyVersion = ref<null | string>(null);

const hasRunningSessions = computed(() => store.stats.running > 0);

function isActiveProgressStage(stage?: string): boolean {
  return stage === 'downloading' || stage === 'extracting';
}

function formatProgressLabel(version: string): string {
  const progress = driversStore.driverProgress[version];
  if (!progress) return '';
  const stageText =
    progress.stage === 'extracting'
      ? $t('automation.browsers.driver_stage_extracting')
      : $t('automation.browsers.driver_stage_downloading');

  if (
    typeof progress.totalBytes === 'number' &&
    progress.totalBytes > 0 &&
    typeof progress.downloadedBytes === 'number'
  ) {
    const dlMb = (progress.downloadedBytes / 1_048_576).toFixed(1);
    const totalMb = (progress.totalBytes / 1_048_576).toFixed(1);
    return `${stageText} (${dlMb} / ${totalMb} MB · ${progress.percent}%)`;
  }
  return `${stageText} (${progress.percent}%)`;
}

watch(open, (isOpen) => {
  if (isOpen) {
    store.subscribeEvents();
    void driversStore.fetchDrivers().catch((error: unknown) => {
      const msg =
        error instanceof Error
          ? error.message
          : $t('automation.overview.browser_action_failed');
      driversStore.pushDriverNotification(
        'error',
        $t('automation.browsers.drivers_title'),
        msg,
      );
    });
  }
});

async function handleInstall(version: string) {
  try {
    store.subscribeEvents();
    await driversStore.installDriver(version);
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : $t('automation.overview.browser_action_failed');
    driversStore.driverProgress[version] = {
      error: msg,
      percent: 0,
      stage: 'error',
    };
    driversStore.pushDriverNotification(
      'error',
      $t('automation.browsers.driver_download_failed', { version }),
      msg,
    );
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
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : $t('automation.overview.browser_action_failed');
    driversStore.pushDriverNotification(
      'error',
      $t('automation.browsers.drivers_title'),
      msg,
    );
  } finally {
    busyVersion.value = null;
  }
}

async function handleDelete(version: string) {
  busyVersion.value = version;
  try {
    await driversStore.deleteDriver(version);
    kernel.events.notify(
      'success',
      $t('automation.browsers.driver_deleted_msg', { version }),
    );
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : $t('automation.overview.browser_action_failed');
    driversStore.pushDriverNotification(
      'error',
      $t('automation.browsers.drivers_title'),
      msg,
    );
  } finally {
    busyVersion.value = null;
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[85vh] overflow-y-auto sm:max-w-[620px]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Cpu class="text-primary size-4" />
          <span>{{ $t('automation.browsers.drivers_title') }}</span>
        </DialogTitle>
        <DialogDescription>
          {{ $t('automation.browsers.drivers_desc') }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="driversStore.driversLoading" class="flex flex-col gap-3 py-2">
        <Skeleton v-for="idx in 3" :key="idx" class="h-16 w-full" />
      </div>

      <div v-else class="flex flex-col gap-2.5 py-2">
        <div
          v-for="item in driversStore.drivers"
          :key="item.version"
          class="border-border flex flex-col gap-2 rounded-lg border p-3"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex min-w-0 flex-wrap items-center gap-2">
              <span class="font-mono text-sm font-semibold">
                v{{ item.version }}
              </span>
              <Badge variant="outline">{{ item.status }}</Badge>
              <Badge v-if="item.isActive" variant="default" class="gap-1">
                <Check class="size-3" />
                <span>{{ $t('automation.browsers.driver_selected') }}</span>
              </Badge>
              <span
                v-if="item.sizeMb"
                class="text-muted-foreground font-mono text-xs"
              >
                {{ item.sizeMb.toFixed(0) }} MB
              </span>
            </div>

            <div class="flex shrink-0 items-center gap-1.5">
              <template v-if="item.installed">
                <Button
                  v-if="!item.isActive"
                  size="sm"
                  variant="outline"
                  :disabled="busyVersion === item.version"
                  @click="handleSelect(item.version)"
                >
                  {{ $t('automation.browsers.driver_select_btn') }}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  class="text-destructive hover:text-destructive"
                  :disabled="
                    item.isActive ||
                    hasRunningSessions ||
                    busyVersion === item.version
                  "
                  @click="handleDelete(item.version)"
                >
                  <Trash2 class="size-3.5" />
                </Button>
              </template>

              <Button
                v-else
                size="sm"
                :disabled="
                  isActiveProgressStage(
                    driversStore.driverProgress[item.version]?.stage,
                  )
                "
                @click="handleInstall(item.version)"
              >
                <Download class="mr-1.5 size-3.5" />
                <span>{{ $t('automation.browsers.driver_install_btn') }}</span>
              </Button>
            </div>
          </div>

          <p v-if="item.notes" class="text-muted-foreground text-xs">
            {{ item.notes }}
          </p>

          <div
            v-if="
              isActiveProgressStage(
                driversStore.driverProgress[item.version]?.stage,
              )
            "
            class="flex flex-col gap-1"
          >
            <Progress
              :model-value="
                driversStore.driverProgress[item.version]?.percent ?? 0
              "
              class="h-1.5"
            />
            <span class="text-muted-foreground font-mono text-xs">
              {{ formatProgressLabel(item.version) }}
            </span>
          </div>

          <p
            v-else-if="
              driversStore.driverProgress[item.version]?.stage === 'error'
            "
            class="text-destructive text-xs"
          >
            {{ driversStore.driverProgress[item.version]?.error }}
          </p>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
