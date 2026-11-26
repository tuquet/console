<script lang="ts" setup>
import type { BrowserProfileRecord } from '../../api/browsers';

import { ref } from 'vue';

import { SchemaSheet } from '@operon/common-ui';
import { useKernel } from '@operon/kernel';

import { $t } from '../../locales';
import { useBrowsersStore } from '../../stores/browsers';
import { createBrowserDetailSchema } from './browser-detail-schema';

defineOptions({ name: 'BrowserDetailSheet' });

const props = defineProps<{
  profile: BrowserProfileRecord | null;
}>();

const emit = defineEmits<{
  edit: [profile: BrowserProfileRecord];
}>();

const open = defineModel<boolean>('open', { default: false });

const kernel = useKernel();
const store = useBrowsersStore();

const savingExts = ref(false);
const moving = ref(false);

async function runProfileAction(
  action: () => Promise<void>,
  successMessage: string,
) {
  try {
    await action();
    kernel.events.notify('success', successMessage);
  } catch (error: any) {
    kernel.events.notify(
      'error',
      error?.message || $t('automation.overview.browser_action_failed'),
    );
  }
}

const schema = createBrowserDetailSchema({
  getDetailLoading: () => store.detailLoading,
  getMoving: () => moving.value,
  getMutating: (id) => store.isMutating(id),
  getSavingExts: () => savingExts.value,
  getWorkspaces: () => kernel.workspace.items,
  onClone: async (profile) => {
    try {
      const cloned = await store.cloneProfile(profile.id);
      kernel.events.notify(
        'success',
        $t('automation.browsers.cloned_success', { name: cloned.name }),
      );
    } catch (error: any) {
      kernel.events.notify(
        'error',
        error?.message || $t('automation.overview.browser_action_failed'),
      );
    }
  },
  onCopy: () => kernel.events.notify('success', $t('common.copied')),
  onEdit: (profile) => emit('edit', profile),
  onMoveWorkspace: async (profile, workspaceId) => {
    if (!workspaceId || workspaceId === profile.workspaceId) return;
    moving.value = true;
    try {
      await store.moveProfileToWorkspace(profile.id, workspaceId);
      kernel.events.notify('success', $t('automation.browsers.moved_success'));
    } catch (error: any) {
      kernel.events.notify(
        'error',
        error?.message || $t('automation.overview.browser_action_failed'),
      );
    } finally {
      moving.value = false;
    }
  },
  onSaveExtensions: async (profile, extensions) => {
    savingExts.value = true;
    try {
      await store.updateExtensions(profile.id, extensions);
      kernel.events.notify(
        'success',
        $t('automation.browsers.updated_success', { name: profile.name }),
      );
    } catch (error: any) {
      kernel.events.notify(
        'error',
        error?.message || $t('automation.overview.browser_action_failed'),
      );
    } finally {
      savingExts.value = false;
    }
  },
  onSetDefault: async (profile) => {
    await runProfileAction(
      () => store.makeDefaultProfile(profile.id),
      $t('automation.browsers.default_set_success', { name: profile.name }),
    );
  },
  onToggleRun: async (profile) => {
    await (profile.isOnline
      ? runProfileAction(
          async () => {
            await store.stopProfile(profile.id);
          },
          $t('automation.overview.browser_stopped_profile', {
            name: profile.name,
          }),
        )
      : runProfileAction(
          async () => {
            await store.launchProfile(profile.id);
          },
          $t('automation.overview.browser_started_profile', {
            name: profile.name,
          }),
        ));
  },
});
</script>

<template>
  <SchemaSheet
    v-model:open="open"
    mode="view"
    :close-label="$t('common.close')"
    :record="props.profile"
    :schema="schema"
    @copied="kernel.events.notify('success', $t('common.copied'))"
  />
</template>
