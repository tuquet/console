<script lang="ts" setup>
import type { SystemPluginItem, TenantItem } from '#/api';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore } from '@vben/stores';

import {
  Building2,
  CheckCircle2,
  Layers,
  Plus,
  RefreshCw,
  ShieldCheck,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@tuquet/vue-ui';

import {
  createTenantApi,
  getActiveTenantId,
  getSystemPluginsApi,
  getTenantsApi,
  setActiveTenantId,
} from '#/api';
import { useDateFormat } from '#/composables';

import CreateWorkspaceModal from './components/modals/create-workspace-modal.vue';

defineOptions({ name: 'Workspace' });

const router = useRouter();
const userStore = useUserStore();
const { formatDate } = useDateFormat();

// Loading states
const loadingTenants = ref(false);
const loadingPlugins = ref(false);
const creatingTenant = ref(false);

// Data
const tenants = ref<TenantItem[]>([]);
const plugins = ref<SystemPluginItem[]>([]);
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
    toast.error(error.message || 'Không thể tải danh sách Workspace');
  } finally {
    loadingTenants.value = false;
  }
}

// Load plugins registry from Supabase
async function fetchPlugins() {
  loadingPlugins.value = true;
  try {
    plugins.value = await getSystemPluginsApi();
  } catch (error: any) {
    console.error('Failed to load plugins:', error);
  } finally {
    loadingPlugins.value = false;
  }
}

function handleSelectTenant(record: any) {
  activeTenantId.value = record.id;
  setActiveTenantId(record.id);
  toast.success(`Đã chuyển sang Workspace: ${record.name}`);
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
    toast.success(`Tạo thành công Workspace: ${created.name}`);
    isModalVisible.value = false;
    await fetchTenants();
    activeTenantId.value = created.id;
    setActiveTenantId(created.id);
  } catch (error: any) {
    toast.error(error.message || 'Tạo Workspace thất bại');
  } finally {
    creatingTenant.value = false;
  }
}

