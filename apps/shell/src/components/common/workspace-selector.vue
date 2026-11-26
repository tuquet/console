<script lang="ts" setup>
import type { Workspace } from '#/api/core/workspace';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { WORKSPACE_STATUS } from '@operon/constants';
import { preferences, usePreferences } from '@operon/preferences';
import { useAccessStore } from '@operon/stores';

import {
  Badge,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
} from '@operon-core/shadcn-ui';

import { Building2, Check, ChevronsUpDown, PlusCircle } from '@lucide/vue';

import { $t } from '#/locales';
import { useWorkspaceStore } from '#/store/workspace';

import WorkspaceCreateDialog from './workspace-create-dialog.vue';

defineOptions({ name: 'WorkspaceSelector' });

const props = withDefaults(defineProps<{ collapsed?: boolean }>(), {
  collapsed: false,
});

const router = useRouter();
const accessStore = useAccessStore();
const workspaceStore = useWorkspaceStore();
const { isMobile } = usePreferences();

const isAuthenticated = computed(() => Boolean(accessStore.accessToken));
const open = ref(false);
const isCreateModalOpen = ref(false);

const activeWorkspace = computed(() => workspaceStore.activeWorkspace);
const workspaces = computed(() => workspaceStore.workspaces);
const isLoading = computed(
  () => workspaceStore.isLoading && workspaces.value.length === 0,
);

const triggerStyle = computed(() => {
  if (
    props.collapsed ||
    isMobile.value ||
    preferences.widget.workspaceSelectorButtonPosition !== 'header-left'
  ) {
    return undefined;
  }
  return { minWidth: `${Math.max(160, preferences.sidebar.width - 24)}px` };
});

onMounted(() => {
  void workspaceStore.fetchWorkspaces();
});

watch(isAuthenticated, () => {
  void workspaceStore.fetchWorkspaces(true);
});

function getWorkspacePlanLabel(t: Workspace): string {
  if (t.id.startsWith('local-')) {
    return 'local';
  }
  return String(t.metadata?.plan || 'free');
}

function handleSelectWorkspace(workspace: Workspace) {
  if (workspace.status !== WORKSPACE_STATUS.ACTIVE) {
    return;
  }
  workspaceStore.setWorkspace(workspace.id);
  open.value = false;
}

function openCreateModal() {
  open.value = false;
  isCreateModalOpen.value = true;
}

function openManageWorkspaces() {
  open.value = false;
  void router.push('/workspaces');
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        v-if="props.collapsed"
        type="button"
        variant="outline"
        size="icon"
        role="combobox"
        :aria-expanded="open"
        :aria-label="activeWorkspace?.name || $t('page.workspace.not_selected')"
        data-testid="workspace-selector-trigger-collapsed"
        class="size-9 shrink-0 rounded-md shadow-none"
        :title="
          activeWorkspace
            ? `${activeWorkspace.name} (${activeWorkspace.slug})`
            : $t('page.workspace.not_selected')
        "
      >
        <img
          v-if="activeWorkspace?.avatar_url"
          :src="activeWorkspace.avatar_url"
          :alt="activeWorkspace.name"
          class="size-6 rounded-md object-cover"
        />
        <span
          v-else
          class="flex size-6 items-center justify-center rounded-md bg-primary/15 text-sm text-primary"
        >
          {{ activeWorkspace?.name?.charAt(0)?.toUpperCase() || '?' }}
        </span>
      </Button>

      <Button
        v-else
        type="button"
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        :aria-label="$t('preferences.widget.workspaceSelector')"
        data-testid="workspace-selector-trigger"
        class="h-9 min-w-0 max-w-[148px] flex-1 justify-between gap-1.5 px-2 font-normal shadow-none sm:max-w-[240px] sm:gap-2"
        :style="triggerStyle"
      >
        <span class="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <img
            v-if="activeWorkspace?.avatar_url"
            :src="activeWorkspace.avatar_url"
            :alt="activeWorkspace.name"
            class="size-6 shrink-0 rounded-md object-cover"
          />
          <span
            v-else
            class="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-sm text-primary"
          >
            {{ activeWorkspace?.name?.charAt(0)?.toUpperCase() || '?' }}
          </span>
          <span v-if="isLoading" class="flex min-w-0 flex-col gap-1 text-left">
            <Skeleton class="h-3 w-20 sm:w-24" />
            <Skeleton class="hidden h-2.5 w-14 sm:block" />
          </span>
          <span v-else class="flex min-w-0 flex-col text-left leading-tight">
            <span class="truncate text-foreground">
              {{ activeWorkspace?.name || $t('page.workspace.not_selected') }}
            </span>
            <span
              class="hidden truncate text-[10px] text-muted-foreground sm:block"
            >
              {{ activeWorkspace?.slug || 'local' }}
            </span>
          </span>
        </span>
        <ChevronsUpDown class="size-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>

    <PopoverContent
      class="z-popup min-w-[240px] p-0 shadow-none"
      align="start"
      :side="props.collapsed ? 'right' : 'bottom'"
      :side-offset="6"
    >
      <Command>
        <CommandInput :placeholder="$t('page.workspace.selector_search')" />
        <CommandList>
          <div v-if="isLoading" class="flex flex-col gap-2 p-2">
            <div v-for="idx in 3" :key="idx" class="flex items-center gap-2">
              <Skeleton class="size-5 rounded-full" />
              <Skeleton class="h-3.5 flex-1" />
            </div>
          </div>
          <template v-else>
            <CommandEmpty>
              {{ $t('page.workspace.no_workspaces_found') }}
            </CommandEmpty>
            <CommandGroup
              :heading="
                isAuthenticated
                  ? $t('page.workspace.workspaces_label')
                  : $t('page.workspace.local_workspaces_label')
              "
            >
              <CommandItem
                v-for="t in workspaces"
                :key="t.id"
                :value="`${t.name} ${t.slug} ${getWorkspacePlanLabel(t)}`"
                :disabled="t.status !== WORKSPACE_STATUS.ACTIVE"
                @select="handleSelectWorkspace(t)"
              >
                <span
                  class="size-2 shrink-0 rounded-full"
                  :class="
                    t.id === activeWorkspace?.id
                      ? 'bg-emerald-500'
                      : 'bg-muted-foreground/40'
                  "
                ></span>
                <span class="min-w-0 flex-1 truncate">{{ t.name }}</span>
                <Badge
                  variant="outline"
                  class="ml-1 shrink-0 px-1.5 py-0 text-[10px] capitalize text-muted-foreground"
                >
                  {{ getWorkspacePlanLabel(t) }}
                </Badge>
                <Check
                  v-if="t.id === activeWorkspace?.id"
                  class="ml-1 size-4 shrink-0 text-primary"
                />
              </CommandItem>
            </CommandGroup>
          </template>
        </CommandList>
        <CommandSeparator />
        <CommandList>
          <CommandGroup>
            <CommandItem
              data-testid="workspace-selector-create"
              value="create-workspace"
              @select="openCreateModal"
            >
              <PlusCircle class="size-4 shrink-0" />
              <span>{{ $t('page.workspace.create_workspace') }}</span>
            </CommandItem>
            <CommandItem
              data-testid="workspace-selector-manage"
              value="manage-workspaces"
              @select="openManageWorkspaces"
            >
              <Building2 class="size-4 shrink-0" />
              <span>{{ $t('page.workspace.manage_workspaces') }}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>

  <WorkspaceCreateDialog v-model:open="isCreateModalOpen" />
</template>
