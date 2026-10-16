<script lang="ts" setup>
import type { TenantItem } from '#/api/core/tenant';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Popover, PopoverContent, PopoverTrigger } from '@vben-core/shadcn-ui';

import {
  Building2,
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  Settings,
} from '@lucide/vue';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@tuquet/vue-ui';

import { TENANT_PLAN } from '#/api/core/tenant';
import { $t } from '#/locales';
import { useWorkspaceStore } from '#/store/workspace';

defineOptions({ name: 'WorkspaceSelector' });

const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
});

interface Props {
  collapsed?: boolean;
}

const router = useRouter();
const workspaceStore = useWorkspaceStore();

const isOpen = ref(false);
const searchQuery = ref('');
const isCreateModalOpen = ref(false);
const newWorkspaceName = ref('');
const newWorkspaceSlug = ref('');
const newWorkspacePlan = ref<string>(TENANT_PLAN.PRO);
const isSubmitting = ref(false);

onMounted(() => {
  workspaceStore.fetchWorkspaces();
});

const activeWorkspace = computed(() => workspaceStore.activeWorkspace);

const filteredWorkspaces = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return workspaceStore.workspaces;
  return workspaceStore.workspaces.filter((w) => {
    return (
      w.name.toLowerCase().includes(query) ||
      w.slug.toLowerCase().includes(query)
    );
  });
});

function handleSelectWorkspace(workspace: TenantItem) {
  workspaceStore.setWorkspace(workspace.id);
  isOpen.value = false;
  searchQuery.value = '';
}

function handleManageWorkspaces() {
  isOpen.value = false;
  router.push('/tenants');
}

function openCreateModal() {
  isOpen.value = false;
  newWorkspaceName.value = '';
  newWorkspaceSlug.value = '';
  newWorkspacePlan.value = TENANT_PLAN.PRO;
  isCreateModalOpen.value = true;
}

function handleNameInput(e: Event) {
  const target = e.target as HTMLInputElement;
  newWorkspaceName.value = target.value;
  // Automatically generate slug from name
  newWorkspaceSlug.value = target.value
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/[\s_-]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
}

