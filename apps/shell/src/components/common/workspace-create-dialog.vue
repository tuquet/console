<script lang="ts" setup>
import { ref, watch } from 'vue';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@operon-core/shadcn-ui';

import { TENANT_PLAN } from '#/api/core/tenant';
import { $t } from '#/locales';
import { useWorkspaceStore } from '#/store/workspace';

defineOptions({ name: 'WorkspaceCreateDialog' });

const open = defineModel<boolean>('open', { default: false });

const workspaceStore = useWorkspaceStore();

const name = ref('');
const slug = ref('');
const plan = ref<string>(TENANT_PLAN.PRO);
const isSubmitting = ref(false);

const AVAILABLE_PLANS = [
  TENANT_PLAN.FREE,
  TENANT_PLAN.PRO,
  TENANT_PLAN.ENTERPRISE,
] as const;

watch(open, (isOpen) => {
  if (isOpen) {
    name.value = '';
    slug.value = '';
    plan.value = TENANT_PLAN.PRO;
  }
});

function toSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/[\s_-]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
}

function handleNameInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  name.value = value;
  slug.value = toSlug(value);
}

async function handleSubmit() {
  const trimmedName = name.value.trim();
  if (!trimmedName) return;
  try {
    isSubmitting.value = true;
    await workspaceStore.createWorkspace({
      name: trimmedName,
      plan: plan.value,
      slug: slug.value.trim() || toSlug(trimmedName),
    });
    open.value = false;
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{{ $t('page.workspace.create_workspace') }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-3.5 py-3">
        <div class="grid gap-1.5">
          <Label class="text-foreground">
            {{ $t('page.workspace.col_name') }}
          </Label>
          <Input
            :value="name"
            placeholder="e.g. Acme Corp"
            class="h-9"
            @input="handleNameInput"
          />
        </div>

        <div class="grid gap-1.5">
          <Label class="text-foreground">
            {{ $t('page.workspace.col_slug') }}
          </Label>
          <Input v-model="slug" placeholder="e.g. acme-corp" class="h-9" />
        </div>

        <div class="grid gap-1.5">
          <Label class="text-foreground">
            {{ $t('page.workspace.col_plan') }}
          </Label>
          <div class="grid grid-cols-3 gap-2">
            <Button
              v-for="item in AVAILABLE_PLANS"
              :key="item"
              type="button"
              variant="outline"
              class="h-auto rounded-md border p-2 text-center capitalize transition-colors"
              :class="
                plan === item
                  ? 'border-primary bg-primary/10 text-primary hover:bg-primary/15'
                  : 'border-input text-foreground hover:bg-muted'
              "
              @click="plan = item"
            >
              {{ item }}
            </Button>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" @click="open = false">
          {{ $t('common.cancel') }}
        </Button>
        <Button
          size="sm"
          :disabled="!name.trim() || isSubmitting"
          @click="handleSubmit"
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
</template>
