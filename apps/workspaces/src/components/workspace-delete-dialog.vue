<script lang="ts" setup>
import type { WorkspaceRecord } from '../stores/workspaces';

import { ref, watch } from 'vue';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Input,
  Label,
} from '@operon-core/shadcn-ui';

import { $t } from '../locales';
import { useWorkspacesStore } from '../stores/workspaces';

defineOptions({ name: 'WorkspaceDeleteDialog' });

const props = defineProps<{
  target: null | WorkspaceRecord;
}>();

const open = defineModel<boolean>('open', { default: false });

const workspacesStore = useWorkspacesStore();

const confirmSlugInput = ref('');
const deleteError = ref('');
const isDeleting = ref(false);

watch(
  [open, () => props.target],
  ([isOpen]) => {
    if (!isOpen) return;
    confirmSlugInput.value = '';
    deleteError.value = '';
  },
  { immediate: true },
);

async function handleConfirmDelete() {
  if (!props.target) return;
  if (confirmSlugInput.value.trim() !== props.target.slug) {
    deleteError.value = $t('workspaces.confirm_slug_mismatch');
    return;
  }

  try {
    isDeleting.value = true;
    deleteError.value = '';
    await workspacesStore.deleteWorkspace(props.target.id);
    open.value = false;
  } catch (error: any) {
    deleteError.value =
      error?.message || $t('workspaces.workspace_delete_failed');
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ $t('workspaces.delete_modal_title') }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{ $t('workspaces.delete_modal_warning') }}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div class="flex flex-col gap-2 py-2">
        <Label class="text-xs">
          {{ $t('workspaces.delete_confirm_prompt') }}
          <code class="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono">
            {{ target?.slug }}
          </code>
        </Label>
        <Input
          v-model="confirmSlugInput"
          :placeholder="target?.slug"
          class="font-mono text-xs"
        />
        <p
          v-if="deleteError"
          role="alert"
          class="text-xs font-medium text-destructive"
        >
          {{ deleteError }}
        </p>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel @click="open = false">
          {{ $t('common.cancel') }}
        </AlertDialogCancel>
        <AlertDialogAction
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          :disabled="isDeleting"
          @click.prevent="handleConfirmDelete"
        >
          {{ $t('workspaces.confirm_delete_btn') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