async function handleCreateWorkspace() {
  if (!newWorkspaceName.value.trim()) return;
  try {
    isSubmitting.value = true;
    await workspaceStore.createWorkspace({
      name: newWorkspaceName.value.trim(),
      slug:
        newWorkspaceSlug.value.trim() ||
        newWorkspaceName.value.toLowerCase().trim().replaceAll(/\s+/g, '-'),
      plan: newWorkspacePlan.value,
    });
    isCreateModalOpen.value = false;
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="flex size-full items-center">
    <Popover v-model:open="isOpen">
      <PopoverTrigger as-child>
        <!-- Collapsed button (icon-only mode when sidebar is collapsed) -->
        <button
          v-if="props.collapsed"
          type="button"
          data-testid="workspace-selector-trigger-collapsed"
          class="flex size-full items-center justify-center p-2 transition-colors hover:bg-accent/50 focus-visible:outline-none"
          :title="activeWorkspace?.name || $t('page.workspace.not_selected')"
        >
          <div
            class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-xs font-bold text-primary shadow-2xs transition-transform hover:scale-105"
          >
            <Building2
              v-if="!activeWorkspace?.name"
              class="size-4 text-muted-foreground"
            />
            <span v-else>
              {{ activeWorkspace.name.charAt(0).toUpperCase() }}
            </span>
          </div>
        </button>

        <!-- Expanded button (full workspace card replacing logo at top of sidebar/header) -->
        <button
          v-else
          type="button"
          data-testid="workspace-selector-trigger"
          class="group flex size-full items-center justify-between gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none"
        >
          <!-- Workspace Avatar / Initial icon -->
          <div class="flex items-center gap-2.5 min-w-0">
            <div
              class="flex size-7.5 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-xs font-bold text-primary shadow-2xs"
            >
              <Building2
                v-if="!activeWorkspace?.name"
                class="size-3.5 text-muted-foreground"
              />
              <span v-else>
                {{ activeWorkspace.name.charAt(0).toUpperCase() }}
              </span>
            </div>

            <!-- Workspace Name and Plan label -->
            <div class="flex flex-col min-w-0 leading-tight">
              <span class="truncate font-semibold text-xs text-foreground">
                {{ activeWorkspace?.name || $t('page.workspace.not_selected') }}
              </span>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="truncate text-2xs text-muted-foreground">
                  {{ activeWorkspace?.slug || 'workspace' }}
                </span>
                <span
                  v-if="activeWorkspace?.metadata?.plan"
                  class="rounded-xs bg-muted px-1 py-0 text-[10px] font-medium text-muted-foreground capitalize"
                >
                  {{ activeWorkspace.metadata.plan }}
                </span>
              </div>
            </div>
          </div>

          <ChevronsUpDown
            class="size-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        class="w-72 p-0 shadow-lg border border-border bg-popover z-popup"
        align="start"
        :side="props.collapsed ? 'right' : 'bottom'"
        :side-offset="6"
      >
        <!-- Search Bar -->
        <div class="flex items-center border-b border-border px-3 py-2">
          <Search class="mr-2 size-3.5 shrink-0 text-muted-foreground" />
          <input
            v-model="searchQuery"
            type="text"
            data-testid="workspace-search-input"
            :placeholder="$t('page.workspace.selector_search')"
            class="flex h-6 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground text-foreground"
          />
        </div>

        <!-- Workspaces List -->
        <div class="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
          <div
            class="px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {{ $t('page.workspace.tenants_label') }}
          </div>

          <button
            v-for="ws in filteredWorkspaces"
            :key="ws.id"
            type="button"
            class="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-xs transition-colors text-left"
            :class="
              ws.id === activeWorkspace?.id
                ? 'bg-accent font-medium text-accent-foreground'
                : 'hover:bg-muted/70 text-foreground'
            "
            @click="handleSelectWorkspace(ws)"
          >
            <div class="flex items-center gap-2 min-w-0">
              <div
                class="flex size-6 shrink-0 items-center justify-center rounded-sm border border-border/60 bg-muted/60 text-2xs font-semibold text-foreground"
              >
                {{ ws.name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex flex-col min-w-0 leading-tight">
                <span class="truncate font-medium">{{ ws.name }}</span>
                <span class="truncate text-2xs text-muted-foreground">
                  {{ ws.slug }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0 ml-2">
              <Badge
                variant="outline"
                class="text-2xs px-1 py-0 font-normal capitalize"
              >
                {{ ws.metadata?.plan || 'Pro' }}
              </Badge>
              <Check
                v-if="ws.id === activeWorkspace?.id"
                class="size-3.5 text-primary"
              />
            </div>
          </button>

          <div
            v-if="filteredWorkspaces.length === 0"
            class="py-5 text-center text-xs text-muted-foreground"
          >
            {{ $t('page.workspace.no_workspaces_found') }}
          </div>
        </div>

        <!-- Quick Actions Footer -->
        <div class="border-t border-border p-1 bg-muted/20 space-y-0.5">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-muted/70 transition-colors text-foreground text-left"
            @click="handleManageWorkspaces"
          >
            <Settings class="size-3.5 text-muted-foreground" />
            <span>{{ $t('page.workspace.manage_workspaces') }}</span>
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-primary hover:bg-primary/10 transition-colors text-left font-medium"
            @click="openCreateModal"
          >
            <Plus class="size-3.5" />
            <span>{{ $t('page.workspace.create_workspace') }}</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>

    <!-- Quick Create Workspace Dialog -->
    <Dialog v-model:open="isCreateModalOpen">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ $t('page.workspace.create_workspace') }}</DialogTitle>
        </DialogHeader>

        <div class="grid gap-3.5 py-3">
          <div class="grid gap-1.5">
            <label class="text-xs font-medium text-foreground">
              {{ $t('page.workspace.col_name') }}
            </label>
            <Input
              :value="newWorkspaceName"
              placeholder="e.g. Acme Corp"
              class="h-9 text-xs"
              @input="handleNameInput"
            />
          </div>

          <div class="grid gap-1.5">
            <label class="text-xs font-medium text-foreground">
              {{ $t('page.workspace.col_slug') }}
            </label>
            <Input
              v-model="newWorkspaceSlug"
              placeholder="e.g. acme-corp"
              class="h-9 text-xs font-mono"
            />
          </div>

          <div class="grid gap-1.5">
            <label class="text-xs font-medium text-foreground">
              {{ $t('page.workspace.col_plan') }}
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="plan in [
                  TENANT_PLAN.FREE,
                  TENANT_PLAN.PRO,
                  TENANT_PLAN.ENTERPRISE,
                ]"
                :key="plan"
                type="button"
                class="rounded-md border p-2 text-xs font-medium text-center transition-colors capitalize"
                :class="
                  newWorkspacePlan === plan
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input hover:bg-muted text-foreground'
                "
                @click="newWorkspacePlan = plan"
              >
                {{ plan }}
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            @click="isCreateModalOpen = false"
          >
            {{ $t('common.cancel') }}
          </Button>
          <Button
            size="sm"
            :disabled="!newWorkspaceName.trim() || isSubmitting"
            @click="handleCreateWorkspace"
          >
            {{
              isSubmitting
                ? $t('common.loading')
                : $t('page.workspace.create_btn')
            }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
