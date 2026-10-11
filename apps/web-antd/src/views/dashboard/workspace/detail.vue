<script lang="ts" setup>
import type { WorkspaceDetailData, WorkspaceMember } from '#/api';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Edit3,
  RefreshCw,
  Server,
  Settings,
  Terminal,
  Trash2,
  UserPlus,
  Users,
} from '@lucide/vue';
import {
  Avatar,
  Badge,
  Button,
  Input,
  message,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  getActiveTenantId,
  getWorkspaceDetailApi,
  inviteWorkspaceMemberApi,
  removeWorkspaceMemberApi,
  setActiveTenantId,
  updateWorkspaceInfoApi,
  updateWorkspaceMemberApi,
} from '#/api';

defineOptions({ name: 'WorkspaceDetail' });

const route = useRoute();
const router = useRouter();

const tenantId = computed(() => (route.params.id as string) || '');
const loading = ref(true);
const detailData = ref<null | WorkspaceDetailData>(null);
const copiedField = ref<null | string>(null);

// Invite modal
const isInviteModalVisible = ref(false);
const inviteEmail = ref('');
const inviteRole = ref<'admin' | 'developer' | 'member'>('developer');
const inviting = ref(false);

// Edit Member modal
const isEditMemberModalVisible = ref(false);
const editingMember = ref<null | WorkspaceMember>(null);
const editMemberFullName = ref('');
const editMemberRole = ref<
  'admin' | 'developer' | 'member' | 'owner' | 'viewer'
>('developer');
const editMemberStatus = ref<'active' | 'invited' | 'suspended'>('active');
const updatingMember = ref(false);

// Edit Workspace modal
const isEditWorkspaceModalVisible = ref(false);
const editWorkspaceName = ref('');
const editWorkspaceSlug = ref('');
const editWorkspacePlan = ref('pro');
const updatingWorkspace = ref(false);

// Active tenant state
const currentActiveTenantId = ref(getActiveTenantId());
const isCurrentActive = computed(
  () => currentActiveTenantId.value === tenantId.value,
);

async function loadData() {
  if (!tenantId.value) return;
  loading.value = true;
  try {
    const data = await getWorkspaceDetailApi(tenantId.value);
    detailData.value = data;
  } catch (error: any) {
    message.error(error.message || 'Không thể tải chi tiết Workspace');
  } finally {
    loading.value = false;
  }
}

function handleSetActive() {
  if (!detailData.value) return;
  setActiveTenantId(detailData.value.tenant.id);
  currentActiveTenantId.value = detailData.value.tenant.id;
  message.success(
    `Đã chọn ${detailData.value.tenant.name} làm Workspace hoạt động chính!`,
  );
}

function handleConnectCli() {
  if (!detailData.value) return;
  router.push(
    `/auth/desktop?machine_name=Local Workstation&tenant_id=${encodeURIComponent(detailData.value.tenant.id)}`,
  );
}

function copyToClipboard(text: string, fieldName: string) {
  navigator.clipboard.writeText(text);
  copiedField.value = fieldName;
  message.success(`Đã sao chép ${fieldName}`);
  setTimeout(() => {
    if (copiedField.value === fieldName) {
      copiedField.value = null;
    }
  }, 2000);
}

function openInviteModal() {
  inviteEmail.value = '';
  inviteRole.value = 'developer';
  isInviteModalVisible.value = true;
}

async function handleInviteSubmit() {
  if (!inviteEmail.value || !inviteEmail.value.includes('@')) {
    message.warning('Vui lòng nhập địa chỉ email hợp lệ');
    return;
  }

  inviting.value = true;
  try {
    await inviteWorkspaceMemberApi(
      tenantId.value,
      inviteEmail.value.trim(),
      inviteRole.value,
    );
    message.success(`Đã gửi lời mời tới ${inviteEmail.value}`);
    isInviteModalVisible.value = false;

    // Optimistically update list
    if (detailData.value) {
      detailData.value.members.push({
        avatar_url: null,
        email: inviteEmail.value.trim(),
        full_name: inviteEmail.value.split('@')[0],
        id: `inv-${Date.now()}`,
        joined_at: new Date().toISOString(),
        role: inviteRole.value,
        status: 'invited',
        user_id: 'pending',
      });
      detailData.value.quota.used_members = detailData.value.members.length;
    }
  } catch (error: any) {
    message.error(error.message || 'Gửi lời mời thất bại');
  } finally {
    inviting.value = false;
  }
}