onMounted(() => {
  fetchTenants();
  fetchPlugins();
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
          Quản Trị Workspace
        </h1>
        <Badge variant="outline" class="font-mono text-xs uppercase">
          Multi-Tenant
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
          <span>Tạo Workspace</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 font-medium"
          @click="handleConnectCli()"
        >
          <Terminal class="size-3.5" />
          <span>Ghép Nối Specter Desk</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          :disabled="loadingTenants"
          class="size-8 shrink-0"
          title="Làm mới"
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
            Tổng Workspace
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
          <span class="text-xs font-medium text-muted-foreground">Tenants</span>
        </div>
        <div class="mt-2 text-xs text-muted-foreground truncate">
          Đang chọn:
          <span class="font-semibold text-foreground">
            {{ activeTenant?.name || 'Chưa chọn' }}
          </span>
        </div>
      </div>

      <!-- Metric 2: Plugins -->
      <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            Plugin Hệ Thống
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Layers class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold tracking-tight text-foreground">
            {{ plugins.length }}
          </span>
          <span class="text-xs font-semibold text-muted-foreground"
            >Sẵn sàng</span
          >
        </div>
        <div
          class="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <CheckCircle2 class="size-3.5 text-emerald-500" />
          <span>Core Kernel & Storage Hoạt Động</span>
        </div>
      </div>

      <!-- Metric 3: Fleet Bridge -->
      <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            Specter Fleet Bridge
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
          >
            <Terminal class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-bold tracking-tight text-foreground">
            Sẵn Sàng
          </span>
          <span
            class="inline-flex items-center gap-1.5 text-xs text-foreground"
          >
            <span
              class="size-2 rounded-full bg-emerald-500 animate-pulse"
            ></span>
            Online
          </span>
        </div>
        <div class="mt-2 font-mono text-xs text-muted-foreground">
          Cổng SSO Loopback:
          <span class="text-foreground font-semibold">:8765</span>
        </div>
      </div>

      <!-- Metric 4: Admin Info -->
      <div class="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            Quản Trị Viên
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
              'Quản trị viên'
            }}
          </span>
        </div>
        <div class="mt-2 text-xs text-muted-foreground">
          Quyền: Super Administrator
        </div>
      </div>
    </div>

    <!-- Main Content Container: Tabs -->
    <div
      class="rounded-xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm"
    >
      <Tabs default-value="tenants" class="w-full">
        <TabsList class="mb-4">
          <TabsTrigger value="tenants" class="flex items-center gap-1.5">
            <Building2 class="size-4 shrink-0" />
            <span>Danh Sách Workspace</span>
          </TabsTrigger>
          <TabsTrigger value="plugins" class="flex items-center gap-1.5">
            <Layers class="size-4 shrink-0" />
            <span>Plugin Cloud</span>
          </TabsTrigger>
          <TabsTrigger value="runners" class="flex items-center gap-1.5">
            <Terminal class="size-4 shrink-0" />
            <span>Kết Nối Specter Desk</span>
          </TabsTrigger>
        </TabsList>

        <!-- Tab 1: Tenants List -->
        <TabsContent value="tenants">
          <!-- Desktop Table View -->
          <div
            class="hidden md:block overflow-x-auto rounded-lg border border-border/60"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên Workspace</TableHead>
                  <TableHead>Định Danh Slug</TableHead>
                  <TableHead>Gói Dịch Vụ</TableHead>
                  <TableHead>Trạng Thái</TableHead>
                  <TableHead>Ngày Tạo</TableHead>
                  <TableHead class="text-right">Thao Tác</TableHead>
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
                        Đang chọn
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
                      class="font-mono text-xs uppercase"
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
                            ? 'bg-emerald-500'
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
                            ? 'Đang hoạt động'
                            : 'Kích Hoạt'
                        }}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        class="h-7 text-xs"
                        @click="
                          router.push(`/dashboard/workspace/${record.id}`)
                        "
                      >
                        Chi Tiết
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        class="h-7 text-xs"
                        @click="handleConnectCli(record)"
                      >
                        Ghép Nối Desk
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                <TableRow v-if="tenants.length === 0 && !loadingTenants">
                  <TableCell
                    colspan="6"
                    class="h-24 text-center text-sm text-muted-foreground"
                  >
                    Chưa có Workspace nào. Nhấn "+ Tạo Workspace" để bắt đầu.
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
                    {{ tenant.slug }}
                  </div>
                </div>
                <Badge
                  v-if="tenant.id === activeTenantId"
                  variant="secondary"
                  class="text-xs font-normal"
                >
                  <span
                    class="mr-1.5 size-1.5 rounded-full bg-emerald-500"
                  ></span>
                  Active
                </Badge>
              </div>

              <div class="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" class="font-mono text-xs uppercase">
                  {{ getPlanInfo(tenant.metadata?.plan).label }}
                </Badge>
                <Badge variant="outline" class="text-xs font-normal capitalize">
                  <span
                    class="mr-1.5 size-1.5 rounded-full"
                    :class="
                      tenant.status === 'active'
                        ? 'bg-emerald-500'
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
                  {{ tenant.id === activeTenantId ? 'Đang chọn' : 'Kích Hoạt' }}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="h-8 text-xs"
                  @click="router.push(`/dashboard/workspace/${tenant.id}`)"
                >
                  Chi Tiết
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="h-8 text-xs"
                  @click="handleConnectCli(tenant)"
                >
                  Ghép Nối Desk
                </Button>
              </div>
            </div>

            <div
              v-if="tenants.length === 0 && !loadingTenants"
              class="py-8 text-center text-sm text-muted-foreground"
            >
              Chưa có Workspace nào. Nhấn "+ Tạo Workspace" để bắt đầu.
            </div>
          </div>
        </TabsContent>

        <!-- Tab 2: System Plugins -->
        <TabsContent value="plugins">
          <!-- Desktop Table -->
          <div
            class="hidden md:block overflow-x-auto rounded-lg border border-border/60"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên Plugin</TableHead>
                  <TableHead>Mã Plugin</TableHead>
                  <TableHead>Database Schema</TableHead>
                  <TableHead>Phiên Bản</TableHead>
                  <TableHead>Phân Loại</TableHead>
                  <TableHead class="text-right">Trạng Thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="record in plugins" :key="record.id">
                  <TableCell>
                    <div>
                      <div class="font-medium text-foreground">
                        {{ record.name }}
                      </div>
                      <div class="text-xs text-muted-foreground">
                        {{ record.description }}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <code
                      class="rounded bg-muted/60 px-2 py-0.5 font-mono text-xs text-foreground"
                    >
                      {{ record.id }}
                    </code>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      class="font-mono text-xs border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                    >
                      {{ record.schema_name }}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <span class="font-mono text-xs text-muted-foreground"
                      >v{{ record.version }}</span
                    >
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary" class="text-xs font-normal">
                      {{ record.is_system ? 'Core Kernel' : 'Module Service' }}
                    </Badge>
                  </TableCell>

                  <TableCell class="text-right">
                    <Badge
                      variant="outline"
                      class="text-xs capitalize font-normal"
                    >
                      <span
                        class="mr-1.5 size-1.5 rounded-full bg-emerald-500"
                      ></span>
                      {{ record.status }}
                    </Badge>
                  </TableCell>
                </TableRow>

                <TableRow v-if="plugins.length === 0 && !loadingPlugins">
                  <TableCell
                    colspan="6"
                    class="h-24 text-center text-sm text-muted-foreground"
                  >
                    Không có plugin nào trong hệ thống.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Mobile Cards for Plugins -->
          <div class="block space-y-3 md:hidden">
            <div
              v-for="plugin in plugins"
              :key="plugin.id"
              class="rounded-lg border border-border/60 bg-card/60 p-4"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="font-semibold text-foreground">
                    {{ plugin.name }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {{ plugin.description || 'Hệ thống plugin cốt lõi Tuquet' }}
                  </div>
                </div>
                <Badge variant="outline" class="text-xs capitalize font-normal">
                  <span
                    class="mr-1.5 size-1.5 rounded-full bg-emerald-500"
                  ></span>
                  {{ plugin.status }}
                </Badge>
              </div>

              <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <code
                  class="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-xs"
                  >{{ plugin.id }}</code
                >
                <Badge variant="secondary" class="font-mono text-xs">
                  schema: {{ plugin.schema_name }}
                </Badge>
                <Badge variant="secondary" class="text-xs font-normal">
                  {{ plugin.is_system ? 'Core Kernel' : 'Module' }}
                </Badge>
                <span class="text-muted-foreground ml-auto font-mono"
                  >v{{ plugin.version }}</span
                >
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- Tab 3: Specter Runners & Desktop Guide -->
        <TabsContent value="runners">
          <div class="max-w-2xl py-2">
            <h2 class="text-lg font-semibold text-foreground">
              Ghép Nối Máy Trạm Specter Desk
            </h2>
            <p class="mt-1 text-sm text-muted-foreground">
              Specter CLI Daemon kết nối máy trạm cục bộ với Tuquet Cloud thông
              qua Desktop SSO loopback.
            </p>

            <div
              class="my-4 overflow-x-auto rounded-lg bg-muted/50 p-4 font-mono text-xs sm:text-sm text-foreground border border-border"
            >
              <span class="text-muted-foreground"
                ># Bước 1: Mở terminal trên máy trạm của bạn</span
              ><br />
              <span class="font-semibold">tuquet login</span><br /><br />
              <span class="text-muted-foreground"
                ># Trình duyệt sẽ mở cổng Desktop Bridge:</span
              ><br />
              <span class="text-primary font-semibold"
                >https://admin.tuquet.com/auth/desktop</span
              >
            </div>

            <Button class="w-full sm:w-auto" @click="handleConnectCli()">
              Mở Màn Hình Ghép Nối
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>

    <!-- Create Workspace Modal -->
    <CreateWorkspaceModal
      v-model:open="isModalVisible"
      :loading="creatingTenant"
      @submit="handleCreateTenant"
    />
  </div>
</template>
