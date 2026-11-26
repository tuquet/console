<script setup lang="ts">
import type { LinkedBrowserOption } from '../../api/tasks';
import type { Task, TaskDraft } from '../data/schema';

import { SchemaSheet } from '@operon/common-ui';

import { createTaskInspectorSchema } from './task-inspector-schema';

interface TaskInspectorSheetProps {
  browsers?: LinkedBrowserOption[];
  mode: 'create' | 'edit';
  open: boolean;
  task: null | Task;
}

const props = defineProps<TaskInspectorSheetProps>();

const emit = defineEmits<{
  create: [draft: TaskDraft];
  delete: [id: string];
  save: [id: string, draft: TaskDraft];
  'update:open': [value: boolean];
}>();

const schema = createTaskInspectorSchema({
  getBrowsers: () => props.browsers ?? [],
  onCreate: (draft) => {
    emit('create', draft);
  },
  onDelete: (id) => {
    emit('delete', id);
  },
  onSave: (id, draft) => {
    emit('save', id, draft);
  },
});
</script>

<template>
  <SchemaSheet
    :open="open"
    :mode="mode"
    :record="task"
    :schema="schema"
    @update:open="emit('update:open', $event)"
  />
</template>
