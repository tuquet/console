<script lang="ts" setup>
import type { SystemPluginItem, TenantItem } from '#/api';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore } from '@vben/stores';

import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
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
    title: 'Tên Workspace / Tổ chức',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Mã Slug',
    dataIndex: 'slug',
    key: 'slug',
  },
  {
    title: 'Gói Dịch Vụ',
    key: 'plan',
  },
  {
    title: 'Trạng Thái',
    dataIndex: 'status',
    key: 'status',
  },
  {
    title: 'Ngày Khởi Tạo',
    dataIndex: 'created_at',
    key: 'created_at',
  },
  {
    title: 'Thao Tác Quản Trị',
    key: 'action',
  },
];

// Plugins Table Columns
const pluginColumns = [
  {
    title: 'Tên Plugin / Dịch Vụ',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Mã Plugin (ID)',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: 'Database Schema',
    dataIndex: 'schema_name',
    key: 'schema_name',
  },
  {
    title: 'Phiên Bản',
    dataIndex: 'version',
    key: 'version',
  },
  {
    title: 'Phân Loại',
    key: 'type',
  },
  {
    title: 'Trạng Thái',
    dataIndex: 'status',
    key: 'status',
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
  <div class="p-6">
    <!-- Header Banner -->
    <div
      class="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:flex-row md:items-center"
    >
      <div>
        <div class="flex items-center gap-3">
          <Typography.Title :level="3" class="!mb-0">
            Trung tâm Quản trị Multi-Tenant
          </Typography.Title>
          <Tag color="blue" class="text-xs font-semibold uppercase">
            System Admin Console
          </Tag>
        </div>
        <Typography.Paragraph type="secondary" class="!mb-0 mt-1">
          Quản trị toàn diện các Tổ chức / Workspace, Máy trạm Specter CLI và Hệ
          sinh thái Plugin trên Tuquet Cloud
        </Typography.Paragraph>
      </div>

      <Space wrap>
        <Button type="primary" @click="openCreateModal">
          + Tạo Workspace Mới
        </Button>
        <Button @click="handleConnectCli()"> Ghép Nối Máy Trạm CLI </Button>
        <Button :loading="loadingTenants" @click="fetchTenants">
          Làm Mới
        </Button>
      </Space>
    </div>

    <!-- 4 Platform Metric Cards -->
    <Row :gutter="[16, 16]" class="mb-6">
      <Col :xs="24" :sm="12" :lg="6">
        <Card :bordered="false" class="shadow-sm">
          <Statistic
            title="Tổng số Workspaces"
            :value="tenants.length"
            suffix="Tenants"
          />
          <div class="mt-2 text-xs text-gray-500">
            Workspace hoạt động:
            <span class="font-semibold text-blue-600">
              {{ activeTenant?.name || 'Nguyen Dinh Tu' }}
            </span>
          </div>
        </Card>
      </Col>
      <Col :xs="24" :sm="12" :lg="6">
        <Card :bordered="false" class="shadow-sm">
          <Statistic
            title="Plugin Hệ thống Cloud"
            :value="plugins.length"
            suffix="/ 6 Active"
          />
          <div class="mt-2 text-xs text-green-600">
            ✓ Core Kernel & Storage Sẵn sàng
          </div>
        </Card>
      </Col>
      <Col :xs="24" :sm="12" :lg="6">
        <Card :bordered="false" class="shadow-sm">
          <Statistic title="Specter Fleet Bridge" value="Sẵn Sàng" />
          <div class="mt-2 text-xs text-gray-500">
            Cổng SSO Loopback: <span class="font-mono">:8765</span>
          </div>
        </Card>
      </Col>
      <Col :xs="24" :sm="12" :lg="6">
        <Card :bordered="false" class="shadow-sm">
          <Statistic
            title="Quản trị viên Hệ thống"
            :value="userStore.userInfo?.realName || 'Nguyen Dinh Tu'"
          />
          <div class="mt-2 text-xs text-blue-500">
            Quyền hạn: Super Administrator
          </div>
        </Card>
      </Col>
    </Row>

    <!-- Main Multi-Tenant Tabs -->
    <Card :bordered="false" class="shadow-sm">
      <Tabs default-active-key="tenants">
        <!-- Tab 1: Tenants List -->
        <Tabs.TabPane key="tenants" tab="Danh sách Workspace (Tenants)">
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
                  <span class="font-medium text-gray-900 dark:text-gray-100">
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
                <span class="text-xs text-gray-500">
                  {{ formatDate(record.created_at) }}
                </span>
              </template>

              <!-- Actions column -->
              <template v-else-if="column.key === 'action'">
                <Space size="small">
                  <Button
                    size="small"
                    :type="record.id === activeTenantId ? 'dashed' : 'primary'"
                    @click="handleSelectTenant(record)"
                  >
                    {{
                      record.id === activeTenantId
                        ? 'Đang hoạt động'
                        : 'Chọn Workspace này'
                    }}
                  </Button>
                  <Button size="small" @click="handleConnectCli(record)">
                    Ghép nối CLI
                  </Button>
                </Space>
              </template>
            </template>
          </Table>
        </Tabs.TabPane>

        <!-- Tab 2: System Plugins -->
        <Tabs.TabPane key="plugins" tab="Hệ sinh thái Plugin Cloud">
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
                  <div class="font-medium">{{ record.name }}</div>
                  <div class="text-xs text-gray-400">
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
        </Tabs.TabPane>

        <!-- Tab 3: Specter Runners & Desktop Guide -->
        <Tabs.TabPane key="runners" tab="Máy trạm Specter CLI & Runners">
          <div class="max-w-2xl py-4">
            <Typography.Title :level="4">
              Hướng dẫn Ghép Nối Máy Trạm Specter CLI
            </Typography.Title>
            <Typography.Paragraph type="secondary">
              Specter CLI Daemon (`tuquet/cli`) kết nối máy trạm cục bộ với
              Tuquet Cloud thông qua Desktop SSO loopback.
            </Typography.Paragraph>

            <div
              class="my-4 rounded-lg bg-gray-900 p-4 font-mono text-sm text-green-400"
            >
              # Bước 1: Mở terminal trên máy trạm của bạn<br />
              tuquet login<br /><br />
              # Trình duyệt sẽ mở cổng Desktop Bridge:<br />
              https://admin.tuquet.com/auth/desktop
            </div>

            <Button type="primary" size="large" @click="handleConnectCli()">
              Mở Màn Hình Ghép Nối Desktop SSO Ngay
            </Button>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <!-- Create Tenant Modal -->
    <Modal
      v-model:open="isModalVisible"
      title="Tạo Workspace / Tổ chức Mới"
      :confirm-loading="creatingTenant"
      ok-text="Tạo Workspace"
      cancel-text="Hủy"
      @ok="handleCreateTenant"
    >
      <Form layout="vertical" class="mt-4">
        <Form.Item label="Tên Workspace / Tổ chức" required>
          <Input
            v-model:value="newTenantName"
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
            placeholder="Ví dụ: tuquet-tech"
          />
        </Form.Item>

        <Form.Item label="Gói dịch vụ (Subscription Tier)">
          <Select v-model:value="newTenantPlan">
            <Select.Option value="pro">Pro Plan (Mặc định)</Select.Option>
            <Select.Option value="free">Free Tier</Select.Option>
            <Select.Option value="enterprise">Enterprise Custom</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
