import type { SchemaSheetDefinition } from '@operon/common-ui';

import type { LinkedBrowserOption } from '../../api/tasks';
import type { Task, TaskDraft } from '../data/schema';

import { defineSchemaSheet } from '@operon/common-ui';

import { Globe, Star, Trash2 } from '@lucide/vue';

import { assignees, labels, priorities, statuses } from '../data/data';

const PROGRESS_STEPS = [0, 25, 50, 75, 100] as const;
const UNASSIGNED_BROWSER = '__unassigned__';

function snapToStep(val: number): number {
  let closest = 0;
  let minDiff = Infinity;
  for (const step of PROGRESS_STEPS) {
    const diff = Math.abs(step - val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = step;
    }
  }
  return closest;
}

export interface TaskInspectorSchemaOptions {
  getBrowsers: () => LinkedBrowserOption[];
  onCreate: (draft: TaskDraft) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onSave: (id: string, draft: TaskDraft) => Promise<void> | void;
}

export function createTaskInspectorSchema(
  opts: TaskInspectorSchemaOptions,
): SchemaSheetDefinition<Task, TaskDraft> {
  return defineSchemaSheet<Task, TaskDraft>({
    actions: [
      {
        class:
          'text-destructive hover:bg-destructive/10 hover:text-destructive -ml-2 px-2',
        closeOnSuccess: true,
        icon: Trash2,
        key: 'delete',
        label: 'Delete',
        onClick: async ({ record }) => {
          if (record) await opts.onDelete(record.id);
        },
        placement: 'footer-left',
        variant: 'ghost',
        visibleWhen: ({ mode, record }) => mode === 'edit' && Boolean(record),
      },
      {
        closeOnSuccess: true,
        key: 'cancel',
        label: 'Cancel',
        placement: 'footer-right',
        variant: 'outline',
      },
      {
        class: 'font-medium',
        disabledWhen: ({ form }) =>
          String(form.title ?? '').trim().length === 0,
        key: 'submit',
        label: ({ mode }) => (mode === 'edit' ? 'Save Changes' : 'Create Task'),
        placement: 'footer-right',
        submit: true,
        variant: 'default',
      },
    ],
    copyableId: ({ mode, record }) =>
      mode === 'edit' && record ? record.id : null,
    description: ({ mode }) =>
      mode === 'edit'
        ? 'Edit task properties and execution progress.'
        : 'Create a new engineering task.',
    key: 'tasks:task-inspector',
    metaText: ({ mode, record }) =>
      mode === 'edit' && record?.updatedAt ? `· ${record.updatedAt}` : null,
    onSubmit: async (values, { mode, record }) => {
      const payload: TaskDraft = {
        assignee: values.assignee,
        browserId: values.browserId ?? null,
        favorite: Boolean(values.favorite),
        label: values.label,
        priority: values.priority,
        progress: Number(values.progress ?? 0),
        status: values.status,
        title: String(values.title ?? '').trim(),
      };
      await (mode === 'edit' && record
        ? opts.onSave(record.id, payload)
        : opts.onCreate(payload));
    },
    sections: [
      {
        columns: 2,
        fields: [
          {
            colSpan: 2,
            component: 'Textarea',
            componentProps: {
              class: 'text-ui-input min-h-[56px] resize-none leading-snug',
              rows: 2,
            },
            label: 'Title',
            name: 'title',
            onEnterSubmit: true,
            placeholder: 'e.g. Harden TLS handshake timeout on edge proxy',
            required: true,
            rules: (val) =>
              String(val ?? '').trim().length > 0 || 'Task title is required.',
          },
          {
            colSpan: 1,
            component: 'OptionSelect',
            componentProps: {
              options: statuses.map((s) => ({
                icon: s.icon,
                label: s.label,
                value: s.value,
              })),
            },
            label: 'Status',
            name: 'status',
            onValueChange: (nextVal, { form, setFieldValue }) => {
              const value = String(nextVal);
              const progress = Number(form.progress ?? 0);
              if (value === 'done') setFieldValue('progress', 100);
              else if (value === 'canceled' || value === 'backlog') {
                setFieldValue('progress', 0);
              } else if (value === 'todo' && progress > 25) {
                setFieldValue('progress', 25);
              } else if (
                value === 'in progress' &&
                (progress === 0 || progress === 100)
              ) {
                setFieldValue('progress', 50);
              }
            },
            placeholder: 'Select status',
          },
          {
            colSpan: 1,
            component: 'OptionSelect',
            componentProps: {
              options: assignees.map((person) => ({
                avatarClass: person.avatarClass,
                initials: person.initials,
                label: person.label,
                value: person.value,
              })),
            },
            label: 'Assignee',
            name: 'assignee',
            placeholder: 'Select owner',
          },
          {
            colSpan: 2,
            component: 'OptionSelect',
            componentProps: () => ({
              fallbackIcon: Globe,
              nullableSentinel: UNASSIGNED_BROWSER,
              options: [
                {
                  italic: true,
                  label: 'Unassigned',
                  value: UNASSIGNED_BROWSER,
                },
                ...opts.getBrowsers().map((b) => ({
                  badge: b.id,
                  icon: Globe,
                  label: b.name,
                  value: b.id,
                })),
              ],
            }),
            label: 'Browser Profile',
            name: 'browserId',
            placeholder: 'Unassigned',
          },
          {
            colSpan: 2,
            component: 'ToggleGroup',
            componentProps: {
              options: priorities.map((p) => ({
                icon: p.icon,
                label: p.label,
                value: p.value,
              })),
            },
            label: 'Priority',
            name: 'priority',
          },
          {
            colSpan: 2,
            component: 'ToggleGroup',
            componentProps: {
              options: labels.map((l) => ({
                label: l.label,
                value: l.value,
              })),
            },
            label: 'Category',
            name: 'label',
          },
          {
            colSpan: 2,
            component: 'ProgressSteps',
            componentProps: { steps: PROGRESS_STEPS },
            description: ({ form }) => `${Number(form.progress ?? 0)}%`,
            label: 'Progress',
            name: 'progress',
            onValueChange: (raw, { form, setFieldValue }) => {
              const next = Number(raw);
              if (next === 100 && form.status !== 'done') {
                setFieldValue('status', 'done');
              } else if (next < 100 && form.status === 'done') {
                setFieldValue('status', 'in progress');
              }
            },
          },
          {
            colSpan: 2,
            component: 'SwitchCard',
            componentProps: {
              description: 'Surface quickly via the Pinned filter',
              icon: Star,
              title: 'Pin to favorites',
            },
            label: '',
            name: 'favorite',
          },
        ],
        id: 'task-form',
        kind: 'form',
      },
    ],
    title: ({ mode }) => (mode === 'edit' ? 'Task Details' : 'New Task'),
    toInitialValues: (record, mode) => {
      if (mode === 'edit' && record) {
        return {
          assignee: record.assignee,
          browserId: record.browserId ?? null,
          favorite: record.favorite,
          label: record.label,
          priority: record.priority,
          progress: snapToStep(record.progress),
          status: record.status,
          title: record.title,
        };
      }
      return {
        assignee: 'linh',
        browserId: null,
        favorite: false,
        label: 'feature',
        priority: 'medium',
        progress: 50,
        status: 'in progress',
        title: '',
      };
    },
    widthClass: 'sm:max-w-[420px]',
  });
}
