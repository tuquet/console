import type { KernelApiContext } from '@operon/kernel';

import type { LinkedBrowserOption } from '../api/tasks';
import type { Task, TaskDraft } from '../tasks/data/schema';

import { computed, ref } from 'vue';

import { useKernel } from '@operon/kernel';

import { defineStore } from 'pinia';

import { createTasksApi } from '../api/tasks';
import { assignees } from '../tasks/data/data';
import rawTasks from '../tasks/data/tasks.json';

const RELATIVE_TIMES = [
  '12m ago',
  '1h ago',
  '3h ago',
  'Yesterday',
  '2d ago',
  '4d ago',
  'Nov 06',
  'Nov 02',
];

function deriveProgress(status: string, index: number): number {
  if (status === 'done') return 100;
  if (status === 'canceled' || status === 'backlog') return 0;
  if (status === 'todo') return index % 2 === 0 ? 0 : 25;
  const inProgressSteps = [25, 50, 75] as const;
  return inProgressSteps[index % inProgressSteps.length] ?? 50;
}

export function hydrateSeedTasks(): Task[] {
  return rawTasks.map((item, index) => ({
    ...item,
    assignee: assignees[index % assignees.length]?.value ?? 'linh',
    browserId: null,
    browserName: null,
    favorite: index < 4 || (item.priority === 'high' && index % 9 === 0),
    progress: deriveProgress(item.status, index),
    updatedAt: RELATIVE_TIMES[index % RELATIVE_TIMES.length] ?? '1h ago',
  }));
}

function escapeCsvCell(
  value: boolean | null | number | string | undefined,
): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

export function tasksToCsv(rows: Task[]): string {
  const headers = [
    'id',
    'title',
    'status',
    'priority',
    'label',
    'assignee',
    'browserId',
    'browserName',
    'progress',
    'favorite',
    'updatedAt',
  ] as const;
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((key) => escapeCsvCell(row[key])).join(','),
    ),
  ];
  return lines.join('\n');
}

function tryUseKernel() {
  try {
    return useKernel();
  } catch {
    return null;
  }
}

