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
  toast,
} from '@tuquet/vue-ui';

import { VxeForm, VxeFormItem } from '#/adapter/vxe-table';
import { $t } from '#/locales';

interface Props {
  loading?: boolean;
  open: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'submit', payload: { name: string; plan: string; slug: string }): void;
  (e: 'update:open', val: boolean): void;
}>();

const name = ref('');
const slug = ref('');
const plan = ref('pro');

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      name.value = '';
      slug.value = '';
      plan.value = 'pro';
    }
  },
);

function handleNameChange() {
  slug.value = name.value
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/[\s_-]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
}

function handleOk() {
  if (!name.value.trim() || !slug.value.trim()) {
    toast.warning($t('page.tenants_view.workspace_name_slug_required'));
    return;
  }
  emit('submit', {
    name: name.value.trim(),
    plan: plan.value,
    slug: slug.value.trim(),
  });
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {{ $t('page.tenants_view.create_modal_title') }}
        </DialogTitle>
      </DialogHeader>

      <div class="py-2">
        <VxeForm
          :data="{ name, slug, plan }"
          custom-layout
          size="small"
          class="w-full space-y-3"
        >
          <VxeFormItem :title="$t('page.workspace.col_name')" span="24">
            <template #default>
              <Input
                v-model="name"
                :placeholder="$t('page.tenants_view.name_placeholder')"
                class="h-10"
                @input="handleNameChange"
              />
            </template>
          </VxeFormItem>

          <VxeFormItem :title="$t('page.workspace.col_slug')" span="24">
            <template #default>
              <div class="space-y-1.5 w-full">
                <Input
                  v-model="slug"
                  :placeholder="$t('page.tenants_view.slug_placeholder')"
                  class="h-10"
                />
                <p class="text-xs text-muted-foreground">
                  {{ $t('page.tenants_view.slug_hint') }}
                </p>
              </div>
            </template>
          </VxeFormItem>

          <VxeFormItem :title="$t('page.workspace.service_plan')" span="24">
            <template #default>
              <select
                v-model="plan"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="pro">
                  {{ $t('page.tenants_view.plan_pro_recommended') }}
                </option>
                <option value="free">
                  {{ $t('page.tenants_view.plan_free_tier') }}
                </option>
                <option value="enterprise">
                  {{ $t('page.tenants_view.plan_enterprise_custom') }}
                </option>
              </select>
            </template>
          </VxeFormItem>
        </VxeForm>
      </div>

      <DialogFooter class="flex items-center justify-end gap-2 pt-2">
        <Button
          variant="outline"
          :disabled="props.loading"
          @click="emit('update:open', false)"
        >
          {{ $t('common.cancel') }}
        </Button>
        <Button :disabled="props.loading" @click="handleOk">
          {{ $t('page.tenants_view.create_submit_btn') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
