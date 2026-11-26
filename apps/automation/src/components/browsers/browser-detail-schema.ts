import type { SchemaSheetDefinition } from '@operon/common-ui';

import type { BrowserProfileRecord } from '../../api/browsers';

import { defineSchemaSheet } from '@operon/common-ui';

import {
  ArrowRightLeft,
  CheckCircle2,
  CopyPlus,
  Pencil,
  Play,
  Square,
  Star,
} from '@lucide/vue';

import { $t } from '../../locales';

export interface WorkspaceOption {
  id: string;
  name: string;
  slug: string;
}

export interface BrowserDetailFormState {
  extInput: string;
  moveWorkspaceId: string;
}

export interface BrowserDetailSchemaOptions {
  getDetailLoading: () => boolean;
  getMoving: () => boolean;
  getMutating: (id: string) => boolean;
  getSavingExts: () => boolean;
  getWorkspaces: () => WorkspaceOption[];
  onClone: (profile: BrowserProfileRecord) => Promise<void> | void;
  onCopy: (text: string) => void;
  onEdit: (profile: BrowserProfileRecord) => void;
  onMoveWorkspace: (
    profile: BrowserProfileRecord,
    workspaceId: string,
  ) => Promise<void> | void;
  onSaveExtensions: (
    profile: BrowserProfileRecord,
    extensions: string[],
  ) => Promise<void> | void;
  onSetDefault: (profile: BrowserProfileRecord) => Promise<void> | void;
  onToggleRun: (profile: BrowserProfileRecord) => Promise<void> | void;
}

