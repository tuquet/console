import { useAccessStore } from '@operon/stores';

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useWorkspaceStore } from '../workspace';

vi.mock('@operon-core/shadcn-ui', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('#/locales', () => ({
  $t: (key: string, params?: any) => `${key}:${JSON.stringify(params || {})}`,
}));

vi.mock('#/utils/bugsink', () => ({
  captureError: vi.fn(),
  setBugsinkTag: vi.fn(),
}));

vi.mock('#/api/core/workspace', () => ({
  createWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
  getActiveWorkspaceId: vi.fn().mockReturnValue('workspace-1'),
  listWorkspaces: vi.fn().mockResolvedValue([
    { id: 'workspace-1', name: 'Workspace One', slug: 't1', status: 'active' },
    { id: 'workspace-2', name: 'Workspace Two', slug: 't2', status: 'active' },
  ]),
  setActiveWorkspaceId: vi.fn(),
  updateWorkspace: vi.fn(),
}));

describe('useWorkspaceStore Pinia store TDD suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const accessStore = useAccessStore();
    accessStore.setAccessToken('mock-access-token');
    vi.clearAllMocks();
  });

  it('initializes with activeWorkspaceId from storage', () => {
    const store = useWorkspaceStore();
    expect(store.activeWorkspaceId).toBe('workspace-1');
    expect(store.workspaces).toEqual([]);
    expect(store.activeWorkspace).toBeNull();
  });

  it('fetchWorkspaces populates store and resolves activeWorkspace correctly', async () => {
    const store = useWorkspaceStore();
    await store.fetchWorkspaces();

    expect(store.workspaces.length).toBe(2);
    expect(store.activeWorkspace?.name).toBe('Workspace One');
  });

  it('fetchWorkspaces returns local workspace and skips listWorkspaces when unauthenticated', async () => {
    const accessStore = useAccessStore();
    accessStore.setAccessToken(null);
    const store = useWorkspaceStore();
    const result = await store.fetchWorkspaces();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(store.workspaces[0]?.id).toBe('local-default');
    expect(store.activeWorkspace?.id).toBe('local-default');
  });

  it('setWorkspace updates active workspace and dispatches custom event', () => {
    const store = useWorkspaceStore();
    store.workspaces = [
      {
        id: 'workspace-1',
        name: 'Workspace One',
        slug: 't1',
        status: 'active',
        created_at: '',
        updated_at: '',
        avatar_url: null,
        created_by: null,
      },
      {
        id: 'workspace-2',
        name: 'Workspace Two',
        slug: 't2',
        status: 'active',
        created_at: '',
        updated_at: '',
        avatar_url: null,
        created_by: null,
      },
    ];

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    store.setWorkspace('workspace-2', true);

    expect(store.activeWorkspaceId).toBe('workspace-2');
    expect(store.activeWorkspace?.name).toBe('Workspace Two');
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('supports local workspace create, update, delete, and protects local-default', async () => {
    const accessStore = useAccessStore();
    accessStore.setAccessToken(null);
    const store = useWorkspaceStore();
    await store.fetchWorkspaces();

    const created = await store.createWorkspace({
      name: 'QA Lab',
      slug: 'qa-lab',
    });
    expect(created.slug).toBe('qa-lab');
    expect(store.activeWorkspaceId).toBe(created.id);

    await expect(
      store.createWorkspace({ name: 'Duplicate', slug: 'qa-lab' }),
    ).rejects.toThrow('page.workspace.duplicate_slug');

    const renamed = await store.updateWorkspace(created.id, {
      name: 'QA Studio',
    });
    expect(renamed.name).toBe('QA Studio');

    await expect(store.deleteWorkspace('local-default')).rejects.toThrow(
      'page.workspace.cannot_delete_default',
    );

    await store.deleteWorkspace(created.id);
    expect(store.activeWorkspaceId).toBe('local-default');
  });

  it('blocks workspace deletion when daemon reports running browsers and cascades offline cleanup', async () => {
    const accessStore = useAccessStore();
    accessStore.setAccessToken(null);
    const store = useWorkspaceStore();
    await store.fetchWorkspaces();
    const created = await store.createWorkspace({
      name: 'Temp Workspace',
      slug: 'temp-workspace',
    });

    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock.mockResolvedValueOnce({
      json: async () => [{ id: 'prf_running', isOnline: true }],
      ok: true,
    } as Response);

    await expect(store.deleteWorkspace(created.id)).rejects.toThrow(
      'page.workspace.running_browsers_block',
    );

    fetchMock.mockResolvedValueOnce({
      json: async () => [{ id: 'prf_offline', isOnline: false }],
      ok: true,
    } as Response);
    fetchMock.mockResolvedValueOnce({ ok: true } as Response);
    fetchMock.mockResolvedValueOnce({ ok: true } as Response);

    await store.deleteWorkspace(created.id);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8765/api/v1/browsers/batch/delete',
      expect.objectContaining({
        body: JSON.stringify({ force: false, ids: ['prf_offline'] }),
        method: 'POST',
      }),
    );
    fetchMock.mockRestore();
  });
});
