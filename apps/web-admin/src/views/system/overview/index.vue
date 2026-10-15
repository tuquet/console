<script lang="ts" setup>
import type { SystemOverviewSummary } from '#/api';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  ArrowRight,
  CreditCard,
  DollarSign,
  KeyRound,
  Layers,
  Puzzle,
  RefreshCw,
  ShieldCheck,
  Users,
} from '@lucide/vue';
import { Badge, Button, toast } from '@tuquet/vue-ui';

import { getSystemOverviewApi } from '#/api';
import { VxeRowDetailSheet } from '#/components/vxe-detail-sheet';
import { useDateFormat } from '#/composables';
import {
  getStatusToneMeta,
  SUBSCRIPTION_STATUS_META,
  TENANT_PLAN_META,
} from '#/constants';
import { $t } from '#/locales';

defineOptions({ name: 'SystemOverview' });

const router = useRouter();
const { formatDate } = useDateFormat();
const loading = ref(false);
const detailOpen = ref(false);
const detailRow = ref<null | Record<string, any>>(null);
const detailResource = ref<'billing.subscriptions' | 'public.audit_logs'>(
  'public.audit_logs',
);

function openOverviewDetail(
  row: Record<string, any>,
  resource: 'billing.subscriptions' | 'public.audit_logs',
) {
  detailResource.value = resource;
  detailRow.value = row;
  detailOpen.value = true;
}

const overview = ref<SystemOverviewSummary>({
  auditLogs: { total: 0 },
  plans: { active: 0, paused: 0, total: 0 },
  plugins: { core: 0, extension: 0, installed: 0, total: 0 },
  recentAuditLogs: [],
  recentSubscriptions: [],
  recentUsers: [],
  roles: { custom: 0, permissionsTotal: 0, system: 0, total: 0 },
  subscriptions: { active: 0, canceled: 0, mrrUsd: 0, pastDue: 0, total: 0 },
  users: { total: 0, unassigned: 0, withWorkspaces: 0 },
});

const moduleCards = computed(() => [
  {
    icon: Puzzle,
    key: 'plugins',
    path: '/system/plugins',
    subtext: $t('page.system_view.overview_sub_plugins', [
      overview.value.plugins.core,
      overview.value.plugins.extension,
    ]),
    title: $t('page.system.plugins'),
    total: overview.value.plugins.total,
  },
  {
    icon: Layers,
    key: 'plans',
    path: '/system/plans',
    subtext: $t('page.system_view.overview_sub_plans', [
      overview.value.plans.active,
    ]),
    title: $t('page.system.plans'),
    total: overview.value.plans.total,
  },
  {
    icon: Users,
    key: 'users',
    path: '/system/users',
    subtext: $t('page.system_view.overview_sub_users', [
      overview.value.users.withWorkspaces,
      overview.value.users.unassigned,
    ]),
    title: $t('page.system.users'),
    total: overview.value.users.total,
  },
  {
    icon: KeyRound,
    key: 'roles',
    path: '/system/roles',
    subtext: $t('page.system_view.overview_sub_roles', [
      overview.value.roles.system,
      overview.value.roles.permissionsTotal,
    ]),
    title: $t('page.system.roles'),
    total: overview.value.roles.total,
  },
  {
    icon: CreditCard,
    key: 'subscriptions',
    path: '/system/subscriptions',
    subtext: $t('page.system_view.overview_sub_subscriptions', [
      overview.value.subscriptions.active,
      overview.value.subscriptions.mrrUsd.toLocaleString(),
    ]),
    title: $t('page.system.subscriptions'),
    total: overview.value.subscriptions.total,
  },
  {
    icon: ShieldCheck,
    key: 'auditLogs',
    path: '/system/audit-logs',
    subtext: $t('page.system_view.overview_sub_audit'),
    title: $t('page.system.auditLogs'),
    total: overview.value.auditLogs.total,
  },
]);

async function loadOverview() {
  loading.value = true;
  try {
    overview.value = await getSystemOverviewApi();
  } catch (error: any) {
    toast.error(error?.message || $t('page.system_view.overview_load_failed'));
  } finally {
    loading.value = false;
  }
}