async function handleRemoveMember(member: WorkspaceMember) {
  if (member.role === 'owner') {
    message.warning('Không thể xóa chủ sở hữu (Owner) của Workspace');
    return;
  }

  try {
    await removeWorkspaceMemberApi(member.id);
    message.success(`Đã xóa thành viên ${member.email}`);
    if (detailData.value) {
      detailData.value.members = detailData.value.members.filter(
        (m) => m.id !== member.id,
      );
      detailData.value.quota.used_members = detailData.value.members.length;
    }
  } catch (error: any) {
    message.error(error.message || 'Xóa thành viên thất bại');
  }
}

function openEditMemberModal(member: WorkspaceMember) {
  editingMember.value = member;
  editMemberFullName.value = member.full_name || '';
  editMemberRole.value = member.role;
  editMemberStatus.value = member.status;
  isEditMemberModalVisible.value = true;
}

async function handleUpdateMemberSubmit() {
  if (!editingMember.value) return;
  updatingMember.value = true;
  try {
    await updateWorkspaceMemberApi({
      full_name: editMemberFullName.value.trim(),
      memberId: editingMember.value.id,
      role: editMemberRole.value,
      status: editMemberStatus.value,
      userId: editingMember.value.user_id,
    });

    if (detailData.value) {
      const idx = detailData.value.members.findIndex(
        (m) => m.id === editingMember.value?.id,
      );
      if (idx !== -1) {
        const current = detailData.value.members[idx];
        if (current) {
          current.full_name = editMemberFullName.value.trim();
          current.role = editMemberRole.value;
          current.status = editMemberStatus.value;
        }
      }
    }
    message.success('Cập nhật thông tin thành viên thành công');
    isEditMemberModalVisible.value = false;
  } catch (error: any) {
    message.error(error.message || 'Cập nhật thành viên thất bại');
  } finally {
    updatingMember.value = false;
  }
}

function openEditWorkspaceModal() {
  if (!detailData.value) return;
  editWorkspaceName.value = detailData.value.tenant.name;
  editWorkspaceSlug.value = detailData.value.tenant.slug;
  editWorkspacePlan.value = detailData.value.tenant.metadata?.plan || 'pro';
  isEditWorkspaceModalVisible.value = true;
}

async function handleUpdateWorkspaceSubmit() {
  if (!editWorkspaceName.value.trim() || !editWorkspaceSlug.value.trim()) {
    message.warning('Vui lòng điền tên và slug Workspace');
    return;
  }
  updatingWorkspace.value = true;
  try {
    const updated = await updateWorkspaceInfoApi(tenantId.value, {
      name: editWorkspaceName.value.trim(),
      plan: editWorkspacePlan.value,
      slug: editWorkspaceSlug.value.trim(),
    });
    if (detailData.value) {
      detailData.value.tenant = updated;
    }
    message.success('Cập nhật Workspace thành công');
    isEditWorkspaceModalVisible.value = false;
  } catch (error: any) {
    message.error(error.message || 'Cập nhật Workspace thất bại');
  } finally {
    updatingWorkspace.value = false;
  }
}