export const useTasksStore = defineStore('tasks:tasks', () => {
  const kernel = tryUseKernel();
  const daemonApi: KernelApiContext | null =
    kernel?.api && typeof kernel.api.localDaemonFetch === 'function'
      ? kernel.api
      : null;
  const api = daemonApi ? createTasksApi(daemonApi) : null;

  const tasks = ref<Task[]>(hydrateSeedTasks());
  const browsers = ref<LinkedBrowserOption[]>([]);
  const loading = ref(false);
  const isDaemonBacked = ref(false);
  let seq = 9000;
  let eventSource: EventSource | null = null;
  let refreshTimer: null | ReturnType<typeof setTimeout> = null;

  function scheduleSync() {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      void syncFromDaemon().catch(() => {});
    }, 150);
  }

  function subscribeEvents() {
    if (!api || typeof EventSource === 'undefined' || eventSource) return;
    try {
      const port = daemonApi?.daemonPort || 8765;
      eventSource = new EventSource(`http://127.0.0.1:${port}/api/v1/events`);
      eventSource.addEventListener('message', (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (
            data?.type === 'task_changed' ||
            data?.type === 'browser_changed' ||
            data?.type === 'workspace_switched'
          ) {
            scheduleSync();
          }
        } catch {
          // ignore keepalive frames
        }
      });
    } catch {
      // ignore offline SSE errors
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

  const activeWorkspaceId = computed(
    () => kernel?.workspace?.activeId || 'local-default',
  );

  const metrics = computed(() => {
    const total = tasks.value.length;
    let inProgress = 0;
    let highPriority = 0;
    let done = 0;

    for (const task of tasks.value) {
      if (task.status === 'in progress') inProgress += 1;
      if (task.priority === 'high') highPriority += 1;
      if (task.status === 'done') done += 1;
    }

    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, inProgress, highPriority, done, completionRate };
  });

  function nextTaskId(): string {
    const existing = new Set(tasks.value.map((t) => t.id));
    while (existing.has(`TASK-${seq}`)) {
      seq += 1;
    }
    const id = `TASK-${seq}`;
    seq += 1;
    return id;
  }

  function normalizeProgress(status: string, progress: number): number {
    if (status === 'done') return 100;
    if (status === 'canceled') return 0;
    return Math.max(0, Math.min(100, Math.round(progress)));
  }

  function resolveBrowserName(browserId?: null | string): null | string {
    if (!browserId) return null;
    return browsers.value.find((b) => b.id === browserId)?.name ?? null;
  }

  async function syncFromDaemon() {
    if (!api) return;
    loading.value = true;
    try {
      const [taskList, browserList] = await Promise.all([
        api.list(activeWorkspaceId.value),
        api.listBrowsers(activeWorkspaceId.value),
      ]);
      tasks.value = Array.isArray(taskList) ? taskList : [];
      browsers.value = Array.isArray(browserList) ? browserList : [];
      isDaemonBacked.value = true;
    } finally {
      loading.value = false;
    }
  }

  function createTask(draft: TaskDraft): Task {
    const browserId = draft.browserId ?? null;
    const created: Task = {
      ...draft,
      browserId,
      browserName: resolveBrowserName(browserId),
      id: nextTaskId(),
      progress: normalizeProgress(draft.status, draft.progress),
      updatedAt: 'Just now',
    };
    tasks.value = [created, ...tasks.value];
    return created;
  }

  async function createTaskPersisted(draft: TaskDraft): Promise<Task> {
    if (!api || !isDaemonBacked.value) {
      return createTask(draft);
    }
    const created = await api.create({
      ...draft,
      workspaceId: activeWorkspaceId.value,
    });
    tasks.value = [created, ...tasks.value];
    return created;
  }

  function updateTask(
    id: string,
    patch: Partial<Omit<Task, 'id' | 'updatedAt'>>,
  ): Task | undefined {
    let updatedItem: Task | undefined;
    tasks.value = tasks.value.map((task) => {
      if (task.id !== id) return task;
      const nextStatus = patch.status ?? task.status;
      const nextProgress = normalizeProgress(
        nextStatus,
        patch.progress ?? task.progress,
      );
      const nextBrowserId =
        patch.browserId === undefined
          ? (task.browserId ?? null)
          : patch.browserId;
      const nextBrowserName =
        patch.browserId === undefined
          ? (task.browserName ?? null)
          : resolveBrowserName(nextBrowserId);

      updatedItem = {
        ...task,
        ...patch,
        browserId: nextBrowserId,
        browserName: nextBrowserName,
        progress: nextProgress,
        updatedAt: 'Just now',
      };
      return updatedItem;
    });
    return updatedItem;
  }

  async function updateTaskPersisted(
    id: string,
    patch: Partial<TaskDraft>,
  ): Promise<Task | undefined> {
    if (!api || !isDaemonBacked.value) {
      return updateTask(id, patch);
    }
    const updated = await api.patch(id, patch);
    tasks.value = tasks.value.map((t) => (t.id === id ? updated : t));
    return updated;
  }

  function duplicateTask(id: string): Task | undefined {
    const idx = tasks.value.findIndex((task) => task.id === id);
    const source = idx === -1 ? undefined : tasks.value[idx];
    if (!source) return undefined;
    const copy: Task = {
      ...source,
      id: nextTaskId(),
      title: `${source.title} (Copy)`,
      updatedAt: 'Just now',
    };
    const next = [...tasks.value];
    next.splice(idx + 1, 0, copy);
    tasks.value = next;
    return copy;
  }

  async function duplicateTaskPersisted(id: string): Promise<Task | undefined> {
    if (!api || !isDaemonBacked.value) {
      return duplicateTask(id);
    }
    const source = tasks.value.find((task) => task.id === id);
    if (!source) return undefined;
    const created = await api.create({
      assignee: source.assignee,
      browserId: source.browserId ?? null,
      favorite: source.favorite,
      label: source.label,
      priority: source.priority,
      progress: source.progress,
      status: source.status,
      title: `${source.title} (Copy)`,
      workspaceId: activeWorkspaceId.value,
    });
    tasks.value = [created, ...tasks.value];
    return created;
  }

  function toggleFavorite(id: string): boolean {
    const target = tasks.value.find((t) => t.id === id);
    if (!target) return false;
    const nextState = !target.favorite;
    updateTask(id, { favorite: nextState });
    return nextState;
  }

  async function toggleFavoritePersisted(id: string): Promise<boolean> {
    const target = tasks.value.find((t) => t.id === id);
    if (!target) return false;
    const nextState = !target.favorite;
    await updateTaskPersisted(id, { favorite: nextState });
    return nextState;
  }

  function bulkUpdate(
    ids: string[],
    patch: Partial<
      Pick<Task, 'assignee' | 'browserId' | 'label' | 'priority' | 'status'>
    >,
  ): number {
    const idSet = new Set(ids);
    let count = 0;
    tasks.value = tasks.value.map((task) => {
      if (!idSet.has(task.id)) return task;
      count += 1;
      const nextStatus = patch.status ?? task.status;
      const nextBrowserId =
        patch.browserId === undefined
          ? (task.browserId ?? null)
          : patch.browserId;
      const nextBrowserName =
        patch.browserId === undefined
          ? (task.browserName ?? null)
          : resolveBrowserName(nextBrowserId);
      return {
        ...task,
        ...patch,
        browserId: nextBrowserId,
        browserName: nextBrowserName,
        progress: normalizeProgress(nextStatus, task.progress),
        updatedAt: 'Just now',
      };
    });
    return count;
  }

  async function bulkUpdatePersisted(
    ids: string[],
    patch: Partial<
      Pick<Task, 'assignee' | 'browserId' | 'label' | 'priority' | 'status'>
    >,
  ): Promise<number> {
    if (!api || !isDaemonBacked.value) {
      return bulkUpdate(ids, patch);
    }
    const { count } = await api.bulkUpdate(ids, patch);
    bulkUpdate(ids, patch);
    return count;
  }

  function deleteTasks(ids: string[]): number {
    const idSet = new Set(ids);
    const before = tasks.value.length;
    tasks.value = tasks.value.filter((task) => !idSet.has(task.id));
    return before - tasks.value.length;
  }

  async function deleteTasksPersisted(ids: string[]): Promise<number> {
    if (!api || !isDaemonBacked.value) {
      return deleteTasks(ids);
    }
    const { count } = await api.batchDelete(ids);
    deleteTasks(ids);
    return count;
  }

  function resetTasks() {
    tasks.value = hydrateSeedTasks();
  }

  return {
    activeWorkspaceId,
    browsers,
    bulkUpdate,
    bulkUpdatePersisted,
    createTask,
    createTaskPersisted,
    deleteTasks,
    deleteTasksPersisted,
    duplicateTask,
    duplicateTaskPersisted,
    isDaemonBacked,
    loading,
    metrics,
    resetTasks,
    subscribeEvents,
    syncFromDaemon,
    tasks,
    toggleFavorite,
    toggleFavoritePersisted,
    unsubscribeEvents,
    updateTask,
    updateTaskPersisted,
  };
});
