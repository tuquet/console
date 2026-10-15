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

import { $t } from '#/locales';

interface Props {
  loading?: boolean;
  open: boolean;
  slug?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  slug: '',
});

const emit = defineEmits<{
  (e: 'submit'): void;
  (e: 'update:open', val: boolean): void;
}>();

const confirmSlugInput = ref('');

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      confirmSlugInput.value = '';
    }
  },
);

function handleOk() {
  if (confirmSlugInput.value.trim() !== props.slug) {
    toast.error($t('page.tenants_view.confirm_slug_mismatch'));
    return;
  }
  emit('submit');
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{ $t('page.tenants_view.delete_modal_title') }}
        </DialogTitle>
      </DialogHeader>

      <div class="space-y-5 py-2">
        <div
          class="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
        >
          {{ $t('page.tenants_view.delete_modal_warning') }}
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            {{ $t('page.tenants_view.delete_confirm_prompt') }}
            <strong class="font-mono text-destructive">{{ props.slug }}</strong>
          </label>
          <Input v-model="confirmSlugInput" :placeholder="props.slug" />
        </div>
      </div>

      <DialogFooter class="flex items-center justify-end gap-2 pt-2">
        <Button
          variant="outline"
          :disabled="props.loading"
          @click="emit('update:open', false)"
        >
          {{ $t('common.cancel') }}
        </Button>
        <Button
          variant="destructive"
          :disabled="props.loading || confirmSlugInput.trim() !== props.slug"
          @click="handleOk"
        >
          {{ $t('page.tenants_view.confirm_delete_btn') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
