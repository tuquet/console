import { computed, ref } from 'vue';

import { useKernel } from '@operon/kernel';

import { useMutation, useQuery } from '@tanstack/vue-query';
import { defineStore } from 'pinia';

import { createBrowserApi } from '../api/browsers';
import { $t } from '../locales';
import { getAutomationQueryClient } from './query-client';

export interface DriverProgressState {
  downloadedBytes?: number;
  error?: string;
  percent: number;
  stage: string;
  totalBytes?: number;
}

const DRIVERS_QUERY_KEY = ['browser-drivers'] as const;

export const useBrowserDriversStore = defineStore(
  'automation:browser-drivers',
  () => {
    const kernel = useKernel();
    const api = createBrowserApi(kernel.api);
    const queryClient = getAutomationQueryClient();

    const driverProgress = ref<Record<string, DriverProgressState>>({});

    const driversQuery = useQuery(
      {
        enabled: false,
        queryFn: () => api.listDrivers(),
        queryKey: DRIVERS_QUERY_KEY,
      },
      queryClient,
    );

    const drivers = computed(() =>
      Array.isArray(driversQuery.data.value?.releases)
        ? driversQuery.data.value.releases
        : [],
    );
    const activeDriverVersion = computed(
      () => driversQuery.data.value?.activeVersion ?? '',
    );
    const driversLoading = computed(() => driversQuery.isFetching.value);

    function pushDriverNotification(
      severity: 'error' | 'success',
      title: string,
      body?: string,
    ) {
      if (kernel.notifications?.push) {
        void kernel.notifications.push({ body, severity, title });
        return;
      }
      kernel.events.notify(severity, body ? `${title}: ${body}` : title);
    }

    async function fetchDrivers() {
      const result = await driversQuery.refetch();
      if (result.error) {
        throw result.error;
      }
      return result.data;
    }

    const installMutation = useMutation(
      {
        mutationFn: (version: string) => {
          driverProgress.value = {
            ...driverProgress.value,
            [version]: {
              downloadedBytes: 0,
              percent: 5,
              stage: 'downloading',
              totalBytes: 0,
            },
          };
          return api.installDriver(version);
        },
      },
      queryClient,
    );

    const useMutationOp = useMutation(
      {
        mutationFn: (version: string) => api.useDriver(version),
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: DRIVERS_QUERY_KEY });
          await driversQuery.refetch();
        },
      },
      queryClient,
    );

    const uninstallMutation = useMutation(
      {
        mutationFn: (version: string) => api.uninstallDriver(version),
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: DRIVERS_QUERY_KEY });
          await driversQuery.refetch();
        },
      },
      queryClient,
    );

    function applyProgressEvent(data: {
      downloadedBytes?: number;
      error?: string;
      percent?: number;
      stage?: string;
      totalBytes?: number;
      version: string;
    }) {
      const stage = String(data.stage ?? 'downloading');
      const prev = driverProgress.value[data.version];
      driverProgress.value = {
        ...driverProgress.value,
        [data.version]: {
          downloadedBytes:
            typeof data.downloadedBytes === 'number'
              ? data.downloadedBytes
              : prev?.downloadedBytes,
          error: data.error,
          percent: Number(data.percent ?? 0),
          stage,
          totalBytes:
            typeof data.totalBytes === 'number'
              ? data.totalBytes
              : prev?.totalBytes,
        },
      };

      if (stage === 'ready' && prev?.stage !== 'ready') {
        pushDriverNotification(
          'success',
          $t('automation.browsers.driver_installed_msg', {
            version: data.version,
          }),
        );
        void queryClient
          .invalidateQueries({ queryKey: DRIVERS_QUERY_KEY })
          .then(() => driversQuery.refetch());
      } else if (stage === 'error' && prev?.stage !== 'error') {
        pushDriverNotification(
          'error',
          $t('automation.browsers.driver_download_failed', {
            version: data.version,
          }),
          data.error || $t('automation.overview.browser_action_failed'),
        );
      }
    }

    return {
      activeDriverVersion,
      applyProgressEvent,
      driverProgress,
      drivers,
      driversLoading,
      fetchDrivers,
      installDriver: (version: string) => installMutation.mutateAsync(version),
      pushDriverNotification,
      uninstallDriver: (version: string) =>
        uninstallMutation.mutateAsync(version),
      useDriver: (version: string) => useMutationOp.mutateAsync(version),
    };
  },
);
