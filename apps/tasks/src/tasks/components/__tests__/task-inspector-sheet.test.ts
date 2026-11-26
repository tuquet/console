import { createApp, h, nextTick } from 'vue';

import { describe, expect, it, vi } from 'vitest';

import TaskInspectorSheet from '../task-inspector-sheet.vue';

describe('taskInspectorSheet (SchemaSheet)', () => {
  it('renders edit fields, disables submit on blank title, and emits save on submit', async () => {
    const onSave = vi.fn();
    const onDelete = vi.fn();
    const host = document.createElement('div');
    document.body.append(host);

    const app = createApp({
      render: () =>
        h(TaskInspectorSheet, {
          browsers: [
            {
              id: 'br-1',
              isOnline: false,
              name: 'Main Chrome',
              workspaceId: 'local-default',
            },
          ],
          mode: 'edit',
          onDelete,
          onSave,
          open: true,
          task: {
            assignee: 'linh',
            browserId: 'br-1',
            favorite: true,
            id: 'TASK-101',
            label: 'feature',
            priority: 'high',
            progress: 50,
            status: 'in progress',
            title: 'Ship SchemaSheet',
            updatedAt: '5m ago',
          },
        }),
    });
    app.mount(host);
    await nextTick();

    expect(document.body.textContent).toContain('Task Details');
    expect(document.body.textContent).toContain('TASK-101');
    expect(document.body.textContent).toContain('50%');
    expect(document.body.textContent).toContain('Pin to favorites');

    // Click 100% progress button and verify bidirectional status -> done and Save emit
    const btn100 = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === '100%',
    );
    btn100?.click();
    await nextTick();
    expect(document.body.textContent).toContain('100%');

    const form = document.body.querySelector('form');
    form?.dispatchEvent(new Event('submit', { cancelable: true }));
    await Promise.resolve();
    await Promise.resolve();
    await nextTick();

    expect(onSave).toHaveBeenCalledWith(
      'TASK-101',
      expect.objectContaining({
        browserId: 'br-1',
        favorite: true,
        progress: 100,
        status: 'done',
        title: 'Ship SchemaSheet',
      }),
    );

    const deleteBtn = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Delete'),
    );
    deleteBtn?.click();
    await Promise.resolve();
    await nextTick();
    expect(onDelete).toHaveBeenCalledWith('TASK-101');

    app.unmount();
    host.remove();
  });
});
