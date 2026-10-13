<script lang="ts" setup>
import type { TenantItem } from '#/api';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore } from '@vben/stores';

import {
  Building2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
} from '@lucide/vue';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@tuquet/vue-ui';

import {
  createTenantApi,
  getActiveTenantId,
  getTenantsApi,
  setActiveTenantId,
} from '#/api';
import { useDateFormat } from '#/composables';
import { $t } from '#/locales';

import CreateWorkspaceModal from './components/modals/create-workspace-modal.vue';

defineOptions({ name: 'Workspace' });

const router = useRouter();
const userStore = useUserStore();
const { formatDate } = useDateFormat();

// Loading states
const loadingTenants = ref(false);
const creatingTenant = ref(false);

// Data
const tenants = ref<TenantItem[]>([]);
const activeTenantId = ref(getActiveTenantId());

// Modal state
const isModalVisible = ref(false);

const activeTenant = computed(() => {
  return (
    tenants.value.find((t) => t.id === activeTenantId.value) ||
    tenants.value[0] ||
    null
  );
});

// Plan mapping config
const PLAN_MAP: Record<string, { color: string; label: string }> = {
  enterprise: { color: 'purple', label: 'Enterprise' },
  free: { color: 'default', label: 'Free' },
  pro: { color: 'geekblue', label: 'Pro' },
};

function getPlanInfo(plan?: string) {
  const key = plan?.toLowerCase() || 'pro';
  return PLAN_MAP[key] || { color: 'default', label: plan || 'Standard' };
}

// Load all tenants from Supabase
async function fetchTenants() {
  loadingTenants.value = true;
  try {
    const list = await getTenantsApi();
    tenants.value = list;
    if (list.length > 0 && !activeTenantId.value) {
      activeTenantId.value = list[0]?.id || '';
      setActiveTenantId(activeTenantId.value);
    }
  } catch (error: any) {
    toast.error(error.message || $t('page.workspace.fetch_failed'));
  } finally {
    loadingTenants.value = false;
  }
}

function handleSelectTenant(record: any) {
  activeTenantId.value = record.id;
  setActiveTenantId(record.id);
  toast.success($t('page.workspace.switched_to', { name: record.name }));
}

function handleConnectCli(record?: any) {
  const targetId = record?.id || activeTenantId.value;
  router.push(
    `/auth/desktop?machine_name=Local Workstation&tenant_id=${encodeURIComponent(targetId)}`,
  );
}

function openCreateModal() {
  isModalVisible.value = true;
}

async function handleCreateTenant(payload: {
  name: string;
  plan: string;
  slug: string;
}) {
  creatingTenant.value = true;
  try {
    const created = await createTenantApi({
      name: payload.name,
      plan: payload.plan,
      slug: payload.slug,
    });
    toast.success($t('page.workspace.create_success', { name: created.name }));
    isModalVisible.value = false;
    await fetchTenants();
    activeTenantId.value = created.id;
    setActiveTenantId(created.id);
  } catch (error: any) {
    toast.error(error.message || $t('page.workspace.create_failed'));
  } finally {
    creatingTenant.value = false;
  }
}

onMounted(() => {
  fetchTenants();
});
</script>

