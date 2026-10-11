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
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  createTenantApi,
  getActiveTenantId,
  getSystemPluginsApi,
  getTenantsApi,
  setActiveTenantId,
} from '#/api';

defineOptions({ name: 'Workspace' });

const router = useRouter();
const userStore = useUserStore();

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
const newTenantName = ref('');
const newTenantSlug = ref('');
const newTenantPlan = ref('pro');

const activeTenant = computed(() => {
  return (
    tenants.value.find((t) => t.id === activeTenantId.value) ||
    tenants.value[0] ||
    null
  );
});

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
    message.error(error.message || 'Không thể tải danh sách Workspace');
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
  message.success(`Đã chuyển sang Workspace: ${record.name} (${record.slug})`);
}

function handleConnectCli(record?: any) {
  const targetId = record?.id || activeTenantId.value;
  router.push(
    `/auth/desktop?machine_name=Local Workstation&tenant_id=${encodeURIComponent(targetId)}`,
  );
}

function openCreateModal() {
  newTenantName.value = '';
  newTenantSlug.value = '';
  newTenantPlan.value = 'pro';
  isModalVisible.value = true;
}

function handleNameChange() {
  newTenantSlug.value = newTenantName.value
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/[\s_-]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');
}

async function handleCreateTenant() {
  if (!newTenantName.value.trim() || !newTenantSlug.value.trim()) {
    message.warning('Vui lòng nhập tên và mã định danh (slug) của Workspace');
    return;
  }

  creatingTenant.value = true;
  try {
    const created = await createTenantApi({
      name: newTenantName.value.trim(),
      plan: newTenantPlan.value,
      slug: newTenantSlug.value.trim(),
    });
    message.success(`Tạo thành công Workspace: ${created.name}`);
    isModalVisible.value = false;
    await fetchTenants();
    activeTenantId.value = created.id;
    setActiveTenantId(created.id);
  } catch (error: any) {
    message.error(error.message || 'Tạo Workspace thất bại');
  } finally {
    creatingTenant.value = false;
  }
}

// Tenant Table Columns
const tenantColumns = [
  {
    dataIndex: 'name',
    key: 'name',
    title: 'Tên Workspace / Tổ chức',
  },
  {
    dataIndex: 'slug',
    key: 'slug',
    title: 'Mã Slug',
  },
  {
    key: 'plan',
    title: 'Gói Dịch Vụ',
  },
  {
    dataIndex: 'status',
    key: 'status',
    title: 'Trạng Thái',
  },
  {
    dataIndex: 'created_at',
    key: 'created_at',
    title: 'Ngày Khởi Tạo',
  },
  {
    key: 'action',
    title: 'Thao Tác Quản Trị',
  },
];

// Plugins Table Columns
const pluginColumns = [
  {
    dataIndex: 'name',
    key: 'name',
    title: 'Tên Plugin / Dịch Vụ',
  },
  {
    dataIndex: 'id',
    key: 'id',
    title: 'Mã Plugin (ID)',
  },
  {
    dataIndex: 'schema_name',
    key: 'schema_name',
    title: 'Database Schema',
  },
  {
    dataIndex: 'version',
    key: 'version',
    title: 'Phiên Bản',
  },
  {
    key: 'type',
    title: 'Phân Loại',
  },
  {
    dataIndex: 'status',
    key: 'status',
    title: 'Trạng Thái',
  },
];

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN');
  } catch {
    return dateStr;
  }
}

onMounted(() => {
  fetchTenants();
  fetchPlugins();
});
</script>

