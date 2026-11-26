import { createApp, h, nextTick } from 'vue';

import { describe, expect, it, vi } from 'vitest';

import {
  defineSchemaSheet,
  getResourceSchema,
  registerResourceSchema,
  SchemaSheet,
} from '../index';

describe('schemaSheet & SchemaRegistry', () => {
  it('registers and resolves resource schemas by key', () => {
    const schema = defineSchemaSheet<{ id: string }>({
      key: 'test:resource-entity',
      sections: [
        {
          fields: [
            {
              component: 'Text',
              formatValue: (r) => r?.id,
              label: 'ID',
              name: 'id',
            },
          ],
          id: 'meta',
          kind: 'descriptions',
        },
      ],
      title: 'Test Entity',
    });

    expect(getResourceSchema('test:resource-entity')).toBe(schema);

    const custom = registerResourceSchema('test:custom-entity', schema);
    expect(getResourceSchema('test:custom-entity')).toBe(custom);
  });

  it('renders descriptions, tabs, form validation, cross-field sync, and submit actions', async () => {
    const onSubmit = vi.fn();
    const onDelete = vi.fn();

    const schema = defineSchemaSheet<
      { id: string; status: string; title: string },
      { progress: number; status: string; title: string }
    >({
      actions: [
        {
          closeOnSuccess: true,
          key: 'delete',
          label: 'Remove',
          onClick: ({ record }) => {
            if (record) onDelete(record.id);
          },
          placement: 'footer-left',
          variant: 'ghost',
        },
        {
          key: 'save',
          label: 'Save Item',
          placement: 'footer-right',
          submit: true,
        },
      ],
      copyableId: ({ record }) => record?.id,
      sections: [
        {
          fields: [
            {
              component: 'CopyableCode',
              formatValue: (r) => r?.id,
              label: 'Identifier',
              name: 'id',
            },
            {
              component: 'ByteSize',
              componentProps: { unit: 'mb' },
              formatValue: () => 256,
              label: 'Bundle',
              name: 'sizeMb',
            },
          ],
          id: 'overview-sec',
          kind: 'descriptions',
          tab: 'overview',
          tabLabel: 'Overview',
        },
        {
          columns: 2,
          fields: [
            {
              colSpan: 2,
              component: 'Input',
              label: 'Title',
              name: 'title',
              required: true,
              rules: (val) =>
                String(val ?? '').trim().length >= 3 ||
                'Title must be at least 3 chars.',
            },
            {
              colSpan: 2,
              component: 'ProgressSteps',
              label: 'Progress',
              name: 'progress',
              onValueChange: (val, { setFieldValue }) => {
                if (Number(val) === 100) setFieldValue('status', 'done');
              },
            },
          ],
          id: 'config-sec',
          kind: 'form',
          tab: 'config',
          tabLabel: 'Config',
        },
      ],
      onSubmit,
      title: ({ record }) => record?.title ?? 'Empty',
      toInitialValues: (r) => ({
        progress: 25,
        status: r?.status ?? 'todo',
        title: r?.title ?? '',
      }),
    });

    const host = document.createElement('div');
    document.body.append(host);
    const errors: unknown[] = [];
    const app = createApp({
      render: () =>
        h(SchemaSheet, {
          mode: 'edit',
          open: true,
          record: { id: 'DRV-1', status: 'todo', title: 'Initial' },
          schema,
        }),
    });
    app.config.errorHandler = (err) => errors.push(err);
    app.mount(host);
    await nextTick();

    expect(errors).toEqual([]);
    const header = document.body.querySelector('[data-slot="sheet-header"]');
    expect(
      header?.querySelector('[data-slot="sheet-title"]')?.textContent?.trim(),
    ).toBe('Initial');
    expect(header?.querySelectorAll('button').length).toBe(0);
    expect(header?.querySelectorAll('[data-slot="badge"]').length).toBe(0);

    expect(document.body.textContent).toContain('DRV-1');
    expect(document.body.textContent).toContain('256 MB');
    expect(document.body.textContent).toContain('Overview');
    expect(document.body.textContent).toContain('Config');

    // Trigger footer-left delete action
    const removeBtn = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Remove'),
    );
    removeBtn?.click();
    await nextTick();
    expect(onDelete).toHaveBeenCalledWith('DRV-1');

    // Switch to Config tab and submit valid form
    const configTab = [...document.body.querySelectorAll('[role="tab"]')].find(
      (el) => el.textContent?.includes('Config'),
    ) as HTMLElement | undefined;
    configTab?.focus();
    configTab?.dispatchEvent(new FocusEvent('focus'));
    await nextTick();
    await nextTick();

    expect(configTab?.dataset.state).toBe('active');
    expect(document.body.textContent).toContain('Title');
    expect(document.body.textContent).toContain('100%');

    const formEl = document.body.querySelector('form');
    formEl?.dispatchEvent(new Event('submit', { cancelable: true }));
    await Promise.resolve();
    await nextTick();

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: 25,
        status: 'todo',
        title: 'Initial',
      }),
      expect.objectContaining({ mode: 'edit' }),
    );

    app.unmount();
    host.remove();
  });

  it('requires second click when footer action specifies confirmLabel', async () => {
    const onUninstall = vi.fn();
    const schema = defineSchemaSheet<{ id: string }>({
      actions: [
        {
          confirmLabel: 'Confirm uninstall?',
          key: 'uninstall',
          label: 'Uninstall',
          onClick: ({ record }) => {
            if (record) onUninstall(record.id);
          },
          placement: 'footer-left',
        },
      ],
      sections: [
        {
          fields: [
            {
              component: 'Text',
              formatValue: (r) => r?.id,
              label: 'ID',
              name: 'id',
            },
          ],
          id: 'meta',
          kind: 'descriptions',
        },
      ],
      title: 'Driver',
    });

    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp({
      render: () =>
        h(SchemaSheet, {
          open: true,
          record: { id: 'v138' },
          schema,
        }),
    });
    app.mount(host);
    await nextTick();

    const btn = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Uninstall'),
    );
    btn?.click();
    await nextTick();
    expect(onUninstall).not.toHaveBeenCalled();
    expect(btn?.textContent).toContain('Confirm uninstall?');

    btn?.click();
    await nextTick();
    expect(onUninstall).toHaveBeenCalledWith('v138');

    app.unmount();
    host.remove();
  });
});
