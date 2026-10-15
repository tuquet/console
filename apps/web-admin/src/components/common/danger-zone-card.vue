<script lang="ts" setup>
import { computed } from 'vue';

import { $t } from '@vben/locales';

import { ShieldAlert, Trash2 } from '@lucide/vue';
import { Button } from '@tuquet/vue-ui';

interface Props {
  buttonText: string;
  description: string;
  loading?: boolean;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  title: undefined,
});

const emit = defineEmits<{
  trigger: [];
}>();

const resolvedTitle = computed(() => props.title || $t('common.dangerZone'));
</script>

<template>
  <div
    class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-destructive/25 bg-destructive/5 p-4 sm:p-5"
  >
    <div class="space-y-0.5">
      <div class="flex items-center gap-1.5 text-destructive">
        <ShieldAlert class="size-4 shrink-0" />
        <h3 class="text-xs font-semibold text-foreground">
          {{ resolvedTitle }}
        </h3>
      </div>
      <p class="text-xs text-muted-foreground">{{ props.description }}</p>
    </div>
    <Button
      variant="outline"
      size="sm"
      class="h-8 text-xs flex items-center gap-1.5 border-destructive/40 text-destructive hover:text-destructive hover:bg-destructive/10 self-start sm:self-auto shrink-0"
      :disabled="props.loading"
      @click="emit('trigger')"
    >
      <Trash2 class="size-3.5" />
      <span>{{ props.buttonText }}</span>
    </Button>
  </div>
</template>
