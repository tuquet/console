<script setup lang="ts">
import type { Task } from '../data/schema';

import { onBeforeUnmount, onMounted } from 'vue';

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Kbd,
  Separator,
} from '@operon-core/shadcn-ui';

import {
  CheckCircle2,
  Download,
  FileJson,
  Flame,
  Trash2,
  UserCheck,
  X,
} from '@lucide/vue';

import { assignees, priorities, statuses } from '../data/data';

interface DataTableBulkBarProps {
  selectedTasks: Task[];
}

const props = defineProps<DataTableBulkBarProps>();

const emit = defineEmits<{
  bulkDelete: [];
  bulkUpdate: [
    patch: Partial<Pick<Task, 'assignee' | 'label' | 'priority' | 'status'>>,
  ];
  clear: [];
  exportCsv: [];
  exportJson: [];
}>();

function handleEsc(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.selectedTasks.length > 0) {
    // Only clear if no modal/sheet/dropdown currently captures Escape
    if (document.querySelector('[data-state="open"][role="dialog"]')) return;
    emit('clear');
  }
}

onMounted(() => window.addEventListener('keydown', handleEsc));
onBeforeUnmount(() => window.removeEventListener('keydown', handleEsc));
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-4 opacity-0 scale-95"
    enter-to-class="translate-y-0 opacity-100 scale-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100 scale-100"
    leave-to-class="translate-y-4 opacity-0 scale-95"
  >
    <div
      v-if="selectedTasks.length > 0"
      class="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-wrap items-center gap-1.5 rounded-xl border border-border bg-popover/95 px-3 py-2 text-popover-foreground shadow-xl backdrop-blur-md"
    >
      <div class="flex items-center gap-2 pr-1">
        <Badge variant="default" class="font-mono text-xs">
          {{ selectedTasks.length }}
        </Badge>
        <span class="text-xs font-medium whitespace-nowrap">selected</span>
      </div>

      <Separator orientation="vertical" class="mx-1 h-5" />

      <!-- Batch Status -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="sm" class="h-8 text-xs">
            <CheckCircle2 class="mr-1.5 size-3.5 text-sky-500" />
            Status
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" class="w-[160px]">
          <DropdownMenuLabel class="text-xs">Set status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              v-for="status in statuses"
              :key="status.value"
              @select="emit('bulkUpdate', { status: status.value })"
            >
              <component
                :is="status.icon"
                class="mr-2 size-3.5 text-muted-foreground"
              />
              {{ status.label }}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- Batch Priority -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="sm" class="h-8 text-xs">
            <Flame class="mr-1.5 size-3.5 text-amber-500" />
            Priority
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" class="w-[150px]">
          <DropdownMenuLabel class="text-xs">Set priority</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              v-for="priority in priorities"
              :key="priority.value"
              @select="emit('bulkUpdate', { priority: priority.value })"
            >
              <component
                :is="priority.icon"
                class="mr-2 size-3.5 text-muted-foreground"
              />
              {{ priority.label }}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- Batch Assignee -->
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="sm" class="h-8 text-xs">
            <UserCheck class="mr-1.5 size-3.5 text-emerald-500" />
            Assign
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" class="w-[175px]">
          <DropdownMenuLabel class="text-xs">Assign owner</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              v-for="person in assignees"
              :key="person.value"
              @select="emit('bulkUpdate', { assignee: person.value })"
            >
              {{ person.label }}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" class="mx-1 h-5" />

      <!-- Export -->
      <Button
        variant="ghost"
        size="sm"
        class="h-8 text-xs"
        @click="emit('exportCsv')"
      >
        <Download class="mr-1.5 size-3.5" />
        CSV
      </Button>
      <Button
        variant="ghost"
        size="sm"
        class="h-8 text-xs"
        @click="emit('exportJson')"
      >
        <FileJson class="mr-1.5 size-3.5" />
        JSON
      </Button>

      <Separator orientation="vertical" class="mx-1 h-5" />

      <Button
        variant="ghost"
        size="sm"
        class="h-8 text-xs text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
        @click="emit('bulkDelete')"
      >
        <Trash2 class="mr-1.5 size-3.5" />
        Delete
      </Button>

      <Button
        variant="ghost"
        size="sm"
        class="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
        @click="emit('clear')"
      >
        <X class="size-3.5" />
        <Kbd class="text-[10px]">Esc</Kbd>
      </Button>
    </div>
  </Transition>
</template>
