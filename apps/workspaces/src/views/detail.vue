<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useKernel } from '@operon/kernel';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@operon-core/shadcn-ui';

import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Copy,
  Pencil,
  Trash2,
} from '@lucide/vue';

import { $t } from '../locales';
import { useWorkspacesStore } from '../stores/workspaces';

defineOptions({ name: 'WorkspaceDetailStarterView' });

const route = useRoute();
const router = useRouter();
const kernel = useKernel();
const workspacesStore = useWorkspacesStore();

const workspaceId = computed(() => route.params.id as string);
const workspace = computed(
  () =>
    workspacesStore.workspaces.find((t) => t.id === workspaceId.value) || null,
);
const isCurrentActive = computed(
  () => workspace.value?.id === workspacesStore.activeWorkspaceId,
);

const editOpen = ref(false);
const editName = ref('');
const editSlug = ref('');
const editError = ref('');
const isSaving = ref(false);

const deleteOpen = ref(false);
const confirmSlug = ref('');
const deleteError = ref('');
const isDeleting = ref(false);

onMounted(() => {
  if (workspacesStore.workspaces.length === 0) {
    void workspacesStore.fetchWorkspaces();
  }
});

function goBack() {
  void router.push({ name: 'Workspaces' });
}

function openEdit() {
  if (!workspace.value) return;
  editName.value = workspace.value.name;
  editSlug.value = workspace.value.slug;
  editError.value = '';
  editOpen.value = true;
}

async function handleSave() {
  if (!workspace.value) return;
  try {
    isSaving.value = true;
    editError.value = '';
    await workspacesStore.updateWorkspace(workspace.value.id, {
      name: editName.value.trim(),
      slug: editSlug.value.trim(),
    });
    kernel.events.notify('success', $t('workspaces.workspace_updated_success'));
    editOpen.value = false;
  } catch (error: any) {
    editError.value =
      error?.message || $t('workspaces.workspace_update_failed');
  } finally {
    isSaving.value = false;
  }
}

function openDelete() {
  confirmSlug.value = '';
  deleteError.value = '';
  deleteOpen.value = true;
}

async function handleDelete() {
  if (!workspace.value) return;
  if (confirmSlug.value.trim() !== workspace.value.slug) {
    deleteError.value = $t('workspaces.confirm_slug_mismatch');
    return;
  }
  try {
    isDeleting.value = true;
    deleteError.value = '';
    await workspacesStore.deleteWorkspace(workspace.value.id);
    deleteOpen.value = false;
    goBack();
  } catch (error: any) {
    deleteError.value =
      error?.message || $t('workspaces.workspace_delete_failed');
  } finally {
    isDeleting.value = false;
  }
}

async function copyWorkspaceId() {
  if (!workspace.value) return;
  try {
    await navigator.clipboard.writeText(workspace.value.id);
    kernel.events.notify('success', $t('workspaces.copied_workspace_id'));
  } catch {
    kernel.events.notify('error', $t('workspaces.copy_id_failed'));
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <Button variant="outline" size="sm" class="gap-1.5" @click="goBack">
          <ArrowLeft class="size-4" />
          <span>{{ $t('common.back') }}</span>
        </Button>
        <div>
          <h1 class="text-xl font-bold tracking-tight text-foreground">
            {{ workspace?.name || $t('common.unknownWorkspace') }}
          </h1>
          <p class="text-xs text-muted-foreground">
            ID: {{ workspaceId }}
            <template v-if="workspace?.slug">
              | Slug: {{ workspace.slug }}
            </template>
          </p>
        </div>
      </div>

      <div v-if="workspace" class="flex items-center gap-2">
        <Button
          v-if="!isCurrentActive"
          size="sm"
          :disabled="workspace.status !== 'active'"
          @click="workspacesStore.setActiveWorkspace(workspace.id)"
        >
          {{ $t('common.active') }}
        </Button>
        <Badge
          v-else
          variant="outline"
          class="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
        >
          <CheckCircle2 class="mr-1 size-3.5" />
          {{ $t('common.active') }}
        </Badge>
        <Button variant="outline" size="sm" class="gap-1.5" @click="openEdit">
          <Pencil class="size-3.5" />
          <span>{{ $t('workspaces.edit_name_slug') }}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="gap-1.5 text-destructive hover:text-destructive"
          :disabled="workspace.id === 'local-default'"
          @click="openDelete"
        >
          <Trash2 class="size-3.5" />
          <span>{{ $t('common.delete') }}</span>
        </Button>
      </div>
    </div>

    <Card v-if="!workspace" class="border-border p-8 text-center">
      <p class="text-sm text-muted-foreground">
        {{ $t('common.workspaceNotFoundOrDenied') }}
      </p>
    </Card>

    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card class="flex flex-col gap-3 border-border bg-card p-5 shadow-none">
        <div class="flex items-center gap-2 text-sm text-primary">
          <Building2 class="size-4" />
          <span>{{ $t('workspaces.workspace_details') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Badge variant="default" class="text-xs capitalize">
            {{ workspace.plan }}
          </Badge>
          <Badge variant="outline" class="text-xs capitalize">
            {{ workspace.status }}
          </Badge>
        </div>
      </Card>

      <Card class="flex flex-col gap-3 border-border bg-card p-5 shadow-none">
        <div class="text-sm text-primary">
          {{ $t('workspaces.workspace_id') }}
        </div>
        <code class="truncate rounded bg-muted px-2 py-1">
          {{ workspace.id }}
        </code>
        <Button
          variant="outline"
          size="sm"
          class="gap-1.5"
          @click="copyWorkspaceId"
        >
          <Copy class="size-3.5" />
          <span>{{ $t('workspaces.copy_workspace_id') }}</span>
        </Button>
      </Card>

      <Card class="flex flex-col gap-3 border-border bg-card p-5 shadow-none">
        <div class="text-sm text-primary">
          {{ $t('workspaces.pair_cli') }}
        </div>
        <code class="truncate rounded bg-muted px-2 py-1">
          opn workspace switch {{ workspace.slug }}
        </code>
      </Card>
    </div>

    <Dialog v-model:open="editOpen">
      <DialogContent class="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{{ $t('workspaces.edit_modal_title') }}</DialogTitle>
        </DialogHeader>
        <div class="flex flex-col gap-3 py-2">
          <div class="flex flex-col gap-1.5">
            <Label>{{ $t('common.name') }}</Label>
            <Input v-model="editName" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>Slug</Label>
            <Input v-model="editSlug" class="text-xs" />
          </div>
          <p v-if="editError" class="text-xs font-medium text-destructive">
            {{ editError }}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" @click="editOpen = false">
            {{ $t('common.cancel') }}
          </Button>
          <Button size="sm" :disabled="isSaving" @click="handleSave">
            {{ $t('common.save') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="deleteOpen">
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
            <code class="ml-1 rounded bg-muted px-1.5 py-0.5">
              {{ workspace?.slug }}
            </code>
          </Label>
          <Input v-model="confirmSlug" class="text-xs" />
          <p v-if="deleteError" class="text-xs font-medium text-destructive">
            {{ deleteError }}
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel @click="deleteOpen = false">
            {{ $t('common.cancel') }}
          </AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="isDeleting"
            @click.prevent="handleDelete"
          >
            {{ $t('workspaces.confirm_delete_btn') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
