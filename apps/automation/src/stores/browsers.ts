import type {
  BrowserProfileRecord,
  CloneBrowserInput,
  CreateBrowserInput,
  PatchBrowserPatch,
  ProbeProxyResult,
  StartSessionInput,
} from '../api/browsers';

import { computed, ref, watch } from 'vue';

import { useKernel } from '@operon/kernel';

import { useMutation, useQuery } from '@tanstack/vue-query';
import { defineStore } from 'pinia';

import { createBrowserApi } from '../api/browsers';
import { useBrowserRuntimesStore } from './browser-runtimes';
import { getAutomationQueryClient } from './query-client';

export type ScopeMode = 'all' | 'workspace';

export const useBrowsersStore = defineStore('automation:browsers', () => {
  const kernel = useKernel();
  const api = createBrowserApi(kernel.api);
  const runtimesStore = useBrowserRuntimesStore();
  const queryClient = getAutomationQueryClient();

  const detailTarget = ref<BrowserProfileRecord | null>(null);
  const detailLoading = ref(false);
  const silentRefreshing = ref(false);

  const scopeMode = ref<ScopeMode>('workspace');
  const searchQuery = ref('');
  const statusFilter = ref<'all' | 'offline' | 'online'>('all');
  const proxyFilter = ref<'all' | 'direct' | 'proxied'>('all');
  const platformFilter = ref<'all' | 'linux' | 'macos' | 'windows'>('all');

  const selectedIds = ref<string[]>([]);
  const mutatingIds = ref<string[]>([]);

  let eventSource: EventSource | null = null;
  let refreshTimer: null | ReturnType<typeof setTimeout> = null;

  const activeWorkspaceId = computed(
    () => kernel.workspace.activeId || 'local-default',
  );

  const browsersQueryKey = computed(
    () =>
      [
        'browsers',
        scopeMode.value,
        scopeMode.value === 'workspace' ? activeWorkspaceId.value : 'all',
      ] as const,
  );

  const browsersQuery = useQuery(
    {
      enabled: false,
      queryFn: async () => {
        const list = await api.list({
          scope: scopeMode.value,
          workspaceId:
            scopeMode.value === 'workspace'
              ? activeWorkspaceId.value
              : undefined,
        });
        return Array.isArray(list) ? list : [];
      },
      queryKey: browsersQueryKey,
    },
    queryClient,
  );

  const items = computed<BrowserProfileRecord[]>(
    () => browsersQuery.data.value ?? [],
  );
  const loading = computed(
    () => !silentRefreshing.value && browsersQuery.isFetching.value,
  );
  const error = computed<null | string>(() => {
    const err = browsersQuery.error.value;
    return err
      ? (err as Error).message || 'Failed to load browser profiles'
      : null;
  });

  const filteredItems = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    return items.value.filter((item) => {
      if (statusFilter.value === 'online' && !item.isOnline) return false;
      if (statusFilter.value === 'offline' && item.isOnline) return false;

      const hasProxy = Boolean(item.proxy?.trim());
      if (proxyFilter.value === 'proxied' && !hasProxy) return false;
      if (proxyFilter.value === 'direct' && hasProxy) return false;

      const os = (
        item.fingerprintConfig?.osPlatform || 'windows'
      ).toLowerCase();
      if (platformFilter.value !== 'all' && os !== platformFilter.value) {
        return false;
      }

      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.groupName || '').toLowerCase().includes(q) ||
        (item.proxy || '').toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  });

  const stats = computed(() => {
    const total = items.value.length;
    const running = items.value.filter((b) => b.isOnline).length;
    const proxied = items.value.filter((b) => Boolean(b.proxy?.trim())).length;
    const direct = total - proxied;
    return {
      direct,
      proxied,
      running,
      selected: selectedIds.value.length,
      total,
    };
  });

  const selectedProfiles = computed(() => {
    const idSet = new Set(selectedIds.value);
    return items.value.filter((b) => idSet.has(b.id));
  });

  const allFilteredSelected = computed(() => {
    if (filteredItems.value.length === 0) return false;
    const idSet = new Set(selectedIds.value);
    return filteredItems.value.every((b) => idSet.has(b.id));
  });

  function setMutating(id: string, active: boolean) {
    if (active) {
      if (!mutatingIds.value.includes(id)) {
        mutatingIds.value = [...mutatingIds.value, id];
      }
    } else {
      mutatingIds.value = mutatingIds.value.filter((item) => item !== id);
    }
  }

  function isMutating(id: string): boolean {
    return mutatingIds.value.includes(id);
  }

  function toggleSelected(id: string) {
    selectedIds.value = selectedIds.value.includes(id)
      ? selectedIds.value.filter((item) => item !== id)
      : [...selectedIds.value, id];
  }

  function toggleSelectAllFiltered() {
    if (allFilteredSelected.value) {
      const visible = new Set(filteredItems.value.map((b) => b.id));
      selectedIds.value = selectedIds.value.filter((id) => !visible.has(id));
    } else {
      const merged = new Set(selectedIds.value);
      for (const b of filteredItems.value) {
        merged.add(b.id);
      }
      selectedIds.value = [...merged];
    }
  }

  function clearSelection() {
    selectedIds.value = [];
  }

  function syncSelectionAndDetail(list: BrowserProfileRecord[]) {
    const validIds = new Set(list.map((b) => b.id));
    selectedIds.value = selectedIds.value.filter((id) => validIds.has(id));

    if (detailTarget.value) {
      const refreshed = list.find((b) => b.id === detailTarget.value?.id);
      if (refreshed) {
        detailTarget.value = { ...detailTarget.value, ...refreshed };
      }
    }
  }

  async function fetchBrowsers(silent = false) {
    if (silent) {
      silentRefreshing.value = true;
    }
    try {
      const res = await browsersQuery.refetch();
      const list = res.data ?? items.value;
      syncSelectionAndDetail(list);
      return list;
    } finally {
      silentRefreshing.value = false;
    }
  }

  async function inspectBrowser(id: string) {
    detailLoading.value = true;
    try {
      const detail = await queryClient.fetchQuery({
        queryFn: () => api.detail(id),
        queryKey: ['browser-detail', id],
        staleTime: 5000,
      });
      detailTarget.value = detail;
      return detail;
    } finally {
      detailLoading.value = false;
    }
  }

  async function withRowMutation<T>(
    id: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    setMutating(id, true);
    try {
      return await fn();
    } finally {
      setMutating(id, false);
    }
  }

  function updateCachedRecord(updated: BrowserProfileRecord) {
    queryClient.setQueryData<BrowserProfileRecord[]>(
      browsersQueryKey.value,
      (prev) => (prev ?? []).map((b) => (b.id === updated.id ? updated : b)),
    );
    if (detailTarget.value?.id === updated.id) {
      detailTarget.value = updated;
    }
  }

  const createMutation = useMutation(
    {
      mutationFn: (input: CreateBrowserInput) =>
        api.create({
          ...input,
          workspaceId: input.workspaceId || activeWorkspaceId.value,
        }),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['browsers'] });
        await fetchBrowsers(true);
      },
    },
    queryClient,
  );

  const patchMutation = useMutation(
    {
      mutationFn: ({ id, patch }: { id: string; patch: PatchBrowserPatch }) =>
        withRowMutation(id, () => api.patch(id, patch)),
      onSuccess: (updated) => {
        updateCachedRecord(updated);
      },
    },
    queryClient,
  );

  const removeMutation = useMutation(
    {
      mutationFn: ({ force, id }: { force: boolean; id: string }) =>
        withRowMutation(id, () => api.remove(id, force)),
      onSuccess: (_res, { id }) => {
        queryClient.setQueryData<BrowserProfileRecord[]>(
          browsersQueryKey.value,
          (prev) => (prev ?? []).filter((b) => b.id !== id),
        );
        selectedIds.value = selectedIds.value.filter((item) => item !== id);
        if (detailTarget.value?.id === id) {
          detailTarget.value = null;
        }
      },
    },
    queryClient,
  );

  const unbindMutation = useMutation(
    {
      mutationFn: (id: string) => withRowMutation(id, () => api.unbind(id)),
      onSuccess: async () => {
        await fetchBrowsers(true);
      },
    },
    queryClient,
  );

  const launchMutation = useMutation(
    {
      mutationFn: ({ id, opts }: { id: string; opts: StartSessionInput }) =>
        withRowMutation(id, () => api.startSession(id, opts)),
      onSuccess: async () => {
        await fetchBrowsers(true);
      },
    },
    queryClient,
  );

  const stopMutation = useMutation(
    {
      mutationFn: ({ force, id }: { force: boolean; id: string }) =>
        withRowMutation(id, () => api.stopSession(id, force)),
      onSuccess: async () => {
        await fetchBrowsers(true);
      },
    },
    queryClient,
  );

  const defaultMutation = useMutation(
    {
      mutationFn: (id: string) => withRowMutation(id, () => api.setDefault(id)),
      onSuccess: async () => {
        await fetchBrowsers(true);
      },
    },
    queryClient,
  );

  const cloneMutation = useMutation(
    {
      mutationFn: ({ id, input }: { id: string; input: CloneBrowserInput }) =>
        withRowMutation(id, () => api.clone(id, input)),
      onSuccess: async () => {
        await fetchBrowsers(true);
      },
    },
    queryClient,
  );

  const moveMutation = useMutation(
    {
      mutationFn: ({
        id,
        targetWorkspaceId,
      }: {
        id: string;
        targetWorkspaceId: string;
      }) => withRowMutation(id, () => api.move(id, { targetWorkspaceId })),
      onSuccess: async (moved, { id, targetWorkspaceId }) => {
        await fetchBrowsers(true);
        if (detailTarget.value?.id === id) {
          detailTarget.value =
            scopeMode.value === 'workspace' &&
            targetWorkspaceId !== activeWorkspaceId.value
              ? null
              : moved;
        }
      },
    },
    queryClient,
  );

  const extensionsMutation = useMutation(
    {
      mutationFn: ({
        allowRemoveAutomation,
        extensions,
        id,
      }: {
        allowRemoveAutomation: boolean;
        extensions: string[];
        id: string;
      }) =>
        withRowMutation(id, () =>
          api.updateExtensions(id, extensions, allowRemoveAutomation),
        ),
      onSuccess: (updated) => {
        updateCachedRecord(updated);
      },
    },
    queryClient,
  );

  const batchDeleteMutation = useMutation(
    {
      mutationFn: ({ force, ids }: { force: boolean; ids: string[] }) =>
        api.batchDelete(ids, force),
      onSuccess: async () => {
        await fetchBrowsers(true);
      },
    },
    queryClient,
  );

  const importCsvMutation = useMutation(
    {
      mutationFn: (csvString: string) =>
        api.importCsv(csvString, activeWorkspaceId.value),
      onSuccess: async (res) => {
        if (res.imported > 0) {
          await fetchBrowsers(true);
        }
      },
    },
    queryClient,
  );

  const autoDetectMutation = useMutation(
    {
      mutationFn: () => api.autoDetect(),
      onSuccess: async () => {
        await fetchBrowsers(true);
      },
    },
    queryClient,
  );

  function probeProxy(proxy: string): Promise<ProbeProxyResult> {
    return api.probeProxy({ proxy, timeoutSecs: 5 });
  }

  async function batchLaunchSelected(targets?: BrowserProfileRecord[]) {
    const offline = (targets ?? selectedProfiles.value).filter(
      (b) => !b.isOnline,
    );
    let started = 0;
    for (const profile of offline) {
      try {
        await launchMutation.mutateAsync({ id: profile.id, opts: {} });
        started += 1;
      } catch {
        // continue remaining rows
      }
    }
    return { started, total: offline.length };
  }

  async function batchStopSelected(targets?: BrowserProfileRecord[]) {
    const running = (targets ?? selectedProfiles.value).filter(
      (b) => b.isOnline,
    );
    let stopped = 0;
    for (const profile of running) {
      try {
        await stopMutation.mutateAsync({ force: false, id: profile.id });
        stopped += 1;
      } catch {
        // continue remaining rows
      }
    }
    return { stopped, total: running.length };
  }

  async function batchRemoveSelected(force = false, targetIds?: string[]) {
    const ids = targetIds ? [...targetIds] : [...selectedIds.value];
    if (ids.length === 0) {
      return { deleted: [], errors: [], skipped: [] };
    }
    return await batchDeleteMutation.mutateAsync({ force, ids });
  }

  function scheduleSilentRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: ['browsers'] });
      void fetchBrowsers(true);
    }, 150);
  }

  function subscribeEvents() {
    if (typeof EventSource === 'undefined' || eventSource) return;
    try {
      eventSource = new EventSource(
        `http://127.0.0.1:${kernel.api.daemonPort}/api/v1/events`,
      );
      eventSource.addEventListener('message', (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data?.type === 'runtime_download_progress' && data?.version) {
            runtimesStore.applyProgressEvent(data);
          } else if (
            data?.type === 'browser_changed' ||
            data?.type === 'browser_online' ||
            data?.type === 'browser_offline' ||
            data?.type === 'settings_updated' ||
            data?.type === 'workspace_switched'
          ) {
            scheduleSilentRefresh();
          }
        } catch {
          // ignore keepalive / non-JSON frames
        }
      });
    } catch {
      // ignore SSE connection errors while offline
    }
  }

  function unsubscribeEvents() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  }

  watch(activeWorkspaceId, () => {
    clearSelection();
    detailTarget.value = null;
    if (scopeMode.value === 'workspace') {
      void fetchBrowsers();
    }
  });

  watch(scopeMode, () => {
    clearSelection();
    void fetchBrowsers();
  });

  return {
    activeWorkspaceId,
    allFilteredSelected,
    autoDetect: () => autoDetectMutation.mutateAsync(),
    batchLaunchSelected,
    batchRemoveSelected,
    batchStopSelected,
    clearSelection,
    cloneProfile: (id: string, input: CloneBrowserInput = {}) =>
      cloneMutation.mutateAsync({ id, input }),
    createProfile: (input: CreateBrowserInput) =>
      createMutation.mutateAsync(input),
    detailLoading,
    detailTarget,
    error,
    fetchBrowsers,
    filteredItems,
    importCsv: (csvString: string) => importCsvMutation.mutateAsync(csvString),
    inspectBrowser,
    isMutating,
    items,
    launchProfile: (id: string, opts: StartSessionInput = {}) =>
      launchMutation.mutateAsync({ id, opts }),
    loading,
    makeDefaultProfile: async (id: string) => {
      await defaultMutation.mutateAsync(id);
    },
    moveProfileToWorkspace: (id: string, targetWorkspaceId: string) =>
      moveMutation.mutateAsync({ id, targetWorkspaceId }),
    mutatingIds,
    patchProfile: (id: string, patch: PatchBrowserPatch) =>
      patchMutation.mutateAsync({ id, patch }),
    platformFilter,
    probeProxy,
    proxyFilter,
    removeProfile: (id: string, force = false) =>
      removeMutation.mutateAsync({ force, id }),
    scopeMode,
    searchQuery,
    selectedIds,
    selectedProfiles,
    stats,
    statusFilter,
    stopProfile: (id: string, force = false) =>
      stopMutation.mutateAsync({ force, id }),
    subscribeEvents,
    toggleSelectAllFiltered,
    toggleSelected,
    unbindProfile: (id: string) => unbindMutation.mutateAsync(id),
    unsubscribeEvents,
    updateExtensions: (
      id: string,
      extensions: string[],
      allowRemoveAutomation = false,
    ) =>
      extensionsMutation.mutateAsync({
        allowRemoveAutomation,
        extensions,
        id,
      }),
  };
});