<template>
  <div class="space-y-6 p-4 sm:p-6">
    <!-- Top Header: KISS & Shadcn Slate Flat Design -->
    <div
      class="flex flex-col justify-between gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:flex-row sm:items-center"
    >
      <div>
        <div class="flex items-center gap-2.5">
          <h1
            class="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            Quản Trị Multi-Tenant
          </h1>
          <Tag color="blue" class="font-mono text-xs uppercase">
            System Console
          </Tag>
        </div>
        <p class="mt-1 text-sm text-muted-foreground">
          Quản lý các Tổ chức / Workspace, Ghép nối Specter CLI Daemon và Hệ
          sinh thái Cloud Plugin
        </p>
      </div>

      <!-- Action Buttons: Mobile-First Responsive Stack -->
      <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <Button
          type="primary"
          class="inline-flex items-center justify-center w-full sm:w-auto font-medium"
          @click="openCreateModal"
        >
          <template #icon>
            <Plus class="size-3.5 mr-1" />
          </template>
          Tạo Workspace Mới
        </Button>
        <Button
          class="inline-flex items-center justify-center w-full sm:w-auto"
          @click="handleConnectCli()"
        >
          <template #icon>
            <Terminal class="size-3.5 mr-1" />
          </template>
          Ghép Nối Máy Trạm CLI
        </Button>
        <Button
          :loading="loadingTenants"
          class="inline-flex items-center justify-center w-full sm:w-auto"
          @click="fetchTenants"
        >
          <template #icon>
            <RefreshCw class="size-3.5 mr-1" />
          </template>
          Làm Mới
        </Button>
      </div>
    </div>

    <!-- 4 Platform Metric Cards: Mobile-First Grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Metric 1: Workspaces -->
      <div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            Tổng số Workspaces
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400"
          >
            <Building2 class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold tracking-tight text-foreground">
            {{ tenants.length }}
          </span>
          <span class="text-xs font-semibold text-sky-400">Tenants</span>
        </div>
        <div class="mt-2 text-xs text-muted-foreground">
          Đang chọn:
          <span class="font-semibold text-foreground">
            {{ activeTenant?.name || 'Nguyen Dinh Tu' }}
          </span>
        </div>
      </div>

      <!-- Metric 2: Plugins -->
      <div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            Plugin Hệ Thống Cloud
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"
          >
            <Layers class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-extrabold tracking-tight text-foreground">
            {{ plugins.length }}
          </span>
          <span class="text-xs font-semibold text-emerald-400">/ 6 Sẵn sàng</span>
        </div>
        <div class="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle2 class="size-3.5" />
          <span>Core Kernel & Storage Sẵn Sàng</span>
        </div>
      </div>

      <!-- Metric 3: Fleet Bridge -->
      <div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            Specter Fleet Bridge
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400"
          >
            <Terminal class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-bold tracking-tight text-foreground">
            Sẵn Sàng
          </span>
          <span class="inline-flex items-center gap-1 text-xs text-emerald-400">
            <span
              class="size-2 rounded-full bg-emerald-400 animate-pulse"
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
      <div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">
            Quản Trị Viên Hệ Thống
          </span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400"
          >
            <ShieldCheck class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2 truncate">
          <span
            class="text-xl font-bold tracking-tight text-foreground truncate"
          >
            {{ userStore.userInfo?.realName || 'Nguyen Dinh Tu' }}
          </span>
        </div>
        <div class="mt-2 text-xs text-sky-400">Quyền: Super Administrator</div>
      </div>
    </div>

    <!-- Main Content Container: Shadcn Slate Tabs -->
    <div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <Tabs default-active-key="tenants">
        <!-- Tab 1: Tenants List -->
        <Tabs.TabPane key="tenants" tab="Danh sách Workspace (Tenants)">
          <!-- Desktop Table View: Hidden on Mobile -->
          <div class="hidden md:block">
            <Table
              :columns="tenantColumns"
              :data-source="tenants"
              :loading="loadingTenants"
              row-key="id"
              :pagination="{ pageSize: 10 }"
            >
              <!-- Name column -->
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'name'">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-foreground">
                      {{ record.name }}
                    </span>
                    <Badge
                      v-if="record.id === activeTenantId"
                      status="processing"
                      text="Đang chọn"
                    />
                  </div>
                </template>

                <!-- Slug column -->
                <template v-else-if="column.key === 'slug'">
                  <Tag class="font-mono text-xs">{{ record.slug }}</Tag>
                </template>

                <!-- Plan column -->
                <template v-else-if="column.key === 'plan'">
                  <Tag
                    :color="
                      record.metadata?.plan === 'pro'
                        ? 'geekblue'
                        : record.metadata?.plan === 'enterprise'
                          ? 'purple'
                          : 'default'
                    "
                    class="uppercase"
                  >
                    {{ record.metadata?.plan || 'Standard' }}
                  </Tag>
                </template>

                <!-- Status column -->
                <template v-else-if="column.key === 'status'">
                  <Tag
                    :color="record.status === 'active' ? 'success' : 'warning'"
                    class="uppercase"
                  >
                    {{ record.status }}
                  </Tag>
                </template>

                <!-- Created at column -->
                <template v-else-if="column.key === 'created_at'">
                  <span class="text-xs text-muted-foreground">
                    {{ formatDate(record.created_at) }}
                  </span>
                </template>

                <!-- Actions column -->
                <template v-else-if="column.key === 'action'">
                  <Space size="small">
                    <Button
                      size="small"
                      :type="
                        record.id === activeTenantId ? 'dashed' : 'primary'
                      "
                      @click="handleSelectTenant(record)"
                    >
                      {{
                        record.id === activeTenantId
                          ? 'Đang hoạt động'
                          : 'Chọn Workspace này'
                      }}
                    </Button>
                    <Button
                      size="small"
                      @click="router.push(`/dashboard/workspace/${record.id}`)"
                    >
                      Chi Tiết
                    </Button>
                    <Button size="small" @click="handleConnectCli(record)">
                      Ghép nối CLI
                    </Button>
                  </Space>
                </template>
              </template>
            </Table>
          </div>

          <!-- Mobile Card View: Exclusively Optimized for Mobile Screens -->
          <div class="block space-y-3 md:hidden">
            <div
              v-for="tenant in tenants"
              :key="tenant.id"
              class="rounded-lg border p-4 transition-all"
              :class="
                tenant.id === activeTenantId
                  ? 'border-sky-500 bg-sky-500/5'
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
                  status="processing"
                  text="Active"
                />
              </div>

              <div class="mt-3 flex flex-wrap items-center gap-2">
                <Tag
                  :color="
                    tenant.metadata?.plan === 'pro'
                      ? 'geekblue'
                      : tenant.metadata?.plan === 'enterprise'
                        ? 'purple'
                        : 'default'
                  "
                  class="uppercase text-xs"
                >
                  {{ tenant.metadata?.plan || 'Standard' }}
                </Tag>
                <Tag
                  :color="tenant.status === 'active' ? 'success' : 'warning'"
                  class="uppercase text-xs"
                >
                  {{ tenant.status }}
                </Tag>
                <span class="text-xs text-muted-foreground ml-auto">
                  {{ formatDate(tenant.created_at) }}
                </span>
              </div>

              <!-- Action buttons on mobile: Tap targets -->
              <div
                class="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border/40"
              >
                <Button
                  size="middle"
                  class="flex-1"
                  :type="tenant.id === activeTenantId ? 'dashed' : 'primary'"
                  @click="handleSelectTenant(tenant)"
                >
                  {{
                    tenant.id === activeTenantId
                      ? 'Đang chọn'
                      : 'Chọn Workspace'
                  }}
                </Button>
                <Button
                  size="middle"
                  @click="router.push(`/dashboard/workspace/${tenant.id}`)"
                >
                  Chi Tiết
                </Button>
                <Button size="middle" @click="handleConnectCli(tenant)">
                  Ghép Nối CLI
                </Button>
              </div>
            </div>

            <div
              v-if="tenants.length === 0 && !loadingTenants"
              class="py-8 text-center text-sm text-muted-foreground"
            >
              Chưa có Workspace nào. Hãy nhấn "+ Tạo Workspace Mới".
            </div>
          </div>
        </Tabs.TabPane>

        <!-- Tab 2: System Plugins -->
        <Tabs.TabPane key="plugins" tab="Hệ sinh thái Plugin Cloud">
          <!-- Desktop Table -->
          <div class="hidden md:block">
            <Table
              :columns="pluginColumns"
              :data-source="plugins"
              :loading="loadingPlugins"
              row-key="id"
              :pagination="false"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'name'">
                  <div>
                    <div class="font-medium text-foreground">
                      {{ record.name }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ record.description }}
                    </div>
                  </div>
                </template>

                <template v-else-if="column.key === 'id'">
                  <Tag class="font-mono text-xs">{{ record.id }}</Tag>
                </template>

                <template v-else-if="column.key === 'schema_name'">
                  <Tag color="cyan" class="font-mono text-xs">
                    {{ record.schema_name }}
                  </Tag>
                </template>

                <template v-else-if="column.key === 'type'">
                  <Tag :color="record.is_system ? 'blue' : 'purple'">
                    {{ record.is_system ? 'Core Kernel' : 'Module Service' }}
                  </Tag>
                </template>

                <template v-else-if="column.key === 'status'">
                  <Tag color="success" class="uppercase">
                    {{ record.status }}
                  </Tag>
                </template>
              </template>
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
                <Tag color="success" class="uppercase text-xs">
                  {{ plugin.status }}
                </Tag>
              </div>

              <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <Tag class="font-mono">{{ plugin.id }}</Tag>
                <Tag color="cyan" class="font-mono">
                  schema: {{ plugin.schema_name }}
                </Tag>
                <Tag :color="plugin.is_system ? 'blue' : 'purple'">
                  {{ plugin.is_system ? 'Core Kernel' : 'Module' }}
                </Tag>
                <span class="text-muted-foreground ml-auto">v{{ plugin.version }}</span>
              </div>
            </div>
          </div>
        </Tabs.TabPane>

        <!-- Tab 3: Specter Runners & Desktop Guide -->
        <Tabs.TabPane key="runners" tab="Máy trạm Specter CLI & Runners">
          <div class="max-w-2xl py-2">
            <h2 class="text-lg font-semibold text-foreground">
              Hướng Dẫn Ghép Nối Máy Trạm Specter CLI
            </h2>
            <p class="mt-1 text-sm text-muted-foreground">
              Specter CLI Daemon (`tuquet/cli`) kết nối máy trạm cục bộ với
              Tuquet Cloud thông qua Desktop SSO loopback.
            </p>

            <div
              class="my-4 overflow-x-auto rounded-lg bg-slate-950 p-4 font-mono text-xs sm:text-sm text-emerald-400 border border-slate-800"
            >
              # Bước 1: Mở terminal trên máy trạm của bạn<br />
              tuquet login<br /><br />
              # Trình duyệt sẽ mở cổng Desktop Bridge:<br />
              https://admin.tuquet.com/auth/desktop
            </div>

            <Button
              type="primary"
              size="large"
              class="w-full sm:w-auto"
              @click="handleConnectCli()"
            >
              Mở Màn Hình Ghép Nối Desktop SSO Ngay
            </Button>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>

    <!-- Create Tenant Modal: Touch Friendly on Mobile -->
    <Modal
      v-model:open="isModalVisible"
      title="Tạo Workspace / Tổ chức Mới"
      :confirm-loading="creatingTenant"
      ok-text="Tạo Workspace"
      cancel-text="Hủy"
      class="max-w-[calc(100vw-2rem)] sm:max-w-lg"
      @ok="handleCreateTenant"
    >
      <Form layout="vertical" class="mt-4">
        <Form.Item label="Tên Workspace / Tổ chức" required>
          <Input
            v-model:value="newTenantName"
            size="large"
            placeholder="Ví dụ: Công ty Công nghệ Tuquet"
            @input="handleNameChange"
          />
        </Form.Item>

        <Form.Item
          label="Mã định danh (Slug)"
          required
          extra="Slug được dùng làm subdomain hoặc định danh duy nhất (chỉ gồm chữ thường, số và dấu gạch ngang)"
        >
          <Input
            v-model:value="newTenantSlug"
            size="large"
            placeholder="Ví dụ: tuquet-tech"
          />
        </Form.Item>

        <Form.Item label="Gói dịch vụ (Subscription Tier)">
          <Select v-model:value="newTenantPlan" size="large">
            <Select.Option value="pro">Pro Plan (Mặc định)</Select.Option>
            <Select.Option value="free">Free Tier</Select.Option>
            <Select.Option value="enterprise">Enterprise Custom</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