// Table columns for members
const memberColumns = [
  {
    key: 'user',
    title: 'Thành Viên',
  },
  {
    dataIndex: 'email',
    key: 'email',
    title: 'Email',
  },
  {
    key: 'role',
    title: 'Vai Trò IAM',
  },
  {
    key: 'status',
    title: 'Trạng Thái',
  },
  {
    dataIndex: 'joined_at',
    key: 'joined_at',
    title: 'Ngày Tham Gia',
  },
  {
    key: 'actions',
    title: 'Thao Tác',
    width: 160,
  },
];

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getRoleColor(role: string) {
  switch (role) {
    case 'admin': {
      return 'blue';
    }
    case 'developer': {
      return 'cyan';
    }
    case 'owner': {
      return 'purple';
    }
    default: {
      return 'default';
    }
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="space-y-6 p-4 sm:p-6">
    <!-- Navigation Back Button -->
    <div>
      <Button
        type="link"
        class="flex items-center gap-1.5 p-0 text-muted-foreground hover:text-foreground"
        @click="router.push('/dashboard/workspace')"
      >
        <ArrowLeft class="size-4" />
        <span>Quay lại Danh sách Workspace</span>
      </Button>
    </div>

    <!-- Header Card: Shadcn Slate Style -->
    <div
      class="flex flex-col justify-between gap-4 rounded-xl border border-border/60 bg-card p-5 shadow-sm sm:flex-row sm:items-center"
    >
      <div class="space-y-1.5">
        <div class="flex flex-wrap items-center gap-2.5">
          <h1
            class="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            {{ detailData?.tenant.name || 'Workspace Detail' }}
          </h1>
          <Tag v-if="detailData?.tenant.slug" class="font-mono text-xs">
            {{ detailData.tenant.slug }}
          </Tag>
          <Tag
            v-if="detailData?.tenant.status"
            :color="
              detailData.tenant.status === 'active' ? 'success' : 'warning'
            "
            class="uppercase"
          >
            {{ detailData.tenant.status }}
          </Tag>
          <Badge
            v-if="isCurrentActive"
            status="processing"
            text="Workspace Đang Chọn"
            class="ml-1"
          />
        </div>
        <p class="text-xs text-muted-foreground sm:text-sm">
          ID:
          <span class="font-mono text-foreground/80">{{ tenantId }}</span>
          <Button
            type="text"
            size="small"
            class="ml-1 inline-flex size-6 items-center justify-center p-0"
            @click="copyToClipboard(tenantId, 'Tenant ID')"
          >
            <Check
              v-if="copiedField === 'Tenant ID'"
              class="size-3 text-green-500"
            />
            <Copy v-else class="size-3 text-muted-foreground" />
          </Button>
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <Button
          v-if="!isCurrentActive"
          type="primary"
          ghost
          class="flex items-center gap-1.5"
          @click="handleSetActive"
        >
          <CheckCircle2 class="size-4" />
          <span>Chọn Làm Việc</span>
        </Button>
        <Button
          type="primary"
          class="flex items-center gap-1.5"
          @click="handleConnectCli"
        >
          <Terminal class="size-4" />
          <span>Ghép Nối Specter CLI</span>
        </Button>
        <Button
          class="flex items-center gap-1.5"
          @click="openEditWorkspaceModal"
        >
          <Settings class="size-4" />
          <span class="hidden sm:inline">Cài Đặt</span>
        </Button>
        <Button
          class="flex items-center gap-1.5"
          :loading="loading"
          @click="loadData"
        >
          <RefreshCw class="size-4" />
          <span class="hidden sm:inline">Làm Mới</span>
        </Button>
      </div>
    </div>

    <!-- Quick Stats Grid: 4 Metric Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Metric 1: Members Count -->
      <div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Thành Viên</span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400"
          >
            <Users class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-bold tracking-tight text-foreground">
            {{ detailData?.quota.used_members || 1 }}
          </span>
          <span class="text-xs text-muted-foreground">
            / {{ detailData?.quota.max_members || 10 }} tối đa
          </span>
        </div>
        <div class="mt-2 text-xs text-emerald-500">IAM Role Based Access</div>
      </div>

      <!-- Metric 2: Plan Tier -->
      <div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Gói Dịch Vụ</span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400"
          >
            <CreditCard class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span
            class="text-2xl font-bold tracking-tight text-foreground uppercase"
          >
            {{ detailData?.tenant.metadata?.plan || 'PRO' }}
          </span>
        </div>
        <div class="mt-2 text-xs text-indigo-400">
          Đã kích hoạt tự động gia hạn
        </div>
      </div>

      <!-- Metric 3: Active Fleet Devices -->
      <div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Máy Trạm CLI</span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400"
          >
            <Server class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-bold tracking-tight text-foreground">
            {{ detailData?.quota.used_devices || 1 }}
          </span>
          <span class="text-xs text-muted-foreground">
            / {{ detailData?.quota.max_devices || 25 }} Nodes
          </span>
        </div>
        <div class="mt-2 text-xs text-amber-400">Specter Loopback :8765</div>
      </div>

      <!-- Metric 4: Created Date -->
      <div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Khởi Tạo</span>
          <span
            class="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"
          >
            <Calendar class="size-4.5" />
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-lg font-bold tracking-tight text-foreground">
            {{ formatDate(detailData?.tenant.created_at) }}
          </span>
        </div>
        <div class="mt-2 text-xs text-muted-foreground">
          Khu vực: ap-southeast-1
        </div>
      </div>
    </div>

    <!-- Main Workspace Tabs: Members, Resource Quotas, Settings -->
    <div class="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
      <Tabs default-active-key="members">
        <!-- Tab 1: Thành Viên & Quyền IAM -->
        <Tabs.TabPane key="members" tab="Thành Viên">
          <div class="space-y-4 pt-2">
            <!-- Action bar inside tab -->
            <div
              class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
            >
              <div>
                <h3 class="text-base font-semibold text-foreground">
                  Danh Sách Thành Viên ({{ detailData?.members.length || 0 }})
                </h3>
                <p class="text-xs text-muted-foreground">
                  Quản lý quyền truy cập và vai trò của các kỹ sư trong
                  Workspace này
                </p>
              </div>
              <Button
                type="primary"
                class="flex items-center justify-center gap-1.5"
                @click="openInviteModal"
              >
                <UserPlus class="size-4" />
                <span>Mời Thành Viên</span>
              </Button>
            </div>

            <!-- Desktop Table (md:block) -->
            <div class="hidden md:block">
              <Table
                :columns="memberColumns"
                :data-source="detailData?.members || []"
                :loading="loading"
                row-key="id"
                :pagination="false"
              >
                <template #bodyCell="{ column, record }">
                  <!-- User Column -->
                  <template v-if="column.key === 'user'">
                    <div class="flex items-center gap-2.5">
                      <Avatar
                        :src="record.avatar_url || undefined"
                        class="bg-sky-600 text-xs font-semibold text-white uppercase"
                      >
                        {{
                          (record.full_name || record.email || 'U').slice(0, 2)
                        }}
                      </Avatar>
                      <div>
                        <div class="font-medium text-foreground">
                          {{ record.full_name || 'Kỹ Sư Tuquet' }}
                        </div>
                        <div
                          v-if="record.role === 'owner'"
                          class="text-xs text-purple-400 font-medium"
                        >
                          Workspace Owner
                        </div>
                      </div>
                    </div>
                  </template>

                  <!-- Email Column -->
                  <template v-else-if="column.key === 'email'">
                    <span class="font-mono text-xs text-muted-foreground">
                      {{ record.email }}
                    </span>
                  </template>

                  <!-- Role Column -->
                  <template v-else-if="column.key === 'role'">
                    <Tag
                      :color="getRoleColor(record.role)"
                      class="uppercase font-medium"
                    >
                      {{ record.role }}
                    </Tag>
                  </template>

                  <!-- Status Column -->
                  <template v-else-if="column.key === 'status'">
                    <Badge
                      :status="
                        record.status === 'active' ? 'success' : 'warning'
                      "
                      :text="
                        record.status === 'active'
                          ? 'Hoạt động'
                          : 'Chờ chấp thuận'
                      "
                    />
                  </template>

                  <!-- Joined At Column -->
                  <template v-else-if="column.key === 'joined_at'">
                    <span class="text-xs text-muted-foreground">
                      {{ formatDate(record.joined_at) }}
                    </span>
                  </template>

                  <!-- Actions Column -->
                  <template v-else-if="column.key === 'actions'">
                    <Space size="small">
                      <Button
                        type="text"
                        size="small"
                        class="flex items-center gap-1 text-sky-400 hover:text-sky-300"
                        @click="openEditMemberModal(record as any)"
                      >
                        <Edit3 class="size-3.5" />
                        <span>Sửa</span>
                      </Button>
                      <Popconfirm
                        v-if="record.role !== 'owner'"
                        title="Bạn có chắc muốn xóa thành viên này?"
                        ok-text="Xóa"
                        cancel-text="Hủy"
                        @confirm="handleRemoveMember(record as any)"
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          class="flex items-center gap-1"
                        >
                          <Trash2 class="size-3.5" />
                          <span>Xóa</span>
                        </Button>
                      </Popconfirm>
                      <span v-else class="text-xs text-muted-foreground italic">
                        Owner
                      </span>
                    </Space>
                  </template>
                </template>
              </Table>
            </div>

            <!-- Mobile Touch Card View (block md:hidden) -->
            <div class="block space-y-3 md:hidden">
              <div
                v-for="member in detailData?.members || []"
                :key="member.id"
                class="rounded-lg border border-border/60 bg-card/60 p-4 shadow-sm"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2.5">
                    <Avatar
                      :src="member.avatar_url || undefined"
                      class="bg-sky-600 text-xs font-semibold text-white uppercase"
                    >
                      {{
                        (member.full_name || member.email || 'U').slice(0, 2)
                      }}
                    </Avatar>
                    <div>
                      <div class="font-medium text-foreground">
                        {{ member.full_name || 'Kỹ Sư Tuquet' }}
                      </div>
                      <div class="font-mono text-xs text-muted-foreground">
                        {{ member.email }}
                      </div>
                    </div>
                  </div>
                  <Tag
                    :color="getRoleColor(member.role)"
                    class="uppercase font-medium"
                  >
                    {{ member.role }}
                  </Tag>
                </div>

                <div
                  class="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs text-muted-foreground"
                >
                  <div>Tham gia: {{ formatDate(member.joined_at) }}</div>
                  <div class="flex items-center gap-3">
                    <Button
                      type="text"
                      size="small"
                      class="flex items-center gap-1 text-sky-400 p-0 text-xs"
                      @click="openEditMemberModal(member)"
                    >
                      <Edit3 class="size-3" />
                      <span>Sửa</span>
                    </Button>
                    <Popconfirm
                      v-if="member.role !== 'owner'"
                      title="Xóa thành viên này?"
                      ok-text="Xóa"
                      cancel-text="Hủy"
                      @confirm="handleRemoveMember(member)"
                    >
                      <Button
                        type="text"
                        danger
                        size="small"
                        class="p-0 text-xs"
                      >
                        Xóa
                      </Button>
                    </Popconfirm>
                    <span v-else class="text-purple-400 italic">Owner</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tabs.TabPane>

        <!-- Tab 2: Giới Hạn & Quota Tài Nguyên -->
        <Tabs.TabPane key="quotas" tab="Hạn Mức Quota">
          <div class="space-y-6 pt-2">
            <div>
              <h3 class="text-base font-semibold text-foreground">
                Định mức tài nguyên gói
                {{ detailData?.tenant.metadata?.plan || 'Pro' }}
              </h3>
              <p class="text-xs text-muted-foreground">
                Hạn mức sử dụng CPU Runners, bộ nhớ Cloud Storage và số lượng
                thành viên
              </p>
            </div>

            <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
              <!-- Quota 1: Members -->
              <div class="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-foreground">Thành Viên</span>
                  <span class="text-xs text-muted-foreground">
                    {{ detailData?.quota.used_members }} /
                    {{ detailData?.quota.max_members }}
                  </span>
                </div>
                <div class="mt-2">
                  <Progress
                    :percent="
                      Math.round(
                        ((detailData?.quota.used_members || 1) /
                          (detailData?.quota.max_members || 10)) *
                          100,
                      )
                    "
                    stroke-color="#38bdf8"
                  />
                </div>
                <div class="mt-1 text-xs text-muted-foreground">
                  Số lượng thành viên tối đa có thể tham gia Workspace
                </div>
              </div>

              <!-- Quota 2: Devices -->
              <div class="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-foreground">Máy Trạm & Runners</span>
                  <span class="text-xs text-muted-foreground">
                    {{ detailData?.quota.used_devices }} /
                    {{ detailData?.quota.max_devices }}
                  </span>
                </div>
                <div class="mt-2">
                  <Progress
                    :percent="
                      Math.round(
                        ((detailData?.quota.used_devices || 1) /
                          (detailData?.quota.max_devices || 25)) *
                          100,
                      )
                    "
                    stroke-color="#f59e0b"
                  />
                </div>
                <div class="mt-1 text-xs text-muted-foreground">
                  Số lượng máy trạm ghép nối Specter CLI đồng thời
                </div>
              </div>

              <!-- Quota 3: Storage -->
              <div class="rounded-xl border border-border/60 bg-muted/20 p-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-foreground">Cloud Storage</span>
                  <span class="text-xs text-muted-foreground">
                    {{
                      Math.round(
                        ((detailData?.quota.used_storage_mb || 0) / 1024) * 10,
                      ) / 10
                    }}
                    GB /
                    {{
                      Math.round(
                        (detailData?.quota.max_storage_mb || 10240) / 1024,
                      )
                    }}
                    GB
                  </span>
                </div>
                <div class="mt-2">
                  <Progress
                    :percent="
                      Math.round(
                        ((detailData?.quota.used_storage_mb || 100) /
                          (detailData?.quota.max_storage_mb || 10240)) *
                          100,
                      )
                    "
                    stroke-color="#10b981"
                  />
                </div>
                <div class="mt-1 text-xs text-muted-foreground">
                  Lưu trữ tệp assets, báo cáo logs và cấu hình automa
                </div>
              </div>
            </div>
          </div>
        </Tabs.TabPane>

        <!-- Tab 3: Cấu Hình & API Keys -->
        <Tabs.TabPane key="settings" tab="Cấu Hình & Keys">
          <div class="space-y-6 pt-2">
            <div>
              <h3 class="text-base font-semibold text-foreground">
                Thông Số Kỹ Thuật & Khóa Kết Nối
              </h3>
              <p class="text-xs text-muted-foreground">
                Sử dụng các thông số này để cấu hình Specter CLI và CI/CD
                Automation
              </p>
            </div>

            <div class="space-y-4 max-w-2xl">
              <!-- Field 1: Workspace ID -->
              <div class="rounded-lg border border-border/60 p-4">
                <label class="text-xs font-medium text-muted-foreground">WORKSPACE ID (TENANT ID)</label>
                <div class="mt-1 flex items-center justify-between gap-2">
                  <span class="font-mono text-sm text-foreground">{{
                    tenantId
                  }}</span>
                  <Button
                    size="small"
                    class="flex items-center gap-1"
                    @click="copyToClipboard(tenantId, 'Tenant ID')"
                  >
                    <Check
                      v-if="copiedField === 'Tenant ID'"
                      class="size-3.5 text-green-500"
                    />
                    <Copy v-else class="size-3.5" />
                    <span>Sao chép</span>
                  </Button>
                </div>
              </div>

              <!-- Field 2: Slug -->
              <div class="rounded-lg border border-border/60 p-4">
                <label class="text-xs font-medium text-muted-foreground">WORKSPACE SLUG</label>
                <div class="mt-1 flex items-center justify-between gap-2">
                  <span class="font-mono text-sm text-foreground">{{
                    detailData?.tenant.slug
                  }}</span>
                  <Button
                    size="small"
                    class="flex items-center gap-1"
                    @click="
                      copyToClipboard(detailData?.tenant.slug || '', 'Slug')
                    "
                  >
                    <Check
                      v-if="copiedField === 'Slug'"
                      class="size-3.5 text-green-500"
                    />
                    <Copy v-else class="size-3.5" />
                    <span>Sao chép</span>
                  </Button>
                </div>
              </div>

              <!-- Field 3: CLI Command snippet -->
              <div class="rounded-lg border border-border/60 bg-muted/30 p-4">
                <label class="text-xs font-medium text-muted-foreground">LỆNH KẾT NỐI SPECTER CLI TRỰC TIẾP</label>
                <div
                  class="mt-2 rounded bg-black/60 p-3 font-mono text-xs text-sky-300 flex items-center justify-between gap-2"
                >
                  <code>tuquet login --tenant-id={{ tenantId }}</code>
                  <Button
                    type="text"
                    size="small"
                    class="text-sky-300 hover:text-white p-0 size-6"
                    @click="
                      copyToClipboard(
                        `tuquet login --tenant-id=${tenantId}`,
                        'CLI Command',
                      )
                    "
                  >
                    <Check
                      v-if="copiedField === 'CLI Command'"
                      class="size-3.5 text-green-500"
                    />
                    <Copy v-else class="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>

    <!-- Modal Mời Thành Viên Mới -->
    <Modal
      v-model:open="isInviteModalVisible"
      title="Mời Thành Viên Vào Workspace"
      ok-text="Gửi Lời Mời"
      cancel-text="Hủy"
      :confirm-loading="inviting"
      @ok="handleInviteSubmit"
    >
      <div class="space-y-4 py-3">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Email Thành Viên
          </label>
          <Input
            v-model:value="inviteEmail"
            placeholder="dev@tuquet.com"
            size="large"
            type="email"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Vai Trò IAM (Phân Quyền)
          </label>
          <Select
            v-model:value="inviteRole"
            size="large"
            class="w-full"
            :options="[
              {
                label: 'Developer (Kỹ sư phát triển - Chạy Runner & Task)',
                value: 'developer',
              },
              {
                label: 'Admin (Quản trị viên - Quản lý thành viên & Quota)',
                value: 'admin',
              },
              {
                label: 'Member (Thành viên - Chỉ xem và đọc dữ liệu)',
                value: 'member',
              },
            ]"
          />
        </div>
      </div>
    </Modal>

    <!-- Modal Chỉnh Sửa Thông Tin Thành Viên -->
    <Modal
      v-model:open="isEditMemberModalVisible"
      title="Chỉnh Sửa Thông Tin Thành Viên"
      ok-text="Lưu Thay Đổi"
      cancel-text="Hủy"
      :confirm-loading="updatingMember"
      @ok="handleUpdateMemberSubmit"
    >
      <div class="space-y-4 py-3">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Họ và Tên
          </label>
          <Input
            v-model:value="editMemberFullName"
            placeholder="Nhập họ và tên thành viên"
            size="large"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Địa Chỉ Email
          </label>
          <Input :value="editingMember?.email" disabled size="large" />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Vai Trò IAM (Phân Quyền)
          </label>
          <Select
            v-model:value="editMemberRole"
            size="large"
            class="w-full"
            :options="[
              {
                label: 'Owner (Chủ sở hữu - Toàn quyền quản trị)',
                value: 'owner',
              },
              {
                label: 'Admin (Quản trị viên - Quản lý thành viên & Quota)',
                value: 'admin',
              },
              {
                label: 'Developer (Kỹ sư phát triển - Chạy CLI & Runners)',
                value: 'developer',
              },
              {
                label: 'Member (Thành viên - Xem và đọc dữ liệu)',
                value: 'member',
              },
            ]"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Trạng Thái Tài Khoản
          </label>
          <Select
            v-model:value="editMemberStatus"
            size="large"
            class="w-full"
            :options="[
              { label: 'Hoạt động (Active)', value: 'active' },
              { label: 'Tạm khóa (Suspended)', value: 'suspended' },
              { label: 'Chờ chấp thuận (Invited)', value: 'invited' },
            ]"
          />
        </div>
      </div>
    </Modal>

    <!-- Modal Cài Đặt & Chỉnh Sửa Workspace -->
    <Modal
      v-model:open="isEditWorkspaceModalVisible"
      title="Cài Đặt & Cập Nhật Workspace"
      ok-text="Cập Nhật"
      cancel-text="Hủy"
      :confirm-loading="updatingWorkspace"
      @ok="handleUpdateWorkspaceSubmit"
    >
      <div class="space-y-4 py-3">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Tên Workspace / Tổ Chức
          </label>
          <Input
            v-model:value="editWorkspaceName"
            placeholder="Ví dụ: Core Engineering"
            size="large"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Mã Slug (Định danh URL)
          </label>
          <Input
            v-model:value="editWorkspaceSlug"
            placeholder="core-eng"
            size="large"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1.5">
            Gói Dịch Vụ
          </label>
          <Select
            v-model:value="editWorkspacePlan"
            size="large"
            class="w-full"
            :options="[
              {
                label: 'Pro (25 Nodes, 10 Thành viên, 10 GB Storage)',
                value: 'pro',
              },
              {
                label: 'Enterprise (100 Nodes, 50 Thành viên, 50 GB Storage)',
                value: 'enterprise',
              },
              {
                label: 'Free (3 Nodes, 3 Thành viên, 1 GB Storage)',
                value: 'free',
              },
            ]"
          />
        </div>
      </div>
    </Modal>
  </div>
</template>
