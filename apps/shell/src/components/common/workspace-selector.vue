<script lang="ts" setup>
import type { Tenant } from '#/api/core/tenant';

import { computed, onMounted, ref, watch } from 'vue';

import { useAccessStore } from '@operon/stores';

import {
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
} from '@operon-core/shadcn-ui';

import { Check, ChevronsUpDown, PlusCircle } from '@lucide/vue';

import { $t } from '#/locales';
import { useWorkspaceStore } from '#/store/workspace';

import WorkspaceCreateDialog from './workspace-create-dialog.vue';

defineOptions({ name: 'WorkspaceSelector' });

const props = withDefaults(defineProps<{ collapsed?: boolean }>(), {
  collapsed: false,
});

const accessStore = useAccessStore();
const workspaceStore = useWorkspaceStore();

const isAuthenticated = computed(() => Boolean(accessStore.accessToken));
const open = ref(false);
const isCreateModalOpen = ref(false);

const activeWorkspace = computed(() => workspaceStore.activeWorkspace);
const workspaces = computed(() => workspaceStore.workspaces);

onMounted(() => {
  void workspaceStore.fetchWorkspaces();
});

watch(isAuthenticated, () => {
  void workspaceStore.fetchWorkspaces(true);
});

function handleSelectWorkspace(workspace: Tenant) {
  workspaceStore.setWorkspace(workspace.id);
  open.value = false;
}

function openCreateModal() {
  open.value = false;
  isCreateModalOpen.value = true;
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
        class="size-8 shrink-0 rounded-md"
        :title="activeWorkspace?.name || $t('page.workspace.not_selected')"
      >
        <span class="size-4 rounded-full bg-primary/80"></span>
      </Button>

      <Button
        v-else
        type="button"
        variant="outline"
        size="sm"
        role="combobox"
        :aria-expanded="open"
        :aria-label="$t('preferences.widget.workspaceSelector')"
        data-testid="workspace-selector-trigger"
        class="h-8 min-w-0 flex-1 justify-between gap-2 px-2.5 font-normal"
      >
        <span class="flex min-w-0 items-center gap-2">
          <span class="size-4 shrink-0 rounded-full bg-primary/80"></span>
          <span class="truncate text-xs font-medium text-foreground">
            {{ activeWorkspace?.name || $t('page.workspace.not_selected') }}
          </span>
        </span>
        <ChevronsUpDown class="size-3.5 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>

    <PopoverContent
      class="z-popup w-[220px] p-0"
      align="start"
      :side="props.collapsed ? 'right' : 'bottom'"
      :side-offset="6"
    >
      <Command>
        <CommandInput :placeholder="$t('page.workspace.selector_search')" />
        <CommandList>
          <CommandEmpty>
            {{ $t('page.workspace.no_workspaces_found') }}
          </CommandEmpty>
          <CommandGroup
            :heading="
              isAuthenticated
                ? $t('page.workspace.tenants_label')
                : $t('page.workspace.local_workspace')
            "
          >
            <CommandItem
              v-for="ws in workspaces"
              :key="ws.id"
              :value="`${ws.name} ${ws.slug}`"
              @select="handleSelectWorkspace(ws)"
            >
              <span
                class="size-4 shrink-0 rounded-full bg-muted-foreground/40"
              ></span>
              <span class="truncate">{{ ws.name }}</span>
              <Check
                v-if="ws.id === activeWorkspace?.id"
                class="ml-auto size-4 shrink-0"
              />
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <CommandSeparator />
        <CommandList>
          <CommandGroup>
            <CommandItem value="create-workspace" @select="openCreateModal">
              <PlusCircle class="size-4 shrink-0" />
              <span>{{ $t('page.workspace.create_workspace') }}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>

  <WorkspaceCreateDialog v-model:open="isCreateModalOpen" />
</template>
