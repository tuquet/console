import { computed, ref } from 'vue';

import { useKernel } from '@operon/kernel';

import { useMutation, useQuery } from '@tanstack/vue-query';
import { defineStore } from 'pinia';

import { createBrowserApi } from '../api/browsers';
import { getAutomationQueryClient } from './query-client';

const RUNTIMES_QUERY_KEY = ['browser-runtimes'] as const;

export const useBrowserRuntimesStore = defineStore(
  'automation:browser-runtimes',
  () => {
    const kernel = useKernel();
    const api = createBrowserApi(kernel.api);
    const queryClient = getAutomationQueryClient();

    const runtimeProgress = ref<
      Record<string, { error?: string; percent: number; stage: string }>
    >({});

    const runtimesQuery = useQuery(
      {
        enabled: false,
        queryFn: () => api.listRuntimes(),
        queryKey: RUNTIMES_QUERY_KEY,
      },
      queryClient,
    );

    const runtimes = computed(() => runtimesQuery.data.value?.releases ?? []);
    const activeRuntimeVersion = computed(
      () => runtimesQuery.data.value?.activeVersion ?? '',
    );
    const runtimesLoading = computed(() => runtimesQuery.isFetching.value);

    async function fetchRuntimes() {
      const result = await runtimesQuery.refetch();
      if (result.error) {
        throw result.error;
      }
      return result.data;
    }

    const installMutation = useMutation(
      {
        mutationFn: (version: string) => {
          runtimeProgress.value = {
            ...runtimeProgress.value,
            [version]: { percent: 10, stage: 'downloading' },
          };
          return api.installRuntime(version);
        },
      },
      queryClient,
    );

    const useMutationOp = useMutation(
      {
        mutationFn: (version: string) => api.useRuntime(version),
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: RUNTIMES_QUERY_KEY });
          await runtimesQuery.refetch();
        },
      },
      queryClient,
    );

    const deleteMutation = useMutation(
      {
        mutationFn: (version: string) => api.deleteRuntime(version),
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: RUNTIMES_QUERY_KEY });
          await runtimesQuery.refetch();
        },
      },
      queryClient,
    );

    function applyProgressEvent(data: {
      error?: string;
      percent?: number;
      stage?: string;
      version: string;
    }) {
      runtimeProgress.value = {
        ...runtimeProgress.value,
        [data.version]: {
          error: data.error,
          percent: Number(data.percent ?? 0),
          stage: String(data.stage ?? 'downloading'),
        },
      };
      if (data.stage === 'ready') {
        void queryClient
          .invalidateQueries({ queryKey: RUNTIMES_QUERY_KEY })
          .then(() => runtimesQuery.refetch());
      }
    }

    return {
      activeRuntimeVersion,
      applyProgressEvent,
      deleteRuntime: (version: string) => deleteMutation.mutateAsync(version),
      fetchRuntimes,
      installRuntime: (version: string) => installMutation.mutateAsync(version),
      runtimeProgress,
      runtimes,
      runtimesLoading,
      useRuntime: (version: string) => useMutationOp.mutateAsync(version),
    };
  },
);
