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
import { useBrowserDriversStore } from './browser-drivers';
import { getAutomationQueryClient } from './query-client';

export type ScopeMode = 'all' | 'workspace';

export type BrowserSseStatus = 'connecting' | 'error' | 'open';

export interface BrowserSseEvent {
  action?: string;
  category: 'driver' | 'session' | 'system';
  id: string;
  message: string;
  severity: 'error' | 'info' | 'success' | 'warning';
  targetId?: string;
  timestamp: string;
  type: string;
}

const MAX_SSE_EVENTS = 100;

export const useBrowsersStore = defineStore('automation:browsers', () => {
  const kernel = useKernel();
  const api = createBrowserApi(kernel.api);
  const driversStore = useBrowserDriversStore();
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
  const sseStatus = ref<BrowserSseStatus>('connecting');
  const lastEventAt = ref<null | string>(null);
  const liveEvents = ref<BrowserSseEvent[]>([]);
  const killingAll = ref(false);

  let eventSource: EventSource | null = null;
  let refreshTimer: null | ReturnType<typeof setTimeout> = null;
  let sseSeq = 0;

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

  function recordLiveEvent(entry: Omit<BrowserSseEvent, 'id' | 'timestamp'>) {
    const now = new Date().toISOString();
    sseSeq += 1;
    lastEventAt.value = now;
    liveEvents.value = [
      {
        ...entry,
        id: `sse-${sseSeq}`,
        timestamp: now,
      },
      ...liveEvents.value,
    ].slice(0, MAX_SSE_EVENTS);
  }

  function clearLiveEvents() {
    liveEvents.value = [];
  }

  function resolveProfileLabel(id?: string): string {
    if (!id) return 'fleet';
    return items.value.find((b) => b.id === id)?.name || id;
  }

  function patchOnlineStateFromSse(data: Record<string, any>) {
    if (data.type === 'browser_offline' && data.all) {
      queryClient.setQueryData<BrowserProfileRecord[]>(
        browsersQueryKey.value,
        (prev) =>
          (prev ?? []).map((b) => ({
            ...b,
            debuggingPort: null,
            isOnline: false,
            pid: null,
            wsUrl: null,
          })),
      );
      if (detailTarget.value) {
        detailTarget.value = {
          ...detailTarget.value,
          debuggingPort: null,
          isOnline: false,
          pid: null,
          wsUrl: null,
        };
      }
      return;
    }

    const targetId = typeof data.id === 'string' ? data.id : '';
    if (!targetId) return;
    const isOnline = data.type === 'browser_online';
    const patch: Partial<BrowserProfileRecord> = isOnline
      ? {
          isOnline: true,
          ...(typeof data.pid === 'number' ? { pid: data.pid } : {}),
          ...(typeof data.debuggingPort === 'number'
            ? { debuggingPort: data.debuggingPort }
            : {}),
          ...(typeof data.wsUrl === 'string' ? { wsUrl: data.wsUrl } : {}),
        }
      : {
          debuggingPort: null,
          isOnline: false,
          pid: null,
          wsUrl: null,
        };

    queryClient.setQueryData<BrowserProfileRecord[]>(
      browsersQueryKey.value,
      (prev) =>
        (prev ?? []).map((b) => (b.id === targetId ? { ...b, ...patch } : b)),
    );
    if (detailTarget.value?.id === targetId) {
      detailTarget.value = { ...detailTarget.value, ...patch };
    }
  }

  async function killAllSessions() {
    killingAll.value = true;
    try {
      const res = await api.killAllSessions();
      patchOnlineStateFromSse({ all: true, type: 'browser_offline' });
      recordLiveEvent({
        action: 'kill_all',
        category: 'session',
        message: res.message || 'Stopped all running browser sessions',
        severity: 'warning',
        type: 'browser_offline',
      });
      await fetchBrowsers(true);
      return res;
    } finally {
      killingAll.value = false;
    }
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
    sseStatus.value = 'connecting';
    try {
      eventSource = new EventSource(
        `http://127.0.0.1:${kernel.api.daemonPort}/api/v1/events`,
      );
      eventSource.addEventListener('open', () => {
        sseStatus.value = 'open';
      });
      eventSource.addEventListener('error', () => {
        sseStatus.value =
          eventSource?.readyState === EventSource.CONNECTING
            ? 'connecting'
            : 'error';
      });
      eventSource.addEventListener('message', (evt) => {
        try {
          const data = JSON.parse(evt.data);
          sseStatus.value = 'open';
          if (data?.type === 'driver_download_progress' && data?.version) {
            const prevStage = driversStore.driverProgress[data.version]?.stage;
            driversStore.applyProgressEvent(data);
            if (
              data.stage === 'ready' ||
              data.stage === 'error' ||
              prevStage !== data.stage
            ) {
              let severity: BrowserSseEvent['severity'] = 'info';
              if (data.stage === 'error') {
                severity = 'error';
              } else if (data.stage === 'ready') {
                severity = 'success';
              }
              recordLiveEvent({
                action: String(data.stage ?? 'downloading'),
                category: 'driver',
                message:
                  data.stage === 'error'
                    ? `Driver v${data.version} failed: ${data.error || 'error'}`
                    : `Driver v${data.version} · ${data.stage} (${Number(data.percent ?? 0)}%)`,
                severity,
                targetId: String(data.version),
                type: 'driver_download_progress',
              });
            }
          } else if (data?.type === 'driver_changed') {
            recordLiveEvent({
              action: String(data.action ?? 'updated'),
              category: 'driver',
              message:
                `Driver v${data.version ?? ''} ${data.action ?? 'updated'}`.trim(),
              severity: 'info',
              targetId: data.version ? String(data.version) : undefined,
              type: 'driver_changed',
            });
            void driversStore.fetchDrivers().catch(() => {});
          } else if (data?.type === 'browser_online') {
            patchOnlineStateFromSse(data);
            const label = resolveProfileLabel(data.id);
            const portSuffix = data.debuggingPort
              ? ` · :${data.debuggingPort}`
              : '';
            recordLiveEvent({
              action: 'online',
              category: 'session',
              message: `${label} online${portSuffix}`,
              severity: 'success',
              targetId: data.id,
              type: 'browser_online',
            });
            scheduleSilentRefresh();
          } else if (data?.type === 'browser_offline') {
            patchOnlineStateFromSse(data);
            const label = data.all
              ? 'All sessions'
              : resolveProfileLabel(data.id);
            recordLiveEvent({
              action: 'offline',
              category: 'session',
              message: `${label} stopped`,
              severity: 'warning',
              targetId: data.id,
              type: 'browser_offline',
            });
            scheduleSilentRefresh();
          } else if (
            data?.type === 'browser_changed' ||
            data?.type === 'settings_updated' ||
            data?.type === 'workspace_switched'
          ) {
            let message = `${resolveProfileLabel(data.id)} ${data.action || 'updated'}`;
            if (data.type === 'workspace_switched') {
              message = 'Workspace switched';
            } else if (data.type === 'settings_updated') {
              message = 'Daemon settings updated';
            }
            recordLiveEvent({
              action: data.action ? String(data.action) : undefined,
              category: data.type === 'browser_changed' ? 'session' : 'system',
              message,
              severity: 'info',
              targetId: data.id,
              type: String(data.type),
            });
            scheduleSilentRefresh();
            if (data.type === 'settings_updated') {
              void driversStore.fetchDrivers().catch(() => {});
            }
          }
        } catch {
          // ignore keepalive / non-JSON frames
        }
      });
    } catch {
      sseStatus.value = 'error';
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
    sseStatus.value = 'connecting';
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
    clearLiveEvents,
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
    killAllSessions,
    killingAll,
    lastEventAt,
    launchProfile: (id: string, opts: StartSessionInput = {}) =>
      launchMutation.mutateAsync({ id, opts }),
    liveEvents,
    loading,
    makeDefaultProfile: async (id: string) => {
      await defaultMutation.mutateAsync(id);
    },
    moveProfileToWorkspace: (id: string, targetWorkspaceId: string) =>
      moveMutation.mutateAsync({ id, targetWorkspaceId }),
    mutatingIds,
    patchOnlineStateFromSse,
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
    sseStatus,
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
