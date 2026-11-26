import type { SchemaSheetDefinition } from '@operon/common-ui';

import type { DriverReleaseItem } from '../../api/browsers';
import type { DriverProgressState } from '../../stores/browser-drivers';

import { defineSchemaSheet } from '@operon/common-ui';

import { Check, Download, Trash2 } from '@lucide/vue';

import { $t } from '../../locales';

export interface DriverDetailSchemaOptions {
  getProgress: (version: string) => DriverProgressState | undefined;
  hasRunningSessions: () => boolean;
  isBusy: (version: string) => boolean;
  onCopy?: (text: string) => void;
  onInstall: (version: string) => Promise<void> | void;
  onSelect: (version: string) => Promise<void> | void;
  onUninstall: (version: string) => Promise<void> | void;
}

function isProgressActive(stage?: string): boolean {
  return stage === 'downloading' || stage === 'extracting';
}

function resolveIdleState(r: DriverReleaseItem): {
  idleLabel: string;
  idleVariant: 'default' | 'outline' | 'secondary';
} {
  if (r.isActive) {
    return {
      idleLabel: $t('automation.browsers.driver_selected'),
      idleVariant: 'default',
    };
  }
  if (r.installed) {
    return {
      idleLabel: $t('automation.browsers.drivers_state_installed'),
      idleVariant: 'secondary',
    };
  }
  return {
    idleLabel: $t('automation.browsers.drivers_state_available'),
    idleVariant: 'outline',
  };
}

export function createDriverDetailSchema(
  opts: DriverDetailSchemaOptions,
): SchemaSheetDefinition<DriverReleaseItem> {
  return defineSchemaSheet<DriverReleaseItem>({
    actions: [
      {
        class:
          'text-destructive hover:bg-destructive/10 hover:text-destructive -ml-2 px-2',
        closeOnSuccess: true,
        confirmLabel: () => $t('automation.browsers.driver_uninstall_confirm'),
        disabledWhen: ({ record }) =>
          !record ||
          !record.installed ||
          record.isActive ||
          opts.hasRunningSessions() ||
          opts.isBusy(record.version),
        icon: Trash2,
        key: 'uninstall',
        label: () => $t('automation.browsers.driver_uninstall_btn'),
        loadingWhen: ({ record }) =>
          Boolean(record && opts.isBusy(record.version)),
        onClick: async ({ record }) => {
          if (record) await opts.onUninstall(record.version);
        },
        placement: 'footer-left',
        variant: 'ghost',
        visibleWhen: ({ record }) => Boolean(record?.installed),
      },
      {
        disabledWhen: ({ record }) =>
          !record || isProgressActive(opts.getProgress(record.version)?.stage),
        icon: Download,
        key: 'install',
        label: () => $t('automation.browsers.driver_install_btn'),
        loadingWhen: ({ record }) =>
          Boolean(
            record && isProgressActive(opts.getProgress(record.version)?.stage),
          ),
        onClick: async ({ record }) => {
          if (record) await opts.onInstall(record.version);
        },
        placement: 'footer-right',
        variant: 'default',
        visibleWhen: ({ record }) => Boolean(record && !record.installed),
      },
      {
        disabledWhen: ({ record }) =>
          !record || record.isActive || opts.isBusy(record.version),
        icon: Check,
        key: 'select',
        label: () => $t('automation.browsers.driver_select_btn'),
        loadingWhen: ({ record }) =>
          Boolean(record && opts.isBusy(record.version)),
        onClick: async ({ record }) => {
          if (record) await opts.onSelect(record.version);
        },
        placement: 'footer-right',
        variant: 'default',
        visibleWhen: ({ record }) =>
          Boolean(record && record.installed && !record.isActive),
      },
    ],
    description: () => $t('automation.browsers.drivers_desc'),
    key: 'automation:browser-driver',
    sections: [
      {
        bordered: true,
        fields: [
          {
            component: 'CopyableCode',
            componentProps: {
              onCopy: opts.onCopy,
              prefix: 'v',
            },
            formatValue: (r) => r?.version,
            label: () => $t('automation.browsers.drivers_col_version'),
            name: 'version',
          },
          {
            component: 'BadgeValue',
            componentProps: {
              mono: true,
              uppercase: true,
              variant: 'outline',
            },
            formatValue: (r) => r?.channel,
            label: () => $t('automation.browsers.drivers_col_channel'),
            name: 'channel',
          },
          {
            component: 'BadgeValue',
            componentProps: {
              variantMap: {
                buggy: 'destructive',
                deprecated: 'destructive',
                recommended: 'secondary',
                stable: 'secondary',
              },
            },
            formatValue: (r) => r?.status,
            label: () => $t('automation.browsers.drivers_col_status'),
            name: 'status',
          },
          {
            component: 'ProgressStatus',
            formatValue: (r) => {
              if (!r) return null;
              const progress = opts.getProgress(r.version);
              const stageLabel =
                progress?.stage === 'extracting'
                  ? $t('automation.browsers.driver_stage_extracting')
                  : $t('automation.browsers.driver_stage_downloading');
              if (progress && isProgressActive(progress.stage)) {
                return {
                  downloadedBytes: progress.downloadedBytes,
                  percent: progress.percent,
                  stage: progress.stage,
                  stageLabel,
                  totalBytes: progress.totalBytes,
                };
              }
              if (progress?.stage === 'error') {
                return {
                  error:
                    progress.error ||
                    $t('automation.overview.browser_action_failed'),
                  idleLabel: $t('automation.browsers.drivers_state_failed'),
                  stage: 'error',
                };
              }
              return resolveIdleState(r);
            },
            label: () => $t('automation.browsers.drivers_col_state'),
            name: 'state',
          },
          {
            component: 'ByteSize',
            componentProps: { unit: 'mb' },
            formatValue: (r) => r?.sizeMb,
            label: () => $t('automation.browsers.drivers_col_size'),
            name: 'sizeMb',
          },
        ],
        id: 'driver-metadata',
        kind: 'descriptions',
      },
      {
        bordered: true,
        fields: [
          {
            component: 'Text',
            formatValue: (r) => r?.notes,
            label: () => $t('automation.browsers.drivers_col_notes'),
            name: 'notes',
            readOnly: true,
          },
        ],
        id: 'driver-notes',
        kind: 'form',
      },
    ],
    title: ({ record }) =>
      record ? `v${record.version}` : $t('automation.browsers.drivers_title'),
    widthClass: 'sm:max-w-[460px]',
  });
}
