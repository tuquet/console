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

import { WORKSPACE_PLAN } from '#/api/core/workspace';
import { $t } from '#/locales';
import { useWorkspaceStore } from '#/store/workspace';

defineOptions({ name: 'WorkspaceCreateDialog' });

const open = defineModel<boolean>('open', { default: false });

const workspaceStore = useWorkspaceStore();

const name = ref('');
const slug = ref('');
const plan = ref<string>(WORKSPACE_PLAN.PRO);
const isSlugTouched = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);

const AVAILABLE_PLANS = [
  WORKSPACE_PLAN.FREE,
  WORKSPACE_PLAN.PRO,
  WORKSPACE_PLAN.ENTERPRISE,
] as const;

watch(open, (isOpen) => {
  if (isOpen) {
    name.value = '';
    slug.value = '';
    plan.value = WORKSPACE_PLAN.PRO;
    isSlugTouched.value = false;
    errorMessage.value = '';
  }
});

function toSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/[\s_]+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
}

function handleNameInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  name.value = value;
  errorMessage.value = '';
  if (!isSlugTouched.value) {
    slug.value = toSlug(value);
  }
}

function handleSlugInput(event: Event) {
  isSlugTouched.value = true;
  errorMessage.value = '';
  slug.value = toSlug((event.target as HTMLInputElement).value);
}

async function handleSubmit() {
  const trimmedName = name.value.trim();
  const normalizedSlug = toSlug(slug.value || trimmedName);
  if (trimmedName.length < 2 || normalizedSlug.length < 2) {
    errorMessage.value = $t('page.workspace.invalid_slug');
    return;
  }

  try {
    isSubmitting.value = true;
    errorMessage.value = '';
    await workspaceStore.createWorkspace({
      name: trimmedName,
      plan: plan.value,
      slug: normalizedSlug,
    });
    open.value = false;
  } catch (error: any) {
    errorMessage.value = error?.message || $t('page.workspace.create_failed');
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

      <div class="flex flex-col gap-3.5 py-3">
        <div class="flex flex-col gap-1.5">
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

        <div class="flex flex-col gap-1.5">
          <Label class="text-foreground">
            {{ $t('page.workspace.col_slug') }}
          </Label>
          <Input
            :value="slug"
            placeholder="e.g. acme-corp"
            class="h-9"
            @input="handleSlugInput"
          />
        </div>

        <div class="flex flex-col gap-1.5">
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

        <p
          v-if="errorMessage"
          role="alert"
          class="text-xs font-medium text-destructive"
        >
          {{ errorMessage }}
        </p>
      </div>

      <DialogFooter class="gap-2">
        <Button
          type="button"
          variant="outline"
          :disabled="isSubmitting"
          @click="open = false"
        >
          {{ $t('common.cancel') }}
        </Button>
        <Button type="button" :disabled="isSubmitting" @click="handleSubmit">
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
