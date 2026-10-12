<script lang="ts" setup>
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
  title: 'Vùng Nguy Hiểm (Danger Zone)',
});

const emit = defineEmits<{
  trigger: [];
}>();
</script>

<template>
  <div class="border-t border-red-500/20 pt-6">
    <div class="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
      <div class="flex items-center gap-2 text-red-400">
        <ShieldAlert class="size-4.5" />
        <h4 class="text-sm font-semibold">{{ props.title }}</h4>
      </div>
      <p class="text-xs text-muted-foreground">{{ props.description }}</p>
      <div>
        <Button
          variant="destructive"
          class="flex items-center gap-1.5"
          :disabled="props.loading"
          @click="emit('trigger')"
        >
          <Trash2 class="size-4" />
          <span>{{ props.buttonText }}</span>
        </Button>
      </div>
    </div>
  </div>
</template>