<template>
  <div class="space-y-4 p-4 sm:space-y-5 sm:p-5">
    <!-- Top Header: Streamlined, Flat & Compact -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-2.5">
        <h1
          class="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {{ $t('page.workspace.title') }}
        </h1>
        <Badge variant="outline" class="text-xs uppercase font-medium">
          {{ $t('page.workspace.badge') }}
        </Badge>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          class="h-8 gap-1.5 font-medium"
          @click="openCreateModal"
        >
          <Plus class="size-3.5" />
          <span>{{ $t('page.workspace.create_btn') }}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 font-medium"
          @click="handleConnectCli()"
        >
          <Terminal class="size-3.5" />
          <span>{{ $t('page.workspace.connect_btn') }}</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          :disabled="loadingTenants"
          class="size-8 shrink-0"
          :title="$t('page.workspace.refresh')"
          @click="fetchTenants"
        >
          <RefreshCw
            class="size-3.5"
            :class="{ 'animate-spin': loadingTenants }"
          />
        </Button>
      </div>
    </div>

    <!-- 4 Platform Metric Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Metric 1: Workspaces -->
      <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            {{ $t('page.workspace.total_workspaces') }}
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Building2 class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold tracking-tight text-foreground">
            {{ tenants.length }}
          </span>
          <span class="text-xs font-medium text-muted-foreground">
            {{ $t('page.workspace.tenants_label') }}
          </span>
        </div>
        <div class="mt-2 text-xs text-muted-foreground truncate">
          {{ $t('page.workspace.selected') }}:
          <span class="font-semibold text-foreground">
            {{ activeTenant?.name || $t('page.workspace.not_selected') }}
          </span>
        </div>
      </div>

      <!-- Metric 2: Active Workspace -->
      <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            {{ $t('page.workspace.current_workspace') }}
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Building2 class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2 truncate">
          <span
            class="text-xl font-bold tracking-tight text-foreground truncate"
          >
            {{ activeTenant?.name || $t('page.workspace.not_selected') }}
          </span>
        </div>
        <div class="mt-2 text-xs text-muted-foreground truncate font-mono">
          slug: {{ activeTenant?.slug || 'none' }}
        </div>
      </div>

      <!-- Metric 3: Service Plan -->
      <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            {{ $t('page.workspace.service_plan') }}
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Sparkles class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span
            class="text-2xl font-bold tracking-tight text-foreground uppercase"
          >
            {{ getPlanInfo(activeTenant?.metadata?.plan).label }}
          </span>
          <Badge variant="secondary" class="text-xs font-normal capitalize">
            <span
              class="mr-1.5 size-1.5 rounded-full"
              :class="
                activeTenant?.status === 'active'
                  ? 'bg-success'
                  : 'bg-muted-foreground'
              "
            ></span>
            {{ activeTenant?.status || 'Active' }}
          </Badge>
        </div>
        <div class="mt-2 text-xs text-muted-foreground">
          {{ $t('page.workspace.certified_by_cloud') }}
        </div>
      </div>

      <!-- Metric 4: Admin Info -->
      <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            {{ $t('page.workspace.administrator') }}
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <ShieldCheck class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2 truncate">
          <span
            class="text-xl font-bold tracking-tight text-foreground truncate"
          >
            {{
              userStore.userInfo?.realName ||
              userStore.userInfo?.username ||
              'Admin'
            }}
          </span>
        </div>
        <div class="mt-2 text-xs text-muted-foreground">
          {{ $t('page.workspace.role_superadmin') }}
        </div>
      </div>
    </div>

    <!-- Main Content Container: Tenants Workspace List -->
    <div
      class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm"
    >
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Building2 class="size-4.5 text-foreground" />
          <h2 class="text-base font-semibold text-foreground">
            {{ $t('page.workspace.list_title') }}
          </h2>
        </div>
        <span class="text-xs text-muted-foreground">
          {{ $t('page.workspace.available_count', [tenants.length]) }}
        </span>
      </div>

      <!-- Desktop Table View -->
      <div
        class="hidden md:block overflow-x-auto rounded-lg border border-border/60"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ $t('page.workspace.col_name') }}</TableHead>
              <TableHead>{{ $t('page.workspace.col_slug') }}</TableHead>
              <TableHead>{{ $t('page.workspace.col_plan') }}</TableHead>
              <TableHead>{{ $t('page.workspace.col_status') }}</TableHead>
              <TableHead>{{ $t('page.workspace.col_created_at') }}</TableHead>
              <TableHead class="text-right">{{ $t('page.workspace.col_actions') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="record in tenants" :key="record.id">
              <TableCell>
                <div class="flex items-center gap-2">
                  <span class="font-medium text-foreground">
                    {{ record.name }}
                  </span>
                  <Badge
                    v-if="record.id === activeTenantId"
                    variant="secondary"
                    class="text-xs font-normal"
                  >
                    {{ $t('page.workspace.action_selected') }}
                  </Badge>
                </div>
              </TableCell>

              <TableCell>
                <code
                  class="rounded bg-muted/60 px-2 py-0.5 font-mono text-xs text-foreground"
                >
                  {{ record.slug }}
                </code>
              </TableCell>

              <TableCell>
                <Badge
                  variant="outline"
                  class="text-xs uppercase font-medium"
                >
                  {{ getPlanInfo(record.metadata?.plan).label }}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge
                  variant="outline"
                  class="text-xs capitalize font-normal"
                >
                  <span
                    class="mr-1.5 size-1.5 rounded-full"
                    :class="
                      record.status === 'active'
                        ? 'bg-success'
                        : 'bg-muted-foreground'
                    "
                  ></span>
                  {{ record.status }}
                </Badge>
              </TableCell>

              <TableCell>
                <span class="text-xs text-muted-foreground">
                  {{ formatDate(record.created_at) }}
                </span>
              </TableCell>

              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    :variant="
                      record.id === activeTenantId ? 'secondary' : 'default'
                    "
                    class="h-7 text-xs"
                    @click="handleSelectTenant(record)"
                  >
                    {{
                      record.id === activeTenantId
                        ? $t('page.workspace.action_active')
                        : $t('page.workspace.action_activate')
                    }}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-7 text-xs"
                    @click="router.push(`/tenants/${record.id}`)"
                  >
                    {{ $t('page.workspace.action_detail') }}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-7 text-xs"
                    @click="handleConnectCli(record)"
                  >
                    {{ $t('page.workspace.action_connect') }}
                  </Button>
                </div>
              </TableCell>
            </TableRow>

            <TableRow v-if="tenants.length === 0 && !loadingTenants">
              <TableCell
                colspan="6"
                class="h-24 text-center text-sm text-muted-foreground"
              >
                {{ $t('page.workspace.empty_title') }}. {{ $t('page.workspace.empty_prompt') }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Mobile Card View -->
      <div class="block space-y-3 md:hidden">
        <div
          v-for="tenant in tenants"
          :key="tenant.id"
          class="rounded-lg border p-4 transition-all"
          :class="
            tenant.id === activeTenantId
              ? 'border-primary/70 bg-accent/30'
              : 'border-border/60 bg-card/60'
          "
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="font-semibold text-foreground">
                {{ tenant.name }}
              </div>
              <div class="mt-0.5 font-mono text-xs text-muted-foreground">
                slug: {{ tenant.slug }}
              </div>
            </div>
            <Badge
              v-if="tenant.id === activeTenantId"
              variant="default"
              class="text-xs"
            >
              {{ $t('page.workspace.action_selected') }}
            </Badge>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" class="text-xs uppercase font-medium">
              {{ getPlanInfo(tenant.metadata?.plan).label }}
            </Badge>
            <Badge variant="outline" class="text-xs font-normal capitalize">
              <span
                class="mr-1.5 size-1.5 rounded-full"
                :class="
                  tenant.status === 'active'
                    ? 'bg-success'
                    : 'bg-muted-foreground'
                "
              ></span>
              {{ tenant.status }}
            </Badge>
            <span class="text-xs text-muted-foreground ml-auto">
              {{ formatDate(tenant.created_at) }}
            </span>
          </div>

          <div
            class="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border/40"
          >
            <Button
              size="sm"
              class="flex-1 h-8 text-xs"
              :variant="
                tenant.id === activeTenantId ? 'secondary' : 'default'
              "
              @click="handleSelectTenant(tenant)"
            >
              {{ tenant.id === activeTenantId ? $t('page.workspace.action_active') : $t('page.workspace.action_activate') }}
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="h-8 text-xs"
              @click="router.push(`/tenants/${tenant.id}`)"
            >
              {{ $t('page.workspace.action_detail') }}
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="h-8 text-xs"
              @click="handleConnectCli(tenant)"
            >
              {{ $t('page.workspace.action_connect') }}
            </Button>
          </div>
        </div>

        <div
          v-if="tenants.length === 0 && !loadingTenants"
          class="py-8 text-center text-sm text-muted-foreground"
        >
          {{ $t('page.workspace.empty_title') }}. {{ $t('page.workspace.empty_prompt') }}
        </div>
      </div>
    </div>

    <!-- Create Workspace Modal -->
    <CreateWorkspaceModal
      v-model:open="isModalVisible"
      :loading="creatingTenant"
      @submit="handleCreateTenant"
    />
  </div>
</template>
