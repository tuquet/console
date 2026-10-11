<script lang="ts" setup>
import type { TenantItem } from '#/api';

import { computed } from 'vue';

import {
  Calendar,
  CheckCircle2,
  RefreshCw,
  Settings,
  Terminal,
} from '@lucide/vue';
import { Avatar, Badge, Button, Tag } from 'ant-design-vue';

import { useDateFormat } from '#/composables';

interface Props {
  isCurrentActive: boolean;
  loading?: boolean;
  tenant: TenantItem;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  connectCli: [];
  openSettings: [];
  refresh: [];
  setActive: [];
}>();

const { formatDateOnly } = useDateFormat();

const tenantInitials = computed(() => {
  return (props.tenant.name || 'W').slice(0, 2).toUpperCase();
});

const planName = computed(() => {
  return props.tenant.metadata?.plan || 'Pro';
});
</script>

<template>
  <div class="rounded-xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm">
    <div
      class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
    >
      <!-- Left: Avatar & Basic Information -->
      <div class="flex items-start gap-4 sm:items-center">
        <Avatar
          :size="64"
          class="shrink-0 bg-gradient-to-tr from-sky-600 to-indigo-600 font-semibold text-lg text-white"
        >
          {{ tenantInitials }}
        </Avatar>

        <div class="space-y-1.5 min-w-0">
          <div class="flex flex-wrap items-center gap-2.5">
            <h1 class="text-xl font-bold text-foreground truncate">
              {{ props.tenant.name }}
            </h1>
            <Tag color="blue" class="font-mono uppercase text-xs">
              {{ planName }}
            </Tag>
            <Badge
              :status="props.tenant.status === 'active' ? 'success' : 'default'"
              :text="
                props.tenant.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'
              "
              class="text-xs text-muted-foreground"
            />
          </div>

          <div
            class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
          >
            <span class="font-mono">slug: {{ props.tenant.slug }}</span>
            <span class="hidden sm:inline">•</span>
            <span class="flex items-center gap-1 font-mono">
              ID: {{ props.tenant.id.slice(0, 8) }}...
            </span>
            <span class="hidden sm:inline">•</span>
            <span class="flex items-center gap-1">
              <Calendar class="size-3.5" />
              <span>Tạo: {{ formatDateOnly(props.tenant.created_at) }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Right: Action Buttons -->
      <div class="flex flex-wrap items-center gap-2.5">
        <Button
          v-if="!props.isCurrentActive"
          type="primary"
          ghost
          class="flex items-center gap-1.5"
          @click="emit('setActive')"
        >
          <CheckCircle2 class="size-4" />
          <span>Đặt Làm Chính</span>
        </Button>

        <Tag
          v-else
          color="success"
          class="flex items-center gap-1 px-3 py-1 font-medium text-xs"
        >
          <CheckCircle2 class="size-3.5" />
          <span>Active Workspace</span>
        </Tag>

        <Button class="flex items-center gap-1.5" @click="emit('connectCli')">
          <Terminal class="size-4 text-sky-400" />
          <span>Ghép Nối CLI</span>
        </Button>

        <Button class="flex items-center gap-1.5" @click="emit('openSettings')">
          <Settings class="size-4" />
          <span>Cài Đặt</span>
        </Button>

        <Button
          class="flex items-center justify-center p-2"
          :loading="props.loading"
          @click="emit('refresh')"
        >
          <RefreshCw class="size-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
