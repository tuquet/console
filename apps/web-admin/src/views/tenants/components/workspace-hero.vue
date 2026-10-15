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
import { Avatar, AvatarFallback, Badge, Button } from '@tuquet/vue-ui';

import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

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
  <div class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm">
    <div
      class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
      <!-- Left: Avatar & Basic Information -->
      <div class="flex items-start gap-3.5 sm:items-center">
        <Avatar
          class="size-12 sm:size-14 shrink-0 rounded-full border border-primary/20 bg-primary/10 font-semibold text-base sm:text-lg text-primary"
        >
          <AvatarFallback
            class="bg-transparent text-primary font-semibold text-base sm:text-lg"
          >
            {{ tenantInitials }}
          </AvatarFallback>
        </Avatar>

        <div class="space-y-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-lg sm:text-xl font-bold text-foreground truncate">
              {{ props.tenant.name }}
            </h1>
            <Badge variant="secondary" class="text-xs font-medium">
              {{ planName }}
            </Badge>
            <Badge variant="outline" class="text-xs font-normal">
              <span
                class="mr-1.5 size-1.5 rounded-full"
                :class="
                  props.tenant.status === 'active'
                    ? 'bg-success'
                    : 'bg-muted-foreground'
                "
              ></span>
              {{
                props.tenant.status === 'active'
                  ? $t('common.active')
                  : $t('common.suspended')
              }}
            </Badge>
          </div>

          <div
            class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
          >
            <span class="font-mono">slug: {{ props.tenant.slug }}</span>
            <span class="hidden sm:inline">•</span>
            <span class="flex items-center gap-1 font-mono">
              ID: {{ props.tenant.id.slice(0, 8) }}...
            </span>
            <span class="hidden sm:inline">•</span>
            <span class="flex items-center gap-1">
              <Calendar class="size-3.5" />
              <span
                >{{ $t('common.createdAt') }}:
                {{ formatDateOnly(props.tenant.created_at) }}</span
              >
            </span>
          </div>
        </div>
      </div>

      <!-- Right: Action Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <Button
          v-if="!props.isCurrentActive"
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 text-xs font-medium"
          @click="emit('setActive')"
        >
          <CheckCircle2 class="size-3.5" />
          <span>{{ $t('page.tenants_view.set_primary') }}</span>
        </Button>

        <Badge
          v-else
          variant="secondary"
          class="flex items-center gap-1.5 px-2.5 py-1 font-medium text-xs"
        >
          <span class="size-1.5 rounded-full bg-success"></span>
          <span>{{ $t('common.active') }}</span>
        </Badge>

        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 text-xs font-medium"
          @click="emit('connectCli')"
        >
          <Terminal class="size-3.5" />
          <span>{{ $t('page.tenants_view.pair_cli') }}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 text-xs font-medium"
          @click="emit('openSettings')"
        >
          <Settings class="size-3.5" />
          <span>{{ $t('page.tenants_view.settings') }}</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          class="size-8 shrink-0"
          :disabled="props.loading"
          :title="$t('common.refresh')"
          @click="emit('refresh')"
        >
          <RefreshCw
            class="size-3.5"
            :class="{ 'animate-spin': props.loading }"
          />
        </Button>
      </div>
    </div>
  </div>
</template>
