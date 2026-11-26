import type { KernelApiContext } from '@operon/kernel';

import type { Task, TaskDraft } from '../tasks/data/schema';

export interface LinkedBrowserOption {
  id: string;
  isOnline: boolean;
  name: string;
  workspaceId: string;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export function createTasksApi(api: KernelApiContext) {
  return {
    batchDelete: (ids: string[]) =>
      api.localDaemonFetch<{ count: number }>('/api/v1/tasks/batch/delete', {
        body: JSON.stringify({ ids }),
        headers: JSON_HEADERS,
        method: 'POST',
      }),

    bulkUpdate: (
      ids: string[],
      patch: Partial<
        Pick<Task, 'assignee' | 'browserId' | 'label' | 'priority' | 'status'>
      >,
    ) =>
      api.localDaemonFetch<{ count: number }>('/api/v1/tasks/bulk', {
        body: JSON.stringify({ ids, ...patch }),
        headers: JSON_HEADERS,
        method: 'POST',
      }),

    create: (input: TaskDraft & { workspaceId?: string }) =>
      api.localDaemonFetch<Task>('/api/v1/tasks', {
        body: JSON.stringify(input),
        headers: JSON_HEADERS,
        method: 'POST',
      }),

    list: (workspaceId?: string) => {
      const qs = new URLSearchParams();
      if (workspaceId) qs.set('workspaceId', workspaceId);
      const query = qs.toString();
      return api.localDaemonFetch<Task[]>(
        `/api/v1/tasks${query ? `?${query}` : ''}`,
      );
    },

    listBrowsers: (workspaceId?: string) => {
      const qs = new URLSearchParams({ scope: 'workspace' });
      if (workspaceId) qs.set('workspaceId', workspaceId);
      return api.localDaemonFetch<LinkedBrowserOption[]>(
        `/api/v1/browsers?${qs.toString()}`,
      );
    },

    patch: (id: string, patch: Partial<TaskDraft>) =>
      api.localDaemonFetch<Task>(`/api/v1/tasks/${encodeURIComponent(id)}`, {
        body: JSON.stringify(patch),
        headers: JSON_HEADERS,
        method: 'PATCH',
      }),
  };
}