function getSubscriptionStatusMeta(status: string) {
  return getStatusToneMeta(status, SUBSCRIPTION_STATUS_META);
}

function getPlanMeta(planId: string) {
  return getStatusToneMeta(planId, TENANT_PLAN_META);
}

onMounted(() => {
  loadOverview();
});
</script>

<template>
  <div class="space-y-3.5 p-3 sm:space-y-5 sm:p-5">
    <!-- Compact Single-Row Header -->
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0">
        <h1
          class="truncate text-base font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {{ $t('page.system.overview') }}
        </h1>
        <p class="hidden text-xs text-muted-foreground sm:block">
          {{ $t('page.system.overview_desc') }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 px-2.5 text-xs"
          :disabled="loading"
          :title="$t('common.refresh')"
          @click="loadOverview"
        >
          <RefreshCw class="size-3.5" :class="{ 'animate-spin': loading }" />
          <span class="hidden sm:inline">{{ $t('common.refresh') }}</span>
        </Button>
      </div>
    </div>

    <!-- 1. Platform Governance & Revenue KPI Strip (2x2 on Mobile, 4 cols on Desktop) -->
    <div class="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
      <!-- KPI 1: Monthly Recurring Revenue -->
      <div
        class="rounded-xl border border-border/60 bg-card p-3 shadow-xs sm:p-4"
      >
        <div class="flex items-center justify-between gap-1.5">
          <span
            class="truncate text-xs font-medium text-muted-foreground sm:text-sm"
          >
            {{ $t('page.system_view.overview_kpi_mrr') }}
          </span>
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground sm:size-9"
          >
            <DollarSign class="size-3.5 text-success sm:size-4.5" />
          </span>
        </div>
        <div class="mt-1.5 flex items-baseline gap-1 sm:mt-2 sm:gap-1.5">
          <span
            class="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            ${{ overview.subscriptions.mrrUsd.toLocaleString() }}
          </span>
          <span
            class="truncate text-2xs font-medium text-muted-foreground sm:text-xs"
          >
            {{ $t('page.system_view.per_month_suffix') }}
          </span>
        </div>
        <div
          class="mt-1 hidden truncate text-xs text-muted-foreground sm:mt-2 sm:block"
        >
          {{
            $t('page.system_view.overview_kpi_mrr_desc', [
              overview.subscriptions.active,
              overview.subscriptions.pastDue,
            ])
          }}
        </div>
      </div>

      <!-- KPI 2: Platform Users -->
      <div
        class="rounded-xl border border-border/60 bg-card p-3 shadow-xs sm:p-4"
      >
        <div class="flex items-center justify-between gap-1.5">
          <span
            class="truncate text-xs font-medium text-muted-foreground sm:text-sm"
          >
            {{ $t('page.system_view.overview_kpi_users') }}
          </span>
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground sm:size-9"
          >
            <Users class="size-3.5 sm:size-4.5" />
          </span>
        </div>
        <div class="mt-1.5 flex items-baseline gap-1.5 sm:mt-2 sm:gap-2">
          <span
            class="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            {{ overview.users.total }}
          </span>
          <span
            class="truncate text-2xs font-medium text-muted-foreground sm:text-xs"
          >
            {{ $t('page.system_view.overview_kpi_users_unit') }}
          </span>
        </div>
        <div
          class="mt-1 hidden truncate text-xs text-muted-foreground sm:mt-2 sm:block"
        >
          {{
            $t('page.system_view.overview_kpi_users_desc', [
              overview.users.withWorkspaces,
              overview.users.unassigned,
            ])
          }}
        </div>
      </div>

      <!-- KPI 3: System Plugins -->
      <div
        class="rounded-xl border border-border/60 bg-card p-3 shadow-xs sm:p-4"
      >
        <div class="flex items-center justify-between gap-1.5">
          <span
            class="truncate text-xs font-medium text-muted-foreground sm:text-sm"
          >
            {{ $t('page.system_view.overview_kpi_plugins') }}
          </span>
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground sm:size-9"
          >
            <Puzzle class="size-3.5 sm:size-4.5" />
          </span>
        </div>
        <div class="mt-1.5 flex items-baseline gap-1.5 sm:mt-2 sm:gap-2">
          <span
            class="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            {{ overview.plugins.installed }}
          </span>
          <span
            class="truncate text-2xs font-medium text-muted-foreground sm:text-xs"
          >
            {{ $t('page.system_view.overview_kpi_plugins_unit') }}
          </span>
        </div>
        <div
          class="mt-1 hidden truncate text-xs text-muted-foreground sm:mt-2 sm:block"
        >
          {{
            $t('page.system_view.overview_kpi_plugins_desc', [
              overview.plugins.core,
              overview.plugins.extension,
            ])
          }}
        </div>
      </div>

      <!-- KPI 4: Access Control (RBAC) -->
      <div
        class="rounded-xl border border-border/60 bg-card p-3 shadow-xs sm:p-4"
      >
        <div class="flex items-center justify-between gap-1.5">
          <span
            class="truncate text-xs font-medium text-muted-foreground sm:text-sm"
          >
            {{ $t('page.system_view.overview_kpi_rbac') }}
          </span>
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground sm:size-9"
          >
            <KeyRound class="size-3.5 sm:size-4.5" />
          </span>
        </div>
        <div class="mt-1.5 flex items-baseline gap-1.5 sm:mt-2 sm:gap-2">
          <span
            class="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            {{ overview.roles.permissionsTotal }}
          </span>
          <span
            class="truncate text-2xs font-medium text-muted-foreground sm:text-xs"
          >
            {{ $t('page.system_view.overview_kpi_rbac_unit') }}
          </span>
        </div>
        <div
          class="mt-1 hidden truncate text-xs text-muted-foreground sm:mt-2 sm:block"
        >
          {{
            $t('page.system_view.overview_kpi_rbac_desc', [
              overview.roles.total,
              overview.roles.system,
              overview.roles.custom,
            ])
          }}
        </div>
      </div>
    </div>

    <!-- 2. Quick-Jump System Governance Modules (2 cols on Mobile, 3 on Tablet, 6 on Desktop) -->
    <div class="space-y-2">
      <h2 class="text-sm font-semibold tracking-tight text-foreground">
        {{ $t('page.system_view.overview_modules_title') }}
      </h2>
      <div
        class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6"
      >
        <button
          v-for="mod in moduleCards"
          :key="mod.key"
          type="button"
          class="group flex flex-col justify-between rounded-xl border border-border/60 bg-card p-3 text-left shadow-xs transition-all hover:border-primary/40 hover:bg-muted/20 sm:p-4"
          @click="router.push(mod.path)"
        >
          <div class="flex items-center justify-between gap-2">
            <div
              class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"
            >
              <component :is="mod.icon" class="size-4" />
            </div>
            <ArrowRight
              class="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            />
          </div>
          <div class="mt-2.5">
            <div class="flex items-baseline justify-between gap-1.5">
              <span
                class="truncate text-xs font-medium text-foreground sm:text-sm"
              >
                {{ mod.title }}
              </span>
              <span
                class="font-mono text-base font-bold text-foreground sm:text-lg"
              >
                {{ mod.total }}
              </span>
            </div>
            <p
              class="mt-0.5 truncate text-2xs text-muted-foreground sm:text-xs"
            >
              {{ mod.subtext }}
            </p>
          </div>
        </button>
      </div>
    </div>

    <!-- 3. Recent Security Audit Events & Recent Workspace Subscriptions -->
    <div class="grid grid-cols-1 gap-3.5 sm:gap-4 lg:grid-cols-2">
      <!-- Recent Audit Events -->
      <div
        class="rounded-xl border border-border/60 bg-card p-3.5 shadow-xs sm:p-4"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <ShieldCheck class="size-4 text-muted-foreground" />
            <h3 class="text-sm font-semibold text-foreground">
              {{ $t('page.system_view.overview_recent_audit') }}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            @click="router.push('/system/audit-logs')"
          >
            <span>{{ $t('page.system_view.overview_view_all') }}</span>
            <ArrowRight class="size-3" />
          </Button>
        </div>

        <div
          v-if="overview.recentAuditLogs.length > 0"
          class="divide-y divide-border/40"
        >
          <div
            v-for="log in overview.recentAuditLogs"
            :key="log.id"
            class="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40 first:pt-1.5 last:pb-1.5"
            @click="openOverviewDetail(log, 'public.audit_logs')"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  class="shrink-0 font-mono text-2xs font-medium"
                >
                  {{ log.action }}
                </Badge>
                <span
                  v-if="log.entity_type"
                  class="truncate font-mono text-2xs text-muted-foreground"
                >
                  {{ log.entity_type }}
                </span>
              </div>
              <div
                class="mt-1 flex items-center gap-2 text-2xs text-muted-foreground"
              >
                <span class="truncate font-mono font-medium text-foreground">
                  {{
                    log.actor_id || $t('page.system_view.audit_actor_system')
                  }}
                </span>
                <span v-if="log.ip_address">&bull;</span>
                <span v-if="log.ip_address" class="font-mono">
                  {{ log.ip_address }}
                </span>
              </div>
            </div>

            <span class="shrink-0 font-mono text-2xs text-muted-foreground">
              {{ formatDate(log.created_at) }}
            </span>
          </div>
        </div>
        <div v-else class="py-6 text-center text-xs text-muted-foreground">
          {{ $t('page.system_view.overview_audit_empty') }}
        </div>
      </div>

      <!-- Recent Workspace Subscriptions -->
      <div
        class="rounded-xl border border-border/60 bg-card p-3.5 shadow-xs sm:p-4"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <CreditCard class="size-4 text-muted-foreground" />
            <h3 class="text-sm font-semibold text-foreground">
              {{ $t('page.system_view.overview_recent_subs') }}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            @click="router.push('/system/subscriptions')"
          >
            <span>{{ $t('page.system_view.overview_view_all') }}</span>
            <ArrowRight class="size-3" />
          </Button>
        </div>

        <div
          v-if="overview.recentSubscriptions.length > 0"
          class="divide-y divide-border/40"
        >
          <div
            v-for="sub in overview.recentSubscriptions"
            :key="sub.id"
            class="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40 first:pt-1.5 last:pb-1.5"
            @click="openOverviewDetail(sub, 'billing.subscriptions')"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span
                  class="truncate text-xs font-medium text-foreground sm:text-sm"
                >
                  {{ sub.tenant_name }}
                </span>
                <Badge
                  variant="outline"
                  class="shrink-0 text-2xs font-medium"
                  :class="getPlanMeta(sub.plan_id).badgeClass"
                >
                  {{ sub.plan_name }}
                </Badge>
              </div>
              <div
                class="mt-1 flex items-center gap-2 font-mono text-2xs text-muted-foreground"
              >
                <span class="truncate">@{{ sub.tenant_slug }}</span>
                <span>&bull;</span>
                <span class="font-semibold text-foreground">
                  ${{ sub.price_monthly_usd
                  }}{{ $t('page.system_view.per_month_suffix') }}
                </span>
              </div>
            </div>

            <Badge
              variant="outline"
              class="shrink-0 text-2xs font-normal"
              :class="getSubscriptionStatusMeta(sub.status).badgeClass"
            >
              <span
                class="mr-1.5 size-1.5 rounded-full"
                :class="getSubscriptionStatusMeta(sub.status).dotClass"
              ></span>
              {{
                getSubscriptionStatusMeta(sub.status).labelKey
                  ? $t(getSubscriptionStatusMeta(sub.status).labelKey)
                  : getSubscriptionStatusMeta(sub.status).fallbackLabel
              }}
            </Badge>
          </div>
        </div>
        <div v-else class="py-6 text-center text-xs text-muted-foreground">
          {{ $t('page.system_view.overview_subs_empty') }}
        </div>
      </div>
    </div>

    <VxeRowDetailSheet
      v-model:open="detailOpen"
      :options="{
        forwardActionSlot: false,
        onSaved: loadOverview,
        resource: detailResource,
      }"
      :row="detailRow"
      @saved="loadOverview"
    />
  </div>
</template>
