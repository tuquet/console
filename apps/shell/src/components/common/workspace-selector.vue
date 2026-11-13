<script lang="ts" setup>
import type { Tenant } from '#/api/core/tenant';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@operon-core/shadcn-ui';

import {
  Building2,
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  Settings,
} from '@lucide/vue';

import { $t } from '#/locales';
import { useWorkspaceStore } from '#/store/workspace';

import WorkspaceCreateDialog from './workspace-create-dialog.vue';

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

function handleSelectWorkspace(workspace: Tenant) {
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
  isCreateModalOpen.value = true;
}
</script>

<template>
  <div class="flex w-full items-center justify-center">
    <Popover v-model:open="isOpen">
      <PopoverTrigger as-child>
        <!-- Collapsed button (icon-only mode when sidebar is collapsed) -->
        <Button
          v-if="props.collapsed"
          type="button"
          variant="ghost"
          size="icon"
          data-testid="workspace-selector-trigger-collapsed"
          class="size-9 rounded-lg p-0 transition-colors hover:bg-accent/60 focus-visible:outline-none"
          :title="activeWorkspace?.name || $t('page.workspace.not_selected')"
        >
          <div
            class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 font-bold text-primary shadow-2xs transition-transform hover:scale-105"
          >
            <Building2
              v-if="!activeWorkspace?.name"
              class="size-4 text-muted-foreground"
            />
            <span v-else>
              {{ activeWorkspace.name.charAt(0).toUpperCase() }}
            </span>
          </div>
        </Button>

        <!-- Expanded button (full workspace card at top of sidebar) -->
        <Button
          v-else
          type="button"
          variant="ghost"
          data-testid="workspace-selector-trigger"
          class="group flex h-auto w-full items-center justify-between gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none"
        >
          <!-- Workspace Avatar / Initial icon -->
          <div class="flex items-center gap-2.5 min-w-0">
            <div
              class="flex size-7.5 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 font-bold text-primary shadow-2xs"
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
              <span class="truncate font-semibold text-foreground">
                {{ activeWorkspace?.name || $t('page.workspace.not_selected') }}
              </span>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="truncate text-muted-foreground">
                  {{ activeWorkspace?.slug || 'workspace' }}
                </span>
                <Badge
                  v-if="activeWorkspace?.metadata?.plan"
                  variant="secondary"
                  class="rounded-xs px-1 py-0 text-muted-foreground capitalize"
                >
                  {{ activeWorkspace.metadata.plan }}
                </Badge>
              </div>
            </div>
          </div>

          <ChevronsUpDown
            class="size-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-foreground"
          />
        </Button>
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
          <Input
            v-model="searchQuery"
            type="text"
            data-testid="workspace-search-input"
            :placeholder="$t('page.workspace.selector_search')"
            class="h-6 w-full border-0 bg-transparent px-2.5 py-1 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground text-foreground"
          />
        </div>

        <!-- Workspaces List -->
        <div class="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-0.5">
          <div
            class="px-2 py-1 font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {{ $t('page.workspace.tenants_label') }}
          </div>

          <Button
            v-for="ws in filteredWorkspaces"
            :key="ws.id"
            type="button"
            variant="ghost"
            class="flex h-auto w-full items-center justify-between rounded-sm px-2 py-1.5 text-left transition-colors"
            :class="
              ws.id === activeWorkspace?.id
                ? 'bg-accent  text-accent-foreground'
                : 'hover:bg-muted/70 text-foreground'
            "
            @click="handleSelectWorkspace(ws)"
          >
            <div class="flex items-center gap-2 min-w-0">
              <div
                class="flex size-6 shrink-0 items-center justify-center rounded-sm border border-border/60 bg-muted/60 font-semibold text-foreground"
              >
                {{ ws.name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex flex-col min-w-0 leading-tight">
                <span class="truncate">{{ ws.name }}</span>
                <span class="truncate text-muted-foreground">
                  {{ ws.slug }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0 ml-2">
              <Badge variant="outline" class="px-1 py-0 capitalize">
                {{ ws.metadata?.plan || 'Pro' }}
              </Badge>
              <Check
                v-if="ws.id === activeWorkspace?.id"
                class="size-3.5 text-primary"
              />
            </div>
          </Button>

          <Empty
            v-if="filteredWorkspaces.length === 0"
            class="border-none py-5"
          >
            <EmptyHeader>
              <EmptyDescription>
                {{ $t('page.workspace.no_workspaces_found') }}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>

        <!-- Quick Actions Footer -->
        <div
          class="border-t border-border p-1 bg-muted/20 flex flex-col gap-0.5"
        >
          <Button
            type="button"
            variant="ghost"
            class="flex h-auto w-full items-center justify-start gap-2 rounded-sm px-2 py-1.5 text-left text-foreground transition-colors hover:bg-muted/70"
            @click="handleManageWorkspaces"
          >
            <Settings class="size-3.5 text-muted-foreground" />
            <span>{{ $t('page.workspace.manage_workspaces') }}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            class="flex h-auto w-full items-center justify-start gap-2 rounded-sm px-2 py-1.5 text-left text-primary transition-colors hover:bg-primary/10 hover:text-primary"
            @click="openCreateModal"
          >
            <Plus class="size-3.5" />
            <span>{{ $t('page.workspace.create_workspace') }}</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>

    <WorkspaceCreateDialog v-model:open="isCreateModalOpen" />
  </div>
</template>
