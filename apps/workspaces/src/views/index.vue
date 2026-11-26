<script lang="ts" setup>
import type { WorkspaceRecord } from '../stores/workspaces';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useKernel } from '@operon/kernel';

import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@operon-core/shadcn-ui';

import {
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
} from '@lucide/vue';

import WorkspaceDeleteDialog from '../components/workspace-delete-dialog.vue';
import WorkspaceFormDialog from '../components/workspace-form-dialog.vue';
import { $t } from '../locales';
import { useWorkspacesStore } from '../stores/workspaces';

defineOptions({ name: 'WorkspacesStarterView' });

const router = useRouter();
const kernel = useKernel();
const workspacesStore = useWorkspacesStore();

const searchQuery = ref('');
const planFilter = ref<string>('all');
const statusFilter = ref<string>('all');

// Dialog targets
const formOpen = ref(false);
const editingTarget = ref<null | WorkspaceRecord>(null);
const deleteOpen = ref(false);
const deletingTarget = ref<null | WorkspaceRecord>(null);

onMounted(() => {
  void workspacesStore.fetchWorkspaces();
});

const filteredWorkspaces = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return workspacesStore.workspaces.filter((t) => {
    if (planFilter.value !== 'all' && t.plan !== planFilter.value) {
      return false;
    }
    if (statusFilter.value !== 'all' && t.status !== statusFilter.value) {
      return false;
    }
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    );
  });
});

function openCreateModal() {
  editingTarget.value = null;
  formOpen.value = true;
}

function openEditModal(t: WorkspaceRecord) {
  editingTarget.value = t;
  formOpen.value = true;
}

function openDeleteModal(t: WorkspaceRecord) {
  deletingTarget.value = t;
  deleteOpen.value = true;
}

async function copyWorkspaceId(id: string) {
  try {
    await navigator.clipboard.writeText(id);
    kernel.events.notify('success', $t('workspaces.copied_workspace_id'));
  } catch {
    kernel.events.notify('error', $t('workspaces.copy_id_failed'));
  }
}

function handleSwitchWorkspace(id: string) {
  workspacesStore.setActiveWorkspace(id);
}

function navigateToDetail(id: string) {
  void router.push({ name: 'WorkspaceDetail', params: { id } });
}
</script>

