<script lang="ts" setup>
import type { WorkspaceRecord } from '../stores/workspaces';

import { ref, watch } from 'vue';

import { useKernel } from '@operon/kernel';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@operon-core/shadcn-ui';

import { $t } from '../locales';
import { useWorkspacesStore } from '../stores/workspaces';

defineOptions({ name: 'WorkspaceFormDialog' });

const props = defineProps<{
  target: null | WorkspaceRecord;
}>();

const open = defineModel<boolean>('open', { default: false });

const kernel = useKernel();
const workspacesStore = useWorkspacesStore();

const AVAILABLE_PLANS = ['free', 'pro', 'enterprise'] as const;

const formName = ref('');
const formSlug = ref('');
const formPlan = ref<string>('pro');
const formStatus = ref<'active' | 'archived' | 'suspended'>('active');
const isSlugTouched = ref(false);
const formError = ref('');
const isSubmitting = ref(false);

function toSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/[\s_]+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
}

watch(
  [open, () => props.target],
  ([isOpen, target]) => {
    if (!isOpen) return;
    if (target) {
      formName.value = target.name;
      formSlug.value = target.slug;
      formPlan.value = target.plan || 'pro';
      formStatus.value = target.status;
      isSlugTouched.value = true;
    } else {
      formName.value = '';
      formSlug.value = '';
      formPlan.value = kernel.auth.hasCloudAuth ? 'pro' : 'local';
      formStatus.value = 'active';
      isSlugTouched.value = false;
    }
    formError.value = '';
  },
  { immediate: true },
);

function handleNameInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  formName.value = value;
  formError.value = '';
  if (!isSlugTouched.value) {
    formSlug.value = toSlug(value);
  }
}

function handleSlugInput(event: Event) {
  isSlugTouched.value = true;
  formError.value = '';
  formSlug.value = toSlug((event.target as HTMLInputElement).value);
}

async function handleSaveForm() {
  const trimmedName = formName.value.trim();
  const normalizedSlug = toSlug(formSlug.value || trimmedName);
  if (trimmedName.length < 2 || normalizedSlug.length < 2) {
    formError.value = $t('workspaces.workspace_name_slug_required');
    return;
  }

  try {
    isSubmitting.value = true;
    formError.value = '';
    if (props.target) {
      await workspacesStore.updateWorkspace(props.target.id, {
        name: trimmedName,
        plan: formPlan.value,
        slug: normalizedSlug,
        status: formStatus.value,
      });
      kernel.events.notify(
        'success',
        $t('workspaces.workspace_updated_success'),
      );
    } else {
      await workspacesStore.createWorkspace({
        name: trimmedName,
        plan: formPlan.value,
        slug: normalizedSlug,
      });
    }
    open.value = false;
  } catch (error: any) {
    formError.value =
      error?.message || $t('workspaces.workspace_update_failed');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[440px]">
      <DialogHeader>
        <DialogTitle>
          {{
            target
              ? $t('workspaces.edit_modal_title')
              : $t('workspaces.create_modal_title')
          }}
        </DialogTitle>
      </DialogHeader>

      <div class="flex flex-col gap-3.5 py-2">
        <div class="flex flex-col gap-1.5">
          <Label>{{ $t('common.name') }}</Label>
          <Input
            :value="formName"
            :placeholder="$t('workspaces.name_placeholder')"
            @input="handleNameInput"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <Label>Slug</Label>
          <Input
            :value="formSlug"
            :placeholder="$t('workspaces.slug_placeholder')"
            class="font-mono text-xs"
            @input="handleSlugInput"
          />
          <p class="text-[11px] text-muted-foreground">
            {{ $t('workspaces.slug_hint') }}
          </p>
        </div>

        <div v-if="kernel.auth.hasCloudAuth" class="flex flex-col gap-1.5">
          <Label>{{ $t('workspaces.filter_plan') }}</Label>
          <div class="grid grid-cols-3 gap-2">
            <Button
              v-for="item in AVAILABLE_PLANS"
              :key="item"
              type="button"
              variant="outline"
              class="h-8 capitalize shadow-none"
              :class="
                formPlan === item
                  ? 'border-primary bg-primary/10 text-primary'
                  : ''
              "
              @click="formPlan = item"
            >
              {{ item }}
            </Button>
          </div>
        </div>

        <div v-if="target" class="flex flex-col gap-1.5">
          <Label>{{ $t('common.status') }}</Label>
          <Select v-model="formStatus">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                {{ $t('common.active') }}
              </SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="suspended">
                {{ $t('common.suspended') }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p
          v-if="formError"
          role="alert"
          class="text-xs font-medium text-destructive"
        >
          {{ formError }}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" @click="open = false">
          {{ $t('common.cancel') }}
        </Button>
        <Button size="sm" :disabled="isSubmitting" @click="handleSaveForm">
          {{ target ? $t('common.save') : $t('workspaces.create_submit_btn') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