function parseExtensions(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function createBrowserDetailSchema(
  opts: BrowserDetailSchemaOptions,
): SchemaSheetDefinition<BrowserProfileRecord, BrowserDetailFormState> {
  return defineSchemaSheet<BrowserProfileRecord, BrowserDetailFormState>({
    actions: [
      {
        disabledWhen: ({ record }) => !record || opts.getMutating(record.id),
        icon: Play,
        key: 'toggle-run',
        label: ({ record }) =>
          record?.isOnline
            ? $t('automation.browsers.action_stop')
            : $t('automation.browsers.action_run'),
        loadingWhen: ({ record }) =>
          Boolean(record && opts.getMutating(record.id)),
        onClick: async ({ record }) => {
          if (record) await opts.onToggleRun(record);
        },
        placement: 'header-bar',
        variant: 'default',
        visibleWhen: ({ record }) => Boolean(record && !record.isOnline),
      },
      {
        disabledWhen: ({ record }) => !record || opts.getMutating(record.id),
        icon: Square,
        key: 'stop-run',
        label: () => $t('automation.browsers.action_stop'),
        loadingWhen: ({ record }) =>
          Boolean(record && opts.getMutating(record.id)),
        onClick: async ({ record }) => {
          if (record) await opts.onToggleRun(record);
        },
        placement: 'header-bar',
        variant: 'destructive',
        visibleWhen: ({ record }) => Boolean(record?.isOnline),
      },
      {
        icon: Pencil,
        key: 'edit',
        label: () => $t('common.edit'),
        onClick: ({ record }) => {
          if (record) opts.onEdit(record);
        },
        placement: 'header-bar',
        variant: 'outline',
      },
      {
        disabledWhen: ({ record }) =>
          !record || record.isDefault || opts.getMutating(record.id),
        icon: Star,
        key: 'set-default',
        label: () => $t('automation.browsers.action_set_default'),
        onClick: async ({ record }) => {
          if (record) await opts.onSetDefault(record);
        },
        placement: 'header-bar',
        variant: 'outline',
      },
      {
        disabledWhen: ({ record }) => !record || opts.getMutating(record.id),
        icon: CopyPlus,
        key: 'clone',
        label: () => $t('automation.browsers.action_duplicate'),
        onClick: async ({ record }) => {
          if (record) await opts.onClone(record);
        },
        placement: 'header-bar',
        variant: 'outline',
      },
      {
        disabledWhen: ({ form, record }) => {
          if (!record || opts.getSavingExts()) return true;
          return (
            JSON.stringify(parseExtensions(form.extInput || '')) ===
            JSON.stringify(record.extensions)
          );
        },
        key: 'save-extensions',
        label: () => $t('automation.browsers.detail_save_extensions'),
        loadingWhen: () => opts.getSavingExts(),
        onClick: async ({ form, record }) => {
          if (!record) return;
          await opts.onSaveExtensions(
            record,
            parseExtensions(form.extInput || ''),
          );
        },
        placement: 'section',
        sectionId: 'extensions-panel',
        variant: 'default',
      },
    ],
    badges: ({ record }) => {
      if (!record) return [];
      const items = [];
      if (record.isOnline) {
        items.push({
          class: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
          label: $t('automation.browsers.running_badge'),
          variant: 'outline' as const,
        });
      }
      if (record.isDefault) {
        items.push({
          label: $t('automation.browsers.default_badge'),
          variant: 'secondary' as const,
        });
      }
      return items;
    },
    copyableId: ({ record }) => record?.id,
    copyableIdTitle: () => $t('automation.browsers.detail_copy_id'),
    defaultTab: 'overview',
    description: ({ record }) =>
      record?.id || $t('automation.browsers.detail_title'),
    key: 'automation:browser-profile',
    sections: [
      {
        bordered: true,
        fields: [
          {
            component: 'Text',
            componentProps: { emptyText: 'default', mono: true },
            formatValue: (r) => r?.groupName || 'default',
            label: () => $t('automation.browsers.field_group'),
            name: 'groupName',
          },
          {
            component: 'CopyableCode',
            componentProps: {
              emptyBadge: $t('automation.browsers.direct_badge'),
              onCopy: opts.onCopy,
            },
            formatValue: (r) => r?.proxy || '',
            label: () => $t('automation.browsers.col_proxy'),
            name: 'proxy',
          },
          {
            component: 'ByteSize',
            componentProps: { unit: 'bytes' },
            formatValue: (r) => r?.diskSizeBytes,
            label: () => $t('automation.browsers.detail_disk_size'),
            loadingWhen: ({ record }) =>
              Boolean(
                opts.getDetailLoading() && record?.diskSizeBytes === undefined,
              ),
            name: 'diskSizeBytes',
          },
          {
            component: 'TagList',
            componentProps: { prefix: '#' },
            formatValue: (r) => r?.tags ?? [],
            label: 'Tags',
            name: 'tags',
            visibleWhen: ({ record }) =>
              Boolean(record && record.tags.length > 0),
          },
          {
            component: 'Text',
            componentProps: { mono: true },
            formatValue: (r) =>
              r?.pid ? `${r.pid} · :${r.debuggingPort}` : '',
            label: 'PID / CDP Port',
            name: 'pidPort',
            visibleWhen: ({ record }) => Boolean(record?.pid),
          },
          {
            component: 'CopyableCode',
            componentProps: { onCopy: opts.onCopy },
            formatValue: (r) => r?.wsUrl || '',
            label: () => $t('automation.browsers.detail_cdp_ws'),
            name: 'wsUrl',
            visibleWhen: ({ record }) => Boolean(record?.wsUrl),
          },
        ],
        id: 'overview-meta',
        kind: 'descriptions',
        tab: 'overview',
        tabLabel: $t('automation.browsers.detail_overview'),
      },
      {
        bordered: true,
        fields: [
          {
            component: 'ActionSelect',
            componentProps: ({ form, record }) => ({
              actionDisabled:
                opts.getMoving() ||
                Boolean(record?.isOnline) ||
                !form.moveWorkspaceId ||
                form.moveWorkspaceId === record?.workspaceId,
              actionIcon: ArrowRightLeft,
              actionLabel: $t('automation.browsers.detail_move_btn'),
              actionLoading: opts.getMoving(),
              onAction: async (targetId: string) => {
                if (record) await opts.onMoveWorkspace(record, targetId);
              },
              options: opts.getWorkspaces().map((w) => ({
                label: `${w.name} (${w.slug})`,
                value: w.id,
              })),
            }),
            label: () => $t('automation.browsers.action_move_workspace'),
            name: 'moveWorkspaceId',
          },
        ],
        id: 'overview-workspace',
        kind: 'form',
        tab: 'overview',
        tabLabel: $t('automation.browsers.detail_overview'),
        visibleWhen: () => opts.getWorkspaces().length > 1,
      },
      {
        bordered: true,
        columns: 2,
        fields: [
          {
            component: 'Text',
            componentProps: { class: 'font-medium capitalize' },
            formatValue: (r) => r?.fingerprintConfig?.osPlatform || 'windows',
            label: 'OS',
            name: 'osPlatform',
          },
          {
            component: 'Text',
            componentProps: { class: 'font-medium', mono: true },
            formatValue: (r) => r?.fingerprintConfig?.seed || 'Auto',
            label: 'Seed',
            name: 'seed',
          },
          {
            component: 'Text',
            componentProps: { class: 'font-medium' },
            formatValue: (r) =>
              `${r?.fingerprintConfig?.hardwareConcurrency || 8}c / ${r?.fingerprintConfig?.deviceMemoryGb || 16} GB`,
            label: 'CPU / RAM',
            name: 'cpuRam',
          },
          {
            component: 'Text',
            componentProps: { mono: true },
            formatValue: (r) =>
              `${r?.fingerprintConfig?.screenWidth || 1920}x${r?.fingerprintConfig?.screenHeight || 1080}`,
            label: 'Viewport',
            name: 'viewport',
          },
          {
            component: 'Text',
            componentProps: { class: 'font-medium' },
            formatValue: (r) =>
              r?.fingerprintConfig?.webrtcMode || 'proxy_shielded',
            label: 'WebRTC',
            name: 'webrtcMode',
          },
          {
            component: 'Text',
            componentProps: { mono: true, wrap: false },
            formatValue: (r) =>
              `${r?.timezone || 'Auto'} · ${r?.fingerprintConfig?.lang || 'en-US'}`,
            label: 'Timezone / Lang',
            name: 'tzLang',
          },
        ],
        id: 'fingerprint-grid',
        kind: 'grid',
        tab: 'fingerprint',
        tabLabel: $t('automation.browsers.detail_fingerprint'),
      },
      {
        bordered: false,
        fields: [
          {
            component: 'Input',
            label: () => $t('automation.browsers.detail_extensions_hint'),
            name: 'extInput',
            placeholder: 'automation, /path/to/unpacked',
          },
          {
            component: 'TagList',
            componentProps: { icon: CheckCircle2 },
            formatValue: (r) => r?.extensions ?? [],
            label: '',
            name: 'installedExtensions',
            readOnly: true,
            visibleWhen: ({ record }) =>
              Boolean(record && record.extensions.length > 0),
          },
        ],
        id: 'extensions-panel',
        kind: 'form',
        tab: 'extensions',
        tabLabel: $t('automation.browsers.detail_extensions'),
      },
    ],
    title: ({ record }) =>
      record?.name || $t('automation.browsers.detail_title'),
    toInitialValues: (record) => ({
      extInput: record ? record.extensions.join(', ') : '',
      moveWorkspaceId: record?.workspaceId ?? '',
    }),
    widthClass: 'sm:max-w-[520px]',
  });
}
