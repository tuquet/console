<script lang="ts" setup>
import type { Task, TaskDraft } from '../tasks/data/schema';

import { computed, ref } from 'vue';

import { useKernel } from '@operon/kernel';

import { Badge, Button } from '@operon-core/shadcn-ui';

import { Cloud, Cpu, Download, ListTodo, RotateCcw } from '@lucide/vue';

import { tasksToCsv, usePlaygroundStore } from '../stores/sample';
import { createTaskColumns } from '../tasks/components/columns';
import DataTable from '../tasks/components/DataTable.vue';
import TaskInspectorSheet from '../tasks/components/TaskInspectorSheet.vue';

defineOptions({ name: 'PlaygroundOverviewView' });

const kernel = useKernel();
const store = usePlaygroundStore();

const isCloud = computed(() => kernel.auth.hasCloudAuth);
const copiedId = ref<null | string>(null);
let copyTimer: ReturnType<typeof setTimeout> | undefined;

const inspectorOpen = ref(false);
const inspectorMode = ref<'create' | 'edit'>('edit');
const activeTask = ref<null | Task>(null);

function openCreateSheet() {
  inspectorMode.value = 'create';
  activeTask.value = null;
  inspectorOpen.value = true;
}

function openInspectSheet(task: Task) {
  inspectorMode.value = 'edit';
  activeTask.value = task;
  inspectorOpen.value = true;
}

async function copyTaskId(id: string) {
  try {
    await navigator.clipboard.writeText(id);
  } catch {
    // Clipboard unavailable in restricted contexts
  }
  copiedId.value = id;
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copiedId.value = null;
  }, 1500);
  kernel.events.notify('info', `Copied ${id} to clipboard`);
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function handleExportCsv(rows: Task[]) {
  downloadBlob('operon-tasks.csv', tasksToCsv(rows), 'text/csv;charset=utf-8;');
  kernel.events.notify('success', `Exported ${rows.length} task(s) to CSV`);
}

function handleExportJson(rows: Task[]) {
  downloadBlob(
    'operon-tasks.json',
    JSON.stringify(rows, null, 2),
    'application/json;charset=utf-8;',
  );
  kernel.events.notify('success', `Exported ${rows.length} task(s) to JSON`);
}

function handleCreate(draft: TaskDraft) {
  const created = store.createTask(draft);
  kernel.events.notify('success', `Created ${created.id}: ${created.title}`);
}

function handleSave(id: string, draft: TaskDraft) {
  store.updateTask(id, draft);
  kernel.events.notify('success', `Saved changes to ${id}`);
}

function handleDeleteSingle(id: string) {
  store.deleteTasks([id]);
  kernel.events.notify('info', `Deleted ${id}`);
}

function handleBulkUpdate(
  ids: string[],
  patch: Partial<Pick<Task, 'assignee' | 'label' | 'priority' | 'status'>>,
) {
  const updated = store.bulkUpdate(ids, patch);
  kernel.events.notify('success', `Updated ${updated} selected task(s)`);
}

function handleBulkDelete(ids: string[]) {
  const deleted = store.deleteTasks(ids);
  kernel.events.notify('info', `Deleted ${deleted} task(s)`);
}

function handleReset() {
  store.resetTasks();
  kernel.events.notify('info', 'Tasks synced to workspace baseline');
}

const columns = createTaskColumns(
  {
    onInspect: openInspectSheet,
    onCopyId: copyTaskId,
    onDuplicate: (id) => {
      const copy = store.duplicateTask(id);
      if (copy) kernel.events.notify('success', `Duplicated as ${copy.id}`);
    },
    onToggleFavorite: (id) => {
      const pinned = store.toggleFavorite(id);
      kernel.events.notify(
        'info',
        pinned ? `Pinned ${id} to favorites` : `Unpinned ${id}`,
      );
    },
    onQuickUpdate: (id, patch) => {
      store.bulkUpdate([id], patch);
      kernel.events.notify('success', `Updated ${id}`);
    },
    onDelete: handleDeleteSingle,
  },
  copiedId,
);
</script>

<template>
  <div class="flex min-h-full flex-col gap-3.5 px-5 pt-4 pb-16">
    <!-- Compact Single-Line Page Header -->
    <div
      class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"
    >
      <div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <div class="flex items-center gap-2">
          <ListTodo class="text-primary size-4" />
          <h2 class="text-base font-semibold tracking-tight">Tasks</h2>
          <Badge
            variant="outline"
            class="px-1.5 py-0 text-[11px] font-normal"
            :class="
              isCloud
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-border bg-muted/40 text-muted-foreground'
            "
          >
            <Cloud v-if="isCloud" class="mr-1 size-3" />
            <Cpu v-else class="mr-1 size-3" />
            {{ isCloud ? 'Cloud Synced' : 'Local Workspace' }}
          </Badge>
        </div>
        <span class="text-muted-foreground hidden text-xs md:inline">
          · Track, prioritize, and coordinate engineering issues
        </span>
      </div>

      <div class="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          class="text-muted-foreground hover:text-foreground h-8 text-xs font-normal"
          @click="handleExportCsv(store.tasks)"
        >
          <Download class="mr-1.5 size-3.5 opacity-70" />
          Export CSV
        </Button>
        <Button
          size="sm"
          variant="outline"
          class="text-muted-foreground hover:text-foreground h-8 text-xs font-normal"
          @click="handleReset"
        >
          <RotateCcw class="mr-1.5 size-3.5 opacity-70" />
          Reset
        </Button>
      </div>
    </div>

    <!-- Main Enterprise Data Table -->
    <DataTable
      :columns="columns"
      :data="store.tasks"
      :metrics="store.metrics"
      @create="openCreateSheet"
      @inspect="openInspectSheet"
      @bulk-update="handleBulkUpdate"
      @bulk-delete="handleBulkDelete"
      @export-csv="handleExportCsv"
      @export-json="handleExportJson"
    />

    <!-- Slide-Over Inspector / Creator -->
    <TaskInspectorSheet
      v-model:open="inspectorOpen"
      :mode="inspectorMode"
      :task="activeTask"
      @create="handleCreate"
      @save="handleSave"
      @delete="handleDeleteSingle"
    />
  </div>
</template>