<template>
  <div class="flex flex-col gap-5 p-4 sm:p-6">
    <!-- Top Header -->
    <div
      class="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-xs sm:flex-row sm:items-center"
    >
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <Building2 class="size-5 text-primary" />
          <h1 class="text-lg font-semibold tracking-tight text-foreground">
            {{ $t('page.workspaces.title') }}
          </h1>
          <Badge variant="outline" class="text-[11px]">
            {{ workspacesStore.workspaces.length }}
          </Badge>
        </div>
        <p class="text-xs text-muted-foreground sm:text-sm">
          {{ $t('workspaces.default_plan_desc') }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="gap-1.5 shadow-none"
          :disabled="workspacesStore.isLoading"
          @click="workspacesStore.fetchWorkspaces(true)"
        >
          <RefreshCw
            class="size-3.5"
            :class="{ 'animate-spin': workspacesStore.isLoading }"
          />
          <span>{{ $t('common.refresh') }}</span>
        </Button>
        <Button size="sm" class="gap-1.5" @click="openCreateModal">
          <Plus class="size-3.5" />
          <span>{{ $t('common.create') }}</span>
        </Button>
      </div>
    </div>

    <!-- Active Workspace Summary -->
    <Card
      v-if="workspacesStore.activeWorkspace"
      class="border-border/80 bg-card/60 p-4 shadow-none"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <Shield class="size-4" />
          </div>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm font-semibold text-foreground">
                {{ workspacesStore.activeWorkspace.name }}
              </span>
              <Badge variant="secondary" class="text-[11px] capitalize">
                {{ workspacesStore.activeWorkspace.plan }}
              </Badge>
              <Badge
                variant="outline"
                class="border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-500"
              >
                {{ $t('common.active') }}
              </Badge>
            </div>
            <div
              class="mt-0.5 flex items-center gap-2 font-mono text-xs text-muted-foreground"
            >
              <span>{{ workspacesStore.activeWorkspace.slug }}</span>
              <span>•</span>
              <span>{{ workspacesStore.activeWorkspace.id }}</span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          class="gap-1.5 text-xs shadow-none"
          @click="copyWorkspaceId(workspacesStore.activeWorkspace.id)"
        >
          <Copy class="size-3.5" />
          <span>{{ $t('workspaces.copy_workspace_id') }}</span>
        </Button>
      </div>
    </Card>

    <!-- Search & Filter Bar -->
    <div class="flex flex-wrap items-center gap-2.5">
      <div class="relative min-w-[220px] flex-1">
        <Search
          class="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground"
        />
        <Input
          v-model="searchQuery"
          :placeholder="$t('workspaces.search_placeholder')"
          class="h-9 pl-8"
        />
      </div>

      <Select v-model="planFilter">
        <SelectTrigger class="h-9 w-[150px]">
          <SelectValue :placeholder="$t('workspaces.filter_plan')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ $t('workspaces.plan_all') }}</SelectItem>
          <SelectItem value="local">Local</SelectItem>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="pro">Pro</SelectItem>
          <SelectItem value="enterprise">Enterprise</SelectItem>
        </SelectContent>
      </Select>

      <Select v-model="statusFilter">
        <SelectTrigger class="h-9 w-[150px]">
          <SelectValue :placeholder="$t('common.status')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ $t('workspaces.status_all') }}</SelectItem>
          <SelectItem value="active">{{ $t('common.active') }}</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
          <SelectItem value="suspended">
            {{ $t('common.suspended') }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="
        workspacesStore.isLoading && workspacesStore.workspaces.length === 0
      "
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <Card v-for="idx in 3" :key="idx" class="border-border p-5">
        <Skeleton class="h-5 w-36" />
        <Skeleton class="mt-2 h-3.5 w-24" />
        <Skeleton class="mt-6 h-8 w-full" />
      </Card>
    </div>

    <!-- Empty State -->
    <Card
      v-else-if="filteredWorkspaces.length === 0"
      class="flex flex-col items-center justify-center gap-3 border-border p-10 text-center shadow-none"
    >
      <Building2 class="size-8 text-muted-foreground/60" />
      <p class="text-sm font-medium text-foreground">
        {{ $t('common.noMatchingRecords') }}
      </p>
      <Button size="sm" variant="outline" @click="openCreateModal">
        <Plus class="mr-1.5 size-3.5" />
        {{ $t('workspaces.create_submit_btn') }}
      </Button>
    </Card>

    <!-- Workspaces Grid -->
    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="t in filteredWorkspaces"
        :key="t.id"
        class="flex flex-col justify-between border-border bg-card p-5 shadow-none transition-colors hover:border-primary/40"
        :class="{
          'border-primary/60 ring-1 ring-primary/15':
            t.id === workspacesStore.activeWorkspaceId,
        }"
      >
        <div class="flex flex-col gap-2.5">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h3 class="truncate text-sm font-semibold text-foreground">
                {{ t.name }}
              </h3>
              <p class="truncate font-mono text-xs text-muted-foreground">
                {{ t.slug }}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-1.5">
              <Badge variant="secondary" class="text-[11px] capitalize">
                {{ t.plan }}
              </Badge>
              <Badge
                v-if="t.status !== 'active'"
                variant="outline"
                class="text-[10px] capitalize text-muted-foreground"
              >
                {{ t.status }}
              </Badge>
            </div>
          </div>

          <p class="truncate font-mono text-[11px] text-muted-foreground/80">
            {{ t.id }}
          </p>
        </div>

        <div
          class="mt-5 flex items-center justify-between gap-2 border-t border-border/50 pt-3.5"
        >
          <Button
            v-if="t.id !== workspacesStore.activeWorkspaceId"
            variant="outline"
            size="sm"
            class="h-8 text-xs shadow-none"
            :disabled="t.status !== 'active'"
            @click="handleSwitchWorkspace(t.id)"
          >
            {{ $t('common.active') }}
          </Button>
          <div
            v-else
            class="flex items-center gap-1.5 text-xs font-medium text-emerald-500"
          >
            <CheckCircle2 class="size-4" />
            <span>{{ $t('common.active') }}</span>
          </div>

          <div class="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              class="size-8"
              :title="$t('common.edit')"
              @click="openEditModal(t)"
            >
              <Pencil class="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="size-8 text-destructive hover:text-destructive"
              :disabled="t.id === 'local-default'"
              :title="$t('common.delete')"
              @click="openDeleteModal(t)"
            >
              <Trash2 class="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              @click="navigateToDetail(t.id)"
            >
              <span>{{ $t('common.detail') }}</span>
              <ExternalLink class="size-3" />
            </Button>
          </div>
        </div>
      </Card>
    </div>

    <WorkspaceFormDialog v-model:open="formOpen" :target="editingTarget" />

    <WorkspaceDeleteDialog v-model:open="deleteOpen" :target="deletingTarget" />
  </div>
</template>
