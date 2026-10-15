<script lang="ts" setup>
import type { TenantItem, WorkspaceSubscription } from '#/api';

import { useRouter } from 'vue-router';

import { Check, Copy, ExternalLink, Layers } from '@lucide/vue';
import { Badge, Button } from '@tuquet/vue-ui';

import DangerZoneCard from '#/components/common/danger-zone-card.vue';
import { useClipboard, useDateFormat } from '#/composables';
import { $t } from '#/locales';

interface Props {
  activeDevicesCount: number;
  isCurrentActive: boolean;
  membersCount: number;
  subscription: null | WorkspaceSubscription;
  tenant: TenantItem;
  totalDevicesCount: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  connectCli: [];
  deleteWorkspace: [];
  editWorkspace: [];
  setActive: [];
}>();

const router = useRouter();
const { formatDateOnly } = useDateFormat();
const { copyToClipboard, isCopied } = useClipboard();

function copyTenantId() {
  copyToClipboard(props.tenant.id, $t('page.tenants_view.tenant_id'));
}

function navigateToFleet() {
  router.push(`/automation/devices?tenant=${props.tenant.id}`);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Workspace Detail Specifications Grid (Mobile-First 1 -> 2 -> 3 Columns) -->
    <div
      class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm space-y-4"
    >
      <div
        class="flex items-center justify-between border-b border-border/40 pb-3"
      >
        <div class="flex items-center gap-2">
          <Layers class="size-4 text-muted-foreground" />
          <h2 class="text-sm font-semibold text-foreground">
            {{ $t('page.tenants_view.workspace_details') }}
          </h2>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <!-- 1. Workspace Name -->
        <div
          class="rounded-lg border border-border/50 bg-muted/20 p-3.5 space-y-1.5"
        >
          <div class="text-xs text-muted-foreground">
            {{ $t('page.workspace.col_name') }}
          </div>
          <div class="text-sm font-semibold text-foreground break-words">
            {{ tenant.name }}
          </div>
        </div>

        <!-- 2. Slug Identifier -->
        <div
          class="rounded-lg border border-border/50 bg-muted/20 p-3.5 space-y-1.5"
        >
          <div class="text-xs text-muted-foreground">
            {{ $t('page.workspace.col_slug') }}
          </div>
          <div class="font-mono text-xs font-medium text-foreground break-all">
            {{ tenant.slug }}
          </div>
        </div>

        <!-- 3. Tenant ID -->
        <div
          class="rounded-lg border border-border/50 bg-muted/20 p-3.5 space-y-1.5"
        >
          <div class="text-xs text-muted-foreground">
            {{ $t('page.tenants_view.tenant_id') }}
          </div>
          <div
            class="flex items-center justify-between gap-2 font-mono text-xs text-foreground"
          >
            <span class="break-all">{{ tenant.id }}</span>
            <button
              type="button"
              class="size-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
              :title="$t('page.tenants_view.copy_tenant_id')"
              @click="copyTenantId"
            >
              <Check
                v-if="isCopied($t('page.tenants_view.tenant_id'))"
                class="size-3.5 text-success"
              />
              <Copy v-else class="size-3.5" />
            </button>
          </div>
        </div>

        <!-- 4. Created At -->
        <div
          class="rounded-lg border border-border/50 bg-muted/20 p-3.5 space-y-1.5"
        >
          <div class="text-xs text-muted-foreground">
            {{ $t('page.workspace.col_created_at') }}
          </div>
          <div class="text-xs font-medium text-foreground">
            {{ formatDateOnly(tenant.created_at) }}
          </div>
        </div>

        <!-- 5. Service Plan -->
        <div
          class="rounded-lg border border-border/50 bg-muted/20 p-3.5 space-y-1.5"
        >
          <div class="text-xs text-muted-foreground">
            {{ $t('page.workspace.service_plan') }}
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Badge variant="default" class="text-xs font-medium">
              {{
                subscription?.plan?.name || $t('page.tenants_view.free_starter')
              }}
            </Badge>
            <span class="text-xs text-muted-foreground font-mono">
              ${{ subscription?.plan?.price_monthly_usd || 0 }}/{{
                $t('page.tenants_view.per_month')
              }}
            </span>
          </div>
        </div>

        <!-- 6. Device Infrastructure -->
        <div
          class="rounded-lg border border-border/50 bg-muted/20 p-3.5 space-y-1.5"
        >
          <div class="text-xs text-muted-foreground">
            {{ $t('page.tenants_view.device_infra') }}
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-baseline gap-1">
              <span class="font-semibold text-foreground text-sm font-mono">{{
                activeDevicesCount
              }}</span>
              <span class="text-xs text-muted-foreground">
                / {{ totalDevicesCount }}
                {{ $t('page.tenants_view.devices_online') }}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              class="h-6 px-2 text-xs gap-1 text-primary hover:text-primary"
              @click="navigateToFleet"
            >
              <span>{{ $t('page.tenants_view.view_devices') }}</span>
              <ExternalLink class="size-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Workspace Lifecycle / Danger Zone Card -->
    <DangerZoneCard
      :button-text="$t('page.tenants_view.archive_or_delete')"
      :description="$t('page.tenants_view.archive_or_delete')"
      :title="$t('page.tenants_view.admin_actions')"
      @trigger="emit('deleteWorkspace')"
    />
  </div>
</template>
